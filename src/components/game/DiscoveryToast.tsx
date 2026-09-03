'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { CODEX_ITEMS, type CodexItem } from '@/lib/game/codex'
import { sfx } from '@/lib/game/sound'
import { useVibrate } from './settings'

const CODEX_BY_ID = new Map(CODEX_ITEMS.map((i) => [i.id, i]))

type Toast = { id: number; item: CodexItem }

/** Live discovery banners — listens for fresh codex unlocks across the app. */
export function DiscoveryToastStack() {
  const [queue, setQueue] = React.useState<Toast[]>([])
  const vibrate = useVibrate()
  const seq = React.useRef(0)

  React.useEffect(() => {
    const onDiscover = (e: Event) => {
      const ids = (e as CustomEvent<string[]>).detail ?? []
      const items = ids.map((id) => CODEX_BY_ID.get(id)).filter((x): x is CodexItem => !!x)
      if (items.length === 0) return
      sfx.discover()
      vibrate(18)
      setQueue((q) => [
        ...q,
        ...items.map((item) => ({ id: ++seq.current, item })),
      ])
    }
    window.addEventListener('ww-codex-discover', onDiscover)
    return () => window.removeEventListener('ww-codex-discover', onDiscover)
  }, [vibrate])

  React.useEffect(() => {
    if (queue.length === 0) return
    const t = setTimeout(() => setQueue((q) => q.slice(1)), 5200)
    return () => clearTimeout(t)
  }, [queue])

  const dismissFront = React.useCallback(() => {
    sfx.select()
    setQueue((q) => q.slice(1))
  }, [])

  if (queue.length === 0) return null
  const { item } = queue[0]

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[70] flex justify-center ww-gutter-x"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={dismissFront}
        className="discovery-toast anim-modal-in pointer-events-auto w-full max-w-[340px] text-left cursor-pointer"
        aria-label={`Dismiss discovery: ${item.name}. ${queue.length > 1 ? `${queue.length - 1} more waiting.` : ''}`}
      >
        <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-[#d9ae62] mb-1">Codex discovery</p>
        <div className="flex items-center gap-3">
          {item.icon ? (
            <img src={item.icon} alt="" draggable={false} className="w-11 h-11 object-contain shrink-0 drop-shadow" />
          ) : (
            <span className="w-11 h-11 rounded-full bg-[#f6e2ae] border-2 border-[#8a5a2b] flex items-center justify-center font-display font-black text-[#7c4a1e] shrink-0">
              ✦
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-display font-extrabold text-[#5d3a1a] text-sm leading-tight truncate">{item.name}</p>
            <p className="text-[11px] italic text-[#7a5c34] leading-snug line-clamp-2">{item.desc}</p>
          </div>
        </div>
        {queue.length > 1 ? (
          <p className={cn('text-[10px] text-[#8a6a3a] mt-1.5 text-right tabular-nums')}>
            +{queue.length - 1} more — tap to reveal
          </p>
        ) : (
          <p className="text-[10px] text-[#8a6a3a]/80 mt-1.5 text-right">Tap to dismiss</p>
        )}
      </button>
    </div>
  )
}
