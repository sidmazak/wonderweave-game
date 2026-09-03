import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const expoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const required = [
  'package.json',
  'app.config.js',
  'eas.json',
  'index.ts',
  'src/app/App.tsx',
  'src/screens/GameScreen.tsx',
  'src/bridge/protocol.ts',
  'src/bridge/webview-compat.js',
  'scripts/sync-web-bundle.mjs',
  'scripts/validate-web-bundle.mjs',
  'documentation/MIGRATION.md',
  'documentation/ARCHITECTURE.md',
  'documentation/TESTING.md',
  'documentation/KNOWN_LIMITATIONS.md',
]

test('Expo app smoke: required source files exist', () => {
  for (const rel of required) {
    assert.equal(fs.existsSync(path.join(expoRoot, rel)), true, `missing ${rel}`)
  }
})

test('package.json exposes the required scripts', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(expoRoot, 'package.json'), 'utf8'))
  for (const name of [
    'game:build',
    'game:sync',
    'expo:start',
    'android',
    'test',
    'test:unit',
    'test:smoke',
    'test:blackbox',
    'test:integration',
    'validate:webbundle',
  ]) {
    assert.equal(typeof pkg.scripts[name], 'string', `missing script ${name}`)
  }
})

test('native shell loads the packaged file URI, not localhost', () => {
  const src = fs.readFileSync(path.join(expoRoot, 'src/services/webviewBundle.ts'), 'utf8')
  assert.match(src, /android_asset\/www\/index\.html/)
  assert.doesNotMatch(src, /localhost:3000/)
  const screen = fs.readFileSync(path.join(expoRoot, 'src/screens/GameScreen.tsx'), 'utf8')
  assert.doesNotMatch(screen, /localhost:3000/)
})
