'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { A } from '@/lib/game/assets'
import { useCodex, LUMEN_ITEMS, ENTITY_ITEMS, LORE_ITEMS } from '@/lib/game/codex'
import type { CodexItem, CodexTab } from '@/lib/game/codex'
import { initAudio, sfx } from '@/lib/game/sound'
import { RibbonBanner, WoodTabs, WoodButton, IconButton, ModalShell, ParchmentPanel } from './ui'

/* ---------------- shared bits ---------------- */

const TABS: { id: CodexTab; label: string }[] = [
  { id: 'lumens', label: 'Lumens' },
  { id: 'entities', label: 'Entities' },
  { id: 'lore', label: 'Lore' },
]

/** Warm storybook backdrop: deep forest base + faint arch art + vignette. */
function StorybookBackdrop({ img, opacity = 0.25 }: { img: string; opacity?: number }) {
  return (
    <div className="absolute inset-0" aria-hidden>
      <img src={img} alt="" draggable={false} className="h-full w-full object-cover" style={{ opacity }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(5,9,5,0.78)_100%)]" />
    </div>
  )
}

/* ---------------- card grids ---------------- */

function LumenGrid({
  items,
  found,
  shakeId,
  onTap,
}: {
  items: CodexItem[]
  found: Set<string>
  shakeId: string | null
  onTap: (item: CodexItem) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => {
        const isFound = found.has(item.id)
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onTap(item)}
            aria-label={isFound ? `${item.name} — ${item.sub}` : `${item.name} — undiscovered`}
            className={cn(
              'codex-card p-2 flex flex-col items-center gap-1.5 cursor-pointer',
              !isFound && 'codex-card-locked',
              shakeId === item.id && 'anim-shake',
            )}
          >
            <span className="codex-icon-cell w-full aspect-square flex items-center justify-center overflow-hidden">
              {isFound ? (
                <img src={item.icon ?? ''} alt="" draggable={false} className="w-10 h-10 object-contain" />
              ) : (
                <span className="font-display text-3xl font-black text-[#f3e6c2]/90 select-none" aria-hidden>
                  ?
                </span>
              )}
            </span>
            <span className="text-[11px] font-display font-extrabold tracking-wider text-[#8a5a2b] text-center leading-tight">
              {item.name}
            </span>
            {isFound ? (
              <span className="text-[10px] italic text-[#7a5c34] text-center leading-tight">{item.sub}</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

function EntityGrid({
  items,
  found,
  shakeId,
  onTap,
}: {
  items: CodexItem[]
  found: Set<string>
  shakeId: string | null
  onTap: (item: CodexItem) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {items.map((item) => {
        const isFound = found.has(item.id)
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onTap(item)}
            aria-label={isFound ? `${item.name} — ${item.sub}` : `${item.name} — undiscovered`}
            className={cn(
              'codex-card p-3 flex flex-col items-center gap-2 cursor-pointer',
              !isFound && 'codex-card-locked',
              shakeId === item.id && 'anim-shake',
            )}
          >
            <span className="codex-icon-cell w-full aspect-square flex items-center justify-center overflow-hidden">
              {isFound ? (
                <img src={item.icon ?? ''} alt="" draggable={false} className="w-14 h-14 object-contain" />
              ) : (
                <span className="font-display text-4xl font-black text-[#f3e6c2]/90 select-none" aria-hidden>
                  ?
                </span>
              )}
            </span>
            <span className="text-xs font-display font-extrabold tracking-wide text-[#8a5a2b] text-center leading-tight">
              {item.name}
            </span>
            {isFound ? (
              <span className="text-[11px] italic text-[#7a5c34] text-center leading-tight">{item.sub}</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

/** Split "I. The Whispering Woods" into numeral + title. */
function splitLoreName(name: string): { numeral: string; title: string } {
  const idx = name.indexOf('. ')
  if (idx > 0) return { numeral: name.slice(0, idx), title: name.slice(idx + 2) }
  return { numeral: '?', title: name }
}

/** Warm natural storybook hues — one accent per chapter medallion. */
const LORE_HUES = [
  '#5f8f3e', '#3f7d6a', '#b0722c', '#a93a34', '#8a5aa0', '#c2912e',
  '#4e8a5a', '#a0522d', '#6a7d3a', '#b5486a', '#2f7d68', '#8a6a2a',
]

function LoreList({
  items,
  found,
  shakeId,
  onTap,
}: {
  items: CodexItem[]
  found: Set<string>
  shakeId: string | null
  onTap: (item: CodexItem) => void
}) {
  return (
    <div className="flex flex-col gap-2.5" role="list" aria-label="Recovered lore chapters">
      {items.map((item, i) => {
        const isFound = found.has(item.id)
        const { numeral, title } = splitLoreName(item.name)
        const hue = LORE_HUES[i % LORE_HUES.length]
        return (
          <button
            key={item.id}
            type="button"
            role="listitem"
            onClick={() => onTap(item)}
            aria-label={isFound ? `Chapter ${numeral} — ${title}. ${item.desc}` : `Undiscovered chapter ${numeral}`}
            className={cn(
              'codex-card lore-card px-3 py-3 text-left cursor-pointer anim-rise-in active:scale-[0.985] flex items-center gap-3',
              !isFound && 'lore-card-locked',
              shakeId === item.id && 'anim-shake',
            )}
            style={{ animationDelay: `${Math.min(i * 55, 500)}ms` }}
          >
            {/* chapter medallion — colour carries the vibrance */}
            <span
              className={cn(
                'lore-medal w-12 h-12 shrink-0 flex items-center justify-center font-display text-xl font-black',
                !isFound && 'lore-medal-locked',
              )}
              aria-hidden
              style={
                isFound
                  ? { background: `linear-gradient(160deg, ${hue} 0%, ${hue}cc 55%, #00000030 130%), linear-gradient(180deg, #fff6dd, #f0e2b8)`, color: '#fff9e8', boxShadow: `inset 0 2px 3px rgba(255,255,240,0.55), inset 0 -3px 5px rgba(60,30,10,0.35), 0 3px 7px rgba(40,22,8,0.35), 0 0 0 2.5px #c9a04e` }
                  : undefined
              }
            >
              {isFound ? numeral : <img src={A('medallion-lock')} alt="" draggable={false} className="w-6 h-6 object-contain opacity-80" />}
            </span>

            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-1.5">
                {/* colour ribbon stub for found chapters */}
                {isFound && <span className="w-1.5 h-4 rounded-full shrink-0" style={{ background: hue }} aria-hidden />}
                <span className={cn('block font-display font-extrabold text-[15px] leading-snug truncate', isFound ? 'text-[#5d3a1a]' : 'text-[#8a7454]')}>
                  {isFound ? title : 'A chapter yet unwoven…'}
                </span>
              </span>
              {isFound ? (
                <span className="block text-xs italic text-[#7a5c34] leading-snug mt-1 line-clamp-2">{item.desc}</span>
              ) : (
                <span className="block text-xs italic text-[#9a8462] leading-snug mt-1">Seal the chapters before it to reveal this page</span>
              )}
            </span>

            <span
              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
              style={
                isFound
                  ? { background: `linear-gradient(180deg, #ffe9a8, #e8b84d)`, boxShadow: 'inset 0 1px 0 rgba(255,255,240,0.8), 0 2px 4px rgba(90,50,15,0.35)' }
                  : { background: 'rgba(138,116,84,0.18)' }
              }
              aria-hidden
            >
              <svg viewBox="0 0 24 24" className={cn('w-4 h-4', isFound ? 'text-[#6a4520]' : 'text-[#9a8462]')} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 5 7 7-7 7" />
              </svg>
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ---------------- screen ---------------- */

export function CodexScreen({ onBack }: { onBack: () => void }) {
  const { found, count, total } = useCodex()
  const [tab, setTab] = React.useState<CodexTab>('lumens')
  const [detail, setDetail] = React.useState<CodexItem | null>(null)
  const [shakeId, setShakeId] = React.useState<string | null>(null)
  const shakeTimer = React.useRef<number | null>(null)

  React.useEffect(() => {
    return () => {
      if (shakeTimer.current !== null) window.clearTimeout(shakeTimer.current)
    }
  }, [])

  const handleTap = (item: CodexItem) => {
    initAudio()
    if (found.has(item.id)) {
      sfx.select()
      setDetail(item)
    } else {
      // mystery card — nudge it and move on
      sfx.ui()
      setShakeId(item.id)
      if (shakeTimer.current !== null) window.clearTimeout(shakeTimer.current)
      shakeTimer.current = window.setTimeout(() => setShakeId(null), 450)
    }
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#101d13] ww-tap-none">
      <StorybookBackdrop img={A('bg-arch')} />

      <IconButton img={A('icon-back')} label="Back" onClick={onBack} sound="back" className="absolute top-3 left-3 z-20" />

      <div className="relative z-10 flex h-full min-h-0 flex-col">
        <header className="pt-4 px-4">
          <RibbonBanner title="CODEX" subtitle="Recovered Knowledge" />
        </header>

        <div className="px-4 mt-3">
          <WoodTabs tabs={TABS} active={tab} onChange={setTab} className="w-full" />
        </div>

        <main className="flex-1 min-h-0 overflow-y-auto ww-scroll px-4 pt-3 pb-2">
          {tab === 'lumens' && (
            <>
              <p className="text-center text-[11px] italic text-[#d9c79a]/80 mb-3" aria-hidden>
                Every charm holds a name — gather them to learn it.
              </p>
              <div role="tabpanel" aria-label="Lumens collection">
                <LumenGrid items={LUMEN_ITEMS} found={found} shakeId={shakeId} onTap={handleTap} />
              </div>
            </>
          )}
          {tab === 'entities' && (
            <>
              <p className="text-center text-[11px] italic text-[#d9c79a]/80 mb-3" aria-hidden>
                The isles are never truly empty…
              </p>
              <div role="tabpanel" aria-label="Entities collection">
                <EntityGrid items={ENTITY_ITEMS} found={found} shakeId={shakeId} onTap={handleTap} />
              </div>
            </>
          )}
          {tab === 'lore' && (
            <div role="tabpanel" aria-label="Recovered lore">
              <LoreList items={LORE_ITEMS} found={found} shakeId={shakeId} onTap={handleTap} />
            </div>
          )}

          <footer className="mt-5 mb-2 text-center">
            <p className="font-display text-sm font-bold text-[#d9ae62] tracking-wider" aria-live="polite">
              <span className="ww-ornament">✦</span> {count} / {total} Discovered <span className="ww-ornament">✦</span>
            </p>
          </footer>
        </main>
      </div>

      {/* found-card detail */}
      {detail && (
        <ModalShell onClose={() => setDetail(null)} labelledBy="codex-detail-title">
          <ParchmentPanel className="p-6 text-center">
            {detail.icon ? (
              <span className="codex-icon-cell w-20 h-20 mx-auto flex items-center justify-center mb-3">
                <img src={detail.icon} alt="" draggable={false} className="w-14 h-14 object-contain" />
              </span>
            ) : (
              <span
                className="w-20 h-20 mx-auto mb-3 rounded-xl flex items-center justify-center font-display text-3xl font-black text-[#a9721f]"
                aria-hidden
              >
                {splitLoreName(detail.name).numeral}
              </span>
            )}
            <h3 id="codex-detail-title" className="font-display text-2xl font-extrabold text-[#5d3a1a] tracking-wide">
              {detail.tab === 'lore' ? splitLoreName(detail.name).title : detail.name}
            </h3>
            <p className="text-sm italic text-[#7a5c34] mt-0.5">{detail.sub}</p>
            <hr className="ww-divider my-3" />
            <p className="text-sm text-[#5d3a1a] leading-relaxed">{detail.desc}</p>
            <p className="text-xs text-[#7a5c34] mt-3">
              <span className="font-bold uppercase tracking-wider text-[#8a6a3a]">How: </span>
              {detail.how}
            </p>
            <WoodButton variant="leaf" className="w-full mt-4" onClick={() => setDetail(null)}>
              Close
            </WoodButton>
          </ParchmentPanel>
        </ModalShell>
      )}
    </div>
  )
}
