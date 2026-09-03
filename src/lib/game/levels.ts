import type { CollectGoal, LevelDef, TileType } from './types'

/**
 * The Forgotten World weaves endlessly: 12 hand-authored themes cycle forever,
 * 12 stages per chapter. Levels are generated deterministically from the level
 * id, so every player gets the exact same hand-tuned-feeling stage on every
 * device — and the journey never has to end.
 */

export interface ChapterDef {
  id: number
  /** roman numeral for display: I, II … XLII … */
  numeral: string
  title: string
  /** background asset key */
  bg: string
  /** short poetic line for the atlas */
  tagline: string
  /** cycle marker for chapters beyond the first lap ("Echo II" and beyond) */
  echo: number
}

const CORE_THEMES: Omit<ChapterDef, 'id' | 'numeral' | 'echo'>[] = [
  {
    title: 'The Skyreach Isles',
    bg: 'bg-sky',
    tagline: 'Where the first threads caught the wind',
  },
  {
    title: 'The Whispering Woods',
    bg: 'bg-forest',
    tagline: 'The leaves remember every story',
  },
  {
    title: 'Moonlit Vale',
    bg: 'bg-night',
    tagline: 'Dew gathers where the moon lingers',
  },
  {
    title: 'Ember Falls',
    bg: 'bg-sunset',
    tagline: 'Sparks climb the falling water',
  },
  {
    title: 'Crystal Ridge',
    bg: 'bg-arch',
    tagline: 'The ridge hums a crystalline chord',
  },
  {
    title: 'The Floating Sea',
    bg: 'bg-sky',
    tagline: 'Islands drift like sleeping whales',
  },
  {
    title: 'Lanternwick Hollow',
    bg: 'bg-altar',
    tagline: 'A thousand lanterns, one slow flame',
  },
  {
    title: 'Sporecap Wilds',
    bg: 'bg-forest',
    tagline: 'Mushrooms light the undergrowth',
  },
  {
    title: 'The Ruined Folio',
    bg: 'bg-ruins',
    tagline: 'Torn pages still hold their spells',
  },
  {
    title: 'Thunderspire',
    bg: 'bg-night',
    tagline: 'The spire counts the storm',
  },
  {
    title: 'The Celestial Archive',
    bg: 'bg-arch',
    tagline: 'Constellations filed by subject',
  },
  {
    title: 'The First Loom',
    bg: 'bg-castle',
    tagline: 'Where the world was first woven',
  },
]

export const LEVELS_PER_CHAPTER = 12
/** Number of distinct themes before the world begins its echo. */
export const TOTAL_CHAPTERS = CORE_THEMES.length
/** Level id where the first lap ends (informational / lore unlocks). */
export const CORE_LEVELS = TOTAL_CHAPTERS * LEVELS_PER_CHAPTER

/* ---------------- roman numerals for any chapter ---------------- */

const ROMAN_STEPS: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
]

export function romanNumeral(n: number): string {
  let rest = Math.max(1, Math.round(n))
  let out = ''
  for (const [v, s] of ROMAN_STEPS) {
    while (rest >= v) {
      out += s
      rest -= v
    }
  }
  return out
}

const ECHO_NAMES = ['', '', 'Echo II', 'Echo III', 'Echo IV', 'Echo V', 'Echo VI', 'Echo VII', 'Echo VIII', 'Echo IX', 'Echo X']

const chapterCache = new Map<number, ChapterDef>()

/** Chapter definition for ANY chapter id ≥ 1 — themes cycle with an "Echo" marker. */
export function chapterDef(chapterId: number): ChapterDef {
  const id = Math.max(1, Math.round(chapterId))
  const cached = chapterCache.get(id)
  if (cached) return cached
  const lap = Math.floor((id - 1) / TOTAL_CHAPTERS) // 0-based
  const core = CORE_THEMES[(id - 1) % TOTAL_CHAPTERS]
  const echo = lap + 1
  const def: ChapterDef = {
    id,
    numeral: romanNumeral(id),
    title: echo > 1 ? `${core.title} — ${ECHO_NAMES[Math.min(echo, ECHO_NAMES.length - 1)] ?? `Echo ${echo}`}` : core.title,
    bg: core.bg,
    tagline: core.tagline,
    echo,
  }
  chapterCache.set(id, def)
  return def
}

