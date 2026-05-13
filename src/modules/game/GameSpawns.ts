import { POKEDEX } from '../../constants/pokedex';
import { GYM_DATA } from '../../constants/gyms';
import { RARIDADE_DATA } from '../../constants/Raridades';
import { TILE, SHOP_ITEMS } from '../../constants';
import { Pokemon } from '../../models/Pokemon';
import { Network } from '../../systems/Network';
import { GameState } from './GameState';

export class GameSpawns {

    static getGenById(id: number): number {
        if (id >= 10000) return 0; // Megas/Forms
        if (id <= 151) return 1;
        if (id <= 251) return 2;
        if (id <= 386) return 3;
        if (id <= 493) return 4;
        if (id <= 649) return 5;
        if (id <= 721) return 6;
        if (id <= 809) return 7;
        if (id <= 905) return 8;
        return 9;
    }

    static generateGymTeams() {
        GameState.gymTeams = {};

        GYM_DATA.forEach(gym => {
            const validCandidates = POKEDEX.filter(p => {
                if (p.nextForm && p.nextForm !== "") return false;
                if (!gym.type.includes(p.type) && (!p.secondType || !gym.type.includes(p.secondType))) return false;

                const pGen = this.getGenById(p.id);
                if (pGen > 0 && !GameState.settings.generations.includes(pGen)) return false;
                if (p.id >= 10000 && !GameState.settings.megas) return false;

                if (GameState.settings.legendaries === 'no' && p.isLegendary) return false;
                if (GameState.settings.legendaries === 'only' && !p.isLegendary) return false;

                return true;
            });

            const roster: number[] = [];

            for (let i = 0; i < 6; i++) {
                const isLegendaryRoll = Math.random() * 100 < 2;
                let pool = [];

                if (isLegendaryRoll) {
                    pool = validCandidates.filter(p => p.isLegendary);
                    if (pool.length === 0) pool = validCandidates.filter(p => !p.isLegendary);
                } else {
                    pool = validCandidates.filter(p => !p.isLegendary);
                }

                if (pool.length === 0) pool = validCandidates;

                if (pool.length > 0) {
                    const pick = pool[Math.floor(Math.random() * pool.length)];
                    roster.push(pick.id);
                } else {
                    roster.push(130); // Gyarados Fallback
                }
            }

            GameState.gymTeams[gym.id] = roster;
        });

        console.log("Times de Ginásio Gerados (Apenas Finais):", GameState.gymTeams);
    }

    static generateWildPokemon(tileType: number): Pokemon {
        let allowedTypes: string[] = [];
        switch (tileType) {
            case TILE.GRASS: allowedTypes = ['Grama', 'Inseto', 'Normal', 'Veneno', 'Voador', 'Noturno']; break;
            case TILE.WATER: allowedTypes = ['Água', 'Gelo', 'Dragão', 'Fada']; break;
            case TILE.GROUND: allowedTypes = ['Terra', 'Pedra', 'Fogo', 'Lutador', 'Elétrico', 'Psíquico', 'Fantasma', 'Aço']; break;
            default: allowedTypes = ['Normal']; break;
        }

        const globalAvg = GameState.getGlobalAverageLevel();
        let allowedStages = [1];
        let allowLegendaries = false;

        if (globalAvg < 5) { allowedStages = [1]; allowLegendaries = false; }
        else if (globalAvg >= 5 && globalAvg < 10) { allowedStages = [1, 2]; allowLegendaries = true; }
        else { allowedStages = [1, 2, 3]; allowLegendaries = true; }

        if (GameState.settings.legendaries === 'yes' && GameState.currentGlobalEvent?.id === 'LEGENDARY_FEVER') {
            allowLegendaries = true;
        }

        const validCandidates = POKEDEX.filter(p => {
            const match1 = allowedTypes.includes(p.type);
            const match2 = p.secondType && allowedTypes.includes(p.secondType);

            if (!match1 && !match2) return false;
            
            // Only enforce stages if not 'only' legendaries, because legendary basic stages are often non-existent or skip stages
            if (GameState.settings.legendaries !== 'only' && !allowedStages.includes(p.stage)) return false;

            if (p.isLegendary && !allowLegendaries && GameState.settings.legendaries !== 'only') return false;

            const pGen = this.getGenById(p.id);
            if (pGen > 0 && !GameState.settings.generations.includes(pGen)) return false;
            if (p.id >= 10000 && !GameState.settings.megas) return false;

            if (GameState.settings.legendaries === 'no' && p.isLegendary) return false;
            if (GameState.settings.legendaries === 'only' && !p.isLegendary) return false;

            return true;
        });

        if (validCandidates.length === 0) return new Pokemon(16, Math.min(25, Math.max(1, globalAvg + Math.floor(Math.random() * 5) - 2)));

        const playerL = GameState.getCurrentPlayer();
        const lure = playerL.effects?.lureType;
        if (lure && (lure.count || 0) > 0) {
            const luredCandidates = validCandidates.filter(p => p.type === lure.type || p.secondType === lure.type);
            if (luredCandidates.length > 0) {
                const chosen = luredCandidates[Math.floor(Math.random() * luredCandidates.length)];
                lure.count!--;
                if (lure.count === 0) delete playerL.effects.lureType;
                if (Network.isOnline) Network.syncPlayerState();
                return new Pokemon(chosen.id, Math.min(25, Math.max(1, globalAvg + Math.floor(Math.random() * 5) - 2)), null);
            }
        }

        const roll = Math.random() * 100;
        let selectedRarityId = 'Comum';
        let cumulativeRate = 0;

        for (const r of RARIDADE_DATA) {
            cumulativeRate += (r.rate || 0);
            if (roll <= cumulativeRate) {
                selectedRarityId = r.id;
                break;
            }
        }

        if (GameState.settings.legendaries === 'yes' && GameState.currentGlobalEvent?.id === 'LEGENDARY_FEVER' && Math.random() <= 0.30) {
            selectedRarityId = 'Lendário';
        }

        if (GameState.settings.legendaries === 'only') {
            selectedRarityId = 'Lendário';
        }

        const rarityInfo = RARIDADE_DATA.find(r => r.id === selectedRarityId);

        const rarityPool = validCandidates.filter(p => {
            if (p.isLegendary) {
                return selectedRarityId === 'Lendário';
            }
            const checkTotal = p.BaseTotal || (p.hp + p.atk + p.def + p.spd);
            if (!rarityInfo) return false;
            return checkTotal >= rarityInfo.baseMin && checkTotal <= rarityInfo.baseMax;
        });

        const finalPool = rarityPool.length > 0 ? rarityPool : validCandidates;
        const chosenTemplate = finalPool[Math.floor(Math.random() * finalPool.length)];

        const wildVariation = Math.floor(Math.random() * 5) - 2;
        const wildLevel = Math.min(25, Math.max(1, globalAvg + wildVariation));
        const wildMon = new Pokemon(chosenTemplate.id, wildLevel, null);

        if (GameState.currentGlobalEvent?.id === 'SHINY_FEVER' && Math.random() <= 0.30) {
            wildMon.isShiny = true;
            wildMon.recalculateStats(true);
        }

        // 30% de chance do selvagem vir segurando um item hold
        if (Math.random() < 0.30) {
            const holdItems = SHOP_ITEMS.filter(i => i.type === 'hold');
            if (holdItems.length > 0) {
                const picked = holdItems[Math.floor(Math.random() * holdItems.length)];
                (wildMon as any).heldItem = picked.id;
            }
        }

        return wildMon;
    }
}