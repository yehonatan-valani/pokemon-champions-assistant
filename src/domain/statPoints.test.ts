import { describe, expect, it } from 'vitest';

import {
  clampStatPoint,
  getTotalStatPoints,
  isValidStatPoints,
} from './statPoints';

describe('Pokémon Champions Stat Points', () => {
  it('accepts a legal 66-SP build', () => {
    const stats = {
      hp: 32,
      atk: 0,
      def: 2,
      spa: 0,
      spd: 0,
      spe: 32,
    };

    expect(getTotalStatPoints(stats)).toBe(66);
    expect(isValidStatPoints(stats)).toBe(true);
  });

  it('rejects a build above 66 total SP', () => {
    const stats = {
      hp: 32,
      atk: 32,
      def: 3,
      spa: 0,
      spd: 0,
      spe: 0,
    };

    expect(getTotalStatPoints(stats)).toBe(67);
    expect(isValidStatPoints(stats)).toBe(false);
  });

  it('limits one stat to 32 SP', () => {
    expect(clampStatPoint(40)).toBe(32);
  });

  it('prevents negative SP values', () => {
    expect(clampStatPoint(-5)).toBe(0);
  });
});