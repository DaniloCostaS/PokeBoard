import './style.css'
import { 
    TILE, NPC_DATA, CARDS_DB, POKEDEX, SHOP_ITEMS 
} from './constants';

import type { 
    ItemData, CardData, Coord 
} from './constants';

// Declare a lib externa (PeerJS) para o TypeScript
declare const Peer: any;

// --- 1. CONFIGURAÇÕES E CONSTANTES GERAIS ---

// Cores expandidas para 8 jogadores
const PLAYER_COLORS = [
    '#e74c3c', '#3498db', '#f1c40f', '#9b59b6', 
    '#1abc9c', '#e67e22', '#34495e', '#ff7979'
];

// Imagens dos Treinadores
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

// Definição de Tipos
const POKEMON_TYPES: {[key: string]: string} = {
    'Charmander': 'fire', 'Charmeleon': 'fire', 'Charizard': 'fire', 'Vulpix': 'fire', 'Growlithe': 'fire',
    'Squirtle': 'water', 'Wartortle': 'water', 'Blastoise': 'water', 'Psyduck': 'water', 'Poliwag': 'water',
    'Bulbasaur': 'grass', 'Ivysaur': 'grass', 'Venusaur': 'grass', 'Oddish': 'grass', 'Bellsprout': 'grass',
    'Pikachu': 'electric', 'Raichu': 'electric', 'Magnemite': 'electric', 'Voltorb': 'electric',
    'Geodude': 'ground', 'Graveler': 'ground', 'Golem': 'ground', 'Onix': 'ground',
    'Pidgey': 'normal', 'Rattata': 'normal', 'Meowth': 'normal', 'Eevee': 'normal'
};

// Tabela de Vantagens (Ataque -> Defesa = Multiplicador)
const TYPE_CHART: {[key: string]: {[key: string]: number}} = {
    'fire': { 'grass': 2, 'water': 0.5, 'rock': 0.5, 'bug': 2, 'ice': 2 },
    'water': { 'fire': 2, 'grass': 0.5, 'ground': 2, 'rock': 2 },
    'grass': { 'water': 2, 'fire': 0.5, 'ground': 2, 'flying': 0.5, 'rock': 2 },
    'electric': { 'water': 2, 'grass': 0.5, 'ground': 0, 'flying': 2 },
    'ground': { 'fire': 2, 'electric': 2, 'grass': 0.5, 'flying': 0, 'rock': 2 },
    'normal': { 'ghost': 0 }
};

// Interface Global
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
// REDE (MULTIPLAYER / PEERJS)
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
        if(!code) return alert("Digite o código da sala!");
        this.initPeer(code, false);
    }

    static initPeer(id: string, host: boolean) {
        this.isHost = host;
        this.isOnline = true;
        this.myPlayerId = host ? 0 : 1; 
        
        const fullId = "pkbd-" + id; // Prefixo para evitar colisão
        
        try {
            this.peer = new Peer(host ? fullId : null);
        } catch(e) {
            alert("Erro ao iniciar PeerJS. Verifique sua internet.");
            return;
        }

        // CORREÇÃO: Usar _myId (underline) para indicar parâmetro não usado (TS fix)
        this.peer.on('open', (_myId: string) => {
            const displayCode = host ? id : "Conectando...";
            document.getElementById('lobby-status')!.innerHTML = 
                `Status: ${host ? "HOST (Aguardando...)" : "CLIENT"}<br>Sala: <b>${displayCode}</b>`;
            
            if(host) {
                this.peer.on('connection', (c: any) => {
                    this.conn = c;
                    this.setupConnection();
                    document.getElementById('lobby-status')!.innerHTML += "<br>⚡ Jogador Conectado!";
                    Setup.showSetupScreen(); // Libera o setup para o host
                });
            } else {
                this.conn = this.peer.connect(fullId);
                this.setupConnection();
            }
        });

        this.peer.on('error', (err: any) => {
            console.error(err);
            alert("Erro de Conexão: " + err.type);
            this.isOnline = false;
        });
    }

    static setupConnection() {
        this.conn.on('open', () => {
            console.log("P2P Aberto!");
            if(!this.isHost) {
                document.getElementById('lobby-status')!.innerHTML = "Conectado! Aguarde o Host iniciar.";
            }
        });

        this.conn.on('data', (data: any) => {
            this.handleData(data);
        });
    }

    static handleData(data: any) {
        if(data.type === 'GAME_STATE') {
            console.log("Recebendo Sync...");
            Game.loadGameFromData(data.payload);
        }
    }

    static broadcastState() {
        if(this.isOnline && this.conn) {
            const saveData = Game.getSaveData();
            this.conn.send({ type: 'GAME_STATE', payload: saveData });
        }
    }
}

