# Google Play Store — ASO & listing copy

Use this document when creating or updating the Play Console listing for **`com.wonderweave.game`**.

App Store Optimization (ASO) helps conversion and discoverability. It does **not** by itself outrank Candy Crush Saga or other mega-budget match-3 titles. Wonderweave wins on a clear niche: **cozy, offline-friendly, handcrafted match-3 adventure** — not endless live-ops pressure.

---

## Positioning vs match-3 competitors

| Competitor pattern | Wonderweave angle |
| --- | --- |
| Always-online events, energy timers | Offline-first; play on your schedule |
| Generic candy / jewel skins | Floating isles, Folio lore, Pip the lantern bunny |
| Booster IAP pressure as core loop | Focus copy on craft, combos, chapters, cozy vibe |
| Broad “#1 puzzle” claims | Specific: cozy offline match-3 puzzle adventure |

**Primary intents to cover naturally:** match 3, match-3 puzzle, casual puzzle, offline puzzle, cozy game, tile matching.

Avoid keyword stuffing, ALL CAPS spam, or competitor trademark misuse in the title.

---

## Title (≤ 30 characters recommended)

```text
Wonderweave Match-3 Puzzle
```

Alternate (if you prefer brand-first shorter):

```text
Wonderweave: Match 3
```

Expo `app.config.js` uses a slightly longer `name` for store metadata; the **launcher label** is `Wonderweave`.

---

## Short description (≤ 80 characters)

```text
Cozy offline match-3. Swap charms, chain combos, explore isles with Pip!
```

(Character count: 72)

---

## Full description (paste into Play Console)

```text
Wonderweave is a cozy offline match-3 puzzle adventure across the floating isles.

Swap charms, spark dazzling combos, and weave your way through handcrafted chapters with Pip the lantern bunny. Seal the Folio, unlock new shores, and enjoy a relaxing tile-matching journey that respects your time — no always-online grind required to keep playing.

WHY PLAYERS LOVE WONDERWEAVE
• Classic match-3 puzzle gameplay with satisfying cascades and combos
• Cozy fantasy world — floating isles, magical charms, and Folio lore
• Offline-friendly progress stored on your device
• Portrait play designed for phones
• Beautiful WebP art and generative sound — immersive without clutter

HOW TO PLAY
1. Swap adjacent charms to make matches of three or more
2. Chain combos for bigger scores and spectacular clears
3. Complete chapter goals and discover new Lumens in the Codex
4. Return for Daily challenges when you want a quick session

If you enjoy match-3 puzzle games, casual puzzle adventures, or cozy single-player games, Wonderweave is built for you.

Download Wonderweave and start weaving your story today.
```

---

## Categories & tags

- **Application type:** Game  
- **Category:** Puzzle  
- **Tags (Console):** Match 3, Puzzle, Casual, Single player, Offline  

---

## Graphics checklist

| Asset | Spec (typical) | Source in repo |
| --- | --- | --- |
| App icon | 512×512 | `Expo app/assets/icon.png` / `public/icons/icon-512.png` |
| Feature graphic | 1024×500 | Create from `public/og-image.png` / game art |
| Phone screenshots | 16:9 or 9:16 | Capture from emulator / device after `game:sync` |
| Short promo video | Optional ≤30s | Title → board combo → chapter map |

Show: title screen, board with clear matches, chapter/atlas, Pip. Avoid misleading UI.

---

## Content rating & data

- Expect **Everyone** / low maturity for abstract puzzle (confirm via IARC questionnaire)  
- No ads / no account in current build — declare accurately in Data safety  
- Local save only (`ww-*` / AsyncStorage mirror)  

---

## Release notes template

```text
Wonderweave 0.2.5
• Cozy match-3 puzzle polish
• Full-screen Android play from packaged game bundle
• Progress saved on device
```

---

## Expo config fields (already set)

See `Expo app/app.config.js`:

- `name`: Wonderweave: Match-3 Puzzle  
- `description`: short store-oriented blurb  
- `android.label`: Wonderweave  
- `android.package`: com.wonderweave.game  
- `version` / `android.versionCode`: bump together on each Play upload  

After changing listing copy here, paste into Play Console — the APK does not embed the long description.
