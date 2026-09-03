import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { validateBundle } from '../../scripts/lib/validate-bundle.mjs'

const expoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const web = path.join(expoRoot, 'web')

test('packaged web/ is a self-contained local bundle', (t) => {
  if (!fs.existsSync(path.join(web, 'index.html'))) {
    t.skip('web/ not generated yet — run npm run game:sync')
    return
  }
  const report = validateBundle(web)
  assert.equal(report.ok, true, JSON.stringify({ errors: report.errors, missing: report.missing, localhost: report.localhost }, null, 2))
  assert.equal(report.localhost.length, 0)
  const html = fs.readFileSync(path.join(web, 'index.html'), 'utf8')
  assert.doesNotMatch(html, /https?:\/\/localhost/)
  assert.match(html, /__ww_compat\.js/)
  assert.match(html, /\.\/_next\//)
  assert.ok(fs.existsSync(path.join(web, 'game', 'assets', 'logo.webp')))
  assert.ok(fs.existsSync(path.join(web, '__ww_compat.js')))
})

test('bundle does not reference the Next.js source tree', (t) => {
  if (!fs.existsSync(path.join(web, 'index.html'))) {
    t.skip('web/ not generated yet')
    return
  }
  const html = fs.readFileSync(path.join(web, 'index.html'), 'utf8')
  assert.doesNotMatch(html, /src\/components/)
  assert.doesNotMatch(html, /Desktop\\wonderweave\\src/)
})
