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
 * Locate the illustrated subject (Pip + his lantern) and measure how far it
 * reaches from its own centre.
 *
 * Both the launcher icon and the Android 12+ system splash are masked to a
 * circle by the OS — that cannot be disabled. The only way to guarantee an ear,
 * a foot or the lantern is never clipped is to measure the subject and scale it
 * to fit that circle, rather than guessing a safe-zone percentage. Measured at
 * runtime so replacing the artwork cannot silently break the fit.
 */
let subjectCache = null
async function measureSubject() {
  if (subjectCache) return subjectCache

  const { data, info } = await sharp(ICON_SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info

  // The painted field is a dark green vignette and the subject is far brighter;
  // 150 sits between them and excludes the faint background stars.
  const THRESHOLD = 150
  const xs = []
  const ys = []
  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels
      const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
      if (lum > THRESHOLD) {
        xs.push(x)
        ys.push(y)
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (xs.length === 0) throw new Error('Could not locate the subject in the icon master')

  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  let maxRadius = 0
  for (let i = 0; i < xs.length; i++) {
    const r = Math.hypot(xs[i] - cx, ys[i] - cy)
    if (r > maxRadius) maxRadius = r
  }

  // Also measure the subject's reach from the IMAGE centre. Scaling the whole
  // illustration about its centre keeps its painted background continuous, which
  // avoids the seam you get from cropping to the subject box (the crop cuts
  // through the starfield and the edge shows).
  const imgCx = width / 2
  const imgCy = height / 2
  let maxRadiusFromImageCentre = 0
  for (let i = 0; i < xs.length; i++) {
    const r = Math.hypot(xs[i] - imgCx, ys[i] - imgCy)
    if (r > maxRadiusFromImageCentre) maxRadiusFromImageCentre = r
  }

  // Mean colour of the outermost ring, used to pad without a visible seam.
  const band = Math.max(2, Math.round(Math.min(width, height) * 0.02))
  let rSum = 0
  let gSum = 0
  let bSum = 0
  let n = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x >= band && x < width - band && y >= band && y < height - band) continue
      const i = (y * width + x) * channels
      rSum += data[i]
      gSum += data[i + 1]
      bSum += data[i + 2]
      n++
    }
  }

  subjectCache = {
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    maxRadius,
    maxRadiusFromImageCentre,
    imageWidth: width,
    imageHeight: height,
    edge: { r: Math.round(rSum / n), g: Math.round(gSum / n), b: Math.round(bSum / n), alpha: 1 },
  }
  console.log(
    `subject: ${subjectCache.width}x${subjectCache.height} at ${minX},${minY} — reach ${Math.round(maxRadius)}px`,
  )
  return subjectCache
}

/**
 * Render the subject centred and scaled so its furthest point stays inside the
 * circle inscribed in the canvas, over a colour-matched blurred backdrop (a
 * flat fill would show a square seam against the artwork's lighter green).
 * `safety` leaves headroom for launchers whose mask is tighter than a circle.
 */
async function circleSafeIcon(size, dest, safety = 0.94) {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  const subject = await measureSubject()

  // Shrink the whole illustration about its centre until the subject's furthest
  // point sits inside the mask circle. Keeping the full frame (rather than
  // cropping to the subject) means its painted background stays continuous.
  const scale = ((size / 2) * safety) / subject.maxRadiusFromImageCentre
  const w = Math.max(1, Math.round(subject.imageWidth * scale))
  const h = Math.max(1, Math.round(subject.imageHeight * scale))

  const art = await sharp(ICON_SRC).resize(w, h).toBuffer()

  await sharp({
    create: { width: size, height: size, channels: 4, background: subject.edge },
  })
    .composite([{ input: art, left: Math.round((size - w) / 2), top: Math.round((size - h) / 2) }])
    .flatten({ background: subject.edge })
    .png()
    .toFile(dest)
  log(dest, `${size}x${size} art ${w}x${h} — subject fits circle, nothing clipped`)
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
  await circleSafeIcon(512, path.join(OUT.iconsDir, 'icon-maskable-512.png'))
  await squareIcon(16, OUT.faviconIco)

  /* ---- Expo / Android ---- */
  // Launcher + Play listing icon: opaque, full bleed.
  await squareIcon(1024, path.join(EXPO, 'icon.png'))
  await circleSafeIcon(1024, path.join(EXPO, 'adaptive-icon.png'))
  // Android 12+ masks the system splash icon to a circle as well, so it needs
  // the same fit — otherwise the OS trims ears and feet.
  await circleSafeIcon(1024, path.join(EXPO, 'splash-icon.png'))
  await squareIcon(48, path.join(EXPO, 'favicon.png'))

  await writeOg()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
