/**
 * CONQUISTAS E COSMÉTICOS DA CONTA
 * Cada conquista olha para os contadores acumulados (profile_stats) e para o tamanho da Pokédex da conta.
 * Algumas liberam um título (aparece abaixo do nome) ou uma moldura de avatar.
 */
export type StatKey =
    | 'games_played' | 'games_won' | 'battles_won' | 'battles_lost'
    | 'wild_wins' | 'npc_wins' | 'gym_wins' | 'pvp_wins' | 'pvp_losses' | 'champion_wins'
    | 'catches' | 'shiny_catches' | 'legendary_catches' | 'evolutions' | 'megas'
    | 'badges' | 'cards_used' | 'items_used' | 'total_defeats' | 'lives_lost' | 'revives_used' | 'steps';

export type Stats = Partial<Record<StatKey, number>>;

export type Achievement = {
    id: string;
    name: string;
    desc: string;
    icon: string;
    goal: number;
    progress: (s: Stats, dex: number) => number;
    title?: string;
    frame?: string;
};

const stat = (k: StatKey) => (s: Stats) => Number(s[k] || 0);

export const ACHIEVEMENTS: Achievement[] = [
    { id: 'first_catch', name: 'Primeira captura', desc: 'Capture seu primeiro Pokémon.', icon: '🔴', goal: 1, progress: stat('catches'), frame: 'bronze' },
    { id: 'dex_50', name: 'Pesquisador', desc: 'Registre 50 espécies na Pokédex da conta.', icon: '📘', goal: 50, progress: (_, d) => d, title: 'Pesquisador' },
    { id: 'dex_151', name: 'Enciclopédia', desc: 'Registre 151 espécies.', icon: '📗', goal: 151, progress: (_, d) => d, title: 'Enciclopédia Viva' },
    { id: 'dex_400', name: 'Professor Pokémon', desc: 'Registre 400 espécies.', icon: '🎓', goal: 400, progress: (_, d) => d, title: 'Professor', frame: 'mestre' },
    { id: 'shiny_1', name: 'Brilho raro', desc: 'Capture um Pokémon shiny.', icon: '✨', goal: 1, progress: stat('shiny_catches'), frame: 'shiny' },
    { id: 'shiny_10', name: 'Caçador de brilhos', desc: 'Capture 10 Pokémon shiny.', icon: '🌟', goal: 10, progress: stat('shiny_catches'), title: 'Caçador Shiny' },
    { id: 'legend_1', name: 'Lenda viva', desc: 'Capture um Pokémon lendário.', icon: '🐉', goal: 1, progress: stat('legendary_catches'), frame: 'lendario' },
    { id: 'legend_10', name: 'Domador de lendas', desc: 'Capture 10 lendários.', icon: '👑', goal: 10, progress: stat('legendary_catches'), title: 'Domador de Lendas' },
    { id: 'win_1', name: 'Campeão da mesa', desc: 'Vença uma partida.', icon: '🏆', goal: 1, progress: stat('games_won'), frame: 'prata', title: 'Campeão' },
    { id: 'win_10', name: 'Dinastia', desc: 'Vença 10 partidas.', icon: '🥇', goal: 10, progress: stat('games_won'), frame: 'ouro', title: 'Lenda da Liga' },
    { id: 'played_10', name: 'Veterano', desc: 'Termine 10 partidas.', icon: '🎲', goal: 10, progress: stat('games_played'), title: 'Veterano' },
    { id: 'battles_100', name: 'Cem vitórias', desc: 'Vença 100 batalhas.', icon: '⚔️', goal: 100, progress: stat('battles_won'), title: 'Batalhador' },
    { id: 'badges_8', name: 'Oito insígnias', desc: 'Ganhe 8 insígnias (somando partidas).', icon: '🎖️', goal: 8, progress: stat('badges') },
    { id: 'badges_40', name: 'Rei dos ginásios', desc: 'Ganhe 40 insígnias.', icon: '🏟️', goal: 40, progress: stat('badges'), title: 'Rei dos Ginásios' },
    { id: 'pvp_10', name: 'Duelista', desc: 'Vença 10 batalhas contra jogadores.', icon: '🤺', goal: 10, progress: stat('pvp_wins'), title: 'Duelista' },
    { id: 'evo_25', name: 'Evolucionista', desc: 'Evolua 25 Pokémon.', icon: '🧬', goal: 25, progress: stat('evolutions') },
    { id: 'mega_1', name: 'Mega energia', desc: 'Faça uma Mega Evolução.', icon: '💠', goal: 1, progress: stat('megas') },
    { id: 'cards_100', name: 'Mão pesada', desc: 'Use 100 cartas.', icon: '🃏', goal: 100, progress: stat('cards_used'), title: 'Trapaceiro' },
    { id: 'steps_1000', name: 'Andarilho', desc: 'Ande 1000 casas.', icon: '👟', goal: 1000, progress: stat('steps'), title: 'Andarilho' },
    { id: 'phoenix_5', name: 'Fênix', desc: 'Use Revive para escapar de 5 derrotas totais.', icon: '🔥', goal: 5, progress: stat('revives_used'), title: 'Fênix' },
    { id: 'resilient_10', name: 'Inquebrável', desc: 'Perca 10 vidas e continue jogando.', icon: '❤️‍🩹', goal: 10, progress: stat('lives_lost') },
];

export type Frame = { id: string; name: string };
export const FRAMES: Frame[] = [
    { id: 'bronze', name: 'Bronze' },
    { id: 'prata', name: 'Prata' },
    { id: 'ouro', name: 'Ouro' },
    { id: 'shiny', name: 'Shiny' },
    { id: 'lendario', name: 'Lendária' },
    { id: 'mestre', name: 'Mestre' },
];

export const Achievements = {
    unlockedBy(stats: Stats, dex: number): string[] {
        return ACHIEVEMENTS.filter(a => a.progress(stats, dex) >= a.goal).map(a => a.id);
    },
    titlesFor(unlocked: Set<string>): string[] {
        return ACHIEVEMENTS.filter(a => a.title && unlocked.has(a.id)).map(a => a.title!);
    },
    framesFor(unlocked: Set<string>): Frame[] {
        const ids = new Set(ACHIEVEMENTS.filter(a => a.frame && unlocked.has(a.id)).map(a => a.frame!));
        return FRAMES.filter(f => ids.has(f.id));
    },
};
