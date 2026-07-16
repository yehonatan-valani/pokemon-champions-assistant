function clampAccuracyStage(
  stage: number,
): number {
  if (!Number.isFinite(stage)) {
    return 0;
  }

  return Math.max(
    -6,
    Math.min(
      6,
      Math.trunc(stage),
    ),
  );
}

/**
 * Calculates move accuracy from the
 * generated base accuracy and the
 * recorded Accuracy/Evasion stages.
 *
 * Null represents a move that does not
 * perform an ordinary accuracy check.
 */
export function calculateEffectiveAccuracyPercent(
  baseAccuracyPercent:
    number | null,

  attackerAccuracyStage: number,

  defenderEvasionStage: number,
): number {
  if (
    baseAccuracyPercent === null
  ) {
    return 100;
  }

  const combinedStage =
    clampAccuracyStage(
      clampAccuracyStage(
        attackerAccuracyStage,
      ) -
        clampAccuracyStage(
          defenderEvasionStage,
        ),
    );

  let adjustedAccuracy =
    baseAccuracyPercent;

  if (combinedStage > 0) {
    adjustedAccuracy =
      Math.trunc(
        (
          baseAccuracyPercent *
          (3 + combinedStage)
        ) /
          3,
      );
  } else if (
    combinedStage < 0
  ) {
    adjustedAccuracy =
      Math.trunc(
        (
          baseAccuracyPercent *
          3
        ) /
          (3 - combinedStage),
      );
  }

  return Math.max(
    0,
    Math.min(
      100,
      adjustedAccuracy,
    ),
  );
}