import {
  useState,
} from 'react';

import {
  getLegalMovesForSpecies,
  getRegulationMoveEntry,
} from '../data/currentRegulation';

import type {
  BattleActorReference,
} from '../domain/battleAction';

import type {
  CriticalHitObservation,
} from '../domain/damageObservation';

import type {
  BattleState,
} from '../domain/battleState';

import {
  recordDamageObservation,
} from '../mechanics/recordDamageObservation';

import {
  resolveMoveTargeting,
} from '../mechanics/resolveMoveTargeting';

import AutocompleteInput
  from './AutocompleteInput';

interface BattleDamageRecorderProps {
  battle: BattleState;

  onBattleChange: (
    nextBattle: BattleState,
  ) => void;

  onError: (
    message: string,
  ) => void;
}

interface PokemonOption {
  value: string;

  label: string;

  reference:
    BattleActorReference;
}

function createPokemonOptions(
  battle: BattleState,
): PokemonOption[] {
  const options:
  PokemonOption[] = [];

  battle.playerActive.forEach(
    (
      pokemonIndex,
      position,
    ) => {
      if (
        pokemonIndex === null
      ) {
        return;
      }

      const pokemon =
        battle.playerPokemon[
          pokemonIndex
        ];

      options.push({
        value:
          `player:${pokemonIndex}`,

        label:
          `My ${
            position === 0
              ? 'left'
              : 'right'
          }: ${pokemon.build.species}`,

        reference: {
          side: 'player',
          pokemonIndex,
        },
      });
    },
  );

  battle.opponentActive.forEach(
    (
      pokemonIndex,
      position,
    ) => {
      if (
        pokemonIndex === null
      ) {
        return;
      }

      const pokemon =
        battle.opponentPokemon[
          pokemonIndex
        ];

      options.push({
        value:
          `opponent:${pokemonIndex}`,

        label:
          `Opponent ${
            position === 0
              ? 'left'
              : 'right'
          }: ${pokemon.species}`,

        reference: {
          side: 'opponent',
          pokemonIndex,
        },
      });
    },
  );

  return options;
}

function parseReference(
  value: string,
): BattleActorReference | null {
  const [
    side,
    indexText,
  ] = value.split(':');

  if (
    side !== 'player' &&
    side !== 'opponent'
  ) {
    return null;
  }

  const pokemonIndex =
    Number(indexText);

  if (
    !Number.isInteger(
      pokemonIndex,
    )
  ) {
    return null;
  }

  return {
    side,
    pokemonIndex,
  };
}


function getCurrentHpDisplay(
  battle: BattleState,
  reference:
    BattleActorReference,
): number {
  if (
    reference.side === 'player'
  ) {
    return battle.playerPokemon[
      reference.pokemonIndex
    ].currentHp;
  }

  return battle.opponentPokemon[
    reference.pokemonIndex
  ].currentHpPercent;
}

function getMaximumInputValue(
  battle: BattleState,
  reference:
    BattleActorReference | null,
): number | undefined {
  if (!reference) {
    return undefined;
  }

  if (
    reference.side === 'player'
  ) {
    return battle.playerPokemon[
      reference.pokemonIndex
    ].maxHp;
  }

  return 100;
}

function getMoveOptions(
  battle: BattleState,
  attacker:
    BattleActorReference | null,
): string[] {
  if (!attacker) {
    return [];
  }

  if (
    attacker.side === 'player'
  ) {
    return battle.playerPokemon[
      attacker.pokemonIndex
    ].build.moves.filter(
      (moveName) =>
        Boolean(
          moveName.trim(),
        ),
    );
  }

  const species =
    battle.opponentPokemon[
      attacker.pokemonIndex
    ].species;

  return getLegalMovesForSpecies(
    species,
  );
}

function describeCriticalHit(
  criticalHit:
    CriticalHitObservation,
): string {
  switch (criticalHit) {
    case 'yes':
      return 'Critical hit';

    case 'unsure':
      return 'Critical status unsure';

    default:
      return 'Normal hit';
  }
}

