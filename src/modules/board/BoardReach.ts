import type { Container, Graphics, Sprite, Text } from 'pixi.js';
import { GameState } from '../game/GameState';
import { MapSystem } from '../../systems/MapSystem';
import { boardTextures } from './BoardTextures';

// Prévia das casas alcançáveis enquanto o dado gira: cada casa possível ganha um selo com o(s) valor(es)
// do dado que levam até ela. Puramente visual, calculado sem mexer no estado do jogo.

export type ReachOption = { x: number; y: number; dice: number[]; steps: number };
export type ReachPlan = { pid: number; rift: boolean; backwards: boolean; options: ReachOption[] };

/**
 * Simula o movimento para cada valor possível do dado, na mesma ordem do GameMovement:
 *   dado: Dado Mágico (forcedDiceValue) > Lentidão (effects.slow → 1) > 1..6
 *   evento: FENDA ESPACIAL teleporta (sem caminho) · VENTO A FAVOR ×2 · AREIA MOVEDIÇA ÷2 (mín. 1)
 *   depois soma o bônus de movimento (Tênis), anda para trás com Moon Walker e dá a volta no fim.
 */
export function computeReach(pid: number): ReachPlan | null {
    const p = GameState.players[pid];
    if (!p || !MapSystem.size) return null;
    const total = MapSystem.size * MapSystem.size;
    const backwards = (p.effects?.moonwalker || 0) > 0;
    const ev = GameState.currentGlobalEvent?.id;
    const plan: ReachPlan = { pid, rift: ev === 'SPATIAL_RIFT', backwards, options: [] };
    if (plan.rift) return plan;

    let dice: number[];
    if (GameState.forcedDiceValue > 0) dice = [GameState.forcedDiceValue];
    else if ((p.effects?.slow || 0) > 0) dice = [1];
    else dice = [1, 2, 3, 4, 5, 6];

    const bonus = GameState.bonusMovement > 0 ? GameState.bonusMovement : 0;
    const start = MapSystem.getIndex(p.x, p.y);
    const byTile = new Map<number, ReachOption>();
    for (const d of dice) {
        let steps = d;
        if (ev === 'DOUBLE_STEP') steps = d * 2;
        else if (ev === 'QUICKSAND') steps = Math.max(1, Math.floor(d / 2));
        steps += bonus;
        let i = start, walked = 0;
        for (let k = 0; k < steps; k++) {
            i = backwards ? (i - 1 + total) % total : (i + 1) % total;
            walked++;
        }
        let opt = byTile.get(i);
        if (!opt) {
            const c = MapSystem.getCoord(i);
            opt = { x: c.x, y: c.y, dice: [], steps: walked };
            byTile.set(i, opt);
            plan.options.push(opt);
        }
        opt.dice.push(d);
    }
    return plan;
}

// "1·2", "3–6" (sequência longa vira intervalo)
const diceLabel = (d: number[]) => d.length >= 3 && d[d.length - 1] - d[0] === d.length - 1 ? `${d[0]}–${d[d.length - 1]}` : d.join('·');

type Mark = { node: Container; plate: Graphics; glow: Sprite; tag: Container; badge: Graphics; label: Text; tagMax: number; opt: ReachOption | null; order: number };

