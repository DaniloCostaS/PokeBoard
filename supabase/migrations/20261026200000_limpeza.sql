-- =====================================================================
-- PokéBoard: limpeza do modo antigo
-- Remove salas sem dono (anteriores às contas), tabelas e coluna que o jogo
-- não usa mais, e o caminho legado de exclusão de sala.
-- =====================================================================

-- Salas antigas (sem conta dona): jogadores, Pokémon, itens, logs etc. saem em cascata
delete from public.rooms where host_user_id is null;

-- Armadilhas saíram do jogo; log de batalha por linha nunca foi usado
drop table if exists public.room_traps;
drop table if exists public.room_battle_logs;

-- Gravado mas nunca lido
alter table public.rooms drop column if exists battle_active;

-- Excluir sala: só a conta dona. p_host_player não é mais usado (fica só para o site já publicado não quebrar)
drop function if exists public.delete_room(uuid, uuid);
drop function if exists public.delete_room(uuid);
create or replace function public.delete_room(p_room uuid, p_host_player uuid default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_host uuid;
begin
    select host_user_id into v_host from public.rooms where id = p_room;
    if not found then return; end if;
    if v_host is null or v_host is distinct from auth.uid() then raise exception 'not_host'; end if;
    delete from public.rooms where id = p_room;
end $$;
revoke execute on function public.delete_room(uuid, uuid) from public, anon;
grant execute on function public.delete_room(uuid, uuid) to authenticated;

-- Só servia para salas antigas
drop function if exists public.pb_room_is_legacy(uuid);
