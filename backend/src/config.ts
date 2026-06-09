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
  // Catch-photo uploads. Local disk for dev; point UPLOAD_DIR at a mounted
  // volume (or swap for S3) in production. Files are served at /uploads.
  uploadDir: resolve(process.env.UPLOAD_DIR ?? './uploads'),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES ?? 6 * 1024 * 1024),
  // How often daily quests roll over, in hours. Periods are aligned to the Unix
  // epoch (UTC), so 24 = a fresh set at 00:00 UTC; set 6 for four sets a day.
  questPeriodHours: Number(process.env.QUEST_PERIOD_HOURS ?? 24),
}
