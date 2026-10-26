import { supabase, NetworkState } from '../network/SupabaseInit';
import { Account } from './Account';
import { ACHIEVEMENTS, Achievements } from './Achievements';
import type { StatKey, Stats } from './Achievements';
import { GameDialog } from '../ui/GameDialog';

/**
 * PROGRESSO DA CONTA ENTRE PARTIDAS
 * Junta os eventos do jogador logado (só os dele) e envia em lote para o banco:
 * contadores (profile_add_stats), capturas para a Pokédex da conta e conquistas novas.
 */
export class ProfileTracker {
    private static pending: Stats = {};
    private static catches: { id: number; shiny: boolean }[] = [];
    private static timer: number | null = null;
    private static flushing: Promise<void> | null = null;
    private static knownUnlocked: Set<string> | null = null;
    private static matchRecorded = new Set<string>();
    private static listenersInstalled = false;

    // O evento é do dono desta conta? (online: meu jogador; offline: o único humano da mesa)
    static isMine(player: any): boolean {
        if (!Account.isLogged || !player) return false;
        if (new URLSearchParams(location.search).has('demo')) return false;
        if (NetworkState.isOnline) return !NetworkState.isSpectator && player.id === NetworkState.myPlayerId;
        const players: any[] = (window as any).Game?.players || [];
        const humans = players.filter(p => !p.isCPU);
        return humans.length === 1 && humans[0] === player;
    }

    static add(player: any, key: StatKey, n: number = 1) {
        if (!n || !this.isMine(player)) return;
        this.pending[key] = (this.pending[key] || 0) + n;
        this.schedule();
    }

    static caught(player: any, mon: any) {
        if (!mon || !this.isMine(player)) return;
        this.catches.push({ id: Number(mon.id), shiny: !!mon.isShiny });
        this.add(player, 'catches');
        if (mon.isShiny) this.add(player, 'shiny_catches');
        if (mon.isLegendary) this.add(player, 'legendary_catches');
    }

    // Evolução registra a nova espécie na Pokédex da conta
    static evolved(player: any, mon: any) {
        if (!mon || !this.isMine(player)) return;
        this.catches.push({ id: Number(mon.id), shiny: false });
        this.add(player, 'evolutions');
    }

    static battle(player: any, won: boolean, kind: { isPvP?: boolean; isGym?: boolean; isNPC?: boolean; isChampion?: boolean }) {
        if (!this.isMine(player)) return;
        if (!won) {
            this.add(player, 'battles_lost');
            if (kind.isPvP) this.add(player, 'pvp_losses');
            return;
        }
        this.add(player, 'battles_won');
        if (kind.isChampion) this.add(player, 'champion_wins');
        else if (kind.isPvP) this.add(player, 'pvp_wins');
        else if (kind.isGym) this.add(player, 'gym_wins');
        else if (kind.isNPC) this.add(player, 'npc_wins');
        else this.add(player, 'wild_wins');
    }

    // Fim de partida: conta uma vez por partida (vitória vem do GAME_WIN para todos os clientes)
    static matchEnd(winnerId: number) {
        const Game = (window as any).Game;
        const players: any[] = Game?.players || [];
        const me = players.find(p => this.isMine(p));
        if (!me) return;
        const key = NetworkState.isOnline ? NetworkState.currentRoomId : `offline-${winnerId}-${Game?.round}-${players.length}`;
        if (this.matchRecorded.has(key)) return;
        this.matchRecorded.add(key);
        const won = me.id === winnerId;
        this.add(me, 'games_played');
        if (won) this.add(me, 'games_won');
        this.flush();
        supabase.from('match_history').insert({
            user_id: Account.userId,
            room_id: NetworkState.isOnline ? NetworkState.currentRoomId : null,
            room_alias: NetworkState.isOnline ? NetworkState.currentRoomAlias : 'Offline',
            won,
            rounds: Game?.round || null,
            badges: (me.badges || []).filter(Boolean).length,
            players: players.length,
            team: (me.team || []).map((m: any) => ({ id: m.id, name: m.name, level: m.level, shiny: !!m.isShiny }))
        }).then(({ error }) => { if (error && error.code !== '23505') console.warn('[Perfil] histórico', error); });
    }

