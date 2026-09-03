'use client'

import * as React from 'react'
import { A } from '@/lib/game/assets'
import { initAudio, sfx } from '@/lib/game/sound'
import { LEVELS_PER_CHAPTER, chapterDef, chapterLevelIds, chapterDecoKey, chapterBackdropTint } from '@/lib/game/levels'
import type { ProgressMap } from '@/hooks/use-progress'
import { ProgressBar, SceneBackdrop, ScreenHeader } from './ui'
import { cn } from '@/lib/utils'

const STARS_PER_CHAPTER = LEVELS_PER_CHAPTER * 3

/**
 * Chapter — one island's stage nodes (e.g. "CHAPTER VII — The Celestial Archive").
 * Works for ANY chapter id ≥ 1: the world is endless and themes echo forever.
 * progress: Record<levelId, {stars, bestScore}> (may be empty on first render).
 * highestUnlocked: first level id the player may play.
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
  const ch = chapterDef(Math.max(1, chapterId))
  const ids = chapterLevelIds(ch.id)
  const chapterStars = ids.reduce((sum, id) => sum + (progress[id]?.stars ?? 0), 0)
  const chapterDeco = chapterDecoKey(ch.bg)

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden">
      <SceneBackdrop
        src={A(ch.bg)}
        tint={chapterBackdropTint(ch.bg)}
        overlayClassName="bg-gradient-to-b from-[#0e1c14]/40 via-[#0e1c14]/20 to-[#0e1c14]/55"
      />

      <ScreenHeader
        title={`CHAPTER ${ch.numeral}`}
        subtitle={ch.title}
        onBack={onBack}
        backLabel="Back to Atlas"
        className="z-20"
      />

      {/* scrollable middle: island + stage grid */}
      <div className="relative z-10 flex-1 overflow-y-auto ww-scroll mt-1" style={{ WebkitOverflowScrolling: 'touch' }}>
        <img
          src={A(chapterDeco)}
          alt=""
          aria-hidden
          draggable={false}
          className="w-44 mx-auto my-1 anim-float drop-shadow-2xl pointer-events-none select-none"
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
                  onClick={() => {
                    initAudio()
                    sfx.select()
                    onPlayLevel(levelId)
                  }}
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
                    <>
                      <img src={A('medallion-lock')} alt="" aria-hidden draggable={false} className="w-7 h-7 object-contain opacity-90" />
                      <span className="flex items-center gap-0.5 mt-0.5" aria-hidden>
                        {[0, 1, 2].map((s) => (
                          <img key={s} src={A('star-sparkle')} alt="" draggable={false} className="level-star level-star-empty" />
                        ))}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-display font-extrabold text-xl leading-none">{label}</span>
                      <span className="flex items-center gap-0.5 mt-0.5" aria-hidden>
                        {[0, 1, 2].map((s) => (
                          <img
                            key={s}
                            src={A('star-sparkle')}
                            alt=""
                            draggable={false}
                            className={cn('level-star', s < stars ? 'level-star-earned' : 'level-star-empty')}
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
