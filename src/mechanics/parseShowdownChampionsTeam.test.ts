import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  createTestTeam,
} from '../data/testData';

import {
  parseShowdownChampionsTeam,
} from './parseShowdownChampionsTeam';

const VALID_SHOWDOWN_TEAM = `
Pikachu @ Focus Sash
Ability: Static
Timid Nature
# Champions stat points: Def 2 / SpA 32 / Spe 32
- Thunderbolt
- Fake Out
- Electroweb
- Protect

Charizard @ Safety Goggles
Ability: Blaze
Timid Nature
# Champions stat points: Def 2 / SpA 32 / Spe 32
- Heat Wave
- Air Slash
- Tailwind
- Protect

Garchomp @ Clear Amulet
Ability: Rough Skin
Jolly Nature
# Champions stat points: Atk 32 / Def 2 / Spe 32
- Earthquake
- Dragon Claw
- Rock Slide
- Protect

Amoonguss @ Rocky Helmet
Ability: Regenerator
Bold Nature
# Champions stat points: HP 32 / Def 32 / SpD 2
- Spore
- Rage Powder
- Pollen Puff
- Protect

Incineroar @ Sitrus Berry
Ability: Intimidate
Careful Nature
# Champions stat points: HP 32 / Atk 2 / Def 16 / SpD 16
- Fake Out
- Flare Blitz
- Knock Off
- Parting Shot

Flutter Mane @ Booster Energy
Ability: Protosynthesis
Timid Nature
# Champions stat points: Def 2 / SpA 32 / Spe 32
- Moonblast
- Shadow Ball
- Dazzling Gleam
- Protect
`;

describe(
  'Showdown Champions team parser',
  () => {
    it(
      'parses a complete six-Pokémon team',
      () => {
        const result =
          parseShowdownChampionsTeam(
            VALID_SHOWDOWN_TEAM,
            'Comparison Team',
          );

        expect(
          result.errors,
        ).toEqual([]);

        expect(
          result.team?.name,
        ).toBe(
          'Comparison Team',
        );

        expect(
          result.team?.members,
        ).toEqual(
          createTestTeam().members,
        );
      },
    );

    it(
      'rejects a team with a missing stat-points line',
      () => {
        const invalidTeam =
          VALID_SHOWDOWN_TEAM.replace(
            '# Champions stat points: Def 2 / SpA 32 / Spe 32',
            '',
          );

        const result =
          parseShowdownChampionsTeam(
            invalidTeam,
          );

        expect(
          result.team,
        ).toBeNull();

        expect(
          result.errors.some(
            (error) =>
              error.includes(
                'Missing "# Champions stat points:" line',
              ),
          ),
        ).toBe(true);
      },
    );

    it(
      'rejects a team that does not contain six Pokémon',
      () => {
        const firstPokemon =
          VALID_SHOWDOWN_TEAM
            .trim()
            .split(
              /\n\s*\n/,
            )[0];

        const result =
          parseShowdownChampionsTeam(
            firstPokemon,
          );

        expect(
          result.team,
        ).toBeNull();

        expect(
          result.errors,
        ).toContain(
          'Expected 6 Pokémon blocks but found 1.',
        );
      },
    );

    it(
      'accepts nickname and gender formatting',
      () => {
        const renamedTeam =
          VALID_SHOWDOWN_TEAM.replace(
            'Pikachu @ Focus Sash',
            'Sparky (Pikachu) (M) @ Focus Sash',
          );

        const result =
          parseShowdownChampionsTeam(
            renamedTeam,
          );

        expect(
          result.errors,
        ).toEqual([]);

        expect(
          result.team
            ?.members[0]
            .species,
        ).toBe('Pikachu');
      },
    );

    it(
      'reports Mega preview comments as a warning',
      () => {
        const teamWithComment =
          VALID_SHOWDOWN_TEAM.replace(
            'Jolly Nature\n' +
              '# Champions stat points: Atk 32 / Def 2 / Spe 32',
            'Jolly Nature\n' +
              '# Champions mega preview: Mega Active (variant 0)\n' +
              '# Mega ability: Tough Claws\n' +
              '# Champions stat points: Atk 32 / Def 2 / Spe 32',
          );

        const result =
          parseShowdownChampionsTeam(
            teamWithComment,
          );

        expect(
          result.errors,
        ).toEqual([]);

        expect(
          result.warnings.some(
            (warning) =>
              warning.includes(
                'Mega preview comments were detected',
              ),
          ),
        ).toBe(true);
      },
    );
  },
);