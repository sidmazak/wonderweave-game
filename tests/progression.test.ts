/**
 * Save-schema, objective and level-generation invariants.
 *   node --experimental-strip-types --test tests/
 */
import test from 'node:test'
import assert from 'node:assert/strict'

import { ensureSaveSchema, SAVE_SCHEMA_VERSION, LS_SAVE_VERSION } from '../src/lib/game/save-schema.ts'
import type { StorageLike } from '../src/lib/game/save-schema.ts'
import {
  isObjectiveMet,
  scoreObjectiveTarget,
  starRatingProgress,
  levelOutcome,
  finalScoreFor,
  starsFor,
} from '../src/lib/game/objectives.ts'
import {
  CHAPTERS,
  LEVELS_PER_CHAPTER,
  chapterOf,
  chapterDecoKey,
  getLevel,
  nextLevelId,
  stageInChapter,
} from '../src/lib/game/levels.ts'
import type { LevelDef } from '../src/lib/game/types.ts'

/** In-memory StorageLike with optional failure injection. */
function fakeStorage(seed: Record<string, string> = {}, opts: { throwOnWrite?: boolean } = {}) {
  const map = new Map(Object.entries(seed))
  const storage: StorageLike & { map: Map<string, string> } = {
    map,
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => {
      if (opts.throwOnWrite) throw new Error('quota exceeded')
      map.set(k, v)
    },
    removeItem: (k) => {
      map.delete(k)
    },
  }
  return storage
}

/* ------------------------------ save schema ------------------------------- */

test('a fresh save is stamped with the current schema version', () => {
  const store = fakeStorage()
  assert.equal(ensureSaveSchema(store), SAVE_SCHEMA_VERSION)
  assert.equal(store.getItem(LS_SAVE_VERSION), String(SAVE_SCHEMA_VERSION))
})

test('an already-current save is left at its version', () => {
  const store = fakeStorage({ [LS_SAVE_VERSION]: '1' })
  assert.equal(ensureSaveSchema(store), 1)
})

test('a save from a newer client is clamped, not wiped', () => {
  const store = fakeStorage({ [LS_SAVE_VERSION]: '99', 'ww-lumens': '250' })
  assert.equal(ensureSaveSchema(store), SAVE_SCHEMA_VERSION)
  assert.equal(store.getItem('ww-lumens'), '250', 'player data must survive a downgrade')
})

test('a corrupt version value falls back to a clean migration', () => {
  for (const bad of ['not-a-number', '', '-5', '{}']) {
    const store = fakeStorage({ [LS_SAVE_VERSION]: bad })
    assert.equal(ensureSaveSchema(store), SAVE_SCHEMA_VERSION, `input ${JSON.stringify(bad)}`)
  }
})

test('a read-only / full storage does not throw during boot', () => {
  const store = fakeStorage({}, { throwOnWrite: true })
  assert.doesNotThrow(() => ensureSaveSchema(store))
})

/* ------------------------------- objectives ------------------------------- */

const scoreLevel: LevelDef = {
  id: 1,
  chapter: 1,
  index: 1,
  name: 'Test',
  moves: 20,
  rows: 8,
  cols: 8,
  types: ['leaf', 'drop'],
  objective: { kind: 'score', score: 1000 },
  star2: 1500,
  star3: 2500,
  hint: '',
}

const collectLevel: LevelDef = {
  ...scoreLevel,
  objective: { kind: 'collect', collect: [{ type: 'leaf', count: 10 }] },
}

test('scoreObjectiveTarget reads the score goal, or falls back to the 2-star mark', () => {
  assert.equal(scoreObjectiveTarget(scoreLevel), 1000)
  assert.equal(scoreObjectiveTarget(collectLevel), 1500)
})

test('a score objective is met only at or above the target', () => {
  assert.equal(isObjectiveMet(scoreLevel, 999, {}), false)
  assert.equal(isObjectiveMet(scoreLevel, 1000, {}), true)
  assert.equal(isObjectiveMet(scoreLevel, 5000, {}), true)
})

