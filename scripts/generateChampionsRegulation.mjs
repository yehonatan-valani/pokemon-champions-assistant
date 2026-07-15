import {
  mkdir,
  writeFile,
} from 'node:fs/promises';

import {
  dirname,
  resolve,
} from 'node:path';

import {
  fileURLToPath,
} from 'node:url';

import {
  Dex,
  TeamValidator,
} from '@pkmn/sim';

import * as Champions from '@pkmn/mods/champions';

const FORMAT_NAME =
  '[Gen 9 Champions] VGC 2026 Reg M-B';

const REGULATION_ID =
  'champions-reg-mb';

const ACTIVE_FROM =
  '2026-06-17T01:59:00Z';

const ACTIVE_UNTIL =
  '2026-09-02T01:59:00Z';

const scriptDirectory = dirname(
  fileURLToPath(import.meta.url),
);

const projectRoot = resolve(
  scriptDirectory,
  '..',
);

const outputPath = resolve(
  projectRoot,
  'src/data/generated/champions-reg-mb.json',
);

const dex = Dex.mod(
  'champions',
  Champions,
);

const format =
  dex.formats.get(FORMAT_NAME);

if (!format.exists) {
  throw new Error(
    `Pokémon Showdown format not found: ${FORMAT_NAME}`,
  );
}

const validator = new TeamValidator(
  format,
  dex,
);

const allMoves = dex.moves
  .all()
  .filter(
    (move) =>
      move.exists &&
      !move.isNonstandard,
  );

function createValidationSet(
  species,
  ability,
  moves = [],
  item = '',
) {
  return {
    name: species.name,
    species: species.name,
    item,
    ability,
    moves,
    nature: 'Serious',
    gender: '',

    evs: {
      hp: 0,
      atk: 0,
      def: 0,
      spa: 0,
      spd: 0,
      spe: 0,
    },

    ivs: {
      hp: 31,
      atk: 31,
      def: 31,
      spa: 31,
      spd: 31,
      spe: 31,
    },

    level: 50,
    happiness: 255,
    shiny: false,
  };
}

function isSelectableSpecies(
  species,
) {
  if (
    !species.exists ||
    species.isNonstandard
  ) {
    return false;
  }

  /*
   * Battle-only forms, such as Mega forms,
   * are not selected as the starting species.
   * Their base species and required item are
   * selected instead.
   */
  if (
    species.battleOnly ||
    species.requiredItem ||
    species.requiredItems?.length
  ) {
    return false;
  }

  const ability =
    Object.values(
      species.abilities,
    )[0] ?? '';

  const set = createValidationSet(
    species,
    ability,
  );

  const {
    tierSpecies,
  } = validator.getValidationSpecies(
    set,
  );

  return !validator.checkSpecies(
    set,
    species,
    tierSpecies,
    {},
  );
}

function getLegalMoves(
  species,
) {
  const set = createValidationSet(
    species,

    Object.values(
      species.abilities,
    )[0] ?? '',
  );

  return allMoves
    .filter((move) => {
      const formatProblem =
        validator.checkMove(
          set,
          move,
          {},
        );

      if (formatProblem) {
        return false;
      }

      const learnsetProblem =
        validator.checkCanLearn(
          move,
          species,
        );

      return !learnsetProblem;
    })
    .map((move) => move.name)
    .sort((first, second) =>
      first.localeCompare(second),
    );
}

function getLegalAbilities(
  species,
) {
  return [
    ...new Set(
      Object.values(
        species.abilities,
      )
        .filter(Boolean)
        .map(String),
    ),
  ].sort((first, second) =>
    first.localeCompare(second),
  );
}

const speciesEntries = dex.species
  .all()
  .filter(isSelectableSpecies)
  .map((species) => ({
    species: species.name,

    abilities:
      getLegalAbilities(species),

    moves:
      getLegalMoves(species),
  }))
  .sort((first, second) =>
    first.species.localeCompare(
      second.species,
    ),
  );

const legalItems = dex.items
  .all()
  .filter(
    (item) =>
      item.exists &&
      !item.isNonstandard,
  )
  .filter((item) => {
    /*
     * checkItem checks regulation-wide
     * item restrictions. Species-specific
     * compatibility will be validated
     * separately.
     */
    const pikachu =
      dex.species.get('Pikachu');

    const set =
      createValidationSet(
        pikachu,
        'Static',
        ['Thunderbolt'],
        item.name,
      );

    return !validator.checkItem(
      set,
      item,
      {},
    );
  })
  .map((item) => item.name)
  .sort((first, second) =>
    first.localeCompare(second),
  );

const snapshot = {
  schemaVersion: 1,

  regulationId:
    REGULATION_ID,

  formatName: FORMAT_NAME,

  activeFrom: ACTIVE_FROM,
  activeUntil: ACTIVE_UNTIL,

  generatedAt:
    new Date().toISOString(),

  source: {
    simulator:
      '@pkmn/sim@0.10.11',

    mods:
      '@pkmn/mods@0.10.11',

    mod: 'champions',
  },

  species: speciesEntries,
  items: legalItems,
};

await mkdir(
  dirname(outputPath),
  {
    recursive: true,
  },
);

await writeFile(
  outputPath,

  `${JSON.stringify(
    snapshot,
    null,
    2,
  )}\n`,

  'utf8',
);

console.log(
  [
    `Generated ${speciesEntries.length}`,
    'legal Regulation M-B species at',
    outputPath,
  ].join(' '),
);