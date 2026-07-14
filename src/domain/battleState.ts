import type {
  TerrainCondition,
  WeatherCondition,
} from './fieldConditions';

import {
  clonePokemonBuild,
  type ChampionsPokemonBuild,
} from './pokemonBuild';

import type {
  OpponentTeamPreview,
} from './opponentTeam';

import type {
  ChampionsTeam,
} from './team';

export type MajorStatus =
  | ''
  | 'Burn'
  | 'Paralysis'
  | 'Poison'
  | 'Badly Poisoned'
  | 'Sleep'
  | 'Freeze';

export interface BattleStatStages {
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
  accuracy: number;
  evasion: number;
}

export interface RuntimePokemonState {
  currentHpPercent: number;
  status: MajorStatus;
  statStages: BattleStatStages;
  fainted: boolean;
}

export interface PlayerBattlePokemonState
  extends RuntimePokemonState {
  build: ChampionsPokemonBuild;
}

export interface OpponentBattlePokemonState
  extends RuntimePokemonState {
  species: string;
  revealedMoves: string[];
  revealedItem: string;
  revealedAbility: string;
}

export type ActiveSlots = [
  number | null,
  number | null,
];

export interface BattleFieldState {
  weather: WeatherCondition;
  terrain: TerrainCondition;

  trickRoomTurns: number;

  playerTailwindTurns: number;
  opponentTailwindTurns: number;

  playerReflectTurns: number;
  opponentReflectTurns: number;

  playerLightScreenTurns: number;
  opponentLightScreenTurns: number;

  playerAuroraVeilTurns: number;
  opponentAuroraVeilTurns: number;
}

export interface BattleState {
  turnNumber: number;

  playerTeamName: string;
  opponentName: string;

  playerPokemon: PlayerBattlePokemonState[];
  opponentPokemon: OpponentBattlePokemonState[];

  playerActive: ActiveSlots;
  opponentActive: ActiveSlots;

  field: BattleFieldState;
  eventHistory: string[];
}

export const EMPTY_BATTLE_STAT_STAGES:
BattleStatStages = {
  atk: 0,
  def: 0,
  spa: 0,
  spd: 0,
  spe: 0,
  accuracy: 0,
  evasion: 0,
};

export const DEFAULT_BATTLE_FIELD_STATE:
BattleFieldState = {
  weather: '',
  terrain: '',

  trickRoomTurns: 0,

  playerTailwindTurns: 0,
  opponentTailwindTurns: 0,

  playerReflectTurns: 0,
  opponentReflectTurns: 0,

  playerLightScreenTurns: 0,
  opponentLightScreenTurns: 0,

  playerAuroraVeilTurns: 0,
  opponentAuroraVeilTurns: 0,
};

function createRuntimeState():
RuntimePokemonState {
  return {
    currentHpPercent: 100,
    status: '',
    statStages: {
      ...EMPTY_BATTLE_STAT_STAGES,
    },
    fainted: false,
  };
}

export function createInitialBattleState(
  team: ChampionsTeam,
  opponentPreview: OpponentTeamPreview,
): BattleState {
  return {
    turnNumber: 1,

    playerTeamName: team.name,
    opponentName: opponentPreview.name,

    playerPokemon: team.members.map(
      (build) => ({
        ...createRuntimeState(),
        build: clonePokemonBuild(build),
      }),
    ),

    opponentPokemon:
      opponentPreview.species.map(
        (species) => ({
          ...createRuntimeState(),
          species,
          revealedMoves: [],
          revealedItem: '',
          revealedAbility: '',
        }),
      ),

    playerActive: [null, null],
    opponentActive: [null, null],

    field: {
      ...DEFAULT_BATTLE_FIELD_STATE,
    },

    eventHistory: [
      'Battle state created.',
    ],
  };
}

function validateActiveSelection(
  activeSlots: ActiveSlots,
  position: 0 | 1,
  selectedIndex: number | null,
  teamSize: number,
): void {
  if (selectedIndex === null) {
    return;
  }

  if (
    !Number.isInteger(selectedIndex) ||
    selectedIndex < 0 ||
    selectedIndex >= teamSize
  ) {
    throw new Error(
      'The selected Pokémon slot is invalid.',
    );
  }

  const otherPosition =
    position === 0 ? 1 : 0;

  if (
    activeSlots[otherPosition] ===
    selectedIndex
  ) {
    throw new Error(
      'The same Pokémon cannot occupy both active positions.',
    );
  }
}

export function setPlayerActiveSlot(
  battle: BattleState,
  position: 0 | 1,
  memberIndex: number | null,
): BattleState {
  validateActiveSelection(
    battle.playerActive,
    position,
    memberIndex,
    battle.playerPokemon.length,
  );

  const nextActive: ActiveSlots = [
    ...battle.playerActive,
  ];

  nextActive[position] = memberIndex;

  return {
    ...battle,
    playerActive: nextActive,
  };
}

export function setOpponentActiveSlot(
  battle: BattleState,
  position: 0 | 1,
  memberIndex: number | null,
): BattleState {
  validateActiveSelection(
    battle.opponentActive,
    position,
    memberIndex,
    battle.opponentPokemon.length,
  );

  const nextActive: ActiveSlots = [
    ...battle.opponentActive,
  ];

  nextActive[position] = memberIndex;

  return {
    ...battle,
    opponentActive: nextActive,
  };
}