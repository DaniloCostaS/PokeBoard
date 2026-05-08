import { BattleCore } from '../modules/battle/BattleCore';
import { BattleUI } from '../modules/battle/BattleUI';
import { Player } from '../models/Player';
import { Pokemon } from '../models/Pokemon';
import { Cards } from './Cards';

export class Battle {

    // ==========================================
    // ESTADO DA BATALHA (GETTERS E SETTERS)
    // ==========================================
    static get active() { return BattleCore.active; }
    static set active(val) { BattleCore.active = val; }

    static get player() { return BattleCore.player; }
    static set player(val) { BattleCore.player = val; }

    static get activeMon() { return BattleCore.activeMon; }
    static set activeMon(val) { BattleCore.activeMon = val; }

    static get opponent() { return BattleCore.opponent; }
    static set opponent(val) { BattleCore.opponent = val; }

    static get enemyPlayer() { return BattleCore.enemyPlayer; }
    static set enemyPlayer(val) { BattleCore.enemyPlayer = val; }

    static get isPvP() { return BattleCore.isPvP; }
    static set isPvP(val) { BattleCore.isPvP = val; }

    static get isNPC() { return BattleCore.isNPC; }
    static set isNPC(val) { BattleCore.isNPC = val; }

    static get isGym() { return BattleCore.isGym; }
    static set isGym(val) { BattleCore.isGym = val; }

    static get gymId() { return BattleCore.gymId; }
    static set gymId(val) { BattleCore.gymId = val; }

    static get reward() { return BattleCore.reward; }
    static set reward(val) { BattleCore.reward = val; }

    static get battleTitle() { return BattleCore.battleTitle; }
    static set battleTitle(val) { BattleCore.battleTitle = val; }

    static get plyTeamList() { return BattleCore.plyTeamList; }
    static set plyTeamList(val) { BattleCore.plyTeamList = val; }

    static get oppTeamList() { return BattleCore.oppTeamList; }
    static set oppTeamList(val) { BattleCore.oppTeamList = val; }

    static get pendingCapture() { return BattleCore.pendingCapture; }
    static set pendingCapture(val) { BattleCore.pendingCapture = val; }

    static get isPlayerTurn() { return BattleCore.isPlayerTurn; }
    static set isPlayerTurn(val) { BattleCore.isPlayerTurn = val; }

    static get processingAction() { return BattleCore.processingAction; }
    static set processingAction(val) { BattleCore.processingAction = val; }

    static get activeEffects() { return BattleCore.activeEffects; }
    static set activeEffects(val) { BattleCore.activeEffects = val; }

    static get itemsUsedThisBattle() { return BattleCore.itemsUsedThisBattle; }
    static set itemsUsedThisBattle(val) { BattleCore.itemsUsedThisBattle = val; }

    static get cardsUsedThisBattle() { return BattleCore.cardsUsedThisBattle; }
    static set cardsUsedThisBattle(val) { BattleCore.cardsUsedThisBattle = val; }

    static get currentTerrain() { return BattleCore.currentTerrain; }
    static set currentTerrain(val) { BattleCore.currentTerrain = val; }

    static get isAutoPvE() { return BattleCore.isAutoPvE; }
    static set isAutoPvE(val) { BattleCore.isAutoPvE = val; }

    static get isChampion() { return BattleCore.isChampion; }
    static set isChampion(val) { BattleCore.isChampion = val; }

    // ==========================================
    // INTERFACES DO CORE
    // ==========================================
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

    static captureSuccess() { BattleCore.captureSuccess(); }
    static attemptCapture(item: any) { BattleCore.attemptCapture(item); }
    static tryTriggerMegaEvolution(msg?: string) { BattleCore.tryTriggerMegaEvolution(msg); }
    static tryOpponentMegaEvolution(msg?: string) { BattleCore.tryOpponentMegaEvolution(msg); }
    static revertMew() { BattleCore.revertMew(); }
    static revertOpponentMew() { BattleCore.revertOpponentMew(); }
    static checkWinCondition() { BattleCore.checkWinCondition(); }
    static handleFaint() { BattleCore.handleFaint(); }
    static win() { BattleCore.win(); }
    static lose() { BattleCore.lose(); }
    static autoAttackNext() { BattleCore.autoAttackNext(); }
    static startAutoPvP() { BattleCore.startAutoPvP(); }

    // ==========================================
    // FUNÇÕES DA NETWORK (Para comunicação remota)
    // ==========================================
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

    // ==========================================
    // INTERFACES DO UI E CARTAS
    // ==========================================
    static updateUI() { BattleUI.updateUI(); }
    static updateButtons() { BattleUI.updateButtons(); }
    static viewTeam() { BattleUI.viewTeam(); }
    static openBag() { BattleUI.openBag(); }
    static openCardSelection() { BattleUI.openCardSelection(); }
    static getHpColor(current: number, max: number) { return BattleUI.getHpColor(current, max); }
    static logBattle(msg: string, sync: boolean = false, actionPlayerId?: number) { BattleUI.logBattle(msg, sync, actionPlayerId); }
    static async animateCaptureSequence(ballIcon: string, isSuccess: boolean) { await BattleUI.animateCaptureSequence(ballIcon, isSuccess); }

    static useCard(cardId: string) {
        if (BattleCore.isGym && BattleCore.player!.effects.curse) {
            const Game = (window as any).Game;
            Game.showGlobalAlert("😈 Sua mochila foi selada pela Maldição! Você não pode usar cartas nesta Batalha de Ginásio!", BattleCore.player!.name, true, false);
            return;
        }

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