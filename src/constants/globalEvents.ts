import type { GlobalEvent } from './types';

export const GLOBAL_EVENTS: GlobalEvent[] = [
    { id: 'DROUGHT', icon: '☀️', name: 'Onda de Calor', desc: 'Fogo/Planta +25% Dano. Água -25%.' },
    { id: 'RAIN', icon: '🌧️', name: 'Chuva Torrencial', desc: 'Água/Elétrico +25% Dano. Fogo -25%.' },
    { id: 'SANDSTORM', icon: '🌪️', name: 'Tempestade Areia', desc: 'Não-Pedra/Terra/Aço perdem 10% HP no início da luta.' },
    { id: 'SHINY_FEVER', icon: '✨', name: 'Febre Shiny', desc: 'Surtos de Shinys na natureza!' },
    { id: 'GOLD_RUSH', icon: '💰', name: 'Dia de Pagamento', desc: 'Recompensas em Ouro x2 em vitórias!' },
    { id: 'AIRDROP', icon: '🎒', name: 'Chuva de Suprimentos', desc: 'Casas vazias podem conter itens gratuitos!' },
    { id: 'BLOOD_MOON', icon: '🌑', name: 'Lua Sangrenta', desc: 'Fantasma/Noturno +20% Dano. Roubos (PvP/Trap) x2!' },
    { id: 'EMP', icon: '📡', name: 'Tempestade EMP', desc: 'Cartas e Centros Pokémon estão BLOQUEADOS!' },
    { id: 'ROCKET', icon: '🚀', name: 'Invasão Rocket', desc: 'Perder para selvagem faz eles roubarem um Pokémon seu!' }
];