import { CARDS_DB } from '../../constants';
import { GLOBAL_EVENTS } from '../../constants/globalEvents';
import { Player } from '../../models/Player';
import { Pokemon } from '../../models/Pokemon';
import { MapSystem } from '../../systems/MapSystem';
import { supabase } from './SupabaseInit';

type LogEntry = { text: string; style: string; type?: string; battleId?: string; timestamp?: string };

const DEFAULT_STATS = { cardsUsed: 0, cardsSuffered: 0, effectsReceived: {}, cardsDefended: {}, turnsLost: 0 };

function asAvatarFile(avatar: string | undefined): string {
    return (avatar || 'Red.png').split('/').pop() || 'Red.png';
}

function toPokemonRow(playerId: string, mon: any, slotIndex: number) {
    return {
        player_id: playerId,
        slot_index: slotIndex,
        pokemon_id: mon.id,
        name: mon.name,
        current_hp: mon.currentHp,
        max_hp: mon.maxHp,
        level: mon.level,
        current_xp: mon.currentXp,
        max_xp: mon.maxXp,
        is_shiny: !!mon.isShiny,
        is_fainted: typeof mon.isFainted === 'function' ? mon.isFainted() : mon.currentHp <= 0,
        held_item: mon.heldItem || null,
        mega_stone: !!mon.megaStone,
        base_total: mon.baseTotal || 0,
        atk: mon.atk || 0,
        def: mon.def || 0,
        speed: mon.speed || 0,
        stage: mon.stage || 1,
        happiness: mon.happiness || 0,
        mastery_bonus: mon.masteryBonus || 0,
        vinculo_supremo: !!mon.vinculoSupremo,
        is_legendary: !!mon.isLegendary,
        type_name: mon.type || '',
        second_type_name: mon.secondType || ''
    };
}

function hydratePokemon(row: any): Pokemon {
    const PokemonClass = (window as any).Pokemon || Pokemon;
    const mon = new PokemonClass(row.pokemon_id, row.level, row.is_shiny);
    mon.currentHp = row.current_hp;
    mon.maxHp = row.max_hp;
    mon.currentXp = row.current_xp;
    mon.maxXp = row.max_xp;
    mon.heldItem = row.held_item;
    mon.megaStone = !!row.mega_stone;
    if (row.base_total) mon.baseTotal = row.base_total;
    if (row.atk) mon.atk = row.atk;
    if (row.def) mon.def = row.def;
    if (row.speed) mon.speed = row.speed;
    if (row.stage) mon.stage = row.stage;
    if (row.happiness !== undefined) mon.happiness = Number(row.happiness);
    if (row.mastery_bonus) mon.masteryBonus = row.mastery_bonus;
    if (row.vinculo_supremo) mon.vinculoSupremo = row.vinculo_supremo;
    return mon;
}

function flattenRecord(record: any, prefix = ''): { key: string; value: string }[] {
    if (!record || typeof record !== 'object') return [];
    const rows: { key: string; value: string }[] = [];
    Object.keys(record).forEach(key => {
        const value = record[key];
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            rows.push(...flattenRecord(value, fullKey));
        } else {
            rows.push({ key: fullKey, value: JSON.stringify(value) });
        }
    });
    return rows;
}

function expandRecord(rows: any[] | undefined): any {
    const result: any = {};
    (rows || []).forEach(row => {
        const path = String(row.key).split('.');
        let cursor = result;
        path.forEach((part, index) => {
            if (index === path.length - 1) {
                try {
                    cursor[part] = JSON.parse(row.value);
                } catch {
                    cursor[part] = row.value;
                }
            } else {
                cursor[part] = cursor[part] || {};
                cursor = cursor[part];
            }
        });
    });
    return result;
}

export class SupabaseDataStore {
    static async saveRoomConfig(roomId: string, settings: any, mapSize: number) {
        await supabase.from('rooms').update({
            map_size: mapSize,
            generations: settings.generations || [1, 2, 3, 4, 5, 6, 7, 8, 9],
            legendaries_rule: settings.legendaries || 'yes',
            megas_enabled: settings.megas !== false
        }).eq('id', roomId);
    }

