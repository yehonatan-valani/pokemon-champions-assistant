import type {
  ChampionsMetaLoadError,
  ChampionsMetaProfile,
  ChampionsMetaProfileBatch,
  ChampionsMetaUsageEntry,
} from '../domain/championsMetaProfile';

const API_BASE_URL =
  'https://championsbattledata.com';

interface BattleDataIndexResponse {
  defaultSeason?: unknown;
}

interface BattleDataRow {
  position?: unknown;

  column_position?: unknown;

  category?: unknown;

  rank?: unknown;

  name?: unknown;

  percentage?: unknown;

  percentage_value?: unknown;

  stat_up?: unknown;

  stat_down?: unknown;

  hp_points?: unknown;

  attack_points?: unknown;

  defense_points?: unknown;

  sp_atk_points?: unknown;

  sp_def_points?: unknown;

  speed_points?: unknown;
}

interface BattleDataResponse {
  pokemon?: unknown;

  format?: unknown;

  season?: unknown;

  source?: unknown;

  rows?: unknown;
}

type MetaCategory =
  | 'moves'
  | 'items'
  | 'abilities'
  | 'natures'
  | 'statPointSpreads'
  | 'teammates';

function normalizeCategory(
  category: unknown,
): string {
  if (
    typeof category !== 'string'
  ) {
    return '';
  }

  return category
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]/g,
      '',
    );
}

function resolveCategory(
  category: unknown,
): MetaCategory | null {
  const normalized =
    normalizeCategory(
      category,
    );

  switch (normalized) {
    case 'move':
    case 'moves':
    case 'moveusage':
      return 'moves';

    case 'item':
    case 'items':
    case 'itemusage':
    case 'helditem':
    case 'helditems':
    case 'helditemusage':
      return 'items';

    case 'ability':
    case 'abilities':
    case 'abilityusage':
      return 'abilities';

    case 'nature':
    case 'natures':
    case 'natureusage':
    case 'statalignment':
    case 'statalignments':
      return 'natures';

    case 'spread':
    case 'spreads':
    case 'statspread':
    case 'statspreads':
    case 'statpoint':
    case 'statpoints':
    case 'statpointspread':
    case 'statpointspreads':
    case 'statpointdistribution':
    case 'statpointdistributions':
    case 'evspread':
    case 'evspreads':
      return 'statPointSpreads';

    case 'teammate':
    case 'teammates':
    case 'teammateusage':
      return 'teammates';

    default:
      return null;
  }
}

function parsePercentageValue(
  value: unknown,
): number | null {
  let parsedValue: number;

  if (
    typeof value === 'number'
  ) {
    parsedValue = value;
  } else if (
    typeof value === 'string'
  ) {
    const cleanedValue =
      value
        .replace('%', '')
        .trim();

    if (!cleanedValue) {
      return null;
    }

    parsedValue =
      Number(cleanedValue);
  } else {
    return null;
  }

  if (
    !Number.isFinite(
      parsedValue,
    )
  ) {
    return null;
  }

  return Math.max(
    0,
    Math.min(
      100,
      parsedValue,
    ),
  );
}

function parsePercentage(
  primaryValue: unknown,
  fallbackValue: unknown,
): number | null {
  return (
    parsePercentageValue(
      primaryValue,
    ) ??
    parsePercentageValue(
      fallbackValue,
    )
  );
}

function parseRank(
  row: BattleDataRow,
  fallbackRank: number,
): number {
  const possibleRank =
    Number(
      row.rank ??
        row.position,
    );

  if (
    !Number.isFinite(
      possibleRank,
    ) ||
    possibleRank < 1
  ) {
    return fallbackRank;
  }

  return Math.trunc(
    possibleRank,
  );
}

function parseStatPoint(
  value: unknown,
): number | null {
  if (
    typeof value === 'string' &&
    !value.trim()
  ) {
    return null;
  }

  const parsedValue =
    Number(value);

  if (
    !Number.isFinite(
      parsedValue,
    )
  ) {
    return null;
  }

  return Math.max(
    0,
    Math.min(
      32,
      Math.trunc(
        parsedValue,
      ),
    ),
  );
}

