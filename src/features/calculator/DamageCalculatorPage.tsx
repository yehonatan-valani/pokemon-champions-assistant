import { useState } from 'react';

import AutocompleteInput from '../../components/AutocompleteInput';
import FieldControls from '../../components/FieldControls';
import PokemonBuildEditor from '../../components/PokemonBuildEditor';
import SpeedControls from '../../components/SpeedControls';

import {
  createEmptyPokemonBuild,
  type ChampionsPokemonBuild,
} from '../../domain/pokemonBuild';

import {
  DEFAULT_SPEED_CONDITIONS,
  type SpeedComparisonResult,
  type SpeedConditions,
} from '../../domain/speed';

import {
  DEFAULT_DAMAGE_FIELD_CONDITIONS,
  type DamageFieldConditions,
} from '../../domain/fieldConditions';

import {
  calculateChampionsDamage,
  type ChampionsDamageResult,
} from '../../mechanics/championsCalculator';

import {
  compareSpeed,
} from '../../mechanics/compareSpeed';

const EXAMPLE_ATTACKER:
ChampionsPokemonBuild = {
  species: 'Pikachu',
  nature: 'Timid',
  ability: 'Static',
  item: '',

  moves: [
    'Thunderbolt',
    'Protect',
    'Fake Out',
    'Electroweb',
  ],

  statPoints: {
    hp: 0,
    atk: 0,
    def: 1,
    spa: 32,
    spd: 0,
    spe: 32,
  },
};

const EXAMPLE_DEFENDER:
ChampionsPokemonBuild = {
  species: 'Pikachu',
  nature: 'Bold',
  ability: 'Static',
  item: '',

  moves: [
    'Thunderbolt',
    'Protect',
    'Fake Out',
    'Electroweb',
  ],

  statPoints: {
    hp: 32,
    atk: 0,
    def: 32,
    spa: 0,
    spd: 1,
    spe: 0,
  },
};

function percentageText(
  probability: number,
): string {
  return `${(
    probability * 100
  ).toFixed(1)}%`;
}

