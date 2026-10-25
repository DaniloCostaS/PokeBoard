/**
 * GameDialog — diálogos "dentro do jogo" (substituem alert/confirm/prompt nativos).
 *
 * Exposto também como `window.GameDialog`. Estilos em `src/dialog.css`.
 * Todas as mensagens são renderizadas como TEXTO (textContent); `\n` vira quebra de linha.
 *
 * API (estável — outros módulos dependem dela):
 *
 *   GameDialog.toast(message, { tone?: 'info'|'success'|'warning'|'danger', duration?: ms }): void
 *     Aviso não bloqueante, empilhado, some sozinho (~2.8s, mais tempo para textos longos).
 *     Toque/clique fecha. Topo central no desktop; acima da barra de ação no mobile.
 *
 *   GameDialog.alert(message, { title?, okLabel? }): Promise<void>
 *   GameDialog.confirm(message, { title?, okLabel?, cancelLabel?, danger? }): Promise<boolean>
 *   GameDialog.prompt(message, { title?, defaultValue?, placeholder?, inputMode?, okLabel?, cancelLabel? }): Promise<string | null>
 *     Modais do jogo. Ficam em fila: um de cada vez, na ordem de chamada.
 *     Esc = cancelar (confirm → false, prompt → null, alert → resolve). Enter = confirmar.
 *
 *   GameDialog.say({ name, portrait?, text, side?: 'left'|'right' }): Promise<void>
 *     Caixa de fala estilo Pokémon: retrato, etiqueta de nome, texto em máquina de escrever.
 *     Toque/clique/Enter/Espaço termina a linha; o segundo toque fecha. Resolve ao fechar.
 *     Também entra na fila dos modais (várias falas seguidas tocam em sequência).
 *
 *   GameDialog.typewriter(el, text, { cps? }): { finish(): void; readonly done: boolean; promise: Promise<void> }
 *     Utilitário usado pelo aviso do tabuleiro (GameUI.showGlobalAlert). Respeita prefers-reduced-motion.
 *
 *   GameDialog.isOpen(): boolean — há algum modal do GameDialog aberto.
 */

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export interface ToastOptions { tone?: ToastTone; duration?: number; }
export interface AlertOptions { title?: string; okLabel?: string; }
export interface ConfirmOptions { title?: string; okLabel?: string; cancelLabel?: string; danger?: boolean; }
export interface PromptOptions {
    title?: string; defaultValue?: string; placeholder?: string;
    inputMode?: 'text' | 'numeric'; okLabel?: string; cancelLabel?: string;
}
export interface SayOptions { name: string; portrait?: string; text: string; side?: 'left' | 'right'; }

export interface TypewriterHandle { finish(): void; readonly done: boolean; promise: Promise<void>; }

const MAX_LEN = 2000;

function clean(message: unknown): string {
    let s = message == null ? '' : String(message);
    if (s.length > MAX_LEN) s = s.slice(0, MAX_LEN) + '…';
    return s;
}

function reducedMotion(): boolean {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
}

function button(label: string, variant: 'primary' | 'green' | 'secondary' | 'danger'): HTMLButtonElement {
    const cls = variant === 'secondary' ? 'btn btn-secondary' : variant === 'green' ? 'btn btn-start-turn' : 'btn btn-roll';
    const b = el('button', `${cls} pb-dlg-btn`, label);
    b.type = 'button';
    return b;
}

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------
let toastStack: HTMLElement | null = null;

function getToastStack(): HTMLElement {
    if (toastStack && document.body.contains(toastStack)) return toastStack;
    toastStack = el('div', 'pb-toast-stack');
    toastStack.setAttribute('aria-live', 'polite');
    toastStack.setAttribute('role', 'status');
    document.body.appendChild(toastStack);
    return toastStack;
}

function toast(message: unknown, opts: ToastOptions = {}): void {
    const text = clean(message).trim();
    if (!text) return;
    const tone: ToastTone = opts.tone || 'info';
    const stack = getToastStack();

    // Evita spam do mesmo aviso: renova o existente
    const existing = Array.from(stack.children).find(c => (c as HTMLElement).dataset.msg === text) as HTMLElement | undefined;
    if (existing && (existing as any)._renew) { (existing as any)._renew(); return; }

    const t = el('div', `pb-toast pb-toast--${tone}`);
    t.dataset.msg = text;
    t.appendChild(el('span', 'pb-toast-dot'));
    t.appendChild(el('span', 'pb-toast-text', text));
    stack.appendChild(t);

    // Máximo de 4 visíveis
    while (stack.children.length > 4) stack.firstElementChild?.remove();

    const duration = opts.duration ?? Math.min(7000, 2800 + Math.max(0, text.length - 60) * 35);
    let timer = 0;
    let closing = false;
    const close = () => {
        if (closing) return;
        closing = true;
        window.clearTimeout(timer);
        t.classList.add('is-leaving');
        window.setTimeout(() => t.remove(), reducedMotion() ? 0 : 200);
    };
    (t as any)._renew = () => { window.clearTimeout(timer); timer = window.setTimeout(close, duration); };
    (t as any)._renew();
    t.addEventListener('click', close);
}

