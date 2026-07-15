import { toID } from '@smogon/calc';

import type {
  ActionOrderContext,
  BattleSide,
} from '../domain/battleAction';

import type {
  ChampionsPokemonBuild,
} from '../domain/pokemonBuild';

import {
  getChampionsStats,
} from './championsCalculator';

export interface InferenceSpeedOverrides {
  item?: string;
  ability?: string;
}

export interface InferenceSpeedResult {
  supported: boolean;
  effectiveSpeed: number | null;
  reason: string;
}

const UNSAFE_ORDER_ITEMS = new Set([
  'quickclaw',
  'custapberry',
  'laggingtail',
  'fullincense',
  'roomservice',
]);

const UNSAFE_ORDER_ABILITIES = new Set([
  'prankster',
  'galewings',
  'triage',
  'stall',
  'myceliummight',
  'quickdraw',
  'unburden',
  'protosynthesis',
  'quarkdrive',
  'quickfeet',
  'slowstart',
]);

const HALF_SPEED_ITEMS = new Set([
  'ironball',
  'machobrace',
  'poweranklet',
  'powerband',
  'powerbelt',
  'powerbracer',
  'powerlens',
  'powerweight',
]);

function applySpeedStage(
  baseSpeed: number,
  stage: number,
): number {
  const clampedStage = Math.max(
    -6,
    Math.min(6, Math.trunc(stage)),
  );

  if (clampedStage >= 0) {
    return Math.floor(
      baseSpeed *
        (2 + clampedStage) /
        2,
    );
  }

  return Math.floor(
    baseSpeed *
      2 /
      (2 - clampedStage),
  );
}

function applyFraction(
  value: number,
  numerator: number,
  denominator: number,
): number {
  return Math.floor(
    value * numerator / denominator,
  );
}

function abilityDoublesSpeed(
  abilityId: string,
  context: ActionOrderContext,
): boolean {
  if (
    abilityId === 'swiftswim' &&
    (
      context.weather === 'Rain' ||
      context.weather === 'Heavy Rain'
    )
  ) {
    return true;
  }

  if (
    abilityId === 'chlorophyll' &&
    (
      context.weather === 'Sun' ||
      context.weather ===
        'Harsh Sunshine'
    )
  ) {
    return true;
  }

  if (
    abilityId === 'sandrush' &&
    context.weather === 'Sand'
  ) {
    return true;
  }

  if (
    abilityId === 'slushrush' &&
    context.weather === 'Snow'
  ) {
    return true;
  }

  if (
    abilityId === 'surgesurfer' &&
    context.terrain === 'Electric'
  ) {
    return true;
  }

  return false;
}

export function calculateInferenceSpeed(
  build: ChampionsPokemonBuild,
  context: ActionOrderContext,
  side: BattleSide,
  overrides: InferenceSpeedOverrides = {},
): InferenceSpeedResult {
  const item =
    overrides.item ?? build.item;

  const ability =
    overrides.ability ?? build.ability;

  const itemId = toID(item);
  const abilityId = toID(ability);

  if (UNSAFE_ORDER_ITEMS.has(itemId)) {
    return {
      supported: false,
      effectiveSpeed: null,
      reason:
        `${item || 'The item'} can alter action order in a way that is not supported yet.`,
    };
  }

  if (
    UNSAFE_ORDER_ABILITIES.has(
      abilityId,
    )
  ) {
    return {
      supported: false,
      effectiveSpeed: null,
      reason:
        `${ability || 'The ability'} can alter action order or Speed in a way that is not supported yet.`,
    };
  }

  const baseSpeed =
    getChampionsStats(build).spe;

  let effectiveSpeed =
    applySpeedStage(
      baseSpeed,
      context.speedStage,
    );

  if (itemId === 'choicescarf') {
    effectiveSpeed = applyFraction(
      effectiveSpeed,
      3,
      2,
    );
  }

  if (HALF_SPEED_ITEMS.has(itemId)) {
    effectiveSpeed = applyFraction(
      effectiveSpeed,
      1,
      2,
    );
  }

  if (
    abilityDoublesSpeed(
      abilityId,
      context,
    )
  ) {
    effectiveSpeed *= 2;
  }

  if (context.paralyzed) {
    effectiveSpeed = applyFraction(
      effectiveSpeed,
      1,
      2,
    );
  }

  const tailwindActive =
    side === 'player'
      ? context.playerTailwindActive
      : context.opponentTailwindActive;

  if (tailwindActive) {
    effectiveSpeed *= 2;
  }

  return {
    supported: true,
    effectiveSpeed,
    reason: '',
  };
}