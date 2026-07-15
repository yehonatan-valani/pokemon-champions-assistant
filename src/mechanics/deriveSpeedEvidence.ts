import type {
  BattleActionRecord,
  MoveUsedBattleAction,
} from '../domain/battleAction';

import type {
  SpeedEvidence,
} from '../domain/speedEvidence';

function isMoveAction(
  action: BattleActionRecord,
): action is MoveUsedBattleAction {
  return action.type === 'move-used';
}

function isSameActor(
  first: MoveUsedBattleAction,
  second: MoveUsedBattleAction,
): boolean {
  return (
    first.actor.side === second.actor.side &&
    first.actor.pokemonIndex ===
      second.actor.pokemonIndex
  );
}

function hasSameGlobalOrderState(
  first: MoveUsedBattleAction,
  second: MoveUsedBattleAction,
): boolean {
  const firstContext =
    first.orderContext;

  const secondContext =
    second.orderContext;

  return (
    firstContext.trickRoomActive ===
      secondContext.trickRoomActive &&
    firstContext.playerTailwindActive ===
      secondContext.playerTailwindActive &&
    firstContext.opponentTailwindActive ===
      secondContext.opponentTailwindActive &&
    firstContext.weather ===
      secondContext.weather &&
    firstContext.terrain ===
      secondContext.terrain
  );
}

function addMoveToMap(
  map: Map<number, MoveUsedBattleAction[]>,
  key: number,
  action: MoveUsedBattleAction,
): void {
  const current = map.get(key) ?? [];

  current.push(action);
  map.set(key, current);
}

export function deriveSpeedEvidence(
  actionHistory: BattleActionRecord[],
): SpeedEvidence[] {
  const movesByTurn =
    new Map<
      number,
      MoveUsedBattleAction[]
    >();

  for (const action of actionHistory) {
    if (
      !isMoveAction(action) ||
      !action.speedInferenceAllowed
    ) {
      continue;
    }

    addMoveToMap(
      movesByTurn,
      action.turnNumber,
      action,
    );
  }

  const evidence: SpeedEvidence[] = [];

  const orderedTurns = [
    ...movesByTurn.entries(),
  ].sort(
    ([firstTurn], [secondTurn]) =>
      firstTurn - secondTurn,
  );

  for (const [
    turnNumber,
    turnMoves,
  ] of orderedTurns) {
    const movesByPriority =
      new Map<
        number,
        MoveUsedBattleAction[]
      >();

    for (const move of turnMoves) {
      addMoveToMap(
        movesByPriority,
        move.orderContext.basePriority,
        move,
      );
    }

    for (const [
      priority,
      priorityMoves,
    ] of movesByPriority) {
      const orderedMoves = [
        ...priorityMoves,
      ].sort(
        (first, second) =>
          first.moveOrder -
          second.moveOrder,
      );

      for (
        let index = 0;
        index < orderedMoves.length - 1;
        index += 1
      ) {
        const earlierMove =
          orderedMoves[index];

        const laterMove =
          orderedMoves[index + 1];

        if (
          isSameActor(
            earlierMove,
            laterMove,
          )
        ) {
          continue;
        }

        if (
          !hasSameGlobalOrderState(
            earlierMove,
            laterMove,
          )
        ) {
          continue;
        }

        const relation =
          earlierMove.orderContext
            .trickRoomActive
            ? 'less-than-or-equal'
            : 'greater-than-or-equal';

        evidence.push({
          id: [
            'speed',
            turnNumber,
            earlierMove.id,
            laterMove.id,
          ].join('-'),

          turnNumber,

          earlierActionId:
            earlierMove.id,

          laterActionId:
            laterMove.id,

          earlierMoveOrder:
            earlierMove.moveOrder,

          laterMoveOrder:
            laterMove.moveOrder,

          earlierActor:
            earlierMove.actor,

          laterActor:
            laterMove.actor,

          earlierPokemonName:
            earlierMove.pokemonName,

          laterPokemonName:
            laterMove.pokemonName,

          earlierMoveName:
            earlierMove.moveName,

          laterMoveName:
            laterMove.moveName,

          priority,
          relation,

          earlierContext:
            earlierMove.orderContext,

          laterContext:
            laterMove.orderContext,
        });
      }
    }
  }

  return evidence.sort(
    (first, second) =>
      first.turnNumber -
        second.turnNumber ||
      first.earlierMoveOrder -
        second.earlierMoveOrder,
  );
}