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
        
        // Pega o time todo (já limitamos a 6 no Player.ts)
        this.plyTeamList = player.getBattleTeam(true); 
        this.currentTerrain = terrainTile;

        if (isPvP && enemyPlayer) { 
            this.oppTeamList = enemyPlayer.getBattleTeam(false); 
            this.opponent = this.oppTeamList[0]; 
            if (enemyPlayer.effects.curse) { this.logBattle(`☠️ ${enemyPlayer.name} está amaldiçoado! (Dano reduzido)`); }
        } else if (isGym) {
            const gymData = GYM_DATA.find(g => g.id === gymId);
            const globalAvg = Game.getGlobalAverageLevel();
            const gymLevel = globalAvg + 1; 
            if(gymData) { this.oppTeamList = gymData.teamIds.map((id: number) => new Pokemon(id, gymLevel, false)); this.opponent = this.oppTeamList[0]; } 
            else { this.oppTeamList = Array.isArray(enemyMon) ? enemyMon : [enemyMon]; this.opponent = this.oppTeamList[0]; }
        } else { 
            // Agora aceita tanto um Pokémon único (Selvagem) quanto o Time inteiro do NPC (Array)
            this.oppTeamList = Array.isArray(enemyMon) ? enemyMon : [enemyMon]; 
            this.opponent = this.oppTeamList[0]; 
        }

        if(this.plyTeamList.length === 0) { 
            Game.handleTotalDefeat(player);
            Game.nextTurn();
            return; 
        }
        
        if(this.isNPC && npcImage) { (this.opponent as any)._npcImage = npcImage; (this.opponent as any)._npcName = _label; }
        this.openSelectionModal("Escolha seu Pokémon para começar!");
    }

    static openSelectionModal(title: string) { const modal = document.getElementById('pkmn-select-modal')!; const list = document.getElementById('pkmn-select-list')!; document.getElementById('select-title')!.innerText = title; list.innerHTML = ''; this.plyTeamList.forEach((mon) => { const div = document.createElement('div'); div.className = `mon-select-item ${mon.isFainted() ? 'disabled' : ''}`; div.innerHTML = `<img src="${mon.getSprite()}" width="40"><b>${mon.name}</b> <small>(${mon.currentHp}/${mon.maxHp})</small>`; if(!mon.isFainted()) div.onclick = () => { modal.style.display = 'none'; this.startRound(mon); }; list.appendChild(div); }); modal.style.display = 'flex'; }
    
    static startRound(selectedMon: Pokemon) { 
        const Network = (window as any).Network; 
        document.getElementById('pkmn-select-modal')!.style.display = 'none'; 
        this.active = true; 
        this.activeMon = selectedMon; 
        
        // 1. Renderiza a tela
        this.renderBattleScreen(); 
        
        // 2. Define estado inicial dos botões
        // CORREÇÃO: PvP agora se comporta como PvE para o atacante.
        // O jogador ativo (que caiu na casa) SEMPRE tem o controle inicial.
        this.isPlayerTurn = true; 
        this.processingAction = false;
        this.updateButtons();
        
        if (this.isPvP) {
             this.logBattle(`PvP Iniciado! Você desafiou ${this.enemyPlayer?.name || 'Inimigo'}.`, true);
        } else {
            this.logBattle(`O que ${this.activeMon.name} fará?`, true);
        }
        
        const enemyId = this.enemyPlayer ? this.enemyPlayer.id : -1; 
        
        if(Network.isOnline && this.player!.id === Network.myPlayerId) { 
            const npcImg = (this.opponent as any)._npcImage || ""; 
            const npcName = (this.opponent as any)._npcName || ""; 
            
            // Avisa quem começa para sincronizar os clientes
            // No modo automático, o 'startingTurnId' é sempre o do jogador ativo
            const startingId = this.player!.id;

            Network.sendAction('BATTLE_START', { 
                pId: this.player!.id, 
                monIdx: this.player!.team.indexOf(this.activeMon), 
                oppTeam: this.oppTeamList, // Enviando a lista inteira!
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
    
    static startFromNetwork(payload: any) { 
        const Game = (window as any).Game; 
        const Network = (window as any).Network;
        const p = Game.players[payload.pId]; 
        if (!p) return; 
        
        this.active = true; 
        this.player = p; 
        this.activeMon = p.team[payload.monIdx]; 

        // --- NOVO: Lê a lista inteira do oponente ---
        if (payload.oppTeam && payload.oppTeam.length > 0) {
            const PokemonClass = (window as any).Pokemon || p.team[0].constructor;
            this.oppTeamList = payload.oppTeam.map((td: any) => {
                 const po = new PokemonClass(td.id, td.level, td.isShiny);
                 Object.assign(po, td);
                 return po;
            });
            this.opponent = this.oppTeamList[0];
        } else {
            // Fallback caso seja um inimigo antigo
            this.opponent = new Pokemon(payload.oppData.id, payload.oppData.level, payload.oppData.isShiny); 
            Object.assign(this.opponent, payload.oppData); 
            this.oppTeamList = [this.opponent];
        }
        // --------------------------------------------

        this.isPvP = payload.isPvP; 
        this.isGym = payload.isGym; 
        this.gymId = payload.gymId; 
        this.isNPC = (!payload.isPvP && payload.reward > 0); 
        
        if(payload.enemyId >= 0) this.enemyPlayer = Game.players[payload.enemyId]; 
        if(payload.npcImage) (this.opponent as any)._npcImage = payload.npcImage; 
        if(payload.npcName) (this.opponent as any)._npcName = payload.npcName; 
        if(payload.battleTitle) this.battleTitle = payload.battleTitle; 
        this.currentTerrain = payload.currentTerrain || 1;
        // Sincroniza quem tem o controle (geralmente o atacante)
        if (payload.startingTurnId !== undefined) {
            this.isPlayerTurn = (payload.startingTurnId === Network.myPlayerId);
        } else {
            this.isPlayerTurn = (payload.pId === Network.myPlayerId); 
        }

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
        
        // --- LÓGICA DE TÍTULO DE ESPECTADOR ---
        const titleEl = document.getElementById('battle-title')!;
        
        if (Network.isOnline && this.player && this.player.id !== Network.myPlayerId) {
            
            // Descobre qual é o tipo de oponente para mostrar no título
            let oppName = "Selvagem"; // Padrão
            
            if (this.isPvP && this.enemyPlayer) {
                oppName = this.enemyPlayer.name; // Luta contra outro jogador
            } else if (this.isGym) {
                oppName = "Líder de Ginásio"; // Luta no ginásio
            } else if (this.isNPC && (this.opponent as any)._npcName) {
                oppName = (this.opponent as any)._npcName; // Luta contra NPC (ex: Rocket, Jovem, etc)
            }

            // Exibe: "👁️ Assistindo Danilo contra Selvagem"
            titleEl.innerHTML = `👁️ <span style="color:#ffd700;">Assistindo ${this.player.name} contra ${oppName}</span>`;
            
        } else {
            // Título normal para quem está jogando
            titleEl.innerText = this.battleTitle;
        }
        // ---------------------------------------
        
        this.updateButtons();
        this.updateUI();

        // === LÓGICA DO BACKGROUND DINÂMICO ===
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
        const d20 = Math.floor(Math.random() * 20) + 1; 
        let rollModifier = 0; 
        let isCritical = false; 
        if (d20 >= 20) { rollModifier = +5; isCritical = true; } 
        else if (d20 >= 16) rollModifier = +3; 
        else if (d20 >= 11) rollModifier = +2; 
        else if (d20 <= 2) rollModifier = -2; 
        else if (d20 <= 5) rollModifier = -1; 
        let defenseVal = defender.def; 
        if (isCritical) defenseVal = Math.floor(defenseVal / 2); 
        let base = Math.floor((attacker.atk / 5) - (defenseVal / 20)); 
        base = Math.max(1, base); let rawMulti = 1; 
        if (TYPE_CHART[attacker.type] && (TYPE_CHART[attacker.type] as any)[defender.type] !== undefined) { rawMulti = (TYPE_CHART[attacker.type] as any)[defender.type]; } 
        const typeDamage = Math.floor(base * (rawMulti > 1 ? 1.75 : (rawMulti < 1 ? 0.75 : 1))); 
        let finalDamage = Math.max(0, typeDamage + rollModifier); 
        if (isPlayerAttacking) { if (this.activeEffects.crit) { finalDamage *= 2; } if (this.activeEffects.focus) { finalDamage *= 4; this.activeEffects.focus = false; } if (this.player?.effects.curse) { finalDamage = Math.floor(finalDamage / 2); } } else { if (this.activeEffects.guard) { finalDamage = Math.floor(finalDamage / 2); } if (this.enemyPlayer && this.enemyPlayer.effects.curse) { finalDamage = Math.floor(finalDamage / 2); } } let logDetails = `(🎲${d20})`; if (isCritical) logDetails += " 💥!"; if (rawMulti > 1) logDetails += " 🔥!"; else if (rawMulti < 1) logDetails += " 🛡️."; if (this.activeEffects.crit && isPlayerAttacking) logDetails += " [2x]"; if (this.activeEffects.focus && isPlayerAttacking) logDetails += " [4x]"; if (this.activeEffects.guard && !isPlayerAttacking) logDetails += " [🛡️]"; return { damage: finalDamage, msg: logDetails }; 
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
            // JOGADOR ATACA PRIMEIRO
            this.logBattle(`💨 ${this.activeMon.name} é mais rápido!`, true);
            this.performPlayerAttack(() => {
                // Se o inimigo sobreviveu, ele ataca de volta automaticamente (Simulando NPC)
                if (this.opponent && this.opponent.currentHp > 0) {
                    setTimeout(() => {
                        this.performEnemyAttack(() => {
                            // Fim da rodada
                            this.processingAction = false;
                            this.updateButtons();
                        });
                    }, 1000);
                } else {
                    // Inimigo morreu, vitória já tratada
                    this.processingAction = false;
                }
            });
        } else {
            // INIMIGO ATACA PRIMEIRO
            this.logBattle(`💨 ${this.opponent.name} é mais rápido!`, true);
            this.performEnemyAttack(() => {
                // Se o jogador sobreviveu, ele ataca de volta
                if (this.activeMon && this.activeMon.currentHp > 0) {
                    setTimeout(() => {
                        this.performPlayerAttack(() => {
                            // Fim da rodada
                            this.processingAction = false;
                            this.updateButtons();
                        });
                    }, 1000);
                } else {
                    // Jogador morreu, derrota já tratada
                    this.processingAction = false;
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

        // Envia atualização visual para o oponente (se estiver online)
        // Mas NÃO passa a vez. O controle continua local.
        if (Network.isOnline) {
             Network.sendAction('BATTLE_UPDATE', { 
                plyHp: this.activeMon.currentHp, 
                oppHp: this.opponent.currentHp, 
                msg: logMsg
            });
        }

        if(this.opponent.currentHp <= 0) { 
            const Network = (window as any).Network;
            
            // --- NOVA LÓGICA DE XP: POR POKÉMON DERROTADO ---
            let xpGain = 0;
            if(this.isPvP) xpGain = 15;
            else if(this.isGym) xpGain = 25;
            else if(this.isNPC) xpGain = 10;
            else xpGain = 5; // Selvagem

            if (this.opponent.level >= this.activeMon.level + 2) { 
                xpGain += 5; 
                this.logBattle(`Bônus de Desafio! (+5 XP)`); 
            }
            
            this.activeMon.gainXp(xpGain, this.player!);
            this.updateUI(); // Se evoluir, a imagem e status mudam na hora!
            if (Network.isOnline) Network.syncPlayerState();
            // -------------------------------------------------

            setTimeout(() => { this.checkWinCondition(); }, 1000); 
        } else {
            if(callback) callback();
        }
    }
    
    // Ação isolada de ataque do Inimigo (Controlado automaticamente pelo Cliente do Jogador Ativo)
    static performEnemyAttack(callback?: () => void) {
        if(!this.activeMon || !this.opponent) return;
        const Network = (window as any).Network;

        // Verifica Stun
        if (this.activeEffects.stunOpponent && this.activeEffects.stunOpponent > 0) { 
            this.activeEffects.stunOpponent--; 
            this.logBattle("⚡ Inimigo atordoado! Não conseguiu atacar.", true); 
            if(callback) callback();
            return; 
        } 

        let calc = this.calculateDamage(this.opponent, this.activeMon, false); 
        let dmg = calc.damage; 
        
        this.activeMon.currentHp = Math.max(0, this.activeMon.currentHp - dmg); 
        const logMsg = `${this.opponent.name} atacou! 💥${dmg} ${calc.msg}`; 
        this.logBattle(logMsg); 
        this.updateUI(); 
        
        // Lógica de Counter (Carta)
        if (this.activeEffects.counter && this.activeEffects.counter > 0) { 
            const reflect = Math.floor(dmg * 0.5); 
            if (reflect > 0) { 
                this.opponent.currentHp = Math.max(0, this.opponent.currentHp - reflect); 
                this.logBattle(`🔁 Contra-ataque! Inimigo sofreu ${reflect} de dano.`, true); 
                this.activeEffects.counter--; 
                this.updateUI(); 
            } 
        } 
        
        // Envia atualização visual para o oponente
        if(Network.isOnline) { 
            Network.sendAction('BATTLE_UPDATE', { plyHp: this.activeMon.currentHp, oppHp: this.opponent.currentHp, msg: logMsg }); 
        } 
        
        if(this.activeMon.currentHp <= 0) { 
            const Network = (window as any).Network;
            
            // --- NOVA LÓGICA DE XP: CONSOLAÇÃO E PVP ---
            let xpGain = 0;
            if(this.isPvP) xpGain = 5;
            else if(this.isGym) xpGain = 8;
            else if(this.isNPC) xpGain = 3;
            else xpGain = 2; // Selvagem
            
            this.activeMon.gainXp(xpGain, this.player!);

            // Se for PvP, o Oponente que acabou de te derrotar ganha o XP cheio!
            if (this.isPvP && this.enemyPlayer) {
                let oppXpGain = 15;
                if (this.activeMon.level >= this.opponent.level + 2) oppXpGain += 5;
                
                this.opponent.gainXp(oppXpGain, this.enemyPlayer);
                if (Network.isOnline) Network.syncSpecificPlayer(this.enemyPlayer.id);
            }

            this.updateUI(); 
            if (Network.isOnline) Network.syncPlayerState();
            // -------------------------------------------

            setTimeout(() => { this.handleFaint(); }, 1000); 
        } else { 
            if(callback) callback();
        }
    }
    
    static checkWinCondition() { 
        const nextOpp = this.oppTeamList.find(p => !p.isFainted() && p !== this.opponent); 
        if (nextOpp) { 
            this.opponent = nextOpp; 
            this.logBattle(`Rival enviou ${nextOpp.name}!`, true); 
            this.updateUI(); 
            this.processingAction = false; 
            this.updateButtons(); 
            
            // --- NOVA SINCRONIZAÇÃO: Avisa a sala que o oponente trocou de Pokémon! ---
            const Network = (window as any).Network;
            if(Network.isOnline && this.player && this.player.id === Network.myPlayerId) {
                 Network.sendAction('BATTLE_OPP_SWITCH', { nextOpp: nextOpp });
            }
        } else { 
            this.win(); 
        } 
    }

    static handleFaint() { const nextPly = this.plyTeamList.find(p => !p.isFainted()); if (nextPly) { this.logBattle(`${this.activeMon!.name} desmaiou!`, true); document.getElementById('battle-modal')!.style.display = 'none'; this.openSelectionModal("Escolha o próximo!"); } else { this.lose(); } }
    
    static logBattle(msg: string, sync: boolean = false) { 
        const Game = (window as any).Game; 
        const el = document.getElementById('battle-msg'); 
        if(el) el.innerText = msg; 
        const logContainer = document.getElementById('battle-log-history'); 
        if(logContainer) logContainer.insertAdjacentHTML('afterbegin', `<div style="border-bottom:1px solid #555; padding:2px;">${msg}</div>`); 
        Game.log(`[Batalha] ${msg}`); 

        // Se passarmos "true", ele espelha o texto para a rede!
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
    
    static win() { 
        const Game = (window as any).Game; 
        const Network = (window as any).Network; 
        const Cards = (window as any).Cards; 
        
        if(Network.isOnline && this.isPvP && Network.myPlayerId === this.enemyPlayer?.id) return;

        this.player!.effects.curse = false; 
        this.player!.team = this.player!.team.filter(p => !(p as any).isTemp); 
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
        
        if (this.activeEffects.destiny) { this.player!.gold += 200; if(Cards) Cards.draw(this.player!); msg += " (Destino Selado: +200G +Carta)"; } 
        
        if(this.isPvP && this.enemyPlayer) { 
            if(this.enemyPlayer.gold > 0) { 
                gain = Math.floor(this.enemyPlayer.gold * 0.3); 
                this.enemyPlayer.gold -= gain; 
                msg += `Roubou ${gain}G!`; 
            } else { 
                gain = 100; msg += `Inimigo falido (Perde vez)!`; 
            } 
            Game.sendGlobalLog(`[PvP] ${this.enemyPlayer.name} foi derrotado por ${this.player?.name}!`); 
            if(Network.isOnline) Network.sendAction('PVP_SYNC_DAMAGE', { targetId: this.enemyPlayer.id, team: this.oppTeamList, resetPos: true, skipTurn: true }); 
        } else if (this.isGym) { 
            gain = 1000; 
            if (!this.player!.badges[this.gymId - 1]) { 
                this.player!.badges[this.gymId - 1] = true; 
                msg += ` Insígnia ${this.gymId}!`; 
            } 
        } else if (this.isNPC) { gain = this.reward; } 
        else { gain = 150; } 
        
        this.player!.gold += gain; 
        // LÓGICA DE XP REMOVIDA DAQUI
        
        if(Network.isOnline) Network.syncPlayerState(); 
        const hasAllBadges = this.player!.badges.every(b => b === true);
        
        if (hasAllBadges) {
            document.getElementById('battle-modal')!.style.display = 'none';
            this.active = false;
            Game.triggerVictory(this.player!.id);
            if(Network.isOnline) Network.sendAction('GAME_WIN', { winnerId: this.player!.id });
            return; 
        }

        alert(msg); 
        Game.sendGlobalLog(`${this.player?.name} venceu! ${msg}`); 
        setTimeout(() => this.end(false), 1000); 
    }

    static lose() { 
        const Game = (window as any).Game; 
        const Network = (window as any).Network; 
        this.player!.effects.curse = false; 
        this.player!.team = this.player!.team.filter(p => !(p as any).isTemp); 
        let msg = "DERROTA... "; 
        this.player!.gold = Math.max(0, this.player!.gold - 100); 
        
        if (this.player!.isDefeated()) { Game.handleTotalDefeat(this.player!); this.end(false); return; } 
        if (!this.isPvP) { this.player!.team.forEach(p => p.heal(999)); } 
        
        this.player!.x = 0; 
        this.player!.y = 0; 
        this.player!.skipTurns = 1; 
        
        // LÓGICA DE XP REMOVIDA DAQUI
        
        if (this.isPvP && this.enemyPlayer) { msg += ` ${this.enemyPlayer.name} venceu!`; } 
        if(Network.isOnline) Network.syncPlayerState(); 
        
        alert(msg); 
        Game.sendGlobalLog(`${this.player?.name} perdeu e voltou ao início!`); 
        setTimeout(() => { this.end(false); Game.moveVisuals(); }, 1500); 
    }
    
    static end(isRemote: boolean) { const Game = (window as any).Game; const Network = (window as any).Network; this.active = false; this.opponent = null; document.getElementById('battle-modal')!.style.display = 'none'; if(!isRemote) { if(Network.isOnline) Network.sendAction('BATTLE_END', {}); Game.nextTurn(); } }
    static useCard(cardId: string) { const Network = (window as any).Network; const Game = (window as any).Game; if (this.isPvP && this.enemyPlayer) { const enemyHasJam = this.enemyPlayer.cards.findIndex((c: any) => c.id === 'jam'); if (enemyHasJam > -1) { this.enemyPlayer.cards.splice(enemyHasJam, 1); alert(`📡 INTERFERÊNCIA! ${this.enemyPlayer.name} anulou sua carta!`); Game.sendGlobalLog(`📡 ${this.enemyPlayer.name} usou Interferência automática contra ${this.player?.name}!`); const myCardIdx = this.player!.cards.findIndex((c: any) => c.id === cardId); if(myCardIdx > -1) this.player!.cards.splice(myCardIdx, 1); document.getElementById('battle-cards-modal')!.style.display = 'none'; if(Network.isOnline) Network.syncPlayerState(); return; } } Cards.activate(cardId); }
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
        const d20 = Math.floor(Math.random() * 20) + 1;
        const modifier = d20 - 10; // Varia de -9 a +10
        let finalChance = baseChance + modifier;
        
        // Limites (sempre haverá 5% de chance de erro ou acerto crítico extremo)
        finalChance = Math.max(5, Math.min(95, finalChance));

        this.logBattle(`Tentando fugir... (🎲${d20}) Chance: ${finalChance}%`, true);

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
            const hpPercent = (opponent.currentHp / opponent.maxHp) * 100;
            if (hpPercent < 15) chance += 50; else if (hpPercent < 60) chance += 25;
            if (activeMon.level > opponent.level) chance += 5; else if (activeMon.level < opponent.level) chance -= 5;
            if (opponent.isLegendary) chance -= 20;
            if (opponent.isShiny) chance -= 10;

            const d20 = Math.floor(Math.random() * 20) + 1;
            const diceBonus = d20 - 10;
            chance += diceBonus;
            chance = Math.max(1, Math.min(95, chance));

            this.logBattle(`(Chance Final: ${chance}% | Sorte: ${diceBonus > 0 ? '+' : ''}${diceBonus}%)`, true);
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