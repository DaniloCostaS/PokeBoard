import { SHOP_ITEMS } from '../constants';

export class Shop {
    static open() { 
        // Acesso via window para evitar import circular
        const Game = (window as any).Game;
        const p = Game.getCurrentPlayer(); 
        
        document.getElementById('shop-gold')!.innerText = p.gold.toString(); 
        const list = document.getElementById('shop-items-list')!; 
        list.innerHTML = ''; 
        SHOP_ITEMS.forEach(item => { 
            const div = document.createElement('div'); 
            div.className = 'shop-item'; 
            div.innerHTML = `<div style="display:flex; align-items:center;"><img src="/assets/img/Itens/${item.icon}" class="item-icon-mini"><span>${item.name}</span></div><button class="btn" style="width:auto" onclick="window.Shop.buy('${item.id}', ${item.price})">${item.price}</button>`; 
            list.appendChild(div); 
        }); 
        document.getElementById('shop-modal')!.style.display = 'flex'; 
    }
    
    static buy(id: string, price: number) { 
        const Game = (window as any).Game;
        const Network = (window as any).Network;
        const p = Game.getCurrentPlayer(); 
        
        if(p.gold >= price) { 
            p.gold -= price; 
            p.items[id]++; 
            this.open(); 
            Game.updateHUD(); 
            if(Network.isOnline) Network.syncPlayerState(); 
        } 
    }
    
    static close() { 
        const Game = (window as any).Game;
        document.getElementById('shop-modal')!.style.display = 'none'; 
        if(Game.isCityEvent) { 
            Game.isCityEvent = false; 
            Game.nextTurn(); 
        } 
    }
}