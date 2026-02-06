export const TYPE_CHART: {[key: string]: {[key: string]: number}} = {
    'Fogo': { 'Grama': 2, 'Água': 0.5, 'Pedra': 0.5, 'Inseto': 2, 'Gelo': 2 },
    'Água': { 'Fogo': 2, 'Grama': 0.5, 'Terra': 2, 'Pedra': 2 },
    'Grama': { 'Água': 2, 'Fogo': 0.5, 'Terra': 2, 'Voador': 0.5, 'Pedra': 2 },
    'Elétrico': { 'Água': 2, 'Grama': 0.5, 'Terra': 0, 'Voador': 2 },
    'Terra': { 'Fogo': 2, 'Elétrico': 2, 'Grama': 0.5, 'Voador': 0, 'Pedra': 2 },
    'Normal': { 'Fantasma': 0 },
    'Gelo': { 'Grama': 2, 'Terra': 2, 'Dragão': 2, 'Voador': 2, 'Fogo': 0.5 },
    'Lutador': { 'Normal': 2, 'Pedra': 2, 'Gelo': 2, 'Fantasma': 0 },
    'Veneno': { 'Grama': 2, 'Fada': 2 },
    'Voador': { 'Grama': 2, 'Lutador': 2, 'Inseto': 2 },
    'Psíquico': { 'Lutador': 2, 'Veneno': 2 },
    'Inseto': { 'Grama': 2, 'Psíquico': 2 },
    'Pedra': { 'Fogo': 2, 'Gelo': 2, 'Voador': 2, 'Inseto': 2 },
    'Fantasma': { 'Psíquico': 2, 'Fantasma': 2, 'Normal': 0 },
    'Dragão': { 'Dragão': 2 },
    'Fada': { 'Dragão': 2, 'Lutador': 2 }
};