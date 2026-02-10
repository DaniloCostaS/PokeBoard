import { CARDS_DB } from '../constants';
import type { Player } from '../models/Player';
import { Pokemon } from '../models/Pokemon';

export class Cards {
    // Sorteia uma carta para o jogador
    static draw(player: Player) { 
        const Game = (window as any).Game;
        const Network = (window as any).Network;

        const card = CARDS_DB[Math.floor(Math.random()*CARDS_DB.length)]; 
        player.cards.push(card); 
        Game.sendGlobalLog(`🃏 ${player.name} ganhou a carta: ${card.icon} ${card.name}`); 
        Game.updateHUD(); 
        if(Network.isOnline) Network.syncPlayerState(); 
    }
    
    // Abre modal para ver cartas
    static showPlayerCards(playerId: number) { 
        const Game = (window as any).Game;
        Game.openBoardCards(playerId); 
    }

    // Abre modal para selecionar um alvo (para cartas como Rocket, Swap, Curse)
    static openTargetSelection(cardId: string) {
        const Game = (window as any).Game;
        const targets = Game.players.filter((p: Player) => p.id !== Game.turn);
        
        if (targets.length === 0) return alert("Sem alvos disponíveis.");

        // Cria um modal simples dinâmico ou usa prompt por enquanto
        // Idealmente seria um modal HTML, aqui faremos via prompt/confirm simplificado ou lógica direta
        // Para simplificar a integração, vamos assumir que cartas de alvo abrem um prompt nativo ou modal customizado
        // Vou usar um confirm simples hackeado para demo, mas o ideal é UI
        
        // Simulação de UI de escolha:
        let list = "Escolha o alvo:\n";
        targets.forEach((p: Player) => list += `${p.id}: ${p.name}\n`);
        const choice = prompt(list + "Digite o ID do jogador:");
        
        if (choice !== null) {
            const targetId = parseInt(choice);
            if (Game.players[targetId] && targetId !== Game.turn) {
                this.activate(cardId, targetId);
            } else {
                alert("Alvo inválido.");
            }
        }
    }

