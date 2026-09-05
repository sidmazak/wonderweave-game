import type { LevelDef } from './types'

/** Minimum score to clear a score-based stage. */
export function scoreObjectiveTarget(level: LevelDef): number {
  const obj = level.objective
  if (obj.kind === 'score') return obj.score ?? level.star3
  return level.star2
}

/** Short HUD label for a score goal (not tile collection). */
export function scoreGoalLabel(target: number): string {
  return `Reach ${target.toLocaleString()} pts`
}

/** Clarifies that score goals are not tied to a specific board tile. */
export const SCORE_GOAL_HINT = 'Any charm matches count'

/** Whether the player has met the win condition for this stage. */
export function isObjectiveMet(
  level: LevelDef,
  score: number,
  collected: Partial<Record<string, number>>,
): boolean {
  const obj = level.objective
  if (obj.kind === 'score') return score >= (obj.score ?? Infinity)
  return (obj.collect ?? []).every((goal) => (collected[goal.type] ?? 0) >= goal.count)
}

/** Live star-rating progress shown under the score box (pass, 2★, 3★). */
export function starRatingProgress(
  level: LevelDef,
  score: number,
  collected: Partial<Record<string, number>>,
): [boolean, boolean, boolean] {
  const passed = isObjectiveMet(level, score, collected)
  return [passed, score >= level.star2, score >= level.star3]
}

/* -------------------------------------------------------------------------
 * End-of-stage resolution.
 *
 * Kept here as pure functions rather than inline in PlayScreen so the win,
 * lose and star rules are testable without mounting the board — the lose path
 * in particular is impractical to reach reliably in a UI test, because a large
 * cascade usually clears the objective before the moves run out.
 * ---------------------------------------------------------------------- */

/** Points awarded per unused move when a stage is sealed. */
export const SPARE_MOVE_BONUS = 100

export type LevelOutcome = 'playing' | 'won' | 'lost'

/**
 * The stage verdict after a move has fully resolved. Meeting the objective wins
 * even on the last move; running out of moves without meeting it loses.
 */
export function levelOutcome(
  level: LevelDef,
  score: number,
  movesLeft: number,
  collected: Partial<Record<string, number>>,
): LevelOutcome {
  if (isObjectiveMet(level, score, collected)) return 'won'
  if (movesLeft <= 0) return 'lost'
  return 'playing'
}

/** Final score including the spare-move bonus (winners only). */
export function finalScoreFor(score: number, movesLeft: number, won: boolean): number {
  return score + (won ? Math.max(0, movesLeft) * SPARE_MOVE_BONUS : 0)
}

/** Stars for a finished stage: 0 on a loss, otherwise 1–3 by final score. */
export function starsFor(level: LevelDef, finalScore: number, won: boolean): number {
  if (!won) return 0
  if (finalScore >= level.star3) return 3
  if (finalScore >= level.star2) return 2
  return 1
}
