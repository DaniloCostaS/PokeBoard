import { TILE, NPC_DATA, SHOP_ITEMS } from '../constants';
import { POKEDEX } from '../constants/pokedex';
import { PLAYER_COLORS } from '../constants/playerColors';
import { GYM_DATA } from '../constants/gyms';
import { ref, update } from 'firebase/database';
import { db, Network } from '../systems/Network';
import { Player } from '../models/Player';
import { Pokemon } from '../models/Pokemon';
import { MapSystem } from '../systems/MapSystem';
import { Battle } from '../systems/Battle';
import { Shop } from '../systems/Shop';
import { Cards } from '../systems/Cards';
import type { ItemData } from '../constants';

export class Game {
    static players: Player[] = []; 
    static turn: number = 0; 
    static isCityEvent: boolean = false; 
    static hasRolled: boolean = false; 
    static forcedDiceValue: number = 0;
    static bonusMovement: number = 0;
    static traps: {x: number, y: number, ownerId: number}[] = [];
    static pendingHealItem: string | null = null;

    static init(players: Player[], mapSize: number) { this.players = players; if(MapSystem.grid.length === 0) { MapSystem.generate(mapSize); } if(Network.isOnline && Network.isHost) { if(db) update(ref(db, `rooms/${Network.currentRoomId}`), { grid: MapSystem.grid, gymLocations: MapSystem.gymLocations }); } this.renderBoard(); this.updateHUD(); this.moveVisuals(); this.checkTurnControl(); this.renderDebugPanel(); }
    static addItem(player: Player, itemId: string, amount: number = 1) { if (!player.items[itemId]) { player.items[itemId] = 0; } player.items[itemId] += amount; this.updateHUD(); if(Network.isOnline) Network.syncPlayerState(); }
    static sendGlobalLog(msg: string) { this.log(msg); if(Network.isOnline) { Network.sendAction('LOG', { msg: msg }); } }
    static getGlobalAverageLevel(): number { if (!this.players || this.players.length === 0) return 1; let totalLevels = 0; let totalMons = 0; this.players.forEach(p => { p.team.forEach(m => { totalLevels += m.level; totalMons++; }); }); if (totalMons === 0) return 1; return Math.floor(totalLevels / totalMons); }
    
    static triggerVictory(winnerId: number) {
        const winner = this.players.find(p => p.id === winnerId);
        if (!winner) return;

        // 1. Preencher Perfil
        document.getElementById('win-avatar')!.setAttribute('src', winner.avatar);
        document.getElementById('win-name')!.innerText = winner.name;

        // 2. Preencher Time (Hall da Fama)
        const teamContainer = document.getElementById('win-team-container')!;
        teamContainer.innerHTML = winner.team.map(mon => `
            <div class="win-mon-card">
                <img src="${mon.getSprite()}">
                <div style="font-size:0.7rem; font-weight:bold;">${mon.name}</div>
                <div style="font-size:0.6rem;">Lv.${mon.level}</div>
            </div>
        `).join('');

        // 3. Preencher Insígnias
        const badgeContainer = document.getElementById('win-badges-container')!;
        badgeContainer.innerHTML = '';
        
        // Renderiza as 8 insígnias (se ele ganhou, ele tem todas)
        GYM_DATA.forEach(gym => {
            const img = document.createElement('img');
            img.src = `/assets/img/Insignias/${gym.badgeImg}`;
            img.className = 'win-badge-img';
            img.title = `Insígnia ${gym.type}`;
            badgeContainer.appendChild(img);
        });

        // 4. Mostrar Tela
        document.getElementById('victory-modal')!.style.display = 'flex';
        
        // Efeito Sonoro ou Confete (Opcional, log por enquanto)
        console.log("GAME OVER - VITORIA!");
    }
    //static generateWildPokemon(): Pokemon { const stage1Mons = POKEDEX.filter(p => p.stage === 1); const legendaries = stage1Mons.filter(p => p.isLegendary); const regulars = stage1Mons.filter(p => !p.isLegendary); let chosenTemplate; if (Math.random() < 0.02 && legendaries.length > 0) { chosenTemplate = legendaries[Math.floor(Math.random() * legendaries.length)]; } else { chosenTemplate = regulars[Math.floor(Math.random() * regulars.length)]; } let level = this.getGlobalAverageLevel(); if (level < 1) level = 1; return new Pokemon(chosenTemplate.id, level, null); }
    
