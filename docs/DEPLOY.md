# Deployment

Three pieces, **both auto-deployed from `main` via GitHub Actions**: **frontend**
on GitHub Pages, **backend** on Fly.io (`sotogo-api`), and **PostgreSQL**
(hosted at ssps.cajthaml.eu).

```
Browser ──https──▶ GitHub Pages (Vue SPA)
                      │ https/JSON
                      ▼
                 Fly.io (sotogo-api, Express/Docker)  ──▶  PostgreSQL (school server)
                      │
                      ▼
                 Tigris S3 (catch photos) · Anthropic API (recognition)
```

> Both must be **HTTPS**. GitHub Pages is HTTPS, so the backend must be too, or
> the browser blocks the requests as mixed content. Fly gives you a free HTTPS
> subdomain (`https://sotogo-api.fly.dev`).

---

## 1. Frontend → GitHub Pages (automatic)

The workflow [`.github/workflows/deploy-frontend.yml`](../.github/workflows/deploy-frontend.yml)
builds the app and pushes it to the `gh-pages` branch on every push to `main`
(only when `frontend/**` changes, plus a manual "Run workflow" button).

**One-time setup:**

1. **Set build variables** — repo **Settings → Secrets and variables → Actions → Variables** (the *Variables* tab, not Secrets):
   - `VITE_GOOGLE_CLIENT_ID` = your Google OAuth client id
   - `VITE_API_URL` = your backend URL + `/api` (set this after step 2 — e.g. `https://sotogo-api.fly.dev/api`)
2. **Push to main** (or run the workflow manually). It creates the `gh-pages` branch.
3. **Enable Pages** — **Settings → Pages → Build and deployment → Source: "Deploy from a branch"**, branch **`gh-pages`**, folder **`/ (root)`**. Save.
4. Site goes live at **https://tokancz.github.io/SotoGO/**

The build sets `VITE_BASE=/SotoGO/` so assets resolve under the repo subpath, and
copies `index.html` → `404.html` so deep links / refreshes work (SPA fallback).

---

## 2. Backend → Fly.io (automatic)

The workflow [`.github/workflows/deploy-backend.yml`](../.github/workflows/deploy-backend.yml)
runs `flyctl deploy --remote-only` on every push to `main` that touches
`backend/**`. The app config is [`backend/fly.toml`](../backend/fly.toml)
(`sotogo-api`, region `fra`, auto-stop when idle).

**One-time setup:**

1. **Install flyctl** and `fly auth login`, then from `backend/`:
   `fly launch --no-deploy` (or `fly apps create sotogo-api`).
2. **Set the CI secret** — repo **Settings → Secrets and variables → Actions → Secrets**:
   `FLY_API_TOKEN` (from `fly tokens create deploy`).
3. **Provision photo storage** (optional but recommended): `fly storage create`
   sets `BUCKET_NAME`, `AWS_ENDPOINT_URL_S3`, and credentials as secrets (Tigris).
4. **Set app secrets** with `fly secrets set KEY=value` (from `backend/.env.example`):
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | your Postgres connection string |
   | `DB_SCHEMA` | `SotoGO` |
   | `JWT_SECRET` | your long random secret |
   | `GOOGLE_CLIENT_ID` | your Google client id |
   | `ANTHROPIC_API_KEY` | for photo recognition (`/api/recognize`) |
   | `RECOGNIZE_MODEL` | optional, default `claude-haiku-4-5` |
   | `GITHUB_TOKEN` | your fine-grained PAT (bug reporter) |
   | `GITHUB_REPO` | `Tokancz/SotoGO` |
   | `CLIENT_ORIGIN` | `https://tokancz.github.io` |
   | `ADMIN_EMAILS` | optional, comma-separated admin emails |
   *(Don't set `PORT` — `fly.toml` uses `internal_port = 3000`, which the app reads.)*
5. **Push to main** (or `fly deploy` once manually). You get
   `https://sotogo-api.fly.dev`.

> `min_machines_running = 0` means the machine **auto-stops when idle** and
> cold-starts on the next request (a second or two). Fine for a hobby project.
> The full env var reference is in [BACKEND.md](BACKEND.md).

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
