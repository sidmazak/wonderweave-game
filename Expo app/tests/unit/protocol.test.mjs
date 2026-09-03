import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applySave,
  isSavePayload,
  isWebToNativeMessage,
  parseBridgeMessage,
  sanitizeBackup,
} from '../../scripts/lib/messages.mjs'

test('parseBridgeMessage accepts JSON strings and objects', () => {
  assert.equal(!!parseBridgeMessage('{"type":"READY"}'), true)
  assert.equal(!!parseBridgeMessage({ type: 'READY' }), true)
  assert.equal(parseBridgeMessage('not-json'), false)
  assert.equal(parseBridgeMessage(null), false)
  assert.equal(parseBridgeMessage({ type: '' }), false)
})

test('isWebToNativeMessage rejects unknown types', () => {
  assert.equal(isWebToNativeMessage({ type: 'READY' }), true)
  assert.equal(isWebToNativeMessage({ type: 'EVAL_JS', payload: 'alert(1)' }), false)
  assert.equal(isWebToNativeMessage({ type: 'SAVE_DATA' }), true)
})

test('isSavePayload enforces ww- prefix and size', () => {
  assert.equal(isSavePayload({ key: 'ww-progress', value: '{}' }), true)
  assert.equal(isSavePayload({ key: 'secret', value: 'x' }), false)
  assert.equal(isSavePayload({ key: 'ww-progress', value: 12 }), false)
  assert.equal(isSavePayload({ key: 'ww-progress', value: null }), true)
})

test('applySave merges, deletes, and clears', () => {
  const a = applySave({}, { key: 'ww-lumens', value: '40' })
  assert.deepEqual(a, { 'ww-lumens': '40' })
  const b = applySave(a, { key: 'ww-lumens', value: null })
  assert.deepEqual(b, {})
  const c = applySave({ 'ww-a': '1', 'ww-b': '2' }, { key: 'ww-__clear__', value: null })
  assert.deepEqual(c, {})
})

test('sanitizeBackup drops malformed keys and oversized values', () => {
  const clean = sanitizeBackup({
    'ww-ok': 'yes',
    other: 'no',
    'ww-num': 3,
    'ww-big': 'x'.repeat(500_001),
  })
  assert.deepEqual(clean, { 'ww-ok': 'yes' })
  assert.deepEqual(sanitizeBackup(null), {})
  assert.deepEqual(sanitizeBackup(['ww-a']), {})
})
