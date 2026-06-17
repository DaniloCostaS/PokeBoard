CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status VARCHAR(50) DEFAULT 'waiting',
    map_size INT DEFAULT 20,
    current_turn INT DEFAULT 0,
    current_round INT DEFAULT 1,
    generations INT[] DEFAULT ARRAY[1,2,3,4,5,6,7,8,9],
    legendaries_rule VARCHAR(10) DEFAULT 'yes',
    megas_enabled BOOLEAN DEFAULT TRUE,
    current_event_id VARCHAR(80),
    event_end_round INT DEFAULT 0,
    battle_active BOOLEAN DEFAULT FALSE,
    alias VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'waiting';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS map_size INT DEFAULT 20;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS current_turn INT DEFAULT 0;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS current_round INT DEFAULT 1;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS generations INT[] DEFAULT ARRAY[1,2,3,4,5,6,7,8,9];
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS legendaries_rule VARCHAR(10) DEFAULT 'yes';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS megas_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS current_event_id VARCHAR(80);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS event_end_round INT DEFAULT 0;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS battle_active BOOLEAN DEFAULT FALSE;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS alias VARCHAR(255) UNIQUE;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE TABLE IF NOT EXISTS room_map_tiles (
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    x INT NOT NULL,
    y INT NOT NULL,
    tile_type INT NOT NULL,
    gym_id INT,
    PRIMARY KEY (room_id, x, y)
);

CREATE TABLE IF NOT EXISTS room_active_gyms (
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    badge_index INT NOT NULL,
    gym_id INT NOT NULL,
    PRIMARY KEY (room_id, badge_index)
);

CREATE TABLE IF NOT EXISTS room_gym_teams (
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    gym_id INT NOT NULL,
    slot_index INT NOT NULL,
    pokemon_id INT NOT NULL,
    PRIMARY KEY (room_id, gym_id, slot_index)
);

CREATE TABLE IF NOT EXISTS global_champion (
    id INT PRIMARY KEY DEFAULT 1,
    name VARCHAR(255),
    avatar VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE global_champion ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE global_champion ADD COLUMN IF NOT EXISTS avatar VARCHAR(255);
ALTER TABLE global_champion ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE TABLE IF NOT EXISTS global_champion_team (
    champion_id INT REFERENCES global_champion(id) ON DELETE CASCADE,
    slot_index INT NOT NULL,
    pokemon_id INT NOT NULL,
    level INT DEFAULT 1,
    is_shiny BOOLEAN DEFAULT FALSE,
    current_hp INT,
    max_hp INT,
    current_xp INT DEFAULT 0,
    max_xp INT DEFAULT 100,
    held_item VARCHAR(80),
    mega_stone BOOLEAN DEFAULT FALSE,
    base_total INT DEFAULT 0,
    PRIMARY KEY (champion_id, slot_index)
);

CREATE TABLE IF NOT EXISTS room_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    local_index INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar VARCHAR(255),
    x INT DEFAULT 0,
    y INT DEFAULT 0,
    gold INT DEFAULT 500,
    skip_turns INT DEFAULT 0,
    badges_count INT DEFAULT 0
);

ALTER TABLE room_players ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id) ON DELETE CASCADE;
ALTER TABLE room_players ADD COLUMN IF NOT EXISTS local_index INT;
ALTER TABLE room_players ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE room_players ADD COLUMN IF NOT EXISTS avatar VARCHAR(255);
ALTER TABLE room_players ADD COLUMN IF NOT EXISTS x INT DEFAULT 0;
ALTER TABLE room_players ADD COLUMN IF NOT EXISTS y INT DEFAULT 0;
ALTER TABLE room_players ADD COLUMN IF NOT EXISTS gold INT DEFAULT 500;
ALTER TABLE room_players ADD COLUMN IF NOT EXISTS skip_turns INT DEFAULT 0;
ALTER TABLE room_players ADD COLUMN IF NOT EXISTS badges_count INT DEFAULT 0;
ALTER TABLE room_players ADD CONSTRAINT room_players_room_local_unique UNIQUE (room_id, local_index);

