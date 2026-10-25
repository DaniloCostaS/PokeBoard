import { supabase } from '../network/SupabaseInit';
import { Account } from './Account';
import { ACHIEVEMENTS, Achievements, FRAMES } from './Achievements';
import type { Stats } from './Achievements';
import { ProfileTracker } from './ProfileTracker';
import { Cosmetics } from './Cosmetics';
import { GameDialog } from '../ui/GameDialog';
import { AvatarPicker } from '../ui/AvatarPicker';
import { TRAINER_IMAGES } from '../../constants/trainerImages';
import { GEN1 } from '../../constants/pokedex/gen1';
import { GEN2 } from '../../constants/pokedex/gen2';
import { GEN3 } from '../../constants/pokedex/gen3';
import { GEN4 } from '../../constants/pokedex/gen4';
import { GEN5 } from '../../constants/pokedex/gen5';
import { GEN6 } from '../../constants/pokedex/gen6';
import { GEN7 } from '../../constants/pokedex/gen7';
import { GEN8 } from '../../constants/pokedex/gen8';
import { GEN9 } from '../../constants/pokedex/gen9';
import { MEGA_POKEDEX } from '../../constants/pokedex/megas';

const GENS = [GEN1, GEN2, GEN3, GEN4, GEN5, GEN6, GEN7, GEN8, GEN9];
const TOTAL_SPECIES = GENS.reduce((n, g) => n + g.length, 0);

type Tab = 'resumo' | 'pokedex' | 'conquistas' | 'visual' | 'historico';

const STAT_LABELS: [keyof Stats, string][] = [
    ['games_played', 'Partidas'], ['games_won', 'Vitórias'], ['battles_won', 'Batalhas vencidas'], ['battles_lost', 'Batalhas perdidas'],
    ['pvp_wins', 'Vitórias PvP'], ['gym_wins', 'Ginásios vencidos'], ['badges', 'Insígnias'], ['catches', 'Capturas'],
    ['shiny_catches', 'Shinies'], ['legendary_catches', 'Lendários'], ['evolutions', 'Evoluções'], ['megas', 'Mega Evoluções'],
    ['cards_used', 'Cartas usadas'], ['items_used', 'Itens usados'], ['steps', 'Casas andadas'], ['total_defeats', 'Derrotas totais'],
    ['lives_lost', 'Vidas perdidas'], ['revives_used', 'Revives salvadores'],
];

