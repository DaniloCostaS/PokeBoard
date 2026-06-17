import { CARDS_DB, TILE } from '../../constants';
import type { Player } from '../../models/Player';
import { CardManager } from './CardManager';
import { MapSystem } from '../../systems/MapSystem';
import { CardUI } from './CardUI';
import { GLOBAL_EVENTS } from '../../constants/globalEvents';
import { MAPA_MEGAS } from '../../constants/mapaMegas';
import { POKEDEX } from '../../constants/pokedex';
import { SupabaseDataStore } from '../network/SupabaseDataStore';

export class CardEffects {
    static async checkAutoDefense(attacker: Player, target: Player, incomingCardId: string, incomingCardName: string): Promise<boolean> {
        const Game = (window as any).Game;
        const Network = (window as any).Network;

        if (incomingCardId === 'ash_goodbye') return false;

        let priorityList: string[] = [];

        switch (incomingCardId) {
            case 'new_leader': priorityList = ['old_leader', 'jam']; break;
            case 'bag': priorityList = ['silvertape', 'jam']; break;
            case 'troques': priorityList = ['no_troques', 'jam']; break;
            case 'steal_mega_stone': priorityList = ['no_steal_mega', 'jam']; break;
            default: priorityList = ['jam']; break;
        }

        for (const defenseId of priorityList) {
            const defenseCardIndex = target.cards.findIndex((c: any) => c.id === defenseId && !c.isProtected);

            if (defenseCardIndex > -1) {
                target.cards.splice(defenseCardIndex, 1);
                const attackCardIndex = attacker.cards.findIndex((c: any) => c.id === incomingCardId);
                if (attackCardIndex > -1) attacker.cards.splice(attackCardIndex, 1);

                Game.sendGlobalLog(`🃏 [Extrato] ${target.name} usou uma defesa automática. Total: ${target.cards.length}`);
                Game.sendGlobalLog(`🃏 [Extrato] ${attacker.name} teve sua carta bloqueada. Total: ${attacker.cards.length}`);

                attacker.effects = attacker.effects || {};
                attacker.effects.offensiveCardsUsed = (attacker.effects.offensiveCardsUsed || 0) + 1;
                if (!attacker.stats) attacker.stats = { cardsUsed: 0, cardsSuffered: 0, effectsReceived: {}, cardsDefended: {}, turnsLost: 0 };
                attacker.stats.cardsUsed = (attacker.stats.cardsUsed || 0) + 1;

                const boardModal = document.getElementById('board-cards-modal');
                if (boardModal) boardModal.style.display = 'none';
                Game.updateHUD();

                let blockMsg = "";
                let logMsg = "";
                if (defenseId === 'silvertape') {
                    blockMsg = `🚫 SILVER TAPE!\n\n${target.name} usou uma fita mágica e remendou a bolsa instantaneamente! A carta [${incomingCardName}] falhou.`;
                    logMsg = `🚫 ${target.name} anulou o rasgo na bolsa com Silver Tape!`;
                } else if (defenseId === 'no_troques') {
                    blockMsg = `💝 POKÉMON FIEL!\n\nO Pokémon de ${target.name} se recusou a obedecer a troca! A carta [${incomingCardName}] foi ignorada.`;
                    logMsg = `🚫 ${target.name} bloqueou a troca com Pokémon Fiel!`;
                } else if (defenseId === 'old_leader') {
                    blockMsg = `👑 LÍDER VELHO!\n\nA tradição falou mais alto! ${target.name} invocou sua autoridade veterana e cancelou o desafio de [${incomingCardName}].`;
                    logMsg = `🚫 ${target.name} impediu o roubo de insígnia com Líder Velho!`;
                } else if (defenseId === 'no_steal_mega') {
                    blockMsg = `🌑 BOLINHA PERDIDA!\n\n${target.name} tinha uma bolinha de gude no bolso que desviou o raio destruidor! A carta [${incomingCardName}] falhou miseravelmente.`;
                    logMsg = `🚫 ${target.name} salvou sua Mega Pedra com uma Bolinha Perdida!`;
                } else {
                    blockMsg = `📡 INTERFERÊNCIA!\n\n${target.name} tinha um bloqueador de sinal! A carta [${incomingCardName}] de ${attacker.name} foi anulada!`;
                    logMsg = `📡 INTERFERÊNCIA! A carta [${incomingCardName}] de ${attacker.name} foi bloqueada por ${target.name}!`;
                }

                Game.log(logMsg);
                Game.showGlobalAlert(blockMsg, attacker.name, true, false);

                // Log no novo painel de ataques
                const GameUIClass = (window as any).GameUI || Game;
                if (GameUIClass.recordCardLog) {
                    GameUIClass.recordCardLog(attacker.name, `${incomingCardName} (BLOQUEADA)`, target.name);
                }

                const defenseNames: Record<string, string> = {
                    'jam': 'Interferência', 'silvertape': 'Silver Tape',
                    'no_troques': 'Pokémon Fiel', 'old_leader': 'Líder Velho',
                    'no_steal_mega': 'Do nada bolinha perdida'
                };
                const defenseLabel = defenseNames[defenseId] || defenseId;

                if (!target.stats) target.stats = { cardsUsed: 0, cardsSuffered: 0, effectsReceived: {}, cardsDefended: {}, turnsLost: 0 };
                if (!target.stats.cardsDefended) target.stats.cardsDefended = {};

                target.stats.cardsDefended[defenseLabel] = (target.stats.cardsDefended[defenseLabel] || 0) + 1;

                if (Network.isOnline) {
                    try {
                        Network.syncPlayers([attacker.id, target.id]);
                    } catch (e) {
                        console.error('[checkAutoDefense] Erro ao sincronizar bloqueio:', e);
                    }
                    Network.sendAction('SHOW_ALERT', { msg: blockMsg, playerName: attacker.name, endsTurn: false });
                    Network.sendAction('LOG', { msg: logMsg });
                }
                return true;
            }
        }
        return false;
    }

    static async executeTrade(player: any, target: any, myChoice: number, hisChoice: number) {
        const Game = (window as any).Game;
        const Network = (window as any).Network;

        const myMon = player.team[myChoice];
        const hisMon = target.team[hisChoice];

        player.team[myChoice] = hisMon;
        target.team[hisChoice] = myMon;

        const idx = player.cards.findIndex((c: any) => c.id === 'troques');
        if (idx > -1) player.cards.splice(idx, 1);

        if (!player.stats) player.stats = { cardsUsed: 0, cardsSuffered: 0, effectsReceived: {}, cardsDefended: {}, turnsLost: 0 };
        player.stats.cardsUsed = (player.stats.cardsUsed || 0) + 1;

        if (!target.stats) target.stats = { cardsUsed: 0, cardsSuffered: 0, effectsReceived: {}, cardsDefended: {}, turnsLost: 0 };
        if (!target.stats.effectsReceived) target.stats.effectsReceived = {};

        const weight = CardManager.getRarityWeight('Épica');
        target.stats.cardsSuffered = (target.stats.cardsSuffered || 0) + weight;
        target.stats.effectsReceived['Troca forçada'] = (target.stats.effectsReceived['Troca forçada'] || 0) + 1;

        Game.updateHUD();
        const boardModal = document.getElementById('board-cards-modal');
        if (boardModal) boardModal.style.display = 'none';

        const effectLog = `INACREDITAVEL! ${player.name} forcou uma troca com ${target.name}!\nEnviou: ${myMon.name} - Recebeu: ${hisMon.name}`;
        const logMsg = `🃏 ${player.name} ativou a carta: [Troca Forcada]!`;
        const fullMsg = `${logMsg}\n\n${effectLog}`;

        Game.log(logMsg);
        Game.log(effectLog);
        Game.showGlobalAlert(fullMsg, player.name, true, false);

        const GameUIClass = (window as any).GameUI || Game;
        if (GameUIClass.recordCardLog) {
            GameUIClass.recordCardLog(player.name, "Troca Forçada", target.name);
        }

        if (Network.isOnline) {
            try {
                Network.syncPlayers([player.id, target.id]);
            } catch (e) { console.error('[executeTrade] Sync Atômico:', e); }

            Network.sendAction('SHOW_ALERT', { msg: fullMsg, playerName: player.name, endsTurn: false });
            Network.sendAction('LOG', { msg: logMsg });
            Network.sendAction('LOG', { msg: effectLog });
        }
    }

