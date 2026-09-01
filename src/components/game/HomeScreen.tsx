'use client'

import * as React from 'react'
import { Play, Trophy } from 'lucide-react'
import { A } from '@/lib/game/assets'
import { FloatingPetals, HudPill, IconButton, LumenPill, Twinkles, WoodButton } from './ui'

/**
 * Home — the reference storybook home.
 * Fills the flex-1 area the root provides; the root renders the BottomNav itself.
 */
export function HomeScreen({
  totalStars,
  totalStarsMax,
  lumens,
  dailyDone,
  onPlay,
  onInstruments,
  onHowTo,
  onLeaderboard,
}: {
  totalStars: number
  totalStarsMax: number
  lumens: number
  dailyDone: boolean
  onPlay: () => void
  onInstruments: () => void
  onHowTo: () => void
  onLeaderboard: () => void
}) {
  return (
    <div className="relative flex-1 flex flex-col overflow-hidden">
      {/* full-bleed storybook scene */}
      <div aria-hidden className="absolute inset-0">
        <img
          src={A('bg-castle')}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover anim-ken select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0e1c14]/10 via-transparent to-[#0e1c14]/60" />
        <Twinkles count={10} />
      </div>

      {/* top bar */}
      <header className="absolute top-3 inset-x-3 z-20 flex items-start justify-between gap-2">
        <HudPill>
          <img src={A('star-sparkle')} alt="" draggable={false} className="w-5 h-5 object-contain shrink-0" />
          <span className="tabular-nums">{totalStars}</span>
          <span className="text-[#d9c79a]">/ {totalStarsMax}</span>
        </HudPill>
        <div className="flex items-center gap-2">
          <LumenPill amount={lumens} />
          <IconButton label="Leaderboard" onClick={onLeaderboard} className="w-10 h-10">
            <Trophy className="w-5 h-5 text-[#5d3a1a]" aria-hidden />
          </IconButton>
          <IconButton img={A('icon-gear')} label="Instruments" onClick={onInstruments} />
        </div>
      </header>

      {/* center content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center gap-7 px-6 pt-8">
        <img
          src={A('logo')}
          alt="Wonderweave — Threads of a Forgotten World"
          draggable={false}
          className="w-[300px] max-w-[84vw] select-none anim-float drop-shadow-[0_10px_24px_rgba(0,0,0,0.55)]"
        />
        <WoodButton
          variant="leaf"
          size="xl"
          className="w-full max-w-[260px] uppercase anim-ring-pulse"
          onClick={onPlay}
          ariaLabel={dailyDone ? 'Play — continue your journey' : 'Play — continue your journey, the daily folio awaits'}
        >
          <span className="inline-flex items-center justify-center gap-2">
            Play
            <Play className="w-5 h-5" aria-hidden />
          </span>
        </WoodButton>
        <WoodButton size="sm" className="max-w-[200px]" onClick={onHowTo} ariaLabel="How to play">
          How to Play
        </WoodButton>
      </main>

      {/* lantern bunny, resting just above where the bottom nav sits */}
      <img
        src={A('bunny-lantern')}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none select-none absolute left-2 bottom-[86px] z-10 w-20 sm:w-24 anim-bob drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)]"
      />

      {/* footer whisper */}
      <footer className="relative z-10 text-center pb-2">
        <p className="text-[11px] tracking-[0.3em] uppercase text-[#f4e9c8]/75 font-semibold ww-text-outline">
          Threads of a Forgotten World
        </p>
      </footer>

      <FloatingPetals count={6} />
    </div>
  )
}
