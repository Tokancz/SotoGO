// ŠotoGO — Toasts
// A tiny global queue for transient notifications (e.g. an achievement unlock).
// Components push toasts; SgToastHost renders them and they auto-dismiss.
import { defineStore } from 'pinia'

export interface Toast {
  id: number
  /** Eyebrow shown above the title, e.g. "Nový achievement!". */
  eyebrow?: string
  title: string
  description?: string
  icon?: string
  /** Accent color (CSS value). */
  color?: string
}

let nextId = 1

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: [] as Toast[],
  }),

  actions: {
    /** Show a toast; it dismisses itself after `durationMs`. */
    push(toast: Omit<Toast, 'id'>, durationMs = 4000) {
      const id = nextId++
      this.toasts.push({ ...toast, id })
      setTimeout(() => this.dismiss(id), durationMs)
      return id
    },

    dismiss(id: number) {
      this.toasts = this.toasts.filter((t) => t.id !== id)
    },
  },
})
