// Wonderweave — WebAudio engine: polished SFX + layered generative music.
// Music is scheduled with tight look-ahead timing and adapts per screen
// (home / map / play / night). No audio files needed; honours volume settings.

let ctx: AudioContext | null = null
let sfxGain: GainNode | null = null
let musicGain: GainNode | null = null
let sfxVol = 0.7
let musicVol = 0.5

export function initAudio(): void {
  if (typeof window === 'undefined') return
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    ctx = new AC()
    sfxGain = ctx.createGain()
    sfxGain.gain.value = sfxVol
    sfxGain.connect(ctx.destination)
    // gentle master shaping for music so it never fights the SFX
    const musicComp = ctx.createDynamicsCompressor()
    musicComp.threshold.value = -18
    musicComp.ratio.value = 4
    musicGain = ctx.createGain()
    musicGain.gain.value = musicVol * 0.32
    musicGain.connect(musicComp)
    musicComp.connect(ctx.destination)
    try {
      const raw = JSON.parse(localStorage.getItem('ww-settings') ?? '{}') as { musicVol?: number; sfxVol?: number }
      if (typeof raw.musicVol === 'number') musicVol = raw.musicVol
      if (typeof raw.sfxVol === 'number') sfxVol = raw.sfxVol
      if (sfxGain) sfxGain.gain.value = sfxVol
      if (musicGain) musicGain.gain.value = musicVol * 0.32
    } catch {
      /* defaults fine */
    }
    // save CPU + battery: suspend the graph while the tab is hidden
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return
      if (document.hidden) {
        if (ctx.state === 'running') void ctx.suspend()
      } else if (ctx.state === 'suspended' && (musicVol > 0 || sfxVol > 0)) {
        void ctx.resume()
      }
    })
  }
  if (ctx.state === 'suspended') void ctx.resume()
}

export function setSfxVolume(v: number): void {
  sfxVol = Math.max(0, Math.min(1, v))
  if (sfxGain && ctx) sfxGain.gain.setTargetAtTime(sfxVol, ctx.currentTime, 0.03)
}

export function setMusicVolume(v: number): void {
  musicVol = Math.max(0, Math.min(1, v))
  if (musicGain && ctx) musicGain.gain.setTargetAtTime(musicVol * 0.32, ctx.currentTime, 0.05)
  if (musicVol <= 0) stopMusic()
  else startMusic()
}

export function getSfxVolume(): number {
  return sfxVol
}

export function getMusicVolume(): number {
  return musicVol
}

/* ---------------- SFX primitives ---------------- */

function tone(
  freq: number,
  duration: number,
  opts: { type?: OscillatorType; vol?: number; delay?: number; slideTo?: number; attack?: number } = {},
): void {
  if (!ctx || !sfxGain || sfxVol <= 0) return
  const t0 = ctx.currentTime + (opts.delay ?? 0)
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = opts.type ?? 'sine'
  osc.frequency.setValueAtTime(freq, t0)
  if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, opts.slideTo), t0 + duration)
  const vol = opts.vol ?? 0.25
  const attack = opts.attack ?? 0.008
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(vol, t0 + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(gain).connect(sfxGain)
  osc.start(t0)
  osc.stop(t0 + duration + 0.05)
}

function noiseBurst(duration: number, vol = 0.12, delay = 0, filterFreq = 1200): void {
  if (!ctx || !sfxGain || sfxVol <= 0) return
  const t0 = ctx.currentTime + delay
  const len = Math.floor(ctx.sampleRate * duration)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = ctx.createBufferSource()
  src.buffer = buf
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = filterFreq
  const gain = ctx.createGain()
  gain.gain.value = vol
  src.connect(filter).connect(gain).connect(sfxGain)
  src.start(t0)
}

// pentatonic ladder for cascades — rises with combo count
const LADDER = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5, 1567.98, 1760]

