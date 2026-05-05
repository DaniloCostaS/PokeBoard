import { BattleCore } from '../modules/battle/BattleCore';
import { BattleUI } from '../modules/battle/BattleUI';
import { Player } from '../models/Player';
import { Pokemon } from '../models/Pokemon';
import { Cards } from './Cards';

export class Battle {

    // --- ESTADO DA BATALHA (Mapeando para o Core) ---
    static get active() { return BattleCore.active; }
    static set active(val) { BattleCore.active = val; }

    static get player() { return BattleCore.player; }
    static get activeMon() { return BattleCore.activeMon; }
    static get opponent() { return BattleCore.opponent; }
    static get enemyPlayer() { return BattleCore.enemyPlayer; }
    static get isPvP() { return BattleCore.isPvP; }
    static get isNPC() { return BattleCore.isNPC; }
    static get isGym() { return BattleCore.isGym; }
    static get gymId() { return BattleCore.gymId; }
    static get reward() { return BattleCore.reward; }
    static get battleTitle() { return BattleCore.battleTitle; }
    static get plyTeamList() { return BattleCore.plyTeamList; }
    static get oppTeamList() { return BattleCore.oppTeamList; }
    static get pendingCapture() { return BattleCore.pendingCapture; }
    static get isPlayerTurn() { return BattleCore.isPlayerTurn; }
    static get processingAction() { return BattleCore.processingAction; }
    static get activeEffects() { return BattleCore.activeEffects; }
    static get itemsUsedThisBattle() { return BattleCore.itemsUsedThisBattle; }
    static get cardsUsedThisBattle() { return BattleCore.cardsUsedThisBattle; }
    static get currentTerrain() { return BattleCore.currentTerrain; }
    static get isAutoPvE() { return BattleCore.isAutoPvE; }
    static get isChampion() { return BattleCore.isChampion; }

    // --- INTERFACES DO CORE ---
    static setup(player: Player, enemyMon: any, isPvP: boolean = false, _label: string = "", reward: number = 0, enemyPlayer: Player | null = null, isGym: boolean = false, gymId: number = 0, npcImage: string = "", terrainTile: number = 1) {
        BattleCore.setup(player, enemyMon, isPvP, _label, reward, enemyPlayer, isGym, gymId, npcImage, terrainTile);
    }
    static startChampionBattle(player: Player, championData: any) { BattleCore.startChampionBattle(player, championData); }
    static attack() { BattleCore.attack(); }
    static run() { BattleCore.run(); }
    static surrender() { BattleCore.surrender(); }
    static useItem(key: string, data: any) { BattleCore.useItem(key, data); }
    static toggleAutoPvE() { BattleCore.toggleAutoPvE(); }
    static end(isRemote: boolean) { BattleCore.end(isRemote); }

    // --- FUNÇÕES DA NETWORK (Mantidas na Facade para facilidade de comunicação) ---
    static startFromNetwork(payload: any) {
        const Game = (window as any).Game;
        const Network = (window as any).Network;
        const p = Game.players[payload.pId];
        if (!p) return;

        BattleCore.active = true;
        BattleCore.player = p;
        BattleCore.currentTerrain = payload.currentTerrain || 1;
        BattleCore.isPvP = payload.isPvP;
        BattleCore.isGym = payload.isGym;
        BattleCore.gymId = payload.gymId;
        BattleCore.isNPC = (!payload.isPvP && payload.reward > 0);
        if (payload.enemyId >= 0) BattleCore.enemyPlayer = Game.players[payload.enemyId];

        if (payload.plyTeam) {
            const PokemonClass = (window as any).Pokemon || p.team[0].constructor;
            BattleCore.plyTeamList = payload.plyTeam.map((td: any) => {
                const po = new PokemonClass(td.id, td.level, td.isShiny);
                Object.assign(po, td);
                return po;
            });
            BattleCore.activeMon = BattleCore.plyTeamList.find((m: any) => m.id === p.team[payload.monIdx]?.id) || BattleCore.plyTeamList[0];
        } else {
            BattleCore.activeMon = p.team[payload.monIdx] || p.team[0];
            if (BattleCore.activeMon) { BattleCore.plyTeamList = [BattleCore.activeMon]; }
            else { BattleCore.plyTeamList = []; }
        }

        if (payload.oppTeam && payload.oppTeam.length > 0) {
            const PokemonClass = (window as any).Pokemon || p.team[0].constructor;
            BattleCore.oppTeamList = payload.oppTeam.map((td: any) => {
                const po = new PokemonClass(td.id, td.level, td.isShiny);
                Object.assign(po, td);
                if (payload.npcImage) (po as any)._npcImage = payload.npcImage;
                if (payload.npcName) (po as any)._npcName = payload.npcName;
                return po;
            });
            const targetIdx = (payload.oppIdx !== undefined && payload.oppIdx >= 0) ? payload.oppIdx : 0;
            BattleCore.opponent = BattleCore.oppTeamList[targetIdx] || BattleCore.oppTeamList[0];
        }
        else if (payload.oppData) {
            BattleCore.opponent = new Pokemon(payload.oppData.id, payload.oppData.level, payload.oppData.isShiny);
            Object.assign(BattleCore.opponent, payload.oppData);
            BattleCore.oppTeamList = [BattleCore.opponent];
        }
        else if (BattleCore.enemyPlayer) {
            BattleCore.oppTeamList = BattleCore.enemyPlayer.getBattleTeam(false);
            const targetIdx = (payload.oppIdx !== undefined && payload.oppIdx >= 0) ? payload.oppIdx : 0;
            BattleCore.opponent = BattleCore.oppTeamList[targetIdx] || BattleCore.oppTeamList[0];
        }

        if (payload.npcImage && BattleCore.opponent) (BattleCore.opponent as any)._npcImage = payload.npcImage;
        if (payload.npcName && BattleCore.opponent) (BattleCore.opponent as any)._npcName = payload.npcName;
        if (payload.battleTitle) BattleCore.battleTitle = payload.battleTitle;

        if (payload.startingTurnId !== undefined) BattleCore.isPlayerTurn = (payload.startingTurnId === Network.myPlayerId);
        else BattleCore.isPlayerTurn = (payload.pId === Network.myPlayerId);

        BattleUI.renderBattleScreen();
    }

