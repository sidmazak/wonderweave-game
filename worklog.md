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

---
Task ID: 4-a
Agent: general-purpose
Task: Dialogs, Home, root polish (pause fix, endless rewire, music theming, particles)

Work Log:
- modals.tsx: PauseModal fixed per reference — removed DUPLICATED quit button, now exactly 4 buttons: Resume (leaf) / Restart / Options / Quit (berry, label "Daily Folio" when isDaily else "Quit to Atlas"); kept bunny-rest peeking at -top-[74px], X close (icon-close, w-9 h-9 top-3 right-3 -> onResume), RibbonBanner PAUSED + stage label, italic "The threads wait patiently…" whisper
- modals.tsx: REMOVED LeaderboardModal + LeaderRow entirely (no global leaderboard anywhere in src now); dropped unused ProgressMap import
- modals.tsx: added private Modal wrapper (ModalShell + body scroll-lock: adds ww-modal-open class + overflow hidden, restores on unmount — pairs with existing `body.ww-modal-open .ww-particle { animation-play-state: paused }` in globals.css); all 4 dialogs render through it (ModalShell itself lives in ui.tsx, out of scope)
- modals.tsx: FolioSealedModal terminal-state button label "The tapestry is complete!" -> "Weave Ever Onward"; HowToModal image capped max-h-[62vh] object-contain; FolioLostModal + GoalChip kept as-is (already matched contract)
- HomeScreen.tsx: new prop contract {totalStars, lumens, dailyDone, onPlay, onInstruments, onHowTo} — totalStarsMax + onLeaderboard/Trophy button removed; star HudPill shows bare number (unbounded) with aria-label; scene = bg-castle anim-ken + gradient + Twinkles(6) + Fireflies(9) + FallingLeaves(9) (FloatingPetals dropped per spec)
- HomeScreen.tsx: logo+PLAY+HowTo column nudge translate-y-4 sm:translate-y-6 so PLAY sits slightly below vertical center; bunny-lantern bottom-[92px]; footer "Threads of a Forgotten World" unchanged; all targets >=44px with aria-labels
- WonderweaveGame.tsx: removed TOTAL_LEVELS import, showLeaderboard state, LeaderboardModal render; HomeScreen gets new props only; AtlasScreen no longer receives totalStarsMax (parallel agent made it optional — verified totalStarsMax?: in AtlasScreen.tsx); PlayScreen hasNextStage={levelId > 0} (endless campaign)
- WonderweaveGame.tsx: music theming useEffect — play->'play', splash->'home', meta map->'map', codex|relics->'night', home|daily->'home' via setMusicTheme from @/lib/game/sound; splash scene got subtle FallingLeaves(5) inside the tap-to-skip button (pointer-events-none built into component)
- Verification: bunx tsc --noEmit | grep "modals|HomeScreen|WonderweaveGame" -> EMPTY; bun run lint -> clean (no output); dev.log latest compile green (✓ Compiled, GET / 200) — the earlier use-progress TOTAL_LEVELS SSR error was the parallel agent's file and is now resolved on their side; zero LeaderboardModal/onLeaderboard references remain in src

Stage Summary:
- Pause dialog now matches the storybook reference exactly (single quit path, 4 buttons), all dialogs lock body scroll + pause particles via the Modal wrapper, Home screen matches reference layout with leaves/fireflies/twinkles ambience, root is endless-aware (no star caps, hasNextStage always true in campaign) and themes music per view
- Key files: src/components/game/modals.tsx, src/components/game/HomeScreen.tsx, src/components/game/WonderweaveGame.tsx (only these 3 touched)

---
Task ID: 4-b
Agent: general-purpose
Task: PlayScreen combos + board shake + perf/footer polish; endless Atlas/Chapter screens; uncap use-progress