test('a collect objective needs every goal satisfied', () => {
  assert.equal(isObjectiveMet(collectLevel, 0, {}), false)
  assert.equal(isObjectiveMet(collectLevel, 0, { leaf: 9 }), false)
  assert.equal(isObjectiveMet(collectLevel, 0, { leaf: 10 }), true)
  const twoGoals: LevelDef = {
    ...scoreLevel,
    objective: {
      kind: 'collect',
      collect: [
        { type: 'leaf', count: 5 },
        { type: 'drop', count: 5 },
      ],
    },
  }
  assert.equal(isObjectiveMet(twoGoals, 0, { leaf: 5 }), false, 'one of two goals is not a win')
  assert.equal(isObjectiveMet(twoGoals, 0, { leaf: 5, drop: 5 }), true)
})

test('star progress lights up in order as score climbs', () => {
  assert.deepEqual(starRatingProgress(scoreLevel, 0, {}), [false, false, false])
  assert.deepEqual(starRatingProgress(scoreLevel, 1000, {}), [true, false, false])
  assert.deepEqual(starRatingProgress(scoreLevel, 1500, {}), [true, true, false])
  assert.deepEqual(starRatingProgress(scoreLevel, 2500, {}), [true, true, true])
})

/* --------------------------- level generation ----------------------------- */

test('level generation is deterministic — the same id always yields the same stage', () => {
  for (const id of [1, 7, 12, 13, 60, 144, 500]) {
    assert.deepEqual(getLevel(id), getLevel(id), `level ${id} must be stable`)
  }
})

test('generated levels are structurally sane', () => {
  for (let id = 1; id <= 60; id++) {
    const level = getLevel(id)
    assert.equal(level.id, id)
    assert.ok(level.rows > 0 && level.cols > 0, `level ${id} board size`)
    assert.ok(level.moves > 0, `level ${id} moves`)
    assert.ok(level.types.length >= 3, `level ${id} needs enough colours to be playable`)
    assert.ok(level.star3 > level.star2, `level ${id} star thresholds must ascend`)
    if (level.objective.kind === 'collect') {
      for (const goal of level.objective.collect ?? []) {
        assert.ok(goal.count > 0)
        assert.ok(level.types.includes(goal.type), `level ${id} must contain the tile it asks for`)
      }
    }
  }
})

test('chapters partition levels into fixed-size blocks', () => {
  assert.equal(chapterOf(1).id, 1)
  assert.equal(chapterOf(LEVELS_PER_CHAPTER).id, 1)
  assert.equal(chapterOf(LEVELS_PER_CHAPTER + 1).id, 2)
  assert.equal(stageInChapter(1), 1)
  assert.equal(stageInChapter(LEVELS_PER_CHAPTER), LEVELS_PER_CHAPTER)
  assert.equal(stageInChapter(LEVELS_PER_CHAPTER + 1), 1)
})

test('the world never dead-ends — progression continues past the authored chapters', () => {
  assert.equal(nextLevelId(1), 2)
  const beyond = CHAPTERS.length * LEVELS_PER_CHAPTER + 1
  assert.ok(getLevel(beyond).id === beyond, 'levels past the last chapter still generate')
  assert.ok(chapterOf(beyond).title.length > 0, 'and still resolve to a themed chapter')
})

/* ---------------------------- end-of-stage rules --------------------------- */

test('a stage is won the moment the objective is met, even on the last move', () => {
  assert.equal(levelOutcome(scoreLevel, 1000, 0, {}), 'won')
  assert.equal(levelOutcome(scoreLevel, 1000, 5, {}), 'won')
})

test('a stage is lost when the moves run out with the objective unmet', () => {
  assert.equal(levelOutcome(scoreLevel, 999, 0, {}), 'lost')
  assert.equal(levelOutcome(collectLevel, 99999, 0, { leaf: 9 }), 'lost')
})

