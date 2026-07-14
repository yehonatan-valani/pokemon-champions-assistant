import type {
  BattleStatStageKey,
  MajorStatus,
  RuntimePokemonState,
} from '../domain/battleState';

interface PokemonRuntimeControlsProps {
  title: string;
  value: RuntimePokemonState;
  onHpChange: (nextHp: number) => void;
  onStatusChange: (
    nextStatus: MajorStatus,
  ) => void;
  onFaintedChange: (
    nextFainted: boolean,
  ) => void;
  onStatStageChange: (
    statKey: BattleStatStageKey,
    nextStage: number,
  ) => void;
}

const STATUS_OPTIONS: Array<{
  value: MajorStatus;
  label: string;
}> = [
  { value: '', label: 'No major status' },
  { value: 'Burn', label: 'Burn' },
  {
    value: 'Paralysis',
    label: 'Paralysis',
  },
  { value: 'Poison', label: 'Poison' },
  {
    value: 'Badly Poisoned',
    label: 'Badly Poisoned',
  },
  { value: 'Sleep', label: 'Sleep' },
  { value: 'Freeze', label: 'Freeze' },
];

const STAT_STAGE_OPTIONS = [
  -6,
  -5,
  -4,
  -3,
  -2,
  -1,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
];

const STAT_STAGE_FIELDS: Array<{
  key: BattleStatStageKey;
  label: string;
}> = [
  { key: 'atk', label: 'Attack' },
  { key: 'def', label: 'Defense' },
  {
    key: 'spa',
    label: 'Special Attack',
  },
  {
    key: 'spd',
    label: 'Special Defense',
  },
  { key: 'spe', label: 'Speed' },
  { key: 'accuracy', label: 'Accuracy' },
  { key: 'evasion', label: 'Evasion' },
];

function PokemonRuntimeControls({
  title,
  value,
  onHpChange,
  onStatusChange,
  onFaintedChange,
  onStatStageChange,
}: PokemonRuntimeControlsProps) {
  return (
    <section className="runtime-pokemon-card">
      <h3>{title}</h3>

      <div className="runtime-basic-grid">
        <label className="form-field">
          <span>Current HP percentage</span>

          <input
            type="number"
            min={0}
            max={100}
            value={value.currentHpPercent}
            onChange={(event) =>
              onHpChange(
                Number(event.target.value),
              )
            }
          />
        </label>

        <label className="form-field">
          <span>Major status</span>

          <select
            value={value.status}
            onChange={(event) =>
              onStatusChange(
                event.target
                  .value as MajorStatus,
              )
            }
          >
            {STATUS_OPTIONS.map((option) => (
              <option
                key={option.value || 'none'}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={value.fainted}
          onChange={(event) =>
            onFaintedChange(
              event.target.checked,
            )
          }
        />

        <span>Fainted</span>
      </label>

      <h4>Stat stages</h4>

      <div className="runtime-stat-grid">
        {STAT_STAGE_FIELDS.map(
          (statField) => (
            <label
              className="form-field"
              key={statField.key}
            >
              <span>{statField.label}</span>

              <select
                value={
                  value.statStages[
                    statField.key
                  ]
                }
                onChange={(event) =>
                  onStatStageChange(
                    statField.key,
                    Number(event.target.value),
                  )
                }
              >
                {STAT_STAGE_OPTIONS.map(
                  (stage) => (
                    <option
                      key={stage}
                      value={stage}
                    >
                      {stage > 0
                        ? `+${stage}`
                        : stage}
                    </option>
                  ),
                )}
              </select>
            </label>
          ),
        )}
      </div>
    </section>
  );
}

export default PokemonRuntimeControls;