import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  fetchCurrentDoublesMetaProfiles,
} from './championsBattleDataApi';

function createJsonResponse(
  data: unknown,
  status = 200,
): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,

      headers: {
        'Content-Type':
          'application/json',
      },
    },
  );
}

describe(
  'Champions Battle Data API',
  () => {
    it(
      'loads the current season once and parses profile rows',
      async () => {
        const fetchMock =
          vi.fn(
            async (
              input:
                RequestInfo | URL,
            ) => {
              const url =
                String(input);

              if (
                url.endsWith(
                  '/api',
                )
              ) {
                return createJsonResponse({
                  defaultSeason:
                    'Season M-3',
                });
              }

              if (
                url.includes(
                  '/Garchomp?',
                )
              ) {
                return createJsonResponse({
                  pokemon:
                    'Garchomp',

                  format:
                    'Doubles',

                  season:
                    'Season M-3',

                  source:
                    'test/Garchomp.csv',

                  rows: [
                    {
                      category:
                        'move',

                      rank: 1,

                      name:
                        'Earthquake',

                      percentage:
                        '90.3%',
                    },

                    {
                        category:
                            'Held Item',

                        rank: 1,

                        name:
                            'Life Orb',

                        percentage:
                            '68.5%',
                        },

                    {
                      category:
                        'ability',

                      rank: 1,

                      name:
                        'Rough Skin',

                      percentage:
                        '99.1%',
                    },

                    {
                        category:
                            'stat_alignment',

                        rank: 1,

                        name:
                            'Relaxed',

                        percentage:
                            '24.6%',

                        stat_up:
                            'Defense',

                        stat_down:
                            'Speed',
                        },

                    {
                        category:
                            'stat_points',

                        rank: 1,

                        name: '',

                        percentage: '',

                        percentage_value:
                            32.7,

                        stat_up:
                            'Speed',

                        stat_down:
                            'Sp. Atk',

                        hp_points: 2,

                        attack_points: 32,

                        defense_points: 0,

                        sp_atk_points: 0,

                        sp_def_points: 0,

                        speed_points: 32,
                        },

                        {
                            category:
                                'teammate',

                            rank: 1,

                            name:
                                'Sinistcha',

                            percentage: '',

                            percentage_value:
                                null,
                            },
                  ],
                });
              }

              return createJsonResponse(
                {},
                404,
              );
            },
          );

        const result =
          await fetchCurrentDoublesMetaProfiles(
            [
              'Garchomp',
              'Garchomp',
            ],

            fetchMock as
              typeof fetch,
          );

        expect(
          fetchMock,
        ).toHaveBeenCalledTimes(2);

        expect(
          result.season,
        ).toBe('Season M-3');

        expect(
          result.profiles,
        ).toHaveLength(1);

        const profile =
          result.profiles[0];

        expect(
          profile.moves[0],
        ).toEqual({
          name:
            'Earthquake',

          percentage:
            90.3,

          rank: 1,
        });

        expect(
          profile.items[0]
            .name,
        ).toBe('Life Orb');

        expect(
          profile.abilities[0]
            .name,
        ).toBe(
          'Rough Skin',
        );

        expect(
            profile.natures[0],
            ).toEqual({
            name:
                'Relaxed (Defense ↑ / Speed ↓)',

            percentage:
                24.6,

            rank: 1,
            });

        expect(
            profile
                .statPointSpreads[0],
            ).toEqual({
            name:
                'Speed ↑ / Sp. Atk ↓ — ' +
                'HP 2 / Atk 32 / Def 0 / ' +
                'SpA 0 / SpD 0 / Spe 32',

            percentage:
                32.7,

            rank: 1,
            });

        expect(
            profile.teammates[0],
            ).toEqual({
            name:
                'Sinistcha',

            percentage:
                null,

            rank: 1,
            });

        expect(
          result.errors,
        ).toHaveLength(0);
      },
    );

    it(
      'keeps successfully loaded species when another species fails',
      async () => {
        const fetchMock =
          vi.fn(
            async (
              input:
                RequestInfo | URL,
            ) => {
              const url =
                String(input);

              if (
                url.endsWith(
                  '/api',
                )
              ) {
                return createJsonResponse({
                  defaultSeason:
                    'Season M-3',
                });
              }

              if (
                url.includes(
                  '/Garchomp?',
                )
              ) {
                return createJsonResponse({
                  pokemon:
                    'Garchomp',

                  season:
                    'Season M-3',

                  rows: [],
                });
              }

              return createJsonResponse(
                {
                  message:
                    'Not found',
                },
                404,
              );
            },
          );

        const result =
          await fetchCurrentDoublesMetaProfiles(
            [
              'Garchomp',
              'Missingmon',
            ],

            fetchMock as
              typeof fetch,
          );

        expect(
          result.profiles,
        ).toHaveLength(1);

        expect(
          result.errors,
        ).toEqual([
          {
            species:
              'Missingmon',

            message:
              'Request failed with status 404.',
          },
        ]);
      },
    );

    it(
      'rejects an index without a default season',
      async () => {
        const fetchMock =
          vi.fn(
            async () =>
              createJsonResponse(
                {},
              ),
          );

        await expect(
          fetchCurrentDoublesMetaProfiles(
            ['Garchomp'],

            fetchMock as
              typeof fetch,
          ),
        ).rejects.toThrow(
          /default season/i,
        );
      },
    );
  },
);