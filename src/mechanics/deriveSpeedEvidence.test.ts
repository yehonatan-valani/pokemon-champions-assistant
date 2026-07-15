import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  createTestOpponentPreview,
  createTestTeam,
} from '../data/testData';

import {
  createInitialBattleState,
  setBattleFieldTurns,
  setOpponentActiveSlot,
  setPlayerActiveSlot,
} from '../domain/battleState';

import {
  deriveSpeedEvidence,
} from './deriveSpeedEvidence';

import {
  recordMoveUsed,
} from './applyBattleAction';

import {
  getMoveMetadata,
} from '../data/championsData';

import {
  CURRENT_REGULATION,
  getLegalMovesForSpecies,
} from '../data/currentRegulation';

function getLegalPriorityMove(
  species: string,
  priority: number,
): string {
  const legalMoves =
    getLegalMovesForSpecies(species);

  const preferredMove =
    legalMoves.find(
      (moveName) =>
        moveName === 'Protect' &&
        getMoveMetadata(moveName)
          .priority === priority,
    );

  const matchingMove =
    preferredMove ??
    legalMoves.find(
      (moveName) =>
        getMoveMetadata(moveName)
          .priority === priority,
    );

  if (!matchingMove) {
    throw new Error(
      `No priority ${priority} move was found for ${species}.`,
    );
  }

  return matchingMove;
}

function getSpeciesWithMove(
  moveName: string,
): string {
  const entry =
    CURRENT_REGULATION.species.find(
      (speciesEntry) =>
        speciesEntry.moves.includes(
          moveName,
        ),
    );

  if (!entry) {
    throw new Error(
      `No regulation-legal species was found with ${moveName}.`,
    );
  }

  return entry.species;
}

function createActiveTestBattle(
  opponentLeadSpecies = 'Pikachu',
) {
  const opponent =
    createTestOpponentPreview();

  opponent.species[0] =
    opponentLeadSpecies;

  let battle = createInitialBattleState(
    createTestTeam(),
    opponent,
  );

  battle = setPlayerActiveSlot(
    battle,
    0,
    0,
  );

  battle = setPlayerActiveSlot(
    battle,
    1,
    1,
  );

  battle = setOpponentActiveSlot(
    battle,
    0,
    0,
  );

  battle = setOpponentActiveSlot(
    battle,
    1,
    1,
  );

  return battle;
}

describe('Speed evidence', () => {
  it(
  'creates an inclusive normal-order constraint',
  () => {
    let battle =
      createActiveTestBattle();

    const opponentMove =
      getLegalPriorityMove(
        'Pikachu',
        0,
      );

    battle = recordMoveUsed(
      battle,
      {
        side: 'opponent',
        pokemonIndex: 0,
      },
      opponentMove,
    );

    battle = recordMoveUsed(
      battle,
      {
        side: 'player',
        pokemonIndex: 0,
      },
      'Thunderbolt',
    );

    const evidence =
      deriveSpeedEvidence(
        battle.actionHistory,
      );

    expect(evidence).toHaveLength(1);

    expect(
      evidence[0].relation,
    ).toBe(
      'greater-than-or-equal',
    );

    expect(
      evidence[0].priority,
    ).toBe(0);
  },
);

it(
  'reverses the constraint under Trick Room',
  () => {
    let battle =
      createActiveTestBattle();

    const opponentMove =
      getLegalPriorityMove(
        'Pikachu',
        0,
      );

    battle = setBattleFieldTurns(
      battle,
      'trickRoomTurns',
      5,
    );

    battle = recordMoveUsed(
      battle,
      {
        side: 'opponent',
        pokemonIndex: 0,
      },
      opponentMove,
    );

    battle = recordMoveUsed(
      battle,
      {
        side: 'player',
        pokemonIndex: 0,
      },
      'Thunderbolt',
    );

    const evidence =
      deriveSpeedEvidence(
        battle.actionHistory,
      );

    expect(evidence).toHaveLength(1);

    expect(
      evidence[0].relation,
    ).toBe(
      'less-than-or-equal',
    );
  },
);

it(
  'does not compare moves with different priorities',
  () => {
    let battle =
      createActiveTestBattle();

    const opponentMove =
      getLegalPriorityMove(
        'Pikachu',
        0,
      );

    battle = recordMoveUsed(
      battle,
      {
        side: 'player',
        pokemonIndex: 0,
      },
      'Fake Out',
    );

    battle = recordMoveUsed(
      battle,
      {
        side: 'opponent',
        pokemonIndex: 0,
      },
      opponentMove,
    );

    const evidence =
      deriveSpeedEvidence(
        battle.actionHistory,
      );

    expect(evidence).toEqual([]);
  },
);

it(
  'does not compare across a field-state change',
  () => {
    const tailwindSpecies =
      getSpeciesWithMove('Tailwind');

    let battle =
      createActiveTestBattle(
        tailwindSpecies,
      );

    battle = recordMoveUsed(
      battle,
      {
        side: 'opponent',
        pokemonIndex: 0,
      },
      'Tailwind',
    );

    battle = recordMoveUsed(
      battle,
      {
        side: 'player',
        pokemonIndex: 0,
      },
      'Thunderbolt',
    );

    const evidence =
      deriveSpeedEvidence(
        battle.actionHistory,
      );

    expect(evidence).toEqual([]);
  },
);

it(
  'respects the Speed-inference exclusion flag',
  () => {
    let battle =
      createActiveTestBattle();

    const opponentMove =
      getLegalPriorityMove(
        'Pikachu',
        0,
      );

    battle = recordMoveUsed(
      battle,
      {
        side: 'opponent',
        pokemonIndex: 0,
      },
      opponentMove,
      {
        speedInferenceAllowed: false,
      },
    );

    battle = recordMoveUsed(
      battle,
      {
        side: 'player',
        pokemonIndex: 0,
      },
      'Thunderbolt',
    );

    const evidence =
      deriveSpeedEvidence(
        battle.actionHistory,
      );

    expect(evidence).toEqual([]);
  },
 );
});