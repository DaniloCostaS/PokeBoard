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

    static setup(player: Player, enemyMon: any, isPvP: boolean = false, _label: string = "", reward: number = 0, enemyPlayer: Player | null = null, isGym: boolean = false, gymId: number = 0, npcImage: string = "", terrainTile: number = 1) {
        const Game = (window as any).Game;
        this.player = player; this.isPvP = isPvP; this.isNPC = (reward > 0 && !isPvP); this.isGym = isGym; this.gymId = gymId; this.reward = reward; this.enemyPlayer = enemyPlayer; this.processingAction = false;
        this.activeEffects = {};
        this.battleTitle = isPvP ? "Batalha PvP!" : `Batalha contra ${_label}!`;
        
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
            const gymLevel = globalAvg + 1; 
            if(gymData) { this.oppTeamList = gymData.teamIds.map((id: number) => new Pokemon(id, gymLevel, false)); this.opponent = this.oppTeamList[0]; } 
            else { this.oppTeamList = Array.isArray(enemyMon) ? enemyMon : [enemyMon]; this.opponent = this.oppTeamList[0]; }
            this.plyTeamList = player.getBattleTeam(true); 
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
        
        // --- BYPASS: Inicia direto sem perguntar no PvP ---
        if (this.isPvP) {
            this.startRound(this.plyTeamList[0]);
        } else {
            this.openSelectionModal("Escolha seu Pokémon para começar!");
        }
    }

    static openSelectionModal(title: string) { const modal = document.getElementById('pkmn-select-modal')!; const list = document.getElementById('pkmn-select-list')!; document.getElementById('select-title')!.innerText = title; list.innerHTML = ''; this.plyTeamList.forEach((mon) => { const div = document.createElement('div'); div.className = `mon-select-item ${mon.isFainted() ? 'disabled' : ''}`; div.innerHTML = `<img src="${mon.getSprite()}" width="40"><b>${mon.name}</b> <small>(${mon.currentHp}/${mon.maxHp})</small>`; if(!mon.isFainted()) div.onclick = () => { modal.style.display = 'none'; this.startRound(mon); }; list.appendChild(div); }); modal.style.display = 'flex'; }
    
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
        
        // Regra: Só habilita se for MEU turno, não estiver processando E for minha sessão
        // Se eu sou o jogador passivo (defensor no PvP), isMyBattle será false, pois this.player é o atacante.
        const isMyBattle = Network.isOnline ? (this.player && this.player.id === Network.myPlayerId) : true;
        const canAct = this.isPlayerTurn && !this.processingAction && isMyBattle; 
        
        btns.forEach((btn: Element) => { (btn as HTMLButtonElement).disabled = !canAct; }); 
        
        if(this.isPvP || this.isGym) { 
            (document.getElementById('btn-run') as HTMLButtonElement).disabled = true; 
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

    static calculateDamage(attacker: Pokemon, defender: Pokemon, isPlayerAttacking: boolean): { damage: number, msg: string } { 
        const d6 = Math.floor(Math.random() * 6) + 1;
        let rollModifier = 0; 
        let isCritical = false; 
        // Proporção adaptada do D20 para o D6
        if (d6 === 6) { rollModifier = +5; isCritical = true; } // Crit!
        else if (d6 === 5) rollModifier = +3; 
        else if (d6 === 4) rollModifier = +2; 
        else if (d6 === 2) rollModifier = -1; 
        else if (d6 === 1) rollModifier = -2; // Falha crítica
        let defenseVal = defender.def; 
        if (isCritical) defenseVal = Math.floor(defenseVal / 2); 
        let base = Math.floor((attacker.atk / 5) - (defenseVal / 20)); 
        base = Math.max(1, base); let rawMulti = 1; 
        if (TYPE_CHART[attacker.type] && (TYPE_CHART[attacker.type] as any)[defender.type] !== undefined) { rawMulti = (TYPE_CHART[attacker.type] as any)[defender.type]; } 
        const typeDamage = Math.floor(base * (rawMulti > 1 ? 1.75 : (rawMulti < 1 ? 0.75 : 1))); 
        let finalDamage = Math.max(0, typeDamage + rollModifier); 
        if (isPlayerAttacking) { if (this.activeEffects.crit) { finalDamage *= 2; } if (this.activeEffects.focus) { finalDamage *= 4; this.activeEffects.focus = false; } if (this.player?.effects.curse) { finalDamage = Math.floor(finalDamage / 2); } } else { if (this.activeEffects.guard) { finalDamage = Math.floor(finalDamage / 2); } if (this.enemyPlayer && this.enemyPlayer.effects.curse) { finalDamage = Math.floor(finalDamage / 2); } } 
        let logDetails = `(🎲${d6})`; 
        if (isCritical) logDetails += " 💥!"; 
        if (rawMulti > 1) logDetails += " 🔥!"; 
        else if (rawMulti < 1) logDetails += " 🛡️."; 
        if (this.activeEffects.crit && isPlayerAttacking) logDetails += " [2x]"; 
        if (this.activeEffects.focus && isPlayerAttacking) logDetails += " [4x]"; 
        if (this.activeEffects.guard && !isPlayerAttacking) logDetails += " [🛡️]"; 
        
        // --- NOVO: FATOR DE VELOCIDADE (MOMENTUM / ESQUIVA) ---
        // Calcula a proporção de velocidade (evitando divisão por zero)
        const speedRatio = attacker.speed / Math.max(1, defender.speed);
        
        // Limita o bônus/penalidade entre 0.90 (-10% de dano) e 1.10 (+10% de dano)
        const speedMultiplier = Math.max(0.90, Math.min(1.10, speedRatio));
        
        // Aplica o multiplicador ao dano usando a variável correta: finalDamage
        finalDamage = Math.max(1, Math.floor(finalDamage * speedMultiplier));

        // Adiciona um feedback visual no log para os jogadores entenderem o impacto da SPD
        if (speedMultiplier >= 1.10) {
            logDetails += ` ⚡Ágil! (+${Math.floor((speedMultiplier-1)*100)}% Dano)`;
        } else if (speedMultiplier <= 0.90) {
            logDetails += ` 🐢Lento! (-${Math.floor((1-speedMultiplier)*100)}% Dano)`;
        }
        // --------------------------------------------------------
        
        return { damage: finalDamage, msg: logDetails };
    }
    
    // =========================================================================================
    // LÓGICA UNIFICADA DE BATALHA (PvE e PvP Automático)
    // =========================================================================================

    static attack() { 
        // Se eu não sou o jogador ativo (ex: sou o passivo assistindo), não faço nada
        const Network = (window as any).Network; 
        if(Network.isOnline && this.player && this.player.id !== Network.myPlayerId) return;

        if(!this.activeMon || !this.opponent) return; 

        this.processingAction = true; 
        this.updateButtons(); 

        // 1. Verifica Velocidade (Igual para PvE e PvP agora)
        const playerSpeed = this.activeMon.speed;
        const enemySpeed = this.opponent.speed;
        
        let playerGoesFirst = true;

        if (playerSpeed > enemySpeed) playerGoesFirst = true;
        else if (enemySpeed > playerSpeed) playerGoesFirst = false;
        else playerGoesFirst = Math.random() > 0.5; // Empate

        this.logBattle(`Velocidade: ${this.activeMon.name}(${playerSpeed}) vs ${this.opponent.name}(${enemySpeed})`, true);

        if (playerGoesFirst) {
            this.logBattle(`💨 ${this.activeMon.name} é mais rápido!`, true);
            this.performPlayerAttack(() => {
                if (this.opponent && this.opponent.currentHp > 0) {
                    setTimeout(() => {
                        this.performEnemyAttack(() => {
                            this.processingAction = false;
                            this.updateButtons();
                            if (this.isPvP) setTimeout(() => this.autoAttackNext(), 1500); // LOOP
                        });
                    }, 1000);
                }
            });
        } else {
            this.logBattle(`💨 ${this.opponent.name} é mais rápido!`, true);
            this.performEnemyAttack(() => {
                if (this.activeMon && this.activeMon.currentHp > 0) {
                    setTimeout(() => {
                        this.performPlayerAttack(() => {
                            this.processingAction = false;
                            this.updateButtons();
                            if (this.isPvP) setTimeout(() => this.autoAttackNext(), 1500); // LOOP
                        });
                    }, 1000);
                }
            });
        }
    }

    // Ação isolada de ataque do Jogador
    static performPlayerAttack(callback?: () => void) {
        const Network = (window as any).Network;
        if(!this.activeMon || !this.opponent) return;

        let calc = this.calculateDamage(this.activeMon, this.opponent, true); 
        let dmg = calc.damage; 
        
        this.opponent.currentHp = Math.max(0, this.opponent.currentHp - dmg); 
        const logMsg = `${this.activeMon.name} atacou! 💥${dmg} ${calc.msg}`; 
        this.logBattle(logMsg); 
        this.updateUI(); 

        if (Network.isOnline) {
             Network.sendAction('BATTLE_UPDATE', { 
                plyHp: this.activeMon.currentHp, 
                oppHp: this.opponent.currentHp, 
                msg: logMsg
            });
            // CORREÇÃO CRÍTICA PVP: Salva o dano no banco de dados IMEDIATAMENTE!
            if (this.isPvP && this.enemyPlayer) {
                Network.syncSpecificPlayer(this.enemyPlayer.id);
            }
        }

        if(this.opponent.currentHp <= 0) { 
            // --- NOVO XP POR POKÉMON DERROTADO (Baseado em Status) ---
            // Soma: MaxHP + ATK + DEF + SPD
            const oppStats = this.opponent.maxHp + this.opponent.atk + this.opponent.def + this.opponent.speed;
            
            // Fórmula da Vitória: Status Totais / 15
            const xpGain = Math.max(1, Math.floor(oppStats / 15));
            
            this.activeMon.gainXp(xpGain, this.player!);
            this.updateUI(); 
            if (Network.isOnline) Network.syncPlayerState();
            // --------------------------------

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

        let calc = this.calculateDamage(this.opponent, this.activeMon, false); 
        let dmg = calc.damage; 
        
        this.activeMon.currentHp = Math.max(0, this.activeMon.currentHp - dmg); 
        const logMsg = `${this.opponent.name} atacou! 💥${dmg} ${calc.msg}`; 
        this.logBattle(logMsg); 
        this.updateUI(); 
        
        if (this.activeEffects.counter && this.activeEffects.counter > 0) { 
            const reflect = Math.floor(dmg * 0.5); 
            if (reflect > 0) { 
                this.opponent.currentHp = Math.max(0, this.opponent.currentHp - reflect); 
                this.logBattle(`🔁 Contra-ataque! Inimigo sofreu ${reflect} de dano.`); 
                this.activeEffects.counter--; 
                this.updateUI(); 
                // CORREÇÃO PVP: Salva o dano do counter no Firebase!
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
            // --- NOVO XP DE CONSOLAÇÃO E PARA O OPONENTE NO PVP ---
            const oppStats = this.opponent.maxHp + this.opponent.atk + this.opponent.def + this.opponent.speed;
            
            // Fórmula da Derrota (Consolação): Status Totais do Inimigo / 45
            const xpGain = Math.max(1, Math.floor(oppStats / 45));
            this.activeMon.gainXp(xpGain, this.player!);

            // Lógica para o Oponente no caso de PvP (Ele recebe a Fórmula da Vitória)
            if (this.isPvP && this.enemyPlayer) {
                // Aqui usamos os status do SEU pokémon que desmaiou para dar XP ao oponente
                const plyStats = this.activeMon.maxHp + this.activeMon.atk + this.activeMon.def + this.activeMon.speed;
                const oppXpGain = Math.max(1, Math.floor(plyStats / 15));
                
                this.opponent.gainXp(oppXpGain, this.enemyPlayer);
                if (Network.isOnline) Network.syncSpecificPlayer(this.enemyPlayer.id);
            }

            this.updateUI(); 
            if (Network.isOnline) Network.syncPlayerState();
            // -------------------------------------------------

            setTimeout(() => { this.handleFaint(); }, 1000); 
        } else { 
            if(callback) callback();
        }
    }
    
    static checkWinCondition() { 
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
    static updateUI() { if(!this.activeMon || !this.opponent) return; if(!this.player) return; document.getElementById('ply-name')!.innerText = this.activeMon.name; document.getElementById('ply-lvl')!.innerText = `Lv.${this.activeMon.level}`; (document.getElementById('ply-img') as HTMLImageElement).src = this.activeMon.getSprite(); const plyPct = (this.activeMon.currentHp/this.activeMon.maxHp)*100; const plyBar = document.getElementById('ply-hp')!; plyBar.style.width = plyPct + "%"; plyBar.className = `hp-fill ${this.getHpColor(this.activeMon.currentHp, this.activeMon.maxHp)}`; document.getElementById('ply-hp-text')!.innerText = `${this.activeMon.currentHp}/${this.activeMon.maxHp}`; (document.getElementById('ply-trainer-img') as HTMLImageElement).src = this.player.avatar; document.getElementById('ply-shiny-tag')!.style.display = this.activeMon.isShiny ? 'inline-block' : 'none'; document.getElementById('ply-stats')!.innerHTML = `<span>⚔️${this.activeMon.atk}</span> <span>🛡️${this.activeMon.def}</span> <span>💨${this.activeMon.speed}</span>`; document.getElementById('opp-name')!.innerText = this.opponent.name; document.getElementById('opp-lvl')!.innerText = `Lv.${this.opponent.level}`; (document.getElementById('opp-img') as HTMLImageElement).src = this.opponent.getSprite(); const oppPct = (this.opponent.currentHp/this.opponent.maxHp)*100; const oppBar = document.getElementById('opp-hp')!; oppBar.style.width = oppPct + "%"; oppBar.className = `hp-fill ${this.getHpColor(this.opponent.currentHp, this.opponent.maxHp)}`; document.getElementById('opp-hp-text')!.innerText = `${this.opponent.currentHp}/${this.opponent.maxHp}`; document.getElementById('opp-shiny-tag')!.style.display = this.opponent.isShiny ? 'inline-block' : 'none'; document.getElementById('opp-stats')!.innerHTML = `<span>⚔️${this.opponent.atk}</span> <span>🛡️${this.opponent.def}</span> <span>💨${this.opponent.speed}</span>`; const oppTrainer = document.getElementById('opp-trainer-img') as HTMLImageElement; if(this.isPvP && this.enemyPlayer) { oppTrainer.src = this.enemyPlayer.avatar; oppTrainer.style.display = 'block'; } else if (this.isGym) { const gData = GYM_DATA.find(g => g.id === this.gymId); if(gData) oppTrainer.src = `/assets/img/LideresGym/${gData.leaderImg}`; oppTrainer.style.display = 'block'; } else if (this.isNPC) { const npcImg = (this.opponent as any)._npcImage; if (npcImg) { oppTrainer.src = npcImg; oppTrainer.style.display = 'block'; } else { oppTrainer.src = '/assets/img/Treinadores/Red.jpg'; oppTrainer.style.display = 'block'; } } else { oppTrainer.style.display = 'none'; } if(!this.isNPC && !this.isGym && !this.isPvP) { document.getElementById('ply-team-indicator')!.innerHTML = ''; document.getElementById('opp-team-indicator')!.innerHTML = ''; } else { this.renderTeamIcons('ply-team-indicator', this.plyTeamList); this.renderTeamIcons('opp-team-indicator', this.oppTeamList); } }
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

        this.player!.effects.curse = false; 
        this.revertMew();
        let gain = 0; let msg = "VITÓRIA! "; 
        
        if (this.isPvP && this.enemyPlayer && this.activeEffects.stealBadgeFrom === this.enemyPlayer.id) { 
            const myBadges = this.player!.badges; 
            const enBadges = this.enemyPlayer.badges; 
            for(let i=0; i<8; i++) { 
                if(enBadges[i] && !myBadges[i]) { 
                    myBadges[i] = true; enBadges[i] = false; 
                    msg += ` Roubou Insígnia ${i+1}!`; break; 
                } 
            } 
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
                Network.sendAction('PVP_SYNC_DAMAGE', { targetId: this.enemyPlayer.id, team: this.enemyPlayer.team, gold: this.enemyPlayer.gold, resetPos: true, skipTurn: true });
            } 
        } else if (this.isGym) { 
            gain = 1000; 
            Game.sendGlobalLog(`💰 [Extrato] ${this.player!.name} recebeu +${gain}G (Líder de Ginásio).`);
            if (!this.player!.badges[this.gymId - 1]) { this.player!.badges[this.gymId - 1] = true; msg += ` Insígnia ${this.gymId}!`; } 
        } else if (this.isNPC) { 
            gain = this.reward; 
            Game.sendGlobalLog(`💰 [Extrato] ${this.player!.name} recebeu +${gain}G (Treinador NPC).`);
        } 
        else { 
            gain = 150; 
            Game.sendGlobalLog(`💰 [Extrato] ${this.player!.name} recebeu +${gain}G (Pokémon Selvagem).`);
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
        this.player!.effects.curse = false; 
        this.revertMew();
        let msg = "DERROTA... "; 
        
        // --- LÓGICA DE PERDA DE OURO DIVIDIDA (PVP vs PVE) ---
        if (this.isPvP && this.enemyPlayer) {
            // Em PvP, se você atacar e perder, o inimigo te rouba 30%!
            let lostGold = 0;
            if (this.player!.gold > 0) {
                lostGold = Math.floor(this.player!.gold * 0.3);
                this.player!.gold -= lostGold;
                this.enemyPlayer.gold += lostGold; // O inimigo recebe o ouro
                
                Game.sendGlobalLog(`💰 [Extrato] Transferência de ${lostGold}G de ${this.player!.name} para ${this.enemyPlayer.name} (Luta PvP).`);
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
                Network.sendAction('PVP_SYNC_DAMAGE', { targetId: this.enemyPlayer.id, team: this.enemyPlayer.team, gold: this.enemyPlayer.gold, resetPos: false, skipTurn: false });
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

    static openBag() { if (!this.isPlayerTurn || this.processingAction) return; const list = document.getElementById('battle-bag-list')!; list.innerHTML = ''; Object.keys(this.player!.items).forEach(key => { if(this.player!.items[key] > 0) { const item = SHOP_ITEMS.find(i => i.id === key); if(item) { const btn = document.createElement('button'); btn.className = 'btn'; btn.innerHTML = `<img src="/assets/img/Itens/${item.icon}" class="item-icon-mini"> ${item.name} x${this.player!.items[key]}`; btn.onclick = () => this.useItem(key, item); list.appendChild(btn); } } }); document.getElementById('battle-bag')!.style.display = 'block'; }
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