import { TRAINER_IMAGES } from '../constants/trainerImages';
import { Player } from '../models/Player';
import { Game } from './Game';
import { Network, db } from '../systems/Network';
import { update, ref, get } from 'firebase/database';
import { MapSystem } from '../systems/MapSystem';

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
            // Check if another player is already using this avatar
            const isAvatarTaken = players.some((p: any) => {
                if (p.id === Network.myPlayerId) return false;
                const avFile = (p.avatar || "").split('/').pop();
                const selFile = sel.value.split('/').pop();
                return avFile === selFile;
            });

            if (isAvatarTaken) {
                alert("Este avatar já foi escolhido por outro jogador! Escolha outro.");
                // Revert to player's previous avatar
                const me = players.find((p: any) => p.id === Network.myPlayerId);
                if (me && me.avatar) {
                    const avFile = me.avatar.split('/').pop();
                    sel.value = avFile || "Red.png";
                    img.src = `/assets/img/Treinadores/${avFile || "Red.png"}`;
                }
                return;
            }

            // Sync the updated avatar with Firebase
            try {
                const updates: any = {};
                updates[`rooms/${Network.currentRoomId}/players/${Network.myPlayerId}/avatar`] = sel.value;
                await update(ref(db), updates);
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

        const userRef = ref(db, `users/${username}`);
        const snap = await get(userRef);

        if (snap.exists()) {
            const data = snap.val();
            if (data.password !== password) {
                return alert("Senha incorreta!");
            }
        } else {
            // Register new user
            const updates: any = {};
            updates[`users/${username}`] = { password: password, rooms: {} };
            await update(ref(db), updates);
            alert("Novo usuário registrado com sucesso!");
        }

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
        if (!username) {
            alert("Erro: Usuário não está logado!");
            return;
        }

        const modal = document.getElementById('rooms-hub-modal')!;
        const title = document.getElementById('rooms-hub-title')!;
        const containerDiv = document.getElementById('rooms-hub-container')!;

        title.innerText = "🎮 Minhas Salas em Andamento";
        containerDiv.innerHTML = '<p style="text-align:center; font-size: 0.9rem; color: #fff;">Buscando suas salas...</p>';
        modal.style.display = 'flex';

        const userRef = ref(db, `users/${username}/rooms`);
        const snap = await get(userRef);

        if (snap.exists()) {
            const rooms = snap.val();
            const roomCodes = Object.keys(rooms);

            const validRooms = [];
            for (const code of roomCodes) {
                const roomSnap = await get(ref(db, `rooms/${code}`));
                if (roomSnap.exists()) {
                    const roomData = roomSnap.val();
                    if (roomData.status !== "FINISHED") {
                        validRooms.push({ code, data: roomData });
                    } else {
                        await update(ref(db), { [`users/${username}/rooms/${code}`]: null });
                    }
                } else {
                    await update(ref(db), { [`users/${username}/rooms/${code}`]: null });
                }
            }

            if (validRooms.length > 0) {
                containerDiv.innerHTML = validRooms.map(room => {
                    const hostName = room.data.players && room.data.players[0] ? room.data.players[0].name : "Desconhecido";
                    const round = room.data.round || 1;
                    const playerCount = Object.keys(room.data.players || {}).length;

                    return `
                    <div style="background: #34495e; padding: 15px; border-radius: 8px; border: 1px solid #7f8c8d; text-align: left; position: relative;">
                        <h4 style="margin: 0 0 5px 0; color: #f1c40f;">Sala: [${room.code}]</h4>
                        <p style="margin: 0 0 3px 0; font-size: 0.85rem; color: #ecf0f1;">👤 <b>Host:</b> ${hostName}</p>
                        <p style="margin: 0 0 3px 0; font-size: 0.85rem; color: #ecf0f1;">👥 <b>Jogadores:</b> ${playerCount}/8</p>
                        <p style="margin: 0 0 10px 0; font-size: 0.85rem; color: #ecf0f1;">🔄 <b>Rodada Atual:</b> ${round}</p>
                        <button class="btn" style="background:#8e44ad; padding:8px; margin:0; width: 100%; font-size: 0.9rem;" onclick="document.getElementById('rooms-hub-modal').style.display='none'; window.Network.joinRoom('${room.code}')">Reconectar</button>
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
        containerDiv.innerHTML = '<p style="text-align:center; font-size: 0.9rem; color: #fff;">Buscando partidas...</p>';
        modal.style.display = 'flex';

        const roomsRef = ref(db, 'rooms');
        const snap = await get(roomsRef);

        if (snap.exists()) {
            const rooms = snap.val();
            const openRooms = [];

            for (const code in rooms) {
                const room = rooms[code];
                if (room.status === 'LOBBY') {
                    const playerCount = Object.keys(room.players || {}).length;
                    if (playerCount < 8) {
                        const hostName = room.players && room.players[0] ? room.players[0].name : "Desconhecido";
                        openRooms.push({ code, hostName, playerCount });
                    }
                }
            }

            if (openRooms.length > 0) {
                containerDiv.innerHTML = openRooms.map(r => `
                    <div style="background: #34495e; padding: 15px; border-radius: 8px; border: 1px solid #7f8c8d; text-align: left; position: relative;">
                        <h4 style="margin: 0 0 5px 0; color: #3498db;">Sala: [${r.code}]</h4>
                        <p style="margin: 0 0 3px 0; font-size: 0.85rem; color: #ecf0f1;">👤 <b>Host:</b> ${r.hostName}</p>
                        <p style="margin: 0 0 10px 0; font-size: 0.85rem; color: #ecf0f1;">👥 <b>Jogadores:</b> ${r.playerCount}/8</p>
                        <button class="btn" style="background:#2980b9; padding:8px; margin:0; width: 100%; font-size: 0.9rem;" onclick="document.getElementById('rooms-hub-modal').style.display='none'; window.Network.joinRoom('${r.code}')">Entrar na Partida</button>
                    </div>
                `).join('');
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

        // Ordem original baseada no registro (quem for entrando na sala)

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

        // Ordem original do lobby mantida

        const updateData: any = {
            status: "PLAYING",
            map: { size: mapSize, grid: MapSystem.grid, gymLocations: MapSystem.gymLocations },
            settings: settings
        };

        // Let's just update the teams in db
        if (db) {
            const snap = await get(ref(db, `rooms/${Network.currentRoomId}/players`));
            if (snap.exists()) {
                const playersData = snap.val();
                const validPlayers = Object.values(playersData).filter((pd: any) => pd !== null && pd !== undefined);

                const playOrder: number[] = [];
                const updatedPlayers: any = {};

                validPlayers.forEach((pd: any, index: number) => {
                    pd.id = index; // Re-index sequentially to avoid gaps
                    const tempPlayer = new Player(index, pd.name, pd.avatar, true); // true = no starter logic
                    tempPlayer.assignStarter(settings);
                    pd.team = tempPlayer.team;
                    pd.pokedexData = Object.assign({}, pd.pokedexData, tempPlayer.pokedexData);

                    updatedPlayers[index] = pd;
                    playOrder.push(index);
                });

                updateData.players = updatedPlayers;
                updateData.playOrder = playOrder;
            }
            await update(ref(db, `rooms/${Network.currentRoomId}`), updateData);
        }
    }
}