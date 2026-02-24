import { Player } from '../models/Player';
import { Pokemon } from '../models/Pokemon';
import { GYM_DATA } from '../constants/gyms';
import { TYPE_CHART } from '../constants/typeChart';
import { SHOP_ITEMS } from '../constants';
import type { ItemData } from '../constants';
import { Cards } from './Cards';

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
    static currentTerrain: number = 0;
    static isAutoPvE: boolean = false;

    static setup(player: Player, enemyMon: any, isPvP: boolean = false, _label: string = "", reward: number = 0, enemyPlayer: Player | null = null, isGym: boolean = false, gymId: number = 0, npcImage: string = "", terrainTile: number = 1) {
        const Game = (window as any).Game;
        this.player = player; this.isPvP = isPvP; this.isNPC = (reward > 0 && !isPvP); this.isGym = isGym; this.gymId = gymId; this.reward = reward; this.enemyPlayer = enemyPlayer; this.processingAction = false;
        this.activeEffects = {};
        this.battleTitle = isPvP ? "Batalha PvP!" : `Batalha contra ${_label}!`;
        this.isAutoPvE = false;
        
        this.currentTerrain = terrainTile;

        // --- NOVA LÓGICA DE SELEÇÃO AUTOMÁTICA PVP ---
        if (isPvP && enemyPlayer) { 
            // Calcula a quantidade (Rodada 1-19 = 1v1 | 20-39 = 2v2 | 40-59 = 3v3 ...)
            const pkmnCount = 1 + Math.floor((Game.round || 1) / 20);

            // Pega apenas os vivos de cada lado
            let myAlive = player.team.filter(p => !p.isFainted());
            let oppAlive = enemyPlayer.team.filter(p => !p.isFainted());

            // Embaralha aleatoriamente e corta pelo limite da rodada
            myAlive = myAlive.sort(() => Math.random() - 0.5).slice(0, pkmnCount);
            oppAlive = oppAlive.sort(() => Math.random() - 0.5).slice(0, pkmnCount);

            this.plyTeamList = myAlive;
            this.oppTeamList = oppAlive;
            this.opponent = this.oppTeamList[0]; 
            
            if (enemyPlayer.effects.curse) { this.logBattle(`☠️ ${enemyPlayer.name} está amaldiçoado! (Dano reduzido)`); }
        } 
        // ---------------------------------------------
        else if (isGym) {
            const gymData = GYM_DATA.find(g => g.id === gymId);
            const globalAvg = Game.getGlobalAverageLevel();
            const gymLevel = globalAvg + 1; // Regra 1: Mantém o level como estava

            const teamSize = Math.min(6, Math.max(2, Game.getGlobalAverageTeamSize() + 1)); // Regra 1: Mantém a quantidade
            
            const dynamicTeams = Game.gymTeams || {}; 
            let rosterIds = dynamicTeams[gymId] || (gymData ? gymData.teamIds : [130]);
            const battleIds = rosterIds.slice(0, teamSize);

            // --- ATIVANDO O MODO BOSS (Quarto parâmetro = true) ---
            // Isso diz para o Pokémon que ele é um Líder (IVs 20 e Escala +5)
            this.oppTeamList = battleIds.map((id: number) => new Pokemon(id, gymLevel, false, true));
            this.opponent = this.oppTeamList[0];
            // ------------------------------------------------------
            
            this.plyTeamList = player.getBattleTeam(true);
            if (this.plyTeamList.length === 0) {
                 this.plyTeamList = player.team.filter(p => !p.isFainted());
            }
        } else { 
            this.oppTeamList = Array.isArray(enemyMon) ? enemyMon : [enemyMon]; 
            this.opponent = this.oppTeamList[0]; 
            this.plyTeamList = player.getBattleTeam(true); 
        }

        if(this.plyTeamList.length === 0) { 
            Game.handleTotalDefeat(player);
            Game.nextTurn();
            return; 
        }
        
        if(this.isNPC && npcImage) { (this.opponent as any)._npcImage = npcImage; (this.opponent as any)._npcName = _label; }
        
        if (this.isGym && this.player.effects.curse) {
            this.logBattle("😈 CUIDADO! Você entrou no Ginásio Amaldiçoado! Dano reduzido e Itens bloqueados!", true);
        }

        // --- BYPASS: Inicia direto sem perguntar no PvP ---
        if (this.isPvP) {
            this.startRound(this.plyTeamList[0]);
        } else {
            // --- NOVA LÓGICA: TÍTULO DESCRITIVO BASEADO NO TERRENO/INIMIGO ---
            let terrainName = "Terreno Selvagem";
            if (this.currentTerrain === 1) terrainName = "Mato Alto 🌿";
            else if (this.currentTerrain === 2) terrainName = "Águas Profundas 🌊";
            else if (this.currentTerrain === 3) terrainName = "Caverna/Deserto 🪨";

            let contextTitle = "";
            if (this.isGym) {
                // --- NOVA LÓGICA: BUSCA NOME E TIPOS DIRETAMENTE NO GYM_DATA ---
                const gymData = GYM_DATA.find(g => g.id === this.gymId);
                let gymDesc = `Ginásio de ${_label}`; // Fallback de segurança
                
                if (gymData) {
                    const typesStr = gymData.type.join(" e "); // Junta ["Pedra", "Aço"] em "Pedra e Aço"
                    gymDesc = `Ginásio do ${gymData.leaderName} de ${typesStr}`;
                }
                
                contextTitle = `🏛️ <b>${gymDesc}</b><br><small style="color:#bdc3c7; font-size:0.9rem;">Escolha seu Pokémon para a batalha!</small>`;
                // ---------------------------------------------------------------
            } else if (this.isNPC) {
                contextTitle = `👤 <b>O Treinador ${_label} te desafiou!</b><br><small style="color:#bdc3c7; font-size:0.9rem;">Escolha seu Pokémon para começar.</small>`;
            } else {
                contextTitle = `🐾 <b>Um Pokémon selvagem apareceu!</b><br><small style="color:#f1c40f; font-size:0.9rem;">Local: ${terrainName}</small>`;
            }
            
            this.openSelectionModal(contextTitle);
            // -----------------------------------------------------------------
        }
        this.isAutoPvE = false;
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
            if(!mon.isFainted()) div.onclick = () => { modal.style.display = 'none'; this.startRound(mon); }; 
            list.appendChild(div); 
        }); 
        modal.style.display = 'flex'; 
    }

    static startRound(selectedMon: Pokemon) { 
        const Network = (window as any).Network; 
        document.getElementById('pkmn-select-modal')!.style.display = 'none'; 
        this.active = true; 
        this.activeMon = selectedMon; 
        
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
        
        if(Network.isOnline && this.player!.id === Network.myPlayerId) { 
            const npcImg = (this.opponent as any)._npcImage || ""; 
            const npcName = (this.opponent as any)._npcName || ""; 
            const startingId = this.player!.id;

            Network.sendAction('BATTLE_START', { 
                pId: this.player!.id, 
                monIdx: this.player!.team.indexOf(this.activeMon), 
                oppTeam: Network.getSanitizedTeam(this.oppTeamList), 
                plyTeam: Network.getSanitizedTeam(this.plyTeamList), // <-- NOVO: Envia o time sorteado
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
        if(this.isPvP) { 
            runBtn.disabled = true; 
            if(autoBtn) autoBtn.style.display = 'none'; // Esconde Auto PvE no PvP
        } else if (this.isGym) {
            runBtn.disabled = true;
            if(autoBtn) autoBtn.style.display = 'block';
        } else {
            if(autoBtn) autoBtn.style.display = 'block';
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
        this.activeMon = p.team[payload.monIdx]; 
        
        this.isPvP = payload.isPvP; 
        this.isGym = payload.isGym; 
        this.gymId = payload.gymId; 
        this.isNPC = (!payload.isPvP && payload.reward > 0); 
        if(payload.enemyId >= 0) this.enemyPlayer = Game.players[payload.enemyId]; 
        
        // === CORREÇÃO DO ESPECTADOR (Prevenção de Crash) ===
        if (payload.isPvP && payload.plyTeam) {
            const PokemonClass = (window as any).Pokemon || p.team[0].constructor;
            this.plyTeamList = payload.plyTeam.map((td: any) => {
                 const po = new PokemonClass(td.id, td.level, td.isShiny);
                 Object.assign(po, td);
                 return po;
            });
            // Acha qual Pokémon da lista é o atual
            this.activeMon = this.plyTeamList.find((m: any) => m.id === p.team[payload.monIdx]?.id) || this.plyTeamList[0];
        } else {
            this.plyTeamList = p.getBattleTeam(payload.isGym).slice(0, payload.isGym ? 6 : 3);
            this.activeMon = p.team[payload.monIdx]; 
        }

        if (this.isPvP && this.enemyPlayer) {
            if (payload.oppTeam && payload.oppTeam.length > 0) {
                const PokemonClass = (window as any).Pokemon || p.team[0].constructor;
                this.oppTeamList = payload.oppTeam.map((td: any) => {
                     const po = new PokemonClass(td.id, td.level, td.isShiny);
                     Object.assign(po, td);
                     return po;
                });
            } else {
                this.oppTeamList = this.enemyPlayer.getBattleTeam(false);
            }
            this.opponent = this.oppTeamList[0];
        // ----------------------------------------------------------------------
        } else {
            if (payload.oppTeam && payload.oppTeam.length > 0) {
                const PokemonClass = (window as any).Pokemon || p.team[0].constructor;
                this.oppTeamList = payload.oppTeam.map((td: any) => {
                     const po = new PokemonClass(td.id, td.level, td.isShiny);
                     Object.assign(po, td);
                     return po;
                });
                this.opponent = this.oppTeamList[0];
            } else if (payload.oppData) {
                this.opponent = new Pokemon(payload.oppData.id, payload.oppData.level, payload.oppData.isShiny); 
                Object.assign(this.opponent, payload.oppData); 
                this.oppTeamList = [this.opponent];
            }
        }
        
        if(payload.npcImage && this.opponent) (this.opponent as any)._npcImage = payload.npcImage; 
        if(payload.npcName && this.opponent) (this.opponent as any)._npcName = payload.npcName; 
        if(payload.battleTitle) this.battleTitle = payload.battleTitle; 
        
        if (payload.startingTurnId !== undefined) {
            this.isPlayerTurn = (payload.startingTurnId === Network.myPlayerId);
        } else {
            this.isPlayerTurn = (payload.pId === Network.myPlayerId); 
        }

        this.plyTeamList = p.getBattleTeam(payload.isGym).slice(0, payload.isGym ? 6 : 3);
        this.renderBattleScreen(); 
    }
    
    static updateFromNetwork(payload: any) {
        if(!this.activeMon || !this.opponent) return;
        
        // CORREÇÃO CRÍTICA: Só atualiza o HP se ele vier no payload.
        // Isso impede que o HP zere/bugue quando enviamos apenas um log de texto!
        if (payload.plyHp !== undefined) this.activeMon.currentHp = payload.plyHp;
        if (payload.oppHp !== undefined) this.opponent.currentHp = payload.oppHp;
        
        if(payload.msg) this.logBattle(payload.msg);
        
        this.updateUI();
    }

    static renderBattleScreen() {
        const Network = (window as any).Network; 
        document.getElementById('pkmn-select-modal')!.style.display = 'none';
        document.getElementById('battle-modal')!.style.display = 'flex';
        document.getElementById('battle-log-history')!.innerHTML = '';
        
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
        switch(this.currentTerrain) {
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

    static calculateDamage(attacker: Pokemon, defender: Pokemon, isPlayerAttacking: boolean): { damage: number, msg: string, avoided: boolean } { 
        // 1. CÁLCULO DE ESQUIVA (Mantém igual)
        let dodgeChance = (defender.speed - attacker.speed) / 5;

        // Garante que a esquiva nunca seja menor que 10% (A regra do mínimo)
        dodgeChance = Math.max(10, dodgeChance);

        // --- NOVA LÓGICA SNIPER: Ignora a esquiva se tiver a carta ativa ---
        const ignoreDodge = (isPlayerAttacking && this.activeEffects.sniper);

        if (!ignoreDodge && Math.random() * 100 <= dodgeChance) {
            return { damage: 0, msg: "💨 ESQUIVOU!", avoided: true };
        }

        // 2. ATAQUE BASE HÍBRIDO (Mantém igual)
        // Soma ponderada: 65% ATK + 15% SPD + 20% HP
        const baseAtk = (attacker.atk * 0.65) + (attacker.speed * 0.15) + (attacker.maxHp * 0.2);

        // 3. DANO BASE (Sua fórmula nova)
        // Dano = (AtaqueBase / 5) - (DEF / 20)
        let finalDamage = (baseAtk / 5) - (defender.def / 20);

        // Garante que o dano base nunca seja negativo antes dos modificadores
        finalDamage = Math.max(1, finalDamage);

        let logDetails = "";

        // 4. CRÍTICO E DADO (Mantém igual)
        const spdCritChance = attacker.speed / 8;
        if (Math.random() * 100 <= spdCritChance) {
            finalDamage += 5;
            logDetails += " ⚡Crit.Vel!";
        }

        // 5. DADO D6 (Sorte/Azar)
        const d6 = Math.floor(Math.random() * 6) + 1;
        let rollModifier = 0; 
        if (d6 === 6) { rollModifier = +5; logDetails += " 🎲Crit!"; } 
        else if (d6 === 5) rollModifier = +3; 
        else if (d6 === 4) rollModifier = +2; 
        else if (d6 === 2) rollModifier = -1; 
        else if (d6 === 1) rollModifier = -2; 
        finalDamage += rollModifier;

        // =================================================================================
        // 5. NOVO SISTEMA: MELHOR VANTAGEM (O Pokémon escolhe seu melhor tipo)
        // =================================================================================
        
        // Lista os tipos presentes (remove vazios)
        const atkTypes = [attacker.type, attacker.secondType].filter(t => t);
        const defTypes = [defender.type, defender.secondType].filter(t => t);

        let bestMulti = 0; // Vai guardar a maior vantagem possível

        // O atacante testa mentalmente cada um dos seus tipos para ver qual machuca mais
        atkTypes.forEach(atkT => {
            let currentTypeMulti = 1; // Começa neutro para este tipo de ataque
            
            // Multiplica o efeito contra todos os tipos do defensor (Igual Pokémon Original)
            defTypes.forEach(defT => {
                let factor = 1; 
                if (TYPE_CHART[atkT] && (TYPE_CHART[atkT] as any)[defT] !== undefined) {
                    const val = (TYPE_CHART[atkT] as any)[defT];
                    if (val > 1) factor = 1.75;      // Vantagem
                    else if (val < 1) factor = 0.75; // Desvantagem
                }
                currentTypeMulti *= factor; 
            });

            // Se esse tipo causou mais dano que o tipo anterior testado, o Pokémon usa ele!
            if (currentTypeMulti > bestMulti) {
                bestMulti = currentTypeMulti;
            }
        });

        const finalMulti = bestMulti;
        
        // Aplica o multiplicador no dano
        finalDamage = Math.floor(finalDamage * finalMulti);

        // Define o ícone do log baseado no resultado final
        if (finalMulti >= 1.5) logDetails += " 🔥!"; // Muito efetivo (Aparece se for 1.75 ou maior)
        else if (finalMulti > 1.0) logDetails += " ⚔️"; // Levemente efetivo
        else if (finalMulti < 1.0) logDetails += " 🛡️."; // Pouco efetivo (Nenhum tipo ajudou)
        
        // =================================================================================

        finalDamage = Math.max(0, Math.floor(finalDamage));

        // Aplica modificadores de cartas (Mantém igual)
        if (isPlayerAttacking) { 
            if (this.activeEffects.crit > 0) { 
                finalDamage *= 2; 
                this.activeEffects.crit--; // Gasta 1 carga
                logDetails += ` [2x] (Restam: ${this.activeEffects.crit})`; 
            }
            if (this.activeEffects.focus) { finalDamage *= 4; this.activeEffects.focus = false; logDetails += " [4x]"; } 
            // --- CORREÇÃO: Maldição só corta o dano se for contra Ginásio ---
            if (this.player?.effects.curse && this.isGym) { 
                finalDamage = Math.floor(finalDamage / 2); 
                logDetails += " [😈Amaldiçoado]"; 
            }
        } else { 
            if (this.activeEffects.guard) { finalDamage = Math.floor(finalDamage / 2); logDetails += " [🛡️]"; } 
            if (this.enemyPlayer && this.enemyPlayer.effects.curse) { finalDamage = Math.floor(finalDamage / 2); } 
        } 
        
        return { damage: finalDamage, msg: `(🎲${d6})${logDetails}`, avoided: false };
    }
    
    // =========================================================================================
    // LÓGICA UNIFICADA DE BATALHA (PvE e PvP Automático)
    // =========================================================================================

    static attack() { 
        const Network = (window as any).Network; 
        if(Network.isOnline && this.player && this.player.id !== Network.myPlayerId) return;

        if(!this.activeMon || !this.opponent) return; 

        this.processingAction = true; 
        this.updateButtons(); 

        const playerSpeed = this.activeMon.speed;
        const enemySpeed = this.opponent.speed;
        let playerGoesFirst = true;

        if (playerSpeed > enemySpeed) playerGoesFirst = true;
        else if (enemySpeed > playerSpeed) playerGoesFirst = false;
        else playerGoesFirst = Math.random() > 0.5;

        // --- FUNÇÃO AUXILIAR PARA FINALIZAR O TURNO E VERIFICAR AUTO ---
        const finishTurnSequence = () => {
            this.processingAction = false;
            this.updateButtons();

            // Lógica de PvP Automático (Já existente)
            if (this.isPvP) {
                setTimeout(() => this.autoAttackNext(), 1500);
            }
            // Lógica de PvE Automático (NOVA)
            else if (this.isAutoPvE) {
                // Só continua se ambos estiverem vivos
                if (this.activeMon!.currentHp > 0 && this.opponent!.currentHp > 0) {
                    setTimeout(() => this.attack(), 1500); // Delay para dar tempo de ler o dano
                } else {
                    // Se alguém morreu, o handleFaint ou win vai rodar.
                    // Nós desligamos o Auto aqui para o jogador ter controle na troca.
                    this.isAutoPvE = false;
                    const btn = document.getElementById('btn-auto-pve');
                    if(btn) { 
                        btn.innerText = "⚡ Auto Atacar"; 
                        btn.classList.remove('active-auto'); 
                    }
                }
            }
        };
        // -------------------------------------------------------------

        this.logBattle(`Velocidade: ${this.activeMon.name}(${playerSpeed}) vs ${this.opponent.name}(${enemySpeed})`, true);

        if (playerGoesFirst) {
            this.logBattle(`💨 ${this.activeMon.name} é mais rápido!`, true);
            this.performPlayerAttack(() => {
                if (this.opponent && this.opponent.currentHp > 0) {
                    setTimeout(() => {
                        this.performEnemyAttack(() => {
                            finishTurnSequence(); // <--- CHAMA O FINALIZADOR AQUI
                        });
                    }, 1000);
                } else {
                    finishTurnSequence(); // <--- OU AQUI SE O INIMIGO MORREU NO PRIMEIRO HIT
                }
            });
        } else {
            this.logBattle(`💨 ${this.opponent.name} é mais rápido!`, true);
            this.performEnemyAttack(() => {
                if (this.activeMon && this.activeMon.currentHp > 0) {
                    setTimeout(() => {
                        this.performPlayerAttack(() => {
                            finishTurnSequence(); // <--- CHAMA O FINALIZADOR AQUI
                        });
                    }, 1000);
                } else {
                    finishTurnSequence(); // <--- OU AQUI SE VOCÊ MORREU NO PRIMEIRO HIT
                }
            });
        }
    }

    // Ação isolada de ataque do Jogador
    static performPlayerAttack(callback?: () => void) {
        const Network = (window as any).Network;
        if(!this.activeMon || !this.opponent) return;

        // --- CÁLCULO DO PRIMEIRO ATAQUE ---
        let calc1 = this.calculateDamage(this.activeMon, this.opponent, true); 
        let totalDmg = calc1.damage;
        let logMsg = `${this.activeMon.name} atacou! `;

        if (calc1.avoided) {
            logMsg += `${calc1.msg}`;
        } else {
            logMsg += `💥${calc1.damage} ${calc1.msg}`;
        }

        // --- CÁLCULO DO ATAQUE DUPLO (SPEED) ---
        // Se SPD >= 50% maior que oponente -> 20% chance de atacar duas vezes
        if (!calc1.avoided && this.activeMon.speed >= (this.opponent.speed * 1.5)) {
            if (Math.random() * 100 <= 20) {
                // Removemos a variável isDouble aqui
                let calc2 = this.calculateDamage(this.activeMon, this.opponent, true);
                
                // Se o segundo não for esquivado, soma
                if (!calc2.avoided) {
                    totalDmg += calc2.damage;
                    logMsg += ` + ⚔️DUPLO! 💥${calc2.damage}`;
                } else {
                    logMsg += ` + ⚔️DUPLO! (Errou)`;
                }
            }
        }
        // ----------------------------------------
        
        this.opponent.currentHp = Math.max(0, this.opponent.currentHp - totalDmg); 
        this.logBattle(logMsg); 
        this.updateUI(); 

        if (Network.isOnline) {
             Network.sendAction('BATTLE_UPDATE', { 
                plyHp: this.activeMon.currentHp, 
                oppHp: this.opponent.currentHp, 
                msg: logMsg
            });
            if (this.isPvP && this.enemyPlayer) {
                Network.syncSpecificPlayer(this.enemyPlayer.id);
            }
        }

        if(this.opponent.currentHp <= 0) { 
            const oppStats = this.opponent.maxHp + this.opponent.atk + this.opponent.def + this.opponent.speed;
            const xpGain = Math.max(1, Math.floor(oppStats / 15));
            this.activeMon.gainXp(xpGain, this.player!);
            this.updateUI(); 
            if (Network.isOnline) Network.syncPlayerState();
            setTimeout(() => { this.checkWinCondition(); }, 1000); 
        } else {
            if(callback) callback();
        }
    }
    
    // Ação isolada de ataque do Inimigo (Controlado automaticamente pelo Cliente do Jogador Ativo)
    static performEnemyAttack(callback?: () => void) {
        if(!this.activeMon || !this.opponent) return;
        const Network = (window as any).Network;

        if (this.activeEffects.stunOpponent && this.activeEffects.stunOpponent > 0) { 
            this.activeEffects.stunOpponent--; 
            this.logBattle("⚡ Inimigo atordoado! Não conseguiu atacar."); 
            if(callback) callback();
            return; 
        } 

        // --- CÁLCULO DO PRIMEIRO ATAQUE ---
        let calc1 = this.calculateDamage(this.opponent, this.activeMon, false); 
        let totalDmg = calc1.damage;
        let logMsg = `${this.opponent.name} atacou! `;

        if (calc1.avoided) {
            logMsg += `${calc1.msg}`;
        } else {
            logMsg += `💥${calc1.damage} ${calc1.msg}`;
        }

        // --- CÁLCULO DO ATAQUE DUPLO (SPEED) ---
        if (!calc1.avoided && this.opponent.speed >= (this.activeMon.speed * 1.5)) {
            if (Math.random() * 100 <= 20) {
                let calc2 = this.calculateDamage(this.opponent, this.activeMon, false);
                if (!calc2.avoided) {
                    totalDmg += calc2.damage;
                    logMsg += ` + ⚔️DUPLO! 💥${calc2.damage}`;
                } else {
                    logMsg += ` + ⚔️DUPLO! (Errou)`;
                }
            }
        }
        // ----------------------------------------
        
        this.activeMon.currentHp = Math.max(0, this.activeMon.currentHp - totalDmg); 
        this.logBattle(logMsg); 
        this.updateUI(); 
        
        // Lógica de Counter (Reflete o dano total recebido)
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
        
        if(Network.isOnline) { 
            Network.sendAction('BATTLE_UPDATE', { plyHp: this.activeMon.currentHp, oppHp: this.opponent.currentHp, msg: logMsg }); 
            Network.syncPlayerState();
        } 
        
        if(this.activeMon.currentHp <= 0) { 
            const oppStats = this.opponent.maxHp + this.opponent.atk + this.opponent.def + this.opponent.speed;
            const xpGain = Math.max(1, Math.floor(oppStats / 45));
            this.activeMon.gainXp(xpGain, this.player!);

            if (this.isPvP && this.enemyPlayer) {
                const plyStats = this.activeMon.maxHp + this.activeMon.atk + this.activeMon.def + this.activeMon.speed;
                const oppXpGain = Math.max(1, Math.floor(plyStats / 15));
                this.opponent.gainXp(oppXpGain, this.enemyPlayer);
                if (Network.isOnline) Network.syncSpecificPlayer(this.enemyPlayer.id);
            }

            this.updateUI(); 
            if (Network.isOnline) Network.syncPlayerState();
            setTimeout(() => { this.handleFaint(); }, 1000); 
        } else { 
            if(callback) callback();
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
        
        const nextOpp = this.oppTeamList.find(p => !p.isFainted() && p !== this.opponent); 
        
        if (nextOpp) { 
            // --- CORREÇÃO 1: Preserva a imagem e nome do NPC ---
            const oldImg = (this.opponent as any)._npcImage;
            const oldName = (this.opponent as any)._npcName;
            
            this.opponent = nextOpp; 
            
            if(oldImg) (this.opponent as any)._npcImage = oldImg;
            if(oldName) (this.opponent as any)._npcName = oldName;
            // ---------------------------------------------------

            this.logBattle(`Rival enviou ${nextOpp.name}!`, true); 
            this.updateUI(); 
            this.processingAction = false; 
            this.updateButtons(); 
            
            const Network = (window as any).Network;
            if(Network.isOnline && this.player && this.player.id === Network.myPlayerId) {
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

        if (this.activeMon && (this.activeMon as any).isTemp) {
            this.logBattle("🧬 O DNA de Mew se esgotou e o Pokémon original retornou!");
            this.revertMew();
            this.updateUI();
            if (this.activeMon.currentHp <= 0) { } 
            else {
                this.processingAction = false;
                this.updateButtons();
                const Network = (window as any).Network;
                if(Network.isOnline) Network.syncPlayerState();
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
                 if(Network.isOnline && this.player && this.player.id === Network.myPlayerId) {
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
        if(el) el.innerText = msg; 
        
        const logContainer = document.getElementById('battle-log-history'); 
        if(logContainer) {
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

    static getHpColor(current: number, max: number) { const pct = (current / max) * 100; if(pct > 50) return 'hp-green'; if(pct > 10) return 'hp-yellow'; return 'hp-red'; }
    
    static updateUI() { 
        if(!this.activeMon || !this.opponent) return; 
        if(!this.player) return; 

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
        
        const plyPct = (this.activeMon.currentHp/this.activeMon.maxHp)*100; 
        const plyBar = document.getElementById('ply-hp')!; 
        plyBar.style.width = plyPct + "%"; 
        plyBar.className = `hp-fill ${this.getHpColor(this.activeMon.currentHp, this.activeMon.maxHp)}`; 
        document.getElementById('ply-hp-text')!.innerText = `${this.activeMon.currentHp}/${this.activeMon.maxHp}`; 
        (document.getElementById('ply-trainer-img') as HTMLImageElement).src = this.player.avatar; 
        document.getElementById('ply-shiny-tag')!.style.display = this.activeMon.isShiny ? 'inline-block' : 'none'; 
        document.getElementById('ply-stats')!.innerHTML = `<span>⚔️${this.activeMon.atk}</span> <span>🛡️${this.activeMon.def}</span> <span>💨${this.activeMon.speed}</span>`; 
        
        document.getElementById('opp-name')!.innerText = this.opponent.name; 
        document.getElementById('opp-lvl')!.innerText = `Lv.${this.opponent.level}`; 
        
        // --- BLINDAGEM 2: Tipos do Oponente (Opcional, mas recomendado) ---
        const oppTypesEl = document.getElementById('opp-types');
        if (oppTypesEl && typeof this.opponent.getTypeBadgesHTML === 'function') {
            oppTypesEl.innerHTML = this.opponent.getTypeBadgesHTML('flex-start'); // <- Alinha a esquerda
        }
        // ------------------------------------------------------------------

        (document.getElementById('opp-img') as HTMLImageElement).src = this.opponent.getSprite(); 
        const oppPct = (this.opponent.currentHp/this.opponent.maxHp)*100; 
        
        const oppBar = document.getElementById('opp-hp')!; 
        oppBar.style.width = oppPct + "%"; 
        oppBar.className = `hp-fill ${this.getHpColor(this.opponent.currentHp, this.opponent.maxHp)}`; 
        document.getElementById('opp-hp-text')!.innerText = `${this.opponent.currentHp}/${this.opponent.maxHp}`; 
        document.getElementById('opp-shiny-tag')!.style.display = this.opponent.isShiny ? 'inline-block' : 'none'; 
        document.getElementById('opp-stats')!.innerHTML = `<span>⚔️${this.opponent.atk}</span> <span>🛡️${this.opponent.def}</span> <span>💨${this.opponent.speed}</span>`; 
        
        const oppTrainer = document.getElementById('opp-trainer-img') as HTMLImageElement; 
        if(this.isPvP && this.enemyPlayer) { 
            oppTrainer.src = this.enemyPlayer.avatar; 
            oppTrainer.style.display = 'block'; 
        } 
        else if (this.isGym) { 
            const gData = GYM_DATA.find(g => g.id === this.gymId); 
            if(gData) oppTrainer.src = `/assets/img/LideresGym/${gData.leaderImg}`; 
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
        
        if(!this.isNPC && !this.isGym && !this.isPvP) { 
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
            // Acha onde o Mew está escondido na equipe
            const mewIndex = this.player.team.findIndex(p => (p as any).isTemp);
            
            // Devolve o Pokémon original para a vaga exata
            if (mewIndex !== -1) {
                this.player.team[mewIndex] = this.activeEffects.mewOriginal;
            } else if (this.activeEffects.mewIndex !== undefined) {
                this.player.team[this.activeEffects.mewIndex] = this.activeEffects.mewOriginal;
            }
            
            // Devolve o original para as bolinhas do HUD
            const plyIdx = this.plyTeamList.findIndex(p => (p as any).isTemp);
            if (plyIdx !== -1) {
                this.plyTeamList[plyIdx] = this.activeEffects.mewOriginal;
            }
            
            // Garante que o jogador volte a controlar o original
            if (this.activeMon && (this.activeMon as any).isTemp) {
                this.activeMon = this.activeEffects.mewOriginal;
            }
            
            this.activeEffects.mewOriginal = null;
        }
        
        // Limpeza de segurança
        if (this.player) {
            this.player.team = this.player.team.filter(p => !(p as any).isTemp);
        }
    }

    static win() { 
        const Game = (window as any).Game; 
        const Network = (window as any).Network; 
        const Cards = (window as any).Cards; 
        
        if(Network.isOnline && this.isPvP && Network.myPlayerId === this.enemyPlayer?.id) return;

        if (this.isGym) this.player!.effects.curse = false; 
        this.revertMew();
        let gain = 0; let msg = "VITÓRIA! "; 
        
        if (this.isPvP && this.enemyPlayer && this.activeEffects.stealBadgeFrom === this.enemyPlayer.id) { 
            // --- CORREÇÃO: Sorteia uma insígnia aleatória que o inimigo tem e você não ---
            const stealableBadges = [];
            for(let i=0; i<8; i++) {
                if(this.enemyPlayer.badges[i] && !this.player!.badges[i]) stealableBadges.push(i);
            }
            if (stealableBadges.length > 0) {
                const randomBadge = stealableBadges[Math.floor(Math.random() * stealableBadges.length)];
                this.player!.badges[randomBadge] = true;
                this.enemyPlayer.badges[randomBadge] = false;
                msg += ` Roubou a Insígnia ${randomBadge+1}!`;
            }
            // ---------------------------------------------------------------------------
        }
        if (this.activeEffects.destiny) { 
            this.player!.gold += 200; 
            if(Cards) Cards.draw(this.player!); 
            msg += " (+200G +Carta)"; 
            Game.sendGlobalLog(`💰 [Extrato] ${this.player!.name} recebeu +200G (Carta Destiny).`); 
        } 
        
        if(this.isPvP && this.enemyPlayer) { 
            if(this.enemyPlayer.gold > 0) { 
                gain = Math.floor(this.enemyPlayer.gold * 0.3); 
                this.enemyPlayer.gold -= gain; 
                msg += `Roubou ${gain}G!`; 
                Game.sendGlobalLog(`💰 [Extrato] Transferência de ${gain}G de ${this.enemyPlayer.name} para ${this.player!.name} (Luta PvP).`);
            } else { 
                gain = 100; msg += `Inimigo falido!`; 
                Game.sendGlobalLog(`💰 [Extrato] ${this.player!.name} recebeu +${gain}G (Luta PvP - Sistema).`);
            } 
            Game.sendGlobalLog(`[PvP] ${this.enemyPlayer.name} foi derrotado por ${this.player?.name}!`); 
            
            if(Network.isOnline) { 
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
            gain = 1000; 
            Game.sendGlobalLog(`💰 [Extrato] ${this.player!.name} recebeu +${gain}G (Líder de Ginásio).`);
            if (!this.player!.badges[this.gymId - 1]) { this.player!.badges[this.gymId - 1] = true; msg += ` Insígnia ${this.gymId}!`; } 
        } else if (this.isNPC) { 
            gain = this.reward; 
            Game.sendGlobalLog(`💰 [Extrato] ${this.player!.name} recebeu +${gain}G (Treinador NPC).`);

            if(Cards) Cards.draw(this.player!); 
            msg += ` e ganhou uma Carta!`;
        } 
        else { 
            gain = 150; 
            Game.sendGlobalLog(`💰 [Extrato] ${this.player!.name} recebeu +${gain}G (Pokémon Selvagem).`);

            if (Math.random() <= 0.25) { // Sorteia um número de 0.00 a 1.00
                if(Cards) Cards.draw(this.player!);
                msg += ` e achou uma Carta!`;
            }
        } 
        
        // Dá o ouro para o vencedor
        this.player!.gold += gain; 
        
        if(Network.isOnline) { 
            if (this.isPvP && this.enemyPlayer) {
                // A REGRA DE OURO: O atacante salva APENAS a si mesmo!
                Network.syncPlayerState();
                
                // Envia o pacote para a vítima se virar (mandando o novo saldo dela)
                Network.sendAction('PVP_SYNC_DAMAGE', { 
                    targetId: this.enemyPlayer.id, 
                    team: this.enemyPlayer.team, 
                    gold: this.enemyPlayer.gold,
                    badges: this.enemyPlayer.badges,
                    resetPos: true, 
                    skipTurn: true 
                }); 
            } else {
                Network.syncPlayerState();
            }
        }
        
        if (this.player!.badges.every(b => b === true)) {
            document.getElementById('battle-modal')!.style.display = 'none';
            this.active = false; Game.triggerVictory(this.player!.id);
            if(Network.isOnline) Network.sendAction('GAME_WIN', { winnerId: this.player!.id });
            return; 
        }

        // --- CORREÇÃO DO ENGARRAFAMENTO DE PACOTES ---
        // Espera 500ms para o pacote de DANO/ROUBO chegar no perdedor primeiro!
        setTimeout(() => {
            this.logBattle(`🏆 ${msg}`, true); 
            
            // Espera mais 200ms para mandar o texto pro chat global
            setTimeout(() => {
                Game.sendGlobalLog(`${this.player?.name} venceu! ${msg}`); 
            }, 200);
        }, 500);
        
        // Atrasamos o encerramento da tela para 2500ms para compensar
        setTimeout(() => this.end(false), 2500);
        // ----------------------------------------------
    }

    static lose() { 
        const Game = (window as any).Game; 
        const Network = (window as any).Network; 
        if (this.isGym) this.player!.effects.curse = false;
        this.revertMew();
        let msg = "DERROTA... "; 
        
        // --- LÓGICA DE PERDA DE OURO DIVIDIDA (PVP vs PVE) ---
        if (this.isPvP && this.enemyPlayer) {
            // CORREÇÃO: Se for aposta pelo "Novo Líder", a punição é 50%, senão 30%
            const penaltyRate = (this.activeEffects.stealBadgeFrom === this.enemyPlayer.id) ? 0.5 : 0.3;
            let lostGold = 0;
            
            if (this.player!.gold > 0) {
                lostGold = Math.floor(this.player!.gold * penaltyRate);
                this.player!.gold -= lostGold;
                this.enemyPlayer.gold += lostGold; // O inimigo recebe o ouro
                
                Game.sendGlobalLog(`💰 [Extrato] Transferência de ${lostGold}G de ${this.player!.name} para ${this.enemyPlayer.name} (${penaltyRate === 0.5 ? 'Aposta Novo Líder' : 'Luta PvP'}).`);
            } else {
                Game.sendGlobalLog(`💰 [Extrato] ${this.player!.name} já estava falido e não perdeu ouro no PvP.`);
            }
        } else {
            // Em PvE (Selvagem/Ginásio/NPC), perde apenas até 100G fixos
            const lostGold = this.player!.gold >= 100 ? 100 : this.player!.gold;
            this.player!.gold = Math.max(0, this.player!.gold - 100); 
            
            if (lostGold > 0) {
                Game.sendGlobalLog(`💰 [Extrato] ${this.player!.name} deixou cair -${lostGold}G enquanto fugia.`);
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
            if(Network.isOnline) {
                Network.sendAction('PVP_SYNC_DAMAGE', { 
                    targetId: this.enemyPlayer.id, 
                    team: this.enemyPlayer.team, 
                    gold: this.enemyPlayer.gold, 
                    badges: this.enemyPlayer.badges,
                    resetPos: false, 
                    skipTurn: false 
                });
            }
        }
        
        // Mudando aqui por causa do gold
        if(Network.isOnline) {
            if (this.isPvP && this.enemyPlayer) {
                // O atacante apanhou e perdeu ouro. Ele salva APENAS a si mesmo!
                Network.syncPlayerState();
                
                // Manda o aviso de que o defensor ganhou e envia o novo ouro do vencedor!
                Network.sendAction('PVP_SYNC_DAMAGE', { 
                    targetId: this.enemyPlayer.id, 
                    team: this.enemyPlayer.team, 
                    gold: this.enemyPlayer.gold,
                    badges: this.enemyPlayer.badges,
                    resetPos: false, 
                    skipTurn: false 
                });
            } else {
                Network.syncPlayerState(); 
            }
        }
        
        // --- CORREÇÃO DO ENGARRAFAMENTO DE PACOTES ---
        setTimeout(() => {
            this.logBattle(`💀 ${msg}`, true); 
            
            setTimeout(() => {
                Game.sendGlobalLog(`${this.player?.name} perdeu e recuou para o último Centro Pokémon!`); 
            }, 200);
        }, 500);
        
        setTimeout(() => { this.end(false); Game.moveVisuals(); }, 2500);
        // ----------------------------------------------
    }
    
    static end(isRemote: boolean) { 
        this.revertMew();
        const Game = (window as any).Game; 
        const Network = (window as any).Network; 
        this.active = false; 
        this.opponent = null; 
        this.oppTeamList = []; // Limpando lista de pokemons.
        document.getElementById('battle-modal')!.style.display = 'none'; 
        if(!isRemote) { 
            if(Network.isOnline) Network.sendAction('BATTLE_END', {}); Game.nextTurn(); 
        } 
    }
    
    static useCard(cardId: string) { 
        const Network = (window as any).Network; 
        const Game = (window as any).Game; 
        
        if (this.isPvP && this.enemyPlayer) { 
            const enemyHasJam = this.enemyPlayer.cards.findIndex((c: any) => c.id === 'jam'); 
            
            if (enemyHasJam > -1) { 
                // 1. Remove a carta de Interferência do inimigo
                this.enemyPlayer.cards.splice(enemyHasJam, 1); 
                
                // 2. Remove a carta de Batalha que você tentou usar
                const myCardIdx = this.player!.cards.findIndex((c: any) => c.id === cardId); 
                if(myCardIdx > -1) this.player!.cards.splice(myCardIdx, 1); 
                
                document.getElementById('battle-cards-modal')!.style.display = 'none'; 
                
                // 3. Atualiza os contadores na tela instantaneamente
                Game.updateHUD(); 

                // 4. Monta a Pop-up de aviso sem travar a tela
                const jamMsg = `📡 INTERFERÊNCIA!\n\n${this.enemyPlayer.name} anulou sua carta automaticamente!`;
                Game.sendGlobalLog(`📡 ${this.enemyPlayer.name} usou Interferência contra ${this.player?.name}!`); 
                Game.showGlobalAlert(jamMsg, this.player!.name, true, false);
                
                // 5. Salva OS DOIS JOGADORES no Firebase para ninguém duplicar carta!
                if(Network.isOnline) { 
                    Network.syncPlayers([this.player!.id, this.enemyPlayer.id]); 
                    Network.sendAction('SHOW_ALERT', { msg: jamMsg, playerName: this.player!.name, endsTurn: false });
                } 
                return; 
            } 
        } 
        
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

        const list = document.getElementById('battle-bag-list')!; 
        list.innerHTML = ''; Object.keys(this.player!.items).forEach(key => { if(this.player!.items[key] > 0) { const item = SHOP_ITEMS.find(i => i.id === key); if(item) { const btn = document.createElement('button'); btn.className = 'btn'; btn.innerHTML = `<img src="/assets/img/Itens/${item.icon}" class="item-icon-mini"> ${item.name} x${this.player!.items[key]}`; btn.onclick = () => this.useItem(key, item); list.appendChild(btn); } } }); document.getElementById('battle-bag')!.style.display = 'block'; }
    
    static openCardSelection() { if (!this.isPlayerTurn || this.processingAction) return; const list = document.getElementById('battle-cards-list')!; list.innerHTML = ''; const battleCards = this.player!.cards.filter(c => c.type === 'battle'); if(battleCards.length === 0) { list.innerHTML = "<em>Sem cartas de batalha.</em>"; } else { battleCards.forEach(c => { const d = document.createElement('div'); d.className='card-item'; d.innerHTML = `<div class="card-info"><span class="card-name">${c.icon} ${c.name} <span class="card-type-badge type-battle">BATTLE</span></span><span class="card-desc">${c.desc}</span></div><button class="btn-use-card" onclick="window.Battle.useCard('${c.id}')">USAR</button>`; list.appendChild(d); }); } document.getElementById('battle-cards-modal')!.style.display = 'flex'; }
    
    // =========================================================================================
    // NOVA LÓGICA DE FUGA - 50% BASE + D20
    // =========================================================================================

    static run() { 
        // 1. Onde a fuga é permitida: Só contra selvagem
        // Em PvP, Gym e NPC, fuga só por carta.
        if(this.isPvP || this.isNPC || this.isGym) { 
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
                this.activeMon!.gainXp(2, this.player!); 
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
        if (data.type === 'revive') {
            alert("Você não pode reviver Pokémon durante a batalha!");
            return;
        }

        const Network = (window as any).Network;
        document.getElementById('battle-bag')!.style.display = 'none';

        if (data.type === 'capture') {
            if (this.isPvP || this.isNPC || this.isGym) {
                alert("Não pode capturar pokémons de treinadores!");
                return;
            }
            this.player!.items[key]--;
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

    static attemptCapture(item: ItemData) {
        if (!this.opponent || !this.activeMon) return;
        const opponent = this.opponent;
        const activeMon = this.activeMon;

        this.logBattle(`Jogou ${item.name}...`, true);

        setTimeout(() => {
            if (item.id === 'masterball') {
                this.captureSuccess();
                return;
            }

            let chance = item.rate || 0;
            
            // Bônus por HP baixo
            const hpPercent = (opponent.currentHp / opponent.maxHp) * 100;
            if (hpPercent < 15) chance += 50; else if (hpPercent < 60) chance += 25;
            
            // Bônus por Nível
            if (activeMon.level > opponent.level) chance += 5; 
            else if (activeMon.level < opponent.level) chance -= 5;
            
            // --- NOVA LÓGICA: Penalidade por Poder (Status Totais) ---
            const oppStats = opponent.maxHp + opponent.atk + opponent.def + opponent.speed;
            const powerPenalty = Math.floor(oppStats / 25);
            chance -= powerPenalty; // Reduz a chance baseado na força bruta do alvo
            // ---------------------------------------------------------

            // Penalidades por Raridade
            if (opponent.isLegendary) chance -= 20;
            if (opponent.isShiny) chance -= 10;

            // Bônus do Dado d6
            const d6 = Math.floor(Math.random() * 6) + 1;
            const diceBonus = (d6 * 4) - 14; // Varia de -10 a +10
            chance += diceBonus;
            
            chance = Math.max(1, Math.min(95, chance));

            // Log atualizado para mostrar a resistência aos jogadores
            this.logBattle(`(Chance Final: ${chance}% | Resistência: -${powerPenalty}% | Sorte: ${diceBonus > 0 ? '+' : ''}${diceBonus}%)`, true);
            const roll = Math.floor(Math.random() * 100) + 1;

            if (roll <= chance) {
                this.captureSuccess();
            } else {
                this.logBattle("Aargh! Quase! O Pokémon escapou!", true);
                
                // Se falhar a captura, o inimigo ataca!
                setTimeout(() => {
                    this.performEnemyAttack(() => {
                        this.processingAction = false;
                        this.updateButtons();
                    });
                }, 1000);
            }
        }, 1500);
    }

    static captureSuccess() {
        const Game = (window as any).Game;
        const Network = (window as any).Network;

        Game.sendGlobalLog(`✨ ${this.player?.name} capturou um ${this.opponent!.name}!`);
        this.activeMon!.gainXp(5, this.player!); 

        if (this.player!.team.length < 6) {
            this.player!.team.push(this.opponent!);
            if(Network.isOnline) Network.syncPlayerState();
            setTimeout(() => this.end(false), 1500);
        } else {
            this.pendingCapture = this.opponent;
            Game.openSwapModal(this.pendingCapture);
        }
    }
}