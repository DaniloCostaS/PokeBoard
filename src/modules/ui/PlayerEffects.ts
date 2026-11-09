import { TYPE_COLORS } from './TypeTooltip';

// Efeitos ativos de um jogador (cartas e status), no mesmo formato para o placar e para o peão no tabuleiro.

export type ActiveEffect = {
    key: string;
    icon: string;
    name: string;
    count?: number;
    detail: string;
    tone: 'good' | 'bad' | 'neutral';
    color?: string;
    onBoard: boolean;
};


const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function activeEffects(p: any): ActiveEffect[] {
    const fx = p?.effects || {};
    const out: ActiveEffect[] = [];
    if (p?.skipTurns > 0) out.push({ key: 'par', icon: '⛓️', name: 'Paralisado', count: p.skipTurns, detail: `Perde ${plural(p.skipTurns, 'turno', 'turnos')}`, tone: 'bad', onBoard: true });
    if (fx.slow > 0) out.push({ key: 'slow', icon: '🕸️', name: 'Campo Grudento', count: fx.slow, detail: `O dado vale 1 por ${plural(fx.slow, 'turno', 'turnos')}`, tone: 'bad', onBoard: true });
    if (fx.moonwalker > 0) out.push({ key: 'moon', icon: '💃', name: 'Moon Walker', count: fx.moonwalker, detail: `Anda para trás nas próximas ${plural(fx.moonwalker, 'jogada', 'jogadas')}`, tone: 'bad', onBoard: true });
    if (fx.curse) out.push({ key: 'curse', icon: '☠️', name: 'Maldição', detail: 'Metade do dano e sem itens na próxima luta contra Líder ou Campeão', tone: 'bad', onBoard: true });
    if (fx.extraTurn) out.push({ key: 'extra', icon: '⏳', name: 'Turno extra', detail: 'Joga de novo em seguida', tone: 'good', onBoard: true });
    if (fx.doubleXp > 0) out.push({ key: 'xp', icon: '📈', name: 'Double XP', count: fx.doubleXp, detail: `XP em dobro nos próximos ${plural(fx.doubleXp, 'ganho', 'ganhos')}`, tone: 'good', onBoard: true });
    if (fx.expShare > 0) out.push({ key: 'share', icon: '🤩', name: 'Exp. Share', count: fx.expShare, detail: `O time inteiro recebe XP nos próximos ${plural(fx.expShare, 'ganho', 'ganhos')}`, tone: 'good', onBoard: true });
    if (fx.lureShiny > 0) out.push({ key: 'shiny', icon: '✨', name: 'Lure Shiny', count: fx.lureShiny, detail: `Chance de shiny maior por ${plural(fx.lureShiny, 'rodada', 'rodadas')}`, tone: 'good', onBoard: true });
    if (fx.lureType && fx.lureType.count > 0) {
        const t = fx.lureType.type;
        out.push({ key: 'lure', icon: '🆎', name: `Isca ${t}`, count: fx.lureType.count, detail: `Os próximos ${plural(fx.lureType.count, 'selvagem é', 'selvagens são')} do tipo ${t}`, tone: 'good', color: TYPE_COLORS[t] || '#777', onBoard: true });
    }
    const prot = (p?.cards || []).filter((c: any) => c?.isProtected).length;
    if (prot > 0) out.push({ key: 'prot', icon: '🔒', name: 'Protegidas', count: prot, detail: `${plural(prot, 'carta protegida', 'cartas protegidas')} contra roubo`, tone: 'neutral', onBoard: false });
    return out;
}
