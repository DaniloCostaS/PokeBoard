// Peças de marcação reaproveitadas pelas telas secundárias (estilos em src/screens.css).
import { SHOP_ITEMS } from '../../constants';

const hpClass = (cur: number, max: number) => {
    const pct = max > 0 ? (cur / max) * 100 : 0;
    return pct >= 60 ? 'hp-green' : pct >= 15 ? 'hp-yellow' : 'hp-red';
};

export interface MonRowOptions {
    /** Classes extras no contêiner (ex.: is-new, is-selectable) */
    cls?: string;
    /** Mostra HP atual/máx com barra (padrão) ou só o HP máximo */
    hp?: 'bar' | 'max';
    /** Linha de aviso abaixo dos números */
    note?: string;
    /** Selo à direita do nome (ex.: NOVO) */
    badge?: string;
    /** Atributos extras no elemento raiz (ex.: data-*) */
    attrs?: string;
}

export const ScreenKit = {
    /** Linha de Pokémon no estilo do menu de time (pokébola, nome, Lv, HP e atributos). */
    monRow(mon: any, opts: MonRowOptions = {}): string {
        const fainted = typeof mon.isFainted === 'function' ? mon.isFainted() : mon.currentHp <= 0;
        const held = mon.heldItem ? SHOP_ITEMS.find(i => i.id === mon.heldItem) : null;
        const tags = [
            mon.megaStone ? `<img class="pb-monrow-tag" src="/assets/img/megaStone.png" title="Mega Pedra equipada" alt="">` : '',
            held ? `<img class="pb-monrow-tag" src="/assets/img/Itens/${held.icon}" title="Segurando: ${held.name}" alt="">` : '',
            mon.vinculoSupremo ? `<span class="pb-status pb-status--share" title="Vínculo Supremo">VÍNC</span>` : '',
            mon.happiness === 100 ? `<span class="pb-status pb-status--happy" title="Vínculo Afetivo (100% Felicidade)">FELIZ</span>` : ''
        ].join('');
        const hpPct = Math.max(0, Math.min(100, (mon.currentHp / mon.maxHp) * 100));
        const hpHTML = opts.hp === 'max'
            ? `<span><b>HP</b>${mon.maxHp}</span>`
            : '';
        const bar = opts.hp === 'max' ? '' : `
            <div class="pb-hp" title="HP ${mon.currentHp}/${mon.maxHp}">
                <span class="pb-hp-label">HP</span>
                <div class="pb-hp-track"><div class="pb-hp-fill ${hpClass(mon.currentHp, mon.maxHp)}" style="width:${hpPct}%"></div></div>
                <span class="pb-hp-num">${Math.max(0, mon.currentHp)}/${mon.maxHp}</span>
            </div>`;
        const types = typeof mon.getTypeBadgesHTML === 'function' ? `<div class="pb-monrow-types">${mon.getTypeBadgesHTML('flex-start')}</div>` : '';

        return `
            <div class="pb-monrow ${mon.isShiny ? 'is-shiny' : ''} ${fainted ? 'is-fainted' : ''} ${opts.cls || ''}" ${opts.attrs || ''}>
                <div class="pb-monrow-ball"><img src="${mon.getSprite()}" alt="" loading="lazy"></div>
                <div class="pb-monrow-info">
                    <div class="pb-monrow-top">
                        <span class="pb-monrow-name">${mon.name}</span>
                        ${tags}
                        ${opts.badge ? `<span class="pb-status pb-status--new">${opts.badge}</span>` : ''}
                        <span class="pb-monrow-lv">Lv${mon.level}</span>
                    </div>
                    ${types}
                    ${bar}
                    <div class="pb-monrow-stats">${hpHTML}<span><b>ATQ</b>${mon.atk}</span><span><b>DEF</b>${mon.def}</span><span><b>VEL</b>${mon.speed}</span></div>
                    ${opts.note ? `<div class="pb-monrow-note">${opts.note}</div>` : ''}
                </div>
            </div>`;
    },

    /** Face de dado com pontos de pokébola (1–6); acima disso mostra o número. */
    diceFace(value: number): string {
        const map: Record<number, number[]> = {
            1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8]
        };
        const on = map[value];
        if (!on) return `<span class="pb-die-face is-number"><b>${value}</b></span>`;
        const pips = Array.from({ length: 9 }, (_, i) => `<i class="${on.includes(i) ? 'is-on' : ''}"></i>`).join('');
        return `<span class="pb-die-face" data-value="${value}">${pips}</span>`;
    },

    /** Botão "X" padrão do cabeçalho. */
    closeX(onclick: string, label = 'Fechar'): string {
        return `<button type="button" class="pb-icon-btn pb-screen-x" aria-label="${label}" title="${label}" onclick="${onclick}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`;
    },

    /** Botão "voltar" padrão do cabeçalho. */
    backBtn(onclick: string, label = 'Voltar'): string {
        return `<button type="button" class="pb-icon-btn pb-screen-x" aria-label="${label}" title="${label}" onclick="${onclick}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button>`;
    },

    /** Cabeçalho de tela: ícone, rótulo pequeno, título e ações. */
    /** Ícone de pergaminho (missões). */
    QUEST_ICON: '<i class="pb-ico pb-ico-quest"></i>',

    head(opts: { icon: string; kicker?: string; title: string; actions?: string; titleId?: string; iconHTML?: string }): string {
        return `
            <header class="pb-screen-head">
                <span class="pb-screen-icon pb-screen-icon--${opts.icon}" aria-hidden="true">${opts.iconHTML ?? '<i></i><i></i><i></i>'}</span>
                <div class="pb-screen-title">
                    ${opts.kicker ? `<small>${opts.kicker}</small>` : ''}
                    <h3${opts.titleId ? ` id="${opts.titleId}"` : ''}>${opts.title}</h3>
                </div>
                ${opts.actions || ''}
            </header>`;
    }
};
