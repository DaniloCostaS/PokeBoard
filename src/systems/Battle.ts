import { Player } from '../models/Player';
import { Pokemon } from '../models/Pokemon';
import { GYM_DATA } from '../constants/gyms';
import { TYPE_CHART } from '../constants/typeChart';
import { SHOP_ITEMS, CARD_RARITIES } from '../constants';
import type { ItemData } from '../constants';
import { Cards } from './Cards';
import { db } from './Network';
import { MAPA_MEGAS } from '../constants/mapaMegas';
import { ref, update } from 'firebase/database';
import { POKEDEX } from '../constants/pokedex';

export class Battle {
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
    static currentTerrain: number = 0;
    static isAutoPvE: boolean = false;
    static isChampion: boolean = false;

    static setup(player: Player, enemyMon: any, isPvP: boolean = false, _label: string = "", reward: number = 0, enemyPlayer: Player | null = null, isGym: boolean = false, gymId: number = 0, npcImage: string = "", terrainTile: number = 1) {
        const Game = (window as any).Game;
        const pendingSteal = this.activeEffects.stealBadgeFrom;

        this.player = player; this.isPvP = isPvP; this.isNPC = (reward > 0 && !isPvP); this.isGym = isGym; this.gymId = gymId; this.reward = reward; this.enemyPlayer = enemyPlayer; this.processingAction = false;

        this.activeEffects = {};
        this.itemsUsedThisBattle = 0;
        this.cardsUsedThisBattle = 0;

        if (pendingSteal !== undefined && pendingSteal !== null) {
            this.activeEffects.stealBadgeFrom = pendingSteal;
        }

        this.battleTitle = isPvP ? "Batalha PvP!" : `Batalha contra ${_label}!`;
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

                this.logBattle(`⚔️ DUELO DE LIDERANÇA! 3 Pokémon foram sorteados e totalmente curados para o combate!`, true);

                const Network = (window as any).Network;
                if (Network.isOnline) {
                    Network.syncPlayers([player.id, enemyPlayer.id]);
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
            if (enemyPlayer.effects.curse) { this.logBattle(`☠️ ${enemyPlayer.name} está amaldiçoado! (Dano reduzido)`); }
        }
        else if (isGym) {
            if (Game.currentGlobalEvent?.id === 'GYM_RUSH') {
                player.team.forEach(mon => mon.heal(9999));
                Game.sendGlobalLog(`🏛️ O Desafio dos Líderes curou o time de ${player.name} totalmente antes da batalha!`);
            }

            const actualGymId = Game.activeGyms ? Game.activeGyms[gymId - 1] : gymId;
            const gymData = GYM_DATA.find(g => g.id === actualGymId);

            const globalAvg = Game.getGlobalAverageLevel();
            const gymLevel = globalAvg + 1;
            const teamSize = Math.min(6, Math.max(2, Game.getGlobalAverageTeamSize() + 1));
            const dynamicTeams = Game.gymTeams || {};

            let rosterIds = dynamicTeams[actualGymId] || (gymData ? gymData.teamIds : [130]);

            // Embaralha o roster para o ginásio escolher Pokémons de forma aleatória
            rosterIds = [...rosterIds].sort(() => Math.random() - 0.5);

            const battleIds = rosterIds.slice(0, teamSize);

            this.oppTeamList = battleIds.map((id: number) => new Pokemon(id, gymLevel, false, true));
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
            setTimeout(() => this.logBattle(`🧬 Ressonância Genética: ${this.plyTeamList[0].name} está ${activeResonance}% mais forte!`, true), 800);
        }

        if (this.plyTeamList.length === 0) {
            Game.handleTotalDefeat(player);
            Game.nextTurn();
            return;
        }

        if (this.isNPC && npcImage) { (this.opponent as any)._npcImage = npcImage; (this.opponent as any)._npcName = _label; }

        if (this.isGym && this.player.effects.curse) {
            this.logBattle("😈 CUIDADO! Você entrou no Ginásio Amaldiçoado! Dano reduzido e Itens bloqueados!", true);
        }

        if (Game.currentGlobalEvent?.id === 'SANDSTORM') {
            const hurtSand = (mon: Pokemon) => {
                if (!['Pedra', 'Terra', 'Aço'].includes(mon.type) && (!mon.secondType || !['Pedra', 'Terra', 'Aço'].includes(mon.secondType))) {
                    mon.currentHp = Math.max(1, Math.floor(mon.currentHp * 0.9));
                }
            };
            this.plyTeamList.forEach(hurtSand);
            this.oppTeamList.forEach(hurtSand);
            setTimeout(() => this.logBattle("🌪️ A Tempestade de Areia corta os Pokémons em campo!", true), 1000);
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
                const Game = (window as any).Game;
                const actualGymId = Game.activeGyms ? Game.activeGyms[this.gymId - 1] : this.gymId;
                const gymData = GYM_DATA.find(g => g.id === actualGymId);

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
            this.openSelectionModal(contextTitle);
        }
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

        // Embaralha o time do campeão para o primeiro pokémon ser selecionado de forma aleatória
        this.oppTeamList.sort(() => Math.random() - 0.5);
        this.opponent = this.oppTeamList[0];

        this.battleTitle = `🏆 CAMPEÃO ATUAL: ${championData.name.toUpperCase()} 🏆`;

        const contextTitle = `🏆 <b>DESAFIO AO CAMPEÃO ${championData.name.toUpperCase()}!</b><br><small style="color:#f1c40f; font-size:0.9rem;">Escolha seu Pokémon para a Batalha Final!</small>`;
        this.openSelectionModal(contextTitle);

        const Game = (window as any).Game;
        Game.sendGlobalLog(`⚔️ O DESAFIO FINAL! ${player.name} está enfrentando o Campeão ${championData.name}!`);
        this.logBattle(`🏆 DESAFIO AO CAMPEÃO 🏆\nSem Itens. Sem Cartas. Apenas força bruta!`);
    }

    static openSelectionModal(title: string) {
        const modal = document.getElementById('pkmn-select-modal')!;
        const list = document.getElementById('pkmn-select-list')!;

        document.getElementById('select-title')!.innerHTML = title;

        list.innerHTML = '';
        this.plyTeamList.forEach((mon) => {
            const div = document.createElement('div');
            div.className = `mon-select-item ${mon.isFainted() ? 'disabled' : ''}`;
            div.innerHTML = `<img src="${mon.getSprite()}" width="40"><b>${mon.name}</b> <small>(${mon.currentHp}/${mon.maxHp})</small>`;
            if (!mon.isFainted()) div.onclick = () => { modal.style.display = 'none'; this.startRound(mon); };
            list.appendChild(div);
        });
        modal.style.display = 'flex';
    }