// ==========================================
// CLASSES LÓGICAS
// ==========================================

class Pokemon {
    id: number; name: string; type: string;
    maxHp: number; currentHp: number; atk: number; def: number; speed: number;
    level: number; currentXp: number; maxXp: number;
    isShiny: boolean; wins: number; evoData: { next: string | null; trigger?: number };

    constructor(templateId: number, isShiny: boolean = false) {
        const template = POKEDEX.find(p => p.id === templateId) || POKEDEX[0];
        this.id = template.id;
        this.name = template.name;
        this.isShiny = isShiny;
        
        // Define tipo, fallback para 'normal'
        this.type = POKEMON_TYPES[this.name] || 'normal';
        
        this.level = 5;
        this.currentXp = 0;
        this.maxXp = 100;
        
        const shinyBonus = isShiny ? 1.2 : 1.0;

        this.maxHp = Math.floor((template.hp + 20) * shinyBonus);
        this.currentHp = this.maxHp;
        this.atk = Math.floor((template.atk + 5) * shinyBonus);
        this.def = Math.floor((template.atk * 0.8) * shinyBonus); 
        this.speed = Math.floor((template.atk * 0.9 + Math.random() * 10) * shinyBonus);

        this.wins = 0;
        this.evoData = { next: template.nextForm, trigger: template.evoTrigger };
    }

