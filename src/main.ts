import './style.css'
// IMPORTAÇÕES DAS CONSTANTES
import { TILE, NPC_DATA, CARDS_DB, SHOP_ITEMS } from './constants'; 
import { POKEDEX } from './constants/pokedex';
import { PLAYER_COLORS } from './constants/playerColors';
import { TRAINER_IMAGES } from './constants/trainerImages';
import { TYPE_CHART } from './constants/typeChart';
import { GYM_DATA } from './constants/gyms';

import type { ItemData, CardData, Coord } from './constants';

// FIREBASE IMPORTS
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, update, Database } from 'firebase/database';

// === CONFIGURAÇÃO DO FIREBASE (INSIRA A SUA AQUI) ===
const firebaseConfig = {
  apiKey: "AIzaSyBdV8_HMXwX7K9IaxWExxK3wzpI2UjfYeM",
  authDomain: "pokemonmasterboard.firebaseapp.com",
  databaseURL: "https://pokemonmasterboard-default-rtdb.firebaseio.com/",
  projectId: "pokemonmasterboard",
  storageBucket: "pokemonmasterboard.firebasestorage.app",
  messagingSenderId: "949731697037",
  appId: "1:949731697037:web:76a03b5b65dc9cf80c5dc4"
};

// Inicializa Firebase com tratamento de erro básico
let app, db: Database;
try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
} catch (e) {
    console.error("Erro ao inicializar Firebase. Verifique a configuração.", e);
}

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
// SETUP (MENU E INICIALIZAÇÃO)
// ==========================================
class Setup {
    static showOfflineSetup() { 
        document.getElementById('menu-phase-1')!.style.display='none'; 
        document.getElementById('menu-phase-setup')!.style.display='block'; 
    }

    static showOnlineMenu() { 
        document.getElementById('menu-phase-1')!.style.display='none'; 
        document.getElementById('menu-phase-online')!.style.display='block';
        
        const sel = document.getElementById('online-avatar-select') as HTMLSelectElement;
        if(sel.options.length === 0) {
            sel.innerHTML = TRAINER_IMAGES.map(img => `<option value="${img.file}">${img.label}</option>`).join('');
        }
        this.updateOnlinePreview();
    }

    static updateOnlinePreview() {
        const sel = document.getElementById('online-avatar-select') as HTMLSelectElement;
        const img = document.getElementById('online-avatar-preview') as HTMLImageElement;
        if (sel && img) {
            img.src = `/assets/img/Treinadores/${sel.value}`;
        }
    }

    static showLobbyUIOnly() {
        document.getElementById('online-lobby-controls')!.style.display = 'none';
        if (!Network.isHost) document.getElementById('host-controls')!.style.display = 'none';
    }

    static showSetupScreen() { 
        document.getElementById('menu-phase-online')!.style.display='none'; 
        document.getElementById('menu-phase-setup')!.style.display='block'; 
    }

    static updateSlots() {
        const n = parseInt((document.getElementById('num-players') as HTMLSelectElement).value);
        const c = document.getElementById('player-slots-container')!; 
        c.innerHTML = '';
        const defs = ["Ash", "Gary", "Misty", "Brock", "May", "Dawn", "Serena", "Goh"];
        
        for(let i=0; i<n; i++) {
            const defImg = TRAINER_IMAGES[i%TRAINER_IMAGES.length].file;
            const opts = TRAINER_IMAGES.map(img => `<option value="${img.file}" ${img.file===defImg?'selected':''}>${img.label}</option>`).join('');
            c.innerHTML += `<div class="setup-row"><strong>P${i+1}</strong><input type="text" id="p${i}-name" value="${defs[i]||'Player'}" style="width:100px;"><div class="avatar-selection"><img id="p${i}-preview" src="/assets/img/Treinadores/${defImg}" class="avatar-preview"><select id="p${i}-av" onchange="window.Setup.updatePreview(${i})">${opts}</select></div></div>`;
        }
    }

    static updatePreview(i: number) { 
        (document.getElementById(`p${i}-preview`) as HTMLImageElement).src = `/assets/img/Treinadores/${(document.getElementById(`p${i}-av`) as HTMLSelectElement).value}`; 
    }
    
    // START OFFLINE
    static start() {
        const n = parseInt((document.getElementById('num-players') as HTMLSelectElement).value);
        const mapSize = parseInt((document.getElementById('map-size') as HTMLSelectElement).value); 
        const ps = [];
        for(let i=0; i<n; i++) {
            ps.push(new Player(i, (document.getElementById(`p${i}-name`) as HTMLInputElement).value, (document.getElementById(`p${i}-av`) as HTMLSelectElement).value));
        }
        document.getElementById('setup-screen')!.style.display='none';
        document.getElementById('game-container')!.style.display='flex';
        Game.init(ps, mapSize);
    }

    // START ONLINE (Apenas Host)
    static async startOnlineGame() {
        if (!Network.isHost) return;
        
        // 1. Host gera o mapa
        const mapSize = parseInt((document.getElementById('online-map-size') as HTMLSelectElement).value);
        MapSystem.generate(mapSize);

        const updateData = {
            status: "PLAYING",
            map: {
                size: mapSize,
                grid: MapSystem.grid,
                gymLocations: MapSystem.gymLocations
            }
        };

        // 2. Envia para o Firebase (Mapa + Status) Atomicamente
        if (db) {
            await update(ref(db, `rooms/${Network.currentRoomId}`), updateData);
        }
    }
}

// ==========================================
// REDE (FIREBASE REALTIME DATABASE)
// ==========================================
class Network {
    static isOnline: boolean = false;
    static isHost: boolean = false;
    static myPlayerId: number = -1;
    static currentRoomId: string = "";
    static localName: string = "";
    static localAvatar: string = "";
    static isListenerActive: boolean = false; // Controle para evitar listeners duplicados
    
    static lobbyPlayers: any[] = [];

    static checkInput(): boolean {
        const nameInput = document.getElementById('online-player-name') as HTMLInputElement;
        const avSelect = document.getElementById('online-avatar-select') as HTMLSelectElement;
        
        if(!nameInput.value) { alert("Digite seu nome primeiro!"); return false; }
        
        this.localName = nameInput.value;
        this.localAvatar = avSelect.value;
        return true;
    }

    // --- CRIAÇÃO DE SALA ---
    static async createRoom() {
        if(!this.checkInput()) return;
        
        const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.currentRoomId = roomCode;
        this.myPlayerId = 0; 
        this.isHost = true;

        const initialData = {
            status: "LOBBY",
            turn: 0,
            mapSize: 20,
            players: {
                0: {
                    name: this.localName,
                    avatar: this.localAvatar,
                    id: 0,
                    x: 0, y: 0,
                    gold: 500,
                    items: {'pokeball':6, 'potion':1},
                    cards: [],
                    team: [],
                    skipTurn: false,
                    badges: [false,false,false,false,false,false,false,false]
                }
            },
            lastAction: { type: "INIT", timestamp: Date.now() }
        };

        await set(ref(db, 'rooms/' + roomCode), initialData);
        
        this.isOnline = true;
        this.setupLobbyListener();
        
        document.getElementById('lobby-status')!.style.display = 'block';
        document.getElementById('lobby-status')!.innerHTML = `Sala Criada: <b>${roomCode}</b><br>Você é o HOST (Player 1)`;
        document.getElementById('host-controls')!.style.display = 'block';
    }

