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

---
Task ID: 1
Agent: main (Z.ai Code)
Task: v2 foundation — storybook overhaul per reference mockup

Work Log:
- types.ts: added 'orb' TileType (8 types), BoosterInventory/Kind, DailyState/Rewards, WWSettings
- levels.ts: rewrote as 12 CHAPTERS (numerals I-XII, titles, bgs, taglines, hints) x 12 stages = 144 deterministic levels (mulberry32 seeded by id), score/collect templates, star thresholds, stageTitle() -> "4-2" labels
- daily.ts: dateKey/yesterdayKey/prettyDate, getDailyLevel(dateKey) seeded daily stage, dailyRewardFor(streak)
- codex.ts: 9 LUMENS (TERRA/AQUA/IGNIS/LUX/VENTUS/UMBRA/MERCUR/FERRUM/VITRIOL) + 7 ENTITIES (bunnies w/ unlock milestones) + 12 LORE = 28 items; localStorage + custom-event bus; discover()/useCodex() hook
- sound.ts: split sfxGain/musicGain, setSfxVolume/setMusicVolume, generative ambient music (harp plucks + pads, start/stop), new sfx: booster/lens/nullify/ritual/reward/tick
- settings.tsx (new): SettingsProvider + useSettings (ww-settings JSON persistence), useAudioGate, useVibrate
- use-progress.ts: lumens currency, booster inventory w/ useBooster/addBoosters, completeDaily() ref-guarded streak logic, onLevelWin (rewards + codex milestones), highestUnlocked across 144, highestChapter
- ui.tsx: added RibbonBanner, BottomNav (map/codex/relics/daily w/ inline SVG icons + daily badge), LumenPill, ToggleSwitch, StyledSlider, WoodTabs, CountUp; kept WoodButton/IconButton/ParchmentPanel/ModalShell/StarRow/HudPill/ProgressBar/petals/twinkles
- globals.css: ribbon (notched ends), bottom-nav, lumen-gem, wood-tab, ww-range slider, settings-row, cameo, codex-card, board-cell sockets, booster-btn, goal-card, level-node, chapter-node, ww-reduced/ww-hc comfort classes, sway/glow/orbit/breathe anims
- assets.ts: added orb tile + BOOSTER_IMG

Stage Summary:
- Full data/API contract ready for screens: getLevel(id 1..144), getDailyLevel(dateKey), CHAPTERS, useProgress(){lumens, inventory, daily, completeDaily, onLevelWin, highestUnlocked, highestChapter, isLevelUnlocked}, useSettings(){settings, update}, codex discover()/useCodex()
- Root app classes for comfort modes: ww-reduced / ww-hc on app container
---
Task ID: 2-b
Agent: general-purpose
Task: Home/Atlas/Chapter screens

Work Log:
- Read v2 foundation contract (worklog Task 1) + levels.ts (CHAPTERS/chapterOf/chapterLevelIds/LEVELS_PER_CHAPTER/TOTAL_LEVELS), ui.tsx components, use-progress ProgressMap, globals.css v2 classes, assets.ts A()
- HomeScreen.tsx (new): full-bleed bg-castle anim-ken scene + gradient overlay + Twinkles(10); absolute top bar with HudPill star counter (star-sparkle + totalStars / totalStarsMax), LumenPill lumens, gear IconButton -> onInstruments; centered logo (anim-float), leaf WoodButton xl anim-ring-pulse "Play" with lucide Play icon, sm "How to Play"; bunny-lantern bobbing at left-2 bottom-[86px]; footer tracking-[0.3em] "Threads of a Forgotten World"; FloatingPetals(6); dailyDone folded into Play aria-label
- AtlasScreen.tsx (replaced entirely): bg-map parchment backdrop with #101d13/20 + radial vignette; RibbonBanner ATLAS/"The World Within" with pt-12 so top-right HudPill (top-3 right-3) never collides; goal-card Continue row (Stage {ch}-{n} + chapter title + leaf "Go ▶" -> onPlayNext, or "The tapestry is complete ✦" with medallion-1 when highestUnlocked > TOTAL_LEVELS); scrollable ww-scroll list of 12 chapter-node island rows (16px bg thumb, numeral+title, italic tagline line-clamp-1, 3 milestone star pips + earned/36, right status medallion-lock / star-sparkle / ChevronRight); chapter containing highestUnlocked gets anim-ring-pulse + gold "CONTINUE" badge (absolute -top-2 right-2); locked = first level id > highestUnlocked (chapter-node-locked, disabled); footer "{n} / 144 stages sealed"; FloatingPetals(5)
- ChapterScreen.tsx (new): dimmed CHAPTERS[chapterId].bg backdrop + specified gradient; back IconButton top-3 left-3 -> onBack; RibbonBanner CHAPTER {numeral}/{title}; scrollable middle with deco-island anim-float w-40 and grid-cols-3 of 12 level-node buttons (label "ch-i", 3 star-sparkle pips per stars, level-node-done when stars>0, level-node-locked + medallion-lock + disabled when levelId > highestUnlocked, anim-ring-pulse + "— your next stage" aria on current); footer goal-card pill with star + "{chapterStars} / 36" + ProgressBar w-24 h-2
- Loading-safe everywhere: progress[levelId]?.stars ?? 0, ProgressMap may be {}; chapterId clamped to 1..12; all buttons >=44px with aria-labels; no any, strict TS
- Verified: bunx tsc --noEmit grep of HomeScreen|AtlasScreen|ChapterScreen -> ZERO errors; eslint on the 3 files -> clean; dev.log compiles green

