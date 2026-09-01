'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { A, TILE_IMG } from '@/lib/game/assets'
import { CHAPTERS, TILE_META, stageTitle } from '@/lib/game/levels'
import {
  applyClear,
  applyGravity,
  cloneGrid,
  createGrid,
  expandSpecials,
  findAllMoves,
  findShapes,
  hasAnyMove,
  isSpecialActivation,
  key,
  planClear,
  shuffleGrid,
} from '@/lib/game/engine'
import type { ClearPlan } from '@/lib/game/engine'
import type {
  BoosterKind,
  BoosterInventory,
  Cell,
  Grid,
  LevelDef,
  LevelResult,
  Tile,
} from '@/lib/game/types'
import { initAudio, sfx } from '@/lib/game/sound'
import { discover, LUMEN_ID_BY_TYPE } from '@/lib/game/codex'
import { useVibrate } from './settings'
import { CountUp, IconButton, ProgressBar, RibbonBanner } from './ui'
import { FolioSealedModal, FolioLostModal, PauseModal } from './modals'

const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms))

function adjacent(a: Cell, b: Cell): boolean {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1
}

export interface RewardSummary {
  lumens: number
  lens: number
  null: number
  streak?: number
}

interface Floater {
  id: number
  r: number
  c: number
  text: string
}
interface ComboInfo {
  id: number
  n: number
}

let floaterSeq = 1
let comboSeq = 1

