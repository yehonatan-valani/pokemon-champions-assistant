import {
  useState,
} from 'react';

import type {
  ChampionsTeam,
} from '../domain/team';

import type {
  StoredChampionsTeam,
} from '../domain/teamLibrary';

import {
  parseShowdownChampionsTeam,
} from '../mechanics/parseShowdownChampionsTeam';

import {
  addTeamToLibrary,
  deleteLibraryTeam,
  renameLibraryTeam,
} from '../storage/teamLibraryStorage';

interface TeamLibraryPanelProps {
  savedTeam:
    ChampionsTeam | null;

  libraryTeams:
    StoredChampionsTeam[];

  onLibraryChange: (
    teams:
      StoredChampionsTeam[],
  ) => void;

  onReloadSavedTeam: () => void;

  onUseAsAttacker: (
    sourceId: string,
  ) => void;

  onUseAsDefender: (
    sourceId: string,
  ) => void;
}

function createEntryId(): string {
  if (
    typeof globalThis.crypto
      ?.randomUUID ===
    'function'
  ) {
    return globalThis.crypto
      .randomUUID();
  }

  return (
    `team-${Date.now()}-` +
    Math.random()
      .toString(36)
      .slice(2, 10)
  );
}

function formatStatPoints(
  teamMember:
    ChampionsTeam['members'][number],
): string {
  const entries = [
    [
      'HP',
      teamMember.statPoints.hp,
    ],
    [
      'Atk',
      teamMember.statPoints.atk,
    ],
    [
      'Def',
      teamMember.statPoints.def,
    ],
    [
      'SpA',
      teamMember.statPoints.spa,
    ],
    [
      'SpD',
      teamMember.statPoints.spd,
    ],
    [
      'Spe',
      teamMember.statPoints.spe,
    ],
  ].filter(
    (
      [, points],
    ) =>
      Number(points) > 0,
  );

  return entries
    .map(
      (
        [
          label,
          points,
        ],
      ) =>
        `${label} ${points}`,
    )
    .join(' / ');
}