    // =================================================================
    // LÓGICA CENTRAL DE EXECUÇÃO DAS CARTAS
    // =================================================================
    static activate(cardId: string, targetId: number | null = null) {
        const Game = (window as any).Game;
        const Battle = (window as any).Battle;
        const Network = (window as any).Network;
        const player: Player = Game.getCurrentPlayer();

        // 1. Validar Fase
        const cardData = CARDS_DB.find(c => c.id === cardId);
        if (!cardData) return;

        if (cardData.type === 'move' && Battle.active) {
            return alert("Cartas MOVE só podem ser usadas no tabuleiro!");
        }
        if (cardData.type === 'battle' && !Battle.active) {
            return alert("Cartas BATTLE só podem ser usadas em batalha!");
        }

        // 2. Lógica Específica
        let consumed = true; // Se false, a carta não é gasta (ex: cancelou uso)

        switch (cardId) {
            // --- CARTAS MOVE ---
            case 'dice': // Dado Mágico
                const val = prompt("Escolha o valor do dado (1-20):");
                const num = parseInt(val || "0");
                if (num >= 1 && num <= 20) {
                    Game.forceDice(num); // Nova função no Game
                } else {
                    alert("Valor inválido.");
                    consumed = false;
                }
                break;

            case 'reroll': // Re-Roll
                Game.log("🔄 Re-Roll ativado! Rolando novamente...");
                Game.rollDice(); // Rola de novo
                break;

            case 'boost': // Tênis de Corrida
                Game.log("👟 Tênis ativados! +6 casas.");
                Game.bonusMovement = 6; // Configura flag no Game
                // O jogador deve rolar o dado em seguida
                break;

            case 'trap': // Armadilha
                Game.placeTrap(player.x, player.y, player.id);
                Game.sendGlobalLog(`🪤 ${player.name} colocou uma armadilha!`);
                break;

            case 'swap': // Troca Rápida
                if (targetId !== null) {
                    const target = Game.players[targetId];
                    const tempX = player.x; const tempY = player.y;
                    player.x = target.x; player.y = target.y;
                    target.x = tempX; target.y = tempY;
                    Game.moveVisuals();
                    Game.sendGlobalLog(`🔀 ${player.name} trocou de lugar com ${target.name}!`);
                } else { this.openTargetSelection(cardId); consumed = false; }
                break;

            case 'slow': // Campo Grudento
                if (targetId !== null) {
                    const target = Game.players[targetId];
                    target.effects.slow = 3;
                    Game.sendGlobalLog(`🕸️ ${target.name} está lento por 3 turnos!`);
                } else { this.openTargetSelection(cardId); consumed = false; }
                break;

            case 'rocket': // Equipe Rocket
                if (targetId !== null) {
                    const target = Game.players[targetId];
                    if (target.cards.length > 0) {
                        const stolenIdx = Math.floor(Math.random() * target.cards.length);
                        const stolenCard = target.cards.splice(stolenIdx, 1)[0];
                        player.cards.push(stolenCard);
                        Game.sendGlobalLog(`🚀 ${player.name} roubou ${stolenCard.name} de ${target.name}!`);
                    } else {
                        Game.log("O alvo não tinha cartas!");
                    }
                } else { this.openTargetSelection(cardId); consumed = false; }
                break;

            case 'curse': // Maldição
                if (targetId !== null) {
                    const target = Game.players[targetId];
                    target.effects.curse = true; // Dura 1 batalha
                    Game.sendGlobalLog(`☠️ ${target.name} foi amaldiçoado!`);
                } else { this.openTargetSelection(cardId); consumed = false; }
                break;

            case 'trade_fail': // Troca Mal-Sucedida
                if (targetId !== null) {
                    const target = Game.players[targetId];
                    target.skipTurn = true;
                    Game.sendGlobalLog(`❌ ${target.name} perdeu a próxima vez!`);
                } else { this.openTargetSelection(cardId); consumed = false; }
                break;

            case 'time': // Controle do Tempo
                player.effects.extraTurn = true;
                Game.log("⏳ Você jogará novamente após este turno.");
                break;
            
            case 'new_leader': // Novo Líder
                if(targetId !== null) {
                    // Salva a intenção para verificar na vitória da batalha
                    Battle.activeEffects.stealBadgeFrom = targetId; 
                    Game.log("⚔️ Vença a batalha para roubar uma insígnia!");
                } else { this.openTargetSelection(cardId); consumed = false; }
                break;

            // --- CARTAS BATTLE ---
            case 'crit': // Super Crítico
                Battle.activeEffects.crit = true;
                Battle.logBattle("💥 Dano Dobrado ativado!");
                break;

            case 'master': // Master Ball
                if (player.items['pokeball'] > 0) {
                    Battle.attemptCapture(100); // 100% rate, ignora HP
                } else {
                    alert("Você precisa de uma Pokébola!");
                    consumed = false;
                }
                break;

            case 'run': // Fumaça Ninja
                Battle.logBattle("💨 Fugiu com estilo!");
                Battle.end(false); // Fuga sem penalidade
                break;

            case 'guard': // Escudo Protetor
                Battle.activeEffects.guard = true;
                Battle.logBattle("🛡️ Escudo ativado! (-50% dano recebido)");
                break;

            case 'focus': // Foco Total
                Battle.activeEffects.focus = true;
                Battle.logBattle("🎯 Foco Total! Próximo ataque 4x dano.");
                break;

            case 'status': // Ataque Surpresa (Stun)
                Battle.activeEffects.stunOpponent = 2;
                Battle.logBattle("⚡ Inimigo atordoado por 2 turnos!");
                break;

            case 'heal': // Poção Máxima
                Battle.activeMon.heal(9999);
                Battle.updateUI();
                Battle.logBattle("💊 HP Totalmente recuperado!");
                break;

            case 'counter': // Contra-Ataque
                Battle.activeEffects.counter = 3;
                Battle.logBattle("🔁 Contra-ataque preparado (3 turnos)!");
                break;

            case 'mew': // DNA de Mew
                const mew = new Pokemon(151, Battle.activeMon.level, false);
                mew.name = "Mew (Aliado)";
                // Adiciona temporariamente ao time e troca para ele
                player.team.push(mew);
                Battle.activeMon = mew;
                Battle.updateUI();
                Battle.logBattle("🧬 Mew entrou na batalha!");
                // Flag para remover depois
                (mew as any).isTemp = true; 
                break;

            case 'destiny': // Destino Selado
                Battle.activeEffects.destiny = true;
                Battle.logBattle("🌠 Recompensas dobradas se vencer!");
                break;
            
            case 'jam': // Interferência (Uso Manual)
                 // Apenas loga, o efeito real é no oponente
                 Battle.logBattle("📡 Interferência ativada!");
                 break;

            default:
                console.warn("Carta sem lógica implementada:", cardId);
                consumed = false;
        }

        // 3. Consumir Carta
        if (consumed) {
            const idx = player.cards.findIndex(c => c.id === cardId);
            if (idx > -1) player.cards.splice(idx, 1);
            
            Game.updateHUD(); // Atualiza UI
            
            // Fecha modais se estiverem abertos
            document.getElementById('board-cards-modal')!.style.display = 'none';
            document.getElementById('battle-cards-modal')!.style.display = 'none';

            if (Network.isOnline) {
                Network.syncPlayerState();
                // Envia log específico de uso de carta
                Network.sendAction('LOG', { msg: `${player.name} usou ${cardData.name}!` });
            }
        }
    }
}