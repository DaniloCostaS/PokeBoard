import { db, NetworkState } from './FirebaseInit';
import { ref, update, set, get } from 'firebase/database';
import { Player } from '../../models/Player';

export class NetworkSync {

    static getSanitizedTeam(team: any[]) {
        if (!team) return [];
        return team.map((mon: any) => ({
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
            heldItem: mon.heldItem || null
        }));
    }

    static async loadGlobalChampion() {
        try {
            const snap = await get(ref(db, 'global/champion'));
            const Game = (window as any).Game;

            if (snap.exists()) {
                Game.globalChampion = snap.val();
            } else {
                Game.globalChampion = null;
            }

            if (Game.renderChampionBanner) Game.renderChampionBanner();
        } catch (e) { console.error("Erro ao carregar campeão", e); }
    }

    static async saveGlobalChampion(player: Player) {
        try {
            const championData = {
                name: player.name,
                avatar: player.avatar.split('/').pop(),
                team: this.getSanitizedTeam(player.team)
            };
            await set(ref(db, 'global/champion'), championData);
        } catch (e) { console.error("Erro ao salvar campeão", e); }
    }

    static syncPlayerState() {
        if (!NetworkState.isOnline) return;
        const Game = (window as any).Game;

        const p = Game.players.find((pl: any) => pl.id === NetworkState.myPlayerId) || Game.players[NetworkState.myPlayerId];
        if (!p) return;

        update(ref(db, `rooms/${NetworkState.currentRoomId}/players/${NetworkState.myPlayerId}`), {
            id: p.id,
            name: p.name,
            avatar: p.avatar.split('/').pop(),
            x: p.x,
            y: p.y,
            gold: p.gold,
            team: this.getSanitizedTeam(p.team),
            items: p.items,
            skipTurns: p.skipTurns,
            badges: p.badges,
            cards: p.cards && p.cards.length > 0 ? p.cards : null,
            effects: p.effects,
            pokedexData: p.pokedexData || {},
            stats: p.stats || { cardsUsed: 0, cardsSuffered: 0, effectsReceived: {}, cardsDefended: {}, turnsLost: 0 }
        });
    }

    static sendState() {
        this.syncPlayerState();
    }

    static syncSpecificPlayer(targetId: number) {
        if (!NetworkState.isOnline) return;
        const Game = (window as any).Game;

        const p = Game.players.find((pl: any) => pl.id === targetId) || Game.players[targetId];
        if (!p) return;

        update(ref(db, `rooms/${NetworkState.currentRoomId}/players/${targetId}`), {
            id: p.id,
            name: p.name,
            avatar: p.avatar.split('/').pop(),
            x: p.x,
            y: p.y,
            gold: p.gold,
            team: this.getSanitizedTeam(p.team),
            items: p.items,
            badges: p.badges,
            cards: p.cards && p.cards.length > 0 ? p.cards : null,
            skipTurns: p.skipTurns,
            effects: p.effects,
            pokedexData: p.pokedexData || {},
            stats: p.stats || { cardsUsed: 0, cardsSuffered: 0, effectsReceived: {}, cardsDefended: {}, turnsLost: 0 }
        });
    }

    static syncPlayers(ids: number[]) {
        if (!NetworkState.isOnline) return;
        const Game = (window as any).Game;
        const updates: any = {};

        ids.forEach(id => {
            const p = Game.players.find((pl: any) => pl.id === id) || Game.players[id];
            if (p) {
                updates[`rooms/${NetworkState.currentRoomId}/players/${id}`] = {
                    id: p.id,
                    name: p.name,
                    avatar: p.avatar.split('/').pop(),
                    x: p.x,
                    y: p.y,
                    gold: p.gold,
                    team: this.getSanitizedTeam(p.team),
                    items: p.items,
                    skipTurns: p.skipTurns,
                    badges: p.badges,
                    cards: p.cards && p.cards.length > 0 ? p.cards : null,
                    effects: p.effects,
                    pokedexData: p.pokedexData || {},
                    stats: p.stats || { cardsUsed: 0, cardsSuffered: 0, effectsReceived: {}, cardsDefended: {}, turnsLost: 0 }
                };
            }
        });

        update(ref(db), updates);
    }

    static syncLogs(logs: any[]) {
        if (!NetworkState.isOnline) return;
        update(ref(db, `rooms/${NetworkState.currentRoomId}`), { logs: logs });
    }

    static syncCardLogs(logs: any[]) {
        if (!NetworkState.isOnline) return;
        update(ref(db, `rooms/${NetworkState.currentRoomId}`), { cardLogs: logs });
    }

    static syncTurn(newTurn: number, newRound: number = 1) {
        if (!NetworkState.isOnline) return;
        update(ref(db, `rooms/${NetworkState.currentRoomId}`), { turn: newTurn, round: newRound });
    }

    static syncLixeira() {
        if (!NetworkState.isOnline) return;
        const Game = (window as any).Game;
        update(ref(db, `rooms/${NetworkState.currentRoomId}`), { lixeira: this.getSanitizedTeam(Game.lixeira) });
    }
}