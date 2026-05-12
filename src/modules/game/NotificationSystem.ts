/**
 * NotificationSystem — Notificações nativas do browser para o modo online.
 * Usa visibilitychange (cobre troca de aba e minimizar em Chrome/Opera/Firefox).
 */
export class NotificationSystem {

    private static _lastNotifiedKey: string = '';
    private static _pendingCleanup: (() => void) | null = null;

    static async requestPermission(): Promise<void> {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'granted') return;
        if (Notification.permission !== 'denied') {
            await Notification.requestPermission();
        }
    }

    /**
     * Agenda/dispara a notificação "É a sua vez!".
     * - Tab já oculta → notifica imediatamente
     * - Tab visível → aguarda visibilitychange para 'hidden' e então notifica
     */
    static notifyMyTurn(playerName: string, round: number, turnId: number): void {
        if (!('Notification' in window)) return;
        if (Notification.permission !== 'granted') return;

        const key = `${round}-${turnId}`;
        if (this._lastNotifiedKey === key) return;
        this._lastNotifiedKey = key;

        // Remove listener pendente do turno anterior
        if (this._pendingCleanup) { this._pendingCleanup(); this._pendingCleanup = null; }

        // Tab já oculta (troca de aba ou janela minimizada) → notifica agora
        if (document.visibilityState === 'hidden') {
            this._send(playerName, round);
            return;
        }

        // Tab visível → ouve quando o jogador sair
        let notified = false;

        const onVisChange = () => {
            if (document.visibilityState !== 'hidden') return;
            if (notified) return;
            const Game = (window as any).Game;
            // Não notifica se o jogador já iniciou o turno
            if (Game && Game.turnStarted) { cleanup(); return; }
            notified = true;
            cleanup();
            this._send(playerName, round);
        };

        // Fallback: verifica a cada 30s caso visibilitychange não dispare
        const interval = setInterval(() => {
            if (notified) { clearInterval(interval); return; }
            const Game = (window as any).Game;
            if (Game && Game.turnStarted) { cleanup(); return; }
            if (document.visibilityState === 'hidden') {
                notified = true; cleanup(); this._send(playerName, round);
            }
        }, 30000);

        const cleanup = () => {
            document.removeEventListener('visibilitychange', onVisChange);
            clearInterval(interval);
        };

        document.addEventListener('visibilitychange', onVisChange);
        this._pendingCleanup = cleanup;
    }

    /** Cancela listener pendente — chamado quando o jogador inicia o turno */
    static cancelPending(): void {
        if (this._pendingCleanup) { this._pendingCleanup(); this._pendingCleanup = null; }
    }

    private static _send(playerName: string, round: number): void {
        try {
            const n = new Notification('🎮 PokéBoard — Sua vez!', {
                body: `${playerName}, é a sua vez de jogar! (Rodada ${round})`,
                icon: '/assets/img/icon-pokeboard.png',
                tag: 'pokeboard-turn',
            } as NotificationOptions);
            n.onclick = () => { window.focus(); n.close(); };
            setTimeout(() => n.close(), 15000);
        } catch (e) {
            console.warn('[NotificationSystem]', e);
        }
    }
}

(window as any).NotificationSystem = NotificationSystem;
