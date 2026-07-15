import { useState } from 'react';

import {
  ABILITY_NAMES,
  MOVE_NAMES,
} from '../data/championsData';

import type {
  BattleActorReference,
} from '../domain/battleAction';

import type {
  BattleState,
} from '../domain/battleState';

import {
  recordAbilityActivated,
  recordMoveUsed,
} from '../mechanics/applyBattleAction';

import AutocompleteInput from './AutocompleteInput';

interface BattleActionRecorderProps {
  battle: BattleState;

  onBattleChange: (
    nextBattle: BattleState,
  ) => void;

  onError: (message: string) => void;
}

interface ActorOption {
  value: string;
  label: string;
}

function createActorOptions(
  battle: BattleState,
): ActorOption[] {
  const options: ActorOption[] = [];

  battle.playerActive.forEach(
    (pokemonIndex, position) => {
      if (pokemonIndex === null) {
        return;
      }

      const pokemon =
        battle.playerPokemon[
          pokemonIndex
        ];

      options.push({
        value: `player:${pokemonIndex}`,
        label: `My ${
          position === 0 ? 'left' : 'right'
        }: ${pokemon.build.species}`,
      });
    },
  );

  battle.opponentActive.forEach(
    (pokemonIndex, position) => {
      if (pokemonIndex === null) {
        return;
      }

      const pokemon =
        battle.opponentPokemon[
          pokemonIndex
        ];

      options.push({
        value: `opponent:${pokemonIndex}`,
        label: `Opponent ${
          position === 0 ? 'left' : 'right'
        }: ${pokemon.species}`,
      });
    },
  );

  return options;
}

function parseActor(
  value: string,
): BattleActorReference | null {
  const [side, indexText] =
    value.split(':');

  if (
    side !== 'player' &&
    side !== 'opponent'
  ) {
    return null;
  }

  const pokemonIndex =
    Number(indexText);

  if (!Number.isInteger(pokemonIndex)) {
    return null;
  }

  return {
    side,
    pokemonIndex,
  };
}

function BattleActionRecorder({
  battle,
  onBattleChange,
  onError,
}: BattleActionRecorderProps) {
  const [actorValue, setActorValue] =
    useState('');

  const [moveName, setMoveName] =
    useState('');

  const [abilityName, setAbilityName] =
    useState('');

  const actorOptions =
    createActorOptions(battle);

  const selectedActor =
    parseActor(actorValue);

  function handleRecordMove() {
    if (!selectedActor) {
      onError(
        'Select the Pokémon that moved.',
      );

      return;
    }

    try {
      onBattleChange(
        recordMoveUsed(
          battle,
          selectedActor,
          moveName,
        ),
      );

      setMoveName('');
      onError('');
    } catch (recordError) {
      if (recordError instanceof Error) {
        onError(recordError.message);
      }
    }
  }

  function handleRecordAbility() {
    if (!selectedActor) {
      onError(
        'Select the Pokémon whose ability activated.',
      );

      return;
    }

    let resolvedAbility =
      abilityName.trim();

    if (
      !resolvedAbility &&
      selectedActor.side === 'player'
    ) {
      resolvedAbility =
        battle.playerPokemon[
          selectedActor.pokemonIndex
        ].build.ability;
    }

    if (!resolvedAbility) {
      onError(
        'Select the revealed ability.',
      );

      return;
    }

    try {
      onBattleChange(
        recordAbilityActivated(
          battle,
          selectedActor,
          resolvedAbility,
        ),
      );

      setAbilityName('');
      onError('');
    } catch (recordError) {
      if (recordError instanceof Error) {
        onError(recordError.message);
      }
    }
  }

  const currentTurnActions =
    battle.actionHistory.filter(
      (action) =>
        action.turnNumber ===
        battle.turnNumber,
    );

  return (
    <section className="battle-action-recorder">
      <h2>Record battle action</h2>

      <p>
        Record moves in the exact order they appear
        during the turn.
      </p>

      <label className="form-field">
        <span>Acting Pokémon</span>

        <select
          value={actorValue}
          onChange={(event) => {
            setActorValue(
              event.target.value,
            );

            setAbilityName('');
          }}
        >
          <option value="">
            Choose an active Pokémon
          </option>

          {actorOptions.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="battle-action-entry">
        <AutocompleteInput
          id="battle-action-move"
          label="Move used"
          value={moveName}
          options={MOVE_NAMES}
          placeholder="Search for a move"
          onChange={setMoveName}
        />

        <button
          className="primary-button"
          type="button"
          disabled={
            !selectedActor ||
            !moveName.trim()
          }
          onClick={handleRecordMove}
        >
          Record Next Move
        </button>
      </div>

      <div className="battle-action-entry">
        <AutocompleteInput
          id="battle-action-ability"
          label="Ability activated"
          value={abilityName}
          options={ABILITY_NAMES}
          placeholder={
            selectedActor?.side === 'player'
              ? 'Leave blank to use known ability'
              : 'Search for the revealed ability'
          }
          onChange={setAbilityName}
        />

        <button
          className="secondary-button"
          type="button"
          disabled={!selectedActor}
          onClick={handleRecordAbility}
        >
          Record Ability
        </button>
      </div>

      <h3>
        Turn {battle.turnNumber} action order
      </h3>

      {currentTurnActions.length === 0 && (
        <p>No structured actions recorded yet.</p>
      )}

      <ol className="structured-action-list">
        {currentTurnActions.map((action) => (
          <li key={action.id}>
            {action.type === 'move-used'
              ? `Move ${action.moveOrder}: ${action.pokemonName} used ${action.moveName}`
              : `${action.pokemonName}'s ${action.abilityName} activated`}
          </li>
        ))}
      </ol>
    </section>
  );
}

export default BattleActionRecorder;