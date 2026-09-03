'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { BoosterInventory, BoosterKind, DailyRewards, DailyState } from '@/lib/game/types'
import { dateKey, dailyRewardFor, yesterdayKey } from '@/lib/game/daily'
import { discover, resetCodex } from '@/lib/game/codex'
import { LEVELS_PER_CHAPTER, TOTAL_CHAPTERS, chapterOf } from '@/lib/game/levels'
import { generateWeaverName, isLegacyWeaverName } from '@/lib/game/weaver-names'
import { ensureSaveSchema } from '@/lib/game/save-schema'

export interface LevelRecord {
  stars: number
  bestScore: number
}

export type ProgressMap = Record<number, LevelRecord>

const LS_PLAYER_ID = 'ww-player-id'
const LS_PLAYER_NAME = 'ww-player-name'
const LS_PROGRESS = 'ww-progress'
const LS_LUMENS = 'ww-lumens'
const LS_INVENTORY = 'ww-inventory'
const LS_DAILY = 'ww-daily'

const DEFAULT_INVENTORY: BoosterInventory = { lens: 3, null: 3 }

function storeWeaverName(name: string): string {
  localStorage.setItem(LS_PLAYER_NAME, name)
  return name
}

function freshWeaverName(): string {
  return storeWeaverName(generateWeaverName())
}

