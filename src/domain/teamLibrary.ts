import type {
  ChampionsTeam,
} from './team';

export type TeamLibrarySource =
  | 'showdown-import'
  | 'saved-team-copy';

export interface StoredChampionsTeam {
  id: string;

  team: ChampionsTeam;

  source:
    TeamLibrarySource;

  createdAt: string;

  updatedAt: string;
}