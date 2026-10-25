import type { Container, Sprite, Texture } from 'pixi.js';
import { GameState } from '../game/GameState';
import { MapSystem } from '../../systems/MapSystem';
import { TILE } from '../../constants';
import { boardTextures, type BoardTex } from './BoardTextures';

// Clima e atmosfera do tabuleiro: color grading por evento global, ciclo dia/noite por rodada
// e partículas (chuva, neve, areia, névoa...). Tudo cosmético; lê o estado, nunca o altera.

export type Rect = { x: number; y: number; w: number; h: number };

type Part = {
    s: Sprite;
    x: number; y: number; vx: number; vy: number;
    life: number; max: number; // segundos
    a: number; b: number; c: number; d: number; // livres por emissor
    size: number;
};

type Space = 'screen' | 'world';
type TexKey = keyof BoardTex | 'white';

type Ctx = { r: Rect; t: number; w: BoardWeather; T: number };

type EmitterDef = {
    space: Space;
    cap: number;
    density?: number; // partículas por px² de tela (só espaço de tela); sem isso usa cap
    tex: TexKey;
    blend?: 'add' | 'normal';
    init(p: Part, c: Ctx, first: boolean): void;
    step(p: Part, dt: number, c: Ctx): boolean; // false = reciclar a partícula
    frame?(em: Emitter, dt: number, c: Ctx): void;
};

type Emitter = { key: string; def: EmitterDef; parts: Part[]; node: Container; level: number; target: number; active: number; state: number[] };

type Look = {
    mul?: number; mulA?: number;    // grading por multiplicação
    tint?: number; tintA?: number;  // véu de cor
    vig?: number; vigA?: number;    // vinheta
    pulse?: number;                 // pulso da vinheta
    night?: boolean;
    fx?: string[];
};

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]) => arr[(Math.random() * arr.length) | 0];
const wrap = (v: number, lo: number, len: number) => len <= 0 ? lo : lo + ((((v - lo) % len) + len) % len);

// ---------------------------------------------------------------------------
// Emissores
// ---------------------------------------------------------------------------
const fallStreak = (opts: { cap: number; density: number; speed: [number, number]; slant: number; len: [number, number]; alpha: [number, number]; tints: number[]; width: number }): EmitterDef => ({
    space: 'screen', cap: opts.cap, density: opts.density, tex: 'streak',
    init(p, { r }, first) {
        const v = rnd(opts.speed[0], opts.speed[1]);
        p.vy = v; p.vx = v * opts.slant;
        p.x = rnd(r.x - r.h * opts.slant, r.x + r.w);
        p.y = first ? rnd(r.y, r.y + r.h) : r.y - rnd(0, 60);
        const len = rnd(opts.len[0], opts.len[1]);
        p.s.anchor.set(0.5, 1);
        p.s.scale.set(opts.width / 4, len / 64);
        p.s.rotation = Math.atan2(-p.vx, p.vy);
        p.s.alpha = rnd(opts.alpha[0], opts.alpha[1]);
        p.s.tint = pick(opts.tints);
    },
    step(p, dt, { r }) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.y > r.y + r.h + 10) return false;
        if (p.x > r.x + r.w + 20) p.x -= r.w + 40;
        p.s.position.set(p.x, p.y);
        return true;
    }
});

const sideStreak = (opts: { cap: number; density: number; speed: [number, number]; drift: number; len: [number, number]; alpha: [number, number]; tints: number[]; width: number }): EmitterDef => ({
    space: 'screen', cap: opts.cap, density: opts.density, tex: 'streak',
    init(p, { r }, first) {
        p.vx = rnd(opts.speed[0], opts.speed[1]);
        p.vy = p.vx * opts.drift * rnd(0.5, 1.2);
        p.x = first ? rnd(r.x, r.x + r.w) : r.x - rnd(0, 120);
        p.y = rnd(r.y - 20, r.y + r.h);
        const len = rnd(opts.len[0], opts.len[1]);
        p.s.anchor.set(0.5, 1);
        p.s.scale.set(opts.width / 4, len / 64);
        p.s.rotation = Math.atan2(-p.vx, p.vy);
        p.s.alpha = rnd(opts.alpha[0], opts.alpha[1]);
        p.s.tint = pick(opts.tints);
    },
    step(p, dt, { r }) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x > r.x + r.w + 30) return false;
        if (p.y > r.y + r.h + 10) p.y -= r.h + 20;
        p.s.position.set(p.x, p.y);
        return true;
    }
});

