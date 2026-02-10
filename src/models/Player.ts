import type { CardData } from '../constants';
import { Pokemon } from './Pokemon';

export class Player {
    id: number; name: string; avatar: string; x: number = 0; y: number = 0; gold: number = 500;
    items: {[key:string]:number} = {'pokeball':6, 'potion':1};
    cards: CardData[] = []; team: Pokemon[] = [];
    skipTurn: boolean = false; badges: boolean[] = [false,false,false,false,false,false,false,false];

    constructor(id: number, name: string, avatarFile: string, isLoadMode: boolean) {
        this.id = id; this.name = name; 
        this.avatar = `/assets/img/Treinadores/${avatarFile}`;
        
        if(!isLoadMode && name !== "_LOAD_") {
            const starters = [1, 4, 7, 25]; 
            const randomStarterId = starters[Math.floor(Math.random() * starters.length)];
            this.team.push(new Pokemon(randomStarterId, 1, null)); 
        }
    }
    isDefeated() { return this.getBattleTeam(false).length === 0 || this.getBattleTeam(false).every(p => p.isFainted()); }
    getBattleTeam(isGymLimit: boolean) { const limit = isGymLimit ? 6 : 3; return this.team.filter(p => !p.isFainted()).slice(0, limit); }
    resetTurnFlags() { this.team.forEach(p => p.leveledUpThisTurn = false); }
}