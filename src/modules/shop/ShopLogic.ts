import { SHOP_ITEMS } from '../../constants';
import { ShopUI } from './ShopUI';

export class ShopLogic {

    static buy(id: string, price: number) {
        const Game = (window as any).Game;
        const Network = (window as any).Network;
        const p = Game.getCurrentPlayer();

        if (p.gold >= price) {
            p.gold -= price;
            Game.addItem(p, id, 1);

            // Log Global de Compra
            const itemData = SHOP_ITEMS.find((i: any) => i.id === id);
            if (itemData) {
                Game.sendGlobalLog(`🛒 ${p.name} comprou: ${itemData.name}!`);
                Game.sendGlobalLog(`💰 [Extrato] ${p.name} gastou -${price}G na Loja.`);
                Game.sendGlobalLog(`💰 [Extrato] Novo Saldo: ${p.gold}G.`);
            }

            ShopUI.open(); // Recarrega a UI para atualizar o saldo visível
            if (Network.isOnline) Network.syncPlayerState();
        } else {
            Game.showGlobalAlert("Ouro insuficiente!", p.name, true, false);
        }
    }

    static closeShopEvent() {
        const Game = (window as any).Game;
        if (Game.isCityEvent) {
            Game.isCityEvent = false;
            Game.nextTurn();
        }
    }
}