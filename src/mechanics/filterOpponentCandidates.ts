import { toID } from '@smogon/calc';

import type {
  OpponentBattlePokemonState,
} from '../domain/battleState';

import type {
  CandidateRejection,
  OpponentCandidateEvaluation,
  OpponentSetCandidate,
} from '../domain/opponentCandidate';

function namesMatch(
  firstName: string,
  secondName: string,
): boolean {
  return (
    toID(firstName) === toID(secondName)
  );
}

export function getCandidatesForSpecies(
  candidates: OpponentSetCandidate[],
  species: string,
): OpponentSetCandidate[] {
  return candidates.filter((candidate) =>
    namesMatch(
      candidate.build.species,
      species,
    ),
  );
}

export function evaluateOpponentCandidate(
  candidate: OpponentSetCandidate,
  observation: OpponentBattlePokemonState,
): OpponentCandidateEvaluation {
  const rejections: CandidateRejection[] =
    [];

  if (
    !namesMatch(
      candidate.build.species,
      observation.species,
    )
  ) {
    rejections.push({
      code: 'species',
      message: `Candidate species is ${candidate.build.species}, not ${observation.species}.`,
    });
  }

  for (
    const revealedMove
    of observation.revealedMoves
  ) {
    const candidateHasMove =
      candidate.build.moves.some(
        (candidateMove) =>
          namesMatch(
            candidateMove,
            revealedMove,
          ),
      );

    if (!candidateHasMove) {
      rejections.push({
        code: 'move',
        message: `Does not contain the revealed move ${revealedMove}.`,
      });
    }
  }

  if (
    observation.revealedItem &&
    !namesMatch(
      candidate.build.item,
      observation.revealedItem,
    )
  ) {
    rejections.push({
      code: 'item',
      message: `Uses ${candidate.build.item || 'no item'}, not the revealed item ${observation.revealedItem}.`,
    });
  }

  if (
    observation.revealedAbility &&
    !namesMatch(
      candidate.build.ability,
      observation.revealedAbility,
    )
  ) {
    rejections.push({
      code: 'ability',
      message: `Uses ${candidate.build.ability}, not the revealed ability ${observation.revealedAbility}.`,
    });
  }

  return {
    candidate,
    compatible: rejections.length === 0,
    rejections,
  };
}

export function evaluateOpponentCandidates(
  candidates: OpponentSetCandidate[],
  observation: OpponentBattlePokemonState,
): OpponentCandidateEvaluation[] {
  return candidates.map((candidate) =>
    evaluateOpponentCandidate(
      candidate,
      observation,
    ),
  );
}

export function filterOpponentCandidates(
  candidates: OpponentSetCandidate[],
  observation: OpponentBattlePokemonState,
): OpponentSetCandidate[] {
  return evaluateOpponentCandidates(
    candidates,
    observation,
  )
    .filter(
      (evaluation) =>
        evaluation.compatible,
    )
    .map(
      (evaluation) =>
        evaluation.candidate,
    );
}