    static async saveBoard(roomId: string, settings: any, gymTeams: Record<number, number[]>, activeGyms: number[]) {
        await this.saveRoomConfig(roomId, settings, MapSystem.size);

        const tileRows: any[] = [];
        for (let y = 0; y < MapSystem.grid.length; y++) {
            for (let x = 0; x < MapSystem.grid[y].length; x++) {
                tileRows.push({
                    room_id: roomId,
                    x,
                    y,
                    tile_type: MapSystem.grid[y][x],
                    gym_id: MapSystem.gymLocations[`${x},${y}`] || null
                });
            }
        }

        if (tileRows.length) {
            await supabase.from('room_map_tiles').upsert(tileRows, { onConflict: 'room_id,x,y' });
        }

        if (activeGyms.length) {
            await supabase
                .from('room_active_gyms')
                .upsert(activeGyms.map((gymId, badgeIndex) => ({ room_id: roomId, badge_index: badgeIndex, gym_id: gymId })), { onConflict: 'room_id,badge_index' });
        }

        const teamRows = Object.entries(gymTeams || {}).flatMap(([gymId, ids]) => ids.map((pokemonId, slotIndex) => ({
            room_id: roomId,
            gym_id: Number(gymId),
            slot_index: slotIndex,
            pokemon_id: pokemonId
        })));
        if (teamRows.length) await supabase.from('room_gym_teams').upsert(teamRows, { onConflict: 'room_id,gym_id,slot_index' });
    }

    static async loadBoard(room: any) {
        MapSystem.size = room.map_size || 20;
        const settings = {
            generations: room.generations || [1, 2, 3, 4, 5, 6, 7, 8, 9],
            legendaries: room.legendaries_rule || 'yes',
            megas: room.megas_enabled !== false
        };

        const [{ data: tiles }, { data: activeGyms }, { data: gymRows }] = await Promise.all([
            supabase.from('room_map_tiles').select('*').eq('room_id', room.id),
            supabase.from('room_active_gyms').select('*').eq('room_id', room.id).order('badge_index'),
            supabase.from('room_gym_teams').select('*').eq('room_id', room.id).order('slot_index')
        ]);

        if (tiles && tiles.length > 0) {
            MapSystem.grid = Array.from({ length: MapSystem.size }, () => Array(MapSystem.size).fill(0));
            MapSystem.gymLocations = {};
            tiles.forEach((tile: any) => {
                if (MapSystem.grid[tile.y]) MapSystem.grid[tile.y][tile.x] = tile.tile_type;
                if (tile.gym_id) MapSystem.gymLocations[`${tile.x},${tile.y}`] = tile.gym_id;
            });
        }

        const gymTeams: Record<number, number[]> = {};
        (gymRows || []).forEach((row: any) => {
            gymTeams[row.gym_id] = gymTeams[row.gym_id] || [];
            gymTeams[row.gym_id][row.slot_index] = row.pokemon_id;
        });

        return {
            settings,
            activeGyms: (activeGyms || []).map((row: any) => row.gym_id),
            gymTeams
        };
    }

    static async savePlayer(player: Player, playerIdDb?: string) {
        const id = playerIdDb || await this.getPlayerDbId(player.id);
        if (!id) return;

        await supabase.from('room_players').update({
            name: player.name,
            avatar: asAvatarFile(player.avatar),
            x: player.x,
            y: player.y,
            gold: player.gold,
            skip_turns: player.skipTurns || 0,
            badges_count: (player.badges || []).filter(Boolean).length
        }).eq('id', id);

        await Promise.all([
            this.replaceTeam(id, player.team || []),
            this.replaceItems(id, player.items || {}),
            this.replaceCards(id, player.cards || []),
            this.replaceBadges(id, player.badges || []),
            this.replaceKeyValues('player_effects', id, { ...(player.effects || {}), activeQuests: player.activeQuests || [] }),
            this.replaceKeyValues('player_stats', id, player.stats || DEFAULT_STATS),
            this.replacePokedex(id, player.pokedexData || {})
        ]);
    }

    static async savePlayers(players: Player[]) {
        await Promise.all(players.map(player => this.savePlayer(player)));
    }

    static async replaceTeam(playerId: string, team: any[]) {
        const rows = team.map((mon, index) => toPokemonRow(playerId, mon, index));
        if (rows.length) await supabase.from('player_pokemons').upsert(rows, { onConflict: 'player_id,slot_index' });
        await supabase.from('player_pokemons').delete().eq('player_id', playerId).gte('slot_index', team.length);
    }

