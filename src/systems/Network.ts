import { db, NetworkState } from '../modules/network/FirebaseInit';
import { NetworkSync } from '../modules/network/NetworkSync';
import { NetworkActions } from '../modules/network/NetworkActions';
import type { Player } from '../models/Player';

export { db };

export class Network {

    // --- PROPRIEDADES E ESTADOS (Mapeando para o FirebaseInit) ---
    static get isOnline() { return NetworkState.isOnline; }
    static set isOnline(val) { NetworkState.isOnline = val; }

    static get isHost() { return NetworkState.isHost; }
    static set isHost(val) { NetworkState.isHost = val; }

    static get myPlayerId() { return NetworkState.myPlayerId; }
    static set myPlayerId(val) { NetworkState.myPlayerId = val; }

    static get currentRoomId() { return NetworkState.currentRoomId; }
    static set currentRoomId(val) { NetworkState.currentRoomId = val; }

    static get localName() { return NetworkState.localName; }
    static set localName(val) { NetworkState.localName = val; }

    static get localAvatar() { return NetworkState.localAvatar; }
    static set localAvatar(val) { NetworkState.localAvatar = val; }

    static get isListenerActive() { return NetworkState.isListenerActive; }
    static set isListenerActive(val) { NetworkState.isListenerActive = val; }

    static get lobbyPlayers() { return NetworkState.lobbyPlayers; }
    static set lobbyPlayers(val) { NetworkState.lobbyPlayers = val; }

    static get actionQueue() { return NetworkState.actionQueue; }
    static set actionQueue(val) { NetworkState.actionQueue = val; }

    static get isProcessingQueue() { return NetworkState.isProcessingQueue; }
    static set isProcessingQueue(val) { NetworkState.isProcessingQueue = val; }

    // --- INPUTS E LOBBY ---
    static checkInput() { return NetworkActions.checkInput(); }
    static reconnect() { return NetworkActions.reconnect(); }
    static async createRoom() { return await NetworkActions.createRoom(); }
    static async joinRoom(roomCode?: string) { return await NetworkActions.joinRoom(roomCode); }
    static setupLobbyListener() { NetworkActions.setupLobbyListener(); }
    static async initializeGameFromFirebase() { await NetworkActions.initializeGameFromFirebase(); }
    static setupGameLoopListener() { NetworkActions.setupGameLoopListener(); }

    // --- AÇÕES REMOTAS (QUEUE) ---
    static handleRemoteAction(action: any) { NetworkActions.handleRemoteAction(action); }
    static sendAction(type: string, payload: any) { NetworkActions.sendAction(type, payload); }
    static async processQueue() { await NetworkActions.processQueue(); }

    // --- SINCRONIZAÇÃO E DADOS ---
    static getSanitizedTeam(team: any[]) { return NetworkSync.getSanitizedTeam(team); }
    static async loadGlobalChampion() { await NetworkSync.loadGlobalChampion(); }
    static async saveGlobalChampion(player: Player) { await NetworkSync.saveGlobalChampion(player); }
    static syncPlayerState() { NetworkSync.syncPlayerState(); }
    static sendState() { NetworkSync.sendState(); }
    static syncSpecificPlayer(targetId: number) { NetworkSync.syncSpecificPlayer(targetId); }
    static syncPlayers(ids: number[]) { NetworkSync.syncPlayers(ids); }
    static syncLogs(logs: any[]) { NetworkSync.syncLogs(logs); }
    static syncCardLogs(logs: any[]) { NetworkSync.syncCardLogs(logs); }
    static syncTurn(newTurn: number, newRound: number = 1) { NetworkSync.syncTurn(newTurn, newRound); }
    static syncLixeira() { NetworkSync.syncLixeira(); }
    static syncBattleLogs(battleId: string, logs: string[]) { NetworkSync.syncBattleLogs(battleId, logs); }
    static async syncTurnState() { await NetworkActions.syncTurnState(); }
}

// Vincula o Network ao window para permitir chamadas no DOM
(window as any).Network = Network;