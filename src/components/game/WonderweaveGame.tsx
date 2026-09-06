'use client'

import * as React from 'react'
import { A } from '@/lib/game/assets'
import { preloadGame, clearPreloadSession, type PreloadHandle } from '@/lib/game/preload'
import { getLevel, chapterOf } from '@/lib/game/levels'
import { dateKey, getDailyLevel } from '@/lib/game/daily'
import { discover, useCodex } from '@/lib/game/codex'
import { setMusicTheme } from '@/lib/game/sound'
import type { LevelResult } from '@/lib/game/types'
import { useProgress } from '@/hooks/use-progress'
import { SettingsProvider, useAudioGate, useSettings } from './settings'
import { BottomNav, FallingLeaves, Fireflies, SceneBackdrop, Twinkles, type NavTab } from './ui'
import { HomeScreen } from './HomeScreen'
import { AtlasScreen } from './AtlasScreen'
import { ChapterScreen } from './ChapterScreen'
import { CodexScreen } from './CodexScreen'
import { DailyScreen } from './DailyScreen'
import { AltarScreen, type RitualOutcome } from './AltarScreen'
import { InstrumentsScreen } from './InstrumentsScreen'
import { PlayScreen, type RewardSummary } from './PlayScreen'
import { HowToModal } from './modals'
import { DiscoveryToastStack } from './DiscoveryToast'

type Screen = 'splash' | 'meta' | 'play'

/**
 * Which way the next meta screen should come from.
 *  - `forward` — going deeper (atlas → chapter, home → chapter)
 *  - `back`    — coming back out
 *  - `lateral` — swapping between bottom-nav tabs, which are siblings
 * Set explicitly at each call site rather than inferred, so a new navigation
 * path cannot silently animate the wrong way.
 */
type NavDir = 'forward' | 'back' | 'lateral'

const SCREEN_IN: Record<NavDir, string> = {
  forward: 'anim-screen-in-fwd',
  back: 'anim-screen-in-back',
  lateral: 'anim-screen-in',
}

/** Splash fade-out length; must match `.anim-splash-out` in globals.css. */
const SPLASH_OUT_MS = 280

export default function WonderweaveGame() {
  return (
    <SettingsProvider>
      <GameRoot />
    </SettingsProvider>
  )
}

