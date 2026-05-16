import { Pokemon } from '../../models/Pokemon';
import { Player } from '../../models/Player';
import { POKEDEX } from '../../constants/pokedex';
import { TYPE_CHART } from '../../constants/typeChart';
import { BattleCore } from './BattleCore';

export class BattleCalc {

    static getTypeMasteryBonus(player: Player, targetType: string): number {
        if (!player.pokedexData) return 0;

        if (!(this as any)._masteryCache) (this as any)._masteryCache = {};
        const cacheKey = `${player.id}_${targetType}`;

        let killCount = 0;
        POKEDEX.forEach((dexEntry: any) => {
            if (dexEntry.type === targetType || dexEntry.secondType === targetType) {
                const entry = player.pokedexData[dexEntry.id];
                if (entry && entry.defeated) killCount += entry.defeated;
            }
        });

        const bonus = killCount;
        (this as any)._masteryCache[cacheKey] = bonus;
        return bonus;
    }

    static getResonanceMultiplier(player: Player, pokemonId: number): number {
        if (!player || !player.pokedexData) return 1.0;
        const dexEntry = player.pokedexData[pokemonId];
        const caught = dexEntry ? (dexEntry.caught || 0) : 0;
        if (caught <= 1) return 1.0;
        const resonancePerc = Math.min(100, (caught - 1) * 10);
        return 1 + (resonancePerc / 100);
    }

