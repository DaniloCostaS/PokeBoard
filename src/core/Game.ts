import { TILE, NPC_DATA, SHOP_ITEMS } from '../constants';
import { POKEDEX } from '../constants/pokedex';
import { TYPE_CHART } from '../constants/typeChart';
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
import { RARIDADE_DATA } from '../constants/Raridades';

export class Game {
    static players: Player[] = []; 
    static turn: number = 0; 
    static round: number = 1;
    static alertEndsTurn: boolean = true;
    static pendingTileEvent: boolean = false;
    static isCityEvent: boolean = false; 
    static hasRolled: boolean = false; 
    static forcedDiceValue: number = 0;
    static bonusMovement: number = 0;
    static traps: {x: number, y: number, ownerId: number}[] = [];
    static pendingHealItem: string | null = null;
    static gymTeams: { [id: number]: number[] } = {};

    static init(players: Player[], mapSize: number) { 
        this.players = players; 
        
        if(MapSystem.grid.length === 0) { 
            MapSystem.generate(mapSize); 
        } 
        
        if (Object.keys(this.gymTeams).length === 0) {
            this.generateGymTeams();
        }

        if(Network.isOnline && Network.isHost) { 
            if(db) update(ref(db, `rooms/${Network.currentRoomId}`), { 
                grid: MapSystem.grid, 
                gymLocations: MapSystem.gymLocations, 
                gymTeams: this.gymTeams
            }); 
        } 

        this.renderBoard(); 
        this.updateHUD(); 
        this.moveVisuals(); 
        this.checkTurnControl(); 
        this.renderDebugPanel(); 
    }

    // --- NOVA FUNÇÃO GERADORA DE TIMES DE GINÁSIO ---
    static generateGymTeams() {
        this.gymTeams = {};
        
        GYM_DATA.forEach(gym => {
            // --- REGRA 2: SOMENTE ÚLTIMA EVOLUÇÃO ---
            // Verifica se a propriedade nextForm não existe ou é vazia
            const validCandidates = POKEDEX.filter(p => 
                (!p.nextForm || p.nextForm === "") && 
                (gym.type.includes(p.type) || (p.secondType && gym.type.includes(p.secondType)))
            );

            const roster: number[] = [];
            
            for(let i = 0; i < 6; i++) {
                const isLegendaryRoll = Math.random() * 100 < 2;
                
                let pool = [];
                
                if (isLegendaryRoll) {
                    pool = validCandidates.filter(p => p.isLegendary);
                    if (pool.length === 0) pool = validCandidates.filter(p => !p.isLegendary);
                } else {
                    pool = validCandidates.filter(p => !p.isLegendary);
                }

                if (pool.length === 0) pool = validCandidates;
                
                if (pool.length > 0) {
                    const pick = pool[Math.floor(Math.random() * pool.length)];
                    roster.push(pick.id);
                } else {
                    // Fallback de segurança atualizado para Gyarados (ID 130) por ser estágio final
                    roster.push(130); 
                }
            }
            
            this.gymTeams[gym.id] = roster;
        });
        
        console.log("Times de Ginásio Gerados (Apenas Finais):", this.gymTeams);
    }
    
    static addItem(player: Player, itemId: string, amount: number = 1) { if (!player.items[itemId]) { player.items[itemId] = 0; } player.items[itemId] += amount; this.updateHUD(); if(Network.isOnline) Network.syncPlayerState(); }
    static sendGlobalLog(msg: string) { this.log(msg); if(Network.isOnline) { Network.sendAction('LOG', { msg: msg }); } }
    static getGlobalAverageLevel(): number { if (!this.players || this.players.length === 0) return 1; let totalLevels = 0; let totalMons = 0; this.players.forEach(p => { p.team.forEach(m => { totalLevels += m.level; totalMons++; }); }); if (totalMons === 0) return 1; return Math.floor(totalLevels / totalMons); }
    
    static getGlobalAverageTeamSize(): number {
        if (!this.players || this.players.length === 0) return 1;
        let totalMons = 0;
        this.players.forEach(p => { totalMons += p.team.length; });
        
        // Calcula a média e arredonda
        const avg = Math.round(totalMons / this.players.length);
        
        // Garante que o NPC terá pelo menos 1 e no máximo 6 pokémons
        return Math.min(6, Math.max(1, avg)); 
    }

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
        // 1. Filtros de Terreno
        let allowedTypes: string[] = [];
        switch (tileType) {
            case TILE.GRASS: allowedTypes = ['Grama', 'Inseto', 'Normal', 'Veneno', 'Voador', 'Noturno']; break;
            case TILE.WATER: allowedTypes = ['Água', 'Gelo', 'Dragão', 'Fada']; break;
            case TILE.GROUND: allowedTypes = ['Terra', 'Pedra', 'Fogo', 'Lutador', 'Elétrico', 'Psíquico', 'Fantasma', 'Aço']; break;
            default: allowedTypes = ['Normal']; break;
        }

        // 2. Filtros de Nível Global
        const globalAvg = this.getGlobalAverageLevel();
        let allowedStages = [1];
        let allowLegendaries = false;

        if (globalAvg < 5) { allowedStages = [1]; allowLegendaries = false; } 
        else if (globalAvg >= 5 && globalAvg < 10) { allowedStages = [1, 2]; allowLegendaries = true; } 
        else { allowedStages = [1, 2, 3]; allowLegendaries = true; }

        // 3. Pool de Candidatos Válidos
        const validCandidates = POKEDEX.filter(p => {
            // Verifica se ALGUM dos dois tipos bate com o terreno
            const match1 = allowedTypes.includes(p.type);
            const match2 = p.secondType && allowedTypes.includes(p.secondType);

            if (!match1 && !match2) return false;
            if (!allowedStages.includes(p.stage)) return false;
            if (p.isLegendary && !allowLegendaries) return false; 
            return true;
        });

        if (validCandidates.length === 0) return new Pokemon(16, globalAvg); 

        // 4. Sistema de Raridade
        const roll = Math.random() * 100;
        let selectedRarityId = 'Comum'; 
        let cumulativeRate = 0;

        for (const r of RARIDADE_DATA) {
            cumulativeRate += (r.rate || 0);
            if (roll <= cumulativeRate) {
                selectedRarityId = r.id;
                break;
            }
        }

        const rarityInfo = RARIDADE_DATA.find(r => r.id === selectedRarityId);

        // Filtra o Pool baseada na raridade sorteada
        const rarityPool = validCandidates.filter(p => {
            if (p.isLegendary) {
                return selectedRarityId === 'Lendário';
            }

            if (selectedRarityId === 'Lendário' && !p.isLegendary) {
                 // return false; // (Opcional: descomente se quiser exclusividade total)
            }

            // --- CORREÇÃO DOS ERROS TS ---
            // Removemos a variável 'total' duplicada.
            // Usamos p.BaseTotal (Maiúsculo) pois 'p' vem do JSON bruto POKEDEX.
            const checkTotal = p.BaseTotal || (p.hp + p.atk + p.def + p.spd);
            // -----------------------------
            
            if (!rarityInfo) return false;
            return checkTotal >= rarityInfo.baseMin && checkTotal <= rarityInfo.baseMax;
        });

        // 5. Fallback de Segurança
        const finalPool = rarityPool.length > 0 ? rarityPool : validCandidates;
        const chosenTemplate = finalPool[Math.floor(Math.random() * finalPool.length)];

