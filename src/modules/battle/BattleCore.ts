import { BattleUI } from './BattleUI';
import { BattleCalc } from './BattleCalc';
import { Player } from '../../models/Player';
import { Pokemon } from '../../models/Pokemon';
import { Network, db } from '../../systems/Network';
import { Cards } from '../../systems/Cards';
import { MapSystem } from '../../systems/MapSystem';
import { POKEDEX } from '../../constants/pokedex';
import { GYM_DATA } from '../../constants/gyms';
import { MAPA_MEGAS } from '../../constants/mapaMegas';
import { GameState } from '../game/GameState';
import { CPUController } from '../game/CPUController';
import { SHOP_ITEMS } from '../../constants';
import type { ItemData } from '../../constants';

export class BattleCore {
    static active: boolean = false;
    static player: Player | null = null;
    static activeMon: Pokemon | null = null;
    static opponent: Pokemon | null = null;
    static enemyPlayer: Player | null = null;
    static isPvP: boolean = false;
    static isNPC: boolean = false;
    static isGym: boolean = false;
    static gymId: number = 0;
    static reward: number = 0;
    static battleTitle: string = "Batalha!";
    static plyTeamList: Pokemon[] = [];
    static oppTeamList: Pokemon[] = [];
    static pendingCapture: Pokemon | null = null;
    static isPlayerTurn: boolean = false;
    static processingAction: boolean = false;
    static activeEffects: any = {};
    static itemsUsedThisBattle: number = 0;
    static cardsUsedThisBattle: number = 0;
    static pokeballsThrownThisBattle: number = 0;
    static currentTerrain: number = 0;
    static isAutoPvE: boolean = false;
    static isChampion: boolean = false;
    static playerTookDamageThisBattle: boolean = false;

    static setup(player: Player, enemyMon: any, isPvP: boolean = false, _label: string = "", reward: number = 0, enemyPlayer: Player | null = null, isGym: boolean = false, gymId: number = 0, npcImage: string = "", terrainTile: number = 1) {
        const Game = (window as any).Game;
        const pendingSteal = this.activeEffects.stealBadgeFrom;

        this.player = player; this.isPvP = isPvP; this.isNPC = (reward > 0 && !isPvP); this.isGym = isGym; this.gymId = gymId; this.reward = reward; this.enemyPlayer = enemyPlayer; this.processingAction = false;

        this.activeEffects = {};
        this.itemsUsedThisBattle = 0;
        this.cardsUsedThisBattle = 0;
        this.pokeballsThrownThisBattle = 0;
        this.playerTookDamageThisBattle = false;
        (this as any).finalPlayerLevelForQuests = null;
        (this as any).pokemonFaintedThisBattle = false;

        if (pendingSteal !== undefined && pendingSteal !== null) {
            this.activeEffects.stealBadgeFrom = pendingSteal;
        }

        this.battleTitle = `[R: ${GameState.round}] ` + (isPvP ? "Batalha PvP!" : `Batalha contra ${_label}!`);
        this.isAutoPvE = false;
        this.currentTerrain = terrainTile;

        if (isPvP && enemyPlayer) {
            if (this.activeEffects.stealBadgeFrom !== undefined && this.activeEffects.stealBadgeFrom !== null) {
                const myRandomTeam = [...player.team].sort(() => Math.random() - 0.5).slice(0, 3);
                const oppRandomTeam = [...enemyPlayer.team].sort(() => Math.random() - 0.5).slice(0, 3);

                myRandomTeam.forEach(p => p.currentHp = p.maxHp);
                oppRandomTeam.forEach(p => p.currentHp = p.maxHp);

                this.plyTeamList = myRandomTeam;
                this.oppTeamList = oppRandomTeam;

                BattleUI.logBattle(`⚔️ DUELO DE LIDERANÇA! 3 Pokémon foram sorteados e totalmente curados para o combate!`, true);

                const NetworkObj = (window as any).Network || Network;
                if (NetworkObj.isOnline) {
                    NetworkObj.syncPlayers([player.id, enemyPlayer.id]);
                }
            } else {
                const pkmnCount = 1 + Math.floor((Game.round || 1) / 20);
                let myAlive = player.team.filter(p => !p.isFainted());
                let oppAlive = enemyPlayer.team.filter(p => !p.isFainted());

                myAlive = myAlive.sort(() => Math.random() - 0.5).slice(0, pkmnCount);
                oppAlive = oppAlive.sort(() => Math.random() - 0.5).slice(0, pkmnCount);

                this.plyTeamList = myAlive;
                this.oppTeamList = oppAlive;
            }
            this.opponent = this.oppTeamList[0];
            if (enemyPlayer.effects.curse) { BattleUI.logBattle(`☠️ ${enemyPlayer.name} está amaldiçoado! (Dano reduzido)`); }
        }
        else if (isGym) {
            if (Game.currentGlobalEvent?.id === 'GYM_RUSH') {
                player.team.forEach(mon => { mon.currentHp = mon.maxHp; });
                Game.sendGlobalLog(`🏛️ O Desafio dos Líderes curou o time de ${player.name} totalmente antes da batalha!`);
            }

            const actualGymId = Game.activeGyms ? Game.activeGyms[gymId - 1] : gymId;
            const gymData = GYM_DATA.find((g: any) => g.id === actualGymId);

            const globalAvg = Game.getGlobalAverageLevel();
            const gymLevel = globalAvg + 1;
            const teamSize = Math.min(6, Math.max(2, Game.getGlobalAverageTeamSize() + 1));
            const dynamicTeams = Game.gymTeams || {};

            let rosterIds = dynamicTeams[actualGymId] || (gymData ? gymData.teamIds : [130]);
            rosterIds = [...rosterIds].sort(() => Math.random() - 0.5);

            const battleIds = rosterIds.slice(0, teamSize);

            const holdItems = ['leftovers', 'quick_claw', 'sitrus_berry', 'scope_lens', 'choice_band', 'choice_scarf', 'rocky_helmet'];

            this.oppTeamList = battleIds.map((id: number) => {
                const mon = new Pokemon(id, gymLevel, false, true);
                const canMega = GameState.settings && GameState.settings.megas !== false;

                // Se o Pokémon pode mega evoluir E a regra de megas está ativa, ele recebe a pedra.
                // Caso contrário, ele recebe um item de segurar.
                if (canMega && MAPA_MEGAS[mon.id]) {
                    mon.megaStone = true;
                    mon.heldItem = null;
                } else {
                    mon.megaStone = false;
                    const randomHoldItem = holdItems[Math.floor(Math.random() * holdItems.length)];
                    mon.heldItem = randomHoldItem;
                }
                return mon;
            });
            this.opponent = this.oppTeamList[0];

            this.plyTeamList = player.team.filter(p => !p.isFainted());
            if (this.plyTeamList.length === 0) {
                this.plyTeamList = player.team.filter(p => !p.isFainted());
            }
        } else {
            this.oppTeamList = Array.isArray(enemyMon) ? enemyMon : [enemyMon];
            this.opponent = this.oppTeamList[0];
            this.plyTeamList = player.team.filter(p => !p.isFainted());
        }

        if (this.isNPC) {
            this.oppTeamList.forEach(mon => {
                if (MAPA_MEGAS[mon.id] && Math.random() < 0.33) {
                    mon.megaStone = true;
                }
            });
        }

        this.plyTeamList.forEach(mon => {
            this.applyResonanceBonus(player, mon);
        });

        if (isPvP && enemyPlayer) {
            this.oppTeamList.forEach(mon => {
                this.applyResonanceBonus(enemyPlayer, mon);
            });
        }

        const activeResonance = (this.plyTeamList[0] as any).resonantBonus;
        if (activeResonance) {
            setTimeout(() => BattleUI.logBattle(`🧬 Ressonância Genética: ${this.plyTeamList[0].name} está ${activeResonance}% mais forte!`, true), 800);
        }

        if (this.plyTeamList.length === 0) {
            Game.handleTotalDefeat(player);
            Game.nextTurn();
            return;
        }

        if (this.isNPC && npcImage) { (this.opponent as any)._npcImage = npcImage; (this.opponent as any)._npcName = _label; }

        if (this.isGym && this.player.effects.curse) {
            BattleUI.logBattle("😈 CUIDADO! Você entrou no Ginásio Amaldiçoado! Dano reduzido e Itens bloqueados!", true);
        }

        if (Game.currentGlobalEvent?.id === 'SANDSTORM') {
            const hurtSand = (mon: Pokemon) => {
                if (!['Pedra', 'Terra', 'Aço'].includes(mon.type) && (!mon.secondType || !['Pedra', 'Terra', 'Aço'].includes(mon.secondType))) {
                    mon.currentHp = Math.max(1, Math.floor(mon.currentHp * 0.9));
                }
            };
            this.plyTeamList.forEach(hurtSand);
            this.oppTeamList.forEach(hurtSand);
            setTimeout(() => BattleUI.logBattle("🌪️ A Tempestade de Areia corta os Pokémons em campo!", true), 1000);
        }

        if (this.isPvP) {
            this.startRound(this.plyTeamList[0]);
        } else {
            let terrainName = "Terreno Selvagem";
            if (this.currentTerrain === 1) terrainName = "Mato Alto 🌿";
            else if (this.currentTerrain === 2) terrainName = "Águas Profundas 🌊";
            else if (this.currentTerrain === 3) terrainName = "Caverna/Deserto 🪨";

            let contextTitle = "";
            if (this.isGym) {
                const actualGymId = Game.activeGyms ? Game.activeGyms[this.gymId - 1] : this.gymId;
                const gymData = GYM_DATA.find((g: any) => g.id === actualGymId);

                let gymDesc = `Ginásio de ${_label}`;
                if (gymData) {
                    const typesStr = gymData.type.join(" e ");
                    gymDesc = `Ginásio do ${gymData.leaderName} de ${typesStr}`;
                }
                contextTitle = `🏛️ <b>${gymDesc}</b><br><small style="color:#bdc3c7; font-size:0.9rem;">Escolha seu Pokémon para a batalha!</small>`;
            } else if (this.isNPC) {
                contextTitle = `👤 <b>O Treinador ${_label} te desafiou!</b><br><small style="color:#bdc3c7; font-size:0.9rem;">Escolha seu Pokémon para começar.</small>`;
            } else {
                contextTitle = `🐾 <b>Um Pokémon selvagem apareceu!</b><br><small style="color:#f1c40f; font-size:0.9rem;">Local: ${terrainName}</small>`;
            }
            BattleUI.openSelectionModal(contextTitle);
            CPUController.handleBattleSelect(this);
        }
        
        // Iniciar o log de batalha isolado
        let summary = `⚔️ ${player.name} iniciou combate com `;
        if (this.isPvP && enemyPlayer) summary += `o jogador ${enemyPlayer.name}!`;
        else if (this.isGym) summary += `um Líder de Ginásio!`;
        else if (this.isNPC) summary += `o Treinador ${_label}!`;
        else summary += `um Pokémon Selvagem!`;
        
        BattleUI.startBattleLog(summary);
        
        this.isAutoPvE = false;
    }

