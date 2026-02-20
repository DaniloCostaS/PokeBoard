import { POKEDEX } from '../constants/pokedex';
import type { Player } from './Player';

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

    ivs: { hp: number, atk: number, def: number, spd: number };
    baseStats: { hp: number, atk: number, def: number, spd: number };

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
        
        this.isGymLeaderMon = isGymLeaderMon; // <--- SALVA A IDENTIFICAÇÃO

        if (forceShiny !== null) {
            this.isShiny = forceShiny;
        } else {
            this.isShiny = Math.random() < 0.03;
        }

        this.level = targetLevel; 
        this.currentXp = 0; 
        this.wins = 0;
        this.evoData = { 
            next: template.nextForm || "", 
            trigger: template.evoTrigger || 999 
        };

        this.baseStats = {
            hp: template.hp,
            atk: template.atk,
            def: template.def,
            spd: template.spd
        };

        // --- REGRA 3: IVs CRAVADOS EM 20 PARA LÍDERES ---
        if (this.isGymLeaderMon) {
            this.ivs = { hp: 20, atk: 20, def: 20, spd: 20 };
        } else {
            this.ivs = {
                hp: Math.floor(Math.random() * 6),
                atk: Math.floor(Math.random() * 6),
                def: Math.floor(Math.random() * 6),
                spd: Math.floor(Math.random() * 6)
            };
        }

        this.maxHp = 0; this.currentHp = 0; this.atk = 0; this.def = 0; this.speed = 0;
        
        this.maxXp = this.calculateMaxXp();
        this.recalculateStats(true);
    }

    // Nova lógica de cálculo de XP baseada na planilha
    calculateMaxXp(): number {
        let multiplier = 10; // Padrão Stage 1

        /* if (this.isShiny) {
            multiplier = 50;
        } else /*/
        if (this.isLegendary) {
            multiplier = 30;
        } else {
            // Lógica de Estágios
            if (this.stage === 1) {
                // Se não tem próxima forma, é Single Stage (ex: Tauros) -> Usa lógica Stage 3 (30x)
                // Se tem próxima forma, é Stage 1 padrão -> Usa lógica Stage 1 (10x)
                if (!this.evoData.next) multiplier = 20;
                else multiplier = 10;
            } 
            else if (this.stage === 2) {
                // Se não tem próxima forma, é final de linha de 2 estágios (ex: Fearow) -> Usa lógica Stage 3 (30x)
                // Se tem próxima forma, é meio de linha de 3 estágios (ex: Ivysaur) -> Usa lógica Stage 2 (20x)
                if (!this.evoData.next) multiplier = 20;
                else multiplier = 15;
            } 
            else if (this.stage === 3) {
                // Stage 3 sempre 30x
                multiplier = 20;
            }
        }
        
        return this.level * multiplier;
    }

    recalculateStats(resetHp: boolean = false) {
        // --- ALTERAÇÃO: Mudando o bônus de 1.1 (10%) para 1.15 (15%) para 1.3 (30%) ---
        const shinyBonus = this.isShiny ? 1.15 : 1.0; 
        
        // --- REGRA 4: +5 STATUS POR LEVEL PARA LÍDERES (+2 PARA JOGADORES) ---
        const levelBonus = this.isGymLeaderMon ? (this.level - 1) * 5 : (this.level - 1) * 2;

        const calc = (base: number, iv: number) => Math.floor((base + iv + levelBonus) * shinyBonus);

        const oldMaxHp = this.maxHp;

        this.maxHp = calc(this.baseStats.hp, this.ivs.hp); 
        this.maxHp = Math.max(1, this.maxHp);
        
        this.atk = calc(this.baseStats.atk, this.ivs.atk);
        this.def = calc(this.baseStats.def, this.ivs.def);
        this.speed = calc(this.baseStats.spd, this.ivs.spd);

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
        if(this.level >= 100) return; // Cap no nível 100 por segurança
        (window as any).Game.sendGlobalLog(`💹 ${this.name} ganhou ${amount} XP!`);
        this.currentXp += amount; 
        
        // --- CORREÇÃO BUG 2: WHILE LOOP ---
        // Agora o Pokémon upa quantas vezes for necessário, sem travas!
        while(this.currentXp >= this.maxXp && this.level < 100) { 
            this.currentXp -= this.maxXp; 
            this.levelUp(player); 
        } 
        // ----------------------------------
    }

    levelUp(player: Player | null) { 
        this.level++; 
        
        // Recalcula o XP necessário para o próximo nível (agora que o nível aumentou)
        this.maxXp = this.calculateMaxXp();
        
        this.recalculateStats(false);
        if(player) {
             const Game = (window as any).Game;
             Game.sendGlobalLog(`🎉 ${this.name} subiu para o Nível ${this.level}! (+2 Status)`); 
        }
        this.checkEvolution(player); 
    }

    forceLevel(targetLevel: number) { 
        this.level = targetLevel;
        this.maxXp = this.calculateMaxXp(); // Atualiza XP necessário
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