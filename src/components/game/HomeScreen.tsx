'use client'

import * as React from 'react'
import { Play } from 'lucide-react'
import { A } from '@/lib/game/assets'
import { initAudio, sfx } from '@/lib/game/sound'
import { FallingLeaves, Fireflies, IconButton, LanternFireflies, LumenPill, PlayButtonFireflies, SceneBackdrop, StagePill, StarPill, Twinkles } from './ui'
import { chapterOf, stagePillLabel } from '@/lib/game/levels'

/**
 * Home — the reference storybook home.
 * Fills the flex-1 area the root provides; the root renders the BottomNav itself.
 * Living-world touches: wobbling logo, swaying tagline, drifting clouds,
 * fireflies + falling leaves, and a tappable mascot that hops.
 */
export function HomeScreen({
  totalStars,
  lumens,
  highestUnlocked,
  dailyDone,
  onPlay,
  onOpenChapter,
  onInstruments,
  onHowTo,
}: {
  totalStars: number
  lumens: number
  highestUnlocked: number
  dailyDone: boolean
  onPlay: () => void
  onOpenChapter: () => void
  onInstruments: () => void
  onHowTo: () => void
}) {
  const ch = chapterOf(highestUnlocked)
  const stageLabel = stagePillLabel(highestUnlocked)
  const [hopping, setHopping] = React.useState(false)
  const hopTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => () => {
    if (hopTimer.current) clearTimeout(hopTimer.current)
  }, [])

  const patBunny = () => {
    initAudio()
    sfx.select()
    setHopping(false)
    // restart the animation even on rapid taps
    requestAnimationFrame(() => setHopping(true))
    if (hopTimer.current) clearTimeout(hopTimer.current)
    hopTimer.current = setTimeout(() => setHopping(false), 700)
  }

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden">
      {/* full-bleed storybook scene */}
      <div aria-hidden className="absolute inset-0 z-0">
        <SceneBackdrop
          src={A('bg-castle')}
          tint="#1a2838"
          imgClassName="anim-ken"
          overlayClassName="bg-gradient-to-b from-[#0e1c14]/10 via-transparent to-[#0e1c14]/60"
        />
        {/* slow clouds for depth */}
        <img
          src={A('deco-cloud-white')}
          alt=""
          draggable={false}
          className="absolute top-[10%] w-[clamp(5rem,22vw,7rem)] opacity-35 anim-drift"
          style={{ animationDuration: '95s' }}
        />
        <img
          src={A('deco-cloud-pink')}
          alt=""
          draggable={false}
          className="absolute top-[20%] w-[clamp(4rem,18vw,6rem)] opacity-30 anim-drift"
          style={{ animationDuration: '130s', animationDelay: '-60s' }}
        />
        <Twinkles count={10} />
        <Fireflies count={6} className="ww-fireflies-layer" />
      </div>

      {/* back depth — drifts behind logo & play */}
      <FallingLeaves count={6} subtle layer="back" />

      {/* top bar — stage on the left; stars + lumens + settings grouped on the right */}
      <header className="absolute inset-x-0 ww-gutter-x ww-gutter-t z-20 flex items-center justify-between gap-3">
        <StagePill stageLabel={stageLabel} chapterBg={ch.bg} onClick={onOpenChapter} />
        <div className="flex items-center gap-2.5 shrink-0">
          <StarPill amount={totalStars} className="shrink-0" />
          <LumenPill amount={lumens} />
          <IconButton img={A('icon-gear')} label="Instruments" onClick={onInstruments} />
        </div>
      </header>

      {/* center content — logo sits in the living scene; CTAs float above all particles */}
      <main className="relative z-[18] flex-1 flex flex-col items-center justify-center gap-6 ww-gutter-x">
        <div className="flex flex-col items-center gap-6 translate-y-2 sm:translate-y-4">
          <img
            src={A('logo')}
            alt="Wonderweave"
            draggable={false}
            className="home-logo select-none anim-wobble drop-shadow-[0_10px_24px_rgba(0,0,0,0.55)]"
          />

          {/* hero PLAY — fireflies orbit behind; button pops toward the player */}
          <div className="play-btn-wrap relative inline-flex items-center justify-center mt-1">
            <PlayButtonFireflies />
            <button
              type="button"
              aria-label={dailyDone ? 'Play — continue your journey' : 'Play — continue your journey, the daily folio awaits'}
              onClick={() => {
                initAudio()
                sfx.ui()
                onPlay()
              }}
              className="play-btn-hero anim-play-forward relative z-10"
            >
              Play
              <Play className="w-4 h-4 shrink-0 fill-[#a2372c] stroke-none" aria-hidden />
            </button>
          </div>

          <WoodSecondary onClick={onHowTo} label="How to Play" />
        </div>
      </main>

      {/* mid depth — floats over hero UI */}
      <FallingLeaves count={5} subtle layer="front" />

      {/* mascot — Pip the lantern bunny on his little stone platform; pat him! */}
      <div className="pointer-events-none absolute left-0 ww-gutter-x bottom-0 z-[12] flex flex-col items-start home-mascot-wrap">
        <button
          type="button"
          aria-label="Pip the lantern bunny — say hello"
          onClick={patBunny}
          className="pointer-events-auto relative cursor-pointer select-none"
        >
          <LanternFireflies count={5} />
          <img
            src={A('deco-platform')}
            alt=""
            aria-hidden
            draggable={false}
            className="home-mascot-platform relative -mb-2 opacity-90 drop-shadow-[0_6px_10px_rgba(0,0,0,0.4)]"
          />
          <div className="absolute -top-[74px] left-1/2 -translate-x-1/2 home-mascot-bunny anim-mascot-sway">
            <div className={hopping ? 'anim-hop' : 'anim-bob-subtle'}>
              <img
                src={A('bunny-lantern')}
                alt=""
                draggable={false}
                className="w-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)] anim-glow-pulse-subtle"
              />
              <span className="lantern-sparkle w-2.5 h-2.5 top-[14%] left-[56%] anim-twinkle" style={{ animationDelay: '0.4s' }} aria-hidden />
              <span className="lantern-sparkle w-2 h-2 top-[28%] left-[68%] anim-twinkle" style={{ animationDelay: '1.2s' }} aria-hidden />
              <span className="lantern-sparkle w-1.5 h-1.5 top-[20%] left-[48%] anim-twinkle" style={{ animationDelay: '2.1s' }} aria-hidden />
            </div>
          </div>
        </button>
      </div>

      {/* front depth — occasional leaves drift past Pip, under the top bar */}
      <FallingLeaves count={3} subtle layer="over" />
    </div>
  )
}

/** Small wooden secondary action (keeps the hero visually dominant). */
function WoodSecondary({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        initAudio()
        sfx.ui()
        onClick()
      }}
      className="btn-wood font-display font-bold uppercase tracking-wider text-sm px-6 py-2.5 rounded-xl min-h-[44px] cursor-pointer select-none active:translate-y-[3px] anim-wobble-subtle"
      style={{ animationDelay: '-2.4s' }}
    >
      {label}
    </button>
  )
}
