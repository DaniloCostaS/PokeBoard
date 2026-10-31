import { supabase, NetworkState } from '../modules/network/SupabaseInit';
import { NetworkSync } from '../modules/network/NetworkSync';
import { NetworkActions } from '../modules/network/NetworkActions';
import type { Player } from '../models/Player';

export { supabase as db }; // Maintain backwards compatibility for now, or just export supabase

export class Network {

    // --- PROPRIEDADES E ESTADOS ---
    static get isOnline() { return NetworkState.isOnline; }
    static set isOnline(val) { NetworkState.isOnline = val; }

    static get isSpectator() { return NetworkState.isSpectator; }
    static get isHost() { return NetworkState.isHost; }
    static set isHost(val) { NetworkState.isHost = val; }

    static get myPlayerId() { return NetworkState.myPlayerId; }
    static set myPlayerId(val) { NetworkState.myPlayerId = val; }

    static get myPlayerIdDb() { return NetworkState.myPlayerIdDb; }
    static set myPlayerIdDb(val) { NetworkState.myPlayerIdDb = val; }

    static get currentRoomId() { return NetworkState.currentRoomId; }
    static set currentRoomId(val) { NetworkState.currentRoomId = val; }

    static get currentRoomAlias() { return NetworkState.currentRoomAlias; }
    static set currentRoomAlias(val) { NetworkState.currentRoomAlias = val; }

    static get localName() { return NetworkState.localName; }
    static set localName(val) { NetworkState.localName = val; }

    static get localAvatar() { return NetworkState.localAvatar; }
    static set localAvatar(val) { NetworkState.localAvatar = val; }

    static get isListenerActive() { return NetworkState.isListenerActive; }
    static set isListenerActive(val) { NetworkState.isListenerActive = val; }

    static get lobbyPlayers() { return NetworkState.lobbyPlayers; }
    static set lobbyPlayers(val) { NetworkState.lobbyPlayers = val; }



    static get supabase() { return supabase; }

    // --- INPUTS E LOBBY ---
    static checkInput() { return NetworkActions.checkInput(); }
    static reconnect(roomId?: string, pid?: string) { return NetworkActions.reconnect(roomId, pid); }
    static async findUnfinishedMatch() { return await NetworkActions.findUnfinishedMatch(); }
    static async generateRoom() { return await NetworkActions.generateRoom(); }
    static async cancelDraftRoom() { return await NetworkActions.cancelDraftRoom(); }
    static async leaveLobby() { return await NetworkActions.leaveLobby(); }
    static async deleteRoom(roomId: string) { return await NetworkActions.deleteRoom(roomId); }
    static async joinRoom(roomCode?: string, password?: string) { return await NetworkActions.joinRoom(roomCode, password); }
    static async spectateRoom(roomId: string) { return await NetworkActions.spectateRoom(roomId); }
    static leaveSpectator() { NetworkActions.leaveSpectator(); }
    static setupLobbyListener() { NetworkActions.setupLobbyListener(); }
    static async removePlayer(playerId: number) { await NetworkActions.removePlayer(playerId); }
    static async initializeGameFromSupabase() { await NetworkActions.initializeGameFromSupabase(); }
    static setupGameLoopListener() { NetworkActions.setupGameLoopListener(); }

    // --- AÇÕES REMOTAS (QUEUE) ---
    static handleRemoteAction(action: any) { NetworkActions.handleRemoteAction(action); }
    static sendAction(type: string, payload: any) { NetworkActions.sendAction(type, payload); }

    // --- SINCRONIZAÇÃO E DADOS ---
    static getSanitizedTeam(team: any[]) { return NetworkSync.getSanitizedTeam(team); }
    static async loadGlobalChampion() { await NetworkSync.loadGlobalChampion(); }
    static async saveGlobalChampion(player: Player) { await NetworkSync.saveGlobalChampion(player); }
    static syncPlayerState() { NetworkSync.syncPlayerState(); }
    static syncSpecificPlayer(targetId: number, force: boolean = false) { NetworkSync.syncSpecificPlayer(targetId, force); }
    static syncPlayers(ids: number[], force: boolean = false) { NetworkSync.syncPlayers(ids, force); }
    static syncPlayerObjects(players: Player[], force: boolean = false) { NetworkSync.syncPlayerObjects(players, force); }
    static canSyncDatabase() { return NetworkSync.canSyncDatabase(); }
    static syncLogs(logs: any[]) { NetworkSync.syncLogs(logs); }
    static syncCardLogs(logs: any[]) { NetworkSync.syncCardLogs(logs); }
    static syncTurn(newTurn: number, newRound: number = 1) { NetworkSync.syncTurn(newTurn, newRound); }
    static syncLixeira() { NetworkSync.syncLixeira(); }
    static async syncTurnState() { await NetworkActions.syncTurnState(); }
    static async syncLogsManually() { await NetworkActions.syncLogsManually(); }
    static async syncCardLogsManually() { await NetworkActions.syncCardLogsManually(); }
}

// Vincula o Network ao window para permitir chamadas no DOM
(window as any).Network = Network;
