import { POKEMON_NAMES } from '../data/championsData';

export const OPPONENT_TEAM_SIZE = 6;

export interface OpponentTeamPreview {
  name: string;
  species: string[];
}

export function createEmptyOpponentTeamPreview():
OpponentTeamPreview {
  return {
    name: 'Opponent',
    species: Array.from(
      { length: OPPONENT_TEAM_SIZE },
      () => '',
    ),
  };
}

export function getOpponentSpeciesCount(
  preview: OpponentTeamPreview,
): number {
  return preview.species.filter(
    (speciesName) =>
      POKEMON_NAMES.includes(speciesName),
  ).length;
}

export function isOpponentTeamPreviewComplete(
  preview: OpponentTeamPreview,
): boolean {
  return (
    preview.species.length === OPPONENT_TEAM_SIZE &&
    preview.species.every(
      (speciesName) =>
        POKEMON_NAMES.includes(speciesName),
    )
  );
}