    static startChampionBattle(player: Player, championData: any) {
        this.active = true;
        this.isPvP = false;
        this.isNPC = true;
        this.isGym = false;
        this.isChampion = true;

        this.player = player;

        this.plyTeamList = player.team.filter(p => !p.isFainted());

        const PokemonClass = (window as any).Pokemon || player.team[0].constructor;
        this.oppTeamList = championData.team.map((td: any) => {
            const po = new PokemonClass(td.id, td.level, td.isShiny);
            Object.assign(po, td);
            po.currentHp = po.maxHp;
            return po;
        });

        this.oppTeamList.sort(() => Math.random() - 0.5);
        this.opponent = this.oppTeamList[0];

        this.battleTitle = `[R: ${GameState.round}] 🏆 CAMPEÃO ATUAL: ${championData.name.toUpperCase()} 🏆`;

        const contextTitle = `🏆 <b>DESAFIO AO CAMPEÃO ${championData.name.toUpperCase()}!</b><br><small style="color:#f1c40f; font-size:0.9rem;">Escolha seu Pokémon para a Batalha Final!</small>`;
        BattleUI.openSelectionModal(contextTitle);

        // Iniciar o log de batalha isolado
        BattleUI.startBattleLog(`🏆 ${player.name} desafiou o Campeão ${championData.name.toUpperCase()} para o combate final!`);

        const Game = (window as any).Game;
        Game.sendGlobalLog(`⚔️ O DESAFIO FINAL! ${player.name} está enfrentando o Campeão ${championData.name}!`);
        BattleUI.logBattle(`🏆 DESAFIO AO CAMPEÃO 🏆\nSem Itens. Sem Cartas. Apenas força bruta!`);
    }

    static startRound(selectedMon: Pokemon) {
        const NetworkObj = (window as any).Network || Network;
        document.getElementById('pkmn-select-modal')!.style.display = 'none';
        this.active = true;
        this.activeMon = selectedMon;

        this.tryTriggerMegaEvolution("ressoou no início da batalha");
        this.tryOpponentMegaEvolution("ressoou no início da batalha");

        BattleUI.renderBattleScreen();

        if (this.activeMon && this.activeMon.happiness === 100) {
            BattleUI.logBattle(`<span style="color:#ff9ff3; font-weight:bold;">💖 [Vínculo Afetivo]</span> ${this.activeMon.name} está com Felicidade máxima e recebeu +5% de status nesta batalha!`, true);
        }
        if (this.opponent && this.opponent.happiness === 100) {
            BattleUI.logBattle(`<span style="color:#ff9ff3; font-weight:bold;">💖 [Vínculo Afetivo]</span> O oponente ${this.opponent.name} está com Felicidade máxima e recebeu +5% de status nesta batalha!`, true);
        }

        this.isPlayerTurn = true;
        this.processingAction = false;
        BattleUI.updateButtons();

        if (this.isPvP) {
            BattleUI.logBattle(`Atenção: Combate Automático Sorteado!`, true);
        } else {
            BattleUI.logBattle(`O que ${this.activeMon.name} fará?`, true);
        }

        const enemyId = this.enemyPlayer ? this.enemyPlayer.id : -1;

        if (NetworkObj.isOnline && this.player!.id === NetworkObj.myPlayerId) {
            const npcImg = (this.opponent as any)._npcImage || "";
            const npcName = (this.opponent as any)._npcName || "";
            const startingId = this.player!.id;

            let targetIdx = 0;
            if (this.opponent && this.oppTeamList.length > 0) {
                targetIdx = this.oppTeamList.indexOf(this.opponent);

                if (targetIdx === -1) {
                    targetIdx = this.oppTeamList.findIndex(p => p.id === this.opponent!.id && !p.isFainted());
                }

                if (targetIdx === -1) targetIdx = 0;
            }

            NetworkObj.sendAction('BATTLE_START', {
                pId: this.player!.id,
                monIdx: this.player!.team.indexOf(this.activeMon),
                oppTeam: NetworkObj.getSanitizedTeam(this.oppTeamList),
                plyTeam: NetworkObj.getSanitizedTeam(this.plyTeamList),
                oppIdx: targetIdx,
                isPvP: this.isPvP,
                reward: this.reward,
                enemyId,
                isGym: this.isGym,
                gymId: this.gymId,
                npcImage: npcImg,
                npcName: npcName,
                battleTitle: this.battleTitle,
                startingTurnId: startingId,
                currentTerrain: this.currentTerrain
            });
        }
        
        CPUController.handleBattleStart(this);
    }

    static attack(_skill?: any) {
        const NetworkObj = (window as any).Network || Network;
        if (NetworkObj.isOnline && this.player && this.player.id !== NetworkObj.myPlayerId) return;

        if (!this.active || !this.activeMon || !this.opponent) return;

        // -- NOVO CPU BATTLE LOGIC --
        if (this.isAutoPvE && this.player && this.player.isCPU) {
            // Verifica CPU captura
            if (!this.isPvP && !this.isGym && !this.isNPC) {
                const oppHpPct = this.opponent.currentHp / this.opponent.maxHp;
                if (oppHpPct <= 0.3) {
                    let shouldCatch = true;
                    if (this.player.team.length >= 6) {
                        const getStats = (m: any) => m.maxHp + m.atk + m.def + m.speed;
                        const oppStats = getStats(this.opponent);
                        const weakestStats = Math.min(...this.player.team.map(getStats));
                        if (oppStats <= weakestStats) shouldCatch = false;
                    }

                    if (shouldCatch) {
                        const balls = ['masterball', 'ultraball', 'greatball', 'pokeball'];
                        for (const b of balls) {
                            if ((this.player.items[b] || 0) > 0) {
                                const ItemObj = SHOP_ITEMS.find((i: any) => i.id === b);
                                if (ItemObj) {
                                    this.player.items[b]--;
                                    this.attemptCapture(ItemObj);
                                    return;
                                }
                            }
                        }
                    }
                }
            }

            // Verifica Poção
            const myHpPct = this.activeMon.currentHp / this.activeMon.maxHp;
            if (myHpPct <= 0.3) {
                const potions = ['hyperpotion', 'superpotion', 'potion'];
                for (const p of potions) {
                    if ((this.player.items[p] || 0) > 0) {
                        const ItemObj = SHOP_ITEMS.find((i: any) => i.id === p);
                        if (ItemObj && ItemObj.val) {
                            this.player.items[p]--;
                            this.activeMon.heal(ItemObj.val);
                            BattleUI.logBattle(`💊 CPU usou ${ItemObj.name}!`, true);
                            BattleUI.updateUI();
                            
                            // Depois da cura, leva o ataque inimigo
                            this.processingAction = true;
                            setTimeout(() => {
                                this.performEnemyAttack(() => {
                                    this.processingAction = false;
                                    BattleUI.updateButtons();
                                    if (this.isAutoPvE && this.activeMon!.currentHp > 0 && this.opponent!.currentHp > 0) {
                                        setTimeout(() => this.attack(), 1500);
                                    } else if (this.activeMon!.currentHp <= 0) {
                                        this.handleFaint();
                                    }
                                });
                            }, 1500);
                            return;
                        }
                    }
                }
            }

            // Verifica Destiny Card (Destino Selado)
            if (this.opponent && this.activeMon && this.player.cards) {
                let willKill = false;
                try {
                    const calc = BattleCalc.calculateDamage(this.activeMon, this.opponent, true);
                    if (calc.damage >= this.opponent.currentHp) willKill = true;
                } catch (e) {
                    // Ignora caso erro no cálculo
                }
                
                if (willKill && !this.activeEffects.destiny) {
                    const destinyIdx = this.player.cards.findIndex((c: any) => (typeof c === 'string' ? c : c.id) === 'destiny' && !c.isProtected);
                    if (destinyIdx !== -1) {
                        const CardsObj = (window as any).Cards;
                        if (CardsObj) {
                            // Marca como jogado para não sobrepor outras lógicas depois
                            this.player.effects.playedCardThisTurn = true; 
                            CardsObj.activate('destiny', this.player.id);
                        }
                    }
                }
            }
        }
        // -- FIM NOVO CPU BATTLE LOGIC --

        this.processingAction = true;
        BattleUI.updateButtons();

        // choice_scarf: +20% de velocidade efetiva para determinar quem vai primeiro
        const scarfBonus = (this.activeMon as any).heldItem === 'choice_scarf' ? 1.20 : 1.0;
        const enemyScarfBonus = (this.opponent as any).heldItem === 'choice_scarf' ? 1.20 : 1.0;
        const playerSpeed = Math.floor(this.activeMon.speed * scarfBonus);
        const enemySpeed = Math.floor(this.opponent.speed * enemyScarfBonus);
        let playerGoesFirst = true;

        // quick_claw: 100% de chance de ir primeiro quando o ativo carrega o item
        const hasQuickClaw = (this.activeMon as any).heldItem === 'quick_claw';
        const enemyHasQuickClaw = (this.opponent as any).heldItem === 'quick_claw';

        if (hasQuickClaw && !enemyHasQuickClaw) {
            playerGoesFirst = true;
            BattleUI.logBattle(`⚡ Garra Rápida! ${this.activeMon.name} age primeiro!`, true);
        } else if (enemyHasQuickClaw && !hasQuickClaw) {
            playerGoesFirst = false;
            BattleUI.logBattle(`⚡ Garra Rápida! ${this.opponent.name} age primeiro!`, true);
        } else if (playerSpeed > enemySpeed) playerGoesFirst = true;
        else if (enemySpeed > playerSpeed) playerGoesFirst = false;
        else playerGoesFirst = Math.random() > 0.5;

        if (!hasQuickClaw && !enemyHasQuickClaw) BattleUI.logBattle(`Velocidade: ${this.activeMon.name}(${playerSpeed}) vs ${this.opponent.name}(${enemySpeed})`, true);

        const finishTurnSequence = () => {
            const Game = (window as any).Game;
            const ev = Game.currentGlobalEvent?.id;

            if (ev === 'TOXIC_SMOG') {
                const toxicHurt = (mon: Pokemon) => {
                    if (mon.currentHp > 0 && !['Venenoso', 'Aço'].includes(mon.type) && (!mon.secondType || !['Venenoso', 'Aço'].includes(mon.secondType))) {
                        const dmg = Math.ceil(mon.maxHp * 0.1);
                        mon.currentHp = Math.max(1, mon.currentHp - dmg);
                        return dmg;
                    }
                    return 0;
                };
                const d1 = toxicHurt(this.activeMon!);
                const d2 = toxicHurt(this.opponent!);
                if (d1 > 0 || d2 > 0) {
                    BattleUI.logBattle("🤢 O Nevoeiro Tóxico sufoca os Pokémons em campo!", true);
                    BattleUI.updateUI();
                }
            }

            // leftovers: restaura 10 HP no final de cada turno
            if (this.activeMon && this.activeMon.currentHp > 0 && (this.activeMon as any).heldItem === 'leftovers') {
                const heal = 10;
                this.activeMon.currentHp = Math.min(this.activeMon.maxHp, this.activeMon.currentHp + heal);
                BattleUI.logBattle(`🌿 Restos restauraram ${heal} HP de ${this.activeMon.name}!`);
                BattleUI.updateUI();
            }
            if (this.opponent && this.opponent.currentHp > 0 && (this.opponent as any).heldItem === 'leftovers') {
                const heal = 10;
                this.opponent.currentHp = Math.min(this.opponent.maxHp, this.opponent.currentHp + heal);
                BattleUI.logBattle(`🌿 Restos restauraram ${heal} HP de ${this.opponent.name}!`);
                BattleUI.updateUI();
            }

            this.processingAction = false;
            BattleUI.updateButtons();

            if (this.isPvP && NetworkObj.isOnline) {
                NetworkObj.syncPlayerState();
                if (this.enemyPlayer) NetworkObj.syncSpecificPlayer(this.enemyPlayer.id);
            }

            if (this.isPvP) {
                setTimeout(() => this.autoAttackNext(), 1500);
            }
            else if (this.isAutoPvE) {
                if (this.activeMon!.currentHp > 0 && this.opponent!.currentHp > 0) {
                    setTimeout(() => this.attack(), 1500);
                } else {
                    this.isAutoPvE = false;
                    const btn = document.getElementById('btn-auto-pve');
                    if (btn) {
                        btn.innerText = "⚡ Auto Atacar";
                        btn.classList.remove('active-auto');
                    }
                }
            }
        };

        if (playerGoesFirst) {
            BattleUI.logBattle(`💨 ${this.activeMon.name} é mais rápido!`, true);
            this.performPlayerAttack(() => {
                if (this.opponent && this.opponent.currentHp > 0) {
                    setTimeout(() => {
                        this.performEnemyAttack(() => {
                            finishTurnSequence();
                        });
                    }, 1000);
                } else {
                    finishTurnSequence();
                }
            });
        } else {
            BattleUI.logBattle(`💨 ${this.opponent.name} é mais rápido!`, true);
            this.performEnemyAttack(() => {
                if (this.activeMon && this.activeMon.currentHp > 0) {
                    setTimeout(() => {
                        this.performPlayerAttack(() => {
                            finishTurnSequence();
                        });
                    }, 1000);
                } else {
                    finishTurnSequence();
                }
            });
        }
    }

