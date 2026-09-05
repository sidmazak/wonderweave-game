# Functional parity checklist

Player-visible capabilities for the Expo WebView build versus the Next.js game.
Device evidence: emulator CDP + `test-artifacts/screenshots/` (see [TESTING.md](./TESTING.md)).

| Feature | Original behavior | Expo behavior | Pass/Fail | Evidence | Notes |
| --- | --- | --- | --- | --- | --- |
| Launch shows Wonderweave loading / home | Splash then home | Packaged index hydrates to home | **PASS** | `expo-release-home.png`, CDP `home:true` | Splash advances after fetch/BASE_PATH fixes |
| Home: Play, How to Play, Instruments | Buttons on home | Same DOM | **PASS** | CDP body text; release screenshot | Gear = Instruments |
| Map / Atlas chapters | Bottom nav Map | Same | **PASS** | Nav present in DOM | Deep chapter walk **PARTIAL** (nav only) |
| Chapter stage select | Chapter screen | Same | **PARTIAL** | Entered play via Play CTA | Stage picker not separately screenshot |
| Gameplay board swaps | Pointer drag/tap | Same pointer handlers | **PASS** | `expo-gameplay.png` Stage 1-1 board | Swap gesture not pixel-instrumented |
| Pause overlay | Pause control | Same + Android back | **PARTIAL** | Pause control visible in gameplay shot | Back heuristic unit-covered; device back **NOT TESTED** this pass |
| Win / lose overlays | Folio sealed / lost | Same | **PARTIAL** | Maestro artifact `step-010-*` | Win path observed end to end on device: Folio Sealed modal with 3 stars, spare-move bonus, rewards (+70 lumens, Lens +1, Null +1) and two Codex discoveries. Lose path still **NOT TESTED** (needs a level run out of moves). |
| Codex | Recovered knowledge | Same `ww-codex` | **PASS** | CDP `ww-codex` key present | Discovery toast on first play |
| Relics / Altar | Ritual | Same | **NOT TESTED** | — | Nav item present |
| Daily Folio | Daily screen + level 0 | Same | **NOT TESTED** | Daily badge visible | Nav item present |
| Settings (music, sfx, vibrations, particles) | Instruments | Same storage | **PASS** | `ww-settings` survived reload | Shape may use music/sfx keys from manual seed |
| Progress persists after restart | localStorage | localStorage + AsyncStorage mirror | **PASS** | Reload + release relaunch kept settings | Full progress stars **PARTIAL** |
| Offline | Client-only | Packaged assets | **PASS** | `expo-release-offline.png` | wifi/data disabled |
| Release build | N/A | `assembleRelease` | **PARTIAL** | `app-release.apk`, assemble log | Builds and installs, but signed with the **debug** keystore — sideload only, not Play-publishable. See FINAL_REPORT.md. |
