import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  getRegulationMoveEntry,
} from '../data/currentRegulation';

import {
  createTestTeam,
} from '../data/testData';

import type {
  ChampionsPokemonBuild,
} from '../domain/pokemonBuild';

import {
  calculateCriticalHitChance,
} from './calculateCriticalHitChance';

import {
  calculateEffectiveAccuracyPercent,
} from './calculateMoveAccuracy';

function requireMove(
  moveName: string,
) {
  const move =
    getRegulationMoveEntry(
      moveName,
    );

  if (!move) {
    throw new Error(
      `Missing move metadata for ${moveName}.`,
    );
  }

  return move;
}

function createDefender():
ChampionsPokemonBuild {
  return {
    species: 'Gholdengo',
    nature: 'Calm',
    ability: 'Good as Gold',
    item: 'Leftovers',

    moves: [
      'Shadow Ball',
      'Make It Rain',
      'Nasty Plot',
      'Protect',
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
}

describe(
  'battle probability helpers',
  () => {
    it(
      'uses the ordinary one-in-24 critical-hit chance',
      () => {
        const attacker =
          createTestTeam()
            .members[0];

        const result =
          calculateCriticalHitChance(
            attacker,
            createDefender(),
            requireMove(
              'Thunderbolt',
            ),
          );

        expect(
          result.stage,
        ).toBe(1);

        expect(
          result.probability,
        ).toBeCloseTo(
          1 / 24,
        );
      },
    );

    it(
      'uses the higher chance for a high-critical-ratio move',
      () => {
        const attacker =
          createTestTeam()
            .members[0];

        const result =
          calculateCriticalHitChance(
            attacker,
            createDefender(),
            requireMove(
              'Shadow Claw',
            ),
          );

        expect(
          result.stage,
        ).toBe(2);

        expect(
          result.probability,
        ).toBeCloseTo(
          1 / 8,
        );
      },
    );

    it(
      'combines Super Luck and Scope Lens',
      () => {
        const attacker = {
          ...createTestTeam()
            .members[0],

          ability:
            'Super Luck',

          item:
            'Scope Lens',
        };

        const result =
          calculateCriticalHitChance(
            attacker,
            createDefender(),
            requireMove(
              'Thunderbolt',
            ),
          );

        expect(
          result.stage,
        ).toBe(3);

        expect(
          result.probability,
        ).toBeCloseTo(
          1 / 2,
        );
      },
    );

    it(
      'handles guaranteed critical-hit moves',
      () => {
        const attacker =
          createTestTeam()
            .members[0];

        const result =
          calculateCriticalHitChance(
            attacker,
            createDefender(),
            requireMove(
              'Flower Trick',
            ),
          );

        expect(
          result.probability,
        ).toBe(1);
      },
    );

    it(
      'handles critical-hit prevention abilities',
      () => {
        const attacker =
          createTestTeam()
            .members[0];

        const defender = {
          ...createDefender(),

          ability:
            'Battle Armor',
        };

        const result =
          calculateCriticalHitChance(
            attacker,
            defender,
            requireMove(
              'Thunderbolt',
            ),
          );

        expect(
          result.probability,
        ).toBe(0);
      },
    );

    it(
      'applies recorded accuracy and evasion stages',
      () => {
        expect(
          calculateEffectiveAccuracyPercent(
            90,
            0,
            0,
          ),
        ).toBe(90);

        expect(
          calculateEffectiveAccuracyPercent(
            90,
            1,
            0,
          ),
        ).toBe(100);

        expect(
          calculateEffectiveAccuracyPercent(
            90,
            0,
            1,
          ),
        ).toBe(67);

        expect(
          calculateEffectiveAccuracyPercent(
            null,
            -6,
            6,
          ),
        ).toBe(100);
      },
    );
  },
);