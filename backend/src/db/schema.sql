-- ŠotoGO schema.
-- Mirrors docs/DATA-MODEL.md, with auth + the "Pokédex" catalog slice.
-- Game progress tables (user_vehicles, user_stops, challenges, …) come later.

-- ── Users ──────────────────────────────────────────────────────────────────
-- password_hash is NULL for Google-only accounts; google_id links a Google
-- account (NULL for email/password); avatar_url holds the Google picture.
CREATE TABLE IF NOT EXISTS users (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username      TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  google_id     TEXT UNIQUE,
  avatar_url    TEXT,
  level         INT NOT NULL DEFAULT 1,
  xp            INT NOT NULL DEFAULT 0,
  -- Daily login streak: consecutive days the player has checked in. `last_active`
  -- is the player's LOCAL date (sent by the client) of their most recent check-in.
  streak_count    INT NOT NULL DEFAULT 0,
  last_active_date DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Backfill the streak columns on databases created before streaks existed.
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_count INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_date DATE;

-- ── Vehicle catalog ──────────────────────────────────────────────────────────
-- The collectible "Pokédex": one row per vehicle MODEL (type), not per physical
-- vehicle. Seeded from src/data/vehicleTypes.ts (npm run seed:vehicles).
CREATE TABLE IF NOT EXISTS vehicle_types (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category     TEXT NOT NULL,              -- tram | bus | metro | trolley | train
  model        TEXT NOT NULL,             -- full model name, e.g. "Škoda 15T ForCity Alfa"
  short_name   TEXT NOT NULL,             -- short label, e.g. "15T"
  manufacturer TEXT NOT NULL,
  operator     TEXT NOT NULL,             -- DPP | Metro Praha | ČD | PID
  rarity       TEXT NOT NULL,             -- common | rare | epic | legendary
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category, short_name)
);

-- ── Stops (and gyms) ─────────────────────────────────────────────────────────
-- One row per station node (platforms grouped). Imported from PID GTFS
-- (npm run import:stops). `lines` and `categories` are the routes serving the
-- station; `is_gym` marks metro stations and major interchanges.
CREATE TABLE IF NOT EXISTS stops (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  gtfs_node_id TEXT NOT NULL UNIQUE,      -- PID node id, e.g. "U306"
  name         TEXT NOT NULL,
  latitude     DOUBLE PRECISION NOT NULL,
  longitude    DOUBLE PRECISION NOT NULL,
  lines        TEXT[] NOT NULL DEFAULT '{}',   -- route short names, e.g. {A,C,5,9}
  categories   TEXT[] NOT NULL DEFAULT '{}',   -- {metro,tram,bus,...}
  is_gym       BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- route_ids: the GTFS routes serving this station (for drawing tracks on tap).
ALTER TABLE stops ADD COLUMN IF NOT EXISTS route_ids TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS stops_latlng_idx ON stops (latitude, longitude);
CREATE INDEX IF NOT EXISTS stops_gym_idx ON stops (is_gym);
CREATE INDEX IF NOT EXISTS stops_name_idx ON stops (lower(name));

-- ── Route geometries ─────────────────────────────────────────────────────────
-- One representative shape (polyline) per route, for drawing colored tracks when
-- a stop is tapped. Imported from PID GTFS shapes (npm run import:routes).
-- points is a JSON array of [lat, lng] pairs.
CREATE TABLE IF NOT EXISTS route_geometries (
  route_id  TEXT PRIMARY KEY,
  line      TEXT NOT NULL,
  category  TEXT NOT NULL,            -- tram | bus | metro | trolley | train
  points    JSONB NOT NULL
);

-- ── Player progress ──────────────────────────────────────────────────────────
-- Which catalog models a player has collected, and which stops they've visited.
-- The composite PKs make catches/visits idempotent (collect/visit once).
CREATE TABLE IF NOT EXISTS user_vehicles (
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type_id BIGINT NOT NULL REFERENCES vehicle_types(id) ON DELETE CASCADE,
  found_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- The player's own photo of the catch (served from /uploads). NULL if none.
  image_url       TEXT,
  PRIMARY KEY (user_id, vehicle_type_id)
);
-- Backfill the column on databases created before photos existed.
ALTER TABLE user_vehicles ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE TABLE IF NOT EXISTS user_stops (
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stop_id    BIGINT NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, stop_id)
);

-- ── Daily quests ─────────────────────────────────────────────────────────────
-- Quests themselves aren't stored: each player's set is derived deterministically
-- per period from (user_id, period) in src/lib/quests.ts, and progress is counted
-- live from user_vehicles/user_stops. This table only records that a completed
-- quest's XP reward was already collected, so it can't be claimed twice. `period`
-- is the integer period index (floor(epoch_ms / period_ms)).
CREATE TABLE IF NOT EXISTS user_quest_claims (
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period     BIGINT NOT NULL,
  quest_id   TEXT NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, period, quest_id)
);