// Pontinhos de luz que flutuam, piscam e somem (aura, brasas, vírus, almas...)
const motes = (opts: { cap: number; density: number; size: [number, number]; vy: [number, number]; sway: number; alpha: number; tints: number[]; life: [number, number]; blend?: 'add' | 'normal'; tex?: TexKey }): EmitterDef => ({
    space: 'screen', cap: opts.cap, density: opts.density, tex: opts.tex || 'soft', blend: opts.blend || 'add',
    init(p, { r }, first) {
        p.a = rnd(r.x, r.x + r.w); // x base
        p.y = rnd(r.y, r.y + r.h);
        p.vy = rnd(opts.vy[0], opts.vy[1]);
        p.b = rnd(0.6, 1.6); p.c = rnd(0, 6.28);
        p.max = rnd(opts.life[0], opts.life[1]);
        p.life = first ? rnd(0, p.max) : 0;
        p.size = rnd(opts.size[0], opts.size[1]);
        p.s.anchor.set(0.5);
        p.s.scale.set(p.size / (opts.tex === 'flake' ? 16 : 64) * (opts.tex === 'star' ? 64 / 48 : 1));
        p.s.tint = pick(opts.tints);
    },
    step(p, dt, { r, t }) {
        p.life += dt;
        if (p.life >= p.max) return false;
        p.y += p.vy * dt;
        p.x = p.a + Math.sin(t * p.b + p.c) * opts.sway;
        const k = p.life / p.max;
        const fade = k < 0.2 ? k / 0.2 : k > 0.75 ? (1 - k) / 0.25 : 1;
        p.s.alpha = opts.alpha * fade * (0.7 + 0.3 * Math.sin(t * 3 * p.b + p.c));
        if (p.y < r.y - 20 || p.y > r.y + r.h + 20) return false;
        p.s.position.set(wrap(p.x, r.x, r.w), p.y);
        return true;
    }
});

// Grandes manchas suaves que derivam (névoa, poeira, calor)
const blobs = (opts: { cap: number; size: [number, number]; vx: [number, number]; vy: [number, number]; alpha: [number, number]; tints: number[]; blend?: 'add' | 'normal' }): EmitterDef => ({
    space: 'screen', cap: opts.cap, tex: 'soft', blend: opts.blend || 'normal',
    init(p, { r }, first) {
        const scale = Math.max(0.6, Math.min(r.w, r.h) / 700);
        p.size = rnd(opts.size[0], opts.size[1]) * scale;
        p.vx = rnd(opts.vx[0], opts.vx[1]) * scale; p.vy = rnd(opts.vy[0], opts.vy[1]) * scale;
        p.x = first ? rnd(r.x, r.x + r.w) : (p.vx >= 0 ? r.x - p.size * 0.4 : r.x + r.w + p.size * 0.4);
        p.y = rnd(r.y, r.y + r.h);
        p.max = rnd(8, 16); p.life = first ? rnd(0, p.max * 0.6) : 0;
        p.a = rnd(opts.alpha[0], opts.alpha[1]); p.c = rnd(0, 6.28);
        p.s.anchor.set(0.5);
        p.s.scale.set(p.size / 64);
        p.s.tint = pick(opts.tints);
    },
    step(p, dt, { r, t }) {
        p.life += dt;
        p.x += p.vx * dt; p.y += p.vy * dt + Math.sin(t * 0.7 + p.c) * 4 * dt;
        const k = p.life / p.max;
        if (k >= 1) return false;
        const fade = k < 0.15 ? k / 0.15 : k > 0.8 ? (1 - k) / 0.2 : 1;
        p.s.alpha = p.a * fade;
        if (p.x < r.x - p.size || p.x > r.x + r.w + p.size) return false;
        p.s.position.set(p.x, wrap(p.y, r.y, r.h));
        return true;
    }
});

// Brilhos ancorados em casas do tabuleiro (espaço de mundo)
const tileTwinkle = (opts: { cap: number; tiles: 'nature' | 'water' | 'all' | 'special'; size: [number, number]; tints: number[]; life: [number, number]; tex?: TexKey; spin?: number }): EmitterDef => ({
    space: 'world', cap: opts.cap, tex: opts.tex || 'star', blend: 'add',
    init(p, { w, T }, first) {
        const idx = w.randomTile(opts.tiles);
        if (idx < 0) { p.s.visible = false; p.max = 1; p.life = 0; p.d = 1; return; }
        const size = MapSystem.size;
        p.x = (idx % size) * T + rnd(T * 0.15, T * 0.85);
        p.y = Math.floor(idx / size) * T + rnd(T * 0.15, T * 0.85);
        p.max = rnd(opts.life[0], opts.life[1]);
        p.life = 0;
        p.d = first ? rnd(0, 2.5) : rnd(0, 0.8); // espera antes de aparecer
        p.size = rnd(opts.size[0], opts.size[1]);
        p.c = rnd(-1, 1);
        p.s.anchor.set(0.5);
        p.s.tint = pick(opts.tints);
        p.s.position.set(p.x, p.y);
        p.s.visible = false;
    },
    step(p, dt, { w }) {
        if (p.d > 0) { p.d -= dt; return true; }
        if (!w.hasTiles(opts.tiles)) return false;
        p.life += dt;
        const k = p.life / p.max;
        if (k >= 1) return false;
        p.s.visible = true;
        const pop = Math.sin(k * Math.PI);
        p.s.scale.set(p.size / 48 * pop);
        p.s.rotation += (opts.spin ?? 1.2) * p.c * dt;
        p.s.alpha = pop;
        return true;
    }
});

