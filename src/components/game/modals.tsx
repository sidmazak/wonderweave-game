'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { A, TILE_IMG } from '@/lib/game/assets'
import { WoodButton, IconButton, ModalShell, ParchmentPanel, StarRow, CountUp, RibbonBanner } from './ui'
import type { LevelDef, LevelResult } from '@/lib/game/types'
import type { RewardSummary } from './PlayScreen'
import type { ProgressMap } from '@/hooks/use-progress'
import { stageTitle } from '@/lib/game/levels'

/* ---------------- Pause (storybook style: sleepy bunny + button stack) ---------------- */

export function PauseModal({
  level,
  isDaily,
  onResume,
  onRestart,
  onOptions,
  onQuit,
}: {
  level: LevelDef
  isDaily: boolean
  onResume: () => void
  onRestart: () => void
  onOptions: () => void
  onQuit: () => void
}) {
  return (
    <ModalShell>
      <div className="relative">
        {/* sleeping bunny peeking over the panel */}
        <img
          src={A('bunny-rest')}
          alt="Dreamer the bunny napping"
          className="absolute -top-[74px] left-1/2 -translate-x-1/2 w-24 anim-bob drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)] z-10 pointer-events-none"
          draggable={false}
        />
        <ParchmentPanel className="pt-9 pb-6 px-6 text-center">
          <IconButton
            img={A('icon-close')}
            label="Close pause menu"
            onClick={onResume}
            className="absolute top-3 right-3 z-10 w-9 h-9"
          />
          <RibbonBanner
            size="sm"
            title="PAUSED"
            subtitle={isDaily ? 'Daily Folio' : `Stage ${stageTitle(level)}`}
            className="mb-4"
          />
          <div className="flex flex-col gap-2.5 max-w-[240px] mx-auto">
            <WoodButton variant="leaf" onClick={onResume}>Resume</WoodButton>
            <WoodButton onClick={onRestart}>Restart</WoodButton>
            <WoodButton onClick={onOptions}>Options</WoodButton>
            <WoodButton onClick={onQuit}>{isDaily ? 'Daily Folio' : 'Atlas'}</WoodButton>
            <WoodButton variant="berry" onClick={onQuit}>Quit Folio</WoodButton>
          </div>
          <p className="text-[11px] text-[#8a6a3a] mt-4 italic">The threads wait patiently…</p>
        </ParchmentPanel>
      </div>
    </ModalShell>
  )
}

/* ---------------- Win — "Folio Sealed" ---------------- */

