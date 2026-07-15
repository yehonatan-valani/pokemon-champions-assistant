import type {
  BattleState,
} from '../domain/battleState';

import type {
  OpponentSetCandidate,
} from '../domain/opponentCandidate';

import {
  resolveOpponentCandidateSets,
} from '../mechanics/resolveOpponentCandidateSets';

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
  const resolved =
    resolveOpponentCandidateSets(
      battle,
      candidates,
    );

  return (
    <section className="opponent-candidate-panel">
      <h2>Opponent candidate sets</h2>

      <p>
        Candidates are removed when they
        contradict revealed information,
        comparisons with your Pokémon, or
        comparisons with another opponent
        Pokémon.
      </p>

      <p className="candidate-warning">
        The current catalog contains development
        fixtures, not current metagame usage data.
      </p>

      {resolved.jointSpeedEvidenceCount >
        0 && (
        <p>
          <strong>
            Joint opponent Speed comparisons:
          </strong>{' '}
          {
            resolved.jointSpeedEvidenceCount
          }
        </p>
      )}

      <div className="candidate-species-grid">
        {resolved.slots.map((slot) => {
          const compatible =
            slot.evaluations.filter(
              (evaluation) =>
                evaluation.compatible,
            );

          const rejected =
            slot.evaluations.filter(
              (evaluation) =>
                !evaluation.compatible,
            );

          return (
            <article
              className="candidate-species-card"
              key={`${slot.pokemonIndex}-${slot.species}`}
            >
              <h3>
                Slot {slot.pokemonIndex + 1}:{' '}
                {slot.species}
              </h3>

              {slot.totalCandidates === 0 && (
                <p>
                  No candidate data has been
                  loaded for this species.
                </p>
              )}

              {slot.totalCandidates > 0 && (
                <>
                  <p>
                    <strong>
                      {compatible.length}
                    </strong>{' '}
                    of{' '}
                    <strong>
                      {slot.totalCandidates}
                    </strong>{' '}
                    candidates remain.
                  </p>

                  <div className="candidate-compatible-list">
                    {compatible.map(
                      ({
                        candidate,
                        usablePlayerSpeedEvidence,
                        ignoredPlayerSpeedEvidence,
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
                            {
                              candidate.build
                                .nature
                            }
                          </p>

                          <p>
                            <strong>
                              Ability:
                            </strong>{' '}
                            {
                              candidate.build
                                .ability
                            }
                          </p>

                          <p>
                            <strong>
                              Item:
                            </strong>{' '}
                            {
                              candidate.build
                                .item
                            }
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

                          {usablePlayerSpeedEvidence >
                            0 && (
                            <p>
                              <strong>
                                Known-player Speed
                                checks passed:
                              </strong>{' '}
                              {
                                usablePlayerSpeedEvidence
                              }
                            </p>
                          )}

                          {ignoredPlayerSpeedEvidence >
                            0 && (
                            <p>
                              <strong>
                                Speed checks ignored:
                              </strong>{' '}
                              {
                                ignoredPlayerSpeedEvidence
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
        })}
      </div>
    </section>
  );
}

export default OpponentCandidatePanel;