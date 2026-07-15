import type {
  TerrainCondition,
  WeatherCondition,
} from './fieldConditions';

export type BattleSide =
  | 'player'
  | 'opponent';

export interface BattleActorReference {
  side: BattleSide;
  pokemonIndex: number;
}

export interface ActionOrderContext {
  basePriority: number;

  trickRoomActive: boolean;
  playerTailwindActive: boolean;
  opponentTailwindActive: boolean;

  weather: WeatherCondition;
  terrain: TerrainCondition;

  paralyzed: boolean;
  speedStage: number;

  knownItem: string;
  knownAbility: string;
}

interface BaseBattleActionRecord {
  id: string;
  turnNumber: number;

  /**
   * Order among all structured actions
   * recorded during this turn.
   */
  sequence: number;

  actor: BattleActorReference;
  pokemonName: string;
}

export interface MoveUsedBattleAction
  extends BaseBattleActionRecord {
  type: 'move-used';

  /**
   * Observed order among moves this turn.
   */
  moveOrder: number;

  moveName: string;

  /**
   * False when another effect may have forced
   * the move's position in the action order.
   */
  speedInferenceAllowed: boolean;

  orderContext: ActionOrderContext;
}

export interface AbilityActivatedBattleAction
  extends BaseBattleActionRecord {
  type: 'ability-activated';
  abilityName: string;
}

export type BattleActionRecord =
  | MoveUsedBattleAction
  | AbilityActivatedBattleAction;