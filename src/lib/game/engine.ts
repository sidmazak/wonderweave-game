import type { Cell, Grid, Shape, Special, Tile, TileType } from './types'

let nextId = 1
export function newTile(type: TileType, special: Special = 'none'): Tile {
  return { id: nextId++, type, special }
}

export function key(r: number, c: number): string {
  return `${r},${c}`
}

function randOf(types: TileType[]): TileType {
  return types[Math.floor(Math.random() * types.length)]
}

function createsMatchAt(grid: Grid, r: number, c: number): boolean {
  const t = grid[r][c]
  if (!t) return false
  // horizontal
  let run = 1
  for (let i = c - 1; i >= 0 && grid[r][i]?.type === t.type; i--) run++
  for (let i = c + 1; i < grid[r].length && grid[r][i]?.type === t.type; i++) run++
  if (run >= 3) return true
  // vertical
  run = 1
  for (let i = r - 1; i >= 0 && grid[i][c]?.type === t.type; i--) run++
  for (let i = r + 1; i < grid.length && grid[i][c]?.type === t.type; i++) run++
  return run >= 3
}

export function createGrid(rows: number, cols: number, types: TileType[]): Grid {
  const grid: Grid = []
  for (let r = 0; r < rows; r++) {
    const row: (Tile | null)[] = []
    grid.push(row)
    for (let c = 0; c < cols; c++) {
      row[c] = newTile(randOf(types))
      let guard = 0
      while (createsMatchAt(grid, r, c) && guard++ < 24) {
        row[c] = newTile(randOf(types))
      }
    }
  }
  return grid
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.map((t) => (t ? { ...t } : null)))
}

interface Run {
  cells: Cell[]
  horizontal: boolean
  type: TileType
}

function findRuns(grid: Grid): Run[] {
  const runs: Run[] = []
  const rows = grid.length
  const cols = grid[0].length
  // horizontal
  for (let r = 0; r < rows; r++) {
    let start = 0
    while (start < cols) {
      const t = grid[r][start]
      if (!t || t.special === 'prism') {
        start++
        continue
      }
      let end = start + 1
      while (end < cols && grid[r][end] && grid[r][end]!.type === t.type && grid[r][end]!.special !== 'prism') end++
      if (end - start >= 3) {
        const cells: Cell[] = []
        for (let c = start; c < end; c++) cells.push({ r, c })
        runs.push({ cells, horizontal: true, type: t.type })
      }
      start = end
    }
  }
  // vertical
  for (let c = 0; c < cols; c++) {
    let start = 0
    while (start < rows) {
      const t = grid[start][c]
      if (!t || t.special === 'prism') {
        start++
        continue
      }
      let end = start + 1
      while (end < rows && grid[end][c] && grid[end][c]!.type === t.type && grid[end][c]!.special !== 'prism') end++
      if (end - start >= 3) {
        const cells: Cell[] = []
        for (let r = start; r < end; r++) cells.push({ r, c })
        runs.push({ cells, horizontal: false, type: t.type })
      }
      start = end
    }
  }
  return runs
}

/** Merge intersecting runs into shapes and classify (line / bomb / prism). */
export function findShapes(grid: Grid, swapped?: Cell[]): Shape[] {
  const runs = findRuns(grid)
  if (runs.length === 0) return []
  const used = new Set<number>()
  const shapes: Shape[] = []
  for (let i = 0; i < runs.length; i++) {
    if (used.has(i)) continue
    const group = [runs[i]]
    used.add(i)
    let grew = true
    while (grew) {
      grew = false
      for (let j = 0; j < runs.length; j++) {
        if (used.has(j)) continue
        const touches = group.some((g) =>
          g.cells.some((a) => runs[j].cells.some((b) => a.r === b.r && a.c === b.c)),
        )
        if (touches) {
          group.push(runs[j])
          used.add(j)
          grew = true
        }
      }
    }
    const cellMap = new Map<string, Cell>()
    for (const g of group) for (const cell of g.cells) cellMap.set(key(cell.r, cell.c), cell)
    const cells = [...cellMap.values()]
    const type = group[0].type
    const longest = group.reduce((acc, g) => (g.cells.length > acc.cells.length ? g : acc), group[0])
    const hasH = group.some((g) => g.horizontal)
    const hasV = group.some((g) => !g.horizontal)

    let kind: Shape['kind'] = 'three'
    if (longest.cells.length >= 5) kind = 'prism'
    else if (hasH && hasV) kind = 'bomb'
    else if (longest.cells.length === 4) kind = longest.horizontal ? 'lineH' : 'lineV'

    // pivot: prefer a swapped cell inside the shape, else shape center
    let pivot = cells[Math.floor(cells.length / 2)]
    if (swapped) {
      const hit = swapped.find((s) => cellMap.has(key(s.r, s.c)))
      if (hit) pivot = hit
    } else if (kind === 'lineH' || kind === 'lineV') {
      pivot = longest.cells[1] ?? longest.cells[0]
    } else if (kind === 'bomb') {
      // intersection cell
      const hRun = group.find((g) => g.horizontal)!
      const vRun = group.find((g) => !g.horizontal)!
      const inter = hRun.cells.find((a) => vRun.cells.some((b) => a.r === b.r && a.c === b.c))
      if (inter) pivot = inter
    }
    shapes.push({ kind, cells, pivot, type })
  }
  return shapes
}

