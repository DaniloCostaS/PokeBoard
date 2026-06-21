import { GameState } from './GameState';
import { GameEvents } from './GameEvents';
import { GameMovement } from './GameMovement';
import { Network } from '../../systems/Network';
import { TILE } from '../../constants';
import { Player } from '../../models/Player';

export class CPUController {

    static handleTurn() {
        const currP = GameState.getCurrentPlayer();
        const NetworkObj = (window as any).Network || Network;
        
        if (!currP.isCPU || NetworkObj.isOnline) return false;

        if (!GameState.turnStarted) {
            // Fase 1: Iniciar o turno
            setTimeout(() => {
                GameEvents.iniciarTurno();
            }, 1000);
            return true;
        } else {
            // O turno começou, mas ele precisa rolar o dado
            const type = (window as any).MapSystem?.grid?.[currP.y]?.[currP.x];
            
            // Se está num evento de ginásio pendente, não rola o dado
            if (type === TILE.GYM && !GameState.pendingTileEvent) {
                const gymId = (window as any).MapSystem?.gymLocations?.[`${currP.x},${currP.y}`];
                if (gymId && !currP.badges[gymId - 1] && GameState.currentGlobalEvent?.id !== 'GYM_VACATION' && !currP.effects.escapedGym) {
                    // Vai iniciar batalha, não rola
                    return true;
                }
            }

            // --- NOVO: CPU joga carta antes de andar ---
            let delay = 1000;
            if (!currP.effects.playedCardThisTurn && currP.cards.length > 0) {
                const played = this.cpuPlayCard(currP);
                if (played) delay = 3500; // Dá tempo da animação/efeito da carta rolar
            }

            // Se o botão ROLAR estaria visível, a CPU rola o dado
            setTimeout(() => {
                GameMovement.rollDice();
            }, delay);
            return true;
        }
    }

    static cpuPlayCard(p: Player) {
        const Game = (window as any).Game;
        const CardsObj = (window as any).Cards;
        if (!CardsObj) return false;

        const offensiveIds = ['steal_coins', 'steal_item', 'teleport_trap', 'sabotage', 'rocket', 'curse'];
        const buffIds = ['boost', 'time', 'guard', 'focus', 'doublexp', 'expshare']; // Heal é usável na batalha

        let selectedCardIndex = -1;
        let isOffensive = false;
        let targetArg: any = null;
        
        for (let i = 0; i < p.cards.length; i++) {
            const c = p.cards[i];
            if (c.isProtected) continue;
            const cId = typeof c === 'string' ? c : c.id;
            
            if (cId === 'evoluir') {
                const idx = p.team.findIndex((mon: any) => mon.evoData && mon.evoData.next);
                if (idx !== -1) {
                    selectedCardIndex = i;
                    targetArg = idx;
                    break;
                }
            } else if (cId === 'epic_shiny') {
                const idx = p.team.findIndex((mon: any) => !mon.isShiny && !mon.isLegendary);
                if (idx !== -1) {
                    selectedCardIndex = i;
                    targetArg = idx;
                    break;
                }
            } else if (cId === 'rare_candy') {
                const idx = p.team.findIndex((mon: any) => mon.level < 25);
                if (idx !== -1) {
                    selectedCardIndex = i;
                    targetArg = idx;
                    break;
                }
            } else if (offensiveIds.includes(cId)) {
                selectedCardIndex = i;
                isOffensive = true;
                break;
            } else if (buffIds.includes(cId)) {
                selectedCardIndex = i;
                targetArg = p.id;
                break;
            }
        }

        if (selectedCardIndex >= 0) {
            const cardData = p.cards[selectedCardIndex];
            const cardId = typeof cardData === 'string' ? cardData : cardData.id;
            
            p.effects.playedCardThisTurn = true;
            if (Game.updateHUD) Game.updateHUD();

            if (isOffensive) {
                const opponents = Game.players.filter((pl: any) => pl.id !== p.id);
                opponents.sort((a: any, b: any) => {
                    const aB = a.badges.filter((x: boolean) => x).length;
                    const bB = b.badges.filter((x: boolean) => x).length;
                    return bB - aB;
                });
                const maxB = opponents[0].badges.filter((x: boolean) => x).length;
                const tops = opponents.filter((pl: any) => pl.badges.filter((x: boolean) => x).length === maxB);
                const target = tops[Math.floor(Math.random() * tops.length)];

                CardsObj.activate(cardId, target.id);
            } else {
                CardsObj.activate(cardId, targetArg);
            }
            return true;
        }
        return false;
    }

    static handleCity(p: Player) {
        if (!p.isCPU) return false;

        const modal = document.getElementById('city-modal');
        if (modal) modal.style.display = 'none';

        setTimeout(() => {
            const Game = (window as any).Game;
            
            // 1. Compra Pokébolas silenciosamente até ter 5
            while (p.gold >= 100 && (p.items['pokeball'] || 0) < 5) {
                p.gold -= 100;
                p.items['pokeball'] = (p.items['pokeball'] || 0) + 1;
                if (Game.sendGlobalLog) Game.sendGlobalLog(`🛒 ${p.name} comprou: Pokébola!`);
            }

            // 2. Compra Carta se sobrar mais de 500G
            if (p.gold >= 500) {
                GameEvents.handleCityChoice('card');
            }

            // 3. Verifica se precisa curar
            const needsHeal = p.team.some(mon => mon.currentHp < mon.maxHp || mon.isFainted());
            
            setTimeout(() => {
                if (needsHeal) {
                    GameEvents.handleCityChoice('heal');
                } else {
                    GameState.isCityEvent = false;
                    GameEvents.nextTurn();
                }
            }, 1000);

        }, 1500);

        return true;
    }

    static handleBattleSelect(battleCore: any) {
        if (!battleCore.player || !battleCore.player.isCPU) return false;
        
        setTimeout(() => {
            const nextAlive = battleCore.player.team.find((m: any) => !m.isFainted());
            if (nextAlive) {
                battleCore.startRound(nextAlive);
            }
        }, 1500);

        return true;
    }

    static handleBattleStart(battleCore: any) {
        if (!battleCore.player || !battleCore.player.isCPU || battleCore.isPvP) return false;

        battleCore.isAutoPvE = true;
        setTimeout(() => {
            battleCore.attack();
        }, 1500);

        return true;
    }

}
