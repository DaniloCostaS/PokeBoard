import { CARDS_DB, CARD_RARITIES, SHOP_ITEMS } from '../../constants';
import { GameState } from '../game/GameState';

// Animações ao usar cartas e itens. Só visual: não altera estado do jogo.
// Online: quem usou avisa a sala (CARD_FX / ITEM_FX) e os outros veem a mesma animação.

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
const playerIndexOf = (playerId: number) => GameState.players.findIndex(p => p.id === playerId);

const ITEM_TONE: Record<string, { color: string; text: (item: any) => string }> = {
    heal: { color: '#7ee2a4', text: (item) => item.id === 'ultrafullrestore' ? 'Time curado!' : `+${item.val || 20} HP` },
    revive: { color: '#ffd76a', text: () => 'Reviveu!' },
    boost: { color: '#c39bff', text: () => '+1 em tudo' },
    mega: { color: '#ff9bd2', text: () => 'Mega Pedra!' },
    hold: { color: '#8cc4ef', text: () => 'Equipado' }
};

export class UseFx {
    private static recentCards = new Map<string, number>();
    private static layer: HTMLElement | null = null;

    private static root() {
        if (!this.layer || !document.body.contains(this.layer)) {
            this.layer = document.createElement('div');
            this.layer.className = 'pb-usefx-layer';
            document.body.appendChild(this.layer);
        }
        return this.layer;
    }

    private static relay(type: string, payload: Record<string, unknown>) {
        try {
            const Net = (window as any).Network;
            if (Net?.isOnline && !Net.isSpectator) Net.sendAction(type, payload);
        } catch { /* só visual */ }
    }

    static markShown(playerId: number, cardId: string) {
        this.recentCards.set(`${playerId}:${cardId}`, Date.now());
    }

    // Evita mostrar a mesma carta duas vezes seguidas (ex.: voo da mão + aviso da carta)
    private static seenRecently(key: string, ms = 6000) {
        const now = Date.now();
        const last = this.recentCards.get(key) || 0;
        this.recentCards.set(key, now);
        return now - last < ms;
    }

    // ------------------------------------------------------------------
    // Cartas
    // ------------------------------------------------------------------
    /** Chamado onde a carta é consumida com sucesso (CardEffects / batalha). */
    static cardPlayed(cardId: string, player: any) {
        if (!cardId || !player) return;
        this.relay('CARD_FX', { cardId });
        this.showCard(cardId, player);
    }

    static cardBlocked(cardId: string, player: any) {
        if (!cardId || !player) return;
        this.relay('CARD_FX', { cardId, blocked: true });
        this.showCard(cardId, player, true);
    }

    static fromRemote(type: string, payload: any, playerId: number) {
        const player = GameState.players.find(p => p.id === playerId);
        if (!player || !payload) return;
        if (type === 'CARD_FX' && typeof payload.cardId === 'string') this.showCard(payload.cardId, player, !!payload.blocked);
        if (type === 'ITEM_FX' && typeof payload.itemId === 'string') this.showItem(player, payload.itemId, Number(payload.targetIdx));
    }

    /** Carta aparece girando no centro, brilha na cor da raridade e voa até o card do jogador. */
    static showCard(cardId: string, player: any, blocked = false) {
        const card = CARDS_DB.find((c: any) => c.id === cardId);
        if (!card || this.seenRecently(`${player.id}:${cardId}`)) return;
        const rarity = CARD_RARITIES[card.rarity]?.color || '#8d99ae';
        const el = document.createElement('div');
        el.className = `pb-cardfx${blocked ? ' is-blocked' : ''}`;
        el.style.setProperty('--rarity', rarity);
        el.innerHTML = `
            <div class="pb-cardfx-label"><span>${esc(String(player.name).replace(/\[CPU\]\s*/, ''))}</span> ${blocked ? 'teve a carta bloqueada' : 'usou'}</div>
            <div class="pb-cardfx-card">
                <div class="pb-cardfx-back"></div>
                <img class="pb-cardfx-front" src="/assets/img/Cartas/thumbs/${esc(cardId)}.webp" alt="${esc(card.name)}" onerror="this.onerror=null;this.src='/assets/img/Cartas/${esc(cardId)}.jpg'">
                <div class="pb-cardfx-shine"></div>
                ${blocked ? '<div class="pb-cardfx-x"></div>' : ''}
            </div>
            <div class="pb-cardfx-name">${esc(card.name)}</div>`;
        el.addEventListener('click', () => el.remove());
        this.root().appendChild(el);

        // Voo final em direção ao card do jogador no HUD
        const idx = playerIndexOf(player.id);
        const slot = document.querySelectorAll<HTMLElement>('#game-container .player-slot')[idx];
        const total = reducedMotion() ? 1400 : 2300;
        window.setTimeout(() => {
            if (!el.isConnected) return;
            const cardBox = el.querySelector('.pb-cardfx-card') as HTMLElement;
            if (slot && cardBox && !reducedMotion()) {
                const a = cardBox.getBoundingClientRect();
                const b = slot.getBoundingClientRect();
                cardBox.animate([
                    { transform: 'translate(0,0) scale(1)', opacity: 1 },
                    { transform: `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px, ${b.top + 40 - (a.top + a.height / 2)}px) scale(0.15)`, opacity: 0.2 }
                ], { duration: 420, easing: 'cubic-bezier(0.5, 0, 0.75, 0)', fill: 'forwards' });
            }
            el.classList.add('is-leaving');
            window.setTimeout(() => el.remove(), 450);
        }, total - 450);

        if (slot) {
            window.setTimeout(() => {
                slot.classList.remove('pb-slot-flash');
                void slot.offsetWidth;
                slot.classList.add('pb-slot-flash');
            }, total - 60);
        }
    }

