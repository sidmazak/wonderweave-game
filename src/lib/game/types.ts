// Wonderweave — core game types

export type TileType =
  | 'leaf'
  | 'drop'
  | 'flame'
  | 'star'
  | 'flower'
  | 'mushroom'
  | 'gem'

export type Special = 'none' | 'lineH' | 'lineV' | 'bomb' | 'prism'

export interface Tile {
  id: number
  type: TileType
  special: Special
  /** set while the tile is being destroyed (pop animation) */
  clearing?: boolean
  /** true for tiles created by refill (used for drop-in animation) */
  spawned?: boolean
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
  id: number
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
  /** flavor text shown on level start */
  hint: string
}

export interface LevelResult {
  levelId: number
  won: boolean
  score: number
  stars: number
  movesLeft: number
}
