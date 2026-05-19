import { BattleCore } from './BattleCore';
import { Pokemon } from '../../models/Pokemon';
import { Network } from '../../systems/Network';
import { GYM_DATA } from '../../constants/gyms';
import { SHOP_ITEMS, CARD_RARITIES } from '../../constants';
import { GameState } from '../game/GameState';

export class BattleUI {
    static currentBattleId: string | null = null;
    static currentBattleLogs: string[] = [];

    static openSelectionModal(title: string) {
        const modal = document.getElementById('pkmn-select-modal')!;
        const list = document.getElementById('pkmn-select-list')!;

        document.getElementById('select-title')!.innerHTML = title;
        list.innerHTML = '';

        BattleCore.plyTeamList.forEach((mon) => {
            const div = document.createElement('div');
            div.className = `mon-select-item ${mon.isFainted() ? 'disabled' : ''}`;
            
            const isShiny = mon.isShiny;
            div.style.cssText = `
                display: flex; 
                align-items: center; 
                gap: 12px; 
                text-align: left; 
                width: 100%; 
                justify-content: flex-start;
                border: 1px solid ${isShiny ? '#f1c40f' : '#555'};
                background: ${isShiny ? 'rgba(241, 196, 15, 0.1)' : 'transparent'};
                padding: 8px;
                border-radius: 6px;
                box-sizing: border-box;
            `;

            div.innerHTML = `
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
            `;
            if (!mon.isFainted()) div.onclick = () => { modal.style.display = 'none'; BattleCore.startRound(mon); };
            list.appendChild(div);
        });
        modal.style.display = 'flex';
    }

    static updateButtons() {
        const NetworkObj = (window as any).Network || Network;
        const btns = document.querySelectorAll('.battle-actions button');
        const isMyBattle = NetworkObj.isOnline ? (BattleCore.player && BattleCore.player.id === NetworkObj.myPlayerId) : true;
        const canAct = BattleCore.isPlayerTurn && !BattleCore.processingAction && isMyBattle;

        btns.forEach((btn: Element) => {
            const htmlBtn = btn as HTMLButtonElement;
            if (htmlBtn.id === 'btn-auto-pve') {
                htmlBtn.disabled = !isMyBattle;
            } else {
                if (BattleCore.isAutoPvE) htmlBtn.disabled = true;
                else htmlBtn.disabled = !canAct;
            }
        });

        const runBtn = document.getElementById('btn-run') as HTMLButtonElement;
        const autoBtn = document.getElementById('btn-auto-pve') as HTMLButtonElement;

        if (BattleCore.isChampion) {
            if (runBtn) runBtn.disabled = true;
            if (autoBtn) autoBtn.style.display = 'block';
        } else if (BattleCore.isPvP) {
            if (runBtn) runBtn.disabled = true;
            if (autoBtn) autoBtn.style.display = 'none';
        } else if (BattleCore.isGym) {
            if (runBtn) runBtn.disabled = true;
            if (autoBtn) autoBtn.style.display = 'block';
        } else {
            if (autoBtn) autoBtn.style.display = 'block';
        }
    }

