import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

/**
 * Animates a number from 0 up to a target value with an ease-out curve — the
 * little "tick up" that makes an XP / reward number feel earned. Respects
 * prefers-reduced-motion (snaps straight to the value). Re-runs whenever the
 * target changes (e.g. a fresh catch reveal).
 */
export function useCountUp(
  target: Ref<number> | (() => number),
  opts: { duration?: number } = {},
) {
  const display = ref(0)
  const duration = opts.duration ?? 850
  const getTarget = typeof target === 'function' ? target : () => target.value
  let raf = 0

  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  function run(to: number) {
    cancelAnimationFrame(raf)
    if (reduce || to <= 0) {
      display.value = to
      return
    }
    const start = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      display.value = Math.round(to * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
  }

  watch(getTarget, (v) => run(v ?? 0), { immediate: true })
  onBeforeUnmount(() => cancelAnimationFrame(raf))

  return display
}