export function specialEffectCells(grid: Grid, r: number, c: number, out: Set<string>): void {
  const tile = grid[r]?.[c]
  if (!tile) return
  const rows = grid.length
  const cols = grid[0].length
  if (tile.special === 'lineH') {
    for (let cc = 0; cc < cols; cc++) out.add(key(r, cc))
  } else if (tile.special === 'lineV') {
    for (let rr = 0; rr < rows; rr++) out.add(key(rr, c))
  } else if (tile.special === 'bomb') {
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr
        const cc = c + dc
        if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) out.add(key(rr, cc))
      }
  } else if (tile.special === 'prism') {
    // when triggered by chain: clear a random-ish color — we clear the most common type
    const counts = new Map<TileType, number>()
    for (const row of grid) for (const t of row) if (t && t.special !== 'prism') counts.set(t.type, (counts.get(t.type) ?? 0) + 1)
    let best: TileType | null = null
    let bestN = -1
    for (const [t, n] of counts) {
      if (n > bestN) {
        best = t
        bestN = n
      }
    }
    if (best) {
      for (let rr = 0; rr < rows; rr++)
        for (let cc = 0; cc < cols; cc++) if (grid[rr][cc]?.type === best) out.add(key(rr, cc))
    }
  }
}

/** Expand a seed set through chained special-tile detonations. */
export function expandSpecials(grid: Grid, seed: Iterable<string>): Set<string> {
  const cells = new Set<string>(seed)
  const queue: Cell[] = [...cells].map((k) => {
    const [r, c] = k.split(',').map(Number)
    return { r, c }
  })
  const visited = new Set<string>()
  while (queue.length) {
    const { r, c } = queue.shift()!
    if (visited.has(key(r, c))) continue
    visited.add(key(r, c))
    const tile = grid[r]?.[c]
    if (!tile || tile.special === 'none' || tile.special === 'prism') continue
    const effect = new Set<string>()
    specialEffectCells(grid, r, c, effect)
    for (const k of effect) {
      if (!cells.has(k)) {
        cells.add(k)
        const [rr, cc] = k.split(',').map(Number)
        queue.push({ r: rr, c: cc })
      }
    }
  }
  return cells
}

export interface ClearPlan {
  cells: Set<string>
  promotions: Map<string, { special: Special; type: TileType }>
}

/** Build the full clear set from shapes, cascading through triggered specials. */
export function planClear(grid: Grid, shapes: Shape[], swapped?: Cell[]): ClearPlan {
  const cells = new Set<string>()
  const promotions = new Map<string, { special: Special; type: TileType }>()
  for (const s of shapes) {
    for (const cell of s.cells) cells.add(key(cell.r, cell.c))
    if (s.kind !== 'three') {
      promotions.set(key(s.pivot.r, s.pivot.c), {
        special: s.kind === 'prism' ? 'prism' : s.kind,
        type: s.type,
      })
      cells.delete(key(s.pivot.r, s.pivot.c))
    }
  }
  const expanded = expandSpecials(grid, cells)
  // keep promoted cells out of the clear set
  for (const k of promotions.keys()) expanded.delete(k)
  return { cells: expanded, promotions }
}

/** Remove cleared cells, place promoted specials. Mutates the given grid. */
export function applyClear(grid: Grid, plan: ClearPlan): void {
  for (const k of plan.cells) {
    const [r, c] = k.split(',').map(Number)
    if (grid[r]) grid[r][c] = null
  }
  for (const [k, promo] of plan.promotions) {
    const [r, c] = k.split(',').map(Number)
    const existing = grid[r]?.[c]
    if (existing) {
      existing.special = promo.special
    } else {
      grid[r][c] = newTile(promo.type, promo.special)
    }
  }
}