CREATE TABLE IF NOT EXISTS player_pokemons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES room_players(id) ON DELETE CASCADE,
    slot_index INT DEFAULT 0,
    pokemon_id INT NOT NULL,
    name VARCHAR(255),
    current_hp INT,
    max_hp INT,
    level INT DEFAULT 1,
    current_xp INT DEFAULT 0,
    max_xp INT DEFAULT 100,
    is_shiny BOOLEAN DEFAULT FALSE,
    is_fainted BOOLEAN DEFAULT FALSE,
    held_item VARCHAR(80),
    mega_stone BOOLEAN DEFAULT FALSE,
    base_total INT DEFAULT 0,
    atk INT DEFAULT 0,
    def INT DEFAULT 0,
    speed INT DEFAULT 0,
    stage INT DEFAULT 1,
    happiness INT DEFAULT 0,
    mastery_bonus INT DEFAULT 0,
    vinculo_supremo BOOLEAN DEFAULT FALSE,
    is_legendary BOOLEAN DEFAULT FALSE,
    type_name VARCHAR(80),
    second_type_name VARCHAR(80),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE player_pokemons ADD COLUMN IF NOT EXISTS player_id UUID REFERENCES room_players(id) ON DELETE CASCADE;
ALTER TABLE player_pokemons ADD COLUMN IF NOT EXISTS slot_index INT DEFAULT 0;
ALTER TABLE player_pokemons ADD COLUMN IF NOT EXISTS pokemon_id INT;
ALTER TABLE player_pokemons ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE player_pokemons ADD COLUMN IF NOT EXISTS current_hp INT;
ALTER TABLE player_pokemons ADD COLUMN IF NOT EXISTS max_hp INT;
ALTER TABLE player_pokemons ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;
ALTER TABLE player_pokemons ADD COLUMN IF NOT EXISTS current_xp INT DEFAULT 0;
ALTER TABLE player_pokemons ADD COLUMN IF NOT EXISTS max_xp INT DEFAULT 100;
ALTER TABLE player_pokemons ADD COLUMN IF NOT EXISTS is_shiny BOOLEAN DEFAULT FALSE;
ALTER TABLE player_pokemons ADD COLUMN IF NOT EXISTS is_fainted BOOLEAN DEFAULT FALSE;
ALTER TABLE player_pokemons ADD COLUMN IF NOT EXISTS held_item VARCHAR(80);
ALTER TABLE player_pokemons ADD COLUMN IF NOT EXISTS mega_stone BOOLEAN DEFAULT FALSE;
ALTER TABLE player_pokemons ADD COLUMN IF NOT EXISTS base_total INT DEFAULT 0;
ALTER TABLE player_pokemons ADD COLUMN IF NOT EXISTS atk INT DEFAULT 0;
ALTER TABLE player_pokemons ADD COLUMN IF NOT EXISTS def INT DEFAULT 0;
ALTER TABLE player_pokemons ADD COLUMN IF NOT EXISTS speed INT DEFAULT 0;
ALTER TABLE player_pokemons ADD COLUMN IF NOT EXISTS stage INT DEFAULT 1;
ALTER TABLE player_pokemons ADD COLUMN IF NOT EXISTS happiness INT DEFAULT 0;
ALTER TABLE player_pokemons ADD COLUMN IF NOT EXISTS mastery_bonus INT DEFAULT 0;
ALTER TABLE player_pokemons ADD COLUMN IF NOT EXISTS vinculo_supremo BOOLEAN DEFAULT FALSE;
ALTER TABLE player_pokemons ADD COLUMN IF NOT EXISTS is_legendary BOOLEAN DEFAULT FALSE;
ALTER TABLE player_pokemons ADD COLUMN IF NOT EXISTS type_name VARCHAR(80);
ALTER TABLE player_pokemons ADD COLUMN IF NOT EXISTS second_type_name VARCHAR(80);
ALTER TABLE player_pokemons ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE player_pokemons ADD CONSTRAINT player_pokemons_player_slot_unique UNIQUE (player_id, slot_index);

CREATE TABLE IF NOT EXISTS player_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES room_players(id) ON DELETE CASCADE,
    item_id VARCHAR(100) NOT NULL,
    quantity INT DEFAULT 1
);

ALTER TABLE player_items ADD COLUMN IF NOT EXISTS player_id UUID REFERENCES room_players(id) ON DELETE CASCADE;
ALTER TABLE player_items ADD COLUMN IF NOT EXISTS item_id VARCHAR(100);
ALTER TABLE player_items ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1;
ALTER TABLE player_items ADD CONSTRAINT player_items_player_item_unique UNIQUE (player_id, item_id);

CREATE TABLE IF NOT EXISTS player_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES room_players(id) ON DELETE CASCADE,
    hand_index INT DEFAULT 0,
    card_id VARCHAR(100) NOT NULL,
    is_protected BOOLEAN DEFAULT FALSE
);

ALTER TABLE player_cards ADD COLUMN IF NOT EXISTS player_id UUID REFERENCES room_players(id) ON DELETE CASCADE;
ALTER TABLE player_cards ADD COLUMN IF NOT EXISTS hand_index INT DEFAULT 0;
ALTER TABLE player_cards ADD COLUMN IF NOT EXISTS card_id VARCHAR(100);
ALTER TABLE player_cards ADD COLUMN IF NOT EXISTS is_protected BOOLEAN DEFAULT FALSE;

