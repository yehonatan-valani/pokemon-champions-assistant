import {
  toID,
} from '@smogon/calc';

import {
  isMoveLegalForSpecies,
} from '../data/currentRegulation';

import type {
  BattleActorReference,
} from '../domain/battleAction';

import type {
  CriticalHitObservation,
  DamageHpUnit,
  DamageObservation,
  RecordDamageObservationInput,
} from '../domain/damageObservation';

import type {
  RegulationMoveTarget,
} from '../domain/regulation';

import {
  revealOpponentMove,
  setOpponentPokemonHp,
  setPlayerPokemonHp,
  type ActiveSlots,
  type BattleState,
  type RuntimePokemonState,
} from '../domain/battleState';

import {
  resolveMoveTargeting,
} from './resolveMoveTargeting';

function referencesAreEqual(
  first:
    BattleActorReference,

  second:
    BattleActorReference,
): boolean {
  return (
    first.side === second.side &&
    first.pokemonIndex ===
      second.pokemonIndex
  );
}

function assertReferenceExists(
  battle: BattleState,
  reference:
    BattleActorReference,
): void {
  const pokemon =
    reference.side === 'player'
      ? battle.playerPokemon[
          reference.pokemonIndex
        ]
      : battle.opponentPokemon[
          reference.pokemonIndex
        ];

  if (!pokemon) {
    throw new Error(
      'The selected Pokémon is invalid.',
    );
  }
}

function assertReferenceIsActive(
  battle: BattleState,
  reference:
    BattleActorReference,
  role: string,
): void {
  assertReferenceExists(
    battle,
    reference,
  );

  const activeSlots =
    reference.side === 'player'
      ? battle.playerActive
      : battle.opponentActive;

  if (
    !activeSlots.includes(
      reference.pokemonIndex,
    )
  ) {
    throw new Error(
      `The selected ${role} is not currently active.`,
    );
  }
}

function getPokemonName(
  battle: BattleState,
  reference:
    BattleActorReference,
): string {
  assertReferenceExists(
    battle,
    reference,
  );

  if (
    reference.side === 'player'
  ) {
    return battle.playerPokemon[
      reference.pokemonIndex
    ].build.species;
  }

  return battle.opponentPokemon[
    reference.pokemonIndex
  ].species;
}

function getRuntimePokemonState(
  battle: BattleState,
  reference:
    BattleActorReference,
): RuntimePokemonState {
  assertReferenceExists(
    battle,
    reference,
  );

  if (
    reference.side === 'player'
  ) {
    return battle.playerPokemon[
      reference.pokemonIndex
    ];
  }

  return battle.opponentPokemon[
    reference.pokemonIndex
  ];
}

function getKnownItem(
  battle: BattleState,
  reference:
    BattleActorReference,
): string {
  if (
    reference.side === 'player'
  ) {
    return battle.playerPokemon[
      reference.pokemonIndex
    ].build.item;
  }

  return battle.opponentPokemon[
    reference.pokemonIndex
  ].revealedItem;
}

function getKnownAbility(
  battle: BattleState,
  reference:
    BattleActorReference,
): string {
  if (
    reference.side === 'player'
  ) {
    return battle.playerPokemon[
      reference.pokemonIndex
    ].build.ability;
  }

  return battle.opponentPokemon[
    reference.pokemonIndex
  ].revealedAbility;
}

function assertMoveLegalForAttacker(
  battle: BattleState,
  attacker:
    BattleActorReference,
  moveName: string,
): void {
  const cleanedMoveName =
    moveName.trim();

  if (!cleanedMoveName) {
    throw new Error(
      'A move name is required.',
    );
  }

  const attackerName =
    getPokemonName(
      battle,
      attacker,
    );

  if (
    !isMoveLegalForSpecies(
      attackerName,
      cleanedMoveName,
    )
  ) {
    throw new Error(
      `${cleanedMoveName} is not legal for ${attackerName} ` +
        'in the current regulation.',
    );
  }

  if (
    attacker.side === 'player'
  ) {
    const configuredMoves =
      battle.playerPokemon[
        attacker.pokemonIndex
      ].build.moves;

    const moveIsConfigured =
      configuredMoves.some(
        (configuredMove) =>
          toID(configuredMove) ===
          toID(cleanedMoveName),
      );

    if (!moveIsConfigured) {
      throw new Error(
        `${cleanedMoveName} is not configured on your ${attackerName}.`,
      );
    }
  }
}

