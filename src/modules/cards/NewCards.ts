import { GameState } from '../game/GameState';

// Cartas que o jogador ganhou na rodada atual (tag "NOVO").
// Fica em effects.newCards, que já é salvo e sincronizado com o resto do jogador:
// { r: rodada, add: { id: quantas chegaram }, base: { id: quantas ele já tinha antes da primeira chegar } }
// Novas de um id = o que passou da base (no máximo o que chegou). Se ele usar uma carta desse id, a contagem cai junto,
// então uma cópia antiga nunca aparece como nova.
// seen: { id: quantas das que chegaram ele já viu na mão } — o contador do card no placar só conta as que ainda não viu;
// a etiqueta NOVO na mão continua até o fim da rodada.

type NewCardsState = { r: number; add: Record<string, number>; base: Record<string, number>; seen?: Record<string, number> };

const countOf = (cards: any[], id: string) => cards.reduce((n, c) => n + (c && c.id === id ? 1 : 0), 0);

/** Chamar logo depois de colocar as cartas na mão. */
export function markNewCards(player: any, cards: any[]) {
    if (!player || !cards || cards.length === 0) return;
    player.effects = player.effects || {};
    const cur = player.effects.newCards as NewCardsState | undefined;
    const st: NewCardsState = cur && cur.r === GameState.round && cur.add && cur.base
        ? { r: cur.r, add: { ...cur.add }, base: { ...cur.base }, seen: { ...(cur.seen || {}) } }
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

const currentState = (player: any): NewCardsState | null => {
    const st = player?.effects?.newCards as NewCardsState | undefined;
    if (!st || st.r !== GameState.round || !st.add || !st.base || !Array.isArray(player.cards)) return null;
    return st;
};

// Quantas cópias de cada id ainda contam como novas na mão
const freshPerId = (player: any, st: NewCardsState) => {
    const want: Record<string, number> = {};
    Object.keys(st.add).forEach(id => {
        want[id] = Math.max(0, Math.min(st.add[id] || 0, countOf(player.cards, id) - (st.base[id] || 0)));
    });
    return want;
};

/** Objetos da mão que contam como novos (as cópias mais recentes de cada id, que ficam no fim da mão). */
export function newCardsOf(player: any): Set<any> {
    const out = new Set<any>();
    const st = currentState(player);
    if (!st) return out;
    const want = freshPerId(player, st);
    for (let i = player.cards.length - 1; i >= 0; i--) {
        const c = player.cards[i];
        if (c && want[c.id] > 0) { out.add(c); want[c.id]--; }
    }
    return out;
}

/** Cartas novas que o jogador ainda não viu na mão (contador do card no placar). */
export function unseenNewCards(player: any): number {
    const st = currentState(player);
    if (!st) return 0;
    const want = freshPerId(player, st);
    const seen = st.seen || {};
    return Object.keys(want).reduce((n, id) => n + Math.min(want[id], Math.max(0, (st.add[id] || 0) - (seen[id] || 0))), 0);
}

/** Chamar quando o próprio jogador abre a mão. Devolve true se havia carta nova ainda não vista. */
export function markCardsSeen(player: any): boolean {
    if (unseenNewCards(player) === 0) return false;
    const st = player.effects.newCards as NewCardsState;
    st.seen = { ...st.add };
    return true;
}
