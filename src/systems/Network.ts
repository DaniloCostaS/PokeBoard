import { firebaseConfig } from '../constants/connectConfig';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, update, Database } from 'firebase/database';
import { Player } from '../models/Player';
import { Pokemon } from '../models/Pokemon';
import { MapSystem } from './MapSystem';
import { Setup } from '../core/Setup';
import { Battle } from './Battle';

let app;
export let db: Database;
try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
} catch (e) {
    console.error("Erro ao inicializar Firebase", e);
}

export class Network {
    static isOnline: boolean = false; 
    static isHost: boolean = false; 
    static myPlayerId: number = -1; 
    static currentRoomId: string = ""; 
    static localName: string = ""; 
    static localAvatar: string = ""; 
    static isListenerActive: boolean = false; 
    static lobbyPlayers: any[] = [];

    static checkInput(): boolean { const nameInput = document.getElementById('online-player-name') as HTMLInputElement; const avSelect = document.getElementById('online-avatar-select') as HTMLSelectElement; if(!nameInput.value) { alert("Digite seu nome!"); return false; } this.localName = nameInput.value; this.localAvatar = avSelect.value; return true; }
    
    static reconnect() { const stored = localStorage.getItem('pkbd_session'); if(stored) { const sess = JSON.parse(stored); get(ref(db, `rooms/${sess.roomId}/players/${sess.id}`)).then((snapshot) => { const playerData = snapshot.val(); if(playerData) { this.currentRoomId = sess.roomId; this.myPlayerId = sess.id; this.isHost = (sess.id === 0); this.isOnline = true; this.localName = playerData.name; this.localAvatar = playerData.avatar; document.getElementById('setup-screen')!.style.display='none'; document.getElementById('game-container')!.style.display='flex'; this.setupLobbyListener(); this.initializeGameFromFirebase(); } else { alert("Sessão inválida ou jogo encerrado."); localStorage.removeItem('pkbd_session'); location.reload(); } }).catch(() => { alert("Erro ao reconectar."); }); } }
    
    static async createRoom() { 
        if(!this.checkInput()) return; 
        await this.loadGlobalChampion();

        // --- NOVA LÓGICA DE CÓDIGO MANUAL ---
        const customInput = (document.getElementById('custom-room-code') as HTMLInputElement);
        let roomCode = "";

        if (customInput && customInput.value.trim().length > 0) {
            // Usa o código digitado (Remove espaços e coloca em Maiúsculo)
            roomCode = customInput.value.trim().toUpperCase();
            
            // Validação simples para evitar caracteres proibidos no Firebase (., #, $, [, ])
            if (/[.#$\[\]]/.test(roomCode)) {
                return alert("O código da sala não pode conter símbolos especiais (. # $ [ ]).");
            }
        } else {
            // Se estiver vazio, gera aleatório como antes
            roomCode = Math.random().toString(36).substring(2, 6).toUpperCase(); 
        }
        // -------------------------------------

        this.currentRoomId = roomCode; 
        this.myPlayerId = 0; 
        this.isHost = true; 
        
        const myPlayerObj = new Player(0, this.localName, this.localAvatar, false); 
        
        // Gera Mapa e Times
        MapSystem.generate(20); 
        const Game = (window as any).Game;
        Game.generateGymTeams(); 

        // --- SORTEIO GLOBAL DE GINÁSIOS ---
        const allGyms = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18];
        const shuffledGyms = allGyms.sort(() => Math.random() - 0.5).slice(0, 8);
        // ----------------------------------

        const initialData = { 
            status: "LOBBY", 
            turn: 0, 
            round: 1,
            mapSize: 20,
            activeGyms: shuffledGyms,
            map: {
                size: 20,
                grid: MapSystem.grid,
                gymLocations: MapSystem.gymLocations
            },
            gymTeams: Game.gymTeams, 
            players: { 
                0: { 
                    name: myPlayerObj.name, 
                    avatar: this.localAvatar, 
                    id: 0, 
                    x: 0, 
                    y: 0, 
                    gold: myPlayerObj.gold, 
                    items: myPlayerObj.items, 
                    cards: myPlayerObj.cards,
                    team: myPlayerObj.team, 
                    skipTurns: 0, 
                    badges: myPlayerObj.badges, 
                    effects: {},
                    pokedexData: myPlayerObj.pokedexData || {}
                } 
            }, 
            lastAction: { type: "INIT", timestamp: Date.now() } 
        }; 
        
        // Salva no Firebase com o código escolhido
        await set(ref(db, 'rooms/' + roomCode), initialData); 
        
        localStorage.setItem('pkbd_session', JSON.stringify({roomId: roomCode, id: 0})); 
        this.isOnline = true; 
        this.setupLobbyListener(); 
        
        document.getElementById('lobby-status')!.style.display = 'block'; 
        // Mostra o código escolhido no Lobby também
        document.getElementById('lobby-status')!.innerHTML = `Sala Criada: <b>${roomCode}</b><br>Você é o HOST`; 
        document.getElementById('host-controls')!.style.display = 'block'; 
    }
    
