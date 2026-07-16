import {
  getRegulationMoveEntry,
} from '../data/currentRegulation';

import type {
  BattleActorReference,
  BattleSide,
} from '../domain/battleAction';

import type {
  BattleState,
} from '../domain/battleState';

import type {
  RegulationMoveEntry,
  RegulationMoveTarget,
} from '../domain/regulation';

export type ResolvedDamageMode =
  | 'none'
  | 'single'
  | 'spread'
  | 'unsupported';

export type TargetSelectionMode =
  | 'none'
  | 'manual-single'
  | 'automatic';

export interface ResolvedMoveTargeting {
  move:
    RegulationMoveEntry;

  isStatusMove:
    boolean;

  damageMode:
    ResolvedDamageMode;

  selectionMode:
    TargetSelectionMode;

  targetCount:
    number;

  spreadDamageApplies:
    boolean;

  summary:
    string;
}

function getOpposingSide(
  side: BattleSide,
): BattleSide {
  return side === 'player'
    ? 'opponent'
    : 'player';
}

function getActivePokemonIndexes(
  battle: BattleState,
  side: BattleSide,
): number[] {
  const activeIndexes =
    side === 'player'
      ? battle.playerActive
      : battle.opponentActive;

  const pokemonStates =
    side === 'player'
      ? battle.playerPokemon
      : battle.opponentPokemon;

  return [
    ...new Set(
      activeIndexes.filter(
        (
          pokemonIndex,
        ): pokemonIndex is number => {
          if (
            pokemonIndex === null
          ) {
            return false;
          }

          const pokemon =
            pokemonStates[
              pokemonIndex
            ];

          return Boolean(
            pokemon &&
            !pokemon.fainted,
          );
        },
      ),
    ),
  ];
}

function getPotentialTargetCount(
  battle: BattleState,
  actor: BattleActorReference,
  target:
    RegulationMoveTarget,
): number {
  const actorSideIndexes =
    getActivePokemonIndexes(
      battle,
      actor.side,
    );

  const opposingSideIndexes =
    getActivePokemonIndexes(
      battle,
      getOpposingSide(
        actor.side,
      ),
    );

  const activeAllies =
    actorSideIndexes.filter(
      (pokemonIndex) =>
        pokemonIndex !==
        actor.pokemonIndex,
    ).length;

  switch (target) {
    case 'self':
      return 1;

    case 'adjacentAlly':
      return activeAllies;

    case 'adjacentAllyOrSelf':
      return activeAllies + 1;

    case 'allies':
    case 'allySide':
      return actorSideIndexes.length;

    case 'allyTeam':
      return actorSideIndexes.length;

    case 'foeSide':
    case 'allAdjacentFoes':
      return opposingSideIndexes.length;

    case 'allAdjacent':
      return (
        activeAllies +
        opposingSideIndexes.length
      );

    case 'all':
      return (
        actorSideIndexes.length +
        opposingSideIndexes.length
      );

    case 'any':
      return (
        activeAllies +
        opposingSideIndexes.length
      );

    case 'adjacentFoe':
    case 'normal':
    case 'randomNormal':
    case 'scripted':
      return opposingSideIndexes.length >
        0
        ? 1
        : 0;
  }
}

function describeStatusMove(
  move: RegulationMoveEntry,
  targetCount: number,
): string {
  switch (move.target) {
    case 'self':
      return (
        'Status move — affects the user. ' +
        'No damage entry is needed.'
      );

    case 'allySide':
      return (
        'Status move — affects the user’s side. ' +
        'No damage entry is needed.'
      );

    case 'foeSide':
      return (
        'Status move — affects the opposing side. ' +
        'No damage entry is needed.'
      );

    case 'all':
      return (
        'Status move — affects the field or all active Pokémon. ' +
        'No damage entry is needed.'
      );

    case 'allies':
    case 'allyTeam':
      return (
        'Status move — affects the user’s allies or team. ' +
        'No damage entry is needed.'
      );

    case 'adjacentAlly':
      return (
        'Status move — targets one ally. ' +
        'No damage entry is needed.'
      );

    case 'adjacentAllyOrSelf':
      return (
        'Status move — targets the user or one ally. ' +
        'No damage entry is needed.'
      );

    case 'allAdjacentFoes':
      return (
        `Status move — affects ${targetCount} active opposing ` +
        `Pokémon. No damage entry is needed.`
      );

    case 'allAdjacent':
      return (
        `Status move — affects ${targetCount} adjacent ` +
        `Pokémon. No damage entry is needed.`
      );

    default:
      return (
        'Status move — targets one Pokémon. ' +
        'No damage entry is needed.'
      );
  }
}

export function resolveMoveTargeting(
  battle: BattleState,
  actor: BattleActorReference,
  moveName: string,
): ResolvedMoveTargeting {
  const move =
    getRegulationMoveEntry(
      moveName,
    );

  if (!move) {
    throw new Error(
      `No regulation move metadata was found for ${moveName}.`,
    );
  }

  const targetCount =
    getPotentialTargetCount(
      battle,
      actor,
      move.target,
    );

  const isStatusMove =
    move.category === 'Status';

  if (isStatusMove) {
    return {
      move,
      isStatusMove: true,
      damageMode: 'none',
      selectionMode: 'none',
      targetCount,
      spreadDamageApplies:
        false,
      summary:
        describeStatusMove(
          move,
          targetCount,
        ),
    };
  }

  if (
    move.target ===
      'allAdjacentFoes' ||
    move.target ===
      'allAdjacent'
  ) {
    const spreadDamageApplies =
      targetCount >= 2;

    return {
      move,
      isStatusMove: false,

      damageMode:
        spreadDamageApplies
          ? 'spread'
          : 'single',

      selectionMode:
        'automatic',

      targetCount,

      spreadDamageApplies,

      summary:
        spreadDamageApplies
          ? `Damaging spread move — ${targetCount} valid targets are present.`
          : `Damaging move — only ${targetCount} valid target is present, so spread damage does not apply.`,
    };
  }

  if (
    move.target === 'normal' ||
    move.target ===
      'adjacentFoe' ||
    move.target ===
      'randomNormal' ||
    move.target ===
      'scripted' ||
    move.target === 'any' ||
    move.target ===
      'adjacentAlly' ||
    move.target ===
      'adjacentAllyOrSelf'
  ) {
    return {
      move,
      isStatusMove: false,
      damageMode: 'single',

      selectionMode:
        move.target ===
          'randomNormal' ||
        move.target ===
          'scripted'
          ? 'automatic'
          : 'manual-single',

      targetCount,
      spreadDamageApplies:
        false,

      summary:
        'Damaging single-target move.',
    };
  }

  return {
    move,
    isStatusMove: false,
    damageMode: 'unsupported',
    selectionMode: 'none',
    targetCount,
    spreadDamageApplies:
      false,

    summary:
      `Direct damage handling for target type ${move.target} is not implemented yet.`,
  };
}