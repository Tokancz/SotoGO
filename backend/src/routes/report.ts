// In-app bug reporter → creates a GitHub issue via the API using a server-side
// token (a token must never live in the frontend). Requires auth, so only
// signed-in players can file reports.
import { Router } from 'express'
import { config } from '../config.js'
import { pool } from '../db/pool.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { asyncHandler } from '../util/asyncHandler.js'

export const reportRouter = Router()

reportRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!config.githubToken || !config.githubRepo) {
      return res.status(503).json({ error: 'Hlášení chyb zatím není nastavené.' })
    }

    const description = String(req.body?.description ?? '').trim()
    const title = String(req.body?.title ?? '').trim() || 'Hlášení chyby z aplikace'
    if (!description) {
      return res.status(400).json({ error: 'Popiš prosím, co se stalo.' })
    }

    const { rows } = await pool.query<{ username: string; email: string }>(
      'select username, email from users where id = $1',
      [req.userId],
    )
    const reporter = rows[0]
    const body = [
      description,
      '',
      '---',
      `- Nahlásil: ${reporter?.username ?? '?'} (${reporter?.email ?? '?'})`,
      `- User-Agent: ${req.headers['user-agent'] ?? '?'}`,
      `- Čas: ${new Date().toISOString()}`,
    ].join('\n')

    const ghRes = await fetch(`https://api.github.com/repos/${config.githubRepo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.githubToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'SotoGO-app',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, body, labels: ['bug', 'from-app'] }),
    })

    if (!ghRes.ok) {
      console.error('GitHub issue creation failed:', ghRes.status, await ghRes.text())
      return res.status(502).json({ error: 'Vytvoření hlášení selhalo, zkus to později.' })
    }

    const issue = (await ghRes.json()) as { html_url: string; number: number }
    res.status(201).json({ url: issue.html_url, number: issue.number })
  }),
)
