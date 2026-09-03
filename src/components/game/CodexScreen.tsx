'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { A } from '@/lib/game/assets'
import { CHAPTERS } from '@/lib/game/levels'
import type { CodexItem, CodexTab } from '@/lib/game/codex'
import { useCodex, LUMEN_ITEMS, ENTITY_ITEMS, LORE_ITEMS } from '@/lib/game/codex'
import { initAudio, sfx } from '@/lib/game/sound'
import { WoodTabs, WoodButton, SceneBackdrop, ScreenHeader, ModalShell, DialogPanel } from './ui'

/* ---------------- shared bits ---------------- */

const TABS: { id: CodexTab; label: string }[] = [
  { id: 'lumens', label: 'Lumens' },
  { id: 'entities', label: 'Entities' },
  { id: 'lore', label: 'Lore' },
]

/** Warm storybook backdrop: deep forest base + faint arch art + vignette. */
function StorybookBackdrop({ img, opacity = 0.25 }: { img: string; opacity?: number }) {
  return (
    <SceneBackdrop
      src={img}
      tint="#1e2848"
      opacity={opacity}
      overlayClassName="bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(5,9,5,0.78)_100%)]"
    />
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

/** Chapter id from a lore codex entry (`lore:3` → 3). */
function loreChapterId(item: CodexItem): number {
  const n = parseInt(item.id.replace('lore:', ''), 10)
  return Number.isFinite(n) ? n : 1
}

/** Small deco accent per chapter — sits on the scene vignette. */
const LORE_DECO: Record<number, string> = {
  1: 'deco-island',
  2: 'deco-tree',
  3: 'deco-moon',
  4: 'deco-waterfall',
  5: 'deco-arch',
  6: 'deco-cloud-white',
  7: 'deco-lamp',
  8: 'deco-mushrooms',
  9: 'deco-sign',
  10: 'deco-cloud-pink',
  11: 'deco-butterfly',
  12: 'deco-platform',
}

function LoreSceneThumb({ chapterId, numeral, found }: { chapterId: number; numeral: string; found: boolean }) {
  const ch = CHAPTERS[chapterId - 1]
  const bg = ch ? A(ch.bg) : A('bg-map')
  const deco = LORE_DECO[chapterId]
  return (
    <span className={cn('lore-scene-thumb shrink-0', !found && 'lore-scene-thumb-locked')} aria-hidden>
      <img src={bg} alt="" draggable={false} className="lore-scene-img" />
      {deco ? (
        <img src={A(deco)} alt="" draggable={false} className="lore-scene-deco" />
      ) : null}
      <span className="lore-scene-vignette" />
      {found ? (
        <span className="lore-scene-badge">{numeral}</span>
      ) : (
        <span className="lore-scene-lock">
          <img src={A('medallion-lock')} alt="" draggable={false} className="w-7 h-7 object-contain opacity-90 drop-shadow" />
        </span>
      )}
    </span>
  )
}

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
        const chapterId = loreChapterId(item)
        const tagline = CHAPTERS[chapterId - 1]?.tagline ?? item.sub
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
            <LoreSceneThumb chapterId={chapterId} numeral={numeral} found={isFound} />

            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-1.5 min-w-0">
                {isFound ? (
                  <span className="lore-chapter-pill shrink-0">{numeral}</span>
                ) : null}
                <span className={cn('block font-display font-extrabold text-[15px] leading-snug truncate', isFound ? 'text-[#5d3a1a]' : 'text-[#8a7454]')}>
                  {isFound ? title : 'A chapter yet unwoven…'}
                </span>
              </span>
              {isFound ? (
                <>
                  <span className="block text-[10px] uppercase tracking-[0.14em] text-[#8a6a3a] font-bold mt-0.5 truncate">{tagline}</span>
                  <span className="block text-xs italic text-[#7a5c34] leading-snug mt-1 line-clamp-2">{item.desc}</span>
                </>
              ) : (
                <span className="block text-xs italic text-[#9a8462] leading-snug mt-1">Seal every stage in this chapter to recover its lore</span>
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

      <ScreenHeader title="CODEX" subtitle="Recovered Knowledge" onBack={onBack} backLabel="Back" />

      <div className="relative z-10 flex h-full min-h-0 flex-col">
        <div className="px-4 pt-1">
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
            <>
              <p className="text-center text-[11px] italic text-[#d9c79a]/80 mb-3" aria-hidden>
                Each sealed chapter leaves a thread of memory in the Folio…
              </p>
              <div role="tabpanel" aria-label="Recovered lore">
                <LoreList items={LORE_ITEMS} found={found} shakeId={shakeId} onTap={handleTap} />
              </div>
            </>
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
          <DialogPanel
            onClose={() => setDetail(null)}
            closeLabel="Close codex detail"
            className="text-center"
            bodyClassName="pb-1"
            footer={
              <WoodButton variant="leaf" className="w-full mb-1" onClick={() => setDetail(null)}>
                Close
              </WoodButton>
            }
          >
            {detail.tab === 'lore' ? (
              <div className="lore-detail-scene mx-auto mb-3">
                <img
                  src={detail.icon ?? A(CHAPTERS[loreChapterId(detail) - 1]?.bg ?? 'bg-map')}
                  alt=""
                  draggable={false}
                  className="lore-detail-scene-img"
                />
                {LORE_DECO[loreChapterId(detail)] ? (
                  <img
                    src={A(LORE_DECO[loreChapterId(detail)]!)}
                    alt=""
                    draggable={false}
                    className="lore-detail-scene-deco"
                  />
                ) : null}
                <span className="lore-detail-scene-vignette" />
                <span className="lore-detail-scene-badge">{splitLoreName(detail.name).numeral}</span>
              </div>
            ) : detail.icon ? (
              <span className="codex-icon-cell w-20 h-20 mx-auto flex items-center justify-center mb-3">
                <img src={detail.icon} alt="" draggable={false} className="w-14 h-14 object-contain" />
              </span>
            ) : null}
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
          </DialogPanel>
        </ModalShell>
      )}
    </div>
  )
}
