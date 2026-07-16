export interface ChampionsMetaUsageEntry {
  name: string;

  /**
   * Percentage from 0 to 100.
   */
  /**
 * Percentage from 0 to 100.
 *
 * Null means that the source provides
 * only a ranking for this entry.
 */
percentage: number | null;

  rank: number;
}

export interface ChampionsMetaProfile {
  species: string;

  format: 'Doubles';

  season: string;

  source: string;

  moves:
    ChampionsMetaUsageEntry[];

  items:
    ChampionsMetaUsageEntry[];

  abilities:
    ChampionsMetaUsageEntry[];

  natures:
    ChampionsMetaUsageEntry[];

  statPointSpreads:
    ChampionsMetaUsageEntry[];

  teammates:
    ChampionsMetaUsageEntry[];
}

export interface ChampionsMetaLoadError {
  species: string;

  message: string;
}

export interface ChampionsMetaProfileBatch {
  season: string;

  format: 'Doubles';

  fetchedAt: string;

  profiles:
    ChampionsMetaProfile[];

  errors:
    ChampionsMetaLoadError[];
}