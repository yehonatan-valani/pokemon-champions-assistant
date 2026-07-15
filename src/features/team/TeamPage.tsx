import { useState } from 'react';

import PokemonBuildEditor from '../../components/PokemonBuildEditor';

import {
  CURRENT_REGULATION,
} from '../../data/currentRegulation';

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
  validateBuildAgainstCurrentRegulation,
} from '../../mechanics/validateRegulationBuild';

import {
  clearSavedTeam,
  loadTeam,
  saveTeam,
} from '../../storage/teamStorage';

function hasBuildStarted(
  build: ChampionsPokemonBuild,
): boolean {
  return Boolean(
    build.species.trim() ||
    build.ability.trim() ||
    build.item.trim() ||
    build.moves.some((moveName) =>
      Boolean(moveName.trim()),
    ) ||
    Object.values(
      build.statPoints,
    ).some(
      (statPointValue) =>
        statPointValue !== 0,
    ),
  );
}

function getTeamRegulationProblems(
  team: ChampionsTeam,
): string[] {
  return team.members.flatMap(
    (member, memberIndex) => {
      /*
       * Completely empty slots are allowed
       * when saving a team draft.
       */
      if (!hasBuildStarted(member)) {
        return [];
      }

      return validateBuildAgainstCurrentRegulation(
        member,
      ).map(
        (issue) =>
          `Slot ${memberIndex + 1}: ${issue.message}`,
      );
    },
  );
}

function TeamPage() {
  const [team, setTeam] =
    useState<ChampionsTeam>(
      createEmptyTeam,
    );

  const [
    statusMessage,
    setStatusMessage,
  ] = useState('');

  const completeMemberCount =
    getCompleteMemberCount(team);

  const regulationProblems =
    getTeamRegulationProblems(team);

  function updateTeamMember(
    memberIndex: number,
    nextBuild:
      ChampionsPokemonBuild,
  ) {
    setTeam((currentTeam) => ({
      ...currentTeam,

      members:
        currentTeam.members.map(
          (member, index) =>
            index === memberIndex
              ? nextBuild
              : member,
        ),
    }));

    setStatusMessage(
      'You have unsaved changes.',
    );
  }

  function handleSaveTeam() {
    const currentProblems =
      getTeamRegulationProblems(team);

    if (
      currentProblems.length > 0
    ) {
      const displayedProblems =
        currentProblems
          .slice(0, 3)
          .join(' ');

      const remainingCount =
        currentProblems.length - 3;

      setStatusMessage(
        [
          'Team was not saved.',
          displayedProblems,

          remainingCount > 0
            ? `${remainingCount} additional problem${
                remainingCount === 1
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

    saveTeam(team);

    setStatusMessage(
      isTeamComplete(team)
        ? 'Complete regulation-legal team saved.'
        : [
            'Regulation-legal team draft saved.',
            `${completeMemberCount} of 6 Pokémon are complete.`,
          ].join(' '),
    );
  }

  function handleLoadTeam() {
    const savedTeam =
      loadTeam();

    if (!savedTeam) {
      setStatusMessage(
        'No saved team was found in this browser.',
      );

      return;
    }

    setTeam(savedTeam);

    const loadedProblems =
      getTeamRegulationProblems(
        savedTeam,
      );

    if (
      loadedProblems.length > 0
    ) {
      setStatusMessage(
        [
          'Saved team loaded.',
          'Some builds do not match the current regulation snapshot.',
          'Correct the displayed problems before saving again.',
        ].join(' '),
      );

      return;
    }

    setStatusMessage(
      'Saved regulation-legal team loaded.',
    );
  }

  function handleClearTeam() {
    clearSavedTeam();

    setTeam(
      createEmptyTeam(),
    );

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
          Configure your six Pokémon and
          save them in this browser.
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

      <section className="team-toolbar">
        <label className="form-field team-name-field">
          <span>Team name</span>

          <input
            type="text"
            value={team.name}
            placeholder="My Champions Team"
            onChange={(event) => {
              setTeam(
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

        <p className="team-summary">
          Regulation problems:{' '}
          <strong>
            {regulationProblems.length}
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
          (
            member,
            memberIndex,
          ) => (
            <PokemonBuildEditor
              key={memberIndex}
              title={`Team slot ${memberIndex + 1}`}
              build={member}
              onChange={(
                nextBuild,
              ) =>
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