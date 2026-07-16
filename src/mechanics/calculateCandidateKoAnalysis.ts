import {
  toID,
} from '@smogon/calc';

import type {
  BattleState,
  BattleStatStages,
  MajorStatus,
} from '../domain/battleState';

import type {
  DamageFieldConditions,
} from '../domain/fieldConditions';

import type {
  OpponentSetCandidate,
} from '../domain/opponentCandidate';

import {
  calculateChampionsDamage,
  getChampionsStats,
  type ChampionsCalculatorBoosts,
  type ChampionsCalculatorStatus,
} from './championsCalculator';

import {
  calculateCriticalHitChance,
} from './calculateCriticalHitChance';

import {
  calculateEffectiveAccuracyPercent,
} from './calculateMoveAccuracy';

import {
  getPossibleHpValuesForDisplayedPercent,
} from './displayedHpPercent';

import {
  rankResolvedOpponentSlot,
} from './rankOpponentCandidates';

import {
  resolveMoveTargeting,
} from './resolveMoveTargeting';

import {
  resolveOpponentCandidateSets,
} from './resolveOpponentCandidateSets';

export interface ProbabilityRange {
  minimum: number;
  maximum: number;
}

export interface CandidateKoResult {
  candidate:
    OpponentSetCandidate;

  rank: number;

  /**
   * Relative confidence within the loaded
   * compatible candidate catalog.
   */
  catalogProbability: number;

  confidencePercent: number;

  defenderMaxHp: number;

  possibleCurrentHp: number[];

  criticalHitStage: number;

  criticalHitChance: number;

  criticalHitReason: string;

  normalKoChanceIfHit:
    ProbabilityRange;

  criticalKoChanceIfCritical:
    ProbabilityRange;

  combinedKoChanceIfHit:
    ProbabilityRange;

  overallKoChanceIncludingAccuracy:
    ProbabilityRange;
}

export interface CandidateKoAnalysis {
  attackerPokemonIndex: number;

  attackerName: string;

  targetPokemonIndex: number;

  targetName: string;

  targetDisplayedHpPercent:
    number;

  moveName: string;

  targetingSummary: string;

  targetCount: number;

  spreadDamageApplied:
    boolean;

  baseAccuracyPercent:
    number;

  effectiveAccuracyPercent:
    number;

  totalCatalogCandidates:
    number;

  compatibleCandidateCount:
    number;

  rejectedCandidateCount:
    number;

  confidenceMessage:
    string;

  candidateResults:
    CandidateKoResult[];

  weightedCombinedKoChanceIfHit:
    ProbabilityRange;

