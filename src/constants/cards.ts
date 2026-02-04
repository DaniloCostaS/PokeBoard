import type { CardData } from './types';

export const CARDS_DB: CardData[] = [
    { id: 'dice', name: "Dado Mágico", icon: "🎲", desc: "Escolha o nº do dado (1-20).", type: 'move' },
    { id: 'crit', name: "Super Crítico", icon: "💥", desc: "Dobra o dano do próximo ataque.", type: 'battle' },
    { id: 'master', name: "Master Ball", icon: "🟣", desc: "Captura 100% garantida.", type: 'battle' },
    { id: 'run', name: "Fumaça Ninja", icon: "💨", desc: "Foge da batalha instantaneamente.", type: 'battle' }
];