Stage Summary:
- 3 polished v2 screens shipped with exact prop contracts: HomeScreen({totalStars,totalStarsMax,lumens,dailyDone,onPlay,onInstruments,onHowTo}), AtlasScreen({progress,totalStars,totalStarsMax,highestUnlocked,onSelectChapter,onPlayNext}), ChapterScreen({chapterId,progress,highestUnlocked,onBack,onPlayLevel}) — all 'use client', warm storybook palette (#101d13/#f9efd4/#5d3a1a/#ffd76e), mobile-first max-w-[460px] ready, nav rendered by root
- Pre-existing tsc errors remain in PlayScreen.tsx / WonderweaveGame.tsx (old v1 props being re-wired by parallel Task 2-a) and examples/ + skills/ — untouched by design
---

---
Task ID: 2-a
Agent: general-purpose
Task: Codex/Daily/Altar/Instruments screens

Work Log:
- Read worklog + v2 foundation contracts (codex.ts useCodex/items, daily.ts dateKey/prettyDate/getDailyLevel/dailyRewardFor, types.ts DailyState, levels.ts TILE_META, ui.tsx exports, settings.tsx useSettings, globals.css storybook classes, assets.ts A())
- CodexScreen.tsx: RibbonBanner "CODEX / Recovered Knowledge", WoodTabs<'lumens'|'entities'|'lore'> (role=tablist), 3-col codex-card grid (9 lumens, icon-cell + "?" mystery for locked + codex-card-locked), 2-col entity grid (7 bunnies, w-14), 12 lore rows as settings-row with gold font-display numeral ornament / medallion-lock grayscale for undiscovered; found-card tap -> ModalShell+ParchmentPanel detail (icon/name/sub/desc/How); locked tap -> anim-shake nudge (450ms, timer ref cleanup); footer "✦ N / 28 Discovered ✦"; bg-arch ambient + vignette over #101d13
- DailyScreen.tsx: props {daily: DailyState, onBack, onPlay}; date pill (goal-card rounded-full prettyDate(dateKey())); central goal-card with bunny-lantern/bunny-cheer anim-bob; quest line derived from getDailyLevel (collect -> inline TILE_IMG icons w-6 + TILE_META names joined by &, score -> "Weave at least S threads in one journey"); REWARDS row of 3 codex-card chips (lumen-gem ✦ +N, brass Search circle LENS +1, brass Hammer circle NULL +1) from dailyRewardFor(streak+1); WoodButton leaf lg Play / disabled "Sealed for Today ✓" + midnight line when daily.last === today; streak footer + hint; bg-sunset backdrop
- AltarScreen.tsx: exports RitualOutcome type {kind:'lens'|'null'|'fortune', amount}; 220px stage with 3 anim-orbit lumen imgs (--orbit-r 86px, negative animationDelay stagger), radial-gradient stone pedestal circle, tile-orb w-24 anim-breathe with purple drop-shadow; LumenPill top-right; instruction goal-card "The altar asks ✦100"; PERFORM RITUAL ✦100 WoodButton (disabled < 100 -> "Not enough Lumens"); flow: busy -> sfx.ritual() -> anim-glow-pulse + scale-125 charge 1.1s -> onPerform() -> result goal-card (lens/null brass icon or fortune gem, amount-driven) with Gather reset; bg-altar backdrop
- InstrumentsScreen.tsx: full parchment ParchmentPanel screen w/ RibbonBanner sm + icon-back; sections AUDIO (Music/Volume2 StyledSlider -> update musicVol/sfxVol), VISUAL (Vibrate/Sparkles/Wind/Contrast ToggleSwitch -> vibrations/particles/reducedMotion/highContrast), LANGUAGE (decorative English row button, aria-label, sfx.ui only), SUPPORT (How to Play -> onHowTo, Credits -> internal ModalShell), WEAVER NAME (styled input + Save WoodButton, local state synced via useEffect, Enter-to-save); footer "Wonderweave v2.0 — Threads of a Forgotten World"
- Verified: bunx tsc --noEmit | grep for the 4 files -> 0 errors (remaining tsc errors are pre-existing in PlayScreen/WonderweaveGame being rewritten in parallel + examples/skills folders); bun run lint clean

Stage Summary:
- 4 polished screens shipped: CodexScreen (3-tab collection book w/ mystery locked states + detail modals), DailyScreen (seeded daily quest preview + reward chips + streak/sealed states), AltarScreen (orbital ritual animation w/ charge->outcome flow, RitualOutcome contract for root), InstrumentsScreen (full settings surface via useSettings)
- All use ui.tsx primitives (RibbonBanner/WoodTabs/WoodButton/IconButton/ToggleSwitch/StyledSlider/LumenPill/ModalShell/ParchmentPanel), globals.css storybook classes, ww-scroll, anim-* helpers; 44px+ touch targets, aria-labels, tablist semantics, no blue/indigo, mobile-first for 460px column
- Note for root integrator: daily.ts exports dateKey() (used as today), AltarScreen.onPerform must deduct 100 lumens and return RitualOutcome; DailyScreen.onPlay should start getDailyLevel(dateKey()) with id 0
---

---
Task ID: 3
Agent: main (Z.ai Code)
Task: Integrate subagent screens + build PlayScreen v2, modals v2, root app

Work Log:
- PlayScreen.tsx rewritten: reference HUD (pause btn / STAGE ribbon via RibbonBanner / MOVES box), goal-card (per-goal tile icon + ProgressBar + N/M, score mode too), SCORE pill w/ CountUp + star pips, cell-socket board (board-cell/alt), boosters LENS (instant free smart move via findAllMoves[0]) + NULL (arm->tap-to-nullify), codex discovery hooks (LUMEN_ID_BY_TYPE map, lore:<ch> on start, entity:lantern/rest), daily-aware copy (DAILY PAGE ribbon), FolioSealed/FolioLost/Pause modals
- modals.tsx rewritten: PauseModal (sleepy bunny overlapping panel, RESUME/RESTART/OPTIONS/ATLAS/QUIT FOLIO, X close), FolioSealedModal (ribbon + bunny cameo oval + animated stars + CountUp score + moves-bonus line + reward chips incl. streak + CONTINUE/RETRY/ATLAS), FolioLostModal, HowToModal (z-[70]), LeaderboardModal kept
- WonderweaveGame root: SettingsProvider + useAudioGate; splash->meta(home|map:atlas|chapter|codex|relics|daily tabs)+play; instruments overlay z-[60]; howto/leaderboard; onWin returns RewardSummary (campaign=onLevelWin rewards, daily=completeDaily rewards), performRitual (100 lumens -> 40% +2 lens / 40% +2 null / 20% +250 lumens, entity:heart)
- use-progress.ts hardening: lumensRef/inventoryRef/dailyRef for synchronous spendLumens/useBooster/completeDaily (setState-updater return-value bug); added onLevelWin, isLevelUnlocked, highestChapter
- Deleted TitleScreen.tsx (replaced by HomeScreen)
- layout.tsx: Viewport export (maximumScale 1, userScalable false, themeColor #101d13)
- next.config.ts: devIndicators:false (Next dev N badge was covering the LENS booster)
- ui.tsx: ModalShell overlayClassName prop; replaced PNG stars with inline SVG StarIcon/StarRow (headless-GPU flake painted 2 star PNGs as blue squares)
- HomeScreen: added Leaderboard trophy button
- AtlasScreen: added Back-to-Home arrow
- ChapterScreen: radial mask on deco-island art (visible rectangular edges)
- BUGFIX: codex lumen id mismatch (lumen:leaf stored vs lumen:terra expected) -> LUMEN_ID_BY_TYPE + VALID_IDS pruning in codex.read()
- BUGFIX: daily win modal primary button said "The tapestry is complete!" -> Continue (exits to Daily) via hasNext={isDaily||hasNextStage}, onNext daily->onExit
- BUGFIX: app column min-h-dvh -> h-dvh (bottom nav pushed offscreen on desktop, scroll areas unbounded; nav bottom = 800/800 verified)

Stage Summary:
- Full game loop E2E verified via agent-browser: LENS auto-move (60pts, free), real mouse-drag swap -> cascade (60->680 w/ prism+striped spawns), prism swap -> Combo x2 + 1925pts, LENS finish -> FOLIO SEALED 3 stars 5840 (+2300 bonus, rewards chips), CONTINUE -> stage 1-2, Pause menu, Instruments (sliders/toggles persist + ww-reduced/ww-hc classes), QUIT->Atlas, Chapter grid, Atlas back->Home, Daily play->DAILY PAGE SEALED (streak 1, sealed-for-today state, badge cleared), stage 1-2 collect goal 23/23 + win 8380, desktop 1280x800 + mobile 390x844 layouts, zero console errors
