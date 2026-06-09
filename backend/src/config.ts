// Loads and validates environment configuration. Throws early if something
// required is missing, so the server never boots in a half-configured state.
import 'dotenv/config'
import { resolve } from 'node:path'

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Copy backend/.env.example to backend/.env and fill it in.`,
    )
  }
  return value
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  // Allowed CORS origins — comma-separated (e.g. the GitHub Pages site + localhost).
  clientOrigins: (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  databaseUrl: required('DATABASE_URL'),
  dbSchema: process.env.DB_SCHEMA ?? 'public',
  jwtSecret: required('JWT_SECRET'),
  // Optional: when empty, the /api/auth/google route reports that Google
  // sign-in isn't configured instead of crashing.
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  // Optional: GitHub token + repo ("owner/name") for the in-app bug reporter.
  githubToken: process.env.GITHUB_TOKEN ?? '',
  githubRepo: process.env.GITHUB_REPO ?? '',
  // Optional: Anthropic API key for photo-based vehicle recognition (the capture
  // flow's /api/recognize). Empty → the endpoint reports it's unconfigured and
  // the client falls back to the manual model picker.
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
  recognizeModel: process.env.RECOGNIZE_MODEL ?? 'claude-haiku-4-5',
  // Catch-photo uploads. When S3 (below) is configured, photos go to the bucket
  // and survive restarts/redeploys; otherwise they're written to this local dir
  // and served at /uploads (fine for dev, ephemeral on most hosts).
  uploadDir: resolve(process.env.UPLOAD_DIR ?? './uploads'),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES ?? 6 * 1024 * 1024),
  // S3-compatible object storage (e.g. Fly Tigris). Active when BUCKET_NAME and
  // AWS_ENDPOINT_URL_S3 are set; `fly storage create` provisions all of these as
  // secrets. Credentials are read from AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
  // by the SDK. publicUrl overrides the default path-style base (endpoint/bucket).
  s3: {
    bucket: process.env.BUCKET_NAME ?? '',
    endpoint: process.env.AWS_ENDPOINT_URL_S3 ?? '',
    region: process.env.AWS_REGION ?? 'auto',
    publicUrl: (process.env.S3_PUBLIC_URL ?? '').replace(/\/+$/, ''),
  },
  // How often daily quests roll over, in hours. Periods are aligned to the Unix
  // epoch (UTC), so 24 = a fresh set at 00:00 UTC; set 6 for four sets a day.
  questPeriodHours: Number(process.env.QUEST_PERIOD_HOURS ?? 24),
  // Comma-separated emails granted admin (unlocks dev tools like the map teleport).
  // Matched case-insensitively against the account email.
  adminEmails: (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
}