    static async joinRoom() { 
        if(!this.checkInput()) return; 
        const code = (document.getElementById('room-code-input') as HTMLInputElement).value.toUpperCase(); 
        if(!code) return alert("Digite o código!"); 
        const roomRef = ref(db, 'rooms/' + code); 
        const snapshot = await get(roomRef); 
        if(!snapshot.exists()) return alert("Sala não encontrada!"); 
        const data = snapshot.val(); 
        if(data.status === "PLAYING") { const existingPlayers = Object.values(data.players || {}); const found = existingPlayers.find((p: any) => p.name === this.localName); if (found) { this.myPlayerId = (found as any).id; this.currentRoomId = code; this.isHost = (this.myPlayerId === 0); localStorage.setItem('pkbd_session', JSON.stringify({roomId: code, id: this.myPlayerId})); this.isOnline = true; this.setupLobbyListener(); this.initializeGameFromFirebase(); return; } else { return alert("Jogo já começou e seu nome não está na lista!"); } } 
        const players = data.players || {}; 
        const currentCount = Object.keys(players).length; 
        if(currentCount >= 8) return alert("Sala cheia!"); 
        
        this.myPlayerId = currentCount; 
        this.currentRoomId = code; 
        this.isHost = false; 
        
        const myPlayerObj = new Player(this.myPlayerId, this.localName, this.localAvatar, false); 
        
        const newPlayer = { 
            name: myPlayerObj.name, 
            avatar: this.localAvatar, 
            id: this.myPlayerId, 
            x: 0, 
            y: 0, 
            gold: myPlayerObj.gold, 
            items: myPlayerObj.items, 
            cards: myPlayerObj.cards,
            team: myPlayerObj.team, 
            skipTurns: 0, 
            badges: myPlayerObj.badges, 
            effects: {},
            pokedexData: myPlayerObj.pokedexData || {}
        }; 
        
        await set(ref(db, `rooms/${code}/players/${this.myPlayerId}`), newPlayer); 
        localStorage.setItem('pkbd_session', JSON.stringify({roomId: code, id: this.myPlayerId})); 
        this.isOnline = true; 
        this.setupLobbyListener(); 
        document.getElementById('lobby-status')!.style.display = 'block'; 
        document.getElementById('lobby-status')!.innerHTML = `Conectado à sala: <b>${code}</b>`; 
        Setup.showLobbyUIOnly(); 
    }

