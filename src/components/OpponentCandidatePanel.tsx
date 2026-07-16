import type {
  BattleState,
} from '../domain/battleState';

import type {
  OpponentSetCandidate,
} from '../domain/opponentCandidate';

import {
  rankResolvedOpponentSlots,
} from '../mechanics/rankOpponentCandidates';

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

  const rankedSlots =
    rankResolvedOpponentSlots(
      resolved.slots,
    );

  return (
    <section className="opponent-candidate-panel">
      <h2>Opponent candidate sets</h2>

      <p>
        Candidates are removed when they
        contradict revealed information,
        observed Speed order, exact damage to
        your Pokémon, or opponent HP percentage
        changes. Compatible candidates are
        ranked using their source weights.
      </p>

      <p className="candidate-warning">
        The current catalog contains development
        fixtures rather than current metagame
        usage data. Unweighted fixtures receive
        equal confidence.
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
        {rankedSlots.map((ranking) => {
          const { slot } = ranking;

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
                      {ranking.compatibleCount}
                    </strong>{' '}
                    of{' '}
                    <strong>
                      {slot.totalCandidates}
                    </strong>{' '}
                    candidates remain.
                  </p>

                  <p
                    className={[
                      'candidate-confidence-message',
                      `candidate-confidence-${ranking.confidence}`,
                    ].join(' ')}
                  >
                    {
                      ranking.confidenceMessage
                    }
                  </p>

                  <div className="candidate-compatible-list">
                    {ranking.rankedCandidates.map(
                      ({
                        evaluation,
                        rank,
                        confidencePercent,
                      }) => {
                        const {
                        candidate,
                        usablePlayerSpeedEvidence,
                        ignoredPlayerSpeedEvidence,
                        usableExactDamageEvidence,
                        usablePercentDamageEvidence,
                        ignoredDamageEvidence,
                      } = evaluation;

                        return (
                          <section
                            className="candidate-compatible-card"
                            key={candidate.id}
                          >
                            <h4>
                              #{rank}{' '}
                              {candidate.label}
                            </h4>

                            <p>
                              <strong>
                                Relative catalog
                                confidence:
                              </strong>{' '}
                              {confidencePercent.toFixed(
                                1,
                              )}
                              %
                            </p>

                            <div
                              className="candidate-confidence-bar"
                              role="progressbar"
                              aria-label={`${candidate.label} relative confidence`}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-valuenow={
                                confidencePercent
                              }
                            >
                              <div
                                className="candidate-confidence-fill"
                                style={{
                                  width:
                                    `${confidencePercent}%`,
                                }}
                              />
                            </div>

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

                            {usableExactDamageEvidence > 0 && (
                              <p>
                                Exact damage checks passed:{' '}
                                {usableExactDamageEvidence}
                              </p>
                            )}

                            {usablePercentDamageEvidence > 0 && (
                              <p>
                                Opponent percentage checks passed:{' '}
                                {usablePercentDamageEvidence}
                              </p>
                            )}

                            {ignoredDamageEvidence > 0 && (
                              <p>
                                Damage observations waiting for
                                additional mechanics:{' '}
                                {ignoredDamageEvidence}
                              </p>
                            )}

                            <small>
                              {
                                candidate.sourceLabel
                              }
                            </small>
                          </section>
                        );
                      },
                    )}
                  </div>

                  {ranking.rejectedCount > 0 && (
                    <details className="candidate-rejected-details">
                      <summary>
                        Show rejected candidates (
                        {ranking.rejectedCount})
                      </summary>

                      {ranking.rejectedEvaluations.map(
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