    // ------------------------------------------------------------------
    // Itens
    // ------------------------------------------------------------------
    /** Chamado quando um item do tabuleiro é aplicado com sucesso. */
    static itemUsed(player: any, item: any, targetIdx: number) {
        if (!player || !item) return;
        this.relay('ITEM_FX', { itemId: item.id, targetIdx: Number.isFinite(targetIdx) ? targetIdx : -1 });
        this.showItem(player, item.id, targetIdx);
    }

    /** Ícone do item sai da mochila (botão do HUD) e cai no Pokémon alvo, com brilho e texto. */
    static showItem(player: any, itemId: string, targetIdx: number) {
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if (!item) return;
        const tone = ITEM_TONE[item.type] || ITEM_TONE.heal;
        const idx = playerIndexOf(player.id);
        // O HUD é recriado depois do uso: espera o próximo quadro para achar os elementos novos
        requestAnimationFrame(() => {
            const slot = document.querySelectorAll<HTMLElement>('#game-container .player-slot')[idx];
            const bag = slot?.querySelector<HTMLElement>('.hud-actions .btn');
            const rows = slot ? [...slot.querySelectorAll<HTMLElement>('.pb-party')] : [];
            const targets = targetIdx >= 0 && rows[targetIdx] ? [rows[targetIdx]] : rows.filter(r => !r.classList.contains('fainted') || item.type === 'revive');

            const board = (window as any).PBBoard;
            board?.floatText?.(idx, tone.text(item), tone.color);

            if (reducedMotion() || !targets.length) {
                targets.forEach(r => this.flashRow(r, tone.color));
                return;
            }

            const from = (bag || slot)?.getBoundingClientRect();
            targets.forEach((row, n) => {
                const to = row.getBoundingClientRect();
                const icon = document.createElement('img');
                icon.className = 'pb-itemfx-icon';
                icon.src = `/assets/img/Itens/${item.icon}`;
                icon.alt = '';
                const sx = from ? from.left + from.width / 2 : to.left;
                const sy = from ? from.top + from.height / 2 : to.top;
                icon.style.left = `${sx}px`;
                icon.style.top = `${sy}px`;
                this.root().appendChild(icon);
                const dx = to.left + 28 - sx;
                const dy = to.top + to.height / 2 - sy;
                icon.animate([
                    { transform: 'translate(-50%, -50%) scale(0.6) rotate(0deg)', opacity: 0 },
                    { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.5 - 60}px)) scale(1.3) rotate(-15deg)`, opacity: 1, offset: 0.5 },
                    { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.9) rotate(0deg)`, opacity: 1 }
                ], { duration: 620, delay: n * 90, easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)', fill: 'forwards' })
                    .finished.then(() => { icon.remove(); this.flashRow(row, tone.color); }).catch(() => icon.remove());
            });
        });
    }

    private static flashRow(row: HTMLElement, color: string) {
        row.style.setProperty('--fx', color);
        row.classList.remove('pb-row-fx');
        void row.offsetWidth;
        row.classList.add('pb-row-fx');
        const sparks = document.createElement('div');
        sparks.className = 'pb-row-sparks';
        sparks.innerHTML = Array.from({ length: 8 }, (_, i) => `<i style="--i:${i}"></i>`).join('');
        row.appendChild(sparks);
        window.setTimeout(() => sparks.remove(), 900);
    }

    /** Batalha: o ícone do item é lançado do treinador até o Pokémon em campo. */
    static battleItem(itemId: string) {
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        const scene = document.querySelector('#battle-modal .battle-scene') as HTMLElement | null;
        const trainer = document.getElementById('ply-trainer-img');
        const mon = document.getElementById('ply-img');
        if (!item || !scene || !mon || reducedMotion()) return;
        const s = scene.getBoundingClientRect();
        const a = (trainer || mon).getBoundingClientRect();
        const b = mon.getBoundingClientRect();
        const icon = document.createElement('img');
        icon.className = 'pb-itemfx-icon pb-itemfx-battle';
        icon.src = `/assets/img/Itens/${item.icon}`;
        icon.alt = '';
        icon.style.left = `${a.left - s.left + a.width / 2}px`;
        icon.style.top = `${a.top - s.top + a.height / 2}px`;
        scene.appendChild(icon);
        const dx = (b.left + b.width / 2) - (a.left + a.width / 2);
        const dy = (b.top + b.height / 2) - (a.top + a.height / 2);
        icon.animate([
            { transform: 'translate(-50%, -50%) scale(0.5)', opacity: 0 },
            { transform: `translate(calc(-50% + ${dx / 2}px), calc(-50% + ${dy / 2 - 50}px)) scale(1.2) rotate(-20deg)`, opacity: 1, offset: 0.55 },
            { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.4)`, opacity: 0 }
        ], { duration: 560, easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)', fill: 'forwards' }).finished.finally(() => icon.remove());
    }
}

(window as any).UseFx = UseFx;
