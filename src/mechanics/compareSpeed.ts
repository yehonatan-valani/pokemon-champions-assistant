import type { ChampionsPokemonBuild } from '../domain/pokemonBuild';
import type {
  SpeedComparisonResult,
  SpeedConditions,
  SpeedStage,
} from '../domain/speed';

import { getChampionsStats } from './championsCalculator';

function applySpeedStage(
  speed: number,
  stage: SpeedStage,
): number {
  if (stage >= 0) {
    return Math.floor(
      speed * ((2 + stage) / 2),
    );
  }

  return Math.floor(
    speed * (2 / (2 - stage)),
  );
}

export function calculateEffectiveSpeed(
  build: ChampionsPokemonBuild,
  conditions: SpeedConditions,
): number {
  const baseSpeed = getChampionsStats(build).spe;

  let effectiveSpeed = applySpeedStage(
    baseSpeed,
    conditions.speedStage,
  );

  const normalizedItem = build.item
    .trim()
    .toLowerCase();

  if (normalizedItem === 'choice scarf') {
    effectiveSpeed = Math.floor(
      effectiveSpeed * 1.5,
    );
  }

  if (conditions.paralyzed) {
    effectiveSpeed = Math.floor(
      effectiveSpeed * 0.5,
    );
  }

  if (conditions.tailwind) {
    effectiveSpeed *= 2;
  }

  return Math.max(
    1,
    Math.floor(effectiveSpeed),
  );
}

export function compareSpeed(
  firstBuild: ChampionsPokemonBuild,
  firstConditions: SpeedConditions,
  secondBuild: ChampionsPokemonBuild,
  secondConditions: SpeedConditions,
  trickRoom: boolean,
): SpeedComparisonResult {
  const firstBaseSpeed =
    getChampionsStats(firstBuild).spe;

  const secondBaseSpeed =
    getChampionsStats(secondBuild).spe;

  const firstEffectiveSpeed =
    calculateEffectiveSpeed(
      firstBuild,
      firstConditions,
    );

  const secondEffectiveSpeed =
    calculateEffectiveSpeed(
      secondBuild,
      secondConditions,
    );

  if (
    firstConditions.movePriority >
    secondConditions.movePriority
  ) {
    return {
      firstBaseSpeed,
      secondBaseSpeed,
      firstEffectiveSpeed,
      secondEffectiveSpeed,
      order: 'first',
      reason:
        'The first Pokémon is using a higher-priority move.',
    };
  }

  if (
    secondConditions.movePriority >
    firstConditions.movePriority
  ) {
    return {
      firstBaseSpeed,
      secondBaseSpeed,
      firstEffectiveSpeed,
      secondEffectiveSpeed,
      order: 'second',
      reason:
        'The second Pokémon is using a higher-priority move.',
    };
  }

  if (
    firstEffectiveSpeed ===
    secondEffectiveSpeed
  ) {
    return {
      firstBaseSpeed,
      secondBaseSpeed,
      firstEffectiveSpeed,
      secondEffectiveSpeed,
      order: 'tie',
      reason:
        'Both Pokémon have the same effective Speed.',
    };
  }

  const firstIsFaster =
    firstEffectiveSpeed >
    secondEffectiveSpeed;

  if (trickRoom) {
    return {
      firstBaseSpeed,
      secondBaseSpeed,
      firstEffectiveSpeed,
      secondEffectiveSpeed,
      order: firstIsFaster
        ? 'second'
        : 'first',
      reason:
        'Trick Room makes the slower Pokémon move first.',
    };
  }

  return {
    firstBaseSpeed,
    secondBaseSpeed,
    firstEffectiveSpeed,
    secondEffectiveSpeed,
    order: firstIsFaster
      ? 'first'
      : 'second',
    reason:
      'Move priority is equal, so effective Speed decides.',
  };
}