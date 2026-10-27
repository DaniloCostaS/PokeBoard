import { SHOP_ITEMS } from '../../constants';
import type { ItemData } from '../../constants';

// Mochila no estilo dos jogos Pokémon: bolsos por categoria, grade de espaços e detalhe do item.
// Usada no tabuleiro (GameUI.openInventoryModal) e na batalha (BattleUI.openBag).

type Pocket = { id: string; label: string; icon: string; types: string[] };

export type BackpackOptions = {
    ownerName: string;
    items: Record<string, number>;
    // Diz se o item pode ser usado agora; quando não pode, devolve o motivo para mostrar ao jogador
    usable: (item: ItemData) => { ok: boolean; reason?: string };
    onUse: (key: string, item: ItemData) => void;
    defaultPocket?: string;
    actionLabel?: (item: ItemData) => string;
};

const POCKETS: Pocket[] = [
    { id: 'medicine', label: 'Remédios', icon: 'Pocao.png', types: ['heal', 'revive'] },
    { id: 'balls', label: 'Poké Bolas', icon: 'poke_ball.png', types: ['capture'] },
    { id: 'held', label: 'Para segurar', icon: 'leftovers.png', types: ['hold'] },
    { id: 'special', label: 'Especiais', icon: 'MegaStone.png', types: ['mega', 'boost'] }
];

const SLOTS_MIN = 12;
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
const icon = (file: string) => `/assets/img/Itens/${file}`;

export class Backpack {
    static pocketOf(item: ItemData) {
        return POCKETS.find(p => p.types.includes(item.type))?.id || 'special';
    }

    static render(container: HTMLElement, opts: BackpackOptions) {
        const owned = Object.keys(opts.items)
            .filter(key => opts.items[key] > 0)
            .map(key => ({ key, item: SHOP_ITEMS.find(i => i.id === key), qty: opts.items[key] }))
            .filter((e): e is { key: string; item: ItemData; qty: number } => !!e.item);

        const countIn = (pocket: Pocket) => owned.filter(e => pocket.types.includes(e.item.type)).length;
        let current = opts.defaultPocket && POCKETS.some(p => p.id === opts.defaultPocket) ? opts.defaultPocket : '';
        if (!current || !POCKETS.find(p => p.id === current && countIn(p) > 0)) {
            current = (POCKETS.find(p => countIn(p) > 0) || POCKETS[0]).id;
        }

        container.innerHTML = `
            <div class="pb-bag">
                <header class="pb-bag-head">
                    <div class="pb-bag-art" aria-hidden="true"><span class="pb-bag-flap"></span><span class="pb-bag-buckle"></span><span class="pb-bag-pocket"></span></div>
                    <div class="pb-bag-title">
                        <small>Mochila de</small>
                        <strong>${esc(opts.ownerName)}</strong>
                    </div>
                    <span class="pb-bag-total">${owned.reduce((s, e) => s + e.qty, 0)} itens</span>
                </header>
                <nav class="pb-bag-pockets" role="tablist"></nav>
                <div class="pb-bag-grid" role="listbox" aria-label="Itens do bolso"></div>
                <div class="pb-bag-detail" aria-live="polite"></div>
            </div>`;

        const tabs = container.querySelector('.pb-bag-pockets') as HTMLElement;
        const grid = container.querySelector('.pb-bag-grid') as HTMLElement;
        const detail = container.querySelector('.pb-bag-detail') as HTMLElement;

        const showDetail = (entry: { key: string; item: ItemData; qty: number } | null) => {
            if (!entry) {
                detail.innerHTML = `<p class="pb-bag-empty">${countIn(POCKETS.find(p => p.id === current)!) ? 'Toque num item para ver o que ele faz.' : 'Este bolso está vazio.'}</p>`;
                return;
            }
            const state = opts.usable(entry.item);
            const label = opts.actionLabel ? opts.actionLabel(entry.item) : 'Usar';
            detail.innerHTML = `
                <img class="pb-bag-detail-icon" src="${icon(entry.item.icon)}" alt="">
                <div class="pb-bag-detail-text">
                    <strong>${esc(entry.item.name)} <span>×${entry.qty}</span></strong>
                    <p>${esc(entry.item.desc)}</p>
                    ${state.ok ? '' : `<small class="pb-bag-reason">${esc(state.reason || 'Não dá para usar agora.')}</small>`}
                </div>
                <button type="button" class="btn ${state.ok ? 'btn-roll' : 'btn-secondary'} pb-bag-use" ${state.ok ? '' : 'disabled'}>${esc(label)}</button>`;
            const use = detail.querySelector('.pb-bag-use') as HTMLButtonElement;
            if (state.ok) use.onclick = () => { use.disabled = true; opts.onUse(entry.key, entry.item); };
        };

        const drawPocket = () => {
            const pocket = POCKETS.find(p => p.id === current)!;
            tabs.querySelectorAll('button').forEach(b => {
                const active = b.dataset.pocket === current;
                b.classList.toggle('is-active', active);
                b.setAttribute('aria-selected', String(active));
            });
            const entries = owned.filter(e => pocket.types.includes(e.item.type));
            const slots = Math.max(SLOTS_MIN, Math.ceil(entries.length / 4) * 4);
            grid.innerHTML = '';
            for (let i = 0; i < slots; i++) {
                const entry = entries[i];
                const cell = document.createElement('button');
                cell.type = 'button';
                if (!entry) {
                    cell.className = 'pb-bag-slot is-empty';
                    cell.disabled = true;
                    cell.setAttribute('aria-hidden', 'true');
                    grid.appendChild(cell);
                    continue;
                }
                const state = opts.usable(entry.item);
                cell.className = `pb-bag-slot${state.ok ? '' : ' is-locked'}`;
                cell.setAttribute('role', 'option');
                cell.setAttribute('aria-label', `${entry.item.name}, ${entry.qty} unidades`);
                cell.innerHTML = `<img src="${icon(entry.item.icon)}" alt="" draggable="false"><span class="pb-bag-qty">${entry.qty}</span>`;
                cell.addEventListener('click', () => {
                    grid.querySelectorAll('.pb-bag-slot.is-selected').forEach(n => n.classList.remove('is-selected'));
                    cell.classList.add('is-selected');
                    cell.setAttribute('aria-selected', 'true');
                    showDetail(entry);
                });
                grid.appendChild(cell);
            }
            const first = grid.querySelector('.pb-bag-slot:not(.is-empty)') as HTMLElement | null;
            if (first) first.click();
            else showDetail(null);
        };

        POCKETS.forEach(pocket => {
            const b = document.createElement('button');
            b.type = 'button';
            b.dataset.pocket = pocket.id;
            b.setAttribute('role', 'tab');
            const n = countIn(pocket);
            b.innerHTML = `<img src="${icon(pocket.icon)}" alt=""><span>${pocket.label}</span>${n ? `<em>${n}</em>` : ''}`;
            b.addEventListener('click', () => { current = pocket.id; drawPocket(); });
            tabs.appendChild(b);
        });

        drawPocket();
    }
}
