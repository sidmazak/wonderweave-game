'use client'

import * as React from 'react'
import { Play } from 'lucide-react'
import { A } from '@/lib/game/assets'
import { initAudio, sfx } from '@/lib/game/sound'
import { FallingLeaves, Fireflies, HudPill, IconButton, LumenPill, Twinkles } from './ui'

/**
 * Home — the reference storybook home.
 * Fills the flex-1 area the root provides; the root renders the BottomNav itself.
 * Living-world touches: wobbling logo, swaying tagline, drifting clouds,
 * fireflies + falling leaves, and a tappable mascot that hops.
 */
export function HomeScreen({
  totalStars,
  lumens,
  dailyDone,
  onPlay,
  onInstruments,
  onHowTo,
}: {
  totalStars: number
  lumens: number
  dailyDone: boolean
  onPlay: () => void
  onInstruments: () => void
  onHowTo: () => void
}) {
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
      <div aria-hidden className="absolute inset-0">
        <img
          src={A('bg-castle')}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover anim-ken select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0e1c14]/10 via-transparent to-[#0e1c14]/60" />
        {/* slow clouds for depth */}
        <img
          src={A('deco-cloud-white')}
          alt=""
          draggable={false}
          className="absolute top-[12%] w-24 opacity-30 anim-drift"
          style={{ animationDuration: '95s' }}
        />
        <img
          src={A('deco-cloud-pink')}
          alt=""
          draggable={false}
          className="absolute top-[24%] w-20 opacity-25 anim-drift"
          style={{ animationDuration: '130s', animationDelay: '-60s' }}
        />
        <Twinkles count={10} />
        <Fireflies count={13} />
        <FallingLeaves count={12} />
      </div>

      {/* top bar */}
      <header className="absolute top-3 inset-x-3 z-20 flex items-start justify-between gap-2">
        <HudPill>
          <img src={A('star-sparkle')} alt="" draggable={false} className="w-5 h-5 object-contain shrink-0" />
          <span className="tabular-nums" aria-label={`${totalStars} stars collected`}>{totalStars}</span>
        </HudPill>
        <div className="flex items-center gap-2">
          <LumenPill amount={lumens} />
          <IconButton img={A('icon-gear')} label="Instruments" onClick={onInstruments} />
        </div>
      </header>

      {/* center content — wobbling logo, hero PLAY, secondary actions */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center gap-5 px-6">
        <div className="flex flex-col items-center gap-5 translate-y-3 sm:translate-y-5">
          <img
            src={A('logo')}
            alt="Wonderweave"
            draggable={false}
            className="w-[300px] max-w-[84vw] select-none anim-wobble drop-shadow-[0_10px_24px_rgba(0,0,0,0.55)]"
          />

          {/* hero PLAY — gold-trimmed leaf plaque styled from the game's own art language */}
          <button
            type="button"
            aria-label={dailyDone ? 'Play — continue your journey' : 'Play — continue your journey, the daily folio awaits'}
            onClick={() => {
              initAudio()
              sfx.ui()
              onPlay()
            }}
            className="play-hero anim-ring-pulse w-full max-w-[260px] px-8 py-4 font-display font-bold uppercase tracking-[0.2em] text-xl cursor-pointer select-none inline-flex items-center justify-center gap-2.5 min-h-[56px]"
          >
            <img src={A('star-sparkle')} alt="" aria-hidden draggable={false} className="w-5 h-5 object-contain" />
            Play
            <Play className="w-5 h-5" aria-hidden />
          </button>

          <WoodSecondary onClick={onHowTo} label="How to Play" />
        </div>
      </main>

      {/* mascot — Pip the lantern bunny on his little stone platform; pat him! */}
      <div className="pointer-events-none absolute left-1 bottom-0 z-10 flex flex-col items-center">
        <button
          type="button"
          aria-label="Pip the lantern bunny — say hello"
          onClick={patBunny}
          className="pointer-events-auto relative cursor-pointer select-none"
        >
          <img
            src={A('deco-platform')}
            alt=""
            aria-hidden
            draggable={false}
            className="w-28 sm:w-32 -mb-2 opacity-90 drop-shadow-[0_6px_10px_rgba(0,0,0,0.4)]"
          />
          <img
            src={A('bunny-lantern')}
            alt=""
            draggable={false}
            className={`absolute -top-[74px] left-1/2 -translate-x-1/2 w-[74px] sm:w-[84px] drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)] ${
              hopping ? 'anim-hop' : 'anim-bob'
            }`}
          />
        </button>
      </div>

      {/* a few bold leaves drifting IN FRONT of the scene for storybook depth */}
      <FallingLeaves count={4} className="z-[15]" bold />
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
      className="btn-wood font-display font-bold uppercase tracking-wider text-sm px-6 py-2.5 rounded-xl min-h-[44px] cursor-pointer select-none active:translate-y-[3px]"
    >
      {label}
    </button>
  )
}
