import { useState } from 'react';

import { toID } from '@smogon/calc';

import AutocompleteInput from '../../components/AutocompleteInput';

import {
  CURRENT_REGULATION,
  REGULATION_POKEMON_NAMES,
  isSpeciesLegalInCurrentRegulation,
} from '../../data/currentRegulation';

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

function getPreviewProblems(
  opponentTeam: OpponentTeamPreview,
): string[] {
  const problems: string[] = [];

  const seenSpeciesIds =
    new Set<string>();

  opponentTeam.species.forEach(
    (speciesName, slotIndex) => {
      const cleanedSpecies =
        speciesName.trim();

      /*
       * Empty slots are allowed when saving
       * an incomplete opponent preview.
       */
      if (!cleanedSpecies) {
        return;
      }

      if (
        !isSpeciesLegalInCurrentRegulation(
          cleanedSpecies,
        )
      ) {
        problems.push(
          `Slot ${slotIndex + 1}: ` +
            `${cleanedSpecies} is not legal in ` +
            `${CURRENT_REGULATION.formatName}.`,
        );

        return;
      }

      const speciesId =
        toID(cleanedSpecies);

      if (
        seenSpeciesIds.has(speciesId)
      ) {
        problems.push(
          `Slot ${slotIndex + 1}: ` +
            `${cleanedSpecies} appears more than once.`,
        );
      } else {
        seenSpeciesIds.add(
          speciesId,
        );
      }
    },
  );

  return problems;
}

function BattleSetupPage() {
  const [
    opponentTeam,
    setOpponentTeam,
  ] = useState<OpponentTeamPreview>(
    () =>
      loadOpponentTeam() ??
      createEmptyOpponentTeamPreview(),
  );

  const [
    statusMessage,
    setStatusMessage,
  ] = useState('');

  const speciesCount =
    getOpponentSpeciesCount(
      opponentTeam,
    );

  const previewProblems =
    getPreviewProblems(
      opponentTeam,
    );

  function updateSpecies(
    slotIndex: number,
    speciesName: string,
  ) {
    setOpponentTeam(
      (currentTeam) => ({
        ...currentTeam,

        species:
          currentTeam.species.map(
            (
              currentSpecies,
              index,
            ) =>
              index === slotIndex
                ? speciesName
                : currentSpecies,
          ),
      }),
    );

    setStatusMessage(
      'You have unsaved changes.',
    );
  }

  function handleSave() {
    const currentProblems =
      getPreviewProblems(
        opponentTeam,
      );

    if (
      currentProblems.length > 0
    ) {
      const visibleProblems =
        currentProblems
          .slice(0, 3)
          .join(' ');

      const remainingProblemCount =
        currentProblems.length - 3;

      setStatusMessage(
        [
          'Opponent preview was not saved.',
          visibleProblems,

          remainingProblemCount > 0
            ? `${remainingProblemCount} additional problem${
                remainingProblemCount === 1
                  ? ''
                  : 's'
              } must be corrected.`
            : '',
        ]
          .filter(Boolean)
          .join(' '),
      );

      return;
    }

    saveOpponentTeam(
      opponentTeam,
    );

    setStatusMessage(
      isOpponentTeamPreviewComplete(
        opponentTeam,
      )
        ? 'Complete regulation-legal opponent preview saved.'
        : [
            'Regulation-legal opponent preview draft saved.',
            `${speciesCount} of 6 species are selected.`,
          ].join(' '),
    );
  }

  function handleLoad() {
    const savedTeam =
      loadOpponentTeam();

    if (!savedTeam) {
      setStatusMessage(
        'No saved opponent preview was found.',
      );

      return;
    }

    setOpponentTeam(
      savedTeam,
    );

    const loadedProblems =
      getPreviewProblems(
        savedTeam,
      );

    if (
      loadedProblems.length > 0
    ) {
      setStatusMessage(
        [
          'Saved opponent preview loaded.',
          'It contains species that do not match the current regulation.',
          'Correct the displayed problems before saving again.',
        ].join(' '),
      );

      return;
    }

    setStatusMessage(
      'Saved regulation-legal opponent preview loaded.',
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
          Enter the opponent’s six Pokémon
          from team preview. Their builds
          remain unknown.
        </p>

        <p className="field-help-text">
          Current legality snapshot:{' '}
          <strong>
            {
              CURRENT_REGULATION
                .formatName
            }
          </strong>
        </p>
      </header>

      <section className="opponent-preview-card">
        <label className="form-field">
          <span>
            Opponent name or label
          </span>

          <input
            type="text"
            value={opponentTeam.name}
            placeholder="Round 1 opponent"
            onChange={(event) => {
              setOpponentTeam(
                (currentTeam) => ({
                  ...currentTeam,

                  name:
                    event.target.value,
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
            (
              speciesName,
              slotIndex,
            ) => (
              <AutocompleteInput
                key={slotIndex}
                id={`opponent-species-${slotIndex}`}
                label={`Opponent slot ${slotIndex + 1}`}
                value={speciesName}
                options={
                  REGULATION_POKEMON_NAMES
                }
                placeholder="Search legal Pokémon"
                required
                onChange={(
                  nextSpecies,
                ) =>
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
          Selected species:{' '}
          <strong>
            {speciesCount} / 6
          </strong>
        </p>

        <p>
          Regulation problems:{' '}
          <strong>
            {previewProblems.length}
          </strong>
        </p>

        {previewProblems.length >
          0 && (
          <section className="build-regulation-status build-regulation-invalid">
            <strong>
              Opponent preview problems
            </strong>

            <ul>
              {previewProblems.map(
                (
                  problem,
                  problemIndex,
                ) => (
                  <li
                    key={problemIndex}
                  >
                    {problem}
                  </li>
                ),
              )}
            </ul>
          </section>
        )}

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