# ŠotoGO — Backend

Express + PostgreSQL REST API. Current slice: **authentication** (email/password
+ Google sign-in + JWT). Game endpoints come later (see [../docs/BACKEND.md](../docs/BACKEND.md)).

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET  | `/api/health`        | – | Liveness check |
| POST | `/api/auth/register` | – | Create account → `{ token, user }` |
| POST | `/api/auth/login`    | – | Email/password login → `{ token, user }` |
| POST | `/api/auth/google`   | – | Verify Google ID token → `{ token, user }` |
| GET  | `/api/auth/me`       | JWT | Current player |

---

## 1. Prerequisites

- **Node.js 18+**
- **PostgreSQL** running locally (or anywhere you have a connection string)

## 2. Create the database

With `psql` (or any Postgres GUI), create an empty database:

```sql
CREATE DATABASE sotogo;
```

## 3. Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

- `DATABASE_URL` — your Postgres connection string, e.g.
  `postgres://postgres:YOURPASSWORD@localhost:5432/sotogo`
- `JWT_SECRET` — any long random string. Generate one:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```
- `GOOGLE_CLIENT_ID` — leave blank for now; fill it in after step 6.

## 4. Install + create tables

```bash
npm install
npm run migrate    # creates the `users` table
```

## 5. Run

```bash
npm run dev        # http://localhost:3000  (auto-reloads)
```

Check it: open <http://localhost:3000/api/health> → `{"ok":true}`.

Email/password registration and login work now. Google sign-in needs steps 6–7.

---

## 6. Google sign-in — get a Client ID (first time, step by step)

You only need a **Client ID** (no client secret) for this setup.

1. Go to <https://console.cloud.google.com/> and sign in.
2. **Create a project**: top bar → project dropdown → **New Project** → name it
   `SotoGO` → **Create**. Make sure it's selected afterwards.
3. **Configure the consent screen** (Google requires this before issuing a client):
   - Left menu → **APIs & Services → OAuth consent screen**.
   - User type: **External** → **Create**.
   - App name: `ŠotoGO`. User support email: your email. Developer contact email:
     your email. Leave the rest default → **Save and Continue**.
   - **Scopes**: skip → **Save and Continue**.
   - **Test users**: click **Add users**, add *your own Google email* (while the
     app is in "Testing" mode only listed users can sign in) → **Save and Continue**.
4. **Create the credential**:
   - Left menu → **APIs & Services → Credentials**.
   - **+ Create Credentials → OAuth client ID**.
   - Application type: **Web application**. Name: `SotoGO Web`.
   - **Authorized JavaScript origins** → **Add URI**, add exactly:
     - `http://localhost:5173`
     - (add your production URL later, e.g. `https://sotogo.example.com`)
   - You can leave **Authorized redirect URIs** empty — this flow doesn't use them.
   - **Create**.
5. A dialog shows your **Client ID** (looks like
   `1234567890-abc123.apps.googleusercontent.com`). Copy it.

## 7. Plug the Client ID in

Same value goes in **both** places:

- `backend/.env` → `GOOGLE_CLIENT_ID=...`
- `frontend/.env.local` → `VITE_GOOGLE_CLIENT_ID=...`
  (create it: `cd frontend && cp .env.example .env.local`)

Restart both dev servers. The "Sign in with Google" button now appears on the
login screen and works.

> **Common gotchas**
> - "origin is not allowed" / button doesn't render → the URL in *Authorized
>   JavaScript origins* must match exactly, including `http` vs `https` and port.
>   Vite's default is `http://localhost:5173`.
> - "access_denied" → add your email under **Test users** (step 3), or publish the
>   app on the consent screen.
> - Changes in Google Cloud can take a minute to propagate.
