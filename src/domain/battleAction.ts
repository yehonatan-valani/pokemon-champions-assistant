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
  tailwindActive: boolean;
  paralyzed: boolean;
  speedStage: number;
  knownItem: string;
}

interface BaseBattleActionRecord {
  id: string;
  turnNumber: number;

  /**
   * Order among all structured events recorded
   * during this turn.
   */
  sequence: number;

  actor: BattleActorReference;
  pokemonName: string;
}

export interface MoveUsedBattleAction
  extends BaseBattleActionRecord {
  type: 'move-used';

  /**
   * Order among move actions only.
   *
   * This is the value that will later be used
   * for Speed inference.
   */
  moveOrder: number;

  moveName: string;
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