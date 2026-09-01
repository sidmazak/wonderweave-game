import { CHAPTERS, getLevel, TOTAL_LEVELS } from './levels'
import type { LevelDef } from './types'

/** Local date key YYYY-MM-DD (the player's own timezone). */
export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function yesterdayKey(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return dateKey(d)
}

/** Human readable date like "May 24, 2025". */
export function prettyDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Deterministic daily stage derived from the calendar date.
 * Fair but spicier than campaign stages: mixed objective, generous moves.
 */
export function getDailyLevel(dateKeyStr: string): LevelDef {
  const seed = hashString(`ww-daily-${dateKeyStr}`)
  const ch = CHAPTERS[seed % CHAPTERS.length]
  // start from a mid-game campaign level for texture, then mutate
  const base = getLevel(37 + (seed % 60))
  const moves = 24 + (seed % 5)
  const rng = (seed >>> 3) % 100

  let objective = base.objective
  if (rng < 45) {
    objective = { kind: 'score', score: Math.round((base.star2 ?? 3000) * 0.95) }
  }

  return {
    id: 0,
    chapter: 0,
    index: 0,
    name: ch.title,
    moves,
    rows: 7,
    cols: 7,
    types: base.types,
    objective,
    star2: Math.round(base.star2 * 0.9),
    star3: Math.round(base.star3 * 0.9),
    hint: `Today's page of the Folio — ${ch.tagline.toLowerCase()}.`,
  }
}

export function dailyRewardFor(streak: number): { lumens: number; lens: number; null: number } {
  return {
    lumens: 100 + Math.min(7, streak - 1 >= 0 ? streak - 1 : 0) * 15,
    lens: 1,
    null: 1,
  }
}

export const DAILY_TOTAL_STAGES = TOTAL_LEVELS // informational
