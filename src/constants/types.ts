export interface PokemonData {
    id: number;
    name: string;
    type: string;
    hp: number;
    atk: number;
    def: number;
    spd: number;
    nextForm: string | null;
    evoTrigger?: number;
    isLegendary?: boolean;
}

export interface ItemData {
    id: string;
    name: string;
    icon: string;
    price: number;
    type: 'heal' | 'capture';
    val?: number;
    rate?: number;
}

export interface CardData {
    id: string;
    name: string;
    icon: string;
    desc: string;
    type: 'move' | 'battle';
}

export interface Coord {
    x: number;
    y: number;
}