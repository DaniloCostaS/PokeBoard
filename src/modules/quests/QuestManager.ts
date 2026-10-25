import { QUESTS_DB, type QuestData } from '../../constants/quests';
import { GameState } from '../game/GameState';
import { Player } from '../../models/Player';
import { GameUI } from '../game/GameUI';
import { Network } from '../../systems/Network';
import { GameDialog } from '../ui/GameDialog';
import { ScreenKit } from '../ui/ScreenKit';

export interface ActiveQuest {
    questId: number;
    progress: number;
    completed: boolean;
    data?: any;
}

export class QuestManager {
    static getRandomQuest(): QuestData {
        const roll = Math.random();
        let targetRarity = 'Comum';
        
        if (roll <= 0.05) targetRarity = 'Épica';
        else if (roll <= 0.20) targetRarity = 'Rara';
        else if (roll <= 0.50) targetRarity = 'Incomum';

        const pool = QUESTS_DB.filter(q => q.rarity === targetRarity);
        const finalPool = pool.length > 0 ? pool : QUESTS_DB;
        return finalPool[Math.floor(Math.random() * finalPool.length)];
    }

    static addQuest(player: Player, questId?: number, endsTurn: boolean = false) {
        if (!player.activeQuests) player.activeQuests = [];
        
        let quest = questId ? QUESTS_DB.find(q => q.id === questId) : this.getRandomQuest();
        if (!quest) return;

        // Verify if player already has this quest
        if (player.activeQuests.find(q => q.questId === quest!.id)) {
            if (!questId) {
                // Se foi aleatório e já tem, pega outra
                quest = QUESTS_DB.find(q => !player.activeQuests.find(aq => aq.questId === q.id));
                if (!quest) { if (endsTurn) (window as any).Game?.nextTurn(); return; } // Tem todas as quests: não prende o turno
            } else {
                return; // Já tem essa quest específica
            }
        }

        if (player.activeQuests.length >= 3) {
            // A CPU não clica no modal de troca: mantém as missões atuais e segue o turno (antes o jogo travava
            // quando uma CPU com 3 missões caía no resultado "missão" da casa de Evento)
            if (player.isCPU) {
                GameUI.showGlobalAlert(`📜 ${player.name} encontrou a missão "${quest.name}", mas já tem 3 missões ativas e manteve as atuais.`, player.name, true, endsTurn);
                return;
            }
            this.openSwapModal(player, quest, endsTurn);
            return;
        }

        const questState: ActiveQuest = {
            questId: quest.id,
            progress: 0,
            completed: false
        };

        if (quest.triggerType === 'CAPTURE_TYPE_SPECIFIC') {
            const types = ['Normal', 'Fogo', 'Água', 'Elétrico', 'Grama', 'Gelo', 'Lutador', 'Veneno', 'Terra', 'Voador', 'Psíquico', 'Inseto', 'Pedra', 'Fantasma', 'Dragão', 'Noturno', 'Aço', 'Fada'];
            questState.data = { specificType: types[Math.floor(Math.random() * types.length)] };
        }

        player.activeQuests.push(questState);

        const extraDesc = questState.data?.specificType ? `\nTipo sorteado: ${questState.data.specificType}` : '';
        GameUI.showGlobalAlert(`📜 NOVA MISSÃO ADQUIRIDA!\n\n${quest.name}\n${quest.desc}${extraDesc}\nRecompensa: ${quest.rewardDesc}`, player.name, true, endsTurn);
        
        const NetworkObj = (window as any).Network || Network;
        if (NetworkObj.isOnline) NetworkObj.syncSpecificPlayer(player.id);
        
        if (quest.triggerType === 'RESONANCE_30') {
            const hasResonance30 = player.pokedexData && Object.values(player.pokedexData).some((d: any) => (d.caught || 0) >= 4);
            if (hasResonance30) {
                setTimeout(() => { this.checkProgress(player, 'RESONANCE_30', 1); }, 500);
            }
        }
    }