UPDATE player_cards
SET hand_index = 0
WHERE hand_index IS NULL;

DELETE FROM player_cards a
USING player_cards b
WHERE a.player_id = b.player_id
  AND a.hand_index = b.hand_index
  AND a.ctid < b.ctid;

ALTER TABLE player_cards ADD CONSTRAINT player_cards_player_hand_unique UNIQUE (player_id, hand_index);

CREATE TABLE IF NOT EXISTS player_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES room_players(id) ON DELETE CASCADE,
    gym_id INT NOT NULL
);

ALTER TABLE player_badges ADD COLUMN IF NOT EXISTS player_id UUID REFERENCES room_players(id) ON DELETE CASCADE;
ALTER TABLE player_badges ADD COLUMN IF NOT EXISTS gym_id INT;
ALTER TABLE player_badges ADD CONSTRAINT player_badges_player_gym_unique UNIQUE (player_id, gym_id);

CREATE TABLE IF NOT EXISTS player_effects (
    player_id UUID REFERENCES room_players(id) ON DELETE CASCADE,
    key VARCHAR(160) NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (player_id, key)
);

CREATE TABLE IF NOT EXISTS player_stats (
    player_id UUID REFERENCES room_players(id) ON DELETE CASCADE,
    key VARCHAR(160) NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (player_id, key)
);

CREATE TABLE IF NOT EXISTS player_pokedex (
    player_id UUID REFERENCES room_players(id) ON DELETE CASCADE,
    pokemon_id INT NOT NULL,
    seen INT DEFAULT 0,
    caught INT DEFAULT 0,
    defeated INT DEFAULT 0,
    PRIMARY KEY (player_id, pokemon_id)
);

CREATE TABLE IF NOT EXISTS room_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    message TEXT,
    log_text TEXT,
    style TEXT,
    log_type VARCHAR(80) DEFAULT 'system',
    battle_id VARCHAR(120),
    action_player_id INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE room_logs ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id) ON DELETE CASCADE;
ALTER TABLE room_logs ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE room_logs ADD COLUMN IF NOT EXISTS log_text TEXT;
ALTER TABLE room_logs ADD COLUMN IF NOT EXISTS style VARCHAR(80);
ALTER TABLE room_logs ADD COLUMN IF NOT EXISTS log_type VARCHAR(80) DEFAULT 'system';
ALTER TABLE room_logs ADD COLUMN IF NOT EXISTS battle_id VARCHAR(120);
ALTER TABLE room_logs ADD COLUMN IF NOT EXISTS action_player_id INT;
ALTER TABLE room_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE room_logs ALTER COLUMN message DROP NOT NULL;
ALTER TABLE room_logs ALTER COLUMN log_text DROP NOT NULL;

CREATE TABLE IF NOT EXISTS room_card_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    round INT NOT NULL,
    attacker_name VARCHAR(255) NOT NULL,
    card_name VARCHAR(255) NOT NULL,
    target_name VARCHAR(255) NOT NULL,
    happened_at_ms BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS room_battle_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    battle_id VARCHAR(120) NOT NULL,
    line_index INT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE room_battle_logs ADD CONSTRAINT room_battle_logs_room_battle_line_unique UNIQUE (room_id, battle_id, line_index);

CREATE TABLE IF NOT EXISTS room_traps (
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    x INT NOT NULL,
    y INT NOT NULL,
    owner_local_index INT NOT NULL,
    PRIMARY KEY (room_id, x, y, owner_local_index)
);

CREATE TABLE IF NOT EXISTS room_discarded_pokemons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    slot_index INT DEFAULT 0,
    pokemon_id INT NOT NULL,
    name VARCHAR(255),
    current_hp INT,
    max_hp INT,
    level INT DEFAULT 1,
    current_xp INT DEFAULT 0,
    max_xp INT DEFAULT 100,
    is_shiny BOOLEAN DEFAULT FALSE,
    is_fainted BOOLEAN DEFAULT FALSE,
    held_item VARCHAR(80),
    mega_stone BOOLEAN DEFAULT FALSE,
    base_total INT DEFAULT 0,
    atk INT DEFAULT 0,
    def INT DEFAULT 0,
    speed INT DEFAULT 0,
    stage INT DEFAULT 1,
    happiness INT DEFAULT 0,
    mastery_bonus INT DEFAULT 0,
    vinculo_supremo BOOLEAN DEFAULT FALSE,
    is_legendary BOOLEAN DEFAULT FALSE,
    type_name VARCHAR(80),
    second_type_name VARCHAR(80)
);

