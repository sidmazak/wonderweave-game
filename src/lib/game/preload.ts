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

/** Keep the suffix in step with ASSET_VERSION so bumped art is re-preloaded
    instead of being skipped and popping in lazily. */
const SESSION_KEY = 'ww-preloaded-v12'
const MAX_RETRIES = 1

/** Clear the session preload flag so the loader runs again (e.g. after reset). */
export function clearPreloadSession(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* private mode */
  }
}

/** Max images in flight. Keeps decode work off a single frame on mid-tier Android,
    where firing every request at once stalls the loader's own animation. */
const CONCURRENCY = 6

function loadImage(src: string, retries: number): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    let settled = false
    let timer: ReturnType<typeof setTimeout> | null = null
    const finish = () => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      resolve()
    }
    // Decoding here (rather than at first paint) is what keeps the handoff from
    // the loader to the home screen smooth — the bitmap is already rasterised.
    img.onload = () => {
      if (typeof img.decode === 'function') {
        img.decode().then(finish, finish)
      } else {
        finish()
      }
    }
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
    timer = setTimeout(finish, 9000)
  })
}

/** Run `task` over `items` with at most `limit` in flight, in order.
    `shouldStop` is polled between items so a cancelled preload winds down
    promptly instead of loading the whole tail in the background. */
async function pool<T>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<void>,
  shouldStop: () => boolean = () => false,
): Promise<void> {
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      if (shouldStop()) return
      const index = cursor++
      if (index >= items.length) return
      await task(items[index])
    }
  })
  await Promise.all(workers)
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
  // Critical assets carry double weight, so the bar moves quickly where the
  // player is actually waiting (splash → home) and the long tail fills the rest.
  const CRITICAL_WEIGHT = 2
  const totalWeight = critical.length * CRITICAL_WEIGHT + rest.length

  let doneWeight = 0
  let cancelled = false
  let reported = 0

  const bump = (weight: number) => {
    doneWeight += weight
    if (cancelled) return
    // monotonic: progress never goes backwards, and never fakes 100%
    const p = totalWeight > 0 ? Math.min(1, doneWeight / totalWeight) : 1
    if (p > reported) {
      reported = p
      onProgress(reported)
    }
  }

  const done = (async () => {
    // Criticals first (home screen paints from these), then the long tail —
    // both concurrency-capped so decoding never blocks the loader animation.
    const stopped = () => cancelled
    await pool(
      critical,
      CONCURRENCY,
      async (src) => {
        await loadImage(src, MAX_RETRIES)
        bump(CRITICAL_WEIGHT)
      },
      stopped,
    )
    if (!cancelled) {
      await pool(
        rest,
        CONCURRENCY,
        async (src) => {
          await loadImage(src, MAX_RETRIES)
          bump(1)
        },
        stopped,
      )
    }
    if (!cancelled) {
      // Always land exactly on 100%, even if an asset was skipped or errored.
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
