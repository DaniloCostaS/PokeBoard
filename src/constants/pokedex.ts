import type { PokemonData } from './types';

export const POKEDEX: PokemonData[] = [
    // --- STARTERS & BUGS ---
    { id: 1, name: "Bulbasaur", type: "Grama", hp: 68, atk: 16, nextForm: "Ivysaur", evoTrigger: 16 },
    { id: 2, name: "Ivysaur", type: "Grama", hp: 90, atk: 20, nextForm: "Venusaur", evoTrigger: 32 },
    { id: 3, name: "Venusaur", type: "Grama", hp: 120, atk: 27, nextForm: null },
    { id: 4, name: "Charmander", type: "Fogo", hp: 58, atk: 17, nextForm: "Charmeleon", evoTrigger: 16 },
    { id: 5, name: "Charmeleon", type: "Fogo", hp: 87, atk: 21, nextForm: "Charizard", evoTrigger: 36 },
    { id: 6, name: "Charizard", type: "Fogo", hp: 117, atk: 28, nextForm: null },
    { id: 7, name: "Squirtle", type: "Água", hp: 66, atk: 16, nextForm: "Wartortle", evoTrigger: 16 },
    { id: 8, name: "Wartortle", type: "Água", hp: 88, atk: 21, nextForm: "Blastoise", evoTrigger: 36 },
    { id: 9, name: "Blastoise", type: "Água", hp: 118, atk: 27, nextForm: null },
    { id: 10, name: "Caterpie", type: "Inseto", hp: 68, atk: 10, nextForm: "Metapod", evoTrigger: 7 },
    { id: 11, name: "Metapod", type: "Inseto", hp: 75, atk: 7, nextForm: "Butterfree", evoTrigger: 10 },
    { id: 12, name: "Butterfree", type: "Inseto", hp: 90, atk: 15, nextForm: null },
    { id: 13, name: "Weedle", type: "Inseto", hp: 60, atk: 11, nextForm: "Kakuna", evoTrigger: 7 },
    { id: 14, name: "Kakuna", type: "Inseto", hp: 68, atk: 8, nextForm: "Beedrill", evoTrigger: 10 },
    { id: 15, name: "Beedrill", type: "Inseto", hp: 98, atk: 30, nextForm: null },
    
    // --- NORMAL / FLYING EARLY ---
    { id: 16, name: "Pidgey", type: "Normal", hp: 60, atk: 15, nextForm: "Pidgeotto", evoTrigger: 18 },
    { id: 17, name: "Pidgeotto", type: "Normal", hp: 94, atk: 20, nextForm: "Pidgeot", evoTrigger: 36 },
    { id: 18, name: "Pidgeot", type: "Normal", hp: 124, atk: 26, nextForm: null },
    { id: 19, name: "Rattata", type: "Normal", hp: 45, atk: 18, nextForm: "Raticate", evoTrigger: 20 },
    { id: 20, name: "Raticate", type: "Normal", hp: 82, atk: 27, nextForm: null },
    { id: 21, name: "Spearow", type: "Normal", hp: 60, atk: 20, nextForm: "Fearow", evoTrigger: 20 },
    { id: 22, name: "Fearow", type: "Normal", hp: 97, atk: 30, nextForm: null },
    
    // --- SNAKES & MICE ---
    { id: 23, name: "Ekans", type: "Veneno", hp: 52, atk: 20, nextForm: "Arbok", evoTrigger: 22 },
    { id: 24, name: "Arbok", type: "Veneno", hp: 90, atk: 31, nextForm: null },
    { id: 25, name: "Pikachu", type: "Elétrico", hp: 52, atk: 18, nextForm: "Raichu", evoTrigger: 25 }, // Pedra Trovão -> Lv 25
    { id: 26, name: "Raichu", type: "Elétrico", hp: 90, atk: 30, nextForm: null },
    { id: 27, name: "Sandshrew", type: "Terra", hp: 75, atk: 25, nextForm: "Sandslash", evoTrigger: 22 },
    { id: 28, name: "Sandslash", type: "Terra", hp: 112, atk: 33, nextForm: null },
    
    // --- NIDORANS ---
    { id: 29, name: "Nidoran♀", type: "Veneno", hp: 82, atk: 15, nextForm: "Nidorina", evoTrigger: 16 },
    { id: 30, name: "Nidorina", type: "Veneno", hp: 105, atk: 20, nextForm: "Nidoqueen", evoTrigger: 30 }, // Pedra Lua -> Lv 30
    { id: 31, name: "Nidoqueen", type: "Veneno", hp: 135, atk: 30, nextForm: null },
    { id: 32, name: "Nidoran♂", type: "Veneno", hp: 69, atk: 19, nextForm: "Nidorino", evoTrigger: 16 },
    { id: 33, name: "Nidorino", type: "Veneno", hp: 91, atk: 24, nextForm: "Nidoking", evoTrigger: 30 }, // Pedra Lua -> Lv 30
    { id: 34, name: "Nidoking", type: "Veneno", hp: 121, atk: 34, nextForm: null },
    
    // --- FAIRIES & FOXES ---
    { id: 35, name: "Clefairy", type: "Fada", hp: 105, atk: 15, nextForm: "Clefable", evoTrigger: 25 }, // Pedra Lua -> Lv 25
    { id: 36, name: "Clefable", type: "Fada", hp: 142, atk: 23, nextForm: null },
    { id: 37, name: "Vulpix", type: "Fogo", hp: 57, atk: 13, nextForm: "Ninetales", evoTrigger: 25 }, // Pedra Fogo -> Lv 25
    { id: 38, name: "Ninetales", type: "Fogo", hp: 109, atk: 25, nextForm: null },
    { id: 39, name: "Jigglypuff", type: "Fada", hp: 172, atk: 15, nextForm: "Wigglytuff", evoTrigger: 25 }, // Pedra Lua -> Lv 25
    { id: 40, name: "Wigglytuff", type: "Fada", hp: 210, atk: 23, nextForm: null },
    
    // --- BATS & PLANTS ---
    { id: 41, name: "Zubat", type: "Veneno", hp: 60, atk: 15, nextForm: "Golbat", evoTrigger: 22 },
    { id: 42, name: "Golbat", type: "Veneno", hp: 112, atk: 26, nextForm: null },
    { id: 43, name: "Oddish", type: "Grama", hp: 67, atk: 16, nextForm: "Gloom", evoTrigger: 21 },
    { id: 44, name: "Gloom", type: "Grama", hp: 90, atk: 21, nextForm: "Vileplume", evoTrigger: 30 }, // Pedra Folha -> Lv 30
    { id: 45, name: "Vileplume", type: "Grama", hp: 112, atk: 26, nextForm: null },
    { id: 46, name: "Paras", type: "Inseto", hp: 52, atk: 23, nextForm: "Parasect", evoTrigger: 24 },
    { id: 47, name: "Parasect", type: "Inseto", hp: 90, atk: 31, nextForm: null },
    { id: 48, name: "Venonat", type: "Inseto", hp: 90, atk: 18, nextForm: "Venomoth", evoTrigger: 31 },
    { id: 49, name: "Venomoth", type: "Inseto", hp: 105, atk: 21, nextForm: null },
    { id: 50, name: "Diglett", type: "Terra", hp: 15, atk: 18, nextForm: "Dugtrio", evoTrigger: 26 },
    { id: 51, name: "Dugtrio", type: "Terra", hp: 52, atk: 33, nextForm: null },
    
    // --- CATS & DUCKS ---
    { id: 52, name: "Meowth", type: "Normal", hp: 60, atk: 15, nextForm: "Persian", evoTrigger: 28 },
    { id: 53, name: "Persian", type: "Normal", hp: 97, atk: 23, nextForm: null },
    { id: 54, name: "Psyduck", type: "Água", hp: 75, atk: 17, nextForm: "Golduck", evoTrigger: 33 },
    { id: 55, name: "Golduck", type: "Água", hp: 120, atk: 27, nextForm: null },
    { id: 56, name: "Mankey", type: "Lutador", hp: 60, atk: 26, nextForm: "Primeape", evoTrigger: 28 },
    { id: 57, name: "Primeape", type: "Lutador", hp: 97, atk: 35, nextForm: null },
    { id: 58, name: "Growlithe", type: "Fogo", hp: 82, atk: 23, nextForm: "Arcanine", evoTrigger: 25 }, // Pedra Fogo -> Lv 25
    { id: 59, name: "Arcanine", type: "Fogo", hp: 135, atk: 36, nextForm: null },
    
    // --- WATER & PSYCHIC ---
    { id: 60, name: "Poliwag", type: "Água", hp: 60, atk: 16, nextForm: "Poliwhirl", evoTrigger: 25 },
    { id: 61, name: "Poliwhirl", type: "Água", hp: 97, atk: 21, nextForm: "Poliwrath", evoTrigger: 35 }, // Pedra Água -> Lv 35
    { id: 62, name: "Poliwrath", type: "Lutador", hp: 135, atk: 31, nextForm: null },
    { id: 63, name: "Abra", type: "Psíquico", hp: 37, atk: 6, nextForm: "Kadabra", evoTrigger: 16 },
    { id: 64, name: "Kadabra", type: "Psíquico", hp: 60, atk: 11, nextForm: "Alakazam", evoTrigger: 40 }, // Troca -> Lv 40
    { id: 65, name: "Alakazam", type: "Psíquico", hp: 82, atk: 16, nextForm: null }, // Nota: Alakazam é Atk Especial puro, atk fisico baixo
    { id: 66, name: "Machop", type: "Lutador", hp: 105, atk: 26, nextForm: "Machoke", evoTrigger: 28 },
    { id: 67, name: "Machoke", type: "Lutador", hp: 120, atk: 33, nextForm: "Machamp", evoTrigger: 40 }, // Troca -> Lv 40
    { id: 68, name: "Machamp", type: "Lutador", hp: 135, atk: 43, nextForm: null },
    { id: 69, name: "Bellsprout", type: "Grama", hp: 75, atk: 25, nextForm: "Weepinbell", evoTrigger: 21 },
    { id: 70, name: "Weepinbell", type: "Grama", hp: 97, atk: 30, nextForm: "Victreebel", evoTrigger: 30 }, // Pedra Folha -> Lv 30
    { id: 71, name: "Victreebel", type: "Grama", hp: 120, atk: 35, nextForm: null },
    
    // --- TENTA & ROCKS ---
    { id: 72, name: "Tentacool", type: "Água", hp: 60, atk: 13, nextForm: "Tentacruel", evoTrigger: 30 },
    { id: 73, name: "Tentacruel", type: "Água", hp: 120, atk: 23, nextForm: null },
    { id: 74, name: "Geodude", type: "Pedra", hp: 60, atk: 26, nextForm: "Graveler", evoTrigger: 25 },
    { id: 75, name: "Graveler", type: "Pedra", hp: 82, atk: 31, nextForm: "Golem", evoTrigger: 40 }, // Troca -> Lv 40
    { id: 76, name: "Golem", type: "Pedra", hp: 120, atk: 40, nextForm: null },
    { id: 77, name: "Ponyta", type: "Fogo", hp: 75, atk: 28, nextForm: "Rapidash", evoTrigger: 40 },
    { id: 78, name: "Rapidash", type: "Fogo", hp: 97, atk: 33, nextForm: null },
    { id: 79, name: "Slowpoke", type: "Água", hp: 135, atk: 21, nextForm: "Slowbro", evoTrigger: 37 },
    { id: 80, name: "Slowbro", type: "Água", hp: 142, atk: 25, nextForm: null },
    
    // --- MAGNETS & DUCKS ---
    { id: 81, name: "Magnemite", type: "Elétrico", hp: 37, atk: 11, nextForm: "Magneton", evoTrigger: 30 },
    { id: 82, name: "Magneton", type: "Elétrico", hp: 75, atk: 20, nextForm: null },
    { id: 83, name: "Farfetch'd", type: "Normal", hp: 78, atk: 30, nextForm: null },
    { id: 84, name: "Doduo", type: "Normal", hp: 52, atk: 28, nextForm: "Dodrio", evoTrigger: 31 },
    { id: 85, name: "Dodrio", type: "Normal", hp: 90, atk: 36, nextForm: null },
    { id: 86, name: "Seel", type: "Água", hp: 97, atk: 15, nextForm: "Dewgong", evoTrigger: 34 },
    { id: 87, name: "Dewgong", type: "Gelo", hp: 135, atk: 23, nextForm: null },
    { id: 88, name: "Grimer", type: "Veneno", hp: 120, atk: 26, nextForm: "Muk", evoTrigger: 38 },
    { id: 89, name: "Muk", type: "Veneno", hp: 157, atk: 35, nextForm: null },
    
    // --- GHOSTS & SHELLS ---
    { id: 90, name: "Shellder", type: "Água", hp: 45, atk: 21, nextForm: "Cloyster", evoTrigger: 25 }, // Pedra Água -> Lv 25
    { id: 91, name: "Cloyster", type: "Gelo", hp: 75, atk: 31, nextForm: null },
    { id: 92, name: "Gastly", type: "Fantasma", hp: 45, atk: 11, nextForm: "Haunter", evoTrigger: 25 },
    { id: 93, name: "Haunter", type: "Fantasma", hp: 67, atk: 16, nextForm: "Gengar", evoTrigger: 40 }, // Troca -> Lv 40
    { id: 94, name: "Gengar", type: "Fantasma", hp: 90, atk: 21, nextForm: null },
    { id: 95, name: "Onix", type: "Pedra", hp: 52, atk: 15, nextForm: null },
    { id: 96, name: "Drowzee", type: "Psíquico", hp: 90, atk: 16, nextForm: "Hypno", evoTrigger: 26 },
    { id: 97, name: "Hypno", type: "Psíquico", hp: 127, atk: 24, nextForm: null },
    
    // --- CRABS & BALLS ---
    { id: 98, name: "Krabby", type: "Água", hp: 45, atk: 35, nextForm: "Kingler", evoTrigger: 28 },
    { id: 99, name: "Kingler", type: "Água", hp: 82, atk: 43, nextForm: null },
    { id: 100, name: "Voltorb", type: "Elétrico", hp: 60, atk: 10, nextForm: "Electrode", evoTrigger: 30 },
    { id: 101, name: "Electrode", type: "Elétrico", hp: 90, atk: 16, nextForm: null },
    { id: 102, name: "Exeggcute", type: "Grama", hp: 90, atk: 13, nextForm: "Exeggutor", evoTrigger: 25 }, // Pedra Folha -> Lv 25
    { id: 103, name: "Exeggutor", type: "Grama", hp: 142, atk: 31, nextForm: null },
    { id: 104, name: "Cubone", type: "Terra", hp: 75, atk: 16, nextForm: "Marowak", evoTrigger: 28 },
    { id: 105, name: "Marowak", type: "Terra", hp: 90, atk: 26, nextForm: null },
    
    // --- FIGHTERS ---
    { id: 106, name: "Hitmonlee", type: "Lutador", hp: 75, atk: 40, nextForm: null },
    { id: 107, name: "Hitmonchan", type: "Lutador", hp: 75, atk: 35, nextForm: null },
    { id: 108, name: "Lickitung", type: "Normal", hp: 135, atk: 18, nextForm: null },
    { id: 109, name: "Koffing", type: "Veneno", hp: 60, atk: 21, nextForm: "Weezing", evoTrigger: 35 },
    { id: 110, name: "Weezing", type: "Veneno", hp: 97, atk: 30, nextForm: null },
    { id: 111, name: "Rhyhorn", type: "Terra", hp: 120, atk: 28, nextForm: "Rhydon", evoTrigger: 42 },
    { id: 112, name: "Rhydon", type: "Terra", hp: 157, atk: 43, nextForm: null },
    { id: 113, name: "Chansey", type: "Normal", hp: 375, atk: 10, nextForm: null }, // Tank de HP!
    { id: 114, name: "Tangela", type: "Grama", hp: 97, atk: 18, nextForm: null },
    { id: 115, name: "Kangaskhan", type: "Normal", hp: 157, atk: 31, nextForm: null },
    
    // --- SEA & GEMS ---
    { id: 116, name: "Horsea", type: "Água", hp: 45, atk: 13, nextForm: "Seadra", evoTrigger: 32 },
    { id: 117, name: "Seadra", type: "Água", hp: 82, atk: 21, nextForm: null },
    { id: 118, name: "Goldeen", type: "Água", hp: 67, atk: 22, nextForm: "Seaking", evoTrigger: 33 },
    { id: 119, name: "Seaking", type: "Água", hp: 120, atk: 30, nextForm: null },
    { id: 120, name: "Staryu", type: "Água", hp: 45, atk: 15, nextForm: "Starmie", evoTrigger: 25 }, // Pedra Água -> Lv 25
    { id: 121, name: "Starmie", type: "Água", hp: 90, atk: 25, nextForm: null },
    { id: 122, name: "Mr. Mime", type: "Fada", hp: 60, atk: 15, nextForm: null },
    { id: 123, name: "Scyther", type: "Inseto", hp: 105, atk: 36, nextForm: null },
    { id: 124, name: "Jynx", type: "Gelo", hp: 97, atk: 16, nextForm: null },
    { id: 125, name: "Electabuzz", type: "Elétrico", hp: 97, atk: 27, nextForm: null },
    { id: 126, name: "Magmar", type: "Fogo", hp: 97, atk: 31, nextForm: null },
    { id: 127, name: "Pinsir", type: "Inseto", hp: 97, atk: 41, nextForm: null },
    { id: 128, name: "Tauros", type: "Normal", hp: 112, atk: 33, nextForm: null },
    
    // --- MAGICARPA ---
    { id: 129, name: "Magikarp", type: "Água", hp: 30, atk: 3, nextForm: "Gyarados", evoTrigger: 20 },
    { id: 130, name: "Gyarados", type: "Água", hp: 142, atk: 41, nextForm: null },
    { id: 131, name: "Lapras", type: "Gelo", hp: 195, atk: 28, nextForm: null },
    { id: 132, name: "Ditto", type: "Normal", hp: 72, atk: 16, nextForm: null },
    
    // --- EEVEE ---
    { id: 133, name: "Eevee", type: "Normal", hp: 82, atk: 18, nextForm: "Vaporeon", evoTrigger: 25 }, // Evolução Random (simplificado)
    { id: 134, name: "Vaporeon", type: "Água", hp: 195, atk: 21, nextForm: null },
    { id: 135, name: "Jolteon", type: "Elétrico", hp: 97, atk: 21, nextForm: null },
    { id: 136, name: "Flareon", type: "Fogo", hp: 97, atk: 43, nextForm: null },
    
    // --- FOSSILS ---
    { id: 137, name: "Porygon", type: "Normal", hp: 97, atk: 20, nextForm: null },
    { id: 138, name: "Omanyte", type: "Pedra", hp: 52, atk: 13, nextForm: "Omastar", evoTrigger: 40 },
    { id: 139, name: "Omastar", type: "Pedra", hp: 105, atk: 20, nextForm: null },
    { id: 140, name: "Kabuto", type: "Pedra", hp: 45, atk: 26, nextForm: "Kabutops", evoTrigger: 40 },
    { id: 141, name: "Kabutops", type: "Pedra", hp: 90, atk: 38, nextForm: null },
    { id: 142, name: "Aerodactyl", type: "Pedra", hp: 120, atk: 35, nextForm: null },
    { id: 143, name: "Snorlax", type: "Normal", hp: 240, atk: 36, nextForm: null },
    
    // --- LEGENDARIES ---
    { id: 144, name: "Articuno", type: "Gelo", hp: 135, atk: 28, isLegendary: true, nextForm: null },
    { id: 145, name: "Zapdos", type: "Elétrico", hp: 135, atk: 30, isLegendary: true, nextForm: null },
    { id: 146, name: "Moltres", type: "Fogo", hp: 135, atk: 33, isLegendary: true, nextForm: null },
    
    // --- DRAGONS ---
    { id: 147, name: "Dratini", type: "Dragão", hp: 61, atk: 21, nextForm: "Dragonair", evoTrigger: 30 },
    { id: 148, name: "Dragonair", type: "Dragão", hp: 91, atk: 28, nextForm: "Dragonite", evoTrigger: 55 },
    { id: 149, name: "Dragonite", type: "Dragão", hp: 136, atk: 44, nextForm: null },
    
    // --- UBER ---
    { id: 150, name: "Mewtwo", type: "Psíquico", hp: 159, atk: 36, isLegendary: true, nextForm: null },
    { id: 151, name: "Mew", type: "Psíquico", hp: 150, atk: 33, isLegendary: true, nextForm: null }
];