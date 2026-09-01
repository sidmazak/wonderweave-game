'use client'

import * as React from 'react'
import { ChevronRight, Play } from 'lucide-react'
import { A } from '@/lib/game/assets'
import { CHAPTERS, LEVELS_PER_CHAPTER, TOTAL_LEVELS, chapterLevelIds, chapterOf } from '@/lib/game/levels'
import type { ProgressMap } from '@/hooks/use-progress'
import { FloatingPetals, HudPill, IconButton, RibbonBanner, WoodButton } from './ui'
import { cn } from '@/lib/utils'

const STARS_PER_CHAPTER = LEVELS_PER_CHAPTER * 3

/**
 * Atlas — floating chapter islands over the parchment world map.
 * progress: Record<levelId, {stars, bestScore}> (may be empty on first render).
 * highestUnlocked: first level id the player may play (1..TOTAL_LEVELS).
 */
export function AtlasScreen({
  progress,
  totalStars,
  totalStarsMax,
  highestUnlocked,
  onSelectChapter,
  onPlayNext,
  onBack,
}: {
  progress: ProgressMap
  totalStars: number
  totalStarsMax: number
  highestUnlocked: number
  onSelectChapter: (chapterId: number) => void
  onPlayNext: () => void
  onBack?: () => void
}) {
  const tapestryDone = highestUnlocked > TOTAL_LEVELS
  const currentChapterId = tapestryDone ? -1 : chapterOf(highestUnlocked).id
  const continueLabel = `${currentChapterId}-${((highestUnlocked - 1) % LEVELS_PER_CHAPTER) + 1}`
  const completedCount = Object.values(progress).filter((r) => r.stars > 0).length

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden">
      {/* parchment world-map backdrop */}
      <div aria-hidden className="absolute inset-0">
        <img src={A('bg-map')} alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover select-none" />
        <div className="absolute inset-0 bg-[#101d13]/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(14,28,20,0.5)_100%)]" />
      </div>

      {/* header: ribbon centered, star pill pinned top-right below the fold of the ribbon */}
      <div className="relative z-20 pt-12">
        <RibbonBanner title="ATLAS" subtitle="The World Within" />
      </div>
      {onBack && (
        <div className="absolute top-3 left-3 z-30">
          <IconButton img={A('icon-back')} label="Back to Home" onClick={onBack} />
        </div>
      )}
      <div className="absolute top-3 right-3 z-30">
        <HudPill>
          <img src={A('star-sparkle')} alt="" draggable={false} className="w-5 h-5 object-contain shrink-0" />
          <span className="tabular-nums">{totalStars}</span>
          <span className="text-[#d9c79a]">/ {totalStarsMax}</span>
        </HudPill>
      </div>

      {/* continue card */}
      <div className="relative z-20 px-4 pt-3">
        <div className="goal-card p-3 flex items-center justify-between gap-3">
          {tapestryDone ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <img src={A('medallion-1')} alt="" aria-hidden draggable={false} className="w-9 h-9 object-contain shrink-0" />
              <p className="font-display font-extrabold text-[#5d3a1a] text-base leading-snug">The tapestry is complete ✦</p>
            </div>
          ) : (
            <>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8a5a2b]">Continue</p>
                <p className="font-display font-extrabold text-[#5d3a1a] text-lg leading-tight">Stage {continueLabel}</p>
                <p className="text-xs text-[#7a5c34] truncate">{chapterOf(highestUnlocked).title}</p>
              </div>
              <WoodButton
                variant="leaf"
                size="sm"
                className="shrink-0"
                onClick={onPlayNext}
                ariaLabel={`Play stage ${continueLabel} — ${chapterOf(highestUnlocked).title}`}
              >
                <span className="inline-flex items-center gap-1.5">
                  Go
                  <Play className="w-4 h-4" aria-hidden />
                </span>
              </WoodButton>
            </>
          )}
        </div>
      </div>

      {/* floating chapter islands */}
      <div className="relative z-10 flex-1 overflow-y-auto ww-scroll px-4 py-3" style={{ WebkitOverflowScrolling: 'touch' }}>
        {CHAPTERS.map((ch) => {
          const ids = chapterLevelIds(ch.id)
          const earned = ids.reduce((sum, id) => sum + (progress[id]?.stars ?? 0), 0)
          const locked = (ch.id - 1) * LEVELS_PER_CHAPTER + 1 > highestUnlocked
          const current = currentChapterId === ch.id
          return (
            <button
              key={ch.id}
              type="button"
              disabled={locked}
              onClick={() => onSelectChapter(ch.id)}
              aria-label={`Chapter ${ch.numeral} — ${ch.title}${locked ? ' — locked' : ''}, ${earned} of ${STARS_PER_CHAPTER} stars`}
              className={cn(
                'chapter-node relative w-full mb-3 text-left select-none',
                locked && 'chapter-node-locked',
                current && 'anim-ring-pulse',
              )}
            >
              <div className="goal-card p-2.5 flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-[#8a5a2b] shrink-0 bg-[#22301c]">
                  <img src={A(ch.bg)} alt="" aria-hidden draggable={false} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-extrabold text-[#5d3a1a] text-sm leading-tight truncate">
                    {ch.numeral}. {ch.title}
                  </p>
                  <p className="text-[11px] italic text-[#7a5c34] line-clamp-1">{ch.tagline}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="flex items-center gap-0.5" aria-hidden>
                      {[0, 1, 2].map((p) => (
                        <img
                          key={p}
                          src={A('star-sparkle')}
                          alt=""
                          draggable={false}
                          className={cn('w-3.5 h-3.5 object-contain', earned >= (p + 1) * LEVELS_PER_CHAPTER ? '' : 'grayscale opacity-40')}
                        />
                      ))}
                    </span>
                    <span className="text-[11px] font-bold text-[#a2701f] tabular-nums">
                      {earned}/{STARS_PER_CHAPTER}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 w-9 flex items-center justify-center pr-1">
                  {locked ? (
                    <img src={A('medallion-lock')} alt="" aria-hidden draggable={false} className="w-8 h-8 object-contain grayscale" />
                  ) : earned >= STARS_PER_CHAPTER ? (
                    <img
                      src={A('star-sparkle')}
                      alt=""
                      aria-hidden
                      draggable={false}
                      className="w-8 h-8 object-contain anim-glow-pulse"
                    />
                  ) : (
                    <ChevronRight className="w-6 h-6 text-[#8a5a2b]" aria-hidden />
                  )}
                </div>
              </div>
              {current && (
                <span className="absolute -top-2 right-2 wood-tab-active rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest pointer-events-none">
                  Continue
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* footer */}
      <footer className="relative z-20 pb-1 text-center">
        <p className="text-[11px] text-[#f4e9c8]/80 ww-text-outline font-semibold">
          {completedCount} / {TOTAL_LEVELS} stages sealed
        </p>
      </footer>

      <FloatingPetals count={5} />
    </div>
  )
}