function assertTargetCompatible(
  attacker:
    BattleActorReference,

  target:
    BattleActorReference,

  moveTarget:
    RegulationMoveTarget,
): void {
  const sameSide =
    attacker.side === target.side;

  switch (moveTarget) {
    case 'adjacentFoe':
    case 'allAdjacentFoes':
    case 'normal':
    case 'randomNormal':
      if (sameSide) {
        throw new Error(
          'This move must target an opposing Pokémon.',
        );
      }

      return;

    case 'adjacentAlly':
    case 'adjacentAllyOrSelf':
      if (!sameSide) {
        throw new Error(
          'This move must target a Pokémon on the user’s side.',
        );
      }

      return;

    case 'self':
      throw new Error(
        'Self-damage and recoil observations are not implemented yet.',
      );

    default:
      return;
  }
}

function assertWholeNumber(
  value: number,
  label: string,
): void {
  if (
    !Number.isFinite(value) ||
    !Number.isInteger(value)
  ) {
    throw new Error(
      `${label} must be a whole number.`,
    );
  }
}

function validateHpObservation(
  battle: BattleState,
  target:
    BattleActorReference,
  hpBefore: number,
  hpAfter: number,
): {
  hpUnit: DamageHpUnit;
  targetMaxHp: number | null;
} {
  assertWholeNumber(
    hpBefore,
    'HP before',
  );

  assertWholeNumber(
    hpAfter,
    'HP after',
  );

  if (
    target.side === 'player'
  ) {
    const pokemon =
      battle.playerPokemon[
        target.pokemonIndex
      ];

    if (
      hpBefore < 0 ||
      hpBefore > pokemon.maxHp ||
      hpAfter < 0 ||
      hpAfter > pokemon.maxHp
    ) {
      throw new Error(
        `Exact HP must be between 0 and ${pokemon.maxHp}.`,
      );
    }

    if (hpAfter >= hpBefore) {
      throw new Error(
        'Exact HP after the hit must be lower than HP before the hit.',
      );
    }

    return {
      hpUnit: 'exact',
      targetMaxHp:
        pokemon.maxHp,
    };
  }

  if (
    hpBefore < 0 ||
    hpBefore > 100 ||
    hpAfter < 0 ||
    hpAfter > 100
  ) {
    throw new Error(
      'Opponent HP percentages must be between 0 and 100.',
    );
  }

  /*
   * Equal displayed percentages are
   * allowed. A small amount of damage can
   * sometimes leave the rounded displayed
   * percentage unchanged.
   */
  if (hpAfter > hpBefore) {
    throw new Error(
      'Displayed HP percentage after the hit cannot be higher than before.',
    );
  }

  return {
    hpUnit: 'percent',
    targetMaxHp: null,
  };
}

function describeCriticalHit(
  criticalHit:
    CriticalHitObservation,
): string {
  switch (criticalHit) {
    case 'yes':
      return 'critical hit';

    case 'unsure':
      return 'critical hit unsure';

    default:
      return 'normal hit';
  }
}

