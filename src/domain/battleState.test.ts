import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  createInitialBattleState,
  setOpponentActiveSlot,
  setPlayerActiveSlot,
  removeOpponentRevealedMove,
  revealOpponentMove,
  setOpponentPokemonFainted,
  setOpponentPokemonHp,
  setOpponentPokemonStatStage,
  setOpponentPokemonStatus,
  setOpponentRevealedAbility,
  setOpponentRevealedItem,
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

  it('updates opponent HP and fainted state', () => {
  let { battle } = createTestBattle();

  battle = setOpponentPokemonHp(
    battle,
    0,
    42,
  );

  expect(
    battle.opponentPokemon[0]
      .currentHpPercent,
  ).toBe(42);

  expect(
    battle.opponentPokemon[0].fainted,
  ).toBe(false);

  battle = setOpponentPokemonHp(
    battle,
    0,
    0,
  );

  expect(
    battle.opponentPokemon[0].fainted,
  ).toBe(true);
});

it('updates status and stat stages', () => {
  let { battle } = createTestBattle();

  battle = setOpponentPokemonStatus(
    battle,
    0,
    'Burn',
  );

  battle = setOpponentPokemonStatStage(
    battle,
    0,
    'spe',
    -2,
  );

  expect(
    battle.opponentPokemon[0].status,
  ).toBe('Burn');

  expect(
    battle.opponentPokemon[0]
      .statStages.spe,
  ).toBe(-2);
});

it('clamps stat stages between -6 and 6', () => {
  let { battle } = createTestBattle();

  battle = setOpponentPokemonStatStage(
    battle,
    0,
    'atk',
    12,
  );

  expect(
    battle.opponentPokemon[0]
      .statStages.atk,
  ).toBe(6);
});

it('records revealed opponent information', () => {
  let { battle } = createTestBattle();

  battle = revealOpponentMove(
    battle,
    0,
    'Protect',
  );

  battle = revealOpponentMove(
    battle,
    0,
    'Protect',
  );

  battle = setOpponentRevealedItem(
    battle,
    0,
    'Focus Sash',
  );

  battle = setOpponentRevealedAbility(
    battle,
    0,
    'Overgrow',
  );

  expect(
    battle.opponentPokemon[0]
      .revealedMoves,
  ).toEqual(['Protect']);

  expect(
    battle.opponentPokemon[0]
      .revealedItem,
  ).toBe('Focus Sash');

  expect(
    battle.opponentPokemon[0]
      .revealedAbility,
  ).toBe('Overgrow');

  battle = removeOpponentRevealedMove(
    battle,
    0,
    'Protect',
  );

  expect(
    battle.opponentPokemon[0]
      .revealedMoves,
  ).toEqual([]);
});

it('removes a fainted Pokémon from active play', () => {
  let { battle } = createTestBattle();

  battle = setOpponentActiveSlot(
    battle,
    0,
    0,
  );

  battle = setOpponentPokemonFainted(
    battle,
    0,
    true,
  );

  expect(battle.opponentActive[0]).toBeNull();

  expect(
    battle.opponentPokemon[0].fainted,
  ).toBe(true);
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