// ---------------------------------------------------------------------------
// Typewriter
// ---------------------------------------------------------------------------
function typewriter(target: HTMLElement, text: string, opts: { cps?: number } = {}): TypewriterHandle {
    const full = clean(text);
    let resolve!: () => void;
    const promise = new Promise<void>(r => (resolve = r));
    let done = false;
    let timer = 0;

    const finish = () => {
        if (done) return;
        done = true;
        window.clearInterval(timer);
        target.textContent = full;
        target.classList.remove('is-typing');
        resolve();
    };

    if (reducedMotion() || full.length === 0) {
        target.textContent = full;
        done = true;
        resolve();
    } else {
        const cps = opts.cps ?? 60;
        const step = Math.max(1, Math.round(cps / 60));
        let i = 0;
        target.textContent = '';
        target.classList.add('is-typing');
        timer = window.setInterval(() => {
            if (!target.isConnected) { finish(); return; }
            i = Math.min(full.length, i + step);
            target.textContent = full.slice(0, i);
            if (i >= full.length) finish();
        }, 1000 / 60);
    }

    return { finish, get done() { return done; }, promise };
}

// ---------------------------------------------------------------------------
// Fila de modais
// ---------------------------------------------------------------------------
let queue: Promise<unknown> = Promise.resolve();
let openCount = 0;

function enqueue<T>(run: () => Promise<T>): Promise<T> {
    const next = queue.then(run, run);
    queue = next.catch(() => undefined);
    return next;
}

interface Layer { layer: HTMLElement; close: () => void; }

function openLayer(kind: 'modal' | 'say', onKey: (e: KeyboardEvent) => void): Layer {
    const layer = el('div', `pb-dlg-layer pb-dlg-layer--${kind}`);
    const prevFocus = document.activeElement as HTMLElement | null;
    document.body.appendChild(layer);
    openCount++;
    const keyHandler = (e: KeyboardEvent) => { e.stopPropagation(); onKey(e); };
    document.addEventListener('keydown', keyHandler, true);
    let closed = false;
    const close = () => {
        if (closed) return;
        closed = true;
        openCount--;
        document.removeEventListener('keydown', keyHandler, true);
        layer.classList.add('is-leaving');
        window.setTimeout(() => layer.remove(), reducedMotion() ? 0 : 160);
        try { prevFocus?.focus?.({ preventScroll: true } as any); } catch { /* noop */ }
    };
    return { layer, close };
}

function buildCard(message: string, title?: string): { card: HTMLElement; body: HTMLElement; actions: HTMLElement } {
    const card = el('div', 'pb-dlg');
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    if (title) {
        const h = el('h2', 'pb-dlg-title', title);
        h.id = `pb-dlg-t-${Date.now()}`;
        card.setAttribute('aria-labelledby', h.id);
        card.appendChild(h);
    }
    const body = el('p', 'pb-dlg-text', message);
    card.appendChild(body);
    const actions = el('div', 'pb-dlg-actions');
    card.appendChild(actions);
    return { card, body, actions };
}

function alertDialog(message: unknown, opts: AlertOptions = {}): Promise<void> {
    const text = clean(message);
    return enqueue(() => new Promise<void>(resolve => {
        let settled = false;
        const done = () => { if (settled) return; settled = true; l.close(); resolve(); };
        const l = openLayer('modal', e => {
            if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); done(); }
        });
        const { card, actions } = buildCard(text, opts.title);
        card.setAttribute('role', 'alertdialog');
        const ok = button(opts.okLabel || 'Ok', 'primary');
        ok.addEventListener('click', done);
        actions.appendChild(ok);
        l.layer.appendChild(card);
        ok.focus({ preventScroll: true });
    }));
}