    static setupLobbyListener() { 
        const playersRef = ref(db, `rooms/${this.currentRoomId}/players`); 
        const statusRef = ref(db, `rooms/${this.currentRoomId}/status`); 
        
        onValue(playersRef, (snapshot) => { 
            const players = snapshot.val(); 
            if(!players) return; 
            this.lobbyPlayers = Object.values(players); 
            const list = document.getElementById('online-lobby-list')!; 
            list.style.display = 'block'; 
            
            list.innerHTML = this.lobbyPlayers.map((p: any) => {
                // CORREÇÃO LOBBY: Limpa o caminho se já estiver salvo longo no banco
                const avatarFile = (p.avatar || "Red.jpg").split('/').pop();
                return `<div class="lobby-player-item"><img src="/assets/img/Treinadores/${avatarFile}"><span><b>P${p.id + 1}</b>: ${p.name} ${p.id === 0 ? '(HOST)' : ''}</span></div>`;
            }).join(''); 
        }); 
        
        onValue(statusRef, (snapshot) => { 
            const status = snapshot.val(); 
            if(status === 'PLAYING') { this.initializeGameFromFirebase(); } 
        }); 
    }

    static async initializeGameFromFirebase() { 
        const Game = (window as any).Game;
        await this.loadGlobalChampion();
        const snapshot = await get(ref(db, `rooms/${this.currentRoomId}`)); 
        const data = snapshot.val(); 
        Game.round = data.round || 1;

        // Carrega Mapa
        if (data.map) { 
            MapSystem.size = data.map.size; 
            MapSystem.grid = data.map.grid; 
            MapSystem.gymLocations = data.map.gymLocations || {}; 
        }
        
        // --- CARREGA OS TIMES DE GINÁSIO ---
        if (data.gymTeams) {
            Game.gymTeams = data.gymTeams;
        }
        // -----------------------------------

        // --- CARREGA OS GINÁSIOS SORTEADOS ---
        Game.activeGyms = data.activeGyms || [1, 2, 3, 4, 5, 6, 7, 8]; // Fallback
        // -------------------------------------
        
        if (data.map) { MapSystem.size = data.map.size; MapSystem.grid = data.map.grid; MapSystem.gymLocations = data.map.gymLocations || {}; } else { return; } 
        const playerArray = Object.values(data.players).map((pd: any) => { 
            // CORREÇÃO DOS AVATARES: Pega só o nome do arquivo para não duplicar
            const avatarFile = (pd.avatar || "Red.jpg").split('/').pop();
            
            const pl = new Player(pd.id, pd.name, avatarFile, true); 
            pl.x = pd.x; pl.y = pd.y; pl.gold = pd.gold; 

            pl.skipTurns = pd.skipTurns || 0;
            pl.badges = pd.badges || [false,false,false,false,false,false,false,false];
            pl.cards = pd.cards || [];
            pl.effects = pd.effects || {};
            pl.pokedexData = pd.pokedexData || {};

            if(pd.team && pd.team.length > 0) { 
                pl.team = pd.team.map((td: any) => { 
                    const po = new Pokemon(td.id, td.level, td.isShiny); 
                    Object.assign(po, td); 
                    return po; 
                }); 
            } 
            if (pd.items) pl.items = pd.items; 
            return pl; 
        }); 
        playerArray.sort((a: Player, b: Player) => a.id - b.id); 
        document.getElementById('setup-screen')!.style.display='none'; 
        document.getElementById('game-container')!.style.display='flex'; 
        Game.init(playerArray, MapSystem.size); 
        this.setupGameLoopListener(); 
    }

