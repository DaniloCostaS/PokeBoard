import { Player } from '../../models/Player';
import { Pokemon } from '../../models/Pokemon';
import { MapSystem } from '../../systems/MapSystem';
import { Network, db } from '../../systems/Network';
import { ref, update, get } from 'firebase/database';
import { GLOBAL_EVENTS } from '../../constants/globalEvents';
import { GameSpawns } from './GameSpawns';
import { GameUI } from './GameUI';
import { GameEvents } from './GameEvents';

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
            this.activeGyms = allGyms.sort(() => Math.random() - 0.5).slice(0, 8);
        }

        this.players = players;

        if (MapSystem.grid.length === 0) {
            MapSystem.generate(mapSize);
        }

        if (Object.keys(this.gymTeams).length === 0) {
            GameSpawns.generateGymTeams();
        }

        const NetworkObj = (window as any).Network || Network;
        if (NetworkObj.isOnline && NetworkObj.isHost) {
            if (db) update(ref(db, `rooms/${NetworkObj.currentRoomId}`), {
                grid: MapSystem.grid,
                gymLocations: MapSystem.gymLocations,
                gymTeams: this.gymTeams,
                settings: this.settings
            });
        }

        if (NetworkObj.isOnline && db) {
            get(ref(db, `rooms/${NetworkObj.currentRoomId}`)).then(snap => {
                const data = snap.val();
                if (data) {
                    if (data.round && data.round > this.round) {
                        this.round = data.round;
                    }
                }
                if (data.currentEventId) {
                    if (this.round >= data.eventEndRound) {
                        this.currentGlobalEvent = null;
                        this.eventEndRound = 0;
                        update(ref(db, `rooms/${NetworkObj.currentRoomId}`), { currentEventId: null, eventEndRound: 0 });
                    } else {
                        this.currentGlobalEvent = GLOBAL_EVENTS.find((e: any) => e.id === data.currentEventId) || null;
                        this.eventEndRound = data.eventEndRound || 0;
                    }
                    GameUI.updateHUD();
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
            settings: this.settings 
        };
    }

    static saveGame() {
        localStorage.setItem('pk_save', JSON.stringify(this.getSaveData()));
    }

    static loadGame() {
        const json = localStorage.getItem('pk_save');
        if (json) this.loadGameFromData(JSON.parse(json));
    }

    static loadGameFromData(d: any) {
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
                return po;
            });
            return pl;
        });
        this.turn = d.turn;
        document.getElementById('setup-screen')!.style.display = 'none';
        document.getElementById('game-container')!.style.display = 'flex';
        this.init(this.players, d.mapSize, this.settings);
    }
}