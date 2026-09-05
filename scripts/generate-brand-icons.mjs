#!/usr/bin/env node
/**
 * Generate every launcher / PWA / store icon from the master Pip artwork.
 * Run: npm run brand:icons
 *
 * The master (`brand/app-icon-source.png`) is a finished square icon
 * composition — Pip with his lantern on a painted deep-forest field — so it is
 * used directly rather than being composited onto a generated background.
 *
 * Three rules drive the variants:
 *   - Play Store and launcher icons must be FULLY OPAQUE (Play rejects alpha).
 *   - Maskable / adaptive icons stay full-bleed. Insetting into the safe zone
 *     and padding with a flat colour leaves a visible square seam against the
 *     artwork's own lighter background; here the subject already sits inside
 *     the inscribed circle, so a mask only trims the corner starfield.
 *   - The splash image is feathered to transparent at the edges so it blends
 *     into the splash background instead of reading as a square tile.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// Build-time master, deliberately OUTSIDE public/ — anything under public/ is
// copied verbatim into the static export and shipped inside the APK.
const ICON_SRC = path.join(ROOT, 'brand/app-icon-source.png')
const LOGO = path.join(ROOT, 'public/game/assets/logo.webp')

const EXPO = path.join(ROOT, 'Expo app/assets')
const OUT = {
  appIcon: path.join(ROOT, 'src/app/icon.png'),
  appApple: path.join(ROOT, 'src/app/apple-icon.png'),
  faviconIco: path.join(ROOT, 'src/app/favicon.ico'),
  iconsDir: path.join(ROOT, 'public/icons'),
  og: path.join(ROOT, 'public/og-image.png'),
}

/** Brand background — matches `android.adaptiveIcon.backgroundColor` and the splash. */
const BG = { r: 16, g: 29, b: 19, alpha: 1 } // #101d13

function log(dest, note = '') {
  console.log('wrote', path.relative(ROOT, dest), note)
}

/** Square icon, fully opaque, art filling the frame. */
async function squareIcon(size, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  await sharp(ICON_SRC)
    .resize(size, size, { fit: 'cover' })
    .flatten({ background: BG })
    .png()
    .toFile(dest)
  log(dest, `${size}x${size} opaque`)
}

/**
 * Maskable / adaptive icon.
 *
 * Deliberately full-bleed rather than inset. Insetting the art and padding with
 * a flat colour leaves a visible square seam, because the artwork's own
 * background is a lighter green than #101d13. Measured against this master, the
 * bunny, both ear tips and the lantern all fall inside the circle inscribed in
 * the canvas, so a circular mask only crops the corner starfield — which reads
 * as intentional vignetting. Content stays safe and there is no seam.
 */
async function maskableIcon(size, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  await sharp(ICON_SRC)
    .resize(size, size, { fit: 'cover' })
    .flatten({ background: BG })
    .png()
    .toFile(dest)
  log(dest, `${size}x${size} full-bleed maskable`)
}

/**
 * Splash artwork: full-bleed, with the edges feathered to transparent so the
 * square melts into the splash background instead of showing as a tile.
 */
async function splashIcon(size, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  const fade = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="f" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#fff" stop-opacity="1"/>
        <stop offset="72%" stop-color="#fff" stop-opacity="1"/>
        <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="url(#f)"/>
  </svg>`
  await sharp(ICON_SRC)
    .resize(size, size, { fit: 'cover' })
    .composite([{ input: Buffer.from(fade), blend: 'dest-in' }])
    .png()
    .toFile(dest)
  log(dest, `${size}x${size} feathered splash`)
}

/** Social preview: Pip on the left, wordmark on the right. */
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

  // Round the mascot tile so it sits on the gradient without a hard square edge.
  const mascotSize = 430
  const radius = Math.round(mascotSize * 0.2)
  const maskSvg = `<svg width="${mascotSize}" height="${mascotSize}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${mascotSize}" height="${mascotSize}" rx="${radius}" fill="#fff"/>
  </svg>`
  const mascot = await sharp(ICON_SRC)
    .resize(mascotSize, mascotSize, { fit: 'cover' })
    .composite([{ input: Buffer.from(maskSvg), blend: 'dest-in' }])
    .png()
    .toBuffer()

  const logo = await sharp(LOGO).resize({ width: 560, fit: 'inside' }).png().toBuffer()
  const logoMeta = await sharp(logo).metadata()

  await sharp(bg)
    .composite([
      { input: mascot, left: Math.round(w * 0.06), top: Math.round((h - mascotSize) / 2) },
      { input: logo, left: Math.round(w * 0.42), top: Math.round(h * 0.5 - logoMeta.height / 2) },
    ])
    // Social scrapers fetch this on every share; keep it small. Palette
    // quantisation suits this flat-gradient composition without visible banding.
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toFile(OUT.og)
  log(OUT.og, `${w}x${h}`)
}

async function main() {
  if (!fs.existsSync(ICON_SRC)) throw new Error(`Missing icon master: ${ICON_SRC}`)

  /* ---- web / PWA ---- */
  await squareIcon(32, OUT.appIcon)
  await squareIcon(180, OUT.appApple)
  await squareIcon(180, path.join(OUT.iconsDir, 'apple-touch-icon.png'))
  await squareIcon(32, path.join(OUT.iconsDir, 'favicon-32.png'))
  await squareIcon(192, path.join(OUT.iconsDir, 'icon-192.png'))
  await squareIcon(512, path.join(OUT.iconsDir, 'icon-512.png'))
  await maskableIcon(512, path.join(OUT.iconsDir, 'icon-maskable-512.png'))
  await squareIcon(16, OUT.faviconIco)

  /* ---- Expo / Android ---- */
  // Launcher + Play listing icon: opaque, full bleed.
  await squareIcon(1024, path.join(EXPO, 'icon.png'))
  await maskableIcon(1024, path.join(EXPO, 'adaptive-icon.png'))
  await splashIcon(1024, path.join(EXPO, 'splash-icon.png'))
  await squareIcon(48, path.join(EXPO, 'favicon.png'))

  await writeOg()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
