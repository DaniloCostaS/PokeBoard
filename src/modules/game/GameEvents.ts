import { GameState } from './GameState';
import { GameUI } from './GameUI';
import { Player } from '../../models/Player';
import { Pokemon } from '../../models/Pokemon';
import { MapSystem } from '../../systems/MapSystem';
import { Battle } from '../../systems/Battle';
import { Shop } from '../../systems/Shop';
import { Cards } from '../../systems/Cards';
import { Network, db } from '../../systems/Network';
import { ref, update } from 'firebase/database';
import { TILE, NPC_DATA, SHOP_ITEMS } from '../../constants';
import { GLOBAL_EVENTS } from '../../constants/globalEvents';
import { GYM_DATA } from '../../constants/gyms'; // ADICIONE ESTA LINHA
import { GameSpawns } from './GameSpawns';       // ADICIONE ESTA LINHA
import type { ItemData } from '../../constants';

export class GameEvents {

    static triggerVictory(winnerId: number) {
        const winner = GameState.players.find(p => p.id === winnerId);
        if (!winner) return;

        document.getElementById('win-avatar')!.setAttribute('src', winner.avatar);
        document.getElementById('win-name')!.innerText = winner.name;

        const teamContainer = document.getElementById('win-team-container')!;
        teamContainer.innerHTML = winner.team.map(mon => `
            <div class="win-mon-card">
                <img src="${mon.getSprite()}">
                <div style="font-size:0.7rem; font-weight:bold;">${mon.name}</div>
                <div style="font-size:0.6rem;">Lv.${mon.level}</div>
            </div>
        `).join('');

        const badgeContainer = document.getElementById('win-badges-container')!;
        badgeContainer.innerHTML = '';

        for (let i = 0; i < 8; i++) {
            const actualGymId = GameState.activeGyms ? GameState.activeGyms[i] : (i + 1);
            const gym = GYM_DATA.find((g: any) => g.id === actualGymId);
            if (gym) {
                const img = document.createElement('img');
                img.src = `/assets/img/Insignias/${gym.badgeImg}`;
                img.className = 'win-badge-img';
                img.title = `Insígnia ${gym.type}`;
                badgeContainer.appendChild(img);
            }
        }

        document.getElementById('victory-modal')!.style.display = 'flex';
        console.log("GAME OVER - VITORIA!");
    }

    static getLastCityCoord(p: Player): { x: number, y: number } {
        let currentIdx = MapSystem.getIndex(p.x, p.y);
        while (currentIdx >= 0) {
            const coord = MapSystem.getCoord(currentIdx);
            if (MapSystem.grid[coord.y][coord.x] === TILE.CITY) return coord;
            currentIdx--;
        }
        return { x: 0, y: 0 };
    }

    static handleTotalDefeat(p: Player) {
        const msg = `🚑 ${p.name} sofreu uma derrota total!\nSerá levado ao último Centro Pokémon para recuperação emergencial.`;
        const city = this.getLastCityCoord(p);
        p.x = city.x;
        p.y = city.y;

        if (p.effects && p.effects.tremembeUserTurns && p.effects.tremembeUserTurns > 0) {
            GameUI.sendGlobalLog(`⚖️ DECRETO DE TREMEMBÉ! ${p.name} está sob o privilégio do decreto e foi resgatado sem perder turnos!`);
        } else {
            p.skipTurns += 2;
            GameUI.sendGlobalLog(`🚑 ${p.name} foi resgatado! Equipe totalmente curada no Centro Pokémon, mas perderá 2 turnos.`);
        }

        p.team.forEach(mon => { mon.currentHp = mon.maxHp; });
        GameUI.showGlobalAlert(msg, p.name, true, false);
        GameUI.moveVisuals();
        GameUI.updateHUD();

        const NetworkObj = (window as any).Network || Network;
        if (NetworkObj.isOnline && p.id === NetworkObj.myPlayerId) {
            NetworkObj.syncPlayerState();
        }
    }

    static triggerDecadeBonus(p: Player) {
        const NetworkObj = (window as any).Network || Network;
        if (NetworkObj && NetworkObj.isOnline && p.id !== NetworkObj.myPlayerId) return;

        const roll = Math.random();
        if (roll <= 0.25) {
            const undefeatedGyms: { x: number, y: number, id: number }[] = [];
            for (const key in MapSystem.gymLocations) {
                const id = MapSystem.gymLocations[key];
                if (!p.badges[id - 1]) {
                    const [gx, gy] = key.split(',').map(Number);
                    undefeatedGyms.push({ x: gx, y: gy, id: id });
                }
            }

            if (undefeatedGyms.length > 0) {
                const randomGym = undefeatedGyms[Math.floor(Math.random() * undefeatedGyms.length)];
                p.x = randomGym.x;
                p.y = randomGym.y;
                GameUI.moveVisuals();
                GameState.hasRolled = true;

                const msgLocal = `🌀 VÓRTICE DA RODADA ${GameState.round}!\n\nVocê foi sugado diretamente para as portas de um Ginásio invicto!`;
                GameState.pendingTileEvent = true;
                GameUI.showGlobalAlert(msgLocal, p.name, true, false);

                if (NetworkObj.isOnline) {
                    NetworkObj.syncPlayerState();
                    NetworkObj.sendAction('LOG', { msg: `🌀 VÓRTICE! ${p.name} foi sugado para um Ginásio na Rodada ${GameState.round}!` });
                }
                return;
            }
        }

        const CardsObj = (window as any).Cards || Cards;
        const c1 = CardsObj.draw(p, true);
        const c2 = CardsObj.draw(p, true);

        const msgLocal = `🎁 BÔNUS DA RODADA ${GameState.round}!\n\nVocê recebeu suporte aéreo e ganhou 2 cartas:\n- ${c1.name}\n- ${c2.name}`;
        GameUI.updateHUD();
        GameUI.showGlobalAlert(msgLocal, p.name, true, false);

        if (NetworkObj.isOnline) {
            NetworkObj.syncPlayerState();
            NetworkObj.sendAction('LOG', { msg: `🎁 ${p.name} recebeu 2 Cartas bônus da Rodada ${GameState.round}!` });
        }
    }

