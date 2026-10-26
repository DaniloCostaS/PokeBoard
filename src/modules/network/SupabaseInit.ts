import { createClient, SupabaseClient } from '@supabase/supabase-js';

// No mundo real, essas chaves devem vir de variáveis de ambiente (ex: import.meta.env.VITE_SUPABASE_URL)
// Por enquanto, deixe strings vazias ou preencha com as corretas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pubyamgenwmctwithgvi.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1YnlhbWdlbndtY3R3aXRoZ3ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzIyNTQsImV4cCI6MjA5Njg0ODI1NH0.mvNZ3PY7Instrzyz-DwBhWEkHkM46LPPeGRh5ctONp4';

// Heartbeat do realtime num Web Worker: em aba de fundo o navegador segura os timers da página e o servidor
// derrubava o websocket em silêncio (a vez só aparecia depois de um F5)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
    realtime: {
        worker: typeof window !== 'undefined' && 'Worker' in window,
        heartbeatIntervalMs: 15000,
        heartbeatCallback: (status) => NetworkState.onHeartbeat?.(status)
    }
});

/**
 * ESTADO GLOBAL DA REDE
 * Mantém os dados da sessão, propriedades do jogador local e fila de requisições.
 */
export class NetworkState {
    static isOnline: boolean = false;
    static isHost: boolean = false;
    // Espectador: assiste uma partida em andamento sem ocupar vaga, sem ver cartas e sem gravar nada
    static isSpectator: boolean = false;

    // Agora usando UUID do PostgreSQL para identificar o jogador no BD
    static myPlayerIdDb: string = "";

    // Opcional: manter o ID local (0, 1, 2) caso a UI do Game dependa fortemente dele
    static myPlayerIdLocal: number = -1;

    // Mantem o indice local usado pela UI e regras do tabuleiro.
    static get myPlayerId() { return this.myPlayerIdLocal; }
    static set myPlayerId(val: number) { this.myPlayerIdLocal = val; }

    static currentRoomId: string = "";
    static currentRoomAlias: string = "";
    // Conta que criou a sala (marca o HOST na lista)
    static roomHostUserId: string = "";
    static localName: string = "";
    static localAvatar: string = "";
    static isListenerActive: boolean = false;
    // Quando este cliente gravou a vez pela última vez: a leitura do banco pode chegar antes da própria gravação
    static lastTurnWriteAt: number = 0;
    // Registrado pelo ConnectionMonitor (evita import circular)
    static onHeartbeat: ((status: string) => void) | null = null;
    static lobbyPlayers: any[] = [];

}
