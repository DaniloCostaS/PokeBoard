/**
 * EFEITOS DO EVENTO GLOBAL NA BATALHA
 * - Ambiente contínuo na cena (chuva, sol, areia, neve, névoa, lua sangrenta...) e um selo com a regra do evento
 * - Rajadas nos momentos em que o evento age: bônus/penalidade de clima no golpe, areia no início, névoa tóxica
 *   no fim do turno, congelamento, Fúria e Vínculo Sombrio.
 * Lê só o log da batalha, então funciona igual para quem está jogando, para o oponente e para espectadores.
 */
type Ambient = { icon: string; rule: string; particles?: number };

const AMBIENT: Record<string, Ambient> = {
    RAIN: { icon: '🌧️', rule: 'Água e Elétrico +25% · Fogo −25%', particles: 34 },
    DROUGHT: { icon: '☀️', rule: 'Fogo e Grama +25% · Água −25%', particles: 10 },
    SANDSTORM: { icon: '🌪️', rule: 'Quem não é Pedra/Terra/Aço perde 10% de HP', particles: 28 },
    WINTER_STORM: { icon: '❄️', rule: 'Gelo +50% · outros −20% e podem congelar', particles: 30 },
    TOXIC_SMOG: { icon: '☠️', rule: 'Fim de turno: −10% de HP (exceto Veneno/Aço)', particles: 7 },
    BLOOD_MOON: { icon: '🌑', rule: 'Fantasma e Noturno +20% · derrota custa mais ouro', particles: 12 },
    MYSTIC_AURA: { icon: '✨', rule: 'Psíquico e Fada +50%', particles: 18 },
    BERSERK_MODE: { icon: '💢', rule: 'Todo dano em dobro' },
    SOUL_LINK: { icon: '🔗', rule: '30% do dano volta para quem atacou' },
    ROCKET: { icon: '🚀', rule: 'Perder para selvagem/NPC: a Rocket rouba 1 Pokémon (time com 4+)' },
    GOLD_RUSH: { icon: '💰', rule: 'Ouro das vitórias em dobro' },
    SAFARI_ZONE: { icon: '🪤', rule: 'Pokébolas +50% e sem gastar' },
    MEGA_BLOCK: { icon: '⛔', rule: 'Mega Evolução bloqueada' },
};

// Marcas que o BattleCalc escreve no golpe → rajada no alvo
const SIGNS: { re: RegExp; fx: string; label: string; good: boolean }[] = [
    { re: /\[Sol☀️\]/, fx: 'sun', label: 'Sol +25%', good: true },
    { re: /\[Sol🥵\]/, fx: 'sun', label: 'Sol −25%', good: false },
    { re: /\[Chuva🌧️\]/, fx: 'rain', label: 'Chuva +25%', good: true },
    { re: /\[Chuva💧\]/, fx: 'rain', label: 'Chuva −25%', good: false },
    { re: /\[Gelo❄️\]/, fx: 'ice', label: 'Nevasca +50%', good: true },
    { re: /\[Frio🧊\]/, fx: 'ice', label: 'Frio −20%', good: false },
    { re: /\[Mist[íi]co✨\]/, fx: 'mystic', label: 'Aura +50%', good: true },
    { re: /\[Lua🌑\]/, fx: 'moon', label: 'Lua +20%', good: true },
];

