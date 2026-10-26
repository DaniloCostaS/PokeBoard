import { TRAINER_IMAGES } from '../constants/trainerImages';
import { Player } from '../models/Player';
import { Game } from './Game';
import { Network, db as supabase } from '../systems/Network';
import { MapSystem } from '../systems/MapSystem';
import { SupabaseDataStore } from '../modules/network/SupabaseDataStore';
import { GameSpawns } from '../modules/game/GameSpawns';
import { GameState } from '../modules/game/GameState';
import { GameDialog } from '../modules/ui/GameDialog';
import { Account } from '../modules/profile/Account';
import { ProfileTracker } from '../modules/profile/ProfileTracker';
import { Cosmetics } from '../modules/profile/Cosmetics';
import { AvatarPicker } from '../modules/ui/AvatarPicker';

export class Setup {
    static showOfflineSetup() { 
        const loginEl = document.getElementById('online-login');
        if (loginEl) loginEl.style.display = 'none';
        const branding = document.getElementById('menu-branding');
        if (branding) branding.style.display = 'block';
        document.getElementById('menu-phase-1')!.style.display = 'none'; 
        document.getElementById('menu-phase-setup')!.style.display = 'flex';
    }
    // Sessão salva do Supabase Auth: entra direto no menu
    private static loginChecked = false;
    static async checkCachedLogin() {
        if (this.loginChecked) return;
        this.loginChecked = true;
        const profile = await Account.init().catch(() => null);
        if (profile) this.enterMenu();
    }

    // Mostra o menu principal com o treinador logado
    static enterMenu() {
        const profile = Account.profile;
        if (!profile) return;
        (window as any).loggedUser = profile.username;
        const nameInput = document.getElementById('online-player-name') as HTMLInputElement;
        if (nameInput) {
            nameInput.value = profile.username;
            nameInput.disabled = true;
        }
        document.getElementById('online-login')!.style.display = 'none';
        const userDisplay = document.getElementById('logged-user-display');
        if (userDisplay) userDisplay.innerText = profile.username;
        const sel = document.getElementById('online-avatar-select') as HTMLSelectElement | null;
        if (sel && profile.avatar) sel.dataset.preferred = profile.avatar;
        document.getElementById('menu-phase-1')!.style.display = 'flex';
        ProfileTracker.resetCache();
        ProfileTracker.checkAchievements().catch(() => { });
    }

    static async logout() {
        const ok = await GameDialog.confirm('Sair da sua conta neste aparelho?', { title: 'Sair da conta', okLabel: 'Sair' });
        if (!ok) return;
        await Account.signOut();
        localStorage.removeItem('pkbd_session');
        location.reload();
    }

    private static authMode: 'login' | 'signup' = 'login';
    static setAuthMode(mode: 'login' | 'signup') {
        this.authMode = mode;
        this.clearLoginFeedback();
        const signup = mode === 'signup';
        document.getElementById('auth-tab-login')?.classList.toggle('is-active', !signup);
        document.getElementById('auth-tab-signup')?.classList.toggle('is-active', signup);
        document.getElementById('auth-tab-login')?.setAttribute('aria-selected', String(!signup));
        document.getElementById('auth-tab-signup')?.setAttribute('aria-selected', String(signup));
        const userField = document.getElementById('signup-username-field');
        if (userField) userField.hidden = !signup;
        const label = document.getElementById('btn-login-label');
        if (label) label.textContent = signup ? 'Criar minha conta' : 'Entrar no PokéBoard';
        const pass = document.getElementById('login-password') as HTMLInputElement | null;
        if (pass) {
            pass.autocomplete = signup ? 'new-password' : 'current-password';
            pass.placeholder = signup ? 'Mínimo de 6 caracteres' : 'Digite sua senha';
        }
    }

    private static showLoginFeedback(message: string, tone: 'error' | 'ok' = 'error') {
        const feedback = document.getElementById('login-feedback');
        if (!feedback) return;
        feedback.textContent = message;
        feedback.hidden = false;
        feedback.classList.toggle('is-ok', tone === 'ok');
    }

