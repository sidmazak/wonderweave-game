# Wonderweave — Image Generation Prompt Pack

Prompts for regenerating the game's art with GPT Image, derived from the
existing palette, tile lore and asset pipeline in this repo.

Drop-in target: `public/game/assets/<name>.webp`. Filenames must match the keys
in `src/lib/game/assets.ts` (`ALL_ASSETS`) exactly, because the loader builds
URLs as `/game/assets/${name}.webp?v=10`.

---

## 0. Read this first — technical settings

### API settings (gpt-image-1)

| Setting | Value | Why |
| --- | --- | --- |
| `background` | `"transparent"` | Required for every sprite. Without it you get a baked-in backdrop you must cut out by hand. |
| `output_format` | `"png"` | **Only PNG and WebP carry alpha.** JPEG silently flattens transparency onto white. Generate PNG, convert to WebP yourself (§7) — PNG is lossless so you keep a clean master. |
| `size` | `1024x1024` sprites · `1024x1536` portrait backgrounds | Generate large, downscale. Never upscale. |
| `quality` | `high` | Small sprites are unforgiving; artefacts show at tile size. |

### Two assets that must **NOT** be transparent

1. **Play Store icon (512×512)** — Google Play rejects alpha. Must be fully
   opaque, square, no rounded corners (Play applies its own mask).
2. **Backgrounds (`bg-*`)** — full-bleed scenes, no alpha needed.

Everything else should be transparent.

### Android adaptive icon safe zone

`adaptive-icon.png` foreground art must sit inside the **central 66%** of the
canvas. Android masks the outer ring to circles/squircles/rounded squares
depending on launcher — anything outside that centre circle *will* be cut off.
Keep Pip's ears and lantern well inside.

---

## 1. The style bible (prepend to every prompt)

This paragraph is what keeps 50 assets looking like one game. Paste it as the
opening of **every** generation, then append the per-asset description.

```
Cozy storybook fantasy mobile-game art. Hand-painted digital illustration with
soft airbrushed gradients, warm rim lighting, and gentle ambient occlusion —
like a high-end casual puzzle game icon set. Rounded, friendly, chunky shapes
with no sharp corners. Rich saturated jewel colours against warm parchment and
deep forest-green tones. Subtle inner glow on magical elements. Clean readable
silhouette that stays legible when scaled down to 64 pixels. Soft drop shadow
baked into the art, no harsh outlines, no cel-shading, no flat vector look, no
pixel art, no photorealism. Centred composition with even padding.
Transparent background.
```

**Negative guidance** (append if your tool supports it, or state inline):

```
No text, no letters, no watermark, no signature, no border, no frame, no
background scenery, no drop shadow on the canvas itself, no white box, no
checkerboard pattern.
```

---

## 2. Palette (taken from `globals.css` and `app.config.js`)

Quote these hex values directly in prompts — it dramatically improves
consistency.

| Role | Hex | Where it's used |
| --- | --- | --- |
| Deep forest (brand / splash) | `#101d13` | App background, native splash, adaptive icon background |
| Night vignette | `#0e1c14` | Scene overlays |
| Wood dark | `#5d3a1a` | Button text, panel edges |
| Wood mid | `#7c4a1e` | Panel borders |
| Wood warm | `#8a5a2b` | Most-used UI brown |
| Gold light | `#dfb36a` | Button fill, highlights |
| Gold bright | `#ffd76e` | Star fill, glow |
| Parchment | `#f4e9c8` | Panel background, body text on dark |
| Parchment pale | `#fff9e8` | Card interiors |
| Muted sand | `#c9b080` | Secondary text |
| Twilight blue | `#1e2848` | Codex / night backdrops |

---

## 3. App icon — highest priority

The launcher icon is the single most important asset. Pip the lantern bunny is
the mascot; the icon should read as *him*, not as a generic match-3 grid.

### 3.1 `icon.png` — main app icon (1024×1024, **opaque**)

```
[STYLE BIBLE]

A cozy storybook mobile game app icon. Centred: an adorable chubby white bunny
with long soft ears and a tiny pink scarf, holding up a small glowing golden
lantern that casts warm light across its face and chest. The bunny has a small
leaf sprout on its head. Big friendly dark eyes, gentle smile, rosy cheeks.
Behind it, a softly blurred deep forest-green background (#101d13) with a few
floating golden light motes and a faint constellation of tiny stars. The
lantern glow (#ffd76e) is the brightest point in the composition. Rich, warm,
inviting, premium casual-game polish. Square composition, subject fills about
70% of the frame, generous even margin. Fully opaque background — no
transparency.
```

