-- =====================================================================
-- PokéBoard: log de combate completo guardado na linha do log da partida
-- Quem lutou grava as linhas ao fim da batalha; qualquer jogador da sala
-- (ou quem recarregou a página) consegue abrir "Ver Log de Combate".
-- =====================================================================
alter table public.room_logs add column if not exists battle_lines jsonb;
create index if not exists room_logs_battle_idx on public.room_logs (room_id, battle_id) where battle_id is not null;
