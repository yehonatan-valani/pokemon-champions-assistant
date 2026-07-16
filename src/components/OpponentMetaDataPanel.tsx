import {
  useState,
} from 'react';

import {
  fetchCurrentDoublesMetaProfiles,
} from '../data/championsBattleDataApi';

import type {
  BattleState,
} from '../domain/battleState';

import type {
  ChampionsMetaProfile,
  ChampionsMetaProfileBatch,
  ChampionsMetaUsageEntry,
} from '../domain/championsMetaProfile';

interface OpponentMetaDataPanelProps {
  battle: BattleState;
}

interface UsageListProps {
  title: string;

  entries:
    ChampionsMetaUsageEntry[];

  limit?: number;
}

function formatUsageValue(
  entry:
    ChampionsMetaUsageEntry,
): string {
  if (
    entry.percentage ===
    null
  ) {
    return `Rank #${entry.rank}`;
  }

  return `${entry.percentage.toFixed(
    1,
  )}%`;
}

function UsageList({
  title,
  entries,
  limit = 5,
}: UsageListProps) {
  const visibleEntries =
    entries.slice(
      0,
      limit,
    );

  return (
    <section>
      <h4>{title}</h4>

      {visibleEntries.length ===
        0 ? (
        <p className="field-help-text">
          No data returned.
        </p>
      ) : (
        <ol>
          {visibleEntries.map(
            (entry) => (
              <li
                key={
                  `${entry.rank}-` +
                  entry.name
                }
              >
                <strong>
                  {entry.name}
                </strong>
                {' — '}
                {formatUsageValue(
                    entry,
                    )}
              </li>
            ),
          )}
        </ol>
      )}
    </section>
  );
}

function MetaProfileCard({
  profile,
}: {
  profile:
    ChampionsMetaProfile;
}) {
  return (
    <section className="speed-result">
      <h3>{profile.species}</h3>

      <div className="stats-comparison">
        <UsageList
          title="Top moves"
          entries={profile.moves}
        />

        <UsageList
          title="Top items"
          entries={profile.items}
        />

        <UsageList
          title="Abilities"
          entries={
            profile.abilities
          }
          limit={3}
        />

        <UsageList
          title="Stat Point spreads"
          entries={
            profile
              .statPointSpreads
          }
        />
      </div>

      <details className="calculation-description">
        <summary>
          Additional meta data
        </summary>

        <div className="stats-comparison">
          <UsageList
            title="Stat alignments"
            entries={
                profile.natures
            }
            />

          <UsageList
            title="Common teammates"
            entries={
              profile.teammates
            }
          />
        </div>
      </details>
    </section>
  );
}

function OpponentMetaDataPanel({
  battle,
}: OpponentMetaDataPanelProps) {
  const [
    batch,
    setBatch,
  ] =
    useState<
      ChampionsMetaProfileBatch |
      null
    >(null);

  const [
    loadedSpeciesKey,
    setLoadedSpeciesKey,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const speciesNames =
    battle.opponentPokemon.map(
      (pokemon) =>
        pokemon.species,
    );

  const speciesKey =
    speciesNames.join('|');

  const visibleBatch =
    loadedSpeciesKey ===
      speciesKey
      ? batch
      : null;

  async function handleLoad() {
    setLoading(true);
    setError('');

    try {
      const nextBatch =
        await fetchCurrentDoublesMetaProfiles(
          speciesNames,
        );

      setBatch(
        nextBatch,
      );

      setLoadedSpeciesKey(
        speciesKey,
      );
    } catch (loadError) {
      setBatch(null);

      setLoadedSpeciesKey(
        speciesKey,
      );

      setError(
        loadError instanceof
          Error
          ? loadError.message
          : 'An unknown loading error occurred.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="battle-action-recorder">
      <h2>
        Current Champions meta data
      </h2>

      <p>
        Load current Doubles usage data
        for the six Pokémon in the
        opponent’s team preview.
      </p>

      <button
        className="secondary-button"
        type="button"
        disabled={
          loading ||
          speciesNames.length === 0
        }
        onClick={handleLoad}
      >
        {loading
          ? 'Loading Meta Data…'
          : 'Load Current Doubles Data'}
      </button>

      {error && (
        <section className="calculation-error">
          <strong>
            Meta data could not be loaded
          </strong>

          <p>{error}</p>
        </section>
      )}

      {visibleBatch && (
        <>
          <section className="speed-result">
            <h3>Loaded source</h3>

            <p>
              Format:{' '}
              <strong>
                {
                  visibleBatch
                    .format
                }
              </strong>
            </p>

            <p>
              Season:{' '}
              <strong>
                {
                  visibleBatch
                    .season
                }
              </strong>
            </p>

            <p>
              Profiles loaded:{' '}
              <strong>
                {
                  visibleBatch
                    .profiles
                    .length
                }
              </strong>
            </p>
          </section>

          {visibleBatch.errors.length >
            0 && (
            <section className="calculation-error">
              <strong>
                Some profiles failed to
                load
              </strong>

              <ul>
                {visibleBatch.errors.map(
                  (loadError) => (
                    <li
                      key={
                        loadError
                          .species
                      }
                    >
                      <strong>
                        {
                          loadError
                            .species
                        }
                      </strong>
                      {': '}
                      {
                        loadError
                          .message
                      }
                    </li>
                  ),
                )}
              </ul>
            </section>
          )}

          {visibleBatch.profiles.map(
            (profile) => (
              <MetaProfileCard
                key={
                  profile.species
                }
                profile={profile}
              />
            ),
          )}

          <p className="field-help-text">
            This milestone displays the
            real source data only.
            Candidate filtering and KO
            analysis still use the
            development candidate catalog
            until the next milestone.
          </p>
        </>
      )}
    </section>
  );
}

export default OpponentMetaDataPanel;