import {
  EMPTY_STAT_POINTS,
  MAX_SP_PER_STAT,
  MAX_TOTAL_SP,
  STAT_KEYS,
  STAT_LABELS,
  clampStatPoint,
  getTotalStatPoints,
  type StatKey,
  type StatPoints,
} from '../domain/statPoints';

interface StatPointEditorProps {
  value: StatPoints;
  onChange: (nextValue: StatPoints) => void;
}

function StatPointEditor({
  value,
  onChange,
}: StatPointEditorProps) {
  const total = getTotalStatPoints(value);
  const pointsRemaining = MAX_TOTAL_SP - total;
  const isOverLimit = total > MAX_TOTAL_SP;

  function updateStat(stat: StatKey, newValue: number) {
    onChange({
      ...value,
      [stat]: clampStatPoint(newValue),
    });
  }

  function resetStats() {
    onChange({
      ...EMPTY_STAT_POINTS,
    });
  }

  return (
    <section className="stat-points-section">
      <div className="section-heading">
        <div>
          <h2>Stat Points</h2>
          <p>
            Maximum {MAX_SP_PER_STAT} per stat and{' '}
            {MAX_TOTAL_SP} in total.
          </p>
        </div>

        <button
          className="secondary-button"
          type="button"
          onClick={resetStats}
        >
          Reset
        </button>
      </div>

      <div className="stat-list">
        {STAT_KEYS.map((stat) => (
          <label className="stat-row" key={stat}>
            <span>{STAT_LABELS[stat]}</span>

            <input
              type="number"
              min={0}
              max={MAX_SP_PER_STAT}
              value={value[stat]}
              onChange={(event) =>
                updateStat(stat, Number(event.target.value))
              }
            />
          </label>
        ))}
      </div>

      <div
        className={
          isOverLimit
            ? 'total-panel total-panel-error'
            : 'total-panel total-panel-valid'
        }
      >
        <strong>
          Total SP: {total} / {MAX_TOTAL_SP}
        </strong>

        <span>
          {isOverLimit
            ? `${Math.abs(pointsRemaining)} points over the limit`
            : `${pointsRemaining} points remaining`}
        </span>
      </div>
    </section>
  );
}

export default StatPointEditor;