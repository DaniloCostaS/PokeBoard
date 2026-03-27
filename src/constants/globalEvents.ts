import type { GlobalEvent } from './types';

export const GLOBAL_EVENTS: GlobalEvent[] = [
    { id: 'DROUGHT', icon: '☀️', name: 'Onda de Calor', desc: 'O sol está escaldante! Todos os Pokémon do tipo Fogo e Planta causam +25% de dano. Em contrapartida, os ataques do tipo Água perdem força e causam -25% de dano.' },
    { id: 'RAIN', icon: '🌧️', name: 'Chuva Torrencial', desc: 'Uma forte tempestade atinge o tabuleiro! Os tipos Água e Elétrico recebem um bônus de +25% no dano. O tipo Fogo fica enfraquecido e causa -25% de dano.' },
    { id: 'SANDSTORM', icon: '🌪️', name: 'Tempestade de Areia', desc: 'No início de qualquer batalha, os Pokémon que não são do tipo Pedra, Terra ou Aço perdem 10% do seu HP atual devido à forte tempestade de areia.' },
    { id: 'SHINY_FEVER', icon: '✨', name: 'Febre Shiny', desc: 'Eles estão por toda parte! Ao entrar em encontros selvagens, há incríveis +30% de chance bônus de esbarrar com um Pokémon Shiny muito raro!' },
    { id: 'LEGENDARY_FEVER', icon: '✨', name: 'Febre Lendária', desc: 'A energia cósmica atrai os deuses! Ao entrar no matinho, há impressionantes +30% de chance extra de você encontrar e batalhar contra um Pokémon Lendário selvagem!' },
    { id: 'GOLD_RUSH', icon: '💰', name: 'Dia de Pagamento', desc: 'É a hora de enriquecer! Todo o Ouro (G) recebido ao vencer batalhas (Selvagens, NPCs e Ginásios) e o salário por concluir uma volta no tabuleiro são totalmente DOBRADOS.' },
    { id: 'AIRDROP', icon: '🎒', name: 'Chuva de Suprimentos', desc: 'Fique de olho no céu! Ao cair em casas vazias normais do tabuleiro, você tem 33% de chance de encontrar um item gratuito aleatório.' },
    { id: 'BLOOD_MOON', icon: '🌑', name: 'Lua Sangrenta', desc: 'Cuidado extra! As taxas de armadilhas inimigas sobem para 40%. No PvP, o roubo de ouro salta para 60%. Além disso, Fantasmas e Noturnos ganham +20% de Dano!' },
    { id: 'EMP', icon: '📡', name: 'Tempestade EMP', desc: 'Todos os equipamentos pifaram! É estritamente PROIBIDO usar qualquer Cartão de Batalha (bloqueados) e todos os Centros Pokémon do tabuleiro ficam inacessíveis (fechados para cura).' },
    { id: 'ROCKET', icon: '🚀', name: 'Invasão Rocket', desc: 'Eles dominaram o mercado! Os preços da Loja do jogo são DOBRADOS. Além disso, se você perder uma batalha contra Selvagem ou NPC, a Equipe Rocket irá emboscar e roubar 1 Pokémon seu!' },

    // ==========================================
    // NOVOS EVENTOS CAÓTICOS
    // ==========================================
    { id: 'TAX_SEASON', icon: '📜', name: 'Imposto de Renda', desc: 'A Receita Federal te achou! Ao iniciar o evento, TODOS os jogadores perdem exatamente a metade (arredondada para baixo) de suas cartas e de seus itens da mochila.' },
    { id: 'SPATIAL_RIFT', icon: '🌌', name: 'Fenda Espacial', desc: 'O espaço-tempo está instável! O dado não dita mais quantos passos você dá, mas sim para qual coordenada aleatória do mapa você será teletransportado!' },
    { id: 'SAFARI_ZONE', icon: '🪤', name: 'Zona Safari Global', desc: 'A temporada de caça está aberta! Todas as Pokébolas ganham +50% de chance de captura, mas se a captura falhar, o Pokémon foge instantaneamente.' },
    { id: 'DOUBLE_STEP', icon: '🏃', name: 'Vento a Favor', desc: 'Os ventos sopram ao seu favor! O resultado de todos os dados rolados no tabuleiro é automaticamente DOBRADO, permitindo viagens muito mais rápidas.' },
    { id: 'QUICKSAND', icon: '⏳', name: 'Areia Movediça', desc: 'O terreno está afundando! O movimento de todos os jogadores é reduzido pela metade (arredondado para baixo). Cartas não evitam a lentidão.' },
    { id: 'TOXIC_SMOG', icon: '☠️', name: 'Névoa Tóxica', desc: 'Uma poluição densa cobre a região. Ataques do tipo Veneno e Inseto causam +25% de dano. Além disso, itens de cura recuperam apenas metade do HP normal.' },
    { id: 'WINTER_STORM', icon: '❄️', name: 'Nevasca Rigorosa', desc: 'Um frio congelante domina o mapa! Tipos Gelo causam +25% de dano. A Velocidade (Speed) de todos os outros tipos de Pokémon é reduzida em 30% nas batalhas.' },
    { id: 'MYSTIC_AURA', icon: '🔮', name: 'Aura Mística', desc: 'Uma energia estranha permeia o ar. Ataques do tipo Psíquico, Fantasma e Fada ganham 100% de Precisão (ignoram as chances de Esquiva e Bloqueio do inimigo).' },
    { id: 'BERSERK_MODE', icon: '💢', name: 'Fúria de Batalha', desc: 'A adrenalina subiu à cabeça! TODOS os ataques em qualquer batalha causam +50% de dano extra, mas o atacante sofre 20% de dano de recuo (recoil) ao acertar.' },
    { id: 'EXP_BURST', icon: '📈', name: 'Chuva de Experiência', desc: 'O conhecimento está no ar! Todo o XP recebido ao final das batalhas é TRIPLICADO.' },
    { id: 'LOTTERY_DAY', icon: '🎰', name: 'Sorteio da Loteria', desc: 'As casas de Evento patrocinaram o jogo! Cair em um Evento (???) não causa os efeitos normais; em vez disso, o jogador ganha 500G e uma carta aleatória instantaneamente.' },
    { id: 'CARD_FESTIVAL', icon: '🃏', name: 'Festival de Cartas', desc: 'Os Mestres de Cartas estão generosos! Sempre que um jogador vencer qualquer tipo de batalha, ele recebe uma Carta garantida como recompensa extra.' },
    { id: 'ROBIN_HOOD', icon: '🎁', name: 'Ajuda Humanitária', desc: 'Um benfeitor misterioso está distribuindo recursos! Jogadores que iniciarem o turno com menos de 200G ou 0 cartas recebem +800G e 5 Cartas grátis.' },
    { id: 'GYM_RUSH', icon: '🏛️', name: 'Desafio dos Líderes', desc: 'A Liga Pokémon abriu as portas! Se o jogador vencer um Ginásio, ele não encerra o turno e pode jogar o dado de novo imediatamente.' },
    { id: 'POKERUS_OUTBREAK', icon: '🦠', name: 'Surto de Pokérus', desc: 'O famoso vírus benigno se espalhou! Toda vez que um Pokémon subir de nível durante este evento, ele ganha +3 pontos extras de bônus em seus status.' },
    { id: 'TRUCO_SEIS', icon: '🃏', name: 'Truco - Seeeiiisss!', desc: 'Gritaram TRUCO! Todos os jogadores descartam cartas aleatoriamente até ficarem com no máximo 6 cartas na mão.' },
    { id: 'GYM_VACATION', icon: '🏖️', name: 'Férias Coletivas', desc: 'Os Líderes de Ginásio foram viajar! Durante este evento, as portas de todos os Ginásios estão trancadas e as batalhas de Líder não podem ser iniciadas.' },
    { id: 'MEGA_BLOCK', icon: '🚫', name: 'Bloqueio Mega', desc: 'Uma estranha força cancelou o poder das Pedras Mega! Nenhum Pokémon conseguirá Mega Evoluir em batalha enquanto esta anomalia estiver ativa.' },
    { id: 'SOUL_LINK', icon: '👻', name: 'Vínculo Sombrio', desc: 'A alma dos seus Pokémons está ligada ao seu baralho! Toda vez que um Pokémon do seu time desmaiar em combate, você perderá 1 Carta aleatória da sua mão.' }
];