export interface GravityResult {
  moved: boolean
  spawnedIds: number[]
}

/** Drop tiles into holes; spawn new tiles just above the frame as a connected
    column (each spawned tile records its column depth in `spawnDrop` so the
    view can start it exactly `spawnDrop` cells above its landing spot —
    no more flying in from a full board above, no per-column wave gaps).
    Mutates grid. */
export function applyGravity(grid: Grid, types: TileType[]): GravityResult {
  const rows = grid.length
  const cols = grid[0].length
  const spawnedIds: number[] = []
  let moved = false
  for (let c = 0; c < cols; c++) {
    let write = rows - 1
    for (let r = rows - 1; r >= 0; r--) {
      const t = grid[r][c]
      if (t) {
        if (write !== r) {
          grid[write][c] = t
          grid[r][c] = null
          moved = true
        }
        write--
      }
    }
    // spawn for rows 0..write — all tiles in this column share the same depth
    const depth = write + 1
    for (let r = write; r >= 0; r--) {
      const t = newTile(randOf(types))
      t.spawned = true
      t.spawnDrop = depth
      spawnedIds.push(t.id)
      grid[r][c] = t
      moved = true
    }
  }
  return { moved, spawnedIds }
}

export function wouldMatch(grid: Grid, a: Cell, b: Cell): boolean {
  const ga = grid[a.r]?.[a.c]
  const gb = grid[b.r]?.[b.c]
  if (!ga || !gb) return false
  const test = cloneGrid(grid)
  const ta = test[a.r]?.[a.c]
  const tb = test[b.r]?.[b.c]
  if (!ta || !tb) return false
  test[a.r]![a.c] = { ...gb }
  test[b.r]![b.c] = { ...ga }
  return findShapes(test).length > 0
}

/** True when the swap activates something special even without a match. */
export function isSpecialActivation(grid: Grid, a: Cell, b: Cell): boolean {
  const ga = grid[a.r]?.[a.c]
  const gb = grid[b.r]?.[b.c]
  if (!ga || !gb) return false
  if (ga.special === 'prism' || gb.special === 'prism') return true
  return ga.special !== 'none' && gb.special !== 'none'
}

/* ---------------- special + special combo matrix ---------------- */

export type ComboKind =
  | 'cross' //      striped + striped   → full row + full column of light
  | 'megaCross' //  striped + burst     → three rows + three columns
  | 'bigBomb' //    burst + burst       → two overlapping 5×5 rings
  | 'lineStorm' //  prism + striped     → every charm of a kind weaves a line
  | 'bombStorm' //  prism + burst       → every charm of a kind becomes a burst
  | 'blackhole' //  prism + prism       → the whole loom unravels

export interface ComboPlan {
  cells: Set<string>
  kind: ComboKind
  /** flat bonus points for pulling off the weave */
  bonus: number
}

const COMBO_LABEL: Record<ComboKind, string> = {
  cross: 'Cross of Light!',
  megaCross: 'Grand Weave!',
  bigBomb: 'Twin Bloom!',
  lineStorm: 'Line Storm!',
  bombStorm: 'Burst Bloom!',
  blackhole: 'The Loom Unravels!',
}

export function comboLabel(kind: ComboKind): string {
  return COMBO_LABEL[kind]
}

export const COMBO_BONUS: Record<ComboKind, number> = {
  cross: 400,
  megaCross: 700,
  bigBomb: 600,
  lineStorm: 900,
  bombStorm: 900,
  blackhole: 1500,
}

function fullRow(grid: Grid, r: number, out: Set<string>): void {
  for (let c = 0; c < grid[r].length; c++) out.add(key(r, c))
}
function fullCol(grid: Grid, c: number, out: Set<string>): void {
  for (let r = 0; r < grid.length; r++) out.add(key(r, c))
}
function ring(grid: Grid, r: number, c: number, radius: number, out: Set<string>): void {
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) {
      const rr = r + dr
      const cc = c + dc
      if (rr >= 0 && rr < grid.length && cc >= 0 && cc < grid[rr].length) out.add(key(rr, cc))
    }
  }
}

/**
 * The complete special-vs-special weave table. Returns null when the pair is
 * not a combo (e.g. prism + plain charm is a plain prism activation).
 */
