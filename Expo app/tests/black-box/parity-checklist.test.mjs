import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const expoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const checklistPath = path.join(expoRoot, 'documentation', 'PARITY_CHECKLIST.md')

/**
 * Black-box checklist: features a player can observe without reading source.
 * Device evidence is attached later by scripts/android-e2e.mjs.
 */
const PLAYER_VISIBLE = [
  'Launch shows Wonderweave loading / home',
  'Home: Play, How to Play, Instruments',
  'Map / Atlas chapters',
  'Chapter stage select',
  'Gameplay board swaps',
  'Pause overlay',
  'Win / lose overlays',
  'Codex',
  'Relics / Altar',
  'Daily Folio',
  'Settings (music, sfx, vibrations, particles)',
  'Progress persists after restart',
]

test('parity checklist exists and lists player-visible features', () => {
  assert.equal(fs.existsSync(checklistPath), true)
  const text = fs.readFileSync(checklistPath, 'utf8')
  for (const row of PLAYER_VISIBLE) {
    assert.ok(text.includes(row), `checklist missing: ${row}`)
  }
})

test('black-box tests do not import game engine internals', () => {
  const here = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8')
  assert.doesNotMatch(here, /from ['"]@\/lib\/game/)
  assert.doesNotMatch(here, /lib\/game\/engine/)
})
