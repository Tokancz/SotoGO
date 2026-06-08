// Catch-photo storage. Writes uploaded images to the configured upload dir and
// returns the public path they're served at (/uploads/...). Local disk for dev;
// swap the body of saveImage for an S3 put in production (docs/ARCHITECTURE.md
// "Ukládání obrázků").
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { config } from '../config.js'

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

export function isAllowedImage(mime: string): boolean {
  return mime in EXT_BY_MIME
}

/** Persist an image buffer; returns its public path, e.g. "/uploads/<id>.jpg". */
export async function saveImage(buffer: Buffer, mime: string): Promise<string> {
  const name = `${randomUUID()}${EXT_BY_MIME[mime] ?? '.jpg'}`
  await mkdir(config.uploadDir, { recursive: true })
  await writeFile(join(config.uploadDir, name), buffer)
  return `/uploads/${name}`
}
