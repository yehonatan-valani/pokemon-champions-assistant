export const STAT_KEYS = [
  'hp',
  'atk',
  'def',
  'spa',
  'spd',
  'spe',
] as const;

export type StatKey = (typeof STAT_KEYS)[number];

export type StatPoints = Record<StatKey, number>;

export const MAX_SP_PER_STAT = 32;
export const MAX_TOTAL_SP = 65;

export const EMPTY_STAT_POINTS: StatPoints = {
  hp: 0,
  atk: 0,
  def: 0,
  spa: 0,
  spd: 0,
  spe: 0,
};

export const STAT_LABELS: Record<StatKey, string> = {
  hp: 'HP',
  atk: 'Attack',
  def: 'Defense',
  spa: 'Special Attack',
  spd: 'Special Defense',
  spe: 'Speed',
};

export function getTotalStatPoints(stats: StatPoints): number {
  return STAT_KEYS.reduce((total, stat) => total + stats[stat], 0);
}

export function clampStatPoint(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(MAX_SP_PER_STAT, Math.floor(value)),
  );
}

export function isValidStatPoints(stats: StatPoints): boolean {
  const everyStatIsValid = STAT_KEYS.every((stat) => {
    const value = stats[stat];

    return (
      Number.isInteger(value) &&
      value >= 0 &&
      value <= MAX_SP_PER_STAT
    );
  });

  return (
    everyStatIsValid &&
    getTotalStatPoints(stats) <= MAX_TOTAL_SP
  );
}