ALTER TABLE room_discarded_pokemons ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id) ON DELETE CASCADE;
ALTER TABLE room_discarded_pokemons ADD COLUMN IF NOT EXISTS slot_index INT DEFAULT 0;
ALTER TABLE room_discarded_pokemons ADD COLUMN IF NOT EXISTS pokemon_id INT;
ALTER TABLE room_discarded_pokemons ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE room_discarded_pokemons ADD COLUMN IF NOT EXISTS current_hp INT;
ALTER TABLE room_discarded_pokemons ADD COLUMN IF NOT EXISTS max_hp INT;
ALTER TABLE room_discarded_pokemons ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;
ALTER TABLE room_discarded_pokemons ADD COLUMN IF NOT EXISTS current_xp INT DEFAULT 0;
ALTER TABLE room_discarded_pokemons ADD COLUMN IF NOT EXISTS max_xp INT DEFAULT 100;
ALTER TABLE room_discarded_pokemons ADD COLUMN IF NOT EXISTS is_shiny BOOLEAN DEFAULT FALSE;
ALTER TABLE room_discarded_pokemons ADD COLUMN IF NOT EXISTS is_fainted BOOLEAN DEFAULT FALSE;
ALTER TABLE room_discarded_pokemons ADD COLUMN IF NOT EXISTS held_item VARCHAR(80);
ALTER TABLE room_discarded_pokemons ADD COLUMN IF NOT EXISTS mega_stone BOOLEAN DEFAULT FALSE;
ALTER TABLE room_discarded_pokemons ADD COLUMN IF NOT EXISTS base_total INT DEFAULT 0;
ALTER TABLE room_discarded_pokemons ADD COLUMN IF NOT EXISTS atk INT DEFAULT 0;
ALTER TABLE room_discarded_pokemons ADD COLUMN IF NOT EXISTS def INT DEFAULT 0;
ALTER TABLE room_discarded_pokemons ADD COLUMN IF NOT EXISTS speed INT DEFAULT 0;
ALTER TABLE room_discarded_pokemons ADD COLUMN IF NOT EXISTS stage INT DEFAULT 1;
ALTER TABLE room_discarded_pokemons ADD COLUMN IF NOT EXISTS happiness INT DEFAULT 0;
ALTER TABLE room_discarded_pokemons ADD COLUMN IF NOT EXISTS mastery_bonus INT DEFAULT 0;
ALTER TABLE room_discarded_pokemons ADD COLUMN IF NOT EXISTS vinculo_supremo BOOLEAN DEFAULT FALSE;
ALTER TABLE room_discarded_pokemons ADD COLUMN IF NOT EXISTS is_legendary BOOLEAN DEFAULT FALSE;
ALTER TABLE room_discarded_pokemons ADD COLUMN IF NOT EXISTS type_name VARCHAR(80);
ALTER TABLE room_discarded_pokemons ADD COLUMN IF NOT EXISTS second_type_name VARCHAR(80);

DO $$
DECLARE
    table_name TEXT;
    policy_name TEXT;
    publication_table TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'rooms',
        'room_map_tiles',
        'room_active_gyms',
        'room_gym_teams',
        'global_champion',
        'global_champion_team',
        'room_players',
        'player_pokemons',
        'player_items',
        'player_cards',
        'player_badges',
        'player_effects',
        'player_stats',
        'player_pokedex',
        'room_logs',
        'room_card_logs',
        'room_battle_logs',
        'room_traps',
        'room_discarded_pokemons'
    ]
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);

        policy_name := 'public ' || table_name;
        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = table_name
              AND policyname = policy_name
        ) THEN
            EXECUTE format('CREATE POLICY %I ON %I FOR ALL USING (true) WITH CHECK (true)', policy_name, table_name);
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
              AND schemaname = 'public'
              AND tablename = table_name
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', table_name);
        END IF;
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION buy_item(p_player_id UUID, p_item_id VARCHAR, p_cost INT, p_quantity INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_gold INT;
BEGIN
    SELECT gold INTO v_current_gold
    FROM room_players
    WHERE id = p_player_id
    FOR UPDATE;

    IF v_current_gold >= p_cost THEN
        UPDATE room_players
        SET gold = gold - p_cost
        WHERE id = p_player_id;

        INSERT INTO player_items (player_id, item_id, quantity)
        VALUES (p_player_id, p_item_id, p_quantity)
        ON CONFLICT (player_id, item_id) DO UPDATE
        SET quantity = player_items.quantity + EXCLUDED.quantity;

        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;
