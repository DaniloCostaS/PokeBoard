import { GameState } from './GameState';
import { GameEvents } from './GameEvents';
import { Pokemon } from '../../models/Pokemon';
import { MapSystem } from '../../systems/MapSystem';
import { Network } from '../../systems/Network';
import { QUESTS_DB, readyQuests } from '../../constants/quests';
import { activeEffects } from '../ui/PlayerEffects';
import { unseenNewCards } from '../cards/NewCards';
import { newItemsOf, unseenItemsCount, markItemsSeen, seenChanged } from '../ui/NewItems';
import { Sfx } from '../audio/Sfx';
import {
    TILE,
    SHOP_ITEMS,
    NPC_DATA,
    CARDS_DB,
    CARD_RARITIES
} from '../../constants';
import { POKEDEX } from '../../constants/pokedex';
import { TYPE_CHART } from '../../constants/typeChart';
import { PLAYER_COLORS } from '../../constants/playerColors';
import { GYM_DATA } from '../../constants/gyms';
import { GLOBAL_EVENTS } from '../../constants/globalEvents';
import { MAPA_MEGAS } from '../../constants/mapaMegas';
import { BoardRenderer } from '../board/BoardRenderer';
import { CardHand } from '../cards/CardHand';
import { Backpack } from '../ui/Backpack';
import { GameFeel } from '../ui/GameFeel';
import { GameDialog } from '../ui/GameDialog';
import { ScreenKit } from '../ui/ScreenKit';
import { PokedexScreen } from '../ui/PokedexScreen';
import { TYPE_COLORS } from '../ui/TypeTooltip';
import { Cosmetics } from '../profile/Cosmetics';
import { TurnBar } from '../ui/TurnBar';
import { SupabaseDataStore } from '../network/SupabaseDataStore';
import { NetworkState } from '../network/SupabaseInit';


export class GameUI {
    // Jogadores com o time aberto em modo detalhado (preferência deste navegador)
    private static expandedTeams: Set<number> | null = null;
    private static teamPrefs(): Set<number> {
        if (!this.expandedTeams) {
            try { this.expandedTeams = new Set(JSON.parse(localStorage.getItem('pb_hud_team_open') || '[]')); }
            catch { this.expandedTeams = new Set(); }
        }
        return this.expandedTeams;
    }
    static isTeamExpanded(playerId: number) { return this.teamPrefs().has(playerId); }
    static toggleTeamView(playerId: number) {
        const prefs = this.teamPrefs();
        if (prefs.has(playerId)) prefs.delete(playerId); else prefs.add(playerId);
        try { localStorage.setItem('pb_hud_team_open', JSON.stringify([...prefs])); } catch { /* só nesta sessão */ }
        this.updateHUD();
        TurnBar.focusPlayer(GameState.players.findIndex(pl => pl.id === playerId));
    }

    private static hudOneColumn = window.matchMedia('(max-width: 1599px)');
    private static hudLayoutWatched = false;
    private static hudSlots: { key: string; el: HTMLElement }[] = [];

    static updateHUD() {
        const left = document.getElementById('hud-col-left')!;
        const right = document.getElementById('hud-col-right')!;
        if (!GameState.players || GameState.players.length === 0) {
            left.innerHTML = '';
            right.innerHTML = '';
            this.hudSlots = [];
            return;
        }
        const leftSlots: HTMLElement[] = [];
        const rightSlots: HTMLElement[] = [];

        const oneColumn = this.hudOneColumn.matches;
        if (!this.hudLayoutWatched) {
            this.hudLayoutWatched = true;
            this.hudOneColumn.addEventListener('change', () => this.updateHUD());
        }

        GameState.players.forEach(p => {
            if (p.team) {
                p.team.forEach(mon => {
                    if (mon.validateAndFix) mon.validateAndFix();
                });
            }
        });

        // Placar: insígnias primeiro, depois ouro
        const ranking = [...GameState.players]
            .sort((a, b) => (b.badges.filter(Boolean).length - a.badges.filter(Boolean).length) || (b.gold - a.gold))
            .map(p => p.id);

        GameState.players.forEach((p, i) => {
            const rank = ranking.indexOf(p.id) + 1;
            const d = document.createElement('div');
            const NetworkObj = (window as any).Network || Network;
            d.className = `player-slot ${i === GameState.turn ? 'active' : ''}${i === TurnBar.mePlayerIndex() ? ' is-me' : ''}`;
            d.dataset.playerIndex = String(i);
            const playerColor = PLAYER_COLORS[i % PLAYER_COLORS.length];
            d.style.background = `linear-gradient(135deg, ${playerColor}cc 0%, rgba(26, 26, 29, 0.96) 100%)`;
            d.style.borderLeft = `4px solid ${playerColor}`;

            let badgeHTML = `<div class="badges-container" style="cursor: pointer;" onclick="window.openPlayerBadges(${i})" title="Clique para abrir o Porta-Insígnias de ${p.name}">`;
            const totalGyms = GameState.activeGyms && GameState.activeGyms.length > 0 ? GameState.activeGyms.length : 8;
            for (let b = 0; b < totalGyms; b++) {
                const isActive = p.badges[b];
                const actualGymId = GameState.activeGyms ? GameState.activeGyms[b] : (b + 1);
                const gData = GYM_DATA.find(g => g.id === actualGymId);
                const imgUrl = gData ? `/assets/img/Insignias/${gData.badgeImg}` : '';
                const style = imgUrl ? `background-image: url('${imgUrl}');` : '';
                badgeHTML += `<div class="badge-slot ${isActive ? 'active' : ''}" style="${style}" title="${gData ? `Insígnia ${gData.type.join('/')} · ${gData.leaderName}` : `Insígnia ${b + 1}`}${isActive ? ' (conquistada)' : ''}"></div>`;
            }
            badgeHTML += '</div>';

            const th = p.team.map((m, slotIndex) => {
                const total = m.baseTotal || (m.maxHp + m.atk + m.def + m.speed);
                const tier = m.isLegendary ? 'legend' : total >= 330 ? 'elite' : total >= 280 ? 'strong' : total >= 220 ? 'good' : 'base';
                const hpPct = Math.max(0, Math.min(100, (m.currentHp / m.maxHp) * 100));
                const xpPct = Math.max(0, Math.min(100, (m.currentXp / m.maxXp) * 100));

                const megaIcon = m.megaStone ? `<img class="pb-party-tag" src="/assets/img/megaStone.png" title="Mega Pedra equipada" alt="">` : '';
                const heldItemData = m.heldItem ? SHOP_ITEMS.find(i => i.id === m.heldItem) : null;
                const itemIcon = heldItemData ? `<img class="pb-party-tag" src="/assets/img/Itens/${heldItemData.icon}" title="Segurando: ${heldItemData.name}" alt="">` : '';
                const vinculoIcon = m.vinculoSupremo ? `<span class="pb-party-flag" title="Vínculo Supremo">🤝</span>` : '';
                const happinessIcon = m.happiness === 100 ? `<span class="pb-party-flag" title="Vínculo Afetivo (100% Felicidade)">💖</span>` : '';

                return `
                <div class="poke-card pb-party pb-tier-${tier} ${m.isShiny ? 'is-shiny' : ''} ${m.isFainted() ? 'fainted' : ''}" onclick="window.Game.openPokemonDetail(${i}, ${slotIndex})" title="${m.name} · Lv.${m.level}">
                    <div class="pb-party-ball"><img src="${m.getSprite()}" class="poke-card-img" alt="" decoding="async" onerror="if(!this.dataset.retry){this.dataset.retry=1;this.src=this.src.split('?')[0]+'?r='+Date.now()}"></div>
                    <div class="pb-party-info">
                        <div class="pb-party-top">
                            <span class="pb-party-name">${m.name}</span>
                            ${megaIcon}${itemIcon}${vinculoIcon}${happinessIcon}
                            <span class="pb-party-lv">Lv${m.level}</span>
                        </div>
                        <div class="pb-party-types">${m.getTypeBadgesHTML ? m.getTypeBadgesHTML('flex-start') : ''}</div>
                        <div class="pb-hp" title="HP ${m.currentHp}/${m.maxHp}">
                            <span class="pb-hp-label">HP</span>
                            <div class="pb-hp-track"><div class="pb-hp-fill ${(window as any).Battle?.getHpColor(m.currentHp, m.maxHp)}" style="width:${hpPct}%"></div></div>
                            <span class="pb-hp-num">${m.currentHp}/${m.maxHp}</span>
                        </div>
                        <div class="pb-xp-row" title="EXP ${Math.floor(m.currentXp)}/${m.maxXp}">
                            <span class="pb-xp-label">EXP</span>
                            <div class="pb-xp"><div class="pb-xp-fill" style="width:${xpPct}%"></div></div>
                            <span class="pb-xp-num">${Math.floor(m.currentXp)}/${m.maxXp}</span>
                        </div>
                        <div class="pb-party-stats"><span><b>ATQ</b>${m.atk}</span><span><b>DEF</b>${m.def}</span><span><b>VEL</b>${m.speed}</span></div>
                    </div>
                </div>`;
            }).join('');

            // Visão compacta (padrão): grade com sprite, nível e HP; "Detalhes" abre a ficha completa deste jogador
            const expanded = this.isTeamExpanded(p.id);
            const hpColor = (m: Pokemon) => (window as any).Battle?.getHpColor(m.currentHp, m.maxHp) || '';
            const mini = p.team.map((m, slotIndex) => {
                const hpPct = Math.max(0, Math.min(100, (m.currentHp / m.maxHp) * 100));
                const heldItemData = m.heldItem ? SHOP_ITEMS.find(item => item.id === m.heldItem) : null;
                let heldIconHTML = '';
                let heldTitlePart = '';
                if (m.megaStone) {
                    heldIconHTML = `<img class="pb-mini-item" src="/assets/img/megaStone.png" title="Segurando: Mega Pedra" alt="">`;
                    heldTitlePart = ' · Segurando: Mega Pedra';
                } else if (heldItemData) {
                    heldIconHTML = `<img class="pb-mini-item" src="/assets/img/Itens/${heldItemData.icon}" title="Segurando: ${heldItemData.name}" alt="">`;
                    heldTitlePart = ` · Segurando: ${heldItemData.name}`;
                }

                return `
                <button type="button" class="pb-mini${m.isShiny ? ' is-shiny' : ''}${m.isFainted() ? ' fainted' : ''}${m.isLegendary ? ' is-legend' : ''}" onclick="window.Game.openPokemonDetail(${i}, ${slotIndex})" title="${m.name} · Lv.${m.level} · HP ${m.currentHp}/${m.maxHp}${heldTitlePart}" aria-label="${m.name}, nível ${m.level}, HP ${m.currentHp} de ${m.maxHp}">
                    <img class="pb-mini-sprite" src="${m.getSprite()}" alt="" decoding="async" onerror="if(!this.dataset.retry){this.dataset.retry=1;this.src=this.src.split('?')[0]+'?r='+Date.now()}">
                    <span class="pb-mini-lv">${m.level}</span>
                    ${heldIconHTML}
                    <i class="pb-mini-hp"><u class="pb-hp-fill ${hpColor(m)}" style="width:${hpPct}%"></u></i>
                </button>`;
            }).join('');
            const teamHTML = `
            <div class="pb-team-head">
                <span class="pb-team-count">Time <b>${p.team.length}</b>/6</span>
                <button type="button" class="pb-team-toggle" onclick="window.Game.toggleTeamView(${p.id})" aria-expanded="${expanded}">${expanded ? 'Resumir' : 'Detalhes'}</button>
            </div>
            ${expanded ? `<div class="hud-team">${th}</div>` : `<div class="pb-team-mini">${mini}</div>`}`;

            const totalItems = Object.values(p.items).reduce((sum, val) => sum + val, 0);
            const totalCards = p.cards.length;

            // Efeitos ativos (cartas e status) bem visíveis: ícone, nome e quantas vezes ainda valem
            const effects = activeEffects(p);
            const effectsHTML = effects.length
                ? `<div class="pb-fx-row">${effects.map(fx => `<span class="pb-fx pb-fx--${fx.tone} pb-fx--${fx.key}" title="${fx.name}: ${fx.detail}"${fx.color ? ` style="--fx:${fx.color}"` : ''}><i aria-hidden="true">${fx.icon}</i><span class="pb-fx-name">${fx.name}</span>${fx.count ? `<b>${fx.count}</b>` : ''}</span>`).join('')}</div>`
                : '';

            // Missão pronta para resgatar e cartas novas da rodada (só para quem pode agir sobre elas)
            const canSeeOwn = !NetworkObj.isOnline || p.id === NetworkObj.myPlayerId;
            const readyCount = canSeeOwn ? readyQuests(p).length : 0;
            const newCards = canSeeOwn ? unseenNewCards(p) : 0;
            const newItems = canSeeOwn ? unseenItemsCount(p) : 0;

            const maxLives = GameState.maxLives();
            const livesHTML = maxLives > 0
                ? `<span class="pb-lives-badge${p.lives <= 1 ? ' is-last' : ''}" title="Vidas: ${p.lives}/${maxLives}" aria-label="Vidas: ${p.lives} de ${maxLives}"><i></i>${p.lives}</span>`
                : '';
            const frame = Cosmetics.frameClass(p.cosmetics?.frame);
            const titleHTML = p.cosmetics?.title ? `<span class="pb-trainer-title">${Cosmetics.escape(p.cosmetics.title)}</span>` : '';

            const nameLen = (p.name || '').length;
            const nameFontSize = nameLen <= 7 ? '0.92rem' : nameLen <= 10 ? '0.84rem' : nameLen <= 13 ? '0.76rem' : nameLen <= 16 ? '0.70rem' : '0.64rem';

            const slotHtml = ` 
            <div class="hud-header pb-trainer-card" style="--pc:${playerColor}">
                ${i === GameState.turn ? '<span class="pb-turn-chip pb-turn-ribbon"><i></i>Na vez</span>' : ''}
                <div class="pb-trainer-row">
                    <div class="hud-name-group" onclick="window.Game.openPlayerMastery(${i})" title="Ver Maestria do Treinador">
                        <span class="pb-trainer-avatar ${frame}"><img src="${p.avatar}" class="hud-avatar-img" alt="">${livesHTML}</span>
                        <span class="pb-trainer-text">
                            <span class="pb-trainer-name" style="--pb-name-size:${nameFontSize}; font-size:var(--pb-name-size);">${p.name}</span>
                            ${titleHTML}
                            <span class="pb-trainer-meta">
                                <span class="pb-rank pb-rank--${rank}" data-pb-rank="${p.id}" title="${rank}º no placar">${rank}º</span>
                                <div class="hud-gold" title="Ouro" data-pb-gold="${p.id}">${p.gold} G</div>
                            </span>
                        </span>
                    </div>
                </div>
                ${effectsHTML}
            </div> 
            ${badgeHTML} 
            ${teamHTML}
            <div class="hud-actions">
                <button class="btn btn-secondary btn-mini${newItems ? ' has-new' : ''}" onclick="window.Game.openInventoryModal(${i})" title="${newItems ? `${newItems} item(ns) novo(s) na mochila` : 'Mochila'}" aria-label="Mochila: ${totalItems} itens${newItems ? `, ${newItems} novo(s)` : ''}"><i class="pb-ico pb-ico-bag"></i><span>${totalItems}</span>${newItems ? `<em class="pb-hud-new">+${newItems}</em>` : ''}</button>
                <button class="btn btn-secondary btn-mini${readyCount ? ' has-alert' : ''}" onclick="window.QuestManager.openQuestsModal(window.Game.players[${i}])" title="${readyCount ? `${readyCount} missão(ões) pronta(s) para resgatar!` : 'Missões'}" aria-label="Missões: ${p.activeQuests ? p.activeQuests.length : 0}${readyCount ? `, ${readyCount} pronta(s) para resgatar` : ''}"><i class="pb-ico pb-ico-quest"></i><span>${p.activeQuests ? p.activeQuests.length : 0}</span>${readyCount ? `<em class="pb-hud-alert">!</em>` : ''}</button>
                <button class="btn btn-secondary btn-mini${newCards ? ' has-new' : ''}" onclick="window.Game.openBoardCards(${i})" title="${newCards ? `${newCards} carta(s) nova(s) nesta rodada` : 'Cartas'}" aria-label="Cartas: ${totalCards}${newCards ? `, ${newCards} nova(s)` : ''}"><i class="pb-ico pb-ico-cards"></i><span>${totalCards}</span>${newCards ? `<em class="pb-hud-new">+${newCards}</em>` : ''}</button>
                <button class="btn btn-secondary btn-mini" onclick="window.Game.openPokedex(${i})" title="Pokédex" aria-label="Pokédex"><i class="pb-ico pb-ico-dex"></i><span>Dex</span></button>
            </div>`;
            // Card igual ao anterior não é recriado: evita refazer imagens e layout a cada atualização vinda da rede
            const slotKey = `${d.className}|${d.style.cssText}|${slotHtml}`;
            let slotEl = this.hudSlots[i]?.key === slotKey ? this.hudSlots[i].el : null;
            if (!slotEl) {
                d.innerHTML = slotHtml;
                slotEl = d;
                this.hudSlots[i] = { key: slotKey, el: d };
            }
            // Até 1599px (notebook e celular) todos os cards ficam numa coluna/carrossel só; antes eram duas caixas de meia altura que cortavam os cards
            if (oneColumn || i < Math.ceil(GameState.players.length / 2)) leftSlots.push(slotEl);
            else rightSlots.push(slotEl);
        });
        this.hudSlots.length = GameState.players.length;
        const placeSlots = (col: HTMLElement, slots: HTMLElement[]) => {
            const current = Array.from(col.children).filter(n => n.classList.contains('player-slot'));
            if (current.length === slots.length && current.every((n, k) => n === slots[k])) return;
            current.forEach(n => n.remove());
            col.append(...slots);
        };
        placeSlots(left, leftSlots);
        placeSlots(right, rightSlots);

        const turnPlayer = GameState.players[GameState.turn];
        if (turnPlayer) document.getElementById('turn-indicator')!.innerText = turnPlayer.name;
        TurnBar.update();
        const elRound = document.getElementById('round-indicator'); if (elRound) elRound.innerText = GameState.round.toString();
        const elRoom = document.getElementById('room-code-indicator');

        let eventEl = document.getElementById('global-event-indicator');
        if (!eventEl) {
            const infoSec = document.querySelector('.info-section') || document.getElementById('hud-col-right');
            if (infoSec) {
                eventEl = document.createElement('div');
                eventEl.id = 'global-event-indicator';
                if (infoSec.id === 'hud-col-right') infoSec.insertBefore(eventEl, infoSec.firstChild);
                else infoSec.appendChild(eventEl);
            }
        }
        if (eventEl) {
            if (GameState.currentGlobalEvent && GameState.eventEndRound > 0 && GameState.round >= GameState.eventEndRound) {
                GameState.currentGlobalEvent = null;
            }

            const boardWrapper = document.getElementById('board-wrapper');
            if (boardWrapper) {
                // Remove todas as classes de weather
                boardWrapper.className = boardWrapper.className.replace(/\bweather-\S+/g, '');
            }

            if (GameState.currentGlobalEvent) {
                const roundsLeft = GameState.eventEndRound - GameState.round;
                eventEl.innerHTML = `
                <div class="global-event-card" onclick="window.Game.showEventDetails()">
                    <b style="color: #f1c40f;">${GameState.currentGlobalEvent.icon} ${GameState.currentGlobalEvent.name}</b><br>
                    <span style="font-size: 0.65rem; color: #bdc3c7;">Faltam ${roundsLeft} rodada(s)</span>
                </div>`;

                if (boardWrapper) {
                    boardWrapper.classList.add(`weather-${GameState.currentGlobalEvent.id}`);
                }
            } else {
                eventEl.innerHTML = '';
            }
        }

        const NetworkObj = (window as any).Network || Network;
        if (elRoom) { elRoom.innerText = NetworkObj.isOnline ? (NetworkObj.currentRoomAlias) : "LOCAL"; }
        const avgLvl = GameState.getGlobalAverageLevel();
        const elAvg = document.getElementById('avg-lvl-indicator'); if (elAvg) elAvg.innerText = `Lv.${avgLvl}`;
        const minLvl = Math.max(1, avgLvl - 2);
        const maxLvl = Math.min(25, avgLvl + 2);
        const elSvg = document.getElementById('svg-lvl-indicator'); if (elSvg) elSvg.innerText = `Lv.${minLvl}-Lv.${maxLvl}`;
        const elGym = document.getElementById('gym-lvl-indicator'); if (elGym) elGym.innerText = `Lv.${avgLvl + 1}`;
        let totalMons = 0; GameState.players.forEach(p => totalMons += p.team.length);
        const avgTeam = Math.max(1, Math.min(6, Math.round(totalMons / Math.max(1, GameState.players.length))));
        const elTeam = document.getElementById('npc-team-indicator'); if (elTeam) elTeam.innerText = avgTeam.toString();

        const btnAdmin = document.getElementById('btn-admin-panel');
        if (btnAdmin) {
            if (!NetworkObj || !NetworkObj.isOnline || NetworkObj.isHost) {
                btnAdmin.style.display = 'block';
            } else {
                btnAdmin.style.display = 'none';
            }
        }

        const btnSave = document.getElementById('save-game-btn');
        if (btnSave) {
            btnSave.style.display = NetworkObj.isOnline ? 'none' : 'block';
        }

        if (!BoardRenderer.failed) { BoardRenderer.refreshGymMarks(); BoardRenderer.refreshEffectTags(); }
        this.notifyReadyQuests();
        GameFeel.onHudUpdate();
    }

