/**
 * Match-3 engine invariants.
 *
 * Runs on the real TypeScript source via Node's type stripping — these modules
 * import only types, so nothing needs compiling or bundling first.
 *   node --experimental-strip-types --test tests/
 */
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  applyClear,
  applyGravity,
  cloneGrid,
  comboPlan,
  createGrid,
  expandSpecials,
  findAllMoves,
  findShapes,
  hasAnyMove,
  isSpecialActivation,
  key,
  newTile,
  planClear,
  shuffleGrid,
  wouldMatch,
  COMBO_BONUS,
} from '../src/lib/game/engine.ts'
import type { Grid, Special, TileType } from '../src/lib/game/types.ts'

const TYPES: TileType[] = ['leaf', 'drop', 'flame', 'star']

/** Build a grid from rows of single-letter type codes. `.` = empty cell. */
function gridOf(rows: string[]): Grid {
  const code: Record<string, TileType> = {
    L: 'leaf',
    D: 'drop',
    F: 'flame',
    S: 'star',
    W: 'flower',
    M: 'mushroom',
  }
  return rows.map((row) =>
    [...row].map((ch) => (ch === '.' ? null : newTile(code[ch] ?? 'leaf'))),
  )
}

function setSpecial(grid: Grid, r: number, c: number, special: Special): void {
  const tile = grid[r][c]
  if (!tile) throw new Error(`no tile at ${r},${c}`)
  tile.special = special
}

function typeAt(grid: Grid, r: number, c: number): TileType | null {
  return grid[r][c]?.type ?? null
}

/* ------------------------------ board setup ------------------------------ */

test('createGrid returns the requested shape with no pre-existing matches', () => {
  for (let i = 0; i < 25; i++) {
    const grid = createGrid(8, 7, TYPES)
    assert.equal(grid.length, 8)
    assert.equal(grid[0].length, 7)
    assert.equal(findShapes(grid).length, 0, 'fresh board must not start with a match')
  }
})

test('createGrid only uses the level tile types', () => {
  const grid = createGrid(6, 6, ['leaf', 'drop'])
  for (const row of grid) {
    for (const tile of row) {
      assert.ok(tile && ['leaf', 'drop'].includes(tile.type))
    }
  }
})

test('cloneGrid is a deep copy — mutating the clone leaves the original intact', () => {
  const grid = gridOf(['LDF', 'DFL', 'FLD'])
  const copy = cloneGrid(grid)
  copy[0][0]!.type = 'star'
  copy[1][1] = null
  assert.equal(typeAt(grid, 0, 0), 'leaf')
  assert.ok(grid[1][1])
})

/* ----------------------------- match detection ---------------------------- */

test('findShapes detects a horizontal run of three', () => {
  const grid = gridOf(['LLLD', 'DFDF', 'FDFD', 'DFDF'])
  const shapes = findShapes(grid)
  assert.equal(shapes.length, 1)
  assert.equal(shapes[0].kind, 'three')
  assert.equal(shapes[0].cells.length, 3)
  assert.equal(shapes[0].type, 'leaf')
})

test('findShapes detects a vertical run of three', () => {
  const grid = gridOf(['LDF', 'LFD', 'LDF', 'DFD'])
  const shapes = findShapes(grid)
  assert.equal(shapes.length, 1)
  assert.equal(shapes[0].cells.length, 3)
  assert.equal(shapes[0].type, 'leaf')
})

test('findShapes finds nothing on a clean board', () => {
  assert.equal(findShapes(gridOf(['LDLD', 'DLDL', 'LDLD', 'DLDL'])).length, 0)
})

test('a run of four classifies as a line special', () => {
  const shapes = findShapes(gridOf(['LLLL', 'DFDF', 'FDFD', 'DFDF']))
  assert.equal(shapes.length, 1)
  assert.equal(shapes[0].kind, 'lineH')
})

test('a run of five classifies as a prism', () => {
  const shapes = findShapes(gridOf(['LLLLL', 'DFDFD', 'FDFDF', 'DFDFD', 'FDFDF']))
  assert.equal(shapes.length, 1)
  assert.equal(shapes[0].kind, 'prism')
})

test('intersecting horizontal + vertical runs classify as a bomb', () => {
  // L across row 0 and down column 0 — an L shape sharing (0,0)
  const shapes = findShapes(gridOf(['LLLD', 'LDFD', 'LFDF', 'DFDF']))
  assert.equal(shapes.length, 1)
  assert.equal(shapes[0].kind, 'bomb')
  // the pivot must be the intersection cell
  assert.deepEqual(shapes[0].pivot, { r: 0, c: 0 })
})

test('prism tiles are excluded from run detection', () => {
  const grid = gridOf(['LLLD', 'DFDF', 'FDFD', 'DFDF'])
  setSpecial(grid, 0, 1, 'prism')
  assert.equal(findShapes(grid).length, 0, 'a prism breaks the run it sits in')
})

