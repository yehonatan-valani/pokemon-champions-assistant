import {
  useState,
} from 'react';

import type {
  BattleState,
} from '../domain/battleState';

import type {
  OpponentSetCandidate,
} from '../domain/opponentCandidate';

import {
  calculateCandidateKoAnalysis,
  type CandidateKoAnalysis,
  type ProbabilityRange,
} from '../mechanics/calculateCandidateKoAnalysis';

import {
  resolveMoveTargeting,
} from '../mechanics/resolveMoveTargeting';

import AutocompleteInput
  from './AutocompleteInput';

interface CandidateKoPanelProps {
  battle: BattleState;

  candidates:
    OpponentSetCandidate[];
}

interface PokemonOption {
  value: string;
  label: string;
}

function formatProbability(
  probability: number,
): string {
  return `${(
    probability * 100
  ).toFixed(1)}%`;
}

function formatProbabilityRange(
  range: ProbabilityRange,
): string {
  const minimum =
    formatProbability(
      range.minimum,
    );

  const maximum =
    formatProbability(
      range.maximum,
    );

  if (
    Math.abs(
      range.maximum -
        range.minimum,
    ) <
    0.00001
  ) {
    return minimum;
  }

  return `${minimum}–${maximum}`;
}

function formatHpRange(
  values: number[],
): string {
  if (values.length === 0) {
    return 'Unknown';
  }

  const minimum =
    Math.min(...values);

  const maximum =
    Math.max(...values);

  if (minimum === maximum) {
    return `${minimum} HP`;
  }

  return `${minimum}–${maximum} HP`;
}

function createPlayerOptions(
  battle: BattleState,
): PokemonOption[] {
  return battle.playerActive.flatMap(
    (
      pokemonIndex,
      position,
    ) => {
      if (
        pokemonIndex === null
      ) {
        return [];
      }

      const pokemon =
        battle.playerPokemon[
          pokemonIndex
        ];

      if (
        !pokemon ||
        pokemon.fainted
      ) {
        return [];
      }

      return [
        {
          value:
            String(pokemonIndex),

          label:
            `My ${
              position === 0
                ? 'left'
                : 'right'
            }: ${pokemon.build.species}`,
        },
      ];
    },
  );
}

function createOpponentOptions(
  battle: BattleState,
): PokemonOption[] {
  return battle.opponentActive.flatMap(
    (
      pokemonIndex,
      position,
    ) => {
      if (
        pokemonIndex === null
      ) {
        return [];
      }

      const pokemon =
        battle.opponentPokemon[
          pokemonIndex
        ];

      if (
        !pokemon ||
        pokemon.fainted
      ) {
        return [];
      }

      return [
        {
          value:
            String(pokemonIndex),

          label:
            `Opponent ${
              position === 0
                ? 'left'
                : 'right'
            }: ${pokemon.species} ` +
            `(${pokemon.currentHpPercent}%)`,
        },
      ];
    },
  );
}

function CandidateKoPanel({
  battle,
  candidates,
}: CandidateKoPanelProps) {
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
    analysis,
    setAnalysis,
  ] =
    useState<CandidateKoAnalysis | null>(
      null,
    );

  const [
    error,
    setError,
  ] = useState('');

  const [
  analysisBattleVersion,
  setAnalysisBattleVersion,
] = useState('');