Work Log:
- Read worklog (Tasks 1/2-a/2-b/3) + new levels.ts (chapterDef/LEVELS_PER_CHAPTER/TOTAL_CHAPTERS/chapterOf), engine.ts comboPlan/comboLabel/ComboKind matrix, sound.ts sfx.combo(tier)/sfx.urgent(), globals.css .combo-banner/.anim-board-shake
- PlayScreen.tsx combos: attemptSwap now computes comboPlan(g1,a,b) right after the swap; validity = prism || combo !== null || findShapes; branch order combo → prism(exactly one) → normal cascadeLoop([a,b]); old naive specialVsSpecial 2-cell blast removed; combo branch does sfx.combo(tier 1/2/3: cross|megaCross|bigBomb=1, lineStorm|bombStorm=2, blackhole=3) + vibrate(24) + gold weave banner + combo.bonus into scoreRef + addFloater "+bonus" at a/b midpoint + blast(expandSpecials(g1, combo.cells)) + cascadeLoop
- ComboInfo state extended with optional text; showCombo(n, text?) reused for both cascade "Combo ×N!" and special weaves ("Cross of Light!" etc.), auto-clear 1400ms; banner span restyled from navy gradient to .combo-banner (warm gold) keeping anim-combo/rounded-full/px-6/py-1.5/font-display/italic/font-black/text-3xl
- Board shake: shakeId state + triggerShake() (timestamp re-set guard, 460ms timeout reset, unmount cleanup); fires when a blast clears >= 10 cells (inside blast) or on any special combo; board-frame gets anim-board-shake via className toggle (no key remount)
- Footer: removed the hint <p> (level.hint + "Match 3 or more…" text gone); now BoosterButton Lens + empty flex-1 spacer aria-hidden + BoosterButton Null only; arming Null shows toast 'Tap any charm to unweave it…' (once per arming) and keeps crosshair cursor
- Low-moves heartbeat: urgentRef tracks last value; on non-free moves decrementing into 3/2/1 fires sfx.urgent(); ref reset in resetLevel
- Lore mapping: discover(`lore:${(((level.chapter - 1) % 12) + 1)}`) so echo chapters unlock the 12 core lore entries; bgKey now chapterOf(level.id).bg (endless-safe), CHAPTERS import dropped (also removed unused isSpecialActivation import)
- Perf: TileView wrapped in React.memo; 49–64 static cell sockets extracted into React.useMemo keyed [level.rows, level.cols, size.w]; behaviour identical
- AtlasScreen.tsx endless: TOTAL_LEVELS/tapestryDone removed; viewMax = max(TOTAL_CHAPTERS, chapterOf(highestUnlocked).id + 1), islands via Array.from chapterDef(1..viewMax); Continue card always shown (currentChapterId = chapterOf(highestUnlocked).id); star pill shows totalStars only with totalStarsMax?: number kept optional for root compat; footer "{n} stages sealed" (no denominator); chapter-node rows/lock rule/Continue badge unchanged
- ChapterScreen.tsx: chapterDef(chapterId) replaces CHAPTERS[...] clamp (works for any chapter ≥ 1); STARS_PER_CHAPTER = LEVELS_PER_CHAPTER * 3
- use-progress.ts: TOTAL_LEVELS import removed; highestUnlocked = uncapped while-loop over progress stars ((progress[n]?.stars ?? 0) >= 1 → n++, TS-strict-safe); highestChapter = ceil(highestUnlocked / LEVELS_PER_CHAPTER) uncapped; server sync + everything else untouched
- Verified: bunx tsc --noEmit grep of PlayScreen|AtlasScreen|ChapterScreen|use-progress → ZERO errors (whole src/ is clean now); bun run lint exit 0; dev.log "✓ Compiled" + GET / 200 after edits

Stage Summary:
- Special+special weave matrix live in PlayScreen (6 combo kinds w/ tiered fanfare, gold storybook banners, bonus floaters, board shake), hint text removed from footer (toast-driven Null booster), low-moves heartbeat SFX, memoized tiles/sockets; Atlas + Chapter screens render endless echo chapters and use-progress unlocks chapters past 144 with no cap
- Files touched (only the 4 in scope): src/components/game/PlayScreen.tsx, src/components/game/AtlasScreen.tsx, src/components/game/ChapterScreen.tsx, src/hooks/use-progress.ts

