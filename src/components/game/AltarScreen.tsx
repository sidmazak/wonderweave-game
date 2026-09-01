'use client'

import * as React from 'react'
import { Search, Hammer } from 'lucide-react'
import { A } from '@/lib/game/assets'
import { sfx } from '@/lib/game/sound'
import { RibbonBanner, WoodButton, IconButton, LumenPill } from './ui'

export type RitualOutcome = { kind: 'lens' | 'null' | 'fortune'; amount: number }

const RITUAL_COST = 100
const ORBIT_KEYS = ['tile-star', 'tile-flame', 'tile-drop'] as const

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
      if (outcome) setResult(outcome)
    }, 1100)
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#101d13] ww-tap-none">
      {/* backdrop */}
      <div className="absolute inset-0" aria-hidden>
        <img src={A('bg-altar')} alt="" draggable={false} className="h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(5,9,5,0.8)_100%)]" />
      </div>

      <IconButton img={A('icon-back')} label="Back" onClick={onBack} className="absolute top-3 left-3 z-20" />
      <LumenPill amount={lumens} className="absolute top-3 right-3 z-20" />

      <div className="relative z-10 flex h-full min-h-0 flex-col">
        <header className="pt-4 px-4">
          <RibbonBanner title="RITUAL ALTAR" subtitle="Combine to Ascend" />
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto ww-scroll px-4 pt-2 pb-4 flex flex-col items-center justify-center gap-4">
          {/* pedestal + orbiting lumens */}
          <div className="relative h-[220px] w-[220px] mx-auto shrink-0" aria-hidden>
            {ORBIT_KEYS.map((key, i) => (
              <div
                key={key}
                className="anim-orbit absolute inset-0 pointer-events-none"
                style={{ '--orbit-r': '86px', animationDelay: `${i * -4}s` } as React.CSSProperties}
              >
                <img
                  src={A(key)}
                  alt=""
                  draggable={false}
                  className="absolute left-1/2 top-1/2 w-8 h-8 object-contain -translate-x-1/2 -translate-y-1/2"
                />
              </div>
            ))}

            {/* stone pedestal */}
            <div
              className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[#7c4a1e]/70 bg-[radial-gradient(circle_at_38%_30%,#efe0b8,#cdb383_55%,#8f7346)] shadow-[inset_0_-10px_18px_rgba(90,60,20,0.45),inset_0_4px_8px_rgba(255,255,255,0.5),0_12px_26px_rgba(0,0,0,0.55)]"
            />

            {/* ritual crystal */}
            <div
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-500 ${
                charging ? 'scale-125' : 'scale-100'
              }`}
            >
              <span className={charging ? 'block anim-glow-pulse' : 'block'}>
                <img
                  src={A('tile-orb')}
                  alt=""
                  draggable={false}
                  className="anim-breathe w-24 h-24 object-contain"
                  style={{ filter: 'drop-shadow(0 0 16px rgba(176,108,232,0.6))' }}
                />
              </span>
            </div>
          </div>

          {result ? (
            /* -------- result card -------- */
            <section className="goal-card p-4 text-center w-full max-w-[360px] anim-modal-in" aria-live="polite">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#8a6a3a]">The Altar Answers</p>
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
              <p className="goal-card p-3 text-sm italic text-[#7a5c34] text-center w-full max-w-[360px]">
                The altar asks{' '}
                <span className="lumen-gem inline-flex w-5 h-5 rounded-full items-center justify-center align-[-3px] text-[10px] font-black text-white not-italic" aria-hidden>
                  ✦
                </span>
                <span className="not-italic font-bold text-[#5d3a1a] tabular-nums">{RITUAL_COST}</span>. In return it weaves a Relic of fortune.
              </p>

              <div className="w-full max-w-[360px]">
                <WoodButton variant="wood" size="lg" className="w-full" disabled={disabled} onClick={perform} ariaLabel={`Perform ritual for ${RITUAL_COST} lumens`}>
                  {busy ? (
                    'Weaving…'
                  ) : (
                    <>
                      Perform Ritual{' '}
                      <span className="lumen-gem inline-flex w-5 h-5 rounded-full items-center justify-center align-[-2px] text-[10px] font-black text-white mx-0.5" aria-hidden>
                        ✦
                      </span>
                      {RITUAL_COST}
                    </>
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
