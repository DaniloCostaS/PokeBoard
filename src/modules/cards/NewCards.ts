import { GameState } from '../game/GameState';

// Cartas que o jogador ganhou na rodada atual (tag "NOVO").
// Fica em effects.newCards, que já é salvo e sincronizado com o resto do jogador: { r: rodada, ids: [ids na ordem em que chegaram] }

export function markNewCards(player: any, cards: any[]) {
    if (!player || !cards || cards.length === 0) return;
    player.effects = player.effects || {};
    const cur = player.effects.newCards;
    const ids: string[] = cur && cur.r === GameState.round && Array.isArray(cur.ids) ? [...cur.ids] : [];
    cards.forEach(c => { if (c && c.id) ids.push(c.id); });
    player.effects.newCards = { r: GameState.round, ids };
}

/** Objetos da mão que contam como novos. As cartas entram no fim da mão, então as cópias mais recentes de cada id são as novas. */
export function newCardsOf(player: any): Set<any> {
    const out = new Set<any>();
    const nc = player?.effects?.newCards;
    if (!nc || nc.r !== GameState.round || !Array.isArray(nc.ids) || !Array.isArray(player.cards)) return out;
    const want: Record<string, number> = {};
    nc.ids.forEach((id: string) => { want[id] = (want[id] || 0) + 1; });
    for (let i = player.cards.length - 1; i >= 0; i--) {
        const c = player.cards[i];
        if (c && want[c.id] > 0) { out.add(c); want[c.id]--; }
    }
    return out;
}