    static handleTile(p: Player) {
        const NetworkObj = (window as any).Network || Network;
        const BattleObj = (window as any).Battle || Battle;
        if (BattleObj.active) return;

        if (p.isDefeated()) {
            this.handleTotalDefeat(p);
            this.nextTurn();
            return;
        }

        const type = MapSystem.grid[p.y][p.x];
        const enemy = GameState.players.find(o => o !== p && o.x === p.x && o.y === p.y);

        if (enemy) {
            const defMon = enemy.team.find(m => !m.isFainted());
            if (defMon) {
                GameUI.sendGlobalLog(`⚔️ Conflito! ${p.name} vs ${enemy.name}`);
                BattleObj.setup(p, defMon, true, enemy.name, 0, enemy, false, 0, "", type);
            } else {
                GameUI.log(`${enemy.name} sem pokemons!`);
                this.nextTurn();
            }
            return;
        }

        if (NPC_DATA[type]) {
            const npc = NPC_DATA[type];
            const npcImg = npc.img ? `/assets/img/NPCs/${npc.img}` : '/assets/img/Treinadores/Red.jpg';
            const npcLevel = GameState.getGlobalAverageLevel();
            const teamSize = GameState.getGlobalAverageTeamSize();
            const npcTeam: Pokemon[] = [];

            for (let i = 0; i < teamSize; i++) {
                const monId = npc.team[Math.floor(Math.random() * npc.team.length)];
                npcTeam.push(new Pokemon(monId, npcLevel, null));
            }

            BattleObj.setup(p, npcTeam as any, false, npc.name, npc.gold, null, false, 0, npcImg, type);
            return;
        }

        if (type === TILE.CITY) {
            GameState.isCityEvent = true;
            const cityGold = document.getElementById('city-gold-display');
            if (cityGold) cityGold.innerText = `Saldo: ${p.gold}G`;
            document.getElementById('city-modal')!.style.display = 'flex';
        }
        else if (type === TILE.EVENT) {
            if (GameState.currentGlobalEvent?.id === 'LOTTERY_DAY') {
                p.gold += 500;
                const CardsObj = (window as any).Cards || Cards;
                CardsObj.draw(p, true);
                const lotteryMsg = `🎰 DIA DE LOTERIA! Você visitou a casa de Evento e ganhou o prêmio acumulado de 500G e 1 Carta!`;
                GameUI.sendGlobalLog(lotteryMsg);
                GameUI.showGlobalAlert(lotteryMsg, p.name, true);
                if (NetworkObj.isOnline) {
                    NetworkObj.syncPlayerState();
                    NetworkObj.sendAction('LOG', { msg: lotteryMsg });
                }
                return;
            }

            let localMsg = "";
            let remoteMsg = "";
            const eventRoll = Math.random();

            if (eventRoll < 0.15) {
                const totalTiles = MapSystem.size * MapSystem.size;
                const randomIdx = Math.floor(Math.random() * totalTiles);
                const targetCoord = MapSystem.getCoord(randomIdx);

                p.x = targetCoord.x;
                p.y = targetCoord.y;
                GameUI.moveVisuals();

                localMsg = `🌀 UM VÓRTICE SE ABRIU!\n\nVocê pisou em uma fenda espacial e foi teletransportado para uma área aleatória do mapa!`;
                remoteMsg = `🌀 ${p.name} pisou em um vórtice e foi teletransportado!`;

                GameUI.log(localMsg.replace(/\n\n/g, ' '));
                GameState.pendingTileEvent = true;
                GameUI.showGlobalAlert(localMsg, p.name, true, false);

                if (NetworkObj.isOnline) {
                    NetworkObj.syncPlayerState();
                    NetworkObj.sendAction('LOG', { msg: remoteMsg });
                    NetworkObj.sendAction('SHOW_ALERT', { msg: remoteMsg, playerName: p.name, endsTurn: false });
                }
                return;
            }

            if (Math.random() < 0.5) {
                const CardsObj = (window as any).Cards || Cards;
                const card = CardsObj.draw(p, true);
                localMsg = `Você explorou o evento e encontrou uma carta:\n\n${card.icon} ${card.name}`;
                remoteMsg = `🌟 ${p.name} explorou o evento e encontrou uma Carta Misteriosa!`;
            } else {
                const itemRoll = Math.random();
                let giftId = '';

                if (itemRoll < 0.05) {
                    const rareItems = ['ultrafullrestore', 'ultramaxrevive', 'masterball'];
                    giftId = rareItems[Math.floor(Math.random() * rareItems.length)];
                } else {
                    const normalItems = SHOP_ITEMS.filter(i => !['ultrafullrestore', 'ultramaxrevive', 'masterball'].includes(i.id));
                    const randomItem = normalItems[Math.floor(Math.random() * normalItems.length)];
                    giftId = randomItem.id;
                }

                const itemData = SHOP_ITEMS.find(i => i.id === giftId);
                const itemName = itemData ? itemData.name : giftId;

                this.addItem(p, giftId, 1);
                localMsg = `Você explorou o evento e encontrou um item:\n\n🎒 ${itemName}`;
                remoteMsg = `🌟 ${p.name} explorou o evento e encontrou: ${itemName}!`;
            }

            GameUI.log(localMsg.replace(/<[^>]*>?/gm, '').replace(/\n\n/g, ' '));
            GameUI.showGlobalAlert(localMsg, p.name, true);

            if (NetworkObj.isOnline) {
                NetworkObj.sendAction('LOG', { msg: remoteMsg });
                NetworkObj.sendAction('SHOW_ALERT', { msg: remoteMsg, playerName: p.name });
            }
        }
        else if (type === TILE.GYM) {
            const gymId = MapSystem.gymLocations[`${p.x},${p.y}`] || 1;

            if (GameState.currentGlobalEvent?.id === 'GYM_VACATION') {
                const vacationMsg = `🏖️ GINÁSIO TRANCADO! O Líder está de férias! Volte quando o evento de Férias Coletivas acabar.`;
                GameUI.showGlobalAlert(vacationMsg, p.name, true);
                return;
            }

            if (p.effects.escapedGym) {
                GameUI.log("💨 Você usou Fumaça Ninja e o Líder ainda não te notou...");
                this.nextTurn();
                return;
            }

            if (!p.badges[gymId - 1]) {
                BattleObj.setup(p, new Pokemon(150, 1, false), false, "Líder de Ginásio", 1000, null, true, gymId, "", type);
            }
            else {
                const roll = Math.floor(Math.random() * 100) + 1;
                let didTeleport = false;

                if (roll <= 25) {
                    const undefeatedGyms: { x: number, y: number, id: number }[] = [];
                    for (const key in MapSystem.gymLocations) {
                        const id = MapSystem.gymLocations[key];
                        if (!p.badges[id - 1]) {
                            const [gx, gy] = key.split(',').map(Number);
                            undefeatedGyms.push({ x: gx, y: gy, id: id });
                        }
                    }

                    if (undefeatedGyms.length > 0) {
                        const randomGym = undefeatedGyms[Math.floor(Math.random() * undefeatedGyms.length)];
                        GameUI.sendGlobalLog(`🌪️ UAU! A estátua do Ginásio reagiu e teletransportou ${p.name} para um desafio inédito!`);

                        p.x = randomGym.x;
                        p.y = randomGym.y;
                        GameUI.moveVisuals();

                        BattleObj.setup(p, new Pokemon(150, 1, false), false, "Líder de Ginásio", 1000, null, true, randomGym.id, "", type);
                        didTeleport = true;
                    }
                }

                if (!didTeleport) {
                    const msgLocal = `Você descansou no Ginásio aliado e encontrou uma carta!\n\n🎒 Ganhou 1 Carta`;
                    const msgGlobal = `🎒 ${p.name} visitou um Ginásio já vencido e ganhou 1 Carta!`;

                    const CardsObj = (window as any).Cards || Cards;
                    if (CardsObj) CardsObj.draw(p, true);

                    GameUI.log(msgLocal.replace(/\n\n/g, ' '));
                    GameUI.showGlobalAlert(msgLocal, p.name, true);

                    if (NetworkObj.isOnline) {
                        NetworkObj.sendAction('LOG', { msg: msgGlobal });
                        NetworkObj.sendAction('SHOW_ALERT', { msg: msgGlobal, playerName: p.name });
                    }
                }
            }
        }
        else if ([TILE.GRASS, TILE.WATER, TILE.GROUND].includes(type)) {
            if (Math.random() < 0.8) {

                const wildMon = GameSpawns.generateWildPokemon(type);

                if (wildMon.isLegendary) {
                    GameState.pendingLegendaryEncounter = { mon: wildMon, type: type };
                    const msgLocal = `⚠️ ALERTA LENDÁRIO!\n\nVocê encontrou um ${wildMon.name} selvagem!||LEGENDARY:${wildMon.name}||MY_ENCOUNTER`;
                    const msgGlobal = `⚠️ ALERTA LENDÁRIO! ${p.name} encontrou um ${wildMon.name} selvagem!||LEGENDARY:${wildMon.name}`;

                    GameUI.log(msgLocal.replace(/\n\n/g, ' ').split('||')[0]);
                    GameUI.showGlobalAlert(msgLocal, p.name, true, false);

                    if (NetworkObj.isOnline) {
                        NetworkObj.sendAction('LOG', { msg: msgGlobal.split('||')[0] });
                        NetworkObj.sendAction('SHOW_ALERT', { msg: msgGlobal, playerName: p.name, endsTurn: false });
                    }
                } else {
                    BattleObj.setup(p, wildMon, false, "Selvagem", 0, null, false, 0, "", type);
                }
            }
            else {
                const messages = ["Você procurou, mas nenhum Pokémon selvagem apareceu dessa vez!", "O mato se mexeu... mas era só o vento 😅", "Nada de Pokémon por aqui... talvez na próxima!", "Está tudo muito quieto...", "Um Pidgey voou longe, você não alcançou."];
                const msg = messages[Math.floor(Math.random() * messages.length)];

                GameUI.log(msg);
                GameUI.showGlobalAlert(msg, p.name, true);

                if (NetworkObj.isOnline) {
                    NetworkObj.sendAction('SHOW_ALERT', { msg: msg, playerName: p.name });
                }
            }
        }
        else {
            this.nextTurn();
        }
    }

