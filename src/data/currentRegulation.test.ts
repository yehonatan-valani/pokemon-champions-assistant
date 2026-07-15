import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  CURRENT_REGULATION,
  REGULATION_ITEM_NAMES,
  REGULATION_POKEMON_NAMES,
  getLegalAbilitiesForSpecies,
  getLegalMovesForSpecies,
  isAbilityLegalForSpecies,
  isItemLegalInCurrentRegulation,
  isMoveLegalForSpecies,
  isSpeciesLegalInCurrentRegulation,
} from './currentRegulation';

describe(
  'current Champions regulation data',
  () => {
    it(
      'loads Regulation M-B metadata',
      () => {
        expect(
          CURRENT_REGULATION.regulationId,
        ).toBe(
          'champions-reg-mb',
        );

        expect(
          CURRENT_REGULATION.formatName,
        ).toBe(
          '[Gen 9 Champions] VGC 2026 Reg M-B',
        );
      },
    );

    it(
      'contains legal Pokémon',
      () => {
        expect(
          REGULATION_POKEMON_NAMES.length,
        ).toBeGreaterThan(0);

        expect(
          isSpeciesLegalInCurrentRegulation(
            'Pikachu',
          ),
        ).toBe(true);
      },
    );

    it(
      'returns a species legal move pool',
      () => {
        const moves =
          getLegalMovesForSpecies(
            'Pikachu',
          );

        expect(moves).toContain(
          'Thunderbolt',
        );

        expect(moves).toContain(
          'Fake Out',
        );

        expect(
          isMoveLegalForSpecies(
            'Pikachu',
            'Thunderbolt',
          ),
        ).toBe(true);
      },
    );

    it(
      'returns legal Abilities',
      () => {
        const abilities =
          getLegalAbilitiesForSpecies(
            'Pikachu',
          );

        expect(abilities).toContain(
          'Static',
        );

        expect(abilities).toContain(
          'Lightning Rod',
        );

        expect(
          isAbilityLegalForSpecies(
            'Pikachu',
            'Static',
          ),
        ).toBe(true);
      },
    );

    it(
      'rejects unknown species data',
      () => {
        expect(
          getLegalMovesForSpecies(
            'Not A Pokémon',
          ),
        ).toEqual([]);

        expect(
          getLegalAbilitiesForSpecies(
            'Not A Pokémon',
          ),
        ).toEqual([]);
      },
    );

    it(
      'contains regulation-legal items',
      () => {
        expect(
          REGULATION_ITEM_NAMES.length,
        ).toBeGreaterThan(0);

        expect(
          isItemLegalInCurrentRegulation(
            'Focus Sash',
          ),
        ).toBe(true);
      },
    );

    it(
      'contains no duplicate species names',
      () => {
        const uniqueNames =
          new Set(
            REGULATION_POKEMON_NAMES,
          );

        expect(uniqueNames.size).toBe(
          REGULATION_POKEMON_NAMES.length,
        );
      },
    );
  },
);