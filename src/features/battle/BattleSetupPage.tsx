import { useState } from 'react';

import AutocompleteInput from '../../components/AutocompleteInput';

import { POKEMON_NAMES } from '../../data/championsData';

import {
  createEmptyOpponentTeamPreview,
  getOpponentSpeciesCount,
  isOpponentTeamPreviewComplete,
  type OpponentTeamPreview,
} from '../../domain/opponentTeam';

import {
  clearOpponentTeam,
  loadOpponentTeam,
  saveOpponentTeam,
} from '../../storage/opponentTeamStorage';

function BattleSetupPage() {
  const [opponentTeam, setOpponentTeam] =
    useState<OpponentTeamPreview>(() =>
      loadOpponentTeam() ??
      createEmptyOpponentTeamPreview(),
    );

  const [statusMessage, setStatusMessage] =
    useState('');

  const speciesCount =
    getOpponentSpeciesCount(opponentTeam);

  function updateSpecies(
    slotIndex: number,
    speciesName: string,
  ) {
    setOpponentTeam((currentTeam) => ({
      ...currentTeam,
      species: currentTeam.species.map(
        (currentSpecies, index) =>
          index === slotIndex
            ? speciesName
            : currentSpecies,
      ),
    }));

    setStatusMessage(
      'You have unsaved changes.',
    );
  }

  function handleSave() {
    saveOpponentTeam(opponentTeam);

    setStatusMessage(
      isOpponentTeamPreviewComplete(
        opponentTeam,
      )
        ? 'Complete opponent preview saved.'
        : `Opponent preview saved. ${speciesCount} of 6 species are valid.`,
    );
  }

  function handleLoad() {
    const savedTeam = loadOpponentTeam();

    if (!savedTeam) {
      setStatusMessage(
        'No saved opponent preview was found.',
      );

      return;
    }

    setOpponentTeam(savedTeam);
    setStatusMessage(
      'Saved opponent preview loaded.',
    );
  }

  function handleClear() {
    clearOpponentTeam();

    setOpponentTeam(
      createEmptyOpponentTeamPreview(),
    );

    setStatusMessage(
      'Opponent preview cleared.',
    );
  }

  return (
    <main className="battle-setup-page">
      <header className="page-header">
        <p className="eyebrow">
          Pokémon Champions Assistant
        </p>

        <h1>Battle Setup</h1>

        <p>
          Enter the opponent’s six Pokémon from team
          preview. Their builds remain unknown.
        </p>
      </header>

      <section className="opponent-preview-card">
        <label className="form-field">
          <span>Opponent name or label</span>

          <input
            type="text"
            value={opponentTeam.name}
            placeholder="Round 1 opponent"
            onChange={(event) => {
              setOpponentTeam(
                (currentTeam) => ({
                  ...currentTeam,
                  name: event.target.value,
                }),
              );

              setStatusMessage(
                'You have unsaved changes.',
              );
            }}
          />
        </label>

        <div className="opponent-species-grid">
          {opponentTeam.species.map(
            (speciesName, slotIndex) => (
              <AutocompleteInput
                key={slotIndex}
                id={`opponent-species-${slotIndex}`}
                label={`Opponent slot ${slotIndex + 1}`}
                value={speciesName}
                options={POKEMON_NAMES}
                placeholder="Search for a Pokémon"
                required
                onChange={(nextSpecies) =>
                  updateSpecies(
                    slotIndex,
                    nextSpecies,
                  )
                }
              />
            ),
          )}
        </div>

        <p>
          Valid species:{' '}
          <strong>{speciesCount} / 6</strong>
        </p>

        <div className="team-actions">
          <button
            className="primary-button"
            type="button"
            onClick={handleSave}
          >
            Save Opponent Preview
          </button>

          <button
            className="secondary-button"
            type="button"
            onClick={handleLoad}
          >
            Load Saved Preview
          </button>

          <button
            className="secondary-button"
            type="button"
            onClick={handleClear}
          >
            Clear Preview
          </button>
        </div>

        {statusMessage && (
          <p className="team-status">
            {statusMessage}
          </p>
        )}
      </section>
    </main>
  );
}

export default BattleSetupPage;