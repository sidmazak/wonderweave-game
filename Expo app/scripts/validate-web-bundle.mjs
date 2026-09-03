#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateBundle } from './lib/validate-bundle.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXPO_ROOT = path.resolve(__dirname, '..')
const WEB_DIR = path.join(EXPO_ROOT, 'web')

if (!fs.existsSync(WEB_DIR)) {
  console.error('web/ is missing. Run npm run game:sync first.')
  process.exit(1)
}

const report = validateBundle(WEB_DIR)
const out = path.join(EXPO_ROOT, 'test-artifacts', 'reports', 'web-bundle-validation.json')
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, JSON.stringify(report, null, 2))

console.log(JSON.stringify({ ok: report.ok, files: report.files, webpAssets: report.webpAssets }, null, 2))
if (report.errors.length) {
  console.log('errors:')
  for (const e of report.errors) console.log(' -', e)
}
if (report.missing.length) {
  console.log('Missing asset:')
  for (const m of report.missing) console.log(' ', m)
}
if (report.localhost.length) {
  console.log('localhost references:')
  for (const l of report.localhost) console.log(' -', l)
}
if (report.remote.length) {
  console.log('remote URLs:')
  for (const r of report.remote) console.log(' -', r)
}

process.exit(report.ok ? 0 : 1)
