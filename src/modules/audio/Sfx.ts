// Efeitos sonoros do jogo, sintetizados na hora com WebAudio: nenhum arquivo para baixar e custo zero até o primeiro som.
// Preferências (volume e mudo) ficam só neste navegador.

export type SfxName =
    | 'click' | 'hover' | 'open' | 'close' | 'toast' | 'error' | 'emote'
    | 'dice' | 'diceResult' | 'step' | 'landCity' | 'landEvent' | 'landGym' | 'landPvp' | 'myTurn' | 'weather'
    | 'coin' | 'coinLoss' | 'buy' | 'cardDraw' | 'cardPlay'
    | 'battleStart' | 'hit' | 'hitHeavy' | 'crit' | 'superHit' | 'weakHit' | 'miss' | 'status' | 'lowHp' | 'faint' | 'sendOut'
    | 'throw' | 'shake' | 'catch' | 'catchFail' | 'heal' | 'levelUp' | 'celebrate' | 'mega' | 'quest' | 'achievement'
    | 'lifeLost' | 'battleWin' | 'battleLose' | 'victory' | 'defeat';

type Wave = OscillatorType;
type Note = { f: number; to?: number; at?: number; dur: number; wave?: Wave; vol?: number };
type Noise = { noise: true; at?: number; dur: number; vol?: number; freq?: number; toFreq?: number; q?: number };
type Part = Note | Noise;

const VOLUME_KEY = 'pb_sfx_volume';
const MUTED_KEY = 'pb_sfx_muted';
const MAX_VOICES = 24;

// Escala usada nas melodias curtas (frequências em Hz)
const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392, A4 = 440, B4 = 493.88;
const C5 = 523.25, D5 = 587.33, E5 = 659.25, G5 = 783.99, A5 = 880, C6 = 1046.5;

const seq = (notes: number[], step: number, dur: number, wave: Wave = 'square', vol = 0.16, start = 0): Note[] =>
    notes.map((f, i) => ({ f, at: start + i * step, dur, wave, vol }));