    static updateFromNetwork(payload: any, actionPlayerId?: number) {
        if (!BattleCore.activeMon || !BattleCore.opponent) return;
        if (payload.plyHp !== undefined) BattleCore.activeMon.currentHp = payload.plyHp;
        if (payload.oppHp !== undefined) BattleCore.opponent.currentHp = payload.oppHp;
        if (payload.msg) BattleUI.logBattle(payload.msg, false, actionPlayerId);
        BattleUI.updateUI();
    }

    // --- INTERFACES DO UI E CARTAS ---
    static viewTeam() { BattleUI.viewTeam(); }
    static openBag() { BattleUI.openBag(); }
    static openCardSelection() { BattleUI.openCardSelection(); }
    static getHpColor(current: number, max: number) { return BattleUI.getHpColor(current, max); }

    // AQUI ESTÁ A CORREÇÃO QUE FALTAVA:
    static logBattle(msg: string, sync: boolean = false, actionPlayerId?: number) {
        BattleUI.logBattle(msg, sync, actionPlayerId);
    }

    static useCard(cardId: string) {
        if (BattleCore.cardsUsedThisBattle >= 3) return alert("🚫 Você já usou o limite máximo de 3 cartas nesta batalha!");
        const Network = (window as any).Network;
        const Game = (window as any).Game;

        if (BattleCore.isPvP && BattleCore.enemyPlayer) {
            const enemyHasJam = BattleCore.enemyPlayer.cards.findIndex((c: any) => c.id === 'jam');
            if (enemyHasJam > -1) {
                BattleCore.cardsUsedThisBattle++;
                BattleCore.enemyPlayer.cards.splice(enemyHasJam, 1);
                const myCardIdx = BattleCore.player!.cards.findIndex((c: any) => c.id === cardId);
                let cardName = "uma carta";
                if (myCardIdx > -1) {
                    cardName = BattleCore.player!.cards[myCardIdx].name;
                    BattleCore.player!.cards.splice(myCardIdx, 1);
                }

                document.getElementById('battle-cards-modal')!.style.display = 'none';
                Game.updateHUD();

                const jamMsg = `📡 INTERFERÊNCIA!\n\n${BattleCore.enemyPlayer.name} anulou a carta ${cardName} de ${BattleCore.player?.name} automaticamente!`;
                Game.sendGlobalLog(`📡 ${BattleCore.enemyPlayer.name} usou Interferência contra ${BattleCore.player?.name} e bloqueou a carta [${cardName}]!`);
                Game.showGlobalAlert(jamMsg, BattleCore.player!.name, true, false);

                if (Network.isOnline) {
                    Network.syncPlayers([BattleCore.player!.id, BattleCore.enemyPlayer.id]);
                    Network.sendAction('SHOW_ALERT', { msg: jamMsg, playerName: BattleCore.player!.name, endsTurn: false });
                }
                return;
            }
        }
        BattleCore.cardsUsedThisBattle++;
        Cards.activate(cardId);
    }
}

// Vincula a Battle ao window
(window as any).Battle = Battle;