const EMITTERS: Record<string, () => EmitterDef> = {
    rain: () => fallStreak({ cap: 170, density: 1 / 2400, speed: [900, 1250], slant: 0.22, len: [16, 30], alpha: [0.35, 0.65], tints: [0xd6e6ff, 0xffffff, 0xb8cff0], width: 1.8 }),
    splash: () => ({
        space: 'world', cap: 12, tex: 'ring', blend: 'normal',
        init(p, { w, T }, first) {
            const idx = w.randomTile('water');
            p.s.anchor.set(0.5);
            p.s.visible = false;
            if (idx < 0) { p.d = 1; p.max = 1; p.life = 0; return; }
            const size = MapSystem.size;
            p.s.position.set((idx % size) * T + rnd(T * 0.2, T * 0.8), Math.floor(idx / size) * T + rnd(T * 0.2, T * 0.8));
            p.max = rnd(0.55, 0.85); p.life = 0; p.d = first ? rnd(0, 2) : rnd(0, 0.9);
            p.size = rnd(T * 0.25, T * 0.42);
            p.s.tint = 0xe6f4ff;
        },
        step(p, dt) {
            if (p.d > 0) { p.d -= dt; return true; }
            p.life += dt;
            const k = p.life / p.max;
            if (k >= 1) return false;
            p.s.visible = true;
            p.s.scale.set((0.2 + 0.8 * k) * p.size / 64, (0.2 + 0.8 * k) * p.size / 64 * 0.55);
            p.s.alpha = 0.75 * (1 - k);
            return true;
        }
    }),
    snow: () => ({
        space: 'screen', cap: 150, density: 1 / 2800, tex: 'flake', blend: 'normal',
        init(p, { r }, first) {
            p.size = rnd(2.5, 6.5);
            p.vy = 22 + p.size * 9 + rnd(0, 15);
            p.a = rnd(r.x, r.x + r.w);
            p.y = first ? rnd(r.y, r.y + r.h) : r.y - 8;
            p.b = rnd(0.5, 1.4); p.c = rnd(0, 6.28); p.d = rnd(6, 16);
            p.s.anchor.set(0.5);
            p.s.scale.set(p.size / 16);
            p.s.alpha = rnd(0.65, 0.95);
            p.s.tint = 0xffffff;
        },
        step(p, dt, { r, t }) {
            p.y += p.vy * dt;
            p.a += 18 * dt; // vento leve
            if (p.y > r.y + r.h + 8) return false;
            p.s.position.set(wrap(p.a + Math.sin(t * p.b + p.c) * p.d, r.x, r.w), p.y);
            return true;
        }
    }),
    sand: () => sideStreak({ cap: 190, density: 1 / 2100, speed: [650, 1050], drift: 0.12, len: [10, 34], alpha: [0.45, 0.8], tints: [0xf6dea6, 0xe0b878, 0xc89a5a], width: 2 }),
    dust: () => blobs({ cap: 9, size: [160, 300], vx: [160, 260], vy: [-6, 6], alpha: [0.18, 0.3], tints: [0xd2a35f, 0xe3bf7d] }),
    heat: () => blobs({ cap: 8, size: [180, 320], vx: [-8, 8], vy: [-22, -10], alpha: [0.05, 0.09], tints: [0xffb25a, 0xffd28a], blend: 'add' }),
    smog: () => blobs({ cap: 12, size: [200, 380], vx: [-18, 18], vy: [-6, 6], alpha: [0.22, 0.36], tints: [0x6fbf4a, 0x4f9f3a, 0x8a4fa8, 0x7fcf5a] }),
    embers: () => motes({ cap: 28, density: 1 / 14000, size: [5, 11], vy: [-28, -10], sway: 14, alpha: 0.6, tints: [0xff4a3a, 0xff7a4a, 0xd02030], life: [4, 7] }),
    moon: () => ({
        // Halo vermelho no canto + disco da lua (semi-transparente para não esconder a casa)
        space: 'screen', cap: 2, tex: 'soft', blend: 'add',
        init(p) { p.s.anchor.set(0.5); },
        step(p, _dt, { r, t, w }) {
            const m = Math.min(r.w, r.h);
            p.s.position.set(r.x + r.w * 0.9, r.y + r.h * 0.1);
            if (p.a === 0) { p.s.tint = 0xc01020; p.s.scale.set(m * 0.55 / 64); p.s.alpha = 0.4 + Math.sin(t * 0.8) * 0.06; }
            else { if (p.s.texture !== w.moonTex) { p.s.texture = w.moonTex; p.s.blendMode = 'normal'; } p.s.tint = 0xffffff; p.s.scale.set(m * 0.075 / 64); p.s.alpha = 0.72; }
            return true;
        },
        frame(em) { em.parts.forEach((p, i) => { p.a = i; }); }
    }),
    vortex: () => ({
        space: 'screen', cap: 120, density: 1 / 3500, tex: 'soft', blend: 'add',
        init(p, { r }, first) {
            const R = Math.min(r.w, r.h) * 0.5;
            p.a = rnd(0, Math.PI * 2);
            p.b = first ? rnd(0.08, 1) * R : rnd(0.75, 1.05) * R;
            p.c = R;
            p.size = rnd(2, 4.5);
            p.s.anchor.set(0.5);
            p.s.scale.set(p.size / 26);
            p.s.tint = pick([0xb26bff, 0x7f5bff, 0x5fd8ff, 0xff7ae0]);
        },
        step(p, dt, { r }) {
            const R = Math.min(r.w, r.h) * 0.5;
            p.b -= (14 + 30 * (1 - p.b / R)) * dt;
            p.a += (0.25 + 22 / (p.b + 24)) * dt;
            if (p.b < 6) return false;
            const k = p.b / R;
            p.s.alpha = Math.min(1, (1 - k) * 3) * Math.min(1, k * 5) * 0.75;
            p.s.position.set(r.x + r.w / 2 + Math.cos(p.a) * p.b, r.y + r.h / 2 + Math.sin(p.a) * p.b * 0.92);
            return true;
        }
    }),
    riftcore: () => ({
        space: 'screen', cap: 1, tex: 'soft', blend: 'add',
        init(p) { p.s.anchor.set(0.5); p.s.tint = 0x8a4dff; },
        step(p, _dt, { r, t }) {
            p.s.position.set(r.x + r.w / 2, r.y + r.h / 2);
            p.s.scale.set(Math.min(r.w, r.h) * (0.38 + Math.sin(t * 1.3) * 0.03) / 64);
            p.s.alpha = 0.22 + Math.sin(t * 2.1) * 0.06;
            return true;
        }
    }),
    mystic: () => motes({ cap: 70, density: 1 / 7000, size: [4, 11], vy: [-30, -8], sway: 12, alpha: 0.75, tints: [0xff8ad8, 0xc78bff, 0xffb8ec, 0x9f7bff], life: [4, 8] }),
    shiny: () => tileTwinkle({ cap: 34, tiles: 'nature', size: [16, 30], tints: [0xffffff, 0xfff0a0, 0xa8eeff], life: [0.7, 1.4] }),
    legend: () => tileTwinkle({ cap: 34, tiles: 'nature', size: [18, 34], tints: [0xffd84d, 0xc9a0ff, 0xffffff, 0xff9de0], life: [0.8, 1.6] }),
    glint: () => tileTwinkle({ cap: 26, tiles: 'all', size: [14, 26], tints: [0xffe27a, 0xfff4c0, 0xffc53a], life: [0.5, 1.0], spin: 2 }),
    jackpot: () => tileTwinkle({ cap: 18, tiles: 'special', size: [20, 36], tints: [0xffe27a, 0xff9de0, 0x9fe8ff], life: [0.5, 1.0], spin: 2 }),
    coins: () => ({
        space: 'screen', cap: 16, density: 1 / 26000, tex: 'coin', blend: 'normal',
        init(p, { r }, first) {
            p.x = rnd(r.x, r.x + r.w); p.y = first ? rnd(r.y, r.y + r.h) : r.y - 12;
            p.vy = rnd(35, 70); p.size = rnd(9, 15); p.b = rnd(3, 6); p.c = rnd(0, 6.28);
            p.s.anchor.set(0.5); p.s.alpha = 0.9; p.s.tint = 0xffffff;
        },
        step(p, dt, { r, t }) {
            p.y += p.vy * dt;
            if (p.y > r.y + r.h + 10) return false;
            p.s.scale.set(p.size / 32 * Math.cos(t * p.b + p.c), p.size / 32);
            p.s.position.set(p.x + Math.sin(t + p.c) * 6, p.y);
            return true;
        }
    }),
    glitch: () => ({
        space: 'screen', cap: 7, tex: 'white', blend: 'add',
        init(p) { p.s.visible = false; p.s.anchor.set(0, 0.5); p.d = 0; },
        step(p, dt, { r, w }) {
            if (!w.glitching) { p.s.visible = false; return true; }
            p.d -= dt;
            if (p.d <= 0) {
                p.d = rnd(0.03, 0.08);
                p.s.visible = Math.random() < 0.75;
                const bw = r.w * rnd(0.25, 1);
                p.s.position.set(r.x + rnd(0, r.w - bw), r.y + rnd(0, r.h));
                p.s.width = bw; p.s.height = rnd(1.5, 7);
                p.s.tint = pick([0x6ff7ff, 0xff5cf0, 0xffffff]);
                p.s.alpha = rnd(0.12, 0.32);
            }
            return true;
        },
        frame(em, _dt, { t, w }) {
            // state[0] = início do próximo surto, state[1] = fim do surto atual
            if (em.state.length < 2) em.state.push(t + rnd(1, 2.5), 0);
            if (t >= em.state[0]) { em.state[1] = t + rnd(0.12, 0.3); em.state[0] = t + rnd(2.2, 5); }
            w.glitching = t < em.state[1];
        }
    }),
    wind: () => sideStreak({ cap: 34, density: 1 / 11000, speed: [520, 820], drift: 0.04, len: [34, 70], alpha: [0.12, 0.26], tints: [0xffffff, 0xe0f4ff], width: 1.4 }),
    exp: () => motes({ cap: 40, density: 1 / 12000, size: [5, 12], vy: [18, 40], sway: 8, alpha: 0.7, tints: [0x7fffd0, 0x8fd8ff, 0xc8ff8a], life: [3, 6] }),
    virus: () => motes({ cap: 40, density: 1 / 12000, size: [4, 8], vy: [-14, 14], sway: 16, alpha: 0.7, tints: [0xff5fb0, 0xd04fff, 0xff8ad0], life: [3, 6] }),
    souls: () => motes({ cap: 30, density: 1 / 14000, size: [7, 14], vy: [-22, -8], sway: 18, alpha: 0.55, tints: [0x8fa8ff, 0xb48cff, 0xd8e0ff], life: [4, 8] }),
    cards: () => motes({ cap: 22, density: 1 / 20000, size: [10, 18], vy: [-16, -6], sway: 10, alpha: 0.85, tints: [0xffe27a, 0xffffff, 0x9fe8ff], life: [2.5, 5], tex: 'star' }),
};