const SOUNDS: Record<SfxName, { parts: Part[]; gap?: number }> = {
    click: { parts: [{ f: 720, to: 520, dur: 0.05, wave: 'square', vol: 0.07 }], gap: 40 },
    hover: { parts: [{ f: 980, dur: 0.025, wave: 'triangle', vol: 0.035 }], gap: 70 },
    open: { parts: [{ f: 340, to: 620, dur: 0.1, wave: 'triangle', vol: 0.12 }], gap: 90 },
    close: { parts: [{ f: 560, to: 300, dur: 0.09, wave: 'triangle', vol: 0.1 }], gap: 90 },
    toast: { parts: seq([G4, C5], 0.06, 0.08, 'triangle', 0.1), gap: 200 },
    error: { parts: seq([196, 165], 0.09, 0.11, 'square', 0.09), gap: 200 },
    emote: { parts: [{ f: 620, to: 930, dur: 0.1, wave: 'sine', vol: 0.15 }], gap: 120 },

    dice: {
        parts: Array.from({ length: 9 }, (_, i) => ({ noise: true as const, at: i * 0.11 + i * i * 0.006, dur: 0.035, vol: 0.2, freq: 2400 - i * 90, q: 3 })),
        gap: 400
    },
    diceResult: { parts: [{ noise: true, dur: 0.05, vol: 0.2, freq: 1300, q: 2 }, ...seq([C5, G5], 0.06, 0.11, 'square', 0.13, 0.03)], gap: 300 },
    step: { parts: [{ f: 150, to: 82, dur: 0.06, wave: 'sine', vol: 0.2 }, { noise: true, dur: 0.03, vol: 0.05, freq: 1800, q: 1 }], gap: 70 },
    landCity: { parts: seq([E4, G4, C5], 0.08, 0.14, 'triangle', 0.15), gap: 400 },
    landEvent: { parts: seq([A4, C5, E5, A5], 0.06, 0.12, 'square', 0.1), gap: 400 },
    landGym: { parts: [{ f: 98, to: 90, dur: 0.4, wave: 'sawtooth', vol: 0.14 }, ...seq([D4, F4, A4], 0.1, 0.26, 'square', 0.1)], gap: 400 },
    landPvp: { parts: seq([A4, E4, A4, E5], 0.07, 0.11, 'sawtooth', 0.11), gap: 400 },
    myTurn: { parts: seq([G4, D5, G5], 0.09, 0.17, 'triangle', 0.17), gap: 800 },
    weather: { parts: [{ noise: true, dur: 0.75, vol: 0.09, freq: 500, toFreq: 2300, q: 0.8 }, { f: 220, to: 330, dur: 0.6, wave: 'sine', vol: 0.08 }], gap: 800 },

    coin: { parts: seq([B4 * 2, E5 * 2], 0.055, 0.13, 'square', 0.085), gap: 90 },
    coinLoss: { parts: seq([E5, B4], 0.055, 0.09, 'triangle', 0.1), gap: 120 },
    buy: { parts: [{ noise: true, dur: 0.04, vol: 0.1, freq: 3200, q: 4 }, ...seq([C5, E5, G5, C6], 0.05, 0.1, 'square', 0.085, 0.03)], gap: 150 },
    cardDraw: { parts: [{ noise: true, dur: 0.13, vol: 0.13, freq: 1800, toFreq: 4800, q: 0.9 }], gap: 90 },
    cardPlay: { parts: [{ noise: true, dur: 0.16, vol: 0.13, freq: 4200, toFreq: 1100, q: 0.9 }, { f: 330, to: 880, at: 0.05, dur: 0.2, wave: 'triangle', vol: 0.13 }], gap: 200 },

    battleStart: {
        parts: [{ noise: true, dur: 0.4, vol: 0.14, freq: 700, toFreq: 4800, q: 0.8 }, ...seq([A4, A4, C5, E5, A5], 0.075, 0.09, 'sawtooth', 0.105, 0.14), { f: 55, to: 40, at: 0.5, dur: 0.42, wave: 'sine', vol: 0.34 }],
        gap: 900
    },
    hit: { parts: [{ noise: true, dur: 0.09, vol: 0.22, freq: 1500, toFreq: 500, q: 0.9 }, { f: 190, to: 70, dur: 0.1, wave: 'square', vol: 0.15 }], gap: 90 },
    hitHeavy: { parts: [{ noise: true, dur: 0.17, vol: 0.28, freq: 1100, toFreq: 240, q: 0.8 }, { f: 130, to: 42, dur: 0.21, wave: 'square', vol: 0.2 }], gap: 90 },
    crit: { parts: [{ noise: true, dur: 0.17, vol: 0.27, freq: 3000, toFreq: 500, q: 0.9 }, { f: 170, to: 45, dur: 0.21, wave: 'square', vol: 0.19 }, { f: 1500, to: 2300, at: 0.03, dur: 0.15, wave: 'square', vol: 0.065 }], gap: 120 },
    superHit: { parts: seq([C5, G5, C6], 0.05, 0.12, 'square', 0.09), gap: 180 },
    weakHit: { parts: [{ f: 240, to: 150, dur: 0.17, wave: 'triangle', vol: 0.13 }], gap: 180 },
    miss: { parts: [{ noise: true, dur: 0.17, vol: 0.11, freq: 900, toFreq: 3400, q: 2.5 }], gap: 150 },
    status: { parts: Array.from({ length: 4 }, (_, i) => ({ f: 520 + (i % 2) * 190, at: i * 0.05, dur: 0.05, wave: 'sawtooth' as Wave, vol: 0.075 })), gap: 220 },
    lowHp: { parts: seq([A5, 0, A5], 0.1, 0.08, 'square', 0.065).filter(n => n.f > 0), gap: 2500 },
    faint: { parts: [{ f: 620, to: 72, dur: 0.72, wave: 'square', vol: 0.12 }, { f: 72, to: 42, at: 0.62, dur: 0.24, wave: 'sine', vol: 0.3 }], gap: 300 },
    sendOut: { parts: [{ noise: true, dur: 0.08, vol: 0.13, freq: 3400, q: 2 }, { f: 300, to: 960, at: 0.03, dur: 0.2, wave: 'triangle', vol: 0.15 }], gap: 220 },

    throw: { parts: [{ f: 320, to: 1250, dur: 0.33, wave: 'sine', vol: 0.11 }, { noise: true, dur: 0.3, vol: 0.05, freq: 1200, toFreq: 3200, q: 1.4 }], gap: 200 },
    shake: { parts: [{ noise: true, dur: 0.045, vol: 0.2, freq: 1400, q: 5 }, { noise: true, at: 0.1, dur: 0.045, vol: 0.2, freq: 1100, q: 5 }], gap: 200 },
    catch: { parts: [{ noise: true, dur: 0.05, vol: 0.2, freq: 1800, q: 4 }, ...seq([C5, E5, G5, C6, G5, C6], 0.075, 0.14, 'square', 0.1, 0.05)], gap: 500 },
    catchFail: { parts: [{ noise: true, dur: 0.11, vol: 0.2, freq: 2000, toFreq: 700, q: 1 }, ...seq([G4, E4, C4], 0.09, 0.14, 'triangle', 0.14, 0.05)], gap: 500 },
    heal: { parts: seq([C5, D5, E5, G5, A5, C6], 0.08, 0.2, 'sine', 0.13), gap: 600 },
    levelUp: { parts: seq([G4, B4, D5, G5], 0.07, 0.13, 'square', 0.1), gap: 900 },
    celebrate: { parts: [...seq([C5, E5, G5, C6], 0.11, 0.2, 'square', 0.11), ...seq([G4, C5, E5], 0.33, 0.48, 'triangle', 0.1, 0.11)], gap: 1200 },
    mega: { parts: [{ f: 90, to: 880, dur: 0.85, wave: 'sawtooth', vol: 0.1 }, { noise: true, dur: 0.85, vol: 0.08, freq: 300, toFreq: 5000, q: 0.8 }, ...seq([A5, C6], 0.09, 0.42, 'square', 0.08, 0.84), { f: 62, to: 40, at: 0.84, dur: 0.48, wave: 'sine', vol: 0.32 }], gap: 1500 },
    quest: { parts: seq([E5, G5, C6], 0.09, 0.17, 'triangle', 0.15), gap: 500 },
    achievement: { parts: seq([G4, C5, E5, G5, C6], 0.085, 0.24, 'triangle', 0.15), gap: 600 },

    lifeLost: { parts: [{ f: 62, to: 38, dur: 0.48, wave: 'sine', vol: 0.34 }, ...seq([A4, F4, D4], 0.16, 0.26, 'sawtooth', 0.09, 0.03)], gap: 800 },
    battleWin: { parts: seq([G4, C5, E5, G5], 0.09, 0.2, 'square', 0.1), gap: 800 },
    battleLose: { parts: seq([E4, D4, C4], 0.15, 0.27, 'triangle', 0.15), gap: 800 },
    victory: { parts: [...seq([C5, C5, C5, E5, G5], 0.11, 0.13, 'square', 0.105), ...seq([E5, G5, C6], 0, 0.72, 'square', 0.065, 0.56), ...seq([C4, G4], 0.28, 0.5, 'triangle', 0.15, 0.56)], gap: 3000 },
    defeat: { parts: seq([G4, F4, E4, D4, C4], 0.18, 0.31, 'triangle', 0.15), gap: 3000 }
};

