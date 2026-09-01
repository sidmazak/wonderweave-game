// Wonderweave — tiny WebAudio synth for game SFX (no audio files needed).
// All sounds are synthesized; respects a global mute flag persisted to localStorage.

let ctx: AudioContext | null = null
let master: GainNode | null = null
let muted = false

export function initAudio(): void {
  if (typeof window === 'undefined') return
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(ctx.destination)
    const saved = localStorage.getItem('ww-muted')
    muted = saved === '1'
  }
  if (ctx.state === 'suspended') void ctx.resume()
}

export function setMuted(m: boolean): void {
  muted = m
  if (typeof window !== 'undefined') localStorage.setItem('ww-muted', m ? '1' : '0')
  if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.5, ctx.currentTime, 0.02)
}

export function isMuted(): boolean {
  return muted
}

function tone(
  freq: number,
  duration: number,
  opts: { type?: OscillatorType; vol?: number; delay?: number; slideTo?: number; attack?: number } = {},
): void {
  if (!ctx || !master || muted) return
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
  osc.connect(gain).connect(master)
  osc.start(t0)
  osc.stop(t0 + duration + 0.05)
}

function noiseBurst(duration: number, vol = 0.12, delay = 0, filterFreq = 1200): void {
  if (!ctx || !master || muted) return
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
  src.connect(filter).connect(gain).connect(master)
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
}
