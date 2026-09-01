'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export interface LevelRecord {
  stars: number
  bestScore: number
}

export type ProgressMap = Record<number, LevelRecord>

const LS_PLAYER_ID = 'ww-player-id'
const LS_PLAYER_NAME = 'ww-player-name'
const LS_PROGRESS = 'ww-progress'

function randomName(): string {
  const a = ['Fern', 'Moss', 'Bramble', 'Wren', 'Clover', 'Dew', 'Sage', 'Petal', 'Thistle', 'Rowan']
  const b = ['weaver', 'spinner', 'threader', 'stitcher', 'loomer']
  return `${a[Math.floor(Math.random() * a.length)]}${b[Math.floor(Math.random() * b.length)]}-${Math.floor(1000 + Math.random() * 9000)}`
}

function ensurePlayer(): { id: string; name: string } {
  if (typeof window === 'undefined') return { id: '', name: '' }
  let id = localStorage.getItem(LS_PLAYER_ID)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(LS_PLAYER_ID, id)
  }
  let name = localStorage.getItem(LS_PLAYER_NAME)
  if (!name) {
    name = randomName()
    localStorage.setItem(LS_PLAYER_NAME, name)
  }
  return { id, name }
}

function loadLocalProgress(): ProgressMap {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(LS_PROGRESS) ?? '{}') as ProgressMap
  } catch {
    return {}
  }
}

export function useProgress() {
  const [player, setPlayer] = useState<{ id: string; name: string }>({ id: '', name: '' })
  const [progress, setProgress] = useState<ProgressMap>({})
  const [serverSynced, setServerSynced] = useState(false)
  const nameRef = useRef('')

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      const p = ensurePlayer()
      nameRef.current = p.name
      const local = loadLocalProgress()
      // yield a microtask so we never setState synchronously inside the effect
      await Promise.resolve()
      if (cancelled) return
      setPlayer(p)
      setProgress(local)

      // sync with server in background (best-effort)
      try {
        await fetch('/api/player', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: p.id, name: p.name }),
        })
        const res = await fetch(`/api/progress?playerId=${encodeURIComponent(p.id)}`)
        if (res.ok && !cancelled) {
          const data = (await res.json()) as { progress: { level: number; stars: number; bestScore: number }[] }
          setProgress((prev) => {
            const merged: ProgressMap = { ...prev }
            for (const row of data.progress) {
              const cur = merged[row.level]
              merged[row.level] = {
                stars: Math.max(cur?.stars ?? 0, row.stars),
                bestScore: Math.max(cur?.bestScore ?? 0, row.bestScore),
              }
            }
            localStorage.setItem(LS_PROGRESS, JSON.stringify(merged))
            return merged
          })
        }
        if (!cancelled) setServerSynced(true)
      } catch {
        /* offline: local progress remains authoritative */
      }
    }
    void init()
    return () => {
      cancelled = true
    }
  }, [])

  const saveResult = useCallback(
    (levelId: number, score: number, stars: number) => {
      setProgress((prev) => {
        const cur = prev[levelId]
        const next: ProgressMap = {
          ...prev,
          [levelId]: {
            stars: Math.max(cur?.stars ?? 0, stars),
            bestScore: Math.max(cur?.bestScore ?? 0, score),
          },
        }
        if (typeof window !== 'undefined') localStorage.setItem(LS_PROGRESS, JSON.stringify(next))
        return next
      })
      // fire-and-forget server save
      if (player.id) {
        void fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: player.id, level: levelId, score, stars, playerName: nameRef.current }),
        }).catch(() => {})
      }
    },
    [player.id],
  )

  const setName = useCallback(
    (name: string) => {
      const trimmed = name.trim().slice(0, 20) || randomName()
      nameRef.current = trimmed
      localStorage.setItem(LS_PLAYER_NAME, trimmed)
      setPlayer((p) => ({ ...p, name: trimmed }))
      if (player.id) {
        void fetch('/api/player', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: player.id, name: trimmed }),
        }).catch(() => {})
      }
    },
    [player.id],
  )

  const totals = Object.values(progress).reduce(
    (acc, rec) => ({ stars: acc.stars + rec.stars, score: acc.score + rec.bestScore, levels: acc.levels + 1 }),
    { stars: 0, score: 0, levels: 0 },
  )

  const highestUnlocked = (() => {
    let n = 1
    for (let i = 1; i <= 12; i++) {
      if (progress[i]?.stars) n = Math.min(12, i + 1)
      else break
    }
    return n
  })()

  return { player, progress, saveResult, setName, totals, highestUnlocked, serverSynced }
}