    static setupGameLoopListener() { 
        const Game = (window as any).Game;
        if (this.isListenerActive) return; 
        this.isListenerActive = true; 
        
        onValue(ref(db, `rooms/${this.currentRoomId}/lastAction`), (snapshot) => { const action = snapshot.val(); if(!action || action.type === 'INIT') return; this.handleRemoteAction(action); }); 
        onValue(ref(db, `rooms/${this.currentRoomId}/turn`), (snapshot) => { const turn = snapshot.val(); if(turn !== null) { Game.turn = turn; Game.updateHUD(); Game.checkTurnControl(); } }); 
        onValue(ref(db, `rooms/${this.currentRoomId}/round`), (snapshot) => { 
            const round = snapshot.val(); 
            if(round !== null) { 
                Game.round = round; 
                Game.updateHUD();
            } 
        });
        onValue(ref(db, `rooms/${this.currentRoomId}/players`), (snapshot) => { 
            const playersData = snapshot.val(); 
            if(!playersData) return; 
            
            Object.values(playersData).forEach((pd: any) => { 
                const localPlayer = Game.players.find((p: any) => p.id == pd.id); // Use == para evitar erro de string/number
                if(localPlayer) { 
                    // --- CORREÇÃO ANTI-ELÁSTICO ---
                    // Se for você mesmo e for o SEU turno, o seu cliente é o chefe da própria posição.
                    // Isso ignora "ecos" atrasados do Firebase e impede de ser puxado para trás.
                    const isMeAndMyTurn = (localPlayer.id === this.myPlayerId && Game.canAct());

                    if (!isMeAndMyTurn) {
                        localPlayer.x = pd.x; 
                        localPlayer.y = pd.y; 
                    }
                    // ------------------------------
                    localPlayer.gold = pd.gold; 
                    localPlayer.skipTurns = pd.skipTurns || 0; 
                    localPlayer.badges = pd.badges || localPlayer.badges; 
                    localPlayer.cards = pd.cards || [];
                    localPlayer.effects = pd.effects || {};
                    localPlayer.pokedexData = pd.pokedexData || {};

                    if(pd.items) localPlayer.items = pd.items; 
                    
                    // --- CORREÇÃO AQUI: ATUALIZAÇÃO DO TIME MAIS ROBUSTA ---
                    if(pd.team) { 
                        // Transforma em array caso o Firebase devolva como Objeto {0:..., 1:...}
                        const remoteTeam = Array.isArray(pd.team) ? pd.team : Object.values(pd.team);
                        
                        remoteTeam.forEach((remoteMon: any, idx: number) => { 
                            if(localPlayer.team[idx]) {
                                // 1. Tenta pegar currentHp, se não existir tenta pegar hp (fix legado)
                                let newHp = remoteMon.currentHp;
                                if (newHp === undefined) newHp = remoteMon.hp;

                                // 2. Força a atualização se tiver valor válido
                                if (newHp !== undefined) {
                                    localPlayer.team[idx].currentHp = Number(newHp);
                                    
                                    // LOG DE DEBUG (Abra o console F12 para ver se aparece isso ao curar)
                                    if(localPlayer.id !== this.myPlayerId && newHp > 0) {
                                        console.log(`[SYNC] Atualizando HP de ${localPlayer.name} (Mon: ${localPlayer.team[idx].name}) para ${newHp}`);
                                    }
                                }

                                // 3. Atualiza MaxHP e XP
                                if (remoteMon.maxHp) localPlayer.team[idx].maxHp = Number(remoteMon.maxHp);
                                if (remoteMon.currentXp !== undefined) localPlayer.team[idx].currentXp = Number(remoteMon.currentXp);
                                if (remoteMon.level) localPlayer.team[idx].level = Number(remoteMon.level);

                                // 4. Copia o resto
                                Object.assign(localPlayer.team[idx], remoteMon);
                                
                                // Redundância: Garante que o assign não sobrescreveu o HP com zero/undefined
                                if (newHp !== undefined) localPlayer.team[idx].currentHp = Number(newHp);
                            }
                        }); 
                        
                        // Adiciona pokemons novos se houver (captura)
                        if(remoteTeam.length > localPlayer.team.length) { 
                            const Pokemon = (window as any).Pokemon ||  localPlayer.team[0].constructor; // Hack para pegar construtor
                            for(let i = localPlayer.team.length; i < remoteTeam.length; i++) { 
                                const tData = remoteTeam[i]; 
                                // Tenta instanciar, se falhar usa objeto simples
                                try {
                                    const po = new Pokemon(tData.id, tData.level, tData.isShiny); 
                                    Object.assign(po, tData); 
                                    if(tData.currentHp !== undefined) po.currentHp = Number(tData.currentHp);
                                    localPlayer.team.push(po); 
                                } catch(e) {
                                    localPlayer.team.push(tData);
                                }
                            } 
                        } 
                    } 
                    // --------------------------------------------------------
                } 
            });
            Game.updateHUD(); 
            Game.moveVisuals(); 
        }); 
    }

