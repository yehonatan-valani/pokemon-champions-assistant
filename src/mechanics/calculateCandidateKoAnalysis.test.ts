import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  DEVELOPMENT_OPPONENT_CANDIDATES,
} from '../data/developmentOpponentCandidates';

import {
  createTestOpponentPreview,
  createTestTeam,
} from '../data/testData';

import {
  createInitialBattleState,
  setOpponentActiveSlot,
  setOpponentPokemonHp,
  setPlayerActiveSlot,
} from '../domain/battleState';

import {
  calculateCandidateKoAnalysis,
} from './calculateCandidateKoAnalysis';

describe(
  'candidate future KO analysis',
  () => {
    it(
      'uses candidate-specific HP values from the displayed percentage',
      () => {
        let battle =
          createInitialBattleState(
            createTestTeam(),
            createTestOpponentPreview(),
          );

        battle =
          setPlayerActiveSlot(
            battle,
            0,
            0,
          );

        battle =
          setOpponentActiveSlot(
            battle,
            0,
            1,
          );

        battle =
          setOpponentPokemonHp(
            battle,
            1,
            1,
          );

        const analysis =
          calculateCandidateKoAnalysis(
            battle,
            DEVELOPMENT_OPPONENT_CANDIDATES,
            0,
            1,
            'Thunderbolt',
          );

        expect(
          analysis
            .candidateResults,
        ).toHaveLength(2);

        expect(
          analysis
            .candidateResults.every(
              (result) =>
                result
                  .possibleCurrentHp
                  .length > 0,
            ),
        ).toBe(true);

        expect(
          analysis
            .weightedCombinedKoChanceIfHit
            .minimum,
        ).toBe(1);

        expect(
          analysis
            .weightedCombinedKoChanceIfHit
            .maximum,
        ).toBe(1);

        expect(
          analysis
            .weightedOverallKoChanceIncludingAccuracy
            .minimum,
        ).toBe(1);

        expect(
          analysis
            .effectiveAccuracyPercent,
        ).toBe(100);
      },
    );

    it(
      'automatically applies spread damage and move accuracy',
      () => {
        let battle =
          createInitialBattleState(
            createTestTeam(),
            createTestOpponentPreview(),
          );

        battle =
          setPlayerActiveSlot(
            battle,
            0,
            2,
          );

        battle =
          setOpponentActiveSlot(
            battle,
            0,
            1,
          );

        battle =
          setOpponentActiveSlot(
            battle,
            1,
            0,
          );

        battle =
          setOpponentPokemonHp(
            battle,
            1,
            1,
          );

        const analysis =
          calculateCandidateKoAnalysis(
            battle,
            DEVELOPMENT_OPPONENT_CANDIDATES,
            2,
            1,
            'Rock Slide',
          );

        expect(
          analysis
            .spreadDamageApplied,
        ).toBe(true);

        expect(
          analysis.targetCount,
        ).toBe(2);

        expect(
          analysis
            .baseAccuracyPercent,
        ).toBe(90);

        expect(
          analysis
            .effectiveAccuracyPercent,
        ).toBe(90);

        expect(
          analysis
            .weightedOverallKoChanceIncludingAccuracy
            .minimum,
        ).toBeCloseTo(0.9);

        expect(
          analysis
            .weightedOverallKoChanceIncludingAccuracy
            .maximum,
        ).toBeCloseTo(0.9);
      },
    );
  },
);