function formatAlignmentStat(
  value: unknown,
): string {
  if (
    typeof value !== 'string'
  ) {
    return '';
  }

  const cleanedValue =
    value.trim();

  const normalized =
    cleanedValue
      .toLowerCase()
      .replace(
        /[^a-z]/g,
        '',
      );

  switch (normalized) {
    case 'hp':
      return 'HP';

    case 'attack':
    case 'atk':
      return 'Attack';

    case 'defense':
    case 'def':
      return 'Defense';

    case 'specialattack':
    case 'spattack':
    case 'spatk':
    case 'spa':
      return 'Sp. Atk';

    case 'specialdefense':
    case 'spdefense':
    case 'spdef':
    case 'spd':
      return 'Sp. Def';

    case 'speed':
    case 'spe':
      return 'Speed';

    default:
      return cleanedValue.replace(
        /_/g,
        ' ',
      );
  }
}

function createStatPointSpreadName(
  row: BattleDataRow,
): string {
  const points = {
    hp:
      parseStatPoint(
        row.hp_points,
      ),

    atk:
      parseStatPoint(
        row.attack_points,
      ),

    def:
      parseStatPoint(
        row.defense_points,
      ),

    spa:
      parseStatPoint(
        row.sp_atk_points,
      ),

    spd:
      parseStatPoint(
        row.sp_def_points,
      ),

    spe:
      parseStatPoint(
        row.speed_points,
      ),
  };

  const hasAnyPoints =
    Object.values(
      points,
    ).some(
      (value) =>
        value !== null,
    );

  if (!hasAnyPoints) {
    return '';
  }

  const formatPoint = (
    value: number | null,
  ) =>
    value === null
      ? '?'
      : String(value);

  const spread =
    `HP ${formatPoint(points.hp)} / ` +
    `Atk ${formatPoint(points.atk)} / ` +
    `Def ${formatPoint(points.def)} / ` +
    `SpA ${formatPoint(points.spa)} / ` +
    `SpD ${formatPoint(points.spd)} / ` +
    `Spe ${formatPoint(points.spe)}`;

  const increasedStat =
    formatAlignmentStat(
      row.stat_up,
    );

  const decreasedStat =
    formatAlignmentStat(
      row.stat_down,
    );

  const alignmentParts:
  string[] = [];

  if (increasedStat) {
    alignmentParts.push(
      `${increasedStat} ↑`,
    );
  }

  if (decreasedStat) {
    alignmentParts.push(
      `${decreasedStat} ↓`,
    );
  }

  if (
    alignmentParts.length === 0
  ) {
    return spread;
  }

  return (
    `${alignmentParts.join(
      ' / ',
    )} — ${spread}`
  );
}

function createStatAlignmentName(
  row: BattleDataRow,
): string {
  const natureName =
    typeof row.name ===
      'string'
      ? row.name.trim()
      : '';

  if (!natureName) {
    return '';
  }

  const increasedStat =
    formatAlignmentStat(
      row.stat_up,
    );

  const decreasedStat =
    formatAlignmentStat(
      row.stat_down,
    );

  const alignmentParts:
  string[] = [];

  if (increasedStat) {
    alignmentParts.push(
      `${increasedStat} ↑`,
    );
  }

  if (decreasedStat) {
    alignmentParts.push(
      `${decreasedStat} ↓`,
    );
  }

  if (
    alignmentParts.length === 0
  ) {
    return natureName;
  }

  return (
    `${natureName} (` +
    `${alignmentParts.join(
      ' / ',
    )})`
  );
}

function getRowDisplayName(
  row: BattleDataRow,
  category: MetaCategory,
): string {
  if (
    category ===
    'natures'
  ) {
    return createStatAlignmentName(
      row,
    );
  }

  const providedName =
    typeof row.name ===
      'string'
      ? row.name.trim()
      : '';

  if (providedName) {
    return providedName;
  }

  if (
    category ===
    'statPointSpreads'
  ) {
    return createStatPointSpreadName(
      row,
    );
  }

  return '';
}

function createEmptyProfile(
  species: string,
  season: string,
  source: string,
): ChampionsMetaProfile {
  return {
    species,

    format: 'Doubles',

    season,

    source,

    moves: [],

    items: [],

    abilities: [],

    natures: [],

    statPointSpreads: [],

    teammates: [],
  };
}

