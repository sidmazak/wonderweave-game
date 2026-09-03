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
  let out = text.replace(LOCALHOST_ORIGIN, () => {
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

  return { text: out, changes }
}

export function shouldRewriteFile(filePath) {
  const lower = filePath.toLowerCase()
  const dot = lower.lastIndexOf('.')
  const ext = dot >= 0 ? lower.slice(dot) : ''
  return TEXT_EXTENSIONS.has(ext)
}
