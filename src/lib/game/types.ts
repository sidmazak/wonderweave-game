// Wonderweave — core game types

export type TileType =
  | 'leaf'
  | 'drop'
  | 'flame'
  | 'star'
  | 'flower'
  | 'mushroom'
  | 'gem'
  | 'orb'

export const ALL_TILE_TYPES: TileType[] = ['leaf', 'drop', 'flame', 'star', 'flower', 'gem', 'mushroom', 'orb']

export type Special = 'none' | 'lineH' | 'lineV' | 'bomb' | 'prism'

export interface Tile {
  id: number
  type: TileType
  special: Special
  /** set while the tile is being destroyed (pop animation) */
  clearing?: boolean
  /** true for tiles created by refill (used for drop-in animation) */
  spawned?: boolean
  /** how many cells above its landing spot a refilled tile starts (column depth) */
  spawnDrop?: number
}

export type Grid = (Tile | null)[][] // grid[row][col]

export interface Cell {
  r: number
  c: number
}

export type ShapeKind = 'three' | 'lineH' | 'lineV' | 'bomb' | 'prism'

export interface Shape {
  kind: ShapeKind
  cells: Cell[]
  /** where the special tile is promoted */
  pivot: Cell
  type: TileType
}

export type ObjectiveKind = 'score' | 'collect'

export interface CollectGoal {
  type: TileType
  count: number
}

export interface LevelDef {
  /** global level id 1..144; 0 = daily challenge */
  id: number
  /** chapter number 1..12; 0 = daily */
  chapter: number
  /** 1-based level within chapter; 0 = daily */
  index: number
  name: string
  moves: number
  rows: number
  cols: number
  types: TileType[] // tile types in play
  objective: {
    kind: ObjectiveKind
    score?: number
    collect?: CollectGoal[]
  }
  /** score thresholds for 2nd and 3rd star */
  star2: number
  star3: number
  /** flavor text shown under the board */
  hint: string
}

export interface LevelResult {
  levelId: number
  won: boolean
  score: number
  stars: number
  movesLeft: number
}

export interface BoosterInventory {
  lens: number
  null: number
}

export type BoosterKind = keyof BoosterInventory

export interface DailyState {
  /** last completed day key YYYY-MM-DD */
  last: string | null
  streak: number
}

export interface DailyRewards {
  lumens: number
  lens: number
  null: number
  streak: number
}

export interface WWSettings {
  musicVol: number // 0..1
  sfxVol: number // 0..1
  vibrations: boolean
  particles: boolean
  reducedMotion: boolean
  highContrast: boolean
}
