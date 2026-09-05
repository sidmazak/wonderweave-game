import fs from 'node:fs'
import path from 'node:path'
import { TEXT_EXTENSIONS, ABSOLUTE_FILES } from './rewrite-paths.mjs'

const ATTR_REF =
  /(?:src|href|poster|data)=["'](?<url>[^"']+)["']/gi
const CSS_URL = /url\(\s*(['"]?)(?<url>[^'")]+)\1\s*\)/gi
const JS_STATIC = /["'`](?<url>\.\/(?:_next|game|icons)\/[^"'`]+)["'`]/g

const ALLOWED_REMOTE = [
  /^https?:\/\/www\.w3\.org\//,
  /^https?:\/\/www\.sitemaps\.org\//,
  /^https?:\/\/schema\.org\//,
  /^https:\/\/react\.dev\/errors\//,
  /^https:\/\/nextjs\.org\/docs\//,
  /^https:\/\/fonts\.gstatic\.com\//, // should not remain; reported if present
]

const IGNORED_SCHEMES = /^(data:|blob:|about:|javascript:|mailto:|#)/i

/* ---------------------------------------------------------------------------
 * Inline <script> auditing.
 *
 * The attribute/CSS/JS regexes above only see src= and href= values, so a
 * root-absolute chunk URL living inside an inline script body is invisible to
 * them. That is exactly how a bundle whose React never hydrated (every chunk
 * 404ing at file:///_next/...) still reported ok:true.
 *
 * React's Flight payload is the interesting case: rows are `id:<type><data>`,
 * and only `T` rows carry a hex byte-length prefix. A T row therefore cannot be
 * path-rewritten without desyncing React's parser (error #412), so it keeps
 * absolute paths and the compat layer fixes those at runtime — allowed here.
 * Every other row (notably `I` client references, which React resolves during
 * hydration) MUST be relative or the app hangs on the loading screen.
 * ------------------------------------------------------------------------- */
const INLINE_SCRIPT = /<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi
const FLIGHT_PUSH = /self\.__next_f\.push\(\[\d+,("(?:[^"\\]|\\.)*")\]\)/g
const PACKAGED_ABSOLUTE = /(?<![.\w])\/(?:_next|game|icons)\//

/**
 * @param {string} text full HTML document
 * @returns {string[]} human-readable problems (empty when the document is safe)
 */
export function scanInlineScripts(text) {
  const problems = []
  INLINE_SCRIPT.lastIndex = 0
  let script
  while ((script = INLINE_SCRIPT.exec(text))) {
    const body = script[1]
    let sawFlight = false

    FLIGHT_PUSH.lastIndex = 0
    let push
    while ((push = FLIGHT_PUSH.exec(body))) {
      sawFlight = true
      let decoded
      try {
        decoded = JSON.parse(push[1])
      } catch {
        continue
      }
      if (typeof decoded !== 'string') continue
      for (const row of decoded.split('\n')) {
        const colon = row.indexOf(':')
        if (colon < 0) continue
        // Length-prefixed text row — absolute paths here are handled at runtime.
        if (/^T[0-9a-f]*,/i.test(row.slice(colon + 1))) continue
        const hit = row.match(PACKAGED_ABSOLUTE)
        if (hit) {
          problems.push(
            `flight row "${row.slice(0, 48)}${row.length > 48 ? '…' : ''}" keeps root-absolute ${hit[0]}`,
          )
        }
      }
    }

    if (!sawFlight) {
      const hit = body.match(PACKAGED_ABSOLUTE)
      if (hit) {
        problems.push(`inline script keeps root-absolute ${hit[0]}`)
      }
    }
  }
  return problems
}

/**
 * @param {string} webRoot
 */
export function collectFiles(webRoot) {
  /** @type {string[]} */
  const files = []
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name)
      if (ent.isDirectory()) walk(p)
      else if (ent.isFile()) files.push(p)
    }
  }
  walk(webRoot)
  return files
}

function extOf(file) {
  const d = file.lastIndexOf('.')
  return d >= 0 ? file.slice(d).toLowerCase() : ''
}

function decodeRef(raw) {
  let u = raw.trim()
  if (!u) return u
  try {
    u = decodeURI(u)
  } catch {
    /* keep */
  }
  const q = u.indexOf('?')
  const h = u.indexOf('#')
  let cut = u.length
  if (q >= 0) cut = Math.min(cut, q)
  if (h >= 0) cut = Math.min(cut, h)
  return u.slice(0, cut)
}

function isAllowedRemote(url) {
  return ALLOWED_REMOTE.some((re) => re.test(url))
}

/**
 * @param {string} webRoot
 */
export function validateBundle(webRoot) {
  const files = collectFiles(webRoot)
  const index = path.join(webRoot, 'index.html')
  /** @type {string[]} */
  const missing = []
  /** @type {string[]} */
  const remote = []
  /** @type {string[]} */
  const localhost = []
  /** @type {string[]} */
  const errors = []

  if (!fs.existsSync(index)) {
    errors.push('Missing required entrypoint: index.html')
  }

  const requiredHints = [
    path.join(webRoot, '_next'),
    path.join(webRoot, 'game', 'assets'),
  ]
  for (const hint of requiredHints) {
    if (!fs.existsSync(hint)) errors.push(`Missing required directory: ${path.relative(webRoot, hint)}`)
  }

  for (const file of files) {
    const ext = extOf(file)
    if (!TEXT_EXTENSIONS.has(ext)) continue
    if (ext === '.txt' || ext === '.map' || ext === '.xml') continue
    const rel = path.relative(webRoot, file)
    const text = fs.readFileSync(file, 'utf8')

    if (/https?:\/\/localhost(?::\d+)?/i.test(text) && !rel.endsWith('.map')) {
      localhost.push(rel)
    }

    // Inline scripts are invisible to the attribute regexes below — audit them
    // separately so a hydration-killing absolute chunk URL can never pass.
    if (ext === '.html') {
      for (const problem of scanInlineScripts(text)) {
        missing.push(`${rel} → ${problem}`)
      }
    }

    const refs = new Set()
    for (const re of [ATTR_REF, CSS_URL, JS_STATIC]) {
      re.lastIndex = 0
      let m
      while ((m = re.exec(text))) {
        refs.add(m.groups.url)
      }
    }

    for (const raw of refs) {
      if (IGNORED_SCHEMES.test(raw)) continue
      if (raw.includes('${')) continue
      if (raw.includes('…') || raw.includes('...')) continue
      if (raw === '/' || raw === './' || raw === '.') continue
      if (rel === '__ww_compat.js' || rel.endsWith(`${path.sep}__ww_compat.js`)) continue
      if (/^https?:\/\//i.test(raw)) {
        if (!isAllowedRemote(raw)) remote.push(`${rel} → ${raw}`)
        continue
      }
      if (raw.startsWith('/')) {
        missing.push(`${rel} → unresolved root-absolute ${raw}`)
        continue
      }
      if (!raw.startsWith('./') && !raw.startsWith('../')) continue
      const decoded = decodeRef(raw)
      const fromWebRoot =
        (ext === '.js' || ext === '.html' || ext === '.webmanifest' || ext === '.json') &&
        (/^\.\/(game|_next|icons)\//.test(decoded) || ABSOLUTE_FILES.some((f) => decoded === `./${f}`))
      const resolved = path.resolve(fromWebRoot ? webRoot : path.dirname(file), fromWebRoot ? decoded.slice(2) : decoded)
      if (!resolved.startsWith(path.resolve(webRoot))) continue
      if (!fs.existsSync(resolved)) {
        missing.push(`${rel} → ${raw}`)
      }
    }
  }

  const gameAssets = path.join(webRoot, 'game', 'assets')
  const assetNames = fs.existsSync(gameAssets)
    ? fs.readdirSync(gameAssets).filter((n) => n.endsWith('.webp'))
    : []

  return {
    ok: errors.length === 0 && missing.length === 0 && localhost.length === 0,
    files: files.length,
    webpAssets: assetNames.length,
    errors,
    missing,
    remote,
    localhost,
  }
}
