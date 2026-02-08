import type { ItemData } from './types';

export const SHOP_ITEMS: ItemData[] = [
    { id: 'potion', name: 'Poção', icon: 'Pocao.png', price: 100, type: 'heal', val: 20 },
    { id: 'superpotion', name: 'Super Poção', icon: 'SuperPocao.png', price: 250, type: 'heal', val: 60 },
    { id: 'hyperpotion', name: 'Hyper Poção', icon: 'HyperPocao.png', price: 400, type: 'heal', val: 120 },
    { id: 'ultrafullrestore', name: 'Ultra Full Restore', icon: 'UltraFullRestore.png', price: 5000, type: 'heal', val: 120 },
    
    { id: 'revive', name: 'Revive', icon: 'Revive.png', price: 250, type: 'heal', val: 20 },
    { id: 'maxrevive', name: 'Max Revive', icon: 'MaxRevive.png', price: 400, type: 'heal', val: 20 },
    { id: 'ultramaxrevive', name: 'Ultra Max Revive', icon: 'UltraMaxRevive.png', price: 5000, type: 'heal', val: 20 },
    
    { id: 'pokeball', name: 'Pokébola', icon: 'pokeball.png', price: 200, type: 'capture', rate: 1.0 },
    { id: 'greatball', name: 'Great Ball', icon: 'greatBall.png', price: 500, type: 'capture', rate: 1.5 },
    { id: 'ultraball', name: 'Ultra Ball', icon: 'ultraBall.png', price: 1000, type: 'capture', rate: 2.0 },
    { id: 'masterball', name: 'Master Ball', icon: 'masterBall.png', price: 5000, type: 'capture', rate: 100.0 }
];