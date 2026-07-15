import type {
  BattleState,
} from '../domain/battleState';

import type {
  OpponentSetCandidate,
} from '../domain/opponentCandidate';

import {
  evaluateOpponentCandidate,
  getCandidatesForSpecies,
} from '../mechanics/filterOpponentCandidates';

import {
  deriveSpeedEvidence,
} from '../mechanics/deriveSpeedEvidence';

import {
  evaluateCandidateSpeedEvidence,
} from '../mechanics/evaluateCandidateSpeedEvidence';

interface OpponentCandidatePanelProps {
  battle: BattleState;
  candidates: OpponentSetCandidate[];
}

function formatStatPoints(
  candidate: OpponentSetCandidate,
): string {
  const statPoints =
    candidate.build.statPoints;

  return [
    `HP ${statPoints.hp}`,
    `Atk ${statPoints.atk}`,
    `Def ${statPoints.def}`,
    `SpA ${statPoints.spa}`,
    `SpD ${statPoints.spd}`,
    `Spe ${statPoints.spe}`,
  ].join(', ');
}

function OpponentCandidatePanel({
  battle,
  candidates,
}: OpponentCandidatePanelProps) {
  const speedEvidence =
    deriveSpeedEvidence(
      battle.actionHistory,
    );

  return (
    <section className="opponent-candidate-panel">
      <h2>Opponent candidate sets</h2>

      <p>
        Candidates are removed when they
        contradict revealed information or
        usable Speed evidence.
      </p>

      <p className="candidate-warning">
        The current catalog contains development
        fixtures, not current metagame usage data.
      </p>

      <div className="candidate-species-grid">
        {battle.opponentPokemon.map(
          (observation, pokemonIndex) => {
            const speciesCandidates =
              getCandidatesForSpecies(
                candidates,
                observation.species,
              );

            const evaluations =
              speciesCandidates.map(
                (candidate) => {
                  const revealEvaluation =
                    evaluateOpponentCandidate(
                      candidate,
                      observation,
                    );

                  const speedEvaluation =
                    evaluateCandidateSpeedEvidence(
                      battle,
                      candidate,
                      pokemonIndex,
                      speedEvidence,
                    );

                  return {
                    candidate,

                    compatible:
                      revealEvaluation.compatible &&
                      speedEvaluation.compatible,

                    rejections: [
                      ...revealEvaluation.rejections,
                      ...speedEvaluation.rejections,
                    ],

                    usableSpeedEvidence:
                      speedEvaluation
                        .usableEvidenceCount,

                    ignoredSpeedEvidence:
                      speedEvaluation
                        .ignoredEvidenceCount,
                  };
                },
              );

            const compatible =
              evaluations.filter(
                (evaluation) =>
                  evaluation.compatible,
              );

            const rejected =
              evaluations.filter(
                (evaluation) =>
                  !evaluation.compatible,
              );

            return (
              <article
                className="candidate-species-card"
                key={`${pokemonIndex}-${observation.species}`}
              >
                <h3>
                  Slot {pokemonIndex + 1}:{' '}
                  {observation.species}
                </h3>

                {speciesCandidates.length ===
                  0 && (
                  <p>
                    No candidate data has been
                    loaded for this species.
                  </p>
                )}

                {speciesCandidates.length >
                  0 && (
                  <>
                    <p>
                      <strong>
                        {compatible.length}
                      </strong>{' '}
                      of{' '}
                      <strong>
                        {
                          speciesCandidates.length
                        }
                      </strong>{' '}
                      candidates remain.
                    </p>

                    <div className="candidate-compatible-list">
                      {compatible.map(
                        ({
                          candidate,
                          usableSpeedEvidence,
                          ignoredSpeedEvidence,
                        }) => (
                          <section
                            className="candidate-compatible-card"
                            key={candidate.id}
                          >
                            <h4>
                              {candidate.label}
                            </h4>

                            <p>
                              <strong>
                                Nature:
                              </strong>{' '}
                              {candidate.build.nature}
                            </p>

                            <p>
                              <strong>
                                Ability:
                              </strong>{' '}
                              {candidate.build.ability}
                            </p>

                            <p>
                              <strong>
                                Item:
                              </strong>{' '}
                              {candidate.build.item}
                            </p>

                            <p>
                              <strong>
                                Moves:
                              </strong>{' '}
                              {candidate.build.moves.join(
                                ', ',
                              )}
                            </p>

                            <p>
                              <strong>
                                Stat Points:
                              </strong>{' '}
                              {formatStatPoints(
                                candidate,
                              )}
                            </p>

                            {usableSpeedEvidence >
                              0 && (
                              <p>
                                <strong>
                                  Speed checks passed:
                                </strong>{' '}
                                {
                                  usableSpeedEvidence
                                }
                              </p>
                            )}

                            {ignoredSpeedEvidence >
                              0 && (
                              <p>
                                <strong>
                                  Speed checks ignored:
                                </strong>{' '}
                                {
                                  ignoredSpeedEvidence
                                }
                              </p>
                            )}

                            <small>
                              {
                                candidate.sourceLabel
                              }
                            </small>
                          </section>
                        ),
                      )}
                    </div>

                    {rejected.length > 0 && (
                      <details className="candidate-rejected-details">
                        <summary>
                          Show rejected candidates (
                          {rejected.length})
                        </summary>

                        {rejected.map(
                          ({
                            candidate,
                            rejections,
                          }) => (
                            <section
                              className="candidate-rejected-card"
                              key={candidate.id}
                            >
                              <strong>
                                {candidate.label}
                              </strong>

                              <ul>
                                {rejections.map(
                                  (
                                    rejection,
                                    rejectionIndex,
                                  ) => (
                                    <li
                                      key={`${rejection.code}-${rejectionIndex}`}
                                    >
                                      {
                                        rejection.message
                                      }
                                    </li>
                                  ),
                                )}
                              </ul>
                            </section>
                          ),
                        )}
                      </details>
                    )}
                  </>
                )}
              </article>
            );
          },
        )}
      </div>
    </section>
  );
}

export default OpponentCandidatePanel;