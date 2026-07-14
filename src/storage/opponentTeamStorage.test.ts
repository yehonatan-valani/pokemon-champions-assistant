import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  createEmptyOpponentTeamPreview,
} from '../domain/opponentTeam';

import {
  clearOpponentTeam,
  loadOpponentTeam,
  OPPONENT_TEAM_STORAGE_KEY,
  saveOpponentTeam,
} from './opponentTeamStorage';

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

describe('opponent team storage', () => {
  it('saves and loads an opponent team', () => {
    const storage = new MemoryStorage();

    const preview =
      createEmptyOpponentTeamPreview();

    preview.name = 'Round 1 Opponent';
    preview.species[0] = 'Pikachu';

    saveOpponentTeam(preview, storage);

    const loadedPreview =
      loadOpponentTeam(storage);

    expect(loadedPreview).not.toBeNull();

    expect(loadedPreview?.name).toBe(
      'Round 1 Opponent',
    );

    expect(loadedPreview?.species[0]).toBe(
      'Pikachu',
    );
  });

  it(
    'returns null when nothing is saved',
    () => {
      const storage = new MemoryStorage();

      expect(
        loadOpponentTeam(storage),
      ).toBeNull();
    },
  );

  it('clears the opponent team', () => {
    const storage = new MemoryStorage();

    saveOpponentTeam(
      createEmptyOpponentTeamPreview(),
      storage,
    );

    clearOpponentTeam(storage);

    expect(
      loadOpponentTeam(storage),
    ).toBeNull();
  });

  it('rejects malformed information', () => {
    const storage = new MemoryStorage();

    storage.setItem(
      OPPONENT_TEAM_STORAGE_KEY,
      '{"species":["Pikachu"]}',
    );

    expect(
      loadOpponentTeam(storage),
    ).toBeNull();
  });
});