import { db, NetworkState } from './FirebaseInit';
import { NetworkSync } from './NetworkSync';
import { Player } from '../../models/Player';
import { Pokemon } from '../../models/Pokemon';
import { MapSystem } from '../../systems/MapSystem';
import { Setup } from '../../core/Setup';
import { GLOBAL_EVENTS } from '../../constants/globalEvents';
import { ref, set, get, onValue, update } from 'firebase/database';

export class NetworkActions {

    static checkInput(): boolean {
        const nameInput = document.getElementById('online-player-name') as HTMLInputElement;
        const avSelect = document.getElementById('online-avatar-select') as HTMLSelectElement;
        if (!nameInput.value) { alert("Digite seu nome!"); return false; }
        NetworkState.localName = nameInput.value;
        NetworkState.localAvatar = avSelect.value;
        return true;
    }

    static reconnect() {
        const stored = localStorage.getItem('pkbd_session');
        if (stored) {
            const sess = JSON.parse(stored);
            get(ref(db, `rooms/${sess.roomId}/players/${sess.id}`)).then((snapshot) => {
                const playerData = snapshot.val();
                if (playerData) {
                    NetworkState.currentRoomId = sess.roomId;
                    NetworkState.myPlayerId = sess.id;
                    NetworkState.isHost = (sess.id === 0);
                    NetworkState.isOnline = true;
                    NetworkState.localName = playerData.name;
                    NetworkState.localAvatar = playerData.avatar;
                    document.getElementById('setup-screen')!.style.display = 'none';
                    document.getElementById('game-container')!.style.display = 'flex';
                    this.setupLobbyListener();
                    this.initializeGameFromFirebase();
                } else {
                    alert("Sessão inválida ou jogo encerrado.");
                    localStorage.removeItem('pkbd_session');
                    location.reload();
                }
            }).catch(() => { alert("Erro ao reconectar."); });
        }
    }

