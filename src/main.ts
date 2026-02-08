import './style.css'
// IMPORTAÇÕES DAS CONSTANTES
import { TILE, NPC_DATA, CARDS_DB, SHOP_ITEMS } from './constants'; 
import { POKEDEX } from './constants/pokedex';
import { PLAYER_COLORS } from './constants/playerColors';
import { TRAINER_IMAGES } from './constants/trainerImages';
import { POKEMON_TYPES } from './constants/pokemonTypes';
import { TYPE_CHART } from './constants/typeChart';
import { GYM_DATA } from './constants/gyms';

import type { ItemData, CardData, Coord } from './constants';

declare const Peer: any;

declare global {
    interface Window {
        Setup: typeof Setup;
        Game: typeof Game;
        Shop: typeof Shop;
        Battle: typeof Battle;
        Network: typeof Network;
        openInventory: (playerId: number) => void;
        openCards: (playerId: number) => void;
        openCardLibrary: () => void;
        openXpRules: () => void;
    }
}

// ==========================================
// REDE (MULTIPLAYER & HANDSHAKE)
// ==========================================
class Network {
    static peer: any = null;
    static conn: any = null;
    static isHost: boolean = false;
    static isOnline: boolean = false;
    static myPlayerId: number = 0; 
    static localName: string = "";

    static createRoom() {
        const nameInput = document.getElementById('online-player-name') as HTMLInputElement;
        if(!nameInput.value) return alert("Digite seu nome primeiro!");
        this.localName = nameInput.value;
        const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.initPeer(roomCode, true);
    }

    static joinRoom() {
        const nameInput = document.getElementById('online-player-name') as HTMLInputElement;
        if(!nameInput.value) return alert("Digite seu nome primeiro!");
        this.localName = nameInput.value;
        const code = (document.getElementById('room-code-input') as HTMLInputElement).value.toUpperCase();
        if(!code) return alert("Digite o código da sala!");
        this.initPeer(code, false);
    }

    static initPeer(id: string, host: boolean) {
        this.isHost = host;
        this.isOnline = true;
        this.myPlayerId = host ? 0 : 1; 
        const fullId = "pkbd-v25-" + id; 
        try { this.peer = new Peer(host ? fullId : null); } catch(e) { alert("Erro PeerJS"); return; }

        this.peer.on('open', (_id: string) => {
            document.getElementById('lobby-status')!.innerHTML = 
                `Status: ${host ? "HOST" : "CLIENT"}<br>Sala: <b>${host ? id : "Conectando..."}</b>`;
            if(host) {
                this.peer.on('connection', (c: any) => { this.conn = c; this.setupConnection(); });
            } else {
                this.conn = this.peer.connect(fullId); this.setupConnection();
            }
        });
        this.peer.on('error', (err: any) => { alert("Erro Rede: " + err.type); this.isOnline = false; });
    }

    static setupConnection() {
        this.conn.on('open', () => { this.send('HANDSHAKE', { name: this.localName }); });
        this.conn.on('data', (data: any) => this.handleData(data));
    }

    static send(type: string, payload: any) {
        if(this.isOnline && this.conn) this.conn.send({ type, payload });
    }

    static broadcastState() {
        if(this.isOnline && this.conn) this.conn.send({ type: 'GAME_STATE', payload: Game.getSaveData() });
    }

    static handleData(data: any) {
        switch(data.type) {
            case 'HANDSHAKE':
                document.getElementById('lobby-status')!.innerHTML += `<br>🤝 Oponente: ${data.payload.name}`;
                if(this.isHost) Setup.showSetupScreen();
                else document.getElementById('lobby-status')!.innerHTML = `Conectado a ${data.payload.name}! Aguardando Host...`;
                break;
            case 'GAME_STATE': case 'FULL_STATE': Game.loadGameFromData(data.payload); break;
            case 'ROLL_DICE': Game.animateDice(data.payload.result); break;
            case 'MOVE_STEP': Game.performVisualStep(data.payload.playerId, data.payload.x, data.payload.y); break;
            case 'TURN_CHANGE': 
                Game.turn = data.payload.turn; Game.updateHUD(); Game.checkTurnControl(); break;
            case 'BATTLE_START': Battle.startFromNetwork(data.payload); break;
            case 'BATTLE_UPDATE': Battle.updateFromNetwork(data.payload); break;
            case 'BATTLE_END': Battle.end(true); break;
            case 'LOG_MSG': Game.log(data.payload.msg); break;
        }
    }
}

// ==========================================
// CLASSES (POKEMON / PLAYER)
// ==========================================
class Pokemon {
    id: number; name: string; type: string;
    maxHp: number; currentHp: number; atk: number; def: number; speed: number;
    level: number; currentXp: number; maxXp: number;
    isShiny: boolean; wins: number; evoData: any;
    leveledUpThisTurn: boolean = false;

