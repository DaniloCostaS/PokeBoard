import type { CardData } from '../constants';
import { CARDS_DB } from '../constants'; // Import necessário para o sorteio
import { Pokemon } from './Pokemon';
import { POKEDEX } from '../constants/pokedex';

export class Player {
    id: number;
    name: string;
    avatar: string;
    x: number = 0;
    y: number = 0;
    gold: number = 500;
    items: { [key: string]: number } = {};
    cards: CardData[] = [];
    team: Pokemon[] = [];

    skipTurns: number = 0;
    isProcessingSkip: boolean = false; // Flag local para evitar múltiplos timers
    badges: boolean[] = [false, false, false, false, false, false, false, false];

    // Controles de efeitos
    effects: {
        slow?: number;
        curse?: boolean;
        extraTurn?: boolean;
        lureShiny?: number;
        doubleXp?: number;
        expShare?: number;
        lastBonusRound?: number;
        escapedGym?: boolean;
        offensiveCardsUsed?: number;
        robinHoodApplied?: boolean;
        moonwalker?: number;
        lureType?: { type: string, count: number };
        playedLegendary?: boolean;
        lastGiftRound?: number;
        tremembeUserTurns?: number;
        ashGoodbyeRemaining?: number;
    } = {};

    // --- ESTATÍSTICAS DE JOGO ---
    stats: {
        cardsUsed: number;        // somente cartas ofensivas usadas contra outros
        cardsSuffered: number;    // cartas ofensivas recebidas
        effectsReceived: Record<string, number>; // { 'Slow': 2, 'Curse': 1, ... }
        cardsDefended: Record<string, number>;   // { 'Interferência': 3, 'Silver Tape': 1, ... }
        turnsLost: number;
    } = { cardsUsed: 0, cardsSuffered: 0, effectsReceived: {}, cardsDefended: {}, turnsLost: 0 };

    // --- NOVA ESTRUTURA PARA A POKÉDEX FUTURA ---
    pokedexData: { [id: number]: { seen: number, caught: number, defeated: number } } = {};
    // --------------------------------------------

    constructor(id: number, name: string, avatarFile: string, isLoadMode: boolean) {
        this.id = id; this.name = name;
        this.avatar = `/assets/img/Treinadores/${avatarFile}`;
        this.effects = { slow: 0, curse: false, extraTurn: false, lureShiny: 0, doubleXp: 0, expShare: 0 };

        if (!isLoadMode && name !== "_LOAD_") {
            // 1. Recursos Iniciais
            this.gold = 500;
            this.items = {
                'pokeball': 6,
                'potion': 6,
                'revive': 3
            };

            // 2. Sorteio de 5 Cartas (Exceto Master Ball)
            const validCards = CARDS_DB.filter(c => c.id !== 'master');
            for (let i = 0; i < 5; i++) {
                const roll = Math.floor(Math.random() * 100) + 1;
                let targetRarity = 'Comum';
                if (roll <= 8) targetRarity = 'Épica';
                else if (roll <= 26) targetRarity = 'Rara';
                else if (roll <= 54) targetRarity = 'Incomum';

                const possibleCards = validCards.filter((c: any) => c.rarity === targetRarity);
                const finalPool = possibleCards.length > 0 ? possibleCards : validCards;
                const randomCard = finalPool[Math.floor(Math.random() * finalPool.length)];
                this.cards.push(randomCard);
            }

            // remover depois, começar con todas as cartas.
            this.cards = JSON.parse(JSON.stringify(CARDS_DB));

            // 3. Pokemon Inicial (com chance de Shiny)
            // O Starter é inicializado como um Bulbasaur genérico aqui. 
            // Ele será substituído pelo starter correto de acordo com as configurações da partida
            // logo em seguida, seja no modo Offline (Setup.start) ou Online (quando o Host clica Iniciar).
            const randomStarterId = 1;
            this.team.push(new Pokemon(randomStarterId, 1, false));
            this.pokedexData[randomStarterId] = { seen: 1, caught: 1, defeated: 0 };
        }
    }

    assignStarter(settings: any) {
        this.team = [];

        let validStarters = [1, 4, 7, 152, 155, 158, 252, 255, 258, 387, 390, 393, 495, 498, 501, 650, 653, 656, 722, 725, 728, 810, 813, 816, 906, 909, 912];

        if (settings.legendaries === 'only') {
            validStarters = POKEDEX.filter((p: any) => p.isLegendary && settings.generations.includes(this.getGenById(p.id))).map((p: any) => p.id);
        } else {
            validStarters = validStarters.filter(id => {
                const p = POKEDEX.find((poke: any) => poke.id === id);
                if (!p) return false;
                return settings.generations.includes(this.getGenById(id));
            });
        }

        if (validStarters.length === 0) validStarters = [133]; // Eevee fallback

        const randomStarterId = validStarters[Math.floor(Math.random() * validStarters.length)];
        let isStarterShiny = Math.random() < 0.02;

        this.team.push(new Pokemon(randomStarterId, 1, isStarterShiny));
        this.pokedexData[randomStarterId] = { seen: 1, caught: 1, defeated: 0 };
    }

    getGenById(id: number): number {
        if (id >= 10000) return 0;
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

    isDefeated() { return this.getBattleTeam(false).length === 0 || this.getBattleTeam(false).every(p => p.isFainted()); }

    // confirmar
    getBattleTeam(_isGymLimit: boolean) {
        // Removemos o limite de 3! Agora retorna todos os vivos (até 6)
        return this.team.filter(p => !p.isFainted()).slice(0, 6);
    }

    // CORREÇÃO: Reseta a flag de nível para permitir upar no próximo turno
    resetTurnFlags() { this.team.forEach(p => p.leveledUpThisTurn = false); }
}