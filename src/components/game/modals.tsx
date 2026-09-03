'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { A, TILE_IMG, BOOSTER_IMG } from '@/lib/game/assets'
import { sfx } from '@/lib/game/sound'
import {
  BoardTileIcon,
  LumenInline,
  LumenPill,
  ScoreGoalIcon,
  StarIcon,
  StarPill,
  WoodButton,
  ModalShell,
  DialogPanel,
  ParchmentPanel,
  StarRow,
  CountUp,
  RibbonBanner,
} from './ui'
import type { LevelDef, LevelResult, TileType } from '@/lib/game/types'
import type { RewardSummary } from './PlayScreen'
import { stageTitle, chapterDef } from '@/lib/game/levels'
import { CODEX_ITEMS, LORE_EXCERPTS } from '@/lib/game/codex'

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
      <DialogPanel
        onClose={onResume}
        closeLabel="Close pause menu"
        className="text-center"
        bodyClassName="pb-3"
        peek={
          <img
            src={A('bunny-rest')}
            alt="Dreamer the bunny napping"
            className="absolute -top-[74px] left-1/2 -translate-x-1/2 w-24 anim-bob-subtle drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)] z-10 pointer-events-none"
            draggable={false}
          />
        }
      >
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
          <WoodButton variant="berry" onClick={onQuit}>{isDaily ? 'Quit to Home' : 'Quit to Home'}</WoodButton>
        </div>
        <p className="text-[11px] text-[#8a6a3a] mt-4 italic">The threads wait patiently…</p>
      </DialogPanel>
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
  // a soft reward chime once the win fanfare + star pops have had their moment
  React.useEffect(() => {
    if (!rewards || (rewards.lumens <= 0 && rewards.lens <= 0 && rewards.null <= 0)) return
    const t = setTimeout(() => sfx.reward(), 1350)
    return () => clearTimeout(t)
  }, [rewards])

  return (
    <Modal>
      <DialogPanel onClose={onExit} closeLabel="Close and return home" className="text-center overflow-hidden" bodyClassName="pb-3">
          {/* confetti */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden z-0">
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
            title={isDaily ? 'DAILY PAGE SEALED' : rewards?.chapterSealed ? 'CHAPTER SEALED' : 'FOLIO SEALED'}
            subtitle={rewards?.chapterSealed ? chapterDef(rewards.chapterId ?? 1).title : level.name}
            className="mb-3"
          />

          {rewards?.chapterSealed && !isDaily ? (
            <>
              <p className="text-xs italic text-[#7a5c34] mb-2 px-1 leading-relaxed">
                {chapterDef(rewards.chapterId ?? 1).tagline} — a new page opens in the Codex.
              </p>
              {LORE_EXCERPTS[rewards.chapterId ?? 1] ? (
                <blockquote className="goal-card px-3 py-2 mb-3 text-left border-l-4 border-[#d9ae62]">
                  <p className="text-[11px] italic text-[#5d3a1a] leading-relaxed">
                    &ldquo;{LORE_EXCERPTS[rewards.chapterId ?? 1]}&rdquo;
                  </p>
                </blockquote>
              ) : null}
            </>
          ) : null}

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
              ? `+${result.movesLeft * 100} score bonus from ${result.movesLeft} spare move${result.movesLeft === 1 ? '' : 's'}`
              : 'A harmonious balance has been restored.'}
          </p>

          {/* rewards */}
          {rewards && (rewards.lumens > 0 || rewards.lens > 0 || rewards.null > 0) && (
            <div className="mb-4" aria-label="Rewards earned">
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#8a6a3a] font-bold mb-1.5">Rewards</p>
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
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
                {typeof rewards.streak === 'number' && rewards.streak > 0 && (
                  <span className="hud-pill rounded-full px-2.5 py-1 text-xs font-bold flex items-center gap-1">
                    <img src={A('fx-sparkle')} alt="" draggable={false} className="w-3.5 h-3.5 object-contain" />
                    Streak {rewards.streak}
                  </span>
                )}
              </div>
              {rewards.improved === false && (
                <p className="text-[10px] italic text-[#8a6a3a] mt-1.5">A gentle charm for re-visiting — beat your best for full rewards.</p>
              )}
            </div>
          )}
          {isDaily && rewards && rewards.lumens === 0 && (
            <p className="text-xs text-[#8a6a3a] italic mb-3">Already sealed today — the Folio rewards once per day.</p>
          )}

          {rewards?.discoveries && rewards.discoveries.length > 0 && (
            <div className="mb-3 px-1" aria-label="New codex discoveries">
              <p className="text-[9px] uppercase tracking-[0.28em] text-[#8a6a3a] font-bold mb-1.5">Recovered</p>
              <div className="flex flex-col gap-1">
                {rewards.discoveries.slice(0, 3).map((id) => {
                  const item = CODEX_ITEMS.find((c) => c.id === id)
                  if (!item) return null
                  return (
                    <div key={id} className="goal-card px-2.5 py-1.5 flex items-center gap-2 text-left">
                      {item.icon ? (
                        <img src={item.icon} alt="" draggable={false} className="w-7 h-7 object-contain shrink-0" />
                      ) : (
                        <span className="w-7 h-7 rounded-full bg-[#f6e2ae] border border-[#8a5a2b] flex items-center justify-center text-xs font-black text-[#7c4a1e] shrink-0">✦</span>
                      )}
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-[#5d3a1a] leading-tight truncate">{item.name}</p>
                        <p className="text-[10px] italic text-[#7a5c34] leading-tight line-clamp-1">{item.sub}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2.5 max-w-[250px] mx-auto">
            {hasNext ? (
              <WoodButton variant="leaf" onClick={onNext}>Continue</WoodButton>
            ) : (
              <WoodButton variant="leaf" onClick={onExit}>Weave Ever Onward</WoodButton>
            )}
            <div className="flex justify-center gap-2">
              <WoodButton size="sm" onClick={onReplay} className="flex-1">Retry</WoodButton>
              <WoodButton size="sm" onClick={onExit} className="flex-1">Home</WoodButton>
            </div>
          </div>
      </DialogPanel>
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
      <DialogPanel onClose={onExit} closeLabel="Close and return home" className="text-center" bodyClassName="pb-3">
        <RibbonBanner size="sm" title="THE FOLIO SLIPS AWAY" subtitle={level.name} className="mb-3" />
        <div className="cameo w-[112px] h-[98px] mx-auto my-2">
          <img src={A('bunny-rest')} alt="The bunny weaver resting" className="w-[80px] object-contain" draggable={false} />
        </div>
        <p className="text-sm text-[#7c4a1e] font-semibold">
          {isDaily ? 'Tomorrow brings a fresh page…' : `Stage ${stageTitle(level)} keeps its secrets…`}
        </p>
        <p className="text-xs text-[#8a6a3a] italic mt-1 mb-4">
          You scored {score.toLocaleString()} points. Take a breath and try again.
        </p>
        <div className="flex flex-col gap-2.5 max-w-[250px] mx-auto">
          <WoodButton variant="leaf" onClick={onReplay}>Try Again</WoodButton>
          <WoodButton onClick={onExit}>Home</WoodButton>
        </div>
      </DialogPanel>
    </Modal>
  )
}

/* ---------------- How to play ---------------- */

function HowRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('how-row', className)}>{children}</div>
}

function HowText({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('how-text', className)}>{children}</p>
}

function HowDivider() {
  return <div className="ww-divider how-divider" aria-hidden />
}

function HowSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="how-section">
      <p className="how-section-title">{title}</p>
      <div className="how-section-body">{children}</div>
    </section>
  )
}

function HowCard({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('how-card', className)}>
      {title ? <p className="how-card-title">{title}</p> : null}
      {children}
    </div>
  )
}

function SpecialTileDemo({
  type,
  special,
  label,
}: {
  type: 'drop' | 'flame'
  special: 'line' | 'bomb' | 'prism'
  label: string
}) {
  const specialClass =
    special === 'line' ? 'special-lineH' : special === 'bomb' ? 'special-bomb' : ''
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className={cn(
          'relative inline-flex items-center justify-center',
          specialClass,
          special === 'bomb' && 'rounded-full',
          special === 'line' && 'rounded-md',
        )}
      >
        {special === 'prism' ? (
          <img src={A('fx-rainbow')} alt="" draggable={false} className="w-9 h-9 object-contain anim-prism" />
        ) : (
          <img src={TILE_IMG[type]} alt="" draggable={false} className="w-9 h-9 object-contain relative" />
        )}
        {special === 'line' && (
          <img
            src={A('icon-bolt')}
            alt=""
            draggable={false}
            className="absolute w-[42%] h-[42%] object-contain drop-shadow"
          />
        )}
      </span>
      <p className="how-caption">{label}</p>
    </div>
  )
}

