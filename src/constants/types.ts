export interface PokemonData {
    id: number;
    name: string;
    type: string;
    secondType: string;
    BaseTotal: number;
    hp: number;
    atk: number;
    def: number;
    spd: number;
    stage: number;
    nextForm: string | null;
    evoTrigger?: number;
    isLegendary?: boolean;
}

export interface ItemData {
    id: string;
    name: string;
    icon: string;
    price: number;
    type: 'heal' | 'capture' | 'revive';
    val?: number;
    rate?: number;
}

export interface RaridadeData {
    id: string;
    baseMin: number;
    baseMax: number;
    rate?: number;
}

export interface GlobalEvent {
    id: string;
    icon: string;
    name: string;
    desc: string;
}

export interface CardData {
    id: string;
    name: string;
    icon: string;
    desc: string;
    type: 'move' | 'battle' | 'auto' | 'global';
    rarity: 'Comum' | 'Incomum' | 'Rara' | 'Épica';
}

export interface Coord {
    x: number;
    y: number;
}

export interface GymData {
    id: number;
    leaderName: string;
    type: string[];
    // IDs dos pokémons na Pokedex
    teamIds: number[];
    badgeImg: string;
    leaderImg: string;
    gymImg: string;
}