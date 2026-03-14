import { SHOP_ITEMS } from '../constants';

export class Shop {
    static open() { 
        const Game = (window as any).Game;
        const p = Game.getCurrentPlayer(); 
        
        document.getElementById('shop-gold')!.innerText = p.gold.toString(); 
        const list = document.getElementById('shop-items-list')!; 
        list.innerHTML = ''; 

        // --- VERIFICAÇÃO DO EVENTO ROCKET ---
        const priceMulti = Game.currentGlobalEvent?.id === 'ROCKET' ? 2 : 1;

        if (priceMulti === 2) {
            const warning = document.createElement('div');
            warning.innerHTML = `<div style="color: #e74c3c; font-weight: bold; text-align: center; margin-bottom: 10px; background: rgba(231, 76, 60, 0.1); padding: 5px; border-radius: 5px; border: 1px dashed #e74c3c;">🚀 INVASÃO ROCKET! Preços DOBRADOS!</div>`;
            list.appendChild(warning);
        }
        // -----------------------------------

        SHOP_ITEMS.forEach(item => { 
            const finalPrice = item.price * priceMulti; // Aplica o multiplicador
            
            const div = document.createElement('div'); 
            div.className = 'shop-item'; 
            
            // Deixa o botão de comprar vermelho se estiver mais caro
            const btnStyle = priceMulti === 2 ? 'width:auto; background:#e74c3c;' : 'width:auto;';

            div.innerHTML = `<div style="display:flex; align-items:center;"><img src="/assets/img/Itens/${item.icon}" class="item-icon-mini"><span>${item.name}</span></div><button class="btn" style="${btnStyle}" onclick="window.Shop.buy('${item.id}', ${finalPrice})">${finalPrice}G</button>`; 
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
            Game.addItem(p, id, 1);
            
            // --- NOVO: Enviar Log Global de Compra ---
            const itemData = SHOP_ITEMS.find((i: any) => i.id === id);
            if (itemData) {
                Game.sendGlobalLog(`🛒 ${p.name} comprou: ${itemData.name}!`);
                Game.sendGlobalLog(`💰 [Extrato] ${p.name} gastou -${price}G na Loja.`); // Log do Extrato
                Game.sendGlobalLog(`💰 [Extrato] Novo Saldo: ${p.gold}G.`);
            }
            // ------------------------------------------

            this.open(); 
            if(Network.isOnline) Network.syncPlayerState();
        } else {
            Game.showGlobalAlert("Ouro insuficiente!", p.name, true, false);
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