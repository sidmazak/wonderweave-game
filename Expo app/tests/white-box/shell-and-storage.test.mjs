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
