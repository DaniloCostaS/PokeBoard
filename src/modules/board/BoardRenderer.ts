import type { Application, Container, Graphics, Sprite, Texture } from 'pixi.js';

// O PixiJS é carregado sob demanda, só quando o tabuleiro aparece (a tela de login não paga esse peso)
let P: typeof import('pixi.js');
import { MapSystem } from '../../systems/MapSystem';
import { GameState } from '../game/GameState';
import { TILE, NPC_DATA } from '../../constants';
import { GYM_DATA } from '../../constants/gyms';
import { PLAYER_COLORS } from '../../constants/playerColors';
import { BoardWeather, type Rect } from './BoardWeather';
import { BoardAmbient } from './BoardAmbient';
import { boardTextures } from './BoardTextures';
import { BoardReach, computeReach } from './BoardReach';

// Tabuleiro renderizado em WebGL (PixiJS): câmera com zoom/arrasto, peões animados e efeitos.
// Mantém a mesma API que o restante do jogo usava com o tabuleiro em DOM.

const T = 64; // tamanho de uma casa em unidades de mundo
const TILE_TEXTURES: Record<number, string> = {
    [TILE.GRASS]: '/assets/img/Terrenos/Grama.jpg',
    [TILE.WATER]: '/assets/img/Terrenos/Agua.jpg',
    [TILE.GROUND]: '/assets/img/Terrenos/Areia.jpg',
    [TILE.CITY]: '/assets/img/PCMart.jpg',
    [TILE.EVENT]: '/assets/img/PokeBolaItem.jpg'
};
const TILE_TOOLTIPS: Record<number, string> = {
    [TILE.GRASS]: 'Grama · Grama, Inseto, Normal, Veneno, Voador, Noturno',
    [TILE.WATER]: 'Água · Água, Gelo, Dragão, Fada',
    [TILE.GROUND]: 'Terra/Pedra · Terra, Pedra, Fogo, Lutador, Elétrico, Psíquico, Fantasma, Aço',
    [TILE.CITY]: 'Cidade · Centro Pokémon e loja',
    [TILE.EVENT]: 'Evento · algo inesperado acontece'
};

// Um passo da caminhada: posição de destino no mundo + casa lógica (para apagar a prévia ao chegar)
type Seg = { x: number; y: number; tx: number; ty: number; warp: boolean; turn: boolean };
type Walk = { queue: Seg[]; seg: Seg | null; fromX: number; fromY: number; start: number; dur: number; n: number };

type Token = {
    root: Container;
    body: Container;      // disco + avatar + anel (balança/inclina); a sombra fica no chão
    shadow: Graphics;
    avatar: Sprite;
    avatarScale: number;
    ring: Graphics;
    r: number;
    avatarUrl: string;
    tileX: number;
    tileY: number;
    anim: { fromX: number; fromY: number; toX: number; toY: number; start: number; dur: number; hop: number } | null;
    walk: Walk;
    idx: number;
    face: number;         // para onde o avatar olha: 1 = direita, -1 = esquerda
    dir: number;          // para onde ele anda (Moon Walker: contrário de face)
    faceCur: number;
    footAt: number;       // último "pisão" (achata o corpo)
    settleAt: number;     // chegada (quique final)
};

type Puff = { s: Sprite; start: number; dur: number; x: number; y: number; vx: number; vy: number; size: number };

type Fx = { node: Container; start: number; dur: number; update: (t: number, node: Container) => void };

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hexToNum = (hex: string) => parseInt(hex.replace('#', '').slice(0, 6), 16);

export class BoardRenderer {
    static app: Application | null = null;
    static ready = false;
    static failed = false;
    private static initPromise: Promise<boolean> | null = null;
    private static pendingRender = false;

    private static world: Container;
    private static tileLayer: Container;
    private static markLayer: Container;
    private static tokenLayer: Container;
    private static fxLayer: Container;
    private static wildLayer: Container;
    private static gradeLayer: Container;
    private static glowLayer: Container;
    private static worldFxLayer: Container;
    private static pathLayer: Container;
    private static reachLayer: Container;
    private static dustLayer: Container;
    static reach: BoardReach | null = null;
    private static puffs: Puff[] = [];
    private static screenLayer: Container;
    static weather: BoardWeather | null = null;
    static ambient: BoardAmbient | null = null;
    private static screenRect: Rect = { x: 0, y: 0, w: 1, h: 1 };
    private static water: { g: Graphics; phase: number }[] = [];
    private static events: { s: Sprite; phase: number }[] = [];
    private static tokens = new Map<number, Token>();
    private static fx: Fx[] = [];
    private static size = 0;
    private static tooltip: HTMLElement | null = null;
    static onGymTap: ((actualGymId: number, gid: number) => void) | null = null;

    // Câmera
    private static zoom = 1;
    private static fitZoom = 1;
    private static camX = 0; // centro da câmera em unidades de mundo
    private static camY = 0;
    private static camTarget: { x: number; y: number; zoom: number } | null = null;
    private static userControlled = false;
    private static shakeUntil = 0;
    private static shakePower = 0;

    static async init(host: HTMLElement): Promise<boolean> {
        if (this.initPromise) return this.initPromise;
        this.initPromise = (async () => {
            try {
                P = await import('pixi.js');
                this.world = new P.Container();
                this.tileLayer = new P.Container();
                this.markLayer = new P.Container();
                this.tokenLayer = new P.Container();
                this.fxLayer = new P.Container();
                this.wildLayer = new P.Container();
                this.gradeLayer = new P.Container();
                this.glowLayer = new P.Container();
                this.worldFxLayer = new P.Container();
                this.pathLayer = new P.Container();
                this.reachLayer = new P.Container();
                this.dustLayer = new P.Container();
                this.screenLayer = new P.Container();
                for (const l of [this.wildLayer, this.gradeLayer, this.glowLayer, this.worldFxLayer, this.pathLayer, this.reachLayer, this.dustLayer, this.screenLayer]) l.eventMode = 'none';
                const app = new P.Application();
                await app.init({
                    resizeTo: host,
                    backgroundAlpha: 0,
                    antialias: true,
                    autoDensity: true,
                    resolution: Math.min(window.devicePixelRatio || 1, 2),
                    preference: 'webgl'
                });
                app.canvas.classList.add('pb-board-canvas');
                host.appendChild(app.canvas);
                // Ordem: casas → selvagens → marcações → grading/noite → luzes → brilhos → caminho → peões → efeitos
                this.world.addChild(this.tileLayer, this.wildLayer, this.markLayer, this.gradeLayer, this.glowLayer, this.worldFxLayer, this.reachLayer, this.pathLayer, this.dustLayer, this.tokenLayer, this.fxLayer);
                app.stage.addChild(this.world, this.screenLayer);
                this.weather = new BoardWeather(P, { grade: this.gradeLayer, glow: this.glowLayer, worldFx: this.worldFxLayer, screen: this.screenLayer }, T);
                this.ambient = new BoardAmbient(P, { wild: this.wildLayer, path: this.pathLayer }, T);
                this.ambient.reduced = this.weather.reduced;
                this.reach = new BoardReach(P, this.reachLayer, T);
                this.bindRollHover();
                // Com o Pixi ativo o clima é desenhado aqui; desliga as camadas CSS antigas
                host.closest('#board-wrapper')?.classList.add('pb-pixi');
                // Aba escondida: pausa o loop (economiza bateria no celular)
                document.addEventListener('visibilitychange', () => {
                    if (document.hidden) { app.ticker.stop(); return; }
                    this.syncTokens(true);
                    app.ticker.start();
                });
                app.ticker.add(() => this.tick());
                this.app = app;
                this.bindInput(app.canvas);
                const recenter = document.createElement('button');
                recenter.type = 'button';
                recenter.className = 'pb-board-recenter';
                recenter.setAttribute('aria-label', 'Ver tabuleiro inteiro');
                recenter.title = 'Ver tabuleiro inteiro';
                recenter.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
                recenter.addEventListener('click', () => this.resetCamera());
                (host.parentElement || host).appendChild(recenter);
                new ResizeObserver(() => this.onResize()).observe(host);
                this.ready = true;
                if (this.pendingRender) this.render();
                return true;
            } catch (err) {
                console.warn('[BoardRenderer] WebGL indisponível, usando tabuleiro em DOM.', err);
                this.failed = true;
                return false;
            }
        })();
        return this.initPromise;
    }

