# PokéBoard V64 🎲⚡

Bem-vindo ao **PokéBoard V64**, um jogo de tabuleiro estratégico e divertido inspirado no universo Pokémon, acessível diretamente do seu navegador. 

## 📋 Resumo

O PokéBoard coloca você no papel de um treinador competindo em uma jornada emocionante. Escolha seu avatar, explore o tabuleiro procedural, duele contra Pokémons selvagens, NPCs, e conquiste os Líderes de Ginásio. Salve seu progresso (Offline) ou desafie seus amigos remotamente (Online utilizando o Firebase) para se certificar de ser o maior Campeão!

**Recursos Principais:**
- **Modos de Jogo:** Offline (Hotseat) e Online (Firebase com gerenciamento de Salas).
- **Mecânicas de Batalha (V2.1):** Sistema robusto onde os ataques e defesas são híbridos, trazendo cálculos de bloqueio, esquiva, acertos críticos baseados em velocidade, além de vantagens de tipo e bônus pelo lance de dados 🎲 (`D20` e `D6`).
- **Sistema de Progressão:** Level up ilimitado para sua equipe, com o recebimento de Ouro (G) e XP escalonados em vitórias, derrotas ou completando uma volta inteira no tabuleiro.
- **Missões (Quests):** Sistema dinâmico de missões e objetivos variados (comuns a épicos) que garantem valiosas recompensas como Cartas, Itens e Ouro ao serem cumpridos durante o jogo.
- **Centro Pokémon e PokéMart:** Cure sua equipe e expanda seu deck na loja de itens com Ouro arrecadado.
- **Cartas (Cards):** Funcionalidade estratégica de cartas utilizáveis no tabuleiro ou durante a batalha.
- **Pokédex Regional Dinâmica:** Base de dados contendo detalhes táticos, genética e maestrias de tipo conforme suas interações globais.

## 🛠️ Tecnologias e Stack

- **Linguagem Principal:** [TypeScript](https://www.typescriptlang.org/) `~5.9.3`
- **Ferramenta de Build/Dev:** [Vite](https://vitejs.dev/)
- **Frontend / Interface:** HTML5 puro e CSS Vanilla (`style.css`), sem frameworks visuais pesados.
- **Backend / Multiplayer:** [Firebase](https://firebase.google.com/) Realtime Database (App modular V10+).

## 📁 Estrutura Detalhada do Projeto

A arquitetura do **PokéBoard V91** segue um padrão modular para facilitar a manutenção e escalabilidade. Abaixo está o detalhamento de cada diretório e seus respectivos arquivos:

### 📂 `src/modules/` (Lógica de Domínio)
Esta é a nova camada central onde reside toda a inteligência do jogo, separada por domínios:
- **`battle/`**: Gerencia o sistema de combate.
    - `BattleCore.ts`: Lógica principal, controle de turnos e fluxo de batalha.
    - `BattleCalc.ts`: Cálculos matemáticos de dano, esquiva, crítico e vantagens de tipo.
    - `BattleUI.ts`: Manipulação do DOM específica para a tela de batalha.
- **`cards/`**: Sistema de cartas estratégicas.
    - `CardManager.ts`: Controle do inventário de cartas e sorteios.
    - `CardEffects.ts`: Implementação técnica do efeito de cada carta no jogo.
    - `CardUI.ts`: Interface visual do deck e animações de uso.
- **`game/`**: Gerenciamento global do estado.
    - `GameState.ts`: Controle de turnos, rounds e persistência local/remota.
    - `GameEvents.ts`: Lógica dos Eventos Globais (ex: Blood Moon, Gold Rush).
    - `GameMovement.ts`: Lógica de movimentação dos jogadores no tabuleiro.
    - `GameSpawns.ts`: Geração de encontros selvagens e NPCs.
    - `GameUI.ts`: Atualização de elementos da UI principal (HUD, Logs).
- **`quests/`**: Sistema de desafios e missões.
    - `QuestManager.ts`: Controle e rastreamento de missões, progresso e entrega de recompensas.
- **`map/`**: Geração do mundo.
    - `MapGenerator.ts`: Algoritmo procedural para criação da grade do tabuleiro.
    - `MapRender.ts`: Renderização visual e cálculo de coordenadas (Isometric/Grid).
- **`network/`**: Comunicação Multiplayer.
    - `FirebaseInit.ts`: Configuração e conexão com o Firebase Realtime Database.
    - `NetworkActions.ts`: Comandos de envio (Sync de ataques, movimentos, etc).
    - `NetworkSync.ts`: Listeners que recebem e aplicam mudanças de outros jogadores.
- **`shop/`**: Sistema econômico.
    - `ShopLogic.ts`: Processamento de compras e validação de saldo.
    - `ShopUI.ts`: Interface do PokéMart e Centro Pokémon.

### 📂 `src/systems/` (Facades / Pontes)
Arquivos que servem como interfaces simplificadas para o mundo externo (especialmente chamadas vindas do `index.html`).
- `Battle.ts`, `Cards.ts`, `MapSystem.ts`, `Network.ts`, `Shop.ts`: Atuam como roteadores que delegam as chamadas para os seus respectivos `modules`.

### 📂 `src/core/` (Orquestração)
- `Game.ts`: A classe "Master" que inicializa e coordena todos os sistemas.
- `Setup.ts`: Lida com a configuração inicial do ambiente e variáveis globais.

### 📂 `src/models/` (Definições de Dados)
- `Player.ts`: Classe que define a estrutura de um Treinador (Time, Insígnias, Gold).
- `Pokemon.ts`: Classe que define os atributos e métodos de um Pokémon individual (XP, HP, Stats).

### 📂 `src/constants/` (Base de Dados)
Contém toda a informação estática do jogo:
- `pokedex.ts`: Lista completa de Pokémons, tipos e atributos base.
- `items.ts` / `cards.ts`: Catálogo de itens e cartas disponíveis.
- `gyms.ts` / `npcs.ts`: Definições dos Líderes de Ginásio e Treinadores.
- `typeChart.ts`: Tabela de vantagens e fraquezas elementares.

### 📂 Outros Arquivos
- **`index.html`**: Estrutura de visualização principal e definição de Modais.
- **`src/style.css`**: Todo o design visual, layouts de grid e animações CSS.
- **`inventario.json`**: Documento técnico que mapeia a saúde e progresso da estrutura do projeto.

## 🚀 Como Iniciar

1. Certifique-se de que o **Node.js** e o **npm** estejam instalados localmente.
2. Inicie instalando as dependências do `package.json`:
   ```bash
   npm install
   ```
3. Rode o ambiente de desenvolvimento local:
   ```bash
   npm run dev
   ```
4. Navegue localmente na porta exibida no console (ex: `http://localhost:5173/`).

## 📦 Deploy e Compilação para Produção

Para validar checagens do TypeScript e realizar o *bundle* estático para publicação web (como Firebase Hosting):
```bash
npm run build
```
*(Os arquivos otimizados prontos para deploy vão para o diretório `dist/`)*.
