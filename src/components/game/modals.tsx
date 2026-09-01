'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { A, TILE_IMG } from '@/lib/game/assets'
import { WoodButton, IconButton, ModalShell, ParchmentPanel, StarRow } from './ui'
import type { LevelDef, LevelResult } from '@/lib/game/types'
import type { ProgressMap } from '@/hooks/use-progress'

/* ---------------- Pause ---------------- */

export function PauseModal({
  level,
  onResume,
  onRestart,
  onOptions,
  onQuit,
}: {
  level: LevelDef
  onResume: () => void
  onRestart: () => void
  onOptions: () => void
  onQuit: () => void
}) {
  return (
    <ModalShell>
      <ParchmentPanel className="p-6 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-[#8a6a3a] font-semibold">{level.name}</p>
        <h2 className="font-display text-3xl font-extrabold text-[#5d3a1a] mt-1 mb-1">Paused</h2>
        <p className="text-sm text-[#8a6a3a] mb-5">The threads wait patiently…</p>
        <img src={A('bunny-lantern')} alt="Bunny weaver holding a lantern" className="w-24 mx-auto anim-bob mb-4" draggable={false} />
        <div className="flex flex-col gap-2.5">
          <WoodButton variant="leaf" onClick={onResume}>Resume</WoodButton>
          <WoodButton onClick={onRestart}>Restart</WoodButton>
          <WoodButton onClick={onOptions}>Options</WoodButton>
          <WoodButton variant="berry" onClick={onQuit}>Quit to Atlas</WoodButton>
        </div>
      </ParchmentPanel>
    </ModalShell>
  )
}

/* ---------------- Options ---------------- */

