import { GameState } from '../game/GameState';
import { Network } from '../../systems/Network';
import { Presence } from './Presence';
import { Settings } from './Settings';

// "Game feel": reações visuais e táteis ao que acontece na partida.
// Tudo aqui é cosmético; nada altera regras nem grava estado.

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const board = () => (window as any).PBBoard;

export class GameFeel {
    private static lastGold = new Map<number, number>();
    private static lastTurn: number | null = null;
    private static lastHp = new WeakMap<object, number>();
    private static bannerTimer: number | undefined;
    private static lastRank = new Map<number, number>();
    private static goldTweens = new Map<number, { from: number; to: number; start: number }>();
    private static lastXp = new Map<string, { lv: number; xp: number; pct: number }>();
    private static goldRaf = 0;

    private static tweenValue(tw: { from: number; to: number; start: number }, now: number) {
        const t = Math.min(1, (now - tw.start) / 700);
        return tw.from + (tw.to - tw.from) * (1 - Math.pow(1 - t, 3));
    }

    // Contagem do ouro "rolando" até o valor novo
    private static runGoldTweens() {
        if (this.goldRaf) return;
        const step = () => {
            const now = performance.now();
            this.goldTweens.forEach((tw, id) => {
                const el = document.querySelector<HTMLElement>(`[data-pb-gold="${id}"]`);
                if (el) el.textContent = `${Math.round(this.tweenValue(tw, now))} G`;
                if (now - tw.start >= 700) this.goldTweens.delete(id);
            });
            this.goldRaf = this.goldTweens.size ? requestAnimationFrame(step) : 0;
        };
        this.goldRaf = requestAnimationFrame(step);
    }

    static vibrate(pattern: number | number[]) {
        try {
            if (navigator.vibrate && !reducedMotion()) navigator.vibrate(pattern);
        } catch { /* navegador sem suporte */ }
    }

    private static isMe(playerId: number) {
        const NetworkObj = (window as any).Network || Network;
        return !NetworkObj.isOnline || NetworkObj.myPlayerId === playerId;
    }

    // Chamado ao final de cada updateHUD
    static onHudUpdate() {
        Presence.applyStatuses();
        GameState.players.forEach((p, idx) => {
            const prev = this.lastGold.get(p.id);
            if (prev !== undefined && prev !== p.gold) {
                const diff = p.gold - prev;
                board()?.floatText(idx, `${diff > 0 ? '+' : ''}${diff}G`, diff > 0 ? '#ffd36b' : '#ff8a80');
                const pill = document.querySelector<HTMLElement>(`[data-pb-gold="${p.id}"]`);
                pill?.classList.add(diff > 0 ? 'pb-pop-up' : 'pb-pop-down');
                const running = this.goldTweens.get(p.id);
                const from = running ? this.tweenValue(running, performance.now()) : prev;
                this.goldTweens.set(p.id, { from, to: p.gold, start: performance.now() });
                this.runGoldTweens();
            }
            this.lastGold.set(p.id, p.gold);

            // Sobe/desce no placar
            const rankEl = document.querySelector<HTMLElement>(`[data-pb-rank="${p.id}"]`);
            const rank = rankEl ? parseInt(rankEl.textContent || '0', 10) : 0;
            const prevRank = this.lastRank.get(p.id);
            if (rankEl && prevRank && rank && rank !== prevRank) {
                rankEl.classList.add(rank < prevRank ? 'pb-rank-up' : 'pb-rank-down');
            }
            if (rank) this.lastRank.set(p.id, rank);
        });
        this.animateHudXp();

        // O HUD é recriado a cada update: reaplica o valor intermediário das contagens em andamento
        this.goldTweens.forEach((tw, id) => {
            const el = document.querySelector<HTMLElement>(`[data-pb-gold="${id}"]`);
            if (el) el.textContent = `${Math.round(this.tweenValue(tw, performance.now()))} G`;
        });

        if (this.lastTurn !== GameState.turn) {
            const first = this.lastTurn === null;
            this.lastTurn = GameState.turn;
            const current = GameState.players[GameState.turn];
            if (current && !first) this.showTurnBanner(current.name, this.isMe(current.id) && ((window as any).Network || Network).isOnline);
        }
    }

