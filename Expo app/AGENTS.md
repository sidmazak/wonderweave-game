# Wonderweave — Expo app agents guide

This folder is the **Android packaging shell** for Wonderweave. The playable game is the static Next.js export synced into `web/` and loaded in a full-screen WebView. Gameplay source of truth is the **repo root** Next.js project — do not rewrite the match-3 engine into React Native.

## Product (same game, two shells)

- **Wonderweave** — cozy offline match-3 puzzle adventure (Pip, floating isles, Folio).
- **Web:** root Next.js static export + SEO/PWA.
- **Android:** this Expo app (`com.wonderweave.game`) embeds `file:///android_asset/www/index.html`.

## How this package works

1. From repo root or here: `npm run game:sync` builds Next → rewrites paths → injects `webview-compat.js` → validates → writes `web/`.
2. Config plugin `plugins/withGameWebBundle.js` copies `web/` into Android assets at prebuild.
3. `GameScreen` hosts WebView; bridge handles READY / saves / haptics; `ShellOverlay` is image-only loading.
4. Critical WebView fixes: relative `TURBOPACK_CHUNK_BASE_PATH`, `fetch`→XHR on `file://`, full-bleed CSS, header grid alignment.

## Docs

| Doc | Use |
| --- | --- |
| [README.md](./README.md) | Build / run / scripts |
| [documentation/](./documentation/) | Architecture, testing, limitations |
| [documentation/PLAY_STORE.md](./documentation/PLAY_STORE.md) | Google Play ASO listing copy |
| [documentation/WEB_SEO.md](./documentation/WEB_SEO.md) | Points to root web SEO |
| [../AGENTS.md](../AGENTS.md) | Full product + web + Expo guide |
| [../README.md](../README.md) | Human overview |

## Do / don't

- **Do** re-sync after game or asset changes before shipping an APK.
- **Do** use JDK 17 for Gradle (see `documentation/ENVIRONMENT.md`).
- **Don't** hand-edit generated `web/`.
- **Don't** point the WebView at localhost for production builds.
- **Don't** reintroduce databases / Prisma / unused scaffold into this product.

# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.
