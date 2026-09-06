# Wonderweave — Engineering Audit

**Scope:** repository-wide production readiness audit of the Wonderweave match-3
game (Next.js static export + Expo Android WebView shell), including remediation
of every defect found and device verification of the fixes.

**Build audited:** `com.wonderweave.game` v0.2.5 (versionCode 25)
**Verification device:** Android emulator, API 35 (`Metronoma_API35`)

---

## 1. Executive summary

The repository implements the architecture its documentation describes: a single
canonical Next.js game, statically exported and packaged unmodified into an
Android WebView. There is no duplicated React Native game implementation, no
backend dependency, and no localhost dependency in the shipped package. Those
architectural claims were verified, not assumed.

The critical finding of this audit was not a code smell — it was that **the
packaged Android app was completely non-functional while every automated gate
reported success**. `game:sync` reported OK, the bundle validator reported
`ok: true`, all tests passed, and Gradle built cleanly, yet the installed app
hung forever on `WEAVING THE WORLD… 0%` because React never hydrated. That was
only discovered by launching the release APK on a device.

That single fact shaped the rest of the work: the verification apparatus was as
defective as the code, so both were repaired.

**Current state:** all identified code and documentation defects are closed and
verified on-device. Two items remain, both process rather than code:
release signing and committing the work.

---

## 2. Verification results

| Gate | Command | Result |
| --- | --- | --- |
| Typecheck | `npx tsc --noEmit` | **0 errors** |
| Lint | `npm run lint` | **exit 0**, no output |
| Game engine tests | `npm test` | **49 / 49** |
| Packaging tests | `cd "Expo app" && npm test` | **42 / 42** |
| Static export | `npm run build` | Compiles, type-checked, 6 static routes |
| Bundle sync | `npm run game:sync` | OK — 101 files, 50 WebP |
| Device E2E | `npm run test:maestro` | **4 / 4 flows, 62 steps, 0 failures** |

**91 automated tests + 4 device flows.** At the start of the audit there were 27
tests, all covering packaging only — none covering gameplay.

---

## 3. Critical findings (resolved)

### 3.1 Android app never hydrated — permanent 0% loader

**Severity:** Critical · **Status:** Fixed and device-verified

The release APK launched, showed the loading screen, and never progressed. Root
cause chain, established with Chrome DevTools attached to the WebView:

```
ChunkLoadError: Failed to load chunk /_next/static/chunks/3fntmmi971322.js
net::ERR_FILE_NOT_FOUND  file:///_next/static/chunks/3fntmmi971322.js
```

Under `file://`, a root-absolute `/_next/...` resolves to the **device
filesystem root**, not the APK asset directory.

The source was an uncommitted working-tree edit that added
`protectFlightPayloads()` to `scripts/lib/rewrite-paths.mjs`. It masked React's
RSC Flight payload from path rewriting to avoid React error #412 — a real
hazard — but left that payload's client-reference chunk URLs root-absolute.

