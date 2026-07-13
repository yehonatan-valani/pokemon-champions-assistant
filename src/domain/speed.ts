export type SpeedStage =
  | -6
  | -5
  | -4
  | -3
  | -2
  | -1
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6;

export interface SpeedConditions {
  tailwind: boolean;
  paralyzed: boolean;
  speedStage: SpeedStage;
  movePriority: number;
}

export interface SpeedComparisonResult {
  firstBaseSpeed: number;
  secondBaseSpeed: number;
  firstEffectiveSpeed: number;
  secondEffectiveSpeed: number;
  order: 'first' | 'second' | 'tie';
  reason: string;
}

export const DEFAULT_SPEED_CONDITIONS: SpeedConditions = {
  tailwind: false,
  paralyzed: false,
  speedStage: 0,
  movePriority: 0,
};