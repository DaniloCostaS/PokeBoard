import type { PokemonData } from './types';

export const POKEDEX: PokemonData[] = [
  // PRIMEIRA GERAÇÃO
  {"id": 1, "name": "Bulbasaur", "type": "Grama", "secondType": "Veneno", "BaseTotal": 204, "hp": 45, "atk": 57, "def": 57, "spd": 45, "stage": 1, "nextForm": "Ivysaur", "evoTrigger": 5},
  {"id": 2, "name": "Ivysaur", "type": "Grama", "secondType": "Veneno", "BaseTotal": 263, "hp": 60, "atk": 71, "def": 72, "spd": 60, "stage": 2, "nextForm": "Venusaur", "evoTrigger": 10},
  {"id": 3, "name": "Venusaur", "type": "Grama", "secondType": "Veneno", "BaseTotal": 343, "hp": 80, "atk": 91, "def": 92, "spd": 80, "stage": 3, "nextForm": null},

  {"id": 4, "name": "Charmander", "type": "Fogo", "secondType": "", "BaseTotal": 207, "hp": 39, "atk": 56, "def": 47, "spd": 65, "stage": 1, "nextForm": "Charmeleon", "evoTrigger": 5},
  {"id": 5, "name": "Charmeleon", "type": "Fogo", "secondType": "", "BaseTotal": 272, "hp": 58, "atk": 72, "def": 62, "spd": 80, "stage": 2, "nextForm": "Charizard", "evoTrigger": 10},
  {"id": 6, "name": "Charizard", "type": "Fogo", "secondType": "Voador", "BaseTotal": 357, "hp": 78, "atk": 97, "def": 82, "spd": 100, "stage": 3, "nextForm": null},

  {"id": 7, "name": "Squirtle", "type": "Água", "secondType": "", "BaseTotal": 201, "hp": 44, "atk": 49, "def": 65, "spd": 43, "stage": 1, "nextForm": "Wartortle", "evoTrigger": 5},
  {"id": 8, "name": "Wartortle", "type": "Água", "secondType": "", "BaseTotal": 261, "hp": 59, "atk": 64, "def": 80, "spd": 58, "stage": 2, "nextForm": "Blastoise", "evoTrigger": 10},
  {"id": 9, "name": "Blastoise", "type": "Água", "secondType": "", "BaseTotal": 344, "hp": 79, "atk": 84, "def": 103, "spd": 78, "stage": 3, "nextForm": null},

  {"id": 10, "name": "Caterpie", "type": "Inseto", "secondType": "", "BaseTotal": 143, "hp": 45, "atk": 25, "def": 28, "spd": 45, "stage": 1, "nextForm": "Metapod", "evoTrigger": 5},
  {"id": 11, "name": "Metapod", "type": "Inseto", "secondType": "", "BaseTotal": 143, "hp": 50, "atk": 23, "def": 40, "spd": 30, "stage": 2, "nextForm": "Butterfree", "evoTrigger": 10},
  {"id": 12, "name": "Butterfree", "type": "Inseto", "secondType": "Voador", "BaseTotal": 263, "hp": 60, "atk": 68, "def": 65, "spd": 70, "stage": 3, "nextForm": null},

  {"id": 13, "name": "Weedle", "type": "Inseto", "secondType": "Veneno", "BaseTotal": 143, "hp": 40, "atk": 28, "def": 25, "spd": 50, "stage": 1, "nextForm": "Kakuna", "evoTrigger": 5},
  {"id": 14, "name": "Kakuna", "type": "Inseto", "secondType": "Veneno", "BaseTotal": 143, "hp": 45, "atk": 25, "def": 38, "spd": 35, "stage": 2, "nextForm": "Beedrill", "evoTrigger": 10},
  {"id": 15, "name": "Beedrill", "type": "Inseto", "secondType": "Veneno", "BaseTotal": 268, "hp": 65, "atk": 68, "def": 60, "spd": 75, "stage": 3, "nextForm": null},

  {"id": 16, "name": "Pidgey", "type": "Voador", "secondType": "Normal", "BaseTotal": 174, "hp": 40, "atk": 40, "def": 38, "spd": 56, "stage": 1, "nextForm": "Pidgeotto", "evoTrigger": 5},
  {"id": 17, "name": "Pidgeotto", "type": "Voador", "secondType": "Normal", "BaseTotal": 242, "hp": 63, "atk": 55, "def": 53, "spd": 71, "stage": 2, "nextForm": "Pidgeot", "evoTrigger": 10},
  {"id": 18, "name": "Pidgeot", "type": "Voador", "secondType": "Normal", "BaseTotal": 322, "hp": 83, "atk": 75, "def": 73, "spd": 91, "stage": 3, "nextForm": null},

  {"id": 19, "name": "Rattata", "type": "Normal", "secondType": "", "BaseTotal": 178, "hp": 30, "atk": 41, "def": 35, "spd": 72, "stage": 1, "nextForm": "Raticate", "evoTrigger": 8},
  {"id": 20, "name": "Raticate", "type": "Normal", "secondType": "", "BaseTotal": 283, "hp": 55, "atk": 66, "def": 65, "spd": 97, "stage": 2, "nextForm": null},

  {"id": 21, "name": "Spearow", "type": "Voador", "secondType": "Normal", "BaseTotal": 187, "hp": 40, "atk": 46, "def": 31, "spd": 70, "stage": 1, "nextForm": "Fearow", "evoTrigger": 8},
  {"id": 22, "name": "Fearow", "type": "Voador", "secondType": "Normal", "BaseTotal": 304, "hp": 65, "atk": 76, "def": 63, "spd": 100, "stage": 2, "nextForm": null},

  {"id": 23, "name": "Ekans", "type": "Veneno", "secondType": "", "BaseTotal": 189, "hp": 35, "atk": 50, "def": 49, "spd": 55, "stage": 1, "nextForm": "Arbok", "evoTrigger": 8},
  {"id": 24, "name": "Arbok", "type": "Veneno", "secondType": "", "BaseTotal": 294, "hp": 60, "atk": 80, "def": 74, "spd": 80, "stage": 2, "nextForm": null},

  {"id": 25, "name": "Pikachu", "type": "Elétrico", "secondType": "", "BaseTotal": 223, "hp": 35, "atk": 53, "def": 45, "spd": 90, "stage": 2, "nextForm": "Raichu", "evoTrigger": 10},
  {"id": 26, "name": "Raichu", "type": "Elétrico", "secondType": "", "BaseTotal": 328, "hp": 60, "atk": 90, "def": 68, "spd": 110, "stage": 3, "nextForm": null},

  {"id": 27, "name": "Sandshrew", "type": "Terra", "secondType": "", "BaseTotal": 196, "hp": 50, "atk": 48, "def": 58, "spd": 40, "stage": 1, "nextForm": "Sandslash", "evoTrigger": 8},
  {"id": 28, "name": "Sandslash", "type": "Terra", "secondType": "", "BaseTotal": 296, "hp": 75, "atk": 73, "def": 83, "spd": 65, "stage": 2, "nextForm": null},

  {"id": 29, "name": "Nidoran♀", "type": "Veneno", "secondType": "", "BaseTotal": 186, "hp": 55, "atk": 44, "def": 46, "spd": 41, "stage": 1, "nextForm": "Nidorina", "evoTrigger": 5},
  {"id": 30, "name": "Nidorina", "type": "Veneno", "secondType": "", "BaseTotal": 246, "hp": 70, "atk": 59, "def": 61, "spd": 56, "stage": 2, "nextForm": "Nidoqueen", "evoTrigger": 10},
  {"id": 31, "name": "Nidoqueen", "type": "Veneno", "secondType": "Terra", "BaseTotal": 336, "hp": 90, "atk": 84, "def": 86, "spd": 76, "stage": 3, "nextForm": null},

  {"id": 32, "name": "Nidoran♂", "type": "Veneno", "secondType": "", "BaseTotal": 185, "hp": 46, "atk": 49, "def": 40, "spd": 50, "stage": 1, "nextForm": "Nidorino", "evoTrigger": 5},
  {"id": 33, "name": "Nidorino", "type": "Veneno", "secondType": "", "BaseTotal": 246, "hp": 61, "atk": 64, "def": 56, "spd": 65, "stage": 2, "nextForm": "Nidoking", "evoTrigger": 10},
  {"id": 34, "name": "Nidoking", "type": "Veneno", "secondType": "Terra", "BaseTotal": 336, "hp": 81, "atk": 94, "def": 76, "spd": 85, "stage": 3, "nextForm": null},

  {"id": 35, "name": "Clefairy", "type": "Fada", "secondType": "", "BaseTotal": 215, "hp": 70, "atk": 53, "def": 57, "spd": 35, "stage": 2, "nextForm": "Clefable", "evoTrigger": 10},
  {"id": 36, "name": "Clefable", "type": "Fada", "secondType": "", "BaseTotal": 320, "hp": 95, "atk": 83, "def": 82, "spd": 60, "stage": 3, "nextForm": null},

  {"id": 37, "name": "Vulpix", "type": "Fogo", "secondType": "", "BaseTotal": 202, "hp": 38, "atk": 46, "def": 53, "spd": 65, "stage": 1, "nextForm": "Ninetales", "evoTrigger": 8},
  {"id": 38, "name": "Ninetales", "type": "Fogo", "secondType": "", "BaseTotal": 340, "hp": 73, "atk": 79, "def": 88, "spd": 100, "stage": 2, "nextForm": null},

  {"id": 39, "name": "Jigglypuff", "type": "Fada", "secondType": "Normal", "BaseTotal": 203, "hp": 115, "atk": 45, "def": 23, "spd": 20, "stage": 2, "nextForm": "Wigglytuff", "evoTrigger": 10},
  {"id": 40, "name": "Wigglytuff", "type": "Fada", "secondType": "Normal", "BaseTotal": 311, "hp": 140, "atk": 78, "def": 48, "spd": 45, "stage": 3, "nextForm": null},

  {"id": 41, "name": "Zubat", "type": "Veneno", "secondType": "Voador", "BaseTotal": 171, "hp": 40, "atk": 38, "def": 38, "spd": 55, "stage": 1, "nextForm": "Golbat", "evoTrigger": 5},
  {"id": 42, "name": "Golbat", "type": "Veneno", "secondType": "Voador", "BaseTotal": 311, "hp": 75, "atk": 73, "def": 73, "spd": 90, "stage": 2, "nextForm": "Crobat", "evoTrigger": 10},

  {"id": 43, "name": "Oddish", "type": "Grama", "secondType": "Veneno", "BaseTotal": 198, "hp": 45, "atk": 63, "def": 60, "spd": 30, "stage": 1, "nextForm": "Gloom", "evoTrigger": 5},
  {"id": 44, "name": "Gloom", "type": "Grama", "secondType": "Veneno", "BaseTotal": 248, "hp": 60, "atk": 75, "def": 73, "spd": 40, "stage": 2, "nextForm": "Vileplume", "evoTrigger": 10},
  {"id": 45, "name": "Vileplume", "type": "Grama", "secondType": "Veneno", "BaseTotal": 308, "hp": 75, "atk": 95, "def": 88, "spd": 50, "stage": 3, "nextForm": null},

  {"id": 46, "name": "Paras", "type": "Inseto", "secondType": "Grama", "BaseTotal": 173, "hp": 35, "atk": 58, "def": 55, "spd": 25, "stage": 1, "nextForm": "Parasect", "evoTrigger": 8},
  {"id": 47, "name": "Parasect", "type": "Inseto", "secondType": "Grama", "BaseTotal": 248, "hp": 60, "atk": 78, "def": 80, "spd": 30, "stage": 2, "nextForm": null},

  {"id": 48, "name": "Venonat", "type": "Inseto", "secondType": "Veneno", "BaseTotal": 206, "hp": 60, "atk": 48, "def": 53, "spd": 45, "stage": 1, "nextForm": "Venomoth", "evoTrigger": 8},
  {"id": 49, "name": "Venomoth", "type": "Inseto", "secondType": "Veneno", "BaseTotal": 306, "hp": 70, "atk": 78, "def": 68, "spd": 90, "stage": 2, "nextForm": null},

  {"id": 50, "name": "Diglett", "type": "Terra", "secondType": "", "BaseTotal": 185, "hp": 10, "atk": 45, "def": 35, "spd": 95, "stage": 1, "nextForm": "Dugtrio", "evoTrigger": 8},
  {"id": 51, "name": "Dugtrio", "type": "Terra", "secondType": "", "BaseTotal": 290, "hp": 35, "atk": 75, "def": 60, "spd": 120, "stage": 2, "nextForm": null},

  {"id": 52, "name": "Meowth", "type": "Normal", "secondType": "", "BaseTotal": 211, "hp": 40, "atk": 43, "def": 38, "spd": 90, "stage": 1, "nextForm": "Persian", "evoTrigger": 8},
  {"id": 53, "name": "Persian", "type": "Normal", "secondType": "", "BaseTotal": 311, "hp": 65, "atk": 68, "def": 63, "spd": 115, "stage": 2, "nextForm": null},

  {"id": 54, "name": "Psyduck", "type": "Água", "secondType": "", "BaseTotal": 213, "hp": 50, "atk": 59, "def": 49, "spd": 55, "stage": 1, "nextForm": "Golduck", "evoTrigger": 8},
  {"id": 55, "name": "Golduck", "type": "Água", "secondType": "", "BaseTotal": 333, "hp": 80, "atk": 89, "def": 79, "spd": 85, "stage": 2, "nextForm": null},

  {"id": 56, "name": "Mankey", "type": "Lutador", "secondType": "", "BaseTotal": 208, "hp": 40, "atk": 58, "def": 40, "spd": 70, "stage": 1, "nextForm": "Primeape", "evoTrigger": 5},
  {"id": 57, "name": "Primeape", "type": "Lutador", "secondType": "", "BaseTotal": 308, "hp": 65, "atk": 83, "def": 65, "spd": 95, "stage": 2, "nextForm": "Annihilape", "evoTrigger": 10},

  {"id": 58, "name": "Growlithe", "type": "Fogo", "secondType": "", "BaseTotal": 233, "hp": 55, "atk": 70, "def": 48, "spd": 60, "stage": 1, "nextForm": "Arcanine", "evoTrigger": 8},
  {"id": 59, "name": "Arcanine", "type": "Fogo", "secondType": "", "BaseTotal": 370, "hp": 90, "atk": 105, "def": 80, "spd": 95, "stage": 2, "nextForm": null},

  {"id": 60, "name": "Poliwag", "type": "Água", "secondType": "", "BaseTotal": 215, "hp": 40, "atk": 45, "def": 40, "spd": 90, "stage": 1, "nextForm": "Poliwhirl", "evoTrigger": 5},
  {"id": 61, "name": "Poliwhirl", "type": "Água", "secondType": "", "BaseTotal": 271, "hp": 65, "atk": 58, "def": 58, "spd": 90, "stage": 2, "nextForm": "Poliwrath", "evoTrigger": 10},
  {"id": 62, "name": "Poliwrath", "type": "Água", "secondType": "Lutador", "BaseTotal": 336, "hp": 90, "atk": 83, "def": 93, "spd": 70, "stage": 3, "nextForm": null},

  {"id": 63, "name": "Abra", "type": "Psíquico", "secondType": "", "BaseTotal": 213, "hp": 25, "atk": 63, "def": 35, "spd": 90, "stage": 1, "nextForm": "Kadabra", "evoTrigger": 5},
  {"id": 64, "name": "Kadabra", "type": "Psíquico", "secondType": "", "BaseTotal": 273, "hp": 40, "atk": 78, "def": 50, "spd": 105, "stage": 2, "nextForm": "Alakazam", "evoTrigger": 10},
  {"id": 65, "name": "Alakazam", "type": "Psíquico", "secondType": "", "BaseTotal": 338, "hp": 55, "atk": 93, "def": 70, "spd": 120, "stage": 3, "nextForm": null},

  {"id": 66, "name": "Machop", "type": "Lutador", "secondType": "", "BaseTotal": 206, "hp": 70, "atk": 58, "def": 43, "spd": 35, "stage": 1, "nextForm": "Machoke", "evoTrigger": 5},
  {"id": 67, "name": "Machoke", "type": "Lutador", "secondType": "", "BaseTotal": 265, "hp": 80, "atk": 75, "def": 65, "spd": 45, "stage": 2, "nextForm": "Machamp", "evoTrigger": 10},
  {"id": 68, "name": "Machamp", "type": "Lutador", "secondType": "", "BaseTotal": 326, "hp": 90, "atk": 98, "def": 83, "spd": 55, "stage": 3, "nextForm": null},

  {"id": 69, "name": "Bellsprout", "type": "Grama", "secondType": "Veneno", "BaseTotal": 196, "hp": 50, "atk": 73, "def": 33, "spd": 40, "stage": 1, "nextForm": "Weepinbell", "evoTrigger": 5},
  {"id": 70, "name": "Weepinbell", "type": "Grama", "secondType": "Veneno", "BaseTotal": 256, "hp": 65, "atk": 88, "def": 48, "spd": 55, "stage": 2, "nextForm": "Victreebel", "evoTrigger": 10},
  {"id": 71, "name": "Victreebel", "type": "Grama", "secondType": "Veneno", "BaseTotal": 321, "hp": 80, "atk": 103, "def": 68, "spd": 70, "stage": 3, "nextForm": null},

  {"id": 72, "name": "Tentacool", "type": "Água", "secondType": "Veneno", "BaseTotal": 223, "hp": 40, "atk": 45, "def": 68, "spd": 70, "stage": 1, "nextForm": "Tentacruel", "evoTrigger": 8},
  {"id": 73, "name": "Tentacruel", "type": "Água", "secondType": "Veneno", "BaseTotal": 348, "hp": 80, "atk": 75, "def": 93, "spd": 100, "stage": 2, "nextForm": null},

  {"id": 74, "name": "Geodude", "type": "Pedra", "secondType": "Terra", "BaseTotal": 180, "hp": 40, "atk": 55, "def": 65, "spd": 20, "stage": 1, "nextForm": "Graveler", "evoTrigger": 5},
  {"id": 75, "name": "Graveler", "type": "Pedra", "secondType": "Terra", "BaseTotal": 240, "hp": 55, "atk": 70, "def": 80, "spd": 35, "stage": 2, "nextForm": "Golem", "evoTrigger": 10},
  {"id": 76, "name": "Golem", "type": "Pedra", "secondType": "Terra", "BaseTotal": 312, "hp": 80, "atk": 89, "def": 98, "spd": 45, "stage": 3, "nextForm": null},

  {"id": 77, "name": "Ponyta", "type": "Fogo", "secondType": "", "BaseTotal": 275, "hp": 50, "atk": 75, "def": 60, "spd": 90, "stage": 1, "nextForm": "Rapidash", "evoTrigger": 8},
  {"id": 78, "name": "Rapidash", "type": "Fogo", "secondType": "", "BaseTotal": 335, "hp": 65, "atk": 90, "def": 75, "spd": 105, "stage": 2, "nextForm": null},

  {"id": 79, "name": "Slowpoke", "type": "Água", "secondType": "Psíquico", "BaseTotal": 211, "hp": 90, "atk": 53, "def": 53, "spd": 15, "stage": 1, "nextForm": "Slowbro", "evoTrigger": 8},
  {"id": 80, "name": "Slowbro", "type": "Água", "secondType": "Psíquico", "BaseTotal": 308, "hp": 95, "atk": 88, "def": 95, "spd": 30, "stage": 2, "nextForm": null},

  {"id": 81, "name": "Magnemite", "type": "Elétrico", "secondType": "Aço", "BaseTotal": 198, "hp": 25, "atk": 65, "def": 63, "spd": 45, "stage": 1, "nextForm": "Magneton", "evoTrigger": 5},
  {"id": 82, "name": "Magneton", "type": "Elétrico", "secondType": "Aço", "BaseTotal": 293, "hp": 50, "atk": 90, "def": 83, "spd": 70, "stage": 2, "nextForm": "Magnezone", "evoTrigger": 10},

  {"id": 83, "name": "Farfetch'd", "type": "Normal", "secondType": "Voador", "BaseTotal": 242, "hp": 52, "atk": 77, "def": 58, "spd": 55, "stage": 1, "nextForm": "Sirfetch'd", "evoTrigger": 8},

  {"id": 84, "name": "Doduo", "type": "Voador", "secondType": "Normal", "BaseTotal": 210, "hp": 35, "atk": 60, "def": 40, "spd": 75, "stage": 1, "nextForm": "Dodrio", "evoTrigger": 8},
  {"id": 85, "name": "Dodrio", "type": "Voador", "secondType": "Normal", "BaseTotal": 310, "hp": 60, "atk": 85, "def": 65, "spd": 100, "stage": 2, "nextForm": null},

  {"id": 86, "name": "Seel", "type": "Água", "secondType": "", "BaseTotal": 218, "hp": 65, "atk": 45, "def": 63, "spd": 45, "stage": 1, "nextForm": "Dewgong", "evoTrigger": 8},
  {"id": 87, "name": "Dewgong", "type": "Gelo", "secondType": "Água", "BaseTotal": 318, "hp": 90, "atk": 70, "def": 88, "spd": 70, "stage": 2, "nextForm": null},

  {"id": 88, "name": "Grimer", "type": "Veneno", "secondType": "", "BaseTotal": 215, "hp": 80, "atk": 60, "def": 50, "spd": 25, "stage": 1, "nextForm": "Muk", "evoTrigger": 8},
  {"id": 89, "name": "Muk", "type": "Veneno", "secondType": "", "BaseTotal": 328, "hp": 105, "atk": 85, "def": 88, "spd": 50, "stage": 2, "nextForm": null},

  {"id": 90, "name": "Shellder", "type": "Água", "secondType": "", "BaseTotal": 188, "hp": 30, "atk": 55, "def": 63, "spd": 40, "stage": 1, "nextForm": "Cloyster", "evoTrigger": 8},
  {"id": 91, "name": "Cloyster", "type": "Gelo", "secondType": "Água", "BaseTotal": 323, "hp": 50, "atk": 90, "def": 113, "spd": 70, "stage": 2, "nextForm": null},

  {"id": 92, "name": "Gastly", "type": "Fantasma", "secondType": "Veneno", "BaseTotal": 211, "hp": 30, "atk": 68, "def": 33, "spd": 80, "stage": 1, "nextForm": "Haunter", "evoTrigger": 5},
  {"id": 93, "name": "Haunter", "type": "Fantasma", "secondType": "Veneno", "BaseTotal": 273, "hp": 45, "atk": 83, "def": 50, "spd": 95, "stage": 2, "nextForm": "Gengar", "evoTrigger": 10},
  {"id": 94, "name": "Gengar", "type": "Fantasma", "secondType": "Veneno", "BaseTotal": 336, "hp": 60, "atk": 98, "def": 68, "spd": 110, "stage": 3, "nextForm": null},

  {"id": 95, "name": "Onix", "type": "Pedra", "secondType": "Terra", "BaseTotal": 246, "hp": 35, "atk": 38, "def": 103, "spd": 70, "stage": 1, "nextForm": "Steelix", "evoTrigger": 8},

  {"id": 96, "name": "Drowzee", "type": "Psíquico", "secondType": "", "BaseTotal": 216, "hp": 60, "atk": 46, "def": 68, "spd": 42, "stage": 1, "nextForm": "Hypno", "evoTrigger": 8},
  {"id": 97, "name": "Hypno", "type": "Psíquico", "secondType": "", "BaseTotal": 318, "hp": 85, "atk": 73, "def": 93, "spd": 67, "stage": 2, "nextForm": null},

  {"id": 98, "name": "Krabby", "type": "Água", "secondType": "", "BaseTotal": 201, "hp": 30, "atk": 65, "def": 56, "spd": 50, "stage": 1, "nextForm": "Kingler", "evoTrigger": 8},
  {"id": 99, "name": "Kingler", "type": "Água", "secondType": "", "BaseTotal": 303, "hp": 55, "atk": 90, "def": 83, "spd": 75, "stage": 2, "nextForm": null},

  {"id": 100, "name": "Voltorb", "type": "Elétrico", "secondType": "", "BaseTotal": 236, "hp": 40, "atk": 43, "def": 53, "spd": 100, "stage": 1, "nextForm": "Electrode", "evoTrigger": 8},
  {"id": 101, "name": "Electrode", "type": "Elétrico", "secondType": "", "BaseTotal": 340, "hp": 60, "atk": 65, "def": 75, "spd": 140, "stage": 2, "nextForm": null},

  {"id": 102, "name": "Exeggcute", "type": "Grama", "secondType": "Psíquico", "BaseTotal": 213, "hp": 60, "atk": 50, "def": 63, "spd": 40, "stage": 1, "nextForm": "Exeggutor", "evoTrigger": 8},
  {"id": 103, "name": "Exeggutor", "type": "Grama", "secondType": "Psíquico", "BaseTotal": 340, "hp": 95, "atk": 110, "def": 80, "spd": 55, "stage": 2, "nextForm": null},

  {"id": 104, "name": "Cubone", "type": "Terra", "secondType": "", "BaseTotal": 203, "hp": 50, "atk": 45, "def": 73, "spd": 35, "stage": 1, "nextForm": "Marowak", "evoTrigger": 8},
  {"id": 105, "name": "Marowak", "type": "Terra", "secondType": "", "BaseTotal": 265, "hp": 60, "atk": 65, "def": 95, "spd": 45, "stage": 2, "nextForm": null},

  {"id": 106, "name": "Hitmonlee", "type": "Lutador", "secondType": "", "BaseTotal": 297, "hp": 50, "atk": 78, "def": 82, "spd": 87, "stage": 1, "nextForm": null},

  {"id": 107, "name": "Hitmonchan", "type": "Lutador", "secondType": "", "BaseTotal": 291, "hp": 50, "atk": 70, "def": 95, "spd": 76, "stage": 1, "nextForm": null},

  {"id": 108, "name": "Lickitung", "type": "Normal", "secondType": "", "BaseTotal": 253, "hp": 90, "atk": 58, "def": 75, "spd": 30, "stage": 1, "nextForm": "Lickilicky", "evoTrigger": 8},

  {"id": 109, "name": "Koffing", "type": "Veneno", "secondType": "", "BaseTotal": 208, "hp": 40, "atk": 63, "def": 70, "spd": 35, "stage": 1, "nextForm": "Weezing", "evoTrigger": 8},
  {"id": 110, "name": "Weezing", "type": "Veneno", "secondType": "", "BaseTotal": 308, "hp": 65, "atk": 88, "def": 95, "spd": 60, "stage": 2, "nextForm": null},

  {"id": 111, "name": "Rhyhorn", "type": "Terra", "secondType": "Pedra", "BaseTotal": 224, "hp": 80, "atk": 56, "def": 63, "spd": 25, "stage": 1, "nextForm": "Rhydon", "evoTrigger": 5},
  {"id": 112, "name": "Rhydon", "type": "Terra", "secondType": "Pedra", "BaseTotal": 316, "hp": 105, "atk": 88, "def": 83, "spd": 40, "stage": 2, "nextForm": "Rhyperior", "evoTrigger": 10},

  {"id": 113, "name": "Chansey", "type": "Normal", "secondType": "", "BaseTotal": 375, "hp": 250, "atk": 20, "def": 55, "spd": 50, "stage": 2, "nextForm": "Blissey", "evoTrigger": 10},

  {"id": 114, "name": "Tangela", "type": "Grama", "secondType": "", "BaseTotal": 281, "hp": 65, "atk": 78, "def": 78, "spd": 60, "stage": 1, "nextForm": "Tangrowth", "evoTrigger": 8},

  {"id": 115, "name": "Kangaskhan", "type": "Normal", "secondType": "", "BaseTotal": 343, "hp": 105, "atk": 68, "def": 80, "spd": 90, "stage": 1, "nextForm": null},

  {"id": 116, "name": "Horsea", "type": "Água", "secondType": "", "BaseTotal": 193, "hp": 30, "atk": 55, "def": 48, "spd": 60, "stage": 1, "nextForm": "Seadra", "evoTrigger": 5},
  {"id": 117, "name": "Seadra", "type": "Água", "secondType": "", "BaseTotal": 290, "hp": 55, "atk": 80, "def": 70, "spd": 85, "stage": 2, "nextForm": "Kingdra", "evoTrigger": 10},

  {"id": 118, "name": "Goldeen", "type": "Água", "secondType": "", "BaseTotal": 214, "hp": 45, "atk": 51, "def": 55, "spd": 63, "stage": 1, "nextForm": "Seaking", "evoTrigger": 8},
  {"id": 119, "name": "Seaking", "type": "Água", "secondType": "", "BaseTotal": 300, "hp": 80, "atk": 79, "def": 73, "spd": 68, "stage": 2, "nextForm": null},

  {"id": 120, "name": "Staryu", "type": "Água", "secondType": "", "BaseTotal": 228, "hp": 30, "atk": 58, "def": 55, "spd": 85, "stage": 1, "nextForm": "Starmie", "evoTrigger": 8},
  {"id": 121, "name": "Starmie", "type": "Água", "secondType": "Psíquico", "BaseTotal": 348, "hp": 60, "atk": 88, "def": 85, "spd": 115, "stage": 2, "nextForm": null},

  {"id": 122, "name": "Mr. Mime", "type": "Fada", "secondType": "Psíquico", "BaseTotal": 296, "hp": 40, "atk": 73, "def": 93, "spd": 90, "stage": 2, "nextForm": "Mr. Rime", "evoTrigger": 10},

  {"id": 123, "name": "Scyther", "type": "Inseto", "secondType": "Voador", "BaseTotal": 338, "hp": 70, "atk": 83, "def": 80, "spd": 105, "stage": 1, "nextForm": "Scizor", "evoTrigger": 8},

  {"id": 124, "name": "Jynx", "type": "Gelo", "secondType": "Psíquico", "BaseTotal": 308, "hp": 65, "atk": 83, "def": 65, "spd": 95, "stage": 2, "nextForm": null},

  {"id": 125, "name": "Electabuzz", "type": "Elétrico", "secondType": "", "BaseTotal": 330, "hp": 65, "atk": 89, "def": 71, "spd": 105, "stage": 2, "nextForm": "Electivire", "evoTrigger": 10},

  {"id": 126, "name": "Magmar", "type": "Fogo", "secondType": "", "BaseTotal": 327, "hp": 65, "atk": 98, "def": 71, "spd": 93, "stage": 2, "nextForm": "Magmortar", "evoTrigger": 10},

  {"id": 127, "name": "Pinsir", "type": "Inseto", "secondType": "", "BaseTotal": 325, "hp": 65, "atk": 90, "def": 85, "spd": 85, "stage": 1, "nextForm": null},

  {"id": 128, "name": "Tauros", "type": "Normal", "secondType": "", "BaseTotal": 338, "hp": 75, "atk": 70, "def": 83, "spd": 110, "stage": 1, "nextForm": null},

  {"id": 129, "name": "Magikarp", "type": "Água", "secondType": "", "BaseTotal": 151, "hp": 20, "atk": 13, "def": 38, "spd": 80, "stage": 1, "nextForm": "Gyarados", "evoTrigger": 8},
  {"id": 130, "name": "Gyarados", "type": "Água", "secondType": "Voador", "BaseTotal": 359, "hp": 95, "atk": 93, "def": 90, "spd": 81, "stage": 2, "nextForm": null},

  {"id": 131, "name": "Lapras", "type": "Gelo", "secondType": "Água", "BaseTotal": 363, "hp": 130, "atk": 85, "def": 88, "spd": 60, "stage": 1, "nextForm": null},

  {"id": 132, "name": "Ditto", "type": "Normal", "secondType": "", "BaseTotal": 192, "hp": 48, "atk": 48, "def": 48, "spd": 48, "stage": 1, "nextForm": null},

  {"id": 133, "name": "Eevee", "type": "Normal", "secondType": "", "BaseTotal": 218, "hp": 55, "atk": 50, "def": 58, "spd": 55, "stage": 1, "nextForm": "Vaporeon", "evoTrigger": 8},
  {"id": 134, "name": "Vaporeon", "type": "Água", "secondType": "", "BaseTotal": 361, "hp": 130, "atk": 88, "def": 78, "spd": 65, "stage": 2, "nextForm": null},

  {"id": 135, "name": "Jolteon", "type": "Elétrico", "secondType": "", "BaseTotal": 361, "hp": 65, "atk": 88, "def": 78, "spd": 130, "stage": 2, "nextForm": null},

  {"id": 136, "name": "Flareon", "type": "Fogo", "secondType": "", "BaseTotal": 328, "hp": 65, "atk": 113, "def": 85, "spd": 65, "stage": 2, "nextForm": null},

  {"id": 137, "name": "Porygon", "type": "Normal", "secondType": "", "BaseTotal": 251, "hp": 65, "atk": 73, "def": 73, "spd": 40, "stage": 1, "nextForm": "Porygon2", "evoTrigger": 5},

  {"id": 138, "name": "Omanyte", "type": "Pedra", "secondType": "Água", "BaseTotal": 213, "hp": 35, "atk": 65, "def": 78, "spd": 35, "stage": 1, "nextForm": "Omastar", "evoTrigger": 8},
  {"id": 139, "name": "Omastar", "type": "Pedra", "secondType": "Água", "BaseTotal": 311, "hp": 70, "atk": 88, "def": 98, "spd": 55, "stage": 2, "nextForm": null},

  {"id": 140, "name": "Kabuto", "type": "Pedra", "secondType": "Água", "BaseTotal": 221, "hp": 30, "atk": 68, "def": 68, "spd": 55, "stage": 1, "nextForm": "Kabutops", "evoTrigger": 8},
  {"id": 141, "name": "Kabutops", "type": "Pedra", "secondType": "Água", "BaseTotal": 318, "hp": 60, "atk": 90, "def": 88, "spd": 80, "stage": 2, "nextForm": null},

  {"id": 142, "name": "Aerodactyl", "type": "Pedra", "secondType": "Voador", "BaseTotal": 363, "hp": 80, "atk": 83, "def": 70, "spd": 130, "stage": 1, "nextForm": null},

  {"id": 143, "name": "Snorlax", "type": "Normal", "secondType": "", "BaseTotal": 366, "hp": 160, "atk": 88, "def": 88, "spd": 30, "stage": 2, "nextForm": null},

  {"id": 144, "name": "Articuno", "type": "Gelo", "secondType": "Voador", "BaseTotal": 378, "hp": 90, "atk": 90, "def": 113, "spd": 85, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 145, "name": "Zapdos", "type": "Elétrico", "secondType": "Voador", "BaseTotal": 386, "hp": 90, "atk": 108, "def": 88, "spd": 100, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 146, "name": "Moltres", "type": "Fogo", "secondType": "Voador", "BaseTotal": 381, "hp": 90, "atk": 113, "def": 88, "spd": 90, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 147, "name": "Dratini", "type": "Dragão", "secondType": "", "BaseTotal": 196, "hp": 41, "atk": 57, "def": 48, "spd": 50, "stage": 1, "nextForm": "Dragonair", "evoTrigger": 5},
  {"id": 148, "name": "Dragonair", "type": "Dragão", "secondType": "", "BaseTotal": 276, "hp": 61, "atk": 77, "def": 68, "spd": 70, "stage": 2, "nextForm": "Dragonite", "evoTrigger": 10},
  {"id": 149, "name": "Dragonite", "type": "Dragão", "secondType": "Voador", "BaseTotal": 386, "hp": 91, "atk": 117, "def": 98, "spd": 80, "stage": 3, "nextForm": null},

  {"id": 150, "name": "Mewtwo", "type": "Psíquico", "secondType": "", "BaseTotal": 458, "hp": 106, "atk": 132, "def": 90, "spd": 130, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 151, "name": "Mew", "type": "Psíquico", "secondType": "", "BaseTotal": 400, "hp": 100, "atk": 100, "def": 100, "spd": 100, "stage": 1, "nextForm": null, "isLegendary": true},

  // SEGUNDA GERAÇÃO
  {"id": 152, "name": "Chikorita", "type": "Grama", "secondType": "", "BaseTotal": 204, "hp": 45, "atk": 49, "def": 65, "spd": 45, "stage": 1, "nextForm": "Bayleef", "evoTrigger": 5},
  {"id": 153, "name": "Bayleef", "type": "Grama", "secondType": "", "BaseTotal": 262, "hp": 60, "atk": 62, "def": 80, "spd": 60, "stage": 2, "nextForm": "Meganium", "evoTrigger": 10},
  {"id": 154, "name": "Meganium", "type": "Grama", "secondType": "", "BaseTotal": 342, "hp": 80, "atk": 82, "def": 100, "spd": 80, "stage": 3, "nextForm": null},

  {"id": 155, "name": "Cyndaquil", "type": "Fogo", "secondType": "", "BaseTotal": 206, "hp": 39, "atk": 56, "def": 46, "spd": 65, "stage": 1, "nextForm": "Quilava", "evoTrigger": 5},
  {"id": 156, "name": "Quilava", "type": "Fogo", "secondType": "", "BaseTotal": 272, "hp": 58, "atk": 72, "def": 62, "spd": 80, "stage": 2, "nextForm": "Typhlosion", "evoTrigger": 10},
  {"id": 157, "name": "Typhlosion", "type": "Fogo", "secondType": "", "BaseTotal": 356, "hp": 78, "atk": 96, "def": 82, "spd": 100, "stage": 3, "nextForm": null},

  {"id": 158, "name": "Totodile", "type": "Água", "secondType": "", "BaseTotal": 203, "hp": 50, "atk": 54, "def": 56, "spd": 43, "stage": 1, "nextForm": "Croconaw", "evoTrigger": 5},
  {"id": 159, "name": "Croconaw", "type": "Água", "secondType": "", "BaseTotal": 265, "hp": 65, "atk": 70, "def": 72, "spd": 58, "stage": 2, "nextForm": "Feraligatr", "evoTrigger": 10},
  {"id": 160, "name": "Feraligatr", "type": "Água", "secondType": "", "BaseTotal": 347, "hp": 85, "atk": 92, "def": 92, "spd": 78, "stage": 3, "nextForm": null},

  {"id": 161, "name": "Sentret", "type": "Normal", "secondType": "", "BaseTotal": 135, "hp": 35, "atk": 40, "def": 40, "spd": 20, "stage": 1, "nextForm": "Furret", "evoTrigger": 8},
  {"id": 162, "name": "Furret", "type": "Normal", "secondType": "", "BaseTotal": 295, "hp": 85, "atk": 60, "def": 60, "spd": 90, "stage": 2, "nextForm": null},

  {"id": 163, "name": "Hoothoot", "type": "Normal", "secondType": "Voador", "BaseTotal": 186, "hp": 60, "atk": 33, "def": 43, "spd": 50, "stage": 1, "nextForm": "Noctowl", "evoTrigger": 8},
  {"id": 164, "name": "Noctowl", "type": "Normal", "secondType": "Voador", "BaseTotal": 306, "hp": 100, "atk": 63, "def": 73, "spd": 70, "stage": 2, "nextForm": null},

  {"id": 165, "name": "Ledyba", "type": "Inseto", "secondType": "Voador", "BaseTotal": 180, "hp": 40, "atk": 30, "def": 55, "spd": 55, "stage": 1, "nextForm": "Ledian", "evoTrigger": 8},
  {"id": 166, "name": "Ledian", "type": "Inseto", "secondType": "Voador", "BaseTotal": 265, "hp": 55, "atk": 45, "def": 80, "spd": 85, "stage": 2, "nextForm": null},

  {"id": 167, "name": "Spinarak", "type": "Inseto", "secondType": "Veneno", "BaseTotal": 160, "hp": 40, "atk": 50, "def": 40, "spd": 30, "stage": 1, "nextForm": "Ariados", "evoTrigger": 8},
  {"id": 168, "name": "Ariados", "type": "Inseto", "secondType": "Veneno", "BaseTotal": 255, "hp": 70, "atk": 75, "def": 70, "spd": 40, "stage": 2, "nextForm": null},

  {"id": 169, "name": "Crobat", "type": "Veneno", "secondType": "Voador", "BaseTotal": 375, "hp": 85, "atk": 80, "def": 80, "spd": 130, "stage": 3, "nextForm": null},

  {"id": 170, "name": "Chinchou", "type": "Água", "secondType": "Elétrico", "BaseTotal": 236, "hp": 75, "atk": 47, "def": 47, "spd": 67, "stage": 1, "nextForm": "Lanturn", "evoTrigger": 8},
  {"id": 171, "name": "Lanturn", "type": "Água", "secondType": "Elétrico", "BaseTotal": 326, "hp": 125, "atk": 67, "def": 67, "spd": 67, "stage": 2, "nextForm": null},

  {"id": 172, "name": "Pichu", "type": "Elétrico", "secondType": "", "BaseTotal": 143, "hp": 20, "atk": 38, "def": 25, "spd": 60, "stage": 1, "nextForm": "Pikachu", "evoTrigger": 5},

  {"id": 173, "name": "Cleffa", "type": "Fada", "secondType": "", "BaseTotal": 142, "hp": 50, "atk": 35, "def": 42, "spd": 15, "stage": 1, "nextForm": "Clefairy", "evoTrigger": 5},

  {"id": 174, "name": "Igglybuff", "type": "Normal", "secondType": "Fada", "BaseTotal": 158, "hp": 90, "atk": 35, "def": 18, "spd": 15, "stage": 1, "nextForm": "Jigglypuff", "evoTrigger": 5},

  {"id": 175, "name": "Togepi", "type": "Fada", "secondType": "", "BaseTotal": 150, "hp": 35, "atk": 30, "def": 65, "spd": 20, "stage": 1, "nextForm": "Togetic", "evoTrigger": 5},
  {"id": 176, "name": "Togetic", "type": "Fada", "secondType": "Voador", "BaseTotal": 250, "hp": 55, "atk": 60, "def": 95, "spd": 40, "stage": 2, "nextForm": "Togekiss", "evoTrigger": 10},

  {"id": 177, "name": "Natu", "type": "Psíquico", "secondType": "Voador", "BaseTotal": 215, "hp": 40, "atk": 60, "def": 45, "spd": 70, "stage": 1, "nextForm": "Xatu", "evoTrigger": 8},
  {"id": 178, "name": "Xatu", "type": "Psíquico", "secondType": "Voador", "BaseTotal": 315, "hp": 65, "atk": 85, "def": 70, "spd": 95, "stage": 2, "nextForm": null},

  {"id": 179, "name": "Mareep", "type": "Elétrico", "secondType": "", "BaseTotal": 184, "hp": 55, "atk": 52, "def": 42, "spd": 35, "stage": 1, "nextForm": "Flaaffy", "evoTrigger": 5},
  {"id": 180, "name": "Flaaffy", "type": "Elétrico", "secondType": "", "BaseTotal": 241, "hp": 70, "atk": 68, "def": 58, "spd": 45, "stage": 2, "nextForm": "Ampharos", "evoTrigger": 10},
  {"id": 181, "name": "Ampharos", "type": "Elétrico", "secondType": "", "BaseTotal": 328, "hp": 90, "atk": 95, "def": 88, "spd": 55, "stage": 3, "nextForm": null},

  {"id": 182, "name": "Bellossom", "type": "Grama", "secondType": "", "BaseTotal": 308, "hp": 75, "atk": 85, "def": 98, "spd": 50, "stage": 3, "nextForm": null},

  {"id": 183, "name": "Marill", "type": "Água", "secondType": "Fada", "BaseTotal": 180, "hp": 70, "atk": 20, "def": 50, "spd": 40, "stage": 2, "nextForm": "Azumarill", "evoTrigger": 10},
  {"id": 184, "name": "Azumarill", "type": "Água", "secondType": "Fada", "BaseTotal": 285, "hp": 100, "atk": 55, "def": 80, "spd": 50, "stage": 3, "nextForm": null},

  {"id": 185, "name": "Sudowoodo", "type": "Pedra", "secondType": "", "BaseTotal": 255, "hp": 70, "atk": 65, "def": 90, "spd": 30, "stage": 2, "nextForm": null},

  {"id": 186, "name": "Politoed", "type": "Água", "secondType": "", "BaseTotal": 330, "hp": 90, "atk": 82, "def": 88, "spd": 70, "stage": 3, "nextForm": null},

  {"id": 187, "name": "Hoppip", "type": "Grama", "secondType": "Voador", "BaseTotal": 168, "hp": 35, "atk": 35, "def": 48, "spd": 50, "stage": 1, "nextForm": "Skiploom", "evoTrigger": 5},
  {"id": 188, "name": "Skiploom", "type": "Grama", "secondType": "Voador", "BaseTotal": 238, "hp": 55, "atk": 45, "def": 58, "spd": 80, "stage": 2, "nextForm": "Jumpluff", "evoTrigger": 10},
  {"id": 189, "name": "Jumpluff", "type": "Grama", "secondType": "Voador", "BaseTotal": 322, "hp": 75, "atk": 55, "def": 82, "spd": 110, "stage": 3, "nextForm": null},

  {"id": 190, "name": "Aipom", "type": "Normal", "secondType": "", "BaseTotal": 250, "hp": 55, "atk": 55, "def": 55, "spd": 85, "stage": 1, "nextForm": "Ambipom", "evoTrigger": 8},

  {"id": 191, "name": "Sunkern", "type": "Grama", "secondType": "", "BaseTotal": 120, "hp": 30, "atk": 30, "def": 30, "spd": 30, "stage": 1, "nextForm": "Sunflora", "evoTrigger": 8},
  {"id": 192, "name": "Sunflora", "type": "Grama", "secondType": "", "BaseTotal": 265, "hp": 75, "atk": 90, "def": 70, "spd": 30, "stage": 2, "nextForm": null},

  {"id": 193, "name": "Yanma", "type": "Inseto", "secondType": "Voador", "BaseTotal": 275, "hp": 65, "atk": 70, "def": 45, "spd": 95, "stage": 1, "nextForm": "Yanmega", "evoTrigger": 8},

  {"id": 194, "name": "Wooper", "type": "Água", "secondType": "Terra", "BaseTotal": 140, "hp": 55, "atk": 35, "def": 35, "spd": 15, "stage": 1, "nextForm": "Quagsire", "evoTrigger": 8},
  {"id": 195, "name": "Quagsire", "type": "Água", "secondType": "Terra", "BaseTotal": 280, "hp": 95, "atk": 75, "def": 75, "spd": 35, "stage": 2, "nextForm": null},

  {"id": 196, "name": "Espeon", "type": "Psíquico", "secondType": "", "BaseTotal": 351, "hp": 65, "atk": 98, "def": 78, "spd": 110, "stage": 2, "nextForm": null},

  {"id": 197, "name": "Umbreon", "type": "Noturno", "secondType": "", "BaseTotal": 342, "hp": 95, "atk": 62, "def": 120, "spd": 65, "stage": 2, "nextForm": null},

  {"id": 198, "name": "Murkrow", "type": "Noturno", "secondType": "Voador", "BaseTotal": 278, "hp": 60, "atk": 85, "def": 42, "spd": 91, "stage": 1, "nextForm": "Honchkrow", "evoTrigger": 8},

  {"id": 199, "name": "Slowking", "type": "Água", "secondType": "Psíquico", "BaseTotal": 308, "hp": 95, "atk": 88, "def": 95, "spd": 30, "stage": 2, "nextForm": null},

  {"id": 200, "name": "Misdreavus", "type": "Fantasma", "secondType": "", "BaseTotal": 289, "hp": 60, "atk": 72, "def": 72, "spd": 85, "stage": 1, "nextForm": "Mismagius", "evoTrigger": 8},

  {"id": 201, "name": "Unown", "type": "Psíquico", "secondType": "", "BaseTotal": 216, "hp": 48, "atk": 72, "def": 48, "spd": 48, "stage": 1, "nextForm": null},

  {"id": 202, "name": "Wobbuffet", "type": "Psíquico", "secondType": "", "BaseTotal": 314, "hp": 190, "atk": 33, "def": 58, "spd": 33, "stage": 2, "nextForm": null},

  {"id": 203, "name": "Girafarig", "type": "Normal", "secondType": "Psíquico", "BaseTotal": 305, "hp": 70, "atk": 85, "def": 65, "spd": 85, "stage": 1, "nextForm": "Farigiraf", "evoTrigger": 8},

  {"id": 204, "name": "Pineco", "type": "Inseto", "secondType": "", "BaseTotal": 177, "hp": 50, "atk": 50, "def": 62, "spd": 15, "stage": 1, "nextForm": "Forretress", "evoTrigger": 8},
  {"id": 205, "name": "Forretress", "type": "Inseto", "secondType": "Aço", "BaseTotal": 290, "hp": 75, "atk": 75, "def": 100, "spd": 40, "stage": 2, "nextForm": null},

  {"id": 206, "name": "Dunsparce", "type": "Normal", "secondType": "", "BaseTotal": 281, "hp": 100, "atk": 68, "def": 68, "spd": 45, "stage": 1, "nextForm": "Dudunsparce", "evoTrigger": 8},

  {"id": 207, "name": "Gligar", "type": "Terra", "secondType": "Voador", "BaseTotal": 290, "hp": 65, "atk": 55, "def": 85, "spd": 85, "stage": 1, "nextForm": "Gliscor", "evoTrigger": 8},

  {"id": 208, "name": "Steelix", "type": "Aço", "secondType": "Terra", "BaseTotal": 307, "hp": 75, "atk": 70, "def": 132, "spd": 30, "stage": 2, "nextForm": null},

  {"id": 209, "name": "Snubbull", "type": "Fada", "secondType": "", "BaseTotal": 195, "hp": 60, "atk": 60, "def": 45, "spd": 30, "stage": 1, "nextForm": "Granbull", "evoTrigger": 8},
  {"id": 210, "name": "Granbull", "type": "Fada", "secondType": "", "BaseTotal": 293, "hp": 90, "atk": 90, "def": 68, "spd": 45, "stage": 2, "nextForm": null},

  {"id": 211, "name": "Qwilfish", "type": "Água", "secondType": "Veneno", "BaseTotal": 295, "hp": 65, "atk": 75, "def": 70, "spd": 85, "stage": 1, "nextForm": null},

  {"id": 212, "name": "Scizor", "type": "Inseto", "secondType": "Aço", "BaseTotal": 317, "hp": 70, "atk": 92, "def": 90, "spd": 65, "stage": 2, "nextForm": null},

  {"id": 213, "name": "Shuckle", "type": "Inseto", "secondType": "Pedra", "BaseTotal": 265, "hp": 20, "atk": 10, "def": 230, "spd": 5, "stage": 1, "nextForm": null},

  {"id": 214, "name": "Heracross", "type": "Inseto", "secondType": "Lutador", "BaseTotal": 332, "hp": 80, "atk": 82, "def": 85, "spd": 85, "stage": 1, "nextForm": null},

  {"id": 215, "name": "Sneasel", "type": "Noturno", "secondType": "Gelo", "BaseTotal": 300, "hp": 55, "atk": 65, "def": 65, "spd": 115, "stage": 1, "nextForm": "Weavile", "evoTrigger": 8},

  {"id": 216, "name": "Teddiursa", "type": "Normal", "secondType": "", "BaseTotal": 215, "hp": 60, "atk": 65, "def": 50, "spd": 40, "stage": 1, "nextForm": "Ursaring", "evoTrigger": 8},
  {"id": 217, "name": "Ursaring", "type": "Normal", "secondType": "", "BaseTotal": 322, "hp": 90, "atk": 102, "def": 75, "spd": 55, "stage": 2, "nextForm": null},

  {"id": 218, "name": "Slugma", "type": "Fogo", "secondType": "", "BaseTotal": 155, "hp": 40, "atk": 55, "def": 40, "spd": 20, "stage": 1, "nextForm": "Magcargo", "evoTrigger": 8},
  {"id": 219, "name": "Magcargo", "type": "Fogo", "secondType": "Pedra", "BaseTotal": 260, "hp": 60, "atk": 70, "def": 100, "spd": 30, "stage": 2, "nextForm": null},

  {"id": 220, "name": "Swinub", "type": "Gelo", "secondType": "Terra", "BaseTotal": 175, "hp": 50, "atk": 40, "def": 35, "spd": 50, "stage": 1, "nextForm": "Piloswine", "evoTrigger": 5},
  {"id": 221, "name": "Piloswine", "type": "Gelo", "secondType": "Terra", "BaseTotal": 300, "hp": 100, "atk": 80, "def": 70, "spd": 50, "stage": 2, "nextForm": "Mamoswine", "evoTrigger": 10},

  {"id": 222, "name": "Corsola", "type": "Água", "secondType": "Pedra", "BaseTotal": 255, "hp": 65, "atk": 60, "def": 95, "spd": 35, "stage": 1, "nextForm": null},

  {"id": 223, "name": "Remoraid", "type": "Água", "secondType": "", "BaseTotal": 200, "hp": 35, "atk": 65, "def": 35, "spd": 65, "stage": 1, "nextForm": "Octillery", "evoTrigger": 8},
  {"id": 224, "name": "Octillery", "type": "Água", "secondType": "", "BaseTotal": 300, "hp": 75, "atk": 105, "def": 75, "spd": 45, "stage": 2, "nextForm": null},

  {"id": 225, "name": "Delibird", "type": "Gelo", "secondType": "Voador", "BaseTotal": 225, "hp": 45, "atk": 60, "def": 45, "spd": 75, "stage": 1, "nextForm": null},

  {"id": 226, "name": "Mantine", "type": "Água", "secondType": "Voador", "BaseTotal": 300, "hp": 65, "atk": 60, "def": 105, "spd": 70, "stage": 2, "nextForm": null},

  {"id": 227, "name": "Skarmory", "type": "Aço", "secondType": "Voador", "BaseTotal": 300, "hp": 65, "atk": 60, "def": 105, "spd": 70, "stage": 1, "nextForm": null},

  {"id": 228, "name": "Houndour", "type": "Noturno", "secondType": "Fogo", "BaseTotal": 220, "hp": 45, "atk": 70, "def": 40, "spd": 65, "stage": 1, "nextForm": "Houndoom", "evoTrigger": 8},
  {"id": 229, "name": "Houndoom", "type": "Noturno", "secondType": "Fogo", "BaseTotal": 335, "hp": 75, "atk": 100, "def": 65, "spd": 95, "stage": 2, "nextForm": null},

  {"id": 230, "name": "Kingdra", "type": "Água", "secondType": "Dragão", "BaseTotal": 350, "hp": 75, "atk": 95, "def": 95, "spd": 85, "stage": 3, "nextForm": null},

  {"id": 231, "name": "Phanpy", "type": "Terra", "secondType": "", "BaseTotal": 230, "hp": 90, "atk": 50, "def": 50, "spd": 40, "stage": 1, "nextForm": "Donphan", "evoTrigger": 8},
  {"id": 232, "name": "Donphan", "type": "Terra", "secondType": "", "BaseTotal": 320, "hp": 90, "atk": 90, "def": 90, "spd": 50, "stage": 2, "nextForm": null},

  {"id": 233, "name": "Porygon2", "type": "Normal", "secondType": "", "BaseTotal": 329, "hp": 85, "atk": 92, "def": 92, "spd": 60, "stage": 2, "nextForm": "Porygon-Z", "evoTrigger": 10},

  {"id": 234, "name": "Stantler", "type": "Normal", "secondType": "", "BaseTotal": 312, "hp": 73, "atk": 90, "def": 64, "spd": 85, "stage": 1, "nextForm": null},

  {"id": 235, "name": "Smeargle", "type": "Normal", "secondType": "", "BaseTotal": 190, "hp": 55, "atk": 20, "def": 40, "spd": 75, "stage": 1, "nextForm": null},

  {"id": 236, "name": "Tyrogue", "type": "Lutador", "secondType": "", "BaseTotal": 140, "hp": 35, "atk": 35, "def": 35, "spd": 35, "stage": 1, "nextForm": null},

  {"id": 237, "name": "Hitmontop", "type": "Lutador", "secondType": "", "BaseTotal": 287, "hp": 50, "atk": 65, "def": 102, "spd": 70, "stage": 2, "nextForm": null},

  {"id": 238, "name": "Smoochum", "type": "Gelo", "secondType": "Psíquico", "BaseTotal": 208, "hp": 45, "atk": 58, "def": 40, "spd": 65, "stage": 1, "nextForm": "Jynx", "evoTrigger": 8},

  {"id": 239, "name": "Elekid", "type": "Elétrico", "secondType": "", "BaseTotal": 250, "hp": 45, "atk": 64, "def": 46, "spd": 95, "stage": 1, "nextForm": "Electabuzz", "evoTrigger": 5},

  {"id": 240, "name": "Magby", "type": "Fogo", "secondType": "", "BaseTotal": 246, "hp": 45, "atk": 72, "def": 46, "spd": 83, "stage": 1, "nextForm": "Magmar", "evoTrigger": 5},

  {"id": 241, "name": "Miltank", "type": "Normal", "secondType": "", "BaseTotal": 343, "hp": 95, "atk": 60, "def": 88, "spd": 100, "stage": 1, "nextForm": null},

  {"id": 242, "name": "Blissey", "type": "Normal", "secondType": "", "BaseTotal": 424, "hp": 255, "atk": 42, "def": 72, "spd": 55, "stage": 3, "nextForm": null},

  {"id": 243, "name": "Raikou", "type": "Elétrico", "secondType": "", "BaseTotal": 393, "hp": 90, "atk": 100, "def": 88, "spd": 115, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 244, "name": "Entei", "type": "Fogo", "secondType": "", "BaseTotal": 397, "hp": 115, "atk": 102, "def": 80, "spd": 100, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 245, "name": "Suicune", "type": "Água", "secondType": "", "BaseTotal": 382, "hp": 100, "atk": 82, "def": 115, "spd": 85, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 246, "name": "Larvitar", "type": "Pedra", "secondType": "Terra", "BaseTotal": 195, "hp": 50, "atk": 54, "def": 50, "spd": 41, "stage": 1, "nextForm": "Pupitar", "evoTrigger": 5},
  {"id": 247, "name": "Pupitar", "type": "Pedra", "secondType": "Terra", "BaseTotal": 265, "hp": 70, "atk": 74, "def": 70, "spd": 51, "stage": 2, "nextForm": "Tyranitar", "evoTrigger": 10},
  {"id": 248, "name": "Tyranitar", "type": "Pedra", "secondType": "Noturno", "BaseTotal": 380, "hp": 100, "atk": 114, "def": 105, "spd": 61, "stage": 3, "nextForm": null},

  {"id": 249, "name": "Lugia", "type": "Psíquico", "secondType": "Voador", "BaseTotal": 448, "hp": 106, "atk": 90, "def": 142, "spd": 110, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 250, "name": "Ho-Oh", "type": "Fogo", "secondType": "Voador", "BaseTotal": 438, "hp": 106, "atk": 120, "def": 122, "spd": 90, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 251, "name": "Celebi", "type": "Psíquico", "secondType": "Grama", "BaseTotal": 400, "hp": 100, "atk": 100, "def": 100, "spd": 100, "stage": 1, "nextForm": null, "isLegendary": true},

  // TERCEIRA GERAÇÃO
  {"id": 252, "name": "Treecko", "type": "Grama", "secondType": "", "BaseTotal": 210, "hp": 40, "atk": 55, "def": 45, "spd": 70, "stage": 1, "nextForm": "Grovyle", "evoTrigger": 5},
  {"id": 253, "name": "Grovyle", "type": "Grama", "secondType": "", "BaseTotal": 275, "hp": 50, "atk": 75, "def": 55, "spd": 95, "stage": 2, "nextForm": "Sceptile", "evoTrigger": 10},
  {"id": 254, "name": "Sceptile", "type": "Grama", "secondType": "", "BaseTotal": 360, "hp": 70, "atk": 95, "def": 75, "spd": 120, "stage": 3, "nextForm": null},

  {"id": 255, "name": "Torchic", "type": "Fogo", "secondType": "", "BaseTotal": 200, "hp": 45, "atk": 65, "def": 45, "spd": 45, "stage": 1, "nextForm": "Combusken", "evoTrigger": 5},
  {"id": 256, "name": "Combusken", "type": "Fogo", "secondType": "Lutador", "BaseTotal": 260, "hp": 60, "atk": 85, "def": 60, "spd": 55, "stage": 2, "nextForm": "Blaziken", "evoTrigger": 10},
  {"id": 257, "name": "Blaziken", "type": "Fogo", "secondType": "Lutador", "BaseTotal": 345, "hp": 80, "atk": 115, "def": 70, "spd": 80, "stage": 3, "nextForm": null},

  {"id": 258, "name": "Mudkip", "type": "Água", "secondType": "", "BaseTotal": 200, "hp": 50, "atk": 60, "def": 50, "spd": 40, "stage": 1, "nextForm": "Marshtomp", "evoTrigger": 5},
  {"id": 259, "name": "Marshtomp", "type": "Água", "secondType": "Terra", "BaseTotal": 262, "hp": 70, "atk": 72, "def": 70, "spd": 50, "stage": 2, "nextForm": "Swampert", "evoTrigger": 10},
  {"id": 260, "name": "Swampert", "type": "Água", "secondType": "Terra", "BaseTotal": 348, "hp": 100, "atk": 98, "def": 90, "spd": 60, "stage": 3, "nextForm": null},

  {"id": 261, "name": "Poochyena", "type": "Noturno", "secondType": "", "BaseTotal": 144, "hp": 35, "atk": 42, "def": 32, "spd": 35, "stage": 1, "nextForm": "Mightyena", "evoTrigger": 8},
  {"id": 262, "name": "Mightyena", "type": "Noturno", "secondType": "", "BaseTotal": 280, "hp": 70, "atk": 75, "def": 65, "spd": 70, "stage": 2, "nextForm": null},

  {"id": 263, "name": "Zigzagoon", "type": "Normal", "secondType": "", "BaseTotal": 169, "hp": 38, "atk": 30, "def": 41, "spd": 60, "stage": 1, "nextForm": "Linoone", "evoTrigger": 5},
  {"id": 264, "name": "Linoone", "type": "Normal", "secondType": "", "BaseTotal": 299, "hp": 78, "atk": 60, "def": 61, "spd": 100, "stage": 2, "nextForm": "Obstagoon", "evoTrigger": 10},

  {"id": 265, "name": "Wurmple", "type": "Inseto", "secondType": "", "BaseTotal": 129, "hp": 45, "atk": 32, "def": 32, "spd": 20, "stage": 1, "nextForm": "Silcoon", "evoTrigger": 5},
  {"id": 266, "name": "Silcoon", "type": "Inseto", "secondType": "", "BaseTotal": 135, "hp": 50, "atk": 30, "def": 40, "spd": 15, "stage": 2, "nextForm": "Beautifly", "evoTrigger": 10},
  {"id": 267, "name": "Beautifly", "type": "Inseto", "secondType": "Voador", "BaseTotal": 260, "hp": 60, "atk": 85, "def": 50, "spd": 65, "stage": 3, "nextForm": null},

  {"id": 268, "name": "Cascoon", "type": "Inseto", "secondType": "", "BaseTotal": 135, "hp": 50, "atk": 30, "def": 40, "spd": 15, "stage": 2, "nextForm": "Dustox", "evoTrigger": 10},
  {"id": 269, "name": "Dustox", "type": "Inseto", "secondType": "Veneno", "BaseTotal": 255, "hp": 60, "atk": 50, "def": 80, "spd": 65, "stage": 3, "nextForm": null},

  {"id": 270, "name": "Lotad", "type": "Água", "secondType": "Grama", "BaseTotal": 145, "hp": 40, "atk": 35, "def": 40, "spd": 30, "stage": 1, "nextForm": "Lombre", "evoTrigger": 5},
  {"id": 271, "name": "Lombre", "type": "Água", "secondType": "Grama", "BaseTotal": 225, "hp": 60, "atk": 55, "def": 60, "spd": 50, "stage": 2, "nextForm": "Ludicolo", "evoTrigger": 10},
  {"id": 272, "name": "Ludicolo", "type": "Água", "secondType": "Grama", "BaseTotal": 315, "hp": 80, "atk": 80, "def": 85, "spd": 70, "stage": 3, "nextForm": null},

  {"id": 273, "name": "Seedot", "type": "Grama", "secondType": "", "BaseTotal": 145, "hp": 40, "atk": 35, "def": 40, "spd": 30, "stage": 1, "nextForm": "Nuzleaf", "evoTrigger": 5},
  {"id": 274, "name": "Nuzleaf", "type": "Grama", "secondType": "Noturno", "BaseTotal": 235, "hp": 70, "atk": 65, "def": 40, "spd": 60, "stage": 2, "nextForm": "Shiftry", "evoTrigger": 10},
  {"id": 275, "name": "Shiftry", "type": "Grama", "secondType": "Noturno", "BaseTotal": 325, "hp": 90, "atk": 95, "def": 60, "spd": 80, "stage": 3, "nextForm": null},
  
  {"id": 276, "name": "Taillow", "type": "Normal", "secondType": "Voador", "BaseTotal": 197, "hp": 40, "atk": 42, "def": 30, "spd": 85, "stage": 1, "nextForm": "Swellow", "evoTrigger": 8},
  {"id": 277, "name": "Swellow", "type": "Normal", "secondType": "Voador", "BaseTotal": 308, "hp": 60, "atk": 68, "def": 55, "spd": 125, "stage": 2, "nextForm": null},

  {"id": 278, "name": "Wingull", "type": "Água", "secondType": "Voador", "BaseTotal": 197, "hp": 40, "atk": 42, "def": 30, "spd": 85, "stage": 1, "nextForm": "Pelipper", "evoTrigger": 8},
  {"id": 279, "name": "Pelipper", "type": "Água", "secondType": "Voador", "BaseTotal": 278, "hp": 60, "atk": 68, "def": 85, "spd": 65, "stage": 2, "nextForm": null},

  {"id": 280, "name": "Ralts", "type": "Psíquico", "secondType": "Fada", "BaseTotal": 133, "hp": 28, "atk": 35, "def": 30, "spd": 40, "stage": 1, "nextForm": "Kirlia", "evoTrigger": 5},
  {"id": 281, "name": "Kirlia", "type": "Psíquico", "secondType": "Fada", "BaseTotal": 183, "hp": 38, "atk": 50, "def": 45, "spd": 50, "stage": 2, "nextForm": "Gardevoir", "evoTrigger": 10},
  {"id": 282, "name": "Gardevoir", "type": "Psíquico", "secondType": "Fada", "BaseTotal": 333, "hp": 68, "atk": 95, "def": 90, "spd": 80, "stage": 3, "nextForm": null},

  {"id": 283, "name": "Surskit", "type": "Inseto", "secondType": "Água", "BaseTotal": 187, "hp": 40, "atk": 40, "def": 42, "spd": 65, "stage": 1, "nextForm": "Masquerain", "evoTrigger": 8},
  {"id": 284, "name": "Masquerain", "type": "Inseto", "secondType": "Voador", "BaseTotal": 302, "hp": 70, "atk": 80, "def": 72, "spd": 80, "stage": 2, "nextForm": null},

  {"id": 285, "name": "Shroomish", "type": "Grama", "secondType": "", "BaseTotal": 195, "hp": 60, "atk": 40, "def": 60, "spd": 35, "stage": 1, "nextForm": "Breloom", "evoTrigger": 8},
  {"id": 286, "name": "Breloom", "type": "Grama", "secondType": "Lutador", "BaseTotal": 295, "hp": 60, "atk": 95, "def": 70, "spd": 70, "stage": 2, "nextForm": null},

  {"id": 287, "name": "Slakoth", "type": "Normal", "secondType": "", "BaseTotal": 186, "hp": 60, "atk": 48, "def": 48, "spd": 30, "stage": 1, "nextForm": "Vigoroth", "evoTrigger": 5},
  {"id": 288, "name": "Vigoroth", "type": "Normal", "secondType": "", "BaseTotal": 306, "hp": 80, "atk": 68, "def": 68, "spd": 90, "stage": 2, "nextForm": "Slaking", "evoTrigger": 10},
  {"id": 289, "name": "Slaking", "type": "Normal", "secondType": "", "BaseTotal": 370, "hp": 120, "atk": 108, "def": 82, "spd": 60, "stage": 3, "nextForm": null},

  {"id": 290, "name": "Nincada", "type": "Inseto", "secondType": "Terra", "BaseTotal": 169, "hp": 31, "atk": 38, "def": 60, "spd": 40, "stage": 1, "nextForm": "Ninjask", "evoTrigger": 8},
  {"id": 291, "name": "Ninjask", "type": "Inseto", "secondType": "Voador", "BaseTotal": 339, "hp": 61, "atk": 70, "def": 48, "spd": 160, "stage": 2, "nextForm": null},
  {"id": 292, "name": "Shedinja", "type": "Inseto", "secondType": "Fantasma", "BaseTotal": 139, "hp": 1, "atk": 60, "def": 38, "spd": 40, "stage": 1, "nextForm": null},

  {"id": 293, "name": "Whismur", "type": "Normal", "secondType": "", "BaseTotal": 166, "hp": 64, "atk": 51, "def": 23, "spd": 28, "stage": 1, "nextForm": "Loudred", "evoTrigger": 5},
  {"id": 294, "name": "Loudred", "type": "Normal", "secondType": "", "BaseTotal": 246, "hp": 84, "atk": 71, "def": 43, "spd": 48, "stage": 2, "nextForm": "Exploud", "evoTrigger": 10},
  {"id": 295, "name": "Exploud", "type": "Normal", "secondType": "", "BaseTotal": 326, "hp": 104, "atk": 91, "def": 63, "spd": 68, "stage": 3, "nextForm": null},

  {"id": 296, "name": "Makuhita", "type": "Lutador", "secondType": "", "BaseTotal": 167, "hp": 72, "atk": 40, "def": 30, "spd": 25, "stage": 1, "nextForm": "Hariyama", "evoTrigger": 8},
  {"id": 297, "name": "Hariyama", "type": "Lutador", "secondType": "", "BaseTotal": 334, "hp": 144, "atk": 80, "def": 60, "spd": 50, "stage": 2, "nextForm": null},
  
  {"id": 298, "name": "Azurill", "type": "Normal", "secondType": "Fada", "BaseTotal": 130, "hp": 50, "atk": 20, "def": 40, "spd": 20, "stage": 1, "nextForm": "Marill", "evoTrigger": 5},

  {"id": 299, "name": "Nosepass", "type": "Pedra", "secondType": "", "BaseTotal": 217, "hp": 30, "atk": 45, "def": 112, "spd": 30, "stage": 1, "nextForm": "Probopass", "evoTrigger": 8},

  {"id": 300, "name": "Skitty", "type": "Normal", "secondType": "", "BaseTotal": 180, "hp": 50, "atk": 40, "def": 40, "spd": 50, "stage": 1, "nextForm": "Delcatty", "evoTrigger": 8},
  {"id": 301, "name": "Delcatty", "type": "Normal", "secondType": "", "BaseTotal": 280, "hp": 70, "atk": 60, "def": 60, "spd": 90, "stage": 2, "nextForm": null},

  {"id": 302, "name": "Sableye", "type": "Noturno", "secondType": "Fantasma", "BaseTotal": 240, "hp": 50, "atk": 70, "def": 70, "spd": 50, "stage": 1, "nextForm": null},

  {"id": 303, "name": "Mawile", "type": "Aço", "secondType": "Fada", "BaseTotal": 240, "hp": 50, "atk": 70, "def": 70, "spd": 50, "stage": 1, "nextForm": null},

  {"id": 304, "name": "Aron", "type": "Aço", "secondType": "Pedra", "BaseTotal": 205, "hp": 50, "atk": 55, "def": 70, "spd": 30, "stage": 1, "nextForm": "Lairon", "evoTrigger": 5},
  {"id": 305, "name": "Lairon", "type": "Aço", "secondType": "Pedra", "BaseTotal": 265, "hp": 60, "atk": 70, "def": 95, "spd": 40, "stage": 2, "nextForm": "Aggron", "evoTrigger": 10},
  {"id": 306, "name": "Aggron", "type": "Aço", "secondType": "Pedra", "BaseTotal": 325, "hp": 70, "atk": 85, "def": 120, "spd": 50, "stage": 3, "nextForm": null},

  {"id": 307, "name": "Meditite", "type": "Lutador", "secondType": "Psíquico", "BaseTotal": 185, "hp": 30, "atk": 40, "def": 55, "spd": 60, "stage": 1, "nextForm": "Medicham", "evoTrigger": 8},
  {"id": 308, "name": "Medicham", "type": "Lutador", "secondType": "Psíquico", "BaseTotal": 275, "hp": 60, "atk": 60, "def": 75, "spd": 80, "stage": 2, "nextForm": null},

  {"id": 309, "name": "Electrike", "type": "Elétrico", "secondType": "", "BaseTotal": 200, "hp": 40, "atk": 55, "def": 40, "spd": 65, "stage": 1, "nextForm": "Manectric", "evoTrigger": 8},
  {"id": 310, "name": "Manectric", "type": "Elétrico", "secondType": "", "BaseTotal": 325, "hp": 70, "atk": 90, "def": 60, "spd": 105, "stage": 2, "nextForm": null},

  {"id": 311, "name": "Plusle", "type": "Elétrico", "secondType": "", "BaseTotal": 281, "hp": 60, "atk": 68, "def": 58, "spd": 95, "stage": 1, "nextForm": null},

  {"id": 312, "name": "Minun", "type": "Elétrico", "secondType": "", "BaseTotal": 281, "hp": 60, "atk": 58, "def": 68, "spd": 95, "stage": 1, "nextForm": null},

  {"id": 313, "name": "Volbeat", "type": "Inseto", "secondType": "", "BaseTotal": 290, "hp": 65, "atk": 60, "def": 80, "spd": 85, "stage": 1, "nextForm": null},

  {"id": 314, "name": "Illumise", "type": "Inseto", "secondType": "", "BaseTotal": 290, "hp": 65, "atk": 60, "def": 80, "spd": 85, "stage": 1, "nextForm": null},

  {"id": 315, "name": "Roselia", "type": "Grama", "secondType": "Veneno", "BaseTotal": 257, "hp": 50, "atk": 80, "def": 62, "spd": 65, "stage": 1, "nextForm": null},

  {"id": 316, "name": "Gulpin", "type": "Veneno", "secondType": "", "BaseTotal": 206, "hp": 70, "atk": 43, "def": 53, "spd": 40, "stage": 1, "nextForm": "Swalot", "evoTrigger": 8},
  {"id": 317, "name": "Swalot", "type": "Veneno", "secondType": "", "BaseTotal": 311, "hp": 100, "atk": 73, "def": 83, "spd": 55, "stage": 2, "nextForm": null},

  {"id": 318, "name": "Carvanha", "type": "Água", "secondType": "Noturno", "BaseTotal": 208, "hp": 45, "atk": 78, "def": 20, "spd": 65, "stage": 1, "nextForm": "Sharpedo", "evoTrigger": 8},
  {"id": 319, "name": "Sharpedo", "type": "Água", "secondType": "Noturno", "BaseTotal": 313, "hp": 70, "atk": 108, "def": 40, "spd": 95, "stage": 2, "nextForm": null},

  {"id": 320, "name": "Wailmer", "type": "Água", "secondType": "", "BaseTotal": 295, "hp": 130, "atk": 70, "def": 35, "spd": 60, "stage": 1, "nextForm": "Wailord", "evoTrigger": 8},
  {"id": 321, "name": "Wailord", "type": "Água", "secondType": "", "BaseTotal": 365, "hp": 170, "atk": 90, "def": 45, "spd": 60, "stage": 2, "nextForm": null},

  {"id": 322, "name": "Numel", "type": "Fogo", "secondType": "Terra", "BaseTotal": 199, "hp": 60, "atk": 62, "def": 42, "spd": 35, "stage": 1, "nextForm": "Camerupt", "evoTrigger": 8},
  {"id": 323, "name": "Camerupt", "type": "Fogo", "secondType": "Terra", "BaseTotal": 284, "hp": 70, "atk": 102, "def": 72, "spd": 40, "stage": 2, "nextForm": null},

  {"id": 324, "name": "Torkoal", "type": "Fogo", "secondType": "", "BaseTotal": 280, "hp": 70, "atk": 85, "def": 105, "spd": 20, "stage": 1, "nextForm": null},

  {"id": 325, "name": "Spoink", "type": "Psíquico", "secondType": "", "BaseTotal": 226, "hp": 60, "atk": 48, "def": 58, "spd": 60, "stage": 1, "nextForm": "Grumpig", "evoTrigger": 8},
  {"id": 326, "name": "Grumpig", "type": "Psíquico", "secondType": "", "BaseTotal": 316, "hp": 80, "atk": 68, "def": 88, "spd": 80, "stage": 2, "nextForm": null},

  {"id": 327, "name": "Spinda", "type": "Normal", "secondType": "", "BaseTotal": 240, "hp": 60, "atk": 60, "def": 60, "spd": 60, "stage": 1, "nextForm": null},

  {"id": 328, "name": "Trapinch", "type": "Terra", "secondType": "", "BaseTotal": 172, "hp": 45, "atk": 72, "def": 45, "spd": 10, "stage": 1, "nextForm": "Vibrava", "evoTrigger": 5},
  {"id": 329, "name": "Vibrava", "type": "Terra", "secondType": "Dragão", "BaseTotal": 230, "hp": 50, "atk": 60, "def": 50, "spd": 70, "stage": 2, "nextForm": "Flygon", "evoTrigger": 10},
  {"id": 330, "name": "Flygon", "type": "Terra", "secondType": "Dragão", "BaseTotal": 350, "hp": 80, "atk": 90, "def": 80, "spd": 100, "stage": 3, "nextForm": null},

  {"id": 331, "name": "Cacnea", "type": "Grama", "secondType": "", "BaseTotal": 210, "hp": 50, "atk": 85, "def": 40, "spd": 35, "stage": 1, "nextForm": "Cacturne", "evoTrigger": 8},
  {"id": 332, "name": "Cacturne", "type": "Grama", "secondType": "Noturno", "BaseTotal": 300, "hp": 70, "atk": 115, "def": 60, "spd": 55, "stage": 2, "nextForm": null},

  {"id": 333, "name": "Swablu", "type": "Normal", "secondType": "Voador", "BaseTotal": 203, "hp": 45, "atk": 40, "def": 68, "spd": 50, "stage": 1, "nextForm": "Altaria", "evoTrigger": 8},
  {"id": 334, "name": "Altaria", "type": "Dragão", "secondType": "Voador", "BaseTotal": 323, "hp": 75, "atk": 70, "def": 98, "spd": 80, "stage": 2, "nextForm": null},

  {"id": 335, "name": "Zangoose", "type": "Normal", "secondType": "", "BaseTotal": 311, "hp": 73, "atk": 88, "def": 60, "spd": 90, "stage": 1, "nextForm": null},

  {"id": 336, "name": "Seviper", "type": "Veneno", "secondType": "", "BaseTotal": 298, "hp": 73, "atk": 100, "def": 60, "spd": 65, "stage": 1, "nextForm": null},

  {"id": 337, "name": "Lunatone", "type": "Pedra", "secondType": "Psíquico", "BaseTotal": 310, "hp": 90, "atk": 75, "def": 75, "spd": 70, "stage": 1, "nextForm": null},

  {"id": 338, "name": "Solrock", "type": "Pedra", "secondType": "Psíquico", "BaseTotal": 310, "hp": 90, "atk": 75, "def": 75, "spd": 70, "stage": 1, "nextForm": null},

  {"id": 339, "name": "Barboach", "type": "Água", "secondType": "Terra", "BaseTotal": 199, "hp": 50, "atk": 47, "def": 42, "spd": 60, "stage": 1, "nextForm": "Whiscash", "evoTrigger": 8},
  {"id": 340, "name": "Whiscash", "type": "Água", "secondType": "Terra", "BaseTotal": 319, "hp": 110, "atk": 77, "def": 72, "spd": 60, "stage": 2, "nextForm": null},

  {"id": 341, "name": "Corphish", "type": "Água", "secondType": "", "BaseTotal": 193, "hp": 43, "atk": 65, "def": 50, "spd": 35, "stage": 1, "nextForm": "Crawdaunt", "evoTrigger": 8},
  {"id": 342, "name": "Crawdaunt", "type": "Água", "secondType": "Noturno", "BaseTotal": 293, "hp": 63, "atk": 105, "def": 70, "spd": 55, "stage": 2, "nextForm": null},

  {"id": 343, "name": "Baltoy", "type": "Terra", "secondType": "Psíquico", "BaseTotal": 197, "hp": 40, "atk": 40, "def": 62, "spd": 55, "stage": 1, "nextForm": "Claydol", "evoTrigger": 8},
  {"id": 344, "name": "Claydol", "type": "Terra", "secondType": "Psíquico", "BaseTotal": 317, "hp": 60, "atk": 70, "def": 112, "spd": 75, "stage": 2, "nextForm": null},

  {"id": 345, "name": "Lileep", "type": "Pedra", "secondType": "Grama", "BaseTotal": 222, "hp": 66, "atk": 51, "def": 82, "spd": 23, "stage": 1, "nextForm": "Cradily", "evoTrigger": 8},
  {"id": 346, "name": "Cradily", "type": "Pedra", "secondType": "Grama", "BaseTotal": 312, "hp": 86, "atk": 81, "def": 102, "spd": 43, "stage": 2, "nextForm": null},

  {"id": 347, "name": "Anorith", "type": "Pedra", "secondType": "Inseto", "BaseTotal": 238, "hp": 45, "atk": 68, "def": 50, "spd": 75, "stage": 1, "nextForm": "Armaldo", "evoTrigger": 8},
  {"id": 348, "name": "Armaldo", "type": "Pedra", "secondType": "Inseto", "BaseTotal": 308, "hp": 75, "atk": 98, "def": 90, "spd": 45, "stage": 2, "nextForm": null},

  {"id": 349, "name": "Feebas", "type": "Água", "secondType": "", "BaseTotal": 150, "hp": 20, "atk": 12, "def": 38, "spd": 80, "stage": 1, "nextForm": "Milotic", "evoTrigger": 8},
  {"id": 350, "name": "Milotic", "type": "Água", "secondType": "", "BaseTotal": 358, "hp": 95, "atk": 80, "def": 102, "spd": 81, "stage": 2, "nextForm": null},

  {"id": 351, "name": "Castform", "type": "Normal", "secondType": "", "BaseTotal": 280, "hp": 70, "atk": 70, "def": 70, "spd": 70, "stage": 1, "nextForm": null},

  {"id": 352, "name": "Kecleon", "type": "Normal", "secondType": "", "BaseTotal": 270, "hp": 60, "atk": 75, "def": 95, "spd": 40, "stage": 1, "nextForm": null},

  {"id": 353, "name": "Shuppet", "type": "Fantasma", "secondType": "", "BaseTotal": 192, "hp": 44, "atk": 69, "def": 34, "spd": 45, "stage": 1, "nextForm": "Banette", "evoTrigger": 8},
  {"id": 354, "name": "Banette", "type": "Fantasma", "secondType": "", "BaseTotal": 292, "hp": 64, "atk": 99, "def": 64, "spd": 65, "stage": 2, "nextForm": null},

  {"id": 355, "name": "Duskull", "type": "Fantasma", "secondType": "", "BaseTotal": 170, "hp": 20, "atk": 35, "def": 90, "spd": 25, "stage": 1, "nextForm": "Dusclops", "evoTrigger": 5},
  {"id": 356, "name": "Dusclops", "type": "Fantasma", "secondType": "", "BaseTotal": 260, "hp": 40, "atk": 65, "def": 130, "spd": 25, "stage": 2, "nextForm": "Dusknoir", "evoTrigger": 10},

  {"id": 357, "name": "Tropius", "type": "Grama", "secondType": "Voador", "BaseTotal": 305, "hp": 99, "atk": 70, "def": 85, "spd": 51, "stage": 1, "nextForm": null},

  {"id": 358, "name": "Chimecho", "type": "Psíquico", "secondType": "", "BaseTotal": 297, "hp": 75, "atk": 72, "def": 85, "spd": 65, "stage": 2, "nextForm": null},

  {"id": 359, "name": "Absol", "type": "Noturno", "secondType": "", "BaseTotal": 302, "hp": 65, "atk": 102, "def": 60, "spd": 75, "stage": 1, "nextForm": null},
  
  {"id": 360, "name": "Wynaut", "type": "Psíquico", "secondType": "", "BaseTotal": 189, "hp": 95, "atk": 23, "def": 48, "spd": 23, "stage": 1, "nextForm": "Wobbuffet", "evoTrigger": 8},

  {"id": 361, "name": "Snorunt", "type": "Gelo", "secondType": "", "BaseTotal": 200, "hp": 50, "atk": 50, "def": 50, "spd": 50, "stage": 1, "nextForm": "Glalie", "evoTrigger": 8},
  {"id": 362, "name": "Glalie", "type": "Gelo", "secondType": "", "BaseTotal": 320, "hp": 80, "atk": 80, "def": 80, "spd": 80, "stage": 2, "nextForm": null},

  {"id": 363, "name": "Spheal", "type": "Gelo", "secondType": "Água", "BaseTotal": 193, "hp": 70, "atk": 48, "def": 50, "spd": 25, "stage": 1, "nextForm": "Sealeo", "evoTrigger": 5},
  {"id": 364, "name": "Sealeo", "type": "Gelo", "secondType": "Água", "BaseTotal": 273, "hp": 90, "atk": 68, "def": 70, "spd": 45, "stage": 2, "nextForm": "Walrein", "evoTrigger": 10},
  {"id": 365, "name": "Walrein", "type": "Gelo", "secondType": "Água", "BaseTotal": 353, "hp": 110, "atk": 88, "def": 90, "spd": 65, "stage": 3, "nextForm": null},

  {"id": 366, "name": "Clamperl", "type": "Água", "secondType": "", "BaseTotal": 206, "hp": 35, "atk": 69, "def": 70, "spd": 32, "stage": 1, "nextForm": "Huntail", "evoTrigger": 8},
  {"id": 367, "name": "Huntail", "type": "Água", "secondType": "", "BaseTotal": 296, "hp": 55, "atk": 99, "def": 90, "spd": 52, "stage": 2, "nextForm": null},
  {"id": 368, "name": "Gorebyss", "type": "Água", "secondType": "", "BaseTotal": 296, "hp": 55, "atk": 99, "def": 90, "spd": 52, "stage": 2, "nextForm": null},

  {"id": 369, "name": "Relicanth", "type": "Água", "secondType": "Pedra", "BaseTotal": 321, "hp": 100, "atk": 68, "def": 98, "spd": 55, "stage": 1, "nextForm": null},

  {"id": 370, "name": "Luvdisc", "type": "Água", "secondType": "", "BaseTotal": 235, "hp": 43, "atk": 35, "def": 60, "spd": 97, "stage": 1, "nextForm": null},

  {"id": 371, "name": "Bagon", "type": "Dragão", "secondType": "", "BaseTotal": 198, "hp": 45, "atk": 58, "def": 45, "spd": 50, "stage": 1, "nextForm": "Shelgon", "evoTrigger": 5},
  {"id": 372, "name": "Shelgon", "type": "Dragão", "secondType": "", "BaseTotal": 268, "hp": 65, "atk": 78, "def": 75, "spd": 50, "stage": 2, "nextForm": "Salamence", "evoTrigger": 10},
  {"id": 373, "name": "Salamence", "type": "Dragão", "secondType": "Voador", "BaseTotal": 397, "hp": 95, "atk": 122, "def": 80, "spd": 100, "stage": 3, "nextForm": null},

  {"id": 374, "name": "Beldum", "type": "Aço", "secondType": "Psíquico", "BaseTotal": 185, "hp": 40, "atk": 45, "def": 70, "spd": 30, "stage": 1, "nextForm": "Metang", "evoTrigger": 5},
  {"id": 375, "name": "Metang", "type": "Aço", "secondType": "Psíquico", "BaseTotal": 265, "hp": 60, "atk": 65, "def": 90, "spd": 50, "stage": 2, "nextForm": "Metagross", "evoTrigger": 10},
  {"id": 376, "name": "Metagross", "type": "Aço", "secondType": "Psíquico", "BaseTotal": 375, "hp": 80, "atk": 115, "def": 110, "spd": 70, "stage": 3, "nextForm": null},

  {"id": 377, "name": "Regirock", "type": "Pedra", "secondType": "", "BaseTotal": 355, "hp": 80, "atk": 75, "def": 150, "spd": 50, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 378, "name": "Regice", "type": "Gelo", "secondType": "", "BaseTotal": 355, "hp": 80, "atk": 75, "def": 150, "spd": 50, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 379, "name": "Registeel", "type": "Aço", "secondType": "", "BaseTotal": 355, "hp": 80, "atk": 75, "def": 150, "spd": 50, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 380, "name": "Latias", "type": "Dragão", "secondType": "Psíquico", "BaseTotal": 395, "hp": 80, "atk": 95, "def": 110, "spd": 110, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 381, "name": "Latios", "type": "Dragão", "secondType": "Psíquico", "BaseTotal": 395, "hp": 80, "atk": 110, "def": 95, "spd": 110, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 382, "name": "Kyogre", "type": "Água", "secondType": "", "BaseTotal": 430, "hp": 100, "atk": 125, "def": 115, "spd": 90, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 383, "name": "Groudon", "type": "Terra", "secondType": "", "BaseTotal": 430, "hp": 100, "atk": 125, "def": 115, "spd": 90, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 384, "name": "Rayquaza", "type": "Dragão", "secondType": "Voador", "BaseTotal": 440, "hp": 105, "atk": 150, "def": 90, "spd": 95, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 385, "name": "Jirachi", "type": "Aço", "secondType": "Psíquico", "BaseTotal": 400, "hp": 100, "atk": 100, "def": 100, "spd": 100, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 386, "name": "Deoxys", "type": "Psíquico", "secondType": "", "BaseTotal": 400, "hp": 50, "atk": 150, "def": 50, "spd": 150, "stage": 1, "nextForm": null, "isLegendary": true},

  // QUARTA GERAÇÃO
  {"id": 387, "name": "Turtwig", "type": "Grama", "secondType": "", "BaseTotal": 202, "hp": 55, "atk": 56, "def": 60, "spd": 31, "stage": 1, "nextForm": "Grotle", "evoTrigger": 5},
  {"id": 388, "name": "Grotle", "type": "Grama", "secondType": "", "BaseTotal": 258, "hp": 75, "atk": 72, "def": 75, "spd": 36, "stage": 2, "nextForm": "Torterra", "evoTrigger": 10},
  {"id": 389, "name": "Torterra", "type": "Grama", "secondType": "Terra", "BaseTotal": 338, "hp": 95, "atk": 92, "def": 95, "spd": 56, "stage": 3, "nextForm": null },

  {"id": 390, "name": "Chimchar", "type": "Fogo", "secondType": "", "BaseTotal": 207, "hp": 44, "atk": 58, "def": 44, "spd": 61, "stage": 1, "nextForm": "Monferno", "evoTrigger": 5},
  {"id": 391, "name": "Monferno", "type": "Fogo", "secondType": "Lutador", "BaseTotal": 275, "hp": 64, "atk": 78, "def": 52, "spd": 81, "stage": 2, "nextForm": "Infernape", "evoTrigger": 10},
  {"id": 392, "name": "Infernape", "type": "Fogo", "secondType": "Lutador", "BaseTotal": 359, "hp": 76, "atk": 104, "def": 71, "spd": 108, "stage": 3, "nextForm": null},

  {"id": 393, "name": "Piplup", "type": "Água", "secondType": "", "BaseTotal": 203, "hp": 53, "atk": 56, "def": 54, "spd": 40, "stage": 1, "nextForm": "Prinplup", "evoTrigger": 5},
  {"id": 394, "name": "Prinplup", "type": "Água", "secondType": "", "BaseTotal": 260, "hp": 64, "atk": 74, "def": 72, "spd": 50, "stage": 2, "nextForm": "Empoleon", "evoTrigger": 10},
  {"id": 395, "name": "Empoleon", "type": "Água", "secondType": "Aço", "BaseTotal": 336, "hp": 84, "atk": 98, "def": 94, "spd": 60, "stage": 3, "nextForm": null},

  {"id": 396, "name": "Starly", "type": "Normal", "secondType": "Voador", "BaseTotal": 172, "hp": 40, "atk": 42, "def": 30, "spd": 60, "stage": 1, "nextForm": "Staravia", "evoTrigger": 5},
  {"id": 397, "name": "Staravia", "type": "Normal", "secondType": "Voador", "BaseTotal": 238, "hp": 55, "atk": 58, "def": 45, "spd": 80, "stage": 2, "nextForm": "Staraptor", "evoTrigger": 10},
  {"id": 398, "name": "Staraptor", "type": "Normal", "secondType": "Voador", "BaseTotal": 335, "hp": 85, "atk": 85, "def": 65, "spd": 100, "stage": 3, "nextForm": null},

  {"id": 399, "name": "Bidoof", "type": "Normal", "secondType": "", "BaseTotal": 170, "hp": 59, "atk": 40, "def": 40, "spd": 31, "stage": 1, "nextForm": "Bibarel", "evoTrigger": 8},
  {"id": 400, "name": "Bibarel", "type": "Normal", "secondType": "Água", "BaseTotal": 280, "hp": 79, "atk": 70, "def": 60, "spd": 71, "stage": 2, "nextForm": null},

  {"id": 401, "name": "Kricketot", "type": "Inseto", "secondType": "", "BaseTotal": 128, "hp": 37, "atk": 25, "def": 41, "spd": 25, "stage": 1, "nextForm": "Kricketune", "evoTrigger": 8},
  {"id": 402, "name": "Kricketune", "type": "Inseto", "secondType": "", "BaseTotal": 263, "hp": 77, "atk": 70, "def": 51, "spd": 65, "stage": 2, "nextForm": null},

  {"id": 403, "name": "Shinx", "type": "Elétrico", "secondType": "", "BaseTotal": 176, "hp": 45, "atk": 52, "def": 34, "spd": 45, "stage": 1, "nextForm": "Luxio", "evoTrigger": 5},
  {"id": 404, "name": "Luxio", "type": "Elétrico", "secondType": "", "BaseTotal": 241, "hp": 60, "atk": 72, "def": 49, "spd": 60, "stage": 2, "nextForm": "Luxray", "evoTrigger": 10},
  {"id": 405, "name": "Luxray", "type": "Elétrico", "secondType": "", "BaseTotal": 337, "hp": 80, "atk": 108, "def": 79, "spd": 70, "stage": 3, "nextForm": null},

  {"id": 406, "name": "Budew", "type": "Grama", "secondType": "Veneno", "BaseTotal": 187, "hp": 40, "atk": 40, "def": 52, "spd": 55, "stage": 1, "nextForm": "Roserade", "evoTrigger": 8},
  {"id": 407, "name": "Roserade", "type": "Grama", "secondType": "Veneno", "BaseTotal": 333, "hp": 60, "atk": 98, "def": 85, "spd": 90, "stage": 2, "nextForm": null},

  {"id": 408, "name": "Cranidos", "type": "Pedra", "secondType": "", "BaseTotal": 238, "hp": 67, "atk": 78, "def": 35, "spd": 58, "stage": 1, "nextForm": "Rampardos", "evoTrigger": 8},
  {"id": 409, "name": "Rampardos", "type": "Pedra", "secondType": "", "BaseTotal": 325, "hp": 97, "atk": 115, "def": 55, "spd": 58, "stage": 2, "nextForm": null},

  {"id": 410, "name": "Shieldon", "type": "Pedra", "secondType": "Aço", "BaseTotal": 205, "hp": 30, "atk": 42, "def": 103, "spd": 30, "stage": 1, "nextForm": "Bastiodon", "evoTrigger": 8},
  {"id": 411, "name": "Bastiodon", "type": "Pedra", "secondType": "Aço", "BaseTotal": 293, "hp": 60, "atk": 50, "def": 153, "spd": 30, "stage": 2, "nextForm": null},

  {"id": 412, "name": "Burmy", "type": "Inseto", "secondType": "", "BaseTotal": 150, "hp": 40, "atk": 29, "def": 45, "spd": 36, "stage": 1, "nextForm": "Wormadam", "evoTrigger": 8},
  {"id": 413, "name": "Wormadam", "type": "Inseto", "secondType": "Grama", "BaseTotal": 260, "hp": 60, "atk": 69, "def": 95, "spd": 36, "stage": 2, "nextForm": null},
  {"id": 414, "name": "Mothim", "type": "Inseto", "secondType": "Voador", "BaseTotal": 280, "hp": 70, "atk": 94, "def": 50, "spd": 66, "stage": 2, "nextForm": null},

  {"id": 415, "name": "Combee", "type": "Inseto", "secondType": "Voador", "BaseTotal": 172, "hp": 30, "atk": 30, "def": 42, "spd": 70, "stage": 1, "nextForm": "Vespiquen", "evoTrigger": 8},
  {"id": 416, "name": "Vespiquen", "type": "Inseto", "secondType": "Voador", "BaseTotal": 292, "hp": 70, "atk": 80, "def": 102, "spd": 40, "stage": 2, "nextForm": null},

  {"id": 417, "name": "Pachirisu", "type": "Elétrico", "secondType": "", "BaseTotal": 280, "hp": 60, "atk": 45, "def": 80, "spd": 95, "stage": 1, "nextForm": null},

  {"id": 418, "name": "Buizel", "type": "Água", "secondType": "", "BaseTotal": 234, "hp": 55, "atk": 62, "def": 32, "spd": 85, "stage": 1, "nextForm": "Floatzel", "evoTrigger": 8},
  {"id": 419, "name": "Floatzel", "type": "Água", "secondType": "", "BaseTotal": 347, "hp": 85, "atk": 95, "def": 52, "spd": 115, "stage": 2, "nextForm": null},

  {"id": 420, "name": "Cherubi", "type": "Grama", "secondType": "", "BaseTotal": 177, "hp": 45, "atk": 48, "def": 49, "spd": 35, "stage": 1, "nextForm": "Cherrim", "evoTrigger": 8},
  {"id": 421, "name": "Cherrim", "type": "Grama", "secondType": "", "BaseTotal": 303, "hp": 70, "atk": 74, "def": 74, "spd": 85, "stage": 2, "nextForm": null},

  {"id": 422, "name": "Shellos", "type": "Água", "secondType": "", "BaseTotal": 217, "hp": 76, "atk": 52, "def": 55, "spd": 34, "stage": 1, "nextForm": "Gastrodon", "evoTrigger": 8},
  {"id": 423, "name": "Gastrodon", "type": "Água", "secondType": "Terra", "BaseTotal": 313, "hp": 111, "atk": 88, "def": 75, "spd": 39, "stage": 2, "nextForm": null},

  {"id": 424, "name": "Ambipom", "type": "Normal", "secondType": "", "BaseTotal": 336, "hp": 75, "atk": 80, "def": 66, "spd": 115, "stage": 2, "nextForm": null},

  {"id": 425, "name": "Drifloon", "type": "Fantasma", "secondType": "Voador", "BaseTotal": 254, "hp": 90, "atk": 55, "def": 39, "spd": 70, "stage": 1, "nextForm": "Drifblim", "evoTrigger": 8},
  {"id": 426, "name": "Drifblim", "type": "Fantasma", "secondType": "Voador", "BaseTotal": 364, "hp": 150, "atk": 85, "def": 49, "spd": 80, "stage": 2, "nextForm": null},

  {"id": 427, "name": "Buneary", "type": "Normal", "secondType": "", "BaseTotal": 245, "hp": 55, "atk": 55, "def": 50, "spd": 85, "stage": 1, "nextForm": "Lopunny", "evoTrigger": 8},
  {"id": 428, "name": "Lopunny", "type": "Normal", "secondType": "", "BaseTotal": 325, "hp": 65, "atk": 65, "def": 90, "spd": 105, "stage": 2, "nextForm": null},

  {"id": 429, "name": "Mismagius", "type": "Fantasma", "secondType": "", "BaseTotal": 329, "hp": 60, "atk": 82, "def": 82, "spd": 105, "stage": 2, "nextForm": null},

  {"id": 430, "name": "Honchkrow", "type": "Noturno", "secondType": "Voador", "BaseTotal": 338, "hp": 100, "atk": 115, "def": 52, "spd": 71, "stage": 2, "nextForm": null},

  {"id": 431, "name": "Glameow", "type": "Normal", "secondType": "", "BaseTotal": 222, "hp": 49, "atk": 48, "def": 40, "spd": 85, "stage": 1, "nextForm": "Purugly", "evoTrigger": 8},
  {"id": 432, "name": "Purugly", "type": "Normal", "secondType": "", "BaseTotal": 318, "hp": 71, "atk": 73, "def": 62, "spd": 112, "stage": 2, "nextForm": null},

  {"id": 433, "name": "Chingling", "type": "Psíquico", "secondType": "", "BaseTotal": 188, "hp": 45, "atk": 48, "def": 50, "spd": 45, "stage": 1, "nextForm": "Chimecho", "evoTrigger": 8},

  {"id": 434, "name": "Stunky", "type": "Veneno", "secondType": "Noturno", "BaseTotal": 233, "hp": 63, "atk": 52, "def": 44, "spd": 74, "stage": 1, "nextForm": "Skuntank", "evoTrigger": 8},
  {"id": 435, "name": "Skuntank", "type": "Veneno", "secondType": "Noturno", "BaseTotal": 333, "hp": 103, "atk": 82, "def": 64, "spd": 84, "stage": 2, "nextForm": null},

  {"id": 436, "name": "Bronzor", "type": "Aço", "secondType": "Psíquico", "BaseTotal": 190, "hp": 57, "atk": 24, "def": 86, "spd": 23, "stage": 1, "nextForm": "Bronzong", "evoTrigger": 8},
  {"id": 437, "name": "Bronzong", "type": "Aço", "secondType": "Psíquico", "BaseTotal": 300, "hp": 67, "atk": 84, "def": 116, "spd": 33, "stage": 2, "nextForm": null},

  {"id": 438, "name": "Bonsly", "type": "Pedra", "secondType": "", "BaseTotal": 175, "hp": 50, "atk": 45, "def": 70, "spd": 10, "stage": 1, "nextForm": "Sudowoodo", "evoTrigger": 8},

  {"id": 439, "name": "Mime Jr.", "type": "Psíquico", "secondType": "Fada", "BaseTotal": 196, "hp": 20, "atk": 48, "def": 68, "spd": 60, "stage": 1, "nextForm": "Mr. Mime", "evoTrigger": 5},

  {"id": 440, "name": "Happiny", "type": "Normal", "secondType": "", "BaseTotal": 175, "hp": 100, "atk": 10, "def": 35, "spd": 30, "stage": 1, "nextForm": "Chansey", "evoTrigger": 5},

  {"id": 441, "name": "Chatot", "type": "Normal", "secondType": "Voador", "BaseTotal": 289, "hp": 76, "atk": 78, "def": 44, "spd": 91, "stage": 1, "nextForm": null},

  {"id": 442, "name": "Spiritomb", "type": "Fantasma", "secondType": "Noturno", "BaseTotal": 285, "hp": 50, "atk": 92, "def": 108, "spd": 35, "stage": 1, "nextForm": null},

  {"id": 443, "name": "Gible", "type": "Dragão", "secondType": "Terra", "BaseTotal": 200, "hp": 58, "atk": 55, "def": 45, "spd": 42, "stage": 1, "nextForm": "Gabite", "evoTrigger": 5},
  {"id": 444, "name": "Gabite", "type": "Dragão", "secondType": "Terra", "BaseTotal": 280, "hp": 68, "atk": 70, "def": 60, "spd": 82, "stage": 2, "nextForm": "Garchomp", "evoTrigger": 10},
  {"id": 445, "name": "Garchomp", "type": "Dragão", "secondType": "Terra", "BaseTotal": 405, "hp": 108, "atk": 105, "def": 90, "spd": 102, "stage": 3, "nextForm": null},

  {"id": 446, "name": "Munchlax", "type": "Normal", "secondType": "", "BaseTotal": 264, "hp": 135, "atk": 62, "def": 62, "spd": 5, "stage": 1, "nextForm": "Snorlax", "evoTrigger": 8},

  {"id": 447, "name": "Riolu", "type": "Lutador", "secondType": "", "BaseTotal": 192, "hp": 40, "atk": 52, "def": 40, "spd": 60, "stage": 1, "nextForm": "Lucario", "evoTrigger": 8},
  {"id": 448, "name": "Lucario", "type": "Lutador", "secondType": "Aço", "BaseTotal": 342, "hp": 70, "atk": 112, "def": 70, "spd": 90, "stage": 2, "nextForm": null},

  {"id": 449, "name": "Hippopotas", "type": "Terra", "secondType": "", "BaseTotal": 215, "hp": 68, "atk": 55, "def": 60, "spd": 32, "stage": 1, "nextForm": "Hippowdon", "evoTrigger": 8},
  {"id": 450, "name": "Hippowdon", "type": "Terra", "secondType": "", "BaseTotal": 340, "hp": 108, "atk": 90, "def": 95, "spd": 47, "stage": 2, "nextForm": null},

  {"id": 451, "name": "Skorupi", "type": "Veneno", "secondType": "Inseto", "BaseTotal": 217, "hp": 40, "atk": 40, "def": 72, "spd": 65, "stage": 1, "nextForm": "Drapion", "evoTrigger": 8},
  {"id": 452, "name": "Drapion", "type": "Veneno", "secondType": "Noturno", "BaseTotal": 332, "hp": 70, "atk": 75, "def": 92, "spd": 95, "stage": 2, "nextForm": null},

  {"id": 453, "name": "Croagunk", "type": "Veneno", "secondType": "Lutador", "BaseTotal": 199, "hp": 48, "atk": 61, "def": 40, "spd": 50, "stage": 1, "nextForm": "Toxicroak", "evoTrigger": 8},
  {"id": 454, "name": "Toxicroak", "type": "Veneno", "secondType": "Lutador", "BaseTotal": 329, "hp": 83, "atk": 96, "def": 65, "spd": 85, "stage": 2, "nextForm": null},

  {"id": 455, "name": "Carnivine", "type": "Grama", "secondType": "", "BaseTotal": 287, "hp": 74, "atk": 95, "def": 72, "spd": 46, "stage": 1, "nextForm": null},

  {"id": 456, "name": "Finneon", "type": "Água", "secondType": "", "BaseTotal": 222, "hp": 49, "atk": 49, "def": 58, "spd": 66, "stage": 1, "nextForm": "Lumineon", "evoTrigger": 8},
  {"id": 457, "name": "Lumineon", "type": "Água", "secondType": "", "BaseTotal": 310, "hp": 69, "atk": 69, "def": 81, "spd": 91, "stage": 2, "nextForm": null},

  {"id": 458, "name": "Mantyke", "type": "Água", "secondType": "Voador", "BaseTotal": 220, "hp": 45, "atk": 40, "def": 85, "spd": 50, "stage": 1, "nextForm": "Mantine", "evoTrigger": 8},

  {"id": 459, "name": "Snover", "type": "Grama", "secondType": "Gelo", "BaseTotal": 217, "hp": 60, "atk": 62, "def": 55, "spd": 40, "stage": 1, "nextForm": "Abomasnow", "evoTrigger": 8},
  {"id": 460, "name": "Abomasnow", "type": "Grama", "secondType": "Gelo", "BaseTotal": 322, "hp": 90, "atk": 92, "def": 80, "spd": 60, "stage": 2, "nextForm": null},

  {"id": 461, "name": "Weavile", "type": "Noturno", "secondType": "Gelo", "BaseTotal": 352, "hp": 70, "atk": 82, "def": 75, "spd": 125, "stage": 2, "nextForm": null},

  {"id": 462, "name": "Magnezone", "type": "Elétrico", "secondType": "Aço", "BaseTotal": 332, "hp": 70, "atk": 100, "def": 102, "spd": 60, "stage": 3, "nextForm": null},

  {"id": 463, "name": "Lickilicky", "type": "Normal", "secondType": "", "BaseTotal": 337, "hp": 110, "atk": 82, "def": 95, "spd": 50, "stage": 2, "nextForm": null},

  {"id": 464, "name": "Rhyperior", "type": "Terra", "secondType": "Pedra", "BaseTotal": 345, "hp": 115, "atk": 98, "def": 92, "spd": 40, "stage": 3, "nextForm": null},

  {"id": 465, "name": "Tangrowth", "type": "Grama", "secondType": "", "BaseTotal": 343, "hp": 100, "atk": 105, "def": 88, "spd": 50, "stage": 2, "nextForm": null},

  {"id": 466, "name": "Electivire", "type": "Elétrico", "secondType": "", "BaseTotal": 355, "hp": 75, "atk": 109, "def": 76, "spd": 95, "stage": 3, "nextForm": null},

  {"id": 467, "name": "Magmortar", "type": "Fogo", "secondType": "", "BaseTotal": 349, "hp": 75, "atk": 110, "def": 81, "spd": 83, "stage": 3, "nextForm": null},

  {"id": 468, "name": "Togekiss", "type": "Fada", "secondType": "Voador", "BaseTotal": 355, "hp": 85, "atk": 85, "def": 105, "spd": 80, "stage": 3, "nextForm": null},

  {"id": 469, "name": "Yanmega", "type": "Inseto", "secondType": "Voador", "BaseTotal": 348, "hp": 86, "atk": 96, "def": 71, "spd": 95, "stage": 2, "nextForm": null},

  {"id": 470, "name": "Leafeon", "type": "Grama", "secondType": "", "BaseTotal": 343, "hp": 65, "atk": 85, "def": 98, "spd": 95, "stage": 2, "nextForm": null},

  {"id": 471, "name": "Glaceon", "type": "Gelo", "secondType": "", "BaseTotal": 327, "hp": 65, "atk": 95, "def": 102, "spd": 65, "stage": 2, "nextForm": null},

  {"id": 472, "name": "Gliscor", "type": "Terra", "secondType": "Voador", "BaseTotal": 340, "hp": 75, "atk": 70, "def": 100, "spd": 95, "stage": 2, "nextForm": null},

  {"id": 473, "name": "Mamoswine", "type": "Gelo", "secondType": "Terra", "BaseTotal": 360, "hp": 110, "atk": 100, "def": 70, "spd": 80, "stage": 3, "nextForm": null},

  {"id": 474, "name": "Porygon-Z", "type": "Normal", "secondType": "", "BaseTotal": 355, "hp": 85, "atk": 108, "def": 72, "spd": 90, "stage": 3, "nextForm": null},

  {"id": 475, "name": "Gallade", "type": "Psíquico", "secondType": "Lutador", "BaseTotal": 333, "hp": 68, "atk": 95, "def": 90, "spd": 80, "stage": 3, "nextForm": null},

  {"id": 476, "name": "Probopass", "type": "Pedra", "secondType": "Aço", "BaseTotal": 313, "hp": 60, "atk": 65, "def": 148, "spd": 40, "stage": 2, "nextForm": null},

  {"id": 477, "name": "Dusknoir", "type": "Fantasma", "secondType": "", "BaseTotal": 307, "hp": 45, "atk": 82, "def": 135, "spd": 45, "stage": 3, "nextForm": null},

  {"id": 478, "name": "Froslass", "type": "Gelo", "secondType": "Fantasma", "BaseTotal": 330, "hp": 70, "atk": 80, "def": 70, "spd": 110, "stage": 2, "nextForm": null},
  
  {"id": 479, "name": "Rotom", "type": "Elétrico", "secondType": "Fantasma", "BaseTotal": 290, "hp": 50, "atk": 72, "def": 77, "spd": 91, "stage": 1, "nextForm": null},

  {"id": 480, "name": "Uxie", "type": "Psíquico", "secondType": "", "BaseTotal": 375, "hp": 75, "atk": 75, "def": 130, "spd": 95, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 481, "name": "Mesprit", "type": "Psíquico", "secondType": "", "BaseTotal": 370, "hp": 80, "atk": 105, "def": 105, "spd": 80, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 482, "name": "Azelf", "type": "Psíquico", "secondType": "", "BaseTotal": 385, "hp": 75, "atk": 125, "def": 70, "spd": 115, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 483, "name": "Dialga", "type": "Aço", "secondType": "Dragão", "BaseTotal": 435, "hp": 100, "atk": 135, "def": 110, "spd": 90, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 484, "name": "Palkia", "type": "Água", "secondType": "Dragão", "BaseTotal": 435, "hp": 90, "atk": 135, "def": 110, "spd": 100, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 485, "name": "Heatran", "type": "Fogo", "secondType": "Aço", "BaseTotal": 384, "hp": 91, "atk": 110, "def": 106, "spd": 77, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 486, "name": "Regigigas", "type": "Normal", "secondType": "", "BaseTotal": 440, "hp": 110, "atk": 120, "def": 110, "spd": 100, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 487, "name": "Giratina", "type": "Fantasma", "secondType": "Dragão", "BaseTotal": 460, "hp": 150, "atk": 100, "def": 120, "spd": 90, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 488, "name": "Cresselia", "type": "Psíquico", "secondType": "", "BaseTotal": 402, "hp": 120, "atk": 72, "def": 125, "spd": 85, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 489, "name": "Phione", "type": "Água", "secondType": "", "BaseTotal": 320, "hp": 80, "atk": 80, "def": 80, "spd": 80, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 490, "name": "Manaphy", "type": "Água", "secondType": "", "BaseTotal": 400, "hp": 100, "atk": 100, "def": 100, "spd": 100, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 491, "name": "Darkrai", "type": "Noturno", "secondType": "", "BaseTotal": 397, "hp": 70, "atk": 112, "def": 90, "spd": 125, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 492, "name": "Shaymin", "type": "Grama", "secondType": "", "BaseTotal": 400, "hp": 100, "atk": 100, "def": 100, "spd": 100, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 493, "name": "Arceus", "type": "Normal", "secondType": "", "BaseTotal": 480, "hp": 120, "atk": 120, "def": 120, "spd": 120, "stage": 1, "nextForm": null, "isLegendary": true},

  // QUINTA GERAÇÃO
  {"id": 494, "name": "Victini", "type": "Psíquico", "secondType": "Fogo", "BaseTotal": 400, "hp": 100, "atk": 100, "def": 100, "spd": 100, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 495, "name": "Snivy", "type": "Grama", "secondType": "", "BaseTotal": 208, "hp": 45, "atk": 45, "def": 55, "spd": 63, "stage": 1, "nextForm": "Servine", "evoTrigger": 5},
  {"id": 496, "name": "Servine", "type": "Grama", "secondType": "", "BaseTotal": 278, "hp": 60, "atk": 60, "def": 75, "spd": 83, "stage": 2, "nextForm": "Serperior", "evoTrigger": 10},
  {"id": 497, "name": "Serperior", "type": "Grama", "secondType": "", "BaseTotal": 358, "hp": 75, "atk": 75, "def": 95, "spd": 113, "stage": 3, "nextForm": null},

  {"id": 498, "name": "Tepig", "type": "Fogo", "secondType": "", "BaseTotal": 209, "hp": 65, "atk": 54, "def": 45, "spd": 45, "stage": 1, "nextForm": "Pignite", "evoTrigger": 5},
  {"id": 499, "name": "Pignite", "type": "Fogo", "secondType": "Lutador", "BaseTotal": 282, "hp": 90, "atk": 82, "def": 55, "spd": 55, "stage": 2, "nextForm": "Emboar", "evoTrigger": 10},
  {"id": 500, "name": "Emboar", "type": "Fogo", "secondType": "Lutador", "BaseTotal": 352, "hp": 110, "atk": 112, "def": 65, "spd": 65, "stage": 3, "nextForm": null},

  {"id": 501, "name": "Oshawott", "type": "Água", "secondType": "", "BaseTotal": 204, "hp": 55, "atk": 59, "def": 45, "spd": 45, "stage": 1, "nextForm": "Dewott", "evoTrigger": 5},
  {"id": 502, "name": "Dewott", "type": "Água", "secondType": "", "BaseTotal": 274, "hp": 75, "atk": 79, "def": 60, "spd": 60, "stage": 2, "nextForm": "Samurott", "evoTrigger": 10},
  {"id": 503, "name": "Samurott", "type": "Água", "secondType": "", "BaseTotal": 347, "hp": 95, "atk": 104, "def": 78, "spd": 70, "stage": 3, "nextForm": null},

  {"id": 504, "name": "Patrat", "type": "Normal", "secondType": "", "BaseTotal": 171, "hp": 45, "atk": 45, "def": 39, "spd": 42, "stage": 1, "nextForm": "Watchog", "evoTrigger": 8},
  {"id": 505, "name": "Watchog", "type": "Normal", "secondType": "", "BaseTotal": 278, "hp": 60, "atk": 72, "def": 69, "spd": 77, "stage": 2, "nextForm": null},

  {"id": 506, "name": "Lillipup", "type": "Normal", "secondType": "", "BaseTotal": 187, "hp": 45, "atk": 42, "def": 45, "spd": 55, "stage": 1, "nextForm": "Herdier", "evoTrigger": 5},
  {"id": 507, "name": "Herdier", "type": "Normal", "secondType": "", "BaseTotal": 248, "hp": 65, "atk": 58, "def": 65, "spd": 60, "stage": 2, "nextForm": "Stoutland", "evoTrigger": 10},
  {"id": 508, "name": "Stoutland", "type": "Normal", "secondType": "", "BaseTotal": 333, "hp": 85, "atk": 78, "def": 90, "spd": 80, "stage": 3, "nextForm": null},

  {"id": 509, "name": "Purrloin", "type": "Noturno", "secondType": "", "BaseTotal": 194, "hp": 41, "atk": 50, "def": 37, "spd": 66, "stage": 1, "nextForm": "Liepard", "evoTrigger": 8},
  {"id": 510, "name": "Liepard", "type": "Noturno", "secondType": "", "BaseTotal": 308, "hp": 64, "atk": 88, "def": 50, "spd": 106, "stage": 2, "nextForm": null},

  {"id": 511, "name": "Pansage", "type": "Grama", "secondType": "", "BaseTotal": 215, "hp": 50, "atk": 53, "def": 48, "spd": 64, "stage": 1, "nextForm": "Simisage", "evoTrigger": 8},
  {"id": 512, "name": "Simisage", "type": "Grama", "secondType": "", "BaseTotal": 337, "hp": 75, "atk": 98, "def": 63, "spd": 101, "stage": 2, "nextForm": null},

  {"id": 513, "name": "Pansear", "type": "Fogo", "secondType": "", "BaseTotal": 215, "hp": 50, "atk": 53, "def": 48, "spd": 64, "stage": 1, "nextForm": "Simisear", "evoTrigger": 8},
  {"id": 514, "name": "Simisear", "type": "Fogo", "secondType": "", "BaseTotal": 337, "hp": 75, "atk": 98, "def": 63, "spd": 101, "stage": 2, "nextForm": null},

  {"id": 515, "name": "Panpour", "type": "Água", "secondType": "", "BaseTotal": 215, "hp": 50, "atk": 53, "def": 48, "spd": 64, "stage": 1, "nextForm": "Simipour", "evoTrigger": 8},
  {"id": 516, "name": "Simipour", "type": "Água", "secondType": "", "BaseTotal": 337, "hp": 75, "atk": 98, "def": 63, "spd": 101, "stage": 2, "nextForm": null},

  {"id": 517, "name": "Munna", "type": "Psíquico", "secondType": "", "BaseTotal": 196, "hp": 76, "atk": 46, "def": 50, "spd": 24, "stage": 1, "nextForm": "Musharna", "evoTrigger": 8},
  {"id": 518, "name": "Musharna", "type": "Psíquico", "secondType": "", "BaseTotal": 316, "hp": 116, "atk": 81, "def": 90, "spd": 29, "stage": 2, "nextForm": null},

  {"id": 519, "name": "Pidove", "type": "Normal", "secondType": "Voador", "BaseTotal": 179, "hp": 50, "atk": 46, "def": 40, "spd": 43, "stage": 1, "nextForm": "Tranquill", "evoTrigger": 5},
  {"id": 520, "name": "Tranquill", "type": "Normal", "secondType": "Voador", "BaseTotal": 243, "hp": 62, "atk": 64, "def": 52, "spd": 65, "stage": 2, "nextForm": "Unfezant", "evoTrigger": 10},
  {"id": 521, "name": "Unfezant", "type": "Normal", "secondType": "Voador", "BaseTotal": 331, "hp": 80, "atk": 90, "def": 68, "spd": 93, "stage": 3, "nextForm": null},

  {"id": 522, "name": "Blitzle", "type": "Elétrico", "secondType": "", "BaseTotal": 208, "hp": 45, "atk": 55, "def": 32, "spd": 76, "stage": 1, "nextForm": "Zebstrika", "evoTrigger": 8},
  {"id": 523, "name": "Zebstrika", "type": "Elétrico", "secondType": "", "BaseTotal": 344, "hp": 75, "atk": 90, "def": 63, "spd": 116, "stage": 2, "nextForm": null},

  {"id": 524, "name": "Roggenrola", "type": "Pedra", "secondType": "", "BaseTotal": 175, "hp": 55, "atk": 50, "def": 55, "spd": 15, "stage": 1, "nextForm": "Boldore", "evoTrigger": 5},
  {"id": 525, "name": "Boldore", "type": "Pedra", "secondType": "", "BaseTotal": 240, "hp": 70, "atk": 78, "def": 72, "spd": 20, "stage": 2, "nextForm": "Gigalith", "evoTrigger": 10},
  {"id": 526, "name": "Gigalith", "type": "Pedra", "secondType": "", "BaseTotal": 313, "hp": 85, "atk": 98, "def": 105, "spd": 25, "stage": 3, "nextForm": null},

  {"id": 527, "name": "Woobat", "type": "Psíquico", "secondType": "Voador", "BaseTotal": 220, "hp": 55, "atk": 50, "def": 43, "spd": 72, "stage": 1, "nextForm": "Swoobat", "evoTrigger": 8},
  {"id": 528, "name": "Swoobat", "type": "Psíquico", "secondType": "Voador", "BaseTotal": 303, "hp": 67, "atk": 67, "def": 55, "spd": 114, "stage": 2, "nextForm": null},

  {"id": 529, "name": "Drilbur", "type": "Terra", "secondType": "", "BaseTotal": 228, "hp": 60, "atk": 58, "def": 42, "spd": 68, "stage": 1, "nextForm": "Excadrill", "evoTrigger": 8},
  {"id": 530, "name": "Excadrill", "type": "Terra", "secondType": "Aço", "BaseTotal": 352, "hp": 110, "atk": 92, "def": 62, "spd": 88, "stage": 2, "nextForm": null},

  {"id": 531, "name": "Audino", "type": "Normal", "secondType": "", "BaseTotal": 299, "hp": 103, "atk": 60, "def": 86, "spd": 50, "stage": 1, "nextForm": null},

  {"id": 532, "name": "Timburr", "type": "Lutador", "secondType": "", "BaseTotal": 207, "hp": 75, "atk": 52, "def": 45, "spd": 35, "stage": 1, "nextForm": "Gurdurr", "evoTrigger": 5},
  {"id": 533, "name": "Gurdurr", "type": "Lutador", "secondType": "", "BaseTotal": 265, "hp": 85, "atk": 72, "def": 68, "spd": 40, "stage": 2, "nextForm": "Conkeldurr", "evoTrigger": 10},
  {"id": 534, "name": "Conkeldurr", "type": "Lutador", "secondType": "", "BaseTotal": 328, "hp": 105, "atk": 98, "def": 80, "spd": 45, "stage": 3, "nextForm": null},

  {"id": 535, "name": "Tympole", "type": "Água", "secondType": "", "BaseTotal": 204, "hp": 50, "atk": 50, "def": 40, "spd": 64, "stage": 1, "nextForm": "Palpitoad", "evoTrigger": 5},
  {"id": 536, "name": "Palpitoad", "type": "Água", "secondType": "Terra", "BaseTotal": 264, "hp": 75, "atk": 65, "def": 55, "spd": 69, "stage": 2, "nextForm": "Seismitoad", "evoTrigger": 10},
  {"id": 537, "name": "Seismitoad", "type": "Água", "secondType": "Terra", "BaseTotal": 344, "hp": 105, "atk": 90, "def": 75, "spd": 74, "stage": 3, "nextForm": null},

  {"id": 538, "name": "Throh", "type": "Lutador", "secondType": "", "BaseTotal": 315, "hp": 120, "atk": 65, "def": 85, "spd": 45, "stage": 1, "nextForm": null},

  {"id": 539, "name": "Sawk", "type": "Lutador", "secondType": "", "BaseTotal": 313, "hp": 75, "atk": 78, "def": 75, "spd": 85, "stage": 1, "nextForm": null},

  {"id": 540, "name": "Sewaddle", "type": "Inseto", "secondType": "Grama", "BaseTotal": 198, "hp": 45, "atk": 46, "def": 65, "spd": 42, "stage": 1, "nextForm": "Swadloon", "evoTrigger": 5},
  {"id": 541, "name": "Swadloon", "type": "Inseto", "secondType": "Grama", "BaseTotal": 238, "hp": 55, "atk": 56, "def": 85, "spd": 42, "stage": 2, "nextForm": "Leavanny", "evoTrigger": 10},
  {"id": 542, "name": "Leavanny", "type": "Inseto", "secondType": "Grama", "BaseTotal": 333, "hp": 75, "atk": 86, "def": 80, "spd": 92, "stage": 3, "nextForm": null},

  {"id": 543, "name": "Venipede", "type": "Inseto", "secondType": "Veneno", "BaseTotal": 174, "hp": 30, "atk": 38, "def": 49, "spd": 57, "stage": 1, "nextForm": "Whirlipede", "evoTrigger": 5},
  {"id": 544, "name": "Whirlipede", "type": "Inseto", "secondType": "Veneno", "BaseTotal": 224, "hp": 40, "atk": 48, "def": 89, "spd": 47, "stage": 2, "nextForm": "Scolipede", "evoTrigger": 10},
  {"id": 545, "name": "Scolipede", "type": "Inseto", "secondType": "Veneno", "BaseTotal": 329, "hp": 60, "atk": 78, "def": 79, "spd": 112, "stage": 3, "nextForm": null},

  {"id": 546, "name": "Cottonee", "type": "Grama", "secondType": "Fada", "BaseTotal": 193, "hp": 40, "atk": 32, "def": 55, "spd": 66, "stage": 1, "nextForm": "Whimsicott", "evoTrigger": 8},
  {"id": 547, "name": "Whimsicott", "type": "Grama", "secondType": "Fada", "BaseTotal": 328, "hp": 60, "atk": 72, "def": 80, "spd": 116, "stage": 2, "nextForm": null},

  {"id": 548, "name": "Petilil", "type": "Grama", "secondType": "", "BaseTotal": 177, "hp": 45, "atk": 52, "def": 50, "spd": 30, "stage": 1, "nextForm": "Lilligant", "evoTrigger": 8},
  {"id": 549, "name": "Lilligant", "type": "Grama", "secondType": "", "BaseTotal": 320, "hp": 70, "atk": 85, "def": 75, "spd": 90, "stage": 2, "nextForm": null},

  {"id": 550, "name": "Basculin", "type": "Água", "secondType": "", "BaseTotal": 314, "hp": 70, "atk": 86, "def": 60, "spd": 98, "stage": 1, "nextForm": null},

  {"id": 551, "name": "Sandile", "type": "Terra", "secondType": "Noturno", "BaseTotal": 204, "hp": 50, "atk": 54, "def": 35, "spd": 65, "stage": 1, "nextForm": "Krokorok", "evoTrigger": 5},
  {"id": 552, "name": "Krokorok", "type": "Terra", "secondType": "Noturno", "BaseTotal": 243, "hp": 60, "atk": 64, "def": 45, "spd": 74, "stage": 2, "nextForm": "Krookodile", "evoTrigger": 10},
  {"id": 553, "name": "Krookodile", "type": "Terra", "secondType": "Noturno", "BaseTotal": 353, "hp": 95, "atk": 91, "def": 75, "spd": 92, "stage": 3, "nextForm": null},

  {"id": 554, "name": "Darumaka", "type": "Fogo", "secondType": "", "BaseTotal": 217, "hp": 70, "atk": 52, "def": 45, "spd": 50, "stage": 1, "nextForm": "Darmanitan", "evoTrigger": 8},
  {"id": 555, "name": "Darmanitan", "type": "Fogo", "secondType": "", "BaseTotal": 340, "hp": 105, "atk": 85, "def": 55, "spd": 95, "stage": 2, "nextForm": null},

  {"id": 556, "name": "Maractus", "type": "Grama", "secondType": "", "BaseTotal": 298, "hp": 75, "atk": 96, "def": 67, "spd": 60, "stage": 1, "nextForm": null},

  {"id": 557, "name": "Dwebble", "type": "Inseto", "secondType": "Pedra", "BaseTotal": 215, "hp": 50, "atk": 50, "def": 60, "spd": 55, "stage": 1, "nextForm": "Crustle", "evoTrigger": 8},
  {"id": 558, "name": "Crustle", "type": "Inseto", "secondType": "Pedra", "BaseTotal": 300, "hp": 70, "atk": 85, "def": 100, "spd": 45, "stage": 2, "nextForm": null},

  {"id": 559, "name": "Scraggy", "type": "Noturno", "secondType": "Lutador", "BaseTotal": 223, "hp": 50, "atk": 55, "def": 70, "spd": 48, "stage": 1, "nextForm": "Scrafty", "evoTrigger": 8},
  {"id": 560, "name": "Scrafty", "type": "Noturno", "secondType": "Lutador", "BaseTotal": 306, "hp": 65, "atk": 68, "def": 115, "spd": 58, "stage": 2, "nextForm": null},

  {"id": 561, "name": "Sigilyph", "type": "Psíquico", "secondType": "Voador", "BaseTotal": 329, "hp": 72, "atk": 80, "def": 80, "spd": 97, "stage": 1, "nextForm": null},

  {"id": 562, "name": "Yamask", "type": "Fantasma", "secondType": "", "BaseTotal": 185, "hp": 38, "atk": 42, "def": 75, "spd": 30, "stage": 1, "nextForm": "Cofagrigus", "evoTrigger": 8},
  {"id": 563, "name": "Cofagrigus", "type": "Fantasma", "secondType": "", "BaseTotal": 285, "hp": 58, "atk": 72, "def": 125, "spd": 30, "stage": 2, "nextForm": null},

  {"id": 564, "name": "Tirtouga", "type": "Água", "secondType": "Pedra", "BaseTotal": 216, "hp": 54, "atk": 66, "def": 74, "spd": 22, "stage": 1, "nextForm": "Carracosta", "evoTrigger": 8},
  {"id": 565, "name": "Carracosta", "type": "Água", "secondType": "Pedra", "BaseTotal": 301, "hp": 74, "atk": 96, "def": 99, "spd": 32, "stage": 2, "nextForm": null},

  {"id": 566, "name": "Archen", "type": "Pedra", "secondType": "Voador", "BaseTotal": 263, "hp": 55, "atk": 93, "def": 45, "spd": 70, "stage": 1, "nextForm": "Archeops", "evoTrigger": 8},
  {"id": 567, "name": "Archeops", "type": "Pedra", "secondType": "Voador", "BaseTotal": 376, "hp": 75, "atk": 126, "def": 65, "spd": 110, "stage": 2, "nextForm": null},

  {"id": 568, "name": "Trubbish", "type": "Veneno", "secondType": "", "BaseTotal": 222, "hp": 50, "atk": 45, "def": 62, "spd": 65, "stage": 1, "nextForm": "Garbodor", "evoTrigger": 8},
  {"id": 569, "name": "Garbodor", "type": "Veneno", "secondType": "", "BaseTotal": 315, "hp": 80, "atk": 78, "def": 82, "spd": 75, "stage": 2, "nextForm": null},

  {"id": 570, "name": "Zorua", "type": "Noturno", "secondType": "", "BaseTotal": 217, "hp": 40, "atk": 72, "def": 40, "spd": 65, "stage": 1, "nextForm": "Zoroark", "evoTrigger": 8},
  {"id": 571, "name": "Zoroark", "type": "Noturno", "secondType": "", "BaseTotal": 337, "hp": 60, "atk": 112, "def": 60, "spd": 105, "stage": 2, "nextForm": null},

  {"id": 572, "name": "Minccino", "type": "Normal", "secondType": "", "BaseTotal": 215, "hp": 55, "atk": 45, "def": 40, "spd": 75, "stage": 1, "nextForm": "Cinccino", "evoTrigger": 8},
  {"id": 573, "name": "Cinccino", "type": "Normal", "secondType": "", "BaseTotal": 330, "hp": 75, "atk": 80, "def": 60, "spd": 115, "stage": 2, "nextForm": null},

  {"id": 574, "name": "Gothita", "type": "Psíquico", "secondType": "", "BaseTotal": 190, "hp": 45, "atk": 42, "def": 58, "spd": 45, "stage": 1, "nextForm": "Gothorita", "evoTrigger": 5},
  {"id": 575, "name": "Gothorita", "type": "Psíquico", "secondType": "", "BaseTotal": 253, "hp": 60, "atk": 60, "def": 78, "spd": 55, "stage": 2, "nextForm": "Gothitelle", "evoTrigger": 10},
  {"id": 576, "name": "Gothitelle", "type": "Psíquico", "secondType": "", "BaseTotal": 312, "hp": 70, "atk": 75, "def": 102, "spd": 65, "stage": 3, "nextForm": null},

  {"id": 577, "name": "Solosis", "type": "Psíquico", "secondType": "", "BaseTotal": 178, "hp": 45, "atk": 68, "def": 45, "spd": 20, "stage": 1, "nextForm": "Duosion", "evoTrigger": 5},
  {"id": 578, "name": "Duosion", "type": "Psíquico", "secondType": "", "BaseTotal": 232, "hp": 65, "atk": 82, "def": 55, "spd": 30, "stage": 2, "nextForm": "Reuniclus", "evoTrigger": 10},
  {"id": 579, "name": "Reuniclus", "type": "Psíquico", "secondType": "", "BaseTotal": 315, "hp": 110, "atk": 95, "def": 80, "spd": 30, "stage": 3, "nextForm": null},

  {"id": 580, "name": "Ducklett", "type": "Água", "secondType": "Voador", "BaseTotal": 211, "hp": 62, "atk": 44, "def": 50, "spd": 55, "stage": 1, "nextForm": "Swanna", "evoTrigger": 8},
  {"id": 581, "name": "Swanna", "type": "Água", "secondType": "Voador", "BaseTotal": 323, "hp": 75, "atk": 87, "def": 63, "spd": 98, "stage": 2, "nextForm": null},

  {"id": 582, "name": "Vanillite", "type": "Gelo", "secondType": "", "BaseTotal": 193, "hp": 36, "atk": 58, "def": 55, "spd": 44, "stage": 1, "nextForm": "Vanillish", "evoTrigger": 5},
  {"id": 583, "name": "Vanillish", "type": "Gelo", "secondType": "", "BaseTotal": 252, "hp": 51, "atk": 72, "def": 70, "spd": 59, "stage": 2, "nextForm": "Vanilluxe", "evoTrigger": 10},
  {"id": 584, "name": "Vanilluxe", "type": "Gelo", "secondType": "", "BaseTotal": 342, "hp": 71, "atk": 102, "def": 90, "spd": 79, "stage": 3, "nextForm": null},

  {"id": 585, "name": "Deerling", "type": "Normal", "secondType": "Grama", "BaseTotal": 235, "hp": 60, "atk": 50, "def": 50, "spd": 75, "stage": 1, "nextForm": "Sawsbuck", "evoTrigger": 8},
  {"id": 586, "name": "Sawsbuck", "type": "Normal", "secondType": "Grama", "BaseTotal": 325, "hp": 80, "atk": 80, "def": 70, "spd": 95, "stage": 2, "nextForm": null},

  {"id": 587, "name": "Emolga", "type": "Elétrico", "secondType": "Voador", "BaseTotal": 293, "hp": 55, "atk": 75, "def": 60, "spd": 103, "stage": 1, "nextForm": null},

  {"id": 588, "name": "Karrablast", "type": "Inseto", "secondType": "", "BaseTotal": 213, "hp": 50, "atk": 58, "def": 45, "spd": 60, "stage": 1, "nextForm": "Escavalier", "evoTrigger": 8},
  {"id": 589, "name": "Escavalier", "type": "Inseto", "secondType": "Aço", "BaseTotal": 293, "hp": 70, "atk": 98, "def": 105, "spd": 20, "stage": 2, "nextForm": null},

  {"id": 590, "name": "Foongus", "type": "Grama", "secondType": "Veneno", "BaseTotal": 189, "hp": 69, "atk": 55, "def": 50, "spd": 15, "stage": 1, "nextForm": "Amoonguss", "evoTrigger": 8},
  {"id": 591, "name": "Amoonguss", "type": "Grama", "secondType": "Veneno", "BaseTotal": 304, "hp": 114, "atk": 85, "def": 75, "spd": 30, "stage": 2, "nextForm": null},

  {"id": 592, "name": "Frillish", "type": "Água", "secondType": "Fantasma", "BaseTotal": 215, "hp": 55, "atk": 52, "def": 68, "spd": 40, "stage": 1, "nextForm": "Jellicent", "evoTrigger": 8},
  {"id": 593, "name": "Jellicent", "type": "Água", "secondType": "Fantasma", "BaseTotal": 320, "hp": 100, "atk": 72, "def": 88, "spd": 60, "stage": 2, "nextForm": null},

  {"id": 594, "name": "Alomomola", "type": "Água", "secondType": "", "BaseTotal": 350, "hp": 165, "atk": 58, "def": 62, "spd": 65, "stage": 1, "nextForm": null},

  {"id": 595, "name": "Joltik", "type": "Inseto", "secondType": "Elétrico", "BaseTotal": 217, "hp": 50, "atk": 52, "def": 50, "spd": 65, "stage": 1, "nextForm": "Galvantula", "evoTrigger": 8},
  {"id": 596, "name": "Galvantula", "type": "Inseto", "secondType": "Elétrico", "BaseTotal": 325, "hp": 70, "atk": 87, "def": 60, "spd": 108, "stage": 2, "nextForm": null},

  {"id": 597, "name": "Ferroseed", "type": "Grama", "secondType": "Aço", "BaseTotal": 179, "hp": 44, "atk": 37, "def": 88, "spd": 10, "stage": 1, "nextForm": "Ferrothorn", "evoTrigger": 8},
  {"id": 598, "name": "Ferrothorn", "type": "Grama", "secondType": "Aço", "BaseTotal": 292, "hp": 74, "atk": 74, "def": 124, "spd": 20, "stage": 2, "nextForm": null},

  {"id": 599, "name": "Klink", "type": "Aço", "secondType": "", "BaseTotal": 185, "hp": 40, "atk": 50, "def": 65, "spd": 30, "stage": 1, "nextForm": "Klang", "evoTrigger": 5},
  {"id": 600, "name": "Klang", "type": "Aço", "secondType": "", "BaseTotal": 275, "hp": 60, "atk": 75, "def": 90, "spd": 50, "stage": 2, "nextForm": "Klinklang", "evoTrigger": 10},
  {"id": 601, "name": "Klinklang", "type": "Aço", "secondType": "", "BaseTotal": 335, "hp": 60, "atk": 85, "def": 100, "spd": 90, "stage": 3, "nextForm": null},

  {"id": 602, "name": "Tynamo", "type": "Elétrico", "secondType": "", "BaseTotal": 185, "hp": 35, "atk": 50, "def": 40, "spd": 60, "stage": 1, "nextForm": "Eelektrik", "evoTrigger": 5},
  {"id": 603, "name": "Eelektrik", "type": "Elétrico", "secondType": "", "BaseTotal": 255, "hp": 65, "atk": 80, "def": 70, "spd": 40, "stage": 2, "nextForm": "Eelektross", "evoTrigger": 10},
  {"id": 604, "name": "Eelektross", "type": "Elétrico", "secondType": "", "BaseTotal": 325, "hp": 85, "atk": 110, "def": 80, "spd": 50, "stage": 3, "nextForm": null},

  {"id": 605, "name": "Elgyem", "type": "Psíquico", "secondType": "", "BaseTotal": 210, "hp": 55, "atk": 70, "def": 55, "spd": 30, "stage": 1, "nextForm": "Beheeyem", "evoTrigger": 8},
  {"id": 606, "name": "Beheeyem", "type": "Psíquico", "secondType": "", "BaseTotal": 300, "hp": 75, "atk": 100, "def": 85, "spd": 40, "stage": 2, "nextForm": null},

  {"id": 607, "name": "Litwick", "type": "Fantasma", "secondType": "Fogo", "BaseTotal": 173, "hp": 50, "atk": 48, "def": 55, "spd": 20, "stage": 1, "nextForm": "Lampent", "evoTrigger": 5},
  {"id": 608, "name": "Lampent", "type": "Fantasma", "secondType": "Fogo", "BaseTotal": 243, "hp": 60, "atk": 68, "def": 60, "spd": 55, "stage": 2, "nextForm": "Chandelure", "evoTrigger": 10},
  {"id": 609, "name": "Chandelure", "type": "Fantasma", "secondType": "Fogo", "BaseTotal": 330, "hp": 60, "atk": 100, "def": 90, "spd": 80, "stage": 3, "nextForm": null},

  {"id": 610, "name": "Axew", "type": "Dragão", "secondType": "", "BaseTotal": 211, "hp": 46, "atk": 58, "def": 50, "spd": 57, "stage": 1, "nextForm": "Fraxure", "evoTrigger": 5},
  {"id": 611, "name": "Fraxure", "type": "Dragão", "secondType": "", "BaseTotal": 271, "hp": 66, "atk": 78, "def": 60, "spd": 67, "stage": 2, "nextForm": "Haxorus", "evoTrigger": 10},
  {"id": 612, "name": "Haxorus", "type": "Dragão", "secondType": "", "BaseTotal": 357, "hp": 76, "atk": 104, "def": 80, "spd": 97, "stage": 3, "nextForm": null},

  {"id": 613, "name": "Cubchoo", "type": "Gelo", "secondType": "", "BaseTotal": 200, "hp": 55, "atk": 65, "def": 40, "spd": 40, "stage": 1, "nextForm": "Beartic", "evoTrigger": 8},
  {"id": 614, "name": "Beartic", "type": "Gelo", "secondType": "", "BaseTotal": 325, "hp": 95, "atk": 100, "def": 80, "spd": 50, "stage": 2, "nextForm": null},

  {"id": 615, "name": "Cryogonal", "type": "Gelo", "secondType": "", "BaseTotal": 349, "hp": 80, "atk": 72, "def": 92, "spd": 105, "stage": 1, "nextForm": null},

  {"id": 616, "name": "Shelmet", "type": "Inseto", "secondType": "", "BaseTotal": 190, "hp": 50, "atk": 40, "def": 75, "spd": 25, "stage": 1, "nextForm": "Accelgor", "evoTrigger": 8},
  {"id": 617, "name": "Accelgor", "type": "Inseto", "secondType": "", "BaseTotal": 360, "hp": 80, "atk": 85, "def": 50, "spd": 145, "stage": 2, "nextForm": null},

  {"id": 618, "name": "Stunfisk", "type": "Terra", "secondType": "Elétrico", "BaseTotal": 307, "hp": 109, "atk": 74, "def": 92, "spd": 32, "stage": 1, "nextForm": null},

  {"id": 619, "name": "Mienfoo", "type": "Lutador", "secondType": "", "BaseTotal": 230, "hp": 45, "atk": 70, "def": 50, "spd": 65, "stage": 1, "nextForm": "Mienshao", "evoTrigger": 8},
  {"id": 620, "name": "Mienshao", "type": "Lutador", "secondType": "", "BaseTotal": 340, "hp": 65, "atk": 110, "def": 60, "spd": 105, "stage": 2, "nextForm": null},

  {"id": 621, "name": "Druddigon", "type": "Dragão", "secondType": "", "BaseTotal": 305, "hp": 77, "atk": 90, "def": 90, "spd": 48, "stage": 1, "nextForm": null},

  {"id": 622, "name": "Golett", "type": "Terra", "secondType": "Fantasma", "BaseTotal": 198, "hp": 59, "atk": 54, "def": 50, "spd": 35, "stage": 1, "nextForm": "Golurk", "evoTrigger": 8},
  {"id": 623, "name": "Golurk", "type": "Terra", "secondType": "Fantasma", "BaseTotal": 314, "hp": 89, "atk": 90, "def": 80, "spd": 55, "stage": 2, "nextForm": null},

  {"id": 624, "name": "Pawniard", "type": "Noturno", "secondType": "Aço", "BaseTotal": 222, "hp": 45, "atk": 62, "def": 55, "spd": 60, "stage": 1, "nextForm": "Bisharp", "evoTrigger": 5},
  {"id": 625, "name": "Bisharp", "type": "Noturno", "secondType": "Aço", "BaseTotal": 312, "hp": 65, "atk": 92, "def": 85, "spd": 70, "stage": 2, "nextForm": "Kingambit", "evoTrigger": 10},

  {"id": 626, "name": "Bouffalant", "type": "Normal", "secondType": "", "BaseTotal": 320, "hp": 95, "atk": 75, "def": 95, "spd": 55, "stage": 1, "nextForm": null},

  {"id": 627, "name": "Rufflet", "type": "Normal", "secondType": "Voador", "BaseTotal": 240, "hp": 70, "atk": 60, "def": 50, "spd": 60, "stage": 1, "nextForm": "Braviary", "evoTrigger": 8},
  {"id": 628, "name": "Braviary", "type": "Normal", "secondType": "Voador", "BaseTotal": 345, "hp": 100, "atk": 90, "def": 75, "spd": 80, "stage": 2, "nextForm": null},

  {"id": 629, "name": "Vullaby", "type": "Noturno", "secondType": "Voador", "BaseTotal": 250, "hp": 70, "atk": 50, "def": 70, "spd": 60, "stage": 1, "nextForm": "Mandibuzz", "evoTrigger": 8},
  {"id": 630, "name": "Mandibuzz", "type": "Noturno", "secondType": "Voador", "BaseTotal": 350, "hp": 110, "atk": 60, "def": 100, "spd": 80, "stage": 2, "nextForm": null},

  {"id": 631, "name": "Heatmor", "type": "Fogo", "secondType": "", "BaseTotal": 317, "hp": 85, "atk": 101, "def": 66, "spd": 65, "stage": 1, "nextForm": null},

  {"id": 632, "name": "Durant", "type": "Inseto", "secondType": "Aço", "BaseTotal": 325, "hp": 58, "atk": 78, "def": 80, "spd": 109, "stage": 1, "nextForm": null},

  {"id": 633, "name": "Deino", "type": "Noturno", "secondType": "Dragão", "BaseTotal": 195, "hp": 52, "atk": 55, "def": 50, "spd": 38, "stage": 1, "nextForm": "Zweilous", "evoTrigger": 5},
  {"id": 634, "name": "Zweilous", "type": "Noturno", "secondType": "Dragão", "BaseTotal": 275, "hp": 72, "atk": 75, "def": 70, "spd": 58, "stage": 2, "nextForm": "Hydreigon", "evoTrigger": 10},
  {"id": 635, "name": "Hydreigon", "type": "Noturno", "secondType": "Dragão", "BaseTotal": 395, "hp": 92, "atk": 115, "def": 90, "spd": 98, "stage": 3, "nextForm": null},

  {"id": 636, "name": "Larvesta", "type": "Inseto", "secondType": "Fogo", "BaseTotal": 238, "hp": 55, "atk": 68, "def": 55, "spd": 60, "stage": 1, "nextForm": "Volcarona", "evoTrigger": 8},
  {"id": 637, "name": "Volcarona", "type": "Inseto", "secondType": "Fogo", "BaseTotal": 368, "hp": 85, "atk": 98, "def": 85, "spd": 100, "stage": 2, "nextForm": null},

  {"id": 638, "name": "Cobalion", "type": "Aço", "secondType": "Lutador", "BaseTotal": 389, "hp": 91, "atk": 90, "def": 100, "spd": 108, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 639, "name": "Terrakion", "type": "Pedra", "secondType": "Lutador", "BaseTotal": 389, "hp": 91, "atk": 100, "def": 90, "spd": 108, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 640, "name": "Virizion", "type": "Grama", "secondType": "Lutador", "BaseTotal": 389, "hp": 91, "atk": 90, "def": 100, "spd": 108, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 641, "name": "Tornadus", "type": "Voador", "secondType": "", "BaseTotal": 385, "hp": 79, "atk": 120, "def": 75, "spd": 111, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 642, "name": "Thundurus", "type": "Elétrico", "secondType": "Voador", "BaseTotal": 385, "hp": 79, "atk": 120, "def": 75, "spd": 111, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 643, "name": "Reshiram", "type": "Dragão", "secondType": "Fogo", "BaseTotal": 435, "hp": 100, "atk": 135, "def": 110, "spd": 90, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 644, "name": "Zekrom", "type": "Dragão", "secondType": "Elétrico", "BaseTotal": 435, "hp": 100, "atk": 135, "def": 110, "spd": 90, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 645, "name": "Landorus", "type": "Terra", "secondType": "Voador", "BaseTotal": 395, "hp": 89, "atk": 120, "def": 85, "spd": 101, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 646, "name": "Kyurem", "type": "Dragão", "secondType": "Gelo", "BaseTotal": 440, "hp": 125, "atk": 130, "def": 90, "spd": 95, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 647, "name": "Keldeo", "type": "Água", "secondType": "Lutador", "BaseTotal": 389, "hp": 91, "atk": 100, "def": 90, "spd": 108, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 648, "name": "Meloetta", "type": "Normal", "secondType": "Psíquico", "BaseTotal": 394, "hp": 100, "atk": 102, "def": 102, "spd": 90, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 649, "name": "Genesect", "type": "Inseto", "secondType": "Aço", "BaseTotal": 385, "hp": 71, "atk": 120, "def": 95, "spd": 99, "stage": 1, "nextForm": null, "isLegendary": true},

  // SEXTA GERAÇÃO
  {"id": 650, "name": "Chespin", "type": "Grama", "secondType": "", "BaseTotal": 203, "hp": 56, "atk": 54, "def": 55, "spd": 38, "stage": 1, "nextForm": "Quilladin", "evoTrigger": 5},
  {"id": 651, "name": "Quilladin", "type": "Grama", "secondType": "", "BaseTotal": 261, "hp": 61, "atk": 67, "def": 76, "spd": 57, "stage": 2, "nextForm": "Chesnaught", "evoTrigger": 10},
  {"id": 652, "name": "Chesnaught", "type": "Grama", "secondType": "Lutador", "BaseTotal": 340, "hp": 88, "atk": 90, "def": 98, "spd": 64, "stage": 3, "nextForm": null},

  {"id": 653, "name": "Fennekin", "type": "Fogo", "secondType": "", "BaseTotal": 204, "hp": 40, "atk": 54, "def": 50, "spd": 60, "stage": 1, "nextForm": "Braixen", "evoTrigger": 5},
  {"id": 654, "name": "Braixen", "type": "Fogo", "secondType": "", "BaseTotal": 270, "hp": 59, "atk": 74, "def": 64, "spd": 73, "stage": 2, "nextForm": "Delphox", "evoTrigger": 10},
  {"id": 655, "name": "Delphox", "type": "Fogo", "secondType": "Psíquico", "BaseTotal": 357, "hp": 75, "atk": 92, "def": 86, "spd": 104, "stage": 3, "nextForm": null},

  {"id": 656, "name": "Froakie", "type": "Água", "secondType": "", "BaseTotal": 213, "hp": 41, "atk": 59, "def": 42, "spd": 71, "stage": 1, "nextForm": "Frogadier", "evoTrigger": 5},
  {"id": 657, "name": "Frogadier", "type": "Água", "secondType": "", "BaseTotal": 278, "hp": 54, "atk": 73, "def": 54, "spd": 97, "stage": 2, "nextForm": "Greninja", "evoTrigger": 10},
  {"id": 658, "name": "Greninja", "type": "Água", "secondType": "Noturno", "BaseTotal": 362, "hp": 72, "atk": 99, "def": 69, "spd": 122, "stage": 3, "nextForm": null},

  {"id": 659, "name": "Bunnelby", "type": "Normal", "secondType": "", "BaseTotal": 166, "hp": 38, "atk": 34, "def": 37, "spd": 57, "stage": 1, "nextForm": "Diggersby", "evoTrigger": 8},
  {"id": 660, "name": "Diggersby", "type": "Normal", "secondType": "Terra", "BaseTotal": 293, "hp": 85, "atk": 53, "def": 77, "spd": 78, "stage": 2, "nextForm": null},

  {"id": 661, "name": "Fletchling", "type": "Normal", "secondType": "Voador", "BaseTotal": 192, "hp": 45, "atk": 45, "def": 40, "spd": 62, "stage": 1, "nextForm": "Fletchinder", "evoTrigger": 5},
  {"id": 662, "name": "Fletchinder", "type": "Fogo", "secondType": "Voador", "BaseTotal": 264, "hp": 62, "atk": 64, "def": 54, "spd": 84, "stage": 2, "nextForm": "Talonflame", "evoTrigger": 10},
  {"id": 663, "name": "Talonflame", "type": "Fogo", "secondType": "Voador", "BaseTotal": 352, "hp": 78, "atk": 78, "def": 70, "spd": 126, "stage": 3, "nextForm": null},

  {"id": 664, "name": "Scatterbug", "type": "Inseto", "secondType": "", "BaseTotal": 136, "hp": 38, "atk": 31, "def": 32, "spd": 35, "stage": 1, "nextForm": "Spewpa", "evoTrigger": 5},
  {"id": 665, "name": "Spewpa", "type": "Inseto", "secondType": "", "BaseTotal": 143, "hp": 45, "atk": 24, "def": 45, "spd": 29, "stage": 2, "nextForm": "Vivillon", "evoTrigger": 10},
  {"id": 666, "name": "Vivillon", "type": "Inseto", "secondType": "Voador", "BaseTotal": 290, "hp": 80, "atk": 71, "def": 50, "spd": 89, "stage": 3, "nextForm": null},

  {"id": 667, "name": "Litleo", "type": "Fogo", "secondType": "Normal", "BaseTotal": 252, "hp": 62, "atk": 62, "def": 56, "spd": 72, "stage": 1, "nextForm": "Pyroar", "evoTrigger": 8},
  {"id": 668, "name": "Pyroar", "type": "Fogo", "secondType": "Normal", "BaseTotal": 349, "hp": 86, "atk": 88, "def": 69, "spd": 106, "stage": 2, "nextForm": null},

  {"id": 669, "name": "Flabébé", "type": "Fada", "secondType": "", "BaseTotal": 195, "hp": 44, "atk": 50, "def": 59, "spd": 42, "stage": 1, "nextForm": "Floette", "evoTrigger": 5},
  {"id": 670, "name": "Floette", "type": "Fada", "secondType": "", "BaseTotal": 238, "hp": 54, "atk": 60, "def": 72, "spd": 52, "stage": 2, "nextForm": "Florges", "evoTrigger": 10},
  {"id": 671, "name": "Florges", "type": "Fada", "secondType": "", "BaseTotal": 352, "hp": 78, "atk": 88, "def": 111, "spd": 75, "stage": 3, "nextForm": null},

  {"id": 672, "name": "Skiddo", "type": "Grama", "secondType": "", "BaseTotal": 234, "hp": 66, "atk": 64, "def": 52, "spd": 52, "stage": 1, "nextForm": "Gogoat", "evoTrigger": 8},
  {"id": 673, "name": "Gogoat", "type": "Grama", "secondType": "", "BaseTotal": 361, "hp": 123, "atk": 98, "def": 72, "spd": 68, "stage": 2, "nextForm": null},

  {"id": 674, "name": "Pancham", "type": "Lutador", "secondType": "", "BaseTotal": 229, "hp": 67, "atk": 64, "def": 55, "spd": 43, "stage": 1, "nextForm": "Pangoro", "evoTrigger": 8},
  {"id": 675, "name": "Pangoro", "type": "Lutador", "secondType": "Noturno", "BaseTotal": 323, "hp": 95, "atk": 96, "def": 74, "spd": 58, "stage": 2, "nextForm": null},

  {"id": 676, "name": "Furfrou", "type": "Normal", "secondType": "", "BaseTotal": 324, "hp": 75, "atk": 72, "def": 75, "spd": 102, "stage": 1, "nextForm": null},

  {"id": 677, "name": "Espurr", "type": "Psíquico", "secondType": "", "BaseTotal": 243, "hp": 62, "atk": 56, "def": 57, "spd": 68, "stage": 1, "nextForm": "Meowstic", "evoTrigger": 8},
  {"id": 678, "name": "Meowstic", "type": "Psíquico", "secondType": "", "BaseTotal": 322, "hp": 74, "atk": 66, "def": 78, "spd": 104, "stage": 2, "nextForm": null},

  {"id": 679, "name": "Honedge", "type": "Aço", "secondType": "Fantasma", "BaseTotal": 199, "hp": 45, "atk": 58, "def": 68, "spd": 28, "stage": 1, "nextForm": "Doublade", "evoTrigger": 5},
  {"id": 680, "name": "Doublade", "type": "Aço", "secondType": "Fantasma", "BaseTotal": 272, "hp": 59, "atk": 78, "def": 100, "spd": 35, "stage": 2, "nextForm": "Aegislash", "evoTrigger": 10},
  {"id": 681, "name": "Aegislash", "type": "Aço", "secondType": "Fantasma", "BaseTotal": 320, "hp": 60, "atk": 150, "def": 50, "spd": 60, "stage": 3, "nextForm": null},

  {"id": 682, "name": "Spritzee", "type": "Fada", "secondType": "", "BaseTotal": 221, "hp": 78, "atk": 58, "def": 62, "spd": 23, "stage": 1, "nextForm": "Aromatisse", "evoTrigger": 8},
  {"id": 683, "name": "Aromatisse", "type": "Fada", "secondType": "", "BaseTotal": 296, "hp": 101, "atk": 86, "def": 80, "spd": 29, "stage": 2, "nextForm": null},

  {"id": 684, "name": "Swirlix", "type": "Fada", "secondType": "", "BaseTotal": 227, "hp": 62, "atk": 54, "def": 62, "spd": 49, "stage": 1, "nextForm": "Slurpuff", "evoTrigger": 8},
  {"id": 685, "name": "Slurpuff", "type": "Fada", "secondType": "", "BaseTotal": 316, "hp": 82, "atk": 82, "def": 80, "spd": 72, "stage": 2, "nextForm": null},

  {"id": 686, "name": "Inkay", "type": "Noturno", "secondType": "Psíquico", "BaseTotal": 194, "hp": 53, "atk": 46, "def": 50, "spd": 45, "stage": 1, "nextForm": "Malamar", "evoTrigger": 8},
  {"id": 687, "name": "Malamar", "type": "Noturno", "secondType": "Psíquico", "BaseTotal": 321, "hp": 86, "atk": 80, "def": 82, "spd": 73, "stage": 2, "nextForm": null},

  {"id": 688, "name": "Binacle", "type": "Pedra", "secondType": "Água", "BaseTotal": 200, "hp": 42, "atk": 46, "def": 62, "spd": 50, "stage": 1, "nextForm": "Barbaracle", "evoTrigger": 8},
  {"id": 689, "name": "Barbaracle", "type": "Pedra", "secondType": "Água", "BaseTotal": 320, "hp": 72, "atk": 80, "def": 100, "spd": 68, "stage": 2, "nextForm": null},

  {"id": 690, "name": "Skrelp", "type": "Veneno", "secondType": "Água", "BaseTotal": 200, "hp": 50, "atk": 60, "def": 60, "spd": 30, "stage": 1, "nextForm": "Dragalge", "evoTrigger": 8},
  {"id": 691, "name": "Dragalge", "type": "Veneno", "secondType": "Dragão", "BaseTotal": 301, "hp": 65, "atk": 86, "def": 106, "spd": 44, "stage": 2, "nextForm": null},

  {"id": 692, "name": "Clauncher", "type": "Água", "secondType": "", "BaseTotal": 212, "hp": 50, "atk": 56, "def": 62, "spd": 44, "stage": 1, "nextForm": "Clawitzer", "evoTrigger": 8},
  {"id": 693, "name": "Clawitzer", "type": "Água", "secondType": "", "BaseTotal": 314, "hp": 71, "atk": 96, "def": 88, "spd": 59, "stage": 2, "nextForm": null},

  {"id": 694, "name": "Helioptile", "type": "Elétrico", "secondType": "Normal", "BaseTotal": 202, "hp": 44, "atk": 50, "def": 38, "spd": 70, "stage": 1, "nextForm": "Heliolisk", "evoTrigger": 8},
  {"id": 695, "name": "Heliolisk", "type": "Elétrico", "secondType": "Normal", "BaseTotal": 326, "hp": 62, "atk": 82, "def": 73, "spd": 109, "stage": 2, "nextForm": null},

  {"id": 696, "name": "Tyrunt", "type": "Pedra", "secondType": "Dragão", "BaseTotal": 234, "hp": 58, "atk": 67, "def": 61, "spd": 48, "stage": 1, "nextForm": "Tyrantrum", "evoTrigger": 8},
  {"id": 697, "name": "Tyrantrum", "type": "Pedra", "secondType": "Dragão", "BaseTotal": 337, "hp": 82, "atk": 95, "def": 89, "spd": 71, "stage": 2, "nextForm": null},

  {"id": 698, "name": "Amaura", "type": "Pedra", "secondType": "Gelo", "BaseTotal": 242, "hp": 77, "atk": 63, "def": 56, "spd": 46, "stage": 1, "nextForm": "Aurorus", "evoTrigger": 8},
  {"id": 699, "name": "Aurorus", "type": "Pedra", "secondType": "Gelo", "BaseTotal": 351, "hp": 123, "atk": 88, "def": 82, "spd": 58, "stage": 2, "nextForm": null},

  {"id": 700, "name": "Sylveon", "type": "Fada", "secondType": "", "BaseTotal": 341, "hp": 95, "atk": 88, "def": 98, "spd": 60, "stage": 2, "nextForm": null},

  {"id": 701, "name": "Hawlucha", "type": "Lutador", "secondType": "Voador", "BaseTotal": 348, "hp": 78, "atk": 83, "def": 69, "spd": 118, "stage": 1, "nextForm": null},

  {"id": 702, "name": "Dedenne", "type": "Elétrico", "secondType": "Fada", "BaseTotal": 300, "hp": 67, "atk": 70, "def": 62, "spd": 101, "stage": 1, "nextForm": null},

  {"id": 703, "name": "Carbink", "type": "Pedra", "secondType": "Fada", "BaseTotal": 300, "hp": 50, "atk": 50, "def": 150, "spd": 50, "stage": 1, "nextForm": null},

  {"id": 704, "name": "Goomy", "type": "Dragão", "secondType": "", "BaseTotal": 192, "hp": 45, "atk": 52, "def": 55, "spd": 40, "stage": 1, "nextForm": "Sliggoo", "evoTrigger": 5},
  {"id": 705, "name": "Sliggoo", "type": "Dragão", "secondType": "", "BaseTotal": 290, "hp": 68, "atk": 79, "def": 83, "spd": 60, "stage": 2, "nextForm": "Goodra", "evoTrigger": 10},
  {"id": 706, "name": "Goodra", "type": "Dragão", "secondType": "", "BaseTotal": 385, "hp": 90, "atk": 105, "def": 110, "spd": 80, "stage": 3, "nextForm": null},

  {"id": 707, "name": "Klefki", "type": "Aço", "secondType": "Fada", "BaseTotal": 301, "hp": 57, "atk": 80, "def": 89, "spd": 75, "stage": 1, "nextForm": null},

  {"id": 708, "name": "Phantump", "type": "Fantasma", "secondType": "Grama", "BaseTotal": 195, "hp": 43, "atk": 60, "def": 54, "spd": 38, "stage": 1, "nextForm": "Trevenant", "evoTrigger": 8},
  {"id": 709, "name": "Trevenant", "type": "Fantasma", "secondType": "Grama", "BaseTotal": 308, "hp": 85, "atk": 88, "def": 79, "spd": 56, "stage": 2, "nextForm": null},

  {"id": 710, "name": "Pumpkaboo", "type": "Fantasma", "secondType": "Grama", "BaseTotal": 217, "hp": 49, "atk": 55, "def": 62, "spd": 51, "stage": 1, "nextForm": "Gourgeist", "evoTrigger": 8},
  {"id": 711, "name": "Gourgeist", "type": "Fantasma", "secondType": "Grama", "BaseTotal": 321, "hp": 65, "atk": 74, "def": 98, "spd": 84, "stage": 2, "nextForm": null},

  {"id": 712, "name": "Bergmite", "type": "Gelo", "secondType": "", "BaseTotal": 193, "hp": 55, "atk": 50, "def": 60, "spd": 28, "stage": 1, "nextForm": "Avalugg", "evoTrigger": 8},
  {"id": 713, "name": "Avalugg", "type": "Gelo", "secondType": "", "BaseTotal": 318, "hp": 95, "atk": 80, "def": 115, "spd": 28, "stage": 2, "nextForm": null},

  {"id": 714, "name": "Noibat", "type": "Voador", "secondType": "Dragão", "BaseTotal": 171, "hp": 40, "atk": 38, "def": 38, "spd": 55, "stage": 1, "nextForm": "Noivern", "evoTrigger": 8},
  {"id": 715, "name": "Noivern", "type": "Voador", "secondType": "Dragão", "BaseTotal": 372, "hp": 85, "atk": 84, "def": 80, "spd": 123, "stage": 2, "nextForm": null},

  {"id": 716, "name": "Xerneas", "type": "Fada", "secondType": "", "BaseTotal": 452, "hp": 126, "atk": 131, "def": 96, "spd": 99, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 717, "name": "Yveltal", "type": "Noturno", "secondType": "Voador", "BaseTotal": 452, "hp": 126, "atk": 131, "def": 96, "spd": 99, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 718, "name": "Zygarde", "type": "Dragão", "secondType": "Terra", "BaseTotal": 401, "hp": 108, "atk": 90, "def": 108, "spd": 95, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 719, "name": "Diancie", "type": "Pedra", "secondType": "Fada", "BaseTotal": 350, "hp": 50, "atk": 100, "def": 150, "spd": 50, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 720, "name": "Hoopa", "type": "Psíquico", "secondType": "Fantasma", "BaseTotal": 375, "hp": 80, "atk": 130, "def": 95, "spd": 70, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 721, "name": "Volcanion", "type": "Fogo", "secondType": "Água", "BaseTotal": 375, "hp": 80, "atk": 120, "def": 105, "spd": 70, "stage": 1, "nextForm": null, "isLegendary": true},

  // SETIMA GERAÇÃO
  {"id": 722, "name": "Rowlet", "type": "Grama", "secondType": "Voador", "BaseTotal": 214, "hp": 68, "atk": 52, "def": 52, "spd": 42, "stage": 1, "nextForm": "Dartrix", "evoTrigger": 5},
  {"id": 723, "name": "Dartrix", "type": "Grama", "secondType": "Voador", "BaseTotal": 274, "hp": 78, "atk": 72, "def": 72, "spd": 52, "stage": 2, "nextForm": "Decidueye", "evoTrigger": 10},
  {"id": 724, "name": "Decidueye", "type": "Grama", "secondType": "Fantasma", "BaseTotal": 340, "hp": 78, "atk": 104, "def": 88, "spd": 70, "stage": 3, "nextForm": null},

  {"id": 725, "name": "Litten", "type": "Fogo", "secondType": "", "BaseTotal": 217, "hp": 45, "atk": 62, "def": 40, "spd": 70, "stage": 1, "nextForm": "Torracat", "evoTrigger": 5},
  {"id": 726, "name": "Torracat", "type": "Fogo", "secondType": "", "BaseTotal": 287, "hp": 65, "atk": 82, "def": 50, "spd": 90, "stage": 2, "nextForm": "Incineroar", "evoTrigger": 10},
  {"id": 727, "name": "Incineroar", "type": "Fogo", "secondType": "Noturno", "BaseTotal": 343, "hp": 95, "atk": 98, "def": 90, "spd": 60, "stage": 3, "nextForm": null},

  {"id": 728, "name": "Popplio", "type": "Água", "secondType": "", "BaseTotal": 205, "hp": 50, "atk": 60, "def": 55, "spd": 40, "stage": 1, "nextForm": "Brionne", "evoTrigger": 5},
  {"id": 729, "name": "Brionne", "type": "Água", "secondType": "", "BaseTotal": 265, "hp": 60, "atk": 80, "def": 75, "spd": 50, "stage": 2, "nextForm": "Primarina", "evoTrigger": 10},
  {"id": 730, "name": "Primarina", "type": "Água", "secondType": "Fada", "BaseTotal": 335, "hp": 80, "atk": 100, "def": 95, "spd": 60, "stage": 3, "nextForm": null},

  {"id": 731, "name": "Pikipek", "type": "Normal", "secondType": "Voador", "BaseTotal": 182, "hp": 35, "atk": 52, "def": 30, "spd": 65, "stage": 1, "nextForm": "Trumbeak", "evoTrigger": 5},
  {"id": 732, "name": "Trumbeak", "type": "Normal", "secondType": "Voador", "BaseTotal": 242, "hp": 55, "atk": 62, "def": 50, "spd": 75, "stage": 2, "nextForm": "Toucannon", "evoTrigger": 10},
  {"id": 733, "name": "Toucannon", "type": "Normal", "secondType": "Voador", "BaseTotal": 313, "hp": 80, "atk": 98, "def": 75, "spd": 60, "stage": 3, "nextForm": null},

  {"id": 734, "name": "Yungoos", "type": "Normal", "secondType": "", "BaseTotal": 173, "hp": 48, "atk": 50, "def": 30, "spd": 45, "stage": 1, "nextForm": "Gumshoos", "evoTrigger": 8},
  {"id": 735, "name": "Gumshoos", "type": "Normal", "secondType": "", "BaseTotal": 275, "hp": 88, "atk": 82, "def": 60, "spd": 45, "stage": 2, "nextForm": null},

  {"id": 736, "name": "Grubbin", "type": "Inseto", "secondType": "", "BaseTotal": 196, "hp": 47, "atk": 58, "def": 45, "spd": 46, "stage": 1, "nextForm": "Charjabug", "evoTrigger": 5},
  {"id": 737, "name": "Charjabug", "type": "Inseto", "secondType": "Elétrico", "BaseTotal": 246, "hp": 57, "atk": 68, "def": 85, "spd": 36, "stage": 2, "nextForm": "Vikavolt", "evoTrigger": 10},
  {"id": 738, "name": "Vikavolt", "type": "Inseto", "secondType": "Elétrico", "BaseTotal": 310, "hp": 77, "atk": 108, "def": 82, "spd": 43, "stage": 3, "nextForm": null},

  {"id": 739, "name": "Crabrawler", "type": "Lutador", "secondType": "", "BaseTotal": 224, "hp": 47, "atk": 62, "def": 52, "spd": 63, "stage": 1, "nextForm": "Crabominable", "evoTrigger": 8},
  {"id": 740, "name": "Crabominable", "type": "Lutador", "secondType": "Gelo", "BaseTotal": 309, "hp": 97, "atk": 97, "def": 72, "spd": 43, "stage": 2, "nextForm": null},

  {"id": 741, "name": "Oricorio", "type": "Fogo", "secondType": "Voador", "BaseTotal": 322, "hp": 75, "atk": 84, "def": 70, "spd": 93, "stage": 1, "nextForm": null},

  {"id": 742, "name": "Cutiefly", "type": "Inseto", "secondType": "Fada", "BaseTotal": 214, "hp": 40, "atk": 50, "def": 40, "spd": 84, "stage": 1, "nextForm": "Ribombee", "evoTrigger": 8},
  {"id": 743, "name": "Ribombee", "type": "Inseto", "secondType": "Fada", "BaseTotal": 324, "hp": 60, "atk": 75, "def": 65, "spd": 124, "stage": 2, "nextForm": null},

  {"id": 744, "name": "Rockruff", "type": "Pedra", "secondType": "", "BaseTotal": 193, "hp": 45, "atk": 48, "def": 40, "spd": 60, "stage": 1, "nextForm": "Lycanroc", "evoTrigger": 8},
  {"id": 745, "name": "Lycanroc", "type": "Pedra", "secondType": "", "BaseTotal": 337, "hp": 75, "atk": 85, "def": 65, "spd": 112, "stage": 2, "nextForm": null},

  {"id": 746, "name": "Wishiwashi", "type": "Água", "secondType": "", "BaseTotal": 129, "hp": 45, "atk": 22, "def": 22, "spd": 40, "stage": 1, "nextForm": null},

  {"id": 747, "name": "Mareanie", "type": "Veneno", "secondType": "Água", "BaseTotal": 200, "hp": 50, "atk": 48, "def": 57, "spd": 45, "stage": 1, "nextForm": "Toxapex", "evoTrigger": 8},
  {"id": 748, "name": "Toxapex", "type": "Veneno", "secondType": "Água", "BaseTotal": 290, "hp": 50, "atk": 58, "def": 147, "spd": 35, "stage": 2, "nextForm": null},

  {"id": 749, "name": "Mudbray", "type": "Terra", "secondType": "", "BaseTotal": 249, "hp": 70, "atk": 72, "def": 62, "spd": 45, "stage": 1, "nextForm": "Mudsdale", "evoTrigger": 8},
  {"id": 750, "name": "Mudsdale", "type": "Terra", "secondType": "", "BaseTotal": 317, "hp": 100, "atk": 90, "def": 92, "spd": 35, "stage": 2, "nextForm": null},

  {"id": 751, "name": "Dewpider", "type": "Água", "secondType": "Inseto", "BaseTotal": 167, "hp": 38, "atk": 40, "def": 62, "spd": 27, "stage": 1, "nextForm": "Araquanid", "evoTrigger": 8},
  {"id": 752, "name": "Araquanid", "type": "Água", "secondType": "Inseto", "BaseTotal": 282, "hp": 68, "atk": 60, "def": 112, "spd": 42, "stage": 2, "nextForm": null},

  {"id": 753, "name": "Fomantis", "type": "Grama", "secondType": "", "BaseTotal": 162, "hp": 40, "atk": 52, "def": 35, "spd": 35, "stage": 1, "nextForm": "Lurantis", "evoTrigger": 8},
  {"id": 754, "name": "Lurantis", "type": "Grama", "secondType": "", "BaseTotal": 297, "hp": 70, "atk": 92, "def": 90, "spd": 45, "stage": 2, "nextForm": null},

  {"id": 755, "name": "Morelull", "type": "Grama", "secondType": "Fada", "BaseTotal": 170, "hp": 40, "atk": 50, "def": 65, "spd": 15, "stage": 1, "nextForm": "Shiinotic", "evoTrigger": 8},
  {"id": 756, "name": "Shiinotic", "type": "Grama", "secondType": "Fada", "BaseTotal": 248, "hp": 60, "atk": 68, "def": 90, "spd": 30, "stage": 2, "nextForm": null},

  {"id": 757, "name": "Salandit", "type": "Veneno", "secondType": "Fogo", "BaseTotal": 223, "hp": 48, "atk": 58, "def": 40, "spd": 77, "stage": 1, "nextForm": "Salazzle", "evoTrigger": 8},
  {"id": 758, "name": "Salazzle", "type": "Veneno", "secondType": "Fogo", "BaseTotal": 333, "hp": 68, "atk": 88, "def": 60, "spd": 117, "stage": 2, "nextForm": null},

  {"id": 759, "name": "Stufful", "type": "Normal", "secondType": "Lutador", "BaseTotal": 230, "hp": 70, "atk": 60, "def": 50, "spd": 50, "stage": 1, "nextForm": "Bewear", "evoTrigger": 8},
  {"id": 760, "name": "Bewear", "type": "Normal", "secondType": "Lutador", "BaseTotal": 340, "hp": 120, "atk": 90, "def": 70, "spd": 60, "stage": 2, "nextForm": null},

  {"id": 761, "name": "Bounsweet", "type": "Grama", "secondType": "", "BaseTotal": 142, "hp": 42, "atk": 30, "def": 38, "spd": 32, "stage": 1, "nextForm": "Steenee", "evoTrigger": 5},
  {"id": 762, "name": "Steenee", "type": "Grama", "secondType": "", "BaseTotal": 202, "hp": 52, "atk": 40, "def": 48, "spd": 62, "stage": 2, "nextForm": "Tsareena", "evoTrigger": 10},
  {"id": 763, "name": "Tsareena", "type": "Grama", "secondType": "", "BaseTotal": 327, "hp": 72, "atk": 85, "def": 98, "spd": 72, "stage": 3, "nextForm": null},

  {"id": 764, "name": "Comfey", "type": "Fada", "secondType": "", "BaseTotal": 318, "hp": 51, "atk": 67, "def": 100, "spd": 100, "stage": 1, "nextForm": null},

  {"id": 765, "name": "Oranguru", "type": "Normal", "secondType": "Psíquico", "BaseTotal": 320, "hp": 90, "atk": 75, "def": 95, "spd": 60, "stage": 1, "nextForm": null},

  {"id": 766, "name": "Passimian", "type": "Lutador", "secondType": "", "BaseTotal": 335, "hp": 100, "atk": 80, "def": 75, "spd": 80, "stage": 1, "nextForm": null},

  {"id": 767, "name": "Wimpod", "type": "Inseto", "secondType": "Água", "BaseTotal": 168, "hp": 25, "atk": 28, "def": 35, "spd": 80, "stage": 1, "nextForm": "Golisopod", "evoTrigger": 8},
  {"id": 768, "name": "Golisopod", "type": "Inseto", "secondType": "Água", "BaseTotal": 322, "hp": 75, "atk": 92, "def": 115, "spd": 40, "stage": 2, "nextForm": null},

  {"id": 769, "name": "Sandygast", "type": "Fantasma", "secondType": "Terra", "BaseTotal": 194, "hp": 55, "atk": 62, "def": 62, "spd": 15, "stage": 1, "nextForm": "Palossand", "evoTrigger": 8},
  {"id": 770, "name": "Palossand", "type": "Fantasma", "secondType": "Terra", "BaseTotal": 300, "hp": 85, "atk": 88, "def": 92, "spd": 35, "stage": 2, "nextForm": null},

  {"id": 771, "name": "Pyukumuku", "type": "Água", "secondType": "", "BaseTotal": 235, "hp": 55, "atk": 45, "def": 130, "spd": 5, "stage": 1, "nextForm": null},

  {"id": 772, "name": "Type: Null", "type": "Normal", "secondType": "", "BaseTotal": 344, "hp": 95, "atk": 95, "def": 95, "spd": 59, "stage": 1, "nextForm": "Silvally", "evoTrigger": 8},
  {"id": 773, "name": "Silvally", "type": "Normal", "secondType": "", "BaseTotal": 380, "hp": 95, "atk": 95, "def": 95, "spd": 95, "stage": 2, "nextForm": null},

  {"id": 774, "name": "Minior", "type": "Pedra", "secondType": "Voador", "BaseTotal": 280, "hp": 60, "atk": 60, "def": 100, "spd": 60, "stage": 1, "nextForm": null},

  {"id": 775, "name": "Komala", "type": "Normal", "secondType": "", "BaseTotal": 305, "hp": 65, "atk": 95, "def": 80, "spd": 65, "stage": 1, "nextForm": null},

  {"id": 776, "name": "Turtonator", "type": "Fogo", "secondType": "Dragão", "BaseTotal": 290, "hp": 60, "atk": 84, "def": 110, "spd": 36, "stage": 1, "nextForm": null},

  {"id": 777, "name": "Togedemaru", "type": "Elétrico", "secondType": "Aço", "BaseTotal": 298, "hp": 65, "atk": 69, "def": 68, "spd": 96, "stage": 1, "nextForm": null},

  {"id": 778, "name": "Mimikyu", "type": "Fantasma", "secondType": "Fada", "BaseTotal": 313, "hp": 55, "atk": 70, "def": 92, "spd": 96, "stage": 1, "nextForm": null},

  {"id": 779, "name": "Bruxish", "type": "Água", "secondType": "Psíquico", "BaseTotal": 318, "hp": 68, "atk": 88, "def": 70, "spd": 92, "stage": 1, "nextForm": null},

  {"id": 780, "name": "Drampa", "type": "Normal", "secondType": "Dragão", "BaseTotal": 300, "hp": 78, "atk": 98, "def": 88, "spd": 36, "stage": 1, "nextForm": null},

  {"id": 781, "name": "Dhelmise", "type": "Fantasma", "secondType": "Grama", "BaseTotal": 313, "hp": 70, "atk": 108, "def": 95, "spd": 40, "stage": 1, "nextForm": null},

  {"id": 782, "name": "Jangmo-o", "type": "Dragão", "secondType": "", "BaseTotal": 195, "hp": 45, "atk": 50, "def": 55, "spd": 45, "stage": 1, "nextForm": "Hakamo-o", "evoTrigger": 5},
  {"id": 783, "name": "Hakamo-o", "type": "Dragão", "secondType": "Lutador", "BaseTotal": 270, "hp": 55, "atk": 70, "def": 80, "spd": 65, "stage": 2, "nextForm": "Kommo-o", "evoTrigger": 10},
  {"id": 784, "name": "Kommo-o", "type": "Dragão", "secondType": "Lutador", "BaseTotal": 380, "hp": 75, "atk": 105, "def": 115, "spd": 85, "stage": 3, "nextForm": null},

  {"id": 785, "name": "Tapu Koko", "type": "Elétrico", "secondType": "Fada", "BaseTotal": 385, "hp": 70, "atk": 105, "def": 80, "spd": 130, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 786, "name": "Tapu Lele", "type": "Psíquico", "secondType": "Fada", "BaseTotal": 368, "hp": 70, "atk": 108, "def": 95, "spd": 95, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 787, "name": "Tapu Bulu", "type": "Grama", "secondType": "Fada", "BaseTotal": 358, "hp": 70, "atk": 108, "def": 105, "spd": 75, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 788, "name": "Tapu Fini", "type": "Água", "secondType": "Fada", "BaseTotal": 362, "hp": 70, "atk": 85, "def": 122, "spd": 85, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 789, "name": "Cosmog", "type": "Psíquico", "secondType": "", "BaseTotal": 140, "hp": 43, "atk": 29, "def": 31, "spd": 37, "stage": 1, "nextForm": "Cosmoem", "evoTrigger": 5, "isLegendary": true},
  {"id": 790, "name": "Cosmoem", "type": "Psíquico", "secondType": "", "BaseTotal": 240, "hp": 43, "atk": 29, "def": 131, "spd": 37, "stage": 2, "nextForm": "Solgaleo", "evoTrigger": 10, "isLegendary": true},
  {"id": 791, "name": "Solgaleo", "type": "Psíquico", "secondType": "Aço", "BaseTotal": 457, "hp": 137, "atk": 125, "def": 98, "spd": 97, "stage": 3, "nextForm": null, "isLegendary": true},
  {"id": 792, "name": "Lunala", "type": "Psíquico", "secondType": "Fantasma", "BaseTotal": 457, "hp": 137, "atk": 125, "def": 98, "spd": 97, "stage": 3, "nextForm": null, "isLegendary": true},

  {"id": 793, "name": "Nihilego", "type": "Pedra", "secondType": "Veneno", "BaseTotal": 391, "hp": 109, "atk": 90, "def": 89, "spd": 103, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 794, "name": "Buzzwole", "type": "Inseto", "secondType": "Lutador", "BaseTotal": 378, "hp": 107, "atk": 96, "def": 96, "spd": 79, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 795, "name": "Pheromosa", "type": "Inseto", "secondType": "Lutador", "BaseTotal": 396, "hp": 71, "atk": 137, "def": 37, "spd": 151, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 796, "name": "Xurkitree", "type": "Elétrico", "secondType": "", "BaseTotal": 368, "hp": 83, "atk": 131, "def": 71, "spd": 83, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 797, "name": "Celesteela", "type": "Aço", "secondType": "Voador", "BaseTotal": 364, "hp": 97, "atk": 104, "def": 102, "spd": 61, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 798, "name": "Kartana", "type": "Grama", "secondType": "Aço", "BaseTotal": 369, "hp": 59, "atk": 120, "def": 81, "spd": 109, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 799, "name": "Guzzlord", "type": "Noturno", "secondType": "Dragão", "BaseTotal": 418, "hp": 223, "atk": 99, "def": 53, "spd": 43, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 800, "name": "Necrozma", "type": "Psíquico", "secondType": "", "BaseTotal": 388, "hp": 97, "atk": 117, "def": 95, "spd": 79, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 801, "name": "Magearna", "type": "Aço", "secondType": "Fada", "BaseTotal": 372, "hp": 80, "atk": 112, "def": 115, "spd": 65, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 802, "name": "Marshadow", "type": "Lutador", "secondType": "Fantasma", "BaseTotal": 408, "hp": 90, "atk": 108, "def": 85, "spd": 125, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 803, "name": "Poipole", "type": "Veneno", "secondType": "", "BaseTotal": 280, "hp": 67, "atk": 73, "def": 67, "spd": 73, "stage": 1, "nextForm": "Naganadel", "evoTrigger": 8},
  {"id": 804, "name": "Naganadel", "type": "Veneno", "secondType": "Dragão", "BaseTotal": 367, "hp": 73, "atk": 100, "def": 73, "spd": 121, "stage": 2, "nextForm": null},

  {"id": 805, "name": "Stakataka", "type": "Pedra", "secondType": "Aço", "BaseTotal": 322, "hp": 61, "atk": 92, "def": 156, "spd": 13, "stage": 1, "nextForm": null},

  {"id": 806, "name": "Blacephalon", "type": "Fogo", "secondType": "Fantasma", "BaseTotal": 365, "hp": 53, "atk": 139, "def": 66, "spd": 107, "stage": 1, "nextForm": null},

  {"id": 807, "name": "Zeraora", "type": "Elétrico", "secondType": "", "BaseTotal": 416, "hp": 88, "atk": 107, "def": 78, "spd": 143, "stage": 1, "nextForm": null, "isLegendary": true},

  // Oitava geração
  {"id": 810, "name": "Grookey", "type": "Grama", "secondType": "", "BaseTotal": 212, "hp": 50, "atk": 52, "def": 45, "spd": 65, "stage": 1, "nextForm": "Thwackey", "evoTrigger": 5},
  {"id": 811, "name": "Thwackey", "type": "Grama", "secondType": "", "BaseTotal": 285, "hp": 70, "atk": 70, "def": 65, "spd": 80, "stage": 2, "nextForm": "Rillaboom", "evoTrigger": 10},
  {"id": 812, "name": "Rillaboom", "type": "Grama", "secondType": "", "BaseTotal": 357, "hp": 100, "atk": 92, "def": 80, "spd": 85, "stage": 3, "nextForm": null},

  {"id": 813, "name": "Scorbunny", "type": "Fogo", "secondType": "", "BaseTotal": 215, "hp": 50, "atk": 56, "def": 40, "spd": 69, "stage": 1, "nextForm": "Raboot", "evoTrigger": 5},
  {"id": 814, "name": "Raboot", "type": "Fogo", "secondType": "", "BaseTotal": 289, "hp": 65, "atk": 70, "def": 60, "spd": 94, "stage": 2, "nextForm": "Cinderace", "evoTrigger": 10},
  {"id": 815, "name": "Cinderace", "type": "Fogo", "secondType": "", "BaseTotal": 364, "hp": 80, "atk": 90, "def": 75, "spd": 119, "stage": 3, "nextForm": null},

  {"id": 816, "name": "Sobble", "type": "Água", "secondType": "", "BaseTotal": 215, "hp": 50, "atk": 55, "def": 40, "spd": 70, "stage": 1, "nextForm": "Drizzile", "evoTrigger": 5},
  {"id": 817, "name": "Drizzile", "type": "Água", "secondType": "", "BaseTotal": 288, "hp": 65, "atk": 78, "def": 55, "spd": 90, "stage": 2, "nextForm": "Inteleon", "evoTrigger": 10},
  {"id": 818, "name": "Inteleon", "type": "Água", "secondType": "", "BaseTotal": 360, "hp": 70, "atk": 105, "def": 65, "spd": 120, "stage": 3, "nextForm": null},

  {"id": 819, "name": "Skwovet", "type": "Normal", "secondType": "", "BaseTotal": 185, "hp": 70, "atk": 45, "def": 45, "spd": 25, "stage": 1, "nextForm": "Greedent", "evoTrigger": 8},
  {"id": 820, "name": "Greedent", "type": "Normal", "secondType": "", "BaseTotal": 300, "hp": 120, "atk": 75, "def": 85, "spd": 20, "stage": 2, "nextForm": null},

  {"id": 821, "name": "Rookidee", "type": "Voador", "secondType": "", "BaseTotal": 170, "hp": 38, "atk": 40, "def": 35, "spd": 57, "stage": 1, "nextForm": "Corvisquire", "evoTrigger": 5},
  {"id": 822, "name": "Corvisquire", "type": "Voador", "secondType": "", "BaseTotal": 255, "hp": 68, "atk": 55, "def": 55, "spd": 77, "stage": 2, "nextForm": "Corviknight", "evoTrigger": 10},
  {"id": 823, "name": "Corviknight", "type": "Voador", "secondType": "Aço", "BaseTotal": 330, "hp": 98, "atk": 70, "def": 95, "spd": 67, "stage": 3, "nextForm": null},

  {"id": 824, "name": "Blipbug", "type": "Inseto", "secondType": "", "BaseTotal": 124, "hp": 25, "atk": 22, "def": 32, "spd": 45, "stage": 1, "nextForm": "Dottler", "evoTrigger": 5},
  {"id": 825, "name": "Dottler", "type": "Inseto", "secondType": "Psíquico", "BaseTotal": 207, "hp": 50, "atk": 42, "def": 85, "spd": 30, "stage": 2, "nextForm": "Orbeetle", "evoTrigger": 10},
  {"id": 826, "name": "Orbeetle", "type": "Inseto", "secondType": "Psíquico", "BaseTotal": 327, "hp": 60, "atk": 62, "def": 115, "spd": 90, "stage": 3, "nextForm": null},

  {"id": 827, "name": "Nickit", "type": "Noturno", "secondType": "", "BaseTotal": 168, "hp": 40, "atk": 38, "def": 40, "spd": 50, "stage": 1, "nextForm": "Thievul", "evoTrigger": 8},
  {"id": 828, "name": "Thievul", "type": "Noturno", "secondType": "", "BaseTotal": 307, "hp": 70, "atk": 72, "def": 75, "spd": 90, "stage": 2, "nextForm": null},

  {"id": 829, "name": "Gossifleur", "type": "Grama", "secondType": "", "BaseTotal": 150, "hp": 40, "atk": 40, "def": 60, "spd": 10, "stage": 1, "nextForm": "Eldegoss", "evoTrigger": 8},
  {"id": 830, "name": "Eldegoss", "type": "Grama", "secondType": "", "BaseTotal": 290, "hp": 60, "atk": 65, "def": 105, "spd": 60, "stage": 2, "nextForm": null},

  {"id": 831, "name": "Wooloo", "type": "Normal", "secondType": "", "BaseTotal": 180, "hp": 42, "atk": 40, "def": 50, "spd": 48, "stage": 1, "nextForm": "Dubwool", "evoTrigger": 8},
  {"id": 832, "name": "Dubwool", "type": "Normal", "secondType": "", "BaseTotal": 325, "hp": 72, "atk": 70, "def": 95, "spd": 88, "stage": 2, "nextForm": null},

  {"id": 833, "name": "Chewtle", "type": "Água", "secondType": "", "BaseTotal": 189, "hp": 50, "atk": 51, "def": 44, "spd": 44, "stage": 1, "nextForm": "Drednaw", "evoTrigger": 8},
  {"id": 834, "name": "Drednaw", "type": "Água", "secondType": "Pedra", "BaseTotal": 325, "hp": 90, "atk": 82, "def": 79, "spd": 74, "stage": 2, "nextForm": null},

  {"id": 835, "name": "Yamper", "type": "Elétrico", "secondType": "", "BaseTotal": 177, "hp": 59, "atk": 42, "def": 50, "spd": 26, "stage": 1, "nextForm": "Boltund", "evoTrigger": 8},
  {"id": 836, "name": "Boltund", "type": "Elétrico", "secondType": "", "BaseTotal": 340, "hp": 69, "atk": 90, "def": 60, "spd": 121, "stage": 2, "nextForm": null},

  {"id": 837, "name": "Rolycoly", "type": "Pedra", "secondType": "", "BaseTotal": 150, "hp": 30, "atk": 40, "def": 50, "spd": 30, "stage": 1, "nextForm": "Carkol", "evoTrigger": 5},
  {"id": 838, "name": "Carkol", "type": "Pedra", "secondType": "Fogo", "BaseTotal": 270, "hp": 80, "atk": 60, "def": 80, "spd": 50, "stage": 2, "nextForm": "Coalossal", "evoTrigger": 10},
  {"id": 839, "name": "Coalossal", "type": "Pedra", "secondType": "Fogo", "BaseTotal": 325, "hp": 110, "atk": 80, "def": 105, "spd": 30, "stage": 3, "nextForm": null},

  {"id": 840, "name": "Applin", "type": "Grama", "secondType": "Dragão", "BaseTotal": 160, "hp": 40, "atk": 40, "def": 60, "spd": 20, "stage": 1, "nextForm": null},

  {"id": 841, "name": "Flapple", "type": "Grama", "secondType": "Dragão", "BaseTotal": 312, "hp": 70, "atk": 102, "def": 70, "spd": 70, "stage": 2, "nextForm": null},

  {"id": 842, "name": "Appletun", "type": "Grama", "secondType": "Dragão", "BaseTotal": 312, "hp": 110, "atk": 92, "def": 80, "spd": 30, "stage": 2, "nextForm": null},

  {"id": 843, "name": "Silicobra", "type": "Terra", "secondType": "", "BaseTotal": 206, "hp": 52, "atk": 46, "def": 62, "spd": 46, "stage": 1, "nextForm": "Sandaconda", "evoTrigger": 8},
  {"id": 844, "name": "Sandaconda", "type": "Terra", "secondType": "", "BaseTotal": 327, "hp": 72, "atk": 86, "def": 98, "spd": 71, "stage": 2, "nextForm": null},

  {"id": 845, "name": "Cramorant", "type": "Voador", "secondType": "Água", "BaseTotal": 315, "hp": 70, "atk": 85, "def": 75, "spd": 85, "stage": 1, "nextForm": null},

  {"id": 846, "name": "Arrokuda", "type": "Água", "secondType": "", "BaseTotal": 194, "hp": 41, "atk": 52, "def": 35, "spd": 66, "stage": 1, "nextForm": "Barraskewda", "evoTrigger": 8},
  {"id": 847, "name": "Barraskewda", "type": "Água", "secondType": "", "BaseTotal": 344, "hp": 61, "atk": 92, "def": 55, "spd": 136, "stage": 2, "nextForm": null},

  {"id": 848, "name": "Toxel", "type": "Elétrico", "secondType": "Veneno", "BaseTotal": 161, "hp": 40, "atk": 46, "def": 35, "spd": 40, "stage": 1, "nextForm": "Toxtricity", "evoTrigger": 8},
  {"id": 849, "name": "Toxtricity", "type": "Elétrico", "secondType": "Veneno", "BaseTotal": 326, "hp": 75, "atk": 106, "def": 70, "spd": 75, "stage": 2, "nextForm": null},

  {"id": 850, "name": "Sizzlipede", "type": "Fogo", "secondType": "Inseto", "BaseTotal": 201, "hp": 50, "atk": 58, "def": 48, "spd": 45, "stage": 1, "nextForm": "Centiskorch", "evoTrigger": 8},
  {"id": 851, "name": "Centiskorch", "type": "Fogo", "secondType": "Inseto", "BaseTotal": 345, "hp": 100, "atk": 102, "def": 78, "spd": 65, "stage": 2, "nextForm": null},

  {"id": 852, "name": "Clobbopus", "type": "Lutador", "secondType": "", "BaseTotal": 196, "hp": 50, "atk": 59, "def": 55, "spd": 32, "stage": 1, "nextForm": "Grapploct", "evoTrigger": 8},
  {"id": 853, "name": "Grapploct", "type": "Lutador", "secondType": "", "BaseTotal": 301, "hp": 80, "atk": 94, "def": 85, "spd": 42, "stage": 2, "nextForm": null},

  {"id": 854, "name": "Sinistea", "type": "Fantasma", "secondType": "", "BaseTotal": 200, "hp": 40, "atk": 60, "def": 50, "spd": 50, "stage": 1, "nextForm": "Polteageist", "evoTrigger": 8},
  {"id": 855, "name": "Polteageist", "type": "Fantasma", "secondType": "", "BaseTotal": 320, "hp": 60, "atk": 100, "def": 90, "spd": 70, "stage": 2, "nextForm": null},

  {"id": 856, "name": "Hatenna", "type": "Psíquico", "secondType": "", "BaseTotal": 173, "hp": 42, "atk": 43, "def": 49, "spd": 39, "stage": 1, "nextForm": "Hattrem", "evoTrigger": 5},
  {"id": 857, "name": "Hattrem", "type": "Psíquico", "secondType": "", "BaseTotal": 238, "hp": 57, "atk": 63, "def": 69, "spd": 49, "stage": 2, "nextForm": "Hatterene", "evoTrigger": 10},
  {"id": 858, "name": "Hatterene", "type": "Psíquico", "secondType": "Fada", "BaseTotal": 298, "hp": 57, "atk": 113, "def": 99, "spd": 29, "stage": 3, "nextForm": null},

  {"id": 859, "name": "Impidimp", "type": "Noturno", "secondType": "Fada", "BaseTotal": 187, "hp": 45, "atk": 50, "def": 42, "spd": 50, "stage": 1, "nextForm": "Morgrem", "evoTrigger": 5},
  {"id": 860, "name": "Morgrem", "type": "Noturno", "secondType": "Fada", "BaseTotal": 261, "hp": 65, "atk": 68, "def": 58, "spd": 70, "stage": 2, "nextForm": "Grimmsnarl", "evoTrigger": 10},
  {"id": 861, "name": "Grimmsnarl", "type": "Noturno", "secondType": "Fada", "BaseTotal": 333, "hp": 95, "atk": 108, "def": 70, "spd": 60, "stage": 3, "nextForm": null},

  {"id": 862, "name": "Obstagoon", "type": "Noturno", "secondType": "Normal", "BaseTotal": 354, "hp": 93, "atk": 75, "def": 91, "spd": 95, "stage": 3, "nextForm": null},

  {"id": 863, "name": "Perrserker", "type": "Aço", "secondType": "", "BaseTotal": 280, "hp": 70, "atk": 80, "def": 80, "spd": 50, "stage": 2, "nextForm": null},

  {"id": 864, "name": "Cursola", "type": "Fantasma", "secondType": "", "BaseTotal": 300, "hp": 60, "atk": 120, "def": 90, "spd": 30, "stage": 1, "nextForm": null},

  {"id": 865, "name": "Sirfetch'd", "type": "Lutador", "secondType": "", "BaseTotal": 317, "hp": 62, "atk": 102, "def": 88, "spd": 65, "stage": 2, "nextForm": null},

  {"id": 866, "name": "Mr. Rime", "type": "Gelo", "secondType": "Psíquico", "BaseTotal": 336, "hp": 80, "atk": 98, "def": 88, "spd": 70, "stage": 3, "nextForm": null},

  {"id": 867, "name": "Runerigus", "type": "Terra", "secondType": "Fantasma", "BaseTotal": 285, "hp": 58, "atk": 72, "def": 125, "spd": 30, "stage": 2, "nextForm": null},

  {"id": 868, "name": "Milcery", "type": "Fada", "secondType": "", "BaseTotal": 174, "hp": 45, "atk": 45, "def": 50, "spd": 34, "stage": 1, "nextForm": "Alcremie", "evoTrigger": 8},
  {"id": 869, "name": "Alcremie", "type": "Fada", "secondType": "", "BaseTotal": 312, "hp": 65, "atk": 85, "def": 98, "spd": 64, "stage": 2, "nextForm": null},

  {"id": 870, "name": "Falinks", "type": "Lutador", "secondType": "", "BaseTotal": 305, "hp": 65, "atk": 85, "def": 80, "spd": 75, "stage": 1, "nextForm": null},

  {"id": 871, "name": "Pincurchin", "type": "Elétrico", "secondType": "", "BaseTotal": 249, "hp": 48, "atk": 96, "def": 90, "spd": 15, "stage": 1, "nextForm": null},

  {"id": 872, "name": "Snom", "type": "Gelo", "secondType": "Inseto", "BaseTotal": 117, "hp": 30, "atk": 35, "def": 32, "spd": 20, "stage": 1, "nextForm": "Frosmoth", "evoTrigger": 8},
  {"id": 873, "name": "Frosmoth", "type": "Gelo", "secondType": "Inseto", "BaseTotal": 305, "hp": 70, "atk": 95, "def": 75, "spd": 65, "stage": 2, "nextForm": null},

  {"id": 874, "name": "Stonjourner", "type": "Pedra", "secondType": "", "BaseTotal": 320, "hp": 100, "atk": 72, "def": 78, "spd": 70, "stage": 1, "nextForm": null},

  {"id": 875, "name": "Eiscue", "type": "Gelo", "secondType": "", "BaseTotal": 297, "hp": 75, "atk": 72, "def": 100, "spd": 50, "stage": 1, "nextForm": null},

  {"id": 876, "name": "Indeedee", "type": "Psíquico", "secondType": "Normal", "BaseTotal": 315, "hp": 60, "atk": 85, "def": 75, "spd": 95, "stage": 1, "nextForm": null},

  {"id": 877, "name": "Morpeko", "type": "Elétrico", "secondType": "Noturno", "BaseTotal": 295, "hp": 58, "atk": 82, "def": 58, "spd": 97, "stage": 1, "nextForm": null},

  {"id": 878, "name": "Cufant", "type": "Aço", "secondType": "", "BaseTotal": 221, "hp": 72, "atk": 60, "def": 49, "spd": 40, "stage": 1, "nextForm": "Copperajah", "evoTrigger": 8},
  {"id": 879, "name": "Copperajah", "type": "Aço", "secondType": "", "BaseTotal": 326, "hp": 122, "atk": 105, "def": 69, "spd": 30, "stage": 2, "nextForm": null},

  {"id": 880, "name": "Dracozolt", "type": "Elétrico", "secondType": "Dragão", "BaseTotal": 335, "hp": 90, "atk": 90, "def": 80, "spd": 75, "stage": 1, "nextForm": null},

  {"id": 881, "name": "Arctozolt", "type": "Elétrico", "secondType": "Gelo", "BaseTotal": 325, "hp": 90, "atk": 95, "def": 85, "spd": 55, "stage": 1, "nextForm": null},

  {"id": 882, "name": "Dracovish", "type": "Água", "secondType": "Dragão", "BaseTotal": 335, "hp": 90, "atk": 80, "def": 90, "spd": 75, "stage": 1, "nextForm": null},

  {"id": 883, "name": "Arctovish", "type": "Água", "secondType": "Gelo", "BaseTotal": 325, "hp": 90, "atk": 85, "def": 95, "spd": 55, "stage": 1, "nextForm": null},

  {"id": 884, "name": "Duraludon", "type": "Aço", "secondType": "Dragão", "BaseTotal": 345, "hp": 70, "atk": 108, "def": 82, "spd": 85, "stage": 1, "nextForm": null},

  {"id": 885, "name": "Dreepy", "type": "Dragão", "secondType": "Fantasma", "BaseTotal": 190, "hp": 28, "atk": 50, "def": 30, "spd": 82, "stage": 1, "nextForm": "Drakloak", "evoTrigger": 5},
  {"id": 886, "name": "Drakloak", "type": "Dragão", "secondType": "Fantasma", "BaseTotal": 290, "hp": 68, "atk": 70, "def": 50, "spd": 102, "stage": 2, "nextForm": "Dragapult", "evoTrigger": 10},
  {"id": 887, "name": "Dragapult", "type": "Dragão", "secondType": "Fantasma", "BaseTotal": 415, "hp": 88, "atk": 110, "def": 75, "spd": 142, "stage": 3, "nextForm": null},

  {"id": 888, "name": "Zacian", "type": "Fada", "secondType": "", "BaseTotal": 450, "hp": 92, "atk": 105, "def": 115, "spd": 138, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 889, "name": "Zamazenta", "type": "Lutador", "secondType": "", "BaseTotal": 450, "hp": 92, "atk": 105, "def": 115, "spd": 138, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 890, "name": "Eternatus", "type": "Veneno", "secondType": "Dragão", "BaseTotal": 480, "hp": 140, "atk": 115, "def": 95, "spd": 130, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 891, "name": "Kubfu", "type": "Lutador", "secondType": "", "BaseTotal": 259, "hp": 60, "atk": 72, "def": 55, "spd": 72, "stage": 1, "nextForm": "Urshifu", "evoTrigger": 8, "isLegendary": true},
  {"id": 892, "name": "Urshifu", "type": "Lutador", "secondType": "Noturno", "BaseTotal": 373, "hp": 100, "atk": 96, "def": 80, "spd": 97, "stage": 2, "nextForm": null, "isLegendary": true},

  {"id": 893, "name": "Zarude", "type": "Noturno", "secondType": "Grama", "BaseTotal": 405, "hp": 105, "atk": 95, "def": 100, "spd": 105, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 894, "name": "Regieleki", "type": "Elétrico", "secondType": "", "BaseTotal": 430, "hp": 80, "atk": 100, "def": 50, "spd": 200, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 895, "name": "Regidrago", "type": "Dragão", "secondType": "", "BaseTotal": 430, "hp": 200, "atk": 100, "def": 50, "spd": 80, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 896, "name": "Glastrier", "type": "Gelo", "secondType": "", "BaseTotal": 355, "hp": 100, "atk": 105, "def": 120, "spd": 30, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 897, "name": "Spectrier", "type": "Fantasma", "secondType": "", "BaseTotal": 405, "hp": 100, "atk": 105, "def": 70, "spd": 130, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 898, "name": "Calyrex", "type": "Psíquico", "secondType": "Grama", "BaseTotal": 340, "hp": 100, "atk": 80, "def": 80, "spd": 80, "stage": 1, "nextForm": null, "isLegendary": true},

  // NONA GERAÇÃO
  {"id": 906, "name": "Sprigatito", "type": "Grama", "secondType": "", "BaseTotal": 208, "hp": 40, "atk": 53, "def": 50, "spd": 65, "stage": 1, "nextForm": "Floragato", "evoTrigger": 5},
  {"id": 907, "name": "Floragato", "type": "Grama", "secondType": "", "BaseTotal": 277, "hp": 61, "atk": 70, "def": 63, "spd": 83, "stage": 2, "nextForm": "Meowscarada", "evoTrigger": 10},
  {"id": 908, "name": "Meowscarada", "type": "Grama", "secondType": "Noturno", "BaseTotal": 365, "hp": 76, "atk": 96, "def": 70, "spd": 123, "stage": 3, "nextForm": null},

  {"id": 909, "name": "Fuecoco", "type": "Fogo", "secondType": "", "BaseTotal": 207, "hp": 67, "atk": 54, "def": 50, "spd": 36, "stage": 1, "nextForm": "Crocalor", "evoTrigger": 5},
  {"id": 910, "name": "Crocalor", "type": "Fogo", "secondType": "", "BaseTotal": 270, "hp": 81, "atk": 72, "def": 68, "spd": 49, "stage": 2, "nextForm": "Skeledirge", "evoTrigger": 10},
  {"id": 911, "name": "Skeledirge", "type": "Fogo", "secondType": "Fantasma", "BaseTotal": 350, "hp": 104, "atk": 92, "def": 88, "spd": 66, "stage": 3, "nextForm": null},

  {"id": 912, "name": "Quaxly", "type": "Água", "secondType": "", "BaseTotal": 208, "hp": 55, "atk": 58, "def": 45, "spd": 50, "stage": 1, "nextForm": "Quaxwell", "evoTrigger": 5},
  {"id": 913, "name": "Quaxwell", "type": "Água", "secondType": "", "BaseTotal": 272, "hp": 70, "atk": 75, "def": 62, "spd": 65, "stage": 2, "nextForm": "Quaquaval", "evoTrigger": 10},
  {"id": 914, "name": "Quaquaval", "type": "Água", "secondType": "Lutador", "BaseTotal": 350, "hp": 85, "atk": 102, "def": 78, "spd": 85, "stage": 3, "nextForm": null},

  {"id": 915, "name": "Lechonk", "type": "Normal", "secondType": "", "BaseTotal": 171, "hp": 54, "atk": 40, "def": 42, "spd": 35, "stage": 1, "nextForm": "Oinkologne", "evoTrigger": 8},
  {"id": 916, "name": "Oinkologne", "type": "Normal", "secondType": "", "BaseTotal": 333, "hp": 110, "atk": 80, "def": 78, "spd": 65, "stage": 2, "nextForm": null},

  {"id": 917, "name": "Tarountula", "type": "Inseto", "secondType": "", "BaseTotal": 132, "hp": 35, "atk": 35, "def": 42, "spd": 20, "stage": 1, "nextForm": "Spidops", "evoTrigger": 8},
  {"id": 918, "name": "Spidops", "type": "Inseto", "secondType": "", "BaseTotal": 250, "hp": 60, "atk": 66, "def": 89, "spd": 35, "stage": 2, "nextForm": null},

  {"id": 919, "name": "Nymble", "type": "Inseto", "secondType": "", "BaseTotal": 144, "hp": 33, "atk": 34, "def": 32, "spd": 45, "stage": 1, "nextForm": "Lokix", "evoTrigger": 8},
  {"id": 920, "name": "Lokix", "type": "Inseto", "secondType": "Noturno", "BaseTotal": 306, "hp": 71, "atk": 77, "def": 66, "spd": 92, "stage": 2, "nextForm": null},

  {"id": 921, "name": "Pawmi", "type": "Elétrico", "secondType": "", "BaseTotal": 172, "hp": 45, "atk": 45, "def": 22, "spd": 60, "stage": 1, "nextForm": "Pawmo", "evoTrigger": 5},
  {"id": 922, "name": "Pawmo", "type": "Elétrico", "secondType": "Lutador", "BaseTotal": 247, "hp": 60, "atk": 62, "def": 40, "spd": 85, "stage": 2, "nextForm": "Pawmot", "evoTrigger": 10},
  {"id": 923, "name": "Pawmot", "type": "Elétrico", "secondType": "Lutador", "BaseTotal": 332, "hp": 70, "atk": 92, "def": 65, "spd": 105, "stage": 3, "nextForm": null},

  {"id": 924, "name": "Tandemaus", "type": "Normal", "secondType": "", "BaseTotal": 215, "hp": 50, "atk": 45, "def": 45, "spd": 75, "stage": 1, "nextForm": "Maushold", "evoTrigger": 8},
  {"id": 925, "name": "Maushold", "type": "Normal", "secondType": "", "BaseTotal": 327, "hp": 74, "atk": 70, "def": 72, "spd": 111, "stage": 2, "nextForm": null},

  {"id": 926, "name": "Fidough", "type": "Fada", "secondType": "", "BaseTotal": 206, "hp": 37, "atk": 42, "def": 62, "spd": 65, "stage": 1, "nextForm": "Dachsbun", "evoTrigger": 8},
  {"id": 927, "name": "Dachsbun", "type": "Fada", "secondType": "", "BaseTotal": 315, "hp": 57, "atk": 65, "def": 98, "spd": 95, "stage": 2, "nextForm": null},

  {"id": 928, "name": "Smoliv", "type": "Grama", "secondType": "Normal", "BaseTotal": 165, "hp": 41, "atk": 46, "def": 48, "spd": 30, "stage": 1, "nextForm": "Dolliv", "evoTrigger": 5},
  {"id": 929, "name": "Dolliv", "type": "Grama", "secondType": "Normal", "BaseTotal": 220, "hp": 52, "atk": 66, "def": 69, "spd": 33, "stage": 2, "nextForm": "Arboliva", "evoTrigger": 10},
  {"id": 930, "name": "Arboliva", "type": "Grama", "secondType": "Normal", "BaseTotal": 314, "hp": 78, "atk": 97, "def": 100, "spd": 39, "stage": 3, "nextForm": null},

  {"id": 931, "name": "Squawkabilly", "type": "Normal", "secondType": "Voador", "BaseTotal": 295, "hp": 82, "atk": 70, "def": 51, "spd": 92, "stage": 1, "nextForm": null},

  {"id": 932, "name": "Nacli", "type": "Pedra", "secondType": "", "BaseTotal": 180, "hp": 55, "atk": 45, "def": 55, "spd": 25, "stage": 1, "nextForm": "Naclstack", "evoTrigger": 5},
  {"id": 933, "name": "Naclstack", "type": "Pedra", "secondType": "", "BaseTotal": 225, "hp": 60, "atk": 48, "def": 82, "spd": 35, "stage": 2, "nextForm": "Garganacl", "evoTrigger": 10},
  {"id": 934, "name": "Garganacl", "type": "Pedra", "secondType": "", "BaseTotal": 317, "hp": 100, "atk": 72, "def": 110, "spd": 35, "stage": 3, "nextForm": null},

  {"id": 935, "name": "Charcadet", "type": "Fogo", "secondType": "", "BaseTotal": 165, "hp": 40, "atk": 50, "def": 40, "spd": 35, "stage": 1, "nextForm": "Armarouge", "evoTrigger": 8},
  {"id": 936, "name": "Armarouge", "type": "Fogo", "secondType": "Psíquico", "BaseTotal": 342, "hp": 85, "atk": 92, "def": 90, "spd": 75, "stage": 2, "nextForm": null},
  {"id": 937, "name": "Ceruledge", "type": "Fogo", "secondType": "Fantasma", "BaseTotal": 342, "hp": 75, "atk": 92, "def": 90, "spd": 85, "stage": 2, "nextForm": null},

  {"id": 938, "name": "Tadbulb", "type": "Elétrico", "secondType": "", "BaseTotal": 189, "hp": 61, "atk": 45, "def": 38, "spd": 45, "stage": 1, "nextForm": "Bellibolt", "evoTrigger": 8},
  {"id": 939, "name": "Bellibolt", "type": "Elétrico", "secondType": "", "BaseTotal": 325, "hp": 109, "atk": 84, "def": 87, "spd": 45, "stage": 2, "nextForm": null},

  {"id": 940, "name": "Wattrel", "type": "Elétrico", "secondType": "Voador", "BaseTotal": 196, "hp": 40, "atk": 48, "def": 38, "spd": 70, "stage": 1, "nextForm": "Kilowattrel", "evoTrigger": 8},
  {"id": 941, "name": "Kilowattrel", "type": "Elétrico", "secondType": "Voador", "BaseTotal": 343, "hp": 70, "atk": 88, "def": 60, "spd": 125, "stage": 2, "nextForm": null},

  {"id": 942, "name": "Maschiff", "type": "Noturno", "secondType": "", "BaseTotal": 226, "hp": 60, "atk": 59, "def": 56, "spd": 51, "stage": 1, "nextForm": "Mabosstiff", "evoTrigger": 8},
  {"id": 943, "name": "Mabosstiff", "type": "Noturno", "secondType": "", "BaseTotal": 335, "hp": 80, "atk": 90, "def": 80, "spd": 85, "stage": 2, "nextForm": null},

  {"id": 944, "name": "Shroodle", "type": "Veneno", "secondType": "Normal", "BaseTotal": 202, "hp": 40, "atk": 52, "def": 35, "spd": 75, "stage": 1, "nextForm": "Grafaiai", "evoTrigger": 8},
  {"id": 945, "name": "Grafaiai", "type": "Veneno", "secondType": "Normal", "BaseTotal": 329, "hp": 63, "atk": 88, "def": 68, "spd": 110, "stage": 2, "nextForm": null},

  {"id": 946, "name": "Bramblin", "type": "Grama", "secondType": "Fantasma", "BaseTotal": 187, "hp": 40, "atk": 55, "def": 32, "spd": 60, "stage": 1, "nextForm": "Brambleghast", "evoTrigger": 8},
  {"id": 947, "name": "Brambleghast", "type": "Grama", "secondType": "Fantasma", "BaseTotal": 313, "hp": 55, "atk": 98, "def": 70, "spd": 90, "stage": 2, "nextForm": null},

  {"id": 948, "name": "Toedscool", "type": "Terra", "secondType": "Grama", "BaseTotal": 223, "hp": 40, "atk": 45, "def": 68, "spd": 70, "stage": 1, "nextForm": "Toedscruel", "evoTrigger": 8},
  {"id": 949, "name": "Toedscruel", "type": "Terra", "secondType": "Grama", "BaseTotal": 347, "hp": 80, "atk": 75, "def": 92, "spd": 100, "stage": 2, "nextForm": null},

  {"id": 950, "name": "Klawf", "type": "Pedra", "secondType": "", "BaseTotal": 298, "hp": 70, "atk": 68, "def": 85, "spd": 75, "stage": 1, "nextForm": null},

  {"id": 951, "name": "Capsakid", "type": "Grama", "secondType": "", "BaseTotal": 202, "hp": 50, "atk": 62, "def": 40, "spd": 50, "stage": 1, "nextForm": "Scovillain", "evoTrigger": 8},
  {"id": 952, "name": "Scovillain", "type": "Grama", "secondType": "Fogo", "BaseTotal": 313, "hp": 65, "atk": 108, "def": 65, "spd": 75, "stage": 2, "nextForm": null},

  {"id": 953, "name": "Rellor", "type": "Inseto", "secondType": "", "BaseTotal": 170, "hp": 41, "atk": 40, "def": 59, "spd": 30, "stage": 1, "nextForm": "Rabsca", "evoTrigger": 8},
  {"id": 954, "name": "Rabsca", "type": "Inseto", "secondType": "Psíquico", "BaseTotal": 294, "hp": 75, "atk": 82, "def": 92, "spd": 45, "stage": 2, "nextForm": null},

  {"id": 955, "name": "Flittle", "type": "Psíquico", "secondType": "", "BaseTotal": 180, "hp": 30, "atk": 45, "def": 30, "spd": 75, "stage": 1, "nextForm": "Espathra", "evoTrigger": 8},
  {"id": 956, "name": "Espathra", "type": "Psíquico", "secondType": "", "BaseTotal": 340, "hp": 95, "atk": 80, "def": 60, "spd": 105, "stage": 2, "nextForm": null},

  {"id": 957, "name": "Tinkatink", "type": "Fada", "secondType": "Aço", "BaseTotal": 202, "hp": 50, "atk": 40, "def": 54, "spd": 58, "stage": 1, "nextForm": "Tinkatuff", "evoTrigger": 5},
  {"id": 958, "name": "Tinkatuff", "type": "Fada", "secondType": "Aço", "BaseTotal": 261, "hp": 65, "atk": 50, "def": 68, "spd": 78, "stage": 2, "nextForm": "Tinkaton", "evoTrigger": 10},
  {"id": 959, "name": "Tinkaton", "type": "Fada", "secondType": "Aço", "BaseTotal": 342, "hp": 85, "atk": 72, "def": 91, "spd": 94, "stage": 3, "nextForm": null},

  {"id": 960, "name": "Wiglett", "type": "Água", "secondType": "", "BaseTotal": 175, "hp": 10, "atk": 45, "def": 25, "spd": 95, "stage": 1, "nextForm": "Wugtrio", "evoTrigger": 8},
  {"id": 961, "name": "Wugtrio", "type": "Água", "secondType": "", "BaseTotal": 290, "hp": 35, "atk": 75, "def": 60, "spd": 120, "stage": 2, "nextForm": null},

  {"id": 962, "name": "Bombirdier", "type": "Voador", "secondType": "Noturno", "BaseTotal": 319, "hp": 70, "atk": 82, "def": 85, "spd": 82, "stage": 1, "nextForm": null},

  {"id": 963, "name": "Finizen", "type": "Água", "secondType": "", "BaseTotal": 230, "hp": 70, "atk": 45, "def": 40, "spd": 75, "stage": 1, "nextForm": "Palafin", "evoTrigger": 8},
  {"id": 964, "name": "Palafin", "type": "Água", "secondType": "", "BaseTotal": 329, "hp": 100, "atk": 62, "def": 67, "spd": 100, "stage": 2, "nextForm": null},

  {"id": 965, "name": "Varoom", "type": "Aço", "secondType": "Veneno", "BaseTotal": 196, "hp": 45, "atk": 50, "def": 54, "spd": 47, "stage": 1, "nextForm": "Revavroom", "evoTrigger": 8},
  {"id": 966, "name": "Revavroom", "type": "Aço", "secondType": "Veneno", "BaseTotal": 334, "hp": 80, "atk": 86, "def": 78, "spd": 90, "stage": 2, "nextForm": null},

  {"id": 967, "name": "Cyclizar", "type": "Dragão", "secondType": "Normal", "BaseTotal": 346, "hp": 70, "atk": 90, "def": 65, "spd": 121, "stage": 1, "nextForm": null},
  {"id": 968, "name": "Orthworm", "type": "Aço", "secondType": "", "BaseTotal": 307, "hp": 70, "atk": 72, "def": 100, "spd": 65, "stage": 1, "nextForm": null},

  {"id": 969, "name": "Glimmet", "type": "Pedra", "secondType": "Veneno", "BaseTotal": 229, "hp": 48, "atk": 70, "def": 51, "spd": 60, "stage": 1, "nextForm": "Glimmora", "evoTrigger": 8},
  {"id": 970, "name": "Glimmora", "type": "Pedra", "secondType": "Veneno", "BaseTotal": 347, "hp": 83, "atk": 92, "def": 86, "spd": 86, "stage": 2, "nextForm": null},

  {"id": 971, "name": "Greavard", "type": "Fantasma", "secondType": "", "BaseTotal": 188, "hp": 50, "atk": 46, "def": 58, "spd": 34, "stage": 1, "nextForm": "Houndstone", "evoTrigger": 8},
  {"id": 972, "name": "Houndstone", "type": "Fantasma", "secondType": "", "BaseTotal": 314, "hp": 72, "atk": 76, "def": 98, "spd": 68, "stage": 2, "nextForm": null},

  {"id": 973, "name": "Flamigo", "type": "Voador", "secondType": "Lutador", "BaseTotal": 336, "hp": 82, "atk": 95, "def": 69, "spd": 90, "stage": 1, "nextForm": null},

  {"id": 974, "name": "Cetoddle", "type": "Gelo", "secondType": "", "BaseTotal": 242, "hp": 108, "atk": 49, "def": 42, "spd": 43, "stage": 1, "nextForm": "Cetitan", "evoTrigger": 8},
  {"id": 975, "name": "Cetitan", "type": "Gelo", "secondType": "", "BaseTotal": 382, "hp": 170, "atk": 79, "def": 60, "spd": 73, "stage": 2, "nextForm": null},

  {"id": 976, "name": "Veluza", "type": "Água", "secondType": "Psíquico", "BaseTotal": 319, "hp": 90, "atk": 90, "def": 69, "spd": 70, "stage": 1, "nextForm": null},

  {"id": 977, "name": "Dondozo", "type": "Água", "secondType": "", "BaseTotal": 357, "hp": 150, "atk": 82, "def": 90, "spd": 35, "stage": 1, "nextForm": null},

  {"id": 978, "name": "Tatsugiri", "type": "Dragão", "secondType": "Água", "BaseTotal": 313, "hp": 68, "atk": 85, "def": 78, "spd": 82, "stage": 1, "nextForm": null},

  {"id": 979, "name": "Annihilape", "type": "Lutador", "secondType": "Fantasma", "BaseTotal": 367, "hp": 110, "atk": 82, "def": 85, "spd": 90, "stage": 3, "nextForm": null},

  {"id": 980, "name": "Clodsire", "type": "Veneno", "secondType": "Terra", "BaseTotal": 290, "hp": 130, "atk": 60, "def": 80, "spd": 20, "stage": 2, "nextForm": null},

  {"id": 981, "name": "Farigiraf", "type": "Normal", "secondType": "Psíquico", "BaseTotal": 350, "hp": 120, "atk": 100, "def": 70, "spd": 60, "stage": 2, "nextForm": null},

  {"id": 982, "name": "Dudunsparce", "type": "Normal", "secondType": "", "BaseTotal": 350, "hp": 125, "atk": 92, "def": 78, "spd": 55, "stage": 2, "nextForm": null},

  {"id": 983, "name": "Kingambit", "type": "Noturno", "secondType": "Aço", "BaseTotal": 350, "hp": 100, "atk": 98, "def": 102, "spd": 50, "stage": 3, "nextForm": null},

  {"id": 984, "name": "Great Tusk", "type": "Terra", "secondType": "Lutador", "BaseTotal": 386, "hp": 115, "atk": 92, "def": 92, "spd": 87, "stage": 1, "nextForm": null},

  {"id": 985, "name": "Scream Tail", "type": "Fada", "secondType": "Psíquico", "BaseTotal": 398, "hp": 115, "atk": 65, "def": 107, "spd": 111, "stage": 1, "nextForm": null},

  {"id": 986, "name": "Brute Bonnet", "type": "Grama", "secondType": "Noturno", "BaseTotal": 368, "hp": 111, "atk": 103, "def": 99, "spd": 55, "stage": 1, "nextForm": null},

  {"id": 987, "name": "Flutter Mane", "type": "Fada", "secondType": "Fantasma", "BaseTotal": 380, "hp": 55, "atk": 95, "def": 95, "spd": 135, "stage": 1, "nextForm": null},

  {"id": 988, "name": "Slither Wing", "type": "Inseto", "secondType": "Lutador", "BaseTotal": 368, "hp": 85, "atk": 110, "def": 92, "spd": 81, "stage": 1, "nextForm": null},

  {"id": 989, "name": "Sandy Shocks", "type": "Elétrico", "secondType": "Terra", "BaseTotal": 378, "hp": 85, "atk": 101, "def": 91, "spd": 101, "stage": 1, "nextForm": null},

  {"id": 990, "name": "Iron Treads", "type": "Terra", "secondType": "Aço", "BaseTotal": 383, "hp": 90, "atk": 92, "def": 95, "spd": 106, "stage": 1, "nextForm": null},

  {"id": 991, "name": "Iron Bundle", "type": "Gelo", "secondType": "Água", "BaseTotal": 381, "hp": 56, "atk": 102, "def": 87, "spd": 136, "stage": 1, "nextForm": null},

  {"id": 992, "name": "Iron Hands", "type": "Lutador", "secondType": "Elétrico", "BaseTotal": 387, "hp": 154, "atk": 95, "def": 88, "spd": 50, "stage": 1, "nextForm": null},

  {"id": 993, "name": "Iron Jugulis", "type": "Noturno", "secondType": "Voador", "BaseTotal": 386, "hp": 94, "atk": 101, "def": 83, "spd": 108, "stage": 1, "nextForm": null},

  {"id": 994, "name": "Iron Moth", "type": "Fogo", "secondType": "Veneno", "BaseTotal": 380, "hp": 80, "atk": 105, "def": 85, "spd": 110, "stage": 1, "nextForm": null},

  {"id": 995, "name": "Iron Thorns", "type": "Pedra", "secondType": "Elétrico", "BaseTotal": 371, "hp": 100, "atk": 102, "def": 97, "spd": 72, "stage": 1, "nextForm": null},

  {"id": 996, "name": "Frigibax", "type": "Dragão", "secondType": "Gelo", "BaseTotal": 220, "hp": 65, "atk": 55, "def": 45, "spd": 55, "stage": 1, "nextForm": "Arctibax", "evoTrigger": 5},
  {"id": 997, "name": "Arctibax", "type": "Dragão", "secondType": "Gelo", "BaseTotal": 288, "hp": 90, "atk": 70, "def": 66, "spd": 62, "stage": 2, "nextForm": "Baxcalibur", "evoTrigger": 10},
  {"id": 998, "name": "Baxcalibur", "type": "Dragão", "secondType": "Gelo", "BaseTotal": 401, "hp": 115, "atk": 110, "def": 89, "spd": 87, "stage": 3, "nextForm": null},

  {"id": 999, "name": "Gimmighoul", "type": "Fantasma", "secondType": "", "BaseTotal": 177, "hp": 45, "atk": 52, "def": 70, "spd": 10, "stage": 1, "nextForm": "Gholdengo", "evoTrigger": 8},
  {"id": 1000, "name": "Gholdengo", "type": "Aço", "secondType": "Fantasma", "BaseTotal": 360, "hp": 87, "atk": 96, "def": 93, "spd": 84, "stage": 2, "nextForm": null},

  {"id": 1001, "name": "Wo-Chien", "type": "Grama", "secondType": "Noturno", "BaseTotal": 363, "hp": 85, "atk": 90, "def": 118, "spd": 70, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 1002, "name": "Chien-Pao", "type": "Noturno", "secondType": "Gelo", "BaseTotal": 392, "hp": 80, "atk": 105, "def": 72, "spd": 135, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 1003, "name": "Ting-Lu", "type": "Terra", "secondType": "Noturno", "BaseTotal": 384, "hp": 155, "atk": 82, "def": 102, "spd": 45, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 1004, "name": "Chi-Yu", "type": "Noturno", "secondType": "Fogo", "BaseTotal": 363, "hp": 55, "atk": 108, "def": 100, "spd": 100, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 1005, "name": "Roaring Moon", "type": "Dragão", "secondType": "Noturno", "BaseTotal": 407, "hp": 105, "atk": 97, "def": 86, "spd": 119, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 1006, "name": "Iron Valiant", "type": "Fada", "secondType": "Lutador", "BaseTotal": 390, "hp": 74, "atk": 125, "def": 75, "spd": 116, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 1007, "name": "Koraidon", "type": "Lutador", "secondType": "Dragão", "BaseTotal": 453, "hp": 100, "atk": 110, "def": 108, "spd": 135, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 1008, "name": "Miraidon", "type": "Elétrico", "secondType": "Dragão", "BaseTotal": 453, "hp": 100, "atk": 110, "def": 108, "spd": 135, "stage": 1, "nextForm": null, "isLegendary": true}
];
export const MEGA_POKEDEX = [
  { "id": 10033, "name": "Mega Venusaur", "type": "Grama", "secondType": "Veneno", "BaseTotal": 625, "hp": 80, "atk": 111, "def": 121, "spd": 80, "stage": 4, "nextForm": null },
  { "id": 10034, "name": "Mega Charizard X", "type": "Fogo", "secondType": "Dragão", "BaseTotal": 634, "hp": 78, "atk": 130, "def": 98, "spd": 100, "stage": 4, "nextForm": null },
  { "id": 10035, "name": "Mega Charizard Y", "type": "Fogo", "secondType": "Voador", "BaseTotal": 634, "hp": 78, "atk": 131, "def": 96, "spd": 100, "stage": 4, "nextForm": null },
  { "id": 10036, "name": "Mega Blastoise", "type": "Água", "secondType": "", "BaseTotal": 630, "hp": 79, "atk": 119, "def": 117, "spd": 78, "stage": 4, "nextForm": null },
  { "id": 10037, "name": "Mega Alakazam", "type": "Psíquico", "secondType": "", "BaseTotal": 600, "hp": 55, "atk": 112, "def": 85, "spd": 150, "stage": 4, "nextForm": null },
  { "id": 10038, "name": "Mega Gengar", "type": "Fantasma", "secondType": "Veneno", "BaseTotal": 600, "hp": 60, "atk": 112, "def": 87, "spd": 130, "stage": 4, "nextForm": null },
  { "id": 10039, "name": "Mega Kangaskhan", "type": "Normal", "secondType": "", "BaseTotal": 590, "hp": 105, "atk": 92, "def": 100, "spd": 100, "stage": 4, "nextForm": null },
  { "id": 10040, "name": "Mega Pinsir", "type": "Inseto", "secondType": "Voador", "BaseTotal": 600, "hp": 65, "atk": 100, "def": 105, "spd": 105, "stage": 4, "nextForm": null },
  { "id": 10041, "name": "Mega Gyarados", "type": "Água", "secondType": "Noturno", "BaseTotal": 640, "hp": 95, "atk": 110, "def": 119, "spd": 81, "stage": 4, "nextForm": null },
  { "id": 10042, "name": "Mega Aerodactyl", "type": "Pedra", "secondType": "Voador", "BaseTotal": 615, "hp": 80, "atk": 102, "def": 90, "spd": 150, "stage": 4, "nextForm": null },
  { "id": 10043, "name": "Mega Mewtwo X", "type": "Psíquico", "secondType": "Lutador", "BaseTotal": 780, "hp": 106, "atk": 172, "def": 100, "spd": 130, "stage": 4, "nextForm": null, "isLegendary": true },
  { "id": 10044, "name": "Mega Mewtwo Y", "type": "Psíquico", "secondType": "", "BaseTotal": 780, "hp": 106, "atk": 172, "def": 95, "spd": 140, "stage": 4, "nextForm": null, "isLegendary": true },
  { "id": 10045, "name": "Mega Ampharos", "type": "Elétrico", "secondType": "Dragão", "BaseTotal": 610, "hp": 90, "atk": 130, "def": 107, "spd": 45, "stage": 4, "nextForm": null },
  { "id": 10046, "name": "Mega Scizor", "type": "Inseto", "secondType": "Aço", "BaseTotal": 600, "hp": 70, "atk": 102, "def": 120, "spd": 75, "stage": 4, "nextForm": null },
  { "id": 10047, "name": "Mega Heracross", "type": "Inseto", "secondType": "Lutador", "BaseTotal": 600, "hp": 80, "atk": 112, "def": 110, "spd": 75, "stage": 4, "nextForm": null },
  { "id": 10048, "name": "Mega Houndoom", "type": "Noturno", "secondType": "Fogo", "BaseTotal": 600, "hp": 75, "atk": 115, "def": 90, "spd": 115, "stage": 4, "nextForm": null },
  { "id": 10049, "name": "Mega Tyranitar", "type": "Pedra", "secondType": "Noturno", "BaseTotal": 700, "hp": 100, "atk": 129, "def": 135, "spd": 71, "stage": 4, "nextForm": null },
  { "id": 10050, "name": "Mega Blaziken", "type": "Fogo", "secondType": "Lutador", "BaseTotal": 630, "hp": 80, "atk": 145, "def": 80, "spd": 100, "stage": 4, "nextForm": null },
  { "id": 10051, "name": "Mega Gardevoir", "type": "Psíquico", "secondType": "Fada", "BaseTotal": 618, "hp": 68, "atk": 125, "def": 100, "spd": 100, "stage": 4, "nextForm": null },
  { "id": 10052, "name": "Mega Mawile", "type": "Aço", "secondType": "Fada", "BaseTotal": 480, "hp": 50, "atk": 80, "def": 110, "spd": 50, "stage": 4, "nextForm": null },
  { "id": 10053, "name": "Mega Aggron", "type": "Aço", "secondType": "", "BaseTotal": 630, "hp": 70, "atk": 100, "def": 155, "spd": 50, "stage": 4, "nextForm": null },
  { "id": 10054, "name": "Mega Medicham", "type": "Lutador", "secondType": "Psíquico", "BaseTotal": 510, "hp": 60, "atk": 90, "def": 80, "spd": 100, "stage": 4, "nextForm": null },
  { "id": 10055, "name": "Mega Manectric", "type": "Elétrico", "secondType": "", "BaseTotal": 575, "hp": 70, "atk": 105, "def": 70, "spd": 135, "stage": 4, "nextForm": null },
  { "id": 10056, "name": "Mega Banette", "type": "Fantasma", "secondType": "", "BaseTotal": 555, "hp": 64, "atk": 129, "def": 79, "spd": 75, "stage": 4, "nextForm": null },
  { "id": 10057, "name": "Mega Absol", "type": "Noturno", "secondType": "", "BaseTotal": 565, "hp": 65, "atk": 132, "def": 60, "spd": 115, "stage": 4, "nextForm": null },
  { "id": 10058, "name": "Mega Garchomp", "type": "Dragão", "secondType": "Terra", "BaseTotal": 700, "hp": 108, "atk": 145, "def": 105, "spd": 92, "stage": 4, "nextForm": null },
  { "id": 10059, "name": "Mega Lucario", "type": "Lutador", "secondType": "Aço", "BaseTotal": 625, "hp": 70, "atk": 142, "def": 79, "spd": 112, "stage": 4, "nextForm": null },
  { "id": 10060, "name": "Mega Abomasnow", "type": "Grama", "secondType": "Gelo", "BaseTotal": 594, "hp": 90, "atk": 132, "def": 105, "spd": 30, "stage": 4, "nextForm": null },
// 10061 - Eternal Flower Floette (Não usada)
  { "id": 10062, "name": "Mega Latias", "type": "Dragão", "secondType": "Psíquico", "BaseTotal": 700, "hp": 80, "atk": 120, "def": 135, "spd": 110, "stage": 4, "nextForm": null, "isLegendary": true },
  { "id": 10063, "name": "Mega Latios", "type": "Dragão", "secondType": "Psíquico", "BaseTotal": 700, "hp": 80, "atk": 145, "def": 110, "spd": 110, "stage": 4, "nextForm": null, "isLegendary": true },
  { "id": 10064, "name": "Mega Swampert", "type": "Água", "secondType": "Terra", "BaseTotal": 635, "hp": 100, "atk": 122, "def": 110, "spd": 70, "stage": 4, "nextForm": null },
  { "id": 10065, "name": "Mega Sceptile", "type": "Grama", "secondType": "Dragão", "BaseTotal": 630, "hp": 70, "atk": 127, "def": 80, "spd": 145, "stage": 4, "nextForm": null },
  { "id": 10066, "name": "Mega Sableye", "type": "Noturno", "secondType": "Fantasma", "BaseTotal": 480, "hp": 50, "atk": 85, "def": 120, "spd": 20, "stage": 4, "nextForm": null },
  { "id": 10067, "name": "Mega Altaria", "type": "Dragão", "secondType": "Fada", "BaseTotal": 590, "hp": 75, "atk": 110, "def": 107, "spd": 80, "stage": 4, "nextForm": null },
  { "id": 10068, "name": "Mega Gallade", "type": "Psíquico", "secondType": "Lutador", "BaseTotal": 618, "hp": 68, "atk": 115, "def": 105, "spd": 110, "stage": 4, "nextForm": null },
  { "id": 10069, "name": "Mega Audino", "type": "Normal", "secondType": "Fada", "BaseTotal": 545, "hp": 103, "atk": 70, "def": 126, "spd": 50, "stage": 4, "nextForm": null },
  { "id": 10070, "name": "Mega Sharpedo", "type": "Água", "secondType": "Noturno", "BaseTotal": 560, "hp": 70, "atk": 125, "def": 52, "spd": 105, "stage": 4, "nextForm": null },
  { "id": 10071, "name": "Mega Slowbro", "type": "Água", "secondType": "Psíquico", "BaseTotal": 590, "hp": 95, "atk": 102, "def": 130, "spd": 30, "stage": 4, "nextForm": null },
  { "id": 10072, "name": "Mega Steelix", "type": "Aço", "secondType": "Terra", "BaseTotal": 610, "hp": 75, "atk": 90, "def": 162, "spd": 30, "stage": 4, "nextForm": null },
  { "id": 10073, "name": "Mega Pidgeot", "type": "Voador", "secondType": "Normal", "BaseTotal": 579, "hp": 83, "atk": 107, "def": 80, "spd": 121, "stage": 4, "nextForm": null },
  { "id": 10074, "name": "Mega Glalie", "type": "Gelo", "secondType": "", "BaseTotal": 580, "hp": 80, "atk": 120, "def": 80, "spd": 100, "stage": 4, "nextForm": null },
  { "id": 10075, "name": "Mega Diancie", "type": "Pedra", "secondType": "Fada", "BaseTotal": 700, "hp": 50, "atk": 160, "def": 110, "spd": 110, "stage": 4, "nextForm": null, "isLegendary": true },
  { "id": 10076, "name": "Mega Metagross", "type": "Aço", "secondType": "Psíquico", "BaseTotal": 700, "hp": 80, "atk": 125, "def": 130, "spd": 110, "stage": 4, "nextForm": null },
  { "id": 10077, "name": "Primal Kyogre", "type": "Água", "secondType": "", "BaseTotal": 700, "hp": 100, "atk": 165, "def": 125, "spd": 90, "stage": 4, "nextForm": null , "isLegendary": true },
  { "id": 10078, "name": "Primal Groudon", "type": "Terra", "secondType": "Fogo", "BaseTotal": 700, "hp": 100, "atk": 165, "def": 125, "spd": 90, "stage": 4, "nextForm": null , "isLegendary": true },
  { "id": 10079, "name": "Mega Rayquaza", "type": "Dragão", "secondType": "Voador", "BaseTotal": 780, "hp": 105, "atk": 180, "def": 100, "spd": 115, "stage": 4, "nextForm": null, "isLegendary": true },
  // 10080 até p 10085 - Pikachus diferentes
  { "id": 10086, "name": "Hoopa Unbound", "type": "Psíquico", "secondType": "Noturno", "BaseTotal": 780, "hp": 80, "atk": 165, "def": 95, "spd": 80, "stage": 4, "nextForm": null, "isLegendary": true },
  { "id": 10087, "name": "Mega Camerupt", "type": "Fogo", "secondType": "Terra", "BaseTotal": 560, "hp": 70, "atk": 122, "def": 102, "spd": 20, "stage": 4, "nextForm": null },
  { "id": 10088, "name": "Mega Lopunny ", "type": "Normal", "secondType": "Lutador", "BaseTotal": 580, "hp": 65, "atk": 95, "def": 95, "spd": 135, "stage": 4, "nextForm": null },
  { "id": 10089, "name": "Mega Salamence", "type": "Dragão", "secondType": "Voador", "BaseTotal": 700, "hp": 95, "atk": 132, "def": 110, "spd": 120, "stage": 4, "nextForm": null },
  { "id": 10090, "name": "Mega Beedrill", "type": "Inseto", "secondType": "Veneno", "BaseTotal": 495, "hp": 65, "atk": 82, "def": 60, "spd": 145, "stage": 4, "nextForm": null },
  { "id": 10117, "name": "Ash-Greninja", "type": "Água", "secondType": "Noturno", "BaseTotal": 640, "hp": 72, "atk": 149, "def": 69, "spd": 132, "stage": 4, "nextForm": null },
  { "id": 10120, "name": "Zygarde-Forma Completa", "type": "Dragão", "secondType": "Terra", "BaseTotal": 708, "hp": 216, "atk": 95, "def": 108, "spd": 85, "stage": 4, "nextForm": null, "isLegendary": true},
  { "id": 10127, "name": "Wishiwashi-School Form", "type": "Água", "secondType": "", "BaseTotal": 620, "hp": 45, "atk": 140, "def": 132, "spd": 30, "stage": 4, "nextForm": null},
  { "id": 10155, "name": "Solgaleo-Necrozma", "type": "Psíquico", "secondType": "Aço", "BaseTotal": 680, "hp": 97, "atk": 135, "def": 118, "spd": 77, "stage": 4, "nextForm": null, "isLegendary": true},
  { "id": 10156, "name": "Lunala-Necrozma", "type": "Psíquico", "secondType": "Fantasma", "BaseTotal": 680, "hp": 97, "atk": 135, "def": 118, "spd": 77, "stage": 4, "nextForm": null, "isLegendary": true},
  { "id": 10157, "name": "Ultra Necrozma", "type": "Psíquico", "secondType": "Dragão", "BaseTotal": 754, "hp": 97, "atk": 167, "def": 97, "spd": 129, "stage": 4, "nextForm": null, "isLegendary": true},
  { "id": 10169, "name": "Galarian Articuno", "type": "Psíquico", "secondType": "Voador", "BaseTotal": 580, "hp": 90, "atk": 105, "def": 92, "spd": 95, "stage": 4, "nextForm": null, "isLegendary": true},
  { "id": 10170, "name": "Galarian Zapdos", "type": "Lutador", "secondType": "Voador", "BaseTotal": 580, "hp": 90, "atk": 105, "def": 90, "spd": 100, "stage": 4, "nextForm": null, "isLegendary": true},
  { "id": 10171, "name": "Galarian Moltres", "type": "Noturno", "secondType": "Voador", "BaseTotal": 580, "hp": 90, "atk": 92, "def": 107, "spd": 90, "stage": 4, "nextForm": null, "isLegendary": true},
  { "id": 10190, "name": "Eternamax", "type": "Veneno", "secondType": "Dragão", "BaseTotal": 1125, "hp": 225, "atk": 120, "def": 250, "spd": 130, "stage": 4, "nextForm": null, "isLegendary": true},
  { "id": 10193, "name": "Ice Rider", "type": "Psíquico", "secondType": "Gelo", "BaseTotal": 680, "hp": 100, "atk": 125, "def": 140, "spd": 50, "stage": 4, "nextForm": null, "isLegendary": true}
];

POKEDEX.push(...MEGA_POKEDEX);