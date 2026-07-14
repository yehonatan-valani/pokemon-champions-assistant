import { useState } from 'react';

import {
  createInitialBattleState,
  setOpponentActiveSlot,
  setPlayerActiveSlot,
  removeOpponentRevealedMove,
  revealOpponentMove,
  setOpponentPokemonFainted,
  setOpponentPokemonHp,
  setOpponentPokemonStatStage,
  setOpponentPokemonStatus,
  setOpponentRevealedAbility,
  setOpponentRevealedItem,
  setPlayerPokemonFainted,
  setPlayerPokemonHp,
  setPlayerPokemonStatStage,
  setPlayerPokemonStatus,
  advanceBattleTurn,
  recordBattleEvent,
  setBattleFieldTurns,
  setBattleTerrain,
  setBattleWeather,
  type BattleState,
} from '../../domain/battleState';

import {
  isOpponentTeamPreviewComplete,
  type OpponentTeamPreview,
} from '../../domain/opponentTeam';

import {
  isTeamComplete,
  type ChampionsTeam,
} from '../../domain/team';

import {
  loadOpponentTeam,
} from '../../storage/opponentTeamStorage';

import {
  loadTeam,
} from '../../storage/teamStorage';

import {
  createTestOpponentPreview,
  createTestTeam,
} from '../../data/testData';

import OpponentRevealControls from '../../components/OpponentRevealControls';
import PokemonRuntimeControls from '../../components/PokemonRuntimeControls';
import BattleFieldControls from '../../components/BattleFieldControls';

function parseSelectedIndex(
  value: string,
): number | null {
  if (value === '') {
    return null;
  }

  return Number(value);
}

