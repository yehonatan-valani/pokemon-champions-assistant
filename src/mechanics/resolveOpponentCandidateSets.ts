import type {
  BattleState,
} from '../domain/battleState';

import type {
  CandidateRejection,
  OpponentSetCandidate,
} from '../domain/opponentCandidate';

import type {
  SpeedEvidence,
} from '../domain/speedEvidence';

import {
  deriveSpeedEvidence,
} from './deriveSpeedEvidence';

import {
  evaluateCandidateSpeedEvidence,
} from './evaluateCandidateSpeedEvidence';

import {
  evaluateOpponentPairSpeedEvidence,
} from './evaluateOpponentPairSpeedEvidence';

import {
  evaluateOpponentCandidate,
  getCandidatesForSpecies,
} from './filterOpponentCandidates';

import {
  evaluateCandidateDamageEvidence,
} from './evaluateCandidateDamageEvidence';

export interface ResolvedCandidateEvaluation {
  candidate: OpponentSetCandidate;

  compatible: boolean;

  rejections:
    CandidateRejection[];

  usablePlayerSpeedEvidence:
    number;

  ignoredPlayerSpeedEvidence:
    number;

  usableExactDamageEvidence:
    number;

  usablePercentDamageEvidence:
    number;

  ignoredDamageEvidence:
    number;
}

export interface ResolvedOpponentSlotCandidates {
  pokemonIndex: number;
  species: string;
  totalCandidates: number;

  evaluations:
    ResolvedCandidateEvaluation[];
}

export interface ResolvedOpponentCandidateSets {
  slots: ResolvedOpponentSlotCandidates[];

  jointSpeedEvidenceCount: number;
}

function isJointOpponentEvidence(
  evidence: SpeedEvidence,
): boolean {
  return (
    evidence.earlierActor.side ===
      'opponent' &&
    evidence.laterActor.side ===
      'opponent'
  );
}

function relationSymbol(
  evidence: SpeedEvidence,
): string {
  return evidence.relation ===
    'greater-than-or-equal'
    ? '≥'
    : '≤';
}

function createJointRejectionMessage(
  evidence: SpeedEvidence,
  candidateName: string,
  otherPokemonName: string,
): string {
  return [
    `Turn ${evidence.turnNumber}: `,
    `${evidence.earlierPokemonName} acted before `,
    `${evidence.laterPokemonName}. `,

    `This requires effective Speed `,
    `${relationSymbol(evidence)} under the recorded conditions. `,

    `${candidateName} has no remaining compatible `,
    `${otherPokemonName} candidate that can satisfy this order.`,
  ].join('');
}

function addRejection(
  evaluation: ResolvedCandidateEvaluation,
  rejection: CandidateRejection,
): void {
  const duplicate =
    evaluation.rejections.some(
      (existingRejection) =>
        existingRejection.code ===
          rejection.code &&
        existingRejection.message ===
          rejection.message,
    );

  if (duplicate) {
    return;
  }

  evaluation.compatible = false;
  evaluation.rejections.push(rejection);
}

function candidateHasCompatiblePartner(
  evidence: SpeedEvidence,
  candidate: OpponentSetCandidate,
  partnerCandidates: OpponentSetCandidate[],
  candidateIsEarlier: boolean,
): boolean {
  return partnerCandidates.some(
    (partnerCandidate) => {
      const result =
        candidateIsEarlier
          ? evaluateOpponentPairSpeedEvidence(
              evidence,
              candidate,
              partnerCandidate,
            )
          : evaluateOpponentPairSpeedEvidence(
              evidence,
              partnerCandidate,
              candidate,
            );

      /*
       * Unsupported mechanics must not reject a
       * candidate. They remain possible until the
       * mechanic is implemented or more evidence
       * becomes available.
       */
      return (
        !result.supported ||
        result.compatible
      );
    },
  );
}

