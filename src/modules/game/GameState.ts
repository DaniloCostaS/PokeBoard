import { Player } from '../../models/Player';
import { Pokemon } from '../../models/Pokemon';
import { MapSystem } from '../../systems/MapSystem';
import { Network } from '../../systems/Network';
import { GLOBAL_EVENTS } from '../../constants/globalEvents';
import { GameSpawns } from './GameSpawns';
import { GameUI } from './GameUI';
import { GameEvents } from './GameEvents';
import { supabase } from '../network/SupabaseInit';

export interface GameSettings {
    generations: number[];
    legendaries: 'yes' | 'no' | 'only';
    megas: boolean;
}

export class GameState {
    static settings: GameSettings = {
        generations: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        legendaries: 'yes',
        megas: true
    };

    static players: Player[] = [];
    static turn: number = 0;
    static round: number = 1;
    static alertEndsTurn: boolean = true;
    static pendingTileEvent: boolean = false;
    static isCityEvent: boolean = false;
    static hasRolled: boolean = false;
    static turnStarted: boolean = false; // Jogador deve clicar "Iniciar Turno" antes de agir
    static forcedDiceValue: number = 0;
    static bonusMovement: number = 0;
    static traps: { x: number, y: number, ownerId: number }[] = [];
    static pendingHealItem: string | null = null;
    static gymTeams: { [id: number]: number[] } = {};
    static pendingCardAnimation: { id: string, player: string } | null = null;
    static pendingLegendaryEncounter: { mon: Pokemon, type: number } | null = null;
    static pendingLegendaryAlert: { monName: string, player: string, isMyEncounter: boolean } | null = null;

    // --- VARIÁVEIS DOS EVENTOS GLOBAIS ---
    static currentGlobalEvent: any = null;
    static eventEndRound: number = 0;
    static lastBonusRoundClaimed: number = 0;

    static activeGyms: number[] = [];
    static globalLogs: { text: string, style: string, type?: string, battleId?: string, timestamp?: string }[] = [];
    static battleLogs: { [id: string]: string[] } = {}; // Store detailed logs indexed by ID
    static cardLogs: { round: number, attacker: string, card: string, target: string, timestamp: number }[] = [];
    static lixeira: Pokemon[] = [];
    static globalChampion: any = null;

    static init(players: Player[], mapSize: number, settings?: GameSettings) {
        if (settings) {
            this.settings = settings;
        }
        if (!this.activeGyms || this.activeGyms.length === 0) {
            const allGyms = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
            const count = mapSize === 7 ? 4 : 8;
            this.activeGyms = allGyms.sort(() => Math.random() - 0.5).slice(0, count);
        }

        this.players = players;

        if (MapSystem.grid.length === 0) {
            MapSystem.generate(mapSize);
        }

        if (Object.keys(this.gymTeams).length === 0) {
            GameSpawns.generateGymTeams();
        }

        const NetworkObj = (window as any).Network || Network;

        if (NetworkObj.isOnline) {
            supabase.from('rooms').select('current_round, current_event_id, event_end_round').eq('id', NetworkObj.currentRoomId).maybeSingle().then(({data}: any) => {
                if (data) {
                    if (data.current_round && data.current_round > this.round) {
                        this.round = data.current_round;
                    }
                    if (data.current_event_id) {
                        if (this.round >= (data.event_end_round || 0)) {
                            this.currentGlobalEvent = null;
                            this.eventEndRound = 0;
                            supabase.from('rooms').update({ current_event_id: null, event_end_round: 0 }).eq('id', NetworkObj.currentRoomId).then();
                        } else {
                            this.currentGlobalEvent = data.current_event_id ? GLOBAL_EVENTS.find((e: any) => e.id === data.current_event_id) || null : null;
                            this.eventEndRound = data.event_end_round || 0;
                        }
                        GameUI.updateHUD();
                    }
                }
            });
        }

        GameUI.renderBoard();
        GameUI.updateHUD();
        GameUI.moveVisuals();
        GameEvents.checkTurnControl();
    }

    static canAct() {
        const NetworkObj = (window as any).Network || Network;
        if (!NetworkObj.isOnline) return true;
        return this.turn === NetworkObj.myPlayerId;
    }

    static canActFull() {
        // Verifica se pode executar ações (turno iniciado + é a vez do jogador)
        if (!this.canAct()) return false;
        if (!this.turnStarted) return false;
        return true;
    }

    static getCurrentPlayer() {
        return this.players[this.turn];
    }

    static getGlobalAverageLevel(): number {
        if (!this.players || this.players.length === 0) return 1;
        let totalLevels = 0;
        let totalMons = 0;
        this.players.forEach(p => { p.team.forEach(m => { totalLevels += m.level; totalMons++; }); });
        if (totalMons === 0) return 1;
        return Math.floor(totalLevels / totalMons);
    }

