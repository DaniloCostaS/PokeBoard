import { MapSystem } from '../../systems/MapSystem';
import { Network } from '../../systems/Network';
import { Cards } from '../../systems/Cards';
import { Battle } from '../../systems/Battle';
import { GameState } from './GameState';
import { GameUI } from './GameUI';
import { GameEvents } from './GameEvents';

export class GameMovement {

    static forceDice(val: number) {
        GameState.forcedDiceValue = val;
        this.rollDice();
    }

    static debugMove() {
        if (!GameState.canAct()) return;
        const input = document.getElementById('debug-input') as HTMLInputElement;
        const result = parseInt(input.value) || 1;
        GameUI.log(`[DEBUG] Forçando ${result} passos.`);

        if (Network.isOnline) {
            Network.sendAction('ROLL', { result: result });
            this.animateDice(result, Network.myPlayerId);
            return;
        }

        this.animateDice(result, 0);
    }

    static async rollDice() {
        if (!GameState.canAct() || GameState.hasRolled) return;

        const p = GameState.getCurrentPlayer();
        const badgesCount = p.badges.filter((b: boolean) => b).length;

        if (badgesCount === 8) {
            if (GameState.globalChampion) {
                const querLutar = confirm(`🏆 VOCÊ TEM AS 8 INSÍGNIAS!\n\nDeseja desafiar o Campeão Atual (${GameState.globalChampion.name}) agora?\n\n(Regras: Sem itens, sem cartas. Vencer = Fim de Jogo!)\n\nClique OK para Lutar ou Cancelar para rolar o dado e se preparar mais.`);

                if (querLutar) {
                    const BattleObj = (window as any).Battle || Battle;
                    BattleObj.startChampionBattle(p, GameState.globalChampion);
                    return;
                }
            } else {
                alert("🏆 PARABÉNS! Você conseguiu as 8 Insígnias e é o Primeiro Campeão da Liga!");
                const NetworkObj = (window as any).Network;
                if (NetworkObj && NetworkObj.isOnline) {
                    NetworkObj.saveGlobalChampion(p);
                    NetworkObj.sendAction('GAME_WIN', { winnerId: p.id });
                }
                GameEvents.triggerVictory(p.id);
                return;
            }
        }

        GameState.hasRolled = true;
        let result = 0;

        if (GameState.forcedDiceValue > 0) {
            result = GameState.forcedDiceValue;
            GameState.forcedDiceValue = 0;
            GameUI.log("🔮 Dado Mágico usado!");
        } else {
            if (p.effects.slow && p.effects.slow > 0) {
                result = 1;
                p.effects.slow--;
                GameUI.log("🕸️ Lentidão! Rolou apenas 1d1.");
            } else {
                result = Math.floor(Math.random() * 6) + 1;
            }
        }

        if (p.effects.escapedGym) {
            p.effects.escapedGym = false;
            const NetworkObjForce = (window as any).Network || Network;
            if (NetworkObjForce.isOnline) NetworkObjForce.syncPlayerState();
        }

        const NetworkObj = (window as any).Network || Network;
        if (NetworkObj.isOnline) {
            NetworkObj.sendAction('ROLL', { result: result });
        }

        const playerId = NetworkObj.isOnline ? NetworkObj.myPlayerId : GameState.turn;
        this.animateDice(result, playerId);
    }

