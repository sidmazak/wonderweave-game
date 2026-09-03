'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { A, TILE_IMG } from '@/lib/game/assets'
import { TILE_META, stageTitle, playBgForLevel, chapterBackdropTint, chapterOf } from '@/lib/game/levels'
import {
  applyClear,
  applyGravity,
  cloneGrid,
  comboLabel,
  comboPlan,
  createGrid,
  expandSpecials,
  findAllMoves,
  findShapes,
  hasAnyMove,
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
import { SCORE_GOAL_HINT, scoreGoalLabel, scoreObjectiveTarget, starRatingProgress } from '@/lib/game/objectives'
import { useVibrate } from './settings'
import { BoardTileIcon, CountUp, HudStat, IconButton, ProgressBar, RibbonBanner, SceneBackdrop, ScoreGoalIcon, StarIcon } from './ui'
import { FolioSealedModal, FolioLostModal, PauseModal } from './modals'

const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms))
/** two paints — guarantees the browser has rendered the current styles before continuing */
const nextPaint = () => new Promise<void>((res) => requestAnimationFrame(() => requestAnimationFrame(() => res())))

function adjacent(a: Cell, b: Cell): boolean {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1
}

export interface RewardSummary {
  lumens: number
  lens: number
  null: number
  streak?: number
  /** false when this seal merely replayed a mastered stage (consolation rewards) */
  improved?: boolean
  discoveries?: string[]
  chapterSealed?: boolean
  chapterId?: number
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
  /** when set, the banner shows this special-weave name instead of the cascade multiplier */
  text?: string
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

  /* ------- board shake for big weaves ------- */
  const [shakeId, setShakeId] = React.useState(0)
  const shakeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerShake = React.useCallback(() => {
    const id = Date.now()
    setShakeId(id)
    if (shakeTimer.current) clearTimeout(shakeTimer.current)
    shakeTimer.current = setTimeout(() => {
      shakeTimer.current = null
      setShakeId((cur) => (cur === id ? 0 : cur))
    }, 460)
  }, [])
  React.useEffect(() => {
    return () => {
      if (shakeTimer.current) clearTimeout(shakeTimer.current)
    }
  }, [])

  /* ------- low-moves heartbeat (3 / 2 / 1) ------- */
  const urgentRef = React.useRef<number | null>(null)

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

