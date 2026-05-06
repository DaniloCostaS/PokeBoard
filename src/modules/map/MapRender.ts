import type { Coord } from '../../constants';

export class MapRender {
    static getCoord(i: number, size: number): Coord {
        const y = Math.floor(i / size);
        const x = i % size;
        return { x, y };
    }

    static getIndex(x: number, y: number, size: number): number {
        return (y * size) + x;
    }
}