    // --- ENTRAR NA SALA ---
    static async joinRoom() {
        if(!this.checkInput()) return;
        const code = (document.getElementById('room-code-input') as HTMLInputElement).value.toUpperCase();
        if(!code) return alert("Digite o código!");

        const roomRef = ref(db, 'rooms/' + code);
        const snapshot = await get(roomRef);

        if(!snapshot.exists()) return alert("Sala não encontrada!");
        
        const data = snapshot.val();
        if(data.status !== "LOBBY") return alert("Jogo já começou!");

        const players = data.players || {};
        const currentCount = Object.keys(players).length;
        if(currentCount >= 8) return alert("Sala cheia!");

        this.myPlayerId = currentCount;
        this.currentRoomId = code;
        this.isHost = false;

        const newPlayer = {
            name: this.localName,
            avatar: this.localAvatar,
            id: this.myPlayerId,
            x: 0, y: 0,
            gold: 500,
            items: {'pokeball':6, 'potion':1},
            cards: [],
            team: [],
            skipTurn: false,
            badges: [false,false,false,false,false,false,false,false]
        };

        await set(ref(db, `rooms/${code}/players/${this.myPlayerId}`), newPlayer);

        this.isOnline = true;
        this.setupLobbyListener();

        document.getElementById('lobby-status')!.style.display = 'block';
        document.getElementById('lobby-status')!.innerHTML = `Conectado à sala: <b>${code}</b><br>Aguardando Host...`;
        Setup.showLobbyUIOnly();
    }

    // --- LISTENER DO LOBBY ---
    static setupLobbyListener() {
        const playersRef = ref(db, `rooms/${this.currentRoomId}/players`);
        const statusRef = ref(db, `rooms/${this.currentRoomId}/status`);

        onValue(playersRef, (snapshot) => {
            const players = snapshot.val();
            if(!players) return;
            this.lobbyPlayers = Object.values(players);
            
            const list = document.getElementById('online-lobby-list')!;
            list.style.display = 'block';
            list.innerHTML = this.lobbyPlayers.map((p: any) => `
                <div class="lobby-player-item">
                    <img src="/assets/img/Treinadores/${p.avatar}">
                    <span><b>P${p.id + 1}</b>: ${p.name} ${p.id === 0 ? '(HOST)' : ''}</span>
                </div>
            `).join('');
        });

        onValue(statusRef, (snapshot) => {
            const status = snapshot.val();
            if(status === 'PLAYING') {
                this.initializeGameFromFirebase();
            }
        });
    }

    // --- INÍCIO DO JOGO ---
    static async initializeGameFromFirebase() {
        const snapshot = await get(ref(db, `rooms/${this.currentRoomId}`));
        const data = snapshot.val();

        if (data.map) {
            MapSystem.size = data.map.size;
            MapSystem.grid = data.map.grid;
            MapSystem.gymLocations = data.map.gymLocations || {};
        } else {
            console.error("ERRO CRÍTICO: Mapa não sincronizado!");
            return;
        }

        const playerArray = Object.values(data.players).map((pd: any) => {
            const pl = new Player(pd.id, pd.name, pd.avatar);
            if(pd.team && pd.team.length > 0) {
                pl.team = pd.team.map((td: any) => {
                    const po = new Pokemon(td.id, td.isShiny);
                    Object.assign(po, td);
                    return po;
                });
            }
            return pl;
        });

        playerArray.sort((a: Player, b: Player) => a.id - b.id);

        document.getElementById('setup-screen')!.style.display='none';
        document.getElementById('game-container')!.style.display='flex';
        
        Game.init(playerArray, MapSystem.size);
        this.setupGameLoopListener();
    }

    static setupGameLoopListener() {
        if (this.isListenerActive) return; // CORREÇÃO: Evita duplicar listeners
        this.isListenerActive = true;

        // Escuta Ações (Eventos de Animação/Log)
        onValue(ref(db, `rooms/${this.currentRoomId}/lastAction`), (snapshot) => {
            const action = snapshot.val();
            if(!action || action.type === 'INIT') return;
            
            // O timestamp poderia ser verificado aqui para evitar re-execução de ação muito antiga,
            // mas o mais importante é não rodar a ação localmente antes.
            this.handleRemoteAction(action);
        });

        // Escuta Turno
        onValue(ref(db, `rooms/${this.currentRoomId}/turn`), (snapshot) => {
            const turn = snapshot.val();
            if(turn !== null) {
                Game.turn = turn;
                Game.updateHUD();
                Game.checkTurnControl();
            }
        });

        // Escuta Estado dos Jogadores (Sync)
        onValue(ref(db, `rooms/${this.currentRoomId}/players`), (snapshot) => {
            const playersData = snapshot.val();
            if(!playersData) return;

            Object.values(playersData).forEach((pd: any) => {
                const localPlayer = Game.players.find(p => p.id === pd.id);
                if(localPlayer) {
                    localPlayer.x = pd.x;
                    localPlayer.y = pd.y;
                    localPlayer.gold = pd.gold;
                    if(pd.team) {
                        pd.team.forEach((tData: any, idx: number) => {
                            if(localPlayer.team[idx]) Object.assign(localPlayer.team[idx], tData);
                        });
                    }
                }
            });
            Game.updateHUD();
        });
    }

    static handleRemoteAction(action: any) {
        switch(action.type) {
            case 'ROLL':
                Game.animateDice(action.payload.result, action.playerId);
                break;
            case 'MOVE_ANIMATION':
                Game.performVisualStep(action.payload.playerId, action.payload.x, action.payload.y);
                break;
            case 'BATTLE_START':
                Battle.startFromNetwork(action.payload);
                break;
            case 'BATTLE_UPDATE':
                Battle.updateFromNetwork(action.payload);
                break;
            case 'BATTLE_END':
                Battle.end(true);
                break;
            case 'LOG':
                Game.log(action.payload.msg);
                break;
            case 'PLAYER_SYNC':
                const p = Game.players[action.payload.id];
                if (p) {
                    p.x = action.payload.x;
                    p.y = action.payload.y;
                    p.gold = action.payload.gold;
                    if(action.payload.team) {
                        action.payload.team.forEach((tData:any, idx:number) => {
                            if(p.team[idx]) Object.assign(p.team[idx], tData);
                        });
                    }
                    Game.moveVisuals();
                    Game.updateHUD();
                }
                break;
        }
    }

    static sendAction(type: string, payload: any) {
        if(!this.isOnline) return;
        const actionData = {
            type: type,
            payload: payload,
            playerId: this.myPlayerId,
            timestamp: Date.now()
        };
        update(ref(db, `rooms/${this.currentRoomId}`), { lastAction: actionData });
    }

    static syncPlayerState() {
        if(!this.isOnline) return;
        const p = Game.players[this.myPlayerId];
        update(ref(db, `rooms/${this.currentRoomId}/players/${this.myPlayerId}`), {
            x: p.x,
            y: p.y,
            gold: p.gold,
            team: p.team
        });
    }

    static syncTurn(newTurn: number) {
        if(!this.isOnline) return;
        update(ref(db, `rooms/${this.currentRoomId}`), { turn: newTurn });
    }
}

