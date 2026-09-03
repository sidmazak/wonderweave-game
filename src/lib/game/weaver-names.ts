/** Poetic weaver names — color · flora · fauna · archetype, all client-side. */

const COLORS = [
  'Ash', 'Gold', 'Jade', 'Moss', 'Rust', 'Plum', 'Teal', 'Snow', 'Dusk', 'Dawn',
  'Pearl', 'Ruby', 'Mist', 'Rose', 'Amber', 'Wine', 'Opal', 'Soot', 'Frost', 'Coral',
  'Ivory', 'Copper', 'Silver', 'Bronze', 'Cobalt', 'Violet', 'Crimson',
]

const PLANTS = [
  'Oak', 'Elm', 'Yew', 'Reed', 'Fern', 'Ivy', 'Birch', 'Holly', 'Willow', 'Cedar',
  'Maple', 'Hazel', 'Clover', 'Briar', 'Thorn', 'Bloom', 'Petal', 'Vine', 'Grove',
  'Alder', 'Rowan', 'Gorse', 'Heath', 'Bramble', 'Thistle', 'Nettle',
]

const FRUITS = [
  'Plum', 'Pear', 'Berry', 'Fig', 'Lime', 'Kiwi', 'Date', 'Grape', 'Mango', 'Peach',
  'Melon', 'Pomme', 'Dew', 'Nectar',
]

const ANIMALS = [
  'Fox', 'Owl', 'Hare', 'Wren', 'Stag', 'Swan', 'Moth', 'Lynx', 'Crow', 'Dove',
  'Newt', 'Hawk', 'Wolf', 'Finch', 'Pike', 'Doe', 'Otter', 'Vole', 'Robin', 'Heron',
  'Crane', 'Badger', 'Raven', 'Salmon', 'Trout', 'Bee', 'Marten',
]

const ARCHETYPES = [
  'Sage', 'Seer', 'Muse', 'Scout', 'Bard', 'Monk', 'Druid', 'Ward', 'Keeper', 'Binder',
  'Weaver', 'Spinner', 'Loom', 'Knit', 'Thrum', 'Glyph', 'Rune', 'Weft', 'Lore', 'Fable',
  'Warden', 'Herald', 'Smith', 'Mason', 'Guide', 'Seeker', 'Walker', 'Tender',
]

const MAX_LEN = 18

/** Old auto-names like Wrenspinner-4830 — replace on load and never reuse. */
const LEGACY_AUTO_NAME = /(weaver|spinner|threader|stitcher|loomer)-\d{4}$/i

export function isLegacyWeaverName(name: string): boolean {
  return LEGACY_AUTO_NAME.test(name.trim())
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Favor readable three-word titles that fit the 18-char field. */
const BUILDERS = [
  () => `${pick(COLORS)}${pick(PLANTS)}${pick(ANIMALS)}`,
  () => `${pick(COLORS)}${pick(FRUITS)}${pick(ARCHETYPES)}`,
  () => `${pick(PLANTS)}${pick(ANIMALS)}${pick(ARCHETYPES)}`,
  () => `${pick(COLORS)}${pick(ANIMALS)}${pick(ARCHETYPES)}`,
  () => `${pick(COLORS)}${pick(PLANTS)}${pick(ARCHETYPES)}`,
  () => `${pick(FRUITS)}${pick(ANIMALS)}${pick(ARCHETYPES)}`,
  () => `${pick(COLORS)}${pick(PLANTS)}${pick(FRUITS)}`,
  () => `${pick(PLANTS)}${pick(FRUITS)}${pick(ANIMALS)}`,
]

/** e.g. GoldOakFox, JadePlumSeer, BriarHareWarden */
export function generateWeaverName(): string {
  for (let i = 0; i < 48; i++) {
    const name = pick(BUILDERS)()
    if (name.length >= 8 && name.length <= MAX_LEN) return name
  }
  return `${pick(COLORS)}${pick(ANIMALS)}${pick(ARCHETYPES)}`.slice(0, MAX_LEN)
}
