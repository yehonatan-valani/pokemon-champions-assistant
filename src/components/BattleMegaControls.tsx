import {
  useState,
} from 'react';

import type {
  BattleMegaEvolutionState,
  ChampionsMegaCapability,
} from '../domain/megaEvolution';

interface BattleMegaControlsProps {
  idPrefix: string;

  sideLabel: string;

  baseSpecies: string;

  state:
    BattleMegaEvolutionState;

  sideMegaUsed: boolean;

  capabilities:
    ChampionsMegaCapability[];

  onMegaEvolve: (
    capability:
      ChampionsMegaCapability,
  ) => void;
}

function getCapabilityKey(
  capability:
    ChampionsMegaCapability,
): string {
  return (
    `${capability.stone}::` +
    capability.megaSpecies
  );
}

function BattleMegaControls({
  idPrefix,
  sideLabel,
  baseSpecies,
  state,
  sideMegaUsed,
  capabilities,
  onMegaEvolve,
}: BattleMegaControlsProps) {
  const [
    selectedKey,
    setSelectedKey,
  ] = useState('');

  if (
    state.megaState ===
    'mega'
  ) {
    return (
      <section className="battle-mega-controls">
        <h4>Mega Evolution</h4>

        <p>
          <strong>
            Current form:
          </strong>{' '}
          {state.megaSpecies ||
            baseSpecies}
        </p>

        <p>
          <strong>
            Current ability:
          </strong>{' '}
          {state.megaAbility ||
            'Unknown'}
        </p>

        <p>
          <strong>
            Mega Stone:
          </strong>{' '}
          {state.megaStone ||
            'Unknown'}
        </p>

        <p>
          <strong>
            Mega Evolved on:
          </strong>{' '}
          Turn{' '}
          {state.megaEvolvedTurn ??
            'unknown'}
        </p>

        <p className="field-help-text">
          Mega Evolution is permanent
          for this battle. Returning to
          the base form is not
          available.
        </p>
      </section>
    );
  }

  const selectedCapability =
    capabilities.find(
      (capability) =>
        getCapabilityKey(
          capability,
        ) === selectedKey,
    ) ??
    capabilities[0] ??
    null;

  const selectedValue =
    selectedCapability
      ? getCapabilityKey(
          selectedCapability,
        )
      : '';

  return (
    <section className="battle-mega-controls">
      <h4>Mega Evolution</h4>

      <p>
        <strong>
          Current form:
        </strong>{' '}
        {baseSpecies}
      </p>

      {sideMegaUsed ? (
        <p className="field-help-text">
          {sideLabel} has already used
          Mega Evolution. This Pokémon
          must remain in its current
          base form.
        </p>
      ) : capabilities.length ===
        0 ? (
        <p className="field-help-text">
          No compatible Mega Evolution
          is currently available for
          this Pokémon.
        </p>
      ) : (
        <>
          <label className="form-field">
            <span>
              Mega form to record
            </span>

            <select
              id={`${idPrefix}-mega-form`}
              value={selectedValue}
              onChange={(event) => {
                setSelectedKey(
                  event.target.value,
                );
              }}
            >
              {capabilities.map(
                (capability) => (
                  <option
                    key={
                      getCapabilityKey(
                        capability,
                      )
                    }
                    value={
                      getCapabilityKey(
                        capability,
                      )
                    }
                  >
                    {
                      capability.megaSpecies
                    }{' '}
                    —{' '}
                    {
                      capability.megaAbility
                    }{' '}
                    —{' '}
                    {
                      capability.stone
                    }
                  </option>
                ),
              )}
            </select>
          </label>

          <button
            className="primary-button"
            type="button"
            disabled={
              !selectedCapability
            }
            onClick={() => {
              if (
                !selectedCapability
              ) {
                return;
              }

              const confirmed =
                window.confirm(
                  `Record ${baseSpecies} Mega Evolving into ` +
                    `${selectedCapability.megaSpecies}? ` +
                    'This cannot be undone during this battle.',
                );

              if (!confirmed) {
                return;
              }

              onMegaEvolve(
                selectedCapability,
              );
            }}
          >
            Record Mega Evolution Now
          </button>

          <p className="field-help-text">
            Base form remains active
            until this button is used.
            Once recorded, this Pokémon
            remains Mega Evolved and
            the rest of the side cannot
            Mega Evolve.
          </p>
        </>
      )}
    </section>
  );
}

export default BattleMegaControls;