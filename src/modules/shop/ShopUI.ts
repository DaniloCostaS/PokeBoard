import { SHOP_ITEMS } from '../../constants';
import { ShopLogic } from './ShopLogic';

export class ShopUI {

    static open() {
        const Game = (window as any).Game;
        const p = Game.getCurrentPlayer();

        document.getElementById('shop-gold')!.innerText = p.gold.toString();
        const list = document.getElementById('shop-items-list')!;
        list.innerHTML = '';

        // Verificação do evento ROCKET para alterar a exibição
        const priceMulti = Game.currentGlobalEvent?.id === 'ROCKET' ? 2 : 1;

        if (priceMulti === 2) {
            const warning = document.createElement('div');
            warning.innerHTML = `<div style="color: #e74c3c; font-weight: bold; text-align: center; margin-bottom: 10px; background: rgba(231, 76, 60, 0.1); padding: 5px; border-radius: 5px; border: 1px dashed #e74c3c;">🚀 INVASÃO ROCKET! Preços DOBRADOS!</div>`;
            list.appendChild(warning);
        }

        SHOP_ITEMS.forEach(item => {
            const finalPrice = item.price * priceMulti;

            const div = document.createElement('div');
            div.className = 'shop-item';

            const btnStyle = priceMulti === 2 ? 'width:auto; background:#e74c3c;' : 'width:auto;';

            div.innerHTML = `
                <div style="display:flex; align-items:center;">
                    <img src="/assets/img/Itens/${item.icon}" class="item-icon-mini">
                    <span>${item.name}</span>
                </div>
                <button class="btn" style="${btnStyle}" onclick="window.Shop.buy('${item.id}', ${finalPrice})">${finalPrice}G</button>
            `;
            list.appendChild(div);
        });

        document.getElementById('shop-modal')!.style.display = 'flex';
    }

    static close() {
        document.getElementById('shop-modal')!.style.display = 'none';
        ShopLogic.closeShopEvent();
    }
}