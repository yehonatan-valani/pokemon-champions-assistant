import type {
  ChampionsPokemonBuild,
} from '../domain/pokemonBuild';

import type {
  OpponentTeamPreview,
} from '../domain/opponentTeam';

import type {
  ChampionsTeam,
} from '../domain/team';

function createBuild(
  build: ChampionsPokemonBuild,
): ChampionsPokemonBuild {
  return {
    ...build,
    moves: [...build.moves],
    statPoints: {
      ...build.statPoints,
    },
  };
}

export function createTestTeam(): ChampionsTeam {
  return {
    name: 'Example Champions Team',

    members: [
      createBuild({
        species: 'Pikachu',
        nature: 'Timid',
        ability: 'Static',
        item: 'Focus Sash',
        moves: [
          'Thunderbolt',
          'Fake Out',
          'Electroweb',
          'Protect',
        ],
        statPoints: {
          hp: 0,
          atk: 0,
          def: 2,
          spa: 32,
          spd: 0,
          spe: 32,
        },
      }),

      createBuild({
        species: 'Charizard',
        nature: 'Timid',
        ability: 'Blaze',
        item: 'Safety Goggles',
        moves: [
          'Heat Wave',
          'Air Slash',
          'Tailwind',
          'Protect',
        ],
        statPoints: {
          hp: 0,
          atk: 0,
          def: 2,
          spa: 32,
          spd: 0,
          spe: 32,
        },
      }),

      createBuild({
        species: 'Garchomp',
        nature: 'Jolly',
        ability: 'Rough Skin',
        item: 'Clear Amulet',
        moves: [
          'Earthquake',
          'Dragon Claw',
          'Rock Slide',
          'Protect',
        ],
        statPoints: {
          hp: 0,
          atk: 32,
          def: 2,
          spa: 0,
          spd: 0,
          spe: 32,
        },
      }),

      createBuild({
        species: 'Amoonguss',
        nature: 'Bold',
        ability: 'Regenerator',
        item: 'Rocky Helmet',
        moves: [
          'Spore',
          'Rage Powder',
          'Pollen Puff',
          'Protect',
        ],
        statPoints: {
          hp: 32,
          atk: 0,
          def: 32,
          spa: 0,
          spd: 2,
          spe: 0,
        },
      }),

      createBuild({
        species: 'Incineroar',
        nature: 'Careful',
        ability: 'Intimidate',
        item: 'Sitrus Berry',
        moves: [
          'Fake Out',
          'Flare Blitz',
          'Knock Off',
          'Parting Shot',
        ],
        statPoints: {
          hp: 32,
          atk: 2,
          def: 16,
          spa: 0,
          spd: 16,
          spe: 0,
        },
      }),

      createBuild({
        species: 'Flutter Mane',
        nature: 'Timid',
        ability: 'Protosynthesis',
        item: 'Booster Energy',
        moves: [
          'Moonblast',
          'Shadow Ball',
          'Dazzling Gleam',
          'Protect',
        ],
        statPoints: {
          hp: 0,
          atk: 0,
          def: 2,
          spa: 32,
          spd: 0,
          spe: 32,
        },
      }),
    ],
  };
}

export function createTestOpponentPreview():
OpponentTeamPreview {
  return {
    name: 'Example Opponent',

    species: [
      'Rillaboom',
      'Gholdengo',
      'Dragonite',
      'Tyranitar',
      'Arcanine',
      'Corviknight',
    ],
  };
}