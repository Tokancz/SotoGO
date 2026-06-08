// Authentication routes: email/password register + login, Google sign-in, and
// the "who am I" endpoint. XP/leveling and the rest of the game model are added
// in a later slice — this is the auth foundation everything else hangs off.
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../db/pool.js'
import { signToken } from '../services/jwt.js'
import { googleConfigured, verifyGoogleIdToken } from '../services/google.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { asyncHandler } from '../util/asyncHandler.js'
import { publicUser, type UserRow } from '../lib/user.js'

export const authRouter = Router()

function sessionFor(user: UserRow) {
  return { token: signToken({ sub: String(user.id), email: user.email }), user: publicUser(user) }
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// POST /api/auth/register — create an email/password account.
authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const username = String(req.body?.username ?? '').trim()
    const email = String(req.body?.email ?? '').trim().toLowerCase()
    const password = String(req.body?.password ?? '')

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Vyplň přezdívku, e-mail i heslo.' })
    }
    if (!emailRe.test(email)) {
      return res.status(400).json({ error: 'Zadej platný e-mail.' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Heslo musí mít aspoň 6 znaků.' })
    }

    const existing = await pool.query('select 1 from users where email = $1', [email])
    if (existing.rowCount) {
      return res.status(409).json({ error: 'Účet s tímto e-mailem už existuje.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const { rows } = await pool.query<UserRow>(
      'insert into users (username, email, password_hash) values ($1, $2, $3) returning *',
      [username, email, passwordHash],
    )
    return res.status(201).json(sessionFor(rows[0]))
  }),
)

// POST /api/auth/login — email/password sign-in.
authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const email = String(req.body?.email ?? '').trim().toLowerCase()
    const password = String(req.body?.password ?? '')

    if (!email || !password) {
      return res.status(400).json({ error: 'Zadej e-mail a heslo.' })
    }

    const { rows } = await pool.query<UserRow>('select * from users where email = $1', [email])
    const user = rows[0]
    // Same message whether the email is unknown or the password is wrong, and
    // whether the account is Google-only (no password_hash) — don't leak which.
    if (!user?.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Nesprávný e-mail nebo heslo.' })
    }
    return res.json(sessionFor(user))
  }),
)

// POST /api/auth/google — verify a Google ID token, then find-or-create the user.
authRouter.post(
  '/google',
  asyncHandler(async (req, res) => {
    if (!googleConfigured()) {
      return res.status(503).json({ error: 'Přihlášení přes Google zatím není nastavené.' })
    }
    const credential = String(req.body?.credential ?? '')
    if (!credential) {
      return res.status(400).json({ error: 'Chybí Google token.' })
    }

    let profile
    try {
      profile = await verifyGoogleIdToken(credential)
    } catch {
      return res.status(401).json({ error: 'Ověření přes Google selhalo.' })
    }

    // Match an existing account by Google id, or by email (links Google to an
    // account that originally registered with email/password).
    const { rows } = await pool.query<UserRow>(
      'select * from users where google_id = $1 or email = $2',
      [profile.googleId, profile.email],
    )
    let user = rows[0]

    if (!user) {
      const username = profile.name || profile.email.split('@')[0]
      const insert = await pool.query<UserRow>(
        'insert into users (username, email, google_id, avatar_url) values ($1, $2, $3, $4) returning *',
        [username, profile.email, profile.googleId, profile.picture ?? null],
      )
      user = insert.rows[0]
    } else if (!user.google_id) {
      const update = await pool.query<UserRow>(
        'update users set google_id = $1, avatar_url = coalesce(avatar_url, $2) where id = $3 returning *',
        [profile.googleId, profile.picture ?? null, user.id],
      )
      user = update.rows[0]
    }

    return res.json(sessionFor(user))
  }),
)

// GET /api/auth/me — current player from a valid token.
authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const { rows } = await pool.query<UserRow>('select * from users where id = $1', [req.userId])
    if (!rows[0]) {
      return res.status(404).json({ error: 'Uživatel nenalezen.' })
    }
    return res.json({ user: publicUser(rows[0]) })
  }),
)
