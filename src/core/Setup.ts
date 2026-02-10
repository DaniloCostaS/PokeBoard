import { TRAINER_IMAGES } from '../constants/trainerImages';
import { Player } from '../models/Player';
import { Game } from './Game';
import { Network, db } from '../systems/Network';
import { update, ref } from 'firebase/database';
import { MapSystem } from '../systems/MapSystem';

export class Setup {
    static showOfflineSetup() { document.getElementById('menu-phase-1')!.style.display='none'; document.getElementById('menu-phase-setup')!.style.display='block'; }
    static showOnlineMenu() { document.getElementById('menu-phase-1')!.style.display='none'; document.getElementById('menu-phase-online')!.style.display='block'; const sel = document.getElementById('online-avatar-select') as HTMLSelectElement; if(sel && sel.options.length === 0) { sel.innerHTML = TRAINER_IMAGES.map(img => `<option value="${img.file}">${img.label}</option>`).join(''); } this.updateOnlinePreview(); }
    static updateOnlinePreview() { const sel = document.getElementById('online-avatar-select') as HTMLSelectElement; const img = document.getElementById('online-avatar-preview') as HTMLImageElement; if (sel && img && sel.value) { img.src = `/assets/img/Treinadores/${sel.value}`; } }
    static showLobbyUIOnly() { const ctrl = document.getElementById('online-lobby-controls'); if(ctrl) ctrl.style.display = 'none'; if (!Network.isHost) { const hc = document.getElementById('host-controls'); if(hc) hc.style.display = 'none'; } }
    static showSetupScreen() { document.getElementById('menu-phase-online')!.style.display='none'; document.getElementById('menu-phase-setup')!.style.display='block'; }
    static updateSlots() { const numInput = document.getElementById('num-players') as HTMLSelectElement; if (!numInput) return; const n = parseInt(numInput.value); const c = document.getElementById('player-slots-container')!; c.innerHTML = ''; const defs = ["Ash", "Gary", "Misty", "Brock", "May", "Dawn", "Serena", "Goh"]; for(let i=0; i<n; i++) { const defImg = TRAINER_IMAGES[i%TRAINER_IMAGES.length].file; const opts = TRAINER_IMAGES.map(img => `<option value="${img.file}" ${img.file===defImg?'selected':''}>${img.label}</option>`).join(''); c.innerHTML += `<div class="setup-row"><strong>P${i+1}</strong><input type="text" id="p${i}-name" value="${defs[i]||'Player'}" style="width:100px;"><div class="avatar-selection"><img id="p${i}-preview" src="/assets/img/Treinadores/${defImg}" class="avatar-preview"><select id="p${i}-av" onchange="window.Setup.updatePreview(${i})">${opts}</select></div></div>`; } }
    static updatePreview(i: number) { (document.getElementById(`p${i}-preview`) as HTMLImageElement).src = `/assets/img/Treinadores/${(document.getElementById(`p${i}-av`) as HTMLSelectElement).value}`; }
    
    // START OFFLINE
    static start() { const n = parseInt((document.getElementById('num-players') as HTMLSelectElement).value); const mapSize = parseInt((document.getElementById('map-size') as HTMLSelectElement).value); const ps = []; for(let i=0; i<n; i++) { ps.push(new Player(i, (document.getElementById(`p${i}-name`) as HTMLInputElement).value, (document.getElementById(`p${i}-av`) as HTMLSelectElement).value, false)); } document.getElementById('setup-screen')!.style.display='none'; document.getElementById('game-container')!.style.display='flex'; Game.init(ps, mapSize); }
    // START ONLINE (Host)
    static async startOnlineGame() { if (!Network.isHost) return; const mapSize = parseInt((document.getElementById('online-map-size') as HTMLSelectElement).value); MapSystem.generate(mapSize); const updateData = { status: "PLAYING", map: { size: mapSize, grid: MapSystem.grid, gymLocations: MapSystem.gymLocations } }; if (db) { await update(ref(db, `rooms/${Network.currentRoomId}`), updateData); } }
}