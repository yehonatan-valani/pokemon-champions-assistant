import {
  describe,
  expect,
  it,
} from 'vitest';

import type {
  ChampionsPokemonBuild,
} from '../domain/pokemonBuild';

import {
  getChampionsStats,
} from './championsCalculator';

const KINGAMBIT_BUILD:
ChampionsPokemonBuild = {
  species:
    'Kingambit',

  nature:
    'Adamant',

  ability:
    'Defiant',

  item:
    'Chople Berry',

  moves: [
    'Kowtow Cleave',
    'Low Kick',
    'Protect',
    'Sucker Punch',
  ],

  statPoints: {
    hp: 32,
    atk: 32,
    def: 0,
    spa: 0,
    spd: 2,
    spe: 0,
  },
};

describe(
  'Champions calculated stats',
  () => {
    it(
      'applies Kingambit Stat Points to HP and Attack',
      () => {
        const stats =
          getChampionsStats(
            KINGAMBIT_BUILD,
          );

        expect(
          stats.hp,
        ).toBe(207);

        expect(
          stats.atk,
        ).toBe(205);

        expect(
          stats.def,
        ).toBe(140);

        expect(
          stats.spa,
        ).toBe(72);

        expect(
          stats.spe,
        ).toBe(70);
      },
    );
  },
);