'use client'

import * as React from 'react'
import type { WWSettings } from '@/lib/game/types'
import { setMusicVolume, setSfxVolume, startMusic, initAudio } from '@/lib/game/sound'

export const DEFAULT_SETTINGS: WWSettings = {
  musicVol: 0.5,
  sfxVol: 0.7,
  vibrations: true,
  particles: true,
}

const LS_KEY = 'ww-settings'

function load(): WWSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') as Partial<WWSettings>
    return {
      musicVol: typeof raw.musicVol === 'number' ? raw.musicVol : DEFAULT_SETTINGS.musicVol,
      sfxVol: typeof raw.sfxVol === 'number' ? raw.sfxVol : DEFAULT_SETTINGS.sfxVol,
      vibrations: typeof raw.vibrations === 'boolean' ? raw.vibrations : DEFAULT_SETTINGS.vibrations,
      particles: typeof raw.particles === 'boolean' ? raw.particles : DEFAULT_SETTINGS.particles,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

interface SettingsCtx {
  settings: WWSettings
  update: (patch: Partial<WWSettings>) => void
  ready: boolean
}

const Ctx = React.createContext<SettingsCtx | null>(null)

/**
 * localStorage is an external store, so it is read through useSyncExternalStore
 * rather than hydrated with a setState inside an effect. React uses the server
 * snapshot (defaults) while hydrating — matching the prerendered markup, which
 * depends on `particles` for the root class — then swaps to the stored values.
 */
let snapshot: WWSettings = DEFAULT_SETTINGS
let hydrated = false
const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) listener()
}

function subscribeToSettings(onChange: () => void): () => void {
  listeners.add(onChange)
  if (!hydrated) {
    hydrated = true
    snapshot = load()
    setSfxVolume(snapshot.sfxVol)
    setMusicVolume(snapshot.musicVol)
    // Notify after the current commit so subscribers pick up the stored values.
    queueMicrotask(emit)
  }
  return () => {
    listeners.delete(onChange)
  }
}

const getSettingsSnapshot = (): WWSettings => snapshot
const getSettingsServerSnapshot = (): WWSettings => DEFAULT_SETTINGS

/** Apply a settings patch: persist it, push volumes to the audio graph, notify. */
function writeSettings(patch: Partial<WWSettings>): void {
  snapshot = { ...snapshot, ...patch }
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(snapshot))
  } catch {
    /* ignore */
  }
  if (patch.sfxVol !== undefined) setSfxVolume(patch.sfxVol)
  if (patch.musicVol !== undefined) setMusicVolume(patch.musicVol)
  emit()
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const settings = React.useSyncExternalStore(
    subscribeToSettings,
    getSettingsSnapshot,
    getSettingsServerSnapshot,
  )
  const ready = settings !== DEFAULT_SETTINGS || hydrated

  const update = React.useCallback((patch: Partial<WWSettings>) => {
    writeSettings(patch)
  }, [])

  const value = React.useMemo(() => ({ settings, update, ready }), [settings, update, ready])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSettings(): SettingsCtx {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}

/** Start audio on first user gesture (autoplay policy) and keep music looping. */
export function useAudioGate(): void {
  React.useEffect(() => {
    const kick = () => {
      initAudio()
      startMusic()
      window.removeEventListener('pointerdown', kick)
      window.removeEventListener('keydown', kick)
    }
    window.addEventListener('pointerdown', kick)
    window.addEventListener('keydown', kick)
    return () => {
      window.removeEventListener('pointerdown', kick)
      window.removeEventListener('keydown', kick)
    }
  }, [])
}

/** Vibrating helper that respects the player's setting. */
export function useVibrate(): (ms: number) => void {
  const { settings } = useSettings()
  return React.useCallback(
    (ms: number) => {
      if (!settings.vibrations) return
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(ms)
      }
    },
    [settings.vibrations],
  )
}
