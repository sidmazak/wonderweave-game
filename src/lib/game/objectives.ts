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
