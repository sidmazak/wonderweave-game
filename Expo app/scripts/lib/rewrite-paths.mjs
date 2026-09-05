/**
 * Make a Next.js static export loadable from a file:// WebView origin.
 *
 * Next emits root-absolute URLs (`/_next/...`, `/game/...`). Those resolve to
 * the device root under file://. HTML/JS references become document-relative
 * (`./_next/...`). CSS `url()` is resolved against the stylesheet, so those
 * become file-relative (`../../../game/...`).
 */
import path from 'node:path'

export const TEXT_EXTENSIONS = new Set([
  '.html',
  '.js',
  '.css',
  '.json',
  '.txt',
  '.xml',
  '.webmanifest',
  '.svg',
  '.map',
])

export const ABSOLUTE_DIRS = ['_next', 'game', 'icons', '_not-found']
export const ABSOLUTE_FILES = [
  'manifest.webmanifest',
  'og-image.png',
  'logo.svg',
  'robots.txt',
  'sitemap.xml',
  'favicon.ico',
  'apple-icon.png',
  'icon.png',
]

const LOCALHOST_ORIGIN = /https?:\/\/localhost:\d+/g

/** Public web origins baked into SEO meta — strip for file:// packaging. */
const PUBLIC_SITE_ORIGINS = [
  /https?:\/\/(?:www\.)?wonderweave\.app/gi,
]

/**
 * React's inline RSC/Flight hydration payload — `self.__next_f.push([id,"..."])` —
 * embeds a length-sensitive replay stream inside an escaped JS string literal.
 * Rewriting substrings inside it (asset paths, site origins, etc.) shortens or
 * lengthens that string without updating the Flight protocol's internal row
 * bookkeeping, which desyncs the client parser: the stream ends with chunks
 * still "pending" and React throws "Connection closed" (minified error #412),
 * hanging the app on the loading screen. The payload must pass through
 * untouched — the already-rewritten DOM markup elsewhere in the same document
 * is what the browser and hydration actually use for real src/href resolution.
 */
