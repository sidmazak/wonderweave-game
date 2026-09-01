'use client'

import * as React from 'react'
import { A } from '@/lib/game/assets'
import { useProgress } from '@/hooks/use-progress'
import { setMuted } from '@/lib/game/sound'
import type { LevelResult } from '@/lib/game/types'
import { TitleScreen } from './TitleScreen'
import { AtlasScreen } from './AtlasScreen'
import { PlayScreen } from './PlayScreen'
import { HowToModal, LeaderboardModal, OptionsModal } from './modals'

type Screen = 'splash' | 'title' | 'atlas' | 'play'

export default function WonderweaveGame() {
  const [screen, setScreen] = React.useState<Screen>('splash')
  const [levelId, setLevelId] = React.useState(1)
  const [showHowTo, setShowHowTo] = React.useState(false)
  const [showOptions, setShowOptions] = React.useState(false)
  const [showLeaderboard, setShowLeaderboard] = React.useState(false)
  const [sound, setSound] = React.useState(true)
  const [vibration, setVibration] = React.useState(true)

  const { player, progress, saveResult, setName, totals, highestUnlocked } = useProgress()

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    setSound(localStorage.getItem('ww-sound') !== '0')
    setVibration(localStorage.getItem('ww-vibration') !== '0')
  }, [])

  const toggleSound = (v: boolean) => {
    setSound(v)
    localStorage.setItem('ww-sound', v ? '1' : '0')
    setMuted(!v)
  }
  const toggleVibration = (v: boolean) => {
    setVibration(v)
    localStorage.setItem('ww-vibration', v ? '1' : '0')
  }

  // splash auto-advance
  React.useEffect(() => {
    if (screen !== 'splash') return
    const t = setTimeout(() => setScreen('title'), 1700)
    return () => clearTimeout(t)
  }, [screen])

  const handleSaveResult = (result: LevelResult) => {
    saveResult(result.levelId, result.score, result.stars)
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center bg-[#101d13]"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 50% -10%, rgba(90, 140, 90, 0.25), transparent 60%), radial-gradient(ellipse at 50% 110%, rgba(40, 80, 50, 0.35), transparent 55%)',
      }}
    >
      <div
        className="relative w-full max-w-[460px] min-h-dvh flex flex-col overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.6)] md:my-0 lg:my-0"
        role="main"
        aria-label="Wonderweave game"
      >
        {screen === 'splash' && (
          <button
            aria-label="Loading Wonderweave — tap to continue"
            onClick={() => setScreen('title')}
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

        {screen === 'title' && (
          <TitleScreen
            totalStars={totals.stars}
            playerName={player.name || 'Weaver'}
            onPlay={() => setScreen('atlas')}
            onHowTo={() => setShowHowTo(true)}
            onOptions={() => setShowOptions(true)}
            onLeaderboard={() => setShowLeaderboard(true)}
          />
        )}

        {screen === 'atlas' && (
          <AtlasScreen
            progress={progress}
            playerName={player.name || 'Weaver'}
            totalStars={totals.stars}
            highestUnlocked={highestUnlocked}
            onBack={() => setScreen('title')}
            onPlayLevel={(id) => {
              setLevelId(id)
              setScreen('play')
            }}
            onLeaderboard={() => setShowLeaderboard(true)}
          />
        )}

        {screen === 'play' && (
          <PlayScreen
            key={levelId}
            levelId={levelId}
            playerName={player.name}
            sound={sound}
            vibration={vibration}
            onSound={toggleSound}
            onVibration={toggleVibration}
            onExitToAtlas={() => setScreen('atlas')}
            onPlayLevel={(id) => setLevelId(id)}
            onSaveResult={handleSaveResult}
          />
        )}
      </div>

      {/* global modals */}
      {showHowTo && <HowToModal onClose={() => setShowHowTo(false)} />}
      {showOptions && (
        <OptionsModal
          sound={sound}
          vibration={vibration}
          onSound={toggleSound}
          onVibration={toggleVibration}
          playerName={player.name}
          onRename={setName}
          onClose={() => setShowOptions(false)}
        />
      )}
      {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} myId={player.id} />}
    </div>
  )
}
