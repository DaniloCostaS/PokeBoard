import './style.css'

// ==========================================
// 1. TIPOS E INTERFACES (TypeScript Power!)
// ==========================================

interface PokemonData {
    id: number;
    name: string;
    type: string;
    hp: number;
    atk: number;
    nextForm: string | null;
    evoTrigger?: number;
    isLegendary?: boolean;
}

interface ItemData {
    id: string;
    name: string;
    icon: string;
    price: number;
    type: 'heal' | 'capture';
    val?: number;   // Para poções
    rate?: number;  // Para pokébolas
}

interface CardData {
    id: string;
    name: string;
    icon: string;
    desc: string;
    type: 'move' | 'battle';
}

interface Coord {
    x: number;
    y: number;
}

// Expõe as classes globais no objeto Window para o HTML acessá-las
declare global {
    interface Window {
        Setup: typeof Setup;
        Game: typeof Game;
        Shop: typeof Shop;
        Battle: typeof Battle;
    }
}

// ==========================================
// 2. CONSTANTES
// ==========================================

const BOARD_SIZE = 30;

const TILE = { 
    PATH: 0, GRASS: 1, WATER: 2, GROUND: 3, CITY: 4, GYM: 5, EVENT: 6,
    ROCKET: 7, BIKER: 8, YOUNG: 9, OLD: 10
};

const NPC_DATA: Record<number, {name: string, gold: number, team: number[]}> = {
    7: { name: "Rocket Grunt", gold: 300, team: [4, 74] },
    8: { name: "Biker", gold: 200, team: [5, 74] },
    9: { name: "Jovem", gold: 100, team: [7, 25] },
    10: { name: "Velho", gold: 150, team: [1, 25] }
};

const CARDS_DB: CardData[] = [
    { id: 'dice', name: "Dado Mágico", icon: "🎲", desc: "Escolha o nº do dado (1-20).", type: 'move' },
    { id: 'crit', name: "Super Crítico", icon: "💥", desc: "Dobra o dano do próximo ataque.", type: 'battle' },
    { id: 'master', name: "Master Ball", icon: "🟣", desc: "Captura 100% garantida.", type: 'battle' },
    { id: 'run', name: "Fumaça Ninja", icon: "💨", desc: "Foge da batalha instantaneamente.", type: 'battle' }
];

const POKEDEX: PokemonData[] = [
    { id: 1, name: "Bulbasaur", type: "Grama", hp: 60, atk: 12, nextForm: "Ivysaur", evoTrigger: 2 },
    { id: 2, name: "Ivysaur", type: "Grama", hp: 90, atk: 18, nextForm: "Venusaur", evoTrigger: 5 },
    { id: 3, name: "Venusaur", type: "Grama", hp: 120, atk: 24, nextForm: null },
    { id: 4, name: "Charmander", type: "Fogo", hp: 55, atk: 15, nextForm: "Charmeleon", evoTrigger: 2 },
    { id: 5, name: "Charmeleon", type: "Fogo", hp: 85, atk: 22, nextForm: "Charizard", evoTrigger: 5 },
    { id: 6, name: "Charizard", type: "Fogo", hp: 130, atk: 28, nextForm: null },
    { id: 7, name: "Squirtle", type: "Água", hp: 65, atk: 11, nextForm: "Wartortle", evoTrigger: 2 },
    { id: 8, name: "Wartortle", type: "Água", hp: 90, atk: 17, nextForm: "Blastoise", evoTrigger: 5 },
    { id: 9, name: "Blastoise", type: "Água", hp: 125, atk: 22, nextForm: null },
    { id: 25, name: "Pikachu", type: "Elétrico", hp: 50, atk: 16, nextForm: "Raichu", evoTrigger: 3 },
    { id: 26, name: "Raichu", type: "Elétrico", hp: 90, atk: 25, nextForm: null },
    { id: 74, name: "Geodude", type: "Pedra", hp: 55, atk: 14, nextForm: "Graveler", evoTrigger: 3 },
    { id: 95, name: "Onix", type: "Pedra", hp: 65, atk: 12, nextForm: null },
    { id: 150, name: "Mewtwo", type: "Psíquico", hp: 150, atk: 35, isLegendary: true }
];