export function comboPlan(grid: Grid, a: Cell, b: Cell): ComboPlan | null {
  const ta = grid[a.r]?.[a.c]
  const tb = grid[b.r]?.[b.c]
  if (!ta || !tb) return null
  const sa = ta.special
  const sb = tb.special
  if (sa === 'none' || sb === 'none') return null

  const isLine = (s: Special) => s === 'lineH' || s === 'lineV'
  const cells = new Set<string>()
  let kind: ComboKind

  if (sa === 'prism' && sb === 'prism') {
    kind = 'blackhole'
    for (let r = 0; r < grid.length; r++) fullRow(grid, r, cells)
  } else if (sa === 'prism' || sb === 'prism') {
    // partner is the non-prism special; storm every charm of ITS colour
    const partner = sa === 'prism' ? tb : ta
    const pr = sa === 'prism' ? b.r : a.r
    const pc = sa === 'prism' ? b.c : a.c
    if (isLine(partner.special)) {
      kind = 'lineStorm'
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
          if (grid[r][c]?.type === partner.type) {
            fullRow(grid, r, cells)
            fullCol(grid, c, cells)
          }
        }
      }
      cells.add(key(pr, pc))
    } else {
      kind = 'bombStorm'
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
          if (grid[r][c]?.type === partner.type) ring(grid, r, c, 1, cells)
        }
      }
      cells.add(key(pr, pc))
    }
  } else if (isLine(sa) && isLine(sb)) {
    kind = 'cross'
    fullRow(grid, a.r, cells)
    fullCol(grid, a.c, cells)
    cells.add(key(b.r, b.c))
  } else if ((isLine(sa) && sb === 'bomb') || (sa === 'bomb' && isLine(sb))) {
    kind = 'megaCross'
    const lr = sa === 'bomb' ? b.r : a.r // the striped charm's line
    const bc = sa === 'bomb' ? a.c : b.c // the burst charm's column
    for (let dr = -1; dr <= 1; dr++) if (lr + dr >= 0 && lr + dr < grid.length) fullRow(grid, lr + dr, cells)
    for (let dc = -1; dc <= 1; dc++) if (bc + dc >= 0 && bc + dc < grid[0].length) fullCol(grid, bc + dc, cells)
  } else {
    // burst + burst
    kind = 'bigBomb'
    ring(grid, a.r, a.c, 2, cells)
    ring(grid, b.r, b.c, 2, cells)
  }

  return { cells, kind, bonus: COMBO_BONUS[kind] }
}

export function findAllMoves(grid: Grid): [Cell, Cell][] {
  const rows = grid.length
  const cols = grid[0]?.length ?? 0
  const moves: [Cell, Cell][] = []
  const dirs = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
  ]
  for (let r = 0; r < rows; r++) {
    const row = grid[r]
    if (!row) continue
    for (let c = 0; c < cols; c++) {
      for (const { dr, dc } of dirs) {
        const r2 = r + dr
        const c2 = c + dc
        if (r2 >= rows || c2 >= cols) continue
        if (!row[c] || !grid[r2]?.[c2]) continue
        if (isSpecialActivation(grid, { r, c }, { r: r2, c: c2 }) || wouldMatch(grid, { r, c }, { r: r2, c: c2 })) {
          moves.push([
            { r, c },
            { r: r2, c: c2 },
          ])
        }
      }
    }
  }
  return moves
}

export function hasAnyMove(grid: Grid): boolean {
  return findAllMoves(grid).length > 0
}

/** Shuffle existing tile types (keeps specials + positions) until at least one move exists. */
export function shuffleGrid(grid: Grid, types: TileType[]): Grid {
  const rows = grid.length
  const cols = grid[0].length
  const flat: Tile[] = []
  for (const row of grid) for (const t of row) if (t) flat.push(t)
  for (let attempt = 0; attempt < 60; attempt++) {
    for (let i = flat.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const a = flat[i]
      const b = flat[j]
      if (a.special !== 'none' || b.special !== 'none') continue
      const tmp = a.type
      a.type = b.type
      b.type = tmp
    }
    // ensure no immediate matches after shuffle
    let guard = 0
    let clean = false
    while (!clean && guard++ < 40) {
      clean = true
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const t = grid[r][c]
          if (t && t.special === 'none' && createsMatchAt(grid, r, c)) {
            clean = false
            let tries = 0
            do {
              t.type = randOf(types)
            } while (createsMatchAt(grid, r, c) && tries++ < 20)
          }
        }
      }
    }
    if (hasAnyMove(grid)) return cloneGrid(grid)
  }
  return cloneGrid(grid)
}
