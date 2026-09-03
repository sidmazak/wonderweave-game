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