    static handleCityChoice(c: string) {
        const player = GameState.getCurrentPlayer();
        const NetworkObj = (window as any).Network || Network;

        if (GameState.currentGlobalEvent?.id === 'EMP' && c !== 'shop') {
            GameUI.showGlobalAlert("📡 A Tempestade Eletromagnética derrubou a energia do Centro Pokémon! Cura e Compra de Cartas inoperantes.", player.name, true, false);
            return;
        }

        if (c === 'heal') {
            player.team.forEach(p => { p.currentHp = p.maxHp; });
            GameUI.sendGlobalLog(`🏥 ${player.name} recuperou seu time no Centro Pokémon!`);
            GameUI.updateHUD();
            GameState.isCityEvent = false;

            if (NetworkObj.isOnline) NetworkObj.syncPlayerState();

            document.getElementById('city-modal')!.style.display = 'none';
            this.nextTurn();
        }
        else if (c === 'card') {
            if (player.gold >= 500) {
                player.gold -= 500;
                GameState.isCityEvent = false;
                document.getElementById('city-modal')!.style.display = 'none';

                const CardsObj = (window as any).Cards || Cards;
                const card = CardsObj.draw(player, true);

                const localMsg = `Você comprou uma carta misteriosa no mercado negro por 500G:\n\n${card.icon} ${card.name}`;
                const remoteMsg = `🃏 ${player.name} comprou uma Carta Misteriosa no Centro Pokémon!`;

                GameUI.log(localMsg.replace(/\n\n/g, ' '));
                GameUI.sendGlobalLog(`💰 [Extrato] ${player.name} gastou -500G (Compra de Carta).`);
                GameUI.sendGlobalLog(`💰 [Extrato] Novo Saldo: ${player.gold}G.`);
                GameUI.updateHUD();

                GameUI.showGlobalAlert(localMsg, player.name, true, true);

                if (NetworkObj.isOnline) {
                    NetworkObj.syncPlayerState();
                    NetworkObj.sendAction('LOG', { msg: remoteMsg });
                    NetworkObj.sendAction('SHOW_ALERT', { msg: remoteMsg, playerName: player.name });
                }
            } else {
                alert("Ouro insuficiente! Você precisa de 500G para comprar uma carta.");
            }
        }
        else if (c === 'shop') {
            document.getElementById('city-modal')!.style.display = 'none';
            Shop.open();
        }
    }

