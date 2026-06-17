-- Script para limpar todas as tabelas do banco de dados (Reset Geral)
-- CUIDADO: Isso vai apagar todos os dados de todas as salas, jogadores, logs e globais.

TRUNCATE TABLE 
    room_card_logs,
    room_logs,
    player_pokedex,
    player_stats,
    player_effects,
    player_quests,
    player_badges,
    player_items,
    player_cards,
    player_team,
    room_players,
    global_champion_team,
    global_champion,
    room_gym_teams,
    room_active_gyms,
    room_map_tiles,
    rooms
RESTART IDENTITY CASCADE;