function confirmDialog(message: unknown, opts: ConfirmOptions = {}): Promise<boolean> {
    const text = clean(message);
    return enqueue(() => new Promise<boolean>(resolve => {
        let settled = false;
        const done = (v: boolean) => { if (settled) return; settled = true; l.close(); resolve(v); };
        const l = openLayer('modal', e => {
            if (e.key === 'Escape') { e.preventDefault(); done(false); }
            else if (e.key === 'Enter') {
                e.preventDefault();
                // Enter aciona o botão focado; por padrão, o principal
                if (document.activeElement === cancel) done(false); else done(true);
            }
        });
        const { card, actions } = buildCard(text, opts.title);
        const cancel = button(opts.cancelLabel || 'Cancelar', 'secondary');
        const ok = button(opts.okLabel || 'Confirmar', opts.danger ? 'danger' : 'green');
        if (opts.danger) card.classList.add('pb-dlg--danger');
        cancel.addEventListener('click', () => done(false));
        ok.addEventListener('click', () => done(true));
        actions.append(cancel, ok);
        l.layer.appendChild(card);
        ok.focus({ preventScroll: true });
    }));
}

function promptDialog(message: unknown, opts: PromptOptions = {}): Promise<string | null> {
    const text = clean(message);
    return enqueue(() => new Promise<string | null>(resolve => {
        let settled = false;
        const done = (v: string | null) => { if (settled) return; settled = true; l.close(); resolve(v); };
        const l = openLayer('modal', e => {
            if (e.key === 'Escape') { e.preventDefault(); done(null); }
            else if (e.key === 'Enter') { e.preventDefault(); done(input.value); }
        });
        const { card, actions } = buildCard(text, opts.title);
        const input = el('input', 'pb-dlg-input');
        input.type = 'text';
        if (opts.inputMode === 'numeric') { input.inputMode = 'numeric'; input.pattern = '[0-9]*'; }
        input.value = opts.defaultValue ?? '';
        if (opts.placeholder) input.placeholder = opts.placeholder;
        input.setAttribute('aria-label', text);
        card.insertBefore(input, actions);
        const cancel = button(opts.cancelLabel || 'Cancelar', 'secondary');
        const ok = button(opts.okLabel || 'Confirmar', 'green');
        cancel.addEventListener('click', () => done(null));
        ok.addEventListener('click', () => done(input.value));
        actions.append(cancel, ok);
        l.layer.appendChild(card);
        input.focus({ preventScroll: true });
        input.select();
    }));
}

// ---------------------------------------------------------------------------
// Caixa de fala (say)
// ---------------------------------------------------------------------------
/** Monta o miolo visual da caixa de fala. Reutilizado pelo aviso do tabuleiro. */
function buildSayBox(opts: { name: string; portrait?: string; side?: 'left' | 'right' }): { box: HTMLElement; text: HTMLElement; footer: HTMLElement } {
    const box = el('div', `pb-say${opts.side === 'right' ? ' pb-say--right' : ''}`);
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', opts.name);

    if (opts.portrait) {
        const frame = el('div', 'pb-say-portrait');
        const img = el('img');
        img.src = opts.portrait;
        img.alt = '';
        img.decoding = 'async';
        img.addEventListener('error', () => frame.classList.add('is-broken'));
        frame.appendChild(img);
        box.appendChild(frame);
    } else {
        box.classList.add('pb-say--no-portrait');
    }

    const main = el('div', 'pb-say-main');
    main.appendChild(el('div', 'pb-say-name', opts.name));
    const text = el('p', 'pb-say-text');
    text.setAttribute('aria-live', 'polite');
    main.appendChild(text);
    const footer = el('div', 'pb-say-footer');
    main.appendChild(footer);
    box.appendChild(main);
    return { box, text, footer };
}

function say(opts: SayOptions): Promise<void> {
    const name = clean(opts.name).slice(0, 40);
    const full = clean(opts.text);
    return enqueue(() => new Promise<void>(resolve => {
        let settled = false;
        let tw: TypewriterHandle;
        const advance = () => {
            if (settled) return;
            if (!tw.done) { tw.finish(); return; }
            settled = true; l.close(); resolve();
        };
        const l = openLayer('say', e => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); if (e.key === 'Escape') { tw.finish(); } advance(); }
        });
        const { box, text, footer } = buildSayBox({ name, portrait: opts.portrait, side: opts.side });
        footer.appendChild(el('span', 'pb-say-next'));
        footer.setAttribute('aria-hidden', 'true');
        box.tabIndex = -1;
        l.layer.appendChild(box);
        l.layer.addEventListener('click', advance);
        tw = typewriter(text, full);
        tw.promise.then(() => box.classList.add('is-done'));
        box.focus({ preventScroll: true });
    }));
}

export const GameDialog = {
    toast,
    alert: alertDialog,
    confirm: confirmDialog,
    prompt: promptDialog,
    say,
    typewriter,
    buildSayBox,
    isOpen: () => openCount > 0,
};

declare global {
    interface Window { GameDialog: typeof GameDialog; }
}

if (typeof window !== 'undefined') window.GameDialog = GameDialog;
