import { supabase, NetworkState } from './SupabaseInit';
import { NetworkSync } from './NetworkSync';
import { Player } from '../../models/Player';
import { MapSystem } from '../../systems/MapSystem';
import { Setup } from '../../core/Setup';
import { GameState } from '../game/GameState';
import { GameUI } from '../game/GameUI';
import { SupabaseDataStore } from './SupabaseDataStore';
import { ConnectionMonitor } from './ConnectionMonitor';
import { Presence } from '../ui/Presence';
import { GameDialog } from '../ui/GameDialog';

export class NetworkActions {
    private static playerRefreshTimer: number | null = null;
    private static playerRefreshSeq: number = 0;

    static checkInput(): boolean {
        const nameInput = document.getElementById('online-player-name') as HTMLInputElement;
        const avSelect = document.getElementById('online-avatar-select') as HTMLSelectElement;
        if (!nameInput.value) { GameDialog.toast("Digite seu nome de treinador!", { tone: 'warning' }); return false; }
        NetworkState.localName = nameInput.value;
        NetworkState.localAvatar = avSelect.value;
        return true;
    }

    static async reconnect() {
        const stored = localStorage.getItem('pkbd_session');
        if (stored) {
            const sess = JSON.parse(stored);
            const { data: roomData, error } = await supabase.from('rooms').select('*, room_players(*)').eq('id', sess.roomId).single();
            if (roomData && !error) {
                const playerData = roomData.room_players.find((p: any) => p.local_index === sess.id);
                if (playerData) {
                    NetworkState.currentRoomId = sess.roomId;
                    NetworkState.currentRoomAlias = roomData.alias;
                    NetworkState.myPlayerId = sess.id;
                    NetworkState.myPlayerIdDb = playerData.id;
                    NetworkState.isHost = (sess.id === 0);
                    NetworkState.isOnline = true;
                    NetworkState.localName = playerData.name;
                    NetworkState.localAvatar = playerData.avatar;

                    if (roomData.status === "waiting") {
                        document.getElementById('setup-screen')!.style.display = 'block';
                        document.getElementById('menu-phase-1')!.style.display = 'none';
                        document.getElementById('online-login')!.style.display = 'none';
                        document.getElementById('menu-phase-online')!.style.display = 'flex';
                        
                        document.getElementById('lobby-status')!.style.display = 'block';
                        document.getElementById('lobby-status')!.innerHTML = `Conectado à sala: <b>${roomData.alias || sess.roomId}</b> ${NetworkState.isHost ? '<br>Você é o HOST' : ''}`;
                        
                        Setup.showLobbyUIOnly();
                        this.setupLobbyListener();
                    } else {
                        document.getElementById('setup-screen')!.style.display = 'none';
                        document.getElementById('game-container')!.style.display = 'flex';
                        this.setupLobbyListener();
                        this.initializeGameFromSupabase();
                    }
                    return;
                }
            }
            localStorage.removeItem('pkbd_session');
            await GameDialog.alert("Sua sessão é inválida ou a partida foi encerrada.", { title: 'Sessão encerrada', okLabel: 'Voltar ao menu' });
            location.reload();
        }
    }