    static showTurnBanner(name: string, isMine: boolean) {
        let el = document.getElementById('pb-turn-banner');
        if (!el) {
            el = document.createElement('div');
            el.id = 'pb-turn-banner';
            el.setAttribute('role', 'status');
            el.setAttribute('aria-live', 'polite');
            document.body.appendChild(el);
        }
        el.innerHTML = isMine
            ? `<small>Rodada ${GameState.round}</small><strong>Sua vez!</strong>`
            : `<small>Rodada ${GameState.round}</small><strong>Vez de ${name.replace(/[<>&]/g, '')}</strong>`;
        el.classList.toggle('is-mine', isMine);
        el.classList.remove('is-visible');
        void el.offsetWidth;
        el.classList.add('is-visible');
        if (isMine) this.vibrate([40, 60, 40]);
        window.clearTimeout(this.bannerTimer);
        this.bannerTimer = window.setTimeout(() => el!.classList.remove('is-visible'), 1600);
    }

    // ------------------------------------------------------------------
    // Batalha
    // ------------------------------------------------------------------
    static battleEnter() {
        const modal = document.getElementById('battle-modal');
        document.querySelector('#battle-modal .battle-scene')?.classList.remove('pb-defeat', 'pb-victory', 'pb-shake');
        if (!modal || reducedMotion()) return;
        modal.classList.remove('pb-battle-enter');
        void modal.offsetWidth;
        modal.classList.add('pb-battle-enter');
    }

    static battleExit() {
        document.getElementById('battle-modal')?.classList.remove('pb-battle-enter');
    }

    // ------------------------------------------------------------------
    // Sprites animados (Pokémon Showdown via PokeAPI), com fallback para o sprite estático
    // ------------------------------------------------------------------
    private static failedSprites = new Set<string>();

    static battleSprite(mon: any, view: 'front' | 'back'): string {
        const base = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/';
        // Desligado: exatamente os sprites clássicos de antes (frente para os dois lados)
        if (!Settings.animatedSprites) return mon.getSprite();
        const url = `${base}${view === 'back' ? 'back/' : ''}${mon.isShiny ? 'shiny/' : ''}${mon.id}.gif`;
        return this.failedSprites.has(url) ? mon.getSprite() : url;
    }

    static setBattleSprite(img: HTMLImageElement | null, mon: any, view: 'front' | 'back') {
        if (!img || !mon) return;
        const url = this.battleSprite(mon, view);
        if (img.dataset.pbSrc === url) return;
        img.dataset.pbSrc = url;
        const animated = url.endsWith('.gif');
        img.classList.toggle('pb-anim-sprite', animated);
        img.style.width = '';
        img.style.height = '';
        // O GIF vem recortado no tamanho do Pokémon: escala pelo tamanho real para ficar do porte do sprite clássico
        img.onload = animated ? () => {
            if (img.dataset.pbSrc !== url || !img.naturalWidth) return;
            const k = window.innerWidth <= 480 ? 1.05 : 1.25;
            const maxH = window.innerWidth <= 480 ? 84 : 104;
            const scale = Math.min(k, maxH / img.naturalHeight);
            img.style.width = `${Math.round(img.naturalWidth * scale)}px`;
            img.style.height = `${Math.round(img.naturalHeight * scale)}px`;
        } : null;
        img.onerror = () => {
            if (!url.endsWith('.gif')) return;
            this.failedSprites.add(url);
            img.dataset.pbSrc = '';
            this.setBattleSprite(img, mon, view);
        };
        img.src = url;
    }

    // ------------------------------------------------------------------
    // Golpes: investida do atacante + impacto com a cara do tipo
    // ------------------------------------------------------------------
    // Chamado ao final de BattleUI.updateUI: compara o HP com a última leitura de cada Pokémon
    static onBattleUpdate(ply: any, opp: any, plyOwnerId: number) {
        const plyDiff = this.hpDiff(ply);
        const oppDiff = this.hpDiff(opp);
        // Se só um lado perdeu HP, foi um golpe do outro lado (clima/veneno atingem os dois)
        if (oppDiff !== null && oppDiff < 0 && !(plyDiff !== null && plyDiff < 0)) this.attackFx('ply', ply, 'opp-img');
        if (plyDiff !== null && plyDiff < 0 && !(oppDiff !== null && oppDiff < 0)) this.attackFx('opp', opp, 'ply-img');
        this.applyHp(ply, 'ply-img', plyDiff, this.isMe(plyOwnerId));
        this.applyHp(opp, 'opp-img', oppDiff, false);
    }

