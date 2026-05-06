import { TILE } from '../../constants';
import type { Coord } from '../../constants';

export class MapGenerator {

    static generate(size: number, gridRef: number[][], gymLocationsRef: { [key: string]: number }) {
        // 1. Cria o Grid Base (Grama, Água, Terra)
        const grid = Array(size).fill(0).map(() => Array(size).fill(0).map(() => {
            const r = Math.random();
            if (r < 0.6) return TILE.GRASS;
            if (r < 0.8) return TILE.WATER;
            return TILE.GROUND;
        }));

        // Limpa as localizações antigas
        for (let key in gymLocationsRef) { delete gymLocationsRef[key]; }

        // Cria a lista de todas as coordenadas disponíveis
        const totalTiles = size * size;
        let allCoords: Coord[] = [];
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (x === 0 && y === 0) continue; // Pula a casa inicial (0,0)
                allCoords.push({ x, y });
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
        for (let i = 0; i < 8; i++) {
            if (allCoords.length === 0) break;
            const c = allCoords.pop()!;
            grid[c.y][c.x] = TILE.GYM;
            gymLocationsRef[`${c.x},${c.y}`] = i + 1;
        }

        // 3. Define a Casa Inicial como Cidade
        grid[0][0] = TILE.CITY;

        // =====================================================================
        // 4. LÓGICA: GARANTIA DE 1 CIDADE POR LINHA
        // =====================================================================
        let citiesPlaced = 0;

        for (let y = 0; y < size; y++) {
            // Se for a linha 0, a cidade já está no 0,0, então conta e pula
            if (y === 0) {
                citiesPlaced++;
                continue;
            }

            // Procura posições nesta linha 'y' que ainda estão livres (não são Gym)
            const candidates = allCoords.filter(c => c.y === y);

            if (candidates.length > 0) {
                // Sorteia uma posição nessa linha
                const chosen = candidates[Math.floor(Math.random() * candidates.length)];

                // Aplica a Cidade
                grid[chosen.y][chosen.x] = TILE.CITY;

                // Remove essa coordenada da lista global
                removeCoord(chosen.x, chosen.y);
                citiesPlaced++;
            }
        }

        // 5. Preenche o restante das cidades até atingir 10%
        const targetTotalCities = Math.floor(totalTiles * 0.1); // 10% do mapa
        let remainingCities = targetTotalCities - citiesPlaced;

        for (let i = 0; i < remainingCities; i++) {
            if (allCoords.length === 0) break;
            const c = allCoords.pop()!;
            grid[c.y][c.x] = TILE.CITY;
        }

        // 6. Distribui Eventos (10%)
        const targetEvents = Math.floor(totalTiles * 0.1);
        for (let i = 0; i < targetEvents; i++) {
            if (allCoords.length === 0) break;
            const c = allCoords.pop()!;
            grid[c.y][c.x] = TILE.EVENT;
        }

        // 7. Distribui NPCs (10%)
        const npcTypes = [
            TILE.ROCKET, TILE.BIKER, TILE.YOUNG, TILE.OLD,
            TILE.BUG_CATCHER, TILE.SWIMMER, TILE.KIMONO, TILE.RIVAL_JOHTO,
            TILE.AQUA, TILE.MAGMA, TILE.HIKER, TILE.SCHOOLBOY
        ];

        for (let i = 0; i < targetEvents; i++) {
            if (allCoords.length === 0) break;
            const c = allCoords.pop()!;
            grid[c.y][c.x] = npcTypes[Math.floor(Math.random() * npcTypes.length)];
        }

        // Aplica o grid gerado na referência
        for (let i = 0; i < size; i++) {
            gridRef[i] = grid[i];
        }
    }
}