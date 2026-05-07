import { GameState } from '../modules/game/GameState';
import { GameUI } from '../modules/game/GameUI';
import { GameEvents } from '../modules/game/GameEvents';
import { GameMovement } from '../modules/game/GameMovement';
import { GameSpawns } from '../modules/game/GameSpawns';
import { Player } from '../models/Player';
import { Pokemon } from '../models/Pokemon';

/**
 * FACADE PRINCIPAL
 * Mantém a interface do antigo Game.ts para que os outros arquivos continuem funcionando perfeitamente!
 */
export class Game {

    // ==========================================
    // ESTADO GLOBAL (GETTERS E SETTERS)
    // ==========================================
    static get players() { return GameState.players; }
    static set players(val) { GameState.players = val; }

    static get turn() { return GameState.turn; }
    static set turn(val) { GameState.turn = val; }

    static get round() { return GameState.round; }
    static set round(val) { GameState.round = val; }

    static get globalChampion() { return GameState.globalChampion; }
    static set globalChampion(val) { GameState.globalChampion = val; }

    static get traps() { return GameState.traps; }
    static set traps(val) { GameState.traps = val; }

    static get lixeira() { return GameState.lixeira; }
    static set lixeira(val) { GameState.lixeira = val; }

    static get currentGlobalEvent() { return GameState.currentGlobalEvent; }
    static set currentGlobalEvent(val) { GameState.currentGlobalEvent = val; }

    static get eventEndRound() { return GameState.eventEndRound; }
    static set eventEndRound(val) { GameState.eventEndRound = val; }

    static get gymTeams() { return GameState.gymTeams; }
    static set gymTeams(val) { GameState.gymTeams = val; }

    static get activeGyms() { return GameState.activeGyms; }
    static set activeGyms(val) { GameState.activeGyms = val; }

    static get globalLogs() { return GameState.globalLogs; }
    static set globalLogs(val) { GameState.globalLogs = val; }

    static get isCityEvent() { return GameState.isCityEvent; }
    static set isCityEvent(val) { GameState.isCityEvent = val; }

    static get hasRolled() { return GameState.hasRolled; }
    static set hasRolled(val) { GameState.hasRolled = val; }

    static get pendingTileEvent() { return GameState.pendingTileEvent; }
    static set pendingTileEvent(val) { GameState.pendingTileEvent = val; }

    static get bonusMovement() { return GameState.bonusMovement; }
    static set bonusMovement(val) { GameState.bonusMovement = val; }

    // ==========================================
    // MÉTODOS NUCLEARES
    // ==========================================
    static init(players: Player[], mapSize: number) { GameState.init(players, mapSize); }
    static getCurrentPlayer() { return GameState.getCurrentPlayer(); }
    static canAct() { return GameState.canAct(); }
    static getGlobalAverageLevel() { return GameState.getGlobalAverageLevel(); }
    static getGlobalAverageTeamSize() { return GameState.getGlobalAverageTeamSize(); } // <-- CORREÇÃO AQUI

    // ==========================================
    // MÉTODOS DE RENDERIZAÇÃO E UI (GameUI)
    // ==========================================
    static updateHUD() { GameUI.updateHUD(); }
    static renderBoard() { GameUI.renderBoard(); }
    static renderTraps(newTraps?: any[]) { GameUI.renderTraps(newTraps); }
    static moveVisuals() { GameUI.moveVisuals(); }
    static renderChampionBanner() { (GameUI as any).renderChampionBanner(); }

    static log(m: string, actionPlayerId?: number) { GameUI.log(m, actionPlayerId); }
    static sendGlobalLog(msg: string) { GameUI.sendGlobalLog(msg); }
    static recordCardLog(attacker: string, card: string, target: string) { GameUI.recordCardLog(attacker, card, target); }
    static renderCardLogs() { GameUI.renderCardLogs(); }
    static filterLogs(type: string) { (GameUI as any).filterLogs(type); }

    static showGlobalAlert(msg: string, playerName: string, isMyTurn: boolean, endsTurn: boolean = true) {
        GameUI.showGlobalAlert(msg, playerName, isMyTurn, endsTurn);
    }
    static confirmGlobalAlert() { GameUI.confirmGlobalAlert(); }
    static closeGlobalAlert() { GameUI.closeGlobalAlert(); }

