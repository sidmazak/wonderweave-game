# Testing

From `Expo app/`:

```bash
npm run validate:webbundle
npm run test:unit
npm run test:whitebox
npm run test:integration
npm run test:smoke
npm run test:blackbox
npm run test                 # all of the above Node suites
npm run test:e2e             # emulator / device when ADB is available
```

## Game engine tests (repo root)

The match-3 engine and save layer are tested from the repo root, against the
real TypeScript source via Node's type stripping — no bundler, no new deps:

```bash
npm test            # from the repo root
```

| File | Covers |
| --- | --- |
| `tests/engine.test.ts` | Match detection, 4→line / 5→prism / L→bomb promotion, clear planning, gravity (no holes, survivors fall), special chaining, dead-board detection, shuffle rescue, full special×special combo matrix |
| `tests/progression.test.ts` | Save-schema migration (fresh / current / newer-client clamp / corrupt / read-only storage), objectives, star thresholds, level determinism, chapter partitioning |

## Device E2E (Maestro)

```bash
cd "Expo app" && npm run test:maestro
```

Black-box flows that drive the installed APK. These exist because every other
gate here can be green while the shipped app is dead — see `.maestro/README.md`,
including the WebView selector rule (**target `aria-label`, not visible text**).

## Suites

| Suite | What it proves |
| --- | --- |
| Unit | Path rewrite (incl. RSC flight rows + T-row byte-integrity), inline-script auditing, bridge validation, backup merge |
| White-box | Compat contracts, GameScreen guards, save edge cases, full-bleed / ribbon CSS |
| Integration | Packaged `web/` is self-contained (no localhost runtime dependency) |
| Smoke | Required project files + local WebView URI |
| Black-box | Player-visible parity checklist is present and complete |
| E2E | Install / launch / screenshot on emulator or device |

## Evidence

`test-artifacts/` holds reproducible evidence:

| Path | Contents |
| --- | --- |
| `test-artifacts/screenshots/` | Emulator captures (home, play, instruments, release, …) |
| `test-artifacts/logs/` | Gradle / test logs |
| `test-artifacts/reports/` | Bundle validation JSON, final status |

`scripts/android-e2e.mjs` writes screenshots + a JSON summary with **PASS / FAIL / NOT TESTED**.

## Manual device checklist (smoke)

1. Cold launch → image splash → in-game loader → home (no “Wonderweave” text flash)  
2. Play → stage board interacts  
3. Instruments / Map / Codex / Relics / Daily headers aligned  
4. Kill app → relaunch → settings / progress still present  
5. Airplane mode → app still launches from packaged assets  

See also [PARITY_CHECKLIST.md](./PARITY_CHECKLIST.md).
