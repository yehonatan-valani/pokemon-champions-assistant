function assertValidDisplayedPercent(
  displayedPercent: number,
): void {
  if (
    !Number.isInteger(
      displayedPercent,
    ) ||
    displayedPercent < 0 ||
    displayedPercent > 100
  ) {
    throw new Error(
      'Displayed HP percentage must be a whole number from 0 to 100.',
    );
  }
}

function assertValidMaximumHp(
  maximumHp: number,
): void {
  if (
    !Number.isInteger(
      maximumHp,
    ) ||
    maximumHp < 1
  ) {
    throw new Error(
      'Maximum HP must be a positive whole number.',
    );
  }
}

function normalizeNonTerminalDisplay(
  displayedPercent: number,
): number {
  /*
   * A living Pokémon should not display
   * as 0%, and a Pokémon below maximum HP
   * should not display as 100%.
   *
   * This preserves those useful boundary
   * guarantees while remaining
   * conservative about interior rounding.
   */
  return Math.max(
    1,
    Math.min(
      99,
      displayedPercent,
    ),
  );
}

/**
 * Returns every integer current-HP value
 * that could conservatively correspond to
 * the displayed whole-number percentage.
 *
 * Until Champions' exact display rounding
 * is confirmed, floor, nearest rounding,
 * and ceiling are all accepted.
 */
export function getPossibleHpValuesForDisplayedPercent(
  displayedPercent: number,
  maximumHp: number,
): number[] {
  assertValidDisplayedPercent(
    displayedPercent,
  );

  assertValidMaximumHp(
    maximumHp,
  );

  if (displayedPercent === 0) {
    return [0];
  }

  if (displayedPercent === 100) {
    return [maximumHp];
  }

  const possibleValues:
  number[] = [];

  for (
    let currentHp = 1;
    currentHp < maximumHp;
    currentHp += 1
  ) {
    const exactPercent =
      (
        currentHp /
        maximumHp
      ) *
      100;

    const possibleDisplays =
      new Set([
        normalizeNonTerminalDisplay(
          Math.floor(
            exactPercent,
          ),
        ),

        normalizeNonTerminalDisplay(
          Math.round(
            exactPercent,
          ),
        ),

        normalizeNonTerminalDisplay(
          Math.ceil(
            exactPercent,
          ),
        ),
      ]);

    if (
      possibleDisplays.has(
        displayedPercent,
      )
    ) {
      possibleValues.push(
        currentHp,
      );
    }
  }

  return possibleValues;
}

export function describePossibleHpValues(
  values: number[],
): string {
  if (values.length === 0) {
    return 'no possible HP values';
  }

  const minimum =
    Math.min(...values);

  const maximum =
    Math.max(...values);

  if (minimum === maximum) {
    return `${minimum} HP`;
  }

  return `${minimum}–${maximum} HP`;
}