/* ------------------------------ clear planning ---------------------------- */

test('planClear promotes the pivot and keeps it out of the cleared cells', () => {
  const grid = gridOf(['LLLL', 'DFDF', 'FDFD', 'DFDF'])
  const shapes = findShapes(grid)
  const plan = planClear(grid, shapes)
  assert.equal(plan.promotions.size, 1)
  const [promotedKey, promo] = [...plan.promotions.entries()][0]
  assert.equal(promo.special, 'lineH')
  assert.equal(promo.type, 'leaf')
  assert.ok(!plan.cells.has(promotedKey), 'promoted tile must survive the clear')
})

test('a plain three-match promotes nothing and clears all three', () => {
  const grid = gridOf(['LLLD', 'DFDF', 'FDFD', 'DFDF'])
  const plan = planClear(grid, findShapes(grid))
  assert.equal(plan.promotions.size, 0)
  assert.equal(plan.cells.size, 3)
})

test('applyClear nulls cleared cells and writes the promoted special', () => {
  const grid = gridOf(['LLLL', 'DFDF', 'FDFD', 'DFDF'])
  const plan = planClear(grid, findShapes(grid))
  applyClear(grid, plan)
  const promotedKey = [...plan.promotions.keys()][0]
  const [pr, pc] = promotedKey.split(',').map(Number)
  assert.equal(grid[pr][pc]?.special, 'lineH')
  for (const k of plan.cells) {
    const [r, c] = k.split(',').map(Number)
    assert.equal(grid[r][c], null)
  }
})

/* --------------------------- specials & cascades -------------------------- */

test('expandSpecials: a row special clears its entire row', () => {
  const grid = gridOf(['LDFD', 'DFDF', 'FDFD', 'DFDF'])
  setSpecial(grid, 1, 1, 'lineH')
  const cells = expandSpecials(grid, [key(1, 1)])
  for (let c = 0; c < 4; c++) assert.ok(cells.has(key(1, c)), `row cell ${c} must be cleared`)
})

test('expandSpecials: a column special clears its entire column', () => {
  const grid = gridOf(['LDFD', 'DFDF', 'FDFD', 'DFDF'])
  setSpecial(grid, 1, 2, 'lineV')
  const cells = expandSpecials(grid, [key(1, 2)])
  for (let r = 0; r < 4; r++) assert.ok(cells.has(key(r, 2)))
})

test('expandSpecials: a bomb clears its 3x3 neighbourhood', () => {
  const grid = gridOf(['LDFD', 'DFDF', 'FDFD', 'DFDF'])
  setSpecial(grid, 1, 1, 'bomb')
  const cells = expandSpecials(grid, [key(1, 1)])
  for (let r = 0; r <= 2; r++) for (let c = 0; c <= 2; c++) assert.ok(cells.has(key(r, c)))
})

test('expandSpecials chains through touching specials', () => {
  const grid = gridOf(['LDFD', 'DFDF', 'FDFD', 'DFDF'])
  setSpecial(grid, 0, 0, 'lineH') // clears row 0, which contains (0,2)
  setSpecial(grid, 0, 2, 'lineV') // …which then clears column 2
  const cells = expandSpecials(grid, [key(0, 0)])
  for (let r = 0; r < 4; r++) {
    assert.ok(cells.has(key(r, 2)), `chained column cell ${r} must be cleared`)
  }
})

/* --------------------------------- gravity -------------------------------- */

test('applyGravity leaves no holes and refills the board completely', () => {
  const grid = gridOf(['LDFD', 'DFDF', 'FDFD', 'DFDF'])
  grid[3][0] = null
  grid[2][0] = null
  grid[0][3] = null
  const result = applyGravity(grid, TYPES)
  assert.equal(result.moved, true)
  for (const row of grid) for (const tile of row) assert.ok(tile, 'no cell may be left empty')
  assert.equal(result.spawnedIds.length, 3, 'one new tile per cleared cell')
})

test('applyGravity drops survivors to the bottom rather than deleting them', () => {
  const grid = gridOf(['L...', '....', '....', '....'])
  // column 0 holds a single leaf at the top; everything else is empty
  for (let r = 0; r < 4; r++) for (let c = 1; c < 4; c++) grid[r][c] = newTile('drop')
  applyGravity(grid, ['flame'])
  assert.equal(typeAt(grid, 3, 0), 'leaf', 'the survivor must fall to the floor')
})

test('applyGravity marks spawned tiles so the view can animate them', () => {
  const grid = gridOf(['LDFD', 'DFDF', 'FDFD', 'DFDF'])
  grid[0][0] = null
  applyGravity(grid, TYPES)
  const spawned = grid.flat().filter((t) => t?.spawned)
  assert.ok(spawned.length > 0)
  for (const tile of spawned) assert.equal(typeof tile!.spawnDrop, 'number')
})

