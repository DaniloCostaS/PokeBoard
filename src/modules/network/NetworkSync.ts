import { supabase, NetworkState } from './SupabaseInit';
import { Player } from '../../models/Player';
import { SupabaseDataStore } from './SupabaseDataStore';

export class NetworkSync {

    static getSanitizedTeam(team: any[]) {
        if (!team) return [];
        return team.map((mon: any) => {
            const data: any = {
                id: mon.id,
                name: mon.name,
                type: mon.type,
                secondType: mon.secondType || "",
                baseTotal: mon.baseTotal || 0,
                currentHp: mon.currentHp,
                maxHp: mon.maxHp,
                level: mon.level,
                currentXp: mon.currentXp,
                maxXp: mon.maxXp,
                isShiny: mon.isShiny,
                isLegendary: mon.isLegendary,
                atk: mon.atk,
                def: mon.def,
                speed: mon.speed,
                stage: mon.stage || 1,
                evoData: mon.evoData || { next: null, trigger: null },
                megaStone: mon.megaStone || false,
                ivs: mon.ivs || { hp: 0, atk: 0, def: 0, spd: 0 },
                baseStats: mon.baseStats || { hp: 10, atk: 10, def: 10, spd: 10 },
                bonusStats: mon.bonusStats || { hp: 0, atk: 0, def: 0, spd: 0 },
                wins: mon.wins || 0,
                vinculoSupremo: mon.vinculoSupremo || false,
                heldItem: mon.heldItem || null,
                masteryBonus: mon.masteryBonus || 0,
                happiness: mon.happiness || 0
            };
            return data;
        });
    }

    static async loadGlobalChampion() {
        try {
            const data = await SupabaseDataStore.loadGlobalChampion();
            const Game = (window as any).Game;

            Game.globalChampion = data || null;

            if (Game.renderChampionBanner) Game.renderChampionBanner();
        } catch (e) { console.error("Erro ao carregar campeão", e); }
    }

    static async saveGlobalChampion(player: Player) {
        try {
            await SupabaseDataStore.saveGlobalChampion(player);
        } catch (e) { console.error("Erro ao salvar campeão", e); }
    }

    // Mantido por compatibilidade temporária
    static syncPlayerState() {
        this.syncPlayerStateAsync();
    }
    
    // Antigo sync global, migrado para update pontual do room_players
    static async syncPlayerStateAsync() {
        if (!NetworkState.isOnline || !NetworkState.currentRoomId) return;
        const Game = (window as any).Game;

        const p = Game.players.find((pl: any) => pl.id === NetworkState.myPlayerId) || Game.players[NetworkState.myPlayerId];
        if (!p) return;
        
        const playerIdDb = NetworkState.myPlayerIdDb;
        if (!playerIdDb) return;

        await SupabaseDataStore.savePlayer(p, playerIdDb);
    }

    static async syncTeam() {
        if (!NetworkState.isOnline || !NetworkState.myPlayerIdDb) return;
        const Game = (window as any).Game;
        const p = Game.players.find((pl: any) => pl.id === NetworkState.myPlayerId);
        if (!p || !p.team) return;

        await SupabaseDataStore.replaceTeam(NetworkState.myPlayerIdDb, p.team);
    }

    static sendState() {
        this.syncPlayerState();
    }

    // Sincronizações Específicas
    static async syncPlayerPosition(x: number, y: number) {
        if (!NetworkState.isOnline) return;
        await supabase
            .from('room_players')
            .update({ x, y })
            .eq('room_id', NetworkState.currentRoomId)
            .eq('local_index', NetworkState.myPlayerIdLocal);
    }

    static async syncPlayerGold(gold: number) {
        if (!NetworkState.isOnline) return;
        await supabase
            .from('room_players')
            .update({ gold })
            .eq('room_id', NetworkState.currentRoomId)
            .eq('local_index', NetworkState.myPlayerIdLocal);
    }

    static syncSpecificPlayer(targetId: number) {
        const Game = (window as any).Game;
        const player = Game.players.find((p: any) => p.id === targetId);
        if (player) SupabaseDataStore.savePlayer(player);
    }

    static syncPlayers(ids: number[]) {
        const Game = (window as any).Game;
        ids.forEach(id => {
            const player = Game.players.find((p: any) => p.id === id);
            if (player) SupabaseDataStore.savePlayer(player);
        });
    }

    static async syncLogs(logs: any[]) {
        if (!NetworkState.isOnline) return;
        // Pega o último log adicionado (que está no index 0 devido ao unshift)
        if (logs.length > 0) {
            await SupabaseDataStore.insertRoomLog(NetworkState.currentRoomId, logs[0]);
        }
    }

    static async syncCardLogs(logs: any[]) {
        if (!NetworkState.isOnline) return;
        if (logs.length > 0) await SupabaseDataStore.insertCardLog(NetworkState.currentRoomId, logs[0]);
    }

    static async syncTurn(newTurn: number, newRound: number = 1) {
        if (!NetworkState.isOnline) return;
        await supabase
            .from('rooms')
            .update({ current_turn: newTurn, current_round: newRound })
            .eq('id', NetworkState.currentRoomId);
    }

    static syncLixeira() {
        if (!NetworkState.isOnline) return;
        const Game = (window as any).Game;
        SupabaseDataStore.saveDiscardPile(NetworkState.currentRoomId, Game.lixeira || []);
    }

    static syncBattleLogs(_battleId: string, _logs: string[]) {
        if (!NetworkState.isOnline) return;
        // TODO: Adaptar
    }
}
