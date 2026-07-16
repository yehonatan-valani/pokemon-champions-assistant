import {
  Generations,
  toID,
} from '@smogon/calc';

import {
  ITEM_NAMES,
} from '../data/championsData';

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

function getMegaStoneMap(
  itemName: string,
):
  | Readonly<
      Record<
        string,
        string
      >
    >
  | null {
  const itemData =
    GENERATION_9_DATA.items.get(
      toID(itemName),
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

  return (
    megaStoneMap ??
    null
  );
}

function createMegaCapability(
  baseSpecies: string,
  baseAbility: string,
  stone: string,
  megaSpecies: string,
): ChampionsMegaCapability | null {
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

    baseAbility,

    stone,

    megaSpecies,

    megaAbility,
  };
}

/**
 * Returns every legal Mega option for a
 * species.
 *
 * This is used for opponents because
 * their exact held stone may not have
 * been recorded before the animation.
 */
export function getChampionsMegaCapabilitiesForSpecies(
  species: string,

  baseAbility:
    string = '',
): ChampionsMegaCapability[] {
  const cleanedSpecies =
    species.trim();

  if (!cleanedSpecies) {
    return [];
  }

  const capabilities:
  ChampionsMegaCapability[] = [];

  const seenCapabilities =
    new Set<string>();

  ITEM_NAMES.forEach(
    (itemName) => {
      const megaStoneMap =
        getMegaStoneMap(
          itemName,
        );

      if (!megaStoneMap) {
        return;
      }

      const matchingEntry =
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
            toID(
              cleanedSpecies,
            ),
        );

      if (!matchingEntry) {
        return;
      }

      const capability =
        createMegaCapability(
          cleanedSpecies,
          baseAbility.trim(),
          itemName,
          matchingEntry[1],
        );

      if (!capability) {
        return;
      }

      const capabilityKey =
        [
          toID(
            capability.stone,
          ),

          toID(
            capability.megaSpecies,
          ),
        ].join(':');

      if (
        seenCapabilities.has(
          capabilityKey,
        )
      ) {
        return;
      }

      seenCapabilities.add(
        capabilityKey,
      );

      capabilities.push(
        capability,
      );
    },
  );

  return capabilities.sort(
    (
      first,
      second,
    ) =>
      first.megaSpecies
        .localeCompare(
          second.megaSpecies,
        ) ||
      first.stone.localeCompare(
        second.stone,
      ),
  );
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

  const capabilities =
    getChampionsMegaCapabilitiesForSpecies(
      baseSpecies,
      build.ability,
    );

  return (
    capabilities.find(
      (capability) =>
        toID(
          capability.stone,
        ) ===
        toID(stone),
    ) ??
    null
  );
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
        capability.megaSpecies,

      ability:
        capability.megaAbility,
    },

    form:
      'mega',

    transformed:
      true,

    baseSpecies,

    effectiveSpecies:
      capability.megaSpecies,

    effectiveAbility:
      capability.megaAbility,

    capability,
  };
}