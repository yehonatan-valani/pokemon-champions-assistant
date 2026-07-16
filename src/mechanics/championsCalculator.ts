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
  DamageFieldConditions,
} from '../domain/fieldConditions';

import {
  DEFAULT_DAMAGE_FIELD_CONDITIONS,
} from '../domain/fieldConditions';

import type {
  ChampionsCalculationForm,
} from '../domain/megaEvolution';

import type {
  ChampionsPokemonBuild,
} from '../domain/pokemonBuild';

import type {
  StatKey,
} from '../domain/statPoints';

import {
  resolveChampionsCalculationBuild,
} from './resolveChampionsCalculationBuild';

const GENERATION_9_DATA =
  Generations.get(9);

const CHAMPIONS_GENERATION = {
  ...GENERATION_9_DATA,

  num:
    0 as const,
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

  currentHpLabel?: string;

  boosts?: Partial<
    ChampionsCalculatorBoosts
  >;

  status?:
    ChampionsCalculatorStatus;

  /**
   * Base is always the default.
   *
   * Mega must be requested explicitly.
   */
  form?:
    ChampionsCalculationForm;
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
   * When omitted, the defender is
   * treated as being at full HP.
   */
  defenderCurrentHp?: number;

  /**
   * Whether this specific observed or
   * hypothetical hit was a critical
   * hit.
   */
  criticalHit?: boolean;

  /**
   * Used only for moves whose target is
   * allAdjacent or allAdjacentFoes.
   */
  spreadDamageApplies?: boolean;

  /**
   * Both forms default to base.
   *
   * Mega must be explicitly selected.
   */
  attackerForm?:
    ChampionsCalculationForm;

  defenderForm?:
    ChampionsCalculationForm;
}

export interface ChampionsDamageResult {
  minDamage: number;

  maxDamage: number;

  description: string;

  attackerStats:
    CalculatedStats;

  defenderStats:
    CalculatedStats;

  defenderCurrentHp:
    number;

  defenderMaxHp:
    number;

  /**
   * Chance from 0 to 1 that the damage
   * roll faints the defender, assuming
   * the move successfully hits.
   */
  oneHitKoChance:
    number;

  /**
   * Base move accuracy from regulation
   * move metadata.
   */
  baseAccuracyPercent:
    number;

  /**
   * One-hit faint chance multiplied by
   * the move's base accuracy.
   */
  accuracyAdjustedKoChance:
    number;

  criticalHit:
    boolean;

  isSpreadMove:
    boolean;

  spreadDamageApplied:
    boolean;

  attackerForm:
    ChampionsCalculationForm;

  defenderForm:
    ChampionsCalculationForm;

  attackerSpecies:
    string;

  defenderSpecies:
    string;

  attackerAbility:
    string;

  defenderAbility:
    string;
}

function copyCalculatedStats(
  pokemon:
    Pokemon,
): CalculatedStats {
  return {
    hp:
      pokemon.stats.hp,

    atk:
      pokemon.stats.atk,

    def:
      pokemon.stats.def,

    spa:
      pokemon.stats.spa,

    spd:
      pokemon.stats.spd,

    spe:
      pokemon.stats.spe,
  };
}

function normalizeCurrentHp(
  requestedCurrentHp:
    number,

  maximumHp:
    number,

  label:
    string = 'Current HP',
): number {
  if (
    !Number.isFinite(
      requestedCurrentHp,
    )
  ) {
    throw new Error(
      `${label} must be a number.`,
    );
  }

  const roundedCurrentHp =
    Math.round(
      requestedCurrentHp,
    );

  if (
    roundedCurrentHp < 1
  ) {
    throw new Error(
      `${label} must be at least 1.`,
    );
  }

  return Math.min(
    roundedCurrentHp,
    maximumHp,
  );
}

export function createChampionsPokemon(
  originalBuild:
    ChampionsPokemonBuild,

  options:
    CreateChampionsPokemonOptions = {},
): Pokemon {
  const resolution =
    resolveChampionsCalculationBuild(
      originalBuild,
      options.form ??
        'base',
    );

  const build =
    resolution.build;

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
      hp:
        build.statPoints.hp,

      atk:
        build.statPoints.atk,

      def:
        build.statPoints.def,

      spa:
        build.statPoints.spa,

      spd:
        build.statPoints.spd,

      spe:
        build.statPoints.spe,
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
      options.currentHpLabel,
    );

  return new Pokemon(
    CHAMPIONS_GENERATION,
    speciesName,
    {
      ...pokemonOptions,

      curHP:
        currentHp,
    },
  );
}

export function getChampionsStats(
  build:
    ChampionsPokemonBuild,

  form:
    ChampionsCalculationForm =
      'base',
): CalculatedStats {
  const pokemon =
    createChampionsPokemon(
      build,
      {
        form,
      },
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

  moveName:
    string,

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

  const attackerForm =
    options.attackerForm ??
    'base';

  const defenderForm =
    options.defenderForm ??
    'base';

  const attackerResolution =
    resolveChampionsCalculationBuild(
      attackerBuild,
      attackerForm,
    );

  const defenderResolution =
    resolveChampionsCalculationBuild(
      defenderBuild,
      defenderForm,
    );

  const moveMetadata =
    getRegulationMoveEntry(
      cleanedMoveName,
    );

  const attacker =
  createChampionsPokemon(
    attackerBuild,
    {
      currentHp:
        options
          .attackerCurrentHp,

      currentHpLabel:
        'Attacker current HP',

      boosts:
        options
          .attackerBoosts,

        status:
          options
            .attackerStatus,

        form:
          attackerForm,
      },
    );

  const defender =
  createChampionsPokemon(
    defenderBuild,
    {
      currentHp:
        options
          .defenderCurrentHp,

      currentHpLabel:
        'Defender current HP',

      boosts:
        options
          .defenderBoosts,

        status:
          options
            .defenderStatus,

        form:
          defenderForm,
      },
    );

  const criticalHit =
    options.criticalHit ??
    false;

  const move =
    new Move(
      CHAMPIONS_GENERATION,
      cleanedMoveName,
      {
        isCrit:
          criticalHit,
      },
    );

  const isSpreadMove =
    move.target ===
      'allAdjacent' ||
    move.target ===
      'allAdjacentFoes';

  const spreadDamageApplied =
    isSpreadMove &&
    (
      options
        .spreadDamageApplies ??
      true
    );

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

  const field =
    new Field({
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

  const result =
    calculate(
      CHAMPIONS_GENERATION,
      attacker,
      defender,
      move,
      field,
    );

  const [
    minDamage,
    maxDamage,
  ] =
    result.range();

  const koResult =
    result.kochance(
      false,
    );

  const oneHitKoChance =
    koResult.n === 1 &&
    typeof koResult.chance ===
      'number'
      ? koResult.chance
      : 0;

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

    attackerForm,

    defenderForm,

    attackerSpecies:
      attackerResolution
        .effectiveSpecies,

    defenderSpecies:
      defenderResolution
        .effectiveSpecies,

    attackerAbility:
      attackerResolution
        .effectiveAbility,

    defenderAbility:
      defenderResolution
        .effectiveAbility,
  };
}