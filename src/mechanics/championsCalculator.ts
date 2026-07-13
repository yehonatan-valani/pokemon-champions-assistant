import {
  calculate,
  Field,
  Generations,
  Move,
  Pokemon,
  toID,
} from '@smogon/calc';

import type { ChampionsPokemonBuild } from '../domain/pokemonBuild';
import type { StatKey } from '../domain/statPoints';

const GENERATION_9_DATA = Generations.get(9);

const CHAMPIONS_GENERATION = {
  ...GENERATION_9_DATA,
  num: 0 as const,
};

export type CalculatedStats = Record<StatKey, number>;

export interface ChampionsDamageResult {
  minDamage: number;
  maxDamage: number;
  description: string;
  attackerStats: CalculatedStats;
  defenderStats: CalculatedStats;
}

function copyCalculatedStats(
  pokemon: Pokemon,
): CalculatedStats {
  return {
    hp: pokemon.stats.hp,
    atk: pokemon.stats.atk,
    def: pokemon.stats.def,
    spa: pokemon.stats.spa,
    spd: pokemon.stats.spd,
    spe: pokemon.stats.spe,
  };
}

export function createChampionsPokemon(
  build: ChampionsPokemonBuild,
): Pokemon {
  const speciesName = build.species.trim();

  if (!speciesName) {
    throw new Error('A Pokémon species is required.');
  }

  const speciesData =
    CHAMPIONS_GENERATION.species.get(toID(speciesName));

  if (!speciesData) {
    throw new Error(
      `"${speciesName}" is not available in the current ` +
        'Pokémon Champions calculator data.',
    );
  }

  return new Pokemon(
    CHAMPIONS_GENERATION,
    speciesName,
    {
      nature: build.nature.trim(),
      ability: build.ability.trim() || undefined,
      item: build.item.trim() || undefined,

      /*
       * @smogon/calc keeps the historical property name "evs".
       * In Champions generation 0, these values represent SPs.
       */
      evs: {
        hp: build.statPoints.hp,
        atk: build.statPoints.atk,
        def: build.statPoints.def,
        spa: build.statPoints.spa,
        spd: build.statPoints.spd,
        spe: build.statPoints.spe,
      },

      moves: [...build.moves],
    },
  );
}

export function getChampionsStats(
  build: ChampionsPokemonBuild,
): CalculatedStats {
  const pokemon = createChampionsPokemon(build);

  return copyCalculatedStats(pokemon);
}

export function calculateChampionsDamage(
  attackerBuild: ChampionsPokemonBuild,
  defenderBuild: ChampionsPokemonBuild,
  moveName: string,
): ChampionsDamageResult {
  const cleanedMoveName = moveName.trim();

  if (!cleanedMoveName) {
    throw new Error('A move name is required.');
  }

  const moveData =
    CHAMPIONS_GENERATION.moves.get(toID(cleanedMoveName));

  if (!moveData) {
    throw new Error(
      `"${cleanedMoveName}" is not available in the current ` +
        'Pokémon Champions calculator data.',
    );
  }

  const attacker = createChampionsPokemon(attackerBuild);
  const defender = createChampionsPokemon(defenderBuild);

  const move = new Move(
    CHAMPIONS_GENERATION,
    cleanedMoveName,
  );

  const field = new Field({
    gameType: 'Doubles',
  });

  const result = calculate(
    CHAMPIONS_GENERATION,
    attacker,
    defender,
    move,
    field,
  );

  const [minDamage, maxDamage] = result.range();

  return {
    minDamage,
    maxDamage,
    description: result.desc(),
    attackerStats: copyCalculatedStats(attacker),
    defenderStats: copyCalculatedStats(defender),
  };
}