import { toID } from '@smogon/calc';

import {
  CURRENT_REGULATION,
  getRegulationSpeciesEntry,
  isAbilityLegalForSpecies,
  isItemLegalInCurrentRegulation,
  isMoveLegalForSpecies,
} from '../data/currentRegulation';

import type {
  ChampionsPokemonBuild,
} from '../domain/pokemonBuild';

export type BuildRegulationIssueCode =
  | 'species'
  | 'ability'
  | 'item'
  | 'move'
  | 'move-count'
  | 'duplicate-move';

export interface BuildRegulationIssue {
  code: BuildRegulationIssueCode;
  message: string;
  moveIndex?: number;
}

function getNonEmptyMoves(
  build: ChampionsPokemonBuild,
): Array<{
  moveName: string;
  moveIndex: number;
}> {
  return build.moves
    .map((moveName, moveIndex) => ({
      moveName: moveName.trim(),
      moveIndex,
    }))
    .filter(({ moveName }) =>
      Boolean(moveName),
    );
}

export function validateBuildAgainstCurrentRegulation(
  build: ChampionsPokemonBuild,
): BuildRegulationIssue[] {
  const issues: BuildRegulationIssue[] =
    [];

  const species =
    build.species.trim();

  const speciesEntry =
    getRegulationSpeciesEntry(
      species,
    );

  if (!species) {
    issues.push({
      code: 'species',
      message: 'Select a Pokémon species.',
    });
  } else if (!speciesEntry) {
    issues.push({
      code: 'species',

      message:
        `${species} is not legal in ` +
        `${CURRENT_REGULATION.formatName}.`,
    });
  }

  const ability =
    build.ability.trim();

  if (!ability) {
    issues.push({
      code: 'ability',
      message: 'Select an Ability.',
    });
  } else if (
    speciesEntry &&
    !isAbilityLegalForSpecies(
      species,
      ability,
    )
  ) {
    issues.push({
      code: 'ability',

      message:
        `${ability} is not a legal Ability ` +
        `for ${species}.`,
    });
  }

  const item =
    build.item.trim();

  /*
   * An empty item is allowed by this validator.
   * The team editor may still require an item
   * separately.
   */
  if (
    item &&
    !isItemLegalInCurrentRegulation(
      item,
    )
  ) {
    issues.push({
      code: 'item',

      message:
        `${item} is not a legal item in ` +
        `${CURRENT_REGULATION.formatName}.`,
    });
  }

  const moves =
    getNonEmptyMoves(build);

  if (moves.length !== 4) {
    issues.push({
      code: 'move-count',

      message:
        `Select exactly four moves. ` +
        `${moves.length} currently selected.`,
    });
  }

  const seenMoveIds =
    new Set<string>();

  for (
    const {
      moveName,
      moveIndex,
    } of moves
  ) {
    const moveId =
      toID(moveName);

    if (seenMoveIds.has(moveId)) {
      issues.push({
        code: 'duplicate-move',
        moveIndex,

        message:
          `${moveName} appears more than once.`,
      });
    } else {
      seenMoveIds.add(moveId);
    }

    if (
      speciesEntry &&
      !isMoveLegalForSpecies(
        species,
        moveName,
      )
    ) {
      issues.push({
        code: 'move',
        moveIndex,

        message:
          `${moveName} is not a legal move ` +
          `for ${species}.`,
      });
    }
  }

  return issues;
}

export function isBuildLegalInCurrentRegulation(
  build: ChampionsPokemonBuild,
): boolean {
  return (
    validateBuildAgainstCurrentRegulation(
      build,
    ).length === 0
  );
}

export function assertBuildLegalInCurrentRegulation(
  build: ChampionsPokemonBuild,
): void {
  const issues =
    validateBuildAgainstCurrentRegulation(
      build,
    );

  if (issues.length === 0) {
    return;
  }

  throw new Error(
    issues
      .map((issue) => issue.message)
      .join(' '),
  );
}