export function HowToModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose} overlayClassName="z-[70]">
      <DialogPanel
        onClose={onClose}
        closeLabel="Close how to play"
        scrollable
        className="how-to-panel text-center"
        bodyClassName="how-to-body"
        header={
          <RibbonBanner size="sm" fluid title="HOW TO PLAY" subtitle="The Weaver's little book of charms" />
        }
        footer={
          <WoodButton variant="leaf" onClick={onClose} className="w-full max-w-[220px] mx-auto">
            Got it!
          </WoodButton>
        }
      >
        {/* ——— 1. Basics ——— */}
        <HowSection title="Match Charms">
          <HowRow>
            <BoardTileIcon type="leaf" size="chip" />
            <BoardTileIcon type="leaf" size="chip" />
            <BoardTileIcon type="leaf" size="chip" />
            <span className="text-[#a97b42] font-bold text-lg" aria-hidden>
              →
            </span>
            <span className="how-card px-2 py-1 text-[10px] font-extrabold text-[#5d3a1a]">+pts</span>
          </HowRow>
          <HowText>
            Drag or tap two <b>neighbouring</b> charms to swap them. Line up <b>three or more</b> of the same kind — they
            clear, new charms fall in, and chains can keep going.
          </HowText>
        </HowSection>

        <HowDivider />

        {/* ——— 2. Stage goals ——— */}
        <HowSection title="Stage Goals">
          <div className="how-card-grid">
            <HowCard>
              <div className="how-goal-card-inner">
                <ScoreGoalIcon className="w-10 h-10" />
                <p className="text-[11px] font-bold text-[#5d3a1a]">Reach X pts</p>
                <p className="text-[10px] text-[#7a5c34]">
                  Any charm matches add score. The gold <b>PTS badge</b> means a point target — not a tile to collect.
                </p>
              </div>
            </HowCard>
            <HowCard>
              <div className="how-goal-card-inner">
                <BoardTileIcon type="leaf" size="goal" />
                <p className="text-[11px] font-bold text-[#5d3a1a]">Collect charms</p>
                <p className="text-[10px] text-[#7a5c34]">
                  The goal shows the <b>exact board charm</b> you need. Only cleared tiles of that type count.
                </p>
              </div>
            </HowCard>
          </div>
        </HowSection>

        <HowDivider />

        {/* ——— 3. Play HUD ——— */}
        <HowSection title="On the Board">
          <div className="how-card-grid-3">
            <HowCard className="!px-1.5">
              <div className="hud-pill hud-stat rounded-xl !min-h-0 !py-1 !px-1.5 mx-auto">
                <span className="hud-stat-label !text-[7px]">Moves</span>
                <span className="hud-stat-value font-display !text-base">25</span>
              </div>
              <p className="how-caption">Moves left</p>
            </HowCard>
            <HowCard className="!px-1.5">
              <div className="flex flex-col items-center gap-0.5">
                <ScoreGoalIcon className="w-8 h-8" />
                <div className="w-full h-1.5 rounded-full bg-[#3d2810] overflow-hidden">
                  <div className="h-full w-1/3 bg-gradient-to-r from-[#d9ae62] to-[#ffe9a8]" />
                </div>
              </div>
              <p className="how-caption">Goal card</p>
            </HowCard>
            <HowCard className="!px-1.5">
              <div className="hud-pill hud-stat hud-stat-score rounded-xl !min-h-0 !py-1 !px-1.5 mx-auto">
                <span className="hud-stat-label !text-[7px]">Score</span>
                <span className="hud-stat-value font-display !text-base">240</span>
                <div className="flex gap-px">
                  <StarIcon size={9} lit />
                  <StarIcon size={9} lit={false} />
                  <StarIcon size={9} lit={false} />
                </div>
              </div>
              <p className="how-caption">Score + stars</p>
            </HowCard>
          </div>
          <HowText>
            Beat the <b>goal</b> before <b>moves</b> reach zero. The three stars under Score light up as you pass the goal,
            then hit higher score thresholds for 2★ and 3★.
          </HowText>
        </HowSection>

        <HowDivider />

        {/* ——— 4. Home badges ——— */}
        <HowSection title="Home Screen Badges">
          <HowRow className="gap-3">
            <StarPill amount={12} />
            <LumenPill amount={40} />
          </HowRow>
          <HowText>
            <b>★ Stars</b> — your lifetime total from stage ratings (up to 3 per stage).{' '}
            <b>✦ Lumens</b> — currency earned from stages; spend them at the <b>Relics</b> altar for fortune.
          </HowText>
        </HowSection>

        <HowDivider />

        {/* ——— 5. Special tiles ——— */}
        <HowSection title="Forge Special Charms">
          <div className="how-card-grid-3">
            <SpecialTileDemo type="drop" special="line" label="Match 4 in a row → clears a line" />
            <SpecialTileDemo type="flame" special="bomb" label="L or T shape → ring burst" />
            <SpecialTileDemo type="drop" special="prism" label="Match 5 → Rainbow Prism" />
          </div>
          <HowText>
            <b>Striped</b> charms fire a whole row or column. <b>Burst</b> charms detonate a 3×3 ring.{' '}
            <b>Prism</b> — swap it with any charm to clear <b>every tile of that colour</b> on the board.
          </HowText>
        </HowSection>

        <HowDivider />

        {/* ——— 6. Special combos ——— */}
        <HowSection title="Weave Specials Together">
          <div className="how-card-grid">
            <div className="how-combo-chip">
              <HowRow className="!min-h-0 gap-1">
                <span className="special-lineH inline-flex rounded-md p-0.5">
                  <img src={TILE_IMG.drop} alt="" className="w-6 h-6 object-contain" draggable={false} />
                </span>
                <span className="text-[#a97b42] font-bold text-xs">+</span>
                <span className="special-lineH inline-flex rounded-md p-0.5">
                  <img src={TILE_IMG.flame} alt="" className="w-6 h-6 object-contain" draggable={false} />
                </span>
              </HowRow>
              <span>Cross of Light — row + column</span>
            </div>
            <div className="how-combo-chip">
              <HowRow className="!min-h-0 gap-1">
                <span className="special-bomb inline-flex rounded-full p-0.5">
                  <img src={TILE_IMG.flame} alt="" className="w-6 h-6 object-contain" draggable={false} />
                </span>
                <span className="text-[#a97b42] font-bold text-xs">+</span>
                <span className="special-bomb inline-flex rounded-full p-0.5">
                  <img src={TILE_IMG.drop} alt="" className="w-6 h-6 object-contain" draggable={false} />
                </span>
              </HowRow>
              <span>Twin Bloom — twin blasts</span>
            </div>
            <div className="how-combo-chip">
              <HowRow className="!min-h-0 gap-1">
                <img src={A('fx-rainbow')} alt="" className="w-6 h-6 object-contain" draggable={false} />
                <span className="text-[#a97b42] font-bold text-xs">+</span>
                <span className="special-lineH inline-flex rounded-md p-0.5">
                  <img src={TILE_IMG.leaf} alt="" className="w-6 h-6 object-contain" draggable={false} />
                </span>
              </HowRow>
              <span>Line Storm — colour lines everywhere</span>
            </div>
            <div className="how-combo-chip">
              <HowRow className="!min-h-0 gap-1">
                <img src={A('fx-rainbow')} alt="" className="w-6 h-6 object-contain" draggable={false} />
                <span className="text-[#a97b42] font-bold text-xs">+</span>
                <img src={A('fx-rainbow')} alt="" className="w-6 h-6 object-contain" draggable={false} />
              </HowRow>
              <span>The Loom Unravels — whole board!</span>
            </div>
          </div>
          <HowText>Swap two <b>special</b> charms together for bonus clears and big score bursts.</HowText>
        </HowSection>

        <HowDivider />

        {/* ——— 7. Instruments ——— */}
        <HowSection title="Instruments (Boosters)">
          <div className="how-card-grid">
            <HowCard>
              <div className="flex items-center gap-2.5">
                <span className="booster-btn w-11 h-11 shrink-0 flex items-center justify-center">
                  <img src={BOOSTER_IMG.lens} alt="" draggable={false} className="w-6 h-6 object-contain" />
                </span>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-[#5d3a1a]">Lens</p>
                  <p className="text-[9px] text-[#7a5c34] leading-snug">
                    Instantly makes one valid swap for you. <b>Does not use a move.</b> Limited stock — shown on the badge.
                  </p>
                </div>
              </div>
            </HowCard>
            <HowCard>
              <div className="flex items-center gap-2.5">
                <span className="booster-btn w-11 h-11 shrink-0 flex items-center justify-center">
                  <img src={BOOSTER_IMG.null} alt="" draggable={false} className="w-5 h-5 object-contain" />
                </span>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-[#5d3a1a]">Unweave</p>
                  <p className="text-[9px] text-[#7a5c34] leading-snug">
                    Tap to arm, then tap any charm to remove it. <b>Does not use a move.</b> Charms above will fall in.
                  </p>
                </div>
              </div>
            </HowCard>
          </div>
          <HowText>Earn Lens &amp; Unweave from stage rewards. You start with a few of each.</HowText>
        </HowSection>

        <HowDivider />

        {/* ——— 8. Winning ——— */}
        <HowSection title="Winning a Stage">
          <HowCard>
            <div className="flex items-center justify-center gap-2 mb-2">
              <StarRow count={3} size={22} />
            </div>
            <ul className="how-list">
              <li>
                <b>1★</b> — complete the goal (score target or collect quota).
              </li>
              <li>
                <b>2★ / 3★</b> — reach higher score thresholds shown by the stars under Score.
              </li>
              <li>
                <b>Spare moves</b> convert to bonus points (+100 each) when you win.
              </li>
              <li>
                Rewards include <LumenInline amount={60} className="!text-[10px]" gemClassName="!w-3.5 !h-3.5 !text-[8px]" />{' '}
                Lumens, and sometimes Lens or Unweave.
              </li>
              <li>New charms you clear can appear in the <b>Codex</b> — watch for discovery toasts!</li>
            </ul>
          </HowCard>
        </HowSection>

        <HowDivider />

        <HowText>
          If no valid swaps remain, the board reshuffles automatically. Now go weave some wonder!
        </HowText>
      </DialogPanel>
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
      <BoardTileIcon type={type as TileType} size="chip" />
      <span className={done ? 'text-[#b8e08a]' : ''}>{done ? '✓' : `${Math.min(have, need)}/${need}`}</span>
    </div>
  )
}
