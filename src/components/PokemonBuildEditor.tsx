import { useState } from 'react';

import {
  createEmptyPokemonBuild,
  isPokemonBuildComplete,
  type ChampionsPokemonBuild,
} from '../domain/pokemonBuild';
import StatPointEditor from './StatPointEditor';

type TextField = 'species' | 'nature' | 'ability' | 'item';
type MoveIndex = 0 | 1 | 2 | 3;

function PokemonBuildEditor() {
  const [build, setBuild] = useState<ChampionsPokemonBuild>(
    createEmptyPokemonBuild,
  );

  const isComplete = isPokemonBuildComplete(build);

  function updateTextField(field: TextField, value: string) {
    setBuild((currentBuild) => ({
      ...currentBuild,
      [field]: value,
    }));
  }

  function updateMove(index: MoveIndex, value: string) {
    setBuild((currentBuild) => {
      const nextMoves = [...currentBuild.moves] as [
        string,
        string,
        string,
        string,
      ];

      nextMoves[index] = value;

      return {
        ...currentBuild,
        moves: nextMoves,
      };
    });
  }

  function resetBuild() {
    setBuild(createEmptyPokemonBuild());
  }

  return (
    <section className="pokemon-build-editor">
      <header className="editor-header">
        <p className="eyebrow">
          Pokémon Champions Assistant
        </p>

        <h1>Pokémon Build Editor</h1>

        <p>
          Enter one complete Pokémon Champions build.
          Autocomplete will be added later.
        </p>
      </header>

      <section className="form-section">
        <h2>Pokémon details</h2>

        <div className="form-grid">
          <label className="form-field">
            <span>Species</span>
            <input
              type="text"
              value={build.species}
              placeholder="Example: Pikachu"
              onChange={(event) =>
                updateTextField('species', event.target.value)
              }
            />
          </label>

          <label className="form-field">
            <span>Nature</span>
            <input
              type="text"
              value={build.nature}
              placeholder="Example: Timid"
              onChange={(event) =>
                updateTextField('nature', event.target.value)
              }
            />
          </label>

          <label className="form-field">
            <span>Ability</span>
            <input
              type="text"
              value={build.ability}
              placeholder="Example: Static"
              onChange={(event) =>
                updateTextField('ability', event.target.value)
              }
            />
          </label>

          <label className="form-field">
            <span>Item</span>
            <input
              type="text"
              value={build.item}
              placeholder="Example: Focus Sash"
              onChange={(event) =>
                updateTextField('item', event.target.value)
              }
            />
          </label>
        </div>
      </section>

      <section className="form-section">
        <h2>Moves</h2>

        <div className="form-grid">
          {build.moves.map((move, index) => (
            <label className="form-field" key={index}>
              <span>Move {index + 1}</span>

              <input
                type="text"
                value={move}
                placeholder={`Move ${index + 1}`}
                onChange={(event) =>
                  updateMove(
                    index as MoveIndex,
                    event.target.value,
                  )
                }
              />
            </label>
          ))}
        </div>
      </section>

      <StatPointEditor
        value={build.statPoints}
        onChange={(nextStatPoints) =>
          setBuild((currentBuild) => ({
            ...currentBuild,
            statPoints: nextStatPoints,
          }))
        }
      />

      <div
        className={
          isComplete
            ? 'build-status build-status-valid'
            : 'build-status build-status-incomplete'
        }
      >
        {isComplete
          ? 'Build is complete and valid.'
          : 'Complete the required fields and use a legal SP allocation.'}
      </div>

      <div className="editor-actions">
        <button type="button" onClick={resetBuild}>
          Reset entire build
        </button>
      </div>
    </section>
  );
}

export default PokemonBuildEditor;