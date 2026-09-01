'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { A, TILE_IMG } from '@/lib/game/assets'
import { WoodButton, IconButton, ModalShell, ParchmentPanel, StarRow, CountUp, RibbonBanner } from './ui'
import type { LevelDef, LevelResult } from '@/lib/game/types'
import type { RewardSummary } from './PlayScreen'
import { stageTitle } from '@/lib/game/levels'

/**
 * Modal shell + document side effects: locks body scroll and pauses ambient
 * particles while any dialog is open (see `body.ww-modal-open` in globals.css).
 * ModalShell itself lives in ui.tsx; every dialog in this file renders through
 * this wrapper so the effect is applied consistently.
 */
function Modal(props: React.ComponentProps<typeof ModalShell>) {
  React.useEffect(() => {
    document.body.classList.add('ww-modal-open')
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.classList.remove('ww-modal-open')
      document.body.style.overflow = prev
    }
  }, [])
  return <ModalShell {...props} />
}

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
    <Modal>
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
            <WoodButton variant="berry" onClick={onQuit}>{isDaily ? 'Daily Folio' : 'Quit to Atlas'}</WoodButton>
          </div>
          <p className="text-[11px] text-[#8a6a3a] mt-4 italic">The threads wait patiently…</p>
        </ParchmentPanel>
      </div>
    </Modal>
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
    <Modal>
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
              <WoodButton variant="leaf" onClick={onExit}>Weave Ever Onward</WoodButton>
            )}
            <div className="flex justify-center gap-2">
              <WoodButton size="sm" onClick={onReplay} className="flex-1">Retry</WoodButton>
              <WoodButton size="sm" onClick={onExit} className="flex-1">{isDaily ? 'Daily' : 'Atlas'}</WoodButton>
            </div>
          </div>
        </ParchmentPanel>
      </div>
    </Modal>
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
    <Modal>
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
    </Modal>
  )
}

/* ---------------- How to play ---------------- */

function HowRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-center justify-center gap-2 min-h-[52px]', className)}>{children}</div>
}

function HowText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-snug text-[#6a4520] text-center font-medium">{children}</p>
}

function HowDivider() {
  return <div className="ww-divider my-3" aria-hidden />
}

export function HowToModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose} overlayClassName="z-[70]">
      <ParchmentPanel className="pt-5 pb-5 px-5 max-h-[76vh] overflow-y-auto ww-scroll">
        <div className="relative">
          <IconButton img={A('icon-close')} label="Close how to play" onClick={onClose} className="absolute -top-2 -right-2 z-10 w-9 h-9" />
          <h2 className="font-display text-2xl font-extrabold text-[#5d3a1a] text-center tracking-wide">How to Play</h2>
          <p className="text-[11px] text-center text-[#8a6a3a] italic mt-0.5">The Weaver&apos;s little book of threads</p>

          <HowDivider />

          {/* 1 — match */}
          <HowRow>
            <img src={TILE_IMG.leaf} alt="Verdant Leaf charm" className="w-9 h-9 object-contain drop-shadow" draggable={false} />
            <img src={TILE_IMG.leaf} alt="" aria-hidden className="w-9 h-9 object-contain drop-shadow" draggable={false} />
            <img src={TILE_IMG.leaf} alt="" aria-hidden className="w-9 h-9 object-contain drop-shadow" draggable={false} />
            <span className="text-[#a97b42] font-bold" aria-hidden>→</span>
            <img src={A('star-sparkle')} alt="" aria-hidden className="w-8 h-8 object-contain anim-glow-pulse" draggable={false} />
          </HowRow>
          <HowText>
            Swap two neighbouring charms to line up <b>three or more</b> of a kind and weave them into Lumin Threads.
          </HowText>

          <HowDivider />

          {/* 2 — specials */}
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#8a5a2b] font-bold text-center mb-1.5">Forge Special Tiles</p>
          <HowRow>
            <span className="flex items-center gap-1.5 goal-card rounded-xl px-2 py-1.5">
              <img src={TILE_IMG.drop} alt="" aria-hidden className="w-7 h-7 object-contain" draggable={false} />
              <span className="special-lineH inline-flex items-center justify-center rounded-md">
                <img src={TILE_IMG.drop} alt="Striped charm — clears a row or column" className="w-7 h-7 object-contain relative" draggable={false} />
              </span>
              <span className="text-[9px] font-bold text-[#6a4520] leading-tight">match 4<br />→ striped</span>
            </span>
            <span className="flex items-center gap-1.5 goal-card rounded-xl px-2 py-1.5">
              <span className="special-bomb inline-flex items-center justify-center rounded-full">
                <img src={TILE_IMG.flame} alt="Charm Burst — detonates a ring" className="w-7 h-7 object-contain" draggable={false} />
              </span>
              <span className="text-[9px] font-bold text-[#6a4520] leading-tight">L or T<br />→ burst</span>
            </span>
          </HowRow>
          <HowRow className="mt-1.5 flex-col gap-1">
            <span className="flex items-center gap-1.5 goal-card rounded-xl px-2.5 py-1.5">
              <img src={A('fx-rainbow')} alt="Rainbow Prism" className="w-7 h-7 object-contain anim-prism shrink-0" draggable={false} />
              <span className="text-[9px] font-bold text-[#6a4520] whitespace-nowrap">match 5 → prism</span>
            </span>
            <span className="text-[11px] text-[#6a4520] font-medium">The Prism trades places with any charm to sweep its whole colour away.</span>
          </HowRow>

          <HowDivider />

          {/* 3 — combos */}
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#8a5a2b] font-bold text-center mb-1.5">Weave Specials Together</p>
          <HowText>
            Swap two special charms for astonishing weaves — crosses of light, storms of stripes, or the whole loom unravelling.
          </HowText>

          <HowDivider />

          {/* 4 — boosters */}
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#8a5a2b] font-bold text-center mb-1.5">Instruments of Help</p>
          <HowRow>
            <span className="flex items-center gap-1.5">
              <span className="booster-btn w-10 h-10" aria-hidden>
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#5d3a1a" strokeWidth="2.4" strokeLinecap="round">
                  <circle cx="10.5" cy="10.5" r="6.2" />
                  <path d="m15.3 15.3 5 5" />
                </svg>
              </span>
              <span className="text-[11px] text-[#6a4520] font-medium"><b>Lens</b> weaves one thread for you — free.</span>
            </span>
          </HowRow>
          <HowRow className="mt-1.5">
            <span className="flex items-center gap-1.5">
              <span className="booster-btn w-10 h-10" aria-hidden>
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#5d3a1a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 4.5 19 9l-2.5 2.5L12 7l2.5-2.5ZM12 7 5 14v5h5l7-7" />
                </svg>
              </span>
              <span className="text-[11px] text-[#6a4520] font-medium"><b>Null</b> gently unweaves any single charm.</span>
            </span>
          </HowRow>

          <HowDivider />

          <HowText>
            Reach the goal before the moves run out. Leftover moves become bonus threads!
          </HowText>

          <div className="mt-4 text-center">
            <WoodButton variant="leaf" onClick={onClose} className="w-full max-w-[200px]">Got it!</WoodButton>
          </div>
        </div>
      </ParchmentPanel>
    </Modal>
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
