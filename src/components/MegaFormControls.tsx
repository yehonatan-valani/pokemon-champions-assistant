import type {
  ChampionsCalculationForm,
} from '../domain/megaEvolution';

import type {
  ChampionsPokemonBuild,
} from '../domain/pokemonBuild';

import {
  getChampionsMegaCapability,
} from '../mechanics/resolveChampionsCalculationBuild';

interface MegaFormControlsProps {
  id: string;

  build:
    ChampionsPokemonBuild | null;

  value:
    ChampionsCalculationForm;

  onChange: (
    value:
      ChampionsCalculationForm,
  ) => void;
}

function MegaFormControls({
  id,
  build,
  value,
  onChange,
}: MegaFormControlsProps) {
  const capability =
    build
      ? getChampionsMegaCapability(
          build,
        )
      : null;

  return (
    <fieldset className="speed-result">
      <legend>
        Form for this action
      </legend>

      <label className="checkbox-field">
        <input
          type="radio"
          name={`${id}-form`}
          value="base"
          checked={
            value === 'base'
          }
          onChange={() => {
            onChange('base');
          }}
        />

        Stay in base form
      </label>

      <label className="checkbox-field">
        <input
          type="radio"
          name={`${id}-form`}
          value="mega"
          checked={
            value === 'mega'
          }
          disabled={!capability}
          onChange={() => {
            onChange('mega');
          }}
        />

        {capability
          ? `Mega Evolve this turn — ${capability.megaSpecies}`
          : 'Mega Evolve this turn'}
      </label>

      {capability ? (
        <p className="field-help-text">
          Held item:{' '}
          <strong>
            {capability.stone}
          </strong>
          . Mega ability:{' '}
          <strong>
            {
              capability.megaAbility
            }
          </strong>
          .
        </p>
      ) : (
        <p className="field-help-text">
          The selected Pokémon does
          not hold a compatible Mega
          Stone.
        </p>
      )}
    </fieldset>
  );
}

export default MegaFormControls;