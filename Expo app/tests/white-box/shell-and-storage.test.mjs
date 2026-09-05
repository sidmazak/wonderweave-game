import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { applySave, isSavePayload } from '../../scripts/lib/messages.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

test('webview-compat.js installs a single global guard', () => {
  const src = fs.readFileSync(path.join(root, 'src/bridge/webview-compat.js'), 'utf8')
  assert.match(src, /__WW_COMPAT_INSTALLED__/)
  assert.match(src, /TURBOPACK_CHUNK_BASE_PATH\s*=\s*'\.\/_next\/'/)
  assert.match(src, /__WW_FETCH_POLY__/)
  assert.match(src, /XMLHttpRequest/)
  assert.match(src, /ww-native-shell/)
  assert.match(src, /max-width:none/)
  assert.match(src, /ribbon-wrap\.ribbon-fluid/)
  assert.match(src, /align-items:center/)
  assert.match(src, /SAVE_DATA/)
  assert.match(src, /handleBack/)
  assert.match(src, /visibilitychange/)
})

test('GameScreen intercepts non-file navigation', () => {
  const src = fs.readFileSync(path.join(root, 'src/screens/GameScreen.tsx'), 'utf8')
  assert.match(src, /onShouldStartLoadWithRequest/)
  assert.match(src, /file:\/\//)
  assert.match(src, /BackHandler/)
  assert.match(src, /PORTRAIT_UP/)
})

test('save path covers empty, current, and malformed state', () => {
  assert.equal(isSavePayload({ key: 'ww-progress', value: '{}' }), true)
  assert.equal(isSavePayload({ key: 'ww-progress', value: '{' }), true)
  assert.equal(isSavePayload({ key: 'ww-progress' }), false)
  const migrated = applySave({}, { key: 'ww-progress', value: '{"1":{"stars":3,"bestScore":1200}}' })
  assert.equal(JSON.parse(migrated['ww-progress'])['1'].stars, 3)
})

/* ---------------------------------------------------------------------------
 * Runtime absolute-path fix.
 *
 * React's Flight payload keeps a length-prefixed `T` row that cannot be
 * path-rewritten at build time without desyncing React's parser (error #412).
 * The asset URLs inside it therefore stay root-absolute and are corrected at
 * runtime by the compat layer. That makes this patch load-bearing: without it
 * those assets resolve to file:///game/... and 404 on device.
 * ------------------------------------------------------------------------- */
test('compat layer keeps the runtime absolute-path fix that T rows depend on', () => {
  const src = fs.readFileSync(path.join(root, 'src/bridge/webview-compat.js'), 'utf8')

  assert.match(src, /__WW_ABS_PATH_FIX__/, 'install guard must be present')
  assert.ok(
    src.includes('_next|game|icons'),
    'must match the root-absolute packaged-asset dirs',
  )

  // The three interception points, each of which a chunk/asset load can use.
  assert.match(src, /HTMLScriptElement/, 'script src must be patched (chunk loads)')
  assert.match(src, /HTMLLinkElement/, 'link href must be patched (css/font preloads)')
  assert.match(src, /HTMLImageElement/, 'img src must be patched (T-row artwork)')
  assert.match(src, /Element\.prototype\.setAttribute/, 'setAttribute fallback must be present')
  assert.match(src, /XMLHttpRequest\.prototype\.open/, 'XHR must be patched')
})

test('compat layer does not fake loader progress', () => {
  const src = fs.readFileSync(path.join(root, 'src/bridge/webview-compat.js'), 'utf8')
  // A CSS animation on the fill overrides the inline width bound to real
  // progress, so the bar and the percentage disagree — and a dead app still
  // looks like it is loading. Regression cover for exactly that.
  assert.doesNotMatch(src, /ww-native-load/, 'no synthetic loader keyframes')
  assert.doesNotMatch(
    src,
    /ww-loader-fill\{[^}]*animation:/,
    'the loader fill must not be animated by the shell',
  )
})