**Resolution.** The payload's row structure decides the correct behaviour.
Inspection showed exactly **one** length-prefixed `T` row (the #412 hazard) and
nine plain-JSON `I` rows (which React resolves during hydration):

- `rewriteFlightRows()` rewrites `I`, `H` and JSON rows to relative paths.
- `T` rows are left **byte-identical**; their absolute URLs are corrected at
  runtime by `__ww_compat.js`, which normalises root-absolute packaged-asset
  paths on element `src`/`href` and `XMLHttpRequest.open`.

**Why every gate missed it.** The bundle validator extracted references with
`(?:src|href|poster|data)=["']…` — HTML attributes only. The broken URLs lived
inside an inline `<script>` blob, invisible to that regex.

### 3.2 Weaver-name rename was broken in production

**Severity:** Critical · **Status:** Fixed

`InstrumentsScreen.tsx` called an undefined `setName`, so the rename field
silently rejected every keystroke. This is a genuine TypeScript error
(`TS2304`) that shipped because `next.config.ts` set
`typescript.ignoreBuildErrors: true`. Fixed to `setNameDraft`; the build now
type-checks (§4.1).

---

## 4. High-severity findings (resolved)

### 4.1 Type errors were suppressed at build time

`ignoreBuildErrors: true` meant `npm run build` printed *"Skipping validation of
types"*. This is what allowed §3.2 to ship. Now `false`; the build reports
*"Running TypeScript"* and fails on type errors.

### 4.2 Loading bar contradicted the percentage

Two independent defects, both measured over Chrome DevTools by sampling the
label, the inline width and the actually-painted width together:

1. The compat layer injected a **synthetic CSS animation**
   (`@keyframes ww-native-load … 100%{width:88%}` with `forwards`). A CSS
   animation overrides an inline width, so the bar always swept to 88% and
   froze there — a dead app still looked like it was loading.
2. After removing that, the bar still trailed the number because progress was
   eased **twice**: once in JS via `requestAnimationFrame`, and again by a CSS
   `transition: width 0.25s`.

| | Label vs painted bar | Desynced samples |
| --- | --- | --- |
| Before | 83% label → 61.9% bar | **11** |
| After | 85% label → 83.5% bar | **0** |

The loader now sweeps a genuine 3% → 100% over ~1.85s. Residual ≈1.5pp is the
track's 2px border in the measurement, not lag.

### 4.3 Input lock could permanently freeze the board

`attemptSwap` and `nullifyCell` set `lock(true)` and released it only on the
normal path. Any exception mid-cascade left `busyRef.current === true` forever —
the board silently stopped accepting input for the rest of the level. Both are
now wrapped in `try/finally { lock(false) }`.

### 4.4 Bundle validator could not see inline scripts

The gap that let a dead bundle report `ok: true` (§3.1). `scanInlineScripts()`
now audits inline `<script>` bodies and encodes the invariant learned here:

- root-absolute paths in Flight `I`/`H` rows → **fail the build**
- root-absolute paths in a length-prefixed `T` row → **allowed** (runtime-patched)

Verified in both directions: it fails a bundle with an absolute `I`-row chunk,
and still passes the real bundle.

### 4.5 Prebuild warned instead of failing

`plugins/withGameWebBundle.js` logged a warning and continued when `web/` was
missing, which silently produces an APK with no game in it. It now throws, and a
test invokes the mod to assert the rejection.

### 4.6 No automated tests for the game engine

All 27 original tests covered packaging and the native bridge. Match detection,
cascades, gravity, scoring, objectives and the save layer had **zero** coverage —
which is why the asset cleanup and the persistence refactor each required manual
device verification.

Added **49 tests** at the repo root, running against the real TypeScript via
Node's type stripping (`--experimental-strip-types`) with **no new dependencies**
— these modules import only types, so nothing needs compiling.

---

## 5. Medium findings (resolved)

| # | Finding | Resolution |
| --- | --- | --- |
| 5.1 | 27 of 77 WebP assets (466 KB) shipped but never referenced | Deleted after a repo-wide reference scan that resolved every dynamic `A()` call. Bundle: 128 → 101 files, 3.31 → 2.86 MiB |
| 5.2 | No React error boundary — any render error blanked the app | `GameErrorBoundary` wraps the game; shows a recovery screen with a reload action |
| 5.3 | Unused Android permissions declared | `READ/WRITE_EXTERNAL_STORAGE` + `SYSTEM_ALERT_WINDOW` blocked via `android.blockedPermissions`. Release APK now requests only `INTERNET` and `VIBRATE` |
| 5.4 | Modals had no focus management | `ModalShell` now moves focus in, traps Tab, closes on Escape and restores focus. (`role="dialog"`/`aria-modal` already existed — an earlier finding of mine was wrong on that point) |
| 5.5 | Documentation contradicted the implementation | `KNOWN_LIMITATIONS.md`, `FINAL_REPORT.md`, `PARITY_CHECKLIST.md`, `TESTING.md` corrected |
| 5.6 | `prefers-reduced-motion` unsupported | Added, targeted: ambient looping motion off, functional board motion kept but shortened |
| 5.7 | Preload `cancel()` did not abort in-flight work | `pool()` now polls a stop predicate between items |
| 5.8 | Lose path untested | Win/lose/star rules extracted to pure functions in `objectives.ts` and covered by 7 tests |

### 5.9 Preload quality

`weights` was computed and then discarded, so the documented "critical assets
count double" behaviour never happened. Weighting is now real. Loading is
concurrency-capped at 6 (was ~50 simultaneous), and each asset is `decode()`d
before being counted, so progress means "ready to paint".

---

## 6. Verified sound (no action needed)

These were checked and found correct — recorded so they are not re-litigated:

- **No second game implementation.** `Expo app/src/` contains only shell code
  (WebView host, bridge, storage mirror, splash). All gameplay lives in `src/`.
- **No backend, no localhost in production.** Full-repo grep for
  Prisma/DB/secrets/localhost found only dev tooling, docs and the validator's
  own guard patterns. `npm audit` on production deps: **0 vulnerabilities**.
- **Static export is genuine.** `src/app/` has no route handlers, server actions
  or dynamic segments; all 6 routes prerender.
- **Sync pipeline is deterministic.** `emptyDir()` wipes `web/` before every
  copy, and validation failure hard-exits.
- **Storage bridge is correct.** AsyncStorage is a one-way backup: hydration
  only fills keys that are absent, so it can never clobber newer WebView state.
  Save payloads are validated (`ww-` prefix, 500 KB cap).
- **WebView is locked down.** Navigation restricted to `file://`/`about:blank`;
  third-party cookies off; multiple windows off; debugging off in release
  (verified: 0 devtools sockets on the release APK).
- **`_originals/` is not dead weight.** It is the live backup directory for
  `tools/asset-eraser` and is already excluded from packaging.
- **Saves use private internal storage.** Confirmed physically on device:
  `ww-codex` lives in
  `/data/data/com.wonderweave.game/app_webview/…/leveldb/` (`drwx------`, app's
  own uid), written by a build with **zero** storage permissions.

---

## 7. Test architecture

### 7.1 Game engine — `tests/` (49 tests)

Run with `npm test`. Executes the real TypeScript source; no bundler, no new deps.

| File | Covers |
| --- | --- |
| `engine.test.ts` (29) | Match detection; 4→line / 5→prism / L→bomb promotion; prism excluded from runs; clear planning and pivot promotion; gravity (no holes, survivors fall, spawn flags); special chaining; dead-board detection; shuffle rescue; the full 7-pairing special×special combo matrix |
| `progression.test.ts` (20) | Save-schema migration (fresh / current / newer-client clamp / corrupt / read-only storage); objectives; star thresholds; level determinism; chapter partitioning; **win/lose/star resolution incl. the lose path** |

### 7.2 Packaging — `Expo app/tests/` (42 tests)

Path rewriting **including Flight rows and T-row byte-integrity**, inline-script
auditing, bridge protocol, backup merge, compat-layer invariants, the prebuild
guard, and bundle self-containment.

### 7.3 Device E2E — `Expo app/.maestro/` (4 flows)

Black-box flows driving the installed APK. These exist because every other gate
can be green while the shipped app is dead.

| Flow | Guards |
| --- | --- |
| `01-launch-and-load` | Cold launch reaches Home; loader gone. **The §3.1 regression.** |
| `02-gameplay` | Board mounts with real level data; pause/resume; LENS resolves a match |
| `03-persistence` | Progress survives a full restart |
| `04-navigation` | Map / Codex / Relics / Daily all render |

**Selector rule (important).** The game is a WebView. Android exposes its
content through the accessibility tree, so Maestro can drive it with no special
setup — but an element's accessible name is its **`aria-label`, which overrides
visible text**. `"PLAY"` matches nothing; the working selector is
`.*continue your journey.*`. Dump the live tree with `maestro hierarchy`. Full
notes in `.maestro/README.md`.

Maestro runs **natively on Windows** (no WSL; Maestro's own docs advise against
WSL due to adb port bridging). Requires JDK 17+.

---

## 8. Outstanding items

### 8.1 Release signing — **blocks Play submission**

`Expo app/android/app/build.gradle` still carries the template default:

```gradle
release {
    // Caution! In production, you need to generate your own keystore file.
    signingConfig signingConfigs.debug
}
```

Release APKs are signed with the **public Android debug key**
(`storePassword 'android'`). The APK installs and runs correctly for testing but
**cannot be published to Google Play**.

This was deliberately left to the project owner: an upload key is a credential
that should be generated and backed up by the owner, because losing it means
permanently losing the ability to update the app.

### 8.2 Work is uncommitted

28 modified files, 27 deletions, and three new paths (`tests/`,
`Expo app/.maestro/`, `src/components/game/ErrorBoundary.tsx`) are unstaged.

This matters beyond tidiness: the outage in §3.1 was caused by exactly this
pattern — an uncommitted working-tree edit whose rationale existed only in a
code comment.

### 8.3 Known limitations (accepted)

- **Lose path is unit-tested but not device-tested.** A UI flow that exhausts 25
  moves is unreliable, because a large cascade usually clears the objective
  first — this actually broke an earlier draft of flow 03. The rules are covered
  by pure-function tests instead.
- **T-row assets depend on the runtime URL patch.** Build-time rewriting of that
  row is unsafe (React #412). The dependency is now enforced by white-box tests
  that fail if the patch or any of its five interception points is removed.
- **Palatino display font** is not bundled (proprietary); Android falls back to
  Georgia or the default serif.
- **iOS** is stubbed, not built or tested.

---

## 9. Ship readiness

```
SHIP STATUS: READY WITH FIXES
```

Every code, test and documentation defect identified in this audit is closed and
verified on-device. The remaining work before a Play upload is:

1. Generate a real upload keystore and wire in a release `signingConfig`.
2. Commit the work.
3. Re-author the nine `bg-*` chapter backdrops at a usable resolution (below).

The APK is ready for sideloaded testing today.

### Open: chapter backdrops are heavily upscaled

`SceneBackdrop` paints its image at `width: 118%; height: 118%` of a full-screen
container, so on a 1080-wide device each backdrop is drawn at roughly 1270px.
The shipped sources are far smaller than that:

| Asset | Source width | Approx. upscale |
| --- | --- | --- |
| `bg-sky` | 122px | ~10x |
| `bg-sunset` | 133px | ~9.5x |
| `bg-altar` | 154px | ~8x |
| `bg-arch` | 173px | ~7x |
| `bg-ruins` | 191px | ~6.5x |
| `bg-forest` | 223px | ~5.5x |
| `bg-night` | 246px | ~5x |
| `bg-castle` | 271px | ~4.5x |
| `bg-map` | 302px | ~4x |

This is not a code defect and nothing is broken by it, but it is the largest
remaining hit to perceived quality: every chapter, the home screen and the
loading screen sit on one of these. Fixing it needs new source art at ~1280px
wide, not a resample of what ships today. Tiles (~50px, drawn at ~127 device px)
are the second-order case.

The two chapter decorations that were replaced in this pass — `deco-tree` and
`deco-moon` — now ship at 448px against a 176 CSS px render box, which is the
ratio the rest of the art should be held to.

---

## 10. Method note

Two lessons from this audit are worth carrying forward.

**A green pipeline was not evidence the app worked.** The sync, the validator,
the unit tests and the Gradle build all passed while the shipped app was dead.
Every claim in this document that concerns runtime behaviour was checked by
launching the APK, not by reading build output.

**Tests can lie in the other direction too.** An early version of flow 03 failed
and looked like an app bug; the artifact showed the app had behaved perfectly —
a LENS cascade scored 5,460 against a 2,200 objective and won the stage, so the
win modal appeared where the flow expected the pause menu. The test was rebuilt
around a board-independent signal. Failures were investigated to root cause
rather than assumed to be regressions.