    static generateWildPokemon(tileType: number): Pokemon {
        
        // 1. Definição das regras de Spawn por Terreno
        let allowedTypes: string[] = [];

        switch (tileType) {
            case TILE.GRASS:
                allowedTypes = ['Grama', 'Inseto', 'Normal', 'Veneno', 'Voador', 'Fada'];
                break;
            case TILE.WATER:
                allowedTypes = ['Água', 'Gelo', 'Dragão'];
                break;
            case TILE.GROUND:
                allowedTypes = ['Terra', 'Pedra', 'Fogo', 'Lutador', 'Elétrico', 'Psíquico', 'Fantasma'];
                break;
            default:
                allowedTypes = ['Normal'];
                break;
        }

        // 2. Lógica de Progressão por Nível Médio
        const globalAvg = this.getGlobalAverageLevel();
        
        let allowedStages = [1];       // Padrão: Só Stage 1
        let allowLegendaries = false;  // Padrão: Sem lendários

        if (globalAvg < 5) {
            // Regra: Média < 5 -> Só Stage 1, Sem Lendários
            allowedStages = [1];
            allowLegendaries = false;
        } 
        else if (globalAvg >= 5 && globalAvg < 10) {
            // Regra: 5 <= Média < 10 -> Stage 1 e 2, Com Lendários
            allowedStages = [1, 2];
            allowLegendaries = true;
        } 
        else {
            // Regra: Média >= 10 -> Stage 1, 2 e 3, Com Lendários
            allowedStages = [1, 2, 3];
            allowLegendaries = true;
        }

        // 3. Filtra a Pokedex
        const possibleSpawns = POKEDEX.filter(p => {
            // Checa o Tipo do terreno
            if (!allowedTypes.includes(p.type)) return false;

            // Checa o Estágio de Evolução
            if (!allowedStages.includes(p.stage)) return false;

            // Checa se é Lendário (Se for lendário e não estiver permitido, remove)
            if (p.isLegendary && !allowLegendaries) return false;

            return true;
        });

        // 4. Fallback de Segurança
        if (possibleSpawns.length === 0) {
            console.warn(`Nenhum Pokémon encontrado para terreno ${tileType} com média ${globalAvg}.`);
            return new Pokemon(16, globalAvg); // Pidgey de emergência
        }

        // 5. Sorteio
        const chosenTemplate = possibleSpawns[Math.floor(Math.random() * possibleSpawns.length)];

        // O Shiny é calculado aleatoriamente dentro do construtor da classe Pokemon
        // ao passar 'null' no terceiro argumento.
        return new Pokemon(chosenTemplate.id, globalAvg, null);
    }
    
    static handleTotalDefeat(p: Player) { 
        alert(`🚑 ${p.name} não tem mais Pokémons!\nSerá levado ao início para recuperação emergencial.`); 
        p.x = 0; 
        p.y = 0; 
        p.team.forEach(mon => { mon.currentHp = mon.maxHp; }); 
        p.skipTurns = 2; 
        p.effects = {}; 
        this.sendGlobalLog(`🚑 ${p.name} foi resgatado! Voltou ao início recuperado, mas perderá 2 turnos.`); 
        this.moveVisuals(); 
        this.updateHUD(); 
        // MELHORIA: Só sincroniza se o jogador derrotado for EU MESMO.
        // Se for outro jogador, esperamos que o cliente dele faça o sync.
        if(Network.isOnline && p.id === Network.myPlayerId) {
            Network.syncPlayerState(); 
        }
    }
    
