import { GameState } from '../modules/game/GameState';
import { GameUI } from '../modules/game/GameUI';
import { GameEvents } from '../modules/game/GameEvents';
import { GameMovement } from '../modules/game/GameMovement';
import { GameSpawns } from '../modules/game/GameSpawns';
import { Player } from '../models/Player';
import { Pokemon } from '../models/Pokemon';

/**
 * FACADE PRINCIPAL
 */
export class Game {

    // --- ESTADO GLOBAL ---
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

    static get currentGlobalEvent() { return GameState.currentGlobalEvent; }
    static get lixeira() { return GameState.lixeira; }

    // --- MÉTODOS NUCLEARES ---
    static init(players: Player[], mapSize: number) { GameState.init(players, mapSize); }
    static getCurrentPlayer() { return GameState.getCurrentPlayer(); }
    static canAct() { return GameState.canAct(); }
    static getGlobalAverageLevel() { return GameState.getGlobalAverageLevel(); }

    // --- MÉTODOS DE RENDERIZAÇÃO E UI (GameUI) ---
    static updateHUD() { GameUI.updateHUD(); }
    static renderBoard() { GameUI.renderBoard(); }
    static renderTraps(newTraps?: any[]) { GameUI.renderTraps(newTraps); }
    static moveVisuals() { GameUI.moveVisuals(); }
    static renderChampionBanner() { (GameUI as any).renderChampionBanner(); }

    static log(m: string, actionPlayerId?: number) { GameUI.log(m, actionPlayerId); }
    static sendGlobalLog(msg: string) { GameUI.sendGlobalLog(msg); }
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
    static openBoardCards(pId: number) { (GameUI as any).openBoardCards(pId); }
    static openPokedex(pId: number, filterId: number | null = null) { (GameUI as any).openPokedex(pId, filterId); }
    static openPokedexEntry(targetId: number) { (GameUI as any).openPokedexEntry(targetId); }
    static filterPokedex() { (GameUI as any).filterPokedex(); }

    static openXpRules() { (GameUI as any).openXpRules(); }
    static openCaptureRules() { (GameUI as any).openCaptureRules(); }
    static openCombatRules() { (GameUI as any).openCombatRules(); }

    // --- PAINEL ADMIN ---
    static openAdminPanel() { (GameUI as any).openAdminPanel(); }
    static adminGiveCard() { (GameEvents as any).adminGiveCard(); }
    static adminClearDebuffs() { (GameEvents as any).adminClearDebuffs(); }
    static adminSetSkipTurns() { (GameEvents as any).adminSetSkipTurns(); }
    static adminGiveGold() { (GameEvents as any).adminGiveGold(); }
    static adminSetRound() { (GameEvents as any).adminSetRound(); }
    static adminSetTurn() { (GameEvents as any).adminSetTurn(); }

    // --- MÉTODOS DE MOVIMENTAÇÃO E DADOS ---
    static rollDice() { GameMovement.rollDice(); }
    static forceDice(val: number) { GameMovement.forceDice(val); }
    static debugMove() { GameMovement.debugMove(); }
    static performVisualStep(pId: number, x: number, y: number) { GameMovement.performVisualStep(pId, x, y); }
    static animateDice(result: number, playerId: number) { GameMovement.animateDice(result, playerId); }

    // --- MÉTODOS DE EVENTOS E TURNOS (GameEvents) ---
    static nextTurn() { GameEvents.nextTurn(); }
    static handleTile(p: Player) { GameEvents.handleTile(p); }
    static handleCityChoice(c: string) { GameEvents.handleCityChoice(c); }
    static triggerVictory(winnerId: number) { GameEvents.triggerVictory(winnerId); }
    static handleTotalDefeat(p: Player) { GameEvents.handleTotalDefeat(p); }
    static rescueFromLixeira(idx: number) { GameEvents.rescueFromLixeira(idx); }
    static checkTurnControl() { GameEvents.checkTurnControl(); }

    static addItem(player: Player, itemId: string, amount: number = 1) { GameEvents.addItem(player, itemId, amount); }
    static useItemBoard(key: string, pId: number) { GameEvents.useItemBoard(key, pId); }

    // --- SAVE E LOAD ---
    static saveGame() { GameState.saveGame(); }
    static loadGame() { GameState.loadGame(); }
    static getSaveData() { return GameState.getSaveData(); }

    // --- SPAWNS ---
    static generateWildPokemon(tileType: number) { return GameSpawns.generateWildPokemon(tileType); }
    static generateGymTeams() { GameSpawns.generateGymTeams(); }
}

// Vincula o Game ao window
(window as any).Game = Game;