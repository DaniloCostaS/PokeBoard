import { POKEDEX } from '../constants/pokedex';
import type { Player } from './Player';
import { MAPA_MEGAS } from '../constants/mapaMegas';

export class Pokemon {
    id: number; name: string; type: string; secondType: string; 
    maxHp: number; currentHp: number; atk: number; def: number; speed: number;
    level: number; currentXp: number; maxXp: number;
    isShiny: boolean; isLegendary: boolean; wins: number; 
    evoData: any; 
    leveledUpThisTurn: boolean = false;
    stage: number; // Nova propriedade para controlar o estágio
    baseTotal: number;
    isGymLeaderMon: boolean = false;
    megaStone: boolean = false;
    isMegaEvolution: boolean = false;

    ivs: { hp: number, atk: number, def: number, spd: number };
    baseStats: { hp: number, atk: number, def: number, spd: number };
    bonusStats: { hp: number, atk: number, def: number, spd: number };

    constructor(templateId: number, targetLevel: number = 1, forceShiny: boolean | null = null, isGymLeaderMon: boolean = false) {
        let template = POKEDEX.find(p => p.id === templateId) || POKEDEX[0];
        
        while (template.nextForm && template.evoTrigger && targetLevel >= template.evoTrigger) {
            const next = POKEDEX.find(p => p.name === template.nextForm);
            if (next) template = next;
            else break;
        }

        this.id = template.id; 
        this.name = template.name; 
        this.type = template.type; 
        this.secondType = template.secondType || ""; 
        this.isLegendary = !!template.isLegendary;
        this.stage = template.stage; 
        this.baseTotal = template.BaseTotal || (template.hp + template.atk + template.def + template.spd);
        this.isGymLeaderMon = isGymLeaderMon;
        this.megaStone = false;

        // --- NOVA LÓGICA DO LURE SHINY ---
        let shinyRate = 0.03; // Chance Padrão (3%)
        try {
            const Game = (window as any).Game;
            // Verifica se existe um jogo rodando e pega o jogador do turno atual
            if (Game && Game.players && Game.players.length > 0) {
                const currentPlayer = Game.players[Game.turn];
                // Se o jogador da vez tiver o Lure Shiny ativo, sobe a chance para 15%
                if (currentPlayer && currentPlayer.effects && currentPlayer.effects.lureShiny > 0) {
                    shinyRate = 0.15; 
                }
            }
        } catch(e) {}

        if (forceShiny !== null) {
            this.isShiny = forceShiny;
        } else {
            this.isShiny = Math.random() < shinyRate;
        }
        // ---------------------------------

        this.level = Math.min(targetLevel, 25); 
        this.currentXp = 0; 
        this.wins = 0;
        this.evoData = { next: template.nextForm || "", trigger: template.evoTrigger || 999 };
        this.baseStats = { hp: template.hp, atk: template.atk, def: template.def, spd: template.spd };

        // --- REGRA DE IVs: 20 para Lideres, 0 a 10 para Players ---
        if (this.isGymLeaderMon) {
            this.ivs = { hp: 20, atk: 20, def: 20, spd: 20 };
        } else {
            this.ivs = {
                hp: Math.floor(Math.random() * 11), // 0 a 10
                atk: Math.floor(Math.random() * 11),
                def: Math.floor(Math.random() * 11),
                spd: Math.floor(Math.random() * 11)
            };
        }

        // --- DISTRIBUIÇÃO INICIAL DE STATUS POR LEVEL ---
        this.bonusStats = { hp: 0, atk: 0, def: 0, spd: 0 };
        const levelsToSimulate = targetLevel - 1;
        if (levelsToSimulate > 0) {
            for (let i = 0; i < levelsToSimulate; i++) {
                this.distributeLevelUpStats();
            }
        }

        this.maxHp = 0; this.currentHp = 0; this.atk = 0; this.def = 0; this.speed = 0;
        this.maxXp = this.calculateMaxXp();
        this.recalculateStats(true);
    }

    // Nova lógica de cálculo de XP baseada na planilha
    calculateMaxXp(): number {
        let multiplier = 8; // Padrão Stage 1

        /* if (this.isShiny) {
            multiplier = 50;
        } else /*/
        if (this.isLegendary) {
            multiplier = 15;
        } else {
            // Lógica de Estágios
            if (this.stage === 1) {
                if (!this.evoData.next) 
                    multiplier = 12;
                else 
                    multiplier = 8;
            } 
            else if (this.stage === 2) {
                if (!this.evoData.next) 
                    multiplier = 12;
                else 
                    multiplier = 10;
            } 
            else if (this.stage === 3) {
                multiplier = 12;
            }
        }
        
        return this.level * multiplier;
    }