    static showOnlineMenu() {
        document.getElementById('menu-phase-1')!.style.display = 'none';
        document.getElementById('menu-phase-online')!.style.display = 'flex';
        const sel = document.getElementById('online-avatar-select') as HTMLSelectElement;
        if (sel && sel.options.length === 0) {
            sel.innerHTML = TRAINER_IMAGES.map(img => `<option value="${img.file}">${img.label}</option>`).join('');
            // Começa com o avatar do perfil
            const preferred = Account.profile?.avatar;
            if (preferred && TRAINER_IMAGES.some(img => img.file === preferred)) sel.value = preferred;
        }
        AvatarPicker.enhance(sel, {
            taken: () => new Set((Network.lobbyPlayers || []).filter((p: any) => p.id !== Network.myPlayerIdDb).map((p: any) => String(p.avatar || '').split('/').pop() || ''))
        });
        this.updateOnlinePreview();
    }
    
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
    
    static showLobbyUIOnly(room?: any) {
        const ctrl = document.getElementById('online-lobby-controls');
        if (ctrl) ctrl.style.display = 'none';
        const hc = document.getElementById('host-controls');
        if (hc) hc.style.display = Network.isHost ? 'block' : 'none';
        const gc = document.getElementById('guest-controls');
        if (gc) gc.style.display = Network.isHost ? 'none' : 'block';
        const back = document.querySelector('#menu-phase-online .trainer-online-back') as HTMLElement | null;
        if (back) back.style.display = 'none';
        if (room) this.renderRulesSummary(room);
    }

    // Lobby da sala (depois de Gerar sala ou de entrar numa sala)
    static showLobbyScreen(room: any) {
        document.getElementById('menu-phase-create')!.style.display = 'none';
        document.getElementById('menu-phase-1')!.style.display = 'none';
        document.getElementById('menu-phase-online')!.style.display = 'flex';
        this.showLobbyUIOnly(room);
    }

    static rulesText(room: any): { label: string; value: string }[] {
        const gens: number[] = room.generations || [1, 2, 3, 4, 5, 6, 7, 8, 9];
        const leg = room.legendaries_rule === 'no' ? 'Não' : room.legendaries_rule === 'only' ? 'Somente lendários' : 'Sim';
        const lives = Number(room.max_lives || 0);
        const size = Number(room.map_size || 10);
        return [
            { label: 'Mapa', value: `${size}×${size}` },
            { label: 'Gerações', value: gens.length === 9 ? 'Todas' : gens.map(g => `Gen ${g}`).join(', ') },
            { label: 'Lendários', value: leg },
            { label: 'Megas', value: room.megas_enabled === false ? 'Não' : 'Sim' },
            { label: 'Vidas', value: lives > 0 ? `${lives}` : 'Clássico' },
            { label: 'Acesso', value: room.has_password ? '🔒 Com senha' : 'Aberta' },
        ];
    }

