import type { GlobalEvent } from './types';

export const GLOBAL_EVENTS: GlobalEvent[] = [
    // Eventos climáticos — disponíveis do começo ao fim
    { id: 'DROUGHT',          icon: '☀️',  name: 'Onda de Calor',          minRound: 1,   maxRound: 999, desc: 'O sol está escaldante! Todos os Pokémon do tipo Fogo e Planta causam +25% de dano. Em contrapartida, os ataques do tipo Água perdem força e causam -25% de dano.' },
    { id: 'RAIN',             icon: '🌧️', name: 'Chuva Torrencial',        minRound: 1,   maxRound: 999, desc: 'Uma forte tempestade atinge o tabuleiro! Os tipos Água e Elétrico recebem um bônus de +25% no dano. O tipo Fogo fica enfraquecido e causa -25% de dano.' },
    { id: 'SANDSTORM',        icon: '🌪️', name: 'Tempestade de Areia',     minRound: 1,   maxRound: 999, desc: 'No início de qualquer batalha, os Pokémon que não são do tipo Pedra, Terra ou Aço perdem 10% do seu HP atual devido à forte tempestade de areia.' },
    { id: 'WINTER_STORM',     icon: '❄️',  name: 'Nevasca Rigorosa',        minRound: 1,   maxRound: 999, desc: 'Um frio congelante domina o mapa! Tipos Gelo causam incríveis +50% de dano. Em contrapartida, qualquer outro tipo de ataque causará -20% de dano devido à friaca.' },

    // Eventos de encontro — disponíveis cedo para aproveitar todo o jogo
    { id: 'SHINY_FEVER',      icon: '✨',  name: 'Febre Shiny',             minRound: 1,   maxRound: 999, desc: 'Eles estão por toda parte! Ao entrar em encontros selvagens, há incríveis +30% de chance bônus de esbarrar com um Pokémon Shiny muito raro!' },
    { id: 'LEGENDARY_FEVER',  icon: '✨',  name: 'Febre Lendária',          minRound: 5,   maxRound: 999, desc: 'A energia cósmica atrai os deuses! Ao entrar no matinho, há impressionantes +30% de chance extra de você encontrar e batalhar contra um Pokémon Lendário selvagem!' },
    { id: 'SAFARI_ZONE',      icon: '🪤',  name: 'Zona Safari Global',      minRound: 1,   maxRound: 999, desc: 'A temporada de caça está aberta! Todas as Pokébolas ganham absurdos +50% de chance de captura extra e não são gastas da Mochila ao serem lançadas (Uso infinito)!' },

    // Eventos econômicos
    { id: 'GOLD_RUSH',        icon: '💰',  name: 'Dia de Pagamento',        minRound: 1,   maxRound: 999, desc: 'É a hora de enriquecer! Todo o Ouro (G) recebido ao vencer batalhas (Selvagens, NPCs e Ginásios) e o salário por concluir uma volta no tabuleiro são totalmente DOBRADOS.' },
    { id: 'ROBIN_HOOD',       icon: '🎁',  name: 'Ajuda Humanitária',       minRound: 1,   maxRound: 150, desc: 'Um benfeitor misterioso está distribuindo recursos! Jogadores que iniciarem o turno com menos de 200G e menos de 2 cartas recebem +800G e 5 Cartas grátis.' },
    { id: 'ROCKET',           icon: '🚀',  name: 'Invasão Rocket',          minRound: 3,   maxRound: 999, desc: 'Eles dominaram o mercado! Os preços da Loja do jogo são DOBRADOS. Além disso, se você perder uma batalha contra Selvagem ou NPC, a Equipe Rocket irá emboscar e roubar 1 Pokémon seu!' },

    // Eventos de cartas
    { id: 'TAX_SEASON',       icon: '📜',  name: 'Imposto de Renda',        minRound: 5,   maxRound: 999, desc: 'A Receita Federal te achou! Ao iniciar o evento, TODOS os jogadores perdem exatamente a metade (arredondada para baixo) de suas cartas e de seus itens da mochila.' },
    { id: 'CARD_FESTIVAL',    icon: '🃏',  name: 'Festival de Cartas',      minRound: 1,   maxRound: 999, desc: 'Os Mestres de Cartas estão generosos! As recompensas de cartas após batalhas contra Selvagens (50% de chance de saque) ou NPCs (100% de chance) agora te premiam em DOBRO (Dão 2 Cartas)!' },
    { id: 'TRUCO_SEIS',       icon: '🃏',  name: 'Truco - Seeeiiisss!',     minRound: 3,   maxRound: 999, desc: 'Gritaram TRUCO! Todos os jogadores descartam cartas aleatoriamente até ficarem com no máximo 6 cartas na mão.' },

    // Eventos de movimento
    { id: 'SPATIAL_RIFT',     icon: '🌌',  name: 'Fenda Espacial',          minRound: 5,   maxRound: 999, desc: 'O espaço-tempo está instável! O dado não dita mais quantos passos você dá, mas sim para qual coordenada aleatória do mapa você será teletransportado!' },
    { id: 'DOUBLE_STEP',      icon: '🏃',  name: 'Vento a Favor',           minRound: 1,   maxRound: 999, desc: 'Os ventos sopram ao seu favor! O resultado de todos os dados rolados no tabuleiro é automaticamente DOBRADO, permitindo viagens muito mais rápidas.' },
    { id: 'QUICKSAND',        icon: '⏳',  name: 'Areia Movediça',          minRound: 1,   maxRound: 999, desc: 'O terreno está afundando! O movimento de todos os jogadores é reduzido pela metade (arredondado para baixo). Cartas não evitam a lentidão.' },

    // Eventos de batalha — mais interessantes em jogo avançado
    { id: 'BLOOD_MOON',       icon: '🌑',  name: 'Lua Sangrenta',           minRound: 5,   maxRound: 999, desc: 'Cuidado extra! As taxas de armadilhas inimigas sobem para 40%. No PvP, o roubo de ouro salta para 60%. Além disso, Fantasmas e Noturnos ganham +20% de Dano!' },
    { id: 'EMP',              icon: '📡',  name: 'Tempestade EMP',          minRound: 3,   maxRound: 999, desc: 'Todos os equipamentos pifaram! É estritamente PROIBIDO usar qualquer Cartão de Batalha (bloqueados) e todos os Centros Pokémon do tabuleiro ficam inacessíveis (fechados para cura).' },
    { id: 'BERSERK_MODE',     icon: '💢',  name: 'Fúria de Batalha',        minRound: 3,   maxRound: 999, desc: 'A adrenalina subiu à cabeça! TODOS os ataques em qualquer batalha causam o DOBRO de dano (100% de bônus), tornando os combates extremamente rápidos e letais!' },
    { id: 'TOXIC_SMOG',       icon: '☠️',  name: 'Névoa Tóxica',            minRound: 3,   maxRound: 999, desc: 'Uma poluição densa cobre a região. Ao final de cada rodada nas batalhas, Pokémons que não tiverem o tipo Venenoso ou Aço perdem 10% de seu HP Máximo devido ao sufocamento.' },
    { id: 'SOUL_LINK',        icon: '👻',  name: 'Vínculo Sombrio',         minRound: 5,   maxRound: 999, desc: 'Nossos espíritos estão conectados! Por conta de uma força misteriosa, todo e qualquer ataque desferido sofrerá automaticamente 30% do dano causado retornado como dano de reflexão (Recoil) ao atacante!' },

    // Eventos de ginásio
    { id: 'GYM_RUSH',         icon: '🏛️', name: 'Desafio dos Líderes',     minRound: 3,   maxRound: 999, desc: 'A Liga Pokémon abriu as portas! Ao cair em um Ginásio, todos os seus Pokémon são curados antes da batalha. Se você vencer, ganha 1 Carta!' },
    { id: 'GYM_VACATION',     icon: '🏖️', name: 'Férias Coletivas',        minRound: 1,   maxRound: 999, desc: 'Os Líderes de Ginásio foram viajar! Durante este evento, as portas de todos os Ginásios estão trancadas e as batalhas de Líder não podem ser iniciadas.' },

    // Eventos de progressão — só fazem sentido com times mais desenvolvidos
    { id: 'EXP_BURST',        icon: '📈',  name: 'Chuva de Experiência',    minRound: 1,   maxRound: 999, desc: 'O conhecimento está no ar! Todo o XP recebido ao final das batalhas é DOBRADO.' },
    { id: 'POKERUS_OUTBREAK', icon: '🦠',  name: 'Surto de Pokérus',        minRound: 1,   maxRound: 150, desc: 'O famoso vírus benigno se espalhou! Toda vez que um Pokémon subir de nível durante este evento, ele ganha +5 pontos extras de bônus em seus status.' },
    { id: 'MEGA_BLOCK',       icon: '🚫',  name: 'Bloqueio Mega',           minRound: 10,  maxRound: 999, desc: 'Uma estranha força cancelou o poder das Pedras Mega! Nenhum Pokémon conseguirá Mega Evoluir em batalha enquanto esta anomalia estiver ativa.' },
    { id: 'MYSTIC_AURA',      icon: '🔮',  name: 'Aura Mística',            minRound: 1,   maxRound: 999, desc: 'Uma energia estranha permeia o ar. Ataques do tipo Psíquico e Fada ganham impressionantes +50% de dano extra devido à forte ressonância mágica.' },

    // Eventos de evento aleatório
    { id: 'LOTTERY_DAY',      icon: '🎰',  name: 'Sorteio da Loteria',      minRound: 1,   maxRound: 999, desc: 'As casas de Evento patrocinaram o jogo! Cair em um Evento (???) não causa os efeitos normais; em vez disso, o jogador ganha 500G e uma carta aleatória instantaneamente.' },
];