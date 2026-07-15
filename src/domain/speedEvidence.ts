import type {
  ActionOrderContext,
  BattleActorReference,
} from './battleAction';

export type EffectiveSpeedRelation =
  | 'greater-than-or-equal'
  | 'less-than-or-equal';

export interface SpeedEvidence {
  id: string;
  turnNumber: number;

  earlierActionId: string;
  laterActionId: string;

  earlierMoveOrder: number;
  laterMoveOrder: number;

  earlierActor: BattleActorReference;
  laterActor: BattleActorReference;

  earlierPokemonName: string;
  laterPokemonName: string;

  earlierMoveName: string;
  laterMoveName: string;

  priority: number;

  relation: EffectiveSpeedRelation;

  earlierContext: ActionOrderContext;
  laterContext: ActionOrderContext;
}