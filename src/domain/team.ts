import {
  createEmptyPokemonBuild,
  isPokemonBuildComplete,
  type ChampionsPokemonBuild,
} from './pokemonBuild';

export const TEAM_SIZE = 6;

export interface ChampionsTeam {
  name: string;
  members: ChampionsPokemonBuild[];
}

export function createEmptyTeam(): ChampionsTeam {
  return {
    name: 'My Team',
    members: Array.from(
      { length: TEAM_SIZE },
      () => createEmptyPokemonBuild(),
    ),
  };
}

export function getCompleteMemberCount(
  team: ChampionsTeam,
): number {
  return team.members.filter(
    isPokemonBuildComplete,
  ).length;
}

export function isTeamComplete(
  team: ChampionsTeam,
): boolean {
  return (
    team.members.length === TEAM_SIZE &&
    team.members.every(isPokemonBuildComplete)
  );
}