    static executeNPCBattleTrade(player: any, myChoice: number, hisChoice: number) {
        const Game = (window as any).Game;
        const Battle = (window as any).Battle;
        const Network = (window as any).Network;

        const myMon = player.team[myChoice];
        const hisMon = Battle.oppTeamList[hisChoice];

        player.team[myChoice] = hisMon;
        Battle.oppTeamList[hisChoice] = myMon;

        const plyListIdx = Battle.plyTeamList.indexOf(myMon);
        if (plyListIdx !== -1) {
            Battle.plyTeamList[plyListIdx] = hisMon;
        }

        if (Battle.activeMon === myMon) {
            Battle.activeMon = hisMon;
            Battle.tryTriggerMegaEvolution("reagiu ao novo dono");
        }

        if (Battle.opponent === hisMon) {
            Battle.opponent = myMon;
            Battle.tryOpponentMegaEvolution("reagiu ao novo time");
        }

        const idx = player.cards.findIndex((c: any) => c.id === 'illegal_adoption');
        if (idx > -1) player.cards.splice(idx, 1);

        Game.updateHUD();
        Battle.updateUI();

        const battleCardsModal = document.getElementById('battle-cards-modal');
        if (battleCardsModal) battleCardsModal.style.display = 'none';

        const effectLog = `SEQUESTRO RELAMPAGO! ${player.name} trocou seu ${myMon.name} pelo ${hisMon.name} adversario no meio da luta!`;
        const logMsg = `🃏 ${player.name} ativou a carta: [Sequestro Relampago]!`;
        const fullMsg = `${logMsg}\n\n${effectLog}`;

        Game.log(logMsg);
        Game.log(effectLog);
        Battle.logBattle(effectLog, true);
        Game.showGlobalAlert(fullMsg, player.name, true, false);

        const GameUIClass = (window as any).GameUI || Game;
        if (GameUIClass.recordCardLog) {
            GameUIClass.recordCardLog(player.name, "Sequestro Relâmpago", "Inimigo");
        }

        if (Network.isOnline) {
            Network.syncPlayerState();
            Network.sendAction('SHOW_ALERT', { msg: fullMsg, playerName: player.name, endsTurn: false });
            Network.sendAction('LOG', { msg: logMsg });
            Network.sendAction('LOG', { msg: effectLog });
            Network.sendAction('BATTLE_UPDATE', { msg: effectLog });
        }
    }

    static executeMasterCard(ballId: string) {
        const Game = (window as any).Game;
        const Battle = (window as any).Battle;
        const Network = (window as any).Network;
        const player = Game.getCurrentPlayer();

        const cardData = CARDS_DB.find((c: any) => c.id === 'master');
        if (!cardData) return;

        player.items[ballId]--;

        const idx = player.cards.findIndex((c: any) => c.id === 'master');
        if (idx > -1) {
            player.cards.splice(idx, 1);
            Game.sendGlobalLog(`🃏 [Extrato] ${player.name} usou uma carta Master Ball. Total: ${player.cards.length}`);
        }

        document.getElementById('ball-choice-modal')!.style.display = 'none';
        document.getElementById('board-cards-modal')!.style.display = 'none';
        document.getElementById('battle-cards-modal')!.style.display = 'none';

        Game.updateHUD();

        const logMsg = `🃏 ${player.name} ativou a carta: [${cardData.name}]!`;
        const effectLog = `🌟 A magia infundiu a Pokébola! Captura garantida!`;
        const fullMsg = `${logMsg}\n\n${effectLog}`;

        Game.log(logMsg);
        Game.log(effectLog);
        Game.showGlobalAlert(fullMsg, player.name, true, false);

        const GameUIClass = (window as any).GameUI || Game;
        if (GameUIClass.recordCardLog) {
            const targetName = (Battle.opponent ? Battle.opponent.name : "Selvagem");
            GameUIClass.recordCardLog(player.name, cardData.name, targetName);
        }

        if (Network.isOnline) {
            Network.syncPlayerState();
            Network.sendAction('SHOW_ALERT', { msg: fullMsg, playerName: player.name, endsTurn: false });
            Network.sendAction('LOG', { msg: logMsg });
            Network.sendAction('LOG', { msg: effectLog });
        }

        Battle.logBattle(`Lançou a Pokébola com precisão mágica!`, true);
        setTimeout(() => { Battle.captureSuccess(); }, 1500);
    }

    static unprotectCard(pId: number, index: number, refreshUI: boolean = true) {
        const Game = (window as any).Game;
        const Network = (window as any).Network;
        const player = Game.players.find((p: any) => p.id === pId);

        if (!player || !player.cards || index < 0 || index >= player.cards.length) return;

        player.cards[index].isProtected = false;

        Game.log(`🔓 ${player.name} removeu a proteção de uma carta.`);
        
        const privateMsg = `🔓 Você removeu a proteção da carta [${player.cards[index].name}].||PRIVATE:${player.id}`;
        Game.log(privateMsg);
        if (Network.isOnline) Network.sendAction('LOG', { msg: privateMsg });

        if (Network.isOnline) {
            Network.syncPlayerState();
        }

        // Refresh UI if requested
        if (refreshUI) Game.openBoardCards(pId);
    }

