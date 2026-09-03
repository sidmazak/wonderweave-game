# Wonderweave

**Cozy offline match-3 puzzle adventure** — swap charms, chain combos, explore floating isles with Pip the lantern bunny, and seal the Folio.

This repository is production-focused and contains only what the game needs:

1. **Canonical web game** — Next.js 16 (App Router) static export, SEO/PWA ready  
2. **`Expo app/`** — Android shell that packages that export into a local full-screen WebView  

```text
wonderweave/
├── src/                     Game UI + engine (source of truth)
├── public/                  WebP art, icons, OG image, PWA manifest
├── out/                     Static export (from npm run build)
├── Expo app/                Expo / Android WebView container
├── scripts/                 Brand icon helpers
├── tools/asset-eraser/      Optional art tooling
├── AGENTS.md                Deep contributor / agent guide
└── .env.example             Optional NEXT_PUBLIC_SITE_URL
```

Scaffolding that is **not** part of this product (Prisma, databases, mini-services, example servers, agent-ctx, uploads, unused shadcn UI kits, etc.) has been removed.

## Play on the web

```bash
npm install
npm run dev          # http://localhost:3000
```

Production static build:

```bash
npm run build        # writes out/
npm start            # serves out/ on port 3000
```

Optional: set `NEXT_PUBLIC_SITE_URL` (see `.env.example`) so sitemap, robots, Open Graph, and JSON-LD use your real public origin.

Requirements: **Node.js 20+** (22 recommended), npm.

## SEO (web)

Configured in `src/app/layout.tsx`, `sitemap.ts`, `robots.ts`, and `public/manifest.webmanifest`:

- Title / description / keywords aimed at match-3 & cozy puzzle intent  
- Open Graph + Twitter large image (`/og-image.png`)  
- JSON-LD `WebSite` + `WebApplication` + `VideoGame`  
- Absolute sitemap when `NEXT_PUBLIC_SITE_URL` is set  

Deploy the `out/` folder to any static host and submit the sitemap in Search Console.

## Android (Expo)

The mobile app does **not** call the Next.js server at runtime. It loads a synced static bundle from APK assets.

```bash
npm run game:sync          # from repo root: build + sync into Expo app/web
cd "Expo app"
npm install
npm run android
```

Google Play listing copy & ASO notes: [`Expo app/documentation/PLAY_STORE.md`](./Expo%20app/documentation/PLAY_STORE.md).  
Full mobile docs: [`Expo app/README.md`](./Expo%20app/README.md) and [`Expo app/documentation/`](./Expo%20app/documentation/).

## Scripts (root)

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js development server |
| `npm run build` / `npm run game:build` | Static export → `out/` |
| `npm run game:sync` | Build + sync bundle into `Expo app/web/` |
| `npm run expo:sync-web` | Alias for `game:sync` |
| `npm run expo:start` | Start Expo (delegates to `Expo app`) |
| `npm run start` | Serve the static `out/` folder |
| `npm run lint` | ESLint |
| `npm run brand:icons` | Regenerate PWA / brand icons |
| `npm run asset-eraser` | Local art tooling server |

## Game notes

- Fully **client-side** — progress in `localStorage` (`ww-*` keys)  
- Audio is **Web Audio** (no MP3 assets)  
- Art is WebP under `public/game/assets/`  
- Orientation is **portrait**  
- Static export: `output: "export"` in `next.config.ts`  

## Documentation map

| Doc | Location |
| --- | --- |
| This README | Web game + repo overview |
| AGENTS.md | Architecture, do/don’t, nitty-gritty for agents |
| Expo README | Mobile build / run / test |
| Play Store ASO | `Expo app/documentation/PLAY_STORE.md` |
| Web SEO checklist | `Expo app/documentation/WEB_SEO.md` |
| Architecture | `Expo app/documentation/ARCHITECTURE.md` |
| Migration | `Expo app/documentation/MIGRATION.md` |
| Testing | `Expo app/documentation/TESTING.md` |
| Known limitations | `Expo app/documentation/KNOWN_LIMITATIONS.md` |
| Environment | `Expo app/documentation/ENVIRONMENT.md` |

## License / assets

Game art and branding are project assets. Do not replace them with unrelated placeholders when packaging the mobile app.
