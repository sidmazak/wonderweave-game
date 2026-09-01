'use client'

import * as React from 'react'
import { A } from '@/lib/game/assets'
import { TOTAL_LEVELS, getLevel } from '@/lib/game/levels'
import { dateKey, getDailyLevel } from '@/lib/game/daily'
import { discover } from '@/lib/game/codex'
import type { LevelResult } from '@/lib/game/types'
import { useProgress } from '@/hooks/use-progress'
import { SettingsProvider, useAudioGate, useSettings } from './settings'
import { BottomNav, type NavTab } from './ui'
import { HomeScreen } from './HomeScreen'
import { AtlasScreen } from './AtlasScreen'
import { ChapterScreen } from './ChapterScreen'
import { CodexScreen } from './CodexScreen'
import { DailyScreen } from './DailyScreen'
import { AltarScreen, type RitualOutcome } from './AltarScreen'
import { InstrumentsScreen } from './InstrumentsScreen'
import { PlayScreen, type RewardSummary } from './PlayScreen'
import { HowToModal, LeaderboardModal } from './modals'

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
  const [metaView, setMetaView] = React.useState<'home' | NavTab>('home')
  const [mapView, setMapView] = React.useState<'atlas' | 'chapter'>('atlas')
  const [chapterId, setChapterId] = React.useState(1)
  const [levelId, setLevelId] = React.useState(1)
  const [playAttempt, setPlayAttempt] = React.useState(0)
  const [showInstruments, setShowInstruments] = React.useState(false)
  const [showHowTo, setShowHowTo] = React.useState(false)
  const [showLeaderboard, setShowLeaderboard] = React.useState(false)

  // splash auto-advance
  React.useEffect(() => {
    if (screen !== 'splash') return
    const t = setTimeout(() => setScreen('meta'), 1700)
    return () => clearTimeout(t)
  }, [screen])

  const today = dateKey()
  const dailyDone = prog.daily.last === today

  const startLevel = React.useCallback((id: number) => {
    setLevelId(id)
    setPlayAttempt((a) => a + 1)
    setScreen('play')
  }, [])

  const startDaily = React.useCallback(() => startLevel(0), [startLevel])
  const continueNext = React.useCallback(() => startLevel(prog.highestUnlocked), [prog.highestUnlocked, startLevel])

  const handleWin = React.useCallback(
    (result: LevelResult): RewardSummary => {
      if (result.levelId === 0) {
        const r = prog.completeDaily()
        discover('entity:pack')
        return r ? { lumens: r.lumens, lens: r.lens, null: r.null, streak: r.streak } : { lumens: 0, lens: 0, null: 0 }
      }
      const r = prog.onLevelWin(result.levelId, result.stars, result.score)
      return { lumens: r.lumens, lens: r.lens, null: r.null }
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
          totalStarsMax={TOTAL_LEVELS * 3}
          lumens={prog.lumens}
          dailyDone={dailyDone}
          onPlay={continueNext}
          onInstruments={() => setShowInstruments(true)}
          onHowTo={() => setShowHowTo(true)}
          onLeaderboard={() => setShowLeaderboard(true)}
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
          totalStarsMax={TOTAL_LEVELS * 3}
          highestUnlocked={prog.highestUnlocked}
          onSelectChapter={(ch) => {
            setChapterId(ch)
            setMapView('chapter')
          }}
          onPlayNext={continueNext}
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
      <div className="relative w-full max-w-[460px] h-dvh flex flex-col overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.6)]">
        {screen === 'splash' && (
          <button
            aria-label="Loading Wonderweave — tap to continue"
            onClick={() => setScreen('meta')}
            className="relative flex-1 flex flex-col cursor-pointer anim-fade-in"
          >
            <img src={A('splash-loading')} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0e1c14]/70" />
            <img
              src={A('plaque-loading')}
              alt="Loading…"
              className="relative w-28 mx-auto mt-auto mb-16 anim-bob drop-shadow-xl"
              draggable={false}
            />
          </button>
        )}

        {screen === 'meta' && (
          <>
            <div className="relative flex-1 min-h-0 flex flex-col">{metaScreen}</div>
            <BottomNav
              active={metaView === 'home' ? 'map' : metaView}
              onNavigate={(t) => {
                setMetaView(t)
                if (t === 'map') setMapView('atlas')
              }}
              dailyDone={dailyDone}
            />
          </>
        )}

        {screen === 'play' && (
          <PlayScreen
            key={`${levelId}-${playAttempt}`}
            level={level}
            isDaily={levelId === 0}
            inventory={prog.inventory}
            spendBooster={prog.useBooster}
            onExit={() => {
              setScreen('meta')
              if (levelId === 0) setMetaView('daily')
              else {
                setMetaView('map')
                setMapView('atlas')
              }
            }}
            onPlayLevel={startLevel}
            onWin={handleWin}
            onOpenInstruments={() => setShowInstruments(true)}
            hasNextStage={levelId > 0 && levelId < TOTAL_LEVELS}
          />
        )}

        {/* full-screen overlays */}
        {showInstruments && (
          <div className="absolute inset-0 z-[60] anim-fade-in">
            <InstrumentsScreen
              playerName={prog.player.name || 'Weaver'}
              onRename={prog.setName}
              onHowTo={() => setShowHowTo(true)}
              onBack={() => setShowInstruments(false)}
            />
          </div>
        )}

        {showHowTo && <HowToModal onClose={() => setShowHowTo(false)} />}

        {showLeaderboard && (
          <LeaderboardModal onClose={() => setShowLeaderboard(false)} myId={prog.player.id} />
        )}
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

