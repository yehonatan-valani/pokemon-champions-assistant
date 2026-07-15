import type {
  ResolvedCandidateEvaluation,
  ResolvedOpponentSlotCandidates,
} from './resolveOpponentCandidateSets';

export type CandidateCatalogConfidence =
  | 'none'
  | 'low'
  | 'medium'
  | 'high'
  | 'single-candidate';

export interface RankedCandidateEvaluation {
  evaluation: ResolvedCandidateEvaluation;

  rank: number;
  priorWeight: number;

  /**
   * Value from 0 to 1.
   */
  probability: number;

  /**
   * Value from 0 to 100.
   */
  confidencePercent: number;
}

export interface RankedOpponentSlot {
  slot: ResolvedOpponentSlotCandidates;

  compatibleCount: number;
  rejectedCount: number;

  rankedCandidates:
    RankedCandidateEvaluation[];

  rejectedEvaluations:
    ResolvedCandidateEvaluation[];

  confidence:
    CandidateCatalogConfidence;

  confidenceMessage: string;
}

function getCandidatePriorWeight(
  evaluation: ResolvedCandidateEvaluation,
): number {
  const weight =
    evaluation.candidate.priorWeight;

  if (
    typeof weight !== 'number' ||
    !Number.isFinite(weight) ||
    weight <= 0
  ) {
    return 1;
  }

  return weight;
}

function determineConfidence(
  rankedCandidates:
    RankedCandidateEvaluation[],
): CandidateCatalogConfidence {
  if (rankedCandidates.length === 0) {
    return 'none';
  }

  if (rankedCandidates.length === 1) {
    return 'single-candidate';
  }

  const topProbability =
    rankedCandidates[0].probability;

  const secondProbability =
    rankedCandidates[1].probability;

  const margin =
    topProbability - secondProbability;

  if (
    topProbability >= 0.75 &&
    margin >= 0.25
  ) {
    return 'high';
  }

  if (topProbability >= 0.55) {
    return 'medium';
  }

  return 'low';
}

function createConfidenceMessage(
  confidence: CandidateCatalogConfidence,
): string {
  if (confidence === 'none') {
    return (
      'No compatible candidate remains in ' +
      'the loaded catalog. The observations, ' +
      'candidate data, or recorded events may ' +
      'need review.'
    );
  }

  if (confidence === 'single-candidate') {
    return (
      'Only one compatible candidate remains ' +
      'in the loaded catalog. This does not ' +
      'prove that the real set is present in ' +
      'the catalog.'
    );
  }

  if (confidence === 'high') {
    return (
      'One candidate has high relative ' +
      'confidence within the loaded catalog.'
    );
  }

  if (confidence === 'medium') {
    return (
      'One candidate is currently favored, ' +
      'but meaningful alternatives remain.'
    );
  }

  return (
    'The remaining candidates have similar ' +
    'relative confidence. More observations ' +
    'are needed.'
  );
}

export function rankResolvedOpponentSlot(
  slot: ResolvedOpponentSlotCandidates,
): RankedOpponentSlot {
  const compatibleEvaluations =
    slot.evaluations.filter(
      (evaluation) =>
        evaluation.compatible,
    );

  const rejectedEvaluations =
    slot.evaluations.filter(
      (evaluation) =>
        !evaluation.compatible,
    );

  if (
    compatibleEvaluations.length === 0
  ) {
    return {
      slot,

      compatibleCount: 0,
      rejectedCount:
        rejectedEvaluations.length,

      rankedCandidates: [],
      rejectedEvaluations,

      confidence: 'none',

      confidenceMessage:
        createConfidenceMessage('none'),
    };
  }

  const weightedCandidates =
    compatibleEvaluations.map(
      (evaluation) => ({
        evaluation,

        priorWeight:
          getCandidatePriorWeight(
            evaluation,
          ),
      }),
    );

  const totalWeight =
    weightedCandidates.reduce(
      (
        runningTotal,
        weightedCandidate,
      ) =>
        runningTotal +
        weightedCandidate.priorWeight,
      0,
    );

  const rankedCandidates =
    weightedCandidates
      .map(
        ({
          evaluation,
          priorWeight,
        }) => {
          const probability =
            priorWeight / totalWeight;

          return {
            evaluation,
            priorWeight,
            probability,

            confidencePercent:
              probability * 100,
          };
        },
      )
      .sort((first, second) => {
        const probabilityDifference =
          second.probability -
          first.probability;

        if (probabilityDifference !== 0) {
          return probabilityDifference;
        }

        return first.evaluation.candidate.label
          .localeCompare(
            second.evaluation.candidate
              .label,
          );
      })
      .map(
        (candidate, index) => ({
          ...candidate,
          rank: index + 1,
        }),
      );

  const confidence =
    determineConfidence(
      rankedCandidates,
    );

  return {
    slot,

    compatibleCount:
      compatibleEvaluations.length,

    rejectedCount:
      rejectedEvaluations.length,

    rankedCandidates,
    rejectedEvaluations,

    confidence,

    confidenceMessage:
      createConfidenceMessage(
        confidence,
      ),
  };
}

export function rankResolvedOpponentSlots(
  slots:
    ResolvedOpponentSlotCandidates[],
): RankedOpponentSlot[] {
  return slots.map(
    rankResolvedOpponentSlot,
  );
}