import { Player } from '../models/Player';
import { Pokemon } from '../models/Pokemon';
import { GYM_DATA } from '../constants/gyms';
import { TYPE_CHART } from '../constants/typeChart';
import { SHOP_ITEMS } from '../constants';
import type { ItemData } from '../constants';

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
    static activeCard: string | null = null; 
    static reward: number = 0;
    static battleTitle: string = "Batalha!";
    static plyTeamList: Pokemon[] = []; 
    static oppTeamList: Pokemon[] = []; 
    static pendingCapture: Pokemon | null = null; 
    static isPlayerTurn: boolean = false; 
    static processingAction: boolean = false; 

    static setup(player: Player, enemyMon: Pokemon, isPvP: boolean = false, _label: string = "", reward: number = 0, enemyPlayer: Player | null = null, isGym: boolean = false, gymId: number = 0, npcImage: string = "") {
        const Game = (window as any).Game;

        this.player = player; 
        this.isPvP = isPvP; 
        this.isNPC = (reward > 0 && !isPvP); 
        this.isGym = isGym; 
        this.gymId = gymId; 
        this.reward = reward; 
        this.activeCard = null; 
        this.enemyPlayer = enemyPlayer; 
        this.processingAction = false;
        
        this.battleTitle = isPvP ? "Batalha PvP!" : `Batalha contra ${_label}!`;

        this.plyTeamList = player.getBattleTeam(isGym).slice(0, isGym ? 6 : 3);
        
        if (isPvP && enemyPlayer) { 
            this.oppTeamList = enemyPlayer.getBattleTeam(false); 
            this.opponent = this.oppTeamList[0]; 
        } 
        else if (isGym) {
            const gymData = GYM_DATA.find(g => g.id === gymId);
            const globalAvg = Game.getGlobalAverageLevel();
            const gymLevel = globalAvg + 1; 
            
            if(gymData) {
                this.oppTeamList = gymData.teamIds.map((id: number) => new Pokemon(id, gymLevel, false));
                this.opponent = this.oppTeamList[0];
            } else { 
                this.oppTeamList = [enemyMon]; this.opponent = enemyMon; 
            }
        } else { 
            this.oppTeamList = [enemyMon]; this.opponent = enemyMon; 
        }

        if(this.plyTeamList.length === 0) { 
            alert("Você não tem Pokémons vivos!"); 
            Battle.lose(); 
            return; 
        }
        
        if(this.isNPC && npcImage) {
             (this.opponent as any)._npcImage = npcImage;
             (this.opponent as any)._npcName = _label;
        }

        this.openSelectionModal("Escolha seu Pokémon para começar!");
    }

    static openSelectionModal(title: string) { 
        const modal = document.getElementById('pkmn-select-modal')!; 
        const list = document.getElementById('pkmn-select-list')!; 
        document.getElementById('select-title')!.innerText = title; 
        list.innerHTML = ''; 
        
        this.plyTeamList.forEach((mon) => { 
            const div = document.createElement('div'); 
            div.className = `mon-select-item ${mon.isFainted() ? 'disabled' : ''}`; 
            div.innerHTML = `<img src="${mon.getSprite()}" width="40"><b>${mon.name}</b> <small>(${mon.currentHp}/${mon.maxHp})</small>`; 
            if(!mon.isFainted()) div.onclick = () => { 
                modal.style.display = 'none'; 
                this.startRound(mon); 
            }; 
            list.appendChild(div); 
        }); 
        modal.style.display = 'flex'; 
    }

    static startRound(selectedMon: Pokemon) {
        const Network = (window as any).Network;

        document.getElementById('pkmn-select-modal')!.style.display = 'none'; 
        this.active = true; 
        this.activeMon = selectedMon;
        this.determineTurnOrder();
        this.renderBattleScreen();
        
        const enemyId = this.enemyPlayer ? this.enemyPlayer.id : -1;
        
        if(Network.isOnline && this.player && this.player.id === Network.myPlayerId) {
            const npcImg = (this.opponent as any)._npcImage || "";
            const npcName = (this.opponent as any)._npcName || "";
            Network.sendAction('BATTLE_START', {
                pId: this.player.id, 
                monIdx: this.player.team.indexOf(this.activeMon),
                oppData: this.opponent, 
                isPvP: this.isPvP, 
                reward: this.reward, 
                enemyId, 
                isGym: this.isGym, 
                gymId: this.gymId,
                npcImage: npcImg, 
                npcName: npcName, 
                battleTitle: this.battleTitle
            });
        }
    }

    static determineTurnOrder() { 
        if (!this.activeMon || !this.opponent) return; 
        
        let logMsg = ""; 
        let playerGoesFirst = false; 
        
        if (this.activeMon.speed > this.opponent.speed) { 
            playerGoesFirst = true; 
            logMsg = `💨 ${this.activeMon.name} é mais rápido!`; 
        } else if (this.activeMon.speed < this.opponent.speed) { 
            playerGoesFirst = false; 
            logMsg = `💨 ${this.opponent.name} é mais rápido!`; 
        } else { 
            const roll = Math.floor(Math.random() * 20) + 1; 
            if (roll > 10) { 
                playerGoesFirst = true; 
                logMsg = `🎲 Speed Empatado! Ganhou.`; 
            } else { 
                playerGoesFirst = false; 
                logMsg = `🎲 Speed Empatado! Perdeu.`; 
            } 
        } 
        
        this.isPlayerTurn = playerGoesFirst; 
        this.processingAction = false; 
        this.updateButtons(); 
        this.updateUI(); 
        this.logBattle(logMsg); 
        
        if (!this.isPlayerTurn) { 
            this.processingAction = true; 
            this.updateButtons(); 
            setTimeout(() => this.enemyTurn(), 2000); 
        } 
    }

    static updateButtons() { 
        const Network = (window as any).Network;
        const btns = document.querySelectorAll('.battle-actions button'); 
        const isMyBattle = Network.isOnline ? (this.player && this.player.id === Network.myPlayerId) : true; 
        const canAct = this.isPlayerTurn && !this.processingAction && isMyBattle; 
        
        btns.forEach((btn: Element) => { (btn as HTMLButtonElement).disabled = !canAct; }); 
        
        if(this.isPvP || this.isGym) { 
            const runBtn = document.getElementById('btn-run') as HTMLButtonElement; 
            runBtn.disabled = true; 
            runBtn.title = "Bloqueado"; 
        } 
    }

    static startFromNetwork(payload: any) {
        const Game = (window as any).Game;
        const p = Game.players[payload.pId]; 
        if (!p) return;
        
        this.active = true; 
        this.player = p;
        this.activeMon = p.team[payload.monIdx]; 
        
        this.opponent = new Pokemon(payload.oppData.id, payload.oppData.level, payload.oppData.isShiny);
        Object.assign(this.opponent, payload.oppData);
        
        this.isPvP = payload.isPvP; 
        this.isGym = payload.isGym; 
        this.gymId = payload.gymId;
        this.isNPC = (!payload.isPvP && payload.reward > 0);
        
        if(payload.enemyId >= 0) this.enemyPlayer = Game.players[payload.enemyId];
        if(payload.npcImage) (this.opponent as any)._npcImage = payload.npcImage;
        if(payload.npcName) (this.opponent as any)._npcName = payload.npcName;
        if(payload.battleTitle) this.battleTitle = payload.battleTitle;
        
        this.renderBattleScreen();
    }

    static renderBattleScreen() { 
        document.getElementById('pkmn-select-modal')!.style.display = 'none';
        const bm = document.getElementById('battle-modal');
        if (bm) bm.style.display = 'flex';
        document.getElementById('battle-log-history')!.innerHTML = '';
        document.getElementById('battle-title')!.innerText = this.battleTitle; 
        this.updateButtons(); 
        this.updateUI(); 
    }

    static calculateDamage(attacker: Pokemon, defender: Pokemon): { damage: number, msg: string } {
        const d20 = Math.floor(Math.random() * 20) + 1;
        let rollModifier = 0; 
        let isCritical = false;
        
        if (d20 <= 2) rollModifier = -2; 
        else if (d20 <= 5) rollModifier = -1; 
        else if (d20 <= 10) rollModifier = 0; 
        else if (d20 <= 15) rollModifier = +1; 
        else if (d20 <= 19) rollModifier = +2; 
        else { rollModifier = +3; isCritical = true; }
        
        let defenseVal = defender.def; 
        if (isCritical) defenseVal = Math.floor(defenseVal / 2);
        
        let base = Math.floor((attacker.atk / 5) - (defenseVal / 20)); 
        base = Math.max(1, base);
        
        let rawMulti = 1; 
        if (TYPE_CHART[attacker.type] && (TYPE_CHART[attacker.type] as any)[defender.type] !== undefined) { 
            rawMulti = (TYPE_CHART[attacker.type] as any)[defender.type]; 
        }
        
        let finalMulti = 1; 
        if (rawMulti > 1) finalMulti = 1.5; 
        else if (rawMulti < 1) finalMulti = 0.75; 
        
        const typeDamage = Math.floor(base * finalMulti); 
        const finalDamage = Math.max(0, typeDamage + rollModifier);
        
        let logDetails = `(🎲${d20})`; 
        if (isCritical) logDetails += " 💥!"; 
        if (finalMulti > 1) logDetails += " 🔥!"; 
        if (finalMulti < 1) logDetails += " 🛡️.";
        
        return { damage: finalDamage, msg: logDetails };
    }

    static attack() {
        const Network = (window as any).Network;
        if(!this.activeMon || !this.opponent) return; 
        if (!this.isPlayerTurn || this.processingAction) return;
        
        this.processingAction = true; 
        this.updateButtons();
        
        let calc = this.calculateDamage(this.activeMon, this.opponent); 
        let dmg = calc.damage;
        
        if(this.activeCard === 'crit') { 
            dmg *= 2; 
            this.logBattle("🃏 Crítico (x2)!"); 
            this.activeCard = null; 
        } 
        
        this.opponent.currentHp = Math.max(0, this.opponent.currentHp - dmg);
        const logMsg = `${this.activeMon.name} atacou! 💥${dmg} ${calc.msg}`; 
        this.logBattle(logMsg); 
        this.updateUI();
        
        if(Network.isOnline) { 
            Network.sendAction('BATTLE_UPDATE', { plyHp: this.activeMon.currentHp, oppHp: this.opponent.currentHp, msg: logMsg }); 
        }
        
        if(this.opponent.currentHp <= 0) { 
            setTimeout(() => { this.checkWinCondition(); this.processingAction = false; }, 1000); 
        } else { 
            this.isPlayerTurn = false; 
            this.updateButtons(); 
            setTimeout(() => this.enemyTurn(), 2000); 
        }
    }

    static enemyTurn() {
        const Network = (window as any).Network;
        if(!this.activeMon || !this.opponent) return; 
        
        this.processingAction = true; 
        this.isPlayerTurn = false; 
        
        let calc = this.calculateDamage(this.opponent, this.activeMon); 
        let dmg = calc.damage;
        
        this.activeMon.currentHp = Math.max(0, this.activeMon.currentHp - dmg);
        const logMsg = `${this.opponent.name} atacou! 💥${dmg} ${calc.msg}`; 
        this.logBattle(logMsg); 
        this.updateUI();
        
        if(Network.isOnline && this.player && this.player.id === Network.myPlayerId) { 
            Network.sendAction('BATTLE_UPDATE', { plyHp: this.activeMon.currentHp, oppHp: this.opponent.currentHp, msg: logMsg }); 
        }
        
        if(this.activeMon.currentHp <= 0) { 
            setTimeout(() => { this.handleFaint(); }, 1000); 
        } else { 
            this.isPlayerTurn = true; 
            this.processingAction = false; 
            this.updateButtons(); 
        }
    }

    static checkWinCondition() {
        const nextOpp = this.oppTeamList.find(p => !p.isFainted() && p !== this.opponent);
        if (nextOpp) { 
            this.opponent = nextOpp; 
            this.logBattle(`Rival enviou ${nextOpp.name}!`); 
            this.determineTurnOrder(); 
        } else { 
            this.win(); 
        }
    }

    static handleFaint() {
        const nextPly = this.plyTeamList.find(p => !p.isFainted());
        if (nextPly) { 
            this.logBattle(`${this.activeMon!.name} desmaiou!`); 
            document.getElementById('battle-modal')!.style.display = 'none'; 
            this.openSelectionModal("Escolha o próximo!"); 
        } else { 
            this.lose(); 
        }
    }

    static logBattle(msg: string) { 
        //const Game = (window as any).Game;
        const el = document.getElementById('battle-msg'); 
        if(el) el.innerText = msg; 
        
        const logContainer = document.getElementById('battle-log-history');
        if(logContainer) {
            logContainer.insertAdjacentHTML('afterbegin', `<div style="border-bottom:1px solid #555; padding:2px;">${msg}</div>`);
        }
        
        // Log local de batalha, não global (para não spamar o chat principal com cada ataque)
        // Se quiser ver ataque por ataque no chat principal, mude para sendGlobalLog
        // Game.log(`[Batalha] ${msg}`); 
    }
    
    static getHpColor(current: number, max: number) { 
        const pct = (current / max) * 100; 
        if(pct > 50) return 'hp-green'; 
        if(pct > 10) return 'hp-yellow'; 
        return 'hp-red'; 
    }
    
    static updateUI() {
        if(!this.activeMon || !this.opponent) return; 
        if(!this.player) return;
        
        // Player UI
        document.getElementById('ply-name')!.innerText = this.activeMon.name;
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

        // Opponent UI
        document.getElementById('opp-name')!.innerText = this.opponent.name;
        document.getElementById('opp-lvl')!.innerText = `Lv.${this.opponent.level}`;
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
        } else if (this.isGym) { 
            const gData = GYM_DATA.find(g => g.id === this.gymId); 
            if(gData) oppTrainer.src = `/assets/img/LideresGym/${gData.leaderImg}`; 
            oppTrainer.style.display = 'block'; 
        } else if (this.isNPC) { 
            const npcImg = (this.opponent as any)._npcImage;
            if (npcImg) {
                oppTrainer.src = npcImg; 
                oppTrainer.style.display = 'block'; 
            } else {
                oppTrainer.src = '/assets/img/Treinadores/Red.jpg';
                oppTrainer.style.display = 'block'; 
            }
        } else { 
            oppTrainer.style.display = 'none'; 
        }

        if(!this.isNPC && !this.isGym && !this.isPvP) { 
            document.getElementById('ply-team-indicator')!.innerHTML = ''; 
            document.getElementById('opp-team-indicator')!.innerHTML = ''; 
        } else { 
            this.renderTeamIcons('ply-team-indicator', this.plyTeamList); 
            this.renderTeamIcons('opp-team-indicator', this.oppTeamList); 
        }
    }

    static renderTeamIcons(elId: string, list: Pokemon[]) { 
        document.getElementById(elId)!.innerHTML = list.map(p => `<div class="ball-icon ${p.isFainted() ? 'lost' : ''}"></div>`).join(''); 
    }

    static updateFromNetwork(payload: any) { 
        if(!this.activeMon || !this.opponent) return; 
        this.activeMon.currentHp = payload.plyHp; 
        this.opponent.currentHp = payload.oppHp; 
        this.logBattle(payload.msg); 
        this.updateUI(); 
    }
    
    static win() {
        const Game = (window as any).Game;
        const Network = (window as any).Network;

        if(Network.isOnline && Game.turn !== Network.myPlayerId && Network.myPlayerId !== 0) return;
        
        let gain = 0; 
        let xpGain = 0; 
        let msg = "VITÓRIA! ";
        
        if(this.isPvP) xpGain = 15; 
        else if(this.isGym) xpGain = 25; 
        else if(this.isNPC) xpGain = 10; 
        else xpGain = 5; 
        
        if (this.opponent!.level >= this.activeMon!.level + 2) { 
            xpGain += 5; 
            msg += "(+Bônus Desafio) "; 
        }
        
        if(this.isPvP && this.enemyPlayer) { 
            if(this.enemyPlayer.gold > 0) { 
                gain = Math.floor(this.enemyPlayer.gold * 0.3); 
                this.enemyPlayer.gold -= gain; 
                msg += `Roubou ${gain}G!`; 
            } else { 
                gain = 100; 
                this.enemyPlayer.skipTurn = true; 
                msg += `Inimigo falido (Perde vez)!`; 
            } 
            this.enemyPlayer.x = 0; 
            this.enemyPlayer.y = 0; 
            this.enemyPlayer.team.forEach(p => p.heal(999)); 
            this.enemyPlayer.skipTurn = true; 
            Game.sendGlobalLog(`[PvP] ${this.enemyPlayer.name} voltou ao início.`); 
        } 
        else if (this.isGym) { 
            gain = 1000; 
            if (!this.player!.badges[this.gymId - 1]) { 
                this.player!.badges[this.gymId - 1] = true; 
                msg += ` Insígnia ${this.gymId}!`; 
            } 
        }
        else if (this.isNPC) { gain = this.reward; } 
        else { gain = 150; }
        
        this.player!.gold += gain; 
        this.activeMon!.gainXp(xpGain, this.player!);
        
        if(Network.isOnline) Network.syncPlayerState();
        
        alert(msg); 
        Game.sendGlobalLog(`${this.player?.name} venceu! ${msg} (${this.activeMon?.name} +${xpGain}XP)`); 
        setTimeout(() => this.end(false), 1000);
    }

    static lose() {
        const Game = (window as any).Game;
        const Network = (window as any).Network;

        let msg = "DERROTA... "; 
        this.player!.gold = Math.max(0, this.player!.gold - 100); 
        this.player!.team.forEach(p => p.heal(999)); 
        this.player!.x = 0; 
        this.player!.y = 0; 
        this.player!.skipTurn = true;
        
        let xpGain = 0; 
        if(this.isPvP) xpGain = 5; 
        else if(this.isGym) xpGain = 8; 
        else if(this.isNPC) xpGain = 3; 
        else xpGain = 2; 
        
        if(this.activeMon) this.activeMon.gainXp(xpGain, this.player!);
        
        if (this.isPvP && this.enemyPlayer) { 
            this.enemyPlayer.team[0].gainXp(15, this.enemyPlayer); 
            msg += ` ${this.enemyPlayer.name} venceu!`; 
        } 
        
        if(Network.isOnline) { 
            Network.sendAction('PLAYER_SYNC', { id: this.player!.id, x: 0, y: 0, gold: this.player!.gold, team: this.player!.team, items: this.player!.items }); 
            Network.syncPlayerState(); 
        }
        
        alert(msg); 
        Game.sendGlobalLog(`${this.player?.name} perdeu e voltou ao início! (+${xpGain}XP)`); 
        setTimeout(() => { 
            this.end(false); 
            Game.moveVisuals(); 
        }, 1500);
    }

    static end(isRemote: boolean) { 
        const Game = (window as any).Game;
        const Network = (window as any).Network;

        this.active = false; 
        this.opponent = null; 
        document.getElementById('battle-modal')!.style.display = 'none'; 
        
        if(!isRemote) { 
            if(Network.isOnline) Network.sendAction('BATTLE_END', {}); 
            Game.nextTurn(); 
        } 
    }
    
    // ... resto do código igual ...
    static openBag() { 
        if (!this.isPlayerTurn || this.processingAction) return; 
        const list = document.getElementById('battle-bag-list')!; 
        list.innerHTML = ''; 
        
        Object.keys(this.player!.items).forEach(key => { 
            if(this.player!.items[key] > 0) { 
                const item = SHOP_ITEMS.find(i => i.id === key); 
                if(item) { 
                    const btn = document.createElement('button'); 
                    btn.className = 'btn'; 
                    btn.innerHTML = `<img src="/assets/img/Itens/${item.icon}" class="item-icon-mini"> ${item.name} x${this.player!.items[key]}`; 
                    btn.onclick = () => this.useItem(key, item); 
                    list.appendChild(btn); 
                } 
            } 
        }); 
        document.getElementById('battle-bag')!.style.display = 'block'; 
    }

    static useItem(key: string, data: ItemData) { 
        const Network = (window as any).Network;
        document.getElementById('battle-bag')!.style.display = 'none'; 
        
        if(data.type === 'capture' && (this.isPvP || this.isNPC || this.isGym)) { 
            alert("Não pode capturar pokémons de treinadores!"); 
            return; 
        } 
        
        this.player!.items[key]--; 
        this.processingAction = true; 
        this.updateButtons(); 
        
        if(data.type === 'heal') { 
            this.activeMon!.heal(data.val!); 
            this.logBattle("Usou item de cura!"); 
            this.updateUI(); 
            if(Network.isOnline) Network.sendAction('BATTLE_UPDATE', { plyHp: this.activeMon!.currentHp, oppHp: this.opponent!.currentHp, msg: "Usou Cura!" }); 
            setTimeout(() => this.enemyTurn(), 1500); 
        } else if(data.type === 'capture') { 
            this.attemptCapture(data.rate!); 
        } 
        
        if(Network.isOnline) Network.syncPlayerState(); 
    }

    static attemptCapture(rate: number) { 
        const Game = (window as any).Game;
        if(!this.opponent) return; 
        const chance = ((1 - (this.opponent.currentHp/this.opponent.maxHp)) * rate) + 0.2; 
        
        setTimeout(() => { 
            if(Math.random() < chance) { 
                this.logBattle(`✨ Capturou ${this.opponent!.name}!`); 
                this.activeMon!.gainXp(3, this.player!); 
                if(this.player!.team.length < 6) { 
                    this.player!.team.push(this.opponent!); 
                    setTimeout(() => this.end(false), 1500); 
                } else { 
                    this.pendingCapture = this.opponent; 
                    Game.openSwapModal(this.pendingCapture); 
                } 
            } else { 
                this.logBattle("Escapou!"); 
                setTimeout(() => this.enemyTurn(), 1000); 
            } 
        }, 1000); 
    }

    static openSwapModal() { 
        const Game = (window as any).Game;
        Game.openSwapModal(this.pendingCapture!); 
    }

    static openCardSelection() { 
        if (!this.isPlayerTurn || this.processingAction) return; 
        const list = document.getElementById('battle-cards-list')!; 
        list.innerHTML = ''; 
        
        const battleCards = this.player!.cards.filter(c => c.type === 'battle'); 
        
        if(battleCards.length === 0) { 
            list.innerHTML = "<em>Sem cartas de batalha.</em>"; 
        } else { 
            battleCards.forEach(c => { 
                const d = document.createElement('div'); 
                d.className='card-item'; 
                d.innerHTML = `<div class="card-info"><span class="card-name">${c.icon} ${c.name} <span class="card-type-badge type-battle">BATTLE</span></span><span class="card-desc">${c.desc}</span></div><button class="btn-use-card" onclick="window.Battle.useCard('${c.id}')">USAR</button>`; 
                list.appendChild(d); 
            }); 
        } 
        document.getElementById('battle-cards-modal')!.style.display = 'flex'; 
    }

    static useCard(cardId: string) { 
        const Network = (window as any).Network;
        document.getElementById('battle-cards-modal')!.style.display = 'none'; 
        
        const cardIndex = this.player!.cards.findIndex(c => c.id === cardId); 
        if(cardIndex === -1) return; 
        
        const card = this.player!.cards[cardIndex]; 
        
        if (card.id === 'run') { 
            this.player!.cards.splice(cardIndex, 1); 
            this.logBattle("Usou Carta de Fuga!"); 
            this.activeMon!.gainXp(2, this.player!); 
            this.end(false); 
        } else if (card.id === 'crit') { 
            this.player!.cards.splice(cardIndex, 1); 
            this.activeCard = 'crit'; 
            this.logBattle("Usou Ataque Crítico! Próximo ataque x2."); 
        } else { 
            this.player!.cards.splice(cardIndex, 1); 
            this.activeCard = card.id; 
            this.logBattle(`Usou ${card.name}!`); 
        } 
        
        if(Network.isOnline) Network.syncPlayerState(); 
    }

    static run() { 
        if(this.isPvP || this.isNPC || this.isGym) { 
            alert("Não pode fugir!"); 
        } else { 
            this.activeMon!.gainXp(2, this.player!); 
            this.end(false); 
        } 
    }
}