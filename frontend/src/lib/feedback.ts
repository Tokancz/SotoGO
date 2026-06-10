// Synthesized sound effects + haptics — no audio files, everything is generated
// with the Web Audio API and tuned right here. Each effect is gated on the
// user's settings (sound / haptics toggles in Profil).
import { getAudioContext } from '@/lib/audioContext'
import { useSettingsStore } from '@/stores/settings'
import type { Rarity } from '@/types/game'

interface Note {
  freq: number
  dur?: number
  type?: OscillatorType
  gain?: number
  /** Pitch glide target by the note's end (e.g. a little "boop" rise/fall). */
  slideTo?: number
}

function soundOn(): boolean {
  try {
    return useSettingsStore().sound
  } catch {
    return false
  }
}

function hapticsOn(): boolean {
  try {
    return useSettingsStore().haptics
  } catch {
    return false
  }
}

/** Schedule a single shaped tone at absolute time `t0`. */
function tone(c: AudioContext, t0: number, n: Note) {
  const { freq, dur = 0.12, type = 'sine', gain = 0.18, slideTo } = n
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
  // Quick attack, exponential decay — gives a plucky, arcade feel.
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.03)
}

/** Play notes one after another (a quick arpeggio). */
function arp(notes: Note[], step = 0.085) {
  if (!soundOn()) return
  const c = getAudioContext()
  if (!c) return
  let t = c.currentTime + 0.001
  for (const n of notes) {
    tone(c, t, n)
    t += step
  }
}

/** Play notes simultaneously (a chord). */
function chord(notes: Note[]) {
  if (!soundOn()) return
  const c = getAudioContext()
  if (!c) return
  const t = c.currentTime + 0.001
  for (const n of notes) tone(c, t, n)
}

function vibrate(pattern: number | number[]) {
  try {
    if (!hapticsOn()) return
    navigator.vibrate?.(pattern)
  } catch {
    /* unsupported — no-op */
  }
}

// Major-scale note frequencies we reuse below.
const N = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, E6: 1318.5, G6: 1568 }

export const fx = {
  /** Generic UI tick — fired on any button/tab/toggle via the global listener.
   *  Very short and quiet so rapid navigation never gets fatiguing. */
  click() {
    arp([{ freq: 520, dur: 0.028, type: 'sine', gain: 0.05, slideTo: 380 }])
  },

  /** Toggle flip — a slightly brighter two-step tick. */
  toggle(on: boolean) {
    arp(
      on
        ? [{ freq: 480, dur: 0.03, type: 'square', gain: 0.05, slideTo: 660 }]
        : [{ freq: 480, dur: 0.03, type: 'square', gain: 0.05, slideTo: 320 }],
    )
  },

  /** Battle tap — tiny plucky blip (kept quiet; it fires rapidly). */
  tap() {
    arp([{ freq: 330, dur: 0.05, type: 'triangle', gain: 0.09, slideTo: 260 }])
  },

  /** Catch success — an ascending chime that grows with rarity. */
  catch(rarity: Rarity) {
    const base: Note[] = [
      { freq: N.C5, dur: 0.12, type: 'triangle', gain: 0.16 },
      { freq: N.E5, dur: 0.12, type: 'triangle', gain: 0.16 },
      { freq: N.G5, dur: 0.14, type: 'triangle', gain: 0.16 },
    ]
    if (rarity === 'rare') base.push({ freq: N.C6, dur: 0.16, type: 'triangle', gain: 0.16 })
    if (rarity === 'epic')
      base.push({ freq: N.C6, dur: 0.14, type: 'triangle', gain: 0.16 }, { freq: N.E6, dur: 0.18, type: 'triangle', gain: 0.16 })
    if (rarity === 'legendary')
      base.push(
        { freq: N.C6, dur: 0.12, type: 'triangle', gain: 0.16 },
        { freq: N.E6, dur: 0.12, type: 'triangle', gain: 0.16 },
        { freq: N.G6, dur: 0.22, type: 'triangle', gain: 0.18 },
      )
    arp(base, 0.08)
  },

  /** Gym/battle victory fanfare. */
  victory() {
    arp(
      [
        { freq: N.G5, dur: 0.12, type: 'sawtooth', gain: 0.14 },
        { freq: N.C6, dur: 0.12, type: 'sawtooth', gain: 0.14 },
        { freq: N.E6, dur: 0.12, type: 'sawtooth', gain: 0.14 },
        { freq: N.G6, dur: 0.26, type: 'sawtooth', gain: 0.16 },
      ],
      0.1,
    )
  },

  /** Battle loss — a soft descending "aww". */
  defeat() {
    arp(
      [
        { freq: 392, dur: 0.16, type: 'sine', gain: 0.14, slideTo: 349 },
        { freq: 294, dur: 0.28, type: 'sine', gain: 0.14, slideTo: 233 },
      ],
      0.14,
    )
  },

  /** Level up — bigger two-stage jingle. */
  levelUp() {
    arp(
      [
        { freq: N.C5, dur: 0.1, type: 'triangle', gain: 0.16 },
        { freq: N.E5, dur: 0.1, type: 'triangle', gain: 0.16 },
        { freq: N.G5, dur: 0.1, type: 'triangle', gain: 0.16 },
        { freq: N.C6, dur: 0.1, type: 'triangle', gain: 0.16 },
        { freq: N.E6, dur: 0.3, type: 'triangle', gain: 0.18 },
      ],
      0.09,
    )
    // Sparkle tail.
    setTimeout(() => chord([{ freq: N.G6, dur: 0.4, type: 'sine', gain: 0.1 }, { freq: N.E6, dur: 0.4, type: 'sine', gain: 0.08 }]), 460)
  },

  /** Quest/daily reward claimed — coin-like double blip. */
  reward() {
    arp(
      [
        { freq: N.A5, dur: 0.09, type: 'square', gain: 0.12 },
        { freq: N.E6, dur: 0.16, type: 'square', gain: 0.12 },
      ],
      0.08,
    )
  },

  /** Stop check-in — a soft confirming "ding". */
  visit() {
    arp([
      { freq: N.E5, dur: 0.1, type: 'sine', gain: 0.14 },
      { freq: N.B5, dur: 0.16, type: 'sine', gain: 0.14 },
    ])
  },
}

export const haptic = {
  light: () => vibrate(10),
  medium: () => vibrate(20),
  success: () => vibrate([0, 25, 35, 25]),
  win: () => vibrate([0, 40, 30, 60]),
  error: () => vibrate([0, 60, 40, 60]),
}