    static async activate(cardId: string, targetId: any = null) {
        const Game = (window as any).Game;
        const Battle = (window as any).Battle;
        const Network = (window as any).Network;
        const player: Player = Game.getCurrentPlayer();

        if ((window as any).Battle && (window as any).Battle.isChampion) {
            return alert("🚫 As regras da Liga proíbem o uso de Cartas no Desafio do Campeão!");
        }

        const cardData = CARDS_DB.find(c => c.id === cardId);
        if (!cardData) return;

        const usableCardIndex = player.cards.findIndex((c: any) => c.id === cardId && !c.isProtected);
        if (usableCardIndex === -1 && cardId !== 'card_protector') {
            return alert("Esta carta está sob proteção do Cadeado e não pode ser usada!");
        }

        if (cardData.type === 'move' && Battle.active) return alert("Cartas MOVE só podem ser usadas no tabuleiro!");

        // Bloquear qualquer carta (exceto auto) se o turno ainda não foi iniciado
        if (cardData.type !== 'auto') {
            if (Network && Network.isOnline && !Game.turnStarted) {
                return alert('⏳ Clique em "Iniciar Turno" antes de usar cartas!');
            }
        }

        if (cardData.type === 'battle') {
            if (!Battle.active) return alert("Cartas BATTLE só podem ser usadas em batalha!");
            if (!Battle.isPvP && Battle.activeMon && ((Battle.activeMon as any).isTemp || (Battle.activeMon as any).isMegaEvolution)) {
                return alert("🧬 Seu parceiro já atingiu o poder máximo! Cartas de batalha estão bloqueadas para Mega Evoluções (ou Mew) no PvE.");
            }
        }

        if (cardData.type === 'auto') {
            return alert("Esta carta não pode ser ativada manualmente. Ela protege você automaticamente quando for alvo de outra carta!");
        }

        const actualTargetId = (typeof targetId === 'object' && targetId !== null) ? targetId.targetId : targetId;
        const offensiveCards = ['swap', 'slow', 'rocket', 'curse', 'trade_fail', 'new_leader', 'bag', 'troques', 'michael', 'steal_mega_stone', 'ash_goodbye'];

        if (offensiveCards.includes(cardId)) {
            if (!player.effects) player.effects = {};
            if ((player.effects.offensiveCardsUsed || 0) >= 3) {
                alert("Você atingiu o limite máximo de 3 cartas contra outros jogadores neste turno! Você só pode usar cartas de benefício próprio agora.");
                return;
            }
        }

        if (offensiveCards.includes(cardId) && actualTargetId !== null && actualTargetId !== player.id) {
            const targetP = Game.players.find((p: any) => p.id === actualTargetId);

            if (targetP) {
                const wasBlocked = await this.checkAutoDefense(player, targetP, cardId, cardData.name);
                if (wasBlocked) return;
                player.effects.offensiveCardsUsed = (player.effects.offensiveCardsUsed || 0) + 1;
            }
        }

        if (cardData.rarity === 'Lendária') {
            if (player.effects && player.effects.playedLegendary && !player.effects.ashGoodbyeRemaining) {
                alert("Você já utilizou uma carta Lendária nesta partida. Apenas um milagre por jogo é permitido!");
                return;
            }
        }

        let consumed = true;
        let effectLog = "";
        let alreadyRemoved = false;
        let requiresGlobalSync = false;
        let skipBottomSync = false;

        if (cardData.type === 'global') {
            const idx = player.cards.findIndex(c => c.id === cardId);
            if (idx > -1) {
                player.cards.splice(idx, 1);
                alreadyRemoved = true;
            }
        }

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
                    const r1 = Math.floor(Math.random() * 6) + 1;
                    let r2 = Math.floor(Math.random() * 6) + 1;
                    while (r2 === r1) {
                        r2 = Math.floor(Math.random() * 6) + 1;
                    }
                    Game.showDiceChoice(r1, r2);
                    effectLog = `🎲 Re-Roll ativado! ${player.name} rasgou o tecido do tempo e está escolhendo entre dois destinos...`;
                }
                break;

            case 'boost': effectLog = "👟 Tênis ativados! Andará +6 casas no próximo turno."; Game.bonusMovement = 6; break;
            case 'trap': Game.placeTrap(player.x, player.y, player.id); effectLog = `🪤 Uma armadilha foi montada no chão!`; break;

            case 'swap':
                if (actualTargetId !== null) {
                    const target = Game.players.find((p: any) => p.id === actualTargetId);
                    if (target) {
                        const oldPlayerX = player.x; const oldPlayerY = player.y;
                        const oldTargetX = target.x; const oldTargetY = target.y;
                        target.x = oldPlayerX; target.y = oldPlayerY;
                        player.x = oldTargetX; player.y = oldTargetY;
                        Game.moveVisuals();
                        effectLog = `🔀 A magia aconteceu! A posição de ${player.name} e ${target.name} foi invertida!`;
                        Game.hasRolled = true; Game.pendingTileEvent = true;
                        requiresGlobalSync = true;
                    } else { consumed = false; }
                } else { CardUI.openTargetSelection(cardId); consumed = false; }
                break;

            case 'slow':
                if (actualTargetId !== null) {
                    const target = Game.players.find((p: any) => p.id === actualTargetId);
                    if (target) {
                        if (!target.effects) target.effects = {};
                        target.effects.slow = 3;
                        effectLog = `🕸️ ${target.name} não consegue correr! Está lento por 3 turnos.`;
                    }
                } else { CardUI.openTargetSelection(cardId); consumed = false; }
                break;

            case 'rocket':
                if (actualTargetId !== null) {
                    const target = Game.players.find((p: any) => p.id === actualTargetId);
                    if (target) {
                        const nonLegendaryIndices = target.cards.map((c: any, i: number) => c.rarity === 'Lendária' || c.isProtected ? -1 : i).filter((i: number) => i !== -1);
                        if (nonLegendaryIndices.length > 0) {
                            const stolenIdx = nonLegendaryIndices[Math.floor(Math.random() * nonLegendaryIndices.length)];
                            const stolenCard = target.cards.splice(stolenIdx, 1)[0];
                            player.cards.push(stolenCard);

                            Game.sendGlobalLog(`🃏 [Extrato] ${target.name} perdeu uma carta (Roubo). Total: ${target.cards.length}`);
                            Game.sendGlobalLog(`🃏 [Extrato] ${player.name} roubou uma carta. Total: ${player.cards.length}`);

                            effectLog = `🚀 BINGO! Uma carta foi roubada e foi parar na mão de ${player.name}!`;

                            const privateMsg = `🕵️ ALERTA: A Equipe Rocket roubou sua carta [${stolenCard.name}]!||PRIVATE:${target.id}`;
                            if (Network.isOnline) Network.sendAction('LOG', { msg: privateMsg });
                            else Game.log(`🕵️ ALERTA: A Equipe Rocket roubou a carta [${stolenCard.name}] de ${target.name}!`);
                        } else { alert("O alvo não tem cartas!"); consumed = false; }
                    }
                } else { CardUI.openTargetSelection(cardId); consumed = false; }
                break;

            case 'spy':
                if (actualTargetId !== null) {
                    const target = Game.players.find((p: any) => p.id === actualTargetId);
                    if (target) {
                        if (target.cards.length === 0) {
                            alert("Este jogador não possui cartas!");
                            consumed = false;
                        } else {
                            // Sorteia 3 cartas aleatórias da mão inteira (incluindo protegidas e lendárias)
                            const shuffledCards = [...target.cards].sort(() => 0.5 - Math.random());
                            const revealed = shuffledCards.slice(0, 3);
                            CardUI.showRevealedCards(target, revealed);
                            effectLog = `🕵️ ${player.name} usou Espião e viu 3 cartas da mão de ${target.name}!`;
                        }
                    } else { consumed = false; }
                } else { CardUI.openTargetSelection(cardId); consumed = false; }
                break;

            case 'curse':
                if (actualTargetId !== null) {
                    const target = Game.players.find((p: any) => p.id === actualTargetId);
                    if (!target) { consumed = false; break; }
                    if (!target.effects) target.effects = {};
                    target.effects.curse = true;
                    effectLog = `😈 MALDIÇÃO! ${target.name} causará apenas METADE do dano e não poderá usar itens na sua próxima luta de Ginásio!`;
                } else { CardUI.openTargetSelection(cardId); consumed = false; }
                break;

            case 'holy_water':
                if (!player.effects || !player.effects.curse) { alert("Você não está amaldiçoado!"); return; }
                player.effects.curse = false;
                effectLog = `✨ ${player.name} se banhou com Água Benta!`;
                Game.sendGlobalLog(`✨ ${player.name} usou Água Benta e purificou sua alma da Maldição!`);
                break;

