import { TRAINER_IMAGES } from '../constants/trainerImages';
import { Player } from '../models/Player';
import { Game } from './Game';
import { Network, db as supabase } from '../systems/Network';
import { MapSystem } from '../systems/MapSystem';
import { SupabaseDataStore } from '../modules/network/SupabaseDataStore';
import { GameSpawns } from '../modules/game/GameSpawns';

export class Setup {
    static showOfflineSetup() { document.getElementById('menu-phase-1')!.style.display = 'none'; document.getElementById('menu-phase-setup')!.style.display = 'block'; }
    static showOnlineLogin() { document.getElementById('menu-phase-1')!.style.display = 'none'; document.getElementById('online-login')!.style.display = 'block'; }
    static showOnlineMenu() { document.getElementById('online-login')!.style.display = 'none'; document.getElementById('menu-phase-online')!.style.display = 'block'; const sel = document.getElementById('online-avatar-select') as HTMLSelectElement; if (sel && sel.options.length === 0) { sel.innerHTML = TRAINER_IMAGES.map(img => `<option value="${img.file}">${img.label}</option>`).join(''); } this.updateOnlinePreview(); }
    
    static async updateOnlinePreview() {
        const sel = document.getElementById('online-avatar-select') as HTMLSelectElement;
        const img = document.getElementById('online-avatar-preview') as HTMLImageElement;
        if (sel && img && sel.value) {
            img.src = `/assets/img/Treinadores/${sel.value}`;
        }

        if (Network.isOnline && Network.currentRoomId) {
            const players = Network.lobbyPlayers || [];
            const isAvatarTaken = players.some((p: any) => {
                if (p.local_index === Network.myPlayerId) return false;
                const avFile = (p.avatar || "").split('/').pop();
                const selFile = sel.value.split('/').pop();
                return avFile === selFile;
            });

            if (isAvatarTaken) {
                alert("Este avatar já foi escolhido por outro jogador! Escolha outro.");
                const me = players.find((p: any) => p.local_index === Network.myPlayerId);
                if (me && me.avatar) {
                    const avFile = me.avatar.split('/').pop();
                    sel.value = avFile || "Red.png";
                    img.src = `/assets/img/Treinadores/${avFile || "Red.png"}`;
                }
                return;
            }

            try {
                await supabase.from('room_players').update({ avatar: sel.value }).eq('room_id', Network.currentRoomId).eq('local_index', Network.myPlayerId);
            } catch (e) {
                console.error("Erro ao atualizar avatar no lobby:", e);
            }
        }
    }
    
    static showLobbyUIOnly() { 
        const ctrl = document.getElementById('online-lobby-controls'); 
        if (ctrl) ctrl.style.display = 'none'; 
        const hc = document.getElementById('host-controls'); 
        if (hc) hc.style.display = Network.isHost ? 'block' : 'none'; 
    }
    static showSetupScreen() { document.getElementById('menu-phase-online')!.style.display = 'none'; document.getElementById('menu-phase-setup')!.style.display = 'block'; }
    static updateSlots() { const numInput = document.getElementById('num-players') as HTMLSelectElement; if (!numInput) return; const n = parseInt(numInput.value); const c = document.getElementById('player-slots-container')!; c.innerHTML = ''; const defs = ["Ash", "Gary", "Misty", "Brock", "May", "Dawn", "Serena", "Goh"]; for (let i = 0; i < n; i++) { const defImg = TRAINER_IMAGES[i % TRAINER_IMAGES.length].file; const opts = TRAINER_IMAGES.map(img => `<option value="${img.file}" ${img.file === defImg ? 'selected' : ''}>${img.label}</option>`).join(''); c.innerHTML += `<div class="setup-row"><strong>P${i + 1}</strong><input type="text" id="p${i}-name" value="${defs[i] || 'Player'}" style="width:100px;"><div class="avatar-selection"><img id="p${i}-preview" src="/assets/img/Treinadores/${defImg}" class="avatar-preview"><select id="p${i}-av" onchange="window.Setup.updatePreview(${i})">${opts}</select></div></div>`; } }
    static updatePreview(i: number) { (document.getElementById(`p${i}-preview`) as HTMLImageElement).src = `/assets/img/Treinadores/${(document.getElementById(`p${i}-av`) as HTMLSelectElement).value}`; }

