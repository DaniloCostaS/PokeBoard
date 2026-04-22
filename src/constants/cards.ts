import type { CardData } from './types';

export const CARDS_DB: CardData[] = [
    // Cartas de movimento
    { id: 'dice', name: "Dado Mágico", icon: "🎲", desc: "Escolha o nº do dado (1-20).", type: 'move', probability: 60 },
    { id: 'reroll', name: "Re-Roll", icon: "🔄", desc: "Rola o dado duas vezes e escolhe o melhor resultado.", type: 'move', probability: 80 },
    { id: 'boost', name: "Tênis de Corrida", icon: "👟", desc: "Avança +6 casas após a rolagem.", type: 'move', probability: 100 },
    { id: 'time', name: "Controle do Tempo", icon: "⏳", desc: "Jogue novamente após este turno.", type: 'move', probability: 100 },
    { id: 'shiny', name: "Lure Shiny", icon: "✨", desc: "As próximas 3 rodadas sua chance de Shiny aumenta para 15%.", type: 'move', probability: 50 },
    { id: 'doublexp', name: "Double XP", icon: "🚻", desc: "Seus próximos 5 ganhos de XP serão dobrados (XP do dado conta)", type: 'move', probability: 100 },
    { id: 'expshare', name: "Exp Share", icon: "🤩", desc: "Seus próximo 5 ganhos de XP serão igualmente distribuído para todo o time (XP do dado conta)", type: 'move', probability: 100 },

    // Cartas de dano em batalha
    { id: 'crit', name: "Super Crítico", icon: "💥", desc: "Dobra o dano causado dos próximos 3 ataques.", type: 'battle', probability: 100 },
    { id: 'focus', name: "Foco Total", icon: "🦭", desc: "Seu próximo ataque causará 400% de dano.", type: 'battle', probability: 70 },
    { id: 'sniper', name: "Sniper Americano", icon: "🎯", desc: "Durante essa batalha seus pokémon não erram golpes.", type: 'battle', probability: 70 },

    // Cartas de defesa em batalha
    { id: 'run', name: "Fumaça Ninja", icon: "💨", desc: "Foge de qualquer batalha instantaneamente.", type: 'battle', probability: 100 },
    { id: 'guard', name: "Escudo Protetor", icon: "🛡️", desc: "Reduz o dano recebido pela metade (Válido até seu pokémon vencer ou ser derrotado).", type: 'battle', probability: 60 },
    { id: 'status', name: "Ataque Surpresa", icon: "⚡", desc: "Aplica um efeito de atordoamento no pokémon do inimigo. Ele não atacará por 2 turnos", type: 'battle', probability: 70 },
    { id: 'heal', name: "Poção Máxima", icon: "💊", desc: "Recupera 100% do HP durante a batalha.", type: 'battle', probability: 50 },
    { id: 'counter', name: "Contra-Ataque", icon: "🔁", desc: "Reflete 50% do dano recebido dos próximos 3 ataques.", type: 'battle', probability: 100 },
    { id: 'mew', name: "DNA de Mew", icon: "🧬", desc: "Invoca um MEW para lutar ao seu lado nessa batalha (O nivel dele será o mesmo do seu pokémon ativo).", type: 'battle', probability: 40 },

    // Outras Cartas
    { id: 'master', name: "Master Ball", icon: "🟣", desc: "Captura 100% garantida usando qualquer pokebola (Só pode ser usado se tiver pokebola).", type: 'battle', probability: 30 },
    { id: 'holy_water', name: "Água Benta", icon: "🫗", desc: "Remova o efeito da maldição do seu jogador.", type: 'move', probability: 70 },
    { id: 'destiny', name: "Destino Selado", icon: "🌠", desc: "Se vencer a batalha, ganhe 2 recompensas (Gold/Carta).", type: 'battle', probability: 100 },

    // Cartas contra jogadores
    //{ id: 'trap', name: "Armadilha", icon: "🪤", desc: "Coloque em uma casa. Quem passar nela vai parar na armadilha e perde o próximo turno. Você vai receber 20% de gold de quem passou.", type: 'move', probability: 100 },
    { id: 'slow', name: "Campo Grudento", icon: "🕸️", desc: "Escolha um jogador: ele rola apenas 1d1 nos próximos 3 turnos.", type: 'move', probability: 80 },
    { id: 'swap', name: "Troca Rápida", icon: "🔀", desc: "Troque de posição com qualquer jogador.", type: 'move', probability: 80 },
    { id: 'rocket', name: "Equipe Rocket", icon: "🚀", desc: "Roube uma carta aleatória de outro jogador.", type: 'move', probability: 80 },
    { id: 'curse', name: "Maldição", icon: "☠️", desc: "Escolha um jogador: ele causa metade do dano na próxima batalha inteira contra líder de ginasio e não poderá usar itens.", type: 'move', probability: 70 },
    { id: 'trade_fail', name: "Troca Mal-Sucedida", icon: "❌", desc: "O jogador alvo perde os 3 próximos turnos.", type: 'move', probability: 70 },

    // Cartas de UP pokémon
    { id: 'rare_candy', name: "Rare Candy", icon: "🍬", desc: "Suba 1 nível de um pokémon de sua escolha.", type: 'move', probability: 50 },
    { id: 'evoluir', name: "Evolução forçada", icon: "🆙", desc: "Evolua um pokémon de sua escolha.", type: 'move', probability: 50 },
    { id: 'mega_stone', name: "Mega Pedra", icon: "💎", desc: "Mega evolui seu Pokémon durante a batalha.", type: 'move', probability: 50 },

    // Cartas de ativação automatica.  
    { id: 'jam', name: "Interferência", icon: "📡", desc: "Anula a carta que um jogador acabou de usar conta você (Ativado automaticamente).", type: 'auto', probability: 70 },
    { id: 'silvertape', name: "Silver Tape", icon: "🚷", desc: "Anula a carta Bolsa furada que um jogador acabou de usar conta você (Ativado automaticamente).", type: 'auto', probability: 30 },
    { id: 'no_troques', name: "Pokémon fiel", icon: "💝", desc: "Anula a carta Troca forçada que um jogador acabou de usar conta você (Ativado automaticamente).", type: 'auto', probability: 30 },
    { id: 'old_leader', name: "Líder Velho", icon: "💝", desc: "Anula a carta Novo líder que um jogador acabou de usar conta você (Ativado automaticamente).", type: 'auto', probability: 30 },

    // Cartas fortes
    { id: 'bag', name: "Bolsa furada", icon: "🎒", desc: "Escolha um jogador e ele vai perder metade dos seus itens aleatoriamente.", type: 'move', probability: 30 },
    { id: 'troques', name: "Troca forçada", icon: "🔛", desc: "Troque um pokémon seu com um de outro jogador.", type: 'move', probability: 30 },
    { id: 'new_leader', name: "Novo líder", icon: "⚔️", desc: "Escolha um jogador: Se vencer a batalha, pegue uma insígnia aleatória que ainda não tem do adversário.", type: 'move', probability: 30 },

    // Cartas Globais
    { id: 'communism', name: "Comunismo", icon: "♻️", desc: "Junta todas as cartas de todos os jogadores, embaralha e redistribui igualmente. As que sobrarem são destruídas.", type: 'global', probability: 10 },
    { id: 'imposto', name: "Imposto de Renda", icon: "📜", desc: "A Receita Federal te achou! TODOS os jogadores perdem exatamente a metade (espalhada aleatoriamente) de suas cartas e metade de todos os seus itens.", type: 'global', probability: 10 },

    // Cartas Troll
    { id: 'rodada180', name: "Rodada 180", icon: "🔞", desc: "Se o Alan jogar essa carta, a partida vai para a rodada 180, tornando ele um Deus e ele vence.", type: 'move', probability: 0 }
];