    constructor(templateId: number, isShiny: boolean = false) {
        const template = POKEDEX.find(p => p.id === templateId) || POKEDEX[0];
        this.id = template.id; this.name = template.name; this.isShiny = isShiny;
        this.type = template.type || POKEMON_TYPES[this.name] || 'Normal';
        this.level = 1; this.currentXp = 0; this.maxXp = 20;
        
        const bonus = isShiny ? 1.2 : 1.0;
        this.maxHp = Math.floor((template.hp + 20) * bonus); this.currentHp = this.maxHp;
        this.atk = Math.floor((template.atk + 5) * bonus);
        this.def = Math.floor((template.atk * 0.8) * bonus); 
        this.speed = Math.floor((template.atk * 0.9) * bonus);
        this.wins = 0; this.evoData = { next: template.nextForm, trigger: template.evoTrigger };
    }
    getSprite() { return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${this.isShiny ? 'shiny/' : ''}${this.id}.png`; }
    isFainted() { return this.currentHp <= 0; }
    heal(amt: number) { this.currentHp = Math.min(this.maxHp, this.currentHp + amt); }

    gainXp(amount: number, player: Player) {
        if(this.level >= 15) return;
        this.currentXp += amount;
        if(this.currentXp >= this.maxXp && !this.leveledUpThisTurn) {
            this.currentXp -= this.maxXp; 
            this.levelUp(player);
            this.leveledUpThisTurn = true;
        }
    }

    levelUp(player: Player | null) {
        this.level++;
        this.maxHp += 5; this.currentHp = this.maxHp; 
        this.atk += 2; this.def += 1;
        this.maxXp = this.level * 20;
        if(player) Game.log(`${this.name} subiu para o Nível ${this.level}!`);
        this.checkEvolution(player);
    }

    forceLevel(targetLevel: number) {
        while(this.level < targetLevel) { this.levelUp(null); }
        this.currentHp = this.maxHp; 
    }

    checkEvolution(player: Player | null): boolean {
        if (this.evoData.next && this.level >= (this.evoData.trigger || 999)) {
            const next = POKEDEX.find(p => p.name === this.evoData.next);
            if (next) {
                const oldName = this.name;
                this.id = next.id; this.name = next.name; this.type = next.type || this.type;
                this.maxHp += 30; this.currentHp = this.maxHp;
                this.atk += 10; this.def += 5;
                this.evoData = { next: next.nextForm, trigger: next.evoTrigger };
                
                if(player) {
                    Game.log(`✨ ${oldName} evoluiu para ${this.name}! (HP Restaurado)`);
                    if (this.level === 8) { Cards.draw(player); Cards.draw(player); Game.log("Bônus Evolução: Ganhou 2 Cartas!"); } 
                    else if (this.level === 5 || this.level === 10) { Cards.draw(player); Game.log("Bônus Evolução: Ganhou 1 Carta!"); }
                }
                return true;
            }
        }
        return false;
    }
}

class Player {
    id: number; name: string; avatar: string; 
    x: number = 0; y: number = 0; gold: number = 500;
    items: {[key:string]:number} = {'pokeball':6, 'potion':1};
    cards: CardData[] = []; team: Pokemon[] = [];
    skipTurn: boolean = false; 
    badges: boolean[] = [false,false,false,false,false,false,false,false];

    constructor(id: number, name: string, avatarFile: string) {
        this.id = id; this.name = name;
        this.avatar = `/assets/img/Treinadores/${avatarFile}`;
        if(name !== "_LOAD_") {
            const starters = [1, 4, 7]; 
            this.team.push(new Pokemon(starters[Math.floor(Math.random()*starters.length)]));
        }
    }
    isDefeated() { 
        const battleTeam = this.getBattleTeam(false); 
        return battleTeam.length === 0 || battleTeam.every(p => p.isFainted());
    }
    getBattleTeam(isGymLimit: boolean) {
        const limit = isGymLimit ? 6 : 3;
        return this.team.filter(p => !p.isFainted()).slice(0, limit); 
    }
    resetTurnFlags() { this.team.forEach(p => p.leveledUpThisTurn = false); }
}

class MapSystem {
    static grid: number[][] = []; static size: number = 20; 
    static gymLocations: {[key: string]: number} = {};

    static generate(size: number) {
        this.size = size; this.grid = Array(size).fill(0).map(() => Array(size).fill(TILE.GRASS));
        this.gymLocations = {};
        for(let i=0; i<Math.floor(size/2); i++) this.blob(TILE.WATER, 3);
        for(let i=0; i<Math.floor(size/2); i++) this.blob(TILE.GROUND, 2); 
        const tiles = size*size; let gyms=0;
        for(let i=0; i<tiles; i++) {
            const c = this.getCoord(i);
            if(i>0 && i%Math.floor(tiles/9)===0 && gyms<8) { 
                this.grid[c.y][c.x]=TILE.GYM; gyms++; 
                this.gymLocations[`${c.x},${c.y}`] = gyms;
            }
            else if(i>0 && i%75===0) this.grid[c.y][c.x]=TILE.CITY;
            else if(Math.random()<0.05 && this.grid[c.y][c.x]===TILE.GRASS) this.grid[c.y][c.x]=TILE.EVENT;
            else if(Math.random()<0.08 && this.grid[c.y][c.x]===TILE.GRASS) this.grid[c.y][c.x] = [TILE.ROCKET, TILE.BIKER, TILE.YOUNG][Math.floor(Math.random()*3)];
        }
        this.grid[0][0]=TILE.CITY;
    }
    static blob(t: number, s: number) {
        const cx=Math.floor(Math.random()*this.size), cy=Math.floor(Math.random()*this.size);
        for(let y=cy-s; y<=cy+s; y++) for(let x=cx-s; x<=cx+s; x++) if(x>=0 && x<this.size && y>=0 && y<this.size) this.grid[y][x]=t;
    }
    static getCoord(i: number): Coord { 
        const y=Math.floor(i/this.size); let x=i%this.size; if(y%2!==0) x=(this.size-1)-x; return {x,y}; 
    }
    static getIndex(x: number, y: number): number {
        let realX = x;
        if(y % 2 !== 0) realX = (this.size - 1) - x;
        return (y * this.size) + realX;
    }
}

// ==========================================
// BATALHA (LÓGICA REESCRITA)
// ==========================================
class Battle {
    static active: boolean = false;
    static player: Player | null = null;
    static activeMon: Pokemon | null = null; 
    static opponent: Pokemon | null = null;
    static enemyPlayer: Player | null = null; 
    
    // Configurações
    static isPvP: boolean = false;
    static isNPC: boolean = false; 
    static isGym: boolean = false;
    static gymId: number = 0;
    static activeCard: string | null = null;
    static reward: number = 0;

    // Listas de Pokémons
    static plyTeamList: Pokemon[] = [];
    static oppTeamList: Pokemon[] = [];
    static pendingCapture: Pokemon | null = null; 

    // --- CONTROLE DE TURNO E ESTADO (ANTI-BUG) ---
    // 'isPlayerTurn': Indica se a lógica do jogo considera a vez do jogador.
    // 'processingAction': Bloqueia inputs enquanto animações/delays ocorrem.
    static isPlayerTurn: boolean = false;  
    static processingAction: boolean = false; 

    static setup(player: Player, enemyMon: Pokemon, isPvP: boolean = false, _label: string = "", reward: number = 0, enemyPlayer: Player | null = null, isGym: boolean = false, gymId: number = 0) {
        this.player = player; 
        this.isPvP = isPvP; 
        this.isNPC = (reward > 0 && !isPvP);
        this.isGym = isGym; 
        this.gymId = gymId; 
        this.reward = reward; 
        this.activeCard = null; 
        this.enemyPlayer = enemyPlayer;

        // Reset de Estado
        this.processingAction = false;
        
        // Time do Jogador (até 6 no ginásio, até 3 fora)
        this.plyTeamList = player.getBattleTeam(isGym).slice(0, isGym ? 6 : 3);
        
        // Define oponente
        if (isPvP && enemyPlayer) {
            this.oppTeamList = enemyPlayer.getBattleTeam(false);
            this.opponent = this.oppTeamList[0];
        } else if (isGym) {
            const gymData = GYM_DATA.find(g => g.id === gymId);
            if(gymData) {
                const allPokemons = Game.players.flatMap(p => p.team);
                const avgLvl = Math.floor(allPokemons.reduce((sum, p) => sum + p.level, 0) / allPokemons.length) + 1;
                this.oppTeamList = gymData.teamIds.map(id => {
                    const p = new Pokemon(id); p.forceLevel(avgLvl); return p;
                });
                this.opponent = this.oppTeamList[0];
                Game.log(`Desafiando Líder ${gymData.leaderName} (Nvl ${avgLvl})!`);
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
            if(!mon.isFainted()) div.onclick = () => { modal.style.display = 'none'; this.startRound(mon); };
            list.appendChild(div);
        });
        modal.style.display = 'flex';
    }

    static startRound(selectedMon: Pokemon) {
        this.active = true; 
        this.activeMon = selectedMon;
        
        // 1. DETERMINAR ORDEM DE ATAQUE (Iniciativa)
        this.determineTurnOrder();

        this.renderBattleScreen();
        
        const enemyId = this.enemyPlayer ? this.enemyPlayer.id : -1;
        Network.send('BATTLE_START', {
            pId: this.player!.id, 
            monIdx: this.player!.team.indexOf(this.activeMon),
            oppData: this.opponent, 
            isPvP: this.isPvP, 
            reward: this.reward, 
            enemyId, 
            isGym: this.isGym, 
            gymId: this.gymId
        });
    }

    // --- NOVA LÓGICA DE ORDEM DE ATAQUE ---
    static determineTurnOrder() {
        if (!this.activeMon || !this.opponent) return;

        let logMsg = "";
        let playerGoesFirst = false;

        // Compara Velocidade
        if (this.activeMon.speed > this.opponent.speed) {
            playerGoesFirst = true;
            logMsg = `💨 ${this.activeMon.name} (${this.activeMon.speed}) é mais rápido que ${this.opponent.name} (${this.opponent.speed})!`;
        } else if (this.activeMon.speed < this.opponent.speed) {
            playerGoesFirst = false;
            logMsg = `💨 ${this.opponent.name} (${this.opponent.speed}) é mais rápido que ${this.activeMon.name} (${this.activeMon.speed})!`;
        } else {
            // Empate: Rolar 1d20
            const roll = Math.floor(Math.random() * 20) + 1;
            if (roll > 10) {
                playerGoesFirst = true;
                logMsg = `🎲 Speed Empatado! Player rolou ${roll} (>10). Vai primeiro!`;
            } else {
                playerGoesFirst = false;
                logMsg = `🎲 Speed Empatado! Player rolou ${roll} (<=10). Rival vai primeiro!`;
            }
        }

        // Define o estado do turno
        this.isPlayerTurn = playerGoesFirst;
        this.processingAction = false;
        
        // Atualiza UI e Log
        this.updateButtons(); // Bloqueia/Desbloqueia botões
        this.updateUI();
        this.logBattle(logMsg);

        // Se o inimigo começa, dispara o turno dele com atraso
        if (!this.isPlayerTurn) {
            this.processingAction = true; // Bloqueia player enquanto espera
            this.updateButtons();
            setTimeout(() => this.enemyTurn(), 2000);
        }
    }

    static updateButtons() {
        const btns = document.querySelectorAll('.battle-actions button');
        const canAct = this.isPlayerTurn && !this.processingAction;
        
        btns.forEach((btn: Element) => {
            const button = btn as HTMLButtonElement;
            button.disabled = !canAct;
            // Botão de fugir tem regra especial
            if (button.id === 'btn-run' && (this.isPvP || this.isGym)) {
                button.disabled = true; // Sempre travado em PvP/Gym a menos que use carta
                button.title = "Fuga bloqueada! Use uma carta.";
            } else {
                button.title = "";
            }
        });
    }

    static startFromNetwork(payload: any) {
        this.active = true; 
        this.player = Game.players[payload.pId];
        this.activeMon = this.player.team[payload.monIdx];
        const opp = payload.oppData;
        this.opponent = new Pokemon(opp.id, opp.isShiny);
        Object.assign(this.opponent, opp);
        this.isPvP = payload.isPvP; 
        this.isGym = payload.isGym; 
        this.gymId = payload.gymId;
        if(payload.enemyId >= 0) this.enemyPlayer = Game.players[payload.enemyId];
        this.renderBattleScreen();
    }

    static renderBattleScreen() { 
        document.getElementById('battle-modal')!.style.display = 'flex'; 
        this.updateButtons();
        this.updateUI(); 
    }

    // --- NOVA FÓRMULA DE DANO (SOLICITAÇÃO 2 & 3) ---
    static calculateDamage(attacker: Pokemon, defender: Pokemon): { damage: number, msg: string } {
        // 1. Rolar D20
        const d20 = Math.floor(Math.random() * 20) + 1;
        let rollModifier = 0;
        let isCritical = false;

        // Tabela de Modificadores do D20
        if (d20 <= 2) rollModifier = -2;
        else if (d20 <= 5) rollModifier = -1;
        else if (d20 <= 10) rollModifier = 0;
        else if (d20 <= 15) rollModifier = +1;
        else if (d20 <= 19) rollModifier = +2;
        else { // 20 Natural (Crítico)
            rollModifier = +3;
            isCritical = true;
        }

        // 2. Base de Dano
        // base = floor((atk / 10) - (def / 20))
        let defenseVal = defender.def;
        
        // CRÍTICO: Ignora metade da defesa
        if (isCritical) {
            defenseVal = Math.floor(defenseVal / 2);
        }

        let base = Math.floor((attacker.atk / 5) - (defenseVal / 20));
        base = Math.max(1, base); // Mínimo 1

        // 3. Multiplicador de Tipo
        // Vantagem: 1.5, Desvantagem: 0.75, Normal: 1
        let rawMulti = 1;
        if (TYPE_CHART[attacker.type] && TYPE_CHART[attacker.type][defender.type] !== undefined) {
            rawMulti = TYPE_CHART[attacker.type][defender.type];
        }

        let finalMulti = 1;
        if (rawMulti > 1) finalMulti = 1.5;      // Super efetivo
        else if (rawMulti < 1) finalMulti = 0.75; // Pouco efetivo (inclui 0)
        else finalMulti = 1;                     // Normal

        const typeDamage = Math.floor(base * finalMulti);

        // 4. Dano Final
        const finalDamage = Math.max(0, typeDamage + rollModifier);

        // Monta mensagem do log
        let logDetails = `(🎲${d20})`;
        if (isCritical) logDetails += " 💥CRÍTICO!";
        if (finalMulti > 1) logDetails += " 🔥Super!";
        if (finalMulti < 1) logDetails += " 🛡️Resistiu.";
        if (rollModifier !== 0 && !isCritical) logDetails += ` Mod:${rollModifier>0?'+':''}${rollModifier}`;

        return { damage: finalDamage, msg: logDetails };
    }

    // --- AÇÃO DO JOGADOR (ATACAR) ---
    static attack() {
        if(!this.activeMon || !this.opponent) return;
        // BLOQUEIO DE BUG: Se não for vez do player ou já estiver processando, sai.
        if (!this.isPlayerTurn || this.processingAction) return;

        this.processingAction = true; // Trava UI
        this.updateButtons();

        // Calcular Dano
        let calc = this.calculateDamage(this.activeMon, this.opponent);
        let dmg = calc.damage;

        // Carta Critico (Bônus extra do jogo base)
        if(this.activeCard === 'crit') { 
            dmg *= 2; 
            this.logBattle("🃏 Carta Crítico Ativada (x2)!");
            this.activeCard = null; 
        } 

        // Aplicar Dano
        this.opponent.currentHp = Math.max(0, this.opponent.currentHp - dmg);
        
        // Logar e Atualizar UI
        this.logBattle(`${this.activeMon.name} atacou! 💥${dmg} ${calc.msg}`);
        this.updateUI();
        
        // Sync Online
        Network.send('BATTLE_UPDATE', { plyHp: this.activeMon.currentHp, oppHp: this.opponent.currentHp, msg: `Oponente: ${this.activeMon.name} tirou ${dmg}!` });

        // Verifica Fim ou Passa a Vez
        if(this.opponent.currentHp <= 0) {
            setTimeout(() => {
                this.checkWinCondition();
                this.processingAction = false; 
            }, 1000);
        } else {
            // Passa a vez para o inimigo
            this.isPlayerTurn = false;
            this.updateButtons(); // Desabilita botões
            setTimeout(() => this.enemyTurn(), 2000); // Delay maior para leitura
        }
    }

    // --- AÇÃO DO INIMIGO (IA) ---
    static enemyTurn() {
        if(!this.activeMon || !this.opponent) return;
        
        // Garante estado
        this.processingAction = true;
        this.isPlayerTurn = false; 

        // Calcular Dano (Inimigo -> Jogador)
        let calc = this.calculateDamage(this.opponent, this.activeMon);
        let dmg = calc.damage;

        // Aplicar Dano
        this.activeMon.currentHp = Math.max(0, this.activeMon.currentHp - dmg);
        
        // Logar e Atualizar UI
        this.logBattle(`${this.opponent.name} atacou! 💥${dmg} ${calc.msg}`);
        this.updateUI();

        // Sync Online
        Network.send('BATTLE_UPDATE', { plyHp: this.activeMon.currentHp, oppHp: this.opponent.currentHp, msg: `Inimigo: ${this.opponent.name} tirou ${dmg}!` });

        // Verifica Fim ou Passa a Vez
        if(this.activeMon.currentHp <= 0) {
            setTimeout(() => {
                this.handleFaint();
            }, 1000);
        } else {
            // Devolve a vez para o jogador
            this.isPlayerTurn = true;
            this.processingAction = false;
            this.updateButtons(); // Reabilita botões
        }
    }

    static checkWinCondition() {
        const nextOpp = this.oppTeamList.find(p => !p.isFainted());
        if (nextOpp) {
            this.opponent = nextOpp;
            this.logBattle(`Rival enviou ${nextOpp.name}!`);
            // Recalcula iniciativa na troca
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
            // Abre modal para escolher o próximo
            this.openSelectionModal("Escolha o próximo!");
            // processingAction será resetado quando startRound for chamado
        } else { 
            this.lose(); 
        }
    }

    // --- MÉTODOS DE CONTROLE VISUAL ---
    static logBattle(msg: string) {
        // Atualiza o texto rápido do modal
        document.getElementById('battle-msg')!.innerText = msg;
        // Adiciona ao histórico lateral (Log)
        Game.log(`[Batalha] ${msg}`);
    }

    static getHpColor(current: number, max: number) {
        const pct = (current / max) * 100;
        if(pct > 50) return 'hp-green';
        if(pct > 10) return 'hp-yellow'; 
        return 'hp-red';
    }

    static updateUI() {
        if(!this.activeMon || !this.opponent) return;
        
        // Player
        document.getElementById('ply-name')!.innerText = this.activeMon.name;
        document.getElementById('ply-lvl')!.innerText = `Lv.${this.activeMon.level}`;
        (document.getElementById('ply-img') as HTMLImageElement).src = this.activeMon.getSprite();
        const plyPct = (this.activeMon.currentHp/this.activeMon.maxHp)*100;
        const plyBar = document.getElementById('ply-hp')!;
        plyBar.style.width = plyPct + "%";
        plyBar.className = `hp-fill ${this.getHpColor(this.activeMon.currentHp, this.activeMon.maxHp)}`;
        document.getElementById('ply-hp-text')!.innerText = `${this.activeMon.currentHp}/${this.activeMon.maxHp}`;
        (document.getElementById('ply-trainer-img') as HTMLImageElement).src = this.player!.avatar;

        // Oponente
        document.getElementById('opp-name')!.innerText = this.opponent.name;
        document.getElementById('opp-lvl')!.innerText = `Lv.${this.opponent.level}`;
        (document.getElementById('opp-img') as HTMLImageElement).src = this.opponent.getSprite();
        const oppPct = (this.opponent.currentHp/this.opponent.maxHp)*100;
        const oppBar = document.getElementById('opp-hp')!;
        oppBar.style.width = oppPct + "%";
        oppBar.className = `hp-fill ${this.getHpColor(this.opponent.currentHp, this.opponent.maxHp)}`;
        document.getElementById('opp-hp-text')!.innerText = `${this.opponent.currentHp}/${this.opponent.maxHp}`;
        
        const oppTrainer = document.getElementById('opp-trainer-img') as HTMLImageElement;
        if(this.isPvP && this.enemyPlayer) { oppTrainer.src = this.enemyPlayer.avatar; oppTrainer.style.display = 'block'; } 
        else if (this.isGym) {
            const gData = GYM_DATA.find(g => g.id === this.gymId);
            if(gData) oppTrainer.src = `/assets/img/LideresGym/${gData.leaderImg}`;
            oppTrainer.style.display = 'block';
        }
        else if (this.isNPC) { oppTrainer.src = '/assets/img/Treinadores/Red.jpg'; oppTrainer.style.display = 'block'; } 
        else { oppTrainer.style.display = 'none'; }

        // Indicadores de PokeBolas
        if(!this.isNPC && !this.isGym && !this.isPvP) {
            document.getElementById('ply-team-indicator')!.innerHTML = ''; document.getElementById('opp-team-indicator')!.innerHTML = '';
        } else {
            this.renderTeamIcons('ply-team-indicator', this.plyTeamList); this.renderTeamIcons('opp-team-indicator', this.oppTeamList);
        }
    }

    static renderTeamIcons(elId: string, list: Pokemon[]) {
        document.getElementById(elId)!.innerHTML = list.map(p => `<div class="ball-icon ${p.isFainted() ? 'lost' : ''}"></div>`).join('');
    }

    static updateFromNetwork(payload: any) {
        if(!this.activeMon || !this.opponent) return;
        this.activeMon.currentHp = payload.plyHp;
        this.opponent.currentHp = payload.oppHp;
        this.logBattle(payload.msg); // Usa logBattle para atualizar ambos
        this.updateUI();
    }

    // --- RESULTADOS ---
    static win() {
        if(Network.isOnline && Game.turn !== Network.myPlayerId && Network.myPlayerId !== 0) return;
        
        let gain = 0;
        let xpGain = 0;
        let msg = "VITÓRIA! ";

        if(this.isPvP) xpGain = 15;
        else if(this.isGym) xpGain = 25;
        else if(this.isNPC) xpGain = 10;
        else xpGain = 5; 

        if (this.opponent!.level >= this.activeMon!.level + 2) { xpGain += 5; msg += "(+Bônus Desafio) "; }

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
            this.enemyPlayer.x = 0; this.enemyPlayer.y = 0;
            this.enemyPlayer.team.forEach(p => p.heal(999));
            this.enemyPlayer.skipTurn = true;
            Game.log(`[PvP] ${this.enemyPlayer.name} voltou ao início.`);
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
        
        alert(msg); Game.log(msg);
        setTimeout(() => this.end(false), 1000);
    }

    static lose() {
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

        alert(msg); Game.log(msg);
        setTimeout(() => { this.end(false); Game.moveVisuals(); }, 1500);
    }

    static end(isRemote: boolean) {
        this.active = false;
        document.getElementById('battle-modal')!.style.display = 'none';
        if(!isRemote) { Network.send('BATTLE_END', {}); Game.nextTurn(); }
    }

    // --- ITENS E CARTAS NA BATALHA ---
    static openBag() { 
        if (!this.isPlayerTurn || this.processingAction) return; // Bloqueio de turno

        const list = document.getElementById('battle-bag-list')!; list.innerHTML = '';
        Object.keys(this.player!.items).forEach(key => {
            if(this.player!.items[key] > 0) {
                const item = SHOP_ITEMS.find(i => i.id === key);
                if(item) {
                    const btn = document.createElement('button'); btn.className = 'btn';
                    btn.innerHTML = `${item.icon} ${item.name} x${this.player!.items[key]}`;
                    btn.onclick = () => this.useItem(key, item);
                    list.appendChild(btn);
                }
            }
        });
        document.getElementById('battle-bag')!.style.display = 'block';
    }

    static useItem(key: string, data: ItemData) {
        document.getElementById('battle-bag')!.style.display = 'none';
        
        if(data.type === 'capture' && (this.isPvP || this.isNPC || this.isGym)) { 
            alert("Não pode capturar pokémons de treinadores!"); return; 
        }

        this.player!.items[key]--;
        this.processingAction = true; // Bloqueia spam
        this.updateButtons();

        if(data.type === 'heal') {
            this.activeMon!.heal(data.val!);
            this.logBattle("Usou item de cura!");
            this.updateUI();
            Network.send('BATTLE_UPDATE', { plyHp: this.activeMon!.currentHp, oppHp: this.opponent!.currentHp, msg: "Usou Cura!" });
            setTimeout(() => this.enemyTurn(), 1500); // Passa a vez
        } else if(data.type === 'capture') {
            this.attemptCapture(data.rate!);
        }
    }

    static attemptCapture(rate: number) {
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
                    this.openSwapModal();
                }
            } else {
                this.logBattle("Escapou!");
                setTimeout(() => this.enemyTurn(), 1000);
            }
        }, 1000); 
    }

    static openSwapModal() { Game.openSwapModal(this.pendingCapture!); }

    static openCardSelection() {
        if (!this.isPlayerTurn || this.processingAction) return;

        const list = document.getElementById('battle-cards-list')!;
        list.innerHTML = '';
        const battleCards = this.player!.cards.filter(c => c.type === 'battle');
        
        if(battleCards.length === 0) {
            list.innerHTML = "<em>Sem cartas de batalha.</em>";
        } else {
            battleCards.forEach(c => {
                const d = document.createElement('div'); d.className='card-item';
                d.innerHTML = `
                    <div class="card-info">
                        <span class="card-name">${c.icon} ${c.name} <span class="card-type-badge type-battle">BATTLE</span></span>
                        <span class="card-desc">${c.desc}</span>
                    </div>
                    <button class="btn-use-card" onclick="window.Battle.useCard('${c.id}')">USAR</button>
                `;
                list.appendChild(d);
            });
        }
        document.getElementById('battle-cards-modal')!.style.display = 'flex';
    }

    static useCard(cardId: string) { 
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

// ... (Classes Shop e Cards mantidas iguais ao anterior) ...

class Shop {
    static open() { 
        const p = Game.getCurrentPlayer();
        document.getElementById('shop-gold')!.innerText = p.gold.toString();
        const list = document.getElementById('shop-items-list')!; list.innerHTML = '';
        SHOP_ITEMS.forEach(item => {
            const div = document.createElement('div'); div.className = 'shop-item';
            div.innerHTML = `<span>${item.icon} ${item.name}</span><button class="btn" style="width:auto" onclick="window.Shop.buy('${item.id}', ${item.price})">${item.price}</button>`;
            list.appendChild(div);
        });
        document.getElementById('shop-modal')!.style.display = 'flex';
    }
    static buy(id: string, price: number) {
        const p = Game.getCurrentPlayer();
        if(p.gold >= price) { p.gold -= price; p.items[id]++; this.open(); Game.updateHUD(); }
    }
    static close() {
        document.getElementById('shop-modal')!.style.display = 'none';
        if(Game.isCityEvent) { Game.isCityEvent = false; Game.nextTurn(); }
    }
}

class Cards {
    static draw(player: Player) {
        const card = CARDS_DB[Math.floor(Math.random()*CARDS_DB.length)];
        player.cards.push(card);
        Game.log(`Ganhou carta: ${card.icon} ${card.name}`);
        Game.updateHUD();
    }
    static showPlayerCards(playerId: number) {
        Game.openBoardCards(playerId);
    }
}

// ==========================================
// MOTOR DO JOGO (GAME)
// ==========================================
class Game {
    static players: Player[] = [];
    static turn: number = 0;
    static isCityEvent: boolean = false; 
    static hasRolled: boolean = false; 
    static globalGymLevel: number = 1; 

    static init(players: Player[], mapSize: number) {
        this.players = players;
        if(MapSystem.grid.length === 0) MapSystem.generate(mapSize);
        this.renderBoard(); this.updateHUD(); this.moveVisuals();
        this.checkTurnControl();
        this.renderDebugPanel(); 
    }
    
    // ... (Helpers de UI renderDebug, openLibrary, openXpRules, debugMove, moveVisuals, rollDice, animateDice mantidos) ...

    static renderDebugPanel() {
        const container = document.querySelector('.extra-space');
        if(container) {
            container.innerHTML = `
                <button class="btn btn-secondary" onclick="window.Game.openCardLibrary()">📖 Ver Todas as Cartas</button>
                <button class="btn btn-secondary" style="background: #27ae60;" onclick="window.Game.openXpRules()">📘 Regras de XP</button>
                <div style="margin-top:10px; font-size:0.7rem; color:#aaa;">DEBUG MOVE</div>
                <div style="display:flex; gap:5px; justify-content:center;">
                    <input type="number" id="debug-input" value="1" min="1" max="50" style="width:50px; text-align:center; border:none; padding:5px; border-radius:4px;">
                    <button class="btn" style="width:auto; margin:0; padding:5px 10px;" onclick="window.Game.debugMove()">GO</button>
                </div>
                <div style="margin-top:5px;"><small id="online-indicator" style="color:cyan;">OFFLINE</small></div>
            `;
        }
    }

    static openCardLibrary() {
        const list = document.getElementById('library-list')!;
        list.innerHTML = '';
        CARDS_DB.forEach(c => {
            const d = document.createElement('div'); d.className = 'card-item';
            const typeClass = c.type === 'move' ? 'type-move' : 'type-battle';
            const typeLabel = c.type === 'move' ? 'MOVE' : 'BATTLE';
            d.innerHTML = `<div class="card-info"><span class="card-name">${c.icon} ${c.name} <span class="card-type-badge ${typeClass}">${typeLabel}</span></span><span class="card-desc">${c.desc}</span></div>`;
            list.appendChild(d);
        });
        document.getElementById('library-modal')!.style.display = 'flex';
    }

    static openXpRules() { document.getElementById('xp-rules-modal')!.style.display = 'flex'; }

    static openBoardCards(pId: number) {
        if(Network.isOnline && pId !== Network.myPlayerId) return alert("Privado!");
        const p = this.players[pId];
        const list = document.getElementById('board-cards-list')!;
        list.innerHTML = '';
        if(p.cards.length === 0) list.innerHTML = "<em>Sem cartas.</em>";
        
        const isMyTurn = this.canAct() && this.turn === pId;
        const canUseMove = isMyTurn && !this.hasRolled;

        p.cards.forEach(c => {
            const d = document.createElement('div'); d.className = 'card-item';
            const typeClass = c.type === 'move' ? 'type-move' : 'type-battle';
            const typeLabel = c.type === 'move' ? 'MOVE' : 'BATTLE';
            let actionBtn = '';
            if (c.type === 'move') {
                if (canUseMove) actionBtn = `<button class="btn-use-card" onclick="window.Game.useBoardCard('${c.id}')">USAR</button>`;
                else actionBtn = `<button class="btn-use-card" disabled title="Só antes de rolar">USAR</button>`;
            } else {
                actionBtn = `<button class="btn-use-card" disabled style="background:#555" title="Só em batalha">BATTLE</button>`;
            }
            d.innerHTML = `<div class="card-info"><span class="card-name">${c.icon} ${c.name} <span class="card-type-badge ${typeClass}">${typeLabel}</span></span><span class="card-desc">${c.desc}</span></div>${actionBtn}`;
            list.appendChild(d);
        });
        document.getElementById('board-cards-modal')!.style.display = 'flex';
    }

    static useBoardCard(cardId: string) {
        const p = this.getCurrentPlayer();
        const cardIndex = p.cards.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return;
        const card = p.cards[cardIndex];

        if (card.id === 'bike') {
            p.cards.splice(cardIndex, 1);
            document.getElementById('board-cards-modal')!.style.display = 'none';
            this.log(`${p.name} usou Bicicleta!`);
            Network.send('ROLL_DICE', { result: 5 }); 
            this.hasRolled = true; 
            this.animateDice(5);
        } else if (card.id === 'teleport') {
            p.cards.splice(cardIndex, 1);
            document.getElementById('board-cards-modal')!.style.display = 'none';
            this.log(`${p.name} usou Teleporte!`);
            p.x = 0; p.y = 0;
            this.moveVisuals();
            this.handleTile(p); 
        } else { alert("Efeito não implementado na demo."); }
    }

    static debugMove() {
        if(!this.canAct()) return;
        const input = document.getElementById('debug-input') as HTMLInputElement;
        const result = parseInt(input.value) || 1;
        this.log(`[DEBUG] Forçando ${result} passos.`);
        Network.send('ROLL_DICE', { result }); 
        this.animateDice(result);
    }

    static moveVisuals() {
        this.players.forEach((p, idx) => {
            const currentTile = document.getElementById(`tile-${p.x}-${p.y}`);
            if(!currentTile) return;
            let token = document.getElementById(`p-token-${idx}`);
            if (token && token.parentElement === currentTile) {
                if(idx === this.turn) token.classList.add('active-token');
                else token.classList.remove('active-token');
                return;
            }
            if (token) token.remove(); 
            const t = document.createElement('div');
            t.id = `p-token-${idx}`; 
            t.className = `player-token ${idx===this.turn?'active-token':''}`;
            t.style.backgroundImage = `url('${p.avatar}')`;
            t.style.borderColor = PLAYER_COLORS[idx % PLAYER_COLORS.length];
            if(MapSystem.size >= 30) { t.style.width = '90%'; t.style.height = '90%'; }
            currentTile.appendChild(t);
            if(idx===this.turn) currentTile.scrollIntoView({block:'center',inline:'center',behavior:'smooth'});
        });
    }

    static async rollDice() {
        if(!this.canAct() || this.hasRolled) return;
        this.hasRolled = true; 
        const result = Math.floor(Math.random()*20)+1;
        Network.send('ROLL_DICE', { result });
        this.animateDice(result);
    }

    static async animateDice(result: number) {
        const die = document.getElementById('d20-display')!;
        for(let i=0;i<5;i++) { die.innerText = `🎲 ${Math.floor(Math.random()*20)+1}`; await new Promise(r=>setTimeout(r,50)); }
        die.innerText = `🎲 ${result}`;
        
        if(this.canAct()) {
            this.log(`${this.getCurrentPlayer().name} tirou ${result}`);
            const p = this.getCurrentPlayer();
            if(p.team.length > 0) {
                const luckyMon = p.team[Math.floor(Math.random() * p.team.length)];
                luckyMon.gainXp(1, p);
            }
            Network.send('LOG_MSG', { msg: `${this.getCurrentPlayer().name} tirou ${result}` });
            this.movePlayerLogic(result);
        }
    }

    // --- LÓGICA DE MOVIMENTO E LOOP ---
    static async movePlayerLogic(steps: number) {
        const p = this.getCurrentPlayer();
        const totalTiles = MapSystem.size * MapSystem.size;

        for(let i=0; i<steps; i++) {
            // 1. Pega o índice atual baseado na posição ATUAL
            let currentIdx = MapSystem.getIndex(p.x, p.y);
            
            // 2. Calcula o próximo índice
            currentIdx++;

            // 3. Verifica o Loop do Mapa (Volta ao início)
            if (currentIdx >= totalTiles) {
                currentIdx = 0; 
                p.gold += 200;
                Cards.draw(p);
                this.log("🚩 Completou uma volta! Ganhou 200G e 1 Carta!");
            }

            // 4. Converte o novo índice para coordenadas X, Y
            const nextCoord = MapSystem.getCoord(currentIdx);
            
            // 5. ATUALIZAÇÃO CRÍTICA: Salva a nova posição no jogador IMEDIATAMENTE
            // Sem isso, o próximo loop calcularia baseado na posição velha
            p.x = nextCoord.x;
            p.y = nextCoord.y;
            
            // 6. Envia para rede e atualiza visual
            Network.send('MOVE_STEP', { playerId: this.turn, x: p.x, y: p.y });
            this.performVisualStep(this.turn, p.x, p.y);
            
            // Pequena pausa para animação
            await new Promise(r => setTimeout(r, 150));
        }
        
        // Finaliza o movimento no tile de destino
        this.handleTile(p);
    }

    static performVisualStep(pId: number, x: number, y: number) {
        const p = this.players[pId];
        
        // Garante que a lógica esteja sincronizada (importante para o Online)
        p.x = x; 
        p.y = y;
        
        const tile = document.getElementById(`tile-${x}-${y}`);
        if(tile) {
            tile.classList.add('step-highlight');
            this.moveVisuals(); // Move o boneco (CSS) para o novo x,y
            setTimeout(() => tile.classList.remove('step-highlight'), 300);
        }
    }

    static handleTile(p: Player) {
        const type = MapSystem.grid[p.y][p.x];
        
        const enemy = this.players.find(o => o !== p && o.x === p.x && o.y === p.y);
        if(enemy) { 
            const defMon = enemy.team.find(m => !m.isFainted());
            if(defMon) { 
                this.log(`⚔️ Conflito! ${p.name} vs ${enemy.name}`);
                Battle.setup(p, defMon, true, enemy.name, 0, enemy); 
            } else { 
                this.log(`${enemy.name} sem pokemons!`); 
                this.nextTurn(); 
            }
            return; 
        }

        if(NPC_DATA[type]) {
            const npc = NPC_DATA[type];
            const monId = npc.team[Math.floor(Math.random() * npc.team.length)];
            Battle.setup(p, new Pokemon(monId), false, npc.name, npc.gold);
            return;
        }

        if(type === TILE.CITY) { 
            this.isCityEvent = true; document.getElementById('city-modal')!.style.display='flex'; 
        }
        else if(type === TILE.EVENT) { 
            if(Math.random() < 0.5) { Cards.draw(p); } 
            else {
                const gift = Math.random() > 0.5 ? 'pokeball' : 'potion';
                p.items[gift]++; this.log(`Achou ${gift}!`); this.updateHUD();
            }
            this.nextTurn(); 
        }
        else if(type === TILE.GYM) { 
            const gymId = MapSystem.gymLocations[`${p.x},${p.y}`] || 1;
            if (!p.badges[gymId-1]) {
                const boss = new Pokemon(150, true); 
                Battle.setup(p, boss, false, "Líder de Ginásio", 1000, null, true, gymId); 
            } else {
                this.log("Você já venceu este ginásio!");
                this.nextTurn();
            }
        }
        else if([TILE.GRASS, TILE.WATER, TILE.GROUND].includes(type) && Math.random()<0.35) {
            let possibleMons = [1, 4, 7, 25];
            if(type === TILE.GROUND) possibleMons = [74, 95];
            const id = possibleMons[Math.floor(Math.random()*possibleMons.length)];
            Battle.setup(p, new Pokemon(id, Math.random()<0.1), false, "Selvagem");
        } else {
            this.nextTurn();
        }
    }

    static handleCityChoice(c: string) {
        if(c==='heal') { this.getCurrentPlayer().team.forEach(p=>p.heal(999)); this.isCityEvent=false; this.nextTurn(); }
        else Shop.open();
        document.getElementById('city-modal')!.style.display='none';
    }

    static nextTurn() {
        this.saveGame();
        this.turn = (this.turn+1)%this.players.length;
        this.hasRolled = false; 
        
        const nextP = this.players[this.turn];
        if(nextP.skipTurn) {
            nextP.skipTurn = false;
            this.log(`${nextP.name} perdeu a vez!`);
            alert(`${nextP.name} perdeu a vez!`);
            this.nextTurn(); return;
        }

        Network.send('TURN_CHANGE', { turn: this.turn });
        this.updateHUD(); 
        this.moveVisuals();
        this.checkTurnControl();
    }
    
    // ... (Métodos checkTurnControl, canAct, save/load, export/import, openInventoryModal, useItemBoard mantidos) ...
    // Vou incluir tudo para garantir o arquivo completo

    static checkTurnControl() {
        const btn = document.getElementById('roll-btn') as HTMLButtonElement;
        const me = Network.myPlayerId;
        const ind = document.getElementById('online-indicator');
        
        if(Network.isOnline) {
            if(ind) ind.innerText = "ONLINE";
            if (this.turn === me || (me === 0 && this.turn >= 2)) {
                btn.disabled = false; btn.innerText = "ROLAR";
            } else {
                btn.disabled = true; btn.innerText = `Vez de ${this.players[this.turn].name}`;
            }
        } else {
            if(ind) ind.innerText = "OFFLINE";
            btn.disabled = false;
        }
    }

    static canAct() {
        if(!Network.isOnline) return true;
        return this.turn === Network.myPlayerId || (Network.myPlayerId === 0 && this.turn > 1);
    }

    static getSaveData() { return { players: this.players, turn: this.turn, mapSize: MapSystem.size, grid: MapSystem.grid, gymLoc: MapSystem.gymLocations }; }
    static saveGame() { localStorage.setItem('pk_save', JSON.stringify(this.getSaveData())); Network.broadcastState(); }
    static loadGame() { const json=localStorage.getItem('pk_save'); if(json) this.loadGameFromData(JSON.parse(json)); }
    static loadGameFromData(d: any) { 
        MapSystem.size=d.mapSize; MapSystem.grid=d.grid; MapSystem.gymLocations=d.gymLoc || {};
        this.players = d.players.map((pd:any) => {
            const file = pd.avatar.split('/').pop();
            const pl = new Player(pd.id, pd.name, file);
            Object.assign(pl, pd); 
            pl.avatar = `/assets/img/Treinadores/${file}`;
            pl.team = pd.team.map((td:any) => { const po=new Pokemon(td.id, td.isShiny); Object.assign(po, td); return po; });
            return pl;
        });
        if(Network.isOnline && Network.localName) {
            const match = this.players.findIndex(p => p.name === Network.localName);
            if(match !== -1) Network.myPlayerId = match;
        }
        this.turn = d.turn;
        document.getElementById('setup-screen')!.style.display='none';
        document.getElementById('game-container')!.style.display='flex';
        Game.init(this.players, d.mapSize);
    }
    
    static exportSave() {
        const d = localStorage.getItem('pk_save'); if(!d)return alert("Vazio");
        const b = new Blob([d], {type:'text/plain'});
        const a = document.createElement('a'); a.href=URL.createObjectURL(b); a.download='save.txt'; a.click();
    }
    static importSave(i: HTMLInputElement) {
        const f = i.files?.[0]; if(!f)return;
        const r = new FileReader(); r.onload=e=>{ localStorage.setItem('pk_save', e.target?.result as string); this.loadGame(); }; r.readAsText(f);
    }

    static openInventoryModal(pId: number) {
        const p = this.players[pId];
        const list = document.getElementById('board-inventory-list')!;
        list.innerHTML = '';
        const canUse = (this.canAct() && this.turn === pId);

        Object.keys(p.items).forEach(key => {
            if(p.items[key] > 0) {
                const item = SHOP_ITEMS.find(i => i.id === key);
                if(item) {
                    const d = document.createElement('div'); d.className='shop-item';
                    let btnHTML = '';
                    if(canUse && item.type === 'heal') {
                        btnHTML = `<button class="btn btn-mini" style="width:auto;" onclick="window.Game.useItemBoard('${key}', ${pId})">Usar</button>`;
                    }
                    d.innerHTML = `<span>${item.icon} ${item.name} x${p.items[key]}</span> ${btnHTML}`;
                    list.appendChild(d);
                }
            }
        });
        document.getElementById('board-inventory-modal')!.style.display='flex';
    }

    static useItemBoard(key: string, pId: number) {
        const p = this.players[pId];
        const item = SHOP_ITEMS.find(i => i.id === key);
        if(p.items[key] > 0 && item?.type === 'heal') {
            p.items[key]--;
            const mon = p.team.find(m => !m.isFainted());
            if(mon) {
                mon.heal(item.val || 20);
                alert(`Usou ${item.name} em ${mon.name}!`);
                this.updateHUD();
                this.openInventoryModal(pId);
                Network.send('LOG_MSG', { msg: `${p.name} usou ${item.name}.` });
                this.saveGame();
            } else {
                alert("Todos desmaiados!");
            }
        }
    }

    static openSwapModal(newMon: Pokemon) {
        const modal = document.getElementById('swap-modal')!;
        const list = document.getElementById('swap-list')!;
        list.innerHTML = '';
        
        const p = this.getCurrentPlayer();
        
        p.team.forEach((currP, idx) => {
            const div = document.createElement('div'); div.className = 'swap-item';
            div.innerHTML = `<img src="${currP.getSprite()}"> <b>${currP.name}</b> Lv.${currP.level}`;
            div.onclick = () => this.executeSwap(idx, newMon);
            list.appendChild(div);
        });
        
        const divNew = document.createElement('div'); divNew.className = 'swap-item new-mon';
        divNew.innerHTML = `<img src="${newMon.getSprite()}"> <b>${newMon.name} (NOVO)</b> Lv.${newMon.level} <br><small>Clique para descartar este</small>`;
        divNew.onclick = () => this.executeSwap(-1, newMon);
        list.appendChild(divNew);

        modal.style.display = 'block';
    }

    static executeSwap(indexToRelease: number, newMon: Pokemon) {
        const p = this.getCurrentPlayer();
        if (indexToRelease === -1) {
            this.log(`Libertou ${newMon.name}.`);
        } else {
            const released = p.team[indexToRelease];
            this.log(`Libertou ${released.name} e ficou com ${newMon.name}!`);
            p.team[indexToRelease] = newMon;
        }
        document.getElementById('swap-modal')!.style.display = 'none';
        Game.updateHUD(); // CORRIGIDO AQUI
        setTimeout(() => Battle.end(false), 500);
    }

    static updateHUD() {
        const left = document.getElementById('hud-col-left')!; left.innerHTML = '';
        const right = document.getElementById('hud-col-right')!; right.innerHTML = '';
        this.players.forEach((p,i) => {
            const d = document.createElement('div');
            d.className = `player-slot ${i===this.turn?'active':''}`;
            
            let badgeHTML = '<div class="badges-container">';
            for(let b=0; b<8; b++) {
                const isActive = p.badges[b];
                const gData = GYM_DATA.find(g => g.id === b+1);
                const imgUrl = gData ? `/assets/img/Insignias/${gData.badgeImg}` : '';
                const style = isActive 
                    ? `background-image: url('${imgUrl}'); background-size: 100% 100%; background-repeat: no-repeat; background-color: transparent;` 
                    : `background-color: #ccc;`;
                badgeHTML += `<div class="badge-slot ${isActive?'active':''}" style="${style}" title="Insígnia ${b+1}"></div>`;
            }
            badgeHTML += '</div>';

