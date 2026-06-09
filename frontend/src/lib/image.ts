// ŠotoGO — Client-side image downscaling for catch photos.
//
// Phone cameras and gallery files are multi-megapixel; uploaded as-is they cost
// megabytes of storage and bandwidth per catch, and the Park grid only ever
// renders them a few hundred pixels wide. We cap the longest edge and re-encode
// to JPEG before upload. OCR still reads the full-resolution frame, so shrinking
// the saved photo doesn't affect recognition.

export interface DownscaleOptions {
  /** Cap for the longest edge, in pixels. */
  maxDim?: number
  /** JPEG quality, 0–1. */
  quality?: number
}

const DEFAULTS = { maxDim: 1280, quality: 0.8 } satisfies Required<DownscaleOptions>

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', quality))
}

/** Render a source onto a new canvas scaled so its longest edge ≤ maxDim. */
function scaleToCanvas(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  maxDim: number,
): HTMLCanvasElement {
  const scale = Math.min(1, maxDim / Math.max(srcW, srcH))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(srcW * scale)
  canvas.height = Math.round(srcH * scale)
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas
}

/** Downscale an already-captured canvas to a JPEG blob. */
export async function downscaleCanvas(
  canvas: HTMLCanvasElement,
  opts: DownscaleOptions = {},
): Promise<Blob | null> {
  const { maxDim, quality } = { ...DEFAULTS, ...opts }
  if (Math.max(canvas.width, canvas.height) <= maxDim) {
    return canvasToJpeg(canvas, quality)
  }
  return canvasToJpeg(scaleToCanvas(canvas, canvas.width, canvas.height, maxDim), quality)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Downscale a picked image file to a JPEG blob. Returns the original untouched
 * when it's already within bounds or if decoding fails — we'd rather upload the
 * original than lose the catch photo.
 */
export async function downscaleImageFile(file: Blob, opts: DownscaleOptions = {}): Promise<Blob> {
  const { maxDim, quality } = { ...DEFAULTS, ...opts }
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    if (Math.max(img.naturalWidth, img.naturalHeight) <= maxDim) return file
    const blob = await canvasToJpeg(
      scaleToCanvas(img, img.naturalWidth, img.naturalHeight, maxDim),
      quality,
    )
    return blob ?? file
  } catch {
    return file
  } finally {
    URL.revokeObjectURL(url)
  }
}
