'use client'

import * as React from 'react'
import { Music, Volume2, Vibrate, Sparkles, Wind, Contrast, Languages, ChevronRight, LifeBuoy, ScrollText, Sprout } from 'lucide-react'
import { A } from '@/lib/game/assets'
import { initAudio, sfx } from '@/lib/game/sound'
import { useSettings } from './settings'
import { RibbonBanner, WoodButton, IconButton, ToggleSwitch, StyledSlider, ModalShell, ParchmentPanel } from './ui'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#8a6a3a] mt-4 mb-2">{children}</h3>
}

function RowLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2 font-semibold text-[#5d3a1a] text-sm">
      {icon ? (
        <span className="text-[#5d3a1a] shrink-0" aria-hidden>
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  )
}

/** Instruments — the full settings screen: tune audio, visuals, language & support. */
export function InstrumentsScreen({
  playerName,
  onRename,
  onHowTo,
  onResetAll,
  onBack,
}: {
  playerName: string
  onRename: (n: string) => void
  onHowTo: () => void
  onResetAll: () => void
  onBack: () => void
}) {
  const { settings, update } = useSettings()
  const [name, setName] = React.useState(playerName)
  const [creditsOpen, setCreditsOpen] = React.useState(false)
  const [resetOpen, setResetOpen] = React.useState(false)
  const [resetDone, setResetDone] = React.useState(false)

  React.useEffect(() => setName(playerName), [playerName])

  const saveName = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onRename(trimmed)
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#101d13] ww-tap-none">
      {/* backdrop */}
      <div className="absolute inset-0" aria-hidden>
        <img src={A('bg-arch')} alt="" draggable={false} className="h-full w-full object-cover opacity-15" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(5,9,5,0.75)_100%)]" />
      </div>

      <IconButton img={A('icon-back')} label="Back" onClick={onBack} sound="back" className="absolute top-3 left-3 z-20" />

      <div className="relative z-10 flex h-full min-h-0 flex-col px-3 pt-3 pb-3">
        <header className="pt-1 px-1">
          <RibbonBanner title="INSTRUMENTS" subtitle="Tune Your Experience" size="sm" />
        </header>

        <ParchmentPanel className="flex-1 min-h-0 mt-3">
          <div className="h-full overflow-y-auto ww-scroll p-5">
            {/* ---------------- AUDIO ---------------- */}
            <SectionLabel>Audio</SectionLabel>
            <div className="flex flex-col gap-2">
              <div className="settings-row">
                <RowLabel icon={null}>Music</RowLabel>
                <StyledSlider
                  value={settings.musicVol}
                  onChange={(v) => update({ musicVol: v })}
                  label="Music volume"
                  icon={<Music className="w-5 h-5" />}
                />
              </div>
              <div className="settings-row">
                <RowLabel icon={null}>Sound Effects</RowLabel>
                <StyledSlider
                  value={settings.sfxVol}
                  onChange={(v) => update({ sfxVol: v })}
                  label="Sound effects volume"
                  icon={<Volume2 className="w-5 h-5" />}
                />
              </div>
            </div>

            {/* ---------------- VISUAL ---------------- */}
            <SectionLabel>Visual</SectionLabel>
            <div className="flex flex-col gap-2">
              <div className="settings-row">
                <RowLabel icon={<Vibrate className="w-5 h-5" />}>Vibrations</RowLabel>
                <ToggleSwitch
                  checked={settings.vibrations}
                  onChange={(v) => update({ vibrations: v })}
                  label="Toggle vibrations"
                />
              </div>
              <div className="settings-row">
                <RowLabel icon={<Sparkles className="w-5 h-5" />}>Particles</RowLabel>
                <ToggleSwitch
                  checked={settings.particles}
                  onChange={(v) => update({ particles: v })}
                  label="Toggle particles"
                />
              </div>
              <div className="settings-row">
                <RowLabel icon={<Wind className="w-5 h-5" />}>Reduced Motion</RowLabel>
                <ToggleSwitch
                  checked={settings.reducedMotion}
                  onChange={(v) => update({ reducedMotion: v })}
                  label="Toggle reduced motion"
                />
              </div>
              <div className="settings-row">
                <RowLabel icon={<Contrast className="w-5 h-5" />}>High Contrast</RowLabel>
                <ToggleSwitch
                  checked={settings.highContrast}
                  onChange={(v) => update({ highContrast: v })}
                  label="Toggle high contrast"
                />
              </div>
            </div>

            {/* ---------------- LANGUAGE ---------------- */}
            <SectionLabel>Language</SectionLabel>
            <button
              type="button"
              className="settings-row w-full text-left cursor-pointer"
              aria-label="Language — English"
              onClick={() => {
                initAudio()
                sfx.ui()
              }}
            >
              <RowLabel icon={<Languages className="w-5 h-5" />}>Language</RowLabel>
              <span className="flex items-center gap-1 text-sm font-semibold text-[#5d3a1a]">
                English
                <ChevronRight className="w-4 h-4 text-[#8a6a3a]" aria-hidden />
              </span>
            </button>

            {/* ---------------- SUPPORT ---------------- */}
            <SectionLabel>Support</SectionLabel>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="settings-row w-full text-left cursor-pointer"
                aria-label="How to Play"
                onClick={() => {
                  initAudio()
                  sfx.ui()
                  onHowTo()
                }}
              >
                <RowLabel icon={<LifeBuoy className="w-5 h-5" />}>How to Play</RowLabel>
                <ChevronRight className="w-4 h-4 text-[#8a6a3a]" aria-hidden />
              </button>
              <button
                type="button"
                className="settings-row w-full text-left cursor-pointer"
                aria-label="Credits"
                onClick={() => {
                  initAudio()
                  sfx.ui()
                  setCreditsOpen(true)
                }}
              >
                <RowLabel icon={<ScrollText className="w-5 h-5" />}>Credits</RowLabel>
                <ChevronRight className="w-4 h-4 text-[#8a6a3a]" aria-hidden />
              </button>
            </div>

            {/* ---------------- WEAVER NAME ---------------- */}
            <SectionLabel>Weaver Name</SectionLabel>
            <div className="settings-row">
              <input
                type="text"
                value={name}
                maxLength={18}
                aria-label="Weaver name"
                placeholder="Your name…"
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveName()
                }}
                className="flex-1 min-w-0 rounded-lg border-2 border-[#7c4a1e]/50 bg-[#fffbe8] px-3 py-2 text-[#5d3a1a] font-semibold outline-none focus:border-[#7c4a1e]"
              />
              <WoodButton size="sm" onClick={saveName} disabled={!name.trim()} ariaLabel="Save weaver name">
                Save
              </WoodButton>
            </div>

            {/* ---------------- DATA — reset everything ---------------- */}
            <SectionLabel>Data</SectionLabel>
            <button
              type="button"
              className="settings-row w-full text-left cursor-pointer !border-[#a93a34]/55 !bg-[#fdf3e0]"
              aria-label="Reset all progress — erase stars, lumens, instruments, daily streak and codex"
              onClick={() => {
                initAudio()
                sfx.ui()
                setResetDone(false)
                setResetOpen(true)
              }}
            >
              <span className="flex flex-col gap-0.5">
                <RowLabel icon={<Sprout className="w-5 h-5 text-[#a93a34]" />}>
                  <span className="text-[#8c2f2a]">Reset All Progress</span>
                </RowLabel>
                <span className="text-[10px] text-[#8a6a3a] font-medium pl-7">
                  Stars, lumens, instruments, daily streak &amp; codex — a blank folio.
                </span>
              </span>
              <ChevronRight className="w-4 h-4 text-[#a93a34]" aria-hidden />
            </button>

            <p className="text-[10px] text-[#8a6a3a] text-center mt-6">
              Wonderweave v3.2 — Threads of a Forgotten World
            </p>
          </div>
        </ParchmentPanel>
      </div>

      {/* reset-all confirm modal */}
      {resetOpen && (
        <ModalShell onClose={() => setResetOpen(false)} labelledBy="reset-title">
          <ParchmentPanel className="p-6 text-center">
            <h2 id="reset-title" className="font-display text-2xl font-extrabold text-[#8c2f2a]">
              Begin Anew?
            </h2>
            <hr className="ww-divider my-3" />
            {resetDone ? (
              <>
                <p className="text-sm text-[#5d3a1a] font-semibold">The folio is blank once more.</p>
                <p className="text-xs italic text-[#8a6a3a] mt-1">Every thread waits to be woven again.</p>
              </>
            ) : (
              <>
                <div className="cameo w-[104px] h-[92px] mx-auto my-1" aria-hidden>
                  <img src={A('bunny-rest')} alt="" className="w-[74px] object-contain" draggable={false} />
                </div>
                <p className="text-sm text-[#5d3a1a] font-semibold">This erases your whole journey:</p>
                <p className="text-xs text-[#8a6a3a] mt-1 leading-relaxed">
                  all stars &amp; best scores, lumens, Lens &amp; Null instruments,
                  your daily streak and every codex discovery.
                </p>
                <p className="text-[11px] italic text-[#a93a34] font-semibold mt-2">This cannot be undone.</p>
              </>
            )}
            <div className="flex flex-col gap-2 mt-5">
              {resetDone ? (
                <WoodButton variant="leaf" onClick={() => setResetOpen(false)}>Return</WoodButton>
              ) : (
                <>
                  <WoodButton
                    variant="berry"
                    onClick={() => {
                      onResetAll()
                      setResetDone(true)
                    }}
                  >
                    Yes, Reset Everything
                  </WoodButton>
                  <WoodButton variant="leaf" onClick={() => setResetOpen(false)}>
                    Keep My Journey
                  </WoodButton>
                </>
              )}
            </div>
          </ParchmentPanel>
        </ModalShell>
      )}

      {/* credits modal */}
      {creditsOpen && (
        <ModalShell onClose={() => setCreditsOpen(false)} labelledBy="credits-title">
          <ParchmentPanel className="p-6 text-center">
            <h2 id="credits-title" className="font-display text-2xl font-extrabold text-[#5d3a1a]">
              Credits
            </h2>
            <hr className="ww-divider my-3" />
            <p className="font-display font-bold text-[#5d3a1a]">Wonderweave — Threads of a Forgotten World</p>
            <p className="text-sm italic text-[#7a5c34] mt-2">Art, code &amp; story — the Wonderweave Atelier</p>
            <p className="text-xs italic text-[#8a6a3a] mt-3">Made with threads, dew &amp; starlight</p>
            <WoodButton variant="leaf" className="w-full mt-5" onClick={() => setCreditsOpen(false)}>
              Close
            </WoodButton>
          </ParchmentPanel>
        </ModalShell>
      )}
    </div>
  )
}
