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

  source: RegulationSnapshotSource;

  species:
    RegulationSpeciesEntry[];

  items: string[];
}