            const th = p.team.map(m => `
                <div class="poke-card ${m.isFainted() ? 'fainted' : ''}">
                    <img src="${m.getSprite()}" class="poke-card-img">
                    <div class="poke-card-info">
                        <div class="poke-header"><span>${m.name}</span> <span class="poke-lvl">Lv.${m.level}</span></div>
                        <div class="bar-container" title="HP">
                            <div class="bar-fill ${Battle.getHpColor(m.currentHp, m.maxHp)}" style="width:${(m.currentHp/m.maxHp)*100}%"></div>
                            <div class="bar-text">${m.currentHp}/${m.maxHp}</div>
                        </div>
                        <div class="bar-container" title="XP"><div class="bar-fill xp-bar" style="width:${(m.currentXp/m.maxXp)*100}%"></div></div>
                        <div class="poke-stats">
                            <div class="stat-item">⚔️${m.atk}</div>
                            <div class="stat-item">🛡️${m.def}</div>
                            <div class="stat-item">💨${m.speed}</div>
                        </div>
                    </div>
                </div>`).join('');
            
            d.innerHTML = `
                <div class="hud-header"><div class="hud-name-group"><img src="${p.avatar}" class="hud-avatar-img"><span>${p.name}</span></div><div>💰${p.gold}</div></div>
                ${badgeHTML}
                <div class="hud-team">${th}</div>
                <div class="hud-actions"><button class="btn btn-secondary btn-mini" onclick="window.openInventory(${i})">🎒</button><button class="btn btn-secondary btn-mini" onclick="window.openCards(${i})">🃏</button></div>`;
            
