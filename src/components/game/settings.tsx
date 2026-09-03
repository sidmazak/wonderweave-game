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

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<WWSettings>(DEFAULT_SETTINGS)
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    const loaded = load()
    setSettings(loaded)
    setSfxVolume(loaded.sfxVol)
    setMusicVolume(loaded.musicVol)
    setReady(true)
  }, [])

  const update = React.useCallback((patch: Partial<WWSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      if (patch.sfxVol !== undefined) setSfxVolume(patch.sfxVol)
      if (patch.musicVol !== undefined) setMusicVolume(patch.musicVol)
      return next
    })
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
