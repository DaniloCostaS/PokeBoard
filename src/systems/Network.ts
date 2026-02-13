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
        const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase(); 
        this.currentRoomId = roomCode; 
        this.myPlayerId = 0; 
        this.isHost = true; 
        
        const myPlayerObj = new Player(0, this.localName, this.localAvatar, false); 
        
        const initialData = { 
            status: "LOBBY", 
            turn: 0, 
            round: 1,
            mapSize: 20, 
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
                    effects: {} 
                } 
            }, 
            lastAction: { type: "INIT", timestamp: Date.now() } 
        }; 
        
        await set(ref(db, 'rooms/' + roomCode), initialData); 
        localStorage.setItem('pkbd_session', JSON.stringify({roomId: roomCode, id: 0})); 
        this.isOnline = true; 
        this.setupLobbyListener(); 
        document.getElementById('lobby-status')!.style.display = 'block'; 
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
            effects: {} 
        }; 
        
        await set(ref(db, `rooms/${code}/players/${this.myPlayerId}`), newPlayer); 
        localStorage.setItem('pkbd_session', JSON.stringify({roomId: code, id: this.myPlayerId})); 
        this.isOnline = true; 
        this.setupLobbyListener(); 
        document.getElementById('lobby-status')!.style.display = 'block'; 
        document.getElementById('lobby-status')!.innerHTML = `Conectado à sala: <b>${code}</b>`; 
        Setup.showLobbyUIOnly(); 
    }

    static setupLobbyListener() { const playersRef = ref(db, `rooms/${this.currentRoomId}/players`); const statusRef = ref(db, `rooms/${this.currentRoomId}/status`); onValue(playersRef, (snapshot) => { const players = snapshot.val(); if(!players) return; this.lobbyPlayers = Object.values(players); const list = document.getElementById('online-lobby-list')!; list.style.display = 'block'; list.innerHTML = this.lobbyPlayers.map((p: any) => `<div class="lobby-player-item"><img src="/assets/img/Treinadores/${p.avatar}"><span><b>P${p.id + 1}</b>: ${p.name} ${p.id === 0 ? '(HOST)' : ''}</span></div>`).join(''); }); onValue(statusRef, (snapshot) => { const status = snapshot.val(); if(status === 'PLAYING') { this.initializeGameFromFirebase(); } }); }

    static async initializeGameFromFirebase() { 
        const Game = (window as any).Game; 
        const snapshot = await get(ref(db, `rooms/${this.currentRoomId}`)); 
        const data = snapshot.val(); 
        Game.round = data.round || 1;
        if (data.map) { MapSystem.size = data.map.size; MapSystem.grid = data.map.grid; MapSystem.gymLocations = data.map.gymLocations || {}; } else { return; } 
        const playerArray = Object.values(data.players).map((pd: any) => { 
            const pl = new Player(pd.id, pd.name, pd.avatar, true); 
            pl.x = pd.x; pl.y = pd.y; pl.gold = pd.gold; 
            pl.skipTurns = pd.skipTurns || 0;
            pl.badges = pd.badges || [false,false,false,false,false,false,false,false];
            pl.cards = pd.cards || [];
            pl.effects = pd.effects || {};
            
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
            if(round !== null) { Game.round = round; Game.updateHUD(); } 
        });
        onValue(ref(db, `rooms/${this.currentRoomId}/players`), (snapshot) => { 
            const playersData = snapshot.val(); 
            if(!playersData) return; 
            
            Object.values(playersData).forEach((pd: any) => { 
                const localPlayer = Game.players.find((p: any) => p.id == pd.id); // Use == para evitar erro de string/number
                if(localPlayer) { 
                    localPlayer.x = pd.x; 
                    localPlayer.y = pd.y; 
                    localPlayer.gold = pd.gold; 
                    localPlayer.skipTurns = pd.skipTurns || 0; 
                    localPlayer.badges = pd.badges || localPlayer.badges; 
                    localPlayer.cards = pd.cards || [];
                    localPlayer.effects = pd.effects || {};

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
                
                // Pega o próximo Pokémon da lista já existente para não quebrar o indicador de bolinhas!
                const nextInList = BattleObj.oppTeamList.find((p: any) => p.id === action.payload.nextOpp.id && !p.isFainted());
                
                if (nextInList) {
                    BattleObj.opponent = nextInList;
                } else {
                    // Fallback se não achar
                    const PokemonClass = (window as any).Pokemon || Game.players[0].team[0].constructor;
                    const newOpp = new PokemonClass(action.payload.nextOpp.id, action.payload.nextOpp.level, action.payload.nextOpp.isShiny);
                    Object.assign(newOpp, action.payload.nextOpp);
                    
                    if ((BattleObj.opponent as any)._npcImage) (newOpp as any)._npcImage = (BattleObj.opponent as any)._npcImage;
                    if ((BattleObj.opponent as any)._npcName) (newOpp as any)._npcName = (BattleObj.opponent as any)._npcName;
                    
                    BattleObj.opponent = newOpp;
                }
                
                BattleObj.updateUI();
                break;
            // ---------------------------
            case 'BATTLE_UPDATE': Battle.updateFromNetwork(action.payload); break; 
            case 'BATTLE_END': Battle.end(true); break; 
            case 'LOG': Game.log(action.payload.msg); break; 
            case 'SHOW_ALERT': Game.showGlobalAlert(action.payload.msg, action.payload.playerName, false); break;
            case 'CLOSE_ALERT': Game.closeGlobalAlert(); break;
            case 'GAME_WIN':
                // Recebeu aviso que alguém ganhou!
                Game.triggerVictory(action.payload.winnerId);
                break;
            case 'PVP_SYNC_DAMAGE': 
                const targetP = Game.players.find((p: any) => p.id === action.payload.targetId);
                if(targetP) {
                    if(action.payload.team) {
                        action.payload.team.forEach((remoteMon: any, idx: number) => {
                            if(targetP.team[idx]) targetP.team[idx].currentHp = remoteMon.currentHp;
                        });
                    }
                    if(action.payload.resetPos) { targetP.x = 0; targetP.y = 0; }
                    if(action.payload.skipTurn) { targetP.skipTurns = 2; } 
                    
                    Game.updateHUD();
                    Game.moveVisuals();
                    
                    if(targetP.id === this.myPlayerId) {
                        if (action.payload.resetPos) {
                            Game.handleTotalDefeat(targetP); 
                        } else {
                            this.syncPlayerState();
                        }
                    }
                }
                break;
        } 
    }

    static sendAction(type: string, payload: any) { if(!this.isOnline) return; const actionData = { type: type, payload: payload, playerId: this.myPlayerId, timestamp: Date.now() }; update(ref(db, `rooms/${this.currentRoomId}`), { lastAction: actionData }); }
    
    static syncPlayerState() { 
        if(!this.isOnline) return; 
        const Game = (window as any).Game; 
        const p = Game.players[this.myPlayerId]; 
        
        // CORREÇÃO: Mapeia manualmente para garantir que currentHp seja enviado corretamente
        // e limpa qualquer "sujeira" de dados antigos.
        const teamSanitized = p.team.map((mon: any) => {
            return {
                id: mon.id,
                name: mon.name,
                type: mon.type,
                // O MAIS IMPORTANTE: Força o envio do currentHp
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
                // Mantém dados de evolução se existirem
                evoData: mon.evoData || null,
                // Garante envio de imagem customizada de NPC (se houver)
                _npcImage: mon._npcImage || null
            };
        });

        update(ref(db, `rooms/${this.currentRoomId}/players/${this.myPlayerId}`), { 
            x: p.x, 
            y: p.y, 
            gold: p.gold, 
            team: teamSanitized, // <--- Usa o array sanitizado
            items: p.items, 
            skipTurns: p.skipTurns, 
            badges: p.badges,
            cards: p.cards,
            effects: p.effects
        }); 
    }

    // CORREÇÃO CRÍTICA: Método reintroduzido para compatibilidade com códigos antigos (Cards.ts)
    static sendState() {
        this.syncPlayerState();
    }

    static syncSpecificPlayer(targetId: number) {
        if(!this.isOnline) return;
        const Game = (window as any).Game;
        const p = Game.players[targetId]; 
        
        update(ref(db, `rooms/${this.currentRoomId}/players/${targetId}`), { 
            x: p.x, 
            y: p.y, 
            gold: p.gold, 
            cards: p.cards, 
            skipTurns: p.skipTurns, 
            effects: p.effects 
        });
    }

    static syncTurn(newTurn: number, newRound: number = 1) { 
        if(!this.isOnline) return; 
        update(ref(db, `rooms/${this.currentRoomId}`), { turn: newTurn, round: newRound }); 
    }
}

// Garante acesso global
(window as any).Network = Network;