    static wait(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static startRound(selectedMon: Pokemon) {
        const Network = (window as any).Network;
        document.getElementById('pkmn-select-modal')!.style.display = 'none';
        this.active = true;
        this.activeMon = selectedMon;

        this.tryTriggerMegaEvolution("ressoou no início da batalha");
        this.tryOpponentMegaEvolution("ressoou no início da batalha");

        this.renderBattleScreen();

        this.isPlayerTurn = true;
        this.processingAction = false;
        this.updateButtons();

        if (this.isPvP) {
            this.logBattle(`Atenção: Combate Automático Sorteado!`, true);
        } else {
            this.logBattle(`O que ${this.activeMon.name} fará?`, true);
        }

        const enemyId = this.enemyPlayer ? this.enemyPlayer.id : -1;

        if (Network.isOnline && this.player!.id === Network.myPlayerId) {
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

            Network.sendAction('BATTLE_START', {
                pId: this.player!.id,
                monIdx: this.player!.team.indexOf(this.activeMon),
                oppTeam: Network.getSanitizedTeam(this.oppTeamList),
                plyTeam: Network.getSanitizedTeam(this.plyTeamList),
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
    }

    static tryTriggerMegaEvolution(contextMsg: string = "reagiu durante o combate") {
        const Game = (window as any).Game;
        if (Game.currentGlobalEvent?.id === 'MEGA_BLOCK') return;

        if (!this.activeMon || !this.activeMon.megaStone) return;
        if ((this.activeMon as any).isTemp) return;

        const megaId = MAPA_MEGAS[this.activeMon.id];

        if (megaId && Math.random() < 0.10) {
            setTimeout(() => {
                if (!this.activeMon || (this.activeMon as any).isTemp) return;

                this.performMegaEvolution(megaId);
                this.logBattle(`💎 A Mega Pedra de ${this.activeMon.name} ${contextMsg}!`, true);
            }, 1000);
        }
    }

    static tryOpponentMegaEvolution(contextMsg: string = "reagiu durante o combate") {
        const Game = (window as any).Game;
        if (Game.currentGlobalEvent?.id === 'MEGA_BLOCK') return;

        if (!this.opponent) return;
        if ((this.opponent as any).isTemp) return;

        if (!this.opponent.megaStone) return;

        const megaId = MAPA_MEGAS[this.opponent.id];
        if (megaId && Math.random() < 0.10) {
            setTimeout(() => {
                if (!this.opponent || (this.opponent as any).isTemp) return;
                this.performOpponentMegaEvolution(megaId);
                this.logBattle(`💎 A Mega Pedra de ${this.opponent.name} (Inimigo) ${contextMsg}!`, true);
            }, 1000);
        }
    }

    static updateButtons() {
        const Network = (window as any).Network;
        const btns = document.querySelectorAll('.battle-actions button');

        const isMyBattle = Network.isOnline ? (this.player && this.player.id === Network.myPlayerId) : true;
        const canAct = this.isPlayerTurn && !this.processingAction && isMyBattle;

        btns.forEach((btn: Element) => {
            const htmlBtn = btn as HTMLButtonElement;
            if (htmlBtn.id === 'btn-auto-pve') {
                htmlBtn.disabled = !isMyBattle;
            } else {
                if (this.isAutoPvE) htmlBtn.disabled = true;
                else htmlBtn.disabled = !canAct;
            }
        });

        const runBtn = document.getElementById('btn-run') as HTMLButtonElement;
        const autoBtn = document.getElementById('btn-auto-pve') as HTMLButtonElement;

        if (this.isChampion) {
            if (runBtn) runBtn.disabled = true;
            if (autoBtn) autoBtn.style.display = 'block';
        } else if (this.isPvP) {
            if (runBtn) runBtn.disabled = true;
            if (autoBtn) autoBtn.style.display = 'none';
        } else if (this.isGym) {
            if (runBtn) runBtn.disabled = true;
            if (autoBtn) autoBtn.style.display = 'block';
        } else {
            if (autoBtn) autoBtn.style.display = 'block';
        }
    }

    static toggleAutoPvE() {
        this.isAutoPvE = !this.isAutoPvE;

        const btn = document.getElementById('btn-auto-pve');
        if (btn) {
            if (this.isAutoPvE) {
                btn.innerText = "🛑 Parar Auto";
                btn.classList.add('active-auto');
                this.logBattle("⚡ Modo Automático ativado!", true);

                if (!this.processingAction) {
                    this.attack();
                }
            } else {
                btn.innerText = "⚡ Auto Atacar";
                btn.classList.remove('active-auto');
                this.logBattle("⚡ Modo Automático pausado.", true);
            }
        }
    }

    static startAutoPvP() {
        if (!this.isPvP) return;
        this.processingAction = true;
        this.updateButtons();
        this.logBattle(`⚔️ A Batalha Automática começou!`, true);
        setTimeout(() => this.autoAttackNext(), 1500);
    }

    static autoAttackNext() {
        if (!this.active || !this.isPvP) return;

        this.tryTriggerMegaEvolution("ressoou no decorrer do combate");
        this.tryOpponentMegaEvolution("ressoou no decorrer do combate");

        if (this.activeMon && this.activeMon.currentHp > 0 && this.opponent && this.opponent.currentHp > 0) {
            this.attack();
        }
    }

    static startFromNetwork(payload: any) {
        const Game = (window as any).Game;
        const Network = (window as any).Network;
        const p = Game.players[payload.pId];
        if (!p) return;

        this.active = true;
        this.player = p;

        this.currentTerrain = payload.currentTerrain || 1;

        this.isPvP = payload.isPvP;
        this.isGym = payload.isGym;
        this.gymId = payload.gymId;
        this.isNPC = (!payload.isPvP && payload.reward > 0);
        if (payload.enemyId >= 0) this.enemyPlayer = Game.players[payload.enemyId];

        if (payload.plyTeam) {
            const PokemonClass = (window as any).Pokemon || p.team[0].constructor;
            this.plyTeamList = payload.plyTeam.map((td: any) => {
                const po = new PokemonClass(td.id, td.level, td.isShiny);
                Object.assign(po, td);
                return po;
            });
            this.activeMon = this.plyTeamList.find((m: any) => m.id === p.team[payload.monIdx]?.id) || this.plyTeamList[0];
        } else {
            this.activeMon = p.team[payload.monIdx] || p.team[0];
            if (this.activeMon) { this.plyTeamList = [this.activeMon]; }
            else { this.plyTeamList = []; }
        }

        if (payload.oppTeam && payload.oppTeam.length > 0) {
            const PokemonClass = (window as any).Pokemon || p.team[0].constructor;
            this.oppTeamList = payload.oppTeam.map((td: any) => {
                const po = new PokemonClass(td.id, td.level, td.isShiny);
                Object.assign(po, td);
                if (payload.npcImage) (po as any)._npcImage = payload.npcImage;
                if (payload.npcName) (po as any)._npcName = payload.npcName;
                return po;
            });

            const targetIdx = (payload.oppIdx !== undefined && payload.oppIdx >= 0) ? payload.oppIdx : 0;
            this.opponent = this.oppTeamList[targetIdx] || this.oppTeamList[0];
        }
        else if (payload.oppData) {
            this.opponent = new Pokemon(payload.oppData.id, payload.oppData.level, payload.oppData.isShiny);
            Object.assign(this.opponent, payload.oppData);
            this.oppTeamList = [this.opponent];
        }
        else if (this.enemyPlayer) {
            this.oppTeamList = this.enemyPlayer.getBattleTeam(false);
            const targetIdx = (payload.oppIdx !== undefined && payload.oppIdx >= 0) ? payload.oppIdx : 0;
            this.opponent = this.oppTeamList[targetIdx] || this.oppTeamList[0];
        }

        if (payload.npcImage && this.opponent) (this.opponent as any)._npcImage = payload.npcImage;
        if (payload.npcName && this.opponent) (this.opponent as any)._npcName = payload.npcName;

        if (payload.battleTitle) this.battleTitle = payload.battleTitle;

        if (payload.startingTurnId !== undefined) {
            this.isPlayerTurn = (payload.startingTurnId === Network.myPlayerId);
        } else {
            this.isPlayerTurn = (payload.pId === Network.myPlayerId);
        }

        this.renderBattleScreen();
    }

    static updateFromNetwork(payload: any) {
        if (!this.activeMon || !this.opponent) return;

        if (payload.plyHp !== undefined) this.activeMon.currentHp = payload.plyHp;
        if (payload.oppHp !== undefined) this.opponent.currentHp = payload.oppHp;

        if (payload.msg) this.logBattle(payload.msg);

        this.updateUI();
    }

    static renderBattleScreen() {
        const Network = (window as any).Network;
        document.getElementById('pkmn-select-modal')!.style.display = 'none';
        document.getElementById('battle-modal')!.style.display = 'flex';
        document.getElementById('battle-log-history')!.innerHTML = '';

        const enemyImg = document.getElementById('opp-img') as HTMLElement;
        if (enemyImg) {
            enemyImg.classList.remove('mon-caught-hidden');
            enemyImg.style.opacity = '1';
            enemyImg.style.transform = 'none';
        }

        const titleEl = document.getElementById('battle-title')!;
        if (Network.isOnline && this.player && this.player.id !== Network.myPlayerId) {
            let oppName = "Selvagem";
            if (this.isPvP && this.enemyPlayer) oppName = this.enemyPlayer.name;
            else if (this.isGym) oppName = "Líder de Ginásio";
            else if (this.isNPC && (this.opponent as any)._npcName) oppName = (this.opponent as any)._npcName;
            titleEl.innerHTML = `👁️ <span style="color:#ffd700;">Assistindo ${this.player.name} contra ${oppName}</span>`;
        } else {
            titleEl.innerText = this.battleTitle;
        }

        const actionsContainer = document.querySelector('.battle-actions') as HTMLElement;
        if (actionsContainer) {
            if (this.isPvP) {
                Array.from(actionsContainer.children).forEach((c: any) => c.style.display = 'none');
                let autoBtn = document.getElementById('btn-auto-pvp');
                if (!autoBtn) {
                    autoBtn = document.createElement('button');
                    autoBtn.id = 'btn-auto-pvp';
                    autoBtn.className = 'btn';
                    autoBtn.style.cssText = 'grid-column: span 2; background: #e74c3c; font-size: 1.2rem; padding: 15px;';
                    autoBtn.innerHTML = '⚔️ INICIAR BATALHA AUTOMÁTICA';
                    autoBtn.onclick = () => { autoBtn!.style.display = 'none'; this.startAutoPvP(); };
                    actionsContainer.appendChild(autoBtn);
                }
                autoBtn.style.display = 'block';

                const isMyBattle = Network.isOnline ? (this.player && this.player.id === Network.myPlayerId) : true;
                if (!isMyBattle) {
                    autoBtn.innerText = 'Aguardando oponente iniciar...';
                    (autoBtn as HTMLButtonElement).disabled = true;
                }
            } else {
                Array.from(actionsContainer.children).forEach((c: any) => {
                    if (c.id !== 'btn-auto-pvp') c.style.display = 'block';
                    else c.style.display = 'none';
                });
            }
        }

        this.updateButtons();
        this.updateUI();

        const scene = document.querySelector('.battle-scene') as HTMLElement;
        let bgImage = 'Default.jpg';
        switch (this.currentTerrain) {
            case 1: bgImage = 'BatalhaTerrenoGrama.png'; break;
            case 2: bgImage = 'BatalhaTerrenoAgua.png'; break;
            case 3: bgImage = 'BatalhaTerrenoAreia.png'; break;
            case 5: bgImage = 'BatalhaTerrenoGym.png'; break;
            default: bgImage = 'BatalhaTerrenoGrama.png'; break;
        }
        scene.style.backgroundImage = `url('/assets/img/Background/${bgImage}')`;
        scene.style.backgroundSize = 'cover';
        scene.style.backgroundPosition = 'center';
    }

    static calculateDamage(attacker: Pokemon, defender: Pokemon, isPlayerAttacking: boolean): { damage: number, msg: string, avoided: boolean, reflected: number } {
        let dodgeChance = (defender.speed - attacker.speed) / 5;
        dodgeChance = Math.max(10, dodgeChance);

        const ignoreDodge = (isPlayerAttacking && this.activeEffects.sniper);

        if (!ignoreDodge && Math.random() * 100 <= dodgeChance) {
            return { damage: 0, msg: "💨 ESQUIVOU!", avoided: true, reflected: 0 };
        }

        let blockChance = (defender.def - attacker.atk) / 5;
        blockChance = Math.max(0, Math.min(90, blockChance));

        if (Math.random() * 100 <= blockChance) {
            return { damage: 0, msg: "🛡️ BLOQUEIO TOTAL!", avoided: true, reflected: 0 };
        }

        const baseAtk = (attacker.atk * 0.65) + (attacker.speed * 0.15) + (attacker.maxHp * 0.2);
        let finalDamage = (baseAtk / 5) - (defender.def / 20);

        const attackerPlayer = isPlayerAttacking ? this.player! : (this.enemyPlayer || null);
        let masteryBonus = 0;

        if (attackerPlayer) {
            const m1 = this.getTypeMasteryBonus(attackerPlayer, attacker.type);
            const m2 = attacker.secondType ? this.getTypeMasteryBonus(attackerPlayer, attacker.secondType) : 0;
            masteryBonus = Math.max(m1, m2);
        }

        const masteryMultiplier = 1 + (masteryBonus / 100);
        finalDamage = Math.floor(finalDamage * masteryMultiplier);
        finalDamage = Math.max(1, finalDamage);

        let logDetails = "";

        const spdCritChance = attacker.speed / 8;
        if (Math.random() * 100 <= spdCritChance) {
            finalDamage += 5;
            logDetails += " ⚡Crit.Vel!";
        }

        const d6 = Math.floor(Math.random() * 6) + 1;
        let rollModifier = 0;
        if (d6 === 6) { rollModifier = +5; logDetails += " 🎲Crit!"; }
        else if (d6 === 5) rollModifier = +3;
        else if (d6 === 4) rollModifier = +2;
        else if (d6 === 2) rollModifier = -1;
        else if (d6 === 1) rollModifier = -2;
        finalDamage += rollModifier;

        const atkTypes = [attacker.type, attacker.secondType].filter(t => t);
        const defTypes = [defender.type, defender.secondType].filter(t => t);
        let bestMulti = 0;

        atkTypes.forEach(atkT => {
            let currentTypeMulti = 1;
            defTypes.forEach(defT => {
                let factor = 1;
                if (TYPE_CHART[atkT] && (TYPE_CHART[atkT] as any)[defT] !== undefined) {
                    const val = (TYPE_CHART[atkT] as any)[defT];
                    if (val > 1) factor = 1.75;
                    else if (val < 1) factor = 0.75;
                }
                currentTypeMulti *= factor;
            });
            if (currentTypeMulti > bestMulti) bestMulti = currentTypeMulti;
        });

        let finalMulti = bestMulti;
        const Game = (window as any).Game;
        const ev = Game.currentGlobalEvent?.id;
        let weatherSign = "";

        if (ev === 'DROUGHT') {
            if (atkTypes.includes('Fogo') || atkTypes.includes('Grama')) { finalMulti += 0.25; weatherSign = "[Sol☀️]"; }
            if (atkTypes.includes('Água')) { finalMulti -= 0.25; weatherSign = "[Sol🥵]"; }
        } else if (ev === 'RAIN') {
            if (atkTypes.includes('Água') || atkTypes.includes('Elétrico')) { finalMulti += 0.25; weatherSign = "[Chuva🌧️]"; }
            if (atkTypes.includes('Fogo')) { finalMulti -= 0.25; weatherSign = "[Chuva💧]"; }
        } else if (ev === 'WINTER_STORM') {
            if (atkTypes.includes('Gelo')) { finalMulti += 0.50; weatherSign = "[Gelo❄️]"; }
            else { finalMulti -= 0.20; weatherSign = "[Frio🧊]"; }
        } else if (ev === 'MYSTIC_AURA') {
            if (atkTypes.includes('Psíquico') || atkTypes.includes('Fada')) { finalMulti += 0.50; weatherSign = "[Mistíco✨]"; }
        } else if (ev === 'BLOOD_MOON') {
            if (atkTypes.includes('Fantasma') || atkTypes.includes('Noturno')) { finalMulti += 0.20; weatherSign = "[Lua🌑]"; }
        } else if (ev === 'BERSERK_MODE') {
            finalMulti *= 2.0;
            weatherSign = "[💢BERSERK!]";
        }

        finalDamage = Math.floor(finalDamage * finalMulti);

        if (finalMulti >= 1.5) logDetails += " 🔥!";
        else if (finalMulti > 1.0) logDetails += " ⚔️";
        else if (finalMulti < 1.0) logDetails += " 🛡️.";
        logDetails += weatherSign;

        finalDamage = Math.max(0, Math.floor(finalDamage));

        if (isPlayerAttacking) {
            if (this.activeEffects.crit > 0) {
                finalDamage *= 2;
                this.activeEffects.crit--;
                logDetails += ` [2x] (Restam: ${this.activeEffects.crit})`;
            }
            if (this.activeEffects.focus) { finalDamage *= 4; this.activeEffects.focus = false; logDetails += " [4x]"; }
            if (this.player?.effects.curse && this.isGym) {
                finalDamage = Math.floor(finalDamage / 2);
                logDetails += " [😈Amaldiçoado]";
            }
        } else {
            if (this.activeEffects.guard) { finalDamage = Math.floor(finalDamage / 2); logDetails += " [🛡️]"; }
            if (this.enemyPlayer && this.enemyPlayer.effects.curse) { finalDamage = Math.floor(finalDamage / 2); }
        }

        let reflectedAmount = 0;

        if (ev === 'SOUL_LINK') {
            reflectedAmount = Math.floor(finalDamage * 0.3);
            logDetails += " [🔗LINK!]";
        }

        if (defender.def > (attacker.atk * 1.5)) {
            if (Math.random() * 100 <= 15) {
                reflectedAmount += finalDamage;
                logDetails += " 🔄REFLETIDO!";
            }
        }

        return { damage: finalDamage, msg: `(🎲${d6})${logDetails}`, avoided: false, reflected: reflectedAmount };
    }

    static attack() {
        const Network = (window as any).Network;
        if (Network.isOnline && this.player && this.player.id !== Network.myPlayerId) return;

        if (!this.active || !this.activeMon || !this.opponent) return;

        this.processingAction = true;
        this.updateButtons();

        const playerSpeed = this.activeMon.speed;
        const enemySpeed = this.opponent.speed;
        let playerGoesFirst = true;

        if (playerSpeed > enemySpeed) playerGoesFirst = true;
        else if (enemySpeed > playerSpeed) playerGoesFirst = false;
        else playerGoesFirst = Math.random() > 0.5;

        this.logBattle(`Velocidade: ${this.activeMon.name}(${playerSpeed}) vs ${this.opponent.name}(${enemySpeed})`, true);

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
                    this.logBattle("🤢 O Nevoeiro Tóxico sufoca os Pokémons em campo!", true);
                    this.updateUI();
                }
            }

            this.processingAction = false;
            this.updateButtons();

            if (this.isPvP && Network.isOnline) {
                Network.syncPlayerState();
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
            this.logBattle(`💨 ${this.activeMon.name} é mais rápido!`, true);

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
            this.logBattle(`💨 ${this.opponent.name} é mais rápido!`, true);

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
        const Network = (window as any).Network;
        if (!this.activeMon || !this.opponent) return;

        if (Game.currentGlobalEvent?.id === 'WINTER_STORM') {
            if (!this.activeMon.type.includes('Gelo') && (!this.activeMon.secondType || !this.activeMon.secondType.includes('Gelo'))) {
                if (Math.random() < 0.15) {
                    this.logBattle(`❄️ ${this.activeMon.name} congelou na nevasca e não conseguiu atacar!`, true);
                    if (callback) callback();
                    return;
                }
            }
        }

        let calc1 = this.calculateDamage(this.activeMon!, this.opponent!, true);
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
                let calc2 = this.calculateDamage(this.activeMon!, this.opponent!, true);

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
            logMsg += ` (Sofreu ${totalReflected} de volta!)`;
        }

        logMsg += ` HP final ${this.opponent.currentHp}/${this.opponent.maxHp}.`;
        this.logBattle(logMsg);
        this.updateUI();

        if (Network.isOnline) {
            Network.sendAction('BATTLE_UPDATE', {
                plyHp: this.activeMon!.currentHp,
                oppHp: this.opponent!.currentHp,
                msg: logMsg
            });
            if (this.isPvP && this.enemyPlayer) {
                Network.sendAction('PVP_SYNC_DAMAGE', { targetId: this.enemyPlayer.id, team: this.enemyPlayer.team, gold: this.enemyPlayer.gold });
            }
        }

        if (this.opponent.currentHp <= 0) {
            const oppStats = this.opponent.maxHp + this.opponent.atk + this.opponent.def + this.opponent.speed;
            const xpGain = Math.max(1, Math.floor(oppStats / 9));
            this.activeMon.gainXp(xpGain, this.player!);

            this.updateUI();
            if (Network.isOnline) Network.syncPlayerState();
            setTimeout(() => { this.checkWinCondition(); }, 1000);
        }
        else if (this.activeMon.currentHp <= 0) {
            this.updateUI();
            if (Network.isOnline) Network.syncPlayerState();
            setTimeout(() => { this.handleFaint(); }, 1000);
        }
        else {
            if (callback) callback();
        }
    }

    static performEnemyAttack(callback?: () => void) {
        const Game = (window as any).Game;
        const Network = (window as any).Network;
        if (!this.activeMon || !this.opponent) return;

        if (this.activeEffects.stunOpponent && this.activeEffects.stunOpponent > 0) {
            this.activeEffects.stunOpponent--;
            const turnsLeft = this.activeEffects.stunOpponent;
            const msg = `⚡ ${this.opponent.name} está atordoado e não consegue atacar!${turnsLeft > 0 ? ` (Restam ${turnsLeft} turnos)` : ""}`;

            this.logBattle(msg, true);

            if (callback) callback();
            return;
        }

        if (Game.currentGlobalEvent?.id === 'WINTER_STORM') {
            if (!this.opponent.type.includes('Gelo') && (!this.opponent.secondType || !this.opponent.secondType.includes('Gelo'))) {
                if (Math.random() < 0.15) {
                    this.logBattle(`❄️ ${this.opponent.name} (Inimigo) congelou na nevasca!`, true);
                    if (callback) callback();
                    return;
                }
            }
        }

        let calc1 = this.calculateDamage(this.opponent!, this.activeMon!, false);
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
                let calc2 = this.calculateDamage(this.opponent!, this.activeMon!, false);
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

        if (totalReflected > 0) {
            this.opponent.currentHp = Math.max(0, this.opponent.currentHp - totalReflected);
            logMsg += ` (Sofreu ${totalReflected} de volta!)`;
        }

        logMsg += ` HP final ${this.activeMon.currentHp}/${this.activeMon.maxHp}.`;
        this.logBattle(logMsg);
        this.updateUI();

        if (this.activeEffects.counter && this.activeEffects.counter > 0) {
            const reflect = Math.floor(totalDmg * 0.5);
            if (reflect > 0) {
                this.opponent.currentHp = Math.max(0, this.opponent.currentHp - reflect);
                this.logBattle(`🔁 Contra-ataque! Inimigo sofreu ${reflect} de dano.`);
                this.activeEffects.counter--;
                this.updateUI();
                if (this.isPvP && this.enemyPlayer && Network.isOnline) {
                    Network.syncSpecificPlayer(this.enemyPlayer.id);
                }
            }
        }

        if (Network.isOnline) {
            Network.sendAction('BATTLE_UPDATE', { plyHp: this.activeMon.currentHp, oppHp: this.opponent.currentHp, msg: logMsg });
            Network.syncPlayerState();
        }

        if (this.activeMon.currentHp <= 0) {
            if (this.isPvP && this.enemyPlayer) {
                const plyStats = this.activeMon.maxHp + this.activeMon.atk + this.activeMon.def + this.activeMon.speed;
                const oppXpGain = Math.max(1, Math.floor(plyStats / 9));
                this.opponent.gainXp(oppXpGain, this.enemyPlayer);
                if (Network.isOnline) Network.syncSpecificPlayer(this.enemyPlayer.id);
            }

            this.updateUI();
            if (Network.isOnline) Network.syncPlayerState();
            setTimeout(() => { this.handleFaint(); }, 1000);
        }
        else if (this.opponent.currentHp <= 0) {
            const oppStats = this.opponent.maxHp + this.opponent.atk + this.opponent.def + this.opponent.speed;
            const xpGain = Math.max(1, Math.floor(oppStats / 9));
            this.activeMon.gainXp(xpGain, this.player!);

            this.updateUI();
            if (Network.isOnline) Network.syncPlayerState();
            setTimeout(() => { this.checkWinCondition(); }, 1000);
        }
        else {
            this.tryTriggerMegaEvolution("reagiu após o ataque");
            this.tryOpponentMegaEvolution("reagiu após o ataque");

            if (callback) callback();
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
                    this.logBattle("🧬 A Mega Evolução inimiga foi derrotada, mas o Pokémon original retornou e continua a lutar!");
                } else {
                    this.logBattle("🧬 O Mew inimigo foi derrotado, mas o Pokémon original retornou e continua a lutar!");
                }
                this.updateUI();
                this.processingAction = false;
                this.updateButtons();
                const Network = (window as any).Network;
                if (Network.isOnline && this.isPvP && this.enemyPlayer) {
                    Network.syncSpecificPlayer(this.enemyPlayer.id);
                }

                if (this.activeEffects.stunOpponent) {
                    this.activeEffects.stunOpponent = 0;
                }

                if (this.isPvP) {
                    setTimeout(() => this.autoAttackNext(), 1500);
                }
                return;
            } else {
                this.logBattle("🧬 A transformação inimiga desfez após a derrota!");
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

            if (this.activeEffects.stunOpponent) {
                this.activeEffects.stunOpponent = 0;
            }

            this.logBattle(`Rival enviou ${nextOpp.name}!`, true);
            this.updateUI();
            this.processingAction = false;
            this.updateButtons();

            const Network = (window as any).Network;
            if (Network.isOnline && this.player && this.player.id === Network.myPlayerId) {
                const sanitizedNextOpp = Network.getSanitizedTeam([nextOpp])[0];
                Network.sendAction('BATTLE_OPP_SWITCH', { nextOpp: sanitizedNextOpp });
            }

            if (this.isPvP) {
                setTimeout(() => this.autoAttackNext(), 2000);
            }
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

            if (isMega) {
                this.logBattle("🧬 A Mega Evolução não resistiu e o Pokémon original retornou à batalha!");
            } else {
                this.logBattle("🧬 O Mew aliado foi derrotado e o Pokémon original retornou à batalha!");
            }

            this.revertMew();

            this.updateUI();
            if (this.activeMon.currentHp <= 0) { }
            else {
                this.processingAction = false;
                this.updateButtons();
                const Network = (window as any).Network;
                if (Network.isOnline) Network.syncPlayerState();

                if (this.isPvP) {
                    setTimeout(() => this.autoAttackNext(), 1500);
                }
                return;
            }
        }
        const nextPly = this.plyTeamList.find(p => !p.isFainted());
        if (nextPly) {
            this.logBattle(`${this.activeMon!.name} desmaiou!`, true);

            if (this.isPvP) {
                this.activeMon = nextPly;
                this.logBattle(`Você enviou ${nextPly.name}!`, true);
                this.updateUI();

                const Network = (window as any).Network;
                if (Network.isOnline && this.player && this.player.id === Network.myPlayerId) {
                    const sanitizedNextPly = Network.getSanitizedTeam([nextPly])[0];
                    Network.sendAction('BATTLE_PLY_SWITCH', { nextPly: sanitizedNextPly });
                }

                setTimeout(() => this.autoAttackNext(), 2000);
            } else {
                document.getElementById('battle-modal')!.style.display = 'none';
                this.openSelectionModal("Escolha o próximo!");
            }
        }
        else { this.lose(); }
    }

    static logBattle(msg: string, sync: boolean = false) {
        const Game = (window as any).Game;
        const el = document.getElementById('battle-msg');
        if (el) el.innerText = msg;

        const logContainer = document.getElementById('battle-log-history');
        if (logContainer) {
            logContainer.insertAdjacentHTML('afterbegin', `<div style="border-bottom:1px solid #555; padding:2px;">${msg}</div>`);
            logContainer.scrollTop = 0;
        }

        Game.log(`[Batalha] ${msg}`);

        if (sync) {
            const Network = (window as any).Network;
            if (Network.isOnline && this.player && this.player.id === Network.myPlayerId) {
                Network.sendAction('BATTLE_UPDATE', { msg: msg });
            }
        }
    }

    static getHpColor(current: number, max: number) { const pct = (current / max) * 100; if (pct >= 60) return 'hp-green'; if (pct >= 15) return 'hp-yellow'; return 'hp-red'; }

    static updateUI() {
        if (!this.activeMon || !this.opponent) return;
        if (!this.player) return;

        document.getElementById('ply-name')!.innerText = this.activeMon.name;

        const plyTypesEl = document.getElementById('ply-types');
        if (plyTypesEl && typeof this.activeMon.getTypeBadgesHTML === 'function') {
            plyTypesEl.innerHTML = this.activeMon.getTypeBadgesHTML('flex-start');
        }

        const plyXpEl = document.getElementById('ply-xp');
        if (plyXpEl) {
            plyXpEl.style.width = `${(this.activeMon.currentXp / this.activeMon.maxXp) * 100}%`;
        }

        document.getElementById('ply-lvl')!.innerText = `Lv.${this.activeMon.level}`;
        (document.getElementById('ply-img') as HTMLImageElement).src = this.activeMon.getSprite();

        const plyPct = (this.activeMon.currentHp / this.activeMon.maxHp) * 100;
        const plyBar = document.getElementById('ply-hp')!;
        plyBar.style.width = plyPct + "%";
        plyBar.className = `hp-fill ${this.getHpColor(this.activeMon.currentHp, this.activeMon.maxHp)}`;
        document.getElementById('ply-hp-text')!.innerText = `${this.activeMon.currentHp}/${this.activeMon.maxHp}`;
        (document.getElementById('ply-trainer-img') as HTMLImageElement).src = this.player.avatar;
        document.getElementById('ply-shiny-tag')!.style.display = this.activeMon.isShiny ? 'inline-block' : 'none';
        document.getElementById('ply-stats')!.innerHTML = `<span>⚔️${this.activeMon.atk}</span> <span>🛡️${this.activeMon.def}</span> <span>💨${this.activeMon.speed}</span>`;

        document.getElementById('opp-name')!.innerText = this.opponent.name;
        document.getElementById('opp-lvl')!.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center;">
                <span>Lv.${this.opponent.level}</span>
                <button class="btn btn-mini" style="font-size:0.7rem; padding:1px 5px; margin-left:6px; background-color:#3498db; border:none; border-radius:4px; color:white; cursor:pointer;" onclick="window.Game.openPokedexEntry(${this.opponent.id})" title="Ver na Pokédex">📖</button>
            </div>
        `;

        const oppTypesEl = document.getElementById('opp-types');
        if (oppTypesEl && typeof this.opponent.getTypeBadgesHTML === 'function') {
            oppTypesEl.innerHTML = this.opponent.getTypeBadgesHTML('flex-start');
        }

        (document.getElementById('opp-img') as HTMLImageElement).src = this.opponent.getSprite();
        const oppPct = (this.opponent.currentHp / this.opponent.maxHp) * 100;

        const oppBar = document.getElementById('opp-hp')!;
        oppBar.style.width = oppPct + "%";
        oppBar.className = `hp-fill ${this.getHpColor(this.opponent.currentHp, this.opponent.maxHp)}`;
        document.getElementById('opp-hp-text')!.innerText = `${this.opponent.currentHp}/${this.opponent.maxHp}`;
        document.getElementById('opp-shiny-tag')!.style.display = this.opponent.isShiny ? 'inline-block' : 'none';
        document.getElementById('opp-stats')!.innerHTML = `<span>⚔️${this.opponent.atk}</span> <span>🛡️${this.opponent.def}</span> <span>💨${this.opponent.speed}</span>`;

        const oppTrainer = document.getElementById('opp-trainer-img') as HTMLImageElement;
        if (this.isPvP && this.enemyPlayer) {
            oppTrainer.src = this.enemyPlayer.avatar;
            oppTrainer.style.display = 'block';
        }
        else if (this.isGym) {
            const Game = (window as any).Game;
            const actualGymId = Game.activeGyms ? Game.activeGyms[this.gymId - 1] : this.gymId;
            const gData = GYM_DATA.find(g => g.id === actualGymId);

            if (gData) oppTrainer.src = `/assets/img/LideresGym/${gData.leaderImg}`;
            oppTrainer.style.display = 'block';
        }
        else if (this.isNPC) {
            const npcImg = (this.opponent as any)._npcImage;
            if (npcImg) {
                oppTrainer.src = npcImg;
                oppTrainer.style.display = 'block';
            }
            else {
                oppTrainer.src = '/assets/img/Treinadores/Red.jpg'; oppTrainer.style.display = 'block';
            }
        }
        else {
            oppTrainer.style.display = 'none';
        }

        if (!this.isNPC && !this.isGym && !this.isPvP) {
            document.getElementById('ply-team-indicator')!.innerHTML = '';
            document.getElementById('opp-team-indicator')!.innerHTML = '';
        }
        else {
            this.renderTeamIcons('ply-team-indicator', this.plyTeamList);
            this.renderTeamIcons('opp-team-indicator', this.oppTeamList);
        }
    }

    static renderTeamIcons(elId: string, list: Pokemon[]) { document.getElementById(elId)!.innerHTML = list.map(p => `<div class="ball-icon ${p.isFainted() ? 'lost' : ''}"></div>`).join(''); }

    static revertMew() {
        if (this.activeEffects && this.activeEffects.mewOriginal && this.player) {
            const original = this.activeEffects.mewOriginal;

            const tempIndex = this.player.team.findIndex(p => (p as any).isTemp || p.isMegaEvolution);

            if (tempIndex !== -1) {
                this.player.team[tempIndex] = original;
            } else if (this.activeEffects.mewIndex !== undefined && this.player.team[this.activeEffects.mewIndex]) {
                this.player.team[this.activeEffects.mewIndex] = original;
            }

            const plyListIdx = this.plyTeamList.findIndex(p => (p as any).isTemp || (p as any).isMegaEvolution);
            if (plyListIdx !== -1) {
                this.plyTeamList[plyListIdx] = original;
            }

            if (this.activeMon && ((this.activeMon as any).isTemp || this.activeMon.isMegaEvolution)) {
                this.activeMon = original;
            }

            this.activeEffects.mewOriginal = null;
        }

        if (this.player) {
            this.player.team = this.player.team.filter(p => !(p as any).isTemp);

            this.player.team.forEach(mon => {
                if (typeof mon.validateAndFix === 'function') {
                    mon.validateAndFix();
                }
            });
        }
    }

    static performMegaEvolution(megaId: number) {
        const Network = (window as any).Network;

        const megaData = POKEDEX.find((p: any) => p.id === megaId);

        if (!megaData) {
            console.error(`ERRO CRÍTICO: Mega ID ${megaId} não encontrado na Pokedex.`);
            return alert("Dados da Mega Evolução não encontrados! Verifique o arquivo pokedex.ts");
        }

        this.activeEffects.mewOriginal = this.player!.team[this.player!.team.indexOf(this.activeMon!)];
        this.activeEffects.mewIndex = this.player!.team.indexOf(this.activeMon!);

        const PokemonClass = (window as any).Pokemon || this.activeMon!.constructor;
        // CRÍTICO: Instancia com o ID original para evitar a interceptação do construtor
        const megaMon = new PokemonClass(this.activeMon!.id, this.activeMon!.level, this.activeMon!.isShiny);

        // Copia os status treinados do original
        megaMon.ivs = { ...this.activeMon!.ivs };
        megaMon.bonusStats = { ...this.activeMon!.bonusStats };
        megaMon.currentXp = this.activeMon!.currentXp;
        megaMon.maxXp = this.activeMon!.maxXp;

        // Injeta manualmente os dados da Pokedex da Mega Evolução
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
        if (plyListIdx !== -1) {
            this.plyTeamList[plyListIdx] = megaMon;
        } else {
            const activeIndex = this.plyTeamList.findIndex(p => p === this.activeEffects.mewOriginal);
            if (activeIndex !== -1) {
                this.plyTeamList[activeIndex] = megaMon;
            }
        }

        this.logBattle(`💎 O elo fortaleceu! Mega Evolução para ${megaMon.name}!`, true);
        this.updateUI();

        if (Network.isOnline) {
            Network.syncPlayerState();
            Network.sendAction('BATTLE_PLY_SWITCH', {
                nextPly: Network.getSanitizedTeam([megaMon])[0]
            });
        }
    }

    static performOpponentMegaEvolution(megaId: number) {
        const Network = (window as any).Network;
        const megaData = POKEDEX.find((p: any) => p.id === megaId);
        if (!megaData) return;

        if (!this.activeEffects) this.activeEffects = {};

        // Tratamento seguro para salvar o Pokémon original. Em PvE o enemyPlayer é inexistente.
        this.activeEffects.opponentMewOriginal = this.opponent;
        if (this.enemyPlayer) {
            this.activeEffects.opponentMewIndex = this.enemyPlayer.team.indexOf(this.opponent!);
        }

        const PokemonClass = (window as any).Pokemon || this.opponent!.constructor;
        // CRÍTICO: Instancia com o ID original para evitar a interceptação do construtor
        const megaMon = new PokemonClass(this.opponent!.id, this.opponent!.level, this.opponent!.isShiny);

        // Copia os status treinados do original (Líderes tem IVs altos)
        megaMon.ivs = { ...this.opponent!.ivs };
        megaMon.bonusStats = { ...this.opponent!.bonusStats };
        megaMon.currentXp = this.opponent!.currentXp;
        megaMon.maxXp = this.opponent!.maxXp;

        // Injeta manualmente os dados da Pokedex da Mega Evolução
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

        // Substitui apenas no array do adversário real, se for PvP
        if (this.enemyPlayer && this.activeEffects.opponentMewIndex !== undefined && this.activeEffects.opponentMewIndex !== -1) {
            this.enemyPlayer.team[this.activeEffects.opponentMewIndex] = megaMon;
        }

        // Substitui a referência visual para as bolinhas não quebrarem e a luta seguir
        const oppListIdx = this.oppTeamList.findIndex(p => p.id === this.activeEffects.opponentMewOriginal.id);
        if (oppListIdx !== -1) {
            this.oppTeamList[oppListIdx] = megaMon;
        } else {
            const activeIndex = this.oppTeamList.findIndex(p => p === this.activeEffects.opponentMewOriginal);
            if (activeIndex !== -1) this.oppTeamList[activeIndex] = megaMon;
        }

        this.logBattle(`💎 O elo inimigo fortaleceu! Mega Evolução para ${megaMon.name}!`, true);
        this.updateUI();

        // Envia o novo oponente na tela para todo o mundo assistir (No online)
        if (Network.isOnline) {
            if (this.isPvP && this.enemyPlayer) {
                Network.syncSpecificPlayer(this.enemyPlayer.id);
            } else if (!this.isPvP) {
                Network.sendAction('BATTLE_OPP_SWITCH', { nextOpp: Network.getSanitizedTeam([megaMon])[0] });
            }
        }
    }

    static revertOpponentMew() {
        if (this.activeEffects && this.activeEffects.opponentMewOriginal) {
            const original = this.activeEffects.opponentMewOriginal;

            if (this.enemyPlayer) {
                const tempIndex = this.enemyPlayer.team.findIndex(p => (p as any).isTemp || p.isMegaEvolution);
                if (tempIndex !== -1) {
                    this.enemyPlayer.team[tempIndex] = original;
                } else if (this.activeEffects.opponentMewIndex !== undefined && this.enemyPlayer.team[this.activeEffects.opponentMewIndex]) {
                    this.enemyPlayer.team[this.activeEffects.opponentMewIndex] = original;
                }
            }

            const oppListIdx = this.oppTeamList.findIndex(p => (p as any).isTemp || (p as any).isMegaEvolution);
            if (oppListIdx !== -1) {
                this.oppTeamList[oppListIdx] = original;
            }

            if (this.opponent && ((this.opponent as any).isTemp || (this.opponent as any).isMegaEvolution)) {
                this.opponent = original;
            }

            this.activeEffects.opponentMewOriginal = null;
        }

        if (this.enemyPlayer) {
            this.enemyPlayer.team = this.enemyPlayer.team.filter(p => !(p as any).isTemp);
            this.enemyPlayer.team.forEach(mon => {
                if (typeof mon.validateAndFix === 'function') mon.validateAndFix();
            });
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

    static getTypeMasteryBonus(player: Player, targetType: string): number {
        if (!player.pokedexData) return 0;

        if (!(this as any)._masteryCache) (this as any)._masteryCache = {};
        const cacheKey = `${player.id}_${targetType}`;

        let killCount = 0;

        POKEDEX.forEach((dexEntry: any) => {
            if (dexEntry.type === targetType || dexEntry.secondType === targetType) {
                const entry = player.pokedexData[dexEntry.id];
                if (entry && entry.defeated) {
                    killCount += entry.defeated;
                }
            }
        });

        const bonus = killCount;

        (this as any)._masteryCache[cacheKey] = bonus;
        return bonus;
    }

    static win() {
        const Game = (window as any).Game;
        const Network = (window as any).Network;
        const Cards = (window as any).Cards;

        if (this.isChampion) {
            Game.sendGlobalLog(`🎉 INACREDITÁVEL! ${this.player!.name} DERROTOU O CAMPEÃO E VENCEU O JOGO! 🎉`);

            if (Network && Network.isOnline) {
                Network.saveGlobalChampion(this.player!);
                Network.sendAction('GAME_WIN', { winnerId: this.player!.id });
            }

            this.end(false);
            Game.triggerVictory(this.player!.id);
            return;
        }

        if (Network.isOnline && this.isPvP && Network.myPlayerId === this.enemyPlayer?.id) return;

        if (this.isGym) this.player!.effects.curse = false;
        this.revertMew();
        let gain = 0; let msg = "VITÓRIA! ";

        const stealTargetId = (this.activeEffects.stealBadgeFrom !== undefined && this.activeEffects.stealBadgeFrom !== null)
            ? Number(this.activeEffects.stealBadgeFrom)
            : -1;

        const enemyId = this.enemyPlayer ? Number(this.enemyPlayer.id) : -2;

        if (this.isPvP && this.enemyPlayer && stealTargetId === enemyId) {
            console.log("🔍 [DEBUG] Iniciando lógica Novo Líder contra ID:", enemyId);

            const realWinner = Game.players.find((p: any) => p.id === this.player!.id);
            const realLoser = Game.players.find((p: any) => p.id === this.enemyPlayer!.id);

            if (realWinner && realLoser) {
                const validBadges: number[] = [];

                for (let i = 0; i < 8; i++) {
                    if (realLoser.badges[i] === true && realWinner.badges[i] === false) {
                        validBadges.push(i);
                    }
                }

                console.log("🔍 [DEBUG] Valid badges indices:", validBadges);

                if (validBadges.length > 0) {
                    const stolenBadgeIdx = validBadges[Math.floor(Math.random() * validBadges.length)];
                    console.log("🔍 [DEBUG] Stolen badge Index:", stolenBadgeIdx);

                    realWinner.badges[stolenBadgeIdx] = true;
                    realLoser.badges[stolenBadgeIdx] = false;

                    if (this.player) this.player.badges[stolenBadgeIdx] = true;
                    if (this.enemyPlayer) this.enemyPlayer.badges[stolenBadgeIdx] = false;

                    msg += ` Roubou a Insígnia ${stolenBadgeIdx + 1}!`;

                    if (Network.isOnline) {
                        const updates: any = {};
                        const playersPath = `rooms/${Network.currentRoomId}/players`;

                        updates[`${playersPath}/${realWinner.id}/badges/${stolenBadgeIdx}`] = true;
                        updates[`${playersPath}/${realLoser.id}/badges/${stolenBadgeIdx}`] = false;

                        console.log("🔍 [DEBUG] Updates object:", updates);

                        update(ref(db), updates).then(() => {
                            console.log(`✅ [FIREBASE] Insígnia ${stolenBadgeIdx + 1} transferida com sucesso.`);
                        }).catch((err) => {
                            console.error("❌ [FIREBASE] Erro ao salvar insígnia:", err);
                        });
                    }
                } else {
                    console.log("🔍 [DEBUG] Nenhuma insígnia roubável encontrada.");
                    msg += ` (Inimigo não tinha insígnias novas)`;
                }
            }
        }

        if (this.activeEffects.destiny) {
            this.player!.gold += 500;
            if (Cards) {
                Cards.draw(this.player!);
                Cards.draw(this.player!);
            }
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

            if (Network.isOnline) {
                Network.sendAction('PVP_SYNC_DAMAGE', {
                    targetId: this.enemyPlayer.id,
                    team: this.enemyPlayer.team,
                    gold: this.enemyPlayer.gold,
                    badges: this.enemyPlayer.badges,
                    resetPos: true,
                    skipTurn: true
                });
            }
        } else if (this.isGym) {
            gain = (Game.currentGlobalEvent?.id === 'GOLD_RUSH') ? 2000 : 1000;
            Game.sendGlobalLog(`💰 [Extrato] ${this.player!.name} recebeu +${gain}G (Líder de Ginásio).`);
            if (!this.player!.badges[this.gymId - 1]) { this.player!.badges[this.gymId - 1] = true; msg += ` Insígnia ${this.gymId}!`; }

            if (Game.currentGlobalEvent?.id === 'GYM_RUSH' && Cards) {
                Cards.draw(this.player!);
                msg += ` e ganhou 1 Carta do Desafio!`;
            }
        } else if (this.isNPC) {
            gain = (Game.currentGlobalEvent?.id === 'GOLD_RUSH') ? this.reward * 2 : this.reward;
            Game.sendGlobalLog(`💰 [Extrato] ${this.player!.name} recebeu +${gain}G (Treinador NPC).`);
            const drawCount = (Game.currentGlobalEvent?.id === 'CARD_FESTIVAL') ? 2 : 1;
            if (Cards) {
                for (let i = 0; i < drawCount; i++) Cards.draw(this.player!);
            }
            msg += ` e ganhou ${drawCount > 1 ? 'Cartas' : 'uma Carta'}!`;
        }
        else {
            gain = (Game.currentGlobalEvent?.id === 'GOLD_RUSH') ? 300 : 150;
            Game.sendGlobalLog(`💰 [Extrato] ${this.player!.name} recebeu +${gain}G (Pokémon Selvagem).`);

            const cardChance = (Game.currentGlobalEvent?.id === 'CARD_FESTIVAL') ? 0.50 : 0.25;
            if (Math.random() <= cardChance) {
                const drawCount = (Game.currentGlobalEvent?.id === 'CARD_FESTIVAL') ? 2 : 1;
                if (Cards) {
                    for (let i = 0; i < drawCount; i++) Cards.draw(this.player!);
                }
                msg += ` e achou ${drawCount > 1 ? 'Cartas' : 'uma Carta'}!`;
            }

            if (this.opponent) {
                const oppId = this.opponent.id;
                if (!this.player!.pokedexData) this.player!.pokedexData = {};
                if (!this.player!.pokedexData[oppId]) {
                    this.player!.pokedexData[oppId] = { seen: 0, caught: 0, defeated: 0 };
                }
                this.player!.pokedexData[oppId].seen += 1;
                this.player!.pokedexData[oppId].defeated += 1;
            }
        }

        this.player!.gold += gain;
        Game.sendGlobalLog(`💰 [Extrato] Novo Saldo de ${this.player!.name}: ${this.player!.gold}G.`);

        if (Network.isOnline) {
            Network.syncPlayerState();

            if (this.isPvP && this.enemyPlayer) {
                Network.sendAction('PVP_SYNC_DAMAGE', {
                    targetId: this.enemyPlayer.id,
                    team: this.enemyPlayer.team,
                    gold: this.enemyPlayer.gold,
                    badges: this.enemyPlayer.badges,
                    resetPos: true,
                    skipTurn: true
                });
            }
        }

        setTimeout(() => {
            this.logBattle(`🏆 ${msg}`, true);
            setTimeout(() => {
                Game.sendGlobalLog(`${this.player?.name} venceu! ${msg}`);
            }, 200);
        }, 500);

        setTimeout(() => this.end(false), 2500);
    }

    static lose() {
        const Game = (window as any).Game;
        const Network = (window as any).Network;
        if (this.isGym) this.player!.effects.curse = false;
        this.revertMew();
        let msg = "DERROTA... ";

        if (!this.isPvP && !this.isGym && !this.isNPC && this.opponent) {
            const oppId = this.opponent.id;

            if (!this.player!.pokedexData) this.player!.pokedexData = {};

            if (!this.player!.pokedexData[oppId]) {
                this.player!.pokedexData[oppId] = { seen: 0, caught: 0, defeated: 0 };
            }
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

            if (Network.isOnline) {
                const NetworkObj = (window as any).Network;
                if (NetworkObj.syncPlayers) {
                    NetworkObj.syncPlayers([this.player!.id, this.enemyPlayer.id]);
                } else {
                    NetworkObj.syncPlayerState();
                    NetworkObj.syncSpecificPlayer(this.enemyPlayer.id);
                }

                Network.sendAction('PVP_SYNC_DAMAGE', {
                    targetId: this.enemyPlayer.id,
                    team: this.enemyPlayer.team,
                    gold: this.enemyPlayer.gold,
                    badges: this.enemyPlayer.badges,
                    resetPos: false,
                    skipTurn: false
                });
            }

        } else {
            if (!this.isGym && Game.currentGlobalEvent?.id === 'ROCKET') {
                if (this.player!.team.length > 3) {
                    const stolenIdx = Math.floor(Math.random() * this.player!.team.length);
                    const stolenMon = this.player!.team.splice(stolenIdx, 1)[0];
                    Game.sendGlobalLog(`🚀 INVASÃO ROCKET! Eles emboscaram e roubararam o ${stolenMon.name} de ${this.player!.name}!!`);
                    msg += ` e a Rocket te roubou!`;
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

            if (Network.isOnline) {
                Network.syncPlayerState();
            }
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

        if (this.isPvP && this.enemyPlayer) {
            msg += ` ${this.enemyPlayer.name} venceu!`;
        }

        if (Network.isOnline) {
            Network.syncPlayerState();
        }

        setTimeout(() => {
            this.logBattle(`💀 ${msg}`, true);

            setTimeout(() => {
                Game.sendGlobalLog(`${this.player?.name} perdeu e recuou para o último Centro Pokémon!`);
            }, 200);
        }, 500);

        setTimeout(() => { this.end(false); Game.moveVisuals(); }, 2500);
    }

    static end(isRemote: boolean) {
        this.revertMew();
        const Game = (window as any).Game;
        const Network = (window as any).Network;
        this.active = false;
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
            if (Network.isOnline) Network.sendAction('BATTLE_END', {}); Game.nextTurn();
        }
    }

    static useCard(cardId: string) {
        if (this.cardsUsedThisBattle >= 3) {
            alert("🚫 Você já usou o limite máximo de 3 cartas nesta batalha!");
            return;
        }

        const Network = (window as any).Network;
        const Game = (window as any).Game;

        if (this.isPvP && this.enemyPlayer) {
            const enemyHasJam = this.enemyPlayer.cards.findIndex((c: any) => c.id === 'jam');

            if (enemyHasJam > -1) {
                this.cardsUsedThisBattle++;
                this.enemyPlayer.cards.splice(enemyHasJam, 1);

                const myCardIdx = this.player!.cards.findIndex((c: any) => c.id === cardId);
                let cardName = "uma carta";
                if (myCardIdx > -1) {
                    cardName = this.player!.cards[myCardIdx].name;
                    this.player!.cards.splice(myCardIdx, 1);
                }

                document.getElementById('battle-cards-modal')!.style.display = 'none';

                Game.updateHUD();

                const jamMsg = `📡 INTERFERÊNCIA!\n\n${this.enemyPlayer.name} anulou a carta ${cardName} de ${this.player?.name} automaticamente!`;
                Game.sendGlobalLog(`📡 ${this.enemyPlayer.name} usou Interferência contra ${this.player?.name} e bloqueou a carta [${cardName}]!`);
                Game.showGlobalAlert(jamMsg, this.player!.name, true, false);

                if (Network.isOnline) {
                    Network.syncPlayers([this.player!.id, this.enemyPlayer.id]);
                    Network.sendAction('SHOW_ALERT', { msg: jamMsg, playerName: this.player!.name, endsTurn: false });
                }
                return;
            }
        }

        this.cardsUsedThisBattle++;
        Cards.activate(cardId);
    }

    static openBag() {
        if (!this.isPlayerTurn || this.processingAction)
            return;

        if (this.isGym && this.player!.effects.curse) {
            const Game = (window as any).Game;
            Game.showGlobalAlert("😈 Sua mochila foi selada pela Maldição! Você não pode usar itens nesta Batalha de Ginásio!", this.player!.name, true, false);
            return;
        }

        const isMegaOrMew = (!this.isPvP && this.activeMon && ((this.activeMon as any).isTemp || (this.activeMon as any).isMegaEvolution));

        const list = document.getElementById('battle-bag-list')!;
        list.innerHTML = '';
        Object.keys(this.player!.items).forEach(key => {
            if (this.player!.items[key] > 0) {
                const item = SHOP_ITEMS.find(i => i.id === key);
                if (item) {
                    if (isMegaOrMew && item.type !== 'capture') return;

                    const btn = document.createElement('button');
                    btn.className = 'btn';
                    btn.innerHTML = `<img src="/assets/img/Itens/${item.icon}" class="item-icon-mini"> ${item.name} x${this.player!.items[key]}`;
                    btn.onclick = () => this.useItem(key, item);
                    list.appendChild(btn);
                }
            }
        });

        if (list.innerHTML === '') {
            list.innerHTML = "<em>Nenhum item compatível no momento...</em>";
        }

        document.getElementById('battle-bag')!.style.display = 'block';
    }

    static openCardSelection() {

        const Game = (window as any).Game;
        if (Game.currentGlobalEvent?.id === 'EMP') {
            alert("📡 Cartas bloqueadas pela Tempestade Eletromagnética!");
            return;
        }

        if (!this.isPvP && this.activeMon && ((this.activeMon as any).isTemp || (this.activeMon as any).isMegaEvolution)) {
            alert("🧬 Seu parceiro já atingiu o poder máximo! É proibido usar cartas de batalha em Pokémon Mega Evoluídos contra o ambiente selvagem, NPCs ou Ginásios.");
            return;
        }

        if (!this.isPlayerTurn || this.processingAction) return;
        const list = document.getElementById('battle-cards-list')!;
        list.innerHTML = '';

        const modalContent = document.querySelector('#battle-cards-modal .modal-content') as HTMLElement;
        if (modalContent) {
            modalContent.style.width = "90%";
            modalContent.style.maxWidth = "1100px";
            modalContent.style.maxHeight = "85vh";
            modalContent.style.padding = "25px";
            modalContent.style.overflowY = "auto";
        }

        const battleCards = this.player!.cards.filter(c => c.type === 'battle');

        if (battleCards.length === 0) {
            list.innerHTML = "<em>Sem cartas de batalha.</em>";
            list.style.display = 'block';
        } else {
            list.style.display = 'grid';
            list.style.gridTemplateColumns = 'repeat(auto-fill, minmax(180px, 1fr))';
            list.style.gap = '20px';
            list.style.padding = '20px';
            list.style.width = '100%';

            battleCards.forEach(c => {
                const rData = CARD_RARITIES[c.rarity];
                const borderColor = rData ? rData.color : '#8d99ae';

                const d = document.createElement('div');
                d.style.cssText = "display: flex; flex-direction: column; align-items: center; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); width: 100%; box-sizing: border-box; position: relative;";

                d.innerHTML = `
                    <div style="position: absolute; top: -5px; right: -5px; background: ${borderColor}; color: #fff; padding: 2px 6px; font-size: 0.7rem; border-radius: 10px; font-weight: bold; border: 1px solid #222; text-shadow: 1px 1px 0 #000; box-shadow: 0 2px 4px rgba(0,0,0,0.5); z-index: 10;">
                        ${c.rarity.toUpperCase()}
                    </div>
                    <img src="/assets/img/Cartas/${c.id}.jpg" alt="${c.name}" title="${c.desc}" style="width: 100%; aspect-ratio: 2.5/3.5; object-fit: fill; border-radius: 6px; border: 3px solid ${borderColor};">
                    <button class="btn" style="width:100%; margin-top:8px; padding:8px; background:#e74c3c; border:none; border-radius:4px; color:white; font-weight:bold; cursor:pointer;" onclick="window.Battle.useCard('${c.id}')">USAR</button>
                `;
                list.appendChild(d);
            });
        }
        document.getElementById('battle-cards-modal')!.style.display = 'flex';
    }

    static run() {
        if (this.isPvP || this.isNPC || this.isGym) {
            alert("Não pode fugir de treinadores!");
            return;
        }

        this.processingAction = true;
        this.updateButtons();

        const baseChance = 50;
        const d6 = Math.floor(Math.random() * 6) + 1;
        const modifier = (d6 * 4) - 14;
        let finalChance = baseChance + modifier;

        finalChance = Math.max(5, Math.min(95, finalChance));

        this.logBattle(`Tentando fugir... (🎲${d6}) Chance: ${finalChance}%`, true);

        setTimeout(() => {
            const roll = Math.floor(Math.random() * 100) + 1;

            if (roll <= finalChance) {
                this.logBattle("🏃 Escapou com sucesso!", true);
                this.activeMon!.gainXp(5, this.player!);

                if (this.opponent) {
                    const oppId = this.opponent.id;

                    if (!this.player!.pokedexData) this.player!.pokedexData = {};

                    if (!this.player!.pokedexData[oppId]) {
                        this.player!.pokedexData[oppId] = { seen: 0, caught: 0, defeated: 0 };
                    }
                    this.player!.pokedexData[oppId].seen += 1;

                    const Network = (window as any).Network;
                    if (Network.isOnline) Network.syncPlayerState();
                }

                setTimeout(() => this.end(false), 1000);
            } else {
                this.logBattle("🚫 Falha na fuga! O inimigo vai atacar.", true);

                setTimeout(() => {
                    this.performEnemyAttack(() => {
                        this.processingAction = false;
                        this.updateButtons();
                    });
                }, 1000);
            }
        }, 1000);
    }

    static surrender() {
        if (this.isPvP) return;

        this.processingAction = true;
        this.updateButtons();

        this.logBattle("🏳️ Você desistiu da batalha! Fugindo para o Centro Pokémon...", true);

        setTimeout(() => {
            const Game = (window as any).Game;
            const Network = (window as any).Network;

            this.active = false;
            document.getElementById('battle-modal')!.style.display = 'none';

            if (Network.isOnline && this.player && this.player.id === Network.myPlayerId) {
                Network.sendAction('BATTLE_END', { log: `🏳️ ${this.player.name} desistiu da batalha.` });
            }

            if (this.player) {
                const lostGold = this.player.gold >= 100 ? 100 : this.player.gold;
                this.player.gold = Math.max(0, this.player.gold - 100);
                if (lostGold > 0) {
                    Game.sendGlobalLog(`💰 [Extrato] ${this.player.name} deixou cair -${lostGold}G ao desistir da batalha.`);
                    Game.sendGlobalLog(`💰 [Extrato] Novo Saldo: ${this.player.gold}G.`);
                }
                
                Game.handleTotalDefeat(this.player);
            }
            
            Game.nextTurn();
        }, 1500);
    }

    static useItem(key: string, data: ItemData) {
        if (this.isChampion) return alert("🚫 As regras da Liga proíbem o uso de Itens de Cura no Desafio do Campeão!");

        if (data.type === 'revive') {
            alert("Você não pode reviver Pokémon durante a batalha!");
            return;
        }

        const isMegaOrMew = (!this.isPvP && this.activeMon && ((this.activeMon as any).isTemp || (this.activeMon as any).isMegaEvolution));
        if (isMegaOrMew && data.type !== 'capture') {
            alert("🧬 É proibido usar itens de cura/buff em Mega Evoluções ou Mews no PvE.");
            return;
        }

        const Network = (window as any).Network;
        document.getElementById('battle-bag')!.style.display = 'none';

        if (data.type === 'capture') {
            if (this.isPvP || this.isNPC || this.isGym) {
                alert("Não pode capturar pokémons de treinadores!");
                return;
            }
            const Game = (window as any).Game;
            if (Game.currentGlobalEvent?.id !== 'SAFARI_ZONE') {
                this.player!.items[key]--;
            } else {
                this.logBattle("🌳 SAFARI ZONE: Pokébofas são infinitas!", true);
            }
            this.processingAction = true;
            this.updateButtons();

            this.attemptCapture(data);
        }
        else if (data.type === 'heal') {
            if (this.activeMon!.isFainted()) return alert("O Pokémon está desmaiado!");
            if (this.activeMon!.currentHp >= this.activeMon!.maxHp) return alert("HP já está cheio!");

            this.player!.items[key]--;
            this.processingAction = true;
            this.updateButtons();

            this.activeMon!.heal(data.val!);
            this.logBattle(`💊 Usou ${data.name}! Recuperou HP.`, true);
            this.updateUI();

            if (Network.isOnline) {
                Network.sendAction('BATTLE_UPDATE', {
                    plyHp: this.activeMon!.currentHp,
                    oppHp: this.opponent!.currentHp,
                    msg: `Usou ${data.name}!`
                });
            }

            setTimeout(() => {
                this.performEnemyAttack(() => {
                    this.processingAction = false;
                    this.updateButtons();
                });
            }, 1500);
        }

        if (Network.isOnline) Network.syncPlayerState();
    }

    static async animateCaptureSequence(ballIcon: string, isSuccess: boolean): Promise<void> {
        const scene = document.querySelector('.battle-scene') as HTMLElement;
        const enemyImg = document.getElementById('opp-img') as HTMLElement;

        const oldBall = document.querySelector('.anim-ball');
        if (oldBall) oldBall.remove();

        const ball = document.createElement('div');
        ball.className = 'anim-ball';
        ball.style.backgroundImage = `url('/assets/img/Itens/${ballIcon}')`;
        scene.appendChild(ball);

        ball.classList.add('anim-throwing');
        await this.wait(600);

        const flash = document.createElement('div');
        flash.className = 'anim-flash';
        scene.appendChild(flash);
        setTimeout(() => flash.remove(), 300);

        if (enemyImg) enemyImg.classList.add('mon-caught-hidden');

        ball.classList.remove('anim-throwing');

        ball.classList.add('anim-falling');
        await this.wait(500);

        ball.classList.remove('anim-falling');

        const totalShakes = isSuccess ? 3 : (Math.random() > 0.5 ? 2 : 1);

        for (let i = 0; i < totalShakes; i++) {
            await this.wait(400);

            ball.classList.add('anim-shaking');
            this.logBattle(`... (${i + 1})`, false);

            await this.wait(600);
            ball.classList.remove('anim-shaking');
        }

        await this.wait(400);

        if (isSuccess) {
            ball.style.filter = "brightness(0.5)";
            await this.wait(500);
            ball.remove();
        } else {
            ball.style.opacity = '0';
            if (enemyImg) {
                enemyImg.classList.remove('mon-caught-hidden');
            }
            await this.wait(300);
            ball.remove();
        }
    }

    static async attemptCapture(item: ItemData) {
        if (!this.opponent || !this.activeMon) return;

        this.processingAction = true;
        this.updateButtons();

        const opponent = this.opponent;

        this.logBattle(`Jogou ${item.name}!`, true);

        let success = false;
        if (item.id === 'masterball') {
            success = true;
            this.logBattle(`(Chance Final: 100% | Master Ball)`, true);
        } else {
            let baseChance = 15;
            let hpBonus = 0;
            const hpPercent = (opponent.currentHp / opponent.maxHp) * 100;

            if (hpPercent < 15) hpBonus = 50;
            else if (hpPercent < 60) hpBonus = 25;

            const oppStats = opponent.maxHp + opponent.atk + opponent.def + opponent.speed;
            const powerPenalty = Math.floor(oppStats / 30);

            let rarityPenalty = 0;
            if (opponent.isLegendary) rarityPenalty += 10;
            if (opponent.isShiny) rarityPenalty += 10;

            const d6 = Math.floor(Math.random() * 6) + 1;
            const diceBonus = (d6 * 4) - 14;

            let chanceBeforeBall = baseChance + hpBonus - powerPenalty - rarityPenalty + diceBonus;

            let travaMsg = "";
            if (chanceBeforeBall < 15) {
                chanceBeforeBall = 15;
                travaMsg = " (Trava Min 15%)";
            }

            let ballBonus = 0;
            if (item.id === 'greatball') ballBonus = 20;
            else if (item.id === 'ultraball') ballBonus = 40;

            let chance = chanceBeforeBall + ballBonus;

            const Game = (window as any).Game;
            let safariBonus = 0;
            if (Game.currentGlobalEvent?.id === 'SAFARI_ZONE') {
                safariBonus = 50;
                chance += safariBonus;
            }

            chance = Math.min(Game.currentGlobalEvent?.id === 'SAFARI_ZONE' ? 100 : 95, chance);

            let logMsg = `Cálc: Base(15) + HP(+${hpBonus}) - Resist(-${powerPenalty}) - Rari(-${rarityPenalty}) + Dado(🎲${d6}: ${diceBonus > 0 ? '+' : ''}${diceBonus})`;
            logMsg += ` = ${chanceBeforeBall}%${travaMsg}`;
            logMsg += ` | Bola(+${ballBonus}%)`;
            if (safariBonus > 0) logMsg += ` | Safari(+${safariBonus}%)`;
            logMsg += ` => Final: ${chance}%`;

            this.logBattle(logMsg, true);

            const roll = Math.floor(Math.random() * 100) + 1;
            success = (roll <= chance);
        }

        await this.animateCaptureSequence(item.icon, success);

        if (success) {
            this.captureSuccess();
        } else {
            this.logBattle("Aargh! Quase! O Pokémon escapou!", true);

            setTimeout(() => {
                this.performEnemyAttack(() => {
                    this.processingAction = false;
                    this.updateButtons();
                });
            }, 500);
        }
    }

    static captureSuccess() {
        const Game = (window as any).Game;
        const Network = (window as any).Network;

        Game.sendGlobalLog(`✨ ${this.player?.name} capturou um ${this.opponent!.name}!`);

        this.revertMew();
        this.updateUI();

        if (this.opponent) {
            const oppId = this.opponent.id;
            if (!this.player!.pokedexData) this.player!.pokedexData = {};
            if (!this.player!.pokedexData[oppId]) {
                this.player!.pokedexData[oppId] = { seen: 0, caught: 0, defeated: 0 };
            }
            this.player!.pokedexData[oppId].seen += 1;
            this.player!.pokedexData[oppId].caught += 1;
        }

        this.activeMon!.gainXp(5, this.player!);

        if (this.player!.team.length < 6) {
            this.player!.team.push(this.opponent!);
            if (Network.isOnline) Network.syncPlayerState();
            setTimeout(() => this.end(false), 1500);
        } else {
            this.pendingCapture = this.opponent;
            Game.openSwapModal(this.pendingCapture);
        }
    }
}