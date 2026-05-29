import { db, NetworkState } from './FirebaseInit';
import { NetworkSync } from './NetworkSync';
import { Player } from '../../models/Player';
import { Pokemon } from '../../models/Pokemon';
import { MapSystem } from '../../systems/MapSystem';
import { Setup } from '../../core/Setup';
import { GameState } from '../game/GameState';
import { GameUI } from '../game/GameUI';
import { GLOBAL_EVENTS } from '../../constants/globalEvents';
import { ref, get, onValue, update } from 'firebase/database';

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
            get(ref(db, `rooms/${sess.roomId}`)).then((snapshot) => {
                const roomData = snapshot.val();
                if (roomData && roomData.players && roomData.players[sess.id]) {
                    const playerData = roomData.players[sess.id];
                    NetworkState.currentRoomId = sess.roomId;
                    NetworkState.myPlayerId = sess.id;
                    NetworkState.isHost = (sess.id === 0);
                    NetworkState.isOnline = true;
                    NetworkState.localName = playerData.name;
                    NetworkState.localAvatar = playerData.avatar;

                    if (roomData.status === "LOBBY") {
                        document.getElementById('setup-screen')!.style.display = 'block';
                        document.getElementById('menu-phase-1')!.style.display = 'none';
                        document.getElementById('online-login')!.style.display = 'none';
                        document.getElementById('menu-phase-online')!.style.display = 'block';
                        
                        document.getElementById('lobby-status')!.style.display = 'block';
                        document.getElementById('lobby-status')!.innerHTML = `Conectado à sala: <b>${sess.roomId}</b> ${NetworkState.isHost ? '<br>Você é o HOST' : ''}`;
                        
                        Setup.showLobbyUIOnly();
                        this.setupLobbyListener();
                    } else {
                        document.getElementById('setup-screen')!.style.display = 'none';
                        document.getElementById('game-container')!.style.display = 'flex';
                        this.setupLobbyListener();
                        this.initializeGameFromFirebase();
                    }
                } else {
                    alert("Sessão inválida ou jogo encerrado.");
                    localStorage.removeItem('pkbd_session');
                    setTimeout(() => location.reload(), 3000);
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
                    pokedexData: myPlayerObj.pokedexData || {},
                    activeQuests: [],
                    questTrackers: { tilesMovedNoReturn: 0, biomesVisited: [], turnsLostAccumulated: 0, pvpWinsStreak: 0, gymWinsStreak: 0 }
                }
            },
            lastAction: { type: "INIT", timestamp: Date.now() }
        };

        const updates: any = {};
        updates['rooms/' + roomCode] = initialData;

        const loggedUser = (window as any).loggedUser;
        if (loggedUser) {
            updates[`users/${loggedUser}/rooms/${roomCode}`] = true;
        }

        await update(ref(db), updates);

        localStorage.setItem('pkbd_session', JSON.stringify({ roomId: roomCode, id: 0 }));
        NetworkState.isOnline = true;
        this.setupLobbyListener();

        document.getElementById('lobby-status')!.style.display = 'block';
        document.getElementById('lobby-status')!.innerHTML = `Sala Criada: <b>${roomCode}</b><br>Você é o HOST`;
        document.getElementById('host-controls')!.style.display = 'block';
    }

    static async joinRoom(roomCode?: string) {
        if (!this.checkInput()) return;
        const code = (roomCode || (document.getElementById('room-code-input') as HTMLInputElement).value).toUpperCase();
        if (!code) return alert("Digite o código!");

        const roomRef = ref(db, 'rooms/' + code);
        const snapshot = await get(roomRef);
        if (!snapshot.exists()) return alert("Sala não encontrada!");

        const data = snapshot.val();
        if (data.status === "PLAYING") {
            const existingPlayers = Object.values(data.players || {}).filter((p: any) => p !== null && p !== undefined);
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
        const existingPlayers = Object.values(players).filter((p: any) => p !== null && p !== undefined);
        const nameFound = existingPlayers.find((p: any) => p.name === NetworkState.localName);

        let targetId = existingPlayers.length;
        let isRejoining = false;

        if (nameFound) {
            targetId = (nameFound as any).id;
            isRejoining = true;
        } else {
            const existingIds = existingPlayers.map((p: any) => p.id);
            targetId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 0;
            if (existingPlayers.length >= 8) return alert("Sala cheia!");
        }

        // Check if another player is already using this avatar
        const selectedAvatar = NetworkState.localAvatar;
        const isAvatarTaken = existingPlayers.some((p: any) => {
            if (isRejoining && p.id === targetId) return false;
            const avFile = (p.avatar || "").split('/').pop();
            const selFile = selectedAvatar.split('/').pop();
            return avFile === selFile;
        });

        if (isAvatarTaken) {
            return alert("Este avatar já foi escolhido por outro jogador na sala! Escolha outro antes de entrar.");
        }

        NetworkState.myPlayerId = targetId;
        NetworkState.currentRoomId = code;
        NetworkState.isHost = (targetId === 0);

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
            pokedexData: myPlayerObj.pokedexData || {},
            activeQuests: [],
            questTrackers: { tilesMovedNoReturn: 0, biomesVisited: [], turnsLostAccumulated: 0, pvpWinsStreak: 0, gymWinsStreak: 0 }
        };

        const updates: any = {};
        updates[`rooms/${code}/players/${NetworkState.myPlayerId}`] = newPlayer;

        const loggedUser = (window as any).loggedUser;
        if (loggedUser) {
            updates[`users/${loggedUser}/rooms/${code}`] = true;
        }

        await update(ref(db), updates);
        
        localStorage.setItem('pkbd_session', JSON.stringify({ roomId: code, id: NetworkState.myPlayerId }));
        NetworkState.isOnline = true;
        this.setupLobbyListener();

        document.getElementById('lobby-status')!.style.display = 'block';
        document.getElementById('lobby-status')!.innerHTML = `Conectado à sala: <b>${code}</b> ${NetworkState.isHost ? '<br>Você é o HOST' : ''}`;
        Setup.showLobbyUIOnly();
    }

    static setupLobbyListener() {
        const playersRef = ref(db, `rooms/${NetworkState.currentRoomId}/players`);
        const statusRef = ref(db, `rooms/${NetworkState.currentRoomId}/status`);

        onValue(playersRef, (snapshot) => {
            const players = snapshot.val();
            if (!players) {
                if (NetworkState.isOnline && !NetworkState.isHost) {
                    alert("A sala foi desfeita pelo Host.");
                    localStorage.removeItem('pkbd_session');
                    setTimeout(() => location.reload(), 3000);
                }
                return;
            }
            
            // Filter nulls/undefineds to handle Firebase sequential array conversion gaps
            NetworkState.lobbyPlayers = Object.values(players).filter((p: any) => p !== null && p !== undefined);

            // Check if local player was removed
            const stillExists = NetworkState.lobbyPlayers.some((p: any) => p.id === NetworkState.myPlayerId);
            if (!stillExists && !NetworkState.isHost && NetworkState.isOnline) {
                alert("Você foi removido da sala pelo Host.");
                localStorage.removeItem('pkbd_session');
                setTimeout(() => location.reload(), 3000);
                return;
            }

            const list = document.getElementById('online-lobby-list')!;
            list.style.display = 'block';

            list.innerHTML = NetworkState.lobbyPlayers.map((p: any) => {
                const avatarFile = (p.avatar || "Red.jpg").split('/').pop();
                let removeBtn = '';
                if (NetworkState.isHost && p.id !== 0) {
                    removeBtn = `<button class="btn btn-danger" style="padding: 2px 6px; font-size: 0.75rem; margin-left: 10px; background: #e74c3c; border: none; border-radius: 4px; color: white;" onclick="window.Network.removePlayer(${p.id})">Remover</button>`;
                }
                return `<div class="lobby-player-item"><img src="/assets/img/Treinadores/${avatarFile}"><span><b>P${p.id + 1}</b>: ${p.name} ${p.id === 0 ? '(HOST)' : ''}${removeBtn}</span></div>`;
            }).join('');
        });

        onValue(statusRef, (snapshot) => {
            const status = snapshot.val();
            if (status === 'PLAYING') { this.initializeGameFromFirebase(); }
        });
    }

    static async removePlayer(playerId: number) {
        if (!NetworkState.isHost) return;
        try {
            const updates: any = {};
            updates[`rooms/${NetworkState.currentRoomId}/players/${playerId}`] = null;
            await update(ref(db), updates);
        } catch (e) {
            console.error("Erro ao remover jogador:", e);
        }
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
            const GameUIObj = (window as any).GameUI || GameUI;
            if (GameUIObj.renderAllLogs) {
                GameUIObj.renderAllLogs();
            }
        }

        if (data.battleLogs) {
            GameState.battleLogs = data.battleLogs;
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

        if (data.cardLogs) {
            GameState.cardLogs = data.cardLogs;
            GameUI.renderCardLogs();
        } else {
            GameState.cardLogs = [];
            GameUI.renderCardLogs();
        }

        const playerArray = Object.values(data.players)
            .filter((pd: any) => pd !== null && pd !== undefined)
            .map((pd: any) => {
                const avatarFile = (pd.avatar || "Red.jpg").split('/').pop();
                const pl = new Player(pd.id, pd.name, avatarFile, true);
                pl.x = pd.x; pl.y = pd.y; pl.gold = pd.gold;

                pl.skipTurns = pd.skipTurns || 0;
                pl.badges = pd.badges || [false, false, false, false, false, false, false, false];
                pl.cards = pd.cards || [];
                pl.effects = pd.effects || {};
                pl.pokedexData = pd.pokedexData || {};
                pl.stats = pd.stats || { cardsUsed: 0, cardsSuffered: 0, effectsReceived: {}, cardsDefended: {}, turnsLost: 0 };
                pl.activeQuests = pd.activeQuests || [];
                pl.questTrackers = pd.questTrackers || { tilesMovedNoReturn: 0, biomesVisited: [], turnsLostAccumulated: 0, pvpWinsStreak: 0, gymWinsStreak: 0 };

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

        // Update local player ID based on name matching
        const me = playerArray.find((p: any) => p.name === NetworkState.localName);
        if (me) {
            NetworkState.myPlayerId = me.id;
            localStorage.setItem('pkbd_session', JSON.stringify({ roomId: NetworkState.currentRoomId, id: me.id }));
            NetworkState.isHost = (me.id === 0);
        }

        if (data.playOrder) {
            playerArray.sort((a: Player, b: Player) => data.playOrder.indexOf(a.id) - data.playOrder.indexOf(b.id));
        } else {
            playerArray.sort((a: Player, b: Player) => a.id - b.id);
        }

        document.getElementById('setup-screen')!.style.display = 'none';
        document.getElementById('game-container')!.style.display = 'flex';
        Game.init(playerArray, MapSystem.size, data.settings);
        this.setupGameLoopListener();

        if (data.status === "FINISHED" && data.winnerId !== undefined) {
            setTimeout(() => {
                Game.triggerVictory(data.winnerId);
            }, 500);
        }
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
                Game.moveVisuals(); // Forçar atualização visual ao mudar o turno
                if (typeof Game.checkTurnControl === 'function') Game.checkTurnControl();
            }
        });

        onValue(ref(db, `rooms/${NetworkState.currentRoomId}/round`), (snapshot) => {
            const round = snapshot.val();
            if (round !== null) {
                Game.round = round;
                Game.updateHUD();
                Game.moveVisuals(); // Forçar atualização visual ao mudar a rodada
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

        onValue(ref(db, `rooms/${NetworkState.currentRoomId}/cardLogs`), (snapshot) => {
            const data = snapshot.val();
            if (data) {
                GameState.cardLogs = data;
                GameUI.renderCardLogs();
            }
        });

        onValue(ref(db, `rooms/${NetworkState.currentRoomId}/players`), (snapshot) => {
            const playersData = snapshot.val();
            if (!playersData) return;

            Object.values(playersData).filter((pd: any) => pd !== null && pd !== undefined).forEach((pd: any) => {
                const localPlayer = Game.players.find((p: any) => p.id == pd.id);
                if (localPlayer) {
                    const isMeAndMyTurn = (localPlayer.id === NetworkState.myPlayerId && Game.canAct && Game.canAct());
                    
                    // Só evita sincronizar x,y se for meu turno E eu já tiver rolado o dado (estiver em movimento)
                    // Caso contrário, sincroniza para corrigir eventuais atrasos ou erros visuais do início do turno
                    const isMoving = isMeAndMyTurn && GameState.hasRolled;

                    if (!isMoving) {
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
                    localPlayer.activeQuests = pd.activeQuests || [];
                    localPlayer.questTrackers = pd.questTrackers || { tilesMovedNoReturn: 0, biomesVisited: [], turnsLostAccumulated: 0, pvpWinsStreak: 0, gymWinsStreak: 0 };

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
                            } else if (remoteTeam.length < localPlayer.team.length) {
                                localPlayer.team.splice(remoteTeam.length);
                            }
                        }
                    }
                }
            });
            Game.updateHUD();
            Game.moveVisuals();
        });

        onValue(ref(db, `rooms/${NetworkState.currentRoomId}/battleLogs`), (snapshot) => {
            const data = snapshot.val();
            if (data) {
                GameState.battleLogs = data;
            }
        });
    }

    static handleRemoteAction(action: any) {
        const Game = (window as any).Game;
        const Battle = (window as any).Battle;

        if (action.playerId === NetworkState.myPlayerId) return;

        switch (action.type) {
            case 'ROLL': Game.animateDice(action.payload.result, action.playerId); break;
            case 'MOVE_ANIMATION': Game.performVisualStep(action.payload.playerId, action.payload.x, action.payload.y); break;
            case 'BATTLE_START': 
                if (Battle.active && Battle.player && Battle.player.id === NetworkState.myPlayerId) {
                    console.warn("BATTLE_START ignorado: Jogador já está em uma batalha local.");
                    return;
                }
                Battle.startFromNetwork(action.payload); 
                break;

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
            case 'BATTLE_END': 
                if (Battle.active && Battle.player && Battle.player.id === action.playerId) {
                    Battle.end(true);
                }
                break;
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

                    if (action.payload.resetPos) {
                        Game.handleTotalDefeat(targetP);
                    }

                    if (targetP.id === NetworkState.myPlayerId) {
                        if (!action.payload.resetPos) NetworkSync.syncPlayerState();
                    }
                }
                break;
        }
    }

    static sendAction(type: string, payload: any) {
        if (!NetworkState.isOnline) return;

        // --- Lógica de Agrupamento (Batching) para Logs e Updates ---
        // Se já houver um item do mesmo tipo no fim da fila, mesclamos para reduzir tráfego e latência.
        if (type === 'LOG' || type === 'BATTLE_UPDATE') {
            const last = NetworkState.actionQueue[NetworkState.actionQueue.length - 1];
            if (last && last.type === type) {
                if (type === 'LOG') {
                    last.payload.msg += "\n" + payload.msg;
                    return;
                }
                if (type === 'BATTLE_UPDATE') {
                    // No caso de Batalha, acumulamos o texto mas sempre mantemos o HP mais recente
                    last.payload.msg += "\n" + payload.msg;
                    if (payload.plyHp !== undefined) last.payload.plyHp = payload.plyHp;
                    if (payload.oppHp !== undefined) last.payload.oppHp = payload.oppHp;
                    return;
                }
            }
        }

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
                if (action.type === 'BATTLE_START') updates['battleActive'] = NetworkState.myPlayerId;
                if (action.type === 'BATTLE_END') updates['battleActive'] = false;

                try {
                    await update(ref(db, `rooms/${NetworkState.currentRoomId}`), updates);
                } catch (e) {
                    console.error("Erro ao enviar ação para a fila: ", e);
                }

                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        NetworkState.isProcessingQueue = false;
    }

    static async syncTurnState() {
        const Game = (window as any).Game;
        if (!NetworkState.isOnline) {
            if (Game && Game.checkTurnControl) Game.checkTurnControl();
            return;
        }
        try {
            const turnSnap = await get(ref(db, `rooms/${NetworkState.currentRoomId}/turn`));
            const turn = turnSnap.val();
            if (turn !== null) {
                Game.turn = turn;
                if (turn === NetworkState.myPlayerId) {
                    Game.turnStarted = false;
                }
            }
            
            const roundSnap = await get(ref(db, `rooms/${NetworkState.currentRoomId}/round`));
            const round = roundSnap.val();
            if (round !== null) {
                Game.round = round;
            }

            const BattleObj = (window as any).Battle;
            if (BattleObj) BattleObj.active = false;

            Game.updateHUD();
            Game.moveVisuals();
            if (Game.checkTurnControl) Game.checkTurnControl();
            
            const GameUIObj = (window as any).GameUI || GameUI;
            if (GameUIObj && GameUIObj.log) GameUIObj.log("🔄 Sincronização manual do turno realizada.");
        } catch (e) {
            console.error("Erro ao sincronizar turno manualmente", e);
        }
    }

    static async syncLogsManually() {
        if (!NetworkState.isOnline) return;
        try {
            const snap = await get(ref(db, `rooms/${NetworkState.currentRoomId}/logs`));
            const logs = snap.val();
            if (logs) {
                GameState.globalLogs = logs;
                const GameUIObj = (window as any).GameUI || GameUI;
                if (GameUIObj.renderAllLogs) {
                    GameUIObj.renderAllLogs();
                }
            }
        } catch (e) {
            console.error("Erro ao sincronizar logs", e);
        }
    }
}