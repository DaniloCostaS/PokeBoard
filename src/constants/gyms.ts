import type { GymData } from './types';

export const GYM_DATA: GymData[] = [
    {
        id: 1, leaderName: "Brock", type: ["Pedra","Aço"],
        teamIds: [74, 95], // Geodude, Onix
        badgeImg: "Pedra.png", leaderImg: "Brock.png", gymImg: "Pedra.png"
    },
    {
        id: 2, leaderName: "Misty", type: ["Água","Gelo"],
        teamIds: [120, 121], // Staryu, Starmie
        badgeImg: "Agua.png", leaderImg: "Misty.png", gymImg: "Agua.png"
    },
    {
        id: 3, leaderName: "Surge", type: ["Elétrico","Voador"],
        teamIds: [100, 25, 26], // Voltorb, Pikachu, Raichu
        badgeImg: "Eletrico.png", leaderImg: "Surge.png", gymImg: "Eletrico.png"
    },
    {
        id: 4, leaderName: "Erika", type: ["Planta","Inseto"],
        teamIds: [71, 114, 45], // Victreebel, Tangela, Vileplume
        badgeImg: "Planta.png", leaderImg: "Erika.png", gymImg: "Planta.png"
    },
    {
        id: 5, leaderName: "Koga", type: ["Veneno","Fantasma"],
        teamIds: [109, 89, 109, 110], // Koffing, Muk, Koffing, Weezing
        badgeImg: "Veneno.png", leaderImg: "Koga.png", gymImg: "Veneno.png"
    },
    {
        id: 6, leaderName: "Sabrina", type: ["Psíquico","Fada"],
        teamIds: [63, 64, 122, 65], // Abra, Kadabra, Mr. Mime, Alakazam
        badgeImg: "Psiquico.png", leaderImg: "Sabrina.png", gymImg: "Psiquico.png"
    },
    {
        id: 7, leaderName: "Blaine", type: ["Fogo","Noturno"],
        teamIds: [58, 77, 78, 59], // Growlithe, Ponyta, Rapidash, Arcanine
        badgeImg: "Fogo.png", leaderImg: "Blaine.png", gymImg: "Fogo.png"
    },
    {
        id: 8, leaderName: "Giovanni", type: ["Terra","Dragão"],
        teamIds: [111, 51, 31, 34, 112], // Rhyhorn, Dugtrio, Nidoqueen, Nidoking, Rhydon
        badgeImg: "Terra.png", leaderImg: "Giovanni.png", gymImg: "Terra.png"
    }
];