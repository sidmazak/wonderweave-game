'use client'

import * as React from 'react'
import { Trophy } from 'lucide-react'
import { A } from '@/lib/game/assets'
import { LEVELS } from '@/lib/game/levels'
import type { ProgressMap } from '@/hooks/use-progress'
import { IconButton, WoodButton } from './ui'
import { cn } from '@/lib/utils'

export function AtlasScreen({
  progress,
  playerName,
  totalStars,
  highestUnlocked,
  onBack,
  onPlayLevel,
  onLeaderboard,
}: {
  progress: ProgressMap
  playerName: string
  totalStars: number
  highestUnlocked: number
  onBack: () => void
  onPlayLevel: (id: number) => void
  onLeaderboard: () => void
}) {
  const nodes = LEVELS.map((lvl) => {
    const rec = progress[lvl.id]
    const locked = lvl.id > highestUnlocked
    return { lvl, rec, locked }
  })

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden">
      {/* backdrop */}
      <div aria-hidden className="absolute inset-0">
        <img src={A('bg-map')} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0e1c14]/25 via-transparent to-[#0e1c14]/45" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-4 pt-4">
        <IconButton img={A('icon-back')} label="Back to title" onClick={onBack} />
        <div className="hud-pill rounded-full px-4 py-1.5 flex items-center gap-2">
          <img src={A('star-sparkle')} alt="" className="w-5 h-5" draggable={false} />
          <span className="font-bold tabular-nums">{totalStars}</span>
          <span className="text-[#d9c79a] text-sm font-medium">stars</span>
        </div>
        <IconButton label="Leaderboard" onClick={onLeaderboard}>
          <Trophy className="w-5 h-5 text-[#5d3a1a]" aria-hidden />
        </IconButton>
      </header>

      <div className="relative z-10 text-center mt-2 mb-1">
        <h1 className="font-display text-2xl font-extrabold text-[#fff4d4] ww-text-outline tracking-wide">The Atlas</h1>
        <p className="text-xs text-[#f4e9c8]/85 ww-text-outline font-medium">Weaver: {playerName}</p>
      </div>

      {/* scrollable map path */}
      <div className="relative z-10 flex-1 overflow-y-auto ww-scroll px-6 pb-8 pt-2" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="relative max-w-[340px] mx-auto" style={{ minHeight: `${nodes.length * 92 + 40}px` }}>
          {/* dotted path */}
          <svg aria-hidden className="absolute inset-0 w-full h-full" viewBox={`0 0 300 ${nodes.length * 92 + 40}`} preserveAspectRatio="none">
            <path
              d={nodes
                .map((n, i) => {
                  const y = 46 + i * 92
                  const x = i % 2 === 0 ? 90 : 210
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                })
                .join(' ')}
              fill="none"
              stroke="rgba(255,244,212,0.75)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="1 14"
            />
          </svg>

          {nodes.map(({ lvl, rec, locked }, i) => {
            const fromLeft = i % 2 === 0
            return (
              <div
                key={lvl.id}
                className="absolute flex flex-col items-center"
                style={{ top: 46 + i * 92 - 44, left: fromLeft ? '90px' : '210px', transform: 'translateX(-50%)' }}
              >
                <button
                  onClick={() => !locked && onPlayLevel(lvl.id)}
                  disabled={locked}
                  aria-label={
                    locked
                      ? `Chapter ${lvl.id} — locked`
                      : `Play chapter ${lvl.id}: ${lvl.name}${rec ? `, best ${rec.bestScore} points, ${rec.stars} stars` : ''}`
                  }
                  className={cn(
                    'relative w-[74px] h-[74px] rounded-full flex items-center justify-center',
                    'font-display text-2xl font-extrabold select-none',
                    locked
                      ? 'bg-gradient-to-b from-[#9b9484] to-[#6e6759] text-[#3f3a30] border-[3px] border-[#57503f] grayscale cursor-not-allowed'
                      : rec
                        ? 'bg-gradient-to-b from-[#ffe9a8] to-[#dfa63e] text-[#5d3a1a] border-[3px] border-[#8a5a2b] cursor-pointer hover:brightness-105 active:scale-95 transition'
                        : 'bg-gradient-to-b from-[#fff3c8] to-[#edc25e] text-[#5d3a1a] border-[3px] border-[#8a5a2b] cursor-pointer hover:brightness-105 active:scale-95 transition anim-ring-pulse',
                  )}
                  style={{ boxShadow: 'inset 0 3px 4px rgba(255,255,255,0.6), inset 0 -4px 6px rgba(90,50,10,0.4), 0 6px 12px rgba(0,0,0,0.4)' }}
                >
                  {locked ? (
                    <img src={A('medallion-lock')} alt="" className="w-11 h-11 object-contain" draggable={false} />
                  ) : (
                    <span className="ww-text-outline-none drop-shadow-sm">{lvl.id}</span>
                  )}
                </button>
                {/* star pips */}
                <div className="flex gap-0.5 mt-1" aria-hidden>
                  {[0, 1, 2].map((s) => (
                    <img
                      key={s}
                      src={A('star-sparkle')}
                      alt=""
                      draggable={false}
                      className={cn('w-4 h-4 object-contain', !rec || s >= rec.stars ? 'grayscale opacity-40' : 'drop-shadow')}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-semibold text-[#fff4d4]/90 ww-text-outline mt-0.5 max-w-[110px] leading-tight">
                  {lvl.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <footer className="relative z-10 text-center pb-3">
        <p className="text-[11px] text-[#f4e9c8]/70 ww-text-outline font-medium">
          {highestUnlocked > LEVELS.length ? 'All realms woven!' : `${highestUnlocked} of ${LEVELS.length} realms unlocked`}
        </p>
      </footer>
    </div>
  )
}
