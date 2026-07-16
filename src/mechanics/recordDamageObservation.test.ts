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
  recordDamageObservation,
} from './recordDamageObservation';

import {
  getLegalMovesForSpecies,
  getRegulationMoveEntry,
} from '../data/currentRegulation';

function getLegalDamagingMove(
  speciesName: string,
): string {
  const moveName =
    getLegalMovesForSpecies(
      speciesName,
    ).find((candidateMove) => {
      const move =
        getRegulationMoveEntry(
          candidateMove,
        );

      if (
        !move ||
        move.category === 'Status'
      ) {
        return false;
      }

      return (
        move.target === 'normal' ||
        move.target === 'adjacentFoe' ||
        move.target ===
          'allAdjacentFoes' ||
        move.target ===
          'allAdjacent' ||
        move.target ===
          'randomNormal' ||
        move.target === 'any'
      );
    });

  if (!moveName) {
    throw new Error(
      `No supported damaging move was found for ${speciesName}.`,
    );
  }

  return moveName;
}

function createBasicBattle() {
  const opponentPreview =
    createTestOpponentPreview();

  /*
   * The general development fixture starts
   * with Rillaboom, but the current generated
   * Champions regulation snapshot does not
   * provide legal moves for that species.
   *
   * Use a known regulation species for these
   * move-legality tests.
   */
  opponentPreview.species = [
    'Abomasnow',
    ...opponentPreview.species.slice(1),
  ];

  let battle =
    createInitialBattleState(
      createTestTeam(),
      opponentPreview,
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
  'damage observations',
  () => {
    it(
      'records exact HP damage to the player',
      () => {
        const battle =
            createBasicBattle();

            const moveName =
            getLegalDamagingMove(
                battle.opponentPokemon[0]
                .species,
            );

            const maximumHp =
          battle.playerPokemon[0]
            .maxHp;

        const nextBattle =
          recordDamageObservation(
            battle,
            {
              attacker: {
                side: 'opponent',
                pokemonIndex: 0,
              },

              target: {
                side: 'player',
                pokemonIndex: 0,
              },

              moveName,

              hpBefore:
                maximumHp,

              hpAfter:
                maximumHp - 20,

              criticalHit: 'no',
            },
          );

        expect(
          nextBattle
            .playerPokemon[0]
            .currentHp,
        ).toBe(
          maximumHp - 20,
        );

        expect(
          nextBattle
            .damageObservations,
        ).toHaveLength(1);

        const observation =
          nextBattle
            .damageObservations?.[0];

        expect(
          observation?.hpUnit,
        ).toBe('exact');

        expect(
          observation
            ?.criticalHit,
        ).toBe('no');

        expect(
          observation
            ?.observedDamage,
        ).toBe(20);

        expect(
            nextBattle
                .opponentPokemon[0]
                .revealedMoves,
            ).toContain(moveName);
      },
    );

    it(
      'records opponent displayed percentage damage',
      () => {
        const battle =
          createBasicBattle();

        const nextBattle =
          recordDamageObservation(
            battle,
            {
              attacker: {
                side: 'player',
                pokemonIndex: 0,
              },

              target: {
                side: 'opponent',
                pokemonIndex: 0,
              },

              moveName:
                'Thunderbolt',

              hpBefore: 100,

              hpAfter: 63,

              criticalHit: 'yes',
            },
          );

        expect(
          nextBattle
            .opponentPokemon[0]
            .currentHpPercent,
        ).toBe(63);

        const observation =
          nextBattle
            .damageObservations?.[0];

        expect(
          observation?.hpUnit,
        ).toBe('percent');

        expect(
          observation
            ?.targetMaxHp,
        ).toBeNull();

        expect(
          observation
            ?.criticalHit,
        ).toBe('yes');
      },
    );

    it(
      'allows an unchanged displayed percentage',
      () => {
        const battle =
          createBasicBattle();

        const nextBattle =
          recordDamageObservation(
            battle,
            {
              attacker: {
                side: 'player',
                pokemonIndex: 0,
              },

              target: {
                side: 'opponent',
                pokemonIndex: 0,
              },

              moveName:
                'Thunderbolt',

              hpBefore: 100,

              hpAfter: 100,

              criticalHit: 'no',
            },
          );

        expect(
          nextBattle
            .damageObservations?.[0]
            .observedDamage,
        ).toBe(0);
      },
    );

    it(
      'stores automatic spread targeting',
      () => {
        let battle =
          createInitialBattleState(
            createTestTeam(),
            createTestOpponentPreview(),
          );

        battle =
          setPlayerActiveSlot(
            battle,
            0,
            2,
          );

        battle =
          setPlayerActiveSlot(
            battle,
            1,
            1,
          );

        battle =
          setOpponentActiveSlot(
            battle,
            0,
            0,
          );

        battle =
          setOpponentActiveSlot(
            battle,
            1,
            1,
          );

        const nextBattle =
          recordDamageObservation(
            battle,
            {
              attacker: {
                side: 'player',
                pokemonIndex: 2,
              },

              target: {
                side: 'opponent',
                pokemonIndex: 0,
              },

              moveName:
                'Earthquake',

              hpBefore: 100,

              hpAfter: 70,

              criticalHit: 'no',
            },
          );

        const observation =
          nextBattle
            .damageObservations?.[0];

        expect(
          observation
            ?.targeting
            .damageMode,
        ).toBe('spread');

        expect(
          observation
            ?.targeting
            .spreadDamageApplied,
        ).toBe(true);

        /*
         * One ally and two opponents are
         * adjacent to the Earthquake user.
         */
        expect(
          observation
            ?.targeting
            .targetCount,
        ).toBe(3);
      },
    );

    it(
      'rejects status moves',
      () => {
        const battle =
          createBasicBattle();

        expect(() =>
          recordDamageObservation(
            battle,
            {
              attacker: {
                side: 'player',
                pokemonIndex: 0,
              },

              target: {
                side: 'opponent',
                pokemonIndex: 0,
              },

              moveName:
                'Protect',

              hpBefore: 100,

              hpAfter: 90,

              criticalHit: 'no',
            },
          ),
        ).toThrow(
          /status move/i,
        );
      },
    );

    it(
      'rejects exact HP increasing after an attack',
      () => {
        const battle =
            createBasicBattle();

            const moveName =
            getLegalDamagingMove(
                battle.opponentPokemon[0]
                .species,
            );

            const currentHp =
          battle.playerPokemon[0]
            .currentHp;

        expect(() =>
          recordDamageObservation(
            battle,
            {
              attacker: {
                side: 'opponent',
                pokemonIndex: 0,
              },

              target: {
                side: 'player',
                pokemonIndex: 0,
              },

              moveName,

              hpBefore:
                currentHp - 10,

              hpAfter:
                currentHp,

              criticalHit: 'no',
            },
          ),
        ).toThrow(
          /must be lower/i,
        );
      },
    );
  },
);