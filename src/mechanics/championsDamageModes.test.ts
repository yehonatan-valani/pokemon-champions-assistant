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

const SPECIAL_ATTACKER:
ChampionsPokemonBuild = {
  species: 'Pikachu',
  nature: 'Modest',
  ability: 'Static',
  item: '',

  moves: [
    'Thunderbolt',
    'Protect',
    'Fake Out',
    'Electroweb',
  ],

  statPoints: {
    hp: 2,
    atk: 0,
    def: 0,
    spa: 32,
    spd: 0,
    spe: 32,
  },
};

const SPECIAL_DEFENDER:
ChampionsPokemonBuild = {
  species: 'Pikachu',
  nature: 'Calm',
  ability: 'Static',
  item: '',

  moves: [
    'Thunderbolt',
    'Protect',
    'Fake Out',
    'Electroweb',
  ],

  statPoints: {
    hp: 32,
    atk: 0,
    def: 0,
    spa: 0,
    spd: 32,
    spe: 2,
  },
};

const PHYSICAL_ATTACKER:
ChampionsPokemonBuild = {
  species: 'Garchomp',
  nature: 'Adamant',
  ability: 'Rough Skin',
  item: '',

  moves: [
    'Earthquake',
    'Dragon Claw',
    'Protect',
    'Rock Slide',
  ],

  statPoints: {
    hp: 2,
    atk: 32,
    def: 0,
    spa: 0,
    spd: 0,
    spe: 32,
  },
};

describe(
  'Champions damage modes',
  () => {
    it(
      'calculates a critical hit separately from a normal hit',
      () => {
        const normalResult =
          calculateChampionsDamage(
            SPECIAL_ATTACKER,
            SPECIAL_DEFENDER,
            'Thunderbolt',
            undefined,
            {
              criticalHit: false,
            },
          );

        const criticalResult =
          calculateChampionsDamage(
            SPECIAL_ATTACKER,
            SPECIAL_DEFENDER,
            'Thunderbolt',
            undefined,
            {
              criticalHit: true,
            },
          );

        expect(
          normalResult.criticalHit,
        ).toBe(false);

        expect(
          criticalResult.criticalHit,
        ).toBe(true);

        expect(
          criticalResult.minDamage,
        ).toBeGreaterThan(
          normalResult.minDamage,
        );

        expect(
          criticalResult.maxDamage,
        ).toBeGreaterThan(
          normalResult.maxDamage,
        );
      },
    );

    it(
      'applies spread damage when multiple targets are present',
      () => {
        const result =
          calculateChampionsDamage(
            PHYSICAL_ATTACKER,
            SPECIAL_DEFENDER,
            'Earthquake',
            undefined,
            {
              spreadDamageApplies:
                true,
            },
          );

        expect(
          result.isSpreadMove,
        ).toBe(true);

        expect(
          result.spreadDamageApplied,
        ).toBe(true);
      },
    );

    it(
      'removes the spread modifier when only one target is present',
      () => {
        const spreadResult =
          calculateChampionsDamage(
            PHYSICAL_ATTACKER,
            SPECIAL_DEFENDER,
            'Earthquake',
            undefined,
            {
              spreadDamageApplies:
                true,
            },
          );

        const singleTargetResult =
          calculateChampionsDamage(
            PHYSICAL_ATTACKER,
            SPECIAL_DEFENDER,
            'Earthquake',
            undefined,
            {
              spreadDamageApplies:
                false,
            },
          );

        expect(
          singleTargetResult
            .spreadDamageApplied,
        ).toBe(false);

        expect(
          singleTargetResult.minDamage,
        ).toBeGreaterThan(
          spreadResult.minDamage,
        );

        expect(
          singleTargetResult.maxDamage,
        ).toBeGreaterThan(
          spreadResult.maxDamage,
        );
      },
    );

    it(
      'reads move accuracy from the regulation metadata',
      () => {
        const result =
          calculateChampionsDamage(
            PHYSICAL_ATTACKER,
            SPECIAL_DEFENDER,
            'Rock Slide',
          );

        expect(
          result.baseAccuracyPercent,
        ).toBe(90);
      },
    );

    it(
      'keeps Thunderbolt at full base accuracy',
      () => {
        const result =
          calculateChampionsDamage(
            SPECIAL_ATTACKER,
            SPECIAL_DEFENDER,
            'Thunderbolt',
          );

        expect(
          result.baseAccuracyPercent,
        ).toBe(100);
      },
    );
  },
);