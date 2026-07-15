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

function createActiveTestBattle() {
  let battle = createInitialBattleState(
    createTestTeam(),
    createTestOpponentPreview(),
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

      battle = recordMoveUsed(
        battle,
        {
          side: 'opponent',
          pokemonIndex: 0,
        },
        'Thunderbolt',
      );

      battle = recordMoveUsed(
        battle,
        {
          side: 'player',
          pokemonIndex: 0,
        },
        'Make It Rain',
      );

      const evidence =
        deriveSpeedEvidence(
          battle.actionHistory,
        );

      expect(evidence).toHaveLength(1);

      expect(
        evidence[0].relation,
      ).toBe('greater-than-or-equal');

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
        'Thunderbolt',
      );

      battle = recordMoveUsed(
        battle,
        {
          side: 'player',
          pokemonIndex: 0,
        },
        'Make It Rain',
      );

      const evidence =
        deriveSpeedEvidence(
          battle.actionHistory,
        );

      expect(evidence).toHaveLength(1);

      expect(
        evidence[0].relation,
      ).toBe('less-than-or-equal');
    },
  );

  it(
    'does not compare moves with different priorities',
    () => {
      let battle =
        createActiveTestBattle();

      battle = recordMoveUsed(
        battle,
        {
          side: 'opponent',
          pokemonIndex: 0,
        },
        'Fake Out',
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
    'does not compare across a field-state change',
    () => {
      let battle =
        createActiveTestBattle();

      battle = recordMoveUsed(
        battle,
        {
          side: 'player',
          pokemonIndex: 1,
        },
        'Tailwind',
      );

      battle = recordMoveUsed(
        battle,
        {
          side: 'opponent',
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

      battle = recordMoveUsed(
        battle,
        {
          side: 'opponent',
          pokemonIndex: 0,
        },
        'Thunderbolt',
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
        'Make It Rain',
      );

      const evidence =
        deriveSpeedEvidence(
          battle.actionHistory,
        );

      expect(evidence).toEqual([]);
    },
  );
});