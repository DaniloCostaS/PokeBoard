import type { PokemonData } from './types';

export const POKEDEX: PokemonData[] = [
  {"id":1,"name":"Bulbasaur","type":"Grama","hp":45,"atk":57,"def":57,"spd":45,"nextForm":"Ivysaur","evoTrigger":5},
  {"id":2,"name":"Ivysaur","type":"Grama","hp":60,"atk":71,"def":72,"spd":60,"nextForm":"Venusaur","evoTrigger":10},
  {"id":3,"name":"Venusaur","type":"Grama","hp":80,"atk":91,"def":92,"spd":80,"nextForm":null},

  {"id":4,"name":"Charmander","type":"Fogo","hp":39,"atk":56,"def":47,"spd":65,"nextForm":"Charmeleon","evoTrigger":5},
  {"id":5,"name":"Charmeleon","type":"Fogo","hp":58,"atk":72,"def":62,"spd":80,"nextForm":"Charizard","evoTrigger":10},
  {"id":6,"name":"Charizard","type":"Fogo","hp":78,"atk":97,"def":82,"spd":100,"nextForm":null},

  {"id":7,"name":"Squirtle","type":"Água","hp":44,"atk":49,"def":65,"spd":43,"nextForm":"Wartortle","evoTrigger":5},
  {"id":8,"name":"Wartortle","type":"Água","hp":59,"atk":64,"def":80,"spd":58,"nextForm":"Blastoise","evoTrigger":10},
  {"id":9,"name":"Blastoise","type":"Água","hp":79,"atk":84,"def":103,"spd":78,"nextForm":null},

  {"id":10,"name":"Caterpie","type":"Inseto","hp":45,"atk":25,"def":28,"spd":45,"nextForm":"Metapod","evoTrigger":5},
  {"id":11,"name":"Metapod","type":"Inseto","hp":50,"atk":23,"def":40,"spd":30,"nextForm":"Butterfree","evoTrigger":10},
  {"id":12,"name":"Butterfree","type":"Inseto","hp":60,"atk":68,"def":65,"spd":70,"nextForm":null},

  {"id":13,"name":"Weedle","type":"Inseto","hp":40,"atk":28,"def":25,"spd":50,"nextForm":"Kakuna","evoTrigger":5},
  {"id":14,"name":"Kakuna","type":"Inseto","hp":45,"atk":25,"def":38,"spd":35,"nextForm":"Beedrill","evoTrigger":10},
  {"id":15,"name":"Beedrill","type":"Inseto","hp":65,"atk":68,"def":60,"spd":75,"nextForm":null},

  {"id":16,"name":"Pidgey","type":"Normal","hp":40,"atk":40,"def":38,"spd":56,"nextForm":"Pidgeotto","evoTrigger":5},
  {"id":17,"name":"Pidgeotto","type":"Normal","hp":63,"atk":55,"def":53,"spd":71,"nextForm":"Pidgeot","evoTrigger":10},
  {"id":18,"name":"Pidgeot","type":"Normal","hp":83,"atk":75,"def":73,"spd":91,"nextForm":null},

  {"id":19,"name":"Rattata","type":"Normal","hp":30,"atk":41,"def":35,"spd":72,"nextForm":"Raticate","evoTrigger":8},
  {"id":20,"name":"Raticate","type":"Normal","hp":55,"atk":66,"def":65,"spd":97,"nextForm":null},

  {"id":21,"name":"Spearow","type":"Normal","hp":40,"atk":46,"def":31,"spd":70,"nextForm":"Fearow","evoTrigger":8},
  {"id":22,"name":"Fearow","type":"Normal","hp":65,"atk":76,"def":63,"spd":100,"nextForm":null},

  {"id":23,"name":"Ekans","type":"Veneno","hp":35,"atk":50,"def":49,"spd":55,"nextForm":"Arbok","evoTrigger":8},
  {"id":24,"name":"Arbok","type":"Veneno","hp":60,"atk":80,"def":74,"spd":80,"nextForm":null},

  {"id":25,"name":"Pikachu","type":"Elétrico","hp":35,"atk":53,"def":45,"spd":90,"nextForm":"Raichu","evoTrigger":8},
  {"id":26,"name":"Raichu","type":"Elétrico","hp":60,"atk":90,"def":68,"spd":110,"nextForm":null},

  {"id":27,"name":"Sandshrew","type":"Terra","hp":50,"atk":48,"def":58,"spd":40,"nextForm":"Sandslash","evoTrigger":8},
  {"id":28,"name":"Sandslash","type":"Terra","hp":75,"atk":73,"def":83,"spd":65,"nextForm":null},

  {"id":29,"name":"Nidoran♀","type":"Veneno","hp":55,"atk":44,"def":46,"spd":41,"nextForm":"Nidorina","evoTrigger":5},
  {"id":30,"name":"Nidorina","type":"Veneno","hp":70,"atk":59,"def":61,"spd":56,"nextForm":"Nidoqueen","evoTrigger":10},
  {"id":31,"name":"Nidoqueen","type":"Veneno","hp":90,"atk":84,"def":86,"spd":76,"nextForm":null},

  {"id":32,"name":"Nidoran♂","type":"Veneno","hp":46,"atk":49,"def":40,"spd":50,"nextForm":"Nidorino","evoTrigger":5},
  {"id":33,"name":"Nidorino","type":"Veneno","hp":61,"atk":64,"def":56,"spd":65,"nextForm":"Nidoking","evoTrigger":10},
  {"id":34,"name":"Nidoking","type":"Veneno","hp":81,"atk":94,"def":76,"spd":85,"nextForm":null},

  {"id":35,"name":"Clefairy","type":"Fada","hp":70,"atk":53,"def":57,"spd":35,"nextForm":"Clefable","evoTrigger":8},
  {"id":36,"name":"Clefable","type":"Fada","hp":95,"atk":83,"def":82,"spd":60,"nextForm":null},

  {"id":37,"name":"Vulpix","type":"Fogo","hp":38,"atk":46,"def":53,"spd":65,"nextForm":"Ninetales","evoTrigger":8},
  {"id":38,"name":"Ninetales","type":"Fogo","hp":73,"atk":79,"def":88,"spd":100,"nextForm":null},

  {"id":39,"name":"Jigglypuff","type":"Fada","hp":115,"atk":45,"def":23,"spd":20,"nextForm":"Wigglytuff","evoTrigger":8},
  {"id":40,"name":"Wigglytuff","type":"Fada","hp":140,"atk":78,"def":48,"spd":45,"nextForm":null},

  {"id":41,"name":"Zubat","type":"Veneno","hp":40,"atk":38,"def":38,"spd":55,"nextForm":"Golbat","evoTrigger":8},
  {"id":42,"name":"Golbat","type":"Veneno","hp":75,"atk":73,"def":73,"spd":90,"nextForm":null},

  {"id":43,"name":"Oddish","type":"Grama","hp":45,"atk":63,"def":60,"spd":30,"nextForm":"Gloom","evoTrigger":5},
  {"id":44,"name":"Gloom","type":"Grama","hp":60,"atk":75,"def":73,"spd":40,"nextForm":"Vileplume","evoTrigger":10},
  {"id":45,"name":"Vileplume","type":"Grama","hp":75,"atk":95,"def":88,"spd":50,"nextForm":null},

  {"id":46,"name":"Paras","type":"Inseto","hp":35,"atk":58,"def":55,"spd":25,"nextForm":"Parasect","evoTrigger":8},
  {"id":47,"name":"Parasect","type":"Inseto","hp":60,"atk":78,"def":80,"spd":30,"nextForm":null},

  {"id":48,"name":"Venonat","type":"Inseto","hp":60,"atk":48,"def":53,"spd":45,"nextForm":"Venomoth","evoTrigger":8},
  {"id":49,"name":"Venomoth","type":"Inseto","hp":70,"atk":78,"def":68,"spd":90,"nextForm":null},

  {"id":50,"name":"Diglett","type":"Terra","hp":10,"atk":45,"def":35,"spd":95,"nextForm":"Dugtrio","evoTrigger":8},
  {"id":51,"name":"Dugtrio","type":"Terra","hp":35,"atk":75,"def":60,"spd":120,"nextForm":null},

  {"id":52,"name":"Meowth","type":"Normal","hp":40,"atk":43,"def":38,"spd":90,"nextForm":"Persian","evoTrigger":8},
  {"id":53,"name":"Persian","type":"Normal","hp":65,"atk":68,"def":63,"spd":115,"nextForm":null},

  {"id":54,"name":"Psyduck","type":"Água","hp":50,"atk":59,"def":49,"spd":55,"nextForm":"Golduck","evoTrigger":8},
  {"id":55,"name":"Golduck","type":"Água","hp":80,"atk":89,"def":79,"spd":85,"nextForm":null},

  {"id":56,"name":"Mankey","type":"Lutador","hp":40,"atk":58,"def":40,"spd":70,"nextForm":"Primeape","evoTrigger":8},
  {"id":57,"name":"Primeape","type":"Lutador","hp":65,"atk":83,"def":65,"spd":95,"nextForm":null},

  {"id":58,"name":"Growlithe","type":"Fogo","hp":55,"atk":70,"def":48,"spd":60,"nextForm":"Arcanine","evoTrigger":8},
  {"id":59,"name":"Arcanine","type":"Fogo","hp":90,"atk":105,"def":80,"spd":95,"nextForm":null},

  {"id":60,"name":"Poliwag","type":"Água","hp":40,"atk":45,"def":40,"spd":90,"nextForm":"Poliwhirl","evoTrigger":5},
  {"id":61,"name":"Poliwhirl","type":"Água","hp":65,"atk":58,"def":58,"spd":90,"nextForm":"Poliwrath","evoTrigger":10},
  {"id":62,"name":"Poliwrath","type":"Lutador","hp":90,"atk":83,"def":93,"spd":70,"nextForm":null},

  {"id":63,"name":"Abra","type":"Psíquico","hp":25,"atk":63,"def":35,"spd":90,"nextForm":"Kadabra","evoTrigger":5},
  {"id":64,"name":"Kadabra","type":"Psíquico","hp":40,"atk":78,"def":50,"spd":105,"nextForm":"Alakazam","evoTrigger":10},
  {"id":65,"name":"Alakazam","type":"Psíquico","hp":55,"atk":93,"def":70,"spd":120,"nextForm":null},

  {"id":66,"name":"Machop","type":"Lutador","hp":70,"atk":58,"def":43,"spd":35,"nextForm":"Machoke","evoTrigger":5},
  {"id":67,"name":"Machoke","type":"Lutador","hp":80,"atk":75,"def":65,"spd":45,"nextForm":"Machamp","evoTrigger":10},
  {"id":68,"name":"Machamp","type":"Lutador","hp":90,"atk":98,"def":83,"spd":55,"nextForm":null},

  {"id":69,"name":"Bellsprout","type":"Grama","hp":50,"atk":73,"def":33,"spd":40,"nextForm":"Weepinbell","evoTrigger":5},
  {"id":70,"name":"Weepinbell","type":"Grama","hp":65,"atk":88,"def":48,"spd":55,"nextForm":"Victreebel","evoTrigger":10},
  {"id":71,"name":"Victreebel","type":"Grama","hp":80,"atk":103,"def":68,"spd":70,"nextForm":null},

  {"id":72,"name":"Tentacool","type":"Água","hp":40,"atk":45,"def":68,"spd":70,"nextForm":"Tentacruel","evoTrigger":8},
  {"id":73,"name":"Tentacruel","type":"Água","hp":80,"atk":75,"def":93,"spd":100,"nextForm":null},

  {"id":74,"name":"Geodude","type":"Pedra","hp":40,"atk":55,"def":65,"spd":20,"nextForm":"Graveler","evoTrigger":5},
  {"id":75,"name":"Graveler","type":"Pedra","hp":55,"atk":70,"def":80,"spd":35,"nextForm":"Golem","evoTrigger":10},
  {"id":76,"name":"Golem","type":"Pedra","hp":80,"atk":89,"def":98,"spd":45,"nextForm":null},

  {"id":77,"name":"Ponyta","type":"Fogo","hp":50,"atk":75,"def":60,"spd":90,"nextForm":"Rapidash","evoTrigger":8},
  {"id":78,"name":"Rapidash","type":"Fogo","hp":65,"atk":90,"def":75,"spd":105,"nextForm":null},

  {"id":79,"name":"Slowpoke","type":"Água","hp":90,"atk":53,"def":53,"spd":15,"nextForm":"Slowbro","evoTrigger":8},
  {"id":80,"name":"Slowbro","type":"Água","hp":95,"atk":88,"def":95,"spd":30,"nextForm":null},

  {"id":81,"name":"Magnemite","type":"Elétrico","hp":25,"atk":65,"def":63,"spd":45,"nextForm":"Magneton","evoTrigger":8},
  {"id":82,"name":"Magneton","type":"Elétrico","hp":50,"atk":90,"def":83,"spd":70,"nextForm":null},

  {"id":83,"name":"Farfetch'd","type":"Normal","hp":52,"atk":74,"def":59,"spd":60,"nextForm":null},

  {"id":84,"name":"Doduo","type":"Normal","hp":35,"atk":60,"def":40,"spd":75,"nextForm":"Dodrio","evoTrigger":8},
  {"id":85,"name":"Dodrio","type":"Normal","hp":60,"atk":85,"def":65,"spd":100,"nextForm":null},

  {"id":86,"name":"Seel","type":"Água","hp":65,"atk":45,"def":63,"spd":45,"nextForm":"Dewgong","evoTrigger":8},
  {"id":87,"name":"Dewgong","type":"Gelo","hp":90,"atk":70,"def":88,"spd":70,"nextForm":null},

  {"id":88,"name":"Grimer","type":"Veneno","hp":80,"atk":60,"def":50,"spd":25,"nextForm":"Muk","evoTrigger":8},
  {"id":89,"name":"Muk","type":"Veneno","hp":105,"atk":85,"def":88,"spd":50,"nextForm":null},

  {"id":90,"name":"Shellder","type":"Água","hp":30,"atk":55,"def":63,"spd":40,"nextForm":"Cloyster","evoTrigger":8},
  {"id":91,"name":"Cloyster","type":"Gelo","hp":50,"atk":90,"def":113,"spd":70,"nextForm":null},

  {"id":92,"name":"Gastly","type":"Fantasma","hp":30,"atk":68,"def":33,"spd":80,"nextForm":"Haunter","evoTrigger":5},
  {"id":93,"name":"Haunter","type":"Fantasma","hp":45,"atk":83,"def":50,"spd":95,"nextForm":"Gengar","evoTrigger":10},
  {"id":94,"name":"Gengar","type":"Fantasma","hp":60,"atk":98,"def":68,"spd":110,"nextForm":null},

  {"id":95,"name":"Onix","type":"Pedra","hp":35,"atk":38,"def":103,"spd":70,"nextForm":null},

  {"id":96,"name":"Drowzee","type":"Psíquico","hp":60,"atk":46,"def":68,"spd":42,"nextForm":"Hypno","evoTrigger":8},
  {"id":97,"name":"Hypno","type":"Psíquico","hp":85,"atk":73,"def":93,"spd":67,"nextForm":null},

  {"id":98,"name":"Krabby","type":"Água","hp":30,"atk":65,"def":56,"spd":50,"nextForm":"Kingler","evoTrigger":8},
  {"id":99,"name":"Kingler","type":"Água","hp":55,"atk":90,"def":83,"spd":75,"nextForm":null},

  {"id":100,"name":"Voltorb","type":"Elétrico","hp":40,"atk":43,"def":53,"spd":100,"nextForm":"Electrode","evoTrigger":8},
  {"id":101,"name":"Electrode","type":"Elétrico","hp":60,"atk":65,"def":75,"spd":140,"nextForm":null},

  {"id":102,"name":"Exeggcute","type":"Grama","hp":60,"atk":50,"def":63,"spd":40,"nextForm":"Exeggutor","evoTrigger":8},
  {"id":103,"name":"Exeggutor","type":"Grama","hp":95,"atk":110,"def":80,"spd":55,"nextForm":null},

  {"id":104,"name":"Cubone","type":"Terra","hp":50,"atk":45,"def":73,"spd":35,"nextForm":"Marowak","evoTrigger":8},
  {"id":105,"name":"Marowak","type":"Terra","hp":60,"atk":65,"def":95,"spd":45,"nextForm":null},

  {"id":106,"name":"Hitmonlee","type":"Lutador","hp":50,"atk":78,"def":82,"spd":87,"nextForm":null},

  {"id":107,"name":"Hitmonchan","type":"Lutador","hp":50,"atk":70,"def":95,"spd":76,"nextForm":null},

  {"id":108,"name":"Lickitung","type":"Normal","hp":90,"atk":58,"def":75,"spd":30,"nextForm":null},

  {"id":109,"name":"Koffing","type":"Veneno","hp":40,"atk":63,"def":70,"spd":35,"nextForm":"Weezing","evoTrigger":8},
  {"id":110,"name":"Weezing","type":"Veneno","hp":65,"atk":88,"def":95,"spd":60,"nextForm":null},

  {"id":111,"name":"Rhyhorn","type":"Terra","hp":80,"atk":56,"def":63,"spd":25,"nextForm":"Rhydon","evoTrigger":8},
  {"id":112,"name":"Rhydon","type":"Terra","hp":105,"atk":88,"def":83,"spd":40,"nextForm":null},

  {"id":113,"name":"Chansey","type":"Normal","hp":250,"atk":20,"def":55,"spd":50,"nextForm":null},

  {"id":114,"name":"Tangela","type":"Grama","hp":65,"atk":78,"def":78,"spd":60,"nextForm":null},

  {"id":115,"name":"Kangaskhan","type":"Normal","hp":105,"atk":68,"def":80,"spd":90,"nextForm":null},

  {"id":116,"name":"Horsea","type":"Água","hp":30,"atk":55,"def":48,"spd":60,"nextForm":"Seadra","evoTrigger":8},
  {"id":117,"name":"Seadra","type":"Água","hp":55,"atk":80,"def":70,"spd":85,"nextForm":null},

  {"id":118,"name":"Goldeen","type":"Água","hp":45,"atk":51,"def":55,"spd":63,"nextForm":"Seaking","evoTrigger":8},
  {"id":119,"name":"Seaking","type":"Água","hp":80,"atk":79,"def":73,"spd":68,"nextForm":null},

  {"id":120,"name":"Staryu","type":"Água","hp":30,"atk":58,"def":55,"spd":85,"nextForm":"Starmie","evoTrigger":8},
  {"id":121,"name":"Starmie","type":"Água","hp":60,"atk":88,"def":85,"spd":115,"nextForm":null},

  {"id":122,"name":"Mr. Mime","type":"Fada","hp":40,"atk":73,"def":93,"spd":90,"nextForm":null},

  {"id":123,"name":"Scyther","type":"Inseto","hp":70,"atk":83,"def":80,"spd":105,"nextForm":null},

  {"id":124,"name":"Jynx","type":"Gelo","hp":65,"atk":83,"def":65,"spd":95,"nextForm":null},

  {"id":125,"name":"Electabuzz","type":"Elétrico","hp":65,"atk":89,"def":71,"spd":105,"nextForm":null},

  {"id":126,"name":"Magmar","type":"Fogo","hp":65,"atk":98,"def":71,"spd":93,"nextForm":null},

  {"id":127,"name":"Pinsir","type":"Inseto","hp":65,"atk":90,"def":85,"spd":85,"nextForm":null},

  {"id":128,"name":"Tauros","type":"Normal","hp":75,"atk":70,"def":83,"spd":110,"nextForm":null},

  {"id":129,"name":"Magikarp","type":"Água","hp":20,"atk":13,"def":38,"spd":80,"nextForm":"Gyarados","evoTrigger":8},
  {"id":130,"name":"Gyarados","type":"Água","hp":95,"atk":93,"def":90,"spd":81,"nextForm":null},

  {"id":131,"name":"Lapras","type":"Gelo","hp":130,"atk":85,"def":88,"spd":60,"nextForm":null},

  {"id":132,"name":"Ditto","type":"Normal","hp":48,"atk":48,"def":48,"spd":48,"nextForm":null},

  {"id":133,"name":"Eevee","type":"Normal","hp":55,"atk":50,"def":58,"spd":55,"nextForm":"Vaporeon","evoTrigger":8},
  {"id":134,"name":"Vaporeon","type":"Água","hp":130,"atk":88,"def":78,"spd":65,"nextForm":null},

  {"id":135,"name":"Jolteon","type":"Elétrico","hp":65,"atk":88,"def":78,"spd":130,"nextForm":null},

  {"id":136,"name":"Flareon","type":"Fogo","hp":65,"atk":113,"def":85,"spd":65,"nextForm":null},

  {"id":137,"name":"Porygon","type":"Normal","hp":65,"atk":73,"def":73,"spd":40,"nextForm":null},

  {"id":138,"name":"Omanyte","type":"Pedra","hp":35,"atk":65,"def":78,"spd":35,"nextForm":"Omastar","evoTrigger":8},
  {"id":139,"name":"Omastar","type":"Pedra","hp":70,"atk":88,"def":98,"spd":55,"nextForm":null},

  {"id":140,"name":"Kabuto","type":"Pedra","hp":30,"atk":68,"def":68,"spd":55,"nextForm":"Kabutops","evoTrigger":8},
  {"id":141,"name":"Kabutops","type":"Pedra","hp":60,"atk":90,"def":88,"spd":80,"nextForm":null},

  {"id":142,"name":"Aerodactyl","type":"Pedra","hp":80,"atk":83,"def":70,"spd":130,"nextForm":null},

  {"id":143,"name":"Snorlax","type":"Normal","hp":160,"atk":88,"def":88,"spd":30,"nextForm":null},

  {"id":144,"name":"Articuno","type":"Gelo","hp":90,"atk":90,"def":113,"spd":85,"nextForm":null,"isLegendary":true},

  {"id":145,"name":"Zapdos","type":"Elétrico","hp":90,"atk":108,"def":88,"spd":100,"nextForm":null,"isLegendary":true},
  
  {"id":146,"name":"Moltres","type":"Fogo","hp":90,"atk":113,"def":88,"spd":90,"nextForm":null,"isLegendary":true},

  {"id":147,"name":"Dratini","type":"Dragão","hp":41,"atk":57,"def":48,"spd":50,"nextForm":"Dragonair","evoTrigger":5},
  {"id":148,"name":"Dragonair","type":"Dragão","hp":61,"atk":77,"def":68,"spd":70,"nextForm":"Dragonite","evoTrigger":10},
  {"id":149,"name":"Dragonite","type":"Dragão","hp":91,"atk":117,"def":98,"spd":80,"nextForm":null},

  {"id":150,"name":"Mewtwo","type":"Psíquico","hp":106,"atk":132,"def":90,"spd":130,"nextForm":null,"isLegendary":true},

  {"id":151,"name":"Mew","type":"Psíquico","hp":100,"atk":100,"def":100,"spd":100,"nextForm":null,"isLegendary":true}
];