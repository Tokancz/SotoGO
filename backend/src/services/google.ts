// Verifies a Google ID token (the `credential` returned by Google Identity
// Services on the frontend) and extracts the user's profile. The token is
// cryptographically validated against Google's public keys, and its audience
// must match our own client ID — so a token minted for another app is rejected.
import { OAuth2Client } from 'google-auth-library'
import { config } from '../config.js'

const client = new OAuth2Client(config.googleClientId)

export interface GoogleProfile {
  googleId: string
  email: string
  name?: string
  picture?: string
  emailVerified: boolean
}

export function googleConfigured(): boolean {
  return Boolean(config.googleClientId)
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: config.googleClientId,
  })
  const payload = ticket.getPayload()
  if (!payload?.sub || !payload.email) {
    throw new Error('Google token missing required fields')
  }
  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    emailVerified: Boolean(payload.email_verified),
  }
}
