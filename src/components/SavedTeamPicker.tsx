import { useState } from 'react';

import {
  clonePokemonBuild,
  isPokemonBuildComplete,
  type ChampionsPokemonBuild,
} from '../domain/pokemonBuild';

import type {
  ChampionsTeam,
} from '../domain/team';

import {
  loadTeam,
} from '../storage/teamStorage';

interface SavedTeamPickerProps {
  title: string;
  onSelect: (
    build: ChampionsPokemonBuild,
  ) => void;
}

function SavedTeamPicker({
  title,
  onSelect,
}: SavedTeamPickerProps) {
  const [savedTeam, setSavedTeam] =
    useState<ChampionsTeam | null>(() =>
      loadTeam(),
    );

  const [selectedIndex, setSelectedIndex] =
    useState('');

  function refreshSavedTeam() {
    setSavedTeam(loadTeam());
    setSelectedIndex('');
  }

  function handleSelection(
    nextIndex: string,
  ) {
    setSelectedIndex(nextIndex);

    if (!savedTeam || nextIndex === '') {
      return;
    }

    const memberIndex = Number(nextIndex);

    const selectedMember =
      savedTeam.members[memberIndex];

    if (
      !selectedMember ||
      !isPokemonBuildComplete(selectedMember)
    ) {
      return;
    }

    onSelect(
      clonePokemonBuild(selectedMember),
    );
  }

  const completeMembers =
    savedTeam?.members
      .map((member, index) => ({
        member,
        index,
      }))
      .filter(({ member }) =>
        isPokemonBuildComplete(member),
      ) ?? [];

  return (
    <section className="saved-team-picker">
      <h3>{title}</h3>

      {!savedTeam && (
        <p>
          No saved team was found. Create one on the
          My Team page first.
        </p>
      )}

      {savedTeam &&
        completeMembers.length === 0 && (
          <p>
            The saved team does not contain any complete
            Pokémon builds.
          </p>
        )}

      {completeMembers.length > 0 && (
        <label className="form-field">
          <span>
            Load from {savedTeam?.name}
          </span>

          <select
            value={selectedIndex}
            onChange={(event) =>
              handleSelection(event.target.value)
            }
          >
            <option value="">
              Choose a Pokémon
            </option>

            {completeMembers.map(
              ({ member, index }) => (
                <option
                  key={index}
                  value={index}
                >
                  Slot {index + 1}: {member.species}
                </option>
              ),
            )}
          </select>
        </label>
      )}

      <button
        className="secondary-button"
        type="button"
        onClick={refreshSavedTeam}
      >
        Refresh Saved Team
      </button>
    </section>
  );
}

export default SavedTeamPicker;