import { MapGenerator } from '../modules/map/MapGenerator';
import { MapRender } from '../modules/map/MapRender';
import type { Coord } from '../constants';

export class MapSystem {
    static grid: number[][] = [];
    static size: number = 20;
    static gymLocations: { [key: string]: number } = {};

    // --- DELEGAÇÃO DE GERAÇÃO ---
    static generate(size: number) {
        this.size = size;

        // Assegura que o array esteja limpo ou dimensionado
        this.grid = new Array(size);

        MapGenerator.generate(size, this.grid, this.gymLocations);
    }

    // --- DELEGAÇÃO DE CÁLCULO ---
    static getCoord(i: number): Coord {
        return MapRender.getCoord(i, this.size);
    }

    static getIndex(x: number, y: number): number {
        return MapRender.getIndex(x, y, this.size);
    }
}