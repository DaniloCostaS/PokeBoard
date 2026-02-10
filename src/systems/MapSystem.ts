import { TILE } from '../constants';
import type { Coord } from '../constants';

export class MapSystem {
    static grid: number[][] = []; 
    static size: number = 20; 
    static gymLocations: {[key: string]: number} = {};

    static generate(size: number) {
        this.size = size;
        this.grid = Array(size).fill(0).map(() => Array(size).fill(0).map(() => {
            const r = Math.random();
            if(r < 0.6) return TILE.GRASS;
            if(r < 0.8) return TILE.WATER;
            return TILE.GROUND;
        }));
        this.gymLocations = {};

        const totalTiles = size * size;
        const allCoords: Coord[] = [];
        for(let y=0; y<size; y++) {
            for(let x=0; x<size; x++) {
                if(x===0 && y===0) continue; 
                allCoords.push({x,y});
            }
        }
        allCoords.sort(() => Math.random() - 0.5);

        for(let i=0; i<8; i++) {
            if(allCoords.length === 0) break;
            const c = allCoords.pop()!;
            this.grid[c.y][c.x] = TILE.GYM;
            this.gymLocations[`${c.x},${c.y}`] = i + 1;
        }

        const targetCount = Math.floor(totalTiles * 0.1);
        const cityCount = Math.max(0, targetCount - 1); 
        this.grid[0][0] = TILE.CITY;
        for(let i=0; i<cityCount; i++) {
            if(allCoords.length === 0) break;
            const c = allCoords.pop()!;
            this.grid[c.y][c.x] = TILE.CITY;
        }
        for(let i=0; i<targetCount; i++) {
            if(allCoords.length === 0) break;
            const c = allCoords.pop()!;
            this.grid[c.y][c.x] = TILE.EVENT;
        }
        const npcTypes = [TILE.ROCKET, TILE.BIKER, TILE.YOUNG, TILE.OLD];
        for(let i=0; i<targetCount; i++) {
            if(allCoords.length === 0) break;
            const c = allCoords.pop()!;
            this.grid[c.y][c.x] = npcTypes[Math.floor(Math.random() * npcTypes.length)];
        }
    }
    static getCoord(i: number): Coord { const y=Math.floor(i/this.size); let x=i%this.size; if(y%2!==0) x=(this.size-1)-x; return {x,y}; }
    static getIndex(x: number, y: number): number { let realX = x; if(y % 2 !== 0) realX = (this.size - 1) - x; return (y * this.size) + realX; }
}