function BattleDamageRecorder({
  battle,
  onBattleChange,
  onError,
}: BattleDamageRecorderProps) {
  const [
    attackerValue,
    setAttackerValue,
  ] = useState('');

  const [
    targetValue,
    setTargetValue,
  ] = useState('');

  const [
    moveName,
    setMoveName,
  ] = useState('');

  const [
    hpBeforeInput,
    setHpBeforeInput,
  ] = useState('');

  const [
    hpAfterInput,
    setHpAfterInput,
  ] = useState('');

  const [
    criticalHit,
    setCriticalHit,
  ] =
    useState<CriticalHitObservation>(
      'no',
    );

  const pokemonOptions =
    createPokemonOptions(
      battle,
    );

  const selectedAttacker =
    parseReference(
      attackerValue,
    );

  const selectedTarget =
    parseReference(
      targetValue,
    );

  const targetOptions =
    pokemonOptions.filter(
      (option) =>
        option.value !==
        attackerValue,
    );

  const moveOptions =
    getMoveOptions(
      battle,
      selectedAttacker,
    );

  const targetIsPlayer =
    selectedTarget?.side ===
    'player';

  const hpLabel =
    targetIsPlayer
      ? 'Exact HP'
      : 'Displayed HP percentage';

  const hpSuffix =
    targetIsPlayer
      ? 'HP'
      : '%';

  const maximumInputValue =
    getMaximumInputValue(
      battle,
      selectedTarget,
    );

  let targetingPreview:
  ReturnType<
    typeof resolveMoveTargeting
  > | null = null;

  if (
    selectedAttacker &&
    getRegulationMoveEntry(
      moveName,
    )
  ) {
    try {
      targetingPreview =
        resolveMoveTargeting(
          battle,
          selectedAttacker,
          moveName,
        );
    } catch {
      targetingPreview = null;
    }
  }

  const observations =
    battle.damageObservations ??
    [];

  const currentTurnObservations =
    observations.filter(
      (observation) =>
        observation.turnNumber ===
        battle.turnNumber,
    );

  function resetTargetEntry() {
    setTargetValue('');
    setHpBeforeInput('');
    setHpAfterInput('');

    setCriticalHit(
      targetingPreview?.move
        .alwaysCritical
        ? 'yes'
        : 'no',
    );
  }

  function handleAttackerChange(
    value: string,
  ) {
    setAttackerValue(value);
    setMoveName('');
    setTargetValue('');
    setHpBeforeInput('');
    setHpAfterInput('');
    setCriticalHit('no');
    onError('');
  }

  function handleMoveChange(
    value: string,
  ) {
    setMoveName(value);

    const move =
      getRegulationMoveEntry(
        value,
      );

    setCriticalHit(
      move?.alwaysCritical
        ? 'yes'
        : 'no',
    );

    onError('');
  }

  function handleTargetChange(
    value: string,
  ) {
    setTargetValue(value);
    setHpAfterInput('');

    const reference =
      parseReference(value);

    if (!reference) {
      setHpBeforeInput('');
      return;
    }

    setHpBeforeInput(
      String(
        getCurrentHpDisplay(
          battle,
          reference,
        ),
      ),
    );

    onError('');
  }

  function handleRecordDamage() {
    if (!selectedAttacker) {
      onError(
        'Select the attacking Pokémon.',
      );

      return;
    }

    if (!selectedTarget) {
      onError(
        'Select the Pokémon that took damage.',
      );

      return;
    }

    try {
      const nextBattle =
        recordDamageObservation(
          battle,
          {
            attacker:
              selectedAttacker,

            target:
              selectedTarget,

            moveName,

            hpBefore:
              Number(
                hpBeforeInput,
              ),

            hpAfter:
              Number(
                hpAfterInput,
              ),

            criticalHit,
          },
        );

      onBattleChange(
        nextBattle,
      );

      /*
       * Keep attacker and move selected.
       * This makes recording every target
       * of a spread move quicker.
       */
      resetTargetEntry();
      onError('');
    } catch (recordError) {
      if (
        recordError instanceof
        Error
      ) {
        onError(
          recordError.message,
        );
      }
    }
  }

  const recordDisabled =
    !selectedAttacker ||
    !selectedTarget ||
    !moveName.trim() ||
    hpBeforeInput.trim() ===
      '' ||
    hpAfterInput.trim() ===
      '' ||
    targetingPreview
      ?.isStatusMove === true ||
    targetingPreview
      ?.damageMode ===
        'unsupported';

  return (
    <section className="battle-action-recorder">
      <h2>Record damage</h2>

      <p>
        Record one observation for each
        Pokémon that lost HP. Targeting and
        spread damage are resolved from the
        move and the current active board.
      </p>

      <label className="form-field">
        <span>Attacking Pokémon</span>

        <select
          value={attackerValue}
          onChange={(event) =>
            handleAttackerChange(
              event.target.value,
            )
          }
        >
          <option value="">
            Choose an active Pokémon
          </option>

          {pokemonOptions.map(
            (option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ),
          )}
        </select>
      </label>

      <AutocompleteInput
        id="damage-observation-move"
        label="Move that dealt damage"
        value={moveName}
        options={moveOptions}
        placeholder={
          selectedAttacker
            ? 'Search for a move'
            : 'Select the attacker first'
        }
        onChange={
          handleMoveChange
        }
      />

      {targetingPreview && (
        <section className="speed-result">
          <strong>
            Automatic move resolution
          </strong>

          <p>
            {
              targetingPreview
                .summary
            }
          </p>

          {targetingPreview.move
            .description && (
            <p className="field-help-text">
              {
                targetingPreview
                  .move
                  .description
              }
            </p>
          )}

          {targetingPreview.move
            .alwaysCritical && (
            <p className="field-help-text">
              This move always lands a
              critical hit. Critical hit
              has been selected
              automatically.
            </p>
          )}
        </section>
      )}

      {targetingPreview
        ?.isStatusMove ? (
        <section className="calculation-error">
          <strong>
            No damage entry needed
          </strong>

          <p>
            {
              targetingPreview
                .summary
            }
          </p>

          <p>
            Record this move in the
            structured battle-action
            recorder instead.
          </p>
        </section>
      ) : (
        <>
          <label className="form-field">
            <span>
              Pokémon that took damage
            </span>

            <select
              value={targetValue}
              onChange={(event) =>
                handleTargetChange(
                  event.target.value,
                )
              }
            >
              <option value="">
                Choose an active target
              </option>

              {targetOptions.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>
          </label>

          {selectedTarget && (
            <>
              <div className="battle-action-entry">
                <label className="form-field">
                  <span>
                    {hpLabel} before
                  </span>

                  <input
                    type="number"
                    min="0"
                    max={
                      maximumInputValue
                    }
                    step="1"
                    value={
                      hpBeforeInput
                    }
                    onChange={(event) =>
                      setHpBeforeInput(
                        event.target
                          .value,
                      )
                    }
                  />

                  <small className="field-help-text">
                    Enter the value shown
                    before the attack in{' '}
                    {hpSuffix}.
                  </small>
                </label>

                <label className="form-field">
                  <span>
                    {hpLabel} after
                  </span>

                  <input
                    type="number"
                    min="0"
                    max={
                      maximumInputValue
                    }
                    step="1"
                    value={
                      hpAfterInput
                    }
                    onChange={(event) =>
                      setHpAfterInput(
                        event.target
                          .value,
                      )
                    }
                  />

                  <small className="field-help-text">
                    Enter the value shown
                    after the attack in{' '}
                    {hpSuffix}.
                  </small>
                </label>
              </div>

              <div className="form-field">
                <span>Critical hit</span>

                <label>
                  <input
                    type="radio"
                    name="damage-critical-hit"
                    value="no"
                    checked={
                      criticalHit ===
                      'no'
                    }
                    disabled={
                      targetingPreview
                        ?.move
                        .alwaysCritical
                    }
                    onChange={() =>
                      setCriticalHit(
                        'no',
                      )
                    }
                  />

                  {' '}
                  No — normal hit
                </label>

                <label>
                  <input
                    type="radio"
                    name="damage-critical-hit"
                    value="yes"
                    checked={
                      criticalHit ===
                      'yes'
                    }
                    onChange={() =>
                      setCriticalHit(
                        'yes',
                      )
                    }
                  />

                  {' '}
                  Yes
                </label>

                <label>
                  <input
                    type="radio"
                    name="damage-critical-hit"
                    value="unsure"
                    checked={
                      criticalHit ===
                      'unsure'
                    }
                    disabled={
                      targetingPreview
                        ?.move
                        .alwaysCritical
                    }
                    onChange={() =>
                      setCriticalHit(
                        'unsure',
                      )
                    }
                  />

                  {' '}
                  Unsure
                </label>
              </div>

              <button
                className="primary-button"
                type="button"
                disabled={
                  recordDisabled
                }
                onClick={
                  handleRecordDamage
                }
              >
                Record Damage
              </button>
            </>
          )}
        </>
      )}

      <h3>
        Turn {battle.turnNumber}{' '}
        damage observations
      </h3>

      {currentTurnObservations
        .length === 0 && (
        <p>
          No damage observations recorded
          this turn.
        </p>
      )}

      <ol>
        {currentTurnObservations.map(
          (observation) => {
            const suffix =
              observation.hpUnit ===
              'exact'
                ? ' HP'
                : '%';

            return (
              <li key={observation.id}>
                <strong>
                  {
                    observation
                      .attackerName
                  }
                </strong>
                {' used '}
                <strong>
                  {
                    observation
                      .moveName
                  }
                </strong>
                {' on '}
                <strong>
                  {
                    observation
                      .targetName
                  }
                </strong>
                {': '}
                {
                  observation
                    .hpBefore
                }
                {suffix}
                {' → '}
                {
                  observation
                    .hpAfter
                }
                {suffix}
                {' — '}
                {describeCriticalHit(
                  observation
                    .criticalHit,
                )}
                {', '}
                {
                  observation
                    .targeting
                    .damageMode
                }
              </li>
            );
          },
        )}
      </ol>
    </section>
  );
}

export default BattleDamageRecorder;