    static nextTurn() {
        GameState.saveGame();
        const currentP = GameState.getCurrentPlayer();
        const NetworkObj = (window as any).Network || Network;
        currentP.resetTurnFlags();

        let shouldSyncEffects = false;

        if (currentP.effects && currentP.effects.offensiveCardsUsed) {
            currentP.effects.offensiveCardsUsed = 0;
            shouldSyncEffects = true;
        }

        if (GameState.hasRolled && currentP.effects) {
            let effectsChanged = false;

            if (currentP.effects.lureShiny && currentP.effects.lureShiny > 0) {
                currentP.effects.lureShiny--;
                if (currentP.effects.lureShiny === 0) GameUI.sendGlobalLog(`✨ Lure Shiny de ${currentP.name} perdeu a força.`);
                effectsChanged = true;
            }

            if (currentP.effects.doubleXp && currentP.effects.doubleXp > 0) {
                currentP.effects.doubleXp--;
                if (currentP.effects.doubleXp === 0) GameUI.sendGlobalLog(`📉 O efeito Double XP de ${currentP.name} acabou.`);
                effectsChanged = true;
            }

            if (currentP.effects.expShare && currentP.effects.expShare > 0) {
                currentP.effects.expShare--;
                if (currentP.effects.expShare === 0) GameUI.sendGlobalLog(`📉 O efeito Exp. Share de ${currentP.name} acabou.`);
                effectsChanged = true;
            }

            if (currentP.effects.tremembeUserTurns && currentP.effects.tremembeUserTurns > 0) {
                currentP.effects.tremembeUserTurns--;
                if (currentP.effects.tremembeUserTurns === 0) GameUI.sendGlobalLog(`⛓️ O decreto de Tremembé de ${currentP.name} expirou.`);
                effectsChanged = true;
            }

            if (effectsChanged) shouldSyncEffects = true;
        }

        if (shouldSyncEffects) {
            if (NetworkObj && NetworkObj.isOnline) NetworkObj.syncSpecificPlayer(currentP.id);
        }

        if (currentP.effects.extraTurn) {
            currentP.effects.extraTurn = false;
            GameState.hasRolled = false;
            GameUI.sendGlobalLog(`⏳ ${currentP.name} joga novamente!`);
            GameUI.updateHUD();
            this.checkTurnControl();
            return;
        }

        GameUI.sendGlobalLog(`🛑 Fim do turno de ${currentP.name} 🛑`);

        const nextTurnIdx = (GameState.turn + 1) % GameState.players.length;
        const roomUpdates: any = {};

        if (nextTurnIdx === 0) {
            GameState.round++;
            roomUpdates[`round`] = GameState.round;

            if (GameState.currentGlobalEvent && GameState.round >= GameState.eventEndRound) {
                GameState.currentGlobalEvent = null;
                roomUpdates[`currentEventId`] = null;
                roomUpdates[`eventEndRound`] = 0;
                GameUI.sendGlobalLog("🌍 O clima do mundo voltou à normalidade.");
            }

            if (GameState.round % 5 === 2) {
                const eligibleEvents = GLOBAL_EVENTS.filter((e: any) => {
                    if (e.minRound !== undefined && GameState.round < e.minRound) return false;
                    if (e.maxRound !== undefined && GameState.round > e.maxRound) return false;
                    return true;
                });
                const eventPool = eligibleEvents.length > 0 ? eligibleEvents : GLOBAL_EVENTS;
                const ev = eventPool[Math.floor(Math.random() * eventPool.length)];

                GameState.currentGlobalEvent = ev;
                GameState.eventEndRound = GameState.round + 5;
                roomUpdates[`currentEventId`] = ev.id;
                roomUpdates[`eventEndRound`] = GameState.eventEndRound;

                const msgGlobal = `🌍 ALERTA GLOBAL! O evento ${ev.name} começou!||EVENT:${ev.id}`;

                if (ev.id === 'TAX_SEASON') {
                    GameState.players.forEach(p => {
                        if (p.cards.length > 0) {
                            const lost = Math.floor(p.cards.length / 2);
                            for (let i = 0; i < lost; i++) p.cards.splice(Math.floor(Math.random() * p.cards.length), 1);
                        }
                        for (const k in p.items) if (p.items[k] > 0) p.items[k] = Math.ceil(p.items[k] / 2);
                        GameUI.sendGlobalLog(`🃏 [Extrato] ${p.name} pagou impostos. Cartas restantes: ${p.cards.length}`);
                        roomUpdates[`players/${p.id}/cards`] = p.cards;
                        roomUpdates[`players/${p.id}/items`] = p.items;
                    });
                    GameUI.sendGlobalLog("📜 IMPOSTO DE RENDA: Todos os jogadores perderam metade de suas cartas e itens!");
                }

                GameUI.log(msgGlobal);
                if (NetworkObj.isOnline) NetworkObj.sendAction('LOG', { msg: msgGlobal });
            }
        }

        GameState.turn = nextTurnIdx;
        GameState.hasRolled = false;
        roomUpdates[`turn`] = GameState.turn;

        if (NetworkObj.isOnline && db) {
            update(ref(db, `rooms/${NetworkObj.currentRoomId}`), roomUpdates);
        } else if (!NetworkObj.isOnline) {
            const nextP = GameState.players[GameState.turn];
            if (nextP.skipTurns > 0) {
                nextP.skipTurns = Math.max(0, nextP.skipTurns - 1);
                if (!nextP.stats) nextP.stats = { cardsUsed: 0, cardsSuffered: 0, effectsReceived: {}, cardsDefended: {}, turnsLost: 0 };
                nextP.stats.turnsLost++;
                GameUI.sendGlobalLog(`${nextP.name} perdeu a vez! (Restam: ${nextP.skipTurns})`);
                alert(`${nextP.name} perdeu a vez!`);
                this.nextTurn();
                return;
            }
        }

        GameUI.updateHUD();
        GameUI.moveVisuals();
        this.checkTurnControl();
    }

