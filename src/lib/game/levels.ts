import type { CollectGoal, LevelDef, TileType } from './types'

/**
 * 12 chapters across the Forgotten World, 12 stages each (144 total).
 * Levels are generated deterministically from the level id, so every player
 * gets the exact same hand-tuned-feeling stage on every device.
 */

export interface ChapterDef {
  id: number
  /** roman numeral for display: I..XII */
  numeral: string
  title: string
  /** background asset key */
  bg: string
  /** short poetic line for the atlas */
  tagline: string
  /** flavor hints used by generated levels */
  hints: string[]
}

export const CHAPTERS: ChapterDef[] = [
  {
    id: 1,
    numeral: 'I',
    title: 'The Skyreach Isles',
    bg: 'bg-sky',
    tagline: 'Where the first threads caught the wind',
    hints: [
      'Match 3 or more Woven Charms to gather Lumin Threads.',
      'Swap two neighbouring charms to weave a thread.',
      'Cascades multiply your score — look for falling threads.',
    ],
  },
  {
    id: 2,
    numeral: 'II',
    title: 'The Whispering Woods',
    bg: 'bg-forest',
    tagline: 'The leaves remember every story',
    hints: [
      'Match 4 in a row to forge a Striped Charm.',
      'Striped charms clear whole rows or columns.',
      'The woods reward patient weavers.',
    ],
  },
  {
    id: 3,
    numeral: 'III',
    title: 'Moonlit Vale',
    bg: 'bg-night',
    tagline: 'Dew gathers where the moon lingers',
    hints: [
      'Match 5 to weave the Rainbow Prism.',
      'The Prism drinks a whole colour from the loom.',
      'Moonlight favours the bold.',
    ],
  },
  {
    id: 4,
    numeral: 'IV',
    title: 'Ember Falls',
    bg: 'bg-sunset',
    tagline: 'Sparks climb the falling water',
    hints: [
      'Match in an L or T shape to forge a Charm Burst.',
      'Charms detonate in a radiant ring.',
      'Combine two specials for astonishing weaves.',
    ],
  },
  {
    id: 5,
    numeral: 'V',
    title: 'Crystal Ridge',
    bg: 'bg-arch',
    tagline: 'The ridge hums a crystalline chord',
    hints: [
      'Striped + Striped weaves a cross of light.',
      'Prism + Striped turns every thread of a kind.',
      'Ride the cascades, Weaver.',
    ],
  },
  {
    id: 6,
    numeral: 'VI',
    title: 'The Floating Sea',
    bg: 'bg-sky',
    tagline: 'Islands drift like sleeping whales',
    hints: [
      'Every thread you weave feeds the Folio.',
      'Save high-value specials for the final moves.',
      'The tide brings fresh charms — watch it flow.',
    ],
  },
  {
    id: 7,
    numeral: 'VII',
    title: 'Lanternwick Hollow',
    bg: 'bg-altar',
    tagline: 'A thousand lanterns, one slow flame',
    hints: [
      'The hollow asks for many kinds of threads.',
      'Prism + Prism unravels the whole loom.',
      'Keep three goals in your lantern light.',
    ],
  },
  {
    id: 8,
    numeral: 'VIII',
    title: 'Sporecap Wilds',
    bg: 'bg-forest',
    tagline: 'Mushrooms light the undergrowth',
    hints: [
      'Spores drift where charms fall — follow them.',
      'Charms dropped from cascades still count.',
      'The wilds reward gentle hands.',
    ],
  },
  {
    id: 9,
    numeral: 'IX',
    title: 'The Ruined Folio',
    bg: 'bg-ruins',
    tagline: 'Torn pages still hold their spells',
    hints: [
      'Old magic runs thin — weave carefully.',
      'Big shapes make big threads.',
      'Mend the pages one stage at a time.',
    ],
  },
  {
    id: 10,
    numeral: 'X',
    title: 'Thunderspire',
    bg: 'bg-night',
    tagline: 'The spire counts the storm',
    hints: [
      'The spire demands mastery of every charm.',
      'Stripes cross, bursts bloom, prisms sing.',
      'The storm obeys a steady loom.',
    ],
  },
  {
    id: 11,
    numeral: 'XI',
    title: 'The Celestial Archive',
    bg: 'bg-arch',
    tagline: 'Constellations filed by subject',
    hints: [
      'The Archive tests every thread you know.',
      'Weave specials together for astonishing results.',
      'A harmonious balance awaits the patient.',
    ],
  },
  {
    id: 12,
    numeral: 'XII',
    title: 'The First Loom',
    bg: 'bg-castle',
    tagline: 'Where the world was first woven',
    hints: [
      'The First Loom awaits the final tapestry.',
      'All eight charms answer to your hand.',
      'Finish the tapestry, Weaver.',
    ],
  },
]