const LOOKS: Record<string, Look> = {
    RAIN: { mul: 0x6c84b8, mulA: 0.55, tint: 0x14244c, tintA: 0.12, vig: 0x0b1530, vigA: 0.55, fx: ['rain', 'splash'] },
    WINTER_STORM: { mul: 0xb4ccff, mulA: 0.5, tint: 0xeef8ff, tintA: 0.2, vig: 0xf2fbff, vigA: 0.6, fx: ['snow'] },
    SANDSTORM: { mul: 0xe8b070, mulA: 0.6, tint: 0xd09a50, tintA: 0.2, vig: 0x7a4f1e, vigA: 0.6, fx: ['sand', 'dust'] },
    DROUGHT: { mul: 0xffd090, mulA: 0.35, tint: 0xffa040, tintA: 0.07, vig: 0xff6a10, vigA: 0.4, fx: ['heat'] },
    TOXIC_SMOG: { mul: 0xa0d488, mulA: 0.5, tint: 0x4f8f2a, tintA: 0.12, vig: 0x3a1a4a, vigA: 0.6, fx: ['smog'] },
    BLOOD_MOON: { mul: 0xd84858, mulA: 0.5, tint: 0x500010, tintA: 0.16, vig: 0x300006, vigA: 0.75, night: true, fx: ['moon', 'embers'] },
    SPATIAL_RIFT: { mul: 0xa898e8, mulA: 0.45, tint: 0x24104a, tintA: 0.1, vig: 0x2a0a5a, vigA: 0.65, fx: ['riftcore', 'vortex'] },
    MYSTIC_AURA: { mul: 0xf0c0f0, mulA: 0.35, tint: 0xff80d0, tintA: 0.07, vig: 0x8a3aa8, vigA: 0.45, fx: ['mystic'] },
    SHINY_FEVER: { mul: 0xfff4d0, mulA: 0.2, tint: 0xfff0a0, tintA: 0.05, vig: 0xffe9a0, vigA: 0.35, fx: ['shiny'] },
    LEGENDARY_FEVER: { mul: 0xe0d0ff, mulA: 0.3, tint: 0xd0a0ff, tintA: 0.06, vig: 0x6a3ab0, vigA: 0.45, fx: ['legend'] },
    GOLD_RUSH: { mul: 0xffe8b0, mulA: 0.25, tint: 0xffd040, tintA: 0.05, vig: 0xd9a020, vigA: 0.4, fx: ['glint', 'coins'] },
    LOTTERY_DAY: { mul: 0xfff0d8, mulA: 0.15, tint: 0xffe080, tintA: 0.05, vig: 0xff9de0, vigA: 0.35, fx: ['jackpot', 'coins'] },
    EMP: { mul: 0x98a8b8, mulA: 0.45, vig: 0x0a2030, vigA: 0.5, fx: ['glitch'] },
    BERSERK_MODE: { mul: 0xffb0a0, mulA: 0.25, vig: 0xd01010, vigA: 0.45, pulse: 0.3 },
    DOUBLE_STEP: { tint: 0xe0f4ff, tintA: 0.05, vig: 0xd8f0ff, vigA: 0.25, fx: ['wind'] },
    QUICKSAND: { mul: 0xe0c090, mulA: 0.4, vig: 0x6a4a20, vigA: 0.45 },
    SAFARI_ZONE: { mul: 0xe8f0b8, mulA: 0.25, vig: 0x4a6a20, vigA: 0.35 },
    SOUL_LINK: { mul: 0xa8a8e0, mulA: 0.4, vig: 0x20184a, vigA: 0.55, fx: ['souls'] },
    EXP_BURST: { tint: 0x80ffd0, tintA: 0.05, vig: 0x40c0a0, vigA: 0.25, fx: ['exp'] },
    POKERUS_OUTBREAK: { mul: 0xf0c8f0, mulA: 0.25, vig: 0x8a2a8a, vigA: 0.4, fx: ['virus'] },
    ROCKET: { mul: 0xd8c0c8, mulA: 0.3, vig: 0x6a0a1a, vigA: 0.45 },
    MEGA_BLOCK: { mul: 0xb8b8c4, mulA: 0.4, vig: 0x202028, vigA: 0.45 },
    GYM_RUSH: { vig: 0xe0a92e, vigA: 0.35 },
    GYM_VACATION: { mul: 0xfff0d0, mulA: 0.2, tint: 0x80d8ff, tintA: 0.05 },
    CARD_FESTIVAL: { vig: 0xffd36b, vigA: 0.3, fx: ['cards'] },
    TAX_SEASON: { mul: 0xd0d0c8, mulA: 0.3 },
    TRUCO_SEIS: { vig: 0x8a1a1a, vigA: 0.3 },
    ROBIN_HOOD: { tint: 0x9fe870, tintA: 0.05 },
};