    static checkProgress(player: Player, triggerType: string, amount: number = 1, data?: any) {
        if (!player.activeQuests || player.activeQuests.length === 0) return;

        let syncNeeded = false;

        player.activeQuests.forEach(aq => {
            if (aq.completed) return;

            const questDef = QUESTS_DB.find(q => q.id === aq.questId);
            if (!questDef) return;

            if (questDef.triggerType === triggerType) {
                let valid = true;

                // Specific validations
                if (triggerType === 'CAPTURE_TYPE_SPECIFIC' && data?.type) {
                    const specificType = aq.data?.specificType;
                    if (specificType && data.type !== specificType && data.secondType !== specificType) valid = false;
                } else if (triggerType === 'CAPTURE_RARE' && data?.baseTotal) {
                    if (data.baseTotal < 280 || data.baseTotal > 329) valid = false;
                } else if (triggerType === 'CAPTURE_WATER' && data?.type) {
                    if (data.type !== 'Água' && data.secondType !== 'Água') valid = false;
                } else if (triggerType === 'WIN_UNDERLEVELED' && data?.playerLevel && data?.enemyLevel) {
                    if (data.playerLevel >= data.enemyLevel) valid = false;
                } else if (triggerType === 'FUSION_AND_SACRIFICE' && data?.action) {
                    if (!aq.data) aq.data = {};
                    aq.data[data.action] = 1;
                    aq.progress = (aq.data.fusion || 0) + (aq.data.sacrifice || 0);
                    syncNeeded = true;
                    if (aq.progress > questDef.target) aq.progress = questDef.target;
                    valid = false;
                } else if (triggerType === 'VISIT_BIOMES') {
                    if (data?.tileType !== undefined) {
                        const tileStr = data.tileType.toString();
                        if (['1', '2', '3'].includes(tileStr)) {
                            if (!aq.data) aq.data = {};
                            if (!aq.data[tileStr]) {
                                aq.data[tileStr] = 1;
                                aq.progress = (aq.data['1'] || 0) + (aq.data['2'] || 0) + (aq.data['3'] || 0);
                                syncNeeded = true;
                                if (aq.progress > questDef.target) aq.progress = questDef.target;
                            }
                        }
                    }
                    valid = false;
                }

                if (valid) {
                    aq.progress += amount;
                    syncNeeded = true;
                    if (aq.progress > questDef.target) {
                        aq.progress = questDef.target;
                    }
                }
            }
        });

        if (syncNeeded) {
            const NetworkObj = (window as any).Network || Network;
            if (NetworkObj.isOnline) NetworkObj.syncSpecificPlayer(player.id);
        }
    }

    static resetProgress(player: Player, triggerType: string) {
        if (!player.activeQuests || player.activeQuests.length === 0) return;
        let syncNeeded = false;
        player.activeQuests.forEach(aq => {
            if (aq.completed) return;
            const questDef = QUESTS_DB.find(q => q.id === aq.questId);
            if (!questDef) return;
            if (questDef.triggerType === triggerType && aq.progress > 0) {
                aq.progress = 0;
                syncNeeded = true;
            }
        });
        if (syncNeeded) {
            const NetworkObj = (window as any).Network || Network;
            if (NetworkObj.isOnline) NetworkObj.syncSpecificPlayer(player.id);
        }
    }

    static completeQuest(player: Player, activeQuest: ActiveQuest) {
        activeQuest.completed = true;
        const questDef = QUESTS_DB.find(q => q.id === activeQuest.questId);
        if (!questDef) return;

        questDef.onComplete(player);

        // Remove the completed quest
        player.activeQuests = player.activeQuests.filter(q => q.questId !== activeQuest.questId);

        GameUI.sendGlobalLog(`🎉 ${player.name} completou a missão [${questDef.name}] e recebeu: ${questDef.rewardDesc}!`);
        (window as any).Cinematics?.quest(player, questDef.name, questDef.rewardDesc);
        GameUI.showGlobalAlert(`🎉 MISSÃO CONCLUÍDA!\n\n${questDef.name}\nVocê recebeu: ${questDef.rewardDesc}`, player.name, true, false);
        GameUI.updateHUD();
    }

    static removeQuest(player: Player, questId: number) {
        if (!player.activeQuests) return;
        player.activeQuests = player.activeQuests.filter(q => q.questId !== questId);
    }

    /** Cartão de missão no visual do jogo (faixa de raridade, recompensa e rodapé livre). */
    static questCardHTML(q: QuestData, extra: string, footer: string): string {
        const rarityColors: Record<string, string> = { 'Comum': '#9aa8b4', 'Incomum': '#2fb560', 'Rara': '#3a80bf', 'Épica': '#8e5bc4', 'Lendária': '#e0a92e' };
        return `
            <article class="pb-quest" style="--rc:${rarityColors[q.rarity] || '#9aa8b4'}">
                <header class="pb-quest-head">
                    <i class="pb-ico pb-ico-quest" aria-hidden="true"></i>
                    <strong>${q.name}</strong>
                    <span class="pb-quest-rarity">${q.rarity.toUpperCase()}</span>
                </header>
                <p class="pb-quest-desc">${q.desc}${extra ? `<br>${extra}` : ''}</p>
                <div class="pb-quest-reward"><small>Recompensa</small><span>${q.rewardDesc}</span></div>
                ${footer}
            </article>`;
    }

