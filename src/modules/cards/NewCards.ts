import { GameState } from '../game/GameState';

// Cartas que o jogador ganhou na rodada atual (tag "NOVO").
// Fica em effects.newCards, que já é salvo e sincronizado com o resto do jogador:
// { r: rodada, add: { id: quantas chegaram }, base: { id: quantas ele já tinha antes da primeira chegar } }
// Novas de um id = o que passou da base (no máximo o que chegou). Se ele usar uma carta desse id, a contagem cai junto,
// então uma cópia antiga nunca aparece como nova.

type NewCardsState = { r: number; add: Record<string, number>; base: Record<string, number> };

const countOf = (cards: any[], id: string) => cards.reduce((n, c) => n + (c && c.id === id ? 1 : 0), 0);

/** Chamar logo depois de colocar as cartas na mão. */
export function markNewCards(player: any, cards: any[]) {
    if (!player || !cards || cards.length === 0) return;
    player.effects = player.effects || {};
    const cur = player.effects.newCards as NewCardsState | undefined;
    const st: NewCardsState = cur && cur.r === GameState.round && cur.add && cur.base
        ? { r: cur.r, add: { ...cur.add }, base: { ...cur.base } }
        : { r: GameState.round, add: {}, base: {} };
    const arrived: Record<string, number> = {};
    cards.forEach(c => { if (c && c.id) arrived[c.id] = (arrived[c.id] || 0) + 1; });
    Object.entries(arrived).forEach(([id, k]) => {
        if (st.add[id] === undefined) {
            st.base[id] = Math.max(0, countOf(player.cards || [], id) - k);
            st.add[id] = k;
        } else {
            st.add[id] += k;
        }
    });
    player.effects.newCards = st;
}

/** Objetos da mão que contam como novos (as cópias mais recentes de cada id, que ficam no fim da mão). */
export function newCardsOf(player: any): Set<any> {
    const out = new Set<any>();
    const st = player?.effects?.newCards as NewCardsState | undefined;
    if (!st || st.r !== GameState.round || !st.add || !st.base || !Array.isArray(player.cards)) return out;
    const want: Record<string, number> = {};
    Object.keys(st.add).forEach(id => {
        want[id] = Math.max(0, Math.min(st.add[id] || 0, countOf(player.cards, id) - (st.base[id] || 0)));
    });
    for (let i = player.cards.length - 1; i >= 0; i--) {
        const c = player.cards[i];
        if (c && want[c.id] > 0) { out.add(c); want[c.id]--; }
    }
    return out;
}
