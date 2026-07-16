import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  createTestOpponentPreview,
  createTestTeam,
} from '../data/testData';

import {
  createInitialBattleState,
  EMPTY_BATTLE_STAT_STAGES,
  type BattleState,
} from '../domain/battleState';

import type {
  DamageObservation,
} from '../domain/damageObservation';

import type {
  OpponentSetCandidate,
} from '../domain/opponentCandidate';

import {
  evaluateCandidateDamageEvidence,
} from './evaluateCandidateDamageEvidence';

const FRAIL_GHOLDENGO:
OpponentSetCandidate = {
  id:
    'percent-frail-gholdengo',

  label:
    'Frail offensive Gholdengo',

  sourceLabel:
    'Percentage inference test',

  build: {
    species: 'Gholdengo',
    nature: 'Mild',
    ability: 'Good as Gold',
    item: 'Choice Specs',

    moves: [
      'Shadow Ball',
      'Make It Rain',
      'Thunderbolt',
      'Trick',
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

const BULKY_GHOLDENGO:
OpponentSetCandidate = {
  id:
    'percent-bulky-gholdengo',

  label:
    'Bulky Assault Vest Gholdengo',

  sourceLabel:
    'Percentage inference test',

  build: {
    species: 'Gholdengo',
    nature: 'Calm',
    ability: 'Good as Gold',
    item: 'Assault Vest',

    moves: [
      'Shadow Ball',
      'Make It Rain',
      'Thunderbolt',
      'Dazzling Gleam',
    ],

    statPoints: {
      hp: 32,
      atk: 0,
      def: 2,
      spa: 0,
      spd: 32,
      spe: 0,
    },
  },
};

function createBattle():
BattleState {
  const opponentPreview =
    createTestOpponentPreview();

  opponentPreview.species = [
    'Gholdengo',
    ...opponentPreview.species.slice(
      1,
    ),
  ];

  return createInitialBattleState(
    createTestTeam(),
    opponentPreview,
  );
}

function createObservation(
  battle: BattleState,
  hpAfter: number,
): DamageObservation {
  const attacker =
    battle.playerPokemon[0];

  return {
    id:
      `percent-observation-${hpAfter}`,

    turnNumber: 1,

    attacker: {
      side: 'player',
      pokemonIndex: 0,
    },

    attackerName:
      attacker.build.species,

    target: {
      side: 'opponent',
      pokemonIndex: 0,
    },

    targetName:
      'Gholdengo',

    moveName:
      'Thunderbolt',

    moveCategory:
      'Special',

    moveTarget:
      'normal',

    criticalHit: 'no',

    hpUnit: 'percent',

    hpBefore: 100,

    hpAfter,

    observedDamage:
      100 - hpAfter,

    targetMaxHp: null,

    targeting: {
      damageMode:
        'single',

      targetCount: 1,

      spreadDamageApplied:
        false,

      source:
        'automatic',

      summary:
        'Percentage inference test.',
    },

    context: {
      field: {
        ...battle.field,
      },

      playerActive: [
        0,
        null,
      ],

      opponentActive: [
        0,
        null,
      ],

      attackerStatus:
        attacker.status,

      targetStatus: '',

      attackerStatStages: {
        ...attacker.statStages,
      },

      targetStatStages: {
        ...EMPTY_BATTLE_STAT_STAGES,
      },

      attackerKnownItem:
        attacker.build.item,

      attackerKnownAbility:
        attacker.build.ability,

      targetKnownItem: '',

      targetKnownAbility: '',
    },
  };
}

function findDistinguishingObservation(
  battle: BattleState,
): {
  observation:
    DamageObservation;

  frailCompatible: boolean;

  bulkyCompatible: boolean;
} {
  for (
    let hpAfter = 99;
    hpAfter >= 0;
    hpAfter -= 1
  ) {
    const observation =
      createObservation(
        battle,
        hpAfter,
      );

    const frailEvaluation =
      evaluateCandidateDamageEvidence(
        battle,
        FRAIL_GHOLDENGO,
        0,
        [observation],
      );

    const bulkyEvaluation =
      evaluateCandidateDamageEvidence(
        battle,
        BULKY_GHOLDENGO,
        0,
        [observation],
      );

    if (
      frailEvaluation.compatible !==
      bulkyEvaluation.compatible
    ) {
      return {
        observation,

        frailCompatible:
          frailEvaluation
            .compatible,

        bulkyCompatible:
          bulkyEvaluation
            .compatible,
      };
    }
  }

  throw new Error(
    'No distinguishing percentage transition was found.',
  );
}

describe(
  'candidate percentage damage evidence',
  () => {
    it(
      'can distinguish defensive candidate builds using the opponent HP display',
      () => {
        const battle =
          createBattle();

        const result =
          findDistinguishingObservation(
            battle,
          );

        expect(
          result.frailCompatible,
        ).not.toBe(
          result.bulkyCompatible,
        );

        const compatibleCandidate =
          result.frailCompatible
            ? FRAIL_GHOLDENGO
            : BULKY_GHOLDENGO;

        const rejectedCandidate =
          result.frailCompatible
            ? BULKY_GHOLDENGO
            : FRAIL_GHOLDENGO;

        const compatibleEvaluation =
          evaluateCandidateDamageEvidence(
            battle,
            compatibleCandidate,
            0,
            [
              result.observation,
            ],
          );

        const rejectedEvaluation =
          evaluateCandidateDamageEvidence(
            battle,
            rejectedCandidate,
            0,
            [
              result.observation,
            ],
          );

        expect(
          compatibleEvaluation
            .usablePercentEvidenceCount,
        ).toBe(1);

        expect(
          compatibleEvaluation
            .compatible,
        ).toBe(true);

        expect(
          rejectedEvaluation
            .compatible,
        ).toBe(false);

        expect(
          rejectedEvaluation
            .rejections.some(
              (rejection) =>
                rejection.code ===
                'damage',
            ),
        ).toBe(true);
      },
    );
  },
);