            if(i < Math.ceil(this.players.length/2)) left.appendChild(d); else right.appendChild(d);
        });
        document.getElementById('turn-indicator')!.innerText = this.getCurrentPlayer().name;
    }

    static renderBoard() { 
        const area = document.getElementById('board-area')!; area.innerHTML = '';
        area.style.gridTemplateColumns = `repeat(${MapSystem.size}, 1fr)`;
        area.style.gridTemplateRows = `repeat(${MapSystem.size}, 1fr)`;
        for(let y=0; y<MapSystem.size; y++) {
            for(let x=0; x<MapSystem.size; x++) {
                const d = document.createElement('div');
                let c = 'path'; const t = MapSystem.grid[y][x];
                if(t===TILE.GRASS)c='grass'; else if(t===TILE.WATER)c='water'; else if(t===TILE.GROUND)c='ground';
                else if(t===TILE.CITY)c='city'; else if(t===TILE.GYM)c='gym'; else if(t===TILE.EVENT)c='event';
                else if(t===TILE.ROCKET)c='rocket'; else if(t===TILE.BIKER)c='biker'; else if(t===TILE.YOUNG)c='young'; else if(t===TILE.OLD)c='old';
                d.className = `tile ${c}`; d.id = `tile-${x}-${y}`;
                if(MapSystem.size>=30)d.style.fontSize='8px';
                if(t===TILE.GYM) {
                    const gid = MapSystem.gymLocations[`${x},${y}`];
                    if(gid) {
                        const gData = GYM_DATA.find(g => g.id === gid);
                        if(gData) {
                            d.style.backgroundImage = `url('/assets/img/Ginasios/${gData.gymImg}')`;
                            d.style.backgroundSize = '100% 100%'; 
                            d.style.backgroundRepeat = 'no-repeat';
                            d.title = `Ginásio ${gData.type} - Líder ${gData.leaderName}`;
                        }
                        d.innerText = ""; 
                    }
                }
                area.appendChild(d);
            }
        }
    }
    static getCurrentPlayer() { return this.players[this.turn]; }
    static log(m: string) { document.getElementById('log-container')!.insertAdjacentHTML('afterbegin', `<div class="log-entry">${m}</div>`); }
}