    static performPlayerAttack(callback?: () => void) {
        const Game = (window as any).Game;
        const NetworkObj = (window as any).Network || Network;
        if (!this.activeMon || !this.opponent) return;

        if (Game.currentGlobalEvent?.id === 'WINTER_STORM') {
            if (!this.activeMon.type.includes('Gelo') && (!this.activeMon.secondType || !this.activeMon.secondType.includes('Gelo'))) {
                if (Math.random() < 0.15) {
                    BattleUI.logBattle(`❄️ ${this.activeMon.name} congelou na nevasca e não conseguiu atacar!`, true);
                    if (callback) callback();
                    return;
                }
            }
        }

        let calc1 = BattleCalc.calculateDamage(this.activeMon!, this.opponent!, true);
        let totalDmg = calc1.damage;
        let totalReflected = calc1.reflected || 0;
        let logMsg = `${this.activeMon!.name} atacou! `;

        if (calc1.avoided) {
            logMsg += `${calc1.msg}`;
        } else {
            logMsg += `💥${calc1.damage} ${calc1.msg}`;
            if (calc1.reflected > 0) logMsg += " [🔄Refletido!]";
        }

        if (!calc1.avoided && this.activeMon!.speed >= (this.opponent!.speed * 1.5)) {
            if (Math.random() * 100 <= 20) {
                let calc2 = BattleCalc.calculateDamage(this.activeMon!, this.opponent!, true);

                if (!calc2.avoided) {
                    totalDmg += calc2.damage;
                    totalReflected += (calc2.reflected || 0);
                    logMsg += ` + ⚔️DUPLO! 💥${calc2.damage}`;
                    if (calc2.reflected > 0) logMsg += " [🔄Refletido!]";
                } else {
                    logMsg += ` + ⚔️DUPLO! (Errou)`;
                }
            }
        }

        this.opponent.currentHp = Math.max(0, this.opponent.currentHp - totalDmg);

        if (totalReflected > 0) {
            this.activeMon.currentHp = Math.max(0, this.activeMon.currentHp - totalReflected);
            this.playerTookDamageThisBattle = true;
            logMsg += ` (Sofreu ${totalReflected} de volta!)`;
        }

        logMsg += ` HP final ${this.opponent.currentHp}/${this.opponent.maxHp}.`;
        BattleUI.logBattle(logMsg);
        BattleUI.updateUI();

        // Check Sitrus Berry for both
        this.checkSitrusBerry(this.activeMon);
        this.checkSitrusBerry(this.opponent);

        if (NetworkObj.isOnline) {
            NetworkObj.sendAction('BATTLE_UPDATE', { 
                plyHp: this.activeMon!.currentHp, 
                oppHp: this.opponent!.currentHp, 
                plyItem: this.activeMon!.heldItem,
                oppItem: this.opponent!.heldItem,
                msg: logMsg 
            });
            if (this.isPvP && this.enemyPlayer) {
                NetworkObj.sendAction('PVP_SYNC_DAMAGE', { targetId: this.enemyPlayer.id, team: this.enemyPlayer.team, gold: this.enemyPlayer.gold });
                NetworkObj.syncSpecificPlayer(this.enemyPlayer.id);
            }
        }

        if (this.opponent.currentHp <= 0) {
            (this as any).finalPlayerLevelForQuests = this.activeMon.level;
            const oppStats = this.opponent.maxHp + this.opponent.atk + this.opponent.def + this.opponent.speed;
            const xpGain = Math.max(1, Math.floor(oppStats / 9));
            this.activeMon.gainXp(xpGain, this.player!);
            this.activeMon.addHappiness(3);

            // amulet_coin: +100G ao derrotar um pokémon
            if ((this.activeMon as any).heldItem === 'amulet_coin' && this.player) {
                this.player.gold += 100;
                BattleUI.logBattle(`💰 Moeda de Amuleto! +100G (Total: ${this.player.gold}G)`);
            }

            BattleUI.updateUI();
            if (NetworkObj.isOnline) NetworkObj.syncPlayerState();
            setTimeout(() => { this.checkWinCondition(); }, 1000);
        }
        else if (this.activeMon.currentHp <= 0) {
            BattleUI.updateUI();
            if (NetworkObj.isOnline) NetworkObj.syncPlayerState();
            setTimeout(() => { this.handleFaint(); }, 1000);
        }
        else {
            if (callback) callback();
        }
    }