function parseRows(
  species: string,
  season: string,
  source: string,
  rows: BattleDataRow[],
): ChampionsMetaProfile {
  const profile =
    createEmptyProfile(
      species,
      season,
      source,
    );

  rows.forEach(
    (
      row,
      rowIndex,
    ) => {
      const category =
        resolveCategory(
          row.category,
        );

      if (!category) {
        return;
      }

      const displayName =
        getRowDisplayName(
          row,
          category,
        );

      if (!displayName) {
        return;
      }

      const entry:
      ChampionsMetaUsageEntry = {
        name:
          displayName,

        percentage:
          parsePercentage(
            row.percentage,
            row.percentage_value,
          ),

        rank:
          parseRank(
            row,
            rowIndex + 1,
          ),
      };

      profile[
        category
      ].push(entry);
    },
  );

  const categories:
  MetaCategory[] = [
    'moves',
    'items',
    'abilities',
    'natures',
    'statPointSpreads',
    'teammates',
  ];

  categories.forEach(
    (category) => {
      profile[
        category
      ].sort(
        (
          first,
          second,
        ) => {
          const rankDifference =
            first.rank -
            second.rank;

          if (
            rankDifference !== 0
          ) {
            return rankDifference;
          }

          return (
            (
                second.percentage ??
                -1
            ) -
            (
                first.percentage ??
                -1
            )
            );
        },
      );
    },
  );

  return profile;
}

async function fetchJson<T>(
  url: string,
  fetchImplementation:
    typeof fetch,
): Promise<T> {
  const response =
    await fetchImplementation(
      url,
    );

  if (!response.ok) {
    throw new Error(
      `Request failed with status ${response.status}.`,
    );
  }

  return (
    await response.json()
  ) as T;
}

async function fetchDefaultSeason(
  fetchImplementation:
    typeof fetch,
): Promise<string> {
  const index =
    await fetchJson<
      BattleDataIndexResponse
    >(
      `${API_BASE_URL}/api`,
      fetchImplementation,
    );

  if (
    typeof index.defaultSeason !==
      'string' ||
    !index.defaultSeason.trim()
  ) {
    throw new Error(
      'The Champions Battle Data API did not provide a default season.',
    );
  }

  return index.defaultSeason.trim();
}

async function fetchMetaProfile(
  species: string,
  season: string,
  fetchImplementation:
    typeof fetch,
): Promise<ChampionsMetaProfile> {
  const encodedSpecies =
    encodeURIComponent(
      species,
    );

  const encodedSeason =
    encodeURIComponent(
      season,
    );

  const url =
    `${API_BASE_URL}/api/battle/` +
    `Doubles/${encodedSpecies}` +
    `?season=${encodedSeason}`;

  const response =
    await fetchJson<
      BattleDataResponse
    >(
      url,
      fetchImplementation,
    );

  if (
    !Array.isArray(
      response.rows,
    )
  ) {
    throw new Error(
      'The API response did not contain battle-data rows.',
    );
  }

  const responseSpecies =
    typeof response.pokemon ===
      'string' &&
    response.pokemon.trim()
      ? response.pokemon.trim()
      : species;

  const responseSeason =
    typeof response.season ===
      'string' &&
    response.season.trim()
      ? response.season.trim()
      : season;

  const source =
    typeof response.source ===
      'string'
      ? response.source
      : '';

  return parseRows(
    responseSpecies,
    responseSeason,
    source,
    response.rows as
      BattleDataRow[],
  );
}

export async function fetchCurrentDoublesMetaProfiles(
  speciesNames: string[],

  fetchImplementation:
    typeof fetch = fetch,
): Promise<ChampionsMetaProfileBatch> {
  const uniqueSpecies = [
    ...new Set(
      speciesNames
        .map(
          (species) =>
            species.trim(),
        )
        .filter(Boolean),
    ),
  ];

  if (
    uniqueSpecies.length === 0
  ) {
    throw new Error(
      'At least one Pokémon species is required.',
    );
  }

  const season =
    await fetchDefaultSeason(
      fetchImplementation,
    );

  const settledProfiles =
    await Promise.allSettled(
      uniqueSpecies.map(
        (species) =>
          fetchMetaProfile(
            species,
            season,
            fetchImplementation,
          ),
      ),
    );

  const profiles:
  ChampionsMetaProfile[] = [];

  const errors:
  ChampionsMetaLoadError[] = [];

  settledProfiles.forEach(
    (
      result,
      index,
    ) => {
      const species =
        uniqueSpecies[index];

      if (
        result.status ===
        'fulfilled'
      ) {
        profiles.push(
          result.value,
        );

        return;
      }

      errors.push({
        species,

        message:
          result.reason instanceof
          Error
            ? result.reason.message
            : 'An unknown loading error occurred.',
      });
    },
  );

  return {
    season,

    format: 'Doubles',

    fetchedAt:
      new Date().toISOString(),

    profiles,

    errors,
  };
}