    static renderDebugPanel() { const container = document.querySelector('.extra-space'); if(container) { container.innerHTML = ` <button class="btn btn-secondary" onclick="window.Game.openCardLibrary()">📖 Ver Todas as Cartas</button> <button class="btn btn-secondary" style="background: #27ae60;" onclick="window.Game.openXpRules()">📘 Regras de XP</button> <button class="btn btn-secondary" style="background: #e67e22;" onclick="window.Game.openCaptureRules()">🦅 Regras de Captura</button> <div style="margin-top:10px; font-size:0.7rem; color:#aaa;">DEBUG MOVE</div> <div style="display:flex; gap:5px; justify-content:center;"> <input type="number" id="debug-input" value="1" min="1" max="50" style="width:50px; text-align:center; border:none; padding:5px; border-radius:4px;"> <button class="btn" style="width:auto; margin:0; padding:5px 10px;" onclick="window.Game.debugMove()">GO</button> </div> <button class="btn" style="margin-top:5px; background: #e67e22;" onclick="window.Game.exportSave()">💾 DEBUG SAVE</button> <div style="margin-top:5px;"><small id="online-indicator" style="color:cyan;">OFFLINE</small></div> `; } }
    static openCardLibrary() { const list = document.getElementById('library-list')!; list.innerHTML = ''; import('../constants').then(({CARDS_DB}) => { CARDS_DB.forEach(c => { const d = document.createElement('div'); d.className = 'card-item'; const typeClass = c.type === 'move' ? 'type-move' : 'type-battle'; const typeLabel = c.type === 'move' ? 'MOVE' : 'BATTLE'; d.innerHTML = `<div class="card-info"><span class="card-name">${c.icon} ${c.name} <span class="card-type-badge ${typeClass}">${typeLabel}</span></span><span class="card-desc">${c.desc}</span></div>`; list.appendChild(d); }); }); document.getElementById('library-modal')!.style.display = 'flex'; }
    static openXpRules() { document.getElementById('xp-rules-modal')!.style.display = 'flex'; }
    static openCaptureRules() { const modal = document.getElementById('capture-rules-modal'); if (modal) modal.style.display = 'flex'; }
    static openBoardCards(pId: number) { if(Network.isOnline && pId !== Network.myPlayerId) return alert("Privado!"); const p = this.players[pId]; const list = document.getElementById('board-cards-list')!; list.innerHTML = ''; if(p.cards.length === 0) list.innerHTML = "<em>Sem cartas.</em>"; const isMyTurn = this.canAct() && this.turn === pId; const canUseMove = isMyTurn && !this.hasRolled; p.cards.forEach(c => { const d = document.createElement('div'); d.className = 'card-item'; const typeClass = c.type === 'move' ? 'type-move' : 'type-battle'; const typeLabel = c.type === 'move' ? 'MOVE' : 'BATTLE'; let actionBtn = ''; if (c.type === 'move') { if (canUseMove) actionBtn = `<button class="btn-use-card" onclick="window.Cards.activate('${c.id}')">USAR</button>`; else actionBtn = `<button class="btn-use-card" disabled title="Só antes de rolar">USAR</button>`; } else { actionBtn = `<button class="btn-use-card" disabled style="background:#555" title="Só em batalha">BATTLE</button>`; } d.innerHTML = `<div class="card-info"><span class="card-name">${c.icon} ${c.name} <span class="card-type-badge ${typeClass}">${typeLabel}</span></span><span class="card-desc">${c.desc}</span></div>${actionBtn}`; list.appendChild(d); }); document.getElementById('board-cards-modal')!.style.display = 'flex'; }
    static useBoardCard(cardId: string) { const p = this.getCurrentPlayer(); const cardIndex = p.cards.findIndex(c => c.id === cardId); if (cardIndex === -1) return; const card = p.cards[cardIndex]; if (card.id === 'bike') { p.cards.splice(cardIndex, 1); document.getElementById('board-cards-modal')!.style.display = 'none'; this.log(`${p.name} usou Bicicleta!`); if(Network.isOnline) { Network.sendAction('ROLL', { result: 5 }); return; } this.hasRolled = true; this.animateDice(5, 0); } else if (card.id === 'teleport') { p.cards.splice(cardIndex, 1); document.getElementById('board-cards-modal')!.style.display = 'none'; this.log(`${p.name} usou Teleporte!`); p.x = 0; p.y = 0; this.moveVisuals(); this.handleTile(p); } else { alert("Efeito não implementado na demo."); } if(Network.isOnline) Network.syncPlayerState(); }
    static forceDice(val: number) { this.forcedDiceValue = val; this.rollDice(); }
    static placeTrap(x: number, y: number, ownerId: number) { this.traps.push({x, y, ownerId}); const tile = document.getElementById(`tile-${x}-${y}`); if(tile) tile.style.border = "2px dashed red"; }
    static async rollDice() { if(!this.canAct() || this.hasRolled) return; this.hasRolled = true; let result = 0; if (this.forcedDiceValue > 0) { result = this.forcedDiceValue; this.forcedDiceValue = 0; this.log("🔮 Dado Mágico usado!"); } else { const p = this.getCurrentPlayer(); if (p.effects.slow && p.effects.slow > 0) { result = Math.floor(Math.random()*6)+1; p.effects.slow--; this.log("🕸️ Lentidão! Rolou apenas 1d6."); } else { result = Math.floor(Math.random()*20)+1; } } if(Network.isOnline) { Network.sendAction('ROLL', { result: result }); } const playerId = Network.isOnline ? Network.myPlayerId : this.turn; this.animateDice(result, playerId); }
    static debugMove() { if(!this.canAct()) return; const input = document.getElementById('debug-input') as HTMLInputElement; const result = parseInt(input.value) || 1; this.log(`[DEBUG] Forçando ${result} passos.`); if(Network.isOnline) { Network.sendAction('ROLL', { result: result }); return; } this.animateDice(result, 0); }
    static moveVisuals() { this.players.forEach((p, idx) => { const currentTile = document.getElementById(`tile-${p.x}-${p.y}`); if(!currentTile) return; let token = document.getElementById(`p-token-${idx}`); if (token && token.parentElement === currentTile) { if(idx === this.turn) token.classList.add('active-token'); else token.classList.remove('active-token'); return; } if (token) token.remove(); const t = document.createElement('div'); t.id = `p-token-${idx}`; t.className = `player-token ${idx===this.turn?'active-token':''}`; t.style.backgroundImage = `url('${p.avatar}')`; t.style.borderColor = PLAYER_COLORS[idx % PLAYER_COLORS.length]; if(MapSystem.size >= 30) { t.style.width = '90%'; t.style.height = '90%'; } currentTile.appendChild(t); if(idx===this.turn) currentTile.scrollIntoView({block:'center',inline:'center',behavior:'smooth'}); }); }
    static async animateDice(result: number, playerId: number) { const die = document.getElementById('d20-display')!; for(let i=0;i<5;i++) { die.innerText = `🎲 ${Math.floor(Math.random()*20)+1}`; await new Promise(r=>setTimeout(r,50)); } die.innerText = `🎲 ${result}`; if (!Network.isOnline || playerId === Network.myPlayerId) { this.log(`${this.players[playerId].name} tirou ${result}`); } const p = this.players[playerId]; if(p.team.length > 0) { const luckyMon = p.team[Math.floor(Math.random() * p.team.length)]; luckyMon.gainXp(1, p); } this.movePlayerLogic(result, playerId); }
    static async movePlayerLogic(steps: number, pId: number) { const p = this.players[pId]; const totalTiles = MapSystem.size * MapSystem.size; if (this.bonusMovement > 0) { steps += this.bonusMovement; this.bonusMovement = 0; this.log("👟 Bônus de movimento aplicado!"); } for(let i=0; i<steps; i++) { let currentIdx = MapSystem.getIndex(p.x, p.y); currentIdx++; if (currentIdx >= totalTiles) { currentIdx = 0; p.gold += 200; Cards.draw(p); this.sendGlobalLog(`🚩 ${p.name} completou uma volta! Ganhou 200G e 1 Carta!`); } const nextCoord = MapSystem.getCoord(currentIdx); p.x = nextCoord.x; p.y = nextCoord.y; this.performVisualStep(pId, p.x, p.y); await new Promise(r => setTimeout(r, 150)); const trapIdx = this.traps.findIndex(t => t.x === p.x && t.y === p.y && t.ownerId !== p.id); if (trapIdx > -1) { this.sendGlobalLog(`🪤 ${p.name} caiu numa armadilha! Perdeu o próximo turno.`); p.skipTurns = 1; this.traps.splice(trapIdx, 1); const tile = document.getElementById(`tile-${p.x}-${p.y}`); if(tile) tile.style.border = "none"; break; } } if (!Network.isOnline || pId === Network.myPlayerId) { this.handleTile(p); if(Network.isOnline) Network.syncPlayerState(); } }
    static performVisualStep(pId: number, x: number, y: number) { const p = this.players[pId]; if(!p) return; p.x = x; p.y = y; const tile = document.getElementById(`tile-${x}-${y}`); if(tile) { tile.classList.add('step-highlight'); this.moveVisuals(); setTimeout(() => tile.classList.remove('step-highlight'), 300); } }
    
