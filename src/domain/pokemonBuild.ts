import {
  ABILITY_NAMES,
  ITEM_NAMES,
  MOVE_NAMES,
  NATURE_NAMES,
  POKEMON_NAMES,
} from '../data/championsData';

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

export interface PokemonBuildValidation {
  valid: boolean;
  errors: string[];
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

export function validatePokemonBuild(
  build: ChampionsPokemonBuild,
): PokemonBuildValidation {
  const errors: string[] = [];

  if (!POKEMON_NAMES.includes(build.species)) {
    errors.push('Select a valid Pokémon species.');
  }

  if (!NATURE_NAMES.includes(build.nature)) {
    errors.push('Select a valid nature.');
  }

  if (!ABILITY_NAMES.includes(build.ability)) {
    errors.push('Select a valid ability.');
  }

  if (
    build.item.trim() &&
    !ITEM_NAMES.includes(build.item)
  ) {
    errors.push('Select a valid item or leave it empty.');
  }

  build.moves.forEach((move, index) => {
    if (!MOVE_NAMES.includes(move)) {
      errors.push(`Move ${index + 1} is invalid.`);
    }
  });

  if (!isValidStatPoints(build.statPoints)) {
    errors.push('The Stat Point allocation is invalid.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function isPokemonBuildComplete(
  build: ChampionsPokemonBuild,
): boolean {
  return validatePokemonBuild(build).valid;
}

export function clonePokemonBuild(
  build: ChampionsPokemonBuild,
): ChampionsPokemonBuild {
  return {
    ...build,
    moves: [...build.moves] as MoveList,
    statPoints: {
      ...build.statPoints,
    },
  };
}