            case 'trade_fail':
                if (actualTargetId !== null) {
                    const target = Game.players.find((p: any) => p.id === actualTargetId);
                    if (target) {
                        target.skipTurns += 3;
                        effectLog = `❌ Sabotagem feita com sucesso! A troca falhou terrivelmente e ${target.name} perde as próximas 3 rodadas!`;
                    }
                } else { CardUI.openTargetSelection(cardId); consumed = false; }
                break;

            case 'troques':
                if (actualTargetId !== null) {
                    const target = Game.players.find((p: any) => p.id === actualTargetId);
                    if (target) { CardUI.startTradeFlow(player, target); consumed = false; }
                } else { CardUI.openTargetSelection(cardId); consumed = false; }
                break;

            case 'illegal_adoption':
                if (!Battle.active || Battle.isPvP || Battle.isGym || Battle.isChampion) {
                    alert("Esta carta so pode ser usada em batalhas contra NPCs comuns ou Pokemons Selvagens!");
                    consumed = false;
                    break;
                }
                document.getElementById('battle-cards-modal')!.style.display = 'none';
                CardUI.startNPCBattleTradeFlow(player);
                consumed = false;
                break;

            case 'adotar_lixeira':
                if (Game.lixeira.length === 0) { alert("A lixeira está vazia!"); consumed = false; }
                else { Game.openLixeira(true); effectLog = `💚 ${player.name} sentiu compaixão e está procurando um novo parceiro na Lixeira!`; }
                break;

            case 'time': player.effects.extraTurn = true; effectLog = "⏳ O tempo congelou! O jogador terá mais um turno imediato."; break;

            case 'new_leader':
                const myBadgesCount = player.badges.filter((b: boolean) => b).length;
                if (myBadgesCount >= 7) {
                    Game.showGlobalAlert("A Liga Pokémon interveio! É proibido usar a carta 'Novo Líder' quando falta apenas 1 Insígnia.", player.name, true, false);
                    consumed = false; break;
                }
                if (actualTargetId !== null) {
                    const target = Game.players.find((p: any) => p.id === actualTargetId);
                    if (!target) { consumed = false; break; }

                    const stealableBadges = [];
                    for (let i = 0; i < 8; i++) { if (target.badges[i] && !player.badges[i]) stealableBadges.push(i); }

                    if (stealableBadges.length === 0) { Game.showGlobalAlert(`O jogador ${target.name} não possui nenhuma Insígnia nova para você roubar!`, player.name, true, false); consumed = false; break; }
                    const targetTeam = target.getBattleTeam(false);
                    if (targetTeam.length === 0) { Game.showGlobalAlert(`O jogador ${target.name} está sem Pokémons vivos!`, player.name, true, false); consumed = false; break; }

                    Battle.activeEffects.stealBadgeFrom = target.id;
                    effectLog = `⚔️ UM DUELO FOI DECLARADO! ${player.name} desafiou ${target.name} para roubar uma de suas Insígnias!`;
                    Battle.setup(player, targetTeam[0], true, target.name, 0, target, false, 0, "", 1);
                } else { CardUI.openTargetSelection(cardId); consumed = false; }
                break;

            case 'crit': Battle.activeEffects.crit = 3; Battle.logBattle("💥 Super Crítico! Seus próximos 3 acertos causarão dobro de dano."); break;

            case 'master':
                if (Battle.isPvP || Battle.isNPC || Battle.isGym) { alert("A carta Master Ball só pode ser usada contra Pokémons Selvagens!"); consumed = false; break; }
                const balls = [];
                if (player.items['pokeball'] > 0) balls.push({ id: 'pokeball', name: 'Pokébola', count: player.items['pokeball'] });
                if (player.items['greatball'] > 0) balls.push({ id: 'greatball', name: 'Greatball', count: player.items['greatball'] });
                if (player.items['ultraball'] > 0) balls.push({ id: 'ultraball', name: 'Ultraball', count: player.items['ultraball'] });

                if (balls.length === 0) { alert("Você precisa ter pelo menos uma Pokébola na mochila!"); consumed = false; break; }
                CardUI.showBallChoice(balls); consumed = false;
                break;

            case 'run': 
                player.effects.escapedGym = true; 
                Battle.logBattle("💨 Fugiu com estilo!"); 
                const QuestManagerObj = (window as any).QuestManager || (window as any).modules?.QuestManager;
                if (QuestManagerObj) QuestManagerObj.resetProgress(player, 'WIN_STREAK');
                Battle.end(false); 
                break;
            case 'guard': Battle.activeEffects.guard = true; Battle.logBattle("🛡️ Escudo ativado! (-50% dano recebido)"); break;
            case 'focus': Battle.activeEffects.focus = true; Battle.logBattle("🎯 Foco Total! Próximo ataque 4x dano."); break;
            case 'status': Battle.activeEffects.stunOpponent = 2; Battle.logBattle("⚡ Inimigo atordoado por 2 turnos!"); break;
            case 'heal': Battle.activeMon.heal(9999); Battle.updateUI(); Battle.logBattle("💊 HP Totalmente recuperado!"); break;
            case 'counter': Battle.activeEffects.counter = 3; Battle.logBattle("🔁 Contra-ataque preparado (3 turnos)!"); break;

            case 'mew':
                const PokemonClass = (window as any).Pokemon || Game.players[0].team[0].constructor;
                const mew = new PokemonClass(150, Battle.activeMon.level, false);
                mew.name = "MewTwo (Aliado)";
                mew.heal(9999);
                (mew as any).isTemp = true;

                const originalIndex = player.team.indexOf(Battle.activeMon);
                Battle.activeEffects.mewOriginal = Battle.activeMon;
                Battle.activeEffects.mewIndex = originalIndex;

                if (originalIndex !== -1) player.team[originalIndex] = mew;
                const plyIdx = Battle.plyTeamList.indexOf(Battle.activeMon);
                if (plyIdx !== -1) Battle.plyTeamList[plyIdx] = mew;

                Battle.activeMon = mew;
                Battle.updateUI();
                Battle.logBattle("🧬 DNA Reagiu! Mew assumiu o lugar do seu Pokémon!");
                break;

            case 'destiny': Battle.activeEffects.destiny = true; Battle.logBattle("🌠 Recompensas dobradas se vencer!"); break;

            case 'mega_stone':
                if (Battle.active) { alert("Você não pode equipar a Mega Pedra durante a batalha!"); return; }
                if (targetId !== null) {
                    const targetMon = player.team[targetId];
                    if (!targetMon) { consumed = false; break; }
                    // MAPA_MEGAS is statically imported
                    if (!MAPA_MEGAS[targetMon.id]) { alert(`O Pokémon não reage a esta Mega Pedra!`); consumed = false; break; }
                    if (targetMon.megaStone || targetMon.heldItem) { alert(`${targetMon.name} já está segurando um item! Remova-o antes de equipar outro.`); consumed = false; break; }
                    targetMon.megaStone = true;
                    effectLog = `💎 A Mega Pedra começou a brilhar intensamente junto de ${targetMon.name}!`;
                } else { CardUI.openMegaSelection(cardId); consumed = false; }
                break;