// ==========================================
// CLASSES DO JOGO
// ==========================================
class Pokemon {
    id: number; name: string; type: string;
    maxHp: number; currentHp: number; atk: number; def: number; speed: number;
    level: number; currentXp: number; maxXp: number;
    isShiny: boolean; isLegendary: boolean; wins: number; evoData: any; leveledUpThisTurn: boolean = false;

    constructor(templateId: number, isShiny: boolean = false) {
        const template = POKEDEX.find(p => p.id === templateId) || POKEDEX[0];
        this.id = template.id; this.name = template.name; this.isShiny = isShiny;
        this.type = template.type; this.isLegendary = !!template.isLegendary;
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
                this.id = next.id; this.name = next.name; this.type = next.type;
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
    id: number; name: string; avatar: string; x: number = 0; y: number = 0; gold: number = 500;
    items: {[key:string]:number} = {'pokeball':6, 'potion':1};
    cards: CardData[] = []; team: Pokemon[] = [];
    skipTurn: boolean = false; badges: boolean[] = [false,false,false,false,false,false,false,false];

    constructor(id: number, name: string, avatarFile: string) {
        this.id = id; this.name = name; this.avatar = `/assets/img/Treinadores/${avatarFile}`;
        if(name !== "_LOAD_") {
            const starters = [1, 4, 7, 25]; 
            const randomStarterId = starters[Math.floor(Math.random() * starters.length)];
            const isShiny = Math.random() < 0.05;
            this.team.push(new Pokemon(randomStarterId, isShiny));
        }
    }
    isDefeated() { return this.getBattleTeam(false).length === 0 || this.getBattleTeam(false).every(p => p.isFainted()); }
    getBattleTeam(isGymLimit: boolean) { const limit = isGymLimit ? 6 : 3; return this.team.filter(p => !p.isFainted()).slice(0, limit); }
    resetTurnFlags() { this.team.forEach(p => p.leveledUpThisTurn = false); }
}

class MapSystem {
    static grid: number[][] = []; 
    static size: number = 20; 
    static gymLocations: {[key: string]: number} = {};

    static generate(size: number) {
        this.size = size;
        this.grid = Array(size).fill(0).map(() => Array(size).fill(TILE.GRASS));
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
    static getCoord(i: number): Coord { const y=Math.floor(i/this.size); let x=i%this.size; if(y%2!==0) x=(this.size-1)-x; return {x,y}; }
    static getIndex(x: number, y: number): number { let realX = x; if(y % 2 !== 0) realX = (this.size - 1) - x; return (y * this.size) + realX; }
}

// ==========================================
// BATALHA
// ==========================================
class Battle {
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

    static plyTeamList: Pokemon[] = [];
    static oppTeamList: Pokemon[] = [];
    static pendingCapture: Pokemon | null = null; 

    static isPlayerTurn: boolean = false;  
    static processingAction: boolean = false; 

