import './style.css'
import { Setup } from './core/Setup';
import { Game } from './core/Game';
import { Shop } from './systems/Shop';
import { Battle } from './systems/Battle';
import { Network } from './systems/Network';
import { Cards } from './systems/Cards';
import { QuestManager } from './modules/quests/QuestManager';
import { GameEvents } from './modules/game/GameEvents';
import { TypeTooltip } from './modules/ui/TypeTooltip';

declare global {
    interface Window {
        Setup: typeof Setup;
        Game: typeof Game;
        Shop: typeof Shop;
        Battle: typeof Battle;
        Network: typeof Network;
        Cards: typeof Cards; // Adicionado aqui
        QuestManager: typeof QuestManager;
        GameEvents: typeof GameEvents;
        openInventory: (playerId: number, readOnly?: boolean) => void;
        openPlayerBadges: (playerId: number) => void;
        openCards: (playerId: number) => void;
        openCardLibrary: () => void;
        openItemLibrary: () => void;
        openXpRules: () => void;
        returnToPokepedia: (currentModalId?: string) => void;
        TypeTooltip: typeof TypeTooltip;
    }
}

window.TypeTooltip = TypeTooltip;

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
window.GameEvents = GameEvents;

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

window.returnToPokepedia = (currentModalId?: string) => {
    if (currentModalId) {
        const el = document.getElementById(currentModalId);
        if (el) el.style.display = 'none';
    }
    const pokepedia = document.getElementById('pokepedia-modal');
    if (pokepedia) pokepedia.style.display = 'flex';
};

// Fechamento automático de modais ao clicar no fundo (backdrop)
function initModalBackdropDismissal() {
    let backdropDownTarget: EventTarget | null = null;

    document.addEventListener('mousedown', (e) => {
        backdropDownTarget = e.target;
    });

    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement | null;
        if (!target) return;

        // Somente fecha se o clique começou e terminou exatamente no mesmo overlay de fundo
        if (target !== backdropDownTarget) return;

        const isOverlay = target.classList?.contains('modal-overlay') || target.classList?.contains('modal');
        if (!isOverlay) return;

        const modalId = target.id;

        // Telas críticas de decisão do jogo que não devem ser fechadas ao clicar fora
        const NON_DISMISSIBLE_MODALS = new Set([
            'battle-modal',
            'victory-modal',
            'city-modal',
            'swap-modal',
            'quests-swap-modal',
            'pkmn-select-modal',
            'battle-confirm-modal',
            'type-selection-modal'
        ]);

        if (NON_DISMISSIBLE_MODALS.has(modalId)) {
            return;
        }

        // Subtelas da Poképédia: ao clicar fora, retorna para a tela inicial da Poképédia
        const POKEPEDIA_SUBMODALS = new Set([
            'library-modal',
            'item-library-modal',
            'quest-library-modal',
            'capture-rules-modal',
            'combat-rules-modal',
            'happiness-rules-modal',
            'xp-rules-modal'
        ]);

        if (POKEPEDIA_SUBMODALS.has(modalId)) {
            window.returnToPokepedia(modalId);
            return;
        }

        // A própria Poképédia: fecha ao clicar fora
        if (modalId === 'pokepedia-modal') {
            target.style.display = 'none';
            return;
        }

        // PokéMart / Loja: usa o método oficial para encerrar o evento
        if (modalId === 'shop-modal') {
            if (window.Shop && typeof window.Shop.close === 'function') {
                window.Shop.close();
            } else {
                target.style.display = 'none';
            }
            return;
        }

        // Demais modais gerais (mochila, cartas, pokédex, lixeira, estatísticas, etc.)
        target.style.display = 'none';
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    Setup.updateSlots();
    Setup.checkCachedLogin();
    initModalBackdropDismissal();
    TypeTooltip.init();
});

if (document.readyState === "complete" || document.readyState === "interactive") {
    Setup.updateSlots();
    Setup.checkCachedLogin();
    initModalBackdropDismissal();
    TypeTooltip.init();
}