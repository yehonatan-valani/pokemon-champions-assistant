import {
  toID,
} from '@smogon/calc';

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
  BattleState,
  BattleStatStages,
  MajorStatus,
} from '../domain/battleState';

import {
  calculateChampionsDamage,
  type ChampionsCalculatorBoosts,
  type ChampionsCalculatorStatus,
} from './championsCalculator';

/*
 * These moves depend on the attacker's
 * exact current HP.
 *
 * Opposing Pokémon currently expose only
 * a displayed percentage, so we cannot
 * calculate them exactly yet.
 */
const ATTACKER_HP_DEPENDENT_MOVE_IDS =
  new Set([
    'eruption',
    'waterspout',
    'dragonenergy',
    'flail',
    'reversal',
  ]);

export interface CandidateDamageEvidenceEvaluation {
  compatible: boolean;

  rejections:
    CandidateRejection[];

  usableEvidenceCount: number;

  ignoredEvidenceCount: number;
}

interface CalculatedDamageRange {
  criticalHit: boolean;

  minDamage: number;

  maxDamage: number;
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
  observation: DamageObservation,
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
        ? field.playerReflectTurns > 0
        : field.opponentReflectTurns >
          0,

    defenderLightScreen:
      targetIsPlayer
        ? field.playerLightScreenTurns >
          0
        : field
            .opponentLightScreenTurns >
          0,

    defenderAuroraVeil:
      targetIsPlayer
        ? field.playerAuroraVeilTurns >
          0
        : field
            .opponentAuroraVeilTurns >
          0,

    defenderFriendGuard: false,
  };
}

function observedLossMatchesRange(
  observation:
    DamageObservation,

  range:
    CalculatedDamageRange,
): boolean {
  /*
   * When the target fainted, the game only
   * shows the HP that remained before the
   * attack.
   *
   * For example, 200 calculated damage into
   * a Pokémon with 40 HP remaining appears
   * as an observed loss of exactly 40 HP.
   */
  if (observation.hpAfter === 0) {
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

function describeRange(
  range: CalculatedDamageRange,
): string {
  const hitType =
    range.criticalHit
      ? 'critical'
      : 'normal';

  return (
    `${hitType} ` +
    `${range.minDamage}–` +
    `${range.maxDamage} HP`
  );
}

function observationUsesCandidate(
  observation:
    DamageObservation,

  opponentPokemonIndex: number,
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

export function evaluateCandidateDamageEvidence(
  battle: BattleState,

  candidate:
    OpponentSetCandidate,

  opponentPokemonIndex: number,

  observations:
    DamageObservation[],
): CandidateDamageEvidenceEvaluation {
  const rejections:
  CandidateRejection[] = [];

  let usableEvidenceCount = 0;
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

    /*
     * This milestone evaluates exact damage
     * caused by an opponent to the player's
     * Pokémon.
     *
     * Percentage observations where the
     * candidate was the defender are kept
     * but not used for rejection yet.
     */
    if (
      !candidateUsage.asAttacker ||
      observation.target.side !==
        'player' ||
      observation.hpUnit !==
        'exact'
    ) {
      ignoredEvidenceCount += 1;
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

    const defender =
      battle.playerPokemon[
        observation.target
          .pokemonIndex
      ];

    if (!defender) {
      ignoredEvidenceCount += 1;
      continue;
    }

    const criticalModes:
    boolean[] =
      observation.criticalHit ===
      'yes'
        ? [true]
        : observation.criticalHit ===
            'no'
          ? [false]
          : [false, true];

    const calculatedRanges:
    CalculatedDamageRange[] = [];

    try {
      for (
        const criticalHit
        of criticalModes
      ) {
        const result =
          calculateChampionsDamage(
            candidate.build,
            defender.build,
            observation.moveName,
            getDamageFieldConditions(
              observation,
            ),
            {
              defenderCurrentHp:
                observation.hpBefore,

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

        calculatedRanges.push({
          criticalHit,

          minDamage:
            result.minDamage,

          maxDamage:
            result.maxDamage,
        });
      }
    } catch {
      /*
       * Unsupported calculator mechanics
       * must not eliminate a candidate.
       */
      ignoredEvidenceCount += 1;
      continue;
    }

    usableEvidenceCount += 1;

    const compatible =
      calculatedRanges.some(
        (range) =>
          observedLossMatchesRange(
            observation,
            range,
          ),
      );

    if (compatible) {
      continue;
    }

    rejections.push({
      code: 'damage',

      message: [
        `Turn ${observation.turnNumber}:`,
        `${observation.attackerName}`,
        `dealt ${observation.observedDamage}`,
        `HP with ${observation.moveName},`,
        `but ${candidate.label} predicts`,
        calculatedRanges
          .map(describeRange)
          .join(' or '),
        'under the recorded conditions.',
      ].join(' '),
    });
  }

  return {
    compatible:
      rejections.length === 0,

    rejections,

    usableEvidenceCount,

    ignoredEvidenceCount,
  };
}