    static async createRoom() {
        if (!this.checkInput()) return;
        await NetworkSync.loadGlobalChampion();

        const customInput = (document.getElementById('custom-room-code') as HTMLInputElement);
        let roomCode = "";

        if (customInput && customInput.value.trim().length > 0) {
            roomCode = customInput.value.trim().toUpperCase();
            if (/[.#$\[\]]/.test(roomCode)) {
                return alert("O código da sala não pode conter símbolos especiais (. # $ [ ]).");
            }
        } else {
            roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        }

        NetworkState.currentRoomId = roomCode;
        NetworkState.myPlayerId = 0;
        NetworkState.isHost = true;

        const myPlayerObj = new Player(0, NetworkState.localName, NetworkState.localAvatar, false);

        MapSystem.generate(20);
        const Game = (window as any).Game;
        if (Game.generateGymTeams) Game.generateGymTeams();

        const allGyms = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
        const shuffledGyms = allGyms.sort(() => Math.random() - 0.5).slice(0, 8);

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
            gymTeams: Game.gymTeams || {},
            players: {
                0: {
                    name: myPlayerObj.name,
                    avatar: NetworkState.localAvatar,
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

        await set(ref(db, 'rooms/' + roomCode), initialData);

        localStorage.setItem('pkbd_session', JSON.stringify({ roomId: roomCode, id: 0 }));
        NetworkState.isOnline = true;
        this.setupLobbyListener();

        document.getElementById('lobby-status')!.style.display = 'block';
        document.getElementById('lobby-status')!.innerHTML = `Sala Criada: <b>${roomCode}</b><br>Você é o HOST`;
        document.getElementById('host-controls')!.style.display = 'block';
    }

    static async joinRoom() {
        if (!this.checkInput()) return;
        const code = (document.getElementById('room-code-input') as HTMLInputElement).value.toUpperCase();
        if (!code) return alert("Digite o código!");

        const roomRef = ref(db, 'rooms/' + code);
        const snapshot = await get(roomRef);
        if (!snapshot.exists()) return alert("Sala não encontrada!");

        const data = snapshot.val();
        if (data.status === "PLAYING") {
            const existingPlayers = Object.values(data.players || {});
            const found = existingPlayers.find((p: any) => p.name === NetworkState.localName);
            if (found) {
                NetworkState.myPlayerId = (found as any).id;
                NetworkState.currentRoomId = code;
                NetworkState.isHost = (NetworkState.myPlayerId === 0);
                localStorage.setItem('pkbd_session', JSON.stringify({ roomId: code, id: NetworkState.myPlayerId }));
                NetworkState.isOnline = true;
                this.setupLobbyListener();
                this.initializeGameFromFirebase();
                return;
            } else {
                return alert("Jogo já começou e seu nome não está na lista!");
            }
        }

        const players = data.players || {};
        const currentCount = Object.keys(players).length;
        if (currentCount >= 8) return alert("Sala cheia!");

        NetworkState.myPlayerId = currentCount;
        NetworkState.currentRoomId = code;
        NetworkState.isHost = false;

        const myPlayerObj = new Player(NetworkState.myPlayerId, NetworkState.localName, NetworkState.localAvatar, false);

        const newPlayer = {
            name: myPlayerObj.name,
            avatar: NetworkState.localAvatar,
            id: NetworkState.myPlayerId,
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

        await set(ref(db, `rooms/${code}/players/${NetworkState.myPlayerId}`), newPlayer);
        localStorage.setItem('pkbd_session', JSON.stringify({ roomId: code, id: NetworkState.myPlayerId }));
        NetworkState.isOnline = true;
        this.setupLobbyListener();

        document.getElementById('lobby-status')!.style.display = 'block';
        document.getElementById('lobby-status')!.innerHTML = `Conectado à sala: <b>${code}</b>`;
        Setup.showLobbyUIOnly();
    }

    static setupLobbyListener() {
        const playersRef = ref(db, `rooms/${NetworkState.currentRoomId}/players`);
        const statusRef = ref(db, `rooms/${NetworkState.currentRoomId}/status`);

        onValue(playersRef, (snapshot) => {
            const players = snapshot.val();
            if (!players) return;
            NetworkState.lobbyPlayers = Object.values(players);
            const list = document.getElementById('online-lobby-list')!;
            list.style.display = 'block';

            list.innerHTML = NetworkState.lobbyPlayers.map((p: any) => {
                const avatarFile = (p.avatar || "Red.jpg").split('/').pop();
                return `<div class="lobby-player-item"><img src="/assets/img/Treinadores/${avatarFile}"><span><b>P${p.id + 1}</b>: ${p.name} ${p.id === 0 ? '(HOST)' : ''}</span></div>`;
            }).join('');
        });

        onValue(statusRef, (snapshot) => {
            const status = snapshot.val();
            if (status === 'PLAYING') { this.initializeGameFromFirebase(); }
        });
    }

    static async initializeGameFromFirebase() {
        const Game = (window as any).Game;
        await NetworkSync.loadGlobalChampion();
        const snapshot = await get(ref(db, `rooms/${NetworkState.currentRoomId}`));
        const data = snapshot.val();

        Game.round = data.round || 1;

        if (data.map) {
            MapSystem.size = data.map.size;
            MapSystem.grid = data.map.grid;
            MapSystem.gymLocations = data.map.gymLocations || {};
        } else { return; }

        if (data.gymTeams) Game.gymTeams = data.gymTeams;
        Game.activeGyms = data.activeGyms || [1, 2, 3, 4, 5, 6, 7, 8];

        if (data.logs) {
            Game.globalLogs = data.logs;
            const container = document.getElementById('log-container');
            if (container) {
                container.innerHTML = '';
                Game.globalLogs.forEach((l: any) => {
                    const lType = l.type || 'system';
                    const currentFilter = (Game as any).currentLogFilter || 'all';
                    const displayStyle = (currentFilter === 'all' || currentFilter === lType) ? "block" : "none";
                    container.insertAdjacentHTML('beforeend', `<div class="log-entry" style="${l.style}; display:${displayStyle}" data-type="${lType}">${l.text}</div>`);
                });
            }
        }

        if (data.lixeira) {
            Game.lixeira = data.lixeira.map((td: any) => {
                const po = new Pokemon(td.id, td.level, td.isShiny);
                Object.assign(po, td);
                return po;
            });
        } else {
            Game.lixeira = [];
        }

        const playerArray = Object.values(data.players).map((pd: any) => {
            const avatarFile = (pd.avatar || "Red.jpg").split('/').pop();
            const pl = new Player(pd.id, pd.name, avatarFile, true);
            pl.x = pd.x; pl.y = pd.y; pl.gold = pd.gold;

            pl.skipTurns = pd.skipTurns || 0;
            pl.badges = pd.badges || [false, false, false, false, false, false, false, false];
            pl.cards = pd.cards || [];
            pl.effects = pd.effects || {};
            pl.pokedexData = pd.pokedexData || {};
            pl.stats = pd.stats || { cardsUsed: 0, cardsSuffered: 0, effectsReceived: {}, cardsDefended: {}, turnsLost: 0 };

            if (pd.team && pd.team.length > 0) {
                pl.team = pd.team.map((td: any) => {
                    const po = new Pokemon(td.id, td.level, td.isShiny);
                    Object.assign(po, td);
                    return po;
                });
            }
            if (pd.items) pl.items = pd.items;
            return pl;
        });

        if (data.playOrder) {
            playerArray.sort((a: Player, b: Player) => data.playOrder.indexOf(a.id) - data.playOrder.indexOf(b.id));
        } else {
            playerArray.sort((a: Player, b: Player) => a.id - b.id);
        }

        document.getElementById('setup-screen')!.style.display = 'none';
        document.getElementById('game-container')!.style.display = 'flex';
        Game.init(playerArray, MapSystem.size);
        this.setupGameLoopListener();
    }

    static setupGameLoopListener() {
        const Game = (window as any).Game;
        if (NetworkState.isListenerActive) return;
        NetworkState.isListenerActive = true;

        onValue(ref(db, `rooms/${NetworkState.currentRoomId}/lastAction`), (snapshot) => {
            const action = snapshot.val();
            if (!action || action.type === 'INIT') return;
            this.handleRemoteAction(action);
        });

        onValue(ref(db, `rooms/${NetworkState.currentRoomId}/turn`), (snapshot) => {
            const turn = snapshot.val();
            if (turn !== null) {
                Game.turn = turn;
                Game.updateHUD();
                if (typeof Game.checkTurnControl === 'function') Game.checkTurnControl();
            }
        });

        onValue(ref(db, `rooms/${NetworkState.currentRoomId}/round`), (snapshot) => {
            const round = snapshot.val();
            if (round !== null) {
                Game.round = round;
                Game.updateHUD();
                if (typeof Game.checkTurnControl === 'function') Game.checkTurnControl();
            }
        });

        onValue(ref(db, `rooms/${NetworkState.currentRoomId}/currentEventId`), (snapshot) => {
            const evId = snapshot.val();
            Game.currentGlobalEvent = GLOBAL_EVENTS.find((e: any) => e.id === evId) || null;
            Game.updateHUD();
        });

        onValue(ref(db, `rooms/${NetworkState.currentRoomId}/eventEndRound`), (snapshot) => {
            Game.eventEndRound = snapshot.val() || 0;
        });

        onValue(ref(db, `rooms/${NetworkState.currentRoomId}/battleActive`), (snapshot) => {
            const isBattle = snapshot.val();
            const BattleObj = (window as any).Battle;

            if (isBattle === false && BattleObj && BattleObj.active) {
                document.getElementById('battle-modal')!.style.display = 'none';
                BattleObj.active = false;
                if (typeof Game.checkTurnControl === 'function') Game.checkTurnControl();
            }
        });

        onValue(ref(db, `rooms/${NetworkState.currentRoomId}/lixeira`), (snapshot) => {
            const lixeiraData = snapshot.val();
            if (lixeiraData) {
                Game.lixeira = lixeiraData.map((td: any) => {
                    const po = new Pokemon(td.id, td.level, td.isShiny);
                    Object.assign(po, td);
                    return po;
                });
            } else {
                Game.lixeira = [];
            }
        });

        onValue(ref(db, `rooms/${NetworkState.currentRoomId}/players`), (snapshot) => {
            const playersData = snapshot.val();
            if (!playersData) return;

            Object.values(playersData).forEach((pd: any) => {
                const localPlayer = Game.players.find((p: any) => p.id == pd.id);
                if (localPlayer) {
                    const isMeAndMyTurn = (localPlayer.id === NetworkState.myPlayerId && Game.canAct && Game.canAct());

                    if (!isMeAndMyTurn) {
                        localPlayer.x = pd.x;
                        localPlayer.y = pd.y;
                    }

                    localPlayer.gold = pd.gold;
                    localPlayer.skipTurns = pd.skipTurns || 0;
                    localPlayer.badges = pd.badges || localPlayer.badges;
                    localPlayer.cards = pd.cards || [];
                    localPlayer.effects = pd.effects || {};
                    localPlayer.pokedexData = pd.pokedexData || {};
                    localPlayer.stats = pd.stats || { cardsUsed: 0, cardsSuffered: 0, effectsReceived: {}, cardsDefended: {}, turnsLost: 0 };

                    if (pd.items) localPlayer.items = pd.items;

                    if (pd.team) {
                        const BattleObj = (window as any).Battle;
                        const isMyBattleEcho = (localPlayer.id === NetworkState.myPlayerId && BattleObj && BattleObj.active);
                        const isOpponentInBattle = (BattleObj && BattleObj.active && BattleObj.isPvP && BattleObj.enemyPlayer && BattleObj.enemyPlayer.id === localPlayer.id);

                        if (!isMyBattleEcho && !isOpponentInBattle) {
                            const remoteTeam = Array.isArray(pd.team) ? pd.team : Object.values(pd.team);

                            remoteTeam.forEach((remoteMon: any, idx: number) => {
                                if (localPlayer.team[idx]) {
                                    if (localPlayer.team[idx].id !== remoteMon.id && !(localPlayer.team[idx] as any).isTemp) {
                                        const PokemonClass = (window as any).Pokemon || localPlayer.team[0].constructor;
                                        const newMon = new PokemonClass(remoteMon.id, remoteMon.level, remoteMon.isShiny);
                                        Object.assign(newMon, remoteMon);
                                        localPlayer.team[idx] = newMon;
                                    } else {
                                        let newHp = remoteMon.currentHp;
                                        if (newHp === undefined) newHp = remoteMon.hp;

                                        if (newHp !== undefined) localPlayer.team[idx].currentHp = Number(newHp);
                                        if (remoteMon.maxHp) localPlayer.team[idx].maxHp = Number(remoteMon.maxHp);
                                        if (remoteMon.currentXp !== undefined) localPlayer.team[idx].currentXp = Number(remoteMon.currentXp);
                                        if (remoteMon.level) localPlayer.team[idx].level = Number(remoteMon.level);

                                        Object.assign(localPlayer.team[idx], remoteMon);
                                        if (newHp !== undefined) localPlayer.team[idx].currentHp = Number(newHp);
                                    }
                                }
                            });

                            if (remoteTeam.length > localPlayer.team.length) {
                                const PokemonClass = (window as any).Pokemon || localPlayer.team[0].constructor;
                                for (let i = localPlayer.team.length; i < remoteTeam.length; i++) {
                                    const tData = remoteTeam[i];
                                    try {
                                        const po = new PokemonClass(tData.id, tData.level, tData.isShiny);
                                        Object.assign(po, tData);
                                        if (tData.currentHp !== undefined) po.currentHp = Number(tData.currentHp);
                                        localPlayer.team.push(po);
                                    } catch (e) {
                                        localPlayer.team.push(tData);
                                    }
                                }
                            }
                        }
                    }
                }
            });
            Game.updateHUD();
            Game.moveVisuals();
        });
    }

    static handleRemoteAction(action: any) {
        const Game = (window as any).Game;
        const Battle = (window as any).Battle;

        if (action.playerId === NetworkState.myPlayerId) return;

        switch (action.type) {
            case 'ROLL': Game.animateDice(action.payload.result, action.playerId); break;
            case 'MOVE_ANIMATION': Game.performVisualStep(action.payload.playerId, action.payload.x, action.payload.y); break;
            case 'BATTLE_START': Battle.startFromNetwork(action.payload); break;

            case 'BATTLE_OPP_SWITCH':
                if (!Battle.active) return;
                const nextInList = Battle.oppTeamList.find((p: any) => p.id === action.payload.nextOpp.id && !p.isFainted());
                const oldNpcImg = (Battle.opponent as any)?._npcImage;
                const oldNpcName = (Battle.opponent as any)?._npcName;

                if (nextInList) {
                    Battle.opponent = nextInList;
                } else {
                    const PokemonClass = (window as any).Pokemon || Game.players[0].team[0].constructor;
                    const newOpp = new PokemonClass(action.payload.nextOpp.id, action.payload.nextOpp.level, action.payload.nextOpp.isShiny);
                    Object.assign(newOpp, action.payload.nextOpp);
                    Battle.opponent = newOpp;
                }

                if (oldNpcImg) (Battle.opponent as any)._npcImage = oldNpcImg;
                if (oldNpcName) (Battle.opponent as any)._npcName = oldNpcName;
                Battle.updateUI();
                break;

            case 'BATTLE_PLY_SWITCH': {
                if (!Battle.active) return;
                const nextInListPly = Battle.plyTeamList.find((p: any) => p.id === action.payload.nextPly.id && !p.isFainted());

                if (nextInListPly) {
                    Battle.activeMon = nextInListPly;
                } else {
                    const PokemonClass = (window as any).Pokemon || Game.players[0].team[0].constructor;
                    const newPly = new PokemonClass(action.payload.nextPly.id, action.payload.nextPly.level, action.payload.nextPly.isShiny);
                    Object.assign(newPly, action.payload.nextPly);
                    Battle.activeMon = newPly;
                }
                Battle.updateUI();
                break;
            }

            case 'BATTLE_UPDATE': Battle.updateFromNetwork(action.payload, action.playerId); break;
            case 'BATTLE_END': Battle.end(true); break;
            case 'LOG': Game.log(action.payload.msg, action.playerId); break;
            case 'SHOW_ALERT': Game.showGlobalAlert(action.payload.msg, action.payload.playerName, false, action.payload.endsTurn !== false); break;
            case 'CLOSE_ALERT': Game.closeGlobalAlert(); break;
            case 'SYNC_TRAPS': Game.renderTraps(action.payload.traps || []); break;
            case 'GAME_WIN': Game.triggerVictory(action.payload.winnerId); break;

            case 'PVP_SYNC_DAMAGE':
                const targetP = Game.players.find((p: any) => p.id === action.payload.targetId);

                if (targetP) {
                    if (action.payload.team) {
                        action.payload.team.forEach((remoteMon: any, idx: number) => {
                            if (targetP.team[idx]) targetP.team[idx].currentHp = remoteMon.currentHp;
                        });
                    }

                    if (action.payload.gold !== undefined) targetP.gold = action.payload.gold;
                    if (action.payload.badges !== undefined) targetP.badges = action.payload.badges;

                    Game.updateHUD();

                    if (targetP.id === NetworkState.myPlayerId) {
                        if (action.payload.resetPos) Game.handleTotalDefeat(targetP);
                        else NetworkSync.syncPlayerState();
                    }
                }
                break;
        }
    }

    static sendAction(type: string, payload: any) {
        if (!NetworkState.isOnline) return;
        NetworkState.actionQueue.push({ type, payload });
        this.processQueue();
    }

    static async processQueue() {
        if (NetworkState.isProcessingQueue || NetworkState.actionQueue.length === 0) return;

        NetworkState.isProcessingQueue = true;

        while (NetworkState.actionQueue.length > 0) {
            const action = NetworkState.actionQueue.shift();

            if (action) {
                const actionData = { type: action.type, payload: action.payload, playerId: NetworkState.myPlayerId, timestamp: Date.now() };
                const updates: any = {};
                updates['lastAction'] = actionData;
                if (action.type === 'BATTLE_START') updates['battleActive'] = true;
                if (action.type === 'BATTLE_END') updates['battleActive'] = false;

                try {
                    await update(ref(db, `rooms/${NetworkState.currentRoomId}`), updates);
                } catch (e) {
                    console.error("Erro ao enviar ação para a fila: ", e);
                }

                await new Promise(resolve => setTimeout(resolve, 400));
            }
        }

        NetworkState.isProcessingQueue = false;
    }
}