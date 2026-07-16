export type RegulationMoveCategory =
  | 'Physical'
  | 'Special'
  | 'Status';

export type RegulationMoveTarget =
  | 'adjacentAlly'
  | 'adjacentAllyOrSelf'
  | 'adjacentFoe'
  | 'all'
  | 'allAdjacent'
  | 'allAdjacentFoes'
  | 'allies'
  | 'allySide'
  | 'allyTeam'
  | 'any'
  | 'foeSide'
  | 'normal'
  | 'randomNormal'
  | 'scripted'
  | 'self';

export interface RegulationMoveEntry {
  name: string;

  category:
    RegulationMoveCategory;

  target:
    RegulationMoveTarget;

  description: string;

  basePower: number;

  /**
   * Null means the move does not make a
   * normal accuracy check.
   */
  accuracyPercent:
    number | null;

  /**
   * Pokémon Showdown critical-hit stage.
   * Ordinary moves normally use 1.
   */
  critRatio: number;

  alwaysCritical: boolean;
}

export interface RegulationSpeciesEntry {
  species: string;
  abilities: string[];
  moves: string[];
}

export interface RegulationSnapshotSource {
  simulator: string;
  mods: string;
  mod: string;
}

export interface ChampionsRegulationSnapshot {
  schemaVersion: number;

  regulationId: string;
  formatName: string;

  activeFrom: string;
  activeUntil: string;
  generatedAt: string;

  source:
    RegulationSnapshotSource;

  species:
    RegulationSpeciesEntry[];

  moves:
    RegulationMoveEntry[];

  items: string[];
}