    static checkTurnControl() {
        const BattleObj = (window as any).Battle || Battle;
        const NetworkObj = (window as any).Network || Network;
        if (BattleObj && BattleObj.active) return;

        const btn = document.getElementById('roll-btn') as HTMLButtonElement;
        const me = NetworkObj.myPlayerId;
        const ind = document.getElementById('online-indicator');

        const processDecadeBonus = (player: Player) => {
            if (GameState.round > 1 && GameState.round % 10 === 0) {
                if (player.effects.lastBonusRound !== GameState.round) {
                    player.effects.lastBonusRound = GameState.round;
                    if (player.skipTurns === 0 && !player.isProcessingSkip) {
                        this.triggerDecadeBonus(player);
                    } else {
                        GameUI.log(`❌ ${player.name} está paralisado e perdeu o bônus da Rodada ${GameState.round}!`);
                        if (NetworkObj && NetworkObj.isOnline) NetworkObj.syncSpecificPlayer(player.id);
                    }
                }
            }
        };

        const processTrucoSeis = (player: Player) => {
            if (player.skipTurns > 0 || player.isProcessingSkip) return;
            if (GameState.currentGlobalEvent?.id === 'TRUCO_SEIS') {
                if (player.cards.length > 6) {
                    const lostCount = player.cards.length - 6;
                    while (player.cards.length > 6) {
                        player.cards.splice(Math.floor(Math.random() * player.cards.length), 1);
                    }
                    GameUI.sendGlobalLog(`🃏 ${player.name} excedeu o limite do TRUCO e perdeu ${lostCount} carta(s)! (Total: ${player.cards.length})`);

                    if (GameState.turn === NetworkObj.myPlayerId || !NetworkObj.isOnline) {
                        GameUI.showGlobalAlert(`🃏 GRITARAM TRUCO!\n\nVocê tinha mais de 6 cartas e precisou descartar ${lostCount} aleatoriamente para continuar.`, player.name, true, false);
                        GameUI.updateHUD();
                    }
                    if (NetworkObj && NetworkObj.isOnline) NetworkObj.syncSpecificPlayer(player.id);
                }
            }
        };

        const processStartTurnGifts = (player: Player) => {
            if (player.skipTurns > 0 || player.isProcessingSkip) return;
            if (player.effects.lastGiftRound === GameState.round) return;
            player.effects.lastGiftRound = GameState.round;

            let gainedAny = false;
            let logMsg = "";
            const balls = ['pokeball', 'greatball', 'ultraball', 'masterball'];
            const hasAnyBall = balls.some(b => (player.items[b] || 0) > 0);

            if (!hasAnyBall) {
                this.addItem(player, 'pokeball', 1);
                logMsg += `🎒 Sem Pokébolas! Ganhou 1 Pokébola de cortesia. `;
                gainedAny = true;
            }

            if (player.cards.length === 0) {
                const CardsObj = (window as any).Cards || Cards;
                if (CardsObj) CardsObj.draw(player, true);
                logMsg += `🃏 Sem cartas! Ganhou 1 carta de cortesia.`;
                gainedAny = true;
            }

            if (gainedAny) {
                GameUI.sendGlobalLog(logMsg);
                if (GameState.turn === NetworkObj.myPlayerId || !NetworkObj.isOnline) {
                    GameUI.showGlobalAlert(`🎁 SUPORTE DE EMERGÊNCIA!\n\n${logMsg}`, player.name, true, false);
                    GameUI.updateHUD();
                }
                if (NetworkObj && NetworkObj.isOnline) NetworkObj.syncSpecificPlayer(player.id);
            }
        };

        if (NetworkObj.isOnline) {
            if (ind) ind.innerText = "FIREBASE";
            if (GameState.turn === me) {
                const myPlayer = GameState.players[me];
                const type = MapSystem.grid[myPlayer.y][myPlayer.x];

                if (type === TILE.GYM && !GameState.pendingTileEvent) {
                    const gymId = MapSystem.gymLocations[`${myPlayer.x},${myPlayer.y}`];
                    if (gymId && !myPlayer.badges[gymId - 1]) {
                        if (!myPlayer.effects.escapedGym) {
                            btn.disabled = true;
                            btn.innerText = "EM BATALHA";
                            if (!BattleObj.active) this.handleTile(myPlayer);
                            return;
                        }
                    }
                }

                processDecadeBonus(myPlayer);
                processTrucoSeis(myPlayer);
                processStartTurnGifts(myPlayer);

                if (GameState.currentGlobalEvent?.id === 'ROBIN_HOOD' && !myPlayer.effects.robinHoodApplied && myPlayer.skipTurns === 0 && !myPlayer.isProcessingSkip) {
                    if (myPlayer.gold < 200 && myPlayer.cards.length < 2) {
                        myPlayer.gold += 800;
                        const CardsObj = (window as any).Cards || Cards;
                        for (let i = 0; i < 5; i++) CardsObj.draw(myPlayer, true);
                        myPlayer.effects.robinHoodApplied = true;

                        const robinMsg = `🎁 AJUDA HUMANITÁRIA! Robin Hood te deu 800G e 5 Cartas por estar em dificuldade!`;
                        GameUI.sendGlobalLog(robinMsg);
                        GameUI.showGlobalAlert(robinMsg, myPlayer.name, true, false);

                        if (NetworkObj.isOnline) NetworkObj.syncPlayerState();
                        GameUI.updateHUD();
                    }
                }

                if (myPlayer.skipTurns > 0 || myPlayer.isProcessingSkip) {
                    btn.disabled = true;
                    if (!myPlayer.isProcessingSkip) {
                        btn.innerText = `Pulando vez... (${myPlayer.skipTurns})`;
                        myPlayer.isProcessingSkip = true;

                        myPlayer.skipTurns = Math.max(0, myPlayer.skipTurns - 1);
                        if (!myPlayer.stats) myPlayer.stats = { cardsUsed: 0, cardsSuffered: 0, effectsReceived: {}, cardsDefended: {}, turnsLost: 0 };
                        myPlayer.stats.turnsLost = (myPlayer.stats.turnsLost || 0) + 1;

                        GameUI.sendGlobalLog(`${myPlayer.name} perdeu a vez! (Restam: ${myPlayer.skipTurns})`);
                        if (NetworkObj && NetworkObj.isOnline) NetworkObj.syncPlayerState();

                        setTimeout(() => {
                            myPlayer.isProcessingSkip = false;
                            if (GameState.turn === me) {
                                this.nextTurn();
                            }
                        }, 2000);
                    }
                    return;
                }

                btn.disabled = false;
                btn.innerText = "ROLAR";
            } else {
                btn.disabled = true;
                btn.innerText = `Vez de ${GameState.players[GameState.turn].name}`;
            }
        } else {
            if (ind) ind.innerText = "OFFLINE";
            const currP = GameState.players[GameState.turn];
            const type = MapSystem.grid[currP.y][currP.x];

            if (type === TILE.GYM && !GameState.pendingTileEvent) {
                const gymId = MapSystem.gymLocations[`${currP.x},${currP.y}`];
                if (gymId && !currP.badges[gymId - 1]) {
                    if (!currP.effects.escapedGym) {
                        btn.disabled = true;
                        btn.innerText = "EM BATALHA";
                        if (!BattleObj.active) this.handleTile(currP);
                        return;
                    }
                }
            }

            processDecadeBonus(currP);
            processTrucoSeis(currP);
            processStartTurnGifts(currP);

            btn.disabled = false;
            btn.innerText = "ROLAR";
        }
    }

