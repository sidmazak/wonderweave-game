# Final migration report — Wonderweave Expo

## Executive summary

Wonderweave’s client-side Next.js game is packaged as a **static export**, path-rewritten for offline `file://` use, synced into `Expo app/web/`, and shipped inside a **full-screen React Native WebView** on Android.

- Original Next.js project remains the gameplay source of truth  
- Runtime needs **no** Next.js server, localhost, or Vercel  
- Release APK loads `file:///android_asset/www/index.html`  

## Architecture

```text
Next.js game (canonical)
  → next build (output: "export") → out/
  → npm run game:sync → Expo app/web/ (+ APK assets/www)
  → Expo native shell
      → full-screen WebView
          → packaged local game
```

See [ARCHITECTURE.md](./ARCHITECTURE.md).

## Critical fixes

> **Release signing is NOT configured.** `android/app/build.gradle` still ships
> the template default, `release { signingConfig signingConfigs.debug }` — the
> public Android debug key (`storePassword 'android'`). Builds produced this way
> are fine for sideloading and testing, but **cannot be published to Google
> Play**. Generate an upload keystore and wire in a real release signingConfig
> before any store submission.

| Issue | Fix |
| --- | --- |
| Splash stuck at 0% (chunk base path) | Relative `TURBOPACK_CHUNK_BASE_PATH="./_next/"` + `fetch`→XHR polyfill |
| Splash stuck at 0% (flight payload) | `rewriteFlightRows()` rewrites RSC `I`/`H` rows; `T` rows stay byte-identical and are fixed at runtime by `__ww_compat.js` |
| Loader bar disagreed with the percentage | Removed the synthetic CSS fill animation and the duplicate CSS width transition; the bar is bound to real preload progress only |
| Side letterbox bars | Native shell disables desktop `max-width: 480px` |
| Back / title misaligned | `ScreenHeader` grid row (Next.js + CSS) |
| “Wonderweave” text flash at launch | Image-only RN boot overlay; native splash hides after READY |

## Important paths

| Area | Path |
| --- | --- |
| Native shell | `src/screens/GameScreen.tsx`, `src/app/App.tsx`, `src/components/ShellOverlay.tsx` |
| Bridge | `src/bridge/webview-compat.js`, `src/bridge/protocol.ts` |
| Sync | `scripts/sync-web-bundle.mjs`, `scripts/lib/*` |
| Plugin | `plugins/withGameWebBundle.js` |
| Config | `app.config.js`, `eas.json` |
| Original Next (minimal) | `tsconfig.json`, `eslint.config.mjs`, root `package.json` scripts, `ScreenHeader` / header CSS |

## Build commands

```bash
# Expo app/
npm install
npm run game:sync
npm run validate:webbundle
npm test
npm run android

# Release
cd android && ./gradlew assembleRelease
# → app/build/outputs/apk/release/app-release.apk
```

Root delegates: `npm run game:sync`, `npm run expo:start`.

JDK **17** required for Gradle. See [ENVIRONMENT.md](./ENVIRONMENT.md).

## Test results

| Suite | Status |
| --- | --- |
| Unit | **PASS** |
| Integration (self-contained bundle) | **PASS** |
| White-box | **PASS** |
| Black-box / parity | **PASS** |
| Smoke | **PASS** |
| E2E (emulator) | **PASS** |
| Full-bleed layout | **PASS** |
| Header alignment | **PASS** |
| Visual (manual screenshots) | **PASS** |
| Release build | **PARTIAL** — builds and installs, but debug-signed (see warning above) |
| Persistence | **PASS** |
| Offline launch | **PASS** |
| Automated pixel-diff vs Chrome | **NOT TESTED** |

Evidence: `../test-artifacts/` (screenshots, logs, `reports/web-bundle-validation.json`).

## Hostile QA

| Question | Answer |
| --- | --- |
| Produce Expo game without a running Next server? | **YES** — after `game:sync`, `web/` + APK are enough |
| Installed app runs from packaged files? | **YES** |
| Original game preserved? | **YES** (audited); Palatino may fall back on Android |
| Evidence? | **YES** — docs + `test-artifacts/` |

## Known limitations

See [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md).