    static calculateDamage(attacker: Pokemon, defender: Pokemon, isPlayerAttacking: boolean): { damage: number, msg: string, avoided: boolean, reflected: number } {
        const attackerPlayer = isPlayerAttacking ? BattleCore.player! : (BattleCore.enemyPlayer || null);
        const defenderPlayer = !isPlayerAttacking ? BattleCore.player! : (BattleCore.enemyPlayer || null);
        let logDetails = "";

        // Resonance (Aumenta todos os status baseado em capturas repetidas)
        // Nota: Para o Campeão, isso já foi "assado" nos status salvos em NetworkSync
        const atkReso = attackerPlayer ? this.getResonanceMultiplier(attackerPlayer, attacker.id) : 1.0;
        const defReso = defenderPlayer ? this.getResonanceMultiplier(defenderPlayer, defender.id) : 1.0;

        const effAtk = attacker.atk * atkReso;
        const effDef = defender.def * defReso;
        const effSpeed = attacker.speed * atkReso;
        const effMaxHp = attacker.maxHp * atkReso;
        const effDefSpeed = defender.speed * defReso;

        let dodgeChance = (effDefSpeed - effSpeed) / 5;
        dodgeChance = Math.max(10, dodgeChance);

        const ignoreDodge = (isPlayerAttacking && BattleCore.activeEffects.sniper);

        if (!ignoreDodge && Math.random() * 100 <= dodgeChance) {
            return { damage: 0, msg: "💨 ESQUIVOU!", avoided: true, reflected: 0 };
        }

        let blockChance = (effDef - effAtk) / 5;
        blockChance = Math.max(0, Math.min(90, blockChance));

        if (Math.random() * 100 <= blockChance) {
            return { damage: 0, msg: "🛡️ BLOQUEIO TOTAL!", avoided: true, reflected: 0 };
        }

        const baseAtkRaw = (effAtk * 0.65) + (effSpeed * 0.15) + (effMaxHp * 0.2);
        // choice_band: +10% atk quando atacante carrega o item
        const hasChoiceBand = (attacker as any).heldItem === 'choice_band';
        const baseAtk = hasChoiceBand ? baseAtkRaw * 1.10 : baseAtkRaw;
        if (hasChoiceBand) logDetails += " 🎸Band!";
        let finalDamage = (baseAtk / 5) - (effDef / 20);

        let auditLog = `\n[Cálc: Base ${finalDamage.toFixed(1)}`;

        let masteryBonus = 0;

        if (attackerPlayer) {
            const m1 = this.getTypeMasteryBonus(attackerPlayer, attacker.type);
            const m2 = attacker.secondType ? this.getTypeMasteryBonus(attackerPlayer, attacker.secondType) : 0;
            masteryBonus = m1 + m2;
        } else if ((attacker as any).masteryBonus) {
            // Usa bônus de maestria que foi salvo no Rei da Liga
            masteryBonus = (attacker as any).masteryBonus;
        }

        const masteryMultiplier = 1 + (masteryBonus / 100);
        finalDamage = Math.floor(finalDamage * masteryMultiplier);
        finalDamage = Math.max(1, finalDamage);

        if (masteryBonus > 0) auditLog += ` | Maestria +${masteryBonus}%`;
        if (atkReso > 1) auditLog += ` | Ressonância x${atkReso.toFixed(2)}`;


        const spdCritChance = effSpeed / 8;
        if (Math.random() * 100 <= spdCritChance) {
            finalDamage += 5;
            logDetails += " ⚡Crit.Vel!";
            auditLog += ` | Crit.Vel +5`;
        }

        const hasScopeLens = (attacker as any).heldItem === 'scope_lens';
        const d6 = Math.floor(Math.random() * 6) + 1;
        let rollModifier = 0;
        // scope_lens: sempre garante crítico (+5), independente do dado
        if (d6 === 6 || hasScopeLens) { 
            rollModifier = +5; 
            logDetails += " 🎲Crit!"; 
        }
        else if (d6 === 5) rollModifier = +3;
        else if (d6 === 4) rollModifier = +2;
        else if (d6 === 2) rollModifier = -1;
        else if (d6 === 1) rollModifier = -2;
        finalDamage += rollModifier;
        if (hasScopeLens && d6 !== 6) { auditLog += ` | Scope Lens Crit!`; }
        else if (hasScopeLens) { auditLog += ` | Scope Lens`; }

        auditLog += ` | 🎲${d6}(${rollModifier > 0 ? '+' : ''}${rollModifier})`;

        const atkTypes = [attacker.type, attacker.secondType].filter(t => t);
        const defTypes = [defender.type, defender.secondType].filter(t => t);
        let bestMulti = 0;

        atkTypes.forEach(atkT => {
            let currentTypeMulti = 1;
            defTypes.forEach(defT => {
                let factor = 1;
                if (TYPE_CHART[atkT] && (TYPE_CHART[atkT] as any)[defT] !== undefined) {
                    const val = (TYPE_CHART[atkT] as any)[defT];
                    if (val > 1) factor = 1.75;
                    else if (val < 1) factor = 0.75;
                }
                currentTypeMulti *= factor;
            });
            if (currentTypeMulti > bestMulti) bestMulti = currentTypeMulti;
        });

        let finalMulti = bestMulti;
        const Game = (window as any).Game;
        const ev = Game.currentGlobalEvent?.id;
        let weatherSign = "";

        if (ev === 'DROUGHT') {
            if (atkTypes.includes('Fogo') || atkTypes.includes('Grama')) { finalMulti += 0.25; weatherSign = "[Sol☀️]"; }
            if (atkTypes.includes('Água')) { finalMulti -= 0.25; weatherSign = "[Sol🥵]"; }
        } else if (ev === 'RAIN') {
            if (atkTypes.includes('Água') || atkTypes.includes('Elétrico')) { finalMulti += 0.25; weatherSign = "[Chuva🌧️]"; }
            if (atkTypes.includes('Fogo')) { finalMulti -= 0.25; weatherSign = "[Chuva💧]"; }
        } else if (ev === 'WINTER_STORM') {
            if (atkTypes.includes('Gelo')) { finalMulti += 0.50; weatherSign = "[Gelo❄️]"; }
            else { finalMulti -= 0.20; weatherSign = "[Frio🧊]"; }
        } else if (ev === 'MYSTIC_AURA') {
            if (atkTypes.includes('Psíquico') || atkTypes.includes('Fada')) { finalMulti += 0.50; weatherSign = "[Mistíco✨]"; }
        } else if (ev === 'BLOOD_MOON') {
            if (atkTypes.includes('Fantasma') || atkTypes.includes('Noturno')) { finalMulti += 0.20; weatherSign = "[Lua🌑]"; }
        } else if (ev === 'BERSERK_MODE') {
            finalMulti *= 2.0;
            weatherSign = "[💢BERSERK!]";
        }

        finalDamage = Math.floor(finalDamage * finalMulti);

        if (finalMulti !== 1.0) auditLog += ` | Mult. Vantagem/Clima x${finalMulti.toFixed(2)}`;

        if (finalMulti >= 1.5) logDetails += " 🔥!";
        else if (finalMulti > 1.0) logDetails += " ⚔️";
        else if (finalMulti < 1.0) logDetails += " 🛡️.";
        logDetails += weatherSign;

        finalDamage = Math.max(0, Math.floor(finalDamage));

        if (isPlayerAttacking) {
            if (BattleCore.activeEffects.crit > 0) {
                finalDamage *= 2;
                BattleCore.activeEffects.crit--;
                logDetails += ` [2x] (Restam: ${BattleCore.activeEffects.crit})`;
                auditLog += ` | Carta Crit x2`;
            }
            if (BattleCore.activeEffects.focus) { finalDamage *= 4; BattleCore.activeEffects.focus = false; logDetails += " [4x]"; auditLog += ` | Carta Focus x4`; }
            if (BattleCore.player?.effects.curse && (BattleCore.isGym || BattleCore.isChampion)) {
                finalDamage = Math.floor(finalDamage / 2);
                logDetails += " [😈Amaldiçoado]";
                auditLog += ` | Maldição /2`;
            }
        } else {
            if (BattleCore.activeEffects.guard) { finalDamage = Math.floor(finalDamage / 2); logDetails += " [🛡️]"; auditLog += ` | Carta Guard /2`; }
            if (BattleCore.enemyPlayer && BattleCore.enemyPlayer.effects.curse) { finalDamage = Math.floor(finalDamage / 2); auditLog += ` | Maldição Inimiga /2`; }
        }

        let reflectedAmount = 0;

        if (ev === 'SOUL_LINK') {
            reflectedAmount = Math.floor(finalDamage * 0.3);
            logDetails += " [🔗LINK!]";
        }

        if (effDef > (effAtk * 1.5)) {
            if (Math.random() * 100 <= 15) {
                reflectedAmount += finalDamage;
                logDetails += " 🔄REFLETIDO!";
            }
        }

        // rocky_helmet: reflete 25% do dano ao atacante quando defensor carrega o item
        const defenderHasHelmet = (defender as any).heldItem === 'rocky_helmet';
        if (defenderHasHelmet && finalDamage > 0) {
            reflectedAmount += Math.floor(finalDamage * 0.25);
            logDetails += " [⛑️Helmet!]";
            auditLog += ` | Rocky Helmet 25%`;
        }

        auditLog += ` => Final: ${finalDamage}]`;
        return { damage: finalDamage, msg: `(🎲${d6})${logDetails}${auditLog}`, avoided: false, reflected: reflectedAmount };
    }
}