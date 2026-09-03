# Architecture

```text
Next.js Wonderweave (canonical game)
        │  next build   (output: "export")
        ▼
     out/   static HTML / CSS / JS + public assets
        │  npm run game:sync
        ▼
Expo app/web/     generated, path-rewritten, compat injected
        │  prebuild / gradle assets mirror
        ▼
android/.../assets/www/
        │
        ▼
React Native Expo shell
        │
        ▼
WebView  file:///android_asset/www/index.html
        │
        ▼
Original game runtime (React DOM + Web Audio + localStorage)
```

## Launch sequence

1. **Native splash** (`expo-splash-screen`) — Pip art on `#101d13`, no title text  
2. **RN boot overlay** — same image until the WebView posts `READY`  
3. **In-game loader** — `bg-castle` + `logo` + progress  
4. **Home / gameplay**  

## Native shell responsibilities

- Full-screen WebView, portrait lock, keep-awake, hidden navigation bar  
- Safe-area insets → CSS variables (`--ww-inset-*`)  
- Full-bleed layout (desktop 480px letterbox disabled in the shell)  
- Android back → in-game back heuristic (pause / close / nav / exit)  
- AsyncStorage mirror of `ww-*` keys  
- Haptics fallback via bridge  
- Image-only boot overlay; error overlay without stack traces in production  

## Generated vs source

| Path | Kind |
| --- | --- |
| `src/` | Native shell source |
| `scripts/` | Build / sync / validate / e2e |
| `plugins/withGameWebBundle.js` | Copies `web/` into APK assets at prebuild |
| `web/` | **Generated** game bundle — do not hand-edit |
| `android/` | **Generated** by `expo prebuild` (gitignored) |
| `documentation/` | Maintained docs |

## Path rewriting

Next export uses root-absolute URLs (`/_next/...`, `/game/...`). Under `file://` those resolve incorrectly. Sync rewrites to `./_next/...` and `./game/...` and sets:

```text
TURBOPACK_CHUNK_BASE_PATH="./_next/"
```

(relative — must match rewritten script `src` attributes). An absolute `file://` base deadlocks Turbopack chunk loading.

## Compatibility layer (`__ww_compat.js`)

Injected before Next scripts:

- Relative Turbopack base path  
- `fetch` → XHR polyfill for non-http(s) URLs (`file://` fetch fails on Android WebView)  
- Full-bleed / header spacing helpers for the native shell  
- `localStorage` mirror → native `SAVE_DATA`  
- Safe-area CSS variables, back-button heuristic, lifecycle `visibilitychange`, haptics  

## Security

- JavaScript on (required)  
- DOM storage on (required for saves)  
- File access on (required to read APK assets)  
- Navigation limited to `file://` and `about:blank`  
- `postMessage` types allowlisted; save keys must start with `ww-`  
