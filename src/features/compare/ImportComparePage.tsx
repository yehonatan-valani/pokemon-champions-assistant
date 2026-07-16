import {
  useState,
} from 'react';

import AutocompleteInput
  from '../../components/AutocompleteInput';

import FieldControls
  from '../../components/FieldControls';

import SpeedControls
  from '../../components/SpeedControls';

import TeamLibraryPanel
  from '../../components/TeamLibraryPanel';

import MegaFormControls
  from '../../components/MegaFormControls';  

import {
  DEFAULT_DAMAGE_FIELD_CONDITIONS,
  type DamageFieldConditions,
} from '../../domain/fieldConditions';

import {
  validatePokemonBuild,
  type ChampionsPokemonBuild,
} from '../../domain/pokemonBuild';

import {
  DEFAULT_SPEED_CONDITIONS,
  type SpeedComparisonResult,
  type SpeedConditions,
} from '../../domain/speed';

import type {
  ChampionsTeam,
} from '../../domain/team';

import type {
  StoredChampionsTeam,
} from '../../domain/teamLibrary';

import type {
  ChampionsCalculationForm,
} from '../../domain/megaEvolution';

import {
  calculateChampionsDamage,
  type ChampionsDamageResult,
} from '../../mechanics/championsCalculator';

import {
  compareSpeed,
} from '../../mechanics/compareSpeed';

import {
  loadTeamLibrary,
} from '../../storage/teamLibraryStorage';

import {
  loadTeam,
} from '../../storage/teamStorage';


interface SelectableMember {
  index: number;

  build:
    ChampionsPokemonBuild;
}

interface TeamSourceOption {
  id: string;

  label: string;

  team:
    ChampionsTeam;
}

function getSelectableMembers(
  team: ChampionsTeam | null,
): SelectableMember[] {
  if (!team) {
    return [];
  }

  return team.members.flatMap(
    (
      build,
      index,
    ) => {
      const validation =
        validatePokemonBuild(
          build,
        );

      if (!validation.valid) {
        return [];
      }

      return [
        {
          index,
          build,
        },
      ];
    },
  );
}

function getFirstSelectableMember(
  team: ChampionsTeam | null,
): SelectableMember | null {
  return (
    getSelectableMembers(
      team,
    )[0] ??
    null
  );
}

function createSourceOptions(
  savedTeam:
    ChampionsTeam | null,

  libraryTeams:
    StoredChampionsTeam[],
): TeamSourceOption[] {
  const options:
  TeamSourceOption[] = [];

  if (savedTeam) {
    options.push({
      id:
        'saved',

      label:
        `My Saved Team — ${savedTeam.name}`,

      team:
        savedTeam,
    });
  }

  libraryTeams.forEach(
    (entry) => {
      options.push({
        id:
          `library:${entry.id}`,

        label:
          entry.team.name,

        team:
          entry.team,
      });
    },
  );

  return options;
}

function getSourceTeam(
  sourceOptions:
    TeamSourceOption[],

  sourceId: string,
): ChampionsTeam | null {
  return (
    sourceOptions.find(
      (option) =>
        option.id === sourceId,
    )?.team ??
    null
  );
}

function parseSelectedIndex(
  value: string,
): number | null {
  if (!value) {
    return null;
  }

  const parsedValue =
    Number(value);

  if (
    !Number.isInteger(
      parsedValue,
    )
  ) {
    return null;
  }

  return parsedValue;
}

function formatProbability(
  probability: number,
): string {
  return `${(
    probability * 100
  ).toFixed(1)}%`;
}

function readOptionalHp(
  label: string,
  value: string,
): number | undefined {
  const cleanedValue =
    value.trim();

  if (!cleanedValue) {
    return undefined;
  }

  const parsedValue =
    Number(cleanedValue);

  if (
    !Number.isFinite(
      parsedValue,
    ) ||
    parsedValue < 1
  ) {
    throw new Error(
      `${label} must be a positive number.`,
    );
  }

  return parsedValue;
}

function readPriority(
  label: string,
  value: string,
): number {
  const parsedValue =
    Number(value);

  if (
    !Number.isInteger(
      parsedValue,
    ) ||
    parsedValue < -7 ||
    parsedValue > 7
  ) {
    throw new Error(
      `${label} must be a whole number from -7 to 7.`,
    );
  }

  return parsedValue;
}

