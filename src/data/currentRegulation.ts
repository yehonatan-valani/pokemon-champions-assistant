import {
  toID,
} from '@smogon/calc';

import snapshotJson from './generated/champions-reg-mb.json';

import type {
  ChampionsRegulationSnapshot,
  RegulationSpeciesEntry,
} from '../domain/regulation';

export const CURRENT_REGULATION =
  snapshotJson as ChampionsRegulationSnapshot;

const speciesById = new Map<
  string,
  RegulationSpeciesEntry
>(
  CURRENT_REGULATION.species.map(
    (entry) => [
      toID(entry.species),
      entry,
    ],
  ),
);

export const REGULATION_POKEMON_NAMES =
  CURRENT_REGULATION.species.map(
    (entry) => entry.species,
  );

export const REGULATION_ITEM_NAMES = [
  ...CURRENT_REGULATION.items,
];

export function getRegulationSpeciesEntry(
  speciesName: string,
): RegulationSpeciesEntry | null {
  return (
    speciesById.get(
      toID(speciesName),
    ) ?? null
  );
}

export function isSpeciesLegalInCurrentRegulation(
  speciesName: string,
): boolean {
  return speciesById.has(
    toID(speciesName),
  );
}

export function getLegalMovesForSpecies(
  speciesName: string,
): string[] {
  const entry =
    getRegulationSpeciesEntry(
      speciesName,
    );

  return entry
    ? [...entry.moves]
    : [];
}

export function getLegalAbilitiesForSpecies(
  speciesName: string,
): string[] {
  const entry =
    getRegulationSpeciesEntry(
      speciesName,
    );

  return entry
    ? [...entry.abilities]
    : [];
}

export function isMoveLegalForSpecies(
  speciesName: string,
  moveName: string,
): boolean {
  const entry =
    getRegulationSpeciesEntry(
      speciesName,
    );

  if (!entry) {
    return false;
  }

  const moveId = toID(moveName);

  return entry.moves.some(
    (legalMove) =>
      toID(legalMove) === moveId,
  );
}

export function isAbilityLegalForSpecies(
  speciesName: string,
  abilityName: string,
): boolean {
  const entry =
    getRegulationSpeciesEntry(
      speciesName,
    );

  if (!entry) {
    return false;
  }

  const abilityId =
    toID(abilityName);

  return entry.abilities.some(
    (legalAbility) =>
      toID(legalAbility) ===
      abilityId,
  );
}

export function isItemLegalInCurrentRegulation(
  itemName: string,
): boolean {
  const itemId = toID(itemName);

  return CURRENT_REGULATION.items.some(
    (legalItem) =>
      toID(legalItem) === itemId,
  );
}