    static async animateDice(result: number, playerId: number) {
        // Nova animação visual no centro do tabuleiro
        await this.showDiceAnimation(result);

        const die = document.getElementById('d20-display')!;
        for (let i = 0; i < 5; i++) {
            die.innerText = `🎲 ${Math.floor(Math.random() * 6) + 1}`;
            await new Promise(r => setTimeout(r, 50));
        }
        die.innerText = `🎲 ${result}`;

        GameUI.log(`${GameState.players[playerId].name} tirou ${result}`);

        const NetworkObj = (window as any).Network || Network;
        const ev = GameState.currentGlobalEvent?.id;

        if (ev === 'SPATIAL_RIFT') {
            const p = GameState.players[playerId];
            const totalTiles = MapSystem.size * MapSystem.size;
            const randomIdx = Math.floor(Math.random() * totalTiles);
            const targetCoord = MapSystem.getCoord(randomIdx);

            p.x = targetCoord.x;
            p.y = targetCoord.y;
            GameUI.log(`🌌 FENDA ESPACIAL! ${p.name} foi teletransportado!`);
            GameUI.moveVisuals();

            if (!NetworkObj.isOnline || playerId === NetworkObj.myPlayerId) {
                GameEvents.handleTile(p);
                if (NetworkObj.isOnline) NetworkObj.syncPlayerState();
            }
            return;
        }

        if (ev === 'DOUBLE_STEP') {
            result *= 2;
            GameUI.log(`🏃 VENTO A FAVOR! Movimento dobrado para ${result}!`);
        } else if (ev === 'QUICKSAND') {
            result = Math.max(1, Math.floor(result / 2));
            GameUI.log(`⏳ AREIA MOVEDIÇA! Movimento reduzido para ${result}!`);
        }

        if (!NetworkObj.isOnline || playerId === NetworkObj.myPlayerId) {
            const p = GameState.players[playerId];
            const aliveTeam = p.team.filter(m => !m.isFainted());
            const xpGain = result;

            if (aliveTeam.length > 0) {
                const luckyMon = aliveTeam[Math.floor(Math.random() * aliveTeam.length)];
                luckyMon.gainXp(xpGain, p);
            }
        }

        this.movePlayerLogic(result, playerId);
    }

    static async showDiceAnimation(result: number) {
        const board = document.getElementById('board-wrapper');
        if (!board) return;

        const container = document.createElement('div');
        container.className = 'dice-container dice-throwing';

        const shadow = document.createElement('div');
        shadow.className = 'dice-shadow';

        const dice3d = document.createElement('div');
        dice3d.className = 'dice-3d';

        const pipPatterns: Record<number, number[]> = {
            1: [5],
            2: [1, 9],
            3: [1, 5, 9],
            4: [1, 3, 7, 9],
            5: [1, 3, 5, 7, 9],
            6: [1, 3, 4, 6, 7, 9]
        };

        const createFace = (role: string, value: number) => {
            const pattern = pipPatterns[value];
            const activePips = new Set(pattern);
            const pips = pattern ? Array.from({ length: 9 }, (_, index) => {
                const position = index + 1;
                return `<span class="dice-pip${activePips.has(position) ? ' is-active' : ''}"></span>`;
            }).join('') : `<span class="dice-number">${value}</span>`;

            return `<div class="dice-face face-${role}" aria-label="Dado ${value}"><div class="dice-pips">${pips}</div></div>`;
        };

        const visibleValues = [1, 2, 3, 4, 5, 6].filter(value => value !== result);
        const faces = [
            { role: 'top', value: result },
            { role: 'front', value: visibleValues[0] },
            { role: 'right', value: visibleValues[1] },
            { role: 'back', value: visibleValues[2] },
            { role: 'left', value: visibleValues[3] },
            { role: 'bottom', value: visibleValues[4] }
        ];

        const finalX = -58 + ((Math.random() * 4) - 2);
        const finalY = -26 + ((Math.random() * 6) - 3);
        const finalZ = -10 + ((Math.random() * 8) - 4);
        const finalTransform = `rotateX(${finalX}deg) rotateY(${finalY}deg) rotateZ(${finalZ}deg)`;

        dice3d.innerHTML = `<div class="dice-mass"></div>${faces.map(face => createFace(face.role, face.value)).join('')}`;

        container.appendChild(dice3d);
        board.appendChild(shadow);
        board.appendChild(container);

        setTimeout(() => {
            dice3d.style.transform = finalTransform;
        }, 100);

        await new Promise(r => setTimeout(r, 1900));

        container.remove();
        shadow.remove();
    }

