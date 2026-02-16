import type { CardData } from './types';

export const CARDS_DB: CardData[] = [
    { id: 'dice', name: "Dado Mágico", icon: "🎲", desc: "Escolha o nº do dado (1-20).", type: 'move' },
    { id: 'crit', name: "Super Crítico", icon: "💥", desc: "Dobra o dano causado (Válido até seu pokémon vencer ou ser derrotado).", type: 'battle' },
    { id: 'master', name: "Master Ball", icon: "🟣", desc: "Captura 100% garantida usando qualquer pokebola (Só pode ser usado se tiver pokebola).", type: 'battle' },
    { id: 'run', name: "Fumaça Ninja", icon: "💨", desc: "Foge de qualquer batalha instantaneamente.", type: 'battle' },
    { id: 'reroll', name: "Re-Roll", icon: "🔄", desc: "Rola o dado duas vezes e escolhe o melhor resultado.", type: 'move' },
    { id: 'boost', name: "Tênis de Corrida", icon: "👟", desc: "Avança +6 casas após a rolagem.", type: 'move' },
    { id: 'trap', name: "Armadilha", icon: "🪤", desc: "Coloque em uma casa. Quem cair nela perde 1 turno.", type: 'move' },
    { id: 'swap', name: "Troca Rápida", icon: "🔀", desc: "Troque de posição com qualquer jogador.", type: 'move' },
    { id: 'slow', name: "Campo Grudento", icon: "🕸️", desc: "Escolha um jogador: ele rola apenas 1d6 nos próximos 3 turnos.", type: 'move' },
    { id: 'guard', name: "Escudo Protetor", icon: "🛡️", desc: "Reduz o dano recebido pela metade (Válido até seu pokémon vencer ou ser derrotado).", type: 'battle' },
    { id: 'focus', name: "Foco Total", icon: "🎯", desc: "Seu próximo ataque causará 400% de dano.", type: 'battle' },
    { id: 'status', name: "Ataque Surpresa", icon: "⚡", desc: "Aplica um efeito de atordoamento no pokémon do inimigo. Ele não atacará por 2 turnos", type: 'battle' },
    { id: 'heal', name: "Poção Máxima", icon: "💊", desc: "Recupera 100% do HP durante a batalha.", type: 'battle' },
    { id: 'counter', name: "Contra-Ataque", icon: "🔁", desc: "Reflete 50% do dano recebido dos próximos 3 ataques.", type: 'battle' },
    { id: 'rocket', name: "Equipe Rocket", icon: "🚀", desc: "Roube uma carta aleatória de outro jogador.", type: 'move' },
    { id: 'jam', name: "Interferência", icon: "📡", desc: "Anula a carta que um jogador acabou de usar conta você (Ativado automaticamente).", type: 'auto' },
    { id: 'curse', name: "Maldição", icon: "☠️", desc: "Escolha um jogador: ele causa metade do dano na próxima batalha inteira.", type: 'move' },
    { id: 'trade_fail', name: "Troca Mal-Sucedida", icon: "❌", desc: "O jogador alvo perde o próximo turno.", type: 'move' },
    { id: 'mew', name: "DNA de Mew", icon: "🧬", desc: "Invoca um MEW para lutar ao seu lado nessa batalha (O nivel dele será o mesmo do seu pokémon ativo).", type: 'battle' },
    { id: 'time', name: "Controle do Tempo", icon: "⏳", desc: "Jogue novamente após este turno.", type: 'move' },
    { id: 'destiny', name: "Destino Selado", icon: "🌠", desc: "Se vencer a batalha, ganhe 2 recompensas (Gold/Carta).", type: 'battle' },
    { id: 'new_leader', name: "Novo líder", icon: "⚔️", desc: "Escolha um jogador: Se vencer a batalha, pegue uma insígnia que ainda não tem do adversário.", type: 'move' }
];
