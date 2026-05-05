import { CARDS_DB } from '../../constants';
import type { Player } from '../../models/Player';

export class CardManager {
    static getRarityWeight(rarity: string): number {
        switch (rarity) {
            case 'Comum': return 1;
            case 'Incomum': return 2;
            case 'Rara': return 3;
            case 'Épica': return 5;
            case 'Lendária': return 10;
            default: return 1;
        }
    }

    static draw(player: Player, silentLog: boolean = false) {
        const Game = (window as any).Game;
        const Network = (window as any).Network;

        const resultChance = Math.floor(Math.random() * 100) + 1;
        let targetRarity = 'Comum';

        const canGetLegendary = (!player.effects || !player.effects.playedLegendary) && !player.cards.some((c: any) => c.rarity === 'Lendária');

        if (canGetLegendary && resultChance <= 1) targetRarity = 'Lendária';
        else if (resultChance <= 8) targetRarity = 'Épica';
        else if (resultChance <= 26) targetRarity = 'Rara';
        else if (resultChance <= 54) targetRarity = 'Incomum';

        const possibleCards = CARDS_DB.filter(c => c.rarity === targetRarity);
        const finalPool = possibleCards.length > 0 ? possibleCards : CARDS_DB;
        const card = finalPool[Math.floor(Math.random() * finalPool.length)];

        player.cards.push(card);

        if (!silentLog) {
            const isMe = !Network.isOnline || player.id === Network.myPlayerId;
            if (isMe) {
                Game.log(`🃏 Você obteve a carta: ${card.icon} ${card.name}`);
                if (Network.isOnline) {
                    Network.sendAction('LOG', { msg: `🃏 ${player.name} obteve uma Carta Misteriosa!` });
                }
            }
        }

        Game.updateHUD();
        if (Network.isOnline) Network.syncPlayerState();

        return card;
    }

    static async confirmSacrifice() {
        const Game = (window as any).Game;
        const Network = (window as any).Network;
        const player = Game.getCurrentPlayer();

        const checkboxes = document.querySelectorAll('.sacrifice-checkbox:checked');
        if (checkboxes.length !== 2) return alert("Você deve selecionar EXATAMENTE 2 cartas.");

        const indicesToRemove: number[] = [];
        checkboxes.forEach((cb: any) => indicesToRemove.push(parseInt(cb.getAttribute('data-index'))));
        indicesToRemove.sort((a, b) => b - a);

        const removedIds: string[] = [];
        const removedNames: string[] = [];
        const removedRarities: string[] = [];

        indicesToRemove.forEach(idx => {
            if (player.cards[idx]) {
                removedIds.push(player.cards[idx].id);
                removedNames.push(player.cards[idx].name);
                removedRarities.push(player.cards[idx].rarity);
                player.cards.splice(idx, 1);
            }
        });

        const validPool = CARDS_DB.filter((c: any) => c.id !== 'master');
        let targetRarity: string | undefined = undefined;

        if (removedRarities.length === 2 && removedRarities[0] === 'Épica' && removedRarities[1] === 'Épica') {
            targetRarity = 'Épica';
        }

        if (!targetRarity) {
            const roll = Math.floor(Math.random() * 100) + 1;
            if (roll <= 8) targetRarity = 'Épica';
            else if (roll <= 26) targetRarity = 'Rara';
            else if (roll <= 54) targetRarity = 'Incomum';
            else targetRarity = 'Comum';
        }

        const possibleCards = validPool.filter((c: any) => c.rarity === targetRarity);
        let finalPool = possibleCards.length > 0 ? possibleCards : validPool;
        const filteredPool = finalPool.filter((c: any) => !removedIds.includes(c.id));
        if (filteredPool.length > 0) finalPool = filteredPool;

        const newCard = finalPool[Math.floor(Math.random() * finalPool.length)];
        player.cards.push(newCard);

        const modal = document.getElementById('board-inventory-modal') || document.getElementById('board-cards-modal');
        if (modal) modal.style.display = 'none';
        Game.updateHUD();

        const logMsg = `🔥 ${player.name} sacrificou [${removedNames.join(', ')}] e invocou uma nova carta: [${newCard.name}]!`;
        const logMsgGlobal = `🔥 ${player.name} sacrificou duas cartas e invocou uma nova carta!`;

        Game.log(logMsg);
        Game.showGlobalAlert(logMsg, player.name, true, false);

        if (Network.isOnline) {
            const { ref, update, getDatabase } = await import('firebase/database');
            const db = getDatabase();
            const updates: any = {};
            updates[`rooms/${Network.currentRoomId}/players/${player.id}/cards`] = player.cards;
            await update(ref(db), updates);

            Network.sendAction('LOG', { msg: logMsgGlobal });
            Network.sendAction('SHOW_ALERT', { msg: logMsgGlobal, playerName: player.name, endsTurn: false });
            Network.syncPlayerState();
        }
    }

