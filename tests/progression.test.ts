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
