'use client'

import * as React from 'react'
import { Trophy } from 'lucide-react'
import { A } from '@/lib/game/assets'
import { WoodButton, IconButton, FloatingPetals, Twinkles } from './ui'

export function TitleScreen({
  totalStars,
  playerName,
  onPlay,
  onHowTo,
  onOptions,
  onLeaderboard,
}: {
  totalStars: number
  playerName: string
  onPlay: () => void
  onHowTo: () => void
  onOptions: () => void
  onLeaderboard: () => void
}) {
  return (
    <div className="relative flex-1 flex flex-col overflow-hidden">
      {/* backdrop */}
      <div aria-hidden className="absolute inset-0">
        <img src={A('bg-castle')} alt="" className="w-full h-full object-cover anim-ken" draggable={false} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0e1c14]/10 via-transparent to-[#0e1c14]/55" />
        <Twinkles count={10} />
      </div>

      {/* drifting clouds */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <img src={A('deco-cloud-pink')} alt="" draggable={false} className="absolute w-28 opacity-80 anim-drift" style={{ top: '16%', animationDuration: '46s' }} />
        <img src={A('deco-cloud-white')} alt="" draggable={false} className="absolute w-20 opacity-70 anim-drift" style={{ top: '34%', animationDuration: '64s', animationDelay: '-28s' }} />
      </div>

      <FloatingPetals count={7} />

      {/* top row */}
      <header className="relative z-10 flex items-center justify-between px-4 pt-4">
        <div className="hud-pill rounded-full px-3 py-1 flex items-center gap-1.5 text-sm font-bold" aria-label={`${totalStars} stars collected`}>
          <img src={A('star-sparkle')} alt="" className="w-5 h-5" draggable={false} />
          <span className="tabular-nums">{totalStars}</span>
          <span className="text-[#d9c79a] font-medium">/ 36</span>
        </div>
        <IconButton img={A('icon-gear')} label="Options" onClick={onOptions} />
      </header>

      {/* logo + cta */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 gap-8">
        <div className="anim-float">
          <img
            src={A('logo')}
            alt="Wonderweave — Threads of a Forgotten World"
            className="w-[300px] max-w-[82vw] drop-shadow-[0_10px_24px_rgba(0,0,0,0.55)]"
            draggable={false}
          />
        </div>

        <div className="flex flex-col items-center gap-3 w-full max-w-[260px]">
          <WoodButton variant="leaf" size="xl" className="w-full anim-ring-pulse" onClick={onPlay} ariaLabel="Play Wonderweave">
            Play
          </WoodButton>
          <div className="flex gap-2.5 w-full">
            <WoodButton size="sm" className="flex-1" onClick={onHowTo}>How to Play</WoodButton>
            <IconButton label="Leaderboard" onClick={onLeaderboard}>
              <Trophy className="w-5 h-5 text-[#5d3a1a]" aria-hidden />
            </IconButton>
          </div>
          <p className="text-xs text-[#f4e9c8]/90 font-semibold ww-text-outline">Weaver: {playerName}</p>
        </div>
      </main>

      {/* bunny */}
      <div aria-hidden className="relative z-10 pointer-events-none select-none">
        <img
          src={A('bunny-lantern')}
          alt=""
          draggable={false}
          className="w-20 sm:w-28 absolute left-1 -bottom-2 drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)] anim-bob"
        />
      </div>

      <footer className="relative z-10 mt-auto text-center pb-3 pt-8">
        <p className="text-[11px] tracking-[0.3em] uppercase text-[#f4e9c8]/75 font-semibold ww-text-outline">
          Threads of a Forgotten World
        </p>
      </footer>
    </div>
  )
}
