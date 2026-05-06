import { firebaseConfig } from '../../constants/connectConfig';
import { initializeApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';

let app;
export let db: Database;

try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
} catch (e) {
    console.error("Erro ao inicializar Firebase", e);
}

/**
 * ESTADO GLOBAL DA REDE
 * Mantém os dados da sessão, propriedades do jogador local e fila de requisições.
 */
export class NetworkState {
    static isOnline: boolean = false;
    static isHost: boolean = false;
    static myPlayerId: number = -1;
    static currentRoomId: string = "";
    static localName: string = "";
    static localAvatar: string = "";
    static isListenerActive: boolean = false;
    static lobbyPlayers: any[] = [];

    // Fila de ações para evitar sobreposição (Race Condition) no Firebase
    static actionQueue: any[] = [];
    static isProcessingQueue: boolean = false;
}