class Setup {
    static showOfflineSetup() { document.getElementById('menu-phase-1')!.style.display='none'; document.getElementById('menu-phase-setup')!.style.display='block'; }
    static showOnlineMenu() { document.getElementById('menu-phase-1')!.style.display='none'; document.getElementById('menu-phase-online')!.style.display='block'; }
    static showSetupScreen() { document.getElementById('menu-phase-online')!.style.display='none'; document.getElementById('menu-phase-setup')!.style.display='block'; }
    static updateSlots() {
        const n = parseInt((document.getElementById('num-players') as HTMLSelectElement).value);
        const c = document.getElementById('player-slots-container')!; c.innerHTML = '';
        const defs = ["Ash", "Gary", "Misty", "Brock", "May", "Dawn", "Serena", "Goh"];
        for(let i=0; i<n; i++) {
            const defImg = TRAINER_IMAGES[i%TRAINER_IMAGES.length].file;
            const opts = TRAINER_IMAGES.map(img => `<option value="${img.file}" ${img.file===defImg?'selected':''}>${img.label}</option>`).join('');
            c.innerHTML += `<div class="setup-row"><strong>P${i+1}</strong><input type="text" id="p${i}-name" value="${defs[i]||'Player'}" style="width:100px;"><div class="avatar-selection"><img id="p${i}-preview" src="/assets/img/Treinadores/${defImg}" class="avatar-preview"><select id="p${i}-av" onchange="window.Setup.updatePreview(${i})">${opts}</select></div></div>`;
        }
    }
    static updatePreview(i: number) { (document.getElementById(`p${i}-preview`) as HTMLImageElement).src = `/assets/img/Treinadores/${(document.getElementById(`p${i}-av`) as HTMLSelectElement).value}`; }
    static start() {
        const n = parseInt((document.getElementById('num-players') as HTMLSelectElement).value);
        const mapSize = parseInt((document.getElementById('map-size') as HTMLSelectElement).value); 
        const ps = [];
        for(let i=0; i<n; i++) ps.push(new Player(i, (document.getElementById(`p${i}-name`) as HTMLInputElement).value, (document.getElementById(`p${i}-av`) as HTMLSelectElement).value));
        document.getElementById('setup-screen')!.style.display='none';
        document.getElementById('game-container')!.style.display='flex';
        Game.init(ps, mapSize);
        if(Network.isHost) Network.broadcastState();
    }
}

// BINDING GLOBAL ATUALIZADO
window.openInventory = (id) => Game.openInventoryModal(id);
window.openCards = (id) => { if(Network.isOnline && id !== Network.myPlayerId) return alert("Privado!"); Cards.showPlayerCards(id); };
window.openCardLibrary = () => Game.openCardLibrary();
window.openXpRules = () => Game.openXpRules();
window.Setup = Setup; window.Game = Game; window.Shop = Shop; window.Battle = Battle; window.Network = Network;
Setup.updateSlots();