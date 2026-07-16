import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  describePossibleHpValues,
  getPossibleHpValuesForDisplayedPercent,
} from './displayedHpPercent';

describe(
  'displayed opponent HP percentages',
  () => {
    it(
      'treats 0% as fainted',
      () => {
        expect(
          getPossibleHpValuesForDisplayedPercent(
            0,
            200,
          ),
        ).toEqual([0]);
      },
    );

    it(
      'treats 100% as exact maximum HP',
      () => {
        expect(
          getPossibleHpValuesForDisplayedPercent(
            100,
            200,
          ),
        ).toEqual([200]);
      },
    );

    it(
      'accepts conservative floor round and ceiling interpretations',
      () => {
        expect(
          getPossibleHpValuesForDisplayedPercent(
            50,
            200,
          ),
        ).toEqual([
          99,
          100,
          101,
        ]);
      },
    );

    it(
      'returns only living sub-maximum values for an interior percentage',
      () => {
        const possibleValues =
          getPossibleHpValuesForDisplayedPercent(
            63,
            341,
          );

        expect(
          possibleValues.length,
        ).toBeGreaterThan(0);

        expect(
          possibleValues.every(
            (currentHp) =>
              currentHp > 0 &&
              currentHp < 341,
          ),
        ).toBe(true);
      },
    );

    it(
      'describes a possible HP interval',
      () => {
        expect(
          describePossibleHpValues(
            [
              99,
              100,
              101,
            ],
          ),
        ).toBe(
          '99–101 HP',
        );
      },
    );

    it(
      'rejects invalid percentages',
      () => {
        expect(() =>
          getPossibleHpValuesForDisplayedPercent(
            101,
            200,
          ),
        ).toThrow(
          /0 to 100/i,
        );
      },
    );
  },
);