Settings: `size 1024x1024`, `background: "opaque"`, `quality: high`.

### 3.2 `adaptive-icon.png` — Android foreground (1024×1024, transparent)

```
[STYLE BIBLE]

Only the character, no background: an adorable chubby white bunny with long
soft ears, a tiny pink scarf and a leaf sprout on its head, holding up a small
glowing golden lantern (#ffd76e) that warmly lights its face. Big friendly
eyes, gentle smile, rosy cheeks. The entire character including ear tips and
lantern must sit within the central 66% of the square canvas, with wide empty
transparent margin on all four sides. Transparent background.
```

Pair with background colour `#101d13` (already set in `app.config.js`).

### 3.3 `splash-icon.png` — native splash (1024×1024, transparent)

Same as 3.2 but a calmer pose — bunny seated, lantern held low, softer glow.
It sits on `#101d13` and should feel like a held breath before the game opens.

### 3.4 Play Store icon (512×512, **opaque**)

Reuse 3.1, downscaled to 512×512, exported with **no alpha channel**.

---

## 4. The eight charms (tiles) — the core loop

These are the most-seen assets in the game. They must be instantly
distinguishable **by silhouette and colour alone**, because players scan them in
peripheral vision at speed.

Shared tile prompt scaffold — replace the `>>>` line per charm:

```
[STYLE BIBLE]

A single glossy game charm icon for a match-3 puzzle board, centred on a
transparent background. Chunky rounded 3D form with a soft glass-like sheen, a
bright specular highlight in the upper left, warm rim light, and a gentle inner
glow. Reads clearly at 64 pixels. No container, no tile backing, no frame —
just the charm itself floating.

>>> [CHARM DESCRIPTION]
```

| File | Charm (in-game name) | `>>>` description |
| --- | --- | --- |
| `tile-leaf` | Verdant Leaf — *Root of Being* | A plump rounded emerald-green leaf with a soft golden central vein and a dewy glossy surface. Deep green `#2f7d32` to bright lime edge. |
| `tile-drop` | Dewdrop — *Flow of Time* | A rounded teardrop of clear blue water, translucent, with a bright white highlight and a soft cyan inner glow. Azure `#2e9bd8`. |
| `tile-flame` | Ember — *Spark of Life* | A rounded friendly flame, warm orange core fading to bright yellow tip, soft glowing edges. Orange `#f4722b` to gold `#ffd76e`. |
| `tile-star` | Stellar Charm — *Heart of Light* | A plump five-pointed golden star with rounded points, warm inner glow and a sparkle glint. Gold `#ffd76e` with amber shadow. |
| `tile-flower` | Bloom — *Breath of Sky* | A simple rounded five-petal blossom, soft pink-magenta petals with a warm golden centre. Pink `#f06fa8`. |
| `tile-mushroom` | Sporecap — *Veil of Night* | A chubby toadstool with a rounded deep-purple cap, pale cream spots and a short cream stem. Purple `#8a5ac9`. |
| `tile-gem` | Frost Gem — *Mind's Mirror* | A faceted rounded crystal in pale icy cyan-white, translucent with cool blue internal refractions and a bright highlight. Ice `#8fe3f0`. |
| `tile-orb` | Woven Orb — *Heart of Iron* | A polished sphere wrapped in fine braided golden thread, warm bronze-brown body with metallic sheen. Bronze `#b97f3e`. |

**Target size:** 256×256 (renders ~135px on a 1080p phone; 2× for crispness).

---

## 5. Specials, FX and chrome

| File | Size | Prompt (after style bible) |
| --- | --- | --- |
| `icon-bolt` | 128×128 | A small chunky golden lightning bolt with rounded edges and a warm glow, used as a badge overlay on a game tile. Gold `#ffd76e`. |
| `fx-rainbow` | 256×256 | A glossy rounded orb swirling with soft iridescent rainbow colours, prismatic and magical, gentle inner light, dreamy not neon. |
| `fx-sparkle` | 128×128 | A single soft four-point sparkle star of warm white-gold light with a gentle bloom, semi-transparent edges. |
| `fx-petal` | 128×128 | A single small soft pink flower petal, gently curved, translucent edges, drifting. |
| `star-sparkle` | 256×256 | A plump golden five-pointed star with rounded points and a bright sparkle glint, warm glow. |
| `heart-pink` | 128×128 | A small plump glossy pink heart with a soft highlight and gentle glow. |
| `medallion-lock` | 256×256 | A round ornate bronze medallion with a small closed padlock at its centre, weathered warm metal `#8a5a2b`, softly lit, conveying a locked chapter. |
| `frame-square` | 512×512 | An ornate square wooden picture frame, warm carved oak `#8a5a2b` with golden corner filigree, hollow transparent centre, viewed straight on. The inner opening must be a clean empty square. |

