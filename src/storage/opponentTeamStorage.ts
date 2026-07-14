import {
  OPPONENT_TEAM_SIZE,
  type OpponentTeamPreview,
} from '../domain/opponentTeam';

export const OPPONENT_TEAM_STORAGE_KEY =
  'pokemon-champions-assistant.opponent-team.v1';

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

function isStoredOpponentTeam(
  value: unknown,
): value is OpponentTeamPreview {
  if (!isObject(value)) {
    return false;
  }

  if (
    typeof value.name !== 'string' ||
    !Array.isArray(value.species) ||
    value.species.length !== OPPONENT_TEAM_SIZE
  ) {
    return false;
  }

  return value.species.every(
    (speciesName) =>
      typeof speciesName === 'string',
  );
}

export function saveOpponentTeam(
  preview: OpponentTeamPreview,
  storage: Storage = getBrowserStorage(),
): void {
  storage.setItem(
    OPPONENT_TEAM_STORAGE_KEY,
    JSON.stringify(preview),
  );
}

export function loadOpponentTeam(
  storage: Storage = getBrowserStorage(),
): OpponentTeamPreview | null {
  const storedValue = storage.getItem(
    OPPONENT_TEAM_STORAGE_KEY,
  );

  if (!storedValue) {
    return null;
  }

  try {
    const parsedValue: unknown =
      JSON.parse(storedValue);

    return isStoredOpponentTeam(parsedValue)
      ? parsedValue
      : null;
  } catch {
    return null;
  }
}

export function clearOpponentTeam(
  storage: Storage = getBrowserStorage(),
): void {
  storage.removeItem(
    OPPONENT_TEAM_STORAGE_KEY,
  );
}