    static handleTile(p: Player) {
        if (Battle.active) return; 

        if (p.isDefeated()) {
            this.handleTotalDefeat(p);
            this.nextTurn(); 
            return;
        }

        const type = MapSystem.grid[p.y][p.x];
        const enemy = this.players.find(o => o !== p && o.x === p.x && o.y === p.y);
        
        if(enemy) { 
            const defMon = enemy.team.find(m => !m.isFainted()); 
            if(defMon) { 
                this.sendGlobalLog(`⚔️ Conflito! ${p.name} vs ${enemy.name}`); 
                Battle.setup(p, defMon, true, enemy.name, 0, enemy, false, 0, "", type); 
            } else { 
                this.log(`${enemy.name} sem pokemons!`); 
                this.nextTurn(); 
            } 
            return; 
        }
        
        if(NPC_DATA[type]) { 
            const npc = NPC_DATA[type]; 
            const monId = npc.team[Math.floor(Math.random() * npc.team.length)]; 
            let npcImg = '/assets/img/Treinadores/Red.jpg'; 
            if (type === TILE.ROCKET) npcImg = '/assets/img/NPCs/Rocket.jpg'; 
            else if (type === TILE.BIKER) npcImg = '/assets/img/NPCs/Motoqueiro.jpg'; 
            else if (type === TILE.YOUNG) npcImg = '/assets/img/NPCs/Jovem.jpg'; 
            else if (type === TILE.OLD) npcImg = '/assets/img/NPCs/Velho.jpg'; 
            const npcLevel = this.getGlobalAverageLevel(); 
            Battle.setup(p, new Pokemon(monId, npcLevel, null), false, npc.name, npc.gold, null, false, 0, npcImg, type); 
            return; 
        }
        
        if(type === TILE.CITY) { 
            this.isCityEvent = true; 
            document.getElementById('city-modal')!.style.display='flex'; 
        }
        else if(type === TILE.EVENT) { if(Math.random() < 0.5) { Cards.draw(p); } else { const gift = Math.random() > 0.5 ? 'pokeball' : 'potion'; this.addItem(p, gift, 1); this.sendGlobalLog(`${p.name} achou ${gift}!`); } this.nextTurn(); }
        else if(type === TILE.GYM) { 
            const gymId = MapSystem.gymLocations[`${p.x},${p.y}`] || 1; 
            if (!p.badges[gymId-1]) { Battle.setup(p, new Pokemon(150, 1, false), false, "Líder de Ginásio", 1000, null, true, gymId, "", type); } 
            else { this.log("Você já venceu este ginásio!"); this.nextTurn(); } 
        }
        else if([TILE.GRASS, TILE.WATER, TILE.GROUND].includes(type)) { 
            if (Math.random() < 0.8) { 
                //const wildMon = this.generateWildPokemon(); 
                const wildMon = this.generateWildPokemon(type);
                Battle.setup(p, wildMon, false, "Selvagem", 0, null, false, 0, "", type); } 
            else { 
                const messages = [ "Você procurou, mas nenhum Pokémon selvagem apareceu dessa vez!", "O mato se mexeu... mas era só o vento 😅", "Nada de Pokémon por aqui... talvez na próxima!", "Está tudo muito quieto...", "Um Pidgey voou longe, você não alcançou." ]; 
                const msg = messages[Math.floor(Math.random() * messages.length)]; this.log(msg); alert(msg); this.nextTurn(); } } 
        else { this.nextTurn(); }
    }
    
