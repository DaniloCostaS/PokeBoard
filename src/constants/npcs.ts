export const NPC_DATA: Record<number, {name: string, gold: number, team: number[], img: string}> = {
    // --- GERAÇÃO 1 (Kanto) ---
    // Tema: Veneno, Normal, Pokémon "criminosos" e de esgoto (Ratos, Morcegos, Cobras)
    7: { 
        name: "Rocket Grunt", 
        gold: 300, 
        team: [
            19, 20,   // Rattata, Raticate
            23, 24,   // Ekans, Arbok
            41, 42,   // Zubat, Golbat
            52, 53,   // Meowth, Persian
            88, 89,   // Grimer, Muk
            96,       // Drowzee
            109, 110, // Koffing, Weezing
            228, 229, // Houndour, Houndoom (Johto)
            434, 435, // Stunky, Skuntank (Sinnoh)
            509, 510, // Purrloin, Liepard (Unova)
            559,      // Scraggy (Unova)
            757,      // Salandit (Alola)
            827, 828, // Nickit, Thievul (Galar)
            944       // Shroodle (Paldea)
        ], 
        img: "Rocket.jpg" 
    }, 
    
    // Tema: Veneno, Lutador, Fogo e visual "punk" ou agressivo
    8: { 
        name: "Motoqueiro", 
        gold: 250, 
        team: [
            21, 22,   // Spearow, Fearow
            56, 57,   // Mankey, Primeape
            88, 89,   // Grimer, Muk
            104, 105, // Cubone, Marowak
            110,      // Weezing
            229,      // Houndoom
            453, 454, // Croagunk, Toxicroak
            544, 545, // Whirlipede, Scolipede
            560,      // Scrafty
            758,      // Salazzle
            849,      // Toxtricity (Galar)
            861,      // Grimmsnarl (Galar)
            965, 966  // Varoom, Revavroom (Paldea - O Pokémon motor!)
        ], 
        img: "Motoqueiro.jpg" 
    }, 
    
    // Tema: Insetos, Pássaros e Roedores de rota inicial (Pokémons pequenos e fofos)
    9: { 
        name: "Jovem", 
        gold: 200, 
        team: [
            10, 11,   // Caterpie, Metapod
            13, 14,   // Weedle, Kakuna
            16, 19,   // Pidgey, Rattata
            21, 25,   // Spearow, Pikachu
            29, 32,   // Nidoran F/M
            161, 165, // Sentret, Ledyba
            261, 263, // Poochyena, Zigzagoon
            276,      // Taillow
            396, 399, // Starly, Bidoof
            504, 506, // Patrat, Lillipup
            659, 661, // Bunnelby, Fletchling
            734, 731, // Yungoos, Pikipek
            819, 831, // Skwovet, Wooloo
            915, 917, 921 // Lechonk, Tarountula, Pawmi
        ], 
        img: "Jovem.jpg" 
    }, 
    
    // Tema: Pokémon de estimação "caros", Fogo (Caninos) e Elétrico
    10: { 
        name: "Velho", 
        gold: 350, 
        team: [
            58, 59,   // Growlithe, Arcanine
            37, 38,   // Vulpix, Ninetales
            77, 78,   // Ponyta, Rapidash
            100, 101, // Voltorb, Electrode
            126,      // Magmar
            128,      // Tauros
            129,      // Magikarp (Clássico)
            209, 210, // Snubbull, Granbull (Cães de guarda)
            309, 310, // Electrike, Manectric
            441,      // Chatot
            507, 508, // Herdier, Stoutland (Cão leal)
            676,      // Furfrou
            835, 836, // Yamper, Boltund
            854, 855, // Sinistea, Polteageist (Hora do chá)
            942, 943  // Maschiff, Mabosstiff
        ], 
        img: "Velho.jpg" 
    }, 

    // --- GERAÇÃO 2 (Johto) ---
    // Tema: Insetos (Focados em evolução, casulos e redes)
    11: { 
        name: "Caçador de Insetos", 
        gold: 200, 
        team: [
            10, 13, 11, 14, // Larvas e Casulos de Kanto
            46, 48,   // Paras, Venonat
            123, 127, // Scyther, Pinsir (Os raros!)
            165, 167, // Ledyba, Spinarak
            193,      // Yanma
            204, 214, // Pineco, Heracross
            265, 290, // Wurmple, Nincada
            313, 314, // Volbeat, Illumise
            401, 402, // Kricketot, Kricketune
            412, 415, // Burmy, Combee
            540, 557, // Sewaddle, Dwebble
            595,      // Joltik
            736, 742, // Grubbin, Cutiefly
            824, 872, // Blipbug, Snom
            919, 953  // Nymble, Rellor
        ], 
        img: "CaçadorInsetos.jpg" 
    },
    
    // Tema: Água (Marinhos, Peixes e Pescadores)
    12: { 
        name: "Nadador", 
        gold: 250, 
        team: [
            60, 72,   // Poliwag, Tentacool
            90, 98,   // Shellder, Krabby
            116, 118, // Horsea, Goldeen
            120, 129, // Staryu, Magikarp
            131,      // Lapras
            170, 183, // Chinchou, Marill
            194, 211, // Wooper, Qwilfish
            222, 223, // Corsola, Remoraid
            278,      // Wingull
            318, 320, // Carvanha, Wailmer
            370,      // Luvdisc
            418, 456, // Buizel, Finneon
            550, 594, // Basculin, Alomomola
            746, 771, // Wishiwashi, Pyukumuku
            833, 846, // Chewtle, Arrokuda
            960, 963, 976 // Wiglett, Finizen, Veluza
        ], 
        img: "Nadador.jpg" 
    }, 
    
    // Tema: Eeveelutions, Fada, Psíquico e Pokémon "Elegantes/Bonitos"
    13: { 
        name: "Garota Kimono", 
        gold: 350, 
        team: [
            133,      // Eevee
            134, 135, 136, // Vaporeon, Jolteon, Flareon
            196, 197, // Espeon, Umbreon
            35, 36,   // Clefairy, Clefable
            39, 40,   // Jigglypuff, Wigglytuff
            176, 182, // Togetic, Bellossom
            234, 235, // Stantler, Smeargle
            241,      // Miltank
            282, 315, // Gardevoir, Roselia
            300, 301, // Skitty, Delcatty
            358,      // Chimecho
            428,      // Lopunny
            470, 471, // Leafeon, Glaceon
            549, 573, // Lilligant, Cinccino
            671, 700, // Florges, Sylveon (A estrela das fadas)
            730, 763, // Primarina, Tsareena
            869,      // Alcremie
            959       // Tinkaton
        ], 
        img: "KimonoGirl.jpg" 
    }, 
    
    // Tema: Rival Silver (Noturno, Voador, Fantasma, Aço - Time balanceado e forte)
    14: { 
        name: "Rival Johto", 
        gold: 400, 
        team: [
            157, 160, 154, // Iniciais de Johto evoluídos
            169,      // Crobat
            212,      // Scizor
            215, 461, // Sneasel, Weavile
            227,      // Skarmory
            229,      // Houndoom
            246, 248, // Larvitar, Tyranitar
            92, 93, 94, // Gastly, Haunter, Gengar
            81, 82, 462, // Magnemite, Magneton, Magnezone
            198, 430, // Murkrow, Honchkrow
            429,      // Mismagius
            625, 983, // Bisharp, Kingambit
            658,      // Greninja
            908       // Meowscarada
        ], 
        img: "RivalJohto.jpg" 
    }, 

    // --- GERAÇÃO 3 (Hoenn) ---
    // Tema: Água, Noturno, Veneno (Foco em piratas, tubarões e crustáceos)
    15: { 
        name: "Capanga Aqua", 
        gold: 300, 
        team: [
            261, 262, // Poochyena, Mightyena
            318, 319, // Carvanha, Sharpedo (Assinatura!)
            320, 321, // Wailmer, Wailord
            341, 342, // Corphish, Crawdaunt
            41, 42,   // Zubat, Golbat
            72, 73,   // Tentacool, Tentacruel
            88, 89,   // Grimer, Muk
            278, 279, // Wingull, Pelipper
            363, 365, // Spheal, Walrein
            453,      // Croagunk
            535, 537, // Tympole, Seismitoad
            747, 748, // Mareanie, Toxapex (Veneno/Água perfeito pro tema)
            847,      // Barraskewda
            912       // Quaxly
        ], 
        img: "TeamAqua.jpg" 
    }, 
    
    // Tema: Fogo, Terra, Veneno, Pedra (Foco em vulcões e cavernas)
    16: { 
        name: "Capanga Magma", 
        gold: 300, 
        team: [
            261, 262, // Poochyena, Mightyena
            322, 323, // Numel, Camerupt (Assinatura!)
            324,      // Torkoal
            336,      // Seviper
            41, 42,   // Zubat, Golbat
            109, 110, // Koffing, Weezing
            74, 75,   // Geodude, Graveler
            218, 219, // Slugma, Magcargo
            343, 344, // Baltoy, Claydol
            554, 555, // Darumaka, Darmanitan
            757, 776, // Salandit, Turtonator
            838, 839, // Carkol, Coalossal
            952       // Scovillain
        ], 
        img: "TeamMagma.jpg" 
    }, 
    
    // Tema: Pedra, Terra, Lutador (Montanhistas e cavernas)
    17: { 
        name: "Montanhista", 
        gold: 250, 
        team: [
            74, 75, 76, // Geodude, Graveler, Golem
            95,         // Onix
            111, 112,   // Rhyhorn, Rhydon
            293, 294,   // Whismur, Loudred
            296, 297,   // Makuhita, Hariyama
            299, 476,   // Nosepass, Probopass
            304, 305, 306, // Aron, Lairon, Aggron
            328,        // Trapinch
            408, 410,   // Cranidos, Shieldon
            524, 525, 526, // Roggenrola, Boldore, Gigalith
            529, 532,   // Drilbur, Timburr
            749,        // Mudbray
            837, 874,   // Rolycoly, Stonjourner
            932, 933, 934, // Nacli, Naclstack, Garganacl (O sal da terra)
            950         // Klawf
        ], 
        img: "Montanhista.jpg" 
    }, 
    
    // Tema: Pokémon "Inteligentes", Psíquicos, Elétricos ou Estratégicos
    18: { 
        name: "Schoolboy", 
        gold: 400, 
        team: [
            63, 64,   // Abra, Kadabra
            81, 82,   // Magnemite, Magneton
            137,      // Porygon
            177, 203, // Natu, Girafarig
            280, 281, // Ralts, Kirlia
            287,      // Slakoth
            309, 310, // Electrike, Manectric
            315,      // Roselia
            325, 327, // Spoink, Spinda
            359,      // Absol
            371,      // Bagon
            403, 404, // Shinx, Luxio
            577, 605, // Solosis, Elgyem
            677, 694, // Espurr, Helioptile
            737,      // Charjabug (Bateria!)
            825, 856, // Dottler, Hatenna
            935, 938  // Charcadet, Tadbulb
        ], 
        img: "Schoolboy.jpg" 
    } 
};