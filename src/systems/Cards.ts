import { CARDS_DB } from '../constants';
import type { Player } from '../models/Player';
import { Pokemon } from '../models/Pokemon';

export class Cards {
    static draw(player: Player) { 
        const Game = (window as any).Game;
        const Network = (window as any).Network;

        const card = CARDS_DB[Math.floor(Math.random()*CARDS_DB.length)]; 
        player.cards.push(card); 
        Game.sendGlobalLog(`🃏 ${player.name} ganhou a carta: ${card.icon} ${card.name}`); 
        Game.updateHUD(); 
        if(Network.isOnline) Network.syncPlayerState(); 
    }
    
    static showPlayerCards(playerId: number) { const Game = (window as any).Game; Game.openBoardCards(playerId); }

    static openTargetSelection(cardId: string) {
        const Game = (window as any).Game;
        const targets = Game.players.filter((p: Player) => p.id !== Game.turn);
        if (targets.length === 0) return alert("Sem alvos disponíveis.");
        let list = "Escolha o alvo:\n";
        targets.forEach((p: Player) => list += `${p.id}: ${p.name}\n`);
        const choice = prompt(list + "Digite o ID do jogador:");
        if (choice !== null) {
            const targetId = parseInt(choice);
            if (Game.players[targetId] && targetId !== Game.turn) {
                this.activate(cardId, targetId);
            } else { alert("Alvo inválido."); }
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

        let consumed = true; 

        switch (cardId) {
            case 'dice': 
                const val = prompt("Escolha o valor do dado (1-20):");
                const num = parseInt(val || "0");
                if (num >= 1 && num <= 20) { Game.forceDice(num); } 
                else { alert("Valor inválido."); consumed = false; }
                break;

            case 'reroll': Game.log("🔄 Re-Roll ativado! Rolando novamente..."); Game.rollDice(); break;
            case 'boost': Game.log("👟 Tênis ativados! +6 casas."); Game.bonusMovement = 6; break;
            case 'trap': Game.placeTrap(player.x, player.y, player.id); Game.sendGlobalLog(`🪤 ${player.name} colocou uma armadilha!`); break;

            case 'swap': 
                if (targetId !== null) {
                    const target = Game.players[targetId];
                    const tempX = player.x; const tempY = player.y;
                    player.x = target.x; player.y = target.y;
                    target.x = tempX; target.y = tempY;
                    Game.moveVisuals();
                    Game.sendGlobalLog(`🔀 ${player.name} trocou de lugar com ${target.name}!`);
                    
                    // CORREÇÃO: Sync do alvo também
                    if(Network.isOnline) Network.syncSpecificPlayer(targetId);
                } else { this.openTargetSelection(cardId); consumed = false; }
                break;

            case 'slow': 
                if (targetId !== null) {
                    const target = Game.players[targetId];
                    target.effects.slow = 3;
                    Game.sendGlobalLog(`🕸️ ${target.name} está lento por 3 turnos!`);
                    if(Network.isOnline) Network.syncSpecificPlayer(targetId);
                } else { this.openTargetSelection(cardId); consumed = false; }
                break;

            case 'rocket': 
                if (targetId !== null) {
                    const target = Game.players[targetId];
                    if (target.cards.length > 0) {
                        const stolenIdx = Math.floor(Math.random() * target.cards.length);
                        const stolenCard = target.cards.splice(stolenIdx, 1)[0];
                        player.cards.push(stolenCard);
                        Game.sendGlobalLog(`🚀 ${player.name} roubou ${stolenCard.name} de ${target.name}!`);
                        if(Network.isOnline) Network.syncSpecificPlayer(targetId);
                    } else { Game.log("O alvo não tinha cartas!"); }
                } else { this.openTargetSelection(cardId); consumed = false; }
                break;

            case 'curse': 
                if (targetId !== null) {
                    const target = Game.players[targetId];
                    target.effects.curse = true; 
                    Game.sendGlobalLog(`☠️ ${target.name} foi amaldiçoado!`);
                    if(Network.isOnline) Network.syncSpecificPlayer(targetId);
                } else { this.openTargetSelection(cardId); consumed = false; }
                break;

            case 'trade_fail': 
                if (targetId !== null) {
                    const target = Game.players[targetId];
                    target.skipTurns = 1; // Corrigido para skipTurns
                    Game.sendGlobalLog(`❌ ${target.name} perdeu a próxima vez!`);
                    if(Network.isOnline) Network.syncSpecificPlayer(targetId);
                } else { this.openTargetSelection(cardId); consumed = false; }
                break;

            case 'time': player.effects.extraTurn = true; Game.log("⏳ Você jogará novamente após este turno."); break;
            
            case 'new_leader': 
                if(targetId !== null) {
                    Battle.activeEffects.stealBadgeFrom = targetId; 
                    Game.log("⚔️ Vença a batalha para roubar uma insígnia!");
                } else { this.openTargetSelection(cardId); consumed = false; }
                break;

            // BATTLE CARDS
            case 'crit': Battle.activeEffects.crit = true; Battle.logBattle("💥 Dano Dobrado ativado!"); break;
            case 'master': 
                if (player.items['pokeball'] > 0) { Battle.attemptCapture(CARDS_DB.find(c=>c.id==='master')); } // Usa item dummy master
                else { alert("Você precisa de uma Pokébola!"); consumed = false; }
                break;
            case 'run': Battle.logBattle("💨 Fugiu com estilo!"); Battle.end(false); break;
            case 'guard': Battle.activeEffects.guard = true; Battle.logBattle("🛡️ Escudo ativado! (-50% dano recebido)"); break;
            case 'focus': Battle.activeEffects.focus = true; Battle.logBattle("🎯 Foco Total! Próximo ataque 4x dano."); break;
            case 'status': Battle.activeEffects.stunOpponent = 2; Battle.logBattle("⚡ Inimigo atordoado por 2 turnos!"); break;
            case 'heal': Battle.activeMon.heal(9999); Battle.updateUI(); Battle.logBattle("💊 HP Totalmente recuperado!"); break;
            case 'counter': Battle.activeEffects.counter = 3; Battle.logBattle("🔁 Contra-ataque preparado (3 turnos)!"); break;
            case 'mew': 
                const mew = new Pokemon(151, Battle.activeMon.level, false);
                mew.name = "Mew (Aliado)";
                player.team.push(mew);
                Battle.activeMon = mew;
                Battle.updateUI();
                Battle.logBattle("🧬 Mew entrou na batalha!");
                (mew as any).isTemp = true; 
                break;
            case 'destiny': Battle.activeEffects.destiny = true; Battle.logBattle("🌠 Recompensas dobradas se vencer!"); break;
            case 'jam': Battle.logBattle("📡 Interferência ativada!"); break;

            default: consumed = false;
        }

        if (consumed) {
            const idx = player.cards.findIndex(c => c.id === cardId);
            if (idx > -1) player.cards.splice(idx, 1);
            
            Game.updateHUD(); 
            document.getElementById('board-cards-modal')!.style.display = 'none';
            document.getElementById('battle-cards-modal')!.style.display = 'none';

            if (Network.isOnline) {
                Network.syncPlayerState();
                Network.sendAction('LOG', { msg: `${player.name} usou ${cardData.name}!` });
            }
        }
    }
}