    static async movePlayerLogic(steps: number, pId: number) {
        const p = GameState.players[pId];
        const totalTiles = MapSystem.size * MapSystem.size;
        const NetworkObj = (window as any).Network || Network;

        if (GameState.bonusMovement > 0) {
            steps += GameState.bonusMovement;
            GameState.bonusMovement = 0;
            GameUI.log("👟 Bônus de movimento aplicado!");
        }

        let hitTrap = false;
        let stepsWalked = 0;

        for (let i = 0; i < steps; i++) {
            let currentIdx = MapSystem.getIndex(p.x, p.y);
            const isMoonwalking = p.effects && (p.effects.moonwalker || 0) > 0;

            if (isMoonwalking) {
                currentIdx--;
                if (currentIdx < 0) currentIdx = totalTiles - 1;
                
                const QuestManagerObj = (window as any).QuestManager || (window as any).Game?.QuestManager || window.QuestManager;
                if (QuestManagerObj) QuestManagerObj.resetProgress(p, 'WALK_STEPS');
            } else {
                currentIdx++;
                stepsWalked++;
                if (currentIdx >= totalTiles) {
                    currentIdx = 0;

                    if (!NetworkObj.isOnline || pId === NetworkObj.myPlayerId) {
                        let lapGold = 500;
                        if (GameState.currentGlobalEvent?.id === 'GOLD_RUSH') lapGold *= 2;
                        p.gold += lapGold;

                        const CardsObj = (window as any).Cards || Cards;
                        CardsObj.draw(p);
                        CardsObj.draw(p);

                        p.team.forEach(mon => {
                            if (mon.level < 25) {
                                mon.levelUp(p);
                            }
                        });

                        GameUI.sendGlobalLog(`🚩 ${p.name} completou uma volta! Ganhou 500G, 2 Cartas e +1 Level para todo o time!`);
                        GameUI.sendGlobalLog(`💰 [Extrato] ${p.name} recebeu +500G (Volta no Tabuleiro).`);
                        GameUI.sendGlobalLog(`💰 [Extrato] Novo Saldo: ${p.gold}G.`);

                        GameUI.updateHUD();
                        if (NetworkObj.isOnline) NetworkObj.syncPlayerState();
                    }
                }
            }

            const nextCoord = MapSystem.getCoord(currentIdx);
            p.x = nextCoord.x;
            p.y = nextCoord.y;
            this.performVisualStep(pId, p.x, p.y);
            
            if (p.questTrackers && p.questTrackers.biomesVisited) {
                const currentTileType = MapSystem.grid[p.y][p.x].toString();
                if (!p.questTrackers.biomesVisited.includes(currentTileType)) {
                    p.questTrackers.biomesVisited.push(currentTileType);
                    const QuestManagerObj = (window as any).QuestManager || (window as any).modules?.QuestManager;
                    if (QuestManagerObj) QuestManagerObj.checkProgress(p, 'VISIT_BIOMES', 1);
                }
            }

            await new Promise(r => setTimeout(r, 150));

            const trapIdx = GameState.traps.findIndex(t => t.x === p.x && t.y === p.y && t.ownerId !== p.id);
            if (trapIdx > -1) {
                hitTrap = true;

                const trap = GameState.traps[trapIdx];
                const owner = GameState.players.find(op => op.id === trap.ownerId);

                let stolenGold = 0;
                if (p.gold > 0) {
                    let tax = 0.20;
                    if (GameState.currentGlobalEvent?.id === 'BLOOD_MOON') tax = 0.40;

                    stolenGold = Math.floor(p.gold * tax);
                    if (stolenGold === 0 && p.gold > 0) stolenGold = 1;

                    p.gold -= stolenGold;
                    if (owner) owner.gold += stolenGold;
                }

                p.skipTurns += 1;
                GameState.traps.splice(trapIdx, 1);
                GameUI.renderTraps();
                GameUI.updateHUD();

                if (!NetworkObj.isOnline || pId === NetworkObj.myPlayerId) {
                    if (NetworkObj.isOnline) {
                        if (owner && stolenGold > 0) {
                            NetworkObj.syncPlayers([p.id, owner.id]);
                        } else {
                            NetworkObj.syncPlayerState();
                        }
                    }

                    if (NetworkObj.isOnline) {
                        NetworkObj.sendAction('SYNC_TRAPS', { traps: GameState.traps });
                    }

                    let msg = `🪤 ${p.name} caiu numa armadilha! Punição: +1 turno sem jogar`;
                    if (stolenGold > 0 && owner) {
                        msg += ` e perdeu ${stolenGold}G para ${owner.name}!`;
                        GameUI.sendGlobalLog(`💰 [Extrato] Transferência de ${stolenGold}G de ${p.name} para ${owner.name} (Armadilha).`);
                        GameUI.sendGlobalLog(`💰 [Extrato] Novo Saldo de ${p.name}: ${p.gold}G.`);
                        GameUI.sendGlobalLog(`💰 [Extrato] Novo Saldo de ${owner.name}: ${owner.gold}G.`);
                    } else {
                        msg += `!`;
                    }
                    GameUI.sendGlobalLog(msg);

                    GameState.pendingTileEvent = true;
                    GameUI.showGlobalAlert(msg, p.name, true, false);

                    if (NetworkObj.isOnline) {
                        NetworkObj.sendAction('SHOW_ALERT', { msg: msg, playerName: p.name, endsTurn: false });
                    }
                }
                break;
            }
        }

        if (stepsWalked > 0) {
            const QuestManagerObj = (window as any).QuestManager || (window as any).modules?.QuestManager;
            if (QuestManagerObj) QuestManagerObj.checkProgress(p, 'WALK_STEPS', stepsWalked);
        }

        if (!NetworkObj.isOnline || pId === NetworkObj.myPlayerId) {
            if (p.effects && (p.effects.moonwalker || 0) > 0) {
                p.effects.moonwalker!--;
                if (p.effects.moonwalker === 0) {
                    GameUI.log(`💃 O efeito Moon Walker de ${p.name} acabou!`);
                }
            }

            if (!hitTrap) {
                GameEvents.handleTile(p);
            }
            if (NetworkObj.isOnline) NetworkObj.syncPlayerState();
        }
    }

