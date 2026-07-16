import {
  toID,
} from '@smogon/calc';

import type {
  BattleState,
  BattleStatStages,
  MajorStatus,
} from '../domain/battleState';

import type {
  DamageObservation,
} from '../domain/damageObservation';

import type {
  DamageFieldConditions,
} from '../domain/fieldConditions';

import type {
  CandidateRejection,
  OpponentSetCandidate,
} from '../domain/opponentCandidate';

import type {
  ChampionsPokemonBuild,
} from '../domain/pokemonBuild';

import {
  calculateChampionsDamage,
  getChampionsStats,
  type ChampionsCalculatorBoosts,
  type ChampionsCalculatorStatus,
} from './championsCalculator';

import {
  describePossibleHpValues,
  getPossibleHpValuesForDisplayedPercent,
} from './displayedHpPercent';

/*
 * These moves depend on the attacker's
 * exact current HP.
 *
 * Damage observations do not yet preserve
 * the attacker's historical exact HP, so
 * these moves remain non-rejecting until
 * that snapshot is added.
 */
const ATTACKER_HP_DEPENDENT_MOVE_IDS =
  new Set([
    'dragonenergy',
    'endeavor',
    'eruption',
    'finalgambit',
    'flail',
    'reversal',
    'waterspout',
  ]);

export interface CandidateDamageEvidenceEvaluation {
  compatible: boolean;

  rejections:
    CandidateRejection[];

  usableEvidenceCount: number;

  usableExactEvidenceCount:
    number;

  usablePercentEvidenceCount:
    number;

  ignoredEvidenceCount: number;
}

interface CalculatedDamageRange {
  criticalHit: boolean;

  defenderCurrentHp: number;

  minDamage: number;

  maxDamage: number;
}

interface DamageCompatibilityResult {
  compatible: boolean;

  calculatedRanges:
    CalculatedDamageRange[];

  possibleBeforeHp:
    number[];

  possibleAfterHp:
    number[];
}

function toCalculatorStatus(
  status: MajorStatus,
): ChampionsCalculatorStatus {
  switch (status) {
    case 'Burn':
      return 'brn';

    case 'Paralysis':
      return 'par';

    case 'Poison':
      return 'psn';

    case 'Badly Poisoned':
      return 'tox';

    case 'Sleep':
      return 'slp';

    case 'Freeze':
      return 'frz';

    default:
      return '';
  }
}

function toCalculatorBoosts(
  stages: BattleStatStages,
): ChampionsCalculatorBoosts {
  return {
    atk: stages.atk,
    def: stages.def,
    spa: stages.spa,
    spd: stages.spd,
    spe: stages.spe,
  };
}

function getDamageFieldConditions(
  observation:
    DamageObservation,
): DamageFieldConditions {
  const targetIsPlayer =
    observation.target.side ===
    'player';

  const field =
    observation.context.field;

  return {
    weather:
      field.weather,

    terrain:
      field.terrain,

    /*
     * Helping Hand and Friend Guard are
     * not yet stored in the structured
     * battle state.
     */
    attackerHelpingHand: false,

    defenderReflect:
      targetIsPlayer
        ? field
            .playerReflectTurns >
          0
        : field
            .opponentReflectTurns >
          0,

    defenderLightScreen:
      targetIsPlayer
        ? field
            .playerLightScreenTurns >
          0
        : field
            .opponentLightScreenTurns >
          0,

    defenderAuroraVeil:
      targetIsPlayer
        ? field
            .playerAuroraVeilTurns >
          0
        : field
            .opponentAuroraVeilTurns >
          0,

    defenderFriendGuard: false,
  };
}

function getCriticalModes(
  observation:
    DamageObservation,
): boolean[] {
  if (
    observation.criticalHit ===
    'yes'
  ) {
    return [true];
  }

  if (
    observation.criticalHit ===
    'no'
  ) {
    return [false];
  }

  return [
    false,
    true,
  ];
}

function calculateObservationRange(
  attackerBuild:
    ChampionsPokemonBuild,

  defenderBuild:
    ChampionsPokemonBuild,

  observation:
    DamageObservation,

  defenderCurrentHp: number,

  criticalHit: boolean,
): CalculatedDamageRange {
  const result =
    calculateChampionsDamage(
      attackerBuild,
      defenderBuild,
      observation.moveName,
      getDamageFieldConditions(
        observation,
      ),
      {
        defenderCurrentHp,

        attackerBoosts:
          toCalculatorBoosts(
            observation.context
              .attackerStatStages,
          ),

        defenderBoosts:
          toCalculatorBoosts(
            observation.context
              .targetStatStages,
          ),

        attackerStatus:
          toCalculatorStatus(
            observation.context
              .attackerStatus,
          ),

        defenderStatus:
          toCalculatorStatus(
            observation.context
              .targetStatus,
          ),

        criticalHit,

        spreadDamageApplies:
          observation.targeting
            .spreadDamageApplied,
      },
    );

  return {
    criticalHit,

    defenderCurrentHp,

    minDamage:
      result.minDamage,

    maxDamage:
      result.maxDamage,
  };
}

