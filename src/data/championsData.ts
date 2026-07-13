import { Generations } from '@smogon/calc';

const DATA_GENERATION = Generations.get(9);

function alphabetize(
  first: string,
  second: string,
): number {
  return first.localeCompare(second);
}

export const POKEMON_NAMES: string[] = Array.from(
  DATA_GENERATION.species,
  (species) => String(species.name),
).sort(alphabetize);

export const MOVE_NAMES: string[] = Array.from(
  DATA_GENERATION.moves,
  (move) => String(move.name),
).sort(alphabetize);

export const ABILITY_NAMES: string[] = Array.from(
  DATA_GENERATION.abilities,
  (ability) => String(ability.name),
).sort(alphabetize);

export const ITEM_NAMES: string[] = Array.from(
  DATA_GENERATION.items,
  (item) => String(item.name),
).sort(alphabetize);

export const NATURE_NAMES: string[] = Array.from(
  DATA_GENERATION.natures,
  (nature) => String(nature.name),
).sort(alphabetize);