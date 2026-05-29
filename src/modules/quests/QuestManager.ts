import { QUESTS_DB, type QuestData } from '../../constants/quests';
import { GameState } from '../game/GameState';
import { Player } from '../../models/Player';
import { GameUI } from '../game/GameUI';
import { Network } from '../../systems/Network';

export interface ActiveQuest {
    questId: number;
    progress: number;
    completed: boolean;
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
                if (!quest) return; // Tem todas as quests
            } else {
                return; // Já tem essa quest específica
            }
        }

        if (player.activeQuests.length >= 3) {
            this.openSwapModal(player, quest);
            return;
        }

        player.activeQuests.push({
            questId: quest.id,
            progress: 0,
            completed: false
        });

        GameUI.showGlobalAlert(`📜 NOVA MISSÃO ADQUIRIDA!\n\n${quest.name}\n${quest.desc}\nRecompensa: ${quest.rewardDesc}`, player.name, true, endsTurn);
        
        const NetworkObj = (window as any).Network || Network;
        if (NetworkObj.isOnline) NetworkObj.syncSpecificPlayer(player.id);
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
                    // For simplicity, any capture counts for now, but we could assign a random type to the quest on generation
                    // Validations should go here if we expand the quest state
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

        GameUI.showGlobalAlert(`🎉 MISSÃO CONCLUÍDA!\n\n${questDef.name}\nVocê recebeu: ${questDef.rewardDesc}`, player.name, true, false);
        GameUI.updateHUD();
    }

    static removeQuest(player: Player, questId: number) {
        if (!player.activeQuests) return;
        player.activeQuests = player.activeQuests.filter(q => q.questId !== questId);
    }

    static openQuestsModal(player: Player) {
        let modal = document.getElementById('quests-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'quests-modal';
            modal.className = 'modal-overlay';
            modal.style.zIndex = '9999';
            modal.innerHTML = `
                <div class="modal-content" style="width: 500px; max-width: 95%; max-height: 90vh; display: flex; flex-direction: column; background: rgba(20, 20, 20, 0.95); border: 2px solid #f1c40f; color: #fff; border-radius: 16px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); box-sizing: border-box;">
                    <h3 style="color: #f1c40f; margin-top: 0; border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 10px; display: flex; align-items: center; gap: 8px; font-family: 'Outfit', sans-serif;">
                        📜 Minhas Missões
                    </h3>
                    <div id="quests-list" class="scroll-list" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; margin-top: 10px; padding-right: 5px;"></div>
                    <button class="btn btn-secondary" style="margin-top: 15px; width: 100%;" onclick="document.getElementById('quests-modal').style.display='none'">Fechar</button>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const list = document.getElementById('quests-list')!;
        list.innerHTML = '';

        if (!player.activeQuests || player.activeQuests.length === 0) {
            list.innerHTML = '<p style="text-align:center; color:#bdc3c7;">Você não tem missões ativas.</p>';
        } else {
            player.activeQuests.forEach(aq => {
                const q = QUESTS_DB.find(def => def.id === aq.questId);
                if (q) {
                    let completeBtn = '';
                    if (aq.progress >= q.target) {
                        const NetworkObj = (window as any).Network;
                        const isMyPlayer = !NetworkObj?.isOnline || NetworkObj.myPlayerId === player.id;
                        if (isMyPlayer) {
                            completeBtn = `<button class="btn" style="margin-top: 15px; width: 100%; background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%); color: white; font-weight: bold; font-size: 0.9rem; border: none; box-shadow: 0 4px 10px rgba(46, 204, 113, 0.3);" onclick="window.QuestManager.claimReward(${player.id}, ${q.id})">✅ REIVINDICAR RECOMPENSA</button>`;
                        } else {
                            completeBtn = `<button class="btn" disabled style="margin-top: 15px; width: 100%; background: #555; color: #aaa; font-weight: bold; font-size: 0.9rem; border: none; cursor: not-allowed;">✅ CONCLUÍDA (AGUARDANDO)</button>`;
                        }
                    }

                    const borderColors: Record<string, string> = { 'Comum': '#bdc3c7', 'Incomum': '#2ecc71', 'Rara': '#3498db', 'Épica': '#9b59b6', 'Lendária': '#f1c40f' };
                    const bColor = borderColors[q.rarity] || '#f1c40f';

                    let progressHTML = '';
                    if (q.multiTargets) {
                        q.multiTargets.forEach((mt: any) => {
                            const val = aq.data ? (aq.data[mt.key] || 0) : 0;
                            const tPct = Math.min(100, Math.floor((val / mt.target) * 100));
                            progressHTML += `
                                <div style="margin-top: 10px;">
                                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #ddd; margin-bottom: 4px;">
                                        <span>${mt.label}</span>
                                        <span style="color: ${tPct === 100 ? '#2ecc71' : '#bdc3c7'}; font-weight: bold;">${val} / ${mt.target}</span>
                                    </div>
                                    <div style="background: rgba(0,0,0,0.4); height: 8px; border-radius: 4px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05);">
                                        <div style="width: ${tPct}%; background: ${tPct === 100 ? '#2ecc71' : '#3498db'}; height: 100%; box-shadow: 0 0 10px ${tPct === 100 ? '#2ecc71' : '#3498db'}; transition: width 0.3s ease;"></div>
                                    </div>
                                </div>
                            `;
                        });
                    } else {
                        const pct = Math.min(100, Math.floor((aq.progress / q.target) * 100));
                        progressHTML = `
                            <div style="margin-top: 10px;">
                                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #ddd; margin-bottom: 4px;">
                                    <span>Progresso</span>
                                    <span style="color: ${pct === 100 ? '#2ecc71' : '#bdc3c7'}; font-weight: bold;">${aq.progress} / ${q.target}</span>
                                </div>
                                <div style="background: rgba(0,0,0,0.4); height: 8px; border-radius: 4px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05);">
                                    <div style="width: ${pct}%; background: ${pct === 100 ? '#2ecc71' : '#3498db'}; height: 100%; box-shadow: 0 0 10px ${pct === 100 ? '#2ecc71' : '#3498db'}; transition: width 0.3s ease;"></div>
                                </div>
                            </div>
                        `;
                    }

                    list.innerHTML += `
                        <div style="display: flex; flex-direction: column; background: rgba(0,0,0,0.3); border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.4); width: 100%; box-sizing: border-box; position: relative; border: 1px solid rgba(255,255,255,0.05); transition: transform 0.2s; overflow: visible;">
                            <div style="background: ${bColor}; color: #fff; padding: 8px 15px; font-weight: bold; text-shadow: 1px 1px 0 rgba(0,0,0,0.5); display: flex; justify-content: space-between; align-items: center; border-radius: 8px 8px 0 0;">
                                <span style="font-size: 1.05rem; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; max-width: 80%;">${q.name}</span>
                                <span style="font-size: 0.65rem; background: rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 12px; letter-spacing: 0.5px;">${q.rarity.toUpperCase()}</span>
                            </div>
                            <div style="padding: 15px; display: flex; flex-direction: column;">
                                <p style="font-size: 0.9rem; color: #ddd; margin: 0 0 12px 0; line-height: 1.5;">${q.desc}</p>
                                <div style="background: rgba(0,0,0,0.2); padding: 8px 12px; border-radius: 6px; border: 1px dashed rgba(255,255,255,0.1); margin-bottom: 4px;">
                                    <div style="font-size: 0.85rem; color: #2ecc71; font-weight: bold; display: flex; align-items: center; gap: 5px;">
                                        <span>🎁</span> <span>${q.rewardDesc}</span>
                                    </div>
                                </div>
                                ${progressHTML}
                                ${completeBtn}
                            </div>
                        </div>
                    `;
                }
            });
        }

        modal.style.display = 'flex';
    }

    static openSwapModal(player: Player, newQuest: QuestData) {
        let modal = document.getElementById('quests-swap-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'quests-swap-modal';
            modal.className = 'modal-overlay';
            modal.style.zIndex = '10000';
            document.body.appendChild(modal);
        }

        let html = `
            <div class="modal-content" style="max-width: 500px; background: #2c3e50; color: white;">
                <h2>⚠️ Limite de Missões Atingido</h2>
                <p>Você já possui 3 missões ativas. Qual missão você deseja abandonar para aceitar a nova?</p>
                
                <div style="background: rgba(46, 204, 113, 0.2); border: 1px solid #2ecc71; padding: 10px; border-radius: 8px; margin-bottom: 15px;">
                    <strong>NOVA MISSÃO: ${newQuest.name}</strong><br>
                    <span style="font-size:0.85rem">${newQuest.desc}</span><br>
                    <span style="font-size:0.8rem; color:#f1c40f">Recompensa: ${newQuest.rewardDesc}</span>
                </div>
                
                <div id="quests-swap-list" style="text-align: left;">
        `;

        player.activeQuests.forEach((aq) => {
            const q = QUESTS_DB.find(def => def.id === aq.questId);
            if (q) {
                html += `
                    <div style="background: rgba(0,0,0,0.3); padding: 10px; margin-bottom: 10px; border-radius: 8px; display:flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: #e74c3c;">${q.name}</strong><br>
                            <span style="font-size:0.85rem">${q.desc}</span><br>
                            <span style="font-size:0.8rem; color:#bdc3c7">Progresso: ${aq.progress}/${q.target}</span>
                        </div>
                        <button class="btn btn-danger btn-sm" onclick="window.QuestManager.swapQuest(${player.id}, ${q.id}, ${newQuest.id})">Abandonar</button>
                    </div>
                `;
            }
        });

        html += `
                </div>
                <button class="btn btn-secondary" style="margin-top: 10px; width: 100%;" onclick="document.getElementById('quests-swap-modal').style.display='none'">Manter Missões Atuais</button>
            </div>
        `;
        
        modal.innerHTML = html;
        modal.style.display = 'flex';
        
        // Expose to window for the onclick handlers
        (window as any).QuestManager = this;
    }

    static swapQuest(playerId: number, oldQuestId: number, newQuestId: number) {
        const Game = (window as any).Game;
        const player = Game.players.find((p:any) => p.id === playerId);
        if(!player) return;

        this.removeQuest(player, oldQuestId);
        
        const newQuest = QUESTS_DB.find(q => q.id === newQuestId);
        if(newQuest) {
            player.activeQuests.push({
                questId: newQuest.id,
                progress: 0,
                completed: false
            });
            GameUI.showGlobalAlert(`Missão trocada com sucesso! Você assumiu: ${newQuest.name}`, player.name, true, false);
        }
        
        document.getElementById('quests-swap-modal')!.style.display = 'none';
        
        const NetworkObj = (window as any).Network || Network;
        if (NetworkObj.isOnline) NetworkObj.syncSpecificPlayer(player.id);
    }

    static claimReward(playerId: number, questId: number) {
        const Game = (window as any).Game;
        const NetworkObj = (window as any).Network || Network;
        
        // Check if it's player's turn
        const currentPlayer = Game.getCurrentPlayer();
        if (!currentPlayer || currentPlayer.id !== playerId) {
            return alert("Você só pode concluir missões durante o seu próprio turno!");
        }

        if (!GameState.turnStarted) {
            return alert("Você só pode concluir missões após iniciar o seu turno! Cuidado para não queimar etapas.");
        }

        if (NetworkObj && NetworkObj.isOnline && NetworkObj.myPlayerId !== playerId) {
            return alert("Você não pode concluir missões de outro jogador.");
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
                <div class="modal-content" style="width: 1200px; max-width: 95%; max-height: 90vh; display: flex; flex-direction: column; background: rgba(20, 20, 20, 0.95); border: 2px solid #f1c40f; color: #fff; border-radius: 16px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); box-sizing: border-box;">
                    <h3 style="color: #f1c40f; margin-top: 0; border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 10px; display: flex; align-items: center; gap: 8px; font-family: 'Outfit', sans-serif;">
                        📜 Biblioteca de Missões
                    </h3>
                    <div id="quest-library-list" class="scroll-list" style="flex: 1; overflow-y: auto;"></div>
                    <button class="btn btn-secondary" style="margin-top: 15px; width: 100%;" onclick="document.getElementById('quest-library-modal').style.display='none'">Fechar</button>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const list = document.getElementById('quest-library-list')!;
        list.innerHTML = '';
        
        list.style.display = 'grid';
        list.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
        list.style.gap = '20px';
        list.style.padding = '10px';
        list.style.width = '100%';
        list.style.boxSizing = 'border-box';
        
        const borderColors: Record<string, string> = { 'Comum': '#bdc3c7', 'Incomum': '#2ecc71', 'Rara': '#3498db', 'Épica': '#9b59b6', 'Lendária': '#f1c40f' };

        QUESTS_DB.forEach(q => {
            const bColor = borderColors[q.rarity] || '#f1c40f';
            list.innerHTML += `
                <div style="display: flex; flex-direction: column; background: rgba(0,0,0,0.3); border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.4); width: 100%; height: 100%; min-height: 200px; box-sizing: border-box; position: relative; border: 1px solid rgba(255,255,255,0.05); transition: transform 0.2s; overflow: visible;">
                    <div style="background: ${bColor}; color: #fff; padding: 8px 15px; font-weight: bold; text-shadow: 1px 1px 0 rgba(0,0,0,0.5); display: flex; justify-content: space-between; align-items: center; border-radius: 8px 8px 0 0;">
                        <span style="font-size: 1.1rem; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; max-width: 80%;">${q.name}</span>
                        <span style="font-size: 0.65rem; background: rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 12px; letter-spacing: 0.5px;">${q.rarity.toUpperCase()}</span>
                    </div>
                    <div style="padding: 15px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                        <p style="font-size: 0.9rem; color: #ddd; margin: 0 0 12px 0; line-height: 1.5;">${q.desc}</p>
                        <div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); margin-top: auto;">
                            <div style="font-size: 0.85rem; color: #2ecc71; font-weight: bold; margin-bottom: 6px; display: flex; align-items: center; gap: 5px;">
                                <span>🎁</span> <span>${q.rewardDesc}</span>
                            </div>
                            <div style="font-size: 0.75rem; color: #888; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 6px; display: flex; justify-content: space-between;">
                                <span>Meta: <b style="color: #aaa;">${q.target}</b></span>
                                <span>Gatilho: <b style="color: #aaa;">${q.triggerType}</b></span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        modal.style.display = 'flex';
    }
}

