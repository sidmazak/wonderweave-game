# Task 2-b — Home/Atlas/Chapter screens (general-purpose)

## Files written (ONLY these 3)
- src/components/game/HomeScreen.tsx (new)
- src/components/game/AtlasScreen.tsx (replaced entirely)
- src/components/game/ChapterScreen.tsx (new)

## Export contracts (exact)
- `HomeScreen({ totalStars, totalStarsMax, lumens, dailyDone, onPlay, onInstruments, onHowTo })`
- `AtlasScreen({ progress: ProgressMap, totalStars, totalStarsMax, highestUnlocked, onSelectChapter(chapterId), onPlayNext })`
- `ChapterScreen({ chapterId, progress: ProgressMap, highestUnlocked, onBack, onPlayLevel(levelId) })`

## Notes for the root (Task 2-a) integrator
- Screens fill the flex-1 area; root owns Backdrop base + BottomNav. HomeScreen expects nav below (bunny sits bottom-[86px] of its own container).
- AtlasScreen: no onBack — it is a nav tab; chapter open goes through onSelectChapter -> root switches to ChapterScreen; locked rows are disabled buttons (no-op).
- AtlasScreen Continue card calls onPlayNext -> root should route to PlayScreen with highestUnlocked level.
- ChapterScreen current node = highestUnlocked (ring-pulse, "your next stage" aria). onPlayLevel(levelId) for any unlocked node.
- progress map may be {} on first render (all safe-accessed). totalStarsMax expected 432 (144x3).
- Worklog appended to /home/z/my-project/worklog.md (Task ID 2-b).