export function PlayScreen({
  level,
  isDaily,
  inventory,
  spendBooster,
  onExit,
  onPlayLevel,
  onWin,
  onOpenInstruments,
  hasNextStage,
}: {
  level: LevelDef
  isDaily: boolean
  inventory: BoosterInventory
  spendBooster: (kind: BoosterKind) => boolean
  onExit: () => void
  onPlayLevel: (id: number) => void
  onWin: (result: LevelResult) => RewardSummary
  onOpenInstruments: () => void
  hasNextStage: boolean
}) {
  const vibrate = useVibrate()

  const [grid, setGrid] = React.useState<Grid>(() => {
    const g = createGrid(level.rows, level.cols, level.types)
    for (const row of g) for (const t of row) if (t) t.spawned = true
    return g
  })
  const gridRef = React.useRef(grid)
  const setGridBoth = React.useCallback((g: Grid) => {
    gridRef.current = g
    setGrid(g)
  }, [])

  const [score, setScore] = React.useState(0)
  const scoreRef = React.useRef(0)
  const [movesLeft, setMovesLeft] = React.useState(level.moves)
  const movesRef = React.useRef(level.moves)
  const [collected, setCollected] = React.useState<Record<string, number>>({})
  const collectedRef = React.useRef<Record<string, number>>({})
  const doneGoalsRef = React.useRef<Set<string>>(new Set())

  const [busy, setBusy] = React.useState(true)
  const busyRef = React.useRef(true)
  const lock = React.useCallback((v: boolean) => {
    busyRef.current = v
    setBusy(v)
  }, [])

  const [selected, setSelected] = React.useState<Cell | null>(null)
  const selectedRef = React.useRef<Cell | null>(null)
  const setSelectedBoth = React.useCallback((cell: Cell | null) => {
    selectedRef.current = cell
    setSelected(cell)
  }, [])
  const [hint, setHint] = React.useState<[Cell, Cell] | null>(null)
  const hintTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragRef = React.useRef<{ startCell: Cell; x: number; y: number; done: boolean } | null>(null)

  const [floaters, setFloaters] = React.useState<Floater[]>([])
  const [combo, setCombo] = React.useState<ComboInfo | null>(null)
  const [goalFlash, setGoalFlash] = React.useState<{ id: number } | null>(null)
  const [toast, setToast] = React.useState<string | null>(null)

  const [status, setStatus] = React.useState<'playing' | 'won' | 'lost'>('playing')
  const statusRef = React.useRef<'playing' | 'won' | 'lost'>('playing')
  const [result, setResult] = React.useState<LevelResult | null>(null)
  const [rewards, setRewards] = React.useState<RewardSummary | null>(null)
  const [paused, setPaused] = React.useState(false)
  const pausedRef = React.useRef(false)
  const [armedBooster, setArmedBooster] = React.useState<BoosterKind | null>(null)
  const armedRef = React.useRef<BoosterKind | null>(null)
  const setArmed = React.useCallback((k: BoosterKind | null) => {
    armedRef.current = k
    setArmedBooster(k)
  }, [])

  const wrapRef = React.useRef<HTMLDivElement>(null)
  const boardRef = React.useRef<HTMLDivElement>(null)
  const [size, setSize] = React.useState({ w: 0, h: 0 })

  /* ------- board sizing ------- */
  React.useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => {
      const cs = getComputedStyle(el)
      const availW = el.clientWidth - parseFloat(cs.paddingLeft || '0') - parseFloat(cs.paddingRight || '0')
      const availH = el.clientHeight - parseFloat(cs.paddingTop || '0') - parseFloat(cs.paddingBottom || '0')
      // frame adds 2*3px border + 2*5px padding = 16px; keep a 4px slack
      const target = Math.max(120, Math.min(availW - 20, (availH - 20) * (level.cols / level.rows)))
      setSize({ w: target, h: (target * level.rows) / level.cols })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [level.rows, level.cols])

  /* ------- deal animation ------- */
  const clearSpawnedNextFrame = React.useCallback(() => {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const g = cloneGrid(gridRef.current)
        let dirty = false
        for (const row of g) {
          for (const t of row) {
            if (t && t.spawned) {
              delete t.spawned
              dirty = true
            }
          }
        }
        if (dirty) setGridBoth(g)
      }),
    )
  }, [setGridBoth])

  React.useEffect(() => {
    initAudio()
    discover('entity:lantern')
    if (level.chapter > 0) discover(`lore:${level.chapter}`)
    clearSpawnedNextFrame()
    const t = setTimeout(() => lock(false), 480 + level.cols * 26)
    return () => clearTimeout(t)
  }, [clearSpawnedNextFrame, lock, level.cols])

  const resetLevel = React.useCallback(() => {
    const g = createGrid(level.rows, level.cols, level.types)
    for (const row of g) for (const t of row) if (t) t.spawned = true
    setGridBoth(g)
    clearSpawnedNextFrame()
    scoreRef.current = 0
    setScore(0)
    movesRef.current = level.moves
    setMovesLeft(level.moves)
    collectedRef.current = {}
    setCollected({})
    doneGoalsRef.current = new Set()
    setSelectedBoth(null)
    setArmed(null)
    setHint(null)
    setCombo(null)
    setFloaters([])
    setResult(null)
    setRewards(null)
    setStatus('playing')
    statusRef.current = 'playing'
    setPaused(false)
    pausedRef.current = false
    lock(true)
    setTimeout(() => lock(false), 480 + level.cols * 26)
  }, [clearSpawnedNextFrame, level, lock, setArmed, setGridBoth, setSelectedBoth])

  /* ------- helpers ------- */
  const showToast = React.useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 2200)
  }, [])

  const addFloater = React.useCallback((r: number, c: number, text: string) => {
    const id = floaterSeq++
    setFloaters((f) => [...f.slice(-6), { id, r, c, text }])
    setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 1000)
  }, [])

  const showCombo = React.useCallback((n: number) => {
    const id = comboSeq++
    setCombo({ id, n })
    setTimeout(() => setCombo((cur) => (cur?.id === id ? null : cur)), 1400)
  }, [])

  const finishLevel = React.useCallback(
    (won: boolean) => {
      const bonus = won ? movesRef.current * 100 : 0
      const finalScore = scoreRef.current + bonus
      const stars = won ? (finalScore >= level.star3 ? 3 : finalScore >= level.star2 ? 2 : 1) : 0
      const res: LevelResult = { levelId: level.id, won, score: finalScore, stars, movesLeft: movesRef.current }
      statusRef.current = won ? 'won' : 'lost'
      setStatus(won ? 'won' : 'lost')
      setResult(res)
      if (won) {
        sfx.win()
        for (let i = 0; i < stars; i++) setTimeout(() => sfx.star(i), 500 + i * 380)
        setRewards(onWin(res))
      } else {
        sfx.lose()
      }
    },
    [level, onWin],
  )

  const checkObjective = React.useCallback((): boolean => {
    const obj = level.objective
    if (obj.kind === 'score') return scoreRef.current >= (obj.score ?? Infinity)
    return (obj.collect ?? []).every((goal) => (collectedRef.current[goal.type] ?? 0) >= goal.count)
  }, [level])

  /* ------- blast & cascade ------- */
  const blast = React.useCallback(
    async (plan: ClearPlan, cascade: number): Promise<void> => {
      const g = cloneGrid(gridRef.current)
      const cellsArr = [...plan.cells].map((k) => {
        const [r, c] = k.split(',').map(Number)
        return { r, c }
      })
      if (cellsArr.length === 0 && plan.promotions.size === 0) return

      const mult = cascade + 1
      const gained = cellsArr.length * 20 * mult + plan.promotions.size * 60
      scoreRef.current += gained
      setScore(scoreRef.current)

      // collection + codex discovery
      const col = { ...collectedRef.current }
      let lineHit = false
      let bombHit = false
      const seenTypes = new Set<string>()
      for (const { r, c } of cellsArr) {
        const t = g[r]?.[c]
        if (!t) continue
        col[t.type] = (col[t.type] ?? 0) + 1
        seenTypes.add(t.type)
        if (t.special === 'lineH' || t.special === 'lineV') lineHit = true
        if (t.special === 'bomb') bombHit = true
      }
      collectedRef.current = col
      setCollected(col)
      if (seenTypes.size > 0) {
        const lumenIds = [...seenTypes].map((t) => LUMEN_ID_BY_TYPE[t]).filter(Boolean)
        if (lumenIds.length > 0) discover(...lumenIds)
      }
      for (const promo of plan.promotions.values()) {
        if (promo.special === 'prism') discover('lumen:vitriol')
      }
      if (lineHit) sfx.line()
      if (bombHit) sfx.bomb()

      // floater at centroid
      if (cellsArr.length > 0) {
        const ar = cellsArr.reduce((s, x) => s + x.r, 0) / cellsArr.length
        const ac = cellsArr.reduce((s, x) => s + x.c, 0) / cellsArr.length
        addFloater(ar, ac, `+${gained}`)
      }

      // pop
      for (const k of plan.cells) {
        const [r, c] = k.split(',').map(Number)
        const t = g[r]?.[c]
        if (t) t.clearing = true
      }
      setGridBoth(g)
      sfx.pop(cascade)
      vibrate(12)
      await sleep(250)

      // clear + gravity
      applyClear(g, plan)
      const grav = applyGravity(g, level.types)
      setGridBoth(g)
      if (grav.spawnedIds.length > 0) {
        await sleep(430 + level.cols * 26 + 60)
        const g2 = cloneGrid(gridRef.current)
        let dirty = false
        for (const row of g2) {
          for (const t of row) {
            if (t && t.spawned) {
              delete t.spawned
              dirty = true
            }
          }
        }
        if (dirty) setGridBoth(g2)
      } else {
        await sleep(300)
      }

      // combo banner
      if (mult >= 2) showCombo(mult)

      // goal flash
      if (level.objective.kind === 'collect') {
        for (const goal of level.objective.collect ?? []) {
          const done = (collectedRef.current[goal.type] ?? 0) >= goal.count
          if (done && !doneGoalsRef.current.has(goal.type)) {
            doneGoalsRef.current.add(goal.type)
            setGoalFlash({ id: Date.now() })
            sfx.specialCreate()
            setTimeout(() => setGoalFlash(null), 1400)
          }
        }
      }
    },
    [addFloater, level, setGridBoth, showCombo, vibrate],
  )

  const cascadeLoop = React.useCallback(
    async (swapped?: Cell[]): Promise<void> => {
      let cascade = 0
      for (;;) {
        const g = cloneGrid(gridRef.current)
        const shapes = findShapes(g, cascade === 0 ? swapped : undefined)
        if (shapes.length === 0) break
        const plan = planClear(g, shapes, cascade === 0 ? swapped : undefined)
        await blast(plan, cascade)
        cascade++
      }
    },
    [blast],
  )

  const activatePrism = React.useCallback(
    async (a: Cell, b: Cell): Promise<void> => {
      const g = gridRef.current
      const ta = g[a.r]?.[a.c]
      const tb = g[b.r]?.[b.c]
      if (!ta || !tb) return
      const aIsPrism = ta.special === 'prism'
      const other = aIsPrism ? tb : ta
      sfx.prism()
      discover('lumen:vitriol')
      const seed = new Set<string>()
      if (other.special === 'prism') {
        for (let r = 0; r < level.rows; r++) for (let c = 0; c < level.cols; c++) seed.add(key(r, c))
      } else {
        for (let r = 0; r < level.rows; r++) {
          for (let c = 0; c < level.cols; c++) {
            if (g[r][c]?.type === other.type) seed.add(key(r, c))
          }
        }
      }
      const cells = expandSpecials(g, seed)
      await blast({ cells, promotions: new Map() }, 0)
      await cascadeLoop()
    },
    [blast, cascadeLoop, level.rows, level.cols],
  )

  const afterMove = React.useCallback(async (): Promise<void> => {
    if (checkObjective()) {
      finishLevel(true)
      return
    }
    if (movesRef.current <= 0) {
      finishLevel(false)
      return
    }
    if (!hasAnyMove(cloneGrid(gridRef.current))) {
      showToast('The loom is stuck — reshuffling threads…')
      sfx.shuffle()
      const ng = shuffleGrid(cloneGrid(gridRef.current), level.types)
      setGridBoth(ng)
      await sleep(450)
      await cascadeLoop()
    }
  }, [cascadeLoop, checkObjective, finishLevel, level.types, setGridBoth, showToast])

  /* ------- swap flow ------- */
  const attemptSwap = React.useCallback(
    async (a: Cell, b: Cell, opts?: { free?: boolean }): Promise<void> => {
      if (busyRef.current || pausedRef.current || statusRef.current !== 'playing') return
      if (!a || !b || typeof a.r !== 'number' || typeof b.r !== 'number') return
      if (!adjacent(a, b)) return
      lock(true)
      setSelectedBoth(null)
      setHint(null)

      const g0 = cloneGrid(gridRef.current)
      const ta = g0[a.r]?.[a.c]
      const tb = g0[b.r]?.[b.c]
      if (!ta || !tb) {
        lock(false)
        return
      }

      const swapped = cloneGrid(g0)
      swapped[a.r][a.c] = { ...tb }
      swapped[b.r][b.c] = { ...ta }
      setGridBoth(swapped)
      sfx.swap()
      await sleep(190)

      const g1 = gridRef.current
      const prismInvolved = ta.special === 'prism' || tb.special === 'prism'
      const specialVsSpecial = !prismInvolved && ta.special !== 'none' && tb.special !== 'none'
      // g1 already contains the swapped tiles, so any shape present now was created by the swap
      const valid = prismInvolved || specialVsSpecial || findShapes(g1).length > 0

      if (!valid) {
        setGridBoth(g0)
        sfx.invalid()
        await sleep(190)
        lock(false)
        return
      }

      if (!opts?.free) {
        movesRef.current -= 1
        setMovesLeft(movesRef.current)
      }
      vibrate(10)

      if (prismInvolved) {
        await activatePrism(a, b)
      } else if (specialVsSpecial) {
        const seed = new Set([key(a.r, a.c), key(b.r, b.c)])
        sfx.bomb()
        await blast({ cells: expandSpecials(g1, seed), promotions: new Map() }, 0)
        await cascadeLoop()
      } else {
        await cascadeLoop([a, b])
      }
      await afterMove()
      lock(false)
    },
    [activatePrism, afterMove, blast, cascadeLoop, lock, setGridBoth, setSelectedBoth, vibrate],
  )

  /* ------- boosters ------- */
  const armBooster = React.useCallback(
    (kind: BoosterKind) => {
      if (busyRef.current || pausedRef.current || statusRef.current !== 'playing') return
      if (inventory[kind] <= 0) return
      initAudio()
      if (kind === 'lens') {
        // LENS executes the weave instantly (no move spent)
        if (!spendBooster('lens')) return
        setArmed(null)
        setSelectedBoth(null)
        sfx.lens()
        const moves = findAllMoves(cloneGrid(gridRef.current))
        if (moves.length === 0) {
          showToast('No threads available — the loom reshuffles…')
          const ng = shuffleGrid(cloneGrid(gridRef.current), level.types)
          setGridBoth(ng)
          return
        }
        void attemptSwap(moves[0][0], moves[0][1], { free: true })
        return
      }
      sfx.booster()
      setArmed(armedRef.current === 'null' ? null : 'null')
      setSelectedBoth(null)
    },
    [attemptSwap, inventory, level.types, setArmed, setGridBoth, setSelectedBoth, showToast, spendBooster],
  )

  const nullifyCell = React.useCallback(
    async (cell: Cell): Promise<void> => {
      if (busyRef.current || statusRef.current !== 'playing') return
      if (!spendBooster('null')) {
        setArmed(null)
        return
      }
      lock(true)
      setArmed(null)
      setSelectedBoth(null)
      setHint(null)
      sfx.nullify()
      vibrate(16)

      const g = cloneGrid(gridRef.current)
      const t = g[cell.r]?.[cell.c]
      if (!t) {
        lock(false)
        return
      }
      t.clearing = true
      setGridBoth(g)
      await sleep(230)

      applyClear(g, { cells: new Set([key(cell.r, cell.c)]), promotions: new Map() })
      const grav = applyGravity(g, level.types)
      setGridBoth(g)
      if (grav.spawnedIds.length > 0) await sleep(430 + level.cols * 26 + 60)
      else await sleep(280)
      const g2 = cloneGrid(gridRef.current)
      let dirty = false
      for (const row of g2) {
        for (const tl of row) {
          if (tl && tl.spawned) {
            delete tl.spawned
            dirty = true
          }
        }
      }
      if (dirty) setGridBoth(g2)

      await cascadeLoop()
      await afterMove()
      lock(false)
    },
    [afterMove, cascadeLoop, level.cols, level.types, lock, setArmed, setGridBoth, setSelectedBoth, spendBooster, vibrate],
  )

  /* ------- pointer input ------- */
  const cellFromPoint = React.useCallback(
    (x: number, y: number): Cell | null => {
      const el = boardRef.current
      if (!el) return null
      const rect = el.getBoundingClientRect()
      const c = Math.floor(((x - rect.left) / rect.width) * level.cols)
      const r = Math.floor(((y - rect.top) / rect.height) * level.rows)
      if (r < 0 || c < 0 || r >= level.rows || c >= level.cols) return null
      return { r, c }
    },
    [level.cols, level.rows],
  )

  const resetHintTimer = React.useCallback(() => {
    if (hintTimer.current) clearTimeout(hintTimer.current)
    setHint(null)
    hintTimer.current = setTimeout(() => {
      if (busyRef.current || pausedRef.current || statusRef.current !== 'playing') return
      try {
        const moves = findAllMoves(cloneGrid(gridRef.current))
        if (moves.length > 0) setHint(moves[Math.floor(Math.random() * moves.length)])
      } catch {
        /* never let the hint probe crash the game */
      }
    }, 6000)
  }, [])

  React.useEffect(() => {
    resetHintTimer()
    return () => {
      if (hintTimer.current) clearTimeout(hintTimer.current)
    }
    // re-arm after activity
  }, [score, movesLeft, busy, resetHintTimer])

  const onPointerDown = (e: React.PointerEvent) => {
    if (busyRef.current || pausedRef.current || statusRef.current !== 'playing') return
    const cell = cellFromPoint(e.clientX, e.clientY)
    if (!cell) return
    resetHintTimer()
    if (armedRef.current === 'null') {
      void nullifyCell(cell)
      return
    }
    dragRef.current = { startCell: cell, x: e.clientX, y: e.clientY, done: false }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d || d.done || busyRef.current || pausedRef.current || statusRef.current !== 'playing') return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    const el = boardRef.current
    if (!el) return
    const cellPx = el.getBoundingClientRect().width / level.cols
    if (Math.hypot(dx, dy) >= cellPx * 0.35) {
      d.done = true
      const dir =
        Math.abs(dx) > Math.abs(dy)
          ? { dr: 0, dc: dx > 0 ? 1 : -1 }
          : { dr: dy > 0 ? 1 : -1, dc: 0 }
      const target = { r: d.startCell.r + dir.dr, c: d.startCell.c + dir.dc }
      if (target.r >= 0 && target.c >= 0 && target.r < level.rows && target.c < level.cols) {
        setSelectedBoth(null)
        void attemptSwap(d.startCell, target)
      }
    }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current
    dragRef.current = null
    if (!d || d.done) return
    if (busyRef.current || pausedRef.current || statusRef.current !== 'playing') return
    const cell = cellFromPoint(e.clientX, e.clientY)
    if (!cell) {
      setSelectedBoth(null)
      return
    }
    if (armedRef.current === 'null') {
      void nullifyCell(cell)
      return
    }
    // pure tap/select logic — side effects happen outside any state updater
    const sel = selectedRef.current
    if (!sel) {
      sfx.select()
      setSelectedBoth(cell)
      return
    }
    if (sel.r === cell.r && sel.c === cell.c) {
      setSelectedBoth(null)
      return
    }
    if (adjacent(sel, cell)) {
      const a = sel
      setSelectedBoth(null)
      void attemptSwap(a, cell)
      return
    }
    sfx.select()
    setSelectedBoth(cell)
  }

  /* ------- render ------- */
  const obj = level.objective
  const bgKey = level.chapter > 0 ? CHAPTERS[level.chapter - 1].bg : 'bg-altar'
  const stageLabel = isDaily ? 'DAILY PAGE' : `STAGE ${stageTitle(level)}`

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden ww-tap-none">
      {/* backdrop */}
      <div aria-hidden className="absolute inset-0">
        <img src={A(bgKey)} alt="" className="w-full h-full object-cover" draggable={false} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0e1c14]/45 via-[#0e1c14]/20 to-[#0e1c14]/55" />
      </div>

      {/* HUD — ribbon row */}
      <header className="relative z-20 flex items-start gap-2 px-3 pt-3">
        <IconButton
          img={A('icon-pause')}
          label="Pause"
          className="mt-1.5"
          onClick={() => {
            discover('entity:rest')
            pausedRef.current = true
            setPaused(true)
          }}
        />
        <div className="flex-1 min-w-0 flex justify-center">
          <RibbonBanner title={stageLabel} subtitle={level.name} size="sm" className="w-full max-w-[300px]" />
        </div>
        <div
          className="hud-pill rounded-2xl px-3 py-1 flex flex-col items-center leading-none mt-0.5 min-w-[64px]"
          aria-label={`${movesLeft} moves left`}
        >
          <span className="text-[9px] uppercase tracking-widest text-[#d9c79a] font-bold">Moves</span>
          <span
            className={cn(
              'font-display text-xl font-extrabold tabular-nums',
              movesLeft <= 3 && 'text-[#ff9d7a] animate-pulse',
            )}
          >
            {movesLeft}
          </span>
        </div>
      </header>

      {/* goals + score */}
      <section className="relative z-20 px-3 mt-2 flex items-stretch gap-2" aria-label="Score and objectives">
        <div className="goal-card flex-1 min-w-0 px-2.5 py-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          {obj.kind === 'collect'
            ? (obj.collect ?? []).map((goal) => {
                const have = Math.min(collected[goal.type] ?? 0, goal.count)
                const done = have >= goal.count
                return (
                  <div key={goal.type} className="flex items-center gap-1.5 min-w-[118px] flex-1">
                    <img
                      src={TILE_IMG[goal.type]}
                      alt={TILE_META[goal.type].name}
                      className="w-8 h-8 object-contain drop-shadow shrink-0"
                      draggable={false}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] leading-tight text-[#5d3a1a] font-bold truncate">
                        {done ? '✓ ' : 'Collect '}
                        {goal.count} {TILE_META[goal.type].name}
                        {goal.count > 1 ? '' : ''}
                      </p>
                      <ProgressBar value={have / goal.count} className="h-2 mt-0.5" />
                      <p className={cn('text-[9px] font-bold tabular-nums', done ? 'text-[#4c8a28]' : 'text-[#7a5c34]')}>
                        {have} / {goal.count}
                      </p>
                    </div>
                  </div>
                )
              })
            : (() => {
                const target = obj.score ?? level.star3
                const have = Math.min(score, target)
                const done = score >= target
                return (
                  <div className="flex items-center gap-1.5 flex-1 min-w-[118px]">
                    <img src={A('star-sparkle')} alt="" className="w-8 h-8 object-contain drop-shadow shrink-0" draggable={false} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] leading-tight text-[#5d3a1a] font-bold truncate">
                        {done ? '✓ ' : ''}Weave {target.toLocaleString()} threads
                      </p>
                      <ProgressBar value={have / target} className="h-2 mt-0.5" />
                      <p className={cn('text-[9px] font-bold tabular-nums', done ? 'text-[#4c8a28]' : 'text-[#7a5c34]')}>
                        {have.toLocaleString()} / {target.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )
              })()}
        </div>
        <div className="hud-pill rounded-2xl px-3 py-1 flex flex-col items-center justify-center min-w-[92px]" aria-live="polite">
          <span className="text-[9px] uppercase tracking-widest text-[#d9c79a] font-bold">Score</span>
          <CountUp value={score} duration={500} className="font-display text-lg font-extrabold" />
          <div className="flex gap-0.5 mt-0.5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <img
                key={i}
                src={A('star-sparkle')}
                alt=""
                draggable={false}
                className={cn('w-3 h-3 object-contain', i === 0 ? (score > 0 ? '' : 'grayscale opacity-40') : score >= (i === 1 ? level.star2 : level.star3) ? '' : 'grayscale opacity-40')}
              />
            ))}
          </div>
        </div>
      </section>

      {/* board */}
      <main ref={wrapRef} className="relative z-10 flex-1 min-h-0 flex items-center justify-center px-3 py-2">
        <div
          className="board-frame"
          style={{ width: size.w + 12, height: size.h + 12, padding: 5, opacity: size.w > 0 ? 1 : 0 }}
        >
          <div
            ref={boardRef}
            role="application"
            aria-label={`${level.rows} by ${level.cols} weaving board. Drag or tap charms to swap.`}
            className={cn(
              'relative w-full h-full rounded-[0.7rem] overflow-hidden touch-none select-none',
              armedBooster === 'null' && 'cursor-crosshair',
            )}
            style={{
              backgroundImage: 'linear-gradient(180deg, #1c2e1f 0%, #16251a 100%)',
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => (dragRef.current = null)}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* cell sockets */}
            {size.w > 0 &&
              Array.from({ length: level.rows * level.cols }).map((_, i) => {
                const r = Math.floor(i / level.cols)
                const c = i % level.cols
                return (
                  <div
                    key={i}
                    aria-hidden
                    className="absolute"
                    style={{
                      left: `${(c * 100) / level.cols}%`,
                      top: `${(r * 100) / level.rows}%`,
                      width: `${100 / level.cols}%`,
                      height: `${100 / level.rows}%`,
                    }}
                  >
                    <div className={cn('absolute inset-[5%] board-cell', (r + c) % 2 === 1 && 'board-cell-alt')} />
                  </div>
                )
              })}

            {grid.flatMap((row, r) =>
              row.map((t, c) => {
                if (!t) return null
                return (
                  <TileView
                    key={t.id}
                    tile={t}
                    r={r}
                    c={c}
                    rows={level.rows}
                    cols={level.cols}
                    selected={!!selected && selected.r === r && selected.c === c}
                    hinted={!!hint && hint.some((h) => h.r === r && h.c === c)}
                  />
                )
              }),
            )}

            {/* floaters */}
            {floaters.map((f) => (
              <div
                key={f.id}
                className="absolute pointer-events-none z-30"
                style={{ left: `${((f.c + 0.5) * 100) / level.cols}%`, top: `${((f.r + 0.5) * 100) / level.rows}%`, width: 0, height: 0 }}
              >
                <span className="anim-rise absolute font-display font-black text-lg text-[#ffe9a8] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] whitespace-nowrap -translate-x-1/2">
                  {f.text}
                </span>
              </div>
            ))}

            {/* combo banner */}
            {combo && (
              <div key={combo.id} className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
                <span className="anim-combo font-display italic font-black text-3xl text-[#ffd76e] px-6 py-1.5 rounded-full border-2 border-[#f4c05a] bg-gradient-to-b from-[#2c4a6e]/95 to-[#16263e]/95 drop-shadow-[0_4px_10px_rgba(0,0,0,0.55)]">
                  Combo ×{combo.n}!
                </span>
              </div>
            )}

            {/* objective complete flash */}
            {goalFlash && (
              <div key={goalFlash.id} className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
                <img src={A('banner-objective')} alt="Objective complete!" draggable={false} className="anim-combo w-48 drop-shadow-2xl" />
              </div>
            )}

            {/* toast */}
            {toast && (
              <div className="absolute inset-x-0 bottom-3 z-40 flex justify-center pointer-events-none">
                <span className="hud-pill rounded-full px-4 py-1.5 text-xs font-bold anim-fade-in">{toast}</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* boosters + hint */}
      <footer className="relative z-20 px-4 pb-2 pt-0.5 flex items-center justify-between gap-3">
        <BoosterButton
          kind="lens"
          count={inventory.lens}
          armed={armedBooster === 'lens'}
          disabled={busy || status !== 'playing'}
          onClick={() => armBooster('lens')}
        />
        <p className="flex-1 min-w-0 text-center text-[10px] leading-tight text-[#f4e9c8]/85 ww-text-outline font-medium">
          {armedBooster === 'null' ? 'Tap any charm to unweave it…' : level.hint}
        </p>
        <BoosterButton
          kind="null"
          count={inventory.null}
          armed={armedBooster === 'null'}
          disabled={busy || status !== 'playing'}
          onClick={() => armBooster('null')}
        />
      </footer>

      {/* modals */}
      {paused && status === 'playing' && (
        <PauseModal
          level={level}
          isDaily={isDaily}
          onResume={() => {
            pausedRef.current = false
            setPaused(false)
            resetHintTimer()
          }}
          onRestart={() => {
            pausedRef.current = false
            setPaused(false)
            resetLevel()
          }}
          onOptions={() => onOpenInstruments()}
          onQuit={() => {
            pausedRef.current = false
            setPaused(false)
            onExit()
          }}
        />
      )}
      {result && status === 'won' && (
        <FolioSealedModal
          level={level}
          result={result}
          rewards={rewards}
          isDaily={isDaily}
          hasNext={isDaily || hasNextStage}
          onNext={() => (isDaily ? onExit() : onPlayLevel(level.id + 1))}
          onReplay={resetLevel}
          onExit={onExit}
        />
      )}
      {result && status === 'lost' && (
        <FolioLostModal level={level} isDaily={isDaily} score={result.score} onReplay={resetLevel} onExit={onExit} />
      )}
    </div>
  )
}

