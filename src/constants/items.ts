import type { ItemData } from './types';

export const SHOP_ITEMS: ItemData[] = [
    { id: 'potion', name: 'Poção', icon: '💊', price: 100, type: 'heal', val: 50 },
    { id: 'pokeball', name: 'Pokébola', icon: '🔴', price: 200, type: 'capture', rate: 1.0 },
    { id: 'greatball', name: 'Great Ball', icon: '🔵', price: 500, type: 'capture', rate: 1.5 },
    { id: 'ultraball', name: 'Ultra Ball', icon: '⚫', price: 1000, type: 'capture', rate: 2.0 }
];