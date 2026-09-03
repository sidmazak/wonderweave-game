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

## Suites

| Suite | What it proves |
| --- | --- |
| Unit | Path rewrite, bridge validation, backup merge |
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
