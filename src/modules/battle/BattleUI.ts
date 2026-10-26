import { CardHand } from '../cards/CardHand';
import { BattleCore } from './BattleCore';
import { Pokemon } from '../../models/Pokemon';
import { Network } from '../../systems/Network';
import { GYM_DATA } from '../../constants/gyms';
import { SHOP_ITEMS } from '../../constants';
import { GameState } from '../game/GameState';
import { GameUI } from '../game/GameUI';
import { GameFeel } from '../ui/GameFeel';
import { Backpack } from '../ui/Backpack';
import { GameDialog } from '../ui/GameDialog';
import { ScreenKit } from '../ui/ScreenKit';

export class BattleUI {
    static currentBattleId: string | null = null;
    static currentBattleLogs: string[] = [];

    static openSelectionModal(title: string) {
        const modal = document.getElementById('pkmn-select-modal')!;
        const list = document.getElementById('pkmn-select-list')!;

        // Título vem com emoji no início (🏛️/👤/🐾/🏆): o cabeçalho já tem ícone próprio
        document.getElementById('select-title')!.innerHTML = title.replace(/^\s*\p{Extended_Pictographic}️?\s*/u, '');
        list.innerHTML = '';

        BattleCore.plyTeamList.forEach((mon) => {
            const fainted = mon.isFainted();
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'pb-monpick';
            btn.disabled = fainted;
            btn.innerHTML = ScreenKit.monRow(mon, { note: fainted ? 'Desmaiado: não pode lutar' : '' });
            if (!fainted) btn.onclick = () => { modal.style.display = 'none'; BattleCore.startRound(mon); };
            list.appendChild(btn);
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
        GameFeel.battleEnter();
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
                        Fechar Visualização
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

        const plyVinculo = BattleCore.activeMon.vinculoSupremo ? `<span style="font-size:14px; margin-left:4px;" title="Vínculo Supremo">🤝</span>` : '';
        const plyHappiness = BattleCore.activeMon.happiness === 100 ? `<span style="font-size:14px; margin-left:4px;" title="Vínculo Afetivo (100% Felicidade)">💖</span>` : '';
        document.getElementById('ply-name')!.innerHTML = `${BattleCore.activeMon.name}${plyVinculo}${plyHappiness}`;
        const plyTypesEl = document.getElementById('ply-types');
        if (plyTypesEl && typeof BattleCore.activeMon.getTypeBadgesHTML === 'function') {
            plyTypesEl.innerHTML = BattleCore.activeMon.getTypeBadgesHTML('flex-start');
        }

        const plyXpEl = document.getElementById('ply-xp');
        if (plyXpEl) plyXpEl.style.width = `${(BattleCore.activeMon.currentXp / BattleCore.activeMon.maxXp) * 100}%`;

        document.getElementById('ply-lvl')!.innerText = `Lv.${BattleCore.activeMon.level}`;
        GameFeel.setBattleSprite(document.getElementById('ply-img') as HTMLImageElement, BattleCore.activeMon, 'back');

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

        const oppVinculo = BattleCore.opponent.vinculoSupremo ? `<span style="font-size:14px; margin-left:4px;" title="Vínculo Supremo">🤝</span>` : '';
        const oppHappiness = BattleCore.opponent.happiness === 100 ? `<span style="font-size:14px; margin-left:4px;" title="Vínculo Afetivo (100% Felicidade)">💖</span>` : '';
        document.getElementById('opp-name')!.innerHTML = `${BattleCore.opponent.name}${oppVinculo}${oppHappiness}`;
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

        GameFeel.setBattleSprite(document.getElementById('opp-img') as HTMLImageElement, BattleCore.opponent, 'front');
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

        GameFeel.onBattleUpdate(BattleCore.activeMon, BattleCore.opponent, BattleCore.player.id);
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

        listContainer.innerHTML = player.team.map((p: any) => ScreenKit.monRow(p)).join('');

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
        const isTrainerBattle = BattleCore.isPvP || BattleCore.isNPC || BattleCore.isGym;
        const list = document.getElementById('battle-bag-list')!;

        // Mesmas regras de BattleCore.useItem, explicadas no próprio item
        Backpack.render(list, {
            ownerName: BattleCore.player!.name,
            items: BattleCore.player!.items,
            defaultPocket: isTrainerBattle ? 'medicine' : 'balls',
            usable: (item) => {
                if (item.type === 'capture') {
                    return isTrainerBattle ? { ok: false, reason: 'Não dá para capturar Pokémon de treinadores.' } : { ok: true };
                }
                if (BattleCore.isChampion) return { ok: false, reason: 'As regras da Liga proíbem itens no desafio do Campeão.' };
                if (item.type === 'revive') return { ok: false, reason: 'Não dá para reviver Pokémon durante a batalha.' };
                if (item.type !== 'heal') return { ok: false, reason: 'Este item é usado fora da batalha, pela mochila do tabuleiro.' };
                if (isMegaOrMew) return { ok: false, reason: 'Mega Evoluções e Mew não podem receber itens de cura.' };
                const mon = BattleCore.activeMon;
                if (mon && mon.isFainted()) return { ok: false, reason: 'O Pokémon em campo está desmaiado.' };
                if (mon && mon.currentHp >= mon.maxHp) return { ok: false, reason: 'O HP já está cheio.' };
                return { ok: true };
            },
            actionLabel: (item) => item.type === 'capture' ? 'Lançar' : 'Usar',
            onUse: (key, item) => BattleCore.useItem(key, item)
        });

        document.getElementById('battle-bag')!.style.display = 'block';
    }

    static openCardSelection() {
        const Game = (window as any).Game;

        if (BattleCore.isGym && BattleCore.player!.effects.curse) {
            Game.showGlobalAlert("😈 Sua mochila foi selada pela Maldição! Você não pode usar cartas nesta Batalha de Ginásio!", BattleCore.player!.name, true, false);
            return;
        }

        if (Game.currentGlobalEvent?.id === 'EMP') return GameDialog.toast("Cartas bloqueadas pela Tempestade Eletromagnética!", { tone: 'warning' });

        if (!BattleCore.isPvP && BattleCore.activeMon && ((BattleCore.activeMon as any).isTemp || (BattleCore.activeMon as any).isMegaEvolution)) {
            return GameDialog.toast("Seu parceiro já atingiu o poder máximo! É proibido usar cartas de batalha em Pokémon Mega Evoluídos contra o ambiente selvagem, NPCs ou Ginásios.", { tone: 'warning' });
        }

        if (!BattleCore.isPlayerTurn || BattleCore.processingAction) return;

        if (BattleCore.cardsUsedThisBattle >= 3) {
            return GameDialog.toast("Você já usou o limite máximo de 3 cartas nesta batalha!", { tone: 'warning' });
        }

        const modalBox = (document.querySelector('#battle-cards-modal .modal-box') || document.querySelector('#battle-cards-modal > div')) as HTMLElement;
        if (modalBox) {
            modalBox.style.width = "95%";
            modalBox.style.maxWidth = "1200px";
            modalBox.style.maxHeight = "90vh";
            modalBox.style.padding = "30px";
            modalBox.style.overflowY = "auto";
        }

        const p = BattleCore.player!;
        const list = document.getElementById('battle-cards-list')!;
        list.innerHTML = '';

        const isMobile = window.innerWidth <= 1000;
        list.style.cssText = 'display: flex; flex-direction: column; gap: 12px; width: 100%; padding: 4px 0; overflow: visible;';

        const rarityFilter = (document.getElementById('battle-cards-rarity-filter') as HTMLSelectElement)?.value || 'all';
        const typeFilter = (document.getElementById('battle-cards-type-filter') as HTMLSelectElement)?.value || 'all';

        let filteredCards = [...p.cards];
        if (rarityFilter !== 'all') {
            filteredCards = filteredCards.filter(c => c.rarity === rarityFilter);
        }
        if (typeFilter !== 'all') {
            filteredCards = filteredCards.filter(c => c.type === typeFilter);
        }

        const typeOrder: Record<string, number> = { 'battle': 1, 'auto': 2, 'move': 3, 'global': 4 };
        const rarityOrder: Record<string, number> = { 'Lendária': 0, 'Épica': 1, 'Rara': 2, 'Incomum': 3, 'Comum': 4 };

        filteredCards.sort((a, b) => {
            if (typeOrder[a.type] !== typeOrder[b.type]) return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
            if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) return (rarityOrder[a.rarity] || 99) - (rarityOrder[b.rarity] || 99);
            return a.name.localeCompare(b.name);
        });

        if (filteredCards.length === 0) {
            list.innerHTML = `<em style="${isMobile ? '' : 'grid-column: 1/-1;'}">Sem cartas.</em>`;
        } else {
            CardHand.render(list, p, filteredCards, {
                isMe: true,
                isBattle: true,
                battleCardsLeft: 3 - BattleCore.cardsUsedThisBattle,
                onZoom: (id) => GameUI.showCardZoom(id),
                onUse: (cardId, cardEl) => {
                    CardHand.flyAndUse(cardEl, cardId, () => {
                        (window as any).Battle.useCard(cardId);
                    });
                },
                onUnprotect: (_card, origIdx) => {
                    const Cards = (window as any).Cards || (window as any).CardEffects;
                    if (Cards && Cards.unprotectCard) {
                        Cards.unprotectCard(p.id, origIdx, false);
                        BattleUI.openCardSelection();
                    }
                }
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
        GameFeel.onBattleLog(msg);
        const el = document.getElementById('battle-msg');
        if (el) el.innerHTML = msg;

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
            <div class="modal-box" style="background: #2c3e50; border: 2px solid #e74c3c; text-align: center; max-width: 400px; height: auto;">
                <h3 style="color: #e74c3c; margin-top: 0; font-size: 1.5rem; text-shadow: 0 0 10px rgba(231,76,60,0.3);">Confirmação</h3>
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