    getSprite(): string {
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${this.isShiny ? 'shiny/' : ''}${this.id}.png`;
    }

    isFainted(): boolean { return this.currentHp <= 0; }

    heal(amount: number): void {
        this.currentHp += amount;
        if(this.currentHp > this.maxHp) this.currentHp = this.maxHp;
    }

    checkEvolution(): boolean {
        if (this.evoData.next && this.wins >= (this.evoData.trigger || 999)) {
            const nextTemplate = POKEDEX.find(p => p.name === this.evoData.next);
            if (nextTemplate) {
                this.id = nextTemplate.id;
                this.name = nextTemplate.name;
                this.type = POKEMON_TYPES[this.name] || this.type;
                this.maxHp += 30; this.currentHp = this.maxHp;
                this.atk += 10; this.def += 10; this.speed += 5;
                this.evoData = { next: nextTemplate.nextForm, trigger: nextTemplate.evoTrigger };
                return true;
            }
        }
        return false;
    }
}

class Player {
    id: number; name: string; avatar: string; 
    x: number = 0; y: number = 0; gold: number = 500;
    items: { [key: string]: number } = { 'pokeball': 6, 'potion': 1, 'greatball': 0, 'ultraball': 0 };
    cards: CardData[] = [];
    team: Pokemon[] = [];

    constructor(id: number, name: string, avatarFile: string) {
        this.id = id;
        this.name = name;
        // Caminho relativo para a pasta public/assets
        this.avatar = `./assets/img/Treinadores/${avatarFile}`;
        
        if(name !== "_LOAD_") {
            const starters = [1, 4, 7]; 
            this.team.push(new Pokemon(starters[Math.floor(Math.random()*starters.length)]));
        }
    }

    isDefeated(): boolean {
        return this.team.every(p => p.isFainted());
    }
}

class MapSystem {
    static grid: number[][] = [];
    static size: number = 20; 
    
    static generate(size: number) {
        this.size = size;
        this.grid = Array(this.size).fill(0).map(() => Array(this.size).fill(TILE.GRASS));
        const blobCount = Math.floor(this.size / 2); 
        for(let i=0; i<blobCount; i++) this.blob(TILE.WATER, 3);
        for(let i=0; i<Math.floor(blobCount * 0.7); i++) this.blob(TILE.GROUND, 2); 
        
        const pathTiles = this.size * this.size;
        let gymCounter = 0;
        const gymFrequency = Math.floor(pathTiles / 9);

        for(let i=0; i<pathTiles; i++) {
            const c = this.getCoord(i);
            if (i > 0 && i % gymFrequency === 0 && gymCounter < 8) {
                this.grid[c.y][c.x] = TILE.GYM; gymCounter++;
            } else if (i > 0 && i % 75 === 0) {
                this.grid[c.y][c.x] = TILE.CITY;
            } else if (Math.random() < 0.05 && this.grid[c.y][c.x] === TILE.GRASS) {
                this.grid[c.y][c.x] = TILE.EVENT;
            } else if (Math.random() < 0.08 && this.grid[c.y][c.x] === TILE.GRASS) {
                const npcTypes = [TILE.ROCKET, TILE.BIKER, TILE.YOUNG, TILE.OLD];
                this.grid[c.y][c.x] = npcTypes[Math.floor(Math.random() * npcTypes.length)];
            }
        }
        this.grid[0][0] = TILE.CITY;
    }

    static blob(type: number, size: number) {
        const cx = Math.floor(Math.random()*this.size);
        const cy = Math.floor(Math.random()*this.size);
        for(let y=cy-size; y<=cy+size; y++) {
            for(let x=cx-size; x<=cx+size; x++) {
                if(x>=0 && x<this.size && y>=0 && y<this.size) this.grid[y][x] = type;
            }
        }
    }

    static getCoord(i: number): Coord {
        const y = Math.floor(i / this.size);
        let x = i % this.size;
        if (y % 2 !== 0) x = (this.size - 1) - x; 
        return {x, y};
    }
}

class Battle {
    static active: boolean = false;
    static player: Player | null = null;
    static activeMon: Pokemon | null = null; 
    static opponent: Pokemon | null = null;
    static isPvP: boolean = false;
    static isNPC: boolean = false; 
    static activeCard: string | null = null;
    static reward: number = 0;

    static setup(player: Player, enemyMon: Pokemon, isPvP: boolean = false, _label: string = "Selvagem", reward: number = 0) {
        this.player = player;
        this.opponent = enemyMon;
        this.isPvP = isPvP;
        this.isNPC = (reward > 0 && !isPvP);
        this.reward = reward;
        this.activeCard = null;
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
            div.innerHTML = `
                <img src="${mon.getSprite()}" width="40">
                <div>
                    <b>${mon.name}</b> <small>(${mon.type})</small><br>
                    <small>HP: ${mon.currentHp}/${mon.maxHp}</small>
                </div>
            `;
            if(!mon.isFainted()) {
                div.onclick = () => { modal.style.display = 'none'; this.startRound(mon); };
            }
            list.appendChild(div);
        });
        modal.style.display = 'flex';
    }

    static startRound(selectedMon: Pokemon) {
        this.active = true;
        this.activeMon = selectedMon;
        document.getElementById('battle-modal')!.style.display = 'flex';
        let titleText = this.isPvP ? "⚔️ PvP" : (this.isNPC ? "⚔️ Treinador" : "⚔️ Selvagem");
        document.getElementById('battle-title')!.innerText = titleText;
        this.updateUI();
        this.log(`Vai, ${selectedMon.name}!`);
    }

    static updateUI() {
        if(!this.activeMon || !this.opponent) return;
        const pMon = this.activeMon; const opp = this.opponent;

        document.getElementById('ply-name')!.innerText = pMon.name;
        document.getElementById('ply-lvl')!.innerText = `Lv${pMon.level}`;
        (document.getElementById('ply-img') as HTMLImageElement).src = pMon.getSprite();
        document.getElementById('ply-hp')!.style.width = (pMon.currentHp/pMon.maxHp)*100 + "%";
        document.getElementById('ply-hp-text')!.innerText = `${pMon.currentHp}/${pMon.maxHp}`;
        
        document.getElementById('opp-name')!.innerText = opp.name;
        document.getElementById('opp-lvl')!.innerText = `Lv${opp.level}`;
        (document.getElementById('opp-img') as HTMLImageElement).src = opp.getSprite();
        document.getElementById('opp-hp')!.style.width = (opp.currentHp/opp.maxHp)*100 + "%";

        const oppImgContainer = document.getElementById('opp-img')!.parentElement!;
        if(opp.isShiny) {
            oppImgContainer.classList.add('shiny');
            document.getElementById('opp-name')!.innerText += " ✨";
        } else {
            oppImgContainer.classList.remove('shiny');
        }
    }

    static log(msg: string) { document.getElementById('battle-msg')!.innerText = msg; }

    static calculateDamage(attacker: Pokemon, defender: Pokemon): { dmg: number, multiplier: number } {
        let rawDmg = attacker.atk * (0.8 + Math.random() * 0.4);
        
        let multiplier = 1;
        // Verifica se a tabela de tipos existe para evitar crash
        if (TYPE_CHART[attacker.type] && TYPE_CHART[attacker.type][defender.type] !== undefined) {
            multiplier = TYPE_CHART[attacker.type][defender.type];
        }

        rawDmg *= multiplier;
        let defenseFactor = defender.def * 0.5;
        let finalDmg = Math.max(1, Math.floor(rawDmg - defenseFactor));
        return { dmg: finalDmg, multiplier };
    }

    static attack() {
        if(!this.activeMon || !this.opponent) return;
        try {
            const { dmg, multiplier } = this.calculateDamage(this.activeMon, this.opponent);
            let finalDmg = dmg;
            if(this.activeCard === 'crit') { finalDmg *= 2; this.log("💥 CRÍTICO!"); this.activeCard = null; } 
            
            let effectMsg = "";
            if (multiplier > 1) effectMsg = " (Super!)";
            if (multiplier < 1) effectMsg = " (Fraco...)";

            this.log(`${this.activeMon.name} atacou! -${finalDmg}${effectMsg}`);
            this.opponent.currentHp = Math.max(0, this.opponent.currentHp - finalDmg);
            this.updateUI();

            if(this.opponent.currentHp <= 0) setTimeout(() => this.win(), 1000);
            else setTimeout(() => this.enemyTurn(), 1000);
        } catch (e) {
            console.error("Erro na batalha", e);
            this.log("Erro no ataque!");
            setTimeout(() => this.enemyTurn(), 1000);
        }
    }

    static enemyTurn() {
        if(!this.activeMon || !this.opponent) return;
        const { dmg, multiplier } = this.calculateDamage(this.opponent, this.activeMon);
        let effectMsg = "";
        if (multiplier > 1) effectMsg = " (Super!)";
        if (multiplier < 1) effectMsg = " (Fraco...)";

        this.log(`${this.opponent.name} bateu! -${dmg}${effectMsg}`);
        this.activeMon.currentHp = Math.max(0, this.activeMon.currentHp - dmg);
        this.updateUI();

        if(this.activeMon.currentHp <= 0) setTimeout(() => this.handleFaint(), 1000);
    }

    static handleFaint() {
        if(this.player!.isDefeated()) { this.lose(); } 
        else {
            this.log(`${this.activeMon!.name} desmaiou!`);
            document.getElementById('battle-modal')!.style.display = 'none';
            this.openSelectionModal("Escolha o próximo!");
        }
    }

    static openBag() {
        const list = document.getElementById('battle-bag-list')!;
        list.innerHTML = '';
        Object.keys(this.player!.items).forEach(key => {
            if(this.player!.items[key] > 0) {
                const item = SHOP_ITEMS.find(i => i.id === key);
                if(item) {
                    const btn = document.createElement('button');
                    btn.className = 'btn';
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
        if(data.type === 'capture' && (this.isPvP || this.isNPC)) { this.log("Não pode roubar!"); return; }
        
        this.player!.items[key]--;
        if(data.type === 'heal') {
            this.activeMon!.heal(data.val!);
            this.log("Curado!");
            this.updateUI();
            setTimeout(() => this.enemyTurn(), 1000);
        } else if(data.type === 'capture') {
            this.attemptCapture(data.rate!);
        }
    }

    static attemptCapture(rate: number) {
        if(!this.opponent) return;
        const chance = ((1 - (this.opponent.currentHp/this.opponent.maxHp)) * rate) + 0.2;
        if(this.activeCard === 'master' || Math.random() < chance) {
            this.log(`✨ Capturou ${this.opponent.name}!`);
            this.player!.team.push(this.opponent);
            setTimeout(() => this.end(), 1500);
        } else {
            this.log("Escapou!");
            setTimeout(() => this.enemyTurn(), 1000);
        }
    }

    static useCard() {
        const card = this.player!.cards.find(c => c.type === 'battle');
        if(!card) { this.log("Sem cartas!"); return; }
        this.log(`Usou ${card.name}!`);
        this.player!.cards.splice(this.player!.cards.indexOf(card), 1);
        Cards.render();
        if(card.id === 'crit') this.activeCard = 'crit';
        if(card.id === 'master') this.activeCard = 'master';
        if(card.id === 'run') { this.end(); }
    }

    static run() {
        if(this.isPvP || this.isNPC) { this.log("Sem fuga!"); return; }
        const chance = this.activeMon!.speed > this.opponent!.speed ? 0.7 : 0.4;
        if(Math.random() < chance) this.end();
        else { this.log("Falhou!"); setTimeout(()=>this.enemyTurn(),1000); }
    }

    static win() {
        let gain = this.isPvP ? 500 : (this.isNPC ? this.reward : 150);
        this.player!.gold += gain;
        this.log(`Vitória! +${gain} Gold`);
        
        const p = this.activeMon!;
        p.wins++;
        p.currentXp += 50;
        if(p.currentXp >= p.maxXp) {
            p.currentXp = 0; p.level++; p.maxHp += 5; p.atk += 2; p.def += 2; p.speed += 1;
            this.log("Subiu de Nível!");
        }
        if(p.checkEvolution()) alert(`Evoluiu para ${p.name}!`);
        setTimeout(() => this.end(), 1500);
    }

    static lose() {
        this.log("Derrota...");
        this.player!.gold = Math.max(0, this.player!.gold - 100);
        this.player!.team.forEach(p => p.heal(999));
        this.player!.x = 0; this.player!.y = 0;
        setTimeout(() => { this.end(); Game.moveVisuals(); }, 1500);
    }

    static end() {
        this.active = false;
        document.getElementById('battle-modal')!.style.display = 'none';
        Game.nextTurn();
    }
}

class Shop {
    static open() {
        const p = Game.getCurrentPlayer();
        document.getElementById('shop-gold')!.innerText = p.gold.toString();
        const list = document.getElementById('shop-items-list')!;
        list.innerHTML = '';
        SHOP_ITEMS.forEach(item => {
            const div = document.createElement('div');
            div.className = 'shop-item';
            div.innerHTML = `
                <div style="display:flex; align-items:center;">
                    <span class="item-icon">${item.icon}</span>
                    <b>${item.name}</b>
                </div>
                <button class="shop-btn btn" style="width:auto; padding:5px 10px; margin:0; background:var(--gold); color:#333;" onclick="window.Shop.buy('${item.id}', ${item.price})">${item.price} G</button>
            `;
            list.appendChild(div);
        });
        const inv = document.getElementById('inventory-list')!;
        inv.innerHTML = Object.entries(p.items).map(([k,v]) => `<span>${k} x${v}</span>`).join(', ');
        document.getElementById('shop-modal')!.style.display = 'flex';
    }
    static buy(id: string, price: number) {
        const p = Game.getCurrentPlayer();
        if(p.gold >= price) { 
            p.gold -= price; 
            p.items[id]++; 
            this.open(); 
            Game.updateHUD(); 
        } else {
            alert("Ouro insuficiente!");
        }
    }
    static close() {
        document.getElementById('shop-modal')!.style.display = 'none';
        if(Game.isCityEvent) {
            Game.isCityEvent = false;
            Game.nextTurn();
        }
    }
}

class Cards {
    static draw(player: Player) {
        const card = CARDS_DB[Math.floor(Math.random()*CARDS_DB.length)];
        player.cards.push(card);
        Game.log(`Ganhou carta: ${card.icon} ${card.name}`);
        Game.updateHUD();
    }
    static render() {}
    static showPlayerCards(playerId: number) {
        const p = Game.players[playerId];
        if(p.cards.length === 0) { alert("Sem cartas."); return; }
        let msg = "Cartas de " + p.name + ":\n";
        p.cards.forEach(c => msg += `- ${c.icon} ${c.name}: ${c.desc}\n`);
        alert(msg);
    }
}

class Game {
    static players: Player[] = [];
    static turn: number = 0;
    static forcedRoll: number | null = null;
    static isCityEvent: boolean = false; 

    static init(players: Player[], mapSize: number) {
        this.players = players;
        if(MapSystem.grid.length === 0) MapSystem.generate(mapSize);
        this.renderBoard();
        this.updateHUD();
        this.moveVisuals();
        this.checkTurnControl();
    }

    // --- SAVE & LOAD & EXPORT ---
    static getSaveData() {
        return { players: this.players, turn: this.turn, mapSize: MapSystem.size, grid: MapSystem.grid };
    }

    static saveGame() {
        const data = this.getSaveData();
        localStorage.setItem('pokeboard_save', JSON.stringify(data));
        Network.broadcastState(); // Sync Online
    }

    static loadGame() {
        const json = localStorage.getItem('pokeboard_save');
        if(json) this.loadGameFromData(JSON.parse(json));
    }

    static loadGameFromData(data: any) {
        MapSystem.size = data.mapSize;
        MapSystem.grid = data.grid || [];
        
        this.players = data.players.map((pData: any) => {
            // Removemos a variável avatarFile que não estava sendo usada
            const newP = new Player(pData.id, pData.name, "_LOAD_"); 
            Object.assign(newP, pData);
            newP.team = pData.team.map((tData: any) => {
                const mon = new Pokemon(tData.id, tData.isShiny);
                Object.assign(mon, tData);
                return mon;
            });
            return newP;
        });
        
        this.turn = data.turn;
        document.getElementById('setup-screen')!.style.display = 'none';
        document.getElementById('game-container')!.style.display = 'flex';
        Game.init(this.players, data.mapSize);
        Game.log("Jogo Carregado/Sincronizado!");
    }

    static exportSave() {
        const data = localStorage.getItem('pokeboard_save');
        if(!data) return alert("Nada para salvar!");
        const blob = new Blob([data], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'pokeboard_save.txt';
        a.click();
    }

    static importSave(input: HTMLInputElement) {
        const file = input.files?.[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = e.target?.result as string;
                localStorage.setItem('pokeboard_save', json);
                this.loadGameFromData(JSON.parse(json));
            } catch(err) { alert("Arquivo inválido!"); }
        };
        reader.readAsText(file);
    }

    static checkTurnControl() {
        const indicator = document.getElementById('online-indicator')!;
        if(Network.isOnline) indicator.innerText = "ONLINE"; else indicator.innerText = "OFFLINE";
    }

    static getCurrentPlayer(): Player { return this.players[this.turn]; }

    static renderBoard() {
        const area = document.getElementById('board-area')!;
        area.innerHTML = '';
        area.style.gridTemplateColumns = `repeat(${MapSystem.size}, 1fr)`;
        area.style.gridTemplateRows = `repeat(${MapSystem.size}, 1fr)`;
        const frag = document.createDocumentFragment();
        for(let y=0; y<MapSystem.size; y++) {
            for(let x=0; x<MapSystem.size; x++) {
                const d = document.createElement('div');
                let tileClass = 'path';
                switch(MapSystem.grid[y][x]) {
                    case TILE.GRASS: tileClass = 'grass'; break;
                    case TILE.WATER: tileClass = 'water'; break;
                    case TILE.GROUND: tileClass = 'ground'; break;
                    case TILE.CITY: tileClass = 'city'; break;
                    case TILE.GYM: tileClass = 'gym'; break;
                    case TILE.EVENT: tileClass = 'event'; break;
                    case TILE.ROCKET: tileClass = 'rocket'; break;
                    case TILE.BIKER: tileClass = 'biker'; break;
                    case TILE.YOUNG: tileClass = 'young'; break;
                    case TILE.OLD: tileClass = 'old'; break;
                }
                d.className = `tile ${tileClass}`;
                d.id = `tile-${x}-${y}`;
                if(MapSystem.size >= 30) d.style.fontSize = '8px';
                frag.appendChild(d);
            }
        }
        area.appendChild(frag);
    }

    // --- CORREÇÃO TUC TUC: SÓ RECRIA QUEM SE MEXEU ---
    static moveVisuals() {
        this.players.forEach((p, idx) => {
            const currentTile = document.getElementById(`tile-${p.x}-${p.y}`);
            if(!currentTile) return;

            // Busca o token pelo ID único
            let token = document.getElementById(`p-token-${idx}`);

            // Se o token já existe e está no lugar certo, não faz nada (evita tuc tuc)
            if (token && token.parentElement === currentTile) {
                // Atualiza apenas a classe 'active-token' se for a vez dele
                if(idx === this.turn) token.classList.add('active-token');
                else token.classList.remove('active-token');
                return; 
            }

            // Se existe mas está no lugar errado (ou não existe), recria/move
            if (token) token.remove(); 

            const t = document.createElement('div');
            t.id = `p-token-${idx}`; // Atribui ID Único
            t.className = `player-token ${idx===this.turn?'active-token':''}`;
            t.style.backgroundImage = `url('${p.avatar}')`;
            t.style.borderColor = PLAYER_COLORS[idx % PLAYER_COLORS.length];
            
            if(MapSystem.size >= 30) { 
                t.style.width = '90%'; t.style.height = '90%'; 
            }
            
            currentTile.appendChild(t);
            
            if(idx===this.turn) currentTile.scrollIntoView({block:'center',inline:'center',behavior:'smooth'});
        });
    }

    static async rollDice() {
        (document.getElementById('roll-btn') as HTMLButtonElement).disabled = true;
        const die = document.getElementById('d20-display')!;
        
        for(let i=0;i<10;i++) { 
            die.innerText = `🎲 ${Math.floor(Math.random()*20)+1}`; 
            await new Promise(r=>setTimeout(r,50)); 
        }
        let result = this.forcedRoll || Math.floor(Math.random()*20)+1;
        this.forcedRoll = null;
        die.innerText = `🎲 ${result}`;
        this.log(`${this.getCurrentPlayer().name} rolou ${result}.`);
        await this.movePlayer(result);
    }

    static async movePlayer(steps: number) {
        const p = this.getCurrentPlayer();
        for(let i = 0; i < steps; i++) {
            if(p.y % 2 === 0) { if(p.x < MapSystem.size - 1) p.x++; else p.y++; } else { if(p.x > 0) p.x--; else p.y++; }
            if(p.y >= MapSystem.size){ p.y = MapSystem.size - 1; break; } 
            
            const tile = document.getElementById(`tile-${p.x}-${p.y}`);
            if(tile) tile.classList.add('step-highlight');
            this.moveVisuals();
            await new Promise(r => setTimeout(r, 150));
            if(tile) tile.classList.remove('step-highlight');
        }
        this.handleTile(p);
    }

    static handleTile(p: Player) {
        const type = MapSystem.grid[p.y][p.x];
        const enemy = this.players.find(o => o !== p && o.x === p.x && o.y === p.y);
        
        if(enemy) { 
            const defMon = enemy.team.find(m => !m.isFainted());
            if(defMon) { Battle.setup(p, defMon, true, enemy.name); } 
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
            this.isCityEvent = true;
            document.getElementById('city-modal')!.style.display = 'flex';
        }
        else if(type === TILE.EVENT) { Cards.draw(p); this.nextTurn(); }
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

    static handleCityChoice(choice: 'heal' | 'shop') {
        const p = this.getCurrentPlayer();
        document.getElementById('city-modal')!.style.display = 'none';
        if(choice === 'heal') {
            p.team.forEach(m => m.heal(999));
            this.log("Pokémon curados!");
            this.updateHUD();
            this.isCityEvent = false;
            this.nextTurn();
        } else {
            Shop.open();
        }
    }

    static nextTurn() {
        this.saveGame();
        this.turn = (this.turn+1)%this.players.length;
        (document.getElementById('roll-btn') as HTMLButtonElement).disabled = false;
        this.updateHUD(); 
        this.moveVisuals();
    }

    static updateHUD() {
        const leftCol = document.getElementById('hud-col-left')!;
        const rightCol = document.getElementById('hud-col-right')!;
        leftCol.innerHTML = ''; rightCol.innerHTML = '';

        this.players.forEach((p, i) => {
            const slot = document.createElement('div');
            slot.className = 'player-slot';
            if (i === this.turn) slot.classList.add('active');

            const cardsHTML = p.team.map(m => {
                const hpPercent = (m.currentHp / m.maxHp) * 100;
                const xpPercent = (m.currentXp / m.maxXp) * 100;
                
                return `
                <div class="poke-card ${m.isFainted() ? 'fainted' : ''}">
                    <img src="${m.getSprite()}" class="poke-card-img">
                    <div class="poke-card-info">
                        <div class="poke-header">
                            <span>${m.name}</span>
                            <span class="poke-lvl">Lv.${m.level}</span>
                        </div>
                        <div class="bar-container" title="HP">
                            <div class="bar-fill hp-bar" style="width:${hpPercent}%"></div>
                        </div>
                        <div class="bar-container" title="XP">
                            <div class="bar-fill xp-bar" style="width:${xpPercent}%"></div>
                        </div>
                        <div class="poke-stats">
                            <div class="stat-item" title="Atk">⚔️<strong>${m.atk}</strong></div>
                            <div class="stat-item" title="Def">🛡️<strong>${m.def}</strong></div>
                            <div class="stat-item" title="Spd">💨<strong>${m.speed}</strong></div>
                        </div>
                    </div>
                </div>
                `;
            }).join('');

            const itemCount = Object.values(p.items).reduce((a,b)=>a+b, 0);

            slot.innerHTML = `
                <div class="hud-header">
                    <div class="hud-name-group">
                        <img src="${p.avatar}" class="hud-avatar-img">
                        <span>${p.name}</span>
                    </div>
                    <div style="color:goldenrod;">💰${p.gold}</div>
                </div>
                
                <div class="hud-team">
                    ${cardsHTML}
                </div>
                
                <div class="hud-actions">
                    <button class="btn btn-secondary btn-mini" onclick="window.openInventory(${i})">
                        🎒 (${itemCount})
                    </button>
                    <button class="btn btn-secondary btn-mini" onclick="window.openCards(${i})">
                        🃏 (${p.cards.length})
                    </button>
                </div>
            `;

            // Lógica de 8 Jogadores: metade para cada lado
            if (i < Math.ceil(this.players.length / 2)) {
                leftCol.appendChild(slot);
            } else {
                rightCol.appendChild(slot);
            }
        });

        const name = this.getCurrentPlayer().name;
        document.getElementById('turn-indicator')!.innerHTML = name;
    }

    static log(msg: string) {
        const el = document.getElementById('log-container')!; 
        const time = new Date().toLocaleTimeString().split(':');
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `<span class="log-time">${time[0]}:${time[1]}</span> ${msg}`;
        el.prepend(entry);
        if(el.children.length > 100) el.lastElementChild?.remove();
    }
}

class Setup {
    // --- MÉTODOS DE CONTROLE DE MENU ---
    static showOfflineSetup() {
        document.getElementById('menu-phase-1')!.style.display = 'none';
        document.getElementById('menu-phase-setup')!.style.display = 'block';
    }

    static showOnlineMenu() {
        document.getElementById('menu-phase-1')!.style.display = 'none';
        document.getElementById('menu-phase-online')!.style.display = 'block';
    }

    static showSetupScreen() {
        document.getElementById('menu-phase-online')!.style.display = 'none';
        document.getElementById('menu-phase-setup')!.style.display = 'block';
    }

    static updateSlots() {
        const num = parseInt((document.getElementById('num-players') as HTMLSelectElement).value);
        const container = document.getElementById('player-slots-container')!;
        container.innerHTML = '';
        
        const defaultNames = ["Ash", "Gary", "Misty", "Brock", "May", "Dawn", "Serena", "Goh"];

        // CORREÇÃO: Variável não usada removida
        TRAINER_IMAGES.map((img) => 
            `<option value="${img.file}">${img.label}</option>`
        ).join('');

        for(let i=0; i<num; i++) {
            const defaultImg = TRAINER_IMAGES[i % TRAINER_IMAGES.length].file;
            
            // Recria a lista de opções, selecionando a correta
            const optionsHTML = TRAINER_IMAGES.map((img) => 
                `<option value="${img.file}" ${img.file === defaultImg ? 'selected' : ''}>${img.label}</option>`
            ).join('');

            container.innerHTML += `
                <div class="setup-row">
                    <strong>P${i+1}</strong>
                    <input type="text" id="p${i}-name" value="${defaultNames[i] || 'Player'}" style="width:100px;">
                    
                    <div class="avatar-selection">
                        <img id="p${i}-preview" src="./assets/img/Treinadores/${defaultImg}" class="avatar-preview">
                        <select id="p${i}-av" onchange="window.Setup.updatePreview(${i})">
                            ${optionsHTML}
                        </select>
                    </div>
                </div>
            `;
        }
    }

    static updatePreview(playerId: number) {
        const select = document.getElementById(`p${playerId}-av`) as HTMLSelectElement;
        const img = document.getElementById(`p${playerId}-preview`) as HTMLImageElement;
        img.src = `./assets/img/Treinadores/${select.value}`;
    }

    static start() {
        const numPlayers = parseInt((document.getElementById('num-players') as HTMLSelectElement).value);
        const mapSize = parseInt((document.getElementById('map-size') as HTMLSelectElement).value); 
        
        const players: Player[] = [];
        for(let i=0; i<numPlayers; i++) {
            const name = (document.getElementById(`p${i}-name`) as HTMLInputElement).value;
            const avFile = (document.getElementById(`p${i}-av`) as HTMLSelectElement).value;
            players.push(new Player(i, name, avFile));
        }
        
        document.getElementById('setup-screen')!.style.display = 'none';
        document.getElementById('game-container')!.style.display = 'flex';
        
        Game.init(players, mapSize);
        // Se for host online, manda o estado inicial
        if(Network.isHost) Network.broadcastState();
    }
}

// ==========================================
// INICIALIZAÇÃO & BINDING GLOBAL
// ==========================================

window.openInventory = (playerId: number) => {
    const p = Game.players[playerId];
    let msg = `Inventário de ${p.name}:\n`;
    Object.entries(p.items).forEach(([k,v]) => {
        if(v > 0) msg += `- ${k}: ${v}\n`;
    });
    alert(msg); 
};

window.openCards = (playerId: number) => {
    Cards.showPlayerCards(playerId);
};

window.Setup = Setup;
window.Game = Game;
window.Shop = Shop;
window.Battle = Battle;
window.Network = Network;

Setup.updateSlots();