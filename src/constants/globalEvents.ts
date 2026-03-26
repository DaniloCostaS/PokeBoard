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
    { id: 'ROCKET', icon: '🚀', name: 'Invasão Rocket', desc: 'Eles dominaram o mercado! Os preços da Loja do jogo são DOBRADOS. Além disso, se você perder uma batalha contra Selvagem ou NPC, a Equipe Rocket irá emboscar e roubar 1 Pokémon seu!' }
];