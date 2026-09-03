#!/usr/bin/env node
/**
 * Best-effort Android evidence runner.
 * Uses ANDROID_HOME / ANDROID_AVD_HOME from the environment (see documentation/ENVIRONMENT.md).
 * Never encodes a requirement that Next.js be running.
 */
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXPO_ROOT = path.resolve(__dirname, '..')
const ART = path.join(EXPO_ROOT, 'test-artifacts')
const SHOTS = path.join(ART, 'screenshots')
const LOGS = path.join(ART, 'logs')
const REPORTS = path.join(ART, 'reports')
const PKG = 'com.wonderweave.game'
const ACTIVITY = '.MainActivity'

fs.mkdirSync(SHOTS, { recursive: true })
fs.mkdirSync(LOGS, { recursive: true })
fs.mkdirSync(REPORTS, { recursive: true })

const ANDROID_HOME = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || ''
const AVD_HOME = process.env.ANDROID_AVD_HOME || ''
const adb = ANDROID_HOME
  ? path.join(ANDROID_HOME, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb')
  : 'adb'
const emulatorBin = ANDROID_HOME
  ? path.join(ANDROID_HOME, 'emulator', process.platform === 'win32' ? 'emulator.exe' : 'emulator')
  : 'emulator'

function run(bin, args, opts = {}) {
  const r = spawnSync(bin, args, { encoding: 'utf8', ...opts })
  return { status: r.status ?? 1, stdout: r.stdout || '', stderr: r.stderr || '' }
}

function devices() {
  const r = run(adb, ['devices', '-l'])
  const lines = r.stdout.split(/\r?\n/).slice(1).filter((l) => l.includes('\tdevice'))
  return lines.map((l) => l.split(/\s+/)[0])
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms))
}

async function ensureDevice() {
  let list = devices()
  if (list.length) return list[0]
  if (!fs.existsSync(emulatorBin)) return null
  const avd = process.env.ANDROID_AVD_NAME || 'Metronoma_API35'
  const env = { ...process.env }
  if (AVD_HOME) env.ANDROID_AVD_HOME = AVD_HOME
  console.log(`[e2e] starting emulator ${avd}`)
  spawn(emulatorBin, ['-avd', avd, '-netdelay', 'none', '-netspeed', 'full'], {
    env,
    detached: true,
    stdio: 'ignore',
  }).unref()
  const deadline = Date.now() + 180_000
  while (Date.now() < deadline) {
    list = devices()
    if (list.length) {
      run(adb, ['-s', list[0], 'wait-for-device'])
      for (let i = 0; i < 30; i++) {
        const boot = run(adb, ['-s', list[0], 'shell', 'getprop', 'sys.boot_completed'])
        if (boot.stdout.trim() === '1') return list[0]
        await sleep(2000)
      }
      return list[0]
    }
    await sleep(3000)
  }
  return null
}

function screenshot(serial, name) {
  const dest = path.join(SHOTS, name)
  const r = run(adb, ['-s', serial, 'exec-out', 'screencap', '-p'], { encoding: 'buffer', maxBuffer: 20_000_000 })
  if (r.status === 0 && r.stdout && r.stdout.length > 100) {
    fs.writeFileSync(dest, r.stdout)
    return dest
  }
  return null
}

function launch(serial) {
  run(adb, ['-s', serial, 'shell', 'am', 'force-stop', PKG])
  return run(adb, [
    '-s',
    serial,
    'shell',
    'am',
    'start',
    '-n',
    `${PKG}/${PKG}${ACTIVITY}`,
    '-a',
    'android.intent.action.MAIN',
  ])
}

function apkCandidates() {
  const roots = [
    path.join(EXPO_ROOT, 'android', 'app', 'build', 'outputs', 'apk', 'debug'),
    path.join(EXPO_ROOT, 'android', 'app', 'build', 'outputs', 'apk', 'release'),
  ]
  /** @type {string[]} */
  const found = []
  for (const root of roots) {
    if (!fs.existsSync(root)) continue
    for (const f of fs.readdirSync(root)) {
      if (f.endsWith('.apk') && !f.includes('unsigned')) found.push(path.join(root, f))
    }
  }
  return found
}

async function main() {
  /** @type {Record<string, unknown>} */
  const summary = {
    startedAt: new Date().toISOString(),
    device: null,
    install: 'NOT TESTED',
    launch: 'NOT TESTED',
    screenshotHome: 'NOT TESTED',
    offlineRelaunch: 'NOT TESTED',
    notes: [],
  }

  if (!ANDROID_HOME) {
    summary.notes.push('ANDROID_HOME is not set; cannot talk to adb')
    fs.writeFileSync(path.join(REPORTS, 'e2e-summary.json'), JSON.stringify(summary, null, 2))
    console.log(JSON.stringify(summary, null, 2))
    process.exit(2)
  }

  const serial = await ensureDevice()
  summary.device = serial
  if (!serial) {
    summary.notes.push('No emulator/device became ready')
    fs.writeFileSync(path.join(REPORTS, 'e2e-summary.json'), JSON.stringify(summary, null, 2))
    console.log(JSON.stringify(summary, null, 2))
    process.exit(2)
  }

  const apks = apkCandidates()
  if (apks.length) {
    const apk = apks[apks.length - 1]
    const inst = run(adb, ['-s', serial, 'install', '-r', apk])
    summary.install = inst.status === 0 ? 'PASS' : 'FAIL'
    summary.apk = apk
    if (inst.status !== 0) summary.notes.push(inst.stderr || inst.stdout)
  } else {
    summary.notes.push('No APK found; attempting to launch a previously installed package')
  }

  const started = launch(serial)
  summary.launch = started.status === 0 ? 'PASS' : 'FAIL'
  await sleep(8000)
  const shot = screenshot(serial, 'expo-launch.png')
  summary.screenshotHome = shot ? 'PASS' : 'FAIL'
  summary.screenshotPath = shot

  const log = run(adb, ['-s', serial, 'logcat', '-d', '-t', '200'])
  fs.writeFileSync(path.join(LOGS, 'logcat-excerpt.txt'), log.stdout)

  summary.finishedAt = new Date().toISOString()
  fs.writeFileSync(path.join(REPORTS, 'e2e-summary.json'), JSON.stringify(summary, null, 2))
  console.log(JSON.stringify(summary, null, 2))
  const failed = ['install', 'launch', 'screenshotHome'].some(
    (k) => summary[k] === 'FAIL' && !(k === 'install' && !apks.length),
  )
  process.exit(failed || summary.launch !== 'PASS' ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
