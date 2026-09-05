import assert from 'node:assert/strict'
import test from 'node:test'
import { rewriteAbsolutePaths } from '../../scripts/lib/rewrite-paths.mjs'

test('rewrites root-absolute Next and game paths', () => {
  const src = '<script src="/_next/static/chunks/a.js"></script><img src="/game/assets/logo.webp?v=10">'
  const { text, changes } = rewriteAbsolutePaths(src)
  assert.equal(text.includes('src="./_next/static/chunks/a.js"'), true)
  assert.equal(text.includes('src="./game/assets/logo.webp?v=10"'), true)
  assert.ok(changes >= 2)
})

test('is idempotent — already relative paths stay relative', () => {
  const once = rewriteAbsolutePaths('url(/_next/static/x.css)').text
  const twice = rewriteAbsolutePaths(once).text
  assert.equal(once, twice)
  assert.equal(once.includes('././_next'), false)
})

test('JS keeps /_next/ pathname checks so file:// script URLs still match', () => {
  const src = 'let{pathname:t}=new URL(e.src),n=t.indexOf("/_next/");'
  const { text } = rewriteAbsolutePaths(src, { filePath: 'C:/bundle/_next/static/chunks/runtime.js' })
  assert.equal(text.includes('indexOf("/_next/")'), true)
  assert.equal(text.includes('indexOf("./_next/")'), false)
})

test('rewrites turbopack base path default', () => {
  const src = 'let U="string"==typeof TURBOPACK_CHUNK_BASE_PATH?TURBOPACK_CHUNK_BASE_PATH:"/_next/"'
  const { text } = rewriteAbsolutePaths(src)
  assert.equal(text.includes('"./_next/"'), true)
})

test('rewrites compiled asset helper', () => {
  const src = 't c=e=>`/game/assets/${e}.webp?v=10`'
  const { text } = rewriteAbsolutePaths(src)
  assert.equal(text.includes('`./game/assets/${e}.webp?v=10`'), true)
})

test('rewrites localhost metadata to relative origin', () => {
  const src = 'content="http://localhost:3000/og-image.png"'
  const { text } = rewriteAbsolutePaths(src)
  assert.equal(text.includes('localhost'), false)
  assert.equal(text.includes('./og-image.png'), true)
})

test('rewrites public site SEO origins to relative for file://', () => {
  const src =
    '<link rel="canonical" href="https://wonderweave.app"/><meta property="og:url" content="https://www.wonderweave.app/">'
  const { text } = rewriteAbsolutePaths(src)
  assert.equal(text.includes('wonderweave.app'), false)
  assert.equal(text.includes('href="."'), true)
  assert.equal(text.includes('content="./"'), true)
})

test('rewrites CSS url() relative to the stylesheet, not the document', () => {
  const cssPath = 'C:/bundle/_next/static/chunks/app.css'
  const webRoot = 'C:/bundle'
  const src = 'background-image:url(/game/assets/frame-square.webp?v=10)'
  const { text } = rewriteAbsolutePaths(src, { filePath: cssPath, webRoot })
  assert.equal(text.includes('url(../../../game/assets/frame-square.webp?v=10)'), true)
})

test('does not rewrite w3.org namespaces', () => {
  const src = 'xmlns="http://www.w3.org/2000/svg"'
  const { text, changes } = rewriteAbsolutePaths(src)
  assert.equal(text, src)
  assert.equal(changes, 0)
})

/* ---------------------------------------------------------------------------
 * React Flight payload rewriting.
 *
 * The payload rides inside `self.__next_f.push([1,"…"])` as an escaped string.
 * `I` rows carry the client-reference chunk URLs React resolves while
 * hydrating: if those stay root-absolute, every chunk 404s under file:// and
 * the app hangs on the loading screen at 0%. `T` rows are byte-length-prefixed,
 * so rewriting them desyncs React's parser (error #412) — they must be left
 * exactly as-is and fixed at runtime instead.
 * ------------------------------------------------------------------------- */

/** Wrap flight rows into the inline-script form the exporter emits. */
function flightScript(rows) {
  return `<script>self.__next_f.push([1,${JSON.stringify(rows.join('\n'))}])</script>`
}

test('flight I-rows are rewritten to relative chunk paths', () => {
  const src = flightScript(['3:I[39756,["/_next/static/chunks/app.js"],"default"]'])
  const { text } = rewriteAbsolutePaths(src, { filePath: 'index.html', webRoot: 'w' })
  assert.match(text, /\.\/_next\/static\/chunks\/app\.js/)
  assert.equal(/(?<!\.)\/_next\//.test(text), false, 'no root-absolute path may remain in an I row')
})

test('flight H (preload hint) rows are rewritten too', () => {
  const src = flightScript([':HL["/_next/static/media/font.woff2","font"]'])
  const { text } = rewriteAbsolutePaths(src, { filePath: 'index.html', webRoot: 'w' })
  assert.match(text, /\.\/_next\/static\/media\/font\.woff2/)
})

test('flight /game/ and /icons/ paths are rewritten', () => {
  const src = flightScript(['7:["/game/assets/logo.webp","/icons/icon-512.png"]'])
  const { text } = rewriteAbsolutePaths(src, { filePath: 'index.html', webRoot: 'w' })
  assert.match(text, /\.\/game\/assets\/logo\.webp/)
  assert.match(text, /\.\/icons\/icon-512\.png/)
})

test('length-prefixed T rows are left byte-identical (avoids React #412)', () => {
  const body = '<img src="/game/assets/logo.webp"/>'
  const hexLen = Buffer.byteLength(body, 'utf8').toString(16)
  const tRow = `2:T${hexLen},${body}`
  const src = flightScript([tRow, '3:I[1,["/_next/static/chunks/app.js"],"default"]'])
  const { text } = rewriteAbsolutePaths(src, { filePath: 'index.html', webRoot: 'w' })

  // Compare decoded rows: in the document the payload is an escaped JS string.
  const start = text.indexOf('push([1,') + 'push([1,'.length
  const decoded = JSON.parse(text.slice(start, text.lastIndexOf('])</script>')))
  const [outT, outI] = decoded.split('\n')

  assert.equal(outT, tRow, 'the T row must survive untouched, absolute paths and all')
  assert.equal(
    Buffer.byteLength(outT.slice(outT.indexOf(',') + 1), 'utf8').toString(16),
    hexLen,
    'its declared byte length must still match its content',
  )
  assert.match(outI, /\.\/_next\/static\/chunks\/app\.js/, 'while the I row is still fixed')
})

test('flight rewriting is idempotent — a second pass changes nothing', () => {
  const src = flightScript(['3:I[1,["/_next/static/chunks/app.js"],"default"]'])
  const once = rewriteAbsolutePaths(src, { filePath: 'index.html', webRoot: 'w' })
  const twice = rewriteAbsolutePaths(once.text, { filePath: 'index.html', webRoot: 'w' })
  assert.equal(twice.text, once.text)
  assert.equal(twice.changes, 0)
})

test('flight payloads stay valid JSON strings after rewriting', () => {
  const src = flightScript(['3:I[1,["/_next/static/chunks/app.js"],"default"]', '1:"$Sreact.fragment"'])
  const { text } = rewriteAbsolutePaths(src, { filePath: 'index.html', webRoot: 'w' })
  const start = text.indexOf('push([1,') + 'push([1,'.length
  const end = text.lastIndexOf('])</script>')
  const literal = text.slice(start, end)
  assert.doesNotThrow(() => JSON.parse(literal), 'payload must remain a decodable JS string')
  assert.match(JSON.parse(literal), /\.\/_next\//, 'and decode back to the rewritten rows')
})
