import type { CardData } from '../constants';
import { CARDS_DB } from '../constants'; // Import necessário para o sorteio
import { Pokemon } from './Pokemon';

export class Player {
    id: number; 
    name: string; 
    avatar: string; 
    x: number = 0; 
    y: number = 0; 
    gold: number = 1000;
    items: {[key:string]:number} = {};
    cards: CardData[] = []; 
    team: Pokemon[] = [];
    
    skipTurns: number = 0; 
    badges: boolean[] = [false,false,false,false,false,false,false,false];

    // Controles de efeitos
    effects: { 
        slow?: number; 
        curse?: boolean; 
        extraTurn?: boolean; 
    } = {};

    constructor(id: number, name: string, avatarFile: string, isLoadMode: boolean) {
        this.id = id; this.name = name; 
        this.avatar = `/assets/img/Treinadores/${avatarFile}`;
        
        if(!isLoadMode && name !== "_LOAD_") {
            // 1. Recursos Iniciais
            this.gold = 1000;
            this.items = {
                'pokeball': 6, 
                'potion': 6,
                'revive': 3
            };

            // 2. Sorteio de 3 Cartas (Exceto Master Ball)
            const validCards = CARDS_DB.filter(c => c.id !== 'master');
            for(let i=0; i<3; i++) {
                const randomCard = validCards[Math.floor(Math.random() * validCards.length)];
                this.cards.push(randomCard);
            }

            // 3. Pokemon Inicial (com chance de Shiny)
            const starters = [1, 4, 7, 25]; 
            const randomStarterId = starters[Math.floor(Math.random() * starters.length)];
            const isStarterShiny = Math.random() < 0.02;
            this.team.push(new Pokemon(randomStarterId, 1, isStarterShiny)); 
        }
    }
    
    isDefeated() { return this.getBattleTeam(false).length === 0 || this.getBattleTeam(false).every(p => p.isFainted()); }
    
    // confirmar
    getBattleTeam(_isGymLimit: boolean) { 
        // Removemos o limite de 3! Agora retorna todos os vivos (até 6)
        return this.team.filter(p => !p.isFainted()).slice(0, 6); 
    }

    // CORREÇÃO: Reseta a flag de nível para permitir upar no próximo turno
    resetTurnFlags() { this.team.forEach(p => p.leveledUpThisTurn = false); }
}