function exactLossMatchesRange(
  observation:
    DamageObservation,

  range:
    CalculatedDamageRange,
): boolean {
  /*
   * When the target fainted, damage beyond
   * the remaining HP is hidden.
   *
   * A calculated hit only needs to be able
   * to reach the HP that remained.
   */
  if (
    observation.hpAfter === 0
  ) {
    return (
      range.maxDamage >=
      observation.hpBefore
    );
  }

  return (
    observation.observedDamage >=
      range.minDamage &&
    observation.observedDamage <=
      range.maxDamage
  );
}

function percentageTransitionMatchesRange(
  beforeHp: number,

  possibleAfterHp:
    number[],

  range:
    CalculatedDamageRange,
): boolean {
  for (
    const afterHp
    of possibleAfterHp
  ) {
    if (afterHp > beforeHp) {
      continue;
    }

    if (afterHp === 0) {
      if (
        range.maxDamage >=
        beforeHp
      ) {
        return true;
      }

      continue;
    }

    const requiredDamage =
      beforeHp - afterHp;

    if (
      requiredDamage >=
        range.minDamage &&
      requiredDamage <=
        range.maxDamage
    ) {
      return true;
    }
  }

  return false;
}

function evaluateExactObservation(
  attackerBuild:
    ChampionsPokemonBuild,

  defenderBuild:
    ChampionsPokemonBuild,

  observation:
    DamageObservation,
): DamageCompatibilityResult {
  const calculatedRanges =
    getCriticalModes(
      observation,
    ).map(
      (criticalHit) =>
        calculateObservationRange(
          attackerBuild,
          defenderBuild,
          observation,
          observation.hpBefore,
          criticalHit,
        ),
    );

  return {
    compatible:
      calculatedRanges.some(
        (range) =>
          exactLossMatchesRange(
            observation,
            range,
          ),
      ),

    calculatedRanges,

    possibleBeforeHp: [
      observation.hpBefore,
    ],

    possibleAfterHp: [
      observation.hpAfter,
    ],
  };
}

function evaluatePercentageObservation(
  attackerBuild:
    ChampionsPokemonBuild,

  candidate:
    OpponentSetCandidate,

  observation:
    DamageObservation,
): DamageCompatibilityResult {
  const maximumHp =
    getChampionsStats(
      candidate.build,
    ).hp;

  const possibleBeforeHp =
    getPossibleHpValuesForDisplayedPercent(
      observation.hpBefore,
      maximumHp,
    );

  const possibleAfterHp =
    getPossibleHpValuesForDisplayedPercent(
      observation.hpAfter,
      maximumHp,
    );

  const calculatedRanges:
  CalculatedDamageRange[] = [];

  for (
    const criticalHit
    of getCriticalModes(
      observation,
    )
  ) {
    for (
      const beforeHp
      of possibleBeforeHp
    ) {
      /*
       * An already-fainted target cannot be
       * hit. Treat malformed 0%-before
       * evidence as unsupported rather than
       * eliminating candidates.
       */
      if (beforeHp < 1) {
        continue;
      }

      const range =
        calculateObservationRange(
          attackerBuild,
          candidate.build,
          observation,
          beforeHp,
          criticalHit,
        );

      calculatedRanges.push(
        range,
      );

      if (
        percentageTransitionMatchesRange(
          beforeHp,
          possibleAfterHp,
          range,
        )
      ) {
        return {
          compatible: true,

          calculatedRanges,

          possibleBeforeHp,

          possibleAfterHp,
        };
      }
    }
  }

  return {
    compatible: false,

    calculatedRanges,

    possibleBeforeHp,

    possibleAfterHp,
  };
}

function describeCalculatedRanges(
  ranges:
    CalculatedDamageRange[],
): string {
  if (ranges.length === 0) {
    return (
      'no supported damage range'
    );
  }

  const modes =
    new Map<
      string,
      {
        minimum: number;
        maximum: number;
      }
    >();

  for (const range of ranges) {
    const key =
      range.criticalHit
        ? 'critical'
        : 'normal';

    const existing =
      modes.get(key);

    if (!existing) {
      modes.set(key, {
        minimum:
          range.minDamage,

        maximum:
          range.maxDamage,
      });

      continue;
    }

    existing.minimum =
      Math.min(
        existing.minimum,
        range.minDamage,
      );

    existing.maximum =
      Math.max(
        existing.maximum,
        range.maxDamage,
      );
  }

  return [
    ...modes.entries(),
  ]
    .map(
      ([
        hitType,
        range,
      ]) =>
        `${hitType} ` +
        `${range.minimum}–` +
        `${range.maximum} HP`,
    )
    .join(' or ');
}