export class Sfx {
    private static ctx: AudioContext | null = null;
    private static master: GainNode | null = null;
    private static noiseBuffer: AudioBuffer | null = null;
    private static lastPlayed = new Map<SfxName, number>();
    private static voices = 0;
    private static started = false;
    private static memory: { volume: number; muted: boolean } | null = null;

    private static read() {
        if (this.memory) return this.memory;
        let volume = 0.7, muted = false;
        try {
            const v = parseFloat(localStorage.getItem(VOLUME_KEY) ?? '');
            if (Number.isFinite(v)) volume = Math.min(1, Math.max(0, v));
            muted = localStorage.getItem(MUTED_KEY) === '1';
        } catch { /* sem armazenamento: vale o padrão */ }
        return (this.memory = { volume, muted });
    }

    static get volume() { return this.read().volume; }
    static get muted() { return this.read().muted; }

    static setVolume(value: number) {
        const s = this.read();
        s.volume = Math.min(1, Math.max(0, value));
        try { localStorage.setItem(VOLUME_KEY, String(s.volume)); } catch { /* só nesta sessão */ }
        if (s.volume > 0 && s.muted) { this.setMuted(false); return; }
        this.applyGain();
        this.syncControls();
    }

    static setMuted(value: boolean) {
        this.read().muted = value;
        try { localStorage.setItem(MUTED_KEY, value ? '1' : '0'); } catch { /* só nesta sessão */ }
        this.applyGain();
        this.syncControls();
    }

    static toggleMuted() { this.setMuted(!this.muted); if (!this.muted) this.play('click'); }

