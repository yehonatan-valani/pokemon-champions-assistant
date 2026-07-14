import type {
  SpeedConditions,
  SpeedStage,
} from '../domain/speed';

interface SpeedControlsProps {
  title: string;
  value: SpeedConditions;
  onChange: (nextValue: SpeedConditions) => void;
}

const SPEED_STAGES: SpeedStage[] = [
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

function SpeedControls({
  title,
  value,
  onChange,
}: SpeedControlsProps) {
  return (
    <section className="speed-controls">
      <h3>{title} Speed conditions</h3>

      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={value.tailwind}
          onChange={(event) =>
            onChange({
              ...value,
              tailwind: event.target.checked,
            })
          }
        />

        <span>Tailwind active</span>
      </label>

      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={value.paralyzed}
          onChange={(event) =>
            onChange({
              ...value,
              paralyzed: event.target.checked,
            })
          }
        />

        <span>Paralyzed</span>
      </label>

      <label className="form-field">
        <span>Speed stage</span>

        <select
          value={value.speedStage}
          onChange={(event) =>
            onChange({
              ...value,
              speedStage: Number(
                event.target.value,
              ) as SpeedStage,
            })
          }
        >
          {SPEED_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {stage > 0 ? `+${stage}` : stage}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}

export default SpeedControls;