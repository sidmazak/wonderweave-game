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
