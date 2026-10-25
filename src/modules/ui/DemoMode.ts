import { Pokemon } from '../../models/Pokemon';
import { MAPA_MEGAS } from '../../constants/mapaMegas';
import { GLOBAL_EVENTS } from '../../constants/globalEvents';
import { NPC_DATA } from '../../constants';
import { GameState } from '../game/GameState';
import { Settings } from './Settings';
import { BattleCore } from '../battle/BattleCore';

// Modo demonstração (abrir com ?demo=1): partida offline com lendários, megas e shinies
// e um painel para disparar cada animação. Não grava nada e não toca no online.

type DemoAction = { label: string; run: () => void | Promise<void> };

const LEGENDS = [150, 249, 384, 487, 493, 888];
const MEGA_READY = [6, 448, 94, 130, 445, 257];
const SHINIES = [25, 133, 197, 282, 248, 9];
const MIXED = [250, 644, 716, 791, 3, 1007];
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export class DemoMode {
    private static eventIdx = -1;
    private static started = false;

    static shouldStart() {
        try { return new URLSearchParams(location.search).get('demo') === '1'; } catch { return false; }
    }

    static async start() {
        if (this.started) return;
        this.started = true;
        const w = window as any;
        // Na demo os sprites animados começam ligados (sem gravar a preferência; o interruptor continua valendo)
        Settings.preview(true);

        document.getElementById('online-login')!.style.display = 'none';
        w.Setup.showOfflineSetup();
        (document.getElementById('num-players') as HTMLSelectElement).value = '4';
        w.Setup.updateSlots();
        (document.getElementById('map-size') as HTMLSelectElement).value = '20';
        const names = ['Ash', 'Misty', 'Brock', 'Gary'];
        names.forEach((n, i) => { const el = document.getElementById(`p${i}-name`) as HTMLInputElement | null; if (el) el.value = n; });
        w.Setup.start();
        await sleep(600);

        const level = 40;
        const make = (id: number, shiny = false) => {
            const mon = new Pokemon(id, level, shiny);
            if (MAPA_MEGAS[id]) mon.megaStone = true;
            return mon;
        };
        const teams = [
            LEGENDS.map((id, i) => make(id, i % 2 === 0)),
            MEGA_READY.map(id => make(id)),
            SHINIES.map(id => make(id, true)),
            MIXED.map((id, i) => make(id, i === 0))
        ];
        GameState.players.forEach((p: any, i: number) => {
            p.team = teams[i];
            p.gold = 1500 + i * 700;
            p.badges = p.badges.map((_: boolean, b: number) => b < 3 - i);
        });
        w.Game.updateHUD();
        this.mountPanel();
    }

    private static player(i = 0) {
        return GameState.players[i];
    }

    private static battle(setup: () => void) {
        const w = window as any;
        if (w.Battle?.active) w.Battle.end(true);
        document.querySelectorAll('.modal-overlay').forEach(m => { (m as HTMLElement).style.display = 'none'; });
        setup();
        // Escolhe o primeiro Pokémon automaticamente quando abrir a seleção
        window.setTimeout(() => {
            const pick = document.querySelector('#pkmn-select-list .mon-select-item:not(.disabled)') as HTMLElement | null;
            pick?.click();
        }, 2300);
    }

    private static actions(): DemoAction[] {
        const w = window as any;
        const Battle = () => w.Battle;
        return [
            { label: 'Selvagem lendário', run: () => this.battle(() => Battle().setup(this.player(1), new Pokemon(384, 45, false), false, 'Selvagem', 0, null, false, 0, '', 1)) },
            { label: 'Selvagem shiny', run: () => this.battle(() => Battle().setup(this.player(2), new Pokemon(130, 30, true), false, 'Selvagem', 0, null, false, 0, '', 2)) },
            {
                label: 'Mega Evolução', run: async () => {
                    if (!Battle().active) {
                        this.battle(() => Battle().setup(this.player(1), new Pokemon(249, 45, false), false, 'Selvagem', 0, null, false, 0, '', 1));
                        await sleep(3200);
                    }
                    const mon = BattleCore.activeMon as any;
                    const megaId = mon && !mon.isTemp ? MAPA_MEGAS[mon.id] : 0;
                    if (megaId) BattleCore.performMegaEvolution(megaId);
                    else w.GameDialog?.toast('O Pokémon em campo não tem Mega Evolução (ou já evoluiu).', { tone: 'info' });
                }
            },
            { label: 'Atacar', run: () => Battle().active ? Battle().attack() : w.GameDialog?.toast('Abra uma batalha primeiro.', { tone: 'info' }) },
            { label: 'Ginásio (VS)', run: () => this.battle(() => Battle().setup(this.player(0), null, false, 'Ginásio', 0, null, true, 1, '', 1)) },
            {
                label: 'Treinador NPC', run: () => {
                    const npcId = Object.keys(NPC_DATA).map(Number)[0];
                    const npc = NPC_DATA[npcId];
                    this.battle(() => Battle().setup(this.player(3), new Pokemon(npc.team[0] || 19, 30, false), false, npc.name, npc.gold, null, false, 0, npc.img, npcId));
                }
            },
            { label: 'PvP', run: () => this.battle(() => Battle().setup(this.player(0), null, true, '', 0, this.player(1))) },
            { label: 'Evolução', run: () => w.Cinematics?.showEvolution(4, 'Charmander', 5, 'Charmeleon', false) },
            { label: 'Insígnia', run: () => w.Cinematics?.showBadge(GameState.activeGyms?.[0] || 1, this.player(0)) },
            { label: 'Captura lendária', run: () => w.Cinematics?.showCapture(487, 'Giratina', true, true) },
            { label: 'Volta completa', run: () => w.Cinematics?.lap(this.player(0), 500) },
            { label: 'Missão', run: () => w.Cinematics?.quest(this.player(0), 'Caçada Lendária', 'Master Ball + Carta Rara') },
            {
                label: 'Próximo clima', run: () => {
                    this.eventIdx = (this.eventIdx + 1) % (GLOBAL_EVENTS.length + 1);
                    const ev = GLOBAL_EVENTS[this.eventIdx] || null;
                    GameState.currentGlobalEvent = ev;
                    GameState.eventEndRound = GameState.round + 5;
                    w.Game.updateHUD();
                    w.GameDialog?.toast(ev ? `Evento: ${ev.name}` : 'Sem evento', { tone: 'info' });
                }
            },
            { label: '+4 rodadas (dia/noite)', run: () => { GameState.round += 4; w.Game.updateHUD(); } },
            { label: 'Ouro +300', run: () => { this.player(0).gold += 300; w.Game.updateHUD(); } },
            { label: 'Emote', run: () => w.PBBoard?.emote(Math.floor(Math.random() * 4), ['👏', '😂', '😮', '😡', '😭', '🔥'][Math.floor(Math.random() * 6)]) },
            { label: 'Rolar dado', run: () => { if (!GameState.turnStarted) w.Game.iniciarTurno(); window.setTimeout(() => w.Game.rollDice(), 500); } },
            { label: 'Pódio', run: () => w.Cinematics?.podium(this.player(0).id) }
        ];
    }

    private static mountPanel() {
        const panel = document.createElement('div');
        panel.className = 'pb-demo-panel';
        panel.innerHTML = `<div class="pb-demo-head"><strong>Modo demonstração</strong><button type="button" class="pb-demo-toggle" aria-expanded="true">Esconder</button></div><div class="pb-demo-grid"></div>`;
        const grid = panel.querySelector('.pb-demo-grid') as HTMLElement;
        this.actions().forEach(a => {
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = a.label;
            b.addEventListener('click', () => { void a.run(); });
            grid.appendChild(b);
        });
        const toggle = panel.querySelector('.pb-demo-toggle') as HTMLButtonElement;
        toggle.addEventListener('click', () => {
            const open = panel.classList.toggle('is-collapsed') === false;
            toggle.textContent = open ? 'Esconder' : 'Mostrar';
            toggle.setAttribute('aria-expanded', String(open));
        });
        // No celular começa recolhido para não cobrir o jogo
        if (window.innerWidth <= 1000) toggle.click();
        document.body.appendChild(panel);
    }
}