function GameRoot() {
  const { settings } = useSettings()
  useAudioGate()
  const prog = useProgress()

  /* Keep board-frame CSS in sync with versioned asset URLs */
  React.useEffect(() => {
    document.documentElement.style.setProperty('--ww-frame-url', `url("${A('frame-square')}")`)
  }, [])

  const [screen, setScreen] = React.useState<Screen>('splash')
  const [metaView, setMetaView] = React.useState<NavTab>('home')
  const [mapView, setMapView] = React.useState<'atlas' | 'chapter'>('atlas')
  const [chapterId, setChapterId] = React.useState(1)
  const [levelId, setLevelId] = React.useState(1)
  const [playAttempt, setPlayAttempt] = React.useState(0)
  const [showInstruments, setShowInstruments] = React.useState(false)
  const [showHowTo, setShowHowTo] = React.useState(false)
  const [resetting, setResetting] = React.useState(false)
  const [navDir, setNavDir] = React.useState<NavDir>('lateral')
  const [splashOut, setSplashOut] = React.useState(false)

  /* ------- real asset preloading (drives the loading screen) ------- */
  const [loadPct, setLoadPct] = React.useState(0)
  const preloadRef = React.useRef<PreloadHandle | null>(null)
  /** Real progress target (0..100). The displayed value eases toward this. */
  const loadTargetRef = React.useRef(0)
  React.useEffect(() => {
    if (screen !== 'splash' || preloadRef.current) return
    const handle = preloadGame((p) => {
      loadTargetRef.current = Math.max(loadTargetRef.current, p * 100)
    })
    preloadRef.current = handle
    void handle.done
  }, [screen])

  /* Ease the shown percentage toward real progress so the bar glides instead of
     stepping. Committing state only when the whole number changes keeps this to
     ≤100 renders — the CSS width transition covers the frames in between. */
  React.useEffect(() => {
    if (screen !== 'splash') return
    let shown = 0
    let raf = requestAnimationFrame(function tick() {
      const target = loadTargetRef.current
      if (shown < target) {
        shown = Math.min(target, shown + Math.max(0.5, (target - shown) * 0.14))
        setLoadPct((prev) => (Math.round(shown) !== prev ? Math.round(shown) : prev))
      }
      raf = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(raf)
  }, [screen])

  /* no "tap to begin" gate — glide straight into the world once it is woven */
  React.useEffect(() => {
    if (screen !== 'splash' || loadPct < 100) return
    const delay = resetting ? 2400 : 700
    // Cross-fade rather than cut. The home screen is mounted underneath first
    // and the splash keeps painting on top as it fades, so the shared backdrop
    // stays put and the two scenes read as one continuous shot. Swapping in one
    // step instead would flash the empty root colour between them.
    const fade = setTimeout(() => {
      setResetting(false)
      setNavDir('lateral')
      setSplashOut(true)
      setScreen('meta')
    }, delay)
    const settle = setTimeout(() => setSplashOut(false), delay + SPLASH_OUT_MS)
    return () => {
      clearTimeout(fade)
      clearTimeout(settle)
    }
  }, [screen, loadPct, resetting])

  const today = dateKey()
  const dailyDone = prog.daily.last === today
  const { count: codexCount } = useCodex()
  const [codexSeen, setCodexSeen] = React.useState(0)

  const handleResetAll = React.useCallback(() => {
    prog.resetAll()
    preloadRef.current?.cancel()
    preloadRef.current = null
    clearPreloadSession()
    try {
      localStorage.removeItem('ww-codex-seen')
    } catch {
      /* ignore */
    }
    setCodexSeen(0)
    setShowInstruments(false)
    setShowHowTo(false)
    setMetaView('home')
    setMapView('atlas')
    setChapterId(1)
    setLevelId(1)
    setPlayAttempt(0)
    loadTargetRef.current = 0
    setLoadPct(0)
    setResetting(true)
    setSplashOut(false)
    setScreen('splash')
  }, [prog])

  // music — calm storybook meta vs epic hopeful rush during active play
  React.useEffect(() => {
    if (screen === 'play') {
      setMusicTheme('play')
      return
    }
    if (screen === 'splash') {
      setMusicTheme('home')
      return
    }
    setMusicTheme(metaView === 'map' ? 'map' : metaView === 'codex' || metaView === 'relics' ? 'night' : 'home')
  }, [screen, metaView])

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('ww-codex-seen')
      setCodexSeen(raw ? Number(raw) || 0 : 0)
    } catch {
      setCodexSeen(0)
    }
  }, [])

  React.useEffect(() => {
    if (metaView !== 'codex') return
    setCodexSeen(codexCount)
    try {
      localStorage.setItem('ww-codex-seen', String(codexCount))
    } catch {
      /* ignore */
    }
  }, [metaView, codexCount])

  const codexUnread = codexCount > codexSeen

  const startLevel = React.useCallback((id: number) => {
    setNavDir('forward')
    setLevelId(id)
    setPlayAttempt((a) => a + 1)
    setScreen('play')
  }, [])

  const startDaily = React.useCallback(() => startLevel(0), [startLevel])
  const continueNext = React.useCallback(() => startLevel(prog.highestUnlocked), [prog.highestUnlocked, startLevel])

  /** Leaving a level always lands on HOME — quitting straight back into the
      map felt jarring; the world map is one tap away on the nav bar. */
  const exitToHome = React.useCallback(() => {
    setNavDir('back')
    setMetaView('home')
    setMapView('atlas')
    setScreen('meta')
  }, [])

  const handleWin = React.useCallback(
    (result: LevelResult): RewardSummary => {
      if (result.levelId === 0) {
        const r = prog.completeDaily()
        const fresh = discover('entity:pack')
        return r
          ? { lumens: r.lumens, lens: r.lens, null: r.null, streak: r.streak, discoveries: fresh }
          : { lumens: 0, lens: 0, null: 0 }
      }
      const r = prog.onLevelWin(result.levelId, result.stars, result.score)
      return {
        lumens: r.lumens,
        lens: r.lens,
        null: r.null,
        improved: r.improved,
        discoveries: r.discoveries,
        chapterSealed: r.chapterSealed,
        chapterId: r.chapterId,
      }
    },
    [prog],
  )

  const handleRitual = React.useCallback((): RitualOutcome | null => {
    if (!prog.spendLumens(100)) return null
    const fresh = discover('entity:heart')
    const roll = Math.random()
    if (roll < 0.4) {
      prog.addBoosters({ lens: 2 })
      return { kind: 'lens', amount: 2, firstRitual: fresh.includes('entity:heart') }
    }
    if (roll < 0.8) {
      prog.addBoosters({ null: 2 })
      return { kind: 'null', amount: 2, firstRitual: fresh.includes('entity:heart') }
    }
    prog.addLumens(250)
    return { kind: 'fortune', amount: 250, firstRitual: fresh.includes('entity:heart') }
  }, [prog])

  const goHome = React.useCallback(() => {
    setNavDir('back')
    setMetaView('home')
  }, [])

  /** Bottom-nav tabs are siblings, so they get the lateral lift, not a slide. */
  const handleNavigate = React.useCallback((tab: NavTab) => {
    setNavDir('lateral')
    setMetaView(tab)
  }, [])

  const metaScreen = (() => {
    if (metaView === 'home') {
      return (
        <HomeScreen
          totalStars={prog.totals.stars}
          lumens={prog.lumens}
          highestUnlocked={prog.highestUnlocked}
          dailyDone={dailyDone}
          onPlay={continueNext}
          onOpenChapter={() => {
            setNavDir('forward')
            setChapterId(chapterOf(prog.highestUnlocked).id)
            setMapView('chapter')
            setMetaView('map')
          }}
          onInstruments={() => setShowInstruments(true)}
          onHowTo={() => setShowHowTo(true)}
        />
      )
    }
    if (metaView === 'map') {
      if (mapView === 'chapter') {
        return (
          <ChapterScreen
            chapterId={chapterId}
            progress={prog.progress}
            highestUnlocked={prog.highestUnlocked}
            onBack={() => {
              setNavDir('back')
              setMapView('atlas')
            }}
            onPlayLevel={startLevel}
          />
        )
      }
      return (
        <AtlasScreen
          progress={prog.progress}
          totalStars={prog.totals.stars}
          highestUnlocked={prog.highestUnlocked}
          onSelectChapter={(ch) => {
            setNavDir('forward')
            setChapterId(ch)
            setMapView('chapter')
          }}
          onPlayNext={continueNext}
          onBack={goHome}
        />
      )
    }
    if (metaView === 'codex') return <CodexScreen onBack={goHome} />
    if (metaView === 'relics') return <AltarScreen lumens={prog.lumens} onPerform={handleRitual} onBack={goHome} />
    return <DailyScreen daily={prog.daily} onBack={goHome} onPlay={startDaily} />
  })()

  const level = levelId === 0 ? getDailyLevel(dateKey()) : getLevel(levelId)

  return (
    <div
      className={cnRoot(!settings.particles, screen === 'play')}
      role="main"
      aria-label="Wonderweave game"
    >
      <div
        className={[
          'ww-app-root relative w-full h-dvh flex flex-col overflow-hidden',
          screen === 'play' ? 'ww-app-root--play' : 'shadow-[0_0_80px_rgba(0,0,0,0.6)]',
        ].join(' ')}
      >
        {screen === 'splash' && <LoadingScreen pct={loadPct} resetting={resetting} />}

        {/* Splash held above the freshly-mounted home screen while it fades. */}
        {splashOut && (
          <div className="absolute inset-0 z-40 flex flex-col pointer-events-none">
            <LoadingScreen pct={100} resetting={resetting} exiting />
          </div>
        )}

        {screen === 'meta' && (
          <>
            <div
              key={`meta-${metaView}-${mapView}`}
              className={`relative flex-1 min-h-0 flex flex-col ${SCREEN_IN[navDir]}`}
            >
              {metaScreen}
            </div>
            <BottomNav active={metaView} onNavigate={handleNavigate} dailyDone={dailyDone} codexUnread={codexUnread} />
          </>
        )}

        {screen === 'play' && (
          <PlayScreen
            key={`${levelId}-${playAttempt}`}
            level={level}
            isDaily={levelId === 0}
            inventory={prog.inventory}
            spendBooster={prog.useBooster}
            onExit={exitToHome}
            onPlayLevel={startLevel}
            onWin={handleWin}
            onOpenInstruments={() => setShowInstruments(true)}
            hasNextStage={levelId > 0}
          />
        )}

        {/* full-screen overlays */}
        {showInstruments && (
          <div className="absolute inset-0 z-[60] anim-fade-in">
            <InstrumentsScreen
              playerName={prog.player.name || 'Weaver'}
              onRename={prog.setName}
              onHowTo={() => setShowHowTo(true)}
              onResetAll={handleResetAll}
              onBack={() => setShowInstruments(false)}
            />
          </div>
        )}

        {showHowTo && <HowToModal onClose={() => setShowHowTo(false)} />}

        <DiscoveryToastStack />
      </div>
    </div>
  )
}