    static addItem(player: Player, itemId: string, amount: number = 1) {
        if (!player.items[itemId]) { player.items[itemId] = 0; }
        player.items[itemId] += amount;
        GameUI.updateHUD();
        const NetworkObj = (window as any).Network || Network;
        if (NetworkObj.isOnline) NetworkObj.syncPlayerState();
    }

    static useItemBoard(key: string, pId: number) {
        const p = GameState.players[pId];
        const item = SHOP_ITEMS.find(i => i.id === key);
        if (!item || p.items[key] <= 0) return;
        if (item.type === 'heal' || item.type === 'revive' || item.type === 'boost' || item.type === 'mega' || item.type === 'hold') {
            if (item.id === 'ultrafullrestore' || item.id === 'ultramaxrevive') {
                this.applyBoardItemEffect(p, item, -1);
                return;
            }
            GameUI.openItemTargetSelector(pId, key);
        }
    }

    static async applyBoardItemEffect(p: Player, item: ItemData, targetIdx: number) {
        let used = false;
        if (item.type === 'heal') {
            if (item.id === 'ultrafullrestore') {
                let count = 0; p.team.forEach(m => { if (!m.isFainted() && m.currentHp < m.maxHp) { m.heal(9999); count++; } });
                if (count > 0) { used = true; alert(`${count} Pokémon curados!`); } else alert("Ninguém precisa de cura!");
            } else {
                const target = p.team[targetIdx]; if (target.isFainted()) return alert("Não funciona em Pokémon desmaiado!");
                if (target.currentHp >= target.maxHp) return alert("HP já está cheio!"); target.heal(item.val || 20);
                alert(`Usou ${item.name} em ${target.name}.`); used = true;
            }
        } else if (item.type === 'revive') {
            if (item.id === 'ultramaxrevive') {
                let count = 0; p.team.forEach(m => { if (m.isFainted()) { m.revive(100); count++; } });
                if (count > 0) { used = true; alert(`${count} Pokémon revividos!`); } else alert("Ninguém está desmaiado!");
            } else {
                const target = p.team[targetIdx]; if (!target.isFainted()) return alert("Este Pokémon não está desmaiado!");
                target.revive(item.val || 50); alert(`Usou ${item.name} em ${target.name}.`); used = true;
            }
        } else if (item.type === 'boost') {
            const target = p.team[targetIdx];
            if (target) {
                target.bonusStats.hp += 1;
                target.bonusStats.atk += 1;
                target.bonusStats.def += 1;
                target.bonusStats.spd += 1;
                target.recalculateStats(false);
                alert(`✨ SUPLEMENTAÇÃO! O ${target.name} tomou as vitaminas e todos os seus status subiram +1!`);
                used = true;
            }
        } else if (item.type === 'mega') {
            const targetMon = p.team[targetIdx];
            if (targetMon) {
                const { MAPA_MEGAS } = await import('../../constants/mapaMegas');
                if (!MAPA_MEGAS[targetMon.id]) {
                    alert(`O Pokémon ${targetMon.name} não reage a esta Mega Pedra!`);
                    return;
                }
                if (targetMon.megaStone || targetMon.heldItem) {
                    alert(`${targetMon.name} já está segurando um item! Remova-o antes de equipar outro.`);
                    return;
                }
                targetMon.megaStone = true;
                alert(`💎 A Mega Pedra foi vinculada a ${targetMon.name}! Ele agora pode Mega Evoluir em batalha.`);
                used = true;
            }
        } else if (item.type === 'hold') {
            const targetMon = p.team[targetIdx];
            if (targetMon) {
                if (targetMon.megaStone || targetMon.heldItem) {
                    alert(`${targetMon.name} já está segurando um item! Remova-o antes de equipar outro.`);
                    return;
                }
                targetMon.heldItem = item.id;
                alert(`📦 ${targetMon.name} agora está segurando: ${item.name}!`);
                used = true;
            }
        }

        if (used) {
            p.items[item.id]--;
            GameUI.updateHUD();
            GameUI.openInventoryModal(p.id);
            GameState.saveGame();
            const NetworkObj = (window as any).Network || Network;
            if (NetworkObj.isOnline) {
                NetworkObj.sendAction('LOG', { msg: `${p.name} usou ${item.name}.` });
                NetworkObj.syncPlayerState();
            }
        }
    }

