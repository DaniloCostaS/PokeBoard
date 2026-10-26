-- =====================================================================
-- PokéBoard: proteção do banco (fase 1)
-- Salas novas (criadas com conta, host_user_id preenchido): só quem está na sala
-- (logado) grava nela; anônimo e visitante só leem.
-- Salas antigas (host_user_id nulo, criadas pelo cliente que ainda está no ar):
-- continuam como antes até o novo cliente ir para produção (fase 2 fecha).
-- =====================================================================

-- Sala gravável pelo usuário atual?
create or replace function public.pb_room_writable(p_room uuid) returns boolean
language sql stable security definer set search_path = public as $$
    select exists (
        select 1 from public.rooms r
        where r.id = p_room
          and (
              r.host_user_id is null
              or exists (select 1 from public.room_players rp where rp.room_id = r.id and rp.user_id = auth.uid())
          )
    );
$$;

-- Sala antiga (sem dono)? Só nelas vale inserir jogador/sala direto pela API
create or replace function public.pb_room_is_legacy(p_room uuid) returns boolean
language sql stable security definer set search_path = public as $$
    select exists (select 1 from public.rooms r where r.id = p_room and r.host_user_id is null);
$$;

create or replace function public.pb_player_writable(p_player uuid) returns boolean
language sql stable security definer set search_path = public as $$
    select public.pb_room_writable((select rp.room_id from public.room_players rp where rp.id = p_player));
$$;

revoke all on function public.pb_room_writable(uuid) from public;
revoke all on function public.pb_room_is_legacy(uuid) from public;
revoke all on function public.pb_player_writable(uuid) from public;
grant execute on function public.pb_room_writable(uuid) to anon, authenticated;
grant execute on function public.pb_room_is_legacy(uuid) to anon, authenticated;
grant execute on function public.pb_player_writable(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
-- rooms
-- ---------------------------------------------------------------------
drop policy if exists "rooms leitura" on public.rooms;
drop policy if exists "rooms insere" on public.rooms;
drop policy if exists "rooms edita" on public.rooms;
create policy "rooms leitura" on public.rooms for select using (true);
-- Direto pela API só nasce sala antiga; sala com dono nasce pelo create_room
create policy "rooms insere" on public.rooms for insert with check (host_user_id is null and has_password = false);
create policy "rooms edita" on public.rooms for update using (public.pb_room_writable(id)) with check (public.pb_room_writable(id));
-- Dono e senha não mudam pela API
revoke update on public.rooms from anon, authenticated;
grant update (status, map_size, current_turn, current_round, generations, legendaries_rule, megas_enabled,
              current_event_id, event_end_round, battle_active, alias, max_lives) on public.rooms to anon, authenticated;

-- ---------------------------------------------------------------------
-- room_players
-- ---------------------------------------------------------------------
drop policy if exists "public room_players" on public.room_players;
drop policy if exists "room_players leitura" on public.room_players;
drop policy if exists "room_players insere" on public.room_players;
drop policy if exists "room_players edita" on public.room_players;
drop policy if exists "room_players apaga" on public.room_players;
create policy "room_players leitura" on public.room_players for select using (true);
create policy "room_players insere" on public.room_players for insert with check (public.pb_room_is_legacy(room_id) and user_id is null);
create policy "room_players edita" on public.room_players for update using (public.pb_room_writable(room_id)) with check (public.pb_room_writable(room_id));
create policy "room_players apaga" on public.room_players for delete using (public.pb_room_writable(room_id));
-- Ninguém troca a conta dona de um jogador nem move jogador de sala
revoke update on public.room_players from anon, authenticated;
grant update (local_index, name, avatar, x, y, gold, skip_turns, badges_count, lives, cosmetics) on public.room_players to anon, authenticated;

-- ---------------------------------------------------------------------
-- Tabelas do jogador (dados de quem está na sala)
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
    foreach t in array array['player_pokemons','player_items','player_cards','player_badges','player_effects','player_stats','player_pokedex'] loop
        execute format('drop policy if exists %I on public.%I', 'public ' || t, t);
        execute format('drop policy if exists %I on public.%I', t || ' leitura', t);
        execute format('drop policy if exists %I on public.%I', t || ' grava', t);
        execute format('drop policy if exists %I on public.%I', t || ' edita', t);
        execute format('drop policy if exists %I on public.%I', t || ' apaga', t);
        execute format('create policy %I on public.%I for select using (true)', t || ' leitura', t);
        execute format('create policy %I on public.%I for insert with check (public.pb_player_writable(player_id))', t || ' grava', t);
        execute format('create policy %I on public.%I for update using (public.pb_player_writable(player_id)) with check (public.pb_player_writable(player_id))', t || ' edita', t);
        execute format('create policy %I on public.%I for delete using (public.pb_player_writable(player_id))', t || ' apaga', t);
    end loop;
end $$;

-- ---------------------------------------------------------------------
-- Tabelas da sala (tabuleiro, logs, lixeira...)
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
    foreach t in array array['room_map_tiles','room_active_gyms','room_gym_teams','room_logs','room_card_logs','room_battle_logs','room_discarded_pokemons','room_traps'] loop
        execute format('drop policy if exists %I on public.%I', 'public ' || t, t);
        execute format('drop policy if exists %I on public.%I', t || ' leitura', t);
        execute format('drop policy if exists %I on public.%I', t || ' grava', t);
        execute format('drop policy if exists %I on public.%I', t || ' edita', t);
        execute format('drop policy if exists %I on public.%I', t || ' apaga', t);
        execute format('create policy %I on public.%I for select using (true)', t || ' leitura', t);
        execute format('create policy %I on public.%I for insert with check (public.pb_room_writable(room_id))', t || ' grava', t);
        execute format('create policy %I on public.%I for update using (public.pb_room_writable(room_id)) with check (public.pb_room_writable(room_id))', t || ' edita', t);
        execute format('create policy %I on public.%I for delete using (public.pb_room_writable(room_id))', t || ' apaga', t);
    end loop;
end $$;

-- ---------------------------------------------------------------------
-- Compra na loja: em sala nova só o próprio jogador (ou alguém da sala) compra
-- ---------------------------------------------------------------------
create or replace function public.buy_item(p_player_id uuid, p_item_id character varying, p_cost integer, p_quantity integer)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
    v_current_gold int;
begin
    if not public.pb_player_writable(p_player_id) then raise exception 'not_room_member'; end if;
    if p_cost < 0 or p_quantity <= 0 or p_quantity > 99 then raise exception 'invalid_purchase'; end if;

    select gold into v_current_gold from public.room_players where id = p_player_id for update;
    if v_current_gold >= p_cost then
        update public.room_players set gold = gold - p_cost where id = p_player_id;
        insert into public.player_items (player_id, item_id, quantity)
        values (p_player_id, p_item_id, p_quantity)
        on conflict (player_id, item_id) do update set quantity = player_items.quantity + excluded.quantity;
        return true;
    end if;
    return false;
end $$;


-- Versão antiga que apontava para a tabela inexistente player_inventory (nenhum cliente usa)
drop function if exists public.buy_item(uuid, character varying, integer, integer, character varying);
