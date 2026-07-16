import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  createBaseBattleMegaEvolutionState,
} from '../domain/megaEvolution';

import type {
  OpponentBattlePokemonState,
} from '../domain/battleState';

import type {
  OpponentSetCandidate,
} from '../domain/opponentCandidate';

import {
  evaluateOpponentCandidate,
  filterOpponentCandidates,
  getCandidatesForSpecies,
} from './filterOpponentCandidates';

const TEST_CANDIDATE:
OpponentSetCandidate = {
  id: 'test-rillaboom',
  label: 'Test Rillaboom',
  sourceLabel: 'Unit test',

  build: {
    species: 'Rillaboom',
    nature: 'Adamant',
    ability: 'Grassy Surge',
    item: 'Assault Vest',

    moves: [
      'Fake Out',
      'Grassy Glide',
      'Wood Hammer',
      'U-turn',
    ],

    statPoints: {
      hp: 32,
      atk: 32,
      def: 0,
      spa: 0,
      spd: 2,
      spe: 0,
    },
  },
};

function createObservation(
  overrides:
  Partial<OpponentBattlePokemonState> = {},
): OpponentBattlePokemonState {
  return {
    ...createBaseBattleMegaEvolutionState(),

    species:
      'Rillaboom',

    currentHpPercent:
      100,

    status:
      '',

    statStages: {
      atk: 0,
      def: 0,
      spa: 0,
      spd: 0,
      spe: 0,
      accuracy: 0,
      evasion: 0,
    },

    fainted:
      false,

    revealedMoves:
      [],

    revealedItem:
      '',

    revealedAbility:
      '',

    ...overrides,
  };
}

describe('opponent candidate filtering', () => {
  it(
    'keeps a candidate matching the species',
    () => {
      const observation =
        createObservation();

      const compatible =
        filterOpponentCandidates(
          [TEST_CANDIDATE],
          observation,
        );

      expect(compatible).toEqual([
        TEST_CANDIDATE,
      ]);
    },
  );

  it(
    'keeps a candidate containing all revealed moves',
    () => {
      const observation =
        createObservation({
          revealedMoves: [
            'Fake Out',
            'Grassy Glide',
          ],
        });

      const compatible =
        filterOpponentCandidates(
          [TEST_CANDIDATE],
          observation,
        );

      expect(compatible).toHaveLength(1);
    },
  );

  it(
    'rejects a candidate missing a revealed move',
    () => {
      const observation =
        createObservation({
          revealedMoves: [
            'Fake Out',
            'Protect',
          ],
        });

      const evaluation =
        evaluateOpponentCandidate(
          TEST_CANDIDATE,
          observation,
        );

      expect(
        evaluation.compatible,
      ).toBe(false);

      expect(
        evaluation.rejections.some(
          (rejection) =>
            rejection.code === 'move',
        ),
      ).toBe(true);
    },
  );

  it(
    'rejects a different revealed item',
    () => {
      const observation =
        createObservation({
          revealedItem: 'Miracle Seed',
        });

      const evaluation =
        evaluateOpponentCandidate(
          TEST_CANDIDATE,
          observation,
        );

      expect(
        evaluation.compatible,
      ).toBe(false);

      expect(
        evaluation.rejections[0].code,
      ).toBe('item');
    },
  );

  it(
    'rejects a different revealed ability',
    () => {
      const observation =
        createObservation({
          revealedAbility: 'Overgrow',
        });

      const evaluation =
        evaluateOpponentCandidate(
          TEST_CANDIDATE,
          observation,
        );

      expect(
        evaluation.compatible,
      ).toBe(false);

      expect(
        evaluation.rejections[0].code,
      ).toBe('ability');
    },
  );

  it(
    'ignores item and ability while unknown',
    () => {
      const observation =
        createObservation({
          revealedMoves: ['Fake Out'],
          revealedItem: '',
          revealedAbility: '',
        });

      const compatible =
        filterOpponentCandidates(
          [TEST_CANDIDATE],
          observation,
        );

      expect(compatible).toHaveLength(1);
    },
  );

  it(
    'selects candidates for one species',
    () => {
      const otherCandidate:
      OpponentSetCandidate = {
        ...TEST_CANDIDATE,
        id: 'test-gholdengo',

        build: {
          ...TEST_CANDIDATE.build,
          species: 'Gholdengo',
        },
      };

      const candidates =
        getCandidatesForSpecies(
          [
            TEST_CANDIDATE,
            otherCandidate,
          ],
          'Rillaboom',
        );

      expect(candidates).toEqual([
        TEST_CANDIDATE,
      ]);
    },
  );
});