    static performEnemyAttack(callback?: () => void) {
        const Game = (window as any).Game;
        const NetworkObj = (window as any).Network || Network;
        if (!this.activeMon || !this.opponent) return;

        if (this.activeEffects.stunOpponent && this.activeEffects.stunOpponent > 0) {
            this.activeEffects.stunOpponent--;
            const turnsLeft = this.activeEffects.stunOpponent;
            const msg = `⚡ ${this.opponent.name} está atordoado e não consegue atacar!${turnsLeft > 0 ? ` (Restam ${turnsLeft} turnos)` : ""}`;
            BattleUI.logBattle(msg, true);
            if (callback) callback();
            return;
        }

        if (Game.currentGlobalEvent?.id === 'WINTER_STORM') {
            if (!this.opponent.type.includes('Gelo') && (!this.opponent.secondType || !this.opponent.secondType.includes('Gelo'))) {
                if (Math.random() < 0.15) {
                    BattleUI.logBattle(`❄️ ${this.opponent.name} (Inimigo) congelou na nevasca!`, true);
                    if (callback) callback();
                    return;
                }
            }
        }

        let calc1 = BattleCalc.calculateDamage(this.opponent!, this.activeMon!, false);
        let totalDmg = calc1.damage;
        let totalReflected = calc1.reflected || 0;
        let logMsg = `${this.opponent!.name} atacou! `;

        if (calc1.avoided) {
            logMsg += `${calc1.msg}`;
        } else {
            logMsg += `💥${calc1.damage} ${calc1.msg}`;
            if (calc1.reflected > 0) logMsg += " [🔄Refletido!]";
        }

        if (!calc1.avoided && this.opponent!.speed >= (this.activeMon!.speed * 1.5)) {
            if (Math.random() * 100 <= 20) {
                let calc2 = BattleCalc.calculateDamage(this.opponent!, this.activeMon!, false);
                if (!calc2.avoided) {
                    totalDmg += calc2.damage;
                    totalReflected += (calc2.reflected || 0);
                    logMsg += ` + ⚔️DUPLO! 💥${calc2.damage}`;
                    if (calc2.reflected > 0) logMsg += " [🔄Refletido!]";
                } else {
                    logMsg += ` + ⚔️DUPLO! (Errou)`;
                }
            }
        }

        this.activeMon.currentHp = Math.max(0, this.activeMon.currentHp - totalDmg);
        if (totalDmg > 0) {
            this.playerTookDamageThisBattle = true;
        }

        if (totalReflected > 0) {
            this.opponent.currentHp = Math.max(0, this.opponent.currentHp - totalReflected);
            logMsg += ` (Sofreu ${totalReflected} de volta!)`;
        }

        logMsg += ` HP final ${this.activeMon.currentHp}/${this.activeMon.maxHp}.`;
        BattleUI.logBattle(logMsg);
        BattleUI.updateUI();

        // Check Sitrus Berry for both
        this.checkSitrusBerry(this.activeMon);
        this.checkSitrusBerry(this.opponent);

        // sitrus berry também para o inimigo, pois ele tomou dano no final de performPlayerAttack também
        // (Isso é feito logo após calcular o ataque do inimigo, mas poderia checar antes. Como não sabemos quem atacou por último, checamos de ambos.)

        if (this.activeEffects.counter && this.activeEffects.counter > 0) {
            const reflect = Math.floor(totalDmg * 1.0);
            if (reflect > 0) {
                this.opponent.currentHp = Math.max(0, this.opponent.currentHp - reflect);
                BattleUI.logBattle(`🔁 Contra-ataque! Inimigo sofreu ${reflect} de dano.`);
                this.activeEffects.counter--;
                BattleUI.updateUI();
                if (this.isPvP && this.enemyPlayer && NetworkObj.isOnline) {
                    NetworkObj.syncSpecificPlayer(this.enemyPlayer.id);
                }
            }
        }

        if (NetworkObj.isOnline) {
            NetworkObj.sendAction('BATTLE_UPDATE', { 
                plyHp: this.activeMon.currentHp, 
                oppHp: this.opponent.currentHp, 
                plyItem: this.activeMon.heldItem,
                oppItem: this.opponent.heldItem,
                msg: logMsg 
            });
            NetworkObj.syncPlayerState();
        }

        if (this.activeMon.currentHp <= 0) {
            if (this.isPvP && this.enemyPlayer) {
                const plyStats = this.activeMon.maxHp + this.activeMon.atk + this.activeMon.def + this.activeMon.speed;
                const oppXpGain = Math.max(1, Math.floor(plyStats / 9));
                this.opponent.gainXp(oppXpGain, this.enemyPlayer);

                // amulet_coin: +100G ao derrotar um pokémon (para o inimigo)
                if ((this.opponent as any).heldItem === 'amulet_coin') {
                    this.enemyPlayer.gold += 100;
                    BattleUI.logBattle(`💰 Moeda de Amuleto! +100G para ${this.enemyPlayer.name} (Total: ${this.enemyPlayer.gold}G)`);
                }

                if (NetworkObj.isOnline) NetworkObj.syncSpecificPlayer(this.enemyPlayer.id);
            }
            BattleUI.updateUI();
            if (NetworkObj.isOnline) NetworkObj.syncPlayerState();
            setTimeout(() => { this.handleFaint(); }, 1000);
        }
        else if (this.opponent.currentHp <= 0) {
            (this as any).finalPlayerLevelForQuests = this.activeMon.level;
            const oppStats = this.opponent.maxHp + this.opponent.atk + this.opponent.def + this.opponent.speed;
            const xpGain = Math.max(1, Math.floor(oppStats / 9));
            this.activeMon.gainXp(xpGain, this.player!);
            this.activeMon.addHappiness(3);
            BattleUI.updateUI();
            if (NetworkObj.isOnline) NetworkObj.syncPlayerState();
            setTimeout(() => { this.checkWinCondition(); }, 1000);
        }
        else {
            this.tryTriggerMegaEvolution("reagiu após o ataque");
            this.tryOpponentMegaEvolution("reagiu após o ataque");
            if (callback) callback();
        }
    }

    static checkSitrusBerry(mon: Pokemon | null) {
        if (!mon || mon.currentHp <= 0) return;
        if ((mon as any).heldItem !== 'sitrus_berry') return;

        const hpPercent = mon.currentHp / mon.maxHp;
        if (hpPercent <= 0.50) {
            const heal = Math.floor(mon.maxHp * 0.5);
            mon.currentHp = Math.min(mon.maxHp, mon.currentHp + heal);
            (mon as any).heldItem = null; // consumido
            BattleUI.logBattle(`🍒 Sitrus Berry! ${mon.name} recuperou ${heal} HP e consumiu a berry!`, true);
            BattleUI.updateUI();

            const NetworkObj = (window as any).Network || Network;
            if (NetworkObj.isOnline) {
                NetworkObj.syncPlayerState();
                if (this.isPvP && this.enemyPlayer) {
                    NetworkObj.syncSpecificPlayer(this.enemyPlayer.id);
                }
            }
        }
    }

    static checkWinCondition() {
        this.isAutoPvE = false;
        const btn = document.getElementById('btn-auto-pve');
        if (btn) {
            btn.innerText = "⚡ Auto Atacar";
            btn.classList.remove('active-auto');
        }

        if (this.opponent && ((this.opponent as any).isTemp || (this.opponent as any).isMegaEvolution)) {
            const isOppMega = (this.opponent as any).isMegaEvolution;
            this.revertOpponentMew();

            if (this.opponent.currentHp > 0) {
                if (isOppMega) {
                    BattleUI.logBattle("🧬 A Mega Evolução inimiga foi derrotada, mas o Pokémon original retornou e continua a lutar!");
                } else {
                    BattleUI.logBattle("🧬 O Mew inimigo foi derrotado, mas o Pokémon original retornou e continua a lutar!");
                }
                BattleUI.updateUI();
                this.processingAction = false;
                BattleUI.updateButtons();
                const NetworkObj = (window as any).Network || Network;
                if (NetworkObj.isOnline && this.isPvP && this.enemyPlayer) {
                    NetworkObj.syncSpecificPlayer(this.enemyPlayer.id);
                }

                if (this.activeEffects.stunOpponent) this.activeEffects.stunOpponent = 0;

                if (this.isPvP) {
                    setTimeout(() => this.autoAttackNext(), 1500);
                }
                return;
            } else {
                BattleUI.logBattle("🧬 A transformação inimiga desfez após a derrota!");
            }
        }

        let nextOpp = this.oppTeamList.find(p => !p.isFainted() && p !== this.opponent);

        if (this.isGym || this.isChampion) {
            const availableOpp = this.oppTeamList.filter(p => !p.isFainted() && p !== this.opponent);
            if (availableOpp.length > 0) {
                nextOpp = availableOpp[Math.floor(Math.random() * availableOpp.length)];
            }
        }

        if (nextOpp) {
            const oldImg = (this.opponent as any)._npcImage;
            const oldName = (this.opponent as any)._npcName;

            this.opponent = nextOpp;

            if (oldImg) (this.opponent as any)._npcImage = oldImg;
            if (oldName) (this.opponent as any)._npcName = oldName;

            if (this.activeEffects.stunOpponent) this.activeEffects.stunOpponent = 0;

            BattleUI.logBattle(`Rival enviou ${nextOpp.name}!`, true);
            if (nextOpp.happiness === 100) {
                BattleUI.logBattle(`<span style="color:#ff9ff3; font-weight:bold;">💖 [Vínculo Afetivo]</span> O oponente ${nextOpp.name} está com Felicidade máxima e recebeu +5% de status nesta batalha!`, true);
            }
            BattleUI.updateUI();
            this.processingAction = false;
            BattleUI.updateButtons();

            const NetworkObj = (window as any).Network || Network;
            if (NetworkObj.isOnline && this.player && this.player.id === NetworkObj.myPlayerId) {
                const sanitizedNextOpp = NetworkObj.getSanitizedTeam([nextOpp])[0];
                NetworkObj.sendAction('BATTLE_OPP_SWITCH', { nextOpp: sanitizedNextOpp });
            }

            if (this.isPvP) setTimeout(() => this.autoAttackNext(), 2000);
        } else {
            this.win();
        }
    }

    static handleFaint() {
        this.isAutoPvE = false;
        const btn = document.getElementById('btn-auto-pve');
        if (btn) {
            btn.innerText = "⚡ Auto Atacar";
            btn.classList.remove('active-auto');
        }

        if (this.activeMon && ((this.activeMon as any).isTemp || (this.activeMon as any).isMegaEvolution)) {
            const isMega = (this.activeMon as any).isMegaEvolution;

            if (isMega) BattleUI.logBattle("🧬 A Mega Evolução não resistiu e o Pokémon original retornou à batalha!");
            else BattleUI.logBattle("🧬 O Mew aliado foi derrotado e o Pokémon original retornou à batalha!");

            this.revertMew();
            BattleUI.updateUI();
            if (this.activeMon.currentHp <= 0) { }
            else {
                this.processingAction = false;
                BattleUI.updateButtons();
                const NetworkObj = (window as any).Network || Network;
                if (NetworkObj.isOnline) NetworkObj.syncPlayerState();
                if (this.isPvP) setTimeout(() => this.autoAttackNext(), 1500);
                return;
            }
        }
        (this as any).pokemonFaintedThisBattle = true;
        const nextPly = this.plyTeamList.find(p => !p.isFainted());
        if (nextPly) {
            this.activeMon!.removeHappiness(10);
            BattleUI.logBattle(`${this.activeMon!.name} desmaiou!`, true);

            if (this.isPvP) {
                this.activeMon = nextPly;
                BattleUI.logBattle(`Você enviou ${nextPly.name}!`, true);
                if (nextPly.happiness === 100) {
                    BattleUI.logBattle(`<span style="color:#ff9ff3; font-weight:bold;">💖 [Vínculo Afetivo]</span> ${nextPly.name} está com Felicidade máxima e recebeu +5% de status nesta batalha!`, true);
                }
                BattleUI.updateUI();

                const NetworkObj = (window as any).Network || Network;
                if (NetworkObj.isOnline && this.player && this.player.id === NetworkObj.myPlayerId) {
                    const sanitizedNextPly = NetworkObj.getSanitizedTeam([nextPly])[0];
                    NetworkObj.sendAction('BATTLE_PLY_SWITCH', { nextPly: sanitizedNextPly });
                }
                setTimeout(() => this.autoAttackNext(), 2000);
            } else {
                document.getElementById('battle-modal')!.style.display = 'none';
                BattleUI.openSelectionModal("Escolha o próximo!");
                CPUController.handleBattleSelect(this);
            }
        }
        else { 
            this.activeMon!.removeHappiness(10);
            this.lose(); 
        }
    }

