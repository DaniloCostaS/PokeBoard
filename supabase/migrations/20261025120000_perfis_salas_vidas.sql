-- =====================================================================
-- PokéBoard: perfis (Auth), estatísticas, pokédex, conquistas, histórico,
-- vidas, senha de sala, exclusão de sala e ordem aleatória dos jogadores.
-- Tudo aditivo: o cliente já publicado continua funcionando.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PERFIS
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    username text not null,
    avatar text not null default 'Red.png',
    title text,
    frame text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint profiles_username_len check (char_length(username) between 3 and 15)
);
create unique index if not exists profiles_username_lower on public.profiles (lower(username));

alter table public.profiles enable row level security;
drop policy if exists "profiles leitura" on public.profiles;
create policy "profiles leitura" on public.profiles for select using (true);
drop policy if exists "profiles edita o proprio" on public.profiles;
create policy "profiles edita o proprio" on public.profiles for update to authenticated
    using (auth.uid() = id) with check (auth.uid() = id);

-- Cria o perfil junto com a conta (nome de treinador vem do metadata do signUp)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
    insert into public.profiles (id, username, avatar)
    values (
        new.id,
        coalesce(nullif(trim(new.raw_user_meta_data->>'username'), ''), 'Treinador' || substr(new.id::text, 1, 6)),
        coalesce(nullif(new.raw_user_meta_data->>'avatar', ''), 'Red.png')
    );
    insert into public.profile_stats (user_id) values (new.id) on conflict do nothing;
    return new;
end $$;

create or replace function public.username_available(p_username text) returns boolean
language sql stable security definer set search_path = public as $$
    select not exists (select 1 from public.profiles where lower(username) = lower(trim(p_username)));
$$;

-- ---------------------------------------------------------------------
-- 2. ESTATÍSTICAS ENTRE PARTIDAS (contadores em jsonb, somados no servidor)
-- ---------------------------------------------------------------------
create table if not exists public.profile_stats (
    user_id uuid primary key references public.profiles(id) on delete cascade,
    stats jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
);
alter table public.profile_stats enable row level security;
drop policy if exists "stats leitura" on public.profile_stats;
create policy "stats leitura" on public.profile_stats for select using (true);
drop policy if exists "stats insere o proprio" on public.profile_stats;
create policy "stats insere o proprio" on public.profile_stats for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "stats edita o proprio" on public.profile_stats;
create policy "stats edita o proprio" on public.profile_stats for update to authenticated
    using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
    for each row execute function public.handle_new_user();

-- Soma os números de p_delta aos contadores do usuário logado (atômico, sem corrida entre abas)
create or replace function public.profile_add_stats(p_delta jsonb) returns jsonb
language plpgsql security invoker set search_path = public as $$
declare
    v_uid uuid := auth.uid();
    v_stats jsonb;
    k text;
    v jsonb;
begin
    if v_uid is null then raise exception 'not_authenticated'; end if;
    insert into public.profile_stats (user_id) values (v_uid) on conflict do nothing;
    select stats into v_stats from public.profile_stats where user_id = v_uid for update;
    for k, v in select * from jsonb_each(coalesce(p_delta, '{}'::jsonb)) loop
        if jsonb_typeof(v) = 'number' and (v::text)::numeric between 0 and 1000000 then
            v_stats := jsonb_set(v_stats, array[k], to_jsonb(coalesce((v_stats->>k)::numeric, 0) + (v::text)::numeric));
        end if;
    end loop;
    update public.profile_stats set stats = v_stats, updated_at = now() where user_id = v_uid;
    return v_stats;
end $$;

-- ---------------------------------------------------------------------
-- 3. POKÉDEX DA CONTA (capturas acumuladas entre partidas)
-- ---------------------------------------------------------------------
create table if not exists public.profile_pokedex (
    user_id uuid not null references public.profiles(id) on delete cascade,
    pokemon_id integer not null,
    caught integer not null default 0,
    shiny_caught integer not null default 0,
    first_caught_at timestamptz not null default now(),
    primary key (user_id, pokemon_id)
);
alter table public.profile_pokedex enable row level security;
drop policy if exists "pokedex leitura" on public.profile_pokedex;
create policy "pokedex leitura" on public.profile_pokedex for select using (true);
drop policy if exists "pokedex insere o proprio" on public.profile_pokedex;
create policy "pokedex insere o proprio" on public.profile_pokedex for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "pokedex edita o proprio" on public.profile_pokedex;
create policy "pokedex edita o proprio" on public.profile_pokedex for update to authenticated
    using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- p_catches: [{ "id": 25, "shiny": false }, ...]
create or replace function public.profile_register_catches(p_catches jsonb) returns void
language plpgsql security invoker set search_path = public as $$
declare
    v_uid uuid := auth.uid();
    c jsonb;
