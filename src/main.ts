import './style.css'
import './ui.css'
import './battle.css'
import './cards.css'
import './dice.css'
import './dialog.css'
import './cinematics.css'
import './board.css'
import './modules/ui/Cinematics';
import { GameDialog } from './modules/ui/GameDialog';
import { Setup } from './core/Setup';
import { Game } from './core/Game';
import { Shop } from './systems/Shop';
import { Battle } from './systems/Battle';
import { Network } from './systems/Network';
import { Cards } from './systems/Cards';
import { QuestManager } from './modules/quests/QuestManager';
import { GameEvents } from './modules/game/GameEvents';
import { TypeTooltip } from './modules/ui/TypeTooltip';
import { MobileLayout } from './modules/ui/MobileLayout';
import { Settings } from './modules/ui/Settings';
import { DemoMode } from './modules/ui/DemoMode';
import { Presence } from './modules/ui/Presence';
import { PwaSetup } from './modules/ui/PwaSetup';

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
// Rede de segurança: qualquer alert() que sobrar vira um toast do jogo (texto puro, não bloqueante).
// Use GameDialog.toast/alert/confirm diretamente no código novo.
window.alert = function(msg?: any) {
    GameDialog.toast(msg);
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
    if(Network.isOnline && id !== Network.myPlayerId) return GameDialog.toast("As cartas dos outros jogadores são privadas.", { tone: 'warning' });
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
    MobileLayout.init();
    Settings.init();
    if (DemoMode.shouldStart()) setTimeout(() => DemoMode.start(), 300);
    Presence.init();
    PwaSetup.init();
});

if (document.readyState === "complete" || document.readyState === "interactive") {
    Setup.updateSlots();
    Setup.checkCachedLogin();
    initModalBackdropDismissal();
    TypeTooltip.init();
    MobileLayout.init();
    Settings.init();
    if (DemoMode.shouldStart()) setTimeout(() => DemoMode.start(), 300);
    Presence.init();
    PwaSetup.init();
}