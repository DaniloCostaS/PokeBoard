import { CardManager } from '../modules/cards/CardManager';
import { CardEffects } from '../modules/cards/CardEffects';
import { CardUI } from '../modules/cards/CardUI';
import type { Player } from '../models/Player';

export class Cards {

    // --- GERENCIAMENTO DE CARTAS ---
    static draw(player: Player, silentLog: boolean = false) {
        return CardManager.draw(player, silentLog);
    }

    static drawSpecificCard(player: Player, cardId: string, silentLog: boolean = false) {
        return CardManager.drawSpecificCard(player, cardId, silentLog);
    }

    static openSacrificeModal() {
        CardUI.openSacrificeModal();
    }

    static async confirmSacrifice() {
        await CardManager.confirmSacrifice();
    }

    static openMergeModal() {
        CardUI.openMergeModal();
    }

    static async confirmMerge() {
        await CardManager.confirmMerge();
    }

    static getRarityWeight(rarity: string): number {
        return CardManager.getRarityWeight(rarity);
    }

    // --- ATIVAÇÃO E EFEITOS ---
    static async activate(cardId: string, targetId: any = null) {
        await CardEffects.activate(cardId, targetId);
    }

    static async checkAutoDefense(attacker: Player, target: Player, incomingCardId: string, incomingCardName: string): Promise<boolean> {
        return await CardEffects.checkAutoDefense(attacker, target, incomingCardId, incomingCardName);
    }

    // --- RENDERIZAÇÃO E MODAIS (CardUI) ---
    static showPlayerCards(playerId: number) {
        const Game = (window as any).Game;
        Game.openBoardCards(playerId);
    }

    static openTargetSelection(cardId: string) { CardUI.openTargetSelection(cardId); }
    static openPokemonSelectionForCard(cardId: string, customTitle?: string) { CardUI.openPokemonSelectionForCard(cardId, customTitle); }
    static openEvolutionSelectionForCard(cardId: string) { CardUI.openEvolutionSelectionForCard(cardId); }
    static openMegaSelection(cardId: string) { CardUI.openMegaSelection(cardId); }
    static openReclaimMegaStoneSelection(cardId: string) { CardUI.openReclaimMegaStoneSelection(cardId); }
    static openStealMegaStoneTargetSelection(cardId: string) { CardUI.openStealMegaStoneTargetSelection(cardId); }
    static openAshGoodbyeTargetSelection(cardId: string) { CardUI.openAshGoodbyeTargetSelection(cardId); }
    static openLegendaryEncounterSelection(options: any[]) { CardUI.openLegendaryEncounterSelection(options); }
    static showBallChoice(balls: any[]) { CardUI.showBallChoice(balls); }
    static openTypeSelection(cardId: string) { CardUI.openTypeSelection(cardId); }

    // Repasses necessários para funções que estavam expostas no HTML (ex: window.Cards.executeMasterCard)
    static executeMasterCard(ballId: string) { CardEffects.executeMasterCard(ballId); }
    static unprotectCard(pId: number, index: number, refreshUI: boolean = true) { CardEffects.unprotectCard(pId, index, refreshUI); }

}

// Vincula a classe Cards ao objeto window para chamadas originárias de onClick em botões no HTML
(window as any).Cards = Cards;