    static win() {
        const Game = (window as any).Game;
        const NetworkObj = (window as any).Network || Network;
        const CardsObj = (window as any).Cards || Cards;

        if (this.isChampion) {
            Game.sendGlobalLog(`🎉 INACREDITÁVEL! ${this.player!.name} DERROTOU O CAMPEÃO E VENCEU O JOGO! 🎉`);
            if (NetworkObj && NetworkObj.isOnline) {
                NetworkObj.saveGlobalChampion(this.player!);
                NetworkObj.sendAction('GAME_WIN', { winnerId: this.player!.id });
            }
            this.end(false);
            Game.triggerVictory(this.player!.id);
            return;
        }

        if (NetworkObj.isOnline && this.isPvP && NetworkObj.myPlayerId === this.enemyPlayer?.id) return;

        if (this.isGym || this.isChampion) this.player!.effects.curse = false;
        this.revertMew();
        
        const QuestManagerObj = (window as any).QuestManager || (window as any).modules?.QuestManager;
        if (QuestManagerObj && this.player) {
            QuestManagerObj.checkProgress(this.player, 'WIN_STREAK', 1);
            if (!this.playerTookDamageThisBattle) {
                QuestManagerObj.checkProgress(this.player, 'WIN_NO_DAMAGE', 1);
            }
            if (!this.isPvP && !this.isGym && !this.isNPC) QuestManagerObj.checkProgress(this.player, 'DEFEAT_WILD', 1);
            
            if (this.opponent && this.activeMon) {
                const pLevel = (this as any).finalPlayerLevelForQuests || this.activeMon.level;
                QuestManagerObj.checkProgress(this.player, 'WIN_UNDERLEVELED', 1, { 
                    playerLevel: pLevel, 
                    enemyLevel: this.opponent.level 
                });
            }
            if (this.isPvP) {
                QuestManagerObj.checkProgress(this.player, 'WIN_PVP', 1);
                QuestManagerObj.checkProgress(this.player, 'WIN_PVP_STREAK', 1);
            } else {
                QuestManagerObj.resetProgress(this.player, 'WIN_PVP_STREAK');
            }
            if (this.isGym) {
                QuestManagerObj.checkProgress(this.player, 'WIN_GYM_STREAK', 1);
            } else {
                QuestManagerObj.resetProgress(this.player, 'WIN_GYM_STREAK');
            }
            
            if (this.isNPC) {
                // Checa se nenhum Pokémon desmaiou NESTA BATALHA especificamente
                if (!(this as any).pokemonFaintedThisBattle) {
                    QuestManagerObj.checkProgress(this.player, 'WIN_NPC_NO_FAINT', 1);
                }
                // TILE.ROCKET é 7 de acordo com as constantes
                if (this.currentTerrain === 7) {
                    QuestManagerObj.checkProgress(this.player, 'DEFEAT_ROCKET', 1);
                }
            }
        }

        let gain = 0; let msg = "VITÓRIA! ";

        const stealTargetId = (this.activeEffects.stealBadgeFrom !== undefined && this.activeEffects.stealBadgeFrom !== null) ? Number(this.activeEffects.stealBadgeFrom) : -1;
        const enemyId = this.enemyPlayer ? Number(this.enemyPlayer.id) : -2;

        if (this.isPvP && this.enemyPlayer && stealTargetId === enemyId) {
            const realWinner = Game.players.find((p: any) => p.id === this.player!.id);
            const realLoser = Game.players.find((p: any) => p.id === this.enemyPlayer!.id);

            if (realWinner && realLoser) {
                const validBadges: number[] = [];
                const totalGyms = MapSystem.size === 7 ? 4 : 8;
                for (let i = 0; i < totalGyms; i++) {
                    if (realLoser.badges[i] === true && realWinner.badges[i] === false) validBadges.push(i);
                }

                if (validBadges.length > 0) {
                    const stolenBadgeIdx = validBadges[Math.floor(Math.random() * validBadges.length)];
                    realWinner.badges[stolenBadgeIdx] = true;
                    realLoser.badges[stolenBadgeIdx] = false;

                    if (this.player) this.player.badges[stolenBadgeIdx] = true;
                    if (this.enemyPlayer) this.enemyPlayer.badges[stolenBadgeIdx] = false;

                    msg += ` Roubou a Insígnia ${stolenBadgeIdx + 1}!`;

                    if (NetworkObj.isOnline) {
                        NetworkObj.syncPlayers([realWinner.id, realLoser.id]);
                    }
                } else {
                    msg += ` (Inimigo não tinha insígnias novas)`;
                }
            }
        }

        if (this.activeEffects.destiny) {
            this.player!.gold += 500;
            if (CardsObj) { CardsObj.draw(this.player!); CardsObj.draw(this.player!); }
            msg += " (+500G +2 Cartas)";
            Game.sendGlobalLog(`💰 [Extrato] ${this.player!.name} recebeu +500G (Carta Destiny).`);
            Game.sendGlobalLog(`💰 [Extrato] Novo Saldo: ${this.player!.gold}G.`);
        }

        if (this.isPvP && this.enemyPlayer) {
            if (this.enemyPlayer.gold > 0) {
                let pct = 0.3;
                if (Game.currentGlobalEvent?.id === 'BLOOD_MOON') pct = 0.6;
                gain = Math.floor(this.enemyPlayer.gold * pct);
                this.enemyPlayer.gold -= gain;
                msg += `Roubou ${gain}G!`;
                Game.sendGlobalLog(`💰 [Extrato] Transferência de ${gain}G de ${this.enemyPlayer.name} para ${this.player!.name} (Luta PvP).`);
                Game.sendGlobalLog(`💰 [Extrato] Novo Saldo de ${this.enemyPlayer.name}: ${this.enemyPlayer.gold}G.`);
            } else {
                gain = 300;
                msg += `Inimigo falido!`;
                Game.sendGlobalLog(`💰 [Extrato] ${this.player!.name} recebeu +${gain}G (Luta PvP - Sistema).`);
            }
            Game.sendGlobalLog(`[PvP] ${this.enemyPlayer.name} foi derrotado por ${this.player?.name}!`);
        } else if (this.isGym) {
            gain = (Game.currentGlobalEvent?.id === 'GOLD_RUSH') ? 2000 : 1000;
            Game.sendGlobalLog(`💰 [Extrato] ${this.player!.name} recebeu +${gain}G (Líder de Ginásio).`);
            if (!this.player!.badges[this.gymId - 1]) { this.player!.badges[this.gymId - 1] = true; msg += ` Insígnia ${this.gymId}!`; }
            if (Game.currentGlobalEvent?.id === 'GYM_RUSH' && CardsObj) { CardsObj.draw(this.player!); msg += ` e ganhou 1 Carta do Desafio!`; }

            if (MapSystem.size === 7) {
                const badgesCount = this.player!.badges.filter((b: boolean) => b).length;
                if (badgesCount === 4) {
                    Game.sendGlobalLog(`🎉 PARABÉNS! ${this.player!.name} CONQUISTOU AS 4 INSÍGNIAS E VENCEU O JOGO! 🎉`);
                    if (NetworkObj && NetworkObj.isOnline) {
                        NetworkObj.sendAction('GAME_WIN', { winnerId: this.player!.id });
                    }
                    this.end(false);
                    Game.triggerVictory(this.player!.id);
                    return;
                }
            }
        } else if (this.isNPC) {
            gain = (Game.currentGlobalEvent?.id === 'GOLD_RUSH') ? this.reward * 2 : this.reward;
            Game.sendGlobalLog(`💰 [Extrato] ${this.player!.name} recebeu +${gain}G (Treinador NPC).`);
            const drawCount = (Game.currentGlobalEvent?.id === 'CARD_FESTIVAL') ? 2 : 1;
            if (CardsObj) { for (let i = 0; i < drawCount; i++) CardsObj.draw(this.player!); }
            msg += ` e ganhou ${drawCount > 1 ? 'Cartas' : 'uma Carta'}!`;
        }
        else {
            gain = (Game.currentGlobalEvent?.id === 'GOLD_RUSH') ? 300 : 150;
            Game.sendGlobalLog(`💰 [Extrato] ${this.player!.name} recebeu +${gain}G (Pokémon Selvagem).`);

            const cardChance = (Game.currentGlobalEvent?.id === 'CARD_FESTIVAL') ? 0.50 : 0.25;
            if (Math.random() <= cardChance) {
                const drawCount = (Game.currentGlobalEvent?.id === 'CARD_FESTIVAL') ? 2 : 1;
                if (CardsObj) { for (let i = 0; i < drawCount; i++) CardsObj.draw(this.player!); }
                msg += ` e achou ${drawCount > 1 ? 'Cartas' : 'uma Carta'}!`;
            }

            if (this.opponent) {
                if (this.opponent.isLegendary || this.opponent.isShiny) {
                    Game.lixeira.push(this.opponent);
                    if (NetworkObj.isOnline) NetworkObj.syncLixeira();
                }

                const oppId = this.opponent.id;
                if (!this.player!.pokedexData) this.player!.pokedexData = {};
                if (!this.player!.pokedexData[oppId]) this.player!.pokedexData[oppId] = { seen: 0, caught: 0, defeated: 0 };
                this.player!.pokedexData[oppId].seen += 1;
                this.player!.pokedexData[oppId].defeated += 1;
            }
        }

        this.player!.gold += gain;
        Game.sendGlobalLog(`💰 [Extrato] Novo Saldo de ${this.player!.name}: ${this.player!.gold}G.`);

        if (NetworkObj.isOnline) {
            NetworkObj.syncPlayerState();
            if (this.isPvP && this.enemyPlayer) {
                NetworkObj.syncSpecificPlayer(this.enemyPlayer.id);
                NetworkObj.sendAction('PVP_SYNC_DAMAGE', { targetId: this.enemyPlayer.id, team: this.enemyPlayer.team, gold: this.enemyPlayer.gold, badges: this.enemyPlayer.badges, resetPos: true, skipTurn: true });
                Game.handleTotalDefeat(this.enemyPlayer);
            }
        }

        setTimeout(() => {
            BattleUI.logBattle(`🏆 ${msg}`, true);
            setTimeout(() => { Game.sendGlobalLog(`${this.player?.name} venceu! ${msg}`); }, 200);
        }, 500);

        setTimeout(() => this.end(false), 2500);
    }