/* ------------------------------- move finding ----------------------------- */

test('wouldMatch is true for a swap that creates a run and false otherwise', () => {
  //  swapping (1,0)<->(0,0) lines up three leaves in row 0
  const grid = gridOf(['DLL', 'LDD', 'DFD'])
  assert.equal(wouldMatch(grid, { r: 0, c: 0 }, { r: 1, c: 0 }), true)
  assert.equal(wouldMatch(grid, { r: 2, c: 0 }, { r: 2, c: 1 }), false)
})

test('findAllMoves / hasAnyMove locate a legal swap', () => {
  const grid = gridOf(['DLL', 'LDD', 'DFD'])
  assert.ok(hasAnyMove(grid))
  assert.ok(findAllMoves(grid).length > 0)
})

test('a genuinely dead board reports no moves', () => {
  // strict 4-colour diagonal weave: no adjacent swap can produce three in a row
  const dead = gridOf(['LDFS', 'FSLD', 'LDFS', 'FSLD'])
  assert.equal(hasAnyMove(dead), false, 'this layout must be a dead board')
})

test('isSpecialActivation is true only when the swap involves specials', () => {
  const grid = gridOf(['LDFD', 'DFDF', 'FDFD', 'DFDF'])
  assert.equal(isSpecialActivation(grid, { r: 0, c: 0 }, { r: 0, c: 1 }), false)
  setSpecial(grid, 0, 0, 'prism')
  assert.equal(isSpecialActivation(grid, { r: 0, c: 0 }, { r: 0, c: 1 }), true, 'prism activates with anything')
  const both = gridOf(['LDFD', 'DFDF', 'FDFD', 'DFDF'])
  setSpecial(both, 0, 0, 'lineH')
  setSpecial(both, 0, 1, 'bomb')
  assert.equal(isSpecialActivation(both, { r: 0, c: 0 }, { r: 0, c: 1 }), true)
})

test('shuffleGrid rescues a dead board and preserves the tile count', () => {
  const dead = gridOf(['LDFS', 'FSLD', 'LDFS', 'FSLD'])
  assert.equal(hasAnyMove(dead), false)
  const before = dead.flat().filter(Boolean).length
  const shuffled = shuffleGrid(cloneGrid(dead), TYPES)
  assert.equal(shuffled.flat().filter(Boolean).length, before)
  assert.equal(hasAnyMove(shuffled), true, 'shuffle must leave a playable board')
  assert.equal(findShapes(shuffled).length, 0, 'shuffle must not hand the player a free match')
})

/* ---------------------------- special + special --------------------------- */

function comboOf(sa: Special, sb: Special) {
  const grid = createGrid(8, 8, TYPES)
  setSpecial(grid, 4, 4, sa)
  setSpecial(grid, 4, 5, sb)
  return comboPlan(grid, { r: 4, c: 4 }, { r: 4, c: 5 })
}

test('comboPlan returns null unless both tiles are special', () => {
  const grid = createGrid(8, 8, TYPES)
  assert.equal(comboPlan(grid, { r: 0, c: 0 }, { r: 0, c: 1 }), null)
  setSpecial(grid, 0, 0, 'bomb')
  assert.equal(comboPlan(grid, { r: 0, c: 0 }, { r: 0, c: 1 }), null, 'special + plain is not a combo')
})

test('the special-vs-special table maps every pairing to its weave', () => {
  const cases: [Special, Special, string][] = [
    ['lineH', 'lineV', 'cross'],
    ['lineH', 'bomb', 'megaCross'],
    ['bomb', 'lineH', 'megaCross'],
    ['bomb', 'bomb', 'bigBomb'],
    ['prism', 'lineH', 'lineStorm'],
    ['prism', 'bomb', 'bombStorm'],
    ['prism', 'prism', 'blackhole'],
  ]
  for (const [sa, sb, kind] of cases) {
    const plan = comboOf(sa, sb)
    assert.ok(plan, `${sa}+${sb} must be a combo`)
    assert.equal(plan!.kind, kind, `${sa}+${sb}`)
    assert.equal(plan!.bonus, COMBO_BONUS[plan!.kind])
    assert.ok(plan!.cells.size > 0)
  }
})

test('prism + prism unravels the whole board', () => {
  const plan = comboOf('prism', 'prism')
  assert.equal(plan!.cells.size, 64, 'blackhole clears every cell of an 8x8 board')
})

test('striped + striped clears a full row and column', () => {
  const plan = comboOf('lineH', 'lineV')
  for (let c = 0; c < 8; c++) assert.ok(plan!.cells.has(key(4, c)))
  for (let r = 0; r < 8; r++) assert.ok(plan!.cells.has(key(r, 4)))
})