    // --- NOVA FUNÇÃO: Sorteia 15 pontos e devolve o que foi ganho ---
    distributeLevelUpStats() {
        const gains = { hp: 0, atk: 0, def: 0, spd: 0 }; // Guarda o que ganhou NESSE level

        if (this.isGymLeaderMon) {
            this.bonusStats.hp += 5; gains.hp += 5;
            this.bonusStats.atk += 5; gains.atk += 5;
            this.bonusStats.def += 5; gains.def += 5;
            this.bonusStats.spd += 5; gains.spd += 5;
        } else {
            let points = 15;
            const stats: (keyof typeof this.bonusStats)[] = ['hp', 'atk', 'def', 'spd'];
            while (points > 0) {
                const randomStat = stats[Math.floor(Math.random() * stats.length)];
                this.bonusStats[randomStat] += 1;
                gains[randomStat] += 1;
                points--;
            }
        }
        return gains;
    }

    // --- MÉTODO DE SEGURANÇA: CORRIGE MEGAS PRESAS ---
    validateAndFix() {
        // Se for um ID de Mega Evolução (geralmente > 10000 no seu mapa)
        if (this.id > 10000 && !(this as any).isTemp) {
            // Procura qual ID normal vira essa Mega (Engenharia Reversa)
            const originalIdStr = Object.keys(MAPA_MEGAS).find(key => MAPA_MEGAS[parseInt(key)] === this.id);
            
            if (originalIdStr) {
                const originalId = parseInt(originalIdStr);
                console.warn(`🚑 CORREÇÃO: Revertendo ${this.name} (Mega presa) para ID ${originalId}`);
                
                // Restaura ID e Dados Básicos
                this.id = originalId;
                const template = POKEDEX.find(p => p.id === this.id);
                if (template) {
                    this.name = template.name;
                    this.baseStats = { hp: template.hp, atk: template.atk, def: template.def, spd: template.spd };
                }
                
                // Limpa flags de Mega
                this.megaStone = true; // Devolve a pedra pro Pokémon (já que ele perdeu a transformação)
                this.isMegaEvolution = false;
                (this as any).isTemp = false;
                
                // Recalcula status limpos
                this.recalculateStats(false);
            }
        }
    }

    recalculateStats(resetHp: boolean = false) {
        // --- NOVOS MULTIPLICADORES DE FORÇA ---
        const shinyBonus = this.isShiny ? 1.20 : 1.0;       // Shiny é 20% mais forte
        const legendaryBonus = this.isLegendary ? 1.10 : 1.0; // Lendário é 10% mais forte
        const megaBonus = this.isMegaEvolution ? 1.20 : 1.0; // Mega é 20% mais forte
        
        // Se por um milagre o jogador achar um Lendário Shiny, os bônus se acumulam!
        const totalMultiplier = shinyBonus * legendaryBonus * megaBonus;
        
        // A fórmula agora aplica o multiplicador total nos status
        const calc = (base: number, iv: number, bonus: number) => Math.floor((base + iv + bonus) * totalMultiplier);
        // --------------------------------------

        const oldMaxHp = this.maxHp;

        this.maxHp = calc(this.baseStats.hp, this.ivs.hp, this.bonusStats.hp); 
        this.maxHp = Math.max(1, this.maxHp);
        
        this.atk = calc(this.baseStats.atk, this.ivs.atk, this.bonusStats.atk);
        this.def = calc(this.baseStats.def, this.ivs.def, this.bonusStats.def);
        this.speed = calc(this.baseStats.spd, this.ivs.spd, this.bonusStats.spd);

        if (resetHp) {
            this.currentHp = this.maxHp;
        } else {
            const diff = this.maxHp - oldMaxHp;
            this.currentHp = Math.min(this.maxHp, Math.max(0, this.currentHp + diff));
        }
    }

