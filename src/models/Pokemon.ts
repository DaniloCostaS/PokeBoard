import { POKEDEX } from '../constants/pokedex';
import type { Player } from './Player';

export class Pokemon {
    id: number; name: string; type: string;
    maxHp: number; currentHp: number; atk: number; def: number; speed: number;
    level: number; currentXp: number; maxXp: number;
    isShiny: boolean; isLegendary: boolean; wins: number; 
    evoData: any; 
    leveledUpThisTurn: boolean = false;
    stage: number; // Nova propriedade para controlar o estágio
    
    ivs: { hp: number, atk: number, def: number, spd: number };
    baseStats: { hp: number, atk: number, def: number, spd: number };

    constructor(templateId: number, targetLevel: number = 1, forceShiny: boolean | null = null) {
        let template = POKEDEX.find(p => p.id === templateId) || POKEDEX[0];
        
        // Ajusta o template se for um pokemon selvagem de nível alto (já evoluído)
        while (template.nextForm && template.evoTrigger && targetLevel >= template.evoTrigger) {
            const next = POKEDEX.find(p => p.name === template.nextForm);
            if (next) template = next;
            else break;
        }

        this.id = template.id; 
        this.name = template.name; 
        this.type = template.type; 
        this.isLegendary = !!template.isLegendary;
        this.stage = template.stage; // Inicializa o estágio

        if (forceShiny !== null) {
            this.isShiny = forceShiny;
        } else {
            this.isShiny = Math.random() < 0.03;
        }

        this.level = targetLevel; 
        this.currentXp = 0; 
        this.wins = 0;
        this.evoData = { 
            next: template.nextForm || null, 
            trigger: template.evoTrigger || null 
        };

        this.baseStats = {
            hp: template.hp,
            atk: template.atk,
            def: template.def,
            spd: template.spd
        };

        this.ivs = {
            hp: Math.floor(Math.random() * 6),
            atk: Math.floor(Math.random() * 6),
            def: Math.floor(Math.random() * 6),
            spd: Math.floor(Math.random() * 6)
        };

        this.maxHp = 0; this.currentHp = 0; this.atk = 0; this.def = 0; this.speed = 0;
        
        // Calcula o XP necessário com base na nova lógica
        this.maxXp = this.calculateMaxXp();
        
        this.recalculateStats(true);
    }

    // Nova lógica de cálculo de XP baseada na planilha
    calculateMaxXp(): number {
        let multiplier = 10; // Padrão Stage 1

        if (this.isShiny) {
            multiplier = 50;
        } else if (this.isLegendary) {
            multiplier = 40;
        } else {
            // Lógica de Estágios
            if (this.stage === 1) {
                // Se não tem próxima forma, é Single Stage (ex: Tauros) -> Usa lógica Stage 3 (30x)
                // Se tem próxima forma, é Stage 1 padrão -> Usa lógica Stage 1 (10x)
                if (!this.evoData.next) multiplier = 30;
                else multiplier = 10;
            } 
            else if (this.stage === 2) {
                // Se não tem próxima forma, é final de linha de 2 estágios (ex: Fearow) -> Usa lógica Stage 3 (30x)
                // Se tem próxima forma, é meio de linha de 3 estágios (ex: Ivysaur) -> Usa lógica Stage 2 (20x)
                if (!this.evoData.next) multiplier = 30;
                else multiplier = 20;
            } 
            else if (this.stage === 3) {
                // Stage 3 sempre 30x
                multiplier = 30;
            }
        }
        
        return this.level * multiplier;
    }

    recalculateStats(resetHp: boolean = false) {
        const shinyBonus = this.isShiny ? 1.1 : 1.0; 
        const levelBonus = (this.level - 1) * 2;

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
        (window as any).Game.sendGlobalLog(`${this.name} ganhou ${amount} XP!`);
        this.currentXp += amount; 
        
        if(this.currentXp >= this.maxXp && !this.leveledUpThisTurn) { 
            this.currentXp -= this.maxXp; 
            this.levelUp(player); 
            this.leveledUpThisTurn = true; 
        } 
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

    checkEvolution(player: Player | null, silent: boolean = false): boolean { 
        if (this.evoData.next && this.level >= (this.evoData.trigger || 999)) { 
            const next = POKEDEX.find(p => p.name === this.evoData.next); 
            if (next) { 
                const oldName = this.name; 
                this.id = next.id; 
                this.name = next.name; 
                this.type = next.type; 
                this.stage = next.stage; // Atualiza o estágio
                this.baseStats = { hp: next.hp, atk: next.atk, def: next.def, spd: next.spd };
                this.evoData = { next: next.nextForm, trigger: next.evoTrigger }; 
                
                // Recalcula o XP Maximo pois mudou de estágio (ex: Stage 1 -> Stage 2)
                this.maxXp = this.calculateMaxXp();

                this.recalculateStats(true); 

                if(player && !silent) { 
                    const Game = (window as any).Game;
                    const Cards = (window as any).Cards;
                    Game.sendGlobalLog(`✨ ${oldName} evoluiu para ${this.name}! (HP Restaurado)`); 
                    if (this.level === 8) { 
                        if(Cards) { Cards.draw(player); Cards.draw(player); }
                        Game.sendGlobalLog("Bônus Evolução: Ganhou 2 Cartas!"); 
                    } else if (this.level === 5 || this.level === 10) { 
                        if(Cards) { Cards.draw(player); }
                        Game.sendGlobalLog("Bônus Evolução: Ganhou 1 Carta!"); 
                    } 
                } 
                return true; 
            } 
        } 
        return false; 
    }
}