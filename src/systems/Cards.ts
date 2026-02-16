import { CARDS_DB } from '../constants';
import type { Player } from '../models/Player';

export class Cards {
    
    static draw(player: Player, silentLog: boolean = false) { 
        const Game = (window as any).Game;
        const Network = (window as any).Network;

        const card = CARDS_DB[Math.floor(Math.random()*CARDS_DB.length)]; 
        player.cards.push(card); 
        
        // Se não for modo silencioso, avisa no log
        if (!silentLog) {
             const isMe = !Network.isOnline || player.id === Network.myPlayerId;
             if (isMe) {
                 Game.log(`🃏 Você obteve a carta: ${card.icon} ${card.name}`);
                 if (Network.isOnline) {
                     // Manda log mascarado pros amigos!
                     Network.sendAction('LOG', { msg: `🃏 ${player.name} obteve uma Carta Misteriosa!` });
                 }
             }
        }
        
        Game.updateHUD(); 
        if(Network.isOnline) Network.syncPlayerState(); 
        
        return card; // Retorna a carta para o Evento poder ver qual foi!
    }
    
    static showPlayerCards(playerId: number) { const Game = (window as any).Game; Game.openBoardCards(playerId); }

    static openTargetSelection(cardId: string) {
        const Game = (window as any).Game;
        const targets = Game.players.filter((p: Player) => p.id !== Game.turn);
        if (targets.length === 0) return alert("Sem alvos disponíveis.");
        
        let list = "Escolha o alvo pelo NÚMERO (ID):\n\n";
        targets.forEach((p: Player) => list += `ID: ${p.id} -> ${p.name}\n`);
        
        const choice = prompt(list + "\nDigite o ID do jogador alvo:");
        if (choice !== null && choice.trim() !== "") {
            const targetId = parseInt(choice);
            const target = Game.players.find((p: any) => p.id === targetId);
            if (target && targetId !== Game.turn) {
                this.activate(cardId, targetId);
            } else { 
                alert("ID inválido! Digite exatamente o número do jogador da lista."); 
            }
        }
    }

    static showBallChoice(balls: any[]) {
        let modal = document.getElementById('ball-choice-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ball-choice-modal';
            modal.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); display:flex; justify-content:center; align-items:center; z-index:9999;";
            document.body.appendChild(modal);
        }
        
        let buttonsHTML = '';
        balls.forEach(b => {
            buttonsHTML += `<button class="btn" style="margin:5px; padding:15px 30px; background:#e74c3c;" onclick="window.Cards.executeMasterCard('${b.id}')">🎒 ${b.name} (x${b.count})</button>`;
        });
        
        buttonsHTML += `<button class="btn btn-secondary" style="margin-top:15px;" onclick="document.getElementById('ball-choice-modal').style.display='none'">Cancelar</button>`;

