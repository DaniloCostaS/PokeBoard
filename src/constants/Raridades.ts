import type { RaridadeData } from './types';

export const RARIDADE_DATA: RaridadeData[] = [
    // --- CURA (HEAL) ---
    { id: 'Comum', baseMin: 0, baseMax: 220, rate: 50 },
    { id: 'Incomum', baseMin: 220, baseMax: 279, rate: 25 },
    { id: 'Raro', baseMin: 280, baseMax: 329, rate: 15 },
    { id: 'Épico', baseMin: 330, baseMax: 379, rate: 8 },
    { id: 'Lendário', baseMin: 380, baseMax: 9999, rate: 2 }
];