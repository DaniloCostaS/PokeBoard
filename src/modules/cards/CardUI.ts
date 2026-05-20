import { CardEffects } from './CardEffects';
import { CARD_RARITIES } from '../../constants';
import { GLOBAL_EVENTS } from '../../constants/globalEvents';

export class CardUI {
    static openTargetSelection(cardId: string) {
        const Game = (window as any).Game;
        const currentPlayer = Game.getCurrentPlayer();

        const targets = Game.players.filter((p: any) => p.id !== currentPlayer.id);

        if (targets.length === 0) {
            Game.showGlobalAlert("Você está sozinho na sala! Não há alvos disponíveis.", currentPlayer.name, true, false);
            return;
        }

        const modal = document.getElementById('pkmn-select-modal')!;
        const list = document.getElementById('pkmn-select-list')!;

        const boardCardsModal = document.getElementById('board-cards-modal');
        if (boardCardsModal) boardCardsModal.style.display = 'none';


        document.getElementById('select-title')!.innerText = "Selecione o Jogador Alvo:";
        list.innerHTML = '';

        targets.forEach((target: any) => {
            const div = document.createElement('div');
            div.className = `mon-select-item`;

            div.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px; width: 100%; padding: 5px;">
                    <img src="${target.avatar}" width="45" style="border-radius: 50%; border: 2px solid #f1c40f; box-shadow: 0 0 5px rgba(241, 196, 15, 0.4);">
                    <div style="text-align: left; line-height: 1.4; flex-grow: 1;">
                        <b style="font-size: 1.1rem; color: #fff;">${target.name}</b>
                        <small style="color: #f1c40f; font-weight: bold; margin-left: 8px;">(P${target.id + 1})</small>
                    </div>
                </div>
            `;

            div.onclick = () => {
                modal.style.display = 'none';
                CardEffects.activate(cardId, target.id);
            };
            list.appendChild(div);
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.innerText = 'Cancelar';
        cancelBtn.onclick = () => { modal.style.display = 'none'; };
        list.appendChild(cancelBtn);

        modal.style.display = 'flex';
    }



    static openPokemonSelectionForCard(cardId: string, customTitle: string = "Escolha quem vai comer o Rare Candy:") {
        const Game = (window as any).Game;
        const player = Game.getCurrentPlayer();
        const modal = document.getElementById('pkmn-select-modal')!;
        const list = document.getElementById('pkmn-select-list')!;

        const boardCardsModal = document.getElementById('board-cards-modal');
        if (boardCardsModal) boardCardsModal.style.display = 'none';

        document.getElementById('select-title')!.innerText = customTitle;
        list.innerHTML = '';

        player.team.forEach((mon: any, index: number) => {
            const div = document.createElement('div');
            div.className = `mon-select-item`;

            const isShiny = mon.isShiny;
            div.innerHTML = `
                <img src="${mon.getSprite()}" width="45" style="object-fit:contain; filter: drop-shadow(0 0 3px ${isShiny ? '#f1c40f' : 'transparent'});">
                <div style="display:flex; flex-direction:column; gap:4px; flex:1; text-align:left;">
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                        <b style="font-size:1.1rem; color:${isShiny ? '#f1c40f' : '#fff'};">${mon.name} ${isShiny ? '✨' : ''}</b>
                        <span style="font-size:0.9rem; font-weight:bold; color:#f1c40f; background:rgba(0,0,0,0.5); padding:2px 6px; border-radius:4px;">Lv.${mon.level}</span>
                    </div>
                    <div style="font-size:0.8rem; color:#ecf0f1; background:rgba(0,0,0,0.3); padding:4px; border-radius:4px; display:flex; justify-content:space-between;">
                        <span>XP: <b>${mon.currentXp}/${mon.maxXp}</b></span>
                        <span style="display: flex; gap: 8px;">
                            <span>❤️ ${mon.currentHp}/${mon.maxHp}</span>
                            <span>⚔️ ${mon.atk}</span>
                            <span>🛡️ ${mon.def}</span>
                            <span>💨 ${mon.speed}</span>
                        </span>
                    </div>
                </div>
            `;

            div.onclick = () => {
                modal.style.display = 'none';
                CardEffects.activate(cardId, index);
            };
            list.appendChild(div);
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary mt-15';
        cancelBtn.innerText = 'Cancelar';
        cancelBtn.onclick = () => { modal.style.display = 'none'; };
        list.appendChild(cancelBtn);

        modal.style.display = 'flex';
    }

    static openEvolutionSelectionForCard(cardId: string) {
        const Game = (window as any).Game;
        const player = Game.getCurrentPlayer();
        const modal = document.getElementById('pkmn-select-modal')!;
        const list = document.getElementById('pkmn-select-list')!;

        const boardCardsModal = document.getElementById('board-cards-modal');
        if (boardCardsModal) boardCardsModal.style.display = 'none';

        document.getElementById('select-title')!.innerText = "Escolha quem vai Evoluir:";
        list.innerHTML = '';

        player.team.forEach((mon: any, index: number) => {
            const canEvolve = mon.evoData && mon.evoData.next && mon.evoData.next !== "";
            const div = document.createElement('div');

            const isShiny = mon.isShiny;
            if (canEvolve) {
                div.className = `mon-select-item`;
                div.innerHTML = `
                    <img src="${mon.getSprite()}" width="45" style="object-fit:contain; filter: drop-shadow(0 0 3px ${isShiny ? '#f1c40f' : 'transparent'});">
                    <div style="display:flex; flex-direction:column; gap:4px; flex:1; text-align:left;">
                        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                            <b style="font-size:1.1rem; color:${isShiny ? '#f1c40f' : '#fff'};">${mon.name} ${isShiny ? '✨' : ''}</b>
                            <span style="font-size:0.9rem; font-weight:bold; color:#f1c40f; background:rgba(0,0,0,0.5); padding:2px 6px; border-radius:4px;">Lv.${mon.level}</span>
                        </div>
                        <div style="font-size:0.8rem; color:#2ecc71; font-weight:500;">🧬 Evolução Disponível para: ${mon.evoData.next}!</div>
                    </div>
                `;
                div.onclick = () => {
                    modal.style.display = 'none';
                    CardEffects.activate(cardId, index);
                };
            } else {
                div.className = `mon-select-item disabled`;
                div.innerHTML = `
                    <img src="${mon.getSprite()}" width="45" style="object-fit:contain; filter: grayscale(100%) opacity(0.6);">
                    <div style="display:flex; flex-direction:column; gap:4px; flex:1; text-align:left;">
                        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                            <b style="font-size:1.1rem; color:#888;">${mon.name}</b>
                            <span style="font-size:0.9rem; font-weight:bold; color:#666; background:rgba(0,0,0,0.3); padding:2px 6px; border-radius:4px;">Lv.${mon.level}</span>
                        </div>
                        <div style="font-size:0.8rem; color:#e74c3c;">🚫 Estágio Máximo (não pode evoluir)</div>
                    </div>
                `;
            }
            list.appendChild(div);
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary mt-15';
        cancelBtn.innerText = 'Cancelar';
        cancelBtn.onclick = () => { modal.style.display = 'none'; };
        list.appendChild(cancelBtn);

        modal.style.display = 'flex';
    }



    static async openMegaSelection(cardId: string) {
        const Game = (window as any).Game;
        const player = Game.getCurrentPlayer();
        const modal = document.getElementById('pkmn-select-modal')!;
        const list = document.getElementById('pkmn-select-list')!;
        const { MAPA_MEGAS } = await import('../../constants/mapaMegas');

        const boardCardsModal = document.getElementById('board-cards-modal');
        if (boardCardsModal) boardCardsModal.style.display = 'none';

        document.getElementById('select-title')!.innerText = "Equipar Mega Pedra em quem?";
        list.innerHTML = '';

        player.team.forEach((mon: any, index: number) => {
            const div = document.createElement('div');
            const canMega = !!MAPA_MEGAS[mon.id];

            const isShiny = mon.isShiny;
            if (canMega) {
                if (mon.megaStone) {
                    div.className = `mon-select-item disabled`;
                    div.innerHTML = `
                        <img src="${mon.getSprite()}" width="45" style="object-fit:contain; filter: drop-shadow(0 0 3px ${isShiny ? '#f1c40f' : 'transparent'});">
                        <div style="display:flex; flex-direction:column; gap:4px; flex:1; text-align:left;">
                            <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                                <b style="font-size:1.1rem; color:${isShiny ? '#f1c40f' : '#fff'};">${mon.name} ${isShiny ? '✨' : ''}</b>
                                <span style="font-size:0.9rem; font-weight:bold; color:#f1c40f; background:rgba(0,0,0,0.5); padding:2px 6px; border-radius:4px;">Lv.${mon.level}</span>
                            </div>
                            <div style="font-size:0.8rem; color:#f1c40f;">💎 Mega Pedra já equipada</div>
                        </div>
                    `;
                } else {
                    div.className = `mon-select-item`;
                    div.innerHTML = `
                        <img src="${mon.getSprite()}" width="45" style="object-fit:contain; filter: drop-shadow(0 0 3px ${isShiny ? '#f1c40f' : 'transparent'});">
                        <div style="display:flex; flex-direction:column; gap:4px; flex:1; text-align:left;">
                            <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                                <b style="font-size:1.1rem; color:${isShiny ? '#f1c40f' : '#fff'};">${mon.name} ${isShiny ? '✨' : ''}</b>
                                <span style="font-size:0.9rem; font-weight:bold; color:#f1c40f; background:rgba(0,0,0,0.5); padding:2px 6px; border-radius:4px;">Lv.${mon.level}</span>
                            </div>
                            <div style="font-size:0.8rem; color:#2ecc71;">🧬 Compatível com Mega Evolução!</div>
                        </div>
                    `;
                    div.onclick = () => {
                        modal.style.display = 'none';
                        CardEffects.activate(cardId, index);
                    };
                }
            } else {
                div.className = `mon-select-item disabled`;
                div.innerHTML = `
                    <img src="${mon.getSprite()}" width="45" style="object-fit:contain; filter: grayscale(100%) opacity(0.6);">
                    <div style="display:flex; flex-direction:column; gap:4px; flex:1; text-align:left;">
                        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                            <b style="font-size:1.1rem; color:#888;">${mon.name}</b>
                            <span style="font-size:0.9rem; font-weight:bold; color:#666; background:rgba(0,0,0,0.3); padding:2px 6px; border-radius:4px;">Lv.${mon.level}</span>
                        </div>
                        <div style="font-size:0.8rem; color:#e74c3c;">❌ Incompatível com Mega Evolução</div>
                    </div>
                `;
            }
            list.appendChild(div);
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary mt-15';
        cancelBtn.innerText = 'Cancelar';
        cancelBtn.onclick = () => { modal.style.display = 'none'; };
        list.appendChild(cancelBtn);

        modal.style.display = 'flex';
    }

    static openReclaimMegaStoneSelection(cardId: string) {
        const Game = (window as any).Game;
        const player = Game.getCurrentPlayer();
        const modal = document.getElementById('pkmn-select-modal')!;
        const list = document.getElementById('pkmn-select-list')!;

        const boardCardsModal = document.getElementById('board-cards-modal');
        if (boardCardsModal) boardCardsModal.style.display = 'none';

        document.getElementById('select-title')!.innerText = "Escolha de qual Pokémon recuperar a Mega Pedra:";
        list.innerHTML = '';

        let hasMega = false;
        player.team.forEach((mon: any, index: number) => {
            const div = document.createElement('div');

            const isShiny = mon.isShiny;
            if (mon.megaStone) {
                hasMega = true;
                div.className = `mon-select-item`;
                div.innerHTML = `
                    <img src="${mon.getSprite()}" width="45" style="object-fit:contain; filter: drop-shadow(0 0 3px ${isShiny ? '#f1c40f' : 'transparent'});">
                    <div style="display:flex; flex-direction:column; gap:4px; flex:1; text-align:left;">
                        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                            <b style="font-size:1.1rem; color:${isShiny ? '#f1c40f' : '#fff'};">${mon.name} ${isShiny ? '✨' : ''}</b>
                            <span style="font-size:0.9rem; font-weight:bold; color:#f1c40f; background:rgba(0,0,0,0.5); padding:2px 6px; border-radius:4px;">Lv.${mon.level}</span>
                        </div>
                        <div style="font-size:0.8rem; color:#2ecc71;">💎 Mega Pedra Equipada! (Clique para recuperar)</div>
                    </div>
                `;
                div.onclick = () => {
                    modal.style.display = 'none';
                    CardEffects.activate(cardId, index);
                };
            } else {
                div.className = `mon-select-item disabled`;
                div.innerHTML = `
                    <img src="${mon.getSprite()}" width="45" style="object-fit:contain; filter: grayscale(100%) opacity(0.6);">
                    <div style="display:flex; flex-direction:column; gap:4px; flex:1; text-align:left;">
                        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                            <b style="font-size:1.1rem; color:#888;">${mon.name}</b>
                            <span style="font-size:0.9rem; font-weight:bold; color:#666; background:rgba(0,0,0,0.3); padding:2px 6px; border-radius:4px;">Lv.${mon.level}</span>
                        </div>
                        <div style="font-size:0.8rem; color:#e74c3c;">🚫 Sem Mega Pedra para recuperar</div>
                    </div>
                `;
            }
            list.appendChild(div);
        });

        if (!hasMega) {
            alert("Nenhum de seus Pokémon possui uma Mega Pedra equipada para ser recuperada!");
            return;
        }

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary mt-15';
        cancelBtn.innerText = 'Cancelar';
        cancelBtn.onclick = () => { modal.style.display = 'none'; };
        list.appendChild(cancelBtn);

        modal.style.display = 'flex';
    }

    static openStealMegaStoneTargetSelection(cardId: string) {
        const Game = (window as any).Game;
        const currentPlayer = Game.getCurrentPlayer();

        const targets = Game.players.filter((p: any) =>
            p.id !== currentPlayer.id && p.team.some((mon: any) => mon.megaStone && !mon.vinculoSupremo)
        );

        if (targets.length === 0) {
            Game.showGlobalAlert("Nenhum adversário possui um Pokémon com Mega Pedra equipada!", currentPlayer.name, true, false);
            return;
        }

        const modal = document.getElementById('pkmn-select-modal')!;
        const list = document.getElementById('pkmn-select-list')!;

        const boardCardsModal = document.getElementById('board-cards-modal');
        if (boardCardsModal) boardCardsModal.style.display = 'none';

        document.getElementById('select-title')!.innerText = "Escolha de qual jogador destruir a Mega Pedra:";
        list.innerHTML = '';

        targets.forEach((target: any) => {
            const div = document.createElement('div');
            div.className = `mon-select-item`;

            div.innerHTML = `
                <img src="${target.avatar}" width="40" style="border-radius: 50%; border: 2px solid #ecf0f1;">
                <b>${target.name}</b> 
                <small style="color:#bdc3c7;">(P${target.id + 1})</small>
            `;

            div.onclick = () => {
                this.openStealMegaStonePokemonSelection(cardId, target.id);
            };
            list.appendChild(div);
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary mt-15';
        cancelBtn.innerText = 'Cancelar';
        cancelBtn.onclick = () => { modal.style.display = 'none'; };
        list.appendChild(cancelBtn);

        modal.style.display = 'flex';
    }

    static openStealMegaStonePokemonSelection(cardId: string, targetId: number) {
        const Game = (window as any).Game;
        const target = Game.players.find((p: any) => p.id === targetId);
        if (!target) return;

        const modal = document.getElementById('pkmn-select-modal')!;
        const list = document.getElementById('pkmn-select-list')!;

        document.getElementById('select-title')!.innerText = `Escolha o Pokémon de ${target.name}:`;
        list.innerHTML = '';

        target.team.forEach((mon: any, index: number) => {
            const div = document.createElement('div');

            if (mon.megaStone) {
                if (mon.vinculoSupremo) {
                    div.className = `mon-select-item disabled`;
                    div.innerHTML = `<img src="${mon.getSprite()}" width="40" style="filter: grayscale(100%);"><b>${mon.name}</b> <small>Lv.${mon.level}</small><br><small style="color:#f1c40f">🤝 Vínculo Supremo (Protegido)</small>`;
                } else {
                    div.className = `mon-select-item`;
                    div.innerHTML = `<img src="${mon.getSprite()}" width="40"><b>${mon.name}</b> <small>Lv.${mon.level}</small><br><small style="color:#e74c3c">💎 Mega Pedra Alvo</small>`;
                    div.onclick = () => {
                        modal.style.display = 'none';
                        CardEffects.activate(cardId, { targetId, pokemonIndex: index });
                    };
                }
            } else {
                div.className = `mon-select-item disabled`;
                div.innerHTML = `<img src="${mon.getSprite()}" width="40" style="filter: grayscale(100%);"><b>${mon.name}</b> <small>Lv.${mon.level}</small><br><small style="color:#7f8c8d">Sem Mega Pedra</small>`;
            }
            list.appendChild(div);
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary mt-15';
        cancelBtn.innerText = 'Voltar';
        cancelBtn.onclick = () => { this.openStealMegaStoneTargetSelection(cardId); };
        list.appendChild(cancelBtn);

        modal.style.display = 'flex';
    }

    static openAshGoodbyeTargetSelection(cardId: string) {
        const Game = (window as any).Game;
        const currentPlayer = Game.getCurrentPlayer();

        const targets = Game.players.filter((p: any) => p.id !== currentPlayer.id);

        if (targets.length === 0) {
            Game.showGlobalAlert("Nenhum adversário encontrado!", currentPlayer.name, true, false);
            return;
        }

        const modal = document.getElementById('pkmn-select-modal')!;
        const list = document.getElementById('pkmn-select-list')!;

        const boardCardsModal = document.getElementById('board-cards-modal');
        if (boardCardsModal) boardCardsModal.style.display = 'none';

        document.getElementById('select-title')!.innerText = "Escolha de qual jogador mandar o Pokémon embora:";
        list.innerHTML = '';

        targets.forEach((target: any) => {
            const div = document.createElement('div');
            div.className = `mon-select-item`;

            div.innerHTML = `
                <img src="${target.avatar}" width="40" style="border-radius: 50%; border: 2px solid #ecf0f1;">
                <b>${target.name}</b> 
                <small style="color:#bdc3c7;">(P${target.id + 1})</small>
            `;

            div.onclick = () => {
                this.openAshGoodbyePokemonSelection(cardId, target.id);
            };
            list.appendChild(div);
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary mt-15';
        cancelBtn.innerText = 'Cancelar';
        cancelBtn.onclick = () => { modal.style.display = 'none'; };
        list.appendChild(cancelBtn);

        modal.style.display = 'flex';
    }

    static openAshGoodbyePokemonSelection(cardId: string, targetId: number) {
        const Game = (window as any).Game;
        const target = Game.players.find((p: any) => p.id === targetId);
        if (!target) return;

        const modal = document.getElementById('pkmn-select-modal')!;
        const list = document.getElementById('pkmn-select-list')!;

        document.getElementById('select-title')!.innerText = `Escolha o Pokémon de ${target.name} para dar o Adeus de Ash:`;
        list.innerHTML = '';

        target.team.forEach((mon: any, index: number) => {
            const div = document.createElement('div');

            if (target.team.length === 1) {
                div.className = `mon-select-item disabled`;
                div.innerHTML = `<img src="${mon.getSprite()}" width="40" style="filter: grayscale(100%);"><b>${mon.name}</b><br><small style="color:#e74c3c">Último Pokémon</small>`;
            } else {
                div.className = `mon-select-item`;
                div.innerHTML = `<img src="${mon.getSprite()}" width="40"><b>${mon.name}</b> <small>Lv.${mon.level}</small>`;
                div.onclick = () => {
                    modal.style.display = 'none';
                    CardEffects.activate(cardId, { targetId, pokemonIndex: index });
                };
            }
            list.appendChild(div);
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary mt-15';
        cancelBtn.innerText = 'Voltar';
        cancelBtn.onclick = () => { this.openAshGoodbyeTargetSelection(cardId); };
        list.appendChild(cancelBtn);

        modal.style.display = 'flex';
    }

    static openLegendaryEncounterSelection(options: any[]) {
        const Game = (window as any).Game;
        const modal = document.getElementById('pkmn-select-modal')!;
        const list = document.getElementById('pkmn-select-list')!;

        const boardCardsModal = document.getElementById('board-cards-modal');
        if (boardCardsModal) boardCardsModal.style.display = 'none';

        document.getElementById('select-title')!.innerText = "Encontro Lendário! Escolha um para lutar e capturar:";
        list.innerHTML = '';

        const globalAvg = Game.getGlobalAverageLevel ? Game.getGlobalAverageLevel() : 10;
        const maxLevelCap = Math.min(25, Math.max(1, globalAvg + 2));

        const PokemonClass = (window as any).Pokemon || Game.players[0].team[0].constructor;

        options.forEach((monTemplate: any) => {
            const wildMon = new PokemonClass(monTemplate.id, maxLevelCap);
            wildMon.vinculoSupremo = true;
            const isShiny = wildMon.isShiny;

            const div = document.createElement('div');
            div.className = `mon-select-item`;

            div.style.cssText = `
                display: flex; 
                align-items: center; 
                gap: 12px; 
                text-align: left; 
                width: 100%; 
                justify-content: flex-start;
                border: 1px solid ${isShiny ? '#f1c40f' : '#555'};
                background: ${isShiny ? 'rgba(241, 196, 15, 0.1)' : 'transparent'};
                padding: 8px;
                border-radius: 6px;
                box-sizing: border-box;
            `;

            div.innerHTML = `
                <img src="${wildMon.getSprite()}" width="50" style="object-fit:contain; filter: drop-shadow(0 0 3px ${isShiny ? '#f1c40f' : 'transparent'});">
                <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                        <b style="font-size:1.1rem; color:${isShiny ? '#f1c40f' : '#fff'};">${wildMon.name} ${isShiny ? '✨' : ''}</b>
                        <span style="font-size:0.9rem; font-weight:bold; color:#f1c40f; background:rgba(0,0,0,0.5); padding:2px 6px; border-radius:4px;">Lv.${wildMon.level}</span>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap:4px; font-size:0.8rem; color:#ecf0f1; background:rgba(0,0,0,0.3); padding:4px; border-radius:4px; text-align:center;">
                        <span title="HP">❤️ ${wildMon.maxHp}</span>
                        <span title="Ataque">⚔️ ${wildMon.atk}</span>
                        <span title="Defesa">🛡️ ${wildMon.def}</span>
                        <span title="Velocidade">💨 ${wildMon.speed}</span>
                    </div>
                </div>
            `;

            div.onclick = () => {
                modal.style.display = 'none';

                const currentPlayer = Game.getCurrentPlayer();
                currentPlayer.items['masterball'] = (currentPlayer.items['masterball'] || 0) + 1;
                Game.sendGlobalLog(`🎒 ${currentPlayer.name} recebeu uma Master Ball para tentar capturar ${wildMon.name}${isShiny ? ' ✨' : ''}!`);

                const Network = (window as any).Network || { isOnline: false };
                if (Network.isOnline && typeof Network.syncPlayerState === 'function') {
                    Network.syncPlayerState();
                }

                const Battle = (window as any).Battle;
                Battle.setup(currentPlayer, wildMon, false, "Selvagem", 0, null, false, 0, "", 1);
            };
            list.appendChild(div);
        });

        modal.style.display = 'flex';
    }

    static showBallChoice(balls: any[]) {
        let modal = document.getElementById('ball-choice-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ball-choice-modal';
            modal.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); display:flex; justify-content:center; align-items:center; z-index:9999;";
            document.body.appendChild(modal);
        }

        let buttonsHTML = '';
        balls.forEach(b => {
            buttonsHTML += `<button class="btn" style="margin:5px; padding:15px 30px; background:#e74c3c;" onclick="window.Cards.executeMasterCard('${b.id}')">🎒 ${b.name} (x${b.count})</button>`;
        });

        buttonsHTML += `<button class="btn btn-secondary" style="margin-top:15px;" onclick="document.getElementById('ball-choice-modal').style.display='none'">Cancelar</button>`;

        modal.innerHTML = `
            <div style="background:#2b2d42; border:3px solid #8d99ae; border-radius:12px; padding:25px; color:white; text-align:center; box-shadow:0 10px 25px rgba(0,0,0,0.8);">
                <h3 style="margin-top:0; color:#edf2f4; border-bottom:1px solid #8d99ae; padding-bottom:10px;">Infundir Pokébola</h3>
                <p>A magia da carta Master Ball garantirá 100% de captura.<br>Qual bola deseja sacrificar?</p>
                <div style="display:flex; flex-direction:column; gap:10px; margin-top:20px; align-items:center;">
                    ${buttonsHTML}
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    }

    static startTradeFlow(player: any, target: any) {
        const modal = document.getElementById('pkmn-select-modal')!;
        const list = document.getElementById('pkmn-select-list')!;

        document.getElementById('select-title')!.innerText = `Escolha o SEU Pokémon para enviar a ${target.name}:`;
        list.innerHTML = '';

        player.team.forEach((mon: any, index: number) => {
            const div = document.createElement('div');
            div.className = `mon-select-item`;
            div.innerHTML = `<img src="${mon.getSprite()}" width="40"><b>${mon.name}</b> <small>Lv.${mon.level}</small>`;
            div.onclick = () => {
                this.continueTradeFlow(player, target, index);
            };
            list.appendChild(div);
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary mt-15';
        cancelBtn.innerText = 'Cancelar';
        cancelBtn.onclick = () => { modal.style.display = 'none'; };
        list.appendChild(cancelBtn);

        modal.style.display = 'flex';
    }

    static continueTradeFlow(player: any, target: any, myChoice: number) {
        const modal = document.getElementById('pkmn-select-modal')!;
        const list = document.getElementById('pkmn-select-list')!;

        document.getElementById('select-title')!.innerText = `Escolha o Pokémon de ${target.name} que você vai pegar:`;
        list.innerHTML = '';

        target.team.forEach((mon: any, index: number) => {
            const div = document.createElement('div');
            div.className = `mon-select-item`;
            div.innerHTML = `<img src="${mon.getSprite()}" width="40"><b>${mon.name}</b> <small>Lv.${mon.level}</small>`;
            div.onclick = () => {
                modal.style.display = 'none';
                CardEffects.executeTrade(player, target, myChoice, index);
            };
            list.appendChild(div);
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary mt-15';
        cancelBtn.innerText = 'Cancelar Voltar';
        cancelBtn.onclick = () => { modal.style.display = 'none'; };
        list.appendChild(cancelBtn);
    }

    static startNPCBattleTradeFlow(player: any) {
        const modal = document.getElementById('pkmn-select-modal')!;
        const list = document.getElementById('pkmn-select-list')!;

        document.getElementById('select-title')!.innerText = `Sequestro: Qual SEU Pokemon voce vai entregar?`;
        list.innerHTML = '';

        player.team.forEach((mon: any, index: number) => {
            const div = document.createElement('div');
            if (mon.isTemp || mon.isMegaEvolution) {
                div.className = `mon-select-item disabled`;
                div.innerHTML = `<img src="${mon.getSprite()}" width="40" style="filter: grayscale(100%);"><b>${mon.name}</b> <small style="color:red;">Bloqueado</small>`;
            } else {
                div.className = `mon-select-item`;
                div.innerHTML = `<img src="${mon.getSprite()}" width="40"><b>${mon.name}</b> <small>Lv.${mon.level}</small>`;
                div.onclick = () => {
                    this.continueNPCBattleTradeFlow(player, index);
                };
            }
            list.appendChild(div);
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary mt-15';
        cancelBtn.innerText = 'Cancelar';
        cancelBtn.onclick = () => { modal.style.display = 'none'; };
        list.appendChild(cancelBtn);

        modal.style.display = 'flex';
    }

    static continueNPCBattleTradeFlow(player: any, myChoice: number) {
        const Battle = (window as any).Battle;
        const modal = document.getElementById('pkmn-select-modal')!;
        const list = document.getElementById('pkmn-select-list')!;

        document.getElementById('select-title')!.innerText = `Sequestro: Qual Pokemon INIMIGO voce vai levar?`;
        list.innerHTML = '';

        Battle.oppTeamList.forEach((mon: any, index: number) => {
            const div = document.createElement('div');
            if (mon.isTemp || mon.isMegaEvolution) {
                div.className = `mon-select-item disabled`;
                div.innerHTML = `<img src="${mon.getSprite()}" width="40" style="filter: grayscale(100%);"><b>${mon.name}</b> <small style="color:red;">Bloqueado</small>`;
            } else {
                div.className = `mon-select-item`;
                div.innerHTML = `<img src="${mon.getSprite()}" width="40"><b>${mon.name}</b> <small>Lv.${mon.level}</small>`;
                div.onclick = () => {
                    modal.style.display = 'none';
                    CardEffects.executeNPCBattleTrade(player, myChoice, index);
                };
            }
            list.appendChild(div);
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary mt-15';
        cancelBtn.innerText = 'Voltar';
        cancelBtn.onclick = () => { this.startNPCBattleTradeFlow(player); };
        list.appendChild(cancelBtn);
    }

    static openTypeSelection(cardId: string) {
        const modal = document.getElementById('type-selection-modal')!;
        const grid = document.getElementById('type-selection-grid')!;

        const typeColors: { [key: string]: string } = {
            'Normal': '#A8A878', 'Fogo': '#F08030', 'Água': '#6890F0', 'Elétrico': '#F8D030',
            'Grama': '#78C850', 'Gelo': '#98D8D8', 'Lutador': '#C03028', 'Veneno': '#A040A0',
            'Terra': '#E0C068', 'Voador': '#A890F0', 'Psíquico': '#F85888', 'Inseto': '#A8B820',
            'Pedra': '#B8A038', 'Fantasma': '#705898', 'Dragão': '#7038F8', 'Noturno': '#705848',
            'Aço': '#B8B8D0', 'Fada': '#EE99AC'
        };

        grid.innerHTML = '';
        Object.keys(typeColors).forEach(type => {
            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.style.background = typeColors[type];
            btn.style.fontSize = '0.75rem';
            btn.style.padding = '10px 5px';
            btn.style.border = '2px solid rgba(0,0,0,0.2)';
            btn.innerText = type;
            btn.onclick = () => {
                modal.style.display = 'none';
                CardEffects.activate(cardId, type);
            };
            grid.appendChild(btn);
        });

        modal.style.display = 'flex';
    }

    static openSacrificeModal() {
        const Game = (window as any).Game;
        const Network = (window as any).Network;
        const player = Game.getCurrentPlayer();

        if (Network.isOnline && player.id !== Network.myPlayerId) return alert("Você só pode sacrificar cartas no seu próprio turno!");
        if (!Game.canAct()) return alert("Aguarde sua vez para realizar ações.");
        if (player.cards.length < 2) return alert("Você precisa de pelo menos 2 cartas para realizar um sacrifício.");

        const list = document.getElementById('board-inventory-list')!;
        const modal = document.getElementById('board-inventory-modal') || document.getElementById('board-cards-modal');

        if (modal) modal.style.display = 'flex';
        list.innerHTML = `<h3 style="width:100%; text-align:center; color:#e74c3c;">Selecione 2 Cartas para Sacrificar</h3>
                          <div id="sacrifice-counter" style="width:100%; text-align:center; margin-bottom:10px;">Selecionado: 0/2</div>`;

        player.cards.forEach((c: any, index: number) => {
            if (c.isProtected) return;
            const d = document.createElement('div');
            d.className = 'card-item';
            let rarityColor = '#bdc3c7';
            if (c.rarity === 'Épica') rarityColor = '#9b59b6';
            if (c.rarity === 'Rara') rarityColor = '#3498db';
            if (c.rarity === 'Incomum') rarityColor = '#2ecc71';

            d.innerHTML = `
                <div class="card-info" style="display:flex; align-items:center; gap:10px;">
                    <input type="checkbox" class="sacrifice-checkbox" data-index="${index}" style="transform: scale(1.5); cursor:pointer;" onchange="window.Cards.updateSacrificeCount()">
                    <span class="card-name">${c.icon} ${c.name} <span style="font-size: 0.7rem; color: #fff; background: ${rarityColor}; padding: 2px 6px; border-radius: 4px; margin-left: 5px;">${c.rarity.toUpperCase()}</span></span>
                </div>
            `;
            list.appendChild(d);
        });

        const btnContainer = document.createElement('div');
        btnContainer.style.width = '100%';
        btnContainer.style.textAlign = 'center';
        btnContainer.style.marginTop = '15px';
        btnContainer.innerHTML = `
            <button class="btn" style="background-color:#e67e22;" onclick="window.Cards.confirmSacrifice()">🔥 SACRIFICAR</button>
            <button class="btn btn-secondary" onclick="document.getElementById('${modal?.id}').style.display='none'">Cancelar</button>
        `;
        list.appendChild(btnContainer);

        (window as any).Cards.updateSacrificeCount = () => {
            const checks = document.querySelectorAll('.sacrifice-checkbox:checked');
            const counter = document.getElementById('sacrifice-counter');
            if (counter) counter.innerText = `Selecionado: ${checks.length}/2`;
            if (checks.length > 2) {
                alert("Selecione apenas 2 cartas!");
                (window.event?.target as HTMLInputElement).checked = false;
                if (counter) counter.innerText = `Selecionado: 2/2`;
            }
        };
    }

    static openMergeModal() {
        const Game = (window as any).Game;
        const Network = (window as any).Network;
        const player = Game.getCurrentPlayer();

        if (Network.isOnline && player.id !== Network.myPlayerId) return alert("Você só pode fundir cartas no seu próprio turno!");
        if (!Game.canAct()) return alert("Aguarde sua vez para realizar ações.");
        if (player.cards.length < 4) return alert("Você precisa de pelo menos 4 cartas para realizar uma fusão.");

        const list = document.getElementById('board-inventory-list')!;
        const modal = document.getElementById('board-inventory-modal') || document.getElementById('board-cards-modal');

        if (modal) modal.style.display = 'flex';
        list.innerHTML = `<h3 style="width:100%; text-align:center; color:#2ecc71;">Selecione 4 Cartas da MESMA raridade</h3>
                          <p style="width:100%; text-align:center; font-size:0.8rem; color:#7f8c8d; margin-top:-10px;">Fundir 4 cartas aumenta a raridade em +1 nível.</p>
                          <div id="merge-counter" style="width:100%; text-align:center; margin-bottom:10px;">Selecionado: 0/4</div>`;

        player.cards.forEach((c: any, index: number) => {
            if (c.isProtected) return;
            const d = document.createElement('div');
            d.className = 'card-item';
            let rarityColor = '#bdc3c7';
            if (c.rarity === 'Épica') rarityColor = '#9b59b6';
            if (c.rarity === 'Rara') rarityColor = '#3498db';
            if (c.rarity === 'Incomum') rarityColor = '#2ecc71';
            if (c.rarity === 'Lendária') rarityColor = '#f1c40f';

            d.innerHTML = `
                <div class="card-info" style="display:flex; align-items:center; gap:10px;">
                    <input type="checkbox" class="merge-checkbox" data-index="${index}" style="transform: scale(1.5); cursor:pointer;" onchange="window.Cards.updateMergeCount()">
                    <span class="card-name">${c.icon} ${c.name} <span style="font-size: 0.7rem; color: #fff; background: ${rarityColor}; padding: 2px 6px; border-radius: 4px; margin-left: 5px;">${c.rarity.toUpperCase()}</span></span>
                </div>
            `;
            list.appendChild(d);
        });

        const btnContainer = document.createElement('div');
        btnContainer.style.width = '100%';
        btnContainer.style.textAlign = 'center';
        btnContainer.style.marginTop = '15px';
        btnContainer.innerHTML = `
            <button class="btn" style="background-color:#2ecc71;" onclick="window.Cards.confirmMerge()">💎 FUNDIR CARTAS</button>
            <button class="btn btn-secondary" onclick="document.getElementById('${modal?.id}').style.display='none'">Cancelar</button>
        `;
        list.appendChild(btnContainer);

        (window as any).Cards.updateMergeCount = () => {
            const checks = document.querySelectorAll('.merge-checkbox:checked');
            const counter = document.getElementById('merge-counter');
            if (counter) counter.innerText = `Selecionado: ${checks.length}/4`;
            if (checks.length > 4) {
                alert("Selecione apenas 4 cartas!");
                (window.event?.target as HTMLInputElement).checked = false;
                if (counter) counter.innerText = `Selecionado: 4/4`;
            }
        };
    }

    static openProtectCardSelection(cardId: string) {
        const Game = (window as any).Game;
        const player = Game.getCurrentPlayer();
        const list = document.getElementById('board-inventory-list')!;
        
        const boardCardsModal = document.getElementById('board-cards-modal');
        if (boardCardsModal) boardCardsModal.style.display = 'none';

        const modal = document.getElementById('board-inventory-modal') || boardCardsModal;

        if (modal) modal.style.display = 'flex';
        list.innerHTML = `<h3 style="width:100%; text-align:center; color:#f1c40f;">Selecione uma Carta para Proteger</h3>
                          <p style="width:100%; text-align:center; font-size:0.8rem; color:#7f8c8d; margin-top:-10px;">Cartas protegidas não podem ser usadas até serem desprotegidas.</p>`;

        let hasProtectable = false;
        player.cards.forEach((c: any, index: number) => {
            const d = document.createElement('div');
            
            if (c.id === 'card_protector') {
                d.className = 'card-item disabled';
                d.innerHTML = `<span class="card-name" style="filter: grayscale(100%);">${c.icon} ${c.name} <small style="color:#e74c3c">(Não aplicável)</small></span>`;
            } else if (c.isProtected) {
                d.className = 'card-item disabled';
                d.innerHTML = `<span class="card-name">${c.icon} ${c.name} <small style="color:#f1c40f">🔒 Já Protegida</small></span>`;
            } else {
                hasProtectable = true;
                d.className = 'card-item';
                d.style.cursor = 'pointer';
                d.innerHTML = `<span class="card-name">${c.icon} ${c.name}</span>`;
                d.onclick = () => {
                    if (modal) modal.style.display = 'none';
                    const CardEffects = (window as any).Cards || (window as any).CardEffects;
                    if (CardEffects.activate) {
                        CardEffects.activate(cardId, index);
                    } else if (CardEffects.CardEffects && CardEffects.CardEffects.activate) {
                        CardEffects.CardEffects.activate(cardId, index);
                    } else {
                        import('./CardEffects').then(m => m.CardEffects.activate(cardId, index));
                    }
                };
            }
            list.appendChild(d);
        });

        if (!hasProtectable) {
            alert("Você não tem cartas válidas para proteger!");
            if (modal) modal.style.display = 'none';
            return;
        }

        const btnContainer = document.createElement('div');
        btnContainer.style.width = '100%';
        btnContainer.style.textAlign = 'center';
        btnContainer.style.marginTop = '15px';
        btnContainer.innerHTML = `
            <button class="btn btn-secondary" onclick="document.getElementById('${modal?.id}').style.display='none'">Cancelar</button>
        `;
        list.appendChild(btnContainer);
    }

    static showRevealedCards(target: any, cards: any[]) {
        const modal = document.getElementById('pkmn-select-modal')!;
        const list = document.getElementById('pkmn-select-list')!;

        document.getElementById('select-title')!.innerText = `Cartas de ${target.name}:`;
        list.innerHTML = '';

        cards.forEach((c: any) => {
            const div = document.createElement('div');
            div.className = `mon-select-item disabled`;
            div.style.flexDirection = 'column';
            div.style.alignItems = 'center';
            div.style.padding = '15px';
            div.style.gap = '10px';

            const rData = CARD_RARITIES[c.rarity];
            const rarityColor = rData ? rData.color : '#bdc3c7';

            div.innerHTML = `
                <div style="font-weight: bold; color: ${rarityColor}; text-transform: uppercase; font-size: 0.7rem; border: 1px solid ${rarityColor}; padding: 2px 6px; border-radius: 10px;">${c.rarity}</div>
                <img src="/assets/img/Cartas/${c.id}.jpg" style="width: 120px; border-radius: 8px; border: 3px solid ${rarityColor}; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
                <div style="font-weight: bold; font-size: 1rem; color: #fff;">${c.icon} ${c.name}</div>
                <div style="font-size: 0.75rem; color: #bdc3c7; text-align: center; max-width: 150px;">${c.desc}</div>
                ${c.isProtected ? '<div style="color: #f1c40f; font-size: 0.8rem; font-weight: bold; margin-top: 5px;">🔒 PROTEGIDA</div>' : ''}
            `;
            list.appendChild(div);
        });

        const okBtn = document.createElement('button');
        okBtn.className = 'btn btn-secondary mt-15';
        okBtn.innerText = 'Entendido';
        okBtn.onclick = () => { modal.style.display = 'none'; };
        list.appendChild(okBtn);

        modal.style.display = 'flex';
    }

    static openEventSelection(cardId: string) {
        const modal = document.getElementById('event-selection-modal')!;
        const list = document.getElementById('event-selection-list')!;

        const boardCardsModal = document.getElementById('board-cards-modal');
        if (boardCardsModal) boardCardsModal.style.display = 'none';

        list.innerHTML = '';

        GLOBAL_EVENTS.forEach((ev: any) => {
            const div = document.createElement('div');
            div.className = 'mon-select-item';
            div.style.cssText = `
                display: flex; 
                flex-direction: column; 
                align-items: flex-start; 
                gap: 5px; 
                padding: 12px; 
                border: 1px solid #444; 
                border-radius: 8px; 
                background: rgba(255,255,255,0.03); 
                cursor: pointer; 
                transition: background 0.2s, border-color 0.2s;
                text-align: left;
                width: 100%;
                box-sizing: border-box;
            `;

            div.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.4rem;">${ev.icon}</span>
                    <b style="font-size: 1.1rem; color: #f1c40f;">${ev.name}</b>
                </div>
                <div style="font-size: 0.8rem; color: #ccc; line-height: 1.3;">${ev.desc}</div>
            `;

            div.onmouseover = () => {
                div.style.background = 'rgba(241, 196, 15, 0.1)';
                div.style.borderColor = '#f1c40f';
            };
            div.onmouseout = () => {
                div.style.background = 'rgba(255,255,255,0.03)';
                div.style.borderColor = '#444';
            };

            div.onclick = () => {
                modal.style.display = 'none';
                CardEffects.activate(cardId, ev.id);
            };

            list.appendChild(div);
        });

        modal.style.display = 'flex';
    }
}