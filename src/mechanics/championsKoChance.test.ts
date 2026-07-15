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

const ATTACKER:
ChampionsPokemonBuild = {
  species: 'Pikachu',
  nature: 'Timid',
  ability: 'Static',
  item: '',

  moves: [
    'Thunderbolt',
    'Protect',
    'Fake Out',
    'Electroweb',
  ],

  statPoints: {
    hp: 0,
    atk: 0,
    def: 2,
    spa: 32,
    spd: 0,
    spe: 32,
  },
};

const DEFENDER:
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

describe(
  'Champions faint chance',
  () => {
    it(
      'uses full HP when current HP is omitted',
      () => {
        const result =
          calculateChampionsDamage(
            ATTACKER,
            DEFENDER,
            'Thunderbolt',
          );

        expect(
          result.defenderCurrentHp,
        ).toBe(
          result.defenderMaxHp,
        );
      },
    );

    it(
      'reports a guaranteed faint when every roll reaches current HP',
      () => {
        const fullHpResult =
          calculateChampionsDamage(
            ATTACKER,
            DEFENDER,
            'Thunderbolt',
          );

        const result =
          calculateChampionsDamage(
            ATTACKER,
            DEFENDER,
            'Thunderbolt',
            undefined,
            {
              defenderCurrentHp:
                fullHpResult
                  .minDamage,
            },
          );

        expect(
          result.oneHitKoChance,
        ).toBe(1);
      },
    );

    it(
      'reports no immediate faint when current HP exceeds maximum damage',
      () => {
        const fullHpResult =
          calculateChampionsDamage(
            ATTACKER,
            DEFENDER,
            'Thunderbolt',
          );

        expect(
          fullHpResult.maxDamage,
        ).toBeLessThan(
          fullHpResult
            .defenderMaxHp,
        );

        const result =
          calculateChampionsDamage(
            ATTACKER,
            DEFENDER,
            'Thunderbolt',
            undefined,
            {
              defenderCurrentHp:
                fullHpResult
                  .maxDamage + 1,
            },
          );

        expect(
          result.oneHitKoChance,
        ).toBe(0);
      },
    );

    it(
      'includes base move accuracy in the adjusted faint chance',
      () => {
        const result =
          calculateChampionsDamage(
            ATTACKER,
            DEFENDER,
            'Thunderbolt',
            undefined,
            {
              defenderCurrentHp: 1,
            },
          );

        expect(
          result.baseAccuracyPercent,
        ).toBe(100);

        expect(
          result
            .accuracyAdjustedKoChance,
        ).toBe(
          result.oneHitKoChance,
        );
      },
    );

    it(
      'rejects invalid current HP',
      () => {
        expect(() =>
          calculateChampionsDamage(
            ATTACKER,
            DEFENDER,
            'Thunderbolt',
            undefined,
            {
              defenderCurrentHp: 0,
            },
          ),
        ).toThrow(
          'Defender current HP must be at least 1.',
        );
      },
    );
  },
);