    static renderRulesSummary(room: any) {
        const html = `<dl>${this.rulesText(room).map(r => `<div><dt>${r.label}</dt><dd>${this.escapeHubText(r.value)}</dd></div>`).join('')}</dl>`;
        ['room-rules-summary', 'room-rules-summary-guest'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = html;
        });
    }

    // Tela de criação: nada vai para o banco até "Gerar sala". keepValues: veio do "Voltar e excluir sala"
    static openCreateRoom(keepValues: boolean = false) {
        if (!Account.isLogged) return GameDialog.toast('Entre na sua conta para criar uma sala.', { tone: 'warning' });
        document.getElementById('menu-phase-online')!.style.display = 'none';
        document.getElementById('online-lobby-list')!.style.display = 'none';
        document.getElementById('lobby-status')!.style.display = 'none';
        document.getElementById('host-controls')!.style.display = 'none';
        document.getElementById('guest-controls')!.style.display = 'none';
        document.getElementById('online-lobby-controls')!.style.display = '';
        const back = document.querySelector('#menu-phase-online .trainer-online-back') as HTMLElement | null;
        if (back) back.style.display = '';
        if (!keepValues) {
            (document.getElementById('custom-room-code') as HTMLInputElement).value = '';
            (document.getElementById('create-room-password') as HTMLInputElement).value = '';
        }
        document.getElementById('menu-phase-create')!.style.display = 'flex';
        (document.getElementById('custom-room-code') as HTMLInputElement).focus({ preventScroll: true });
    }

    static closeCreateRoom() {
        document.getElementById('menu-phase-create')!.style.display = 'none';
        document.getElementById('menu-phase-online')!.style.display = 'flex';
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
        for (let i = 0; i < n; i++) AvatarPicker.enhance(document.getElementById(`p${i}-av`) as HTMLSelectElement, { compact: true });
    }
    static updatePreview(i: number) { (document.getElementById(`p${i}-preview`) as HTMLImageElement).src = `/assets/img/Treinadores/${(document.getElementById(`p${i}-av`) as HTMLSelectElement).value}`; }

    static clearLoginFeedback() {
        const feedback = document.getElementById('login-feedback');
        const usernameInput = document.getElementById('login-username') as HTMLInputElement | null;
        const passwordInput = document.getElementById('login-password') as HTMLInputElement | null;

        if (feedback) {
            feedback.textContent = '';
            feedback.hidden = true;
            feedback.classList.remove('is-ok');
        }
        document.getElementById('login-email')?.removeAttribute('aria-invalid');
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
        const emailInput = document.getElementById('login-email') as HTMLInputElement;
        const usernameInput = document.getElementById('login-username') as HTMLInputElement;
        const passwordInput = document.getElementById('login-password') as HTMLInputElement;
        const email = emailInput.value.trim();
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const signup = this.authMode === 'signup';

        const missing = !email ? emailInput : (signup && !username) ? usernameInput : !password ? passwordInput : null;
        if (missing) {
            emailInput.setAttribute('aria-invalid', String(!email));
            usernameInput.setAttribute('aria-invalid', String(signup && !username));
            passwordInput.setAttribute('aria-invalid', String(!password));
            this.showLoginFeedback(!email ? 'Informe seu e-mail.' : (signup && !username) ? 'Escolha um nome de Treinador.' : 'Informe sua senha.');
            missing.focus();
            return;
        }

        this.clearLoginFeedback();
        const submit = document.getElementById('btn-login-enter') as HTMLButtonElement | null;
        if (submit) submit.disabled = true;
        try {
            if (signup) {
                const res = await Account.signUp(email, password, username);
                if (!res.ok) { this.showLoginFeedback(res.message || 'Não foi possível criar a conta.'); return; }
                if (res.needsConfirm) { this.setAuthMode('login'); this.showLoginFeedback(res.message!, 'ok'); return; }
            } else {
                const res = await Account.signIn(email, password);
                if (!res.ok) { this.showLoginFeedback(res.message || 'Não foi possível entrar.'); return; }
            }
            passwordInput.value = '';
            this.enterMenu();
        } finally {
            if (submit) submit.disabled = false;
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
        const uid = Account.userId;
        container.innerHTML = rooms.map((room: any) => {
            const players = [...(room.room_players || [])].sort((a: any, b: any) => a.local_index - b.local_index);
            const hostRow = players.find((p: any) => room.host_user_id && p.user_id === room.host_user_id);
            const hostName = hostRow?.name || 'Desconhecido';
            const playerCount = players.length;
            const roomName = this.escapeHubText(String(room.alias || room.id || ''));
            const host = this.escapeHubText(hostName);
            const playing = room.status === 'playing';
            const isWatch = type === 'watch';
            const state = playing ? 'Em andamento' : room.status === 'finished' ? 'Encerrada' : 'Aguardando jogadores';
            const detail = playing ? `Rodada ${room.current_round || 1}` : `${playerCount}/8 jogadores`;
            const action = isWatch ? 'Assistir' : type === 'active' ? (playing ? 'Reconectar' : 'Voltar à sala') : 'Entrar na sala';
            const target = isWatch ? `data-watch-room="${this.escapeHubText(room.id)}"` : `data-room-code="${roomName}"`;
            const lock = room.has_password ? '<span class="rooms-hub-lock" title="Sala com senha" aria-label="Sala com senha">🔒</span>' : '';
            // Excluir: só quem criou a sala (conta) ou, em sala antiga, o jogador 0 com meu nome
            const iAmHost = !!uid && room.host_user_id === uid;
            const del = type === 'active' && iAmHost
                ? `<button type="button" class="rooms-hub-card-delete" data-delete-room="${this.escapeHubText(room.id)}" data-room-name="${roomName}">Excluir</button>`
                : '';

            return `<article class="rooms-hub-card rooms-hub-card--${type}">
                <header class="rooms-hub-card-header">
                    <div><p>${state}</p><h3>${roomName} ${lock}</h3></div>
                    <span class="rooms-hub-card-badge">${detail}</span>
                </header>
                <dl class="rooms-hub-card-details">
                    <div><dt>Host</dt><dd>${host}</dd></div>
                    <div><dt>Jogadores</dt><dd>${playerCount}/8</dd></div>
                </dl>
                <div class="rooms-hub-card-row">
                    <button type="button" class="rooms-hub-card-secondary" data-room-details="${this.escapeHubText(room.id)}">Detalhes</button>
                    ${del}
                </div>
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

        container.querySelectorAll<HTMLButtonElement>('[data-room-details]').forEach(button => {
            button.addEventListener('click', () => this.openRoomDetails(button.dataset.roomDetails || ''));
        });

        container.querySelectorAll<HTMLButtonElement>('[data-delete-room]').forEach(button => {
            button.addEventListener('click', async () => {
                const ok = await GameDialog.confirm(`Excluir a sala ${button.dataset.roomName}? A partida e o progresso de todos nela serão apagados.`, { title: 'Excluir sala', okLabel: 'Excluir', danger: true });
                if (!ok) return;
                button.disabled = true;
                if (await Network.deleteRoom(button.dataset.deleteRoom || '')) {
                    GameDialog.toast('Sala excluída.', { tone: 'success' });
                    button.closest('article')?.remove();
                    if (!container.querySelector('article')) this.renderRoomsHubEmpty(container, 'Nenhuma sala', 'Quando você tiver uma sala, ela aparecerá aqui.');
                } else button.disabled = false;
            });
        });
    }

    // Detalhes da sala: regras, jogadores (com vez, ouro, insígnias, vidas, time) e rodada
    static async openRoomDetails(roomId: string) {
        if (!roomId) return;
        const { data: room, error } = await supabase.from('rooms')
            .select('id, alias, status, map_size, generations, legendaries_rule, megas_enabled, max_lives, has_password, current_turn, current_round, created_at, host_user_id, room_players(id, local_index, name, avatar, gold, badges_count, lives, skip_turns, user_id, cosmetics, player_pokemons(pokemon_id, level, is_shiny, slot_index))')
            .eq('id', roomId).single();
        if (error || !room) return GameDialog.toast('Não foi possível carregar a sala.', { tone: 'danger' });

        let layer = document.getElementById('room-details-modal');
        if (!layer) {
            layer = document.createElement('div');
            layer.id = 'room-details-modal';
            layer.className = 'modal pb-room-details';
            layer.addEventListener('click', e => { if (e.target === layer) layer!.style.display = 'none'; });
            document.body.appendChild(layer);
        }
        const players = [...(room.room_players || [])].sort((a: any, b: any) => a.local_index - b.local_index);
        const playing = room.status === 'playing';
        const maxLives = Number(room.max_lives || 0);
        const created = room.created_at ? new Date(room.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '';
        const rows = players.map((p: any) => {
            const isTurn = playing && p.local_index === room.current_turn;
            const isHost = !!room.host_user_id && p.user_id === room.host_user_id;
            const team = [...(p.player_pokemons || [])].sort((a: any, b: any) => a.slot_index - b.slot_index)
                .map((m: any) => `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${m.is_shiny ? 'shiny/' : ''}${Number(m.pokemon_id)}.png" alt="" title="Lv.${Number(m.level)}" loading="lazy">`).join('');
            const avatar = this.escapeHubText(String(p.avatar || 'Red.png').split('/').pop());
            const lives = maxLives > 0 && playing ? `<span class="pb-lives" title="Vidas">${Array.from({ length: maxLives }, (_, k) => `<i class="${k < (p.lives ?? maxLives) ? 'is-full' : ''}"></i>`).join('')}</span>` : '';
            return `<li class="${isTurn ? 'is-turn' : ''}">
                <span class="lobby-avatar ${Cosmetics.frameClass(p.cosmetics?.frame)}"><img src="/assets/img/Treinadores/${avatar}" alt=""></span>
                <div class="pb-rd-player">
                    <strong>${playing ? `${p.local_index + 1}º · ` : ''}${this.escapeHubText(p.name)}${isHost ? ' <small>HOST</small>' : ''}${isTurn ? ' <em>Na vez</em>' : ''}</strong>
                    ${p.cosmetics?.title ? `<small class="lobby-player-title">${Cosmetics.escape(p.cosmetics.title)}</small>` : ''}
                    ${playing ? `<span class="pb-rd-meta">${Number(p.gold) || 0} G · ${Number(p.badges_count) || 0} insígnias${p.skip_turns > 0 ? ` · perde ${Number(p.skip_turns)} turno(s)` : ''} ${lives}</span><span class="pb-rd-team">${team}</span>` : ''}
                </div>
            </li>`;
        }).join('');
        const rules = this.rulesText(room).map(r => `<div><dt>${r.label}</dt><dd>${this.escapeHubText(r.value)}</dd></div>`).join('');
        const statusText = playing ? `Em andamento · Rodada ${room.current_round || 1} · vez de ${this.escapeHubText(players.find((p: any) => p.local_index === room.current_turn)?.name || '?')}` : room.status === 'finished' ? 'Encerrada' : 'Aguardando jogadores';

        layer.innerHTML = `<div class="modal-content pb-rd-card" role="dialog" aria-modal="true" aria-labelledby="pb-rd-title">
            <header><div><p>${statusText}</p><h2 id="pb-rd-title">${this.escapeHubText(room.alias)}${room.has_password ? ' 🔒' : ''}</h2>${created ? `<small>Criada em ${created}</small>` : ''}</div>
            <button type="button" class="pb-rd-close" aria-label="Fechar">✕</button></header>
            <section><h3>Jogadores (${players.length}/8)</h3><ul class="pb-rd-players">${rows || '<li>Ninguém ainda.</li>'}</ul></section>
            <section><h3>Regras</h3><dl class="trainer-room-summary pb-rd-rules">${rules}</dl></section>
        </div>`;
        layer.querySelector('.pb-rd-close')?.addEventListener('click', () => { layer!.style.display = 'none'; });
        layer.style.display = 'flex';
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
        this.setRoomsHubHeading('Minhas salas', 'Retome uma partida, veja detalhes ou exclua salas que você criou.');
        this.renderRoomsHubLoading(container, 'Buscando suas partidas...');
        modal.style.display = 'flex';

        try {
            const uid = Account.userId;
            if (!uid) throw new Error('sem conta');
            const { data: playerRows, error: playerError } = await supabase.from('room_players').select('room_id').eq('user_id', uid);
            if (playerError) throw playerError;
            const roomIds = [...new Set((playerRows || []).map((row: any) => row.room_id))];
            let rooms: any[] = [];
            if (roomIds.length) {
                const { data, error: roomsError } = await supabase.from('rooms').select('*, room_players(*)').in('id', roomIds).in('status', ['playing', 'waiting']).order('created_at', { ascending: false });
                if (roomsError) throw roomsError;
                rooms = data || [];
            }
            if (uid) {
                // Salas que criei e onde não estou mais listado (ex.: todos saíram) também aparecem
                const { data: owned } = await supabase.from('rooms').select('*, room_players(*)').eq('host_user_id', uid).in('status', ['playing', 'waiting']);
                (owned || []).forEach((r: any) => { if (!rooms.some(x => x.id === r.id)) rooms.push(r); });
            }

            if (!rooms.length) {
                this.renderRoomsHubEmpty(container, 'Nenhuma sala', 'Quando você criar ou entrar numa sala, ela aparecerá aqui.');
                return;
            }

            this.renderRoomCards(container, modal, rooms, 'active');
        } catch (error) {
            console.error('Erro ao buscar salas:', error);
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
        // Ordem de jogo sorteada (não segue a ordem dos cards da tela)
        const slots = Array.from({ length: n }, (_, i) => ({
            name: (document.getElementById(`p${i}-name`) as HTMLInputElement).value,
            avatar: (document.getElementById(`p${i}-av`) as HTMLSelectElement).value,
            isCPU: (document.getElementById(`p${i}-cpu`) as HTMLInputElement)?.checked || false
        }));
        for (let i = slots.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [slots[i], slots[j]] = [slots[j], slots[i]];
        }
        const ps: Player[] = slots.map((slot, i) => {
            const p = new Player(i, slot.name, slot.avatar, false);
            p.isCPU = slot.isCPU;
            if (slot.isCPU) p.name = "[CPU] " + p.name;
            return p;
        });

        const gens = Array.from(document.querySelectorAll('#offline-gen-select input:checked')).map(el => parseInt((el as HTMLInputElement).value));
        const leg = (document.getElementById('offline-legendary-rule') as HTMLSelectElement).value as any;
        const mega = (document.getElementById('offline-mega-rule') as HTMLSelectElement).value === 'yes';
        const maxLives = parseInt((document.getElementById('offline-lives-rule') as HTMLSelectElement | null)?.value || '3', 10) || 0;

        const settings = {
            generations: gens.length > 0 ? gens : [1, 2, 3, 4, 5, 6, 7, 8, 9],
            legendaries: leg,
            megas: mega,
            maxLives
        };
        ps.forEach(p => { p.lives = maxLives || 3; });
        if (Account.profile) {
            // O humano logado mostra moldura/título do perfil também no offline
            const humans = ps.filter(p => !p.isCPU);
            if (humans.length === 1) humans[0].cosmetics = Account.cosmetics();
        }

        ps.forEach(p => p.assignStarter(settings));

        document.getElementById('setup-screen')!.style.display = 'none';
        document.getElementById('game-container')!.style.display = 'flex';
        Game.init(ps, mapSize, settings);
        (window as any).Cinematics?.loading();
    }

    // START ONLINE (Host)
    static async startOnlineGame() {
        if (!Network.isHost) return;
        const startBtn = document.querySelector('#host-controls .trainer-online-start') as HTMLButtonElement | null;
        if (startBtn) startBtn.disabled = true;
        // As regras foram definidas na criação da sala e estão gravadas nela
        const { data: room, error: roomReadErr } = await supabase.from('rooms').select('*').eq('id', Network.currentRoomId).single();
        if (roomReadErr || !room) {
            if (startBtn) startBtn.disabled = false;
            return GameDialog.toast('Não foi possível ler a sala. Tente novamente.', { tone: 'danger' });
        }
        const mapSize = room.map_size || 10;
        MapSystem.generate(mapSize);

        const settings = {
            generations: (room.generations && room.generations.length) ? room.generations : [1, 2, 3, 4, 5, 6, 7, 8, 9],
            legendaries: room.legendaries_rule || 'yes',
            megas: room.megas_enabled !== false,
            maxLives: Number(room.max_lives || 0)
        };

        // Ordem de jogo sorteada no servidor (independe de quem entrou primeiro)
        const { error: shuffleErr } = await supabase.rpc('shuffle_room_order', { p_room: Network.currentRoomId });
        if (shuffleErr) console.warn('Não foi possível sortear a ordem:', shuffleErr);

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
                        tempPlayer.assignStarter(settings as any);
                        await supabase.from('room_players').update({ lives: settings.maxLives || 3 }).eq('id', pd.id);
                        
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
                    GameState.settings = settings as any;
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
                if (startBtn) startBtn.disabled = false;
                GameDialog.alert("Não foi possível iniciar a partida online.\n\n" + (err.message || JSON.stringify(err)), { title: 'Erro ao iniciar jogo' });
            }
        }
    }
}
