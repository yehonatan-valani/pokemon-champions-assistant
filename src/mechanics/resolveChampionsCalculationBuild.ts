import {
  Generations,
  toID,
} from '@smogon/calc';

import {
  clonePokemonBuild,
  type ChampionsPokemonBuild,
} from '../domain/pokemonBuild';

import type {
  ChampionsCalculationForm,
  ChampionsMegaCapability,
  ResolvedChampionsCalculationBuild,
} from '../domain/megaEvolution';

const GENERATION_9_DATA =
  Generations.get(9);

export interface ChampionsCalculationBuildResolution
extends ResolvedChampionsCalculationBuild {
  build:
    ChampionsPokemonBuild;

  capability:
    ChampionsMegaCapability | null;
}

export function getChampionsMegaCapability(
  build:
    ChampionsPokemonBuild,
): ChampionsMegaCapability | null {
  const baseSpecies =
    build.species.trim();

  const stone =
    build.item.trim();

  if (
    !baseSpecies ||
    !stone
  ) {
    return null;
  }

  const itemData =
    GENERATION_9_DATA.items.get(
      toID(stone),
    );

  const megaStoneMap =
    itemData?.megaStone as
      | Readonly<
          Record<
            string,
            string
          >
        >
      | undefined;

  if (!megaStoneMap) {
    return null;
  }

  const megaEntry =
    Object.entries(
      megaStoneMap,
    ).find(
      (
        [
          mappedBaseSpecies,
        ],
      ) =>
        toID(
          mappedBaseSpecies,
        ) ===
        toID(baseSpecies),
    );

  if (!megaEntry) {
    return null;
  }

  const megaSpecies =
    megaEntry[1];

  const megaSpeciesData =
    GENERATION_9_DATA.species.get(
      toID(megaSpecies),
    );

  if (!megaSpeciesData) {
    return null;
  }

  const megaAbility =
    megaSpeciesData
      .abilities?.['0'] ??
    '';

  if (!megaAbility) {
    return null;
  }

  return {
    baseSpecies,

    baseAbility:
      build.ability.trim(),

    stone,

    megaSpecies,

    megaAbility,
  };
}

export function resolveChampionsCalculationBuild(
  originalBuild:
    ChampionsPokemonBuild,

  form:
    ChampionsCalculationForm =
      'base',
): ChampionsCalculationBuildResolution {
  const build =
    clonePokemonBuild(
      originalBuild,
    );

  const baseSpecies =
    build.species.trim();

  const capability =
    getChampionsMegaCapability(
      build,
    );

  if (form === 'base') {
    return {
      build,

      form:
        'base',

      transformed:
        false,

      baseSpecies,

      effectiveSpecies:
        baseSpecies,

      effectiveAbility:
        build.ability.trim(),

      capability,
    };
  }

  if (!capability) {
    const itemName =
      build.item.trim() ||
      'the held item';

    throw new Error(
      `${build.species} cannot Mega Evolve with ${itemName}.`,
    );
  }

  return {
    build: {
      ...build,

      species:
        capability
          .megaSpecies,

      ability:
        capability
          .megaAbility,
    },

    form:
      'mega',

    transformed:
      true,

    baseSpecies,

    effectiveSpecies:
      capability
        .megaSpecies,

    effectiveAbility:
      capability
        .megaAbility,

    capability,
  };
}