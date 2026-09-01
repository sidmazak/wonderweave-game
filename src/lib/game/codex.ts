'use client'

import * as React from 'react'
import { A } from './assets'
import { CHAPTERS } from './levels'

/**
 * The Codex — recovered knowledge across three tabs.
 * Discoveries persist to localStorage and notify subscribers via a tiny event bus.
 */

export type CodexTab = 'lumens' | 'entities' | 'lore'

export interface CodexItem {
  id: string
  tab: CodexTab
  name: string
  sub: string
  desc: string
  /** asset key or absolute path for the icon */
  icon?: string
  /** how this discovery is unlocked (shown once found) */
  how: string
}

export const LUMEN_ITEMS: CodexItem[] = [
  { id: 'lumen:terra', tab: 'lumens', name: 'TERRA', sub: 'Verdant Leaf', desc: 'Root of Being. The first thread ever woven, patient and green.', icon: A('tile-leaf'), how: 'Collect a Verdant Leaf' },
  { id: 'lumen:aqua', tab: 'lumens', name: 'AQUA', sub: 'Dewdrop', desc: 'Flow of Time. It remembers every river it has been.', icon: A('tile-drop'), how: 'Collect a Dewdrop' },
  { id: 'lumen:ignis', tab: 'lumens', name: 'IGNIS', sub: 'Ember', desc: 'Spark of Life. Small, warm, and stubborn beyond reason.', icon: A('tile-flame'), how: 'Collect an Ember' },
  { id: 'lumen:lux', tab: 'lumens', name: 'LUX', sub: 'Stellar Charm', desc: 'Heart of Light. Fallen starlight, still humming.', icon: A('tile-star'), how: 'Collect a Stellar Charm' },
  { id: 'lumen:ventus', tab: 'lumens', name: 'VENTUS', sub: 'Bloom', desc: 'Breath of Sky. It opens only for the gentlest hands.', icon: A('tile-flower'), how: 'Collect a Bloom' },
  { id: 'lumen:umbra', tab: 'lumens', name: 'UMBRA', sub: 'Sporecap', desc: 'Veil of Night. A mushroom that dreams in the dark.', icon: A('tile-mushroom'), how: 'Collect a Sporecap' },
  { id: 'lumen:mercur', tab: 'lumens', name: 'MERCUR', sub: 'Frost Gem', desc: "Mind's Mirror. Gaze long enough and it gazes back.", icon: A('tile-gem'), how: 'Collect a Frost Gem' },
  { id: 'lumen:ferrum', tab: 'lumens', name: 'FERRUM', sub: 'Woven Orb', desc: 'Heart of Iron. Bound thread that refuses to unravel.', icon: A('tile-orb'), how: 'Collect a Woven Orb' },
  { id: 'lumen:vitriol', tab: 'lumens', name: 'VITRIOL', sub: 'Rainbow Prism', desc: 'Essence Within. Match 5 to bend every colour at once.', icon: A('fx-rainbow'), how: 'Weave a Rainbow Prism' },
]

export const ENTITY_ITEMS: CodexItem[] = [
  { id: 'entity:lantern', tab: 'entities', name: 'Pip Lanternbearer', sub: 'The Guide', desc: 'Carries the first light into every unwritten page.', icon: A('bunny-lantern'), how: 'Begin your journey' },
  { id: 'entity:wizard', tab: 'entities', name: 'Sage Whiskers', sub: 'The Archmage', desc: 'Sealed a hundred Folios; naps through most of them.', icon: A('bunny-wizard'), how: 'Seal your first Folio (win a stage)' },
  { id: 'entity:cheer', tab: 'entities', name: 'Cheerling', sub: 'The Bright', desc: 'Applauds politely after every perfect weave.', icon: A('bunny-cheer'), how: 'Earn 3 stars on any stage' },
  { id: 'entity:heart', tab: 'entities', name: 'Sweetheart', sub: 'The Devoted', desc: 'Believes every thread is a love letter to the world.', icon: A('bunny-heart'), how: 'Perform a Ritual at the Altar' },
  { id: 'entity:pack', tab: 'entities', name: 'Wanderer', sub: 'The Traveler', desc: 'Packed twice for this journey. Both times forgot the map.', icon: A('bunny-pack'), how: 'Complete a Daily Folio' },
  { id: 'entity:rest', tab: 'entities', name: 'Dreamer', sub: 'The Sleepy', desc: 'The threads wait patiently, and so does Dreamer.', icon: A('bunny-rest'), how: 'Pause a stage' },
  { id: 'entity:walk', tab: 'entities', name: 'Pathfinder', sub: 'The Brave', desc: 'Walked the Whispering Woods end to end. Twice.', icon: A('bunny-walk'), how: 'Complete Chapter I' },
]

export const LORE_ITEMS: CodexItem[] = CHAPTERS.map((ch) => ({
  id: `lore:${ch.id}`,
  tab: 'lore' as const,
  name: `${ch.numeral}. ${ch.title}`,
  sub: `Chapter ${ch.numeral}`,
  desc: ch.tagline,
  how: 'Unlock this chapter',
}))

export const CODEX_ITEMS: CodexItem[] = [...LUMEN_ITEMS, ...ENTITY_ITEMS, ...LORE_ITEMS]
export const CODEX_TOTAL = CODEX_ITEMS.length

/** Tile type → codex lumen id (latin names). */
export const LUMEN_ID_BY_TYPE: Record<string, string> = {
  leaf: 'lumen:terra',
  drop: 'lumen:aqua',
  flame: 'lumen:ignis',
  star: 'lumen:lux',
  flower: 'lumen:ventus',
  mushroom: 'lumen:umbra',
  gem: 'lumen:mercur',
  orb: 'lumen:ferrum',
}

const LS_KEY = 'ww-codex'
const EVENT = 'ww-codex-change'

const VALID_IDS = new Set(CODEX_ITEMS.map((i) => i.id))

function read(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]')
    return Array.isArray(raw) ? raw.filter((x) => typeof x === 'string' && VALID_IDS.has(x)) : []
  } catch {
    return []
  }
}

/** Record discoveries; returns the ids that were actually new. */
export function discover(...ids: string[]): string[] {
  if (typeof window === 'undefined') return []
  const have = new Set(read())
  const fresh = ids.filter((id) => !have.has(id))
  if (fresh.length === 0) return []
  const next = [...read(), ...fresh]
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next))
  } catch {
    /* storage full — ignore */
  }
  window.dispatchEvent(new CustomEvent(EVENT))
  return fresh
}

/** React hook — live discovery set + stats. */
export function useCodex(): { found: Set<string>; count: number; total: number } {
  const [found, setFound] = React.useState<Set<string>>(new Set())
  React.useEffect(() => {
    const refresh = () => setFound(new Set(read()))
    refresh()
    window.addEventListener(EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])
  return { found, count: found.size, total: CODEX_TOTAL }
}