export function resolveOpponentCandidateSets(
  battle: BattleState,
  candidates: OpponentSetCandidate[],
): ResolvedOpponentCandidateSets {
  const speedEvidence =
    deriveSpeedEvidence(
      battle.actionHistory,
    );

  const slots:
  ResolvedOpponentSlotCandidates[] =
    battle.opponentPokemon.map(
      (observation, pokemonIndex) => {
        const speciesCandidates =
          getCandidatesForSpecies(
            candidates,
            observation.species,
          );

        const evaluations =
          speciesCandidates.map(
            (
              candidate,
            ): ResolvedCandidateEvaluation => {
              const revealEvaluation =
                evaluateOpponentCandidate(
                  candidate,
                  observation,
                );

        const playerSpeedEvaluation =
            evaluateCandidateSpeedEvidence(
              battle,
              candidate,
              pokemonIndex,
              speedEvidence,
            );

          const damageEvaluation =
            evaluateCandidateDamageEvidence(
              battle,
              candidate,
              pokemonIndex,
              battle.damageObservations ??
                [],
            );

          return {
                candidate,

                        compatible:
          revealEvaluation.compatible &&
          playerSpeedEvaluation
            .compatible &&
          damageEvaluation.compatible,

        rejections: [
          ...revealEvaluation
            .rejections,

          ...playerSpeedEvaluation
            .rejections,

          ...damageEvaluation
            .rejections,
        ],

        usablePlayerSpeedEvidence:
          playerSpeedEvaluation
            .usableEvidenceCount,

        ignoredPlayerSpeedEvidence:
          playerSpeedEvaluation
            .ignoredEvidenceCount,

                usableExactDamageEvidence:
                  damageEvaluation
                    .usableExactEvidenceCount,

                usablePercentDamageEvidence:
                  damageEvaluation
                    .usablePercentEvidenceCount,

                ignoredDamageEvidence:
                  damageEvaluation
                    .ignoredEvidenceCount,
              };
            },
          );

        return {
          pokemonIndex,
          species: observation.species,
          totalCandidates:
            speciesCandidates.length,
          evaluations,
        };
      },
    );

  const jointEvidence =
    speedEvidence.filter(
      isJointOpponentEvidence,
    );

  const remainingCandidateIds =
    slots.map(
      (slot) =>
        new Set(
          slot.evaluations
            .filter(
              (evaluation) =>
                evaluation.compatible,
            )
            .map(
              (evaluation) =>
                evaluation.candidate.id,
            ),
        ),
    );

  function getRemainingCandidates(
    pokemonIndex: number,
  ): OpponentSetCandidate[] {
    const slot = slots[pokemonIndex];

    if (!slot) {
      return [];
    }

    const remainingIds =
      remainingCandidateIds[
        pokemonIndex
      ];

    return slot.evaluations
      .filter((evaluation) =>
        remainingIds.has(
          evaluation.candidate.id,
        ),
      )
      .map(
        (evaluation) =>
          evaluation.candidate,
      );
  }

  function getEvaluation(
    pokemonIndex: number,
    candidateId: string,
  ): ResolvedCandidateEvaluation | null {
    return (
      slots[
        pokemonIndex
      ]?.evaluations.find(
        (evaluation) =>
          evaluation.candidate.id ===
          candidateId,
      ) ?? null
    );
  }

  /*
   * Repeat until a complete pass removes no
   * candidates. This allows one comparison to
   * narrow a set, which can then narrow another.
   */
  let changed = true;
  let passCount = 0;

  while (changed && passCount < 100) {
    changed = false;
    passCount += 1;

    for (const evidence of jointEvidence) {
      const earlierIndex =
        evidence.earlierActor
          .pokemonIndex;

      const laterIndex =
        evidence.laterActor
          .pokemonIndex;

      if (earlierIndex === laterIndex) {
        continue;
      }

      const earlierSlot =
        slots[earlierIndex];

      const laterSlot =
        slots[laterIndex];

      if (
        !earlierSlot ||
        !laterSlot ||
        earlierSlot.totalCandidates === 0 ||
        laterSlot.totalCandidates === 0
      ) {
        continue;
      }

      const earlierCandidates =
        getRemainingCandidates(
          earlierIndex,
        );

      const laterCandidates =
        getRemainingCandidates(
          laterIndex,
        );

      /*
       * Do not eliminate candidates merely
       * because the development catalog is
       * already empty for the other Pokémon.
       */
      if (
        earlierCandidates.length === 0 ||
        laterCandidates.length === 0
      ) {
        continue;
      }

      const removeEarlierIds =
        earlierCandidates
          .filter(
            (candidate) =>
              !candidateHasCompatiblePartner(
                evidence,
                candidate,
                laterCandidates,
                true,
              ),
          )
          .map(
            (candidate) =>
              candidate.id,
          );

      const removeLaterIds =
        laterCandidates
          .filter(
            (candidate) =>
              !candidateHasCompatiblePartner(
                evidence,
                candidate,
                earlierCandidates,
                false,
              ),
          )
          .map(
            (candidate) =>
              candidate.id,
          );

      for (
        const candidateId
        of removeEarlierIds
      ) {
        const remainingIds =
          remainingCandidateIds[
            earlierIndex
          ];

        if (!remainingIds.delete(candidateId)) {
          continue;
        }

        changed = true;

        const evaluation =
          getEvaluation(
            earlierIndex,
            candidateId,
          );

        if (evaluation) {
          addRejection(evaluation, {
            code: 'speed',

            message:
              createJointRejectionMessage(
                evidence,
                evaluation.candidate.label,
                laterSlot.species,
              ),
          });
        }
      }

      for (
        const candidateId
        of removeLaterIds
      ) {
        const remainingIds =
          remainingCandidateIds[
            laterIndex
          ];

        if (!remainingIds.delete(candidateId)) {
          continue;
        }

        changed = true;

        const evaluation =
          getEvaluation(
            laterIndex,
            candidateId,
          );

        if (evaluation) {
          addRejection(evaluation, {
            code: 'speed',

            message:
              createJointRejectionMessage(
                evidence,
                evaluation.candidate.label,
                earlierSlot.species,
              ),
          });
        }
      }
    }
  }

  return {
    slots,
    jointSpeedEvidenceCount:
      jointEvidence.length,
  };
}