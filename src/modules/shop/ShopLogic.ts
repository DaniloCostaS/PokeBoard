import { SHOP_ITEMS } from '../../constants';
import { ShopUI } from './ShopUI';

export class ShopLogic {

    static async buy(id: string, price: number) {
        const Game = (window as any).Game;
        const Network = (window as any).Network;
        const p = Game.getCurrentPlayer();

        if (p.gold >= price) {
            // Se estiver online, usar RPC
            if (Network.isOnline) {
                const { data, error } = await Network.supabase.rpc('buy_item', {
                    p_player_id: Network.myPlayerIdDb,
                    p_item_id: id,
                    p_cost: price,
                    p_quantity: 1
                });
                if (error || !data) {
                    Game.showGlobalAlert("Erro na transação. Tente novamente.", p.name, true, false);
                    return;
                }
            }

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
            // Note: O realtime irá recarregar as tabelas player_items e room_players automaticamente
            if (Network.isOnline) {
                // Não precisamos de sync total pois o banco já foi atualizado pelo RPC
                // O evento do postgres_changes atualizará localmente para outros clientes
                Network.syncSpecificPlayer(p.id);
            }
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