    static handleRemoteAction(action: any) { 
        const Game = (window as any).Game;
        if (action.playerId === this.myPlayerId) return;

        switch(action.type) { 
            case 'ROLL': Game.animateDice(action.payload.result, action.playerId); break; 
            case 'MOVE_ANIMATION': Game.performVisualStep(action.payload.playerId, action.payload.x, action.payload.y); break; 
            case 'BATTLE_START': Battle.startFromNetwork(action.payload); break; 
            // --- ADICIONE ESTE BLOCO ---
            case 'BATTLE_OPP_SWITCH': 
                const BattleObj = (window as any).Battle;
                if (!BattleObj.active) return;
                
                // 1. Tenta achar o Pokémon na lista que já foi criada no início (Isso arruma as bolinhas de status)
                const nextInList = BattleObj.oppTeamList.find((p: any) => p.id === action.payload.nextOpp.id && !p.isFainted());
                
                // Salva a imagem/nome do anterior antes de trocar!
                const oldNpcImg = (BattleObj.opponent as any)?._npcImage;
                const oldNpcName = (BattleObj.opponent as any)?._npcName;

                if (nextInList) {
                    BattleObj.opponent = nextInList;
                } else {
                    // Se não achou (bug de sincronia), cria um novo de emergência
                    const GameRef = (window as any).Game;
                    const PokemonClass = (window as any).Pokemon || GameRef.players[0].team[0].constructor;
                    const newOpp = new PokemonClass(action.payload.nextOpp.id, action.payload.nextOpp.level, action.payload.nextOpp.isShiny);
                    Object.assign(newOpp, action.payload.nextOpp);
                    BattleObj.opponent = newOpp;
                }
                
                // --- CORREÇÃO: Reaplica a imagem do NPC no novo Pokémon Ativo ---
                if (oldNpcImg) (BattleObj.opponent as any)._npcImage = oldNpcImg;
                if (oldNpcName) (BattleObj.opponent as any)._npcName = oldNpcName;
                // ---------------------------------------------------------------
                
                BattleObj.updateUI();
                break;
            // ---------------------------

            // --- NOVO EVENTO: ATACANTE TROCOU DE POKÉMON ---
            case 'BATTLE_PLY_SWITCH': {
                const BattleObjPly = (window as any).Battle;
                if (!BattleObjPly.active) return;
                
                // Procura se ele existe na lista sorteada
                const nextInListPly = BattleObjPly.plyTeamList.find((p: any) => p.id === action.payload.nextPly.id && !p.isFainted());
                
                if (nextInListPly) {
                    BattleObjPly.activeMon = nextInListPly;
                } else {
                    const PokemonClass = (window as any).Pokemon || Game.players[0].team[0].constructor;
                    const newPly = new PokemonClass(action.payload.nextPly.id, action.payload.nextPly.level, action.payload.nextPly.isShiny);
                    Object.assign(newPly, action.payload.nextPly);
                    BattleObjPly.activeMon = newPly;
                }
                
                BattleObjPly.updateUI();
                break;
            }
            // ------------------------------------------------
            
            case 'BATTLE_UPDATE': Battle.updateFromNetwork(action.payload); break; 
            case 'BATTLE_END': Battle.end(true); break; 
            case 'LOG': Game.log(action.payload.msg); break; 
            case 'SHOW_ALERT': Game.showGlobalAlert(action.payload.msg, action.payload.playerName, false, action.payload.endsTurn !== false); break;
            case 'CLOSE_ALERT': Game.closeGlobalAlert(); break;
            case 'SYNC_TRAPS': Game.renderTraps(action.payload.traps || []); break;
            case 'GAME_WIN':
                // Recebeu aviso que alguém ganhou!
                Game.triggerVictory(action.payload.winnerId);
                break;

            case 'PVP_SYNC_DAMAGE': 
            const targetP = Game.players.find((p: any) => p.id === action.payload.targetId);
            
            if(targetP) {
                // Atualiza o HP de acordo com os índices exatos do time
                if(action.payload.team) {
                    action.payload.team.forEach((remoteMon: any, idx: number) => {
                        if(targetP.team[idx]) targetP.team[idx].currentHp = remoteMon.currentHp;
                    });
                }
                
                // A vítima aceita o saldo de ouro atualizado que veio no pacote
                if(action.payload.gold !== undefined) {
                    targetP.gold = action.payload.gold;
                }

                // --- CORREÇÃO: A vítima aceita a atualização das insígnias pelo Firebase ---
                if(action.payload.badges !== undefined) {
                    targetP.badges = action.payload.badges;
                }
                // --------------------
                
                Game.updateHUD();
                
                // Se EU sou o alvo deste ataque, MEU computador assume o salvamento no Firebase!
                if(targetP.id === this.myPlayerId) {
                    if (action.payload.resetPos) {
                        // O handleTotalDefeat já cura, move pra cidade e TEM UM syncPlayerState DENTRO DELE!
                        Game.handleTotalDefeat(targetP); 
                    } else {
                        // Se não for pra cidade, apenas salva o novo HP e Ouro.
                        this.syncPlayerState();
                    }
                }
            }
            break;
        } 
    }