    // ------------------------------------------------------------------
    // Tabuleiro
    // ------------------------------------------------------------------
    static render() {
        if (!this.ready) { this.pendingRender = true; return; }
        this.pendingRender = false;
        this.size = MapSystem.size;
        this.tileLayer.removeChildren().forEach(c => c.destroy());
        this.water = [];
        this.events = [];

        const urls = new Set<string>(Object.values(TILE_TEXTURES));
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const url = this.tileImage(x, y);
                if (url) urls.add(url);
            }
        }

        // Fundo da grade (aparece entre as casas)
        const bg = new P.Graphics().rect(-2, -2, this.size * T + 4, this.size * T + 4).fill(0x0d141a);
        this.tileLayer.addChild(bg);

        P.Assets.load([...urls]).catch(() => null).finally(() => {
            for (let y = 0; y < this.size; y++) {
                for (let x = 0; x < this.size; x++) this.drawTile(x, y);
            }
        });

        this.fitCamera(true);
        this.syncTokens(true);
        this.weather?.rebuild();
        this.ambient?.rebuild();
    }

    private static tileImage(x: number, y: number): string | null {
        const t = MapSystem.grid[y]?.[x];
        if (TILE_TEXTURES[t]) return TILE_TEXTURES[t];
        if (NPC_DATA[t]?.img) return `/assets/img/NPCs/${NPC_DATA[t].img}`;
        if (t === TILE.GYM) {
            const gData = this.gymAt(x, y);
            if (gData) return `/assets/img/Ginasios/${gData.gymImg}`;
        }
        return null;
    }

    private static gymAt(x: number, y: number) {
        const gid = MapSystem.gymLocations[`${x},${y}`];
        if (!gid) return null;
        const actualGymId = GameState.activeGyms ? GameState.activeGyms[gid - 1] : gid;
        const gData = GYM_DATA.find(g => g.id === actualGymId);
        return gData ? { ...gData, gid, actualGymId } : null;
    }

    private static drawTile(x: number, y: number) {
        const t = MapSystem.grid[y][x];
        const px = x * T, py = y * T;
        const url = this.tileImage(x, y);
        if (url) {
            const s = new P.Sprite((P.Assets.get(url) as Texture | undefined) || P.Texture.WHITE);
            s.position.set(px + 1, py + 1);
            s.width = T - 2;
            s.height = T - 2;
            this.tileLayer.addChild(s);
            if (t === TILE.EVENT) this.events.push({ s, phase: (x * 7 + y * 13) % 10 });
        } else {
            this.tileLayer.addChild(new P.Graphics().rect(px + 1, py + 1, T - 2, T - 2).fill(0xbdc3c7));
        }

        if (t === TILE.WATER) {
            const g = new P.Graphics().rect(px + 1, py + 1, T - 2, T - 2).fill(0xffffff);
            g.alpha = 0;
            g.blendMode = 'add';
            this.tileLayer.addChild(g);
            this.water.push({ g, phase: (x * 0.9 + y * 0.6) });
        }

        if (t === TILE.GYM) {
            this.tileLayer.addChild(new P.Graphics().rect(px + 2, py + 2, T - 4, T - 4).stroke({ width: 3, color: 0xe0a92e }));
        }
    }

    // ------------------------------------------------------------------
    // Peões
    // ------------------------------------------------------------------
    private static tileSlot(playerIdx: number, x: number, y: number) {
        const here = GameState.players.map((p, i) => ({ p, i })).filter(({ p }) => p.x === x && p.y === y);
        const n = here.length;
        const k = Math.max(0, here.findIndex(h => h.i === playerIdx));
        if (n <= 1) return { x: x * T + T / 2, y: y * T + T / 2, scale: 1 };
        const offsets = [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]];
        const [ox, oy] = offsets[k % 4];
        return { x: x * T + T / 2 + ox * T, y: y * T + T / 2 + oy * T, scale: 0.62 };
    }

    private static makeToken(idx: number, avatarUrl: string): Token {
        const root = new P.Container();
        const body = new P.Container();
        const color = hexToNum(PLAYER_COLORS[idx % PLAYER_COLORS.length]);
        const r = T * 0.36;
        // Sombra centrada no "pé" do peão: encolhe quando ele sobe a cada passo
        const shadow = new P.Graphics().ellipse(0, 0, r * 0.8, r * 0.28).fill({ color: 0x000000, alpha: 0.35 });
        shadow.y = r * 0.95;
        const disc = new P.Graphics().circle(0, 0, r).fill(0xffffff);
        const avatar = new P.Sprite(P.Texture.EMPTY);
        avatar.anchor.set(0.5);
        const mask = new P.Graphics().circle(0, 0, r - 2).fill(0xffffff);
        avatar.mask = mask;
        const ring = new P.Graphics().circle(0, 0, r).stroke({ width: 4, color });
        body.addChild(disc, avatar, mask, ring);
        root.addChild(shadow, body);
        const tok: Token = {
            root, body, shadow, avatar, avatarScale: 1, ring, r, avatarUrl, tileX: -1, tileY: -1, anim: null,
            walk: { queue: [], seg: null, fromX: 0, fromY: 0, start: 0, dur: 0, n: 0 },
            idx, face: 1, dir: 1, faceCur: 1, footAt: 0, settleAt: 0
        };
        P.Assets.load(avatarUrl).then((tex: Texture) => {
            avatar.texture = tex;
            tok.avatarScale = (r * 2.1) / Math.max(tex.width, tex.height);
            avatar.scale.set(tok.avatarScale * tok.faceCur, tok.avatarScale);
        }).catch(() => null);
        this.tokenLayer.addChild(root);
        return tok;
    }

    private static resetPose(tok: Token) {
        tok.body.position.set(0, 0);
        tok.body.rotation = 0;
        tok.body.scale.set(1);
        tok.body.alpha = 1;
        tok.shadow.scale.set(1);
    }

    static syncTokens(instant = false) {
        if (!this.ready) return;
        // Aba escondida: o loop está parado, então não acumula caminhada para tocar tudo de uma vez na volta
        if (document.hidden) instant = true;
        const now = performance.now();
        const seen = new Set<number>();
        GameState.players.forEach((p, idx) => {
            seen.add(idx);
            let tok = this.tokens.get(idx);
            if (!tok || tok.avatarUrl !== p.avatar) {
                tok?.root.destroy({ children: true });
                tok = this.makeToken(idx, p.avatar);
                this.tokens.set(idx, tok);
                instant = true;
            }
            const slot = this.tileSlot(idx, p.x, p.y);
            const moved = tok.tileX !== p.x || tok.tileY !== p.y;
            const w = tok.walk;
            if (moved && !instant && tok.tileX >= 0) {
                const dist = Math.hypot(tok.tileX - p.x, tok.tileY - p.y);
                // Virada de linha do percurso é um passo normal; salto longe de verdade (fenda espacial, etc.) é teleporte
                const total = this.size * this.size;
                const di = Math.abs(MapSystem.getIndex(p.x, p.y) - MapSystem.getIndex(tok.tileX, tok.tileY));
                const step = di === 1 || di === total - 1;
                if (step) {
                    // Caminhada: os passos entram numa fila e o peão anda em velocidade constante, sem trancos
                    const seg: Seg = { x: slot.x, y: slot.y, tx: p.x, ty: p.y, warp: dist > 1.5, turn: idx === GameState.turn };
                    if (w.seg) w.queue.push(seg);
                    else {
                        if (tok.anim) { tok.root.position.set(tok.anim.toX, tok.anim.toY); tok.anim = null; }
                        this.startSeg(tok, seg, now, true);
                    }
                } else {
                    if (idx === GameState.turn) this.reach?.fade();
                    w.queue.length = 0; w.seg = null; w.n = 0;
                    this.resetPose(tok);
                    if (dist > 1.5) this.vortexFx(tok.root.x, tok.root.y, slot.x, slot.y);
                    tok.anim = {
                        fromX: tok.root.x, fromY: tok.root.y, toX: slot.x, toY: slot.y,
                        start: now, dur: dist > 1.5 ? 260 : 140, hop: dist > 1.5 ? 0 : T * 0.32
                    };
                }
            } else if (w.seg) {
                // Outro peão chegou/saiu da casa de destino: ajusta o ponto final da caminhada
                const last = w.queue.length ? w.queue[w.queue.length - 1] : w.seg;
                last.x = slot.x; last.y = slot.y;
            } else if (!tok.anim) {
                tok.root.position.set(slot.x, slot.y);
            } else {
                tok.anim.toX = slot.x; tok.anim.toY = slot.y;
            }
            if (instant) { w.queue.length = 0; w.seg = null; w.n = 0; tok.anim = null; tok.root.position.set(slot.x, slot.y); this.resetPose(tok); }
            tok.root.scale.set(slot.scale * (idx === GameState.turn ? 1.12 : 1));
            tok.root.zIndex = idx === GameState.turn ? 10 : 1;
            tok.tileX = p.x; tok.tileY = p.y;

            if (moved && !instant && idx === GameState.turn) this.follow(p.x, p.y);
        });
        this.tokenLayer.sortableChildren = true;
        [...this.tokens.keys()].forEach(k => {
            if (!seen.has(k)) { this.tokens.get(k)!.root.destroy({ children: true }); this.tokens.delete(k); }
        });
    }

    private static startSeg(tok: Token, seg: Seg, now: number, fromRest: boolean) {
        const w = tok.walk;
        w.fromX = tok.root.x; w.fromY = tok.root.y;
        w.seg = seg;
        w.start = now;
        // Passo base um pouco mais longo que o intervalo da lógica (150ms) para a fila nunca esvaziar no meio;
        // se acumular, acelera e alcança
        const q = w.queue.length;
        w.dur = seg.warp ? 230 : fromRest ? 190 : q >= 3 ? 95 : q >= 1 ? 135 : 165;
        if (fromRest) w.n = 0;
        const dx = seg.x - w.fromX;
        const moon = (GameState.players[tok.idx]?.effects?.moonwalker || 0) > 0;
        if (seg.warp) {
            // Virada de linha: some aqui e reaparece no começo da próxima linha
            this.teleportFx(w.fromX, w.fromY);
        } else if (Math.abs(dx) > 1) {
            // Moon Walker anda de costas: olha para um lado e desliza para o outro
            tok.dir = dx > 0 ? 1 : -1;
            tok.face = tok.dir * (moon ? -1 : 1);
        }
    }

    // Pisão: poeira (ou respingo na água / folhinhas na grama) saindo dos pés
    private static footfall(tok: Token, tx: number, ty: number, now: number) {
        tok.footAt = now;
        if (this.reducedMotion()) return;
        const tile = MapSystem.grid[ty]?.[tx];
        const tint = tile === TILE.WATER ? 0xcdeeff : tile === TILE.GRASS ? 0xd8f0b8 : 0xe9dcc0;
        const fx = tok.root.x, fy = tok.root.y + tok.r * 0.95 * tok.root.scale.y;
        const dir = tok.dir;
        for (let i = 0; i < 2; i++) {
            const side = i ? 1 : -1;
            this.puff(fx + side * T * 0.14, fy, (-dir * 0.35 + side * 0.55) * T, -T * (0.25 + Math.random() * 0.15), tint, T * (0.26 + Math.random() * 0.1), now);
        }
    }

    private static puff(x: number, y: number, vx: number, vy: number, tint: number, size: number, now: number) {
        let pf = this.puffs.find(p => !p.s.visible);
        if (!pf) {
            if (this.puffs.length >= 32) return;
            const s = new P.Sprite(boardTextures(P).soft);
            s.anchor.set(0.5);
            this.dustLayer.addChild(s);
            pf = { s, start: 0, dur: 0, x: 0, y: 0, vx: 0, vy: 0, size: 0 };
            this.puffs.push(pf);
        }
        pf.s.visible = true;
        pf.s.tint = tint;
        pf.start = now; pf.dur = 420; pf.x = x; pf.y = y; pf.vx = vx; pf.vy = vy; pf.size = size;
    }

    // Peões: caminhada (fila de passos em velocidade constante), saltos longos e quique na chegada
    private static updateTokens(now: number, t: number) {
        const reduced = this.reducedMotion();
        this.tokens.forEach((tok, idx) => {
            const w = tok.walk;
            const body = tok.body;
            let lift = 0, rot = 0, sx = 1, sy = 1, alpha = 1;
            if (w.seg) {
                let u = Math.min(1, (now - w.start) / w.dur);
                const seg = w.seg;
                if (u >= 1) {
                    // Chegou na casa: pisão, apaga a prévia até aqui e emenda o próximo passo sem parar
                    tok.root.position.set(seg.x, seg.y);
                    w.n++;
                    if (seg.turn) this.ambient?.passed(seg.tx, seg.ty);
                    if (!seg.warp) this.footfall(tok, seg.tx, seg.ty, now);
                    else this.ringFx(seg.x, seg.y, 0x9ad7ff, 0, 320, 0.3, 1.1);
                    const next = w.queue.shift();
                    if (next) {
                        const carry = Math.min(now - (w.start + w.dur), 40);
                        this.startSeg(tok, next, now - Math.max(0, carry), false);
                    } else {
                        w.seg = null;
                        tok.settleAt = now;
                    }
                } else if (seg.warp) {
                    const k = u < 0.5 ? 1 - u * 2 : (u - 0.5) * 2;
                    if (u < 0.5) tok.root.position.set(w.fromX, w.fromY);
                    else tok.root.position.set(seg.x, seg.y);
                    if (reduced) alpha = k;
                    else { sx = sy = Math.max(0.05, easeOut(k)); alpha = Math.min(1, k * 1.5); }
                } else {
                    // Começa acelerando suave; depois velocidade constante entre as casas
                    const e = w.n === 0 ? u * u * (1.5 - 0.5 * u) : u;
                    tok.root.x = lerp(w.fromX, seg.x, e);
                    tok.root.y = lerp(w.fromY, seg.y, e);
                    if (!reduced) {
                        const arc = Math.sin(u * Math.PI);
                        lift = arc * T * 0.13;
                        const sway = w.n % 2 ? 1 : -1;
                        rot = tok.face * 0.06 + sway * arc * 0.11;
                    }
                }
            } else if (tok.anim) {
                const a = tok.anim;
                const p = Math.min(1, (now - a.start) / a.dur);
                tok.root.x = lerp(a.fromX, a.toX, easeOut(p));
                tok.root.y = lerp(a.fromY, a.toY, easeOut(p));
                lift = Math.sin(p * Math.PI) * a.hop;
                if (p >= 1) tok.anim = null;
            }
            if (!reduced) {
                // Achatada no pisão e quique ao parar
                const fk = (now - tok.footAt) / 130;
                if (fk < 1 && w.seg) { const s = Math.sin(fk * Math.PI) * 0.1; sx += s; sy -= s; }
                const sk = (now - tok.settleAt) / 380;
                if (sk < 1 && !w.seg) {
                    const s = Math.sin(sk * Math.PI * 2) * (1 - sk) * 0.16;
                    sx += s; sy -= s;
                    lift += Math.max(0, -Math.sin(sk * Math.PI * 2)) * (1 - sk) * T * 0.07;
                    rot *= 1 - sk;
                }
            }
            // Vira para o lado da caminhada (giro rápido, não um corte seco)
            tok.faceCur += (tok.face - tok.faceCur) * (reduced ? 1 : 0.3);
            if (Math.abs(tok.face - tok.faceCur) < 0.01) tok.faceCur = tok.face;
            const fc = Math.abs(tok.faceCur) < 0.08 ? (tok.face > 0 ? 0.08 : -0.08) : tok.faceCur;
            tok.avatar.scale.set(tok.avatarScale * fc, tok.avatarScale);
            // O corpo achata a partir do chão (base do disco), não do centro
            body.scale.set(sx, sy);
            body.position.set(0, tok.r * (1 - sy) - lift);
            body.rotation = rot;
            body.alpha = alpha;
            const sh = 1 - Math.min(0.45, lift / (T * 0.5));
            tok.shadow.scale.set(sh * sx, sh);
            tok.shadow.alpha = alpha;
            tok.ring.alpha = idx === GameState.turn ? 0.75 + Math.sin(t * 5) * 0.25 : 1;
        });

        for (const pf of this.puffs) {
            if (!pf.s.visible) continue;
            const k = (now - pf.start) / pf.dur;
            if (k >= 1) { pf.s.visible = false; continue; }
            const e = easeOut(k);
            pf.s.position.set(pf.x + pf.vx * e * 0.4, pf.y + pf.vy * e * 0.4);
            pf.s.scale.set(pf.size * (0.5 + e * 0.8) / 64);
            pf.s.alpha = 0.75 * (1 - k);
        }
    }

    static flashTile(x: number, y: number) {
        if (!this.ready) return;
        const g = new P.Graphics().rect(x * T + 1, y * T + 1, T - 2, T - 2).fill({ color: 0xffe08a, alpha: 0.55 });
        this.fxLayer.addChild(g);
        this.addFx(g, 320, (t, n) => { n.alpha = 1 - t; });
    }

    // ------------------------------------------------------------------
    // Efeitos
    // ------------------------------------------------------------------
    private static addFx(node: Container, dur: number, update: Fx['update']) {
        this.fx.push({ node, start: performance.now(), dur, update });
    }

    private static tokenPos(playerIdx: number) {
        const tok = this.tokens.get(playerIdx);
        if (tok) return { x: tok.root.x, y: tok.root.y };
        const p = GameState.players[playerIdx];
        return p ? { x: p.x * T + T / 2, y: p.y * T + T / 2 } : null;
    }

    static floatText(playerIdx: number, text: string, color = '#ffd36b') {
        if (!this.ready) return;
        const pos = this.tokenPos(playerIdx);
        if (!pos) return;
        const label = new P.Text({
            text,
            style: { fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif', fontSize: 26, fontWeight: '800', fill: color, stroke: { color: 0x0d141a, width: 6 } }
        });
        label.anchor.set(0.5);
        // Na primeira linha do tabuleiro o texto sobe para dentro dele, não para fora
        const below = pos.y < T * 1.2;
        label.position.set(pos.x, pos.y + (below ? T * 0.5 : -T * 0.5));
        this.fxLayer.addChild(label);
        const y0 = label.y;
        this.addFx(label, 1300, (t, n) => {
            n.y = y0 + (below ? 1 : -1) * easeOut(t) * T * 0.9;
            n.alpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
            n.scale.set(t < 0.15 ? lerp(0.6, 1.1, t / 0.15) : 1);
        });
    }

    static emote(playerIdx: number, emoji: string) {
        if (!this.ready) return;
        const pos = this.tokenPos(playerIdx);
        if (!pos) return;
        const bubble = new P.Container();
        const bg = new P.Graphics().roundRect(-30, -30, 60, 54, 16).fill(0xffffff).stroke({ width: 2, color: 0x0d141a });
        const tail = new P.Graphics().poly([-8, 24, 8, 24, 0, 34]).fill(0xffffff);
        const glyph = new P.Text({ text: emoji, style: { fontSize: 34 } });
        glyph.anchor.set(0.5);
        glyph.y = -3;
        bubble.addChild(bg, tail, glyph);
        const below = pos.y < T * 1.2;
        if (below) tail.scale.y = -1;
        bubble.position.set(pos.x, pos.y + (below ? T * 0.95 : -T * 0.95));
        this.fxLayer.addChild(bubble);
        const y0 = bubble.y;
        this.addFx(bubble, 2200, (t, n) => {
            const pop = t < 0.1 ? easeOut(t / 0.1) : 1;
            n.scale.set(pop * (1 + Math.sin(t * 18) * 0.02));
            n.y = y0 - Math.sin(t * Math.PI) * 6;
            n.alpha = t > 0.85 ? 1 - (t - 0.85) / 0.15 : 1;
        });
    }

    static burst(x: number, y: number, color = 0xffd36b, count = 14) {
        if (!this.ready) return;
        const cx = x * T + T / 2, cy = y * T + T / 2;
        for (let i = 0; i < count; i++) {
            const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
            const speed = T * (0.6 + Math.random() * 0.6);
            const dot = new P.Graphics().circle(0, 0, 3 + Math.random() * 3).fill(color);
            dot.position.set(cx, cy);
            this.fxLayer.addChild(dot);
            this.addFx(dot, 650, (t, n) => {
                n.x = cx + Math.cos(a) * speed * easeOut(t);
                n.y = cy + Math.sin(a) * speed * easeOut(t) + t * t * T * 0.4;
                n.alpha = 1 - t;
            });
        }
    }

    private static teleportFx(wx: number, wy: number) {
        const ring = new P.Graphics().circle(0, 0, T * 0.4).stroke({ width: 4, color: 0x9ad7ff });
        ring.position.set(wx, wy);
        this.fxLayer.addChild(ring);
        this.addFx(ring, 450, (t, n) => { n.scale.set(1 + t * 1.4); n.alpha = 1 - t; });
    }

    static shake(power = 6, ms = 260) {
        if (this.reducedMotion()) return;
        this.shakePower = power;
        this.shakeUntil = performance.now() + ms;
    }

    static focusTile(x: number, y: number) {
        if (!this.ready || this.userControlled) return;
        if (this.size < 20) return;
        this.camTarget = { x: x * T + T / 2, y: y * T + T / 2, zoom: Math.max(this.fitZoom * 1.8, this.zoom) };
    }

    // ------------------------------------------------------------------
    // Atmosfera, prévia do caminho e efeitos de casa
    // ------------------------------------------------------------------
    // Área do tabuleiro visível na tela (px CSS): clima e vinheta ficam só sobre ela
    private static updateAtmosphere(now: number) {
        if (!this.weather || !this.app) return;
        const { w, h } = this.viewSize();
        const bw = this.size * T * this.zoom;
        const r = this.screenRect;
        const x0 = Math.max(0, this.world.x), y0 = Math.max(0, this.world.y);
        const x1 = Math.min(w, this.world.x + bw), y1 = Math.min(h, this.world.y + bw);
        r.x = x0; r.y = y0; r.w = Math.max(1, x1 - x0); r.h = Math.max(1, y1 - y0);
        this.weather.update(this.app.ticker.deltaMS, r);
        if (this.ambient) {
            this.ambient.reduced = this.weather.reduced;
            this.ambient.update(now);
        }
    }

    // Casas que o peão vai percorrer a partir de (x,y), sem mexer no estado (respeita volta e Moon Walker)
    static pathFrom(x: number, y: number, steps: number, backwards = false) {
        const total = MapSystem.size * MapSystem.size;
        let i = MapSystem.getIndex(x, y);
        const out: { x: number; y: number }[] = [];
        for (let k = 0; k < Math.min(steps, 60); k++) {
            i = backwards ? (i - 1 + total) % total : (i + 1) % total;
            out.push(MapSystem.getCoord(i));
        }
        return out;
    }

    static previewPath(coords: { x: number; y: number }[]) {
        if (!this.ready) return;
        this.reach?.fade();
        this.ambient?.previewPath(coords);
    }

    static clearPath() { this.ambient?.clearPath(true); this.reach?.fade(); }

    // Casas alcançáveis: aparece quando o dado começa a girar (idempotente para o mesmo jogador)
    static previewReach(pid: number) {
        if (!this.ready || !this.reach) return;
        if (this.reach.rolling(pid)) return;
        const plan = computeReach(pid);
        if (plan) this.reach.show(plan);
    }

    // O dado parou: destaca a casa do valor sorteado
    static reachResult(die: number) { this.reach?.pick(die); }

    // Hover no botão de rolar (mouse): mostra as opções antes de rolar
    private static bindRollHover() {
        const isRoll = (el: EventTarget | null) => !!(el as HTMLElement | null)?.closest?.('#roll-btn');
        document.addEventListener('pointerover', (e) => {
            if (e.pointerType !== 'mouse' || !isRoll(e.target) || !this.reach) return;
            const p = GameState.getCurrentPlayer();
            if (!p || p.isCPU || GameState.hasRolled || !GameState.canAct() || this.reach.plan) return;
            const plan = computeReach(GameState.turn);
            if (plan) this.reach.show(plan, true);
        });
        document.addEventListener('pointerout', (e) => {
            if (!isRoll(e.target) || isRoll(e.relatedTarget)) return;
            if (this.reach?.hover) this.reach.fade();
        });
    }

    private static reducedMotion() { return !!this.weather?.reduced; }

    private static fxSprite(tex: Texture, wx: number, wy: number, tint: number, add = true) {
        const s = new P.Sprite(tex);
        s.anchor.set(0.5);
        s.position.set(wx, wy);
        s.tint = tint;
        if (add) s.blendMode = 'add';
        this.fxLayer.addChild(s);
        return s;
    }

    private static ringFx(wx: number, wy: number, tint: number, delay = 0, dur = 700, from = 0.3, to = 1.5) {
        const tex = boardTextures(P);
        const s = this.fxSprite(tex.ring, wx, wy, tint);
        s.alpha = 0;
        const total = dur + delay;
        this.addFx(s, total, (t, n) => {
            const k = Math.max(0, (t * total - delay) / dur);
            n.scale.set((from + (to - from) * easeOut(k)) * T / 64);
            n.alpha = k <= 0 ? 0 : 1 - k;
        });
    }

    private static sparkles(wx: number, wy: number, tints: number[], count = 10, spread = 0.9, dur = 750) {
        const tex = boardTextures(P);
        for (let i = 0; i < count; i++) {
            const a = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const dist = T * spread * (0.5 + Math.random() * 0.6);
            const size = T * (0.22 + Math.random() * 0.22);
            const s = this.fxSprite(tex.star, wx, wy, tints[i % tints.length]);
            const spin = (Math.random() - 0.5) * 6;
            this.addFx(s, dur, (t, n) => {
                const e = easeOut(t);
                n.position.set(wx + Math.cos(a) * dist * e, wy + Math.sin(a) * dist * e);
                n.scale.set(size / 48 * Math.sin(Math.min(1, t * 1.3) * Math.PI));
                n.rotation = spin * t;
                n.alpha = 1 - t * t;
            });
        }
    }

    private static tileGlow(x: number, y: number, color: number, alpha = 0.55, dur = 600) {
        const g = new P.Graphics().rect(x * T + 1, y * T + 1, T - 2, T - 2).fill({ color, alpha });
        g.blendMode = 'add';
        this.fxLayer.addChild(g);
        this.addFx(g, dur, (t, n) => { n.alpha = 1 - t; });
    }

    // Cidade: anel verde de cura e brilhos subindo
    static healFx(x: number, y: number) {
        if (!this.ready) return;
        const cx = x * T + T / 2, cy = y * T + T / 2;
        const tex = boardTextures(P);
        this.tileGlow(x, y, 0x5cff9a, 0.4, 700);
        this.ringFx(cx, cy, 0x7dffb0, 0, 750);
        this.ringFx(cx, cy, 0xc8ffd8, 200, 750);
        for (let i = 0; i < 9; i++) {
            const ox = (Math.random() - 0.5) * T * 0.8, delay = Math.random() * 350;
            const s = this.fxSprite(tex.star, cx + ox, cy, i % 2 ? 0x9dffb8 : 0xffffff);
            s.alpha = 0;
            const size = T * (0.18 + Math.random() * 0.14);
            this.addFx(s, 1100, (t, n) => {
                const k = Math.max(0, (t * 1100 - delay) / (1100 - delay));
                n.y = cy + T * 0.25 - easeOut(k) * T * 0.9;
                n.scale.set(size / 48);
                n.alpha = k <= 0 ? 0 : Math.sin(k * Math.PI);
            });
        }
    }

    // Evento: pokébola salta da casa, abre num estouro de brilhos
    static eventFx(x: number, y: number) {
        if (!this.ready) return;
        const cx = x * T + T / 2, cy = y * T + T / 2;
        const ball = this.fxSprite(boardTextures(P).pokeball, cx, cy, 0xffffff, false);
        ball.scale.set(0);
        let opened = false;
        this.addFx(ball, 1100, (t, n) => {
            const pop = t < 0.25 ? easeOut(t / 0.25) * 1.15 : t < 0.35 ? lerp(1.15, 1, (t - 0.25) / 0.1) : 1;
            n.scale.set(pop * T * 0.62 / 64);
            n.y = cy - easeOut(Math.min(1, t / 0.4)) * T * 0.55;
            n.rotation = t > 0.35 && t < 0.6 ? Math.sin((t - 0.35) * 40) * 0.25 : 0;
            if (!opened && t >= 0.6) {
                opened = true;
                this.ringFx(cx, n.y, 0xffffff, 0, 450, 0.2, 1.2);
                this.sparkles(cx, n.y, [0xfff3a0, 0xffffff, 0xff8a80, 0x9fe8ff], 12, 1.0, 700);
            }
            n.alpha = t < 0.62 ? 1 : Math.max(0, 1 - (t - 0.62) / 0.12);
        });
    }

    // Ginásio: pulso dourado
    static gymFx(x: number, y: number) {
        if (!this.ready) return;
        const cx = x * T + T / 2, cy = y * T + T / 2;
        this.tileGlow(x, y, 0xffc93a, 0.5, 800);
        this.ringFx(cx, cy, 0xffd34d, 0, 800, 0.5, 1.8);
        this.ringFx(cx, cy, 0xfff0b0, 250, 800, 0.5, 1.6);
        this.sparkles(cx, cy, [0xffd34d, 0xffffff], 8, 0.8, 800);
    }

    // Treinador NPC: "!" de "fui avistado"
    static npcFx(x: number, y: number) {
        if (!this.ready) return;
        const cx = x * T + T / 2;
        const label = new P.Text({ text: '!', style: { fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif', fontSize: 44, fontWeight: '900', fill: 0xff4a3a, stroke: { color: 0xffffff, width: 7 } } });
        label.anchor.set(0.5, 1);
        const below = y === 0;
        const y0 = below ? y * T + T * 1.05 + 40 : y * T - 2;
        label.position.set(cx, y0);
        this.fxLayer.addChild(label);
        this.addFx(label, 900, (t, n) => {
            n.scale.set(t < 0.15 ? easeOut(t / 0.15) * 1.2 : t < 0.25 ? lerp(1.2, 1, (t - 0.15) / 0.1) : 1);
            n.alpha = t > 0.8 ? 1 - (t - 0.8) / 0.2 : 1;
        });
    }

    // Choque PvP: dois cortes cruzados + clarão
    static pvpFx(x: number, y: number) {
        if (!this.ready) return;
        const cx = x * T + T / 2, cy = y * T + T / 2;
        const tex = boardTextures(P);
        const flash = this.fxSprite(tex.soft, cx, cy, 0xffa040);
        this.addFx(flash, 600, (t, n) => { n.scale.set((0.6 + easeOut(t) * 2.2) * T / 64); n.alpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85; });
        [-1, 1].forEach((side, i) => {
            const slash = new P.Sprite(P.Texture.WHITE);
            slash.anchor.set(0.5);
            slash.tint = i ? 0xffffff : 0xfff0b0;
            slash.blendMode = 'add';
            slash.position.set(cx, cy);
            slash.rotation = side * Math.PI / 4;
            this.fxLayer.addChild(slash);
            const delay = i * 90;
            this.addFx(slash, 560 + delay, (t, n) => {
                const k = Math.max(0, (t * (560 + delay) - delay) / 560);
                n.width = T * 1.5 * easeOut(Math.min(1, k / 0.35));
                n.height = T * 0.11 * (k < 0.35 ? 1 : 1 - (k - 0.35) / 0.65);
                n.alpha = k <= 0 ? 0 : 1;
            });
        });
        this.ringFx(cx, cy, 0xff6a3a, 80, 550, 0.4, 1.8);
        window.setTimeout(() => { this.burst(x, y, 0xffb84a, 14); if (!this.reducedMotion()) this.shake(10, 320); }, 90);
    }

    // Teleporte: espiral roxa na origem e anel no destino
    static vortexFx(fromX: number, fromY: number, toX: number, toY: number) {
        if (!this.ready) return;
        const tex = boardTextures(P);
        const n = 14;
        for (let i = 0; i < n; i++) {
            const a0 = (Math.PI * 2 * i) / n;
            const s = this.fxSprite(tex.star, fromX, fromY, [0xb26bff, 0x5fd8ff, 0xff7ae0][i % 3]);
            this.addFx(s, 600, (t, node) => {
                const r = T * 0.9 * (1 - easeOut(t));
                const a = a0 + t * 6;
                node.position.set(fromX + Math.cos(a) * r, fromY + Math.sin(a) * r);
                node.scale.set(T * 0.26 / 48 * (1 - t * 0.6));
                node.alpha = t < 0.15 ? t / 0.15 : 1 - t;
            });
        }
        const core = this.fxSprite(tex.soft, fromX, fromY, 0x9a5cff);
        this.addFx(core, 650, (t, node) => { node.scale.set(T * 1.4 * Math.sin(t * Math.PI) / 64); node.alpha = 0.9 * (1 - t); node.rotation = t * 4; });
        this.ringFx(toX, toY, 0xc79bff, 250, 600, 1.6, 0.3);
        this.ringFx(toX, toY, 0x9fe8ff, 420, 520, 0.3, 1.5);
        window.setTimeout(() => this.sparkles(toX, toY, [0xc79bff, 0x9fe8ff, 0xffffff], 10, 0.8, 600), 480);
    }

    // Gancho único ao cair numa casa (GameEvents.handleTile)
    static onLand(x: number, y: number, type: number, pvp = false) {
        if (!this.ready) return;
        this.ambient?.clearPath(true);
        this.reach?.fade();
        if (pvp) { this.pvpFx(x, y); return; }
        if (type === TILE.CITY) this.healFx(x, y);
        else if (type === TILE.EVENT) this.eventFx(x, y);
        else if (type === TILE.GYM) this.gymFx(x, y);
        else if (NPC_DATA[type]) this.npcFx(x, y);
    }

    // ------------------------------------------------------------------
    // Câmera
    // ------------------------------------------------------------------
    // Tamanho da área visível em pixels CSS (app.screen já desconta a densidade da tela)
    private static viewSize() {
        const s = this.app?.screen;
        return { w: s ? s.width : 1, h: s ? s.height : 1 };
    }

    private static fitCamera(instant = false) {
        const { w, h } = this.viewSize();
        const boardPx = this.size * T || T;
        this.fitZoom = Math.min(w, h) / boardPx;
        const target = { x: boardPx / 2, y: boardPx / 2, zoom: this.fitZoom };
        if (instant) {
            this.zoom = target.zoom; this.camX = target.x; this.camY = target.y; this.camTarget = null;
        } else {
            this.camTarget = target;
        }
    }

    private static follow(x: number, y: number) {
        if (this.userControlled || this.size < 20) return;
        // Em tabuleiros grandes, aproxima para ~11 casas e acompanha o peão da vez
        const { w, h } = this.viewSize();
        const zoom = Math.max(this.fitZoom, Math.min(w, h) / (11 * T));
        this.camTarget = { x: x * T + T / 2, y: y * T + T / 2, zoom };
        if (this.returnTimer) window.clearTimeout(this.returnTimer);
        this.returnTimer = window.setTimeout(() => { if (!this.userControlled) this.fitCamera(); }, 2600);
    }
    private static returnTimer: number | undefined;
    private static wasZoomed = false;

    static resetCamera() {
        this.userControlled = false;
        this.fitCamera();
    }

    private static onResize() {
        if (!this.ready) return;
        const wasFit = Math.abs(this.zoom - this.fitZoom) < 0.0001;
        this.fitCamera(wasFit || !this.userControlled);
    }

    private static clampCamera() {
        const { w, h } = this.viewSize();
        const boardPx = this.size * T;
        const halfW = w / 2 / this.zoom, halfH = h / 2 / this.zoom;
        const clampAxis = (v: number, half: number) => half * 2 >= boardPx ? boardPx / 2 : Math.min(Math.max(v, half), boardPx - half);
        this.camX = clampAxis(this.camX, halfW);
        this.camY = clampAxis(this.camY, halfH);
    }

    private static applyCamera() {
        const { w, h } = this.viewSize();
        let sx = 0, sy = 0;
        const now = performance.now();
        if (now < this.shakeUntil) {
            const k = (this.shakeUntil - now) / 260;
            sx = (Math.random() - 0.5) * this.shakePower * 2 * k;
            sy = (Math.random() - 0.5) * this.shakePower * 2 * k;
        }
        this.world.scale.set(this.zoom);
        this.world.position.set(w / 2 - this.camX * this.zoom + sx, h / 2 - this.camY * this.zoom + sy);
    }

    // ------------------------------------------------------------------
    // Entrada: arrastar, pinça, roda do mouse, toque em casa
    // ------------------------------------------------------------------
    private static bindInput(canvas: HTMLCanvasElement) {
        const pointers = new Map<number, { x: number; y: number }>();
        let downAt = { x: 0, y: 0, t: 0 };
        let moved = false;
        let pinchStart = { dist: 0, zoom: 1 };
        // Sem zoom, um dedo rola a página; a pinça dá zoom. Com zoom, um dedo arrasta o tabuleiro.
        canvas.style.touchAction = 'pan-y';

        const zoomAt = (clientX: number, clientY: number, newZoom: number) => {
            const rect = canvas.getBoundingClientRect();
            const { w, h } = this.viewSize();
            const mx = clientX - rect.left, my = clientY - rect.top;
            const wx = this.camX + (mx - w / 2) / this.zoom;
            const wy = this.camY + (my - h / 2) / this.zoom;
            this.zoom = Math.min(Math.max(newZoom, this.fitZoom), this.fitZoom * 5);
            this.camX = wx - (mx - w / 2) / this.zoom;
            this.camY = wy - (my - h / 2) / this.zoom;
            this.userControlled = this.zoom > this.fitZoom * 1.01;
            this.camTarget = null;
            this.clampCamera();
        };

        canvas.addEventListener('pointerdown', (e) => {
            canvas.setPointerCapture(e.pointerId);
            pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
            moved = false;
            if (pointers.size === 2) {
                const [a, b] = [...pointers.values()];
                pinchStart = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: this.zoom };
            }
        });

        canvas.addEventListener('pointermove', (e) => {
            const prev = pointers.get(e.pointerId);
            if (!prev) { this.hover(e); return; }
            pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) moved = true;
            if (pointers.size === 2) {
                const [a, b] = [...pointers.values()];
                const dist = Math.hypot(a.x - b.x, a.y - b.y);
                if (pinchStart.dist > 0) zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, pinchStart.zoom * (dist / pinchStart.dist));
            } else if (moved && this.zoom > this.fitZoom * 1.01) {
                this.camX -= (e.clientX - prev.x) / this.zoom;
                this.camY -= (e.clientY - prev.y) / this.zoom;
                this.userControlled = true;
                this.camTarget = null;
                this.clampCamera();
            }
        });

        const up = (e: PointerEvent) => {
            const wasTap = !moved && pointers.size === 1 && performance.now() - downAt.t < 450;
            pointers.delete(e.pointerId);
            if (wasTap) this.tap(e);
        };
        canvas.addEventListener('pointerup', up);
        canvas.addEventListener('pointercancel', (e) => pointers.delete(e.pointerId));
        canvas.addEventListener('pointerleave', () => this.hideTooltip());

        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            zoomAt(e.clientX, e.clientY, this.zoom * Math.exp(-e.deltaY * 0.0015));
        }, { passive: false });

        canvas.addEventListener('dblclick', () => this.resetCamera());
    }

    private static tileAt(clientX: number, clientY: number) {
        if (!this.app) return null;
        const rect = this.app.canvas.getBoundingClientRect();
        const { w, h } = this.viewSize();
        const wx = this.camX + (clientX - rect.left - w / 2) / this.zoom;
        const wy = this.camY + (clientY - rect.top - h / 2) / this.zoom;
        const x = Math.floor(wx / T), y = Math.floor(wy / T);
        if (x < 0 || y < 0 || x >= this.size || y >= this.size) return null;
        return { x, y };
    }

    private static describeTile(x: number, y: number): string {
        const t = MapSystem.grid[y][x];
        const here = GameState.players.filter(p => p.x === x && p.y === y).map(p => p.name);
        let text = TILE_TOOLTIPS[t] || 'Caminho';
        if (NPC_DATA[t]) text = `Treinador ${NPC_DATA[t].name} · recompensa ${NPC_DATA[t].gold}G`;
        if (t === TILE.GYM) {
            const g = this.gymAt(x, y);
            text = g ? `Ginásio ${g.type.join(' / ')} · Líder ${g.leaderName} · Insígnia ${g.gid}` : 'Ginásio';
        }
        if (here.length) text += `\n${here.join(', ')}`;
        return text;
    }

    private static hover(e: PointerEvent) {
        if (e.pointerType !== 'mouse') return;
        const tile = this.tileAt(e.clientX, e.clientY);
        if (!tile) { this.hideTooltip(); return; }
        this.showTooltip(this.describeTile(tile.x, tile.y), e.clientX, e.clientY);
        if (this.app) this.app.canvas.style.cursor = MapSystem.grid[tile.y][tile.x] === TILE.GYM ? 'pointer' : '';
    }

    private static tap(e: PointerEvent) {
        const tile = this.tileAt(e.clientX, e.clientY);
        if (!tile) return;
        if (MapSystem.grid[tile.y][tile.x] === TILE.GYM) {
            const g = this.gymAt(tile.x, tile.y);
            if (g && this.onGymTap) { this.onGymTap(g.actualGymId, g.gid); return; }
        }
        if (e.pointerType !== 'mouse') {
            this.showTooltip(this.describeTile(tile.x, tile.y), e.clientX, e.clientY);
            window.setTimeout(() => this.hideTooltip(), 2200);
        }
        this.flashTile(tile.x, tile.y);
    }

    private static showTooltip(text: string, clientX: number, clientY: number) {
        if (!this.tooltip) {
            this.tooltip = document.createElement('div');
            this.tooltip.className = 'pb-board-tooltip';
            document.body.appendChild(this.tooltip);
        }
        this.tooltip.textContent = text;
        this.tooltip.style.display = 'block';
        const tw = this.tooltip.offsetWidth, th = this.tooltip.offsetHeight;
        const left = Math.min(Math.max(8, clientX + 14), window.innerWidth - tw - 8);
        const top = clientY + 18 + th > window.innerHeight ? clientY - th - 12 : clientY + 18;
        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
    }

    private static hideTooltip() {
        if (this.tooltip) this.tooltip.style.display = 'none';
    }

    // ------------------------------------------------------------------
    // Loop
    // ------------------------------------------------------------------
    private static tick() {
        const now = performance.now();

        if (this.camTarget) {
            const k = 0.12;
            this.camX = lerp(this.camX, this.camTarget.x, k);
            this.camY = lerp(this.camY, this.camTarget.y, k);
            this.zoom = lerp(this.zoom, this.camTarget.zoom, k);
            if (Math.abs(this.zoom - this.camTarget.zoom) < 0.0005 && Math.hypot(this.camX - this.camTarget.x, this.camY - this.camTarget.y) < 0.5) {
                this.zoom = this.camTarget.zoom; this.camX = this.camTarget.x; this.camY = this.camTarget.y; this.camTarget = null;
            }
            this.clampCamera();
        }
        this.applyCamera();
        this.updateAtmosphere(now);
        const zoomed = this.zoom > this.fitZoom * 1.02;
        if (zoomed !== this.wasZoomed) {
            this.wasZoomed = zoomed;
            this.app?.canvas.parentElement?.parentElement?.classList.toggle('is-zoomed', zoomed);
            if (this.app) this.app.canvas.style.touchAction = zoomed ? 'none' : 'pan-y';
        }

        // Brilho da água e pokébolas de evento "respirando"
        const t = now / 1000;
        this.water.forEach(w => { w.g.alpha = 0.06 + Math.sin(t * 1.6 + w.phase) * 0.06; });
        this.events.forEach(ev => {
            const s = 1 + Math.sin(t * 2.4 + ev.phase) * 0.03;
            ev.s.scale.set((T - 2) / ev.s.texture.width * s, (T - 2) / ev.s.texture.height * s);
        });

        // Peões: caminhada, saltos e pulso do jogador da vez
        this.updateTokens(now, t);
        if (this.reach) { this.reach.reduced = this.reducedMotion(); this.reach.tilePx = T * this.zoom; this.reach.update(now); }

        // Efeitos temporários
        for (let i = this.fx.length - 1; i >= 0; i--) {
            const f = this.fx[i];
            const p = Math.min(1, (now - f.start) / f.dur);
            f.update(p, f.node);
            if (p >= 1) { f.node.destroy({ children: true }); this.fx.splice(i, 1); }
        }
    }
}

(window as any).PBBoard = BoardRenderer;