    static async confirmMerge() {
        const Game = (window as any).Game;
        const Network = (window as any).Network;
        const player = Game.getCurrentPlayer();

        const checkboxes = document.querySelectorAll('.merge-checkbox:checked');
        if (checkboxes.length !== 4) return alert("Você deve selecionar EXATAMENTE 4 cartas.");

        const indicesToRemove: number[] = [];
        checkboxes.forEach((cb: any) => indicesToRemove.push(parseInt(cb.getAttribute('data-index'))));

        const rarities = indicesToRemove.map(idx => player.cards[idx].rarity);
        if (rarities.some((r: string) => r !== rarities[0])) return alert("As 4 cartas selecionadas devem ter a mesma raridade para serem fundidas!");

        const baseRarity = rarities[0];
        let targetRarity = "";

        if (baseRarity === 'Comum') targetRarity = 'Incomum';
        else if (baseRarity === 'Incomum') targetRarity = 'Rara';
        else if (baseRarity === 'Rara') targetRarity = 'Épica';
        else if (baseRarity === 'Épica') targetRarity = 'Lendária';
        else if (baseRarity === 'Lendária') return alert("Cartas Lendárias já estão no nível máximo e não podem ser fundidas para uma raridade superior.");

        indicesToRemove.sort((a, b) => b - a);

        const removedIds: string[] = [];
        indicesToRemove.forEach(idx => {
            if (player.cards[idx]) {
                removedIds.push(player.cards[idx].id);
                player.cards.splice(idx, 1);
            }
        });

        const possibleCards = CARDS_DB.filter((c: any) => c.rarity === targetRarity);
        const finalPool = possibleCards.length > 0 ? possibleCards : CARDS_DB;
        const filteredPool = finalPool.filter((c: any) => !removedIds.includes(c.id));
        const finalFinalPool = filteredPool.length > 0 ? filteredPool : finalPool;

        const newCard = finalFinalPool[Math.floor(Math.random() * finalFinalPool.length)];
        player.cards.push(newCard);

        const modal = document.getElementById('board-inventory-modal') || document.getElementById('board-cards-modal');
        if (modal) modal.style.display = 'none';
        Game.updateHUD();

        const logMsg = `💎 ${player.name} fundiu cartas [${baseRarity}] e obteve uma nova carta [${targetRarity}]: [${newCard.name}]!`;
        const logMsgGlobal = `💎 ${player.name} fundiu cartas e obteve uma [${targetRarity}]!`;

        Game.log(logMsg);
        Game.showGlobalAlert(logMsg, player.name, true, false);

        if (Network.isOnline) {
            const { ref, update, getDatabase } = await import('firebase/database');
            const db = getDatabase();
            const updates: any = {};
            updates[`rooms/${Network.currentRoomId}/players/${player.id}/cards`] = player.cards;
            await update(ref(db), updates);

            Network.sendAction('LOG', { msg: logMsgGlobal });
            Network.sendAction('SHOW_ALERT', { msg: logMsgGlobal, playerName: player.name, endsTurn: false });
            Network.syncPlayerState();
        }
    }
}