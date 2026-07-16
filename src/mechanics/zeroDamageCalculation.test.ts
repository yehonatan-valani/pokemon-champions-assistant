import {
  describe,
  expect,
  it,
} from 'vitest';

import type {
  ChampionsPokemonBuild,
} from '../domain/pokemonBuild';

import {
  calculateChampionsDamage,
} from './championsCalculator';

const MEGA_METAGROSS_BUILD:
ChampionsPokemonBuild = {
  species:
    'Metagross',

  nature:
    'Impish',

  ability:
    'Clear Body',

  item:
    'Metagrossite',

  moves: [
    'Psychic Fangs',
    'Body Press',
    'Meteor Mash',
    'Protect',
  ],

  statPoints: {
    hp: 32,
    atk: 0,
    def: 1,
    spa: 0,
    spd: 1,
    spe: 32,
  },
};

const KINGAMBIT_BUILD:
ChampionsPokemonBuild = {
  species:
    'Kingambit',

  nature:
    'Adamant',

  ability:
    'Defiant',

  item:
    'Black Glasses',

  moves: [
    'Kowtow Cleave',
    'Sucker Punch',
    'Iron Head',
    'Protect',
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
  'zero-damage calculations',
  () => {
    it(
      'returns a zero range without throwing',
      () => {
        const result =
          calculateChampionsDamage(
            MEGA_METAGROSS_BUILD,
            KINGAMBIT_BUILD,
            'Psychic Fangs',
            undefined,
            {
              attackerForm:
                'mega',
            },
          );

        expect(
          result.minDamage,
        ).toBe(0);

        expect(
          result.maxDamage,
        ).toBe(0);

        expect(
          result.oneHitKoChance,
        ).toBe(0);

        expect(
          result.accuracyAdjustedKoChance,
        ).toBe(0);

        expect(
          result.description,
        ).toContain(
          'does no damage',
        );

        expect(
          result.attackerSpecies,
        ).toBe(
          'Metagross-Mega',
        );
      },
    );
  },
);