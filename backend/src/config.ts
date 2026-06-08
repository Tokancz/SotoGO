// Loads and validates environment configuration. Throws early if something
// required is missing, so the server never boots in a half-configured state.
import 'dotenv/config'

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
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  databaseUrl: required('DATABASE_URL'),
  dbSchema: process.env.DB_SCHEMA ?? 'public',
  jwtSecret: required('JWT_SECRET'),
  // Optional: when empty, the /api/auth/google route reports that Google
  // sign-in isn't configured instead of crashing.
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
}