function observationUsesCandidate(
  observation:
    DamageObservation,

  opponentPokemonIndex:
    number,
): {
  asAttacker: boolean;
  asTarget: boolean;
} {
  return {
    asAttacker:
      observation.attacker.side ===
        'opponent' &&
      observation.attacker
        .pokemonIndex ===
        opponentPokemonIndex,

    asTarget:
      observation.target.side ===
        'opponent' &&
      observation.target
        .pokemonIndex ===
        opponentPokemonIndex,
  };
}

function createExactRejection(
  observation:
    DamageObservation,

  candidate:
    OpponentSetCandidate,

  evaluation:
    DamageCompatibilityResult,
): CandidateRejection {
  return {
    code: 'damage',

    message: [
      `Turn ${observation.turnNumber}:`,
      `${observation.attackerName}`,
      `dealt ${observation.observedDamage}`,
      `HP with ${observation.moveName},`,
      `but ${candidate.label} predicts`,
      describeCalculatedRanges(
        evaluation
          .calculatedRanges,
      ),
      'under the recorded conditions.',
    ].join(' '),
  };
}

function createPercentageRejection(
  observation:
    DamageObservation,

  candidate:
    OpponentSetCandidate,

  evaluation:
    DamageCompatibilityResult,
): CandidateRejection {
  const maximumHp =
    getChampionsStats(
      candidate.build,
    ).hp;

  return {
    code: 'damage',

    message: [
      `Turn ${observation.turnNumber}:`,
      `${observation.targetName}`,
      `changed from`,
      `${observation.hpBefore}%`,
      'to',
      `${observation.hpAfter}%`,
      `after ${observation.moveName}.`,
      `${candidate.label} has`,
      `${maximumHp} maximum HP,`,
      `so those displays mean`,
      `${describePossibleHpValues(
        evaluation
          .possibleBeforeHp,
      )}`,
      'before and',
      `${describePossibleHpValues(
        evaluation
          .possibleAfterHp,
      )}`,
      'after.',
      'The predicted',
      describeCalculatedRanges(
        evaluation
          .calculatedRanges,
      ),
      'cannot produce that transition.',
    ].join(' '),
  };
}

export function evaluateCandidateDamageEvidence(
  battle: BattleState,

  candidate:
    OpponentSetCandidate,

  opponentPokemonIndex:
    number,

  observations:
    DamageObservation[],
): CandidateDamageEvidenceEvaluation {
  const rejections:
  CandidateRejection[] = [];

  let usableEvidenceCount = 0;

  let usableExactEvidenceCount =
    0;

  let usablePercentEvidenceCount =
    0;

  let ignoredEvidenceCount = 0;

  for (
    const observation
    of observations
  ) {
    const candidateUsage =
      observationUsesCandidate(
        observation,
        opponentPokemonIndex,
      );

    if (
      !candidateUsage.asAttacker &&
      !candidateUsage.asTarget
    ) {
      continue;
    }

    if (
      ATTACKER_HP_DEPENDENT_MOVE_IDS.has(
        toID(
          observation.moveName,
        ),
      )
    ) {
      ignoredEvidenceCount += 1;
      continue;
    }

    try {
      /*
       * Exact HP evidence:
       * opponent candidate attacked one of
       * the player's known builds.
       */
      if (
        candidateUsage.asAttacker &&
        observation.target.side ===
          'player' &&
        observation.hpUnit ===
          'exact'
      ) {
        const defender =
          battle.playerPokemon[
            observation.target
              .pokemonIndex
          ];

        if (!defender) {
          ignoredEvidenceCount +=
            1;

          continue;
        }

        const evaluation =
          evaluateExactObservation(
            candidate.build,
            defender.build,
            observation,
          );

        usableEvidenceCount += 1;

        usableExactEvidenceCount +=
          1;

        if (
          !evaluation.compatible
        ) {
          rejections.push(
            createExactRejection(
              observation,
              candidate,
              evaluation,
            ),
          );
        }

        continue;
      }

      /*
       * Percentage evidence:
       * one of the player's exact builds
       * attacked the opponent candidate.
       */
      if (
        candidateUsage.asTarget &&
        observation.attacker.side ===
          'player' &&
        observation.hpUnit ===
          'percent'
      ) {
        const attacker =
          battle.playerPokemon[
            observation.attacker
              .pokemonIndex
          ];

        if (!attacker) {
          ignoredEvidenceCount +=
            1;

          continue;
        }

        const evaluation =
          evaluatePercentageObservation(
            attacker.build,
            candidate,
            observation,
          );

        usableEvidenceCount += 1;

        usablePercentEvidenceCount +=
          1;

        if (
          !evaluation.compatible
        ) {
          rejections.push(
            createPercentageRejection(
              observation,
              candidate,
              evaluation,
            ),
          );
        }

        continue;
      }

      ignoredEvidenceCount += 1;
    } catch {
      /*
       * Unsupported calculator mechanics
       * must not eliminate a candidate.
       */
      ignoredEvidenceCount += 1;
    }
  }

  return {
    compatible:
      rejections.length === 0,

    rejections,

    usableEvidenceCount,

    usableExactEvidenceCount,

    usablePercentEvidenceCount,

    ignoredEvidenceCount,
  };
}