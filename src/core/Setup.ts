import { TRAINER_IMAGES } from '../constants/trainerImages';
import { Player } from '../models/Player';
import { Game } from './Game';
import { Network, db as supabase } from '../systems/Network';
import { MapSystem } from '../systems/MapSystem';
import { SupabaseDataStore } from '../modules/network/SupabaseDataStore';
import { GameSpawns } from '../modules/game/GameSpawns';
import { GameState } from '../modules/game/GameState';
import { GameDialog } from '../modules/ui/GameDialog';

export class Setup {
    static showOfflineSetup() { 
        const loginEl = document.getElementById('online-login');
        if (loginEl) loginEl.style.display = 'none';
        const branding = document.getElementById('menu-branding');
        if (branding) branding.style.display = 'block';
        document.getElementById('menu-phase-1')!.style.display = 'none'; 
        document.getElementById('menu-phase-setup')!.style.display = 'flex';
    }
    static checkCachedLogin() {
        const cachedUser = localStorage.getItem('poke_username');
        if (cachedUser) {
            (window as any).loggedUser = cachedUser;
            const nameInput = document.getElementById('online-player-name') as HTMLInputElement;
            if (nameInput) {
                nameInput.value = cachedUser;
                nameInput.disabled = true;
            }
            document.getElementById('online-login')!.style.display = 'none';
            const userDisplay = document.getElementById('logged-user-display');
            if (userDisplay) userDisplay.innerText = cachedUser;
            document.getElementById('menu-phase-1')!.style.display = 'flex';
        }
    }
    static logout() {
        localStorage.removeItem('poke_username');
        location.reload();
    }
    static showOnlineMenu() { document.getElementById('menu-phase-1')!.style.display = 'none'; document.getElementById('menu-phase-online')!.style.display = 'flex'; const sel = document.getElementById('online-avatar-select') as HTMLSelectElement; if (sel && sel.options.length === 0) { sel.innerHTML = TRAINER_IMAGES.map(img => `<option value="${img.file}">${img.label}</option>`).join(''); } this.updateOnlinePreview(); }
    
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
                GameDialog.toast("Este avatar já foi escolhido por outro jogador. Escolha outro.", { tone: 'warning' });
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
    static showSetupScreen() { document.getElementById('menu-phase-online')!.style.display = 'none'; document.getElementById('menu-phase-setup')!.style.display = 'flex'; }
    static updateSlots() { 
        const numInput = document.getElementById('num-players') as HTMLSelectElement; 
        if (!numInput) return; 
        const n = parseInt(numInput.value); 
        const c = document.getElementById('player-slots-container')!; 
        c.innerHTML = ''; 
        const defs = ["Ash", "Gary", "Misty", "Brock", "May", "Dawn", "Serena", "Goh"]; 
        for (let i = 0; i < n; i++) { 
            const defImg = TRAINER_IMAGES[i % TRAINER_IMAGES.length].file; 
            const opts = TRAINER_IMAGES.map(img => `<option value="${img.file}" ${img.file === defImg ? 'selected' : ''}>${img.label}</option>`).join(''); 
            c.innerHTML += `
            <article class="trainer-offline-player-card">
                <div class="trainer-offline-player-topline">
                    <span class="trainer-offline-player-index">${i + 1}</span>
                    <strong>Treinador ${i + 1}</strong>
                    <label class="trainer-offline-cpu-toggle" for="p${i}-cpu"><span>Controlado por bot</span><input type="checkbox" id="p${i}-cpu"><i aria-hidden="true"></i></label>
                </div>
                <div class="trainer-offline-player-fields">
                    <label><span>Nome</span><input type="text" id="p${i}-name" value="${defs[i] || 'Player'}"></label>
                    <label class="trainer-offline-avatar-select"><span>Avatar</span><div><img id="p${i}-preview" src="/assets/img/Treinadores/${defImg}" class="avatar-preview" alt="Avatar de Treinador ${i + 1}"><select id="p${i}-av" onchange="window.Setup.updatePreview(${i})">${opts}</select></div></label>
                </div>
            </article>`;
        } 
    }
    static updatePreview(i: number) { (document.getElementById(`p${i}-preview`) as HTMLImageElement).src = `/assets/img/Treinadores/${(document.getElementById(`p${i}-av`) as HTMLSelectElement).value}`; }

