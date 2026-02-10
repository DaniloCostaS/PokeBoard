import { CARDS_DB } from '../constants';
import type { Player } from '../models/Player';

export class Cards {
    static draw(player: Player) { 
        const Game = (window as any).Game;
        const Network = (window as any).Network;

        const card = CARDS_DB[Math.floor(Math.random()*CARDS_DB.length)]; 
        player.cards.push(card); 
        Game.log(`Ganhou carta: ${card.icon} ${card.name}`); 
        Game.updateHUD(); 
        if(Network.isOnline) Network.syncPlayerState(); 
    }
    
    static showPlayerCards(playerId: number) { 
        const Game = (window as any).Game;
        Game.openBoardCards(playerId); 
    }
}