    static async createRoom() {
        if (!this.checkInput()) return;
        await NetworkSync.loadGlobalChampion();

        const customInput = (document.getElementById('custom-room-code') as HTMLInputElement);
        
        const roomAlias = customInput ? customInput.value.trim() : "";
        if (!roomAlias) {
            GameDialog.toast("Digite um apelido para a sala!", { tone: 'warning' });
            return;
        }

        // Criando a sala
        const { data: room, error: roomError } = await supabase.from('rooms').insert([{ status: 'waiting', map_size: 20, alias: roomAlias }]).select().single();
        if (roomError || !room) {
            console.error(roomError);
            if (roomError?.code === '23505') {
                GameDialog.toast("Este apelido de sala já está em uso. Escolha outro.", { tone: 'warning' });
            } else {
                GameDialog.toast("Não foi possível criar a sala. Tente novamente.", { tone: 'danger' });
            }
            return;
        }
        
        const roomCode = room.id;

        NetworkState.currentRoomId = roomCode;
        NetworkState.currentRoomAlias = roomAlias;
        NetworkState.myPlayerId = 0;
        NetworkState.isHost = true;

        const myPlayerObj = new Player(0, NetworkState.localName, NetworkState.localAvatar, false);

        // Inserir Player 0
        const { data: playerDb, error: playerError } = await supabase.from('room_players').insert([{
            room_id: roomCode,
            local_index: 0,
            name: myPlayerObj.name,
            avatar: NetworkState.localAvatar,
            gold: myPlayerObj.gold,
            x: 0, y: 0
        }]).select().single();

        if (playerError || !playerDb) return GameDialog.toast("Não foi possível entrar na sala. Tente novamente.", { tone: 'danger' });
        NetworkState.myPlayerIdDb = playerDb.id;

        MapSystem.generate(20);

        localStorage.setItem('pkbd_session', JSON.stringify({ roomId: roomCode, id: 0 }));
        NetworkState.isOnline = true;
        this.setupLobbyListener();

        document.getElementById('lobby-status')!.style.display = 'block';
        document.getElementById('lobby-status')!.innerHTML = `Sala Criada!<br><span style="font-size:14px; font-weight:bold;">${roomAlias}</span><br>Você é o HOST`;
        document.getElementById('host-controls')!.style.display = 'block';
    }

    static async joinRoom(roomCode?: string) {
        if (!this.checkInput()) return;
        const code = (roomCode || (document.getElementById('room-code-input') as HTMLInputElement).value).trim();
        if (!code) return GameDialog.toast("Digite o apelido da sala!", { tone: 'warning' });

        const { data: roomData, error } = await supabase.from('rooms').select('*, room_players(*)').eq('alias', code).single();
        if (error || !roomData) return GameDialog.toast("Sala não encontrada. Verifique o apelido.", { tone: 'danger' });

        if (roomData.status === "playing") {
            const found = roomData.room_players.find((p: any) => p.name === NetworkState.localName);
            if (found) {
                NetworkState.myPlayerId = found.local_index;
                NetworkState.myPlayerIdDb = found.id;
                NetworkState.currentRoomId = roomData.id;
                NetworkState.currentRoomAlias = roomData.alias;
                NetworkState.isHost = (NetworkState.myPlayerId === 0);
                localStorage.setItem('pkbd_session', JSON.stringify({ roomId: roomData.id, id: NetworkState.myPlayerId }));
                NetworkState.isOnline = true;
                this.setupLobbyListener();
                this.initializeGameFromSupabase();
                return;
            } else {
                return GameDialog.toast("A partida já começou e seu nome não está na lista.", { tone: 'danger' });
            }
        }

        const existingPlayers = roomData.room_players || [];
        const nameFound = existingPlayers.find((p: any) => p.name === NetworkState.localName);

        let targetId = existingPlayers.length;
        if (nameFound) {
            targetId = nameFound.local_index;
        } else {
            const existingIds = existingPlayers.map((p: any) => p.local_index);
            targetId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 0;
            if (existingPlayers.length >= 8) return GameDialog.toast("Sala cheia!", { tone: 'warning' });
        }

        const isAvatarTaken = existingPlayers.some((p: any) => {
            if (nameFound && p.local_index === targetId) return false;
            const avFile = (p.avatar || "").split('/').pop();
            const selFile = NetworkState.localAvatar.split('/').pop();
            return avFile === selFile;
        });

        if (isAvatarTaken) return GameDialog.toast("Este avatar já foi escolhido por outro jogador.", { tone: 'warning' });

        NetworkState.myPlayerId = targetId;
        NetworkState.currentRoomId = roomData.id;
        NetworkState.currentRoomAlias = roomData.alias;
        NetworkState.isHost = (targetId === 0);

        const myPlayerObj = new Player(targetId, NetworkState.localName, NetworkState.localAvatar, false);

        if (!nameFound) {
            const { data: playerDb } = await supabase.from('room_players').insert([{
                room_id: roomData.id,
                local_index: targetId,
                name: myPlayerObj.name,
                avatar: NetworkState.localAvatar,
                gold: myPlayerObj.gold,
                x: 0, y: 0
            }]).select().single();
            if (playerDb) NetworkState.myPlayerIdDb = playerDb.id;
        } else {
            NetworkState.myPlayerIdDb = nameFound.id;
        }

        localStorage.setItem('pkbd_session', JSON.stringify({ roomId: roomData.id, id: NetworkState.myPlayerId }));
        NetworkState.isOnline = true;
        this.setupLobbyListener();

        document.getElementById('lobby-status')!.style.display = 'block';
        document.getElementById('lobby-status')!.innerHTML = `Conectado à sala: <b>${roomData.alias}</b> ${NetworkState.isHost ? '<br>Você é o HOST' : ''}`;
        Setup.showLobbyUIOnly();
    }

