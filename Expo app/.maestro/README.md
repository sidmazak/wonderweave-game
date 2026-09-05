# Maestro E2E flows

Black-box UI tests that drive the **real APK on a real device/emulator**. These
exist because every other gate in this repo can report green while the shipped
app is completely broken: the bundle validator, the unit suites and the gradle
build all passed while React never hydrated and the game hung forever on
"WEAVING THE WORLD… 0%". Only driving the installed app catches that.

## Running

```bash
cd "Expo app"
npm run test:maestro          # all flows
npm run test:maestro:smoke    # just the launch/hydration check
```

Requires a booted emulator or attached device with the app installed:

```bash
npm run game:sync
cd android && ./gradlew assembleRelease
adb install -r app/build/outputs/apk/release/app-release.apk
```

## Install (Windows — native, no WSL needed)

Maestro runs natively on Windows; WSL is **not** required and Maestro's own docs
advise against it (it needs awkward adb port bridging).

1. Download `maestro.zip` from https://github.com/mobile-dev-inc/maestro/releases
2. Extract to e.g. `C:\maestro`
3. Add `C:\maestro\maestro\bin` to `PATH`
4. Set `JAVA_HOME` to a **JDK 17+** install (the same one Gradle uses)
5. `maestro --version`

## Selector rule for this app (important)

The game is a **WebView**. Android exposes WebView content through the
accessibility tree, so Maestro can see and tap it with no special setup — but an
element's accessible name is its **`aria-label`**, which *overrides the visible
text*.

So the Play button is **not** matched by `"PLAY"`. Its accessible name is
`"Play — continue your journey…"`. Write selectors against aria-labels:

| On screen | Selector that actually works |
| --- | --- |
| `PLAY` | `.*continue your journey.*` |
| `LENS` | `Lens booster.*` |
| `MOVES 25` | `25 moves left` |
| board | `.*weaving board.*` |
| loading screen | `.*Loading Wonderweave.*` |

When adding assertions, dump the live tree first:

```bash
maestro hierarchy
```

If an element has no `aria-label`, it will surface by its text instead — adding
a label in the React source is usually the better fix, since it improves
screen-reader support at the same time.

## Flows

| Flow | Guards |
| --- | --- |
| `01-launch-and-load.yaml` | Cold launch reaches Home; loader is gone. The hydration-outage regression. |
| `02-gameplay.yaml` | Board mounts with real level data; LENS resolves a match (score leaves 0, booster decrements); pause/resume works. |
| `03-persistence.yaml` | Progress written in one process survives a full restart — the save layer that has needed manual verification after every refactor. |
| `04-navigation.yaml` | Map / Codex / Relics / Daily all render — the screens whose art is resolved dynamically and cannot be fully checked statically. |
