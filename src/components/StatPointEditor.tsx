import { useState } from 'react';

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

function StatPointEditor() {
  const [stats, setStats] = useState<StatPoints>({
    ...EMPTY_STAT_POINTS,
  });

  const total = getTotalStatPoints(stats);
  const pointsRemaining = MAX_TOTAL_SP - total;
  const isOverLimit = total > MAX_TOTAL_SP;

  function updateStat(stat: StatKey, value: number) {
    const safeValue = clampStatPoint(value);

    setStats((currentStats) => ({
      ...currentStats,
      [stat]: safeValue,
    }));
  }

  function resetStats() {
    setStats({
      ...EMPTY_STAT_POINTS,
    });
  }

  return (
    <section className="stat-editor">
      <header className="editor-header">
        <p className="eyebrow">
          Pokémon Champions Assistant
        </p>

        <h1>Stat Point Editor</h1>

        <p>
          Allocate up to {MAX_TOTAL_SP} Stat Points. Each
          individual stat can receive up to {MAX_SP_PER_STAT}.
        </p>
      </header>

      <div className="stat-list">
        {STAT_KEYS.map((stat) => (
          <label className="stat-row" key={stat}>
            <span>{STAT_LABELS[stat]}</span>

            <input
              type="number"
              min={0}
              max={MAX_SP_PER_STAT}
              value={stats[stat]}
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

      <button type="button" onClick={resetStats}>
        Reset Stat Points
      </button>
    </section>
  );
}

export default StatPointEditor;