test('play continues while moves remain and the objective is unmet', () => {
  assert.equal(levelOutcome(scoreLevel, 0, 25, {}), 'playing')
  assert.equal(levelOutcome(scoreLevel, 999, 1, {}), 'playing')
  assert.equal(levelOutcome(collectLevel, 0, 3, { leaf: 9 }), 'playing')
})

test('negative or exhausted move counts still resolve to a loss', () => {
  assert.equal(levelOutcome(scoreLevel, 0, -1, {}), 'lost')
})

test('spare moves pay a bonus on a win and nothing on a loss', () => {
  assert.equal(finalScoreFor(2960, 25, true), 2960 + 2500, '25 spare moves = +2500')
  assert.equal(finalScoreFor(2960, 0, true), 2960)
  assert.equal(finalScoreFor(2960, 25, false), 2960, 'no bonus when the stage is lost')
  assert.equal(finalScoreFor(500, -3, true), 500, 'never subtract for negative moves')
})

test('stars are awarded by final score, and never for a loss', () => {
  // scoreLevel: star2 = 1500, star3 = 2500
  assert.equal(starsFor(scoreLevel, 0, true), 1, 'clearing the stage always earns one star')
  assert.equal(starsFor(scoreLevel, 1499, true), 1)
  assert.equal(starsFor(scoreLevel, 1500, true), 2)
  assert.equal(starsFor(scoreLevel, 2499, true), 2)
  assert.equal(starsFor(scoreLevel, 2500, true), 3)
  assert.equal(starsFor(scoreLevel, 999999, false), 0, 'a loss scores no stars regardless')
})

test('the observed device win resolves exactly as the modal reported it', () => {
  // From the Maestro run: 25 spare moves, 3 stars, "+2500 score bonus", 5,460 final.
  const won = levelOutcome(scoreLevel, 2960, 25, {}) === 'won'
  const final = finalScoreFor(2960, 25, won)
  assert.equal(won, true)
  assert.equal(final, 5460)
  assert.equal(starsFor(scoreLevel, final, won), 3)
})

/* ---------------------------------------------------------------------------
 * Chapter decoration art
 *
 * Every chapter paints one decoration chosen from its backdrop key. A typo in
 * that mapping, or art that is renamed without updating it, produces a silently
 * broken image on the chapter screen rather than an error — locked chapters are
 * also awkward to reach by hand, so this is checked here instead.
 * ------------------------------------------------------------------------- */
test('every chapter maps to a decoration that ships', async () => {
  const { readdirSync } = await import('node:fs')
  const shipped = new Set(
    readdirSync('public/game/assets')
      .filter((f) => f.endsWith('.webp'))
      .map((f) => f.replace('.webp', '')),
  )
  for (const ch of CHAPTERS) {
    const key = chapterDecoKey(ch.bg)
    assert.ok(shipped.has(key), `chapter ${ch.id} (${ch.bg}) wants ${key}.webp, which is not in public/game/assets`)
  }
})

test('forest and night chapters use the tree and the moon', () => {
  assert.equal(chapterDecoKey('bg-forest'), 'deco-tree')
  assert.equal(chapterDecoKey('bg-night'), 'deco-moon')
  // Both are reached by real chapters, so the art is actually seen in play.
  assert.ok(CHAPTERS.some((c) => c.bg === 'bg-forest'), 'no chapter uses bg-forest')
  assert.ok(CHAPTERS.some((c) => c.bg === 'bg-night'), 'no chapter uses bg-night')
})

/**
 * ChapterScreen renders the decoration in a w-44 box, measured at 179 CSS px on
 * device, before the display's own pixel ratio is applied. Anything narrower is
 * being upscaled.
 *
 * Five decorations are still below that. They are pinned here rather than
 * ignored: the set may only shrink. Adding a new undersized decoration fails,
 * and replacing one of these with proper art also fails until it is removed
 * from the list, so the debt cannot quietly persist.
 */