export const LEVELS_PER_CHAPTER = 12
export const TOTAL_CHAPTERS = CHAPTERS.length
export const TOTAL_LEVELS = TOTAL_CHAPTERS * LEVELS_PER_CHAPTER

export function chapterOf(levelId: number): ChapterDef {
  const ch = Math.min(TOTAL_CHAPTERS, Math.max(1, Math.ceil(levelId / LEVELS_PER_CHAPTER)))
  return CHAPTERS[ch - 1]
}

export function levelLabel(chapter: number, index: number): string {
  return `${chapter}-${index}`
}

export function stageTitle(level: Pick<LevelDef, 'chapter' | 'id' | 'name'>): string {
  if (level.chapter === 0) return 'Daily Folio'
  return `${level.chapter}-${((level.id - 1) % LEVELS_PER_CHAPTER) + 1}`
}

/* ---------------- deterministic level generation ---------------- */

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
  // gentle ramp: 4 kinds at first, all 8 by the final chapters
  const count = 4 + Math.min(4, Math.floor((levelId - 1) / 30))
  return TYPE_POOL.slice(0, count)
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

export function getLevel(levelId: number): LevelDef {
  const id = Math.min(TOTAL_LEVELS, Math.max(1, Math.round(levelId)))
  const cached = cache.get(id)
  if (cached) return cached

  const rng = mulberry32(id * 7919 + 41)
  const ch = chapterOf(id)
  const index = ((id - 1) % LEVELS_PER_CHAPTER) + 1
  const d = (id - 1) / (TOTAL_LEVELS - 1) // difficulty 0..1
  const types = typesForLevel(id)
  const size = sizeForLevel(id)

  const moves = 24 - Math.round(d * 6) + Math.floor(rng() * 5) // ~24 → ~18 (+jitter)

  // choose objective template
  const roll = rng()
  let objective: LevelDef['objective']
  if (roll < 0.28) {
    const target = round100(moves * 82 * (1.05 + d * 0.85))
    objective = { kind: 'score', score: target }
  } else {
    const goalCount = roll < 0.62 ? 1 : roll < 0.9 ? 2 : 3
    // pick distinct goal types, biased towards types in play
    const pool = [...types]
    const goals: CollectGoal[] = []
    const share = goalCount === 1 ? 1 : goalCount === 2 ? 0.82 : 0.66
    const expect = (moves * 3.5 * share) / types.length
    for (let i = 0; i < goalCount; i++) {
      const pick = pool.splice(Math.floor(rng() * pool.length), 1)[0]
      const count = Math.max(10, Math.min(48, Math.round(expect * (0.9 + rng() * 0.35))))
      goals.push({ type: pick, count })
    }
    objective = { kind: 'collect', collect: goals }
  }

  const base = objective.kind === 'score' ? (objective.score ?? 2000) : moves * 72
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
    hint: ch.hints[(index - 1) % ch.hints.length],
  }
  cache.set(id, def)
  return def
}

export function chapterLevelIds(chapterId: number): number[] {
  const start = (chapterId - 1) * LEVELS_PER_CHAPTER + 1
  return Array.from({ length: LEVELS_PER_CHAPTER }, (_, i) => start + i)
}

export function nextLevelId(levelId: number): number | null {
  return levelId < TOTAL_LEVELS ? levelId + 1 : null
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
