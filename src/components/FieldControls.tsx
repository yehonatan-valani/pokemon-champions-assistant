import type {
  DamageFieldConditions,
  TerrainCondition,
  WeatherCondition,
} from '../domain/fieldConditions';

interface FieldControlsProps {
  value: DamageFieldConditions;
  onChange: (
    nextValue: DamageFieldConditions,
  ) => void;
}

const WEATHER_OPTIONS: Array<{
  value: WeatherCondition;
  label: string;
}> = [
  { value: '', label: 'No weather' },
  { value: 'Sun', label: 'Sun' },
  { value: 'Rain', label: 'Rain' },
  { value: 'Sand', label: 'Sand' },
  { value: 'Snow', label: 'Snow' },
  {
    value: 'Harsh Sunshine',
    label: 'Harsh Sunshine',
  },
  {
    value: 'Heavy Rain',
    label: 'Heavy Rain',
  },
  {
    value: 'Strong Winds',
    label: 'Strong Winds',
  },
];

const TERRAIN_OPTIONS: Array<{
  value: TerrainCondition;
  label: string;
}> = [
  { value: '', label: 'No terrain' },
  { value: 'Electric', label: 'Electric Terrain' },
  { value: 'Grassy', label: 'Grassy Terrain' },
  { value: 'Psychic', label: 'Psychic Terrain' },
  { value: 'Misty', label: 'Misty Terrain' },
];

function FieldControls({
  value,
  onChange,
}: FieldControlsProps) {
  return (
    <section className="field-controls">
      <h2>Damage field conditions</h2>

      <div className="field-controls-grid">
        <label className="form-field">
          <span>Weather</span>

          <select
            value={value.weather}
            onChange={(event) =>
              onChange({
                ...value,
                weather: event.target
                  .value as WeatherCondition,
              })
            }
          >
            {WEATHER_OPTIONS.map((option) => (
              <option
                key={option.value || 'none'}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Terrain</span>

          <select
            value={value.terrain}
            onChange={(event) =>
              onChange({
                ...value,
                terrain: event.target
                  .value as TerrainCondition,
              })
            }
          >
            {TERRAIN_OPTIONS.map((option) => (
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

      <div className="field-checkbox-grid">
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={value.attackerHelpingHand}
            onChange={(event) =>
              onChange({
                ...value,
                attackerHelpingHand:
                  event.target.checked,
              })
            }
          />

          <span>Attacker has Helping Hand</span>
        </label>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={value.defenderReflect}
            onChange={(event) =>
              onChange({
                ...value,
                defenderReflect:
                  event.target.checked,
              })
            }
          />

          <span>Defender has Reflect</span>
        </label>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={value.defenderLightScreen}
            onChange={(event) =>
              onChange({
                ...value,
                defenderLightScreen:
                  event.target.checked,
              })
            }
          />

          <span>Defender has Light Screen</span>
        </label>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={value.defenderAuroraVeil}
            onChange={(event) =>
              onChange({
                ...value,
                defenderAuroraVeil:
                  event.target.checked,
              })
            }
          />

          <span>Defender has Aurora Veil</span>
        </label>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={value.defenderFriendGuard}
            onChange={(event) =>
              onChange({
                ...value,
                defenderFriendGuard:
                  event.target.checked,
              })
            }
          />

          <span>Defender has Friend Guard support</span>
        </label>
      </div>
    </section>
  );
}

export default FieldControls;