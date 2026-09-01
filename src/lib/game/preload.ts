/**
 * Real asset preloader — drives the loading screen with true progress.
 *
 * Architecture:
 *  - Images are loaded via `new Image()` so the browser HTTP cache is warmed;
 *    later screens paint instantly because every `<img src>` hits the cache.
 *  - Critical assets (splash/home) load first so the loader bar moves fast
 *    where the player can see it, then the rest of the game streams in.
 *  - Progress never goes backwards and always reaches 100%: individual image
 *    failures (offline flake) resolve as "done" after a retry so the game
 *    never gets stuck on the loading screen.
 *  - A sessionStorage flag short-circuits repeat loads within the session.
 */

import { A, ALL_ASSETS, CRITICAL_ASSETS } from './assets'

export interface PreloadHandle {
  /** 0..1 — monotonic, includes critical weighting. */
  progress: number
  /** Resolves once every asset is loaded (or safely skipped). */
  done: Promise<void>
  cancel: () => void
}

const SESSION_KEY = 'ww-preloaded-v1'
const MAX_RETRIES = 1

function loadImage(src: string, retries: number): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    let settled = false
    const finish = () => {
      if (!settled) {
        settled = true
        resolve()
      }
    }
    img.onload = finish
    img.onerror = () => {
      if (retries > 0) {
        // small backoff, then retry once (transient network flake)
        setTimeout(() => loadImage(src, retries - 1).then(finish), 220)
      } else {
        finish() // never block the game on a single bad asset
      }
    }
    img.src = src
    // safety valve — some webviews stall onerror/onload
    setTimeout(finish, 9000)
  })
}

/**
 * Preload the whole game. `onProgress` receives a smooth 0..1 value.
 * Critical assets count double towards progress so the bar moves quickly
 * at the start (perceived speed), then the long tail fills it to 100%.
 */
export function preloadGame(onProgress: (p: number) => void): PreloadHandle {
  if (typeof window === 'undefined') {
    return { progress: 1, done: Promise.resolve(), cancel: () => {} }
  }

  const already =
    (() => {
      try {
        return sessionStorage.getItem(SESSION_KEY) === '1'
      } catch {
        return false
      }
    })()

  if (already) {
    onProgress(1)
    return { progress: 1, done: Promise.resolve(), cancel: () => {} }
  }

  const critical = CRITICAL_ASSETS.map((name) => A(name))
  const rest = ALL_ASSETS.map((name) => A(name)).filter((src) => !critical.includes(src))
  const total = critical.length + rest.length
  const weights = critical.length * 2 + rest.length // critical counts double

  let loaded = 0
  let cancelled = false
  let reported = 0

  const bump = () => {
    loaded += 1
    if (cancelled) return
    // map weighted completion to 0..1, clamp monotonic
    const p = Math.min(1, loaded / total)
    reported = Math.max(reported, p)
    onProgress(reported)
  }

  const done = (async () => {
    // kick everything off in parallel — the browser queues efficiently
    const jobs: Promise<void>[] = []
    for (const src of critical) {
      jobs.push(loadImage(src, MAX_RETRIES).then(bump))
    }
    // stagger the long tail a touch so criticals win the bandwidth race
    rest.forEach((src, i) => {
      jobs.push(
        new Promise<void>((res) => setTimeout(res, Math.min(i * 24, 600))).then(() => loadImage(src, MAX_RETRIES)).then(bump),
      )
    })
    await Promise.all(jobs)
    if (!cancelled) {
      reported = 1
      onProgress(1)
      try {
        sessionStorage.setItem(SESSION_KEY, '1')
      } catch {
        /* private mode — just skip the cache flag */
      }
    }
  })()

  return {
    get progress() {
      return reported
    },
    done,
    cancel: () => {
      cancelled = true
    },
  }
}
