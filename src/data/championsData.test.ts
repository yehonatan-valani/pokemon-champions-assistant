import { describe, expect, it } from 'vitest';

import {
  ABILITY_NAMES,
  ITEM_NAMES,
  MOVE_NAMES,
  NATURE_NAMES,
  POKEMON_NAMES,
} from './championsData';

describe('Champions calculator data', () => {
  it('contains known Pokémon', () => {
    expect(POKEMON_NAMES).toContain('Pikachu');
  });

  it('contains known moves', () => {
    expect(MOVE_NAMES).toContain('Thunderbolt');
  });

  it('contains known abilities', () => {
    expect(ABILITY_NAMES).toContain('Static');
  });

  it('contains known items', () => {
    expect(ITEM_NAMES).toContain('Choice Scarf');
  });

  it('contains all standard natures', () => {
    expect(NATURE_NAMES).toContain('Timid');
    expect(NATURE_NAMES).toContain('Adamant');
    expect(NATURE_NAMES).toHaveLength(25);
  });
});