'use client'

import * as React from 'react'
import { ChevronRight, Play } from 'lucide-react'
import { A } from '@/lib/game/assets'
import { initAudio, sfx } from '@/lib/game/sound'
import { LEVELS_PER_CHAPTER, TOTAL_CHAPTERS, chapterDef, chapterLevelIds, chapterOf } from '@/lib/game/levels'
import type { ProgressMap } from '@/hooks/use-progress'
import { FloatingPetals, SceneBackdrop, ScreenHeader, StarPill, WoodButton } from './ui'
import { cn } from '@/lib/utils'

const STARS_PER_CHAPTER = LEVELS_PER_CHAPTER * 3

/**
 * Atlas — floating chapter islands over the parchment world map.
 * The world is endless: every chapter ≥ 1 renders, and new islands appear
 * as the player's journey crosses into the next chapter.
 * progress: Record<levelId, {stars, bestScore}> (may be empty on first render).
 * highestUnlocked: first level id the player may play (uncapped).
 */
export function AtlasScreen({
  progress,
  totalStars,
  highestUnlocked,
  onSelectChapter,
  onPlayNext,
  onBack,
}: {
  progress: ProgressMap
  totalStars: number
  /** Kept optional for call-site compatibility — the endless atlas shows no denominator. */
  totalStarsMax?: number
  highestUnlocked: number
  onSelectChapter: (chapterId: number) => void
  onPlayNext: () => void
  onBack?: () => void
}) {
  const currentChapterId = chapterOf(highestUnlocked).id
  const continueLabel = `${currentChapterId}-${((highestUnlocked - 1) % LEVELS_PER_CHAPTER) + 1}`
  const completedCount = Object.values(progress).filter((r) => r.stars > 0).length
  const viewMax = Math.max(TOTAL_CHAPTERS, currentChapterId + 1)
  const chapters = Array.from({ length: viewMax }, (_, i) => chapterDef(i + 1))

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden">
      <SceneBackdrop src={A('bg-map')} tint="#c9b080">
        <div className="absolute inset-0 bg-[#101d13]/20 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(14,28,20,0.5)_100%)] pointer-events-none" />
      </SceneBackdrop>

      {/* header: ribbon centered, star pill pinned top-right */}
      <ScreenHeader
        title="ATLAS"
        subtitle="The World Within"
        onBack={onBack}
        backLabel="Back to Home"
        right={<StarPill amount={totalStars} />}
      />

      {/* continue card */}
      <div className="relative z-20 px-4 pt-3">
        <div className="goal-card p-3 flex items-center justify-between gap-3">
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
        </div>
      </div>

      {/* floating chapter islands */}
      <div className="relative z-10 flex-1 overflow-y-auto ww-scroll px-4 py-3" style={{ WebkitOverflowScrolling: 'touch' }}>
        {chapters.map((ch) => {
          const ids = chapterLevelIds(ch.id)
          const earned = ids.reduce((sum, id) => sum + (progress[id]?.stars ?? 0), 0)
          const locked = (ch.id - 1) * LEVELS_PER_CHAPTER + 1 > highestUnlocked
          const current = currentChapterId === ch.id
          return (
            <button
              key={ch.id}
              type="button"
              disabled={locked}
              onClick={() => {
                initAudio()
                sfx.select()
                onSelectChapter(ch.id)
              }}
              aria-label={`Chapter ${ch.numeral} — ${ch.title}${locked ? ' — locked' : ''}, ${earned} of ${STARS_PER_CHAPTER} stars`}
              className={cn(
                'chapter-node relative w-full mb-3 text-left select-none',
                locked && 'chapter-node-locked',
                current && 'anim-ring-pulse',
              )}
            >
              <div className="goal-card p-2.5 flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-[#8a5a2b] shrink-0 bg-[#22301c]">
                  <img
                    src={A(locked ? 'medallion-lock' : ch.bg)}
                    alt=""
                    aria-hidden
                    draggable={false}
                    className={cn('chapter-thumb-img', locked && 'opacity-40 grayscale')}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-extrabold text-[#5d3a1a] text-sm leading-tight truncate">
                    {locked ? `${ch.numeral}. ???` : `${ch.numeral}. ${ch.title}`}
                  </p>
                  <p className="text-[11px] italic text-[#7a5c34] line-clamp-1">
                    {locked ? 'Uncharted isles — seal the prior chapter to reveal' : ch.tagline}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1" aria-label={`${earned} of ${STARS_PER_CHAPTER} stars in this chapter`}>
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
        <p className="text-[11px] text-[#f4e9c8]/80 ww-text-outline font-semibold">{completedCount} stages sealed</p>
      </footer>

      <FloatingPetals count={5} />
    </div>
  )
}
