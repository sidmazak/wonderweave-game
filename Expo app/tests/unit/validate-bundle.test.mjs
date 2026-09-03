import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { rewriteAbsolutePaths } from '../../scripts/lib/rewrite-paths.mjs'
import { validateBundle } from '../../scripts/lib/validate-bundle.mjs'

test('validator fails when index.html is missing', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ww-web-'))
  const report = validateBundle(dir)
  assert.equal(report.ok, false)
  assert.ok(report.errors.some((e) => e.includes('index.html')))
  fs.rmSync(dir, { recursive: true, force: true })
})

test('validator detects missing referenced local files', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ww-web-'))
  fs.mkdirSync(path.join(dir, '_next'))
  fs.mkdirSync(path.join(dir, 'game', 'assets'), { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'index.html'),
    rewriteAbsolutePaths('<html><img src="/game/assets/missing.webp"></html>').text,
  )
  const report = validateBundle(dir)
  assert.equal(report.ok, false)
  assert.ok(report.missing.length >= 1)
  fs.rmSync(dir, { recursive: true, force: true })
})

test('validator passes a minimal complete bundle', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ww-web-'))
  fs.mkdirSync(path.join(dir, '_next', 'static'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'game', 'assets'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'game', 'assets', 'logo.webp'), 'webp')
  fs.writeFileSync(path.join(dir, '_next', 'static', 'app.js'), 'console.log(1)')
  fs.writeFileSync(
    path.join(dir, 'index.html'),
    '<html><head></head><body><script src="./_next/static/app.js"></script><img src="./game/assets/logo.webp"></body></html>',
  )
  const report = validateBundle(dir)
  assert.equal(report.ok, true, JSON.stringify(report, null, 2))
  fs.rmSync(dir, { recursive: true, force: true })
})