/** Alias kept for older call-sites. */
export const CHAPTERS: ChapterDef[] = Array.from({ length: TOTAL_CHAPTERS }, (_, i) => chapterDef(i + 1))

export function chapterOf(levelId: number): ChapterDef {
  if (levelId <= 0) return chapterDef(1)
  return chapterDef(Math.ceil(levelId / LEVELS_PER_CHAPTER))
}

export function levelLabel(chapter: number, index: number): string {
  return `${chapter}-${index}`
}

export function stageTitle(level: Pick<LevelDef, 'chapter' | 'id' | 'name'>): string {
  if (level.chapter === 0) return 'Daily Folio'
  return `${level.chapter}-${((level.id - 1) % LEVELS_PER_CHAPTER) + 1}`
}

/** Stage index within its chapter (1–12). */
export function stageInChapter(levelId: number): number {
  return ((Math.max(1, levelId) - 1) % LEVELS_PER_CHAPTER) + 1
}

/** Home HUD pill label — chapter-stage, e.g. 1-2. */
export function stagePillLabel(levelId: number): string {
  const ch = chapterOf(levelId)
  return `${ch.id}-${stageInChapter(levelId)}`
}

/** Chapter island / landmark art used on the chapter map (not the full-screen bg). */
export function chapterDecoKey(bg: string): string {
  switch (bg) {
    case 'bg-forest':
      return 'deco-tree'
    case 'bg-night':
      return 'deco-moon'
    case 'bg-sunset':
      return 'deco-waterfall'
    case 'bg-arch':
      return 'deco-arch'
    case 'bg-altar':
      return 'deco-lamp'
    case 'bg-ruins':
      return 'deco-sign'
    case 'bg-castle':
      return 'deco-platform'
    default:
      return 'deco-island'
  }
}

export function chapterLevelIds(chapterId: number): number[] {
  const start = (Math.max(1, chapterId) - 1) * LEVELS_PER_CHAPTER + 1
  return Array.from({ length: LEVELS_PER_CHAPTER }, (_, i) => start + i)
}

export function chapterStarMax(chapterId: number): number {
  return chapterLevelIds(chapterId).length * 3
}

export function nextLevelId(levelId: number): number {
  return Math.max(1, levelId) + 1
}

/* ---------------- deterministic level generation (endless) ---------------- */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const TYPE_POOL: TileType[] = ['leaf', 'drop', 'flame', 'star', 'flower', 'gem', 'mushroom', 'orb']

function typesForLevel(levelId: number): TileType[] {
  const count = 4 + Math.min(4, Math.floor((levelId - 1) / 18))
  const ch = chapterOf(levelId)
  const stage = ((levelId - 1) % LEVELS_PER_CHAPTER) + 1
  // rotate palette by chapter + stage so every level feels distinct
  const rot = (ch.id * 2 + stage) % TYPE_POOL.length
  const slice = TYPE_POOL.slice(0, count)
  return slice.slice(rot).concat(slice.slice(0, rot))
}

/** Play-screen backdrop — always the chapter's own scenery. */
export function playBgForLevel(levelId: number): string {
  if (levelId <= 0) return 'bg-sunset'
  return chapterOf(levelId).bg
}

/** Fallback fill behind scaled backdrop art (hides rounded-corner exports). */
export function chapterBackdropTint(bg: string): string {
  switch (bg) {
    case 'bg-forest':
      return '#1a3422'
    case 'bg-night':
      return '#0d1830'
    case 'bg-sunset':
      return '#3d1a2e'
    case 'bg-arch':
      return '#1e2848'
    case 'bg-altar':
      return '#2a1a10'
    case 'bg-ruins':
      return '#1a1814'
    case 'bg-castle':
      return '#1a2838'
    case 'bg-map':
      return '#c9b080'
    default:
      return '#1a4068'
  }
}

