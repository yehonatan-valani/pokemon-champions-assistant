import {
  describe,
  expect,
  it,
} from 'vitest';

import type { ChampionsPokemonBuild } from '../domain/pokemonBuild';
import {
  DEFAULT_SPEED_CONDITIONS,
  type SpeedConditions,
} from '../domain/speed';

import {
  calculateEffectiveSpeed,
  compareSpeed,
} from './compareSpeed';

const fastPikachu: ChampionsPokemonBuild = {
  species: 'Pikachu',
  nature: 'Timid',
  ability: 'Static',
  item: '',
  moves: [
    'Thunderbolt',
    'Protect',
    'Fake Out',
    'Electroweb',
  ],
  statPoints: {
    hp: 0,
    atk: 0,
    def: 1,
    spa: 32,
    spd: 0,
    spe: 32,
  },
};

const slowPikachu: ChampionsPokemonBuild = {
  species: 'Pikachu',
  nature: 'Bold',
  ability: 'Static',
  item: '',
  moves: [
    'Thunderbolt',
    'Protect',
    'Fake Out',
    'Electroweb',
  ],
  statPoints: {
    hp: 32,
    atk: 0,
    def: 32,
    spa: 0,
    spd: 1,
    spe: 0,
  },
};

function createConditions(
  changes: Partial<SpeedConditions> = {},
): SpeedConditions {
  return {
    ...DEFAULT_SPEED_CONDITIONS,
    ...changes,
  };
}

describe(
  'Pokémon Champions Speed comparison',
  () => {
    it(
      'makes the faster Pokémon move first',
      () => {
        const result = compareSpeed(
          fastPikachu,
          createConditions(),
          slowPikachu,
          createConditions(),
          false,
        );

        expect(result.order).toBe('first');
      },
    );

    it('detects a Speed tie', () => {
      const result = compareSpeed(
        fastPikachu,
        createConditions(),
        fastPikachu,
        createConditions(),
        false,
      );

      expect(result.order).toBe('tie');
    });

    it('applies Tailwind', () => {
      const normalSpeed =
        calculateEffectiveSpeed(
          slowPikachu,
          createConditions(),
        );

      const tailwindSpeed =
        calculateEffectiveSpeed(
          slowPikachu,
          createConditions({
            tailwind: true,
          }),
        );

      expect(tailwindSpeed).toBe(
        normalSpeed * 2,
      );
    });

    it(
      'automatically applies Choice Scarf',
      () => {
        const scarfUser: ChampionsPokemonBuild = {
          ...slowPikachu,
          item: 'Choice Scarf',
        };

        const normalSpeed =
          calculateEffectiveSpeed(
            slowPikachu,
            createConditions(),
          );

        const scarfSpeed =
          calculateEffectiveSpeed(
            scarfUser,
            createConditions(),
          );

        expect(scarfSpeed).toBe(
          Math.floor(normalSpeed * 1.5),
        );
      },
    );

    it(
      'reduces Speed when paralyzed',
      () => {
        const normalSpeed =
          calculateEffectiveSpeed(
            fastPikachu,
            createConditions(),
          );

        const paralyzedSpeed =
          calculateEffectiveSpeed(
            fastPikachu,
            createConditions({
              paralyzed: true,
            }),
          );

        expect(paralyzedSpeed).toBe(
          Math.floor(normalSpeed * 0.5),
        );
      },
    );

    it('applies a positive Speed stage', () => {
      const normalSpeed =
        calculateEffectiveSpeed(
          slowPikachu,
          createConditions(),
        );

      const boostedSpeed =
        calculateEffectiveSpeed(
          slowPikachu,
          createConditions({
            speedStage: 1,
          }),
        );

      expect(boostedSpeed).toBeGreaterThan(
        normalSpeed,
      );
    });

    it(
      'reverses Speed order during Trick Room',
      () => {
        const result = compareSpeed(
          fastPikachu,
          createConditions(),
          slowPikachu,
          createConditions(),
          true,
        );

        expect(result.order).toBe('second');
      },
    );

    it(
      'uses move priority before Speed',
      () => {
        const result = compareSpeed(
          slowPikachu,
          createConditions({
            movePriority: 1,
          }),
          fastPikachu,
          createConditions({
            movePriority: 0,
          }),
          false,
        );

        expect(result.order).toBe('first');
      },
    );
  },
);