/* ---------------- booster button ---------------- */

function BoosterButton({
  kind,
  count,
  armed,
  disabled,
  onClick,
}: {
  kind: BoosterKind
  count: number
  armed: boolean
  disabled?: boolean
  onClick: () => void
}) {
  const label = kind === 'lens' ? 'Lens' : 'Null'
  return (
    <button
      type="button"
      aria-label={`${label} booster — ${count} remaining${kind === 'lens' ? '. Instantly weaves one thread without spending a move.' : '. Unweaves any single charm without spending a move.'}`}
      disabled={disabled || count <= 0}
      onClick={onClick}
      className={cn('booster-btn w-[54px] h-[54px] shrink-0', armed && 'booster-armed')}
    >
      {kind === 'lens' ? (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="#5d3a1a" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
          <circle cx="10.5" cy="10.5" r="6.2" />
          <path d="m15.3 15.3 5 5" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="#5d3a1a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M14.5 4.5 19 9l-2.5 2.5L12 7l2.5-2.5ZM12 7 5 14v5h5l7-7" />
          <path d="m13 12 5-5" />
        </svg>
      )}
      <span className="text-[8px] font-display font-extrabold uppercase tracking-widest text-[#5d3a1a] leading-none">
        {label}
      </span>
      <span className="booster-count" aria-hidden>
        {count}
      </span>
    </button>
  )
}