    static openQuestsModal(player: Player) {
        let modal = document.getElementById('quests-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'quests-modal';
            modal.className = 'modal-overlay';
            modal.style.zIndex = '9999';
            modal.innerHTML = `
                <div class="modal-content pb-screen pb-screen--narrow">
                    ${ScreenKit.head({ icon: 'quest', iconHTML: ScreenKit.QUEST_ICON, kicker: 'Diário do treinador', title: 'Minhas missões', actions: ScreenKit.closeX("document.getElementById('quests-modal').style.display='none'") })}
                    <div id="quests-list" class="pb-quest-list"></div>
                    <button class="btn btn-secondary stats-close-btn" onclick="document.getElementById('quests-modal').style.display='none'">Fechar</button>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const list = document.getElementById('quests-list')!;
        list.innerHTML = '';

        if (!player.activeQuests || player.activeQuests.length === 0) {
            list.innerHTML = '<p class="pb-stats-empty">Você não tem missões ativas.</p>';
        } else {
            player.activeQuests.forEach(aq => {
                const q = QUESTS_DB.find(def => def.id === aq.questId);
                if (q) {
                    let completeBtn = '';
                    if (aq.progress >= q.target) {
                        const NetworkObj = (window as any).Network;
                        const isMyPlayer = !NetworkObj?.isOnline || NetworkObj.myPlayerId === player.id;
                        if (isMyPlayer) {
                            completeBtn = `<button class="btn btn-start-turn pb-quest-claim" onclick="window.QuestManager.claimReward(${player.id}, ${q.id})">Reivindicar recompensa</button>`;
                        } else {
                            completeBtn = `<button class="btn btn-secondary pb-quest-claim" disabled>Concluída (aguardando)</button>`;
                        }
                    }

                    const bar = (label: string, val: number, target: number) => {
                        const p = Math.min(100, Math.floor((val / target) * 100));
                        return `
                            <div class="pb-quest-progress ${p === 100 ? 'is-done' : ''}">
                                <div class="pb-quest-progress-top"><span>${label}</span><b>${val}/${target}</b></div>
                                <div class="pb-quest-bar"><u style="width:${p}%"></u></div>
                            </div>`;
                    };
                    const progressHTML = q.multiTargets
                        ? q.multiTargets.map((mt: any) => bar(mt.label, aq.data ? (aq.data[mt.key] || 0) : 0, mt.target)).join('')
                        : bar('Progresso', aq.progress, q.target);

                    const extra = aq.data?.specificType ? `<span class="pb-quest-type">Tipo sorteado: <b>${aq.data.specificType}</b></span>` : '';
                    list.innerHTML += QuestManager.questCardHTML(q, extra, progressHTML + completeBtn);
                }
            });
        }

        modal.style.display = 'flex';
    }

    static openSwapModal(player: Player, newQuest: QuestData, endsTurn: boolean = false) {
        let modal = document.getElementById('quests-swap-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'quests-swap-modal';
            modal.className = 'modal-overlay';
            modal.style.zIndex = '10000';
            document.body.appendChild(modal);
        }

        let html = `
            <div class="modal-content pb-screen pb-screen--narrow">
                ${ScreenKit.head({ icon: 'quest', iconHTML: ScreenKit.QUEST_ICON, kicker: 'Você já tem 3 missões ativas', title: 'Limite de missões' })}
                <p class="pb-screen-lead">Escolha uma missão para abandonar e aceitar a nova, ou mantenha as atuais.</p>
                <div class="pb-monlist-sep">Nova missão</div>
                ${QuestManager.questCardHTML(newQuest, '', '')}
                <div class="pb-monlist-sep">Missões atuais</div>
                <div id="quests-swap-list" class="pb-quest-list">
        `;

        player.activeQuests.forEach((aq) => {
            const q = QUESTS_DB.find(def => def.id === aq.questId);
            if (q) {
                html += `
                    <div class="pb-quest-swap-row">
                        <div>
                            <strong>${q.name}</strong>
                            <span>${q.desc}</span>
                            <small>Progresso <b>${aq.progress}/${q.target}</b></small>
                        </div>
                        <button class="btn btn-roll" onclick="window.QuestManager.swapQuest(${player.id}, ${q.id}, ${newQuest.id}, ${endsTurn})">Abandonar</button>
                    </div>
                `;
            }
        });

        html += `
                </div>
                <button class="btn btn-secondary" onclick="window.QuestManager.cancelSwap(${endsTurn})">Manter missões atuais</button>
            </div>
        `;
        
        modal.innerHTML = html;
        modal.style.display = 'flex';
        
        // Expose to window for the onclick handlers
        (window as any).QuestManager = this;
    }

    static cancelSwap(endsTurn: boolean = false) {
        document.getElementById('quests-swap-modal')!.style.display = 'none';
        if (endsTurn) {
            const Game = (window as any).Game;
            if (Game) Game.nextTurn();
        }
    }

    static swapQuest(playerId: number, oldQuestId: number, newQuestId: number, endsTurn: boolean = false) {
        const Game = (window as any).Game;
        const player = Game.players.find((p:any) => p.id === playerId);
        if(!player) return;

        this.removeQuest(player, oldQuestId);
        
        const newQuest = QUESTS_DB.find(q => q.id === newQuestId);
        if(newQuest) {
            const questState: ActiveQuest = {
                questId: newQuest.id,
                progress: 0,
                completed: false
            };
            if (newQuest.triggerType === 'CAPTURE_TYPE_SPECIFIC') {
                const types = ['Normal', 'Fogo', 'Água', 'Elétrico', 'Grama', 'Gelo', 'Lutador', 'Veneno', 'Terra', 'Voador', 'Psíquico', 'Inseto', 'Pedra', 'Fantasma', 'Dragão', 'Noturno', 'Aço', 'Fada'];
                questState.data = { specificType: types[Math.floor(Math.random() * types.length)] };
            }
            player.activeQuests.push(questState);
            const extraDesc = questState.data?.specificType ? ` Tipo sorteado: ${questState.data.specificType}.` : '';
            GameUI.showGlobalAlert(`Missão trocada com sucesso! Você assumiu: ${newQuest.name}.${extraDesc}`, player.name, true, endsTurn);
        }
        
        document.getElementById('quests-swap-modal')!.style.display = 'none';
        
        const NetworkObj = (window as any).Network || Network;
        if (NetworkObj.isOnline) NetworkObj.syncSpecificPlayer(player.id);

        if (newQuest?.triggerType === 'RESONANCE_30') {
            const hasResonance30 = player.pokedexData && Object.values(player.pokedexData).some((d: any) => (d.caught || 0) >= 4);
            if (hasResonance30) {
                setTimeout(() => { this.checkProgress(player, 'RESONANCE_30', 1); }, 500);
            }
        }
    }

    static claimReward(playerId: number, questId: number) {
        const Game = (window as any).Game;
        const NetworkObj = (window as any).Network || Network;
        
        // Check if it's player's turn
        const currentPlayer = Game.getCurrentPlayer();
        if (!currentPlayer || currentPlayer.id !== playerId) {
            return GameDialog.toast("Você só pode concluir missões durante o seu próprio turno!", { tone: 'warning' });
        }

        if (!GameState.turnStarted) {
            return GameDialog.toast("Inicie o seu turno antes de concluir missões.", { tone: 'warning' });
        }

        if (NetworkObj && NetworkObj.isOnline && NetworkObj.myPlayerId !== playerId) {
            return GameDialog.toast("Você não pode concluir missões de outro jogador.", { tone: 'warning' });
        }

        const player = Game.players.find((p: any) => p.id === playerId);
        if (!player || !player.activeQuests) return;

        const aq = player.activeQuests.find((q: any) => q.questId === questId);
        if (!aq) return;

        const questDef = QUESTS_DB.find(q => q.id === questId);
        if (!questDef) return;

        if (aq.progress >= questDef.target) {
            const modal = document.getElementById('quests-modal');
            if (modal) modal.style.display = 'none';

            this.completeQuest(player, aq);
            
            if (NetworkObj && NetworkObj.isOnline) {
                NetworkObj.syncSpecificPlayer(player.id);
            }
        }
    }

    static openQuestLibrary() {
        let modal = document.getElementById('quest-library-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'quest-library-modal';
            modal.className = 'modal-overlay';
            modal.style.zIndex = '9999';
            modal.innerHTML = `
                <div class="modal-content pb-screen pb-screen--wide">
                    ${ScreenKit.head({ icon: 'quest', iconHTML: ScreenKit.QUEST_ICON, kicker: 'Poképédia', title: 'Biblioteca de missões', actions: `<div class="pb-screen-actions">${ScreenKit.backBtn("window.returnToPokepedia('quest-library-modal')", 'Voltar para a Poképédia')}${ScreenKit.closeX("document.getElementById('quest-library-modal').style.display='none'")}</div>` })}
                    <div id="quest-library-list" class="pb-quest-grid"></div>
                    <button class="btn btn-secondary" onclick="window.returnToPokepedia('quest-library-modal')">Voltar para a Poképédia</button>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const list = document.getElementById('quest-library-list')!;
        list.innerHTML = '';
        
        list.innerHTML = QUESTS_DB.map(q => QuestManager.questCardHTML(q, '', `
            <footer class="pb-quest-meta">
                <span>Meta <b>${q.target}</b></span>
                <span>Gatilho <code>${q.triggerType}</code></span>
            </footer>`)).join('');

        modal.style.display = 'flex';
    }
}
