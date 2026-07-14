import { describe, expect, it } from 'vitest';

import {
  ABILITY_NAMES,
  ITEM_NAMES,
  MOVE_NAMES,
  NATURE_NAMES,
  POKEMON_NAMES,
  getMoveMetadata,
  getMovePriority,
} from './championsData';

describe('Champions calculator data', () => {

  it('reads move information from the database', () => {
    const thunderbolt =
        getMoveMetadata('Thunderbolt');

    expect(thunderbolt.name).toBe('Thunderbolt');
    expect(thunderbolt.basePower).toBeGreaterThan(0);
    expect(thunderbolt.type).toBe('Electric');
    expect(thunderbolt.category).toBe('Special');
    });

it('reads move priority from the database', () => {
  const fakeOutPriority =
    getMovePriority('Fake Out');

  const thunderboltPriority =
    getMovePriority('Thunderbolt');

  expect(fakeOutPriority).toBeGreaterThan(
    thunderboltPriority,
  );
});
  
    it('reads move information from the database', () => {
  const thunderbolt =
    getMoveMetadata('Thunderbolt');

  expect(thunderbolt.name).toBe('Thunderbolt');
  expect(thunderbolt.basePower).toBeGreaterThan(0);
  expect(thunderbolt.type).toBe('Electric');
  expect(thunderbolt.category).toBe('Special');
  });

it('reads move priority from the database', () => {
  const fakeOutPriority =
    getMovePriority('Fake Out');

  const thunderboltPriority =
    getMovePriority('Thunderbolt');

  expect(fakeOutPriority).toBeGreaterThan(
    thunderboltPriority,
  );
  });  

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