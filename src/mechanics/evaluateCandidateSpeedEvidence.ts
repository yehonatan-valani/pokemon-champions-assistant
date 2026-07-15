import type {
  ActionOrderContext,
  BattleActorReference,
} from '../domain/battleAction';

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
  calculateInferenceSpeed,
  type InferenceSpeedResult,
} from './calculateInferenceSpeed';

export interface CandidateSpeedEvaluation {
  compatible: boolean;
  rejections: CandidateRejection[];
  usableEvidenceCount: number;
  ignoredEvidenceCount: number;
}

function isCandidateActor(
  actor: BattleActorReference,
  opponentPokemonIndex: number,
): boolean {
  return (
    actor.side === 'opponent' &&
    actor.pokemonIndex ===
      opponentPokemonIndex
  );
}

function resolveActorSpeed(
  battle: BattleState,
  candidate: OpponentSetCandidate,
  opponentPokemonIndex: number,
  actor: BattleActorReference,
  context: ActionOrderContext,
): InferenceSpeedResult | null {
  if (actor.side === 'player') {
    const pokemon =
      battle.playerPokemon[
        actor.pokemonIndex
      ];

    if (!pokemon) {
      return null;
    }

    return calculateInferenceSpeed(
      pokemon.build,
      context,
      'player',
      {
        item:
          context.knownItem ||
          pokemon.build.item,

        ability:
          context.knownAbility ||
          pokemon.build.ability,
      },
    );
  }

  if (
    actor.pokemonIndex !==
    opponentPokemonIndex
  ) {
    return null;
  }

  return calculateInferenceSpeed(
    candidate.build,
    context,
    'opponent',
    {
      item: candidate.build.item,
      ability:
        candidate.build.ability,
    },
  );
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

function relationSymbol(
  evidence: SpeedEvidence,
): string {
  return evidence.relation ===
    'greater-than-or-equal'
    ? '≥'
    : '≤';
}

export function evaluateCandidateSpeedEvidence(
  battle: BattleState,
  candidate: OpponentSetCandidate,
  opponentPokemonIndex: number,
  evidenceEntries: SpeedEvidence[],
): CandidateSpeedEvaluation {
  const rejections: CandidateRejection[] =
    [];

  let usableEvidenceCount = 0;
  let ignoredEvidenceCount = 0;

  for (const evidence of evidenceEntries) {
    const candidateIsEarlier =
      isCandidateActor(
        evidence.earlierActor,
        opponentPokemonIndex,
      );

    const candidateIsLater =
      isCandidateActor(
        evidence.laterActor,
        opponentPokemonIndex,
      );

    if (
      !candidateIsEarlier &&
      !candidateIsLater
    ) {
      continue;
    }

    const otherActor =
      candidateIsEarlier
        ? evidence.laterActor
        : evidence.earlierActor;

    /*
     * Opponent-vs-opponent evidence requires
     * evaluating two unknown candidates
     * together. That will be added later.
     */
    if (otherActor.side !== 'player') {
      ignoredEvidenceCount += 1;
      continue;
    }

    const earlierResult =
      resolveActorSpeed(
        battle,
        candidate,
        opponentPokemonIndex,
        evidence.earlierActor,
        evidence.earlierContext,
      );

    const laterResult =
      resolveActorSpeed(
        battle,
        candidate,
        opponentPokemonIndex,
        evidence.laterActor,
        evidence.laterContext,
      );

    if (
      !earlierResult ||
      !laterResult ||
      !earlierResult.supported ||
      !laterResult.supported ||
      earlierResult.effectiveSpeed ===
        null ||
      laterResult.effectiveSpeed === null
    ) {
      ignoredEvidenceCount += 1;
      continue;
    }

    usableEvidenceCount += 1;

    if (
      satisfiesRelation(
        evidence,
        earlierResult.effectiveSpeed,
        laterResult.effectiveSpeed,
      )
    ) {
      continue;
    }

    rejections.push({
      code: 'speed',

      message: [
        `Turn ${evidence.turnNumber}: `,
        `${evidence.earlierPokemonName} acted before `,
        `${evidence.laterPokemonName}, requiring `,
        `${evidence.earlierPokemonName} effective Speed `,
        `${relationSymbol(evidence)} `,
        `${evidence.laterPokemonName} effective Speed. `,
        `This candidate gives `,
        `${earlierResult.effectiveSpeed} `,
        `${relationSymbol(evidence)} `,
        `${laterResult.effectiveSpeed}, which is false.`,
      ].join(''),
    });
  }

  return {
    compatible: rejections.length === 0,
    rejections,
    usableEvidenceCount,
    ignoredEvidenceCount,
  };
}