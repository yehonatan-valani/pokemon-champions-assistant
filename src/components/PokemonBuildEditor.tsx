import {
  createEmptyPokemonBuild,
  type ChampionsPokemonBuild,
} from '../domain/pokemonBuild';

import {
  ABILITY_NAMES,
  ITEM_NAMES,
  MOVE_NAMES,
  NATURE_NAMES,
  POKEMON_NAMES,
} from '../data/championsData';

import AutocompleteInput from './AutocompleteInput';
import StatPointEditor from './StatPointEditor';

type TextField = 'species' | 'nature' | 'ability' | 'item';
type MoveIndex = 0 | 1 | 2 | 3;

interface PokemonBuildEditorProps {
  title: string;
  build: ChampionsPokemonBuild;
  onChange: (nextBuild: ChampionsPokemonBuild) => void;
}

function PokemonBuildEditor({
  title,
  build,
  onChange,
}: PokemonBuildEditorProps) {
  function updateTextField(
    field: TextField,
    value: string,
  ) {
    onChange({
      ...build,
      [field]: value,
    });
  }

  function updateMove(
    index: MoveIndex,
    value: string,
  ) {
    const nextMoves = [...build.moves] as [
      string,
      string,
      string,
      string,
    ];

    nextMoves[index] = value;

    onChange({
      ...build,
      moves: nextMoves,
    });
  }

  function resetBuild() {
    onChange(createEmptyPokemonBuild());
  }

  const idPrefix = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');

  return (
    <section className="pokemon-build-editor">
      <header className="editor-header">
        <h2>{title}</h2>

        <p>
          Enter a Pokémon Champions build using Stat Points.
        </p>
      </header>

      <section className="form-section">
        <h3>Pokémon details</h3>

        <div className="form-grid">
          <AutocompleteInput
            id={`${idPrefix}-species`}
            label="Species"
            value={build.species}
            options={POKEMON_NAMES}
            placeholder="Search for a Pokémon"
            required
            onChange={(value) =>
              updateTextField('species', value)
            }
          />

          <AutocompleteInput
            id={`${idPrefix}-nature`}
            label="Nature"
            value={build.nature}
            options={NATURE_NAMES}
            placeholder="Search for a nature"
            required
            onChange={(value) =>
              updateTextField('nature', value)
            }
          />

          <AutocompleteInput
            id={`${idPrefix}-ability`}
            label="Ability"
            value={build.ability}
            options={ABILITY_NAMES}
            placeholder="Search for an ability"
            required
            onChange={(value) =>
              updateTextField('ability', value)
            }
          />

          <AutocompleteInput
            id={`${idPrefix}-item`}
            label="Item"
            value={build.item}
            options={ITEM_NAMES}
            placeholder="Search for an item"
            onChange={(value) =>
              updateTextField('item', value)
            }
          />
        </div>
      </section>

      <section className="form-section">
        <h3>Moves</h3>

        <div className="form-grid">
          {build.moves.map((move, index) => (
            <AutocompleteInput
              key={index}
              id={`${idPrefix}-move-${index}`}
              label={`Move ${index + 1}`}
              value={move}
              options={MOVE_NAMES}
              placeholder="Search for a move"
              required
              onChange={(value) =>
                updateMove(index as MoveIndex, value)
              }
            />
          ))}
        </div>
      </section>

      <StatPointEditor
        value={build.statPoints}
        onChange={(nextStatPoints) =>
          onChange({
            ...build,
            statPoints: nextStatPoints,
          })
        }
      />

      <button
        className="secondary-button"
        type="button"
        onClick={resetBuild}
      >
        Reset {title}
      </button>
    </section>
  );
}

export default PokemonBuildEditor;