import { createClient, SupabaseClient } from '@supabase/supabase-js';

// No mundo real, essas chaves devem vir de variáveis de ambiente (ex: import.meta.env.VITE_SUPABASE_URL)
// Por enquanto, deixe strings vazias ou preencha com as corretas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pubyamgenwmctwithgvi.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_rI47u5yyya-EQ7UrwGSD3g_BjZOdh7Y';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

/**
 * ESTADO GLOBAL DA REDE
 * Mantém os dados da sessão, propriedades do jogador local e fila de requisições.
 */
export class NetworkState {
    static isOnline: boolean = false;
    static isHost: boolean = false;

    // Agora usando UUID do PostgreSQL para identificar o jogador no BD
    static myPlayerIdDb: string = "";

    // Opcional: manter o ID local (0, 1, 2) caso a UI do Game dependa fortemente dele
    static myPlayerIdLocal: number = -1;

    // Mantem o indice local usado pela UI e regras do tabuleiro.
    static get myPlayerId() { return this.myPlayerIdLocal; }
    static set myPlayerId(val: number) { this.myPlayerIdLocal = val; }

    static currentRoomId: string = "";
    static currentRoomAlias: string = "";
    static localName: string = "";
    static localAvatar: string = "";
    static isListenerActive: boolean = false;
    static lobbyPlayers: any[] = [];

    // Fila de ações para compatibilidade legada se ainda for usada em outro lugar
    static actionQueue: any[] = [];
    static isProcessingQueue: boolean = false;
}