  weightedOverallKoChanceIncludingAccuracy:
    ProbabilityRange;
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

function getFieldConditions(
  battle: BattleState,
): DamageFieldConditions {
  return {
    weather:
      battle.field.weather,

    terrain:
      battle.field.terrain,

    attackerHelpingHand:
      false,

    defenderReflect:
      battle.field
        .opponentReflectTurns >
      0,

    defenderLightScreen:
      battle.field
        .opponentLightScreenTurns >
      0,

    defenderAuroraVeil:
      battle.field
        .opponentAuroraVeilTurns >
      0,

    defenderFriendGuard:
      false,
  };
}

function createProbabilityRange(
  values: number[],
): ProbabilityRange {
  if (values.length === 0) {
    return {
      minimum: 0,
      maximum: 0,
    };
  }

  return {
    minimum:
      Math.min(...values),

    maximum:
      Math.max(...values),
  };
}

function createWeightedRange(
  results:
    CandidateKoResult[],

  selectRange: (
    result:
      CandidateKoResult,
  ) => ProbabilityRange,
): ProbabilityRange {
  if (results.length === 0) {
    return {
      minimum: 0,
      maximum: 0,
    };
  }

  const totalProbability =
    results.reduce(
      (
        total,
        result,
      ) =>
        total +
        result.catalogProbability,

      0,
    );

  if (totalProbability <= 0) {
    return {
      minimum: 0,
      maximum: 0,
    };
  }

  const minimum =
    results.reduce(
      (
        total,
        result,
      ) =>
        total +
        (
          result
            .catalogProbability /
          totalProbability
        ) *
          selectRange(
            result,
          ).minimum,

      0,
    );

  const maximum =
    results.reduce(
      (
        total,
        result,
      ) =>
        total +
        (
          result
            .catalogProbability /
          totalProbability
        ) *
          selectRange(
            result,
          ).maximum,

      0,
    );

  return {
    minimum,
    maximum,
  };
}

function validateActivePlayer(
  battle: BattleState,
  pokemonIndex: number,
): void {
  const pokemon =
    battle.playerPokemon[
      pokemonIndex
    ];

  if (!pokemon) {
    throw new Error(
      'The selected attacking Pokémon is invalid.',
    );
  }

  if (
    !battle.playerActive.includes(
      pokemonIndex,
    ) ||
    pokemon.fainted
  ) {
    throw new Error(
      'The selected attacking Pokémon is not currently active.',
    );
  }
}

function validateActiveOpponent(
  battle: BattleState,
  pokemonIndex: number,
): void {
  const pokemon =
    battle.opponentPokemon[
      pokemonIndex
    ];

  if (!pokemon) {
    throw new Error(
      'The selected opposing Pokémon is invalid.',
    );
  }

  if (
    !battle.opponentActive.includes(
      pokemonIndex,
    ) ||
    pokemon.fainted ||
    pokemon.currentHpPercent <= 0
  ) {
    throw new Error(
      'The selected opposing Pokémon is not currently active.',
    );
  }
}

function validateConfiguredMove(
  battle: BattleState,
  attackerPokemonIndex:
    number,
  moveName: string,
): void {
  const cleanedMoveName =
    moveName.trim();

  if (!cleanedMoveName) {
    throw new Error(
      'Select a move.',
    );
  }

  const attacker =
    battle.playerPokemon[
      attackerPokemonIndex
    ];

  const configured =
    attacker.build.moves.some(
      (configuredMove) =>
        toID(configuredMove) ===
        toID(cleanedMoveName),
    );

  if (!configured) {
    throw new Error(
      `${cleanedMoveName} is not configured on ${attacker.build.species}.`,
    );
  }
}

export function calculateCandidateKoAnalysis(
  battle: BattleState,

  candidates:
    OpponentSetCandidate[],

  attackerPokemonIndex:
    number,

  targetPokemonIndex:
    number,

  moveName: string,
): CandidateKoAnalysis {
  validateActivePlayer(
    battle,
    attackerPokemonIndex,
  );

  validateActiveOpponent(
    battle,
    targetPokemonIndex,
  );

  validateConfiguredMove(
    battle,
    attackerPokemonIndex,
    moveName,
  );

  const attacker =
    battle.playerPokemon[
      attackerPokemonIndex
    ];

  const target =
    battle.opponentPokemon[
      targetPokemonIndex
    ];

  const targeting =
    resolveMoveTargeting(
      battle,
      {
        side: 'player',
        pokemonIndex:
          attackerPokemonIndex,
      },
      moveName,
    );

  if (targeting.isStatusMove) {
    throw new Error(
      `${targeting.move.name} is a status move and cannot be used for KO analysis.`,
    );
  }

  if (
    targeting.damageMode ===
      'unsupported' ||
    targeting.damageMode ===
      'none'
  ) {
    throw new Error(
      targeting.summary,
    );
  }

  if (
    targeting.move.target ===
      'self' ||
    targeting.move.target ===
      'adjacentAlly' ||
    targeting.move.target ===
      'adjacentAllyOrSelf'
  ) {
    throw new Error(
      `${targeting.move.name} cannot target the selected opposing Pokémon.`,
    );
  }

  const resolved =
    resolveOpponentCandidateSets(
      battle,
      candidates,
    );

  const targetSlot =
    resolved.slots[
      targetPokemonIndex
    ];

  if (!targetSlot) {
    throw new Error(
      'No candidate slot was found for the selected opponent.',
    );
  }

  const ranking =
    rankResolvedOpponentSlot(
      targetSlot,
    );

  const baseAccuracyPercent =
    targeting.move
      .accuracyPercent ??
    100;

  const effectiveAccuracyPercent =
    calculateEffectiveAccuracyPercent(
      targeting.move
        .accuracyPercent,

      attacker.statStages
        .accuracy,

      target.statStages
        .evasion,
    );

  const fieldConditions =
    getFieldConditions(
      battle,
    );

  const candidateResults =
    ranking.rankedCandidates.map(
      (
        rankedCandidate,
      ): CandidateKoResult => {
        const candidate =
          rankedCandidate
            .evaluation
            .candidate;

        const defenderMaxHp =
          getChampionsStats(
            candidate.build,
          ).hp;

        const possibleCurrentHp =
          getPossibleHpValuesForDisplayedPercent(
            target.currentHpPercent,
            defenderMaxHp,
          ).filter(
            (currentHp) =>
              currentHp > 0,
          );

        if (
          possibleCurrentHp.length ===
          0
        ) {
          throw new Error(
            `No possible current HP values were found for ${candidate.label}.`,
          );
        }

        const criticalHit =
          calculateCriticalHitChance(
            attacker.build,
            candidate.build,
            targeting.move,
          );

        const normalKoChances:
        number[] = [];

        const criticalKoChances:
        number[] = [];

        const combinedKoChances:
        number[] = [];

        const overallKoChances:
        number[] = [];

        for (
          const currentHp
          of possibleCurrentHp
        ) {
          const commonOptions = {
            attackerCurrentHp:
              attacker.currentHp,

            defenderCurrentHp:
              currentHp,

            attackerBoosts:
              toCalculatorBoosts(
                attacker.statStages,
              ),

            defenderBoosts:
              toCalculatorBoosts(
                target.statStages,
              ),

            attackerStatus:
              toCalculatorStatus(
                attacker.status,
              ),

            defenderStatus:
              toCalculatorStatus(
                target.status,
              ),

            spreadDamageApplies:
              targeting
                .spreadDamageApplies,
          };

          const normalResult =
            calculateChampionsDamage(
              attacker.build,
              candidate.build,
              targeting.move.name,
              fieldConditions,
              {
                ...commonOptions,
                criticalHit: false,
              },
            );

          const criticalResult =
            calculateChampionsDamage(
              attacker.build,
              candidate.build,
              targeting.move.name,
              fieldConditions,
              {
                ...commonOptions,
                criticalHit: true,
              },
            );

          const normalKoChance =
            normalResult
              .oneHitKoChance;

          const criticalKoChance =
            criticalHit
              .probability > 0
              ? criticalResult
                  .oneHitKoChance
              : 0;

          const combinedKoChance =
            (
              1 -
              criticalHit
                .probability
            ) *
              normalKoChance +
            criticalHit
              .probability *
              criticalKoChance;

          const overallKoChance =
            combinedKoChance *
            (
              effectiveAccuracyPercent /
              100
            );

          normalKoChances.push(
            normalKoChance,
          );

          criticalKoChances.push(
            criticalKoChance,
          );

          combinedKoChances.push(
            combinedKoChance,
          );

          overallKoChances.push(
            overallKoChance,
          );
        }

        return {
          candidate,

          rank:
            rankedCandidate.rank,

          catalogProbability:
            rankedCandidate
              .probability,

          confidencePercent:
            rankedCandidate
              .confidencePercent,

          defenderMaxHp,

          possibleCurrentHp,

          criticalHitStage:
            criticalHit.stage,

          criticalHitChance:
            criticalHit.probability,

          criticalHitReason:
            criticalHit.reason,

          normalKoChanceIfHit:
            createProbabilityRange(
              normalKoChances,
            ),

          criticalKoChanceIfCritical:
            createProbabilityRange(
              criticalKoChances,
            ),

          combinedKoChanceIfHit:
            createProbabilityRange(
              combinedKoChances,
            ),

          overallKoChanceIncludingAccuracy:
            createProbabilityRange(
              overallKoChances,
            ),
        };
      },
    );

  return {
    attackerPokemonIndex,

    attackerName:
      attacker.build.species,

    targetPokemonIndex,

    targetName:
      target.species,

    targetDisplayedHpPercent:
      target.currentHpPercent,

    moveName:
      targeting.move.name,

    targetingSummary:
      targeting.summary,

    targetCount:
      targeting.targetCount,

    spreadDamageApplied:
      targeting
        .spreadDamageApplies,

    baseAccuracyPercent,

    effectiveAccuracyPercent,

    totalCatalogCandidates:
      targetSlot.totalCandidates,

    compatibleCandidateCount:
      ranking.compatibleCount,

    rejectedCandidateCount:
      ranking.rejectedCount,

    confidenceMessage:
      ranking.confidenceMessage,

    candidateResults,

    weightedCombinedKoChanceIfHit:
      createWeightedRange(
        candidateResults,
        (result) =>
          result
            .combinedKoChanceIfHit,
      ),

    weightedOverallKoChanceIncludingAccuracy:
      createWeightedRange(
        candidateResults,
        (result) =>
          result
            .overallKoChanceIncludingAccuracy,
      ),
  };
}