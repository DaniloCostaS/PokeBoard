// Qualidade gráfica: "auto" começa completa e cai para "leve" sozinha se o aparelho não sustentar o tabuleiro.
// O modo leve tira blur, brilhos pulsantes e partículas (ver html.pb-lite em performance.css) e reduz a resolução do tabuleiro.

export type QualityMode = 'auto' | 'high' | 'lite';

const KEY = 'pb_quality';
const WINDOW_MS = 3000;

export class Quality {
    private static stored: QualityMode | null = null;
    private static demoted = false;
    private static listeners = new Set<() => void>();
    private static sum = 0;
    private static count = 0;
    private static started = 0;
    private static badWindows = 0;

    static get mode(): QualityMode {
        if (this.stored) return this.stored;
        let v: string | null = null;
        try { v = localStorage.getItem(KEY); } catch { /* padrão */ }
        return (this.stored = v === 'high' || v === 'lite' ? v : 'auto');
    }

    static set mode(value: QualityMode) {
        this.stored = value;
        this.demoted = false;
        this.badWindows = 0;
        try { localStorage.setItem(KEY, value); } catch { /* só nesta sessão */ }
        this.apply();
    }

    private static weakDevice() {
        const n = navigator as any;
        return !!n.connection?.saveData || (n.deviceMemory !== undefined && n.deviceMemory <= 2) || (navigator.hardwareConcurrency || 8) <= 2;
    }

    // Lido a cada quadro: o valor fica guardado e só é recalculado quando a qualidade muda
    private static liteNow: boolean | null = null;
    private static idleNow = 60;

    private static compute() {
        const lite = this.mode === 'lite' || (this.mode === 'auto' && (this.demoted || this.weakDevice()));
        const strong = (navigator.hardwareConcurrency || 4) >= 8 && !matchMedia('(pointer: coarse)').matches;
        this.liteNow = lite;
        this.idleNow = lite ? 20 : (strong || this.mode === 'high' ? 60 : 30);
    }

    static get lite(): boolean {
        if (this.liteNow === null) this.compute();
        return this.liteNow!;
    }

    // FPS do tabuleiro parado (sem peão andando nem câmera se mexendo). Aparelho forte mantém 60
    static get idleFps(): number {
        if (this.liteNow === null) this.compute();
        return this.idleNow;
    }

    static get resolution(): number {
        const dpr = window.devicePixelRatio || 1;
        return this.lite ? Math.min(dpr, 1) : Math.min(dpr, 2);
    }

    // MSAA custa caro em GPU de celular e quase não aparece em telas densas
    static get antialias(): boolean {
        return !this.lite && (window.devicePixelRatio || 1) < 1.5;
    }

    static onChange(fn: () => void) { this.listeners.add(fn); }

    private static apply() {
        this.compute();
        document.documentElement.classList.toggle('pb-lite', this.lite);
        document.querySelectorAll<HTMLSelectElement>('[data-pb-quality]').forEach(sel => { sel.value = this.mode; });
        this.listeners.forEach(fn => fn());
    }

    // Chamado a cada quadro do tabuleiro; quedas longas (aba em segundo plano, janela aberta) não contam
    static reportFrame(dtMs: number, targetMs: number, now: number) {
        if (this.mode !== 'auto' || this.lite || dtMs > 500) return;
        if (!this.started) this.started = now;
        this.sum += dtMs;
        this.count++;
        if (now - this.started < WINDOW_MS) return;
        const avg = this.sum / this.count;
        this.sum = 0; this.count = 0; this.started = now;
        this.badWindows = avg > Math.max(targetMs * 1.6, 40) ? this.badWindows + 1 : 0;
        if (this.badWindows >= 2) {
            this.demoted = true;
            console.info('[Quality] Aparelho abaixo do esperado: modo leve ligado.', Math.round(avg), 'ms/quadro');
            this.apply();
        }
    }

    static init() {
        document.querySelectorAll<HTMLSelectElement>('[data-pb-quality]').forEach(sel => {
            sel.addEventListener('change', () => { this.mode = sel.value as QualityMode; });
        });
        this.apply();
    }
}

(window as any).PBQuality = Quality;