    // Aviso (uma vez por missão) quando uma missão fica pronta para resgatar, venha a mudança de onde vier
    private static notifiedQuests = new Set<string>();
    private static notifyReadyQuests() {
        const NetworkObj = (window as any).Network || Network;
        if (NetworkObj.isOnline && NetworkObj.isSpectator) return;
        GameState.players.forEach(p => {
            if (p.isCPU || (NetworkObj.isOnline && p.id !== NetworkObj.myPlayerId)) return;
            readyQuests(p).forEach(q => {
                const key = `${p.id}:${q.id}`;
                if (this.notifiedQuests.has(key)) return;
                this.notifiedQuests.add(key);
                const who = NetworkObj.isOnline ? '' : ` (${p.name})`;
                GameDialog.toast(`🎯 Missão pronta para resgatar${who}: ${q.name}. Abra Missões para pegar a recompensa.`, { tone: 'success', duration: 6000 });
                Sfx.play('achievement');
            });
        });
        // Missão resgatada ou trocada sai da lista: se voltar a ficar pronta, avisa de novo
        const live = new Set<string>();
        GameState.players.forEach(p => readyQuests(p).forEach(q => live.add(`${p.id}:${q.id}`)));
        this.notifiedQuests.forEach(k => { if (!live.has(k)) this.notifiedQuests.delete(k); });
    }

    static renderBoard() {
        const area = document.getElementById('board-area')!;
        if (!BoardRenderer.failed) {
            area.querySelectorAll('.tile').forEach(n => n.remove());
            area.style.gridTemplateColumns = '';
            area.style.gridTemplateRows = '';
            BoardRenderer.onGymTap = (actualGymId, gid) => (GameUI as any).openGymDetail(actualGymId, gid);
            BoardRenderer.init(area).then(ok => { if (!ok) this.renderBoardDom(); });
            BoardRenderer.render();
            return;
        }
        this.renderBoardDom();
    }

    // Fallback sem WebGL: tabuleiro em DOM
    static renderBoardDom() {
        const area = document.getElementById('board-area')!;
        area.innerHTML = '';
        area.style.gridTemplateColumns = `repeat(${MapSystem.size}, 1fr)`;
        area.style.gridTemplateRows = `repeat(${MapSystem.size}, 1fr)`;

        for (let y = 0; y < MapSystem.size; y++) {
            for (let x = 0; x < MapSystem.size; x++) {
                const d = document.createElement('div');
                let c = 'path';
                let tooltip = "";
                const t = MapSystem.grid[y][x];

                if (t === TILE.GRASS) {
                    c = 'grass';
                    tooltip = "Terreno: Grama\nTipos: Grama, Inseto, Normal, Veneno, Voador, Noturno";
                }
                else if (t === TILE.WATER) {
                    c = 'water';
                    tooltip = "Terreno: Água\nTipos: Água, Gelo, Dragão, Fada";
                }
                else if (t === TILE.GROUND) {
                    c = 'ground';
                    tooltip = "Terreno: Terra/Pedra\nTipos: Terra, Pedra, Fogo, Lutador, Elétrico, Psíquico, Fantasma, Aço";
                }
                else if (t === TILE.CITY) c = 'city';
                else if (t === TILE.GYM) c = 'gym';
                else if (t === TILE.EVENT) c = 'event';
                else if (NPC_DATA[t]) {
                    c = 'npc-tile';
                    tooltip = `Treinador: ${NPC_DATA[t].name}\nRecompensa: ${NPC_DATA[t].gold}G`;
                    if (NPC_DATA[t].img) {
                        d.style.backgroundImage = `url('/assets/img/NPCs/${NPC_DATA[t].img}')`;
                        d.style.backgroundSize = '100% 100%';
                        d.style.backgroundRepeat = 'no-repeat';
                    }
                }

                d.className = `tile ${c}`;
                d.id = `tile-${x}-${y}`;
                if (MapSystem.size >= 30) d.style.fontSize = '8px';
                if (tooltip) d.title = tooltip;

                if (t === TILE.GYM) {
                    const gid = MapSystem.gymLocations[`${x},${y}`];
                    if (gid) {
                        const actualGymId = GameState.activeGyms ? GameState.activeGyms[gid - 1] : gid;
                        const gData = GYM_DATA.find(g => g.id === actualGymId);
                        if (gData) {
                            d.style.backgroundImage = `url('/assets/img/Ginasios/${gData.gymImg}')`;
                            d.style.backgroundSize = '100% 100%';
                            d.style.backgroundRepeat = 'no-repeat';
                            d.title = `Ginásio ${gData.type.join(' / ')} - Líder ${gData.leaderName} - Insígnia ${gid} (Clique para ver detalhes)`;
                            d.style.cursor = 'pointer';
                            d.onclick = () => {
                                (GameUI as any).openGymDetail(actualGymId, gid);
                            };
                        }
                        d.innerText = "";
                    }
                }
                area.appendChild(d);
            }
        }
    }

    static moveVisuals() {
        if (!BoardRenderer.failed) {
            BoardRenderer.syncTokens();
            return;
        }
        GameState.players.forEach((p, idx) => {
            const currentTile = document.getElementById(`tile-${p.x}-${p.y}`);
            if (!currentTile) return;
            let token = document.getElementById(`p-token-${idx}`);
            if (token && token.parentElement === currentTile) {
                if (idx === GameState.turn) token.classList.add('active-token');
                else token.classList.remove('active-token');
                return;
            }
            if (token) token.remove();
            const t = document.createElement('div');
            t.id = `p-token-${idx}`;
            t.className = `player-token ${idx === GameState.turn ? 'active-token' : ''}`;
            t.style.backgroundImage = `url('${p.avatar}')`;
            t.style.borderColor = PLAYER_COLORS[idx % PLAYER_COLORS.length];
            if (MapSystem.size >= 30) { t.style.width = '90%'; t.style.height = '90%'; }
            currentTile.appendChild(t);
            if (idx === GameState.turn) currentTile.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
        });
    }

    static currentLogFilter: string = 'all';

    static filterLogs(type: string) {
        this.currentLogFilter = type;
        const container = document.getElementById('log-container');
        if (!container) return;

        const searchInput = document.getElementById('log-search-input') as HTMLInputElement;
        const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";

        const entries = container.querySelectorAll('.log-entry');
        entries.forEach((el: any) => {
            const entryType = el.getAttribute('data-type');
            const entryText = el.innerText.toLowerCase();
            const matchesType = (type === 'all' || entryType === type);
            const matchesSearch = searchText === "" || entryText.includes(searchText);

            el.style.display = (matchesType && matchesSearch) ? "flex" : "none";
        });
    }

    static renderAllLogs() {
        const container = document.getElementById('log-container');
        if (!container) return;
        container.innerHTML = GameState.globalLogs.map((l: any) => this.logEntryHtml(l)).join('');
        container.scrollTop = 0;
    }

    // Log novo vindo da rede: entra só a linha nova, sem refazer as outras 200
    static prependLog(l: any) {
        const container = document.getElementById('log-container');
        if (!container) return;
        container.insertAdjacentHTML('afterbegin', this.logEntryHtml(l));
        while (container.children.length > 200) container.lastElementChild!.remove();
        container.scrollTop = 0;
    }

    private static logEntryHtml(l: any): string {
        const currentFilter = (this as any).currentLogFilter || 'all';
        const searchInput = document.getElementById('log-search-input') as HTMLInputElement;
        const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";

        {
            let icon = "📟";
            if (l.type === "battle") icon = "⚔️";
            else if (l.type === "cards") icon = "🃏";
            else if (l.type === "gold") icon = "💰";
            else if (l.type === "items") icon = "🎒";
            else if (l.type === "turn") icon = "🛑";
            else if (l.type === "start_turn") icon = "▶️";
            else if (l.type === "xp") icon = l.text.includes("subiu para o Nível") ? "⬆️" : "💹";

            const mLower = l.text.toLowerCase();
            if (mLower.includes("rolou o dado")) icon = "🎲";
            if (mLower.includes("poção") || mLower.includes("curou")) icon = "🧪";
            if (mLower.includes("capturou")) icon = "⚽";
            if (mLower.includes("encontrou um item")) icon = "🎁";

            const matchesSearch = searchText === "" || mLower.includes(searchText);
            const displayStyle = (currentFilter === 'all' || currentFilter === l.type) && matchesSearch ? "flex" : "none";

            let battleBtn = "";
            if (l.battleId) {
                battleBtn = `<button class="btn-view-log" onclick="window.Game.viewBattleLog('${l.battleId}')">Ver Log de Combate</button>`;
            }

            return `
                <div class="log-entry" style="${l.style || ''}; display:${displayStyle}" data-type="${l.type}">
                    <div class="log-header">
                        <span class="log-time">${l.timestamp}</span>
                    </div>
                    <div class="log-body">
                        <div class="log-icon-wrapper">${icon}</div>
                        <div class="log-text">
                            ${l.text}
                            ${battleBtn}
                        </div>
                    </div>
                </div>
            `;
        }
    }

    static updateAdminPlayerInfo() {
        const pSelect = document.getElementById('admin-player-select') as HTMLSelectElement;
        const badge = document.getElementById('admin-legendary-status-badge');
        if (!pSelect || !badge) return;

        const pIdx = parseInt(pSelect.value, 10);
        const p = GameState.players[pIdx];
        if (!p) return;

        const isBlocked = !!(p.effects && p.effects.playedLegendary);
        if (isBlocked) {
            badge.style.background = 'rgba(231, 76, 60, 0.2)';
            badge.style.color = '#ff6b6b';
            badge.style.borderColor = '#e74c3c';
            badge.innerHTML = '🔴 Bloqueada (Já usou)';
        } else {
            badge.style.background = 'rgba(46, 213, 115, 0.2)';
            badge.style.color = '#2ed573';
            badge.style.borderColor = '#2ed573';
            badge.innerHTML = '🟢 Liberada (Pode usar)';
        }
    }

