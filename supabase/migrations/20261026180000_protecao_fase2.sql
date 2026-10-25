-- =====================================================================
-- PokéBoard: proteção do banco (fase 2) — aplicar JUNTO com o deploy do cliente novo
-- Fecha o modo antigo: sala sem dono vira só leitura, nada nasce direto pela API,
-- campeão global só é gravado por quem está logado.
-- =====================================================================

-- Só quem está na sala (logado) grava; sala antiga sem dono fica só leitura
create or replace function public.pb_room_writable(p_room uuid) returns boolean
language sql stable security definer set search_path = public as $$
    select auth.uid() is not null and exists (
        select 1 from public.room_players rp where rp.room_id = p_room and rp.user_id = auth.uid()
    );
$$;

-- Sala e jogador só nascem pelas funções create_room / join_room
drop policy if exists "rooms insere" on public.rooms;
drop policy if exists "room_players insere" on public.room_players;

-- Anônimo não grava nada em sala
revoke update on public.rooms from anon;
revoke update on public.room_players from anon;

-- Campeão global: leitura aberta, gravação só logado
drop policy if exists "public global_champion" on public.global_champion;
drop policy if exists "public global_champion_team" on public.global_champion_team;
drop policy if exists "campeao leitura" on public.global_champion;
drop policy if exists "campeao grava" on public.global_champion;
drop policy if exists "campeao time leitura" on public.global_champion_team;
drop policy if exists "campeao time grava" on public.global_champion_team;
create policy "campeao leitura" on public.global_champion for select using (true);
create policy "campeao grava" on public.global_champion for all to authenticated using (true) with check (true);
create policy "campeao time leitura" on public.global_champion_team for select using (true);
create policy "campeao time grava" on public.global_champion_team for all to authenticated using (true) with check (true);

-- Excluir sala: só a conta dona (sala antiga sem dono não é mais excluível pela API)
create or replace function public.delete_room(p_room uuid, p_host_player uuid default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_room public.rooms;
begin
    select * into v_room from public.rooms where id = p_room;
    if not found then return; end if;
    if v_room.host_user_id is null or v_room.host_user_id is distinct from auth.uid() then raise exception 'not_host'; end if;
    delete from public.rooms where id = p_room;
end $$;
revoke execute on function public.delete_room(uuid, uuid) from public, anon;
grant execute on function public.delete_room(uuid, uuid) to authenticated;

-- Entrar em sala exige conta
revoke execute on function public.join_room(uuid, text, text, text, int, jsonb) from public, anon;
grant execute on function public.join_room(uuid, text, text, text, int, jsonb) to authenticated;
-- Mesmo cuidado com as outras funções que exigem conta
revoke execute on function public.create_room(text, int, int[], text, boolean, int, text, text, text, int, jsonb) from public, anon;
revoke execute on function public.shuffle_room_order(uuid) from public, anon;
revoke execute on function public.profile_add_stats(jsonb) from public, anon;
revoke execute on function public.profile_register_catches(jsonb) from public, anon;
revoke execute on function public.buy_item(uuid, character varying, integer, integer) from public, anon;
grant execute on function public.buy_item(uuid, character varying, integer, integer) to authenticated;