begin
    if v_uid is null then raise exception 'not_authenticated'; end if;
    for c in select * from jsonb_array_elements(coalesce(p_catches, '[]'::jsonb)) loop
        if (c->>'id') is null then continue; end if;
        insert into public.profile_pokedex as pd (user_id, pokemon_id, caught, shiny_caught)
        values (v_uid, (c->>'id')::int, 1, case when (c->>'shiny')::boolean then 1 else 0 end)
        on conflict (user_id, pokemon_id) do update
            set caught = pd.caught + 1,
                shiny_caught = pd.shiny_caught + excluded.shiny_caught;
    end loop;
end $$;

-- ---------------------------------------------------------------------
-- 4. CONQUISTAS E HISTÓRICO DE PARTIDAS
-- ---------------------------------------------------------------------
create table if not exists public.profile_achievements (
    user_id uuid not null references public.profiles(id) on delete cascade,
    achievement_id text not null,
    unlocked_at timestamptz not null default now(),
    primary key (user_id, achievement_id)
);
alter table public.profile_achievements enable row level security;
drop policy if exists "conquistas leitura" on public.profile_achievements;
create policy "conquistas leitura" on public.profile_achievements for select using (true);
drop policy if exists "conquistas insere a propria" on public.profile_achievements;
create policy "conquistas insere a propria" on public.profile_achievements for insert to authenticated with check (auth.uid() = user_id);

create table if not exists public.match_history (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    room_id uuid,
    room_alias text,
    won boolean not null default false,
    rounds integer,
    badges integer,
    players integer,
    team jsonb,
    finished_at timestamptz not null default now()
);
create index if not exists match_history_user on public.match_history (user_id, finished_at desc);
create unique index if not exists match_history_once on public.match_history (user_id, room_id) where room_id is not null;
alter table public.match_history enable row level security;
drop policy if exists "historico leitura" on public.match_history;
create policy "historico leitura" on public.match_history for select using (true);
drop policy if exists "historico insere o proprio" on public.match_history;
create policy "historico insere o proprio" on public.match_history for insert to authenticated with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 5. SALAS: vidas, dono, senha, cosméticos
-- ---------------------------------------------------------------------
alter table public.rooms add column if not exists max_lives smallint not null default 3;
alter table public.rooms add column if not exists has_password boolean not null default false;
alter table public.rooms add column if not exists host_user_id uuid references auth.users(id) on delete set null;

alter table public.room_players add column if not exists lives smallint;
alter table public.room_players add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.room_players add column if not exists cosmetics jsonb;
create index if not exists room_players_user on public.room_players (user_id);

-- Hash da senha fica numa tabela sem nenhuma policy: anon/authenticated não leem nem escrevem
create table if not exists public.room_secrets (
    room_id uuid primary key references public.rooms(id) on delete cascade,
    password_hash text not null
);
alter table public.room_secrets enable row level security;
revoke all on public.room_secrets from anon, authenticated;

-- Sala com senha: só entra jogador novo pelo join_room (que confere a senha)
create or replace function public.guard_room_password() returns trigger
language plpgsql security definer set search_path = public as $$
begin
    if exists (select 1 from public.room_secrets s where s.room_id = new.room_id)
       and coalesce(current_setting('pokeboard.join_ok', true), '') <> 'on' then
        raise exception 'room_password_required' using errcode = 'P0001';
    end if;
    return new;
end $$;
drop trigger if exists room_players_password_guard on public.room_players;
create trigger room_players_password_guard before insert on public.room_players
    for each row execute function public.guard_room_password();

-- Cria sala (+ senha opcional) e o host numa transação só
create or replace function public.create_room(
    p_alias text, p_map_size int, p_generations int[], p_legendaries text, p_megas boolean,
    p_max_lives int, p_password text, p_name text, p_avatar text, p_gold int, p_cosmetics jsonb default null
) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
    v_uid uuid := auth.uid();
    v_room public.rooms;
    v_player_id uuid;
    v_has_pw boolean := coalesce(length(p_password), 0) > 0;
begin
    if v_uid is null then raise exception 'not_authenticated'; end if;
    if coalesce(trim(p_alias), '') = '' or char_length(p_alias) > 20 then raise exception 'invalid_alias'; end if;
    if v_has_pw and char_length(p_password) > 64 then raise exception 'invalid_password'; end if;

    insert into public.rooms (status, alias, map_size, generations, legendaries_rule, megas_enabled, max_lives, has_password, host_user_id)
    values ('waiting', trim(p_alias), p_map_size, p_generations, p_legendaries, p_megas, greatest(0, least(coalesce(p_max_lives, 3), 9)), v_has_pw, v_uid)
    returning * into v_room;

    if v_has_pw then
        insert into public.room_secrets (room_id, password_hash) values (v_room.id, crypt(p_password, gen_salt('bf')));
    end if;

    perform set_config('pokeboard.join_ok', 'on', true);
    insert into public.room_players (room_id, local_index, name, avatar, gold, x, y, user_id, lives, cosmetics)
    values (v_room.id, 0, p_name, p_avatar, p_gold, 0, 0, v_uid, nullif(v_room.max_lives, 0), p_cosmetics)
    returning id into v_player_id;
    perform set_config('pokeboard.join_ok', '', true);

    return jsonb_build_object('room', to_jsonb(v_room), 'player_id', v_player_id);
