import { CARD_RARITIES } from '../../constants';

// Mão de cartas em leque: tocar seleciona e mostra o detalhe; usar faz a carta voar para o tabuleiro.

type HandOptions = {
    isMe: boolean;
    canUseMove: boolean;
    onZoom: (cardId: string) => void;
};

const typeLabel: Record<string, string> = { move: 'Movimento', battle: 'Batalha', auto: 'Automática', global: 'Global' };
const escapeHtml = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));

export class CardHand {
    static thumb(cardId: string) {
        return `/assets/img/Cartas/thumbs/${cardId}.webp`;
    }

    static render(list: HTMLElement, player: any, cards: any[], opts: HandOptions) {
        const hand = document.createElement('div');
        hand.className = 'pb-hand';
        const detail = document.createElement('div');
        detail.className = 'pb-hand-detail';
        detail.innerHTML = `<p class="pb-hand-hint">Toque numa carta para ver o que ela faz.</p>`;

        const n = cards.length;
        const spread = Math.min(7, 48 / Math.max(n, 1));

        cards.forEach((c, i) => {
            const originalIndex = player.cards.indexOf(c);
            const rarityColor = c.isProtected ? '#e0a92e' : (CARD_RARITIES[c.rarity]?.color || '#8d99ae');
            const offset = i - (n - 1) / 2;
            const el = document.createElement('button');
            el.type = 'button';
            el.className = 'pb-hand-card';
            el.style.setProperty('--rot', `${offset * spread}deg`);
            el.style.setProperty('--lift', `${Math.abs(offset) * Math.abs(offset) * 1.6}px`);
            el.style.setProperty('--rarity', rarityColor);
            el.style.zIndex = String(i + 1);
            el.setAttribute('aria-label', `${c.name}, ${c.rarity}`);
            el.innerHTML = `
                <img src="${this.thumb(c.id)}" alt="" loading="lazy" draggable="false" onerror="this.onerror=null;this.src='/assets/img/Cartas/${escapeHtml(c.id)}.jpg'">
                ${c.isProtected ? '<span class="pb-hand-lock" title="Protegida">Protegida</span>' : ''}
            `;
            el.addEventListener('click', () => {
                hand.querySelectorAll('.pb-hand-card.is-selected').forEach(x => x.classList.remove('is-selected'));
                el.classList.add('is-selected');
                el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                this.renderDetail(detail, el, player, c, originalIndex, opts);
            });
            hand.appendChild(el);
        });

        list.appendChild(hand);
        list.appendChild(detail);

        // Sobreposição calculada para o leque caber na largura disponível
        requestAnimationFrame(() => {
            const first = hand.firstElementChild as HTMLElement | null;
            if (!first || n < 2) return;
            const cardW = first.offsetWidth;
            const avail = hand.clientWidth - 56;
            const overlap = Math.min(0.72, Math.max(0.22, (n * cardW - avail) / ((n - 1) * cardW)));
            hand.style.setProperty('--overlap', String(overlap));
            hand.classList.toggle('is-scrollable', overlap >= 0.72 && n * cardW * (1 - 0.72) + cardW * 0.72 > avail);
        });

        // Já abre com a primeira carta jogável selecionada
        const firstPlayable = cards.findIndex(c => !c.isProtected && (c.type === 'move' || c.type === 'global'));
        const pre = hand.children[firstPlayable >= 0 && opts.canUseMove ? firstPlayable : -1] as HTMLElement | undefined;
        if (pre) pre.click();
    }

    private static renderDetail(detail: HTMLElement, cardEl: HTMLElement, player: any, c: any, originalIndex: number, opts: HandOptions) {
        const rarityColor = CARD_RARITIES[c.rarity]?.color || '#8d99ae';
        let action: { label: string; enabled: boolean; title?: string; run?: () => void } = { label: 'Só em batalha', enabled: false, title: 'Esta carta só pode ser usada em batalha' };
        if (c.isProtected) {
            action = opts.canUseMove
                ? { label: 'Desproteger', enabled: true, run: () => (window as any).Cards.unprotectCard(player.id, originalIndex) }
                : { label: 'Protegida', enabled: false, title: 'Só pode desproteger no seu turno' };
        } else if (c.type === 'move' || c.type === 'global') {
            action = opts.canUseMove
                ? { label: c.type === 'global' ? 'Usar (afeta todos)' : 'Usar carta', enabled: true, run: () => this.flyAndUse(cardEl, c.id) }
                : { label: 'Usar carta', enabled: false, title: 'Só pode usar no seu turno, antes de rolar o dado' };
        } else if (c.type === 'auto') {
            action = { label: 'Ativa sozinha', enabled: false, title: 'Esta carta ativa automaticamente' };
        }

        detail.innerHTML = `
            <div class="pb-hand-detail-head">
                <strong>${escapeHtml(c.name)}</strong>
                <span class="pb-hand-tag" style="--rarity:${rarityColor}">${escapeHtml(c.rarity)}</span>
                <span class="pb-hand-tag pb-hand-tag--type">${escapeHtml(typeLabel[c.type] || c.type)}</span>
            </div>
            <p>${escapeHtml(c.desc)}</p>
            <div class="pb-hand-actions">
                <button type="button" class="btn btn-secondary pb-hand-zoom">Ver carta</button>
                ${opts.isMe ? `<button type="button" class="btn ${action.enabled ? 'btn-roll' : 'btn-secondary'} pb-hand-use" ${action.enabled ? '' : 'disabled'} title="${escapeHtml(action.title || '')}">${escapeHtml(action.label)}</button>` : ''}
            </div>
        `;
        (detail.querySelector('.pb-hand-zoom') as HTMLElement).onclick = () => opts.onZoom(c.id);
        const use = detail.querySelector('.pb-hand-use') as HTMLButtonElement | null;
        if (use && action.run) use.onclick = () => { use.disabled = true; action.run!(); };
    }

    // A carta sai da mão, cresce no centro da tela e some antes do efeito acontecer
    static flyAndUse(cardEl: HTMLElement, cardId: string) {
        const img = cardEl.querySelector('img') as HTMLImageElement | null;
        const run = () => (window as any).Cards.activate(cardId);
        if (!img || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { run(); return; }

        const r = img.getBoundingClientRect();
        const ghost = img.cloneNode(true) as HTMLImageElement;
        ghost.className = 'pb-card-flight';
        Object.assign(ghost.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
        document.body.appendChild(ghost);

        const targetW = Math.min(240, window.innerWidth * 0.5);
        const dx = window.innerWidth / 2 - (r.left + r.width / 2);
        const dy = window.innerHeight / 2 - (r.top + r.height / 2);
        const scale = targetW / r.width;
        ghost.animate([
            { transform: 'translate(0,0) rotate(0) scale(1)', opacity: 1 },
            { transform: `translate(${dx}px, ${dy}px) rotate(-4deg) scale(${scale})`, opacity: 1, offset: 0.55 },
            { transform: `translate(${dx}px, ${dy}px) rotate(0) scale(${scale * 1.08})`, opacity: 1, filter: 'brightness(1.6)', offset: 0.8 },
            { transform: `translate(${dx}px, ${dy}px) scale(${scale * 1.3})`, opacity: 0, filter: 'brightness(2.4)' }
        ], { duration: 720, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' }).finished.finally(() => ghost.remove());

        // O modal some para a carta "ir" ao tabuleiro, e o efeito roda no fim do voo
        const modal = document.getElementById('board-cards-modal');
        if (modal) modal.style.display = 'none';
        window.setTimeout(run, 560);
    }
}
