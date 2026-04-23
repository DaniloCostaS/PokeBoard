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

        // --- LÓGICA DE SELEÇÃO DE TIMES (INCLUI NERF NOVO LÍDER) ---
        if (isPvP && enemyPlayer) {
            if (this.activeEffects.stealBadgeFrom !== undefined && this.activeEffects.stealBadgeFrom !== null) {
                const myRandomTeam = [...player.team].sort(() => Math.random() - 0.5).slice(0, 3);
                const oppRandomTeam = [...enemyPlayer.team].sort(() => Math.random() - 0.5).slice(0, 3);

                // Força a cura máxima burlando qualquer trava de desmaio
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

            // --- TRADUTOR DE GINÁSIOS ---
            const actualGymId = Game.activeGyms ? Game.activeGyms[gymId - 1] : gymId;
            const gymData = GYM_DATA.find(g => g.id === actualGymId);
            // ----------------------------

            const globalAvg = Game.getGlobalAverageLevel();
            const gymLevel = globalAvg + 1;
            const teamSize = Math.min(6, Math.max(2, Game.getGlobalAverageTeamSize() + 1));
            const dynamicTeams = Game.gymTeams || {};

            // Usa o actualGymId para puxar a equipe correta
            let rosterIds = dynamicTeams[actualGymId] || (gymData ? gymData.teamIds : [130]);
            const battleIds = rosterIds.slice(0, teamSize);

            this.oppTeamList = battleIds.map((id: number) => new Pokemon(id, gymLevel, false, true));
            this.opponent = this.oppTeamList[0];

            //this.plyTeamList = player.getBattleTeam(true);
            // --- CORREÇÃO: Garante que o jogador use TODO o time vivo no Ginásio ---
            this.plyTeamList = player.team.filter(p => !p.isFainted());
            if (this.plyTeamList.length === 0) {
                this.plyTeamList = player.team.filter(p => !p.isFainted());
            }
        } else {
            this.oppTeamList = Array.isArray(enemyMon) ? enemyMon : [enemyMon];
            this.opponent = this.oppTeamList[0];
            //this.plyTeamList = player.getBattleTeam(true); 
            // --- CORREÇÃO: Garante que o jogador use TODO o time vivo no PvE ---
            this.plyTeamList = player.team.filter(p => !p.isFainted());
        }

        // =====================================================================
        // NOVO: APLICA BUFFS DA POKÉDEX (RESSONÂNCIA)
        // =====================================================================
        this.plyTeamList.forEach(mon => {
            this.applyResonanceBonus(player, mon);
        });

        if (isPvP && enemyPlayer) {
            this.oppTeamList.forEach(mon => {
                this.applyResonanceBonus(enemyPlayer, mon);
            });
        }

        // Log para avisar o jogador se houver bônus
        const activeResonance = (this.plyTeamList[0] as any).resonantBonus;
        if (activeResonance) {
            setTimeout(() => this.logBattle(`🧬 Ressonância Genética: ${this.plyTeamList[0].name} está ${activeResonance}% mais forte!`, true), 800);
        }
        // =====================================================================

        if (this.plyTeamList.length === 0) {
            Game.handleTotalDefeat(player);
            Game.nextTurn();
            return;
        }

        if (this.isNPC && npcImage) { (this.opponent as any)._npcImage = npcImage; (this.opponent as any)._npcName = _label; }

        if (this.isGym && this.player.effects.curse) {
            this.logBattle("😈 CUIDADO! Você entrou no Ginásio Amaldiçoado! Dano reduzido e Itens bloqueados!", true);
        }

        // EVENTO: TEMPESTADE DE AREIA (Machuca no início)
        if (Game.currentGlobalEvent?.id === 'SANDSTORM') {
            const hurtSand = (mon: Pokemon) => {
                if (!['Pedra', 'Terra', 'Aço'].includes(mon.type) && (!mon.secondType || !['Pedra', 'Terra', 'Aço'].includes(mon.secondType))) {
                    mon.currentHp = Math.max(1, Math.floor(mon.currentHp * 0.9)); // Perde 10%
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
        this.isChampion = true; // <--- LIGA O MODO FINAL!

        this.player = player;

        // --- CORREÇÃO: Pega todo o time vivo igual no Ginásio ---
        this.plyTeamList = player.team.filter(p => !p.isFainted());

        // Recria o time do campeão usando os dados do Firebase
        const PokemonClass = (window as any).Pokemon || player.team[0].constructor;
        this.oppTeamList = championData.team.map((td: any) => {
            const po = new PokemonClass(td.id, td.level, td.isShiny);
            Object.assign(po, td);
            po.currentHp = po.maxHp; // Cura total do chefão
            return po;
        });
        this.opponent = this.oppTeamList[0];

        this.battleTitle = `🏆 CAMPEÃO ATUAL: ${championData.name.toUpperCase()} 🏆`;

        // --- CORREÇÃO: Chama a tela de escolha em vez de travar a batalha ---
        const contextTitle = `🏆 <b>DESAFIO AO CAMPEÃO ${championData.name.toUpperCase()}!</b><br><small style="color:#f1c40f; font-size:0.9rem;">Escolha seu Pokémon para a Batalha Final!</small>`;
        this.openSelectionModal(contextTitle);
        // ------------------------------------------------------------------

        const Game = (window as any).Game;
        Game.sendGlobalLog(`⚔️ O DESAFIO FINAL! ${player.name} está enfrentando o Campeão ${championData.name}!`);
        this.logBattle(`🏆 DESAFIO AO CAMPEÃO 🏆\nSem Itens. Sem Cartas. Apenas força bruta!`);
    }

    static openSelectionModal(title: string) {
        const modal = document.getElementById('pkmn-select-modal')!;
        const list = document.getElementById('pkmn-select-list')!;

        // --- CORREÇÃO: Usar innerHTML para aceitar formatação bonitinha ---
        document.getElementById('select-title')!.innerHTML = title;
        // -----------------------------------------------------------------

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

    // Helper para pausas assíncronas
    static wait(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static startRound(selectedMon: Pokemon) {
        const Network = (window as any).Network;
        document.getElementById('pkmn-select-modal')!.style.display = 'none';
        this.active = true;
        this.activeMon = selectedMon;

        // Tenta Mega Evoluir ao entrar em campo
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

            // --- CORREÇÃO VISUAL DE ESPECTADOR ---
            // Antes usávamos findIndex pelo ID, o que causava bug em times com Pokémons repetidos
            // (ex: 2 Geodudes). O sistema achava sempre o primeiro (índice 0) e mostrava o pokémon morto.

            let targetIdx = 0;
            if (this.opponent && this.oppTeamList.length > 0) {
                // 1. Tenta achar pela referência exata do objeto na memória (Infalível para o Host)
                targetIdx = this.oppTeamList.indexOf(this.opponent);

                // 2. Fallback de segurança: Se por algum motivo a referência for perdida,
                // busca pelo ID mas ignora os desmaiados para não pegar o morto do índice 0.
                if (targetIdx === -1) {
                    targetIdx = this.oppTeamList.findIndex(p => p.id === this.opponent!.id && !p.isFainted());
                }

                // 3. Último caso, volta para 0
                if (targetIdx === -1) targetIdx = 0;
            }
            // ------------------------------------------------------

            Network.sendAction('BATTLE_START', {
                pId: this.player!.id,
                monIdx: this.player!.team.indexOf(this.activeMon),
                oppTeam: Network.getSanitizedTeam(this.oppTeamList),
                plyTeam: Network.getSanitizedTeam(this.plyTeamList),

                // Agora enviamos o índice correto, mesmo se houver pokémons repetidos
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

    // --- NOVA FUNÇÃO CENTRALIZADA DE MEGA EVOLUÇÃO ---
    static tryTriggerMegaEvolution(contextMsg: string = "reagiu durante o combate") {
        const Game = (window as any).Game;
        if (Game.currentGlobalEvent?.id === 'MEGA_BLOCK') return; // Bloqueio Global!

        if (!this.activeMon || !this.activeMon.megaStone) return;
        if ((this.activeMon as any).isTemp) return; // Já está Mega Evoluído

        const megaId = MAPA_MEGAS[this.activeMon.id];

        // Chance de 10%
        if (megaId && Math.random() < 0.10) {
            // Pequeno atraso para não atropelar a renderização ou logs anteriores
            setTimeout(() => {
                // Validação dupla caso o pokémon tenha morrido ou trocado nesse meio tempo
                if (!this.activeMon || (this.activeMon as any).isTemp) return;

                this.performMegaEvolution(megaId);
                this.logBattle(`💎 A Mega Pedra de ${this.activeMon.name} ${contextMsg}!`, true);
            }, 1000);
        }
    }

    // --- NOVA FUNÇÃO CENTRALIZADA DE MEGA EVOLUÇÃO (OPONENTE) ---
    static tryOpponentMegaEvolution(contextMsg: string = "reagiu durante o combate") {
        const Game = (window as any).Game;
        if (Game.currentGlobalEvent?.id === 'MEGA_BLOCK') return;

        if (!this.opponent) return;
        if ((this.opponent as any).isTemp) return;

        // Em PvP, o adversário só mega evolui se tiver a pedra equipada
        // Em PvE (selvagem, NPC, Ginásio), basta o Pokémon ter uma forma Mega existente
        if (this.isPvP && !this.opponent.megaStone) return;

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
        // Se estiver em Auto Mode PvE, travamos os botões normais, mas deixamos o de Auto liberado para poder cancelar
        const canAct = this.isPlayerTurn && !this.processingAction && isMyBattle;

        btns.forEach((btn: Element) => {
            const htmlBtn = btn as HTMLButtonElement;
            // O botão de Auto (id btn-auto-pve) tem regra própria
            if (htmlBtn.id === 'btn-auto-pve') {
                htmlBtn.disabled = !isMyBattle; // Só desabilita se não for minha batalha
            } else {
                // Se o Auto estiver ligado, desabilita tudo (menos o próprio botão auto, tratado acima)
                if (this.isAutoPvE) htmlBtn.disabled = true;
                else htmlBtn.disabled = !canAct;
            }
        });

        const runBtn = document.getElementById('btn-run') as HTMLButtonElement;
        const autoBtn = document.getElementById('btn-auto-pve') as HTMLButtonElement;

        // Regras de visibilidade e bloqueio específicas
        if (this.isChampion) {
            if (runBtn) runBtn.disabled = true; // Impede fugir do Campeão
            if (autoBtn) autoBtn.style.display = 'block';
        } else if (this.isPvP) {
            if (runBtn) runBtn.disabled = true;
            if (autoBtn) autoBtn.style.display = 'none'; // Esconde Auto PvE no PvP
        } else if (this.isGym) {
            if (runBtn) runBtn.disabled = true;
            if (autoBtn) autoBtn.style.display = 'block';
        } else {
            if (autoBtn) autoBtn.style.display = 'block';
        }
    }

    // --- NOVO SISTEMA: AUTO BATTLE PVE ---
    static toggleAutoPvE() {
        this.isAutoPvE = !this.isAutoPvE;

        const btn = document.getElementById('btn-auto-pve');
        if (btn) {
            if (this.isAutoPvE) {
                btn.innerText = "🛑 Parar Auto";
                btn.classList.add('active-auto');
                this.logBattle("⚡ Modo Automático ativado!", true);

                // Se não estiver processando nada agora, já inicia o ataque
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

    // --- NOVAS FUNÇÕES DO AUTO-BATTLER ---
    static startAutoPvP() {
        if (!this.isPvP) return;
        this.processingAction = true; // Trava os botões
        this.updateButtons();
        this.logBattle(`⚔️ A Batalha Automática começou!`, true);
        setTimeout(() => this.autoAttackNext(), 1500);
    }

    static autoAttackNext() {
        if (!this.active || !this.isPvP) return;

        // --- TENTA MEGA EVOLUIR ANTES DO PRÓXIMO GOLPE ---
        this.tryTriggerMegaEvolution("ressoou no decorrer do combate");
        this.tryOpponentMegaEvolution("ressoou no decorrer do combate");
        // -------------------------------------------------

        if (this.activeMon && this.activeMon.currentHp > 0 && this.opponent && this.opponent.currentHp > 0) {
            this.attack();
        }
    }
    // -------------------------------------

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

        // Time do Jogador
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

        // Time do Oponente
        if (payload.oppTeam && payload.oppTeam.length > 0) {
            const PokemonClass = (window as any).Pokemon || p.team[0].constructor;
            this.oppTeamList = payload.oppTeam.map((td: any) => {
                const po = new PokemonClass(td.id, td.level, td.isShiny);
                Object.assign(po, td);
                if (payload.npcImage) (po as any)._npcImage = payload.npcImage;
                if (payload.npcName) (po as any)._npcName = payload.npcName;
                return po;
            });

            // --- SELEÇÃO SEGURA DO ÍNDICE ---
            // Se oppIdx vier como -1 ou undefined, cai para 0.
            const targetIdx = (payload.oppIdx !== undefined && payload.oppIdx >= 0) ? payload.oppIdx : 0;
            this.opponent = this.oppTeamList[targetIdx] || this.oppTeamList[0];
            // --------------------------------
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

        // CORREÇÃO CRÍTICA: Só atualiza o HP se ele vier no payload.
        // Isso impede que o HP zere/bugue quando enviamos apenas um log de texto!
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

        // =====================================================================
        // CORREÇÃO VISUAL: Limpa o estado de "Capturado" da batalha anterior
        // =====================================================================
        const enemyImg = document.getElementById('opp-img') as HTMLElement;
        if (enemyImg) {
            enemyImg.classList.remove('mon-caught-hidden');
            enemyImg.style.opacity = '1';       // Garante opacidade total
            enemyImg.style.transform = 'none';  // Remove escala reduzida
        }
        // =====================================================================

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

        // --- ALTERA O HUD PARA O MODO AUTO PVP ---
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
        // -----------------------------------------

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
        // 1. CÁLCULO DE ESQUIVA
        let dodgeChance = (defender.speed - attacker.speed) / 5;
        dodgeChance = Math.max(10, dodgeChance);

        const ignoreDodge = (isPlayerAttacking && this.activeEffects.sniper);

        if (!ignoreDodge && Math.random() * 100 <= dodgeChance) {
            return { damage: 0, msg: "💨 ESQUIVOU!", avoided: true, reflected: 0 };
        }

        // 2. NOVO: CÁLCULO DE BLOQUEIO (DEFESA PURA)
        // Fórmula: (DEF - ATK) / 5. Máximo de 90% de chance.
        let blockChance = (defender.def - attacker.atk) / 5;
        blockChance = Math.max(0, Math.min(90, blockChance));

        if (Math.random() * 100 <= blockChance) {
            return { damage: 0, msg: "🛡️ BLOQUEIO TOTAL!", avoided: true, reflected: 0 };
        }

        // 3. ATAQUE BASE
        const baseAtk = (attacker.atk * 0.65) + (attacker.speed * 0.15) + (attacker.maxHp * 0.2);
        let finalDamage = (baseAtk / 5) - (defender.def / 20);

        // Lógica de Maestria (Mantida do seu código)
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

        // 4. CRÍTICO E DADO
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

        // 5. VANTAGEM DE TIPO
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

        let finalMulti = bestMulti; // <--- CORREÇÃO AQUI: Trocado de const para let
        // EVENTOS CLIMÁTICOS GLOBAIS (Soma ou Deduz Multiplicadores)
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

        // 6. MODIFICADORES DE CARTAS
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

        // 7. NOVO: REFLEXÃO DE DANO (Counter / Soul Link)
        let reflectedAmount = 0;

        if (ev === 'SOUL_LINK') {
            reflectedAmount = Math.floor(finalDamage * 0.3);
            logDetails += " [🔗LINK!]";
        }

        // Se a Defesa for 50% maior que o Ataque (ex: 150 Def vs 100 Atk)
        if (defender.def > (attacker.atk * 1.5)) {
            // 15% de chance de devolver o dano
            if (Math.random() * 100 <= 15) {
                reflectedAmount += finalDamage;
                logDetails += " 🔄REFLETIDO!";
            }
        }

        return { damage: finalDamage, msg: `(🎲${d6})${logDetails}`, avoided: false, reflected: reflectedAmount };
    }

    // =========================================================================================
    // LÓGICA UNIFICADA DE BATALHA (PvE e PvP Automático)
    // =========================================================================================

    static attack() {
        const Network = (window as any).Network;
        // Segurança: Só o dono do turno pode executar
        if (Network.isOnline && this.player && this.player.id !== Network.myPlayerId) return;

        if (!this.active || !this.activeMon || !this.opponent) return;

        this.processingAction = true;
        this.updateButtons();

        const playerSpeed = this.activeMon.speed;
        const enemySpeed = this.opponent.speed;
        let playerGoesFirst = true;

        // Decisão de Velocidade
        if (playerSpeed > enemySpeed) playerGoesFirst = true;
        else if (enemySpeed > playerSpeed) playerGoesFirst = false;
        else playerGoesFirst = Math.random() > 0.5;

        this.logBattle(`Velocidade: ${this.activeMon.name}(${playerSpeed}) vs ${this.opponent.name}(${enemySpeed})`, true);

        // --- FUNÇÃO PARA FINALIZAR O ROUND ---
        const finishTurnSequence = () => {
            const Game = (window as any).Game;
            const ev = Game.currentGlobalEvent?.id;

            // --- GATILHOS DE FIM DE TURNO GLOBAIS ---
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
            } else if (ev === 'WINTER_STORM') {
                // Lógica de congelamento movida para os métodos de ataque
            }
            // ----------------------------------------

            this.processingAction = false;
            this.updateButtons();

            // Sincronização Online (Se houver)
            if (this.isPvP && Network.isOnline) {
                Network.syncPlayerState();
            }

            // Lógica de Auto Battle
            if (this.isPvP) {
                // Se estiver em auto-pvp (lógica específica)
                setTimeout(() => this.autoAttackNext(), 1500);
            }
            else if (this.isAutoPvE) {
                // Só continua se ambos estiverem vivos
                if (this.activeMon!.currentHp > 0 && this.opponent!.currentHp > 0) {
                    setTimeout(() => this.attack(), 1500);
                } else {
                    // Se alguém morreu, o handleFaint ou win vai rodar.
                    // Nós desligamos o Auto aqui para o jogador ter controle na troca.
                    this.isAutoPvE = false;
                    const btn = document.getElementById('btn-auto-pve');
                    if (btn) {
                        btn.innerText = "⚡ Auto Atacar";
                        btn.classList.remove('active-auto');
                    }
                }
            }
        };

        // --- EXECUÇÃO DA SEQUÊNCIA DE ATAQUES ---
        if (playerGoesFirst) {
            this.logBattle(`💨 ${this.activeMon.name} é mais rápido!`, true);

            // 1. Jogador Ataca
            this.performPlayerAttack(() => {
                // Se o oponente sobreviveu, ele revida
                if (this.opponent && this.opponent.currentHp > 0) {
                    setTimeout(() => {
                        this.performEnemyAttack(() => {
                            finishTurnSequence(); // Fim do Round (Ambos atacaram)
                        });
                    }, 1000);
                } else {
                    finishTurnSequence(); // Fim do Round (Inimigo morreu no 1º hit)
                }
            });

        } else {
            this.logBattle(`💨 ${this.opponent.name} é mais rápido!`, true);

            // 1. Inimigo Ataca
            this.performEnemyAttack(() => {
                // Se o jogador sobreviveu, ele revida
                if (this.activeMon && this.activeMon.currentHp > 0) {
                    setTimeout(() => {
                        this.performPlayerAttack(() => {
                            finishTurnSequence(); // Fim do Round (Ambos atacaram)
                        });
                    }, 1000);
                } else {
                    finishTurnSequence(); // Fim do Round (Jogador morreu no 1º hit)
                }
            });
        }
    }

    // Ação isolada de ataque do Jogador
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

        // --- CÁLCULO DO PRIMEIRO ATAQUE ---
        let calc1 = this.calculateDamage(this.activeMon!, this.opponent!, true);
        let totalDmg = calc1.damage;

        // [NOVO] Acumula o dano refletido (se houver)
        let totalReflected = calc1.reflected || 0;

        let logMsg = `${this.activeMon!.name} atacou! `;

        if (calc1.avoided) {
            logMsg += `${calc1.msg}`;
        } else {
            logMsg += `💥${calc1.damage} ${calc1.msg}`;
            if (calc1.reflected > 0) logMsg += " [🔄Refletido!]";
        }

        // --- CÁLCULO DO ATAQUE DUPLO (SPEED) ---
        // Se SPD >= 50% maior que oponente -> 20% chance de atacar duas vezes
        if (!calc1.avoided && this.activeMon!.speed >= (this.opponent!.speed * 1.5)) {
            if (Math.random() * 100 <= 20) {
                let calc2 = this.calculateDamage(this.activeMon!, this.opponent!, true);

                if (!calc2.avoided) {
                    totalDmg += calc2.damage;

                    // [NOVO] Soma o reflexo do segundo ataque também
                    totalReflected += (calc2.reflected || 0);

                    logMsg += ` + ⚔️DUPLO! 💥${calc2.damage}`;
                    if (calc2.reflected > 0) logMsg += " [🔄Refletido!]";
                } else {
                    logMsg += ` + ⚔️DUPLO! (Errou)`;
                }
            }
        }
        // ----------------------------------------

        // 1. Aplica o Dano no Inimigo
        this.opponent.currentHp = Math.max(0, this.opponent.currentHp - totalDmg);

        // [NOVO] 2. Aplica o Dano Refletido no Jogador (Se houver)
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
                Network.sendAction('PVP_SYNC_DAMAGE', { targetId: this.enemyPlayer.id, team: this.enemyPlayer.team, gold: this.enemyPlayer.gold }); // Safety sync
            }
        }

        // --- VERIFICAÇÕES DE MORTE ---

        // 1. Oponente Morreu (Vitória)
        if (this.opponent.currentHp <= 0) {
            const oppStats = this.opponent.maxHp + this.opponent.atk + this.opponent.def + this.opponent.speed;
            const xpGain = Math.max(1, Math.floor(oppStats / 7));
            this.activeMon.gainXp(xpGain, this.player!);

            this.updateUI();
            if (Network.isOnline) Network.syncPlayerState();
            setTimeout(() => { this.checkWinCondition(); }, 1000);
        }
        // 2. Jogador Morreu pelo Reflexo (Derrota)
        else if (this.activeMon.currentHp <= 0) {
            this.updateUI();
            if (Network.isOnline) Network.syncPlayerState();
            setTimeout(() => { this.handleFaint(); }, 1000);
        }
        else {
            if (callback) callback();
        }
    }

    // Ação isolada de ataque do Inimigo (Controlado automaticamente pelo Cliente do Jogador Ativo)
    static performEnemyAttack(callback?: () => void) {
        const Game = (window as any).Game;
        const Network = (window as any).Network;
        if (!this.activeMon || !this.opponent) return;

        // --- VERIFICAÇÃO DE ATORDOAMENTO (ATAQUE SURPRESA) ---
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

        // --- CÁLCULO DO PRIMEIRO ATAQUE ---
        let calc1 = this.calculateDamage(this.opponent!, this.activeMon!, false);
        let totalDmg = calc1.damage;

        // [NOVO] Acumula reflexo
        let totalReflected = calc1.reflected || 0;

        let logMsg = `${this.opponent!.name} atacou! `;

        if (calc1.avoided) {
            logMsg += `${calc1.msg}`;
        } else {
            logMsg += `💥${calc1.damage} ${calc1.msg}`;
            if (calc1.reflected > 0) logMsg += " [🔄Refletido!]";
        }

        // --- CÁLCULO DO ATAQUE DUPLO (SPEED) ---
        if (!calc1.avoided && this.opponent!.speed >= (this.activeMon!.speed * 1.5)) {
            if (Math.random() * 100 <= 20) {
                let calc2 = this.calculateDamage(this.opponent!, this.activeMon!, false);
                if (!calc2.avoided) {
                    totalDmg += calc2.damage;

                    // [NOVO] Soma reflexo do ataque duplo
                    totalReflected += (calc2.reflected || 0);

                    logMsg += ` + ⚔️DUPLO! 💥${calc2.damage}`;
                    if (calc2.reflected > 0) logMsg += " [🔄Refletido!]";
                } else {
                    logMsg += ` + ⚔️DUPLO! (Errou)`;
                }
            }
        }
        // ----------------------------------------

        // 1. Aplica dano no Jogador
        this.activeMon.currentHp = Math.max(0, this.activeMon.currentHp - totalDmg);

        // [NOVO] 2. Aplica dano Refletido no Inimigo
        if (totalReflected > 0) {
            this.opponent.currentHp = Math.max(0, this.opponent.currentHp - totalReflected);
            logMsg += ` (Sofreu ${totalReflected} de volta!)`;
        }

        logMsg += ` HP final ${this.activeMon.currentHp}/${this.activeMon.maxHp}.`;
        this.logBattle(logMsg);
        this.updateUI();

        // Lógica de Counter (Carta)
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

        // --- VERIFICAÇÕES DE MORTE ---

        // 1. Jogador Morreu (Derrota)
        if (this.activeMon.currentHp <= 0) {
            // [MANTIDO] Inimigo venceu (ganha XP de vitória no PvP)
            if (this.isPvP && this.enemyPlayer) {
                const plyStats = this.activeMon.maxHp + this.activeMon.atk + this.activeMon.def + this.activeMon.speed;
                const oppXpGain = Math.max(1, Math.floor(plyStats / 7));
                this.opponent.gainXp(oppXpGain, this.enemyPlayer);
                if (Network.isOnline) Network.syncSpecificPlayer(this.enemyPlayer.id);
            }

            this.updateUI();
            if (Network.isOnline) Network.syncPlayerState();
            setTimeout(() => { this.handleFaint(); }, 1000);
        }
        // 2. Inimigo Morreu (Pelo Reflexo ou Counter) - Vitória do Jogador
        else if (this.opponent.currentHp <= 0) {
            // [MANTIDO] Jogador ganha XP de vitória
            const oppStats = this.opponent.maxHp + this.opponent.atk + this.opponent.def + this.opponent.speed;
            const xpGain = Math.max(1, Math.floor(oppStats / 7));
            this.activeMon.gainXp(xpGain, this.player!);

            this.updateUI();
            if (Network.isOnline) Network.syncPlayerState();
            setTimeout(() => { this.checkWinCondition(); }, 1000);
        }
        else {
            // O jogador sobreviveu e a vez vai voltar para ele.
            // Tenta Mega Evoluir novamente antes de liberar os botões!
            this.tryTriggerMegaEvolution("reagiu após o ataque");
            this.tryOpponentMegaEvolution("reagiu após o ataque");

            if (callback) callback();
        }
    }

    static checkWinCondition() {
        // --- DESLIGA O AUTO BATTLE QUANDO O INIMIGO MORRE ---
        this.isAutoPvE = false;
        const btn = document.getElementById('btn-auto-pve');
        if (btn) {
            btn.innerText = "⚡ Auto Atacar";
            btn.classList.remove('active-auto');
        }
        // ---------------------------------------------------

        // --- SE O INIMIGO ERA MEGA, REVERTE ANTES DE PROCURAR O PRÓXIMO ---
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

                // --- LIMPEZA DE STATUS AO REVERTER MEGA MORTO ---
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

        const nextOpp = this.oppTeamList.find(p => !p.isFainted() && p !== this.opponent);

        if (nextOpp) {
            // --- CORREÇÃO 1: Preserva a imagem e nome do NPC ---
            const oldImg = (this.opponent as any)._npcImage;
            const oldName = (this.opponent as any)._npcName;

            this.opponent = nextOpp;

            if (oldImg) (this.opponent as any)._npcImage = oldImg;
            if (oldName) (this.opponent as any)._npcName = oldName;
            // ---------------------------------------------------

            // --- LIMPEZA DE STATUS AO TROCAR POKEMON MORTO ---
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

            // Continua batendo se for automático!
            if (this.isPvP) {
                setTimeout(() => this.autoAttackNext(), 2000);
            }
        } else {
            this.win();
        }
    }

    static handleFaint() {
        // --- DESLIGA O AUTO BATTLE AO MORRER ---
        this.isAutoPvE = false;
        const btn = document.getElementById('btn-auto-pve');
        if (btn) {
            btn.innerText = "⚡ Auto Atacar";
            btn.classList.remove('active-auto');
        }
        // ---------------------------------------

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

            // --- TROCA AUTOMÁTICA SE FOR PVP ---
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
            // -----------------------------------
        }
        else { this.lose(); }
    }

    static logBattle(msg: string, sync: boolean = false) {
        const Game = (window as any).Game;
        const el = document.getElementById('battle-msg');
        if (el) el.innerText = msg;

        const logContainer = document.getElementById('battle-log-history');
        if (logContainer) {
            // 'afterbegin' empurra o histórico antigo para baixo
            logContainer.insertAdjacentHTML('afterbegin', `<div style="border-bottom:1px solid #555; padding:2px;">${msg}</div>`);

            // Força a barra de rolagem do histórico a ficar no topo
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

        // --- BLINDAGEM 1: Tipos e XP do Jogador ---
        const plyTypesEl = document.getElementById('ply-types');
        if (plyTypesEl && typeof this.activeMon.getTypeBadgesHTML === 'function') {
            plyTypesEl.innerHTML = this.activeMon.getTypeBadgesHTML('flex-start'); // <- Alinha a esquerda
        }

        const plyXpEl = document.getElementById('ply-xp');
        if (plyXpEl) {
            plyXpEl.style.width = `${(this.activeMon.currentXp / this.activeMon.maxXp) * 100}%`;
        }
        // ------------------------------------------

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

        // --- BLINDAGEM 2: Tipos do Oponente (Opcional, mas recomendado) ---
        const oppTypesEl = document.getElementById('opp-types');
        if (oppTypesEl && typeof this.opponent.getTypeBadgesHTML === 'function') {
            oppTypesEl.innerHTML = this.opponent.getTypeBadgesHTML('flex-start'); // <- Alinha a esquerda
        }
        // ------------------------------------------------------------------

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
        // 1. Tenta restaurar pelo backup (cenário ideal)
        if (this.activeEffects && this.activeEffects.mewOriginal && this.player) {
            const original = this.activeEffects.mewOriginal;

            // Encontra onde está o Mega/Mew/Temp no time atual
            const tempIndex = this.player.team.findIndex(p => (p as any).isTemp || p.isMegaEvolution);

            if (tempIndex !== -1) {
                // Se encontrou, substitui de volta pelo original
                this.player.team[tempIndex] = original;
            } else if (this.activeEffects.mewIndex !== undefined && this.player.team[this.activeEffects.mewIndex]) {
                // Fallback pelo índice salvo
                this.player.team[this.activeEffects.mewIndex] = original;
            }

            // --- CORREÇÃO: Restaurar o Original na Lista de Batalha ---
            const plyListIdx = this.plyTeamList.findIndex(p => (p as any).isTemp || (p as any).isMegaEvolution);
            if (plyListIdx !== -1) {
                this.plyTeamList[plyListIdx] = original;
            }
            // ----------------------------------------------------------

            // Restaura o ActiveMon se ele for o Mega
            if (this.activeMon && ((this.activeMon as any).isTemp || this.activeMon.isMegaEvolution)) {
                this.activeMon = original;
            }

            this.activeEffects.mewOriginal = null;
        }

        // 2. VARREDURA DE SEGURANÇA (Se o passo 1 falhar ou duplicar)
        // Isso corrige o bug de "Status Surreal" e "Duplicação"
        if (this.player) {
            // Remove duplicatas (filtra qualquer isTemp que tenha sobrado)
            this.player.team = this.player.team.filter(p => !(p as any).isTemp);

            // Se por acaso o "Original" foi perdido e sobrou o Mega salvo como permanente:
            this.player.team.forEach(mon => {
                // Chama a função de autocorreção criada no Pokemon.ts
                if (typeof mon.validateAndFix === 'function') {
                    mon.validateAndFix();
                }
            });
        }
    }

    static performMegaEvolution(megaId: number) {
        const Network = (window as any).Network;

        // --- CORREÇÃO: Agora usa a POKEDEX importada diretamente ---
        // Isso garante que ele leia os dados que você acabou de adicionar (Gen 9 + Megas)
        const megaData = POKEDEX.find((p: any) => p.id === megaId);

        if (!megaData) {
            console.error(`ERRO CRÍTICO: Mega ID ${megaId} não encontrado na Pokedex.`);
            return alert("Dados da Mega Evolução não encontrados! Verifique o arquivo pokedex.ts");
        }

        // 2. Salva o Pokémon Original
        this.activeEffects.mewOriginal = this.player!.team[this.player!.team.indexOf(this.activeMon!)];
        this.activeEffects.mewIndex = this.player!.team.indexOf(this.activeMon!);

        // 3. Cria o objeto do Mega Pokémon
        // Usa o construtor do Pokémon atual para manter a compatibilidade
        const PokemonClass = (window as any).Pokemon || this.activeMon!.constructor;
        const megaMon = new PokemonClass(megaId, this.activeMon!.level, this.activeMon!.isShiny);

        // 1. Ativa o bônus de 10%
        (megaMon as any).isMegaEvolution = true;

        // 2. Recalcula Status e CURA TOTALMENTE (resetHp = true)
        megaMon.recalculateStats(true);

        // Marca como temporário para reverter ao final da batalha
        (megaMon as any).isTemp = true;

        // 4. Substitui na Batalha
        this.activeMon = megaMon;
        if (this.activeEffects.mewIndex !== undefined && this.activeEffects.mewIndex !== -1) {
            this.player!.team[this.activeEffects.mewIndex] = megaMon;
        }

        // --- CORREÇÃO: Substitui na posição correta da lista de combate ---
        const plyListIdx = this.plyTeamList.findIndex(p => p.id === this.activeEffects.mewOriginal.id);
        if (plyListIdx !== -1) {
            this.plyTeamList[plyListIdx] = megaMon;
        } else {
            // Em caso de emergência, acha pelo objeto exato:
            const activeIndex = this.plyTeamList.findIndex(p => p === this.activeEffects.mewOriginal);
            if (activeIndex !== -1) {
                this.plyTeamList[activeIndex] = megaMon;
            }
        }
        // -------------------------------------------------------

        // 5. Atualiza a UI e Logs
        this.logBattle(`🧬 O elo fortaleceu! Mega Evolução para ${megaMon.name}!`, true);
        this.updateUI();

        // 6. Sincroniza se estiver Online
        if (Network.isOnline) {
            Network.syncPlayerState();
            Network.sendAction('BATTLE_PLY_SWITCH', {
                nextPly: Network.getSanitizedTeam([megaMon])[0]
            });
        }
    }

    // --- MEGA EVOLUÇÃO E REVERSÃO PARA O OPONENTE (PVP) ---
    static performOpponentMegaEvolution(megaId: number) {
        const Network = (window as any).Network;
        // Wait, in Battle.ts POKEDEX is imported na linha 1! I can just use it.
        const megaData = (window as any).POKEDEX ? (window as any).POKEDEX.find((p: any) => p.id === megaId) : { id: megaId }; // Fallback simples
        if (!megaData) return;

        if (!this.activeEffects) this.activeEffects = {};
        this.activeEffects.opponentMewOriginal = this.enemyPlayer!.team[this.enemyPlayer!.team.indexOf(this.opponent!)];
        this.activeEffects.opponentMewIndex = this.enemyPlayer!.team.indexOf(this.opponent!);

        const PokemonClass = (window as any).Pokemon || this.opponent!.constructor;
        const megaMon = new PokemonClass(megaId, this.opponent!.level, this.opponent!.isShiny);

        (megaMon as any).isMegaEvolution = true;
        megaMon.recalculateStats(true);
        (megaMon as any).isTemp = true;

        this.opponent = megaMon;
        if (this.activeEffects.opponentMewIndex !== undefined && this.activeEffects.opponentMewIndex !== -1) {
            this.enemyPlayer!.team[this.activeEffects.opponentMewIndex] = megaMon;
        }

        const oppListIdx = this.oppTeamList.findIndex(p => p.id === this.activeEffects.opponentMewOriginal.id);
        if (oppListIdx !== -1) {
            this.oppTeamList[oppListIdx] = megaMon;
        } else {
            const activeIndex = this.oppTeamList.findIndex(p => p === this.activeEffects.opponentMewOriginal);
            if (activeIndex !== -1) this.oppTeamList[activeIndex] = megaMon;
        }

        this.logBattle(`🧬 O elo inimigo fortaleceu! Mega Evolução para ${megaMon.name}!`, true);
        this.updateUI();

        if (Network.isOnline && this.isPvP && this.enemyPlayer) {
            Network.syncSpecificPlayer(this.enemyPlayer.id);
        }
    }

    static revertOpponentMew() {
        if (this.activeEffects && this.activeEffects.opponentMewOriginal && this.enemyPlayer) {
            const original = this.activeEffects.opponentMewOriginal;

            const tempIndex = this.enemyPlayer.team.findIndex(p => (p as any).isTemp || p.isMegaEvolution);
            if (tempIndex !== -1) {
                this.enemyPlayer.team[tempIndex] = original;
            } else if (this.activeEffects.opponentMewIndex !== undefined && this.enemyPlayer.team[this.activeEffects.opponentMewIndex]) {
                this.enemyPlayer.team[this.activeEffects.opponentMewIndex] = original;
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

    // =========================================================================
    // SISTEMA DE BUFFS DA POKÉDEX (Cole no final da classe Battle)
    // =========================================================================

    // 1. Ressonância: Aumenta status baseados em quantas vezes você CAPTUROU aquele ID
    static applyResonanceBonus(player: Player, mon: Pokemon) {
        if (!player.pokedexData || !player.pokedexData[mon.id]) return;

        const data = player.pokedexData[mon.id];
        const captures = data.caught || 0;

        // Se tiver mais de 1 captura (repetidos), aplica 10% de bônus por cópia
        if (captures > 1) {

            // --- BLINDAGEM ANTI-SNOWBALL ---
            // Limpa qualquer buff antigo resetando para os status puros do Level
            mon.recalculateStats(false);
            // -------------------------------

            const extraCount = captures - 1;
            const bonusPercent = Math.min(1.0, extraCount * 0.10); // Máx +100%

            mon.maxHp = Math.floor(mon.maxHp * (1 + bonusPercent));
            mon.currentHp = Math.floor(mon.currentHp * (1 + bonusPercent));
            mon.atk = Math.floor(mon.atk * (1 + bonusPercent));
            mon.def = Math.floor(mon.def * (1 + bonusPercent));
            mon.speed = Math.floor(mon.speed * (1 + bonusPercent));

            (mon as any).isResonant = true;
            (mon as any).resonantBonus = Math.floor(bonusPercent * 100);
        }
    }

    // 2. Maestria: Calcula bônus de dano baseado em quantas vezes você DERROTOU aquele TIPO GLOBALMENTE
    static getTypeMasteryBonus(player: Player, targetType: string): number {
        if (!player.pokedexData) return 0;

        // Cache simples para não travar o jogo em loops longos
        if (!(this as any)._masteryCache) (this as any)._masteryCache = {};
        const cacheKey = `${player.id}_${targetType}`;

        // Se quiser recalcular sempre (para atualizar em tempo real), remova estas 2 linhas:
        // if ((this as any)._masteryCache[cacheKey]) return (this as any)._masteryCache[cacheKey];

        let killCount = 0;

        // Varre a Pokédex inteira (GLOBAL)
        // Se matei um Gengar (Fantasma/Veneno), ele conta para Fantasma e conta para Veneno.
        POKEDEX.forEach((dexEntry: any) => {
            // Verifica se o monstro da Pokedex tem o tipo que estamos calculando
            if (dexEntry.type === targetType || dexEntry.secondType === targetType) {
                const entry = player.pokedexData[dexEntry.id];
                if (entry && entry.defeated) {
                    killCount += entry.defeated;
                }
            }
        });

        // Fórmula: 1% de dano extra a cada 10 kills
        //const bonus = Math.floor(killCount / 10);

        // Fórmula: 1% de dano extra a cada 1 kill
        const bonus = killCount;

        (this as any)._masteryCache[cacheKey] = bonus;
        return bonus;
    }

    static win() {
        const Game = (window as any).Game;
        const Network = (window as any).Network;
        const Cards = (window as any).Cards;

        // --- VITÓRIA NO DESAFIO DO CAMPEÃO ---
        if (this.isChampion) {
            Game.sendGlobalLog(`🎉 INACREDITÁVEL! ${this.player!.name} DERROTOU O CAMPEÃO E VENCEU O JOGO! 🎉`);

            if (Network && Network.isOnline) {
                Network.saveGlobalChampion(this.player!); // Salva ele no Firebase global
                Network.sendAction('GAME_WIN', { winnerId: this.player!.id });
            }

            this.end(false);
            Game.triggerVictory(this.player!.id);
            return;
        }
        // ------------------------------------

        // Segurança: Se eu sou o inimigo (cliente passivo), não executo a lógica de vitória do atacante
        if (Network.isOnline && this.isPvP && Network.myPlayerId === this.enemyPlayer?.id) return;

        if (this.isGym) this.player!.effects.curse = false;
        this.revertMew();
        let gain = 0; let msg = "VITÓRIA! ";

        // =========================================================================
        // LÓGICA DA CARTA "NOVO LÍDER" (CORREÇÃO DE UPDATE E BUG DO ZERO)
        // =========================================================================
        // CORREÇÃO: Verifica undefined explicitamente. Se usasse '?' com ID 0, viraria -1.
        const stealTargetId = (this.activeEffects.stealBadgeFrom !== undefined && this.activeEffects.stealBadgeFrom !== null)
            ? Number(this.activeEffects.stealBadgeFrom)
            : -1;

        const enemyId = this.enemyPlayer ? Number(this.enemyPlayer.id) : -2;

        if (this.isPvP && this.enemyPlayer && stealTargetId === enemyId) {
            console.log("🔍 [DEBUG] Iniciando lógica Novo Líder contra ID:", enemyId);

            // 1. Busca os objetos REAIS na memória global (Fonte da Verdade)
            const realWinner = Game.players.find((p: any) => p.id === this.player!.id);
            const realLoser = Game.players.find((p: any) => p.id === this.enemyPlayer!.id);

            if (realWinner && realLoser) {
                const validBadges: number[] = [];

                // 2. Filtra insígnias que o Perdedor TEM e o Vencedor NÃO TEM
                for (let i = 0; i < 8; i++) {
                    if (realLoser.badges[i] === true && realWinner.badges[i] === false) {
                        validBadges.push(i);
                    }
                }

                console.log("🔍 [DEBUG] Valid badges indices:", validBadges);

                if (validBadges.length > 0) {
                    // 3. Sorteio
                    const stolenBadgeIdx = validBadges[Math.floor(Math.random() * validBadges.length)];
                    console.log("🔍 [DEBUG] Stolen badge Index:", stolenBadgeIdx);

                    // 4. ATUALIZAÇÃO LOCAL (CRÍTICO: Atualizar TUDO antes de enviar para rede)

                    // A) Atualiza memória Global do Jogo (Game.players)
                    realWinner.badges[stolenBadgeIdx] = true;
                    realLoser.badges[stolenBadgeIdx] = false;

                    // B) Atualiza referências locais da Batalha (Battle.ts)
                    if (this.player) this.player.badges[stolenBadgeIdx] = true;
                    if (this.enemyPlayer) this.enemyPlayer.badges[stolenBadgeIdx] = false;

                    msg += ` Roubou a Insígnia ${stolenBadgeIdx + 1}!`;

                    // 5. ATUALIZAÇÃO ATÔMICA NO FIREBASE
                    if (Network.isOnline) {
                        const updates: any = {};
                        const playersPath = `rooms/${Network.currentRoomId}/players`;

                        // CORREÇÃO DE CAMINHO: Atualizamos o índice específico
                        updates[`${playersPath}/${realWinner.id}/badges/${stolenBadgeIdx}`] = true;
                        updates[`${playersPath}/${realLoser.id}/badges/${stolenBadgeIdx}`] = false;

                        console.log("🔍 [DEBUG] Updates object:", updates);

                        // Envia o update das badges
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
        // =========================================================================

        if (this.activeEffects.destiny) {
            this.player!.gold += 500; // <--- Aumentado para 500G
            if (Cards) {
                Cards.draw(this.player!); // Puxa a 1ª Carta
                Cards.draw(this.player!); // Puxa a 2ª Carta
            }
            msg += " (+500G +2 Cartas)"; // <--- Atualiza a mensagem na tela
            Game.sendGlobalLog(`💰 [Extrato] ${this.player!.name} recebeu +500G (Carta Destiny).`);
            Game.sendGlobalLog(`💰 [Extrato] Novo Saldo: ${this.player!.gold}G.`);
        }

        if (this.isPvP && this.enemyPlayer) {
            if (this.enemyPlayer.gold > 0) {
                let pct = 0.3;
                if (Game.currentGlobalEvent?.id === 'BLOOD_MOON') pct = 0.6; // O Roubo em PvP é DOBRADO

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
                // Envia pacote com a badge já atualizada localmente para o perdedor aceitar a derrota correta
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

            // ==============================================================
            // NOVO: POKÉDEX (Registra "Derrotado" apenas para Selvagens)
            // ==============================================================
            if (this.opponent) {
                const oppId = this.opponent.id;
                if (!this.player!.pokedexData) this.player!.pokedexData = {};
                if (!this.player!.pokedexData[oppId]) {
                    this.player!.pokedexData[oppId] = { seen: 0, caught: 0, defeated: 0 };
                }
                this.player!.pokedexData[oppId].seen += 1;     // <--- SOMA VISTO
                this.player!.pokedexData[oppId].defeated += 1; // <--- SOMA DERROTADO
            }
            // ==============================================================
        }

        this.player!.gold += gain;
        Game.sendGlobalLog(`💰 [Extrato] Novo Saldo de ${this.player!.name}: ${this.player!.gold}G.`);

        if (Network.isOnline) {
            // Atualiza o vencedor (que ganhou a insígnia localmente no passo 4)
            Network.syncPlayerState();

            // Reforço de segurança
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

        // if (this.player!.badges.every(b => b === true)) {
        //     document.getElementById('battle-modal')!.style.display = 'none';
        //     this.active = false; Game.triggerVictory(this.player!.id);
        //     if(Network.isOnline) Network.sendAction('GAME_WIN', { winnerId: this.player!.id });
        //     return; 
        // }

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

        // ==============================================================
        // NOVO: POKÉDEX (Registra "Visto" ao perder a batalha)
        // Colocamos no topo para garantir que conte mesmo na Derrota Total!
        // ==============================================================
        if (!this.isPvP && !this.isGym && !this.isNPC && this.opponent) {
            const oppId = this.opponent.id;

            // --- BLINDAGEM ---
            if (!this.player!.pokedexData) this.player!.pokedexData = {};
            // -----------------

            if (!this.player!.pokedexData[oppId]) {
                this.player!.pokedexData[oppId] = { seen: 0, caught: 0, defeated: 0 };
            }
            this.player!.pokedexData[oppId].seen += 1;
        }
        // ==============================================================

        // --- LÓGICA DE PERDA DE OURO/INSÍGNIA DIVIDIDA (PVP vs PVE) ---
        if (this.isPvP && this.enemyPlayer) {
            if (this.activeEffects.stealBadgeFrom === this.enemyPlayer.id) {
                // Aposta Novo Líder: Perde insígnia aleatória em vez de ouro
                const unlockedBadges = this.player!.badges.map((b, i) => b ? i : -1).filter(i => i !== -1);
                if (unlockedBadges.length > 0) {
                    const randomBadgeIndex = unlockedBadges[Math.floor(Math.random() * unlockedBadges.length)];
                    this.player!.badges[randomBadgeIndex] = false;
                    Game.sendGlobalLog(`💥 [Derrota no Desafio] ${this.player!.name} apostou alto e perdeu uma Insígnia permanentemente!`);
                } else {
                    Game.sendGlobalLog(`💥 [Derrota no Desafio] Como ${this.player!.name} não possuía nenhuma Insígnia, ele saiu ileso da aposta.`);
                }
            } else {
                // Luta PvP Normal: Perde Ouro
                let penaltyRate = 0.3;
                if (Game.currentGlobalEvent?.id === 'BLOOD_MOON') penaltyRate = 0.6; // Dobra punição na Lua Sangrenta

                let lostGold = 0;
                if (this.player!.gold > 0) {
                    lostGold = Math.floor(this.player!.gold * penaltyRate);
                    this.player!.gold -= lostGold;
                    this.enemyPlayer.gold += lostGold; // O inimigo recebe o ouro visualmente

                    Game.sendGlobalLog(`💰 [Extrato] Transferência de ${lostGold}G de ${this.player!.name} para ${this.enemyPlayer.name} (Luta PvP).`);
                    Game.sendGlobalLog(`💰 [Extrato] Novo Saldo de ${this.player!.name}: ${this.player!.gold}G.`);
                    Game.sendGlobalLog(`💰 [Extrato] Novo Saldo de ${this.enemyPlayer.name}: ${this.enemyPlayer.gold}G.`);
                } else {
                    Game.sendGlobalLog(`💰 [Extrato] ${this.player!.name} já estava falido e não perdeu ouro no PvP.`);
                }
            }

            // --- CORREÇÃO: Sincroniza o PVP antes de verificar se o time todo morreu ---
            if (Network.isOnline) {
                // O SEGREDO: Salvar o Atacante (que perdeu o ouro) JUNTO com o Inimigo de forma atômica!
                // Isso impede que o Firebase devolva o ouro velho antes da tela de derrota.
                const NetworkObj = (window as any).Network;
                if (NetworkObj.syncPlayers) {
                    NetworkObj.syncPlayers([this.player!.id, this.enemyPlayer.id]);
                } else {
                    NetworkObj.syncPlayerState();
                    NetworkObj.syncSpecificPlayer(this.enemyPlayer.id);
                }

                // Manda o aviso visual para o cliente dele
                Network.sendAction('PVP_SYNC_DAMAGE', {
                    targetId: this.enemyPlayer.id,
                    team: this.enemyPlayer.team,
                    gold: this.enemyPlayer.gold,
                    badges: this.enemyPlayer.badges,
                    resetPos: false,
                    skipTurn: false
                });
            }
            // ------------------------

        } else {
            // EVENTO ROCKET: Se perder no mato ou NPC, eles roubam um Pokémon!
            if (!this.isGym && Game.currentGlobalEvent?.id === 'ROCKET') {
                if (this.player!.team.length > 3) {
                    // Pega um alvo que não seja o falecido principal se possível, para drama!
                    const stolenIdx = Math.floor(Math.random() * this.player!.team.length);
                    const stolenMon = this.player!.team.splice(stolenIdx, 1)[0];
                    Game.sendGlobalLog(`🚀 INVASÃO ROCKET! Eles emboscaram e roubararam o ${stolenMon.name} de ${this.player!.name}!!`);
                    msg += ` e a Rocket te roubou!`;
                } else {
                    Game.sendGlobalLog(`🚀 A Equipe Rocket tentou roubar o único Pokémon de ${this.player!.name}, mas ele sobreviveu por pouco!`);
                }
            } else {
                // Em PvE Normal, perde apenas até 100G fixos
                const lostGold = this.player!.gold >= 100 ? 100 : this.player!.gold;
                this.player!.gold = Math.max(0, this.player!.gold - 100);

                if (lostGold > 0) {
                    Game.sendGlobalLog(`💰 [Extrato] ${this.player!.name} deixou cair -${lostGold}G enquanto fugia.`);
                    Game.sendGlobalLog(`💰 [Extrato] Novo Saldo: ${this.player!.gold}G.`);
                }
            }

            // Garante o salvamento imediato do PvE também!
            if (Network.isOnline) {
                Network.syncPlayerState();
            }
        }
        // -----------------------------------------------------

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

        // --- CORREÇÃO DO SALVAMENTO DE GOLD NO PVP ---
        if (Network.isOnline) {
            Network.syncPlayerState();
        }
        // ---------------------------------------------

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
        this.oppTeamList = []; // Limpando lista de pokemons.
        this.isChampion = false;

        // --- BLINDAGEM: LAVA OS STATUS DE VOLTA AO NORMAL ---
        // Quando a luta acaba, tira a ressonância para salvar limpo no banco!
        if (this.player && this.player.team) {
            this.player.team.forEach(mon => {
                if ((mon as any).isResonant) {
                    mon.recalculateStats(false);
                    (mon as any).isResonant = false;
                    (mon as any).resonantBonus = 0;
                }
            });
        }
        // ----------------------------------------------------

        // CORREÇÃO: Limpa todos os efeitos (incluindo o roubo de insígnia)
        // para não vazar para os próximos PvPs normais do tabuleiro.
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
                // 1. Remove a carta de Interferência do inimigo
                this.enemyPlayer.cards.splice(enemyHasJam, 1);

                // 2. Remove a carta de Batalha que você tentou usar
                const myCardIdx = this.player!.cards.findIndex((c: any) => c.id === cardId);
                let cardName = "uma carta";
                if (myCardIdx > -1) {
                    cardName = this.player!.cards[myCardIdx].name;
                    this.player!.cards.splice(myCardIdx, 1);
                }

                document.getElementById('battle-cards-modal')!.style.display = 'none';

                // 3. Atualiza os contadores na tela instantaneamente
                Game.updateHUD();

                // 4. Monta a Pop-up de aviso sem travar a tela
                const jamMsg = `📡 INTERFERÊNCIA!\n\n${this.enemyPlayer.name} anulou a carta ${cardName} de ${this.player?.name} automaticamente!`;
                Game.sendGlobalLog(`📡 ${this.enemyPlayer.name} usou Interferência contra ${this.player?.name} e bloqueou a carta [${cardName}]!`);
                Game.showGlobalAlert(jamMsg, this.player!.name, true, false);

                // 5. Salva OS DOIS JOGADORES no Firebase para ninguém duplicar carta!
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

        // --- NOVA REGRA: MALDIÇÃO BLOQUEIA A MOCHILA NO GINÁSIO ---
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
                    // Oculta itens que não são de captura se for Mega ou Mew
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

    //static openCardSelection() { if (!this.isPlayerTurn || this.processingAction) return; const list = document.getElementById('battle-cards-list')!; list.innerHTML = ''; const battleCards = this.player!.cards.filter(c => c.type === 'battle'); if(battleCards.length === 0) { list.innerHTML = "<em>Sem cartas de batalha.</em>"; } else { battleCards.forEach(c => { const d = document.createElement('div'); d.className='card-item'; d.innerHTML = `<div class="card-info"><span class="card-name">${c.icon} ${c.name} <span class="card-type-badge type-battle">BATTLE</span></span><span class="card-desc">${c.desc}</span></div><button class="btn-use-card" onclick="window.Battle.useCard('${c.id}')">USAR</button>`; list.appendChild(d); }); } document.getElementById('battle-cards-modal')!.style.display = 'flex'; }
    static openCardSelection() {

        const Game = (window as any).Game;
        if (Game.currentGlobalEvent?.id === 'EMP') {
            alert("📡 Cartas bloqueadas pela Tempestade Eletromagnética!");
            return;
        }

        // --- NOVA REGRA: MEGA EVOLUÇÃO / MEW NÃO PODE USAR CARTAS DE BATTALHA EM PVE ---
        if (!this.isPvP && this.activeMon && ((this.activeMon as any).isTemp || (this.activeMon as any).isMegaEvolution)) {
            alert("🧬 Seu parceiro já atingiu o poder máximo! É proibido usar cartas de batalha em Pokémon Mega Evoluídos contra o ambiente selvagem, NPCs ou Ginásios.");
            return;
        }

        if (!this.isPlayerTurn || this.processingAction) return;
        const list = document.getElementById('battle-cards-list')!;
        list.innerHTML = '';

        // Ajuste no contêiner do Modal de Batalha
        const modalContent = document.querySelector('#battle-cards-modal .modal-content') as HTMLElement;
        if (modalContent) {
            modalContent.style.width = "90%";
            modalContent.style.maxWidth = "1100px";
            modalContent.style.maxHeight = "85vh"; // Altura maior para ver o corpo da carta
            modalContent.style.padding = "25px";
            modalContent.style.overflowY = "auto";
        }

        const battleCards = this.player!.cards.filter(c => c.type === 'battle');

        if (battleCards.length === 0) {
            list.innerHTML = "<em>Sem cartas de batalha.</em>";
            list.style.display = 'block';
        } else {
            list.style.display = 'grid';
            // Ajustado para preencher o espaço e aumentar o tamanho mínimo das cartas
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

    // =========================================================================================
    // NOVA LÓGICA DE FUGA - 50% BASE + D20
    // =========================================================================================

    static run() {
        // 1. Onde a fuga é permitida: Só contra selvagem
        // Em PvP, Gym e NPC, fuga só por carta.
        if (this.isPvP || this.isNPC || this.isGym) {
            alert("Não pode fugir de treinadores!");
            return;
        }

        this.processingAction = true;
        this.updateButtons();

        // 2. Cálculo da Chance
        const baseChance = 50;
        const d6 = Math.floor(Math.random() * 6) + 1;
        const modifier = (d6 * 4) - 14; // Varia de -10 a +10
        let finalChance = baseChance + modifier;

        // Limites (sempre haverá 5% de chance de erro ou acerto crítico extremo)
        finalChance = Math.max(5, Math.min(95, finalChance));

        this.logBattle(`Tentando fugir... (🎲${d6}) Chance: ${finalChance}%`, true);

        setTimeout(() => {
            const roll = Math.floor(Math.random() * 100) + 1;

            if (roll <= finalChance) {
                // SUCESSO
                this.logBattle("🏃 Escapou com sucesso!", true);
                this.activeMon!.gainXp(5, this.player!);

                // ==============================================================
                // NOVO: POKÉDEX (Registra "Visto" ao Fugir)
                // ==============================================================
                if (this.opponent) {
                    const oppId = this.opponent.id;

                    // --- BLINDAGEM ---
                    if (!this.player!.pokedexData) this.player!.pokedexData = {};
                    // -----------------

                    if (!this.player!.pokedexData[oppId]) {
                        this.player!.pokedexData[oppId] = { seen: 0, caught: 0, defeated: 0 };
                    }
                    this.player!.pokedexData[oppId].seen += 1;

                    // Força o salvamento na hora da fuga!
                    const Network = (window as any).Network;
                    if (Network.isOnline) Network.syncPlayerState();
                }
                // ==============================================================

                setTimeout(() => this.end(false), 1000);
            } else {
                // FALHA NA FUGA
                this.logBattle("🚫 Falha na fuga! O inimigo vai atacar.", true);

                // 3. Inimigo ataca imediatamente
                setTimeout(() => {
                    this.performEnemyAttack(() => {
                        this.processingAction = false;
                        this.updateButtons();
                    });
                }, 1000);
            }
        }, 1000);
    }

    // =========================================================================================
    // USO DE ITEM COM PENALIDADE DE TURNO (AGORA PARA PVP E PVE)
    // =========================================================================================

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

            // Sincroniza uso de item
            if (Network.isOnline) {
                Network.sendAction('BATTLE_UPDATE', {
                    plyHp: this.activeMon!.currentHp,
                    oppHp: this.opponent!.currentHp,
                    msg: `Usou ${data.name}!`
                });
            }

            // Regra Geral: Usar item gasta turno -> Inimigo ataca
            // No PvP agora funciona igual PvE
            setTimeout(() => {
                this.performEnemyAttack(() => {
                    this.processingAction = false;
                    this.updateButtons();
                });
            }, 1500);
        }

        if (Network.isOnline) Network.syncPlayerState();
    }

    // =========================================================================
    // SEQUÊNCIA DE ANIMAÇÃO CORRIGIDA (ARREMESSO -> QUEDA -> SHAKE)
    // =========================================================================
    static async animateCaptureSequence(ballIcon: string, isSuccess: boolean): Promise<void> {
        const scene = document.querySelector('.battle-scene') as HTMLElement;
        const enemyImg = document.getElementById('opp-img') as HTMLElement;

        // Limpeza de segurança (caso tenha sobrado algo)
        const oldBall = document.querySelector('.anim-ball');
        if (oldBall) oldBall.remove();

        // 1. Cria a Bola
        const ball = document.createElement('div');
        ball.className = 'anim-ball';
        ball.style.backgroundImage = `url('/assets/img/Itens/${ballIcon}')`;
        scene.appendChild(ball);

        // --- FASE 1: ARREMESSO (600ms) ---
        ball.classList.add('anim-throwing');
        await this.wait(600); // Espera a bola chegar no alvo

        // --- FASE 2: IMPACTO & CAPTURA VISUAL ---
        // Cria flash de luz
        const flash = document.createElement('div');
        flash.className = 'anim-flash';
        scene.appendChild(flash);
        setTimeout(() => flash.remove(), 300);

        // Oculta o Pokémon (Sugado para dentro)
        if (enemyImg) enemyImg.classList.add('mon-caught-hidden');

        // Remove classe de arremesso para preparar a queda
        ball.classList.remove('anim-throwing');

        // --- FASE 3: QUEDA AO CHÃO (500ms) ---
        // A bola "pula" um pouco e cai no chão
        ball.classList.add('anim-falling');
        await this.wait(500);

        // --- FASE 4: SHAKES (Balançadas no chão) ---
        // Remove a queda e fixa a posição no chão via classe CSS do shake
        ball.classList.remove('anim-falling');

        // Determina quantos shakes fazer
        // Se capturou: 3 shakes + click
        // Se falhou: 1 ou 2 shakes aleatórios
        const totalShakes = isSuccess ? 3 : (Math.random() > 0.5 ? 2 : 1);

        for (let i = 0; i < totalShakes; i++) {
            await this.wait(400); // Pausa entre shakes (tensão)

            ball.classList.add('anim-shaking');
            this.logBattle(`... (${i + 1})`, false); // Log visual

            await this.wait(600); // Duração do shake
            ball.classList.remove('anim-shaking');
        }

        await this.wait(400); // Pausa dramática final

        // --- FASE 5: FINALIZAÇÃO ---
        if (isSuccess) {
            // Sucesso: Bola apaga um pouco, Pokémon continua oculto
            ball.style.filter = "brightness(0.5)"; // Bola "desliga"
            await this.wait(500);
            ball.remove();
        } else {
            // Falha: Pokémon explode para fora
            ball.style.opacity = '0'; // Bola some
            if (enemyImg) {
                enemyImg.classList.remove('mon-caught-hidden'); // Pokémon reaparece
                // Pequena animação de "pop" ao sair (opcional, via CSS transition já resolve)
            }
            await this.wait(300);
            ball.remove();
        }
    }

    static async attemptCapture(item: ItemData) {
        if (!this.opponent || !this.activeMon) return;

        // 1. Trava Interface
        this.processingAction = true;
        this.updateButtons();

        const opponent = this.opponent;


        this.logBattle(`Jogou ${item.name}!`, true);

        // 2. CÁLCULO IMEDIATO
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
            const powerPenalty = Math.floor(oppStats / 15);

            let rarityPenalty = 0;
            if (opponent.isLegendary) rarityPenalty += 10;
            if (opponent.isShiny) rarityPenalty += 10;

            const d6 = Math.floor(Math.random() * 6) + 1;
            const diceBonus = (d6 * 4) - 14;

            let chanceBeforeBall = baseChance + hpBonus - powerPenalty - rarityPenalty + diceBonus;

            // --- Trava Mínima ---
            let travaMsg = "";
            if (chanceBeforeBall < 15) {
                chanceBeforeBall = 15;
                travaMsg = " (Trava Min 15%)";
            }

            let ballBonus = 0;
            if (item.id === 'greatball') ballBonus = 20;
            else if (item.id === 'ultraball') ballBonus = 40;

            let chance = chanceBeforeBall + ballBonus;

            // --- EVENTO: SAFARI ZONE (Buff de Captura) ---
            const Game = (window as any).Game;
            let safariBonus = 0;
            if (Game.currentGlobalEvent?.id === 'SAFARI_ZONE') {
                safariBonus = 50;
                chance += safariBonus;
            }

            chance = Math.min(Game.currentGlobalEvent?.id === 'SAFARI_ZONE' ? 100 : 95, chance);

            // Log atualizado com todos os detalhes da conta
            let logMsg = `Cálc: Base(15) + HP(+${hpBonus}) - Resist(-${powerPenalty}) - Rari(-${rarityPenalty}) + Dado(🎲${d6}: ${diceBonus > 0 ? '+' : ''}${diceBonus})`;
            logMsg += ` = ${chanceBeforeBall}%${travaMsg}`;
            logMsg += ` | Bola(+${ballBonus}%)`;
            if (safariBonus > 0) logMsg += ` | Safari(+${safariBonus}%)`;
            logMsg += ` => Final: ${chance}%`;

            this.logBattle(logMsg, true);

            const roll = Math.floor(Math.random() * 100) + 1;
            success = (roll <= chance);
        }

        // 3. EXECUTA A SEQUÊNCIA VISUAL COMPLETA
        // O código espera essa linha terminar antes de decidir o destino do monstro
        await this.animateCaptureSequence(item.icon, success);

        // 4. APLICA O RESULTADO
        if (success) {
            this.captureSuccess();
        } else {
            this.logBattle("Aargh! Quase! O Pokémon escapou!", true);

            // Se falhar, inimigo ataca
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

        // =========================================================================
        // CORREÇÃO: Reverte o Mew imediatamente!
        // Garante que ele não vá para a tela de Swap nem seja salvo no Firebase.
        // =========================================================================
        this.revertMew();
        this.updateUI(); // Opcional, mas ajuda a limpar a HUD visualmente
        // =========================================================================

        // ==============================================================
        // NOVO: POKÉDEX (Registra "Capturado" apenas para Selvagens)
        // ==============================================================
        if (this.opponent) {
            const oppId = this.opponent.id;
            if (!this.player!.pokedexData) this.player!.pokedexData = {};
            if (!this.player!.pokedexData[oppId]) {
                this.player!.pokedexData[oppId] = { seen: 0, caught: 0, defeated: 0 };
            }
            this.player!.pokedexData[oppId].seen += 1;   // <--- SOMA VISTO
            this.player!.pokedexData[oppId].caught += 1; // <--- SOMA CAPTURADO
        }
        // ==============================================================

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