// Ciclo dia/noite: manhã → dia → entardecer → noite, 4 rodadas cada
const DAY: { mul: number; mulA: number; tint: number; tintA: number; night: number }[] = [
    { mul: 0xfff0d8, mulA: 0.18, tint: 0xffd8a0, tintA: 0.05, night: 0 },   // manhã
    { mul: 0xffffff, mulA: 0, tint: 0xffffff, tintA: 0, night: 0 },         // dia
    { mul: 0xffa878, mulA: 0.45, tint: 0xff7040, tintA: 0.07, night: 0.35 }, // entardecer
    { mul: 0x5060a8, mulA: 0.5, tint: 0x0a1030, tintA: 0.1, night: 1 }     // noite
];
export const ROUNDS_PER_PHASE = 4;

type RGB = [number, number, number];
const toRGB = (n: number, out: RGB): RGB => { out[0] = (n >> 16) & 255; out[1] = (n >> 8) & 255; out[2] = n & 255; return out; };
const toNum = (c: RGB) => ((c[0] & 255) << 16) | ((c[1] & 255) << 8) | (c[2] & 255);
const tmp: RGB = [0, 0, 0];
const lerpRGB = (c: RGB, target: number, k: number) => {
    toRGB(target, tmp);
    c[0] += (tmp[0] - c[0]) * k; c[1] += (tmp[1] - c[1]) * k; c[2] += (tmp[2] - c[2]) * k;
};

