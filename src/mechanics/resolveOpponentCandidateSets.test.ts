import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  createTestTeam,
} from '../data/testData';

import type {
  OpponentSetCandidate,
} from '../domain/opponentCandidate';

import {
  createEmptyOpponentTeamPreview,
} from '../domain/opponentTeam';

import {
  createInitialBattleState,
  setBattleFieldTurns,
  setOpponentActiveSlot,
} from '../domain/battleState';

import {
  recordMoveUsed,
} from './applyBattleAction';

import {
  resolveOpponentCandidateSets,
} from './resolveOpponentCandidateSets';

const FAST_TORKOAL:
OpponentSetCandidate = {
  id: 'test-fast-torkoal',
  label: 'Fast Scarf Torkoal',
  sourceLabel: 'Unit test',

  build: {
    species: 'Torkoal',
    nature: 'Timid',
    ability: 'Drought',
    item: 'Choice Scarf',

    moves: [
      'Protect',
      'Heat Wave',
      'Earth Power',
      'Yawn',
    ],

    statPoints: {
      hp: 2,
      atk: 0,
      def: 0,
      spa: 32,
      spd: 0,
      spe: 32,
    },
  },
};

const SLOW_TORKOAL:
OpponentSetCandidate = {
  id: 'test-slow-torkoal',
  label: 'Slow Torkoal',
  sourceLabel: 'Unit test',

  build: {
    species: 'Torkoal',
    nature: 'Quiet',
    ability: 'Drought',
    item: 'Charcoal',

    moves: [
      'Protect',
      'Heat Wave',
      'Earth Power',
      'Yawn',
    ],

    statPoints: {
      hp: 32,
      atk: 0,
      def: 2,
      spa: 32,
      spd: 0,
      spe: 0,
    },
  },
};

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
      'Protect',
      'Body Slam',
      'High Horsepower',
      'Crunch',
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

function createJointTestBattle(
  trickRoom = false,
) {
  const opponent =
  createEmptyOpponentTeamPreview();

  opponent.name = 'Joint Test Opponent';

  opponent.species = [
    'Torkoal',
    'Snorlax',
    'Pikachu',
    'Charizard',
    'Pelipper',
    'Rillaboom',
  ];

  let battle = createInitialBattleState(
    createTestTeam(),
    opponent,
  );

  battle = setOpponentActiveSlot(
    battle,
    0,
    0,
  );

  battle = setOpponentActiveSlot(
    battle,
    1,
    1,
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

function getCompatibleIds(
  trickRoom: boolean,
): string[] {
  let battle =
    createJointTestBattle(
      trickRoom,
    );

  battle = recordMoveUsed(
    battle,
    {
      side: 'opponent',
      pokemonIndex: 0,
    },
    'Protect',
  );

  battle = recordMoveUsed(
    battle,
    {
      side: 'opponent',
      pokemonIndex: 1,
    },
    'Protect',
  );

  const result =
    resolveOpponentCandidateSets(
      battle,
      [
        FAST_TORKOAL,
        SLOW_TORKOAL,
        SLOW_SNORLAX,
      ],
    );

  return result.slots[0].evaluations
    .filter(
      (evaluation) =>
        evaluation.compatible,
    )
    .map(
      (evaluation) =>
        evaluation.candidate.id,
    );
}

describe(
  'joint opponent candidate inference',
  () => {
    it(
      'keeps only a Torkoal candidate that can move before Snorlax',
      () => {
        expect(
          getCompatibleIds(false),
        ).toEqual([
          'test-fast-torkoal',
        ]);
      },
    );

    it(
      'reverses the candidate result under Trick Room',
      () => {
        expect(
          getCompatibleIds(true),
        ).toEqual([
          'test-slow-torkoal',
        ]);
      },
    );

    it(
      'adds a Speed rejection explanation',
      () => {
        let battle =
          createJointTestBattle();

        battle = recordMoveUsed(
          battle,
          {
            side: 'opponent',
            pokemonIndex: 0,
          },
          'Protect',
        );

        battle = recordMoveUsed(
          battle,
          {
            side: 'opponent',
            pokemonIndex: 1,
          },
          'Protect',
        );

        const result =
          resolveOpponentCandidateSets(
            battle,
            [
              FAST_TORKOAL,
              SLOW_TORKOAL,
              SLOW_SNORLAX,
            ],
          );

        const slowEvaluation =
          result.slots[0].evaluations.find(
            (evaluation) =>
              evaluation.candidate.id ===
              'test-slow-torkoal',
          );

        expect(
          slowEvaluation?.compatible,
        ).toBe(false);

        expect(
          slowEvaluation?.rejections.some(
            (rejection) =>
              rejection.code ===
              'speed',
          ),
        ).toBe(true);
      },
    );
  },
);