/* -------- loading screen — homepage scene + REAL progress, no click gate -------- */

function LoadingScreen({
  pct,
  resetting = false,
  exiting = false,
}: {
  pct: number
  resetting?: boolean
  exiting?: boolean
}) {
  return (
    <div
      className={`relative flex-1 flex flex-col select-none${exiting ? ' anim-splash-out' : ''}`}
      aria-label={`Loading Wonderweave — ${pct}%`}
    >
      {/* the exact homepage scene — seamless handoff when the world is ready */}
      <SceneBackdrop
        src={A('bg-castle')}
        tint="#1a2838"
        imgClassName="anim-ken"
        overlayClassName="bg-gradient-to-b from-[#0e1c14]/25 via-transparent to-[#0e1c14]/70"
      />
      <Twinkles count={6} />
      <Fireflies count={4} className="ww-fireflies-layer" />
      <FallingLeaves count={5} subtle layer="back" />

      {/* logo — same wobble as the home screen so the two scenes feel continuous */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-2 px-6">
        <img
          src={A('logo')}
          alt="Wonderweave"
          draggable={false}
          className="w-[280px] max-w-[82vw] anim-wobble drop-shadow-[0_10px_24px_rgba(0,0,0,0.55)]"
        />

        {/* parchment plaque with the real loader */}
        <div className="mt-8 w-[260px] max-w-[80vw] goal-card px-4 py-3 text-center anim-float">
          {/* nowrap + fixed-width figures: the line never reflows as 0% → 100% */}
          <p className="font-display font-extrabold uppercase tracking-[0.12em] text-[#5d3a1a] text-xs mb-2 whitespace-nowrap flex items-baseline justify-center gap-1.5">
            <span className="truncate">{resetting ? 'Reweaving the folio…' : 'Weaving the world…'}</span>
            <span className="tabular-nums shrink-0">{pct}%</span>
          </p>
          <div
            className="ww-loader-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label="Loading progress"
          >
            <div className="ww-loader-fill" style={{ width: `${Math.max(4, pct)}%` }} />
          </div>
          <p className="text-[10px] italic text-[#7a5c34] mt-2">
            {resetting
              ? pct < 40
                ? 'Unwriting old threads…'
                : pct < 75
                  ? 'Spreading a blank page…'
                  : 'Opening a fresh Folio…'
              : pct < 40
                ? 'Gathering threads…'
                : pct < 75
                  ? 'Waking the bunnies…'
                  : 'Opening the Folio…'}
          </p>
        </div>
      </div>

      <FallingLeaves count={4} subtle layer="front" />
    </div>
  )
}

function cnRoot(noParticles: boolean, play = false): string {
  return [
    'min-h-dvh flex flex-col items-center ww-tap-none w-full',
    play ? 'bg-transparent' : 'bg-[#101d13]',
    noParticles ? 'ww-no-particles' : '',
  ]
    .filter(Boolean)
    .join(' ')
}