function TeamLibraryPanel({
  savedTeam,
  libraryTeams,
  onLibraryChange,
  onReloadSavedTeam,
  onUseAsAttacker,
  onUseAsDefender,
}: TeamLibraryPanelProps) {
  const [
    teamName,
    setTeamName,
  ] = useState(
    'Imported Comparison Team',
  );

  const [
    showdownText,
    setShowdownText,
  ] = useState('');

  const [
    errors,
    setErrors,
  ] = useState<string[]>([]);

  const [
    warnings,
    setWarnings,
  ] = useState<string[]>([]);

  const [
    message,
    setMessage,
  ] = useState('');

  const [
    renameDrafts,
    setRenameDrafts,
  ] = useState<
    Record<string, string>
  >({});

  function clearMessages() {
    setErrors([]);
    setWarnings([]);
    setMessage('');
  }

  function handleStoreImport() {
    clearMessages();

    const result =
      parseShowdownChampionsTeam(
        showdownText,
        teamName,
      );

    setErrors(
      result.errors,
    );

    setWarnings(
      result.warnings,
    );

    if (!result.team) {
      setMessage(
        'The team was not stored.',
      );

      return;
    }

    try {
      const nextTeams =
        addTeamToLibrary(
          result.team,
          {
            id:
              createEntryId(),

            source:
              'showdown-import',
          },
        );

      onLibraryChange(
        nextTeams,
      );

      setMessage(
        `"${result.team.name}" was stored in the Team Library.`,
      );
    } catch (storageError) {
      setErrors([
        storageError instanceof
          Error
          ? storageError.message
          : 'The team could not be stored.',
      ]);
    }
  }

  function handleCopySavedTeam() {
    clearMessages();

    if (!savedTeam) {
      setErrors([
        'No saved team was found.',
      ]);

      return;
    }

    try {
      const copiedTeam:
      ChampionsTeam = {
        ...savedTeam,

        name:
          `${savedTeam.name} (copy)`,
      };

      const nextTeams =
        addTeamToLibrary(
          copiedTeam,
          {
            id:
              createEntryId(),

            source:
              'saved-team-copy',
          },
        );

      onLibraryChange(
        nextTeams,
      );

      setMessage(
        `"${copiedTeam.name}" was added to the Team Library.`,
      );
    } catch (storageError) {
      setErrors([
        storageError instanceof
          Error
          ? storageError.message
          : 'The saved team could not be copied.',
      ]);
    }
  }

  function handleRename(
    entry:
      StoredChampionsTeam,
  ) {
    clearMessages();

    const nextName =
      (
        renameDrafts[
          entry.id
        ] ??
        entry.team.name
      ).trim();

    try {
      const nextTeams =
        renameLibraryTeam(
          entry.id,
          nextName,
        );

      onLibraryChange(
        nextTeams,
      );

      setRenameDrafts(
        (currentDrafts) => {
          const nextDrafts = {
            ...currentDrafts,
          };

          delete nextDrafts[
            entry.id
          ];

          return nextDrafts;
        },
      );

      setMessage(
        `Team renamed to "${nextName}".`,
      );
    } catch (renameError) {
      setErrors([
        renameError instanceof
          Error
          ? renameError.message
          : 'The team could not be renamed.',
      ]);
    }
  }

  function handleDelete(
    entry:
      StoredChampionsTeam,
  ) {
    const confirmed =
      window.confirm(
        `Delete "${entry.team.name}" from the Team Library?`,
      );

    if (!confirmed) {
      return;
    }

    clearMessages();

    const nextTeams =
      deleteLibraryTeam(
        entry.id,
      );

    onLibraryChange(
      nextTeams,
    );

    setMessage(
      `"${entry.team.name}" was deleted.`,
    );
  }

  return (
    <section className="battle-action-recorder">
      <h2>Team Library</h2>

      <p>
        Import and permanently store
        Showdown-style Champions teams
        in this browser.
      </p>

      <label className="form-field">
        <span>Team name</span>

        <input
          type="text"
          value={teamName}
          onChange={(event) => {
            setTeamName(
              event.target.value,
            );
          }}
        />
      </label>

      <label className="form-field">
        <span>
          Showdown team text
        </span>

        <textarea
          className="team-import-textarea"
          rows={18}
          value={showdownText}
          placeholder={
            'Kingambit @ Chople Berry\n' +
            'Ability: Defiant\n' +
            'Adamant Nature\n' +
            '# Champions stat points: HP 32 / Atk 32 / SpD 2\n' +
            '- Kowtow Cleave\n' +
            '- Low Kick\n' +
            '- Protect\n' +
            '- Sucker Punch'
          }
          onChange={(event) => {
            setShowdownText(
              event.target.value,
            );
          }}
        />
      </label>

      <div className="button-row">
        <button
          className="primary-button"
          type="button"
          onClick={
            handleStoreImport
          }
        >
          Store Imported Team
        </button>

        <button
          className="secondary-button"
          type="button"
          onClick={
            handleCopySavedTeam
          }
          disabled={!savedTeam}
        >
          Copy My Saved Team
        </button>

        <button
          className="secondary-button"
          type="button"
          onClick={
            onReloadSavedTeam
          }
        >
          Reload My Saved Team
        </button>
      </div>

      {message && (
        <p className="team-status">
          {message}
        </p>
      )}

      {errors.length > 0 && (
        <section className="calculation-error">
          <strong>
            Team Library error
          </strong>

          <ul>
            {errors.map(
              (
                error,
                index,
              ) => (
                <li
                  key={
                    `${error}-${index}`
                  }
                >
                  {error}
                </li>
              ),
            )}
          </ul>
        </section>
      )}

      {warnings.length >
        0 && (
        <section className="speed-result">
          <strong>
            Import warnings
          </strong>

          <ul>
            {warnings.map(
              (
                warning,
                index,
              ) => (
                <li
                  key={
                    `${warning}-${index}`
                  }
                >
                  {warning}
                </li>
              ),
            )}
          </ul>
        </section>
      )}

      <h3>
        Stored teams (
        {libraryTeams.length})
      </h3>

      {libraryTeams.length ===
        0 ? (
        <p>
          No imported teams are stored
          yet.
        </p>
      ) : (
        <div className="team-library-grid">
          {libraryTeams.map(
            (entry) => {
              const sourceId =
                `library:${entry.id}`;

              const renameValue =
                renameDrafts[
                  entry.id
                ] ??
                entry.team.name;

              return (
                <article
                  className="team-library-card"
                  key={entry.id}
                >
                  <h4>
                    {entry.team.name}
                  </h4>

                  <p className="field-help-text">
                    {entry.source ===
                    'showdown-import'
                      ? 'Showdown import'
                      : 'Copy of saved team'}
                  </p>

                  <p>
                    {entry.team.members
                      .map(
                        (member) =>
                          member.species,
                      )
                      .join(' · ')}
                  </p>

                  <div className="team-library-actions">
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() => {
                        onUseAsAttacker(
                          sourceId,
                        );
                      }}
                    >
                      Use as Attacker
                    </button>

                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => {
                        onUseAsDefender(
                          sourceId,
                        );
                      }}
                    >
                      Use as Defender
                    </button>
                  </div>

                  <label className="form-field">
                    <span>
                      Rename team
                    </span>

                    <input
                      type="text"
                      value={renameValue}
                      onChange={(event) => {
                        setRenameDrafts(
                          (
                            currentDrafts,
                          ) => ({
                            ...currentDrafts,

                            [entry.id]:
                              event
                                .target
                                .value,
                          }),
                        );
                      }}
                    />
                  </label>

                  <div className="team-library-actions">
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => {
                        handleRename(
                          entry,
                        );
                      }}
                    >
                      Save Name
                    </button>

                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => {
                        handleDelete(
                          entry,
                        );
                      }}
                    >
                      Delete Team
                    </button>
                  </div>

                  <details>
                    <summary>
                      View complete team
                    </summary>

                    <div className="team-library-member-list">
                      {entry.team.members.map(
                        (
                          member,
                          index,
                        ) => (
                          <section
                            className="import-team-member"
                            key={
                              `${member.species}-${index}`
                            }
                          >
                            <h5>
                              {index + 1}.{' '}
                              {
                                member.species
                              }
                            </h5>

                            <p>
                              <strong>
                                Item:
                              </strong>{' '}
                              {
                                member.item ||
                                'None'
                              }
                            </p>

                            <p>
                              <strong>
                                Ability:
                              </strong>{' '}
                              {
                                member.ability
                              }
                            </p>

                            <p>
                              <strong>
                                Nature:
                              </strong>{' '}
                              {
                                member.nature
                              }
                            </p>

                            <p>
                              <strong>
                                Stat Points:
                              </strong>{' '}
                              {formatStatPoints(
                                member,
                              )}
                            </p>

                            <p>
                              <strong>
                                Moves:
                              </strong>{' '}
                              {member.moves.join(
                                ', ',
                              )}
                            </p>
                          </section>
                        ),
                      )}
                    </div>
                  </details>
                </article>
              );
            },
          )}
        </div>
      )}
    </section>
  );
}

export default TeamLibraryPanel;