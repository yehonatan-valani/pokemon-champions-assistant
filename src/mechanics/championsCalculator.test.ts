import { describe, expect, it } from 'vitest';

import type { ChampionsPokemonBuild } from '../domain/pokemonBuild';
import {
  calculateChampionsDamage,
  getChampionsStats,
} from './championsCalculator';

const pikachu: ChampionsPokemonBuild = {
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

const defenderPikachu: ChampionsPokemonBuild = {
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

describe('Pokémon Champions calculator adapter', () => {
  it('uses the Champions Stat Point formula', () => {
    const stats = getChampionsStats(pikachu);

    /*
     * Champions HP:
     * base HP 35 + 0 SP + 75 = 110
     */
    expect(stats.hp).toBe(110);

    /*
     * Champions Speed:
     * floor((base 90 + 32 SP + 20) × 1.1)
     * = floor(156.2)
     * = 156
     */
    expect(stats.spe).toBe(156);
  });

  it('calculates a valid damage range', () => {
    const result = calculateChampionsDamage(
  pikachu,
  defenderPikachu,
  'Thunderbolt',
);

    expect(result.minDamage).toBeGreaterThan(0);
    expect(result.maxDamage).toBeGreaterThanOrEqual(
      result.minDamage,
    );
    expect(result.description.length).toBeGreaterThan(0);
  });
});