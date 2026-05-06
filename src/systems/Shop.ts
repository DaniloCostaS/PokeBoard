import { ShopLogic } from '../modules/shop/ShopLogic';
import { ShopUI } from '../modules/shop/ShopUI';

export class Shop {

    // --- INTERFACE DE RENDERIZAÇÃO ---
    static open() {
        ShopUI.open();
    }

    // --- INTERFACE DE LÓGICA E DADOS ---
    static buy(id: string, price: number) {
        ShopLogic.buy(id, price);
    }

    // --- EVENTOS DO MODAL ---
    static close() {
        ShopUI.close();
    }
}

// Vincula a classe Shop ao objeto window para chamadas originárias de onClick no HTML
(window as any).Shop = Shop;