    static async replaceItems(playerId: string, items: Record<string, number>) {
        const rows = Object.keys(items).filter(itemId => items[itemId] > 0).map(itemId => ({ player_id: playerId, item_id: itemId, quantity: items[itemId] }));
        if (rows.length) await supabase.from('player_items').upsert(rows, { onConflict: 'player_id,item_id' });
        const emptyItems = Object.keys(items).filter(itemId => items[itemId] <= 0);
        if (emptyItems.length) await supabase.from('player_items').delete().eq('player_id', playerId).in('item_id', emptyItems);
    }

    static async replaceCards(playerId: string, cards: any[]) {
        const rows = cards.map((card, index) => ({ player_id: playerId, hand_index: index, card_id: card.id || card, is_protected: !!card.isProtected }));
        if (rows.length) await supabase.from('player_cards').upsert(rows, { onConflict: 'player_id,hand_index' });
        await supabase.from('player_cards').delete().eq('player_id', playerId).gte('hand_index', cards.length);
    }

    static async replaceBadges(playerId: string, badges: boolean[]) {
        const rows = badges.map((hasBadge, gymId) => hasBadge ? { player_id: playerId, gym_id: gymId } : null).filter(Boolean);
        if (rows.length) await supabase.from('player_badges').upsert(rows as any[], { onConflict: 'player_id,gym_id' });
        const missingBadges = badges.map((hasBadge, gymId) => hasBadge ? null : gymId).filter(gymId => gymId !== null);
        if (missingBadges.length) await supabase.from('player_badges').delete().eq('player_id', playerId).in('gym_id', missingBadges as number[]);
    }

    static async replaceKeyValues(table: 'player_effects' | 'player_stats', playerId: string, record: any) {
        const rows = flattenRecord(record).map(row => ({ player_id: playerId, key: row.key, value: row.value }));
        if (rows.length) await supabase.from(table).upsert(rows, { onConflict: 'player_id,key' });
    }

    static async replacePokedex(playerId: string, pokedexData: any) {
        const rows = Object.keys(pokedexData || {}).map(pokemonId => ({
            player_id: playerId,
            pokemon_id: Number(pokemonId),
            seen: pokedexData[pokemonId].seen || 0,
            caught: pokedexData[pokemonId].caught || 0,
            defeated: pokedexData[pokemonId].defeated || 0
        }));
        if (rows.length) await supabase.from('player_pokedex').upsert(rows, { onConflict: 'player_id,pokemon_id' });
    }

    static hydratePlayers(playerRows: any[]): Player[] {
        return playerRows.map(pd => {
            const player = new Player(pd.local_index, pd.name, asAvatarFile(pd.avatar), true);
            player.x = pd.x;
            player.y = pd.y;
            player.gold = pd.gold;
            player.skipTurns = pd.skip_turns || 0;
            player.badges = [false, false, false, false, false, false, false, false];
            (pd.player_badges || []).forEach((badge: any) => {
                if (badge.gym_id >= 0 && badge.gym_id < 8) player.badges[badge.gym_id] = true;
            });
            const cardRowsBySlot = new Map<number, any>();
            (pd.player_cards || []).forEach((cardRow: any) => {
                cardRowsBySlot.set(cardRow.hand_index || 0, cardRow);
            });
            player.cards = [...cardRowsBySlot.values()].sort((a: any, b: any) => (a.hand_index || 0) - (b.hand_index || 0)).map((cardRow: any) => {
                const cardData = CARDS_DB.find(card => card.id === cardRow.card_id);
                return cardData ? { ...cardData, isProtected: cardRow.is_protected } : cardRow.card_id;
            });
            player.items = {};
            (pd.player_items || []).forEach((item: any) => { player.items[item.item_id] = item.quantity; });
            const effectsData: any = expandRecord(pd.player_effects);
            if (effectsData.activeQuests) {
                player.activeQuests = effectsData.activeQuests;
                delete effectsData.activeQuests;
            } else {
                player.activeQuests = [];
            }
            player.effects = effectsData;
            player.stats = { ...DEFAULT_STATS, ...expandRecord(pd.player_stats) };
            player.pokedexData = {};
            (pd.player_pokedex || []).forEach((dex: any) => {
                player.pokedexData[dex.pokemon_id] = { seen: dex.seen || 0, caught: dex.caught || 0, defeated: dex.defeated || 0 };
            });
            player.team = (pd.player_pokemons || []).sort((a: any, b: any) => (a.slot_index || 0) - (b.slot_index || 0)).map(hydratePokemon);
            return player;
        }).sort((a, b) => a.id - b.id);
    }

