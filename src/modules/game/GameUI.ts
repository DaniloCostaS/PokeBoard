import { GameState } from './GameState';
import { GameEvents } from './GameEvents';
import { Pokemon } from '../../models/Pokemon';
import { MapSystem } from '../../systems/MapSystem';
import { Network } from '../../systems/Network';
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

export class GameUI {

    static updateHUD() {
        const left = document.getElementById('hud-col-left')!;
        left.innerHTML = '';
        const right = document.getElementById('hud-col-right')!;
        right.innerHTML = '';

        const typeColors: any = { "Normal": "#A8A77A", "Fogo": "#EE8130", "Água": "#6390F0", "Elétrico": "#F7D02C", "Grama": "#7AC74C", "Gelo": "#96D9D6", "Lutador": "#C22E28", "Veneno": "#A33EA1", "Terra": "#E2BF65", "Voador": "#A98FF3", "Psíquico": "#F95587", "Inseto": "#A6B91A", "Pedra": "#B6A136", "Fantasma": "#735797", "Dragão": "#6F35FC", "Noturno": "#705746", "Aço": "#B7B7CE", "Fada": "#D685AD" };

        if (!GameState.players || GameState.players.length === 0) return;

        GameState.players.forEach(p => {
            if (p.team) {
                p.team.forEach(mon => {
                    if (mon.validateAndFix) mon.validateAndFix();
                });
            }
        });

        GameState.players.forEach((p, i) => {
            const d = document.createElement('div');
            d.className = `player-slot ${i === GameState.turn ? 'active' : ''}`;

            let badgeHTML = '<div class="badges-container">';
            for (let b = 0; b < 8; b++) {
                const isActive = p.badges[b];
                const actualGymId = GameState.activeGyms ? GameState.activeGyms[b] : (b + 1);
                const gData = GYM_DATA.find(g => g.id === actualGymId);
                const imgUrl = gData ? `/assets/img/Insignias/${gData.badgeImg}` : '';
                const style = isActive ? `background-image: url('${imgUrl}'); background-size: 100% 100%; background-repeat: no-repeat; background-color: transparent;` : `background-color: #ccc;`;
                badgeHTML += `<div class="badge-slot ${isActive ? 'active' : ''}" style="${style}" title="Insígnia ${b + 1}"></div>`;
            }
            badgeHTML += '</div>';

            const th = p.team.map((m, slotIndex) => {
                let auraClass = '';
                let rarityStyle = '';
                const total = m.baseTotal || (m.maxHp + m.atk + m.def + m.speed);

                if (m.isLegendary) {
                    auraClass = 'aura-legendary';
                    rarityStyle = 'border: 2px solid #A33EA1; box-shadow: 0 0 5px #A33EA1;';
                }
                else {
                    if (total >= 330) { rarityStyle = 'border: 2px solid #e74c3c; box-shadow: 0 0 5px #e74c3c;'; }
                    else if (total >= 280) { rarityStyle = 'border: 2px solid #3498db; box-shadow: 0 0 5px #3498db;'; }
                    else if (total >= 220) { rarityStyle = 'border: 2px solid #2ecc71; box-shadow: 0 0 5px #2ecc71;'; }
                }

                if (m.isShiny) auraClass = 'aura-shiny';

                const megaIcon = m.megaStone ? `<img src="/assets/img/megaStone.png" style="width:16px; height:16px; margin-left:4px;" title="Mega Pedra Equipada">` : '';
                
                const heldItemData = m.heldItem ? SHOP_ITEMS.find(i => i.id === m.heldItem) : null;
                const itemIcon = heldItemData ? `<img src="/assets/img/Itens/${heldItemData.icon}" style="width:16px; height:16px; margin-left:4px;" title="Item Segurando: ${heldItemData.name}">` : '';

                const vinculoIcon = m.vinculoSupremo ? `<span style="font-size:14px; margin-left:4px;" title="Vínculo Supremo">🤝</span>` : '';

                return ` 
                <div class="poke-card ${m.isFainted() ? 'fainted' : ''}" style="${rarityStyle}; cursor: pointer;" onclick="window.Game.openPokemonDetail(${i}, ${slotIndex})"> 
                    <img src="${m.getSprite()}" class="poke-card-img ${auraClass}"> 
                    <div class="poke-card-info"> 
                        <div class="poke-header"> 
                            <span>${m.name}</span> 
                            ${megaIcon}
                            ${itemIcon}
                            ${vinculoIcon}
                            <span class="poke-lvl">Lv.${m.level}</span> 
                        </div> 
                        ${m.getTypeBadgesHTML ? m.getTypeBadgesHTML() : ''}
                        <div class="bar-container" title="HP"> 
                            <div class="bar-fill ${(window as any).Battle?.getHpColor(m.currentHp, m.maxHp)}" style="width:${(m.currentHp / m.maxHp) * 100}%"></div> 
                            <div class="bar-text">${m.currentHp}/${m.maxHp}</div> 
                        </div> 
                        <div class="bar-container" title="XP">
                            <div class="bar-fill xp-bar" style="width:${(m.currentXp / m.maxXp) * 100}%"></div>
                            <div class="bar-text">${Math.floor(m.currentXp)}/${m.maxXp}</div>
                        </div> 
                        <div class="poke-stats"> 
                            <div class="stat-item">⚔️${m.atk}</div> 
                            <div class="stat-item">🛡️${m.def}</div> 
                            <div class="stat-item">💨${m.speed}</div> 
                        </div> 
                </div> </div>`;
            }).join('');

            const totalItems = Object.values(p.items).reduce((sum, val) => sum + val, 0);
            const totalCards = p.cards.length;

            let effectsHTML = `<div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:2px; min-height:18px;">`;
            const protectedCardsCount = p.cards.filter((c:any) => c.isProtected).length;
            if (protectedCardsCount > 0) effectsHTML += `<span style="background:#f39c12; color:white; font-size:0.65rem; padding:1px 4px; border-radius:4px;" title="Cartas Protegidas">🔒 ${protectedCardsCount}</span>`;
            if (p.skipTurns > 0) effectsHTML += `<span style="background:#c0392b; color:white; font-size:0.65rem; padding:1px 4px; border-radius:4px;" title="Paralisado">🚫 ${p.skipTurns}</span>`;
            if (p.effects.slow && p.effects.slow > 0) effectsHTML += `<span style="background:#7f8c8d; color:white; font-size:0.65rem; padding:1px 4px; border-radius:4px;" title="Lentidão">🕸️ ${p.effects.slow}</span>`;
            if (p.effects.curse) effectsHTML += `<span style="background:#2c3e50; color:#e74c3c; font-size:0.65rem; padding:1px 4px; border-radius:4px; border:1px solid #e74c3c;" title="Amaldiçoado">😈 CURSE</span>`;
            if (p.effects.lureShiny && p.effects.lureShiny > 0) effectsHTML += `<span style="background:#f1c40f; color:#2c3e50; font-size:0.65rem; padding:1px 4px; border-radius:4px; font-weight:bold;" title="Shiny Lure">✨ ${p.effects.lureShiny}</span>`;
            if (p.effects.extraTurn) effectsHTML += `<span style="background:#2980b9; color:white; font-size:0.65rem; padding:1px 4px; border-radius:4px;" title="Tempo Parado">⏳ EXTRA</span>`;
            if (p.effects.doubleXp && p.effects.doubleXp > 0) effectsHTML += `<span style="background:#8e44ad; color:white; font-size:0.65rem; padding:1px 4px; border-radius:4px;" title="Double XP">🚻 ${p.effects.doubleXp}</span>`;
            if (p.effects.expShare && p.effects.expShare > 0) effectsHTML += `<span style="background:#27ae60; color:white; font-size:0.65rem; padding:1px 4px; border-radius:4px;" title="Exp Share">🤝 ${p.effects.expShare}</span>`;
            if (p.effects.moonwalker && p.effects.moonwalker > 0) effectsHTML += `<span style="background:#f39c12; color:white; font-size:0.65rem; padding:1px 4px; border-radius:4px;" title="Moonwalker">💃 ${p.effects.moonwalker}</span>`;
            if (p.effects.lureType && p.effects.lureType.count > 0) {
                const lType = p.effects.lureType.type;
                const lColor = typeColors[lType] || '#777';
                effectsHTML += `<span style="background:${lColor}; color:white; font-size:0.65rem; padding:1px 4px; border-radius:4px; border:1px solid rgba(255,255,255,0.3); font-weight:bold;" title="Lure Type: ${lType}">🧲 ${lType} ${p.effects.lureType.count}</span>`;
            }
            effectsHTML += `</div>`;

            d.innerHTML = ` 
            <div class="hud-header" style="flex-direction:column; align-items:flex-start; gap:0;">
                <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                    <div class="hud-name-group"><img src="${p.avatar}" class="hud-avatar-img"><span>${p.name}</span></div>
                    <div style="font-weight:bold; color:#f1c40f; text-shadow:1px 1px 0 #000;">💰${p.gold}</div>
                </div>
                ${effectsHTML}
            </div> 
            ${badgeHTML} 
            <div class="hud-team">${th}</div> 
            <div class="hud-actions">
                <button class="btn btn-secondary btn-mini" onclick="window.Game.openInventoryModal(${i})">🎒 ${totalItems}</button>
                <button class="btn btn-secondary btn-mini" onclick="window.Game.openBoardCards(${i})">🃏 ${totalCards}</button>
                <button class="btn btn-mini" style="background:#e74c3c; color:white; border:1px solid #c0392b;" onclick="window.Game.openPokedex(${i})">📖 Dex</button>
            </div>`;
            if (i < Math.ceil(GameState.players.length / 2)) left.appendChild(d);
            else right.appendChild(d);
        });

        const turnPlayer = GameState.players[GameState.turn];
        if (turnPlayer) document.getElementById('turn-indicator')!.innerText = turnPlayer.name;
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
            if (GameState.currentGlobalEvent) {
                const roundsLeft = GameState.eventEndRound - GameState.round;
                eventEl.innerHTML = `
                <div style="margin-top: 10px; padding: 5px; background: rgba(231, 76, 60, 0.15); border: 1px dashed #e74c3c; border-radius: 4px; color: #fff; font-size: 0.8rem; text-align: center; animation: pulseShiny 2s infinite alternate; cursor: pointer;" onclick="window.Game.showEventDetails()">
                    <b style="color: #f1c40f;">${GameState.currentGlobalEvent.icon} ${GameState.currentGlobalEvent.name}</b><br>
                    <span style="font-size: 0.65rem; color: #bdc3c7;">Faltam ${roundsLeft} rodada(s)</span>
                </div>`;
            } else {
                eventEl.innerHTML = '';
            }
        }

