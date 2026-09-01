'use client'

import * as React from 'react'
import { A } from '@/lib/game/assets'
import { CHAPTERS, TOTAL_CHAPTERS, chapterLevelIds } from '@/lib/game/levels'
import type { ProgressMap } from '@/hooks/use-progress'
import { IconButton, ProgressBar, RibbonBanner } from './ui'
import { cn } from '@/lib/utils'

const STARS_PER_CHAPTER = 36

/**
 * Chapter — one island's 12 stage nodes (e.g. "CHAPTER VII — The Celestial Archive").
 * progress: Record<levelId, {stars, bestScore}> (may be empty on first render).
 * highestUnlocked: first level id the player may play (1..144).
 */
export function ChapterScreen({
  chapterId,
  progress,
  highestUnlocked,
  onBack,
  onPlayLevel,
}: {
  chapterId: number
  progress: ProgressMap
  highestUnlocked: number
  onBack: () => void
  onPlayLevel: (levelId: number) => void
}) {
  const ch = CHAPTERS[Math.min(TOTAL_CHAPTERS, Math.max(1, chapterId)) - 1]
  const ids = chapterLevelIds(ch.id)
  const chapterStars = ids.reduce((sum, id) => sum + (progress[id]?.stars ?? 0), 0)

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden">
      {/* dimmed chapter backdrop */}
      <div aria-hidden className="absolute inset-0">
        <img src={A(ch.bg)} alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover select-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0e1c14]/40 via-[#0e1c14]/20 to-[#0e1c14]/55" />
      </div>

      {/* back to atlas */}
      <div className="absolute top-3 left-3 z-20">
        <IconButton img={A('icon-back')} label="Back to Atlas" onClick={onBack} />
      </div>

      {/* ribbon header */}
      <header className="relative z-20 pt-4">
        <RibbonBanner title={`CHAPTER ${ch.numeral}`} subtitle={ch.title} />
      </header>

      {/* scrollable middle: island + stage grid */}
      <div className="relative z-10 flex-1 overflow-y-auto ww-scroll" style={{ WebkitOverflowScrolling: 'touch' }}>
        <img
          src={A('deco-island')}
          alt=""
          aria-hidden
          draggable={false}
          className="w-44 mx-auto my-1 anim-float drop-shadow-2xl pointer-events-none select-none"
          style={{
            maskImage: 'radial-gradient(ellipse 62% 58% at 50% 46%, black 55%, transparent 92%)',
            WebkitMaskImage: 'radial-gradient(ellipse 62% 58% at 50% 46%, black 55%, transparent 92%)',
          }}
        />
        <div className="px-5 pb-4">
          <div className="grid grid-cols-3 gap-3">
            {ids.map((levelId, idx) => {
              const label = `${ch.id}-${idx + 1}`
              const rec = progress[levelId]
              const stars = rec?.stars ?? 0
              const locked = levelId > highestUnlocked
              const current = levelId === highestUnlocked
              return (
                <button
                  key={levelId}
                  type="button"
                  disabled={locked}
                  onClick={() => onPlayLevel(levelId)}
                  aria-label={
                    locked
                      ? `Stage ${label} — locked`
                      : `Play stage ${label}${current ? ' — your next stage' : ''}${rec ? `, best ${rec.bestScore} points, ${stars} stars` : ''}`
                  }
                  className={cn(
                    'level-node aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 select-none',
                    stars > 0 && 'level-node-done',
                    locked && 'level-node-locked',
                    current && 'anim-ring-pulse',
                  )}
                >
                  {locked ? (
                    <img src={A('medallion-lock')} alt="" aria-hidden draggable={false} className="w-7 h-7 object-contain" />
                  ) : (
                    <>
                      <span className="font-display font-extrabold text-xl leading-none">{label}</span>
                      <span className="flex items-center gap-0.5" aria-hidden>
                        {[0, 1, 2].map((s) => (
                          <img
                            key={s}
                            src={A('star-sparkle')}
                            alt=""
                            draggable={false}
                            className={cn('w-3.5 h-3.5 object-contain', s >= stars ? 'grayscale opacity-40' : '')}
                          />
                        ))}
                      </span>
                    </>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* chapter stars footer */}
      <footer className="relative z-20 flex justify-center px-4 pb-2 pt-1">
        <div
          className="goal-card inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
          aria-label={`${chapterStars} of ${STARS_PER_CHAPTER} stars in ${ch.title}`}
        >
          <img src={A('star-sparkle')} alt="" aria-hidden draggable={false} className="w-4 h-4 object-contain shrink-0" />
          <span className="text-sm font-bold text-[#5d3a1a] tabular-nums">
            {chapterStars} / {STARS_PER_CHAPTER}
          </span>
          <ProgressBar value={chapterStars / STARS_PER_CHAPTER} className="w-24 h-2" />
        </div>
      </footer>
    </div>
  )
}