export function FolioSealedModal({
  level,
  result,
  rewards,
  isDaily,
  hasNext,
  onNext,
  onReplay,
  onExit,
}: {
  level: LevelDef
  result: LevelResult
  rewards: RewardSummary | null
  isDaily: boolean
  hasNext: boolean
  onNext: () => void
  onReplay: () => void
  onExit: () => void
}) {
  return (
    <ModalShell>
      <div className="relative">
        <ParchmentPanel className="pt-6 pb-5 px-6 text-center overflow-hidden">
          {/* confetti */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 12 }).map((_, i) => (
              <img
                key={i}
                src={A(i % 3 === 0 ? 'fx-sparkle' : i % 3 === 1 ? 'fx-petal' : 'heart-pink')}
                alt=""
                draggable={false}
                className="absolute w-4 anim-confetti"
                style={{ left: `${6 + i * 7.6}%`, top: '4%', animationDuration: `${2.2 + (i % 5) * 0.55}s`, animationDelay: `${i * 0.18}s` }}
              />
            ))}
          </div>

          <RibbonBanner
            size="sm"
            title={isDaily ? 'DAILY PAGE SEALED' : 'FOLIO SEALED'}
            subtitle={level.name}
            className="mb-3"
          />

          {/* bunny cameo */}
          <div className="cameo w-[118px] h-[104px] mx-auto my-2">
            <img
              src={A(result.stars >= 3 ? 'bunny-cheer' : 'bunny-wizard')}
              alt="The bunny weaver celebrating"
              className="w-[86px] object-contain anim-bob"
              draggable={false}
            />
          </div>

          <StarRow count={result.stars} size={44} animate className="mb-1" />

          <p className="text-[10px] uppercase tracking-[0.3em] text-[#8a6a3a] font-bold mt-1">Score</p>
          <p className="font-display text-3xl font-extrabold text-[#7c4a1e] leading-tight">
            <CountUp value={result.score} duration={1000} />
          </p>
          <p className="text-xs text-[#8a6a3a] italic mt-0.5 mb-3">
            {result.movesLeft > 0
              ? `+${result.movesLeft * 100} thread bonus from ${result.movesLeft} spare move${result.movesLeft === 1 ? '' : 's'}`
              : 'A harmonious balance has been restored.'}
          </p>

          {/* rewards */}
          {rewards && (rewards.lumens > 0 || rewards.lens > 0 || rewards.null > 0) && (
            <div className="flex items-center justify-center gap-2 mb-4" aria-label="Rewards earned">
              {rewards.lumens > 0 && (
                <span className="hud-pill rounded-full px-2.5 py-1 text-xs font-bold flex items-center gap-1">
                  <span className="lumen-gem w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white" aria-hidden>
                    ✦
                  </span>
                  +{rewards.lumens}
                </span>
              )}
              {rewards.lens > 0 && (
                <span className="hud-pill rounded-full px-2.5 py-1 text-xs font-bold flex items-center gap-1">
                  <img src={A('deco-lamp')} alt="" className="w-4 h-4 object-contain" draggable={false} /> Lens +{rewards.lens}
                </span>
              )}
              {rewards.null > 0 && (
                <span className="hud-pill rounded-full px-2.5 py-1 text-xs font-bold flex items-center gap-1">
                  <img src={A('icon-close')} alt="" className="w-3.5 h-3.5 object-contain" draggable={false} /> Null +{rewards.null}
                </span>
              )}
              {typeof rewards.streak === 'number' && (
                <span className="hud-pill rounded-full px-2.5 py-1 text-xs font-bold">🔥 Streak {rewards.streak}</span>
              )}
            </div>
          )}
          {isDaily && rewards && rewards.lumens === 0 && (
            <p className="text-xs text-[#8a6a3a] italic mb-3">Already sealed today — the Folio rewards once per day.</p>
          )}

          <div className="flex flex-col gap-2.5 max-w-[250px] mx-auto">
            {hasNext ? (
              <WoodButton variant="leaf" onClick={onNext}>Continue</WoodButton>
            ) : (
              <WoodButton variant="leaf" onClick={onExit}>The tapestry is complete!</WoodButton>
            )}
            <div className="flex justify-center gap-2">
              <WoodButton size="sm" onClick={onReplay} className="flex-1">Retry</WoodButton>
              <WoodButton size="sm" onClick={onExit} className="flex-1">{isDaily ? 'Daily' : 'Atlas'}</WoodButton>
            </div>
          </div>
        </ParchmentPanel>
      </div>
    </ModalShell>
  )
}

/* ---------------- Lose ---------------- */

export function FolioLostModal({
  level,
  isDaily,
  score,
  onReplay,
  onExit,
}: {
  level: LevelDef
  isDaily: boolean
  score: number
  onReplay: () => void
  onExit: () => void
}) {
  return (
    <ModalShell>
      <ParchmentPanel className="pt-6 pb-5 px-6 text-center">
        <RibbonBanner size="sm" title="THE FOLIO SLIPS AWAY" subtitle={level.name} className="mb-3" />
        <div className="cameo w-[112px] h-[98px] mx-auto my-2">
          <img src={A('bunny-rest')} alt="The bunny weaver resting" className="w-[80px] object-contain" draggable={false} />
        </div>
        <p className="text-sm text-[#7c4a1e] font-semibold">
          {isDaily ? 'Tomorrow brings a fresh page…' : `Stage ${stageTitle(level)} keeps its secrets…`}
        </p>
        <p className="text-xs text-[#8a6a3a] italic mt-1 mb-4">
          You wove {score.toLocaleString()} threads. Take a breath and try again.
        </p>
        <div className="flex flex-col gap-2.5 max-w-[250px] mx-auto">
          <WoodButton variant="leaf" onClick={onReplay}>Try Again</WoodButton>
          <WoodButton onClick={onExit}>{isDaily ? 'Daily Folio' : 'Atlas'}</WoodButton>
        </div>
      </ParchmentPanel>
    </ModalShell>
  )
}

/* ---------------- How to play ---------------- */

export function HowToModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell onClose={onClose} overlayClassName="z-[70]">
      <div className="relative">
        <button onClick={onClose} aria-label="How to play — tap to close" className="block cursor-pointer rounded-2xl overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ffd76e]">
          <img
            src={A('panel-howto')}
            alt="How to play: match 3 or more charms. Create special tiles with matches of 4 or 5. Use power-ups. Clear objectives before runs out of moves."
            className="w-full max-h-[70vh] object-contain drop-shadow-2xl"
            draggable={false}
          />
        </button>
        <IconButton img={A('icon-close')} label="Close" onClick={onClose} className="absolute -top-3 -right-3" />
      </div>
      <div className="mt-4 text-center">
        <WoodButton variant="leaf" onClick={onClose}>Got it!</WoodButton>
      </div>
    </ModalShell>
  )
}