const esc = (v: unknown) => Cosmetics.escape(v);
const sprite = (id: number, shiny = false) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${shiny ? 'shiny/' : ''}${id}.png`;

/**
 * PERFIL DO TREINADOR
 * Resumo com estatísticas entre partidas, Pokédex da conta (objetivo: pegar todos), conquistas,
 * cosméticos (avatar, título e moldura) e histórico de partidas.
 */
export class ProfileScreen {
    private static layer: HTMLElement | null = null;
    private static tab: Tab = 'resumo';
    private static gen = 0;
    private static data: { stats: Stats; dex: Map<number, { caught: number; shiny: number }>; unlocked: Set<string>; history: any[] } | null = null;

    static async open(tab: Tab = 'resumo') {
        if (!Account.isLogged) return GameDialog.toast('Entre na sua conta para ver o perfil.', { tone: 'warning' });
        this.tab = tab;
        this.ensureLayer();
        this.layer!.innerHTML = `<div class="modal-content pb-profile-card"><div class="rooms-hub-loading"><span aria-hidden="true"></span><p>Carregando perfil...</p></div></div>`;
        this.layer!.style.display = 'flex';
        await ProfileTracker.flush().catch(() => { });
        await this.load();
        this.render();
    }

    static close() { if (this.layer) this.layer.style.display = 'none'; }

    private static ensureLayer() {
        if (this.layer) return;
        const layer = document.createElement('div');
        layer.id = 'profile-modal';
        layer.className = 'modal pb-profile';
        layer.addEventListener('click', e => { if (e.target === layer) this.close(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && layer.style.display === 'flex' && !GameDialog.isOpen()) this.close(); });
        document.body.appendChild(layer);
        this.layer = layer;
    }

    private static async load() {
        const uid = Account.userId!;
        const [statsRes, dexRes, unlocked, histRes] = await Promise.all([
            supabase.from('profile_stats').select('stats').eq('user_id', uid).maybeSingle(),
            supabase.from('profile_pokedex').select('pokemon_id, caught, shiny_caught').eq('user_id', uid),
            ProfileTracker.loadUnlocked(uid),
            supabase.from('match_history').select('room_alias, won, rounds, badges, players, team, finished_at').eq('user_id', uid).order('finished_at', { ascending: false }).limit(20),
        ]);
        const dex = new Map<number, { caught: number; shiny: number }>();
        (dexRes.data || []).forEach((r: any) => dex.set(r.pokemon_id, { caught: r.caught, shiny: r.shiny_caught }));
        this.data = { stats: (statsRes.data?.stats || {}) as Stats, dex, unlocked, history: histRes.data || [] };
    }

    private static dexSpecies(): number {
        if (!this.data) return 0;
        let n = 0;
        GENS.forEach(g => g.forEach(p => { if ((this.data!.dex.get(p.id)?.caught || 0) > 0) n++; }));
        return n;
    }

    private static render() {
        if (!this.layer || !this.data || !Account.profile) return;
        const p = Account.profile;
        const tabs: [Tab, string][] = [['resumo', 'Resumo'], ['pokedex', 'Pokédex'], ['conquistas', 'Conquistas'], ['visual', 'Visual'], ['historico', 'Histórico']];
        const caught = this.dexSpecies();
        const pct = Math.round((caught / TOTAL_SPECIES) * 100);
        this.layer.innerHTML = `<div class="modal-content pb-profile-card" role="dialog" aria-modal="true" aria-labelledby="pb-profile-name">
            <header class="pb-profile-head">
                <span class="pb-profile-avatar ${Cosmetics.frameClass(p.frame)}"><img src="/assets/img/Treinadores/${esc(p.avatar)}" alt=""></span>
                <div>
                    <h2 id="pb-profile-name">${esc(p.username)}</h2>
                    ${p.title ? `<p class="pb-trainer-title">${esc(p.title)}</p>` : ''}
                    <div class="pb-profile-dexbar" title="Pokédex da conta"><i style="width:${pct}%"></i><span>Pokédex ${caught}/${TOTAL_SPECIES}</span></div>
                </div>
                <button type="button" class="pb-rd-close" data-close aria-label="Fechar">✕</button>
            </header>
            <nav class="pb-profile-tabs" role="tablist">${tabs.map(([id, label]) => `<button type="button" role="tab" class="pb-profile-tab${this.tab === id ? ' is-active' : ''}" aria-selected="${this.tab === id}" data-tab="${id}">${label}</button>`).join('')}</nav>
            <div class="pb-profile-body">${this.renderTab()}</div>
        </div>`;
        this.layer.querySelector('[data-close]')?.addEventListener('click', () => this.close());
        this.layer.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(b => b.addEventListener('click', () => { this.tab = b.dataset.tab as Tab; this.render(); }));
        this.bindTab();
    }

    private static renderTab(): string {
        const d = this.data!;
        switch (this.tab) {
            case 'resumo': {
                const s = d.stats;
                const played = Number(s.games_played || 0), won = Number(s.games_won || 0);
                const rate = played ? Math.round((won / played) * 100) : 0;
                return `<div class="pb-profile-hero">
                        <div><strong>${won}</strong><span>vitórias</span></div>
                        <div><strong>${rate}%</strong><span>aproveitamento</span></div>
                        <div><strong>${d.unlocked.size}/${ACHIEVEMENTS.length}</strong><span>conquistas</span></div>
                    </div>
                    <dl class="pb-profile-stats">${STAT_LABELS.map(([k, label]) => `<div><dt>${label}</dt><dd>${Number(s[k] || 0).toLocaleString('pt-BR')}</dd></div>`).join('')}</dl>
                    <p class="trainer-room-hint">Contam as partidas online e as offline em que você é o único humano na mesa.</p>`;
            }
            case 'pokedex': {
                const list = this.gen === 9 ? MEGA_POKEDEX : GENS[this.gen];
                const got = list.filter(p => (d.dex.get(p.id)?.caught || 0) > 0).length;
                const genTabs = [...GENS.map((g, i) => {
                    const c = g.filter(p => (d.dex.get(p.id)?.caught || 0) > 0).length;
                    return `<button type="button" class="pb-dex-gen${this.gen === i ? ' is-active' : ''}" data-gen="${i}">Gen ${i + 1}<small>${c}/${g.length}</small></button>`;
                }), `<button type="button" class="pb-dex-gen${this.gen === 9 ? ' is-active' : ''}" data-gen="9">Megas<small>${MEGA_POKEDEX.filter(p => (d.dex.get(p.id)?.caught || 0) > 0).length}/${MEGA_POKEDEX.length}</small></button>`].join('');
                const cells = list.map(p => {
                    const e = d.dex.get(p.id);
                    const has = (e?.caught || 0) > 0;
                    const num = p.id < 10000 ? `#${String(p.id).padStart(4, '0')}` : 'Mega';
                    return `<li class="pb-dex-cell${has ? ' is-caught' : ''}${(e?.shiny || 0) > 0 ? ' is-shiny' : ''}" title="${has ? `${esc(p.name)} · capturado ${e!.caught}x${e!.shiny ? ` · ${e!.shiny} shiny` : ''}` : '???'}">
                        <img src="${sprite(p.id, (e?.shiny || 0) > 0)}" alt="" loading="lazy">
                        <span>${num}</span><b>${has ? esc(p.name) : '???'}</b>
                    </li>`;
                }).join('');
                return `<div class="pb-dex-gens">${genTabs}</div>
                    <p class="pb-dex-count">${got}/${list.length} registrados nesta lista. Capture (ou evolua) para registrar — o objetivo é pegar todos!</p>
                    <ul class="pb-dex-grid">${cells}</ul>`;
            }
            case 'conquistas': {
                return `<ul class="pb-ach-list">${ACHIEVEMENTS.map(a => {
                    const val = Math.min(a.goal, a.progress(d.stats, this.dexSpecies()));
                    const done = d.unlocked.has(a.id) || val >= a.goal;
                    const reward = [a.title ? `Título “${a.title}”` : '', a.frame ? `Moldura ${FRAMES.find(f => f.id === a.frame)?.name}` : ''].filter(Boolean).join(' · ');
                    return `<li class="${done ? 'is-done' : ''}">
                        <span class="pb-ach-icon" aria-hidden="true">${a.icon}</span>
                        <div><strong>${a.name}</strong><small>${a.desc}</small>${reward ? `<em>${reward}</em>` : ''}
                        <div class="pb-ach-bar"><i style="width:${Math.round((val / a.goal) * 100)}%"></i></div></div>
                        <span class="pb-ach-val">${done ? '✓' : `${val}/${a.goal}`}</span>
                    </li>`;
                }).join('')}</ul>`;
            }
            case 'visual': {
                const p = Account.profile!;
                const titles = Achievements.titlesFor(d.unlocked);
                const frames = Achievements.framesFor(d.unlocked);
                return `<section class="pb-vis-block"><h3>Avatar padrão</h3>
                        <select id="profile-avatar-select" aria-label="Avatar padrão">${TRAINER_IMAGES.map(img => `<option value="${img.file}"${img.file === p.avatar ? ' selected' : ''}>${img.label}</option>`).join('')}</select></section>
                    <section class="pb-vis-block"><h3>Moldura</h3><div class="pb-vis-options">
                        <button type="button" class="pb-vis-opt${!p.frame ? ' is-selected' : ''}" data-frame=""><span class="pb-profile-avatar"><img src="/assets/img/Treinadores/${esc(p.avatar)}" alt=""></span>Nenhuma</button>
                        ${frames.map(f => `<button type="button" class="pb-vis-opt${p.frame === f.id ? ' is-selected' : ''}" data-frame="${f.id}"><span class="pb-profile-avatar ${Cosmetics.frameClass(f.id)}"><img src="/assets/img/Treinadores/${esc(p.avatar)}" alt=""></span>${f.name}</button>`).join('')}
                        ${frames.length < FRAMES.length ? `<p class="trainer-room-hint">Mais molduras liberadas por conquistas.</p>` : ''}
                    </div></section>
                    <section class="pb-vis-block"><h3>Título</h3><div class="pb-vis-options">
                        <button type="button" class="pb-vis-title${!p.title ? ' is-selected' : ''}" data-title="">Sem título</button>
                        ${titles.map(t => `<button type="button" class="pb-vis-title${p.title === t ? ' is-selected' : ''}" data-title="${esc(t)}">${esc(t)}</button>`).join('')}
                        ${titles.length ? '' : '<p class="trainer-room-hint">Ganhe conquistas para liberar títulos.</p>'}
                    </div></section>
                    <p class="trainer-room-hint">Moldura e título aparecem para todos na sala e no tabuleiro.</p>`;
            }
            case 'historico': {
                if (!d.history.length) return `<div class="rooms-hub-empty"><span class="rooms-hub-empty-mark" aria-hidden="true"></span><h3>Nenhuma partida terminada</h3><p>Quando uma partida acabar, ela aparece aqui.</p></div>`;
                return `<ul class="pb-hist-list">${d.history.map(h => `<li class="${h.won ? 'is-won' : ''}">
                        <span class="pb-hist-res">${h.won ? '🏆 Vitória' : 'Derrota'}</span>
                        <div><strong>${esc(h.room_alias || 'Partida')}</strong><small>${new Date(h.finished_at).toLocaleDateString('pt-BR')} · ${Number(h.players) || '?'} jogadores · ${Number(h.rounds) || '?'} rodadas · ${Number(h.badges) || 0} insígnias</small></div>
                        <span class="pb-rd-team">${(Array.isArray(h.team) ? h.team : []).map((m: any) => `<img src="${sprite(Number(m.id), !!m.shiny)}" alt="" title="${esc(m.name)} Lv.${Number(m.level)}" loading="lazy">`).join('')}</span>
                    </li>`).join('')}</ul>`;
            }
        }
    }

    private static bindTab() {
        const body = this.layer!.querySelector('.pb-profile-body')!;
        body.querySelectorAll<HTMLButtonElement>('[data-gen]').forEach(b => b.addEventListener('click', () => { this.gen = Number(b.dataset.gen); this.render(); }));
        const sel = body.querySelector('#profile-avatar-select') as HTMLSelectElement | null;
        if (sel) {
            AvatarPicker.enhance(sel);
            sel.addEventListener('change', () => this.save({ avatar: sel.value }));
        }
        body.querySelectorAll<HTMLButtonElement>('[data-frame]').forEach(b => b.addEventListener('click', () => this.save({ frame: b.dataset.frame || null })));
        body.querySelectorAll<HTMLButtonElement>('[data-title]').forEach(b => b.addEventListener('click', () => this.save({ title: b.dataset.title || null })));
    }

    private static async save(patch: { avatar?: string; frame?: string | null; title?: string | null }) {
        if (!(await Account.updateProfile(patch))) return GameDialog.toast('Não foi possível salvar.', { tone: 'danger' });
        GameDialog.toast('Perfil atualizado.', { tone: 'success', duration: 1500 });
        const onlineSel = document.getElementById('online-avatar-select') as HTMLSelectElement | null;
        if (patch.avatar && onlineSel && onlineSel.options.length) { onlineSel.value = patch.avatar; onlineSel.dispatchEvent(new Event('change')); }
        this.render();
    }
}

(window as any).ProfileScreen = ProfileScreen;
