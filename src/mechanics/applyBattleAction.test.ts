import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  createTestOpponentPreview,
  createTestTeam,
} from '../data/testData';

import type {
  MoveUsedBattleAction,
} from '../domain/battleAction';

import {
  createInitialBattleState,
  setOpponentActiveSlot,
  setPlayerActiveSlot,
} from '../domain/battleState';

import {
  recordAbilityActivated,
  recordMoveUsed,
} from './applyBattleAction';

function createActiveTestBattle() {
  let battle = createInitialBattleState(
    createTestTeam(),
    createTestOpponentPreview(),
  );

  battle = setPlayerActiveSlot(
    battle,
    0,
    0,
  );

  battle = setPlayerActiveSlot(
    battle,
    1,
    1,
  );

  battle = setOpponentActiveSlot(
    battle,
    0,
    0,
  );

  battle = setOpponentActiveSlot(
    battle,
    1,
    1,
  );

  return battle;
}

describe('structured battle actions', () => {
  it(
    'records moves in their observed order',
    () => {
      let battle =
        createActiveTestBattle();

      battle = recordMoveUsed(
        battle,
        {
          side: 'opponent',
          pokemonIndex: 0,
        },
        'Fake Out',
      );

      battle = recordMoveUsed(
        battle,
        {
          side: 'player',
          pokemonIndex: 0,
        },
        'Thunderbolt',
      );

      const moveActions =
        battle.actionHistory.filter(
          (
            action,
          ): action is MoveUsedBattleAction =>
            action.type === 'move-used',
        );

      expect(moveActions).toHaveLength(2);

      expect(
        moveActions[0].moveOrder,
      ).toBe(1);

      expect(
        moveActions[0].moveName,
      ).toBe('Fake Out');

      expect(
        moveActions[1].moveOrder,
      ).toBe(2);

      expect(
        moveActions[1].moveName,
      ).toBe('Thunderbolt');

      expect(
        moveActions[0]
          .orderContext.basePriority,
      ).toBeGreaterThan(
        moveActions[1]
          .orderContext.basePriority,
      );
    },
  );

  it(
    'reveals an opponent move automatically',
    () => {
      let battle =
        createActiveTestBattle();

      battle = recordMoveUsed(
        battle,
        {
          side: 'opponent',
          pokemonIndex: 0,
        },
        'Fake Out',
      );

      expect(
        battle.opponentPokemon[0]
          .revealedMoves,
      ).toContain('Fake Out');
    },
  );

  it(
    'starts Tailwind from a recorded move',
    () => {
      let battle =
        createActiveTestBattle();

      battle = recordMoveUsed(
        battle,
        {
          side: 'player',
          pokemonIndex: 1,
        },
        'Tailwind',
      );

      expect(
        battle.field.playerTailwindTurns,
      ).toBe(4);
    },
  );

  it(
    'starts weather from an activated ability',
    () => {
      const opponent =
        createTestOpponentPreview();

      opponent.species[0] = 'Pelipper';

      let battle =
        createInitialBattleState(
          createTestTeam(),
          opponent,
        );

      battle = setOpponentActiveSlot(
        battle,
        0,
        0,
      );

      battle = recordAbilityActivated(
        battle,
        {
          side: 'opponent',
          pokemonIndex: 0,
        },
        'Drizzle',
      );

      expect(
        battle.field.weather,
      ).toBe('Rain');

      expect(
        battle.opponentPokemon[0]
          .revealedAbility,
      ).toBe('Drizzle');
    },
  );
});