const RENDER_BOX = 176
const KNOWN_UNDERSIZED = ['deco-arch', 'deco-island', 'deco-lamp', 'deco-sign', 'deco-waterfall']

test('no decoration is undersized except the known backlog', async () => {
  const sharp = (await import('sharp')).default
  const undersized = new Set<string>()
  for (const ch of CHAPTERS) {
    const key = chapterDecoKey(ch.bg)
    const m = await sharp(`public/game/assets/${key}.webp`).metadata()
    if ((m.width ?? 0) < RENDER_BOX) undersized.add(key)
  }
  assert.deepEqual(
    [...undersized].sort(),
    KNOWN_UNDERSIZED,
    'the undersized-decoration list changed — shrink KNOWN_UNDERSIZED when art is fixed, and never grow it',
  )
})

test('the replaced tree and moon clear the render box', async () => {
  const sharp = (await import('sharp')).default
  for (const key of ['deco-tree', 'deco-moon']) {
    const m = await sharp(`public/game/assets/${key}.webp`).metadata()
    assert.ok((m.width ?? 0) >= RENDER_BOX, `${key} is ${m.width}px, under the ${RENDER_BOX}px box`)
  }
})

/**
 * The floating decoration sits at the top of a clipped scroll container, so the
 * space reserved above it must cover the travel of its own animation. This
 * previously held only because the art carried empty pixels above the subject,
 * and cropping a replacement tightly to its alpha bounds cut the top off the
 * tree with nothing failing. Both numbers are read from the stylesheet so the
 * relationship is checked rather than assumed.
 */
test('float clearance covers the float animation travel', async () => {
  const { readFileSync } = await import('node:fs')
  const css = readFileSync('src/app/globals.css', 'utf8')

  // The keyframe body contains nested braces, so isolate its line first and
  // take the largest magnitude of each property across all the stops.
  const line = css.split('\n').find((l) => l.includes('@keyframes ww-float-y'))
  assert.ok(line, '@keyframes ww-float-y is missing')

  const lifts = [...line.matchAll(/translateY\((-?\d+(?:\.\d+)?)px\)/g)].map((m) => Math.abs(Number(m[1])))
  assert.ok(lifts.length, 'no translateY found in @keyframes ww-float-y')
  const travel = Math.max(...lifts)

  const rots = [...line.matchAll(/rotate\((-?\d+(?:\.\d+)?)deg\)/g)].map((m) => Math.abs(Number(m[1])))
  assert.ok(rots.length, 'no rotate found in @keyframes ww-float-y')
  // Rotating a box about its centre lifts the top corner by (width/2)*sin(angle).
  const DECO_WIDTH = 176 // Tailwind w-44, the box the decoration paints into
  const rotationLift = (DECO_WIDTH / 2) * Math.sin((Math.max(...rots) * Math.PI) / 180)

  const clear = css.match(/\.anim-float-clearance\s*\{\s*margin-top:\s*(\d+(?:\.\d+)?)px/)
  assert.ok(clear, '.anim-float-clearance is missing or no longer uses a px margin-top')
  const clearance = Number(clear[1])

  assert.ok(
    clearance >= travel + rotationLift,
    `clearance is ${clearance}px but the float needs ${(travel + rotationLift).toFixed(1)}px ` +
      `(${travel}px lift + ${rotationLift.toFixed(1)}px from the rotation) — the decoration will clip`,
  )
})

test('the chapter decoration reserves that clearance', async () => {
  const { readFileSync } = await import('node:fs')
  const tsx = readFileSync('src/components/game/ChapterScreen.tsx', 'utf8')
  const img = tsx.match(/className="[^"]*anim-float[^"]*"/)
  assert.ok(img, 'could not find the floating decoration in ChapterScreen')
  assert.match(
    img[0],
    /anim-float-clearance/,
    'the floating decoration lost its clearance class and will clip at the top of the scroll container',
  )
})