    // =========================================================================================
    // CORREÇÃO: Lógica de Cura Completa (Revive + Heal All)
    // =========================================================================================
    static handleCityChoice(c: string) { 
        if(c==='heal') { 
            const player = this.getCurrentPlayer();
            
            // Itera sobre todos os Pokémon e força HP = MaxHP
            // Isso garante que desmaiados (HP=0) revivam e todos curem 100%
            player.team.forEach(p => { 
                p.currentHp = p.maxHp; 
            }); 
            
            this.sendGlobalLog(`🏥 ${player.name} recuperou seu time no Centro Pokémon!`);
            
            this.updateHUD(); // Atualiza a UI imediatamente para refletir a cura
            this.isCityEvent = false; 
            
            if(Network.isOnline) Network.syncPlayerState(); 
            
            this.nextTurn(); 
        } else { 
            Shop.open(); 
        } 
        document.getElementById('city-modal')!.style.display='none'; 
    }

    static nextTurn() {
        this.saveGame(); 
        
        const currentP = this.getCurrentPlayer();
        
        // CORREÇÃO CRÍTICA: Reseta a flag de nível para o próximo turno
        currentP.resetTurnFlags();

        if (currentP.effects.extraTurn) {
            currentP.effects.extraTurn = false;
            this.hasRolled = false;
            this.sendGlobalLog(`⏳ ${currentP.name} joga novamente!`);
            this.updateHUD();
            this.checkTurnControl();
            return;
        }

        this.turn = (this.turn+1)%this.players.length; 
        this.hasRolled = false; 
        
        if(Network.isOnline) { 
            Network.syncTurn(this.turn); 
        } else {
            const nextP = this.players[this.turn];
            if(nextP.skipTurns > 0) { 
                nextP.skipTurns--; 
                this.sendGlobalLog(`${nextP.name} perdeu a vez! (Restam: ${nextP.skipTurns})`); 
                alert(`${nextP.name} perdeu a vez!`); 
                this.nextTurn(); 
                return; 
            }
        }
        
        this.updateHUD(); 
        this.moveVisuals(); 
        this.checkTurnControl();
    }
    
