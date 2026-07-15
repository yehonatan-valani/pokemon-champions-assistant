import type {
  OpponentSetCandidate,
} from '../domain/opponentCandidate';

import type {
  SpeedEvidence,
} from '../domain/speedEvidence';

import {
  calculateInferenceSpeed,
} from './calculateInferenceSpeed';

export interface OpponentPairSpeedEvaluation {
  supported: boolean;
  compatible: boolean;

  earlierSpeed: number | null;
  laterSpeed: number | null;

  reason: string;
}

function satisfiesRelation(
  evidence: SpeedEvidence,
  earlierSpeed: number,
  laterSpeed: number,
): boolean {
  if (
    evidence.relation ===
    'greater-than-or-equal'
  ) {
    return earlierSpeed >= laterSpeed;
  }

  return earlierSpeed <= laterSpeed;
}

export function evaluateOpponentPairSpeedEvidence(
  evidence: SpeedEvidence,
  earlierCandidate: OpponentSetCandidate,
  laterCandidate: OpponentSetCandidate,
): OpponentPairSpeedEvaluation {
  if (
    evidence.earlierActor.side !==
      'opponent' ||
    evidence.laterActor.side !==
      'opponent'
  ) {
    return {
      supported: false,
      compatible: true,
      earlierSpeed: null,
      laterSpeed: null,

      reason:
        'This evidence is not an opponent-versus-opponent comparison.',
    };
  }

  const earlierResult =
    calculateInferenceSpeed(
      earlierCandidate.build,
      evidence.earlierContext,
      'opponent',
      {
        item:
          earlierCandidate.build.item,

        ability:
          earlierCandidate.build.ability,
      },
    );

  const laterResult =
    calculateInferenceSpeed(
      laterCandidate.build,
      evidence.laterContext,
      'opponent',
      {
        item:
          laterCandidate.build.item,

        ability:
          laterCandidate.build.ability,
      },
    );

  if (
    !earlierResult.supported ||
    !laterResult.supported ||
    earlierResult.effectiveSpeed === null ||
    laterResult.effectiveSpeed === null
  ) {
    return {
      supported: false,
      compatible: true,

      earlierSpeed:
        earlierResult.effectiveSpeed,

      laterSpeed:
        laterResult.effectiveSpeed,

      reason: [
        earlierResult.reason,
        laterResult.reason,
      ]
        .filter(Boolean)
        .join(' '),
    };
  }

  const compatible =
    satisfiesRelation(
      evidence,
      earlierResult.effectiveSpeed,
      laterResult.effectiveSpeed,
    );

  return {
    supported: true,
    compatible,

    earlierSpeed:
      earlierResult.effectiveSpeed,

    laterSpeed:
      laterResult.effectiveSpeed,

    reason: compatible
      ? ''
      : 'The candidate pair contradicts the observed move order.',
  };
}