#!/usr/bin/env node
/**
 * Build the Next.js static export (optional) and sync it into Expo app/web.
 *
 *   node scripts/sync-web-bundle.mjs
 *   node scripts/sync-web-bundle.mjs --skip-build
 *   node scripts/sync-web-bundle.mjs --build-only
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { copyBundle, emptyDir } from './lib/copy-bundle.mjs'
import { injectCompat, rewriteTree } from './lib/inject-compat.mjs'
import { validateBundle } from './lib/validate-bundle.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXPO_ROOT = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(EXPO_ROOT, '..')
const OUT_DIR = path.join(REPO_ROOT, 'out')
const WEB_DIR = path.join(EXPO_ROOT, 'web')
const ANDROID_ASSETS = path.join(EXPO_ROOT, 'android', 'app', 'src', 'main', 'assets', 'www')

const args = new Set(process.argv.slice(2))
const skipBuild = args.has('--skip-build')
const buildOnly = args.has('--build-only')

function run(cmd, cmdArgs, cwd) {
  const result = spawnSync(cmd, cmdArgs, { cwd, stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function writeGeneratedMarker(dir, extra) {
  fs.writeFileSync(
    path.join(dir, 'GENERATED.txt'),
    [
      'GENERATED GAME BUNDLE — do not edit by hand.',
      '',
      `Created: ${new Date().toISOString()}`,
      'Regenerate with: npm run game:sync',
      '',
      'This is a runtime copy of the Next.js `out/` export,',
      'path-rewritten for Android WebView (file:///android_asset/www/)',
      'with `__ww_compat.js` injected.',
      extra,
      '',
    ].join('\n'),
  )
}

if (!skipBuild) {
  console.log('[sync] Building Next.js static export…')
  run('npm', ['run', 'build'], REPO_ROOT)
}

if (buildOnly) {
  console.log('[sync] --build-only: leaving Expo web/ untouched')
  process.exit(0)
}

if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
  console.error('[sync] next build did not produce out/index.html')
  process.exit(1)
}

console.log('[sync] Copying out/ → web/')
emptyDir(WEB_DIR)
const copied = copyBundle(OUT_DIR, WEB_DIR)
console.log(`[sync] Copied ${copied.files} files (${(copied.bytes / 1024 / 1024).toFixed(2)} MiB)`)

console.log('[sync] Rewriting root-absolute URLs for file:// WebView')
const rewritten = rewriteTree(WEB_DIR)
console.log(`[sync] Rewrote ${rewritten.changes} path(s) across ${rewritten.files} file(s)`)

console.log('[sync] Injecting WebView compatibility layer')
injectCompat(WEB_DIR)

writeGeneratedMarker(
  WEB_DIR,
  'Runtime copy of the Next.js `out/` export, path-rewritten for the native WebView.',
)

if (fs.existsSync(path.join(EXPO_ROOT, 'android'))) {
  console.log('[sync] Mirroring bundle into android/app/src/main/assets/www')
  emptyDir(ANDROID_ASSETS)
  copyBundle(WEB_DIR, ANDROID_ASSETS)
}

const report = validateBundle(WEB_DIR)
const reportPath = path.join(EXPO_ROOT, 'test-artifacts', 'reports', 'web-bundle-validation.json')
fs.mkdirSync(path.dirname(reportPath), { recursive: true })
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

if (!report.ok) {
  console.error('[sync] Bundle validation FAILED')
  if (report.errors.length) console.error('  errors:', report.errors)
  if (report.missing.length) console.error('  missing:', report.missing.slice(0, 30))
  if (report.localhost.length) console.error('  localhost refs:', report.localhost)
  process.exit(1)
}

if (report.remote.length) {
  console.warn('[sync] Non-allowlisted remote URLs (review):')
  for (const r of report.remote.slice(0, 20)) console.warn('  ', r)
}

console.log(`[sync] OK — ${report.files} files, ${report.webpAssets} webp assets`)
console.log(`[sync] Validation report: ${path.relative(EXPO_ROOT, reportPath)}`)
