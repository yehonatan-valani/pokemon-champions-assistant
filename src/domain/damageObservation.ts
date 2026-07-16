import type {
  BattleActorReference,
} from './battleAction';

import type {
  ActiveSlots,
  BattleFieldState,
  BattleStatStages,
  MajorStatus,
} from './battleState';

import type {
  RegulationMoveCategory,
  RegulationMoveTarget,
} from './regulation';

export type CriticalHitObservation =
  | 'no'
  | 'yes'
  | 'unsure';

export type DamageHpUnit =
  | 'exact'
  | 'percent';

export interface DamageObservationTargeting {
  damageMode:
    | 'single'
    | 'spread';

  targetCount: number;

  spreadDamageApplied: boolean;

  source: 'automatic';

  summary: string;
}

export interface DamageObservationContext {
  field: BattleFieldState;

  playerActive: ActiveSlots;

  opponentActive: ActiveSlots;

  attackerStatus: MajorStatus;

  targetStatus: MajorStatus;

  attackerStatStages:
    BattleStatStages;

  targetStatStages:
    BattleStatStages;

  attackerKnownItem: string;

  attackerKnownAbility: string;

  targetKnownItem: string;

  targetKnownAbility: string;
}

export interface DamageObservation {
  id: string;

  turnNumber: number;

  attacker:
    BattleActorReference;

  attackerName: string;

  target:
    BattleActorReference;

  targetName: string;

  moveName: string;

  moveCategory:
    RegulationMoveCategory;

  moveTarget:
    RegulationMoveTarget;

  criticalHit:
    CriticalHitObservation;

  hpUnit:
    DamageHpUnit;

  hpBefore: number;

  hpAfter: number;

  observedDamage: number;

  /**
   * Exact maximum HP is known for the
   * player's Pokémon.
   *
   * It remains null for opposing Pokémon
   * because only their displayed
   * percentage is visible.
   */
  targetMaxHp:
    number | null;

  targeting:
    DamageObservationTargeting;

  context:
    DamageObservationContext;
}

export interface RecordDamageObservationInput {
  attacker:
    BattleActorReference;

  target:
    BattleActorReference;

  moveName: string;

  hpBefore: number;

  hpAfter: number;

  criticalHit:
    CriticalHitObservation;
}