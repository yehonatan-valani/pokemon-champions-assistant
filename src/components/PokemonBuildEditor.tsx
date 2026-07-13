import {
  createEmptyPokemonBuild,
  type ChampionsPokemonBuild,
} from '../domain/pokemonBuild';
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
  function updateTextField(field: TextField, value: string) {
    onChange({
      ...build,
      [field]: value,
    });
  }

  function updateMove(index: MoveIndex, value: string) {
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
        <h3>Moves</h3>

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