import { useState } from 'react';

import AutocompleteInput from '../../components/AutocompleteInput';
import PokemonBuildEditor from '../../components/PokemonBuildEditor';
import SpeedControls from '../../components/SpeedControls';

import { MOVE_NAMES } from '../../data/championsData';

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
  calculateChampionsDamage,
  type ChampionsDamageResult,
} from '../../mechanics/championsCalculator';

import { compareSpeed } from '../../mechanics/compareSpeed';

const EXAMPLE_ATTACKER: ChampionsPokemonBuild = {
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

const EXAMPLE_DEFENDER: ChampionsPokemonBuild = {
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

function DamageCalculatorPage() {
  const [attacker, setAttacker] =
    useState<ChampionsPokemonBuild>(
      createEmptyPokemonBuild,
    );

  const [defender, setDefender] =
    useState<ChampionsPokemonBuild>(
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

  const [trickRoom, setTrickRoom] = useState(false);
  const [moveName, setMoveName] = useState('');

  const [result, setResult] =
    useState<ChampionsDamageResult | null>(null);

  const [speedResult, setSpeedResult] =
    useState<SpeedComparisonResult | null>(null);

  const [error, setError] = useState('');

  function loadExample() {
    setAttacker(EXAMPLE_ATTACKER);
    setDefender(EXAMPLE_DEFENDER);
    setMoveName('Thunderbolt');

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
      const nextDamageResult =
        calculateChampionsDamage(
          attacker,
          defender,
          moveName,
        );

      const nextSpeedResult = compareSpeed(
        attacker,
        attackerSpeedConditions,
        defender,
        defenderSpeedConditions,
        trickRoom,
      );

      setResult(nextDamageResult);
      setSpeedResult(nextSpeedResult);
    } catch (calculationError) {
      if (calculationError instanceof Error) {
        setError(calculationError.message);
      } else {
        setError(
          'An unknown calculation error occurred.',
        );
      }
    }
  }

  const minimumPercent = result
    ? (
        (result.minDamage /
          result.defenderStats.hp) *
        100
      ).toFixed(1)
    : null;

  const maximumPercent = result
    ? (
        (result.maxDamage /
          result.defenderStats.hp) *
        100
      ).toFixed(1)
    : null;

  function getMoveOrderMessage(
    comparison: SpeedComparisonResult,
  ): string {
    if (comparison.order === 'first') {
      return 'The attacker moves first.';
    }

    if (comparison.order === 'second') {
      return 'The defender moves first.';
    }

    return 'A Speed tie is possible.';
  }

  return (
    <main className="calculator-page">
      <header className="page-header">
        <p className="eyebrow">
          Pokémon Champions Assistant
        </p>

        <h1>Known-versus-Known Calculator</h1>

        <p>
          Enter two complete builds and calculate damage
          and move order using Pokémon Champions mechanics.
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
          onChange={setAttacker}
        />

        <PokemonBuildEditor
          title="Defender"
          build={defender}
          onChange={setDefender}
        />
      </div>

      <div className="speed-controls-grid">
        <SpeedControls
          title="Attacker"
          value={attackerSpeedConditions}
          onChange={setAttackerSpeedConditions}
        />

        <SpeedControls
          title="Defender"
          value={defenderSpeedConditions}
          onChange={setDefenderSpeedConditions}
        />
      </div>

      <label className="trick-room-control">
        <input
          type="checkbox"
          checked={trickRoom}
          onChange={(event) =>
            setTrickRoom(event.target.checked)
          }
        />

        <span>Trick Room active</span>
      </label>

      <section className="calculation-controls">
        <AutocompleteInput
          id="calculation-move"
          label="Move used by attacker"
          value={moveName}
          options={MOVE_NAMES}
          placeholder="Search for a move"
          required
          onChange={setMoveName}
        />

        <button
          className="primary-button"
          type="button"
          onClick={handleCalculate}
        >
          Calculate Damage
        </button>
      </section>

      {error && (
        <section className="calculation-error">
          <strong>Calculation failed</strong>
          <p>{error}</p>
        </section>
      )}

      {speedResult && (
        <section className="speed-result">
          <h2>Move order</h2>

          <div className="stats-comparison">
            <section>
              <h3>Attacker Speed</h3>

              <dl>
                <div>
                  <dt>Base Speed</dt>
                  <dd>
                    {speedResult.firstBaseSpeed}
                  </dd>
                </div>

                <div>
                  <dt>Effective Speed</dt>
                  <dd>
                    {speedResult.firstEffectiveSpeed}
                  </dd>
                </div>
              </dl>
            </section>

            <section>
              <h3>Defender Speed</h3>

              <dl>
                <div>
                  <dt>Base Speed</dt>
                  <dd>
                    {speedResult.secondBaseSpeed}
                  </dd>
                </div>

                <div>
                  <dt>Effective Speed</dt>
                  <dd>
                    {speedResult.secondEffectiveSpeed}
                  </dd>
                </div>
              </dl>
            </section>
          </div>

          <p className="speed-message">
            {getMoveOrderMessage(speedResult)}
          </p>

          <p>{speedResult.reason}</p>
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
                {result.minDamage}–{result.maxDamage} HP
              </strong>
            </div>

            <div>
              <span className="result-label">
                Percentage
              </span>

              <strong className="result-value">
                {minimumPercent}%–{maximumPercent}%
              </strong>
            </div>
          </div>

          <div className="stats-comparison">
            <section>
              <h3>Attacker stats</h3>

              <dl>
                <div>
                  <dt>HP</dt>
                  <dd>{result.attackerStats.hp}</dd>
                </div>

                <div>
                  <dt>Attack</dt>
                  <dd>{result.attackerStats.atk}</dd>
                </div>

                <div>
                  <dt>Defense</dt>
                  <dd>{result.attackerStats.def}</dd>
                </div>

                <div>
                  <dt>Special Attack</dt>
                  <dd>{result.attackerStats.spa}</dd>
                </div>

                <div>
                  <dt>Special Defense</dt>
                  <dd>{result.attackerStats.spd}</dd>
                </div>

                <div>
                  <dt>Speed</dt>
                  <dd>{result.attackerStats.spe}</dd>
                </div>
              </dl>
            </section>

            <section>
              <h3>Defender stats</h3>

              <dl>
                <div>
                  <dt>HP</dt>
                  <dd>{result.defenderStats.hp}</dd>
                </div>

                <div>
                  <dt>Attack</dt>
                  <dd>{result.defenderStats.atk}</dd>
                </div>

                <div>
                  <dt>Defense</dt>
                  <dd>{result.defenderStats.def}</dd>
                </div>

                <div>
                  <dt>Special Attack</dt>
                  <dd>{result.defenderStats.spa}</dd>
                </div>

                <div>
                  <dt>Special Defense</dt>
                  <dd>{result.defenderStats.spd}</dd>
                </div>

                <div>
                  <dt>Speed</dt>
                  <dd>{result.defenderStats.spe}</dd>
                </div>
              </dl>
            </section>
          </div>

          <details className="calculation-description">
            <summary>Calculator details</summary>
            <p>{result.description}</p>
          </details>
        </section>
      )}
    </main>
  );
}

export default DamageCalculatorPage;