  /* ------- board sizing — fill the column; frame chrome is included in the box ------- */
  const FRAME_PAD = 6
  React.useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => {
      const cs = getComputedStyle(el)
      const availW = el.clientWidth - parseFloat(cs.paddingLeft || '0') - parseFloat(cs.paddingRight || '0')
      const availH = el.clientHeight - parseFloat(cs.paddingTop || '0') - parseFloat(cs.paddingBottom || '0')
      const frameChrome = FRAME_PAD * 2
      const maxInnerW = Math.max(100, availW - frameChrome)
      const maxInnerH = Math.max(100, availH - frameChrome)
      // fit the largest board that still fits both axes (no leftover side gutters when height allows)
      const byWidth = maxInnerW
      const byHeight = maxInnerH * (level.cols / level.rows)
      const inner = Math.max(100, Math.min(byWidth, byHeight))
      setSize({ w: inner, h: (inner * level.rows) / level.cols })
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
    clearSpawnedNextFrame()
    const t = setTimeout(() => lock(false), 460)
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
    urgentRef.current = null
    setFloaters([])
    setResult(null)
    setRewards(null)
    setStatus('playing')
    statusRef.current = 'playing'
    setPaused(false)
    pausedRef.current = false
    lock(true)
    setTimeout(() => lock(false), 460)
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

  const showCombo = React.useCallback((n: number, text?: string) => {
    const id = comboSeq++
    setCombo({ id, n, text })
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
        vibrate(42)
        for (let i = 0; i < stars; i++) setTimeout(() => sfx.star(i), 500 + i * 380)
        setRewards(onWin(res))
      } else {
        sfx.lose()
        vibrate(28)
      }
    },
    [level, onWin, vibrate],
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

      // big weaves rattle the frame
      if (cellsArr.length >= 10) triggerShake()

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
      await sleep(180)

      // clear + gravity — tiles mount in their above-frame slots, then the very
      // next paint releases them, so the refill starts instantly (no dead delay)
      applyClear(g, plan)
      const grav = applyGravity(g, level.types)
      setGridBoth(g)
      if (grav.spawnedIds.length > 0) {
        await nextPaint()
        const g2 = cloneGrid(gridRef.current)
        let dirty = false
        for (const row of g2) {
          for (const t of row) {
            if (t && t.spawned) {
              delete t.spawned
              delete t.spawnDrop
              dirty = true
            }
          }
        }
        if (dirty) setGridBoth(g2)
        await sleep(400)
      } else {
        await sleep(230)
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
    [addFloater, level, setGridBoth, showCombo, triggerShake, vibrate],
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
      showToast('The loom is stuck — reshuffling the board…')
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
      await sleep(150)

      const g1 = gridRef.current
      const prismInvolved = ta.special === 'prism' || tb.special === 'prism'
      // the full special+special weave table — non-null only when BOTH tiles are special
      const combo = comboPlan(g1, a, b)
      // g1 already contains the swapped tiles, so any shape present now was created by the swap
      const valid = prismInvolved || combo !== null || findShapes(g1).length > 0

      if (!valid) {
        setGridBoth(g0)
        sfx.invalid()
        await sleep(160)
        lock(false)
        return
      }

      if (!opts?.free) {
        movesRef.current -= 1
        setMovesLeft(movesRef.current)
        // heartbeat as the loom runs out of moves (3 / 2 / 1)
        if (movesRef.current >= 1 && movesRef.current <= 3 && urgentRef.current !== movesRef.current) {
          urgentRef.current = movesRef.current
          sfx.urgent()
        }
      }
      vibrate(10)

      if (combo) {
        // special + special weave: tiered fanfare, banner, bonus, then the blast
        const tier = combo.kind === 'blackhole' ? 3 : combo.kind === 'lineStorm' || combo.kind === 'bombStorm' ? 2 : 1
        sfx.combo(tier)
        vibrate(24)
        showCombo(1, comboLabel(combo.kind))
        scoreRef.current += combo.bonus
        setScore(scoreRef.current)
        addFloater((a.r + b.r) / 2, (a.c + b.c) / 2, `+${combo.bonus}`)
        triggerShake()
        await blast({ cells: expandSpecials(g1, combo.cells), promotions: new Map() }, 0)
        await cascadeLoop()
      } else if (prismInvolved) {
        await activatePrism(a, b)
      } else {
        await cascadeLoop([a, b])
      }
      await afterMove()
      lock(false)
    },
    [
      activatePrism,
      addFloater,
      afterMove,
      blast,
      cascadeLoop,
      lock,
      setGridBoth,
      setSelectedBoth,
      showCombo,
      triggerShake,
      vibrate,
    ],
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
          showToast('No valid moves — the loom reshuffles…')
          const ng = shuffleGrid(cloneGrid(gridRef.current), level.types)
          setGridBoth(ng)
          return
        }
        void attemptSwap(moves[0][0], moves[0][1], { free: true })
        return
      }
      sfx.booster()
      if (armedRef.current === 'null') {
        setArmed(null)
      } else {
        setArmed('null')
        showToast('Tap any charm to unweave it…')
      }
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
      await sleep(180)

      applyClear(g, { cells: new Set([key(cell.r, cell.c)]), promotions: new Map() })
      const grav = applyGravity(g, level.types)
      setGridBoth(g)
      if (grav.spawnedIds.length > 0) {
        await nextPaint()
        const g2 = cloneGrid(gridRef.current)
        let dirty = false
        for (const row of g2) {
          for (const tl of row) {
            if (tl && tl.spawned) {
              delete tl.spawned
              delete tl.spawnDrop
              dirty = true
            }
          }
        }
        if (dirty) setGridBoth(g2)
        await sleep(400)
      } else {
        await sleep(230)
      }

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
  const starProgress = starRatingProgress(level, score, collected)
  const bgKey = playBgForLevel(level.id)
  const stageLabel = isDaily ? 'DAILY PAGE' : `STAGE ${stageTitle(level)}`
  const ch = chapterOf(level.id)

  /* static cell sockets — rebuilt only when the board size changes, not on every state change */
  const sockets = React.useMemo(
    () =>
      size.w > 0
        ? Array.from({ length: level.rows * level.cols }).map((_, i) => {
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
          })
        : null,
    [level.rows, level.cols, size.w],
  )

  return (
    <div className="play-screen relative flex-1 flex flex-col overflow-hidden ww-tap-none">
      <SceneBackdrop
        src={A(bgKey)}
        tint={chapterBackdropTint(bgKey)}
        overlayClassName="bg-gradient-to-b from-[#0e1c14]/45 via-[#0e1c14]/20 to-[#0e1c14]/55"
      />

      <div className="play-screen-inner">
      {/* HUD — ribbon row */}
      <header className="play-hud-header relative z-20 ww-gutter-x ww-gutter-t">
        <div className="play-hud-header-row">
          <IconButton
            img={A('icon-pause')}
            label="Pause"
            className="shrink-0"
            onClick={() => {
              discover('entity:rest')
              pausedRef.current = true
              setPaused(true)
            }}
          />
          <RibbonBanner
            title={stageLabel}
            subtitle={isDaily ? 'Daily Folio' : `Chapter ${ch.numeral}`}
            size="sm"
            fluid
            className="play-hud-ribbon min-w-0"
          />
          <HudStat
            label="Moves"
            value={movesLeft}
            aria-label={`${movesLeft} moves left`}
            valueClassName={cn(movesLeft <= 3 && 'text-[#ff9d7a] animate-pulse')}
          />
        </div>

        {/* poetic chapter hint — chapter title + tagline */}
        {!isDaily && level.name ? (
          <p className="play-hud-hint relative z-20 text-[#f4e9c8]/90 line-clamp-2">
            <span className="font-semibold not-italic text-[#ffe9a8]/95">{level.name}</span>
            {level.hint ? <span className="opacity-90"> — {level.hint}</span> : null}
          </p>
        ) : level.hint ? (
          <p className="play-hud-hint relative z-20 text-[#f4e9c8]/85 line-clamp-2">{level.hint}</p>
        ) : null}
      </header>

      {/* goals + score */}
      <section className="relative z-20 ww-gutter-x mt-1.5 flex items-stretch gap-2" aria-label="Score and objectives">
        <div className="goal-card flex-1 min-w-0 px-2.5 py-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          {obj.kind === 'collect'
            ? (obj.collect ?? []).map((goal) => {
                const have = Math.min(collected[goal.type] ?? 0, goal.count)
                const done = have >= goal.count
                return (
                  <div key={goal.type} className="flex items-center gap-2 min-w-[118px] flex-1">
                    <BoardTileIcon type={goal.type} size="goal" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] leading-tight text-[#5d3a1a] font-bold truncate">
                        {done ? '✓ ' : ''}
                        Collect {goal.count}× {TILE_META[goal.type].name}
                      </p>
                      <p className="text-[9px] leading-tight text-[#7a5c34] font-semibold truncate">
                        Match this charm on the board
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
                const target = scoreObjectiveTarget(level)
                const have = Math.min(score, target)
                const done = score >= target
                return (
                  <div className="flex items-center gap-2 flex-1 min-w-[118px]">
                    <ScoreGoalIcon />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] leading-tight text-[#5d3a1a] font-bold truncate">
                        {done ? '✓ ' : ''}
                        {scoreGoalLabel(target)}
                      </p>
                      <p className="text-[9px] leading-tight text-[#7a5c34] font-semibold truncate">{SCORE_GOAL_HINT}</p>
                      <ProgressBar value={have / target} className="h-2 mt-0.5" />
                      <p className={cn('text-[9px] font-bold tabular-nums', done ? 'text-[#4c8a28]' : 'text-[#7a5c34]')}>
                        {have.toLocaleString()} / {target.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )
              })()}
        </div>
        <div className="hud-pill hud-stat hud-stat-score rounded-2xl" aria-live="polite" aria-label={`Score: ${score}`}>
          <span className="hud-stat-label">Score</span>
          <CountUp value={score} duration={500} className="hud-stat-value font-display" />
          <div
            className="hud-stat-stars flex gap-0.5"
            role="img"
            aria-label={`Star rating: ${starProgress.filter(Boolean).length} of 3`}
          >
            {starProgress.map((lit, i) => (
              <StarIcon key={i} size={11} lit={lit} empty="bright" />
            ))}
          </div>
        </div>
      </section>

      {/* board — nearly edge-to-edge; sizing fills available width/height */}
      <main ref={wrapRef} className="play-board-wrap relative z-10 flex-1 min-h-0 flex items-center justify-center">
        <div
          className={cn('board-frame play-board-frame', shakeId > 0 && 'anim-board-shake')}
          style={{
            width: size.w + FRAME_PAD * 2,
            height: size.h + FRAME_PAD * 2,
            padding: FRAME_PAD,
            opacity: size.w > 0 ? 1 : 0,
          }}
        >
          <div
            ref={boardRef}
            role="application"
            aria-label={`${level.rows} by ${level.cols} weaving board. Drag or tap charms to swap.`}
            className={cn(
              'relative w-full h-full rounded-sm overflow-hidden touch-none select-none board-surface',
              armedBooster === 'null' && 'cursor-crosshair',
            )}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => (dragRef.current = null)}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* cell sockets (memoized) */}
            {sockets}

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
                <span className="anim-combo combo-banner font-display italic font-black text-3xl px-6 py-1.5 rounded-full">
                  {combo.text ?? `Combo ×${combo.n}!`}
                </span>
              </div>
            )}

            {/* objective complete flash */}
            {goalFlash && (
              <div key={goalFlash.id} className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
                <span className="anim-combo objective-banner font-display font-black text-2xl px-6 py-2 rounded-full">
                  Objective complete!
                </span>
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

      {/* boosters */}
      <footer className="relative z-20 ww-gutter-x ww-gutter-b pt-1 flex items-center justify-between gap-3">
        <BoosterButton
          kind="lens"
          count={inventory.lens}
          armed={armedBooster === 'lens'}
          disabled={busy || status !== 'playing'}
          onClick={() => armBooster('lens')}
        />
        <div className="flex-1 min-w-0" aria-hidden />
        <BoosterButton
          kind="null"
          count={inventory.null}
          armed={armedBooster === 'null'}
          disabled={busy || status !== 'playing'}
          onClick={() => armBooster('null')}
        />
      </footer>
      </div>

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
  const label = kind === 'lens' ? 'Lens' : 'Unweave'
  return (
    <div className="booster-wrap">
      <button
        type="button"
        aria-label={`${label} booster — ${count} remaining${kind === 'lens' ? '. Finds one valid match without spending a move.' : '. Removes any single charm without spending a move.'}`}
        disabled={disabled || count <= 0}
        onClick={onClick}
        className={cn('booster-btn w-12 h-12 shrink-0', armed && 'booster-armed')}
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
        <span className="booster-count" aria-hidden>
          {count}
        </span>
      </button>
      <span className="booster-label">{label}</span>
    </div>
  )
}

/* ---------------- tile (memoized — re-renders only when its tile/position/flags change) ---------------- */

const TileView = React.memo(function TileView({
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
        // refilled tiles start exactly `spawnDrop` cells above their socket — the
        // whole column falls in as one connected strip, so no gaps ever show
        transform: `translate(${c * 100}%, ${(spawned ? r - (tile.spawnDrop ?? rows) : r) * 100}%)`,
        transition: spawned
          ? 'transform 380ms cubic-bezier(0.34, 0.7, 0.3, 1.04)'
          : 'transform 220ms cubic-bezier(0.3, 0.75, 0.3, 1.03)',
        zIndex: selected ? 20 : 10,
        willChange: 'transform',
      }}
    >
      {/* key flips when the tile is released → remount arms the landing squash,
          which fires (via CSS delay) exactly when the 380ms fall completes */}
      <div
        key={spawned ? 'in-flight' : 'landed'}
        className={cn(
          'anim-tile-land absolute inset-[7%] flex items-center justify-center',
          selected && 'anim-tile-select z-20',
          hinted && !selected && 'anim-wiggle',
          specialClass,
        )}
        style={{ borderRadius: '12%' }}
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
})