    static async insertRoomLog(roomId: string, log: string | LogEntry) {
        const entry: LogEntry = typeof log === 'string' ? { text: log, style: '' } : log;
        const message = entry.text || '';
        const { error } = await supabase.from('room_logs').insert([{
            room_id: roomId,
            message,
            log_text: message,
            style: entry.style || '',
            log_type: entry.type || 'system',
            battle_id: entry.battleId || null
        }]);
        if (error) {
            console.warn('[SupabaseDataStore] Falha ao inserir room_log:', error);
        }
    }

    static logFromRow(row: any): LogEntry {
        return {
            text: row.message || row.log_text || '',
            style: row.style || '',
            type: row.log_type || 'system',
            battleId: row.battle_id || undefined,
            timestamp: new Date(row.created_at).toLocaleTimeString()
        };
    }

    static async insertCardLog(roomId: string, entry: any) {
        await supabase.from('room_card_logs').insert([{
            room_id: roomId,
            round: entry.round,
            attacker_name: entry.attacker,
            card_name: entry.card,
            target_name: entry.target,
            happened_at_ms: entry.timestamp
        }]);
    }

    static async loadCardLogs(roomId: string) {
        const { data } = await supabase.from('room_card_logs').select('*').eq('room_id', roomId).order('created_at', { ascending: false }).limit(20);
        return (data || []).map((row: any) => ({
            round: row.round,
            attacker: row.attacker_name,
            card: row.card_name,
            target: row.target_name,
            timestamp: row.happened_at_ms
        }));
    }

    static async saveTraps(roomId: string, traps: any[]) {
        await supabase.from('room_traps').delete().eq('room_id', roomId);
        if (traps.length) await supabase.from('room_traps').insert(traps.map(trap => ({ room_id: roomId, x: trap.x, y: trap.y, owner_local_index: trap.ownerId })));
    }

    static async saveDiscardPile(roomId: string, mons: any[]) {
        await supabase.from('room_discarded_pokemons').delete().eq('room_id', roomId);
        if (mons.length) {
            await supabase.from('room_discarded_pokemons').insert(mons.map((mon, index) => {
                const row = toPokemonRow(roomId, mon, index) as any;
                delete row.player_id;
                return { room_id: roomId, ...row };
            }));
        }
    }

    static async loadDiscardPile(roomId: string): Promise<Pokemon[]> {
        const { data } = await supabase.from('room_discarded_pokemons').select('*').eq('room_id', roomId).order('slot_index');
        return (data || []).map(hydratePokemon);
    }

    static async saveGlobalChampion(player: Player) {
        const champion = { name: player.name, avatar: asAvatarFile(player.avatar) };
        const { data } = await supabase.from('global_champion').upsert({ id: 1, name: champion.name, avatar: champion.avatar }).select().single();
        if (!data) return;
        await supabase.from('global_champion_team').delete().eq('champion_id', data.id);
        if (player.team.length) {
            await supabase.from('global_champion_team').insert(player.team.map((mon, index) => ({
                champion_id: data.id,
                slot_index: index,
                pokemon_id: mon.id,
                level: mon.level,
                is_shiny: !!mon.isShiny,
                current_hp: mon.currentHp,
                max_hp: mon.maxHp,
                current_xp: mon.currentXp,
                max_xp: mon.maxXp,
                held_item: mon.heldItem || null,
                mega_stone: !!mon.megaStone,
                base_total: mon.baseTotal || 0
            })));
        }
    }

    static async loadGlobalChampion() {
        const { data } = await supabase.from('global_champion').select('*, global_champion_team(*)').eq('id', 1).maybeSingle();
        if (!data) return null;
        return {
            name: data.name,
            avatar: data.avatar,
            team: (data.global_champion_team || []).sort((a: any, b: any) => a.slot_index - b.slot_index).map(hydratePokemon)
        };
    }

    static async setGlobalEvent(roomId: string, eventId: string | null, eventEndRound: number) {
        await supabase.from('rooms').update({ current_event_id: eventId, event_end_round: eventEndRound }).eq('id', roomId);
    }

    static eventFromRoom(room: any) {
        return {
            currentGlobalEvent: room.current_event_id ? GLOBAL_EVENTS.find((event: any) => event.id === room.current_event_id) || null : null,
            eventEndRound: room.event_end_round || 0
        };
    }

    private static async getPlayerDbId(localIndex: number): Promise<string | null> {
        const Network = (window as any).Network;
        const { data } = await supabase.from('room_players').select('id').eq('room_id', Network.currentRoomId).eq('local_index', localIndex).maybeSingle();
        return data?.id || null;
    }
}
