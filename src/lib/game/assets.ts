import type { Special, TileType } from './types'

export const A = (name: string): string => `/game/assets/${name}.png`

export const TILE_IMG: Record<TileType, string> = {
  leaf: A('tile-leaf'),
  drop: A('tile-drop'),
  flame: A('tile-flame'),
  star: A('tile-star'),
  flower: A('tile-flower'),
  mushroom: A('tile-mushroom'),
  gem: A('tile-gem'),
  orb: A('tile-orb'),
}

export const SPECIAL_BADGE: Partial<Record<Special, string>> = {
  lineH: A('icon-bolt'),
  lineV: A('icon-bolt'),
}

export const SPECIAL_LABEL: Record<Exclude<Special, 'none'>, string> = {
  lineH: 'Row Weaver',
  lineV: 'Column Weaver',
  bomb: 'Charm Burst',
  prism: 'Rainbow Prism',
}

/** Booster button art (lucide fallbacks are used in components). */
export const BOOSTER_IMG = {
  lens: A('deco-lamp'),
  null: A('icon-close'),
}
