import { supabase, NetworkState } from './SupabaseInit';
import { Player } from '../../models/Player';
import { SupabaseDataStore } from './SupabaseDataStore';

export class NetworkSync {
    // Fila de gravação por jogador: garante que saves do mesmo jogador cheguem ao banco na ordem em que foram disparados
    private static saveChains = new Map<number, Promise<void>>();
    private static pendingSaves = new Map<number, number>();

    // Enquanto este cliente tiver gravações pendentes de um jogador, o estado local dele é o mais recente
    static hasPendingSave(playerId: number): boolean {
        return (this.pendingSaves.get(playerId) || 0) > 0;
    }

    // Apenas o dono do turno pode gravar no banco (evita race conditions entre clientes)
    static canSyncDatabase(): boolean {
        if (!NetworkState.isOnline) return true;
        if (NetworkState.isSpectator) return false;
        const Game = (window as any).Game;
        if (Game && typeof Game.canAct === 'function') {
            return Game.canAct();
        }
        return true;
    }

    private static warnBlockedWrite() {
        console.warn('[NetworkSync] Gravação cancelada: Apenas o jogador do turno pode salvar dados no banco.');
    }

    private static enqueueSave(player: Player, playerIdDb?: string): Promise<void> {
        const previous = this.saveChains.get(player.id) || Promise.resolve();
        this.pendingSaves.set(player.id, (this.pendingSaves.get(player.id) || 0) + 1);
        const next = previous
            .catch(() => { })
            .then(() => SupabaseDataStore.savePlayer(player, playerIdDb))
            .catch(e => console.error(`[NetworkSync] Erro ao salvar ${player.name}`, e))
            .finally(() => this.pendingSaves.set(player.id, Math.max(0, (this.pendingSaves.get(player.id) || 1) - 1)));
        this.saveChains.set(player.id, next);
        return next;
    }

    // Salva os objetos informados (não busca em Game.players, que pode ter sido substituído por um refresh do realtime)
    static syncPlayerObjects(players: Player[], force: boolean = false) {
        if (!NetworkState.isOnline) return;
        if (!force && !this.canSyncDatabase()) { this.warnBlockedWrite(); return; }
        players.forEach(player => { if (player) this.enqueueSave(player); });
    }

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
        if (!this.canSyncDatabase()) { this.warnBlockedWrite(); return; }
        const Game = (window as any).Game;

        const p = Game.players.find((pl: any) => pl.id === NetworkState.myPlayerId) || Game.players[NetworkState.myPlayerId];
        if (!p) return;
        
        const playerIdDb = NetworkState.myPlayerIdDb;
        if (!playerIdDb) return;

        await this.enqueueSave(p, playerIdDb);
    }

    static async syncTeam() {
        if (!NetworkState.isOnline || !NetworkState.myPlayerIdDb) return;
        if (!this.canSyncDatabase()) { this.warnBlockedWrite(); return; }
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
        if (!this.canSyncDatabase()) { this.warnBlockedWrite(); return; }
        await supabase
            .from('room_players')
            .update({ x, y })
            .eq('room_id', NetworkState.currentRoomId)
            .eq('local_index', NetworkState.myPlayerIdLocal);
    }

    static async syncPlayerGold(gold: number) {
        if (!NetworkState.isOnline) return;
        if (!this.canSyncDatabase()) { this.warnBlockedWrite(); return; }
        await supabase
            .from('room_players')
            .update({ gold })
            .eq('room_id', NetworkState.currentRoomId)
            .eq('local_index', NetworkState.myPlayerIdLocal);
    }

    // force: usado apenas pelas ferramentas de ADMIN HOST, que podem agir fora do próprio turno
    static syncSpecificPlayer(targetId: number, force: boolean = false) {
        this.syncPlayers([targetId], force);
    }

    static syncPlayers(ids: number[], force: boolean = false) {
        const Game = (window as any).Game;
        const players = ids.map(id => Game.players.find((p: any) => p.id === id)).filter(Boolean);
        this.syncPlayerObjects(players, force);
    }

    static async syncLogs(logs: any[]) {
        if (!NetworkState.isOnline || NetworkState.isSpectator) return;
        // Pega o último log adicionado (que está no index 0 devido ao unshift)
        if (logs.length > 0) {
            await SupabaseDataStore.insertRoomLog(NetworkState.currentRoomId, logs[0]);
        }
    }

    static async syncCardLogs(logs: any[]) {
        if (!NetworkState.isOnline || NetworkState.isSpectator) return;
        if (logs.length > 0) await SupabaseDataStore.insertCardLog(NetworkState.currentRoomId, logs[0]);
    }

    static async syncTurn(newTurn: number, newRound: number = 1) {
        if (!NetworkState.isOnline || NetworkState.isSpectator) return;
        NetworkState.lastTurnWriteAt = Date.now();
        await supabase
            .from('rooms')
            .update({ current_turn: newTurn, current_round: newRound })
            .eq('id', NetworkState.currentRoomId);
    }

    static syncLixeira() {
        if (!NetworkState.isOnline || NetworkState.isSpectator) return;
        const Game = (window as any).Game;
        SupabaseDataStore.saveDiscardPile(NetworkState.currentRoomId, Game.lixeira || []);
    }

    static syncBattleLogs(_battleId: string, _logs: string[]) {
        if (!NetworkState.isOnline) return;
        // TODO: Adaptar
    }
}
