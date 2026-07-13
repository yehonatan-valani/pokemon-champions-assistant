export type WeatherCondition =
  | ''
  | 'Sun'
  | 'Rain'
  | 'Sand'
  | 'Snow'
  | 'Harsh Sunshine'
  | 'Heavy Rain'
  | 'Strong Winds';

export type TerrainCondition =
  | ''
  | 'Electric'
  | 'Grassy'
  | 'Psychic'
  | 'Misty';

export interface DamageFieldConditions {
  weather: WeatherCondition;
  terrain: TerrainCondition;

  attackerHelpingHand: boolean;

  defenderReflect: boolean;
  defenderLightScreen: boolean;
  defenderAuroraVeil: boolean;
  defenderFriendGuard: boolean;
}

export const DEFAULT_DAMAGE_FIELD_CONDITIONS:
DamageFieldConditions = {
  weather: '',
  terrain: '',

  attackerHelpingHand: false,

  defenderReflect: false,
  defenderLightScreen: false,
  defenderAuroraVeil: false,
  defenderFriendGuard: false,
};