const battleVersion =
  JSON.stringify(battle);


  const attackerIndex =
    attackerValue === ''
      ? null
      : Number(
          attackerValue,
        );

  const targetIndex =
    targetValue === ''
      ? null
      : Number(
          targetValue,
        );

  const playerOptions =
    createPlayerOptions(
      battle,
    );

  const opponentOptions =
    createOpponentOptions(
      battle,
    );

  const moveOptions =
    attackerIndex === null
      ? []
      : battle.playerPokemon[
          attackerIndex
        ]?.build.moves.filter(
          (configuredMove) =>
            Boolean(
              configuredMove.trim(),
            ),
        ) ?? [];

  let targetingPreview:
  ReturnType<
    typeof resolveMoveTargeting
  > | null = null;

  if (
    attackerIndex !== null &&
    moveName.trim()
  ) {
    try {
      targetingPreview =
        resolveMoveTargeting(
          battle,
          {
            side: 'player',
            pokemonIndex:
              attackerIndex,
          },
          moveName,
        );
    } catch {
      targetingPreview = null;
    }
  }

  function clearResult() {
    setAnalysis(null);

    setAnalysisBattleVersion(
      '',
    );

    setError('');
  }

  function handleCalculate() {
    if (
      attackerIndex === null
    ) {
      setError(
        'Select one of your active Pokémon.',
      );

      return;
    }

    if (targetIndex === null) {
      setError(
        'Select an active opposing Pokémon.',
      );

      return;
    }

    try {
      const nextAnalysis =
        calculateCandidateKoAnalysis(
          battle,
          candidates,
          attackerIndex,
          targetIndex,
          moveName,
        );

      setAnalysis(
        nextAnalysis,
      );

      setAnalysisBattleVersion(
        battleVersion,
      );

      setError('');
    } catch (analysisError) {
      if (
        analysisError instanceof
        Error
      ) {
        setError(
          analysisError.message,
        );
      }
    }
  }

  return (
    <section className="battle-action-recorder">
      <h2>Candidate KO analysis</h2>

      <p>
        Estimate the chance that one of
        your active Pokémon faints the
        selected opponent, across every
        remaining compatible candidate
        set.
      </p>

      <label className="form-field">
        <span>Your attacking Pokémon</span>

        <select
          value={attackerValue}
          onChange={(event) => {
            setAttackerValue(
              event.target.value,
            );

            setMoveName('');
            clearResult();
          }}
        >
          <option value="">
            Choose an active Pokémon
          </option>

          {playerOptions.map(
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
        id="candidate-ko-move"
        label="Move"
        value={moveName}
        options={moveOptions}
        placeholder={
          attackerIndex === null
            ? 'Select the attacker first'
            : 'Choose one of its moves'
        }
        onChange={(value) => {
          setMoveName(value);
          clearResult();
        }}
      />

      <label className="form-field">
        <span>Opposing target</span>

        <select
          value={targetValue}
          onChange={(event) => {
            setTargetValue(
              event.target.value,
            );

            clearResult();
          }}
        >
          <option value="">
            Choose an active opponent
          </option>

          {opponentOptions.map(
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

      {targetingPreview && (
        <section className="speed-result">
          <strong>
            Automatic targeting
          </strong>

          <p>
            {
              targetingPreview
                .summary
            }
          </p>

          {targetingPreview
            .isStatusMove && (
            <p>
              Status moves do not have a
              KO calculation.
            </p>
          )}
        </section>
      )}

      <button
        className="primary-button"
        type="button"
        disabled={
          attackerIndex === null ||
          targetIndex === null ||
          !moveName.trim() ||
          targetingPreview
            ?.isStatusMove === true
        }
        onClick={handleCalculate}
      >
        Analyze KO Chance
      </button>

      {error && (
        <section className="calculation-error">
          <strong>
            KO analysis failed
          </strong>

          <p>{error}</p>
        </section>
      )}

      {analysis &&
        analysisBattleVersion ===
          battleVersion && (
        <section className="calculation-result">
          <h3>
            {analysis.attackerName}{' '}
            using{' '}
            {analysis.moveName} into{' '}
            {analysis.targetName}
          </h3>

          <p>
            Opponent displayed HP:{' '}
            <strong>
              {
                analysis
                  .targetDisplayedHpPercent
              }
              %
            </strong>
          </p>

          <p>
            {
              analysis
                .targetingSummary
            }
          </p>

          <div className="damage-summary">
            <div>
              <span className="result-label">
                Candidate-weighted KO if
                the move hits
              </span>

              <strong className="result-value">
                {formatProbabilityRange(
                  analysis
                    .weightedCombinedKoChanceIfHit,
                )}
              </strong>
            </div>

            <div>
              <span className="result-label">
                Overall KO including
                current accuracy
              </span>

              <strong className="result-value">
                {formatProbabilityRange(
                  analysis
                    .weightedOverallKoChanceIncludingAccuracy,
                )}
              </strong>
            </div>

            <div>
              <span className="result-label">
                Base accuracy
              </span>

              <strong className="result-value">
                {
                  analysis
                    .baseAccuracyPercent
                }
                %
              </strong>
            </div>

            <div>
              <span className="result-label">
                Accuracy after recorded
                stages
              </span>

              <strong className="result-value">
                {
                  analysis
                    .effectiveAccuracyPercent
                }
                %
              </strong>
            </div>
          </div>

          <p>
            {
              analysis
                .compatibleCandidateCount
            }{' '}
            of{' '}
            {
              analysis
                .totalCatalogCandidates
            }{' '}
            candidate sets are currently
            compatible.
          </p>

          <p>
            {
              analysis
                .confidenceMessage
            }
          </p>

          {analysis
            .candidateResults
            .length === 0 && (
            <section className="calculation-error">
              <strong>
                No compatible candidate
                can be analyzed.
              </strong>

              <p>
                Review the recorded
                reveals, Speed evidence,
                and damage observations.
              </p>
            </section>
          )}

          {analysis.candidateResults.map(
            (result) => (
              <section
                className="speed-result"
                key={
                  result
                    .candidate.id
                }
              >
                <h4>
                  #{result.rank}{' '}
                  {
                    result
                      .candidate.label
                  }
                </h4>

                <p>
                  Relative catalog
                  confidence:{' '}
                  <strong>
                    {
                      result
                        .confidencePercent
                        .toFixed(1)
                    }
                    %
                  </strong>
                </p>

                <p>
                  Candidate maximum HP:{' '}
                  <strong>
                    {
                      result
                        .defenderMaxHp
                    }
                  </strong>
                </p>

                <p>
                  Possible current HP:{' '}
                  <strong>
                    {formatHpRange(
                      result
                        .possibleCurrentHp,
                    )}
                  </strong>
                </p>

                <dl>
                  <div>
                    <dt>
                      Normal-hit KO
                    </dt>

                    <dd>
                      {formatProbabilityRange(
                        result
                          .normalKoChanceIfHit,
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      KO if a critical hit
                      occurs
                    </dt>

                    <dd>
                      {formatProbabilityRange(
                        result
                          .criticalKoChanceIfCritical,
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Critical-hit rate
                    </dt>

                    <dd>
                      {formatProbability(
                        result
                          .criticalHitChance,
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Combined KO if move
                      hits
                    </dt>

                    <dd>
                      {formatProbabilityRange(
                        result
                          .combinedKoChanceIfHit,
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Overall KO including
                      accuracy
                    </dt>

                    <dd>
                      {formatProbabilityRange(
                        result
                          .overallKoChanceIncludingAccuracy,
                      )}
                    </dd>
                  </div>
                </dl>

                <p className="field-help-text">
                  {
                    result
                      .criticalHitReason
                  }
                </p>
              </section>
            ),
          )}

          <p className="field-help-text">
            Accuracy items, accuracy
            abilities, Focus Energy,
            Helping Hand, and Friend Guard
            are not included yet. The
            configured player item is
            assumed to still be held.
          </p>
        </section>
      )}
    </section>
  );
}

export default CandidateKoPanel;