function sizeForLevel(levelId: number): number {
  // odd chapters weave 8-wide looms, even chapters tighter 7-wide boards
  const ch = chapterOf(levelId).id
  return ch % 2 === 1 ? 8 : 7
}

function round100(n: number): number {
  return Math.max(100, Math.round(n / 100) * 100)
}

const cache = new Map<number, LevelDef>()

/** Level definition for ANY id ≥ 1 — the tapestry never ends. */
export function getLevel(levelId: number): LevelDef {
  const id = Math.max(1, Math.round(levelId))
  const cached = cache.get(id)
  if (cached) return cached

  const rng = mulberry32(id * 7919 + 41)
  const ch = chapterOf(id)
  const index = ((id - 1) % LEVELS_PER_CHAPTER) + 1
  // smooth difficulty that keeps creeping forever (asymptote 1)
  const d = 1 - Math.exp(-(id - 1) / 110)
  const endless = Math.max(0, (id - CORE_LEVELS) / CORE_LEVELS) // extra pressure after lap one
  const types = typesForLevel(id)
  const size = sizeForLevel(id)

  const moves = 24 - Math.round(d * 7) + Math.floor(rng() * 4) // ~24 → ~17 (+jitter)

  // choose objective template
  const roll = rng()
  let objective: LevelDef['objective']
  if (roll < 0.3) {
    const target = round100(moves * 82 * (1.05 + d * 0.85 + Math.min(0.7, endless * 1.4)))
    objective = { kind: 'score', score: target }
  } else {
    const goalCount = roll < 0.6 ? 1 : roll < 0.88 ? 2 : 3
    // pick distinct goal types, biased towards types in play
    const pool = [...types]
    const goals: CollectGoal[] = []
    const share = goalCount === 1 ? 1 : goalCount === 2 ? 0.84 : 0.68
    const expect = (moves * (3.5 + Math.min(1.6, endless * 3.2)) * share) / types.length
    for (let i = 0; i < goalCount; i++) {
      const pick = pool.splice(Math.floor(rng() * pool.length), 1)[0]
      const count = Math.max(10, Math.min(56, Math.round(expect * (0.9 + rng() * 0.35))))
      goals.push({ type: pick, count })
    }
    objective = { kind: 'collect', collect: goals }
  }

  const base = objective.kind === 'score' ? (objective.score ?? 2000) : moves * 74
  const star2 = round100(base * (objective.kind === 'score' ? 1.55 : 1.25))
  const star3 = round100(base * (objective.kind === 'score' ? 2.15 : 1.7))

  const def: LevelDef = {
    id,
    chapter: ch.id,
    index,
    name: ch.title,
    moves,
    rows: size,
    cols: size,
    types,
    objective,
    star2,
    star3,
    hint: ch.tagline,
  }
  cache.set(id, def)
  return def
}

/* ---------------- tile display metadata ---------------- */

export const TILE_META: Record<TileType, { name: string; sub: string; lumen: string }> = {
  leaf: { name: 'Verdant Leaf', sub: 'Root of Being', lumen: 'TERRA' },
  drop: { name: 'Dewdrop', sub: 'Flow of Time', lumen: 'AQUA' },
  flame: { name: 'Ember', sub: 'Spark of Life', lumen: 'IGNIS' },
  star: { name: 'Stellar Charm', sub: 'Heart of Light', lumen: 'LUX' },
  flower: { name: 'Bloom', sub: 'Breath of Sky', lumen: 'VENTUS' },
  mushroom: { name: 'Sporecap', sub: 'Veil of Night', lumen: 'UMBRA' },
  gem: { name: 'Frost Gem', sub: "Mind's Mirror", lumen: 'MERCUR' },
  orb: { name: 'Woven Orb', sub: 'Heart of Iron', lumen: 'FERRUM' },
}