            case 'card_protector':
                if (targetId !== null) {
                    const targetCard = player.cards[targetId];
                    if (!targetCard) { consumed = false; break; }

                    const protectedCount = player.cards.filter((c: any) => c.isProtected).length;
                    if (protectedCount >= 3) { alert("Você já atingiu o limite de 3 cartas protegidas!"); consumed = false; break; }
                    if (targetCard.isProtected) { alert("Esta carta já está protegida!"); consumed = false; break; }
                    if (targetCard.id === 'card_protector') { alert("Você não pode proteger o Cadeado!"); consumed = false; break; }

                    targetCard.isProtected = true;
                    effectLog = `🔒 CADEADO ATIVADO! ${player.name} protegeu uma de suas cartas contra roubos!`;
                    
                    const privateMsg = `🔒 Você protegeu a carta [${targetCard.name}]!||PRIVATE:${player.id}`;
                    Game.log(privateMsg);
                    if (Network.isOnline) Network.sendAction('LOG', { msg: privateMsg });
                } else {
                    const protectedCount = player.cards.filter((c: any) => c.isProtected).length;
                    if (protectedCount >= 3) { alert("Você já atingiu o limite de 3 cartas protegidas!"); consumed = false; break; }
                    CardUI.openProtectCardSelection(cardId);
                    consumed = false;
                }
                break;

            case 'reclaim_mega_stone':
                if (targetId !== null) {
                    const targetMon = player.team[targetId];
                    if (!targetMon || !targetMon.megaStone) { consumed = false; break; }
                    targetMon.megaStone = false;
                    const megaStoneCardData = CARDS_DB.find((c: any) => c.id === 'mega_stone');
                    if (megaStoneCardData) {
                        player.cards.push(megaStoneCardData);
                        Game.sendGlobalLog(`🃏 [Extrato] ${player.name} recuperou sua Mega Pedra como carta. Total: ${player.cards.length}`);
                    }
                    effectLog = `⛏️ A Mega Pedra foi retirada de ${targetMon.name} com segurança!`;
                } else { CardUI.openReclaimMegaStoneSelection(cardId); consumed = false; }
                break;

            case 'steal_mega_stone':
                if (targetId !== null) {
                    const tId = targetId.targetId; const pIdx = targetId.pokemonIndex;
                    const target = Game.players.find((p: any) => p.id === tId);
                    if (!target) { consumed = false; break; }
                    const targetMon = target.team[pIdx];
                    if (!targetMon || !targetMon.megaStone) { consumed = false; break; }
                    if (targetMon.vinculoSupremo || targetMon.happiness === 100) {
                        alert("Este Pokémon possui Vínculo Supremo/Afetivo! A Mega Pedra dele não pode ser destruída.");
                        consumed = false;
                        break;
                    }
                    targetMon.megaStone = false;
                    effectLog = `💥 DESTRUÍDA! ${player.name} destruiu a Mega Pedra de ${targetMon.name} de ${target.name}!`;
                } else { CardUI.openStealMegaStoneTargetSelection(cardId); consumed = false; }
                break;

            case 'supreme_bond':
                if (targetId !== null) {
                    const targetMon = player.team[targetId];
                    if (!targetMon) { consumed = false; break; }
                    
                    let shinyMsg = "";
                    if (!targetMon.isShiny) {
                        targetMon.isShiny = true;
                        targetMon.recalculateStats(true);
                        shinyMsg = " e agora brilha intensamente como um SHINY (+20% Status)!";
                    }

                    targetMon.vinculoSupremo = true;

                    let megaMsg = "";
                    // MAPA_MEGAS is statically imported
                    if (MAPA_MEGAS[targetMon.id] && !targetMon.megaStone && !targetMon.heldItem) {
                        targetMon.megaStone = true;
                        megaMsg = " Além disso, uma Mega Pedra reagiu ao forte laço e foi equipada automaticamente!";
                    }

                    effectLog = `🤝 VÍNCULO SUPREMO! ${targetMon.name} prometeu nunca abandonar ${player.name}${shinyMsg}${megaMsg}`;
                } else { CardUI.openPokemonSelectionForCard(cardId, "Escolha um Pokémon para criar um Vínculo Supremo:"); consumed = false; }
                break;

            case 'ash_goodbye':
                if (targetId !== null) {
                    const tId = targetId.targetId;
                    const pIdx = targetId.pokemonIndex;
                    const target = Game.players.find((p: any) => p.id === tId);
                    if (!target) { consumed = false; break; }

                    // Garante que ashGoodbyeRemaining está inicializado
                    if (player.effects.ashGoodbyeRemaining === undefined) {
                        player.effects.ashGoodbyeRemaining = 2;
                    }

                    const targetMon = target.team[pIdx];
                    if (!targetMon) {
                        // índice inválido (team pode ter mudado) — reabre seleção
                        consumed = false;
                        setTimeout(() => { CardUI.openAshGoodbyeTargetSelection(cardId); }, 300);
                        break;
                    }

                    if (target.team.length === 1) {
                        alert("Você não pode mandar embora o último Pokémon do treinador!");
                        consumed = false;
                        setTimeout(() => { CardUI.openAshGoodbyeTargetSelection(cardId); }, 300);
                        break;
                    }

                    if (targetMon.vinculoSupremo || targetMon.happiness === 100) {
                        effectLog = `🤝 O ADEUS DE ASH FALHOU! ${targetMon.name} se recusa a ir embora devido ao Vínculo Supremo/Afetivo!`;
                        // Não remove, mas conta a tentativa
                    } else {
                        target.team.splice(pIdx, 1);
                        effectLog = `👋 ADEUS! ${player.name} fez ${target.name} libertar seu ${targetMon.name} para todo o sempre!`;
                    }

                    player.effects.ashGoodbyeRemaining--;
                    const remaining = player.effects.ashGoodbyeRemaining;

                    // Log e sync imediato do alvo
                    Game.log(effectLog);
                    Game.showGlobalAlert(effectLog, player.name, true, false);
                    if (Network.isOnline) Network.syncPlayers([player.id, target.id]);

                    Game.updateHUD();

                    if (remaining > 0) {
                        // Ainda há seleções a fazer — marca como continuação para não consumir a carta ainda
                        (player as any)._ashGoodbyeContinued = true;
                        skipBottomSync = true;
                        consumed = false; // não remove a carta ainda
                        setTimeout(() => { CardUI.openAshGoodbyeTargetSelection(cardId); }, 1200);
                    } else {
                        // Última seleção — finaliza normalmente
                        delete player.effects.ashGoodbyeRemaining;
                        consumed = true;
                    }

                } else {
                    // Ainda não foi escolhido alvo — abre seleção
                    CardUI.openAshGoodbyeTargetSelection(cardId);
                    consumed = false;
                }
                break;

            case 'tremembe':
                Game.players.forEach((p: any) => {
                    if (p.id !== player.id) {
                        if (!p.stats) p.stats = { cardsUsed: 0, cardsSuffered: 0, effectsReceived: {}, cardsDefended: {}, turnsLost: 0 };
                        const weight = CardManager.getRarityWeight(cardData.rarity);
                        p.stats.cardsSuffered = (p.stats.cardsSuffered || 0) + weight;
                        if (!p.stats.effectsReceived) p.stats.effectsReceived = {};
                        p.stats.effectsReceived['Tremembé'] = (p.stats.effectsReceived['Tremembé'] || 0) + 1;
                        p.skipTurns += 15;
                    }
                });
                player.effects.tremembeUserTurns = 15;
                effectLog = `⛓️ DECRETO DA PRISÃO DE TREMEMBÉ! Todos os outros jogadores ficarão enjaulados por 15 rodadas!`;
                requiresGlobalSync = true;
                break;



