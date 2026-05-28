import './style.css'
import { Setup } from './core/Setup';
import { Game } from './core/Game';
import { Shop } from './systems/Shop';
import { Battle } from './systems/Battle';
import { Network } from './systems/Network';
import { Cards } from './systems/Cards';
import { QuestManager } from './modules/quests/QuestManager';

declare global {
    interface Window {
        Setup: typeof Setup;
        Game: typeof Game;
        Shop: typeof Shop;
        Battle: typeof Battle;
        Network: typeof Network;
        Cards: typeof Cards; // Adicionado aqui
        QuestManager: typeof QuestManager;
        openInventory: (playerId: number, readOnly?: boolean) => void;
        openPlayerBadges: (playerId: number) => void;
        openCards: (playerId: number) => void;
        openCardLibrary: () => void;
        openItemLibrary: () => void;
        openXpRules: () => void;
    }
}

// --- CUSTOM GLOBAL ALERT OVERRIDE ---
// Replaces the native blocking alert() with a custom on-screen toast
const activeToasts: HTMLElement[] = [];
window.alert = function(msg: string) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(30, 35, 55, 0.95);
        color: #edf2f4;
        padding: 15px 25px;
        border-radius: 10px;
        z-index: 10000;
        font-size: 1.15rem;
        box-shadow: 0 8px 25px rgba(0,0,0,0.6);
        text-align: center;
        max-width: 80%;
        font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        border: 2px solid #ef233c;
        transition: top 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        pointer-events: none;
    `;
    toast.innerHTML = msg;
    document.body.appendChild(toast);
    
    activeToasts.push(toast);
    
    // Reposition all active toasts (stacking from top)
    activeToasts.forEach((t, i) => {
        const offset = 20 + (i * 70);
        t.style.top = `${offset}px`;
    });
    
    // Animação de entrada
    toast.animate([
        { opacity: 0, transform: 'translate(-50%, -30px)' },
        { opacity: 1, transform: 'translate(-50%, 0)' }
    ], { duration: 400, easing: 'ease-out' });

    setTimeout(() => {
        const anim = toast.animate([
            { opacity: 1, transform: 'translate(-50%, 0)' },
            { opacity: 0, transform: 'translate(-50%, -30px)' }
        ], { duration: 300, easing: 'ease-in' });
        
        anim.onfinish = () => {
            toast.remove();
            const idx = activeToasts.indexOf(toast);
            if (idx > -1) activeToasts.splice(idx, 1);
            // Reposition remaining
            activeToasts.forEach((t, i) => {
                const offset = 20 + (i * 70);
                t.style.top = `${offset}px`;
            });
        };
    }, 4500); // Exibe por 4.5 segundos
};

// Bindings Globais
window.Setup = Setup;
window.Game = Game;
window.Shop = Shop;
window.Battle = Battle;
window.Network = Network;
window.Cards = Cards; // Agora Pokemon.ts pode usar window.Cards
window.QuestManager = QuestManager;

// Funções de atalho do HTML
window.openInventory = (id, readOnly = false) => Game.openInventoryModal(id, readOnly);
window.openPlayerBadges = (id) => Game.openPlayerBadgesModal(id);
window.openCards = (id) => { 
    if(Network.isOnline && id !== Network.myPlayerId) return alert("Privado!"); 
    Cards.showPlayerCards(id); 
};
window.openCardLibrary = () => Game.openCardLibrary();
window.openItemLibrary = () => Game.openItemLibrary();
window.openXpRules = () => Game.openXpRules();

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    Setup.updateSlots();
});

if (document.readyState === "complete" || document.readyState === "interactive") {
    Setup.updateSlots();
}