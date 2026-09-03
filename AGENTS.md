# Wonderweave — agent & contributor guide

Wonderweave is a **cozy, offline-first match-3 puzzle adventure**. Players swap charms, chain combos, explore floating isles with **Pip the lantern bunny**, and seal the Folio across handcrafted chapters. Progress is local (`localStorage` / AsyncStorage); audio is generative Web Audio (no MP3 library).

This repo ships **two surfaces that share one game**:

| Surface | Role |
| --- | --- |
| **Root Next.js app** | Canonical game source of truth (App Router, static export) |
| **`Expo app/`** | Production Android shell: packs the static export into a full-screen WebView |

Do **not** rewrite gameplay into React Native components. Do **not** depend on localhost or a remote Next server at mobile runtime.

---

## What the game is (product)

- **Genre:** match-3 / tile-matching puzzle with light adventure framing  
- **Tone:** cozy, handcrafted fantasy — not hyper-competitive live-ops grind  
- **Platforms:** web (PWA-capable static site) + Android (Expo WebView packaging)  
- **Persistence:** `ww-*` keys in `localStorage` (web); native shell can mirror via AsyncStorage  
- **Art:** WebP under `public/game/assets/`  
- **Orientation:** portrait  

### What it is *now* (architecture)

1. **Next.js 16** (`output: "export"`) builds a fully static site into `out/`  
2. Sync pipeline copies/rewrites that bundle into `Expo app/web/`  
3. Expo config plugin embeds `web/` into Android `assets/www`  
4. `GameScreen` loads `file:///android_asset/www/index.html` in `react-native-webview`  
5. Compat layer (`webview-compat.js`) fixes Android `file://` gaps (e.g. `fetch` → XHR)  

---

## Repo layout (production)

```text
wonderweave/
├── src/app/                 Next routes, layout (SEO), page → game
├── src/components/game/     UI screens, board, modals
├── src/lib/game/            Engine, levels, sound, codex, assets
├── src/hooks/use-progress.ts
├── public/                  Icons, OG image, manifest, game assets
├── scripts/                 Brand icon generation
├── tools/asset-eraser/      Optional art tooling
├── Expo app/                Android packaging (see Expo app/README.md)
├── AGENTS.md                This file
├── README.md                Human overview + scripts
└── .env.example             Optional NEXT_PUBLIC_SITE_URL only
```

**Removed / not part of the product:** Prisma, databases, `.zscripts`, `agent-ctx`, `download`, `examples`, `mini-services`, `tool-results`, `upload`, shadcn `src/components/ui`, empty API routes, and unused Radix/dashboard deps. Do not reintroduce them for this game.

---

## Next.js web project (nitty-gritty)

- **Entry:** `src/app/page.tsx` → `WonderweaveGame`  
- **SEO:** `src/app/layout.tsx` (metadata, Open Graph, Twitter, JSON-LD `VideoGame` / `WebApplication`), `sitemap.ts`, `robots.ts`, `public/manifest.webmanifest`  
- **Site URL:** `NEXT_PUBLIC_SITE_URL` (default `https://wonderweave.app`) for absolute sitemap/OG/canonical  
- **Styling:** Tailwind 4 + `globals.css`; desktop may constrain width; Expo shell forces full-bleed  
- **Build:** `npm run build` → `out/`; serve with `npm start`  
- **Docs for this Next version:** read `node_modules/next/dist/docs/` before assuming classic Next APIs  

### Critical mobile-packaging rules (web side)

- Keep the export **self-contained** (relative asset paths after sync)  
- Avoid APIs that break under Android `file://` without a compat polyfill  
- Prefer client-only game logic; no server actions required for core play  

---

## Expo / React Native project (nitty-gritty)

Path: **`Expo app/`** (space in the folder name — always quote paths).

| Piece | Purpose |
| --- | --- |
| `src/screens/GameScreen.tsx` | Full-screen WebView host |
| `src/bridge/` | Message protocol + `webview-compat.js` |
| `src/storage/persistStore.ts` | Native persistence bridge |
| `src/components/ShellOverlay.tsx` | Native loading overlay (image-only; avoid text flash) |
| `scripts/sync-web-bundle.mjs` | Build → copy → rewrite → inject compat → validate |
| `plugins/withGameWebBundle.js` | Copy `web/` into Android assets at prebuild |
| `documentation/` | Architecture, migration, testing, Play Store ASO |
| `documentation/PLAY_STORE.md` | Google Play title, short/long description, keywords |

**Pipeline:** `next build` → `out/` → `npm run game:sync` → `Expo app/web/` → APK `assets/www`.

**ASO:** store-facing copy is authored in `PLAY_STORE.md` and reflected lightly in `app.config.js` (`name`, `description`, `android.label`). Ranking still depends on installs/retention — metadata alone does not guarantee #1 vs Candy Crush–class titles; differentiate on cozy/offline/handcrafted positioning.

**Tooling notes:** JDK **17** for Gradle (avoid JDK 25); see `Expo app/documentation/ENVIRONMENT.md`.

---

## Commands cheat sheet

```bash
# Web
npm install
npm run dev
npm run build && npm start

# Sync into Expo + validate
npm run game:sync

# Expo (from Expo app/)
cd "Expo app" && npm install && npm test && npm run android
```

---

## Agent do / don't

**Do**

- Treat root Next.js game code as source of truth  
- Re-sync the web bundle after gameplay or asset changes before shipping APK  
- Keep SEO/ASO copy accurate, benefit-led, and non-spammy  
- Preserve portrait, offline-first, and Pip / Folio fiction  

**Don't**

- Add databases, Prisma, or server APIs unless the product explicitly needs them  
- Depend on network for core match-3 play  
- Hand-edit generated `Expo app/web/` (regenerate via sync)  
- Commit `.env` or secrets  

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