    // null = Pokémon acabou de entrar em campo
    private static hpDiff(mon: any): number | null {
        if (!mon) return 0;
        const prev = this.lastHp.get(mon);
        this.lastHp.set(mon, mon.currentHp);
        return prev === undefined ? null : mon.currentHp - prev;
    }

    private static applyHp(mon: any, imgId: string, diff: number | null, isMine: boolean) {
        if (!mon) return;
        const img = document.getElementById(imgId);
        if (diff === null) {
            // Pokémon novo em campo: limpa o estado do anterior e faz a entrada
            img?.classList.remove('pb-faint', 'pb-hit');
            if (mon.isMegaEvolution) this.megaFx(img);
            else this.sendOut(img);
            return;
        }
        if (diff === 0) return;
        this.battleNumber(img, diff);

        if (diff < 0) {
            const heavy = -diff >= mon.maxHp * 0.3;
            this.restartClass(img, 'pb-hit');
            if (heavy) {
                this.restartClass(document.querySelector('#battle-modal .battle-scene'), 'pb-shake');
                if (isMine) this.vibrate([60, 40, 90]);
            } else if (isMine) {
                this.vibrate(35);
            }
            if (mon.currentHp <= 0) img?.classList.add('pb-faint');
        } else {
            img?.classList.remove('pb-faint');
            this.spawnImpact(img, 'heal');
        }
    }

    private static attackFx(side: 'ply' | 'opp', attacker: any, targetImgId: string) {
        if (reducedMotion()) return;
        const attackerImg = document.getElementById(side === 'ply' ? 'ply-img' : 'opp-img');
        this.restartClass(attackerImg, side === 'ply' ? 'pb-lunge-ply' : 'pb-lunge-opp');
        const type = attacker?.type || 'Normal';
        this.spawnImpact(document.getElementById(targetImgId), type);
    }

    private static TYPE_FX: Record<string, { color: string; shape: string }> = {
        'Normal': { color: '#e8e4cf', shape: 'impact' }, 'Fogo': { color: '#ff8a3d', shape: 'fire' },
        'Água': { color: '#5fa8ff', shape: 'water' }, 'Elétrico': { color: '#ffe14d', shape: 'bolt' },
        'Grama': { color: '#7ed957', shape: 'leaf' }, 'Gelo': { color: '#a6f0ff', shape: 'ice' },
        'Lutador': { color: '#ff6b4a', shape: 'impact' }, 'Veneno': { color: '#c069e0', shape: 'bubble' },
        'Terra': { color: '#e2bf65', shape: 'rock' }, 'Voador': { color: '#c9b8ff', shape: 'wind' },
        'Psíquico': { color: '#ff6fae', shape: 'ring' }, 'Inseto': { color: '#c3d63a', shape: 'leaf' },
        'Pedra': { color: '#c9b46a', shape: 'rock' }, 'Fantasma': { color: '#9c7bd6', shape: 'ghost' },
        'Dragão': { color: '#8f6bff', shape: 'slash' }, 'Noturno': { color: '#8a7466', shape: 'slash' },
        'Aço': { color: '#d4d7e6', shape: 'impact' }, 'Fada': { color: '#ffb3dc', shape: 'sparkle' },
        'heal': { color: '#7ee2a4', shape: 'sparkle' },
        'level': { color: '#ffd76a', shape: 'sparkle' }
    };

    private static spawnImpact(target: HTMLElement | null, type: string) {
        const scene = document.querySelector('#battle-modal .battle-scene') as HTMLElement | null;
        if (!target || !scene || reducedMotion()) return;
        const fx = this.TYPE_FX[type] || this.TYPE_FX['Normal'];
        const a = target.getBoundingClientRect();
        const s = scene.getBoundingClientRect();
        const box = document.createElement('div');
        box.className = `pb-impact pb-impact--${fx.shape}`;
        box.style.left = `${a.left - s.left + a.width / 2}px`;
        box.style.top = `${a.top - s.top + a.height / 2}px`;
        box.style.setProperty('--fx', fx.color);
        const count = fx.shape === 'ring' ? 3 : fx.shape === 'slash' ? 3 : 10;
        for (let i = 0; i < count; i++) {
            const p = document.createElement('i');
            const ang = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const dist = 30 + Math.random() * 34;
            p.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
            p.style.setProperty('--dy', `${Math.sin(ang) * dist}px`);
            p.style.setProperty('--rot', `${Math.round(Math.random() * 360)}deg`);
            p.style.setProperty('--delay', `${i * (fx.shape === 'ring' || fx.shape === 'slash' ? 90 : 12)}ms`);
            box.appendChild(p);
        }
        scene.appendChild(box);
        window.setTimeout(() => box.remove(), 900);
    }

