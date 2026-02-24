import { TILE } from '../constants';
import type { Coord } from '../constants';

export class MapSystem {
    static grid: number[][] = []; 
    static size: number = 20; 
    static gymLocations: {[key: string]: number} = {};

    static generate(size: number) {
        this.size = size;
        
        // 1. Cria o Grid Base (Grama, Água, Terra)
        this.grid = Array(size).fill(0).map(() => Array(size).fill(0).map(() => {
            const r = Math.random();
            if(r < 0.6) return TILE.GRASS;
            if(r < 0.8) return TILE.WATER;
            return TILE.GROUND;
        }));
        this.gymLocations = {};

        // Cria a lista de todas as coordenadas disponíveis
        const totalTiles = size * size;
        let allCoords: Coord[] = [];
        for(let y=0; y<size; y++) {
            for(let x=0; x<size; x++) {
                if(x===0 && y===0) continue; // Pula a casa inicial (0,0)
                allCoords.push({x,y});
            }
        }
        
        // Embaralha para garantir aleatoriedade no que sobrar
        allCoords.sort(() => Math.random() - 0.5);

        // Função auxiliar para remover uma coordenada da lista de disponíveis
        const removeCoord = (x: number, y: number) => {
            const idx = allCoords.findIndex(c => c.x === x && c.y === y);
            if (idx > -1) allCoords.splice(idx, 1);
        };

        // 2. Posiciona os 8 Ginásios
        for(let i=0; i<8; i++) {
            if(allCoords.length === 0) break;
            const c = allCoords.pop()!; // Pega do topo da pilha embaralhada
            this.grid[c.y][c.x] = TILE.GYM;
            this.gymLocations[`${c.x},${c.y}`] = i + 1;
        }

        // 3. Define a Casa Inicial como Cidade
        this.grid[0][0] = TILE.CITY;

        // =====================================================================
        // 4. NOVA LÓGICA: GARANTIA DE 1 CIDADE POR LINHA
        // =====================================================================
        let citiesPlaced = 0;
        
        for (let y = 0; y < size; y++) {
            // Se for a linha 0, a cidade já está no 0,0, então conta e pula
            if (y === 0) {
                citiesPlaced++;
                continue;
            }

            // Procura posições nesta linha 'y' que ainda estão livres (não são Gym)
            // Filtramos a allCoords para achar candidatos válidos nesta linha
            const candidates = allCoords.filter(c => c.y === y);
            
            if (candidates.length > 0) {
                // Sorteia uma posição nessa linha
                const chosen = candidates[Math.floor(Math.random() * candidates.length)];
                
                // Aplica a Cidade
                this.grid[chosen.y][chosen.x] = TILE.CITY;
                
                // Remove essa coordenada da lista global para não colocar nada em cima depois
                removeCoord(chosen.x, chosen.y);
                citiesPlaced++;
            }
        }

        // 5. Preenche o restante das cidades até atingir 10%
        const targetTotalCities = Math.floor(totalTiles * 0.1); // 10% do mapa
        let remainingCities = targetTotalCities - citiesPlaced;

        // Se a garantia por linha já estourou os 10% (mapa pequeno), não coloca mais nada.
        // Se ainda falta (mapa grande), coloca o resto aleatoriamente.
        for(let i=0; i < remainingCities; i++) {
            if(allCoords.length === 0) break;
            const c = allCoords.pop()!;
            this.grid[c.y][c.x] = TILE.CITY;
        }
        // =====================================================================

        // 6. Distribui Eventos (10%)
        const targetEvents = Math.floor(totalTiles * 0.1);
        for(let i=0; i<targetEvents; i++) {
            if(allCoords.length === 0) break;
            const c = allCoords.pop()!;
            this.grid[c.y][c.x] = TILE.EVENT;
        }

        // 7. Distribui NPCs (10%)
        // Atualizei a lista para incluir os novos NPCs que você adicionou
        const npcTypes = [
            TILE.ROCKET, TILE.BIKER, TILE.YOUNG, TILE.OLD,
            TILE.BUG_CATCHER, TILE.SWIMMER, TILE.KIMONO, TILE.RIVAL_JOHTO,
            TILE.AQUA, TILE.MAGMA, TILE.HIKER, TILE.SCHOOLBOY
        ];

        for(let i=0; i<targetEvents; i++) {
            if(allCoords.length === 0) break;
            const c = allCoords.pop()!;
            this.grid[c.y][c.x] = npcTypes[Math.floor(Math.random() * npcTypes.length)];
        }
    }
    
    static getCoord(i: number): Coord { 
        const y = Math.floor(i / this.size); 
        const x = i % this.size; 
        return { x, y }; 
    }
    
    static getIndex(x: number, y: number): number { 
        return (y * this.size) + x; 
    }
}