import {
  createEmptyPokemonBuild,
  type ChampionsPokemonBuild,
} from '../domain/pokemonBuild';

import {
  NATURE_NAMES,
} from '../data/championsData';

import {
  CURRENT_REGULATION,
  REGULATION_ITEM_NAMES,
  REGULATION_POKEMON_NAMES,
  getLegalAbilitiesForSpecies,
  getLegalMovesForSpecies,
} from '../data/currentRegulation';

import {
  validateBuildAgainstCurrentRegulation,
} from '../mechanics/validateRegulationBuild';

import AutocompleteInput from './AutocompleteInput';
import StatPointEditor from './StatPointEditor';

type TextField =
  | 'nature'
  | 'ability'
  | 'item';

type MoveIndex = 0 | 1 | 2 | 3;

interface PokemonBuildEditorProps {
  title: string;
  build: ChampionsPokemonBuild;

  onChange: (
    nextBuild: ChampionsPokemonBuild,
  ) => void;
}

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

function PokemonBuildEditor({
  title,
  build,
  onChange,
}: PokemonBuildEditorProps) {
  const legalAbilities =
    getLegalAbilitiesForSpecies(
      build.species,
    );

  const legalMoves =
    getLegalMovesForSpecies(
      build.species,
    );

  const regulationIssues =
    hasBuildStarted(build)
      ? validateBuildAgainstCurrentRegulation(
          build,
        )
      : [];

  function updateTextField(
    field: TextField,
    value: string,
  ) {
    onChange({
      ...build,
      [field]: value,
    });
  }

  function updateSpecies(
    value: string,
  ) {
    const speciesChanged =
      value.trim().toLowerCase() !==
      build.species
        .trim()
        .toLowerCase();

    const clearedMoves:
    ChampionsPokemonBuild['moves'] = [
      '',
      '',
      '',
      '',
    ];

    onChange({
      ...build,
      species: value,

      /*
       * Ability and moves belong to the
       * selected species. Clear them when
       * the species changes so stale illegal
       * values are not retained.
       */
      ability: speciesChanged
        ? ''
        : build.ability,

      moves: speciesChanged
        ? clearedMoves
        : build.moves,
    });
  }

  function updateMove(
    index: MoveIndex,
    value: string,
  ) {
    const nextMoves = [
      ...build.moves,
    ] as ChampionsPokemonBuild['moves'];

    nextMoves[index] = value;

    onChange({
      ...build,
      moves: nextMoves,
    });
  }

  function resetBuild() {
    onChange(
      createEmptyPokemonBuild(),
    );
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
          Enter a Pokémon Champions build
          using Stat Points.
        </p>

        <p className="field-help-text">
          Legal options are limited to{' '}
          <strong>
            {CURRENT_REGULATION.formatName}
          </strong>
          .
        </p>
      </header>

      <section className="form-section">
        <h3>Pokémon details</h3>

        <div className="form-grid">
          <AutocompleteInput
            id={`${idPrefix}-species`}
            label="Species"
            value={build.species}
            options={
              REGULATION_POKEMON_NAMES
            }
            placeholder="Search legal Pokémon"
            required
            onChange={updateSpecies}
          />

          <AutocompleteInput
            id={`${idPrefix}-nature`}
            label="Nature"
            value={build.nature}
            options={NATURE_NAMES}
            placeholder="Search for a nature"
            required
            onChange={(value) =>
              updateTextField(
                'nature',
                value,
              )
            }
          />

          <AutocompleteInput
            id={`${idPrefix}-ability`}
            label="Ability"
            value={build.ability}
            options={legalAbilities}
            placeholder={
              build.species
                ? `Search ${build.species}'s legal Abilities`
                : 'Choose a species first'
            }
            required
            onChange={(value) =>
              updateTextField(
                'ability',
                value,
              )
            }
          />

          <AutocompleteInput
            id={`${idPrefix}-item`}
            label="Item"
            value={build.item}
            options={
              REGULATION_ITEM_NAMES
            }
            placeholder="Search legal items"
            onChange={(value) =>
              updateTextField(
                'item',
                value,
              )
            }
          />
        </div>

        {build.species && (
          <p className="field-help-text">
            Loaded{' '}
            <strong>
              {legalAbilities.length}
            </strong>{' '}
            legal Abilities and{' '}
            <strong>
              {legalMoves.length}
            </strong>{' '}
            legal moves for{' '}
            <strong>
              {build.species}
            </strong>
            .
          </p>
        )}
      </section>

      <section className="form-section">
        <h3>Moves</h3>

        <div className="form-grid">
          {build.moves.map(
            (move, index) => (
              <AutocompleteInput
                key={index}
                id={`${idPrefix}-move-${index}`}
                label={`Move ${index + 1}`}
                value={move}
                options={legalMoves}
                placeholder={
                  build.species
                    ? `Search ${build.species}'s legal moves`
                    : 'Choose a species first'
                }
                required
                onChange={(value) =>
                  updateMove(
                    index as MoveIndex,
                    value,
                  )
                }
              />
            ),
          )}
        </div>
      </section>

      <StatPointEditor
        value={build.statPoints}
        onChange={(nextStatPoints) =>
          onChange({
            ...build,
            statPoints:
              nextStatPoints,
          })
        }
      />

      {hasBuildStarted(build) &&
        regulationIssues.length === 0 && (
          <section className="build-regulation-status build-regulation-valid">
            <strong>
              Regulation validation passed.
            </strong>

            <p>
              This build’s species, Ability,
              item, and moves match the
              current regulation snapshot.
            </p>
          </section>
        )}

      {regulationIssues.length > 0 && (
        <section className="build-regulation-status build-regulation-invalid">
          <strong>
            Regulation problems
          </strong>

          <ul>
            {regulationIssues.map(
              (issue, issueIndex) => (
                <li
                  key={`${issue.code}-${issue.moveIndex ?? 'general'}-${issueIndex}`}
                >
                  {issue.message}
                </li>
              ),
            )}
          </ul>
        </section>
      )}

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