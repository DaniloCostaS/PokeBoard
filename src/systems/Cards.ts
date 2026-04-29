import { CARDS_DB } from '../constants';
import type { Player } from '../models/Player';
import { MapSystem } from './MapSystem';

export class Cards {
    // =========================================================================================
    //  SISTEMA DE SACRIFÍCIO (CRAFTING)
    // =========================================================================================
    // 1. Abre o modal para selecionar as cartas
    static openSacrificeModal() {
        const Game = (window as any).Game;
        const Network = (window as any).Network;
        const player = Game.getCurrentPlayer();

        // Validação de Turno e Jogador
        if (Network.isOnline && player.id !== Network.myPlayerId) {
            return alert("Você só pode sacrificar cartas no seu próprio turno!");
        }
        if (!Game.canAct()) {
            return alert("Aguarde sua vez para realizar ações.");
        }

        // Validação mínima de cartas
        if (player.cards.length < 2) {
            return alert("Você precisa de pelo menos 2 cartas para realizar um sacrifício.");
        }

        const list = document.getElementById('board-inventory-list')!;
        const modal = document.getElementById('board-inventory-modal') || document.getElementById('board-cards-modal');

        // Limpa e prepara título
        if (modal) modal.style.display = 'flex';
        list.innerHTML = `<h3 style="width:100%; text-align:center; color:#e74c3c;">Selecione 2 Cartas para Sacrificar</h3>
                          <div id="sacrifice-counter" style="width:100%; text-align:center; margin-bottom:10px;">Selecionado: 0/2</div>`;

        player.cards.forEach((c: any, index: number) => {
            const d = document.createElement('div');
            d.className = 'card-item';
            // Adiciona Checkbox
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

        // Botão de Confirmar
        const btnContainer = document.createElement('div');
        btnContainer.style.width = '100%';
        btnContainer.style.textAlign = 'center';
        btnContainer.style.marginTop = '15px';
        btnContainer.innerHTML = `
            <button class="btn" style="background-color:#e67e22;" onclick="window.Cards.confirmSacrifice()">🔥 SACRIFICAR</button>
            <button class="btn btn-secondary" onclick="document.getElementById('${modal?.id}').style.display='none'">Cancelar</button>
        `;
        list.appendChild(btnContainer);

        // Expõe função auxiliar para o checkbox 
        (window as any).Cards.updateSacrificeCount = () => {
            const checks = document.querySelectorAll('.sacrifice-checkbox:checked');
            const counter = document.getElementById('sacrifice-counter');
            if (counter) counter.innerText = `Selecionado: ${checks.length}/2`;

            // Impede selecionar mais de 2
            if (checks.length > 2) {
                alert("Selecione apenas 2 cartas!");
                (window.event?.target as HTMLInputElement).checked = false;
                if (counter) counter.innerText = `Selecionado: 2/2`;
            }
        };
    }

    // 2. Executa a Lógica do Sacrifício
    static async confirmSacrifice() {
        const Game = (window as any).Game;
        const Network = (window as any).Network;
        const CARDS_DB = (await import('../constants')).CARDS_DB;
        const player = Game.getCurrentPlayer();

        // Coleta índices selecionados
        const checkboxes = document.querySelectorAll('.sacrifice-checkbox:checked');
        if (checkboxes.length !== 2) {
            return alert("Você deve selecionar EXATAMENTE 2 cartas.");
        }

        const indicesToRemove: number[] = [];
        checkboxes.forEach((cb: any) => indicesToRemove.push(parseInt(cb.getAttribute('data-index'))));

        // Ordena decrescente para remover do array sem alterar os índices dos próximos
        indicesToRemove.sort((a, b) => b - a);

        // LÓGICA LOCAL (Pré-visualização imediata)
        const removedIds: string[] = [];
        const removedNames: string[] = [];
        const removedRarities: string[] = [];

        // Remove cartas (do maior índice para o menor)
        indicesToRemove.forEach(idx => {
            if (player.cards[idx]) {
                removedIds.push(player.cards[idx].id);
                removedNames.push(player.cards[idx].name);
                removedRarities.push(player.cards[idx].rarity);
                player.cards.splice(idx, 1);
            }
        });

        const validPool = CARDS_DB.filter((c: any) => c.id !== 'master');

        let targetRarity: string | undefined = undefined;
        if (removedRarities.length === 2 && removedRarities[0] === 'Épica' && removedRarities[1] === 'Épica') {
            targetRarity = 'Épica';
        }

        if (!targetRarity) {
            const roll = Math.floor(Math.random() * 100) + 1;
            if (roll <= 8) targetRarity = 'Épica';
            else if (roll <= 26) targetRarity = 'Rara';
            else if (roll <= 54) targetRarity = 'Incomum';
            else targetRarity = 'Comum';
        }

        const possibleCards = validPool.filter((c: any) => c.rarity === targetRarity);
        let finalPool = possibleCards.length > 0 ? possibleCards : validPool;

        // --- NOVO FILTRO: Não permitir vir a mesma carta que foi sacrificada ---
        const filteredPool = finalPool.filter((c: any) => !removedIds.includes(c.id));
        if (filteredPool.length > 0) finalPool = filteredPool;

        const newCard = finalPool[Math.floor(Math.random() * finalPool.length)];

        player.cards.push(newCard);

        // Fecha modal e Atualiza HUD
        const modal = document.getElementById('board-inventory-modal') || document.getElementById('board-cards-modal');
        if (modal) modal.style.display = 'none';
        Game.updateHUD();

        const logMsg = `🔥 ${player.name} sacrificou [${removedNames.join(', ')}] e invocou uma nova carta: [${newCard.name}]!`;
        const logMsgGlobal = `🔥 ${player.name} sacrificou duas cartas e invocou uma nova carta!`;

        Game.log(logMsg);
        Game.showGlobalAlert(logMsg, player.name, true, false);

        // LÓGICA DE REDE (UPDATE ATÔMICO)
        if (Network.isOnline) {
            const { ref, update, getDatabase } = await import('firebase/database');
            const db = getDatabase();

            const updates: any = {};
            const roomPath = `rooms/${Network.currentRoomId}`;

            updates[`${roomPath}/players/${player.id}/cards`] = player.cards;

            await update(ref(db), updates);

            Network.sendAction('LOG', { msg: logMsgGlobal });
            Network.sendAction('SHOW_ALERT', { msg: logMsgGlobal, playerName: player.name, endsTurn: false });

            Network.syncPlayerState();
        }
    }

    // =========================================================================================
    //  SISTEMA DE FUSÃO (MERGE)
    // =========================================================================================
    // 1. Abre o modal para selecionar as cartas para fusão
    static openMergeModal() {
        const Game = (window as any).Game;
        const Network = (window as any).Network;
        const player = Game.getCurrentPlayer();

        // Validação de Turno e Jogador
        if (Network.isOnline && player.id !== Network.myPlayerId) {
            return alert("Você só pode fundir cartas no seu próprio turno!");
        }
        if (!Game.canAct()) {
            return alert("Aguarde sua vez para realizar ações.");
        }

        // Validação mínima de cartas
        if (player.cards.length < 3) {
            return alert("Você precisa de pelo menos 3 cartas para realizar uma fusão.");
        }

        const list = document.getElementById('board-inventory-list')!;
        const modal = document.getElementById('board-inventory-modal') || document.getElementById('board-cards-modal');

        // Limpa e prepara título
        if (modal) modal.style.display = 'flex';
        list.innerHTML = `<h3 style="width:100%; text-align:center; color:#2ecc71;">Selecione 3 Cartas da MESMA raridade</h3>
                          <p style="width:100%; text-align:center; font-size:0.8rem; color:#7f8c8d; margin-top:-10px;">Fundir 3 cartas aumenta a raridade em +1 nível.</p>
                          <div id="merge-counter" style="width:100%; text-align:center; margin-bottom:10px;">Selecionado: 0/3</div>`;

        player.cards.forEach((c: any, index: number) => {
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

        // Botão de Confirmar
        const btnContainer = document.createElement('div');
        btnContainer.style.width = '100%';
        btnContainer.style.textAlign = 'center';
        btnContainer.style.marginTop = '15px';
        btnContainer.innerHTML = `
            <button class="btn" style="background-color:#2ecc71;" onclick="window.Cards.confirmMerge()">💎 FUNDIR CARTAS</button>
            <button class="btn btn-secondary" onclick="document.getElementById('${modal?.id}').style.display='none'">Cancelar</button>
        `;
        list.appendChild(btnContainer);

        // Expõe função auxiliar para o checkbox 
        (window as any).Cards.updateMergeCount = () => {
            const checks = document.querySelectorAll('.merge-checkbox:checked');
            const counter = document.getElementById('merge-counter');
            if (counter) counter.innerText = `Selecionado: ${checks.length}/3`;

            // Impede selecionar mais de 3
            if (checks.length > 3) {
                alert("Selecione apenas 3 cartas!");
                (window.event?.target as HTMLInputElement).checked = false;
                if (counter) counter.innerText = `Selecionado: 3/3`;
            }
        };
    }

    // 2. Executa a Lógica da Fusão
    static async confirmMerge() {
        const Game = (window as any).Game;
        const Network = (window as any).Network;
        const CARDS_DB = (await import('../constants')).CARDS_DB;
        const player = Game.getCurrentPlayer();

        // Coleta índices selecionados
        const checkboxes = document.querySelectorAll('.merge-checkbox:checked');
        if (checkboxes.length !== 3) {
            return alert("Você deve selecionar EXATAMENTE 3 cartas.");
        }

        const indicesToRemove: number[] = [];
        checkboxes.forEach((cb: any) => indicesToRemove.push(parseInt(cb.getAttribute('data-index'))));

        // Validação de Raridade (Todas devem ser iguais)
        const rarities = indicesToRemove.map(idx => player.cards[idx].rarity);
        if (rarities[0] !== rarities[1] || rarities[1] !== rarities[2]) {
            return alert("As 3 cartas selecionadas devem ter a mesma raridade para serem fundidas!");
        }

        const baseRarity = rarities[0];
        let targetRarity = "";

        if (baseRarity === 'Comum') targetRarity = 'Incomum';
        else if (baseRarity === 'Incomum') targetRarity = 'Rara';
        else if (baseRarity === 'Rara') targetRarity = 'Épica';
        else if (baseRarity === 'Épica') targetRarity = 'Lendária';
        else if (baseRarity === 'Lendária') {
            return alert("Cartas Lendárias já estão no nível máximo e não podem ser fundidas para uma raridade superior.");
        }

        // Ordena decrescente para remover do array sem alterar os índices dos próximos
        indicesToRemove.sort((a, b) => b - a);

        const removedNames: string[] = [];
        const removedIds: string[] = [];

        // Remove cartas (do maior índice para o menor)
        indicesToRemove.forEach(idx => {
            if (player.cards[idx]) {
                removedNames.push(player.cards[idx].name);
                removedIds.push(player.cards[idx].id);
                player.cards.splice(idx, 1);
            }
        });

        // Sorteia nova carta da raridade alvo
        const possibleCards = CARDS_DB.filter((c: any) => c.rarity === targetRarity);
        const finalPool = possibleCards.length > 0 ? possibleCards : CARDS_DB;
        
        // Filtro para não vir uma das que foram fundidas (embora a raridade mude, por segurança)
        const filteredPool = finalPool.filter((c: any) => !removedIds.includes(c.id));
        const finalFinalPool = filteredPool.length > 0 ? filteredPool : finalPool;

        const newCard = finalFinalPool[Math.floor(Math.random() * finalFinalPool.length)];

        player.cards.push(newCard);

        // Fecha modal e Atualiza HUD
        const modal = document.getElementById('board-inventory-modal') || document.getElementById('board-cards-modal');
        if (modal) modal.style.display = 'none';
        Game.updateHUD();

        const logMsg = `💎 ${player.name} fundiu 3 cartas [${baseRarity}] e obteve uma nova carta [${targetRarity}]: [${newCard.name}]!`;
        const logMsgGlobal = `💎 ${player.name} fundiu 3 cartas e obteve uma [${targetRarity}]!`;

        Game.log(logMsg);
        Game.showGlobalAlert(logMsg, player.name, true, false);

        // LÓGICA DE REDE (UPDATE ATÔMICO)
        if (Network.isOnline) {
            const { ref, update, getDatabase } = await import('firebase/database');
            const db = getDatabase();

            const updates: any = {};
            const roomPath = `rooms/${Network.currentRoomId}`;

            updates[`${roomPath}/players/${player.id}/cards`] = player.cards;

            await update(ref(db), updates);

            Network.sendAction('LOG', { msg: logMsgGlobal });
            Network.sendAction('SHOW_ALERT', { msg: logMsgGlobal, playerName: player.name, endsTurn: false });

            Network.syncPlayerState();
        }
    }

    static draw(player: Player, silentLog: boolean = false) {
        const Game = (window as any).Game;
        const Network = (window as any).Network;

        const resultChance = Math.floor(Math.random() * 100) + 1;
        let targetRarity = 'Comum';

        const canGetLegendary = (!player.effects || !player.effects.playedLegendary) && !player.cards.some((c: any) => c.rarity === 'Lendária');

        if (canGetLegendary && resultChance <= 1) {
            targetRarity = 'Lendária';
        } else if (resultChance <= 8) {
            targetRarity = 'Épica';
        } else if (resultChance <= 26) {
            targetRarity = 'Rara';
        } else if (resultChance <= 54) {
            targetRarity = 'Incomum';
        }

        const possibleCards = CARDS_DB.filter(c => c.rarity === targetRarity);
        const finalPool = possibleCards.length > 0 ? possibleCards : CARDS_DB;
        const card = finalPool[Math.floor(Math.random() * finalPool.length)];

        player.cards.push(card);

        if (!silentLog) {
            const isMe = !Network.isOnline || player.id === Network.myPlayerId;
            if (isMe) {
                Game.log(`🃏 Você obteve a carta: ${card.icon} ${card.name}`);
                if (Network.isOnline) {
                    Network.sendAction('LOG', { msg: `🃏 ${player.name} obteve uma Carta Misteriosa!` });
                }
            }
        }

        Game.updateHUD();
        if (Network.isOnline) Network.syncPlayerState();

        return card;
    }

    static showPlayerCards(playerId: number) { const Game = (window as any).Game; Game.openBoardCards(playerId); }

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

        // Oculta a tela principal de cartas de tabuleiro por segurança
        const boardCardsModal = document.getElementById('board-cards-modal');
        if (boardCardsModal) boardCardsModal.style.display = 'none';

        document.getElementById('select-title')!.innerText = "Selecione o Jogador Alvo:";
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
                modal.style.display = 'none';
                this.activate(cardId, target.id);
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
            div.innerHTML = `<img src="${mon.getSprite()}" width="40"><b>${mon.name}</b> <small>Lv.${mon.level}</small><br><small style="color:#f1c40f">XP: ${mon.currentXp}/${mon.maxXp}</small>`;

            div.onclick = () => {
                modal.style.display = 'none';
                this.activate(cardId, index);
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

            if (canEvolve) {
                div.className = `mon-select-item`;
                div.innerHTML = `<img src="${mon.getSprite()}" width="40"><b>${mon.name}</b> <small>Lv.${mon.level}</small><br><small style="color:#2ecc71">🧬 Evolução Disponível!</small>`;
                div.onclick = () => {
                    modal.style.display = 'none';
                    this.activate(cardId, index);
                };
            } else {
                div.className = `mon-select-item disabled`;
                div.innerHTML = `<img src="${mon.getSprite()}" width="40" style="filter: grayscale(100%);"><b>${mon.name}</b> <small>Lv.${mon.level}</small><br><small style="color:#e74c3c">Estágio Máximo</small>`;
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
        const { MAPA_MEGAS } = await import('../constants/mapaMegas');

        const boardCardsModal = document.getElementById('board-cards-modal');
        if (boardCardsModal) boardCardsModal.style.display = 'none';

        document.getElementById('select-title')!.innerText = "Equipar Mega Pedra em quem?";
        list.innerHTML = '';

        player.team.forEach((mon: any, index: number) => {
            const div = document.createElement('div');
            const canMega = !!MAPA_MEGAS[mon.id];

            if (canMega) {
                if (mon.megaStone) {
                    div.className = `mon-select-item disabled`;
                    div.innerHTML = `<img src="${mon.getSprite()}" width="40"><b>${mon.name}</b><br><small style="color:#f1c40f">💎 Já Equipado</small>`;
                } else {
                    div.className = `mon-select-item`;
                    div.innerHTML = `<img src="${mon.getSprite()}" width="40"><b>${mon.name}</b><br><small style="color:#2ecc71">Compatível!</small>`;
                    div.onclick = () => {
                        modal.style.display = 'none';
                        this.activate(cardId, index);
                    };
                }
            } else {
                div.className = `mon-select-item disabled`;
                div.innerHTML = `<img src="${mon.getSprite()}" width="40" style="filter: grayscale(100%); opacity:0.6;"><b>${mon.name}</b><br><small style="color:#e74c3c">Incompatível</small>`;
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

            if (mon.megaStone) {
                hasMega = true;
                div.className = `mon-select-item`;
                div.innerHTML = `<img src="${mon.getSprite()}" width="40"><b>${mon.name}</b> <small>Lv.${mon.level}</small><br><small style="color:#2ecc71">💎 Mega Pedra Equipada!</small>`;
                div.onclick = () => {
                    modal.style.display = 'none';
                    this.activate(cardId, index);
                };
            } else {
                div.className = `mon-select-item disabled`;
                div.innerHTML = `<img src="${mon.getSprite()}" width="40" style="filter: grayscale(100%);"><b>${mon.name}</b> <small>Lv.${mon.level}</small><br><small style="color:#e74c3c">Sem Mega Pedra</small>`;
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
            p.id !== currentPlayer.id && p.team.some((mon: any) => mon.megaStone)
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
                div.className = `mon-select-item`;
                div.innerHTML = `<img src="${mon.getSprite()}" width="40"><b>${mon.name}</b> <small>Lv.${mon.level}</small><br><small style="color:#e74c3c">💎 Mega Pedra Alvo</small>`;
                div.onclick = () => {
                    modal.style.display = 'none';
                    this.activate(cardId, { targetId, pokemonIndex: index });
                };
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
                    this.activate(cardId, { targetId, pokemonIndex: index });
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

        options.forEach((monTemplate: any) => {
            const div = document.createElement('div');
            div.className = `mon-select-item`;
            const sprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${monTemplate.id}.png`;
            div.innerHTML = `<img src="${sprite}" width="40"><b>${monTemplate.name}</b>`;
            div.onclick = () => {
                modal.style.display = 'none';

                const PokemonClass = (window as any).Pokemon || Game.players[0].team[0].constructor;
                const encounterLevel = Math.max(10, Game.getGlobalAverageLevel() + 5);
                const wildMon = new PokemonClass(monTemplate.id, encounterLevel);
                wildMon.vinculoSupremo = true;

                const Battle = (window as any).Battle;
                Battle.setup(Game.getCurrentPlayer(), wildMon, false, "Selvagem", 0, null, false, 0, "", 1);
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

    static executeMasterCard(ballId: string) {
        const Game = (window as any).Game;
        const Battle = (window as any).Battle;
        const Network = (window as any).Network;
        const player = Game.getCurrentPlayer();

        const cardData = CARDS_DB.find((c: any) => c.id === 'master');

        if (!cardData) return;

        player.items[ballId]--;

        const idx = player.cards.findIndex((c: any) => c.id === 'master');
        if (idx > -1) player.cards.splice(idx, 1);

        document.getElementById('ball-choice-modal')!.style.display = 'none';
        document.getElementById('board-cards-modal')!.style.display = 'none';
        document.getElementById('battle-cards-modal')!.style.display = 'none';

        Game.updateHUD();

        const logMsg = `🃏 ${player.name} ativou a carta: [${cardData.name}]!`;
        const effectLog = `🌟 A magia infundiu a Pokébola! Captura garantida!`;
        const fullMsg = `${logMsg}\n\n${effectLog}`;

        Game.log(logMsg);
        Game.log(effectLog);

        Game.showGlobalAlert(fullMsg, player.name, true, false);

        if (Network.isOnline) {
            Network.syncPlayerState();
            Network.sendAction('SHOW_ALERT', {
                msg: fullMsg,
                playerName: player.name,
                endsTurn: false
            });
            Network.sendAction('LOG', { msg: logMsg });
            Network.sendAction('LOG', { msg: effectLog });
        }

        Battle.logBattle(`Lançou a Pokébola com precisão mágica!`, true);
        setTimeout(() => {
            Battle.captureSuccess();
        }, 1500);
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
                Cards.continueTradeFlow(player, target, index);
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
                Cards.executeTrade(player, target, myChoice, index);
            };
            list.appendChild(div);
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary mt-15';
        cancelBtn.innerText = 'Cancelar Voltar';
        cancelBtn.onclick = () => { modal.style.display = 'none'; };
        list.appendChild(cancelBtn);
    }

    static async executeTrade(player: any, target: any, myChoice: number, hisChoice: number) {
        const Game = (window as any).Game;
        const Network = (window as any).Network;

        const myMon = player.team[myChoice];
        const hisMon = target.team[hisChoice];

        player.team[myChoice] = hisMon;
        target.team[hisChoice] = myMon;

        const idx = player.cards.findIndex((c: any) => c.id === 'troques');
        if (idx > -1) player.cards.splice(idx, 1);

        Game.updateHUD();
        const boardModal = document.getElementById('board-cards-modal');
        if (boardModal) boardModal.style.display = 'none';

        const effectLog = `INACREDITAVEL! ${player.name} forcou uma troca com ${target.name}!\nEnviou: ${myMon.name} - Recebeu: ${hisMon.name}`;
        const logMsg = `🃏 ${player.name} ativou a carta: [Troca Forcada]!`;
        const fullMsg = `${logMsg}\n\n${effectLog}`;

        Game.log(logMsg);
        Game.log(effectLog);
        Game.showGlobalAlert(fullMsg, player.name, true, false);

        if (Network.isOnline) {
            try {
                const { ref, update, getDatabase } = await import('firebase/database');
                const db = getDatabase();
                const roomPath = `rooms/${Network.currentRoomId}`;
                const atomicUpd: any = {};

                const sanitizeTeam = (t: any) => (Network as any).getSanitizedTeam ? (Network as any).getSanitizedTeam(t) : t;

                atomicUpd[`${roomPath}/players/${player.id}/team`] = sanitizeTeam(player.team);
                atomicUpd[`${roomPath}/players/${player.id}/cards`] = player.cards && player.cards.length > 0 ? player.cards : null;
                atomicUpd[`${roomPath}/players/${target.id}/team`] = sanitizeTeam(target.team);

                await update(ref(db), atomicUpd);
            } catch (e) { console.error('[executeTrade] Sync Atômico:', e); }

            Network.sendAction('SHOW_ALERT', { msg: fullMsg, playerName: player.name, endsTurn: false });
            Network.sendAction('LOG', { msg: logMsg });
            Network.sendAction('LOG', { msg: effectLog });
        }
    }

    // =========================================================================================
    // LÓGICA DA CARTA SEQUESTRO RELÂMPAGO
    // =========================================================================================
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
                    Cards.continueNPCBattleTradeFlow(player, index);
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
                    Cards.executeNPCBattleTrade(player, myChoice, index);
                };
            }
            list.appendChild(div);
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary mt-15';
        cancelBtn.innerText = 'Voltar';
        cancelBtn.onclick = () => { Cards.startNPCBattleTradeFlow(player); };
        list.appendChild(cancelBtn);
    }

    static executeNPCBattleTrade(player: any, myChoice: number, hisChoice: number) {
        const Game = (window as any).Game;
        const Battle = (window as any).Battle;
        const Network = (window as any).Network;

        const myMon = player.team[myChoice];
        const hisMon = Battle.oppTeamList[hisChoice];

        player.team[myChoice] = hisMon;
        Battle.oppTeamList[hisChoice] = myMon;

        // Limpeza da referencia na lista auxiliar para manter a consistencia da HUD
        const plyListIdx = Battle.plyTeamList.indexOf(myMon);
        if (plyListIdx !== -1) {
            Battle.plyTeamList[plyListIdx] = hisMon;
        }

        if (Battle.activeMon === myMon) {
            Battle.activeMon = hisMon;
            Battle.tryTriggerMegaEvolution("reagiu ao novo dono");
        }

        if (Battle.opponent === hisMon) {
            Battle.opponent = myMon;
            Battle.tryOpponentMegaEvolution("reagiu ao novo time");
        }

        const idx = player.cards.findIndex((c: any) => c.id === 'illegal_adoption');
        if (idx > -1) player.cards.splice(idx, 1);

        Game.updateHUD();
        Battle.updateUI();

        const battleCardsModal = document.getElementById('battle-cards-modal');
        if (battleCardsModal) battleCardsModal.style.display = 'none';

        const effectLog = `SEQUESTRO RELAMPAGO! ${player.name} trocou seu ${myMon.name} pelo ${hisMon.name} adversario no meio da luta!`;
        const logMsg = `🃏 ${player.name} ativou a carta: [Sequestro Relampago]!`;
        const fullMsg = `${logMsg}\n\n${effectLog}`;

        Game.log(logMsg);
        Game.log(effectLog);
        Battle.logBattle(effectLog, true);
        Game.showGlobalAlert(fullMsg, player.name, true, false);

        if (Network.isOnline) {
            Network.syncPlayerState(); // Como é NPC, só enviamos nosso próprio estado (não tem raça condition aqui)
            Network.sendAction('SHOW_ALERT', { msg: fullMsg, playerName: player.name, endsTurn: false });
            Network.sendAction('LOG', { msg: logMsg });
            Network.sendAction('LOG', { msg: effectLog });
            Network.sendAction('BATTLE_UPDATE', { msg: effectLog });
        }
    }

    // =========================================================================================
    //  NOVO SISTEMA DE DEFESA AUTOMÁTICA COM PRIORIDADE
    // =========================================================================================
    static async checkAutoDefense(attacker: Player, target: Player, incomingCardId: string, incomingCardName: string): Promise<boolean> {
        const Game = (window as any).Game;
        const Network = (window as any).Network;

        // "O Adeus de Ash" é uma carta lendária sem defesa (nem interferência bloqueia)
        if (incomingCardId === 'ash_goodbye') return false;

        let priorityList: string[] = [];

        switch (incomingCardId) {
            case 'new_leader': priorityList = ['old_leader', 'jam']; break;
            case 'bag': priorityList = ['silvertape', 'jam']; break;
            case 'troques': priorityList = ['no_troques', 'jam']; break;
            default: priorityList = ['jam']; break;
        }

        for (const defenseId of priorityList) {
            const defenseCardIndex = target.cards.findIndex((c: any) => c.id === defenseId);

            if (defenseCardIndex > -1) {
                // ---- Mutação local ----
                target.cards.splice(defenseCardIndex, 1);
                const attackCardIndex = attacker.cards.findIndex((c: any) => c.id === incomingCardId);
                if (attackCardIndex > -1) attacker.cards.splice(attackCardIndex, 1);

                // Incrementos de stats do atacante localmente
                attacker.effects = attacker.effects || {};
                attacker.effects.offensiveCardsUsed = (attacker.effects.offensiveCardsUsed || 0) + 1;
                if (!attacker.stats) attacker.stats = { cardsUsed: 0, cardsSuffered: 0, effectsReceived: {}, cardsDefended: {}, turnsLost: 0 };
                attacker.stats.cardsUsed = (attacker.stats.cardsUsed || 0) + 1;

                const boardModal = document.getElementById('board-cards-modal');
                if (boardModal) boardModal.style.display = 'none';
                Game.updateHUD();

                // ---- Mensagens ----
                let blockMsg = "";
                let logMsg = "";
                if (defenseId === 'silvertape') {
                    blockMsg = `🚫 SILVER TAPE!\n\n${target.name} usou uma fita mágica e remendou a bolsa instantaneamente! A carta [${incomingCardName}] falhou.`;
                    logMsg = `🚫 ${target.name} anulou o rasgo na bolsa com Silver Tape!`;
                } else if (defenseId === 'no_troques') {
                    blockMsg = `💝 POKÉMON FIEL!\n\nO Pokémon de ${target.name} se recusou a obedecer a troca! A carta [${incomingCardName}] foi ignorada.`;
                    logMsg = `🚫 ${target.name} bloqueou a troca com Pokémon Fiel!`;
                } else if (defenseId === 'old_leader') {
                    blockMsg = `👑 LÍDER VELHO!\n\nA tradição falou mais alto! ${target.name} invocou sua autoridade veterana e cancelou o desafio de [${incomingCardName}].`;
                    logMsg = `🚫 ${target.name} impediu o roubo de insígnia com Líder Velho!`;
                } else {
                    blockMsg = `📡 INTERFERÊNCIA!\n\n${target.name} tinha um bloqueador de sinal! A carta [${incomingCardName}] de ${attacker.name} foi anulada!`;
                    logMsg = `📡 INTERFERÊNCIA! A carta [${incomingCardName}] de ${attacker.name} foi bloqueada por ${target.name}!`;
                }

                Game.log(logMsg);
                Game.showGlobalAlert(blockMsg, attacker.name, true, false);

                // ---- Estatísticas do defensor ----
                const defenseNames: Record<string, string> = {
                    'jam': 'Interferência', 'silvertape': 'Silver Tape',
                    'no_troques': 'Pokémon Fiel', 'old_leader': 'Líder Velho',
                };
                const defenseLabel = defenseNames[defenseId] || defenseId;

                if (!target.stats) target.stats = { cardsUsed: 0, cardsSuffered: 0, effectsReceived: {}, cardsDefended: {}, turnsLost: 0 };
                if (!target.stats.cardsDefended) target.stats.cardsDefended = {};

                target.stats.cardsDefended[defenseLabel] = (target.stats.cardsDefended[defenseLabel] || 0) + 1;

                // ---- Sync online: UPDATE ATÔMICO ENVOLVENDO OS DOIS JOGADORES ----
                if (Network.isOnline) {
                    try {
                        const { ref, update, getDatabase } = await import('firebase/database');
                        const db = getDatabase();
                        const roomPath = `rooms/${Network.currentRoomId}`;

                        const atomicUpdate: any = {};

                        // Atacante com status já contabilizados
                        atomicUpdate[`${roomPath}/players/${attacker.id}/cards`] = attacker.cards && attacker.cards.length > 0 ? attacker.cards : null;
                        atomicUpdate[`${roomPath}/players/${attacker.id}/effects`] = attacker.effects;
                        atomicUpdate[`${roomPath}/players/${attacker.id}/stats`] = attacker.stats;

                        // Defensor
                        atomicUpdate[`${roomPath}/players/${target.id}/cards`] = target.cards && target.cards.length > 0 ? target.cards : null;
                        atomicUpdate[`${roomPath}/players/${target.id}/stats`] = target.stats;

                        await update(ref(db), atomicUpdate);
                    } catch (e) {
                        console.error('[checkAutoDefense] Erro ao sincronizar bloqueio:', e);
                    }

                    Network.sendAction('SHOW_ALERT', { msg: blockMsg, playerName: attacker.name, endsTurn: false });
                    Network.sendAction('LOG', { msg: logMsg });
                }

                return true;
            }
        }

        return false;
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
                (this as any).activate(cardId, type);
            };
            grid.appendChild(btn);
        });

        modal.style.display = 'flex';
    }

    static async activate(cardId: string, targetId: any = null) {
        const Game = (window as any).Game;
        const Battle = (window as any).Battle;
        const Network = (window as any).Network;
        const player: Player = Game.getCurrentPlayer();

        if ((window as any).Battle && (window as any).Battle.isChampion) {
            return alert("🚫 As regras da Liga proíbem o uso de Cartas no Desafio do Campeão!");
        }

        const cardData = CARDS_DB.find(c => c.id === cardId);
        if (!cardData) return;

        if (cardData.type === 'move' && Battle.active) return alert("Cartas MOVE só podem ser usadas no tabuleiro!");

        if (cardData.type === 'battle') {
            if (!Battle.active) return alert("Cartas BATTLE só podem ser usadas em batalha!");

            if (!Battle.isPvP && Battle.activeMon && ((Battle.activeMon as any).isTemp || (Battle.activeMon as any).isMegaEvolution)) {
                return alert("🧬 Seu parceiro já atingiu o poder máximo! Cartas de batalha estão bloqueadas para Mega Evoluções (ou Mew) no PvE.");
            }
        }

        if (cardData.type === 'auto') {
            return alert("Esta carta não pode ser ativada manualmente. Ela protege você automaticamente quando for alvo de outra carta!");
        }

        // Normalização do TargetId (pode vir como número ou objeto {targetId, pokemonIndex})
        const actualTargetId = (typeof targetId === 'object' && targetId !== null) ? targetId.targetId : targetId;

        const offensiveCards = ['swap', 'slow', 'rocket', 'curse', 'trade_fail', 'new_leader', 'bag', 'troques', 'michael', 'steal_mega_stone', 'ash_goodbye'];

        if (offensiveCards.includes(cardId)) {
            if (!player.effects) player.effects = {};
            if ((player.effects.offensiveCardsUsed || 0) >= 3) {
                alert("Você atingiu o limite máximo de 3 cartas contra outros jogadores neste turno! Você só pode usar cartas de benefício próprio agora.");
                return;
            }
        }

        if (offensiveCards.includes(cardId) && actualTargetId !== null && actualTargetId !== player.id) {
            const targetP = Game.players.find((p: any) => p.id === actualTargetId);

            if (targetP) {
                const wasBlocked = await this.checkAutoDefense(player, targetP, cardId, cardData.name);

                if (wasBlocked) {
                    return; // Retorna pois a defesa atômica já validou as estátisticas e enviou pro banco
                }

                // Não foi bloqueada. Aumenta contador do turno.
                player.effects.offensiveCardsUsed = (player.effects.offensiveCardsUsed || 0) + 1;
            }
        }

        if (cardData.rarity === 'Lendária') {
            if (player.effects && player.effects.playedLegendary) {
                alert("Você já utilizou uma carta Lendária nesta partida. Apenas um milagre por jogo é permitido!");
                return;
            }
        }

        let consumed = true;
        let effectLog = "";
        let alreadyRemoved = false;
        let requiresGlobalSync = false;
        let skipBottomSync = false;

        if (cardData.type === 'global') {
            const idx = player.cards.findIndex(c => c.id === cardId);
            if (idx > -1) {
                player.cards.splice(idx, 1);
                alreadyRemoved = true;
            }
        }

        switch (cardId) {
            case 'dice':
                const val = prompt("Escolha o valor do dado (1-20):");
                const num = parseInt(val || "0");
                if (num >= 1 && num <= 20) { Game.forceDice(num); effectLog = `🎲 O dado foi forçado para cair ${num}!`; }
                else { alert("Valor inválido."); consumed = false; }
                break;

            case 'reroll':
                if (Game.hasRolled) {
                    alert("Você já rolou o dado este turno! A carta Re-Roll deve ser usada ANTES de se mover.");
                    consumed = false;
                } else {
                    const r1 = Math.floor(Math.random() * 6) + 1;
                    const r2 = Math.floor(Math.random() * 6) + 1;
                    Game.showDiceChoice(r1, r2);
                    effectLog = `🎲 Re-Roll ativado! ${player.name} rasgou o tecido do tempo e está escolhendo entre dois destinos...`;
                }
                break;

            case 'boost': effectLog = "👟 Tênis ativados! Andará +6 casas no próximo turno."; Game.bonusMovement = 6; break;
            case 'trap': Game.placeTrap(player.x, player.y, player.id); effectLog = `🪤 Uma armadilha foi montada no chão!`; break;

            case 'swap':
                if (targetId !== null) {
                    const target = Game.players.find((p: any) => p.id === targetId);
                    if (target) {
                        const oldPlayerX = player.x;
                        const oldPlayerY = player.y;
                        const oldTargetX = target.x;
                        const oldTargetY = target.y;

                        target.x = oldPlayerX;
                        target.y = oldPlayerY;

                        player.x = oldTargetX;
                        player.y = oldTargetY;

                        Game.moveVisuals();
                        effectLog = `🔀 A magia aconteceu! A posição de ${player.name} e ${target.name} foi invertida!`;

                        Game.hasRolled = true;
                        Game.pendingTileEvent = true;
                    } else { consumed = false; }
                } else { this.openTargetSelection(cardId); consumed = false; }
                break;

            case 'slow':
                if (targetId !== null) {
                    const target = Game.players.find((p: any) => p.id === targetId);
                    if (target) {
                        if (!target.effects) target.effects = {};
                        target.effects.slow = 3;
                        effectLog = `🕸️ ${target.name} não consegue correr! Está lento por 3 turnos.`;
                    }
                } else { this.openTargetSelection(cardId); consumed = false; }
                break;

            case 'rocket':
                if (targetId !== null) {
                    const target = Game.players.find((p: any) => p.id === targetId);
                    if (target) {
                        const nonLegendaryIndices = target.cards.map((c: any, i: number) => c.rarity === 'Lendária' ? -1 : i).filter((i: number) => i !== -1);
                        if (nonLegendaryIndices.length > 0) {
                            const stolenIdx = nonLegendaryIndices[Math.floor(Math.random() * nonLegendaryIndices.length)];
                            const stolenCard = target.cards.splice(stolenIdx, 1)[0];
                            player.cards.push(stolenCard);
                            effectLog = `🚀 BINGO! Uma carta foi roubada e foi parar na mão de ${player.name}!`;

                            const privateMsg = `🕵️ ALERTA: A Equipe Rocket roubou sua carta [${stolenCard.name}]!||PRIVATE:${target.id}`;
                            if (Network.isOnline) {
                                Network.sendAction('LOG', { msg: privateMsg });
                            } else {
                                Game.log(`🕵️ ALERTA: A Equipe Rocket roubou a carta [${stolenCard.name}] de ${target.name}!`);
                            }
                        } else { alert("O alvo não tem cartas!"); consumed = false; }
                    }
                } else { this.openTargetSelection(cardId); consumed = false; }
                break;

            case 'curse':
                if (targetId !== null) {
                    const target = Game.players.find((p: any) => p.id === targetId);
                    if (!target) { consumed = false; break; }

                    if (!target.effects) target.effects = {};
                    target.effects.curse = true;
                    effectLog = `😈 MALDIÇÃO! ${target.name} causará apenas METADE do dano e não poderá usar itens na sua próxima luta de Ginásio!`;
                } else {
                    this.openTargetSelection(cardId);
                    consumed = false;
                }
                break;

            case 'holy_water':
                if (!player.effects || !player.effects.curse) {
                    alert("Você não está amaldiçoado! Guarde a Água Benta para quando precisar.");
                    return;
                }

                player.effects.curse = false;
                effectLog = `✨ ${player.name} se banhou com Água Benta!`;
                Game.sendGlobalLog(`✨ ${player.name} usou Água Benta e purificou sua alma da Maldição!`);
                break;

            case 'trade_fail':
                if (targetId !== null) {
                    const target = Game.players.find((p: any) => p.id === targetId);
                    if (target) {
                        target.skipTurns += 3;
                        effectLog = `❌ Sabotagem feita com sucesso! A troca falhou terrivelmente e ${target.name} perde as próximas 3 rodadas!`;
                    }
                } else {
                    this.openTargetSelection(cardId);
                    consumed = false;
                }
                break;

            case 'troques':
                if (targetId !== null) {
                    const target = Game.players.find((p: any) => p.id === targetId);
                    if (target) {
                        this.startTradeFlow(player, target);
                        consumed = false;
                    }
                } else {
                    this.openTargetSelection(cardId);
                    consumed = false;
                }
                break;

            case 'illegal_adoption':
                if (!Battle.active || Battle.isPvP || Battle.isGym || Battle.isChampion) {
                    alert("Esta carta so pode ser usada em batalhas contra NPCs comuns ou Pokemons Selvagens!");
                    consumed = false;
                    break;
                }

                document.getElementById('battle-cards-modal')!.style.display = 'none';

                this.startNPCBattleTradeFlow(player);
                consumed = false;
                break;

            case 'adotar_lixeira':
                if (Game.lixeira.length === 0) {
                    alert("A lixeira está vazia! Não há nenhum Pokémon para resgatar.");
                    consumed = false;
                } else {
                    Game.openLixeira(true);
                    effectLog = `💚 ${player.name} sentiu compaixão e está procurando um novo parceiro na Lixeira!`;
                }
                break;

            case 'time': player.effects.extraTurn = true; effectLog = "⏳ O tempo congelou! O jogador terá mais um turno imediato."; break;

            case 'new_leader':
                const myBadgesCount = player.badges.filter((b: boolean) => b).length;
                if (myBadgesCount >= 7) {
                    Game.showGlobalAlert("A Liga Pokémon interveio! É proibido usar a carta 'Novo Líder' quando falta apenas 1 Insígnia para vencer o jogo. Conquiste a última com seu próprio suor!", player.name, true, false);
                    consumed = false;
                    break;
                }

                if (targetId !== null) {
                    const target = Game.players.find((p: any) => p.id === targetId);
                    if (!target) { consumed = false; break; }

                    const stealableBadges = [];
                    for (let i = 0; i < 8; i++) {
                        if (target.badges[i] && !player.badges[i]) {
                            stealableBadges.push(i);
                        }
                    }

                    if (stealableBadges.length === 0) {
                        Game.showGlobalAlert(`O jogador ${target.name} não possui nenhuma Insígnia nova para você roubar!`, player.name, true, false);
                        consumed = false;
                        break;
                    }

                    const targetTeam = target.getBattleTeam(false);
                    if (targetTeam.length === 0) {
                        Game.showGlobalAlert(`O jogador ${target.name} está sem Pokémons vivos! Tente mais tarde.`, player.name, true, false);
                        consumed = false;
                        break;
                    }

                    Battle.activeEffects.stealBadgeFrom = target.id;
                    effectLog = `⚔️ UM DUELO FOI DECLARADO! ${player.name} desafiou ${target.name} para roubar uma de suas Insígnias!`;

                    Battle.setup(player, targetTeam[0], true, target.name, 0, target, false, 0, "", 1);

                } else {
                    this.openTargetSelection(cardId);
                    consumed = false;
                }
                break;

            case 'crit':
                Battle.activeEffects.crit = 3;
                Battle.logBattle("💥 Super Crítico! Seus próximos 3 acertos causarão dobro de dano.");
                break;

            case 'master':
                if (Battle.isPvP || Battle.isNPC || Battle.isGym) {
                    alert("A carta Master Ball só pode ser usada contra Pokémons Selvagens!");
                    consumed = false;
                    break;
                }

                const balls = [];
                if (player.items['pokeball'] > 0) balls.push({ id: 'pokeball', name: 'Pokébola', count: player.items['pokeball'] });
                if (player.items['greatball'] > 0) balls.push({ id: 'greatball', name: 'Greatball', count: player.items['greatball'] });
                if (player.items['ultraball'] > 0) balls.push({ id: 'ultraball', name: 'Ultraball', count: player.items['ultraball'] });

                if (balls.length === 0) {
                    alert("Você precisa ter pelo menos uma Pokébola na mochila para usar a magia desta carta!");
                    consumed = false;
                    break;
                }

                this.showBallChoice(balls);
                consumed = false;
                break;

            case 'run':
                player.effects.escapedGym = true;
                Battle.logBattle("💨 Fugiu com estilo!");
                Battle.end(false);
                break;

            case 'guard': Battle.activeEffects.guard = true; Battle.logBattle("🛡️ Escudo ativado! (-50% dano recebido)"); break;
            case 'focus': Battle.activeEffects.focus = true; Battle.logBattle("🎯 Foco Total! Próximo ataque 4x dano."); break;
            case 'status': Battle.activeEffects.stunOpponent = 2; Battle.logBattle("⚡ Inimigo atordoado por 2 turnos!"); break;
            case 'heal': Battle.activeMon.heal(9999); Battle.updateUI(); Battle.logBattle("💊 HP Totalmente recuperado!"); break;
            case 'counter': Battle.activeEffects.counter = 3; Battle.logBattle("🔁 Contra-ataque preparado (3 turnos)!"); break;

            case 'mew':
                const PokemonClass = (window as any).Pokemon || Game.players[0].team[0].constructor;
                const mew = new PokemonClass(150, Battle.activeMon.level, false);
                mew.name = "MewTwo (Aliado)";
                mew.heal(9999);
                (mew as any).isTemp = true;

                const originalIndex = player.team.indexOf(Battle.activeMon);
                Battle.activeEffects.mewOriginal = Battle.activeMon;
                Battle.activeEffects.mewIndex = originalIndex;

                if (originalIndex !== -1) player.team[originalIndex] = mew;

                const plyIdx = Battle.plyTeamList.indexOf(Battle.activeMon);
                if (plyIdx !== -1) Battle.plyTeamList[plyIdx] = mew;

                Battle.activeMon = mew;
                Battle.updateUI();
                Battle.logBattle("🧬 DNA Reagiu! Mew assumiu o lugar do seu Pokémon!");
                break;

            case 'destiny': Battle.activeEffects.destiny = true; Battle.logBattle("🌠 Recompensas dobradas se vencer!"); break;

            case 'mega_stone':
                if (Battle.active) {
                    alert("Você não pode equipar a Mega Pedra durante a batalha! Use no tabuleiro.");
                    return;
                }

                if (targetId !== null) {
                    const targetMon = player.team[targetId];
                    if (!targetMon) { consumed = false; break; }

                    const { MAPA_MEGAS } = await import('../constants/mapaMegas');

                    if (!MAPA_MEGAS[targetMon.id]) {
                        alert(`O Pokémon ${targetMon.name} não reage a esta Mega Pedra!`);
                        consumed = false;
                        break;
                    }

                    if (targetMon.megaStone) {
                        alert(`${targetMon.name} já está segurando uma Mega Pedra!`);
                        consumed = false;
                        break;
                    }

                    targetMon.megaStone = true;
                    effectLog = `💎 A Mega Pedra começou a brilhar intensamente junto de ${targetMon.name}!`;

                } else {
                    this.openMegaSelection(cardId);
                    consumed = false;
                }
                break;

            case 'reclaim_mega_stone':
                if (targetId !== null) {
                    const targetMon = player.team[targetId];
                    if (!targetMon || !targetMon.megaStone) { consumed = false; break; }

                    targetMon.megaStone = false;

                    const megaStoneCardData = CARDS_DB.find((c: any) => c.id === 'mega_stone');
                    if (megaStoneCardData) {
                        player.cards.push(megaStoneCardData);
                    }

                    effectLog = `⛏️ A Mega Pedra foi retirada de ${targetMon.name} com segurança! Você recebeu a carta Mega Pedra de volta.`;

                } else {
                    this.openReclaimMegaStoneSelection(cardId);
                    consumed = false;
                }
                break;

            case 'steal_mega_stone':
                if (targetId !== null) {
                    const tId = targetId.targetId;
                    const pIdx = targetId.pokemonIndex;

                    const target = Game.players.find((p: any) => p.id === tId);
                    if (!target) { consumed = false; break; }

                    const targetMon = target.team[pIdx];
                    if (!targetMon || !targetMon.megaStone) { consumed = false; break; }

                    targetMon.megaStone = false;

                    effectLog = `💥 DESTRUÍDA! ${player.name} usou magia negra e destruiu a Mega Pedra que estava com o ${targetMon.name} de ${target.name}!`;

                } else {
                    this.openStealMegaStoneTargetSelection(cardId);
                    consumed = false;
                }
                break;

            case 'supreme_bond':
                if (targetId !== null) {
                    const targetMon = player.team[targetId];
                    if (!targetMon) { consumed = false; break; }

                    if (targetMon.vinculoSupremo) {
                        alert("Este Pokémon já possui Vínculo Supremo!");
                        consumed = false;
                        break;
                    }

                    targetMon.vinculoSupremo = true;
                    effectLog = `🤝 VÍNCULO SUPREMO! ${targetMon.name} prometeu nunca abandonar ${player.name}, custe o que custar!`;

                } else {
                    this.openPokemonSelectionForCard(cardId, "Escolha um Pokémon para criar um Vínculo Supremo:");
                    consumed = false;
                }
                break;

            case 'ash_goodbye':
                if (targetId !== null) {
                    const tId = targetId.targetId;
                    const pIdx = targetId.pokemonIndex;

                    const target = Game.players.find((p: any) => p.id === tId);
                    if (!target) { consumed = false; break; }

                    const targetMon = target.team[pIdx];
                    if (!targetMon) { consumed = false; break; }

                    if (target.team.length === 1) {
                        alert("Você não pode mandar embora o último Pokémon do treinador!");
                        consumed = false;
                        break;
                    }

                    if (targetMon.vinculoSupremo) {
                        effectLog = `🤝 O ADEUS DE ASH FALHOU! ${targetMon.name} se recusa a ir embora devido ao Vínculo Supremo com ${target.name}!`;
                    } else {
                        target.team.splice(pIdx, 1);
                        effectLog = `👋 ADEUS! ${player.name} cantou a música triste e fez ${target.name} libertar seu ${targetMon.name} para todo o sempre! (Ele desapareceu na imensidão e nunca mais poderá ser recuperado)`;
                    }

                } else {
                    this.openAshGoodbyeTargetSelection(cardId);
                    consumed = false;
                }
                break;

            case 'tremembe':
                Game.players.forEach((p: any) => {
                    if (p.id !== player.id) {
                        if (!p.stats) p.stats = { cardsUsed: 0, cardsSuffered: 0, effectsReceived: {}, cardsDefended: {}, turnsLost: 0 };
                        p.stats.cardsSuffered = (p.stats.cardsSuffered || 0) + 1;
                        if (!p.stats.effectsReceived) p.stats.effectsReceived = {};
                        p.stats.effectsReceived['Tremembé'] = (p.stats.effectsReceived['Tremembé'] || 0) + 1;
                        p.skipTurns += 20;
                    }
                });
                effectLog = `⛓️ DECRETO DA PRISÃO DE TREMEMBÉ! Todos os outros jogadores ficarão enjaulados por 20 rodadas!`;
                requiresGlobalSync = true;
                break;

            case 'se_rj':
                Game.players.forEach((p: any) => {
                    if (p.id !== player.id) {
                        p.gold = 0;
                        Object.keys(p.items).forEach(k => p.items[k] = 0);
                    }
                });
                effectLog = `🔫 ARRastão na Sé/RJ! Todos os outros jogadores foram assaltados e perderam TODO o gold e TODOS os itens!`;
                requiresGlobalSync = true;
                break;

            case 'cassino':
                Game.players.forEach((p: any) => {
                    if (p.id !== player.id) {
                        p.cards = p.cards.filter((c: any) => c.rarity === 'Lendária');
                    }
                });
                effectLog = `🎰 A BANCA SEMPRE VENCE! Todos os outros jogadores perderam todas as suas cartas apostando no Cassino! (Cartas lendárias foram poupadas)`;
                requiresGlobalSync = true;
                break;

            case 'legendary_encounter':
                const _POKEDEX = (await import('../constants/pokedex')).POKEDEX;
                const legendaries = _POKEDEX.filter((p: any) => p.isLegendary);

                const shuffled = legendaries.sort(() => 0.5 - Math.random());
                const selectedThree = shuffled.slice(0, 3);

                this.openLegendaryEncounterSelection(selectedThree);

                effectLog = `🦅 ${player.name} tocou a Flauta do Tempo e atraiu a presença de três divindades!`;
                break;

            case 'legendary_shiny':
                if (targetId !== null) {
                    const targetMon = player.team[targetId];
                    if (!targetMon) { consumed = false; break; }

                    if (!targetMon.isLegendary) {
                        alert("Este Pokémon não é Lendário!");
                        consumed = false;
                        break;
                    }

                    if (targetMon.isShiny) {
                        alert("Este Pokémon Lendário já é Shiny!");
                        consumed = false;
                        break;
                    }

                    targetMon.isShiny = true;
                    targetMon.vinculoSupremo = true;
                    targetMon.recalculateStats(true);

                    effectLog = `🌟 UMA LUZ OFUSCANTE! O ${targetMon.name} lendário de ${player.name} absorveu a energia, se tornou SHINY e ganhou Vínculo Supremo!`;

                } else {
                    this.openPokemonSelectionForCard(cardId, "Escolha um Pokémon Lendário para transformar em Shiny:");
                    consumed = false;
                }
                break;

            case 'rare_candy':
                if (targetId !== null) {
                    const targetMon = player.team[targetId];
                    if (!targetMon) { consumed = false; break; }

                    if (targetMon.level >= 25) {
                        alert(`O Pokémon ${targetMon.name} já alcançou o Nível Máximo (25) e não pode mais comer Rare Candys!`);
                        consumed = false;
                        break;
                    }

                    const preservedXp = targetMon.currentXp;
                    targetMon.levelUp(player);
                    targetMon.currentXp = preservedXp;

                    effectLog = `🍬 Que delícia! O Rare Candy fez efeito mágico!`;

                } else {
                    this.openPokemonSelectionForCard(cardId);
                    consumed = false;
                }
                break;

            case 'evoluir':
                if (targetId !== null) {
                    const targetMon = player.team[targetId];
                    if (!targetMon || !targetMon.evoData || !targetMon.evoData.next) {
                        consumed = false;
                        break;
                    }

                    const originalTrigger = targetMon.evoData.trigger;
                    targetMon.evoData.trigger = 1;

                    const evolved = targetMon.checkEvolution(player);

                    if (!evolved) {
                        targetMon.evoData.trigger = originalTrigger;
                        consumed = false;
                        break;
                    }

                    effectLog = `🧬 Genética alterada! A Evolução Forçada foi um sucesso!`;

                } else {
                    this.openEvolutionSelectionForCard(cardId);
                    consumed = false;
                }
                break;

            case 'shiny':
                player.effects.lureShiny = 3;
                effectLog = `✨ Uma aura brilhante envolve ${player.name}! Suas chances de encontrar Pokémons Shinies subiram para 15% pelas próximas 3 rodadas!`;
                break;

            case 'communism':
                skipBottomSync = true;
                if (Network.isOnline) {
                    try {
                        const { ref, update, getDatabase, get } = await import('firebase/database');
                        const db = (window as any).db || getDatabase();
                        const roomPath = `rooms/${Network.currentRoomId}`;

                        const roomSnap = await get(ref(db, roomPath));
                        const roomData = roomSnap.val();

                        if (!roomData || !roomData.players) {
                            throw new Error("Dados da sala não encontrados no Firebase.");
                        }

                        let allCardsPool: any[] = [];
                        const playerIds = Object.keys(roomData.players);

                        playerIds.forEach(id => {
                            const pData = roomData.players[id];
                            if (pData.cards && Array.isArray(pData.cards)) {
                                let cardsToAdd: any[] = [];
                                let legendaryCards: any[] = [];

                                pData.cards.forEach((c: any) => {
                                    if (parseInt(id) === player.id && c.id === cardId) {
                                    } else if (c.rarity === 'Lendária') {
                                        legendaryCards.push(c);
                                    } else {
                                        cardsToAdd.push(c);
                                    }
                                });

                                pData._legendaries = legendaryCards;
                                allCardsPool = [...allCardsPool, ...cardsToAdd];
                            }
                        });

                        const syncAllUpdates: any = {};
                        syncAllUpdates[`${roomPath}/global/communism/cards`] = allCardsPool;
                        playerIds.forEach(id => {
                            syncAllUpdates[`${roomPath}/players/${id}/cards`] = null;
                        });
                        await update(ref(db), syncAllUpdates);

                        for (let i = allCardsPool.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [allCardsPool[i], allCardsPool[j]] = [allCardsPool[j], allCardsPool[i]];
                        }

                        const pCount = playerIds.length;
                        const perPlayer = Math.floor(allCardsPool.length / pCount);
                        const leftovers = allCardsPool.length % pCount;

                        const finalSyncUpdates: any = {};
                        playerIds.forEach(id => {
                            const newHand = roomData.players[id]._legendaries || [];
                            for (let i = 0; i < perPlayer; i++) {
                                if (allCardsPool.length > 0) newHand.push(allCardsPool.pop());
                            }
                            if (parseInt(id) === player.id) {
                                player.cards = newHand;
                            }
                            finalSyncUpdates[`${roomPath}/players/${id}/cards`] = newHand.length > 0 ? newHand : null;
                        });

                        finalSyncUpdates[`${roomPath}/global/communism`] = null;
                        await update(ref(db), finalSyncUpdates);

                        effectLog = `REVOLUCAO GLOBAL! Todas as cartas do jogo foram coletadas e redistribuidas igualmente! Cada jogador agora tem ${perPlayer} cartas. (${leftovers} foram destruidas pelo bem da nacao)`;
                    } catch (err) {
                        console.error("Erro no Comunismo Online:", err);
                        effectLog = "Erro na redistribuição global. Verifique o console ou a conexão.";
                    }
                } else {
                    let offlinePool: any[] = [];
                    Game.players.forEach((p: any) => {
                        let nonLendaries = p.cards.filter((c: any) => c.rarity !== 'Lendária');
                        p._legendaries = p.cards.filter((c: any) => c.rarity === 'Lendária');
                        offlinePool = [...offlinePool, ...nonLendaries];
                        p.cards = [];
                    });

                    for (let i = offlinePool.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [offlinePool[i], offlinePool[j]] = [offlinePool[j], offlinePool[i]];
                    }
                    const pCount = Game.players.length;
                    const perPlayer = Math.floor(offlinePool.length / pCount);
                    const leftovers = offlinePool.length % pCount;

                    Game.players.forEach((p: any) => {
                        p.cards = [...(p._legendaries || [])];
                        for (let i = 0; i < perPlayer; i++) {
                            if (offlinePool.length > 0) p.cards.push(offlinePool.pop());
                        }
                    });
                    effectLog = `REVOLUCAO local! As cartas foram redistribuidas igualmente! Cada jogador agora tem ${perPlayer} cartas. (${leftovers} destruidas)`;
                }

                Game.updateHUD();
                const boardModalC = document.getElementById('board-cards-modal');
                if (boardModalC) boardModalC.style.display = 'none';

                const logMsgG = `🃏 ${player.name} ativou a carta GLOBAL: [${cardData.name}]!`;
                const fullMsgG = `${logMsgG}\n\n${effectLog}`;

                Game.log(logMsgG);
                Game.log(effectLog);
                Game.showGlobalAlert(fullMsgG + `||CARD:${cardId}`, player.name, true, false);

                if (Network.isOnline) {
                    Network.sendAction('SHOW_ALERT', { msg: fullMsgG + `||CARD:${cardId}`, playerName: player.name, endsTurn: false });
                    Network.sendAction('LOG', { msg: logMsgG });
                    Network.sendAction('LOG', { msg: effectLog });
                }
                break;

            case 'imposto':
                skipBottomSync = true;
                if (Network.isOnline) {
                    try {
                        const { ref, update, getDatabase, get } = await import('firebase/database');
                        const db = (window as any).db || getDatabase();
                        const roomPath = `rooms/${Network.currentRoomId}`;

                        const roomSnap = await get(ref(db, roomPath));
                        const roomData = roomSnap.val();
                        if (!roomData || !roomData.players) throw new Error("Dados da sala não encontrados.");

                        const playerIds = Object.keys(roomData.players);
                        const impUpdates: any = {};
                        let totalCardsL = 0;
                        let totalItemsL = 0;

                        playerIds.forEach(id => {
                            const pData = roomData.players[id];

                            const cards = pData.cards ? [...pData.cards] : [];
                            if (parseInt(id) === player.id) {
                                const impIdx = cards.findIndex((c: any) => c.id === cardId);
                                if (impIdx > -1) cards.splice(impIdx, 1);
                            }

                            const legendaries = cards.filter(c => c.rarity === 'Lendária');
                            const others = cards.filter(c => c.rarity !== 'Lendária');

                            const toRemoveC = Math.floor(others.length / 2);
                            if (toRemoveC > 0) {
                                for (let i = 0; i < toRemoveC; i++) {
                                    const rIdx = Math.floor(Math.random() * others.length);
                                    others.splice(rIdx, 1);
                                    totalCardsL++;
                                }
                            }

                            const finalCards = [...legendaries, ...others];

                            const items = pData.items || {};
                            Object.keys(items).forEach(k => {
                                if (items[k] > 0) {
                                    const toRemoveI = Math.floor(items[k] / 2);
                                    items[k] -= toRemoveI;
                                    totalItemsL += toRemoveI;
                                }
                            });

                            impUpdates[`${roomPath}/players/${id}/cards`] = finalCards.length > 0 ? finalCards : null;
                            impUpdates[`${roomPath}/players/${id}/items`] = items;

                            if (parseInt(id) === player.id) {
                                player.cards = finalCards;
                                player.items = items;
                            }
                        });

                        await update(ref(db), impUpdates);
                        effectLog = `A RECEITA FEDERAL CHEGOU! O Leao abocanhou a conta de todos na mesa! (${totalCardsL} cartas e ${totalItemsL} itens retidos!)`;

                    } catch (err) {
                        console.error("Erro no Imposto Online:", err);
                        effectLog = "Erro na coleta de impostos global. Verifique o console.";
                    }
                } else {
                    let totalOfflineC = 0;
                    let totalOfflineI = 0;
                    Game.players.forEach((p: any) => {
                        const legendaries = p.cards.filter((c: any) => c.rarity === 'Lendária');
                        const others = p.cards.filter((c: any) => c.rarity !== 'Lendária');

                        const toRemC = Math.floor(others.length / 2);
                        for (let i = 0; i < toRemC; i++) {
                            others.splice(Math.floor(Math.random() * others.length), 1);
                            totalOfflineC++;
                        }

                        p.cards = [...legendaries, ...others];

                        Object.keys(p.items).forEach(k => {
                            const toRemI = Math.floor(p.items[k] / 2);
                            p.items[k] -= toRemI;
                            totalOfflineI += toRemI;
                        });
                    });
                    effectLog = `IMPOSTO! O Leao passou por aqui! (${totalOfflineC} cartas e ${totalOfflineI} itens perdidos!)`;
                }

                Game.updateHUD();
                const boardModalI = document.getElementById('board-cards-modal');
                if (boardModalI) boardModalI.style.display = 'none';

                const logMsgI = `🃏 ${player.name} ativou a carta GLOBAL: [${cardData.name}]!`;
                const fullMsgI = `${logMsgI}\n\n${effectLog}`;

                Game.log(logMsgI);
                Game.log(effectLog);
                Game.showGlobalAlert(fullMsgI + `||CARD:${cardId}`, player.name, true, false);

                if (Network.isOnline) {
                    Network.sendAction('SHOW_ALERT', { msg: fullMsgI + `||CARD:${cardId}`, playerName: player.name, endsTurn: false });
                    Network.sendAction('LOG', { msg: logMsgI });
                    Network.sendAction('LOG', { msg: effectLog });
                }
                break;

            case 'doublexp':
                player.effects.doubleXp = 5;
                effectLog = `O conhecimento flui! Os proximos 5 ganhos de XP de ${player.name} serao em dobro!`;
                break;

            case 'expshare':
                player.effects.expShare = 5;
                effectLog = `Exp Share Ativado! Os proximos 5 ganhos de XP de ${player.name} serao distribuidos para toda a equipe!`;
                break;

            case 'sniper':
                Battle.activeEffects.sniper = true;
                Battle.logBattle("🎯 Sniper Americano! Sua mira está perfeita para este turno.");
                break;

            case 'bag':
                if (targetId !== null) {
                    const target = Game.players.find((p: any) => p.id === targetId);
                    if (!target) { consumed = false; break; }

                    let totalItems = 0;
                    Object.keys(target.items).forEach(k => totalItems += target.items[k]);

                    if (totalItems === 0) {
                        alert("O alvo não tem itens para perder!");
                        consumed = false;
                        break;
                    }

                    let itemsToRemove = Math.floor(totalItems / 2);
                    if (itemsToRemove < 1) itemsToRemove = 1;

                    let removedCount = 0;
                    while (removedCount < itemsToRemove) {
                        const keys = Object.keys(target.items).filter(k => target.items[k] > 0);
                        if (keys.length === 0) break;
                        const randomKey = keys[Math.floor(Math.random() * keys.length)];
                        target.items[randomKey]--;
                        removedCount++;
                    }

                    effectLog = `Ouch! A bolsa de ${target.name} foi rasgada! Caiu e perdeu ${removedCount} itens aleatorios pelo caminho.`;
                } else {
                    this.openTargetSelection(cardId);
                    consumed = false;
                }
                break;

            case 'michael':
                if (targetId !== null) {
                    const target = Game.players.find((p: any) => p.id === targetId);
                    if (target) {
                        if (!target.effects) target.effects = {};
                        target.effects.moonwalker = 3;
                        effectLog = `Moon Walker! ${target.name} vai andar para TRAS nas proximas 3 jogadas!`;
                    } else { consumed = false; }
                } else { this.openTargetSelection(cardId); consumed = false; }
                break;

            case 'katrina':
                const mapSize = MapSystem.size;
                const totalTilesK = mapSize * mapSize;
                Game.players.forEach((p: any) => {
                    const randomIdx = Math.floor(Math.random() * totalTilesK);
                    const coord = MapSystem.getCoord(randomIdx);
                    p.x = coord.x;
                    p.y = coord.y;
                });
                Game.moveVisuals();
                effectLog = "O FURACAO KATRINA PASSOU! Todos os jogadores foram soprados para casas aleatorias!";
                requiresGlobalSync = true;
                break;

            case 'lure_type':
                if (typeof targetId === 'string') {
                    const chosenType = targetId;
                    player.effects.lureType = { type: chosenType, count: 2 };
                    effectLog = `Lure Type ativado! Os proximos 2 selvagens serao do tipo ${chosenType}!`;
                } else {
                    this.openTypeSelection(cardId);
                    consumed = false;
                }
                break;

            default: consumed = false;
        }

        if (consumed) {
            const offensiveCardIds = ['swap', 'slow', 'rocket', 'curse', 'trade_fail', 'new_leader', 'bag', 'troques', 'michael', 'steal_mega_stone', 'ash_goodbye'];

            // Remove da mão
            if (!alreadyRemoved) {
                const idx = player.cards.findIndex(c => c.id === cardId);
                if (idx > -1) player.cards.splice(idx, 1);
            }

            // Marca lendária
            if (cardData.rarity === 'Lendária') {
                if (!player.effects) player.effects = {};
                player.effects.playedLegendary = true;
            }

            // =========================================================================
            //  BLINDAGEM DE STATS DO ATACANTE
            // =========================================================================
            if (offensiveCardIds.includes(cardId) && actualTargetId !== null && actualTargetId !== player.id) {
                if (!player.stats) player.stats = { cardsUsed: 0, cardsSuffered: 0, effectsReceived: {}, cardsDefended: {}, turnsLost: 0 };
                player.stats.cardsUsed = (player.stats.cardsUsed || 0) + 1;
            }

            // =========================================================================
            //  BLINDAGEM DE STATS DO ALVO
            // =========================================================================
            let targetObjForSync = null;

            if (actualTargetId !== null && offensiveCardIds.includes(cardId)) {
                const offensiveTarget = Game.players.find((p: any) => p.id === actualTargetId);
                if (offensiveTarget && offensiveTarget.id !== player.id) {
                    targetObjForSync = offensiveTarget;

                    if (!offensiveTarget.stats) offensiveTarget.stats = { cardsUsed: 0, cardsSuffered: 0, effectsReceived: {}, cardsDefended: {}, turnsLost: 0 };
                    if (!offensiveTarget.stats.effectsReceived) offensiveTarget.stats.effectsReceived = {};

                    offensiveTarget.stats.cardsSuffered = (offensiveTarget.stats.cardsSuffered || 0) + 1;
                    const effectKey = cardData.name;
                    offensiveTarget.stats.effectsReceived[effectKey] = (offensiveTarget.stats.effectsReceived[effectKey] || 0) + 1;
                }
            }

            Game.updateHUD();
            document.getElementById('board-cards-modal')!.style.display = 'none';
            document.getElementById('battle-cards-modal')!.style.display = 'none';

            let targetName = "";
            if (targetObjForSync) {
                targetName = targetObjForSync.name;
            } else if (cardData.type === 'battle' && Battle.isPvP && Battle.enemyPlayer) {
                targetName = Battle.enemyPlayer.name;
            }

            let logMsg = `🃏 ${player.name} ativou a carta: [${cardData.name}]!`;
            if (targetName) {
                logMsg = `🃏 ${player.name} usou a carta [${cardData.name}] contra ${targetName}!`;
            }

            let fullMsg = logMsg;
            if (effectLog) fullMsg += `\n\n${effectLog}`;

            Game.log(logMsg);
            if (effectLog) Game.log(effectLog);

            if (cardId !== 'new_leader' && cardId !== 'reroll' && cardId !== 'dice' && cardId !== 'illegal_adoption' && !skipBottomSync) {
                Game.showGlobalAlert(fullMsg + `||CARD:${cardId}`, player.name, true, false);
            }

            // =========================================================================
            //  SYNC ÚNICO, UNIVERSAL E ATÔMICO
            // =========================================================================
            if (Network.isOnline && !skipBottomSync) {
                try {
                    const { ref, update, getDatabase } = await import('firebase/database');
                    const db = getDatabase();
                    const roomPath = `rooms/${Network.currentRoomId}`;
                    const atomicUpd: any = {};

                    // Helper para higienizar antes de enviar
                    const sanitize = (p: any) => ({
                        id: p.id,
                        name: p.name,
                        avatar: typeof p.avatar === 'string' && p.avatar.includes('/') ? p.avatar.split('/').pop() : p.avatar,
                        x: p.x,
                        y: p.y,
                        gold: p.gold,
                        team: (Network as any).getSanitizedTeam ? (Network as any).getSanitizedTeam(p.team) : p.team,
                        items: p.items || {},
                        skipTurns: p.skipTurns || 0,
                        badges: p.badges || [],
                        cards: p.cards && p.cards.length > 0 ? p.cards : null,
                        effects: p.effects || {},
                        pokedexData: p.pokedexData || {},
                        stats: p.stats || { cardsUsed: 0, cardsSuffered: 0, effectsReceived: {}, cardsDefended: {}, turnsLost: 0 }
                    });

                    if (requiresGlobalSync) {
                        // Cartas Globais (Tremembé, Katrina, Sé, Cassino)
                        Game.players.forEach((p: any) => {
                            atomicUpd[`${roomPath}/players/${p.id}`] = sanitize(p);
                        });
                    } else {
                        // Update apenas em quem está envolvido no combate/efeito
                        atomicUpd[`${roomPath}/players/${player.id}`] = sanitize(player);
                        if (targetObjForSync) {
                            atomicUpd[`${roomPath}/players/${targetObjForSync.id}`] = sanitize(targetObjForSync);
                        }
                    }

                    await update(ref(db), atomicUpd);
                } catch (e) {
                    console.error("Erro no Sync Atômico Final:", e);
                }

                // Logs na rede
                if (cardId !== 'new_leader' && cardId !== 'reroll' && cardId !== 'dice' && cardId !== 'illegal_adoption') {
                    Network.sendAction('SHOW_ALERT', { msg: fullMsg + `||CARD:${cardId}`, playerName: player.name, endsTurn: false });
                    Network.sendAction('LOG', { msg: logMsg });
                    if (effectLog) Network.sendAction('LOG', { msg: effectLog });
                } else {
                    Network.sendAction('LOG', { msg: logMsg });
                    if (effectLog) Network.sendAction('LOG', { msg: effectLog });
                }
            }
        }
    }
}