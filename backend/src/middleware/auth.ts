// JWT guard for protected routes. Reads `Authorization: Bearer <token>`,
// verifies it, and stashes the user id on the request.
import type { NextFunction, Request, Response } from 'express'
import { verifyToken } from '../services/jwt.js'

export interface AuthedRequest extends Request {
  userId?: string
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Pro tuto akci se musíš přihlásit.' })
    return
  }
  try {
    const payload = verifyToken(header.slice('Bearer '.length))
    req.userId = payload.sub
    next()
  } catch {
    res.status(401).json({ error: 'Platnost přihlášení vypršela, přihlas se znovu.' })
  }
}