    getSprite() { return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${this.isShiny ? 'shiny/' : ''}${this.id}.png`; }
    
    isFainted() { return this.currentHp <= 0; }
    
    heal(amt: number) { 
        if (this.isFainted()) return; 
        this.currentHp = Math.min(this.maxHp, this.currentHp + amt); 
    }

    revive(percentage: number) {
        if (!this.isFainted()) return; 
        const healAmount = Math.floor(this.maxHp * (percentage / 100));
        this.currentHp = Math.max(1, healAmount); 
    }
    
    gainXp(amount: number, player: Player) { 
        if(this.level >= 25) return; 

        let finalAmount = amount;
        let usedEffect = false;
        const Game = (window as any).Game;

        if (player && player.effects) {
            // Verifica o Double XP
            if ((player.effects.doubleXp && player.effects.doubleXp > 0) || Game.currentGlobalEvent?.id === 'EXP_BURST') {
                finalAmount *= 2;
                usedEffect = true;
            }

            // Verifica o Exp Share
            if (player.effects.expShare && player.effects.expShare > 0) {
                // player.effects.expShare--; <--- REMOVIDO! (Desconta por turno no Game.ts)
                usedEffect = true;
                // Mensagem de fim de efeito removida daqui também!
                
                const aliveTeam = player.team.filter(p => !p.isFainted());
                
                // --- CORREÇÃO: Removemos o splitAmount. Agora usa o valor total ---
                Game.sendGlobalLog(`🤩 Exp Share ativado! Todos os vivos do time de ${player.name} receberam ${finalAmount} XP integralmente!`);
                
                // Distribui o valor INTEGRAL (finalAmount) para a equipe
                aliveTeam.forEach(mon => mon._applyXp(finalAmount, player));
                
                if (usedEffect && (window as any).Network && (window as any).Network.isOnline) {
                    (window as any).Network.syncPlayerState();
                }
                return; 
            }
        }

        // Se não usou Exp Share, ganha sozinho normalmente
        this._applyXp(finalAmount, player);
        
        // Salva a queima dos contadores no Firebase
        if (usedEffect && (window as any).Network && (window as any).Network.isOnline) {
            (window as any).Network.syncPlayerState();
        }
    }

    _applyXp(amount: number, player: Player) {
        (window as any).Game.sendGlobalLog(`💹 ${this.name} ganhou ${amount} XP!`);
        this.currentXp += amount; 
        
        while(this.currentXp >= this.maxXp && this.level < 25) { 
            this.currentXp -= this.maxXp; 
            this.levelUp(player); 
        } 
    }

    levelUp(player: Player | null) { 
        if (this.level >= 25) return;
        this.level++; 
        
        // Recebe os ganhos exatos deste level (15 pontos aleatórios)
        const gains = this.distributeLevelUpStats(); 
        
        const Game = (window as any).Game;
        // --- EVENTO: POKÉRUS OUTBREAK (+5 em todos os status extras) ---
        if (Game && Game.currentGlobalEvent?.id === 'POKERUS_OUTBREAK') {
            this.bonusStats.hp += 5;
            this.bonusStats.atk += 5;
            this.bonusStats.def += 5;
            this.bonusStats.spd += 5;
            
            // Incrementa os ganhos para o log refletir o bônus do Pokérus
            gains.hp += 5;
            gains.atk += 5;
            gains.def += 5;
            gains.spd += 5;
        }

        this.maxXp = this.calculateMaxXp();
        this.recalculateStats(false);
        
        if(player && Game) {
             // Log detalhado com os status sorteados!
             Game.sendGlobalLog(`🎉 ${this.name} subiu para o Nível ${this.level}! (+${gains.hp} HP | +${gains.atk} ATK | +${gains.def} DEF | +${gains.spd} SPD)`); 
        }
        this.checkEvolution(player); 
    }

    forceLevel(targetLevel: number) { 
        targetLevel = Math.min(targetLevel, 25);
        const diff = targetLevel - this.level;
        if (diff > 0) {
            for (let i = 0; i < diff; i++) {
                this.distributeLevelUpStats(); // <- Simula os níveis pulados
            }
        }
        this.level = targetLevel;
        this.maxXp = this.calculateMaxXp(); 
        let evolved = false;
        do {
            evolved = this.checkEvolution(null, true); 
        } while (evolved);
        this.recalculateStats(true); 
    }

    getTypeBadgesHTML(align: string = 'center') {
        const colors: any = { 
            "Normal": "#A8A77A", 
            "Fogo": "#EE8130", 
            "Água": "#6390F0", 
            "Elétrico": "#F7D02C", 
            "Grama": "#7AC74C", 
            "Gelo": "#96D9D6", 
            "Lutador": "#C22E28", 
            "Veneno": "#A33EA1", 
            "Terra": "#E2BF65", 
            "Voador": "#A98FF3", 
            "Psíquico": "#F95587", 
            "Inseto": "#A6B91A", 
            "Pedra": "#B6A136", 
            "Fantasma": "#735797", 
            "Dragão": "#6F35FC", 
            "Noturno": "#705746", 
            "Aço": "#B7B7CE", 
            "Fada": "#D685AD" 
        };
        const c1 = colors[this.type] || "#777";
        let html = `<span style="background-color:${c1}; color:white; padding:1px 5px; border-radius:3px; font-size:0.55rem; font-weight:bold; text-shadow:1px 1px 1px rgba(0,0,0,0.8); border:1px solid rgba(255,255,255,0.4); box-shadow: 0 1px 2px rgba(0,0,0,0.5); letter-spacing: 0.5px;">${this.type.toUpperCase()}</span>`;
        if (this.secondType) {
            const c2 = colors[this.secondType] || "#777";
            html += ` <span style="background-color:${c2}; color:white; padding:1px 5px; border-radius:3px; font-size:0.55rem; font-weight:bold; text-shadow:1px 1px 1px rgba(0,0,0,0.8); border:1px solid rgba(255,255,255,0.4); box-shadow: 0 1px 2px rgba(0,0,0,0.5); letter-spacing: 0.5px;">${this.secondType.toUpperCase()}</span>`;
        }
        return `<div style="display:flex; gap:3px; margin-top:2px; margin-bottom:2px; justify-content: ${align};">${html}</div>`;
    }

    checkEvolution(player: Player | null, silent: boolean = false): boolean { 
        // Trava de segurança para strings vazias, falsas ou nulas
        if (!this.evoData.next || this.evoData.next === "null" || this.evoData.next === "") {
            return false; 
        }

        if (this.level >= (this.evoData.trigger || 999)) { 
            const next = POKEDEX.find(p => p.name === this.evoData.next); 
            if (next) { 
                const oldName = this.name; 
                const triggeredAt = this.evoData.trigger; 
                
                this.id = next.id; 
                this.name = next.name; 
                this.type = next.type;
                this.secondType = next.secondType || "";
                //this.baseTotal = next.BaseTotal || 0;
                this.stage = next.stage; 
                this.baseStats = { hp: next.hp, atk: next.atk, def: next.def, spd: next.spd };
                this.baseTotal = next.BaseTotal || (next.hp + next.atk + next.def + next.spd);

                // --- SOLUÇÃO ANTI-FIREBASE CRASH ---
                // Usamos "" e 999 no lugar de null para o Firebase sempre aceitar!
                this.evoData = { 
                    next: next.nextForm || "", 
                    trigger: next.evoTrigger || 999 
                }; 
                
                this.maxXp = this.calculateMaxXp();
                this.recalculateStats(true); 

                (this as any).faintedThisBattle = false;
                
                // ==============================================================
                // NOVO: POKÉDEX (Registra a Evolução como Visto e Capturado)
                // ==============================================================
                if (player) {
                    if (!player.pokedexData) player.pokedexData = {};
                    
                    if (!player.pokedexData[this.id]) {
                        player.pokedexData[this.id] = { seen: 0, caught: 0, defeated: 0 };
                    }
                    
                    player.pokedexData[this.id].seen += 1;
                    player.pokedexData[this.id].caught += 1;
                    
                    // Salva a alteração na rede imediatamente
                    const Network = (window as any).Network;
                    if (Network && Network.isOnline) {
                        // Se o player evoluindo é o jogador atual, faz o sync do estado
                        if (player.id === Network.myPlayerId) {
                            Network.syncPlayerState();
                        }
                    }
                }
                // ==============================================================

                if(player && !silent) { 
                    const Game = (window as any).Game;
                    const Battle = (window as any).Battle;
                    const Cards = (window as any).Cards;

                    const msgEvo = `✨ Inacreditável! ${oldName} evoluiu para ${this.name}! (HP Restaurado)`;

                    Game.sendGlobalLog(msgEvo); 

                    if (Battle && Battle.active) {
                        Battle.logBattle(msgEvo, true);
                        Battle.updateUI(); 
                    }

                    if (Game.showGlobalAlert) {
                        Game.showGlobalAlert(`Opa! O seu ${oldName} está brilhando muito...\n\n${msgEvo}`, player.name, true, false);
                    }

                    if (triggeredAt === 8) { 
                        if(Cards) { Cards.draw(player); Cards.draw(player); }
                        Game.sendGlobalLog("🧬Bônus Evolução: Ganhou 2 Cartas!"); 
                    } else if (triggeredAt === 5 || triggeredAt === 10) { 
                        if(Cards) { Cards.draw(player); }
                        Game.sendGlobalLog("🧬Bônus Evolução: Ganhou 1 Carta!"); 
                    } 
                } 
                return true; 
            } 
        } 
        return false; 
    }
}