// Itens que o jogador ganhou e ainda não viu na mochila (contador "+N" no botão Mochila do placar).
// Fica em effects.seenItems = { id: quantos ele tinha da última vez que abriu a mochila }, salvo e sincronizado
// junto com o resto do jogador. Novos de um id = o que passou do visto. Sem registro ainda (partida nova ou salva
// antes desta versão), o que ele já tem vira o ponto de partida: o kit inicial não aparece como novo.

type Seen = Record<string, number>;

/** Depois de marcar algo como visto: atualiza o placar e salva (online) para não voltar no próximo refresh. */
export function seenChanged() {
    const G = (window as any).Game;
    G?.updateHUD?.();
    const N = (window as any).Network;
    if (N?.isOnline) N.syncPlayerState?.();
}

/** Quantos de cada item são novos. Se ele gastou ou perdeu itens, baixa o "visto" junto, para o próximo ganho contar. */
export function newItemsOf(player: any): Record<string, number> {
    const out: Record<string, number> = {};
    const items = player?.items || {};
    if (!player) return out;
    if (!player.effects?.seenItems) { markItemsSeen(player); return out; }
    const seen = player.effects.seenItems as Seen;
    Object.keys(items).forEach(id => {
        const have = Math.max(0, items[id] || 0);
        if (seen[id] !== undefined && seen[id] > have) seen[id] = have;
        const fresh = have - (seen[id] || 0);
        if (fresh > 0) out[id] = fresh;
    });
    return out;
}

export function unseenItemsCount(player: any): number {
    return Object.values(newItemsOf(player)).reduce((n, v) => n + v, 0);
}

/** Chamar quando o próprio jogador abre a mochila. Devolve true se havia item novo. */
export function markItemsSeen(player: any): boolean {
    if (!player) return false;
    const changed = !!player.effects?.seenItems && unseenItemsCount(player) > 0;
    player.effects = player.effects || {};
    const seen: Seen = {};
    Object.keys(player.items || {}).forEach(id => { seen[id] = Math.max(0, player.items[id] || 0); });
    player.effects.seenItems = seen;
    return changed;
}

/** Item que o jogador acabou de comprar na loja: ele viu, não precisa de aviso. */
export function markItemSeen(player: any, id: string, amount = 1) {
    const seen = player?.effects?.seenItems as Seen | undefined;
    if (!seen) return;
    seen[id] = (seen[id] || 0) + amount;
}
