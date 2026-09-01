import type { LevelDef, TileType } from './types'

/**
 * 12 chapters of the Forgotten World.
 * Early levels use fewer tile types (easier), later ones mix all seven.
 */
export const LEVELS: LevelDef[] = [
  {
    id: 1,
    name: 'The Verdance Isles',
    moves: 20,
    rows: 8,
    cols: 8,
    types: ['leaf', 'drop', 'flame', 'star', 'flower'],
    objective: { kind: 'score', score: 1500 },
    star2: 2600,
    star3: 4000,
    hint: 'Match 3 or more Woven Charms to gather Lumin Threads.',
  },
  {
    id: 2,
    name: 'Mistfall Vale',
    moves: 24,
    rows: 8,
    cols: 8,
    types: ['leaf', 'drop', 'flame', 'star', 'flower'],
    objective: {
      kind: 'collect',
      collect: [
        { type: 'leaf', count: 18 },
        { type: 'drop', count: 18 },
      ],
    },
    star2: 2200,
    star3: 3600,
    hint: 'The vale asks for leaves and dewdrops. Gather them!',
  },
  {
    id: 3,
    name: 'Crystal Ridge',
    moves: 20,
    rows: 8,
    cols: 8,
    types: ['leaf', 'drop', 'flame', 'star', 'flower', 'gem'],
    objective: { kind: 'score', score: 3000 },
    star2: 5200,
    star3: 8000,
    hint: 'Match 4 in a row to forge a Striped Charm.',
  },
  {
    id: 4,
    name: 'Emberlight Grove',
    moves: 24,
    rows: 8,
    cols: 8,
    types: ['leaf', 'drop', 'flame', 'star', 'flower', 'gem'],
    objective: {
      kind: 'collect',
      collect: [
        { type: 'star', count: 16 },
        { type: 'flame', count: 20 },
      ],
    },
    star2: 2600,
    star3: 4200,
    hint: 'Flames and starlight will rekindle the old lanterns.',
  },
  {
    id: 5,
    name: 'The Floating Sea',
    moves: 22,
    rows: 8,
    cols: 8,
    types: ['leaf', 'drop', 'flame', 'star', 'flower', 'gem'],
    objective: { kind: 'score', score: 4500 },
    star2: 7500,
    star3: 11000,
    hint: 'Cascades multiply your score. Seek the falling threads!',
  },
  {
    id: 6,
    name: 'Petalwind Gardens',
    moves: 26,
    rows: 8,
    cols: 8,
    types: ['leaf', 'drop', 'flame', 'star', 'flower', 'gem', 'mushroom'],
    objective: {
      kind: 'collect',
      collect: [
        { type: 'flower', count: 24 },
        { type: 'gem', count: 24 },
      ],
    },
    star2: 3000,
    star3: 5000,
    hint: 'Bloom flowers and unearth buried gems.',
  },
  {
    id: 7,
    name: 'Lanternwick Hollow',
    moves: 24,
    rows: 8,
    cols: 8,
    types: ['leaf', 'drop', 'flame', 'star', 'flower', 'gem', 'mushroom'],
    objective: { kind: 'score', score: 6500 },
    star2: 10500,
    star3: 15000,
    hint: 'Match 5 to weave the Rainbow Prism — it clears a whole color!',
  },
  {
    id: 8,
    name: 'Sporecap Wilds',
    moves: 26,
    rows: 8,
    cols: 8,
    types: ['leaf', 'drop', 'flame', 'star', 'flower', 'gem', 'mushroom'],
    objective: {
      kind: 'collect',
      collect: [
        { type: 'mushroom', count: 28 },
        { type: 'star', count: 20 },
      ],
    },
    star2: 3200,
    star3: 5400,
    hint: 'The wilds abound with spores. Harvest them gently.',
  },
  {
    id: 9,
    name: 'Moonwell Sanctum',
    moves: 24,
    rows: 8,
    cols: 8,
    types: ['leaf', 'drop', 'flame', 'star', 'flower', 'gem', 'mushroom'],
    objective: { kind: 'score', score: 9000 },
    star2: 14000,
    star3: 20000,
    hint: 'The moonwell rewards bold weavers. Chain big combos!',
  },
  {
    id: 10,
    name: 'Thunderspire',
    moves: 28,
    rows: 8,
    cols: 8,
    types: ['leaf', 'drop', 'flame', 'star', 'flower', 'gem', 'mushroom'],
    objective: {
      kind: 'collect',
      collect: [
        { type: 'drop', count: 36 },
        { type: 'leaf', count: 36 },
        { type: 'flame', count: 24 },
      ],
    },
    star2: 3800,
    star3: 6200,
    hint: 'A storm of threads! Keep your eye on all three.',
  },
  {
    id: 11,
    name: 'The Celestial Atlas',
    moves: 26,
    rows: 8,
    cols: 8,
    types: ['leaf', 'drop', 'flame', 'star', 'flower', 'gem', 'mushroom'],
    objective: { kind: 'score', score: 13000 },
    star2: 20000,
    star3: 28000,
    hint: 'Weave specials together for astonishing results.',
  },
  {
    id: 12,
    name: 'The First Loom',
    moves: 30,
    rows: 8,
    cols: 8,
    types: ['leaf', 'drop', 'flame', 'star', 'flower', 'gem', 'mushroom'],
    objective: {
      kind: 'collect',
      collect: [
        { type: 'star', count: 44 },
        { type: 'flower', count: 30 },
        { type: 'gem', count: 30 },
      ],
    },
    star2: 4600,
    star3: 7600,
    hint: 'The First Loom awaits. Finish the tapestry, Weaver!',
  },
]

export const TOTAL_LEVELS = LEVELS.length

export function getLevel(id: number): LevelDef {
  return LEVELS[Math.max(0, Math.min(LEVELS.length - 1, id - 1))]
}

export const TILE_META: Record<TileType, { name: string }> = {
  leaf: { name: 'Verdant Leaf' },
  drop: { name: 'Dewdrop' },
  flame: { name: 'Ember' },
  star: { name: 'Stellar Charm' },
  flower: { name: 'Bloom' },
  mushroom: { name: 'Sporecap' },
  gem: { name: 'Frost Gem' },
}
