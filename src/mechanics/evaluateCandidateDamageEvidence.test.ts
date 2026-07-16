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
  CriticalHitObservation,
  DamageObservation,
} from '../domain/damageObservation';

import type {
  OpponentSetCandidate,
} from '../domain/opponentCandidate';

import {
  calculateChampionsDamage,
} from './championsCalculator';

import {
  evaluateCandidateDamageEvidence,
} from './evaluateCandidateDamageEvidence';

import {
  resolveOpponentCandidateSets,
} from './resolveOpponentCandidateSets';

const STRONG_GHOLDENGO:
OpponentSetCandidate = {
  id: 'test-strong-gholdengo',

  label:
    'Strong Choice Specs',

  sourceLabel:
    'Unit test',

  build: {
    species: 'Gholdengo',
    nature: 'Modest',
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

const WEAK_GHOLDENGO:
OpponentSetCandidate = {
  id: 'test-weak-gholdengo',

  label:
    'Defensive Leftovers',

  sourceLabel:
    'Unit test',

  build: {
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
  },
};

interface DistinguishingDamage {
  targetIndex: number;

  observedDamage: number;
}

function createDamageBattle():
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

function cappedDamageRange(
  minimumDamage: number,
  maximumDamage: number,
  currentHp: number,
): [number, number] {
  return [
    Math.min(
      minimumDamage,
      currentHp,
    ),

    Math.min(
      maximumDamage,
      currentHp,
    ),
  ];
}

function findDistinguishingDamage(
  firstCandidate:
    OpponentSetCandidate,

  firstCriticalHit: boolean,

  secondCandidate:
    OpponentSetCandidate,

  secondCriticalHit: boolean,
): DistinguishingDamage {
  const battle =
    createDamageBattle();

  for (
    let targetIndex = 0;
    targetIndex <
      battle.playerPokemon.length;
    targetIndex += 1
  ) {
    const target =
      battle.playerPokemon[
        targetIndex
      ];

    const firstResult =
      calculateChampionsDamage(
        firstCandidate.build,
        target.build,
        'Shadow Ball',
        undefined,
        {
          defenderCurrentHp:
            target.maxHp,

          criticalHit:
            firstCriticalHit,

          spreadDamageApplies:
            false,
        },
      );

    const secondResult =
      calculateChampionsDamage(
        secondCandidate.build,
        target.build,
        'Shadow Ball',
        undefined,
        {
          defenderCurrentHp:
            target.maxHp,

          criticalHit:
            secondCriticalHit,

          spreadDamageApplies:
            false,
        },
      );

    const [
      firstMinimum,
      firstMaximum,
    ] =
      cappedDamageRange(
        firstResult.minDamage,
        firstResult.maxDamage,
        target.maxHp,
      );

    const [
      secondMinimum,
      secondMaximum,
    ] =
      cappedDamageRange(
        secondResult.minDamage,
        secondResult.maxDamage,
        target.maxHp,
      );

    for (
      let damage = firstMinimum;
      damage <= firstMaximum;
      damage += 1
    ) {
      const secondCanProduceDamage =
        damage >= secondMinimum &&
        damage <= secondMaximum;

      if (
        damage > 0 &&
        !secondCanProduceDamage
      ) {
        return {
          targetIndex,
          observedDamage: damage,
        };
      }
    }
  }

  throw new Error(
    'The test candidates did not produce distinguishable damage ranges.',
  );
}

function createExactObservation(
  battle: BattleState,

  targetIndex: number,

  observedDamage: number,

  criticalHit:
    CriticalHitObservation,
): DamageObservation {
  const target =
    battle.playerPokemon[
      targetIndex
    ];

  return {
    id: 'test-exact-damage',

    turnNumber: 1,

    attacker: {
      side: 'opponent',
      pokemonIndex: 0,
    },

    attackerName:
      'Gholdengo',

    target: {
      side: 'player',
      pokemonIndex:
        targetIndex,
    },

    targetName:
      target.build.species,

    moveName:
      'Shadow Ball',

    moveCategory:
      'Special',

    moveTarget:
      'normal',

    criticalHit,

    hpUnit:
      'exact',

    hpBefore:
      target.maxHp,

    hpAfter:
      target.maxHp -
      observedDamage,

    observedDamage,

    targetMaxHp:
      target.maxHp,

    targeting: {
      damageMode:
        'single',

      targetCount: 1,

      spreadDamageApplied:
        false,

      source:
        'automatic',

      summary:
        'Unit test single-target damage.',
    },

    context: {
      field: {
        ...battle.field,
      },

      playerActive: [
        targetIndex,
        null,
      ],

      opponentActive: [
        0,
        null,
      ],

      attackerStatus: '',

      targetStatus:
        target.status,

      attackerStatStages: {
        ...EMPTY_BATTLE_STAT_STAGES,
      },

      targetStatStages: {
        ...target.statStages,
      },

      attackerKnownItem: '',

      attackerKnownAbility: '',

      targetKnownItem:
        target.build.item,

      targetKnownAbility:
        target.build.ability,
    },
  };
}

function createPercentObservation(
  battle: BattleState,
): DamageObservation {
  const attacker =
    battle.playerPokemon[0];

  return {
    id: 'test-percent-damage',

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

    hpAfter: 60,

    observedDamage: 40,

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
        'Unit test percentage damage.',
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

describe(
  'candidate damage evidence',
  () => {
    it(
      'rejects a candidate whose exact damage range cannot explain the observation',
      () => {
        let battle =
          createDamageBattle();

        const evidence =
          findDistinguishingDamage(
            STRONG_GHOLDENGO,
            false,
            WEAK_GHOLDENGO,
            false,
          );

        battle = {
          ...battle,

          damageObservations: [
            createExactObservation(
              battle,
              evidence.targetIndex,
              evidence.observedDamage,
              'no',
            ),
          ],
        };

        const result =
          resolveOpponentCandidateSets(
            battle,
            [
              STRONG_GHOLDENGO,
              WEAK_GHOLDENGO,
            ],
          );

        const strongEvaluation =
          result.slots[0]
            .evaluations.find(
              (evaluation) =>
                evaluation
                  .candidate.id ===
                STRONG_GHOLDENGO.id,
            );

        const weakEvaluation =
          result.slots[0]
            .evaluations.find(
              (evaluation) =>
                evaluation
                  .candidate.id ===
                WEAK_GHOLDENGO.id,
            );

        expect(
          strongEvaluation
            ?.compatible,
        ).toBe(true);

        expect(
          strongEvaluation
            ?.usableExactDamageEvidence,
        ).toBe(1);

        expect(
          weakEvaluation
            ?.compatible,
        ).toBe(false);

        expect(
          weakEvaluation
            ?.rejections.some(
              (rejection) =>
                rejection.code ===
                'damage',
            ),
        ).toBe(true);
      },
    );

    it(
      'accepts either normal or critical damage when the critical result is unsure',
      () => {
        const battle =
          createDamageBattle();

        const evidence =
          findDistinguishingDamage(
            STRONG_GHOLDENGO,
            true,
            STRONG_GHOLDENGO,
            false,
          );

        const uncertainObservation =
          createExactObservation(
            battle,
            evidence.targetIndex,
            evidence.observedDamage,
            'unsure',
          );

        const uncertainResult =
          evaluateCandidateDamageEvidence(
            battle,
            STRONG_GHOLDENGO,
            0,
            [
              uncertainObservation,
            ],
          );

        expect(
          uncertainResult.compatible,
        ).toBe(true);

        const normalOnlyResult =
          evaluateCandidateDamageEvidence(
            battle,
            STRONG_GHOLDENGO,
            0,
            [
              {
                ...uncertainObservation,
                criticalHit: 'no',
              },
            ],
          );

        expect(
          normalOnlyResult.compatible,
        ).toBe(false);
      },
    );

    it(
        'processes percentage observations as candidate evidence',
        () => {
            const battle =
            createDamageBattle();

            const evaluation =
            evaluateCandidateDamageEvidence(
                battle,
                STRONG_GHOLDENGO,
                0,
                [
                createPercentObservation(
                    battle,
                ),
                ],
            );

            expect(
            evaluation
                .usableEvidenceCount,
            ).toBe(1);

            expect(
            evaluation
                .usableExactEvidenceCount,
            ).toBe(0);

            expect(
            evaluation
                .usablePercentEvidenceCount,
            ).toBe(1);

            expect(
            evaluation
                .ignoredEvidenceCount,
            ).toBe(0);
        },
      );
    },
);