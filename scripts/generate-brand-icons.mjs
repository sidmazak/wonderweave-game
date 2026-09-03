#!/usr/bin/env node
/**
 * Generate favicon, PWA icons, and OG image from Pip (bunny-lantern).
 * Run: npm run brand:icons
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const MASCOT = path.join(ROOT, 'public/game/assets/bunny-lantern.webp')
const LOGO = path.join(ROOT, 'public/game/assets/logo.webp')

const OUT = {
  appIcon: path.join(ROOT, 'src/app/icon.png'),
  appApple: path.join(ROOT, 'src/app/apple-icon.png'),
  faviconIco: path.join(ROOT, 'src/app/favicon.ico'),
  iconsDir: path.join(ROOT, 'public/icons'),
  og: path.join(ROOT, 'public/og-image.png'),
}

const BG = { r: 16, g: 29, b: 19, alpha: 1 }
const ACCENT = { r: 72, g: 130, b: 78, alpha: 1 }

async function roundedSquareBg(size, radiusRatio = 0.22) {
  const r = Math.round(size * radiusRatio)
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgb(52,118,62)"/>
        <stop offset="100%" stop-color="rgb(16,29,19)"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${r}" fill="url(#g)"/>
    <rect x="3" y="3" width="${size - 6}" height="${size - 6}" rx="${r - 2}" fill="none" stroke="rgba(200,232,168,0.55)" stroke-width="2"/>
  </svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

async function mascotOnSquare(size, { mascotScale = 0.72, topRatio = 0.14 } = {}) {
  const bg = await roundedSquareBg(size)
  const mascotH = Math.round(size * mascotScale)
  const mascot = await sharp(MASCOT)
    .resize({ height: mascotH, fit: 'inside' })
    .png()
    .toBuffer()
  const meta = await sharp(mascot).metadata()
  const left = Math.round((size - meta.width) / 2)
  const top = Math.round(size * topRatio)
  return sharp(bg)
    .composite([{ input: mascot, left, top }])
    .png()
}

async function writeIcon(size, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  const buf = await (await mascotOnSquare(size)).toBuffer()
  await sharp(buf).resize(size, size).png().toFile(dest)
  console.log('wrote', path.relative(ROOT, dest))
}

async function writeOg() {
  const w = 1200
  const h = 630
  const bgSvg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2a5a34"/>
        <stop offset="55%" stop-color="#162a1c"/>
        <stop offset="100%" stop-color="#0c1610"/>
      </linearGradient>
      <radialGradient id="glow" cx="28%" cy="62%" r="42%">
        <stop offset="0%" stop-color="rgba(255,220,120,0.22)"/>
        <stop offset="100%" stop-color="rgba(255,220,120,0)"/>
      </radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#sky)"/>
    <rect width="${w}" height="${h}" fill="url(#glow)"/>
  </svg>`
  const bg = await sharp(Buffer.from(bgSvg)).png().toBuffer()

  const mascot = await sharp(MASCOT).resize({ height: 420, fit: 'inside' }).png().toBuffer()
  const mascotMeta = await sharp(mascot).metadata()
  const logo = await sharp(LOGO).resize({ width: 520, fit: 'inside' }).png().toBuffer()
  const logoMeta = await sharp(logo).metadata()

  await sharp(bg)
    .composite([
      { input: mascot, left: Math.round(w * 0.08), top: Math.round(h * 0.18) },
      { input: logo, left: Math.round(w * 0.42), top: Math.round(h * 0.5 - logoMeta.height / 2) },
    ])
    .png()
    .toFile(OUT.og)
  console.log('wrote', path.relative(ROOT, OUT.og), `${w}x${h}`)
}

async function main() {
  if (!fs.existsSync(MASCOT)) throw new Error(`Missing mascot: ${MASCOT}`)

  await writeIcon(32, OUT.appIcon)
  await writeIcon(180, OUT.appApple)
  await writeIcon(180, path.join(OUT.iconsDir, 'apple-touch-icon.png'))
  await writeIcon(192, path.join(OUT.iconsDir, 'icon-192.png'))
  await writeIcon(512, path.join(OUT.iconsDir, 'icon-512.png'))

  // Maskable PWA icon — mascot inset for Android safe zone
  const maskable = await mascotOnSquare(512, { mascotScale: 0.58, topRatio: 0.2 })
  await maskable.toFile(path.join(OUT.iconsDir, 'icon-maskable-512.png'))
  console.log('wrote', path.relative(ROOT, path.join(OUT.iconsDir, 'icon-maskable-512.png')))

  const fav32 = await (await mascotOnSquare(32)).png().toBuffer()
  await sharp(fav32).toFile(path.join(OUT.iconsDir, 'favicon-32.png'))
  console.log('wrote', path.relative(ROOT, path.join(OUT.iconsDir, 'favicon-32.png')))

  const fav16 = await (await mascotOnSquare(16)).png().toBuffer()
  await sharp(fav16).toFile(OUT.faviconIco)
  console.log('wrote', path.relative(ROOT, OUT.faviconIco))

  await writeOg()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