    static adminFilterPokemon(query: string = "") {
        const pkmnSelect = document.getElementById('admin-pokemon-select') as HTMLSelectElement;
        if (!pkmnSelect) return;

        const currentVal = pkmnSelect.value;
        const q = query.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        pkmnSelect.innerHTML = '';

        const allMons = [...POKEDEX].sort((a, b) => a.name.localeCompare(b.name));
        const filtered = allMons.filter(p => {
            if (!q) return true;
            const nameNorm = p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return nameNorm.includes(q) || p.id.toString() === q || `#${p.id}`.includes(q);
        });

        if (filtered.length === 0) {
            const opt = document.createElement('option');
            opt.value = "";
            opt.innerText = "Nenhum Pokémon encontrado";
            pkmnSelect.appendChild(opt);
            return;
        }

        filtered.forEach((p, idx) => {
            const opt = document.createElement('option');
            opt.value = p.id.toString();
            opt.innerText = `[#${p.id}] ${p.name}`;
            if (p.id.toString() === currentVal || (!currentVal && idx === 0)) {
                opt.selected = true;
            }
            pkmnSelect.appendChild(opt);
        });

        if (!filtered.some(p => p.id.toString() === currentVal) && filtered.length > 0) {
            pkmnSelect.selectedIndex = 0;
        }
    }

