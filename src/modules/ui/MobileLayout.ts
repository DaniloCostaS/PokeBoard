// Controles do layout mobile: o painel de log vira uma gaveta inferior aberta pela barra de ação.
const MOBILE_QUERY = window.matchMedia('(max-width: 1000px)');

export class MobileLayout {
    private static backdrop: HTMLElement | null = null;

    static isMobile() {
        return MOBILE_QUERY.matches;
    }

    static init() {
        if (this.backdrop) return;
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'pb-sheet-backdrop';
        this.backdrop.addEventListener('click', () => this.toggleLog(false));
        document.body.appendChild(this.backdrop);

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') this.toggleLog(false);
        });

        // Ao voltar para desktop, a gaveta não pode ficar presa aberta
        MOBILE_QUERY.addEventListener('change', () => {
            if (!this.isMobile()) this.toggleLog(false);
        });

        // Indica log novo enquanto a gaveta está fechada
        const logContainer = document.getElementById('log-container');
        const dot = document.getElementById('pb-log-dot');
        if (logContainer && dot) {
            new MutationObserver(() => {
                if (this.isMobile() && !this.isLogOpen()) dot.hidden = false;
            }).observe(logContainer, { childList: true });
        }
    }

    static isLogOpen() {
        return document.getElementById('right-panel-wrapper')?.classList.contains('is-open') || false;
    }

    static toggleLog(force?: boolean) {
        const wrapper = document.getElementById('right-panel-wrapper');
        if (!wrapper) return;
        const open = force ?? !this.isLogOpen();
        wrapper.classList.toggle('is-open', open);
        this.backdrop?.classList.toggle('is-open', open);
        if (open) {
            const dot = document.getElementById('pb-log-dot');
            if (dot) dot.hidden = true;
        }
    }
}

(window as any).PBLayout = MobileLayout;
