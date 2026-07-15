import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  getLegalAbilitiesForSpecies,
  getLegalMovesForSpecies,
} from '../data/currentRegulation';

import type {
  ChampionsPokemonBuild,
} from '../domain/pokemonBuild';

import {
  assertBuildLegalInCurrentRegulation,
  isBuildLegalInCurrentRegulation,
  validateBuildAgainstCurrentRegulation,
} from './validateRegulationBuild';

function createLegalPikachuBuild():
ChampionsPokemonBuild {
  const legalMoves =
    getLegalMovesForSpecies(
      'Pikachu',
    );

  const legalAbilities =
    getLegalAbilitiesForSpecies(
      'Pikachu',
    );

  if (legalMoves.length < 4) {
    throw new Error(
      'Pikachu needs at least four legal moves for this test.',
    );
  }

  if (legalAbilities.length === 0) {
    throw new Error(
      'Pikachu needs at least one legal Ability for this test.',
    );
  }

  return {
    species: 'Pikachu',
    nature: 'Timid',
    ability: legalAbilities[0],
    item: 'Focus Sash',

    moves: [
      legalMoves[0],
      legalMoves[1],
      legalMoves[2],
      legalMoves[3],
    ],

    statPoints: {
      hp: 0,
      atk: 0,
      def: 2,
      spa: 32,
      spd: 0,
      spe: 32,
    },
  };
}

describe(
  'regulation build validation',
  () => {
    it(
      'accepts a legal build',
      () => {
        const build =
          createLegalPikachuBuild();

        expect(
          validateBuildAgainstCurrentRegulation(
            build,
          ),
        ).toEqual([]);

        expect(
          isBuildLegalInCurrentRegulation(
            build,
          ),
        ).toBe(true);

        expect(() =>
          assertBuildLegalInCurrentRegulation(
            build,
          ),
        ).not.toThrow();
      },
    );

    it(
      'rejects an illegal species',
      () => {
        const build: ChampionsPokemonBuild = {
          ...createLegalPikachuBuild(),
          species: 'Not A Pokémon',
        };

        const issues =
          validateBuildAgainstCurrentRegulation(
            build,
          );

        expect(
          issues.some(
            (issue) =>
              issue.code === 'species',
          ),
        ).toBe(true);
      },
    );

    it(
      'rejects an illegal Ability',
      () => {
        const build: ChampionsPokemonBuild = {
          ...createLegalPikachuBuild(),
          ability: 'Levitate',
        };

        const issues =
          validateBuildAgainstCurrentRegulation(
            build,
          );

        expect(
          issues.some(
            (issue) =>
              issue.code === 'ability',
          ),
        ).toBe(true);
      },
    );

    it(
      'rejects an illegal move',
      () => {
        const legalBuild =
          createLegalPikachuBuild();

        const build: ChampionsPokemonBuild = {
          ...legalBuild,

          moves: [
            'Hydro Pump',
            legalBuild.moves[1],
            legalBuild.moves[2],
            legalBuild.moves[3],
          ],
        };

        const issues =
          validateBuildAgainstCurrentRegulation(
            build,
          );

        expect(
          issues.some(
            (issue) =>
              issue.code === 'move',
          ),
        ).toBe(true);
      },
    );

    it(
      'rejects duplicate moves',
      () => {
        const legalBuild =
          createLegalPikachuBuild();

        const build: ChampionsPokemonBuild = {
          ...legalBuild,

          moves: [
            legalBuild.moves[0],
            legalBuild.moves[0],
            legalBuild.moves[2],
            legalBuild.moves[3],
          ],
        };

        const issues =
          validateBuildAgainstCurrentRegulation(
            build,
          );

        expect(
          issues.some(
            (issue) =>
              issue.code ===
              'duplicate-move',
          ),
        ).toBe(true);
      },
    );

    it(
      'requires four moves',
      () => {
        const legalBuild =
          createLegalPikachuBuild();

        const build: ChampionsPokemonBuild = {
          ...legalBuild,

          moves: [
            legalBuild.moves[0],
            legalBuild.moves[1],
            '',
            '',
          ],
        };

        const issues =
          validateBuildAgainstCurrentRegulation(
            build,
          );

        expect(
          issues.some(
            (issue) =>
              issue.code ===
              'move-count',
          ),
        ).toBe(true);
      },
    );

    it(
      'rejects an unknown item',
      () => {
        const build: ChampionsPokemonBuild = {
          ...createLegalPikachuBuild(),

          item:
            'Definitely Not An Item',
        };

        const issues =
          validateBuildAgainstCurrentRegulation(
            build,
          );

        expect(
          issues.some(
            (issue) =>
              issue.code === 'item',
          ),
        ).toBe(true);
      },
    );
  },
);