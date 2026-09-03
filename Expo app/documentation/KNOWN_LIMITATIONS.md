# Known limitations

## Desktop 480px column vs mobile full-bleed

On the web, `.ww-app-root` caps at `min(480px, 100vw)` (desktop letterboxing on `#101d13`). In the **native Expo WebView**, `__ww_compat.js` adds `html.ww-native-shell` and forces `max-width: none` so the game fills the device width. Verified on a 540 CSS-px emulator: `appW === vw`.

## Splash “frozen at 0%”

Resolved for packaging issues:

1. Relative `TURBOPACK_CHUNK_BASE_PATH="./_next/"`
2. `fetch` → XHR polyfill for `file://`
3. Optimistic loader animation while React hydrates the prerendered splash HTML

If you still see a stuck splash, uninstall the old APK and install the latest release build.

## Native splash vs in-game loader

Launch flow (intended):

1. **Native splash** — Pip image on `#101d13` only (no title text)
2. **RN boot overlay** — same Pip image (covers WebView until READY; also no text)
3. **In-game loader** — `bg-castle` + `logo` + progress (“Weaving the world…”)
4. **Home**

Previously a brief **“Wonderweave”** flash came from `ShellLoading` rendering brand text (“Opening the Folio…”) between the native image and the WebView loader. That text overlay is removed.

Android 12+ draws the native splash icon in a **circle**, so the wide wordmark is not used there. In-game loader uses full branding (`logo.webp`).

## Palatino display font

The game's `.font-display` stack is `'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, 'Times New Roman', serif`. Palatino Linotype is a proprietary Windows/macOS font and is **not** bundled (licensing). Android will use Georgia if present, otherwise the default serif. Geist body fonts **are** self-hosted in the export.

## Expo Go

The packaged `file:///android_asset/www/` bundle is only present in a **dev client / `expo run:android` / release APK**. Expo Go cannot ship those APK assets.

## `file://` origin requirements

The WebView loads APK assets via `file:///android_asset/www/`. Two compatibility measures are required and implemented in `__ww_compat.js`:

1. **`fetch` → XHR polyfill** — Chromium WebView rejects `window.fetch` for `file://` URLs (`TypeError: Failed to fetch`) while `XMLHttpRequest` succeeds. Next App Router hydration depends on `fetch`.
2. **`TURBOPACK_CHUNK_BASE_PATH="./_next/"`** — must stay **relative**, matching rewritten `<script src="./_next/...">` attributes. An absolute `file:///.../_next/` base deadlocks Turbopack chunk promises (splash stuck at 0%).

`localStorage` is persisted in the WebView's app data; AsyncStorage is a mirror/backup, not a second game database.

## WebView `env(safe-area-inset-*)`

Android WebView often reports 0 safe-area env() values. The shell injects `--ww-inset-*` from `react-native-safe-area-context` and overrides header/nav padding. Layout can still differ slightly vs Chrome on a phone.

## Audio autoplay

The original game already starts AudioContext on first `pointerdown` / `keydown`. Mobile WebViews can still delay or duck audio until that gesture. The shell sets `mediaPlaybackRequiresUserAction={false}`.

## Font preload `crossorigin` warnings

Geist `link rel=preload` with `crossorigin` may warn under `file://` (credentials mode mismatch). Fonts still load via `@font-face`; cosmetic console warnings only.

## Validator “remote URL” noise

`0cz1d0mv5g_q7.js` (URL polyfill / nomodule) contains literal strings like `https://a@b` used in tests inside the polyfill. These are **not** runtime network calls. The validator lists them for review; they are allowlisted as review-only, not blockers.

## Internet permission

The Android app still has the default INTERNET permission (Expo / WebView / tooling). The game bundle itself does not call a backend. Offline play was verified with wifi/data disabled.

## Tablets

The original UI caps the meta column at `min(480px, 100vw)` and letterboxes on a dark `#101d13` field. Play mode is full-bleed. That behavior is preserved, not redesigned for iPad-style layouts.

## iOS

This migration targets Android on Windows. An iOS `file://` bundle path is stubbed but not prebuilt or tested here.

## Debug vs release RN shell

`expo run:android` debug builds may still load the **React Native shell** from Metro. The **game HTML/assets** are always read from APK `assets/www`. Release APKs embed the RN JS bundle and do not require Metro.