function reduced(): boolean {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

export class BattleEventFx {
    private static currentId: string | null = null;

    private static scene(): HTMLElement | null {
        return document.querySelector('#battle-modal .battle-scene');
    }

    private static eventId(): string | null {
        return (window as any).Game?.currentGlobalEvent?.id || null;
    }

    // Abre a batalha (local, rede ou espectador): monta o ambiente do evento atual
    static start() {
        const scene = this.scene();
        if (!scene) return;
        this.stop();
        const id = this.eventId();
        const amb = id ? AMBIENT[id] : null;
        if (!id || !amb) return;
        this.currentId = id;
        const ev = (window as any).Game?.currentGlobalEvent;

        const layer = document.createElement('div');
        layer.className = `pb-bev pb-bev--${id}`;
        layer.setAttribute('aria-hidden', 'true');
        if (amb.particles && !reduced()) {
            for (let i = 0; i < amb.particles; i++) {
                const s = document.createElement('i');
                s.style.setProperty('--x', `${Math.random() * 100}%`);
                s.style.setProperty('--y', `${Math.random() * 100}%`);
                s.style.setProperty('--d', `${(0.6 + Math.random() * 1.4).toFixed(2)}s`);
                s.style.setProperty('--delay', `${(-Math.random() * 3).toFixed(2)}s`);
                s.style.setProperty('--s', `${(0.6 + Math.random() * 0.8).toFixed(2)}`);
                layer.appendChild(s);
            }
        }
        scene.prepend(layer);

        const badge = document.createElement('div');
        badge.className = 'pb-bev-badge';
        badge.setAttribute('role', 'note');
        const icon = document.createElement('span');
        icon.textContent = amb.icon;
        icon.setAttribute('aria-hidden', 'true');
        const text = document.createElement('span');
        const name = document.createElement('b');
        name.textContent = ev?.name || 'Evento';
        const rule = document.createElement('small');
        rule.textContent = amb.rule;
        text.append(name, rule);
        badge.append(icon, text);
        scene.appendChild(badge);
    }

    static stop() {
        this.currentId = null;
        document.querySelectorAll('#battle-modal .pb-bev, #battle-modal .pb-bev-badge, #battle-modal .pb-bev-burst').forEach(n => n.remove());
    }

    // Cada linha do log da batalha passa aqui
    static onLog(msg: string) {
        if (!msg) return;
        // Batalha aberta antes do evento mudar (ou ambiente ainda não montado)
        const id = this.eventId();
        if (id !== this.currentId) this.start();

        const target = this.targetOf(msg);
        for (const sign of SIGNS) {
            if (sign.re.test(msg)) {
                this.burst(target, sign.fx, sign.label, sign.good);
                break;
            }
        }
        if (/\[💢BERSERK!\]/.test(msg)) {
            this.burst(target, 'berserk', 'Fúria ×2', true);
            this.shake();
        }
        if (/\[🔗LINK!\]/.test(msg)) this.link(target);
        if (/Tempestade de Areia corta/.test(msg)) {
            this.gust('sand');
            this.burst('ply-img', 'sand', '−10%', false);
            this.burst('opp-img', 'sand', '−10%', false);
        }
        if (/Nevoeiro Tóxico sufoca/.test(msg)) {
            this.burst('ply-img', 'toxic', '−10%', false);
            this.burst('opp-img', 'toxic', '−10%', false);
        }
        if (/congelou na nevasca/.test(msg)) this.burst(this.frozenTarget(msg), 'frozen', 'Congelou!', false);
    }

    // "Fulano atacou! ..." → o alvo é o outro lado
    private static targetOf(msg: string): string {
        const B = (window as any).Battle;
        const opp = B?.opponent?.name;
        if (opp && msg.startsWith(`${opp} atacou`)) return 'ply-img';
        return 'opp-img';
    }

    private static frozenTarget(msg: string): string {
        const B = (window as any).Battle;
        const opp = B?.opponent?.name;
        return opp && msg.startsWith(`❄️ ${opp} `) ? 'opp-img' : 'ply-img';
    }

    private static place(el: HTMLElement, anchorId: string): boolean {
        const scene = this.scene();
        const anchor = document.getElementById(anchorId);
        if (!scene || !anchor) return false;
        const a = anchor.getBoundingClientRect();
        const s = scene.getBoundingClientRect();
        if (!a.width) return false;
        el.style.left = `${a.left - s.left + a.width / 2}px`;
        el.style.top = `${a.top - s.top + a.height / 2}px`;
        el.style.setProperty('--size', `${Math.max(70, Math.min(a.width, a.height) * 1.15)}px`);
        scene.appendChild(el);
        return true;
    }

    private static burst(anchorId: string, fx: string, label: string, good: boolean) {
        const el = document.createElement('div');
        el.className = `pb-bev-burst pb-bev-burst--${fx}${good ? ' is-good' : ' is-bad'}`;
        el.setAttribute('aria-hidden', 'true');
        const chip = document.createElement('span');
        chip.textContent = label;
        el.appendChild(chip);
        if (!reduced()) {
            for (let i = 0; i < 8; i++) {
                const p = document.createElement('i');
                p.style.setProperty('--a', `${i * 45 + Math.random() * 20}deg`);
                el.appendChild(p);
            }
        }
        if (!this.place(el, anchorId)) return;
        // Mantém o selo dentro da cena (Pokémon perto da borda)
        const scene = this.scene()!.getBoundingClientRect();
        const c = chip.getBoundingClientRect();
        const shift = c.left < scene.left + 4 ? scene.left + 4 - c.left : c.right > scene.right - 4 ? scene.right - 4 - c.right : 0;
        if (shift) chip.style.marginLeft = `${shift}px`;
        window.setTimeout(() => el.remove(), 1400);
    }

    private static gust(kind: string) {
        const scene = this.scene();
        if (!scene || reduced()) return;
        const el = document.createElement('div');
        el.className = `pb-bev-burst pb-bev-gust pb-bev-gust--${kind}`;
        el.setAttribute('aria-hidden', 'true');
        scene.appendChild(el);
        window.setTimeout(() => el.remove(), 1300);
    }

    // Vínculo Sombrio: corrente de energia do alvo de volta para quem atacou
    private static link(targetId: string) {
        const scene = this.scene();
        const from = document.getElementById(targetId);
        const to = document.getElementById(targetId === 'opp-img' ? 'ply-img' : 'opp-img');
        if (!scene || !from || !to) return;
        const s = scene.getBoundingClientRect(), a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
        const x1 = a.left - s.left + a.width / 2, y1 = a.top - s.top + a.height / 2;
        const x2 = b.left - s.left + b.width / 2, y2 = b.top - s.top + b.height / 2;
        const el = document.createElement('div');
        el.className = 'pb-bev-burst pb-bev-link';
        el.setAttribute('aria-hidden', 'true');
        el.style.left = `${x1}px`;
        el.style.top = `${y1}px`;
        el.style.width = `${Math.hypot(x2 - x1, y2 - y1)}px`;
        el.style.transform = `rotate(${Math.atan2(y2 - y1, x2 - x1)}rad)`;
        scene.appendChild(el);
        this.burst(targetId === 'opp-img' ? 'ply-img' : 'opp-img', 'link', 'Vínculo 30%', false);
        window.setTimeout(() => el.remove(), 1200);
    }

    private static shake() {
        const scene = this.scene();
        if (!scene || reduced()) return;
        scene.classList.remove('pb-shake');
        void scene.offsetWidth;
        scene.classList.add('pb-shake');
    }
}

(window as any).BattleEventFx = BattleEventFx;
