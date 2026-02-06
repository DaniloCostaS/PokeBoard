import './style.css'
import { 
    TILE, NPC_DATA, CARDS_DB, POKEDEX, SHOP_ITEMS 
} from './constants';

import type { 
    ItemData, CardData, Coord 
} from './constants';

// Declare a lib externa (PeerJS)
declare const Peer: any;

// --- CONSTANTES ---
const PLAYER_COLORS = [
    '#e74c3c', '#3498db', '#f1c40f', '#9b59b6', 
    '#1abc9c', '#e67e22', '#34495e', '#ff7979'
];

const TRAINER_IMAGES = [
    { label: "Red", file: "Red.jpg" },
    { label: "Blue", file: "Blue.jpg" },
    { label: "Lucas", file: "Lucas.jpg"},
    { label: "Dawn", file: "Dawn.jpg" },
    { label: "Barry", file: "Barry.jpg" },
    { label: "Brendan", file: "Brendan.jpg"},
    { label: "May", file: "May.jpg" },
    { label: "Ethan", file: "Ethan.jpg" },
    { label: "OAK", file: "OAK.jpg" }
];

const POKEMON_TYPES: {[key: string]: string} = {
    'Charmander': 'fire', 'Charmeleon': 'fire', 'Charizard': 'fire', 'Vulpix': 'fire', 'Growlithe': 'fire',
    'Squirtle': 'water', 'Wartortle': 'water', 'Blastoise': 'water', 'Psyduck': 'water', 'Poliwag': 'water',
    'Bulbasaur': 'grass', 'Ivysaur': 'grass', 'Venusaur': 'grass', 'Oddish': 'grass', 'Bellsprout': 'grass',
    'Pikachu': 'electric', 'Raichu': 'electric', 'Magnemite': 'electric', 'Voltorb': 'electric',
    'Geodude': 'ground', 'Graveler': 'ground', 'Golem': 'ground', 'Onix': 'ground',
    'Pidgey': 'normal', 'Rattata': 'normal', 'Meowth': 'normal', 'Eevee': 'normal'
};

const TYPE_CHART: {[key: string]: {[key: string]: number}} = {
    'fire': { 'grass': 2, 'water': 0.5, 'rock': 0.5, 'bug': 2, 'ice': 2 },
    'water': { 'fire': 2, 'grass': 0.5, 'ground': 2, 'rock': 2 },
    'grass': { 'water': 2, 'fire': 0.5, 'ground': 2, 'flying': 0.5, 'rock': 2 },
    'electric': { 'water': 2, 'grass': 0.5, 'ground': 0, 'flying': 2 },
    'ground': { 'fire': 2, 'electric': 2, 'grass': 0.5, 'flying': 0, 'rock': 2 },
    'normal': { 'ghost': 0 }
};

declare global {
    interface Window {
        Setup: typeof Setup;
        Game: typeof Game;
        Shop: typeof Shop;
        Battle: typeof Battle;
        Network: typeof Network;
        openInventory: (playerId: number) => void;
        openCards: (playerId: number) => void;
    }
}

// ==========================================
// REDE
// ==========================================
class Network {
    static peer: any = null;
    static conn: any = null;
    static isHost: boolean = false;
    static isOnline: boolean = false;
    static myPlayerId: number = 0; 

    static createRoom() {
        const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.initPeer(roomCode, true);
    }

    static joinRoom() {
        const code = (document.getElementById('room-code-input') as HTMLInputElement).value.toUpperCase();
        if(!code) return alert("Digite o código!");
        this.initPeer(code, false);
    }

    static initPeer(id: string, host: boolean) {
        this.isHost = host;
        this.isOnline = true;
        this.myPlayerId = host ? 0 : 1; 
        const fullId = "pkbd-v17-" + id;
        try { this.peer = new Peer(host ? fullId : null); } catch(e) { alert("Erro PeerJS"); return; }

        this.peer.on('open', (_myId: string) => {
            const displayCode = host ? id : "Conectando...";
            document.getElementById('lobby-status')!.innerHTML = 
                `Status: ${host ? "HOST" : "CLIENT"}<br>Sala: <b>${displayCode}</b>`;
            
            if(host) {
                this.peer.on('connection', (c: any) => {
                    this.conn = c; this.setupConnection();
                    document.getElementById('lobby-status')!.innerHTML += "<br>⚡ Conectado!";
                    Setup.showSetupScreen();
                });
            } else {
                this.conn = this.peer.connect(fullId); this.setupConnection();
            }
        });
        
        this.peer.on('error', (err: any) => { alert("Erro Rede: " + err.type); this.isOnline = false; });
    }