    static setup(player: Player, enemyMon: Pokemon, isPvP: boolean = false, _label: string = "", reward: number = 0, enemyPlayer: Player | null = null, isGym: boolean = false, gymId: number = 0) {
        this.player = player; this.isPvP = isPvP; this.isNPC = (reward > 0 && !isPvP); this.isGym = isGym; this.gymId = gymId; this.reward = reward; this.activeCard = null; this.enemyPlayer = enemyPlayer;
        this.processingAction = false;
        
        this.plyTeamList = player.getBattleTeam(isGym).slice(0, isGym ? 6 : 3);
        
        if (isPvP && enemyPlayer) {
            this.oppTeamList = enemyPlayer.getBattleTeam(false);
            this.opponent = this.oppTeamList[0];
        } else if (isGym) {
            const gymData = GYM_DATA.find(g => g.id === gymId);
            if(gymData) {
                const allPokemons = Game.players.flatMap(p => p.team);
                const avgLvl = Math.floor(allPokemons.reduce((sum, p) => sum + p.level, 0) / allPokemons.length) + 1;
                this.oppTeamList = gymData.teamIds.map(id => { const p = new Pokemon(id); p.forceLevel(avgLvl); return p; });
                this.opponent = this.oppTeamList[0];
                Game.log(`Desafiando Líder ${gymData.leaderName} (Nvl ${avgLvl})!`);
            } else { this.oppTeamList = [enemyMon]; this.opponent = enemyMon; }
        } else {
            this.oppTeamList = [enemyMon]; this.opponent = enemyMon;
        }
        
        if(this.plyTeamList.length === 0) { alert("Você não tem Pokémons vivos!"); Battle.lose(); return; }
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
        this.determineTurnOrder();
        this.renderBattleScreen();
        
        const enemyId = this.enemyPlayer ? this.enemyPlayer.id : -1;
        if(Network.isOnline && this.player!.id === Network.myPlayerId) {
            Network.sendAction('BATTLE_START', {
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
    }

    static determineTurnOrder() {
        if (!this.activeMon || !this.opponent) return;
        let logMsg = ""; let playerGoesFirst = false;
        if (this.activeMon.speed > this.opponent.speed) { playerGoesFirst = true; logMsg = `💨 ${this.activeMon.name} é mais rápido!`; } 
        else if (this.activeMon.speed < this.opponent.speed) { playerGoesFirst = false; logMsg = `💨 ${this.opponent.name} é mais rápido!`; } 
        else { const roll = Math.floor(Math.random() * 20) + 1; if (roll > 10) { playerGoesFirst = true; logMsg = `🎲 Speed Empatado! Ganhou.`; } else { playerGoesFirst = false; logMsg = `🎲 Speed Empatado! Perdeu.`; } }
        this.isPlayerTurn = playerGoesFirst; this.processingAction = false;
        this.updateButtons(); this.updateUI(); this.logBattle(logMsg);
        if (!this.isPlayerTurn) { this.processingAction = true; this.updateButtons(); setTimeout(() => this.enemyTurn(), 2000); }
    }

    static updateButtons() {
        const btns = document.querySelectorAll('.battle-actions button');
        const isMyBattle = Network.isOnline ? (this.player && this.player.id === Network.myPlayerId) : true;
        const canAct = this.isPlayerTurn && !this.processingAction && isMyBattle;
        btns.forEach((btn: Element) => { (btn as HTMLButtonElement).disabled = !canAct; });
        if(this.isPvP || this.isGym) { const runBtn = document.getElementById('btn-run') as HTMLButtonElement; runBtn.disabled = true; runBtn.title = "Bloqueado"; }
    }

    static startFromNetwork(payload: any) {
        if (!Game.players[payload.pId]) return;
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

    static calculateDamage(attacker: Pokemon, defender: Pokemon): { damage: number, msg: string } {
        const d20 = Math.floor(Math.random() * 20) + 1;
        let rollModifier = 0; let isCritical = false;
        if (d20 <= 2) rollModifier = -2; else if (d20 <= 5) rollModifier = -1; else if (d20 <= 10) rollModifier = 0; else if (d20 <= 15) rollModifier = +1; else if (d20 <= 19) rollModifier = +2; else { rollModifier = +3; isCritical = true; }
        let defenseVal = defender.def; if (isCritical) defenseVal = Math.floor(defenseVal / 2);
        let base = Math.floor((attacker.atk / 5) - (defenseVal / 20)); base = Math.max(1, base);
        let rawMulti = 1; if (TYPE_CHART[attacker.type] && TYPE_CHART[attacker.type][defender.type] !== undefined) { rawMulti = TYPE_CHART[attacker.type][defender.type]; }
        let finalMulti = 1; if (rawMulti > 1) finalMulti = 1.5; else if (rawMulti < 1) finalMulti = 0.75; 
        const typeDamage = Math.floor(base * finalMulti); const finalDamage = Math.max(0, typeDamage + rollModifier);
        let logDetails = `(🎲${d20})`; if (isCritical) logDetails += " 💥!"; if (finalMulti > 1) logDetails += " 🔥!"; if (finalMulti < 1) logDetails += " 🛡️.";
        return { damage: finalDamage, msg: logDetails };
    }

    static attack() {
        if(!this.activeMon || !this.opponent) return; if (!this.isPlayerTurn || this.processingAction) return;
        this.processingAction = true; this.updateButtons();
        let calc = this.calculateDamage(this.activeMon, this.opponent); let dmg = calc.damage;
        if(this.activeCard === 'crit') { dmg *= 2; this.logBattle("🃏 Crítico (x2)!"); this.activeCard = null; } 
        this.opponent.currentHp = Math.max(0, this.opponent.currentHp - dmg);
        const logMsg = `${this.activeMon.name} atacou! 💥${dmg} ${calc.msg}`; this.logBattle(logMsg); this.updateUI();
        if(Network.isOnline) { Network.sendAction('BATTLE_UPDATE', { plyHp: this.activeMon.currentHp, oppHp: this.opponent.currentHp, msg: logMsg }); }
        if(this.opponent.currentHp <= 0) { setTimeout(() => { this.checkWinCondition(); this.processingAction = false; }, 1000); } 
        else { this.isPlayerTurn = false; this.updateButtons(); setTimeout(() => this.enemyTurn(), 2000); }
    }

    static enemyTurn() {
        if(!this.activeMon || !this.opponent) return; this.processingAction = true; this.isPlayerTurn = false; 
        let calc = this.calculateDamage(this.opponent, this.activeMon); let dmg = calc.damage;
        this.activeMon.currentHp = Math.max(0, this.activeMon.currentHp - dmg);
        const logMsg = `${this.opponent.name} atacou! 💥${dmg} ${calc.msg}`; this.logBattle(logMsg); this.updateUI();
        if(Network.isOnline && this.player && this.player.id === Network.myPlayerId) { Network.sendAction('BATTLE_UPDATE', { plyHp: this.activeMon.currentHp, oppHp: this.opponent.currentHp, msg: logMsg }); }
        if(this.activeMon.currentHp <= 0) { setTimeout(() => { this.handleFaint(); }, 1000); } 
        else { this.isPlayerTurn = true; this.processingAction = false; this.updateButtons(); }
    }

    static checkWinCondition() {
        const nextOpp = this.oppTeamList.find(p => !p.isFainted());
        if (nextOpp) { this.opponent = nextOpp; this.logBattle(`Rival enviou ${nextOpp.name}!`); this.determineTurnOrder(); } else { this.win(); }
    }

    static handleFaint() {
        const nextPly = this.plyTeamList.find(p => !p.isFainted());
        if (nextPly) { this.logBattle(`${this.activeMon!.name} desmaiou!`); document.getElementById('battle-modal')!.style.display = 'none'; this.openSelectionModal("Escolha o próximo!"); } else { this.lose(); }
    }

    static logBattle(msg: string) { document.getElementById('battle-msg')!.innerText = msg; Game.log(`[Batalha] ${msg}`); }
    static getHpColor(current: number, max: number) { const pct = (current / max) * 100; if(pct > 50) return 'hp-green'; if(pct > 10) return 'hp-yellow'; return 'hp-red'; }
    
    static updateUI() {
        if(!this.activeMon || !this.opponent) return; if(!this.player) return;
        document.getElementById('ply-name')!.innerText = this.activeMon.name;
        document.getElementById('ply-lvl')!.innerText = `Lv.${this.activeMon.level}`;
        (document.getElementById('ply-img') as HTMLImageElement).src = this.activeMon.getSprite();
        const plyPct = (this.activeMon.currentHp/this.activeMon.maxHp)*100;
        const plyBar = document.getElementById('ply-hp')!; plyBar.style.width = plyPct + "%"; plyBar.className = `hp-fill ${this.getHpColor(this.activeMon.currentHp, this.activeMon.maxHp)}`;
        document.getElementById('ply-hp-text')!.innerText = `${this.activeMon.currentHp}/${this.activeMon.maxHp}`;
        (document.getElementById('ply-trainer-img') as HTMLImageElement).src = this.player.avatar;

        document.getElementById('opp-name')!.innerText = this.opponent.name;
        document.getElementById('opp-lvl')!.innerText = `Lv.${this.opponent.level}`;
        (document.getElementById('opp-img') as HTMLImageElement).src = this.opponent.getSprite();
        const oppPct = (this.opponent.currentHp/this.opponent.maxHp)*100;
        const oppBar = document.getElementById('opp-hp')!; oppBar.style.width = oppPct + "%"; oppBar.className = `hp-fill ${this.getHpColor(this.opponent.currentHp, this.opponent.maxHp)}`;
        document.getElementById('opp-hp-text')!.innerText = `${this.opponent.currentHp}/${this.opponent.maxHp}`;
        
        const oppTrainer = document.getElementById('opp-trainer-img') as HTMLImageElement;
        if(this.isPvP && this.enemyPlayer) { oppTrainer.src = this.enemyPlayer.avatar; oppTrainer.style.display = 'block'; } 
        else if (this.isGym) { const gData = GYM_DATA.find(g => g.id === this.gymId); if(gData) oppTrainer.src = `/assets/img/LideresGym/${gData.leaderImg}`; oppTrainer.style.display = 'block'; }
        else if (this.isNPC) { oppTrainer.src = '/assets/img/Treinadores/Red.jpg'; oppTrainer.style.display = 'block'; } else { oppTrainer.style.display = 'none'; }

        if(!this.isNPC && !this.isGym && !this.isPvP) { document.getElementById('ply-team-indicator')!.innerHTML = ''; document.getElementById('opp-team-indicator')!.innerHTML = ''; } else { this.renderTeamIcons('ply-team-indicator', this.plyTeamList); this.renderTeamIcons('opp-team-indicator', this.oppTeamList); }
    }

    static renderTeamIcons(elId: string, list: Pokemon[]) { document.getElementById(elId)!.innerHTML = list.map(p => `<div class="ball-icon ${p.isFainted() ? 'lost' : ''}"></div>`).join(''); }
    static updateFromNetwork(payload: any) { if(!this.activeMon || !this.opponent) return; this.activeMon.currentHp = payload.plyHp; this.opponent.currentHp = payload.oppHp; this.logBattle(payload.msg); this.updateUI(); }
    
    static win() {
        if(Network.isOnline && Game.turn !== Network.myPlayerId && Network.myPlayerId !== 0) return;
        let gain = 0; let xpGain = 0; let msg = "VITÓRIA! ";
        if(this.isPvP) xpGain = 15; else if(this.isGym) xpGain = 25; else if(this.isNPC) xpGain = 10; else xpGain = 5; 
        if (this.opponent!.level >= this.activeMon!.level + 2) { xpGain += 5; msg += "(+Bônus Desafio) "; }
        if(this.isPvP && this.enemyPlayer) { if(this.enemyPlayer.gold > 0) { gain = Math.floor(this.enemyPlayer.gold * 0.3); this.enemyPlayer.gold -= gain; msg += `Roubou ${gain}G!`; } else { gain = 100; this.enemyPlayer.skipTurn = true; msg += `Inimigo falido (Perde vez)!`; } this.enemyPlayer.x = 0; this.enemyPlayer.y = 0; this.enemyPlayer.team.forEach(p => p.heal(999)); this.enemyPlayer.skipTurn = true; Game.log(`[PvP] ${this.enemyPlayer.name} voltou ao início.`); } 
        else if (this.isGym) { gain = 1000; if (!this.player!.badges[this.gymId - 1]) { this.player!.badges[this.gymId - 1] = true; msg += ` Insígnia ${this.gymId}!`; } }
        else if (this.isNPC) { gain = this.reward; } else { gain = 150; }
        this.player!.gold += gain; this.activeMon!.gainXp(xpGain, this.player!);
        if(Network.isOnline) Network.syncPlayerState();
        alert(msg); Game.log(msg); setTimeout(() => this.end(false), 1000);
    }

    static lose() {
        let msg = "DERROTA... "; this.player!.gold = Math.max(0, this.player!.gold - 100); this.player!.team.forEach(p => p.heal(999)); this.player!.x = 0; this.player!.y = 0; this.player!.skipTurn = true;
        let xpGain = 0; if(this.isPvP) xpGain = 5; else if(this.isGym) xpGain = 8; else if(this.isNPC) xpGain = 3; else xpGain = 2; 
        if(this.activeMon) this.activeMon.gainXp(xpGain, this.player!);
        if (this.isPvP && this.enemyPlayer) { this.enemyPlayer.team[0].gainXp(15, this.enemyPlayer); msg += ` ${this.enemyPlayer.name} venceu!`; } 
        if(Network.isOnline) { Network.sendAction('PLAYER_SYNC', { id: this.player!.id, x: 0, y: 0, gold: this.player!.gold, team: this.player!.team }); Network.syncPlayerState(); }
        alert(msg); Game.log(msg); setTimeout(() => { this.end(false); Game.moveVisuals(); }, 1500);
    }

    static end(isRemote: boolean) { this.active = false; document.getElementById('battle-modal')!.style.display = 'none'; if(!isRemote) { if(Network.isOnline) Network.sendAction('BATTLE_END', {}); Game.nextTurn(); } }
    
    static openBag() { if (!this.isPlayerTurn || this.processingAction) return; const list = document.getElementById('battle-bag-list')!; list.innerHTML = ''; Object.keys(this.player!.items).forEach(key => { if(this.player!.items[key] > 0) { const item = SHOP_ITEMS.find(i => i.id === key); if(item) { const btn = document.createElement('button'); btn.className = 'btn'; btn.innerHTML = `<img src="/assets/img/Itens/${item.icon}" class="item-icon-mini"> ${item.name} x${this.player!.items[key]}`; btn.onclick = () => this.useItem(key, item); list.appendChild(btn); } } }); document.getElementById('battle-bag')!.style.display = 'block'; }
    static useItem(key: string, data: ItemData) { document.getElementById('battle-bag')!.style.display = 'none'; if(data.type === 'capture' && (this.isPvP || this.isNPC || this.isGym)) { alert("Não pode capturar pokémons de treinadores!"); return; } this.player!.items[key]--; this.processingAction = true; this.updateButtons(); if(data.type === 'heal') { this.activeMon!.heal(data.val!); this.logBattle("Usou item de cura!"); this.updateUI(); if(Network.isOnline) Network.sendAction('BATTLE_UPDATE', { plyHp: this.activeMon!.currentHp, oppHp: this.opponent!.currentHp, msg: "Usou Cura!" }); setTimeout(() => this.enemyTurn(), 1500); } else if(data.type === 'capture') { this.attemptCapture(data.rate!); } if(Network.isOnline) Network.syncPlayerState(); }
    static attemptCapture(rate: number) { if(!this.opponent) return; const chance = ((1 - (this.opponent.currentHp/this.opponent.maxHp)) * rate) + 0.2; setTimeout(() => { if(Math.random() < chance) { this.logBattle(`✨ Capturou ${this.opponent!.name}!`); this.activeMon!.gainXp(3, this.player!); if(this.player!.team.length < 6) { this.player!.team.push(this.opponent!); setTimeout(() => this.end(false), 1500); } else { this.pendingCapture = this.opponent; this.openSwapModal(); } } else { this.logBattle("Escapou!"); setTimeout(() => this.enemyTurn(), 1000); } }, 1000); }
    static openSwapModal() { Game.openSwapModal(this.pendingCapture!); }
    static openCardSelection() { if (!this.isPlayerTurn || this.processingAction) return; const list = document.getElementById('battle-cards-list')!; list.innerHTML = ''; const battleCards = this.player!.cards.filter(c => c.type === 'battle'); if(battleCards.length === 0) { list.innerHTML = "<em>Sem cartas de batalha.</em>"; } else { battleCards.forEach(c => { const d = document.createElement('div'); d.className='card-item'; d.innerHTML = `<div class="card-info"><span class="card-name">${c.icon} ${c.name} <span class="card-type-badge type-battle">BATTLE</span></span><span class="card-desc">${c.desc}</span></div><button class="btn-use-card" onclick="window.Battle.useCard('${c.id}')">USAR</button>`; list.appendChild(d); }); } document.getElementById('battle-cards-modal')!.style.display = 'flex'; }
    static useCard(cardId: string) { document.getElementById('battle-cards-modal')!.style.display = 'none'; const cardIndex = this.player!.cards.findIndex(c => c.id === cardId); if(cardIndex === -1) return; const card = this.player!.cards[cardIndex]; if (card.id === 'run') { this.player!.cards.splice(cardIndex, 1); this.logBattle("Usou Carta de Fuga!"); this.activeMon!.gainXp(2, this.player!); this.end(false); } else if (card.id === 'crit') { this.player!.cards.splice(cardIndex, 1); this.activeCard = 'crit'; this.logBattle("Usou Ataque Crítico! Próximo ataque x2."); } else { this.player!.cards.splice(cardIndex, 1); this.activeCard = card.id; this.logBattle(`Usou ${card.name}!`); } if(Network.isOnline) Network.syncPlayerState(); }
    static run() { if(this.isPvP || this.isNPC || this.isGym) { alert("Não pode fugir!"); } else { this.activeMon!.gainXp(2, this.player!); this.end(false); } }
}

class Shop {
    static open() { const p = Game.getCurrentPlayer(); document.getElementById('shop-gold')!.innerText = p.gold.toString(); const list = document.getElementById('shop-items-list')!; list.innerHTML = ''; SHOP_ITEMS.forEach(item => { const div = document.createElement('div'); div.className = 'shop-item'; div.innerHTML = `<div style="display:flex; align-items:center;"><img src="/assets/img/Itens/${item.icon}" class="item-icon-mini"><span>${item.name}</span></div><button class="btn" style="width:auto" onclick="window.Shop.buy('${item.id}', ${item.price})">${item.price}</button>`; list.appendChild(div); }); document.getElementById('shop-modal')!.style.display = 'flex'; }
    static buy(id: string, price: number) { const p = Game.getCurrentPlayer(); if(p.gold >= price) { p.gold -= price; p.items[id]++; this.open(); Game.updateHUD(); if(Network.isOnline) Network.syncPlayerState(); } }
    static close() { document.getElementById('shop-modal')!.style.display = 'none'; if(Game.isCityEvent) { Game.isCityEvent = false; Game.nextTurn(); } }
}

class Cards {
    static draw(player: Player) { const card = CARDS_DB[Math.floor(Math.random()*CARDS_DB.length)]; player.cards.push(card); Game.log(`Ganhou carta: ${card.icon} ${card.name}`); Game.updateHUD(); if(Network.isOnline) Network.syncPlayerState(); }
    static showPlayerCards(playerId: number) { Game.openBoardCards(playerId); }
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
        
        // Se grid vazio (offline ou novo host), gera. Se vier do firebase, já está populado.
        if(MapSystem.grid.length === 0) {
            MapSystem.generate(mapSize);
        }

        if(Network.isOnline && Network.isHost) {
            if(db) update(ref(db, `rooms/${Network.currentRoomId}`), {
                grid: MapSystem.grid,
                gymLocations: MapSystem.gymLocations
            });
        }

        this.renderBoard(); 
        this.updateHUD(); 
        this.moveVisuals(); 
        this.checkTurnControl(); 
        this.renderDebugPanel(); 
    }
    
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

    static openCardLibrary() { const list = document.getElementById('library-list')!; list.innerHTML = ''; CARDS_DB.forEach(c => { const d = document.createElement('div'); d.className = 'card-item'; const typeClass = c.type === 'move' ? 'type-move' : 'type-battle'; const typeLabel = c.type === 'move' ? 'MOVE' : 'BATTLE'; d.innerHTML = `<div class="card-info"><span class="card-name">${c.icon} ${c.name} <span class="card-type-badge ${typeClass}">${typeLabel}</span></span><span class="card-desc">${c.desc}</span></div>`; list.appendChild(d); }); document.getElementById('library-modal')!.style.display = 'flex'; }
    static openXpRules() { document.getElementById('xp-rules-modal')!.style.display = 'flex'; }
    static openBoardCards(pId: number) { if(Network.isOnline && pId !== Network.myPlayerId) return alert("Privado!"); const p = this.players[pId]; const list = document.getElementById('board-cards-list')!; list.innerHTML = ''; if(p.cards.length === 0) list.innerHTML = "<em>Sem cartas.</em>"; const isMyTurn = this.canAct() && this.turn === pId; const canUseMove = isMyTurn && !this.hasRolled; p.cards.forEach(c => { const d = document.createElement('div'); d.className = 'card-item'; const typeClass = c.type === 'move' ? 'type-move' : 'type-battle'; const typeLabel = c.type === 'move' ? 'MOVE' : 'BATTLE'; let actionBtn = ''; if (c.type === 'move') { if (canUseMove) actionBtn = `<button class="btn-use-card" onclick="window.Game.useBoardCard('${c.id}')">USAR</button>`; else actionBtn = `<button class="btn-use-card" disabled title="Só antes de rolar">USAR</button>`; } else { actionBtn = `<button class="btn-use-card" disabled style="background:#555" title="Só em batalha">BATTLE</button>`; } d.innerHTML = `<div class="card-info"><span class="card-name">${c.icon} ${c.name} <span class="card-type-badge ${typeClass}">${typeLabel}</span></span><span class="card-desc">${c.desc}</span></div>${actionBtn}`; list.appendChild(d); }); document.getElementById('board-cards-modal')!.style.display = 'flex'; }
    static useBoardCard(cardId: string) { const p = this.getCurrentPlayer(); const cardIndex = p.cards.findIndex(c => c.id === cardId); if (cardIndex === -1) return; const card = p.cards[cardIndex]; if (card.id === 'bike') { p.cards.splice(cardIndex, 1); document.getElementById('board-cards-modal')!.style.display = 'none'; this.log(`${p.name} usou Bicicleta!`); if(Network.isOnline) { Network.sendAction('ROLL', { result: 5 }); return; } this.hasRolled = true; this.animateDice(5, 0); } else if (card.id === 'teleport') { p.cards.splice(cardIndex, 1); document.getElementById('board-cards-modal')!.style.display = 'none'; this.log(`${p.name} usou Teleporte!`); p.x = 0; p.y = 0; this.moveVisuals(); this.handleTile(p); } else { alert("Efeito não implementado na demo."); } if(Network.isOnline) Network.syncPlayerState(); }
    static debugMove() { if(!this.canAct()) return; const input = document.getElementById('debug-input') as HTMLInputElement; const result = parseInt(input.value) || 1; this.log(`[DEBUG] Forçando ${result} passos.`); if(Network.isOnline) { Network.sendAction('ROLL', { result: result }); return; } this.animateDice(result, 0); }
    static moveVisuals() { this.players.forEach((p, idx) => { const currentTile = document.getElementById(`tile-${p.x}-${p.y}`); if(!currentTile) return; let token = document.getElementById(`p-token-${idx}`); if (token && token.parentElement === currentTile) { if(idx === this.turn) token.classList.add('active-token'); else token.classList.remove('active-token'); return; } if (token) token.remove(); const t = document.createElement('div'); t.id = `p-token-${idx}`; t.className = `player-token ${idx===this.turn?'active-token':''}`; t.style.backgroundImage = `url('${p.avatar}')`; t.style.borderColor = PLAYER_COLORS[idx % PLAYER_COLORS.length]; if(MapSystem.size >= 30) { t.style.width = '90%'; t.style.height = '90%'; } currentTile.appendChild(t); if(idx===this.turn) currentTile.scrollIntoView({block:'center',inline:'center',behavior:'smooth'}); }); }
    static async rollDice() { if(!this.canAct() || this.hasRolled) return; this.hasRolled = true; const result = Math.floor(Math.random()*20)+1; if(Network.isOnline) { Network.sendAction('ROLL', { result: result }); return; } this.animateDice(result, Network.isOnline ? Network.myPlayerId : this.turn); }
    static async animateDice(result: number, playerId: number) { const die = document.getElementById('d20-display')!; for(let i=0;i<5;i++) { die.innerText = `🎲 ${Math.floor(Math.random()*20)+1}`; await new Promise(r=>setTimeout(r,50)); } die.innerText = `🎲 ${result}`; if(Network.isOnline) { const currentPlayerName = this.players[playerId].name; if(playerId === Network.myPlayerId) { this.log(`${currentPlayerName} tirou ${result}`); Network.sendAction('LOG', { msg: `${currentPlayerName} tirou ${result}` }); } } else { this.log(`${this.players[this.turn].name} tirou ${result}`); } const p = this.players[playerId]; if(p.team.length > 0) { const luckyMon = p.team[Math.floor(Math.random() * p.team.length)]; luckyMon.gainXp(1, p); } this.movePlayerLogic(result, playerId); }
    
    static async movePlayerLogic(steps: number, pId: number) {
        const p = this.players[pId]; const totalTiles = MapSystem.size * MapSystem.size;
        for(let i=0; i<steps; i++) {
            let currentIdx = MapSystem.getIndex(p.x, p.y); currentIdx++;
            if (currentIdx >= totalTiles) { currentIdx = 0; p.gold += 200; Cards.draw(p); this.log(`🚩 ${p.name} completou uma volta! Ganhou 200G e 1 Carta!`); }
            const nextCoord = MapSystem.getCoord(currentIdx); p.x = nextCoord.x; p.y = nextCoord.y;
            this.performVisualStep(pId, p.x, p.y); await new Promise(r => setTimeout(r, 150));
        }
        if (!Network.isOnline || (Network.isOnline && pId === Network.myPlayerId)) { this.handleTile(p); if(Network.isOnline) Network.syncPlayerState(); }
    }

    static performVisualStep(pId: number, x: number, y: number) { const p = this.players[pId]; if(!p) return; p.x = x; p.y = y; const tile = document.getElementById(`tile-${x}-${y}`); if(tile) { tile.classList.add('step-highlight'); this.moveVisuals(); setTimeout(() => tile.classList.remove('step-highlight'), 300); } }
    static handleTile(p: Player) {
        const type = MapSystem.grid[p.y][p.x];
        const enemy = this.players.find(o => o !== p && o.x === p.x && o.y === p.y);
        if(enemy) { const defMon = enemy.team.find(m => !m.isFainted()); if(defMon) { this.log(`⚔️ Conflito! ${p.name} vs ${enemy.name}`); Battle.setup(p, defMon, true, enemy.name, 0, enemy); } else { this.log(`${enemy.name} sem pokemons!`); this.nextTurn(); } return; }
        if(NPC_DATA[type]) { const npc = NPC_DATA[type]; const monId = npc.team[Math.floor(Math.random() * npc.team.length)]; Battle.setup(p, new Pokemon(monId), false, npc.name, npc.gold); return; }
        if(type === TILE.CITY) { this.isCityEvent = true; document.getElementById('city-modal')!.style.display='flex'; }
        else if(type === TILE.EVENT) { if(Math.random() < 0.5) { Cards.draw(p); } else { const gift = Math.random() > 0.5 ? 'pokeball' : 'potion'; p.items[gift]++; this.log(`Achou ${gift}!`); this.updateHUD(); if(Network.isOnline) Network.syncPlayerState(); } this.nextTurn(); }
        else if(type === TILE.GYM) { const gymId = MapSystem.gymLocations[`${p.x},${p.y}`] || 1; if (!p.badges[gymId-1]) { const boss = new Pokemon(150, true); Battle.setup(p, boss, false, "Líder de Ginásio", 1000, null, true, gymId); } else { this.log("Você já venceu este ginásio!"); this.nextTurn(); } }
        else if([TILE.GRASS, TILE.WATER, TILE.GROUND].includes(type) && Math.random() < 0.8) { let possibleMons = [1, 4, 7, 25]; if(type === TILE.GROUND) possibleMons = [74, 95]; const id = possibleMons[Math.floor(Math.random()*possibleMons.length)]; Battle.setup(p, new Pokemon(id, Math.random()<0.1), false, "Selvagem"); } 
        else { this.nextTurn(); }
    }
    static handleCityChoice(c: string) { if(c==='heal') { this.getCurrentPlayer().team.forEach(p=>p.heal(999)); this.isCityEvent=false; if(Network.isOnline) Network.syncPlayerState(); this.nextTurn(); } else Shop.open(); document.getElementById('city-modal')!.style.display='none'; }
    static nextTurn() {
        this.saveGame(); this.turn = (this.turn+1)%this.players.length; this.hasRolled = false; 
        if(Network.isOnline) { Network.syncTurn(this.turn); }
        const nextP = this.players[this.turn];
        if(nextP.skipTurn) { nextP.skipTurn = false; this.log(`${nextP.name} perdeu a vez!`); alert(`${nextP.name} perdeu a vez!`); if(Network.isOnline) Network.syncPlayerState(); this.nextTurn(); return; }
        this.updateHUD(); this.moveVisuals(); this.checkTurnControl();
    }
    static checkTurnControl() { const btn = document.getElementById('roll-btn') as HTMLButtonElement; const me = Network.myPlayerId; const ind = document.getElementById('online-indicator'); if(Network.isOnline) { if(ind) ind.innerText = "FIREBASE"; if (this.turn === me) { btn.disabled = false; btn.innerText = "ROLAR"; } else { btn.disabled = true; btn.innerText = `Vez de ${this.players[this.turn].name}`; } } else { if(ind) ind.innerText = "OFFLINE"; btn.disabled = false; } }
    static canAct() { if(!Network.isOnline) return true; return this.turn === Network.myPlayerId; }
    static getSaveData() { return { players: this.players, turn: this.turn, mapSize: MapSystem.size, grid: MapSystem.grid, gymLoc: MapSystem.gymLocations }; }
    static saveGame() { localStorage.setItem('pk_save', JSON.stringify(this.getSaveData())); }
    static loadGame() { const json=localStorage.getItem('pk_save'); if(json) this.loadGameFromData(JSON.parse(json)); }
    static loadGameFromData(d: any) { 
        MapSystem.size=d.mapSize; MapSystem.grid=d.grid; MapSystem.gymLocations=d.gymLoc || {};
        this.players = d.players.map((pd:any) => { const file = pd.avatar.split('/').pop(); const pl = new Player(pd.id, pd.name, file); Object.assign(pl, pd); pl.avatar = `/assets/img/Treinadores/${file}`; pl.team = pd.team.map((td:any) => { const po=new Pokemon(td.id, td.isShiny); Object.assign(po, td); return po; }); return pl; });
        this.turn = d.turn; document.getElementById('setup-screen')!.style.display='none'; document.getElementById('game-container')!.style.display='flex';
        Game.init(this.players, d.mapSize);
    }
    static exportSave() { const d = localStorage.getItem('pk_save'); if(!d)return alert("Vazio"); const b = new Blob([d], {type:'text/plain'}); const a = document.createElement('a'); a.href=URL.createObjectURL(b); a.download='save.txt'; a.click(); }
    static importSave(i: HTMLInputElement) { const f = i.files?.[0]; if(!f)return; const r = new FileReader(); r.onload=e=>{ localStorage.setItem('pk_save', e.target?.result as string); this.loadGame(); }; r.readAsText(f); }
    static openInventoryModal(pId: number) { const p = this.players[pId]; const list = document.getElementById('board-inventory-list')!; list.innerHTML = ''; const canUse = (this.canAct() && this.turn === pId); Object.keys(p.items).forEach(key => { if(p.items[key] > 0) { const item = SHOP_ITEMS.find(i => i.id === key); if(item) { const d = document.createElement('div'); d.className='shop-item'; let btnHTML = ''; if(canUse && item.type === 'heal') { btnHTML = `<button class="btn btn-mini" style="width:auto;" onclick="window.Game.useItemBoard('${key}', ${pId})">Usar</button>`; } d.innerHTML = `<div style="display:flex; align-items:center;"><img src="/assets/img/Itens/${item.icon}" class="item-icon-mini"><span>${item.name} x${p.items[key]}</span></div>${btnHTML}`; list.appendChild(d); } } }); document.getElementById('board-inventory-modal')!.style.display='flex'; }
    static useItemBoard(key: string, pId: number) { const p = this.players[pId]; const item = SHOP_ITEMS.find(i => i.id === key); if(p.items[key] > 0 && item?.type === 'heal') { p.items[key]--; const mon = p.team.find(m => !m.isFainted()); if(mon) { mon.heal(item.val || 20); alert(`Usou ${item.name} em ${mon.name}!`); this.updateHUD(); this.openInventoryModal(pId); this.saveGame(); if(Network.isOnline) { Network.sendAction('LOG', { msg: `${p.name} usou ${item.name}.` }); Network.syncPlayerState(); } } else { alert("Todos desmaiados!"); } } }
    static openSwapModal(newMon: Pokemon) { const modal = document.getElementById('swap-modal')!; const list = document.getElementById('swap-list')!; list.innerHTML = ''; const p = this.getCurrentPlayer(); p.team.forEach((currP, idx) => { const div = document.createElement('div'); div.className = 'swap-item'; div.innerHTML = `<img src="${currP.getSprite()}"> <b>${currP.name}</b> Lv.${currP.level}`; div.onclick = () => this.executeSwap(idx, newMon); list.appendChild(div); }); const divNew = document.createElement('div'); divNew.className = 'swap-item new-mon'; divNew.innerHTML = `<img src="${newMon.getSprite()}"> <b>${newMon.name} (NOVO)</b> Lv.${newMon.level} <br><small>Clique para descartar este</small>`; divNew.onclick = () => this.executeSwap(-1, newMon); list.appendChild(divNew); modal.style.display = 'block'; }
    static executeSwap(indexToRelease: number, newMon: Pokemon) { const p = this.getCurrentPlayer(); if (indexToRelease === -1) { this.log(`Libertou ${newMon.name}.`); } else { const released = p.team[indexToRelease]; this.log(`Libertou ${released.name} e ficou com ${newMon.name}!`); p.team[indexToRelease] = newMon; } document.getElementById('swap-modal')!.style.display = 'none'; Game.updateHUD(); setTimeout(() => Battle.end(false), 500); if(Network.isOnline) Network.syncPlayerState(); }
    static updateHUD() { const left = document.getElementById('hud-col-left')!; left.innerHTML = ''; const right = document.getElementById('hud-col-right')!; right.innerHTML = ''; if (!this.players || this.players.length === 0) return; this.players.forEach((p,i) => { const d = document.createElement('div'); d.className = `player-slot ${i===this.turn?'active':''}`; let badgeHTML = '<div class="badges-container">'; for(let b=0; b<8; b++) { const isActive = p.badges[b]; const gData = GYM_DATA.find(g => g.id === b+1); const imgUrl = gData ? `/assets/img/Insignias/${gData.badgeImg}` : ''; const style = isActive ? `background-image: url('${imgUrl}'); background-size: 100% 100%; background-repeat: no-repeat; background-color: transparent;` : `background-color: #ccc;`; badgeHTML += `<div class="badge-slot ${isActive?'active':''}" style="${style}" title="Insígnia ${b+1}"></div>`; } badgeHTML += '</div>'; const th = p.team.map(m => { let auraClass = ''; if (m.isShiny) auraClass = 'aura-shiny'; else if (m.isLegendary) auraClass = 'aura-legendary'; return ` <div class="poke-card ${m.isFainted() ? 'fainted' : ''}"> <img src="${m.getSprite()}" class="poke-card-img ${auraClass}"> <div class="poke-card-info"> <div class="poke-header"> <span>${m.name}</span> <span class="poke-lvl">Lv.${m.level}</span> </div> <div class="bar-container" title="HP"> <div class="bar-fill ${Battle.getHpColor(m.currentHp, m.maxHp)}" style="width:${(m.currentHp/m.maxHp)*100}%"></div> <div class="bar-text">${m.currentHp}/${m.maxHp}</div> </div> <div class="bar-container" title="XP"><div class="bar-fill xp-bar" style="width:${(m.currentXp/m.maxXp)*100}%"></div></div> <div class="poke-stats"> <div class="stat-item">⚔️${m.atk}</div> <div class="stat-item">🛡️${m.def}</div> <div class="stat-item">💨${m.speed}</div> </div> </div> </div>`; }).join(''); d.innerHTML = ` <div class="hud-header"><div class="hud-name-group"><img src="${p.avatar}" class="hud-avatar-img"><span>${p.name}</span></div><div>💰${p.gold}</div></div> ${badgeHTML} <div class="hud-team">${th}</div> <div class="hud-actions"><button class="btn btn-secondary btn-mini" onclick="window.openInventory(${i})">🎒</button><button class="btn btn-secondary btn-mini" onclick="window.openCards(${i})">🃏</button></div>`; if(i < Math.ceil(this.players.length/2)) left.appendChild(d); else right.appendChild(d); }); const turnPlayer = this.players[this.turn]; if (turnPlayer) document.getElementById('turn-indicator')!.innerText = turnPlayer.name; }
    static renderBoard() { const area = document.getElementById('board-area')!; area.innerHTML = ''; area.style.gridTemplateColumns = `repeat(${MapSystem.size}, 1fr)`; area.style.gridTemplateRows = `repeat(${MapSystem.size}, 1fr)`; for(let y=0; y<MapSystem.size; y++) { for(let x=0; x<MapSystem.size; x++) { const d = document.createElement('div'); let c = 'path'; const t = MapSystem.grid[y][x]; if(t===TILE.GRASS)c='grass'; else if(t===TILE.WATER)c='water'; else if(t===TILE.GROUND)c='ground'; else if(t===TILE.CITY)c='city'; else if(t===TILE.GYM)c='gym'; else if(t===TILE.EVENT)c='event'; else if(t===TILE.ROCKET)c='rocket'; else if(t===TILE.BIKER)c='biker'; else if(t===TILE.YOUNG)c='young'; else if(t===TILE.OLD)c='old'; d.className = `tile ${c}`; d.id = `tile-${x}-${y}`; if(MapSystem.size>=30)d.style.fontSize='8px'; if(t===TILE.GYM) { const gid = MapSystem.gymLocations[`${x},${y}`]; if(gid) { const gData = GYM_DATA.find(g => g.id === gid); if(gData) { d.style.backgroundImage = `url('/assets/img/Ginasios/${gData.gymImg}')`; d.style.backgroundSize = '100% 100%'; d.style.backgroundRepeat = 'no-repeat'; d.title = `Ginásio ${gData.type} - Líder ${gData.leaderName}`; } d.innerText = ""; } } area.appendChild(d); } } }
    static getCurrentPlayer() { return this.players[this.turn]; }
    static log(m: string) { document.getElementById('log-container')!.insertAdjacentHTML('afterbegin', `<div class="log-entry">${m}</div>`); }
}

// BINDING GLOBAL ATUALIZADO E SEGURO
// Garantindo que as funções só sejam chamadas quando a classe Game estiver pronta
window.openInventory = (id) => Game.openInventoryModal(id);
window.openCards = (id) => { if(Network.isOnline && id !== Network.myPlayerId) return alert("Privado!"); Cards.showPlayerCards(id); };
window.openCardLibrary = () => Game.openCardLibrary();
window.openXpRules = () => Game.openXpRules();
window.Setup = Setup; 
window.Game = Game; 
window.Shop = Shop; 
window.Battle = Battle; 
window.Network = Network;

// Inicia os slots apenas se o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    Setup.updateSlots();
});
// Fallback caso o DOM já tenha carregado
if (document.readyState === "complete" || document.readyState === "interactive") {
    Setup.updateSlots();
}