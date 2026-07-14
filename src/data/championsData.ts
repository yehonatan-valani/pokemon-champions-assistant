import {
  Generations,
  toID,
} from '@smogon/calc';

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

export interface MoveMetadata {
  name: string;
  basePower: number;
  priority: number;
  type: string;
  category: string;
  target: string;
}

export function getMoveMetadata(
  moveName: string,
): MoveMetadata {
  const cleanedMoveName = moveName.trim();

  if (!cleanedMoveName) {
    throw new Error('A move name is required.');
  }

  const moveData = DATA_GENERATION.moves.get(
    toID(cleanedMoveName),
  );

  if (!moveData) {
    throw new Error(
      `"${cleanedMoveName}" is not available in the move database.`,
    );
  }

  return {
    name: String(moveData.name),
    basePower: moveData.basePower,
    priority: moveData.priority ?? 0,
    type: String(moveData.type),
    category: String(moveData.category ?? 'Status'),
    target: String(moveData.target ?? 'any'),
  };
}

export function getMovePriority(
  moveName: string,
): number {
  return getMoveMetadata(moveName).priority;
}