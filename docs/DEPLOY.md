# Deployment

Three pieces: **frontend** on GitHub Pages (auto-deployed), **backend** on a
container host, and **PostgreSQL** (already hosted at ssps.cajthaml.eu).

```
Browser ──https──▶ GitHub Pages (Vue SPA)
                      │ https/JSON
                      ▼
                 Backend host (Express, Docker)  ──▶  PostgreSQL (school server)
```

> Both must be **HTTPS**. GitHub Pages is HTTPS, so the backend must be too, or
> the browser blocks the requests as mixed content. Render/Fly/Koyeb all give you
> a free HTTPS subdomain.

---

## 1. Frontend → GitHub Pages (automatic)

The workflow [`.github/workflows/deploy-frontend.yml`](../.github/workflows/deploy-frontend.yml)
builds the app and pushes it to the `gh-pages` branch on every push to `main`
(only when `frontend/**` changes, plus a manual "Run workflow" button).

**One-time setup:**

1. **Set build variables** — repo **Settings → Secrets and variables → Actions → Variables** (the *Variables* tab, not Secrets):
   - `VITE_GOOGLE_CLIENT_ID` = your Google OAuth client id
   - `VITE_API_URL` = your backend URL + `/api` (set this after step 2 — e.g. `https://sotogo-api.onrender.com/api`)
2. **Push to main** (or run the workflow manually). It creates the `gh-pages` branch.
3. **Enable Pages** — **Settings → Pages → Build and deployment → Source: "Deploy from a branch"**, branch **`gh-pages`**, folder **`/ (root)`**. Save.
4. Site goes live at **https://tokancz.github.io/SotoGO/**

The build sets `VITE_BASE=/SotoGO/` so assets resolve under the repo subpath, and
copies `index.html` → `404.html` so deep links / refreshes work (SPA fallback).

---

## 2. Backend → container host

You already have PostgreSQL, so you only host the Node API. The
[`backend/Dockerfile`](../backend/Dockerfile) works on any container host.

### Option A — Render (recommended, free, no card)

1. https://render.com → **New → Web Service** → connect the GitHub repo.
2. **Root Directory:** `backend`. Render detects the Dockerfile (Runtime: Docker).
   *(Or pick Node runtime: Build `npm ci && npm run build`, Start `node dist/index.js`.)*
3. **Instance type:** Free.
4. **Environment variables** (from `backend/.env.example`):
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | your Postgres connection string |
   | `DB_SCHEMA` | `SotoGO` |
   | `JWT_SECRET` | your long random secret |
   | `GOOGLE_CLIENT_ID` | your Google client id |
   | `GITHUB_TOKEN` | your fine-grained PAT (bug reporter) |
   | `GITHUB_REPO` | `Tokancz/SotoGO` |
   | `CLIENT_ORIGIN` | `https://tokancz.github.io` |
   *(Don't set `PORT` — Render injects it; the app reads it automatically.)*
5. **Create Web Service.** You get a URL like `https://sotogo-api.onrender.com`.

> Free Render instances **sleep after ~15 min idle**, so the first request after a
> nap takes ~30 s to wake. Fine for a hobby project.

### Option B — Fly.io / Koyeb

Both deploy the same Dockerfile. Koyeb has a no-card free instance; Fly needs a
card but won't sleep. Point the platform at `backend/` and set the same env vars.

---

## 3. Connect the two

1. Set repo Variable **`VITE_API_URL`** = `https://<your-backend-host>/api`.
2. Re-run the frontend workflow (push, or **Actions → Deploy frontend → Run workflow**).
3. **Google OAuth:** in Google Cloud Console → Credentials → your Web client →
   **Authorized JavaScript origins**, add `https://tokancz.github.io`.

That's it. Visit https://tokancz.github.io/SotoGO/ and sign in.

---

## Notes

- **Database:** already migrated and seeded (you ran `migrate` / `import:*` locally
  against the remote DB). The deployed server only reads/writes it — no migration
  step at deploy time. If you change the schema later, run `npm run migrate` locally
  again (it targets the same remote DB).
- **Secrets:** never commit `.env`. The Google client id is public (it ships in the
  frontend); the GitHub token and JWT secret are not — keep them only in the host's
  env settings.
- **CORS:** `CLIENT_ORIGIN` must include the Pages origin exactly (`https://tokancz.github.io`,
  no trailing slash). Add `,http://localhost:5173` if you want local dev to hit the
  deployed API too.
