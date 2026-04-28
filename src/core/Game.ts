import { TILE, NPC_DATA, SHOP_ITEMS, CARDS_DB, CARD_RARITIES } from '../constants';
import { POKEDEX } from '../constants/pokedex';
import { TYPE_CHART } from '../constants/typeChart';
import { PLAYER_COLORS } from '../constants/playerColors';
import { GYM_DATA } from '../constants/gyms';
import { ref, update, get } from 'firebase/database';
import { db, Network } from '../systems/Network';
import { Player } from '../models/Player';
import { Pokemon } from '../models/Pokemon';
import { MapSystem } from '../systems/MapSystem';
import { Battle } from '../systems/Battle';
import { Shop } from '../systems/Shop';
import { Cards } from '../systems/Cards';
import type { ItemData } from '../constants';
import { RARIDADE_DATA } from '../constants/Raridades';
import { GLOBAL_EVENTS } from '../constants/globalEvents';

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
    static traps: { x: number, y: number, ownerId: number }[] = [];
    static pendingHealItem: string | null = null;
    static gymTeams: { [id: number]: number[] } = {};
    static pendingCardAnimation: { id: string, player: string } | null = null;
    static pendingLegendaryEncounter: { mon: Pokemon, type: number } | null = null;
    static pendingLegendaryAlert: { monName: string, player: string, isMyEncounter: boolean } | null = null;

    // --- VARIÁVEIS DOS EVENTOS GLOBAIS ---
    static currentGlobalEvent: any = null;
    static eventEndRound: number = 0;
    static lastBonusRoundClaimed: number = 0; // Armazena o bônus localmente de forma segura

    static activeGyms: number[] = [];
    static globalLogs: { text: string, style: string, type?: string }[] = [];

    static init(players: Player[], mapSize: number) {
        // --- NOVO: GARANTE O SORTEIO NO MODO OFFLINE ---
        if (!this.activeGyms || this.activeGyms.length === 0) {
            const allGyms = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
            this.activeGyms = allGyms.sort(() => Math.random() - 0.5).slice(0, 8);
        }
        // -----------------------------------------------

        this.players = players;

        if (MapSystem.grid.length === 0) {
            MapSystem.generate(mapSize);
        }

        if (Object.keys(this.gymTeams).length === 0) {
            this.generateGymTeams();
        }

        const NetworkObj = (window as any).Network || Network;
        if (NetworkObj.isOnline && NetworkObj.isHost) {
            if (db) update(ref(db, `rooms/${NetworkObj.currentRoomId}`), {
                grid: MapSystem.grid,
                gymLocations: MapSystem.gymLocations,
                gymTeams: this.gymTeams
            });
        }

        // --- RECUPERA O EVENTO GLOBAL CASO ALGUÉM DÊ F5 ---
        if (NetworkObj.isOnline && db) {
            get(ref(db, `rooms/${NetworkObj.currentRoomId}`)).then(snap => {
                const data = snap.val();
                if (data) {
                    // --- SINCRONIZA A RODADA CORRETA DO FIREBASE ---
                    if (data.round && data.round > this.round) {
                        this.round = data.round;
                    }
                }
                if (data.currentEventId) {
                    // --- BLINDAGEM: Se o evento salvo já expirou na rodada atual, ignora! ---
                    if (this.round >= data.eventEndRound) {
                        this.currentGlobalEvent = null;
                        this.eventEndRound = 0;

                        // Força a limpeza no banco para consertar o que ficou preso para todos
                        update(ref(db, `rooms/${NetworkObj.currentRoomId}`), { currentEventId: null, eventEndRound: 0 });
                    } else {
                        // Se estiver válido, carrega normal
                        this.currentGlobalEvent = GLOBAL_EVENTS.find((e: any) => e.id === data.currentEventId) || null;
                        this.eventEndRound = data.eventEndRound || 0;
                    }
                    // -----------------------------------------------
                    this.updateHUD(); // Força a caixinha aparecer de novo
                }
            });
        }
        // --------------------------------------------------

        this.renderBoard();
        this.updateHUD();
        this.moveVisuals();
        this.checkTurnControl();
        //this.renderDebugPanel(); 
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

            for (let i = 0; i < 6; i++) {
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

    static addItem(player: Player, itemId: string, amount: number = 1) { if (!player.items[itemId]) { player.items[itemId] = 0; } player.items[itemId] += amount; this.updateHUD(); if (Network.isOnline) Network.syncPlayerState(); }
    static sendGlobalLog(msg: string) { this.log(msg); if (Network.isOnline) { Network.sendAction('LOG', { msg: msg }); } }
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
        for (let i = 0; i < 8; i++) {
            const actualGymId = this.activeGyms ? this.activeGyms[i] : (i + 1);
            const gym = GYM_DATA.find(g => g.id === actualGymId);
            if (gym) {
                const img = document.createElement('img');
                img.src = `/assets/img/Insignias/${gym.badgeImg}`;
                img.className = 'win-badge-img';
                img.title = `Insígnia ${gym.type}`;
                badgeContainer.appendChild(img);
            }
        }

        // 4. Mostrar Tela
        document.getElementById('victory-modal')!.style.display = 'flex';

        // Efeito Sonoro ou Confete (Opcional, log por enquanto)
        console.log("GAME OVER - VITORIA!");
    }
    //static generateWildPokemon(): Pokemon { const stage1Mons = POKEDEX.filter(p => p.stage === 1); const legendaries = stage1Mons.filter(p => p.isLegendary); const regulars = stage1Mons.filter(p => !p.isLegendary); let chosenTemplate; if (Math.random() < 0.02 && legendaries.length > 0) { chosenTemplate = legendaries[Math.floor(Math.random() * legendaries.length)]; } else { chosenTemplate = regulars[Math.floor(Math.random() * regulars.length)]; } let level = this.getGlobalAverageLevel(); if (level < 1) level = 1; return new Pokemon(chosenTemplate.id, level, null); }

    static generateWildPokemon(tileType: number): Pokemon {
        // --- MODO DE TESTE: FORÇAR MOLTRES (ID 146) ---
        //return new Pokemon(493, this.getGlobalAverageLevel(), null);
        // ----------------------------------------------

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

        // --- EVENTO: FEBRE LENDÁRIA (Ignora a trava de nível baixo) ---
        if (this.currentGlobalEvent?.id === 'LEGENDARY_FEVER') {
            allowLegendaries = true;
        }
        // --------------------------------------------------------------

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

        // --- NOVO: EFEITO LURE TYPE ---
        const playerL = this.getCurrentPlayer();
        const lure = playerL.effects?.lureType;
        if (lure && (lure.count || 0) > 0) {
            const luredCandidates = validCandidates.filter(p => p.type === lure.type || p.secondType === lure.type);
            if (luredCandidates.length > 0) {
                const chosen = luredCandidates[Math.floor(Math.random() * luredCandidates.length)];
                lure.count!--;
                if (lure.count === 0) delete playerL.effects.lureType;
                if (Network.isOnline) Network.syncPlayerState();
                return new Pokemon(chosen.id, globalAvg, null);
            }
        }

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

        // --- EVENTO: FEBRE LENDÁRIA (Força o resultado do dado) ---
        // Se o evento estiver ativo, existe 30% de chance do jogo jogar 
        // a roleta normal no lixo e invocar um Lendário diretamente!
        if (this.currentGlobalEvent?.id === 'LEGENDARY_FEVER' && Math.random() <= 0.30) {
            selectedRarityId = 'Lendário';
        }
        // ----------------------------------------------------------

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

        const wildMon = new Pokemon(chosenTemplate.id, globalAvg, null);

        // EVENTO: FEBRE SHINY (Aumenta absurdamente a chance do monstro nascer brilhante)
        if (this.currentGlobalEvent?.id === 'SHINY_FEVER' && Math.random() <= 0.30) {
            wildMon.isShiny = true;
            wildMon.recalculateStats(true);
        }

        return wildMon;
    }

    static async openPokemonDetail(playerIndex: number, slotIndex: number, championData?: any) {
        // 1. Identifica o Dono do Pokémon (Pode ser eu, outro jogador, ou o campeão)
        let targetPlayer: any;
        let mon: any;

        if (championData) {
            targetPlayer = championData;
            const rawMon = championData.team[slotIndex];
            const PkmClass = (window as any).Pokemon || Pokemon;
            mon = new PkmClass(rawMon.id, rawMon.level, rawMon.isShiny);
            Object.assign(mon, rawMon);
        } else {
            targetPlayer = this.players[playerIndex];
            if (!targetPlayer) return console.error("Jogador não encontrado para o índice:", playerIndex);
            mon = targetPlayer.team[slotIndex];
        }

        if (!mon) return console.error("Pokémon não encontrado no slot:", slotIndex);

        // Garante acesso à POKEDEX global (importada ou window)
        const POKEDEX_GLOBAL = (window as any).POKEDEX || POKEDEX;
        const { MAPA_MEGAS } = await import('../constants/mapaMegas');

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
                resoText = `${perc}% (+${caught - 1} cópias)`;
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

        // =========================================================================
        // NOVO: LINHA EVOLUTIVA E MEGAS NO DETAIL MODAL
        // =========================================================================
        let evoContainer = document.getElementById('detail-evolution-chain');
        if (!evoContainer) {
            evoContainer = document.createElement('div');
            evoContainer.id = 'detail-evolution-chain';
            evoContainer.style.cssText = "margin-top: 15px;";

            // Adiciona o novo painel no final do modal (abaixo do bloco de maestria)
            const masteryBlock = document.getElementById('detail-mastery')!.parentElement;
            if (masteryBlock && masteryBlock.parentElement) {
                masteryBlock.parentElement.appendChild(evoContainer);
            }
        }

        const chain: { id: number, name: string, trigger: string, isMega: boolean }[] = [];
        let currentDex = POKEDEX_GLOBAL.find((p: any) => p.id === mon.id);

        if (currentDex) {
            // Adiciona a forma em que o Pokémon está no momento
            chain.push({ id: currentDex.id, name: currentDex.name, trigger: 'Forma Atual', isMega: !!(mon as any).isMegaEvolution });

            let nextName = currentDex.nextForm;
            let triggerLevel = currentDex.evoTrigger;

            // Busca todas as próximas evoluções normais pra frente
            while (nextName) {
                let nextDex = POKEDEX_GLOBAL.find((p: any) => p.name === nextName);
                if (!nextDex) break;

                chain.push({ id: nextDex.id, name: nextDex.name, trigger: `Lv.${triggerLevel}`, isMega: false });

                triggerLevel = nextDex.evoTrigger;
                nextName = nextDex.nextForm;
            }

            // Verifica se a ÚLTIMA forma da cadeia montada possui Mega Evolução!
            const finalEvo = chain[chain.length - 1];
            const megaId = MAPA_MEGAS[finalEvo.id];

            if (megaId && !finalEvo.isMega) { // Evita duplicar se quem o jogador clicou já for o mega
                const megaDex = POKEDEX_GLOBAL.find((p: any) => p.id === megaId);
                if (megaDex) {
                    chain.push({ id: megaDex.id, name: "Mega " + finalEvo.name, trigger: '💎 Mega Pedra', isMega: true });
                }
            }
        }

        // Monta o HTML visual da Cadeia Evolutiva
        if (chain.length > 1) {
            let chainHTML = `
                <div style="font-weight: bold; color: #8e44ad; font-size: 0.9rem; margin-bottom: 8px; display: flex; align-items: center; gap: 5px;">
                    🧬 Caminho Evolutivo Previsto
                </div>
                <div style="display: flex; justify-content: center; align-items: center; background: #f8f9fa; padding: 10px; border-radius: 8px; border: 1px solid #eee; overflow-x: auto; gap: 5px;">
            `;

            chain.forEach((stage, idx) => {
                const isCurrent = stage.id === mon.id;
                const filterStyle = stage.isMega ? 'filter: drop-shadow(0 0 5px #f1c40f);' : '';
                const highlightBorder = isCurrent ? 'border: 2px solid #2ecc71; background: #e8f8f5;' : 'border: 2px solid transparent;';

                chainHTML += `
                    <div style="display: flex; flex-direction: column; align-items: center; padding: 5px; border-radius: 8px; ${highlightBorder} min-width: 60px;">
                        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${stage.id}.png" style="width: 50px; height: 50px; image-rendering: pixelated; ${filterStyle}">
                        <span style="font-size: 0.65rem; font-weight: bold; color: #2c3e50; text-align: center; line-height: 1;">${stage.name}</span>
                        <span style="font-size: 0.55rem; color: ${stage.isMega ? '#f39c12' : '#7f8c8d'}; font-weight: bold; background: ${stage.isMega ? '#fef9e7' : '#e0e6ed'}; padding: 2px 4px; border-radius: 4px; margin-top: 4px; white-space: nowrap;">${stage.trigger}</span>
                    </div>
                `;

                if (idx < chain.length - 1) {
                    chainHTML += `<div style="color: #bdc3c7; font-size: 1.2rem; font-weight: bold;">➔</div>`;
                }
            });

            chainHTML += `</div>`;
            evoContainer.innerHTML = chainHTML;
            evoContainer.style.display = 'block';
        } else {
            // Se o Pokémon não tem evolução e nem Mega, exibe uma mensagem neutra
            evoContainer.innerHTML = `
                <div style="font-weight: bold; color: #8e44ad; font-size: 0.9rem; margin-bottom: 8px; display: flex; align-items: center; gap: 5px;">
                    🧬 Caminho Evolutivo Previsto
                </div>
                <div style="text-align: center; background: #f8f9fa; padding: 10px; border-radius: 8px; border: 1px solid #eee; font-size: 0.8rem; color: #7f8c8d;">
                    Estágio Final alcançado.
                </div>
            `;
            evoContainer.style.display = 'block';
        }
        // ==================================================

        // --- AJUSTE DE TELA: Habilita barra de rolagem se o conteúdo ficar gigante ---
        // Pega a div interna do modal (normalmente usa a classe .modal-content)
        const modalContent = document.querySelector('#detail-modal .modal-content') as HTMLElement || document.querySelector('#detail-modal > div') as HTMLElement;
        if (modalContent) {
            modalContent.style.maxHeight = "90vh";
            modalContent.style.overflowY = "auto";
        }
        // ------------------------------------------------

        document.getElementById('detail-modal')!.style.display = 'flex';
    }

    // --- NOVA FUNÇÃO DE CHECKPOINT ---
    static getLastCityCoord(p: Player): { x: number, y: number } {
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
        return { x: 0, y: 0 };
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
        if (Network.isOnline && p.id === Network.myPlayerId) {
            Network.syncPlayerState();
        }
    }

    //static renderDebugPanel() { const container = document.querySelector('.extra-space'); if(container) { container.innerHTML = ` <button class="btn btn-secondary" onclick="window.Game.openCardLibrary()">📖 Ver Todas as Cartas</button> <button class="btn btn-secondary" style="background: #27ae60;" onclick="window.Game.openXpRules()">📘 Regras de XP</button> <button class="btn btn-secondary" style="background: #e67e22;" onclick="window.Game.openCaptureRules()">🦅 Regras de Captura</button> <div style="margin-top:10px; font-size:0.7rem; color:#aaa;">DEBUG MOVE</div> <div style="display:flex; gap:5px; justify-content:center;"> <input type="number" id="debug-input" value="1" min="1" max="50" style="width:50px; text-align:center; border:none; padding:5px; border-radius:4px;"> <button class="btn" style="width:auto; margin:0; padding:5px 10px;" onclick="window.Game.debugMove()">GO</button> </div> <button class="btn" style="margin-top:5px; background: #e67e22;" onclick="window.Game.exportSave()">💾 DEBUG SAVE</button> <div style="margin-top:5px;"><small id="online-indicator" style="color:cyan;">OFFLINE</small></div> `; } }

    static openCardLibrary() {
        const list = document.getElementById('library-list')!;
        list.innerHTML = '';

        // --- BIBLIOTECA EM TELA CHEIA ---
        const modalContent = document.querySelector('#library-modal .modal-content') as HTMLElement;
        if (modalContent) {
            modalContent.style.width = "98%";
            modalContent.style.maxWidth = "1400px";
            modalContent.style.maxHeight = "95vh";
            modalContent.style.padding = "30px";
            modalContent.style.overflowY = "auto";
        }

        list.style.display = 'grid';
        // Usamos auto-fill com um tamanho mínimo maior para as imagens crescerem
        list.style.gridTemplateColumns = 'repeat(auto-fill, minmax(180px, 1fr))';
        list.style.gap = '25px';
        list.style.padding = '20px';
        list.style.width = '100%';

        const rarityFilter = (document.getElementById('library-rarity-filter') as HTMLSelectElement)?.value || 'all';
        const typeFilter = (document.getElementById('library-type-filter') as HTMLSelectElement)?.value || 'all';

        let filtered = CARDS_DB.filter(c => {
            if (rarityFilter !== 'all' && c.rarity !== rarityFilter) return false;
            if (typeFilter !== 'all' && c.type !== typeFilter) return false;
            return true;
        });

        const typeOrder: Record<string, number> = { 'move': 1, 'battle': 2, 'auto': 3, 'global': 4 };
        const rarityOrder: Record<string, number> = { 'Épica': 1, 'Rara': 2, 'Incomum': 3, 'Comum': 4 };

        filtered.sort((a, b) => {
            if (typeOrder[a.type] !== typeOrder[b.type]) return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
            if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) return (rarityOrder[a.rarity] || 99) - (rarityOrder[b.rarity] || 99);
            return a.name.localeCompare(b.name);
        });

        filtered.forEach(c => {
            const rData = CARD_RARITIES[c.rarity];
            const borderColor = rData ? rData.color : '#8d99ae';

            const d = document.createElement('div');
            d.style.cssText = "display: flex; flex-direction: column; align-items: center; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); width: 100%; box-sizing: border-box; position: relative;";

            d.innerHTML = `
                <div style="position: absolute; top: -5px; right: -5px; background: ${borderColor}; color: #fff; padding: 2px 6px; font-size: 0.7rem; border-radius: 10px; font-weight: bold; border: 1px solid #222; text-shadow: 1px 1px 0 #000; box-shadow: 0 2px 4px rgba(0,0,0,0.5); z-index: 10;">
                    ${c.rarity.toUpperCase()}
                </div>
                <img src="/assets/img/Cartas/${c.id}.jpg" alt="${c.name}" title="${c.desc}" style="width: 100%; aspect-ratio: 2.5/3.5; object-fit: fill; border-radius: 6px; border: 3px solid ${borderColor};">
                <div style="margin-top: 8px; font-size: 0.8rem; text-align: center; color: #edf2f4;"><b>${c.name}</b></div>
                <div style="font-size: 0.7rem; color: #bdc3c7;">[${c.type.toUpperCase()}]</div>
            `;
            list.appendChild(d);
        });
        document.getElementById('library-modal')!.style.display = 'flex';
    }

    static openXpRules() { document.getElementById('xp-rules-modal')!.style.display = 'flex'; }
    static openCaptureRules() { const modal = document.getElementById('capture-rules-modal'); if (modal) modal.style.display = 'flex'; }
    static openCombatRules() { const modal = document.getElementById('combat-rules-modal'); if (modal) modal.style.display = 'flex'; }

    // --- NOVO: BÔNUS DA RODADA DEZ ---
    static triggerDecadeBonus(p: Player) {
        // --- BLINDAGEM MÁXIMA ABSOLUTA ---
        // Um computador nunca poderá gerar e enviar bônus na rede para outro jogador.
        if (Network && Network.isOnline && p.id !== Network.myPlayerId) {
            return;
        }
        // ---------------------------------

        const roll = Math.random();

        // 25% de chance de ir para Ginásio
        if (roll <= 0.25) {
            const undefeatedGyms: { x: number, y: number, id: number }[] = [];
            for (const key in MapSystem.gymLocations) {
                const id = MapSystem.gymLocations[key];
                if (!p.badges[id - 1]) {
                    const [gx, gy] = key.split(',').map(Number);
                    undefeatedGyms.push({ x: gx, y: gy, id: id });
                }
            }

            if (undefeatedGyms.length > 0) {
                const randomGym = undefeatedGyms[Math.floor(Math.random() * undefeatedGyms.length)];

                // Puxa o jogador
                p.x = randomGym.x;
                p.y = randomGym.y;
                this.moveVisuals();
                this.hasRolled = true; // Impede de rolar o dado

                const msgLocal = `🌀 VÓRTICE DA RODADA ${this.round}!\n\nVocê foi sugado diretamente para as portas de um Ginásio invicto!`;
                this.pendingTileEvent = true; // Ativará o Ginásio ao fechar o OK
                this.showGlobalAlert(msgLocal, p.name, true, false);

                //const Network = (window as any).Network;
                if (Network.isOnline) {
                    Network.syncPlayerState();
                    Network.sendAction('LOG', { msg: `🌀 VÓRTICE! ${p.name} foi sugado para um Ginásio na Rodada ${this.round}!` });
                }
                return;
            }
        }

        // Se já venceu os ginásios ou rolou os outros 75% -> Ganha 2 Cartas
        const c1 = Cards.draw(p, true);
        const c2 = Cards.draw(p, true);

        const msgLocal = `🎁 BÔNUS DA RODADA ${this.round}!\n\nVocê recebeu suporte aéreo e ganhou 2 cartas:\n- ${c1.name}\n- ${c2.name}`;
        this.updateHUD();
        this.showGlobalAlert(msgLocal, p.name, true, false); // false = não encerra a vez, ele joga normal depois!

        //const Network = (window as any).Network;
        if (Network.isOnline) {
            Network.syncPlayerState();
            Network.sendAction('LOG', { msg: `🎁 ${p.name} recebeu 2 Cartas bônus da Rodada ${this.round}!` });
        }
    }

    static openBoardCards(pId: number) {
        const Network = (window as any).Network;

        // Ajuste no contêiner do Modal (O quadrado que mostra as cartas)
        const modalContent = document.querySelector('#board-cards-modal .modal-content') as HTMLElement;
        if (modalContent) {
            modalContent.style.width = "95%";        // Quase toda a largura da tela
            modalContent.style.maxWidth = "1200px";  // Permite mais cartas por linha
            modalContent.style.maxHeight = "90vh";   // Aumenta a altura para ver a carta inteira
            modalContent.style.padding = "30px";     // Mais respiro nas bordas
            modalContent.style.overflowY = "auto";
        }

        // Validação de segurança
        if (Network.isOnline && pId !== Network.myPlayerId) return alert("Privado!");

        const p = this.players[pId];
        const list = document.getElementById('board-cards-list')!;
        list.innerHTML = '';

        // --- NOVA EXIBIÇÃO EM GRID PARA AS IMAGENS DAS CARTAS ---
        list.style.display = 'grid';
        // Usamos auto-fill com um tamanho mínimo maior para as imagens crescerem
        list.style.gridTemplateColumns = 'repeat(auto-fill, minmax(180px, 1fr))';
        list.style.gap = '25px';
        list.style.padding = '20px';
        list.style.width = '100%';
        // --------------------------------------------------------

        const isMe = !Network.isOnline || (p.id === Network.myPlayerId);

        // Botão de sacrifício
        if (isMe && p.cards.length >= 2) {
            const sacBtn = document.createElement('button');
            sacBtn.className = 'btn btn-sacrifice';
            sacBtn.style.gridColumn = '1 / -1'; // FORÇA A OCUPAR A TELA TODA NO GRID
            sacBtn.innerHTML = `<span>🔥 SACRIFICAR CARTAS (2 ➡ 1)</span>`;
            sacBtn.onclick = () => {
                document.getElementById('board-cards-modal')!.style.display = 'none';
                (window as any).Cards.openSacrificeModal();
            };
            list.appendChild(sacBtn);
        }

        if (p.cards.length === 0) {
            if (list.innerHTML === '') list.innerHTML = "<em style='grid-column: 1/-1;'>Sem cartas.</em>";
        }

        const isMyTurn = this.canAct() && this.turn === pId;
        const canUseMove = isMyTurn && !this.hasRolled;

        const rarityFilter = (document.getElementById('board-cards-rarity-filter') as HTMLSelectElement)?.value || 'all';

        let filteredCards = [...p.cards];
        if (rarityFilter !== 'all') {
            filteredCards = filteredCards.filter(c => c.rarity === rarityFilter);
        }

        const typeOrder: Record<string, number> = { 'move': 1, 'battle': 2, 'auto': 3, 'global': 4 };
        const rarityOrder: Record<string, number> = { 'Épica': 1, 'Rara': 2, 'Incomum': 3, 'Comum': 4 };

        filteredCards.sort((a, b) => {
            if (typeOrder[a.type] !== typeOrder[b.type]) return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
            if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) return (rarityOrder[a.rarity] || 99) - (rarityOrder[b.rarity] || 99);
            return a.name.localeCompare(b.name);
        });

        filteredCards.forEach(c => {
            const rData = CARD_RARITIES[c.rarity];
            const borderColor = rData ? rData.color : '#8d99ae';

            const d = document.createElement('div');
            d.style.cssText = "display: flex; flex-direction: column; align-items: center; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); width: 100%; box-sizing: border-box; position: relative;";

            let actionBtn = '';
            if (c.type === 'move') {
                if (canUseMove) actionBtn = `<button class="btn" style="width:100%; margin-top:8px; padding:8px; background:#2ecc71; border:none; border-radius:4px; color:white; font-weight:bold; cursor:pointer;" onclick="window.Cards.activate('${c.id}')">USAR</button>`;
                else actionBtn = `<button class="btn" disabled style="width:100%; margin-top:8px; padding:8px; background:#7f8c8d; border:none; border-radius:4px; color:white; font-weight:bold; cursor:not-allowed;" title="Só pode usar antes de rolar o dado">USAR</button>`;
            } else if (c.type === 'global') {
                if (canUseMove) actionBtn = `<button class="btn" style="width:100%; margin-top:8px; padding:8px; background:#e74c3c; border:none; border-radius:4px; color:white; font-weight:bold; cursor:pointer;" title="Afeta o mundo todo!" onclick="window.Cards.activate('${c.id}')">GLOBAL</button>`;
                else actionBtn = `<button class="btn" disabled style="width:100%; margin-top:8px; padding:8px; background:#7f8c8d; border:none; border-radius:4px; color:white; font-weight:bold; cursor:not-allowed;" title="Só pode usar antes de rolar o dado no seu turno">GLOBAL</button>`;
            } else if (c.type === 'auto') {
                actionBtn = `<button class="btn" disabled style="width:100%; margin-top:8px; padding:8px; background:#8e44ad; border:none; border-radius:4px; color:white; font-weight:bold; cursor:not-allowed;" title="Esta carta ativa automaticamente">AUTO</button>`;
            } else {
                actionBtn = `<button class="btn" disabled style="width:100%; margin-top:8px; padding:8px; background:#555; border:none; border-radius:4px; color:white; font-weight:bold; cursor:not-allowed;" title="Esta carta só pode ser usada em Batalha">BATTLE</button>`;
            }

            // O caminho da imagem (.jpg) - Coloquei um title para a pessoa poder ler a descrição da carta se deixar o mouse em cima
            d.innerHTML = `
                <div style="position: absolute; top: -5px; right: -5px; background: ${borderColor}; color: #fff; padding: 2px 6px; font-size: 0.7rem; border-radius: 10px; font-weight: bold; border: 1px solid #222; text-shadow: 1px 1px 0 #000; box-shadow: 0 2px 4px rgba(0,0,0,0.5); z-index: 10;">
                    ${c.rarity.toUpperCase()}
                </div>
                <img src="/assets/img/Cartas/${c.id}.jpg" alt="${c.name}" title="${c.desc}" style="width: 100%; aspect-ratio: 2.5/3.5; object-fit: fill; border-radius: 6px; border: 3px solid ${borderColor};">
                ${actionBtn}
            `;
            list.appendChild(d);
        });

        document.getElementById('board-cards-modal')!.style.display = 'flex';
    }

    static useBoardCard(cardId: string) { const p = this.getCurrentPlayer(); const cardIndex = p.cards.findIndex(c => c.id === cardId); if (cardIndex === -1) return; const card = p.cards[cardIndex]; if (card.id === 'bike') { p.cards.splice(cardIndex, 1); document.getElementById('board-cards-modal')!.style.display = 'none'; this.log(`${p.name} usou Bicicleta!`); if (Network.isOnline) { Network.sendAction('ROLL', { result: 5 }); return; } this.hasRolled = true; this.animateDice(5, 0); } else if (card.id === 'teleport') { p.cards.splice(cardIndex, 1); document.getElementById('board-cards-modal')!.style.display = 'none'; this.log(`${p.name} usou Teleporte!`); p.x = 0; p.y = 0; this.moveVisuals(); this.handleTile(p); } else { alert("Efeito não implementado na demo."); } if (Network.isOnline) Network.syncPlayerState(); }
    static forceDice(val: number) { this.forcedDiceValue = val; this.rollDice(); }

    static placeTrap(x: number, y: number, ownerId: number) {
        this.traps.push({ x, y, ownerId });
        this.renderTraps(); // Atualiza a tela

        // Avisa a todos da sala que uma armadilha foi colocada!
        const Network = (window as any).Network;
        if (Network.isOnline) {
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
            if (tile) tile.style.border = "2px dashed red";
        });
    }

    static async rollDice() {
        if (!this.canAct() || this.hasRolled) return;

        // Pega o jogador atual logo no início para fazermos a checagem das insígnias
        const p = this.getCurrentPlayer();

        // ===============================================================
        // NOVO: CHECAGEM DO CAMPEÃO (8 INSÍGNIAS) ANTES DE ROLAR O DADO
        // ===============================================================
        const badgesCount = p.badges.filter((b: boolean) => b).length;
        if (badgesCount === 8) {
            const GameClass = (window as any).Game || this;
            if (GameClass.globalChampion) {
                // Pergunta se ele quer lutar agora ou continuar farmando
                const querLutar = confirm(`🏆 VOCÊ TEM AS 8 INSÍGNIAS!\n\nDeseja desafiar o Campeão Atual (${GameClass.globalChampion.name}) agora?\n\n(Regras: Sem itens, sem cartas. Vencer = Fim de Jogo!)\n\nClique OK para Lutar ou Cancelar para rolar o dado e se preparar mais.`);

                if (querLutar) {
                    const Battle = (window as any).Battle;
                    Battle.startChampionBattle(p, GameClass.globalChampion);
                    return; // Interrompe o giro do dado! Ele vai pra luta!
                }
            } else {
                // Se não tem ninguém no banco de dados (Primeira partida da história)
                alert("🏆 PARABÉNS! Você conseguiu as 8 Insígnias e é o Primeiro Campeão da Liga!");
                const NetworkObj = (window as any).Network;
                if (NetworkObj && NetworkObj.isOnline) {
                    NetworkObj.saveGlobalChampion(p); // Grava ele como o 1º Campeão
                    NetworkObj.sendAction('GAME_WIN', { winnerId: p.id });
                }
                this.triggerVictory(p.id);
                return; // Interrompe o giro do dado!
            }
        }
        // ===============================================================

        // Se ele não tem 8 insígnias, ou se escolheu "Cancelar" a luta, o jogo continua normal:
        this.hasRolled = true;
        let result = 0;

        if (this.forcedDiceValue > 0) {
            result = this.forcedDiceValue;
            this.forcedDiceValue = 0;
            this.log("🔮 Dado Mágico usado!");
        } else {
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

        // --- LIMPEZA DA IMUNIDADE DE FUGA AO ROLAR O DADO ---
        if (p.effects.escapedGym) {
            p.effects.escapedGym = false;
            const NetworkObjForce = (window as any).Network || Network;
            if (NetworkObjForce.isOnline) NetworkObjForce.syncPlayerState();
        }

        // Dispara o resultado para a rede e roda a animação
        const NetworkObj = (window as any).Network || Network;
        if (NetworkObj.isOnline) {
            NetworkObj.sendAction('ROLL', { result: result });
        }

        const playerId = NetworkObj.isOnline ? NetworkObj.myPlayerId : this.turn;
        this.animateDice(result, playerId);
    }

    static debugMove() {
        if (!this.canAct()) return;
        const input = document.getElementById('debug-input') as HTMLInputElement;
        const result = parseInt(input.value) || 1;
        this.log(`[DEBUG] Forçando ${result} passos.`);

        if (Network.isOnline) {
            Network.sendAction('ROLL', { result: result });
            // CORREÇÃO: Faltava o seu próprio personagem andar na sua tela!
            this.animateDice(result, Network.myPlayerId);
            return;
        }

        this.animateDice(result, 0);
    }

    static moveVisuals() { this.players.forEach((p, idx) => { const currentTile = document.getElementById(`tile-${p.x}-${p.y}`); if (!currentTile) return; let token = document.getElementById(`p-token-${idx}`); if (token && token.parentElement === currentTile) { if (idx === this.turn) token.classList.add('active-token'); else token.classList.remove('active-token'); return; } if (token) token.remove(); const t = document.createElement('div'); t.id = `p-token-${idx}`; t.className = `player-token ${idx === this.turn ? 'active-token' : ''}`; t.style.backgroundImage = `url('${p.avatar}')`; t.style.borderColor = PLAYER_COLORS[idx % PLAYER_COLORS.length]; if (MapSystem.size >= 30) { t.style.width = '90%'; t.style.height = '90%'; } currentTile.appendChild(t); if (idx === this.turn) currentTile.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' }); }); }

    static async animateDice(result: number, playerId: number) {
        const die = document.getElementById('d20-display')!;
        for (let i = 0; i < 5; i++) {
            die.innerText = `🎲 ${Math.floor(Math.random() * 6) + 1}`;
            await new Promise(r => setTimeout(r, 50));
        }
        die.innerText = `🎲 ${result}`;

        this.log(`${this.players[playerId].name} tirou ${result}`);

        const Network = (window as any).Network;
        const ev = this.currentGlobalEvent?.id;

        // --- EVENTOS DE MOVIMENTO ---
        if (ev === 'SPATIAL_RIFT') {
            const p = this.players[playerId];
            const totalTiles = MapSystem.size * MapSystem.size;
            const randomIdx = Math.floor(Math.random() * totalTiles);
            const targetCoord = MapSystem.getCoord(randomIdx);

            p.x = targetCoord.x;
            p.y = targetCoord.y;
            this.log(`🌌 FENDA ESPACIAL! ${p.name} foi teletransportado!`);
            this.moveVisuals();

            if (!Network.isOnline || playerId === Network.myPlayerId) {
                this.handleTile(p);
                if (Network.isOnline) Network.syncPlayerState();
            }
            return;
        }

        if (ev === 'DOUBLE_STEP') {
            result *= 2;
            this.log(`🏃 VENTO A FAVOR! Movimento dobrado para ${result}!`);
        } else if (ev === 'QUICKSAND') {
            result = Math.max(1, Math.floor(result / 2));
            this.log(`⏳ AREIA MOVEDIÇA! Movimento reduzido para ${result}!`);
        }
        // ---------------------------

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

        for (let i = 0; i < steps; i++) {
            let currentIdx = MapSystem.getIndex(p.x, p.y);
            const isMoonwalking = p.effects && (p.effects.moonwalker || 0) > 0;

            if (isMoonwalking) {
                currentIdx--;
                if (currentIdx < 0) currentIdx = totalTiles - 1;
            } else {
                currentIdx++;

                if (currentIdx >= totalTiles) {
                    currentIdx = 0;

                    if (!Network.isOnline || pId === Network.myPlayerId) {
                        // --- NOVAS RECOMPENSAS DE VOLTA COMPLETA ---
                        let lapGold = 500;
                        if (this.currentGlobalEvent?.id === 'GOLD_RUSH') lapGold *= 2; // Evento Ouro em Dobro!
                        p.gold += lapGold;
                        Cards.draw(p);
                        Cards.draw(p); // Compra a segunda carta

                        // --- NOVO: TODO O TIME SOBE 1 LEVEL (LIMITE 25) ---
                        p.team.forEach(mon => {
                            if (mon.level < 25) {
                                mon.levelUp(p);
                            }
                        });

                        this.sendGlobalLog(`🚩 ${p.name} completou uma volta! Ganhou 500G, 2 Cartas e +1 Level para todo o time!`);

                        // --- LOG DE AUDITORIA: GANHO DE VOLTA ---
                        this.sendGlobalLog(`💰 [Extrato] ${p.name} recebeu +500G (Volta no Tabuleiro).`);
                        this.sendGlobalLog(`💰 [Extrato] Novo Saldo: ${p.gold}G.`);

                        this.updateHUD(); // Atualiza a tela na hora!
                        if (Network.isOnline) Network.syncPlayerState();
                    }
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
                    let tax = 0.20;
                    if (this.currentGlobalEvent?.id === 'BLOOD_MOON') tax = 0.40; // Evento Lua Sangrenta (Rouba o Dobro!)

                    stolenGold = Math.floor(p.gold * tax);
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
            // Decrementa o efeito Moonwalker se existir
            if (p.effects && (p.effects.moonwalker || 0) > 0) {
                p.effects.moonwalker!--;
                if (p.effects.moonwalker === 0) {
                    this.log(`💃 O efeito Moon Walker de ${p.name} acabou!`);
                }
            }

            // Se NÃO tiver caído numa armadilha, ativa a casa direto.
            // Se caiu, o HandleTile será ativado quando ele fechar o aviso da armadilha na tela.
            if (!hitTrap) {
                this.handleTile(p);
            }
            if (Network.isOnline) Network.syncPlayerState();
        }
    }

    static performVisualStep(pId: number, x: number, y: number) { const p = this.players[pId]; if (!p) return; p.x = x; p.y = y; const tile = document.getElementById(`tile-${x}-${y}`); if (tile) { tile.classList.add('step-highlight'); this.moveVisuals(); setTimeout(() => tile.classList.remove('step-highlight'), 300); } }

    static handleTile(p: Player) {
        const Network = (window as any).Network;
        if (Battle.active) return;

        if (p.isDefeated()) {
            this.handleTotalDefeat(p);
            this.nextTurn();
            return;
        }

        const type = MapSystem.grid[p.y][p.x];
        const enemy = this.players.find(o => o !== p && o.x === p.x && o.y === p.y);

        if (enemy) {
            const defMon = enemy.team.find(m => !m.isFainted());
            if (defMon) {
                this.sendGlobalLog(`⚔️ Conflito! ${p.name} vs ${enemy.name}`);
                Battle.setup(p, defMon, true, enemy.name, 0, enemy, false, 0, "", type);
            } else {
                this.log(`${enemy.name} sem pokemons!`);
                this.nextTurn();
            }
            return;
        }

        if (NPC_DATA[type]) {
            const npc = NPC_DATA[type];

            // --- LÓGICA DINÂMICA DE IMAGEM ---
            // Ele puxa direto o nome da imagem que você colocou na NPC_DATA!
            const npcImg = npc.img ? `/assets/img/NPCs/${npc.img}` : '/assets/img/Treinadores/Red.jpg';
            // ---------------------------------

            const npcLevel = this.getGlobalAverageLevel();
            const teamSize = this.getGlobalAverageTeamSize();
            const npcTeam: Pokemon[] = [];

            // Sorteia os Pokémons até preencher a quantidade média
            for (let i = 0; i < teamSize; i++) {
                const monId = npc.team[Math.floor(Math.random() * npc.team.length)];
                npcTeam.push(new Pokemon(monId, npcLevel, null));
            }

            // Inicia a batalha com o nome e imagem corretos
            Battle.setup(p, npcTeam as any, false, npc.name, npc.gold, null, false, 0, npcImg, type);
            return;
        }

        if (type === TILE.CITY) {
            this.isCityEvent = true;
            const cityGold = document.getElementById('city-gold-display');
            if (cityGold) cityGold.innerText = `Saldo: ${p.gold}G`;
            document.getElementById('city-modal')!.style.display = 'flex';
        }

        else if (type === TILE.EVENT) {
            // EVENTO: LOTTERY_DAY
            if (this.currentGlobalEvent?.id === 'LOTTERY_DAY') {
                p.gold += 500;
                Cards.draw(p, true);
                const lotteryMsg = `🎰 DIA DE LOTERIA! Você visitou a casa de Evento e ganhou o prêmio acumulado de 500G e 1 Carta!`;
                this.sendGlobalLog(lotteryMsg);
                this.showGlobalAlert(lotteryMsg, p.name, true);
                if (Network.isOnline) {
                    Network.syncPlayerState();
                    Network.sendAction('LOG', { msg: lotteryMsg });
                }
                return;
            }

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

                if (Network.isOnline) {
                    Network.syncPlayerState();
                    Network.sendAction('LOG', { msg: remoteMsg });
                    Network.sendAction('SHOW_ALERT', { msg: remoteMsg, playerName: p.name, endsTurn: false });
                }
                return; // Para a função aqui, a nova casa será processada quando fechar o alerta
            }

            // =========================================================
            // 2. SE NÃO TELETRANPORTOU: CARTA (50%) ou ITEM (50%)
            // =========================================================
            if (Math.random() < 0.5) {
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

            if (Network.isOnline) {
                Network.sendAction('LOG', { msg: remoteMsg });
                Network.sendAction('SHOW_ALERT', { msg: remoteMsg, playerName: p.name });
            }
        }

        else if (type === TILE.GYM) {
            const gymId = MapSystem.gymLocations[`${p.x},${p.y}`] || 1;

            // EVENTO: GYM_VACATION
            if (this.currentGlobalEvent?.id === 'GYM_VACATION') {
                const vacationMsg = `🏖️ GINÁSIO TRANCADO! O Líder está de férias! Volte quando o evento de Férias Coletivas acabar.`;
                this.showGlobalAlert(vacationMsg, p.name, true);
                return;
            }

            // --- EXCEÇÃO: IMUNIDADE DE FUGA (FUMAÇA NINJA) ---/
            if (p.effects.escapedGym) {
                this.log("💨 Você usou Fumaça Ninja e o Líder ainda não te notou...");
                this.nextTurn();
                return;
            }

            // Verifica se NÃO tem a insígnia
            if (!p.badges[gymId - 1]) {
                Battle.setup(p, new Pokemon(150, 1, false), false, "Líder de Ginásio", 1000, null, true, gymId, "", type);
            }
            else {
                // Já venceu o ginásio! Inicia a nova mecânica de Teletransporte
                const roll = Math.floor(Math.random() * 100) + 1;
                let didTeleport = false;

                if (roll <= 25) {
                    // 1. Vasculha o mapa em busca de ginásios ainda não derrotados
                    const undefeatedGyms: { x: number, y: number, id: number }[] = [];
                    for (const key in MapSystem.gymLocations) {
                        const id = MapSystem.gymLocations[key];
                        if (!p.badges[id - 1]) {
                            const [gx, gy] = key.split(',').map(Number);
                            undefeatedGyms.push({ x: gx, y: gy, id: id });
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
                    if (Cards) Cards.draw(p, true); // true = Silencioso para não spammar log duplo

                    this.log(msgLocal.replace(/\n\n/g, ' '));

                    // Exibe o Alerta Bonito e só passa o turno quando clicar em OK
                    this.showGlobalAlert(msgLocal, p.name, true);

                    if (Network.isOnline) {
                        Network.sendAction('LOG', { msg: msgGlobal });
                        Network.sendAction('SHOW_ALERT', { msg: msgGlobal, playerName: p.name });
                    }
                }
            }
        }
        else if ([TILE.GRASS, TILE.WATER, TILE.GROUND].includes(type)) {
            if (Math.random() < 0.8) {
                //const wildMon = this.generateWildPokemon(); 
                const wildMon = this.generateWildPokemon(type);
                if (wildMon.isLegendary) {
                    // Armazena o monstro real na memória temporária para usar pós-cinemática
                    this.pendingLegendaryEncounter = { mon: wildMon, type: type };

                    const msgLocal = `⚠️ ALERTA LENDÁRIO!\n\nVocê encontrou um ${wildMon.name} selvagem!||LEGENDARY:${wildMon.name}||MY_ENCOUNTER`;
                    const msgGlobal = `⚠️ ALERTA LENDÁRIO! ${p.name} encontrou um ${wildMon.name} selvagem!||LEGENDARY:${wildMon.name}`;

                    this.log(msgLocal.replace(/\n\n/g, ' ').split('||')[0]);
                    this.showGlobalAlert(msgLocal, p.name, true, false); // false para não passar turno direto

                    if (Network.isOnline) {
                        Network.sendAction('LOG', { msg: msgGlobal.split('||')[0] });
                        Network.sendAction('SHOW_ALERT', { msg: msgGlobal, playerName: p.name, endsTurn: false });
                    }
                } else {
                    Battle.setup(p, wildMon, false, "Selvagem", 0, null, false, 0, "", type);
                }
            }
            else {
                const messages = ["Você procurou, mas nenhum Pokémon selvagem apareceu dessa vez!", "O mato se mexeu... mas era só o vento 😅", "Nada de Pokémon por aqui... talvez na próxima!", "Está tudo muito quieto...", "Um Pidgey voou longe, você não alcançou."];
                const msg = messages[Math.floor(Math.random() * messages.length)];

                this.log(msg);

                // --- NOVA LÓGICA DO ALERTA ---
                this.showGlobalAlert(msg, p.name, true);

                if (Network.isOnline) {
                    Network.sendAction('SHOW_ALERT', { msg: msg, playerName: p.name });
                }
                // ATENÇÃO: O this.nextTurn() foi removido daqui! 
                // O turno agora só passa quando o jogador clicar no botão "OK".
            }
        }
        else {
            this.nextTurn();
        }
    }

    // =========================================================================================
    // CORREÇÃO: Lógica de Cura Completa (Revive + Heal All)
    // =========================================================================================
    static handleCityChoice(c: string) {
        const player = this.getCurrentPlayer();

        // EVENTO EMP: Bloqueia o Centro Pokémon
        if (this.currentGlobalEvent?.id === 'EMP' && c !== 'shop') {
            this.showGlobalAlert("📡 A Tempestade Eletromagnética derrubou a energia do Centro Pokémon! Cura e Compra de Cartas inoperantes.", player.name, true, false);
            return;
        }

        if (c === 'heal') {
            // Cura o time
            player.team.forEach(p => {
                p.currentHp = p.maxHp;
            });

            this.sendGlobalLog(`🏥 ${player.name} recuperou seu time no Centro Pokémon!`);
            this.updateHUD();
            this.isCityEvent = false;

            if (Network.isOnline) Network.syncPlayerState();

            document.getElementById('city-modal')!.style.display = 'none';
            this.nextTurn();
        }
        else if (c === 'card') {
            // Nova Lógica de Comprar Carta
            if (player.gold >= 500) {
                player.gold -= 500;

                // Fecha a janela da cidade
                this.isCityEvent = false;
                document.getElementById('city-modal')!.style.display = 'none';

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

                if (Network.isOnline) {
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
            document.getElementById('city-modal')!.style.display = 'none';
            Shop.open();
        }
    }

    static nextTurn() {
        this.saveGame();
        const currentP = this.getCurrentPlayer();
        currentP.resetTurnFlags();

        let shouldSyncEffects = false;

        // Limpa as cartas ofensivas usadas neste turno pelo jogador atual e garante a sincronia
        if (currentP.effects && currentP.effects.offensiveCardsUsed) {
            currentP.effects.offensiveCardsUsed = 0;
            shouldSyncEffects = true;
        }

        // --- DECREMENTO DE EFEITOS POR TURNO (Lure, Double XP e Exp Share) ---
        // Só decrementa se o jogador ROLOU O DADO. Se pulou a vez, congela os efeitos!
        if (this.hasRolled && currentP.effects) {
            let effectsChanged = false;

            if (currentP.effects.lureShiny && currentP.effects.lureShiny > 0) {
                currentP.effects.lureShiny--;
                if (currentP.effects.lureShiny === 0) this.sendGlobalLog(`✨ Lure Shiny de ${currentP.name} perdeu a força.`);
                effectsChanged = true;
            }

            if (currentP.effects.doubleXp && currentP.effects.doubleXp > 0) {
                currentP.effects.doubleXp--;
                if (currentP.effects.doubleXp === 0) this.sendGlobalLog(`📉 O efeito Double XP de ${currentP.name} acabou.`);
                effectsChanged = true;
            }

            if (currentP.effects.expShare && currentP.effects.expShare > 0) {
                currentP.effects.expShare--;
                if (currentP.effects.expShare === 0) this.sendGlobalLog(`📉 O efeito Exp. Share de ${currentP.name} acabou.`);
                effectsChanged = true;
            }

            // --- LIMPEZA DA IMUNIDADE DE FUGA (MOVIDA PARA ROLLDICE) ---
            // A limpeza foi movida para o início do próximo turno (no rollDice) 
            // para garantir que a proteção dure enquanto o jogador estiver parado no ginásio.
            // ----------------------------------------------------------

            // Salva a contagem atualizada no Firebase se algum efeito foi gasto
            if (effectsChanged) {
                shouldSyncEffects = true;
            }
        }

        // Centraliza a sincronização final do turno do jogador atual
        if (shouldSyncEffects) {
            if (Network && Network.isOnline) Network.syncSpecificPlayer(currentP.id);
        }
        // ----------------------------------------------------------

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

        // --- NOVA LÓGICA DE RODADA E EVENTOS ---
        const nextTurnIdx = (this.turn + 1) % this.players.length;
        if (nextTurnIdx === 0) {
            this.round++; // Completou um ciclo inteiro

            // 1. Limpa evento antigo
            if (this.currentGlobalEvent && this.round >= this.eventEndRound) {
                this.currentGlobalEvent = null;
                this.sendGlobalLog("🌍 O clima do mundo voltou à normalidade.");

                // Salva a limpeza online
                if (Network.isOnline && this.turn === Network.myPlayerId && db) {
                    update(ref(db, `rooms/${Network.currentRoomId}`), { currentEventId: null, eventEndRound: 0 });
                }
            }

            // 2. Rola um Novo Evento (Nas rodadas de final 2 e 7: 2, 7, 12, 17...)
            if (this.round % 5 === 2) {
                // Apenas quem finalizou a rodada anterior sorteia e avisa para não duplicar na rede
                if (!Network.isOnline || this.turn === Network.myPlayerId) {
                    const ev = GLOBAL_EVENTS[Math.floor(Math.random() * GLOBAL_EVENTS.length)];
                    const msgGlobal = `🌍 ALERTA GLOBAL! O evento ${ev.name} começou!||EVENT:${ev.id}`;

                    this.currentGlobalEvent = ev;
                    this.eventEndRound = this.round + 5;

                    // --- GATILHOS DE INÍCIO DE EVENTO ---
                    if (ev.id === 'TAX_SEASON') {
                        this.players.forEach(player => {
                            // Perde metade das cartas
                            if (player.cards.length > 0) {
                                const lostCount = Math.floor(player.cards.length / 2);
                                for (let i = 0; i < lostCount; i++) {
                                    player.cards.splice(Math.floor(Math.random() * player.cards.length), 1);
                                }
                            }
                            // Perde metade dos itens
                            for (const key in player.items) {
                                if (player.items[key] > 0) {
                                    player.items[key] = Math.ceil(player.items[key] / 2);
                                }
                            }
                        });
                        this.sendGlobalLog("📜 IMPOSTO DE RENDA: Todos os jogadores perderam metade de suas cartas e itens!");
                    }
                    // ------------------------------------

                    if (Network.isOnline && db) {
                        const updates: any = {};
                        updates[`rooms/${Network.currentRoomId}/currentEventId`] = ev.id;
                        updates[`rooms/${Network.currentRoomId}/eventEndRound`] = this.eventEndRound;

                        // Sincroniza jogadores se houve mudança no Tax
                        if (ev.id === 'TAX_SEASON') {
                            this.players.forEach(p => {
                                updates[`rooms/${Network.currentRoomId}/players/${p.id}/cards`] = p.cards;
                                updates[`rooms/${Network.currentRoomId}/players/${p.id}/items`] = p.items;
                            });
                        }
                        update(ref(db), updates);
                    }

                    // Registra no Log Local (que agora também ativa a caixinha)
                    this.log(msgGlobal);

                    if (Network.isOnline) {
                        Network.sendAction('LOG', { msg: msgGlobal });
                    }
                }
            }
        }
        // Passa a vez para o próximo jogador

        this.turn = nextTurnIdx;
        this.hasRolled = false;

        if (Network.isOnline) {
            // Apenas atualiza a vez, deixa o próprio jogador cuidar do seu estado quando agir
            Network.syncTurn(this.turn, this.round);
        } else {
            const nextP = this.players[this.turn];
            if (nextP.skipTurns > 0) {
                nextP.skipTurns = Math.max(0, nextP.skipTurns - 1);
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

        // --- 1. LIMPEZA DO EVENTO PARA TODOS OS CLIENTES ---
        if (this.currentGlobalEvent && this.round >= this.eventEndRound) {
            this.currentGlobalEvent = null;
            this.eventEndRound = 0;
            this.updateHUD();
        }

        // --- 2. GATILHO INDIVIDUAL DO BÔNUS DA RODADA 10, 20... ---
        const processDecadeBonus = (player: Player) => {
            if (this.round > 1 && this.round % 10 === 0) {
                // O SEGREDO: Salvar DENTRO de "effects" porque temos certeza que o Network.ts salva isso no Firebase!
                if (player.effects.lastBonusRound !== this.round) {
                    player.effects.lastBonusRound = this.round;

                    if (player.skipTurns === 0) {
                        // Sem setTimeout! Entrega imediata para evitar atropelamento de rede
                        this.triggerDecadeBonus(player);
                    } else {
                        this.log(`❌ ${player.name} está paralisado e perdeu o bônus da Rodada ${this.round}!`);

                        // Força o salvamento para o paralisado também não farmar com F5
                        if (Network && Network.isOnline) Network.syncSpecificPlayer(player.id);
                    }
                }
            }
        };

        const processTrucoSeis = (player: Player) => {
            if (this.currentGlobalEvent?.id === 'TRUCO_SEIS') {
                if (player.cards.length > 6) {
                    const lostCount = player.cards.length - 6;
                    while (player.cards.length > 6) {
                        player.cards.splice(Math.floor(Math.random() * player.cards.length), 1);
                    }
                    this.sendGlobalLog(`🃏 ${player.name} excedeu o limite do TRUCO e perdeu ${lostCount} carta(s)!`);

                    if (this.turn === Network.myPlayerId || !Network.isOnline) {
                        this.showGlobalAlert(`🃏 GRITARAM TRUCO!\n\nVocê tinha mais de 6 cartas e precisou descartar ${lostCount} aleatoriamente para continuar.`, player.name, true, false);
                        this.updateHUD();
                    }

                    if (Network && Network.isOnline) Network.syncSpecificPlayer(player.id);
                }
            }
        };

        if (Network.isOnline) {
            if (ind) ind.innerText = "FIREBASE";
            if (this.turn === me) {
                const myPlayer = this.players[me];

                // --- BLINDAGEM ANTI-F5 (VÓRTICE DO GINÁSIO) ---
                // Se o jogador der F5 para fugir, ele nasce em cima do ginásio invicto.
                // Isso tira o botão de rolar e força ele a lutar na mesma hora!
                const type = MapSystem.grid[myPlayer.y][myPlayer.x];
                if (type === TILE.GYM && !this.pendingTileEvent) {
                    const gymId = MapSystem.gymLocations[`${myPlayer.x},${myPlayer.y}`];
                    if (gymId && !myPlayer.badges[gymId - 1]) {
                        // --- EXCEÇÃO: IMUNIDADE DE FUGA (FUMAÇA NINJA) ---
                        if (myPlayer.effects.escapedGym) {
                            // Imunidade ativa! Deixa ele rolar o dado em paz para ir embora.
                        } else {
                            btn.disabled = true;
                            btn.innerText = "EM BATALHA";

                            // Trava para não abrir a batalha 2x se ele já estiver lutando
                            const BattleObj = (window as any).Battle;
                            if (!BattleObj.active) this.handleTile(myPlayer);
                            return;
                        }
                    }
                }
                // ----------------------------------------------

                processDecadeBonus(myPlayer);
                processTrucoSeis(myPlayer);

                // --- EVENTO: ROBIN HOOD (Início de Turno) ---
                if (this.currentGlobalEvent?.id === 'ROBIN_HOOD' && !myPlayer.effects.robinHoodApplied) {
                    if (myPlayer.gold < 200 && myPlayer.cards.length < 2) {
                        myPlayer.gold += 800;
                        for (let i = 0; i < 5; i++) Cards.draw(myPlayer, true);
                        myPlayer.effects.robinHoodApplied = true;

                        const robinMsg = `🎁 AJUDA HUMANITÁRIA! Robin Hood te deu 800G e 5 Cartas por estar em dificuldade!`;
                        this.sendGlobalLog(robinMsg);
                        this.showGlobalAlert(robinMsg, myPlayer.name, true, false);

                        if (Network.isOnline) Network.syncPlayerState();
                        this.updateHUD();
                    }
                }
                // --------------------------------------------

                if (myPlayer.skipTurns > 0 || myPlayer.isProcessingSkip) {
                    btn.disabled = true;

                    if (!myPlayer.isProcessingSkip) {
                        btn.innerText = `Pulando vez... (${myPlayer.skipTurns})`;
                        myPlayer.isProcessingSkip = true;

                        // Executa imediatamente para garantir que salva no Firebase antes do navegador dormir
                        myPlayer.skipTurns = Math.max(0, myPlayer.skipTurns - 1);
                        this.sendGlobalLog(`${myPlayer.name} perdeu a vez! (Restam: ${myPlayer.skipTurns})`);
                        const NetworkObj = (window as any).Network || Network;
                        if (NetworkObj && NetworkObj.isOnline) NetworkObj.syncPlayerState();

                        setTimeout(() => {
                            myPlayer.isProcessingSkip = false;
                            // Só passa a vez se ainda for o turno dele
                            if (this.turn === me) {
                                this.nextTurn();
                            }
                        }, 2000);
                    }
                    return;
                }

                btn.disabled = false;
                btn.innerText = "ROLAR";
            } else {
                btn.disabled = true;
                btn.innerText = `Vez de ${this.players[this.turn].name}`;
            }
        } else {
            if (ind) ind.innerText = "OFFLINE";

            const currP = this.players[this.turn];

            // --- BLINDAGEM ANTI-F5 NO MODO OFFLINE ---
            const type = MapSystem.grid[currP.y][currP.x];
            if (type === TILE.GYM && !this.pendingTileEvent) {
                const gymId = MapSystem.gymLocations[`${currP.x},${currP.y}`];
                if (gymId && !currP.badges[gymId - 1]) {
                    // --- EXCEÇÃO: IMUNIDADE DE FUGA (FUMAÇA NINJA) ---
                    if (currP.effects.escapedGym) {
                        // Imunidade ativa! Deixa ele rolar o dado em paz.
                    } else {
                        btn.disabled = true;
                        btn.innerText = "EM BATALHA";

                        const BattleObj = (window as any).Battle;
                        if (!BattleObj.active) this.handleTile(currP);
                        return;
                    }
                }
            }
            // -----------------------------------------

            processDecadeBonus(currP); // <--- AVALIA O BÔNUS NO MODO OFFLINE
            processTrucoSeis(currP);

            btn.disabled = false;
        }
    }

    static canAct() { if (!Network.isOnline) return true; return this.turn === Network.myPlayerId; }
    static getSaveData() { return { players: this.players, turn: this.turn, mapSize: MapSystem.size, grid: MapSystem.grid, gymLoc: MapSystem.gymLocations }; }
    static saveGame() { localStorage.setItem('pk_save', JSON.stringify(this.getSaveData())); }
    static loadGame() { const json = localStorage.getItem('pk_save'); if (json) this.loadGameFromData(JSON.parse(json)); }
    //static loadGameFromData(d: any) { MapSystem.size=d.mapSize; MapSystem.grid=d.grid; MapSystem.gymLocations=d.gymLoc || {}; this.players = d.players.map((pd:any) => { const file = pd.avatar.split('/').pop(); const pl = new Player(pd.id, pd.name, file, true); Object.assign(pl, pd); pl.avatar = `/assets/img/Treinadores/${file}`; pl.team = pd.team.map((td:any) => { const po=new Pokemon(td.id, td.level, td.isShiny); Object.assign(po, td); return po; }); return pl; }); this.turn = d.turn; document.getElementById('setup-screen')!.style.display='none'; document.getElementById('game-container')!.style.display='flex'; Game.init(this.players, d.mapSize); }
    static loadGameFromData(d: any) {
        MapSystem.size = d.mapSize; MapSystem.grid = d.grid; MapSystem.gymLocations = d.gymLoc || {};
        this.lastBonusRoundClaimed = d.lastBonusRoundClaimed || 0;
        this.players = d.players.map((pd: any) => { const file = pd.avatar.split('/').pop(); const pl = new Player(pd.id, pd.name, file, true); Object.assign(pl, pd); pl.avatar = `/assets/img/Treinadores/${file}`; pl.team = pd.team.map((td: any) => { const po = new Pokemon(td.id, td.level, td.isShiny); Object.assign(po, td); return po; }); return pl; }); this.turn = d.turn; document.getElementById('setup-screen')!.style.display = 'none'; document.getElementById('game-container')!.style.display = 'flex'; Game.init(this.players, d.mapSize);
    }
    static exportSave() { const d = localStorage.getItem('pk_save'); if (!d) return alert("Vazio"); const b = new Blob([d], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'save.txt'; a.click(); }
    static importSave(i: HTMLInputElement) { const f = i.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = e => { localStorage.setItem('pk_save', e.target?.result as string); this.loadGame(); }; r.readAsText(f); }
    static openInventoryModal(pId: number) { const p = this.players[pId]; const list = document.getElementById('board-inventory-list')!; list.innerHTML = ''; const canUse = (this.canAct() && this.turn === pId); Object.keys(p.items).forEach(key => { if (p.items[key] > 0) { const item = SHOP_ITEMS.find(i => i.id === key); if (item) { const d = document.createElement('div'); d.className = 'shop-item'; let btnHTML = ''; if (canUse && (item.type === 'heal' || item.type === 'revive')) { btnHTML = `<button class="btn btn-mini" style="width:auto;" onclick="window.Game.useItemBoard('${key}', ${pId})">Usar</button>`; } d.innerHTML = `<div style="display:flex; align-items:center;"><img src="/assets/img/Itens/${item.icon}" class="item-icon-mini"><span>${item.name} x${p.items[key]}</span></div>${btnHTML}`; list.appendChild(d); } } }); document.getElementById('board-inventory-modal')!.style.display = 'flex'; }

    static openPokedexEntry(targetId: number) {
        this.openPokedex(this.turn, targetId);
    }

    static openPokedex(pId: number, filterId: number | null = null) {
        const p = this.players[pId];
        const list = document.getElementById('pokedex-list')!;
        list.innerHTML = '';

        // --- NOVA BARRA DE BUSCA ---
        if (filterId === null) {
            const searchContainer = document.createElement('div');
            // Removemos o sticky e os efeitos visuais de card. Adicionamos grid-column para forçar a quebra de linha.
            searchContainer.style.cssText = "width: 100%; grid-column: 1 / -1; margin-bottom: 20px;";
            searchContainer.innerHTML = `<input type="text" id="pokedex-search" placeholder="🔍 Buscar Pokémon por nome..." style="width: 100%; padding: 12px 15px; border-radius: 4px; border: 2px solid #8d99ae; font-size: 1rem; box-sizing: border-box; background: #fff; color: #2c3e50; outline: none; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);" onkeyup="window.Game.filterPokedex()">`;
            list.appendChild(searchContainer);
        }
        // ---------------------------

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
            const weaknesses: { type: string, multi: number }[] = [];
            const resistances: { type: string, multi: number }[] = [];

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

                if (multiplier > 1) weaknesses.push({ type: atkType, multi: multiplier });
                if (multiplier < 1) resistances.push({ type: atkType, multi: multiplier }); // Agora engloba imunidade (0) também
            }

            // Formata HTML das fraquezas e resistências
            const formatTypeList = (types: { type: string, multi: number }[], label: string, titleColor: string) => {
                if (types.length === 0) return '';

                const badges = types.map(t => {
                    const typeColor = colors[t.type] || "#777";

                    // Converte 0.5 e 0.25 para frações bonitinhas
                    let multiStr = `x${t.multi}`;
                    if (t.multi === 0.5) multiStr = 'x½';
                    else if (t.multi === 0.25) multiStr = 'x¼';

                    return `<span style="background-color:${typeColor}; color:white; padding:2px 5px; border-radius:4px; font-size:0.6rem; text-shadow:1px 1px 1px rgba(0,0,0,0.5); margin-right:3px; display:inline-block; margin-bottom:2px; display: inline-flex; align-items: center; gap: 3px;">
                        ${t.type} <b style="background:rgba(0,0,0,0.3); padding:1px 3px; border-radius:3px; font-size: 0.55rem;">${multiStr}</b>
                    </span>`;
                }).join('');

                return `<div style="margin-top:4px; font-size:0.7rem; color:${titleColor};"><b>${label}:</b><br>${badges}</div>`;
            };
            // --------------------------------------------------------

            const d = document.createElement('div');
            d.className = 'dex-card';
            d.setAttribute('data-name', mon.name);

            const isDiscovered = dexEntry.seen > 0 || dexEntry.caught > 0;
            const imgFilter = isDiscovered ? '' : 'filter: brightness(0) opacity(0.4);';
            //const displayName = isDiscovered ? mon.name : '???';
            const displayName = mon.name;

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

    static filterPokedex() {
        const input = document.getElementById('pokedex-search') as HTMLInputElement;
        if (!input) return;

        const filter = input.value.toUpperCase();
        const cards = document.getElementsByClassName('dex-card');

        for (let i = 0; i < cards.length; i++) {
            const card = cards[i] as HTMLElement;
            const name = card.getAttribute('data-name');

            // Se encontrou o texto digitado em qualquer parte do nome
            if (name && name.toUpperCase().indexOf(filter) > -1) {
                card.style.display = ""; // Mostra
            } else {
                card.style.display = "none"; // Esconde
            }
        }
    }

    static useItemBoard(key: string, pId: number) { const p = this.players[pId]; const item = SHOP_ITEMS.find(i => i.id === key); if (!item || p.items[key] <= 0) return; if (item.type === 'heal') { if (item.id === 'ultrafullrestore') { this.applyBoardItemEffect(p, item, -1); return; } this.openHealSelector(pId, key); } else if (item.type === 'revive') { if (item.id === 'ultramaxrevive') { this.applyBoardItemEffect(p, item, -1); return; } this.openHealSelector(pId, key); } }
    static openHealSelector(pId: number, itemKey: string) { this.pendingHealItem = itemKey; const p = this.players[pId]; const modal = document.getElementById('pkmn-select-modal')!; const list = document.getElementById('pkmn-select-list')!; const title = document.getElementById('select-title')!; title.innerText = "Usar em qual Pokémon?"; list.innerHTML = ''; p.team.forEach((mon, idx) => { const div = document.createElement('div'); div.className = `mon-select-item`; div.innerHTML = `<img src="${mon.getSprite()}" width="40"><b>${mon.name}</b> <small>(${mon.currentHp}/${mon.maxHp})</small>`; div.onclick = () => { modal.style.display = 'none'; this.applyBoardItemEffect(p, SHOP_ITEMS.find(i => i.id === itemKey)!, idx); }; list.appendChild(div); }); const cancelBtn = document.createElement('button'); cancelBtn.className = "btn btn-secondary mt-15"; cancelBtn.innerText = "Cancelar"; cancelBtn.onclick = () => { modal.style.display = 'none'; this.pendingHealItem = null; }; list.appendChild(cancelBtn); modal.style.display = 'flex'; }
    static applyBoardItemEffect(p: Player, item: ItemData, targetIdx: number) { let used = false; if (item.type === 'heal') { if (item.id === 'ultrafullrestore') { let count = 0; p.team.forEach(m => { if (!m.isFainted() && m.currentHp < m.maxHp) { m.heal(9999); count++; } }); if (count > 0) { used = true; alert(`${count} Pokémon curados!`); } else alert("Ninguém precisa de cura!"); } else { const target = p.team[targetIdx]; if (target.isFainted()) return alert("Não funciona em Pokémon desmaiado!"); if (target.currentHp >= target.maxHp) return alert("HP já está cheio!"); target.heal(item.val || 20); alert(`Usou ${item.name} em ${target.name}.`); used = true; } } else if (item.type === 'revive') { if (item.id === 'ultramaxrevive') { let count = 0; p.team.forEach(m => { if (m.isFainted()) { m.revive(100); count++; } }); if (count > 0) { used = true; alert(`${count} Pokémon revividos!`); } else alert("Ninguém está desmaiado!"); } else { const target = p.team[targetIdx]; if (!target.isFainted()) return alert("Este Pokémon não está desmaiado!"); target.revive(item.val || 50); alert(`Usou ${item.name} em ${target.name}.`); used = true; } } if (used) { p.items[item.id]--; this.updateHUD(); this.openInventoryModal(p.id); this.saveGame(); if (Network.isOnline) { Network.sendAction('LOG', { msg: `${p.name} usou ${item.name}.` }); Network.syncPlayerState(); } } }

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

        if (Network.isOnline) Network.syncPlayerState();

        setTimeout(() => Battle.end(false), 500);
    }

    // ==========================================
    // UI: BANNER DO CAMPEÃO GLOBAL
    // ==========================================
    // ==========================================
    // UI: BANNER DO CAMPEÃO GLOBAL (FIXO NA BARRA LATERAL)
    // ==========================================
    static renderChampionBanner() {
        // Ignora a burocracia do TypeScript puxando o Game globalmente
        const GameObj = (window as any).Game || this;
        const champion = GameObj.globalChampion;

        // Agora ele procura a div exata que você colocou no HTML
        let banner = document.getElementById('champion-global-banner');
        if (!banner) return; // Segurança caso o HTML ainda não tenha atualizado

        // Se não existir campeão (primeira partida do servidor), esconde o banner
        if (!champion || !champion.team || champion.team.length === 0) {
            banner.style.display = 'none';
            return;
        }

        // NOVO ESTILO: Sem flutuação. Encaixado na barra lateral!
        banner.style.cssText = `
            background: linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(44,62,80,0.9) 100%);
            border: 2px solid #f1c40f;
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 15px; /* Espaço entre o banner e o botão debaixo */
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5), 0 0 8px rgba(241, 196, 15, 0.4);
            cursor: pointer;
            transition: transform 0.2s;
            width: 100%;
            box-sizing: border-box;
        `;

        // Efeito de hover e clique para ver o time
        banner.onmouseover = () => banner!.style.transform = 'scale(1.03)';
        banner.onmouseout = () => banner!.style.transform = 'scale(1)';
        banner.onclick = () => {
            if (champion && champion.team) {
                document.getElementById('champion-name-display')!.innerText = champion.name || 'Desconhecido';

                const listContainer = document.getElementById('champion-team-list')!;
                listContainer.innerHTML = '';

                champion.team.forEach((p: any, index: number) => {
                    const isShiny = p.isShiny;
                    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${isShiny ? 'shiny/' : ''}${p.id}.png`;

                    const colors: any = { "Normal": "#A8A77A", "Fogo": "#EE8130", "Água": "#6390F0", "Elétrico": "#F7D02C", "Grama": "#7AC74C", "Gelo": "#96D9D6", "Lutador": "#C22E28", "Veneno": "#A33EA1", "Terra": "#E2BF65", "Voador": "#A98FF3", "Psíquico": "#F95587", "Inseto": "#A6B91A", "Pedra": "#B6A136", "Fantasma": "#735797", "Dragão": "#6F35FC", "Noturno": "#705746", "Aço": "#B7B7CE", "Fada": "#D685AD" };
                    const bgColor = colors[p.type] || '#555';

                    const card = document.createElement('div');
                    card.style.cssText = `
                        background: linear-gradient(180deg, ${bgColor}44 0%, rgba(0,0,0,0.6) 100%);
                        border: 1px solid ${isShiny ? '#f1c40f' : bgColor};
                        border-radius: 8px;
                        padding: 8px;
                        text-align: center;
                        cursor: pointer;
                        transition: transform 0.2s;
                        width: 140px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.5);
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        position: relative;
                    `;

                    card.onmouseover = () => card.style.transform = 'scale(1.05)';
                    card.onmouseout = () => card.style.transform = 'scale(1)';
                    card.onclick = () => {
                        GameObj.openPokemonDetail(-1, index, champion);
                    };

                    let typesHtml = `<span style="background:${bgColor}; color:white; font-size:0.65rem; padding:2px 5px; border-radius:4px; border:1px solid rgba(255,255,255,0.3);">${p.type}</span>`;
                    if (p.secondType) {
                        const bg2 = colors[p.secondType] || '#555';
                        typesHtml += ` <span style="background:${bg2}; color:white; font-size:0.65rem; padding:2px 5px; border-radius:4px; border:1px solid rgba(255,255,255,0.3);">${p.secondType}</span>`;
                    }

                    const iconsHtml = [
                        p.megaStone ? '<span title="Mega Pedra Equipada" style="filter: drop-shadow(0 0 2px #3498db);">💎</span>' : '',
                        isShiny ? '<span title="Shiny" style="filter: drop-shadow(0 0 2px #f1c40f);">✨</span>' : ''
                    ].filter(Boolean).join(' ');

                    card.innerHTML = `
                        <div style="position:absolute; top:6px; left:6px; font-size: 0.65rem; color: #fff; background: rgba(0,0,0,0.6); padding:2px 5px; border-radius:4px; font-weight:bold;">Lv.${p.level}</div>
                        <div style="position:absolute; top:4px; right:6px; font-size: 0.85rem; display:flex; gap:4px;">${iconsHtml}</div>
                        
                        <img src="${spriteUrl}" style="width: 75px; height: 75px; object-fit: contain; margin-top: 15px; ${isShiny ? 'filter: drop-shadow(0 0 5px #f1c40f);' : ''}">
                        
                        <div style="font-size: 0.85rem; font-weight: bold; margin-top: 4px; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: white;">${p.name}</div>
                        <div style="margin-top:6px; margin-bottom: 8px; display:flex; gap:4px; justify-content:center;">${typesHtml}</div>
                        
                        <div style="width: 100%; background: rgba(0,0,0,0.5); border-radius: 6px; padding: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.7rem; color: #eee; box-sizing:border-box;">
                            <div style="display:flex; justify-content:space-between; align-items:center;"><span>❤️</span> <b>${p.maxHp}</b></div>
                            <div style="display:flex; justify-content:space-between; align-items:center;"><span>⚔️</span> <b>${p.atk}</b></div>
                            <div style="display:flex; justify-content:space-between; align-items:center;"><span>🛡️</span> <b>${p.def}</b></div>
                            <div style="display:flex; justify-content:space-between; align-items:center;"><span>💨</span> <b>${p.speed}</b></div>
                        </div>
                    `;

                    listContainer.appendChild(card);
                });

                document.getElementById('champion-team-modal')!.style.display = 'flex';
            }
        };

        // Monta o conteúdo interno com a foto do líder e o Pokémon principal
        const leadMon = champion.team[0];
        const avatarStr = champion.avatar || 'Red.jpg'; // Avatar genérico caso falhe
        const avatarSrc = avatarStr.includes('/') ? avatarStr : `/assets/img/Treinadores/${avatarStr}`;
        const leadSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${leadMon.isShiny ? 'shiny/' : ''}${leadMon.id}.png`;

        banner.innerHTML = `
            <div style="text-align: left; text-shadow: 1px 1px 2px black;">
                <div style="color: #f1c40f; font-weight: 900; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px;">Rei da Liga</div>
                <div style="font-size: 1.1rem; font-weight: bold; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${champion.name || 'Desconhecido'}</div>
            </div>
            <div style="position: relative; width: 50px; height: 50px; flex-shrink: 0;">
                <img src="${avatarSrc}" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid #ecf0f1; object-fit: cover;">
                <img src="${leadSprite}" style="position: absolute; bottom: -10px; left: -15px; width: 45px; filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.8));">
            </div>
        `;

        banner.style.display = 'flex';
    }

    static updateHUD() {
        const left = document.getElementById('hud-col-left')!;
        left.innerHTML = '';
        const right = document.getElementById('hud-col-right')!;
        right.innerHTML = '';

        const typeColors: any = { "Normal": "#A8A77A", "Fogo": "#EE8130", "Água": "#6390F0", "Elétrico": "#F7D02C", "Grama": "#7AC74C", "Gelo": "#96D9D6", "Lutador": "#C22E28", "Veneno": "#A33EA1", "Terra": "#E2BF65", "Voador": "#A98FF3", "Psíquico": "#F95587", "Inseto": "#A6B91A", "Pedra": "#B6A136", "Fantasma": "#735797", "Dragão": "#6F35FC", "Noturno": "#705746", "Aço": "#B7B7CE", "Fada": "#D685AD" };

        if (!this.players || this.players.length === 0) return;

        // --- CORREÇÃO DE INICIALIZAÇÃO ---
        // Garante que nenhum Mega bugado exista no time de nenhum jogador ao atualizar a tela
        this.players.forEach(p => {
            if (p.team) {
                p.team.forEach(mon => {
                    if (mon.validateAndFix) mon.validateAndFix();
                });
            }
        });
        // ---------------------------------

        // O 'i' aqui é o índice do jogador no array (0, 1, 2...)
        this.players.forEach((p, i) => {
            const d = document.createElement('div');
            d.className = `player-slot ${i === this.turn ? 'active' : ''}`;

            let badgeHTML = '<div class="badges-container">';
            for (let b = 0; b < 8; b++) {
                const isActive = p.badges[b];
                // --- TRADUTOR DE HUD ---
                const actualGymId = this.activeGyms ? this.activeGyms[b] : (b + 1);
                const gData = GYM_DATA.find(g => g.id === actualGymId);
                // -----------------------
                const imgUrl = gData ? `/assets/img/Insignias/${gData.badgeImg}` : '';
                const style = isActive ? `background-image: url('${imgUrl}'); background-size: 100% 100%; background-repeat: no-repeat; background-color: transparent;` : `background-color: #ccc;`;
                badgeHTML += `<div class="badge-slot ${isActive ? 'active' : ''}" style="${style}" title="Insígnia ${b + 1}"></div>`;
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
                            <div class="bar-fill ${(window as any).Battle.getHpColor(m.currentHp, m.maxHp)}" style="width:${(m.currentHp / m.maxHp) * 100}%"></div> 
                            <div class="bar-text">${m.currentHp}/${m.maxHp}</div> 
                        </div> 
                        
                        <div class="bar-container" title="XP">
                            <div class="bar-fill xp-bar" style="width:${(m.currentXp / m.maxXp) * 100}%"></div>
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
            if (p.effects.moonwalker && p.effects.moonwalker > 0) effectsHTML += `<span style="background:#f39c12; color:white; font-size:0.65rem; padding:1px 4px; border-radius:4px;" title="Moonwalker">💃 ${p.effects.moonwalker}</span>`;
            if (p.effects.lureType && p.effects.lureType.count > 0) {
                const lType = p.effects.lureType.type;
                const lColor = typeColors[lType] || '#777';
                effectsHTML += `<span style="background:${lColor}; color:white; font-size:0.65rem; padding:1px 4px; border-radius:4px; border:1px solid rgba(255,255,255,0.3); font-weight:bold;" title="Lure Type: ${lType}">🧲 ${lType} ${p.effects.lureType.count}</span>`;
            }
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
            if (i < Math.ceil(this.players.length / 2)) left.appendChild(d);
            else right.appendChild(d);
        });

        // Atualização dos indicadores globais
        const turnPlayer = this.players[this.turn];
        if (turnPlayer) document.getElementById('turn-indicator')!.innerText = turnPlayer.name;
        const elRound = document.getElementById('round-indicator'); if (elRound) elRound.innerText = this.round.toString();
        const elRoom = document.getElementById('room-code-indicator');

        // Renderiza o aviso do Clima atual abaixo do time inimigo
        let eventEl = document.getElementById('global-event-indicator');
        if (!eventEl) {
            // Busca a section de info, se não achar, gruda direto na coluna direita da HUD (Segurança)
            const infoSec = document.querySelector('.info-section') || document.getElementById('hud-col-right');
            if (infoSec) {
                eventEl = document.createElement('div');
                eventEl.id = 'global-event-indicator';
                // Adiciona no topo se for a coluna direita, ou no final se for info-section
                if (infoSec.id === 'hud-col-right') infoSec.insertBefore(eventEl, infoSec.firstChild);
                else infoSec.appendChild(eventEl);
            }
        }
        if (eventEl) {
            // --- BLINDAGEM VISUAL: Se a rodada atual passou do limite, extermina o evento! ---
            if (this.currentGlobalEvent && this.round >= this.eventEndRound) {
                this.currentGlobalEvent = null;
                this.eventEndRound = 0;

                if (Network && Network.isOnline && db) {
                    update(ref(db, `rooms/${Network.currentRoomId}`), { currentEventId: null, eventEndRound: 0 });
                }
            }
            // --------------------------------------------
            if (this.currentGlobalEvent) {
                // Calcula quantas rodadas faltam visualmente para o jogador não se perder
                const roundsLeft = this.eventEndRound - this.round;
                eventEl.innerHTML = `
                <div style="margin-top: 10px; padding: 5px; background: rgba(231, 76, 60, 0.15); border: 1px dashed #e74c3c; border-radius: 4px; color: #fff; font-size: 0.8rem; text-align: center; animation: pulseShiny 2s infinite alternate; cursor: pointer;" onclick="window.Game.showEventDetails()">
                    <b style="color: #f1c40f;">${this.currentGlobalEvent.icon} ${this.currentGlobalEvent.name}</b><br>
                    <span style="font-size: 0.65rem; color: #bdc3c7;">Faltam ${roundsLeft} rodada(s)</span>
                </div>`;
            } else {
                eventEl.innerHTML = '';
            }
        }

        if (elRoom) { const Network = (window as any).Network; elRoom.innerText = Network.isOnline ? Network.currentRoomId : "LOCAL"; }
        const avgLvl = this.getGlobalAverageLevel();
        const elAvg = document.getElementById('avg-lvl-indicator'); if (elAvg) elAvg.innerText = `Lv.${avgLvl}`;
        const elGym = document.getElementById('gym-lvl-indicator'); if (elGym) elGym.innerText = `Lv.${avgLvl + 1}`;
        let totalMons = 0; this.players.forEach(p => totalMons += p.team.length);
        const avgTeam = Math.max(1, Math.min(6, Math.round(totalMons / Math.max(1, this.players.length))));
        const elTeam = document.getElementById('npc-team-indicator'); if (elTeam) elTeam.innerText = avgTeam.toString();

        // --- EXIBIR PAINEL DE ADMIN SOMENTE PARA HOST ---
        const btnAdmin = document.getElementById('btn-admin-panel');
        if (btnAdmin) {
            const NetworkData = (window as any).Network;
            if (!NetworkData || !NetworkData.isOnline || NetworkData.isHost) {
                btnAdmin.style.display = 'block';
            } else {
                btnAdmin.style.display = 'none';
            }
        }
    }

    static showEventDetails() {
        if (!this.currentGlobalEvent) return;
        let modal = document.getElementById('event-details-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'event-details-modal';
            modal.className = 'modal-overlay';
            modal.style.zIndex = '9999';
            document.body.appendChild(modal);
        }
        modal.innerHTML = `
            <div class="modal-box" style="text-align: center;">
                <h3 style="color:#f1c40f;">${this.currentGlobalEvent.icon} ${this.currentGlobalEvent.name}</h3>
                <p style="font-size: 1.1rem; line-height: 1.5; margin: 20px 0; color: #fff; text-shadow: 1px 1px 2px #000;">${this.currentGlobalEvent.desc}</p>
                <button class="btn btn-secondary mt-15" onclick="document.getElementById('event-details-modal').style.display='none'">Fechar</button>
            </div>
        `;
        modal.style.display = 'flex';
    }

    static renderBoard() {
        const area = document.getElementById('board-area')!;
        area.innerHTML = '';
        area.style.gridTemplateColumns = `repeat(${MapSystem.size}, 1fr)`;
        area.style.gridTemplateRows = `repeat(${MapSystem.size}, 1fr)`;

        for (let y = 0; y < MapSystem.size; y++) {
            for (let x = 0; x < MapSystem.size; x++) {
                const d = document.createElement('div');
                let c = 'path';
                let tooltip = ""; // Variável para a nossa dica de tela
                const t = MapSystem.grid[y][x];

                // --- NOVA LÓGICA DE TOOLTIPS ---
                if (t === TILE.GRASS) {
                    c = 'grass';
                    tooltip = "Terreno: Grama\nTipos: Grama, Inseto, Normal, Veneno, Voador, Noturno";
                }
                else if (t === TILE.WATER) {
                    c = 'water';
                    tooltip = "Terreno: Água\nTipos: Água, Gelo, Dragão, Fada";
                }
                else if (t === TILE.GROUND) {
                    c = 'ground';
                    tooltip = "Terreno: Terra/Pedra\nTipos: Terra, Pedra, Fogo, Lutador, Elétrico, Psíquico, Fantasma, Aço";
                }
                // -------------------------------
                else if (t === TILE.CITY) c = 'city';
                else if (t === TILE.GYM) c = 'gym';
                else if (t === TILE.EVENT) c = 'event';

                // --- NOVA LÓGICA DINÂMICA PARA TODOS OS NPCs DO MAPA ---
                else if (NPC_DATA[t]) {
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
                if (MapSystem.size >= 30) d.style.fontSize = '8px';

                // Aplica o tooltip genérico do terreno (se existir)
                if (tooltip) d.title = tooltip;

                if (t === TILE.GYM) {
                    const gid = MapSystem.gymLocations[`${x},${y}`];
                    if (gid) {
                        // --- TRADUTOR DE TABULEIRO ---
                        const actualGymId = this.activeGyms ? this.activeGyms[gid - 1] : gid;
                        const gData = GYM_DATA.find(g => g.id === actualGymId);
                        // -----------------------------
                        if (gData) {
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
        // --- SINCRONIZADOR INVISÍVEL DE RODADA ---
        if (m.includes('||ROUND:')) {
            const r = parseInt(m.split('||ROUND:')[1]);
            if (r > this.round) {
                this.round = r;
                this.updateHUD();
                this.checkTurnControl(); // A mágica: Re-checa o bônus com a rodada certa!
            }
            return; // Esconde do chat
        }
        // -----------------------------------------

        // --- SISTEMA DE LOG PRIVADO ---
        if (m.includes('||PRIVATE:')) {
            const parts = m.split('||PRIVATE:');
            const cleanMsg = parts[0];
            const targetId = parseInt(parts[1], 10);

            const Network = (window as any).Network;
            if (Network && Network.isOnline && Network.myPlayerId !== targetId) return;

            m = cleanMsg;
        }
        // ------------------------------

        // --- NOVO: EVENTO GLOBAL SILENCIOSO ---
        if (m.includes('||EVENT:')) {
            const parts = m.split('||EVENT:');
            m = parts[0]; // Limpa a tag secreta para exibir bonito no chat
            const eventId = parts[1];

            this.currentGlobalEvent = GLOBAL_EVENTS.find(e => e.id === eventId);
            this.eventEndRound = this.round + 5; // Eventos duram 5 rodadas
            this.updateHUD(); // Força a caixinha do clima atualizar na mesma hora pra todos!
        }
        // --------------------------------------


        // --- ADD PREFIXO DO JOGADOR E RODADA ---
        const currentPlayer = this.getCurrentPlayer();
        if (!m.includes("🌍 ALERTA GLOBAL!") && !m.includes("🛠️ ADMIN HOST:")) {
            if (currentPlayer && !m.startsWith(`[${currentPlayer.name}]`) && !m.includes(`] [${currentPlayer.name}]`)) {
                m = `[${currentPlayer.name}] ${m}`;
            }
            // Verifica se a mensagem já não tem uma tag de rodada no início (ex: [15])
            if (!/^\[\d+\]/.test(m)) {
                m = `[${this.round}] ${m}`;
            }
        }
        // ------------------------------

        let logType = "system";
        const mLower = m.toLowerCase();

        if (m.includes("[Batalha]") || mLower.includes("batalha") || mLower.includes("dano") || mLower.includes("desmaiou") || mLower.includes("capturou") || mLower.includes("selvagem") || mLower.includes("fugiu")) {
            logType = "battle";
        } else if (mLower.includes("carta") || m.includes("🃏") || m.includes("||CARD:")) {
            logType = "cards";
        } else if (m.includes("💰") || mLower.includes("gold") || mLower.includes("moedas") || mLower.includes("pagou") || mLower.includes("comprou")) {
            logType = "gold";
        } else if (mLower.includes("usou") && !mLower.includes("atacou") || m.includes("🎒") || mLower.includes("curou") || mLower.includes("poção") || mLower.includes("reviveu")) {
            logType = "items";
        }

        let customStyle = "";

        if (m.includes("Fim do turno de")) {
            customStyle = "text-align: center; color: #f39c12; font-weight: bold; margin: 15px 0 5px 0; border-bottom: 2px dashed #7f8c8d; padding-bottom: 5px;";
        }

        if (m.includes("🕵️ ALERTA:")) {
            customStyle += "color: #e74c3c; font-weight: bold; background: rgba(231, 76, 60, 0.1); border-left: 3px solid #e74c3c; padding-left: 5px;";
        }

        // Destaque visual lindo para o Evento Global no Log
        if (m.includes("🌍 ALERTA GLOBAL!")) {
            customStyle += "color: #f1c40f; font-weight: bold; background: rgba(241, 196, 15, 0.1); border-left: 3px solid #f1c40f; padding-left: 5px;";
        }

        const container = document.getElementById('log-container');
        if (container) {
            m = m.replace(/\n/g, '<br>'); // Troca quebra de linha de código para HTML

            this.globalLogs.unshift({ text: m, style: customStyle, type: logType });
            if (this.globalLogs.length > 50) this.globalLogs.pop();

            const Network = (window as any).Network;
            if (Network && Network.isOnline && typeof Network.syncLogs === 'function') {
                Network.syncLogs(this.globalLogs);
            }

            const currentFilter = (this as any).currentLogFilter || 'all';
            const searchInput = document.getElementById('log-search-input') as HTMLInputElement;
            const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";
            const matchesSearch = searchText === "" || m.toLowerCase().includes(searchText);
            
            const displayStyle = (currentFilter === 'all' || currentFilter === logType) && matchesSearch ? "block" : "none";

            container.insertAdjacentHTML('afterbegin', `<div class="log-entry" style="${customStyle}; display:${displayStyle}" data-type="${logType}">${m}</div>`);
            container.scrollTop = 0;
        }
    }

    static filterLogs(type: string) {
        (this as any).currentLogFilter = type;

        const container = document.getElementById('log-container');
        const searchInput = document.getElementById('log-search-input') as HTMLInputElement;
        const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";

        if (container) {
            const entries = container.querySelectorAll('.log-entry');
            entries.forEach(el => {
                const logContent = el.textContent?.toLowerCase() || "";
                const matchesType = type === 'all' || el.getAttribute('data-type') === type;
                const matchesSearch = searchText === "" || logContent.includes(searchText);

                (el as HTMLElement).style.display = (matchesType && matchesSearch) ? 'block' : 'none';
            });
        }
    }

    // ==========================================
    // PAINEL ADMINISTRATIVO / SUPORTE HOST
    // ==========================================
    static openAdminPanel() {
        const modal = document.getElementById('admin-modal');
        const pSelect = document.getElementById('admin-player-select') as HTMLSelectElement;
        const tSelect = document.getElementById('admin-turn-select') as HTMLSelectElement;
        const rInput = document.getElementById('admin-round-val') as HTMLInputElement;

        if (!modal || !pSelect || !tSelect || !rInput) return;

        pSelect.innerHTML = '';
        tSelect.innerHTML = '';

        this.players.forEach((p, idx) => {
            const opt = document.createElement('option');
            opt.value = idx.toString();
            opt.innerText = `[${idx}] ${p.name}`;
            pSelect.appendChild(opt);

            const optT = document.createElement('option');
            optT.value = idx.toString();
            optT.innerText = `[${idx}] ${p.name}`;
            tSelect.appendChild(optT);
        });

        rInput.value = this.round.toString();
        tSelect.value = this.turn.toString();

        modal.style.display = 'flex';
    }

    static adminGiveCard() {
        const select = document.getElementById('admin-player-select') as HTMLSelectElement;
        if (!select) return;
        const pIdx = parseInt(select.value, 10);
        const p = this.players[pIdx];
        if (!p) return;

        const Cards = (window as any).Cards;
        if (Cards) {
            Cards.draw(p, true);
            this.sendGlobalLog(`🛠️ ADMIN HOST: Concedeu 1 Carta Aleatória para ${p.name}!`);
            const Network = (window as any).Network;
            if (Network && Network.isOnline) {
                Network.syncSpecificPlayer(p.id);
            }
            this.updateHUD();
        }
    }

    static adminClearDebuffs() {
        const select = document.getElementById('admin-player-select') as HTMLSelectElement;
        if (!select) return;
        const pIdx = parseInt(select.value, 10);
        const p = this.players[pIdx];
        if (!p) return;

        p.effects = {};
        p.skipTurns = 0;
        p.isProcessingSkip = false;

        this.sendGlobalLog(`🛠️ ADMIN HOST: Os efeitos de status negativos do jogador ${p.name} foram purificados!`);
        const Network = (window as any).Network;
        if (Network && Network.isOnline) {
            Network.syncSpecificPlayer(p.id);
        }
        this.updateHUD();
    }

    static adminSetSkipTurns() {
        const select = document.getElementById('admin-player-select') as HTMLSelectElement;
        const valInput = document.getElementById('admin-skip-val') as HTMLInputElement;
        if (!select || !valInput) return;
        const pIdx = parseInt(select.value, 10);
        const val = parseInt(valInput.value, 10);
        const p = this.players[pIdx];
        if (!p || isNaN(val) || val < 0) return;

        p.skipTurns = val;
        p.isProcessingSkip = false;

        this.sendGlobalLog(`🛠️ ADMIN HOST: Ajustou os turnos a perder de ${p.name} para ${val}!`);
        const Network = (window as any).Network;
        if (Network && Network.isOnline) {
            Network.syncSpecificPlayer(p.id);
        }
        this.updateHUD();
    }

    static adminGiveGold() {
        const select = document.getElementById('admin-player-select') as HTMLSelectElement;
        const valInput = document.getElementById('admin-gold-val') as HTMLInputElement;
        if (!select || !valInput) return;
        const pIdx = parseInt(select.value, 10);
        const val = parseInt(valInput.value, 10);
        const p = this.players[pIdx];
        if (!p || isNaN(val)) return;

        p.gold = Math.max(0, p.gold + val);

        this.sendGlobalLog(`🛠️ ADMIN HOST: Concedeu ${val} Moedas para ${p.name}!`);
        const Network = (window as any).Network;
        if (Network && Network.isOnline) {
            Network.syncSpecificPlayer(p.id);
        }
        this.updateHUD();
    }

    static adminSetRound() {
        const valInput = document.getElementById('admin-round-val') as HTMLInputElement;
        if (!valInput) return;
        const val = parseInt(valInput.value, 10);
        if (isNaN(val) || val < 1) return;

        this.round = val;
        this.sendGlobalLog(`🛠️ ADMIN HOST: A rodada principal foi alterada à força para a Rodada ${val}!`);

        const Network = (window as any).Network;
        if (Network && Network.isOnline) {
            Network.syncTurn(this.turn, this.round);
        }

        this.updateHUD();
        this.checkTurnControl();
    }

    static adminSetTurn() {
        const select = document.getElementById('admin-turn-select') as HTMLSelectElement;
        if (!select) return;
        const tIdx = parseInt(select.value, 10);
        const p = this.players[tIdx];
        if (!p) return;

        this.turn = tIdx;
        this.hasRolled = false;

        this.sendGlobalLog(`🛠️ ADMIN HOST: A vez do jogador foi forçada e passada para ${p.name}!`);

        const Network = (window as any).Network;
        if (Network && Network.isOnline) {
            Network.syncTurn(this.turn, this.round);
        }

        this.updateHUD();
        this.checkTurnControl();
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
        if (Network.isOnline) {
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

        // --- NOVA LÓGICA DO MARCADOR DE CARTA ---
        let displayMsg = msg;
        if (msg.includes('||CARD:')) {
            const parts = msg.split('||CARD:');
            displayMsg = parts[0]; // Pega só o texto limpo
            this.pendingCardAnimation = { id: parts[1], player: playerName }; // Salva a carta
        }
        else if (msg.includes('||LEGENDARY:')) {
            const parts = msg.split('||LEGENDARY:');
            displayMsg = parts[0];
            let monName = parts[1];
            let isMyEncounter = false;

            if (monName.includes('||MY_ENCOUNTER')) {
                monName = monName.split('||MY_ENCOUNTER')[0];
                isMyEncounter = true;
            }

            this.pendingLegendaryAlert = { monName: monName, player: playerName, isMyEncounter: isMyEncounter };
        } else {
            this.pendingCardAnimation = null;
            this.pendingLegendaryAlert = null;
        }
        // ----------------------------------------

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

        //document.getElementById('cga-msg')!.innerText = msg;
        document.getElementById('cga-msg')!.innerText = displayMsg;
        const controls = document.getElementById('cga-controls')!;

        if (isMyTurn) {
            controls.innerHTML = `<button class="btn" style="background-color:#ef233c; padding:10px 30px; font-size:1.1rem; margin:0;" onclick="window.Game.confirmGlobalAlert()">OK</button>`;
        } else {
            controls.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                    <span style="color:#8d99ae; font-style:italic; font-size:1rem;">⏳ Aguardando ${playerName} confirmar...</span>
                    <button class="btn" style="background:transparent; border:1px solid #7f8c8d; color:#7f8c8d; font-size:0.8rem; padding:5px 15px; margin:0;" onclick="window.Game.closeGlobalAlert()">❌ Fechar Aviso</button>
                </div>
            `;
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

        // --- GATILHO DA ANIMAÇÃO CINEMÁTICA ---
        if (this.pendingCardAnimation) {
            this.playCardCinematic(this.pendingCardAnimation.id, this.pendingCardAnimation.player);
            this.pendingCardAnimation = null; // Limpa para não repetir
        } else if (this.pendingLegendaryAlert) {
            this.playLegendaryCinematic(this.pendingLegendaryAlert.player, this.pendingLegendaryAlert.monName, this.pendingLegendaryAlert.isMyEncounter);
            this.pendingLegendaryAlert = null;
        }
    }

    // --- NOVA ANIMAÇÃO GIGANTE DE LENDÁRIO ---
    static playLegendaryCinematic(playerName: string, monName: string, isMyEncounter: boolean) {
        let modal = document.getElementById('legendary-cinematic');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'legendary-cinematic';
            modal.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.92); display:flex; justify-content:center; align-items:center; flex-direction:column; z-index:99999; opacity:0; transition: opacity 0.5s ease; cursor: pointer;";
            modal.innerHTML = `
                <h2 style="color:#e74c3c; font-size: 3rem; text-shadow: 0 0 20px #c0392b, 2px 2px 4px #000; margin-bottom: 20px; font-weight: bold; text-align: center; text-transform: uppercase; letter-spacing: 5px;">ENCONTRO LENDÁRIO!</h2>
                <div style="font-size: 1.5rem; color: #f1c40f; margin-bottom: 30px; text-shadow: 1px 1px 2px #000;" id="leg-cine-subtitle"></div>
                <img id="leg-cine-img" src="" style="height: 45vh; max-height: 500px; filter: drop-shadow(0 0 30px rgba(255,255,255,0.8)); transform: scale(0.5); transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                <div id="leg-cine-name" style="color: #fff; font-size: 2.5rem; margin-top: 30px; font-weight: bold; text-shadow: 2px 2px 4px #000;"></div>
                <div style="color: #bdc3c7; margin-top: 30px; font-size: 1rem; opacity: 0.7;">(Clique para continuar)</div>
            `;
            document.body.appendChild(modal);
        }

        document.getElementById('leg-cine-subtitle')!.innerText = `${playerName} encontrou um Pokémon mítico!`;
        document.getElementById('leg-cine-name')!.innerText = monName;

        document.getElementById('leg-cine-img')!.setAttribute('src', `/assets/gif/lendarios/${monName}.gif`);

        modal.style.display = 'flex';

        setTimeout(() => {
            modal!.style.opacity = '1';
            document.getElementById('leg-cine-img')!.style.transform = 'scale(1.3)';
        }, 50);

        const closeAndBattle = () => {
            modal!.style.opacity = '0';
            document.getElementById('leg-cine-img')!.style.transform = 'scale(0.5)';
            setTimeout(() => {
                modal!.style.display = 'none';

                // Apenas se for o SEU encontro, a batalha é armada para você usando o Pokémon da memória
                if (isMyEncounter && this.pendingLegendaryEncounter) {
                    const player = this.players.find(p => p.name === playerName);
                    if (player) {
                        Battle.setup(player, this.pendingLegendaryEncounter.mon, false, "Selvagem", 0, null, false, 0, "", this.pendingLegendaryEncounter.type);
                    }
                    this.pendingLegendaryEncounter = null;
                }
            }, 500);
        };

        modal.onclick = closeAndBattle;

        setTimeout(() => {
            if (modal!.style.display !== 'none') {
                closeAndBattle();
            }
        }, 4000);
    }

    // --- NOVA ANIMAÇÃO GIGANTE NA TELA ---
    static playCardCinematic(cardId: string, playerName: string) {
        let modal = document.getElementById('card-cinematic');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'card-cinematic';
            modal.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); display:flex; justify-content:center; align-items:center; flex-direction:column; z-index:99999; opacity:0; transition: opacity 0.3s ease; cursor: pointer;";
            modal.innerHTML = `
                <h2 id="card-cine-title" style="color:#f1c40f; font-size: 2.5rem; text-shadow: 2px 2px 4px #000; margin-bottom: 20px; font-weight: bold; text-align: center;"></h2>
                <img id="card-cine-img" src="" style="height: 65vh; max-height: 800px; border-radius: 12px; box-shadow: 0 0 40px rgba(241, 196, 15, 0.6); transform: scale(0.5); transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                <div style="color: #bdc3c7; margin-top: 20px; font-size: 1rem; opacity: 0.7;">(Clique em qualquer lugar para fechar)</div>
            `;
            document.body.appendChild(modal);

            // Permite pular a animação clicando
            modal.onclick = () => {
                modal!.style.opacity = '0';
                document.getElementById('card-cine-img')!.style.transform = 'scale(0.5)';
                setTimeout(() => { modal!.style.display = 'none'; }, 300);
            };
        }

        document.getElementById('card-cine-title')!.innerHTML = `🃏 <span style="color:#fff">${playerName}</span> usou:`;
        document.getElementById('card-cine-img')!.setAttribute('src', `/assets/img/Cartas/${cardId}.jpg`);

        modal.style.display = 'flex';

        // Animação de Entrada (Zoom In)
        setTimeout(() => {
            modal!.style.opacity = '1';
            document.getElementById('card-cine-img')!.style.transform = 'scale(1)';
        }, 50);

        // Auto Fechar após 3 segundos
        setTimeout(() => {
            if (modal!.style.display !== 'none') {
                modal!.style.opacity = '0';
                document.getElementById('card-cine-img')!.style.transform = 'scale(0.5)';
                setTimeout(() => { modal!.style.display = 'none'; }, 300);
            }
        }, 3000);
    }
}