        const NetworkObj = (window as any).Network || Network;
        if (elRoom) { elRoom.innerText = NetworkObj.isOnline ? NetworkObj.currentRoomId : "LOCAL"; }
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
    }

    static renderBoard() {
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

    static renderTraps(newTraps?: any[]) {
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(t => {
            const htmlEl = t as HTMLElement;
            if (htmlEl.style.border.includes('dashed')) {
                htmlEl.style.border = "";
            }
        });

        if (newTraps) GameState.traps = newTraps;

        GameState.traps.forEach(t => {
            const tile = document.getElementById(`tile-${t.x}-${t.y}`);
            if (tile) tile.style.border = "2px dashed red";
        });
    }

    // ==========================================
    // PAINEL ADMINISTRATIVO / SUPORTE HOST
    // ==========================================
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
        container.innerHTML = '';
        
        const logsToRender = GameState.globalLogs.slice().reverse();
        
        const currentFilter = (this as any).currentLogFilter || 'all';
        const searchInput = document.getElementById('log-search-input') as HTMLInputElement;
        const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";

        logsToRender.forEach((l: any) => {
            let icon = "📟";
            if (l.type === "battle") icon = "⚔️";
            else if (l.type === "cards") icon = "🃏";
            else if (l.type === "gold") icon = "💰";
            else if (l.type === "items") icon = "🎒";
            else if (l.type === "turn") icon = "🛑";
            else if (l.type === "start_turn") icon = "▶️";

            const mLower = l.text.toLowerCase();
            if (mLower.includes("rolou o dado")) icon = "🎲";
            if (mLower.includes("poção") || mLower.includes("curou")) icon = "🧪";
            if (mLower.includes("capturou")) icon = "⚽";
            if (mLower.includes("encontrou um item")) icon = "🎁";

            const matchesSearch = searchText === "" || mLower.includes(searchText);
            const displayStyle = (currentFilter === 'all' || currentFilter === l.type) && matchesSearch ? "flex" : "none";

            let battleBtn = "";
            if (l.battleId) {
                battleBtn = `<button class="btn-view-log" onclick="window.Game.viewBattleLog('${l.battleId}')">🔍 Ver Log de Combate</button>`;
            }

            const logHtml = `
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
            container.insertAdjacentHTML('afterbegin', logHtml);
        });
        container.scrollTop = 0;
    }

    static openAdminPanel() {
        const modal = document.getElementById('admin-modal');
        const pSelect = document.getElementById('admin-player-select') as HTMLSelectElement;
        const tSelect = document.getElementById('admin-turn-select') as HTMLSelectElement;
        const rInput = document.getElementById('admin-round-val') as HTMLInputElement;

        if (!modal || !pSelect || !tSelect || !rInput) return;

        pSelect.innerHTML = '';
        tSelect.innerHTML = '';

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

        if (m.includes("[Batalha]") || mLower.includes("batalha") || mLower.includes("dano") || mLower.includes("desmaiou") || mLower.includes("capturou") || mLower.includes("selvagem") || mLower.includes("fugiu")) {
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

        if (m.includes("rolou o dado")) icon = "🎲";
        if (mLower.includes("poção") || mLower.includes("curou")) icon = "🧪";
        if (mLower.includes("capturou")) icon = "⚽";
        if (mLower.includes("encontrou um item")) icon = "🎁";

        let customStyle = "";
        if (logType === "turn") {
            customStyle = "background: rgba(255, 152, 0, 0.1); border-left: 4px solid #ff9800; font-weight: bold;";
        } else if (logType === "start_turn") {
            customStyle = "background: rgba(46, 204, 113, 0.1); border-left: 4px solid #2ecc71; font-weight: bold; color: #2ecc71;";
        }

        const container = document.getElementById('log-container');
        if (container) {
            m = m.replace(/\n/g, '<br>');

            const newLogEntry: any = { 
                text: m, 
                style: customStyle, 
                type: logType, 
                timestamp 
            };
            if (battleId) newLogEntry.battleId = battleId;

            GameState.globalLogs.unshift(newLogEntry);
            if (GameState.globalLogs.length > 200) GameState.globalLogs.pop();

            const NetworkObj = (window as any).Network || Network;
            if (!skipSync && NetworkObj && NetworkObj.isOnline && typeof NetworkObj.syncLogs === 'function') {
                NetworkObj.syncLogs(GameState.globalLogs);
            }

            const currentFilter = (this as any).currentLogFilter || 'all';
            const searchInput = document.getElementById('log-search-input') as HTMLInputElement;
            const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";
            const matchesSearch = searchText === "" || m.toLowerCase().includes(searchText);

            const displayStyle = (currentFilter === 'all' || currentFilter === logType) && matchesSearch ? "flex" : "none";

            let battleBtn = "";
            if (battleId) {
                battleBtn = `<button class="btn-view-log" onclick="window.Game.viewBattleLog('${battleId}')">🔍 Ver Log de Combate</button>`;
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

    static viewBattleLog(battleId: string) {
        const logs = GameState.battleLogs[battleId];
        if (!logs) return alert("Log de batalha não encontrado ou expirado.");

        let modal = document.getElementById('battle-history-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'battle-history-modal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-box" style="max-width: 500px; max-height: 80vh; display: flex; flex-direction: column; background: #111827; border: 1px solid #374151;">
                <h3 style="margin-top: 0; color: #fff; border-bottom: 1px solid #374151; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <span>⚔️ Histórico de Combate</span>
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
        const NetworkObj = (window as any).Network || Network;
        if (NetworkObj.isOnline) {
            NetworkObj.sendAction('LOG', { msg: msg });
        }
    }

    static recordCardLog(attackerName: string, cardName: string, targetName: string) {
        const entry = {
            round: GameState.round,
            attacker: attackerName,
            card: cardName,
            target: targetName,
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
    }

    static renderCardLogs() {
        const container = document.getElementById('card-log-container');
        if (!container) return;

        if (GameState.cardLogs.length === 0) {
            container.innerHTML = `<div style="color: #7f8c8d; text-align: center; padding-top: 20px; font-style: italic;">Nenhum ataque registrado...</div>`;
            return;
        }

        container.innerHTML = GameState.cardLogs.map(entry => `
            <div class="card-log-entry">
                <span class="round">R${entry.round}</span>
                <span class="attacker">${entry.attacker}</span> usou 
                <b class="card-name">${entry.card}</b> em 
                <span class="target">${entry.target}</span>
            </div>
        `).join('');
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

        let modal = document.getElementById('custom-global-alert');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'custom-global-alert';
            modal.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); display:flex; justify-content:center; align-items:center; z-index:9999;";
            modal.innerHTML = `
                <div style="background:#2b2d42; border:3px solid #8d99ae; border-radius:12px; padding:25px; color:white; text-align:center; min-width:300px; max-width:500px; box-shadow:0 10px 25px rgba(0,0,0,0.8);">
                    <h3 style="margin-top:0; color:#edf2f4; font-size:1.5rem; border-bottom:1px solid #8d99ae; padding-bottom:10px;">Aviso do Tabuleiro</h3>
                    <p id="cga-msg" style="margin:25px 0; font-size:1.2rem; color:#edf2f4;"></p>
                    <div id="cga-controls"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        document.getElementById('cga-msg')!.innerText = displayMsg;
        const controls = document.getElementById('cga-controls')!;

        if (isMyTurn) {
            controls.innerHTML = `<button class="btn" style="background-color:#ef233c; padding:10px 30px; font-size:1.1rem; margin:0;" onclick="window.Game.confirmGlobalAlert()">OK</button>`;
        } else {
            controls.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                    <span style="color:#8d99ae; font-style:italic; font-size:1rem;">⏳ Aguardando ${playerName} confirmar...</span>
                    <button class="btn" style="background:transparent; border:1px solid #7f8c8d; color:#7f8c8d; font-size:0.8rem; padding:5px 15px; margin:0;" onclick="window.Game.closeGlobalAlert()">❌ Fechar Aviso</button>
                </div>
            `;
        }

        modal.style.display = 'flex';
    }

    static confirmGlobalAlert() {
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
            this.playLegendaryCinematic(GameState.pendingLegendaryAlert.player, GameState.pendingLegendaryAlert.monName, GameState.pendingLegendaryAlert.isMyEncounter);
            GameState.pendingLegendaryAlert = null;
        }
    }

    static playLegendaryCinematic(playerName: string, monName: string, isMyEncounter: boolean) {
        let modal = document.getElementById('legendary-cinematic');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'legendary-cinematic';
            modal.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.92); display:flex; justify-content:center; align-items:center; flex-direction:column; z-index:99999; opacity:0; transition: opacity 0.5s ease; cursor: pointer;";
            modal.innerHTML = `
                <h2 style="color:#e74c3c; font-size: 3rem; text-shadow: 0 0 20px #c0392b, 2px 2px 4px #000; margin-bottom: 20px; font-weight: bold; text-align: center; text-transform: uppercase; letter-spacing: 5px;">ENCONTRO LENDÁRIO!</h2>
                <div style="font-size: 1.5rem; color: #f1c40f; margin-bottom: 30px; text-shadow: 1px 1px 2px #000;" id="leg-cine-subtitle"></div>
                <img id="leg-cine-img" src="" style="height: 45vh; max-height: 500px; filter: drop-shadow(0 0 30px rgba(255,255,255,0.8)); transform: scale(0.5); transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                <div id="leg-cine-name" style="color: #fff; font-size: 2.5rem; margin-top: 30px; font-weight: bold; text-shadow: 2px 2px 4px #000;"></div>
                <div style="color: #bdc3c7; margin-top: 30px; font-size: 1rem; opacity: 0.7;">(Clique para continuar)</div>
            `;
            document.body.appendChild(modal);
        }

        document.getElementById('leg-cine-subtitle')!.innerText = `${playerName} encontrou um Pokémon mítico!`;
        document.getElementById('leg-cine-name')!.innerText = monName;
        document.getElementById('leg-cine-img')!.setAttribute('src', `/assets/gif/lendarios/${monName}.gif`);

        modal.style.display = 'flex';

        setTimeout(() => {
            modal!.style.opacity = '1';
            document.getElementById('leg-cine-img')!.style.transform = 'scale(1.3)';
        }, 50);

        const closeAndBattle = () => {
            modal!.style.opacity = '0';
            document.getElementById('leg-cine-img')!.style.transform = 'scale(0.5)';
            setTimeout(() => {
                modal!.style.display = 'none';
                if (isMyEncounter && GameState.pendingLegendaryEncounter) {
                    const player = GameState.players.find(p => p.name === playerName);
                    if (player) {
                        const BattleObj = (window as any).Battle;
                        if (BattleObj) BattleObj.setup(player, GameState.pendingLegendaryEncounter.mon, false, "Selvagem", 0, null, false, 0, "", GameState.pendingLegendaryEncounter.type);
                    }
                    GameState.pendingLegendaryEncounter = null;
                }
            }, 500);
        };

        modal.onclick = closeAndBattle;
        setTimeout(() => { if (modal!.style.display !== 'none') closeAndBattle(); }, 4000);
    }

    static playCardCinematic(cardId: string, playerName: string) {
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
        modal.innerHTML = `
            <div class="modal-box" style="text-align: center;">
                <h3 style="color:#f1c40f;">${GameState.currentGlobalEvent.icon} ${GameState.currentGlobalEvent.name}</h3>
                <p style="font-size: 1.1rem; line-height: 1.5; margin: 20px 0; color: #fff; text-shadow: 1px 1px 2px #000;">${GameState.currentGlobalEvent.desc}</p>
                <button class="btn btn-secondary mt-15" onclick="document.getElementById('event-details-modal').style.display='none'">Fechar</button>
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
        const { MAPA_MEGAS } = await import('../../constants/mapaMegas');

        document.getElementById('detail-id')!.innerText = `#${mon.id.toString().padStart(3, '0')}`;
        document.getElementById('detail-name')!.innerText = mon.name;
        document.getElementById('detail-img')!.setAttribute('src', mon.getSprite());
        document.getElementById('detail-level')!.innerText = mon.level.toString();
        document.getElementById('detail-xp')!.innerText = `${Math.floor(mon.currentXp)} / ${mon.maxXp}`;
        document.getElementById('detail-xp-bar')!.style.width = `${Math.min(100, (mon.currentXp / mon.maxXp) * 100)}%`;
        document.getElementById('detail-shiny')!.style.display = mon.isShiny ? 'block' : 'none';

        const colors: any = { "Normal": "#A8A77A", "Fogo": "#EE8130", "Água": "#6390F0", "Elétrico": "#F7D02C", "Grama": "#7AC74C", "Gelo": "#96D9D6", "Lutador": "#C22E28", "Veneno": "#A33EA1", "Terra": "#E2BF65", "Voador": "#A98FF3", "Psíquico": "#F95587", "Inseto": "#A6B91A", "Pedra": "#B6A136", "Fantasma": "#735797", "Dragão": "#6F35FC", "Noturno": "#705746", "Aço": "#B7B7CE", "Fada": "#D685AD" };
        document.getElementById('detail-header')!.style.background = colors[mon.type] || '#333';

        const typeContainer = document.getElementById('detail-types')!;
        typeContainer.innerHTML = '';
        [mon.type, mon.secondType].filter(t => t).forEach(t => {
            const span = document.createElement('span');
            span.innerText = t;
            span.style.cssText = `background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; margin-left: 4px;`;
            typeContainer.appendChild(span);
        });

        const ivs = (mon as any).ivs || { hp: 0, atk: 0, def: 0, spd: 0 };
        const bonus = (mon as any).bonusStats || { hp: 0, atk: 0, def: 0, spd: 0 };
        const createStatRow = (label: string, total: number, iv: number, bon: number, icon: string) => `
                <div style="background: #fff; border: 1px solid #eee; padding: 8px; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                    <div style="font-weight: bold; margin-bottom: 4px; display:flex; justify-content:space-between; align-items:center;">
                        <span>${icon} ${label}</span>
                        <span style="font-size:1.1rem; color:#2c3e50;">${total}</span>
                    </div>
                    <div style="font-size: 0.7rem; color: #7f8c8d; display:flex; justify-content:space-between; border-top: 1px dashed #eee; padding-top:4px;">
                        <span title="IV">🧬 IV: <b style="color:#8e44ad">${iv}</b></span>
                        <span title="Up" style="color:#2980b9;">⬆️ Up: +${bon}</span>
                    </div>
                </div>`;
        const grid = document.getElementById('detail-stats-grid')!;
        grid.innerHTML = `
            ${createStatRow("HP", mon.maxHp, ivs.hp, bonus.hp, "❤️")}
            ${createStatRow("Atk", mon.atk, ivs.atk, bonus.atk, "⚔️")}
            ${createStatRow("Def", mon.def, ivs.def, bonus.def, "🛡️")}
            ${createStatRow("Vel", mon.speed, ivs.spd, bonus.spd, "💨")}
        `;

        let itemSection = document.getElementById('detail-item-section');
        if (!itemSection) {
            itemSection = document.createElement('div');
            itemSection.id = 'detail-item-section';
            grid.parentElement?.insertBefore(itemSection, grid.nextSibling);
        }
        itemSection.style.cssText = "margin-top: 15px; background: rgba(0,0,0,0.05); padding: 10px; border-radius: 8px; border: 1px solid #ddd;";
        
        let itemHTML = `<div style="font-weight: bold; color: #2c3e50; font-size: 0.9rem; margin-bottom: 5px;">📦 Item Segurando</div>`;
        if (mon.heldItem || mon.megaStone) {
            const heldId = mon.heldItem || 'megastone';
            const heldData = SHOP_ITEMS.find(i => i.id === heldId);
            const isMe = !championData && (GameState.canAct() && GameState.turn === playerIndex);
            const canRemove = isMe && mon.heldItem; // Only allow removal if it's a held item, not mega stone

            itemHTML += `
                <div style="display:flex; align-items:center; justify-content:space-between; background:#fff; padding:8px; border-radius:6px; border:1px solid #eee;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="/assets/img/Itens/${heldData?.icon || 'MegaStone.png'}" style="width:24px; height:24px; object-fit:contain;">
                        <span style="font-weight:bold; color:#2c3e50; font-size:0.9rem;">${heldData?.name || 'Mega Pedra'}</span>
                    </div>
                    ${canRemove ? `<button class="btn btn-mini" style="background:#e74c3c; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer;" onclick="window.Game.removeHeldItem(${playerIndex}, ${slotIndex})">Remover</button>` : ''}
                </div>
            `;
        } else {
            itemHTML += `<div style="color:#7f8c8d; font-size:0.8rem; font-style:italic; text-align:center; padding:5px;">Nenhum item equipado.</div>`;
        }
        itemSection.innerHTML = itemHTML;

        let resoText = "0%";
        let masteryHTML = "";

        if (targetPlayer.pokedexData) {
            const dexEntry = targetPlayer.pokedexData[mon.id];
            const caught = dexEntry ? (dexEntry.caught || 0) : 0;

            if (caught > 1) {
                const perc = Math.min(100, (caught - 1) * 10);
                resoText = `${perc}% (+${caught - 1} cópias)`;
            } else {
                resoText = `0% (1ª Captura)`;
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
                return `
                    <div style="margin-bottom: 4px; border-bottom: 1px dashed #eee; padding-bottom: 2px;">
                        <div style="display:flex; justify-content:space-between;">
                            <span>Tipo ${t}:</span>
                            <b style="color: ${currentBonus > 0 ? '#27ae60' : '#c0392b'};">+${currentBonus}% Dano</b>
                        </div>
                        <div style="font-size:0.7rem; color:#7f8c8d;">
                            Abatidos: <b>${kills}</b> / ${nextCheckpoint}
                        </div>
                    </div>
                `;
            };

            masteryHTML += generateLine(mon.type);
            if (mon.secondType) {
                masteryHTML += generateLine(mon.secondType);
            }
        } else {
            masteryHTML = "<div style='color:#999; font-style:italic;'>Nenhum dado na Pokédex.</div>";
        }

        document.getElementById('detail-reso')!.innerText = resoText;
        document.getElementById('detail-mastery')!.innerHTML = masteryHTML;
        document.getElementById('detail-mastery')!.style.fontWeight = "normal";

        let evoContainer = document.getElementById('detail-evolution-chain');
        if (!evoContainer) {
            evoContainer = document.createElement('div');
            evoContainer.id = 'detail-evolution-chain';
            evoContainer.style.cssText = "margin-top: 15px;";
            const masteryBlock = document.getElementById('detail-mastery')!.parentElement;
            if (masteryBlock && masteryBlock.parentElement) {
                masteryBlock.parentElement.appendChild(evoContainer);
            }
        }

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

        if (chain.length > 1) {
            let chainHTML = `
                <div style="font-weight: bold; color: #8e44ad; font-size: 0.9rem; margin-bottom: 8px; display: flex; align-items: center; gap: 5px;">
                    🧬 Caminho Evolutivo Previsto
                </div>
                <div style="display: flex; justify-content: center; align-items: center; background: #f8f9fa; padding: 10px; border-radius: 8px; border: 1px solid #eee; overflow-x: auto; gap: 5px;">
            `;

            chain.forEach((stage, idx) => {
                const isCurrent = stage.id === mon.id;
                const filterStyle = stage.isMega ? 'filter: drop-shadow(0 0 5px #f1c40f);' : '';
                const highlightBorder = isCurrent ? 'border: 2px solid #2ecc71; background: #e8f8f5;' : 'border: 2px solid transparent;';

                chainHTML += `
                    <div style="display: flex; flex-direction: column; align-items: center; padding: 5px; border-radius: 8px; ${highlightBorder} min-width: 60px;">
                        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${stage.id}.png" style="width: 50px; height: 50px; image-rendering: pixelated; ${filterStyle}">
                        <span style="font-size: 0.65rem; font-weight: bold; color: #2c3e50; text-align: center; line-height: 1;">${stage.name}</span>
                        <span style="font-size: 0.55rem; color: ${stage.isMega ? '#f39c12' : '#7f8c8d'}; font-weight: bold; background: ${stage.isMega ? '#fef9e7' : '#e0e6ed'}; padding: 2px 4px; border-radius: 4px; margin-top: 4px; white-space: nowrap;">${stage.trigger}</span>
                    </div>
                `;

                if (idx < chain.length - 1) {
                    chainHTML += `<div style="color: #bdc3c7; font-size: 1.2rem; font-weight: bold;">➔</div>`;
                }
            });

            chainHTML += `</div>`;
            evoContainer.innerHTML = chainHTML;
            evoContainer.style.display = 'block';
        } else {
            evoContainer.innerHTML = `
                <div style="font-weight: bold; color: #8e44ad; font-size: 0.9rem; margin-bottom: 8px; display: flex; align-items: center; gap: 5px;">
                    🧬 Caminho Evolutivo Previsto
                </div>
                <div style="text-align: center; background: #f8f9fa; padding: 10px; border-radius: 8px; border: 1px solid #eee; font-size: 0.8rem; color: #7f8c8d;">
                    Estágio Final alcançado.
                </div>
            `;
            evoContainer.style.display = 'block';
        }

        const modalContent = document.querySelector('#detail-modal .modal-content') as HTMLElement || document.querySelector('#detail-modal > div') as HTMLElement;
        if (modalContent) {
            modalContent.style.maxHeight = "90vh";
            modalContent.style.overflowY = "auto";
        }

        document.getElementById('detail-modal')!.style.display = 'flex';
    }

    static openCardLibrary() {
        const list = document.getElementById('library-list')!;
        list.innerHTML = '';

        const modalContent = document.querySelector('#library-modal .modal-content') as HTMLElement;
        if (modalContent) {
            modalContent.style.width = "98%";
            modalContent.style.maxWidth = "1400px";
            modalContent.style.maxHeight = "95vh";
            modalContent.style.padding = "30px";
            modalContent.style.overflowY = "auto";
        }

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

        const modalContent = document.querySelector('#item-library-modal .modal-content') as HTMLElement || document.querySelector('#item-library-modal .modal-box') as HTMLElement;
        if (modalContent) {
            modalContent.style.width = "98%";
            modalContent.style.maxWidth = "1400px";
            modalContent.style.maxHeight = "95vh";
            modalContent.style.padding = "30px";
            modalContent.style.overflowY = "auto";
        }

        list.style.display = 'grid';
        list.style.gridTemplateColumns = 'repeat(auto-fill, minmax(220px, 1fr))';
        list.style.gap = '25px';
        list.style.padding = '20px';
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
            d.style.cssText = "display: flex; flex-direction: column; align-items: center; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); width: 100%; box-sizing: border-box; position: relative; border: 1px solid #556;";

            const typeLabel = item.type === 'heal' ? 'Cura' :
                              item.type === 'revive' ? 'Reviver' :
                              item.type === 'capture' ? 'Captura' :
                              item.type === 'mega' ? 'Mega Stone' :
                              item.type === 'boost' ? 'Boost' :
                              item.type === 'hold' ? 'Segurar' : (item.type as string).toUpperCase();

            const borderColor = item.type === 'mega' ? '#f1c40f' : '#3498db';

            d.innerHTML = `
                <div style="position: absolute; top: -5px; right: -5px; background: ${borderColor}; color: #fff; padding: 2px 6px; font-size: 0.7rem; border-radius: 10px; font-weight: bold; border: 1px solid #222; text-shadow: 1px 1px 0 #000; box-shadow: 0 2px 4px rgba(0,0,0,0.5); z-index: 10;">
                    ${typeLabel.toUpperCase()}
                </div>
                <div style="display:flex; justify-content:center; align-items:center; width:100%; height:80px; margin-bottom:10px;">
                    <img src="/assets/img/Itens/${item.icon}" alt="${item.name}" style="max-height: 100%; max-width: 100%; object-fit: contain; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));">
                </div>
                <div style="margin-top: 8px; font-size: 1rem; text-align: center; color: #f1c40f; font-weight:bold;">${item.name}</div>
                <div style="font-size: 0.85rem; color: #edf2f4; margin-top:5px; text-align:center; flex-grow:1;">${item.desc}</div>
                <div style="margin-top: 10px; font-size: 0.9rem; color: #2ecc71; font-weight:bold; background:rgba(0,0,0,0.3); padding:4px 10px; border-radius:4px; width:100%; text-align:center;">💰 ${item.price} G</div>
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

    static openBoardCards(pId: number) {
        const NetworkObj = (window as any).Network || Network;

        const modalContent = document.querySelector('#board-cards-modal .modal-content') as HTMLElement;
        if (modalContent) {
            modalContent.style.width = "95%";
            modalContent.style.maxWidth = "1200px";
            modalContent.style.maxHeight = "90vh";
            modalContent.style.padding = "30px";
            modalContent.style.overflowY = "auto";
        }

        if (NetworkObj.isOnline && pId !== NetworkObj.myPlayerId) return alert("Privado!");

        const p = GameState.players[pId];
        const list = document.getElementById('board-cards-list')!;
        list.innerHTML = '';

        const isMobile = window.innerWidth <= 1000;

        if (isMobile) {
            list.style.display = 'flex';
            list.style.flexDirection = 'column';
            list.style.gap = '10px';
            list.style.padding = '10px';
        } else {
            list.style.display = 'grid';
            list.style.gridTemplateColumns = 'repeat(auto-fill, minmax(180px, 1fr))';
            list.style.gap = '25px';
            list.style.padding = '20px';
        }
        list.style.width = '100%';

        const isMe = !NetworkObj.isOnline || (p.id === NetworkObj.myPlayerId);

        if (isMe && p.cards.length >= 2) {
            const btnRow = document.createElement('div');
            btnRow.style.cssText = isMobile ? "display: flex; gap: 10px; margin-bottom: 10px; width:100%;" : "grid-column: 1 / -1; display: flex; gap: 10px; margin-bottom: 10px;";

            const sacBtn = document.createElement('button');
            sacBtn.className = 'btn btn-sacrifice';
            sacBtn.style.flex = '1';
            sacBtn.innerHTML = isMobile ? `<span>🔥 SACRIFICAR</span>` : `<span>🔥 SACRIFICAR (2 ➡ Random)</span>`;
            sacBtn.onclick = () => {
                document.getElementById('board-cards-modal')!.style.display = 'none';
                (window as any).Cards.openSacrificeModal();
            };
            btnRow.appendChild(sacBtn);

            if (p.cards.length >= 3) {
                const mergeBtn = document.createElement('button');
                mergeBtn.className = 'btn btn-merge';
                mergeBtn.style.flex = '1';
                mergeBtn.innerHTML = isMobile ? `<span>💎 FUNDIR</span>` : `<span>💎 FUNDIR (4 ➡ Raridade +1)</span>`;
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

        filteredCards.forEach((c) => {
            const originalIndex = p.cards.indexOf(c);
            const rData = CARD_RARITIES[c.rarity];
            let borderColor = rData ? rData.color : '#8d99ae';
            if (c.isProtected) borderColor = '#f1c40f'; // Golden border for protected

            const d = document.createElement('div');

            const btnBaseStyle = "width:100%; padding:8px; border:none; border-radius:4px; color:white; font-weight:bold; cursor:pointer;";
            let actionBtn = '';

            if (c.isProtected) {
                if (canUseMove) actionBtn = `<button class="btn" style="${btnBaseStyle} background:#f39c12; color:#fff;" onclick="window.Cards.unprotectCard(${p.id}, ${originalIndex})">🔓 DESPROTEGER</button>`;
                else actionBtn = `<button class="btn" disabled style="${btnBaseStyle} background:#7f8c8d; cursor:not-allowed;" title="Só pode desproteger no seu turno">PROTEGIDA</button>`;
            } else {
                if (c.type === 'move') {
                    if (canUseMove) actionBtn = `<button class="btn" style="${btnBaseStyle} background:#2ecc71;" onclick="window.Cards.activate('${c.id}')">USAR</button>`;
                    else actionBtn = `<button class="btn" disabled style="${btnBaseStyle} background:#7f8c8d; cursor:not-allowed;" title="Só pode usar antes de rolar o dado">USAR</button>`;
                } else if (c.type === 'global') {
                    if (canUseMove) actionBtn = `<button class="btn" style="${btnBaseStyle} background:#e74c3c;" title="Afeta o mundo todo!" onclick="window.Cards.activate('${c.id}')">GLOBAL</button>`;
                    else actionBtn = `<button class="btn" disabled style="${btnBaseStyle} background:#7f8c8d; cursor:not-allowed;" title="Só pode usar antes de rolar o dado no seu turno">GLOBAL</button>`;
                } else if (c.type === 'auto') {
                    actionBtn = `<button class="btn" disabled style="${btnBaseStyle} background:#8e44ad; cursor:not-allowed;" title="Esta carta ativa automaticamente">AUTO</button>`;
                } else {
                    actionBtn = `<button class="btn" disabled style="${btnBaseStyle} background:#555; cursor:not-allowed;" title="Esta carta só pode ser usada em Batalha">BATTLE</button>`;
                }
            }

            const isProtectedTag = c.isProtected ? `<div style="font-size: 0.7rem; color: #f1c40f; font-weight: bold; margin-top:2px;">🔒 Protegida</div>` : ``;

            if (isMobile) {
                d.style.cssText = `display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; border-left: 5px solid ${borderColor}; width: 100%; box-sizing: border-box; margin-bottom: 2px;`;
                d.innerHTML = `
                    <div style="text-align: left; flex: 1; padding-right: 10px;">
                        <div style="font-weight: bold; color: #fff; font-size: 0.9rem;">${c.icon} ${c.name}</div>
                        <div style="font-size: 0.7rem; color: ${borderColor}; font-weight: bold;">${c.rarity.toUpperCase()} | ${c.type.toUpperCase()}</div>
                        ${isProtectedTag}
                        <div style="font-size: 0.75rem; color: #ccc; margin-top: 3px; line-height: 1.2;">${c.desc}</div>
                    </div>
                    <div style="width: 80px; flex-shrink: 0;">
                        ${actionBtn}
                    </div>
                `;
            } else {
                d.style.cssText = "display: flex; flex-direction: column; align-items: center; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); width: 100%; box-sizing: border-box; position: relative;";
                const protectedBadge = c.isProtected ? `<div style="position: absolute; top: -10px; left: -10px; font-size: 1.5rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8)); z-index: 15;" title="Carta Protegida">🔒</div>` : '';
                
                d.innerHTML = `
                    ${protectedBadge}
                    <div style="position: absolute; top: -5px; right: -5px; background: ${borderColor}; color: #fff; padding: 2px 6px; font-size: 0.7rem; border-radius: 10px; font-weight: bold; border: 1px solid #222; text-shadow: 1px 1px 0 #000; box-shadow: 0 2px 4px rgba(0,0,0,0.5); z-index: 10;">
                        ${c.rarity.toUpperCase()}
                    </div>
                    <img src="/assets/img/Cartas/${c.id}.jpg" alt="${c.name}" title="${c.desc}" style="width: 100%; aspect-ratio: 2.5/3.5; object-fit: fill; border-radius: 6px; border: 3px solid ${borderColor};">
                    <div style="margin-top: 8px; width: 100%;">${actionBtn}</div>
                `;
            }
            list.appendChild(d);
        });

        document.getElementById('board-cards-modal')!.style.display = 'flex';
    }

    static openInventoryModal(pId: number, readOnly: boolean = false) {
        const p = GameState.players[pId];
        const list = document.getElementById('board-inventory-list')!;
        list.innerHTML = '';
        const canUse = (!readOnly && GameState.canAct() && GameState.turn === pId);

        Object.keys(p.items).forEach(key => {
            if (p.items[key] > 0) {
                const item = SHOP_ITEMS.find(i => i.id === key);
                if (item) {
                    const d = document.createElement('div');
                    d.className = 'shop-item';
                    let btnHTML = '';
                    if (canUse && (item.type === 'heal' || item.type === 'revive' || item.type === 'boost' || item.type === 'mega' || item.type === 'hold')) {
                        btnHTML = `<button class="btn btn-mini" style="width:auto;" onclick="window.Game.useItemBoard('${key}', ${pId})">Usar</button>`;
                    }
                    d.innerHTML = `
                        <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:0;">
                            <img src="/assets/img/Itens/${item.icon}" class="item-icon-mini" style="flex-shrink:0;">
                            <div style="display:flex; flex-direction:column; min-width:0;">
                                <span style="font-weight:600;">${item.name} <span style="color:#7f8c8d; font-weight:400;">x${p.items[key]}</span></span>
                                <span style="font-size:0.72em; color:#a0aec0; line-height:1.3; white-space:normal;">${item.desc}</span>
                            </div>
                        </div>
                        ${btnHTML}
                    `;
                    list.appendChild(d);
                }
            }
        });
        document.getElementById('board-inventory-modal')!.style.display = 'flex';
    }

    static openPokedexEntry(targetId: number) {
        this.openPokedex(GameState.turn, targetId);
    }

    static openPokedex(pId: number, filterId: number | null = null) {
        const p = GameState.players[pId];
        const list = document.getElementById('pokedex-list')!;
        list.innerHTML = '';

        if (filterId === null) {
            const searchContainer = document.createElement('div');
            searchContainer.style.cssText = "width: 100%; grid-column: 1 / -1; margin-bottom: 20px;";
            searchContainer.innerHTML = `<input type="text" id="pokedex-search" placeholder="🔍 Buscar Pokémon por nome..." style="width: 100%; padding: 12px 15px; border-radius: 4px; border: 2px solid #8d99ae; font-size: 1rem; box-sizing: border-box; background: #fff; color: #2c3e50; outline: none; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);" onkeyup="window.Game.filterPokedex()">`;
            list.appendChild(searchContainer);
        }

        const colors: any = { "Normal": "#A8A77A", "Fogo": "#EE8130", "Água": "#6390F0", "Elétrico": "#F7D02C", "Grama": "#7AC74C", "Gelo": "#96D9D6", "Lutador": "#C22E28", "Veneno": "#A33EA1", "Terra": "#E2BF65", "Voador": "#A98FF3", "Psíquico": "#F95587", "Inseto": "#A6B91A", "Pedra": "#B6A136", "Fantasma": "#735797", "Dragão": "#6F35FC", "Noturno": "#705746", "Aço": "#B7B7CE", "Fada": "#D685AD" };

        POKEDEX.forEach(mon => {
            if (filterId !== null && mon.id !== filterId) return;

            if (GameState.settings) {
                const getGenById = (id: number) => {
                    if (id >= 10000) return 0;
                    if (id <= 151) return 1;
                    if (id <= 251) return 2;
                    if (id <= 386) return 3;
                    if (id <= 493) return 4;
                    if (id <= 649) return 5;
                    if (id <= 721) return 6;
                    if (id <= 809) return 7;
                    if (id <= 905) return 8;
                    return 9;
                };
                
                const pGen = getGenById(mon.id);
                if (pGen > 0 && !GameState.settings.generations.includes(pGen)) return;
                if (mon.id >= 10000 && !GameState.settings.megas) return;
                if (GameState.settings.legendaries === 'no' && mon.isLegendary) return;
                if (GameState.settings.legendaries === 'only' && !mon.isLegendary) return;
            }

            const dexEntry = p.pokedexData[mon.id] || { seen: 0, caught: 0, defeated: 0 };

            const c1 = colors[mon.type] || "#777";
            let typeHtml = `<span style="background-color:${c1}; color:white; padding:2px 6px; border-radius:4px; font-size:0.6rem; text-shadow:1px 1px 1px rgba(0,0,0,0.5);">${mon.type}</span>`;
            if (mon.secondType) {
                const c2 = colors[mon.secondType] || "#777";
                typeHtml += ` <span style="background-color:${c2}; color:white; padding:2px 6px; border-radius:4px; font-size:0.6rem; text-shadow:1px 1px 1px rgba(0,0,0,0.5);">${mon.secondType}</span>`;
            }

            const weaknesses: { type: string, multi: number }[] = [];
            const resistances: { type: string, multi: number }[] = [];

            for (const atkType in TYPE_CHART) {
                let multiplier = 1;
                if (TYPE_CHART[atkType] && (TYPE_CHART[atkType] as any)[mon.type]) {
                    multiplier *= (TYPE_CHART[atkType] as any)[mon.type];
                }
                if (mon.secondType && TYPE_CHART[atkType] && (TYPE_CHART[atkType] as any)[mon.secondType]) {
                    multiplier *= (TYPE_CHART[atkType] as any)[mon.secondType];
                }

                if (multiplier > 1) weaknesses.push({ type: atkType, multi: multiplier });
                if (multiplier < 1) resistances.push({ type: atkType, multi: multiplier });
            }

            const formatTypeList = (types: { type: string, multi: number }[], label: string, titleColor: string) => {
                if (types.length === 0) return '';
                const badges = types.map(t => {
                    const typeColor = colors[t.type] || "#777";
                    let multiStr = `x${t.multi}`;
                    if (t.multi === 0.5) multiStr = 'x½';
                    else if (t.multi === 0.25) multiStr = 'x¼';

                    return `<span style="background-color:${typeColor}; color:white; padding:2px 5px; border-radius:4px; font-size:0.6rem; text-shadow:1px 1px 1px rgba(0,0,0,0.5); margin-right:3px; display:inline-block; margin-bottom:2px; display: inline-flex; align-items: center; gap: 3px;">
                        ${t.type} <b style="background:rgba(0,0,0,0.3); padding:1px 3px; border-radius:3px; font-size: 0.55rem;">${multiStr}</b>
                    </span>`;
                }).join('');
                return `<div style="margin-top:4px; font-size:0.7rem; color:${titleColor};"><b>${label}:</b><br>${badges}</div>`;
            };

            const d = document.createElement('div');
            d.className = 'dex-card';
            d.setAttribute('data-name', mon.name);

            const isDiscovered = dexEntry.seen > 0 || dexEntry.caught > 0;
            const imgFilter = isDiscovered ? '' : 'filter: brightness(0) opacity(0.4);';
            const displayName = mon.name;

            d.innerHTML = `
                <div style="font-weight: bold; color: #7f8c8d; width: 100%; text-align: left; font-size: 0.8rem;">#${mon.id.toString().padStart(3, '0')}</div>
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${mon.id}.png" style="width: 70px; height: 70px; image-rendering: pixelated; ${imgFilter}">
                <b style="font-size: 1rem; color: #2c3e50;">${displayName}</b>
                <div style="display:flex; gap:5px; margin: 5px 0;">${typeHtml}</div>
                
                <div class="dex-stats-row">
                    <span title="HP Base">❤️ ${mon.hp}</span> 
                    <span title="Ataque Base">⚔️ ${mon.atk}</span> 
                    <span title="Defesa Base">🛡️ ${mon.def}</span> 
                    <span title="Velocidade Base">💨 ${mon.spd}</span>
                </div>
                
                <div style="margin-top:5px; text-align:left; width:100%; padding:0 5px;">
                    ${formatTypeList(weaknesses, 'Fraquezas', '#c0392b')}
                    ${formatTypeList(resistances, 'Resistências', '#27ae60')}
                </div>

                <div style="font-size: 0.75rem; color: #8e44ad; margin-top: 6px; text-align: center; min-height: 15px;">
                    ${mon.nextForm ? `Evolui: <b>${mon.nextForm}</b> (Lv.${mon.evoTrigger})` : (MAPA_MEGAS[mon.id] ? '<b>Estágio Final <span style="color:#e67e22;">- Mega Evolui</span></b>' : '<b>Estágio Final</b>')}
                </div>

                <div class="dex-track-row">
                    <span title="Vistos" style="color: #3498db;">👁️ ${dexEntry.seen}</span>
                    <span title="Derrotados" style="color: #e74c3c;">💀 ${dexEntry.defeated}</span>
                    <span title="Capturados" style="color: #2ecc71;">🦅 ${dexEntry.caught}</span>
                </div>
            `;
            list.appendChild(d);
        });

        document.getElementById('pokedex-modal')!.style.display = 'flex';
    }

    static filterPokedex() {
        const input = document.getElementById('pokedex-search') as HTMLInputElement;
        if (!input) return;

        const filter = input.value.toUpperCase();
        const cards = document.getElementsByClassName('dex-card');

        for (let i = 0; i < cards.length; i++) {
            const card = cards[i] as HTMLElement;
            const name = card.getAttribute('data-name');

            if (name && name.toUpperCase().indexOf(filter) > -1) {
                card.style.display = "";
            } else {
                card.style.display = "none";
            }
        }
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

        let MAPA_MEGAS: any = null;
        if (item.type === 'mega') {
            const module = await import('../../constants/mapaMegas');
            MAPA_MEGAS = module.MAPA_MEGAS;
        }

        p.team.forEach((mon, idx) => {
            const div = document.createElement('div');

            const isShiny = mon.isShiny;
            const detailedHTML = `
                <div style="display: flex; align-items: center; gap: 12px; text-align: left; width: 100%; justify-content: flex-start; border: 1px solid ${isShiny ? '#f1c40f' : '#555'}; background: ${isShiny ? 'rgba(241, 196, 15, 0.1)' : 'transparent'}; padding: 8px; border-radius: 6px; box-sizing: border-box;">
                    <img src="${mon.getSprite()}" width="50" style="object-fit:contain; filter: drop-shadow(0 0 3px ${isShiny ? '#f1c40f' : 'transparent'});">
                    <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
                        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                            <b style="font-size:1.1rem; color:${isShiny ? '#f1c40f' : '#fff'};">${mon.name} ${isShiny ? '✨' : ''}</b>
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

        p.team.forEach((currP: Pokemon, idx: number) => {
            const div = document.createElement('div');
            div.className = 'swap-item';

            div.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px; width: 100%; padding: 5px;">
                    <img src="${currP.getSprite()}" width="50" style="filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.2));">
                    <div style="text-align: left; line-height: 1.4; flex-grow: 1;">
                        <b style="font-size: 1.1rem; color: #2c3e50;">${currP.name}</b> 
                        <small style="color: #e67e22; font-weight: bold;">Lv.${currP.level}</small><br>
                        
                        <div style="font-size: 0.85rem; color: #7f8c8d; margin-top: 4px; display: flex; gap: 10px;">
                            <span>❤️ <b>${currP.maxHp}</b></span>
                            <span>⚔️ <b>${currP.atk}</b></span>
                            <span>🛡️ <b>${currP.def}</b></span>
                            <span>💨 <b>${currP.speed}</b></span>
                        </div>
                    </div>
                </div>
            `;

            div.onclick = () => GameEvents.executeSwap(idx, newMon);
            list.appendChild(div);
        });

        const divNew = document.createElement('div');
        divNew.className = 'swap-item new-mon';

        divNew.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px; width: 100%; padding: 5px; background-color: #fcf3f2; border: 1px dashed #e74c3c; border-radius: 8px; margin-top: 10px;">
                <img src="${newMon.getSprite()}" width="50" style="filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.2));">
                <div style="text-align: left; line-height: 1.4; flex-grow: 1;">
                    <b style="font-size: 1.1rem; color: #e74c3c;">${newMon.name} (NOVO)</b> 
                    <small style="color: #e67e22; font-weight: bold;">Lv.${newMon.level}</small><br>
                    
                    <div style="font-size: 0.85rem; color: #7f8c8d; margin-top: 4px; display: flex; gap: 10px;">
                        <span>❤️ <b>${newMon.maxHp}</b></span>
                        <span>⚔️ <b>${newMon.atk}</b></span>
                        <span>🛡️ <b>${newMon.def}</b></span>
                        <span>💨 <b>${newMon.speed}</b></span>
                    </div>
                    <small style="color: #c0392b; font-weight: bold; display: block; margin-top: 5px;">❌ Clique aqui para soltar e não capturar este</small>
                </div>
            </div>
        `;

        divNew.onclick = () => GameEvents.executeSwap(-1, newMon);
        list.appendChild(divNew);

        modal.style.display = 'block';
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
                        GameEvents.rescueFromLixeira(idx);
                        document.getElementById('lixeira-modal')!.style.display = 'none';
                    };
                }
                list.appendChild(card);
            });
        }

        document.getElementById('lixeira-modal')!.style.display = 'flex';
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

            const rankEmoji = rank === 0 ? '🔴' : rank === 1 ? '🟠' : rank === 2 ? '🟡' : '⚪';
            const barColor = rank === 0 ? '#e74c3c' : rank === 1 ? '#e67e22' : '#f1c40f';

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

            const effectTagsHTML = Object.entries(effectsRecord).map(([name, count]) => {
                const color = getRarityColor(name, '#555');
                return `<span style="background:${color}; color:white; font-size:0.68rem; padding:2px 7px; border-radius:12px; display:inline-flex; align-items:center; gap:3px;">${name} <b style="background:rgba(0,0,0,0.3); padding:0 4px; border-radius:8px;">${count}x</b></span>`;
            }).join('');

            const defendTagsHTML = Object.entries(defendedRecord).map(([name, count]) => {
                const color = getRarityColor(name, '#27ae60');
                return `<span style="background:${color}; color:white; font-size:0.68rem; padding:2px 7px; border-radius:12px; display:inline-flex; align-items:center; gap:3px;">${name} <b style="background:rgba(0,0,0,0.3); padding:0 4px; border-radius:8px;">${count}x</b></span>`;
            }).join('');

            const row = document.createElement('div');
            row.style.cssText = `background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 12px 15px; text-align: left;`;
            row.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                    <img src="${p.avatar}" style="width: 36px; height: 36px; border-radius: 50%; border: 2px solid ${barColor};">
                    <div style="flex: 1;">
                        <div style="font-weight: bold; font-size: 1rem; color: #fff;">${rankEmoji} ${p.name}</div>
                        <div style="font-size: 0.75rem; color: #aaa;">Sofrimento: <b style="color: ${barColor}">${totalScore}</b></div>
                    </div>
                    <div style="font-size: 0.85rem; font-weight: bold; color: #dda0dd;" title="Cartas ofensivas usadas">${stats.cardsUsed} 🃏 ofensivas</div>
                </div>
                <div style="background: rgba(0,0,0,0.3); border-radius: 20px; height: 8px; overflow: hidden; margin-bottom: 10px;">
                    <div style="background: ${barColor}; width: ${pct}%; height: 100%; border-radius: 20px; transition: width 0.5s;"></div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 6px; font-size: 0.78rem; text-align: center; margin-bottom: 8px;">
                    <div style="background: rgba(231,76,60,0.3); border-radius: 6px; padding: 6px 4px;">
                        <div style="font-size: 1rem;">🗡️</div>
                        <div style="color: #ff8a80; font-weight: bold;">${stats.cardsSuffered}</div>
                        <div style="color: #888; font-size: 0.68rem;">Sofridas</div>
                    </div>
                    <div style="background: rgba(243,156,18,0.3); border-radius: 6px; padding: 6px 4px;">
                        <div style="font-size: 1rem;">⚡</div>
                        <div style="color: #ffd54f; font-weight: bold;">${totalEffects}</div>
                        <div style="color: #888; font-size: 0.68rem;">Efeitos</div>
                    </div>
                    <div style="background: rgba(39,174,96,0.3); border-radius: 6px; padding: 6px 4px;">
                        <div style="font-size: 1rem;">🛡️</div>
                        <div style="color: #2ecc71; font-weight: bold;">${totalDefended}</div>
                        <div style="color: #888; font-size: 0.68rem;">Defendidas</div>
                    </div>
                    <div style="background: rgba(231,76,60,0.25); border-radius: 6px; padding: 6px 4px;">
                        <div style="font-size: 1rem;">⏳</div>
                        <div style="color: #ff5252; font-weight: bold;">${stats.turnsLost}</div>
                        <div style="color: #888; font-size: 0.68rem;">Turnos Perdidos</div>
                    </div>
                </div>
                ${totalEffects > 0 ? `<div style="margin-top:4px; margin-bottom:6px;"><div style="color:#888; font-size:0.7rem; margin-bottom:5px;">💥 Efeitos recebidos:</div><div style="display:flex; flex-wrap:wrap; gap:5px;">${effectTagsHTML}</div></div>` : ''}
                ${totalDefended > 0 ? `<div style="margin-top:4px;"><div style="color:#888; font-size:0.7rem; margin-bottom:5px;">🛡️ Defesas usadas:</div><div style="display:flex; flex-wrap:wrap; gap:5px;">${defendTagsHTML}</div></div>` : ''}
                ${totalEffects === 0 && totalDefended === 0 ? `<div style="color:#555; font-size:0.72rem; text-align:center; padding-top:4px;">Nenhum efeito ou defesa registrado ainda 😌</div>` : ''}
            `;
            list.appendChild(row);
        });

        document.getElementById('player-stats-modal')!.style.display = 'flex';
    }

    static renderChampionBanner() {
        const champion = GameState.globalChampion;
        let banner = document.getElementById('champion-global-banner');
        if (!banner) return;

        if (!champion || !champion.team || champion.team.length === 0) {
            banner.style.display = 'none';
            return;
        }

        banner.style.cssText = `
            background: linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(44,62,80,0.9) 100%);
            border: 2px solid #f1c40f;
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 15px;
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5), 0 0 8px rgba(241, 196, 15, 0.4);
            cursor: pointer;
            transition: transform 0.2s;
            width: 100%;
            box-sizing: border-box;
        `;

        banner.onmouseover = () => banner!.style.transform = 'scale(1.03)';
        banner.onmouseout = () => banner!.style.transform = 'scale(1)';
        banner.onclick = () => {
            if (champion && champion.team) {
                document.getElementById('champion-name-display')!.innerText = champion.name || 'Desconhecido';

                const listContainer = document.getElementById('champion-team-list')!;
                listContainer.innerHTML = '';

                champion.team.forEach((p: any, index: number) => {
                    const isShiny = p.isShiny;
                    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${isShiny ? 'shiny/' : ''}${p.id}.png`;

                    const colors: any = { "Normal": "#A8A77A", "Fogo": "#EE8130", "Água": "#6390F0", "Elétrico": "#F7D02C", "Grama": "#7AC74C", "Gelo": "#96D9D6", "Lutador": "#C22E28", "Veneno": "#A33EA1", "Terra": "#E2BF65", "Voador": "#A98FF3", "Psíquico": "#F95587", "Inseto": "#A6B91A", "Pedra": "#B6A136", "Fantasma": "#735797", "Dragão": "#6F35FC", "Noturno": "#705746", "Aço": "#B7B7CE", "Fada": "#D685AD" };
                    const bgColor = colors[p.type] || '#555';

                    const card = document.createElement('div');
                    card.style.cssText = `
                        background: linear-gradient(180deg, ${bgColor}44 0%, rgba(0,0,0,0.6) 100%);
                        border: 1px solid ${isShiny ? '#f1c40f' : bgColor};
                        border-radius: 8px;
                        padding: 8px;
                        text-align: center;
                        cursor: pointer;
                        transition: transform 0.2s;
                        width: 140px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.5);
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        position: relative;
                    `;

                    card.onmouseover = () => card.style.transform = 'scale(1.05)';
                    card.onmouseout = () => card.style.transform = 'scale(1)';
                    card.onclick = () => {
                        this.openPokemonDetail(-1, index, champion);
                    };

                    let typesHtml = `<span style="background:${bgColor}; color:white; font-size:0.65rem; padding:2px 5px; border-radius:4px; border:1px solid rgba(255,255,255,0.3);">${p.type}</span>`;
                    if (p.secondType) {
                        const bg2 = colors[p.secondType] || '#555';
                        typesHtml += ` <span style="background:${bg2}; color:white; font-size:0.65rem; padding:2px 5px; border-radius:4px; border:1px solid rgba(255,255,255,0.3);">${p.secondType}</span>`;
                    }

                    const hId = p.heldItem;
                    const hData = hId ? SHOP_ITEMS.find(i => i.id === hId) : null;
                    const iconsHtml = [
                        p.megaStone ? '<span title="Mega Pedra Equipada" style="filter: drop-shadow(0 0 2px #3498db);">💎</span>' : '',
                        isShiny ? '<span title="Shiny" style="filter: drop-shadow(0 0 2px #f1c40f);">✨</span>' : '',
                        (hData && !p.megaStone) ? `<img src="/assets/img/Itens/${hData.icon}" style="width:20px; height:20px; filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));" title="Item: ${hData.name}">` : (hId && !p.megaStone ? '🎒' : '')
                    ].filter(Boolean).join(' ');

                    card.innerHTML = `
                        <div style="position:absolute; top:6px; left:6px; font-size: 0.65rem; color: #fff; background: rgba(0,0,0,0.6); padding:2px 5px; border-radius:4px; font-weight:bold;">Lv.${p.level}</div>
                        <div style="position:absolute; top:4px; right:6px; font-size: 0.85rem; display:flex; gap:4px;">${iconsHtml}</div>
                        
                        <img src="${spriteUrl}" style="width: 75px; height: 75px; object-fit: contain; margin-top: 15px; ${isShiny ? 'filter: drop-shadow(0 0 5px #f1c40f);' : ''}">
                        
                        <div style="font-size: 0.85rem; font-weight: bold; margin-top: 4px; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: white;">${p.name}</div>
                        <div style="margin-top:6px; margin-bottom: 8px; display:flex; gap:4px; justify-content:center;">${typesHtml}</div>
                        
                        <div style="width: 100%; background: rgba(0,0,0,0.5); border-radius: 6px; padding: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.7rem; color: #eee; box-sizing:border-box;">
                            <div style="display:flex; justify-content:space-between; align-items:center;"><span>❤️</span> <b>${p.maxHp}</b></div>
                            <div style="display:flex; justify-content:space-between; align-items:center;"><span>⚔️</span> <b>${p.atk}</b></div>
                            <div style="display:flex; justify-content:space-between; align-items:center;"><span>🛡️</span> <b>${p.def}</b></div>
                            <div style="display:flex; justify-content:space-between; align-items:center;"><span>💨</span> <b>${p.speed}</b></div>
                        </div>
                        ${p.masteryBonus > 0 ? `<div style="margin-top:6px; font-size:0.65rem; color:#f1c40f; font-weight:bold; background: rgba(0,0,0,0.4); padding: 2px 4px; border-radius: 4px;">🔥 Maestria: +${p.masteryBonus}%</div>` : ''}
                    `;

                    listContainer.appendChild(card);
                });

                document.getElementById('champion-team-modal')!.style.display = 'flex';
            }
        };

        const leadMon = champion.team[0];
        const avatarStr = champion.avatar || 'Red.jpg';
        const avatarSrc = avatarStr.includes('/') ? avatarStr : `/assets/img/Treinadores/${avatarStr}`;
        const leadSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${leadMon.isShiny ? 'shiny/' : ''}${leadMon.id}.png`;

        banner.innerHTML = `
            <div style="text-align: left; text-shadow: 1px 1px 2px black;">
                <div style="color: #f1c40f; font-weight: 900; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px;">Rei da Liga</div>
                <div style="font-size: 1.1rem; font-weight: bold; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${champion.name || 'Desconhecido'}</div>
            </div>
            <div style="position: relative; width: 50px; height: 50px; flex-shrink: 0;">
                <img src="${avatarSrc}" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid #ecf0f1; object-fit: cover;">
                <img src="${leadSprite}" style="position: absolute; bottom: -10px; left: -15px; width: 45px; filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.8));">
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

        const nameEl = document.getElementById('gym-detail-name')!;
        const typeEl = document.getElementById('gym-detail-type')!;
        const badgeEl = document.getElementById('gym-detail-badge') as HTMLImageElement;
        const leaderImgEl = document.getElementById('gym-detail-leader-img') as HTMLImageElement;
        const leaderNameEl = document.getElementById('gym-detail-leader-name')!;
        const infoEl = document.getElementById('gym-detail-info')!;
        const teamListEl = document.getElementById('gym-detail-team-list')!;

        nameEl.innerText = `Ginásio de ${gymData.leaderName}`;
        typeEl.innerText = `Tipo do Ginásio: ${gymData.type.join(' / ')}`;
        badgeEl.src = `/assets/img/Insignias/${gymData.badgeImg}`;
        leaderImgEl.src = `/assets/img/LideresGym/${gymData.leaderImg}`;
        leaderNameEl.innerText = gymData.leaderName;

        infoEl.innerHTML = `
            Este líder desafia os jogadores com Pokémons do tipo <b>${gymData.type.join(', ')}</b>.<br>
            🏅 <b>Recompensa:</b> Libera a <b>Insígnia ${gid}</b> no painel de insígnias ao ser derrotado.<br>
            ⚔️ <b>Dificuldade Atual:</b> Você enfrentará <b>${teamSize} Pokémons</b> aleatórios deste time, no nível <b>Lv.${gymLevel}</b>!
        `;

        teamListEl.innerHTML = '';

        const typeColors: any = { "Normal": "#A8A77A", "Fogo": "#EE8130", "Água": "#6390F0", "Elétrico": "#F7D02C", "Grama": "#7AC74C", "Gelo": "#96D9D6", "Lutador": "#C22E28", "Veneno": "#A33EA1", "Terra": "#E2BF65", "Voador": "#A98FF3", "Psíquico": "#F95587", "Inseto": "#A6B91A", "Pedra": "#B6A136", "Fantasma": "#735797", "Dragão": "#6F35FC", "Noturno": "#705746", "Aço": "#B7B7CE", "Fada": "#D685AD" };

        const PkmClass = (window as any).Pokemon || Pokemon;

        rosterIds.forEach((id: number) => {
            const mon = new PkmClass(id, gymLevel, false);
            const bgColor = typeColors[mon.type] || '#555';

            const card = document.createElement('div');
            card.style.cssText = `
                background: linear-gradient(180deg, ${bgColor}33 0%, rgba(0,0,0,0.6) 100%);
                border: 1px solid ${bgColor};
                border-radius: 10px;
                padding: 10px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                position: relative;
            `;

            const typeBadges = mon.getTypeBadgesHTML ? mon.getTypeBadgesHTML() : `<span style="background:${bgColor}; color:#fff; padding:2px 6px; border-radius:4px; font-size:0.75rem;">${mon.type}</span>`;

            card.innerHTML = `
                <img src="${mon.getSprite()}" style="width: 65px; height: 65px; object-fit: contain; filter: drop-shadow(0 0 4px rgba(255,255,255,0.15));">
                <div style="font-weight: bold; color: #fff; font-size: 0.9rem; text-shadow: 1px 1px 2px #000; text-align:center;">${mon.name}</div>
                <div style="display:flex; justify-content:center; gap:4px; margin-top:2px;">${typeBadges}</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; width: 100%; margin-top: 6px; font-size: 0.75rem; color: #cbd5e0; background: rgba(0,0,0,0.3); padding: 4px; border-radius: 4px; text-align:center;">
                    <div title="Ataque">⚔️ ${mon.atk}</div>
                    <div title="Defesa">🛡️ ${mon.def}</div>
                </div>
            `;
            teamListEl.appendChild(card);
        });

        document.getElementById('gym-detail-modal')!.style.display = 'flex';
    }
}