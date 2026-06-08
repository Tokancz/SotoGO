// Loads Google Identity Services and renders the official "Sign in with Google"
// button. We use Google's own button (rather than a custom one) because it's the
// supported, reliable path: clicking it runs Google's flow and hands us back an
// ID token (`credential`), which we forward to the backend for verification.
import { ref } from 'vue'

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
let scriptPromise: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve()
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('load-failed')))
      return
    }
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('load-failed'))
    document.head.appendChild(script)
  })
  return scriptPromise
}

export function useGoogleSignIn(onCredential: (credential: string) => void) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
  const configured = Boolean(clientId)
  const error = ref<string | null>(null)

  async function render(target: HTMLElement) {
    if (!configured) return
    try {
      await loadScript()
      const id = window.google!.accounts.id
      id.initialize({
        client_id: clientId!,
        callback: (res) => onCredential(res.credential),
        cancel_on_tap_outside: true,
      })
      id.renderButton(target, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        logo_alignment: 'center',
        width: Math.min(target.clientWidth || 320, 400),
      })
    } catch {
      error.value = 'Google se nepodařilo načíst. Zkontroluj připojení.'
    }
  }

  return { render, configured, error }
}
