import { GameState } from '../game/GameState';
import { NetworkState } from '../network/SupabaseInit';
import { PLAYER_COLORS } from '../../constants/playerColors';

/**
 * BARRA DE TURNO (sempre visível no topo)
 * Mostra de quem é a vez e a rodada; quando é a sua vez fica dourada e pulsando.
 * "Meu time" leva direto até o seu card no placar (itens, cartas, Pokédex), sem precisar rolar entre os outros.
 * Tocar no nome de quem está jogando leva ao card dele.
 * O evento global ativo fica junto (ícone, nome e rodadas restantes); tocar abre os detalhes.
 */
export class TurnBar {
    private static el: HTMLElement | null = null;
    private static lastTurnKey = '';
    private static lastEventId: string | null = null;

    // Jogador "dono" desta tela: online é o meu; offline é o humano da vez (ou o primeiro humano)
    static mePlayerIndex(): number {
        const players = GameState.players || [];
        if (NetworkState.isOnline) return NetworkState.isSpectator ? -1 : players.findIndex(p => p.id === NetworkState.myPlayerId);
        const cur = players[GameState.turn];
        if (cur && !cur.isCPU) return GameState.turn;
        return players.findIndex(p => !p.isCPU);
    }

    private static ensure(): HTMLElement | null {
        if (this.el && this.el.isConnected) return this.el;
        const host = document.getElementById('game-container');
        if (!host) return null;
        const bar = document.createElement('div');
        bar.id = 'pb-turn-bar';
        bar.setAttribute('role', 'status');
        bar.setAttribute('aria-live', 'polite');
        bar.innerHTML = `
            <button type="button" class="pb-tb-turn" title="Ir até o card de quem está jogando">
                <span class="pb-tb-avatar"><img alt=""></span>
                <span class="pb-tb-text"><small class="pb-tb-kicker"></small><strong class="pb-tb-name"></strong></span>
            </button>
            <span class="pb-tb-round"><small>Rodada</small><b></b></span>
            <button type="button" class="pb-tb-event" title="Ver detalhes do evento" hidden>
                <span class="pb-tb-event-icon" aria-hidden="true"></span>
                <span class="pb-tb-text"><small class="pb-tb-kicker">Evento</small><strong class="pb-tb-event-name"></strong></span>
                <span class="pb-tb-event-left"></span>
            </button>
            <button type="button" class="pb-tb-me" title="Ir até o meu time (itens, cartas e Pokédex)">
                <span class="pb-tb-avatar"><img alt=""></span><span class="pb-tb-me-label">Meu time</span>
            </button>`;
        bar.querySelector('.pb-tb-turn')!.addEventListener('click', () => this.focusPlayer(GameState.turn));
        bar.querySelector('.pb-tb-me')!.addEventListener('click', () => this.focusPlayer(this.mePlayerIndex()));
        bar.querySelector('.pb-tb-event')!.addEventListener('click', () => (window as any).Game?.showEventDetails?.());
        host.appendChild(bar);
        document.body.classList.add('pb-has-turnbar');
        this.el = bar;
        return bar;
    }

    static update() {
        const players = GameState.players || [];
        const cur = players[GameState.turn];
        if (!cur) return;
        const bar = this.ensure();
        if (!bar) return;
        const meIdx = this.mePlayerIndex();
        const mine = meIdx >= 0 && meIdx === GameState.turn && (NetworkState.isOnline || !cur.isCPU);
        const color = PLAYER_COLORS[GameState.turn % PLAYER_COLORS.length];

        bar.classList.toggle('is-mine', mine);
        bar.style.setProperty('--tc', color);
        (bar.querySelector('.pb-tb-turn .pb-tb-avatar img') as HTMLImageElement).src = cur.avatar;
        bar.querySelector('.pb-tb-kicker')!.textContent = mine ? 'É a sua vez!' : 'Vez de';
        bar.querySelector('.pb-tb-name')!.textContent = cur.name;
        bar.querySelector('.pb-tb-round b')!.textContent = String(GameState.round);

        this.updateEvent(bar);

        const meBtn = bar.querySelector('.pb-tb-me') as HTMLButtonElement;
        const me = players[meIdx];
        meBtn.hidden = !me;
        if (me) {
            (meBtn.querySelector('img') as HTMLImageElement).src = me.avatar;
            meBtn.style.setProperty('--mc', PLAYER_COLORS[meIdx % PLAYER_COLORS.length]);
        }

        // Troca de vez: pulso rápido para chamar atenção
        const key = `${GameState.round}:${GameState.turn}`;
        if (key !== this.lastTurnKey) {
            this.lastTurnKey = key;
            bar.classList.remove('is-changed');
            void bar.offsetWidth;
            bar.classList.add('is-changed');
        }
    }

    // Evento global: some quando não há evento ou quando já passou da rodada final
    private static updateEvent(bar: HTMLElement) {
        const btn = bar.querySelector('.pb-tb-event') as HTMLButtonElement;
        const ev = GameState.currentGlobalEvent;
        const active = !!ev && !(GameState.eventEndRound > 0 && GameState.round >= GameState.eventEndRound);
        btn.hidden = !active;
        bar.classList.toggle('has-event', active);
        if (!active || !ev) { this.lastEventId = null; return; }
        const left = GameState.eventEndRound > 0 ? GameState.eventEndRound - GameState.round : 0;
        btn.querySelector('.pb-tb-event-icon')!.textContent = ev.icon;
        btn.querySelector('.pb-tb-event-name')!.textContent = ev.name;
        const leftEl = btn.querySelector('.pb-tb-event-left') as HTMLElement;
        leftEl.textContent = left > 0 ? String(left) : '';
        leftEl.title = left > 0 ? `Faltam ${left} rodada(s)` : '';
        btn.setAttribute('aria-label', `Evento: ${ev.name}${left > 0 ? `, faltam ${left} rodada(s)` : ''}. Ver detalhes`);
        btn.title = `${ev.name}${left > 0 ? ` · faltam ${left} rodada(s)` : ''} — toque para ver detalhes`;
        // Evento novo: destaque rápido
        if (ev.id !== this.lastEventId) {
            this.lastEventId = ev.id;
            btn.classList.remove('is-new');
            void btn.offsetWidth;
            btn.classList.add('is-new');
        }
    }

    // Rola o placar (coluna no PC, carrossel no celular) até o card e destaca
    static focusPlayer(idx: number) {
        if (idx < 0) return;
        const card = document.querySelector(`#hud-col-left .player-slot[data-player-index="${idx}"], #hud-col-right .player-slot[data-player-index="${idx}"]`) as HTMLElement | null;
        if (!card) return;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        card.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center', inline: 'center' });
        card.classList.remove('pb-slot-focus');
        void card.offsetWidth;
        card.classList.add('pb-slot-focus');
        window.setTimeout(() => card.classList.remove('pb-slot-focus'), 1600);
    }
}

(window as any).TurnBar = TurnBar;