export function recordDamageObservation(
  battle: BattleState,

  input:
    RecordDamageObservationInput,
): BattleState {
  assertReferenceIsActive(
    battle,
    input.attacker,
    'attacker',
  );

  assertReferenceIsActive(
    battle,
    input.target,
    'target',
  );

  if (
    referencesAreEqual(
      input.attacker,
      input.target,
    )
  ) {
    throw new Error(
      'The attacker cannot also be the selected damage target.',
    );
  }

  assertMoveLegalForAttacker(
    battle,
    input.attacker,
    input.moveName,
  );

  const targeting =
    resolveMoveTargeting(
      battle,
      input.attacker,
      input.moveName,
    );

  if (targeting.isStatusMove) {
    throw new Error(
      `${targeting.move.name} is a status move. ` +
        'Record it as a battle action instead of a damage observation.',
    );
  }

  if (
    targeting.damageMode !==
      'single' &&
    targeting.damageMode !==
      'spread'
  ) {
    throw new Error(
      targeting.summary,
    );
  }

  assertTargetCompatible(
    input.attacker,
    input.target,
    targeting.move.target,
  );

  const {
    hpUnit,
    targetMaxHp,
  } =
    validateHpObservation(
      battle,
      input.target,
      input.hpBefore,
      input.hpAfter,
    );

  const attackerState =
    getRuntimePokemonState(
      battle,
      input.attacker,
    );

  const targetState =
    getRuntimePokemonState(
      battle,
      input.target,
    );

  const attackerName =
    getPokemonName(
      battle,
      input.attacker,
    );

  const targetName =
    getPokemonName(
      battle,
      input.target,
    );

  /*
   * Moves that are always critical do not
   * need uncertain user input.
   */
  const criticalHit:
  CriticalHitObservation =
    targeting.move.alwaysCritical
      ? 'yes'
      : input.criticalHit;

  const previousObservations =
    battle.damageObservations ??
    [];

  const observation:
  DamageObservation = {
    id:
      `damage-${battle.turnNumber}-` +
      `${previousObservations.length + 1}`,

    turnNumber:
      battle.turnNumber,

    attacker: {
      ...input.attacker,
    },

    attackerName,

    target: {
      ...input.target,
    },

    targetName,

    moveName:
      targeting.move.name,

    moveCategory:
      targeting.move.category,

    moveTarget:
      targeting.move.target,

    criticalHit,

    hpUnit,

    hpBefore:
      input.hpBefore,

    hpAfter:
      input.hpAfter,

    observedDamage:
      input.hpBefore -
      input.hpAfter,

    targetMaxHp,

    targeting: {
      damageMode:
        targeting.damageMode,

      targetCount:
        targeting.targetCount,

      spreadDamageApplied:
        targeting
          .spreadDamageApplies,

      source: 'automatic',

      summary:
        targeting.summary,
    },

    context: {
      field: {
        ...battle.field,
      },

      playerActive: [
        ...battle.playerActive,
      ] as ActiveSlots,

      opponentActive: [
        ...battle.opponentActive,
      ] as ActiveSlots,

      attackerStatus:
        attackerState.status,

      targetStatus:
        targetState.status,

      attackerStatStages: {
        ...attackerState
          .statStages,
      },

      targetStatStages: {
        ...targetState
          .statStages,
      },

      attackerKnownItem:
        getKnownItem(
          battle,
          input.attacker,
        ),

      attackerKnownAbility:
        getKnownAbility(
          battle,
          input.attacker,
        ),

      targetKnownItem:
        getKnownItem(
          battle,
          input.target,
        ),

      targetKnownAbility:
        getKnownAbility(
          battle,
          input.target,
        ),
    },
  };

  let nextBattle = battle;

  /*
   * Recording an opposing attack also
   * reveals that move.
   */
  if (
    input.attacker.side ===
    'opponent'
  ) {
    nextBattle =
      revealOpponentMove(
        nextBattle,
        input.attacker
          .pokemonIndex,
        targeting.move.name,
      );
  }

  if (
    input.target.side ===
    'player'
  ) {
    nextBattle =
      setPlayerPokemonHp(
        nextBattle,
        input.target
          .pokemonIndex,
        input.hpAfter,
      );
  } else {
    nextBattle =
      setOpponentPokemonHp(
        nextBattle,
        input.target
          .pokemonIndex,
        input.hpAfter,
      );
  }

  const hpSuffix =
    hpUnit === 'exact'
      ? ' HP'
      : '%';

  const eventMessage = [
    `Turn ${battle.turnNumber}:`,
    `${attackerName} used`,
    `${targeting.move.name} on`,
    `${targetName}:`,
    `${input.hpBefore}${hpSuffix}`,
    '→',
    `${input.hpAfter}${hpSuffix}`,
    `(${describeCriticalHit(criticalHit)};`,
    `${targeting.damageMode}).`,
  ].join(' ');

  return {
    ...nextBattle,

    damageObservations: [
      ...previousObservations,
      observation,
    ],

    eventHistory: [
      ...nextBattle.eventHistory,
      eventMessage,
    ],
  };
}