        return new Pokemon(chosenTemplate.id, globalAvg, null);
    }

    static openPokemonDetail(playerIndex: number, slotIndex: number) {
        // 1. Identifica o Dono do Pokémon (Pode ser eu ou outro jogador)
        const targetPlayer = this.players[playerIndex];
        if (!targetPlayer) return console.error("Jogador não encontrado para o índice:", playerIndex);

        const mon = targetPlayer.team[slotIndex];
        if (!mon) return console.error("Pokémon não encontrado no slot:", slotIndex);

        // Garante acesso à POKEDEX global (importada ou window)
        const POKEDEX_GLOBAL = (window as any).POKEDEX || POKEDEX; 

        // --- PREENCHIMENTO VISUAL BÁSICO (Mantém igual) ---
        document.getElementById('detail-id')!.innerText = `#${mon.id.toString().padStart(3, '0')}`;
        document.getElementById('detail-name')!.innerText = mon.name;
        document.getElementById('detail-img')!.setAttribute('src', mon.getSprite());
        document.getElementById('detail-level')!.innerText = mon.level.toString();
        document.getElementById('detail-xp')!.innerText = `${Math.floor(mon.currentXp)} / ${mon.maxXp}`;
        document.getElementById('detail-xp-bar')!.style.width = `${Math.min(100, (mon.currentXp / mon.maxXp) * 100)}%`;
        document.getElementById('detail-shiny')!.style.display = mon.isShiny ? 'block' : 'none';

        const colors: any = { "Normal": "#A8A77A", "Fogo": "#EE8130", "Água": "#6390F0", "Elétrico": "#F7D02C", "Grama": "#7AC74C", "Gelo": "#96D9D6", "Lutador": "#C22E28", "Veneno": "#A33EA1", "Terra": "#E2BF65", "Voador": "#A98FF3", "Psíquico": "#F95587", "Inseto": "#A6B91A", "Pedra": "#B6A136", "Fantasma": "#735797", "Dragão": "#6F35FC", "Noturno": "#705746", "Aço": "#B7B7CE", "Fada": "#D685AD" };
        document.getElementById('detail-header')!.style.background = colors[mon.type] || '#333';

        const typeContainer = document.getElementById('detail-types')!;
        typeContainer.innerHTML = '';
        [mon.type, mon.secondType].filter(t => t).forEach(t => {
            const span = document.createElement('span');
            span.innerText = t;
            span.style.cssText = `background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; margin-left: 4px;`;
            typeContainer.appendChild(span);
        });

        const ivs = (mon as any).ivs || { hp: 0, atk: 0, def: 0, spd: 0 };
        const bonus = (mon as any).bonusStats || { hp: 0, atk: 0, def: 0, spd: 0 };
        const createStatRow = (label: string, total: number, iv: number, bon: number, icon: string) => `
                <div style="background: #fff; border: 1px solid #eee; padding: 8px; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                    <div style="font-weight: bold; margin-bottom: 4px; display:flex; justify-content:space-between; align-items:center;">
                        <span>${icon} ${label}</span>
                        <span style="font-size:1.1rem; color:#2c3e50;">${total}</span>
                    </div>
                    <div style="font-size: 0.7rem; color: #7f8c8d; display:flex; justify-content:space-between; border-top: 1px dashed #eee; padding-top:4px;">
                        <span title="IV">🧬 IV: <b style="color:#8e44ad">${iv}</b></span>
                        <span title="Up" style="color:#2980b9;">⬆️ Up: +${bon}</span>
                    </div>
                </div>`;
        const grid = document.getElementById('detail-stats-grid')!;
        grid.innerHTML = `
            ${createStatRow("HP", mon.maxHp, ivs.hp, bonus.hp, "❤️")}
            ${createStatRow("Atk", mon.atk, ivs.atk, bonus.atk, "⚔️")}
            ${createStatRow("Def", mon.def, ivs.def, bonus.def, "🛡️")}
            ${createStatRow("Vel", mon.speed, ivs.spd, bonus.spd, "💨")}
        `;

        // =========================================================================
        // LÓGICA DE CONTAGEM (CORRIGIDA E DEBUGADA)
        // =========================================================================
        let resoText = "0%";
        let masteryHTML = ""; 
        
        // Verifica se o jogador tem dados na pokedex
        if (targetPlayer.pokedexData) {
            
            // A. Ressonância
            const dexEntry = targetPlayer.pokedexData[mon.id];
            const caught = dexEntry ? (dexEntry.caught || 0) : 0;
            
            if (caught > 1) {
                const perc = Math.min(100, (caught - 1) * 10);
                resoText = `${perc}% (+${caught-1} cópias)`;
            } else {
                resoText = `0% (1ª Captura)`;
            }

            // B. Maestria (Contagem Manual)
            // Função interna para contar as kills
            const countKillsForType = (tType: string) => {
                let totalKills = 0;
                
                // Varre a lista global de pokémons
                POKEDEX_GLOBAL.forEach((pData: any) => {
                    // Se o pokemon da lista for do tipo que estamos procurando...
                    if (pData.type === tType || pData.secondType === tType) {
                        // ...verifica se o JOGADOR ALVO tem registro dele na pokedex
                        const pEntry = targetPlayer.pokedexData[pData.id];
                        if (pEntry && pEntry.defeated) {
                            totalKills += pEntry.defeated;
                        }
                    }
                });
                return totalKills;
            };

            const generateLine = (t: string) => {
                const kills = countKillsForType(t);
                const currentBonus = kills; // 1% por kill
                const nextCheckpoint = kills + 1; // O próximo marco é sempre a próxima kill
                return `
                    <div style="margin-bottom: 4px; border-bottom: 1px dashed #eee; padding-bottom: 2px;">
                        <div style="display:flex; justify-content:space-between;">
                            <span>Tipo ${t}:</span>
                            <b style="color: ${currentBonus > 0 ? '#27ae60' : '#c0392b'};">+${currentBonus}% Dano</b>
                        </div>
                        <div style="font-size:0.7rem; color:#7f8c8d;">
                            Abatidos: <b>${kills}</b> / ${nextCheckpoint}
                        </div>
                    </div>
                `;
            };

            masteryHTML += generateLine(mon.type);
            if (mon.secondType) {
                masteryHTML += generateLine(mon.secondType);
            }
        } else {
            masteryHTML = "<div style='color:#999; font-style:italic;'>Nenhum dado na Pokédex.</div>";
        }

        document.getElementById('detail-reso')!.innerText = resoText;
        document.getElementById('detail-mastery')!.innerHTML = masteryHTML;
        document.getElementById('detail-mastery')!.style.fontWeight = "normal";

        document.getElementById('detail-modal')!.style.display = 'flex';
    }
    
    // --- NOVA FUNÇÃO DE CHECKPOINT ---
    static getLastCityCoord(p: Player): {x: number, y: number} {
        // Pega o número da casa atual onde o jogador está
        let currentIdx = MapSystem.getIndex(p.x, p.y);
        
        // Vai olhando casa por casa para trás até achar uma cidade
        while (currentIdx >= 0) {
            const coord = MapSystem.getCoord(currentIdx);
            if (MapSystem.grid[coord.y][coord.x] === TILE.CITY) {
                return coord; // Achou! Retorna a posição dessa cidade.
            }
            currentIdx--;
        }
        // Se por algum motivo não achar, volta pro início garantido.
        return {x: 0, y: 0}; 
    }

    static handleTotalDefeat(p: Player) { 
        const msg = `🚑 ${p.name} sofreu uma derrota total!\nSerá levado ao último Centro Pokémon para recuperação emergencial.`; 
        
        // Passo 2: Move para a última cidade
        const city = this.getLastCityCoord(p);
        p.x = city.x; 
        p.y = city.y; 
        
        // Passo 3: Marca a penalidade
        p.skipTurns += 2; 
       
        // --- CORREÇÃO: Removemos a linha abaixo para manter os efeitos ---
        // p.effects = {};  <-- REMOVIDO! Agora os buffs/debuffs persistem.
        // ----------------------------------------------------------------
        
        // Passo 4: Revive e cura todos os pokémons
        p.team.forEach(mon => { mon.currentHp = mon.maxHp; }); 
        
        this.sendGlobalLog(`🚑 ${p.name} foi resgatado! Equipe totalmente curada no Centro Pokémon, mas perderá 2 turnos.`); 
        
        this.showGlobalAlert(msg, p.name, true, false);
        
        this.moveVisuals(); 
        this.updateHUD(); 
        
        // Passo 5: Salva todas as informações (Posição, Punição e Cura) de uma vez no Firebase
        const Network = (window as any).Network;
        if(Network.isOnline && p.id === Network.myPlayerId) {
             Network.syncPlayerState(); 
        }
    }
    
    static renderDebugPanel() { const container = document.querySelector('.extra-space'); if(container) { container.innerHTML = ` <button class="btn btn-secondary" onclick="window.Game.openCardLibrary()">📖 Ver Todas as Cartas</button> <button class="btn btn-secondary" style="background: #27ae60;" onclick="window.Game.openXpRules()">📘 Regras de XP</button> <button class="btn btn-secondary" style="background: #e67e22;" onclick="window.Game.openCaptureRules()">🦅 Regras de Captura</button> <div style="margin-top:10px; font-size:0.7rem; color:#aaa;">DEBUG MOVE</div> <div style="display:flex; gap:5px; justify-content:center;"> <input type="number" id="debug-input" value="1" min="1" max="50" style="width:50px; text-align:center; border:none; padding:5px; border-radius:4px;"> <button class="btn" style="width:auto; margin:0; padding:5px 10px;" onclick="window.Game.debugMove()">GO</button> </div> <button class="btn" style="margin-top:5px; background: #e67e22;" onclick="window.Game.exportSave()">💾 DEBUG SAVE</button> <div style="margin-top:5px;"><small id="online-indicator" style="color:cyan;">OFFLINE</small></div> `; } }
    
    static openCardLibrary() { 
        const list = document.getElementById('library-list')!; 
        list.innerHTML = ''; 
        import('../constants').then(({CARDS_DB}) => { 
            CARDS_DB.forEach(c => { 
                const d = document.createElement('div'); 
                d.className = 'card-item'; 
                
                let typeClass = 'type-battle'; let typeLabel = 'BATTLE';
                if (c.type === 'move') { typeClass = 'type-move'; typeLabel = 'MOVE'; }
                else if (c.type === 'auto') { typeClass = 'type-auto'; typeLabel = 'AUTO'; }
                
                d.innerHTML = `<div class="card-info"><span class="card-name">${c.icon} ${c.name} <span class="card-type-badge ${typeClass}">${typeLabel}</span></span><span class="card-desc">${c.desc}</span></div>`; 
                list.appendChild(d); 
            }); 
        }); 
        document.getElementById('library-modal')!.style.display = 'flex'; 
    }

    static openXpRules() { document.getElementById('xp-rules-modal')!.style.display = 'flex'; }
    static openCaptureRules() { const modal = document.getElementById('capture-rules-modal'); if (modal) modal.style.display = 'flex'; }

    static openBoardCards(pId: number) { 
        const Network = (window as any).Network;
        
        // Validação de segurança (já existente)
        if(Network.isOnline && pId !== Network.myPlayerId) return alert("Privado!"); 
        
        const p = this.players[pId]; 
        const list = document.getElementById('board-cards-list')!; 
        list.innerHTML = ''; 
        
        // =====================================================================
        // NOVO: BOTÃO DE SACRIFÍCIO (Aparece no topo da lista)
        // =====================================================================
        // Verifica se sou eu mesmo olhando minhas cartas
        const isMe = !Network.isOnline || (p.id === Network.myPlayerId);
        
        // Só mostra o botão se eu tiver pelo menos 2 cartas para sacrificar
        if (isMe && p.cards.length >= 2) {
            const sacBtn = document.createElement('button');
            sacBtn.className = 'btn btn-sacrifice';
            sacBtn.innerHTML = `<span>🔥 SACRIFICAR CARTAS (2 ➡ 1)</span>`;
            sacBtn.onclick = () => {
                // Fecha o modal atual
                document.getElementById('board-cards-modal')!.style.display = 'none';
                
                // Abre o modal de sacrifício (que criamos no passo anterior na classe Cards)
                // Usamos (window as any) para garantir acesso global
                (window as any).Cards.openSacrificeModal();
            };
            list.appendChild(sacBtn);
        }
        // =====================================================================

        if(p.cards.length === 0) {
            // Se não tiver cartas, avisa (mas se tiver botão ele já apareceu acima, difícil acontecer pq precisa de 2 cartas)
            if (list.innerHTML === '') list.innerHTML = "<em>Sem cartas.</em>"; 
        }
        
        const isMyTurn = this.canAct() && this.turn === pId; 
        const canUseMove = isMyTurn && !this.hasRolled; 
        
        p.cards.forEach(c => { 
            const d = document.createElement('div'); 
            d.className = 'card-item'; 
            
            let typeClass = 'type-battle'; let typeLabel = 'BATTLE';
            if (c.type === 'move') { typeClass = 'type-move'; typeLabel = 'MOVE'; }
            else if (c.type === 'auto') { typeClass = 'type-auto'; typeLabel = 'AUTO'; }

            let actionBtn = ''; 
            if (c.type === 'move') { 
                if (canUseMove) actionBtn = `<button class="btn-use-card" onclick="window.Cards.activate('${c.id}')">USAR</button>`; 
                else actionBtn = `<button class="btn-use-card" disabled title="Só antes de rolar">USAR</button>`; 
            } else if (c.type === 'auto') {
                actionBtn = `<button class="btn-use-card" disabled style="background:#8e44ad" title="Ativação Automática">AUTO</button>`; 
            } else { 
                actionBtn = `<button class="btn-use-card" disabled style="background:#555" title="Só em batalha">BATTLE</button>`; 
            } 
            
            d.innerHTML = `<div class="card-info"><span class="card-name">${c.icon} ${c.name} <span class="card-type-badge ${typeClass}">${typeLabel}</span></span><span class="card-desc">${c.desc}</span></div>${actionBtn}`; 
            list.appendChild(d); 
        }); 
        
        document.getElementById('board-cards-modal')!.style.display = 'flex'; 
    }
    
    static useBoardCard(cardId: string) { const p = this.getCurrentPlayer(); const cardIndex = p.cards.findIndex(c => c.id === cardId); if (cardIndex === -1) return; const card = p.cards[cardIndex]; if (card.id === 'bike') { p.cards.splice(cardIndex, 1); document.getElementById('board-cards-modal')!.style.display = 'none'; this.log(`${p.name} usou Bicicleta!`); if(Network.isOnline) { Network.sendAction('ROLL', { result: 5 }); return; } this.hasRolled = true; this.animateDice(5, 0); } else if (card.id === 'teleport') { p.cards.splice(cardIndex, 1); document.getElementById('board-cards-modal')!.style.display = 'none'; this.log(`${p.name} usou Teleporte!`); p.x = 0; p.y = 0; this.moveVisuals(); this.handleTile(p); } else { alert("Efeito não implementado na demo."); } if(Network.isOnline) Network.syncPlayerState(); }
    static forceDice(val: number) { this.forcedDiceValue = val; this.rollDice(); }
    
    static placeTrap(x: number, y: number, ownerId: number) { 
        this.traps.push({x, y, ownerId}); 
        this.renderTraps(); // Atualiza a tela
        
        // Avisa a todos da sala que uma armadilha foi colocada!
        const Network = (window as any).Network;
        if(Network.isOnline) {
             Network.sendAction('SYNC_TRAPS', { traps: this.traps });
        }
    }

    // --- NOVO MÉTODO: Limpa e desenha as armadilhas de forma segura ---
    static renderTraps(newTraps?: any[]) {
        // Limpa apenas as bordas inline de armadilha (sem apagar as do CSS do ginásio)
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(t => {
            const htmlEl = t as HTMLElement;
            if (htmlEl.style.border.includes('dashed')) {
                htmlEl.style.border = "";
            }
        });

        if (newTraps) this.traps = newTraps;

        // Desenha as armadilhas ativas
        this.traps.forEach(t => {
            const tile = document.getElementById(`tile-${t.x}-${t.y}`); 
            if(tile) tile.style.border = "2px dashed red"; 
        });
    }
    
    static async rollDice() { 
        if(!this.canAct() || this.hasRolled) return; 
        this.hasRolled = true; 
        let result = 0; 
        
        if (this.forcedDiceValue > 0) { 
            result = this.forcedDiceValue; 
            this.forcedDiceValue = 0; 
            this.log("🔮 Dado Mágico usado!"); 
        } else { 
            const p = this.getCurrentPlayer(); 
            if (p.effects.slow && p.effects.slow > 0) { 
                // Efeito Slow agora anda de 1 a 1 casa
                result = 1; 
                p.effects.slow--; 
                this.log("🕸️ Lentidão! Rolou apenas 1d1."); 
            } else { 
                // Rolagem normal d6
                result = Math.floor(Math.random() * 6) + 1; 
            } 
        } 
        
        if(Network.isOnline) { 
            Network.sendAction('ROLL', { result: result }); 
        } 
        const playerId = Network.isOnline ? Network.myPlayerId : this.turn; 
        this.animateDice(result, playerId); 
    }

    static debugMove() { 
        if(!this.canAct()) return; 
        const input = document.getElementById('debug-input') as HTMLInputElement; 
        const result = parseInt(input.value) || 1; 
        this.log(`[DEBUG] Forçando ${result} passos.`); 
        
        if(Network.isOnline) { 
            Network.sendAction('ROLL', { result: result }); 
            // CORREÇÃO: Faltava o seu próprio personagem andar na sua tela!
            this.animateDice(result, Network.myPlayerId); 
            return; 
        } 
        
        this.animateDice(result, 0); 
    }

    static moveVisuals() { this.players.forEach((p, idx) => { const currentTile = document.getElementById(`tile-${p.x}-${p.y}`); if(!currentTile) return; let token = document.getElementById(`p-token-${idx}`); if (token && token.parentElement === currentTile) { if(idx === this.turn) token.classList.add('active-token'); else token.classList.remove('active-token'); return; } if (token) token.remove(); const t = document.createElement('div'); t.id = `p-token-${idx}`; t.className = `player-token ${idx===this.turn?'active-token':''}`; t.style.backgroundImage = `url('${p.avatar}')`; t.style.borderColor = PLAYER_COLORS[idx % PLAYER_COLORS.length]; if(MapSystem.size >= 30) { t.style.width = '90%'; t.style.height = '90%'; } currentTile.appendChild(t); if(idx===this.turn) currentTile.scrollIntoView({block:'center',inline:'center',behavior:'smooth'}); }); }
    
    static async animateDice(result: number, playerId: number) { 
        const die = document.getElementById('d20-display')!; 
        for(let i=0;i<5;i++) { 
            die.innerText = `🎲 ${Math.floor(Math.random()*6)+1}`; 
            await new Promise(r=>setTimeout(r,50)); 
        } 
        die.innerText = `🎲 ${result}`; 
        
        this.log(`${this.players[playerId].name} tirou ${result}`); 
        
        const Network = (window as any).Network;
        if (!Network.isOnline || playerId === Network.myPlayerId) {
            const p = this.players[playerId]; 
            const aliveTeam = p.team.filter(m => !m.isFainted());
            
            // --- ALTERAÇÃO: XP ganho é exatamente o valor tirado no dado ---
            const xpGain = result;
            
            if (aliveTeam.length > 0) { 
                const luckyMon = aliveTeam[Math.floor(Math.random() * aliveTeam.length)]; 
                luckyMon.gainXp(xpGain, p); 
            } 
        }

        this.movePlayerLogic(result, playerId); 
    }
    
    static async movePlayerLogic(steps: number, pId: number) { 
        const p = this.players[pId]; 
        const totalTiles = MapSystem.size * MapSystem.size; 
        const Network = (window as any).Network;
        
        if (this.bonusMovement > 0) { 
            steps += this.bonusMovement; 
            this.bonusMovement = 0; 
            this.log("👟 Bônus de movimento aplicado!"); 
        } 
        
        let hitTrap = false; // <--- NOVA VARIÁVEL PARA CONTROLAR O FLUXO DE EVENTOS

        for(let i=0; i<steps; i++) { 
            let currentIdx = MapSystem.getIndex(p.x, p.y); 
            currentIdx++; 
            
            if (currentIdx >= totalTiles) { 
                currentIdx = 0; 
                
                if (!Network.isOnline || pId === Network.myPlayerId) {
                    // --- NOVAS RECOMPENSAS DE VOLTA COMPLETA ---
                    p.gold += 500; 
                    Cards.draw(p); 
                    Cards.draw(p); // Compra a segunda carta
                    
                    this.sendGlobalLog(`🚩 ${p.name} completou uma volta! Ganhou 500G e 2 Cartas!`); 
                    
                    // --- LOG DE AUDITORIA: GANHO DE VOLTA ---
                    this.sendGlobalLog(`💰 [Extrato] ${p.name} recebeu +500G (Volta no Tabuleiro).`);
                    this.sendGlobalLog(`💰 [Extrato] Novo Saldo: ${p.gold}G.`);
                    
                    this.updateHUD(); // Atualiza a tela na hora!
                    if(Network.isOnline) Network.syncPlayerState();
                }
            }
            
            const nextCoord = MapSystem.getCoord(currentIdx); 
            p.x = nextCoord.x; 
            p.y = nextCoord.y; 
            this.performVisualStep(pId, p.x, p.y); 
            await new Promise(r => setTimeout(r, 150)); 
            
            const trapIdx = this.traps.findIndex(t => t.x === p.x && t.y === p.y && t.ownerId !== p.id); 
            if (trapIdx > -1) { 
                hitTrap = true; // Marca que o jogador foi pego

                const trap = this.traps[trapIdx];
                const owner = this.players.find(op => op.id === trap.ownerId);

                // Transferência de Gold
                let stolenGold = 0;
                if (p.gold > 0) {
                    // --- ALTERAÇÃO: Agora rouba 20% do ouro total da vítima ---
                    stolenGold = Math.floor(p.gold * 0.20);
                    // Garante que roube pelo menos 1 moeda se a conta der zero (ex: 20% de 4 = 0.8)
                    if (stolenGold === 0 && p.gold > 0) stolenGold = 1;

                    p.gold -= stolenGold;
                    if (owner) owner.gold += stolenGold;
                }

                p.skipTurns += 1; 
                this.traps.splice(trapIdx, 1); 
                this.renderTraps(); 
                
                // CORREÇÃO: Força a interface a atualizar imediatamente para a vítima ver o ouro sumindo!
                this.updateHUD();

                if (!Network.isOnline || pId === Network.myPlayerId) {
                    // --- CORREÇÃO FIREBASE: Salva ambos na mesma requisição para evitar conflito ---
                    if (Network.isOnline) {
                        if (owner && stolenGold > 0) {
                            Network.syncPlayers([p.id, owner.id]); // Salva a vítima e o dono da armadilha juntos!
                        } else {
                            Network.syncPlayerState(); // Salva só a vítima (se não roubou ouro)
                        }
                    }
                    // -------------------------------------------------------------------------------

                    if (Network.isOnline) {
                        Network.sendAction('SYNC_TRAPS', { traps: this.traps }); 
                    }

                    let msg = `🪤 ${p.name} caiu numa armadilha! Punição: +1 turno sem jogar`;
                    if (stolenGold > 0 && owner) {
                        msg += ` e perdeu ${stolenGold}G para ${owner.name}!`;
                        // --- LOG DE AUDITORIA: ROUBO DE ARMADILHA ---
                        this.sendGlobalLog(`💰 [Extrato] Transferência de ${stolenGold}G de ${p.name} para ${owner.name} (Armadilha).`);
                        this.sendGlobalLog(`💰 [Extrato] Novo Saldo de ${p.name}: ${p.gold}G.`);
                        this.sendGlobalLog(`💰 [Extrato] Novo Saldo de ${owner.name}: ${owner.gold}G.`);
                    } else {
                        msg += `!`;
                    }
                    this.sendGlobalLog(msg); 

                    this.pendingTileEvent = true; 
                    this.showGlobalAlert(msg, p.name, true, false); 
                    
                    if (Network.isOnline) {
                        Network.sendAction('SHOW_ALERT', { msg: msg, playerName: p.name, endsTurn: false });
                    }
                }
                
                break; // Para o bonequinho de andar imediatamente
            } 
        } 
        
        if (!Network.isOnline || pId === Network.myPlayerId) { 
            // Se NÃO tiver caído numa armadilha, ativa a casa direto.
            // Se caiu, o HandleTile será ativado quando ele fechar o aviso da armadilha na tela.
            if (!hitTrap) {
                this.handleTile(p); 
            }
            if(Network.isOnline) Network.syncPlayerState(); 
        } 
    }

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
            
            // --- LÓGICA DINÂMICA DE IMAGEM ---
            // Ele puxa direto o nome da imagem que você colocou na NPC_DATA!
            const npcImg = npc.img ? `/assets/img/NPCs/${npc.img}` : '/assets/img/Treinadores/Red.jpg'; 
            // ---------------------------------
            
            const npcLevel = this.getGlobalAverageLevel(); 
            const teamSize = this.getGlobalAverageTeamSize();
            const npcTeam: Pokemon[] = [];
            
            // Sorteia os Pokémons até preencher a quantidade média
            for(let i = 0; i < teamSize; i++) {
                const monId = npc.team[Math.floor(Math.random() * npc.team.length)]; 
                npcTeam.push(new Pokemon(monId, npcLevel, null));
            }

            // Inicia a batalha com o nome e imagem corretos
            Battle.setup(p, npcTeam as any, false, npc.name, npc.gold, null, false, 0, npcImg, type); 
            return; 
        }
        
        if(type === TILE.CITY) { 
            this.isCityEvent = true; 
            document.getElementById('city-modal')!.style.display='flex'; 
        }
        
        else if(type === TILE.EVENT) { 
            let localMsg = "";
            let remoteMsg = "";

            // =========================================================
            // 1. CHANCE DE TELETRANSPORTE (15%)
            // =========================================================
            const eventRoll = Math.random();
            if (eventRoll < 0.15) {
                const totalTiles = MapSystem.size * MapSystem.size;
                const randomIdx = Math.floor(Math.random() * totalTiles);
                const targetCoord = MapSystem.getCoord(randomIdx);

                // Move o jogador
                p.x = targetCoord.x;
                p.y = targetCoord.y;
                this.moveVisuals();

                localMsg = `🌀 UM VÓRTICE SE ABRIU!\n\nVocê pisou em uma fenda espacial e foi teletransportado para uma área aleatória do mapa!`;
                remoteMsg = `🌀 ${p.name} pisou em um vórtice e foi teletransportado!`;

                this.log(localMsg.replace(/\n\n/g, ' '));
                
                // Ativa a casa de destino DEPOIS de clicar no 'OK'
                this.pendingTileEvent = true; 
                this.showGlobalAlert(localMsg, p.name, true, false); // false = não encerra o turno

                const Network = (window as any).Network;
                if(Network.isOnline) {
                    Network.syncPlayerState();
                    Network.sendAction('LOG', { msg: remoteMsg });
                    Network.sendAction('SHOW_ALERT', { msg: remoteMsg, playerName: p.name, endsTurn: false });
                }
                return; // Para a função aqui, a nova casa será processada quando fechar o alerta
            }

            // =========================================================
            // 2. SE NÃO TELETRANPORTOU: CARTA (50%) ou ITEM (50%)
            // =========================================================
            if(Math.random() < 0.5) { 
                const card = Cards.draw(p, true); // true = Log silencioso
                localMsg = `Você explorou o evento e encontrou uma carta:\n\n${card.icon} ${card.name}`;
                remoteMsg = `🌟 ${p.name} explorou o evento e encontrou uma Carta Misteriosa!`;
            } else { 
                // --- NOVA LÓGICA DE ITENS COM RARIDADE ---
                const itemRoll = Math.random();
                let giftId = '';

                // Apenas 5% de chance TOTAL de puxar um item Raro
                if (itemRoll < 0.05) {
                    const rareItems = ['ultrafullrestore', 'ultramaxrevive', 'masterball'];
                    // Sorteia 1 entre os 3
                    giftId = rareItems[Math.floor(Math.random() * rareItems.length)];
                } else {
                    // Os 95% restantes caem nos itens comuns (Filtra a loja tirando os raros)
                    const normalItems = SHOP_ITEMS.filter(i => !['ultrafullrestore', 'ultramaxrevive', 'masterball'].includes(i.id));
                    const randomItem = normalItems[Math.floor(Math.random() * normalItems.length)];
                    giftId = randomItem.id;
                }

                // Busca o nome bonito do item sorteado
                const itemData = SHOP_ITEMS.find(i => i.id === giftId);
                const itemName = itemData ? itemData.name : giftId;

                this.addItem(p, giftId, 1); 
                localMsg = `Você explorou o evento e encontrou um item:\n\n🎒 ${itemName}`;
                remoteMsg = `🌟 ${p.name} explorou o evento e encontrou: ${itemName}!`;
            } 
            
            this.log(localMsg.replace(/<[^>]*>?/gm, '').replace(/\n\n/g, ' ')); // Limpa as tags de imagem do log de texto
            
            // Abre a Pop-up Bonita!
            this.showGlobalAlert(localMsg, p.name, true);

            const Network = (window as any).Network;
            if(Network.isOnline) {
                Network.sendAction('LOG', { msg: remoteMsg });
                Network.sendAction('SHOW_ALERT', { msg: remoteMsg, playerName: p.name });
            }
        }

        else if(type === TILE.GYM) { 
            const gymId = MapSystem.gymLocations[`${p.x},${p.y}`] || 1; 
            
            // Verifica se NÃO tem a insígnia
            if (!p.badges[gymId-1]) { 
                Battle.setup(p, new Pokemon(150, 1, false), false, "Líder de Ginásio", 1000, null, true, gymId, "", type); 
            } 
            else { 
                // Já venceu o ginásio! Inicia a nova mecânica de Teletransporte
                const roll = Math.floor(Math.random() * 100) + 1;
                let didTeleport = false;
                
                if (roll <= 25) {
                    // 1. Vasculha o mapa em busca de ginásios ainda não derrotados
                    const undefeatedGyms: {x: number, y: number, id: number}[] = [];
                    for (const key in MapSystem.gymLocations) {
                        const id = MapSystem.gymLocations[key];
                        if (!p.badges[id - 1]) {
                            const [gx, gy] = key.split(',').map(Number);
                            undefeatedGyms.push({x: gx, y: gy, id: id});
                        }
                    }

                    // 2. Se achou algum ginásio livre, faz o teletransporte
                    if (undefeatedGyms.length > 0) {
                        const randomGym = undefeatedGyms[Math.floor(Math.random() * undefeatedGyms.length)];
                        
                        this.sendGlobalLog(`🌪️ UAU! A estátua do Ginásio reagiu e teletransportou ${p.name} para um desafio inédito!`);
                        
                        // Move o jogador fisicamente no tabuleiro
                        p.x = randomGym.x;
                        p.y = randomGym.y;
                        this.moveVisuals(); 
                        
                        // Inicia a luta imediatamente no novo ginásio
                        Battle.setup(p, new Pokemon(150, 1, false), false, "Líder de Ginásio", 1000, null, true, randomGym.id, "", type); 
                        didTeleport = true;
                    }
                }
                
                // 3. Se rolou acima de 25% OU se tentou teletransportar mas já é mestre de todos
                if (!didTeleport) {
                    const msgLocal = `Você descansou no Ginásio aliado e encontrou uma carta!\n\n🎒 Ganhou 1 Carta`;
                    const msgGlobal = `🎒 ${p.name} visitou um Ginásio já vencido e ganhou 1 Carta!`;
                    
                    const Cards = (window as any).Cards;
                    if(Cards) Cards.draw(p, true); // true = Silencioso para não spammar log duplo
                    
                    this.log(msgLocal.replace(/\n\n/g, ' ')); 
                    
                    // Exibe o Alerta Bonito e só passa o turno quando clicar em OK
                    this.showGlobalAlert(msgLocal, p.name, true);

                    const Network = (window as any).Network;
                    if(Network.isOnline) {
                        Network.sendAction('LOG', { msg: msgGlobal });
                        Network.sendAction('SHOW_ALERT', { msg: msgGlobal, playerName: p.name });
                    }
                }
            } 
        }
        else if([TILE.GRASS, TILE.WATER, TILE.GROUND].includes(type)) { 
            if (Math.random() < 0.8) { 
                //const wildMon = this.generateWildPokemon(); 
                const wildMon = this.generateWildPokemon(type);
                Battle.setup(p, wildMon, false, "Selvagem", 0, null, false, 0, "", type); 
            } 
            else { 
                const messages = [ "Você procurou, mas nenhum Pokémon selvagem apareceu dessa vez!", "O mato se mexeu... mas era só o vento 😅", "Nada de Pokémon por aqui... talvez na próxima!", "Está tudo muito quieto...", "Um Pidgey voou longe, você não alcançou." ]; 
                const msg = messages[Math.floor(Math.random() * messages.length)]; 
                
                this.log(msg); 
                
                // --- NOVA LÓGICA DO ALERTA ---
                this.showGlobalAlert(msg, p.name, true);
                
                const Network = (window as any).Network;
                if(Network.isOnline) {
                    Network.sendAction('SHOW_ALERT', { msg: msg, playerName: p.name });
                }
                // ATENÇÃO: O this.nextTurn() foi removido daqui! 
                // O turno agora só passa quando o jogador clicar no botão "OK".
            } 
        } 
        else { this.nextTurn(); }
    }
    
    // =========================================================================================
    // CORREÇÃO: Lógica de Cura Completa (Revive + Heal All)
    // =========================================================================================
    static handleCityChoice(c: string) { 
        const player = this.getCurrentPlayer();

        if (c === 'heal') { 
            // Cura o time
            player.team.forEach(p => { 
                p.currentHp = p.maxHp; 
            }); 
            
            this.sendGlobalLog(`🏥 ${player.name} recuperou seu time no Centro Pokémon!`);
            this.updateHUD(); 
            this.isCityEvent = false; 
            
            if(Network.isOnline) Network.syncPlayerState(); 
            
            document.getElementById('city-modal')!.style.display='none'; 
            this.nextTurn(); 
        } 
        else if (c === 'card') {
            // Nova Lógica de Comprar Carta
            if (player.gold >= 500) {
                player.gold -= 500;
                
                // Fecha a janela da cidade
                this.isCityEvent = false;
                document.getElementById('city-modal')!.style.display='none'; 
                
                const Cards = (window as any).Cards;
                const card = Cards.draw(player, true); // true = Log silencioso original
                
                // Cria as mensagens personalizadas
                const localMsg = `Você comprou uma carta misteriosa no mercado negro por 500G:\n\n${card.icon} ${card.name}`;
                const remoteMsg = `🃏 ${player.name} comprou uma Carta Misteriosa no Centro Pokémon!`;
                
                this.log(localMsg.replace(/\n\n/g, ' '));
                this.sendGlobalLog(`💰 [Extrato] ${player.name} gastou -500G (Compra de Carta).`);
                this.sendGlobalLog(`💰 [Extrato] Novo Saldo: ${player.gold}G.`);
                
                this.updateHUD();

                // Usa o sistema de Alerta Bonito! 
                // O último "true" avisa o sistema que o turno DEVE ser passado quando o jogador clicar em OK.
                this.showGlobalAlert(localMsg, player.name, true, true);

                const Network = (window as any).Network;
                if(Network.isOnline) {
                    Network.syncPlayerState();
                    Network.sendAction('LOG', { msg: remoteMsg });
                    Network.sendAction('SHOW_ALERT', { msg: remoteMsg, playerName: player.name });
                }
            } else {
                // Deixa a janela aberta e avisa o erro
                alert("Ouro insuficiente! Você precisa de 500G para comprar uma carta.");
            }
        }
        else if (c === 'shop') { 
            // Abre a loja
            document.getElementById('city-modal')!.style.display='none'; 
            Shop.open();
        } 
    }

    static nextTurn() {
        this.saveGame(); 
        const currentP = this.getCurrentPlayer();
        currentP.resetTurnFlags();

        // --- CORREÇÃO LURE SHINY: Só decrementa se o jogador ROLOU O DADO ---
        // Se ele pulou a vez (skipTurns), o efeito não é gasto!
        if (this.hasRolled && currentP.effects && currentP.effects.lureShiny && currentP.effects.lureShiny > 0) {
            currentP.effects.lureShiny--;
            
            if (currentP.effects.lureShiny === 0) {
                this.sendGlobalLog(`✨ O efeito Lure Shiny de ${currentP.name} perdeu a força.`);
            }
            
            // Salva a contagem atualizada no Firebase
            const Network = (window as any).Network;
            if (Network && Network.isOnline) Network.syncSpecificPlayer(currentP.id);
        }
        // ---------------------------------------------------------------------

        if (currentP.effects.extraTurn) {
            currentP.effects.extraTurn = false;
            this.hasRolled = false;
            this.sendGlobalLog(`⏳ ${currentP.name} joga novamente!`);
            this.updateHUD();
            this.checkTurnControl();
            return;
        }

        // --- NOVO: AVISO VISUAL DE FIM DE TURNO ---
        this.sendGlobalLog(`🛑 Fim do turno de ${currentP.name} 🛑`);
        // ------------------------------------------

        // --- NOVA LÓGICA DE RODADA ---
        const nextTurnIdx = (this.turn + 1) % this.players.length; 
        if (nextTurnIdx === 0) {
            this.round++; // Completou um ciclo inteiro, aumenta a rodada!
        }
        this.turn = nextTurnIdx; 
        this.hasRolled = false; 
        
        if(Network.isOnline) { 
            Network.syncTurn(this.turn, this.round); // Agora envia a rodada junto!
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
    
    static openPokedexEntry(targetId: number) {
        this.openPokedex(this.turn, targetId);
    }

    static openPokedex(pId: number, filterId: number | null = null) {
        const p = this.players[pId];
        const list = document.getElementById('pokedex-list')!;
        list.innerHTML = '';
        
        const colors: any = { "Normal": "#A8A77A", "Fogo": "#EE8130", "Água": "#6390F0", "Elétrico": "#F7D02C", "Grama": "#7AC74C", "Gelo": "#96D9D6", "Lutador": "#C22E28", "Veneno": "#A33EA1", "Terra": "#E2BF65", "Voador": "#A98FF3", "Psíquico": "#F95587", "Inseto": "#A6B91A", "Pedra": "#B6A136", "Fantasma": "#735797", "Dragão": "#6F35FC", "Noturno": "#705746", "Aço": "#B7B7CE", "Fada": "#D685AD" };

        POKEDEX.forEach(mon => {
            // Filtro para mostrar apenas um Pokémon (Ex: Inimigo na batalha)
            if (filterId !== null && mon.id !== filterId) return;

            const dexEntry = p.pokedexData[mon.id] || { seen: 0, caught: 0, defeated: 0 };
            
            const c1 = colors[mon.type] || "#777";
            let typeHtml = `<span style="background-color:${c1}; color:white; padding:2px 6px; border-radius:4px; font-size:0.6rem; text-shadow:1px 1px 1px rgba(0,0,0,0.5);">${mon.type}</span>`;
            if (mon.secondType) {
                const c2 = colors[mon.secondType] || "#777";
                typeHtml += ` <span style="background-color:${c2}; color:white; padding:2px 6px; border-radius:4px; font-size:0.6rem; text-shadow:1px 1px 1px rgba(0,0,0,0.5);">${mon.secondType}</span>`;
            }

            // --- CÁLCULO DE VANTAGENS E DESVANTAGENS (Defensivas) ---
            const weaknesses: string[] = [];
            const resistances: string[] = [];

            // Itera sobre todos os tipos de ataque possíveis na Tabela
            for (const atkType in TYPE_CHART) {
                let multiplier = 1;

                // Aplica multiplicador do Tipo 1
                if (TYPE_CHART[atkType] && (TYPE_CHART[atkType] as any)[mon.type]) {
                    multiplier *= (TYPE_CHART[atkType] as any)[mon.type];
                }

                // Aplica multiplicador do Tipo 2 (se existir)
                if (mon.secondType && TYPE_CHART[atkType] && (TYPE_CHART[atkType] as any)[mon.secondType]) {
                    multiplier *= (TYPE_CHART[atkType] as any)[mon.secondType];
                }

                if (multiplier > 1) weaknesses.push(atkType);
                if (multiplier < 1 && multiplier > 0) resistances.push(atkType);
            }

            // Formata HTML das fraquezas e resistências
            const formatTypeList = (types: string[], label: string, titleColor: string) => {
                if (types.length === 0) return '';
                
                const badges = types.map(t => {
                    const typeColor = colors[t] || "#777";
                    return `<span style="background-color:${typeColor}; color:white; padding:2px 5px; border-radius:4px; font-size:0.6rem; text-shadow:1px 1px 1px rgba(0,0,0,0.5); margin-right:3px; display:inline-block; margin-bottom:2px;">${t}</span>`;
                }).join('');

                return `<div style="margin-top:4px; font-size:0.7rem; color:${titleColor};"><b>${label}:</b><br>${badges}</div>`;
            };
            // --------------------------------------------------------

            const d = document.createElement('div');
            d.className = 'dex-card';
            
            const isDiscovered = dexEntry.seen > 0 || dexEntry.caught > 0;
            const imgFilter = isDiscovered ? '' : 'filter: brightness(0) opacity(0.4);';
            const displayName = isDiscovered ? mon.name : '???';

            d.innerHTML = `
                <div style="font-weight: bold; color: #7f8c8d; width: 100%; text-align: left; font-size: 0.8rem;">#${mon.id.toString().padStart(3, '0')}</div>
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${mon.id}.png" style="width: 70px; height: 70px; image-rendering: pixelated; ${imgFilter}">
                <b style="font-size: 1rem; color: #2c3e50;">${displayName}</b>
                <div style="display:flex; gap:5px; margin: 5px 0;">${typeHtml}</div>
                
                <div class="dex-stats-row">
                    <span title="HP Base">❤️ ${mon.hp}</span> 
                    <span title="Ataque Base">⚔️ ${mon.atk}</span> 
                    <span title="Defesa Base">🛡️ ${mon.def}</span> 
                    <span title="Velocidade Base">💨 ${mon.spd}</span>
                </div>
                
                <div style="margin-top:5px; text-align:left; width:100%; padding:0 5px;">
                    ${formatTypeList(weaknesses, 'Fraquezas', '#c0392b')}
                    ${formatTypeList(resistances, 'Resistências', '#27ae60')}
                </div>

                <div style="font-size: 0.75rem; color: #8e44ad; margin-top: 6px; text-align: center; min-height: 15px;">
                    ${mon.nextForm ? `Evolui: <b>${mon.nextForm}</b> (Lv.${mon.evoTrigger})` : '<b>Estágio Final</b>'}
                </div>

                <div class="dex-track-row">
                    <span title="Vistos" style="color: #3498db;">👁️ ${dexEntry.seen}</span>
                    <span title="Derrotados" style="color: #e74c3c;">💀 ${dexEntry.defeated}</span>
                    <span title="Capturados" style="color: #2ecc71;">🦅 ${dexEntry.caught}</span>
                </div>
            `;
            list.appendChild(d);
        });

        document.getElementById('pokedex-modal')!.style.display = 'flex';
    }

    static useItemBoard(key: string, pId: number) { const p = this.players[pId]; const item = SHOP_ITEMS.find(i => i.id === key); if (!item || p.items[key] <= 0) return; if (item.type === 'heal') { if (item.id === 'ultrafullrestore') { this.applyBoardItemEffect(p, item, -1); return; } this.openHealSelector(pId, key); } else if (item.type === 'revive') { if (item.id === 'ultramaxrevive') { this.applyBoardItemEffect(p, item, -1); return; } this.openHealSelector(pId, key); } }
    static openHealSelector(pId: number, itemKey: string) { this.pendingHealItem = itemKey; const p = this.players[pId]; const modal = document.getElementById('pkmn-select-modal')!; const list = document.getElementById('pkmn-select-list')!; const title = document.getElementById('select-title')!; title.innerText = "Usar em qual Pokémon?"; list.innerHTML = ''; p.team.forEach((mon, idx) => { const div = document.createElement('div'); div.className = `mon-select-item`; div.innerHTML = `<img src="${mon.getSprite()}" width="40"><b>${mon.name}</b> <small>(${mon.currentHp}/${mon.maxHp})</small>`; div.onclick = () => { modal.style.display = 'none'; this.applyBoardItemEffect(p, SHOP_ITEMS.find(i=>i.id === itemKey)!, idx); }; list.appendChild(div); }); const cancelBtn = document.createElement('button'); cancelBtn.className = "btn btn-secondary mt-15"; cancelBtn.innerText = "Cancelar"; cancelBtn.onclick = () => { modal.style.display = 'none'; this.pendingHealItem = null; }; list.appendChild(cancelBtn); modal.style.display = 'flex'; }
    static applyBoardItemEffect(p: Player, item: ItemData, targetIdx: number) { let used = false; if (item.type === 'heal') { if (item.id === 'ultrafullrestore') { let count = 0; p.team.forEach(m => { if(!m.isFainted() && m.currentHp < m.maxHp) { m.heal(9999); count++; } }); if(count > 0) { used = true; alert(`${count} Pokémon curados!`); } else alert("Ninguém precisa de cura!"); } else { const target = p.team[targetIdx]; if(target.isFainted()) return alert("Não funciona em Pokémon desmaiado!"); if(target.currentHp >= target.maxHp) return alert("HP já está cheio!"); target.heal(item.val || 20); alert(`Usou ${item.name} em ${target.name}.`); used = true; } } else if (item.type === 'revive') { if (item.id === 'ultramaxrevive') { let count = 0; p.team.forEach(m => { if(m.isFainted()) { m.revive(100); count++; } }); if(count > 0) { used = true; alert(`${count} Pokémon revividos!`); } else alert("Ninguém está desmaiado!"); } else { const target = p.team[targetIdx]; if(!target.isFainted()) return alert("Este Pokémon não está desmaiado!"); target.revive(item.val || 50); alert(`Usou ${item.name} em ${target.name}.`); used = true; } } if (used) { p.items[item.id]--; this.updateHUD(); this.openInventoryModal(p.id); this.saveGame(); if (Network.isOnline) { Network.sendAction('LOG', { msg: `${p.name} usou ${item.name}.` }); Network.syncPlayerState(); } } }
    
    static openSwapModal(newMon: Pokemon) { 
        const modal = document.getElementById('swap-modal')!; 
        const list = document.getElementById('swap-list')!; 
        list.innerHTML = ''; 
        const p = this.getCurrentPlayer(); 
        
        // 1. Renderiza os Pokémons atuais do time
        p.team.forEach((currP: Pokemon, idx: number) => { 
            const div = document.createElement('div'); 
            div.className = 'swap-item'; 
            
            div.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px; width: 100%; padding: 5px;">
                    <img src="${currP.getSprite()}" width="50" style="filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.2));">
                    <div style="text-align: left; line-height: 1.4; flex-grow: 1;">
                        <b style="font-size: 1.1rem; color: #2c3e50;">${currP.name}</b> 
                        <small style="color: #e67e22; font-weight: bold;">Lv.${currP.level}</small><br>
                        
                        <div style="font-size: 0.85rem; color: #7f8c8d; margin-top: 4px; display: flex; gap: 10px;">
                            <span>❤️ <b>${currP.maxHp}</b></span>
                            <span>⚔️ <b>${currP.atk}</b></span>
                            <span>🛡️ <b>${currP.def}</b></span>
                            <span>💨 <b>${currP.speed}</b></span>
                        </div>
                    </div>
                </div>
            `; 
            
            div.onclick = () => this.executeSwap(idx, newMon); 
            list.appendChild(div); 
        }); 
        
        // 2. Renderiza o NOVO Pokémon para o jogador poder descartar ele mesmo
        const divNew = document.createElement('div'); 
        divNew.className = 'swap-item new-mon'; 
        
        // Coloquei um fundo levemente diferente e uma borda tracejada para destacar a opção de descartar a novidade
        divNew.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px; width: 100%; padding: 5px; background-color: #fcf3f2; border: 1px dashed #e74c3c; border-radius: 8px; margin-top: 10px;">
                <img src="${newMon.getSprite()}" width="50" style="filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.2));">
                <div style="text-align: left; line-height: 1.4; flex-grow: 1;">
                    <b style="font-size: 1.1rem; color: #e74c3c;">${newMon.name} (NOVO)</b> 
                    <small style="color: #e67e22; font-weight: bold;">Lv.${newMon.level}</small><br>
                    
                    <div style="font-size: 0.85rem; color: #7f8c8d; margin-top: 4px; display: flex; gap: 10px;">
                        <span>❤️ <b>${newMon.maxHp}</b></span>
                        <span>⚔️ <b>${newMon.atk}</b></span>
                        <span>🛡️ <b>${newMon.def}</b></span>
                        <span>💨 <b>${newMon.speed}</b></span>
                    </div>
                    <small style="color: #c0392b; font-weight: bold; display: block; margin-top: 5px;">❌ Clique aqui para soltar e não capturar este</small>
                </div>
            </div>
        `; 
        
        divNew.onclick = () => this.executeSwap(-1, newMon); 
        list.appendChild(divNew); 
        
        modal.style.display = 'block'; 
    }
    
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

    static updateHUD() { 
        const left = document.getElementById('hud-col-left')!; 
        left.innerHTML = ''; 
        const right = document.getElementById('hud-col-right')!; 
        right.innerHTML = ''; 
        
        if (!this.players || this.players.length === 0) return; 

        // --- CORREÇÃO DE INICIALIZAÇÃO ---
        // Garante que nenhum Mega bugado exista no time de nenhum jogador ao atualizar a tela
        this.players.forEach(p => {
            if (p.team) {
                p.team.forEach(mon => { 
                    if(mon.validateAndFix) mon.validateAndFix(); 
                });
            }
        });
        // ---------------------------------

        // O 'i' aqui é o índice do jogador no array (0, 1, 2...)
        this.players.forEach((p,i) => { 
            const d = document.createElement('div'); 
            d.className = `player-slot ${i===this.turn?'active':''}`; 
            
            let badgeHTML = '<div class="badges-container">'; 
            for(let b=0; b<8; b++) { 
                const isActive = p.badges[b]; 
                const gData = GYM_DATA.find(g => g.id === b+1); 
                const imgUrl = gData ? `/assets/img/Insignias/${gData.badgeImg}` : ''; 
                const style = isActive ? `background-image: url('${imgUrl}'); background-size: 100% 100%; background-repeat: no-repeat; background-color: transparent;` : `background-color: #ccc;`; 
                badgeHTML += `<div class="badge-slot ${isActive?'active':''}" style="${style}" title="Insígnia ${b+1}"></div>`; 
            } 
            badgeHTML += '</div>'; 
    
            const th = p.team.map((m, slotIndex) => { 
                let auraClass = '';
                let rarityStyle = ''; 

                const total = m.baseTotal || (m.maxHp + m.atk + m.def + m.speed);

                if (m.isLegendary) {
                    auraClass = 'aura-legendary'; 
                    rarityStyle = 'border: 2px solid #A33EA1; box-shadow: 0 0 5px #A33EA1;'; 
                } 
                else {
                    if (total >= 330) { rarityStyle = 'border: 2px solid #e74c3c; box-shadow: 0 0 5px #e74c3c;'; }
                    else if (total >= 280) { rarityStyle = 'border: 2px solid #3498db; box-shadow: 0 0 5px #3498db;'; }
                    else if (total >= 220) { rarityStyle = 'border: 2px solid #2ecc71; box-shadow: 0 0 5px #2ecc71;'; }
                }
                
                if (m.isShiny) {
                    auraClass = 'aura-shiny'; 
                }

                const megaIcon = m.megaStone ? `<img src="/assets/img/megaStone.png" style="width:16px; height:16px; margin-left:4px;" title="Mega Stone Equipada">` : '';

                // ==================================================================================
                // CORREÇÃO: Passamos 'i' (Dono) e 'slotIndex' (Posição no time)
                // ==================================================================================
                return ` 
                <div class="poke-card ${m.isFainted() ? 'fainted' : ''}" style="${rarityStyle}; cursor: pointer;" onclick="window.Game.openPokemonDetail(${i}, ${slotIndex})"> 
                    <img src="${m.getSprite()}" class="poke-card-img ${auraClass}"> 
                    <div class="poke-card-info"> 
                        <div class="poke-header"> 
                            <span>${m.name}</span> 
                            ${megaIcon}
                            <span class="poke-lvl">Lv.${m.level}</span> 
                        </div> 
                        
                        ${m.getTypeBadgesHTML ? m.getTypeBadgesHTML() : ''}

                        <div class="bar-container" title="HP"> 
                            <div class="bar-fill ${(window as any).Battle.getHpColor(m.currentHp, m.maxHp)}" style="width:${(m.currentHp/m.maxHp)*100}%"></div> 
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
                </div> </div>`; 
                // ==================================================================================

            }).join('');
            
            // ... (O resto do código de Itens, Cartas e Efeitos continua idêntico) ...
            const totalItems = Object.values(p.items).reduce((sum, val) => sum + val, 0);
            const totalCards = p.cards.length;

            let effectsHTML = `<div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:2px; min-height:18px;">`;
            if (p.skipTurns > 0) effectsHTML += `<span style="background:#c0392b; color:white; font-size:0.65rem; padding:1px 4px; border-radius:4px;" title="Paralisado">🚫 ${p.skipTurns}</span>`;
            if (p.effects.slow && p.effects.slow > 0) effectsHTML += `<span style="background:#7f8c8d; color:white; font-size:0.65rem; padding:1px 4px; border-radius:4px;" title="Lentidão">🕸️ ${p.effects.slow}</span>`;
            if (p.effects.curse) effectsHTML += `<span style="background:#2c3e50; color:#e74c3c; font-size:0.65rem; padding:1px 4px; border-radius:4px; border:1px solid #e74c3c;" title="Amaldiçoado">😈 CURSE</span>`;
            if (p.effects.lureShiny && p.effects.lureShiny > 0) effectsHTML += `<span style="background:#f1c40f; color:#2c3e50; font-size:0.65rem; padding:1px 4px; border-radius:4px; font-weight:bold;" title="Shiny Lure">✨ ${p.effects.lureShiny}</span>`;
            if (p.effects.extraTurn) effectsHTML += `<span style="background:#2980b9; color:white; font-size:0.65rem; padding:1px 4px; border-radius:4px;" title="Tempo Parado">⏳ EXTRA</span>`;
            if (p.effects.doubleXp && p.effects.doubleXp > 0) effectsHTML += `<span style="background:#8e44ad; color:white; font-size:0.65rem; padding:1px 4px; border-radius:4px;" title="Double XP">🚻 ${p.effects.doubleXp}</span>`;
            if (p.effects.expShare && p.effects.expShare > 0) effectsHTML += `<span style="background:#27ae60; color:white; font-size:0.65rem; padding:1px 4px; border-radius:4px;" title="Exp Share">🤝 ${p.effects.expShare}</span>`;
            effectsHTML += `</div>`;

            d.innerHTML = ` 
            <div class="hud-header" style="flex-direction:column; align-items:flex-start; gap:0;">
                <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                    <div class="hud-name-group"><img src="${p.avatar}" class="hud-avatar-img"><span>${p.name}</span></div>
                    <div style="font-weight:bold; color:#f1c40f; text-shadow:1px 1px 0 #000;">💰${p.gold}</div>
                </div>
                ${effectsHTML}
            </div> 
            ${badgeHTML} 
            <div class="hud-team">${th}</div> 
            <div class="hud-actions">
                <button class="btn btn-secondary btn-mini" onclick="window.openInventory(${i})">🎒 ${totalItems}</button>
                <button class="btn btn-secondary btn-mini" onclick="window.openCards(${i})">🃏 ${totalCards}</button>
                <button class="btn btn-mini" style="background:#e74c3c; color:white; border:1px solid #c0392b;" onclick="window.Game.openPokedex(${i})">📖 Dex</button>
            </div>`;
            if(i < Math.ceil(this.players.length/2)) left.appendChild(d); 
            else right.appendChild(d); 
        }); 

        // Atualização dos indicadores globais
        const turnPlayer = this.players[this.turn]; 
        if (turnPlayer) document.getElementById('turn-indicator')!.innerText = turnPlayer.name; 
        const elRound = document.getElementById('round-indicator'); if (elRound) elRound.innerText = this.round.toString();
        const elRoom = document.getElementById('room-code-indicator');
        if (elRoom) { const Network = (window as any).Network; elRoom.innerText = Network.isOnline ? Network.currentRoomId : "LOCAL"; }
        const avgLvl = this.getGlobalAverageLevel();
        const elAvg = document.getElementById('avg-lvl-indicator'); if (elAvg) elAvg.innerText = `Lv.${avgLvl}`;
        const elGym = document.getElementById('gym-lvl-indicator'); if (elGym) elGym.innerText = `Lv.${avgLvl + 1}`;
        let totalMons = 0; this.players.forEach(p => totalMons += p.team.length);
        const avgTeam = Math.max(1, Math.min(6, Math.round(totalMons / Math.max(1, this.players.length))));
        const elTeam = document.getElementById('npc-team-indicator'); if (elTeam) elTeam.innerText = avgTeam.toString();
    }
    
    static renderBoard() { 
        const area = document.getElementById('board-area')!; 
        area.innerHTML = ''; 
        area.style.gridTemplateColumns = `repeat(${MapSystem.size}, 1fr)`; 
        area.style.gridTemplateRows = `repeat(${MapSystem.size}, 1fr)`; 
        
        for(let y=0; y<MapSystem.size; y++) { 
            for(let x=0; x<MapSystem.size; x++) { 
                const d = document.createElement('div'); 
                let c = 'path'; 
                let tooltip = ""; // Variável para a nossa dica de tela
                const t = MapSystem.grid[y][x]; 
                
                // --- NOVA LÓGICA DE TOOLTIPS ---
                if(t===TILE.GRASS) {
                    c='grass';
                    tooltip = "Terreno: Grama\nTipos: Grama, Inseto, Normal, Veneno, Voador, Noturno";
                }
                else if(t===TILE.WATER) {
                    c='water';
                    tooltip = "Terreno: Água\nTipos: Água, Gelo, Dragão, Fada";
                }
                else if(t===TILE.GROUND) {
                    c='ground';
                    tooltip = "Terreno: Terra/Pedra\nTipos: Terra, Pedra, Fogo, Lutador, Elétrico, Psíquico, Fantasma, Aço";
                }
                // -------------------------------
                else if(t===TILE.CITY) c='city'; 
                else if(t===TILE.GYM) c='gym'; 
                else if(t===TILE.EVENT) c='event'; 

                // --- NOVA LÓGICA DINÂMICA PARA TODOS OS NPCs DO MAPA ---
                else if(NPC_DATA[t]) {
                    c = 'npc-tile'; // Classe genérica (para não precisar criar uma pra cada no CSS)
                    tooltip = `Treinador: ${NPC_DATA[t].name}\nRecompensa: ${NPC_DATA[t].gold}G`;

                    // Renderiza o rostinho do NPC direto no bloco do tabuleiro!
                    if (NPC_DATA[t].img) {
                        d.style.backgroundImage = `url('/assets/img/NPCs/${NPC_DATA[t].img}')`;
                        d.style.backgroundSize = '100% 100%';
                        d.style.backgroundRepeat = 'no-repeat';
                    }
                }
                // --------------------------------------------------------
                
                d.className = `tile ${c}`; 
                d.id = `tile-${x}-${y}`; 
                if(MapSystem.size>=30) d.style.fontSize='8px'; 
                
                // Aplica o tooltip genérico do terreno (se existir)
                if (tooltip) d.title = tooltip;
                
                if(t===TILE.GYM) { 
                    const gid = MapSystem.gymLocations[`${x},${y}`]; 
                    if(gid) { 
                        const gData = GYM_DATA.find(g => g.id === gid); 
                        if(gData) { 
                            d.style.backgroundImage = `url('/assets/img/Ginasios/${gData.gymImg}')`; 
                            d.style.backgroundSize = '100% 100%'; 
                            d.style.backgroundRepeat = 'no-repeat'; 
                            d.title = `Ginásio ${gData.type} - Líder ${gData.leaderName}`; // Sobrescreve com o do Ginásio
                        } 
                        d.innerText = ""; 
                    } 
                } 
                area.appendChild(d); 
            } 
        } 
    }

    static getCurrentPlayer() { return this.players[this.turn]; }

    static log(m: string) { 
        let customStyle = "";
        
        if (m.includes("Fim do turno de")) {
            customStyle = "text-align: center; color: #f39c12; font-weight: bold; margin: 15px 0 5px 0; border-bottom: 2px dashed #7f8c8d; padding-bottom: 5px;";
        }
        
        const container = document.getElementById('log-container');
        if (container) {
            // 'afterbegin' coloca a nova mensagem no topo
            container.insertAdjacentHTML('afterbegin', `<div class="log-entry" style="${customStyle}">${m}</div>`); 
            
            // Força a barra de rolagem a ficar colada no topo
            container.scrollTop = 0;
        }
    }
    
    // --- LÓGICA DO RE-ROLL ---
    static showDiceChoice(r1: number, r2: number) {
        let modal = document.getElementById('dice-choice-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'dice-choice-modal';
            modal.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); display:flex; justify-content:center; align-items:center; z-index:9999;";
            document.body.appendChild(modal);
        }
        modal.innerHTML = `
            <div style="background:#2b2d42; border:3px solid #8d99ae; border-radius:12px; padding:25px; color:white; text-align:center; box-shadow:0 10px 25px rgba(0,0,0,0.8);">
                <h3 style="margin-top:0; color:#edf2f4; border-bottom:1px solid #8d99ae; padding-bottom:10px;">Re-Roll: O Destino em suas Mãos</h3>
                <p>Escolha qual dos dois resultados você deseja usar:</p>
                <div style="display:flex; gap:20px; justify-content:center; margin-top:20px;">
                    <button class="btn" style="font-size:1.5rem; padding:15px 30px; background:#2ecc71;" onclick="window.Game.chooseDice(${r1})">🎲 ${r1}</button>
                    <button class="btn" style="font-size:1.5rem; padding:15px 30px; background:#3498db;" onclick="window.Game.chooseDice(${r2})">🎲 ${r2}</button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    }

    static chooseDice(val: number) {
        document.getElementById('dice-choice-modal')!.style.display = 'none';
        
        // Avisa a todos da escolha e força o dado
        const Network = (window as any).Network;
        const msg = `🎲 ${this.getCurrentPlayer().name} decidiu usar o resultado: ${val}!`;
        this.log(msg);
        if(Network.isOnline) {
             Network.sendAction('LOG', { msg: msg });
        }
        
        this.forceDice(val);
    }
    // -------------------------
    // =======================================================================
    // SISTEMA DE ALERTA GLOBAL SINCRONIZADO
    // =======================================================================
    // Atualizado para receber o parâmetro "endsTurn" (por padrão é true)
    static showGlobalAlert(msg: string, playerName: string, isMyTurn: boolean, endsTurn: boolean = true) {
        this.alertEndsTurn = endsTurn; // Salva se deve pular a vez
        
        let modal = document.getElementById('custom-global-alert');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'custom-global-alert';
            modal.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); display:flex; justify-content:center; align-items:center; z-index:9999;";
            modal.innerHTML = `
                <div style="background:#2b2d42; border:3px solid #8d99ae; border-radius:12px; padding:25px; color:white; text-align:center; min-width:300px; max-width:500px; box-shadow:0 10px 25px rgba(0,0,0,0.8);">
                    <h3 style="margin-top:0; color:#edf2f4; font-size:1.5rem; border-bottom:1px solid #8d99ae; padding-bottom:10px;">Aviso do Tabuleiro</h3>
                    <p id="cga-msg" style="margin:25px 0; font-size:1.2rem; color:#edf2f4;"></p>
                    <div id="cga-controls"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        document.getElementById('cga-msg')!.innerText = msg;
        const controls = document.getElementById('cga-controls')!;

        if (isMyTurn) {
            controls.innerHTML = `<button class="btn" style="background-color:#ef233c; padding:10px 30px; font-size:1.1rem; margin:0;" onclick="window.Game.confirmGlobalAlert()">OK</button>`;
        } else {
            controls.innerHTML = `<span style="color:#8d99ae; font-style:italic; font-size:1rem;">⏳ Aguardando ${playerName} confirmar...</span>`;
        }

        modal.style.display = 'flex';
    }

    static confirmGlobalAlert() {
        const Network = (window as any).Network;
        this.closeGlobalAlert();
        
        if (Network.isOnline) {
            Network.sendAction('CLOSE_ALERT', {});
        }
        
        // --- NOVA LÓGICA DE EVENTO PENDENTE (Para a Troca Rápida) ---
        if (this.pendingTileEvent) {
            this.pendingTileEvent = false;
            // Aciona o evento da casa em que o jogador parou!
            this.handleTile(this.getCurrentPlayer());
            return; // Sai para não pular a vez ainda
        }
        // ------------------------------------------------------------
        
        if (this.alertEndsTurn) {
            this.nextTurn();
        }
    }

    static closeGlobalAlert() {
        const modal = document.getElementById('custom-global-alert');
        if (modal) modal.style.display = 'none';
    }
}