// ŠotoGO — Device camera access for the capture flow.
//
// Wraps getUserMedia (rear/environment camera) for a live preview and grabs a
// still frame to a canvas for OCR. When the live camera is unavailable (denied,
// no device, insecure context, or an in-app browser that blocks getUserMedia),
// the capture sheet falls back to a native <input type="file" capture> — this
// composable just reports the failure reason via `error`.

import { onBeforeUnmount, ref } from 'vue'

export type CameraError = 'denied' | 'notfound' | 'unsupported' | 'unknown'

/** A normalized crop rect (each value 0–1 of the frame), origin top-left. */
export interface CropRect {
  x: number
  y: number
  w: number
  h: number
}

function classify(err: unknown): CameraError {
  const name = err instanceof DOMException ? err.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied'
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'notfound'
  return 'unknown'
}

export function useCamera() {
  const stream = ref<MediaStream | null>(null)
  const active = ref(false)
  const error = ref<CameraError | null>(null)

  /** Start the rear camera and pipe it into the given <video>. */
  async function start(video: HTMLVideoElement): Promise<boolean> {
    error.value = null
    if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
      error.value = 'unsupported'
      return false
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      stream.value = s
      video.srcObject = s
      // Required for inline autoplay on iOS Safari.
      video.muted = true
      video.playsInline = true
      await video.play().catch(() => {})
      active.value = true
      return true
    } catch (err) {
      error.value = classify(err)
      return false
    }
  }

  function stop() {
    stream.value?.getTracks().forEach((t) => t.stop())
    stream.value = null
    active.value = false
  }

  /**
   * Grab the current frame to a canvas. With a `crop` (the on-screen reticle
   * region) only that part is captured and upscaled, which sharpens OCR.
   */
  function captureCanvas(video: HTMLVideoElement, crop?: CropRect): HTMLCanvasElement {
    const vw = video.videoWidth || video.clientWidth
    const vh = video.videoHeight || video.clientHeight
    const sx = crop ? crop.x * vw : 0
    const sy = crop ? crop.y * vh : 0
    const sw = crop ? crop.w * vw : vw
    const sh = crop ? crop.h * vh : vh

    // Upscale narrow crops so small digits give the recognition model more to work with.
    const scale = Math.min(3, Math.max(1, 900 / sw))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(sw * scale)
    canvas.height = Math.round(sh * scale)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
    return canvas
  }

  onBeforeUnmount(stop)

  return { stream, active, error, start, stop, captureCanvas }
}
