// One shared Web Audio context for both SFX (lib/feedback) and the ambient music
// loop (lib/music). Created lazily and resumed on demand — browsers only allow
// audio to start from a user gesture, so the first call must come from one (a
// tap, a toggle, etc.). All callers here originate from user interactions.

let ctx: AudioContext | null = null

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}