    static async loginOnline() {
        const usernameInput = document.getElementById('login-username') as HTMLInputElement;
        const passwordInput = document.getElementById('login-password') as HTMLInputElement;
        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) return alert("Preencha nickname e senha!");

        // Sem tabela 'users' migrada, aceitamos o login diretamente (mock local)
        (window as any).loggedUser = username;

        this.showOnlineMenu();

        const nameInput = document.getElementById('online-player-name') as HTMLInputElement;
        if (nameInput) {
            nameInput.value = username;
            nameInput.disabled = true;
        }
    }

    static async openUserRoomsHub() {
        const username = (window as any).loggedUser;
        if (!username) return alert("Erro: Usuário não está logado!");

        const modal = document.getElementById('rooms-hub-modal')!;
        const title = document.getElementById('rooms-hub-title')!;
        const containerDiv = document.getElementById('rooms-hub-container')!;

        title.innerText = "🎮 Minhas Salas em Andamento";
        containerDiv.innerHTML = '<p style="text-align:center; font-size: 0.9rem; color: #fff;">Buscando suas salas no Supabase...</p>';
        modal.style.display = 'flex';

        // Busca salas do Supabase onde o jogador tenha o nome atual e a sala esteja "playing"
        const { data: playerRows } = await supabase.from('room_players').select('room_id').eq('name', username);
        if (playerRows && playerRows.length > 0) {
            const roomIds = playerRows.map((r: any) => r.room_id);
            const { data: rooms } = await supabase.from('rooms').select('*, room_players(*)').in('id', roomIds).eq('status', 'playing');
            
            if (rooms && rooms.length > 0) {
                containerDiv.innerHTML = rooms.map((room: any) => {
                    const hostName = room.room_players && room.room_players.find((p: any) => p.local_index === 0)?.name || "Desconhecido";
                    const round = room.current_round || 1;
                    const playerCount = room.room_players.length;

                    return `
                    <div style="background: #34495e; padding: 15px; border-radius: 8px; border: 1px solid #7f8c8d; text-align: left; position: relative; margin-bottom: 10px;">
                        <h4 style="margin: 0 0 5px 0; color: #f1c40f;">Sala: <span style="font-size:14px">[${room.alias || room.id}]</span></h4>
                        <p style="margin: 0 0 3px 0; font-size: 0.85rem; color: #ecf0f1;">👤 <b>Host:</b> ${hostName}</p>
                        <p style="margin: 0 0 3px 0; font-size: 0.85rem; color: #ecf0f1;">👥 <b>Jogadores:</b> ${playerCount}/8</p>
                        <p style="margin: 0 0 10px 0; font-size: 0.85rem; color: #ecf0f1;">🔄 <b>Rodada Atual:</b> ${round}</p>
                        <button class="btn" style="background:#8e44ad; padding:8px; margin:0; width: 100%; font-size: 0.9rem;" onclick="document.getElementById('rooms-hub-modal').style.display='none'; window.Network.joinRoom('${room.alias || room.id}')">Reconectar</button>
                    </div>`;
                }).join('');
            } else {
                containerDiv.innerHTML = '<p style="text-align:center; font-size: 0.9rem; color: #fff;">Nenhuma sala em andamento.</p>';
            }
        } else {
            containerDiv.innerHTML = '<p style="text-align:center; font-size: 0.9rem; color: #fff;">Nenhuma sala em andamento.</p>';
        }
    }

    static async openSearchHub() {
        const modal = document.getElementById('rooms-hub-modal')!;
        const title = document.getElementById('rooms-hub-title')!;
        const containerDiv = document.getElementById('rooms-hub-container')!;

        title.innerText = "🔍 Partidas Abertas";
        containerDiv.innerHTML = '<p style="text-align:center; font-size: 0.9rem; color: #fff;">Buscando partidas no Supabase...</p>';
        modal.style.display = 'flex';

        const { data: rooms } = await supabase.from('rooms').select('*, room_players(*)').eq('status', 'waiting');

        if (rooms && rooms.length > 0) {
            const openRooms = rooms.filter((room: any) => (room.room_players || []).length < 8);
            
            if (openRooms.length > 0) {
                containerDiv.innerHTML = openRooms.map((r: any) => {
                    const hostName = r.room_players && r.room_players.find((p: any) => p.local_index === 0)?.name || "Desconhecido";
                    const playerCount = r.room_players ? r.room_players.length : 0;
                    return `
                    <div style="background: #34495e; padding: 15px; border-radius: 8px; border: 1px solid #7f8c8d; text-align: left; position: relative; margin-bottom: 10px;">
                        <h4 style="margin: 0 0 5px 0; color: #3498db;">Sala: <span style="font-size:14px">[${r.alias || r.id}]</span></h4>
                        <p style="margin: 0 0 3px 0; font-size: 0.85rem; color: #ecf0f1;">👤 <b>Host:</b> ${hostName}</p>
                        <p style="margin: 0 0 10px 0; font-size: 0.85rem; color: #ecf0f1;">👥 <b>Jogadores:</b> ${playerCount}/8</p>
                        <button class="btn" style="background:#2980b9; padding:8px; margin:0; width: 100%; font-size: 0.9rem;" onclick="document.getElementById('rooms-hub-modal').style.display='none'; window.Network.joinRoom('${r.alias || r.id}')">Entrar na Partida</button>
                    </div>
                `}).join('');
            } else {
                containerDiv.innerHTML = '<p style="text-align:center; font-size: 0.9rem; color: #fff;">Nenhuma partida aberta encontrada.</p>';
            }
        } else {
            containerDiv.innerHTML = '<p style="text-align:center; font-size: 0.9rem; color: #fff;">Nenhuma partida aberta encontrada.</p>';
        }
    }

    // START OFFLINE
    static start() {
        const n = parseInt((document.getElementById('num-players') as HTMLSelectElement).value);
        const mapSize = parseInt((document.getElementById('map-size') as HTMLSelectElement).value);
        const ps: Player[] = [];
        for (let i = 0; i < n; i++) {
            const p = new Player(i, (document.getElementById(`p${i}-name`) as HTMLInputElement).value, (document.getElementById(`p${i}-av`) as HTMLSelectElement).value, false);
            ps.push(p);
        }

        const gens = Array.from(document.querySelectorAll('#offline-gen-select input:checked')).map(el => parseInt((el as HTMLInputElement).value));
        const leg = (document.getElementById('offline-legendary-rule') as HTMLSelectElement).value as any;
        const mega = (document.getElementById('offline-mega-rule') as HTMLSelectElement).value === 'yes';

        const settings = {
            generations: gens.length > 0 ? gens : [1, 2, 3, 4, 5, 6, 7, 8, 9],
            legendaries: leg,
            megas: mega
        };

        ps.forEach(p => p.assignStarter(settings));

        document.getElementById('setup-screen')!.style.display = 'none';
        document.getElementById('game-container')!.style.display = 'flex';
        Game.init(ps, mapSize, settings);
    }

    // START ONLINE (Host)
    static async startOnlineGame() {
        if (!Network.isHost) return;
        const mapSize = parseInt((document.getElementById('online-map-size') as HTMLSelectElement).value);
        MapSystem.generate(mapSize);

        const gens = Array.from(document.querySelectorAll('#online-gen-select input:checked')).map(el => parseInt((el as HTMLInputElement).value));
        const leg = (document.getElementById('online-legendary-rule') as HTMLSelectElement).value as any;
        const mega = (document.getElementById('online-mega-rule') as HTMLSelectElement).value === 'yes';

        const settings = {
            generations: gens.length > 0 ? gens : [1, 2, 3, 4, 5, 6, 7, 8, 9],
            legendaries: leg,
            megas: mega
        };

        if (supabase) {
            try {
                // Sorteia os starters de todos os jogadores antes do jogo iniciar no DB
                const { data: players, error: fetchErr } = await supabase.from('room_players').select('*').eq('room_id', Network.currentRoomId).order('local_index');
                if (fetchErr) throw fetchErr;
                
                if (players) {
                    // Limpa dados antigos caso o jogo esteja sendo reiniciado na mesma sala
                    const playerIds = players.map(p => p.id);
                    if (playerIds.length > 0) {
                        await supabase.from('player_pokemons').delete().in('player_id', playerIds);
                        await supabase.from('player_items').delete().in('player_id', playerIds);
                        await supabase.from('player_cards').delete().in('player_id', playerIds);
                        await supabase.from('player_badges').delete().in('player_id', playerIds);
                    }

                    // Adiciona o starter e itens/cartas iniciais via Supabase
                    for (const pd of players) {
                        // isLoadMode = false faz o Player gerar os itens e 5 cartas iniciais aleatórias
                        const tempPlayer = new Player(pd.local_index, pd.name, pd.avatar, false);
                        tempPlayer.assignStarter(settings);
                        
                        const starter = tempPlayer.team[0];
                        if (starter) {
                            const { error: insErr } = await supabase.from('player_pokemons').upsert([{
                                player_id: pd.id,
                                slot_index: 0,
                                pokemon_id: starter.id,
                                name: starter.name,
                                current_hp: starter.currentHp,
                                max_hp: starter.maxHp,
                                level: starter.level,
                                current_xp: starter.currentXp,
                                max_xp: starter.maxXp,
                                is_shiny: starter.isShiny,
                                held_item: null,
                                base_total: starter.baseTotal
                            }], { onConflict: 'player_id,slot_index' });
                            if (insErr) { console.error("Erro inserindo pokemon:", insErr); }
                        }

                        // Salva itens iniciais no banco
                        if (tempPlayer.items) {
                            const itemInserts = Object.keys(tempPlayer.items).map(itemName => ({
                                player_id: pd.id,
                                item_id: itemName,
                                quantity: tempPlayer.items[itemName]
                            }));
                            if (itemInserts.length > 0) {
                                await supabase.from('player_items').upsert(itemInserts, { onConflict: 'player_id,item_id' });
                            }
                        }

                        // Salva cartas iniciais no banco
                        if (tempPlayer.cards) {
                            const cardInserts = tempPlayer.cards.map((c: any, index: number) => ({
                                player_id: pd.id,
                                hand_index: index,
                                card_id: c.id,
                                is_protected: false
                            }));
                            if (cardInserts.length > 0) {
                                await supabase.from('player_cards').insert(cardInserts);
                            }
                        }

                        await SupabaseDataStore.replacePokedex(pd.id, tempPlayer.pokedexData || {});
                    }
                }

                if (!Game.activeGyms || Game.activeGyms.length === 0) {
                    const allGyms = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
                    Game.activeGyms = allGyms.sort(() => Math.random() - 0.5).slice(0, 8);
                }
                if (!Game.gymTeams || Object.keys(Game.gymTeams).length === 0) {
                    GameSpawns.generateGymTeams();
                }
                await SupabaseDataStore.saveBoard(Network.currentRoomId, settings, Game.gymTeams, Game.activeGyms);

                const { error: roomErr } = await supabase.from('rooms').update({ 
                    status: "playing",
                    map_size: mapSize,
                    generations: settings.generations,
                    legendaries_rule: settings.legendaries,
                    megas_enabled: settings.megas,
                    current_turn: 0,
                    current_round: 1
                }).eq('id', Network.currentRoomId);
                
                if (roomErr) throw roomErr;
                
            } catch (err: any) {
                console.error(err);
                alert("Erro ao iniciar jogo no Supabase: " + (err.message || JSON.stringify(err)));
            }
        }
    }
}
