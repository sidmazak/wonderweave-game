#!/usr/bin/env node
/**
 * Local asset eraser — queue is synced from src/lib/game/assets.ts ALL_ASSETS only.
 * Run: npm run asset-eraser
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildManifest, loadStatuses, saveStatuses } from './lib.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const TOOL_DIR = __dirname
const STATUS_PATH = path.join(TOOL_DIR, 'status.json')
const ASSETS_TS = path.join(ROOT, 'src/lib/game/assets.ts')
const PORT = Number(process.env.ASSET_ERASER_PORT || 4317)

const CONFIG = {
  root: ROOT,
  assetsTsPath: ASSETS_TS,
  statusPath: STATUS_PATH,
  assetsDir: 'public/game/assets',
  backupDir: 'public/game/assets/_originals',
}

function manifest() {
  return buildManifest(CONFIG)
}

function assetPath(name) {
  const safe = path.basename(name).replace(/\.webp$/i, '')
  return path.join(ROOT, CONFIG.assetsDir, `${safe}.webp`)
}

function backupPath(name) {
  const safe = path.basename(name).replace(/\.webp$/i, '')
  const dir = path.join(ROOT, CONFIG.backupDir)
  fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, `${safe}.webp`)
}

function sendJson(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

function sendText(res, code, text) {
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end(text)
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`)
  const { pathname } = url

  try {
    if (pathname === '/' || pathname === '/index.html') {
      const html = fs.readFileSync(path.join(TOOL_DIR, 'index.html'))
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(html)
      return
    }

    if (pathname === '/api/manifest' && req.method === 'GET') {
      sendJson(res, 200, manifest())
      return
    }

    if (pathname.startsWith('/api/asset/') && req.method === 'GET') {
      const id = decodeURIComponent(pathname.slice('/api/asset/'.length))
      const file = assetPath(id)
      if (!fs.existsSync(file)) {
        sendText(res, 404, 'Asset not found')
        return
      }
      res.writeHead(200, { 'Content-Type': 'image/webp', 'Cache-Control': 'no-store' })
      fs.createReadStream(file).pipe(res)
      return
    }

    if (pathname.startsWith('/api/save/') && req.method === 'POST') {
      const id = decodeURIComponent(pathname.slice('/api/save/'.length))
      const file = assetPath(id)
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      const body = Buffer.concat(chunks)
      if (!body.length) {
        sendText(res, 400, 'Empty body')
        return
      }
      if (!fs.existsSync(file)) {
        sendText(res, 404, 'Asset not found')
        return
      }
      const backup = backupPath(id)
      if (!fs.existsSync(backup)) {
        fs.copyFileSync(file, backup)
      }
      fs.writeFileSync(file, body)
      const statuses = loadStatuses(STATUS_PATH)
      statuses[id] = { status: 'done', lastSavedAt: new Date().toISOString() }
      saveStatuses(STATUS_PATH, statuses)
      sendJson(res, 200, { ok: true, id, bytes: body.length, backup: path.relative(ROOT, backup) })
      return
    }

    if (pathname.startsWith('/api/status/') && req.method === 'PATCH') {
      const id = decodeURIComponent(pathname.slice('/api/status/'.length))
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      const payload = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
      const statuses = loadStatuses(STATUS_PATH)
      statuses[id] = { ...statuses[id], ...payload }
      saveStatuses(STATUS_PATH, statuses)
      sendJson(res, 200, statuses[id])
      return
    }

    if (pathname === '/api/reset-original' && req.method === 'POST') {
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      const { id } = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
      const backup = backupPath(id)
      const file = assetPath(id)
      if (!fs.existsSync(backup)) {
        sendText(res, 404, 'No backup for this asset')
        return
      }
      fs.copyFileSync(backup, file)
      sendJson(res, 200, { ok: true, id })
      return
    }

    sendText(res, 404, 'Not found')
  } catch (err) {
    console.error(err)
    sendJson(res, 500, { error: String(err) })
  }
})

server.listen(PORT, () => {
  const m = manifest()
  const done = m.queue.filter((q) => q.status === 'done').length
  console.log(`\n  Wonderweave Asset Eraser`)
  console.log(`  ${m.total} in-game assets (from ALL_ASSETS)`)
  console.log(`  ${done} marked done · ${m.total - done} pending`)
  if (m.missingOnDisk.length) console.log(`  ⚠ missing on disk: ${m.missingOnDisk.join(', ')}`)
  console.log(`  Open http://127.0.0.1:${PORT}\n`)
})