    // Mega Evolução: casulo de luz multicolorido e o Pokémon renasce maior
    private static megaFx(img: HTMLElement | null) {
        if (!img || reducedMotion()) return;
        this.restartClass(img, 'pb-mega-in');
        const scene = document.querySelector('#battle-modal .battle-scene') as HTMLElement | null;
        if (!scene) return;
        const a = img.getBoundingClientRect();
        const s = scene.getBoundingClientRect();
        const orb = document.createElement('div');
        orb.className = 'pb-mega-orb';
        orb.style.left = `${a.left - s.left + a.width / 2}px`;
        orb.style.top = `${a.top - s.top + a.height / 2}px`;
        scene.appendChild(orb);
        this.restartClass(scene, 'pb-shake');
        this.vibrate([30, 30, 30, 30, 120]);
        window.setTimeout(() => orb.remove(), 1300);
    }

    private static sendOut(img: HTMLElement | null) {
        if (!img || reducedMotion()) return;
        this.restartClass(img, 'pb-sendout');
        const scene = document.querySelector('#battle-modal .battle-scene') as HTMLElement | null;
        if (!scene) return;
        const a = img.getBoundingClientRect();
        const s = scene.getBoundingClientRect();
        if (!a.width) return;
        const flash = document.createElement('div');
        flash.className = 'pb-sendout-flash';
        flash.style.left = `${a.left - s.left + a.width / 2}px`;
        flash.style.top = `${a.top - s.top + a.height * 0.6}px`;
        scene.appendChild(flash);
        window.setTimeout(() => flash.remove(), 700);
    }

    // Lê a mensagem do golpe para chamar atenção a acertos especiais, como nos jogos
    // ------------------------------------------------------------------
    // Experiência
    // ------------------------------------------------------------------
    /**
     * HUD: compara o EXP de cada Pokémon com a leitura anterior (funciona para ganhos locais e
     * para os que chegam do online) e anima a barra, com "+N EXP" ou "Lv ↑" na linha.
     */
    private static animateHudXp() {
        const slots = document.querySelectorAll<HTMLElement>('#game-container .player-slot');
        GameState.players.forEach((p, idx) => {
            const rows = slots[idx]?.querySelectorAll<HTMLElement>('.pb-party');
            p.team.forEach((mon: any, slot: number) => {
                const key = `${p.id}:${slot}:${mon.id}`;
                const pct = Math.max(0, Math.min(100, (mon.currentXp / mon.maxXp) * 100));
                const prev = this.lastXp.get(key);
                this.lastXp.set(key, { lv: mon.level, xp: mon.currentXp, pct });
                const row = rows?.[slot];
                if (!prev || !row) return;
                const leveled = mon.level > prev.lv;
                if (!leveled && mon.currentXp <= prev.xp) return;

                const fill = row.querySelector<HTMLElement>('.pb-xp-fill');
                const xpRow = row.querySelector<HTMLElement>('.pb-xp-row');
                if (fill && !reducedMotion()) {
                    const frames = leveled
                        ? [{ width: `${prev.pct}%` }, { width: '100%', offset: 0.45 }, { width: '0%', offset: 0.46 }, { width: `${pct}%` }]
                        : [{ width: `${prev.pct}%` }, { width: `${pct}%` }];
                    fill.animate(frames, { duration: leveled ? 1100 : 700, easing: 'ease-out' });
                }
                if (xpRow) {
                    const pop = document.createElement('span');
                    pop.className = `pb-xp-pop${leveled ? ' is-level' : ''}`;
                    pop.textContent = leveled ? `Lv ${mon.level}!` : `+${Math.round(mon.currentXp - prev.xp)} EXP`;
                    row.appendChild(pop);
                    window.setTimeout(() => pop.remove(), 1700);
                }
                if (leveled) this.restartClass(row, 'pb-level-up');
            });
        });
    }

