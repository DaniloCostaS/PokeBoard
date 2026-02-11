import type { ItemData } from './types';

export const SHOP_ITEMS: ItemData[] = [
    // --- CURA (HEAL) ---
    { id: 'potion', name: 'Poção', icon: 'Pocao.png', price: 100, type: 'heal', val: 20 },
    { id: 'superpotion', name: 'Super Poção', icon: 'SuperPocao.png', price: 250, type: 'heal', val: 60 },
    { id: 'hyperpotion', name: 'Hyper Poção', icon: 'HyperPocao.png', price: 400, type: 'heal', val: 120 },
    // Ultra Full Restore: Cura 100% de todos os vivos (val ignorado na lógica especial)
    { id: 'ultrafullrestore', name: 'Ultra Full Restore', icon: 'UltraFullRestore.png', price: 2000, type: 'heal', val: 9999 },
    
    // --- REVIVER (REVIVE) ---
    { id: 'revive', name: 'Revive', icon: 'Revive.png', price: 250, type: 'revive', val: 50 }, // 50% HP
    { id: 'maxrevive', name: 'Max Revive', icon: 'MaxRevive.png', price: 400, type: 'revive', val: 100 }, // 100% HP
    // Ultra Max Revive: Revive todos com 100% (val ignorado na lógica especial)
    { id: 'ultramaxrevive', name: 'Ultra Max Revive', icon: 'UltraMaxRevive.png', price: 3000, type: 'revive', val: 100 },
    
    // --- CAPTURA (CAPTURE) ---
    { id: 'pokeball', name: 'Pokébola', icon: 'pokeball.png', price: 200, type: 'capture', rate: 15 },
    { id: 'greatball', name: 'Great Ball', icon: 'greatBall.png', price: 500, type: 'capture', rate: 30 },
    { id: 'ultraball', name: 'Ultra Ball', icon: 'ultraBall.png', price: 1000, type: 'capture', rate: 50 },
    { id: 'masterball', name: 'Master Ball', icon: 'masterBall.png', price: 5000, type: 'capture', rate: 100 }
];