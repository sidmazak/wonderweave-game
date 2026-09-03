import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { rewriteAbsolutePaths, shouldRewriteFile } from './rewrite-paths.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function injectCompat(webRoot) {
  const indexPath = path.join(webRoot, 'index.html')
  if (!fs.existsSync(indexPath)) {
    throw new Error('Cannot inject compat: web/index.html is missing')
  }
  const compatSrc = path.join(__dirname, '..', '..', 'src', 'bridge', 'webview-compat.js')
  const compatDest = path.join(webRoot, '__ww_compat.js')
  fs.copyFileSync(compatSrc, compatDest)

  let html = fs.readFileSync(indexPath, 'utf8')
  const snippet =
    '<script>window.TURBOPACK_CHUNK_BASE_PATH="./_next/"</script><script src="./__ww_compat.js"></script>'
  if (!html.includes('__ww_compat.js')) {
    if (html.includes('<head>')) html = html.replace('<head>', `<head>${snippet}`)
    else html = snippet + html
  } else {
    // Keep BASE_PATH relative so it matches rewritten script src attributes.
    html = html.replace(
      /window\.TURBOPACK_CHUNK_BASE_PATH\s*=\s*new URL\("_next\/",location\.href\)\.href/g,
      'window.TURBOPACK_CHUNK_BASE_PATH="./_next/"',
    )
    html = html.replace(
      /try\{window\.TURBOPACK_CHUNK_BASE_PATH=new URL\("_next\/",location\.href\)\.href\}catch\(e\)\{window\.TURBOPACK_CHUNK_BASE_PATH="\.\/_next\/"\}/g,
      'window.TURBOPACK_CHUNK_BASE_PATH="./_next/"',
    )
  }
  fs.writeFileSync(indexPath, html)
  return { indexPath, compatDest }
}

export function rewriteTree(webRoot) {
  let files = 0
  let changes = 0
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name)
      if (ent.isDirectory()) walk(p)
      else if (ent.isFile() && shouldRewriteFile(p)) {
        const original = fs.readFileSync(p, 'utf8')
        const result = rewriteAbsolutePaths(original, { filePath: p, webRoot })
        if (result.changes > 0) {
          fs.writeFileSync(p, result.text)
          files += 1
          changes += result.changes
        }
      }
    }
  }
  walk(webRoot)
  return { files, changes }
}
