import { Sfx } from '../audio/Sfx';
import { GameFeel } from '../ui/GameFeel';
import { GameState } from './GameState';
import { GameUI } from './GameUI';
import { Player } from '../../models/Player';
import { Pokemon } from '../../models/Pokemon';
import { MapSystem } from '../../systems/MapSystem';
import { Battle } from '../../systems/Battle';
import { Shop } from '../../systems/Shop';
import { Cards } from '../../systems/Cards';
import { Network } from '../../systems/Network';
import { TILE, NPC_DATA, SHOP_ITEMS } from '../../constants';
import { GLOBAL_EVENTS } from '../../constants/globalEvents';
import { MAPA_MEGAS } from '../../constants/mapaMegas';
import { GYM_DATA } from '../../constants/gyms';
import { GameSpawns } from './GameSpawns';
import { NotificationSystem } from './NotificationSystem';
import { CPUController } from './CPUController';
import { QuestManager } from '../quests/QuestManager';
import { readyQuests } from '../../constants/quests';
import type { ItemData } from '../../constants';
import { supabase, NetworkState } from '../network/SupabaseInit';
import { NetworkSync } from '../network/NetworkSync';
import { SupabaseDataStore } from '../network/SupabaseDataStore';
import { GameDialog } from '../ui/GameDialog';
import { ProfileTracker } from '../profile/ProfileTracker';

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

        const totalGyms = GameState.activeGyms && GameState.activeGyms.length > 0 ? GameState.activeGyms.length : 8;
        for (let i = 0; i < totalGyms; i++) {
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
        GameFeel.playMatchEnd(winnerId);
        ProfileTracker.matchEnd(winnerId);
        (window as any).Cinematics?.podium(winnerId);
        console.log("GAME OVER - VITORIA!");

        const NetworkObj = (window as any).Network || Network;
        if (NetworkObj && NetworkObj.isOnline && winnerId === NetworkObj.myPlayerId) {
            try {
                supabase.from('rooms').update({ status: 'finished' }).eq('id', NetworkObj.currentRoomId).then();
            } catch (e) {
                console.error("Erro ao salvar vitória:", e);
            }
        }
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

    // Texto da última derrota total resolvida (vai no PVP_SYNC_DAMAGE para os outros verem o mesmo desfecho)
    static lastDefeatMsg = '';

    // Derrota total: sempre custa uma vida (na última, ou sem vidas, volta para a cidade), mesmo com Revive na mochila
    static handleTotalDefeat(p: Player) {
        const maxLives = GameState.maxLives();
        ProfileTracker.add(p, 'total_defeats');
        if (maxLives > 0) ProfileTracker.add(p, 'lives_lost');

        const QuestManagerObj = (window as any).QuestManager || (window as any).Game?.QuestManager || window.QuestManager;
        if (QuestManagerObj) QuestManagerObj.resetProgress(p, 'WIN_STREAK');

        // Ainda tem vida: cura a equipe e continua na mesma casa, sem perder ouro nem turnos
        if (maxLives > 0 && p.lives > 1) {
            p.lives -= 1;
            Sfx.play('lifeLost');
            p.team.forEach(mon => { mon.currentHp = mon.maxHp; });
            const left = p.lives === 1 ? 'resta 1 vida' : `restam ${p.lives} vidas`;
            GameUI.sendGlobalLog(`💔 ${p.name} perdeu uma vida (${left}). Equipe curada, continua no mesmo lugar.`);
            this.lastDefeatMsg = `💔 ${p.name} sofreu uma derrota total e perdeu uma vida!\nA equipe foi curada e continua de onde estava (${left}).`;
            GameUI.showGlobalAlert(this.lastDefeatMsg, p.name, true, false);
            this.leaveGymFree(p);
            GameUI.moveVisuals();
            GameUI.updateHUD();
            this.persistDefeat(p);
            return;
        }

        Sfx.play('lifeLost');
        const msg = `🚑 ${p.name} sofreu uma derrota total!\n${maxLives > 0 ? 'Era a última vida: será' : 'Será'} levado ao último Centro Pokémon para recuperação emergencial.`;
        const city = this.getLastCityCoord(p);
        p.x = city.x;
        p.y = city.y;
        if (maxLives > 0) p.lives = maxLives;

        if (QuestManagerObj) QuestManagerObj.resetProgress(p, 'WALK_STEPS');

        if (p.effects && p.effects.tremembeUserTurns && p.effects.tremembeUserTurns > 0) {
            GameUI.sendGlobalLog(`⚖️ DECRETO DE TREMEMBÉ! ${p.name} está sob o privilégio do decreto e foi resgatado sem perder turnos!`);
        } else {
            p.skipTurns += 2;
            GameUI.sendGlobalLog(`🚑 ${p.name} foi resgatado! Equipe totalmente curada no Centro Pokémon, mas perderá 2 turnos.${maxLives > 0 ? ` Vidas restauradas (${maxLives}).` : ''}`);
        }

        p.team.forEach(mon => { mon.currentHp = mon.maxHp; });
        this.lastDefeatMsg = msg;
        GameUI.showGlobalAlert(msg, p.name, true, false);
        GameUI.moveVisuals();
        GameUI.updateHUD();
        this.persistDefeat(p);
    }

    // Continua em cima de um ginásio não vencido: no próximo turno sai andando (igual à Fumaça Ninja), sem ser puxado para a batalha de novo
    private static leaveGymFree(p: Player) {
        if (MapSystem.grid?.[p.y]?.[p.x] !== TILE.GYM) return;
        const gymId = MapSystem.gymLocations[`${p.x},${p.y}`];
        if (gymId && !p.badges[gymId - 1]) p.effects.escapedGym = true;
    }

    // Só o dono do turno persiste a derrota (salva o objeto recebido, não a cópia de Game.players)
    private static persistDefeat(p: Player) {
        const NetworkObj = (window as any).Network || Network;
        if (NetworkObj.isOnline && GameState.canAct()) {
            NetworkObj.syncPlayerObjects([p]);
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
                p.effects.escapedGym = false; // Garante que a fuga não o salve do vortex
                const QuestManagerObj = (window as any).QuestManager || (window as any).modules?.QuestManager;
                if (QuestManagerObj) QuestManagerObj.checkProgress(p, 'VORTEX_TELEPORT', 1);
                GameUI.moveVisuals();
                GameState.hasRolled = true;

                const msgLocal = `🌀 VÓRTICE DA RODADA ${GameState.round}!\n\nVocê foi sugado diretamente para as portas de um Ginásio invicto!`;
                GameState.pendingTileEvent = true;
                GameUI.showGlobalAlert(msgLocal, p.name, true, false);

                GameUI.logPrivate(msgLocal.replace(/\n\n/g, ' '), `🌀 VÓRTICE! ${p.name} foi sugado para um Ginásio na Rodada ${GameState.round}!`, p.id);
                if (NetworkObj.isOnline) NetworkObj.syncPlayerState();
                return;
            }
        }

        const CardsObj = (window as any).Cards || Cards;
        const c1 = CardsObj.draw(p, true);
        const c2 = CardsObj.draw(p, true);

        const msgLocal = `🎁 BÔNUS DA RODADA ${GameState.round}!\n\nVocê recebeu suporte aéreo e ganhou 2 cartas:\n- ${c1.name}\n- ${c2.name}`;
        GameUI.updateHUD();
        GameUI.showGlobalAlert(msgLocal, p.name, true, false);

        // Quais cartas vieram, só o dono vê
        GameUI.logPrivate(`🎁 Bônus da Rodada ${GameState.round}: você ganhou ${c1.icon} ${c1.name} e ${c2.icon} ${c2.name}.`, `🎁 ${p.name} recebeu 2 Cartas bônus da Rodada ${GameState.round}!`, p.id);
        if (NetworkObj.isOnline) NetworkObj.syncPlayerState();
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
        (window as any).PBBoard?.onLand?.(p.x, p.y, type, !!enemy);
        // Os outros jogadores também veem o efeito da casa (só a vez de quem anda roda esta lógica)
        if (NetworkObj.isOnline && (!GameState.canAct || GameState.canAct())) NetworkObj.sendAction('BOARD_FX', { kind: 'land', x: p.x, y: p.y, type, pvp: !!enemy });

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
            const npcImg = npc.img ? `/assets/img/NPCs/${npc.img}` : '/assets/img/Treinadores/Red.png';
            const npcLevel = GameState.getGlobalAverageLevel();
            const teamSize = GameState.getGlobalAverageTeamSize();
            const npcTeam = GameSpawns.generateNPCTeam(npc, npcLevel, teamSize);

            BattleObj.setup(p, npcTeam as any, false, npc.name, npc.gold, null, false, 0, npcImg, type);
            return;
        }

        if (type === TILE.CITY) {
            GameState.isCityEvent = true;
            const cityGold = document.getElementById('city-gold-display');
            if (cityGold) cityGold.innerText = `Saldo: ${p.gold}G`;
            // Tempestade EMP: a cidade só cura; botões de compra ficam desativados
            const empActive = GameState.currentGlobalEvent?.id === 'EMP';
            document.querySelectorAll<HTMLButtonElement>('#city-modal [onclick*="handleCityChoice"]').forEach(btn => {
                const isHeal = (btn.getAttribute('onclick') || '').includes("'heal'");
                btn.disabled = empActive && !isHeal;
                btn.title = btn.disabled ? 'Comércio fechado pela Tempestade EMP' : '';
            });
            document.getElementById('city-modal')!.style.display = 'flex';
            CPUController.handleCity(p);
        }
        else if (type === TILE.EVENT) {
            const QuestManagerObj = (window as any).QuestManager || (window as any).modules?.QuestManager;
            if (QuestManagerObj) QuestManagerObj.checkProgress(p, 'TILE_EVENT', 1);

            if (GameState.currentGlobalEvent?.id === 'LOTTERY_DAY') {
                p.gold += 500;
                const CardsObj = (window as any).Cards || Cards;
                CardsObj.draw(p, true);

                const normalItems = SHOP_ITEMS.filter(i => !['ultrafullrestore', 'ultramaxrevive', 'masterball'].includes(i.id));
                const randomItem = normalItems[Math.floor(Math.random() * normalItems.length)];
                this.addItem(p, randomItem.id, 1);

                const lotteryMsg = `🎰 DIA DE LOTERIA! Você visitou a casa de Evento e ganhou o prêmio acumulado de 500G, 1 Carta e 1 ${randomItem.name}!`;
                GameUI.logPrivate(lotteryMsg, `🎰 DIA DE LOTERIA! ${p.name} ganhou o prêmio acumulado de 500G, 1 Carta e 1 ${randomItem.name}!`, p.id);
                GameUI.showGlobalAlert(lotteryMsg, p.name, true);
                if (NetworkObj.isOnline) NetworkObj.syncPlayerState();
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

                GameUI.logPrivate(localMsg.replace(/\n\n/g, ' '), remoteMsg, p.id);
                GameState.pendingTileEvent = true;
                GameUI.showGlobalAlert(localMsg, p.name, true, false);

                if (NetworkObj.isOnline) {
                    NetworkObj.syncPlayerState();
                    NetworkObj.sendAction('SHOW_ALERT', { msg: remoteMsg, playerName: p.name, endsTurn: false });
                }
                return;
            }

            const questRoll = Math.random();
            if (questRoll < 0.20) {
                const QuestManagerObj = (window as any).QuestManager || (window as any).modules?.QuestManager;
                if (QuestManagerObj) {
                    QuestManagerObj.addQuest(p, undefined, true);
                } else {
                    this.nextTurn();
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

                const QuestManagerObj = (window as any).QuestManager || (window as any).modules?.QuestManager;
                if (QuestManagerObj) QuestManagerObj.checkProgress(p, 'GET_ITEM_MAP', 1);

                localMsg = `Você explorou o evento e encontrou um item:\n\n🎒 ${itemName}`;
                remoteMsg = `🌟 ${p.name} explorou o evento e encontrou: ${itemName}!`;
            }

            // A carta encontrada só aparece para quem achou (antes ia para o log de todos)
            GameUI.logPrivate(localMsg.replace(/<[^>]*>?/gm, '').replace(/\n\n/g, ' '), remoteMsg, p.id);
            GameUI.showGlobalAlert(localMsg, p.name, true);

            if (NetworkObj.isOnline) {
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
                GameUI.logPrivate("💨 Você usou Fumaça Ninja e o Líder ainda não te notou...", `💨 ${p.name} passou pelo Ginásio escondido com a Fumaça Ninja.`, p.id);
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

                    GameUI.logPrivate(msgLocal.replace(/\n\n/g, ' '), msgGlobal, p.id);
                    GameUI.showGlobalAlert(msgLocal, p.name, true);

                    if (NetworkObj.isOnline) {
                        NetworkObj.sendAction('SHOW_ALERT', { msg: msgGlobal, playerName: p.name });
                    }
                }
            }
        }
        else if ([TILE.GRASS, TILE.WATER, TILE.GROUND].includes(type)) {
            const QuestManagerObj = (window as any).QuestManager || (window as any).modules?.QuestManager;
            if (QuestManagerObj) QuestManagerObj.checkProgress(p, 'VISIT_BIOMES', 1, { tileType: type });

            if (Math.random() < 0.8) {

                const wildMon = GameSpawns.generateWildPokemon(type);

                if (wildMon.isLegendary) {
                    GameState.pendingLegendaryEncounter = { mon: wildMon, type: type };
                    const msgLocal = `⚠️ ALERTA LENDÁRIO!\n\nVocê encontrou um ${wildMon.name} selvagem!||LEGENDARY:${wildMon.name}||MY_ENCOUNTER`;
                    const msgGlobal = `⚠️ ALERTA LENDÁRIO! ${p.name} encontrou um ${wildMon.name} selvagem!||LEGENDARY:${wildMon.name}`;

                    GameUI.logPrivate(msgLocal.replace(/\n\n/g, ' ').split('||')[0], msgGlobal.split('||')[0], p.id);
                    GameUI.showGlobalAlert(msgLocal, p.name, true, false);

                    if (NetworkObj.isOnline) {
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

        // Tempestade EMP: sem comércio na cidade (loja, cartas e missões); a cura continua funcionando
        if (GameState.currentGlobalEvent?.id === 'EMP' && c !== 'heal') {
            if (!player.isCPU) GameDialog.toast("A Tempestade EMP fechou o comércio da cidade: aqui só dá para curar o time.", { tone: 'warning' });
            return;
        }

        if (c === 'heal') {
            player.team.forEach(p => { p.currentHp = p.maxHp; });
            Sfx.play('heal');
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

                // Qual carta saiu, só quem comprou vê (antes ia para o log de todos)
                GameUI.logPrivate(localMsg.replace(/\n\n/g, ' '), remoteMsg, player.id);
                GameUI.sendGlobalLog(`💰 [Extrato] ${player.name} gastou -500G (Compra de Carta).`);
                GameUI.sendGlobalLog(`💰 [Extrato] Novo Saldo: ${player.gold}G.`);
                GameUI.updateHUD();

                GameUI.showGlobalAlert(localMsg, player.name, true, true);

                if (NetworkObj.isOnline) {
                    NetworkObj.syncPlayerState();
                    NetworkObj.sendAction('SHOW_ALERT', { msg: remoteMsg, playerName: player.name });
                }
            } else {
                GameDialog.toast("Ouro insuficiente! Você precisa de 500G para comprar uma carta.", { tone: 'warning' });
            }
        }
        else if (c === 'quest') {
            if (player.boughtQuestThisTurn) {
                return GameDialog.toast("Você já comprou uma missão nesta visita à cidade!", { tone: 'warning' });
            }
            if (player.gold >= 300) {
                player.gold -= 300;
                player.boughtQuestThisTurn = true;

                const QuestManagerObj = (window as any).QuestManager || (window as any).modules?.QuestManager;
                if (QuestManagerObj) {
                    QuestManagerObj.addQuest(player);
                }

                GameUI.sendGlobalLog(`💰 [Extrato] ${player.name} gastou -300G (Compra de Missão).`);

                const goldDisplay = document.getElementById('city-gold-display');
                if (goldDisplay) goldDisplay.innerText = `Saldo: ${player.gold}G`;

                GameUI.updateHUD();

                if (NetworkObj.isOnline) {
                    NetworkObj.syncPlayerState();
                }
            } else {
                GameDialog.toast("Ouro insuficiente! Você precisa de 300G para comprar uma missão.", { tone: 'warning' });
            }
        }
        else if (c === 'shop') {
            document.getElementById('city-modal')!.style.display = 'none';
            Shop.open();
        }
    }

    static nextTurn() {
        GameState.saveGame();
        GameState.turnStarted = false; // Requer nova confirmação do próximo jogador
        const currentP = GameState.getCurrentPlayer();
        const NetworkObj = (window as any).Network || Network;
        currentP.resetTurnFlags();
        // Tênis de Corrida / Dado Mágico não usados (ex.: turno encerrado por Troca Rápida ou SAMU) não passam para o próximo jogador
        GameState.bonusMovement = 0;
        GameState.forcedDiceValue = 0;

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

            // Double XP / Exp Share são descontados a cada ganho de XP (Pokemon.gainXp), não por turno

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
            // Persiste o consumo do turno extra, senão um refresh traria extraTurn=true de volta
            if (NetworkObj && NetworkObj.isOnline) NetworkObj.syncPlayerObjects([currentP]);
            GameUI.sendGlobalLog(`⏳ ${currentP.name} joga novamente!`);
            GameUI.updateHUD();
            this.checkTurnControl();
            return;
        }

        GameUI.sendGlobalLog(`🛑 Fim do turno de ${currentP.name} 🛑`);

        const QuestManagerObj = (window as any).QuestManager || (window as any).modules?.QuestManager;
        if (QuestManagerObj) {
            if (currentP.gold >= 1500) {
                QuestManagerObj.checkProgress(currentP, 'END_TURN_GOLD_1500', 1);
            }
            if (currentP.gold >= 2500) {
                QuestManagerObj.checkProgress(currentP, 'TURN_GOLD_2500_STREAK', 1);
            } else {
                QuestManagerObj.resetProgress(currentP, 'TURN_GOLD_2500_STREAK');
            }
            if (currentP.gold >= 8000) {
                QuestManagerObj.checkProgress(currentP, 'GOLD_ACCUMULATED', 1);
            }
        }

        const nextTurnIdx = (GameState.turn + 1) % GameState.players.length;
        if (nextTurnIdx === 0) {
            GameState.round++;

            if (GameState.currentGlobalEvent && GameState.round >= GameState.eventEndRound) {
                GameState.currentGlobalEvent = null;
                GameState.eventEndRound = 0;
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

                const msgGlobal = `🌍 ALERTA GLOBAL! O evento ${ev.name} começou!||EVENT:${ev.id}`;

                if (ev.id === 'TAX_SEASON') {
                    GameState.players.forEach(p => {
                        const lostCards: string[] = [];
                        if (p.cards.length > 0) {
                            const legendaryCards = p.cards.filter(c => c.rarity === 'Lendária' || c.isProtected);
                            const nonLegendaryCards = p.cards.filter(c => c.rarity !== 'Lendária' && !c.isProtected);

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
                            actuallyLost.forEach(c => lostCards.push(`${c.icon} ${c.name}`));
                        }
                        for (const k in p.items) if (p.items[k] > 0) p.items[k] = Math.ceil(p.items[k] / 2);

                        // Quais cartas cada um perdeu revela a mão: só o dono vê os nomes
                        GameUI.sendGlobalLog(`🃏 [Extrato] ${p.name} pagou impostos (${lostCards.length} carta(s)). Cartas restantes: ${p.cards.length}`);
                        if (lostCards.length) GameUI.logPrivate(`🃏 Imposto de Renda levou suas cartas: ${lostCards.join(', ')}.`, null, p.id);
                    });
                    GameUI.sendGlobalLog("📜 IMPOSTO DE RENDA: Todos os jogadores perderam metade de suas cartas e itens!");
                    if (NetworkObj.isOnline) NetworkObj.syncPlayers(GameState.players.map(p => p.id));
                }

                GameUI.log(msgGlobal);
                if (NetworkObj.isOnline) NetworkObj.sendAction('LOG', { msg: msgGlobal });
            }
        }

        // Persiste o jogador que está encerrando o turno ANTES de passar a vez (depois disso a trava de turno bloqueia a gravação)
        if (NetworkObj.isOnline && NetworkSync) NetworkSync.syncPlayerStateAsync();

        GameState.turn = nextTurnIdx;
        GameState.hasRolled = false;

        if (NetworkObj.isOnline) {
            // A vez só é gravada depois que todas as gravações deste turno chegaram ao banco: o próximo jogador
            // relê o banco e começa sozinho, então não pode encontrar um estado pela metade (carta roubada, imposto...)
            NetworkState.lastTurnWriteAt = Date.now();
            const roomId = NetworkObj.currentRoomId;
            const turnRow = {
                current_turn: GameState.turn,
                current_round: GameState.round,
                current_event_id: GameState.currentGlobalEvent ? GameState.currentGlobalEvent.id : null,
                event_end_round: GameState.eventEndRound
            };
            NetworkState.turnWritePending = true;
            NetworkSync.flushSaves().then(done => {
                if (!done) console.warn('[nextTurn] Gravações ainda pendentes após 8s; passando a vez mesmo assim.');
                NetworkState.lastTurnWriteAt = Date.now();
                return supabase.from('rooms').update(turnRow).eq('id', roomId);
            }).catch(e => console.error('[nextTurn] Falha ao gravar a vez:', e))
              .finally(() => { NetworkState.turnWritePending = false; NetworkState.lastTurnWriteAt = Date.now(); });
            SupabaseDataStore.saveRoomConfig(NetworkObj.currentRoomId, GameState.settings, MapSystem.size).then();
        } else if (!NetworkObj.isOnline) {
            const nextP = GameState.players[GameState.turn];
            if (nextP.skipTurns > 0) {
                nextP.skipTurns = Math.max(0, nextP.skipTurns - 1);
                if (!nextP.stats) nextP.stats = { cardsUsed: 0, cardsSuffered: 0, effectsReceived: {}, cardsDefended: {}, turnsLost: 0 };
                nextP.stats.turnsLost++;
                GameUI.sendGlobalLog(`${nextP.name} perdeu a vez! (Restam: ${nextP.skipTurns})`);
                GameDialog.toast(`${nextP.name} perdeu a vez!`, { tone: 'info' });
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

        const rollBtn = document.getElementById('roll-btn') as HTMLButtonElement;
        const iniciarBtn = document.getElementById('iniciar-turno-btn') as HTMLButtonElement;
        const me = NetworkObj.myPlayerId;
        const ind = document.getElementById('online-indicator');

        if (NetworkObj.isOnline) {
            if (ind) ind.innerText = "FIREBASE";
        } else {
            if (ind) ind.innerText = "OFFLINE";
        }

        const isMyTurn = NetworkObj.isOnline ? (GameState.turn === me) : true;

        if (!isMyTurn) {
            rollBtn.disabled = true;
            rollBtn.style.display = '';
            rollBtn.innerText = `Vez de ${GameState.players[GameState.turn].name}`;
            if (iniciarBtn) iniciarBtn.style.display = 'none';
            GameState.turnStarted = false;
            return;
        }

        // É a vez deste jogador: o turno começa sozinho (CPU offline continua com o próprio controle)
        if (!GameState.turnStarted) {
            if (iniciarBtn) iniciarBtn.style.display = 'none';
            rollBtn.style.display = '';
            rollBtn.disabled = true;
            const hidden = NetworkObj.isOnline && document.visibilityState === 'hidden';
            rollBtn.innerText = hidden ? 'Sua vez! Volte para a partida' : 'Preparando seu turno…';
            // 🔔 Notifica o jogador se ele não estiver olhando para a aba
            if (NetworkObj.isOnline) {
                const currP = GameState.players[me];
                if (currP) NotificationSystem.notifyMyTurn(currP.name, GameState.round, GameState.turn);
            }
            if (!CPUController.handleTurn()) this.autoStartTurn();
            return;
        }

        // Turno já iniciado
        if (iniciarBtn) iniciarBtn.style.display = 'none';
        rollBtn.style.display = '';

        const currP = GameState.players[GameState.turn];
        const type = MapSystem.grid[currP.y][currP.x];

        if (type === TILE.GYM && !GameState.pendingTileEvent) {
            const gymId = MapSystem.gymLocations[`${currP.x},${currP.y}`];
            if (gymId && !currP.badges[gymId - 1]) {
                if (GameState.currentGlobalEvent?.id !== 'GYM_VACATION' && !currP.effects.escapedGym) {
                    rollBtn.disabled = true;
                    rollBtn.innerText = "Em batalha";
                    if (!BattleObj.active) this.handleTile(currP);
                    return;
                }
            }
        }

        rollBtn.disabled = false;
        rollBtn.innerText = "Rolar dado";
        
        CPUController.handleTurn();
    }

    // Início automático do turno (substitui o antigo botão "Iniciar turno").
    // Online, só começa com a aba visível e depois de reler todos os jogadores do banco, para nunca agir sobre um
    // estado velho: com a aba em segundo plano o navegador atrasa ou congela timers e o websocket, então o turno
    // espera a aba voltar (e o jogador recebe a notificação de que é a vez dele).
    private static autoStarting = false;
    private static autoStartRetry: number | null = null;
    private static visibleWaitInstalled = false;

    private static waitForVisibleTab() {
        if (this.visibleWaitInstalled) return;
        this.visibleWaitInstalled = true;
        const onVisible = () => {
            if (document.visibilityState !== 'visible') return;
            document.removeEventListener('visibilitychange', onVisible);
            this.visibleWaitInstalled = false;
            this.checkTurnControl();
        };
        document.addEventListener('visibilitychange', onVisible);
    }

    private static myTurnToStart(): boolean {
        const NetworkObj = (window as any).Network || Network;
        const BattleObj = (window as any).Battle || Battle;
        if (GameState.turnStarted || (BattleObj && BattleObj.active)) return false;
        if (NetworkObj.isOnline) return !NetworkObj.isSpectator && GameState.turn === NetworkObj.myPlayerId;
        return true;
    }

    static async autoStartTurn() {
        const NetworkObj = (window as any).Network || Network;
        if (this.autoStarting || !this.myTurnToStart()) return;
        if (this.autoStartRetry !== null) { window.clearTimeout(this.autoStartRetry); this.autoStartRetry = null; }

        if (!NetworkObj.isOnline) {
            // Offline: pausa curta para a troca de vez aparecer na tela
            this.autoStarting = true;
            await new Promise(r => window.setTimeout(r, 600));
            this.autoStarting = false;
            if (this.myTurnToStart()) this.iniciarTurno();
            return;
        }

        if (document.visibilityState === 'hidden') { this.waitForVisibleTab(); return; }

        this.autoStarting = true;
        let fresh = false;
        try {
            // Minhas próprias gravações pendentes (ex.: turno extra) primeiro; depois o estado de todos direto do banco
            await NetworkSync.flushSaves(5000);
            // Requisição pendurada (rede travada sem erro) não pode prender o início do turno: conta como falha e tenta de novo
            fresh = await Promise.race([
                NetworkObj.refreshPlayersNow() as Promise<boolean>,
                new Promise<boolean>(r => window.setTimeout(() => r(false), 10000))
            ]);
        } catch (e) {
            console.warn('[autoStartTurn] Falha ao reler os jogadores:', e);
        } finally {
            this.autoStarting = false;
        }

        if (!this.myTurnToStart()) return;
        if (document.hidden) { this.waitForVisibleTab(); this.checkTurnControl(); return; }
        if (!fresh) {
            // Sem conseguir ler o banco não começa (agiria sobre dados velhos): tenta de novo em instantes
            this.autoStartRetry = window.setTimeout(() => { this.autoStartRetry = null; this.checkTurnControl(); }, 2500);
            return;
        }
        this.iniciarTurno();
    }

    static iniciarTurno() {
        const NetworkObj = (window as any).Network || Network;
        const me = NetworkObj.myPlayerId;
        const isMyTurn = NetworkObj.isOnline ? (GameState.turn === me) : true;
        if (!isMyTurn || GameState.turnStarted) return;

        // Forçar atualização visual para evitar dessincronia
        GameUI.moveVisuals();
        GameUI.updateHUD();

        // Cancela notificação pendente — jogador já está aqui
        NotificationSystem.cancelPending();

        const iniciarBtn = document.getElementById('iniciar-turno-btn') as HTMLButtonElement | null;

        const currP = GameState.players[NetworkObj.isOnline ? me : GameState.turn];
        GameUI.sendGlobalLog(`▶️ ${currP.name} iniciou o turno.`);
        const ready = readyQuests(currP);
        if (ready.length) GameDialog.toast(`🎯 Você tem ${ready.length === 1 ? `a missão "${ready[0].name}" pronta` : `${ready.length} missões prontas`} para resgatar! Abra Missões no seu card.`, { tone: 'success', duration: 6000 });

        // Bônus de década
        if (GameState.round > 1 && GameState.round % 10 === 0) {
            if (currP.effects.lastBonusRound !== GameState.round) {
                currP.effects.lastBonusRound = GameState.round;
                if (currP.skipTurns === 0 && !currP.isProcessingSkip) {
                    this.triggerDecadeBonus(currP);
                } else {
                    GameUI.log(`❌ ${currP.name} está paralisado e perdeu o bônus da Rodada ${GameState.round}!`);
                    if (NetworkObj.isOnline) NetworkObj.syncSpecificPlayer(currP.id);
                }
            }
        }

        // Truco Seis
        if (currP.skipTurns === 0 && !currP.isProcessingSkip && GameState.currentGlobalEvent?.id === 'TRUCO_SEIS') {
            if (currP.cards.length > 6) {
                const legendaryCards = currP.cards.filter((c: any) => c.rarity === 'Lendária' || c.isProtected);
                const nonLegendaryCards = currP.cards.filter((c: any) => c.rarity !== 'Lendária' && !c.isProtected);
                const neededToLose = currP.cards.length - 6;
                const actuallyLost: any[] = [];
                if (neededToLose > 0 && nonLegendaryCards.length > 0) {
                    const amountToLose = Math.min(neededToLose, nonLegendaryCards.length);
                    for (let i = 0; i < amountToLose; i++) {
                        const randIdx = Math.floor(Math.random() * nonLegendaryCards.length);
                        actuallyLost.push(nonLegendaryCards.splice(randIdx, 1)[0]);
                    }
                }
                if (actuallyLost.length > 0) {
                    currP.cards = [...legendaryCards, ...nonLegendaryCards];
                    const lostNames = actuallyLost.map((c: any) => `${c.icon} ${c.name}`).join(', ');
                    GameUI.logPrivate(`🃏 TRUCO! Você tinha mais de 6 cartas e perdeu: ${lostNames}. (Total: ${currP.cards.length})`, `🃏 ${currP.name} excedeu o limite do TRUCO e perdeu ${actuallyLost.length} carta(s)! (Total: ${currP.cards.length})`, currP.id);
                    GameUI.showGlobalAlert(`🃏 GRITARAM TRUCO!\n\nVocê tinha mais de 6 cartas e precisou descartar ${actuallyLost.length} aleatoriamente.\n\nPerdidas: ${lostNames}`, currP.name, true, false);
                    GameUI.updateHUD();
                    if (NetworkObj.isOnline) NetworkObj.syncSpecificPlayer(currP.id);
                }
            }
        }

        // Suporte de emergência (pokebola/carta de cortesia)
        if (currP.skipTurns === 0 && !currP.isProcessingSkip && currP.effects.lastGiftRound !== GameState.round) {
            currP.effects.lastGiftRound = GameState.round;
            let logMsg = ""; let gainedAny = false;
            const balls = ['pokeball', 'greatball', 'ultraball', 'masterball'];
            if (!balls.some((b: string) => (currP.items[b] || 0) > 0)) {
                this.addItem(currP, 'pokeball', 1); logMsg += `🎒 Sem Pokébolas! Ganhou 1 Pokébola de cortesia. `; gainedAny = true;
            }
            if (currP.cards.length === 0) {
                const CardsObj = (window as any).Cards || Cards;
                if (CardsObj) CardsObj.draw(currP, true); logMsg += `🃏 Sem cartas! Ganhou 1 carta de cortesia.`; gainedAny = true;
            }
            if (gainedAny) {
                GameUI.sendGlobalLog(logMsg);
                GameUI.showGlobalAlert(`🎁 SUPORTE DE EMERGÊNCIA!\n\n${logMsg}`, currP.name, true, false);
                GameUI.updateHUD();
                if (NetworkObj.isOnline) NetworkObj.syncSpecificPlayer(currP.id);
            }
        }

        // Robin Hood
        // Marca com o eventEndRound da ocorrência: antes era um boolean nunca zerado, e quem recebeu a ajuda uma vez
        // ficava sem ela em todas as Ajudas Humanitárias seguintes da partida
        if (GameState.currentGlobalEvent?.id === 'ROBIN_HOOD' && currP.effects.robinHoodApplied !== GameState.eventEndRound && currP.skipTurns === 0 && !currP.isProcessingSkip) {
            if (currP.gold < 200 && currP.cards.length < 2) {
                currP.gold += 800;
                const CardsObj = (window as any).Cards || Cards;
                for (let i = 0; i < 5; i++) CardsObj.draw(currP, true);
                currP.effects.robinHoodApplied = GameState.eventEndRound;
                const robinMsg = `🎁 AJUDA HUMANITÁRIA! Robin Hood te deu 800G e 5 Cartas!`;
                GameUI.sendGlobalLog(robinMsg); GameUI.showGlobalAlert(robinMsg, currP.name, true, false);
                if (NetworkObj.isOnline) NetworkObj.syncPlayerState();
                GameUI.updateHUD();
            }
        }

        // Verificar Skip Turns — pular a vez automaticamente
        if (currP.skipTurns > 0 || currP.isProcessingSkip) {
            if (!currP.isProcessingSkip) {
                if (iniciarBtn) iniciarBtn.style.display = 'none';
                const rollBtn = document.getElementById('roll-btn') as HTMLButtonElement;
                rollBtn.style.display = ''; rollBtn.disabled = true;
                rollBtn.innerText = `Pulando vez... (${currP.skipTurns})`;
                currP.isProcessingSkip = true;
                currP.skipTurns = Math.max(0, currP.skipTurns - 1);
                if (!currP.stats) currP.stats = { cardsUsed: 0, cardsSuffered: 0, effectsReceived: {}, cardsDefended: {}, turnsLost: 0 };
                currP.stats.turnsLost = (currP.stats.turnsLost || 0) + 1;

                const QuestManagerObj = (window as any).QuestManager || (window as any).modules?.QuestManager;
                if (QuestManagerObj) QuestManagerObj.checkProgress(currP, 'LOSE_TURN', 1);

                GameUI.sendGlobalLog(`${currP.name} perdeu a vez! (Restam: ${currP.skipTurns})`);
                if (NetworkObj.isOnline) NetworkObj.syncPlayerState();
                setTimeout(() => {
                    currP.isProcessingSkip = false;
                    if (NetworkObj.isOnline ? (GameState.turn === me) : true) this.nextTurn();
                }, 2000);
            }
            return;
        }

        // Tudo certo, liberar o turno
        GameState.turnStarted = true;
        this.checkTurnControl();
    }


    static addItem(player: Player, itemId: string, amount: number = 1) {
        if (!player.items[itemId]) { player.items[itemId] = 0; }
        player.items[itemId] += amount;
        GameUI.updateHUD();
        const NetworkObj = (window as any).Network || Network;
        if (NetworkObj.isOnline) NetworkObj.syncPlayerState();
    }

    static giveRandomItem(player: Player, amount: number = 1) {
        // Sem filtro: Sorteia literalmente qualquer item do jogo (do mais fraco ao mais apelão)
        const pool = SHOP_ITEMS;

        for (let j = 0; j < amount; j++) {
            const randomItem = pool[Math.floor(Math.random() * pool.length)];
            this.addItem(player, randomItem.id, 1);
            GameUI.sendGlobalLog(`🎁 ${player.name} recebeu um item aleatório: ${randomItem.name}!`);
        }
    }

    static useItemBoard(key: string, pId: number) {
        const p = GameState.players[pId];
        const item = SHOP_ITEMS.find(i => i.id === key);
        if (!item || p.items[key] <= 0) return;
        // Bloquear uso de itens do tabuleiro se o turno ainda não foi iniciado
        const NetworkObj = (window as any).Network || Network;
        if (NetworkObj.isOnline && !GameState.turnStarted && GameState.turn === NetworkObj.myPlayerId) {
            GameDialog.toast('Seu turno ainda está começando. Tente de novo em instantes.', { tone: 'warning' });
            return;
        }
        if (item.type === 'heal' || item.type === 'revive' || item.type === 'boost' || item.type === 'mega' || item.type === 'hold') {
            if (item.id === 'ultrafullrestore' || item.id === 'ultramaxrevive') {
                this.applyBoardItemEffect(p, item, -1);
                return;
            }
            GameUI.openItemTargetSelector(pId, key);
        }
    }

    static async applyBoardItemEffect(p: Player, item: ItemData, targetIdx: number) {
        const Game = (window as any).Game;
        const alertCPU = (msg: string) => {
            if (p.isCPU) {
                if (Game && typeof Game.log === 'function') Game.log(`🤖 CPU: ${msg}`);
            } else {
                GameDialog.toast(msg, { tone: 'info' });
            }
        };

        let used = false;
        if (item.type === 'heal') {
            if (item.id === 'ultrafullrestore') {
                let count = 0; p.team.forEach(m => { if (!m.isFainted() && m.currentHp < m.maxHp) { m.heal(9999); count++; } });
                if (count > 0) { used = true; alertCPU(`${count} Pokémon curados!`); } else alertCPU("Ninguém precisa de cura!");
            } else {
                const target = p.team[targetIdx]; if (target.isFainted()) { alertCPU("Não funciona em Pokémon desmaiado!"); return; }
                if (target.currentHp >= target.maxHp) { alertCPU("HP já está cheio!"); return; }
                target.heal(item.val || 20);
                target.addHappiness(1);
                alertCPU(`Usou ${item.name} em ${target.name}.`); used = true;
            }
        } else if (item.type === 'revive') {
            if (item.id === 'ultramaxrevive') {
                let count = 0; p.team.forEach(m => { if (m.isFainted()) { m.revive(100); count++; } });
                if (count > 0) { used = true; alertCPU(`${count} Pokémon revividos!`); } else alertCPU("Ninguém está desmaiado!");
            } else {
                const target = p.team[targetIdx]; if (!target.isFainted()) { alertCPU("Este Pokémon não está desmaiado!"); return; }
                target.revive(item.val || 50); alertCPU(`Usou ${item.name} em ${target.name}.`); used = true;
            }
            if (used) ProfileTracker.add(p, 'revives_used');
        } else if (item.type === 'boost') {
            const target = p.team[targetIdx];
            if (target) {
                target.bonusStats.hp += 1;
                target.bonusStats.atk += 1;
                target.bonusStats.def += 1;
                target.bonusStats.spd += 1;
                target.recalculateStats(false);
                alertCPU(`✨ SUPLEMENTAÇÃO! O ${target.name} tomou as vitaminas e todos os seus status subiram +1!`);
                used = true;
            }
        } else if (item.type === 'mega') {
            const targetMon = p.team[targetIdx];
            if (targetMon) {
                // MAPA_MEGAS is imported statically
                if (!MAPA_MEGAS[targetMon.id]) {
                    alertCPU(`O Pokémon ${targetMon.name} não reage a esta Mega Pedra!`);
                    return;
                }
                if (targetMon.megaStone || targetMon.heldItem) {
                    alertCPU(`${targetMon.name} já está segurando um item! Remova-o antes de equipar outro.`);
                    return;
                }
                targetMon.megaStone = true;
                alertCPU(`💎 A Mega Pedra foi vinculada a ${targetMon.name}! Ele agora pode Mega Evoluir em batalha.`);
                used = true;
            }
        } else if (item.type === 'hold') {
            const targetMon = p.team[targetIdx];
            if (targetMon) {
                if (targetMon.megaStone || targetMon.heldItem) {
                    alertCPU(`${targetMon.name} já está segurando um item! Remova-o antes de equipar outro.`);
                    return;
                }
                targetMon.heldItem = item.id;
                targetMon.addHappiness(5);
                alertCPU(`📦 ${targetMon.name} agora está segurando: ${item.name}!`);
                used = true;
            }
        }

        if (used) {
            p.items[item.id]--;
            GameUI.updateHUD();
            (window as any).UseFx?.itemUsed?.(p, item, targetIdx);
            if (!p.isCPU) {
                GameUI.openInventoryModal(p.id);
            }
            GameState.saveGame();
            const NetworkObj = (window as any).Network || Network;
            if (NetworkObj.isOnline) {
                // Os outros jogadores veem no log o item usado (o sendAction LOG não chega a ninguém desde os logs no banco)
                GameUI.log(`🎒 ${p.name} usou ${item.name}.||OTHERS:${p.id}`);
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
            if (p.isCPU) {
                // Time cheio: encontra o pior Pokémon e substitui
                const getStats = (m: any) => m.maxHp + m.atk + m.def + m.speed;
                let worstIdx = 0;
                let worstStats = getStats(p.team[0]);
                for (let i = 1; i < p.team.length; i++) {
                    const st = getStats(p.team[i]);
                    if (st < worstStats) {
                        worstStats = st;
                        worstIdx = i;
                    }
                }
                const discarded = p.team[worstIdx];
                p.team[worstIdx] = mon;
                discarded.currentHp = discarded.maxHp;
                GameState.lixeira.push(discarded);

                GameUI.sendGlobalLog(`💚 ${p.name} resgatou ${mon.name} da lixeira e libertou ${discarded.name}!`);
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
            mon.removeHappiness(5);
            // Held items são perdidos ao serem removidos (não voltam para a bolsa)

            GameUI.sendGlobalLog(`📦 ${p.name} removeu o item ${itemData?.name || itemKey} de ${mon.name}. O item foi perdido.`);
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
            if (NetworkObj && NetworkObj.isOnline) NetworkObj.syncSpecificPlayer(p.id, true);
            GameUI.updateHUD();
        }
    }

    static adminGiveSpecificCard() {
        const pSelect = document.getElementById('admin-player-select') as HTMLSelectElement;
        const cSelect = document.getElementById('admin-specific-card-select') as HTMLSelectElement;
        if (!pSelect || !cSelect) return;

        const pIdx = parseInt(pSelect.value, 10);
        const cardId = cSelect.value;
        const p = GameState.players[pIdx];
        if (!p) return;

        const CardsObj = (window as any).Cards;
        if (CardsObj) {
            CardsObj.drawSpecificCard(p, cardId);
            GameUI.sendGlobalLog(`🛠️ ADMIN HOST: Concedeu uma Carta Específica para ${p.name}!`);
            const NetworkObj = (window as any).Network;
            if (NetworkObj && NetworkObj.isOnline) NetworkObj.syncSpecificPlayer(p.id, true);
            GameUI.updateHUD();
        }
    }

    static adminGivePokemon() {
        const pSelect = document.getElementById('admin-player-select') as HTMLSelectElement;
        const pkmnSelect = document.getElementById('admin-pokemon-select') as HTMLSelectElement;
        const lvlInput = document.getElementById('admin-pokemon-level') as HTMLInputElement;
        if (!pSelect || !pkmnSelect) return;

        const pIdx = parseInt(pSelect.value, 10);
        const p = GameState.players[pIdx];
        if (!p) return;

        if (p.team.length >= 6) {
            GameDialog.toast(`${p.name} já possui 6 Pokémon no time!`, { tone: 'warning' });
            return;
        }

        const templateId = parseInt(pkmnSelect.value, 10);
        const level = parseInt(lvlInput?.value || "20", 10);
        const PokemonClass = (window as any).Pokemon || p.team[0]?.constructor;
        const newMon = new PokemonClass(templateId, level);

        p.team.push(newMon);
        GameUI.sendGlobalLog(`🛠️ ADMIN HOST: Adicionou [${newMon.name} Lv.${newMon.level}] ao time de ${p.name}!`);
        const NetworkObj = (window as any).Network;
        if (NetworkObj && NetworkObj.isOnline) NetworkObj.syncSpecificPlayer(p.id, true);
        GameUI.updateHUD();
        GameDialog.toast(`${newMon.name} Lv.${level} adicionado ao time de ${p.name}!`, { tone: 'success' });
    }

    static adminSetLegendaryUsage(blocked: boolean) {
        const pSelect = document.getElementById('admin-player-select') as HTMLSelectElement;
        if (!pSelect) return;
        const pIdx = parseInt(pSelect.value, 10);
        const p = GameState.players[pIdx];
        if (!p) return;

        if (!p.effects) p.effects = {};
        p.effects.playedLegendary = blocked;

        if (!blocked) {
            delete p.effects.ashGoodbyeRemaining;
            delete (p as any)._ashGoodbyeContinued;
        }

        const actionText = blocked ? 'BLOQUEADO' : 'LIBERADO';
        const tone: 'warning' | 'success' = blocked ? 'warning' : 'success';
        GameUI.sendGlobalLog(`🛠️ ADMIN HOST: Uso de Carta Lendária ${actionText} para ${p.name}!`);
        GameDialog.toast(`Uso de Carta Lendária ${blocked ? 'bloqueado' : 'liberado'} para ${p.name}!`, { tone });

        const NetworkObj = (window as any).Network;
        if (NetworkObj && NetworkObj.isOnline) NetworkObj.syncSpecificPlayer(p.id, true);
        GameUI.updateHUD();
        GameUI.updateAdminPlayerInfo();
    }

    static adminGiveQuest() {
        const pSelect = document.getElementById('admin-player-select') as HTMLSelectElement;
        const qSelect = document.getElementById('admin-quest-select') as HTMLSelectElement;
        if (!pSelect || !qSelect) return;

        const pIdx = parseInt(pSelect.value, 10);
        const qId = parseInt(qSelect.value, 10);

        const p = GameState.players[pIdx];
        if (!p) return;

        QuestManager.addQuest(p, qId, false);
        GameUI.sendGlobalLog(`🛠️ ADMIN HOST: Concedeu uma Missão específica para ${p.name}!`);
        const NetworkObj = (window as any).Network;
        if (NetworkObj && NetworkObj.isOnline) NetworkObj.syncSpecificPlayer(p.id, true);
        GameUI.updateHUD();
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
        if (NetworkObj && NetworkObj.isOnline) NetworkObj.syncSpecificPlayer(p.id, true);
        GameUI.updateHUD();
        GameUI.updateAdminPlayerInfo();
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
        if (NetworkObj && NetworkObj.isOnline) NetworkObj.syncSpecificPlayer(p.id, true);
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
        if (NetworkObj && NetworkObj.isOnline) NetworkObj.syncSpecificPlayer(p.id, true);
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

    static adminSetGlobalEvent() {
        const select = document.getElementById('admin-event-select') as HTMLSelectElement;
        if (!select) return;
        const val = select.value;
        
        if (val === "none") {
            GameState.currentGlobalEvent = null;
            GameState.eventEndRound = 0;
            GameUI.sendGlobalLog(`🛠️ ADMIN HOST: O Clima Global foi limpo à força!`);
        } else {
            const ev = GLOBAL_EVENTS.find(e => e.id === val);
            if (ev) {
                GameState.currentGlobalEvent = ev;
                GameState.eventEndRound = GameState.round + 5; // 5 rodadas
                GameUI.sendGlobalLog(`🛠️ ADMIN HOST: O Clima Global foi alterado à força para ${ev.name}! (5 rodadas)`);
            }
        }

        const NetworkObj = (window as any).Network;
        if (NetworkObj && NetworkObj.isOnline) {
            SupabaseDataStore.setGlobalEvent(NetworkObj.currentRoomId, GameState.currentGlobalEvent ? GameState.currentGlobalEvent.id : null, GameState.eventEndRound);
        }

        GameUI.updateHUD();
    }
}
