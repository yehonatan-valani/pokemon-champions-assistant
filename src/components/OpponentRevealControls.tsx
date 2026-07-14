import { useState } from 'react';

import AutocompleteInput from './AutocompleteInput';

import {
  ABILITY_NAMES,
  ITEM_NAMES,
  MOVE_NAMES,
} from '../data/championsData';

interface OpponentRevealControlsProps {
  idPrefix: string;
  revealedMoves: string[];
  revealedItem: string;
  revealedAbility: string;
  onRevealMove: (moveName: string) => void;
  onRemoveMove: (moveName: string) => void;
  onItemChange: (itemName: string) => void;
  onAbilityChange: (
    abilityName: string,
  ) => void;
}

function OpponentRevealControls({
  idPrefix,
  revealedMoves,
  revealedItem,
  revealedAbility,
  onRevealMove,
  onRemoveMove,
  onItemChange,
  onAbilityChange,
}: OpponentRevealControlsProps) {
  const [moveDraft, setMoveDraft] =
    useState('');

  function addMove() {
    const cleanedMove = moveDraft.trim();

    if (!cleanedMove) {
      return;
    }

    onRevealMove(cleanedMove);
    setMoveDraft('');
  }

  return (
    <section className="opponent-reveal-controls">
      <h4>Revealed information</h4>

      <AutocompleteInput
        id={`${idPrefix}-revealed-item`}
        label="Revealed item"
        value={revealedItem}
        options={ITEM_NAMES}
        placeholder="Unknown item"
        onChange={onItemChange}
      />

      <AutocompleteInput
        id={`${idPrefix}-revealed-ability`}
        label="Revealed ability"
        value={revealedAbility}
        options={ABILITY_NAMES}
        placeholder="Unknown ability"
        onChange={onAbilityChange}
      />

      <div className="reveal-move-row">
        <AutocompleteInput
          id={`${idPrefix}-revealed-move`}
          label="Add revealed move"
          value={moveDraft}
          options={MOVE_NAMES}
          placeholder="Search for a move"
          onChange={setMoveDraft}
        />

        <button
          className="secondary-button"
          type="button"
          disabled={
            !moveDraft.trim() ||
            revealedMoves.length >= 4
          }
          onClick={addMove}
        >
          Add Move
        </button>
      </div>

      <div className="revealed-move-list">
        {revealedMoves.length === 0 && (
          <p>No moves revealed yet.</p>
        )}

        {revealedMoves.map((moveName) => (
          <div
            className="revealed-move-chip"
            key={moveName}
          >
            <span>{moveName}</span>

            <button
              type="button"
              aria-label={`Remove ${moveName}`}
              onClick={() =>
                onRemoveMove(moveName)
              }
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default OpponentRevealControls;