import {
  describe,
  expect,
  it,
} from 'vitest';

import type {
  OpponentSetCandidate,
} from '../domain/opponentCandidate';

import type {
  ResolvedCandidateEvaluation,
  ResolvedOpponentSlotCandidates,
} from './resolveOpponentCandidateSets';

import {
  rankResolvedOpponentSlot,
} from './rankOpponentCandidates';

function createCandidate(
  id: string,
  label: string,
  priorWeight?: number,
): OpponentSetCandidate {
  return {
    id,
    label,
    sourceLabel: 'Unit test',
    priorWeight,

    build: {
      species: 'Pikachu',
      nature: 'Timid',
      ability: 'Static',
      item: 'Focus Sash',

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
    },
  };
}

function createEvaluation(
  candidate: OpponentSetCandidate,
  compatible = true,
): ResolvedCandidateEvaluation {
  return {
    candidate,
    compatible,

    rejections: compatible
      ? []
      : [
          {
            code: 'item',
            message:
              'Test rejection.',
          },
        ],

        usablePlayerSpeedEvidence: 0,
        ignoredPlayerSpeedEvidence: 0,
        usableExactDamageEvidence: 0,
        usablePercentDamageEvidence: 0,
        ignoredDamageEvidence: 0,                              
  };
}

function createSlot(
  evaluations:
    ResolvedCandidateEvaluation[],
): ResolvedOpponentSlotCandidates {
  return {
    pokemonIndex: 0,
    species: 'Pikachu',
    totalCandidates:
      evaluations.length,
    evaluations,
  };
}

describe(
  'opponent candidate ranking',
  () => {
    it(
      'gives equal confidence to equal-weight candidates',
      () => {
        const firstCandidate =
          createCandidate(
            'first',
            'First candidate',
          );

        const secondCandidate =
          createCandidate(
            'second',
            'Second candidate',
          );

        const ranking =
          rankResolvedOpponentSlot(
            createSlot([
              createEvaluation(
                firstCandidate,
              ),

              createEvaluation(
                secondCandidate,
              ),
            ]),
          );

        expect(
          ranking.rankedCandidates,
        ).toHaveLength(2);

        expect(
          ranking.rankedCandidates[0]
            .confidencePercent,
        ).toBe(50);

        expect(
          ranking.rankedCandidates[1]
            .confidencePercent,
        ).toBe(50);

        expect(
          ranking.confidence,
        ).toBe('low');
      },
    );

    it(
      'normalizes supplied prior weights',
      () => {
        const commonCandidate =
          createCandidate(
            'common',
            'Common candidate',
            3,
          );

        const uncommonCandidate =
          createCandidate(
            'uncommon',
            'Uncommon candidate',
            1,
          );

        const ranking =
          rankResolvedOpponentSlot(
            createSlot([
              createEvaluation(
                commonCandidate,
              ),

              createEvaluation(
                uncommonCandidate,
              ),
            ]),
          );

        expect(
          ranking.rankedCandidates[0]
            .evaluation.candidate.id,
        ).toBe('common');

        expect(
          ranking.rankedCandidates[0]
            .confidencePercent,
        ).toBe(75);

        expect(
          ranking.rankedCandidates[1]
            .confidencePercent,
        ).toBe(25);

        expect(
          ranking.confidence,
        ).toBe('high');
      },
    );

    it(
      'excludes rejected candidates from normalization',
      () => {
        const compatibleCandidate =
          createCandidate(
            'compatible',
            'Compatible candidate',
          );

        const rejectedCandidate =
          createCandidate(
            'rejected',
            'Rejected candidate',
            100,
          );

        const ranking =
          rankResolvedOpponentSlot(
            createSlot([
              createEvaluation(
                compatibleCandidate,
              ),

              createEvaluation(
                rejectedCandidate,
                false,
              ),
            ]),
          );

        expect(
          ranking.rankedCandidates,
        ).toHaveLength(1);

        expect(
          ranking.rankedCandidates[0]
            .confidencePercent,
        ).toBe(100);

        expect(
          ranking.rejectedCount,
        ).toBe(1);

        expect(
          ranking.confidence,
        ).toBe(
          'single-candidate',
        );
      },
    );

    it(
      'reports when no compatible candidate remains',
      () => {
        const candidate =
          createCandidate(
            'rejected',
            'Rejected candidate',
          );

        const ranking =
          rankResolvedOpponentSlot(
            createSlot([
              createEvaluation(
                candidate,
                false,
              ),
            ]),
          );

        expect(
          ranking.rankedCandidates,
        ).toEqual([]);

        expect(
          ranking.confidence,
        ).toBe('none');
      },
    );
  },
);