    static lose() {
        const Game = (window as any).Game;
        const NetworkObj = (window as any).Network || Network;
        if (this.isGym || this.isChampion) this.player!.effects.curse = false;
        this.revertMew();
        let msg = "DERROTA... ";

        const QuestManagerObj = (window as any).QuestManager || (window as any).modules?.QuestManager;
        if (QuestManagerObj && this.player) {
            QuestManagerObj.resetProgress(this.player, 'WIN_STREAK');
            QuestManagerObj.resetProgress(this.player, 'WIN_PVP_STREAK');
            QuestManagerObj.resetProgress(this.player, 'WIN_GYM_STREAK');
        }

        if (!this.isPvP && !this.isGym && !this.isNPC && this.opponent) {
            const oppId = this.opponent.id;
            if (!this.player!.pokedexData) this.player!.pokedexData = {};
            if (!this.player!.pokedexData[oppId]) this.player!.pokedexData[oppId] = { seen: 0, caught: 0, defeated: 0 };
            this.player!.pokedexData[oppId].seen += 1;
        }

        if (this.isPvP && this.enemyPlayer) {
            if (this.activeEffects.stealBadgeFrom === this.enemyPlayer.id) {
                const unlockedBadges = this.player!.badges.map((b, i) => b ? i : -1).filter(i => i !== -1);
                if (unlockedBadges.length > 0) {
                    const randomBadgeIndex = unlockedBadges[Math.floor(Math.random() * unlockedBadges.length)];
                    this.player!.badges[randomBadgeIndex] = false;
                    Game.sendGlobalLog(`💥 [Derrota no Desafio] ${this.player!.name} apostou alto e perdeu uma Insígnia permanentemente!`);
                } else {
                    Game.sendGlobalLog(`💥 [Derrota no Desafio] Como ${this.player!.name} não possuía nenhuma Insígnia, ele saiu ileso da aposta.`);
                }
            } else {
                let penaltyRate = 0.3;
                if (Game.currentGlobalEvent?.id === 'BLOOD_MOON') penaltyRate = 0.6;
                let lostGold = 0;
                if (this.player!.gold > 0) {
                    lostGold = Math.floor(this.player!.gold * penaltyRate);
                    this.player!.gold -= lostGold;
                    this.enemyPlayer.gold += lostGold;
                    Game.sendGlobalLog(`💰 [Extrato] Transferência de ${lostGold}G de ${this.player!.name} para ${this.enemyPlayer.name} (Luta PvP).`);
                    Game.sendGlobalLog(`💰 [Extrato] Novo Saldo de ${this.player!.name}: ${this.player!.gold}G.`);
                    Game.sendGlobalLog(`💰 [Extrato] Novo Saldo de ${this.enemyPlayer.name}: ${this.enemyPlayer.gold}G.`);
                } else {
                    Game.sendGlobalLog(`💰 [Extrato] ${this.player!.name} já estava falido e não perdeu ouro no PvP.`);
                }
            }

            if (NetworkObj.isOnline) {
                if (NetworkObj.syncPlayers) NetworkObj.syncPlayers([this.player!.id, this.enemyPlayer.id]);
                else { NetworkObj.syncPlayerState(); NetworkObj.syncSpecificPlayer(this.enemyPlayer.id); }
                NetworkObj.sendAction('PVP_SYNC_DAMAGE', { targetId: this.enemyPlayer.id, team: this.enemyPlayer.team, gold: this.enemyPlayer.gold, badges: this.enemyPlayer.badges, resetPos: false, skipTurn: false });
            }

        } else {
            if (!this.isGym && Game.currentGlobalEvent?.id === 'ROCKET') {
                const stealableTeam = this.player!.team.filter(p => !p.vinculoSupremo && p.happiness < 100);
                if (this.player!.team.length > 3 && stealableTeam.length > 0) {
                    const stolenMonObj = stealableTeam[Math.floor(Math.random() * stealableTeam.length)];
                    const stolenIdx = this.player!.team.indexOf(stolenMonObj);
                    const stolenMon = this.player!.team.splice(stolenIdx, 1)[0];
                    Game.sendGlobalLog(`🚀 INVASÃO ROCKET! Eles emboscaram e roubararam o ${stolenMon.name} de ${this.player!.name}!!`);
                    msg += ` e a Rocket te roubou!`;
                } else if (this.player!.team.length > 3 && stealableTeam.length === 0) {
                    Game.sendGlobalLog(`🚀 A Equipe Rocket tentou roubar os Pokémon de ${this.player!.name}, mas o forte vínculo afetivo deles impediu o roubo!`);
                } else {
                    Game.sendGlobalLog(`🚀 A Equipe Rocket tentou roubar o único Pokémon de ${this.player!.name}, mas ele sobreviveu por pouco!`);
                }
            } else {
                const lostGold = this.player!.gold >= 100 ? 100 : this.player!.gold;
                this.player!.gold = Math.max(0, this.player!.gold - 100);
                if (lostGold > 0) {
                    Game.sendGlobalLog(`💰 [Extrato] ${this.player!.name} deixou cair -${lostGold}G enquanto fugia.`);
                    Game.sendGlobalLog(`💰 [Extrato] Novo Saldo: ${this.player!.gold}G.`);
                }
            }
            if (NetworkObj.isOnline) NetworkObj.syncPlayerState();
        }

        if (this.player!.isDefeated()) {
            Game.handleTotalDefeat(this.player!);
            this.end(false);
            return;
        }

        if (!this.isPvP) { this.player!.team.forEach(p => p.heal(999)); }

        const city = Game.getLastCityCoord(this.player!);
        this.player!.x = city.x;
        this.player!.y = city.y;
        this.player!.skipTurns += 1;

        if (this.isPvP && this.enemyPlayer) msg += ` ${this.enemyPlayer.name} venceu!`;

        if (NetworkObj.isOnline) NetworkObj.syncPlayerState();

        setTimeout(() => {
            BattleUI.logBattle(`💀 ${msg}`, true);
            setTimeout(() => { Game.sendGlobalLog(`${this.player?.name} perdeu e recuou para o último Centro Pokémon!`); }, 200);
        }, 500);

        setTimeout(() => { this.end(false); Game.moveVisuals(); }, 2500);
    }

    static end(isRemote: boolean) {
        this.revertMew();
        const Game = (window as any).Game;
        const NetworkObj = (window as any).Network || Network;
        this.active = false;
        BattleUI.currentBattleId = null; // Finaliza a captura de logs isolados
        this.opponent = null;
        this.oppTeamList = [];
        this.isChampion = false;

        if (this.player && this.player.team) {
            this.player.team.forEach(mon => {
                if ((mon as any).isResonant) {
                    mon.recalculateStats(false);
                    (mon as any).isResonant = false;
                    (mon as any).resonantBonus = 0;
                }
            });
        }

        this.activeEffects = {};
        document.getElementById('battle-modal')!.style.display = 'none';

        if (!isRemote) {
            if (NetworkObj.isOnline) {
                // Notifica o fim da batalha via ação (para outros clients limparem a UI)
                NetworkObj.sendAction('BATTLE_END', {});
                
                db.from('rooms').update({ battle_active: false }).eq('id', NetworkObj.currentRoomId).then();
            }
            Game.nextTurn();
        } else {
            if (Game && typeof Game.checkTurnControl === 'function') Game.checkTurnControl();
        }
    }

    static run() {
        if (this.isPvP || this.isNPC || this.isGym) return alert("Não pode fugir de treinadores!");
        this.processingAction = true;
        BattleUI.updateButtons();

        const baseChance = 50;
        const d6 = Math.floor(Math.random() * 6) + 1;
        const modifier = (d6 * 4) - 14;
        let finalChance = Math.max(5, Math.min(95, baseChance + modifier));

        BattleUI.logBattle(`Tentando fugir... (🎲${d6}) Chance: ${finalChance}%`, true);

        setTimeout(() => {
            const roll = Math.floor(Math.random() * 100) + 1;
            if (roll <= finalChance) {
                BattleUI.logBattle("🏃 Escapou com sucesso!", true);
                
                const QuestManagerObj = (window as any).QuestManager || (window as any).modules?.QuestManager;
                if (QuestManagerObj && this.player) QuestManagerObj.resetProgress(this.player, 'WIN_STREAK');

                this.activeMon!.gainXp(5, this.player!);

                if (this.opponent) {
                    if (this.opponent.isLegendary || this.opponent.isShiny) {
                        const Game = (window as any).Game;
                        const NetworkObj = (window as any).Network || Network;
                        Game.lixeira.push(this.opponent);
                        if (NetworkObj.isOnline) NetworkObj.syncLixeira();
                    }

                    const oppId = this.opponent.id;
                    if (!this.player!.pokedexData) this.player!.pokedexData = {};
                    if (!this.player!.pokedexData[oppId]) this.player!.pokedexData[oppId] = { seen: 0, caught: 0, defeated: 0 };
                    this.player!.pokedexData[oppId].seen += 1;

                    const NetworkObj = (window as any).Network || Network;
                    if (NetworkObj.isOnline) NetworkObj.syncPlayerState();
                }
                setTimeout(() => this.end(false), 1000);
            } else {
                BattleUI.logBattle("🚫 Falha na fuga! O inimigo vai atacar.", true);
                setTimeout(() => {
                    this.performEnemyAttack(() => {
                        this.processingAction = false;
                        BattleUI.updateButtons();
                    });
                }, 1000);
            }
        }, 1000);
    }

    static surrender() {
        if (this.isPvP) return;

        BattleUI.showBattleConfirm(
            "Você tem certeza que deseja <b>DESISTIR</b> da batalha?<br><br>Você perderá ouro e será teleportado para o último Centro Pokémon.",
            () => {
                this.processingAction = true;
                BattleUI.updateButtons();

                BattleUI.logBattle("🏳️ Você desistiu da batalha! Fugindo para o Centro Pokémon...", true);

                setTimeout(() => {
                    const Game = (window as any).Game;
                    const NetworkObj = (window as any).Network || Network;
                    this.active = false;
                    document.getElementById('battle-modal')!.style.display = 'none';

                    if (NetworkObj.isOnline && this.player && this.player.id === NetworkObj.myPlayerId) {
                        NetworkObj.sendAction('BATTLE_END', { log: `🏳️ ${this.player.name} desistiu da batalha.` });
                    }

                    if (this.player) {
                        if (this.isGym || this.isChampion) this.player.effects.curse = false;
                        const lostGold = this.player.gold >= 100 ? 100 : this.player.gold;
                        this.player.gold = Math.max(0, this.player.gold - 100);
                        if (lostGold > 0) {
                            Game.sendGlobalLog(`💰 [Extrato] ${this.player.name} deixou cair -${lostGold}G ao desistir da batalha.`);
                            Game.sendGlobalLog(`💰 [Extrato] Novo Saldo: ${this.player.gold}G.`);
                        }

                        if (this.opponent && (this.opponent.isLegendary || this.opponent.isShiny)) {
                            Game.lixeira.push(this.opponent);
                            if (NetworkObj.isOnline) NetworkObj.syncLixeira();
                        }

                        Game.handleTotalDefeat(this.player);
                    }
                    Game.nextTurn();
                }, 1500);
            }
        );
    }

