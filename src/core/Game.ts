import { GameState } from '../modules/game/GameState';
import { GameUI } from '../modules/game/GameUI';
import { GameEvents } from '../modules/game/GameEvents';
import { GameMovement } from '../modules/game/GameMovement';
import { GameSpawns } from '../modules/game/GameSpawns';
import { Player } from '../models/Player';
import { Pokemon } from '../models/Pokemon';

/**
 * FACADE PRINCIPAL
 * Este arquivo atua como um tradutor. Ele recebe as chamadas antigas do 
 * sistema e delega para os novos módulos que criamos.
 */
export class Game {

    // --- ESTADO GLOBAL (Getters/Setters para não quebrar compatibilidade) ---
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

    // --- MÉTODOS NUCLEARES ---
    static init(players: Player[], mapSize: number) { GameState.init(players, mapSize); }
    static getCurrentPlayer() { return GameState.getCurrentPlayer(); }
    static canAct() { return GameState.canAct(); }
    static getGlobalAverageLevel() { return GameState.getGlobalAverageLevel(); }

    // --- MÉTODOS DE RENDERIZAÇÃO (UI) ---
    static updateHUD() { GameUI.updateHUD(); }
    static renderBoard() { GameUI.renderBoard(); }
    static renderTraps(newTraps?: any[]) { GameUI.renderTraps(newTraps); }
    static moveVisuals() { GameUI.moveVisuals(); }
    static renderChampionBanner() { (GameUI as any).renderChampionBanner(); } // Caso tenha migrado a função

    static log(m: string, actionPlayerId?: number) { GameUI.log(m, actionPlayerId); }
    static sendGlobalLog(msg: string) { GameUI.sendGlobalLog(msg); }
    static filterLogs(type: string) { (GameUI as any).filterLogs(type); }

    static showGlobalAlert(msg: string, playerName: string, isMyTurn: boolean, endsTurn: boolean = true) {
        GameUI.showGlobalAlert(msg, playerName, isMyTurn, endsTurn);
    }
    static confirmGlobalAlert() { GameUI.confirmGlobalAlert(); }
    static closeGlobalAlert() { GameUI.closeGlobalAlert(); }

    static openPokemonDetail(pIdx: number, sIdx: number, champ?: any) { GameUI.openPokemonDetail(pIdx, sIdx, champ); }
    static openSwapModal(newMon: Pokemon) { GameUI.openSwapModal(newMon); }
    static openLixeira(selectMode: boolean = false) { GameUI.openLixeira(selectMode); }
    static openPlayerStats() { GameUI.openPlayerStats(); }
    static openInventoryModal(pId: number, readOnly: boolean = false) { GameUI.openInventoryModal(pId, readOnly); }
    static openCardLibrary() { GameUI.openCardLibrary(); }
    static openBoardCards(pId: number) { GameUI.openBoardCards(pId); }
    static openPokedex(pId: number, filterId: number | null = null) { GameUI.openPokedex(pId, filterId); }
    static openPokedexEntry(targetId: number) { GameUI.openPokedexEntry(targetId); }
    static filterPokedex() { GameUI.filterPokedex(); }
    static openXpRules() { GameUI.openXpRules(); }
    static openCaptureRules() { GameUI.openCaptureRules(); }
    static openCombatRules() { GameUI.openCombatRules(); }

    // --- MÉTODOS DE MOVIMENTAÇÃO E DADOS ---
    static rollDice() { GameMovement.rollDice(); }
    static forceDice(val: number) { GameMovement.forceDice(val); }
    static debugMove() { GameMovement.debugMove(); }

    // --- MÉTODOS DE EVENTOS ---
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

    // (Caso alguma carta, logica de evento ou UI usar alguma variável que eu não tenha mapeado,
    // basta criar o proxy correspondente aqui)
}

// Vincula a Game ao window para chamadas originárias do HTML "onclick=window.Game.rollDice()"
(window as any).Game = Game;