type Channel = { s: Sprite; c: RGB; a: number };

export class BoardWeather {
    private P: typeof import('pixi.js');
    private tex: BoardTex;
    private T: number;
    private screen: Container;      // partículas de tela + vinheta (acima do mundo)
    private screenFx: Container;
    private worldFx: Container;     // brilhos ancorados nas casas
    private grade: Container;       // grading (abaixo dos peões)
    private glowLayer: Container;   // luzes noturnas das cidades/eventos
    private dnMul: Channel; private dnTint: Channel; private evMul: Channel; private evTint: Channel; private vig: Channel;
    private glows: { s: Sprite; phase: number }[] = [];
    private emitters: Emitter[] = [];
    private eventId: string | null | undefined = undefined;
    private forcedEvent: string | null | undefined = undefined;
    private phase = -1;
    private look: Look = {};
    private nightTarget = 0;
    night = 0;
    glitching = false;
    reduced = false;
    get moonTex() { return this.tex.moon; }
    private tiles: Record<'nature' | 'water' | 'all' | 'special', number[]> = { nature: [], water: [], all: [], special: [] };
    private ctx: Ctx;
    private time = 0;

    constructor(P: typeof import('pixi.js'), layers: { grade: Container; glow: Container; worldFx: Container; screen: Container }, T: number) {
        this.P = P;
        this.T = T;
        this.tex = boardTextures(P);
        this.grade = layers.grade;
        this.glowLayer = layers.glow;
        this.worldFx = layers.worldFx;
        this.screen = layers.screen;
        this.screenFx = new P.Container();
        const mk = (blend: 'multiply' | 'normal', parent: Container, tex: Texture = P.Texture.WHITE): Channel => {
            const s = new P.Sprite(tex);
            s.blendMode = blend;
            s.alpha = 0;
            s.eventMode = 'none';
            parent.addChild(s);
            return { s, c: [255, 255, 255], a: 0 };
        };
        this.dnMul = mk('multiply', this.grade);
        this.evMul = mk('multiply', this.grade);
        this.dnTint = mk('normal', this.grade);
        this.evTint = mk('normal', this.grade);
        this.screen.addChild(this.screenFx);
        this.vig = mk('normal', this.screen, this.tex.vignette);
        this.ctx = { r: { x: 0, y: 0, w: 1, h: 1 }, t: 0, w: this, T };
        try {
            const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
            this.reduced = mq.matches;
            mq.addEventListener?.('change', () => { this.reduced = mq.matches; this.eventId = undefined; });
        } catch { /* sem matchMedia */ }
    }