    /** Chamado por Pokemon._applyXp: na batalha, mostra o ganho na barra de EXP do Pokémon em campo. */
    static onXp(mon: any, amount: number, levelsGained: number) {
        const Battle = (window as any).Battle;
        if (!Battle?.active || Battle.activeMon !== mon) return;
        const scene = document.querySelector('#battle-modal .battle-scene') as HTMLElement | null;
        const bar = document.getElementById('ply-xp');
        if (!scene || !bar) return;

        const pct = Math.max(0, Math.min(100, (mon.currentXp / mon.maxXp) * 100));
        if (!reducedMotion()) {
            const from = bar.style.width || '0%';
            const frames = levelsGained > 0
                ? [{ width: from }, { width: '100%', offset: 0.45 }, { width: '0%', offset: 0.46 }, { width: `${pct}%` }]
                : [{ width: from }, { width: `${pct}%` }];
            bar.animate(frames, { duration: levelsGained > 0 ? 1200 : 700, easing: 'ease-out' });
        }

        const b = bar.getBoundingClientRect();
        const s = scene.getBoundingClientRect();
        const tag = document.createElement('span');
        tag.className = 'pb-battle-xp';
        tag.textContent = `+${amount} EXP`;
        tag.style.left = `${b.left - s.left + b.width / 2}px`;
        tag.style.top = `${b.top - s.top}px`;
        scene.appendChild(tag);
        window.setTimeout(() => tag.remove(), 1400);

        if (levelsGained > 0) {
            window.setTimeout(() => {
                scene.querySelectorAll('.pb-callout').forEach(n => n.remove());
                const el = document.createElement('div');
                el.className = 'pb-callout pb-callout--level';
                el.textContent = `${mon.name} subiu para o Lv.${mon.level}!`;
                scene.appendChild(el);
                this.spawnImpact(document.getElementById('ply-img'), 'level');
                this.restartClass(document.getElementById('ply-img'), 'pb-level-glow');
                window.setTimeout(() => el.remove(), 1600);
            }, 550);
        }
    }

    static onBattleLog(msg: string) {
        if (!msg || !document.getElementById('battle-modal')?.style.display.includes('flex')) return;
        let callout = '';
        let tone = '';
        if (/ESQUIVOU/.test(msg)) { callout = 'Esquivou!'; tone = 'miss'; }
        else if (/BLOQUEIO TOTAL/.test(msg)) { callout = 'Bloqueado!'; tone = 'miss'; }
        else if (/Crit/.test(msg)) { callout = 'Golpe crítico!'; tone = 'crit'; }
        else if (/🔥!/.test(msg)) { callout = 'É super efetivo!'; tone = 'super'; }
        else if (/🛡️\./.test(msg)) { callout = 'Não é muito efetivo…'; tone = 'weak'; }
        if (!callout) return;
        const scene = document.querySelector('#battle-modal .battle-scene') as HTMLElement | null;
        if (!scene) return;
        scene.querySelectorAll('.pb-callout').forEach(n => n.remove());
        const el = document.createElement('div');
        el.className = `pb-callout pb-callout--${tone}`;
        el.textContent = callout;
        scene.appendChild(el);
        if (tone === 'crit') this.restartClass(scene, 'pb-shake');
        window.setTimeout(() => el.remove(), 1300);
    }

    private static battleNumber(anchor: HTMLElement | null, diff: number) {
        const scene = document.querySelector('#battle-modal .battle-scene') as HTMLElement | null;
        if (!anchor || !scene) return;
        const a = anchor.getBoundingClientRect();
        const s = scene.getBoundingClientRect();
        const n = document.createElement('span');
        n.className = `pb-battle-number ${diff < 0 ? 'is-damage' : 'is-heal'}`;
        n.textContent = diff < 0 ? `${diff}` : `+${diff}`;
        n.style.left = `${a.left - s.left + a.width / 2}px`;
        n.style.top = `${a.top - s.top}px`;
        scene.appendChild(n);
        window.setTimeout(() => n.remove(), 1100);
    }

    private static restartClass(el: Element | null, cls: string) {
        if (!el) return;
        el.classList.remove(cls);
        void (el as HTMLElement).offsetWidth;
        el.classList.add(cls);
    }

    static battleResult(won: boolean, playerId: number) {
        if (!this.isMe(playerId)) return;
        this.vibrate(won ? [50, 50, 50, 50, 120] : [200]);
        const scene = document.querySelector('#battle-modal .battle-scene');
        this.restartClass(scene, won ? 'pb-victory' : 'pb-defeat');
    }
}

(window as any).GameFeel = GameFeel;