### UI icons — one prompt, four variants (128×128 each)

```
[STYLE BIBLE]

A single UI icon carved from warm polished wood (#8a5a2b) with a soft golden
rim light, rounded chunky forms, storybook game-UI style, centred on a
transparent background. No button, no circle behind it, just the glyph.

>>> icon-gear   : a rounded six-tooth gear/cog
>>> icon-back   : a thick rounded left-pointing arrow
>>> icon-close  : a thick rounded X cross
>>> icon-pause  : two thick rounded vertical bars
```

---

## 6. Characters, backgrounds and decor

### 6.1 The seven bunnies (256×360, transparent)

All share the same character design — chubby white bunny, long ears, rosy
cheeks, leaf sprout — differing only in pose and prop. **Generate
`bunny-lantern` first, then use it as a reference image** for the other six so
the character stays identical.

| File | Character | Pose |
| --- | --- | --- |
| `bunny-lantern` | Pip Lanternbearer — *The Guide* | Standing, holding a glowing golden lantern aloft, warm light on face |
| `bunny-cheer` | Cheerling — *The Bright* | Both arms raised in celebration, eyes closed, joyful |
| `bunny-wizard` | Sage Whiskers — *The Archmage* | Wearing a small pointed star-patterned purple wizard hat, holding a tiny staff, sleepy expression |
| `bunny-rest` | Dreamer — *The Sleepy* | Curled up asleep, ears drooping, tiny "z" free (no text — just a peaceful curl) |
| `bunny-heart` | Sweetheart — *The Devoted* | Holding a small glossy pink heart to its chest, adoring expression |
| `bunny-pack` | Wanderer — *The Traveler* | Wearing a small brown backpack, mid-stride, looking ahead |
| `bunny-walk` | Pathfinder — *The Brave* | Walking confidently in profile, determined little face |

### 6.2 Backgrounds (1024×1536 portrait, **opaque**)

Drop the transparency line from the style bible for these. They sit behind the
whole screen and are dimmed by a dark overlay in-game, so keep them **slightly
brighter and lower-contrast** than feels right — the app darkens them.

| File | Scene |
| --- | --- |
| `bg-castle` | A whimsical pastel fairytale castle on a floating grassy island, waterfall spilling off the edge, soft clouds, distant blue mountains, bright storybook daylight |
| `bg-sky` | Open sky with layered soft clouds and small distant floating islands, serene daytime |
| `bg-forest` | A sunlit enchanted forest glade, tall soft-canopy trees, golden light shafts, ferns |
| `bg-night` | A moonlit valley under a starry sky, deep blues and violets `#1e2848`, glowing fireflies |
| `bg-sunset` | Warm amber sunset over floating isles, orange and rose clouds, silhouetted trees |
| `bg-arch` | An ancient stone archway on a cliff edge, crystalline formations, cool twilight tones |
| `bg-altar` | A candlelit stone shrine interior, hanging lanterns, warm amber glow, mystical |
| `bg-ruins` | Overgrown crumbling stone ruins reclaimed by vines and moss, soft daylight |
| `bg-map` | A gentle aerial view of scattered floating islands linked by soft paths, seen from above, hazy atmosphere |

### 6.3 Decor (transparent, sizes noted)

| File | Size | Description |
| --- | --- | --- |
| `deco-island` | 512×384 | A small floating grassy island with earth and dangling roots beneath |
| `deco-island-falls` | 512×512 | As above with a thin waterfall spilling from one edge |
| `deco-platform` | 512×256 | A flat grassy floating platform, gentle top-down-ish angle |
| `deco-cloud-white` | 512×256 | A soft fluffy white cloud, rounded, painterly |
| `deco-cloud-pink` | 512×256 | Same form, warm rose-pink sunset tinting |
| `deco-tree` | 384×512 | A single rounded storybook tree with a soft full canopy |
| `deco-flowers` | 384×256 | A small cluster of simple pink and yellow wildflowers with grass |
| `deco-mushrooms` | 384×256 | A cluster of chubby red-capped toadstools with cream spots |
| `deco-arch` | 512×512 | A weathered stone archway, moss-touched, standing alone |
| `deco-lamp` | 256×384 | An ornate hanging iron lantern with warm glowing golden light |
| `deco-moon` | 384×384 | A soft pale crescent moon with a gentle halo glow |
| `deco-butterfly` | 256×256 | A small delicate butterfly with soft blue and orange wings |
| `deco-waterfall` | 384×512 | A narrow waterfall of soft blue-white water with mist at its base |
| `deco-sign` | 384×384 | A small wooden signpost, warm oak `#8a5a2b`, blank board (no text) |
| `logo` | 1024×582 | See below |

