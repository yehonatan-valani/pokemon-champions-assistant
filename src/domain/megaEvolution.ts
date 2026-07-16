export type ChampionsCalculationForm =
  | 'base'
  | 'mega';

export interface ChampionsMegaCapability {
  baseSpecies: string;

  baseAbility: string;

  stone: string;

  megaSpecies: string;

  megaAbility: string;
}

export interface ResolvedChampionsCalculationBuild {
  form:
    ChampionsCalculationForm;

  transformed: boolean;

  baseSpecies: string;

  effectiveSpecies: string;

  effectiveAbility: string;
}

/**
 * The actual form currently being used
 * by one Pokémon during a live battle.
 */
export interface BattleMegaEvolutionState {
  megaState:
    ChampionsCalculationForm;

  megaSpecies: string;

  megaAbility: string;

  megaStone: string;

  megaEvolvedTurn:
    number | null;
}

export function createBaseBattleMegaEvolutionState():
BattleMegaEvolutionState {
  return {
    megaState:
      'base',

    megaSpecies:
      '',

    megaAbility:
      '',

    megaStone:
      '',

    megaEvolvedTurn:
      null,
  };
}