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