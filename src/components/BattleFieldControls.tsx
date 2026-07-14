import type {
  BattleFieldState,
  TimedBattleFieldKey,
} from '../domain/battleState';

import type {
  TerrainCondition,
  WeatherCondition,
} from '../domain/fieldConditions';

interface BattleFieldControlsProps {
  value: BattleFieldState;

  onWeatherChange: (
    weather: WeatherCondition,
  ) => void;

  onTerrainChange: (
    terrain: TerrainCondition,
  ) => void;

  onTurnsChange: (
    fieldKey: TimedBattleFieldKey,
    turns: number,
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
  {
    value: 'Electric',
    label: 'Electric Terrain',
  },
  {
    value: 'Grassy',
    label: 'Grassy Terrain',
  },
  {
    value: 'Psychic',
    label: 'Psychic Terrain',
  },
  {
    value: 'Misty',
    label: 'Misty Terrain',
  },
];

const TURN_FIELDS: Array<{
  key: TimedBattleFieldKey;
  label: string;
}> = [
  {
    key: 'trickRoomTurns',
    label: 'Trick Room',
  },
  {
    key: 'playerTailwindTurns',
    label: 'My Tailwind',
  },
  {
    key: 'opponentTailwindTurns',
    label: 'Opponent Tailwind',
  },
  {
    key: 'playerReflectTurns',
    label: 'My Reflect',
  },
  {
    key: 'opponentReflectTurns',
    label: 'Opponent Reflect',
  },
  {
    key: 'playerLightScreenTurns',
    label: 'My Light Screen',
  },
  {
    key: 'opponentLightScreenTurns',
    label: 'Opponent Light Screen',
  },
  {
    key: 'playerAuroraVeilTurns',
    label: 'My Aurora Veil',
  },
  {
    key: 'opponentAuroraVeilTurns',
    label: 'Opponent Aurora Veil',
  },
];

function BattleFieldControls({
  value,
  onWeatherChange,
  onTerrainChange,
  onTurnsChange,
}: BattleFieldControlsProps) {
  return (
    <section className="battle-field-controls">
      <h2>Battlefield</h2>

      <div className="battle-field-main-grid">
        <label className="form-field">
          <span>Weather</span>

          <select
            value={value.weather}
            onChange={(event) =>
              onWeatherChange(
                event.target
                  .value as WeatherCondition,
              )
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
              onTerrainChange(
                event.target
                  .value as TerrainCondition,
              )
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

      <div className="battle-turn-fields-grid">
        {TURN_FIELDS.map((field) => (
          <label
            className="form-field"
            key={field.key}
          >
            <span>{field.label} turns</span>

            <input
              type="number"
              min={0}
              max={8}
              value={value[field.key]}
              onChange={(event) =>
                onTurnsChange(
                  field.key,
                  Number(event.target.value),
                )
              }
            />
          </label>
        ))}
      </div>

      <p className="field-help-text">
        Use 0 when an effect is inactive.
      </p>
    </section>
  );
}

export default BattleFieldControls;