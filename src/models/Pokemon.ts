import { POKEDEX } from '../constants/pokedex';
import type { Player } from './Player';

export class Pokemon {
    id: number; name: string; type: string;
    maxHp: number; currentHp: number; atk: number; def: number; speed: number;
    level: number; currentXp: number; maxXp: number;
    isShiny: boolean; isLegendary: boolean; wins: number; 
    evoData: any; 
    leveledUpThisTurn: boolean = false;
    
    ivs: { hp: number, atk: number, def: number, spd: number };
    baseStats: { hp: number, atk: number, def: number, spd: number };

    constructor(templateId: number, targetLevel: number = 1, forceShiny: boolean | null = null) {
        let template = POKEDEX.find(p => p.id === templateId) || POKEDEX[0];
        
        while (template.nextForm && template.evoTrigger && targetLevel >= template.evoTrigger) {
            const next = POKEDEX.find(p => p.name === template.nextForm);
            if (next) template = next;
            else break;
        }

        this.id = template.id; 
        this.name = template.name; 
        this.type = template.type; 
        this.isLegendary = !!template.isLegendary;
        
        if (forceShiny !== null) {
            this.isShiny = forceShiny;
        } else {
            this.isShiny = Math.random() < 0.03;
        }

        this.level = targetLevel; 
        this.currentXp = 0; 
        this.maxXp = this.level * 20;
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
        this.recalculateStats(true);
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
    heal(amt: number) { this.currentHp = Math.min(this.maxHp, this.currentHp + amt); }
    
    gainXp(amount: number, player: Player) { 
        if(this.level >= 15) return; 
        
        // Log global simples de XP (opcional, se ficar muito spam, comente a linha abaixo)
        // (window as any).Game.sendGlobalLog(`${this.name} ganhou ${amount} XP!`);

        this.currentXp += amount; 
        if(this.currentXp >= this.maxXp && !this.leveledUpThisTurn) { 
            this.currentXp -= this.maxXp; 
            this.levelUp(player); 
            this.leveledUpThisTurn = true; 
        } 
    }

    levelUp(player: Player | null) { 
        this.level++; 
        this.maxXp = this.level * 20; 
        this.recalculateStats(false);
        
        if(player) {
             const Game = (window as any).Game;
             Game.sendGlobalLog(`🎉 ${this.name} subiu para o Nível ${this.level}! (+2 Status)`); 
        }
        this.checkEvolution(player); 
    }

    forceLevel(targetLevel: number) { 
        this.level = targetLevel;
        this.maxXp = this.level * 20;
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
                this.baseStats = { hp: next.hp, atk: next.atk, def: next.def, spd: next.spd };
                this.evoData = { next: next.nextForm, trigger: next.evoTrigger }; 
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