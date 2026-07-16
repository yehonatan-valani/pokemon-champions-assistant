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
  ChampionsPokemonBuild,
} from './pokemonBuild';

import {
  createInitialBattleState,
  megaEvolveOpponentPokemon,
  megaEvolvePlayerPokemon,
  setPlayerPokemonFainted,
} from './battleState';

import {
  getChampionsMegaCapabilitiesForSpecies,
} from '../mechanics/resolveChampionsCalculationBuild';

const METAGROSS:
ChampionsPokemonBuild = {
  species:
    'Metagross',

  nature:
    'Impish',

  ability:
    'Clear Body',

  item:
    'Metagrossite',

  moves: [
    'Psychic Fangs',
    'Body Press',
    'Cosmic Power',
    'Protect',
  ],

  statPoints: {
    hp: 32,

    atk: 0,

    def: 1,

    spa: 0,

    spd: 1,

    spe: 32,
  },
};

function createMegaTestBattle() {
  const team =
    createTestTeam();

  team.members[0] = {
    ...METAGROSS,

    moves: [
      ...METAGROSS.moves,
    ],
  };

  team.members[1] = {
    ...METAGROSS,

    moves: [
      ...METAGROSS.moves,
    ],
  };

  const opponentPreview =
    createTestOpponentPreview();

  opponentPreview.species[0] =
    'Metagross';

  opponentPreview.species[1] =
    'Metagross';

  return createInitialBattleState(
    team,
    opponentPreview,
  );
}

function getMetagrossCapability() {
  const capability =
    getChampionsMegaCapabilitiesForSpecies(
      'Metagross',
    ).find(
      (option) =>
        option.stone ===
        'Metagrossite',
    );

  if (!capability) {
    throw new Error(
      'Metagrossite capability was not found.',
    );
  }

  return capability;
}

describe(
  'live battle Mega Evolution',
  () => {
    it(
      'starts every Pokémon in base form',
      () => {
        const battle =
          createMegaTestBattle();

        expect(
          battle.playerMegaUsed,
        ).toBe(false);

        expect(
          battle.opponentMegaUsed,
        ).toBe(false);

        expect(
          battle.playerPokemon[0]
            .megaState,
        ).toBe('base');

        expect(
          battle.opponentPokemon[0]
            .megaState,
        ).toBe('base');

        expect(
          battle.playerPokemon[0]
            .megaEvolvedTurn,
        ).toBeNull();
      },
    );

    it(
      'permanently Mega Evolves a player Pokémon',
      () => {
        const originalBattle =
          createMegaTestBattle();

        const battle =
          megaEvolvePlayerPokemon(
            originalBattle,
            0,
          );

        const pokemon =
          battle.playerPokemon[0];

        expect(
          battle.playerMegaUsed,
        ).toBe(true);

        expect(
          pokemon.megaState,
        ).toBe('mega');

        expect(
          pokemon.megaSpecies,
        ).toBe(
          'Metagross-Mega',
        );

        expect(
          pokemon.megaAbility,
        ).toBe(
          'Tough Claws',
        );

        expect(
          pokemon.megaStone,
        ).toBe(
          'Metagrossite',
        );

        expect(
          pokemon.megaEvolvedTurn,
        ).toBe(1);

        expect(
          pokemon.build.species,
        ).toBe('Metagross');

        expect(
          pokemon.build.ability,
        ).toBe('Clear Body');
      },
    );

    it(
      'does not cancel Mega Evolution after fainting',
      () => {
        let battle =
          createMegaTestBattle();

        battle =
          megaEvolvePlayerPokemon(
            battle,
            0,
          );

        battle =
          setPlayerPokemonFainted(
            battle,
            0,
            true,
          );

        expect(
          battle.playerPokemon[0]
            .megaState,
        ).toBe('mega');

        battle =
          setPlayerPokemonFainted(
            battle,
            0,
            false,
          );

        expect(
          battle.playerPokemon[0]
            .megaState,
        ).toBe('mega');

        expect(
          battle.playerPokemon[0]
            .megaSpecies,
        ).toBe(
          'Metagross-Mega',
        );
      },
    );

    it(
      'rejects a second player Mega Evolution',
      () => {
        let battle =
          createMegaTestBattle();

        battle =
          megaEvolvePlayerPokemon(
            battle,
            0,
          );

        expect(() =>
          megaEvolvePlayerPokemon(
            battle,
            1,
          ),
        ).toThrow(
          /already used Mega Evolution/i,
        );
      },
    );

    it(
      'rejects trying to Mega Evolve the same Pokémon again',
      () => {
        let battle =
          createMegaTestBattle();

        battle =
          megaEvolvePlayerPokemon(
            battle,
            0,
          );

        expect(() =>
          megaEvolvePlayerPokemon(
            battle,
            0,
          ),
        ).toThrow(
          /already Mega Evolved/i,
        );
      },
    );

    it(
      'rejects a player without a compatible stone',
      () => {
        const team =
          createTestTeam();

        team.members[0] = {
          ...METAGROSS,

          item:
            'Leftovers',
        };

        const battle =
          createInitialBattleState(
            team,
            createTestOpponentPreview(),
          );

        expect(() =>
          megaEvolvePlayerPokemon(
            battle,
            0,
          ),
        ).toThrow(
          /cannot Mega Evolve/i,
        );
      },
    );

    it(
      'records an opponent Mega form and its stone',
      () => {
        const capability =
          getMetagrossCapability();

        const battle =
          megaEvolveOpponentPokemon(
            createMegaTestBattle(),
            0,
            capability,
          );

        const pokemon =
          battle.opponentPokemon[0];

        expect(
          battle.opponentMegaUsed,
        ).toBe(true);

        expect(
          pokemon.megaState,
        ).toBe('mega');

        expect(
          pokemon.megaSpecies,
        ).toBe(
          'Metagross-Mega',
        );

        expect(
          pokemon.megaAbility,
        ).toBe(
          'Tough Claws',
        );

        expect(
          pokemon.revealedItem,
        ).toBe(
          'Metagrossite',
        );
        expect(
        pokemon.revealedAbility,
        ).toBe(
        'Tough Claws',
        );
      },
    );

    it(
      'rejects a second opponent Mega Evolution',
      () => {
        const capability =
          getMetagrossCapability();

        const battle =
          megaEvolveOpponentPokemon(
            createMegaTestBattle(),
            0,
            capability,
          );

        expect(() =>
          megaEvolveOpponentPokemon(
            battle,
            1,
            capability,
          ),
        ).toThrow(
          /already used Mega Evolution/i,
        );
      },
    );

    it(
      'rejects an invalid opponent Mega form',
      () => {
        const capability =
          getMetagrossCapability();

        expect(() =>
          megaEvolveOpponentPokemon(
            createMegaTestBattle(),
            0,
            {
              ...capability,

              megaSpecies:
                'Dragonite-Mega',
            },
          ),
        ).toThrow(
          /not a valid Mega form/i,
        );
      },
    );
  },
);