import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, NetworkState } from './SupabaseInit';

type MonitorHooks = {
    // Recria o canal do jogo (NetworkActions.setupGameLoopListener)
    resubscribe: () => void;
    // Ressincroniza turno, jogadores e logs a partir do banco
    resync: () => Promise<void> | void;
};

/**
 * MONITOR DE CONEXÃO
 * Reconecta o canal realtime da partida de forma transparente (backoff 1s, 2s, 4s... até 15s)
 * e ressincroniza o estado quando a conexão volta, a rede retorna ou a aba volta do background.
 */
export class ConnectionMonitor {
    private static channel: RealtimeChannel | null = null;
    private static hooks: MonitorHooks | null = null;
    private static lastStatus: string = '';
    private static hasSubscribedOnce: boolean = false;
    private static isReconnecting: boolean = false;
    private static retryAttempt: number = 0;
    private static retryTimer: number | null = null;
    private static hiddenAt: number = 0;
    private static globalListenersInstalled: boolean = false;
    private static resyncPromise: Promise<void> | null = null;
    private static pillHideTimer: number | null = null;

    private static readonly MAX_DELAY_MS = 15000;
    private static readonly HIDDEN_RESYNC_MS = 20000;

    // Chamado a cada (re)criação do canal do jogo
    static watch(channel: RealtimeChannel, hooks: MonitorHooks) {
        this.channel = channel;
        this.hooks = hooks;
        this.lastStatus = '';
        this.installGlobalListeners();
    }

    // Callback de channel.subscribe()
    static handleStatus(channel: RealtimeChannel, status: string) {
        // Status de canais antigos (removidos de propósito) são ignorados
        if (channel !== this.channel) return;
        if (!NetworkState.isOnline) return;
        this.lastStatus = status;

        if (status === 'SUBSCRIBED') {
            this.retryAttempt = 0;
            this.clearRetryTimer();
            if (this.hasSubscribedOnce && this.isReconnecting) {
                this.isReconnecting = false;
                this.runResync().finally(() => this.showPill('Conectado', true));
            }
            this.hasSubscribedOnce = true;
            return;
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            this.scheduleReconnect();
        }
    }

    private static scheduleReconnect(immediate: boolean = false) {
        if (!NetworkState.isOnline || !this.hooks) return;
        this.isReconnecting = true;
        this.showPill('Reconectando…');
        if (this.retryTimer !== null) {
            if (!immediate) return;
            this.clearRetryTimer();
        }
        const delay = immediate ? 0 : Math.min(1000 * Math.pow(2, this.retryAttempt), this.MAX_DELAY_MS);
        this.retryAttempt++;
        this.retryTimer = window.setTimeout(() => {
            this.retryTimer = null;
            this.reconnectNow();
        }, delay);
    }

    private static async reconnectNow() {
        if (!NetworkState.isOnline || !this.hooks) return;
        const old = this.channel;
        this.channel = null;
        if (old) {
            try {
                await supabase.removeChannel(old);
            } catch (e) { /* segue mesmo assim */ }
            // supabase.channel() devolve o canal existente se o tópico ainda estiver registrado
            if (supabase.getChannels().includes(old)) {
                old.teardown();
                (supabase.realtime as any)._remove?.(old);
            }
        }
        NetworkState.isListenerActive = false;
        this.hooks.resubscribe();
    }

    private static clearRetryTimer() {
        if (this.retryTimer !== null) {
            window.clearTimeout(this.retryTimer);
            this.retryTimer = null;
        }
    }

    private static runResync(): Promise<void> {
        if (this.resyncPromise) return this.resyncPromise;
        const hooks = this.hooks;
        if (!hooks || !NetworkState.isOnline) return Promise.resolve();
        this.resyncPromise = Promise.resolve()
            .then(() => hooks.resync())
            .catch((err) => console.warn('[ConnectionMonitor] Falha ao ressincronizar:', err))
            .finally(() => { this.resyncPromise = null; });
        return this.resyncPromise;
    }

    // Rede voltou ou aba voltou do background: reconecta se o canal caiu, senão só ressincroniza
    private static checkHealth() {
        if (!NetworkState.isOnline || !this.hooks) return;
        const joined = this.channel && this.lastStatus === 'SUBSCRIBED' && (this.channel as any).state !== 'errored' && (this.channel as any).state !== 'closed';
        if (!joined) {
            this.retryAttempt = 0;
            this.scheduleReconnect(true);
        } else {
            const pillVisible = document.getElementById('connection-pill')?.classList.contains('is-visible');
            this.runResync().finally(() => {
                if (pillVisible && !this.isReconnecting) this.showPill('Conectado', true);
            });
        }
    }

    private static installGlobalListeners() {
        if (this.globalListenersInstalled) return;
        this.globalListenersInstalled = true;

        window.addEventListener('online', () => this.checkHealth());
        window.addEventListener('offline', () => {
            if (NetworkState.isOnline && this.hooks) this.showPill('Reconectando…');
        });
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.hiddenAt = Date.now();
                return;
            }
            const hiddenFor = this.hiddenAt ? Date.now() - this.hiddenAt : 0;
            this.hiddenAt = 0;
            // Navegadores mobile suspendem o websocket em background
            if (hiddenFor > this.HIDDEN_RESYNC_MS) this.checkHealth();
        });
    }

    // --- Pílula de status (não bloqueante) ---

    private static ensurePill(): HTMLElement {
        let pill = document.getElementById('connection-pill');
        if (pill) return pill;

        if (!document.getElementById('connection-pill-style')) {
            const style = document.createElement('style');
            style.id = 'connection-pill-style';
            style.textContent = `
#connection-pill {
    position: fixed;
    top: calc(env(safe-area-inset-top, 0px) + 10px);
    left: 50%;
    transform: translate(-50%, -6px);
    z-index: 2600;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: 999px;
    background: #141d25;
    border: 1px solid #3a4b5c;
    color: #e8eef2;
    font: 600 13px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease, transform 0.3s ease;
    white-space: nowrap;
}
#connection-pill.is-visible { opacity: 1; transform: translate(-50%, 0); }
#connection-pill .connection-pill-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #e8b84a;
    animation: connection-pill-pulse 1s ease-in-out infinite;
}
#connection-pill.is-ok .connection-pill-dot { background: #4cc38a; animation: none; }
@keyframes connection-pill-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
@media (prefers-reduced-motion: reduce) {
    #connection-pill, #connection-pill .connection-pill-dot { transition: none; animation: none; }
}`;
            document.head.appendChild(style);
        }

        pill = document.createElement('div');
        pill.id = 'connection-pill';
        pill.setAttribute('role', 'status');
        pill.setAttribute('aria-live', 'polite');
        const dot = document.createElement('span');
        dot.className = 'connection-pill-dot';
        const label = document.createElement('span');
        label.className = 'connection-pill-label';
        pill.append(dot, label);
        document.body.appendChild(pill);
        return pill;
    }

    private static showPill(text: string, autoHide: boolean = false) {
        const pill = this.ensurePill();
        const label = pill.querySelector('.connection-pill-label');
        if (label) label.textContent = text;
        pill.classList.toggle('is-ok', autoHide);
        // Força reflow para a transição funcionar na primeira exibição
        void pill.offsetWidth;
        pill.classList.add('is-visible');

        if (this.pillHideTimer !== null) {
            window.clearTimeout(this.pillHideTimer);
            this.pillHideTimer = null;
        }
        if (autoHide) {
            this.pillHideTimer = window.setTimeout(() => {
                this.pillHideTimer = null;
                pill.classList.remove('is-visible');
            }, 1500);
        }
    }
}
