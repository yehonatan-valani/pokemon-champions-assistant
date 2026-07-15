import type {
  OpponentSetCandidate,
} from '../domain/opponentCandidate';

/**
 * Temporary development candidates.
 *
 * These are used to build and test the
 * filtering system. They are not claimed
 * to represent current metagame usage.
 */
export const DEVELOPMENT_OPPONENT_CANDIDATES:
OpponentSetCandidate[] = [
  {
    id: 'rillaboom-bulky-assault-vest',
    label: 'Bulky Assault Vest',
    sourceLabel: 'Development fixture',

    build: {
      species: 'Rillaboom',
      nature: 'Adamant',
      ability: 'Grassy Surge',
      item: 'Assault Vest',

      moves: [
        'Fake Out',
        'Grassy Glide',
        'Wood Hammer',
        'U-turn',
      ],

      statPoints: {
        hp: 32,
        atk: 32,
        def: 0,
        spa: 0,
        spd: 2,
        spe: 0,
      },
    },
  },

  {
    id: 'rillaboom-fast-miracle-seed',
    label: 'Fast Miracle Seed',
    sourceLabel: 'Development fixture',

    build: {
      species: 'Rillaboom',
      nature: 'Jolly',
      ability: 'Grassy Surge',
      item: 'Miracle Seed',

      moves: [
        'Fake Out',
        'Grassy Glide',
        'Wood Hammer',
        'High Horsepower',
      ],

      statPoints: {
        hp: 2,
        atk: 32,
        def: 0,
        spa: 0,
        spd: 0,
        spe: 32,
      },
    },
  },

  {
    id: 'gholdengo-choice-specs',
    label: 'Fast Choice Specs',
    sourceLabel: 'Development fixture',

    build: {
      species: 'Gholdengo',
      nature: 'Timid',
      ability: 'Good as Gold',
      item: 'Choice Specs',

      moves: [
        'Make It Rain',
        'Shadow Ball',
        'Thunderbolt',
        'Trick',
      ],

      statPoints: {
        hp: 2,
        atk: 0,
        def: 0,
        spa: 32,
        spd: 0,
        spe: 32,
      },
    },
  },

  {
    id: 'gholdengo-bulky-leftovers',
    label: 'Bulky Leftovers',
    sourceLabel: 'Development fixture',

    build: {
      species: 'Gholdengo',
      nature: 'Modest',
      ability: 'Good as Gold',
      item: 'Leftovers',

      moves: [
        'Make It Rain',
        'Shadow Ball',
        'Nasty Plot',
        'Protect',
      ],

      statPoints: {
        hp: 32,
        atk: 0,
        def: 0,
        spa: 32,
        spd: 0,
        spe: 2,
      },
    },
  },

  {
    id: 'pelipper-fast-focus-sash',
    label: 'Fast Focus Sash',
    sourceLabel: 'Development fixture',

    build: {
      species: 'Pelipper',
      nature: 'Timid',
      ability: 'Drizzle',
      item: 'Focus Sash',

      moves: [
        'Tailwind',
        'Hurricane',
        'Weather Ball',
        'Protect',
      ],

      statPoints: {
        hp: 2,
        atk: 0,
        def: 0,
        spa: 32,
        spd: 0,
        spe: 32,
      },
    },
  },

  {
    id: 'pelipper-bulky-support',
    label: 'Bulky Support',
    sourceLabel: 'Development fixture',

    build: {
      species: 'Pelipper',
      nature: 'Bold',
      ability: 'Drizzle',
      item: 'Covert Cloak',

      moves: [
        'Tailwind',
        'Hurricane',
        'Wide Guard',
        'Protect',
      ],

      statPoints: {
        hp: 32,
        atk: 0,
        def: 32,
        spa: 2,
        spd: 0,
        spe: 0,
      },
    },
  },

  {
    id: 'incineroar-safety-goggles',
    label: 'Specially Bulky Goggles',
    sourceLabel: 'Development fixture',

    build: {
      species: 'Incineroar',
      nature: 'Careful',
      ability: 'Intimidate',
      item: 'Safety Goggles',

      moves: [
        'Fake Out',
        'Parting Shot',
        'Flare Blitz',
        'Knock Off',
      ],

      statPoints: {
        hp: 32,
        atk: 2,
        def: 0,
        spa: 0,
        spd: 32,
        spe: 0,
      },
    },
  },

  {
    id: 'incineroar-sitrus-berry',
    label: 'Physical Sitrus Berry',
    sourceLabel: 'Development fixture',

    build: {
      species: 'Incineroar',
      nature: 'Impish',
      ability: 'Intimidate',
      item: 'Sitrus Berry',

      moves: [
        'Fake Out',
        'Parting Shot',
        'Flare Blitz',
        'Taunt',
      ],

      statPoints: {
        hp: 32,
        atk: 0,
        def: 32,
        spa: 0,
        spd: 2,
        spe: 0,
      },
    },
  },
];