function BattleStatePage() {
    
  const [savedTeam, setSavedTeam] =
    useState<ChampionsTeam | null>(() =>
      loadTeam(),
    );

  const [
    opponentPreview,
    setOpponentPreview,
  ] = useState<OpponentTeamPreview | null>(
    () => loadOpponentTeam(),
  );

  const [eventDraft, setEventDraft] =
    useState('');
  
  const [battle, setBattle] =
    useState<BattleState | null>(null);

  const [error, setError] = useState('');

  function updateBattle(
  updater: (
    currentBattle: BattleState,
  ) => BattleState,
) {
  setBattle((currentBattle) =>
    currentBattle
      ? updater(currentBattle)
      : currentBattle,
  );

  setError('');
}
  
  function refreshSetup() {
    setSavedTeam(loadTeam());
    setOpponentPreview(loadOpponentTeam());
    setError('');
  }

  function startTestBattle() {
  const testTeam = createTestTeam();

  const testOpponent =
    createTestOpponentPreview();

  setBattle(
    createInitialBattleState(
      testTeam,
      testOpponent,
    ),
  );

  setError('');
}

  function startBattle() {
    setError('');

    if (!savedTeam) {
      setError(
        'No saved player team was found.',
      );

      return;
    }

    if (!isTeamComplete(savedTeam)) {
      setError(
        'Your saved team must contain six complete Pokémon builds.',
      );

      return;
    }

    if (!opponentPreview) {
      setError(
        'No saved opponent preview was found.',
      );

      return;
    }

    if (
      !isOpponentTeamPreviewComplete(
        opponentPreview,
      )
    ) {
      setError(
        'The opponent preview must contain six valid species.',
      );

      return;
    }

    setBattle(
      createInitialBattleState(
        savedTeam,
        opponentPreview,
      ),
    );
  }

  function updatePlayerActive(
    position: 0 | 1,
    selectedValue: string,
  ) {
    if (!battle) {
      return;
    }

    try {
      setBattle(
        setPlayerActiveSlot(
          battle,
          position,
          parseSelectedIndex(
            selectedValue,
          ),
        ),
      );

      setError('');
    } catch (selectionError) {
      if (selectionError instanceof Error) {
        setError(selectionError.message);
      }
    }
  }

  function handleAdvanceTurn() {
    updateBattle((currentBattle) =>
        advanceBattleTurn(currentBattle),
    );
    }

function handleRecordEvent() {
  const cleanedEvent = eventDraft.trim();

  if (!cleanedEvent) {
    return;
  }

  updateBattle((currentBattle) =>
    recordBattleEvent(
      currentBattle,
      cleanedEvent,
    ),
  );

  setEventDraft('');
}
  
  function updateOpponentActive(
    position: 0 | 1,
    selectedValue: string,
  ) {
    if (!battle) {
      return;
    }

    try {
      setBattle(
        setOpponentActiveSlot(
          battle,
          position,
          parseSelectedIndex(
            selectedValue,
          ),
        ),
      );

      setError('');
    } catch (selectionError) {
      if (selectionError instanceof Error) {
        setError(selectionError.message);
      }
    }
  }

  return (
    <main className="battle-state-page">
      <header className="page-header">
        <p className="eyebrow">
          Pokémon Champions Assistant
        </p>

        <h1>Live Battle</h1>

        <p>
          Start a battle from your saved team and the
          saved opponent preview.
        </p>
      </header>

      {!battle && (
        <section className="battle-start-card">
          <h2>Battle information</h2>

          <p>
            My team:{' '}
            <strong>
              {savedTeam?.name ??
                'No saved team'}
            </strong>
          </p>

          <p>
            Opponent:{' '}
            <strong>
              {opponentPreview?.name ??
                'No saved opponent preview'}
            </strong>
          </p>

          <div className="team-actions">
            <button
              className="primary-button"
              type="button"
              onClick={startBattle}
            >
              Start Battle
            </button>

            <button
              className="secondary-button"
              type="button"
              onClick={refreshSetup}
            >
              Refresh Saved Setup
            </button>

            <button
                className="secondary-button"
                type="button"
                onClick={startTestBattle}
                >
                Start Test Battle
                </button>
          </div>
        </section>
      )}

      {error && (
        <section className="calculation-error">
          <strong>Battle setup problem</strong>
          <p>{error}</p>
        </section>
      )}

      {battle && (
        <>
          <section className="battle-header-card">
            <div>
              <span>Turn</span>
              <strong>{battle.turnNumber}</strong>
            </div>

            <div>
              <span>My team</span>
              <strong>
                {battle.playerTeamName}
              </strong>
            </div>

            <div>
              <span>Opponent</span>
              <strong>
                {battle.opponentName}
              </strong>
            </div>
          </section>

          <BattleFieldControls
            value={battle.field}
            onWeatherChange={(weather) =>
                updateBattle((currentBattle) =>
                setBattleWeather(
                    currentBattle,
                    weather,
                ),
                )
            }
            onTerrainChange={(terrain) =>
                updateBattle((currentBattle) =>
                setBattleTerrain(
                    currentBattle,
                    terrain,
                ),
                )
            }
            onTurnsChange={(fieldKey, turns) =>
                updateBattle((currentBattle) =>
                setBattleFieldTurns(
                    currentBattle,
                    fieldKey,
                    turns,
                ),
                )
            }
            />

          <div className="battle-sides-grid">
            <section className="battle-side-card">
              <h2>My active Pokémon</h2>

              <label className="form-field">
                <span>Left position</span>

                <select
                  value={
                    battle.playerActive[0] ??
                    ''
                  }
                  onChange={(event) =>
                    updatePlayerActive(
                      0,
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Choose a Pokémon
                  </option>

                  {battle.playerPokemon.map(
                    (pokemon, index) => (
                      <option
                        key={index}
                        value={index}
                        disabled={
                          battle.playerActive[1] ===
                          index
                        }
                      >
                        Slot {index + 1}:{' '}
                        {pokemon.build.species}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="form-field">
                <span>Right position</span>

                <select
                  value={
                    battle.playerActive[1] ??
                    ''
                  }
                  onChange={(event) =>
                    updatePlayerActive(
                      1,
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Choose a Pokémon
                  </option>

                  {battle.playerPokemon.map(
                    (pokemon, index) => (
                      <option
                        key={index}
                        value={index}
                        disabled={
                          battle.playerActive[0] ===
                          index
                        }
                      >
                        Slot {index + 1}:{' '}
                        {pokemon.build.species}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </section>

            <section className="battle-side-card">
              <h2>Opponent active Pokémon</h2>

              <label className="form-field">
                <span>Left position</span>

                <select
                  value={
                    battle.opponentActive[0] ??
                    ''
                  }
                  onChange={(event) =>
                    updateOpponentActive(
                      0,
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Choose a Pokémon
                  </option>

                  {battle.opponentPokemon.map(
                    (pokemon, index) => (
                      <option
                        key={index}
                        value={index}
                        disabled={
                          battle.opponentActive[1] ===
                          index
                        }
                      >
                        Slot {index + 1}:{' '}
                        {pokemon.species}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="form-field">
                <span>Right position</span>

                <select
                  value={
                    battle.opponentActive[1] ??
                    ''
                  }
                  onChange={(event) =>
                    updateOpponentActive(
                      1,
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Choose a Pokémon
                  </option>

                  {battle.opponentPokemon.map(
                    (pokemon, index) => (
                      <option
                        key={index}
                        value={index}
                        disabled={
                          battle.opponentActive[0] ===
                          index
                        }
                      >
                        Slot {index + 1}:{' '}
                        {pokemon.species}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </section>
          </div>

          <div className="runtime-sides-grid">
            <section>
                <h2>My active battle state</h2>

                {([0, 1] as const).map((position) => {
                const pokemonIndex =
                    battle.playerActive[position];

                if (pokemonIndex === null) {
                    return (
                    <section
                        className="runtime-empty-card"
                        key={position}
                    >
                        No Pokémon selected in the{' '}
                        {position === 0
                        ? 'left'
                        : 'right'}{' '}
                        position.
                    </section>
                    );
                }

                const pokemon =
                    battle.playerPokemon[pokemonIndex];

                return (
                    <PokemonRuntimeControls
                    key={position}
                    title={`${
                        position === 0
                        ? 'Left'
                        : 'Right'
                    }: ${pokemon.build.species}`}
                    value={pokemon}
                    hpValue={pokemon.currentHp}
                    hpMaximum={pokemon.maxHp}
                    hpLabel="Current HP"
                    onHpChange={(nextHp) =>
                        updateBattle((current) =>
                        setPlayerPokemonHp(
                            current,
                            pokemonIndex,
                            nextHp,
                        ),
                        )
                    }
                    onStatusChange={(nextStatus) =>
                        updateBattle((current) =>
                        setPlayerPokemonStatus(
                            current,
                            pokemonIndex,
                            nextStatus,
                        ),
                        )
                    }
                    onFaintedChange={(fainted) =>
                        updateBattle((current) =>
                        setPlayerPokemonFainted(
                            current,
                            pokemonIndex,
                            fainted,
                        ),
                        )
                    }
                    onStatStageChange={(
                        statKey,
                        nextStage,
                    ) =>
                        updateBattle((current) =>
                        setPlayerPokemonStatStage(
                            current,
                            pokemonIndex,
                            statKey,
                            nextStage,
                        ),
                        )
                    }
                    />
                );
                })}
            </section>

            <section>
                <h2>Opponent active battle state</h2>

                {([0, 1] as const).map((position) => {
                const pokemonIndex =
                    battle.opponentActive[position];

                if (pokemonIndex === null) {
                    return (
                    <section
                        className="runtime-empty-card"
                        key={position}
                    >
                        No Pokémon selected in the{' '}
                        {position === 0
                        ? 'left'
                        : 'right'}{' '}
                        position.
                    </section>
                    );
                }

                const pokemon =
                    battle.opponentPokemon[
                    pokemonIndex
                    ];

                return (
                    <section
                    className="opponent-runtime-wrapper"
                    key={position}
                    >
                    <PokemonRuntimeControls
                        title={`${
                        position === 0
                            ? 'Left'
                            : 'Right'
                        }: ${pokemon.species}`}
                        value={pokemon}
                        hpValue={pokemon.currentHpPercent}
                        hpMaximum={100}
                        hpLabel="Current HP percentage"
                        onHpChange={(nextHp) =>
                        updateBattle((current) =>
                            setOpponentPokemonHp(
                            current,
                            pokemonIndex,
                            nextHp,
                            ),
                        )
                        }
                        onStatusChange={(nextStatus) =>
                        updateBattle((current) =>
                            setOpponentPokemonStatus(
                            current,
                            pokemonIndex,
                            nextStatus,
                            ),
                        )
                        }
                        onFaintedChange={(fainted) =>
                        updateBattle((current) =>
                            setOpponentPokemonFainted(
                            current,
                            pokemonIndex,
                            fainted,
                            ),
                        )
                        }
                        onStatStageChange={(
                        statKey,
                        nextStage,
                        ) =>
                        updateBattle((current) =>
                            setOpponentPokemonStatStage(
                            current,
                            pokemonIndex,
                            statKey,
                            nextStage,
                            ),
                        )
                        }
                    />

                    <OpponentRevealControls
                        idPrefix={`opponent-${pokemonIndex}`}
                        revealedMoves={
                        pokemon.revealedMoves
                        }
                        revealedItem={
                        pokemon.revealedItem
                        }
                        revealedAbility={
                        pokemon.revealedAbility
                        }
                        onRevealMove={(moveName) => {
                        try {
                            updateBattle((current) =>
                            revealOpponentMove(
                                current,
                                pokemonIndex,
                                moveName,
                            ),
                            );
                        } catch (revealError) {
                            if (
                            revealError instanceof Error
                            ) {
                            setError(
                                revealError.message,
                            );
                            }
                        }
                        }}
                        onRemoveMove={(moveName) =>
                        updateBattle((current) =>
                            removeOpponentRevealedMove(
                            current,
                            pokemonIndex,
                            moveName,
                            ),
                        )
                        }
                        onItemChange={(itemName) =>
                        updateBattle((current) =>
                            setOpponentRevealedItem(
                            current,
                            pokemonIndex,
                            itemName,
                            ),
                        )
                        }
                        onAbilityChange={(
                        abilityName,
                        ) =>
                        updateBattle((current) =>
                            setOpponentRevealedAbility(
                            current,
                            pokemonIndex,
                            abilityName,
                            ),
                        )
                        }
                    />
                    </section>
                );
                })}
            </section>
            </div>

          <section className="battle-event-card">
            <div className="battle-event-header">
                <h2>Turn and event history</h2>

                <button
                className="primary-button"
                type="button"
                onClick={handleAdvanceTurn}
                >
                Advance to Turn {battle.turnNumber + 1}
                </button>
            </div>

            <div className="battle-event-entry">
                <label className="form-field">
                <span>Record an event</span>

                <input
                    type="text"
                    value={eventDraft}
                    placeholder="Example: Opponent used Protect"
                    onChange={(event) =>
                    setEventDraft(event.target.value)
                    }
                    onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        handleRecordEvent();
                    }
                    }}
                />
                </label>

                <button
                className="secondary-button"
                type="button"
                disabled={!eventDraft.trim()}
                onClick={handleRecordEvent}
                >
                Add Event
                </button>
            </div>

            <ol className="battle-event-history">
                {battle.eventHistory.map(
                (historyEvent, index) => (
                    <li key={`${index}-${historyEvent}`}>
                    {historyEvent}
                    </li>
                ),
                )}
            </ol>
            </section>

            <button
            className="secondary-button"
            type="button"
            onClick={() => {
                setBattle(null);
                setError('');
                setEventDraft('');
            }}
            >
            End Current Battle
            </button>
        </>
      )}
    </main>
  );
}

export default BattleStatePage;