    static checkTurnControl() { 
        const btn = document.getElementById('roll-btn') as HTMLButtonElement; 
        const me = Network.myPlayerId; 
        const ind = document.getElementById('online-indicator'); 
        
        if(Network.isOnline) { 
            if(ind) ind.innerText = "FIREBASE"; 
            if (this.turn === me) { 
                const myPlayer = this.players[me];
                
                if (myPlayer.skipTurns > 0) {
                    btn.disabled = true;
                    btn.innerText = `Pulando vez... (${myPlayer.skipTurns})`;
                    
                    setTimeout(() => {
                         myPlayer.skipTurns--;
                         this.sendGlobalLog(`${myPlayer.name} perdeu a vez! (Restam: ${myPlayer.skipTurns})`);
                         Network.syncPlayerState();
                         this.nextTurn(); 
                    }, 2000);
                    return;
                }

                btn.disabled = false; 
                btn.innerText = "ROLAR"; 
            } else { 
                btn.disabled = true; 
                btn.innerText = `Vez de ${this.players[this.turn].name}`; 
            } 
        } else { 
            if(ind) ind.innerText = "OFFLINE"; 
            btn.disabled = false; 
        } 
    }
    
    static canAct() { if(!Network.isOnline) return true; return this.turn === Network.myPlayerId; }
    static getSaveData() { return { players: this.players, turn: this.turn, mapSize: MapSystem.size, grid: MapSystem.grid, gymLoc: MapSystem.gymLocations }; }
    static saveGame() { localStorage.setItem('pk_save', JSON.stringify(this.getSaveData())); }
    static loadGame() { const json=localStorage.getItem('pk_save'); if(json) this.loadGameFromData(JSON.parse(json)); }
    static loadGameFromData(d: any) { MapSystem.size=d.mapSize; MapSystem.grid=d.grid; MapSystem.gymLocations=d.gymLoc || {}; this.players = d.players.map((pd:any) => { const file = pd.avatar.split('/').pop(); const pl = new Player(pd.id, pd.name, file, true); Object.assign(pl, pd); pl.avatar = `/assets/img/Treinadores/${file}`; pl.team = pd.team.map((td:any) => { const po=new Pokemon(td.id, td.level, td.isShiny); Object.assign(po, td); return po; }); return pl; }); this.turn = d.turn; document.getElementById('setup-screen')!.style.display='none'; document.getElementById('game-container')!.style.display='flex'; Game.init(this.players, d.mapSize); }
    static exportSave() { const d = localStorage.getItem('pk_save'); if(!d)return alert("Vazio"); const b = new Blob([d], {type:'text/plain'}); const a = document.createElement('a'); a.href=URL.createObjectURL(b); a.download='save.txt'; a.click(); }
    static importSave(i: HTMLInputElement) { const f = i.files?.[0]; if(!f)return; const r = new FileReader(); r.onload=e=>{ localStorage.setItem('pk_save', e.target?.result as string); this.loadGame(); }; r.readAsText(f); }
    static openInventoryModal(pId: number) { const p = this.players[pId]; const list = document.getElementById('board-inventory-list')!; list.innerHTML = ''; const canUse = (this.canAct() && this.turn === pId); Object.keys(p.items).forEach(key => { if(p.items[key] > 0) { const item = SHOP_ITEMS.find(i => i.id === key); if(item) { const d = document.createElement('div'); d.className='shop-item'; let btnHTML = ''; if(canUse && (item.type === 'heal' || item.type === 'revive')) { btnHTML = `<button class="btn btn-mini" style="width:auto;" onclick="window.Game.useItemBoard('${key}', ${pId})">Usar</button>`; } d.innerHTML = `<div style="display:flex; align-items:center;"><img src="/assets/img/Itens/${item.icon}" class="item-icon-mini"><span>${item.name} x${p.items[key]}</span></div>${btnHTML}`; list.appendChild(d); } } }); document.getElementById('board-inventory-modal')!.style.display='flex'; }
    static useItemBoard(key: string, pId: number) { const p = this.players[pId]; const item = SHOP_ITEMS.find(i => i.id === key); if (!item || p.items[key] <= 0) return; if (item.type === 'heal') { if (item.id === 'ultrafullrestore') { this.applyBoardItemEffect(p, item, -1); return; } this.openHealSelector(pId, key); } else if (item.type === 'revive') { if (item.id === 'ultramaxrevive') { this.applyBoardItemEffect(p, item, -1); return; } this.openHealSelector(pId, key); } }
    static openHealSelector(pId: number, itemKey: string) { this.pendingHealItem = itemKey; const p = this.players[pId]; const modal = document.getElementById('pkmn-select-modal')!; const list = document.getElementById('pkmn-select-list')!; const title = document.getElementById('select-title')!; title.innerText = "Usar em qual Pokémon?"; list.innerHTML = ''; p.team.forEach((mon, idx) => { const div = document.createElement('div'); div.className = `mon-select-item`; div.innerHTML = `<img src="${mon.getSprite()}" width="40"><b>${mon.name}</b> <small>(${mon.currentHp}/${mon.maxHp})</small>`; div.onclick = () => { modal.style.display = 'none'; this.applyBoardItemEffect(p, SHOP_ITEMS.find(i=>i.id === itemKey)!, idx); }; list.appendChild(div); }); const cancelBtn = document.createElement('button'); cancelBtn.className = "btn btn-secondary mt-15"; cancelBtn.innerText = "Cancelar"; cancelBtn.onclick = () => { modal.style.display = 'none'; this.pendingHealItem = null; }; list.appendChild(cancelBtn); modal.style.display = 'flex'; }
    static applyBoardItemEffect(p: Player, item: ItemData, targetIdx: number) { let used = false; if (item.type === 'heal') { if (item.id === 'ultrafullrestore') { let count = 0; p.team.forEach(m => { if(!m.isFainted() && m.currentHp < m.maxHp) { m.heal(9999); count++; } }); if(count > 0) { used = true; alert(`${count} Pokémon curados!`); } else alert("Ninguém precisa de cura!"); } else { const target = p.team[targetIdx]; if(target.isFainted()) return alert("Não funciona em Pokémon desmaiado!"); if(target.currentHp >= target.maxHp) return alert("HP já está cheio!"); target.heal(item.val || 20); alert(`Usou ${item.name} em ${target.name}.`); used = true; } } else if (item.type === 'revive') { if (item.id === 'ultramaxrevive') { let count = 0; p.team.forEach(m => { if(m.isFainted()) { m.revive(100); count++; } }); if(count > 0) { used = true; alert(`${count} Pokémon revividos!`); } else alert("Ninguém está desmaiado!"); } else { const target = p.team[targetIdx]; if(!target.isFainted()) return alert("Este Pokémon não está desmaiado!"); target.revive(item.val || 50); alert(`Usou ${item.name} em ${target.name}.`); used = true; } } if (used) { p.items[item.id]--; this.updateHUD(); this.openInventoryModal(p.id); this.saveGame(); if (Network.isOnline) { Network.sendAction('LOG', { msg: `${p.name} usou ${item.name}.` }); Network.syncPlayerState(); } } }
    static openSwapModal(newMon: Pokemon) { const modal = document.getElementById('swap-modal')!; const list = document.getElementById('swap-list')!; list.innerHTML = ''; const p = this.getCurrentPlayer(); p.team.forEach((currP, idx) => { const div = document.createElement('div'); div.className = 'swap-item'; div.innerHTML = `<img src="${currP.getSprite()}"> <b>${currP.name}</b> Lv.${currP.level}`; div.onclick = () => this.executeSwap(idx, newMon); list.appendChild(div); }); const divNew = document.createElement('div'); divNew.className = 'swap-item new-mon'; divNew.innerHTML = `<img src="${newMon.getSprite()}"> <b>${newMon.name} (NOVO)</b> Lv.${newMon.level} <br><small>Clique para descartar este</small>`; divNew.onclick = () => this.executeSwap(-1, newMon); list.appendChild(divNew); modal.style.display = 'block'; }
    