const SHOP_ITEMS: ItemData[] = [
    { id: 'potion', name: 'Poção', icon: '💊', price: 100, type: 'heal', val: 50 },
    { id: 'pokeball', name: 'Pokébola', icon: '🔴', price: 200, type: 'capture', rate: 1.0 },
    { id: 'greatball', name: 'Great Ball', icon: '🔵', price: 500, type: 'capture', rate: 1.5 },
    { id: 'ultraball', name: 'Ultra Ball', icon: '⚫', price: 1000, type: 'capture', rate: 2.0 }
];

// ==========================================
// 3. CLASSES LÓGICAS
// ==========================================

class Pokemon {
    id: number;
    name: string;
    maxHp: number;
    currentHp: number;
    atk: number;
    isShiny: boolean;
    wins: number;
    evoData: { next: string | null; trigger?: number };

    constructor(templateId: number, isShiny: boolean = false) {
        const template = POKEDEX.find(p => p.id === templateId) || POKEDEX[0];
        this.id = template.id;
        this.name = template.name;
        this.maxHp = template.hp + (isShiny ? 20 : 0);
        this.currentHp = this.maxHp;
        this.atk = template.atk + (isShiny ? 5 : 0);
        this.isShiny = isShiny;
        this.wins = 0;
        this.evoData = { next: template.nextForm, trigger: template.evoTrigger };
    }

    getSprite(): string {
        const baseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
        return `${baseUrl}/${this.isShiny ? 'shiny/' : ''}${this.id}.png`;
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
                this.maxHp = nextTemplate.hp + (this.isShiny ? 20 : 0);
                this.atk = nextTemplate.atk + (this.isShiny ? 5 : 0);
                this.currentHp = this.maxHp;
                this.evoData = { next: nextTemplate.nextForm, trigger: nextTemplate.evoTrigger };
                return true;
            }
        }
        return false;
    }
}

class Player {
    id: number;
    name: string;
    avatar: string;
    x: number = 0;
    y: number = 0;
    gold: number = 500;
    items: { [key: string]: number } = { 'pokeball': 6, 'potion': 1, 'greatball': 0, 'ultraball': 0 };
    cards: CardData[] = [];
    team: Pokemon[] = [];

    constructor(id: number, name: string, avatar: string) {
        this.id = id;
        this.name = name;
        this.avatar = avatar;
        
        const starters = [1, 4, 7]; 
        this.team.push(new Pokemon(starters[Math.floor(Math.random()*starters.length)]));
    }

    isDefeated(): boolean {
        return this.team.every(p => p.isFainted());
    }
}

class MapSystem {
    static grid: number[][] = [];
    
    static generate() {
        this.grid = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(TILE.GRASS));
        
        for(let i=0; i<15; i++) this.blob(TILE.WATER, 3);
        for(let i=0; i<10; i++) this.blob(TILE.GROUND, 2); 
        
        const pathTiles = BOARD_SIZE * BOARD_SIZE;
        let gymCounter = 0;
        
