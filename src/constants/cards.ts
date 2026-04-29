import type { CardData } from './types';

export const CARDS_DB: CardData[] = [
    // Cartas de movimento
    { id: 'dice', name: "Dado Mágico", icon: "🎲", desc: "Escolha o nº do dado (1-20).", type: 'move', rarity: 'Rara' },
    { id: 'reroll', name: "Re-Roll", icon: "🔄", desc: "Rola o dado duas vezes e escolhe o melhor resultado.", type: 'move', rarity: 'Comum' },
    { id: 'boost', name: "Tênis de Corrida", icon: "👟", desc: "Avança +6 casas após a rolagem.", type: 'move', rarity: 'Comum' },
    { id: 'time', name: "Controle do Tempo", icon: "⏳", desc: "Jogue novamente após este turno.", type: 'move', rarity: 'Incomum' },
    { id: 'shiny', name: "Lure Shiny", icon: "✨", desc: "As próximas 3 rodadas sua chance de Shiny aumenta para 15%.", type: 'move', rarity: 'Rara' },
    { id: 'doublexp', name: "Double XP", icon: "🚻", desc: "Seus próximos 5 ganhos de XP serão dobrados (XP do dado conta)", type: 'move', rarity: 'Comum' },
    { id: 'expshare', name: "Exp Share", icon: "🤩", desc: "Seus próximo 5 ganhos de XP serão igualmente distribuído para todo o time (XP do dado conta)", type: 'move', rarity: 'Comum' },

    // Cartas de dano em batalha
    { id: 'crit', name: "Super Crítico", icon: "💥", desc: "Dobra o dano causado dos próximos 3 ataques.", type: 'battle', rarity: 'Comum' },
    { id: 'focus', name: "Foco Total", icon: "🦭", desc: "Seu próximo ataque causará 400% de dano.", type: 'battle', rarity: 'Incomum' },
    { id: 'sniper', name: "Sniper Americano", icon: "🎯", desc: "Durante essa batalha seus pokémon não erram golpes.", type: 'battle', rarity: 'Comum' },

    // Cartas de defesa em batalha
    { id: 'run', name: "Fumaça Ninja", icon: "💨", desc: "Foge de qualquer batalha instantaneamente.", type: 'battle', rarity: 'Comum' },
    { id: 'guard', name: "Escudo Protetor", icon: "🛡️", desc: "Reduz o dano recebido pela metade (Válido até seu pokémon vencer ou ser derrotado).", type: 'battle', rarity: 'Rara' },
    { id: 'status', name: "Ataque Surpresa", icon: "⚡", desc: "Aplica um efeito de atordoamento no pokémon do inimigo. Ele não atacará por 2 turnos", type: 'battle', rarity: 'Comum' },
    { id: 'heal', name: "Poção Máxima", icon: "💊", desc: "Recupera 100% do HP durante a batalha.", type: 'battle', rarity: 'Rara' },
    { id: 'counter', name: "Contra-Ataque", icon: "🔁", desc: "Reflete 100% do dano recebido dos próximos 3 ataques.", type: 'battle', rarity: 'Comum' },
    { id: 'mew', name: "DNA de Mew", icon: "🧬", desc: "Invoca um MEW para lutar ao seu lado nessa batalha (O nivel dele será o mesmo do seu pokémon ativo).", type: 'battle', rarity: 'Rara' },

    // Outras Cartas
    { id: 'master', name: "Master Ball", icon: "🟣", desc: "Captura 100% garantida usando qualquer pokebola (Só pode ser usado se tiver pokebola).", type: 'battle', rarity: 'Rara' },
    { id: 'holy_water', name: "Água Benta", icon: "🫗", desc: "Remova o efeito da maldição do seu jogador.", type: 'move', rarity: 'Incomum' },
    { id: 'destiny', name: "Destino Selado", icon: "🌠", desc: "Se vencer a batalha, ganhe 2 recompensas (Gold/Carta).", type: 'battle', rarity: 'Comum' },
    { id: 'illegal_adoption', name: "Sequestro Relampago", icon: "⚡", desc: "Durante uma batalha contra NPC ou Selvagem, troque um Pokemon do seu time por um do adversario.", type: 'battle', rarity: 'Rara' },
    { id: 'adotar_lixeira', name: "Segunda Chance", icon: "💚", desc: "Escolha um Pokémon da Lixeira para resgatar e adicionar ao seu time.", type: 'move', rarity: 'Rara' },

    // Cartas contra jogadores
    //{ id: 'trap', name: "Armadilha", icon: "🪤", desc: "Coloque em uma casa. Quem passar nela vai parar na armadilha e perde o próximo turno. Você vai receber 20% de gold de quem passou.", type: 'move', probability: 100 },
    { id: 'slow', name: "Campo Grudento", icon: "🕸️", desc: "Escolha um jogador: ele rola apenas 1d1 nos próximos 3 turnos.", type: 'move', rarity: 'Comum' },
    { id: 'swap', name: "Troca Rápida", icon: "🔀", desc: "Troque de posição com qualquer jogador.", type: 'move', rarity: 'Incomum' },
    { id: 'rocket', name: "Equipe Rocket", icon: "🚀", desc: "Roube uma carta aleatória de outro jogador.", type: 'move', rarity: 'Incomum' },
    { id: 'curse', name: "Maldição", icon: "☠️", desc: "Escolha um jogador: ele causa metade do dano na próxima batalha inteira contra líder de ginasio e não poderá usar itens.", type: 'move', rarity: 'Incomum' },
    { id: 'trade_fail', name: "Troca Mal-Sucedida", icon: "❌", desc: "O jogador alvo perde os 3 próximos turnos.", type: 'move', rarity: 'Rara' },

    // Cartas de UP pokémon
    { id: 'rare_candy', name: "Rare Candy", icon: "🍬", desc: "Suba 1 nível de um pokémon de sua escolha.", type: 'move', rarity: 'Incomum' },
    { id: 'evoluir', name: "Evolução forçada", icon: "🆙", desc: "Evolua um pokémon de sua escolha.", type: 'move', rarity: 'Incomum' },
    { id: 'mega_stone', name: "Mega Pedra", icon: "💎", desc: "Mega evolui seu Pokémon durante a batalha.", type: 'move', rarity: 'Épica' },
    { id: 'reclaim_mega_stone', name: "Recuperar Mega Pedra", icon: "⛏️", desc: "Remove a Mega Pedra de um dos SEUS Pokémon, e você ganha a carta Mega Pedra de volta no seu inventário.", type: 'move', rarity: 'Rara' },
    { id: 'steal_mega_stone', name: "Destruir Mega Pedra", icon: "💥", desc: "Destrói a Mega Pedra equipada em um Pokémon de outro jogador. Ninguém fica com a pedra.", type: 'move', rarity: 'Épica' },

    // Cartas de ativação automatica.  
    { id: 'jam', name: "Interferência", icon: "📡", desc: "Anula a carta que um jogador acabou de usar conta você (Ativado automaticamente).", type: 'auto', rarity: 'Rara' },
    { id: 'silvertape', name: "Silver Tape", icon: "🚷", desc: "Anula a carta Bolsa furada que um jogador acabou de usar conta você (Ativado automaticamente).", type: 'auto', rarity: 'Rara' },
    { id: 'no_troques', name: "Pokémon fiel", icon: "💝", desc: "Anula a carta Troca forçada que um jogador acabou de usar conta você (Ativado automaticamente).", type: 'auto', rarity: 'Épica' },
    { id: 'old_leader', name: "Líder Velho", icon: "💝", desc: "Anula a carta Novo líder que um jogador acabou de usar conta você (Ativado automaticamente).", type: 'auto', rarity: 'Rara' },

    // Cartas fortes
    { id: 'bag', name: "Bolsa furada", icon: "🎒", desc: "Escolha um jogador e ele vai perder metade dos seus itens aleatoriamente.", type: 'move', rarity: 'Rara' },
    { id: 'troques', name: "Troca forçada", icon: "🔛", desc: "Troque um pokémon seu com um de outro jogador.", type: 'move', rarity: 'Épica' },
    { id: 'new_leader', name: "Novo líder", icon: "⚔️", desc: "Escolha um jogador: Se vencer a batalha, pegue uma insígnia aleatória que ainda não tem do adversário.", type: 'move', rarity: 'Rara' },

    // Cartas Globais
    { id: 'communism', name: "Comunismo", icon: "♻️", desc: "Junta todas as cartas de todos os jogadores, embaralha e redistribui igualmente. As que sobrarem são destruídas.", type: 'global', rarity: 'Épica' },
    { id: 'imposto', name: "Imposto de Renda", icon: "📜", desc: "A Receita Federal te achou! TODOS os jogadores perdem exatamente a metade (espalhada aleatoriamente) de suas cartas e metade de todos os seus itens.", type: 'global', rarity: 'Épica' },

    // Cartas Troll
    //{ id: 'rodada180', name: "Rodada 180", icon: "🔞", desc: "Se o Alan jogar essa carta, a partida vai para a rodada 180, tornando ele um Deus e ele vence.", type: 'move', rarity: 'Troll' }
    { id: 'michael', name: "Moon Walker", icon: "💃", desc: "Escolha um jogador. Nos próximos 3 rolagens de dados para andar, ele vai andar o número para trás.", type: 'move', rarity: 'Rara' },
    { id: 'katrina', name: "Furacão Katrina", icon: "🌪️", desc: "Todos os jogadores são movidos para casas aleatórias no tabuleiro.", type: 'global', rarity: 'Rara' },
    { id: 'lure_type', name: "Lure Type", icon: "🆎", desc: "Escolha uma tipagem. Os próximos 2 selvagens que encontrar será da tipagem escolhida.", type: 'move', rarity: 'Incomum' },

    // Cartas Lendárias
    { id: 'supreme_bond', name: "Vínculo Supremo", icon: "🤝", desc: "Pokémon não te abandona jamais. Troca de pokémon, até mesmo outra carta lendária não pode remover o pokémon do jogador.", type: 'move', rarity: 'Lendária' },
    { id: 'ash_goodbye', name: "O Adeus de Ash", icon: "👋", desc: "Mande embora o pokémon de outro jogador, sem defesa, só não pode com Vínculo Supremo.", type: 'move', rarity: 'Lendária' },
    { id: 'tremembe', name: "Tremembé", icon: "⛓️", desc: "Todos os jogadores exceto você ficam 20 rodadas sem jogar.", type: 'global', rarity: 'Lendária' },
    { id: 'se_rj', name: "Sé/RJ", icon: "🔫", desc: "Todos os jogadores exceto você perdem todos os itens e todo o gold.", type: 'global', rarity: 'Lendária' },
    { id: 'cassino', name: "Cassino", icon: "🎰", desc: "Todos os jogadores exceto você perdem todas as cartas, menos as lendárias.", type: 'global', rarity: 'Lendária' },
    { id: 'legendary_encounter', name: "Encontro Lendário", icon: "🦅", desc: "Sortear 3 lendários e escolher um dos 3 para lutar.", type: 'move', rarity: 'Lendária' },
    { id: 'legendary_shiny', name: "Lendário Shiny", icon: "🌟", desc: "Pode transformar um pokémon lendário do seu time em shiny (e recalcula o bônus).", type: 'move', rarity: 'Lendária' }
];