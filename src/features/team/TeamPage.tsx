import { useState } from 'react';

import PokemonBuildEditor from '../../components/PokemonBuildEditor';

import type {
  ChampionsPokemonBuild,
} from '../../domain/pokemonBuild';

import {
  createEmptyTeam,
  getCompleteMemberCount,
  isTeamComplete,
  type ChampionsTeam,
} from '../../domain/team';

import {
  clearSavedTeam,
  loadTeam,
  saveTeam,
} from '../../storage/teamStorage';

function TeamPage() {
  const [team, setTeam] =
    useState<ChampionsTeam>(createEmptyTeam);

  const [statusMessage, setStatusMessage] =
    useState('');

  const completeMemberCount =
    getCompleteMemberCount(team);

  function updateTeamMember(
    memberIndex: number,
    nextBuild: ChampionsPokemonBuild,
  ) {
    setTeam((currentTeam) => ({
      ...currentTeam,
      members: currentTeam.members.map(
        (member, index) =>
          index === memberIndex
            ? nextBuild
            : member,
      ),
    }));

    setStatusMessage('You have unsaved changes.');
  }

  function handleSaveTeam() {
    saveTeam(team);

    setStatusMessage(
      isTeamComplete(team)
        ? 'Complete team saved.'
        : `Team draft saved. ${completeMemberCount} of 6 Pokémon are complete.`,
    );
  }

  function handleLoadTeam() {
    const savedTeam = loadTeam();

    if (!savedTeam) {
      setStatusMessage(
        'No saved team was found in this browser.',
      );

      return;
    }

    setTeam(savedTeam);
    setStatusMessage('Saved team loaded.');
  }

  function handleClearTeam() {
    clearSavedTeam();
    setTeam(createEmptyTeam());

    setStatusMessage(
      'Saved team and current editor were cleared.',
    );
  }

  return (
    <main className="team-page">
      <header className="page-header">
        <p className="eyebrow">
          Pokémon Champions Assistant
        </p>

        <h1>My Team</h1>

        <p>
          Configure your six Pokémon and save them in
          this browser.
        </p>
      </header>

      <section className="team-toolbar">
        <label className="form-field team-name-field">
          <span>Team name</span>

          <input
            type="text"
            value={team.name}
            placeholder="My Champions Team"
            onChange={(event) => {
              setTeam((currentTeam) => ({
                ...currentTeam,
                name: event.target.value,
              }));

              setStatusMessage(
                'You have unsaved changes.',
              );
            }}
          />
        </label>

        <div className="team-actions">
          <button
            className="primary-button"
            type="button"
            onClick={handleSaveTeam}
          >
            Save Team
          </button>

          <button
            className="secondary-button"
            type="button"
            onClick={handleLoadTeam}
          >
            Load Saved Team
          </button>

          <button
            className="secondary-button"
            type="button"
            onClick={handleClearTeam}
          >
            Clear Team
          </button>
        </div>

        <p className="team-summary">
          Complete Pokémon:{' '}
          <strong>
            {completeMemberCount} / 6
          </strong>
        </p>

        {statusMessage && (
          <p className="team-status">
            {statusMessage}
          </p>
        )}
      </section>

      <div className="team-member-grid">
        {team.members.map(
          (member, memberIndex) => (
            <PokemonBuildEditor
              key={memberIndex}
              title={`Team slot ${memberIndex + 1}`}
              build={member}
              onChange={(nextBuild) =>
                updateTeamMember(
                  memberIndex,
                  nextBuild,
                )
              }
            />
          ),
        )}
      </div>
    </main>
  );
}

export default TeamPage;