function getMoveOrderMessage(
  comparison:
    SpeedComparisonResult,
): string {
  if (
    comparison.order ===
    'first'
  ) {
    return 'The attacker moves first.';
  }

  if (
    comparison.order ===
    'second'
  ) {
    return 'The defender moves first.';
  }

  return 'A Speed tie is possible.';
}

function ImportComparePage() {
  const [
    savedTeam,
    setSavedTeam,
  ] =
    useState<ChampionsTeam | null>(
      () => loadTeam(),
    );

  const [
    libraryTeams,
    setLibraryTeams,
  ] =
    useState<
      StoredChampionsTeam[]
    >(
      () =>
        loadTeamLibrary(),
    );

  const [
    attackerSource,
    setAttackerSource,
  ] = useState('');

  const [
    defenderSource,
    setDefenderSource,
  ] = useState('');

  const [
    attackerIndexValue,
    setAttackerIndexValue,
  ] = useState('');

  const [
    defenderIndexValue,
    setDefenderIndexValue,
  ] = useState('');

  const [
    moveName,
    setMoveName,
  ] = useState('');

  const [
    attackerForm,
    setAttackerForm,
    ] =
    useState<ChampionsCalculationForm>(
        'base',
    );

    const [
    defenderForm,
    setDefenderForm,
    ] =
    useState<ChampionsCalculationForm>(
        'base',
    );

  const [
    attackerCurrentHpInput,
    setAttackerCurrentHpInput,
  ] = useState('');

  const [
    defenderCurrentHpInput,
    setDefenderCurrentHpInput,
  ] = useState('');

  const [
    criticalHit,
    setCriticalHit,
  ] = useState(false);

  const [
    spreadDamageApplies,
    setSpreadDamageApplies,
  ] = useState(false);

  const [
    fieldConditions,
    setFieldConditions,
  ] =
    useState<DamageFieldConditions>({
      ...DEFAULT_DAMAGE_FIELD_CONDITIONS,
    });

  const [
    attackerSpeedConditions,
    setAttackerSpeedConditions,
  ] =
    useState<SpeedConditions>({
      ...DEFAULT_SPEED_CONDITIONS,
    });

  const [
    defenderSpeedConditions,
    setDefenderSpeedConditions,
  ] =
    useState<SpeedConditions>({
      ...DEFAULT_SPEED_CONDITIONS,
    });

  const [
    attackerPriorityInput,
    setAttackerPriorityInput,
  ] = useState('0');

  const [
    defenderPriorityInput,
    setDefenderPriorityInput,
  ] = useState('0');

  const [
    trickRoom,
    setTrickRoom,
  ] = useState(false);

  const [
    damageResult,
    setDamageResult,
  ] =
    useState<
      ChampionsDamageResult |
      null
    >(null);

  const [
    speedResult,
    setSpeedResult,
  ] =
    useState<
      SpeedComparisonResult |
      null
    >(null);

  const [
    calculationError,
    setCalculationError,
  ] = useState('');

  const sourceOptions =
    createSourceOptions(
      savedTeam,
      libraryTeams,
    );

  const attackerTeam =
    getSourceTeam(
      sourceOptions,
      attackerSource,
    );

  const defenderTeam =
    getSourceTeam(
      sourceOptions,
      defenderSource,
    );

  const attackerMembers =
    getSelectableMembers(
      attackerTeam,
    );

  const defenderMembers =
    getSelectableMembers(
      defenderTeam,
    );

  const attackerIndex =
    parseSelectedIndex(
      attackerIndexValue,
    );

  const defenderIndex =
    parseSelectedIndex(
      defenderIndexValue,
    );

  const attacker =
    attackerIndex === null
      ? null
      : attackerTeam
          ?.members[
            attackerIndex
          ] ?? null;

  const defender =
    defenderIndex === null
      ? null
      : defenderTeam
          ?.members[
            defenderIndex
          ] ?? null;

  const attackerMoveOptions =
    attacker
      ? [
          ...new Set(
            attacker.moves.filter(
              (configuredMove) =>
                Boolean(
                  configuredMove.trim(),
                ),
            ),
          ),
        ]
      : [];

  function clearResults() {
    setDamageResult(null);
    setSpeedResult(null);
    setCalculationError('');
  }

  function selectAttackerSource(
    sourceId: string,
  ) {
    const nextTeam =
      getSourceTeam(
        sourceOptions,
        sourceId,
      );

    const firstMember =
      getFirstSelectableMember(
        nextTeam,
      );

    setAttackerSource(
      sourceId,
    );

    setAttackerIndexValue(
      firstMember
        ? String(
            firstMember.index,
          )
        : '',
    );

    setMoveName(
        firstMember
            ?.build.moves[0] ??
            '',
        );

        setAttackerForm(
        'base',
        );

        clearResults();
  }

  function selectDefenderSource(
    sourceId: string,
  ) {
    const nextTeam =
      getSourceTeam(
        sourceOptions,
        sourceId,
      );

    const firstMember =
      getFirstSelectableMember(
        nextTeam,
      );

    setDefenderSource(
      sourceId,
    );

    setDefenderIndexValue(
        firstMember
            ? String(
                firstMember.index,
            )
            : '',
        );

        setDefenderForm(
        'base',
        );

        clearResults();
  }

  function handleLibraryChange(
    nextTeams:
      StoredChampionsTeam[],
  ) {
    setLibraryTeams(
      nextTeams,
    );

    const nextSourceIds =
      new Set(
        nextTeams.map(
          (entry) =>
            `library:${entry.id}`,
        ),
      );

    if (
      attackerSource.startsWith(
        'library:',
      ) &&
      !nextSourceIds.has(
        attackerSource,
      )
    ) {
      setAttackerSource('');
      setAttackerIndexValue('');
      setMoveName('');
      setAttackerForm('base');
    }

    if (
      defenderSource.startsWith(
        'library:',
      ) &&
      !nextSourceIds.has(
        defenderSource,
      )
    ) {
      setDefenderSource('');
      setDefenderIndexValue('');
      setDefenderForm('base');
    }

    clearResults();
  }

  function handleReloadSavedTeam() {
    const reloadedTeam =
      loadTeam();

    setSavedTeam(
      reloadedTeam,
    );

    if (!reloadedTeam) {
      if (
        attackerSource ===
        'saved'
      ) {
        setAttackerSource('');
        setAttackerIndexValue('');
        setMoveName('');
        setAttackerForm('base');
      }

      if (
        defenderSource ===
        'saved'
      ) {
        setDefenderSource('');
        setDefenderIndexValue('');
        setDefenderForm('base');
      }
    }

    clearResults();
  }

  function handleCalculate() {
    setDamageResult(null);
    setSpeedResult(null);
    setCalculationError('');

    try {
      if (!attacker) {
        throw new Error(
          'Select a complete attacker.',
        );
      }

      if (!defender) {
        throw new Error(
          'Select a complete defender.',
        );
      }

      if (!moveName.trim()) {
        throw new Error(
          'Select an attacking move.',
        );
      }

      const attackerCurrentHp =
        readOptionalHp(
          'Attacker current HP',
          attackerCurrentHpInput,
        );

      const defenderCurrentHp =
        readOptionalHp(
          'Defender current HP',
          defenderCurrentHpInput,
        );

      const attackerPriority =
        readPriority(
          'Attacker move priority',
          attackerPriorityInput,
        );

      const defenderPriority =
        readPriority(
          'Defender move priority',
          defenderPriorityInput,
        );

      const nextDamageResult =
        calculateChampionsDamage(
            attacker,
            defender,
            moveName,
            fieldConditions,
            {
            attackerCurrentHp,

            defenderCurrentHp,

            criticalHit,

            spreadDamageApplies,

            attackerForm,

            defenderForm,
            },
        );

      const nextSpeedResult =
        compareSpeed(
            attacker,
            {
            ...attackerSpeedConditions,

            movePriority:
                attackerPriority,
            },
            defender,
            {
            ...defenderSpeedConditions,

            movePriority:
                defenderPriority,
            },
            trickRoom,
            attackerForm,
            defenderForm,
        );

      setDamageResult(
        nextDamageResult,
      );

      setSpeedResult(
        nextSpeedResult,
      );
    } catch (error) {
      setCalculationError(
        error instanceof Error
          ? error.message
          : 'An unknown calculation error occurred.',
      );
    }
  }

  const minimumDamagePercent =
    damageResult
      ? (
          (
            damageResult.minDamage /
            damageResult
              .defenderMaxHp
          ) *
          100
        ).toFixed(1)
      : '';

  const maximumDamagePercent =
    damageResult
      ? (
          (
            damageResult.maxDamage /
            damageResult
              .defenderMaxHp
          ) *
          100
        ).toFixed(1)
      : '';

  return (
    <main className="app-shell">
      <header className="page-header">
        <p>
          Pokémon Champions Assistant
        </p>

        <h1>
          Import &amp; Compare
        </h1>

        <p>
          Store multiple teams and use
          any of them in damage and Speed
          comparisons.
        </p>
      </header>

      <TeamLibraryPanel
        savedTeam={savedTeam}
        libraryTeams={
          libraryTeams
        }
        onLibraryChange={
          handleLibraryChange
        }
        onReloadSavedTeam={
          handleReloadSavedTeam
        }
        onUseAsAttacker={
          selectAttackerSource
        }
        onUseAsDefender={
          selectDefenderSource
        }
      />

      {sourceOptions.length >
        0 && (
        <section className="battle-action-recorder">
          <h2>
            Damage and Speed comparison
          </h2>

          <div className="import-compare-grid">
            <section className="speed-result">
              <h3>Attacker</h3>

              <label className="form-field">
                <span>
                  Attacker team
                </span>

                <select
                  value={
                    attackerSource
                  }
                  onChange={(event) => {
                    selectAttackerSource(
                      event.target.value,
                    );
                  }}
                >
                  <option value="">
                    Select a team
                  </option>

                  {sourceOptions.map(
                    (option) => (
                      <option
                        key={option.id}
                        value={option.id}
                      >
                        {option.label}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="form-field">
                <span>
                  Attacking Pokémon
                </span>

                <select
                  value={
                    attackerIndexValue
                  }
                  onChange={(event) => {
                    const nextValue =
                      event.target.value;

                    setAttackerIndexValue(
                      nextValue,
                    );

                    const nextIndex =
                      parseSelectedIndex(
                        nextValue,
                      );

                    const nextBuild =
                      nextIndex === null
                        ? null
                        : attackerTeam
                            ?.members[
                              nextIndex
                            ] ?? null;

                    setMoveName(
                        nextBuild
                            ?.moves[0] ??
                            '',
                        );

                        setAttackerForm(
                        'base',
                        );

                        clearResults();
                  }}
                >
                  <option value="">
                    Select attacker
                  </option>

                  {attackerMembers.map(
                    (member) => (
                      <option
                        key={
                          member.index
                        }
                        value={
                          member.index
                        }
                      >
                        {member.index +
                          1}
                        .{' '}
                        {
                          member.build
                            .species
                        }
                      </option>
                    ),
                  )}
                </select>
              </label>

              <MegaFormControls
                id="comparison-attacker"
                build={attacker}
                value={attackerForm}
                onChange={(nextForm) => {
                    setAttackerForm(
                    nextForm,
                    );

                    clearResults();
                }}
                />

              <AutocompleteInput
                id="library-comparison-move"
                label="Attacking move"
                value={moveName}
                options={
                  attackerMoveOptions
                }
                placeholder="Select one of the attacker’s moves"
                onChange={(value) => {
                  setMoveName(value);
                  clearResults();
                }}
              />

              <label className="form-field">
                <span>
                  Attacker current HP
                </span>

                <input
                  type="number"
                  min="1"
                  value={
                    attackerCurrentHpInput
                  }
                  placeholder="Blank means full HP"
                  onChange={(event) => {
                    setDefenderIndexValue(
                        event.target.value,
                    );

                    setDefenderForm(
                        'base',
                    );

                    clearResults();
                    }}
                />
              </label>

              <SpeedControls
                title="Attacker"
                value={
                  attackerSpeedConditions
                }
                onChange={(value) => {
                  setAttackerSpeedConditions(
                    value,
                  );

                  clearResults();
                }}
              />

              <label className="form-field">
                <span>
                  Attacker move priority
                </span>

                <input
                  type="number"
                  min="-7"
                  max="7"
                  step="1"
                  value={
                    attackerPriorityInput
                  }
                  onChange={(event) => {
                    setAttackerPriorityInput(
                      event.target.value,
                    );

                    clearResults();
                  }}
                />
              </label>
            </section>

            <section className="speed-result">
              <h3>Defender</h3>

              <label className="form-field">
                <span>
                  Defender team
                </span>

                <select
                  value={
                    defenderSource
                  }
                  onChange={(event) => {
                    selectDefenderSource(
                      event.target.value,
                    );
                  }}
                >
                  <option value="">
                    Select a team
                  </option>

                  {sourceOptions.map(
                    (option) => (
                      <option
                        key={option.id}
                        value={option.id}
                      >
                        {option.label}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="form-field">
                <span>
                  Defending Pokémon
                </span>

                <select
                  value={
                    defenderIndexValue
                  }
                  onChange={(event) => {
                    setAttackerCurrentHpInput(
                        event.target.value,
                    );

                    clearResults();
                    }}
                >
                  <option value="">
                    Select defender
                  </option>

                  {defenderMembers.map(
                    (member) => (
                      <option
                        key={
                          member.index
                        }
                        value={
                          member.index
                        }
                      >
                        {member.index +
                          1}
                        .{' '}
                        {
                          member.build
                            .species
                        }
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="form-field">
                <span>
                  Defender current HP
                </span>

                <input
                  type="number"
                  min="1"
                  value={
                    defenderCurrentHpInput
                  }
                  placeholder="Blank means full HP"
                  onChange={(event) => {
                    setDefenderCurrentHpInput(
                      event.target.value,
                    );

                    clearResults();
                  }}
                />
              </label>

              <MegaFormControls
                id="comparison-defender"
                build={defender}
                value={defenderForm}
                onChange={(nextForm) => {
                    setDefenderForm(
                    nextForm,
                    );

                    clearResults();
                }}
                />

              <SpeedControls
                title="Defender"
                value={
                  defenderSpeedConditions
                }
                onChange={(value) => {
                  setDefenderSpeedConditions(
                    value,
                  );

                  clearResults();
                }}
              />

              <label className="form-field">
                <span>
                  Defender move priority
                </span>

                <input
                  type="number"
                  min="-7"
                  max="7"
                  step="1"
                  value={
                    defenderPriorityInput
                  }
                  onChange={(event) => {
                    setDefenderPriorityInput(
                      event.target.value,
                    );

                    clearResults();
                  }}
                />
              </label>
            </section>
          </div>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={criticalHit}
              onChange={(event) => {
                setCriticalHit(
                  event.target.checked,
                );

                clearResults();
              }}
            />

            Calculate as a critical hit
          </label>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={
                spreadDamageApplies
              }
              onChange={(event) => {
                setSpreadDamageApplies(
                  event.target.checked,
                );

                clearResults();
              }}
            />

            Apply doubles spread damage
          </label>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={trickRoom}
              onChange={(event) => {
                setTrickRoom(
                  event.target.checked,
                );

                clearResults();
              }}
            />

            Trick Room active
          </label>

          <FieldControls
            value={fieldConditions}
            onChange={(value) => {
              setFieldConditions(
                value,
              );

              clearResults();
            }}
          />

          <button
            className="primary-button"
            type="button"
            disabled={
              !attacker ||
              !defender ||
              !moveName.trim()
            }
            onClick={
              handleCalculate
            }
          >
            Calculate Comparison
          </button>

          {calculationError && (
            <section className="calculation-error">
              <strong>
                Calculation failed
              </strong>

              <p>
                {calculationError}
              </p>
            </section>
          )}

          {speedResult && (
            <section className="calculation-result">
              <h3>Speed result</h3>

              <div className="damage-summary">
                <div>
                  <span className="result-label">
                    Attacker base Speed
                  </span>

                  <strong className="result-value">
                    {
                      speedResult
                        .firstBaseSpeed
                    }
                  </strong>
                </div>

                <div>
                  <span className="result-label">
                    Attacker effective
                    Speed
                  </span>

                  <strong className="result-value">
                    {
                      speedResult
                        .firstEffectiveSpeed
                    }
                  </strong>
                </div>

                <div>
                  <span className="result-label">
                    Defender base Speed
                  </span>

                  <strong className="result-value">
                    {
                      speedResult
                        .secondBaseSpeed
                    }
                  </strong>
                </div>

                <div>
                  <span className="result-label">
                    Defender effective
                    Speed
                  </span>

                  <strong className="result-value">
                    {
                      speedResult
                        .secondEffectiveSpeed
                    }
                  </strong>
                </div>
              </div>

              <p>
                <strong>
                  {getMoveOrderMessage(
                    speedResult,
                  )}
                </strong>
              </p>

              <p>
                {speedResult.reason}
              </p>
            </section>
          )}

          {damageResult && (
            <section className="calculation-result">
              <h3>Damage result</h3>

              <div className="damage-summary">
                <div>
                    <span className="result-label">
                        Attacker calculation form
                    </span>

                    <strong className="result-value">
                        {
                        damageResult
                            .attackerSpecies
                        }
                        {' — '}
                        {
                        damageResult
                            .attackerAbility
                        }
                    </strong>
                    </div>

                    <div>
                    <span className="result-label">
                        Defender calculation form
                    </span>

                    <strong className="result-value">
                        {
                        damageResult
                            .defenderSpecies
                        }
                        {' — '}
                        {
                        damageResult
                            .defenderAbility
                        }
                    </strong>
                    </div>
                <div>
                  <span className="result-label">
                    Damage
                  </span>

                  <strong className="result-value">
                    {
                      damageResult
                        .minDamage
                    }
                    –
                    {
                      damageResult
                        .maxDamage
                    }{' '}
                    HP
                  </strong>
                </div>

                <div>
                  <span className="result-label">
                    Percentage of maximum
                    HP
                  </span>

                  <strong className="result-value">
                    {
                      minimumDamagePercent
                    }
                    %–
                    {
                      maximumDamagePercent
                    }
                    %
                  </strong>
                </div>

                <div>
                  <span className="result-label">
                    Defender HP
                  </span>

                  <strong className="result-value">
                    {
                      damageResult
                        .defenderCurrentHp
                    }
                    /
                    {
                      damageResult
                        .defenderMaxHp
                    }
                  </strong>
                </div>

                <div>
                  <span className="result-label">
                    Faint chance if move
                    hits
                  </span>

                  <strong className="result-value">
                    {formatProbability(
                      damageResult
                        .oneHitKoChance,
                    )}
                  </strong>
                </div>

                <div>
                  <span className="result-label">
                    Base move accuracy
                  </span>

                  <strong className="result-value">
                    {
                      damageResult
                        .baseAccuracyPercent
                    }
                    %
                  </strong>
                </div>

                <div>
                  <span className="result-label">
                    Accuracy-adjusted faint
                    chance
                  </span>

                  <strong className="result-value">
                    {formatProbability(
                      damageResult
                        .accuracyAdjustedKoChance,
                    )}
                  </strong>
                </div>
              </div>

              <div className="import-compare-grid">
                <section className="speed-result">
                  <h4>
                    Attacker calculated
                    stats
                  </h4>

                  <p>
                    HP{' '}
                    {
                      damageResult
                        .attackerStats.hp
                    }
                    {' · '}Atk{' '}
                    {
                      damageResult
                        .attackerStats.atk
                    }
                    {' · '}Def{' '}
                    {
                      damageResult
                        .attackerStats.def
                    }
                    {' · '}SpA{' '}
                    {
                      damageResult
                        .attackerStats.spa
                    }
                    {' · '}SpD{' '}
                    {
                      damageResult
                        .attackerStats.spd
                    }
                    {' · '}Spe{' '}
                    {
                      damageResult
                        .attackerStats.spe
                    }
                  </p>
                </section>

                <section className="speed-result">
                  <h4>
                    Defender calculated
                    stats
                  </h4>

                  <p>
                    HP{' '}
                    {
                      damageResult
                        .defenderStats.hp
                    }
                    {' · '}Atk{' '}
                    {
                      damageResult
                        .defenderStats.atk
                    }
                    {' · '}Def{' '}
                    {
                      damageResult
                        .defenderStats.def
                    }
                    {' · '}SpA{' '}
                    {
                      damageResult
                        .defenderStats.spa
                    }
                    {' · '}SpD{' '}
                    {
                      damageResult
                        .defenderStats.spd
                    }
                    {' · '}Spe{' '}
                    {
                      damageResult
                        .defenderStats.spe
                    }
                  </p>
                </section>
              </div>

              <details className="calculation-description">
                <summary>
                  Calculator details
                </summary>

                <p>
                  {
                    damageResult
                      .description
                  }
                </p>
              </details>
            </section>
          )}

          <p className="field-help-text">
            Base form is the default for every
            new selection. “Mega Evolve this
            turn” uses the Mega form for both
            damage and Speed on this action.
            This comparison screen does not
            permanently change the stored team.
            </p>
        </section>
      )}
    </main>
  );
}

export default ImportComparePage;