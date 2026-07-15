import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  createTestOpponentPreview,
  createTestTeam,
} from '../data/testData';

import type {
  OpponentSetCandidate,
} from '../domain/opponentCandidate';

import {
  createInitialBattleState,
  setBattleFieldTurns,
  setOpponentActiveSlot,
  setPlayerActiveSlot,
} from '../domain/battleState';

import {
  recordMoveUsed,
} from './applyBattleAction';

import {
  deriveSpeedEvidence,
} from './deriveSpeedEvidence';

import {
  evaluateCandidateSpeedEvidence,
} from './evaluateCandidateSpeedEvidence';

const SLOW_SNORLAX:
OpponentSetCandidate = {
  id: 'test-slow-snorlax',
  label: 'Slow Snorlax',
  sourceLabel: 'Unit test',

  build: {
    species: 'Snorlax',
    nature: 'Brave',
    ability: 'Immunity',
    item: 'Leftovers',

    moves: [
      'Thunderbolt',
      'Body Slam',
      'Protect',
      'High Horsepower',
    ],

    statPoints: {
      hp: 32,
      atk: 32,
      def: 2,
      spa: 0,
      spd: 0,
      spe: 0,
    },
  },
};

function createActiveBattle(
  trickRoom = false,
) {
  const opponent =
    createTestOpponentPreview();

  opponent.species[0] = 'Snorlax';

  let battle = createInitialBattleState(
    createTestTeam(),
    opponent,
  );

  battle = setPlayerActiveSlot(
    battle,
    0,
    0,
  );

  battle = setOpponentActiveSlot(
    battle,
    0,
    0,
  );

  if (trickRoom) {
    battle = setBattleFieldTurns(
      battle,
      'trickRoomTurns',
      5,
    );
  }

  return battle;
}

describe(
  'candidate Speed evidence',
  () => {
    it(
      'rejects a slow candidate that moved before a faster known Pokémon',
      () => {
        let battle =
          createActiveBattle();

        battle = recordMoveUsed(
          battle,
          {
            side: 'opponent',
            pokemonIndex: 0,
          },
          'Thunderbolt',
        );

        battle = recordMoveUsed(
          battle,
          {
            side: 'player',
            pokemonIndex: 0,
          },
          'Thunderbolt',
        );

        const evidence =
          deriveSpeedEvidence(
            battle.actionHistory,
          );

        const evaluation =
          evaluateCandidateSpeedEvidence(
            battle,
            SLOW_SNORLAX,
            0,
            evidence,
          );

        expect(
          evaluation.compatible,
        ).toBe(false);

        expect(
          evaluation.rejections.some(
            (rejection) =>
              rejection.code ===
              'speed',
          ),
        ).toBe(true);
      },
    );

    it(
      'keeps the slow candidate under Trick Room',
      () => {
        let battle =
          createActiveBattle(true);

        battle = recordMoveUsed(
          battle,
          {
            side: 'opponent',
            pokemonIndex: 0,
          },
          'Thunderbolt',
        );

        battle = recordMoveUsed(
          battle,
          {
            side: 'player',
            pokemonIndex: 0,
          },
          'Thunderbolt',
        );

        const evidence =
          deriveSpeedEvidence(
            battle.actionHistory,
          );

        const evaluation =
          evaluateCandidateSpeedEvidence(
            battle,
            SLOW_SNORLAX,
            0,
            evidence,
          );

        expect(
          evaluation.compatible,
        ).toBe(true);

        expect(
          evaluation.usableEvidenceCount,
        ).toBe(1);
      },
    );

    it(
      'ignores evidence excluded by the recorder',
      () => {
        let battle =
          createActiveBattle();

        battle = recordMoveUsed(
          battle,
          {
            side: 'opponent',
            pokemonIndex: 0,
          },
          'Thunderbolt',
          {
            speedInferenceAllowed: false,
          },
        );

        battle = recordMoveUsed(
          battle,
          {
            side: 'player',
            pokemonIndex: 0,
          },
          'Thunderbolt',
        );

        const evidence =
          deriveSpeedEvidence(
            battle.actionHistory,
          );

        const evaluation =
          evaluateCandidateSpeedEvidence(
            battle,
            SLOW_SNORLAX,
            0,
            evidence,
          );

        expect(evidence).toEqual([]);

        expect(
          evaluation.compatible,
        ).toBe(true);
      },
    );
  },
);