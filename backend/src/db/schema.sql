-- ŠotoGO schema (auth slice).
-- Mirrors docs/DATA-MODEL.md `users`, extended for authentication:
--   * password_hash is NULL for accounts created via Google
--   * google_id links a Google account (NULL for email/password accounts)
--   * avatar_url stores the Google profile picture when available
-- Game tables (vehicles, stops, challenges, …) come in a later slice.

CREATE TABLE IF NOT EXISTS users (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username      TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  google_id     TEXT UNIQUE,
  avatar_url    TEXT,
  level         INT NOT NULL DEFAULT 1,
  xp            INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
