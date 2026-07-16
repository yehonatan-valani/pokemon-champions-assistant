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

const KINGAMBIT:
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

const METAGROSS:
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
    'Cosmic Power',
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

describe(
  'Mega-aware damage calculations',
  () => {
    it(
      'uses base form when no form is supplied',
      () => {
        const result =
          calculateChampionsDamage(
            KINGAMBIT,
            METAGROSS,
            'Kowtow Cleave',
          );

        expect(
          result.defenderForm,
        ).toBe(
          'base',
        );

        expect(
          result.defenderSpecies,
        ).toBe(
          'Metagross',
        );

        expect(
          result.defenderAbility,
        ).toBe(
          'Clear Body',
        );
      },
    );

    it(
      'uses Mega form when explicitly requested',
      () => {
        const baseResult =
          calculateChampionsDamage(
            KINGAMBIT,
            METAGROSS,
            'Kowtow Cleave',
            undefined,
            {
              defenderForm:
                'base',
            },
          );

        const megaResult =
          calculateChampionsDamage(
            KINGAMBIT,
            METAGROSS,
            'Kowtow Cleave',
            undefined,
            {
              defenderForm:
                'mega',
            },
          );

        expect(
          megaResult.defenderForm,
        ).toBe(
          'mega',
        );

        expect(
          megaResult.defenderSpecies,
        ).toBe(
          'Metagross-Mega',
        );

        expect(
          megaResult.defenderAbility,
        ).toBe(
          'Tough Claws',
        );

        expect(
          megaResult.maxDamage,
        ).toBeLessThan(
          baseResult.maxDamage,
        );
      },
    );
  },
);