    private static applyGain() {
        if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.015);
    }

    // Navegadores só liberam áudio depois de um gesto do jogador; o contexto nasce no primeiro toque
    private static unlock() {
        if (!this.ctx) {
            const Ctor = window.AudioContext || (window as any).webkitAudioContext;
            if (!Ctor) return;
            try {
                this.ctx = new Ctor({ latencyHint: 'interactive' });
                const comp = this.ctx.createDynamicsCompressor();
                comp.threshold.value = -14; comp.ratio.value = 6; comp.attack.value = 0.003; comp.release.value = 0.12;
                this.master = this.ctx.createGain();
                this.master.gain.value = this.muted ? 0 : this.volume;
                this.master.connect(comp);
                comp.connect(this.ctx.destination);
                const len = Math.floor(this.ctx.sampleRate * 1.2);
                this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
                const data = this.noiseBuffer.getChannelData(0);
                for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
            } catch { this.ctx = null; return; }
        }
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => { });
    }

    static play(name: SfxName) {
        if (this.muted || this.volume <= 0 || document.hidden || !this.ctx || this.ctx.state !== 'running') return;
        const sound = SOUNDS[name];
        const nowMs = performance.now();
        if (nowMs - (this.lastPlayed.get(name) ?? -1e9) < (sound.gap ?? 60)) return;
        if (this.voices + sound.parts.length > MAX_VOICES) return;
        this.lastPlayed.set(name, nowMs);
        const t0 = this.ctx.currentTime + 0.004;
        for (const part of sound.parts) {
            if ('noise' in part) this.playNoise(part, t0);
            else this.playTone(part, t0);
        }
    }

    private static envelope(part: Part, t0: number) {
        const ctx = this.ctx!;
        const start = t0 + (part.at ?? 0);
        const end = start + part.dur;
        const peak = part.vol ?? 0.12;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(peak, start + Math.min(0.006, part.dur * 0.25));
        gain.gain.exponentialRampToValueAtTime(0.0001, end);
        gain.connect(this.master!);
        return { gain, start, end };
    }

    private static track(node: AudioScheduledSourceNode, gain: GainNode) {
        this.voices++;
        node.onended = () => { this.voices--; node.disconnect(); gain.disconnect(); };
    }

    private static playTone(note: Note, t0: number) {
        const { gain, start, end } = this.envelope(note, t0);
        const osc = this.ctx!.createOscillator();
        osc.type = note.wave ?? 'square';
        osc.frequency.setValueAtTime(note.f, start);
        if (note.to) osc.frequency.exponentialRampToValueAtTime(note.to, end);
        osc.connect(gain);
        this.track(osc, gain);
        osc.start(start);
        osc.stop(end + 0.01);
    }

    private static playNoise(part: Noise, t0: number) {
        const ctx = this.ctx!;
        const { gain, start, end } = this.envelope(part, t0);
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = part.q ?? 1;
        filter.frequency.setValueAtTime(part.freq ?? 2000, start);
        if (part.toFreq) filter.frequency.exponentialRampToValueAtTime(part.toFreq, end);
        src.connect(filter);
        filter.connect(gain);
        this.track(src, gain);
        src.start(start, Math.random() * 0.4);
        src.stop(end + 0.01);
    }

    private static syncControls() {
        document.querySelectorAll<HTMLInputElement>('[data-pb-sfx-volume]').forEach(input => { input.value = String(Math.round(this.volume * 100)); });
        document.querySelectorAll<HTMLElement>('[data-pb-sfx-mute]').forEach(btn => {
            const off = this.muted || this.volume <= 0;
            btn.classList.toggle('is-muted', off);
            btn.setAttribute('aria-pressed', off ? 'true' : 'false');
            btn.title = off ? 'Ligar o som (M)' : 'Desligar o som (M)';
        });
    }

    // Som de abrir/fechar para as janelas: cada uma é aberta por um "display = flex" em dezenas de pontos do código
    private static watchModals() {
        const open = new WeakSet<Element>();
        const observer = new MutationObserver(records => {
            for (const r of records) {
                const el = r.target as HTMLElement;
                if (el.id === 'battle-modal' || el.id === 'victory-modal') continue;
                const isOpen = el.style.display !== '' && el.style.display !== 'none';
                if (isOpen === open.has(el)) continue;
                if (isOpen) { open.add(el); this.play('open'); }
                else { open.delete(el); this.play('close'); }
            }
        });
        document.querySelectorAll('.modal-overlay').forEach(el => {
            if ((el as HTMLElement).style.display && (el as HTMLElement).style.display !== 'none') open.add(el);
            observer.observe(el, { attributes: true, attributeFilter: ['style'] });
        });
    }

    static init() {
        if (this.started) return;
        this.started = true;
        const unlock = () => this.unlock();
        document.addEventListener('pointerdown', unlock, { capture: true, passive: true });
        document.addEventListener('keydown', unlock, { capture: true });

        // Clique em qualquer botão (em captura: alguns componentes interrompem a propagação)
        document.addEventListener('click', e => {
            const target = e.target as Element | null;
            if (target?.closest?.('button, .btn, a[href], [role="button"], summary, select')) {
                this.unlock();
                if (!target.closest('[data-pb-sfx-mute]')) this.play('click');
            }
        }, { capture: true, passive: true });

        document.addEventListener('keydown', e => {
            if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.key.toLowerCase() !== 'm') return;
            const t = e.target as HTMLElement | null;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
            this.toggleMuted();
        });

        document.querySelectorAll<HTMLInputElement>('[data-pb-sfx-volume]').forEach(input => {
            input.addEventListener('input', () => this.setVolume(Number(input.value) / 100));
            input.addEventListener('change', () => this.play('coin'));
        });
        this.watchModals();
        this.syncControls();
    }

    static refreshControls() { this.syncControls(); }
}

(window as any).PBSfx = Sfx;
