import { CARDS_DB } from '../../constants';
import { ref, update, getDatabase } from 'firebase/database';
import type { Player } from '../../models/Player';
import { GameState } from '../game/GameState';

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

    static getValidCardsDb() {
        let db = CARDS_DB;
        if (GameState.settings && !GameState.settings.megas) {
            db = db.filter(c => !['mega_stone', 'reclaim_mega_stone', 'steal_mega_stone'].includes(c.id));
        }
        return db;
    }

    static draw(player: Player, silentLog: boolean = false) {
        const Game = (window as any).Game;
        const Network = (window as any).Network;

        const resultChance = Math.floor(Math.random() * 100) + 1;
        let targetRarity = 'Comum';

        const canGetLegendary = (!player.effects || !player.effects.playedLegendary) && !player.cards.some((c: any) => c.rarity === 'Lendária');

        if (canGetLegendary && resultChance <= 2) targetRarity = 'Lendária';
        else if (resultChance <= 8) targetRarity = 'Épica';
        else if (resultChance <= 26) targetRarity = 'Rara';
        else if (resultChance <= 53) targetRarity = 'Incomum';

        const validDb = this.getValidCardsDb();
        const possibleCards = validDb.filter((c: any) => c.rarity === targetRarity);
        const finalPool = possibleCards.length > 0 ? possibleCards : validDb;
        const card = finalPool[Math.floor(Math.random() * finalPool.length)];

        player.cards.push(card);

        // Registro de Extrato de Cartas (Global)
        Game.sendGlobalLog(`🃏 [Extrato] ${player.name} obteve uma carta. Total: ${player.cards.length}`);

        if (!silentLog) {
            const isMe = !Network.isOnline || player.id === Network.myPlayerId;
            if (isMe) {
                Game.log(`🃏 Você obteve a carta: ${card.icon} ${card.name} (Total: ${player.cards.length})`);
                if (Network.isOnline) {
                    Network.sendAction('LOG', { msg: `🃏 ${player.name} obteve uma Carta Misteriosa!` });
                }
            }
        }

        Game.updateHUD();
        if (Network.isOnline) Network.syncPlayerState();

        return card;
    }

    static drawSpecificRarity(player: Player, rarity: string, silentLog: boolean = false) {
        const Game = (window as any).Game;
        const Network = (window as any).Network;

        const validDb = this.getValidCardsDb();
        const possibleCards = validDb.filter((c: any) => c.rarity === rarity);
        const finalPool = possibleCards.length > 0 ? possibleCards : validDb;
        const card = finalPool[Math.floor(Math.random() * finalPool.length)];

        player.cards.push(card);

        // Registro de Extrato de Cartas (Global)
        Game.sendGlobalLog(`🃏 [Extrato] ${player.name} obteve uma carta. Total: ${player.cards.length}`);

        if (!silentLog) {
            const isMe = !Network.isOnline || player.id === Network.myPlayerId;
            if (isMe) {
                Game.log(`🃏 Você obteve a carta: ${card.icon} ${card.name} (Total: ${player.cards.length})`);
                if (Network.isOnline) {
                    Network.sendAction('LOG', { msg: `🃏 ${player.name} obteve uma Carta Misteriosa!` });
                }
            }
        }

        Game.updateHUD();
        if (Network.isOnline) Network.syncPlayerState();

        return card;
    }

    static drawSpecificCard(player: Player, cardId: string, silentLog: boolean = false) {
        const Game = (window as any).Game;
        const Network = (window as any).Network;

        const validDb = CARDS_DB;
        const card = validDb.find((c: any) => c.id === cardId);
        
        if (!card) return null;

        player.cards.push(card);

        // Registro de Extrato de Cartas (Global)
        Game.sendGlobalLog(`🃏 [Extrato] ${player.name} obteve uma carta específica. Total: ${player.cards.length}`);

        if (!silentLog) {
            const isMe = !Network.isOnline || player.id === Network.myPlayerId;
            if (isMe) {
                Game.log(`🃏 Você obteve a carta: ${card.icon} ${card.name} (Total: ${player.cards.length})`);
                if (Network.isOnline) {
                    Network.sendAction('LOG', { msg: `🃏 ${player.name} obteve uma carta do Host!` });
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

        const validPool = this.getValidCardsDb().filter((c: any) => c.id !== 'master');
        let targetRarity: string | undefined = undefined;

        if (removedRarities.length === 2 && 
            ((removedRarities[0] === 'Épica' && removedRarities[1] === 'Épica') || 
             (removedRarities[0] === 'Rara' && removedRarities[1] === 'Rara'))) {
            targetRarity = removedRarities[0];
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

        const QuestManagerObj = (window as any).QuestManager || (window as any).modules?.QuestManager;
        if (QuestManagerObj) {
            QuestManagerObj.checkProgress(player, 'USE_SACRIFICE_CARDS', 1);
            QuestManagerObj.checkProgress(player, 'FUSION_AND_SACRIFICE', 1, { action: 'sacrifice' });
        }

        const modal = document.getElementById('board-inventory-modal') || document.getElementById('board-cards-modal');
        if (modal) modal.style.display = 'none';
        Game.updateHUD();

        const logMsg = `🔥 ${player.name} sacrificou [${removedNames.join(', ')}] e invocou uma nova carta: [${newCard.name}]! (Total: ${player.cards.length})`;
        const logMsgGlobal = `🔥 ${player.name} sacrificou duas cartas e invocou uma nova carta!`;

        Game.log(logMsg);
        Game.sendGlobalLog(`🃏 [Extrato] ${player.name} sacrificou cartas. Total: ${player.cards.length}`);
        Game.showGlobalAlert(logMsg, player.name, true, false);

        if (Network.isOnline) {

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
        if (checkboxes.length === 0) return alert("Você deve selecionar cartas para fundir.");

        const indicesToRemove: number[] = [];
        checkboxes.forEach((cb: any) => indicesToRemove.push(parseInt(cb.getAttribute('data-index'))));

        const rarities = indicesToRemove.map(idx => player.cards[idx].rarity);
        if (rarities.some((r: string) => r !== rarities[0])) return alert("As cartas selecionadas devem ter a mesma raridade para serem fundidas!");

        const baseRarity = rarities[0];
        let reqAmount = 4;
        let targetRarity = "";

        if (baseRarity === 'Comum') { reqAmount = 2; targetRarity = 'Incomum'; }
        else if (baseRarity === 'Incomum') { reqAmount = 3; targetRarity = 'Rara'; }
        else if (baseRarity === 'Rara') { reqAmount = 4; targetRarity = 'Épica'; }
        else if (baseRarity === 'Épica') { reqAmount = 4; targetRarity = 'Lendária'; }
        else if (baseRarity === 'Lendária') return alert("Cartas Lendárias já estão no nível máximo e não podem ser fundidas.");

        if (checkboxes.length !== reqAmount) {
            return alert(`Para fundir cartas do tipo ${baseRarity}, você precisa selecionar EXATAMENTE ${reqAmount} cartas.`);
        }

        indicesToRemove.sort((a, b) => b - a);

        const removedIds: string[] = [];
        indicesToRemove.forEach(idx => {
            if (player.cards[idx]) {
                removedIds.push(player.cards[idx].id);
                player.cards.splice(idx, 1);
            }
        });

        const validDb = this.getValidCardsDb();
        const possibleCards = validDb.filter((c: any) => c.rarity === targetRarity);
        const finalPool = possibleCards.length > 0 ? possibleCards : validDb;
        const filteredPool = finalPool.filter((c: any) => !removedIds.includes(c.id));
        const finalFinalPool = filteredPool.length > 0 ? filteredPool : finalPool;

        const newCard = finalFinalPool[Math.floor(Math.random() * finalFinalPool.length)];
        player.cards.push(newCard);

        const QuestManagerObj = (window as any).QuestManager || (window as any).modules?.QuestManager;
        if (QuestManagerObj) {
            QuestManagerObj.checkProgress(player, 'USE_FUSION_CARDS', 1);
            QuestManagerObj.checkProgress(player, 'FUSION_AND_SACRIFICE', 1, { action: 'fusion' });
        }

        const modal = document.getElementById('board-inventory-modal') || document.getElementById('board-cards-modal');
        if (modal) modal.style.display = 'none';
        Game.updateHUD();

        const logMsg = `💎 ${player.name} fundiu cartas [${baseRarity}] e obteve uma nova carta [${targetRarity}]: [${newCard.name}]! (Total: ${player.cards.length})`;
        const logMsgGlobal = `💎 ${player.name} fundiu cartas e obteve uma [${targetRarity}]!`;

        Game.log(logMsg);
        Game.sendGlobalLog(`🃏 [Extrato] ${player.name} fundiu cartas. Total: ${player.cards.length}`);
        Game.showGlobalAlert(logMsg, player.name, true, false);

        if (Network.isOnline) {

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