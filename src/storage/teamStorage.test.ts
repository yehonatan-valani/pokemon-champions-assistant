import {
  describe,
  expect,
  it,
} from 'vitest';

import { createEmptyTeam } from '../domain/team';

import {
  clearSavedTeam,
  loadTeam,
  saveTeam,
  TEAM_STORAGE_KEY,
} from './teamStorage';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return (
      Array.from(this.values.keys())[index] ??
      null
    );
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(
    key: string,
    value: string,
  ): void {
    this.values.set(key, value);
  }
}

describe('team storage', () => {
  it('saves and loads a team', () => {
    const storage = new MemoryStorage();
    const team = createEmptyTeam();

    team.name = 'Champions Team';
    team.members[0].species = 'Pikachu';

    saveTeam(team, storage);

    const loadedTeam = loadTeam(storage);

    expect(loadedTeam).not.toBeNull();
    expect(loadedTeam?.name).toBe(
      'Champions Team',
    );
    expect(
      loadedTeam?.members[0].species,
    ).toBe('Pikachu');
  });

  it(
    'returns null when there is no saved team',
    () => {
      const storage = new MemoryStorage();

      expect(loadTeam(storage)).toBeNull();
    },
  );

  it('clears the saved team', () => {
    const storage = new MemoryStorage();

    saveTeam(createEmptyTeam(), storage);
    clearSavedTeam(storage);

    expect(loadTeam(storage)).toBeNull();
  });

  it(
    'rejects malformed stored information',
    () => {
      const storage = new MemoryStorage();

      storage.setItem(
        TEAM_STORAGE_KEY,
        '{"wrong":"information"}',
      );

      expect(loadTeam(storage)).toBeNull();
    },
  );
});