import {
  calculate,
  Field,
  Generations,
  Move,
  Pokemon,
  toID,
} from '@smogon/calc';

import type {
  ChampionsPokemonBuild,
} from '../domain/pokemonBuild';

import type {
  StatKey,
} from '../domain/statPoints';

import {
  DEFAULT_DAMAGE_FIELD_CONDITIONS,
  type DamageFieldConditions,
} from '../domain/fieldConditions';

const GENERATION_9_DATA =
  Generations.get(9);

const CHAMPIONS_GENERATION = {
  ...GENERATION_9_DATA,
  num: 0 as const,
};

export type CalculatedStats =
  Record<StatKey, number>;

export interface CreateChampionsPokemonOptions {
  currentHp?: number;
}

export interface ChampionsDamageOptions {
  /**
   * Exact current HP of the defender.
   *
   * When omitted, the defender is treated
   * as being at full HP.
   */
  defenderCurrentHp?: number;
}

export interface ChampionsDamageResult {
  minDamage: number;
  maxDamage: number;

  description: string;

  attackerStats: CalculatedStats;
  defenderStats: CalculatedStats;

  defenderCurrentHp: number;
  defenderMaxHp: number;

  /**
   * Chance from 0 to 1 that the damage
   * roll faints the defender, assuming
   * the move successfully hits.
   */
  oneHitKoChance: number;

  /**
   * The move's base accuracy percentage.
   * Accuracy stages and other accuracy
   * modifiers are not included yet.
   */
  baseAccuracyPercent: number;

  /**
   * One-hit faint chance multiplied by
   * the move's base accuracy.
   */
  accuracyAdjustedKoChance: number;
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

function normalizeCurrentHp(
  requestedCurrentHp: number,
  maximumHp: number,
): number {
  if (
    !Number.isFinite(
      requestedCurrentHp,
    )
  ) {
    throw new Error(
      'Defender current HP must be a number.',
    );
  }

  const roundedCurrentHp =
    Math.round(requestedCurrentHp);

  if (roundedCurrentHp < 1) {
    throw new Error(
      'Defender current HP must be at least 1.',
    );
  }

  return Math.min(
    roundedCurrentHp,
    maximumHp,
  );
}

export function createChampionsPokemon(
  build: ChampionsPokemonBuild,
  options:
    CreateChampionsPokemonOptions = {},
): Pokemon {
  const speciesName =
    build.species.trim();

  if (!speciesName) {
    throw new Error(
      'A Pokémon species is required.',
    );
  }

  const speciesData =
    CHAMPIONS_GENERATION.species.get(
      toID(speciesName),
    );

  if (!speciesData) {
    throw new Error(
      `"${speciesName}" is not available in the current ` +
        'Pokémon Champions calculator data.',
    );
  }

  const pokemonOptions = {
    nature: build.nature.trim(),

    ability:
      build.ability.trim() ||
      undefined,

    item:
      build.item.trim() ||
      undefined,

    /*
     * @smogon/calc keeps the historical
     * property name "evs".
     *
     * In Champions generation 0, these
     * values represent Stat Points.
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
  };

  const fullHpPokemon =
    new Pokemon(
      CHAMPIONS_GENERATION,
      speciesName,
      pokemonOptions,
    );

  if (
    options.currentHp === undefined
  ) {
    return fullHpPokemon;
  }

  const currentHp =
    normalizeCurrentHp(
      options.currentHp,
      fullHpPokemon.maxHP(),
    );

  return new Pokemon(
    CHAMPIONS_GENERATION,
    speciesName,
    {
      ...pokemonOptions,
      curHP: currentHp,
    },
  );
}

export function getChampionsStats(
  build: ChampionsPokemonBuild,
): CalculatedStats {
  const pokemon =
    createChampionsPokemon(build);

  return copyCalculatedStats(
    pokemon,
  );
}

export function calculateChampionsDamage(
  attackerBuild:
    ChampionsPokemonBuild,

  defenderBuild:
    ChampionsPokemonBuild,

  moveName: string,

  fieldConditions:
    DamageFieldConditions =
      DEFAULT_DAMAGE_FIELD_CONDITIONS,

  options:
    ChampionsDamageOptions = {},
): ChampionsDamageResult {
  const cleanedMoveName =
    moveName.trim();

  if (!cleanedMoveName) {
    throw new Error(
      'A move name is required.',
    );
  }

  const moveData =
    CHAMPIONS_GENERATION.moves.get(
      toID(cleanedMoveName),
    );

  if (!moveData) {
    throw new Error(
      `"${cleanedMoveName}" is not available in the current ` +
        'Pokémon Champions calculator data.',
    );
  }

  const attacker =
    createChampionsPokemon(
      attackerBuild,
    );

  const defender =
    createChampionsPokemon(
      defenderBuild,
      {
        currentHp:
          options.defenderCurrentHp,
      },
    );

  const move = new Move(
    CHAMPIONS_GENERATION,
    cleanedMoveName,
  );

  const weather =
    fieldConditions.weather ||
    undefined;

  const terrain =
    fieldConditions.terrain ||
    undefined;

  const field = new Field({
    gameType: 'Doubles',
    weather,
    terrain,

    attackerSide: {
      isHelpingHand:
        fieldConditions
          .attackerHelpingHand,
    },

    defenderSide: {
      isReflect:
        fieldConditions
          .defenderReflect,

      isLightScreen:
        fieldConditions
          .defenderLightScreen,

      isAuroraVeil:
        fieldConditions
          .defenderAuroraVeil,

      isFriendGuard:
        fieldConditions
          .defenderFriendGuard,
    },
  });

  const result = calculate(
    CHAMPIONS_GENERATION,
    attacker,
    defender,
    move,
    field,
  );

  const [
    minDamage,
    maxDamage,
  ] = result.range();

  const koResult =
    result.kochance(false);

  /*
   * kochance() may report a 2HKO or a
   * later KO when an immediate faint is
   * impossible. For this result we only
   * want the chance from the current hit.
   */
  const oneHitKoChance =
    koResult.n === 1 &&
    typeof koResult.chance ===
      'number'
      ? koResult.chance
      : 0;

  /*
 * @smogon/calc's move-data interface does not
 * expose move accuracy.
 *
 * This temporarily assumes the move hit.
 * Real move accuracy will be added to our
 * generated regulation snapshot next.
 */
const baseAccuracyPercent = 100;

  const accuracyAdjustedKoChance =
    oneHitKoChance *
    (
      baseAccuracyPercent /
      100
    );

  return {
    minDamage,
    maxDamage,

    description:
      result.desc(),

    attackerStats:
      copyCalculatedStats(
        attacker,
      ),

    defenderStats:
      copyCalculatedStats(
        defender,
      ),

    defenderCurrentHp:
      defender.curHP(),

    defenderMaxHp:
      defender.maxHP(),

    oneHitKoChance,
    baseAccuracyPercent,
    accuracyAdjustedKoChance,
  };
}