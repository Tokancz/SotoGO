// Generative ambient background loop — a calm, dreamy I–V–vi–IV pad with a
// gentle celesta-like sparkle on top, in the spirit of the Pokémon GO map theme.
// Fully synthesized (no audio file), scheduled with a lookahead clock so it
// loops seamlessly and forever. Volume is intentionally low; it's a bed.
import { getAudioContext } from '@/lib/audioContext'

// Each chord: a low root + a soft triad voicing (C major, I–V–vi–IV).
const PROG: number[][] = [
  [130.81, 261.63, 329.63, 392.0], // C  (C3 C4 E4 G4)
  [196.0, 246.94, 293.66, 392.0], // G  (G3 B3 D4 G4)
  [220.0, 261.63, 329.63, 440.0], // Am (A3 C4 E4 A4)
  [174.61, 261.63, 349.23, 440.0], // F  (F3 C4 F4 A4)
]

const BAR = 3.8 // seconds each chord is held
const PAD_GAIN = 0.045 // per pad voice (kept low — it's ambience)
const SPARKLE_GAIN = 0.05

let master: GainNode | null = null
let timer: ReturnType<typeof setInterval> | null = null
let nextBarTime = 0
let bar = 0
let running = false

function scheduleBar(c: AudioContext, t0: number, chord: number[]) {
  if (!master) return

  // Pad: each voice swells in and fades out across the bar for a smooth, airy
  // sustain with no clicks at the chord change.
  for (const freq of chord) {
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.linearRampToValueAtTime(PAD_GAIN, t0 + 1.1)
    g.gain.setValueAtTime(PAD_GAIN, t0 + BAR - 1.3)
    g.gain.linearRampToValueAtTime(0.0001, t0 + BAR)
    osc.connect(g).connect(master)
    osc.start(t0)
    osc.stop(t0 + BAR + 0.05)
  }

  // Sparkle: a few soft bell notes from the upper chord tones, octave up, on a
  // loose rhythm — the twinkly motif that gives it that wandering, hopeful feel.
  const tops = chord.slice(2)
  const hits = 3
  for (let i = 0; i < hits; i++) {
    const freq = tops[(bar + i) % tops.length] * 2
    const at = t0 + 0.4 + i * (BAR / (hits + 1))
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(SPARKLE_GAIN, at + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.9)
    osc.connect(g).connect(master)
    osc.start(at)
    osc.stop(at + 1.0)
  }
}

// Lookahead scheduler: keep ~0.6s of audio queued ahead of the clock.
function tick() {
  const c = getAudioContext()
  if (!c || !master) return
  while (nextBarTime < c.currentTime + 0.6) {
    scheduleBar(c, nextBarTime, PROG[bar % PROG.length])
    nextBarTime += BAR
    bar++
  }
}

export const music = {
  get playing() {
    return running
  },

  start() {
    if (running) return
    const c = getAudioContext()
    if (!c) return
    running = true
    master = c.createGain()
    master.gain.setValueAtTime(0.0001, c.currentTime)
    master.gain.linearRampToValueAtTime(0.5, c.currentTime + 2) // gentle fade-in
    master.connect(c.destination)
    bar = 0
    nextBarTime = c.currentTime + 0.1
    tick()
    timer = setInterval(tick, 250)
  },

  stop() {
    if (!running) return
    running = false
    if (timer) clearInterval(timer)
    timer = null
    const c = getAudioContext()
    const m = master
    master = null
    if (c && m) {
      // Fade out, then drop the node so queued voices die quietly.
      m.gain.cancelScheduledValues(c.currentTime)
      m.gain.setValueAtTime(m.gain.value, c.currentTime)
      m.gain.linearRampToValueAtTime(0.0001, c.currentTime + 1.2)
      setTimeout(() => {
        try {
          m.disconnect()
        } catch {
          /* already gone */
        }
      }, 1400)
    }
  },
}