    static clearLoginFeedback() {
        const feedback = document.getElementById('login-feedback');
        const usernameInput = document.getElementById('login-username') as HTMLInputElement | null;
        const passwordInput = document.getElementById('login-password') as HTMLInputElement | null;

        if (feedback) {
            feedback.textContent = '';
            feedback.hidden = true;
        }
        usernameInput?.removeAttribute('aria-invalid');
        passwordInput?.removeAttribute('aria-invalid');
    }

    static toggleLoginPassword() {
        const passwordInput = document.getElementById('login-password') as HTMLInputElement | null;
        const toggle = document.querySelector('.trainer-password-toggle') as HTMLButtonElement | null;
        if (!passwordInput || !toggle) return;

        const isVisible = passwordInput.type === 'text';
        passwordInput.type = isVisible ? 'password' : 'text';
        toggle.setAttribute('aria-pressed', String(!isVisible));
        toggle.setAttribute('aria-label', isVisible ? 'Mostrar senha' : 'Ocultar senha');
        toggle.classList.toggle('is-active', !isVisible);
    }

    static async loginOnline() {
        const usernameInput = document.getElementById('login-username') as HTMLInputElement;
        const passwordInput = document.getElementById('login-password') as HTMLInputElement;
        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            const feedback = document.getElementById('login-feedback');
            const message = !username && !password
                ? 'Informe seu nome de Treinador e sua senha para continuar.'
                : !username
                    ? 'Informe seu nome de Treinador para continuar.'
                    : 'Informe sua senha para continuar.';

            usernameInput.setAttribute('aria-invalid', String(!username));
            passwordInput.setAttribute('aria-invalid', String(!password));
            if (feedback) {
                feedback.textContent = message;
                feedback.hidden = false;
            }
            (!username ? usernameInput : passwordInput).focus();
            return;
        }

        this.clearLoginFeedback();

        // Sem tabela 'users' migrada, aceitamos o login diretamente (mock local)
        (window as any).loggedUser = username;
        localStorage.setItem('poke_username', username);

        document.getElementById('online-login')!.style.display = 'none';
        const userDisplay = document.getElementById('logged-user-display');
        if (userDisplay) userDisplay.innerText = username;
        document.getElementById('menu-phase-1')!.style.display = 'flex';