const NEXT_FLIGHT_PUSH = /self\.__next_f\.push\(\[\d+,("(?:[^"\\]|\\.)*")\]\)/g

function protectFlightPayloads(text) {
  const saved = []
  const protectedText = text.replace(NEXT_FLIGHT_PUSH, (match) => {
    const token = `__WW_FLIGHT_PAYLOAD_${saved.length}__`
    saved.push(match)
    return token
  })
  return { protectedText, saved }
}

function restoreFlightPayloads(text, saved) {
  let out = text
  for (let i = 0; i < saved.length; i++) {
    out = out.replace(`__WW_FLIGHT_PAYLOAD_${i}__`, () => saved[i])
  }
  return out
}

/** Root-absolute packaged-asset dir inside a Flight row (skips already-relative `./dir/`). */
const FLIGHT_ABSOLUTE_DIR = new RegExp(
  `(?<![.\\w])/(${ABSOLUTE_DIRS.map((d) => d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})/`,
  'g',
)

/**
 * Rewrite packaged-asset paths *inside* the Flight payload, row by row.
 *
 * The payload is a newline-separated stream of `id:<type><data>` rows. Only
 * `T` rows carry a hex byte-length prefix (`2:T103c,…`); changing their content
 * without updating that prefix desyncs React's parser (error #412, hang on the
 * loading screen), so those are left byte-identical — the compat layer fixes
 * their asset URLs at runtime instead. Every other row (notably `I` client
 * references, whose chunk paths React resolves during hydration, and `H`
 * preload hints) is plain JSON with no length bookkeeping and is safe to
 * rewrite. Leaving `I` rows absolute is what strands hydration on file://.
 */
function rewriteFlightRows(text) {
  let changes = 0
  NEXT_FLIGHT_PUSH.lastIndex = 0
  const out = text.replace(NEXT_FLIGHT_PUSH, (match, literal) => {
    let decoded
    try {
      decoded = JSON.parse(literal)
    } catch {
      return match
    }
    if (typeof decoded !== 'string') return match

    let rowChanges = 0
    const rows = decoded.split('\n').map((row) => {
      if (!row) return row
      const colon = row.indexOf(':')
      if (colon < 0) return row
      // Length-prefixed text row — must stay byte-identical.
      if (/^T[0-9a-f]*,/i.test(row.slice(colon + 1))) return row
      // Only root-absolute paths: a leading `.` (already relative) is left alone,
      // which keeps this pass idempotent.
      const next = row.replace(FLIGHT_ABSOLUTE_DIR, (_full, dir) => `./${dir}/`)
      if (next !== row) rowChanges += 1
      return next
    })

    if (rowChanges === 0) return match
    changes += rowChanges
    return match.replace(literal, () => JSON.stringify(rows.join('\n')))
  })
  return { text: out, changes }
}

function lookbehindSafePrefix(source, index) {
  if (index <= 0) return true
  const prev = source[index - 1]
  return prev !== '.' && prev !== '\\'
}

function posixRel(fromDir, toDir) {
  let rel = path.relative(fromDir, toDir).replaceAll('\\', '/')
  if (!rel) rel = '.'
  if (!rel.startsWith('.')) rel = `./${rel}`
  return rel
}

function dirPrefix(dir, options) {
  const { filePath, webRoot, stylesheet } = options || {}
  if (stylesheet && filePath && webRoot) {
    const rel = posixRel(path.dirname(filePath), path.join(webRoot, dir))
    return rel.endsWith('/') ? rel : `${rel}/`
  }
  return `./${dir}/`
}

function filePrefix(file, options) {
  const { filePath, webRoot, stylesheet } = options || {}
  if (stylesheet && filePath && webRoot) {
    return posixRel(path.dirname(filePath), path.join(webRoot, file))
  }
  return `./${file}`
}

/**
 * @param {string} text
 * @param {{ filePath?: string, webRoot?: string }} [options]
 */
export function rewriteAbsolutePaths(text, options = {}) {
  const filePath = options.filePath || ''
  const lower = filePath.toLowerCase()
  const stylesheet = lower.endsWith('.css')
  const isJs = lower.endsWith('.js')
  const opts = { ...options, stylesheet }
  let changes = 0

  const { protectedText, saved } = protectFlightPayloads(text)
  let out = protectedText.replace(LOCALHOST_ORIGIN, () => {
    changes += 1
    return '.'
  })
  for (const originRe of PUBLIC_SITE_ORIGINS) {
    originRe.lastIndex = 0
    out = out.replace(originRe, () => {
      changes += 1
      return '.'
    })
  }

  const dirs = isJs ? ABSOLUTE_DIRS.filter((d) => d !== '_next') : ABSOLUTE_DIRS

  for (const dir of dirs) {
    const token = `/${dir}/`
    const replacement = dirPrefix(dir, opts)
    let next = ''
    let i = 0
    while (i < out.length) {
      const found = out.indexOf(token, i)
      if (found === -1) {
        next += out.slice(i)
        break
      }
      if (lookbehindSafePrefix(out, found)) {
        next += out.slice(i, found) + replacement
        changes += 1
        i = found + token.length
      } else {
        next += out.slice(i, found + token.length)
        i = found + token.length
      }
    }
    out = next
  }

  if (isJs) {
    const patched = out.replace(
      /TURBOPACK_CHUNK_BASE_PATH:"\/_next\/"/g,
      'TURBOPACK_CHUNK_BASE_PATH:"./_next/"',
    )
    if (patched !== out) {
      out = patched
      changes += 1
    }
    const patched2 = out.replace(
      /TURBOPACK_CHUNK_BASE_PATH:"\\\/_next\/"/g,
      'TURBOPACK_CHUNK_BASE_PATH:"./_next/"',
    )
    if (patched2 !== out) {
      out = patched2
      changes += 1
    }
    // minified: TURBOPACK_CHUNK_BASE_PATH:"/_next/"  OR  :"\/_next/"  OR  :"/_next/"
    const patched3 = out.replace(
      /(TURBOPACK_CHUNK_BASE_PATH\?TURBOPACK_CHUNK_BASE_PATH:)"\/_next\/"/g,
      '$1"./_next/"',
    )
    if (patched3 !== out) {
      out = patched3
      changes += 1
    }
  }

  for (const file of ABSOLUTE_FILES) {
    const token = `/${file}`
    const replacement = filePrefix(file, opts)
    let next = ''
    let i = 0
    while (i < out.length) {
      const found = out.indexOf(token, i)
      if (found === -1) {
        next += out.slice(i)
        break
      }
      const after = found + token.length
      const nextChar = out[after]
      const consumedByPath = nextChar && /[A-Za-z0-9._-]/.test(nextChar)
      if (!consumedByPath && lookbehindSafePrefix(out, found)) {
        next += out.slice(i, found) + replacement
        changes += 1
        i = after
      } else {
        next += out.slice(i, after)
        i = after
      }
    }
    out = next
  }

  out = restoreFlightPayloads(out, saved)

  if (!isJs) {
    const flight = rewriteFlightRows(out)
    out = flight.text
    changes += flight.changes
  }

  return { text: out, changes }
}

export function shouldRewriteFile(filePath) {
  const lower = filePath.toLowerCase()
  const dot = lower.lastIndexOf('.')
  const ext = dot >= 0 ? lower.slice(dot) : ''
  return TEXT_EXTENSIONS.has(ext)
}
