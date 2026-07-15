import {
  ABILITY_NAMES,
  getMoveMetadata,
} from '../data/championsData';

import {
  getAbilityBattleEffect,
  getMoveBattleEffect,
  type BattleEffect,
} from '../data/battleEffects';

import type {
  BattleActionRecord,
  BattleActorReference,
  MoveUsedBattleAction,
} from '../domain/battleAction';

import {
  revealOpponentMove,
  setBattleFieldTurns,
  setBattleTerrain,
  setBattleWeather,
  setOpponentRevealedAbility,
  type BattleState,
} from '../domain/battleState';

function assertActorIsActive(
  battle: BattleState,
  actor: BattleActorReference,
): void {
  const activeSlots =
    actor.side === 'player'
      ? battle.playerActive
      : battle.opponentActive;

  if (
    !activeSlots.includes(
      actor.pokemonIndex,
    )
  ) {
    throw new Error(
      'The selected actor is not currently active.',
    );
  }
}

function getActorName(
  battle: BattleState,
  actor: BattleActorReference,
): string {
  if (actor.side === 'player') {
    const pokemon =
      battle.playerPokemon[
        actor.pokemonIndex
      ];

    if (!pokemon) {
      throw new Error(
        'The selected player Pokémon is invalid.',
      );
    }

    return pokemon.build.species;
  }

  const pokemon =
    battle.opponentPokemon[
      actor.pokemonIndex
    ];

  if (!pokemon) {
    throw new Error(
      'The selected opponent Pokémon is invalid.',
    );
  }

  return pokemon.species;
}

function getNextSequence(
  battle: BattleState,
): number {
  return (
    battle.actionHistory.filter(
      (action) =>
        action.turnNumber ===
        battle.turnNumber,
    ).length + 1
  );
}

function getNextMoveOrder(
  battle: BattleState,
): number {
  return (
    battle.actionHistory.filter(
      (
        action,
      ): action is MoveUsedBattleAction =>
        action.turnNumber ===
          battle.turnNumber &&
        action.type === 'move-used',
    ).length + 1
  );
}

function createActionId(
  battle: BattleState,
  sequence: number,
  actionType: string,
): string {
  return [
    battle.turnNumber,
    sequence,
    actionType,
  ].join('-');
}

function applyBattleEffect(
  battle: BattleState,
  actor: BattleActorReference,
  effect: BattleEffect | null,
): BattleState {
  if (!effect) {
    return battle;
  }

  if (effect.kind === 'weather') {
    return setBattleWeather(
      battle,
      effect.weather,
    );
  }

  if (effect.kind === 'terrain') {
    return setBattleTerrain(
      battle,
      effect.terrain,
    );
  }

  if (effect.kind === 'field-turns') {
    return setBattleFieldTurns(
      battle,
      effect.fieldKey,
      effect.turns,
    );
  }

  const sideFieldKey =
    actor.side === 'player'
      ? effect.playerFieldKey
      : effect.opponentFieldKey;

  return setBattleFieldTurns(
    battle,
    sideFieldKey,
    effect.turns,
  );
}

function appendAction(
  battle: BattleState,
  action: BattleActionRecord,
  historyMessage: string,
): BattleState {
  return {
    ...battle,

    actionHistory: [
      ...battle.actionHistory,
      action,
    ],

    eventHistory: [
      ...battle.eventHistory,
      historyMessage,
    ],
  };
}

function getOrderContext(
  battle: BattleState,
  actor: BattleActorReference,
  basePriority: number,
) {
  if (actor.side === 'player') {
    const pokemon =
      battle.playerPokemon[
        actor.pokemonIndex
      ];

    return {
      basePriority,
      trickRoomActive:
        battle.field.trickRoomTurns > 0,
      tailwindActive:
        battle.field.playerTailwindTurns >
        0,
      paralyzed:
        pokemon.status === 'Paralysis',
      speedStage:
        pokemon.statStages.spe,
      knownItem: pokemon.build.item,
    };
  }

  const pokemon =
    battle.opponentPokemon[
      actor.pokemonIndex
    ];

  return {
    basePriority,
    trickRoomActive:
      battle.field.trickRoomTurns > 0,
    tailwindActive:
      battle.field.opponentTailwindTurns >
      0,
    paralyzed:
      pokemon.status === 'Paralysis',
    speedStage:
      pokemon.statStages.spe,
    knownItem: pokemon.revealedItem,
  };
}

export function recordMoveUsed(
  battle: BattleState,
  actor: BattleActorReference,
  moveName: string,
): BattleState {
  assertActorIsActive(battle, actor);

  const moveMetadata =
    getMoveMetadata(moveName);

  const pokemonName = getActorName(
    battle,
    actor,
  );

  const sequence =
    getNextSequence(battle);

  const moveOrder =
    getNextMoveOrder(battle);

  let nextBattle = battle;

  if (actor.side === 'opponent') {
    nextBattle = revealOpponentMove(
      nextBattle,
      actor.pokemonIndex,
      moveMetadata.name,
    );
  }

  nextBattle = applyBattleEffect(
    nextBattle,
    actor,
    getMoveBattleEffect(
      moveMetadata.name,
    ),
  );

  const action: MoveUsedBattleAction = {
    id: createActionId(
      battle,
      sequence,
      'move',
    ),

    type: 'move-used',
    turnNumber: battle.turnNumber,
    sequence,
    moveOrder,

    actor,
    pokemonName,
    moveName: moveMetadata.name,

    orderContext: getOrderContext(
      battle,
      actor,
      moveMetadata.priority,
    ),
  };

  return appendAction(
    nextBattle,
    action,
    `Turn ${battle.turnNumber}, move ${moveOrder}: ${pokemonName} used ${moveMetadata.name}.`,
  );
}

export function recordAbilityActivated(
  battle: BattleState,
  actor: BattleActorReference,
  abilityName: string,
): BattleState {
  assertActorIsActive(battle, actor);

  const cleanedAbility =
    abilityName.trim();

  const canonicalAbility =
    ABILITY_NAMES.find(
      (knownAbility) =>
        knownAbility.toLowerCase() ===
        cleanedAbility.toLowerCase(),
    );

  if (!canonicalAbility) {
    throw new Error(
      'Select a valid ability.',
    );
  }

  const pokemonName = getActorName(
    battle,
    actor,
  );

  const sequence =
    getNextSequence(battle);

  let nextBattle = battle;

  if (actor.side === 'opponent') {
    nextBattle =
      setOpponentRevealedAbility(
        nextBattle,
        actor.pokemonIndex,
        canonicalAbility,
      );
  }

  nextBattle = applyBattleEffect(
    nextBattle,
    actor,
    getAbilityBattleEffect(
      canonicalAbility,
    ),
  );

  const action: BattleActionRecord = {
    id: createActionId(
      battle,
      sequence,
      'ability',
    ),

    type: 'ability-activated',
    turnNumber: battle.turnNumber,
    sequence,

    actor,
    pokemonName,
    abilityName: canonicalAbility,
  };

  return appendAction(
    nextBattle,
    action,
    `Turn ${battle.turnNumber}: ${pokemonName}'s ${canonicalAbility} activated.`,
  );
}