end $$;

-- Entra numa sala em espera (confere senha, vaga e índice livre no servidor)
create or replace function public.join_room(
    p_room uuid, p_password text, p_name text, p_avatar text, p_gold int, p_cosmetics jsonb default null
) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
    v_uid uuid := auth.uid();
    v_room public.rooms;
    v_hash text;
    v_idx int;
    v_player_id uuid;
begin
    select * into v_room from public.rooms where id = p_room for update;
    if not found then raise exception 'room_not_found'; end if;
    if v_room.status <> 'waiting' then raise exception 'room_not_waiting'; end if;

    select password_hash into v_hash from public.room_secrets where room_id = p_room;
    if v_hash is not null and (p_password is null or crypt(p_password, v_hash) <> v_hash) then
        raise exception 'wrong_password';
    end if;

    if (select count(*) from public.room_players where room_id = p_room) >= 8 then raise exception 'room_full'; end if;
    select coalesce(max(local_index), -1) + 1 into v_idx from public.room_players where room_id = p_room;

    perform set_config('pokeboard.join_ok', 'on', true);
    insert into public.room_players (room_id, local_index, name, avatar, gold, x, y, user_id, lives, cosmetics)
    values (p_room, v_idx, p_name, p_avatar, p_gold, 0, 0, v_uid, nullif(v_room.max_lives, 0), p_cosmetics)
    returning id into v_player_id;
    perform set_config('pokeboard.join_ok', '', true);

    return jsonb_build_object('player_id', v_player_id, 'local_index', v_idx);
end $$;

-- Só confere a senha (para mostrar erro antes de qualquer coisa)
create or replace function public.check_room_password(p_room uuid, p_password text) returns boolean
language plpgsql stable security definer set search_path = public, extensions as $$
declare v_hash text;
begin
    select password_hash into v_hash from public.room_secrets where room_id = p_room;
    if v_hash is null then return true; end if;
    return p_password is not null and crypt(p_password, v_hash) = v_hash;
end $$;

-- Ordem de jogo aleatória ao iniciar (independe de quem entrou primeiro)
create or replace function public.shuffle_room_order(p_room uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_room public.rooms;
begin
    select * into v_room from public.rooms where id = p_room for update;
    if not found or v_room.status <> 'waiting' then raise exception 'room_not_waiting'; end if;
    if v_room.host_user_id is not null and v_room.host_user_id is distinct from auth.uid() then raise exception 'not_host'; end if;
    update public.room_players set local_index = local_index + 100 where room_id = p_room;
    with ordem as (
        select id, row_number() over (order by random()) - 1 as novo from public.room_players where room_id = p_room
    )
    update public.room_players rp set local_index = ordem.novo from ordem where rp.id = ordem.id;
end $$;

-- Excluir sala: só o host (conta dona; em sala antiga sem dono, quem tem o id do jogador 0)
create or replace function public.delete_room(p_room uuid, p_host_player uuid default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_room public.rooms;
begin
    select * into v_room from public.rooms where id = p_room;
    if not found then return; end if;
    if v_room.host_user_id is not null then
        if v_room.host_user_id is distinct from auth.uid() then raise exception 'not_host'; end if;
    elsif not exists (select 1 from public.room_players where room_id = p_room and id = p_host_player and local_index = 0) then
        raise exception 'not_host';
    end if;
    delete from public.rooms where id = p_room;
end $$;

-- Apagar sala direto pela API deixa de ser possível (nenhum cliente fazia isso); só via delete_room
drop policy if exists "public rooms" on public.rooms;
drop policy if exists "rooms leitura" on public.rooms;
drop policy if exists "rooms insere" on public.rooms;
drop policy if exists "rooms edita" on public.rooms;
create policy "rooms leitura" on public.rooms for select using (true);
create policy "rooms insere" on public.rooms for insert with check (true);
create policy "rooms edita" on public.rooms for update using (true) with check (true);

-- Funções expostas
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.guard_room_password() from public, anon, authenticated;
grant execute on function public.username_available(text) to anon, authenticated;
grant execute on function public.profile_add_stats(jsonb) to authenticated;
grant execute on function public.profile_register_catches(jsonb) to authenticated;
grant execute on function public.create_room(text, int, int[], text, boolean, int, text, text, text, int, jsonb) to authenticated;
grant execute on function public.join_room(uuid, text, text, text, int, jsonb) to authenticated;
grant execute on function public.check_room_password(uuid, text) to anon, authenticated;
grant execute on function public.shuffle_room_order(uuid) to authenticated;
grant execute on function public.delete_room(uuid, uuid) to anon, authenticated;