---
Task ID: 3 (v3 polish pass)
Agent: main (Z.ai Code) + parallel subagents 4-a/4-b
Task: Music/audio, dialogs, home ambience (leaves+fireflies), endless procedural levels, combo matrix, full polish

Work Log:
- levels.ts rewritten ENDLESS: chapterDef(id) cycles 12 hand-authored themes forever (romanNumeral for any chapter, "Echo II+" title suffix for laps beyond the first), getLevel unbounded w/ smooth exp difficulty curve + gentle endless objective scaling, echo laps reshuffle the tile palette; removed TOTAL_LEVELS; CORE_LEVELS=144 informational; hints rewritten (killed "Match 3 or more Woven Charms..." text)
- engine.ts: full special+special combo matrix — comboPlan() cross/megaCross/bigBomb/lineStorm/bombStorm/blackhole w/ comboLabel + COMBO_BONUS (400..1500)
- sound.ts: layered generative music engine (lookahead scheduler @90ms, 4 themes home/map/play/night, detuned pads + bass + melody random-walk + sparkles + soft ticks), DynamicsCompressor on music bus, visibilitychange suspend/resume, new sfx: combo(tier)/urgent/uiBack
- ui.tsx: ParchmentPanel corner art FIXED (deco-flowers strips → crisp inline-SVG CornerVine flourishes — this was the broken dialog corner sticker); added FallingLeaves (SVG leaves, --sway/--spin CSS vars) + Fireflies (glow drift); all 4 ambient components client-only (useMounted) → SSR hydration mismatch eliminated; ww-particle class for kill-switch
- globals.css: ww-leaf-fall / ww-firefly-drift+glow / ww-board-shake / ww-blast-ring keyframes, .combo-banner warm gold (replaced navy), .ww-no-particles .ww-particle, body.ww-modal-open pauses particles, reduced-motion extended
- 4-a (subagent): modals.tsx — PauseModal exactly 4 buttons (RESUME/RESTART/OPTIONS/QUIT TO ATLAS; dup quit bug fixed), Modal wrapper w/ body scroll-lock; LeaderboardModal DELETED; FolioSealed terminal → "Weave Ever Onward"; HomeScreen rebuilt per reference (leaves 9 + fireflies 9 + twinkles, PLAY below center, no Trophy, stars w/o /max); WonderweaveGame — setMusicTheme per view (home/map/play/night), hasNextStage endless, splash leaves
- 4-b (subagent): PlayScreen — comboPlan wiring (tier sfx + weave banner + bonus floater), board shake on >=10-cell blasts, footer hint text REMOVED (boosters only), sfx.urgent at 3/2/1 moves, lore id mod-12 for echoes, React.memo TileView + memoized cell sockets; Atlas/Chapter endless via chapterDef; use-progress highestUnlocked uncapped while-loop
- /api/leaderboard route deleted (global leaderboard fully removed — local-only per user)
- FIX (mine): HowToModal rebuilt natively — panel-howto.png was 122x278 thumbnail rendering tiny; new modal uses real tile/special/booster assets in a scrollable parchment book page
- E2E (agent-browser, 430x860 + 1280x800): home leaves/fireflies render, pause dialog w/ vine corners + 4 buttons verified, real drag swaps + cascades + Lens booster + win (Folio Sealed 3 stars, +2200 bonus, reward chips), special+special combo fired (objective sealed in 1 weave) + "Combo ×2!" warm banner captured, Atlas endless list + chapter grid + star footer, Codex/Relics/Daily/Instruments all green, music slider keyboard-driven persists (0.83), pause→options→back flow, zero console errors, tsc+lint clean

Stage Summary:
- Wonderweave v3: endless procedural storybook match-3 — theme changes every 12 stages with Echo laps; full combo matrix; adaptive 4-layer music; fixed dialogs/home/ambience; local-only progression; all quality gates green
