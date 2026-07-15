import type {
  BattleActionRecord,
} from '../domain/battleAction';

import {
  deriveSpeedEvidence,
} from '../mechanics/deriveSpeedEvidence';

interface SpeedEvidencePanelProps {
  actionHistory: BattleActionRecord[];
}

function SpeedEvidencePanel({
  actionHistory,
}: SpeedEvidencePanelProps) {
  const evidence =
    deriveSpeedEvidence(actionHistory);

  return (
    <section className="speed-evidence-panel">
      <h2>Observed Speed evidence</h2>

      <p>
        Evidence is created only from
        same-priority moves recorded under
        compatible battlefield conditions.
      </p>

      {evidence.length === 0 && (
        <p>
          No usable Speed comparisons have
          been recorded yet.
        </p>
      )}

      <ol className="speed-evidence-list">
        {evidence.map((entry) => {
          const symbol =
            entry.relation ===
            'greater-than-or-equal'
              ? '≥'
              : '≤';

          return (
            <li key={entry.id}>
              <strong>
                Turn {entry.turnNumber}:
              </strong>{' '}
              {entry.earlierPokemonName}{' '}
              effective Speed {symbol}{' '}
              {entry.laterPokemonName}{' '}
              effective Speed
              <small>
                {' '}
                — move {entry.earlierMoveOrder}{' '}
                ({entry.earlierMoveName}) before
                move {entry.laterMoveOrder}{' '}
                ({entry.laterMoveName}), priority{' '}
                {entry.priority}
              </small>
            </li>
          );
        })}
      </ol>

      <p className="field-help-text">
        The comparison uses ≥ or ≤ because a
        Speed tie can produce either action
        order.
      </p>
    </section>
  );
}

export default SpeedEvidencePanel;