import './style.css'
import { Setup } from './core/Setup';
import { Game } from './core/Game';
import { Shop } from './systems/Shop';
import { Battle } from './systems/Battle';
import { Network } from './systems/Network';
import { Cards } from './systems/Cards';

declare global {
    interface Window {
        Setup: typeof Setup;
        Game: typeof Game;
        Shop: typeof Shop;
        Battle: typeof Battle;
        Network: typeof Network;
        Cards: typeof Cards; // Adicionado aqui
        openInventory: (playerId: number) => void;
        openCards: (playerId: number) => void;
        openCardLibrary: () => void;
        openXpRules: () => void;
    }
}

// Bindings Globais
window.Setup = Setup;
window.Game = Game;
window.Shop = Shop;
window.Battle = Battle;
window.Network = Network;
window.Cards = Cards; // Agora Pokemon.ts pode usar window.Cards

// Funções de atalho do HTML
window.openInventory = (id) => Game.openInventoryModal(id);
window.openCards = (id) => { 
    if(Network.isOnline && id !== Network.myPlayerId) return alert("Privado!"); 
    Cards.showPlayerCards(id); 
};
window.openCardLibrary = () => Game.openCardLibrary();
window.openXpRules = () => Game.openXpRules();

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    Setup.updateSlots();
});

if (document.readyState === "complete" || document.readyState === "interactive") {
    Setup.updateSlots();
}