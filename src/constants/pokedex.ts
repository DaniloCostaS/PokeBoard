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

  {"id": 56, "name": "Mankey", "type": "Lutador", "secondType": "", "BaseTotal": 208, "hp": 40, "atk": 58, "def": 40, "spd": 70, "stage": 1, "nextForm": "Primeape", "evoTrigger": 8},
  {"id": 57, "name": "Primeape", "type": "Lutador", "secondType": "", "BaseTotal": 308, "hp": 65, "atk": 83, "def": 65, "spd": 95, "stage": 2, "nextForm": null},

  {"id": 58, "name": "Growlithe", "type": "Fogo", "secondType": "", "BaseTotal": 233, "hp": 55, "atk": 70, "def": 48, "spd": 60, "stage": 1, "nextForm": "Arcanine", "evoTrigger": 8},
  {"id": 59, "name": "Arcanine", "type": "Fogo", "secondType": "", "BaseTotal": 370, "hp": 90, "atk": 105, "def": 80, "spd": 95, "stage": 2, "nextForm": null},

  {"id": 60, "name": "Poliwag", "type": "Água", "secondType": "", "BaseTotal": 215, "hp": 40, "atk": 45, "def": 40, "spd": 90, "stage": 1, "nextForm": "Poliwhirl", "evoTrigger": 5},
  {"id": 61, "name": "Poliwhirl", "type": "Água", "secondType": "", "BaseTotal": 271, "hp": 65, "atk": 58, "def": 58, "spd": 90, "stage": 2, "nextForm": "Poliwrath", "evoTrigger": 10},
  {"id": 62, "name": "Poliwrath", "type": "Lutador", "secondType": "Lutador", "BaseTotal": 336, "hp": 90, "atk": 83, "def": 93, "spd": 70, "stage": 3, "nextForm": null},

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

  {"id": 81, "name": "Magnemite", "type": "Elétrico", "secondType": "Aço", "BaseTotal": 198, "hp": 25, "atk": 65, "def": 63, "spd": 45, "stage": 1, "nextForm": "Magneton", "evoTrigger": 8},
  {"id": 82, "name": "Magneton", "type": "Elétrico", "secondType": "Aço", "BaseTotal": 293, "hp": 50, "atk": 90, "def": 83, "spd": 70, "stage": 2, "nextForm": null},

  {"id": 83, "name": "Farfetch'd", "type": "Normal", "secondType": "Voador", "BaseTotal": 242, "hp": 52, "atk": 77, "def": 58, "spd": 55, "stage": 1, "nextForm": null},

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

  {"id": 108, "name": "Lickitung", "type": "Normal", "secondType": "", "BaseTotal": 253, "hp": 90, "atk": 58, "def": 75, "spd": 30, "stage": 1, "nextForm": null},

  {"id": 109, "name": "Koffing", "type": "Veneno", "secondType": "", "BaseTotal": 208, "hp": 40, "atk": 63, "def": 70, "spd": 35, "stage": 1, "nextForm": "Weezing", "evoTrigger": 8},
  {"id": 110, "name": "Weezing", "type": "Veneno", "secondType": "", "BaseTotal": 308, "hp": 65, "atk": 88, "def": 95, "spd": 60, "stage": 2, "nextForm": null},

  {"id": 111, "name": "Rhyhorn", "type": "Terra", "secondType": "Pedra", "BaseTotal": 224, "hp": 80, "atk": 56, "def": 63, "spd": 25, "stage": 1, "nextForm": "Rhydon", "evoTrigger": 8},
  {"id": 112, "name": "Rhydon", "type": "Terra", "secondType": "Pedra", "BaseTotal": 316, "hp": 105, "atk": 88, "def": 83, "spd": 40, "stage": 2, "nextForm": null},

  {"id": 113, "name": "Chansey", "type": "Normal", "secondType": "", "BaseTotal": 375, "hp": 250, "atk": 20, "def": 55, "spd": 50, "stage": 1, "nextForm": "Blissey", "evoTrigger": 8},

  {"id": 114, "name": "Tangela", "type": "Grama", "secondType": "", "BaseTotal": 281, "hp": 65, "atk": 78, "def": 78, "spd": 60, "stage": 1, "nextForm": null},

  {"id": 115, "name": "Kangaskhan", "type": "Normal", "secondType": "", "BaseTotal": 343, "hp": 105, "atk": 68, "def": 80, "spd": 90, "stage": 1, "nextForm": null},

  {"id": 116, "name": "Horsea", "type": "Água", "secondType": "", "BaseTotal": 193, "hp": 30, "atk": 55, "def": 48, "spd": 60, "stage": 1, "nextForm": "Seadra", "evoTrigger": 5},
  {"id": 117, "name": "Seadra", "type": "Água", "secondType": "", "BaseTotal": 290, "hp": 55, "atk": 80, "def": 70, "spd": 85, "stage": 2, "nextForm": "Kingdra", "evoTrigger": 10},

  {"id": 118, "name": "Goldeen", "type": "Água", "secondType": "", "BaseTotal": 214, "hp": 45, "atk": 51, "def": 55, "spd": 63, "stage": 1, "nextForm": "Seaking", "evoTrigger": 8},
  {"id": 119, "name": "Seaking", "type": "Água", "secondType": "", "BaseTotal": 300, "hp": 80, "atk": 79, "def": 73, "spd": 68, "stage": 2, "nextForm": null},

  {"id": 120, "name": "Staryu", "type": "Água", "secondType": "", "BaseTotal": 228, "hp": 30, "atk": 58, "def": 55, "spd": 85, "stage": 1, "nextForm": "Starmie", "evoTrigger": 8},
  {"id": 121, "name": "Starmie", "type": "Água", "secondType": "Psíquico", "BaseTotal": 348, "hp": 60, "atk": 88, "def": 85, "spd": 115, "stage": 2, "nextForm": null},

  {"id": 122, "name": "Mr. Mime", "type": "Fada", "secondType": "Psíquico", "BaseTotal": 296, "hp": 40, "atk": 73, "def": 93, "spd": 90, "stage": 1, "nextForm": null},

  {"id": 123, "name": "Scyther", "type": "Inseto", "secondType": "Voador", "BaseTotal": 338, "hp": 70, "atk": 83, "def": 80, "spd": 105, "stage": 1, "nextForm": "Scizor", "evoTrigger": 8},

  {"id": 124, "name": "Jynx", "type": "Gelo", "secondType": "Psíquico", "BaseTotal": 308, "hp": 65, "atk": 83, "def": 65, "spd": 95, "stage": 2, "nextForm": null},

  {"id": 125, "name": "Electabuzz", "type": "Elétrico", "secondType": "", "BaseTotal": 330, "hp": 65, "atk": 89, "def": 71, "spd": 105, "stage": 2, "nextForm": null},

  {"id": 126, "name": "Magmar", "type": "Fogo", "secondType": "", "BaseTotal": 327, "hp": 65, "atk": 98, "def": 71, "spd": 93, "stage": 2, "nextForm": null},

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

  {"id": 137, "name": "Porygon", "type": "Normal", "secondType": "", "BaseTotal": 251, "hp": 65, "atk": 73, "def": 73, "spd": 40, "stage": 1, "nextForm": "Porygon2", "evoTrigger": 8},

  {"id": 138, "name": "Omanyte", "type": "Pedra", "secondType": "Água", "BaseTotal": 213, "hp": 35, "atk": 65, "def": 78, "spd": 35, "stage": 1, "nextForm": "Omastar", "evoTrigger": 8},
  {"id": 139, "name": "Omastar", "type": "Pedra", "secondType": "Água", "BaseTotal": 311, "hp": 70, "atk": 88, "def": 98, "spd": 55, "stage": 2, "nextForm": null},

  {"id": 140, "name": "Kabuto", "type": "Pedra", "secondType": "Água", "BaseTotal": 221, "hp": 30, "atk": 68, "def": 68, "spd": 55, "stage": 1, "nextForm": "Kabutops", "evoTrigger": 8},
  {"id": 141, "name": "Kabutops", "type": "Pedra", "secondType": "Água", "BaseTotal": 318, "hp": 60, "atk": 90, "def": 88, "spd": 80, "stage": 2, "nextForm": null},

  {"id": 142, "name": "Aerodactyl", "type": "Pedra", "secondType": "Voador", "BaseTotal": 363, "hp": 80, "atk": 83, "def": 70, "spd": 130, "stage": 1, "nextForm": null},

  {"id": 143, "name": "Snorlax", "type": "Normal", "secondType": "", "BaseTotal": 366, "hp": 160, "atk": 88, "def": 88, "spd": 30, "stage": 1, "nextForm": null},

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

  {"id": 175, "name": "Togepi", "type": "Fada", "secondType": "", "BaseTotal": 150, "hp": 35, "atk": 30, "def": 65, "spd": 20, "stage": 1, "nextForm": "Togetic", "evoTrigger": 8},
  {"id": 176, "name": "Togetic", "type": "Fada", "secondType": "Voador", "BaseTotal": 250, "hp": 55, "atk": 60, "def": 95, "spd": 40, "stage": 2, "nextForm": null},

  {"id": 177, "name": "Natu", "type": "Psíquico", "secondType": "Voador", "BaseTotal": 215, "hp": 40, "atk": 60, "def": 45, "spd": 70, "stage": 1, "nextForm": "Xatu", "evoTrigger": 8},
  {"id": 178, "name": "Xatu", "type": "Psíquico", "secondType": "Voador", "BaseTotal": 315, "hp": 65, "atk": 85, "def": 70, "spd": 95, "stage": 2, "nextForm": null},

  {"id": 179, "name": "Mareep", "type": "Elétrico", "secondType": "", "BaseTotal": 184, "hp": 55, "atk": 52, "def": 42, "spd": 35, "stage": 1, "nextForm": "Flaaffy", "evoTrigger": 5},
  {"id": 180, "name": "Flaaffy", "type": "Elétrico", "secondType": "", "BaseTotal": 241, "hp": 70, "atk": 68, "def": 58, "spd": 45, "stage": 2, "nextForm": "Ampharos", "evoTrigger": 10},
  {"id": 181, "name": "Ampharos", "type": "Elétrico", "secondType": "", "BaseTotal": 328, "hp": 90, "atk": 95, "def": 88, "spd": 55, "stage": 3, "nextForm": null},

  {"id": 182, "name": "Bellossom", "type": "Grama", "secondType": "", "BaseTotal": 308, "hp": 75, "atk": 85, "def": 98, "spd": 50, "stage": 1, "nextForm": null},

  {"id": 183, "name": "Marill", "type": "Água", "secondType": "Fada", "BaseTotal": 180, "hp": 70, "atk": 20, "def": 50, "spd": 40, "stage": 2, "nextForm": "Azumarill", "evoTrigger": 10},
  {"id": 184, "name": "Azumarill", "type": "Água", "secondType": "Fada", "BaseTotal": 285, "hp": 100, "atk": 55, "def": 80, "spd": 50, "stage": 3, "nextForm": null},

  {"id": 185, "name": "Sudowoodo", "type": "Pedra", "secondType": "", "BaseTotal": 255, "hp": 70, "atk": 65, "def": 90, "spd": 30, "stage": 1, "nextForm": null},

  {"id": 186, "name": "Politoed", "type": "Água", "secondType": "", "BaseTotal": 330, "hp": 90, "atk": 82, "def": 88, "spd": 70, "stage": 1, "nextForm": null},

  {"id": 187, "name": "Hoppip", "type": "Grama", "secondType": "Voador", "BaseTotal": 168, "hp": 35, "atk": 35, "def": 48, "spd": 50, "stage": 1, "nextForm": "Skiploom", "evoTrigger": 5},
  {"id": 188, "name": "Skiploom", "type": "Grama", "secondType": "Voador", "BaseTotal": 238, "hp": 55, "atk": 45, "def": 58, "spd": 80, "stage": 2, "nextForm": "Jumpluff", "evoTrigger": 10},
  {"id": 189, "name": "Jumpluff", "type": "Grama", "secondType": "Voador", "BaseTotal": 322, "hp": 75, "atk": 55, "def": 82, "spd": 110, "stage": 3, "nextForm": null},

  {"id": 190, "name": "Aipom", "type": "Normal", "secondType": "", "BaseTotal": 250, "hp": 55, "atk": 55, "def": 55, "spd": 85, "stage": 1, "nextForm": null},

  {"id": 191, "name": "Sunkern", "type": "Grama", "secondType": "", "BaseTotal": 120, "hp": 30, "atk": 30, "def": 30, "spd": 30, "stage": 1, "nextForm": "Sunflora", "evoTrigger": 8},
  {"id": 192, "name": "Sunflora", "type": "Grama", "secondType": "", "BaseTotal": 265, "hp": 75, "atk": 90, "def": 70, "spd": 30, "stage": 2, "nextForm": null},

  {"id": 193, "name": "Yanma", "type": "Inseto", "secondType": "Voador", "BaseTotal": 275, "hp": 65, "atk": 70, "def": 45, "spd": 95, "stage": 1, "nextForm": null},

  {"id": 194, "name": "Wooper", "type": "Água", "secondType": "Terrestre", "BaseTotal": 140, "hp": 55, "atk": 35, "def": 35, "spd": 15, "stage": 1, "nextForm": "Quagsire", "evoTrigger": 8},
  {"id": 195, "name": "Quagsire", "type": "Água", "secondType": "Terrestre", "BaseTotal": 280, "hp": 95, "atk": 75, "def": 75, "spd": 35, "stage": 2, "nextForm": null},

  {"id": 196, "name": "Espeon", "type": "Psíquico", "secondType": "", "BaseTotal": 351, "hp": 65, "atk": 98, "def": 78, "spd": 110, "stage": 2, "nextForm": null},

  {"id": 197, "name": "Umbreon", "type": "Noturno", "secondType": "", "BaseTotal": 342, "hp": 95, "atk": 62, "def": 120, "spd": 65, "stage": 2, "nextForm": null},

  {"id": 198, "name": "Murkrow", "type": "Noturno", "secondType": "Voador", "BaseTotal": 278, "hp": 60, "atk": 85, "def": 42, "spd": 91, "stage": 1, "nextForm": null},

  {"id": 199, "name": "Slowking", "type": "Água", "secondType": "Psíquico", "BaseTotal": 308, "hp": 95, "atk": 88, "def": 95, "spd": 30, "stage": 1, "nextForm": null},

  {"id": 200, "name": "Misdreavus", "type": "Fantasma", "secondType": "", "BaseTotal": 289, "hp": 60, "atk": 72, "def": 72, "spd": 85, "stage": 1, "nextForm": null},

  {"id": 201, "name": "Unown", "type": "Psíquico", "secondType": "", "BaseTotal": 216, "hp": 48, "atk": 72, "def": 48, "spd": 48, "stage": 1, "nextForm": null},

  {"id": 202, "name": "Wobbuffet", "type": "Psíquico", "secondType": "", "BaseTotal": 314, "hp": 190, "atk": 33, "def": 58, "spd": 33, "stage": 2, "nextForm": null},

  {"id": 203, "name": "Girafarig", "type": "Normal", "secondType": "Psíquico", "BaseTotal": 305, "hp": 70, "atk": 85, "def": 65, "spd": 85, "stage": 1, "nextForm": null},

  {"id": 204, "name": "Pineco", "type": "Inseto", "secondType": "", "BaseTotal": 177, "hp": 50, "atk": 50, "def": 62, "spd": 15, "stage": 1, "nextForm": "Forretress", "evoTrigger": 8},

  {"id": 205, "name": "Forretress", "type": "Inseto", "secondType": "Aço", "BaseTotal": 290, "hp": 75, "atk": 75, "def": 100, "spd": 40, "stage": 2, "nextForm": null},

  {"id": 206, "name": "Dunsparce", "type": "Normal", "secondType": "", "BaseTotal": 281, "hp": 100, "atk": 68, "def": 68, "spd": 45, "stage": 1, "nextForm": null},

  {"id": 207, "name": "Gligar", "type": "Terrestre", "secondType": "Voador", "BaseTotal": 290, "hp": 65, "atk": 55, "def": 85, "spd": 85, "stage": 1, "nextForm": null},

  {"id": 208, "name": "Steelix", "type": "Aço", "secondType": "Terrestre", "BaseTotal": 307, "hp": 75, "atk": 70, "def": 132, "spd": 30, "stage": 2, "nextForm": null},

  {"id": 209, "name": "Snubbull", "type": "Fada", "secondType": "", "BaseTotal": 195, "hp": 60, "atk": 60, "def": 45, "spd": 30, "stage": 1, "nextForm": "Granbull", "evoTrigger": 8},
  {"id": 210, "name": "Granbull", "type": "Fada", "secondType": "", "BaseTotal": 293, "hp": 90, "atk": 90, "def": 68, "spd": 45, "stage": 2, "nextForm": null},

  {"id": 211, "name": "Qwilfish", "type": "Água", "secondType": "Veneno", "BaseTotal": 295, "hp": 65, "atk": 75, "def": 70, "spd": 85, "stage": 1, "nextForm": null},

  {"id": 212, "name": "Scizor", "type": "Inseto", "secondType": "Aço", "BaseTotal": 317, "hp": 70, "atk": 92, "def": 90, "spd": 65, "stage": 2, "nextForm": null},

  {"id": 213, "name": "Shuckle", "type": "Inseto", "secondType": "Pedra", "BaseTotal": 265, "hp": 20, "atk": 10, "def": 230, "spd": 5, "stage": 1, "nextForm": null},

  {"id": 214, "name": "Heracross", "type": "Inseto", "secondType": "Lutador", "BaseTotal": 332, "hp": 80, "atk": 82, "def": 85, "spd": 85, "stage": 1, "nextForm": null},

  {"id": 215, "name": "Sneasel", "type": "Noturno", "secondType": "Gelo", "BaseTotal": 300, "hp": 55, "atk": 65, "def": 65, "spd": 115, "stage": 1, "nextForm": null},

  {"id": 216, "name": "Teddiursa", "type": "Normal", "secondType": "", "BaseTotal": 215, "hp": 60, "atk": 65, "def": 50, "spd": 40, "stage": 1, "nextForm": "Ursaring", "evoTrigger": 8},
  {"id": 217, "name": "Ursaring", "type": "Normal", "secondType": "", "BaseTotal": 322, "hp": 90, "atk": 102, "def": 75, "spd": 55, "stage": 2, "nextForm": null},

  {"id": 218, "name": "Slugma", "type": "Fogo", "secondType": "", "BaseTotal": 155, "hp": 40, "atk": 55, "def": 40, "spd": 20, "stage": 1, "nextForm": "Magcargo", "evoTrigger": 8},
  {"id": 219, "name": "Magcargo", "type": "Fogo", "secondType": "Pedra", "BaseTotal": 260, "hp": 60, "atk": 70, "def": 100, "spd": 30, "stage": 2, "nextForm": null},

  {"id": 220, "name": "Swinub", "type": "Gelo", "secondType": "Terrestre", "BaseTotal": 175, "hp": 50, "atk": 40, "def": 35, "spd": 50, "stage": 1, "nextForm": "Piloswine", "evoTrigger": 8},
  {"id": 221, "name": "Piloswine", "type": "Gelo", "secondType": "Terrestre", "BaseTotal": 300, "hp": 100, "atk": 80, "def": 70, "spd": 50, "stage": 2, "nextForm": null},

  {"id": 222, "name": "Corsola", "type": "Água", "secondType": "Pedra", "BaseTotal": 255, "hp": 65, "atk": 60, "def": 95, "spd": 35, "stage": 1, "nextForm": null},

  {"id": 223, "name": "Remoraid", "type": "Água", "secondType": "", "BaseTotal": 200, "hp": 35, "atk": 65, "def": 35, "spd": 65, "stage": 1, "nextForm": "Octillery", "evoTrigger": 8},
  {"id": 224, "name": "Octillery", "type": "Água", "secondType": "", "BaseTotal": 300, "hp": 75, "atk": 105, "def": 75, "spd": 45, "stage": 2, "nextForm": null},

  {"id": 225, "name": "Delibird", "type": "Gelo", "secondType": "Voador", "BaseTotal": 225, "hp": 45, "atk": 60, "def": 45, "spd": 75, "stage": 1, "nextForm": null},

  {"id": 226, "name": "Mantine", "type": "Água", "secondType": "Voador", "BaseTotal": 300, "hp": 65, "atk": 60, "def": 105, "spd": 70, "stage": 1, "nextForm": null},

  {"id": 227, "name": "Skarmory", "type": "Aço", "secondType": "Voador", "BaseTotal": 300, "hp": 65, "atk": 60, "def": 105, "spd": 70, "stage": 1, "nextForm": null},

  {"id": 228, "name": "Houndour", "type": "Noturno", "secondType": "Fogo", "BaseTotal": 220, "hp": 45, "atk": 70, "def": 40, "spd": 65, "stage": 1, "nextForm": "Houndoom", "evoTrigger": 8},
  {"id": 229, "name": "Houndoom", "type": "Noturno", "secondType": "Fogo", "BaseTotal": 335, "hp": 75, "atk": 100, "def": 65, "spd": 95, "stage": 2, "nextForm": null},

  {"id": 230, "name": "Kingdra", "type": "Água", "secondType": "Dragão", "BaseTotal": 350, "hp": 75, "atk": 95, "def": 95, "spd": 85, "stage": 3, "nextForm": null},

  {"id": 231, "name": "Phanpy", "type": "Terrestre", "secondType": "", "BaseTotal": 230, "hp": 90, "atk": 50, "def": 50, "spd": 40, "stage": 1, "nextForm": "Donphan", "evoTrigger": 8},
  {"id": 232, "name": "Donphan", "type": "Terrestre", "secondType": "", "BaseTotal": 320, "hp": 90, "atk": 90, "def": 90, "spd": 50, "stage": 2, "nextForm": null},

  {"id": 233, "name": "Porygon2", "type": "Normal", "secondType": "", "BaseTotal": 329, "hp": 85, "atk": 92, "def": 92, "spd": 60, "stage": 2, "nextForm": null},

  {"id": 234, "name": "Stantler", "type": "Normal", "secondType": "", "BaseTotal": 312, "hp": 73, "atk": 90, "def": 64, "spd": 85, "stage": 1, "nextForm": null},

  {"id": 235, "name": "Smeargle", "type": "Normal", "secondType": "", "BaseTotal": 190, "hp": 55, "atk": 20, "def": 40, "spd": 75, "stage": 1, "nextForm": null},

  {"id": 236, "name": "Tyrogue", "type": "Lutador", "secondType": "", "BaseTotal": 140, "hp": 35, "atk": 35, "def": 35, "spd": 35, "stage": 1, "nextForm": null},

  {"id": 237, "name": "Hitmontop", "type": "Lutador", "secondType": "", "BaseTotal": 287, "hp": 50, "atk": 65, "def": 102, "spd": 70, "stage": 1, "nextForm": null},

  {"id": 238, "name": "Smoochum", "type": "Gelo", "secondType": "Psíquico", "BaseTotal": 208, "hp": 45, "atk": 58, "def": 40, "spd": 65, "stage": 1, "nextForm": "Jynx", "evoTrigger": 8},

  {"id": 239, "name": "Elekid", "type": "Elétrico", "secondType": "", "BaseTotal": 250, "hp": 45, "atk": 64, "def": 46, "spd": 95, "stage": 1, "nextForm": "Electabuzz", "evoTrigger": 8},

  {"id": 240, "name": "Magby", "type": "Fogo", "secondType": "", "BaseTotal": 246, "hp": 45, "atk": 72, "def": 46, "spd": 83, "stage": 1, "nextForm": "Magmar", "evoTrigger": 8},

  {"id": 241, "name": "Miltank", "type": "Normal", "secondType": "", "BaseTotal": 343, "hp": 95, "atk": 60, "def": 88, "spd": 100, "stage": 1, "nextForm": null},

  {"id": 242, "name": "Blissey", "type": "Normal", "secondType": "", "BaseTotal": 424, "hp": 255, "atk": 42, "def": 72, "spd": 55, "stage": 2, "nextForm": null},

  {"id": 243, "name": "Raikou", "type": "Elétrico", "secondType": "", "BaseTotal": 393, "hp": 90, "atk": 100, "def": 88, "spd": 115, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 244, "name": "Entei", "type": "Fogo", "secondType": "", "BaseTotal": 397, "hp": 115, "atk": 102, "def": 80, "spd": 100, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 245, "name": "Suicune", "type": "Água", "secondType": "", "BaseTotal": 382, "hp": 100, "atk": 82, "def": 115, "spd": 85, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 246, "name": "Larvitar", "type": "Pedra", "secondType": "Terrestre", "BaseTotal": 195, "hp": 50, "atk": 54, "def": 50, "spd": 41, "stage": 1, "nextForm": "Pupitar", "evoTrigger": 5},
  {"id": 247, "name": "Pupitar", "type": "Pedra", "secondType": "Terrestre", "BaseTotal": 265, "hp": 70, "atk": 74, "def": 70, "spd": 51, "stage": 2, "nextForm": "Tyranitar", "evoTrigger": 10},
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
  {"id": 259, "name": "Marshtomp", "type": "Água", "secondType": "Terrestre", "BaseTotal": 262, "hp": 70, "atk": 72, "def": 70, "spd": 50, "stage": 2, "nextForm": "Swampert", "evoTrigger": 10},
  {"id": 260, "name": "Swampert", "type": "Água", "secondType": "Terrestre", "BaseTotal": 348, "hp": 100, "atk": 98, "def": 90, "spd": 60, "stage": 3, "nextForm": null},
  {"id": 261, "name": "Poochyena", "type": "Noturno", "secondType": "", "BaseTotal": 144, "hp": 35, "atk": 42, "def": 32, "spd": 35, "stage": 1, "nextForm": "Mightyena", "evoTrigger": 8},
  {"id": 262, "name": "Mightyena", "type": "Noturno", "secondType": "", "BaseTotal": 280, "hp": 70, "atk": 75, "def": 65, "spd": 70, "stage": 2, "nextForm": null},
  {"id": 263, "name": "Zigzagoon", "type": "Normal", "secondType": "", "BaseTotal": 169, "hp": 38, "atk": 30, "def": 41, "spd": 60, "stage": 1, "nextForm": "Linoone", "evoTrigger": 8},
  {"id": 264, "name": "Linoone", "type": "Normal", "secondType": "", "BaseTotal": 299, "hp": 78, "atk": 60, "def": 61, "spd": 100, "stage": 2, "nextForm": null},
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
  {"id": 289, "name": "Slaking", "type": "Normal", "secondType": "", "BaseTotal": 460, "hp": 150, "atk": 128, "def": 82, "spd": 100, "stage": 3, "nextForm": null},
  {"id": 290, "name": "Nincada", "type": "Inseto", "secondType": "Terrestre", "BaseTotal": 169, "hp": 31, "atk": 38, "def": 60, "spd": 40, "stage": 1, "nextForm": null},
  {"id": 291, "name": "Ninjask", "type": "Inseto", "secondType": "Voador", "BaseTotal": 339, "hp": 61, "atk": 70, "def": 48, "spd": 160, "stage": 1, "nextForm": null},
  {"id": 292, "name": "Shedinja", "type": "Inseto", "secondType": "Fantasma", "BaseTotal": 139, "hp": 1, "atk": 60, "def": 38, "spd": 40, "stage": 1, "nextForm": null},
  {"id": 293, "name": "Whismur", "type": "Normal", "secondType": "", "BaseTotal": 166, "hp": 64, "atk": 51, "def": 23, "spd": 28, "stage": 1, "nextForm": null},
  {"id": 294, "name": "Loudred", "type": "Normal", "secondType": "", "BaseTotal": 246, "hp": 84, "atk": 71, "def": 43, "spd": 48, "stage": 1, "nextForm": null},
  {"id": 295, "name": "Exploud", "type": "Normal", "secondType": "", "BaseTotal": 326, "hp": 104, "atk": 91, "def": 63, "spd": 68, "stage": 1, "nextForm": null},
  {"id": 296, "name": "Makuhita", "type": "Lutador", "secondType": "", "BaseTotal": 167, "hp": 72, "atk": 40, "def": 30, "spd": 25, "stage": 1, "nextForm": null},
  {"id": 297, "name": "Hariyama", "type": "Lutador", "secondType": "", "BaseTotal": 334, "hp": 144, "atk": 80, "def": 60, "spd": 50, "stage": 1, "nextForm": null},
  
  {"id": 298, "name": "Azurill", "type": "Normal", "secondType": "Fada", "BaseTotal": 130, "hp": 50, "atk": 20, "def": 40, "spd": 20, "stage": 1, "nextForm": "Marill", "evoTrigger": 5},

  {"id": 299, "name": "Nosepass", "type": "Pedra", "secondType": "", "BaseTotal": 217, "hp": 30, "atk": 45, "def": 112, "spd": 30, "stage": 1, "nextForm": null},
  {"id": 300, "name": "Skitty", "type": "Normal", "secondType": "", "BaseTotal": 180, "hp": 50, "atk": 40, "def": 40, "spd": 50, "stage": 1, "nextForm": null},
  {"id": 301, "name": "Delcatty", "type": "Normal", "secondType": "", "BaseTotal": 280, "hp": 70, "atk": 60, "def": 60, "spd": 90, "stage": 1, "nextForm": null},
  {"id": 302, "name": "Sableye", "type": "Noturno", "secondType": "Fantasma", "BaseTotal": 240, "hp": 50, "atk": 70, "def": 70, "spd": 50, "stage": 1, "nextForm": null},
  {"id": 303, "name": "Mawile", "type": "Aço", "secondType": "Fada", "BaseTotal": 240, "hp": 50, "atk": 70, "def": 70, "spd": 50, "stage": 1, "nextForm": null},
  {"id": 304, "name": "Aron", "type": "Aço", "secondType": "Pedra", "BaseTotal": 205, "hp": 50, "atk": 55, "def": 70, "spd": 30, "stage": 1, "nextForm": null},
  {"id": 305, "name": "Lairon", "type": "Aço", "secondType": "Pedra", "BaseTotal": 265, "hp": 60, "atk": 70, "def": 95, "spd": 40, "stage": 1, "nextForm": null},
  {"id": 306, "name": "Aggron", "type": "Aço", "secondType": "Pedra", "BaseTotal": 325, "hp": 70, "atk": 85, "def": 120, "spd": 50, "stage": 1, "nextForm": null},
  {"id": 307, "name": "Meditite", "type": "Lutador", "secondType": "Psíquico", "BaseTotal": 185, "hp": 30, "atk": 40, "def": 55, "spd": 60, "stage": 1, "nextForm": null},
  {"id": 308, "name": "Medicham", "type": "Lutador", "secondType": "Psíquico", "BaseTotal": 275, "hp": 60, "atk": 60, "def": 75, "spd": 80, "stage": 1, "nextForm": null},
  {"id": 309, "name": "Electrike", "type": "Elétrico", "secondType": "", "BaseTotal": 200, "hp": 40, "atk": 55, "def": 40, "spd": 65, "stage": 1, "nextForm": null},
  {"id": 310, "name": "Manectric", "type": "Elétrico", "secondType": "", "BaseTotal": 325, "hp": 70, "atk": 90, "def": 60, "spd": 105, "stage": 1, "nextForm": null},
  {"id": 311, "name": "Plusle", "type": "Elétrico", "secondType": "", "BaseTotal": 281, "hp": 60, "atk": 68, "def": 58, "spd": 95, "stage": 1, "nextForm": null},
  {"id": 312, "name": "Minun", "type": "Elétrico", "secondType": "", "BaseTotal": 281, "hp": 60, "atk": 58, "def": 68, "spd": 95, "stage": 1, "nextForm": null},
  {"id": 313, "name": "Volbeat", "type": "Inseto", "secondType": "", "BaseTotal": 290, "hp": 65, "atk": 60, "def": 80, "spd": 85, "stage": 1, "nextForm": null},
  {"id": 314, "name": "Illumise", "type": "Inseto", "secondType": "", "BaseTotal": 290, "hp": 65, "atk": 60, "def": 80, "spd": 85, "stage": 1, "nextForm": null},
  {"id": 315, "name": "Roselia", "type": "Grama", "secondType": "Veneno", "BaseTotal": 257, "hp": 50, "atk": 80, "def": 62, "spd": 65, "stage": 1, "nextForm": null},
  {"id": 316, "name": "Gulpin", "type": "Veneno", "secondType": "", "BaseTotal": 206, "hp": 70, "atk": 43, "def": 53, "spd": 40, "stage": 1, "nextForm": null},
  {"id": 317, "name": "Swalot", "type": "Veneno", "secondType": "", "BaseTotal": 311, "hp": 100, "atk": 73, "def": 83, "spd": 55, "stage": 1, "nextForm": null},
  {"id": 318, "name": "Carvanha", "type": "Água", "secondType": "Noturno", "BaseTotal": 208, "hp": 45, "atk": 78, "def": 20, "spd": 65, "stage": 1, "nextForm": null},
  {"id": 319, "name": "Sharpedo", "type": "Água", "secondType": "Noturno", "BaseTotal": 313, "hp": 70, "atk": 108, "def": 40, "spd": 95, "stage": 1, "nextForm": null},
  {"id": 320, "name": "Wailmer", "type": "Água", "secondType": "", "BaseTotal": 295, "hp": 130, "atk": 70, "def": 35, "spd": 60, "stage": 1, "nextForm": null},
  {"id": 321, "name": "Wailord", "type": "Água", "secondType": "", "BaseTotal": 365, "hp": 170, "atk": 90, "def": 45, "spd": 60, "stage": 1, "nextForm": null},
  {"id": 322, "name": "Numel", "type": "Fogo", "secondType": "Terrestre", "BaseTotal": 199, "hp": 60, "atk": 62, "def": 42, "spd": 35, "stage": 1, "nextForm": null},
  {"id": 323, "name": "Camerupt", "type": "Fogo", "secondType": "Terrestre", "BaseTotal": 284, "hp": 70, "atk": 102, "def": 72, "spd": 40, "stage": 1, "nextForm": null},
  {"id": 324, "name": "Torkoal", "type": "Fogo", "secondType": "", "BaseTotal": 280, "hp": 70, "atk": 85, "def": 105, "spd": 20, "stage": 1, "nextForm": null},
  {"id": 325, "name": "Spoink", "type": "Psíquico", "secondType": "", "BaseTotal": 226, "hp": 60, "atk": 48, "def": 58, "spd": 60, "stage": 1, "nextForm": null},
  {"id": 326, "name": "Grumpig", "type": "Psíquico", "secondType": "", "BaseTotal": 316, "hp": 80, "atk": 68, "def": 88, "spd": 80, "stage": 1, "nextForm": null},
  {"id": 327, "name": "Spinda", "type": "Normal", "secondType": "", "BaseTotal": 240, "hp": 60, "atk": 60, "def": 60, "spd": 60, "stage": 1, "nextForm": null},
  {"id": 328, "name": "Trapinch", "type": "Terrestre", "secondType": "", "BaseTotal": 172, "hp": 45, "atk": 72, "def": 45, "spd": 10, "stage": 1, "nextForm": null},
  {"id": 329, "name": "Vibrava", "type": "Terrestre", "secondType": "Dragão", "BaseTotal": 230, "hp": 50, "atk": 60, "def": 50, "spd": 70, "stage": 1, "nextForm": null},
  {"id": 330, "name": "Flygon", "type": "Terrestre", "secondType": "Dragão", "BaseTotal": 350, "hp": 80, "atk": 90, "def": 80, "spd": 100, "stage": 1, "nextForm": null},
  {"id": 331, "name": "Cacnea", "type": "Grama", "secondType": "", "BaseTotal": 210, "hp": 50, "atk": 85, "def": 40, "spd": 35, "stage": 1, "nextForm": null},
  {"id": 332, "name": "Cacturne", "type": "Grama", "secondType": "Noturno", "BaseTotal": 300, "hp": 70, "atk": 115, "def": 60, "spd": 55, "stage": 1, "nextForm": null},
  {"id": 333, "name": "Swablu", "type": "Normal", "secondType": "Voador", "BaseTotal": 203, "hp": 45, "atk": 40, "def": 68, "spd": 50, "stage": 1, "nextForm": null},
  {"id": 334, "name": "Altaria", "type": "Dragão", "secondType": "Voador", "BaseTotal": 323, "hp": 75, "atk": 70, "def": 98, "spd": 80, "stage": 1, "nextForm": null},
  {"id": 335, "name": "Zangoose", "type": "Normal", "secondType": "", "BaseTotal": 311, "hp": 73, "atk": 88, "def": 60, "spd": 90, "stage": 1, "nextForm": null},
  {"id": 336, "name": "Seviper", "type": "Veneno", "secondType": "", "BaseTotal": 298, "hp": 73, "atk": 100, "def": 60, "spd": 65, "stage": 1, "nextForm": null},
  {"id": 337, "name": "Lunatone", "type": "Pedra", "secondType": "Psíquico", "BaseTotal": 310, "hp": 90, "atk": 75, "def": 75, "spd": 70, "stage": 1, "nextForm": null},
  {"id": 338, "name": "Solrock", "type": "Pedra", "secondType": "Psíquico", "BaseTotal": 310, "hp": 90, "atk": 75, "def": 75, "spd": 70, "stage": 1, "nextForm": null},
  {"id": 339, "name": "Barboach", "type": "Água", "secondType": "Terrestre", "BaseTotal": 199, "hp": 50, "atk": 47, "def": 42, "spd": 60, "stage": 1, "nextForm": null},
  {"id": 340, "name": "Whiscash", "type": "Água", "secondType": "Terrestre", "BaseTotal": 319, "hp": 110, "atk": 77, "def": 72, "spd": 60, "stage": 1, "nextForm": null},
  {"id": 341, "name": "Corphish", "type": "Água", "secondType": "", "BaseTotal": 193, "hp": 43, "atk": 65, "def": 50, "spd": 35, "stage": 1, "nextForm": null},
  {"id": 342, "name": "Crawdaunt", "type": "Água", "secondType": "Noturno", "BaseTotal": 293, "hp": 63, "atk": 105, "def": 70, "spd": 55, "stage": 1, "nextForm": null},
  {"id": 343, "name": "Baltoy", "type": "Terrestre", "secondType": "Psíquico", "BaseTotal": 197, "hp": 40, "atk": 40, "def": 62, "spd": 55, "stage": 1, "nextForm": null},
  {"id": 344, "name": "Claydol", "type": "Terrestre", "secondType": "Psíquico", "BaseTotal": 317, "hp": 60, "atk": 70, "def": 112, "spd": 75, "stage": 1, "nextForm": null},
  {"id": 345, "name": "Lileep", "type": "Pedra", "secondType": "Grama", "BaseTotal": 222, "hp": 66, "atk": 51, "def": 82, "spd": 23, "stage": 1, "nextForm": null},
  {"id": 346, "name": "Cradily", "type": "Pedra", "secondType": "Grama", "BaseTotal": 312, "hp": 86, "atk": 81, "def": 102, "spd": 43, "stage": 1, "nextForm": null},
  {"id": 347, "name": "Anorith", "type": "Pedra", "secondType": "Inseto", "BaseTotal": 238, "hp": 45, "atk": 68, "def": 50, "spd": 75, "stage": 1, "nextForm": null},
  {"id": 348, "name": "Armaldo", "type": "Pedra", "secondType": "Inseto", "BaseTotal": 308, "hp": 75, "atk": 98, "def": 90, "spd": 45, "stage": 1, "nextForm": null},
  {"id": 349, "name": "Feebas", "type": "Água", "secondType": "", "BaseTotal": 150, "hp": 20, "atk": 12, "def": 38, "spd": 80, "stage": 1, "nextForm": null},
  {"id": 350, "name": "Milotic", "type": "Água", "secondType": "", "BaseTotal": 358, "hp": 95, "atk": 80, "def": 102, "spd": 81, "stage": 1, "nextForm": null},
  {"id": 351, "name": "Castform", "type": "Normal", "secondType": "", "BaseTotal": 280, "hp": 70, "atk": 70, "def": 70, "spd": 70, "stage": 1, "nextForm": null},
  {"id": 352, "name": "Kecleon", "type": "Normal", "secondType": "", "BaseTotal": 270, "hp": 60, "atk": 75, "def": 95, "spd": 40, "stage": 1, "nextForm": null},
  {"id": 353, "name": "Shuppet", "type": "Fantasma", "secondType": "", "BaseTotal": 192, "hp": 44, "atk": 69, "def": 34, "spd": 45, "stage": 1, "nextForm": null},
  {"id": 354, "name": "Banette", "type": "Fantasma", "secondType": "", "BaseTotal": 292, "hp": 64, "atk": 99, "def": 64, "spd": 65, "stage": 1, "nextForm": null},
  {"id": 355, "name": "Duskull", "type": "Fantasma", "secondType": "", "BaseTotal": 170, "hp": 20, "atk": 35, "def": 90, "spd": 25, "stage": 1, "nextForm": null},
  {"id": 356, "name": "Dusclops", "type": "Fantasma", "secondType": "", "BaseTotal": 260, "hp": 40, "atk": 65, "def": 130, "spd": 25, "stage": 1, "nextForm": null},
  {"id": 357, "name": "Tropius", "type": "Grama", "secondType": "Voador", "BaseTotal": 305, "hp": 99, "atk": 70, "def": 85, "spd": 51, "stage": 1, "nextForm": null},
  {"id": 358, "name": "Chimecho", "type": "Psíquico", "secondType": "", "BaseTotal": 297, "hp": 75, "atk": 72, "def": 85, "spd": 65, "stage": 1, "nextForm": null},
  {"id": 359, "name": "Absol", "type": "Noturno", "secondType": "", "BaseTotal": 302, "hp": 65, "atk": 102, "def": 60, "spd": 75, "stage": 1, "nextForm": null},
  
  {"id": 360, "name": "Wynaut", "type": "Psíquico", "secondType": "", "BaseTotal": 189, "hp": 95, "atk": 23, "def": 48, "spd": 23, "stage": 1, "nextForm": "Wobbuffet", "evoTrigger": 8},

  {"id": 361, "name": "Snorunt", "type": "Gelo", "secondType": "", "BaseTotal": 200, "hp": 50, "atk": 50, "def": 50, "spd": 50, "stage": 1, "nextForm": null},
  {"id": 362, "name": "Glalie", "type": "Gelo", "secondType": "", "BaseTotal": 320, "hp": 80, "atk": 80, "def": 80, "spd": 80, "stage": 1, "nextForm": null},
  {"id": 363, "name": "Spheal", "type": "Gelo", "secondType": "Água", "BaseTotal": 193, "hp": 70, "atk": 48, "def": 50, "spd": 25, "stage": 1, "nextForm": null},
  {"id": 364, "name": "Sealeo", "type": "Gelo", "secondType": "Água", "BaseTotal": 273, "hp": 90, "atk": 68, "def": 70, "spd": 45, "stage": 1, "nextForm": null},
  {"id": 365, "name": "Walrein", "type": "Gelo", "secondType": "Água", "BaseTotal": 353, "hp": 110, "atk": 88, "def": 90, "spd": 65, "stage": 1, "nextForm": null},
  {"id": 366, "name": "Clamperl", "type": "Água", "secondType": "", "BaseTotal": 206, "hp": 35, "atk": 69, "def": 70, "spd": 32, "stage": 1, "nextForm": null},
  {"id": 367, "name": "Huntail", "type": "Água", "secondType": "", "BaseTotal": 296, "hp": 55, "atk": 99, "def": 90, "spd": 52, "stage": 1, "nextForm": null},
  {"id": 368, "name": "Gorebyss", "type": "Água", "secondType": "", "BaseTotal": 296, "hp": 55, "atk": 99, "def": 90, "spd": 52, "stage": 1, "nextForm": null},
  {"id": 369, "name": "Relicanth", "type": "Água", "secondType": "Pedra", "BaseTotal": 321, "hp": 100, "atk": 68, "def": 98, "spd": 55, "stage": 1, "nextForm": null},
  {"id": 370, "name": "Luvdisc", "type": "Água", "secondType": "", "BaseTotal": 235, "hp": 43, "atk": 35, "def": 60, "spd": 97, "stage": 1, "nextForm": null},
  {"id": 371, "name": "Bagon", "type": "Dragão", "secondType": "", "BaseTotal": 198, "hp": 45, "atk": 58, "def": 45, "spd": 50, "stage": 1, "nextForm": null},
  {"id": 372, "name": "Shelgon", "type": "Dragão", "secondType": "", "BaseTotal": 268, "hp": 65, "atk": 78, "def": 75, "spd": 50, "stage": 1, "nextForm": null},
  {"id": 373, "name": "Salamence", "type": "Dragão", "secondType": "Voador", "BaseTotal": 397, "hp": 95, "atk": 122, "def": 80, "spd": 100, "stage": 1, "nextForm": null},
  {"id": 374, "name": "Beldum", "type": "Aço", "secondType": "Psíquico", "BaseTotal": 185, "hp": 40, "atk": 45, "def": 70, "spd": 30, "stage": 1, "nextForm": null},
  {"id": 375, "name": "Metang", "type": "Aço", "secondType": "Psíquico", "BaseTotal": 265, "hp": 60, "atk": 65, "def": 90, "spd": 50, "stage": 1, "nextForm": null},
  {"id": 376, "name": "Metagross", "type": "Aço", "secondType": "Psíquico", "BaseTotal": 375, "hp": 80, "atk": 115, "def": 110, "spd": 70, "stage": 1, "nextForm": null},

  {"id": 377, "name": "Regirock", "type": "Pedra", "secondType": "", "BaseTotal": 355, "hp": 80, "atk": 75, "def": 150, "spd": 50, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 378, "name": "Regice", "type": "Gelo", "secondType": "", "BaseTotal": 355, "hp": 80, "atk": 75, "def": 150, "spd": 50, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 379, "name": "Registeel", "type": "Aço", "secondType": "", "BaseTotal": 355, "hp": 80, "atk": 75, "def": 150, "spd": 50, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 380, "name": "Latias", "type": "Dragão", "secondType": "Psíquico", "BaseTotal": 395, "hp": 80, "atk": 95, "def": 110, "spd": 110, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 381, "name": "Latios", "type": "Dragão", "secondType": "Psíquico", "BaseTotal": 395, "hp": 80, "atk": 110, "def": 95, "spd": 110, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 382, "name": "Kyogre", "type": "Água", "secondType": "", "BaseTotal": 430, "hp": 100, "atk": 125, "def": 115, "spd": 90, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 383, "name": "Groudon", "type": "Terrestre", "secondType": "", "BaseTotal": 430, "hp": 100, "atk": 125, "def": 115, "spd": 90, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 384, "name": "Rayquaza", "type": "Dragão", "secondType": "Voador", "BaseTotal": 440, "hp": 105, "atk": 150, "def": 90, "spd": 95, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 385, "name": "Jirachi", "type": "Aço", "secondType": "Psíquico", "BaseTotal": 400, "hp": 100, "atk": 100, "def": 100, "spd": 100, "stage": 1, "nextForm": null, "isLegendary": true},

  {"id": 386, "name": "Deoxys", "type": "Psíquico", "secondType": "", "BaseTotal": 400, "hp": 50, "atk": 150, "def": 50, "spd": 150, "stage": 1, "nextForm": null, "isLegendary": true}
];