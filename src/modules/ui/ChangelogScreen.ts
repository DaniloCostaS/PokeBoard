import { CHANGELOG } from '../../constants/changelog';
import type { ChangeKind, ChangelogDay } from '../../constants/changelog';

const KINDS: Record<ChangeKind, string> = { novo: 'Novo', ajuste: 'Ajuste', correcao: 'Correção' };
const SEEN_KEY = 'pb_changelog_seen';

// Meio-dia para o fuso não jogar a data para o dia anterior
const asDate = (date: string) => new Date(`${date}T12:00:00`);
const monthLabel = (date: string) => asDate(date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
const dayLabel = (date: string) => asDate(date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });

/** NOVIDADES: o que mudou no jogo, por data. O ponto no botão do menu marca que há algo não visto. */
export class ChangelogScreen {
    private static layer: HTMLElement | null = null;

    private static get latest(): string { return CHANGELOG[0]?.date || ''; }

    static refreshBadge() {
        let seen: string | null = null;
        try { seen = localStorage.getItem(SEEN_KEY); } catch { /* sem storage: o ponto só aparece nesta visita */ }
        document.getElementById('changelog-dot')?.toggleAttribute('hidden', seen === this.latest);
    }

    static open() {
        const layer = this.ensureLayer();
        const months = new Map<string, ChangelogDay[]>();
        CHANGELOG.forEach(day => {
            const key = day.date.slice(0, 7);
            months.set(key, [...(months.get(key) || []), day]);
        });
        const sections = [...months.values()].map((days, i) => `<details class="pb-news-month"${i < 2 ? ' open' : ''}>
                <summary>${monthLabel(days[0].date)}</summary>
                ${days.map(day => `<section class="pb-news-day">
                    <h3><time datetime="${day.date}">${dayLabel(day.date)}</time></h3>
                    <ul>${day.changes.map(([kind, text]) => `<li><span class="pb-news-tag is-${kind}">${KINDS[kind]}</span><span>${text}</span></li>`).join('')}</ul>
                </section>`).join('')}
            </details>`).join('');
        layer.innerHTML = `<div class="modal-content pb-rd-card pb-news-card" role="dialog" aria-modal="true" aria-labelledby="pb-news-title">
            <header>
                <div><h2 id="pb-news-title">Novidades</h2><small>O que mudou no PokéBoard, por data.</small></div>
                <button type="button" class="pb-rd-close" data-close aria-label="Fechar">✕</button>
            </header>
            <div class="pb-news-list">${sections}</div>
        </div>`;
        layer.querySelector('[data-close]')!.addEventListener('click', () => this.close());
        layer.style.display = 'flex';
        try { localStorage.setItem(SEEN_KEY, this.latest); } catch { /* segue sem lembrar */ }
        document.getElementById('changelog-dot')?.setAttribute('hidden', '');
    }

    static close() { if (this.layer) this.layer.style.display = 'none'; }

    private static ensureLayer(): HTMLElement {
        if (this.layer) return this.layer;
        const layer = document.createElement('div');
        layer.id = 'changelog-modal';
        layer.className = 'modal pb-profile';
        layer.addEventListener('click', e => { if (e.target === layer) this.close(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && layer.style.display === 'flex') this.close(); });
        document.body.appendChild(layer);
        this.layer = layer;
        return layer;
    }
}

(window as any).ChangelogScreen = ChangelogScreen;
