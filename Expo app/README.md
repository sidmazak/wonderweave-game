# Wonderweave — Expo Android app

Native **Expo / React Native** shell that runs the Wonderweave web game from a **packaged local WebView** bundle.

- Runtime does **not** need the Next.js dev server, localhost, or Vercel  
- Game HTML/CSS/JS/assets live in `web/` (and are copied into the APK)  
- Original Next.js project (repo root) remains the gameplay source of truth  

```text
Expo app/
├── src/                 Native shell (WebView, bridge, storage, splash)
├── scripts/             game:sync, validate, e2e
├── plugins/             Copy web/ → android assets at prebuild
├── web/                 GENERATED static game bundle (do not hand-edit)
├── assets/              App icon / native splash (from game branding)
├── tests/               Unit / white-box / integration / smoke / black-box
├── test-artifacts/      Screenshots, logs, validation reports
└── documentation/       Architecture, migration, testing, limitations
```

## Prerequisites

- Node.js 20+ / npm  
- JDK **17** (`JAVA_HOME` — avoid JDK 25 for Gradle)  
- Android SDK + platform-tools (`ANDROID_HOME`)  
- Emulator or device  

See [`documentation/ENVIRONMENT.md`](./documentation/ENVIRONMENT.md).

## Quick start

```bash
# 1) Install Expo deps
cd "Expo app"
npm install

# 2) Build the Next.js game and sync into web/
npm run game:sync

# 3) Generate native android/ (first time) and run
npm run prebuild
npm run android
```

Release APK:

```bash
npm run game:sync
cd android
# with JAVA_HOME=JDK17
./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run game:build` | Next.js export only (`out/`) |
| `npm run game:sync` | Build + copy + path rewrite + compat inject + validate |
| `npm run expo:sync-web` | Same as `game:sync` |
| `npm run validate:webbundle` | Assert `web/` is self-contained |
| `npm run expo:start` | Expo dev client |
| `npm run android` | `expo run:android` (debug) |
| `npm run android:release` | Release variant via Expo |
| `npm test` | All Node test suites |
| `npm run test:unit` / `whitebox` / `integration` / `smoke` / `blackbox` | Focused suites |
| `npm run test:e2e` | Emulator launch + screenshots when ADB is available |

Sync options:

```bash
node scripts/sync-web-bundle.mjs              # full pipeline
node scripts/sync-web-bundle.mjs --skip-build # reuse existing out/
node scripts/sync-web-bundle.mjs --build-only # only next build
```

## Architecture (one glance)

```text
Next.js (repo root)
  → next build (static export)
  → Expo app/web/   (rewritten for file://)
  → APK assets/www/
  → full-screen WebView
  → same game (DOM + Web Audio + localStorage)
```

Details: [`documentation/ARCHITECTURE.md`](./documentation/ARCHITECTURE.md).

### Launch flow

1. Native splash — Pip image on `#101d13` (no title text)  
2. RN boot overlay — same image until WebView is ready  
3. In-game loader — castle backdrop + logo + progress  
4. Home  

### Important WebView fixes

- `TURBOPACK_CHUNK_BASE_PATH="./_next/"` (relative)  
- `fetch` → XHR polyfill for `file://`  
- Full-bleed layout (no desktop 480px letterbox)  
- Header: back + title on one row  

## Documentation

| Doc | Contents |
| --- | --- |
| [ARCHITECTURE.md](./documentation/ARCHITECTURE.md) | Pipeline, shell, security |
| [MIGRATION.md](./documentation/MIGRATION.md) | Inventory + strategy table |
| [TESTING.md](./documentation/TESTING.md) | How to run tests + evidence |
| [KNOWN_LIMITATIONS.md](./documentation/KNOWN_LIMITATIONS.md) | Honest gaps |
| [ENVIRONMENT.md](./documentation/ENVIRONMENT.md) | Toolchain notes |
| [PARITY_CHECKLIST.md](./documentation/PARITY_CHECKLIST.md) | Feature parity |
| [FINAL_REPORT.md](./documentation/FINAL_REPORT.md) | Migration status report |
| [PLAY_STORE.md](./documentation/PLAY_STORE.md) | Play Console listing + ASO copy |

Root product docs: [`../README.md`](../README.md), [`../AGENTS.md`](../AGENTS.md).
Web SEO checklist: [`documentation/WEB_SEO.md`](./documentation/WEB_SEO.md).

## Generated files

| Path | Hand-edit? |
| --- | --- |
| `web/` | **No** — regenerate with `npm run game:sync` |
| `android/` | **No** — from `expo prebuild` (typically gitignored) |
| `src/`, `scripts/`, `documentation/` | Yes |

## Package

- Name: `wonderweave-expo`  
- Application id: `com.wonderweave.game`  
- Expo SDK 54 / RN 0.81 / `react-native-webview` 13.15  

## Related

Canonical game lives one directory up: [`../README.md`](../README.md).