    // Entra como espectador: não cria jogador na sala, não salva sessão e nunca grava no banco
    static async spectateRoom(roomId: string) {
        if (!roomId) return;
        const { data: roomData, error } = await supabase.from('rooms').select('id, alias, status').eq('id', roomId).single();
        if (error || !roomData) return GameDialog.toast("Partida não encontrada!", { tone: 'danger' });
        if (roomData.status !== 'playing') return GameDialog.toast("Essa partida não está mais em andamento.", { tone: 'warning' });

        NetworkState.isSpectator = true;
        NetworkState.isHost = false;
        NetworkState.myPlayerId = -1;
        NetworkState.myPlayerIdDb = "";
        NetworkState.currentRoomId = roomData.id;
        NetworkState.currentRoomAlias = roomData.alias;
        NetworkState.isOnline = true;

        await this.initializeGameFromSupabase();
    }

    static leaveSpectator() {
        location.reload();
    }

    private static showSpectatorBanner() {
        if (document.getElementById('spectator-banner')) return;
        const banner = document.createElement('div');
        banner.id = 'spectator-banner';
        banner.className = 'spectator-banner';
        banner.setAttribute('role', 'status');
        const label = document.createElement('span');
        label.textContent = `👁️ Modo espectador · ${NetworkState.currentRoomAlias || 'Partida'} · cartas ocultas`;
        const leave = document.createElement('button');
        leave.type = 'button';
        leave.textContent = 'Sair';
        leave.onclick = () => this.leaveSpectator();
        banner.append(label, leave);
        document.body.appendChild(banner);
    }

