import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  isOpponentTeamPreviewComplete,
} from '../domain/opponentTeam';

import {
  isTeamComplete,
} from '../domain/team';

import {
  createTestOpponentPreview,
  createTestTeam,
} from './testData';

describe('test battle data', () => {
  it('creates a complete player team', () => {
    const team = createTestTeam();

    expect(team.members).toHaveLength(6);
    expect(isTeamComplete(team)).toBe(true);
  });

  it(
    'creates a complete opponent preview',
    () => {
      const opponent =
        createTestOpponentPreview();

      expect(opponent.species).toHaveLength(6);

      expect(
        isOpponentTeamPreviewComplete(
          opponent,
        ),
      ).toBe(true);
    },
  );
});