import type { CardData } from '../constants';
import { CARDS_DB } from '../constants'; // Import necessário para o sorteio
import { Pokemon } from './Pokemon';

export class Player {
    id: number; 
    name: string; 
    avatar: string; 
    x: number = 0; 
    y: number = 0; 
    gold: number = 500;
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
        lureShiny?: number;
        doubleXp?: number;
        expShare?: number;
        lastBonusRound?: number;
    } = {};

    // --- NOVA ESTRUTURA PARA A POKÉDEX FUTURA ---
    pokedexData: { [id: number]: { seen: number, caught: number, defeated: number } } = {};
    // --------------------------------------------

    constructor(id: number, name: string, avatarFile: string, isLoadMode: boolean) {
        this.id = id; this.name = name; 
        this.avatar = `/assets/img/Treinadores/${avatarFile}`;
        this.effects = { slow: 0, curse: false, extraTurn: false, lureShiny: 0, doubleXp: 0, expShare: 0 };
        
        if(!isLoadMode && name !== "_LOAD_") {
            // 1. Recursos Iniciais
            this.gold = 500;
            this.items = {
                'pokeball': 6,
                'potion': 6,
                'revive': 3
            };

            // 2. Sorteio de 5 Cartas (Exceto Master Ball)
            const validCards = CARDS_DB.filter(c => c.id !== 'master');
            for(let i=0; i<5; i++) {
                const randomCard = validCards[Math.floor(Math.random() * validCards.length)];
                this.cards.push(randomCard);
            }
            
            // remover depois, começar con todas as cartas.
            //this.cards = JSON.parse(JSON.stringify(CARDS_DB));

            // 3. Pokemon Inicial (com chance de Shiny)
            const starters = [1, 4, 7, 152, 155, 158, 252, 255, 258, 387, 390, 393, 650, 653, 656, 722, 725, 728, 810, 813, 816, 906, 909, 912]; 
            const randomStarterId = starters[Math.floor(Math.random() * starters.length)];
            const isStarterShiny = Math.random() < 0.02;
            this.team.push(new Pokemon(randomStarterId, 1, isStarterShiny)); 

            // ==============================================================
            // NOVO: POKÉDEX (Registra o Inicial como Visto e Capturado)
            // ==============================================================
            this.pokedexData[randomStarterId] = { seen: 1, caught: 1, defeated: 0 };
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