export function OptionsModal({
  sound,
  vibration,
  onSound,
  onVibration,
  playerName,
  onRename,
  onClose,
}: {
  sound: boolean
  vibration: boolean
  onSound: (v: boolean) => void
  onVibration: (v: boolean) => void
  playerName: string
  onRename: (n: string) => void
  onClose: () => void
}) {
  const [name, setName] = React.useState(playerName)
  React.useEffect(() => setName(playerName), [playerName])
  return (
    <ModalShell onClose={onClose}>
      <ParchmentPanel className="p-6">
        <h2 className="font-display text-3xl font-extrabold text-[#5d3a1a] text-center mb-5">Instruments</h2>
        <div className="flex flex-col gap-4">
          <label className="flex items-center justify-between gap-4 bg-[#5d3a1a]/8 rounded-xl px-4 py-3 border border-[#7c4a1e]/25">
            <span className="font-semibold text-[#5d3a1a]">Sound</span>
            <button
              role="switch"
              aria-checked={sound}
              aria-label="Toggle sound"
              onClick={() => onSound(!sound)}
              className={cn(
                'relative w-14 h-8 rounded-full border-2 border-[#7c4a1e] transition-colors cursor-pointer',
                sound ? 'bg-gradient-to-b from-[#9ed86e] to-[#5da238]' : 'bg-[#8a7a5c]/50',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 w-6 h-6 rounded-full bg-gradient-to-b from-white to-[#e8dcc0] border border-[#7c4a1e]/60 shadow transition-all',
                  sound ? 'left-[26px]' : 'left-0.5',
                )}
              />
            </button>
          </label>
          <label className="flex items-center justify-between gap-4 bg-[#5d3a1a]/8 rounded-xl px-4 py-3 border border-[#7c4a1e]/25">
            <span className="font-semibold text-[#5d3a1a]">Vibration</span>
            <button
              role="switch"
              aria-checked={vibration}
              aria-label="Toggle vibration"
              onClick={() => onVibration(!vibration)}
              className={cn(
                'relative w-14 h-8 rounded-full border-2 border-[#7c4a1e] transition-colors cursor-pointer',
                vibration ? 'bg-gradient-to-b from-[#9ed86e] to-[#5da238]' : 'bg-[#8a7a5c]/50',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 w-6 h-6 rounded-full bg-gradient-to-b from-white to-[#e8dcc0] border border-[#7c4a1e]/60 shadow transition-all',
                  vibration ? 'left-[26px]' : 'left-0.5',
                )}
              />
            </button>
          </label>
          <div className="bg-[#5d3a1a]/8 rounded-xl px-4 py-3 border border-[#7c4a1e]/25">
            <label htmlFor="weaver-name" className="block font-semibold text-[#5d3a1a] mb-2">Weaver name</label>
            <div className="flex gap-2">
              <input
                id="weaver-name"
                value={name}
                maxLength={20}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 min-w-0 rounded-lg border-2 border-[#7c4a1e]/50 bg-[#fffbe8] px-3 py-2 text-[#5d3a1a] font-semibold outline-none focus:border-[#7c4a1e]"
              />
              <WoodButton size="sm" onClick={() => onRename(name)}>Save</WoodButton>
            </div>
          </div>
        </div>
        <div className="mt-5 text-center">
          <WoodButton variant="leaf" onClick={onClose}>Done</WoodButton>
        </div>
        <p className="text-center text-[11px] text-[#8a6a3a] mt-3">Wonderweave v1.0 — Threads of a Forgotten World</p>
      </ParchmentPanel>
    </ModalShell>
  )
}

/* ---------------- How to play ---------------- */

export function HowToModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell onClose={onClose}>
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

/* ---------------- Level complete ---------------- */

export function LevelCompleteModal({
  level,
  result,
  isLastLevel,
  onReplay,
  onAtlas,
  onNext,
}: {
  level: LevelDef
  result: LevelResult
  isLastLevel: boolean
  onReplay: () => void
  onAtlas: () => void
  onNext: () => void
}) {
  const [shownScore, setShownScore] = React.useState(0)
  React.useEffect(() => {
    const start = performance.now()
    const dur = 900
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      setShownScore(Math.round(result.score * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [result.score])

  return (
    <ModalShell>
      <ParchmentPanel className="p-6 text-center overflow-hidden">
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
        <p className="text-xs uppercase tracking-[0.25em] text-[#8a6a3a] font-semibold">Chapter {level.id} sealed</p>
        <h2 className="font-display text-3xl font-extrabold text-[#5d3a1a] mt-1">Folio Sealed!</h2>
        <img src={A('bunny-wizard')} alt="Bunny wizard celebrating" className="w-24 mx-auto anim-bob my-2" draggable={false} />
        <StarRow count={result.stars} size={40} animate className="mb-2" />
        <p className="font-display text-2xl font-extrabold text-[#7c4a1e] tabular-nums">{shownScore.toLocaleString()}</p>
        <p className="text-xs text-[#8a6a3a] mb-4">
          {result.movesLeft > 0 ? `+${result.movesLeft * 100} thread bonus from ${result.movesLeft} spare moves` : 'Every thread woven'}
        </p>
        <div className="flex flex-col gap-2.5">
          {!isLastLevel && <WoodButton variant="leaf" onClick={onNext}>Next Chapter</WoodButton>}
          {isLastLevel && <WoodButton variant="leaf" onClick={onAtlas}>The tapestry is complete!</WoodButton>}
          <WoodButton onClick={onReplay}>Replay</WoodButton>
          <WoodButton variant="berry" onClick={onAtlas}>Atlas</WoodButton>
        </div>
      </ParchmentPanel>
    </ModalShell>
  )
}

/* ---------------- Level failed ---------------- */

export function LevelFailedModal({
  level,
  score,
  onReplay,
  onAtlas,
}: {
  level: LevelDef
  score: number
  onReplay: () => void
  onAtlas: () => void
}) {
  return (
    <ModalShell>
      <ParchmentPanel className="p-6 text-center">
        <h2 className="font-display text-3xl font-extrabold text-[#5d3a1a]">Out of Moves</h2>
        <p className="text-sm text-[#8a6a3a] mt-1">The threads slipped away…</p>
        <img src={A('bunny-rest')} alt="Tired bunny resting" className="w-24 mx-auto my-3" draggable={false} />
        <p className="text-sm font-semibold text-[#7c4a1e] mb-4">
          {level.name} · {score.toLocaleString()} threads
        </p>
        <div className="flex flex-col gap-2.5">
          <WoodButton variant="leaf" onClick={onReplay}>Try Again</WoodButton>
          <WoodButton variant="berry" onClick={onAtlas}>Atlas</WoodButton>
        </div>
      </ParchmentPanel>
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

/* ---------------- Objective complete banner (brief) ---------------- */

export function ObjectiveBanner({ goals }: { goals: { type: string; done: boolean }[] }) {
  return (
    <img src={A('banner-objective')} alt="Objective complete!" className="w-44 drop-shadow-xl anim-combo" draggable={false} aria-hidden={false} />
  )
}

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