        modal.innerHTML = `
            <div style="background:#2b2d42; border:3px solid #8d99ae; border-radius:12px; padding:25px; color:white; text-align:center; box-shadow:0 10px 25px rgba(0,0,0,0.8);">
                <h3 style="margin-top:0; color:#edf2f4; border-bottom:1px solid #8d99ae; padding-bottom:10px;">Infundir Pokébola</h3>
                <p>A magia da carta Master Ball garantirá 100% de captura.<br>Qual bola deseja sacrificar?</p>
                <div style="display:flex; flex-direction:column; gap:10px; margin-top:20px; align-items:center;">
                    ${buttonsHTML}
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    }

    static executeMasterCard(ballId: string) {
        const Game = (window as any).Game;
        const Battle = (window as any).Battle;
        const Network = (window as any).Network;
        const player = Game.getCurrentPlayer();

        const cardData = CARDS_DB.find((c: any) => c.id === 'master');
        
        if (!cardData) return;

        // 1. Remove a bola escolhida do inventário
        player.items[ballId]--;
        
        // 2. Remove a carta Master da mão do jogador
        const idx = player.cards.findIndex((c:any) => c.id === 'master');
        if (idx > -1) player.cards.splice(idx, 1);
        
        // 3. Esconde todos os modais da tela
        document.getElementById('ball-choice-modal')!.style.display = 'none';
        document.getElementById('board-cards-modal')!.style.display = 'none';
        document.getElementById('battle-cards-modal')!.style.display = 'none';
        
        Game.updateHUD(); 

        // 4. Cria e envia os logs globais bonitos
        const logMsg = `🃏 ${player.name} ativou a carta: [${cardData.name}]!`;
        const effectLog = `🌟 A magia infundiu a Pokébola! Captura garantida!`;
        const fullMsg = `${logMsg}\n\n${effectLog}`;

        Game.log(logMsg);
        Game.log(effectLog);
        
        Game.showGlobalAlert(fullMsg, player.name, true, false);

        if (Network.isOnline) {
            Network.syncPlayerState();
            Network.sendAction('SHOW_ALERT', { 
                msg: fullMsg, 
                playerName: player.name, 
                endsTurn: false 
            });
            Network.sendAction('LOG', { msg: logMsg });
            Network.sendAction('LOG', { msg: effectLog });
        }
        
        // 5. Aciona o final da batalha com o sucesso absoluto da captura
        Battle.logBattle(`Lançou a Pokébola com precisão mágica!`, true);
        setTimeout(() => {
            Battle.captureSuccess();
        }, 1500);
    }

    static activate(cardId: string, targetId: number | null = null) {
        const Game = (window as any).Game;
        const Battle = (window as any).Battle;
        const Network = (window as any).Network;
        const player: Player = Game.getCurrentPlayer();

        const cardData = CARDS_DB.find(c => c.id === cardId);
        if (!cardData) return;

        if (cardData.type === 'move' && Battle.active) return alert("Cartas MOVE só podem ser usadas no tabuleiro!");
        if (cardData.type === 'battle' && !Battle.active) return alert("Cartas BATTLE só podem ser usadas em batalha!");

        // --- BLOQUEIO DE USO MANUAL ---
        if (cardData.type === 'auto') {
            return alert("Esta carta não pode ser ativada manualmente. Ela protege você automaticamente quando for alvo de outra carta!");
        }

        // --- SISTEMA DE INTERCEPTAÇÃO (INTERFERÊNCIA) ---
        // Verifica se a carta sendo jogada tem um alvo e se esse alvo não é o próprio jogador
        if (targetId !== null && targetId !== player.id) {
            const targetP = Game.players.find((p:any) => p.id === targetId);
            if (targetP) {
                // Procura se o Alvo tem a carta Interferência na mão
                const jamIndex = targetP.cards.findIndex((c:any) => c.id === 'jam');
                if (jamIndex > -1) {
                    
                    // 1. Consome a Interferência do Alvo
                    targetP.cards.splice(jamIndex, 1);
                    
                    // 2. Consome a carta de ataque do Jogador ativo
                    const atkCardIdx = player.cards.findIndex((c:any) => c.id === cardId);
                    if (atkCardIdx > -1) player.cards.splice(atkCardIdx, 1);
                    
                    document.getElementById('board-cards-modal')!.style.display = 'none';
                    Game.updateHUD();

                    // 3. Monta a mensagem épica de bloqueio
                    const jamMsg = `📡 INTERFERÊNCIA!\n\n${targetP.name} tinha um bloqueador de sinal na mochila! A carta [${cardData.name}] de ${player.name} foi totalmente anulada!`;
                    
                    Game.log(jamMsg);
                    Game.showGlobalAlert(jamMsg, player.name, true, false);

                    // 4. Salva no banco de dados que os dois perderam as cartas
                    if (Network.isOnline) {
                        if ((Network as any).syncPlayers) {
                            (Network as any).syncPlayers([player.id, targetP.id]);
                        } else {
                            Network.syncSpecificPlayer(targetP.id);
                            Network.syncPlayerState();
                        }
                        Network.sendAction('SHOW_ALERT', { msg: jamMsg, playerName: player.name, endsTurn: false });
                        Network.sendAction('LOG', { msg: `📡 INTERFERÊNCIA! O ataque de ${player.name} foi bloqueado por ${targetP.name}!` });
                    }
                    
                    return; // <--- O SEGREDO ESTÁ AQUI: Para a função e impede o Switch de rodar!
                }
            }
        }

        let consumed = true; 
        let effectLog = ""; 

        switch (cardId) {
            case 'dice': 
                const val = prompt("Escolha o valor do dado (1-20):");
                const num = parseInt(val || "0");
                if (num >= 1 && num <= 20) { Game.forceDice(num); effectLog = `🎲 O dado foi forçado para cair ${num}!`; } 
                else { alert("Valor inválido."); consumed = false; }
                break;

            case 'reroll': 
                if (Game.hasRolled) {
                    alert("Você já rolou o dado este turno! A carta Re-Roll deve ser usada ANTES de se mover.");
                    consumed = false;
                } else {
                    // Trocado de 20 para 6
                    const r1 = Math.floor(Math.random() * 6) + 1;
                    const r2 = Math.floor(Math.random() * 6) + 1;
                    Game.showDiceChoice(r1, r2);
                    effectLog = `🎲 Re-Roll ativado! ${player.name} rasgou o tecido do tempo e está escolhendo entre dois destinos...`;
                }
                break;

            case 'boost': effectLog = "👟 Tênis ativados! Andará +6 casas no próximo turno."; Game.bonusMovement = 6; break;
            case 'trap': Game.placeTrap(player.x, player.y, player.id); effectLog = `🪤 Uma armadilha foi montada no chão!`; break;

            case 'swap': 
                if (targetId !== null) {
                    const target = Game.players.find((p:any) => p.id === targetId);
                    if (target) {
                        const oldPlayerX = player.x; 
                        const oldPlayerY = player.y;
                        const oldTargetX = target.x;
                        const oldTargetY = target.y;

                        target.x = oldPlayerX; 
                        target.y = oldPlayerY;
                        
                        player.x = oldTargetX; 
                        player.y = oldTargetY;
                        
                        Game.moveVisuals();
                        effectLog = `🔀 A magia aconteceu! A posição de ${player.name} e ${target.name} foi invertida!`;
                        
                        // CORREÇÃO: Envia os dois juntos! Ninguém fica sobreposto no banco.
                        if(Network.isOnline) {
                            if ((Network as any).syncPlayers) {
                                (Network as any).syncPlayers([player.id, target.id]);
                            } else {
                                Network.syncSpecificPlayer(target.id);
                            }
                        }
                        
                        Game.hasRolled = true; 
                        Game.pendingTileEvent = true; 
                    } else { consumed = false; }
                } else { this.openTargetSelection(cardId); consumed = false; }
                break;

            case 'slow': 
                if (targetId !== null) {
                    const target = Game.players.find((p:any) => p.id === targetId);
                    if (target) {
                        target.effects.slow = 3;
                        effectLog = `🕸️ ${target.name} não consegue correr! Está lento por 3 turnos.`;
                        if(Network.isOnline) Network.syncSpecificPlayer(target.id);
                    }
                } else { this.openTargetSelection(cardId); consumed = false; }
                break;

            case 'rocket': 
                if (targetId !== null) {
                    const target = Game.players.find((p:any) => p.id === targetId);
                    if (target) {
                        if (target.cards.length > 0) {
                            const stolenIdx = Math.floor(Math.random() * target.cards.length);
                            const stolenCard = target.cards.splice(stolenIdx, 1)[0];
                            player.cards.push(stolenCard);
                            effectLog = `🚀 BINGO! Uma carta foi roubada e foi parar na mão de ${player.name}!`;
                            
                            // CORREÇÃO: Sincronização atômica para não perder a carta localmente!
                            if(Network.isOnline) {
                                if ((Network as any).syncPlayers) {
                                    (Network as any).syncPlayers([player.id, target.id]);
                                } else {
                                    Network.syncSpecificPlayer(target.id);
                                    Network.syncPlayerState();
                                }
                            }
                        } else { alert("O alvo não tem cartas!"); consumed = false; }
                    }
                } else { this.openTargetSelection(cardId); consumed = false; }
                break;

            case 'curse': 
                if (targetId !== null) {
                    const target = Game.players.find((p:any) => p.id === targetId);
                    if(target) {
                        target.effects.curse = true; 
                        effectLog = `☠️ O ataque de ${target.name} foi reduzido pela metade!`;
                        if(Network.isOnline) Network.syncSpecificPlayer(target.id);
                    }
                } else { this.openTargetSelection(cardId); consumed = false; }
                break;

            case 'trade_fail': 
                if (targetId !== null) {
                    const target = Game.players.find((p:any) => p.id === targetId);
                    if(target) {
                        target.skipTurns += 1; 
                        effectLog = `❌ Sabotagem feita com sucesso! ${target.name} perde a próxima rodada.`;
                        if(Network.isOnline) Network.syncSpecificPlayer(target.id);
                    }
                } else { this.openTargetSelection(cardId); consumed = false; }
                break;

            case 'time': player.effects.extraTurn = true; effectLog = "⏳ O tempo congelou! O jogador terá mais um turno imediato."; break;
            
            case 'new_leader': 
                if(targetId !== null) {
                    const target = Game.players.find((p:any) => p.id === targetId);
                    if (!target) { consumed = false; break; }

                    const hasBadge = target.badges.some((b: boolean) => b === true);
                    if (!hasBadge) {
                        alert(`O jogador ${target.name} não possui nenhuma Insígnia para você roubar!`);
                        consumed = false;
                        break;
                    }
                    
                    const targetTeam = target.getBattleTeam(false);
                    if (targetTeam.length === 0) {
                        alert(`O jogador ${target.name} está sem Pokémons vivos! Tente mais tarde.`);
                        consumed = false;
                        break;
                    }

                    Battle.activeEffects.stealBadgeFrom = target.id; 
                    effectLog = `⚔️ UM DUELO FOI DECLARADO! ${player.name} desafiou ${target.name} para roubar uma de suas Insígnias!`;
                    
                    // Inicia a Batalha Imediatamente!
                    Battle.setup(player, targetTeam[0], true, target.name, 0, target, false, 0, "", 1);

                } else { this.openTargetSelection(cardId); consumed = false; }
                break;

            // BATTLE CARDS
            case 'crit': Battle.activeEffects.crit = true; Battle.logBattle("💥 Dano Dobrado ativado!"); break;
            case 'master': 
                // Impede o uso contra outros jogadores, NPCs ou Ginásios
                if (Battle.isPvP || Battle.isNPC || Battle.isGym) {
                    alert("A carta Master Ball só pode ser usada contra Pokémons Selvagens!");
                    consumed = false;
                    break;
                }
                
                // Mapeia todas as bolas disponíveis na bolsa do jogador
                const balls = [];
                if (player.items['pokeball'] > 0) balls.push({id: 'pokeball', name: 'Pokébola', count: player.items['pokeball']});
                if (player.items['greatball'] > 0) balls.push({id: 'greatball', name: 'Greatball', count: player.items['greatball']});
                if (player.items['ultraball'] > 0) balls.push({id: 'ultraball', name: 'Ultraball', count: player.items['ultraball']});
                
                // Se não tiver nenhuma bola, bloqueia a carta
                if (balls.length === 0) { 
                    alert("Você precisa ter pelo menos uma Pokébola na mochila para usar a magia desta carta!"); 
                    consumed = false; 
                    break; 
                }
                
                // Chama a nossa nova telinha e pausa o uso (consumed = false)
                // A carta só será apagada da mão DEPOIS que ele clicar em uma bola
                this.showBallChoice(balls);
                consumed = false; 
                break;
            
            case 'run': Battle.logBattle("💨 Fugiu com estilo!"); Battle.end(false); break;
            case 'guard': Battle.activeEffects.guard = true; Battle.logBattle("🛡️ Escudo ativado! (-50% dano recebido)"); break;
            case 'focus': Battle.activeEffects.focus = true; Battle.logBattle("🎯 Foco Total! Próximo ataque 4x dano."); break;
            case 'status': Battle.activeEffects.stunOpponent = 2; Battle.logBattle("⚡ Inimigo atordoado por 2 turnos!"); break;
            case 'heal': Battle.activeMon.heal(9999); Battle.updateUI(); Battle.logBattle("💊 HP Totalmente recuperado!"); break;
            case 'counter': Battle.activeEffects.counter = 3; Battle.logBattle("🔁 Contra-ataque preparado (3 turnos)!"); break;
            
            case 'mew': 
                const PokemonClass = (window as any).Pokemon || Game.players[0].team[0].constructor;
                const mew = new PokemonClass(151, Battle.activeMon.level, false);
                mew.name = "Mew (Aliado)";
                mew.heal(9999); // Garante HP cheio
                (mew as any).isTemp = true; 
                
                // 1. Salva o Pokémon atual e a posição dele na equipe
                const originalIndex = player.team.indexOf(Battle.activeMon);
                Battle.activeEffects.mewOriginal = Battle.activeMon;
                Battle.activeEffects.mewIndex = originalIndex;
                
                // 2. Substitui o Pokémon original pelo Mew no time principal
                if(originalIndex !== -1) player.team[originalIndex] = mew;
                
                // 3. Substitui também na HUD visual da Batalha
                const plyIdx = Battle.plyTeamList.indexOf(Battle.activeMon);
                if (plyIdx !== -1) Battle.plyTeamList[plyIdx] = mew;
                
                Battle.activeMon = mew;
                Battle.updateUI();
                Battle.logBattle("🧬 DNA Reagiu! Mew assumiu o lugar do seu Pokémon!");
                break;
            
                case 'destiny': Battle.activeEffects.destiny = true; Battle.logBattle("🌠 Recompensas dobradas se vencer!"); break;

            default: consumed = false;
        }

        if (consumed) {
            const idx = player.cards.findIndex(c => c.id === cardId);
            if (idx > -1) player.cards.splice(idx, 1);
            
            Game.updateHUD(); 
            document.getElementById('board-cards-modal')!.style.display = 'none';
            document.getElementById('battle-cards-modal')!.style.display = 'none';

            // 1. ANÚNCIO GERAL NOMINAL
            let targetName = "";
            if (targetId !== null) {
                const targetObj = Game.players.find((p:any) => p.id === targetId);
                if (targetObj) targetName = targetObj.name;
            } else if (cardData.type === 'battle' && Battle.isPvP && Battle.enemyPlayer) {
                targetName = Battle.enemyPlayer.name;
            }

            let logMsg = `🃏 ${player.name} ativou a carta: [${cardData.name}]!`;
            if (targetName) {
                logMsg = `🃏 ${player.name} usou a carta [${cardData.name}] contra ${targetName}!`;
            }

            // Junta as mensagens para o Alerta na Tela
            let fullMsg = logMsg;
            if (effectLog) fullMsg += `\n\n${effectLog}`;

            Game.log(logMsg);
            if (effectLog) Game.log(effectLog);

            // Abre a pop-up na tela (Exceto no New Leader, pois ele já abre a tela de Batalha!)
            if (cardId !== 'new_leader') {
                Game.showGlobalAlert(fullMsg, player.name, true, false);
            }

            if (Network.isOnline) {
                Network.syncPlayerState();
                
                if (cardId !== 'new_leader') {
                    Network.sendAction('SHOW_ALERT', { 
                        msg: fullMsg, 
                        playerName: player.name, 
                        endsTurn: false 
                    });
                } else {
                    // Para o Novo Líder no Online, só manda os logs laterais para não encavalar com a batalha
                    Network.sendAction('LOG', { msg: logMsg });
                    Network.sendAction('LOG', { msg: effectLog });
                }
            }
        }
    }
}