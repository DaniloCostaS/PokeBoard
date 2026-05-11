import type { ItemData } from './types';

export const SHOP_ITEMS: ItemData[] = [
    // --- CURA (HEAL) ---
    { id: 'potion', name: 'Poção', desc: "Cura 20 HP", icon: 'Pocao.png', price: 100, type: 'heal', val: 20 },
    { id: 'superpotion', name: 'Super Poção', desc: "Cura 60 HP", icon: 'SuperPocao.png', price: 300, type: 'heal', val: 60 },
    { id: 'hyperpotion', name: 'Hyper Poção', desc: "Cura 100 HP", icon: 'HyperPocao.png', price: 550, type: 'heal', val: 100 },
    // Ultra Full Restore: Cura 100% de todos os vivos (val ignorado na lógica especial)
    { id: 'ultrafullrestore', name: 'Ultra Full Restore', desc: "Cura 100% de HP de todos os pokémon vivos. Em batalha cura somente o pokémon ativo.", icon: 'UltraFullRestore.png', price: 2500, type: 'heal', val: 9999 },

    // --- REVIVER (REVIVE) ---
    { id: 'revive', name: 'Revive', desc: "Revive com 50% de HP", icon: 'Revive.png', price: 200, type: 'revive', val: 50 }, // 50% HP
    { id: 'maxrevive', name: 'Max Revive', desc: "Revive com 100% de HP", icon: 'MaxRevive.png', price: 500, type: 'revive', val: 100 }, // 100% HP
    // Ultra Max Revive: Revive todos com 100% (val ignorado na lógica especial)
    { id: 'ultramaxrevive', name: 'Ultra Max Revive', desc: "Revive todos com 100% de HP", icon: 'UltraMaxRevive.png', price: 2000, type: 'revive', val: 100 },

    // --- CAPTURA (CAPTURE) ---
    { id: 'pokeball', name: 'Pokébola', desc: "Captura um Pokémon Selvagem", icon: 'pokeball.png', price: 100, type: 'capture', rate: 15 },
    { id: 'greatball', name: 'Great Ball', desc: "Captura um Pokémon Selvagem com +20% de chance", icon: 'greatBall.png', price: 200, type: 'capture', rate: 30 },
    { id: 'ultraball', name: 'Ultra Ball', desc: "Captura um Pokémon Selvagem com +40% de chance", icon: 'ultraBall.png', price: 400, type: 'capture', rate: 50 },
    { id: 'masterball', name: 'Master Ball', desc: "Captura um Pokémon Selvagem com 100% de chance", icon: 'masterBall.png', price: 2500, type: 'capture', rate: 100 },

    // --- ESPECIAIS ---
    { id: 'megastone', name: 'Mega Stone', desc: "Permite a Mega Evolução", icon: 'MegaStone.png', price: 5000, type: 'mega' },
    { id: 'vitamin', name: 'Vitaminas', desc: "Aumenta +1 em todos os status do pokémon.", icon: 'Vitamina.png', price: 500, type: 'boost', val: 1 },

    // --- Itens paera Segurar ---
    { id: 'amulet_coin', name: 'Moeda de amuleto', desc: "Ganha 50G sempre que derrotar um pokémon, com o pokémon que estiver segurando esse item.", icon: 'amulet_coin.png', price: 1500, type: 'hold' },
    { id: 'leftovers', name: 'Restos', desc: "Restaura 10 de HP por turno, com o pokémon que estiver segurando esse item.", icon: 'leftovers.png', price: 1500, type: 'hold' },
    { id: 'quick_claw', name: 'Garra Rápida', desc: "Aumenta em 100% a chance de atacar primeiro, com o pokémon que estiver segurando esse item.", icon: 'quick_claw.png', price: 1500, type: 'hold' },
    { id: 'sitrus_berry', name: 'Sitrus Berry', desc: "Restaura 50% HP quando o HP chegar a 20% ou menos, com o pokémon que estiver segurando esse item. Esse item é consumido após o uso.", icon: 'sitrus_berry.png', price: 1500, type: 'hold' },
    { id: 'scope_lens', name: 'Scope Lens', desc: "Aumenta a chance de crítico, agora 5 ou 6 no dado é dano crítico, com o pokémon que estiver segurando esse item.", icon: 'scope_lens.png', price: 1500, type: 'hold' },
    { id: 'choice_band', name: 'Choice Band', desc: "Aumenta o ataque em 10%, com o pokémon que estiver segurando esse item.", icon: 'choice_band.png', price: 1500, type: 'hold' },
    { id: 'choice_scarf', name: 'Choice Scarf', desc: "Aumenta a velocidade em 20%, com o pokémon que estiver segurando esse item.", icon: 'choice_scarf.png', price: 1500, type: 'hold' },
    { id: 'rocky_helmet', name: 'Rocky Helmet', desc: "Causa 15% do dano recebido ao adversário, com o pokémon que estiver segurando esse item.", icon: 'rocky_helmet.png', price: 1500, type: 'hold' }
];