const COLOR = 0x7fe0ff, PICK = 0xffd34d;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export class BoardReach {
    private P: typeof import('pixi.js');
    private T: number;
    private layer: Container;
    private marks: Mark[] = [];
    private rift: { node: Container; veil: Graphics; badge: Container; label: Text } | null = null;
    plan: ReachPlan | null = null;
    private born = 0;
    private picked = -1;          // valor do dado que saiu (-1 = ainda girando)
    private pickedAt = 0;
    private fadeAt = 0;           // começou a sumir
    private expire = 0;
    hover = false;                // prévia aberta só pelo hover no botão de rolar
    reduced = false;

    constructor(P: typeof import('pixi.js'), layer: Container, T: number) {
        this.P = P; this.T = T; this.layer = layer;
    }

    private mark(i: number): Mark {
        if (this.marks[i]) return this.marks[i];
        const P = this.P, T = this.T;
        const node = new P.Container();
        node.eventMode = 'none';
        const glow = new P.Sprite(boardTextures(P).soft);
        glow.anchor.set(0.5);
        glow.blendMode = 'add';
        glow.scale.set(T * 1.15 / 64);
        const plate = new P.Graphics()
            .roundRect(-T / 2 + 3, -T / 2 + 3, T - 6, T - 6, 10).fill({ color: 0xffffff, alpha: 0.14 })
            .roundRect(-T / 2 + 3, -T / 2 + 3, T - 6, T - 6, 10).stroke({ width: 4, color: 0xffffff });
        const badge = new P.Graphics();
        const label = new P.Text({
            text: '',
            style: { fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif', fontSize: 34, fontWeight: '900', fill: 0x10202a }
        });
        label.anchor.set(0.5);
        // Selo no canto da casa (o conteúdo dela continua visível: cidade, treinador, ginásio...)
        const tag = new P.Container();
        tag.position.set(T * 0.27, -T * 0.27);
        tag.addChild(badge, label);
        node.addChild(glow, plate, tag);
        node.visible = false;
        this.layer.addChild(node);
        const m: Mark = { node, plate, glow, tag, badge, label, tagMax: 1, opt: null, order: i };
        this.marks[i] = m;
        return m;
    }

    private riftNodes() {
        if (this.rift) return this.rift;
        const P = this.P;
        const node = new P.Container();
        node.eventMode = 'none';
        const veil = new P.Graphics();
        const badge = new P.Container();
        const bg = new P.Graphics();
        const label = new P.Text({
            text: '🌌 Fenda: qualquer casa!',
            style: { fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif', fontSize: 30, fontWeight: '900', fill: 0xffffff, stroke: { color: 0x2a0f4a, width: 6 } }
        });
        label.anchor.set(0.5);
        bg.roundRect(-label.width / 2 - 16, -label.height / 2 - 8, label.width + 32, label.height + 16, 18).fill({ color: 0x6a2cc4, alpha: 0.92 }).stroke({ width: 3, color: 0xe2c8ff });
        badge.addChild(bg, label);
        node.addChild(veil, badge);
        node.visible = false;
        this.layer.addChild(node);
        this.rift = { node, veil, badge, label };
        return this.rift;
    }

    /** Prévia do dado atual ainda girando (não reabrir para o mesmo jogador). */
    rolling(pid: number) { return !!this.plan && this.plan.pid === pid && !this.hover && this.picked < 0 && !this.fadeAt; }

    show(plan: ReachPlan, hover = false) {
        this.hideNow();
        this.plan = plan;
        this.hover = hover;
        const now = performance.now();
        this.born = now; this.picked = -1; this.fadeAt = 0;
        this.expire = hover ? Infinity : now + 9000;
        const T = this.T;
        if (plan.rift) {
            const r = this.riftNodes();
            const size = MapSystem.size * T;
            r.veil.clear().rect(0, 0, size, size).fill({ color: 0x8a4dff, alpha: 1 });
            const p = GameState.players[plan.pid];
            const bx = Math.min(Math.max(p.x * T + T / 2, r.badge.width / 2 + 4), size - r.badge.width / 2 - 4);
            const by = p.y === 0 ? p.y * T + T * 1.25 : p.y * T - T * 0.35;
            r.badge.position.set(bx, by);
            r.node.visible = true;
            r.node.alpha = 0;
            return;
        }
        plan.options.forEach((opt, i) => {
            const m = this.mark(i);
            m.opt = opt;
            m.order = i;
            m.node.visible = true;
            m.node.alpha = 0;
            m.node.position.set(opt.x * T + T / 2, opt.y * T + T / 2);
            const tint = COLOR;
            m.plate.tint = tint;
            m.glow.tint = tint;
            const text = diceLabel(opt.dice);
            m.label.text = text;
            m.label.style.fontSize = text.length > 1 ? 26 : 30;
            m.label.scale.set(1);
            m.label.style.fill = 0x10202a;
            // Selo redondo no canto; rótulos longos ("1–3", "2·4") viram uma faixa no topo, dentro da casa
            const h = T * 0.48, maxW = T - 8;
            if (m.label.width + 14 > maxW) m.label.scale.set((maxW - 14) / m.label.width);
            const w = Math.min(maxW, Math.max(h, m.label.width + 14));
            const bx = w > T * 0.56 ? 0 : T * 0.27;
            m.tag.x = bx;
            // Em casas pequenas na tela o selo cresce um pouco (a faixa nunca passa da largura da casa)
            m.tagMax = bx === 0 ? (T - 2) / w : 1.45;
            m.badge.clear()
                .roundRect(-w / 2, -h / 2, w, h, h / 2).fill(0xffffff)
                .roundRect(-w / 2, -h / 2, w, h, h / 2).stroke({ width: 3.5, color: 0x10202a });
        });
    }

    /** O dado parou em `die`: destaca a casa dele e apaga as outras. */
    pick(die: number) {
        if (!this.plan || this.picked >= 0) return;
        this.picked = die;
        this.pickedAt = performance.now();
        this.expire = this.pickedAt + 4000;
        if (this.plan.rift) this.fade();
    }

    fade() {
        if (!this.plan || this.fadeAt) return;
        this.fadeAt = performance.now();
    }

    hideNow() {
        this.plan = null;
        this.hover = false;
        this.marks.forEach(m => { m.node.visible = false; m.opt = null; });
        if (this.rift) this.rift.node.visible = false;
    }

    /** Tamanho de uma casa na tela (px CSS), para manter os números legíveis em tabuleiros grandes no celular. */
    tilePx = 64;

    update(now: number) {
        const plan = this.plan;
        if (!plan) return;
        if (now > this.expire) this.fade();
        const fadeK = this.fadeAt ? Math.min(1, (now - this.fadeAt) / 260) : 0;
        if (fadeK >= 1) { this.hideNow(); return; }
        const t = now / 1000;
        const e = now - this.born;

        if (plan.rift && this.rift) {
            const r = this.rift;
            const pop = Math.min(1, e / 260);
            r.node.alpha = pop * (1 - fadeK);
            r.veil.alpha = this.reduced ? 0.14 : 0.1 + 0.08 * Math.sin(t * 5);
            r.badge.scale.set(this.reduced ? 1 : 0.6 + 0.4 * easeOut(pop) + Math.sin(t * 4) * 0.03);
            return;
        }

        const n = plan.options.length;
        // Enquanto o dado gira, um "brilho" percorre as opções em ordem, no ritmo do dado
        const scan = this.picked < 0 && !this.hover && !this.reduced && n > 1 ? Math.floor(e / 120) % n : -1;
        for (let i = 0; i < n; i++) {
            const m = this.marks[i];
            if (!m || !m.opt) continue;
            const isPick = this.picked >= 0 && m.opt.dice.includes(this.picked);
            const pop = Math.min(1, Math.max(0, (e - i * 45) / 200));
            let alpha = pop;
            let sc = this.reduced ? 1 : 0.5 + 0.5 * easeOut(pop);
            if (this.picked >= 0) {
                const k = Math.min(1, (now - this.pickedAt) / 260);
                if (isPick) {
                    sc *= this.reduced ? 1 : 1 + Math.sin(k * Math.PI) * 0.25;
                    if (k > 0) { m.plate.tint = PICK; m.glow.tint = PICK; }
                } else alpha *= 1 - k;
            } else if (i === scan) sc *= 1.12;
            m.node.alpha = alpha * (1 - fadeK);
            m.node.scale.set(sc);
            m.tag.scale.set(Math.min(m.tagMax, Math.max(1, 30 / this.tilePx)));
            m.glow.alpha = this.reduced ? 0.35 : (i === scan || isPick ? 0.7 : 0.28 + 0.1 * Math.sin(t * 4 + i));
        }
    }
}
