import { GYM_DATA } from '../../constants/gyms';

// ==========================================================================
// Cinematics — momentos de "jogo Pokémon" (intro VS, encontro selvagem,
// celebrações, pódio final e tela de carregamento).
// Tudo aqui é puramente visual: nada altera regras, estado ou rede.
// Toda cena se fecha sozinha (timer + timer de segurança) e pode ser
// pulada com um toque/clique.
// ==========================================================================

type AnyPlayer = any;
type AnyMon = any;

const ART = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const reducedMotion = () => {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

const TYPE_COLORS: Record<string, string> = {
    Normal: '#A8A77A', Fogo: '#EE8130', 'Água': '#6390F0', 'Elétrico': '#F7D02C', Grama: '#7AC74C',
    Gelo: '#96D9D6', Lutador: '#C22E28', Veneno: '#A33EA1', Terra: '#E2BF65', Voador: '#A98FF3',
    'Psíquico': '#F95587', Inseto: '#A6B91A', Pedra: '#B6A136', Fantasma: '#735797', 'Dragão': '#6F35FC',
    Noturno: '#705746', 'Aço': '#B7B7CE', Fada: '#D685AD'
};

const GYM_TAUNTS: Record<string, string> = {
    Pedra: 'Minha defesa é dura como rocha!',
    'Água': 'Vou te mostrar a fúria das marés!',
    'Elétrico': 'Prepare-se para levar um choque!',
    Grama: 'A natureza está do meu lado.',
    Veneno: 'Um ninja ataca quando menos se espera.',
    'Psíquico': 'Eu já previ a sua derrota.',
    Fogo: 'Espero que você aguente o calor!',
    Terra: 'Ninguém sai deste ginásio sem minha permissão.',
    Fada: 'A beleza também pode ser implacável.',
    'Aço': 'Meu aço não se curva para ninguém.',
    Noturno: 'Vamos fazer barulho na escuridão!',
    'Dragão': 'Dragões não conhecem o medo.',
    Fantasma: 'Você consegue ver o que eu vejo?',
    Inseto: 'Insetos são mais fortes do que parecem!',
    Voador: 'Vou te derrubar lá do alto!',
    Lutador: 'Treinei corpo e mente para este momento!',
    Gelo: 'Vou congelar suas esperanças.',
    Normal: 'Não me subestime, viu?'
};

const NPC_TAUNTS: Record<string, string[]> = {
    'Rocket Grunt': ['Prepare-se para encrenca!', 'Seus Pokémon agora são da Equipe Rocket!'],
    'Motoqueiro': ['Sai da frente, novato!', 'Esta estrada é minha!'],
    'Jovem': ['Meu Pokémon está entre os melhores!', 'Ei! Nossos olhares se cruzaram!'],
    'Velho': ['Na minha época, as batalhas eram de verdade!', 'Ainda tenho fôlego para isso!'],
    'Caçador de Insetos': ['Olha só o que eu peguei na floresta!', 'Meus insetos estão famintos!'],
    'Nadador': ['Nado todo dia para ficar em forma!', 'A água é o meu território!'],
    'Garota Kimono': ['Dance comigo, se for capaz.', 'Meus Pokémon se movem com graça.'],
    'Rival Johto': ['Fraco. Você não merece seus Pokémon.', 'Saia do meu caminho.'],
    'Capanga Aqua': ['O mar vai engolir tudo!', 'A Equipe Aqua não perde!'],
    'Capanga Magma': ['A terra precisa de mais espaço!', 'Sinta o calor da Equipe Magma!'],
    'Montanhista': ['Escalei montanhas maiores que você!', 'Força de rocha, coração de pedra!'],
    'Schoolboy': ['Estudei todos os tipos. Você não tem chance!', 'Isso vai cair na prova!']
};
const GENERIC_TAUNTS = ['Nossos olhares se cruzaram! Vamos batalhar!', 'Você parece forte. Vamos ver!', 'Não vou pegar leve!'];

export const LOADING_TIPS = [
    'Restos curam 10 HP do Pokémon que segura o item a cada turno.',
    'Completar uma volta no tabuleiro rende 500G, 2 cartas e +1 nível para todo o time.',
    'Você pode usar no máximo 3 cartas em uma mesma batalha.',
    'Não dá para fugir de treinadores, líderes nem rivais. Prepare o time antes!',
    'Vencer um Líder de Ginásio rende 1000G e a sua insígnia.',
    'No PvP, o vencedor rouba 30% do ouro do derrotado. Na Lua Sangrenta, 60%!',
    'Pokémon com Felicidade máxima ganham +5% de status nas batalhas.',
    'A Sitrus Berry restaura 50% do HP quando ele cai para a metade.',
    'Great Ball dá +20% de chance de captura; Ultra Ball, +40%. A Master Ball nunca falha.',
    'A Scope Lens garante acerto crítico: +5 no dado de dano.',
    'Rocky Helmet devolve 25% do dano recebido ao atacante.',
    'Na Tempestade de Areia, só Pedra, Terra e Aço não perdem HP no início da batalha.',
    'Durante o Dia de Pagamento, todo ouro de batalhas e voltas vem em dobro.',
    'Vencer um Pokémon selvagem rende 150G e 25% de chance de ganhar uma carta.',
    'Pokémon de treinadores não podem ser capturados.',
    'O Campeão da Liga é enfrentado sem itens e sem cartas. Só força bruta!',
    'Em uma derrota total, você volta ao último Centro Pokémon para se recuperar.',
    'O nível máximo de um Pokémon é 25.',
    'A Choice Scarf aumenta a velocidade em 20%; a Choice Band, o ataque em 10%.',
    'Na Febre Shiny, há +30% de chance de encontrar um Pokémon brilhante.'
];

function esc(s: unknown): string {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[c]);
}
function stripTags(s: string): string { return String(s ?? '').replace(/<[^>]*>/g, '').replace(/\[CPU\]\s*/g, '').trim(); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function artUrls(id: number, shiny: boolean): string[] {
    const s = shiny ? 'shiny/' : '';
    return [
        `${ART}/other/official-artwork/${s}${id}.png`,
        `${ART}/other/home/${s}${id}.png`,
        `${ART}/${s}${id}.png`,
        `${ART}/${id}.png`
    ];
}

/** <img> com cadeia de fallbacks; esconde se tudo falhar. */
function imgTag(urls: string[], cls: string, alt = ''): string {
    const list = urls.filter(Boolean);
    const first = list.shift() || '';
    return `<img class="${cls}" src="${esc(first)}" alt="${esc(alt)}" draggable="false" data-fb="${esc(list.join('|'))}" onerror="window.Cinematics && window.Cinematics._fb(this)">`;
}

function avatarUrl(a: string | undefined): string {
    if (!a) return '/assets/img/Treinadores/Red.png';
    if (a.startsWith('/') || a.startsWith('http')) return a;
    return `/assets/img/Treinadores/${a}`;
}

function isLocal(player: AnyPlayer): boolean {
    if (!player) return false;
    const Net = (window as any).Network;
    if (Net && Net.isOnline) return Net.myPlayerId === player.id;
    return !player.isCPU;
}

// Online: quem viveu o momento avisa a sala, e os outros veem a mesma comemoração (com o nome de quem foi)
function relay(kind: string, data: Record<string, unknown>) {
    try {
        const Net = (window as any).Network;
        if (Net && Net.isOnline && !Net.isSpectator) Net.sendAction('CELEBRATE', { kind, ...data });
    } catch { /* comemoração é só visual */ }
}

function toast(msg: string, tone: string = 'success') {
    try { (window as any).GameDialog?.toast?.(msg, { tone }); } catch { /* opcional */ }
}

interface Fighter { name: string; sub: string; img: string; kind: 'figure' | 'card' | 'pixel'; taunt?: string; }

export class Cinematics {
    /** Debug: quando definido (ms), toda cena congela nesse instante e não se fecha sozinha. */
    static debugFreezeAt: number | null = null;

    private static root: HTMLElement | null = null;
    private static queue: Array<() => { el: HTMLElement; ms: number }> = [];
    private static playing = false;
    private static introEl: HTMLElement | null = null;

    // ------------------------------------------------------------------ base
    static _fb(img: HTMLImageElement) {
        const rest = (img.dataset.fb || '').split('|').filter(Boolean);
        if (rest.length) { img.dataset.fb = rest.slice(1).join('|'); img.src = rest[0]; }
        else { img.onerror = null; img.style.visibility = 'hidden'; }
    }

    private static layer(): HTMLElement {
        if (this.root && document.body.contains(this.root)) return this.root;
        this.root = document.createElement('div');
        this.root.id = 'pb-cine-root';
        document.body.appendChild(this.root);
        return this.root;
    }

    private static freeze(el: HTMLElement, ms: number) {
        requestAnimationFrame(() => {
            try {
                (el as any).getAnimations({ subtree: true }).forEach((a: Animation) => { a.pause(); a.currentTime = ms; });
            } catch { /* sem WAAPI */ }
        });
    }

    /** Monta a cena; fecha em `ms` (ou no toque). Retorna promise resolvida ao fechar. */
    private static mount(el: HTMLElement, ms: number, opts: { skippable?: boolean; onClose?: () => void } = {}): Promise<void> {
        const root = this.layer();
        if (reducedMotion()) el.classList.add('cine-rm');
        root.appendChild(el);
        let closed = false;
        let resolveFn: () => void = () => {};
        const p = new Promise<void>(r => (resolveFn = r));
        const close = () => {
            if (closed) return;
            closed = true;
            el.classList.add('cine-out');
            window.setTimeout(() => { el.remove(); opts.onClose?.(); resolveFn(); }, 260);
        };
        (el as any)._close = close;
        if (opts.skippable !== false) el.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); close(); });
        if (this.debugFreezeAt !== null) { this.freeze(el, this.debugFreezeAt); return p; }
        window.setTimeout(close, ms);
        window.setTimeout(close, ms + 4000); // segurança
        return p;
    }

    private static enqueue(build: () => { el: HTMLElement; ms: number }) {
        this.queue.push(build);
        if (!this.playing) this.next();
    }

    private static next() {
        const build = this.queue.shift();
        if (!build) { this.playing = false; return; }
        this.playing = true;
        let scene: { el: HTMLElement; ms: number };
        try { scene = build(); } catch (e) { console.warn('Cinematics', e); this.next(); return; }
        this.mount(scene.el, scene.ms, { onClose: () => this.next() });
        if (this.debugFreezeAt !== null) this.playing = false;
    }

    private static div(cls: string, html: string): HTMLElement {
        const d = document.createElement('div');
        d.className = cls;
        d.innerHTML = html;
        return d;
    }

    // ------------------------------------------------------------ VS intro
    /** Chamado no setup da batalha (BattleCore) e no espectador (startFromNetwork). */
    static battleIntro(bc: any, label: string = '', npcImage: string = '') {
        try {
            if (!bc || !bc.player) return;
            const isTrainer = bc.isPvP || bc.isGym || bc.isNPC || bc.isChampion;
            if (!isTrainer) {
                const mon = bc.opponent || (bc.oppTeamList || [])[0];
                if (mon) this.wildIntro(mon);
                return;
            }
            const me: Fighter = { name: stripTags(bc.player.name), sub: 'Treinador', img: avatarUrl(bc.player.avatar), kind: 'figure' };
            let foe: Fighter;
            let theme = 'trainer';
            const Game = (window as any).Game || {};
            if (bc.isPvP && bc.enemyPlayer) {
                foe = { name: stripTags(bc.enemyPlayer.name), sub: 'Rival', img: avatarUrl(bc.enemyPlayer.avatar), kind: 'figure' };
                theme = 'pvp';
            } else if (bc.isGym) {
                const actualId = Game.activeGyms ? Game.activeGyms[bc.gymId - 1] : bc.gymId;
                const gym = GYM_DATA.find(g => g.id === actualId);
                const t = gym?.type?.[0] || '';
                foe = {
                    name: gym ? `Líder ${gym.leaderName}` : 'Líder de Ginásio',
                    sub: gym ? `Ginásio ${gym.type.join(' / ')}` : 'Ginásio',
                    img: gym ? `/assets/img/LideresGym/${gym.leaderImg}` : '/assets/img/Ginasio.jpg',
                    kind: 'pixel',
                    taunt: GYM_TAUNTS[t] || pick(GENERIC_TAUNTS)
                };
                theme = 'gym';
                if (t && TYPE_COLORS[t]) (foe as any).color = TYPE_COLORS[t];
            } else if (bc.isChampion) {
                const ch = (window as any).GameState?.globalChampion || Game.globalChampion || {};
                foe = { name: stripTags(ch.name || 'Campeão'), sub: 'Campeão da Liga', img: avatarUrl(ch.avatar), kind: 'figure', taunt: 'Chegar aqui foi fácil. Vencer é outra história.' };
                theme = 'champion';
            } else {
                const opp = bc.opponent || {};
                const name = stripTags(label || opp._npcName || 'Treinador');
                const img = npcImage || opp._npcImage || '/assets/img/Treinadores/Red.png';
                foe = { name, sub: 'Treinador', img, kind: img.includes('/NPCs/') ? 'card' : 'figure', taunt: pick(NPC_TAUNTS[name] || GENERIC_TAUNTS) };
            }
            this.showVs(me, foe, theme);
        } catch (e) { console.warn('Cinematics.battleIntro', e); }
    }

    static showVs(me: Fighter, foe: Fighter, theme: string = 'trainer', ms: number = 1750) {
        this.introEl?.remove();
        const portrait = (f: Fighter) => `<div class="cine-vs-portrait is-${f.kind}">${imgTag([f.img, '/assets/img/Treinadores/Red.png'], 'cine-vs-img', f.name)}</div>`;
        const block = (f: Fighter, side: string) => `
            <div class="cine-vs-panel cine-vs-${side}">
                <div class="cine-vs-lines"></div>
                <div class="cine-vs-content">
                    ${portrait(f)}
                    <div class="cine-vs-text">
                        <div class="cine-vs-sub">${esc(f.sub)}</div>
                        <div class="cine-vs-name">${esc(f.name)}</div>
                        ${f.taunt ? `<div class="cine-vs-taunt">“${esc(f.taunt)}”</div>` : ''}
                    </div>
                </div>
            </div>`;
        const el = this.div(`cine cine-vs theme-${theme}`, `
            ${block(me, 'me')}
            ${block(foe, 'foe')}
            <div class="cine-vs-slash"></div>
            <div class="cine-vs-badge"><span>VS</span></div>
            <div class="cine-flash"></div>`);
        const color = (foe as any).color;
        if (color) el.style.setProperty('--foe', color);
        el.setAttribute('role', 'presentation');
        this.introEl = el;
        this.mount(el, ms).then(() => { if (this.introEl === el) this.introEl = null; });
    }

    // ------------------------------------------------------- wild encounter
    static wildIntro(mon: AnyMon, ms: number = 1200) {
        try {
            this.introEl?.remove();
            const name = esc(mon.name || 'Pokémon');
            const shiny = !!mon.isShiny;
            const legend = !!mon.isLegendary;
            let line = `Um ${name} selvagem apareceu!`;
            if (shiny) line = `Um ${name} <em>brilhante</em> apareceu!`;
            else if (legend) line = `O lendário ${name} apareceu!`;
            const stripes = Array.from({ length: 8 }, (_, i) => `<i style="--i:${i}"></i>`).join('');
            const sparkles = shiny ? Array.from({ length: 9 }, (_, i) => `<b class="cine-spark" style="--i:${i}"></b>`).join('') : '';
            const el = this.div(`cine cine-wild${shiny ? ' is-shiny' : ''}${legend ? ' is-legend' : ''}`, `
                <div class="cine-wild-stripes">${stripes}</div>
                <div class="cine-wild-stage">
                    <div class="cine-wild-glow"></div>
                    ${imgTag(artUrls(mon.id, shiny), 'cine-wild-mon', mon.name)}
                    ${sparkles}
                </div>
                <div class="cine-textbox"><p>${line}</p></div>`);
            this.introEl = el;
            this.mount(el, ms).then(() => { if (this.introEl === el) this.introEl = null; });
        } catch (e) { console.warn('Cinematics.wildIntro', e); }
    }

    /** Comemoração vinda de outro jogador da sala (ação CELEBRATE). */
    static fromRemote(data: any, playerId: number) {
        try {
            if (!data || typeof data.kind !== 'string') return;
            const player = ((window as any).Game?.players || []).find((p: any) => p.id === playerId);
            const who = stripTags(player?.name || 'Um treinador');
            const num = (v: unknown) => Number.isFinite(Number(v)) ? Number(v) : 0;
            const str = (v: unknown) => stripTags(String(v ?? '')).slice(0, 80);
            switch (data.kind) {
                case 'badge': {
                    const gym = GYM_DATA.find(g => g.id === num(data.gymDataId));
                    if (!gym) return;
                    toast(`${who} conquistou a Insígnia ${gym.type.join(' / ')}!`);
                    this.showBadge(gym.id, player);
                    break;
                }
                case 'capture':
                    toast(`${who} capturou ${str(data.name)}!`);
                    this.showCapture(num(data.id), str(data.name), !!data.shiny, !!data.legendary);
                    break;
                case 'evolution':
                    toast(`O ${str(data.oldName)} de ${who} evoluiu!`);
                    this.showEvolution(num(data.oldId), str(data.oldName), num(data.newId), str(data.newName), !!data.shiny);
                    break;
                case 'quest':
                    toast(`${who} concluiu a missão "${str(data.questName)}"!`);
                    break;
                case 'lap':
                    toast(`${who} completou uma volta no mapa (+${num(data.gold)}G)!`);
                    break;
            }
        } catch (e) { console.warn('Cinematics.fromRemote', e); }
    }

    // ---------------------------------------------------------- celebrations
    private static celebrate(cls: string, html: string, ms: number) {
        this.enqueue(() => ({ el: this.div(`cine cine-cele ${cls}`, `<div class="cine-rays"></div>${html}<div class="cine-flash"></div><div class="cine-hint">Toque para continuar</div>`), ms }));
    }

    /** Vitória de ginásio (BattleCore.win). gymIndex = posição 1..N no tabuleiro. */
    static badge(player: AnyPlayer, gymIndex: number) {
        try {
            const Game = (window as any).Game || {};
            const actualId = Game.activeGyms ? Game.activeGyms[gymIndex - 1] : gymIndex;
            const gym = GYM_DATA.find(g => g.id === actualId);
            if (!gym) return;
            const typeName = gym.type.join(' / ');
            if (!isLocal(player)) { toast(`${stripTags(player?.name)} conquistou a Insígnia ${typeName}!`); return; }
            relay('badge', { gymDataId: gym.id });
            this.showBadge(gym.id, player);
        } catch (e) { console.warn('Cinematics.badge', e); }
    }

    static showBadge(gymDataId: number, player?: AnyPlayer, ms: number = 2700) {
        const gym = GYM_DATA.find(g => g.id === gymDataId) || GYM_DATA[0];
        const color = TYPE_COLORS[gym.type[0]] || '#e0a92e';
        const count = player?.badges ? player.badges.filter((b: boolean) => b).length : 0;
        const total = ((window as any).Game?.activeGyms?.length) || 8;
        this.celebrate('cine-badge', `
            <div class="cine-cele-body" style="--accent:${color}">
                <div class="cine-kicker">Nova insígnia!</div>
                <div class="cine-badge-wrap">
                    ${imgTag([`/assets/img/Insignias/${gym.badgeImg}`], 'cine-badge-img', 'Insígnia')}
                    <div class="cine-shine"></div>
                </div>
                <div class="cine-title">Insígnia ${esc(gym.type.join(' / '))} conquistada!</div>
                <div class="cine-sub">Você derrotou o Líder ${esc(gym.leaderName)}${count ? ` · ${count}/${total} insígnias` : ''}</div>
            </div>`, ms);
    }

    /** Evolução real em jogo (Pokemon.checkEvolution, fora do modo silencioso). */
    static evolution(player: AnyPlayer, oldId: number, oldName: string, mon: AnyMon) {
        try {
            if (!mon || oldId === mon.id) return;
            if (!isLocal(player)) return;
            relay('evolution', { oldId, oldName, newId: mon.id, newName: mon.name, shiny: !!mon.isShiny });
            this.showEvolution(oldId, oldName, mon.id, mon.name, !!mon.isShiny);
        } catch (e) { console.warn('Cinematics.evolution', e); }
    }

    static showEvolution(oldId: number, oldName: string, newId: number, newName: string, shiny = false, ms: number = 3600) {
        this.celebrate('cine-evo', `
            <div class="cine-cele-body">
                <div class="cine-evo-stage">
                    <div class="cine-evo-glow"></div>
                    ${imgTag(artUrls(oldId, shiny), 'cine-evo-old', oldName)}
                    ${imgTag(artUrls(newId, shiny), 'cine-evo-new', newName)}
                </div>
                <div class="cine-evo-text">
                    <div class="cine-textbox is-inline cine-evo-pre"><p>Hã? ${esc(oldName)} está evoluindo!</p></div>
                    <div class="cine-evo-post">
                        <div class="cine-kicker">Evoluiu!</div>
                        <div class="cine-title">${esc(oldName)} evoluiu para ${esc(newName)}!</div>
                    </div>
                </div>
            </div>`, ms);
    }

    /** Captura de lendário ou shiny (BattleCore.captureSuccess). */
    static capture(player: AnyPlayer, mon: AnyMon) {
        try {
            if (!mon || !(mon.isLegendary || mon.isShiny)) return;
            const kind = mon.isShiny ? 'brilhante' : 'lendário';
            if (!isLocal(player)) { toast(`${stripTags(player?.name)} capturou um ${mon.name} ${kind}!`); return; }
            relay('capture', { id: mon.id, name: mon.name, shiny: !!mon.isShiny, legendary: !!mon.isLegendary });
            this.showCapture(mon.id, mon.name, !!mon.isShiny, !!mon.isLegendary);
        } catch (e) { console.warn('Cinematics.capture', e); }
    }

    static showCapture(id: number, name: string, shiny: boolean, legendary: boolean, ms: number = 2800) {
        const kicker = shiny && legendary ? 'Lendário brilhante!' : shiny ? 'Pokémon brilhante!' : 'Pokémon lendário!';
        const sparkles = Array.from({ length: 10 }, (_, i) => `<b class="cine-spark" style="--i:${i}"></b>`).join('');
        this.celebrate(`cine-capture${shiny ? ' is-shiny' : ''}`, `
            <div class="cine-cele-body">
                <div class="cine-kicker">${kicker}</div>
                <div class="cine-capture-stage">
                    <div class="cine-ball"><span></span></div>
                    ${imgTag(artUrls(id, shiny), 'cine-capture-mon', name)}
                    ${sparkles}
                </div>
                <div class="cine-title">Peguei! ${esc(name)} foi capturado!</div>
                <div class="cine-sub">Dados registrados na Pokédex.</div>
            </div>`, ms);
    }

    /** Missão concluída (QuestManager.completeQuest). */
    static quest(player: AnyPlayer, questName: string, reward: string) {
        try {
            if (!isLocal(player)) return;
            relay('quest', { questName: stripTags(questName) });
            this.celebrate('cine-quest', `
                <div class="cine-cele-body">
                    <div class="cine-quest-seal"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                    <div class="cine-kicker">Missão concluída!</div>
                    <div class="cine-title">${esc(stripTags(questName))}</div>
                    <div class="cine-reward">${esc(stripTags(reward))}</div>
                </div>`, 2600);
        } catch (e) { console.warn('Cinematics.quest', e); }
    }

    /** Volta completa no tabuleiro (GameMovement). */
    static lap(player: AnyPlayer, gold: number = 500) {
        try {
            if (!isLocal(player)) return;
            relay('lap', { gold });
            this.celebrate('cine-lap', `
                <div class="cine-cele-body">
                    <div class="cine-lap-flag"><i></i><i></i><i></i><i></i><i></i><i></i></div>
                    <div class="cine-kicker">Volta completa!</div>
                    <div class="cine-title">${esc(stripTags(player?.name || 'Treinador'))} deu a volta no mapa!</div>
                    <div class="cine-chips">
                        <span class="chip-gold">+${gold}G</span><span>+2 cartas</span><span>+1 nível no time</span>
                    </div>
                </div>`, 2600);
        } catch (e) { console.warn('Cinematics.lap', e); }
    }

    // --------------------------------------------------------------- podium
    static podium(winnerId: number) {
        try {
            const GS = (window as any).GameState || (window as any).Game;
            const players: AnyPlayer[] = [...((GS && GS.players) || [])];
            if (!players.length) return;
            const badges = (p: AnyPlayer) => (p.badges || []).filter((b: boolean) => b).length;
            const lvl = (p: AnyPlayer) => (p.team || []).reduce((s: number, m: AnyMon) => s + (m.level || 0), 0);
            players.sort((a, b) => (b.id === winnerId ? 1 : 0) - (a.id === winnerId ? 1 : 0) || badges(b) - badges(a) || (b.gold || 0) - (a.gold || 0) || lvl(b) - lvl(a));

            const top = players.slice(0, 3);
            const order = top.length >= 3 ? [top[1], top[0], top[2]] : top.length === 2 ? [top[1], top[0]] : [top[0]];
            const place = (p: AnyPlayer) => players.indexOf(p) + 1;
            const step = (p: AnyPlayer) => `
                <div class="cine-pod-col place-${place(p)}">
                    <div class="cine-pod-avatar">${imgTag([avatarUrl(p.avatar), '/assets/img/Treinadores/Red.png'], '', p.name)}</div>
                    <div class="cine-pod-name">${esc(stripTags(p.name))}</div>
                    <div class="cine-pod-meta">${badges(p)} insígnias · ${(p.gold || 0).toLocaleString('pt-BR')}G</div>
                    <div class="cine-pod-step"><span>${place(p)}</span></div>
                </div>`;

            // Estatísticas divertidas
            const best = (fn: (p: AnyPlayer) => number) => {
                let bp: AnyPlayer = null; let bv = -Infinity;
                players.forEach(p => { const v = fn(p); if (v > bv) { bv = v; bp = p; } });
                return { p: bp, v: bv };
            };
            const stats: string[] = [];
            const rich = best(p => p.gold || 0);
            if (rich.p) stats.push(this.statCard('Mais rico', stripTags(rich.p.name), `${rich.v.toLocaleString('pt-BR')}G`, avatarUrl(rich.p.avatar)));
            let strongMon: AnyMon = null; let strongOwner: AnyPlayer = null;
            players.forEach(p => (p.team || []).forEach((m: AnyMon) => { if (!strongMon || m.level > strongMon.level) { strongMon = m; strongOwner = p; } }));
            if (strongMon) stats.push(this.statCard('Pokémon mais forte', `${strongMon.name} Nv. ${strongMon.level}`, stripTags(strongOwner.name), `${ART}/${strongMon.isShiny ? 'shiny/' : ''}${strongMon.id}.png`, true));
            const cards = best(p => p.stats?.cardsUsed || 0);
            if (cards.p && cards.v > 0) stats.push(this.statCard('Mestre das cartas', stripTags(cards.p.name), `${cards.v} cartas ofensivas`, avatarUrl(cards.p.avatar)));
            const lost = best(p => p.stats?.turnsLost || 0);
            if (lost.p && lost.v > 0) stats.push(this.statCard('Mais azarado', stripTags(lost.p.name), `${lost.v} turnos perdidos`, avatarUrl(lost.p.avatar)));
            const rest = players.slice(3).map(p => `<span>${place(p)}º ${esc(stripTags(p.name))}</span>`).join('');

            document.getElementById('pb-cine-podium')?.remove();
            const el = this.div('cine cine-podium', `
                <div class="cine-podium-inner">
                    <div class="cine-kicker">Fim de jogo</div>
                    <div class="cine-podium-title">Pódio da Liga</div>
                    <div class="cine-pod-row n${order.length}">${order.map(step).join('')}</div>
                    ${rest ? `<div class="cine-pod-rest">${rest}</div>` : ''}
                    <div class="cine-pod-stats">${stats.join('')}</div>
                    <button type="button" class="cine-pod-btn">Ver campeão</button>
                </div>
                <div class="cine-confetti">${Array.from({ length: 24 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>`);
            el.id = 'pb-cine-podium';
            const root = this.layer();
            if (reducedMotion()) el.classList.add('cine-rm');
            root.appendChild(el);
            const close = () => { el.classList.add('cine-out'); window.setTimeout(() => el.remove(), 260); };
            el.querySelector('.cine-pod-btn')?.addEventListener('click', close);
            if (this.debugFreezeAt !== null) this.freeze(el, this.debugFreezeAt);
        } catch (e) { console.warn('Cinematics.podium', e); }
    }

    private static statCard(label: string, value: string, detail: string, img: string, pixel = false) {
        return `<div class="cine-stat">
            <div class="cine-stat-img${pixel ? ' is-pixel' : ''}">${imgTag([img], '', label)}</div>
            <div><div class="cine-stat-label">${esc(label)}</div><div class="cine-stat-value">${esc(value)}</div><div class="cine-stat-detail">${esc(detail)}</div></div>
        </div>`;
    }

    // -------------------------------------------------------------- loading
    /** Tela de carregamento com dicas; pré-carrega as imagens da partida. */
    static loading(opts: { minMs?: number; maxMs?: number } = {}): Promise<void> {
        const minMs = opts.minMs ?? 700;
        const maxMs = opts.maxMs ?? 2500;
        try {
            document.getElementById('pb-cine-loading')?.remove();
            const urls = this.matchImages();
            const tips = [...LOADING_TIPS].sort(() => Math.random() - 0.5);
            const el = this.div('cine cine-loading', `
                <div class="cine-load-bg"></div>
                <div class="cine-load-inner">
                    <div class="cine-load-ball"><span></span></div>
                    <div class="cine-load-title">PokéBoard</div>
                    <div class="cine-load-sub">Preparando a aventura...</div>
                    <div class="cine-load-bar"><i></i></div>
                    <div class="cine-load-tip"><b>Dica</b><p>${esc(tips[0])}</p></div>
                </div>`);
            el.id = 'pb-cine-loading';
            const bar = el.querySelector('.cine-load-bar i') as HTMLElement;
            const tipP = el.querySelector('.cine-load-tip p') as HTMLElement;
            const start = performance.now();
            let done = 0;
            const total = Math.max(1, urls.length);
            const setBar = () => { if (bar) bar.style.width = `${Math.round((done / total) * 100)}%`; };
            setBar();
            let ti = 0;
            const tipTimer = window.setInterval(() => {
                ti = (ti + 1) % tips.length;
                if (tipP) { tipP.classList.remove('in'); void tipP.offsetWidth; tipP.textContent = tips[ti]; tipP.classList.add('in'); }
            }, 2200);
            const all = Promise.all(urls.map(u => new Promise<void>(res => {
                const im = new Image();
                const fin = () => { done++; setBar(); res(); };
                im.onload = fin; im.onerror = fin;
                im.src = u;
                window.setTimeout(res, maxMs); // nunca trava
            })));
            const ms = new Promise<void>(res => {
                all.then(() => {
                    const wait = Math.max(0, minMs - (performance.now() - start));
                    window.setTimeout(res, wait + 150);
                });
            });
            const capped = Promise.race([ms, new Promise<void>(res => window.setTimeout(res, maxMs))]);
            const p = this.mount(el, maxMs + 400);
            if (this.debugFreezeAt === null) capped.then(() => { (el as any)._close?.(); });
            p.then(() => window.clearInterval(tipTimer));
            return p;
        } catch (e) { console.warn('Cinematics.loading', e); return Promise.resolve(); }
    }

    private static matchImages(): string[] {
        const set = new Set<string>([
            '/assets/img/Terrenos/Grama.jpg', '/assets/img/Terrenos/Agua.jpg', '/assets/img/Terrenos/Areia.jpg',
            '/assets/img/Terrenos/BarrancoRio.png', '/assets/img/PCMart.jpg', '/assets/img/PokeBolaItem.jpg', '/assets/img/Ginasio.jpg'
        ]);
        try {
            const GS = (window as any).GameState || (window as any).Game || {};
            const gyms: number[] = GS.activeGyms || [];
            gyms.forEach(id => {
                const g = GYM_DATA.find(x => x.id === id);
                if (g) { set.add(`/assets/img/Ginasios/${g.gymImg}`); set.add(`/assets/img/LideresGym/${g.leaderImg}`); }
            });
            (GS.players || []).forEach((p: AnyPlayer) => {
                if (p.avatar) set.add(avatarUrl(p.avatar));
                (p.team || []).forEach((m: AnyMon) => { try { set.add(m.getSprite ? m.getSprite() : `${ART}/${m.id}.png`); } catch { /* */ } });
            });
        } catch { /* */ }
        return [...set];
    }

    /** Fecha qualquer cena aberta (debug/testes). */
    static clear() {
        this.queue = [];
        this.playing = false;
        this.root?.querySelectorAll('.cine').forEach(n => n.remove());
    }
}

(window as any).Cinematics = Cinematics;