        const nameInput = document.getElementById('online-player-name') as HTMLInputElement;
        if (nameInput) {
            nameInput.value = username;
            nameInput.disabled = true;
        }
    }

    private static escapeHubText(value: unknown) {
        return String(value ?? '').replace(/[&<>'"]/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[char] || char));
    }

    private static setRoomsHubHeading(titleText: string, subtitleText: string) {
        document.getElementById('rooms-hub-title')!.textContent = titleText;
        document.getElementById('rooms-hub-subtitle')!.textContent = subtitleText;
    }

    private static renderRoomsHubLoading(container: HTMLElement, message: string) {
        container.innerHTML = `<div class="rooms-hub-loading"><span aria-hidden="true"></span><p>${message}</p></div>`;
    }

    private static renderRoomsHubEmpty(container: HTMLElement, title: string, message: string) {
        container.innerHTML = `<div class="rooms-hub-empty"><span class="rooms-hub-empty-mark" aria-hidden="true"></span><h3>${title}</h3><p>${message}</p></div>`;
    }

    private static renderRoomCards(container: HTMLElement, modal: HTMLElement, rooms: any[], type: 'active' | 'open' | 'watch') {
        container.innerHTML = rooms.map((room: any) => {
            const players = room.room_players || [];
            const hostName = players.find((player: any) => player.local_index === 0)?.name || 'Desconhecido';
            const playerCount = players.length;
            const roomCode = String(room.alias || room.id || '');
            const roomName = this.escapeHubText(roomCode);
            const host = this.escapeHubText(hostName);
            const isActive = type === 'active';
            const isWatch = type === 'watch';
            const state = (isActive || isWatch) ? 'Em andamento' : 'Aguardando jogadores';
            const detail = (isActive || isWatch) ? `Rodada ${room.current_round || 1}` : `${playerCount}/8 jogadores`;
            const action = isActive ? 'Reconectar' : isWatch ? 'Assistir' : 'Entrar na sala';
            const target = isWatch ? `data-watch-room="${this.escapeHubText(room.id)}"` : `data-room-code="${roomName}"`;

            return `<article class="rooms-hub-card rooms-hub-card--${type}">
                <header class="rooms-hub-card-header">
                    <div><p>${state}</p><h3>${roomName}</h3></div>
                    <span class="rooms-hub-card-badge">${detail}</span>
                </header>
                <dl class="rooms-hub-card-details">
                    <div><dt>Host</dt><dd>${host}</dd></div>
                    <div><dt>Jogadores</dt><dd>${playerCount}/8</dd></div>
                </dl>
                <button type="button" class="rooms-hub-card-action" ${target}>${action}<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h13M13 7l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            </article>`;
        }).join('');

        container.querySelectorAll<HTMLButtonElement>('[data-room-code]').forEach(button => {
            button.addEventListener('click', () => {
                modal.style.display = 'none';
                Network.joinRoom(button.dataset.roomCode || '');
            });
        });

        container.querySelectorAll<HTMLButtonElement>('[data-watch-room]').forEach(button => {
            button.addEventListener('click', () => {
                modal.style.display = 'none';
                Network.spectateRoom(button.dataset.watchRoom || '');
            });
        });
    }

    private static renderSearchTabs(container: HTMLElement, active: 'open' | 'watch'): HTMLElement {
        container.innerHTML = `<div class="rooms-hub-tabs" role="tablist">
                <button type="button" role="tab" class="rooms-hub-tab${active === 'open' ? ' is-active' : ''}" aria-selected="${active === 'open'}" data-hub-tab="open">Abertas</button>
                <button type="button" role="tab" class="rooms-hub-tab${active === 'watch' ? ' is-active' : ''}" aria-selected="${active === 'watch'}" data-hub-tab="watch">Em andamento</button>
            </div>
            <div class="rooms-hub-tab-panel"></div>`;
        container.querySelectorAll<HTMLButtonElement>('[data-hub-tab]').forEach(button => {
            button.addEventListener('click', () => this.openSearchHub(button.dataset.hubTab as 'open' | 'watch'));
        });
        return container.querySelector('.rooms-hub-tab-panel') as HTMLElement;
    }

    static async openUserRoomsHub() {
        const username = (window as any).loggedUser;
        if (!username) return GameDialog.toast('Você precisa estar logado para ver suas salas.', { tone: 'danger' });

        const modal = document.getElementById('rooms-hub-modal')!;
        const container = document.getElementById('rooms-hub-container')!;
        this.setRoomsHubHeading('Minhas salas', 'Retome uma partida que já está em andamento.');
        this.renderRoomsHubLoading(container, 'Buscando suas partidas...');
        modal.style.display = 'flex';

        try {
            const { data: playerRows, error: playerError } = await supabase.from('room_players').select('room_id').eq('name', username);
            if (playerError) throw playerError;

            if (!playerRows?.length) {
                this.renderRoomsHubEmpty(container, 'Nenhuma partida em andamento', 'Quando você tiver uma sala ativa, ela aparecerá aqui.');
                return;
            }

            const roomIds = playerRows.map((row: any) => row.room_id);
            const { data: rooms, error: roomsError } = await supabase.from('rooms').select('*, room_players(*)').in('id', roomIds).eq('status', 'playing');
            if (roomsError) throw roomsError;

            if (!rooms?.length) {
                this.renderRoomsHubEmpty(container, 'Nenhuma partida em andamento', 'Quando você tiver uma sala ativa, ela aparecerá aqui.');
                return;
            }

            this.renderRoomCards(container, modal, rooms, 'active');
        } catch (error) {
            console.error('Erro ao buscar salas em andamento:', error);
            this.renderRoomsHubEmpty(container, 'Não foi possível carregar as salas', 'Tente novamente em alguns instantes.');
        }
    }

    static async openSearchHub(tab: 'open' | 'watch' = 'open') {
        const modal = document.getElementById('rooms-hub-modal')!;
        const container = document.getElementById('rooms-hub-container')!;
        const isWatch = tab === 'watch';
        this.setRoomsHubHeading(
            isWatch ? 'Partidas em andamento' : 'Partidas abertas',
            isWatch ? 'Assista a uma partida como espectador. As cartas dos jogadores ficam ocultas.' : 'Encontre uma sala disponível e entre na aventura.'
        );
        modal.style.display = 'flex';
        const panel = this.renderSearchTabs(container, tab);
        this.renderRoomsHubLoading(panel, isWatch ? 'Procurando partidas em andamento...' : 'Procurando salas disponíveis...');

        try {
            const { data: rooms, error } = await supabase.from('rooms').select('*, room_players(*)').eq('status', isWatch ? 'playing' : 'waiting').order('created_at', { ascending: false });
            if (error) throw error;

            if (isWatch) {
                const liveRooms = (rooms || []).filter((room: any) => (room.room_players || []).length > 0);
                if (!liveRooms.length) {
                    this.renderRoomsHubEmpty(panel, 'Nenhuma partida em andamento', 'Quando alguém estiver jogando, a partida aparecerá aqui.');
                    return;
                }
                this.renderRoomCards(panel, modal, liveRooms, 'watch');
                return;
            }

            const openRooms = (rooms || []).filter((room: any) => (room.room_players || []).length < 8);
            if (!openRooms.length) {
                this.renderRoomsHubEmpty(panel, 'Nenhuma sala disponível', 'Crie uma sala e convide sua equipe para começar uma partida.');
                return;
            }

            this.renderRoomCards(panel, modal, openRooms, 'open');
        } catch (error) {
            console.error('Erro ao buscar partidas:', error);
            this.renderRoomsHubEmpty(panel, 'Não foi possível buscar partidas', 'Tente novamente em alguns instantes.');
        }
    }

    // START OFFLINE
    static start() {
        Game.reset();
        const n = parseInt((document.getElementById('num-players') as HTMLSelectElement).value);
        const mapSize = parseInt((document.getElementById('map-size') as HTMLSelectElement).value);
        MapSystem.generate(mapSize);
        const ps: Player[] = [];
        for (let i = 0; i < n; i++) {
            const p = new Player(i, (document.getElementById(`p${i}-name`) as HTMLInputElement).value, (document.getElementById(`p${i}-av`) as HTMLSelectElement).value, false);
            const isCPU = (document.getElementById(`p${i}-cpu`) as HTMLInputElement)?.checked || false;
            p.isCPU = isCPU;
            if (isCPU) {
                p.name = "[CPU] " + p.name;
            }
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
        (window as any).Cinematics?.loading();
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
                    const count = mapSize === 7 ? 4 : 8;
                    Game.activeGyms = allGyms.sort(() => Math.random() - 0.5).slice(0, count);
                }
                if (!Game.gymTeams || Object.keys(Game.gymTeams).length === 0) {
                    GameState.settings = settings;
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
                GameDialog.alert("Não foi possível iniciar a partida online.\n\n" + (err.message || JSON.stringify(err)), { title: 'Erro ao iniciar jogo' });
            }
        }
    }
}
