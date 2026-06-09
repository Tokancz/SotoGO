// Catch-photo storage. Uploads go to S3-compatible object storage (Fly Tigris)
// when it's configured — durable across restarts/redeploys and served straight
// from the bucket. Without S3 config we fall back to local disk served at
// /uploads, which is fine for dev (see docs/ARCHITECTURE.md "Ukládání obrázků").
import { mkdir, writeFile, unlink } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { config } from '../config.js'

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

export function isAllowedImage(mime: string): boolean {
  return mime in EXT_BY_MIME
}

// S3 is active only when both a bucket and an endpoint are configured.
const s3Enabled = Boolean(config.s3.bucket && config.s3.endpoint)
const s3 = s3Enabled
  ? new S3Client({
      endpoint: config.s3.endpoint,
      region: config.s3.region,
      forcePathStyle: true, // Tigris/MinIO-style path addressing
    })
  : null
// Where the public-readable objects are served from.
const publicBase = config.s3.publicUrl || `${config.s3.endpoint}/${config.s3.bucket}`

/**
 * Persist an image buffer; returns its public URL (absolute for S3, "/uploads/…"
 * local). `prefix` groups objects in the bucket (e.g. "catches", "avatars").
 */
export async function saveImage(buffer: Buffer, mime: string, prefix = 'catches'): Promise<string> {
  const ext = EXT_BY_MIME[mime] ?? '.jpg'
  const name = `${randomUUID()}${ext}`

  if (s3) {
    const key = `${prefix}/${name}`
    await s3.send(
      new PutObjectCommand({
        Bucket: config.s3.bucket,
        Key: key,
        Body: buffer,
        ContentType: mime,
        ACL: 'public-read',
        // Keys are unique per upload, so the object can be cached forever.
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    )
    return `${publicBase}/${key}`
  }

  await mkdir(config.uploadDir, { recursive: true })
  await writeFile(join(config.uploadDir, name), buffer)
  return `/uploads/${name}`
}

/** Best-effort delete of a previously stored upload (S3 object or local file). */
export async function deleteImage(publicPath: string | null): Promise<void> {
  if (!publicPath) return

  if (s3 && publicPath.startsWith(`${publicBase}/`)) {
    const key = publicPath.slice(publicBase.length + 1)
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: config.s3.bucket, Key: key }))
    } catch {
      // Already gone or never written — nothing to clean up.
    }
    return
  }

  if (publicPath.startsWith('/uploads/')) {
    try {
      await unlink(join(config.uploadDir, basename(publicPath)))
    } catch {
      // Already gone or never written — nothing to clean up.
    }
  }
}
