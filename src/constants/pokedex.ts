import type { PokemonData } from './types';
import { GEN1 } from './pokedex/gen1';
import { GEN2 } from './pokedex/gen2';
import { GEN3 } from './pokedex/gen3';
import { GEN4 } from './pokedex/gen4';
import { GEN5 } from './pokedex/gen5';
import { GEN6 } from './pokedex/gen6';
import { GEN7 } from './pokedex/gen7';
import { GEN8 } from './pokedex/gen8';
import { GEN9 } from './pokedex/gen9';
import { MEGA_POKEDEX } from './pokedex/megas';

export const POKEDEX: PokemonData[] = [
  ...GEN1,
  ...GEN2,
  ...GEN3,
  ...GEN4,
  ...GEN5,
  ...GEN6,
  ...GEN7,
  ...GEN8,
  ...GEN9
];

export { MEGA_POKEDEX };

POKEDEX.push(...MEGA_POKEDEX);
