import {
  EMPTY_STAT_POINTS,
  isValidStatPoints,
  type StatPoints,
} from './statPoints';

export type MoveList = [string, string, string, string];

export interface ChampionsPokemonBuild {
  species: string;
  nature: string;
  ability: string;
  item: string;
  moves: MoveList;
  statPoints: StatPoints;
}

export function createEmptyPokemonBuild(): ChampionsPokemonBuild {
  return {
    species: '',
    nature: '',
    ability: '',
    item: '',
    moves: ['', '', '', ''],
    statPoints: {
      ...EMPTY_STAT_POINTS,
    },
  };
}

export function isPokemonBuildComplete(
  build: ChampionsPokemonBuild,
): boolean {
  const hasRequiredTextFields =
    build.species.trim().length > 0 &&
    build.nature.trim().length > 0 &&
    build.ability.trim().length > 0;

  const hasFourMoves = build.moves.every(
    (move) => move.trim().length > 0,
  );

  return (
    hasRequiredTextFields &&
    hasFourMoves &&
    isValidStatPoints(build.statPoints)
  );
}