    static renderBattleScreen() {
        const NetworkObj = (window as any).Network || Network;
        document.getElementById('pkmn-select-modal')!.style.display = 'none';
        document.getElementById('battle-modal')!.style.display = 'flex';
        document.getElementById('battle-log-history')!.innerHTML = '';

        const enemyImg = document.getElementById('opp-img') as HTMLElement;
        if (enemyImg) {
            enemyImg.classList.remove('mon-caught-hidden');
            enemyImg.style.opacity = '1';
            enemyImg.style.transform = 'none';
        }

        const titleEl = document.getElementById('battle-title')!;
        if (NetworkObj.isOnline && BattleCore.player && BattleCore.player.id !== NetworkObj.myPlayerId) {
            let oppName = "Selvagem";
            if (BattleCore.isPvP && BattleCore.enemyPlayer) oppName = BattleCore.enemyPlayer.name;
            else if (BattleCore.isGym) oppName = "Líder de Ginásio";
            else if (BattleCore.isNPC && (BattleCore.opponent as any)._npcName) oppName = (BattleCore.opponent as any)._npcName;
            titleEl.innerHTML = `
                <div style="display:flex; align-items:center; justify-content:space-between; width:100%; gap:10px;">
                    <span>👁️ <span style="color:#ffd700;">Assistindo ${BattleCore.player.name} contra ${oppName}</span></span>
                    <button id="btn-close-spectator"
                        onclick="document.getElementById('battle-modal').style.display='none'"
                        style="background:rgba(231,76,60,0.85); border:none; border-radius:6px; color:#fff; padding:4px 12px; font-size:0.85rem; cursor:pointer; font-weight:bold; white-space:nowrap; flex-shrink:0;"
                        title="Fechar visualização e voltar ao tabuleiro">
                        ✕ Fechar Visualização
                    </button>
                </div>`;
        } else {
            titleEl.innerText = BattleCore.battleTitle;
        }

        const actionsContainer = document.querySelector('.battle-actions') as HTMLElement;
        if (actionsContainer) {
            if (BattleCore.isPvP) {
                Array.from(actionsContainer.children).forEach((c: any) => c.style.display = 'none');
                let autoBtn = document.getElementById('btn-auto-pvp');
                if (!autoBtn) {
                    autoBtn = document.createElement('button');
                    autoBtn.id = 'btn-auto-pvp';
                    autoBtn.className = 'btn';
                    autoBtn.style.cssText = 'grid-column: span 2; background: #e74c3c; font-size: 1.2rem; padding: 15px;';
                    autoBtn.innerHTML = '⚔️ INICIAR BATALHA AUTOMÁTICA';
                    autoBtn.onclick = () => { autoBtn!.style.display = 'none'; BattleCore.startAutoPvP(); };
                    actionsContainer.appendChild(autoBtn);
                }
                autoBtn.style.display = 'block';

                const isMyBattle = NetworkObj.isOnline ? (BattleCore.player && BattleCore.player.id === NetworkObj.myPlayerId) : true;
                if (!isMyBattle) {
                    autoBtn.innerText = 'Aguardando oponente iniciar...';
                    (autoBtn as HTMLButtonElement).disabled = true;
                }
            } else {
                Array.from(actionsContainer.children).forEach((c: any) => {
                    if (c.id !== 'btn-auto-pvp') c.style.display = 'block';
                    else c.style.display = 'none';
                });
            }
        }

        this.updateButtons();
        this.updateUI();

        const scene = document.querySelector('.battle-scene') as HTMLElement;
        let bgImage = 'Default.jpg';
        switch (BattleCore.currentTerrain) {
            case 1: bgImage = 'BatalhaTerrenoGrama.png'; break;
            case 2: bgImage = 'BatalhaTerrenoAgua.png'; break;
            case 3: bgImage = 'BatalhaTerrenoAreia.png'; break;
            case 5: bgImage = 'BatalhaTerrenoGym.png'; break;
            default: bgImage = 'BatalhaTerrenoGrama.png'; break;
        }
        scene.style.backgroundImage = `url('/assets/img/Background/${bgImage}')`;
        scene.style.backgroundSize = 'cover';
        scene.style.backgroundPosition = 'center';
    }

    static getHpColor(current: number, max: number) {
        const pct = (current / max) * 100;
        if (pct >= 60) return 'hp-green';
        if (pct >= 15) return 'hp-yellow';
        return 'hp-red';
    }

