import fs from 'node:fs'
import path from 'node:path'

const CATEGORY_ORDER = ['chrome', 'tiles', 'bunnies', 'backgrounds', 'decor', 'fx', 'ui']

const CATEGORY_FOR = [
  [/^(logo|star-sparkle|icon-|medallion-)/, 'chrome'],
  [/^tile-|^icon-bolt$|^fx-rainbow$/, 'tiles'],
  [/^bunny-/, 'bunnies'],
  [/^bg-/, 'backgrounds'],
  [/^deco-/, 'decor'],
  [/^fx-|^heart-/, 'fx'],
  [/^banner-|^frame-/, 'ui'],
]

const NOTES = {
  'deco-mushrooms': 'Dialog bottom-left corner.',
  'deco-flowers': 'Dialog bottom-right corner.',
  'deco-island': 'Chapter map island + codex lore ch.I.',
  'deco-platform': 'Home mascot stone + codex lore ch.XII.',
  'frame-square': 'Match-3 board frame (CSS background).',
  'bg-sky': 'Chapter I / VI backdrop + atlas thumb.',
  'bg-castle': 'Home + splash loading scene.',
  'bg-map': 'Atlas parchment map.',
  'bunny-lantern': 'Home mascot Pip + daily screen.',
  'bunny-rest': 'Pause / lose modals + instruments reset.',
}

function categoryFor(id) {
  for (const [re, cat] of CATEGORY_FOR) {
    if (re.test(id)) return cat
  }
  return 'ui'
}

function labelFor(id) {
  return id
    .replace(/^bg-/, 'Backdrop · ')
    .replace(/^deco-/, 'Deco · ')
    .replace(/^bunny-/, 'Bunny · ')
    .replace(/^tile-/, 'Tile · ')
    .replace(/^fx-/, 'FX · ')
    .replace(/^icon-/, 'Icon · ')
    .replace(/-/g, ' ')
}

/** Parse `ALL_ASSETS` from src/lib/game/assets.ts — single source of truth. */
export function parseAllAssets(assetsTsPath) {
  const src = fs.readFileSync(assetsTsPath, 'utf8')
  const m = src.match(/export const ALL_ASSETS:\s*string\[\]\s*=\s*\[([\s\S]*?)\n\]/)
  if (!m) throw new Error('Could not parse ALL_ASSETS from assets.ts')
  const ids = [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1])
  return [...new Set(ids)]
}

export function loadStatuses(statusPath) {
  if (!fs.existsSync(statusPath)) return {}
  try {
    const raw = JSON.parse(fs.readFileSync(statusPath, 'utf8'))
    if (raw.statuses) return raw.statuses
    if (raw.queue) {
      const statuses = {}
      for (const item of raw.queue) {
        statuses[item.id] = { status: item.status, lastSavedAt: item.lastSavedAt, notes: item.notes }
      }
      return statuses
    }
  } catch {
    /* ignore corrupt file */
  }
  return {}
}

export function saveStatuses(statusPath, statuses) {
  fs.writeFileSync(statusPath, `${JSON.stringify({ statuses }, null, 2)}\n`)
}

export function buildManifest({ root, assetsTsPath, statusPath, assetsDir, backupDir }) {
  const ids = parseAllAssets(assetsTsPath)
  const statuses = loadStatuses(statusPath)
  const assetsRoot = path.join(root, assetsDir)

  const queue = ids
    .filter((id) => fs.existsSync(path.join(assetsRoot, `${id}.webp`)))
    .map((id) => ({
      id,
      label: labelFor(id),
      context: categoryFor(id),
      status: statuses[id]?.status === 'done' ? 'done' : 'pending',
      notes: statuses[id]?.notes || NOTES[id] || 'Used in Wonderweave — clean fringe / export artifacts.',
      lastSavedAt: statuses[id]?.lastSavedAt,
    }))
    .sort((a, b) => {
      const ca = CATEGORY_ORDER.indexOf(a.context)
      const cb = CATEGORY_ORDER.indexOf(b.context)
      if (ca !== cb) return ca - cb
      return a.id.localeCompare(b.id)
    })

  const missing = ids.filter((id) => !fs.existsSync(path.join(assetsRoot, `${id}.webp`)))

  return {
    version: 5,
    source: 'ALL_ASSETS',
    assetsDir,
    backupDir,
    total: queue.length,
    missingOnDisk: missing,
    queue,
  }
}
