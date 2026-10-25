/**
 * PWA: registra o service worker (somente em produção, para não interferir no HMR do Vite).
 */
export class PwaSetup {
    private static initialized = false;

    static init() {
        if (this.initialized) return;
        this.initialized = true;

        if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

        const register = () => {
            navigator.serviceWorker.register('/sw.js').catch((err) => {
                console.warn('[PWA] Falha ao registrar o service worker:', err);
            });
        };

        if (document.readyState === 'complete') register();
        else window.addEventListener('load', register, { once: true });
    }
}
