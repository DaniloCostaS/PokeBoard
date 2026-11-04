import { POKEDEX } from '../../constants/pokedex';
import { TYPE_CHART } from '../../constants/typeChart';
import { MAPA_MEGAS } from '../../constants/mapaMegas';
import type { PokemonData } from '../../constants/types';
import { GameState } from '../game/GameState';
import { GameDialog } from './GameDialog';
import { GameFeel } from './GameFeel';
import { TYPE_COLORS, TYPE_ICONS } from './TypeTooltip';

type Entry = { mon: PokemonData; seen: number; caught: number; defeated: number; search: string };
type Status = 'all' | 'seen' | 'caught' | 'defeated' | 'unseen' | 'uncaught';

const STATUS_LABELS: [Status, string][] = [
    ['all', 'Todos'], ['seen', 'Vistos'], ['caught', 'Capturados'], ['defeated', 'Derrotados'],
    ['unseen', 'Não vistos'], ['uncaught', 'Não capturados'],
];
const GEN_LIMITS = [151, 251, 386, 493, 649, 721, 809, 905];
const MEGA_GEN = 0;
const STATS: [keyof PokemonData, string][] = [['hp', 'HP'], ['atk', 'Ataque'], ['def', 'Defesa'], ['spd', 'Velocidade']];

// Medidas da lista virtualizada (iguais às de .pb-dex-tile em pokedex.css)
const ROW_HEIGHT = 136;
const TILE_MIN = 104;
const TILE_GAP = 8;
const ROW_BUFFER = 2;
const MAX_CACHED_TILES = 240;

