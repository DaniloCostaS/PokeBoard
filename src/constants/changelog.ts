// Novidades do jogo, da mais recente para a mais antiga. Escreva para quem joga: o que mudou na partida.
// Ao publicar algo novo, acrescente um bloco no topo com a data do dia (AAAA-MM-DD).
export type ChangeKind = 'novo' | 'ajuste' | 'correcao';
export type ChangelogDay = { date: string; changes: [ChangeKind, string][] };

export const CHANGELOG: ChangelogDay[] = [
    { date: '2026-11-06', changes: [
        ['novo', 'Sons no jogo: dado, passos, batalha, captura, cartas, moedas, vitória e muito mais. Ajuste o volume no menu lateral; o botão na barra de turno ou a tecla M liga e desliga.'],
        ['novo', 'Opção de gráficos (Automático, Completo ou Leve). No automático, o jogo reduz os efeitos sozinho se o aparelho não acompanhar.'],
        ['ajuste', 'O tabuleiro abre bem mais rápido e gasta muito menos internet: as imagens do jogo ficaram até 7 vezes menores.'],
        ['ajuste', 'Partida mais leve: o tabuleiro não é redesenhado atrás de janelas abertas e o placar só atualiza o que mudou.'],
        ['ajuste', 'Online mais leve: movimentos de outras salas não fazem mais sua partida recarregar os jogadores.'],
    ] },
    { date: '2026-11-04', changes: [
        ['novo', 'Esqueci a senha: agora dá para criar uma senha nova usando seu código de recuperação, na tela de login.'],
        ['novo', 'Tela de Novidades, com tudo o que mudou no jogo por data.'],
        ['novo', 'Nova Pokédex: abre bem mais rápido, com ficha do Pokémon, busca por número e filtros por tipo e geração.'],
        ['novo', 'Novo Porta-Insígnias: toque em uma insígnia para ver o ginásio.'],
        ['ajuste', 'Novo visual nas insígnias do placar, nas tags de tipo e no painel de vantagens de cada tipo.'],
        ['correcao', 'Tela de ginásio mostrava fraquezas como 2x, mas o dano real é 1.75x; líder e insígnia não somem mais em telas baixas.'],
        ['ajuste', 'Derrota total agora sempre custa uma vida, mesmo com Revive na mochila. A caixa de escolha foi removida.'],
        ['ajuste', 'A conquista Fênix agora conta as vezes em que você reanima com itens de Revive.'],
    ] },
    { date: '2026-11-03', changes: [
        ['novo', 'Opção de visualização simplificada das cartas da mão.'],
    ] },
    { date: '2026-10-31', changes: [
        ['novo', 'Opção de reconectar à última partida.'],
        ['ajuste', 'As cartas passam a ser selecionadas conforme o mouse passa por elas.'],
        ['ajuste', 'Visual renovado nas telas de ginásio e de Pokémon e no HUD dos jogadores.'],
        ['correcao', 'Log de cartas usadas em um Pokémon específico.'],
    ] },
    { date: '2026-10-27', changes: [
        ['novo', 'Batalha em tela cheia, que se ajusta a qualquer resolução. Quantidade de Pokémon do oponente sempre visível.'],
        ['novo', 'Evento global atual em destaque na barra de turno.'],
        ['novo', 'Visão compacta do time no placar, com opção de expandir.'],
        ['correcao', 'Ícones da Great Ball, Ultra Ball e Master Ball.'],
    ] },
    { date: '2026-10-26', changes: [
        ['ajuste', 'Manual do jogador reescrito do zero.'],
        ['ajuste', 'Meu perfil agora fica junto do treinador conectado.'],
        ['ajuste', 'Encontro com lendários sem os GIFs antigos.'],
        ['correcao', 'Jogador não fica mais preso em ginásio depois de uma derrota total.'],
        ['correcao', 'Estatísticas de cartas não contam mais para todos os jogadores.'],
        ['correcao', '"Ver Log de Combate" não mostra mais "log não encontrado".'],
        ['correcao', 'HUD atualiza os Pokémon sem precisar recarregar a página; imagens não somem mais.'],
    ] },
    { date: '2026-10-25', changes: [
        ['novo', 'Contas com perfil, Pokédex da conta, conquistas, títulos e molduras.'],
        ['novo', 'Sistema de vidas e salas com senha.'],
        ['novo', 'Modo espectador.'],
        ['novo', 'Barra de turno fixa, selo "Na vez" e atalho Meu time.'],
        ['novo', 'Mochila no estilo dos jogos Pokémon e dado temático.'],
        ['novo', 'HUD no estilo Pokémon, caminhada pelo tabuleiro e animações de EXP.'],
        ['ajuste', 'Regras de cartas e eventos revisadas; armadilhas removidas.'],
        ['ajuste', 'Novo layout de cartas na batalha e hub de EXP no tabuleiro.'],
        ['ajuste', 'Efeitos de evento visíveis na batalha, melhorias no PvP e no celular.'],
        ['correcao', 'Online mais estável, com sincronização em segundo plano.'],
    ] },
    { date: '2026-10-23', changes: [
        ['ajuste', 'Melhorias na tela de login e na sala inicial.'],
    ] },
    { date: '2026-10-18', changes: [
        ['novo', 'Nova tela de login.'],
        ['ajuste', 'Melhorias na tela de batalha e no manual; telas agora fecham ao clicar fora.'],
    ] },
    { date: '2026-09-29', changes: [
        ['novo', 'Novos efeitos de evento global.'],
        ['correcao', 'Ajustes de sincronização e melhorias na tela de log.'],
    ] },
    { date: '2026-06-24', changes: [
        ['ajuste', 'Bots usam melhor as cartas.'],
    ] },
    { date: '2026-06-21', changes: [
        ['novo', 'Novas funcionalidades para o modo offline.'],
    ] },
    { date: '2026-06-16', changes: [
        ['novo', 'Bots no modo offline.'],
        ['ajuste', 'Online migrado para um novo servidor.'],
    ] },
    { date: '2026-06-02', changes: [
        ['ajuste', 'Ajuste na felicidade dos Pokémon.'],
        ['correcao', 'Correções nas missões.'],
    ] },
    { date: '2026-06-01', changes: [
        ['ajuste', 'Ajuste no item Mega Stone.'],
    ] },
    { date: '2026-05-31', changes: [
        ['novo', 'Nova mecânica de felicidade dos Pokémon.'],
    ] },
    { date: '2026-05-30', changes: [
        ['correcao', 'Erros ao resgatar missões.'],
    ] },
    { date: '2026-05-29', changes: [
        ['novo', 'Nova mecânica na fusão de cartas.'],
        ['novo', 'Ícone do jogo na aba do navegador.'],
        ['ajuste', 'Ajustes nas missões e na puxada para o ginásio na rodada 10.'],
        ['correcao', 'Usar uma carta não limpa mais as missões.'],
    ] },
    { date: '2026-05-28', changes: [
        ['novo', 'Missões secundárias.'],
    ] },
    { date: '2026-05-27', changes: [
        ['ajuste', 'Artes das cartas padronizadas.'],
    ] },
    { date: '2026-05-21', changes: [
        ['correcao', 'Telas de cartas e carta de trocar evento.'],
    ] },
    { date: '2026-05-20', changes: [
        ['novo', 'Novas cartas.'],
        ['ajuste', 'Melhorias visuais, incluindo os cards de treinadores, o hub de batalha e o botão de rolar o dado.'],
        ['ajuste', 'Ultra Beasts agora contam como lendários.'],
    ] },
    { date: '2026-05-19', changes: [
        ['novo', 'Novo filtro na Pokédex e tela de maestrias.'],
        ['correcao', 'Bônus de maestria do Campeão, PvP, carta O Adeus de Ash e logs.'],
    ] },
    { date: '2026-05-16', changes: [
        ['novo', 'Animação do dado.'],
        ['ajuste', 'Melhorias gráficas, no mapa e nos logs.'],
        ['correcao', 'Turno travado.'],
    ] },
    { date: '2026-05-14', changes: [
        ['correcao', 'Sincronização do online, Troca Rápida e itens dos líderes.'],
    ] },
    { date: '2026-05-13', changes: [
        ['novo', 'Manual do jogador.'],
        ['novo', 'Sistema de login e nova preparação de partida.'],
        ['ajuste', 'O Rei da Liga agora salva ressonância e maestria.'],
    ] },
    { date: '2026-05-12', changes: [
        ['novo', 'Notificação no celular.'],
        ['novo', 'Pokémon selvagens podem vir com item.'],
        ['ajuste', 'Itens de segurar agora valem também para os oponentes.'],
        ['ajuste', 'Descrições de itens melhoradas e ajuste no re-roll.'],
    ] },
    { date: '2026-05-11', changes: [
        ['novo', 'Aviso de que é a sua vez e confirmação para iniciar o turno.'],
        ['ajuste', 'Dá para fechar a batalha que está assistindo.'],
        ['correcao', 'Carta O Adeus de Ash.'],
    ] },
    { date: '2026-05-10', changes: [
        ['novo', 'Efeitos dos itens de segurar.'],
        ['ajuste', 'A carta Maldição agora afeta o Rei da Liga.'],
    ] },
    { date: '2026-05-08', changes: [
        ['ajuste', 'Logs melhores no celular.'],
        ['correcao', 'Sincronização de batalha.'],
    ] },
    { date: '2026-05-07', changes: [
        ['novo', 'Pokémon podem segurar itens.'],
        ['novo', 'Carta Espião, log de cartas usadas e log de saldo de cartas.'],
        ['correcao', 'Evento que removia carta lendária.'],
    ] },
    { date: '2026-05-06', changes: [
        ['novo', 'Carta para proteger suas cartas.'],
        ['ajuste', 'Lixeira para lendários e shinies; desistir limpa a maldição.'],
        ['correcao', 'Evolução em batalha e descrição dos itens.'],
    ] },
    { date: '2026-05-01', changes: [
        ['ajuste', 'Cartas lendárias melhoradas e estatísticas mais detalhadas.'],
        ['ajuste', 'Fusão agora pede 4 cartas.'],
    ] },
    { date: '2026-04-30', changes: [
        ['novo', 'Nova carta Do Nada Bolinha.'],
        ['ajuste', 'Ajustes na lixeira, no valor das vitaminas e na carta de ver lendários.'],
        ['correcao', 'Batalha travada ao passar a vez.'],
    ] },
    { date: '2026-04-29', changes: [
        ['novo', 'Fusão de cartas.'],
        ['correcao', 'Cartas ofensivas, carta O Adeus de Ash e status sofridos.'],
    ] },
    { date: '2026-04-28', changes: [
        ['novo', 'Cartas lendárias, novos itens e estatísticas da partida.'],
        ['novo', 'Carta para roubar Pokémon de NPC.'],
        ['ajuste', 'Novas regras para o surgimento de eventos globais e melhorias visuais.'],
        ['correcao', 'Carta Furacão e evento Desafio dos Líderes.'],
    ] },
    { date: '2026-04-22', changes: [
        ['novo', 'Raridade de cartas e novas cartas.'],
        ['ajuste', 'Novas regras de captura e melhorias no ganho de XP e nos logs.'],
    ] },
    { date: '2026-04-14', changes: [
        ['novo', 'Painel do host.'],
        ['correcao', 'Ginásio de Planta.'],
    ] },
    { date: '2026-04-12', changes: [
        ['correcao', 'Pular turno.'],
    ] },
    { date: '2026-04-10', changes: [
        ['novo', 'Filtro de log.'],
    ] },
    { date: '2026-04-09', changes: [
        ['ajuste', 'Nova chance de surgimento das cartas e ajuste das cartas globais.'],
        ['correcao', 'Mew e Mega Evolução: o Pokémon original não desmaia mais junto com o transformado.'],
    ] },
    { date: '2026-04-02', changes: [
        ['correcao', 'Passar a vez e geração do evento global.'],
    ] },
    { date: '2026-04-01', changes: [
        ['correcao', 'Turnos a pular negativos, que tiravam os benefícios da rodada.'],
    ] },
    { date: '2026-03-27', changes: [
        ['novo', 'Novos eventos globais.'],
        ['correcao', 'Carta Comunismo e efeito do Imposto de Renda para todos os jogadores.'],
    ] },
    { date: '2026-03-26', changes: [
        ['novo', 'Cartas globais Comunismo e Imposto de Renda.'],
        ['novo', 'Sobe de nível ao dar a volta no tabuleiro; inimigos também podem Mega Evoluir.'],
        ['ajuste', 'Derrotar um Pokémon não dá mais XP; limite de cartas em batalha mantido e o de itens removido.'],
        ['ajuste', 'Caixa de evento interativa e logs em ordem invertida.'],
        ['correcao', 'Mega Evolução no PvP, penalidade do Novo Líder e travamento no celular.'],
    ] },
    { date: '2026-03-25', changes: [
        ['ajuste', 'Nível máximo limitado a 25.'],
        ['correcao', 'Duplicação na Mega Evolução e sumiço do primeiro Pokémon.'],
    ] },
    { date: '2026-03-24', changes: [
        ['novo', 'Rei da Liga.'],
    ] },
    { date: '2026-03-19', changes: [
        ['ajuste', 'Melhoria no ganho de XP.'],
        ['correcao', 'Roubo de ouro e cálculo de status.'],
    ] },
    { date: '2026-03-18', changes: [
        ['ajuste', 'Eventos globais agora duram 5 rodadas; hub de evento melhorado.'],
        ['correcao', 'Bônus infinito.'],
    ] },
    { date: '2026-03-17', changes: [
        ['ajuste', 'Ajustes nas rodadas múltiplas de 10 e na Mega Evolução.'],
        ['correcao', 'Distribuição de bônus.'],
    ] },
    { date: '2026-03-14', changes: [
        ['novo', 'Eventos globais.'],
    ] },
    { date: '2026-03-12', changes: [
        ['novo', 'GIFs dos lendários.'],
    ] },
    { date: '2026-03-10', changes: [
        ['correcao', 'Pokémon que não Mega Evoluía.'],
    ] },
    { date: '2026-03-07', changes: [
        ['novo', 'Imagens nas cartas.'],
    ] },
    { date: '2026-03-06', changes: [
        ['ajuste', 'Imagens das Megas.'],
        ['correcao', 'Mega Evolução; PvP do Novo Líder com HP cheio e PvP normal como antes.'],
    ] },
    { date: '2026-03-04', changes: [
        ['ajuste', 'Melhorias na Pokédex; chance de Mega Evoluir ajustada para 10%.'],
    ] },
    { date: '2026-03-03', changes: [
        ['novo', 'Nova mecânica de Mega Evolução e novas funções para a defesa em batalha.'],
        ['novo', 'Hub de Pokémon.'],
        ['correcao', 'Batalha PvP e contagem de derrotas para o bônus.'],
    ] },
    { date: '2026-03-02', changes: [
        ['novo', 'Pokédex até a nona geração.'],
        ['novo', 'Mega Evolução.'],
        ['ajuste', 'Times dos NPCs atualizados; carta Novo Líder enfraquecida.'],
        ['correcao', 'Carta Interferência.'],
    ] },
    { date: '2026-02-26', changes: [
        ['novo', 'Quinta geração, compra de cartas e teletransporte.'],
        ['correcao', 'Mew voltando à forma original depois de uma captura.'],
    ] },
    { date: '2026-02-25', changes: [
        ['novo', 'Quarta geração.'],
        ['ajuste', 'Efeitos continuam ativos mesmo depois de ser derrotado.'],
        ['correcao', 'Tipagem do Poliwrath.'],
    ] },
    { date: '2026-02-24', changes: [
        ['novo', 'Novas cartas, incluindo as de ativação automática, e função de sacrificar cartas.'],
        ['novo', 'Novos logs de extrato.'],
        ['correcao', 'Carta Novo Líder e visualização das batalhas por quem assiste.'],
    ] },
    { date: '2026-02-23', changes: [
        ['novo', 'Nova geração de mapa e ícones de buffs e debuffs.'],
        ['correcao', 'Cidades no mapa e cartas.'],
    ] },
    { date: '2026-02-22', changes: [
        ['novo', 'Novas cartas, novos NPCs e mais recompensas ao dar a volta.'],
        ['ajuste', 'Shiny e lendário mais fortes, ajuste de esquiva e de vantagens, Slaking enfraquecido.'],
        ['correcao', 'Cartas Maldição e Novo Líder.'],
    ] },
    { date: '2026-02-20', changes: [
        ['novo', 'Ataque automático.'],
        ['ajuste', 'Líderes de ginásio mais difíceis e melhor ganho de IV e EV.'],
        ['correcao', 'Layout no celular e avatar dos jogadores.'],
    ] },
    { date: '2026-02-19', changes: [
        ['novo', 'Opção de criar sala manualmente.'],
        ['correcao', 'Segunda tipagem dos Pokémon da primeira geração.'],
    ] },
    { date: '2026-02-18', changes: [
        ['novo', 'Segunda e terceira gerações, segunda tipagem e raridade no surgimento de Pokémon.'],
        ['novo', 'Nova mecânica de batalha e times de líderes gerados dinamicamente.'],
        ['ajuste', 'Tipagem visível nos Pokémon e vantagens de tipo revisadas.'],
    ] },
    { date: '2026-02-17', changes: [
        ['novo', 'Nova opção ao cair em um ginásio que você já enfrentou.'],
        ['correcao', 'Evoluções dos Pokémon e penalidade de velocidade.'],
    ] },
    { date: '2026-02-16', changes: [
        ['novo', 'PvP automático.'],
        ['ajuste', 'Dado agora é d6; velocidade influencia a luta; XP e captura rebalanceados.'],
        ['correcao', 'Sincronização, movimento no mapa e cartas Interferência e Troca de Lugar.'],
    ] },
    { date: '2026-02-15', changes: [
        ['correcao', 'Cartas Master Ball e Armadilha.'],
    ] },
    { date: '2026-02-14', changes: [
        ['correcao', 'Sincronização do PvP e DNA do Mew.'],
    ] },
    { date: '2026-02-13', changes: [
        ['novo', 'Status do Mundo e checkpoint nas cidades.'],
        ['ajuste', 'XP por Pokémon derrotado, shiny 30% mais forte e NPCs com Pokémon melhores.'],
        ['ajuste', 'Avisos de cartas e de casas de evento, dicas dos terrenos e hub de batalha para quem assiste.'],
    ] },
    { date: '2026-02-12', changes: [
        ['novo', 'Novas funções em batalha e aviso do Campeão.'],
        ['ajuste', 'O Centro Pokémon agora também revive.'],
        ['correcao', 'Em batalhas PvP, só o desafiante tem ações.'],
    ] },
    { date: '2026-02-11', changes: [
        ['novo', 'Fundo de batalha de acordo com o terreno.'],
        ['ajuste', 'Nova lógica de XP por nível e de captura; melhor surgimento de selvagens.'],
        ['ajuste', 'Terrenos, Pokémon dos NPCs e imagens de treinadores atualizados.'],
    ] },
    { date: '2026-02-10', changes: [
        ['novo', 'Uso das cartas e log de XP.'],
        ['novo', 'Site responsivo, para jogar em qualquer tela.'],
        ['ajuste', 'Chances de captura das Poké Bolas, shiny inicial e surgimento de Pokémon.'],
        ['correcao', 'Uso do Revive, itens na bolsa e HP no online.'],
    ] },
    { date: '2026-02-09', changes: [
        ['correcao', 'Itens, captura e Pokémon inicial no online.'],
    ] },
    { date: '2026-02-08', changes: [
        ['novo', 'Ícones de itens em imagem.'],
        ['ajuste', 'Mapa com eventos, cidades e NPCs mais bem distribuídos; vantagens de tipo e ataque e defesa rebalanceados.'],
    ] },
    { date: '2026-02-07', changes: [
        ['novo', 'Pokédex com os 151 Pokémon, defesa e velocidade; novo cálculo de dano.'],
        ['correcao', 'Vários cliques em Atacar.'],
    ] },
    { date: '2026-02-06', changes: [
        ['novo', 'Ginásios, líderes, insígnias e biblioteca de cartas.'],
        ['ajuste', 'Melhorias nas batalhas e nas regras de XP.'],
    ] },
    { date: '2026-02-05', changes: [
        ['novo', 'Modo online em tempo real.'],
        ['novo', 'Jogo salvo no navegador, movimentação no tabuleiro e sprites de treinadores.'],
    ] },
    { date: '2026-02-04', changes: [
        ['novo', 'Primeira versão do PokéBoard, com os 151 Pokémon da primeira geração.'],
    ] },
];