    static openPokemonDetail(pIdx: number, sIdx: number, champ?: any) { (GameUI as any).openPokemonDetail(pIdx, sIdx, champ); }
    static openSwapModal(newMon: Pokemon) { (GameUI as any).openSwapModal(newMon); }
    static openLixeira(selectMode: boolean = false) { (GameUI as any).openLixeira(selectMode); }
    static openPlayerStats() { (GameUI as any).openPlayerStats(); }
    static showEventDetails() { (GameUI as any).showEventDetails(); }
    static openInventoryModal(pId: number, readOnly: boolean = false) { (GameUI as any).openInventoryModal(pId, readOnly); }
    static openCardLibrary() { (GameUI as any).openCardLibrary(); }
    static openItemLibrary() { (GameUI as any).openItemLibrary(); }
    static openBoardCards(pId: number) { (GameUI as any).openBoardCards(pId); }
    static openPokedex(pId: number, filterId: number | null = null) { (GameUI as any).openPokedex(pId, filterId); }
    static openPokedexEntry(targetId: number) { (GameUI as any).openPokedexEntry(targetId); }
    static filterPokedex() { (GameUI as any).filterPokedex(); }

    static openXpRules() { (GameUI as any).openXpRules(); }
    static openCaptureRules() { (GameUI as any).openCaptureRules(); }
    static openCombatRules() { (GameUI as any).openCombatRules(); }

    // ==========================================
    // PAINEL ADMIN E HOST
    // ==========================================
    static openAdminPanel() { (GameUI as any).openAdminPanel(); }
    static adminGiveCard() { (GameEvents as any).adminGiveCard(); }
    static adminClearDebuffs() { (GameEvents as any).adminClearDebuffs(); }
    static adminSetSkipTurns() { (GameEvents as any).adminSetSkipTurns(); }
    static adminGiveGold() { (GameEvents as any).adminGiveGold(); }
    static adminSetRound() { (GameEvents as any).adminSetRound(); }
    static adminSetTurn() { (GameEvents as any).adminSetTurn(); }

    // ==========================================
    // MÉTODOS DE MOVIMENTAÇÃO E DADOS
    // ==========================================
    static rollDice() { GameMovement.rollDice(); }
    static forceDice(val: number) { GameMovement.forceDice(val); }
    static debugMove() { GameMovement.debugMove(); }
    static performVisualStep(pId: number, x: number, y: number) { GameMovement.performVisualStep(pId, x, y); }
    static animateDice(result: number, playerId: number) { GameMovement.animateDice(result, playerId); }
    static showDiceChoice(r1: number, r2: number) { (GameMovement as any).showDiceChoice(r1, r2); }
    static chooseDice(val: number) { (GameMovement as any).chooseDice(val); }

    // ==========================================
    // MÉTODOS DE EVENTOS E TURNOS
    // ==========================================
    static nextTurn() { GameEvents.nextTurn(); }
    static handleTile(p: Player) { GameEvents.handleTile(p); }
    static handleCityChoice(c: string) { GameEvents.handleCityChoice(c); }
    static triggerVictory(winnerId: number) { GameEvents.triggerVictory(winnerId); }
    static handleTotalDefeat(p: Player) { GameEvents.handleTotalDefeat(p); }
    static rescueFromLixeira(idx: number) { GameEvents.rescueFromLixeira(idx); }
    static checkTurnControl() { GameEvents.checkTurnControl(); }
    static getLastCityCoord(p: Player) { return GameEvents.getLastCityCoord(p); }
    static placeTrap(x: number, y: number, ownerId: number) { (GameMovement as any).placeTrap(x, y, ownerId); }

    static addItem(player: Player, itemId: string, amount: number = 1) { GameEvents.addItem(player, itemId, amount); }
    static useItemBoard(key: string, pId: number) { GameEvents.useItemBoard(key, pId); }

    // ==========================================
    // SAVE E LOAD
    // ==========================================
    static saveGame() { GameState.saveGame(); }
    static loadGame() { GameState.loadGame(); }
    static getSaveData() { return GameState.getSaveData(); }
    static exportSave() { (GameState as any).exportSave(); }
    static importSave(i: HTMLInputElement) { (GameState as any).importSave(i); }

    // ==========================================
    // SPAWNS
    // ==========================================
    static generateWildPokemon(tileType: number) { return GameSpawns.generateWildPokemon(tileType); }
    static generateGymTeams() { GameSpawns.generateGymTeams(); }
}

// Vincula o Game ao window para comunicação com DOM e index.html
(window as any).Game = Game;