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

import {
  getChampionsStats,
} from '../mechanics/championsCalculator';

import type {
  BattleActionRecord,
} from './battleAction';

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

export type BattleStatStageKey =
  keyof BattleStatStages;

export interface RuntimePokemonState {
  status: MajorStatus;
  statStages: BattleStatStages;
  fainted: boolean;
}

export interface PlayerBattlePokemonState
  extends RuntimePokemonState {
  build: ChampionsPokemonBuild;
  currentHp: number;
  maxHp: number;
}

export interface OpponentBattlePokemonState
  extends RuntimePokemonState {
  species: string;
  currentHpPercent: number;
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

export type TimedBattleFieldKey =
  | 'trickRoomTurns'
  | 'playerTailwindTurns'
  | 'opponentTailwindTurns'
  | 'playerReflectTurns'
  | 'opponentReflectTurns'
  | 'playerLightScreenTurns'
  | 'opponentLightScreenTurns'
  | 'playerAuroraVeilTurns'
  | 'opponentAuroraVeilTurns';

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

  actionHistory: BattleActionRecord[];
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
        (build) => {
            const clonedBuild =
            clonePokemonBuild(build);

            const maxHp =
            getChampionsStats(clonedBuild).hp;

            return {
            ...createRuntimeState(),
            build: clonedBuild,
            currentHp: maxHp,
            maxHp,
            };
        },
        ),

    opponentPokemon:
        opponentPreview.species.map(
            (species) => ({
            ...createRuntimeState(),
            species,
            currentHpPercent: 100,
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

        actionHistory: [],

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

function validatePokemonIndex(
  pokemonIndex: number,
  teamSize: number,
): void {
  if (
    !Number.isInteger(pokemonIndex) ||
    pokemonIndex < 0 ||
    pokemonIndex >= teamSize
  ) {
    throw new Error(
      'The selected Pokémon slot is invalid.',
    );
  }
}

function clampHpPercent(
  hpPercent: number,
): number {
  if (!Number.isFinite(hpPercent)) {
    return 100;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(hpPercent)),
  );
}

function clampExactHp(
  hp: number,
  maxHp: number,
): number {
  if (!Number.isFinite(hp)) {
    return maxHp;
  }

  return Math.max(
    0,
    Math.min(maxHp, Math.round(hp)),
  );
}

function clampStatStage(
  stage: number,
): number {
  if (!Number.isFinite(stage)) {
    return 0;
  }

  return Math.max(
    -6,
    Math.min(6, Math.trunc(stage)),
  );
}

function removeFromActiveSlots(
  activeSlots: ActiveSlots,
  pokemonIndex: number,
): ActiveSlots {
  return activeSlots.map((activeIndex) =>
    activeIndex === pokemonIndex
      ? null
      : activeIndex,
  ) as ActiveSlots;
}

function updatePlayerPokemon(
  battle: BattleState,
  pokemonIndex: number,
  updater: (
    pokemon: PlayerBattlePokemonState,
  ) => PlayerBattlePokemonState,
): BattleState {
  validatePokemonIndex(
    pokemonIndex,
    battle.playerPokemon.length,
  );

  return {
    ...battle,
    playerPokemon: battle.playerPokemon.map(
      (pokemon, index) =>
        index === pokemonIndex
          ? updater(pokemon)
          : pokemon,
    ),
  };
}

function updateOpponentPokemon(
  battle: BattleState,
  pokemonIndex: number,
  updater: (
    pokemon: OpponentBattlePokemonState,
  ) => OpponentBattlePokemonState,
): BattleState {
  validatePokemonIndex(
    pokemonIndex,
    battle.opponentPokemon.length,
  );

  return {
    ...battle,
    opponentPokemon:
      battle.opponentPokemon.map(
        (pokemon, index) =>
          index === pokemonIndex
            ? updater(pokemon)
            : pokemon,
      ),
  };
}

export function setPlayerPokemonHp(
  battle: BattleState,
  pokemonIndex: number,
  hp: number,
): BattleState {
  validatePokemonIndex(
    pokemonIndex,
    battle.playerPokemon.length,
  );

  const pokemon =
    battle.playerPokemon[pokemonIndex];

  const nextHp = clampExactHp(
    hp,
    pokemon.maxHp,
  );

  const nextBattle = updatePlayerPokemon(
    battle,
    pokemonIndex,
    (currentPokemon) => ({
      ...currentPokemon,
      currentHp: nextHp,
      fainted: nextHp === 0,
    }),
  );

  return nextHp === 0
    ? {
        ...nextBattle,
        playerActive: removeFromActiveSlots(
          nextBattle.playerActive,
          pokemonIndex,
        ),
      }
    : nextBattle;
}

export function setOpponentPokemonHp(
  battle: BattleState,
  pokemonIndex: number,
  hpPercent: number,
): BattleState {
  const nextHp = clampHpPercent(hpPercent);

  const nextBattle = updateOpponentPokemon(
    battle,
    pokemonIndex,
    (pokemon) => ({
      ...pokemon,
      currentHpPercent: nextHp,
      fainted: nextHp === 0,
    }),
  );

  return nextHp === 0
    ? {
        ...nextBattle,
        opponentActive: removeFromActiveSlots(
          nextBattle.opponentActive,
          pokemonIndex,
        ),
      }
    : nextBattle;
}

export function setPlayerPokemonStatus(
  battle: BattleState,
  pokemonIndex: number,
  status: MajorStatus,
): BattleState {
  return updatePlayerPokemon(
    battle,
    pokemonIndex,
    (pokemon) => ({
      ...pokemon,
      status,
    }),
  );
}

export function setOpponentPokemonStatus(
  battle: BattleState,
  pokemonIndex: number,
  status: MajorStatus,
): BattleState {
  return updateOpponentPokemon(
    battle,
    pokemonIndex,
    (pokemon) => ({
      ...pokemon,
      status,
    }),
  );
}

export function setPlayerPokemonFainted(
  battle: BattleState,
  pokemonIndex: number,
  fainted: boolean,
): BattleState {
  const nextBattle = updatePlayerPokemon(
    battle,
    pokemonIndex,
    (pokemon) => ({
      ...pokemon,
      fainted,
      currentHp: fainted
        ? 0
        : Math.max(1, pokemon.currentHp),
    }),
  );

  return fainted
    ? {
        ...nextBattle,
        playerActive: removeFromActiveSlots(
          nextBattle.playerActive,
          pokemonIndex,
        ),
      }
    : nextBattle;
}

export function setOpponentPokemonFainted(
  battle: BattleState,
  pokemonIndex: number,
  fainted: boolean,
): BattleState {
  const nextBattle = updateOpponentPokemon(
    battle,
    pokemonIndex,
    (pokemon) => ({
      ...pokemon,
      fainted,
      currentHpPercent: fainted
        ? 0
        : Math.max(1, pokemon.currentHpPercent),
    }),
  );

  return fainted
    ? {
        ...nextBattle,
        opponentActive: removeFromActiveSlots(
          nextBattle.opponentActive,
          pokemonIndex,
        ),
      }
    : nextBattle;
}

export function setPlayerPokemonStatStage(
  battle: BattleState,
  pokemonIndex: number,
  statKey: BattleStatStageKey,
  stage: number,
): BattleState {
  return updatePlayerPokemon(
    battle,
    pokemonIndex,
    (pokemon) => ({
      ...pokemon,
      statStages: {
        ...pokemon.statStages,
        [statKey]: clampStatStage(stage),
      },
    }),
  );
}

export function setOpponentPokemonStatStage(
  battle: BattleState,
  pokemonIndex: number,
  statKey: BattleStatStageKey,
  stage: number,
): BattleState {
  return updateOpponentPokemon(
    battle,
    pokemonIndex,
    (pokemon) => ({
      ...pokemon,
      statStages: {
        ...pokemon.statStages,
        [statKey]: clampStatStage(stage),
      },
    }),
  );
}

export function revealOpponentMove(
  battle: BattleState,
  pokemonIndex: number,
  moveName: string,
): BattleState {
  const cleanedMoveName = moveName.trim();

  if (!cleanedMoveName) {
    throw new Error(
      'A revealed move name is required.',
    );
  }

  validatePokemonIndex(
    pokemonIndex,
    battle.opponentPokemon.length,
  );

  const pokemon =
    battle.opponentPokemon[pokemonIndex];

  if (
    pokemon.revealedMoves.includes(
      cleanedMoveName,
    )
  ) {
    return battle;
  }

  if (pokemon.revealedMoves.length >= 4) {
    throw new Error(
      'This Pokémon already has four revealed moves.',
    );
  }

  return updateOpponentPokemon(
    battle,
    pokemonIndex,
    (currentPokemon) => ({
      ...currentPokemon,
      revealedMoves: [
        ...currentPokemon.revealedMoves,
        cleanedMoveName,
      ],
    }),
  );
}

export function removeOpponentRevealedMove(
  battle: BattleState,
  pokemonIndex: number,
  moveName: string,
): BattleState {
  return updateOpponentPokemon(
    battle,
    pokemonIndex,
    (pokemon) => ({
      ...pokemon,
      revealedMoves:
        pokemon.revealedMoves.filter(
          (revealedMove) =>
            revealedMove !== moveName,
        ),
    }),
  );
}

export function setOpponentRevealedItem(
  battle: BattleState,
  pokemonIndex: number,
  itemName: string,
): BattleState {
  return updateOpponentPokemon(
    battle,
    pokemonIndex,
    (pokemon) => ({
      ...pokemon,
      revealedItem: itemName.trim(),
    }),
  );
}

export function setOpponentRevealedAbility(
  battle: BattleState,
  pokemonIndex: number,
  abilityName: string,
): BattleState {
  return updateOpponentPokemon(
    battle,
    pokemonIndex,
    (pokemon) => ({
      ...pokemon,
      revealedAbility:
        abilityName.trim(),
    }),
  );
}

function clampFieldTurns(
  turns: number,
): number {
  if (!Number.isFinite(turns)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(8, Math.trunc(turns)),
  );
}

export function setBattleWeather(
  battle: BattleState,
  weather: WeatherCondition,
): BattleState {
  return {
    ...battle,
    field: {
      ...battle.field,
      weather,
    },
  };
}

export function setBattleTerrain(
  battle: BattleState,
  terrain: TerrainCondition,
): BattleState {
  return {
    ...battle,
    field: {
      ...battle.field,
      terrain,
    },
  };
}

export function setBattleFieldTurns(
  battle: BattleState,
  fieldKey: TimedBattleFieldKey,
  turns: number,
): BattleState {
  return {
    ...battle,
    field: {
      ...battle.field,
      [fieldKey]: clampFieldTurns(turns),
    },
  };
}

export function recordBattleEvent(
  battle: BattleState,
  message: string,
): BattleState {
  const cleanedMessage = message.trim();

  if (!cleanedMessage) {
    return battle;
  }

  return {
    ...battle,
    eventHistory: [
      ...battle.eventHistory,
      `Turn ${battle.turnNumber}: ${cleanedMessage}`,
    ],
  };
}

export function advanceBattleTurn(
  battle: BattleState,
): BattleState {
  const nextTurnNumber =
    battle.turnNumber + 1;

  return {
    ...battle,
    turnNumber: nextTurnNumber,

    field: {
      ...battle.field,

      trickRoomTurns: Math.max(
        0,
        battle.field.trickRoomTurns - 1,
      ),

      playerTailwindTurns: Math.max(
        0,
        battle.field.playerTailwindTurns - 1,
      ),

      opponentTailwindTurns: Math.max(
        0,
        battle.field.opponentTailwindTurns - 1,
      ),

      playerReflectTurns: Math.max(
        0,
        battle.field.playerReflectTurns - 1,
      ),

      opponentReflectTurns: Math.max(
        0,
        battle.field.opponentReflectTurns - 1,
      ),

      playerLightScreenTurns: Math.max(
        0,
        battle.field.playerLightScreenTurns - 1,
      ),

      opponentLightScreenTurns: Math.max(
        0,
        battle.field.opponentLightScreenTurns - 1,
      ),

      playerAuroraVeilTurns: Math.max(
        0,
        battle.field.playerAuroraVeilTurns - 1,
      ),

      opponentAuroraVeilTurns: Math.max(
        0,
        battle.field.opponentAuroraVeilTurns - 1,
      ),
    },

    eventHistory: [
      ...battle.eventHistory,
      `Turn ${nextTurnNumber} started.`,
    ],
  };
}