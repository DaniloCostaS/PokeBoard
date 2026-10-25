import { GameState } from '../game/GameState';
import { NetworkState } from '../network/SupabaseInit';

// Presença no online: emotes rápidos e "o que o jogador da vez está fazendo".
// Usa só o broadcast do canal da sala (sendAction); nada é gravado no banco.

export const EMOTES = ['👏', '😂', '😮', '😡', '😭', '🔥'];

// Modais que indicam o que o jogador da vez está fazendo
const ACTIVITY_MODALS: Record<string, string> = {
    'shop-modal': 'na loja',
    'city-modal': 'no Centro Pokémon',
    'board-cards-modal': 'vendo as cartas',
    'battle-cards-modal': 'escolhendo uma carta',
    'board-inventory-modal': 'mexendo na mochila',
    'pokedex-modal': 'olhando a Pokédex',
    'swap-modal': 'escolhendo quem sai do time'
};

export class Presence {
    private static statuses = new Map<number, string>();
    private static lastSent: string | null = null;
    private static lastEmoteAt = 0;
    private static picker: HTMLElement | null = null;
    private static initialized = false;

    static init() {
        if (this.initialized) return;
        this.initialized = true;

        const observer = new MutationObserver(() => this.reportActivity());
        Object.keys(ACTIVITY_MODALS).forEach(id => {
            const el = document.getElementById(id);
            if (el) observer.observe(el, { attributes: true, attributeFilter: ['style'] });
        });

        document.addEventListener('click', (e) => {
            if (this.picker && !this.picker.contains(e.target as Node) && !(e.target as HTMLElement).closest('[data-pb-emote-toggle]')) {
                this.closePicker();
            }
        });
    }

    private static sendAction(type: string, payload: any) {
        const Network = (window as any).Network;
        if (Network?.isOnline && !NetworkState.isSpectator) Network.sendAction(type, payload);
    }

    private static playerIndex(playerId: number) {
        return GameState.players.findIndex(p => p.id === playerId);
    }

    // ------------------------------------------------------------------
    // Emotes
    // ------------------------------------------------------------------
    static canEmote() {
        return NetworkState.isOnline && !NetworkState.isSpectator && NetworkState.myPlayerId >= 0;
    }

    static togglePicker(anchor: HTMLElement) {
        if (this.picker) { this.closePicker(); return; }
        const picker = document.createElement('div');
        picker.className = 'pb-emote-picker';
        picker.setAttribute('role', 'menu');
        EMOTES.forEach(emoji => {
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = emoji;
            b.setAttribute('role', 'menuitem');
            b.setAttribute('aria-label', `Enviar ${emoji}`);
            b.addEventListener('click', () => { this.sendEmote(emoji); this.closePicker(); });
            picker.appendChild(b);
        });
        document.body.appendChild(picker);
        const r = anchor.getBoundingClientRect();
        const pw = picker.offsetWidth, ph = picker.offsetHeight;
        picker.style.left = `${Math.min(Math.max(8, r.left + r.width / 2 - pw / 2), window.innerWidth - pw - 8)}px`;
        picker.style.top = `${r.top - ph - 8 > 8 ? r.top - ph - 8 : r.bottom + 8}px`;
        this.picker = picker;
    }

    private static closePicker() {
        this.picker?.remove();
        this.picker = null;
    }

    static sendEmote(emoji: string) {
        if (!this.canEmote() || !EMOTES.includes(emoji)) return;
        const now = Date.now();
        if (now - this.lastEmoteAt < 1500) return;
        this.lastEmoteAt = now;
        this.showEmote(NetworkState.myPlayerId, emoji);
        this.sendAction('EMOTE', { emoji });
    }

    static showEmote(playerId: number, emoji: string) {
        if (!EMOTES.includes(emoji)) return;
        const idx = this.playerIndex(playerId);
        if (idx < 0) return;
        (window as any).PBBoard?.emote(idx, emoji);
        const card = document.querySelectorAll<HTMLElement>('#game-container .player-slot')[idx];
        if (card) {
            const bubble = document.createElement('span');
            bubble.className = 'pb-hud-emote';
            bubble.textContent = emoji;
            card.appendChild(bubble);
            window.setTimeout(() => bubble.remove(), 1800);
        }
    }

    // ------------------------------------------------------------------
    // "O que está fazendo"
    // ------------------------------------------------------------------
    private static reportActivity() {
        const Game = (window as any).Game;
        if (!this.canEmote() || !Game?.canAct?.()) return;
        const open = Object.keys(ACTIVITY_MODALS).find(id => {
            const el = document.getElementById(id);
            return el && el.style.display && el.style.display !== 'none';
        });
        const status = open ? ACTIVITY_MODALS[open] : null;
        if (status === this.lastSent) return;
        this.lastSent = status;
        this.sendAction('PRESENCE', { status });
    }

    static showStatus(playerId: number, status: string | null) {
        if (status && !Object.values(ACTIVITY_MODALS).includes(status)) return;
        if (status) this.statuses.set(playerId, status);
        else this.statuses.delete(playerId);
        this.applyStatuses();
    }

    // Reaplica os indicadores depois que o HUD é recriado
    static applyStatuses() {
        // Só faz sentido para o jogador da vez; limpa os demais
        const current = GameState.players[GameState.turn];
        [...this.statuses.keys()].forEach(id => { if (!current || id !== current.id) this.statuses.delete(id); });

        document.querySelectorAll('#game-container .pb-hud-status').forEach(n => n.remove());
        this.statuses.forEach((status, playerId) => {
            const idx = this.playerIndex(playerId);
            const header = document.querySelectorAll<HTMLElement>('#game-container .player-slot .hud-header')[idx];
            if (!header) return;
            const chip = document.createElement('span');
            chip.className = 'pb-hud-status';
            chip.textContent = `${GameState.players[idx].name} está ${status}…`;
            header.appendChild(chip);
        });

        document.querySelectorAll<HTMLElement>('[data-pb-emote-toggle]').forEach(btn => { btn.hidden = !this.canEmote(); });
        if (!GameState.players[GameState.turn] || GameState.players[GameState.turn].id !== NetworkState.myPlayerId) this.lastSent = null;
    }
}

(window as any).PBPresence = Presence;