export const sfx = {
  select(): void {
    tone(660, 0.07, { type: 'triangle', vol: 0.13 })
  },
  swap(): void {
    noiseBurst(0.09, 0.07, 0, 2400)
    tone(440, 0.08, { type: 'triangle', vol: 0.09, slideTo: 520 })
  },
  invalid(): void {
    tone(160, 0.12, { type: 'square', vol: 0.07 })
    tone(140, 0.14, { type: 'square', vol: 0.07, delay: 0.08 })
  },
  pop(cascade: number, index = 0): void {
    const base = LADDER[Math.min(LADDER.length - 1, cascade + Math.floor(index / 3))]
    tone(base, 0.22, { vol: 0.18 })
    tone(base * 2, 0.12, { vol: 0.06, delay: 0.02 })
  },
  specialCreate(): void {
    ;[880, 1108.7, 1318.5].forEach((f, i) => tone(f, 0.16, { vol: 0.13, delay: i * 0.05 }))
  },
  prism(): void {
    tone(400, 0.5, { type: 'sawtooth', vol: 0.09, slideTo: 1600 })
    noiseBurst(0.4, 0.05, 0.05, 3200)
  },
  line(): void {
    noiseBurst(0.25, 0.1, 0, 900)
    tone(300, 0.25, { type: 'sawtooth', vol: 0.09, slideTo: 900 })
  },
  bomb(): void {
    tone(120, 0.3, { type: 'sine', vol: 0.28, slideTo: 50 })
    noiseBurst(0.25, 0.14, 0, 500)
  },
  /** escalating fanfare for special+special weaves (tier 1..3) */
  combo(tier: number): void {
    const t = Math.min(3, Math.max(1, tier))
    const lift = 1 + (t - 1) * 0.25
    ;[523.25, 659.25, 783.99].forEach((f, i) => tone(f * lift, 0.18, { type: 'triangle', vol: 0.16, delay: i * 0.06 }))
    if (t >= 2) tone(1046.5 * lift, 0.3, { vol: 0.14, delay: 0.2 })
    if (t >= 3) {
      tone(1318.5, 0.35, { vol: 0.14, delay: 0.3 })
      noiseBurst(0.4, 0.08, 0.15, 2600)
    }
  },
  star(i: number): void {
    const notes = [659.25, 783.99, 1046.5]
    tone(notes[Math.min(i, 2)], 0.3, { vol: 0.2 })
    tone(notes[Math.min(i, 2)] * 2, 0.2, { vol: 0.07, delay: 0.03 })
  },
  win(): void {
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.34, { vol: 0.18, delay: i * 0.13 }))
    tone(1318.5, 0.5, { vol: 0.12, delay: 0.55 })
  },
  lose(): void {
    ;[392, 329.63, 261.63].forEach((f, i) => tone(f, 0.4, { type: 'triangle', vol: 0.14, delay: i * 0.18 }))
  },
  ui(): void {
    tone(740, 0.06, { type: 'triangle', vol: 0.11 })
  },
  uiBack(): void {
    tone(520, 0.07, { type: 'triangle', vol: 0.1, slideTo: 420 })
  },
  shuffle(): void {
    for (let i = 0; i < 6; i++) noiseBurst(0.05, 0.05, i * 0.05, 1600 + i * 300)
  },
  booster(): void {
    ;[783.99, 987.77, 1174.66].forEach((f, i) => tone(f, 0.14, { type: 'triangle', vol: 0.15, delay: i * 0.06 }))
  },
  lens(): void {
    tone(1200, 0.18, { vol: 0.1, slideTo: 1800 })
    tone(1600, 0.12, { vol: 0.08, delay: 0.1 })
  },
  nullify(): void {
    tone(500, 0.2, { type: 'square', vol: 0.1, slideTo: 180 })
    noiseBurst(0.15, 0.1, 0, 700)
  },
  ritual(): void {
    ;[392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.5, { vol: 0.13, delay: i * 0.16 }))
    noiseBurst(0.8, 0.05, 0.2, 2200)
  },
  reward(): void {
    ;[659.25, 830.61, 987.77, 1318.5].forEach((f, i) => tone(f, 0.22, { vol: 0.15, delay: i * 0.09 }))
  },
  tick(): void {
    tone(880, 0.05, { type: 'triangle', vol: 0.08 })
  },
  /** heartbeat when moves run low */
  urgent(): void {
    tone(220, 0.1, { type: 'sine', vol: 0.16 })
    tone(220, 0.1, { type: 'sine', vol: 0.12, delay: 0.16 })
  },
}

