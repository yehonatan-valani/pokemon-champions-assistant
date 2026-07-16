import {
  isTeamComplete,
  type ChampionsTeam,
} from '../domain/team';

import type {
  StoredChampionsTeam,
  TeamLibrarySource,
} from '../domain/teamLibrary';

const TEAM_LIBRARY_STORAGE_KEY =
  'pokemon-champions-assistant.team-library.v1';

interface PersistedTeamLibrary {
  version: 1;

  teams:
    StoredChampionsTeam[];
}

export interface AddTeamToLibraryOptions {
  storage?: Storage;

  id?: string;

  timestamp?: string;

  source?:
    TeamLibrarySource;
}

export interface RenameLibraryTeamOptions {
  storage?: Storage;

  timestamp?: string;
}

function resolveStorage(
  storage?: Storage,
): Storage {
  if (storage) {
    return storage;
  }

  if (
    typeof window ===
    'undefined'
  ) {
    throw new Error(
      'Browser storage is not available.',
    );
  }

  return window.localStorage;
}

function isRecord(
  value: unknown,
): value is
Record<string, unknown> {
  return (
    typeof value ===
      'object' &&
    value !== null
  );
}

function isStoredChampionsTeam(
  value: unknown,
): value is
StoredChampionsTeam {
  if (!isRecord(value)) {
    return false;
  }

  if (
    typeof value.id !==
      'string' ||
    !value.id.trim()
  ) {
    return false;
  }

  if (
    value.source !==
      'showdown-import' &&
    value.source !==
      'saved-team-copy'
  ) {
    return false;
  }

  if (
    typeof value.createdAt !==
      'string' ||
    typeof value.updatedAt !==
      'string'
  ) {
    return false;
  }

  if (!isRecord(value.team)) {
    return false;
  }

  const possibleTeam =
    value.team as unknown as
      ChampionsTeam;

  return isTeamComplete(
    possibleTeam,
  );
}

function cloneTeam(
  team: ChampionsTeam,
): ChampionsTeam {
  return JSON.parse(
    JSON.stringify(team),
  ) as ChampionsTeam;
}

function createTeamId(): string {
  if (
    typeof globalThis.crypto
      ?.randomUUID ===
    'function'
  ) {
    return (
      globalThis.crypto
        .randomUUID()
    );
  }

  return (
    `team-${Date.now()}-` +
    Math.random()
      .toString(36)
      .slice(2, 10)
  );
}

function saveTeamLibrary(
  teams:
    StoredChampionsTeam[],

  storage?: Storage,
): void {
  const resolvedStorage =
    resolveStorage(storage);

  const data:
  PersistedTeamLibrary = {
    version: 1,

    teams,
  };

  resolvedStorage.setItem(
    TEAM_LIBRARY_STORAGE_KEY,
    JSON.stringify(data),
  );
}

export function loadTeamLibrary(
  storage?: Storage,
): StoredChampionsTeam[] {
  const resolvedStorage =
    resolveStorage(storage);

  const rawValue =
    resolvedStorage.getItem(
      TEAM_LIBRARY_STORAGE_KEY,
    );

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue:
    unknown =
      JSON.parse(rawValue);

    if (
      !isRecord(parsedValue) ||
      parsedValue.version !== 1 ||
      !Array.isArray(
        parsedValue.teams,
      )
    ) {
      return [];
    }

    return parsedValue.teams
      .filter(
        isStoredChampionsTeam,
      )
      .sort(
        (
          first,
          second,
        ) =>
          second.updatedAt
            .localeCompare(
              first.updatedAt,
            ),
      );
  } catch {
    return [];
  }
}

export function addTeamToLibrary(
  team: ChampionsTeam,

  options:
    AddTeamToLibraryOptions = {},
): StoredChampionsTeam[] {
  if (!isTeamComplete(team)) {
    throw new Error(
      'Only complete six-Pokémon teams can be stored in the library.',
    );
  }

  const cleanedName =
    team.name.trim();

  if (!cleanedName) {
    throw new Error(
      'The stored team must have a name.',
    );
  }

  const timestamp =
    options.timestamp ??
    new Date().toISOString();

  const entry:
  StoredChampionsTeam = {
    id:
      options.id ??
      createTeamId(),

    team:
      cloneTeam({
        ...team,
        name: cleanedName,
      }),

    source:
      options.source ??
      'showdown-import',

    createdAt:
      timestamp,

    updatedAt:
      timestamp,
  };

  const currentTeams =
    loadTeamLibrary(
      options.storage,
    );

  const nextTeams = [
    entry,
    ...currentTeams.filter(
      (currentEntry) =>
        currentEntry.id !==
        entry.id,
    ),
  ];

  saveTeamLibrary(
    nextTeams,
    options.storage,
  );

  return nextTeams;
}

export function renameLibraryTeam(
  teamId: string,

  nextName: string,

  options:
    RenameLibraryTeamOptions = {},
): StoredChampionsTeam[] {
  const cleanedName =
    nextName.trim();

  if (!cleanedName) {
    throw new Error(
      'The team name cannot be empty.',
    );
  }

  const currentTeams =
    loadTeamLibrary(
      options.storage,
    );

  const existingTeam =
    currentTeams.find(
      (entry) =>
        entry.id === teamId,
    );

  if (!existingTeam) {
    throw new Error(
      'The selected stored team could not be found.',
    );
  }

  const timestamp =
    options.timestamp ??
    new Date().toISOString();

  const nextTeams =
    currentTeams.map(
      (entry) => {
        if (
          entry.id !== teamId
        ) {
          return entry;
        }

        return {
          ...entry,

          team: {
            ...entry.team,

            name:
              cleanedName,
          },

          updatedAt:
            timestamp,
        };
      },
    );

  saveTeamLibrary(
    nextTeams,
    options.storage,
  );

  return nextTeams;
}

export function deleteLibraryTeam(
  teamId: string,

  storage?: Storage,
): StoredChampionsTeam[] {
  const currentTeams =
    loadTeamLibrary(storage);

  const nextTeams =
    currentTeams.filter(
      (entry) =>
        entry.id !== teamId,
    );

  saveTeamLibrary(
    nextTeams,
    storage,
  );

  return nextTeams;
}

export function clearTeamLibrary(
  storage?: Storage,
): void {
  const resolvedStorage =
    resolveStorage(storage);

  resolvedStorage.removeItem(
    TEAM_LIBRARY_STORAGE_KEY,
  );
}