    static getGlobalAverageTeamSize(): number {
        if (!this.players || this.players.length === 0) return 1;
        let totalMons = 0;
        this.players.forEach(p => { totalMons += p.team.length; });
        const avg = Math.round(totalMons / this.players.length);
        return Math.min(6, Math.max(1, avg));
    }

    static getSaveData() {
        return { 
            players: this.players, 
            turn: this.turn, 
            mapSize: MapSystem.size, 
            grid: MapSystem.grid, 
            gymLoc: MapSystem.gymLocations, 
            lastBonusRoundClaimed: this.lastBonusRoundClaimed,
            battleLogs: this.battleLogs,
            settings: this.settings,
            lixeira: this.lixeira,
            round: this.round,
            currentGlobalEventId: this.currentGlobalEvent ? this.currentGlobalEvent.id : null,
            eventEndRound: this.eventEndRound,
            activeGyms: this.activeGyms,
            gymTeams: this.gymTeams
        };
    }

    static saveGame() {
        localStorage.setItem('pk_save', JSON.stringify(this.getSaveData()));
    }

    static loadGame() {
        const json = localStorage.getItem('pk_save');
        if (json) {
            this.loadGameFromData(JSON.parse(json));
            alert("Partida carregada com sucesso do navegador!");
        } else {
            alert("Nenhum save encontrado no navegador!");
        }
    }

    static exportSave() {
        try {
            const data = JSON.stringify(this.getSaveData(), null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pokeboard_save_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            alert("Erro ao exportar save: " + err.message);
        }
    }

    static importSave(input: HTMLInputElement) {
        const file = input.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                if (!data.players || !data.grid) {
                    throw new Error("O arquivo não parece ser um save válido do PokeBoard.");
                }
                this.loadGameFromData(data);
                alert("Save importado e carregado com sucesso!");
            } catch (err: any) {
                alert("Erro ao importar save: " + err.message);
            } finally {
                input.value = '';
            }
        };
        reader.readAsText(file);
    }

    static loadGameFromData(d: any) {
        this.reset();
        this.activeGyms = d.activeGyms || [];
        this.gymTeams = d.gymTeams || {};
        MapSystem.size = d.mapSize;
        MapSystem.grid = d.grid;
        MapSystem.gymLocations = d.gymLoc || {};
        this.lastBonusRoundClaimed = d.lastBonusRoundClaimed || 0;
        if (d.settings) {
            this.settings = d.settings;
        }
        if (d.battleLogs) {
            this.battleLogs = d.battleLogs;
        }
        this.players = d.players.map((pd: any) => {
            const file = pd.avatar.split('/').pop();
            const pl = new Player(pd.id, pd.name, file, true);
            Object.assign(pl, pd);
            pl.avatar = `/assets/img/Treinadores/${file}`;
            pl.team = pd.team.map((td: any) => {
                const po = new Pokemon(td.id, td.level, td.isShiny);
                Object.assign(po, td);
                if (td.happiness !== undefined) po.happiness = Number(td.happiness);
                return po;
            });
            return pl;
        });
        this.turn = d.turn;
        this.round = d.round || 1;
        this.eventEndRound = d.eventEndRound || 0;
        this.currentGlobalEvent = d.currentGlobalEventId ? GLOBAL_EVENTS.find((e: any) => e.id === d.currentGlobalEventId) || null : null;
        if (d.lixeira) {
            this.lixeira = d.lixeira.map((td: any) => {
                const po = new Pokemon(td.id, td.level, td.isShiny);
                Object.assign(po, td);
                if (td.happiness !== undefined) po.happiness = Number(td.happiness);
                return po;
            });
        } else {
            this.lixeira = [];
        }
        document.getElementById('setup-screen')!.style.display = 'none';
        document.getElementById('game-container')!.style.display = 'flex';
        this.init(this.players, d.mapSize, this.settings);
    }

    static reset() {
        this.players = [];
        this.turn = 0;
        this.round = 1;
        this.alertEndsTurn = true;
        this.pendingTileEvent = false;
        this.isCityEvent = false;
        this.hasRolled = false;
        this.turnStarted = false;
        this.forcedDiceValue = 0;
        this.bonusMovement = 0;
        this.traps = [];
        this.pendingHealItem = null;
        this.gymTeams = {};
        this.pendingCardAnimation = null;
        this.pendingLegendaryEncounter = null;
        this.pendingLegendaryAlert = null;
        this.currentGlobalEvent = null;
        this.eventEndRound = 0;
        this.lastBonusRoundClaimed = 0;
        this.activeGyms = [];
        this.globalLogs = [];
        this.battleLogs = {};
        this.cardLogs = [];
        this.lixeira = [];
        this.globalChampion = null;
    }
}
