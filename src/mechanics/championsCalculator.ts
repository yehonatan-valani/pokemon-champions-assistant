import {
  calculate,
  Field,
  Generations,
  Move,
  Pokemon,
  toID,
} from '@smogon/calc';

import {
  getRegulationMoveEntry,
} from '../data/currentRegulation';

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

export type ChampionsCalculatorStatus =
  | ''
  | 'slp'
  | 'psn'
  | 'brn'
  | 'frz'
  | 'par'
  | 'tox';

export interface ChampionsCalculatorBoosts {
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface CreateChampionsPokemonOptions {
  currentHp?: number;

  boosts?: Partial<
    ChampionsCalculatorBoosts
  >;

  status?:
    ChampionsCalculatorStatus;
}

export interface ChampionsDamageOptions {
  
    /**
   * Exact attacker HP when known.
   */
  attackerCurrentHp?: number;

  attackerBoosts?: Partial<
    ChampionsCalculatorBoosts
  >;

  defenderBoosts?: Partial<
    ChampionsCalculatorBoosts
  >;

  attackerStatus?:
    ChampionsCalculatorStatus;

  defenderStatus?:
    ChampionsCalculatorStatus;
  
  /**
   * Exact current HP of the defender.
   *
   * When omitted, the defender is treated
   * as being at full HP.
   */
  defenderCurrentHp?: number;

  /**
   * Whether this specific observed or
   * hypothetical hit was a critical hit.
   */
  criticalHit?: boolean;

  /**
   * Used only for moves whose target is
   * allAdjacent or allAdjacentFoes.
   *
   * True means at least two valid targets
   * were present when the move executed.
   *
   * False means only one valid target was
   * present, so the spread modifier should
   * not apply.
   */
  spreadDamageApplies?: boolean;
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
   * Base move accuracy from the generated
   * regulation move metadata.
   */
  baseAccuracyPercent: number;

  /**
   * One-hit faint chance multiplied by
   * the move's base accuracy.
   *
   * Accuracy stages and other accuracy
   * modifiers are not included yet.
   */
  accuracyAdjustedKoChance: number;

  criticalHit: boolean;

  isSpreadMove: boolean;

  spreadDamageApplied: boolean;
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
    Math.round(
      requestedCurrentHp,
    );

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
    nature:
      build.nature.trim(),

    ability:
      build.ability.trim() ||
      undefined,

        item:
      build.item.trim() ||
      undefined,

    boosts:
      options.boosts,

    status:
      options.status,

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

    moves: [
      ...build.moves,
    ],
  };

  const fullHpPokemon =
    new Pokemon(
      CHAMPIONS_GENERATION,
      speciesName,
      pokemonOptions,
    );

  if (
    options.currentHp ===
    undefined
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
    createChampionsPokemon(
      build,
    );

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

  const moveMetadata =
    getRegulationMoveEntry(
      cleanedMoveName,
    );

    const attacker =
    createChampionsPokemon(
      attackerBuild,
      {
        currentHp:
          options.attackerCurrentHp,

        boosts:
          options.attackerBoosts,

        status:
          options.attackerStatus,
      },
    );

  const defender =
    createChampionsPokemon(
      defenderBuild,
      {
        currentHp:
          options.defenderCurrentHp,

        boosts:
          options.defenderBoosts,

        status:
          options.defenderStatus,
      },
    );

  const criticalHit =
    options.criticalHit ??
    false;

  const move = new Move(
    CHAMPIONS_GENERATION,
    cleanedMoveName,
    {
      isCrit: criticalHit,
    },
  );

  const isSpreadMove =
    move.target ===
      'allAdjacent' ||
    move.target ===
      'allAdjacentFoes';

  /*
   * Spread moves normally use doubles
   * damage. The targeting resolver passes
   * false when only one valid target was
   * present.
   */
  const spreadDamageApplied =
    isSpreadMove &&
    (
      options
        .spreadDamageApplies ??
      true
    );

  /*
   * The calculator applies the spread
   * modifier to spread-target moves in
   * Doubles mode.
   *
   * Singles mode is used only to suppress
   * that modifier when a spread move had
   * one valid target.
   */
  const calculationGameType =
    isSpreadMove &&
    !spreadDamageApplied
      ? 'Singles'
      : 'Doubles';

  const weather =
    fieldConditions.weather ||
    undefined;

  const terrain =
    fieldConditions.terrain ||
    undefined;

  const field = new Field({
    gameType:
      calculationGameType,

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
   * kochance() can report a two-hit or
   * later knockout. We only want the
   * chance of fainting from this hit.
   */
  const oneHitKoChance =
    koResult.n === 1 &&
    typeof koResult.chance ===
      'number'
      ? koResult.chance
      : 0;

  /*
   * Null represents moves that do not
   * perform an ordinary accuracy check.
   * They are treated as 100% here.
   */
  const baseAccuracyPercent =
    moveMetadata
      ?.accuracyPercent ??
    100;

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

    criticalHit,
    isSpreadMove,
    spreadDamageApplied,
  };
}