    static useItem(key: string, data: ItemData) {
        if (this.isGym && this.player!.effects.curse) {
            const Game = (window as any).Game;
            Game.showGlobalAlert("😈 Sua mochila foi selada pela Maldição! Você não pode usar itens nesta Batalha de Ginásio!", this.player!.name, true, false);
            return;
        }

        if (this.isChampion) return alert("🚫 As regras da Liga proíbem o uso de Itens de Cura no Desafio do Campeão!");
        if (data.type === 'revive') return alert("Você não pode reviver Pokémon durante a batalha!");

        const isMegaOrMew = (!this.isPvP && this.activeMon && ((this.activeMon as any).isTemp || (this.activeMon as any).isMegaEvolution));
        if (isMegaOrMew && data.type !== 'capture') return alert("🧬 É proibido usar itens de cura/buff em Mega Evoluções ou Mews no PvE.");

        const NetworkObj = (window as any).Network || Network;
        document.getElementById('battle-bag')!.style.display = 'none';

        if (data.type === 'capture') {
            if (this.isPvP || this.isNPC || this.isGym) return alert("Não pode capturar pokémons de treinadores!");
            const Game = (window as any).Game;
            if (Game.currentGlobalEvent?.id !== 'SAFARI_ZONE') this.player!.items[key]--;
            else BattleUI.logBattle("🌳 SAFARI ZONE: Pokébofas são infinitas!", true);

            this.processingAction = true;
            BattleUI.updateButtons();
            this.attemptCapture(data);
        }
        else if (data.type === 'heal') {
            if (this.activeMon!.isFainted()) return alert("O Pokémon está desmaiado!");
            if (this.activeMon!.currentHp >= this.activeMon!.maxHp) return alert("HP já está cheio!");

            this.player!.items[key]--;
            this.processingAction = true;
            BattleUI.updateButtons();

            this.activeMon!.heal(data.val!);
            this.activeMon!.addHappiness(1);
            BattleUI.logBattle(`💊 Usou ${data.name}! Recuperou HP.`, true);
            BattleUI.updateUI();

            if (NetworkObj.isOnline) {
                NetworkObj.sendAction('BATTLE_UPDATE', { 
                    plyHp: this.activeMon!.currentHp, 
                    oppHp: this.opponent!.currentHp, 
                    plyItem: this.activeMon!.heldItem,
                    oppItem: this.opponent!.heldItem,
                    msg: `Usou ${data.name}!` 
                });
            }

            setTimeout(() => {
                this.performEnemyAttack(() => {
                    this.processingAction = false;
                    BattleUI.updateButtons();
                });
            }, 1500);
        }

        if (NetworkObj.isOnline) NetworkObj.syncPlayerState();
    }

    static async attemptCapture(item: ItemData) {
        if (!this.opponent || !this.activeMon) return;
        this.processingAction = true;
        this.pokeballsThrownThisBattle++;
        BattleUI.updateButtons();
        const opponent = this.opponent;

        BattleUI.logBattle(`Jogou ${item.name}!`, true);
        let success = false;

        if (item.id === 'masterball') {
            success = true;
            BattleUI.logBattle(`(Chance Final: 100% | Master Ball)`, true);
        } else {
            let baseChance = 15;
            let hpBonus = 0;
            const hpPercent = (opponent.currentHp / opponent.maxHp) * 100;

            if (hpPercent < 15) hpBonus = 50;
            else if (hpPercent < 60) hpBonus = 25;

            const oppStats = opponent.maxHp + opponent.atk + opponent.def + opponent.speed;
            const powerPenalty = Math.floor(oppStats / 30);
            let rarityPenalty = opponent.isLegendary ? 10 : 0;
            if (opponent.isShiny) rarityPenalty += 10;

            const d6 = Math.floor(Math.random() * 6) + 1;
            const diceBonus = (d6 * 4) - 14;

            let chanceBeforeBall = baseChance + hpBonus - powerPenalty - rarityPenalty + diceBonus;
            let travaMsg = "";
            if (chanceBeforeBall < 15) { chanceBeforeBall = 15; travaMsg = " (Trava Min 15%)"; }

            let ballBonus = (item.id === 'greatball') ? 20 : (item.id === 'ultraball') ? 40 : 0;
            let chance = chanceBeforeBall + ballBonus;

            const Game = (window as any).Game;
            let safariBonus = 0;
            if (Game.currentGlobalEvent?.id === 'SAFARI_ZONE') { safariBonus = 50; chance += safariBonus; }
            chance = Math.min(Game.currentGlobalEvent?.id === 'SAFARI_ZONE' ? 100 : 95, chance);

            let logMsg = `Cálc: Base(15) + HP(+${hpBonus}) - Resist(-${powerPenalty}) - Rari(-${rarityPenalty}) + Dado(🎲${d6}: ${diceBonus > 0 ? '+' : ''}${diceBonus}) = ${chanceBeforeBall}%${travaMsg} | Bola(+${ballBonus}%)`;
            if (safariBonus > 0) logMsg += ` | Safari(+${safariBonus}%)`;
            logMsg += ` => Final: ${chance}%`;

            BattleUI.logBattle(logMsg, true);
            success = (Math.floor(Math.random() * 100) + 1 <= chance);
        }

        await BattleUI.animateCaptureSequence(item.icon, success);

        if (success) this.captureSuccess();
        else {
            BattleUI.logBattle("Aargh! Quase! O Pokémon escapou!", true);
            setTimeout(() => {
                this.performEnemyAttack(() => {
                    this.processingAction = false;
                    BattleUI.updateButtons();
                    if (this.isAutoPvE && this.activeMon!.currentHp > 0 && this.opponent!.currentHp > 0) {
                        setTimeout(() => this.attack(), 1500);
                    }
                });
            }, 500);
        }
    }

    static captureSuccess() {
        const Game = (window as any).Game;
        const NetworkObj = (window as any).Network || Network;

        Game.sendGlobalLog(`✨ ${this.player?.name} capturou um ${this.opponent!.name}!`);
        this.revertMew();
        
        const QuestManagerObj = (window as any).QuestManager || (window as any).modules?.QuestManager;
        if (QuestManagerObj && this.player) {
            QuestManagerObj.checkProgress(this.player, 'CAPTURE_WILD', 1);
            if (this.pokeballsThrownThisBattle === 1) {
                QuestManagerObj.checkProgress(this.player, 'FIRST_BALL_CAPTURE', 1);
            }
            if (this.opponent) {
                if (this.opponent.baseTotal >= 280 && this.opponent.baseTotal <= 329) QuestManagerObj.checkProgress(this.player, 'CAPTURE_RARE', 1);
                if (this.opponent.type === 'Água' || this.opponent.secondType === 'Água') QuestManagerObj.checkProgress(this.player, 'CAPTURE_WATER', 1);
                if (this.opponent.isLegendary) QuestManagerObj.checkProgress(this.player, 'CAPTURE_LEGENDARY', 1);
                QuestManagerObj.checkProgress(this.player, 'CAPTURE_TYPE_SPECIFIC', 1, {type: this.opponent.type, secondType: this.opponent.secondType});
            }
        }

        BattleUI.updateUI();

        if (this.opponent) {
            const oppId = this.opponent.id;
            if (!this.player!.pokedexData) this.player!.pokedexData = {};
            if (!this.player!.pokedexData[oppId]) this.player!.pokedexData[oppId] = { seen: 0, caught: 0, defeated: 0 };
            this.player!.pokedexData[oppId].seen += 1;
            this.player!.pokedexData[oppId].caught += 1;

            if (this.player!.pokedexData[oppId].caught >= 4 && QuestManagerObj) {
                QuestManagerObj.checkProgress(this.player, 'RESONANCE_30', 1);
            }
        }

        this.activeMon!.gainXp(5, this.player!);

        if (this.player!.team.length < 6) {
            this.player!.team.push(this.opponent!);
            if (NetworkObj.isOnline) NetworkObj.syncPlayerState();
            setTimeout(() => this.end(false), 1500);
        } else {
            if (this.player!.isCPU) {
                const getStats = (mon: any) => mon.maxHp + mon.atk + mon.def + mon.speed;
                const oppStats = getStats(this.opponent!);
                
                let weakestIdx = 0;
                let weakestStats = getStats(this.player!.team[0]);

                for (let i = 1; i < 6; i++) {
                    const st = getStats(this.player!.team[i]);
                    if (st < weakestStats) {
                        weakestStats = st;
                        weakestIdx = i;
                    }
                }

                if (oppStats > weakestStats) {
                    if (Game.sendGlobalLog) Game.sendGlobalLog(`🔄 CPU substituiu ${this.player!.team[weakestIdx].name} por ${this.opponent!.name}!`);
                    this.player!.team[weakestIdx] = this.opponent!;
                }
                
                if (NetworkObj.isOnline) NetworkObj.syncPlayerState();
                setTimeout(() => this.end(false), 1500);
            } else {
                this.pendingCapture = this.opponent;
                Game.openSwapModal(this.pendingCapture);
            }
        }
    }

    // Funcionalidades de Mega Evolução extraídas
    static tryTriggerMegaEvolution(contextMsg: string = "reagiu durante o combate") {
        const Game = (window as any).Game;
        if (Game.currentGlobalEvent?.id === 'MEGA_BLOCK') return;
        if (!this.activeMon || !this.activeMon.megaStone || (this.activeMon as any).isTemp) return;

        const megaId = MAPA_MEGAS[this.activeMon.id];
        if (megaId && Math.random() < 0.10) {
            setTimeout(() => {
                if (!this.activeMon || (this.activeMon as any).isTemp) return;
                this.performMegaEvolution(megaId);
                BattleUI.logBattle(`💎 A Mega Pedra de ${this.activeMon.name} ${contextMsg}!`, true);
            }, 1000);
        }
    }

    static tryOpponentMegaEvolution(contextMsg: string = "reagiu durante o combate") {
        const Game = (window as any).Game;
        if (Game.currentGlobalEvent?.id === 'MEGA_BLOCK') return;
        if (!this.opponent || !this.opponent.megaStone || (this.opponent as any).isTemp) return;

        const megaId = MAPA_MEGAS[this.opponent.id];
        if (megaId && Math.random() < 0.10) {
            setTimeout(() => {
                if (!this.opponent || (this.opponent as any).isTemp) return;
                this.performOpponentMegaEvolution(megaId);
                BattleUI.logBattle(`💎 A Mega Pedra de ${this.opponent.name} (Inimigo) ${contextMsg}!`, true);
            }, 1000);
        }
    }

