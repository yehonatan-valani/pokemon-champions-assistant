import {
  toID,
} from '@smogon/calc';

import type {
  ChampionsPokemonBuild,
} from '../domain/pokemonBuild';

import type {
  RegulationMoveEntry,
} from '../domain/regulation';

const CRITICAL_HIT_PROBABILITIES = [
  0,
  1 / 24,
  1 / 8,
  1 / 2,
  1,
];

const CRITICAL_HIT_PREVENTION_ABILITIES =
  new Set([
    'battlearmor',
    'shellarmor',
  ]);

const CRITICAL_HIT_BOOSTING_ABILITIES =
  new Set([
    'superluck',
  ]);

const CRITICAL_HIT_BOOSTING_ITEMS =
  new Set([
    'razorclaw',
    'scopelens',
  ]);

export interface CriticalHitChanceResult {
  stage: number;

  probability: number;

  reason: string;
}

function clampCriticalHitStage(
  stage: number,
): number {
  if (!Number.isFinite(stage)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      4,
      Math.trunc(stage),
    ),
  );
}

export function calculateCriticalHitChance(
  attackerBuild:
    ChampionsPokemonBuild,

  defenderBuild:
    ChampionsPokemonBuild,

  move:
    RegulationMoveEntry,
): CriticalHitChanceResult {
  const defenderAbilityId =
    toID(
      defenderBuild.ability,
    );

  if (
    CRITICAL_HIT_PREVENTION_ABILITIES
      .has(defenderAbilityId)
  ) {
    return {
      stage: 0,
      probability: 0,

      reason:
        `${defenderBuild.ability} prevents critical hits.`,
    };
  }

  if (move.alwaysCritical) {
    return {
      stage: 4,
      probability: 1,

      reason:
        `${move.name} always results in a critical hit.`,
    };
  }

  let stage =
    move.critRatio;

  const modifiers:
  string[] = [];

  if (
    CRITICAL_HIT_BOOSTING_ABILITIES
      .has(
        toID(
          attackerBuild.ability,
        ),
      )
  ) {
    stage += 1;

    modifiers.push(
      attackerBuild.ability,
    );
  }

  if (
    CRITICAL_HIT_BOOSTING_ITEMS
      .has(
        toID(
          attackerBuild.item,
        ),
      )
  ) {
    stage += 1;

    modifiers.push(
      attackerBuild.item,
    );
  }

  const clampedStage =
    clampCriticalHitStage(
      stage,
    );

  const probability =
    CRITICAL_HIT_PROBABILITIES[
      clampedStage
    ] ?? 0;

  const modifierText =
    modifiers.length > 0
      ? ` after ${modifiers.join(
          ' and ',
        )}`
      : '';

  return {
    stage:
      clampedStage,

    probability,

    reason:
      `Critical-hit stage ${clampedStage}${modifierText}.`,
  };
}