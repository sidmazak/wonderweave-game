'use client'

import * as React from 'react'
import { A } from '@/lib/game/assets'
import { preloadGame, type PreloadHandle } from '@/lib/game/preload'
import { getLevel } from '@/lib/game/levels'
import { dateKey, getDailyLevel } from '@/lib/game/daily'
import { discover } from '@/lib/game/codex'
import { setMusicTheme } from '@/lib/game/sound'
import type { LevelResult } from '@/lib/game/types'
import { useProgress } from '@/hooks/use-progress'
import { SettingsProvider, useAudioGate, useSettings } from './settings'
import { BottomNav, FallingLeaves, Fireflies, Twinkles, type NavTab } from './ui'
import { HomeScreen } from './HomeScreen'
import { AtlasScreen } from './AtlasScreen'
import { ChapterScreen } from './ChapterScreen'
import { CodexScreen } from './CodexScreen'
import { DailyScreen } from './DailyScreen'
import { AltarScreen, type RitualOutcome } from './AltarScreen'
import { InstrumentsScreen } from './InstrumentsScreen'
import { PlayScreen, type RewardSummary } from './PlayScreen'
import { HowToModal } from './modals'

type Screen = 'splash' | 'meta' | 'play'

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

  const [screen, setScreen] = React.useState<Screen>('splash')
  const [metaView, setMetaView] = React.useState<NavTab>('home')
  const [mapView, setMapView] = React.useState<'atlas' | 'chapter'>('atlas')
  const [chapterId, setChapterId] = React.useState(1)
  const [levelId, setLevelId] = React.useState(1)
  const [playAttempt, setPlayAttempt] = React.useState(0)
  const [showInstruments, setShowInstruments] = React.useState(false)
  const [showHowTo, setShowHowTo] = React.useState(false)

  /* ------- real asset preloading (drives the loading screen) ------- */
  const [loadPct, setLoadPct] = React.useState(0)
  const preloadRef = React.useRef<PreloadHandle | null>(null)
  React.useEffect(() => {
    if (screen !== 'splash' || preloadRef.current) return
    const handle = preloadGame((p) => setLoadPct(Math.round(p * 100)))
    preloadRef.current = handle
    void handle.done
  }, [screen])

  /* no "tap to begin" gate — glide straight into the world once it is woven */
  React.useEffect(() => {
    if (screen !== 'splash' || loadPct < 100) return
    const t = setTimeout(() => setScreen('meta'), 700)
    return () => clearTimeout(t)
  }, [screen, loadPct])

  // music theming per view
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

  const today = dateKey()
  const dailyDone = prog.daily.last === today

  const startLevel = React.useCallback((id: number) => {
    setLevelId(id)
    setPlayAttempt((a) => a + 1)
    setScreen('play')
  }, [])

  const startDaily = React.useCallback(() => startLevel(0), [startLevel])
  const continueNext = React.useCallback(() => startLevel(prog.highestUnlocked), [prog.highestUnlocked, startLevel])

  /** Leaving a level always lands on HOME — quitting straight back into the
      map felt jarring; the world map is one tap away on the nav bar. */
  const exitToHome = React.useCallback(() => {
    setMetaView('home')
    setMapView('atlas')
    setScreen('meta')
  }, [])

  const handleWin = React.useCallback(
    (result: LevelResult): RewardSummary => {
      if (result.levelId === 0) {
        const r = prog.completeDaily()
        discover('entity:pack')
        return r ? { lumens: r.lumens, lens: r.lens, null: r.null, streak: r.streak } : { lumens: 0, lens: 0, null: 0 }
      }
      const r = prog.onLevelWin(result.levelId, result.stars, result.score)
      return { lumens: r.lumens, lens: r.lens, null: r.null, improved: r.improved }
    },
    [prog],
  )

  const handleRitual = React.useCallback((): RitualOutcome | null => {
    if (!prog.spendLumens(100)) return null
    discover('entity:heart')
    const roll = Math.random()
    if (roll < 0.4) {
      prog.addBoosters({ lens: 2 })
      return { kind: 'lens', amount: 2 }
    }
    if (roll < 0.8) {
      prog.addBoosters({ null: 2 })
      return { kind: 'null', amount: 2 }
    }
    prog.addLumens(250)
    return { kind: 'fortune', amount: 250 }
  }, [prog])

  const metaScreen = (() => {
    if (metaView === 'home') {
      return (
        <HomeScreen
          totalStars={prog.totals.stars}
          lumens={prog.lumens}
          dailyDone={dailyDone}
          onPlay={continueNext}
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
            onBack={() => setMapView('atlas')}
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
            setChapterId(ch)
            setMapView('chapter')
          }}
          onPlayNext={continueNext}
          onBack={() => setMetaView('home')}
        />
      )
    }
    if (metaView === 'codex') return <CodexScreen onBack={() => setMetaView('home')} />
    if (metaView === 'relics') return <AltarScreen lumens={prog.lumens} onPerform={handleRitual} onBack={() => setMetaView('home')} />
    return <DailyScreen daily={prog.daily} onBack={() => setMetaView('home')} onPlay={startDaily} />
  })()

  const level = levelId === 0 ? getDailyLevel(dateKey()) : getLevel(levelId)

  return (
    <div
      className={cnRoot(settings.reducedMotion, settings.highContrast, !settings.particles)}
      role="main"
      aria-label="Wonderweave game"
    >
      <div className="ww-app-root relative w-full max-w-[460px] h-dvh flex flex-col overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.6)]">
        {screen === 'splash' && <LoadingScreen pct={loadPct} />}

        {screen === 'meta' && (
          <>
            <div key={`meta-${metaView}-${mapView}`} className="relative flex-1 min-h-0 flex flex-col anim-screen-in">
              {metaScreen}
            </div>
            <BottomNav active={metaView} onNavigate={setMetaView} dailyDone={dailyDone} />
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
              onResetAll={prog.resetAll}
              onBack={() => setShowInstruments(false)}
            />
          </div>
        )}

        {showHowTo && <HowToModal onClose={() => setShowHowTo(false)} />}
      </div>
    </div>
  )
}

/* -------- loading screen — homepage scene + REAL progress, no click gate -------- */

function LoadingScreen({ pct }: { pct: number }) {
  return (
    <div className="relative flex-1 flex flex-col select-none" aria-label={`Loading Wonderweave — ${pct}%`}>
      {/* the exact homepage scene — seamless handoff when the world is ready */}
      <img
        src={A('bg-castle')}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover anim-ken select-none"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0e1c14]/25 via-transparent to-[#0e1c14]/70" />
      <Twinkles count={8} />
      <Fireflies count={10} />
      <FallingLeaves count={10} />

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
          <p className="font-display font-extrabold uppercase tracking-[0.2em] text-[#5d3a1a] text-xs mb-2">
            Weaving the world… {pct}%
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
            {pct < 40 ? 'Gathering threads…' : pct < 75 ? 'Waking the bunnies…' : 'Opening the Folio…'}
          </p>
        </div>
      </div>
    </div>
  )
}

function cnRoot(reduced: boolean, hc: boolean, noParticles: boolean): string {
  return [
    'min-h-dvh flex flex-col items-center bg-[#101d13] ww-tap-none',
    reduced ? 'ww-reduced' : '',
    hc ? 'ww-hc' : '',
    noParticles ? 'ww-no-particles' : '',
  ]
    .filter(Boolean)
    .join(' ')
}