/* ---------------- layered generative music ----------------
 * Four layers per theme: warm pads (chords), a soft bass, harp/celesta
 * melody plucks and occasional high sparkles. A single look-ahead scheduler
 * keeps everything phase-locked; switching themes swaps the pattern live.
 */

export type MusicTheme = 'home' | 'map' | 'play' | 'night'

interface ThemeDef {
  step: number // seconds per melodic step
  chords: number[][]
  scale: number[]
  density: number // 0..1 melody probability per active step
  bassOn: boolean
  tickOn: boolean
  sparkle: number // probability per bar of a high bell
  melodyType: OscillatorType
  melodyVol: number
  melodyWalk: number // random-walk step size on the scale
}

const CHORDS = {
  C: [130.81, 196.0, 329.63], // C G E
  F: [87.31, 130.81, 220.0], // F C A
  G: [98.0, 146.83, 246.94], // G D B
  Am: [110.0, 164.81, 261.63], // A E C
  Dm: [73.42, 146.83, 349.23], // D A F
  Em: [82.41, 164.81, 246.94], // E B G
}

const SCALE_C = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0]
const SCALE_AM = [220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99]

const THEMES: Record<MusicTheme, ThemeDef> = {
  // warm storybook lullaby — the title/home theme
  home: {
    step: 0.62,
    chords: [CHORDS.C, CHORDS.F, CHORDS.Am, CHORDS.G],
    scale: SCALE_C,
    density: 0.55,
    bassOn: true,
    tickOn: false,
    sparkle: 0.3,
    melodyType: 'triangle',
    melodyVol: 0.11,
    melodyWalk: 2,
  },
  // curious travelling tune for the atlas / world map
  map: {
    step: 0.55,
    chords: [CHORDS.F, CHORDS.G, CHORDS.C, CHORDS.Am],
    scale: SCALE_C,
    density: 0.62,
    bassOn: true,
    tickOn: false,
    sparkle: 0.18,
    melodyType: 'triangle',
    melodyVol: 0.1,
    melodyWalk: 3,
  },
  // focused, gently rhythmic — gameplay keeps out of the way
  play: {
    step: 0.5,
    chords: [CHORDS.Dm, CHORDS.F, CHORDS.C, CHORDS.G],
    scale: SCALE_AM,
    density: 0.42,
    bassOn: true,
    tickOn: true,
    sparkle: 0.1,
    melodyType: 'sine',
    melodyVol: 0.09,
    melodyWalk: 2,
  },
  // dreamy moonlit vale
  night: {
    step: 0.78,
    chords: [CHORDS.Am, CHORDS.F, CHORDS.C, CHORDS.Em],
    scale: SCALE_AM,
    density: 0.4,
    bassOn: false,
    tickOn: false,
    sparkle: 0.34,
    melodyType: 'sine',
    melodyVol: 0.1,
    melodyWalk: 1,
  },
}

let musicTimer: ReturnType<typeof setInterval> | null = null
let nextNoteTime = 0
let stepIdx = 0
let lastScaleIdx = 4
let musicTheme: MusicTheme = 'home'
let playingTheme: MusicTheme = 'home'

