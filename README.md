# PokéBoard V64 🎲⚡

Bem-vindo ao **PokéBoard V64**, um jogo de tabuleiro estratégico e divertido inspirado no universo Pokémon, acessível diretamente do seu navegador. 

## 📋 Resumo

O PokéBoard coloca você no papel de um treinador competindo em uma jornada emocionante. Escolha seu avatar, explore o tabuleiro procedural, duele contra Pokémons selvagens, NPCs, e conquiste os Líderes de Ginásio. Salve seu progresso (Offline) ou desafie seus amigos remotamente (Online utilizando o Firebase) para se certificar de ser o maior Campeão!

**Recursos Principais:**
- **Modos de Jogo:** Offline (Hotseat) e Online (Firebase com gerenciamento de Salas).
- **Mecânicas de Batalha (V2.1):** Sistema robusto onde os ataques e defesas são híbridos, trazendo cálculos de bloqueio, esquiva, acertos críticos baseados em velocidade, além de vantagens de tipo e bônus pelo lance de dados 🎲 (`D20` e `D6`).
- **Sistema de Progressão:** Level up ilimitado para sua equipe, com o recebimento de Ouro (G) e XP escalonados em vitórias, derrotas ou completando uma volta inteira no tabuleiro.
- **Centro Pokémon e PokéMart:** Cure sua equipe e expanda seu deck na loja de itens com Ouro arrecadado.
- **Cartas (Cards):** Funcionalidade estratégica de cartas utilizáveis no tabuleiro ou durante a batalha.
- **Pokédex Regional Dinâmica:** Base de dados contendo detalhes táticos, genética e maestrias de tipo conforme suas interações globais.

## 🛠️ Tecnologias e Stack

- **Linguagem Principal:** [TypeScript](https://www.typescriptlang.org/) `~5.9.3`
- **Ferramenta de Build/Dev:** [Vite](https://vitejs.dev/)
- **Frontend / Interface:** HTML5 puro e CSS Vanilla (`style.css`), sem frameworks visuais pesados.
- **Backend / Multiplayer:** [Firebase](https://firebase.google.com/) Realtime Database (App modular V10+).

## 📁 Estrutura de Diretórios 

Toda a lógica foi desenvolvida modularmente. Abaixo está a visão macro do projeto:

```text
c:\Desenvolvimentos\PokeBoard\
├── public/                 # Asset estáticos puros (Imagens de treinadores, pokemons e tilesets).
├── src/                    # Código-fonte compilável do jogo em TypeScript.
│   ├── constants/          # Constantes estáticas e dados JSON-like (Pokédex, Itens, NPCs, Ginásios, Tipos, Raridades).
│   ├── core/               # Núcleo Central (Game.ts gerencia as interações, Setup.ts lida com as inicializações).
│   ├── models/             # Interfaces (Tipos TS estritos garantindo qualidade e redução de bugs de código).
│   ├── systems/            # Módulos operacionais isolados do núcleo:
│   │   ├── Battle.ts       # Mecanismo, cálculos e fluxo de turnos em Combates PVE/PVP.
│   │   ├── Cards.ts        # Gerenciamento do deck de cartas do jogador no tabuleiro e batalhas.
│   │   ├── MapSystem.ts    # Renderização da grade procedural do jogo (Tiles vazios, NPCs, Mato Alto, etc).
│   │   ├── Network.ts      # Envio e recebimento remoto via Firebase.
│   │   └── Shop.ts         # Central de Compras (Centro Pokémon / Loja de Itens).
│   ├── main.ts             # Boostrap do jogo (Injeta as classes e objetos no escopo global para o DOM interagir).
│   └── style.css           # Estilizações da Engine Web, Grids e Animações base.
├── docs/                   # Documentações e design patterns.
├── index.html              # UI (User Interface) e Modais.
├── package.json            # Manifest do Projeto (Comandos CLI e Dependências Dev/Prod).
├── tsconfig.json           # Regras do compilador TypeScript.
├── firebase.json           # Configurações de Deploy no Firebase Hosting.
└── inventario.json         # Inventário em JSON espelhando a estrutura modular detalhada deste Readme.
```

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
