# Wonderweave — Project Worklog

---
Task ID: 1
Agent: main (Z.ai Code)
Task: Inspect project & environment

Work Log:
- Confirmed Next.js 16 + App Router project at /home/z/my-project with shadcn/ui, Prisma (sqlite at db/custom.db), framer-motion available
- Dev server already running on port 3000 (dev.log confirms 200 responses)
- Python3 + PIL 11.3 + numpy + scipy available for asset tooling

Stage Summary:
- Environment ready; DATABASE_URL=file:/home/z/my-project/db/custom.db; three source sheets in upload/

---
Task ID: 2
Agent: main (Z.ai Code)
Task: Extract & assemble game assets from uploaded sprite sheets

Work Log:
- Discovered sources are RGBA with transparent backgrounds (not black); wrote tools/extract_assets.py using scipy connected-component labeling on the alpha channel with binary closing
- Extracted 603 sprites (77 scenes + 336 sheet + 190 mockups) with index.json + labeled montages in extracted/
- Visually verified montages, fixed misread IDs via candidates.png + dialog_check.png ground-truth renders
- tools/assemble_assets.py copies 75 curated sprites to public/game/assets with semantic names (tiles, bunnies, logo, backgrounds, UI pills/banners/medallions/icons, effects)
- Split bar-stars.png into bar-stars.png (gold star progress) + bar-blue.png

Stage Summary:
- 76 production assets in public/game/assets: 8 board tiles (leaf/drop/flame/star/flower/mushroom/gem/orb), Wonderweave logo, 8 bunny poses, 10 scene backgrounds incl. world map + parchment panel, COMBO x5! banner, confirm dialog, how-to-play panel, loading plaque, medallions, icon buttons, sparkles/rainbow effects
- Key files: tools/extract_assets.py, tools/assemble_assets.py, extracted/index.json per source

---
Task ID: 3
Agent: main (Z.ai Code)
Task: Core game library + UI + screens + backend + E2E verification

Work Log:
- src/lib/game/: types.ts (Tile/Grid/Special/LevelDef), levels.ts (12 chapters with score/collect objectives + star thresholds), engine.ts (pure match-3: createGrid, findShapes with line/bomb/prism classification, planClear with chained special detonation via expandSpecials, applyGravity, findAllMoves, shuffleGrid), sound.ts (WebAudio synth SFX: pentatonic cascade ladder, swap/pop/line/bomb/prism/star/win/lose), assets.ts (tile->sprite manifest)
- src/components/game/: ui.tsx (WoodButton leaf/berry variants, ParchmentPanel, ModalShell, StarRow, HudPill, FloatingPetals, Twinkles), modals.tsx (Pause, Options with sound/vibration/name, HowTo using extracted panel art, LevelComplete with count-up + confetti, LevelFailed, Leaderboard), TitleScreen (ken-burns castle bg, floating logo, bobbing bunny, drifting clouds/petals), AtlasScreen (12-node S-path dotted map over extracted world-map art, lock/star states), PlayScreen (8x8 board, pointer drag+tap input, cascade loop with combo banner, floaters, hint wiggle after 6s, reshuffle toast, prism/line/bomb specials with glow overlays, HUD with moves/score/star markers/objective chips), WonderweaveGame root (splash->title->atlas->play router)
- Backend: prisma/schema.prisma (Player, LevelProgress with @@unique([playerId, level])), db pushed; API routes /api/player (upsert), /api/progress (GET+POST keep-max upsert), /api/leaderboard (top 10 by stars then score)
- Persistence: useProgress hook — localStorage-first with best-effort server sync + merge

Bugs found & fixed during browser E2E:
1. Board rendered empty: initial deal set spawned flags but never cleared them -> tiles stayed above the board; added clearSpawnedNextFrame (double-rAF) on mount and reset
2. Runtime TypeError in isSpecialActivation via hint timer: hardened engine with optional chaining + row guards; removed side-effect-in-setState-updater input pattern (selectedRef mirror)
3. CRITICAL: every swap judged invalid — attemptSwap checked wouldMatch on the ALREADY-swapped grid (double swap = original layout); fixed by testing findShapes(swappedGrid).length > 0
4. Board cells 6% non-square on some viewports: measure() now subtracts container padding + frame chrome exactly -> perfect square cells

E2E evidence (agent-browser):
- Full golden path PASSED: splash -> title -> atlas -> level 1 -> scripted auto-player made 16 real drags, score 60..1660 with cascades, WIN modal "Folio Sealed! 1,960 (+300 thread bonus, 3 spare moves, 1 star)"
- Progress persisted: atlas shows chapter 1 "best 1960 points, 1 stars", chapter 2 unlocked; /api/leaderboard returns the player
- Level 2 collect objectives verified counting (3/18 leaf, 3/18 drop)
- Modals verified: Pause, Options (Instruments), How to Play, Leaderboard
- Layout verified at 430x860, 375x667, 1280x800; square cells; bunny/name overlap on tiny screens fixed
- bun run lint clean; dev.log zero errors; all API routes 200

Stage Summary:
- Playable Candy Crush competitor "Wonderweave" shipped on the uploaded art: 76 extracted assets, 12 levels, specials (Row/Column Weaver bolts, Charm Burst, Rainbow Prism), combo banners, hint + reshuffle, WebAudio SFX, progress + global leaderboard with Prisma/SQLite backend
- Key entry: src/components/game/WonderweaveGame.tsx; engine: src/lib/game/engine.ts
