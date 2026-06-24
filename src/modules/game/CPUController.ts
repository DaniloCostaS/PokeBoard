import { GameState } from './GameState';
import { GameEvents } from './GameEvents';
import { GameMovement } from './GameMovement';
import { Network } from '../../systems/Network';
import { TILE } from '../../constants';
import { Player } from '../../models/Player';
import { MAPA_MEGAS } from '../../constants/mapaMegas';
import { SHOP_ITEMS } from '../../constants/items';
import { MapSystem } from '../../systems/MapSystem';
import { CardEffects } from '../cards/CardEffects';

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
            const type = MapSystem.grid?.[currP.y]?.[currP.x];
            
            // Se está num evento de ginásio pendente, não rola o dado
            if (type === TILE.GYM && !GameState.pendingTileEvent) {
                const gymId = MapSystem.gymLocations?.[`${currP.x},${currP.y}`];
                if (gymId && !currP.badges[gymId - 1] && GameState.currentGlobalEvent?.id !== 'GYM_VACATION' && !currP.effects.escapedGym) {
                    // Vai iniciar batalha, não rola
                    return true;
                }
            }

            // Verifica se a CPU está pausada aguardando animação de carta
            if (currP.effects.isWaitingCardAnimation) {
                return true;
            }

            // --- NOVO: CPU usa itens fora de batalha antes de rolar o dado ---
            this.cpuUseItems(currP);

            // --- NOVO: CPU joga carta antes de andar ---
            let cardsPlayedCount = currP.effects.cardsPlayedThisTurn || 0;
            if (cardsPlayedCount < 3 && currP.cards.length > 0) {
                const played = this.cpuPlayCard(currP);
                if (played) {
                    currP.effects.isWaitingCardAnimation = true;
                    setTimeout(() => {
                        currP.effects.isWaitingCardAnimation = false;
                        CPUController.handleTurn();
                    }, 3500);
                    return true; // Espera a animação antes de tentar jogar outra ou rolar
                }
            }

            // Se o botão ROLAR estaria visível, a CPU rola o dado
            setTimeout(() => {
                GameMovement.rollDice();
            }, 1000);
            return true;
        }
    }

    static cpuPlayCard(p: Player) {
        const Game = (window as any).Game;
        const CardsObj = CardEffects;
        const MapSystemClass = MapSystem;
        if (!CardsObj || !MapSystemClass) return false;

        const priorityOrder = [
            'time', 'grande_assalto', 'tremembe', 'supreme_bond', 'legendary_encounter',
            'adotar_lixeira', 'mega_stone', 'epic_shiny', 'evoluir', 'rare_candy',
            'card_protector', 'samu', 'boost', 'shiny', 'doublexp', 'expshare',
            'lure_type', 'change_event', 'holy_water', 'ash_goodbye', 'steal_mega_stone',
            'new_leader', 'troques', 'trade_fail', 'slow', 'curse', 'michael',
            'rocket', 'bag', 'spy', 'swap', 'communism', 'imposto', 'katrina',
            'dice', 'reroll'
        ];

        let selectedCardIndex = -1;
        let cardToPlayId = '';
        let targetArg: any = null;

        for (const cardId of priorityOrder) {
            const index = p.cards.findIndex((c: any) => {
                const cId = typeof c === 'string' ? c : c.id;
                return cId === cardId && !c.isProtected;
            });
            if (index === -1) continue;

            let conditionMet = false;
            let currentTarget: any = null;

            switch (cardId) {
                case 'time':
                    conditionMet = true;
                    break;
                case 'grande_assalto':
                    conditionMet = Game.players.some((pl: any) => pl.id !== p.id && ((pl.gold || 0) > 150 || (pl.cards?.length || 0) > 1 || Object.values(pl.items || {}).reduce((s: number, v: any) => s + v, 0) > 1));
                    break;
                case 'tremembe':
                    conditionMet = Game.players.some((pl: any) => pl.id !== p.id && (pl.skipTurns || 0) < 5);
                    break;
                case 'supreme_bond': {
                    const idx = p.team.findIndex((mon: any) => !mon.vinculoSupremo);
                    if (idx !== -1) {
                        conditionMet = true;
                        currentTarget = idx;
                    }
                    break;
                }
                case 'legendary_encounter': {
                    const hasPokeballs = (p.items['pokeball'] || 0) > 0 || (p.items['greatball'] || 0) > 0 || (p.items['ultraball'] || 0) > 0 || (p.items['masterball'] || 0) > 0;
                    const isSafari = Game.currentGlobalEvent?.id === 'SAFARI_ZONE';
                    conditionMet = hasPokeballs || isSafari;
                    break;
                }
                case 'adotar_lixeira': {
                    if (Game.lixeira && Game.lixeira.length > 0) {
                        if (p.team.length < 6) {
                            conditionMet = true;
                        } else {
                            // Time cheio: valida se há alguém na lixeira mais forte que o pior do time
                            const getStats = (m: any) => m.maxHp + m.atk + m.def + m.speed;
                            const myWorstStats = Math.min(...p.team.map((m: any) => getStats(m)));
                            const bestLixeiraStats = Math.max(...Game.lixeira.map((m: any) => getStats(m)));
                            const hasValuableInLixeira = Game.lixeira.some((m: any) => m.isShiny || m.isLegendary);
                            conditionMet = (bestLixeiraStats > myWorstStats) || hasValuableInLixeira;
                        }
                    }
                    break;
                }
                case 'mega_stone': {
                    const idx = p.team.findIndex((mon: any) => MAPA_MEGAS[mon.id] && !mon.megaStone && !mon.heldItem);
                    if (idx !== -1) {
                        conditionMet = true;
                        currentTarget = idx;
                    }
                    break;
                }
                case 'epic_shiny': {
                    const idx = p.team.findIndex((mon: any) => !mon.isLegendary && !mon.isShiny);
                    if (idx !== -1) {
                        conditionMet = true;
                        currentTarget = idx;
                    }
                    break;
                }
                case 'evoluir': {
                    const idx = p.team.findIndex((mon: any) => mon.evoData && mon.evoData.next && mon.evoData.next !== "null" && mon.evoData.next !== "");
                    if (idx !== -1) {
                        conditionMet = true;
                        currentTarget = idx;
                    }
                    break;
                }
                case 'rare_candy': {
                    const idx = p.team.findIndex((mon: any) => mon.level < 25);
                    if (idx !== -1) {
                        conditionMet = true;
                        currentTarget = idx;
                    }
                    break;
                }
                case 'card_protector': {
                    const protectedCount = p.cards.filter((c: any) => c.isProtected).length;
                    const hasUnprotectedRare = p.cards.some((c: any) => !c.isProtected && c.id !== 'card_protector' && (c.rarity === 'Lendária' || c.rarity === 'Épica' || c.rarity === 'Rara'));
                    conditionMet = protectedCount < 3 && hasUnprotectedRare;
                    break;
                }
                case 'samu': {
                    const currentIdx = MapSystemClass.getIndex(p.x, p.y);
                    const totalTiles = MapSystemClass.size * MapSystemClass.size;
                    let dist = 0;
                    for (let i = 1; i <= totalTiles; i++) {
                        const checkIdx = (currentIdx + i) % totalTiles;
                        const coord = MapSystemClass.getCoord(checkIdx);
                        if (MapSystemClass.grid[coord.y][coord.x] === TILE.CITY) {
                            dist = i;
                            break;
                        }
                    }
                    const teamNeedsHeal = p.team.some((mon: any) => mon.currentHp < mon.maxHp || mon.isFainted());
                    conditionMet = dist > 4 || teamNeedsHeal;
                    break;
                }
                case 'boost':
                    conditionMet = true;
                    break;
                case 'shiny':
                    conditionMet = !(p.effects && p.effects.lureShiny);
                    break;
                case 'doublexp':
                    conditionMet = !(p.effects && p.effects.doubleXp);
                    break;
                case 'expshare':
                    conditionMet = !(p.effects && p.effects.expShare);
                    break;
                case 'lure_type':
                    conditionMet = !(p.effects && p.effects.lureType);
                    break;
                case 'change_event': {
                    const badEvents = ['TAX_SEASON', 'ROCKET', 'EMP', 'QUICKSAND', 'MEGA_BLOCK'];
                    const currentEventId = Game.currentGlobalEvent?.id;
                    conditionMet = !currentEventId || badEvents.includes(currentEventId) || Game.round >= Game.eventEndRound;
                    break;
                }
                case 'holy_water':
                    conditionMet = !!(p.effects && p.effects.curse);
                    break;
                case 'ash_goodbye': {
                    const opponents = Game.players.filter((pl: any) => pl.id !== p.id);
                    conditionMet = opponents.some((opp: any) => opp.team.length > 1 && opp.team.some((mon: any) => !mon.vinculoSupremo && mon.happiness !== 100));
                    break;
                }
                case 'steal_mega_stone': {
                    const opponents = Game.players.filter((pl: any) => pl.id !== p.id);
                    conditionMet = opponents.some((opp: any) => opp.team.some((mon: any) => mon.megaStone && !mon.vinculoSupremo && mon.happiness !== 100));
                    break;
                }
                case 'new_leader': {
                    const opponents = Game.players.filter((pl: any) => pl.id !== p.id);
                    const myBadgesCount = p.badges.filter((b: boolean) => b).length;
                    const targetLimit = MapSystemClass.size === 7 ? 3 : 7;
                    
                    if (myBadgesCount >= targetLimit) {
                        conditionMet = false;
                        break;
                    }
                    
                    let targetOpp: any = null;
                    const totalGyms = MapSystemClass.size === 7 ? 4 : 8;
                    
                    for (const opp of opponents) {
                        for (let i = 0; i < totalGyms; i++) {
                            if (opp.badges[i] && !p.badges[i]) {
                                targetOpp = opp;
                                break;
                            }
                        }
                        if (targetOpp) break;
                    }
                    
                    const starterHealthy = p.team[0] && !p.team[0].isFainted() && p.team[0].currentHp / p.team[0].maxHp > 0.5;
                    if (targetOpp && starterHealthy) {
                        conditionMet = true;
                        currentTarget = targetOpp.id;
                    }
                    break;
                }
                case 'troques': {
                    const opponents = Game.players.filter((pl: any) => pl.id !== p.id);
                    const getStats = (mon: any) => mon.maxHp + mon.atk + mon.def + mon.speed;
                    const myWorstStats = Math.min(...p.team.map((m: any) => getStats(m)));
                    const targetBestStats = opponents.length > 0 ? Math.max(...opponents.flatMap((opp: any) => opp.team.map((m: any) => getStats(m)))) : 0;
                    conditionMet = opponents.length > 0 && (targetBestStats - myWorstStats > 80);
                    break;
                }
                case 'trade_fail':
                case 'slow':
                case 'curse':
                case 'michael':
                    conditionMet = Game.players.some((pl: any) => pl.id !== p.id);
                    break;
                case 'rocket': {
                    const opponents = Game.players.filter((pl: any) => pl.id !== p.id);
                    conditionMet = opponents.some((opp: any) => opp.cards.length > 0);
                    break;
                }
                case 'bag': {
                    const opponents = Game.players.filter((pl: any) => pl.id !== p.id);
                    conditionMet = opponents.some((opp: any) => Object.values(opp.items || {}).reduce((s: number, v: any) => s + v, 0) > 0);
                    break;
                }
                case 'spy': {
                    const opponents = Game.players.filter((pl: any) => pl.id !== p.id);
                    conditionMet = opponents.some((opp: any) => opp.cards.length > 0);
                    break;
                }
                case 'swap': {
                    const opponents = Game.players.filter((pl: any) => pl.id !== p.id);
                    const myIdx = MapSystemClass.getIndex(p.x, p.y);
                    const hasAheadOpponent = opponents.some((opp: any) => {
                        const oppIdx = MapSystemClass.getIndex(opp.x, opp.y);
                        return oppIdx > myIdx + 5;
                    });
                    conditionMet = hasAheadOpponent;
                    break;
                }
                case 'communism': {
                    const totalCards = Game.players.reduce((sum: number, pl: any) => sum + pl.cards.length, 0);
                    const avgCards = totalCards / Game.players.length;
                    conditionMet = p.cards.length < avgCards - 1;
                    break;
                }
                case 'imposto': {
                    const totalCards = Game.players.reduce((sum: number, pl: any) => sum + pl.cards.length, 0);
                    const avgCards = totalCards / Game.players.length;
                    conditionMet = p.cards.length < avgCards;
                    break;
                }
                case 'katrina': {
                    const opponents = Game.players.filter((pl: any) => pl.id !== p.id);
                    const myIdx = MapSystemClass.getIndex(p.x, p.y);
                    const maxOpponentIdx = Math.max(...opponents.map((opp: any) => MapSystemClass.getIndex(opp.x, opp.y)));
                    conditionMet = maxOpponentIdx > myIdx + 10;
                    break;
                }
                case 'dice': {
                    const currentIdx = MapSystemClass.getIndex(p.x, p.y);
                    const totalTiles = MapSystemClass.size * MapSystemClass.size;
                    let gymOrCityInRange = false;
                    for (let v = 1; v <= 20; v++) {
                        const nextIdx = (currentIdx + v) % totalTiles;
                        const coord = MapSystemClass.getCoord(nextIdx);
                        const tileType = MapSystemClass.grid[coord.y][coord.x];
                        if (tileType === TILE.GYM) {
                            const gymId = MapSystemClass.gymLocations[`${coord.x},${coord.y}`];
                            if (gymId && !p.badges[gymId - 1]) {
                                gymOrCityInRange = true;
                                break;
                            }
                        } else if (tileType === TILE.CITY) {
                            gymOrCityInRange = true;
                            break;
                        }
                    }
                    conditionMet = gymOrCityInRange && !Game.hasRolled;
                    break;
                }
                case 'reroll':
                    conditionMet = !Game.hasRolled;
                    break;
            }

            if (conditionMet) {
                selectedCardIndex = index;
                cardToPlayId = cardId;
                targetArg = currentTarget;
                break;
            }
        }

        if (selectedCardIndex >= 0) {
            p.effects.cardsPlayedThisTurn = (p.effects.cardsPlayedThisTurn || 0) + 1;
            if (Game.updateHUD) Game.updateHUD();
            CardsObj.activate(cardToPlayId, targetArg);
            return true;
        }
        return false;
    }

    static cpuUseItems(p: Player) {
        const GameEventsObj = (window as any).GameEvents || GameEvents;
        if (!GameEventsObj) return;

        // 1. Lógica de Mega Pedra (se tiver 'megastone' no inventário)
        if (p.items['megastone'] > 0) {
            for (let idx = 0; idx < p.team.length; idx++) {
                const mon = p.team[idx];
                if (MAPA_MEGAS[mon.id] && !mon.megaStone) {
                    // Se o Pokémon estiver segurando um item comum, remove-o
                    if (mon.heldItem) {
                        if (typeof GameEventsObj.removeHeldItem === 'function') {
                            GameEventsObj.removeHeldItem(p.id, idx);
                        }
                    }
                    // Agora equipa a Mega Pedra
                    const itemData = SHOP_ITEMS.find(i => i.id === 'megastone');
                    if (itemData) {
                        if (typeof GameEventsObj.applyBoardItemEffect === 'function') {
                            GameEventsObj.applyBoardItemEffect(p, itemData, idx);
                        }
                    }
                    break; // equipa uma por vez
                }
            }
        }

        // 2. Reviver Pokémon desmaiados
        const hasFainted = p.team.some(m => m.isFainted());
        if (hasFainted) {
            if (p.items['ultramaxrevive'] > 0) {
                const itemData = SHOP_ITEMS.find(i => i.id === 'ultramaxrevive');
                if (itemData && typeof GameEventsObj.applyBoardItemEffect === 'function') {
                    GameEventsObj.applyBoardItemEffect(p, itemData, -1);
                }
            } else {
                for (let idx = 0; idx < p.team.length; idx++) {
                    const mon = p.team[idx];
                    if (mon.isFainted()) {
                        let itemToUse = '';
                        if (p.items['maxrevive'] > 0) itemToUse = 'maxrevive';
                        else if (p.items['revive'] > 0) itemToUse = 'revive';
                        
                        if (itemToUse) {
                            const itemData = SHOP_ITEMS.find(i => i.id === itemToUse);
                            if (itemData && typeof GameEventsObj.applyBoardItemEffect === 'function') {
                                GameEventsObj.applyBoardItemEffect(p, itemData, idx);
                            }
                        }
                    }
                }
            }
        }

        // 3. Curar Pokémon com HP baixo (ex: <= 60% HP)
        const needsHeal = p.team.some(m => !m.isFainted() && m.currentHp / m.maxHp <= 0.6);
        if (needsHeal) {
            if (p.items['ultrafullrestore'] > 0) {
                const itemData = SHOP_ITEMS.find(i => i.id === 'ultrafullrestore');
                if (itemData && typeof GameEventsObj.applyBoardItemEffect === 'function') {
                    GameEventsObj.applyBoardItemEffect(p, itemData, -1);
                }
            } else {
                for (let idx = 0; idx < p.team.length; idx++) {
                    const mon = p.team[idx];
                    if (!mon.isFainted() && mon.currentHp / mon.maxHp <= 0.6) {
                        let itemToUse = '';
                        if (p.items['hyperpotion'] > 0) itemToUse = 'hyperpotion';
                        else if (p.items['superpotion'] > 0) itemToUse = 'superpotion';
                        else if (p.items['potion'] > 0) itemToUse = 'potion';
                        
                        if (itemToUse) {
                            const itemData = SHOP_ITEMS.find(i => i.id === itemToUse);
                            if (itemData && typeof GameEventsObj.applyBoardItemEffect === 'function') {
                                GameEventsObj.applyBoardItemEffect(p, itemData, idx);
                            }
                        }
                    }
                }
            }
        }

        // 4. Equipar itens de segurar
        const holdItemKeys = ['amulet_coin', 'leftovers', 'quick_claw', 'sitrus_berry', 'scope_lens', 'choice_band', 'choice_scarf', 'rocky_helmet'];
        for (const key of holdItemKeys) {
            if (p.items[key] > 0) {
                for (let idx = 0; idx < p.team.length; idx++) {
                    const mon = p.team[idx];
                    if (!mon.heldItem && !mon.megaStone) {
                        // Evita equipar se o Pokémon for compatível com Mega e a CPU tiver/puder ter planos para Mega Pedra
                        if (MAPA_MEGAS[mon.id] && p.items['megastone'] > 0) {
                            continue;
                        }
                        const itemData = SHOP_ITEMS.find(i => i.id === key);
                        if (itemData && typeof GameEventsObj.applyBoardItemEffect === 'function') {
                            GameEventsObj.applyBoardItemEffect(p, itemData, idx);
                        }
                        break; // equipa um por loop
                    }
                }
            }
        }
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
