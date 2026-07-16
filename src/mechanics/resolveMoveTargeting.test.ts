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
  setOpponentActiveSlot,
  setPlayerActiveSlot,
} from '../domain/battleState';

import {
  resolveMoveTargeting,
} from './resolveMoveTargeting';

function createBattleWithOneOpponent() {
  let battle =
    createInitialBattleState(
      createTestTeam(),
      createTestOpponentPreview(),
    );

  battle =
    setPlayerActiveSlot(
      battle,
      0,
      0,
    );

  battle =
    setOpponentActiveSlot(
      battle,
      0,
      0,
    );

  return battle;
}

describe(
  'move targeting resolution',
  () => {
    it(
      'does not request damage for a self-targeting status move',
      () => {
        const battle =
          createBattleWithOneOpponent();

        const result =
          resolveMoveTargeting(
            battle,
            {
              side: 'player',
              pokemonIndex: 0,
            },
            'Protect',
          );

        expect(
          result.isStatusMove,
        ).toBe(true);

        expect(
          result.damageMode,
        ).toBe('none');

        expect(
          result.move.target,
        ).toBe('self');
      },
    );

    it(
      'does not request damage for a side-targeting status move',
      () => {
        const battle =
          createBattleWithOneOpponent();

        const result =
          resolveMoveTargeting(
            battle,
            {
              side: 'player',
              pokemonIndex: 0,
            },
            'Tailwind',
          );

        expect(
          result.isStatusMove,
        ).toBe(true);

        expect(
          result.damageMode,
        ).toBe('none');

        expect(
          result.move.target,
        ).toBe('allySide');
      },
    );

    it(
      'treats Earthquake as single-target when only one other Pokémon is active',
      () => {
        const battle =
          createBattleWithOneOpponent();

        const result =
          resolveMoveTargeting(
            battle,
            {
              side: 'player',
              pokemonIndex: 0,
            },
            'Earthquake',
          );

        expect(
          result.targetCount,
        ).toBe(1);

        expect(
          result.damageMode,
        ).toBe('single');

        expect(
          result.spreadDamageApplies,
        ).toBe(false);
      },
    );

    it(
      'counts the user’s ally for Earthquake spread damage',
      () => {
        let battle =
          createBattleWithOneOpponent();

        battle =
          setPlayerActiveSlot(
            battle,
            1,
            1,
          );

        const result =
          resolveMoveTargeting(
            battle,
            {
              side: 'player',
              pokemonIndex: 0,
            },
            'Earthquake',
          );

        expect(
          result.targetCount,
        ).toBe(2);

        expect(
          result.damageMode,
        ).toBe('spread');

        expect(
          result.spreadDamageApplies,
        ).toBe(true);
      },
    );

    it(
      'treats Rock Slide as spread when two opponents are active',
      () => {
        let battle =
          createBattleWithOneOpponent();

        battle =
          setOpponentActiveSlot(
            battle,
            1,
            1,
          );

        const result =
          resolveMoveTargeting(
            battle,
            {
              side: 'player',
              pokemonIndex: 0,
            },
            'Rock Slide',
          );

        expect(
          result.targetCount,
        ).toBe(2);

        expect(
          result.damageMode,
        ).toBe('spread');

        expect(
          result.move.target,
        ).toBe(
          'allAdjacentFoes',
        );
      },
    );

    it(
      'loads accuracy and critical-hit metadata',
      () => {
        const battle =
          createBattleWithOneOpponent();

        const result =
          resolveMoveTargeting(
            battle,
            {
              side: 'player',
              pokemonIndex: 0,
            },
            'Rock Slide',
          );

        expect(
          result.move
            .accuracyPercent,
        ).toBeTypeOf('number');

        expect(
          result.move.critRatio,
        ).toBeGreaterThan(0);

        expect(
          result.move.description.length,
        ).toBeGreaterThan(0);
      },
    );
  },
);