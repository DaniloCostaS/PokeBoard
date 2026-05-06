import type { ItemData } from './types';

export const SHOP_ITEMS: ItemData[] = [
    // --- CURA (HEAL) ---
    { id: 'potion', name: 'Poção', icon: 'Pocao.png', price: 100, type: 'heal', val: 20 },
    { id: 'superpotion', name: 'Super Poção', icon: 'SuperPocao.png', price: 300, type: 'heal', val: 60 },
    { id: 'hyperpotion', name: 'Hyper Poção', icon: 'HyperPocao.png', price: 550, type: 'heal', val: 100 },
    // Ultra Full Restore: Cura 100% de todos os vivos (val ignorado na lógica especial)
    { id: 'ultrafullrestore', name: 'Ultra Full Restore', icon: 'UltraFullRestore.png', price: 2500, type: 'heal', val: 9999 },

    // --- REVIVER (REVIVE) ---
    { id: 'revive', name: 'Revive', icon: 'Revive.png', price: 200, type: 'revive', val: 50 }, // 50% HP
    { id: 'maxrevive', name: 'Max Revive', icon: 'MaxRevive.png', price: 500, type: 'revive', val: 100 }, // 100% HP
    // Ultra Max Revive: Revive todos com 100% (val ignorado na lógica especial)
    { id: 'ultramaxrevive', name: 'Ultra Max Revive', icon: 'UltraMaxRevive.png', price: 2000, type: 'revive', val: 100 },

    // --- CAPTURA (CAPTURE) ---
    { id: 'pokeball', name: 'Pokébola', icon: 'pokeball.png', price: 100, type: 'capture', rate: 15 },
    { id: 'greatball', name: 'Great Ball', icon: 'greatBall.png', price: 200, type: 'capture', rate: 30 },
    { id: 'ultraball', name: 'Ultra Ball', icon: 'ultraBall.png', price: 400, type: 'capture', rate: 50 },
    { id: 'masterball', name: 'Master Ball', icon: 'masterBall.png', price: 2500, type: 'capture', rate: 100 },

    // --- ESPECIAIS ---
    { id: 'megastone', name: 'Mega Stone', icon: 'MegaStone.png', price: 5000, type: 'mega' },
    { id: 'vitamin', name: 'Vitaminas', icon: 'Vitamina.png', price: 500, type: 'boost', val: 1 },

    // --- Itens paera Segurar ---
    { id: 'amulet_coin', name: 'Moeda de amuleto', icon: 'amulet_coin.png', price: 999999, type: 'hold' },
    { id: 'leftovers', name: 'Restos', icon: 'leftovers.png', price: 999999, type: 'hold' },
    { id: 'quick_claw', name: 'Garra Rápida', icon: 'quick_claw.png', price: 999999, type: 'hold' },
    { id: 'sitrus_berry', name: 'Sitrus Berry', icon: 'sitrus_berry.png', price: 999999, type: 'hold' },
    { id: 'scope_lens', name: 'Scope Lens', icon: 'scope_lens.png', price: 999999, type: 'hold' },
    { id: 'choice_band', name: 'Choice Band', icon: 'choice_band.png', price: 999999, type: 'hold' },
    { id: 'choice_scarf', name: 'Choice Scarf', icon: 'choice_scarf.png', price: 999999, type: 'hold' },
    { id: 'rocky_helmet', name: 'Rocky Helmet', icon: 'rocky_helmet.png', price: 999999, type: 'hold' }
];