### 6.4 `logo` (1024×582, transparent)

The wordmark carries text, which image models render unreliably. **Recommended:
generate the ornamental frame only and set the type yourself** in a vector tool.

```
[STYLE BIBLE]

An ornate horizontal storybook game logo plaque: a curved polished oak banner
(#8a5a2b) with golden filigree edging, wrapped in lush green leaves, small pink
and white blossoms, and two small butterflies perched at the upper corners. A
smaller blank ribbon scroll drapes across the lower third. The centre of the
banner and the ribbon are EMPTY — no text, no letters, no characters of any
kind. Wide landscape composition. Transparent background.
```

Then set "Wonderweave" and "Threads of a Forgotten World" over it in a serif
face matching the in-game `.font-display` stack (Palatino Linotype / Book
Antiqua / Georgia).

---

## 7. Output pipeline — PNG in, WebP out

The game loads `.webp`. Generate PNG masters, keep them, ship WebP.

`sharp` is already a devDependency, so no new install:

```bash
# single file: PNG master -> game-ready WebP at a target width
node -e "require('sharp')('in.png').resize(256).webp({quality:90,effort:6}).toFile('public/game/assets/tile-leaf.webp')"
```

Batch the whole drop folder:

```bash
node -e "
const sharp=require('sharp'),fs=require('fs'),path=require('path');
const SRC='drop', OUT='public/game/assets';
const W={tile:256,icon:128,fx:128,bunny:256,deco:384,logo:1024,frame:512,bg:1024};
for (const f of fs.readdirSync(SRC).filter(f=>f.endsWith('.png'))) {
  const name=path.basename(f,'.png');
  const kind=Object.keys(W).find(k=>name.startsWith(k))||'deco';
  sharp(path.join(SRC,f)).resize({width:W[kind],withoutEnlargement:true})
    .webp({quality:90,effort:6}).toFile(path.join(OUT,name+'.webp'))
    .then(i=>console.log(name.padEnd(22),i.width+'x'+i.height,(i.size/1024).toFixed(1)+'KB'));
}
"
```

Then **bump the cache buster** in `src/lib/game/assets.ts`:

```ts
export const ASSET_VERSION = 11   // was 10
```

Without that bump, devices keep serving the old cached art.

Finally:

```bash
npm run build && npm run game:sync   # validator confirms nothing is missing
```

---

## 8. Keeping 50 assets consistent

1. **Generate the style anchor first.** Make `tile-leaf` and `bunny-lantern`,
   iterate until they're right, then feed them back as **reference images** for
   everything else. This matters far more than prompt wording.
2. **Do a family at a time** in one session — all eight tiles together, all
   seven bunnies together — so lighting and proportion stay matched.
3. **Check at final size, not full size.** Downscale to 64px and squint: if two
   charms blur into each other, the silhouettes aren't distinct enough.
4. **Verify alpha before converting** — a "transparent" PNG with a white box
   baked in is the most common failure:
   ```bash
   node -e "require('sharp')('in.png').metadata().then(m=>console.log(m.hasAlpha?'alpha OK':'NO ALPHA'))"
   ```
5. **Resolution note:** current art is small (`tile-leaf` is 51×53 but renders
   at ~135px, upscaled ~2.6×). Generating at the sizes above is a genuine
   sharpness upgrade, not just a restyle.

---

## 9. Asset checklist (50 files)

```
Chrome    logo star-sparkle icon-gear icon-back icon-close icon-pause
          medallion-lock frame-square
Tiles     tile-leaf tile-drop tile-flame tile-star tile-flower
          tile-mushroom tile-gem tile-orb
Specials  icon-bolt fx-rainbow
Bunnies   bunny-lantern bunny-cheer bunny-wizard bunny-rest bunny-heart
          bunny-pack bunny-walk
Scenes    bg-castle bg-map bg-arch bg-altar bg-night bg-forest bg-ruins
          bg-sky bg-sunset
Decor     fx-sparkle fx-petal heart-pink deco-lamp deco-island deco-platform
          deco-cloud-white deco-cloud-pink deco-tree deco-flowers deco-arch
          deco-butterfly deco-moon deco-mushrooms deco-waterfall deco-sign
Icons     icon.png adaptive-icon.png splash-icon.png (Expo app/assets/)
```
