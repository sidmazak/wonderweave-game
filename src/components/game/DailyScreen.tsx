'use client'

import * as React from 'react'
import { Search, Hammer } from 'lucide-react'
import { A, TILE_IMG } from '@/lib/game/assets'
import { TILE_META } from '@/lib/game/levels'
import { dateKey, prettyDate, getDailyLevel, dailyRewardFor } from '@/lib/game/daily'
import type { DailyState } from '@/lib/game/types'
import { RibbonBanner, WoodButton, IconButton } from './ui'

/** Today's Folio — a fresh seeded stage every calendar day, with a streak to tend. */
export function DailyScreen({ daily, onBack, onPlay }: { daily: DailyState; onBack: () => void; onPlay: () => void }) {
  const today = dateKey()
  const done = daily.last === today
  const level = React.useMemo(() => getDailyLevel(today), [today])
  const rewards = dailyRewardFor(daily.streak + 1)

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#101d13] ww-tap-none">
      {/* backdrop */}
      <div className="absolute inset-0" aria-hidden>
        <img src={A('bg-sunset')} alt="" draggable={false} className="h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(5,9,5,0.78)_100%)]" />
      </div>

      <IconButton img={A('icon-back')} label="Back" onClick={onBack} className="absolute top-3 left-3 z-20" />

      <div className="relative z-10 flex h-full min-h-0 flex-col">
        <header className="pt-4 px-4">
          <RibbonBanner title="DAILY FOLIO" subtitle="New Challenge Every Day" />
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto ww-scroll px-4 pt-3 pb-4 flex flex-col items-center">
          {/* date pill */}
          <div className="goal-card px-4 py-1 rounded-full text-sm font-bold text-[#5d3a1a] mt-1 mb-3">
            {prettyDate(today)}
          </div>

          {/* central parchment card */}
          <section className="goal-card p-5 w-full max-w-[380px] flex flex-col items-center" aria-label="Today's daily folio">
            <img
              src={done ? A('bunny-cheer') : A('bunny-lantern')}
              alt={done ? 'Bunny celebrating the sealed folio' : 'Bunny weaver holding a lantern'}
              draggable={false}
              className="w-24 mx-auto anim-bob"
            />

            {/* today's quest */}
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#8a6a3a] mt-3">Today&rsquo;s Quest</p>
            <p className="text-base font-semibold text-[#5d3a1a] text-center leading-relaxed mt-1">
              {level.objective.kind === 'collect' && level.objective.collect ? (
                <>
                  Collect{' '}
                  {level.objective.collect.map((g, i) => (
                    <React.Fragment key={g.type}>
                      {i > 0 ? ' & ' : ''}
                      <img
                        src={TILE_IMG[g.type]}
                        alt={TILE_META[g.type].name}
                        draggable={false}
                        className="inline-block w-6 h-6 object-contain align-middle mx-0.5"
                      />{' '}
                      <span className="tabular-nums">{g.count}</span> {TILE_META[g.type].name}
                    </React.Fragment>
                  ))}
                </>
              ) : (
                <>
                  Weave at least{' '}
                  <span className="tabular-nums font-extrabold">
                    {(level.objective.score ?? 0).toLocaleString()}
                  </span>{' '}
                  threads in one journey
                </>
              )}
            </p>

            <hr className="ww-divider w-full my-4" />

            {/* rewards */}
            <p className="text-[11px] tracking-[0.25em] uppercase text-[#8a6a3a]">Rewards</p>
            <div className="flex gap-2 w-full mt-2">
              <div className="codex-card px-3 py-2 flex-1 flex flex-col items-center gap-1" aria-label={`Reward: ${rewards.lumens} lumens`}>
                <span className="lumen-gem w-7 h-7 rounded-full flex items-center justify-center text-sm font-black text-white" aria-hidden>
                  ✦
                </span>
                <span className="text-xs font-extrabold tracking-wide text-[#5d3a1a] tabular-nums">+{rewards.lumens}</span>
              </div>
              <div className="codex-card px-3 py-2 flex-1 flex flex-col items-center gap-1" aria-label="Reward: 1 Lens booster">
                <span
                  className="w-7 h-7 rounded-full border-2 border-[#7c4a1e] bg-[radial-gradient(circle_at_35%_30%,#f4dfae,#e0b678_45%,#b97f3e)] flex items-center justify-center text-[#5d3a1a]"
                  aria-hidden
                >
                  <Search className="w-4 h-4" />
                </span>
                <span className="text-xs font-extrabold tracking-wide text-[#5d3a1a]">LENS +1</span>
              </div>
              <div className="codex-card px-3 py-2 flex-1 flex flex-col items-center gap-1" aria-label="Reward: 1 Null booster">
                <span
                  className="w-7 h-7 rounded-full border-2 border-[#7c4a1e] bg-[radial-gradient(circle_at_35%_30%,#f4dfae,#e0b678_45%,#b97f3e)] flex items-center justify-center text-[#5d3a1a]"
                  aria-hidden
                >
                  <Hammer className="w-4 h-4" />
                </span>
                <span className="text-xs font-extrabold tracking-wide text-[#5d3a1a]">NULL +1</span>
              </div>
            </div>

            {/* play / sealed */}
            <div className="w-full mt-4">
              {done ? (
                <>
                  <WoodButton variant="leaf" size="lg" disabled className="w-full">
                    Sealed for Today ✓
                  </WoodButton>
                  <p className="text-xs italic text-[#7a5c34] text-center mt-2">
                    Come back tomorrow — the Folio rewrites itself at midnight.
                  </p>
                </>
              ) : (
                <WoodButton variant="leaf" size="lg" className="w-full" onClick={onPlay} ariaLabel="Play today's daily folio">
                  Play
                </WoodButton>
              )}
            </div>
          </section>

          {/* streak footer */}
          <footer className="mt-4 mb-1 text-center">
            <p className="font-display text-sm font-bold text-[#d9ae62] tracking-wider">
              <span className="ww-ornament">✦</span> Streak: {daily.streak} Day{daily.streak === 1 ? '' : 's'}{' '}
              <span className="ww-ornament">✦</span>
            </p>
            <p className="text-[11px] text-[#9a7c4e] mt-1">Complete daily pages to grow your streak.</p>
          </footer>
        </main>
      </div>
    </div>
  )
}