            case 'grande_assalto': {
                let totalStolenGold = 0;
                const stolenItemsList: string[] = [];
                const stolenCardsList: any[] = [];

                Game.players.forEach((p: any) => {
                    if (p.id !== player.id) {
                        // Gold
                        totalStolenGold += (p.gold || 0);
                        p.gold = 0;

                        // Items
                        if (p.items) {
                            Object.keys(p.items).forEach(k => {
                                const qty = p.items[k] || 0;
                                for (let i = 0; i < qty; i++) {
                                    stolenItemsList.push(k);
                                }
                                p.items[k] = 0;
                            });
                        }

                        // Cards (Except legendary and protected)
                        if (p.cards) {
                            const stolen = p.cards.filter((c: any) => c.rarity !== 'Lendária' && !c.isProtected);
                            stolenCardsList.push(...stolen);
                            p.cards = p.cards.filter((c: any) => c.rarity === 'Lendária' || c.isProtected);
                        }
                        Game.sendGlobalLog(`🃏 [Extrato] ${p.name} perdeu todas as suas cartas, itens e gold no Grande Assalto.`);
                    }
                });

                // Calculate half for the player who played it
                const goldReceived = Math.floor(totalStolenGold / 2);
                player.gold += goldReceived;

                // Shuffle and slice items
                const shuffledItems = stolenItemsList.sort(() => 0.5 - Math.random());
                const itemsCount = Math.floor(shuffledItems.length / 2);
                const itemsReceived = shuffledItems.slice(0, itemsCount);
                itemsReceived.forEach(k => {
                    player.items[k] = (player.items[k] || 0) + 1;
                });

                // Shuffle and slice cards
                const shuffledCards = stolenCardsList.sort(() => 0.5 - Math.random());
                const cardsCount = Math.floor(shuffledCards.length / 2);
                const cardsReceived = shuffledCards.slice(0, cardsCount);
                player.cards.push(...cardsReceived);

                Game.sendGlobalLog(`💰 [Extrato] Assalto: Arrecadado ${totalStolenGold}G (recebeu ${goldReceived}G). Itens: ${stolenItemsList.length} (recebeu ${itemsCount}). Cartas: ${stolenCardsList.length} (recebeu ${cardsCount}).`);
                effectLog = `💰 O GRANDE ASSALTO! ${player.name} roubou de todos, mas recebeu apenas metade dos espólios devido ao balanceamento!`;
                requiresGlobalSync = true;
                break;
            }

            case 'legendary_encounter':
                const _POKEDEX = POKEDEX;
                const legendaries = _POKEDEX.filter((p: any) => p.isLegendary);
                const shuffled = legendaries.sort(() => 0.5 - Math.random());
                CardUI.openLegendaryEncounterSelection(shuffled.slice(0, 3));
                effectLog = `🦅 ${player.name} tocou a Flauta do Tempo e atraiu a presença de três divindades!`;
                break;

            case 'epic_shiny':
                if (targetId !== null) {
                    const targetMon = player.team[targetId];
                    if (!targetMon) { consumed = false; break; }
                    if (targetMon.isLegendary) { alert("Lendário! Use a carta específica."); consumed = false; break; }
                    if (targetMon.isShiny) { alert("Já é Shiny!"); consumed = false; break; }

                    targetMon.isShiny = true; targetMon.recalculateStats(true);
                    effectLog = `✨ BRILHO ÉPICO! O ${targetMon.name} brilhou intensamente e se tornou SHINY!`;
                } else { CardUI.openPokemonSelectionForCard(cardId, "Escolha um Pokémon para transformar em Shiny:"); consumed = false; }
                break;

            case 'rare_candy':
                if (targetId !== null) {
                    const targetMon = player.team[targetId];
                    if (!targetMon) { consumed = false; break; }
                    if (targetMon.level >= 25) { alert(`Já alcançou o Nível Máximo!`); consumed = false; break; }

                    const preservedXp = targetMon.currentXp; targetMon.levelUp(player); targetMon.currentXp = preservedXp;
                    effectLog = `🍬 Que delícia! O Rare Candy fez efeito mágico!`;
                } else { CardUI.openPokemonSelectionForCard(cardId); consumed = false; }
                break;

            case 'evoluir':
                if (targetId !== null) {
                    const targetMon = player.team[targetId];
                    if (!targetMon || !targetMon.evoData || !targetMon.evoData.next) { consumed = false; break; }

                    const originalTrigger = targetMon.evoData.trigger; targetMon.evoData.trigger = 1;
                    const evolved = targetMon.checkEvolution(player);
                    if (!evolved) { targetMon.evoData.trigger = originalTrigger; consumed = false; break; }

                    effectLog = `🧬 Genética alterada! A Evolução Forçada foi um sucesso!`;
                } else { CardUI.openEvolutionSelectionForCard(cardId); consumed = false; }
                break;

            case 'shiny': player.effects.lureShiny = 3; effectLog = `✨ Suas chances de encontrar Pokémons Shinies subiram para 15% pelas próximas 3 rodadas!`; break;

            case 'communism':
                skipBottomSync = true;
                {
                    const cardPool: any[] = [];
                    Game.players.forEach((p: any) => {
                        const protectedCards = p.cards.filter((c: any) => c.rarity === 'Lendária' || c.isProtected);
                        const freeCards = p.cards.filter((c: any) => {
                            if (p.id === player.id && c.id === cardId) return false;
                            return c.rarity !== 'Lendária' && !c.isProtected;
                        });
                        p.cards = protectedCards;
                        cardPool.push(...freeCards);
                    });

                    for (let i = cardPool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[cardPool[i], cardPool[j]] = [cardPool[j], cardPool[i]]; }
                    const perPlayer = Math.floor(cardPool.length / Game.players.length);
                    const leftovers = cardPool.length % Game.players.length;

                    Game.players.forEach((p: any) => {
                        for (let i = 0; i < perPlayer; i++) { if (cardPool.length > 0) p.cards.push(cardPool.pop()); }
                        Game.sendGlobalLog(`🃏 [Extrato] ${p.name} agora possui ${p.cards.length} cartas (Comunismo).`);
                    });
                    if (Network.isOnline) Network.syncPlayers(Game.players.map((p: any) => p.id));
                    effectLog = `REVOLUCAO GLOBAL! Todas as cartas não protegidas do jogo foram redistribuidas! Cada jogador tem ${perPlayer} cartas. (${leftovers} destruidas)`;
                }

                Game.updateHUD();
                const boardModalC = document.getElementById('board-cards-modal');
                if (boardModalC) boardModalC.style.display = 'none';

                const logMsgG = `🃏 ${player.name} ativou a carta GLOBAL: [${cardData.name}]!`;
                const fullMsgG = `${logMsgG}\n\n${effectLog}`;

                Game.log(logMsgG); Game.log(effectLog);
                Game.showGlobalAlert(fullMsgG + `||CARD:${cardId}`, player.name, true, false);

                if (Network.isOnline) {
                    Network.sendAction('SHOW_ALERT', { msg: fullMsgG + `||CARD:${cardId}`, playerName: player.name, endsTurn: false });
                    Network.sendAction('LOG', { msg: logMsgG }); Network.sendAction('LOG', { msg: effectLog });
                }
                break;