    static sendAction(type: string, payload: any) { if(!this.isOnline) return; const actionData = { type: type, payload: payload, playerId: this.myPlayerId, timestamp: Date.now() }; update(ref(db, `rooms/${this.currentRoomId}`), { lastAction: actionData }); }
    
    // --- FUNÇÃO AUXILIAR PARA BLINDAR A REDE ---
    static getSanitizedTeam(team: any[]) {
        if (!team) return [];
        return team.map((mon: any) => ({
            id: mon.id,
            name: mon.name,
            type: mon.type,
            secondType: mon.secondType || "",
            baseTotal: mon.baseTotal || 0,
            currentHp: mon.currentHp, 
            maxHp: mon.maxHp,
            level: mon.level,
            currentXp: mon.currentXp,
            maxXp: mon.maxXp,
            isShiny: mon.isShiny,
            isLegendary: mon.isLegendary,
            atk: mon.atk,
            def: mon.def,
            speed: mon.speed,
            stage: mon.stage || 1,
            evoData: mon.evoData || { next: null, trigger: null },
            megaStone: mon.megaStone || false,
            // --- CORREÇÃO: Enviando as estatísticas base e genéticas (IVs) ---
            ivs: mon.ivs || { hp: 0, atk: 0, def: 0, spd: 0 },
            baseStats: mon.baseStats || { hp: 10, atk: 10, def: 10, spd: 10 },
            // --- NOVO: Salvando a genética e o treino do Pokémon! ---
            bonusStats: mon.bonusStats || { hp: 0, atk: 0, def: 0, spd: 0 },
            wins: mon.wins || 0
        }));
    }

    // ==========================================
    // SISTEMA DE CAMPEÃO GLOBAL (HALL DA FAMA)
    // ==========================================
    static async loadGlobalChampion() {
        try {
            const snap = await get(ref(db, 'global/champion'));
            const Game = (window as any).Game; // <--- Pega a referência do Jogo
            
            if (snap.exists()) {
                Game.globalChampion = snap.val();
            } else {
                Game.globalChampion = null;
            }
            
            // --- ATUALIZA A TELA ASSIM QUE BAIXAR OS DADOS ---
            if (Game.renderChampionBanner) Game.renderChampionBanner();
            // -------------------------------------------------
            
        } catch (e) { console.error("Erro ao carregar campeão", e); }
    }