function newPlayerId(): string {
  const c = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined
  if (c && typeof c.randomUUID === 'function') {
    try {
      return c.randomUUID()
    } catch {
      /* insecure context — fall through */
    }
  }
  if (c && typeof c.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)
    c.getRandomValues(bytes)
    bytes[6] = (bytes[6]! & 0x0f) | 0x40
    bytes[8] = (bytes[8]! & 0x3f) | 0x80
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }
  return `ww-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function ensurePlayer(): { id: string; name: string } {
  if (typeof window === 'undefined') return { id: '', name: '' }
  let id = localStorage.getItem(LS_PLAYER_ID)
  if (!id) {
    id = newPlayerId()
    localStorage.setItem(LS_PLAYER_ID, id)
  }
  let name = localStorage.getItem(LS_PLAYER_NAME)
  if (!name || isLegacyWeaverName(name)) {
    name = freshWeaverName()
  }
  return { id, name }
}

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function saveJSON(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

/** Lumens earned for finishing a campaign stage — deterministic and readable:
    stars carry the bulk (20 each), score adds a small tail. */
export function levelRewards(stars: number, score: number): { lumens: number; lens: number; null: number } {
  return {
    lumens: stars * 20 + Math.floor(score / 500),
    lens: 1,
    null: stars >= 2 ? 1 : 0,
  }
}

/** Tiny consolation for re-sealing an already-mastered stage (no booster farming). */
export function replayRewards(stars: number): { lumens: number; lens: number; null: number } {
  return { lumens: 5 + stars * 2, lens: 0, null: 0 }
}

export function useProgress() {
  const [player, setPlayer] = useState<{ id: string; name: string }>({ id: '', name: '' })
  const [progress, setProgress] = useState<ProgressMap>({})
  const progressRef = useRef<ProgressMap>({})
  const [lumens, setLumens] = useState(0)
  const lumensRef = useRef(0)
  const [inventory, setInventory] = useState<BoosterInventory>(DEFAULT_INVENTORY)
  const inventoryRef = useRef<BoosterInventory>(DEFAULT_INVENTORY)
  const [daily, setDaily] = useState<DailyState>({ last: null, streak: 0 })
  const dailyRef = useRef<DailyState>({ last: null, streak: 0 })
  const nameRef = useRef('')

  useEffect(() => {
    ensureSaveSchema()
    const p = ensurePlayer()
    nameRef.current = p.name
    const local = loadJSON<ProgressMap>(LS_PROGRESS, {})
    progressRef.current = local
    setPlayer(p)
    setProgress(local)
    const lumensLoaded = loadJSON<number>(LS_LUMENS, 40)
    lumensRef.current = lumensLoaded
    setLumens(lumensLoaded)
    const invLoaded: BoosterInventory = { ...DEFAULT_INVENTORY, ...loadJSON<BoosterInventory>(LS_INVENTORY, DEFAULT_INVENTORY) }
    inventoryRef.current = invLoaded
    setInventory(invLoaded)
    const dailyLoaded = loadJSON<DailyState>(LS_DAILY, { last: null, streak: 0 })
    dailyRef.current = dailyLoaded
    setDaily(dailyLoaded)
  }, [])

  const saveResult = useCallback((levelId: number, score: number, stars: number) => {
    setProgress((prev) => {
      const cur = prev[levelId]
      const next: ProgressMap = {
        ...prev,
        [levelId]: {
          stars: Math.max(cur?.stars ?? 0, stars),
          bestScore: Math.max(cur?.bestScore ?? 0, score),
        },
      }
      progressRef.current = next
      saveJSON(LS_PROGRESS, next)
      return next
    })
  }, [])

  const addLumens = useCallback((n: number) => {
    const next = Math.max(0, lumensRef.current + n)
    lumensRef.current = next
    saveJSON(LS_LUMENS, next)
    setLumens(next)
  }, [])

  /** Synchronous spend; returns false when the balance is too low. */
  const spendLumens = useCallback((n: number): boolean => {
    if (lumensRef.current < n) return false
    const next = lumensRef.current - n
    lumensRef.current = next
    saveJSON(LS_LUMENS, next)
    setLumens(next)
    return true
  }, [])

  const addBoosters = useCallback((patch: Partial<BoosterInventory>) => {
    const inv = inventoryRef.current
    const next: BoosterInventory = {
      lens: Math.min(99, inv.lens + (patch.lens ?? 0)),
      null: Math.min(99, inv.null + (patch.null ?? 0)),
    }
    inventoryRef.current = next
    saveJSON(LS_INVENTORY, next)
    setInventory(next)
  }, [])

  /** Synchronous spend of a booster; returns false when out of stock. */
  const useBooster = useCallback((kind: BoosterKind): boolean => {
    const inv = inventoryRef.current
    if (inv[kind] <= 0) return false
    const next: BoosterInventory = { ...inv, [kind]: inv[kind] - 1 }
    inventoryRef.current = next
    saveJSON(LS_INVENTORY, next)
    setInventory(next)
    return true
  }, [])

  /** Mark today's daily as complete; grants streak-scaled rewards once per day. */
  const completeDaily = useCallback((): DailyRewards | null => {
    const today = dateKey()
    const prev = dailyRef.current
    if (prev.last === today) return null
    const streak = prev.last === yesterdayKey() ? prev.streak + 1 : 1
    const r = dailyRewardFor(streak)
    const rewards: DailyRewards = { ...r, streak }
    const next: DailyState = { last: today, streak }
    dailyRef.current = next
    saveJSON(LS_DAILY, next)
    setDaily(next)
    const l = lumensRef.current + r.lumens
    lumensRef.current = l
    saveJSON(LS_LUMENS, l)
    setLumens(l)
    const inv = inventoryRef.current
    const n: BoosterInventory = { lens: Math.min(99, inv.lens + r.lens), null: Math.min(99, inv.null + r.null) }
    inventoryRef.current = n
    saveJSON(LS_INVENTORY, n)
    setInventory(n)
    return rewards
  }, [])

  const setName = useCallback((name: string) => {
    const trimmed = name.trim().slice(0, 18) || generateWeaverName()
    nameRef.current = trimmed
    localStorage.setItem(LS_PLAYER_NAME, trimmed)
    setPlayer((p) => ({ ...p, name: trimmed }))
  }, [])

  /** Wipe the whole journey — stars, lumens, instruments, daily streak, codex, and weaver name.
      Settings (audio/volume toggles) are intentionally kept. */
  const resetAll = useCallback(() => {
    progressRef.current = {}
    saveJSON(LS_PROGRESS, {})
    setProgress({})
    lumensRef.current = 40
    saveJSON(LS_LUMENS, 40)
    setLumens(40)
    inventoryRef.current = { ...DEFAULT_INVENTORY }
    saveJSON(LS_INVENTORY, DEFAULT_INVENTORY)
    setInventory({ ...DEFAULT_INVENTORY })
    const freshDaily: DailyState = { last: null, streak: 0 }
    dailyRef.current = freshDaily
    saveJSON(LS_DAILY, freshDaily)
    setDaily(freshDaily)
    resetCodex()
    const newName = freshWeaverName()
    nameRef.current = newName
    setPlayer((p) => ({ ...p, name: newName }))
  }, [])

  const totals = Object.values(progress).reduce(
    (acc, rec) => ({ stars: acc.stars + rec.stars, score: acc.score + rec.bestScore, levels: acc.levels + 1 }),
    { stars: 0, score: 0, levels: 0 },
  )

  /** First level id without a star — sequential unlock across the endless tapestry (uncapped). */
  const highestUnlocked = (() => {
    let n = 1
    while ((progress[n]?.stars ?? 0) >= 1) n++
    return n
  })()

  /** Highest chapter whose first stage is unlocked (uncapped — the world never ends). */
  const highestChapter = Math.ceil(highestUnlocked / LEVELS_PER_CHAPTER)

  const isLevelUnlocked = useCallback((levelId: number) => levelId <= highestUnlocked, [highestUnlocked])

  const onLevelWin = useCallback(
    (levelId: number, stars: number, score: number) => {
      const prev = progressRef.current[levelId]
      const improved = !prev || stars > prev.stars || score > prev.bestScore
      saveResult(levelId, score, stars)
      const r = improved ? levelRewards(stars, score) : replayRewards(stars)
      addLumens(r.lumens)
      addBoosters({ lens: r.lens, null: r.null })
      const ids: string[] = ['entity:wizard']
      if (stars >= 3) ids.push('entity:cheer')
      if (levelId === LEVELS_PER_CHAPTER) ids.push('entity:walk')
      const stageInChapter = ((levelId - 1) % LEVELS_PER_CHAPTER) + 1
      if (levelId > 0 && stageInChapter === LEVELS_PER_CHAPTER) {
        const ch = chapterOf(levelId)
        const loreCore = ((ch.id - 1) % TOTAL_CHAPTERS) + 1
        ids.push(`lore:${loreCore}`)
      }
      const freshDiscoveries = discover(...ids)
      const chapterSealed = levelId > 0 && stageInChapter === LEVELS_PER_CHAPTER
      return { ...r, improved, discoveries: freshDiscoveries, chapterSealed, chapterId: chapterOf(levelId).id }
    },
    [addBoosters, addLumens, saveResult],
  )

  return {
    player,
    progress,
    saveResult,
    onLevelWin,
    setName,
    resetAll,
    totals,
    highestUnlocked,
    highestChapter,
    isLevelUnlocked,
    lumens,
    addLumens,
    spendLumens,
    inventory,
    addBoosters,
    useBooster,
    daily,
    completeDaily,
  }
}
