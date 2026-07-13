import { useState } from 'react';

import PokemonBuildEditor from '../../components/PokemonBuildEditor';
import {
  createEmptyPokemonBuild,
  type ChampionsPokemonBuild,
} from '../../domain/pokemonBuild';
import {
  calculateChampionsDamage,
  type ChampionsDamageResult,
} from '../../mechanics/championsCalculator';
import AutocompleteInput from '../../components/AutocompleteInput';
import { MOVE_NAMES } from '../../data/championsData';

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

  const [moveName, setMoveName] = useState('');
  const [result, setResult] =
    useState<ChampionsDamageResult | null>(null);
  const [error, setError] = useState('');

  function loadExample() {
    setAttacker(EXAMPLE_ATTACKER);
    setDefender(EXAMPLE_DEFENDER);
    setMoveName('Thunderbolt');
    setResult(null);
    setError('');
  }

  function handleCalculate() {
    setError('');
    setResult(null);

    try {
      const nextResult = calculateChampionsDamage(
        attacker,
        defender,
        moveName,
      );

      setResult(nextResult);
    } catch (calculationError) {
      if (calculationError instanceof Error) {
        setError(calculationError.message);
        return;
      }

      setError('An unknown calculation error occurred.');
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

  let speedMessage = '';

  if (result) {
    if (
      result.attackerStats.spe >
      result.defenderStats.spe
    ) {
      speedMessage = 'The attacker is faster.';
    } else if (
      result.attackerStats.spe <
      result.defenderStats.spe
    ) {
      speedMessage = 'The defender is faster.';
    } else {
      speedMessage = 'The Pokémon have the same Speed.';
    }
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
          using Pokémon Champions mechanics.
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

      <section className="calculation-controls">
        <label className="form-field">
          <span><AutocompleteInput
  id="calculation-move"
  label="Move used by attacker"
  value={moveName}
  options={MOVE_NAMES}
  placeholder="Search for a move"
  required
  onChange={setMoveName}
/></span>

          <input
            type="text"
            value={moveName}
            placeholder="Example: Thunderbolt"
            onChange={(event) =>
              setMoveName(event.target.value)
            }
          />
        </label>

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

      {result && (
        <section className="calculation-result">
          <h2>Calculation result</h2>

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

          <p className="speed-message">
            {speedMessage}
          </p>

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