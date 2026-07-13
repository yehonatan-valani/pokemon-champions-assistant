import { Generations } from '@smogon/calc';

const DATA_GENERATION = Generations.get(9);

function alphabetize(first: string, second: string): number {
  return first.localeCompare(second);
}

export const POKEMON_NAMES = Array.from(
  DATA_GENERATION.species,
  (species) => species.name,
).sort(alphabetize);

export const MOVE_NAMES = Array.from(
  DATA_GENERATION.moves,
  (move) => move.name,
).sort(alphabetize);

export const ABILITY_NAMES = Array.from(
  DATA_GENERATION.abilities,
  (ability) => ability.name,
).sort(alphabetize);

export const ITEM_NAMES = Array.from(
  DATA_GENERATION.items,
  (item) => item.name,
).sort(alphabetize);

export const NATURE_NAMES = Array.from(
  DATA_GENERATION.natures,
  (nature) => nature.name,
).sort(alphabetize);