import { nextTick, onBeforeUnmount, watch, type Ref } from 'vue'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export interface UseDialogOptions {
  /** Invoked on Escape (and used to know the dialog should close). */
  onClose: () => void
  /**
   * Reactive open state, for dialogs rendered with `v-if` *inside* a
   * long-lived host (e.g. a sheet toggled by a `ref`). When omitted, the
   * dialog is assumed to share the host component's mount lifecycle.
   */
  active?: () => boolean
}

/**
 * Gives a modal the standard keyboard contract: moves focus inside on open,
 * traps Tab within the panel, closes on Escape, makes the rest of the app
 * `inert`, and restores focus to the trigger on close.
 *
 * Pass the `[role="dialog"]` panel element. The panel must live under the
 * `.app-shell` root (directly or via `<Teleport>`).
 */
export function useDialog(panel: Ref<HTMLElement | null>, opts: UseDialogOptions) {
  let trigger: HTMLElement | null = null
  const inerted: HTMLElement[] = []
  let listening = false

  function focusable(): HTMLElement[] {
    if (!panel.value) return []
    return Array.from(panel.value.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    )
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      opts.onClose()
      return
    }
    if (e.key !== 'Tab' || !panel.value) return
    const items = focusable()
    if (items.length === 0) {
      e.preventDefault()
      panel.value.focus()
      return
    }
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement as HTMLElement | null
    const inside = panel.value.contains(active)
    if (e.shiftKey && (active === first || !inside)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && (active === last || !inside)) {
      e.preventDefault()
      first.focus()
    }
  }

  function activate() {
    const el = panel.value
    if (!el || listening) return
    trigger = document.activeElement as HTMLElement | null

    // Everything outside the dialog becomes inert (siblings within the shell).
    const shell = el.closest('.app-shell') ?? document.body
    for (const child of Array.from(shell.children) as HTMLElement[]) {
      if (!child.contains(el)) {
        child.setAttribute('inert', '')
        inerted.push(child)
      }
    }

    const first = focusable()[0]
    if (first) {
      first.focus()
    } else {
      el.setAttribute('tabindex', '-1')
      el.focus()
    }

    document.addEventListener('keydown', onKeydown, true)
    listening = true
  }

  function deactivate() {
    if (listening) {
      document.removeEventListener('keydown', onKeydown, true)
      listening = false
    }
    for (const el of inerted) el.removeAttribute('inert')
    inerted.length = 0
    // Un-inert first, then hand focus back — focus() is ignored on inert trees.
    trigger?.focus?.()
    trigger = null
  }

  if (opts.active) {
    watch(
      opts.active,
      async (on) => {
        if (on) {
          await nextTick() // wait for the panel to render
          activate()
        } else {
          deactivate()
        }
      },
      { immediate: true },
    )
  } else {
    // Host shares the dialog's lifecycle: activate after its first paint.
    nextTick().then(activate)
  }

  onBeforeUnmount(deactivate)
}
