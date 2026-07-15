import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  getMoveMetadata,
} from '../data/championsData';

import {
  CURRENT_REGULATION,
  getLegalMovesForSpecies,
} from '../data/currentRegulation';

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

function getLegalPriorityMove(
  species: string,
  priority: number,
): string {
  const legalMoves =
    getLegalMovesForSpecies(species);

  const preferredMove =
    legalMoves.find(
      (moveName) =>
        moveName === 'Protect' &&
        getMoveMetadata(moveName)
          .priority === priority,
    );

  const matchingMove =
    preferredMove ??
    legalMoves.find(
      (moveName) =>
        getMoveMetadata(moveName)
          .priority === priority,
    );

  if (!matchingMove) {
    throw new Error(
      `No priority ${priority} move was found for ${species}.`,
    );
  }

  return matchingMove;
}

function getSpeciesWithMove(
  moveName: string,
): string {
  const entry =
    CURRENT_REGULATION.species.find(
      (speciesEntry) =>
        speciesEntry.moves.includes(
          moveName,
        ),
    );

  if (!entry) {
    throw new Error(
      `No regulation-legal species was found with ${moveName}.`,
    );
  }

  return entry.species;
}

function createActiveTestBattle() {
  const opponent =
    createTestOpponentPreview();

  opponent.species[0] = 'Pikachu';

  let battle = createInitialBattleState(
    createTestTeam(),
    opponent,
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

describe(
  'structured battle actions',
  () => {
    it(
      'records moves in their observed order',
      () => {
        let battle =
          createActiveTestBattle();

        const opponentMove =
          getLegalPriorityMove(
            'Pikachu',
            0,
          );

        battle = recordMoveUsed(
          battle,
          {
            side: 'player',
            pokemonIndex: 0,
          },
          'Fake Out',
        );

        battle = recordMoveUsed(
          battle,
          {
            side: 'opponent',
            pokemonIndex: 0,
          },
          opponentMove,
        );

        const moveActions =
          battle.actionHistory.filter(
            (
              action,
            ): action is MoveUsedBattleAction =>
              action.type === 'move-used',
          );

        expect(
          moveActions,
        ).toHaveLength(2);

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
        ).toBe(opponentMove);

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

        const opponentMove =
          getLegalPriorityMove(
            'Pikachu',
            0,
          );

        battle = recordMoveUsed(
          battle,
          {
            side: 'opponent',
            pokemonIndex: 0,
          },
          opponentMove,
        );

        expect(
          battle.opponentPokemon[0]
            .revealedMoves,
        ).toContain(opponentMove);
      },
    );

    it(
      'starts Tailwind from a recorded move',
      () => {
        const tailwindSpecies =
          getSpeciesWithMove(
            'Tailwind',
          );

        const opponent =
          createTestOpponentPreview();

        opponent.species[0] =
          tailwindSpecies;

        let battle =
          createInitialBattleState(
            createTestTeam(),
            opponent,
          );

        battle =
          setOpponentActiveSlot(
            battle,
            0,
            0,
          );

        battle = recordMoveUsed(
          battle,
          {
            side: 'opponent',
            pokemonIndex: 0,
          },
          'Tailwind',
        );

        expect(
          battle.field
            .opponentTailwindTurns,
        ).toBe(4);
      },
    );

    it(
      'starts weather from an activated ability',
      () => {
        const opponent =
          createTestOpponentPreview();

        opponent.species[0] =
          'Pelipper';

        let battle =
          createInitialBattleState(
            createTestTeam(),
            opponent,
          );

        battle =
          setOpponentActiveSlot(
            battle,
            0,
            0,
          );

        battle =
          recordAbilityActivated(
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

    it(
      'rejects a move that the acting species cannot learn',
      () => {
        const battle =
          createActiveTestBattle();

        expect(() =>
          recordMoveUsed(
            battle,
            {
              side: 'player',
              pokemonIndex: 0,
            },
            'Hydro Pump',
          ),
        ).toThrow(
          'Hydro Pump is not legal for Pikachu',
        );
      },
    );

    it(
      'rejects an ability that the acting species cannot have',
      () => {
        const battle =
          createActiveTestBattle();

        expect(() =>
          recordAbilityActivated(
            battle,
            {
              side: 'player',
              pokemonIndex: 0,
            },
            'Levitate',
          ),
        ).toThrow(
          'Levitate is not legal for Pikachu',
        );
      },
    );
  },
);