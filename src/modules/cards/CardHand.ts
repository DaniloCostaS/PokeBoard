import { CARD_RARITIES } from '../../constants';

// Mão de cartas em leque: passar o mouse ou deslizar o dedo levanta a carta no topo e mostra o detalhe; usar faz a carta voar para o tabuleiro/batalha.

export type HandOptions = {
    isMe: boolean;
    canUseMove?: boolean;
    isBattle?: boolean;
    battleCardsLeft?: number;
    onZoom: (cardId: string) => void;
    onUse?: (cardId: string, cardEl: HTMLElement) => void;
    onUnprotect?: (card: any, originalIndex: number) => void;
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
        detail.innerHTML = `<p class="pb-hand-hint">Passe o mouse ou deslize o dedo para inspecionar cada carta.</p>`;

        const n = cards.length;
        const spread = Math.min(7, 48 / Math.max(n, 1));
        let activeIndex = -1;

        const selectCard = (cardEl: HTMLElement, cardData: any, origIdx: number, scrollIntoView: boolean = true) => {
            const cardIdx = cards.indexOf(cardData);
            if (activeIndex === cardIdx && cardEl.classList.contains('is-selected')) return;
            activeIndex = cardIdx;

            hand.querySelectorAll('.pb-hand-card.is-selected').forEach(x => x.classList.remove('is-selected'));
            cardEl.classList.add('is-selected');

            if (scrollIntoView) {
                cardEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
            this.renderDetail(detail, cardEl, player, cardData, origIdx, opts);
        };

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

            // Hover no desktop: levanta imediatamente a carta ao passar o cursor
            el.addEventListener('mouseenter', () => {
                selectCard(el, c, originalIndex, false);
            });

            // Clique direto (desktop ou touch): seleciona e centraliza
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                selectCard(el, c, originalIndex, true);
            });

            hand.appendChild(el);
        });

        // Rastreamento contínuo com mouse no desktop (ao mover rapidamente o cursor pelo leque)
        hand.addEventListener('mousemove', (e: MouseEvent) => {
            const target = (e.target as HTMLElement)?.closest('.pb-hand-card') as HTMLElement | null;
            if (target && hand.contains(target)) {
                const idx = Array.prototype.indexOf.call(hand.children, target);
                if (idx >= 0 && idx !== activeIndex) {
                    const c = cards[idx];
                    const origIdx = player.cards.indexOf(c);
                    selectCard(target, c, origIdx, false);
                }
            }
        });

        // Rastreamento tátil no mobile (ao deslizar o dedo sobre as cartas da mão)
        const getCardFromPoint = (clientX: number, clientY: number): { cardEl: HTMLElement; index: number } | null => {
            // 1. Tenta pegar diretamente pelo elemento sob a coordenada do dedo
            const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
            const directCard = el?.closest('.pb-hand-card') as HTMLElement | null;
            if (directCard && hand.contains(directCard)) {
                const idx = Array.prototype.indexOf.call(hand.children, directCard);
                if (idx >= 0) return { cardEl: directCard, index: idx };
            }

            // 2. Busca horizontal pelas caixas das cartas caso o dedo deslize na faixa superior do leque
            const handRect = hand.getBoundingClientRect();
            if (clientY >= handRect.top - 50 && clientY <= handRect.bottom + 50) {
                const cardElements = Array.from(hand.children) as HTMLElement[];
                // Percorre de trás para frente para priorizar a carta de maior z-index natural
                for (let i = cardElements.length - 1; i >= 0; i--) {
                    const cEl = cardElements[i];
                    if (!cEl.classList.contains('pb-hand-card')) continue;
                    const r = cEl.getBoundingClientRect();
                    if (clientX >= r.left && clientX <= r.right) {
                        return { cardEl: cEl, index: i };
                    }
                }
                // Se estiver ligeiramente fora, conecta com a mais próxima
                let closestEl: HTMLElement | null = null;
                let minDistance = Infinity;
                for (let i = 0; i < cardElements.length; i++) {
                    const cEl = cardElements[i];
                    if (!cEl.classList.contains('pb-hand-card')) continue;
                    const r = cEl.getBoundingClientRect();
                    const cardCenter = r.left + r.width / 2;
                    const dist = Math.abs(clientX - cardCenter);
                    if (dist < minDistance) {
                        minDistance = dist;
                        closestEl = cEl;
                    }
                }
                if (closestEl && minDistance < 100) {
                    const idx = Array.prototype.indexOf.call(hand.children, closestEl);
                    if (idx >= 0) return { cardEl: closestEl, index: idx };
                }
            }
            return null;
        };

        let isTouchScrubbing = false;
        let touchStartX = 0;
        let touchStartY = 0;

        hand.addEventListener('touchstart', (e: TouchEvent) => {
            if (e.touches.length !== 1) return;
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            isTouchScrubbing = true;

            const hit = getCardFromPoint(touch.clientX, touch.clientY);
            if (hit && hit.index !== activeIndex) {
                const c = cards[hit.index];
                const origIdx = player.cards.indexOf(c);
                selectCard(hit.cardEl, c, origIdx, false);
                if (navigator.vibrate) {
                    try { navigator.vibrate(8); } catch (_) {}
                }
            }
        }, { passive: true });

        hand.addEventListener('touchmove', (e: TouchEvent) => {
            if (!isTouchScrubbing || e.touches.length !== 1) return;
            const touch = e.touches[0];
            const diffX = Math.abs(touch.clientX - touchStartX);
            const diffY = Math.abs(touch.clientY - touchStartY);

            // Previne scroll da página se o arrasto for horizontal (navegando pelas cartas)
            if (diffX > 6 && diffX > diffY && e.cancelable) {
                e.preventDefault();
            }

            const hit = getCardFromPoint(touch.clientX, touch.clientY);
            if (hit && hit.index !== activeIndex) {
                const c = cards[hit.index];
                const origIdx = player.cards.indexOf(c);
                selectCard(hit.cardEl, c, origIdx, false);
                if (navigator.vibrate) {
                    try { navigator.vibrate(6); } catch (_) {}
                }
            }

            // Auto-scroll suave se a mão for rolável horizontalmente
            if (hand.classList.contains('is-scrollable')) {
                const handRect = hand.getBoundingClientRect();
                const edgeZone = 44;
                if (touch.clientX < handRect.left + edgeZone) {
                    hand.scrollLeft -= 7;
                } else if (touch.clientX > handRect.right - edgeZone) {
                    hand.scrollLeft += 7;
                }
            }
        }, { passive: false });

        const onTouchEnd = () => {
            if (!isTouchScrubbing) return;
            isTouchScrubbing = false;
            // Centraliza suavemente a carta final selecionada
            if (activeIndex >= 0 && activeIndex < hand.children.length) {
                const activeCard = hand.children[activeIndex] as HTMLElement;
                if (activeCard) {
                    activeCard.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }
            }
        };

        hand.addEventListener('touchend', onTouchEnd, { passive: true });
        hand.addEventListener('touchcancel', onTouchEnd, { passive: true });

        // Suporte ao scroll da rodinha do mouse no desktop para mãos com muitas cartas
        hand.addEventListener('wheel', (e: WheelEvent) => {
            if (hand.classList.contains('is-scrollable') && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                hand.scrollLeft += e.deltaY;
                e.preventDefault();
            }
        }, { passive: false });

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

        // Já abre com a primeira carta jogável selecionada e erguida
        const firstPlayable = cards.findIndex(c => {
            if (c.isProtected) return false;
            if (opts.isBattle) return c.type === 'battle';
            return c.type === 'move' || c.type === 'global';
        });
        const canPlay = opts.isBattle ? (opts.battleCardsLeft === undefined || opts.battleCardsLeft > 0) : opts.canUseMove;
        const pre = hand.children[firstPlayable >= 0 && canPlay ? firstPlayable : 0] as HTMLElement | undefined;
        if (pre) pre.click();
    }

    private static renderDetail(detail: HTMLElement, cardEl: HTMLElement, player: any, c: any, originalIndex: number, opts: HandOptions) {
        const rarityColor = CARD_RARITIES[c.rarity]?.color || '#8d99ae';
        let action: { label: string; enabled: boolean; title?: string; run?: () => void } = {
            label: opts.isBattle ? 'Só no tabuleiro' : 'Só em batalha',
            enabled: false,
            title: opts.isBattle ? 'Esta carta só pode ser usada no tabuleiro' : 'Esta carta só pode ser usada em batalha'
        };

        if (c.isProtected) {
            action = (opts.isBattle || opts.canUseMove)
                ? {
                    label: 'Desproteger',
                    enabled: true,
                    run: () => {
                        if (opts.onUnprotect) opts.onUnprotect(c, originalIndex);
                        else (window as any).Cards.unprotectCard(player.id, originalIndex, false);
                    }
                }
                : { label: 'Protegida', enabled: false, title: 'Carta protegida' };
        } else if (opts.isBattle) {
            if (c.type === 'battle') {
                if (opts.battleCardsLeft !== undefined && opts.battleCardsLeft <= 0) {
                    action = { label: 'Limite atingido (3/3)', enabled: false, title: 'Você já usou o limite de 3 cartas nesta batalha' };
                } else {
                    action = {
                        label: 'Usar carta',
                        enabled: true,
                        run: () => {
                            if (opts.onUse) opts.onUse(c.id, cardEl);
                            else CardHand.flyAndUse(cardEl, c.id, () => (window as any).Battle.useCard(c.id));
                        }
                    };
                }
            } else {
                action = { label: 'Só no tabuleiro', enabled: false, title: 'Esta carta só pode ser usada no tabuleiro' };
            }
        } else if (c.type === 'move' || c.type === 'global') {
            action = opts.canUseMove
                ? {
                    label: c.type === 'global' ? 'Usar (afeta todos)' : 'Usar carta',
                    enabled: true,
                    run: () => CardHand.flyAndUse(cardEl, c.id, () => (window as any).Cards.activate(c.id))
                }
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
    static flyAndUse(cardEl: HTMLElement, cardId: string, onExecute?: () => void) {
        const me = (window as any).Game?.getCurrentPlayer?.();
        if (me) (window as any).UseFx?.markShown?.(me.id, cardId);
        const img = cardEl.querySelector('img') as HTMLImageElement | null;
        const run = onExecute || (() => (window as any).Cards.activate(cardId));
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

        // O modal some para a carta "ir" ao destino, e o efeito roda no fim do voo
        const bModal = document.getElementById('board-cards-modal');
        if (bModal) bModal.style.display = 'none';
        const batModal = document.getElementById('battle-cards-modal');
        if (batModal) batModal.style.display = 'none';
        window.setTimeout(run, 560);
    }
}