    static performVisualStep(pId: number, x: number, y: number) {
        const p = GameState.players[pId];
        if (!p) return;
        p.x = x;
        p.y = y;
        const tile = document.getElementById(`tile-${x}-${y}`);
        if (tile) {
            tile.classList.add('step-highlight');
            GameUI.moveVisuals();
            setTimeout(() => tile.classList.remove('step-highlight'), 300);
        }
    }

    // ==========================================
    // MODAIS DA CARTA RE-ROLL (DADOS)
    // ==========================================
    static showDiceChoice(r1: number, r2: number) {
        let modal = document.getElementById('dice-choice-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'dice-choice-modal';
            modal.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); display:flex; justify-content:center; align-items:center; z-index:9999;";
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div style="background:#2b2d42; border:3px solid #8d99ae; border-radius:12px; padding:25px; color:white; text-align:center; box-shadow:0 10px 25px rgba(0,0,0,0.8);">
                <h3 style="margin-top:0; color:#edf2f4; border-bottom:1px solid #8d99ae; padding-bottom:10px;">Re-Roll! Escolha seu destino:</h3>
                <div style="display:flex; justify-content:center; gap:20px; margin-top:20px;">
                    <button class="btn" style="font-size:2rem; padding:20px 40px; background:#e74c3c; border:none; border-radius:8px; color:white; cursor:pointer;" onclick="window.Game.chooseDice(${r1})">🎲 ${r1}</button>
                    <button class="btn" style="font-size:2rem; padding:20px 40px; background:#3498db; border:none; border-radius:8px; color:white; cursor:pointer;" onclick="window.Game.chooseDice(${r2})">🎲 ${r2}</button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    }

    static chooseDice(val: number) {
        const modal = document.getElementById('dice-choice-modal');
        if (modal) modal.style.display = 'none';
        this.forceDice(val);
    }
}
