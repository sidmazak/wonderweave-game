import fs from 'node:fs'
import path from 'node:path'

export const SKIP_DIR_NAMES = new Set([
  '_originals',
  'node_modules',
  '.git',
  '.next',
  'cache',
])

export const SKIP_FILE_NAMES = new Set(['.DS_Store', 'Thumbs.db'])

/**
 * Recursively copy `src` → `dest`, skipping known non-runtime directories.
 * @param {string} src
 * @param {string} dest
 * @returns {{ files: number, bytes: number }}
 */
export function copyBundle(src, dest) {
  let files = 0
  let bytes = 0

  function walk(from, to) {
    fs.mkdirSync(to, { recursive: true })
    for (const ent of fs.readdirSync(from, { withFileTypes: true })) {
      if (SKIP_FILE_NAMES.has(ent.name)) continue
      if (ent.isDirectory() && SKIP_DIR_NAMES.has(ent.name)) continue
      const s = path.join(from, ent.name)
      const d = path.join(to, ent.name)
      if (ent.isDirectory()) {
        walk(s, d)
      } else if (ent.isFile()) {
        fs.copyFileSync(s, d)
        files += 1
        bytes += fs.statSync(s).size
      }
    }
  }

  walk(src, dest)
  return { files, bytes }
}

/**
 * @param {string} dir
 */
export function emptyDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
}
