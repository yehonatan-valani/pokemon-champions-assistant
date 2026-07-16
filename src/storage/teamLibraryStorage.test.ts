import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  createTestTeam,
} from '../data/testData';

import {
  createEmptyTeam,
} from '../domain/team';

import {
  addTeamToLibrary,
  clearTeamLibrary,
  deleteLibraryTeam,
  loadTeamLibrary,
  renameLibraryTeam,
} from './teamLibraryStorage';

class MemoryStorage
implements Storage {
  private readonly values =
    new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(
    key: string,
  ): string | null {
    return (
      this.values.get(key) ??
      null
    );
  }

  key(
    index: number,
  ): string | null {
    return (
      [
        ...this.values.keys(),
      ][index] ??
      null
    );
  }

  removeItem(
    key: string,
  ): void {
    this.values.delete(key);
  }

  setItem(
    key: string,
    value: string,
  ): void {
    this.values.set(
      key,
      value,
    );
  }
}

describe(
  'team library storage',
  () => {
    it(
      'stores several complete teams',
      () => {
        const storage =
          new MemoryStorage();

        addTeamToLibrary(
          {
            ...createTestTeam(),

            name:
              'First Team',
          },
          {
            storage,

            id:
              'first-team',

            timestamp:
              '2026-07-01T10:00:00.000Z',
          },
        );

        addTeamToLibrary(
          {
            ...createTestTeam(),

            name:
              'Second Team',
          },
          {
            storage,

            id:
              'second-team',

            timestamp:
              '2026-07-02T10:00:00.000Z',
          },
        );

        const teams =
          loadTeamLibrary(
            storage,
          );

        expect(
          teams,
        ).toHaveLength(2);

        expect(
          teams.map(
            (entry) =>
              entry.team.name,
          ),
        ).toEqual([
          'Second Team',
          'First Team',
        ]);
      },
    );

    it(
      'renames one stored team without changing the others',
      () => {
        const storage =
          new MemoryStorage();

        addTeamToLibrary(
          {
            ...createTestTeam(),

            name:
              'Original Name',
          },
          {
            storage,

            id:
              'team-one',

            timestamp:
              '2026-07-01T10:00:00.000Z',
          },
        );

        addTeamToLibrary(
          {
            ...createTestTeam(),

            name:
              'Other Team',
          },
          {
            storage,

            id:
              'team-two',

            timestamp:
              '2026-07-02T10:00:00.000Z',
          },
        );

        const teams =
          renameLibraryTeam(
            'team-one',
            'Renamed Team',
            {
              storage,

              timestamp:
                '2026-07-03T10:00:00.000Z',
            },
          );

        expect(
          teams.find(
            (entry) =>
              entry.id ===
              'team-one',
          )?.team.name,
        ).toBe(
          'Renamed Team',
        );

        expect(
          teams.find(
            (entry) =>
              entry.id ===
              'team-two',
          )?.team.name,
        ).toBe(
          'Other Team',
        );
      },
    );

    it(
      'deletes only the selected team',
      () => {
        const storage =
          new MemoryStorage();

        addTeamToLibrary(
          createTestTeam(),
          {
            storage,

            id:
              'keep-team',
          },
        );

        addTeamToLibrary(
          createTestTeam(),
          {
            storage,

            id:
              'delete-team',
          },
        );

        const teams =
          deleteLibraryTeam(
            'delete-team',
            storage,
          );

        expect(
          teams.map(
            (entry) =>
              entry.id,
          ),
        ).toEqual([
          'keep-team',
        ]);
      },
    );

    it(
      'rejects an incomplete team',
      () => {
        const storage =
          new MemoryStorage();

        expect(() =>
          addTeamToLibrary(
            createEmptyTeam(),
            {
              storage,
            },
          ),
        ).toThrow(
          /complete six-Pokémon/i,
        );
      },
    );

    it(
      'returns an empty library for corrupted storage',
      () => {
        const storage =
          new MemoryStorage();

        storage.setItem(
          'pokemon-champions-assistant.team-library.v1',
          '{broken json',
        );

        expect(
          loadTeamLibrary(
            storage,
          ),
        ).toEqual([]);
      },
    );

    it(
      'clears the complete library',
      () => {
        const storage =
          new MemoryStorage();

        addTeamToLibrary(
          createTestTeam(),
          {
            storage,
          },
        );

        clearTeamLibrary(
          storage,
        );

        expect(
          loadTeamLibrary(
            storage,
          ),
        ).toEqual([]);
      },
    );
  },
);