    static executeSwap(indexToRelease: number, newMon: Pokemon) { 
        const p = this.getCurrentPlayer(); 
        if (indexToRelease === -1) { 
            this.log(`Libertou ${newMon.name}.`); 
        } else { 
            const released = p.team[indexToRelease]; 
            this.log(`Libertou ${released.name} e ficou com ${newMon.name}!`); 
            p.team[indexToRelease] = newMon; 
        } 
        document.getElementById('swap-modal')!.style.display = 'none'; 
        Game.updateHUD(); 
        
        if(Network.isOnline) Network.syncPlayerState();
        
        setTimeout(() => Battle.end(false), 500); 
    }

    static updateHUD() { const left = document.getElementById('hud-col-left')!; left.innerHTML = ''; const right = document.getElementById('hud-col-right')!; right.innerHTML = ''; if (!this.players || this.players.length === 0) return; this.players.forEach((p,i) => { const d = document.createElement('div'); d.className = `player-slot ${i===this.turn?'active':''}`; let badgeHTML = '<div class="badges-container">'; for(let b=0; b<8; b++) { const isActive = p.badges[b]; const gData = GYM_DATA.find(g => g.id === b+1); const imgUrl = gData ? `/assets/img/Insignias/${gData.badgeImg}` : ''; const style = isActive ? `background-image: url('${imgUrl}'); background-size: 100% 100%; background-repeat: no-repeat; background-color: transparent;` : `background-color: #ccc;`; badgeHTML += `<div class="badge-slot ${isActive?'active':''}" style="${style}" title="Insígnia ${b+1}"></div>`; } badgeHTML += '</div>'; 
    
        const th = p.team.map(m => { 
            let auraClass = ''; 
            if (m.isShiny) auraClass = 'aura-shiny'; 
            else if (m.isLegendary) auraClass = 'aura-legendary'; 
            return ` 
            <div class="poke-card ${m.isFainted() ? 'fainted' : ''}"> 
                <img src="${m.getSprite()}" class="poke-card-img ${auraClass}"> 
                <div class="poke-card-info"> 
                    <div class="poke-header"> 
                        <span>${m.name}</span> 
                        <span class="poke-lvl">Lv.${m.level}</span> 
                    </div> 

                    <div class="bar-container" title="HP"> 
                        <div class="bar-fill ${Battle.getHpColor(m.currentHp, m.maxHp)}" style="width:${(m.currentHp/m.maxHp)*100}%"></div> 
                        <div class="bar-text">${m.currentHp}/${m.maxHp}</div> 
                    </div> 
                    
                    <div class="bar-container" title="XP">
                        <div class="bar-fill xp-bar" style="width:${(m.currentXp/m.maxXp)*100}%"></div>
                        <div class="bar-text">${Math.floor(m.currentXp)}/${m.maxXp}</div>
                    </div> 

                    <div class="poke-stats"> 
                        <div class="stat-item">⚔️${m.atk}</div> 
                        <div class="stat-item">🛡️${m.def}</div> 
                        <div class="stat-item">💨${m.speed}</div> 
                    </div> 
            </div> </div>`; }).join(''); 
            d.innerHTML = ` <div class="hud-header"><div class="hud-name-group"><img src="${p.avatar}" class="hud-avatar-img"><span>${p.name}</span></div><div>💰${p.gold}</div></div> ${badgeHTML} <div class="hud-team">${th}</div> <div class="hud-actions"><button class="btn btn-secondary btn-mini" onclick="window.openInventory(${i})">🎒</button><button class="btn btn-secondary btn-mini" onclick="window.openCards(${i})">🃏</button></div>`; if(i < Math.ceil(this.players.length/2)) left.appendChild(d); else right.appendChild(d); }); const turnPlayer = this.players[this.turn]; if (turnPlayer) document.getElementById('turn-indicator')!.innerText = turnPlayer.name; }
    static renderBoard() { const area = document.getElementById('board-area')!; area.innerHTML = ''; area.style.gridTemplateColumns = `repeat(${MapSystem.size}, 1fr)`; area.style.gridTemplateRows = `repeat(${MapSystem.size}, 1fr)`; for(let y=0; y<MapSystem.size; y++) { for(let x=0; x<MapSystem.size; x++) { const d = document.createElement('div'); let c = 'path'; const t = MapSystem.grid[y][x]; if(t===TILE.GRASS)c='grass'; else if(t===TILE.WATER)c='water'; else if(t===TILE.GROUND)c='ground'; else if(t===TILE.CITY)c='city'; else if(t===TILE.GYM)c='gym'; else if(t===TILE.EVENT)c='event'; else if(t===TILE.ROCKET)c='rocket'; else if(t===TILE.BIKER)c='biker'; else if(t===TILE.YOUNG)c='young'; else if(t===TILE.OLD)c='old'; d.className = `tile ${c}`; d.id = `tile-${x}-${y}`; if(MapSystem.size>=30)d.style.fontSize='8px'; if(t===TILE.GYM) { const gid = MapSystem.gymLocations[`${x},${y}`]; if(gid) { const gData = GYM_DATA.find(g => g.id === gid); if(gData) { d.style.backgroundImage = `url('/assets/img/Ginasios/${gData.gymImg}')`; d.style.backgroundSize = '100% 100%'; d.style.backgroundRepeat = 'no-repeat'; d.title = `Ginásio ${gData.type} - Líder ${gData.leaderName}`; } d.innerText = ""; } } area.appendChild(d); } } }
    static getCurrentPlayer() { return this.players[this.turn]; }
    static log(m: string) { document.getElementById('log-container')!.insertAdjacentHTML('afterbegin', `<div class="log-entry">${m}</div>`); }
}