    static setupLobbyListener() {
        supabase.channel(`lobby:${NetworkState.currentRoomId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${NetworkState.currentRoomId}` }, async () => {
                const { data: players } = await supabase.from('room_players').select('*').eq('room_id', NetworkState.currentRoomId);
                if (!players) return;
                NetworkState.lobbyPlayers = players.sort((a: any,b: any) => a.local_index - b.local_index);

                const stillExists = NetworkState.lobbyPlayers.some((p: any) => p.local_index === NetworkState.myPlayerId);
                if (!stillExists && !NetworkState.isHost && NetworkState.isOnline) {
                    localStorage.removeItem('pkbd_session');
                    await GameDialog.alert("O anfitrião removeu você da sala.", { title: 'Você saiu da sala', okLabel: 'Voltar ao menu' });
                    location.reload();
                    return;
                }

                const list = document.getElementById('online-lobby-list')!;
                list.style.display = 'block';

                list.innerHTML = NetworkState.lobbyPlayers.map((p: any) => {
                    const avatarFile = (p.avatar || "Red.jpg").split('/').pop();
                    let removeBtn = '';
                    if (NetworkState.isHost && p.local_index !== 0) {
                        removeBtn = `<button class="btn btn-danger" style="padding: 2px 6px; font-size: 0.75rem; margin-left: 10px; background: #e74c3c; border: none; border-radius: 4px; color: white;" onclick="window.Network.removePlayer(${p.local_index})">Remover</button>`;
                    }
                    return `<div class="lobby-player-item"><img src="/assets/img/Treinadores/${avatarFile}"><span><b>P${p.local_index + 1}</b>: ${p.name} ${p.local_index === 0 ? '(HOST)' : ''}${removeBtn}</span></div>`;
                }).join('');
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${NetworkState.currentRoomId}` }, (payload) => {
                if (payload.new.status === 'playing') { this.initializeGameFromSupabase(); }
            }).subscribe();
    }

    static async removePlayer(playerId: number) {
        if (!NetworkState.isHost) return;
        await supabase.from('room_players').delete().eq('room_id', NetworkState.currentRoomId).eq('local_index', playerId);
    }

    static async initializeGameFromSupabase() {
        const Game = (window as any).Game;
        await NetworkSync.loadGlobalChampion();
        
        // Removido o update do Host para playing, pois o Setup já faz isso e causa loop infinito
        
        const { data: roomData } = await supabase
            .from('rooms')
            .select('*, room_players(*, player_pokemons(*), player_items(*), player_cards(*), player_badges(*), player_effects(*), player_stats(*), player_pokedex(*))')
            .eq('id', NetworkState.currentRoomId)
            .single();
        if (!roomData) return;

        Game.turn = roomData.current_turn !== undefined ? roomData.current_turn : 0;
        Game.round = roomData.current_round || 1;
        const boardState = await SupabaseDataStore.loadBoard(roomData);
        Game.settings = boardState.settings;
        Game.activeGyms = boardState.activeGyms;
        Game.gymTeams = boardState.gymTeams;
        const eventState = SupabaseDataStore.eventFromRoom(roomData);
        Game.currentGlobalEvent = eventState.currentGlobalEvent;
        Game.eventEndRound = eventState.eventEndRound;

        // Fetch logs
        const { data: logsData } = await supabase.from('room_logs').select('*').eq('room_id', NetworkState.currentRoomId).order('created_at', { ascending: false }).limit(200);
        if (logsData) {
            Game.globalLogs = logsData.map((row: any) => SupabaseDataStore.logFromRow(row));
            const GameUIObj = (window as any).GameUI || GameUI;
            if (GameUIObj.renderAllLogs) GameUIObj.renderAllLogs();
        }

        const playerArray = SupabaseDataStore.hydratePlayers(roomData.room_players || []);
        GameState.cardLogs = await SupabaseDataStore.loadCardLogs(NetworkState.currentRoomId);
        GameState.lixeira = await SupabaseDataStore.loadDiscardPile(NetworkState.currentRoomId);

        document.getElementById('setup-screen')!.style.display = 'none';
        document.getElementById('game-container')!.style.display = 'flex';
        Game.init(playerArray, MapSystem.size, boardState.settings);
        (window as any).Cinematics?.loading();
        this.setupGameLoopListener();
        if (NetworkState.isSpectator) this.showSpectatorBanner();
    }

    static setupGameLoopListener() {
        const Game = (window as any).Game;
        if (NetworkState.isListenerActive) return;
        NetworkState.isListenerActive = true;

        const channel = supabase.channel(`room:${NetworkState.currentRoomId}`, { config: { broadcast: { self: false } } });
        const refreshPlayerTables = ['player_pokemons', 'player_items', 'player_cards', 'player_badges', 'player_effects', 'player_stats', 'player_pokedex'];

        channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${NetworkState.currentRoomId}` }, (payload) => {
                const newRecord = payload.new;
                if (newRecord.current_turn !== undefined && newRecord.current_turn !== Game.turn) {
                    Game.turn = newRecord.current_turn;
                    Game.updateHUD();
                    Game.moveVisuals();
                    if (typeof Game.checkTurnControl === 'function') Game.checkTurnControl();
                }
                if (newRecord.current_round !== undefined && newRecord.current_round !== Game.round) {
                    Game.round = newRecord.current_round;
                    Game.updateHUD();
                    Game.moveVisuals();
                    if (typeof Game.checkTurnControl === 'function') Game.checkTurnControl();
                }
                // Evento global: quem sorteia/troca o evento (nextTurn, carta Mudança Global, admin) grava no rooms;
                // sem isto os outros clientes só viam o evento novo depois de recarregar a página
                if (newRecord.current_event_id !== undefined || newRecord.event_end_round !== undefined) {
                    const ev = SupabaseDataStore.eventFromRoom(newRecord);
                    if ((ev.currentGlobalEvent?.id ?? null) !== (Game.currentGlobalEvent?.id ?? null) || ev.eventEndRound !== Game.eventEndRound) {
                        Game.currentGlobalEvent = ev.currentGlobalEvent;
                        Game.eventEndRound = ev.eventEndRound;
                        Game.updateHUD();
                    }
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${NetworkState.currentRoomId}` }, () => {
                this.schedulePlayerRefresh();
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'room_players', filter: `room_id=eq.${NetworkState.currentRoomId}` }, (payload) => {
                const pData = payload.new;
                const localPlayer = Game.players.find((p: any) => p.id === pData.local_index);
                
                if (localPlayer) {
                    const isMeAndMyTurn = (localPlayer.id === NetworkState.myPlayerId && Game.canAct && Game.canAct());
                    if (isMeAndMyTurn && (GameState.turnStarted || GameState.hasRolled)) return;
                    const isMoving = isMeAndMyTurn && GameState.hasRolled;

                    let posChanged = false;
                    if (!isMoving && (localPlayer.x !== pData.x || localPlayer.y !== pData.y)) {
                        localPlayer.x = pData.x;
                        localPlayer.y = pData.y;
                        posChanged = true;
                    }
                    
                    let statsChanged = false;
                    if (localPlayer.gold !== pData.gold || localPlayer.skipTurns !== pData.skip_turns) {
                        localPlayer.gold = pData.gold;
                        localPlayer.skipTurns = pData.skip_turns;
                        statsChanged = true;
                    }

                    if (statsChanged) Game.updateHUD();
                    if (posChanged) Game.moveVisuals();
                }
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_logs', filter: `room_id=eq.${NetworkState.currentRoomId}` }, (payload) => {
                const logData = payload.new;
                const logObj = SupabaseDataStore.logFromRow(logData);
                const isDuplicate = Game.globalLogs.some((l: any) => l.text === logObj.text && l.timestamp === logObj.timestamp);
                if (!isDuplicate) {
                    Game.globalLogs.unshift(logObj);
                    if (Game.globalLogs.length > 200) Game.globalLogs.pop();
                    const GameUIObj = (window as any).GameUI || GameUI;
                    if (GameUIObj.renderAllLogs) GameUIObj.renderAllLogs();
                }
            });
            
        // Mock remote action handler via Supabase broadcast
            channel.on('broadcast', { event: 'game_action' }, (payload) => {
                this.handleRemoteAction(payload.payload);
            });

        refreshPlayerTables.forEach(table => {
            channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
                this.schedulePlayerRefresh();
            });
        });
            
        // Reconexão transparente: o monitor recria o canal e ressincroniza quando a conexão volta
        ConnectionMonitor.watch(channel, {
            resubscribe: () => this.setupGameLoopListener(),
            resync: () => this.resyncAll()
        });
        channel.subscribe((status) => ConnectionMonitor.handleStatus(channel, status));
    }

    // Ressincronização completa após reconexão (turno, jogadores e logs)
    static async resyncAll() {
        if (!NetworkState.isOnline || !NetworkState.currentRoomId) return;
        await Promise.all([
            this.syncTurnState(),
            this.refreshPlayersFromSupabase(),
            this.syncLogsManually(),
            this.syncCardLogsManually()
        ]);
    }

    private static schedulePlayerRefresh() {
        if (this.playerRefreshTimer !== null) window.clearTimeout(this.playerRefreshTimer);
        this.playerRefreshTimer = window.setTimeout(() => {
            this.playerRefreshTimer = null;
            this.refreshPlayersFromSupabase();
        }, 150);
    }

    private static async refreshPlayersFromSupabase() {
        const Game = (window as any).Game;
        if (!NetworkState.isOnline || !NetworkState.currentRoomId || !Game?.players) return;
        const requestSeq = ++this.playerRefreshSeq;

        const { data: roomData } = await supabase
            .from('rooms')
            .select('room_players(*, player_pokemons(*), player_items(*), player_cards(*), player_badges(*), player_effects(*), player_stats(*), player_pokedex(*))')
            .eq('id', NetworkState.currentRoomId)
            .single();

        if (!roomData?.room_players) return;
        // Uma resposta mais antiga que chega depois de uma mais nova não pode sobrescrever o estado
        if (requestSeq !== this.playerRefreshSeq) return;

        const refreshedPlayers = SupabaseDataStore.hydratePlayers(roomData.room_players);
        const iAmActing = Game.canAct && Game.canAct();
        const keepLocalPlayer = iAmActing && (GameState.turnStarted || GameState.hasRolled);
        const BattleObj = (window as any).Battle;
        const isMyBattle = iAmActing && BattleObj?.active && BattleObj.player?.id === NetworkState.myPlayerId;

        refreshedPlayers.forEach((refreshed: any, idx: number) => {
            const local = Game.players.find((player: any) => player.id === refreshed.id);
            if (!local) return;
            const isMe = refreshed.id === NetworkState.myPlayerId;
            const isBattleParticipant = isMyBattle && (refreshed.id === BattleObj.player?.id || refreshed.id === BattleObj.enemyPlayer?.id);
            // Mantém o objeto local quando ele é a fonte da verdade: meu turno, minha batalha ou gravação ainda pendente
            if ((isMe && keepLocalPlayer) || isBattleParticipant || NetworkSync.hasPendingSave(refreshed.id)) {
                refreshedPlayers[idx] = (isBattleParticipant && refreshed.id === BattleObj.enemyPlayer?.id) ? BattleObj.enemyPlayer : local;
            }
        });
        Game.players = refreshedPlayers;
        GameState.players = refreshedPlayers;
        Game.updateHUD();
        Game.moveVisuals();
    }

    // Mantido intacto da versão anterior para não quebrar lógicas de Batalha
    static handleRemoteAction(action: any) {
        const Game = (window as any).Game;
        const Battle = (window as any).Battle;

        if (action.playerId === NetworkState.myPlayerId) return;

        switch (action.type) {
            case 'ROLL':
                GameState.bonusMovement = Number(action.payload?.bonus) > 0 ? Number(action.payload.bonus) : 0;
                Game.animateDice(action.payload.result, action.playerId);
                break;
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
                    if (action.payload.nextOpp.happiness !== undefined) newOpp.happiness = Number(action.payload.nextOpp.happiness);
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
                    if (action.payload.nextPly.happiness !== undefined) newPly.happiness = Number(action.payload.nextPly.happiness);
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
            case 'LOG': break;
            case 'SHOW_ALERT': Game.showGlobalAlert(action.payload.msg, action.payload.playerName, false, action.payload.endsTurn !== false); break;
            case 'CLOSE_ALERT':
                // Um aviso antigo confirmado depois que a vez passou não pode fechar o aviso do jogador atual
                if (action.playerId === GameState.turn) Game.closeGlobalAlert();
                break;
            case 'GAME_WIN': Game.triggerVictory(action.payload.winnerId); break;
            case 'EMOTE': Presence.showEmote(action.playerId, action.payload?.emoji); break;
            case 'CELEBRATE': (window as any).Cinematics?.fromRemote?.(action.payload, action.playerId); break;
            case 'CARD_FX':
            case 'ITEM_FX': (window as any).UseFx?.fromRemote?.(action.type, action.payload, action.playerId); break;
            case 'BOARD_FX': {
                const board = (window as any).PBBoard;
                const fx = action.payload || {};
                if (!board || !Number.isFinite(fx.x) || !Number.isFinite(fx.y)) break;
                if (fx.kind === 'land') board.onLand?.(fx.x, fx.y, fx.type, !!fx.pvp);
                break;
            }
            case 'PRESENCE': Presence.showStatus(action.playerId, action.payload?.status ?? null); break;

            case 'PVP_SYNC_DAMAGE': {
                // Receptor passivo: só atualiza memória e tela. Quem grava no Supabase é o dono do turno.
                const targetP = Game.players.find((p: any) => p.id === action.payload.targetId);
                const winnerP = action.payload.winnerId !== undefined ? Game.players.find((p: any) => p.id === action.payload.winnerId) : null;

                const applyTeam = (player: any, team: any[] | undefined) => {
                    if (!player || !team) return;
                    team.forEach((remoteMon: any, idx: number) => {
                        if (!player.team[idx]) return;
                        Object.assign(player.team[idx], remoteMon);
                    });
                };

                if (winnerP) {
                    if (action.payload.winnerGold !== undefined) winnerP.gold = action.payload.winnerGold;
                    if (action.payload.winnerBadges !== undefined) winnerP.badges = action.payload.winnerBadges;
                    applyTeam(winnerP, action.payload.winnerTeam);
                }

                if (targetP) {
                    applyTeam(targetP, action.payload.team);
                    if (action.payload.gold !== undefined) targetP.gold = action.payload.gold;
                    if (action.payload.badges !== undefined) targetP.badges = action.payload.badges;
                    if (action.payload.x !== undefined) targetP.x = action.payload.x;
                    if (action.payload.y !== undefined) targetP.y = action.payload.y;
                    if (action.payload.skipTurns !== undefined) targetP.skipTurns = action.payload.skipTurns;

                    if (action.payload.resetPos) {
                        // NUNCA chamar handleTotalDefeat aqui: ele reaplicaria +2 turnos e dispararia gravações deste cliente
                        const msg = `🚑 ${targetP.name} sofreu uma derrota total!\nSerá levado ao último Centro Pokémon para recuperação emergencial.`;
                        Game.showGlobalAlert(msg, action.payload.winnerId !== undefined && winnerP ? winnerP.name : targetP.name, false, false);
                        Game.moveVisuals();
                    }
                }

                Game.updateHUD();
                break;
            }
        }
    }

    static sendAction(type: string, payload: any) {
        if (!NetworkState.isOnline || NetworkState.isSpectator) return;

        // Migrado para Supabase Broadcast
        const actionData = { type, payload, playerId: NetworkState.myPlayerId, timestamp: Date.now() };
        supabase.channel(`room:${NetworkState.currentRoomId}`).send({
            type: 'broadcast',
            event: 'game_action',
            payload: actionData
        });
    }

    static async processQueue() {
        // Obsoleto no Supabase Broadcast, mantido vazio para retrocompatibilidade
    }

    static async syncTurnState() {
        const Game = (window as any).Game;
        if (!NetworkState.isOnline) return;
        const { data } = await supabase.from('rooms').select('current_turn, current_round, current_event_id, event_end_round').eq('id', NetworkState.currentRoomId).single();
        if (data) {
            Game.turn = data.current_turn;
            Game.round = data.current_round;
            const ev = SupabaseDataStore.eventFromRoom(data);
            Game.currentGlobalEvent = ev.currentGlobalEvent;
            Game.eventEndRound = ev.eventEndRound;
            Game.updateHUD();
            Game.moveVisuals();
            if (Game.checkTurnControl) Game.checkTurnControl();
        }
    }

    static async syncLogsManually() {
        if (!NetworkState.isOnline) return;
        const { data } = await supabase.from('room_logs').select('*').eq('room_id', NetworkState.currentRoomId).order('created_at', { ascending: false }).limit(200);
        if (data) {
            GameState.globalLogs = data.map((row: any) => SupabaseDataStore.logFromRow(row));
            const GameUIObj = (window as any).GameUI || GameUI;
            if (GameUIObj.renderAllLogs) {
                GameUIObj.renderAllLogs();
            }
        }
    }

    static async syncCardLogsManually() {
        if (!NetworkState.isOnline) return;
        const logs = await SupabaseDataStore.loadCardLogs(NetworkState.currentRoomId);
        GameState.cardLogs = logs;
        const GameUIObj = (window as any).GameUI || GameUI;
        if (GameUIObj.renderCardLogs) {
            GameUIObj.renderCardLogs();
        }
    }
}
