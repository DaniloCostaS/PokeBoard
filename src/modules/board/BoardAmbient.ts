import type { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { GameState } from '../game/GameState';
import { MapSystem } from '../../systems/MapSystem';
import { TILE } from '../../constants';
import { POKEDEX } from '../../constants/pokedex';
import { boardTextures, type BoardTex } from './BoardTextures';

// Vida no tabuleiro: Pokémon selvagens espiando do mato/água e a prévia do caminho ao rolar o dado.
// Nada aqui é interativo nem altera o estado do jogo.

const SPRITE_URL = (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const GEN_MAX = [0, 151, 251, 386, 493, 649, 721, 809, 905, 1025];
const genOf = (id: number) => { for (let g = 1; g < GEN_MAX.length; g++) if (id <= GEN_MAX[g]) return g; return 9; };
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

type Habitat = 'grass' | 'water';
type Peek = { node: Container; mon: Sprite; mask: Graphics; x: number; y: number; start: number; dur: number; hideAt: number; baseY: number; flip: number };
type Marker = { node: Container; x: number; y: number; born: number; delay: number; gone: number; last: boolean };

export class BoardAmbient {
    private P: typeof import('pixi.js');
    private T: number;
    private tex: BoardTex;
    private wildLayer: Container;
    private pathLayer: Container;
    private pool: Record<Habitat, Texture[]> = { grass: [], water: [] };
    private poolRequested = false;
    private peeks: Peek[] = [];
    private nextPeek = 0;
    private grass: number[] = [];
    private water: number[] = [];
    private markers: Marker[] = [];
    private pathExpire = 0;
    reduced = false;

    constructor(P: typeof import('pixi.js'), layers: { wild: Container; path: Container }, T: number) {
        this.P = P;
        this.T = T;
        this.tex = boardTextures(P);
        this.wildLayer = layers.wild;
        this.pathLayer = layers.path;
    }

    rebuild() {
        this.peeks.forEach(pk => pk.node.destroy({ children: true }));
        this.peeks = [];
        this.clearPath();
        const size = MapSystem.size;
        this.grass = []; this.water = [];
        for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
            const v = MapSystem.grid[y]?.[x];
            if (v === TILE.GRASS) this.grass.push(y * size + x);
            else if (v === TILE.WATER) this.water.push(y * size + x);
        }
        this.nextPeek = performance.now() + 2500;
        this.requestPool();
    }

    // Sorteia ~20 espécies (das gerações da partida) e baixa os sprites aos poucos
    private requestPool() {
        if (this.poolRequested) return;
        this.poolRequested = true;
        const gens: number[] = (GameState as any).settings?.generations || [1, 2, 3, 4, 5, 6, 7, 8, 9];
        const ok = (id: number) => id > 0 && id <= 1025 && gens.includes(genOf(id));
        const seen = new Set<number>();
        const base = POKEDEX.filter(m => ok(m.id) && !m.isLegendary && m.stage === 1 && !seen.has(m.id) && (seen.add(m.id), true));
        const sample = (list: typeof base, n: number) => {
            const out: typeof base = [];
            const copy = list.slice();
            while (out.length < n && copy.length) out.push(copy.splice((Math.random() * copy.length) | 0, 1)[0]);
            return out;
        };
        const grassMons = sample(base.filter(m => ['Grama', 'Inseto', 'Normal'].includes(m.type)), 12);
        const waterMons = sample(base.filter(m => m.type === 'Água'), 8);
        const load = async (list: typeof base, hab: Habitat) => {
            for (const m of list) {
                try {
                    const tex = await this.P.Assets.load<Texture>(SPRITE_URL(m.id));
                    tex.source.scaleMode = 'nearest';
                    this.pool[hab].push(tex);
                } catch { /* sprite indisponível: ignora */ }
            }
        };
        // Pequeno atraso para não competir com o carregamento do tabuleiro
        window.setTimeout(() => { load(grassMons, 'grass'); load(waterMons, 'water'); }, 1200);
    }

    private occupied(idx: number) {
        const size = MapSystem.size;
        const x = idx % size, y = Math.floor(idx / size);
        return GameState.players.some(p => p.x === x && p.y === y) || this.peeks.some(pk => pk.x === x && pk.y === y);
    }

    private spawnPeek(now: number) {
        const options: Habitat[] = [];
        if (this.grass.length && this.pool.grass.length) options.push('grass', 'grass');
        if (this.water.length && this.pool.water.length) options.push('water');
        if (!options.length) return;
        const hab = options[(Math.random() * options.length) | 0];
        const tiles = hab === 'grass' ? this.grass : this.water;
        let idx = -1;
        for (let tries = 0; tries < 8; tries++) {
            const c = tiles[(Math.random() * tiles.length) | 0];
            if (!this.occupied(c)) { idx = c; break; }
        }
        if (idx < 0) return;
        const P = this.P, T = this.T, size = MapSystem.size;
        const x = idx % size, y = Math.floor(idx / size);
        const texs = this.pool[hab];
        const tex = texs[(Math.random() * texs.length) | 0];
        const node = new P.Container();
        node.eventMode = 'none';
        const mask = new P.Graphics().rect(x * T + 1, y * T - T * 0.4, T - 2, T * 1.4 - 1).fill(0xffffff);
        const mon = new P.Sprite(tex);
        mon.anchor.set(0.5, 0.86);
        const flip = Math.random() < 0.5 ? -1 : 1;
        const sc = (T * 1.3) / 96;
        mon.scale.set(sc * flip, sc);
        const baseY = y * T + T * (hab === 'water' ? 0.86 : 0.9);
        mon.position.set(x * T + T / 2, baseY + T * 0.6);
        mon.mask = mask;
        // Sombra / ondinha na base
        const base = new P.Sprite(hab === 'water' ? this.tex.ring : this.tex.soft);
        base.anchor.set(0.5);
        base.tint = hab === 'water' ? 0xe6f4ff : 0x0d1a0d;
        base.alpha = 0;
        base.scale.set(T * 0.62 / 64, T * 0.2 / 64);
        base.position.set(x * T + T / 2, baseY);
        node.addChild(base, mon, mask);
        node.alpha = 0;
        this.wildLayer.addChild(node);
        const dur = rnd(2600, 4200);
        this.peeks.push({ node, mon, mask, x, y, start: now, dur, hideAt: now + dur, baseY, flip });
    }

    // Prévia do caminho: setas pelas casas que o peão vai percorrer, destaque na última
    previewPath(coords: { x: number; y: number }[]) {
        this.clearPath();
        if (!coords.length) return;
        const P = this.P, T = this.T, now = performance.now();
        coords.forEach((c, i) => {
            const last = i === coords.length - 1;
            const node = new P.Container();
            node.eventMode = 'none';
            node.position.set(c.x * T + T / 2, c.y * T + T / 2);
            const glow = new P.Sprite(this.tex.soft);
            glow.anchor.set(0.5);
            glow.blendMode = 'add';
            glow.tint = last ? 0xffd34d : 0xfff2b0;
            glow.scale.set((last ? T * 1.25 : T * 0.8) / 64);
            glow.alpha = last ? 0.7 : 0.3;
            node.addChild(glow);
            if (last) {
                const ring = new P.Sprite(this.tex.ring);
                ring.anchor.set(0.5);
                ring.tint = 0xffd34d;
                ring.scale.set(T * 0.86 / 64);
                ring.label = 'ring';
                const star = new P.Sprite(this.tex.star);
                star.anchor.set(0.5);
                star.tint = 0xffffff;
                star.scale.set(T * 0.4 / 48);
                star.label = 'star';
                node.addChild(ring, star);
            } else {
                const next = coords[i + 1];
                const dx = next.x - c.x, dy = next.y - c.y;
                const adjacent = Math.abs(dx) + Math.abs(dy) === 1;
                const arrow = new P.Sprite(adjacent ? this.tex.chevron : this.tex.flake);
                arrow.anchor.set(0.5);
                arrow.tint = 0xfff7d6;
                if (adjacent) { arrow.rotation = Math.atan2(dy, dx); arrow.scale.set(T * 0.42 / 48); }
                else arrow.scale.set(T * 0.3 / 16);
                node.addChild(arrow);
            }
            node.alpha = 0;
            node.scale.set(0.4);
            this.pathLayer.addChild(node);
            this.markers.push({ node, x: c.x, y: c.y, born: now, delay: i * 55, gone: 0, last });
        });
        // Segurança: some sozinho mesmo se o peão parar antes (armadilha, desconexão)
        this.pathExpire = now + coords.length * 190 + 2500;
    }

    // O peão da vez chegou em (x,y): apaga as marcas até ali
    passed(x: number, y: number) {
        const k = this.markers.findIndex(m => !m.gone && m.x === x && m.y === y);
        if (k < 0) return;
        const now = performance.now();
        for (let i = 0; i <= k; i++) if (!this.markers[i].gone) this.markers[i].gone = now + (this.markers[i].last ? 450 : 0);
    }

    clearPath(fade = false) {
        if (fade) { const now = performance.now(); this.markers.forEach(m => { if (!m.gone) m.gone = now; }); return; }
        this.markers.forEach(m => m.node.destroy({ children: true }));
        this.markers = [];
    }

    update(now: number) {
        // Pokémon selvagens
        if (!this.reduced && now >= this.nextPeek) {
            this.nextPeek = now + rnd(2200, 5200);
            if (this.peeks.length < 3) this.spawnPeek(now);
        }
        for (let i = this.peeks.length - 1; i >= 0; i--) {
            const pk = this.peeks[i];
            // Se um peão chegar na casa, esconde rápido
            if (now < pk.hideAt - 300 && GameState.players.some(p => p.x === pk.x && p.y === pk.y)) pk.hideAt = now + 300;
            const e = now - pk.start, toEnd = pk.hideAt - now;
            const rise = Math.min(1, e / 420), sink = Math.min(1, Math.max(0, toEnd) / 380);
            const vis = Math.min(rise, sink);
            const T = this.T;
            pk.node.alpha = Math.min(1, vis * 1.4);
            const bob = this.reduced ? 0 : Math.sin(e / 260) * T * 0.03;
            pk.mon.y = pk.baseY + (1 - easeOut(vis)) * T * 0.6 + bob;
            // olha para os lados de vez em quando
            const sc = (T * 1.3) / 96;
            pk.mon.scale.x = sc * (Math.sin(e / 900) > 0.6 ? -pk.flip : pk.flip);
            const base = pk.node.children[0];
            base.alpha = vis * 0.45;
            if (toEnd <= 0) { pk.node.destroy({ children: true }); this.peeks.splice(i, 1); }
        }

        // Prévia do caminho
        if (this.markers.length) {
            if (now > this.pathExpire) this.clearPath(true);
            let alive = 0;
            const t = now / 1000;
            for (const m of this.markers) {
                const e = now - m.born - m.delay;
                if (m.gone && now >= m.gone) {
                    const f = Math.min(1, (now - m.gone) / 220);
                    m.node.alpha = Math.min(m.node.alpha, 1 - f);
                    m.node.scale.set(1 + f * 0.3);
                    if (f < 1) alive++;
                    continue;
                }
                alive++;
                if (e < 0) continue;
                const pop = Math.min(1, e / 180);
                m.node.alpha = pop;
                m.node.scale.set(0.4 + 0.6 * easeOut(pop) + (m.last ? Math.sin(t * 6) * 0.06 : 0));
                if (m.last) {
                    const ring = m.node.getChildByLabel('ring');
                    const star = m.node.getChildByLabel('star');
                    if (ring) { ring.scale.set(this.T * (0.8 + (t * 1.2 % 1) * 0.35) / 64); ring.alpha = 1 - (t * 1.2 % 1); }
                    if (star) star.rotation = t * 1.5;
                }
            }
            if (!alive) this.clearPath();
        }
    }
}
