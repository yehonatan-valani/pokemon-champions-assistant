import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  createInitialBattleState,
  setOpponentActiveSlot,
  setPlayerActiveSlot,
} from './battleState';

import {
  createEmptyOpponentTeamPreview,
} from './opponentTeam';

import {
  createEmptyTeam,
} from './team';

function createTestBattle() {
  const team = createEmptyTeam();

  team.name = 'Test Team';
  team.members[0].species = 'Pikachu';
  team.members[1].species = 'Charizard';

  const opponent =
    createEmptyOpponentTeamPreview();

  opponent.name = 'Test Opponent';
  opponent.species[0] = 'Bulbasaur';
  opponent.species[1] = 'Squirtle';

  return {
    team,
    opponent,
    battle: createInitialBattleState(
      team,
      opponent,
    ),
  };
}

describe('battle state', () => {
  it(
    'creates a battle from team preview data',
    () => {
      const { battle } = createTestBattle();

      expect(battle.turnNumber).toBe(1);

      expect(battle.playerTeamName).toBe(
        'Test Team',
      );

      expect(battle.opponentName).toBe(
        'Test Opponent',
      );

      expect(
        battle.playerPokemon[0].build.species,
      ).toBe('Pikachu');

      expect(
        battle.opponentPokemon[0].species,
      ).toBe('Bulbasaur');

      expect(
        battle.opponentPokemon[0]
          .revealedMoves,
      ).toEqual([]);
    },
  );

  it(
    'copies the player builds into the battle',
    () => {
      const {
        team,
        battle,
      } = createTestBattle();

      team.members[0].species = 'Raichu';

      expect(
        battle.playerPokemon[0].build.species,
      ).toBe('Pikachu');
    },
  );

  it('selects player active Pokémon', () => {
    let { battle } = createTestBattle();

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

    expect(battle.playerActive).toEqual([
      0,
      1,
    ]);
  });

  it('selects opponent active Pokémon', () => {
    let { battle } = createTestBattle();

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

    expect(battle.opponentActive).toEqual([
      0,
      1,
    ]);
  });

  it(
    'prevents one Pokémon occupying both positions',
    () => {
      let { battle } = createTestBattle();

      battle = setPlayerActiveSlot(
        battle,
        0,
        0,
      );

      expect(() =>
        setPlayerActiveSlot(
          battle,
          1,
          0,
        ),
      ).toThrow(
        'The same Pokémon cannot occupy both active positions.',
      );
    },
  );
});