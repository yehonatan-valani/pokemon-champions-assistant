import type {
  ChampionsPokemonBuild,
} from '../domain/pokemonBuild';

import {
  TEAM_SIZE,
  type ChampionsTeam,
} from '../domain/team';

export const TEAM_STORAGE_KEY =
  'pokemon-champions-assistant.saved-team.v1';

function getBrowserStorage(): Storage {
  if (typeof window === 'undefined') {
    throw new Error(
      'Browser storage is not available.',
    );
  }

  return window.localStorage;
}

function isObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null
  );
}

function isStoredPokemonBuild(
  value: unknown,
): value is ChampionsPokemonBuild {
  if (!isObject(value)) {
    return false;
  }

  if (
    typeof value.species !== 'string' ||
    typeof value.nature !== 'string' ||
    typeof value.ability !== 'string' ||
    typeof value.item !== 'string'
  ) {
    return false;
  }

  if (
    !Array.isArray(value.moves) ||
    value.moves.length !== 4 ||
    !value.moves.every(
      (move) => typeof move === 'string',
    )
  ) {
    return false;
  }

  const statPoints = value.statPoints;

if (!isObject(statPoints)) {
    return false;
    }

    const statKeys = [
    'hp',
    'atk',
    'def',
    'spa',
    'spd',
    'spe',
    ] as const;

    return statKeys.every(
    (statKey) =>
        typeof statPoints[statKey] === 'number',
    );
}

function isStoredTeam(
  value: unknown,
): value is ChampionsTeam {
  if (!isObject(value)) {
    return false;
  }

  if (
    typeof value.name !== 'string' ||
    !Array.isArray(value.members) ||
    value.members.length !== TEAM_SIZE
  ) {
    return false;
  }

  return value.members.every(
    isStoredPokemonBuild,
  );
}

export function saveTeam(
  team: ChampionsTeam,
  storage: Storage = getBrowserStorage(),
): void {
  storage.setItem(
    TEAM_STORAGE_KEY,
    JSON.stringify(team),
  );
}

export function loadTeam(
  storage: Storage = getBrowserStorage(),
): ChampionsTeam | null {
  const storedValue = storage.getItem(
    TEAM_STORAGE_KEY,
  );

  if (!storedValue) {
    return null;
  }

  try {
    const parsedValue: unknown =
      JSON.parse(storedValue);

    if (!isStoredTeam(parsedValue)) {
      return null;
    }

    return parsedValue;
  } catch {
    return null;
  }
}

export function clearSavedTeam(
  storage: Storage = getBrowserStorage(),
): void {
  storage.removeItem(TEAM_STORAGE_KEY);
}