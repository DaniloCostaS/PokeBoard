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

        let validItems = SHOP_ITEMS;
        if ((window as any).GameState && (window as any).GameState.settings && !(window as any).GameState.settings.megas) {
            validItems = validItems.filter(i => i.id !== 'megastone');
        }

        validItems.forEach(item => {
            const finalPrice = item.price * priceMulti;

            const div = document.createElement('div');
            // Estilização premium da linha do item
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.style.padding = '12px 10px';
            div.style.borderBottom = '1px solid rgba(255, 255, 255, 0.08)';
            div.style.gap = '12px';

            const canAfford = p.gold >= finalPrice;

            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px; flex:1; min-width:0;">
                    <img src="/assets/img/Itens/${item.icon}" class="item-icon-mini" style="width: 32px; height: 32px; object-fit: contain; flex-shrink:0;">
                    <div style="display:flex; flex-direction:column; min-width:0;">
                        <span style="font-weight:600; color: #fff; font-size: 0.95rem;">${item.name}</span>
                        <span style="font-size:0.75rem; color:#a0aec0; line-height:1.4; white-space:normal; margin-top: 2px;">${item.desc}</span>
                    </div>
                </div>
                <button class="btn ${canAfford ? 'btn-roll' : 'btn-secondary'} pb-price-btn${priceMulti === 2 ? ' is-inflated' : ''}" onclick="window.Shop.buy('${item.id}', ${finalPrice})" title="${priceMulti === 2 ? 'Preço dobrado pela Invasão Rocket' : 'Comprar'}">
                    ${finalPrice}G
                </button>
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