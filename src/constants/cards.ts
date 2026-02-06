import type { CardData } from './types';

export const CARDS_DB: CardData[] = [
    { id: 'dice', name: "Dado Mágico", icon: "🎲", desc: "Escolha o nº do dado (1-20).", type: 'move' },
    { id: 'crit', name: "Super Crítico", icon: "💥", desc: "Dobra o dano do próximo ataque.", type: 'battle' },
    { id: 'master', name: "Master Ball", icon: "🟣", desc: "Captura 100% garantida.", type: 'battle' },
    { id: 'run', name: "Fumaça Ninja", icon: "💨", desc: "Foge de qualquer batalha instantaneamente.", type: 'battle' },
    { id: 'reroll', name: "Re-Roll", icon: "🔄", desc: "Rola o dado novamente e escolhe o melhor resultado.", type: 'move' },
    { id: 'boost', name: "Tênis de Corrida", icon: "👟", desc: "Avança +3 casas após a rolagem.", type: 'move' },
    { id: 'trap', name: "Armadilha", icon: "🪤", desc: "Coloque em uma casa. Quem cair nela perde 1 turno.", type: 'move' },
    { id: 'swap', name: "Troca Rápida", icon: "🔀", desc: "Troque de posição com qualquer jogador.", type: 'move' },
    { id: 'slow', name: "Campo Grudento", icon: "🕸️", desc: "Escolha um jogador: ele rola apenas 1d6 no próximo turno.", type: 'move' },
    { id: 'guard', name: "Escudo Protetor", icon: "🛡️", desc: "Reduz o dano recebido pela metade.", type: 'battle' },
    { id: 'focus', name: "Foco Total", icon: "🎯", desc: "Seu próximo ataque não pode errar.", type: 'battle' },
    { id: 'status', name: "Ataque Surpresa", icon: "⚡", desc: "Aplica um efeito de status aleatório no inimigo.", type: 'battle' },
    { id: 'heal', name: "Poção Máxima", icon: "💊", desc: "Recupera 50% do HP durante a batalha.", type: 'battle' },
    { id: 'counter', name: "Contra-Ataque", icon: "🔁", desc: "Reflete 50% do dano recebido.", type: 'battle' },
    { id: 'rocket', name: "Equipe Rocket", icon: "🚀", desc: "Roube uma carta aleatória de outro jogador.", type: 'battle' },
    { id: 'jam', name: "Interferência", icon: "📡", desc: "Anule a carta que um jogador acabou de usar.", type: 'battle' },
    { id: 'curse', name: "Maldição", icon: "☠️", desc: "Escolha um jogador: ele causa metade do dano na próxima batalha.", type: 'battle' },
    { id: 'trade_fail', name: "Troca Mal-Sucedida", icon: "❌", desc: "O jogador alvo perde o próximo turno.", type: 'move' },
    { id: 'mew', name: "DNA de Mew", icon: "🧬", desc: "Copia o efeito de qualquer carta usada nesta rodada.", type: 'battle' },
    { id: 'time', name: "Controle do Tempo", icon: "⏳", desc: "Jogue novamente após este turno.", type: 'move' },
    { id: 'destiny', name: "Destino Selado", icon: "🌠", desc: "Se vencer a batalha, ganhe 2 recompensas (Gold/Carta).", type: 'battle' },
    { id: 'new_leader', name: "Novo líder", icon: "⚔️", desc: "Escolha um jogador: Se vencer a batalha, pegue uma insígnia que ainda não tem do adversário.", type: 'move' }
];