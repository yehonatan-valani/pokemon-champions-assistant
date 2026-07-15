import type {
  ChampionsPokemonBuild,
} from './pokemonBuild';

export interface OpponentSetCandidate {
  id: string;
  label: string;
  sourceLabel: string;
  build: ChampionsPokemonBuild;
}

export type CandidateRejectionCode =
  | 'species'
  | 'move'
  | 'item'
  | 'ability'
  | 'speed';

export interface CandidateRejection {
  code: CandidateRejectionCode;
  message: string;
}

export interface OpponentCandidateEvaluation {
  candidate: OpponentSetCandidate;
  compatible: boolean;
  rejections: CandidateRejection[];
}