    static executeSwap(indexToRelease: number, newMon: Pokemon) {
        const p = GameState.getCurrentPlayer();
        const NetworkObj = (window as any).Network || Network;
        const BattleObj = (window as any).Battle || Battle;
        let discarded: Pokemon;

        if (indexToRelease === -1) {
            GameUI.log(`Libertou ${newMon.name} (enviado para a lixeira).`);
            discarded = newMon;
        } else {
            discarded = p.team[indexToRelease];
            GameUI.log(`Libertou ${discarded.name} e ficou com ${newMon.name}! (enviado para a lixeira).`);
            p.team[indexToRelease] = newMon;
        }

        discarded.currentHp = discarded.maxHp;
        GameState.lixeira.push(discarded);

        document.getElementById('swap-modal')!.style.display = 'none';
        GameUI.updateHUD();

        if (NetworkObj.isOnline) {
            NetworkObj.syncPlayerState();
            NetworkObj.syncLixeira();
        }

        setTimeout(() => BattleObj.end(false), 500);
    }

    static rescueFromLixeira(idx: number) {
        const mon = GameState.lixeira[idx];
        const p = GameState.getCurrentPlayer();
        const NetworkObj = (window as any).Network || Network;

        GameState.lixeira.splice(idx, 1);

        if (p.team.length < 6) {
            p.team.push(mon);
            GameUI.sendGlobalLog(`💚 ${p.name} resgatou ${mon.name} da lixeira!`);
            GameUI.updateHUD();
            if (NetworkObj.isOnline) {
                NetworkObj.syncPlayerState();
                NetworkObj.syncLixeira();
            }
        } else {
            GameUI.sendGlobalLog(`💚 ${p.name} quer resgatar ${mon.name} da lixeira... mas precisa abrir espaço!`);
            if (NetworkObj.isOnline) {
                NetworkObj.syncLixeira();
            }
            GameUI.openSwapModal(mon);
        }
    }