            case 'imposto':
                skipBottomSync = true;
                {
                    let totalCardsL = 0; let totalItemsL = 0;
                    Game.players.forEach((p: any) => {
                        const cards = [...p.cards];
                        if (p.id === player.id) {
                            const impIdx = cards.findIndex((c: any) => c.id === cardId);
                            if (impIdx > -1) cards.splice(impIdx, 1);
                        }
                        const legendaries = cards.filter((c: any) => c.rarity === 'Lendária' || c.isProtected);
                        const others = cards.filter((c: any) => c.rarity !== 'Lendária' && !c.isProtected);
                        const toRemoveCards = Math.floor(others.length / 2);
                        for (let i = 0; i < toRemoveCards; i++) { others.splice(Math.floor(Math.random() * others.length), 1); totalCardsL++; }
                        p.cards = [...legendaries, ...others];
                        Object.keys(p.items).forEach(k => {
                            if (p.items[k] > 0) {
                                const toRemoveItems = Math.floor(p.items[k] / 2);
                                p.items[k] -= toRemoveItems;
                                totalItemsL += toRemoveItems;
                            }
                        });
                    });
                    if (Network.isOnline) Network.syncPlayers(Game.players.map((p: any) => p.id));
                    effectLog = `A RECEITA FEDERAL CHEGOU! O Leao abocanhou a conta de todos na mesa! (${totalCardsL} cartas desprotegidas e ${totalItemsL} itens retidos!)`;
                }

                Game.updateHUD();
                const boardModalI = document.getElementById('board-cards-modal');
                if (boardModalI) boardModalI.style.display = 'none';

                const logMsgI = `🃏 ${player.name} ativou a carta GLOBAL: [${cardData.name}]!`;
                const fullMsgI = `${logMsgI}\n\n${effectLog}`;

                Game.log(logMsgI); Game.log(effectLog);
                Game.showGlobalAlert(fullMsgI + `||CARD:${cardId}`, player.name, true, false);

                if (Network.isOnline) {
                    Network.sendAction('SHOW_ALERT', { msg: fullMsgI + `||CARD:${cardId}`, playerName: player.name, endsTurn: false });
                    Network.sendAction('LOG', { msg: logMsgI }); Network.sendAction('LOG', { msg: effectLog });
                }
                break;

            case 'doublexp': player.effects.doubleXp = 5; effectLog = `Os proximos 5 ganhos de XP serao em dobro!`; break;
            case 'expshare': player.effects.expShare = 5; effectLog = `Exp Share Ativado! Os proximos 5 ganhos de XP serao distribuidos para toda a equipe!`; break;
            case 'sniper': Battle.activeEffects.sniper = true; Battle.logBattle("🎯 Sniper Americano! Sua mira está perfeita para este turno."); break;

            case 'bag':
                if (actualTargetId !== null) {
                    const target = Game.players.find((p: any) => p.id === actualTargetId);
                    if (!target) { consumed = false; break; }
                    let totalItems = 0; Object.keys(target.items).forEach(k => totalItems += target.items[k]);
                    if (totalItems === 0) { alert("O alvo não tem itens para perder!"); consumed = false; break; }

                    let itemsToRemove = Math.max(1, Math.floor(totalItems / 2));
                    let removedCount = 0;
                    while (removedCount < itemsToRemove) {
                        const keys = Object.keys(target.items).filter(k => target.items[k] > 0);
                        if (keys.length === 0) break;
                        const randomKey = keys[Math.floor(Math.random() * keys.length)];
                        target.items[randomKey]--;
                        removedCount++;
                    }
                    effectLog = `Ouch! A bolsa de ${target.name} foi rasgada e perdeu ${removedCount} itens.`;
                } else { CardUI.openTargetSelection(cardId); consumed = false; }
                break;

            case 'michael':
                if (actualTargetId !== null) {
                    const target = Game.players.find((p: any) => p.id === actualTargetId);
                    if (target) { target.effects = target.effects || {}; target.effects.moonwalker = 3; effectLog = `Moon Walker! ${target.name} vai andar para TRAS nas proximas 3 jogadas!`; }
                    else { consumed = false; }
                } else { CardUI.openTargetSelection(cardId); consumed = false; }
                break;

            case 'katrina':
                const mapSize = MapSystem.size; const totalTilesK = mapSize * mapSize;
                const QuestManagerObjK = (window as any).QuestManager || (window as any).modules?.QuestManager;
                Game.players.forEach((p: any) => { 
                    const randomIdx = Math.floor(Math.random() * totalTilesK); 
                    const coord = MapSystem.getCoord(randomIdx); 
                    p.x = coord.x; 
                    p.y = coord.y; 
                    if (QuestManagerObjK) QuestManagerObjK.checkProgress(p, 'VORTEX_TELEPORT', 1);
                });
                Game.moveVisuals(); effectLog = "O FURACAO KATRINA PASSOU! Todos foram soprados para casas aleatorias!"; requiresGlobalSync = true;
                break;

            case 'lure_type':
                if (typeof targetId === 'string') { player.effects.lureType = { type: targetId, count: 2 }; effectLog = `Lure Type! Os proximos 2 selvagens serao do tipo ${targetId}!`; }
                else { CardUI.openTypeSelection(cardId); consumed = false; }
                break;

            case 'samu': {
                const totalTiles = MapSystem.size * MapSystem.size;
                const startIdx = MapSystem.getIndex(player.x, player.y);
                let targetIdx = startIdx;
                for (let i = 1; i <= totalTiles; i++) {
                    const checkIdx = (startIdx + i) % totalTiles;
                    const coord = MapSystem.getCoord(checkIdx);
                    if (MapSystem.grid[coord.y][coord.x] === TILE.CITY) {
                        targetIdx = checkIdx;
                        break;
                    }
                }

                if (targetIdx === startIdx) {
                    alert("Nenhuma outra cidade encontrada no tabuleiro!");
                    consumed = false;
                    break;
                }

                const targetCoord = MapSystem.getCoord(targetIdx);
                player.x = targetCoord.x;
                player.y = targetCoord.y;

                effectLog = `🚑 SAMU! ${player.name} foi resgatado e transportado em segurança para o Centro Pokémon da próxima cidade.`;
                
                Game.moveVisuals();

                if (targetIdx < startIdx) {
                    let lapGold = 500;
                    if (Game.currentGlobalEvent?.id === 'GOLD_RUSH') lapGold *= 2;
                    player.gold += lapGold;

                    CardManager.draw(player, true);
                    CardManager.draw(player, true);

                    player.team.forEach(mon => {
                        if (mon.level < 25) {
                            mon.levelUp(player);
                        }
                    });

                    Game.sendGlobalLog(`🚩 ${player.name} completou uma volta! Ganhou 500G, 2 Cartas e +1 Level para todo o time!`);
                    Game.sendGlobalLog(`💰 [Extrato] ${player.name} recebeu +500G (Volta no Tabuleiro).`);
                }

                Game.hasRolled = true;
                Game.pendingTileEvent = true;
                requiresGlobalSync = true;
                break;
            }