const genOf = (id: number) => {
    if (id >= 10000) return MEGA_GEN;
    const i = GEN_LIMITS.findIndex(limit => id <= limit);
    return i < 0 ? 9 : i + 1;
};
const fold = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const esc = (v: unknown) => String(v ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c] || c));
const sprite = (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const numberLabel = (id: number) => id >= 10000 ? 'Mega' : `#${String(id).padStart(4, '0')}`;
const typeTag = (type: string, extra = '') => `<span class="poke-type-badge pkmn-type-tag" data-type="${type}" style="background:${TYPE_COLORS[type] || '#777'}">${type}${extra}</span>`;

const BY_ID = new Map(POKEDEX.map(mon => [mon.id, mon]));
const BY_NAME = new Map(POKEDEX.map(mon => [mon.name, mon]));
const PREVIOUS = new Map(POKEDEX.filter(mon => mon.nextForm).map(mon => [mon.nextForm as string, mon]));
const MEGA_BASE = new Map(Object.entries(MAPA_MEGAS).map(([base, mega]) => [mega, Number(base)]));
const STAT_MAX = Math.max(...POKEDEX.flatMap(mon => [mon.hp, mon.atk, mon.def, mon.spd]));

// Mesma regra de dano das batalhas: 1.75x por fraqueza e 0.75x por resistência, multiplicando entre os dois tipos
function matchups(mon: PokemonData) {
    const weak: { type: string; multi: number }[] = [];
    const resist: { type: string; multi: number }[] = [];
    const defenders = [mon.type, mon.secondType].filter(Boolean);
    for (const attacker of Object.keys(TYPE_CHART)) {
        let factor = 1;
        defenders.forEach(defender => {
            const value = (TYPE_CHART[attacker] as any)?.[defender];
            if (value > 1) factor *= 1.75;
            else if (value < 1) factor *= 0.75;
        });
        const item = { type: attacker, multi: Number(factor.toFixed(2)) };
        if (factor > 1) weak.push(item);
        if (factor < 1) resist.push(item);
    }
    weak.sort((a, b) => b.multi - a.multi);
    resist.sort((a, b) => a.multi - b.multi);
    return { weak, resist };
}

/**
 * POKÉDEX DA PARTIDA
 * A lista é virtualizada: só existem no DOM os Pokémon visíveis (mais uma folga), e os detalhes
 * são montados apenas para o selecionado. Assim, abrir e filtrar não dependem do tamanho da Pokédex.
 */
export class PokedexScreen {
    private static root: HTMLElement;
    private static scroller: HTMLElement;
    private static sizer: HTMLElement;
    private static windowEl: HTMLElement;
    private static detail: HTMLElement;
    private static counter: HTMLElement;

    private static pool: Entry[] = [];
    private static visible: Entry[] = [];
    private static selectedId: number | null = null;
    private static tiles = new Map<number, HTMLButtonElement>();
    private static columns = 1;
    private static first = -1;
    private static last = -1;
    private static frame = 0;
    private static resizeWatcher: ResizeObserver | null = null;
    private static keysReady = false;
    private static opener: HTMLElement | null = null;

    private static query = '';
    private static status: Status = 'all';
    private static typeFilter = '';
    private static genFilter = -1;

    private static get modal() { return document.getElementById('pokedex-modal')!; }
    private static get isOpen() { return this.modal.style.display === 'flex'; }
    private static get isCompact() { return window.matchMedia('(max-width: 820px)').matches; }

    static open(playerId: number, focusId: number | null = null) {
        const player = GameState.players[playerId];
        if (!player) return;

        GameFeel.vibrate([15]);
        this.opener = document.activeElement as HTMLElement | null;
        this.pool = this.buildPool(player, focusId);
        this.query = '';
        this.status = 'all';
        this.typeFilter = '';
        this.genFilter = -1;
        this.selectedId = null;
        this.tiles.clear();
        this.first = this.last = -1;

        this.modal.style.display = 'flex';
        this.renderShell(player.name);
        this.bindKeys();
        this.applyFilters();

        const initial = focusId !== null ? BY_ID.get(focusId) : (this.isCompact ? null : this.visible[0]?.mon);
        if (initial) this.select(initial.id, { showDetail: focusId !== null, reveal: true });
        else this.renderDetail();

        // Com teclado, as setas já funcionam ao abrir. No celular não abre o teclado virtual à toa.
        if (!this.isCompact) (this.tiles.get(this.selectedId ?? -1) || this.scroller).focus({ preventScroll: true });
    }

    static close() {
        this.modal.style.display = 'none';
        if (this.opener?.isConnected) this.opener.focus({ preventScroll: true });
        this.opener = null;
    }

    private static buildPool(player: any, focusId: number | null): Entry[] {
        const settings = GameState.settings;
        const pool: Entry[] = [];
        for (const mon of POKEDEX) {
            if (settings && mon.id !== focusId) {
                const gen = genOf(mon.id);
                if (gen > 0 && !settings.generations.includes(gen)) continue;
                if (mon.id >= 10000 && !settings.megas) continue;
                if (settings.legendaries === 'no' && mon.isLegendary) continue;
                if (settings.legendaries === 'only' && !mon.isLegendary) continue;
            }
            const data = player.pokedexData?.[mon.id] || {};
            pool.push({ mon, seen: data.seen || 0, caught: data.caught || 0, defeated: data.defeated || 0, search: fold(`${mon.name} ${mon.id}`) });
        }
        return pool;
    }

    private static renderShell(playerName: string) {
        const discovered = this.pool.filter(e => e.seen > 0 || e.caught > 0).length;
        const caught = this.pool.filter(e => e.caught > 0).length;
        const total = this.pool.length;
        const gens = [...new Set(this.pool.map(e => genOf(e.mon.id)))].sort((a, b) => (a || 99) - (b || 99));
        const genSelect = gens.length > 1 ? `<select id="pb-dex-gen" aria-label="Filtrar por geração">
                <option value="-1">Gerações</option>
                ${gens.map(g => `<option value="${g}">${g === MEGA_GEN ? 'Megas' : `Geração ${g}`}</option>`).join('')}
            </select>` : '';

        this.root = document.getElementById('pokedex-root')!;
        this.root.innerHTML = `
            <header class="pb-dex-head">
                <span class="pb-dex-lens" aria-hidden="true"></span>
                <span class="pb-dex-leds" aria-hidden="true"><i></i><i></i><i></i></span>
                <div class="pb-dex-title"><h3 id="pb-dex-title">Pokédex</h3><small>Registro de ${esc(playerName)}</small></div>
                <div class="pb-dex-progress">
                    <div><span>Vistos</span><b>${discovered}<i>/${total}</i></b><i class="pb-dex-bar" style="--p:${total ? (discovered / total) * 100 : 0}%"></i></div>
                    <div class="is-caught"><span>Capturados</span><b>${caught}<i>/${total}</i></b><i class="pb-dex-bar" style="--p:${total ? (caught / total) * 100 : 0}%"></i></div>
                </div>
                <button type="button" class="pb-dex-close" data-close aria-label="Fechar Pokédex">✕</button>
            </header>
            <div class="pb-dex-body">
                <section class="pb-dex-browser" aria-label="Lista de Pokémon">
                    <div class="pb-dex-filters">
                        <div class="pb-dex-search-row">
                            <label class="pb-dex-search"><span aria-hidden="true">⌕</span><input type="search" id="pokedex-search" placeholder="Nome ou número" aria-label="Buscar Pokémon por nome ou número" autocomplete="off"></label>
                            ${genSelect}
                        </div>
                        <div class="pb-dex-chips" role="group" aria-label="Filtrar por situação">
                            ${STATUS_LABELS.map(([id, label]) => `<button type="button" class="pb-dex-chip" data-status="${id}" aria-pressed="${id === 'all'}">${label}</button>`).join('')}
                        </div>
                        <div class="pb-dex-types" role="group" aria-label="Filtrar por tipo">
                            ${Object.keys(TYPE_COLORS).map(type => `<button type="button" class="pb-dex-typebtn" data-filter-type="${type}" style="--c:${TYPE_COLORS[type]}" title="${type}" aria-label="Tipo ${type}" aria-pressed="false">${TYPE_ICONS[type]}</button>`).join('')}
                        </div>
                        <p class="pb-dex-count" id="pb-dex-count" aria-live="polite"></p>
                    </div>
                    <div class="pb-dex-scroller" id="pb-dex-scroller" tabindex="-1">
                        <div class="pb-dex-sizer" id="pb-dex-sizer"><div class="pb-dex-window" id="pb-dex-window"></div></div>
                        <div class="pb-dex-empty" id="pb-dex-empty" hidden><strong>Nenhum Pokémon encontrado</strong><span>Tente outro nome ou limpe os filtros.</span></div>
                    </div>
                </section>
                <section class="pb-dex-detail" id="pb-dex-detail" aria-label="Detalhes do Pokémon"></section>
            </div>`;

        this.scroller = this.root.querySelector('#pb-dex-scroller')!;
        this.sizer = this.root.querySelector('#pb-dex-sizer')!;
        this.windowEl = this.root.querySelector('#pb-dex-window')!;
        this.detail = this.root.querySelector('#pb-dex-detail')!;
        this.counter = this.root.querySelector('#pb-dex-count')!;
        this.root.classList.remove('is-detail');
        this.bindShell();
    }

    private static bindShell() {
        this.root.querySelector('[data-close]')!.addEventListener('click', () => this.close());
        this.scroller.addEventListener('scroll', () => this.schedulePaint(), { passive: true });
        this.scroller.addEventListener('keydown', e => this.onGridKey(e));
        this.windowEl.addEventListener('click', e => {
            const tile = (e.target as HTMLElement).closest<HTMLElement>('[data-id]');
            if (tile) this.select(Number(tile.dataset.id), { showDetail: true });
        });
        // Sprite que não existe no repositório: mostra só a marca da Poké Bola do cartão
        this.root.addEventListener('error', e => {
            const img = e.target as HTMLElement;
            if (img.tagName === 'IMG') img.classList.add('is-missing');
        }, true);
        (this.root.querySelector('#pokedex-search') as HTMLInputElement).addEventListener('input', e => {
            this.query = fold((e.target as HTMLInputElement).value.trim().replace(/^#/, ''));
            this.applyFilters();
        });
        this.root.querySelectorAll<HTMLButtonElement>('[data-status]').forEach(button => button.addEventListener('click', () => {
            this.status = button.dataset.status as Status;
            this.root.querySelectorAll('[data-status]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
            this.applyFilters();
        }));
        this.root.querySelectorAll<HTMLButtonElement>('[data-filter-type]').forEach(button => button.addEventListener('click', () => {
            const type = button.dataset.filterType!;
            this.typeFilter = this.typeFilter === type ? '' : type;
            this.root.querySelectorAll<HTMLElement>('[data-filter-type]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filterType === this.typeFilter)));
            this.applyFilters();
        }));
        this.root.querySelector('#pb-dex-gen')?.addEventListener('change', e => {
            this.genFilter = Number((e.target as HTMLSelectElement).value);
            this.applyFilters();
        });
        this.detail.addEventListener('click', e => {
            const target = e.target as HTMLElement;
            const goto = target.closest<HTMLElement>('[data-goto]');
            if (goto) return this.select(Number(goto.dataset.goto), { showDetail: true, reveal: true });
            if (target.closest('[data-back]')) this.root.classList.remove('is-detail');
        });

        if (!this.resizeWatcher) this.resizeWatcher = new ResizeObserver(() => this.onResize());
        this.resizeWatcher.disconnect();
        this.resizeWatcher.observe(this.scroller);
    }

    private static bindKeys() {
        if (this.keysReady) return;
        this.keysReady = true;
        document.addEventListener('keydown', e => {
            if (e.key !== 'Escape' || !this.isOpen || GameDialog.isOpen()) return;
            if (this.isCompact && this.root.classList.contains('is-detail')) this.root.classList.remove('is-detail');
            else this.close();
        });
    }

    private static matches(entry: Entry): boolean {
        const { mon, seen, caught, defeated } = entry;
        if (this.query && !entry.search.includes(this.query)) return false;
        if (this.typeFilter && mon.type !== this.typeFilter && mon.secondType !== this.typeFilter) return false;
        if (this.genFilter >= 0 && genOf(mon.id) !== this.genFilter) return false;
        switch (this.status) {
            case 'seen': return seen > 0;
            case 'caught': return caught > 0;
            case 'defeated': return defeated > 0;
            case 'unseen': return seen === 0;
            case 'uncaught': return caught === 0;
            default: return true;
        }
    }

    private static applyFilters() {
        this.visible = this.pool.filter(entry => this.matches(entry));
        const n = this.visible.length;
        this.counter.textContent = n === 1 ? '1 Pokémon' : `${n.toLocaleString('pt-BR')} Pokémon`;
        (this.root.querySelector('#pb-dex-empty') as HTMLElement).hidden = n > 0;
        this.scroller.scrollTop = 0;
        this.layout();
        // Desktop mantém o painel de detalhes preenchido: o selecionado saiu da lista, passa para o primeiro
        if (!this.isCompact && n > 0 && !this.visible.some(e => e.mon.id === this.selectedId)) {
            this.select(this.visible[0].mon.id, { showDetail: false });
        }
    }

    private static onResize() {
        if (!this.isOpen || !this.scroller?.clientWidth) return;
        this.layout();
    }

    private static layout() {
        const width = this.scroller.clientWidth;
        this.columns = Math.max(1, Math.floor((width + TILE_GAP) / (TILE_MIN + TILE_GAP)));
        this.windowEl.style.gridTemplateColumns = `repeat(${this.columns}, minmax(0, 1fr))`;
        this.sizer.style.height = `${Math.ceil(this.visible.length / this.columns) * ROW_HEIGHT}px`;
        this.paint(true);
    }

    private static schedulePaint() {
        if (this.frame) return;
        this.frame = requestAnimationFrame(() => { this.frame = 0; this.paint(); });
    }

    private static paint(force = false) {
        const top = this.scroller.scrollTop;
        const first = Math.max(0, Math.floor(top / ROW_HEIGHT) - ROW_BUFFER);
        const last = Math.ceil((top + this.scroller.clientHeight) / ROW_HEIGHT) + ROW_BUFFER;
        if (!force && first === this.first && last === this.last) return;
        this.first = first;
        this.last = last;

        const slice = this.visible.slice(first * this.columns, last * this.columns);
        const hadFocus = this.windowEl.contains(document.activeElement);
        // Reaproveita os cartões já criados: mover o elemento não baixa a imagem de novo
        const elements = slice.map(entry => this.tiles.get(entry.mon.id) || this.createTile(entry));
        this.windowEl.style.transform = `translateY(${first * ROW_HEIGHT}px)`;
        this.windowEl.replaceChildren(...elements);
        if (hadFocus && this.selectedId !== null) this.tiles.get(this.selectedId)?.focus({ preventScroll: true });

        if (this.tiles.size > MAX_CACHED_TILES) {
            const keep = new Set(slice.map(entry => entry.mon.id));
            for (const id of this.tiles.keys()) {
                if (this.tiles.size <= MAX_CACHED_TILES) break;
                if (!keep.has(id)) this.tiles.delete(id);
            }
        }
    }

    private static createTile({ mon, seen, caught }: Entry): HTMLButtonElement {
        const tile = document.createElement('button');
        const known = seen > 0 || caught > 0;
        tile.type = 'button';
        tile.className = `pb-dex-tile${known ? '' : ' is-unknown'}${caught > 0 ? ' is-caught' : ''}${mon.isLegendary ? ' is-legend' : ''}${mon.id === this.selectedId ? ' is-selected' : ''}`;
        tile.dataset.id = String(mon.id);
        tile.style.setProperty('--c1', TYPE_COLORS[mon.type] || '#777');
        tile.style.setProperty('--c2', TYPE_COLORS[mon.secondType] || TYPE_COLORS[mon.type] || '#777');
        tile.setAttribute('aria-label', `${numberLabel(mon.id)} ${mon.name}${caught > 0 ? ', capturado' : known ? ', visto' : ', não visto'}`);
        tile.innerHTML = `<span class="pb-dex-no">${numberLabel(mon.id)}</span>
            <img src="${sprite(mon.id)}" alt="" width="72" height="72" decoding="async" draggable="false">
            <b>${esc(mon.name)}</b>`;
        this.tiles.set(mon.id, tile);
        return tile;
    }

    private static select(id: number, opts: { showDetail: boolean; reveal?: boolean }) {
        if (this.selectedId !== null) this.tiles.get(this.selectedId)?.classList.remove('is-selected');
        this.selectedId = id;
        this.tiles.get(id)?.classList.add('is-selected');
        this.renderDetail();
        if (opts.showDetail && this.isCompact) this.root.classList.add('is-detail');
        if (opts.reveal) this.revealSelected();
    }

    private static revealSelected() {
        const index = this.visible.findIndex(e => e.mon.id === this.selectedId);
        if (index < 0) return;
        const row = Math.floor(index / this.columns);
        const top = row * ROW_HEIGHT;
        const viewTop = this.scroller.scrollTop;
        const viewHeight = this.scroller.clientHeight;
        if (top < viewTop) this.scroller.scrollTop = top;
        else if (top + ROW_HEIGHT > viewTop + viewHeight) this.scroller.scrollTop = top + ROW_HEIGHT - viewHeight;
        this.paint(true);
    }

    private static onGridKey(e: KeyboardEvent) {
        const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -this.columns, ArrowDown: this.columns };
        const step = steps[e.key];
        if (!step || !this.visible.length) return;
        e.preventDefault();
        const index = this.visible.findIndex(entry => entry.mon.id === this.selectedId);
        const next = this.visible[Math.min(this.visible.length - 1, Math.max(0, (index < 0 ? 0 : index + step)))];
        this.select(next.mon.id, { showDetail: false, reveal: true });
        this.tiles.get(next.mon.id)?.focus({ preventScroll: true });
    }

    private static linkTo(id: number | undefined, caption: string): string {
        const mon = id !== undefined ? BY_ID.get(id) : undefined;
        if (!mon) return '';
        const inner = `<img src="${sprite(mon.id)}" alt="" width="44" height="44"><span><small>${caption}</small><b>${esc(mon.name)}</b></span>`;
        return this.pool.some(entry => entry.mon.id === mon.id)
            ? `<button type="button" class="pb-dex-evo" data-goto="${mon.id}">${inner}</button>`
            : `<div class="pb-dex-evo">${inner}</div>`;
    }

    private static renderDetail() {
        const entry = this.pool.find(e => e.mon.id === this.selectedId);
        if (!entry) {
            this.detail.innerHTML = `<div class="pb-dex-placeholder"><span aria-hidden="true"></span><strong>Escolha um Pokémon</strong></div>`;
            return;
        }
        const { mon, seen, caught, defeated } = entry;
        const known = seen > 0 || caught > 0;
        const { weak, resist } = matchups(mon);
        const color = TYPE_COLORS[mon.type] || '#777';

        const index = this.visible.findIndex(e => e.mon.id === mon.id);
        const prevEntry = index > 0 ? this.visible[index - 1] : null;
        const nextEntry = index >= 0 && index < this.visible.length - 1 ? this.visible[index + 1] : null;

        const previous = PREVIOUS.get(mon.name);
        const next = mon.nextForm ? BY_NAME.get(mon.nextForm) : undefined;
        const megaId = MAPA_MEGAS[mon.id];
        const megaBase = MEGA_BASE.get(mon.id);
        const evolutionLinks = [
            previous ? this.linkTo(previous.id, `Evolui de (Lv.${previous.evoTrigger ?? '?'})`) : '',
            next ? this.linkTo(next.id, `Evolui para (Lv.${mon.evoTrigger ?? '?'})`) : '',
            megaBase !== undefined ? this.linkTo(megaBase, 'Forma base') : '',
            megaId ? this.linkTo(megaId, 'Mega Evolução') : '',
        ].filter(Boolean).join('');

        const list = (items: { type: string; multi: number }[], empty: string) => items.length
            ? `<div class="pb-dex-tags">${items.map(t => typeTag(t.type, `<i class="pb-dex-multi">${t.multi}x</i>`)).join('')}</div>`
            : `<p class="pb-dex-none">${empty}</p>`;

        const chips = [
            mon.isLegendary ? '<span class="pb-dex-flag is-legend">Lendário</span>' : '',
            mon.id >= 10000 ? '<span class="pb-dex-flag is-mega">Mega</span>' : '',
            caught > 0 ? '<span class="pb-dex-flag is-caught">Capturado</span>' : (known ? '<span class="pb-dex-flag">Visto</span>' : '<span class="pb-dex-flag is-unknown">Não visto</span>'),
        ].join('');

        this.detail.style.setProperty('--dex-c', color);
        this.detail.innerHTML = `
            <div class="pb-dex-detail-bar">
                <button type="button" class="pb-dex-back" data-back>‹ Lista</button>
                <div class="pb-dex-nav">
                    <button type="button" data-goto="${prevEntry?.mon.id ?? ''}" aria-label="Pokémon anterior"${prevEntry ? '' : ' disabled'}>‹</button>
                    <button type="button" data-goto="${nextEntry?.mon.id ?? ''}" aria-label="Próximo Pokémon"${nextEntry ? '' : ' disabled'}>›</button>
                </div>
            </div>
            <div class="pb-dex-hero${known ? '' : ' is-unknown'}">
                <span class="pb-dex-hero-no">${numberLabel(mon.id)}</span>
                <img src="${sprite(mon.id)}" alt="${known ? esc(mon.name) : ''}" width="168" height="168" draggable="false">
            </div>
            <div class="pb-dex-identity">
                <h4>${esc(mon.name)}</h4>
                <div class="pb-dex-tags">${typeTag(mon.type)}${mon.secondType ? typeTag(mon.secondType) : ''}</div>
                <div class="pb-dex-flags">${chips}</div>
            </div>
            <dl class="pb-dex-track">
                <div class="is-seen"><dt>Vistos</dt><dd>${seen}</dd></div>
                <div class="is-defeated"><dt>Derrotados</dt><dd>${defeated}</dd></div>
                <div class="is-caught"><dt>Capturados</dt><dd>${caught}</dd></div>
            </dl>
            <section class="pb-dex-block">
                <h5>Atributos base <span>Total ${mon.BaseTotal || mon.hp + mon.atk + mon.def + mon.spd}</span></h5>
                <div class="pb-dex-stats">${STATS.map(([key, label]) => {
                    const value = Number(mon[key]);
                    return `<div><span>${label}</span><b>${value}</b><i><u style="width:${Math.round((value / STAT_MAX) * 100)}%"></u></i></div>`;
                }).join('')}</div>
            </section>
            <section class="pb-dex-block"><h5 class="is-weak">Fraquezas</h5>${list(weak, 'Nenhuma fraqueza')}</section>
            <section class="pb-dex-block"><h5 class="is-resist">Resistências</h5>${list(resist, 'Nenhuma resistência')}</section>
            <section class="pb-dex-block"><h5>Evolução</h5>${evolutionLinks ? `<div class="pb-dex-evos">${evolutionLinks}</div>` : '<p class="pb-dex-none">Não evolui</p>'}</section>`;
        this.detail.scrollTop = 0;
    }
}
