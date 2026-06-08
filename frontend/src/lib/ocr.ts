// ŠotoGO — Client-side OCR for reading a vehicle's evidenční číslo.
//
// Runs Tesseract.js in the browser on a captured camera frame (see
// docs/ARCHITECTURE.md → OCR pipeline, v1). The Tesseract worker is heavy to
// spin up and downloads its language data, so we keep a single lazily-created
// worker alive for the session and reuse it across scans.

import { createWorker, type Worker } from 'tesseract.js'

let workerPromise: Promise<Worker> | null = null

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker('eng')
      // Evidenční čísla are digits only — whitelisting them sharply cuts noise.
      await worker.setParameters({ tessedit_char_whitelist: '0123456789' })
      return worker
    })()
  }
  return workerPromise
}

/** Pick the most plausible evidenční číslo out of raw OCR text. */
export function extractFleetNumber(text: string): string | null {
  const runs = text.match(/\d{3,6}/g)
  if (!runs || runs.length === 0) return null
  // Prefer a 4-digit number (Prague trams/buses), then the longest run.
  const fourDigit = runs.find((r) => r.length === 4)
  if (fourDigit) return fourDigit
  return runs.sort((a, b) => b.length - a.length)[0]
}

export interface OcrResult {
  /** Recognized evidenční číslo, or null if none found. */
  number: string | null
  /** Tesseract mean confidence for the page, 0–100. */
  confidence: number
}

/** Recognize the evidenční číslo from a captured frame (canvas or image). */
export async function recognizeFleetNumber(
  image: HTMLCanvasElement | HTMLImageElement | Blob,
): Promise<OcrResult> {
  const worker = await getWorker()
  const { data } = await worker.recognize(image)
  return { number: extractFleetNumber(data.text), confidence: data.confidence }
}

/** Release the OCR worker (e.g. when the capture sheet closes for good). */
export async function terminateOcr(): Promise<void> {
  if (!workerPromise) return
  const worker = await workerPromise
  workerPromise = null
  await worker.terminate()
}
