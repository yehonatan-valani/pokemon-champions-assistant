import { toID } from '@smogon/calc';

import type {
  TimedBattleFieldKey,
} from '../domain/battleState';

import type {
  TerrainCondition,
  WeatherCondition,
} from '../domain/fieldConditions';

export type BattleEffect =
  | {
      kind: 'weather';
      weather: WeatherCondition;
    }
  | {
      kind: 'terrain';
      terrain: TerrainCondition;
    }
  | {
      kind: 'field-turns';
      fieldKey: TimedBattleFieldKey;
      turns: number;
    }
  | {
      kind: 'side-turns';
      playerFieldKey: TimedBattleFieldKey;
      opponentFieldKey: TimedBattleFieldKey;
      turns: number;
    };

const MOVE_BATTLE_EFFECTS:
Record<string, BattleEffect> = {
  [toID('Tailwind')]: {
    kind: 'side-turns',
    playerFieldKey: 'playerTailwindTurns',
    opponentFieldKey: 'opponentTailwindTurns',
    turns: 4,
  },

  [toID('Trick Room')]: {
    kind: 'field-turns',
    fieldKey: 'trickRoomTurns',
    turns: 5,
  },

  [toID('Reflect')]: {
    kind: 'side-turns',
    playerFieldKey: 'playerReflectTurns',
    opponentFieldKey: 'opponentReflectTurns',
    turns: 5,
  },

  [toID('Light Screen')]: {
    kind: 'side-turns',
    playerFieldKey: 'playerLightScreenTurns',
    opponentFieldKey:
      'opponentLightScreenTurns',
    turns: 5,
  },

  [toID('Aurora Veil')]: {
    kind: 'side-turns',
    playerFieldKey:
      'playerAuroraVeilTurns',
    opponentFieldKey:
      'opponentAuroraVeilTurns',
    turns: 5,
  },

  [toID('Rain Dance')]: {
    kind: 'weather',
    weather: 'Rain',
  },

  [toID('Sunny Day')]: {
    kind: 'weather',
    weather: 'Sun',
  },

  [toID('Sandstorm')]: {
    kind: 'weather',
    weather: 'Sand',
  },

  [toID('Snowscape')]: {
    kind: 'weather',
    weather: 'Snow',
  },

  [toID('Electric Terrain')]: {
    kind: 'terrain',
    terrain: 'Electric',
  },

  [toID('Grassy Terrain')]: {
    kind: 'terrain',
    terrain: 'Grassy',
  },

  [toID('Psychic Terrain')]: {
    kind: 'terrain',
    terrain: 'Psychic',
  },

  [toID('Misty Terrain')]: {
    kind: 'terrain',
    terrain: 'Misty',
  },
};

const ABILITY_BATTLE_EFFECTS:
Record<string, BattleEffect> = {
  [toID('Drizzle')]: {
    kind: 'weather',
    weather: 'Rain',
  },

  [toID('Drought')]: {
    kind: 'weather',
    weather: 'Sun',
  },

  [toID('Sand Stream')]: {
    kind: 'weather',
    weather: 'Sand',
  },

  [toID('Snow Warning')]: {
    kind: 'weather',
    weather: 'Snow',
  },

  [toID('Electric Surge')]: {
    kind: 'terrain',
    terrain: 'Electric',
  },

  [toID('Grassy Surge')]: {
    kind: 'terrain',
    terrain: 'Grassy',
  },

  [toID('Psychic Surge')]: {
    kind: 'terrain',
    terrain: 'Psychic',
  },

  [toID('Misty Surge')]: {
    kind: 'terrain',
    terrain: 'Misty',
  },
};

export function getMoveBattleEffect(
  moveName: string,
): BattleEffect | null {
  return (
    MOVE_BATTLE_EFFECTS[toID(moveName)] ??
    null
  );
}

export function getAbilityBattleEffect(
  abilityName: string,
): BattleEffect | null {
  return (
    ABILITY_BATTLE_EFFECTS[
      toID(abilityName)
    ] ?? null
  );
}