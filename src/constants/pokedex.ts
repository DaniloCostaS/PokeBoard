import type { PokemonData } from './types';

export const POKEDEX: PokemonData[] = [
  {"id":1,"name":"Bulbasaur","type":"Grama","hp":45,"atk":49,"def":49,"spd":45,"nextForm":"Ivysaur","evoTrigger":5},
  {"id":2,"name":"Ivysaur","type":"Grama","hp":60,"atk":62,"def":63,"spd":60,"nextForm":"Venusaur","evoTrigger":10},
  {"id":3,"name":"Venusaur","type":"Grama","hp":80,"atk":82,"def":83,"spd":80,"nextForm":null},

  {"id":4,"name":"Charmander","type":"Fogo","hp":39,"atk":52,"def":43,"spd":65,"nextForm":"Charmeleon","evoTrigger":5},
  {"id":5,"name":"Charmeleon","type":"Fogo","hp":58,"atk":64,"def":58,"spd":80,"nextForm":"Charizard","evoTrigger":10},
  {"id":6,"name":"Charizard","type":"Fogo","hp":78,"atk":84,"def":78,"spd":100,"nextForm":null},

  {"id":7,"name":"Squirtle","type":"Água","hp":44,"atk":48,"def":65,"spd":43,"nextForm":"Wartortle","evoTrigger":5},
  {"id":8,"name":"Wartortle","type":"Água","hp":59,"atk":63,"def":80,"spd":58,"nextForm":"Blastoise","evoTrigger":10},
  {"id":9,"name":"Blastoise","type":"Água","hp":79,"atk":83,"def":100,"spd":78,"nextForm":null},

  {"id":10,"name":"Caterpie","type":"Inseto","hp":45,"atk":30,"def":35,"spd":45,"nextForm":"Metapod","evoTrigger":5},
  {"id":11,"name":"Metapod","type":"Inseto","hp":50,"atk":20,"def":55,"spd":30,"nextForm":"Butterfree","evoTrigger":10},
  {"id":12,"name":"Butterfree","type":"Inseto","hp":60,"atk":45,"def":50,"spd":70,"nextForm":null},

  {"id":13,"name":"Weedle","type":"Inseto","hp":40,"atk":35,"def":30,"spd":50,"nextForm":"Kakuna","evoTrigger":5},
  {"id":14,"name":"Kakuna","type":"Inseto","hp":45,"atk":25,"def":50,"spd":35,"nextForm":"Beedrill","evoTrigger":10},
  {"id":15,"name":"Beedrill","type":"Inseto","hp":65,"atk":90,"def":40,"spd":75,"nextForm":null},

  {"id":16,"name":"Pidgey","type":"Normal","hp":40,"atk":45,"def":40,"spd":56,"nextForm":"Pidgeotto","evoTrigger":5},
  {"id":17,"name":"Pidgeotto","type":"Normal","hp":63,"atk":60,"def":55,"spd":71,"nextForm":"Pidgeot","evoTrigger":10},
  {"id":18,"name":"Pidgeot","type":"Normal","hp":83,"atk":80,"def":75,"spd":91,"nextForm":null},

  {"id":19,"name":"Rattata","type":"Normal","hp":30,"atk":56,"def":35,"spd":72,"nextForm":"Raticate","evoTrigger":8},
  {"id":20,"name":"Raticate","type":"Normal","hp":55,"atk":81,"def":60,"spd":97,"nextForm":null},

  {"id":21,"name":"Spearow","type":"Normal","hp":40,"atk":60,"def":30,"spd":70,"nextForm":"Fearow","evoTrigger":8},
  {"id":22,"name":"Fearow","type":"Normal","hp":65,"atk":90,"def":65,"spd":100,"nextForm":null},

  {"id":23,"name":"Ekans","type":"Veneno","hp":35,"atk":60,"def":44,"spd":55,"nextForm":"Arbok","evoTrigger":8},
  {"id":24,"name":"Arbok","type":"Veneno","hp":60,"atk":85,"def":69,"spd":80,"nextForm":null},

  {"id":25,"name":"Pikachu","type":"Elétrico","hp":35,"atk":55,"def":30,"spd":90,"nextForm":"Raichu","evoTrigger":8},
  {"id":26,"name":"Raichu","type":"Elétrico","hp":60,"atk":90,"def":55,"spd":110,"nextForm":null},

  {"id":27,"name":"Sandshrew","type":"Terra","hp":50,"atk":75,"def":85,"spd":40,"nextForm":"Sandslash","evoTrigger":8},
  {"id":28,"name":"Sandslash","type":"Terra","hp":75,"atk":100,"def":110,"spd":65,"nextForm":null},

  {"id":29,"name":"Nidoran♀","type":"Veneno","hp":55,"atk":47,"def":52,"spd":41,"nextForm":"Nidorina","evoTrigger":5},
  {"id":30,"name":"Nidorina","type":"Veneno","hp":70,"atk":62,"def":67,"spd":56,"nextForm":"Nidoqueen","evoTrigger":10},
  {"id":31,"name":"Nidoqueen","type":"Veneno","hp":90,"atk":82,"def":87,"spd":76,"nextForm":null},

  {"id":32,"name":"Nidoran♂","type":"Veneno","hp":46,"atk":57,"def":40,"spd":50,"nextForm":"Nidorino","evoTrigger":5},
  {"id":33,"name":"Nidorino","type":"Veneno","hp":61,"atk":72,"def":57,"spd":65,"nextForm":"Nidoking","evoTrigger":10},
  {"id":34,"name":"Nidoking","type":"Veneno","hp":81,"atk":92,"def":77,"spd":85,"nextForm":null},

  {"id":35,"name":"Clefairy","type":"Fada","hp":70,"atk":45,"def":48,"spd":35,"nextForm":"Clefable","evoTrigger":8},
  {"id":36,"name":"Clefable","type":"Fada","hp":95,"atk":70,"def":73,"spd":60,"nextForm":null},

  {"id":37,"name":"Vulpix","type":"Fogo","hp":38,"atk":41,"def":40,"spd":65,"nextForm":"Ninetales","evoTrigger":8},
  {"id":38,"name":"Ninetales","type":"Fogo","hp":73,"atk":76,"def":75,"spd":100,"nextForm":null},

  {"id":39,"name":"Jigglypuff","type":"Fada","hp":115,"atk":45,"def":20,"spd":20,"nextForm":"Wigglytuff","evoTrigger":8},
  {"id":40,"name":"Wigglytuff","type":"Fada","hp":140,"atk":70,"def":45,"spd":45,"nextForm":null},

  {"id":41,"name":"Zubat","type":"Veneno","hp":40,"atk":45,"def":35,"spd":55,"nextForm":"Golbat","evoTrigger":8},
  {"id":42,"name":"Golbat","type":"Veneno","hp":75,"atk":80,"def":70,"spd":90,"nextForm":null},

  {"id":43,"name":"Oddish","type":"Grama","hp":45,"atk":50,"def":55,"spd":30,"nextForm":"Gloom","evoTrigger":5},
  {"id":44,"name":"Gloom","type":"Grama","hp":60,"atk":65,"def":70,"spd":40,"nextForm":"Vileplume","evoTrigger":10},
  {"id":45,"name":"Vileplume","type":"Grama","hp":75,"atk":80,"def":85,"spd":50,"nextForm":null},

  {"id":46,"name":"Paras","type":"Inseto","hp":35,"atk":70,"def":55,"spd":25,"nextForm":"Parasect","evoTrigger":8},
  {"id":47,"name":"Parasect","type":"Inseto","hp":60,"atk":95,"def":80,"spd":30,"nextForm":null},

  {"id":48,"name":"Venonat","type":"Inseto","hp":60,"atk":55,"def":50,"spd":45,"nextForm":"Venomoth","evoTrigger":8},
  {"id":49,"name":"Venomoth","type":"Inseto","hp":70,"atk":65,"def":60,"spd":90,"nextForm":null},

  {"id":50,"name":"Diglett","type":"Terra","hp":10,"atk":55,"def":25,"spd":95,"nextForm":"Dugtrio","evoTrigger":8},
  {"id":51,"name":"Dugtrio","type":"Terra","hp":35,"atk":80,"def":50,"spd":120,"nextForm":null},

  {"id":52,"name":"Meowth","type":"Normal","hp":40,"atk":45,"def":35,"spd":90,"nextForm":"Persian","evoTrigger":8},
  {"id":53,"name":"Persian","type":"Normal","hp":65,"atk":70,"def":60,"spd":115,"nextForm":null},

  {"id":54,"name":"Psyduck","type":"Água","hp":50,"atk":52,"def":48,"spd":55,"nextForm":"Golduck","evoTrigger":8},
  {"id":55,"name":"Golduck","type":"Água","hp":80,"atk":82,"def":78,"spd":85,"nextForm":null},

  {"id":56,"name":"Mankey","type":"Lutador","hp":40,"atk":80,"def":35,"spd":70,"nextForm":"Primeape","evoTrigger":8},
  {"id":57,"name":"Primeape","type":"Lutador","hp":65,"atk":105,"def":60,"spd":95,"nextForm":null},

  {"id":58,"name":"Growlithe","type":"Fogo","hp":55,"atk":70,"def":45,"spd":60,"nextForm":"Arcanine","evoTrigger":8},
  {"id":59,"name":"Arcanine","type":"Fogo","hp":90,"atk":110,"def":80,"spd":95,"nextForm":null},

  {"id":60,"name":"Poliwag","type":"Água","hp":40,"atk":50,"def":40,"spd":90,"nextForm":"Poliwhirl","evoTrigger":5},
  {"id":61,"name":"Poliwhirl","type":"Água","hp":65,"atk":65,"def":65,"spd":90,"nextForm":"Poliwrath","evoTrigger":10},
  {"id":62,"name":"Poliwrath","type":"Lutador","hp":90,"atk":95,"def":95,"spd":70,"nextForm":null},

  {"id":63,"name":"Abra","type":"Psíquico","hp":25,"atk":20,"def":15,"spd":90,"nextForm":"Kadabra","evoTrigger":5},
  {"id":64,"name":"Kadabra","type":"Psíquico","hp":40,"atk":35,"def":30,"spd":105,"nextForm":"Alakazam","evoTrigger":10},
  {"id":65,"name":"Alakazam","type":"Psíquico","hp":55,"atk":50,"def":45,"spd":120,"nextForm":null},

  {"id":66,"name":"Machop","type":"Lutador","hp":70,"atk":80,"def":50,"spd":35,"nextForm":"Machoke","evoTrigger":5},
  {"id":67,"name":"Machoke","type":"Lutador","hp":80,"atk":100,"def":70,"spd":45,"nextForm":"Machamp","evoTrigger":10},
  {"id":68,"name":"Machamp","type":"Lutador","hp":90,"atk":130,"def":80,"spd":55,"nextForm":null},

  {"id":69,"name":"Bellsprout","type":"Grama","hp":50,"atk":75,"def":35,"spd":40,"nextForm":"Weepinbell","evoTrigger":5},
  {"id":70,"name":"Weepinbell","type":"Grama","hp":65,"atk":90,"def":50,"spd":55,"nextForm":"Victreebel","evoTrigger":10},
  {"id":71,"name":"Victreebel","type":"Grama","hp":80,"atk":105,"def":65,"spd":70,"nextForm":null},

  {"id":72,"name":"Tentacool","type":"Água","hp":40,"atk":40,"def":35,"spd":70,"nextForm":"Tentacruel","evoTrigger":8},
  {"id":73,"name":"Tentacruel","type":"Água","hp":80,"atk":70,"def":65,"spd":100,"nextForm":null},

  {"id":74,"name":"Geodude","type":"Pedra","hp":40,"atk":80,"def":100,"spd":20,"nextForm":"Graveler","evoTrigger":5},
  {"id":75,"name":"Graveler","type":"Pedra","hp":55,"atk":95,"def":115,"spd":35,"nextForm":"Golem","evoTrigger":10},
  {"id":76,"name":"Golem","type":"Pedra","hp":80,"atk":110,"def":130,"spd":45,"nextForm":null},

  {"id":77,"name":"Ponyta","type":"Fogo","hp":50,"atk":85,"def":55,"spd":90,"nextForm":"Rapidash","evoTrigger":8},
  {"id":78,"name":"Rapidash","type":"Fogo","hp":65,"atk":100,"def":70,"spd":105,"nextForm":null},

  {"id":79,"name":"Slowpoke","type":"Água","hp":90,"atk":65,"def":65,"spd":15,"nextForm":"Slowbro","evoTrigger":8},
  {"id":80,"name":"Slowbro","type":"Água","hp":95,"atk":75,"def":110,"spd":30,"nextForm":null},

  {"id":81,"name":"Magnemite","type":"Elétrico","hp":25,"atk":35,"def":70,"spd":45,"nextForm":"Magneton","evoTrigger":8},
  {"id":82,"name":"Magneton","type":"Elétrico","hp":50,"atk":60,"def":95,"spd":70,"nextForm":null},

  {"id":83,"name":"Farfetch'd","type":"Normal","hp":52,"atk":65,"def":55,"spd":60,"nextForm":null},

  {"id":84,"name":"Doduo","type":"Normal","hp":35,"atk":85,"def":45,"spd":75,"nextForm":"Dodrio","evoTrigger":8},
  {"id":85,"name":"Dodrio","type":"Normal","hp":60,"atk":110,"def":70,"spd":100,"nextForm":null},

  {"id":86,"name":"Seel","type":"Água","hp":65,"atk":45,"def":55,"spd":45,"nextForm":"Dewgong","evoTrigger":8},
  {"id":87,"name":"Dewgong","type":"Gelo","hp":90,"atk":70,"def":80,"spd":70,"nextForm":null},

  {"id":88,"name":"Grimer","type":"Veneno","hp":80,"atk":80,"def":50,"spd":25,"nextForm":"Muk","evoTrigger":8},
  {"id":89,"name":"Muk","type":"Veneno","hp":105,"atk":105,"def":75,"spd":50,"nextForm":null},

  {"id":90,"name":"Shellder","type":"Água","hp":30,"atk":65,"def":100,"spd":40,"nextForm":"Cloyster","evoTrigger":8},
  {"id":91,"name":"Cloyster","type":"Gelo","hp":50,"atk":95,"def":180,"spd":70,"nextForm":null},

  {"id":92,"name":"Gastly","type":"Fantasma","hp":30,"atk":35,"def":30,"spd":80,"nextForm":"Haunter","evoTrigger":5},
  {"id":93,"name":"Haunter","type":"Fantasma","hp":45,"atk":50,"def":45,"spd":95,"nextForm":"Gengar","evoTrigger":10},
  {"id":94,"name":"Gengar","type":"Fantasma","hp":60,"atk":65,"def":60,"spd":110,"nextForm":null},

  {"id":95,"name":"Onix","type":"Pedra","hp":35,"atk":45,"def":160,"spd":70,"nextForm":null},

  {"id":96,"name":"Drowzee","type":"Psíquico","hp":60,"atk":48,"def":45,"spd":42,"nextForm":"Hypno","evoTrigger":8},
  {"id":97,"name":"Hypno","type":"Psíquico","hp":85,"atk":73,"def":70,"spd":67,"nextForm":null},

  {"id":98,"name":"Krabby","type":"Água","hp":30,"atk":105,"def":90,"spd":50,"nextForm":"Kingler","evoTrigger":8},
  {"id":99,"name":"Kingler","type":"Água","hp":55,"atk":130,"def":115,"spd":75,"nextForm":null},

  {"id":100,"name":"Voltorb","type":"Elétrico","hp":40,"atk":30,"def":50,"spd":100,"nextForm":"Electrode","evoTrigger":8},
  {"id":101,"name":"Electrode","type":"Elétrico","hp":60,"atk":50,"def":70,"spd":140,"nextForm":null},

  {"id":102,"name":"Exeggcute","type":"Grama","hp":60,"atk":40,"def":80,"spd":40,"nextForm":"Exeggutor","evoTrigger":8},
  {"id":103,"name":"Exeggutor","type":"Grama","hp":95,"atk":95,"def":85,"spd":55,"nextForm":null},

  {"id":104,"name":"Cubone","type":"Terra","hp":50,"atk":50,"def":95,"spd":35,"nextForm":"Marowak","evoTrigger":8},
  {"id":105,"name":"Marowak","type":"Terra","hp":60,"atk":80,"def":110,"spd":45,"nextForm":null},

  {"id":106,"name":"Hitmonlee","type":"Lutador","hp":50,"atk":120,"def":53,"spd":87,"nextForm":null},

  {"id":107,"name":"Hitmonchan","type":"Lutador","hp":50,"atk":105,"def":79,"spd":76,"nextForm":null},

  {"id":108,"name":"Lickitung","type":"Normal","hp":90,"atk":55,"def":75,"spd":30,"nextForm":null},

  {"id":109,"name":"Koffing","type":"Veneno","hp":40,"atk":65,"def":95,"spd":35,"nextForm":"Weezing","evoTrigger":8},
  {"id":110,"name":"Weezing","type":"Veneno","hp":65,"atk":90,"def":120,"spd":60,"nextForm":null},

  {"id":111,"name":"Rhyhorn","type":"Terra","hp":80,"atk":85,"def":95,"spd":25,"nextForm":"Rhydon","evoTrigger":8},
  {"id":112,"name":"Rhydon","type":"Terra","hp":105,"atk":130,"def":120,"spd":40,"nextForm":null},

  {"id":113,"name":"Chansey","type":"Normal","hp":250,"atk":5,"def":5,"spd":50,"nextForm":null},

  {"id":114,"name":"Tangela","type":"Grama","hp":65,"atk":55,"def":115,"spd":60,"nextForm":null},

  {"id":115,"name":"Kangaskhan","type":"Normal","hp":105,"atk":95,"def":80,"spd":90,"nextForm":null},

  {"id":116,"name":"Horsea","type":"Água","hp":30,"atk":40,"def":70,"spd":60,"nextForm":"Seadra","evoTrigger":8},
  {"id":117,"name":"Seadra","type":"Água","hp":55,"atk":65,"def":95,"spd":85,"nextForm":null},

  {"id":118,"name":"Goldeen","type":"Água","hp":45,"atk":67,"def":60,"spd":63,"nextForm":"Seaking","evoTrigger":8},
  {"id":119,"name":"Seaking","type":"Água","hp":80,"atk":92,"def":65,"spd":68,"nextForm":null},

  {"id":120,"name":"Staryu","type":"Água","hp":30,"atk":45,"def":55,"spd":85,"nextForm":"Starmie","evoTrigger":8},

  {"id":121,"name":"Starmie","type":"Água","hp":60,"atk":75,"def":85,"spd":115,"nextForm":null},

  {"id":122,"name":"Mr. Mime","type":"Fada","hp":40,"atk":45,"def":65,"spd":90,"nextForm":null},

  {"id":123,"name":"Scyther","type":"Inseto","hp":70,"atk":110,"def":80,"spd":105,"nextForm":null},

  {"id":124,"name":"Jynx","type":"Gelo","hp":65,"atk":50,"def":35,"spd":95,"nextForm":null},

  {"id":125,"name":"Electabuzz","type":"Elétrico","hp":65,"atk":83,"def":57,"spd":105,"nextForm":null},

  {"id":126,"name":"Magmar","type":"Fogo","hp":65,"atk":95,"def":57,"spd":93,"nextForm":null},

  {"id":127,"name":"Pinsir","type":"Inseto","hp":65,"atk":125,"def":100,"spd":85,"nextForm":null},

  {"id":128,"name":"Tauros","type":"Normal","hp":75,"atk":100,"def":95,"spd":110,"nextForm":null},

  {"id":129,"name":"Magikarp","type":"Água","hp":20,"atk":10,"def":55,"spd":80,"nextForm":"Gyarados","evoTrigger":8},
  {"id":130,"name":"Gyarados","type":"Água","hp":95,"atk":125,"def":79,"spd":81,"nextForm":null},

  {"id":131,"name":"Lapras","type":"Gelo","hp":130,"atk":85,"def":80,"spd":60,"nextForm":null},

  {"id":132,"name":"Ditto","type":"Normal","hp":48,"atk":48,"def":48,"spd":48,"nextForm":null},

  {"id":133,"name":"Eevee","type":"Normal","hp":55,"atk":55,"def":50,"spd":55,"nextForm":"Vaporeon","evoTrigger":8},
  {"id":134,"name":"Vaporeon","type":"Água","hp":130,"atk":65,"def":60,"spd":65,"nextForm":null},

  {"id":135,"name":"Jolteon","type":"Elétrico","hp":65,"atk":65,"def":60,"spd":130,"nextForm":null},

  {"id":136,"name":"Flareon","type":"Fogo","hp":65,"atk":130,"def":60,"spd":65,"nextForm":null},

  {"id":137,"name":"Porygon","type":"Normal","hp":65,"atk":60,"def":70,"spd":40,"nextForm":null},

  {"id":138,"name":"Omanyte","type":"Pedra","hp":35,"atk":40,"def":100,"spd":35,"nextForm":"Omastar","evoTrigger":8},
  {"id":139,"name":"Omastar","type":"Pedra","hp":70,"atk":60,"def":125,"spd":55,"nextForm":null},

  {"id":140,"name":"Kabuto","type":"Pedra","hp":30,"atk":80,"def":90,"spd":55,"nextForm":"Kabutops","evoTrigger":8},
  {"id":141,"name":"Kabutops","type":"Pedra","hp":60,"atk":115,"def":105,"spd":80,"nextForm":null},

  {"id":142,"name":"Aerodactyl","type":"Pedra","hp":80,"atk":105,"def":65,"spd":130,"nextForm":null},

  {"id":143,"name":"Snorlax","type":"Normal","hp":160,"atk":110,"def":65,"spd":30,"nextForm":null},

  {"id":144,"name":"Articuno","type":"Gelo","hp":90,"atk":85,"def":100,"spd":85,"nextForm":null,"isLegendary":true},

  {"id":145,"name":"Zapdos","type":"Elétrico","hp":90,"atk":90,"def":85,"spd":100,"nextForm":null,"isLegendary":true},

  {"id":146,"name":"Moltres","type":"Fogo","hp":90,"atk":100,"def":90,"spd":90,"nextForm":null,"isLegendary":true},

  {"id":147,"name":"Dratini","type":"Dragão","hp":41,"atk":64,"def":45,"spd":50,"nextForm":"Dragonair","evoTrigger":5},
  {"id":148,"name":"Dragonair","type":"Dragão","hp":61,"atk":84,"def":65,"spd":70,"nextForm":"Dragonite","evoTrigger":10},
  {"id":149,"name":"Dragonite","type":"Dragão","hp":91,"atk":134,"def":95,"spd":80,"nextForm":null},

  {"id":150,"name":"Mewtwo","type":"Psíquico","hp":106,"atk":110,"def":90,"spd":130,"nextForm":null,"isLegendary":true},
  
  {"id":151,"name":"Mew","type":"Psíquico","hp":100,"atk":100,"def":100,"spd":100,"nextForm":null,"isLegendary":true}
];