    static async saveGlobalChampion(player: Player) {
        try {
            const championData = {
                name: player.name,
                avatar: player.avatar.split('/').pop(),
                team: this.getSanitizedTeam(player.team)
            };
            // Salva FORA da pasta rooms!
            await set(ref(db, 'global/champion'), championData);
        } catch (e) { console.error("Erro ao salvar campeão", e); }
    }
    // ==========================================

    static syncPlayerState() { 
        if(!this.isOnline) return; 
        const Game = (window as any).Game; 
        
        const p = Game.players.find((pl: any) => pl.id === this.myPlayerId) || Game.players[this.myPlayerId]; 
        if (!p) return;

        update(ref(db, `rooms/${this.currentRoomId}/players/${this.myPlayerId}`), { 
            id: p.id,           // <- BLINDAGEM: Nunca mais perde o ID
            name: p.name,       // <- BLINDAGEM: Nunca mais perde o Nome
            avatar: p.avatar.split('/').pop(), // <- CORREÇÃO: Salva SÓ o nome do arquivo
            x: p.x, 
            y: p.y, 
            gold: p.gold, 
            team: this.getSanitizedTeam(p.team), 
            items: p.items, 
            skipTurns: p.skipTurns, 
            badges: p.badges,
            cards: p.cards && p.cards.length > 0 ? p.cards : null,
            effects: p.effects,
            pokedexData: p.pokedexData || {}
        }); 
    }

    static sendState() {
        this.syncPlayerState();
    }

    static syncSpecificPlayer(targetId: number) {
        if(!this.isOnline) return;
        const Game = (window as any).Game;
        
        const p = Game.players.find((pl: any) => pl.id === targetId) || Game.players[targetId]; 
        if (!p) return;
        
        update(ref(db, `rooms/${this.currentRoomId}/players/${targetId}`), { 
            id: p.id,           // <- BLINDAGEM
            name: p.name,       // <- BLINDAGEM
            avatar: p.avatar.split('/').pop(), // <- CORREÇÃO: Salva SÓ o nome do arquivo
            x: p.x, 
            y: p.y, 
            gold: p.gold, 
            team: this.getSanitizedTeam(p.team), 
            items: p.items,
            badges: p.badges,
            cards: p.cards && p.cards.length > 0 ? p.cards : null,
            skipTurns: p.skipTurns, 
            effects: p.effects,
            pokedexData: p.pokedexData || {}
        });
    }

    static syncPlayers(ids: number[]) {
        if(!this.isOnline) return;
        const Game = (window as any).Game;
        const updates: any = {};
        
        ids.forEach(id => {
            const p = Game.players.find((pl: any) => pl.id === id) || Game.players[id];
            if (p) {
                updates[`rooms/${this.currentRoomId}/players/${id}`] = {
                    id: p.id,           // <- BLINDAGEM
                    name: p.name,       // <- BLINDAGEM
                    avatar: p.avatar.split('/').pop(), // <- CORREÇÃO: Salva SÓ o nome do arquivo
                    x: p.x, 
                    y: p.y, 
                    gold: p.gold, 
                    team: this.getSanitizedTeam(p.team), 
                    items: p.items, 
                    skipTurns: p.skipTurns, 
                    badges: p.badges, 
                    cards: p.cards && p.cards.length > 0 ? p.cards : null,
                    effects: p.effects,
                    pokedexData: p.pokedexData || {}
                };
            }
        });
        
        update(ref(db), updates);
    }
    // --------------------------------------------

    static syncTurn(newTurn: number, newRound: number = 1) { 
        if(!this.isOnline) return; 
        update(ref(db, `rooms/${this.currentRoomId}`), { turn: newTurn, round: newRound }); 
    }
}

// Garante acesso global
(window as any).Network = Network;