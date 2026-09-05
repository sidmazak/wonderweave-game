import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { rewriteAbsolutePaths } from '../../scripts/lib/rewrite-paths.mjs'
import { scanInlineScripts, validateBundle } from '../../scripts/lib/validate-bundle.mjs'

/** Write a throwaway bundle containing the given files, plus the dirs the validator requires. */
function mkBundle(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ww-web-'))
  fs.mkdirSync(path.join(dir, '_next'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'game', 'assets'), { recursive: true })
  for (const [rel, contents] of Object.entries(files)) {
    const target = path.join(dir, rel)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, contents)
  }
  return dir
}

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

/* ---------------------------------------------------------------------------
 * Inline <script> auditing.
 *
 * Regression cover for the bundle that reported ok:true while React never
 * hydrated: the chunk URLs were root-absolute inside an inline flight payload,
 * which the src=/href= regexes cannot see.
 * ------------------------------------------------------------------------- */
function flightDoc(rows) {
  return `<html><body><script>self.__next_f.push([1,${JSON.stringify(rows.join('\n'))}])</script></body></html>`
}

test('scanInlineScripts flags a root-absolute chunk URL in a flight I-row', () => {
  const problems = scanInlineScripts(flightDoc(['3:I[1,["/_next/static/chunks/app.js"],"default"]']))
  assert.equal(problems.length, 1)
  assert.match(problems[0], /root-absolute/)
})

test('scanInlineScripts accepts relative flight chunk URLs', () => {
  assert.deepEqual(scanInlineScripts(flightDoc(['3:I[1,["./_next/static/chunks/app.js"],"default"]'])), [])
})

test('scanInlineScripts tolerates absolute paths inside a length-prefixed T row', () => {
  const body = '<img src="/game/assets/logo.webp"/>'
  const tRow = `2:T${Buffer.byteLength(body, 'utf8').toString(16)},${body}`
  assert.deepEqual(scanInlineScripts(flightDoc([tRow])), [], 'T rows are runtime-patched, not a build error')
})

test('scanInlineScripts flags a root-absolute path in a plain inline script', () => {
  const doc = '<html><script>var u = "/game/assets/logo.webp";</script></html>'
  const problems = scanInlineScripts(doc)
  assert.equal(problems.length, 1)
})

test('scanInlineScripts ignores external scripts and relative inline paths', () => {
  const doc = '<html><script src="/_next/x.js"></script><script>var u="./game/a.webp"</script></html>'
  assert.deepEqual(scanInlineScripts(doc), [], 'src= values are covered by the attribute scanner')
})

test('validateBundle fails a bundle whose flight payload keeps absolute chunks', () => {
  const dir = mkBundle({
    'index.html': flightDoc(['3:I[1,["/_next/static/chunks/app.js"],"default"]']),
  })
  const report = validateBundle(dir)
  assert.equal(report.ok, false, 'a hydration-breaking bundle must not report ok')
  assert.ok(report.missing.some((m) => /root-absolute/.test(m)))
})