    // Recria o que depende do mapa (novo jogo / novo tamanho)
    rebuild() {
        const size = MapSystem.size, T = this.T;
        for (const ch of [this.dnMul, this.evMul, this.dnTint, this.evTint]) {
            ch.s.position.set(0, 0);
            ch.s.width = size * T; ch.s.height = size * T;
        }
        this.glowLayer.removeChildren().forEach(c => c.destroy());
        this.glows = [];
        const t = this.tiles;
        t.nature = []; t.water = []; t.all = []; t.special = [];
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const v = MapSystem.grid[y]?.[x];
                const i = y * size + x;
                t.all.push(i);
                if (v === TILE.GRASS) t.nature.push(i);
                if (v === TILE.WATER) { t.water.push(i); t.nature.push(i); }
                if (v === TILE.CITY || v === TILE.EVENT || v === TILE.GYM) t.special.push(i);
                if (v === TILE.CITY || v === TILE.GYM) {
                    const s = new this.P.Sprite(this.tex.soft);
                    s.anchor.set(0.5);
                    s.blendMode = 'add';
                    s.tint = v === TILE.CITY ? 0xffd890 : v === TILE.GYM ? 0xffc04a : 0x9fd0ff;
                    s.position.set(x * T + T / 2, y * T + T / 2);
                    s.scale.set((T * 1.25) / 64);
                    s.alpha = 0;
                    this.glowLayer.addChild(s);
                    this.glows.push({ s, phase: (x * 1.7 + y * 2.3) % 6.28 });
                }
            }
        }
        // Partículas presas a casas antigas precisam renascer
        this.emitters.forEach(em => { if (em.def.space === 'world') em.parts.forEach(p => em.def.init(p, this.ctx, true)); });
    }

    randomTile(kind: 'nature' | 'water' | 'all' | 'special') {
        const list = this.tiles[kind];
        return list.length ? list[(Math.random() * list.length) | 0] : -1;
    }
    hasTiles(kind: 'nature' | 'water' | 'all' | 'special') { return this.tiles[kind].length > 0; }

    // Força um evento (debug/teste). undefined volta a ler do GameState.
    setEvent(id: string | null | undefined) { this.forcedEvent = id; }

    private applyEvent(id: string | null) {
        this.eventId = id;
        this.look = (id && LOOKS[id]) || {};
        const want = new Set(this.reduced ? [] : (this.look.fx || []));
        this.emitters.forEach(em => { em.target = want.has(em.key) ? 1 : 0; });
        want.forEach(key => {
            const existing = this.emitters.find(e => e.key === key);
            if (existing) { existing.target = 1; return; }
            if (EMITTERS[key]) this.emitters.push(this.makeEmitter(key));
        });
    }

    private makeEmitter(key: string): Emitter {
        const P = this.P;
        const def = EMITTERS[key]();
        const node = new P.Container();
        node.alpha = 0;
        (def.space === 'screen' ? this.screenFx : this.worldFx).addChild(node);
        const tex = def.tex === 'white' ? P.Texture.WHITE : this.tex[def.tex];
        const parts: Part[] = [];
        for (let i = 0; i < def.cap; i++) {
            const s = new P.Sprite(tex);
            s.eventMode = 'none';
            if (def.blend === 'add') s.blendMode = 'add';
            node.addChild(s);
            const p: Part = { s, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, a: 0, b: 0, c: 0, d: 0, size: 1 };
            def.init(p, this.ctx, true);
            parts.push(p);
        }
        return { key, def, parts, node, level: 0, target: 1, active: def.cap, state: [] };
    }

    update(dtMs: number, rect: Rect) {
        const dt = Math.min(dtMs, 66) / 1000;
        this.time += dt;
        const t = this.time;
        const c = this.ctx;
        c.r.x = rect.x; c.r.y = rect.y; c.r.w = rect.w; c.r.h = rect.h; c.t = t;

        const id = this.forcedEvent !== undefined ? this.forcedEvent : (GameState.currentGlobalEvent?.id ?? null);
        if (id !== this.eventId) this.applyEvent(id);

        const phase = Math.floor(Math.max(0, (GameState.round || 1) - 1) / ROUNDS_PER_PHASE) % DAY.length;
        this.phase = phase;
        const day = this.look.night ? DAY[3] : DAY[phase];
        this.nightTarget = day.night;

        // Transições suaves (~1,5s)
        const k = 1 - Math.exp(-dt * 2.2);
        const L = this.look;
        // Evento com grading próprio: suaviza o dia/noite para não escurecer demais (Lua Sangrenta mantém a noite)
        const dnScale = L.mul !== undefined && !L.night ? 0.55 : 1;
        this.ease(this.dnMul, day.mul, day.mulA * dnScale, k);
        this.ease(this.dnTint, day.tint, day.tintA, k);
        this.ease(this.evMul, L.mul ?? 0xffffff, L.mul !== undefined ? (L.mulA ?? 0.3) * (this.glitching ? 1.6 : 1) : 0, this.glitching ? 1 : k);
        this.ease(this.evTint, L.tint ?? 0xffffff, L.tint !== undefined ? (L.tintA ?? 0.05) : 0, k);
        const pulse = L.pulse && !this.reduced ? (0.5 + 0.5 * Math.sin(t * 3.2)) * L.pulse : 0;
        this.ease(this.vig, L.vig ?? 0x000000, L.vig !== undefined ? (L.vigA ?? 0.3) + pulse : (this.night > 0.5 ? 0.28 * this.night : 0), k, L.vig === undefined ? 0x050a20 : undefined);
        this.vig.s.position.set(rect.x, rect.y);
        this.vig.s.width = rect.w; this.vig.s.height = rect.h;
        this.night += (this.nightTarget - this.night) * k;

        // Luzes das cidades à noite
        const glowA = this.night * 0.42;
        this.glowLayer.visible = glowA > 0.01;
        if (this.glowLayer.visible) {
            for (let i = 0; i < this.glows.length; i++) {
                const g = this.glows[i];
                g.s.alpha = glowA * (this.reduced ? 1 : 0.82 + 0.18 * Math.sin(t * 1.8 + g.phase));
            }
        }

        // Emissores
        const area = rect.w * rect.h;
        for (let e = this.emitters.length - 1; e >= 0; e--) {
            const em = this.emitters[e];
            em.level += (em.target - em.level) * (1 - Math.exp(-dt * 2));
            if (em.target === 0 && em.level < 0.01) {
                em.node.destroy({ children: true });
                this.emitters.splice(e, 1);
                if (em.key === 'glitch') this.glitching = false;
                continue;
            }
            em.node.alpha = em.level;
            const def = em.def;
            def.frame?.(em, dt, c);
            const n = def.density ? Math.min(def.cap, Math.max(8, Math.round(area * def.density))) : def.cap;
            for (let i = 0; i < em.parts.length; i++) {
                const p = em.parts[i];
                if (i >= n) { if (p.s.visible) p.s.visible = false; continue; }
                if (def.space === 'screen' && !p.s.visible && def.tex !== 'white') { p.s.visible = true; def.init(p, c, true); }
                if (!def.step(p, dt, c)) def.init(p, c, false);
            }
        }
    }

    private ease(ch: Channel, color: number, alpha: number, k: number, colorOverride?: number) {
        lerpRGB(ch.c, colorOverride ?? color, k);
        ch.a += (alpha - ch.a) * k;
        ch.s.tint = toNum(ch.c);
        ch.s.alpha = ch.a;
        ch.s.visible = ch.a > 0.004;
    }

    get eventKey() { return this.eventId; }
    get dayPhase() { return this.phase; }
    get particleCount() {
        let n = 0;
        this.emitters.forEach(em => em.parts.forEach(p => { if (p.s.visible) n++; }));
        return n;
    }
}