    static performMegaEvolution(megaId: number) {
        const NetworkObj = (window as any).Network || Network;
        const megaData = POKEDEX.find((p: any) => p.id === megaId);
        if (!megaData) return alert("Dados da Mega Evolução não encontrados!");

        this.activeEffects.mewOriginal = this.player!.team[this.player!.team.indexOf(this.activeMon!)];
        this.activeEffects.mewIndex = this.player!.team.indexOf(this.activeMon!);

        const PokemonClass = (window as any).Pokemon || this.activeMon!.constructor;
        const megaMon = new PokemonClass(this.activeMon!.id, this.activeMon!.level, this.activeMon!.isShiny);

        megaMon.ivs = { ...this.activeMon!.ivs };
        megaMon.bonusStats = { ...this.activeMon!.bonusStats };
        megaMon.currentXp = this.activeMon!.currentXp;
        megaMon.maxXp = this.activeMon!.maxXp;
        megaMon.happiness = this.activeMon!.happiness;
        megaMon.vinculoSupremo = this.activeMon!.vinculoSupremo;
        megaMon.id = megaData.id;
        megaMon.name = megaData.name;
        megaMon.type = megaData.type;
        megaMon.secondType = megaData.secondType || "";
        megaMon.baseStats = { hp: megaData.hp, atk: megaData.atk, def: megaData.def, spd: megaData.spd };
        if (megaData.BaseTotal) megaMon.baseTotal = megaData.BaseTotal;

        (megaMon as any).isMegaEvolution = true;
        megaMon.recalculateStats(true);
        (megaMon as any).isTemp = true;

        this.activeMon = megaMon;
        if (this.activeEffects.mewIndex !== undefined && this.activeEffects.mewIndex !== -1) {
            this.player!.team[this.activeEffects.mewIndex] = megaMon;
        }

        const plyListIdx = this.plyTeamList.findIndex(p => p.id === this.activeEffects.mewOriginal.id);
        if (plyListIdx !== -1) this.plyTeamList[plyListIdx] = megaMon;
        else {
            const activeIndex = this.plyTeamList.findIndex(p => p === this.activeEffects.mewOriginal);
            if (activeIndex !== -1) this.plyTeamList[activeIndex] = megaMon;
        }

        BattleUI.logBattle(`💎 O elo fortaleceu! Mega Evolução para ${megaMon.name}!`, true);
        BattleUI.updateUI();

        if (NetworkObj.isOnline) {
            NetworkObj.syncPlayerState();
            NetworkObj.sendAction('BATTLE_PLY_SWITCH', { nextPly: NetworkObj.getSanitizedTeam([megaMon])[0] });
        }
    }

    static performOpponentMegaEvolution(megaId: number) {
        const NetworkObj = (window as any).Network || Network;
        const megaData = POKEDEX.find((p: any) => p.id === megaId);
        if (!megaData) return;

        if (!this.activeEffects) this.activeEffects = {};
        this.activeEffects.opponentMewOriginal = this.opponent;
        if (this.enemyPlayer) this.activeEffects.opponentMewIndex = this.enemyPlayer.team.indexOf(this.opponent!);

        const PokemonClass = (window as any).Pokemon || this.opponent!.constructor;
        const megaMon = new PokemonClass(this.opponent!.id, this.opponent!.level, this.opponent!.isShiny);

        megaMon.ivs = { ...this.opponent!.ivs };
        megaMon.bonusStats = { ...this.opponent!.bonusStats };
        megaMon.currentXp = this.opponent!.currentXp;
        megaMon.maxXp = this.opponent!.maxXp;
        megaMon.happiness = this.opponent!.happiness;
        megaMon.vinculoSupremo = this.opponent!.vinculoSupremo;
        megaMon.id = megaData.id;
        megaMon.name = megaData.name;
        megaMon.type = megaData.type;
        megaMon.secondType = megaData.secondType || "";
        megaMon.baseStats = { hp: megaData.hp, atk: megaData.atk, def: megaData.def, spd: megaData.spd };
        if (megaData.BaseTotal) megaMon.baseTotal = megaData.BaseTotal;

        (megaMon as any).isMegaEvolution = true;
        megaMon.recalculateStats(true);
        (megaMon as any).isTemp = true;
        this.opponent = megaMon;

        if (this.enemyPlayer && this.activeEffects.opponentMewIndex !== undefined && this.activeEffects.opponentMewIndex !== -1) {
            this.enemyPlayer.team[this.activeEffects.opponentMewIndex] = megaMon;
        }

        const oppListIdx = this.oppTeamList.findIndex(p => p.id === this.activeEffects.opponentMewOriginal.id);
        if (oppListIdx !== -1) this.oppTeamList[oppListIdx] = megaMon;
        else {
            const activeIndex = this.oppTeamList.findIndex(p => p === this.activeEffects.opponentMewOriginal);
            if (activeIndex !== -1) this.oppTeamList[activeIndex] = megaMon;
        }

        BattleUI.logBattle(`💎 O elo inimigo fortaleceu! Mega Evolução para ${megaMon.name}!`, true);
        BattleUI.updateUI();

        if (NetworkObj.isOnline) {
            if (this.isPvP && this.enemyPlayer) NetworkObj.syncSpecificPlayer(this.enemyPlayer.id);
            else if (!this.isPvP) NetworkObj.sendAction('BATTLE_OPP_SWITCH', { nextOpp: NetworkObj.getSanitizedTeam([megaMon])[0] });
        }
    }

    static revertMew() {
        if (this.activeEffects && this.activeEffects.mewOriginal && this.player) {
            const original = this.activeEffects.mewOriginal;

            // Recalcula status completo e reaplica a Ressonância Genética
            original.recalculateStats(false);
            this.applyResonanceBonus(this.player, original);

            const tempIndex = this.player.team.findIndex(p => (p as any).isTemp || p.isMegaEvolution);

            if (tempIndex !== -1) this.player.team[tempIndex] = original;
            else if (this.activeEffects.mewIndex !== undefined && this.player.team[this.activeEffects.mewIndex]) {
                this.player.team[this.activeEffects.mewIndex] = original;
            }

            const plyListIdx = this.plyTeamList.findIndex(p => (p as any).isTemp || (p as any).isMegaEvolution);
            if (plyListIdx !== -1) this.plyTeamList[plyListIdx] = original;

            if (this.activeMon && ((this.activeMon as any).isTemp || this.activeMon.isMegaEvolution)) this.activeMon = original;
            this.activeEffects.mewOriginal = null;
        }
        if (this.player) {
            this.player.team = this.player.team.filter(p => !(p as any).isTemp);
            this.player.team.forEach(mon => { if (typeof mon.validateAndFix === 'function') mon.validateAndFix(); });
        }
    }

    static revertOpponentMew() {
        if (this.activeEffects && this.activeEffects.opponentMewOriginal) {
            const original = this.activeEffects.opponentMewOriginal;

            // Recalcula status completo e reaplica a Ressonância Genética para o oponente se houver player
            original.recalculateStats(false);
            if (this.enemyPlayer) {
                this.applyResonanceBonus(this.enemyPlayer, original);
            }

            if (this.enemyPlayer) {
                const tempIndex = this.enemyPlayer.team.findIndex(p => (p as any).isTemp || p.isMegaEvolution);
                if (tempIndex !== -1) this.enemyPlayer.team[tempIndex] = original;
                else if (this.activeEffects.opponentMewIndex !== undefined && this.enemyPlayer.team[this.activeEffects.opponentMewIndex]) {
                    this.enemyPlayer.team[this.activeEffects.opponentMewIndex] = original;
                }
            }

            const oppListIdx = this.oppTeamList.findIndex(p => (p as any).isTemp || (p as any).isMegaEvolution);
            if (oppListIdx !== -1) this.oppTeamList[oppListIdx] = original;

            if (this.opponent && ((this.opponent as any).isTemp || (this.opponent as any).isMegaEvolution)) this.opponent = original;
            this.activeEffects.opponentMewOriginal = null;
        }
        if (this.enemyPlayer) {
            this.enemyPlayer.team = this.enemyPlayer.team.filter(p => !(p as any).isTemp);
            this.enemyPlayer.team.forEach(mon => { if (typeof mon.validateAndFix === 'function') mon.validateAndFix(); });
        }
    }

    static applyResonanceBonus(player: Player, mon: Pokemon) {
        if (!player.pokedexData || !player.pokedexData[mon.id]) return;
        const data = player.pokedexData[mon.id];
        const captures = data.caught || 0;

        if (captures > 1) {
            mon.recalculateStats(false);
            const extraCount = captures - 1;
            const bonusPercent = Math.min(1.0, extraCount * 0.10);

            mon.maxHp = Math.floor(mon.maxHp * (1 + bonusPercent));
            mon.currentHp = Math.floor(mon.currentHp * (1 + bonusPercent));
            mon.atk = Math.floor(mon.atk * (1 + bonusPercent));
            mon.def = Math.floor(mon.def * (1 + bonusPercent));
            mon.speed = Math.floor(mon.speed * (1 + bonusPercent));
            (mon as any).isResonant = true;
            (mon as any).resonantBonus = Math.floor(bonusPercent * 100);
        }
    }

    static autoAttackNext() {
        if (!this.active || !this.isPvP) return;
        this.tryTriggerMegaEvolution("ressoou no decorrer do combate");
        this.tryOpponentMegaEvolution("ressoou no decorrer do combate");
        if (this.activeMon && this.activeMon.currentHp > 0 && this.opponent && this.opponent.currentHp > 0) {
            this.attack();
        }
    }

    static toggleAutoPvE() {
        this.isAutoPvE = !this.isAutoPvE;
        const btn = document.getElementById('btn-auto-pve');
        if (btn) {
            if (this.isAutoPvE) {
                btn.innerText = "🛑 Parar Auto";
                btn.classList.add('active-auto');
                BattleUI.logBattle("⚡ Modo Automático ativado!", true);
                if (!this.processingAction) this.attack();
            } else {
                btn.innerText = "⚡ Auto Atacar";
                btn.classList.remove('active-auto');
                BattleUI.logBattle("⚡ Modo Automático pausado.", true);
            }
        }
    }

    static startAutoPvP() {
        if (!this.isPvP) return;
        this.processingAction = true;
        BattleUI.updateButtons();
        BattleUI.logBattle(`⚔️ A Batalha Automática começou!`, true);
        setTimeout(() => this.autoAttackNext(), 1500);
    }
}
