export const TYPE_CHART: {[key: string]: {[key: string]: number}} = {
    'Água': { 'Fogo': 2, 'Terra': 2, 'Pedra': 2, 'Grama': 0.5, 'Água': 0.5, 'Dragão': 0.5 },
    'Normal': { 'Fantasma': 0 },
    'Inseto': { 'Grama': 2, 'Psíquico': 2, 'Voador': 0.5, 'Lutador': 0.5, 'Veneno': 0.5, 'Fantasma': 0.5, 'Fogo': 0.5 },
    'Grama': { 'Água': 2, 'Terra': 2, 'Pedra': 2, 'Fogo': 0.5, 'Voador': 0.5, 'Veneno': 0.5, 'Inseto': 0.5, 'Grama': 0.5, 'Dragão': 0.5 },
    'Veneno': { 'Grama': 2, 'Fada': 2, 'Veneno': 0.5, 'Terra': 0.5, 'Pedra': 0.5, 'Fantasma': 0.5 },
    'Fogo': { 'Grama': 2, 'Inseto': 2, 'Gelo': 2, 'Água': 0.5, 'Pedra': 0.5, 'Fogo': 0.5, 'Dragão': 0.5 },
    'Elétrico': { 'Água': 2, 'Voador': 2, 'Grama': 0.5, 'Terra': 0, 'Elétrico': 0.5, 'Dragão': 0.5 },
    'Pedra': { 'Fogo': 2, 'Gelo': 2, 'Voador': 2, 'Inseto': 2, 'Lutador': 0.5, 'Terra': 0.5 },
    'Psíquico': { 'Lutador': 2, 'Veneno': 2, 'Psíquico': 0.5 },
    'Terra': { 'Fogo': 2, 'Elétrico': 2, 'Pedra': 2, 'Veneno': 2, 'Grama': 0.5, 'Inseto': 0.5, 'Voador': 0 },
    'Gelo': { 'Grama': 2, 'Terra': 2, 'Dragão': 2, 'Voador': 2, 'Fogo': 0.5, 'Gelo': 0.5 , 'Água': 0.5 },
    'Lutador': { 'Normal': 2, 'Pedra': 2, 'Gelo': 2, 'Fantasma': 0, 'Voador': 0.5, 'Veneno': 0.5, 'Inseto': 0.5, 'Psíquico': 0.5, 'Fada': 0.5 },
    'Voador': { 'Grama': 2, 'Lutador': 2, 'Inseto': 2, 'Elétrico': 0.5, 'Pedra': 0.5 },
    'Fantasma': { 'Psíquico': 2, 'Fantasma': 2, 'Normal': 0 },
    'Dragão': { 'Dragão': 2, 'Fada': 0 },
    'Fada': { 'Dragão': 2, 'Lutador': 2, 'Veneno': 0.5, 'Fogo': 0.5 }
};