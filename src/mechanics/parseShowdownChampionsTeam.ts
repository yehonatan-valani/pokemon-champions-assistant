import {
  validatePokemonBuild,
  type ChampionsPokemonBuild,
} from '../domain/pokemonBuild';

import {
  TEAM_SIZE,
  type ChampionsTeam,
} from '../domain/team';

import {
  EMPTY_STAT_POINTS,
  type StatKey,
  type StatPoints,
} from '../domain/statPoints';

export interface ShowdownTeamParseResult {
  team: ChampionsTeam | null;

  errors: string[];

  warnings: string[];
}

const STAT_ALIASES:
Record<string, StatKey> = {
  hp: 'hp',
  hitpoints: 'hp',

  atk: 'atk',
  attack: 'atk',

  def: 'def',
  defense: 'def',

  spa: 'spa',
  spatk: 'spa',
  specialatk: 'spa',
  specialattack: 'spa',

  spd: 'spd',
  spdef: 'spd',
  specialdef: 'spd',
  specialdefense: 'spd',

  spe: 'spe',
  speed: 'spe',
};

function normalizeStatName(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z]/g,
      '',
    );
}

function getHeaderParts(
  header: string,
): {
  species: string;
  item: string;
} {
  const atPosition =
    header.lastIndexOf(' @ ');

  const rawPokemonName =
    atPosition >= 0
      ? header
          .slice(
            0,
            atPosition,
          )
          .trim()
      : header.trim();

  const item =
    atPosition >= 0
      ? header
          .slice(
            atPosition + 3,
          )
          .trim()
      : '';

  const withoutGender =
    rawPokemonName.replace(
      /\s+\((?:M|F)\)$/i,
      '',
    );

  /*
   * Supports ordinary Showdown nickname
   * formatting:
   *
   * Nickname (Species) @ Item
   */
  const speciesMatch =
    withoutGender.match(
      /^.*\(([^()]+)\)$/,
    );

  const species =
    speciesMatch
      ? speciesMatch[1].trim()
      : withoutGender.trim();

  return {
    species,
    item,
  };
}

function parseStatPoints(
  value: string,
  slotNumber: number,
  errors: string[],
): StatPoints {
  const statPoints:
  StatPoints = {
    ...EMPTY_STAT_POINTS,
  };

  const seenStats =
    new Set<StatKey>();

  const parts =
    value
      .split('/')
      .map(
        (part) =>
          part.trim(),
      )
      .filter(Boolean);

  if (parts.length === 0) {
    errors.push(
      `Slot ${slotNumber}: ` +
      'The Champions stat-points line is empty.',
    );

    return statPoints;
  }

  parts.forEach(
    (part) => {
      const match =
        part.match(
          /^(.+?)\s+(\d+)$/,
        );

      if (!match) {
        errors.push(
          `Slot ${slotNumber}: ` +
          `Could not understand stat-point entry "${part}".`,
        );

        return;
      }

      const statName =
        normalizeStatName(
          match[1],
        );

      const statKey =
        STAT_ALIASES[
          statName
        ];

      if (!statKey) {
        errors.push(
          `Slot ${slotNumber}: ` +
          `Unknown stat name "${match[1].trim()}".`,
        );

        return;
      }

      if (
        seenStats.has(
          statKey,
        )
      ) {
        errors.push(
          `Slot ${slotNumber}: ` +
          `${match[1].trim()} appears more than once.`,
        );

        return;
      }

      const points =
        Number(match[2]);

      statPoints[
        statKey
      ] = points;

      seenStats.add(
        statKey,
      );
    },
  );

  return statPoints;
}