    static openAdminPanel() {
        const modal = document.getElementById('admin-modal');
        const pSelect = document.getElementById('admin-player-select') as HTMLSelectElement;
        const tSelect = document.getElementById('admin-turn-select') as HTMLSelectElement;
        const rInput = document.getElementById('admin-round-val') as HTMLInputElement;
        const qSelect = document.getElementById('admin-quest-select') as HTMLSelectElement;
        const cSelect = document.getElementById('admin-specific-card-select') as HTMLSelectElement;

        if (!modal || !pSelect || !tSelect || !rInput) return;

        pSelect.innerHTML = '';
        tSelect.innerHTML = '';
        if (qSelect) {
            qSelect.innerHTML = '';
            QUESTS_DB.forEach(q => {
                const opt = document.createElement('option');
                opt.value = q.id.toString();
                opt.innerText = `[${q.rarity}] ${q.name}`;
                qSelect.appendChild(opt);
            });
        }
        if (cSelect) {
            cSelect.innerHTML = '';
            CARDS_DB.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.innerText = `[${c.rarity}] ${c.name}`;
                if (c.id === 'ash_goodbye') opt.selected = true;
                cSelect.appendChild(opt);
            });
        }

        const pkmnSearch = document.getElementById('admin-pokemon-search') as HTMLInputElement;
        if (pkmnSearch) pkmnSearch.value = '';
        this.adminFilterPokemon('');
        const pkmnSelect = document.getElementById('admin-pokemon-select') as HTMLSelectElement;
        if (pkmnSelect && pkmnSelect.querySelector('option[value="130"]')) {
            pkmnSelect.value = "130";
        }

        const eSelect = document.getElementById('admin-event-select') as HTMLSelectElement;
        if (eSelect) {
            eSelect.innerHTML = '<option value="none">Nenhum (Limpar Clima)</option>';
            GLOBAL_EVENTS.forEach(e => {
                const opt = document.createElement('option');
                opt.value = e.id;
                opt.innerText = `${e.icon} ${e.name}`;
                eSelect.appendChild(opt);
            });
            eSelect.value = GameState.currentGlobalEvent ? GameState.currentGlobalEvent.id : "none";
        }

        GameState.players.forEach((p, idx) => {
            const opt = document.createElement('option');
            opt.value = idx.toString();
            opt.innerText = `[${idx}] ${p.name}`;
            pSelect.appendChild(opt);

            const optT = document.createElement('option');
            optT.value = idx.toString();
            optT.innerText = `[${idx}] ${p.name}`;
            tSelect.appendChild(optT);
        });

        rInput.value = GameState.round.toString();
        tSelect.value = GameState.turn.toString();

        pSelect.onchange = () => this.updateAdminPlayerInfo();
        this.updateAdminPlayerInfo();

        modal.style.display = 'flex';
    }

    static log(m: string, actionPlayerId?: number, battleId?: string, skipSync: boolean = false) {
        if (m.includes('||ROUND:')) {
            const r = parseInt(m.split('||ROUND:')[1]);
            if (r > GameState.round) {
                GameState.round = r;
                this.updateHUD();
                GameEvents.checkTurnControl();
            }
            return;
        }

        if (m.includes('||PRIVATE:')) {
            const parts = m.split('||PRIVATE:');
            const cleanMsg = parts[0];
            const targetId = parseInt(parts[1], 10);
            const NetworkObj = (window as any).Network || Network;
            if (NetworkObj && NetworkObj.isOnline && NetworkObj.myPlayerId !== targetId) return;
            m = cleanMsg;
        }

        if (m.includes('||EVENT:')) {
            const parts = m.split('||EVENT:');
            m = parts[0];
            const eventId = parts[1];
            GameState.currentGlobalEvent = GLOBAL_EVENTS.find(e => e.id === eventId);
            GameState.eventEndRound = GameState.round + 5;
            this.updateHUD();
        }

        const targetPlayer = actionPlayerId !== undefined ? GameState.players[actionPlayerId] : GameState.getCurrentPlayer();

        if (!m.includes("🌍 ALERTA GLOBAL!") && !m.includes("🛠️ ADMIN HOST:")) {
            if (targetPlayer && !m.startsWith(`[${targetPlayer.name}]`) && !m.includes(`] [${targetPlayer.name}]`)) {
                m = `[${targetPlayer.name}] ${m}`;
            }
            if (!/^\[\d+\]/.test(m)) {
                m = `[${GameState.round}] ${m}`;
            }
        }

        let logType = "system";
        const mLower = m.toLowerCase();

        const isXpLog = m.includes("💹") || (m.includes("🎉") && m.includes("subiu para o Nível"));
        if (isXpLog) {
            logType = "xp";
        } else if (m.includes("[Batalha]") || mLower.includes("batalha") || mLower.includes("dano") || mLower.includes("desmaiou") || mLower.includes("capturou") || mLower.includes("selvagem") || mLower.includes("fugiu")) {
            logType = "battle";
        } else if (mLower.includes("carta") || m.includes("🃏") || m.includes("||CARD:")) {
            logType = "cards";
        } else if (m.includes("💰") || mLower.includes("gold") || mLower.includes("moedas") || mLower.includes("pagou") || mLower.includes("comprou")) {
            logType = "gold";
        } else if (mLower.includes("usou") && !mLower.includes("atacou") || m.includes("🎒") || mLower.includes("curou") || mLower.includes("poção") || mLower.includes("reviveu")) {
            logType = "items";
        } else if (m.includes("🛑 Fim do turno")) {
            logType = "turn";
        } else if (m.includes("▶️") && m.includes("iniciou o turno")) {
            logType = "start_turn";
        }

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let icon = "📟";
        if (logType === "battle") icon = "⚔️";
        else if (logType === "cards") icon = "🃏";
        else if (logType === "gold") icon = "💰";
        else if (logType === "items") icon = "🎒";
        else if (logType === "turn") icon = "🛑";
        else if (logType === "start_turn") icon = "▶️";
        else if (logType === "xp") icon = m.includes("subiu para o Nível") ? "⬆️" : "💹";

        if (m.includes("rolou o dado")) icon = "🎲";
        if (mLower.includes("poção") || mLower.includes("curou")) icon = "🧪";
        if (mLower.includes("capturou")) icon = "⚽";
        if (mLower.includes("encontrou um item")) icon = "🎁";

        let customStyle = "";
        if (logType === "turn") {
            customStyle = "background: rgba(255, 152, 0, 0.1); border-left: 4px solid #ff9800; font-weight: bold;";
        } else if (logType === "start_turn") {
            customStyle = "background: rgba(46, 204, 113, 0.1); border-left: 4px solid #2ecc71; font-weight: bold; color: #2ecc71;";
        } else if (logType === "xp") {
            customStyle = "background: rgba(155, 109, 255, 0.1); border-left: 4px solid #9b6dff;";
        }

        m = m.replace(/\n/g, '<br>');

        const NetworkObj = (window as any).Network || Network;
        if (NetworkObj.isOnline && !skipSync) {
            if (typeof NetworkObj.syncLogs === 'function') {
                NetworkObj.syncLogs([{
                    text: m,
                    style: customStyle,
                    type: logType,
                    battleId: battleId
                }]);
            }
            return;
        }

        const container = document.getElementById('log-container');
        if (container) {
            const newLogEntry: any = {
                text: m,
                style: customStyle,
                type: logType,
                timestamp
            };
            if (battleId) newLogEntry.battleId = battleId;

            GameState.globalLogs.unshift(newLogEntry);
            if (GameState.globalLogs.length > 200) GameState.globalLogs.pop();

            const currentFilter = (this as any).currentLogFilter || 'all';
            const searchInput = document.getElementById('log-search-input') as HTMLInputElement;
            const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";
            const matchesSearch = searchText === "" || m.toLowerCase().includes(searchText);

            const displayStyle = (currentFilter === 'all' || currentFilter === logType) && matchesSearch ? "flex" : "none";

            let battleBtn = "";
            if (battleId) {
                battleBtn = `<button class="btn-view-log" onclick="window.Game.viewBattleLog('${battleId}')">Ver Log de Combate</button>`;
            }

            const logHtml = `
                <div class="log-entry" style="${customStyle}; display:${displayStyle}" data-type="${logType}">
                    <div class="log-header">
                        <span class="log-time">${timestamp}</span>
                    </div>
                    <div class="log-body">
                        <div class="log-icon-wrapper">${icon}</div>
                        <div class="log-text">
                            ${m}
                            ${battleBtn}
                        </div>
                    </div>
                </div>
            `;

            container.insertAdjacentHTML('afterbegin', logHtml);
            container.scrollTop = 0;
        }
    }

    static async viewBattleLog(battleId: string) {
        let logs: string[] | null = GameState.battleLogs[battleId] || null;
        const NetworkObj = (window as any).Network || Network;
        // Batalha de outro jogador (ou página recarregada): o log completo fica no banco
        if ((!logs || logs.length <= 1) && NetworkObj.isOnline && NetworkState.currentRoomId) {
            const remote = await SupabaseDataStore.loadBattleLines(NetworkState.currentRoomId, battleId);
            if (remote?.length) logs = GameState.battleLogs[battleId] = remote;
            else if (!logs) {
                const live = (window as any).Battle?.active;
                return GameDialog.toast(live ? "A batalha ainda está acontecendo. O log fica disponível quando ela terminar." : "Log de combate não disponível para esta batalha.", { tone: 'warning' });
            }
        }
        if (!logs) return GameDialog.toast("Log de combate não disponível para esta batalha.", { tone: 'warning' });

        let modal = document.getElementById('battle-history-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'battle-history-modal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-box" style="max-width: 500px; max-height: 80vh; display: flex; flex-direction: column; background: #111827; border: 1px solid #374151; height: auto;">
                <h3 style="margin-top: 0; color: #fff; border-bottom: 1px solid #374151; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <span>Histórico de Combate</span>
                    <button onclick="document.getElementById('battle-history-modal').style.display='none'" style="background:none; border:none; color:#9ca3af; font-size:1.5rem; cursor:pointer;">&times;</button>
                </h3>
                <div style="flex: 1; overflow-y: auto; padding: 10px; font-size: 0.9rem; color: #d1d5db; display: flex; flex-direction: column; gap: 8px;">
                    ${logs.map(line => `
                        <div style="padding: 8px; background: rgba(255,255,255,0.05); border-radius: 6px; border-left: 3px solid #3b82f6;">
                            ${line.replace(/\n/g, '<br>')}
                        </div>
                    `).join('')}
                </div>
                <button class="btn" style="margin-top: 15px; background: #374151;" onclick="document.getElementById('battle-history-modal').style.display='none'">Fechar</button>
            </div>
        `;
        modal.style.display = 'flex';
    }

    static sendGlobalLog(msg: string) {
        this.log(msg);
    }

    static isSelfCard(cardName: string): boolean {
        const selfCardNames = new Set([
            'Brilho Épico', 'Rare Candy', 'Evolução forçada', 'Mega Pedra',
            'Recuperar Mega Pedra', 'Vínculo Supremo', 'Cadeado', 'Dado Mágico',
            'Segunda Chance', 'Água Benta', 'Tênis de Corrida', 'Re-Roll',
            'Controle do Tempo', 'Lure Shiny', 'Double XP', 'Exp Share',
            'Chama o SAMU', 'Lure Type', 'Modulador de Eventos', 'Encontro Lendário',
            'Fumaça Ninja', 'Escudo Protetor', 'Poção Máxima', 'DNA de Mewtwo',
            'Destino Selado', 'Interferência', 'Silver Tape', 'Pokémon fiel',
            'Líder Velho', 'Do nada bolinha perdida'
        ]);
        return selfCardNames.has(cardName);
    }

    static recordCardLog(attackerName: string, cardName: string, targetName: string) {
        const cleanTarget = this.isSelfCard(cardName) ? 'Si mesmo' : targetName;
        const entry = {
            round: GameState.round,
            attacker: attackerName,
            card: cardName,
            target: cleanTarget,
            timestamp: Date.now()
        };

        const NetworkObj = (window as any).Network || Network;
        if (NetworkObj.isOnline) {
            // No modo online, enviamos como ação para o host processar ou syncar
            GameState.cardLogs.unshift(entry);
            if (GameState.cardLogs.length > 20) GameState.cardLogs.pop();
            if (NetworkObj.syncCardLogs) NetworkObj.syncCardLogs(GameState.cardLogs);
        } else {
            GameState.cardLogs.unshift(entry);
            if (GameState.cardLogs.length > 20) GameState.cardLogs.pop();
        }
        this.renderCardLogs();

        const tabCartas = document.getElementById('tab-cartas');
        if (tabCartas && !tabCartas.classList.contains('active')) {
            const badge = document.getElementById('cartas-badge');
            if (badge) {
                const currentVal = parseInt(badge.innerText) || 0;
                badge.innerText = (currentVal + 1).toString();
                badge.style.display = 'inline-block';
            }
        }
    }

    static renderCardLogs() {
        const container = document.getElementById('card-log-container');
        const countSpan = document.getElementById('card-log-count');
        if (!container) return;

        if (GameState.cardLogs.length === 0) {
            container.innerHTML = `<div class="empty-log" style="text-align: center; color: #9ca3af; margin-top: 20px;">Nenhum feitiço registrado...</div>`;
            if (countSpan) countSpan.innerText = '0 jogadas';
            return;
        }

        if (countSpan) countSpan.innerText = `${GameState.cardLogs.length} jogada${GameState.cardLogs.length > 1 ? 's' : ''}`;

        container.innerHTML = GameState.cardLogs.map(entry => {
            const cardData: any = CARDS_DB.find(c => c.name === entry.card) || { rarity: 'Comum' as any, desc: '' };
            const rarityColor = CARD_RARITIES[cardData.rarity]?.color || '#9aa8b4';

            const displayTarget = this.isSelfCard(entry.card) ? 'Si mesmo' : entry.target;

            const attackerP = GameState.players.find(p => p.name === entry.attacker);
            const targetP = GameState.players.find(p => p.name === displayTarget);
            
            const atkAvatar = attackerP ? attackerP.avatar : '/assets/img/Treinadores/Red.png';
            const tgtAvatar = targetP ? targetP.avatar : (displayTarget === 'Si mesmo' || displayTarget === entry.attacker ? atkAvatar : '/assets/img/Treinadores/Red.png');

            return `
            <div class="card-log-entry pb-cardlog" style="--rc:${rarityColor}">
                <div class="pb-cardlog-top">
                    <span class="pb-cardlog-round">R${entry.round}</span>
                    <span class="pb-cardlog-rarity">${String(cardData.rarity).toUpperCase()}</span>
                </div>
                <div class="pb-cardlog-card">
                    <i class="pb-ico pb-ico-cards" aria-hidden="true"></i>
                    <div>
                        <strong>${entry.card}</strong>
                        <small title="${cardData.desc}">${cardData.desc}</small>
                    </div>
                </div>
                <div class="pb-cardlog-who">
                    <span><img src="${atkAvatar}" alt="">${entry.attacker}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                    <span class="is-target"><img src="${tgtAvatar}" alt="">${displayTarget}</span>
                </div>
            </div>`;
        }).join('');
    }

    static showGlobalAlert(msg: string, playerName: string, isMyTurn: boolean, endsTurn: boolean = true) {
        GameState.alertEndsTurn = endsTurn;

        let displayMsg = msg;
        if (msg.includes('||CARD:')) {
            const parts = msg.split('||CARD:');
            displayMsg = parts[0];
            GameState.pendingCardAnimation = { id: parts[1], player: playerName };
        }
        else if (msg.includes('||LEGENDARY:')) {
            const parts = msg.split('||LEGENDARY:');
            displayMsg = parts[0];
            let monName = parts[1];
            let isMyEncounter = false;

            if (monName.includes('||MY_ENCOUNTER')) {
                monName = monName.split('||MY_ENCOUNTER')[0];
                isMyEncounter = true;
            }

            GameState.pendingLegendaryAlert = { monName: monName, player: playerName, isMyEncounter: isMyEncounter };
        } else {
            GameState.pendingCardAnimation = null;
            GameState.pendingLegendaryAlert = null;
        }

        // Novo aviso: libera um (e só um) confirm para ele
        GameUI.globalAlertConfirmed = false;
        GameUI.globalAlertIsMine = isMyTurn;
        GameUI.globalAlertOwner = playerName;

        // Partida offline na vez de um bot: ninguém vai tocar em "Continuar", então o bot confirma sozinho
        const alertSeq = ++GameUI.globalAlertSeq;
        const NetworkForCpu = (window as any).Network || Network;
        if (isMyTurn && !NetworkForCpu.isOnline && GameState.getCurrentPlayer()?.isCPU) {
            window.setTimeout(() => {
                if (alertSeq === GameUI.globalAlertSeq && !GameUI.globalAlertConfirmed) (window as any).Game.confirmGlobalAlert();
            }, 2200);
        }
        if (GameUI.globalAlertTyper) GameUI.globalAlertTyper.finish();

        let modal = document.getElementById('custom-global-alert');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'custom-global-alert';
            modal.className = 'pb-board-alert';
            document.body.appendChild(modal);
            GameUI.installGlobalAlertKeys();
        }

        // Caixa de fala do jogador: retrato, etiqueta de nome e texto em máquina de escrever
        const speaker = GameState.players.find((pl: any) => pl.name === playerName);
        const { box, text, footer } = GameDialog.buildSayBox({ name: playerName || 'Tabuleiro', portrait: speaker?.avatar });
        text.id = 'cga-msg';
        footer.id = 'cga-controls';
        modal.replaceChildren(box);

        if (isMyTurn) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn btn-roll';
            btn.textContent = 'Continuar';
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                btn.disabled = true;
                (window as any).Game.confirmGlobalAlert();
            });
            footer.appendChild(btn);
        } else {
            const wait = document.createElement('span');
            wait.className = 'pb-say-wait';
            wait.textContent = `Aguardando ${playerName} confirmar...`;
            const close = document.createElement('button');
            close.type = 'button';
            close.className = 'btn btn-ghost';
            close.textContent = 'Fechar aviso';
            close.addEventListener('click', (e) => { e.stopPropagation(); (window as any).Game.closeGlobalAlert(); });
            footer.append(wait, close);
        }

        // Tocar na caixa termina a digitação da linha
        box.addEventListener('click', () => GameUI.globalAlertTyper?.finish());

        modal.style.display = 'flex';
        const typer = GameDialog.typewriter(text, displayMsg);
        GameUI.globalAlertTyper = typer;
        typer.promise.then(() => { if (GameUI.globalAlertTyper === typer) box.classList.add('is-done'); });
        const primary = footer.querySelector('button');
        if (primary && isMyTurn) (primary as HTMLButtonElement).focus({ preventScroll: true });
    }

    /** Evita confirmar o mesmo aviso duas vezes (dois nextTurn seria um bug de turno). */
    static globalAlertConfirmed = false;
    static globalAlertSeq = 0;
    static globalAlertIsMine = false;
    static globalAlertOwner = '';
    static globalAlertTyper: { finish(): void; readonly done: boolean } | null = null;
    private static globalAlertKeysInstalled = false;

    private static installGlobalAlertKeys() {
        if (GameUI.globalAlertKeysInstalled) return;
        GameUI.globalAlertKeysInstalled = true;
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            const modal = document.getElementById('custom-global-alert');
            if (!modal || modal.style.display === 'none') return;
            if (GameDialog.isOpen()) return;
            const t = e.target as HTMLElement | null;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
            e.preventDefault();
            if (GameUI.globalAlertTyper && !GameUI.globalAlertTyper.done) { GameUI.globalAlertTyper.finish(); return; }
            if (GameUI.globalAlertIsMine && !e.repeat) (window as any).Game.confirmGlobalAlert();
        });
    }

    static confirmGlobalAlert() {
        if (GameUI.globalAlertConfirmed) return;
        GameUI.globalAlertConfirmed = true;
        const NetworkObj = (window as any).Network || Network;
        this.closeGlobalAlert();

        if (NetworkObj.isOnline) {
            NetworkObj.sendAction('CLOSE_ALERT', {});
        }

        if (GameState.pendingTileEvent) {
            GameState.pendingTileEvent = false;
            GameEvents.handleTile(GameState.getCurrentPlayer());
            return;
        }

        if (GameState.alertEndsTurn) {
            GameEvents.nextTurn();
        }
    }

    static closeGlobalAlert() {
        const modal = document.getElementById('custom-global-alert');
        if (modal) modal.style.display = 'none';

        if (GameState.pendingCardAnimation) {
            this.playCardCinematic(GameState.pendingCardAnimation.id, GameState.pendingCardAnimation.player);
            GameState.pendingCardAnimation = null;
        } else if (GameState.pendingLegendaryAlert) {
            this.startLegendaryEncounter(GameState.pendingLegendaryAlert.player, GameState.pendingLegendaryAlert.isMyEncounter);
            GameState.pendingLegendaryAlert = null;
        }
    }

    static toggleRightPanel(btn: HTMLButtonElement) {
        const panel = document.getElementById('right-panel');
        if (panel) {
            panel.classList.toggle('collapsed');
            if (panel.classList.contains('collapsed')) {
                panel.style.width = '0px';
                btn.innerText = '◀';
            } else {
                panel.style.width = '320px';
                btn.innerText = '▶';
            }
        }
    }

    static switchLogTab(tab: string) {
        const tabPartida = document.getElementById('tab-partida');
        const tabCartas = document.getElementById('tab-cartas');
        const contentPartida = document.getElementById('log-content-partida');
        const contentCartas = document.getElementById('log-content-cartas');
        const badge = document.getElementById('cartas-badge');

        if (tab === 'partida') {
            tabPartida?.classList.add('active');
            tabCartas?.classList.remove('active');
            tabPartida!.style.color = '#fff';
            tabPartida!.style.borderBottomColor = '#f1c40f';
            tabCartas!.style.color = '#9ca3af';
            tabCartas!.style.borderBottomColor = 'transparent';
            if (contentPartida) contentPartida.style.display = 'flex';
            if (contentCartas) contentCartas.style.display = 'none';
        } else {
            tabCartas?.classList.add('active');
            tabPartida?.classList.remove('active');
            tabCartas!.style.color = '#fff';
            tabCartas!.style.borderBottomColor = '#f1c40f';
            tabPartida!.style.color = '#9ca3af';
            tabPartida!.style.borderBottomColor = 'transparent';
            if (contentCartas) contentCartas.style.display = 'flex';
            if (contentPartida) contentPartida.style.display = 'none';
            if (badge) {
                badge.style.display = 'none';
                badge.innerText = '0';
            }
        }
    }

    // Encontro lendário: a batalha abre com a entrada de Pokémon selvagem no estilo lendário (Cinematics.wildIntro)
    static startLegendaryEncounter(playerName: string, isMyEncounter: boolean) {
        if (!isMyEncounter || !GameState.pendingLegendaryEncounter) return;
        const player = GameState.players.find(p => p.name === playerName);
        const BattleObj = (window as any).Battle;
        if (player && BattleObj) BattleObj.setup(player, GameState.pendingLegendaryEncounter.mon, false, "Selvagem", 0, null, false, 0, "", GameState.pendingLegendaryEncounter.type);
        GameState.pendingLegendaryEncounter = null;
    }

    static playCardCinematic(cardId: string, playerName: string) {
        // Usa a animação padrão de carta usada (UseFx); o modal antigo fica só como reserva
        const owner = GameState.players.find(p => p.name === playerName);
        const UseFxObj = (window as any).UseFx;
        if (owner && UseFxObj?.showCard) { UseFxObj.showCard(cardId, owner); return; }
        let modal = document.getElementById('card-cinematic');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'card-cinematic';
            modal.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); display:flex; justify-content:center; align-items:center; flex-direction:column; z-index:99999; opacity:0; transition: opacity 0.3s ease; cursor: pointer;";
            modal.innerHTML = `
                <h2 id="card-cine-title" style="color:#f1c40f; font-size: 2.5rem; text-shadow: 2px 2px 4px #000; margin-bottom: 20px; font-weight: bold; text-align: center;"></h2>
                <img id="card-cine-img" src="" style="height: 65vh; max-height: 800px; border-radius: 12px; box-shadow: 0 0 40px rgba(241, 196, 15, 0.6); transform: scale(0.5); transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                <div style="color: #bdc3c7; margin-top: 20px; font-size: 1rem; opacity: 0.7;">(Clique em qualquer lugar para fechar)</div>
            `;
            document.body.appendChild(modal);

            modal.onclick = () => {
                modal!.style.opacity = '0';
                document.getElementById('card-cine-img')!.style.transform = 'scale(0.5)';
                setTimeout(() => { modal!.style.display = 'none'; }, 300);
            };
        }

        document.getElementById('card-cine-title')!.innerHTML = `🃏 <span style="color:#fff">${playerName}</span> usou:`;
        document.getElementById('card-cine-img')!.setAttribute('src', `/assets/img/Cartas/${cardId}.jpg`);

        modal.style.display = 'flex';

        setTimeout(() => {
            modal!.style.opacity = '1';
            document.getElementById('card-cine-img')!.style.transform = 'scale(1)';
        }, 50);

        setTimeout(() => {
            if (modal!.style.display !== 'none') {
                modal!.style.opacity = '0';
                document.getElementById('card-cine-img')!.style.transform = 'scale(0.5)';
                setTimeout(() => { modal!.style.display = 'none'; }, 300);
            }
        }, 3000);
    }

    static showEventDetails() {
        if (!GameState.currentGlobalEvent) return;
        let modal = document.getElementById('event-details-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'event-details-modal';
            modal.className = 'modal-overlay';
            modal.style.zIndex = '9999';
            document.body.appendChild(modal);
        }
        const ev = GameState.currentGlobalEvent;
        const roundsLeft = Math.max(0, GameState.eventEndRound - GameState.round);
        const close = "document.getElementById('event-details-modal').style.display='none'";
        modal.innerHTML = `
            <div class="modal-box pb-screen pb-screen--dialog pb-event-detail">
                ${ScreenKit.head({ icon: 'event', iconHTML: `<span class="pb-event-pick-ico">${ev.icon}</span>`, kicker: 'Evento global', title: ev.name, actions: ScreenKit.closeX(close) })}
                <p class="pb-event-detail-desc">${ev.desc}</p>
                <div class="pb-event-detail-left"><small>Termina em</small><b>${roundsLeft}</b><span>rodada(s)</span></div>
                <button class="btn btn-secondary stats-close-btn" onclick="${close}">Fechar</button>
            </div>
        `;
        modal.style.display = 'flex';
    }

    // ==========================================
    // MODAIS E PAINÉIS ADICIONAIS
    // ==========================================

    static async openPokemonDetail(playerIndex: number, slotIndex: number, championData?: any) {
        let targetPlayer: any;
        let mon: any;

        if (championData) {
            targetPlayer = championData;
            const rawMon = championData.team[slotIndex];
            const PkmClass = (window as any).Pokemon || Pokemon;
            mon = new PkmClass(rawMon.id, rawMon.level, rawMon.isShiny);
            Object.assign(mon, rawMon);
        } else {
            targetPlayer = GameState.players[playerIndex];
            if (!targetPlayer) return console.error("Jogador não encontrado para o índice:", playerIndex);
            mon = targetPlayer.team[slotIndex];
        }

        if (!mon) return console.error("Pokémon não encontrado no slot:", slotIndex);

        const POKEDEX_GLOBAL = (window as any).POKEDEX || POKEDEX;
        // MAPA_MEGAS is already imported at the top

        const detailModal = document.getElementById('detail-modal')!;

        // Feedback sensorial de abertura
        GameFeel.vibrate([15]);

        document.getElementById('detail-id')!.innerText = `#${mon.id.toString().padStart(3, '0')}`;
        document.getElementById('detail-name')!.innerText = mon.name;
        document.getElementById('detail-img')!.setAttribute('src', mon.getSprite());
        document.getElementById('detail-level')!.innerText = mon.level.toString();

        document.getElementById('detail-hp')!.innerText = `${Math.floor(mon.currentHp)} / ${mon.maxHp}`;
        const hpPct = Math.min(100, Math.max(0, (mon.currentHp / mon.maxHp) * 100));
        const hpBar = document.getElementById('detail-hp-bar')!;
        hpBar.style.width = `${hpPct}%`;
        hpBar.classList.remove('is-yellow', 'is-red');
        if (hpPct <= 20) {
            hpBar.classList.add('is-red');
        } else if (hpPct <= 50) {
            hpBar.classList.add('is-yellow');
        }

        document.getElementById('detail-xp')!.innerText = `${Math.floor(mon.currentXp)} / ${mon.maxXp}`;
        document.getElementById('detail-xp-bar')!.style.width = `${Math.min(100, (mon.currentXp / mon.maxXp) * 100)}%`;

        const hap = mon.happiness || 0;
        document.getElementById('detail-happiness')!.innerText = `${hap}%`;
        document.getElementById('detail-happiness-bar')!.style.width = `${hap}%`;

        document.getElementById('detail-shiny')!.style.display = mon.isShiny ? 'flex' : 'none';

        const colors: any = { "Normal": "#A8A77A", "Fogo": "#EE8130", "Água": "#6390F0", "Elétrico": "#F7D02C", "Grama": "#7AC74C", "Gelo": "#96D9D6", "Lutador": "#C22E28", "Veneno": "#A33EA1", "Terra": "#E2BF65", "Voador": "#A98FF3", "Psíquico": "#F95587", "Inseto": "#A6B91A", "Pedra": "#B6A136", "Fantasma": "#735797", "Dragão": "#6F35FC", "Noturno": "#705746", "Aço": "#B7B7CE", "Fada": "#D685AD" };
        const baseColor = colors[mon.type] || '#2f6fa8';

        const cardEl = detailModal.querySelector('.pkmn-detail-card') as HTMLElement;
        if (cardEl) {
            cardEl.style.setProperty('--mon-color', baseColor);
            cardEl.style.setProperty('--mon-glow', `${baseColor}66`);
            cardEl.style.setProperty('--mon-glow-soft', `${baseColor}33`);
            cardEl.style.setProperty('--mon-color-border', `${baseColor}77`);
        }

        const detailHeader = document.getElementById('detail-header');
        if (detailHeader) {
            detailHeader.style.background = `linear-gradient(135deg, ${baseColor} 0%, rgba(18, 26, 34, 0.96) 80%)`;
        }

        const typeContainer = document.getElementById('detail-types')!;
        typeContainer.innerHTML = '';
        [mon.type, mon.secondType].filter(t => t).forEach(t => {
            const span = document.createElement('span');
            span.innerText = t;
            span.className = 'poke-type-badge pkmn-type-tag';
            span.setAttribute('data-type', t);
            const bgColor = colors[t] || '#555';
            span.style.background = bgColor;
            typeContainer.appendChild(span);
        });

        // Configurar botão da Pokédex
        const dexBtn = document.getElementById('detail-dex-btn');
        if (dexBtn) {
            if (!championData && playerIndex >= 0) {
                dexBtn.style.display = 'inline-flex';
                dexBtn.onclick = () => {
                    (window as any).Game.openPokedex(playerIndex, mon.id);
                    document.getElementById('detail-modal')!.style.display = 'none';
                };
            } else {
                dexBtn.style.display = 'none';
            }
        }

        // Status de Combate
        const ivs = (mon as any).ivs || { hp: 0, atk: 0, def: 0, spd: 0 };
        const bonus = (mon as any).bonusStats || { hp: 0, atk: 0, def: 0, spd: 0 };
        const createStatRow = (label: string, total: number, iv: number, bon: number, icon: string, maxBenchmark: number = 200) => {
            const barPct = Math.min(100, Math.max(12, Math.round((total / maxBenchmark) * 100)));
            const isSTier = iv >= 28;
            return `
                <div class="pkmn-stat-box">
                    <div class="pkmn-stat-top">
                        <span class="pkmn-stat-label">${icon} ${label}</span>
                        <span class="pkmn-stat-value">${total}</span>
                    </div>
                    <div class="pkmn-stat-bar-track">
                        <div class="pkmn-stat-bar-fill" style="width: ${barPct}%;"></div>
                    </div>
                    <div class="pkmn-stat-bottom">
                        <span class="pkmn-iv-chip ${isSTier ? 'is-s-tier' : ''}" title="Potencial Genético IV (0-31)">🧬 IV: <b>${iv}</b></span>
                        <span class="pkmn-up-chip" title="Bônus de Treino">⬆️ Treino: +${bon}</span>
                    </div>
                </div>`;
        };

        const grid = document.getElementById('detail-stats-grid')!;
        grid.innerHTML = `
            ${createStatRow("HP", mon.maxHp, ivs.hp, bonus.hp, "❤️", 250)}
            ${createStatRow("Ataque", mon.atk, ivs.atk, bonus.atk, "⚔️", 180)}
            ${createStatRow("Defesa", mon.def, ivs.def, bonus.def, "🛡️", 180)}
            ${createStatRow("Velocidade", mon.speed, ivs.spd, bonus.spd, "💨", 180)}
        `;

        // Item Equipado
        let itemSection = document.getElementById('detail-item-section');
        if (itemSection) {
            let itemHTML = `
                <div class="pkmn-section-header">
                    <span class="pkmn-section-title"><i>📦</i> Item Equipado</span>
                    <span class="pkmn-section-kicker">${mon.heldItem || mon.megaStone ? 'Equipamento Ativo' : 'Vazio'}</span>
                </div>
            `;
            if (mon.heldItem || mon.megaStone) {
                const heldId = mon.heldItem || 'megastone';
                const heldData = SHOP_ITEMS.find(i => i.id === heldId);
                const isMe = !championData && (GameState.canAct() && GameState.turn === playerIndex);
                const canRemove = isMe && mon.heldItem;

                itemHTML += `
                    <div class="pkmn-gear-equipped">
                        <div class="pkmn-gear-info">
                            <img class="pkmn-gear-icon" src="/assets/img/Itens/${heldData?.icon || 'MegaStone.png'}" alt="">
                            <div class="pkmn-gear-details">
                                <span class="pkmn-gear-name">${heldData?.name || 'Mega Pedra'}</span>
                                <span class="pkmn-gear-tag">${heldData?.desc || 'Desperta a Mega Evolução durante o combate.'}</span>
                            </div>
                        </div>
                        ${canRemove ? `<button class="btn btn-mini pkmn-gear-remove-btn" onclick="window.Game.removeHeldItem(${playerIndex}, ${slotIndex})">Remover</button>` : ''}
                    </div>
                `;
            } else {
                itemHTML += `
                    <div class="pkmn-gear-empty">
                        <span>🎒 Nenhum item equipado. Equipe pela Mochila no seu turno.</span>
                    </div>
                `;
            }
            itemSection.innerHTML = itemHTML;
        }

        // Genética & Maestria de Pokédex
        let resoText = "0%";
        let masteryHTML = "";

        if (targetPlayer.pokedexData) {
            const dexEntry = targetPlayer.pokedexData[mon.id];
            const caught = dexEntry ? (dexEntry.caught || 0) : 0;

            if (caught > 1) {
                const perc = Math.min(100, (caught - 1) * 10);
                resoText = `+${perc}% em Todos (+${caught - 1} cópias)`;
            } else {
                resoText = `+0% (1ª Captura)`;
            }

            const countKillsForType = (tType: string) => {
                let totalKills = 0;
                POKEDEX_GLOBAL.forEach((pData: any) => {
                    if (pData.type === tType || pData.secondType === tType) {
                        const pEntry = targetPlayer.pokedexData[pData.id];
                        if (pEntry && pEntry.defeated) {
                            totalKills += pEntry.defeated;
                        }
                    }
                });
                return totalKills;
            };

            const generateLine = (t: string) => {
                const kills = countKillsForType(t);
                const currentBonus = kills;
                const nextCheckpoint = kills + 1;
                const badgeColor = colors[t] || '#666';
                return `
                    <div style="margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px dashed rgba(255,255,255,0.08);">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 3px;">
                            <span class="poke-type-badge pkmn-type-tag" data-type="${t}" style="background:${badgeColor}; font-size:0.7rem;">Tipo ${t}</span>
                            <b style="color: ${currentBonus > 0 ? '#2ecc71' : '#e74c3c'}; font-size: 0.85rem;">+${currentBonus}% Dano</b>
                        </div>
                        <div style="font-size:0.7rem; color:var(--pb-text-3); display:flex; justify-content:space-between;">
                            <span>Inimigos derrotados: <b style="color:#edf2f4;">${kills}</b></span>
                            <span>Próximo nível: ${nextCheckpoint}</span>
                        </div>
                    </div>
                `;
            };

            masteryHTML += generateLine(mon.type);
            if (mon.secondType) {
                masteryHTML += generateLine(mon.secondType);
            }
        } else {
            masteryHTML = "<div style='color:var(--pb-text-3); font-style:italic; font-size:0.75rem;'>Nenhum dado na Pokédex ainda.</div>";
        }

        document.getElementById('detail-reso')!.innerText = resoText;
        document.getElementById('detail-mastery')!.innerHTML = masteryHTML;
        document.getElementById('detail-mastery')!.style.fontWeight = "normal";

        // Linha Evolutiva
        const chain: { id: number, name: string, trigger: string, isMega: boolean }[] = [];
        let currentDex = POKEDEX_GLOBAL.find((p: any) => p.id === mon.id);

        if (currentDex) {
            chain.push({ id: currentDex.id, name: currentDex.name, trigger: 'Forma Atual', isMega: !!(mon as any).isMegaEvolution });

            let nextName = currentDex.nextForm;
            let triggerLevel = currentDex.evoTrigger;

            while (nextName) {
                let nextDex = POKEDEX_GLOBAL.find((p: any) => p.name === nextName);
                if (!nextDex) break;

                chain.push({ id: nextDex.id, name: nextDex.name, trigger: `Lv.${triggerLevel}`, isMega: false });

                triggerLevel = nextDex.evoTrigger;
                nextName = nextDex.nextForm;
            }

            const finalEvo = chain[chain.length - 1];
            const megaId = MAPA_MEGAS[finalEvo.id];

            if (megaId && !finalEvo.isMega) {
                const megaDex = POKEDEX_GLOBAL.find((p: any) => p.id === megaId);
                if (megaDex) {
                    chain.push({ id: megaDex.id, name: "Mega " + finalEvo.name, trigger: '💎 Mega Pedra', isMega: true });
                }
            }
        }

        const evoContainer = document.getElementById('detail-evolution-chain');
        if (evoContainer) {
            if (chain.length > 1) {
                let chainHTML = `<div class="pkmn-evo-flow">`;
                chain.forEach((stage, idx) => {
                    const isCurrent = stage.id === mon.id;
                    chainHTML += `
                        <div class="pkmn-evo-node ${isCurrent ? 'is-current' : ''} ${stage.isMega ? 'is-mega' : ''}">
                            <img class="pkmn-evo-img" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${stage.id}.png" alt="${stage.name}">
                            <span class="pkmn-evo-name">${stage.name}</span>
                            <span class="pkmn-evo-trigger">${stage.trigger}</span>
                        </div>
                    `;

                    if (idx < chain.length - 1) {
                        chainHTML += `<div class="pkmn-evo-arrow">➔</div>`;
                    }
                });
                chainHTML += `</div>`;
                evoContainer.innerHTML = chainHTML;
                evoContainer.style.display = 'block';
            } else {
                evoContainer.innerHTML = `
                    <div class="pkmn-gear-empty" style="font-style: normal; color: #2ecc71; border-color: rgba(46, 204, 113, 0.3); background: rgba(46, 204, 113, 0.08);">
                        <span>✨ Estágio Final Alcançado — Potencial máximo de evolução!</span>
                    </div>
                `;
                evoContainer.style.display = 'block';
            }
        }

        // Resetar para aba inicial de Combate
        if ((window as any).switchPkmnDetailTab) {
            (window as any).switchPkmnDetailTab('combat');
        }

        detailModal.dataset.playerIndex = String(playerIndex);
        detailModal.dataset.slotIndex = String(slotIndex);
        detailModal.dataset.isChampion = championData ? 'true' : 'false';
        detailModal.style.display = 'flex';
    }

    static refreshOpenPokemonDetail() {
        const detailModal = document.getElementById('detail-modal');
        if (!detailModal || detailModal.style.display === 'none' || detailModal.dataset.isChampion === 'true') return;

        const playerIndex = Number(detailModal.dataset.playerIndex);
        const slotIndex = Number(detailModal.dataset.slotIndex);
        if (!Number.isInteger(playerIndex) || !Number.isInteger(slotIndex)) return;
        if (!GameState.players[playerIndex] || !GameState.players[playerIndex].team[slotIndex]) return;

        this.openPokemonDetail(playerIndex, slotIndex);
    }

    static openCardLibrary() {
        const list = document.getElementById('library-list')!;
        list.innerHTML = '';

        // Removido override dinâmico para respeitar estilos premium do HTML

        list.style.display = 'grid';
        list.style.gridTemplateColumns = 'repeat(auto-fill, minmax(180px, 1fr))';
        list.style.gap = '25px';
        list.style.padding = '20px';
        list.style.width = '100%';

        const rarityFilter = (document.getElementById('library-rarity-filter') as HTMLSelectElement)?.value || 'all';
        const typeFilter = (document.getElementById('library-type-filter') as HTMLSelectElement)?.value || 'all';

        let filtered = CARDS_DB.filter(c => {
            if (rarityFilter !== 'all' && c.rarity !== rarityFilter) return false;
            if (typeFilter !== 'all' && c.type !== typeFilter) return false;
            return true;
        });

        const typeOrder: Record<string, number> = { 'move': 1, 'battle': 2, 'auto': 3, 'global': 4 };
        const rarityOrder: Record<string, number> = { 'Lendária': 0, 'Épica': 1, 'Rara': 2, 'Incomum': 3, 'Comum': 4 };

        filtered.sort((a, b) => {
            if (typeOrder[a.type] !== typeOrder[b.type]) return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
            if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) return (rarityOrder[a.rarity] || 99) - (rarityOrder[b.rarity] || 99);
            return a.name.localeCompare(b.name);
        });

        filtered.forEach(c => {
            const rData = CARD_RARITIES[c.rarity];
            const borderColor = rData ? rData.color : '#8d99ae';

            const d = document.createElement('div');
            d.style.cssText = "display: flex; flex-direction: column; align-items: center; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); width: 100%; box-sizing: border-box; position: relative; cursor: zoom-in; transition: transform 0.2s;";

            d.onmouseover = () => { d.style.transform = "scale(1.05)"; d.style.zIndex = "5"; };
            d.onmouseout = () => { d.style.transform = "scale(1)"; d.style.zIndex = "1"; };

            d.innerHTML = `
                <div style="position: absolute; top: -5px; right: -5px; background: ${borderColor}; color: #fff; padding: 2px 6px; font-size: 0.7rem; border-radius: 10px; font-weight: bold; border: 1px solid #222; text-shadow: 1px 1px 0 #000; box-shadow: 0 2px 4px rgba(0,0,0,0.5); z-index: 10;">
                    ${c.rarity.toUpperCase()}
                </div>
                <img src="/assets/img/Cartas/${c.id}.jpg" alt="${c.name}" title="${c.desc}" style="width: 100%; aspect-ratio: 2.5/3.5; object-fit: fill; border-radius: 6px; border: 3px solid ${borderColor};">
                <div style="margin-top: 8px; font-size: 0.8rem; text-align: center; color: #edf2f4;"><b>${c.name}</b></div>
                <div style="font-size: 0.7rem; color: #bdc3c7;">[${c.type.toUpperCase()}]</div>
            `;
            d.onclick = () => GameUI.showCardZoom(c.id);
            list.appendChild(d);
        });
        document.getElementById('library-modal')!.style.display = 'flex';
    }

    static showCardZoom(cardId: string) {
        let modal = document.getElementById('card-zoom-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'card-zoom-modal';
            modal.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.9); display:flex; justify-content:center; align-items:center; z-index:20000; cursor: zoom-out;";
            modal.onclick = () => modal!.style.display = 'none';
            document.body.appendChild(modal);
        }
        modal.innerHTML = `
            <div style="position: relative; max-width: 90vw; max-height: 90vh; animation: zoomIn 0.3s ease-out;">
                <img src="/assets/img/Cartas/${cardId}.jpg" style="max-width: 100%; max-height: 90vh; border-radius: 15px; border: 5px solid #fff; box-shadow: 0 0 50px rgba(0,0,0,1);">
                <div style="position: absolute; top: -15px; right: -15px; background: #e74c3c; color: #fff; width: 35px; height: 35px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 18px; border: 2px solid #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.5);">✕</div>
            </div>
        `;
        modal.style.display = 'flex';
    }

    static openItemLibrary() {
        const list = document.getElementById('item-library-list')!;
        list.innerHTML = '';

        // Removido override dinâmico para respeitar estilos premium do HTML

        list.style.display = 'grid';
        list.style.gridTemplateColumns = 'repeat(auto-fill, minmax(150px, 1fr))';
        list.style.gap = '10px';
        list.style.padding = '4px';
        list.style.width = '100%';

        const typeFilter = (document.getElementById('item-library-type-filter') as HTMLSelectElement)?.value || 'all';

        let filtered = SHOP_ITEMS.filter(i => {
            if (typeFilter !== 'all' && i.type !== typeFilter) return false;
            return true;
        });

        const typeOrder: Record<string, number> = { 'heal': 1, 'revive': 2, 'capture': 3, 'mega': 4, 'boost': 5, 'hold': 6 };

        filtered.sort((a, b) => {
            if (typeOrder[a.type] !== typeOrder[b.type]) return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
            return a.name.localeCompare(b.name);
        });

        filtered.forEach(item => {
            const d = document.createElement('div');
            d.className = `pb-itemlib-card pb-itemlib-card--${item.type}`;

            const typeLabel = item.type === 'heal' ? 'Cura' :
                item.type === 'revive' ? 'Reviver' :
                    item.type === 'capture' ? 'Captura' :
                        item.type === 'mega' ? 'Mega Stone' :
                            item.type === 'boost' ? 'Boost' :
                                item.type === 'hold' ? 'Segurar' : (item.type as string).toUpperCase();

            d.innerHTML = `
                <span class="pb-itemlib-tag">${typeLabel.toUpperCase()}</span>
                <div class="pb-itemlib-slot"><img src="/assets/img/Itens/${item.icon}" alt="${item.name}" loading="lazy"></div>
                <strong class="pb-itemlib-name">${item.name}</strong>
                <p class="pb-itemlib-desc">${item.desc}</p>
                <div class="pb-itemlib-price"><i aria-hidden="true"></i>${item.price} G</div>
            `;
            list.appendChild(d);
        });
        document.getElementById('item-library-modal')!.style.display = 'flex';
    }

    static openXpRules() {
        document.getElementById('xp-rules-modal')!.style.display = 'flex';
    }

    static openCaptureRules() {
        const modal = document.getElementById('capture-rules-modal');
        if (modal) modal.style.display = 'flex';
    }

    static openCombatRules() {
        const modal = document.getElementById('combat-rules-modal');
        if (modal) modal.style.display = 'flex';
    }

    static lastBoardCardsPlayerId: number = 0;

    static toggleSimplifiedDeckView(checked: boolean) {
        localStorage.setItem('pb_simplified_deck_view', checked ? 'true' : 'false');
        const bCheck = document.getElementById('board-cards-simplified-view') as HTMLInputElement | null;
        if (bCheck) bCheck.checked = checked;
        const batCheck = document.getElementById('battle-cards-simplified-view') as HTMLInputElement | null;
        if (batCheck) batCheck.checked = checked;
        GameUI.openBoardCards();
    }

    static openBoardCards(pId?: number) {
        if (pId !== undefined && pId !== null) {
            GameUI.lastBoardCardsPlayerId = pId;
        } else {
            pId = GameUI.lastBoardCardsPlayerId ?? GameState.turn;
        }

        const NetworkObj = (window as any).Network || Network;

        const modalContent = document.querySelector('#board-cards-modal .modal-content') as HTMLElement;
        if (modalContent) {
            modalContent.style.width = "95%";
            modalContent.style.maxWidth = "1200px";
            modalContent.style.maxHeight = "90vh";
            modalContent.style.padding = "30px";
            modalContent.style.overflowY = "auto";
        }

        if (NetworkObj.isOnline && NetworkObj.isSpectator) return GameDialog.toast("Modo espectador: as cartas dos jogadores ficam ocultas.", { tone: 'info' });
        if (NetworkObj.isOnline && pId !== NetworkObj.myPlayerId) return GameDialog.toast("As cartas dos outros jogadores são privadas.", { tone: 'warning' });

        const p = GameState.players[pId];
        const list = document.getElementById('board-cards-list')!;
        list.innerHTML = '';

        const isMobile = window.innerWidth <= 1000;

        list.style.cssText = 'display: flex; flex-direction: column; gap: 12px; width: 100%; padding: 4px 0; overflow: visible;';

        const isMe = !NetworkObj.isOnline || (p.id === NetworkObj.myPlayerId);

        if (isMe && p.cards.length >= 2) {
            const btnRow = document.createElement('div');
            btnRow.style.cssText = isMobile ? "display: flex; gap: 10px; margin-bottom: 10px; width:100%;" : "grid-column: 1 / -1; display: flex; gap: 10px; margin-bottom: 10px;";

            const sacBtn = document.createElement('button');
            sacBtn.className = 'btn btn-sacrifice';
            sacBtn.style.flex = '1';
            sacBtn.innerHTML = isMobile ? `<span>Sacrificar</span>` : `<span>Sacrificar (2 → 1 aleatória)</span>`;
            sacBtn.onclick = () => {
                document.getElementById('board-cards-modal')!.style.display = 'none';
                (window as any).Cards.openSacrificeModal();
            };
            btnRow.appendChild(sacBtn);

            if (p.cards.length >= 3) {
                const mergeBtn = document.createElement('button');
                mergeBtn.className = 'btn btn-merge';
                mergeBtn.style.flex = '1';
                mergeBtn.innerHTML = isMobile ? `<span>Fundir</span>` : `<span>Fundir (raridade +1)</span>`;
                mergeBtn.onclick = () => {
                    document.getElementById('board-cards-modal')!.style.display = 'none';
                    (window as any).Cards.openMergeModal();
                };
                mergeBtn.appendChild(document.createTextNode(''));
                btnRow.appendChild(mergeBtn);
            }

            list.appendChild(btnRow);
        }

        if (p.cards.length === 0) {
            if (list.innerHTML === '') list.innerHTML = `<em style="${isMobile ? '' : 'grid-column: 1/-1;'}">Sem cartas.</em>`;
        }

        const isMyTurn = GameState.canAct() && GameState.turn === pId;
        const canUseMove = isMyTurn && !GameState.hasRolled;

        const rarityFilter = (document.getElementById('board-cards-rarity-filter') as HTMLSelectElement)?.value || 'all';
        const typeFilter = (document.getElementById('board-cards-type-filter') as HTMLSelectElement)?.value || 'all';

        let filteredCards = [...p.cards];
        if (rarityFilter !== 'all') {
            filteredCards = filteredCards.filter(c => c.rarity === rarityFilter);
        }
        if (typeFilter !== 'all') {
            filteredCards = filteredCards.filter(c => c.type === typeFilter);
        }

        const typeOrder: Record<string, number> = { 'move': 1, 'battle': 2, 'auto': 3, 'global': 4 };
        const rarityOrder: Record<string, number> = { 'Lendária': 0, 'Épica': 1, 'Rara': 2, 'Incomum': 3, 'Comum': 4 };

        filteredCards.sort((a, b) => {
            if (typeOrder[a.type] !== typeOrder[b.type]) return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
            if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) return (rarityOrder[a.rarity] || 99) - (rarityOrder[b.rarity] || 99);
            return a.name.localeCompare(b.name);
        });

        const isSimplified = localStorage.getItem('pb_simplified_deck_view') === 'true';
        const simplifiedToggle = document.getElementById('board-cards-simplified-view') as HTMLInputElement | null;
        if (simplifiedToggle) simplifiedToggle.checked = isSimplified;

        if (filteredCards.length) {
            CardHand.render(list, p, filteredCards, {
                isMe,
                canUseMove,
                simplified: isSimplified,
                onZoom: (id) => GameUI.showCardZoom(id),
                onUnprotect: (_card, origIdx) => {
                    const Cards = (window as any).Cards || (window as any).CardEffects;
                    if (Cards && Cards.unprotectCard) {
                        Cards.unprotectCard(p.id, origIdx, false);
                        GameUI.openBoardCards(p.id);
                    }
                }
            });
        }

        document.getElementById('board-cards-modal')!.style.display = 'flex';
    }

    static openInventoryModal(pId: number, readOnly: boolean = false) {
        const p = GameState.players[pId];
        const list = document.getElementById('board-inventory-list')!;
        const canUse = (!readOnly && GameState.canAct() && GameState.turn === pId);
        const boardTypes = ['heal', 'revive', 'boost', 'mega', 'hold'];

        // Só o dono vê o que é novo; abrir a própria mochila marca tudo como visto
        const NetworkObj = (window as any).Network || Network;
        const isMe = !NetworkObj.isOnline || p.id === NetworkObj.myPlayerId;
        const fresh = isMe ? newItemsOf(p) : {};
        if (isMe && markItemsSeen(p)) seenChanged();

        Backpack.render(list, {
            ownerName: p.name,
            items: p.items,
            fresh,
            usable: (item) => {
                if (!boardTypes.includes(item.type)) return { ok: false, reason: 'Pokébolas só servem em batalhas contra Pokémon selvagens.' };
                if (readOnly) return { ok: false, reason: 'Feche a loja e abra a mochila pelo seu card para usar.' };
                if (!canUse) return { ok: false, reason: 'Só dá para usar itens na sua vez.' };
                return { ok: true };
            },
            actionLabel: (item) => item.type === 'hold' ? 'Equipar' : 'Usar',
            onUse: (key) => (window as any).Game.useItemBoard(key, pId)
        });
        document.getElementById('board-inventory-modal')!.style.display = 'flex';
    }

    static openPlayerBadgesModal(pId: number) {
        const p = GameState.players[pId];
        if (!p) return;

        document.getElementById('badges-player-name')!.textContent = p.name;
        const grid = document.getElementById('badges-case-grid')!;
        grid.innerHTML = '';

        const totalGyms = GameState.activeGyms && GameState.activeGyms.length > 0 ? GameState.activeGyms.length : 8;
        let earned = 0;
        for (let b = 0; b < totalGyms; b++) {
            const isActive = !!p.badges[b];
            if (isActive) earned++;
            const actualGymId = GameState.activeGyms ? GameState.activeGyms[b] : (b + 1);
            const gData = GYM_DATA.find(g => g.id === actualGymId);
            const typeName = gData ? gData.type.join('/') : 'Desconhecido';
            const leaderName = gData ? gData.leaderName : `Líder ${b + 1}`;

            const slot = document.createElement('button');
            slot.type = 'button';
            slot.className = `pb-bslot${isActive ? ' is-on' : ''}`;
            slot.style.setProperty('--c', TYPE_COLORS[gData?.type[0] || ''] || '#d9a93f');
            slot.style.setProperty('--i', String(b));
            slot.setAttribute('aria-label', `Insígnia ${typeName}, líder ${leaderName}, ${isActive ? 'conquistada' : 'pendente'}`);
            slot.innerHTML = `<span class="pb-bslot-well">${gData ? `<img src="/assets/img/Insignias/${gData.badgeImg}" alt="" draggable="false">` : ''}</span>
                <strong>${typeName}</strong><small>${leaderName}</small><em>${isActive ? 'Conquistada' : 'Pendente'}</em>`;
            if (gData) slot.addEventListener('click', () => (GameUI as any).openGymDetail(actualGymId, b + 1));
            grid.appendChild(slot);
        }
        document.getElementById('badges-count')!.innerHTML = `<b>${earned}</b><i>/${totalGyms}</i>`;
        GameFeel.vibrate([15]);
        document.getElementById('player-badges-modal')!.style.display = 'flex';

        if (!GameUI.badgeKeysReady) {
            GameUI.badgeKeysReady = true;
            document.addEventListener('keydown', e => {
                if (e.key !== 'Escape' || GameDialog.isOpen()) return;
                // O ginásio aberto pela insígnia fica por cima: fecha um de cada vez
                const gym = document.getElementById('gym-detail-modal')!;
                const badges = document.getElementById('player-badges-modal')!;
                if (badges.style.display !== 'flex') return;
                (gym.style.display === 'flex' ? gym : badges).style.display = 'none';
            });
        }
    }

    private static badgeKeysReady = false;

    static openPokedexEntry(targetId: number) {
        this.openPokedex(GameState.turn, targetId);
    }

    static openPokedex(pId: number, focusId: number | null = null) {
        PokedexScreen.open(pId, focusId);
    }

    static async openItemTargetSelector(pId: number, itemKey: string) {
        GameState.pendingHealItem = itemKey;
        const p = GameState.players[pId];
        const item = SHOP_ITEMS.find(i => i.id === itemKey)!;
        const modal = document.getElementById('pkmn-select-modal')!;
        const list = document.getElementById('pkmn-select-list')!;
        const title = document.getElementById('select-title')!;
        title.innerText = item.type === 'mega' ? "Escolha quem vai segurar a Mega Pedra:" :
            item.type === 'hold' ? "Escolha quem vai segurar este item:" : "Usar em qual Pokémon?";
        list.innerHTML = '';

        p.team.forEach((mon, idx) => {
            const div = document.createElement('div');

            const isShiny = mon.isShiny;
            const heldItemData = mon.heldItem ? SHOP_ITEMS.find(i => i.id === mon.heldItem) : null;
            const heldItemHTML = heldItemData ? `<img src="/assets/img/Itens/${heldItemData.icon}" style="width:20px; height:20px; margin-left:8px; vertical-align: middle; filter: drop-shadow(0 0 2px rgba(255,255,255,0.8));" title="Segurando: ${heldItemData.name}">` : '';

            const detailedHTML = `
                <div style="display: flex; align-items: center; gap: 12px; text-align: left; width: 100%; justify-content: flex-start; border: 1px solid ${isShiny ? '#f1c40f' : '#555'}; background: ${isShiny ? 'rgba(241, 196, 15, 0.1)' : 'transparent'}; padding: 8px; border-radius: 6px; box-sizing: border-box;">
                    <img src="${mon.getSprite()}" width="50" style="object-fit:contain; filter: drop-shadow(0 0 3px ${isShiny ? '#f1c40f' : 'transparent'});">
                    <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
                        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                            <b style="font-size:1.1rem; color:${isShiny ? '#f1c40f' : '#fff'}; display:flex; align-items:center;">${mon.name} ${isShiny ? '✨' : ''}${heldItemHTML}</b>
                            <span style="font-size:0.9rem; font-weight:bold; color:#f1c40f; background:rgba(0,0,0,0.5); padding:2px 6px; border-radius:4px;">Lv.${mon.level}</span>
                        </div>
                        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap:4px; font-size:0.8rem; color:#ecf0f1; background:rgba(0,0,0,0.3); padding:4px; border-radius:4px; text-align:center;">
                            <span title="HP Atual / Máx">❤️ ${mon.currentHp}/${mon.maxHp}</span>
                            <span title="Ataque">⚔️ ${mon.atk}</span>
                            <span title="Defesa">🛡️ ${mon.def}</span>
                            <span title="Velocidade">💨 ${mon.speed}</span>
                        </div>
                    </div>
                </div>
            `;

            if (item.type === 'mega') {
                const canMega = !!MAPA_MEGAS[mon.id];
                if (canMega) {
                    if (mon.megaStone) {
                        div.className = `mon-select-item disabled`;
                        div.innerHTML = detailedHTML + `<div style="width:100%; text-align:center; margin-top:5px;"><small style="color:#f1c40f; font-weight:bold;">💎 Já Equipado</small></div>`;
                    } else {
                        div.className = `mon-select-item`;
                        div.innerHTML = detailedHTML + `<div style="width:100%; text-align:center; margin-top:5px;"><small style="color:#2ecc71; font-weight:bold;">✅ Compatível!</small></div>`;
                        div.onclick = () => { modal.style.display = 'none'; GameEvents.applyBoardItemEffect(p, item, idx); };
                    }
                } else {
                    div.className = `mon-select-item disabled`;
                    div.innerHTML = detailedHTML.replace('width="50"', 'width="50" style="filter: grayscale(100%); opacity:0.6;"') + `<div style="width:100%; text-align:center; margin-top:5px;"><small style="color:#e74c3c; font-weight:bold;">❌ Incompatível</small></div>`;
                }
            } else {
                div.className = `mon-select-item`;
                div.innerHTML = detailedHTML;
                div.onclick = () => { modal.style.display = 'none'; GameEvents.applyBoardItemEffect(p, item, idx); };
            }
            list.appendChild(div);
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.className = "btn btn-secondary mt-15";
        cancelBtn.innerText = "Cancelar";
        cancelBtn.onclick = () => { modal.style.display = 'none'; GameState.pendingHealItem = null; };
        list.appendChild(cancelBtn);
        modal.style.display = 'flex';
    }



    static openSwapModal(newMon: Pokemon) {
        const modal = document.getElementById('swap-modal')!;
        const list = document.getElementById('swap-list')!;
        list.innerHTML = '';
        const p = GameState.getCurrentPlayer();

        const makeRow = (mon: Pokemon, onPick: () => void, opts: Parameters<typeof ScreenKit.monRow>[1]) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'pb-monpick';
            btn.innerHTML = ScreenKit.monRow(mon, { hp: 'max', ...opts });
            btn.onclick = onPick;
            list.appendChild(btn);
        };

        p.team.forEach((currP: Pokemon, idx: number) => {
            makeRow(currP, () => GameEvents.executeSwap(idx, newMon), { note: 'Soltar este Pokémon' });
        });

        const sep = document.createElement('div');
        sep.className = 'pb-monlist-sep';
        sep.textContent = 'Recém-capturado';
        list.appendChild(sep);

        makeRow(newMon, () => GameEvents.executeSwap(-1, newMon), { cls: 'is-new', badge: 'NOVO', note: 'Soltar o novo e manter o time como está' });

        modal.style.display = 'flex';
    }

    static openLixeira(selectMode: boolean = false) {
        const list = document.getElementById('lixeira-list')!;
        list.innerHTML = '';

        if (GameState.lixeira.length === 0) {
            list.innerHTML = "<p style='color:#ccc; padding:20px;'>A lixeira está vazia.</p>";
        } else {
            GameState.lixeira.forEach((mon, idx) => {
                const card = document.createElement('div');
                card.className = 'dex-card';
                const isShiny = mon.isShiny;
                card.style.cssText = `display: flex; flex-direction: column; align-items: center; background: ${isShiny ? 'rgba(241, 196, 15, 0.1)' : 'rgba(0,0,0,0.5)'}; padding: 10px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 1px solid ${isShiny ? '#f1c40f' : 'transparent'}; width: 160px; cursor: pointer; position: relative; box-sizing: border-box;`;

                const spriteUrl = mon.getSprite();

                const heldItemData = (mon as any).heldItem ? SHOP_ITEMS.find(i => i.id === (mon as any).heldItem) : null;
                const iconsHtml = [
                    mon.megaStone ? '<span title="Mega Pedra Equipada" style="filter: drop-shadow(0 0 2px #3498db); font-size: 1rem;">💎</span>' : '',
                    heldItemData ? `<img src="/assets/img/Itens/${heldItemData.icon}" style="width:18px; height:18px; filter: drop-shadow(0 0 2px rgba(0,0,0,0.3));" title="Item: ${heldItemData.name}">` : ((mon as any).heldItem ? '🎒' : '')
                ].filter(Boolean).join(' ');

                card.innerHTML = `
                    <div style="position:absolute; top:4px; right:6px; display:flex; gap:4px; z-index: 10;">${iconsHtml}</div>
                    <img src="${spriteUrl}" style="width: 70px; height: 70px; object-fit: contain; ${isShiny ? 'filter: drop-shadow(0 0 5px #f1c40f);' : ''}">
                    <b style="font-size: 1rem; color: ${isShiny ? '#f1c40f' : '#fff'}; text-align: center;">${mon.name} ${isShiny ? '✨' : ''}</b>
                    <small style="color: #e67e22; font-weight: bold; margin-bottom: 5px;">Lv.${mon.level}</small>
                    <div style="width: 100%; background: rgba(0,0,0,0.4); border-radius: 6px; padding: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.75rem; color: #ecf0f1; box-sizing:border-box;">
                        <div style="display:flex; justify-content:space-between; align-items:center;"><span>❤️</span> <b>${mon.maxHp}</b></div>
                        <div style="display:flex; justify-content:space-between; align-items:center;"><span>⚔️</span> <b>${mon.atk}</b></div>
                        <div style="display:flex; justify-content:space-between; align-items:center;"><span>🛡️</span> <b>${mon.def}</b></div>
                        <div style="display:flex; justify-content:space-between; align-items:center;"><span>💨</span> <b>${mon.speed}</b></div>
                    </div>
                `;

                if (selectMode) {
                    card.onclick = () => {
                        document.getElementById('lixeira-modal')!.style.display = 'none';
                        // Modo seleção vem da carta Segunda Chance: a carta só é consumida ao confirmar o resgate
                        (window as any).Cards.activate('adotar_lixeira', idx);
                    };
                } else {
                    card.onclick = () => {
                        if ((window as any).Game && (window as any).Game.openPokedexEntry) {
                            (window as any).Game.openPokedexEntry(mon.id);
                        }
                    };
                }
                list.appendChild(card);
            });
        }

        document.getElementById('lixeira-modal')!.style.display = 'flex';
    }

    static openPlayerMastery(pId: number) {
        const p = GameState.players[pId];
        let modal = document.getElementById('player-mastery-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'player-mastery-modal';
            modal.className = 'modal-overlay';
            modal.style.zIndex = '15000';
            modal.onclick = (e) => { if (e.target === modal) modal!.style.display = 'none'; };

            const content = document.createElement('div');
            content.className = 'modal-box pb-screen pb-mastery';
            content.innerHTML = `
                <header class="pb-screen-head">
                    <span class="pb-stats-avatar pb-mastery-avatar"><img id="mastery-avatar" src="" alt=""></span>
                    <div class="pb-screen-title">
                        <small id="mastery-kicker">Treinador</small>
                        <h3>Maestria de tipagem</h3>
                    </div>
                    ${ScreenKit.closeX("document.getElementById('player-mastery-modal').style.display='none'")}
                </header>
                <p class="pb-screen-lead">Derrote Pokémon selvagens ou de inimigos para subir sua maestria. Cada nível aumenta em +1% o dano dos golpes daquele tipo.</p>
                <div id="mastery-summary" class="pb-mastery-summary"></div>
                <div id="mastery-list" class="pb-mastery-grid"></div>
            `;
            modal.appendChild(content);
            document.body.appendChild(modal);
        }

        const avatarImg = document.getElementById('mastery-avatar') as HTMLImageElement;
        avatarImg.src = p.avatar;
        (avatarImg.parentElement as HTMLElement).style.setProperty('--pc', PLAYER_COLORS[pId % PLAYER_COLORS.length]);
        document.getElementById('mastery-kicker')!.textContent = `Treinador ${p.name}`;

        const list = document.getElementById('mastery-list')!;
        list.innerHTML = '';

        const typeColors: any = { "Normal": "#A8A77A", "Fogo": "#EE8130", "Água": "#6390F0", "Elétrico": "#F7D02C", "Grama": "#7AC74C", "Gelo": "#96D9D6", "Lutador": "#C22E28", "Veneno": "#A33EA1", "Terra": "#E2BF65", "Voador": "#A98FF3", "Psíquico": "#F95587", "Inseto": "#A6B91A", "Pedra": "#B6A136", "Fantasma": "#735797", "Dragão": "#6F35FC", "Noturno": "#705746", "Aço": "#B7B7CE", "Fada": "#D685AD" };

        let typeMastery: Record<string, number> = {};
        for (const type of Object.keys(typeColors)) {
            typeMastery[type] = 0;
        }

        if (p.pokedexData) {
            for (const dexEntry of POKEDEX) {
                const entry = p.pokedexData[dexEntry.id];
                if (entry && entry.defeated) {
                    if (dexEntry.type) typeMastery[dexEntry.type] = (typeMastery[dexEntry.type] || 0) + entry.defeated;
                    if (dexEntry.secondType) typeMastery[dexEntry.secondType] = (typeMastery[dexEntry.secondType] || 0) + entry.defeated;
                }
            }
        }

        const types = Object.keys(typeColors);
        const unlocked = types.filter(t => typeMastery[t] > 0);
        const best = [...unlocked].sort((a, b) => typeMastery[b] - typeMastery[a])[0];
        document.getElementById('mastery-summary')!.innerHTML = `
            <div class="pb-mastery-chip"><small>Tipos dominados</small><b>${unlocked.length}/${types.length}</b></div>
            <div class="pb-mastery-chip"><small>Melhor tipo</small>${best ? `<span class="pb-mastery-type poke-type-badge" data-type="${best}" style="--tc:${typeColors[best]}; cursor:help;">${best}</span><b>+${typeMastery[best]}%</b>` : '<em>Nenhum ainda</em>'}</div>`;

        const maxMastery = Math.max(1, ...types.map(t => typeMastery[t]));
        for (const type of types) {
            const mastery = typeMastery[type];
            const d = document.createElement('div');
            d.className = `pb-mastery-tile ${mastery > 0 ? 'is-on' : 'is-off'} poke-type-badge`;
            d.setAttribute('data-type', type);
            d.style.cursor = 'help';
            d.style.setProperty('--tc', typeColors[type]);
            d.innerHTML = `
                <span class="pb-mastery-type">${type}</span>
                <b class="pb-mastery-lv">Lv${mastery}</b>
                <span class="pb-mastery-bonus">${mastery > 0 ? `+${mastery}% dano` : 'Sem bônus'}</span>
                <em><u style="width:${Math.round((mastery / maxMastery) * 100)}%"></u></em>
            `;
            list.appendChild(d);
        }

        modal.style.display = 'flex';
    }

    static openPlayerStats() {
        const list = document.getElementById('player-stats-list')!;
        list.innerHTML = '';

        const sorted = [...GameState.players].sort((a, b) => {
            const scoreA = (a.stats?.cardsSuffered || 0) + (a.stats?.turnsLost || 0);
            const scoreB = (b.stats?.cardsSuffered || 0) + (b.stats?.turnsLost || 0);
            return scoreB - scoreA;
        });

        const maxScore = Math.max(1, (sorted[0]?.stats?.cardsSuffered || 0) + (sorted[0]?.stats?.turnsLost || 0));

        // Ícones em SVG (traço) para os blocos de números
        const ICONS: Record<string, string> = {
            hit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6M16 16l4 4M19 21l2-2"/></svg>',
            fx: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
            shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5" stroke-linecap="round"/></svg>',
            time: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9s10 4 10 9"/></svg>',
            card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="7" y="3" width="12" height="16" rx="2"/><path d="M5 6.5v12A2.5 2.5 0 0 0 7.5 21H15"/></svg>',
            target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4" stroke-linecap="round"/></svg>'
        };
        const statOf = (p: any) => p.stats || { cardsUsed: 0, cardsSuffered: 0, effectsReceived: {}, cardsDefended: {}, turnsLost: 0 };
        const sumRec = (r: any) => (r && typeof r === 'object' && !Array.isArray(r)) ? Object.values(r as Record<string, number>).reduce((s: number, v: number) => s + (Number(v) || 0), 0) : 0;
        const maxOf = (fn: (p: any) => number) => Math.max(1, ...GameState.players.map(fn));
        const maxes = {
            hit: maxOf(p => statOf(p).cardsSuffered || 0),
            fx: maxOf(p => sumRec(statOf(p).effectsReceived)),
            shield: maxOf(p => sumRec(statOf(p).cardsDefended)),
            time: maxOf(p => statOf(p).turnsLost || 0)
        };
        const colorOf = (p: any) => PLAYER_COLORS[Math.max(0, GameState.players.indexOf(p)) % PLAYER_COLORS.length];
        const avatarHTML = (p: any, cls = '') => `<span class="pb-stats-avatar ${cls}" style="--pc:${colorOf(p)}"><img src="${p.avatar}" alt=""></span>`;

        // Destaques: alvo preferido (mais cartas sofridas) e mais ofensivo
        const topBy = (fn: (p: any) => number) => {
            const best = [...GameState.players].sort((a, b) => fn(b) - fn(a))[0];
            return best && fn(best) > 0 ? best : null;
        };
        const favTarget = topBy(p => statOf(p).cardsSuffered || 0);
        const topAttacker = topBy(p => statOf(p).cardsUsed || 0);
        const highlight = (p: any, label: string, value: string, icon: string, tone: string) => `
            <div class="pb-stats-spot pb-stats-spot--${tone}" style="--pc:${colorOf(p)}">
                ${avatarHTML(p)}
                <div class="pb-stats-spot-text">
                    <small><i class="pb-stats-ico">${icon}</i>${label}</small>
                    <strong>${p.name}</strong>
                    <span>${value}</span>
                </div>
            </div>`;
        const spot = document.createElement('div');
        spot.className = 'pb-stats-spots';
        spot.innerHTML = (favTarget || topAttacker)
            ? `${favTarget ? highlight(favTarget, 'Alvo preferido', `<b>${statOf(favTarget).cardsSuffered}</b> cartas sofridas`, ICONS.target, 'target') : ''}
               ${topAttacker ? highlight(topAttacker, 'Mais ofensivo', `<b>${statOf(topAttacker).cardsUsed}</b> cartas ofensivas`, ICONS.card, 'attack') : ''}`
            : `<div class="pb-stats-empty pb-stats-empty--wide"><i class="pb-stats-ico">${ICONS.card}</i>Nenhuma carta ofensiva jogada ainda. Os destaques aparecem aqui.</div>`;
        list.appendChild(spot);

        sorted.forEach((p, rank) => {
            const stats = p.stats || { cardsUsed: 0, cardsSuffered: 0, effectsReceived: {}, cardsDefended: {}, turnsLost: 0 };
            const effectsRecord: Record<string, number> = (stats.effectsReceived && typeof stats.effectsReceived === 'object' && !Array.isArray(stats.effectsReceived))
                ? (stats.effectsReceived as unknown as Record<string, number>) : {};
            const defendedRecord: Record<string, number> = (stats.cardsDefended && typeof stats.cardsDefended === 'object' && !Array.isArray(stats.cardsDefended))
                ? (stats.cardsDefended as unknown as Record<string, number>) : {};
            const totalEffects = Object.values(effectsRecord).reduce((s: number, v: number) => s + v, 0);
            const totalDefended = Object.values(defendedRecord).reduce((s: number, v: number) => s + v, 0);
            const totalScore = stats.cardsSuffered + stats.turnsLost;
            const pct = Math.round((totalScore / maxScore) * 100);

            // Sem sofrimento registrado não há pódio: todos ficam com a medalha neutra
            const medal = totalScore === 0 ? 'plain' : rank === 0 ? 'gold' : rank === 1 ? 'silver' : rank === 2 ? 'bronze' : 'plain';
            const heat = pct >= 67 ? 'high' : pct >= 34 ? 'mid' : 'low';

            const getRarityColor = (name: string, defaultColor: string) => {
                const card = CARDS_DB.find(c => c.name === name);
                if (card && CARD_RARITIES[card.rarity]) return CARD_RARITIES[card.rarity].color;

                const fallbacks: Record<string, string> = {
                    'Slow': CARD_RARITIES['Comum'].color, 'Lentidão': CARD_RARITIES['Comum'].color,
                    'Curse': CARD_RARITIES['Incomum'].color, 'Maldição': CARD_RARITIES['Incomum'].color,
                    'Moonwalker': CARD_RARITIES['Rara'].color, 'Tremembé': CARD_RARITIES['Lendária'].color,
                    'Adeus de Ash': CARD_RARITIES['Lendária'].color, 'O Adeus de Ash': CARD_RARITIES['Lendária'].color,
                    'Troques': CARD_RARITIES['Épica'].color, 'Troca forçada': CARD_RARITIES['Épica'].color,
                    'Imposto de Renda': CARD_RARITIES['Épica'].color, 'Comunismo': CARD_RARITIES['Épica'].color,
                    'Katrina': CARD_RARITIES['Rara'].color, 'Furacão Katrina': CARD_RARITIES['Rara'].color,
                    'Bolsa furada': CARD_RARITIES['Rara'].color, 'Bag': CARD_RARITIES['Rara'].color,
                    'Novo líder': CARD_RARITIES['Rara'].color, 'Equipe Rocket': CARD_RARITIES['Incomum'].color,
                    'Interferência': CARD_RARITIES['Rara'].color, 'Silver Tape': CARD_RARITIES['Rara'].color,
                    'Pokémon Fiel': CARD_RARITIES['Épica'].color, 'Líder Velho': CARD_RARITIES['Rara'].color,
                    'Do nada bolinha perdida': CARD_RARITIES['Épica'].color
                };
                return fallbacks[name] || defaultColor;
            };

            const tagHTML = ([name, count]: [string, number], fallback: string) =>
                `<span class="pb-stats-tag" style="--rc:${getRarityColor(name, fallback)}">${name}<b>x${count}</b></span>`;
            const effectTagsHTML = Object.entries(effectsRecord).sort((a, b) => b[1] - a[1]).map(e => tagHTML(e, '#7f8c8d')).join('');
            const defendTagsHTML = Object.entries(defendedRecord).sort((a, b) => b[1] - a[1]).map(e => tagHTML(e, '#2f8f57')).join('');

            const tile = (key: 'hit' | 'fx' | 'shield' | 'time', value: number, label: string) => `
                <div class="pb-stats-tile pb-stats-tile--${key}">
                    <i class="pb-stats-ico">${ICONS[key]}</i>
                    <b>${value}</b>
                    <span>${label}</span>
                    <em><u style="width:${Math.round((value / maxes[key]) * 100)}%"></u></em>
                </div>`;

            const row = document.createElement('div');
            row.className = `pb-stats-card pb-stats-card--${medal}${p === favTarget ? ' is-target' : ''}`;
            row.style.setProperty('--pc', colorOf(p));
            row.innerHTML = `
                <div class="pb-stats-card-head">
                    <span class="pb-stats-medal" title="${rank + 1}º no ranking de sofrimento">${rank + 1}</span>
                    ${avatarHTML(p)}
                    <div class="pb-stats-who">
                        <strong>${p.name}</strong>
                        <span class="pb-stats-chips">
                            ${p === favTarget ? '<span class="pb-status pb-status--target">ALVO</span>' : ''}
                            <span class="pb-stats-offense" title="Cartas ofensivas usadas"><i class="pb-stats-ico">${ICONS.card}</i><b>${stats.cardsUsed}</b> ofensivas</span>
                        </span>
                    </div>
                    <div class="pb-stats-score" title="Cartas sofridas + turnos perdidos">
                        <small>Sofrimento</small>
                        <b>${totalScore}</b>
                    </div>
                </div>
                <div class="pb-stats-meter pb-stats-meter--${heat}" role="meter" aria-valuemin="0" aria-valuemax="${maxScore}" aria-valuenow="${totalScore}" aria-label="Sofrimento">
                    <span>DOR</span><em><u style="width:${pct}%"></u></em>
                </div>
                <div class="pb-stats-tiles">
                    ${tile('hit', stats.cardsSuffered, 'Sofridas')}
                    ${tile('fx', totalEffects, 'Efeitos')}
                    ${tile('shield', totalDefended, 'Defendidas')}
                    ${tile('time', stats.turnsLost, 'Turnos perdidos')}
                </div>
                ${totalEffects > 0 ? `<div class="pb-stats-group"><h5><i class="pb-stats-ico">${ICONS.fx}</i>Efeitos recebidos</h5><div class="pb-stats-tags">${effectTagsHTML}</div></div>` : ''}
                ${totalDefended > 0 ? `<div class="pb-stats-group"><h5><i class="pb-stats-ico">${ICONS.shield}</i>Defesas usadas</h5><div class="pb-stats-tags">${defendTagsHTML}</div></div>` : ''}
                ${totalEffects === 0 && totalDefended === 0 ? `<div class="pb-stats-empty">Nenhum efeito ou defesa registrado ainda</div>` : ''}
            `;
            list.appendChild(row);
        });

        document.getElementById('player-stats-modal')!.style.display = 'flex';
    }

    static renderChampionBanner() {
        const champion = GameState.globalChampion;
        let banner = document.getElementById('champion-global-banner');
        if (!banner) return;

        if (MapSystem.size === 7 || !champion || !champion.team || champion.team.length === 0) {
            banner.style.display = 'none';
            return;
        }

        banner.style.cssText = `
            background: linear-gradient(135deg, rgba(13, 20, 26, 0.95) 0%, rgba(35, 48, 62, 0.95) 100%);
            border: 1.5px solid #f1c40f;
            border-radius: 8px;
            padding: 6px 8px;
            margin-bottom: 2px;
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 3px 8px rgba(0,0,0,0.4), 0 0 6px rgba(241, 196, 15, 0.3);
            cursor: pointer;
            transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
            width: 100%;
            box-sizing: border-box;
        `;

        banner.onmouseover = () => {
            banner!.style.transform = 'translateY(-1px)';
            banner!.style.borderColor = '#f9e79f';
            banner!.style.boxShadow = '0 4px 10px rgba(0,0,0,0.5), 0 0 10px rgba(241, 196, 15, 0.55)';
        };
        banner.onmouseout = () => {
            banner!.style.transform = 'none';
            banner!.style.borderColor = '#f1c40f';
            banner!.style.boxShadow = '0 3px 8px rgba(0,0,0,0.4), 0 0 6px rgba(241, 196, 15, 0.3)';
        };
        banner.onclick = () => {
            if (champion && champion.team) {
                GameFeel.vibrate([20, 40, 20]);

                document.getElementById('champion-name-display')!.innerText = champion.name || 'Desconhecido';

                const avatarStr = champion.avatar || 'Red.png';
                const avatarSrc = avatarStr.includes('/') ? avatarStr : `/assets/img/Treinadores/${avatarStr}`;
                const leadMon = champion.team[0];
                const leadSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${leadMon.isShiny ? 'shiny/' : ''}${leadMon.id}.png`;

                const avatarEl = document.getElementById('champion-avatar-img') as HTMLImageElement;
                if (avatarEl) avatarEl.src = avatarSrc;

                const leadEl = document.getElementById('champion-lead-sprite') as HTMLImageElement;
                if (leadEl) leadEl.src = leadSprite;

                const listContainer = document.getElementById('champion-team-list')!;
                listContainer.innerHTML = '';

                champion.team.forEach((p: any, index: number) => {
                    const isShiny = p.isShiny;
                    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${isShiny ? 'shiny/' : ''}${p.id}.png`;

                    const colors: any = { "Normal": "#A8A77A", "Fogo": "#EE8130", "Água": "#6390F0", "Elétrico": "#F7D02C", "Grama": "#7AC74C", "Gelo": "#96D9D6", "Lutador": "#C22E28", "Veneno": "#A33EA1", "Terra": "#E2BF65", "Voador": "#A98FF3", "Psíquico": "#F95587", "Inseto": "#A6B91A", "Pedra": "#B6A136", "Fantasma": "#735797", "Dragão": "#6F35FC", "Noturno": "#705746", "Aço": "#B7B7CE", "Fada": "#D685AD" };
                    const bgColor = colors[p.type] || '#555';

                    const card = document.createElement('div');
                    card.className = `champion-mon-card ${isShiny ? 'is-shiny' : ''}`;
                    card.style.setProperty('--mon-color', bgColor);

                    card.onclick = () => {
                        this.openPokemonDetail(-1, index, champion);
                    };

                    let typesHtml = `<span class="poke-type-badge pkmn-type-tag" data-type="${p.type}" style="background:${bgColor}; font-size:0.65rem;">${p.type}</span>`;
                    if (p.secondType) {
                        const bg2 = colors[p.secondType] || '#555';
                        typesHtml += ` <span class="poke-type-badge pkmn-type-tag" data-type="${p.secondType}" style="background:${bg2}; font-size:0.65rem;">${p.secondType}</span>`;
                    }

                    const hId = p.heldItem;
                    const hData = hId ? SHOP_ITEMS.find(i => i.id === hId) : null;
                    const iconsHtml = [
                        p.megaStone ? '<span title="Mega Pedra Equipada">💎</span>' : '',
                        isShiny ? '<span title="Shiny">✨</span>' : '',
                        (hData && !p.megaStone) ? `<img src="/assets/img/Itens/${hData.icon}" style="width:16px; height:16px;" title="Item: ${hData.name}">` : (hId && !p.megaStone ? '🎒' : '')
                    ].filter(Boolean).join(' ');

                    card.innerHTML = `
                        <div class="champion-mon-header-strip">
                            <span class="champion-mon-lv">Lv.${p.level}</span>
                            <div class="champion-mon-icons">${iconsHtml}</div>
                        </div>
                        <img class="champion-mon-sprite" src="${spriteUrl}" alt="${p.name}" loading="lazy">
                        <div class="champion-mon-name">${p.name}</div>
                        <div class="champion-mon-types">${typesHtml}</div>
                        <div class="champion-mon-stats-strip">
                            <div class="champion-mon-stat-item" title="HP Máximo"><span>❤️</span> <b>${p.maxHp}</b></div>
                            <div class="champion-mon-stat-item" title="Ataque"><span>⚔️</span> <b>${p.atk}</b></div>
                            <div class="champion-mon-stat-item" title="Defesa"><span>🛡️</span> <b>${p.def}</b></div>
                            <div class="champion-mon-stat-item" title="Velocidade"><span>💨</span> <b>${p.speed}</b></div>
                        </div>
                        ${p.masteryBonus > 0 ? `<div class="champion-mon-mastery">🔥 Maestria: +${p.masteryBonus}% Dano</div>` : ''}
                        <div class="champion-mon-inspect-tag">🔍 Inspecionar</div>
                    `;

                    listContainer.appendChild(card);
                });

                document.getElementById('champion-team-modal')!.style.display = 'flex';
            }
        };

        const leadMon = champion.team[0];
        const avatarStr = champion.avatar || 'Red.png';
        const avatarSrc = avatarStr.includes('/') ? avatarStr : `/assets/img/Treinadores/${avatarStr}`;
        const leadSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${leadMon.isShiny ? 'shiny/' : ''}${leadMon.id}.png`;

        banner.innerHTML = `
            <div style="text-align: left; text-shadow: 1px 1px 2px black; min-width: 0; flex: 1;">
                <div style="color: #f1c40f; font-weight: 900; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.1;">Rei da Liga</div>
                <div style="font-size: 0.88rem; font-weight: 700; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.2;">${champion.name || 'Desconhecido'}</div>
            </div>
            <div style="position: relative; width: 36px; height: 36px; flex-shrink: 0; margin-left: 6px;">
                <img src="${avatarSrc}" style="width: 36px; height: 36px; border-radius: 50%; border: 1.5px solid #ecf0f1; object-fit: cover; display: block;">
                <img src="${leadSprite}" style="position: absolute; bottom: -3px; left: -7px; width: 28px; height: 28px; object-fit: contain; filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.8));">
            </div>
        `;

        banner.style.display = 'flex';
    }

    static openGymDetail(actualGymId: number, gid: number) {
        const gymData = GYM_DATA.find(g => g.id === actualGymId);
        if (!gymData) return;

        const dynamicTeams = GameState.gymTeams || {};
        const rosterIds = dynamicTeams[actualGymId] || gymData.teamIds || [130];

        const globalAvg = GameState.getGlobalAverageLevel();
        const gymLevel = globalAvg + 1;
        const teamSize = Math.min(6, Math.max(2, GameState.getGlobalAverageTeamSize() + 1));

        const modal = document.getElementById('gym-detail-modal')!;
        const nameEl = document.getElementById('gym-detail-name')!;
        const typeEl = document.getElementById('gym-detail-type')!;
        const badgeEl = document.getElementById('gym-detail-badge') as HTMLImageElement;
        const leaderImgEl = document.getElementById('gym-detail-leader-img') as HTMLImageElement;
        const leaderNameEl = document.getElementById('gym-detail-leader-name')!;
        const infoEl = document.getElementById('gym-detail-info')!;
        const teamListEl = document.getElementById('gym-detail-team-list')!;
        const slotEl = document.getElementById('gym-detail-slot');
        const subtitleEl = document.getElementById('gym-roster-subtitle');

        // Feedback sensorial tátil
        GameFeel.vibrate([15, 30]);

        const typeColors: any = { "Normal": "#A8A77A", "Fogo": "#EE8130", "Água": "#6390F0", "Elétrico": "#F7D02C", "Grama": "#7AC74C", "Gelo": "#96D9D6", "Lutador": "#C22E28", "Veneno": "#A33EA1", "Terra": "#E2BF65", "Voador": "#A98FF3", "Psíquico": "#F95587", "Inseto": "#A6B91A", "Pedra": "#B6A136", "Fantasma": "#735797", "Dragão": "#6F35FC", "Noturno": "#705746", "Aço": "#B7B7CE", "Fada": "#D685AD" };
        const primaryType = gymData.type[0] || 'Normal';
        const gymColor = typeColors[primaryType] || '#f1c40f';

        const cardEl = modal.querySelector('.gym-detail-card') as HTMLElement;
        if (cardEl) {
            cardEl.style.setProperty('--gym-color', gymColor);
            cardEl.style.setProperty('--gym-glow', `${gymColor}66`);
            cardEl.style.setProperty('--gym-glow-soft', `${gymColor}33`);
        }

        if (slotEl) {
            slotEl.innerText = `INSÍGNIA OFICIAL #${gid}`;
        }
        nameEl.innerText = `Ginásio de ${gymData.leaderName}`;

        typeEl.innerHTML = gymData.type.map((t: string) => {
            const c = typeColors[t] || '#666';
            return `<span class="poke-type-badge pkmn-type-tag" data-type="${t}" style="background:${c}; font-size:0.75rem;">${t}</span>`;
        }).join('');

        badgeEl.src = `/assets/img/Insignias/${gymData.badgeImg}`;
        badgeEl.title = `Insígnia de ${primaryType}`;
        leaderImgEl.src = `/assets/img/LideresGym/${gymData.leaderImg}`;
        leaderNameEl.innerText = gymData.leaderName;

        // Calcular fraquezas táticas recomendadas
        const weaknesses = new Set<string>();
        gymData.type.forEach(gType => {
            Object.keys(TYPE_CHART).forEach(atkType => {
                if (TYPE_CHART[atkType] && TYPE_CHART[atkType][gType] === 2) {
                    weaknesses.add(atkType);
                }
            });
        });

        const weaknessHTML = Array.from(weaknesses).map(w => {
            const wc = typeColors[w] || '#555';
            return `<span class="poke-type-badge pkmn-type-tag" data-type="${w}" style="background:${wc}; font-size:0.7rem;">${w} (1.75x)</span>`;
        }).join('');

        infoEl.innerHTML = `
            <div class="gym-intel-metrics">
                <div class="gym-metric-chip">
                    <span class="gym-metric-label">⚔️ Dificuldade</span>
                    <span class="gym-metric-val">Lv. ${gymLevel}</span>
                </div>
                <div class="gym-metric-chip">
                    <span class="gym-metric-label">👥 Desafio</span>
                    <span class="gym-metric-val">${teamSize} Pokémon</span>
                </div>
                <div class="gym-metric-chip">
                    <span class="gym-metric-label">🏅 Recompensa</span>
                    <span class="gym-metric-val">Insígnia #${gid}</span>
                </div>
            </div>
            ${weaknesses.size > 0 ? `
                <div class="gym-intel-weakness">
                    <span class="gym-weakness-title">
                        <span>💡 Dica Tática — Fraquezas do Ginásio:</span>
                    </span>
                    <div class="gym-weakness-tags">
                        ${weaknessHTML}
                    </div>
                </div>
            ` : ''}
        `;

        if (subtitleEl) {
            subtitleEl.innerText = `${rosterIds.length} Pokémon no plantel (o líder escolherá ${teamSize} aleatórios)`;
        }

        teamListEl.innerHTML = '';
        const PkmClass = (window as any).Pokemon || Pokemon;

        rosterIds.forEach((id: number) => {
            const mon = new PkmClass(id, gymLevel, false);
            const bgColor = typeColors[mon.type] || '#555';

            const card = document.createElement('div');
            card.className = 'gym-mon-card';
            card.style.setProperty('--mon-color', bgColor);
            card.style.setProperty('--mon-glow', `${bgColor}55`);

            const typeBadges = mon.getTypeBadgesHTML ? mon.getTypeBadgesHTML('center') : `<span class="poke-type-badge" data-type="${mon.type}" style="background:${bgColor}; color:#fff; padding:1px 6px; border-radius:4px; font-size:0.68rem; cursor:help;">${mon.type}</span>`;

            card.innerHTML = `
                <span class="gym-mon-lv">Lv.${mon.level}</span>
                <img class="gym-mon-sprite" src="${mon.getSprite()}" alt="${mon.name}" loading="lazy">
                <div class="gym-mon-name">${mon.name}</div>
                <div class="gym-mon-types">${typeBadges}</div>
                <div class="gym-mon-stats-strip">
                    <div class="gym-mon-stat-item" title="HP Máximo">❤️ <b>${mon.maxHp}</b></div>
                    <div class="gym-mon-stat-item" title="Ataque">⚔️ <b>${mon.atk}</b></div>
                    <div class="gym-mon-stat-item" title="Defesa">🛡️ <b>${mon.def}</b></div>
                    <div class="gym-mon-stat-item" title="Velocidade">💨 <b>${mon.speed}</b></div>
                </div>
            `;
            teamListEl.appendChild(card);
        });

        modal.style.display = 'flex';
    }
}