/* ---------------- tile ---------------- */

function TileView({
  tile,
  r,
  c,
  rows,
  cols,
  selected,
  hinted,
}: {
  tile: Tile
  r: number
  c: number
  rows: number
  cols: number
  selected: boolean
  hinted: boolean
}) {
  const spawned = !!tile.spawned
  const specialClass =
    tile.special === 'lineH' || tile.special === 'lineV'
      ? 'special-lineH'
      : tile.special === 'bomb'
        ? 'special-bomb'
        : ''
  return (
    <div
      className={cn('absolute left-0 top-0 tile-anim-fall', tile.clearing && 'tile-clearing')}
      style={{
        width: `${100 / cols}%`,
        height: `${100 / rows}%`,
        transform: `translate(${c * 100}%, ${(spawned ? r - rows : r) * 100}%)`,
        transition: spawned
          ? `transform 430ms cubic-bezier(0.3, 0.85, 0.35, 1.12) ${c * 24}ms`
          : 'transform 240ms cubic-bezier(0.3, 0.8, 0.35, 1.05)',
        zIndex: selected ? 20 : 10,
      }}
    >
      <div
        className={cn(
          'absolute inset-[7%] flex items-center justify-center',
          selected && 'anim-tile-select z-20',
          hinted && !selected && 'anim-wiggle',
          specialClass,
        )}
        style={{ borderRadius: '26%' }}
      >
        <img
          src={tile.special === 'prism' ? A('fx-rainbow') : TILE_IMG[tile.type]}
          alt=""
          draggable={false}
          className={cn(
            'tile-img w-full h-full object-contain drop-shadow-[0_3px_3px_rgba(0,0,0,0.4)] pointer-events-none',
            tile.special === 'prism' && 'anim-prism scale-110',
          )}
        />
        {tile.special === 'lineH' && (
          <img src={A('icon-bolt')} alt="" draggable={false} className="absolute w-[46%] h-[46%] object-contain -rotate-90 drop-shadow" />
        )}
        {tile.special === 'lineV' && (
          <img src={A('icon-bolt')} alt="" draggable={false} className="absolute w-[46%] h-[46%] object-contain drop-shadow" />
        )}
        {tile.special === 'bomb' && (
          <span className="absolute inset-[18%] rounded-full bg-[radial-gradient(circle,rgba(255,150,80,0.55),transparent_70%)] animate-pulse" />
        )}
      </div>
    </div>
  )
}
