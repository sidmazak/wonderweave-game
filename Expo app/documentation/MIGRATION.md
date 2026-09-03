# Wonderweave Expo migration inventory

The original Next.js app remains the canonical game. Expo is a native shell that loads a **packaged static export** in a full-screen WebView.

Start here for humans: [../README.md](../README.md) · docs index: [README.md](./README.md).

## Source architecture (audited)

| Area | Existing implementation | Expo strategy | Status |
| --- | --- | --- | --- |
| UI | React client screens (Home, Atlas, Chapter, Play, Codex, Daily, Altar, Instruments) + modals | Preserve HTML/CSS/JS in WebView | **PASS** |
| Game logic | `src/lib/game/engine.ts` + `PlayScreen` | Preserve | **PASS** |
| Routing | Single App Router page `src/app/page.tsx` (`'use client'`); in-memory screen state | Static export of `/` ; no Next runtime | **PASS** |
| Assets | `public/game/assets/*.webp` via `A()` helper (`/game/assets/…?v=10`) | Copied into `web/game/assets`; paths rewritten to `./game/assets` | **PASS** |
| Audio | Web Audio API generative music/SFX (`src/lib/game/sound.ts`); no audio files | Same Web Audio graph; unlock on first pointer; lifecycle suspend via `visibilitychange` shim | **PASS** (gesture-gated) |
| Persistence | `localStorage` keys `ww-*` | Keep localStorage; mirror to AsyncStorage backup; hydrate on boot | **PASS** |
| Session | `sessionStorage` preload flag `ww-preloaded-v10` | Unchanged inside WebView session | **PASS** |
| Fonts | `next/font/google` Geist + Geist Mono (self-hosted at export); UI display stack Palatino/Georgia/serif | Geist woff2 in `_next/static/media`; Palatino is a system fallback | **PARTIAL** (Palatino) |
| Canvas/WebGL | None (DOM/CSS board) | N/A | N/A |
| Pointer | Pointer Events on the board (`touch-none`) | Unchanged | **PASS** |
| Fullscreen | `viewport-fit=cover`, `100dvh`, `max-width: 480px` meta column | Native immersive shell + inset CSS variables | **PASS** |
| Orientation | PWA `orientation: portrait` | Expo `PORTRAIT_UP` lock | **PASS** |
| Vibrations | `navigator.vibrate` gated by settings | WebView vibrate + `expo-haptics` bridge | **PASS** |
| External API | None at runtime | None | N/A |
| Next/image | Not used | N/A | N/A |
| API routes / middleware / SSR | None; `output: "export"` already set | Static `out/` → `web/` | **PASS** |
| Service workers / WASM / WebGL | None | N/A | N/A |
| file:// fetch / Turbopack | Next hydration + chunk loader | Relative `./_next/` BASE_PATH + XHR fetch polyfill | **PASS** |

## Screens / UI inventory

| Screen / overlay | Source | Notes |
| --- | --- | --- |
| Splash / loading | `WonderweaveGame` `LoadingScreen` | Real preload progress |
| Home | `HomeScreen` | Play, How to Play, Instruments, Pip |
| Atlas | `AtlasScreen` | Chapter map |
| Chapter | `ChapterScreen` | Stage select |
| Play | `PlayScreen` | Match-3 board, HUD, boosters |
| Pause | `PauseModal` | Resume / restart / options / quit |
| Win | `FolioSealedModal` | Rewards, next, home |
| Lose | `FolioLostModal` | Replay / home |
| How to Play | `HowToModal` | Tutorial |
| Instruments | `InstrumentsScreen` | Settings, rename, reset |
| Codex | `CodexScreen` | Lumens / entities / lore |
| Daily | `DailyScreen` | Daily folio |
| Altar / Relics | `AltarScreen` | Ritual spend |
| Discovery toasts | `DiscoveryToast` | Codex unlocks |
| Bottom nav | `BottomNav` | Home, Map, Codex, Relics, Daily |

## Persistence keys (must not be lost)

| Key | Purpose |
| --- | --- |
| `ww-player-id` | Anonymous player id |
| `ww-player-name` | Weaver name |
| `ww-progress` | Per-level stars + best score |
| `ww-lumens` | Currency (default 40) |
| `ww-inventory` | Boosters `{ lens, null }` |
| `ww-daily` | `{ last, streak }` |
| `ww-settings` | `{ musicVol, sfxVol, vibrations, particles }` |
| `ww-codex` | Discovered entry ids |
| `ww-codex-seen` | Last-seen codex count (badge) |
| `ww-preloaded-v10` | sessionStorage only |

## Assets

Runtime art is WebP under `public/game/assets/` (plus icons, og-image, manifest). `_originals/` is an editor backup and is **not** packaged.

Audio has **no files** — all tones are synthesized.

## Network

No gameplay network calls. Build-time only: `next/font/google` downloads Geist and **self-hosts** woff2 in the export. Metadata may contain `NEXT_PUBLIC_SITE_URL` (defaults to localhost); the sync rewriter strips localhost origins from the packaged HTML.

## Original-project changes

| File | Why |
| --- | --- |
| `tsconfig.json` | Exclude `Expo app` so Next typecheck does not compile the native shell |
| `eslint.config.mjs` | Ignore `Expo app` |
| `package.json` | Convenience scripts that delegate to the Expo app |
| `src/components/game/ui.tsx` (`ScreenHeader`) | Back + title + trailing action on one grid row (was absolute overlay + `pt-12`, misaligned on full-width mobile) |
| `src/app/globals.css` (`.screen-header-*`) | Match the inline header layout |

No game mechanics were changed.
