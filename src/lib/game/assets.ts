import type { Special, TileType } from './types'

/**
 * Asset URL helper. All art ships as WebP (converted from the extracted sprite
 * sheets — ~70% smaller than PNG with identical alpha), which keeps first load
 * fast on mobile networks. The preloader in `preload.ts` warms the cache.
 */
export const A = (name: string): string => `/game/assets/${name}.webp`

/** Every asset key used by the game (single source of truth for the preloader). */
export const ALL_ASSETS: string[] = [
  // core chrome
  'logo', 'star-sparkle', 'icon-gear', 'icon-back', 'icon-close', 'icon-pause', 'icon-check',
  'medallion-lock', 'medallion-1', 'pill-gold', 'plaque-loading', 'panel-parchment', 'panel-howto',
  // tiles + specials
  'tile-leaf', 'tile-drop', 'tile-flame', 'tile-star', 'tile-flower', 'tile-mushroom', 'tile-gem', 'tile-orb',
  'icon-bolt', 'fx-rainbow',
  // bunnies
  'bunny-lantern', 'bunny-cheer', 'bunny-wizard', 'bunny-rest', 'bunny-heart', 'bunny-pack', 'bunny-walk',
  // backgrounds
  'bg-castle', 'bg-map', 'bg-arch', 'bg-altar', 'bg-night', 'bg-forest', 'bg-ruins', 'bg-sky', 'bg-sunset',
  // decor + fx
  'fx-sparkle', 'fx-petal', 'fx-burst', 'fx-firework', 'heart-pink', 'heart-purple', 'deco-lamp',
  'deco-island', 'deco-island-falls', 'deco-platform', 'deco-cloud-white', 'deco-cloud-pink', 'deco-clouds-pink',
  'deco-tree', 'deco-flowers', 'deco-arch', 'deco-butterfly', 'deco-moon', 'deco-mushrooms', 'deco-waterfall',
  'deco-sign', 'deco-balloon', 'banner-combo', 'banner-objective', 'banner-wood', 'banner-parch', 'banner-floral',
  'bar-green', 'bar-blue', 'bar-stars', 'frame-square', 'dialog-confirm',
]

/** Assets needed before the home screen paints (splash shows progress for these first). */
export const CRITICAL_ASSETS: string[] = [
  'bg-castle', 'logo', 'bunny-lantern', 'star-sparkle', 'icon-gear', 'deco-platform',
  'icon-back', 'icon-close', 'tile-leaf', 'tile-drop', 'fx-sparkle', 'banner-wood',
]

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