function mPluck(freq: number, when: number, vol: number, type: OscillatorType, decay = 1.5): void {
  if (!ctx || !musicGain) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 3800
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, when)
  gain.gain.exponentialRampToValueAtTime(vol, when + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, when + decay)
  osc.connect(lp).connect(gain).connect(musicGain)
  osc.start(when)
  osc.stop(when + decay + 0.1)
}

function mPad(freqs: number[], when: number, barLen: number): void {
  if (!ctx || !musicGain) return
  for (const f of freqs) {
    for (const detune of [-2.5, 2.5]) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = f
      osc.detune.value = detune
      gain.gain.setValueAtTime(0.0001, when)
      gain.gain.linearRampToValueAtTime(0.028, when + barLen * 0.3)
      gain.gain.linearRampToValueAtTime(0.0001, when + barLen * 1.05)
      osc.connect(gain).connect(musicGain)
      osc.start(when)
      osc.stop(when + barLen * 1.1)
    }
  }
}

function mBass(freq: number, when: number): void {
  if (!ctx || !musicGain) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, when)
  gain.gain.exponentialRampToValueAtTime(0.09, when + 0.03)
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.9)
  osc.connect(gain).connect(musicGain)
  osc.start(when)
  osc.stop(when + 1)
}

function mTick(when: number): void {
  if (!ctx || !musicGain) return
  const len = Math.floor(ctx.sampleRate * 0.03)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = ctx.createBufferSource()
  src.buffer = buf
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 6000
  const gain = ctx.createGain()
  gain.gain.value = 0.016
  src.connect(hp).connect(gain).connect(musicGain)
  src.start(when)
}

function scheduleStep(globalStep: number, t: number): void {
  const def = THEMES[playingTheme]
  const bar = Math.floor(globalStep / 8)
  const beat = globalStep % 8
  const chord = def.chords[bar % def.chords.length]
  const barLen = def.step * 8

  if (beat === 0) mPad(chord, t, barLen)
  if (def.bassOn && (beat === 0 || beat === 4)) mBass(chord[0], t)
  if (def.tickOn && beat % 2 === 1) mTick(t)

  // melody: random walk on the scale, landing on chord tones at bar starts
  if (beat % 2 === 0 && Math.random() < def.density) {
    let idx = lastScaleIdx + Math.round((Math.random() * 2 - 1) * def.melodyWalk)
    if (beat === 0) idx = Math.floor(Math.random() * def.scale.length)
    idx = Math.max(0, Math.min(def.scale.length - 1, idx))
    lastScaleIdx = idx
    mPluck(def.scale[idx], t, def.melodyVol, def.melodyType)
  }
  // high sparkle bell
  if (beat === 0 && Math.random() < def.sparkle) {
    const n = def.scale[Math.floor(Math.random() * def.scale.length)] * 2
    mPluck(n, t + def.step * 4, 0.05, 'sine', 1.1)
  }
}

/** Begin the ambient loop (idempotent). theme switches the arrangement live. */
export function startMusic(theme?: MusicTheme): void {
  if (typeof window === 'undefined') return
  if (theme) musicTheme = theme
  if (musicTimer || musicVol <= 0) {
    return
  }
  initAudio()
  if (!ctx) return
  playingTheme = musicTheme
  nextNoteTime = ctx.currentTime + 0.1
  musicTimer = setInterval(() => {
    if (!ctx || musicVol <= 0) return
    if (playingTheme !== musicTheme) playingTheme = musicTheme
    const def = THEMES[playingTheme]
    while (nextNoteTime < ctx.currentTime + 0.32) {
      scheduleStep(stepIdx, nextNoteTime)
      stepIdx = (stepIdx + 1) % 4096
      nextNoteTime += def.step
    }
  }, 90)
}

export function setMusicTheme(theme: MusicTheme): void {
  if (musicTheme === theme) {
    startMusic()
    return
  }
  musicTheme = theme
  startMusic()
}

export function stopMusic(): void {
  if (musicTimer) {
    clearInterval(musicTimer)
    musicTimer = null
  }
}
