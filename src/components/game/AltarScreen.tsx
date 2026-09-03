'use client'

import * as React from 'react'
import { Search, Hammer } from 'lucide-react'
import { A } from '@/lib/game/assets'
import { sfx } from '@/lib/game/sound'
import { WoodButton, SceneBackdrop, ScreenHeader, LumenPill, LumenInline } from './ui'
import { useVibrate } from './settings'

export type RitualOutcome = { kind: 'lens' | 'null' | 'fortune'; amount: number; firstRitual?: boolean }

const RITUAL_COST = 100
/** Illustrated lumens on the ritual orbit — storybook charms, not emoji-style tiles. */
const ORBIT_LUMENS = [
  { key: 'tile-leaf', label: 'Terra' },
  { key: 'tile-flower', label: 'Ventus' },
  { key: 'tile-gem', label: 'Mercur' },
] as const
const ALTAR_ORBIT_R = 108

/** The Ritual Altar — trade ✦100 Lumens for a woven Relic of fortune. */
export function AltarScreen({
  lumens,
  onPerform,
  onBack,
}: {
  lumens: number
  onPerform: () => RitualOutcome | null
  onBack: () => void
}) {
  const [busy, setBusy] = React.useState(false)
  const [charging, setCharging] = React.useState(false)
  const [result, setResult] = React.useState<RitualOutcome | null>(null)
  const timer = React.useRef<number | null>(null)
  const vibrate = useVibrate()

  React.useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [])

  const canAfford = lumens >= RITUAL_COST
  const disabled = busy || !canAfford || result !== null

  const perform = () => {
    if (disabled) return
    setBusy(true)
    sfx.ritual()
    setCharging(true)
    timer.current = window.setTimeout(() => {
      const outcome = onPerform()
      setCharging(false)
      setBusy(false)
      if (outcome) {
        sfx.reward()
        vibrate(outcome.firstRitual ? 48 : 32)
        setResult(outcome)
      }
    }, 1100)
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#101d13] ww-tap-none">
      <SceneBackdrop
        src={A('bg-altar')}
        tint="#2a1a10"
        opacity={0.3}
        overlayClassName="bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(5,9,5,0.8)_100%)]"
      />

      <ScreenHeader
        title="RITUAL ALTAR"
        subtitle="Combine to Ascend"
        onBack={onBack}
        backLabel="Back"
        right={<LumenPill amount={lumens} />}
      />

      <div className="relative z-10 flex h-full min-h-0 flex-col">
        <main className="flex-1 min-h-0 overflow-y-auto ww-scroll px-4 pt-2 pb-4 flex flex-col items-center justify-center gap-4">
          {/* ritual stage — visible orbit ring + socketed lumens */}
          <div
            className="altar-ritual-stage relative mx-auto shrink-0"
            style={{ width: 272, height: 272, ['--altar-orbit-r' as string]: `${ALTAR_ORBIT_R}px` }}
            aria-hidden
          >
            {/* golden orbit path */}
            <div className="altar-orbit-ring" />
            <div className="altar-orbit-ring altar-orbit-ring-glow" />

            {/* three lumens riding the orbit */}
            {ORBIT_LUMENS.map((lumen, i) => (
              <div
                key={lumen.key}
                className="altar-orbit-arm"
                style={
                  {
                    '--orbit-start': `${i * 120}deg`,
                    '--orbit-delay': `${i * -6.67}s`,
                  } as React.CSSProperties
                }
              >
                <div className="altar-orbit-node">
                  <img src={A(lumen.key)} alt="" draggable={false} className="altar-orbit-lumen" />
                </div>
              </div>
            ))}

            {/* stone pedestal */}
            <div className="altar-pedestal" />

            {/* ritual crystal */}
            <div
              className={`altar-crystal ${charging ? 'altar-crystal-charging' : ''}`}
            >
              <img
                src={A('tile-orb')}
                alt=""
                draggable={false}
                className="anim-breathe w-[5.5rem] h-[5.5rem] object-contain"
              />
            </div>
          </div>

          {result ? (
            /* -------- result card -------- */
            <section className="goal-card p-4 text-center w-full max-w-[360px] anim-modal-in" aria-live="polite">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#8a6a3a]">The Altar Answers</p>
              {result.firstRitual ? (
                <p className="text-[11px] italic text-[#7a5c34] mt-1 leading-snug">
                  Sweetheart stirs in the Codex — devotion has been noticed.
                </p>
              ) : null}
              <div className="mt-2 flex flex-col items-center gap-1.5">
                {result.kind === 'lens' ? (
                  <>
                    <span
                      className="w-12 h-12 rounded-full border-2 border-[#7c4a1e] bg-[radial-gradient(circle_at_35%_30%,#f4dfae,#e0b678_45%,#b97f3e)] flex items-center justify-center text-[#5d3a1a]"
                      aria-hidden
                    >
                      <Search className="w-6 h-6" />
                    </span>
                    <p className="font-display text-xl font-extrabold text-[#5d3a1a] tabular-nums">
                      +{result.amount} LENS
                    </p>
                    <p className="text-sm italic text-[#7a5c34]">see the hidden thread</p>
                  </>
                ) : result.kind === 'null' ? (
                  <>
                    <span
                      className="w-12 h-12 rounded-full border-2 border-[#7c4a1e] bg-[radial-gradient(circle_at_35%_30%,#f4dfae,#e0b678_45%,#b97f3e)] flex items-center justify-center text-[#5d3a1a]"
                      aria-hidden
                    >
                      <Hammer className="w-6 h-6" />
                    </span>
                    <p className="font-display text-xl font-extrabold text-[#5d3a1a] tabular-nums">
                      +{result.amount} NULL
                    </p>
                    <p className="text-sm italic text-[#7a5c34]">unweave any charm</p>
                  </>
                ) : (
                  <>
                    <span className="lumen-gem w-12 h-12 rounded-full flex items-center justify-center text-xl font-black text-white" aria-hidden>
                      ✦
                    </span>
                    <p className="font-display text-xl font-extrabold text-[#5d3a1a] tabular-nums">+{result.amount}</p>
                    <p className="text-sm italic text-[#7a5c34]">the altar smiles upon you</p>
                  </>
                )}
              </div>
              <WoodButton variant="leaf" className="w-full mt-4" onClick={() => setResult(null)}>
                Gather
              </WoodButton>
            </section>
          ) : (
            /* -------- instruction + action -------- */
            <>
              <p className="goal-card p-3 text-sm italic text-[#7a5c34] text-center w-full max-w-[360px] leading-relaxed">
                <span className="inline-flex flex-wrap items-center justify-center gap-x-1 gap-y-1">
                  <span>The altar asks</span>
                  <LumenInline amount={RITUAL_COST} className="not-italic font-bold text-[#5d3a1a]" />
                  <span>. In return it weaves a Relic of fortune.</span>
                </span>
              </p>

              <div className="w-full max-w-[360px]">
                <WoodButton variant="wood" size="lg" className="w-full" disabled={disabled} onClick={perform} ariaLabel={`Perform ritual for ${RITUAL_COST} lumens`}>
                  {busy ? (
                    'Weaving…'
                  ) : (
                    <span className="inline-flex items-center justify-center gap-2">
                      <span>Perform Ritual</span>
                      <LumenInline amount={RITUAL_COST} />
                    </span>
                  )}
                </WoodButton>
                {!canAfford && !busy ? (
                  <p className="text-xs font-semibold text-[#d9ae62] text-center mt-2" role="status">
                    Not enough Lumens
                  </p>
                ) : null}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
