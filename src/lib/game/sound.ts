// Wonderweave — WebAudio synth for game SFX + generative ambient music.
// No audio files needed; respects music/sfx volume settings.

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
    musicGain = ctx.createGain()
    musicGain.gain.value = musicVol * 0.35
    musicGain.connect(ctx.destination)
    try {
      const raw = JSON.parse(localStorage.getItem('ww-settings') ?? '{}') as { musicVol?: number; sfxVol?: number }
      if (typeof raw.musicVol === 'number') musicVol = raw.musicVol
      if (typeof raw.sfxVol === 'number') sfxVol = raw.sfxVol
      if (sfxGain) sfxGain.gain.value = sfxVol
      if (musicGain) musicGain.gain.value = musicVol * 0.35
    } catch {
      /* defaults fine */
    }
  }
  if (ctx.state === 'suspended') void ctx.resume()
}

export function setSfxVolume(v: number): void {
  sfxVol = Math.max(0, Math.min(1, v))
  if (sfxGain && ctx) sfxGain.gain.setTargetAtTime(sfxVol, ctx.currentTime, 0.03)
}

export function setMusicVolume(v: number): void {
  musicVol = Math.max(0, Math.min(1, v))
  if (musicGain && ctx) musicGain.gain.setTargetAtTime(musicVol * 0.35, ctx.currentTime, 0.05)
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
    tone(660, 0.07, { type: 'triangle', vol: 0.15 })
  },
  swap(): void {
    noiseBurst(0.09, 0.08, 0, 2400)
    tone(440, 0.08, { type: 'triangle', vol: 0.1, slideTo: 520 })
  },
  invalid(): void {
    tone(160, 0.12, { type: 'square', vol: 0.08 })
    tone(140, 0.14, { type: 'square', vol: 0.08, delay: 0.08 })
  },
  pop(cascade: number, index = 0): void {
    const base = LADDER[Math.min(LADDER.length - 1, cascade + Math.floor(index / 3))]
    tone(base, 0.22, { vol: 0.2 })
    tone(base * 2, 0.12, { vol: 0.07, delay: 0.02 })
  },
  specialCreate(): void {
    ;[880, 1108.7, 1318.5].forEach((f, i) => tone(f, 0.16, { vol: 0.14, delay: i * 0.05 }))
  },
  prism(): void {
    tone(400, 0.5, { type: 'sawtooth', vol: 0.1, slideTo: 1600 })
    noiseBurst(0.4, 0.06, 0.05, 3200)
  },
  line(): void {
    noiseBurst(0.25, 0.12, 0, 900)
    tone(300, 0.25, { type: 'sawtooth', vol: 0.1, slideTo: 900 })
  },
  bomb(): void {
    tone(120, 0.3, { type: 'sine', vol: 0.3, slideTo: 50 })
    noiseBurst(0.25, 0.16, 0, 500)
  },
  star(i: number): void {
    const notes = [659.25, 783.99, 1046.5]
    tone(notes[Math.min(i, 2)], 0.3, { vol: 0.22 })
    tone(notes[Math.min(i, 2)] * 2, 0.2, { vol: 0.08, delay: 0.03 })
  },
  win(): void {
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.34, { vol: 0.2, delay: i * 0.13 }))
  },
  lose(): void {
    ;[392, 329.63, 261.63].forEach((f, i) => tone(f, 0.4, { type: 'triangle', vol: 0.16, delay: i * 0.18 }))
  },
  ui(): void {
    tone(740, 0.06, { type: 'triangle', vol: 0.12 })
  },
  shuffle(): void {
    for (let i = 0; i < 6; i++) noiseBurst(0.05, 0.05, i * 0.05, 1600 + i * 300)
  },
  booster(): void {
    ;[783.99, 987.77, 1174.66].forEach((f, i) => tone(f, 0.14, { type: 'triangle', vol: 0.16, delay: i * 0.06 }))
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
    ;[392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.5, { vol: 0.14, delay: i * 0.16 }))
    noiseBurst(0.8, 0.05, 0.2, 2200)
  },
  reward(): void {
    ;[659.25, 830.61, 987.77, 1318.5].forEach((f, i) => tone(f, 0.22, { vol: 0.16, delay: i * 0.09 }))
  },
  tick(): void {
    tone(880, 0.05, { type: 'triangle', vol: 0.08 })
  },
}

/* ---------------- generative ambient music ---------------- */
// A slow, gentle harp wandering a pentatonic scale with soft pads.

const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 784.0, 880.0]
const PADS: number[][] = [
  [130.81, 196.0, 261.63], // C
  [146.83, 220.0, 293.66], // Dm-ish
  [174.61, 261.63, 349.23], // F
  [196.0, 246.94, 392.0], // G
]

let musicTimer: ReturnType<typeof setInterval> | null = null
let beat = 0

function pluck(freq: number, when: number, vol = 0.16): void {
  if (!ctx || !musicGain) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, when)
  gain.gain.exponentialRampToValueAtTime(vol, when + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 1.6)
  osc.connect(gain).connect(musicGain)
  osc.start(when)
  osc.stop(when + 1.7)
}

function pad(freqs: number[], when: number): void {
  if (!ctx || !musicGain) return
  for (const f of freqs) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = f
    gain.gain.setValueAtTime(0.0001, when)
    gain.gain.linearRampToValueAtTime(0.05, when + 1.2)
    gain.gain.linearRampToValueAtTime(0.0001, when + 4.4)
    osc.connect(gain).connect(musicGain)
    osc.start(when)
    osc.stop(when + 4.5)
  }
}

/** Begin the ambient loop (idempotent). Only audible when musicVol > 0. */
export function startMusic(): void {
  if (typeof window === 'undefined') return
  if (musicTimer || musicVol <= 0) return
  initAudio()
  if (!ctx) return
  beat = 0
  const BEAT = 0.62 // seconds per step (~97 bpm feel with long notes)
  musicTimer = setInterval(() => {
    if (!ctx || musicVol <= 0) return
    const t = ctx.currentTime + 0.05
    const bar = Math.floor(beat / 8)
    // harp arpeggio: 2 notes per beat, dreamy pattern
    if (beat % 2 === 0) {
      const n = SCALE[(bar * 3 + beat) % SCALE.length]
      pluck(n, t, 0.14)
    } else if (Math.random() < 0.7) {
      const n = SCALE[Math.floor(Math.random() * SCALE.length)]
      pluck(n, t, 0.09)
    }
    // soft pad each bar
    if (beat % 8 === 0) pad(PADS[bar % PADS.length], t)
    beat = (beat + 1) % 512
  }, BEAT * 1000)
}

export function stopMusic(): void {
  if (musicTimer) {
    clearInterval(musicTimer)
    musicTimer = null
  }
}
