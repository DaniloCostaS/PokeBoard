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
        const currentPlayer = Game.getCurrentPlayer();
        
        // Filtra para não deixar o jogador usar a carta nele mesmo
        const targets = Game.players.filter((p: any) => p.id !== currentPlayer.id);
        
        if (targets.length === 0) {
            Game.showGlobalAlert("Você está sozinho na sala! Não há alvos disponíveis.", currentPlayer.name, true, false);
            return;
        }

        // Reutilizamos a janela modal de seleção
        const modal = document.getElementById('pkmn-select-modal')!;
        const list = document.getElementById('pkmn-select-list')!;
        
        document.getElementById('select-title')!.innerText = "Selecione o Jogador Alvo:";
        list.innerHTML = '';
        
        targets.forEach((target: any) => {
            const div = document.createElement('div');
            div.className = `mon-select-item`; 
            
            // Coloca a foto de avatar arredondada e o nome do jogador
            div.innerHTML = `
                <img src="${target.avatar}" width="40" style="border-radius: 50%; border: 2px solid #ecf0f1;">
                <b>${target.name}</b> 
                <small style="color:#bdc3c7;">(P${target.id + 1})</small>
            `;
            
            div.onclick = () => {
                modal.style.display = 'none';
                // Chama a ativação da carta passando o ID de quem foi clicado
                this.activate(cardId, target.id); 
            };
            list.appendChild(div);
        });

        // Adiciona um botão de cancelar para o jogador não gastar a carta se clicar sem querer
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary mt-15';
        cancelBtn.innerText = 'Cancelar';
        cancelBtn.onclick = () => { modal.style.display = 'none'; };
        list.appendChild(cancelBtn);

        modal.style.display = 'flex';
    }

    static openPokemonSelectionForCard(cardId: string) {
        const Game = (window as any).Game;
        const player = Game.getCurrentPlayer();
        const modal = document.getElementById('pkmn-select-modal')!;
        const list = document.getElementById('pkmn-select-list')!;
        
        document.getElementById('select-title')!.innerText = "Escolha quem vai comer o Rare Candy:";
        list.innerHTML = '';
        
        player.team.forEach((mon: any, index: number) => {
            const div = document.createElement('div');
            div.className = `mon-select-item`;
            // Mostra o Level e o XP atual para o jogador saber quem vale mais a pena
            div.innerHTML = `<img src="${mon.getSprite()}" width="40"><b>${mon.name}</b> <small>Lv.${mon.level}</small><br><small style="color:#f1c40f">XP: ${mon.currentXp}/${mon.maxXp}</small>`;
            
            div.onclick = () => {
                modal.style.display = 'none';
                // Chama o activate de novo, mas agora o targetId será o ÍNDICE do Pokémon!
                this.activate(cardId, index); 
            };
            list.appendChild(div);
        });

        // Botão para não gastar a carta caso o jogador desista
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary mt-15';
        cancelBtn.innerText = 'Cancelar';
        cancelBtn.onclick = () => { modal.style.display = 'none'; };
        list.appendChild(cancelBtn);

        modal.style.display = 'flex';
    }

    static openEvolutionSelectionForCard(cardId: string) {
        const Game = (window as any).Game;
        const player = Game.getCurrentPlayer();
        const modal = document.getElementById('pkmn-select-modal')!;
        const list = document.getElementById('pkmn-select-list')!;
        
        document.getElementById('select-title')!.innerText = "Escolha quem vai Evoluir:";
        list.innerHTML = '';
        
        player.team.forEach((mon: any, index: number) => {
            // Verifica se a propriedade nextForm NÃO é nula/vazia
            const canEvolve = mon.evoData && mon.evoData.next && mon.evoData.next !== "";
            const div = document.createElement('div');
            
            if (canEvolve) {
                div.className = `mon-select-item`;
                div.innerHTML = `<img src="${mon.getSprite()}" width="40"><b>${mon.name}</b> <small>Lv.${mon.level}</small><br><small style="color:#2ecc71">🧬 Evolução Disponível!</small>`;
                div.onclick = () => {
                    modal.style.display = 'none';
                    this.activate(cardId, index); 
                };
            } else {
                div.className = `mon-select-item disabled`;
                // Deixa cinza quem já está na última forma
                div.innerHTML = `<img src="${mon.getSprite()}" width="40" style="filter: grayscale(100%);"><b>${mon.name}</b> <small>Lv.${mon.level}</small><br><small style="color:#e74c3c">Estágio Máximo</small>`;
            }
            
            list.appendChild(div);
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary mt-15';
        cancelBtn.innerText = 'Cancelar';
        cancelBtn.onclick = () => { modal.style.display = 'none'; };
        list.appendChild(cancelBtn);

        modal.style.display = 'flex';
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

    static startTradeFlow(player: any, target: any) {
        const modal = document.getElementById('pkmn-select-modal')!;
        const list = document.getElementById('pkmn-select-list')!;
        
        // PASSO 1: Escolher o seu Pokémon
        document.getElementById('select-title')!.innerText = `Escolha o SEU Pokémon para enviar a ${target.name}:`;
        list.innerHTML = '';
        
        player.team.forEach((mon: any, index: number) => {
            const div = document.createElement('div');
            div.className = `mon-select-item`;
            div.innerHTML = `<img src="${mon.getSprite()}" width="40"><b>${mon.name}</b> <small>Lv.${mon.level}</small>`;
            div.onclick = () => {
                Cards.continueTradeFlow(player, target, index);
            };
            list.appendChild(div);
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary mt-15';
        cancelBtn.innerText = 'Cancelar';
        cancelBtn.onclick = () => { modal.style.display = 'none'; };
        list.appendChild(cancelBtn);

        modal.style.display = 'flex';
    }

    static continueTradeFlow(player: any, target: any, myChoice: number) {
        const modal = document.getElementById('pkmn-select-modal')!;
        const list = document.getElementById('pkmn-select-list')!;
        
        // PASSO 2: Escolher o Pokémon do Alvo
        document.getElementById('select-title')!.innerText = `Escolha o Pokémon de ${target.name} que você vai pegar:`;
        list.innerHTML = '';
        
        target.team.forEach((mon: any, index: number) => {
            const div = document.createElement('div');
            div.className = `mon-select-item`;
            div.innerHTML = `<img src="${mon.getSprite()}" width="40"><b>${mon.name}</b> <small>Lv.${mon.level}</small>`;
            div.onclick = () => {
                modal.style.display = 'none';
                Cards.executeTrade(player, target, myChoice, index);
            };
            list.appendChild(div);
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary mt-15';
        cancelBtn.innerText = 'Cancelar Voltar';
        cancelBtn.onclick = () => { modal.style.display = 'none'; };
        list.appendChild(cancelBtn);
    }

    static executeTrade(player: any, target: any, myChoice: number, hisChoice: number) {
        const Game = (window as any).Game;
        const Network = (window as any).Network;

        const myMon = player.team[myChoice];
        const hisMon = target.team[hisChoice];

        // 1. Faz a troca das posições na equipe
        player.team[myChoice] = hisMon;
        target.team[hisChoice] = myMon;

        // 2. Remove a carta do inventário manualmente (já que saímos do fluxo normal)
        const idx = player.cards.findIndex((c:any) => c.id === 'troques');
        if (idx > -1) player.cards.splice(idx, 1);
        
        Game.updateHUD(); 
        const boardModal = document.getElementById('board-cards-modal');
        if(boardModal) boardModal.style.display = 'none';

        // 3. Monta e envia os logs globais bonitos
        const effectLog = `🔛 INACREDITÁVEL! ${player.name} forçou uma troca com ${target.name}!\nEnviou: ${myMon.name} ↔️ Recebeu: ${hisMon.name}`;
        const logMsg = `🃏 ${player.name} ativou a carta: [Troca Forçada]!`;
        const fullMsg = `${logMsg}\n\n${effectLog}`;

        Game.log(logMsg);
        Game.log(effectLog);
        Game.showGlobalAlert(fullMsg, player.name, true, false);

        // 4. Salva no Firebase para sincronizar os dois jogadores na mesma hora
        if (Network.isOnline) {
            if ((Network as any).syncPlayers) {
                (Network as any).syncPlayers([player.id, target.id]);
            } else {
                Network.syncSpecificPlayer(target.id);
                Network.syncPlayerState();
            }
            Network.sendAction('SHOW_ALERT', { msg: fullMsg, playerName: player.name, endsTurn: false });
            Network.sendAction('LOG', { msg: logMsg });
            Network.sendAction('LOG', { msg: effectLog });
        }
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
                    if (!target) { consumed = false; break; }

                    // Aplica a maldição no banco de dados do jogador
                    target.effects.curse = true; 
                    
                    effectLog = `😈 MALDIÇÃO! ${target.name} causará apenas METADE do dano e não poderá usar itens na sua próxima luta de Ginásio!`;
                    
                    if (Network.isOnline) {
                        Network.syncSpecificPlayer(target.id);
                    }
                } else { 
                    this.openTargetSelection(cardId); 
                    consumed = false; 
                }
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
                const myBadgesCount = player.badges.filter((b: boolean) => b).length;
                if (myBadgesCount >= 7) {
                    // --- SUBSTITUIU O ALERT ---
                    Game.showGlobalAlert("A Liga Pokémon interveio! É proibido usar a carta 'Novo Líder' quando falta apenas 1 Insígnia para vencer o jogo. Conquiste a última com seu próprio suor!", player.name, true, false);
                    consumed = false;
                    break;
                }

                if(targetId !== null) {
                    const target = Game.players.find((p:any) => p.id === targetId);
                    if (!target) { consumed = false; break; }

                    const stealableBadges = [];
                    for(let i=0; i<8; i++) {
                        if(target.badges[i] && !player.badges[i]) {
                            stealableBadges.push(i);
                        }
                    }

                    if (stealableBadges.length === 0) {
                        // --- SUBSTITUIU O ALERT ---
                        Game.showGlobalAlert(`O jogador ${target.name} não possui nenhuma Insígnia nova para você roubar!`, player.name, true, false);
                        consumed = false;
                        break;
                    }
                    
                    const targetTeam = target.getBattleTeam(false);
                    if (targetTeam.length === 0) {
                        // --- SUBSTITUIU O ALERT ---
                        Game.showGlobalAlert(`O jogador ${target.name} está sem Pokémons vivos! Tente mais tarde.`, player.name, true, false);
                        consumed = false;
                        break;
                    }

                    Battle.activeEffects.stealBadgeFrom = target.id; 
                    effectLog = `⚔️ UM DUELO FOI DECLARADO! ${player.name} desafiou ${target.name} para roubar uma de suas Insígnias!`;
                    
                    Battle.setup(player, targetTeam[0], true, target.name, 0, target, false, 0, "", 1);

                } else { 
                    this.openTargetSelection(cardId); 
                    consumed = false; 
                }
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

            case 'rare_candy':
                if (targetId !== null) {
                    // Como chamamos na função acima, targetId aqui é a posição do Pokémon na equipe!
                    const targetMon = player.team[targetId];
                    if (!targetMon) { consumed = false; break; }

                    // 1. Salva o XP atual para não perder o progresso da barra
                    const preservedXp = targetMon.currentXp;

                    // 2. Chama a função de Level Up (Ela já sorteia os status, cura, e evolui se precisar)
                    targetMon.levelUp(player);

                    // 3. Devolve o XP salvo (e garante que o limite seja o do novo nível)
                    targetMon.currentXp = preservedXp;

                    effectLog = `🍬 Que delícia! O Rare Candy fez efeito mágico!`;

                    // Esconde a janela de cartas de tabuleiro se estiver aberta
                    const boardModal = document.getElementById('board-cards-modal');
                    if (boardModal) boardModal.style.display = 'none';

                    // Salva no banco de dados para ninguém perder o level up
                    if (Network.isOnline) {
                        Network.syncPlayerState();
                    }
                } else {
                    // Se não tem alvo ainda, abre a tela para escolher o Pokémon e NÃO gasta a carta
                    this.openPokemonSelectionForCard(cardId);
                    consumed = false;
                }
                break;

            case 'evoluir':
                if (targetId !== null) {
                    const targetMon = player.team[targetId];
                    // Dupla verificação de segurança
                    if (!targetMon || !targetMon.evoData || !targetMon.evoData.next) { 
                        consumed = false; 
                        break; 
                    }

                    // 1. Salvamos o gatilho de level original
                    const originalTrigger = targetMon.evoData.trigger;
                    
                    // --- CORREÇÃO: "Enganamos" o sistema do Pokémon dizendo que ele evolui no level 1 ---
                    targetMon.evoData.trigger = 1; 
                    // -----------------------------------------------------------------------------------
                    
                    // 3. Chamamos a função oficial de evolução 
                    const evolved = targetMon.checkEvolution(player);
                    
                    if (!evolved) {
                        // Se algo der errado e ele não evoluir, desfazemos o truque
                        targetMon.evoData.trigger = originalTrigger;
                        consumed = false;
                        break;
                    }

                    effectLog = `🧬 Genética alterada! A Evolução Forçada foi um sucesso!`;

                    const boardModal = document.getElementById('board-cards-modal');
                    if (boardModal) boardModal.style.display = 'none';

                    // Salva no banco de dados para os outros verem sua nova forma
                    if (Network.isOnline) {
                        Network.syncPlayerState();
                    }
                } else {
                    // Se não escolheu o alvo ainda, abre a lista
                    this.openEvolutionSelectionForCard(cardId);
                    consumed = false;
                }
                break;

            case 'shiny':
                // Cria a propriedade e define a duração para 3 rodadas
                player.effects.lureShiny = 3; 
                
                effectLog = `✨ Uma aura brilhante envolve ${player.name}! Suas chances de encontrar Pokémons Shinies subiram para 15% pelas próximas 3 rodadas!`;
                
                const boardModalShiny = document.getElementById('board-cards-modal');
                if (boardModalShiny) boardModalShiny.style.display = 'none';

                if (Network.isOnline) {
                    Network.syncPlayerState();
                }
                break;
            
            // =========================================================
            // NOVAS CARTAS
            // =========================================================

            case 'doublexp': 
                player.effects.doubleXp = 5; 
                effectLog = `🚻 O conhecimento flui! Os próximos 5 ganhos de XP de ${player.name} serão em dobro!`; 
                break;
                
            case 'expshare': 
                player.effects.expShare = 5; 
                effectLog = `🤩 Exp Share Ativado! Os próximos 5 ganhos de XP de ${player.name} serão distribuídos para toda a equipe!`; 
                break;

            case 'sniper': 
                Battle.activeEffects.sniper = true; 
                Battle.logBattle("🎯 Sniper Americano! Sua mira está perfeita para este turno."); 
                break;

            case 'bag':
                if (targetId !== null) {
                    const target = Game.players.find((p:any) => p.id === targetId);
                    if (!target) { consumed = false; break; }
                    
                    let totalItems = 0;
                    Object.keys(target.items).forEach(k => totalItems += target.items[k]);
                    
                    if (totalItems === 0) {
                        alert("O alvo não tem itens para perder!");
                        consumed = false;
                        break;
                    }

                    // Calcula a metade dos itens
                    let itemsToRemove = Math.floor(totalItems / 2);
                    if (itemsToRemove < 1) itemsToRemove = 1;

                    let removedCount = 0;
                    // Fura a bolsa e tira itens aleatórios 1 a 1 até a metade sumir
                    while(removedCount < itemsToRemove) {
                        const keys = Object.keys(target.items).filter(k => target.items[k] > 0);
                        if (keys.length === 0) break;
                        const randomKey = keys[Math.floor(Math.random() * keys.length)];
                        target.items[randomKey]--;
                        removedCount++;
                    }

                    effectLog = `🎒 Ouch! A bolsa de ${target.name} foi rasgada! Caiu e perdeu ${removedCount} itens aleatórios pelo caminho.`;
                    if (Network.isOnline) Network.syncSpecificPlayer(target.id);
                } else {
                    this.openTargetSelection(cardId);
                    consumed = false;
                }
                break;

            case 'troques':
                if (targetId !== null) {
                    const target = Game.players.find((p:any) => p.id === targetId);
                    if (!target) { consumed = false; break; }

                    // Redireciona para o nosso fluxo visual bonitinho de 2 passos!
                    Cards.startTradeFlow(player, target);
                    
                    // Colocamos false para a carta não sumir até a troca ser concluída!
                    consumed = false; 
                } else {
                    // Passo Inicial: Escolher o jogador alvo
                    this.openTargetSelection(cardId);
                    consumed = false;
                }
                break;

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
                    
                    // --- CORREÇÃO: Envia o texto para o Histórico (Log lateral) de todos os outros jogadores! ---
                    Network.sendAction('LOG', { msg: logMsg });
                    if (effectLog) Network.sendAction('LOG', { msg: effectLog });
                    // -------------------------------------------------------------------------------------------
                } else {
                    // Para o Novo Líder no Online, só manda os logs laterais para não encavalar com a batalha
                    Network.sendAction('LOG', { msg: logMsg });
                    if (effectLog) Network.sendAction('LOG', { msg: effectLog });
                }
            }
        }
    }
}