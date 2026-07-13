import { describe, expect, it } from 'vitest';

import {
  createEmptyPokemonBuild,
  isPokemonBuildComplete,
} from './pokemonBuild';

describe('Pokémon Champions build', () => {
  it('creates an empty build', () => {
    const build = createEmptyPokemonBuild();

    expect(build.species).toBe('');
    expect(build.moves).toHaveLength(4);
    expect(build.statPoints.hp).toBe(0);
  });

  it('rejects an incomplete build', () => {
    const build = createEmptyPokemonBuild();

    expect(isPokemonBuildComplete(build)).toBe(false);
  });

  it('accepts a complete legal build', () => {
    const build = createEmptyPokemonBuild();

    build.species = 'Pikachu';
    build.nature = 'Timid';
    build.ability = 'Static';
    build.item = 'Focus Sash';
    build.moves = [
      'Thunderbolt',
      'Protect',
      'Fake Out',
      'Electroweb',
    ];

    build.statPoints = {
      hp: 0,
      atk: 0,
      def: 1,
      spa: 32,
      spd: 0,
      spe: 32,
    };

    expect(isPokemonBuildComplete(build)).toBe(true);
  });

  it('rejects an illegal Stat Point allocation', () => {
    const build = createEmptyPokemonBuild();

    build.species = 'Pikachu';
    build.nature = 'Timid';
    build.ability = 'Static';
    build.moves = [
      'Thunderbolt',
      'Protect',
      'Fake Out',
      'Electroweb',
    ];

    build.statPoints = {
      hp: 32,
      atk: 32,
      def: 2,
      spa: 0,
      spd: 0,
      spe: 0,
    };

    expect(isPokemonBuildComplete(build)).toBe(false);
  });
});