    static setupConnection() {
        this.conn.on('open', () => {
            if(!this.isHost) document.getElementById('lobby-status')!.innerHTML = "Conectado! Aguarde...";
        });
        this.conn.on('data', (data: any) => this.handleData(data));
    }

    static send(type: string, payload: any) {
        if(this.isOnline && this.conn) this.conn.send({ type, payload });
    }

    static broadcastState() {
        if(this.isOnline && this.conn) {
            this.conn.send({ type: 'GAME_STATE', payload: Game.getSaveData() });
        }
    }

    static handleData(data: any) {
        switch(data.type) {
            case 'GAME_STATE': Game.loadGameFromData(data.payload); break;
            case 'FULL_STATE': Game.loadGameFromData(data.payload); break;
            case 'ROLL_DICE': Game.animateDice(data.payload.result); break;
            case 'MOVE_STEP': Game.performVisualStep(data.payload.playerId, data.payload.x, data.payload.y); break;
            case 'TURN_CHANGE': 
                Game.turn = data.payload.turn;
                Game.updateHUD();
                Game.checkTurnControl();
                break;
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

    constructor(templateId: number, isShiny: boolean = false) {
        const template = POKEDEX.find(p => p.id === templateId) || POKEDEX[0];
        this.id = template.id; this.name = template.name; this.isShiny = isShiny;
        this.type = POKEMON_TYPES[this.name] || 'normal';
        this.level = 5; this.currentXp = 0; this.maxXp = 100;
        
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
    checkEvolution(): boolean {
        if (this.evoData.next && this.wins >= (this.evoData.trigger || 999)) {
            const next = POKEDEX.find(p => p.name === this.evoData.next);
            if (next) {
                this.id = next.id; this.name = next.name; this.type = POKEMON_TYPES[this.name] || this.type;
                this.maxHp+=30; this.currentHp=this.maxHp; this.atk+=10; this.def+=10; this.speed+=5;
                this.evoData = { next: next.nextForm, trigger: next.evoTrigger };
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
    skipTurn: boolean = false; // NOVO: Flag para pular turno

    constructor(id: number, name: string, avatarFile: string) {
        this.id = id; this.name = name;
        this.avatar = `/assets/img/Treinadores/${avatarFile}`;
        if(name !== "_LOAD_") {
            const starters = [1, 4, 7]; 
            this.team.push(new Pokemon(starters[Math.floor(Math.random()*starters.length)]));
        }
    }
    isDefeated() { return this.team.every(p => p.isFainted()); }
}

class MapSystem {
    static grid: number[][] = []; static size: number = 20; 
    static generate(size: number) {
        this.size = size; this.grid = Array(size).fill(0).map(() => Array(size).fill(TILE.GRASS));
        for(let i=0; i<Math.floor(size/2); i++) this.blob(TILE.WATER, 3);
        for(let i=0; i<Math.floor(size/2); i++) this.blob(TILE.GROUND, 2); 
        const tiles = size*size; let gyms=0;
        for(let i=0; i<tiles; i++) {
            const c = this.getCoord(i);
            if(i>0 && i%Math.floor(tiles/9)===0 && gyms<8) { this.grid[c.y][c.x]=TILE.GYM; gyms++; }
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
}

// ==========================================
// BATALHA & UI
// ==========================================
class Battle {
    static active: boolean = false;
    static player: Player | null = null;
    static activeMon: Pokemon | null = null; 
    static opponent: Pokemon | null = null;
    static enemyPlayer: Player | null = null; // NOVO: Para saber quem é o dono no PvP
    static isPvP: boolean = false;
    static isNPC: boolean = false; 
    static activeCard: string | null = null;
    static reward: number = 0;

    static setup(player: Player, enemyMon: Pokemon, isPvP: boolean = false, _label: string = "", reward: number = 0, enemyPlayer: Player | null = null) {
        this.player = player; this.opponent = enemyMon; this.isPvP = isPvP; this.isNPC = (reward > 0 && !isPvP);
        this.reward = reward; this.activeCard = null; this.enemyPlayer = enemyPlayer;
        this.openSelectionModal("Escolha seu Pokémon!");
    }

    static openSelectionModal(title: string) {
        const modal = document.getElementById('pkmn-select-modal')!;
        const list = document.getElementById('pkmn-select-list')!;
        document.getElementById('select-title')!.innerText = title;
        list.innerHTML = '';
        this.player!.team.forEach((mon) => {
            const div = document.createElement('div');
            div.className = `mon-select-item ${mon.isFainted() ? 'disabled' : ''}`;
            div.innerHTML = `<img src="${mon.getSprite()}" width="40"><b>${mon.name}</b> <small>(${mon.currentHp}/${mon.maxHp})</small>`;
            if(!mon.isFainted()) div.onclick = () => { modal.style.display = 'none'; this.startRound(mon); };
            list.appendChild(div);
        });
        modal.style.display = 'flex';
    }

    static startRound(selectedMon: Pokemon) {
        this.active = true; this.activeMon = selectedMon;
        this.renderBattleScreen();
        // Serializa enemyPlayer ID se existir
        const enemyId = this.enemyPlayer ? this.enemyPlayer.id : -1;
        Network.send('BATTLE_START', {
            pId: this.player!.id, monIdx: this.player!.team.indexOf(this.activeMon),
            oppData: this.opponent, isPvP: this.isPvP, reward: this.reward, enemyId
        });
    }

    static startFromNetwork(payload: any) {
        this.active = true; this.player = Game.players[payload.pId];
        this.activeMon = this.player.team[payload.monIdx];
        const opp = payload.oppData;
        this.opponent = new Pokemon(opp.id, opp.isShiny);
        Object.assign(this.opponent, opp);
        this.isPvP = payload.isPvP;
        if(payload.enemyId >= 0) this.enemyPlayer = Game.players[payload.enemyId];
        this.renderBattleScreen();
    }

    static renderBattleScreen() { document.getElementById('battle-modal')!.style.display = 'flex'; this.updateUI(); }

    static updateUI() {
        if(!this.activeMon || !this.opponent) return;
        document.getElementById('ply-name')!.innerText = this.activeMon.name;
        (document.getElementById('ply-img') as HTMLImageElement).src = this.activeMon.getSprite();
        document.getElementById('ply-hp')!.style.width = (this.activeMon.currentHp/this.activeMon.maxHp)*100 + "%";
        
        document.getElementById('opp-name')!.innerText = this.opponent.name;
        (document.getElementById('opp-img') as HTMLImageElement).src = this.opponent.getSprite();
        document.getElementById('opp-hp')!.style.width = (this.opponent.currentHp/this.opponent.maxHp)*100 + "%";
    }

    static updateFromNetwork(payload: any) {
        if(!this.activeMon || !this.opponent) return;
        this.activeMon.currentHp = payload.plyHp;
        this.opponent.currentHp = payload.oppHp;
        Game.log(payload.msg);
        this.updateUI();
    }

    static calculateDamage(attacker: Pokemon, defender: Pokemon): { dmg: number, multiplier: number } {
        let raw = attacker.atk * (0.8 + Math.random()*0.4);
        let mul = 1;
        if (TYPE_CHART[attacker.type] && TYPE_CHART[attacker.type][defender.type] !== undefined) {
            mul = TYPE_CHART[attacker.type][defender.type];
        }
        let dmg = Math.max(1, Math.floor((raw * mul) - (defender.def * 0.5)));
        return { dmg, multiplier: mul };
    }

    static attack() {
        if(!this.activeMon || !this.opponent) return;
        try {
            const { dmg, multiplier } = this.calculateDamage(this.activeMon, this.opponent);
            let finalDmg = dmg;
            if(this.activeCard === 'crit') { finalDmg *= 2; this.log("💥 CRÍTICO!"); this.activeCard = null; } 
            
            let effectMsg = multiplier > 1 ? " (Super!)" : (multiplier < 1 ? " (Fraco...)" : "");
            const msg = `${this.activeMon.name} atacou! -${finalDmg}${effectMsg}`;
            this.log(msg);

            this.opponent.currentHp = Math.max(0, this.opponent.currentHp - finalDmg);
            this.updateUI();

            Network.send('BATTLE_UPDATE', { plyHp: this.activeMon.currentHp, oppHp: this.opponent.currentHp, msg });

            if(this.opponent.currentHp <= 0) setTimeout(() => this.win(), 1000);
            else setTimeout(() => this.enemyTurn(), 1000);
        } catch (e) { console.error(e); setTimeout(() => this.enemyTurn(), 1000); }
    }

    static enemyTurn() {
        if(!this.activeMon || !this.opponent) return;
        const { dmg, multiplier } = this.calculateDamage(this.opponent, this.activeMon);
        let effectMsg = multiplier > 1 ? " (Super!)" : (multiplier < 1 ? " (Fraco...)" : "");
        const msg = `${this.opponent.name} bateu! -${dmg}${effectMsg}`;
        this.log(msg);

        this.activeMon.currentHp = Math.max(0, this.activeMon.currentHp - dmg);
        this.updateUI();

        Network.send('BATTLE_UPDATE', { plyHp: this.activeMon.currentHp, oppHp: this.opponent.currentHp, msg });

        if(this.activeMon.currentHp <= 0) setTimeout(() => this.handleFaint(), 1000);
    }

    static handleFaint() {
        if(this.player!.isDefeated()) this.lose(); 
        else {
            document.getElementById('battle-modal')!.style.display = 'none';
            this.openSelectionModal("Escolha o próximo!");
        }
    }

    static win() {
        if(Network.isOnline && Game.turn !== Network.myPlayerId && Network.myPlayerId !== 0) return;
        
        let gain = 0;
        
        // --- LÓGICA PVP REVISADA ---
        if(this.isPvP && this.enemyPlayer) {
            if(this.enemyPlayer.gold > 0) {
                // Ganha 30% do inimigo
                gain = Math.floor(this.enemyPlayer.gold * 0.3);
                this.enemyPlayer.gold -= gain;
                Game.log(`Roubou ${gain}G de ${this.enemyPlayer.name}!`);
            } else {
                // Inimigo falido: ganha 100G do jogo e inimigo perde turno
                gain = 100;
                this.enemyPlayer.skipTurn = true;
                Game.log(`${this.enemyPlayer.name} está falido e pulará o turno!`);
                alert(`${this.enemyPlayer.name} pulará a próxima rodada!`);
            }
        } else if (this.isNPC) {
            gain = this.reward;
        } else {
            gain = 150; // Selvagem
        }

        this.player!.gold += gain;
        this.activeMon!.currentXp += 50;
        if(this.activeMon!.currentXp >= this.activeMon!.maxXp) {
            this.activeMon!.level++; this.activeMon!.currentXp = 0;
            this.activeMon!.maxHp += 5; this.activeMon!.atk += 2;
        }
        
        Game.log(`Vitória! +${gain} Gold`);
        setTimeout(() => this.end(false), 1500);
    }

    static lose() {
        this.player!.gold = Math.max(0, this.player!.gold - 100);
        this.player!.team.forEach(p => p.heal(999));
        this.player!.x = 0; this.player!.y = 0;
        setTimeout(() => { this.end(false); Game.moveVisuals(); }, 1500);
    }

    static end(isRemote: boolean) {
        this.active = false;
        document.getElementById('battle-modal')!.style.display = 'none';
        if(!isRemote) { Network.send('BATTLE_END', {}); Game.nextTurn(); }
    }

    static openBag() { /* ... */ }
    static useCard() { /* ... */ }
    static run() { this.end(false); }
    static log(m: string) { Game.log(m); }
}

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
        const p = Game.players[playerId];
        if(p.cards.length === 0) { alert("Sem cartas."); return; }
        let msg = "Cartas de " + p.name + ":\n";
        p.cards.forEach(c => msg += `- ${c.icon} ${c.name}: ${c.desc}\n`);
        alert(msg);
    }
}

// ==========================================
// MOTOR DO JOGO
// ==========================================
class Game {
    static players: Player[] = [];
    static turn: number = 0;
    static isCityEvent: boolean = false; 

    static init(players: Player[], mapSize: number) {
        this.players = players;
        if(MapSystem.grid.length === 0) MapSystem.generate(mapSize);
        this.renderBoard(); this.updateHUD(); this.moveVisuals();
        this.checkTurnControl();
        this.renderDebugPanel(); 
    }

    // --- DEBUG MODE ---
    static renderDebugPanel() {
        const container = document.querySelector('.extra-space');
        if(container) {
            container.innerHTML = `
                <div style="font-size:0.7rem; color:#aaa; margin-bottom:5px;">DEBUG MOVE</div>
                <div style="display:flex; gap:5px; justify-content:center;">
                    <input type="number" id="debug-input" value="1" min="1" max="50" style="width:50px; text-align:center; border:none; padding:5px; border-radius:4px;">
                    <button class="btn" style="width:auto; margin:0; padding:5px 10px;" onclick="window.Game.debugMove()">GO</button>
                </div>
                <div style="margin-top:10px;"><small id="online-indicator" style="color:cyan;">OFFLINE</small></div>
            `;
        }
    }

    static debugMove() {
        if(!this.canAct()) return;
        const input = document.getElementById('debug-input') as HTMLInputElement;
        const result = parseInt(input.value) || 1;
        this.log(`[DEBUG] Forçando ${result} passos.`);
        Network.send('ROLL_DICE', { result }); 
        this.animateDice(result);
    }

    // --- MOVEMENT VISUALS (FIX TUC TUC) ---
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
        if(!this.canAct()) return;
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
            Network.send('LOG_MSG', { msg: `${this.getCurrentPlayer().name} tirou ${result}` });
            this.movePlayerLogic(result);
        }
    }

    static async movePlayerLogic(steps: number) {
        const p = this.getCurrentPlayer();
        for(let i=0; i<steps; i++) {
            if(p.y%2===0) { if(p.x<MapSystem.size-1)p.x++; else p.y++; }
            else { if(p.x>0)p.x--; else p.y++; }
            if(p.y>=MapSystem.size) { p.y = MapSystem.size-1; break; }

            Network.send('MOVE_STEP', { playerId: this.turn, x: p.x, y: p.y });
            this.performVisualStep(this.turn, p.x, p.y);
            
            await new Promise(r => setTimeout(r, 150));
        }
        this.handleTile(p);
    }

    static performVisualStep(pId: number, x: number, y: number) {
        const p = this.players[pId];
        if(pId !== this.turn || !this.canAct()) { p.x = x; p.y = y; }
        
        const tile = document.getElementById(`tile-${x}-${y}`);
        if(tile) {
            tile.classList.add('step-highlight');
            this.moveVisuals(); 
            setTimeout(() => tile.classList.remove('step-highlight'), 300);
        }
    }

    static handleTile(p: Player) {
        const type = MapSystem.grid[p.y][p.x];
        const enemy = this.players.find(o => o !== p && o.x === p.x && o.y === p.y);
        
        if(enemy) { 
            const defMon = enemy.team.find(m => !m.isFainted());
            if(defMon) { Battle.setup(p, defMon, true, enemy.name, 0, enemy); } // Passa enemyPlayer
            else { this.log(`${enemy.name} sem pokemons!`); this.nextTurn(); }
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
            // NOVA LÓGICA DE EVENTO: Carta OU Item (50/50)
            if(Math.random() < 0.5) {
                Cards.draw(p);
            } else {
                const itemKeys = Object.keys(SHOP_ITEMS.map(i=>i.id)); 
                // Simplificado: Pokeball ou Potion
                const gift = Math.random() > 0.5 ? 'pokeball' : 'potion';
                p.items[gift]++;
                this.log(`Encontrou um item: ${gift}!`);
                this.updateHUD();
            }
            this.nextTurn(); 
        }
        else if(type === TILE.GYM) { 
            const boss = new Pokemon(150, true); 
            Battle.setup(p, boss, false, "Líder de Ginásio", 1000); 
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
        this.turn = (this.turn+1)%this.players.length;
        
        // Verifica se o próximo jogador deve pular o turno
        const nextP = this.players[this.turn];
        if(nextP.skipTurn) {
            nextP.skipTurn = false;
            this.log(`${nextP.name} perdeu a vez!`);
            alert(`${nextP.name} perdeu a vez!`);
            this.nextTurn(); // Pula recursivamente
            return;
        }

        this.saveGame();
        Network.send('TURN_CHANGE', { turn: this.turn });
        this.updateHUD(); 
        this.moveVisuals();
        this.checkTurnControl();
    }

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

    static getSaveData() { return { players: this.players, turn: this.turn, mapSize: MapSystem.size, grid: MapSystem.grid }; }
    static saveGame() { localStorage.setItem('pk_save', JSON.stringify(this.getSaveData())); Network.broadcastState(); }
    static loadGame() { const json=localStorage.getItem('pk_save'); if(json) this.loadGameFromData(JSON.parse(json)); }
    static loadGameFromData(d: any) { 
        MapSystem.size=d.mapSize; MapSystem.grid=d.grid;
        this.players = d.players.map((pd:any) => {
            const file = pd.avatar.split('/').pop();
            const pl = new Player(pd.id, pd.name, file);
            Object.assign(pl, pd); 
            pl.avatar = `/assets/img/Treinadores/${file}`;
            pl.team = pd.team.map((td:any) => { const po=new Pokemon(td.id, td.isShiny); Object.assign(po, td); return po; });
            return pl;
        });
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

    // --- HUD RESTAURADA (BARRAS E STATUS) ---
    static updateHUD() {
        const left = document.getElementById('hud-col-left')!; left.innerHTML = '';
        const right = document.getElementById('hud-col-right')!; right.innerHTML = '';
        this.players.forEach((p,i) => {
            const d = document.createElement('div');
            d.className = `player-slot ${i===this.turn?'active':''}`;
            const th = p.team.map(m => `
                <div class="poke-card ${m.isFainted() ? 'fainted' : ''}">
                    <img src="${m.getSprite()}" class="poke-card-img">
                    <div class="poke-card-info">
                        <div class="poke-header">
                            <span>${m.name}</span>
                            <span class="poke-lvl">Lv.${m.level}</span>
                        </div>
                        <div class="bar-container" title="HP">
                            <div class="bar-fill hp-bar" style="width:${(m.currentHp/m.maxHp)*100}%"></div>
                            <div class="bar-text">${m.currentHp}/${m.maxHp}</div>
                        </div>
                        <div class="bar-container" title="XP">
                            <div class="bar-fill xp-bar" style="width:${(m.currentXp/m.maxXp)*100}%"></div>
                        </div>
                        <div class="poke-stats">
                            <div class="stat-item">⚔️${m.atk}</div>
                            <div class="stat-item">🛡️${m.def}</div>
                            <div class="stat-item">💨${m.speed}</div>
                        </div>
                    </div>
                </div>`).join('');
            
            d.innerHTML = `<div class="hud-header"><div class="hud-name-group"><img src="${p.avatar}" class="hud-avatar-img"><span>${p.name}</span></div><div>💰${p.gold}</div></div><div class="hud-team">${th}</div><div class="hud-actions"><button class="btn btn-secondary btn-mini" onclick="window.openInventory(${i})">🎒</button><button class="btn btn-secondary btn-mini" onclick="window.openCards(${i})">🃏</button></div>`;
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
        const ps = [];
        for(let i=0; i<n; i++) ps.push(new Player(i, (document.getElementById(`p${i}-name`) as HTMLInputElement).value, (document.getElementById(`p${i}-av`) as HTMLSelectElement).value));
        document.getElementById('setup-screen')!.style.display='none';
        document.getElementById('game-container')!.style.display='flex';
        Game.init(ps, 20);
        if(Network.isHost) Network.broadcastState();
    }
}

// BINDING
window.openInventory = (id) => { const p=Game.players[id]; alert("Itens: "+JSON.stringify(p.items)); };
window.openCards = (id) => { if(Network.isOnline && id !== Network.myPlayerId) return alert("Privado!"); Cards.showPlayerCards(id); };
window.Setup = Setup; window.Game = Game; window.Shop = Shop; window.Battle = Battle; window.Network = Network;
Setup.updateSlots();