    private static schedule() {
        this.installListeners();
        if (this.timer !== null) return;
        this.timer = window.setTimeout(() => { this.timer = null; this.flush(); }, 4000);
    }

    private static installListeners() {
        if (this.listenersInstalled) return;
        this.listenersInstalled = true;
        // Aba indo para o fundo/fechando: manda o que tiver acumulado
        document.addEventListener('visibilitychange', () => { if (document.hidden) this.flush(); });
        window.addEventListener('pagehide', () => this.flush());
    }

    static flush(): Promise<void> {
        if (this.flushing) return this.flushing.then(() => this.flush());
        if (!Account.isLogged) { this.pending = {}; this.catches = []; return Promise.resolve(); }
        const delta = this.pending;
        const catches = this.catches;
        if (!Object.keys(delta).length && !catches.length) return Promise.resolve();
        this.pending = {};
        this.catches = [];
        this.flushing = (async () => {
            try {
                if (catches.length) {
                    const { error } = await supabase.rpc('profile_register_catches', { p_catches: catches });
                    if (error) throw error;
                }
                let stats: Stats | null = null;
                if (Object.keys(delta).length) {
                    const { data, error } = await supabase.rpc('profile_add_stats', { p_delta: delta });
                    if (error) throw error;
                    stats = data as Stats;
                }
                await this.checkAchievements(stats);
            } catch (e) {
                // Devolve para a próxima tentativa
                console.warn('[Perfil] falha ao salvar progresso', e);
                for (const k in delta) this.pending[k as StatKey] = (this.pending[k as StatKey] || 0) + (delta[k as StatKey] || 0);
                this.catches.unshift(...catches);
                this.schedule();
            }
        })().finally(() => { this.flushing = null; });
        return this.flushing;
    }

    static async dexCount(userId: string): Promise<number> {
        const { count } = await supabase.from('profile_pokedex').select('pokemon_id', { count: 'exact', head: true }).eq('user_id', userId).gt('caught', 0);
        return count || 0;
    }

    static async loadUnlocked(userId: string): Promise<Set<string>> {
        const { data } = await supabase.from('profile_achievements').select('achievement_id').eq('user_id', userId);
        return new Set((data || []).map((r: any) => r.achievement_id));
    }

    // Desbloqueia o que for novo e avisa o jogador
    static async checkAchievements(stats?: Stats | null) {
        const uid = Account.userId;
        if (!uid) return;
        if (!stats) {
            const { data } = await supabase.from('profile_stats').select('stats').eq('user_id', uid).maybeSingle();
            stats = (data?.stats || {}) as Stats;
        }
        if (!this.knownUnlocked) this.knownUnlocked = await this.loadUnlocked(uid);
        const dex = await this.dexCount(uid);
        const fresh = Achievements.unlockedBy(stats, dex).filter(id => !this.knownUnlocked!.has(id));
        if (!fresh.length) return;
        const { error } = await supabase.from('profile_achievements').upsert(fresh.map(id => ({ user_id: uid, achievement_id: id })), { onConflict: 'user_id,achievement_id', ignoreDuplicates: true });
        if (error) return;
        fresh.forEach(id => {
            this.knownUnlocked!.add(id);
            const a = ACHIEVEMENTS.find(x => x.id === id);
            if (a) GameDialog.toast(`${a.icon} Conquista desbloqueada: ${a.name}${a.title ? ` · título “${a.title}”` : ''}${a.frame ? ' · nova moldura' : ''}`, { tone: 'success', duration: 5000 });
        });
    }

    static resetCache() { this.knownUnlocked = null; }
}

(window as any).ProfileTracker = ProfileTracker;