function parsePokemonBlock(
  block: string,
  slotIndex: number,
  errors: string[],
  warnings: string[],
): ChampionsPokemonBuild {
  const slotNumber =
    slotIndex + 1;

  const lines =
    block
      .split('\n')
      .map(
        (line) =>
          line.trim(),
      )
      .filter(Boolean);

  const header =
    lines[0] ?? '';

  const {
    species,
    item,
  } =
    getHeaderParts(
      header,
    );

  let ability = '';
  let nature = '';

  let statPoints:
  StatPoints = {
    ...EMPTY_STAT_POINTS,
  };

  let foundStatPoints =
    false;

  let foundMegaComment =
    false;

  const moves:
  string[] = [];

  lines
    .slice(1)
    .forEach(
      (line) => {
        const abilityMatch =
          line.match(
            /^Ability:\s*(.+)$/i,
          );

        if (abilityMatch) {
          ability =
            abilityMatch[1].trim();

          return;
        }

        const natureMatch =
          line.match(
            /^(.+?)\s+Nature$/i,
          );

        if (natureMatch) {
          nature =
            natureMatch[1].trim();

          return;
        }

        const statPointsMatch =
          line.match(
            /^#\s*Champions stat points:\s*(.*)$/i,
          );

        if (statPointsMatch) {
          foundStatPoints =
            true;

          statPoints =
            parseStatPoints(
              statPointsMatch[1],
              slotNumber,
              errors,
            );

          return;
        }

        if (
          /^#\s*Champions mega/i.test(
            line,
          ) ||
          /^#\s*Mega ability:/i.test(
            line,
          )
        ) {
          foundMegaComment =
            true;

          return;
        }

        const moveMatch =
          line.match(
            /^-\s*(.+)$/,
          );

        if (moveMatch) {
          moves.push(
            moveMatch[1].trim(),
          );

          return;
        }

        /*
         * Ignore ordinary Showdown fields
         * that are not used by the
         * Champions calculator.
         */
        if (
          /^(Level|Gender|Shiny|Happiness|Tera Type):/i
            .test(line)
        ) {
          return;
        }

        if (
          line.startsWith('#')
        ) {
          return;
        }

        warnings.push(
          `Slot ${slotNumber}: ` +
          `Ignored line "${line}".`,
        );
      },
    );

  if (!foundStatPoints) {
    errors.push(
      `Slot ${slotNumber}: ` +
      'Missing "# Champions stat points:" line.',
    );
  }

  if (moves.length !== 4) {
    errors.push(
      `Slot ${slotNumber}: ` +
      `Expected 4 moves but found ${moves.length}.`,
    );
  }

  if (foundMegaComment) {
    warnings.push(
      `Slot ${slotNumber}: ` +
      'Mega preview comments were detected. ' +
      'The importer keeps the listed base species, ' +
      'ability, and item for calculations.',
    );
  }

  const build:
  ChampionsPokemonBuild = {
    species,
    nature,
    ability,
    item,

    moves: [
      moves[0] ?? '',
      moves[1] ?? '',
      moves[2] ?? '',
      moves[3] ?? '',
    ],

    statPoints,
  };

  const validation =
    validatePokemonBuild(
      build,
    );

  validation.errors.forEach(
    (validationError) => {
      errors.push(
        `Slot ${slotNumber} (${species || 'unknown'}): ` +
        validationError,
      );
    },
  );

  return build;
}

export function parseShowdownChampionsTeam(
  input: string,
  teamName =
    'Imported Showdown Team',
): ShowdownTeamParseResult {
  const errors:
  string[] = [];

  const warnings:
  string[] = [];

  const cleanedInput =
    input
      .replace(
        /\r\n?/g,
        '\n',
      )
      .trim();

  if (!cleanedInput) {
    return {
      team: null,

      errors: [
        'Paste a Showdown team before importing.',
      ],

      warnings,
    };
  }

  const blocks =
    cleanedInput
      .split(
        /\n\s*\n+/,
      )
      .map(
        (block) =>
          block.trim(),
      )
      .filter(Boolean);

  if (
    blocks.length !==
    TEAM_SIZE
  ) {
    errors.push(
      `Expected ${TEAM_SIZE} Pokémon blocks but found ${blocks.length}.`,
    );
  }

  const members =
    blocks.map(
      (
        block,
        slotIndex,
      ) =>
        parsePokemonBlock(
          block,
          slotIndex,
          errors,
          warnings,
        ),
    );

  if (
    errors.length > 0
  ) {
    return {
      team: null,
      errors,
      warnings,
    };
  }

  return {
    team: {
      name:
        teamName.trim() ||
        'Imported Showdown Team',

      members,
    },

    errors,
    warnings,
  };
}