/* ---------------- Leaderboard ---------------- */

interface LeaderRow {
  playerId: string
  playerName: string
  totalStars: number
  totalScore: number
}

export function LeaderboardModal({ onClose, myId }: { onClose: () => void; myId: string }) {
  const [rows, setRows] = React.useState<LeaderRow[] | null>(null)
  const [error, setError] = React.useState(false)
  const load = React.useCallback(async () => {
    setError(false)
    try {
      const res = await fetch('/api/leaderboard')
      if (!res.ok) throw new Error('bad status')
      const data = (await res.json()) as { leaders: LeaderRow[] }
      setRows(data.leaders)
    } catch {
      setError(true)
    }
  }, [])
  React.useEffect(() => {
    void load()
  }, [load])

  const medalColors = ['from-[#ffe28a] to-[#e8963c]', 'from-[#e8e8f0] to-[#9aa0b4]', 'from-[#f0b48a] to-[#b4633c]']

  return (
    <ModalShell onClose={onClose}>
      <ParchmentPanel className="p-6">
        <h2 className="font-display text-3xl font-extrabold text-[#5d3a1a] text-center">Top Weavers</h2>
        <p className="text-center text-xs text-[#8a6a3a] mb-4">The finest tapestries across all realms</p>
        {rows === null && !error && (
          <div className="flex flex-col gap-2 mb-2" aria-busy="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-[#5d3a1a]/10 animate-pulse" />
            ))}
          </div>
        )}
        {error && (
          <div className="text-center py-6">
            <p className="text-[#8a6a3a] text-sm mb-3">The messenger raven got lost…</p>
            <WoodButton size="sm" onClick={() => void load()}>Retry</WoodButton>
          </div>
        )}
        {rows !== null && rows.length === 0 && <p className="text-center text-sm text-[#8a6a3a] py-6">No tapestries yet — be the first!</p>}
        {rows !== null && rows.length > 0 && (
          <ol className="flex flex-col gap-2 max-h-[46vh] overflow-y-auto ww-scroll pr-1">
            {rows.map((r, i) => (
              <li
                key={r.playerId}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2 border',
                  r.playerId === myId ? 'bg-[#ffd76e]/35 border-[#c99a3c] anim-ring-pulse' : 'bg-[#5d3a1a]/8 border-[#7c4a1e]/20',
                )}
              >
                <span
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center font-display font-extrabold text-[#4a2e12] border-2 border-[#7c4a1e]/60 shrink-0',
                    i < 3 ? `bg-gradient-to-b ${medalColors[i]}` : 'bg-[#d8c9a8] text-[#5d3a1a]',
                  )}
                >
                  {i + 1}
                </span>
                <span className="flex-1 min-w-0 truncate font-semibold text-[#5d3a1a]">{r.playerName}</span>
                <span className="flex items-center gap-1 text-sm font-bold text-[#a2701f] shrink-0">
                  <img src={A('star-sparkle')} alt="stars" className="w-4 h-4" draggable={false} />
                  {r.totalStars}
                </span>
                <span className="text-sm font-bold text-[#7c4a1e] tabular-nums w-16 text-right shrink-0">{r.totalScore.toLocaleString()}</span>
              </li>
            ))}
          </ol>
        )}
        <div className="mt-4 text-center">
          <WoodButton variant="leaf" onClick={onClose}>Close</WoodButton>
        </div>
      </ParchmentPanel>
    </ModalShell>
  )
}

/* ---------------- goal chip (reused for compact displays) ---------------- */

export function GoalChip({ type, have, need }: { type: string; have: number; need: number }) {
  const done = have >= need
  return (
    <div
      className={cn(
        'hud-pill rounded-full pl-1 pr-2.5 py-0.5 flex items-center gap-1.5 text-xs font-bold tabular-nums',
        done && 'opacity-70',
      )}
      aria-label={`${type} ${Math.min(have, need)} of ${need}`}
    >
      <img src={TILE_IMG[type as keyof typeof TILE_IMG]} alt="" className="w-6 h-6 object-contain drop-shadow" draggable={false} />
      <span className={done ? 'text-[#b8e08a]' : ''}>{done ? '✓' : `${Math.min(have, need)}/${need}`}</span>
    </div>
  )
}