            case 'change_event': {
                if (typeof targetId === 'string') {
                    const chosenEvent = GLOBAL_EVENTS.find((e: any) => e.id === targetId);
                    if (!chosenEvent) {
                        consumed = false;
                        break;
                    }

                    if (!Game.currentGlobalEvent || Game.round >= Game.eventEndRound) {
                        Game.eventEndRound = Game.round + 5;
                    }

                    Game.currentGlobalEvent = chosenEvent;
                    effectLog = `🌍 MUDANÇA GLOBAL! O evento global foi alterado para: ${chosenEvent.icon} ${chosenEvent.name}!`;
                    requiresGlobalSync = true;
                    
                    if (chosenEvent.id === 'TAX_SEASON') {
                        Game.players.forEach((p: any) => {
                            const lostCards: string[] = [];
                            if (p.cards && p.cards.length > 0) {
                                const legendaryCards = p.cards.filter((c: any) => c.rarity === 'Lendária' || c.isProtected);
                                const nonLegendaryCards = p.cards.filter((c: any) => c.rarity !== 'Lendária' && !c.isProtected);

                                const totalToLose = Math.floor(p.cards.length / 2);
                                const actuallyLost: any[] = [];

                                if (totalToLose > 0 && nonLegendaryCards.length > 0) {
                                    const amountToLose = Math.min(totalToLose, nonLegendaryCards.length);
                                    for (let i = 0; i < amountToLose; i++) {
                                        const randIdx = Math.floor(Math.random() * nonLegendaryCards.length);
                                        actuallyLost.push(nonLegendaryCards.splice(randIdx, 1)[0]);
                                    }
                                }

                                p.cards = [...legendaryCards, ...nonLegendaryCards];
                                actuallyLost.forEach((c: any) => lostCards.push(`${c.icon} ${c.name}`));
                            }
                            if (p.items) {
                                for (const k in p.items) if (p.items[k] > 0) p.items[k] = Math.ceil(p.items[k] / 2);
                            }
                            const lostNames = lostCards.length > 0 ? `: ${lostCards.join(', ')}` : "";
                            Game.sendGlobalLog(`🃏 [Extrato] ${p.name} pagou impostos${lostNames}. Cartas restantes: ${p.cards ? p.cards.length : 0}`);
                        });
                        effectLog += `\n\n📜 IMPOSTO DE RENDA: Todos os jogadores perderam metade de suas cartas e itens!`;
                    }
                } else {
                    CardUI.openEventSelection(cardId);
                    consumed = false;
                }
                break;
            }

            default: consumed = false;
        }

        if (consumed) {
            const offensiveCardIds = ['swap', 'slow', 'rocket', 'curse', 'trade_fail', 'new_leader', 'bag', 'troques', 'michael', 'steal_mega_stone', 'ash_goodbye'];

            if (!alreadyRemoved) {
                let idx = player.cards.findIndex(c => c.id === cardId && !c.isProtected);
                if (idx === -1) idx = player.cards.findIndex(c => c.id === cardId);

                if (idx > -1) player.cards.splice(idx, 1);
            }

            Game.sendGlobalLog(`🃏 [Extrato] ${player.name} usou uma carta. Total: ${player.cards.length}`);

            if (cardData.rarity === 'Lendária') {
                if (!player.effects) player.effects = {};
                player.effects.playedLegendary = true;
            }

            if (offensiveCardIds.includes(cardId) && actualTargetId !== null && actualTargetId !== player.id && !(player as any)._ashGoodbyeContinued) {
                if (!player.stats) player.stats = { cardsUsed: 0, cardsSuffered: 0, effectsReceived: {}, cardsDefended: {}, turnsLost: 0 };
                player.stats.cardsUsed = (player.stats.cardsUsed || 0) + 1;
            }

            let targetObjForSync = null;

            if (actualTargetId !== null && offensiveCardIds.includes(cardId) && !(player as any)._ashGoodbyeContinued) {
                const offensiveTarget = Game.players.find((p: any) => p.id === actualTargetId);
                if (offensiveTarget && offensiveTarget.id !== player.id) {
                    targetObjForSync = offensiveTarget;
                    if (!offensiveTarget.stats) offensiveTarget.stats = { cardsUsed: 0, cardsSuffered: 0, effectsReceived: {}, cardsDefended: {}, turnsLost: 0 };
                    if (!offensiveTarget.stats.effectsReceived) offensiveTarget.stats.effectsReceived = {};

                    const weight = CardManager.getRarityWeight(cardData.rarity);
                    offensiveTarget.stats.cardsSuffered = (offensiveTarget.stats.cardsSuffered || 0) + weight;
                    offensiveTarget.stats.effectsReceived[cardData.name] = (offensiveTarget.stats.effectsReceived[cardData.name] || 0) + 1;
                }
            }

            Game.updateHUD();
            document.getElementById('board-cards-modal')!.style.display = 'none';
            document.getElementById('battle-cards-modal')!.style.display = 'none';

            let targetName = "";
            if (targetObjForSync) targetName = targetObjForSync.name;
            else if (cardData.type === 'battle' && Battle.isPvP && Battle.enemyPlayer) targetName = Battle.enemyPlayer.name;

            let logMsg = `🃏 ${player.name} ativou a carta: [${cardData.name}]!`;
            if (targetName) logMsg = `🃏 ${player.name} usou a carta [${cardData.name}] contra ${targetName}!`;

            let fullMsg = logMsg;
            if (effectLog) fullMsg += `\n\n${effectLog}`;

            Game.log(logMsg);
            if (effectLog) Game.log(effectLog);

            if (cardId !== 'new_leader' && cardId !== 'reroll' && cardId !== 'dice' && cardId !== 'illegal_adoption' && !skipBottomSync && !(player as any)._ashGoodbyeContinued) {
                Game.showGlobalAlert(fullMsg + `||CARD:${cardId}`, player.name, true, false);
            }
            delete (player as any)._ashGoodbyeContinued;

            // --- NOVO: Registro de Log de Carta ---
            let targetNameForLog = "Si mesmo";
            if (cardData.type === 'global') {
                targetNameForLog = "Todos";
            } else if (actualTargetId !== null && actualTargetId !== player.id) {
                const t = Game.players.find((p: any) => p.id === actualTargetId);
                if (t) targetNameForLog = t.name;
            } else if (cardId === 'rocket' || cardId === 'swap' || cardId === 'slow' || cardId === 'curse' || cardId === 'trade_fail' || cardId === 'new_leader' || cardId === 'bag' || cardId === 'troques' || cardId === 'spy' || cardId === 'steal_mega_stone' || cardId === 'ash_goodbye') {
                // Se for ofensiva mas alvo ainda não definido (abriu modal), não loga aqui.
                // Mas geralmente quando chega aqui com 'consumed = true', o alvo já foi resolvido ou é global.
            }

            // Só loga se consumiu e tem efeito relevante
            if (consumed && cardData.name) {
                const GameUIClass = (window as any).GameUI || Game;
                if (GameUIClass.recordCardLog) {
                    GameUIClass.recordCardLog(player.name, cardData.name, targetNameForLog);
                }
            }

            if (Network.isOnline && !skipBottomSync) {
                try {
                    if (requiresGlobalSync) {
                        Network.syncPlayers(Game.players.map((p: any) => p.id));
                    } else {
                        const ids = [player.id];
                        if (targetObjForSync) ids.push(targetObjForSync.id);
                        Network.syncPlayers(ids);
                    }

                    if (cardId === 'change_event') {
                        SupabaseDataStore.setGlobalEvent(Network.currentRoomId, Game.currentGlobalEvent ? Game.currentGlobalEvent.id : null, Game.eventEndRound);
                    }
                } catch (e) { console.error("Erro no Sync Atômico Final:", e); }

                if (cardId !== 'new_leader' && cardId !== 'reroll' && cardId !== 'dice' && cardId !== 'illegal_adoption') {
                    Network.sendAction('SHOW_ALERT', { msg: fullMsg + `||CARD:${cardId}`, playerName: player.name, endsTurn: false });
                    Network.sendAction('LOG', { msg: logMsg });
                    if (effectLog) Network.sendAction('LOG', { msg: effectLog });
                } else {
                    Network.sendAction('LOG', { msg: logMsg });
                    if (effectLog) Network.sendAction('LOG', { msg: effectLog });
                }
            }
        }
    }
}