        for(let i=0; i<pathTiles; i++) {
            const c = this.getCoord(i);
            
            if (i > 0 && i % Math.floor(pathTiles/9) === 0 && gymCounter < 8) {
                this.grid[c.y][c.x] = TILE.GYM;
                gymCounter++;
            }
            else if (i % 150 === 75) {
                this.grid[c.y][c.x] = TILE.CITY;
            }
            else if (Math.random() < 0.05 && this.grid[c.y][c.x] === TILE.GRASS) {
                this.grid[c.y][c.x] = TILE.EVENT;
            }
            else if (Math.random() < 0.08 && this.grid[c.y][c.x] === TILE.GRASS) {
                const npcTypes = [TILE.ROCKET, TILE.BIKER, TILE.YOUNG, TILE.OLD];
                this.grid[c.y][c.x] = npcTypes[Math.floor(Math.random() * npcTypes.length)];
            }
        }
        this.grid[0][0] = TILE.CITY;
    }

    static blob(type: number, size: number) {
        const cx = Math.floor(Math.random()*BOARD_SIZE);
        const cy = Math.floor(Math.random()*BOARD_SIZE);
        for(let y=cy-size; y<=cy+size; y++) {
            for(let x=cx-size; x<=cx+size; x++) {
                if(x>=0 && x<BOARD_SIZE && y>=0 && y<BOARD_SIZE) this.grid[y][x] = type;
            }
        }
    }

    static getCoord(i: number): Coord {
        const y = Math.floor(i / BOARD_SIZE);
        let x = i % BOARD_SIZE;
        if (y % 2 !== 0) x = (BOARD_SIZE - 1) - x; 
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
        
        this.openSelectionModal("Escolha seu Pokémon para a batalha!");
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
                    <b>${mon.name}</b><br>
                    <small>HP: ${mon.currentHp}/${mon.maxHp}</small>
                </div>
            `;
            if(!mon.isFainted()) {
                div.onclick = () => {
                    modal.style.display = 'none';
                    this.startRound(mon);
                };
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

        const pMon = this.activeMon;
        const opp = this.opponent;

        // Player UI
        document.getElementById('ply-name')!.innerText = pMon.name;
        (document.getElementById('ply-img') as HTMLImageElement).src = pMon.getSprite();
        document.getElementById('ply-hp')!.style.width = (pMon.currentHp/pMon.maxHp)*100 + "%";
        document.getElementById('ply-hp-text')!.innerText = `${pMon.currentHp}/${pMon.maxHp}`;
        
        // Opponent UI
        document.getElementById('opp-name')!.innerText = opp.name;
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

    static attack() {
        if(!this.activeMon || !this.opponent) return;
        const pMon = this.activeMon;
        let dmg = Math.floor(pMon.atk * (0.9 + Math.random()*0.2));
        if(this.activeCard === 'crit') { dmg *= 2; this.log("💥 CRÍTICO!"); this.activeCard = null; } 
        else { this.log(`${pMon.name} atacou! (${dmg})`); }

        this.opponent.currentHp = Math.max(0, this.opponent.currentHp - dmg);
        this.updateUI();

        if(this.opponent.currentHp <= 0) setTimeout(() => this.win(), 1000);
        else setTimeout(() => this.enemyTurn(), 1000);
    }

    static enemyTurn() {
        if(!this.activeMon || !this.opponent) return;
        const pMon = this.activeMon;
        let dmg = Math.floor(this.opponent.atk * (0.8 + Math.random()*0.2));
        this.log(`${this.opponent.name} bateu! (${dmg})`);
        
        pMon.currentHp = Math.max(0, pMon.currentHp - dmg);
        this.updateUI();

        if(pMon.currentHp <= 0) setTimeout(() => this.handleFaint(), 1000);
    }

    static handleFaint() {
        if(this.player!.isDefeated()) {
            this.lose();
        } else {
            this.log(`${this.activeMon!.name} desmaiou!`);
            document.getElementById('battle-modal')!.style.display = 'none';
            this.openSelectionModal("Escolha o próximo Pokémon!");
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
                    btn.innerHTML = `${item.icon} ${item.name} <span style="background:rgba(0,0,0,0.2); padding:2px 5px; border-radius:4px;">x${this.player!.items[key]}</span>`;
                    btn.onclick = () => this.useItem(key, item);
                    list.appendChild(btn);
                }
            }
        });
        document.getElementById('battle-bag')!.style.display = 'block';
    }

    static useItem(key: string, data: ItemData) {
        document.getElementById('battle-bag')!.style.display = 'none';
        
        if(data.type === 'capture') {
            if(this.isPvP || this.isNPC) { 
                this.log("Não pode roubar de treinador!"); 
                return; 
            }
        }

        this.player!.items[key]--;
        if(data.type === 'heal' && data.val) {
            this.activeMon!.heal(data.val);
            this.log(`Curou ${data.val} HP!`);
            this.updateUI();
            setTimeout(() => this.enemyTurn(), 1000);
        } else if(data.type === 'capture' && data.rate) {
            this.attemptCapture(data.rate);
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
        if(!card) { this.log("Sem cartas de batalha!"); return; }
        this.log(`Usou ${card.icon} ${card.name}!`);
        this.player!.cards.splice(this.player!.cards.indexOf(card), 1);
        Cards.render();
        if(card.id === 'crit') this.activeCard = 'crit';
        if(card.id === 'master') this.activeCard = 'master';
        if(card.id === 'run') { this.end(); }
    }

    static run() {
        if(this.isPvP || this.isNPC) { this.log("Sem fuga desta luta!"); return; }
        if(Math.random()>0.5) this.end(); else { this.log("Falhou!"); setTimeout(()=>this.enemyTurn(),1000); }
    }

    static win() {
        let gain = 150; 
        if(this.isPvP) gain = 500;
        else if(this.isNPC) gain = this.reward;

        this.player!.gold += gain;
        this.log(`Vitória! +${gain} Gold`);
        
        const p = this.activeMon!;
        p.wins++;
        if(p.checkEvolution()) alert(`😲 Seu Pokémon evoluiu para ${p.name}!`);
        
        setTimeout(() => this.end(), 1500);
    }

    static lose() {
        this.log("Derrota Total...");
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
        inv.innerHTML = Object.entries(p.items).map(([k,v]) => {
            const item = SHOP_ITEMS.find(i=>i.id===k);
            const icon = item ? item.icon : '?';
            return `<div style="background:#ddd; padding:5px; border-radius:4px;">${icon} x${v}</div>`;
        }).join('');
        document.getElementById('shop-modal')!.style.display = 'flex';
    }
    static buy(id: string, price: number) {
        const p = Game.getCurrentPlayer();
        if(p.gold >= price) { p.gold -= price; p.items[id]++; this.open(); }
        else alert("Ouro insuficiente!");
    }
}

class Cards {
    static draw(player: Player) {
        const card = CARDS_DB[Math.floor(Math.random()*CARDS_DB.length)];
        player.cards.push(card);
        Game.log(`Ganhou carta: ${card.icon} ${card.name}`);
        this.render();
    }
    static render() {
        const p = Game.getCurrentPlayer();
        const container = document.getElementById('my-cards')!;
        const list = document.getElementById('cards-list')!;
        if(p.cards.length > 0) {
            container.style.display = 'block';
            list.innerHTML = '';
            p.cards.forEach((c, idx) => {
                const div = document.createElement('div');
                div.className = 'card-item';
                div.innerHTML = `<span class="card-icon">${c.icon}</span> <div><b>${c.name}</b><br><small>${c.desc}</small></div>`;
                if(c.type === 'move') {
                    div.onclick = () => {
                        const n = prompt("Escolha 1-20:");
                        if(n) {
                             const num = parseInt(n);
                             if(num>=1 && num<=20) { Game.forcedRoll = num; p.cards.splice(idx,1); this.render(); Game.rollDice(); }
                        }
                    };
                    div.style.border = "2px dashed yellow";
                }
                list.appendChild(div);
            });
        } else container.style.display = 'none';
    }
}

class Game {
    static players: Player[] = [];
    static turn: number = 0;
    static forcedRoll: number | null = null;

    static init(players: Player[]) {
        this.players = players;
        MapSystem.generate();
        this.renderBoard();
        this.updateSidebar();
        this.moveVisuals();
    }

    static getCurrentPlayer(): Player { return this.players[this.turn]; }

    static renderBoard() {
        const area = document.getElementById('board-area')!;
        area.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 1fr)`;
        area.style.gridTemplateRows = `repeat(${BOARD_SIZE}, 1fr)`;
        const frag = document.createDocumentFragment();
        for(let y=0; y<BOARD_SIZE; y++) {
            for(let x=0; x<BOARD_SIZE; x++) {
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
                frag.appendChild(d);
            }
        }
        area.appendChild(frag);
    }

    static moveVisuals() {
        document.querySelectorAll('.player-token').forEach(e => e.remove());
        this.players.forEach((p, idx) => {
            const tile = document.getElementById(`tile-${p.x}-${p.y}`);
            if(tile) {
                const t = document.createElement('div');
                t.className = `player-token ${idx===this.turn?'active-token':''}`;
                t.innerText = p.avatar;
                const colors = ['#e74c3c', '#3498db', '#f1c40f', '#9b59b6'];
                t.style.borderColor = colors[idx % colors.length];
                tile.appendChild(t);
                if(idx===this.turn) tile.scrollIntoView({block:'center',inline:'center',behavior:'smooth'});
            }
        });
    }

    static async rollDice() {
        (document.getElementById('roll-btn') as HTMLButtonElement).disabled = true;
        const die = document.getElementById('d20-display')!;
        
        let result = this.forcedRoll || Math.floor(Math.random()*20)+1;
        this.forcedRoll = null;

        if(!this.forcedRoll) {
            for(let i=0;i<10;i++) { 
                die.innerText = `🎲 ${Math.floor(Math.random()*20)+1}`; 
                await new Promise(r=>setTimeout(r,50)); 
            }
        }
        die.innerText = `🎲 ${result}`;
        this.log(`${this.getCurrentPlayer().name} rolou ${result}.`);
        await this.movePlayer(result);
    }

    static async movePlayer(steps: number) {
        const p = this.getCurrentPlayer();
        for(let i=0; i<steps; i++) {
            const tile = document.getElementById(`tile-${p.x}-${p.y}`)!;
            tile.classList.add('path-highlight');
            if(p.y%2===0) { if(p.x<BOARD_SIZE-1)p.x++; else p.y++; } else { if(p.x>0)p.x--; else p.y++; }
            if(p.y>=BOARD_SIZE){ p.y=BOARD_SIZE-1; break; }
            this.moveVisuals();
            await new Promise(r => setTimeout(r, 80));
            tile.classList.remove('path-highlight');
        }
        this.handleTile(p);
    }

    static handleTile(p: Player) {
        const type = MapSystem.grid[p.y][p.x];
        const enemy = this.players.find(o => o !== p && o.x === p.x && o.y === p.y);
        
        if(enemy) { 
            const defMon = enemy.team.find(m => !m.isFainted());
            if(defMon) {
                Battle.setup(p, defMon, true, enemy.name); 
            } else {
                this.log(`${enemy.name} não pode lutar!`);
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

        if(type === TILE.CITY) { this.log("Cura completa!"); p.team.forEach(m=>m.heal(999)); this.nextTurn(); }
        else if(type === TILE.EVENT) { Cards.draw(p); this.nextTurn(); }
        else if(type === TILE.GYM) { 
            const boss = new Pokemon(150, true); 
            Battle.setup(p, boss, false, "Líder de Ginásio", 1000); 
        }
        else if([TILE.GRASS, TILE.WATER, TILE.GROUND].includes(type) && Math.random()<0.35) {
            let possibleMons = [1, 4, 7, 25];
            if(type === TILE.GROUND) possibleMons = [74, 95];
            const id = possibleMons[Math.floor(Math.random()*possibleMons.length)];
            const isShiny = Math.random()<0.1;
            Battle.setup(p, new Pokemon(id, isShiny), false, "Selvagem");
        } else this.nextTurn();
    }

    static nextTurn() {
        this.turn = (this.turn+1)%this.players.length;
        (document.getElementById('roll-btn') as HTMLButtonElement).disabled = false;
        this.updateSidebar();
        this.moveVisuals();
        Cards.render();
    }

    static updateSidebar() {
        const list = document.getElementById('players-list')!;
        list.innerHTML = '';
        this.players.forEach((p, i) => {
            const active = i===this.turn;
            const miniParty = p.team.map(m => `<img src="${m.getSprite()}" class="pc-mon-icon ${m.isFainted()?'fainted':''}">`).join('');
            
            const div = document.createElement('div');
            div.className = `player-card ${active?'active':''}`;
            
            const itemCount = Object.values(p.items).reduce((a,b)=>a+b, 0);
            const cardCount = p.cards.length;

            div.innerHTML = `
                <div class="pc-header">
                    <span>${p.avatar} <b>${p.name}</b></span>
                    <span style="color:goldenrod;">💰${p.gold}</span>
                </div>
                <div class="pc-stats">
                    <span>🎒 Itens: ${itemCount}</span>
                    <span>🃏 Cartas: ${cardCount}</span>
                </div>
                <div class="pc-team">${miniParty}</div>
            `;
            list.appendChild(div);
        });
        const name = this.getCurrentPlayer().name;
        document.getElementById('turn-indicator')!.innerHTML = `<span style="color:var(--highlight); font-weight:bold;">${name}</span>`;
    }

    static log(msg: string) {
        const el = document.getElementById('game-log')!;
        const time = new Date().toLocaleTimeString().split(':');
        el.innerHTML = `<div style="border-bottom:1px solid #444; padding:2px;">[${time[0]}:${time[1]}] ${msg}</div>` + el.innerHTML;
    }
}

class Setup {
    static updateSlots() {
        const num = parseInt((document.getElementById('num-players') as HTMLSelectElement).value);
        const container = document.getElementById('player-slots-container')!;
        container.innerHTML = '';
        
        const defaults = [
            {name: "Ash", icon: "🧢"},
            {name: "Gary", icon: "🎒"},
            {name: "Misty", icon: "👒"},
            {name: "Brock", icon: "😑"}
        ];

        for(let i=0; i<num; i++) {
            container.innerHTML += `
                <div class="setup-row">
                    <strong>P${i+1}</strong>
                    <input type="text" id="p${i}-name" value="${defaults[i].name}" style="width:100px;">
                    <select id="p${i}-av">
                        <option ${i==0?'selected':''}>🧢</option>
                        <option ${i==1?'selected':''}>🎒</option>
                        <option ${i==2?'selected':''}>👒</option>
                        <option ${i==3?'selected':''}>😑</option>
                        <option>🐯</option>
                        <option>👻</option>
                    </select>
                </div>
            `;
        }
    }

    static start() {
        const num = parseInt((document.getElementById('num-players') as HTMLSelectElement).value);
        const players: Player[] = [];
        for(let i=0; i<num; i++) {
            const name = (document.getElementById(`p${i}-name`) as HTMLInputElement).value;
            const av = (document.getElementById(`p${i}-av`) as HTMLSelectElement).value;
            players.push(new Player(i, name, av));
        }
        
        document.getElementById('setup-screen')!.style.display = 'none';
        document.getElementById('game-container')!.style.display = 'flex';
        Game.init(players);
    }
}

// ==========================================
// 4. INICIALIZAÇÃO & BINDING GLOBAL
// ==========================================

// Expõe as classes no window para o HTML "antigo" funcionar
window.Setup = Setup;
window.Game = Game;
window.Shop = Shop;
window.Battle = Battle;

// Inicia o setup
Setup.updateSlots();