    static removeHeldItem(pId: number, slotIdx: number) {
        const p = GameState.players[pId];
        const mon = p.team[slotIdx];
        if (!mon) return;

        const NetworkObj = (window as any).Network || Network;

        if (mon.heldItem) {
            const itemKey = mon.heldItem;
            const itemData = SHOP_ITEMS.find(i => i.id === itemKey);
            mon.heldItem = null;
            p.items[itemKey] = (p.items[itemKey] || 0) + 1;
            
            GameUI.sendGlobalLog(`📦 ${p.name} removeu o item ${itemData?.name || itemKey} de ${mon.name}.`);
            GameUI.updateHUD();
            (GameUI as any).openPokemonDetail(pId, slotIdx);

            if (NetworkObj.isOnline) {
                NetworkObj.syncPlayerState();
            }
        }
    }

    // ==========================================
    // AÇÕES DO PAINEL ADMINISTRATIVO
    // ==========================================
    static adminGiveCard() {
        const select = document.getElementById('admin-player-select') as HTMLSelectElement;
        if (!select) return;
        const pIdx = parseInt(select.value, 10);
        const p = GameState.players[pIdx];
        if (!p) return;

        const CardsObj = (window as any).Cards;
        if (CardsObj) {
            CardsObj.draw(p, true);
            GameUI.sendGlobalLog(`🛠️ ADMIN HOST: Concedeu 1 Carta Aleatória para ${p.name}!`);
            const NetworkObj = (window as any).Network;
            if (NetworkObj && NetworkObj.isOnline) NetworkObj.syncSpecificPlayer(p.id);
            GameUI.updateHUD();
        }
    }

    static adminClearDebuffs() {
        const select = document.getElementById('admin-player-select') as HTMLSelectElement;
        if (!select) return;
        const pIdx = parseInt(select.value, 10);
        const p = GameState.players[pIdx];
        if (!p) return;

        p.effects = {};
        p.skipTurns = 0;
        p.isProcessingSkip = false;

        GameUI.sendGlobalLog(`🛠️ ADMIN HOST: Os efeitos de status negativos do jogador ${p.name} foram purificados!`);
        const NetworkObj = (window as any).Network;
        if (NetworkObj && NetworkObj.isOnline) NetworkObj.syncSpecificPlayer(p.id);
        GameUI.updateHUD();
    }

    static adminSetSkipTurns() {
        const select = document.getElementById('admin-player-select') as HTMLSelectElement;
        const valInput = document.getElementById('admin-skip-val') as HTMLInputElement;
        if (!select || !valInput) return;
        const pIdx = parseInt(select.value, 10);
        const val = parseInt(valInput.value, 10);
        const p = GameState.players[pIdx];
        if (!p || isNaN(val) || val < 0) return;

        p.skipTurns = val;
        p.isProcessingSkip = false;

        GameUI.sendGlobalLog(`🛠️ ADMIN HOST: Ajustou os turnos a perder de ${p.name} para ${val}!`);
        const NetworkObj = (window as any).Network;
        if (NetworkObj && NetworkObj.isOnline) NetworkObj.syncSpecificPlayer(p.id);
        GameUI.updateHUD();
    }

    static adminGiveGold() {
        const select = document.getElementById('admin-player-select') as HTMLSelectElement;
        const valInput = document.getElementById('admin-gold-val') as HTMLInputElement;
        if (!select || !valInput) return;
        const pIdx = parseInt(select.value, 10);
        const val = parseInt(valInput.value, 10);
        const p = GameState.players[pIdx];
        if (!p || isNaN(val)) return;

        p.gold = Math.max(0, p.gold + val);

        GameUI.sendGlobalLog(`🛠️ ADMIN HOST: Concedeu ${val} Moedas para ${p.name}!`);
        const NetworkObj = (window as any).Network;
        if (NetworkObj && NetworkObj.isOnline) NetworkObj.syncSpecificPlayer(p.id);
        GameUI.updateHUD();
    }

    static adminSetRound() {
        const valInput = document.getElementById('admin-round-val') as HTMLInputElement;
        if (!valInput) return;
        const val = parseInt(valInput.value, 10);
        if (isNaN(val) || val < 1) return;

        GameState.round = val;
        GameUI.sendGlobalLog(`🛠️ ADMIN HOST: A rodada principal foi alterada à força para a Rodada ${val}!`);

        const NetworkObj = (window as any).Network;
        if (NetworkObj && NetworkObj.isOnline) NetworkObj.syncTurn(GameState.turn, GameState.round);

        GameUI.updateHUD();
        this.checkTurnControl();
    }

    static adminSetTurn() {
        const select = document.getElementById('admin-turn-select') as HTMLSelectElement;
        if (!select) return;
        const tIdx = parseInt(select.value, 10);
        const p = GameState.players[tIdx];
        if (!p) return;

        GameState.turn = tIdx;
        GameState.hasRolled = false;

        GameUI.sendGlobalLog(`🛠️ ADMIN HOST: A vez do jogador foi forçada e passada para ${p.name}!`);

        const NetworkObj = (window as any).Network;
        if (NetworkObj && NetworkObj.isOnline) NetworkObj.syncTurn(GameState.turn, GameState.round);

        GameUI.updateHUD();
        this.checkTurnControl();
    }
}