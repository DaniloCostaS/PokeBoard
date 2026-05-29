import { CARDS_DB } from './cards';

export interface QuestData {
    id: number;
    name: string;
    desc: string;
    target: number;
    multiTargets?: { key: string; label: string; target: number }[];
    rewardDesc: string;
    rarity: 'Comum' | 'Incomum' | 'Rara' | 'Épica';
    triggerType: string;
    onComplete: (player: any) => void;
}

// Banco de dados de Quests
export const QUESTS_DB: QuestData[] = [
    // 🟢 COMUNS
    {
        id: 1,
        name: "Pesquisador Iniciante",
        desc: "Capture 2 Pokémon selvagens.",
        target: 2,
        rewardDesc: "300G + 1 Great Ball",
        rarity: "Comum",
        triggerType: "CAPTURE_WILD",
        onComplete: (player: any) => {
            player.gold += 300;
            const GameEvents = (window as any).GameEvents;
            if (GameEvents) GameEvents.addItem(player, 'greatball', 1);
            else { player.items['greatball'] = (player.items['greatball'] || 0) + 1; }
        }
    },
    {
        id: 2,
        name: "Assistente do Professor",
        desc: "Capture 1 Pokémon de um tipo específico (Sorteado ao obter a quest).",
        target: 1,
        rewardDesc: "500G + 1 Great Ball",
        rarity: "Comum",
        triggerType: "CAPTURE_TYPE_SPECIFIC",
        onComplete: (player: any) => {
            player.gold += 500;
            const GameEvents = (window as any).GameEvents;
            if (GameEvents) GameEvents.addItem(player, 'greatball', 1);
            else { player.items['greatball'] = (player.items['greatball'] || 0) + 1; }
        }
    },
    {
        id: 3,
        name: "Mochileiro",
        desc: "Ande 18 casas no mapa sem voltar nenhuma casa (Moonwalker reseta).",
        target: 18,
        rewardDesc: "1 Carta MOVE (Comum)",
        rarity: "Comum",
        triggerType: "WALK_STEPS",
        onComplete: (player: any) => {
            const moveCards = CARDS_DB.filter(c => c.type === 'move' && c.rarity === 'Comum');
            if (moveCards.length > 0) {
                const card = moveCards[Math.floor(Math.random() * moveCards.length)];
                player.cards.push(card);
            }
        }
    },
    {
        id: 4,
        name: "Pesquisador de Campo",
        desc: "Termine o movimento em Água, Terra e Grama ao longo do jogo.",
        target: 3,
        rewardDesc: "3 Great Balls + Carta Aleatória",
        rarity: "Comum",
        triggerType: "BIOME_VISIT",
        onComplete: (player: any) => {
            const GameEvents = (window as any).GameEvents;
            if (GameEvents) GameEvents.addItem(player, 'greatball', 3);
            else { player.items['greatball'] = (player.items['greatball'] || 0) + 3; }

            const Cards = (window as any).Cards;
            if (Cards) Cards.draw(player, true);
        }
    },
    {
        id: 5,
        name: "Caçador Local",
        desc: "Derrote 2 Pokémon selvagens.",
        target: 2,
        rewardDesc: "500G",
        rarity: "Comum",
        triggerType: "DEFEAT_WILD",
        onComplete: (player: any) => {
            player.gold += 500;
        }
    },
    {
        id: 6,
        name: "Defesa Básica",
        desc: "Bloqueie ou esquive 1 ataque.",
        target: 1,
        rewardDesc: "1 Carta Comum",
        rarity: "Comum",
        triggerType: "DEFEND_ATTACK",
        onComplete: (player: any) => {
            const Cards = (window as any).Cards;
            if (Cards) Cards.drawSpecificRarity(player, 'Comum');
        }
    },
    {
        id: 7,
        name: "Colecionador",
        desc: "Pegue 3 itens pelo mapa (Eventos/Loteria).",
        target: 3,
        rewardDesc: "500G + 1 Item Aleatório",
        rarity: "Comum",
        triggerType: "GET_ITEM_MAP",
        onComplete: (player: any) => {
            player.gold += 500;
            const GameEvents = (window as any).GameEvents;
            if (GameEvents && GameEvents.giveRandomItem) GameEvents.giveRandomItem(player, 1);
            else { player.items['potion'] = (player.items['potion'] || 0) + 1; }
        }
    },
    {
        id: 8,
        name: "Economista",
        desc: "Termine um turno com 1500G ou mais em caixa.",
        target: 1,
        rewardDesc: "1 Item Aleatório",
        rarity: "Comum",
        triggerType: "END_TURN_GOLD_1500",
        onComplete: (player: any) => {
            const GameEvents = (window as any).GameEvents;
            if (GameEvents && GameEvents.giveRandomItem) GameEvents.giveRandomItem(player, 1);
            else { player.items['potion'] = (player.items['potion'] || 0) + 1; }
        }
    },
    {
        id: 9,
        name: "Azarão",
        desc: "Perca 5 turnos acumulados.",
        target: 5,
        rewardDesc: "1 Carta Comum + 1 Super Poção",
        rarity: "Comum",
        triggerType: "LOSE_TURN",
        onComplete: (player: any) => {
            const Cards = (window as any).Cards;
            if (Cards) Cards.drawSpecificRarity(player, 'Comum');

            const GameEvents = (window as any).GameEvents;
            if (GameEvents) GameEvents.addItem(player, 'super_potion', 1);
            else { player.items['super_potion'] = (player.items['super_potion'] || 0) + 1; }
        }
    },

    // 🔵 INCOMUNS
    {
        id: 10,
        name: "Frenesi",
        desc: "Vença 3 batalhas seguidas sem derrota total ou fuga.",
        target: 3,
        rewardDesc: "1000G + Carta Incomum",
        rarity: "Incomum",
        triggerType: "WIN_STREAK",
        onComplete: (player: any) => {
            player.gold += 1000;
            const Cards = (window as any).Cards;
            if (Cards) Cards.drawSpecificRarity(player, 'Incomum');
        }
    },

    {
        id: 12,
        name: "Limpeza Urbana",
        desc: "Derrote 2 NPC Rockets (TILE.ROCKET).",
        target: 2,
        rewardDesc: "1200G + Carta Incomum",
        rarity: "Incomum",
        triggerType: "DEFEAT_ROCKET",
        onComplete: (player: any) => {
            player.gold += 1200;
            const Cards = (window as any).Cards;
            if (Cards) Cards.drawSpecificRarity(player, 'Incomum');
        }
    },
    {
        id: 13,
        name: "Fortaleza",
        desc: "Bloqueie 3 ataques acumulados.",
        target: 3,
        rewardDesc: "Item Leftovers + 1 Hiper Poção",
        rarity: "Incomum",
        triggerType: "BLOCK_ATTACK",
        onComplete: (player: any) => {
            const GameEvents = (window as any).GameEvents;
            if (GameEvents) {
                GameEvents.addItem(player, 'leftovers', 1);
                GameEvents.addItem(player, 'hyper_potion', 1);
            } else {
                player.items['leftovers'] = (player.items['leftovers'] || 0) + 1;
                player.items['hyper_potion'] = (player.items['hyper_potion'] || 0) + 1;
            }
        }
    },
    {
        id: 14,
        name: "Investidor",
        desc: "Inicie e termine 5 turnos consecutivos mantendo 2500G ou mais.",
        target: 5,
        rewardDesc: "Carta Incomum",
        rarity: "Incomum",
        triggerType: "TURN_GOLD_2500_STREAK",
        onComplete: (player: any) => {
            const Cards = (window as any).Cards;
            if (Cards) Cards.drawSpecificRarity(player, 'Incomum');
        }
    },
    {
        id: 15,
        name: "Precisão Máxima",
        desc: "Capture 1 Pokémon na primeira Pokébola lançada no combate.",
        target: 1,
        rewardDesc: "1 Ultra Ball",
        rarity: "Incomum",
        triggerType: "FIRST_BALL_CAPTURE",
        onComplete: (player: any) => {
            const GameEvents = (window as any).GameEvents;
            if (GameEvents) GameEvents.addItem(player, 'ultraball', 1);
            else { player.items['ultraball'] = (player.items['ultraball'] || 0) + 1; }
        }
    },
    {
        id: 16,
        name: "Azarão Master",
        desc: "Perca 10 turnos acumulados.",
        target: 10,
        rewardDesc: "1 Carta Comum + Carta Incomum",
        rarity: "Incomum",
        triggerType: "LOSE_TURN",
        onComplete: (player: any) => {
            const Cards = (window as any).Cards;
            if (Cards) {
                Cards.drawSpecificRarity(player, 'Comum');
                Cards.drawSpecificRarity(player, 'Incomum');
            }
        }
    },

    // 🟣 RARAS
    {
        id: 17,
        name: "Duelo de Honra",
        desc: "Vença 2 batalhas PvP.",
        target: 2,
        rewardDesc: "2000G + Carta Rara",
        rarity: "Rara",
        triggerType: "WIN_PVP",
        onComplete: (player: any) => {
            player.gold += 2000;
            const Cards = (window as any).Cards;
            if (Cards) Cards.drawSpecificRarity(player, 'Rara');
        }
    },
    {
        id: 18,
        name: "Sobrevivente",
        desc: "Vença 3 NPCs sem perder nenhum Pokémon do time na batalha.",
        target: 3,
        rewardDesc: "Carta Épica",
        rarity: "Rara",
        triggerType: "WIN_NPC_NO_FAINT",
        onComplete: (player: any) => {
            const Cards = (window as any).Cards;
            if (Cards) Cards.drawSpecificRarity(player, 'Épica');
        }
    },
    {
        id: 19,
        name: "Alquimista",
        desc: "Faça Fusão e Sacrifício de cartas na mesma partida.",
        target: 2, // 1 fusão e 1 sacrifício
        multiTargets: [
            { key: 'fusion', label: 'Fusão', target: 1 },
            { key: 'sacrifice', label: 'Sacrifício', target: 1 }
        ],
        rewardDesc: "Carta Cadeado",
        rarity: "Rara",
        triggerType: "FUSION_AND_SACRIFICE",
        onComplete: (player: any) => {
            const GameEvents = (window as any).GameEvents;
            if (GameEvents) GameEvents.addItem(player, 'cadeado', 1);
        }
    },
    {
        id: 20,
        name: "Estrategista",
        desc: "Vença uma batalha usando um Pokémon com nível inferior ao do oponente.",
        target: 1,
        rewardDesc: "2 cartas Rare Candy",
        rarity: "Rara",
        triggerType: "WIN_UNDERLEVELED",
        onComplete: (player: any) => {
            const CardsDB = (window as any).CARDS_DB;
            if (CardsDB) {
                const rareCandyCard = CardsDB.find((c: any) => c.id === 'rarecandy');
                if (rareCandyCard) {
                    player.cards.push({ ...rareCandyCard });
                    player.cards.push({ ...rareCandyCard });
                }
            }
        }
    },
    {
        id: 21,
        name: "Mestre da Pesca",
        desc: "Capture 3 Pokémon do tipo Água.",
        target: 3,
        rewardDesc: "1 Amulet Coin ou Leftovers",
        rarity: "Rara",
        triggerType: "CAPTURE_WATER",
        onComplete: (player: any) => {
            const GameEvents = (window as any).GameEvents;
            if (GameEvents) {
                const item = Math.random() > 0.5 ? 'amulet_coin' : 'leftovers';
                GameEvents.addItem(player, item, 1);
            }
        }
    },
    {
        id: 22,
        name: "Distúrbio Espacial",
        desc: "Seja sugado para outro local do mapa (Evento Vórtice/Katrina).",
        target: 1,
        rewardDesc: "Carta Rara",
        rarity: "Rara",
        triggerType: "VORTEX_TELEPORT",
        onComplete: (player: any) => {
            const Cards = (window as any).Cards;
            if (Cards) Cards.drawSpecificRarity(player, 'Rara');
        }
    },
    {
        id: 23,
        name: "Defesa Perfeita",
        desc: "Vença uma batalha inteira sem tomar nenhum ponto de dano.",
        target: 1,
        rewardDesc: "Carta Épica",
        rarity: "Rara",
        triggerType: "WIN_NO_DAMAGE",
        onComplete: (player: any) => {
            const Cards = (window as any).Cards;
            if (Cards) Cards.drawSpecificRarity(player, 'Épica');
        }
    },
    {
        id: 24,
        name: "Caçador de Tesouros",
        desc: "Caia em 5 casas de eventos.",
        target: 5,
        rewardDesc: "1500G + Carta Rara",
        rarity: "Rara",
        triggerType: "TILE_EVENT",
        onComplete: (player: any) => {
            player.gold += 1500;
            const Cards = (window as any).Cards;
            if (Cards) Cards.drawSpecificRarity(player, 'Rara');
        }
    },
    {
        id: 25,
        name: "Azarão Supremo",
        desc: "Perca 15 turnos acumulados.",
        target: 15,
        rewardDesc: "1 Carta Comum + Carta Incomum + Carta Rara",
        rarity: "Rara",
        triggerType: "LOSE_TURN",
        onComplete: (player: any) => {
            const Cards = (window as any).Cards;
            if (Cards) {
                Cards.drawSpecificRarity(player, 'Comum');
                Cards.drawSpecificRarity(player, 'Incomum');
                Cards.drawSpecificRarity(player, 'Rara');
            }
        }
    },

    // 🟠 ÉPICAS
    {
        id: 26,
        name: "Jornada do Herói",
        desc: "Sobreviva a 5 NPCs/Líderes sem que nenhum Pokémon do time desmaie.",
        target: 5,
        rewardDesc: "Carta Lendária",
        rarity: "Épica",
        triggerType: "WIN_NPC_NO_FAINT",
        onComplete: (player: any) => {
            const Cards = (window as any).Cards;
            if (Cards) Cards.drawSpecificRarity(player, 'Lendária');
        }
    },
    {
        id: 27,
        name: "Caçada Lendária",
        desc: "Capture um Pokémon lendário.",
        target: 1,
        rewardDesc: "Master Ball + Carta Rara",
        rarity: "Épica",
        triggerType: "CAPTURE_LEGENDARY",
        onComplete: (player: any) => {
            const GameEvents = (window as any).GameEvents;
            if (GameEvents) GameEvents.addItem(player, 'masterball', 1);
            else { player.items['masterball'] = (player.items['masterball'] || 0) + 1; }

            const Cards = (window as any).Cards;
            if (Cards) Cards.drawSpecificRarity(player, 'Rara');
        }
    },
    {
        id: 28,
        name: "Ressonância Suprema",
        desc: "Obtenha 30%+ de Ressonância (4 capturas iguais) com um Pokémon.",
        target: 1,
        rewardDesc: "10 Vitaminas",
        rarity: "Épica",
        triggerType: "RESONANCE_30",
        onComplete: (player: any) => {
            const GameEvents = (window as any).GameEvents;
            if (GameEvents) GameEvents.addItem(player, 'vitamina', 10);
            else { player.items['vitamina'] = (player.items['vitamina'] || 0) + 10; }
        }
    },
    {
        id: 29,
        name: "Rei da Arena",
        desc: "Vença 3 PvPs seguidos (sem perder nenhum PvP no meio).",
        target: 3,
        rewardDesc: "Carta Épica + 2000G",
        rarity: "Épica",
        triggerType: "WIN_PVP_STREAK",
        onComplete: (player: any) => {
            player.gold += 2000;
            const Cards = (window as any).Cards;
            if (Cards) Cards.drawSpecificRarity(player, 'Épica');
        }
    },
    {
        id: 30,
        name: "Dominador Regional",
        desc: "Derrote 2 líderes de ginásio seguidos (sem lutar com selvagens/NPCs no meio).",
        target: 2,
        rewardDesc: "Carta Épica + 2000G",
        rarity: "Épica",
        triggerType: "WIN_GYM_STREAK",
        onComplete: (player: any) => {
            player.gold += 2000;
            const Cards = (window as any).Cards;
            if (Cards) Cards.drawSpecificRarity(player, 'Épica');
        }
    },
    {
        id: 31,
        name: "Azarão Lendário",
        desc: "Perca 25 turnos acumulados.",
        target: 25,
        rewardDesc: "Cartas Comum + Incomum + Rara + Épica",
        rarity: "Épica",
        triggerType: "LOSE_TURN",
        onComplete: (player: any) => {
            const Cards = (window as any).Cards;
            if (Cards) {
                Cards.drawSpecificRarity(player, 'Comum');
                Cards.drawSpecificRarity(player, 'Incomum');
                Cards.drawSpecificRarity(player, 'Rara');
                Cards.drawSpecificRarity(player, 'Épica');
            }
        }
    },
    {
        id: 32,
        name: "Magnata",
        desc: "Acumule 10000G na partida.",
        target: 10000,
        rewardDesc: "Carta Épica + Item Aleatório",
        rarity: "Épica",
        triggerType: "GOLD_ACCUMULATED",
        onComplete: (player: any) => {
            const Cards = (window as any).Cards;
            if (Cards) Cards.drawSpecificRarity(player, 'Épica');
            const GameEvents = (window as any).GameEvents;
            if (GameEvents && GameEvents.giveRandomItem) GameEvents.giveRandomItem(player, 1);
            else { player.items['potion'] = (player.items['potion'] || 0) + 1; }
        }
    }
];
