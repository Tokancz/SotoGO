// Signs and verifies the app's own JWTs (separate from Google's tokens).
import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export interface JwtPayload {
  sub: string // user id
  email: string
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '30d' })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload
}