    static updateUI() {
        if (!BattleCore.activeMon || !BattleCore.opponent || !BattleCore.player) return;

        document.getElementById('ply-name')!.innerText = BattleCore.activeMon.name;
        const plyTypesEl = document.getElementById('ply-types');
        if (plyTypesEl && typeof BattleCore.activeMon.getTypeBadgesHTML === 'function') {
            plyTypesEl.innerHTML = BattleCore.activeMon.getTypeBadgesHTML('flex-start');
        }

        const plyXpEl = document.getElementById('ply-xp');
        if (plyXpEl) plyXpEl.style.width = `${(BattleCore.activeMon.currentXp / BattleCore.activeMon.maxXp) * 100}%`;

        document.getElementById('ply-lvl')!.innerText = `Lv.${BattleCore.activeMon.level}`;
        (document.getElementById('ply-img') as HTMLImageElement).src = BattleCore.activeMon.getSprite();

        const plyPct = (BattleCore.activeMon.currentHp / BattleCore.activeMon.maxHp) * 100;
        const plyBar = document.getElementById('ply-hp')!;
        plyBar.style.width = plyPct + "%";
        plyBar.className = `hp-fill ${this.getHpColor(BattleCore.activeMon.currentHp, BattleCore.activeMon.maxHp)}`;
        document.getElementById('ply-hp-text')!.innerText = `${BattleCore.activeMon.currentHp}/${BattleCore.activeMon.maxHp}`;
        (document.getElementById('ply-trainer-img') as HTMLImageElement).src = BattleCore.player.avatar;
        document.getElementById('ply-shiny-tag')!.style.display = BattleCore.activeMon.isShiny ? 'inline-block' : 'none';
        document.getElementById('ply-stats')!.innerHTML = `<span>⚔️${BattleCore.activeMon.atk}</span> <span>🛡️${BattleCore.activeMon.def}</span> <span>💨${BattleCore.activeMon.speed}</span>`;

        // Item segurado - jogador
        const plyHeldId = (BattleCore.activeMon as any).heldItem;
        const plyHeldEl = document.getElementById('ply-held-item');
        if (plyHeldEl) {
            if (plyHeldId) {
                const hData = SHOP_ITEMS.find(i => i.id === plyHeldId);
                plyHeldEl.innerHTML = hData
                    ? `<img src="/assets/img/Itens/${hData.icon}" style="width:14px;height:14px;vertical-align:middle;"> <span>${hData.name}</span>`
                    : '';
                plyHeldEl.style.display = 'flex';
            } else {
                plyHeldEl.innerHTML = '';
                plyHeldEl.style.display = 'none';
            }
        }

        document.getElementById('opp-name')!.innerText = BattleCore.opponent.name;
        document.getElementById('opp-lvl')!.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center;">
                <span>Lv.${BattleCore.opponent.level}</span>
                <button class="btn btn-mini" style="font-size:0.7rem; padding:1px 5px; margin-left:6px; background-color:#3498db; border:none; border-radius:4px; color:white; cursor:pointer;" onclick="window.Game.openPokedexEntry(${BattleCore.opponent.id})" title="Ver na Pokédex">📖</button>
            </div>
        `;

        const oppTypesEl = document.getElementById('opp-types');
        if (oppTypesEl && typeof BattleCore.opponent.getTypeBadgesHTML === 'function') {
            oppTypesEl.innerHTML = BattleCore.opponent.getTypeBadgesHTML('flex-start');
        }

        (document.getElementById('opp-img') as HTMLImageElement).src = BattleCore.opponent.getSprite();
        const oppPct = (BattleCore.opponent.currentHp / BattleCore.opponent.maxHp) * 100;
        const oppBar = document.getElementById('opp-hp')!;
        oppBar.style.width = oppPct + "%";
        oppBar.className = `hp-fill ${this.getHpColor(BattleCore.opponent.currentHp, BattleCore.opponent.maxHp)}`;
        document.getElementById('opp-hp-text')!.innerText = `${BattleCore.opponent.currentHp}/${BattleCore.opponent.maxHp}`;
        document.getElementById('opp-shiny-tag')!.style.display = BattleCore.opponent.isShiny ? 'inline-block' : 'none';
        document.getElementById('opp-stats')!.innerHTML = `<span>⚔️${BattleCore.opponent.atk}</span> <span>🛡️${BattleCore.opponent.def}</span> <span>💨${BattleCore.opponent.speed}</span>`;

        // Item segurado - oponente
        const oppHeldId = (BattleCore.opponent as any).heldItem;
        const oppHeldEl = document.getElementById('opp-held-item');
        if (oppHeldEl) {
            if (oppHeldId) {
                const hData = SHOP_ITEMS.find(i => i.id === oppHeldId);
                oppHeldEl.innerHTML = hData
                    ? `<img src="/assets/img/Itens/${hData.icon}" style="width:14px;height:14px;vertical-align:middle;"> <span>${hData.name}</span>`
                    : '';
                oppHeldEl.style.display = 'flex';
            } else {
                oppHeldEl.innerHTML = '';
                oppHeldEl.style.display = 'none';
            }
        }

        const oppTrainer = document.getElementById('opp-trainer-img') as HTMLImageElement;
        if (BattleCore.isPvP && BattleCore.enemyPlayer) {
            oppTrainer.src = BattleCore.enemyPlayer.avatar;
            oppTrainer.style.display = 'block';
        }
        else if (BattleCore.isGym) {
            const Game = (window as any).Game;
            const actualGymId = Game.activeGyms ? Game.activeGyms[BattleCore.gymId - 1] : BattleCore.gymId;
            const gData = GYM_DATA.find(g => g.id === actualGymId);
            if (gData) oppTrainer.src = `/assets/img/LideresGym/${gData.leaderImg}`;
            oppTrainer.style.display = 'block';
        }
        else if (BattleCore.isNPC) {
            const npcImg = (BattleCore.opponent as any)._npcImage;
            if (npcImg) {
                oppTrainer.src = npcImg;
                oppTrainer.style.display = 'block';
            } else {
                oppTrainer.src = '/assets/img/Treinadores/Red.jpg'; oppTrainer.style.display = 'block';
            }
        }
        else {
            oppTrainer.style.display = 'none';
        }

        if (!BattleCore.isNPC && !BattleCore.isGym && !BattleCore.isPvP) {
            document.getElementById('ply-team-indicator')!.innerHTML = '';
            document.getElementById('opp-team-indicator')!.innerHTML = '';
        } else {
            this.renderTeamIcons('ply-team-indicator', BattleCore.plyTeamList);
            this.renderTeamIcons('opp-team-indicator', BattleCore.oppTeamList);
        }
    }

    static renderTeamIcons(elId: string, list: Pokemon[]) {
        document.getElementById(elId)!.innerHTML = list.map(p => `<div class="ball-icon ${p.isFainted() ? 'lost' : ''}"></div>`).join('');
    }

    static viewTeam() {
        const Game = (window as any).Game;
        const player = Game.getCurrentPlayer();
        const modal = document.getElementById('team-view-modal')!;
        const listContainer = document.getElementById('team-view-list')!;
        listContainer.innerHTML = '';

        player.team.forEach((p: any) => {
            const isShiny = p.isShiny;
            const spriteUrl = p.getSprite();
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

            const megaIcon = p.megaStone ? `<img src="/assets/img/megaStone.png" style="width:16px; position:absolute; top:5px; right:5px;" title="Mega Evoluído!">` : '';
            const vinculoIcon = p.vinculoSupremo ? `<span style="font-size:14px; position:absolute; top:5px; left:5px;" title="Vínculo Supremo">🤝</span>` : '';

            card.innerHTML = `
                ${vinculoIcon}
                ${megaIcon}
                <div style="font-size: 0.8rem; font-weight: bold; color: #fff; background: rgba(0,0,0,0.5); padding: 2px 5px; border-radius: 4px; margin-bottom: 5px;">Lv.${p.level}</div>
                <img src="${spriteUrl}" style="width: 70px; height: 70px; object-fit: contain; filter: drop-shadow(0 0 5px ${isShiny ? '#f1c40f' : 'transparent'});">
                <div style="font-weight: bold; color: #fff; margin-top: 5px; font-size: 0.9rem; text-shadow: 1px 1px 2px #000;">${p.name}</div>
                <div style="color: ${isShiny ? '#f1c40f' : '#ccc'}; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 3px; margin-top: 3px;">
                    ${isShiny ? '✨ Shiny' : p.type}
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; width: 100%; margin-top: 8px; font-size: 0.75rem; color: #ecf0f1; background: rgba(0,0,0,0.4); padding: 5px; border-radius: 4px;">
                    <div title="HP Atual / Máx">❤️ ${p.currentHp}/${p.maxHp}</div>
                    <div title="Ataque">⚔️ ${p.atk}</div>
                    <div title="Defesa">🛡️ ${p.def}</div>
                    <div title="Velocidade">💨 ${p.speed}</div>
                </div>
            `;
            listContainer.appendChild(card);
        });

        modal.style.display = 'flex';
    }

    static openBag() {
        if (!BattleCore.isPlayerTurn || BattleCore.processingAction) return;

        if (BattleCore.isGym && BattleCore.player!.effects.curse) {
            const Game = (window as any).Game;
            Game.showGlobalAlert("😈 Sua mochila foi selada pela Maldição! Você não pode usar itens nesta Batalha de Ginásio!", BattleCore.player!.name, true, false);
            return;
        }

        const isMegaOrMew = (!BattleCore.isPvP && BattleCore.activeMon && ((BattleCore.activeMon as any).isTemp || (BattleCore.activeMon as any).isMegaEvolution));
        const list = document.getElementById('battle-bag-list')!;
        list.innerHTML = '';

        Object.keys(BattleCore.player!.items).forEach(key => {
            if (BattleCore.player!.items[key] > 0) {
                const item = SHOP_ITEMS.find(i => i.id === key);
                if (item) {
                    if (isMegaOrMew && item.type !== 'capture') return;
                    const btn = document.createElement('button');
                    btn.className = 'btn';
                    btn.innerHTML = `<img src="/assets/img/Itens/${item.icon}" class="item-icon-mini"> ${item.name} x${BattleCore.player!.items[key]}`;
                    btn.onclick = () => BattleCore.useItem(key, item);
                    list.appendChild(btn);
                }
            }
        });

        if (list.innerHTML === '') list.innerHTML = "<em>Nenhum item compatível no momento...</em>";
        document.getElementById('battle-bag')!.style.display = 'block';
    }

    static openCardSelection() {
        const Game = (window as any).Game;

        if (BattleCore.isGym && BattleCore.player!.effects.curse) {
            Game.showGlobalAlert("😈 Sua mochila foi selada pela Maldição! Você não pode usar cartas nesta Batalha de Ginásio!", BattleCore.player!.name, true, false);
            return;
        }

        if (Game.currentGlobalEvent?.id === 'EMP') return alert("📡 Cartas bloqueadas pela Tempestade Eletromagnética!");

        if (!BattleCore.isPvP && BattleCore.activeMon && ((BattleCore.activeMon as any).isTemp || (BattleCore.activeMon as any).isMegaEvolution)) {
            return alert("🧬 Seu parceiro já atingiu o poder máximo! É proibido usar cartas de batalha em Pokémon Mega Evoluídos contra o ambiente selvagem, NPCs ou Ginásios.");
        }

        if (!BattleCore.isPlayerTurn || BattleCore.processingAction) return;
        const list = document.getElementById('battle-cards-list')!;
        list.innerHTML = '';

        const modalContent = document.querySelector('#battle-cards-modal .modal-content') as HTMLElement;
        if (modalContent) {
            modalContent.style.width = "90%";
            modalContent.style.maxWidth = "1100px";
            modalContent.style.maxHeight = "85vh";
            modalContent.style.padding = "25px";
            modalContent.style.overflowY = "auto";
        }

        const battleCards = BattleCore.player!.cards.filter(c => c.type === 'battle');

        if (battleCards.length === 0) {
            list.innerHTML = "<em>Sem cartas de batalha.</em>";
            list.style.display = 'block';
        } else {
            list.style.display = 'grid';
            list.style.gridTemplateColumns = 'repeat(auto-fill, minmax(180px, 1fr))';
            list.style.gap = '20px';
            list.style.padding = '20px';
            list.style.width = '100%';

            battleCards.forEach(c => {
                const rData = CARD_RARITIES[c.rarity];
                const borderColor = rData ? rData.color : '#8d99ae';
                
                const origIndex = BattleCore.player!.cards.indexOf(c);
                const isProtected = c.isProtected;

                const d = document.createElement('div');
                d.style.cssText = "display: flex; flex-direction: column; align-items: center; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); width: 100%; box-sizing: border-box; position: relative;";
                
                let style = isProtected ? 'border: 3px solid #f39c12; box-shadow: 0 0 10px #f39c12;' : `border: 3px solid ${borderColor};`;
                let lockIcon = isProtected ? `<div style="position:absolute; top:40%; left:50%; transform:translate(-50%, -50%); font-size:3rem; text-shadow:2px 2px 5px #000; z-index:5;">🔒</div>` : '';

                d.innerHTML = `
                    <div style="position: absolute; top: -5px; right: -5px; background: ${borderColor}; color: #fff; padding: 2px 6px; font-size: 0.7rem; border-radius: 10px; font-weight: bold; border: 1px solid #222; text-shadow: 1px 1px 0 #000; box-shadow: 0 2px 4px rgba(0,0,0,0.5); z-index: 10;">
                        ${c.rarity.toUpperCase()}
                    </div>
                    ${lockIcon}
                    <img src="/assets/img/Cartas/${c.id}.jpg" alt="${c.name}" title="${c.desc}" style="width: 100%; aspect-ratio: 2.5/3.5; object-fit: fill; border-radius: 6px; ${style}">
                `;

                const btn = document.createElement('button');
                btn.className = 'btn';
                if (isProtected) {
                    btn.style.cssText = "width:100%; margin-top:8px; padding:8px; background:#f39c12; border:none; border-radius:4px; color:white; font-weight:bold; cursor:pointer;";
                    btn.innerText = "🔓 DESPROTEGER";
                    btn.onclick = () => {
                        const Cards = (window as any).Cards || (window as any).CardEffects;
                        if (Cards && Cards.unprotectCard) {
                            Cards.unprotectCard(BattleCore.player!.id, origIndex, false);
                            this.openCardSelection();
                        }
                    };
                } else {
                    btn.style.cssText = "width:100%; margin-top:8px; padding:8px; background:#e74c3c; border:none; border-radius:4px; color:white; font-weight:bold; cursor:pointer;";
                    btn.innerText = "USAR";
                    btn.onclick = () => {
                        (window as any).Battle.useCard(c.id);
                    };
                }
                d.appendChild(btn);

                list.appendChild(d);
            });
        }
        document.getElementById('battle-cards-modal')!.style.display = 'flex';
    }

    static async animateCaptureSequence(ballIcon: string, isSuccess: boolean): Promise<void> {
        const scene = document.querySelector('.battle-scene') as HTMLElement;
        const enemyImg = document.getElementById('opp-img') as HTMLElement;
        const oldBall = document.querySelector('.anim-ball');
        if (oldBall) oldBall.remove();

        const ball = document.createElement('div');
        ball.className = 'anim-ball';
        ball.style.backgroundImage = `url('/assets/img/Itens/${ballIcon}')`;
        scene.appendChild(ball);

        ball.classList.add('anim-throwing');
        await this.wait(600);

        const flash = document.createElement('div');
        flash.className = 'anim-flash';
        scene.appendChild(flash);
        setTimeout(() => flash.remove(), 300);

        if (enemyImg) enemyImg.classList.add('mon-caught-hidden');
        ball.classList.remove('anim-throwing');
        ball.classList.add('anim-falling');
        await this.wait(500);

        ball.classList.remove('anim-falling');
        const totalShakes = isSuccess ? 3 : (Math.random() > 0.5 ? 2 : 1);

        for (let i = 0; i < totalShakes; i++) {
            await this.wait(400);
            ball.classList.add('anim-shaking');
            this.logBattle(`... (${i + 1})`, false);
            await this.wait(600);
            ball.classList.remove('anim-shaking');
        }

        await this.wait(400);

        if (isSuccess) {
            ball.style.filter = "brightness(0.5)";
            await this.wait(500);
            ball.remove();
        } else {
            ball.style.opacity = '0';
            if (enemyImg) enemyImg.classList.remove('mon-caught-hidden');
            await this.wait(300);
            ball.remove();
        }
    }

    static wait(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }

    static startBattleLog(summary: string) {
        this.currentBattleId = Date.now().toString();
        this.currentBattleLogs = [summary];
        const Game = (window as any).Game;
        Game.log(summary, undefined, this.currentBattleId);
        GameState.battleLogs[this.currentBattleId] = this.currentBattleLogs;
    }

    static logBattle(msg: string, sync: boolean = false) {
        const el = document.getElementById('battle-msg');
        if (el) el.innerText = msg;

        const logContainer = document.getElementById('battle-log-history');
        if (logContainer) {
            const lines = msg.split('\n');
            lines.forEach(line => {
                if (line.trim()) {
                    logContainer.insertAdjacentHTML('afterbegin', `<div style="border-bottom:1px solid #555; padding:2px;">${line}</div>`);
                    // Salva no log isolado se houver uma batalha ativa
                    if (this.currentBattleId) {
                        this.currentBattleLogs.push(line);
                        GameState.battleLogs[this.currentBattleId] = this.currentBattleLogs;

                        const NetworkObj = (window as any).Network || Network;
                        if (NetworkObj.isOnline && BattleCore.player && BattleCore.player.id === NetworkObj.myPlayerId) {
                            NetworkObj.syncBattleLogs(this.currentBattleId, this.currentBattleLogs);
                        }
                    }
                }
            });
            logContainer.scrollTop = 0;
        }

        // Não enviamos mais para o log principal a cada linha, 
        // apenas mantemos o log interno da batalha e sincronizamos se necessário via rede
        if (sync) {
            const NetworkObj = (window as any).Network || Network;
            if (NetworkObj.isOnline && BattleCore.player && BattleCore.player.id === NetworkObj.myPlayerId) {
                NetworkObj.sendAction('BATTLE_UPDATE', { 
                    msg: msg,
                    plyHp: BattleCore.activeMon?.currentHp,
                    oppHp: BattleCore.opponent?.currentHp,
                    plyItem: BattleCore.activeMon?.heldItem,
                    oppItem: BattleCore.opponent?.heldItem
                });
            }
        }
    }

    static showBattleConfirm(msg: string, onConfirm: () => void) {
        let modal = document.getElementById('battle-confirm-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'battle-confirm-modal';
            modal.className = 'modal-overlay';
            modal.style.zIndex = '3000';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-box" style="background: #2c3e50; border: 2px solid #e74c3c; text-align: center; max-width: 400px;">
                <h3 style="color: #e74c3c; margin-top: 0; font-size: 1.5rem; text-shadow: 0 0 10px rgba(231,76,60,0.3);">⚠️ Confirmação</h3>
                <p style="color: #edf2f4; margin: 25px 0; font-size: 1.1rem; line-height: 1.4;">${msg}</p>
                <div style="display: flex; gap: 15px; justify-content: center; width: 100%;">
                    <button id="btn-confirm-yes" class="btn" style="background: #ef233c; flex: 1; padding: 12px; font-weight: bold; margin: 0;">SIM, DESISTIR</button>
                    <button id="btn-confirm-no" class="btn btn-secondary" style="flex: 1; padding: 12px; font-weight: bold; margin: 0; background: #8d99ae; color: #2b2d42;">NÃO, VOLTAR</button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';

        document.getElementById('btn-confirm-yes')!.onclick = () => {
            modal!.style.display = 'none';
            onConfirm();
        };
        document.getElementById('btn-confirm-no')!.onclick = () => {
            modal!.style.display = 'none';
        };
    }
}