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

import {
  getChampionsMegaCapability,
  resolveChampionsCalculationBuild,
} from './resolveChampionsCalculationBuild';

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
  'Champions Mega calculation resolver',
  () => {
    it(
      'detects a valid Mega capability from the held stone',
      () => {
        const capability =
          getChampionsMegaCapability(
            METAGROSS,
          );

        expect(
          capability,
        ).toEqual({
          baseSpecies:
            'Metagross',

          baseAbility:
            'Clear Body',

          stone:
            'Metagrossite',

          megaSpecies:
            'Metagross-Mega',

          megaAbility:
            'Tough Claws',
        });
      },
    );

    it(
      'uses base form by default',
      () => {
        const resolved =
          resolveChampionsCalculationBuild(
            METAGROSS,
          );

        expect(
          resolved.form,
        ).toBe(
          'base',
        );

        expect(
          resolved.transformed,
        ).toBe(false);

        expect(
          resolved.effectiveSpecies,
        ).toBe(
          'Metagross',
        );

        expect(
          resolved.effectiveAbility,
        ).toBe(
          'Clear Body',
        );
      },
    );

    it(
      'uses the Mega form only when explicitly requested',
      () => {
        const resolved =
          resolveChampionsCalculationBuild(
            METAGROSS,
            'mega',
          );

        expect(
          resolved.form,
        ).toBe(
          'mega',
        );

        expect(
          resolved.transformed,
        ).toBe(true);

        expect(
          resolved.effectiveSpecies,
        ).toBe(
          'Metagross-Mega',
        );

        expect(
          resolved.effectiveAbility,
        ).toBe(
          'Tough Claws',
        );

        expect(
          resolved.build.species,
        ).toBe(
          'Metagross-Mega',
        );

        expect(
          resolved.build.ability,
        ).toBe(
          'Tough Claws',
        );
      },
    );

    it(
      'keeps separate base and Mega calculated stats',
      () => {
        const baseStats =
          getChampionsStats(
            METAGROSS,
            'base',
          );

        const megaStats =
          getChampionsStats(
            METAGROSS,
            'mega',
          );

        expect(
          baseStats,
        ).toEqual({
          hp: 187,

          atk: 155,

          def: 166,

          spa: 103,

          spd: 111,

          spe: 122,
        });

        expect(
          megaStats,
        ).toEqual({
          hp: 187,

          atk: 165,

          def: 188,

          spa: 112,

          spd: 131,

          spe: 162,
        });
      },
    );

    it(
      'rejects Mega form when the held item is not a valid stone',
      () => {
        expect(() =>
          resolveChampionsCalculationBuild(
            {
              ...METAGROSS,

              item:
                'Leftovers',
            },
            'mega',
          ),
        ).toThrow(
          /cannot Mega Evolve/i,
        );
      },
    );

    it(
      'does not mutate the original build',
      () => {
        resolveChampionsCalculationBuild(
          METAGROSS,
          'mega',
        );

        expect(
          METAGROSS.species,
        ).toBe(
          'Metagross',
        );

        expect(
          METAGROSS.ability,
        ).toBe(
          'Clear Body',
        );
      },
    );
  },
);