function DamageCalculatorPage() {
  const [
    fieldConditions,
    setFieldConditions,
  ] = useState<DamageFieldConditions>({
    ...DEFAULT_DAMAGE_FIELD_CONDITIONS,
  });

  const [
    attacker,
    setAttacker,
  ] = useState<ChampionsPokemonBuild>(
    createEmptyPokemonBuild,
  );

  const [
    defender,
    setDefender,
  ] = useState<ChampionsPokemonBuild>(
    createEmptyPokemonBuild,
  );

  const [
    attackerSpeedConditions,
    setAttackerSpeedConditions,
  ] = useState<SpeedConditions>({
    ...DEFAULT_SPEED_CONDITIONS,
  });

  const [
    defenderSpeedConditions,
    setDefenderSpeedConditions,
  ] = useState<SpeedConditions>({
    ...DEFAULT_SPEED_CONDITIONS,
  });

  const [
    trickRoom,
    setTrickRoom,
  ] = useState(false);

  const [
    moveName,
    setMoveName,
  ] = useState('');

  /*
   * Blank means full HP.
   *
   * Keeping this as text allows the input
   * to be temporarily empty while typing.
   */
  const [
    defenderCurrentHpInput,
    setDefenderCurrentHpInput,
  ] = useState('');

  const [
    result,
    setResult,
  ] =
    useState<ChampionsDamageResult | null>(
      null,
    );

  const [
    speedResult,
    setSpeedResult,
  ] =
    useState<SpeedComparisonResult | null>(
      null,
    );

  const [
    error,
    setError,
  ] = useState('');

  const attackerMoveOptions = [
    ...new Set(
      attacker.moves.filter(
        (attackerMove) =>
          Boolean(
            attackerMove.trim(),
          ),
      ),
    ),
  ];

  function clearResults() {
    setResult(null);
    setSpeedResult(null);
    setError('');
  }

  function handleAttackerChange(
    nextAttacker:
      ChampionsPokemonBuild,
  ) {
    setAttacker(nextAttacker);

    const selectedMoveStillExists =
      nextAttacker.moves.some(
        (attackerMove) =>
          attackerMove
            .trim()
            .toLowerCase() ===
          moveName
            .trim()
            .toLowerCase(),
      );

    if (
      moveName &&
      !selectedMoveStillExists
    ) {
      setMoveName('');
    }

    clearResults();
  }

  function handleDefenderChange(
    nextDefender:
      ChampionsPokemonBuild,
  ) {
    setDefender(nextDefender);
    clearResults();
  }

  function loadExample() {
    setFieldConditions({
      ...DEFAULT_DAMAGE_FIELD_CONDITIONS,
    });

    setAttacker(
      EXAMPLE_ATTACKER,
    );

    setDefender(
      EXAMPLE_DEFENDER,
    );

    setMoveName(
      'Thunderbolt',
    );

    setDefenderCurrentHpInput(
      '',
    );

    setAttackerSpeedConditions({
      ...DEFAULT_SPEED_CONDITIONS,
    });

    setDefenderSpeedConditions({
      ...DEFAULT_SPEED_CONDITIONS,
    });

    setTrickRoom(false);
    setResult(null);
    setSpeedResult(null);
    setError('');
  }

  function handleCalculate() {
    setError('');
    setResult(null);
    setSpeedResult(null);

    try {
      const cleanedCurrentHp =
        defenderCurrentHpInput.trim();

      const defenderCurrentHp =
        cleanedCurrentHp
          ? Number(
              cleanedCurrentHp,
            )
          : undefined;

      if (
        defenderCurrentHp !==
          undefined &&
        !Number.isFinite(
          defenderCurrentHp,
        )
      ) {
        throw new Error(
          'Defender current HP must be a valid number.',
        );
      }

      const nextDamageResult =
        calculateChampionsDamage(
          attacker,
          defender,
          moveName,
          fieldConditions,
          {
            defenderCurrentHp,
          },
        );

      const nextSpeedResult =
        compareSpeed(
          attacker,
          attackerSpeedConditions,
          defender,
          defenderSpeedConditions,
          trickRoom,
        );

      setResult(
        nextDamageResult,
      );

      setSpeedResult(
        nextSpeedResult,
      );
    } catch (calculationError) {
      if (
        calculationError instanceof
        Error
      ) {
        setError(
          calculationError.message,
        );
      } else {
        setError(
          'An unknown calculation error occurred.',
        );
      }
    }
  }

  const minimumPercent = result
    ? (
        (
          result.minDamage /
          result.defenderMaxHp
        ) *
        100
      ).toFixed(1)
    : null;

  const maximumPercent = result
    ? (
        (
          result.maxDamage /
          result.defenderMaxHp
        ) *
        100
      ).toFixed(1)
    : null;

  function getMoveOrderMessage(
    comparison:
      SpeedComparisonResult,
  ): string {
    if (
      comparison.order ===
      'first'
    ) {
      return (
        'The attacker moves first.'
      );
    }

    if (
      comparison.order ===
      'second'
    ) {
      return (
        'The defender moves first.'
      );
    }

    return (
      'A Speed tie is possible.'
    );
  }

  return (
    <main className="calculator-page">
      <header className="page-header">
        <p className="eyebrow">
          Pokémon Champions Assistant
        </p>

        <h1>
          Known-versus-Known Calculator
        </h1>

        <p>
          Enter two complete builds and
          calculate damage, current-HP
          faint chance, and move order
          using Pokémon Champions
          mechanics.
        </p>

        <button
          className="secondary-button"
          type="button"
          onClick={loadExample}
        >
          Load example
        </button>
      </header>

      <div className="calculator-build-grid">
        <PokemonBuildEditor
          title="Attacker"
          build={attacker}
          onChange={
            handleAttackerChange
          }
        />

        <PokemonBuildEditor
          title="Defender"
          build={defender}
          onChange={
            handleDefenderChange
          }
        />
      </div>

      <div className="speed-controls-grid">
        <SpeedControls
          title="Attacker"
          value={
            attackerSpeedConditions
          }
          onChange={
            setAttackerSpeedConditions
          }
        />

        <SpeedControls
          title="Defender"
          value={
            defenderSpeedConditions
          }
          onChange={
            setDefenderSpeedConditions
          }
        />
      </div>

      <label className="trick-room-control">
        <input
          type="checkbox"
          checked={trickRoom}
          onChange={(event) => {
            setTrickRoom(
              event.target.checked,
            );

            clearResults();
          }}
        />

        <span>
          Trick Room active
        </span>
      </label>

      <FieldControls
        value={fieldConditions}
        onChange={(
          nextFieldConditions,
        ) => {
          setFieldConditions(
            nextFieldConditions,
          );

          clearResults();
        }}
      />

      <section className="calculation-controls">
        <AutocompleteInput
          id="calculation-move"
          label="Move used by attacker"
          value={moveName}
          options={
            attackerMoveOptions
          }
          placeholder={
            attacker.species
              ? 'Choose one of the attacker’s moves'
              : 'Configure the attacker first'
          }
          required
          onChange={(value) => {
            setMoveName(value);
            clearResults();
          }}
        />

        <label className="form-field">
          <span>
            Defender current HP
          </span>

          <input
            type="number"
            min="1"
            step="1"
            value={
              defenderCurrentHpInput
            }
            placeholder="Blank means full HP"
            onChange={(event) => {
              setDefenderCurrentHpInput(
                event.target.value,
              );

              clearResults();
            }}
          />

          <small className="field-help-text">
            Enter exact HP. Leave blank
            to calculate from full HP.
          </small>
        </label>

        <button
          className="primary-button"
          type="button"
          disabled={
            !moveName.trim()
          }
          onClick={handleCalculate}
        >
          Calculate Damage
        </button>
      </section>

      {error && (
        <section className="calculation-error">
          <strong>
            Calculation failed
          </strong>

          <p>{error}</p>
        </section>
      )}

      {speedResult && (
        <section className="speed-result">
          <h2>Move order</h2>

          <div className="stats-comparison">
            <section>
              <h3>
                Attacker Speed
              </h3>

              <dl>
                <div>
                  <dt>
                    Base Speed
                  </dt>

                  <dd>
                    {
                      speedResult
                        .firstBaseSpeed
                    }
                  </dd>
                </div>

                <div>
                  <dt>
                    Effective Speed
                  </dt>

                  <dd>
                    {
                      speedResult
                        .firstEffectiveSpeed
                    }
                  </dd>
                </div>
              </dl>
            </section>

            <section>
              <h3>
                Defender Speed
              </h3>

              <dl>
                <div>
                  <dt>
                    Base Speed
                  </dt>

                  <dd>
                    {
                      speedResult
                        .secondBaseSpeed
                    }
                  </dd>
                </div>

                <div>
                  <dt>
                    Effective Speed
                  </dt>

                  <dd>
                    {
                      speedResult
                        .secondEffectiveSpeed
                    }
                  </dd>
                </div>
              </dl>
            </section>
          </div>

          <p className="speed-message">
            {getMoveOrderMessage(
              speedResult,
            )}
          </p>

          <p>
            {speedResult.reason}
          </p>
        </section>
      )}

      {result && (
        <section className="calculation-result">
          <h2>Damage result</h2>

          <div className="damage-summary">
            <div>
              <span className="result-label">
                Damage
              </span>

              <strong className="result-value">
                {result.minDamage}–
                {result.maxDamage} HP
              </strong>
            </div>

            <div>
              <span className="result-label">
                Percentage of maximum HP
              </span>

              <strong className="result-value">
                {minimumPercent}%–
                {maximumPercent}%
              </strong>
            </div>

            <div>
              <span className="result-label">
                Defender HP
              </span>

              <strong className="result-value">
                {
                  result.defenderCurrentHp
                }{' '}
                /{' '}
                {
                  result.defenderMaxHp
                }
              </strong>
            </div>

            <div>
              <span className="result-label">
                Faint chance if move hits
              </span>

              <strong className="result-value">
                {percentageText(
                  result.oneHitKoChance,
                )}
              </strong>
            </div>
          </div>

          <p className="field-help-text">
            This faint probability uses
            the damage rolls and the
            defender’s current HP. Move
            accuracy is not included yet.
          </p>

          <div className="stats-comparison">
            <section>
              <h3>
                Attacker stats
              </h3>

              <dl>
                <div>
                  <dt>HP</dt>
                  <dd>
                    {
                      result
                        .attackerStats.hp
                    }
                  </dd>
                </div>

                <div>
                  <dt>Attack</dt>
                  <dd>
                    {
                      result
                        .attackerStats.atk
                    }
                  </dd>
                </div>

                <div>
                  <dt>Defense</dt>
                  <dd>
                    {
                      result
                        .attackerStats.def
                    }
                  </dd>
                </div>

                <div>
                  <dt>
                    Special Attack
                  </dt>

                  <dd>
                    {
                      result
                        .attackerStats.spa
                    }
                  </dd>
                </div>

                <div>
                  <dt>
                    Special Defense
                  </dt>

                  <dd>
                    {
                      result
                        .attackerStats.spd
                    }
                  </dd>
                </div>

                <div>
                  <dt>Speed</dt>
                  <dd>
                    {
                      result
                        .attackerStats.spe
                    }
                  </dd>
                </div>
              </dl>
            </section>

            <section>
              <h3>
                Defender stats
              </h3>

              <dl>
                <div>
                  <dt>HP</dt>
                  <dd>
                    {
                      result
                        .defenderStats.hp
                    }
                  </dd>
                </div>

                <div>
                  <dt>Attack</dt>
                  <dd>
                    {
                      result
                        .defenderStats.atk
                    }
                  </dd>
                </div>

                <div>
                  <dt>Defense</dt>
                  <dd>
                    {
                      result
                        .defenderStats.def
                    }
                  </dd>
                </div>

                <div>
                  <dt>
                    Special Attack
                  </dt>

                  <dd>
                    {
                      result
                        .defenderStats.spa
                    }
                  </dd>
                </div>

                <div>
                  <dt>
                    Special Defense
                  </dt>

                  <dd>
                    {
                      result
                        .defenderStats.spd
                    }
                  </dd>
                </div>

                <div>
                  <dt>Speed</dt>
                  <dd>
                    {
                      result
                        .defenderStats.spe
                    }
                  </dd>
                </div>
              </dl>
            </section>
          </div>

          <details className="calculation-description">
            <summary>
              Calculator details
            </summary>

            <p>
              {result.description}
            </p>
          </details>
        </section>
      )}
    </main>
  );
}

export default DamageCalculatorPage;