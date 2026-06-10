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

-- Gym competition counters (see "Gyms" below). `battles_won` counts gyms taken;
-- `gym_seconds` is FINALIZED defending time (a holding stint's seconds are added
-- when it ends — recall or defeat). Currently-held time is added live at query.
ALTER TABLE users ADD COLUMN IF NOT EXISTS battles_won INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gym_seconds BIGINT NOT NULL DEFAULT 0;

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
-- Which vehicles a player has caught, and which stops they've visited.
-- A catch is now PER PHYSICAL VEHICLE (one row per caught serial / evidenční
-- číslo), so a player can own several vehicles of the same model. The surrogate
-- `id` is the instance handle used by deploy/delete/battle. Older databases were
-- keyed by (user_id, vehicle_type_id) — the migration block below upgrades them.
CREATE TABLE IF NOT EXISTS user_vehicles (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type_id BIGINT NOT NULL REFERENCES vehicle_types(id) ON DELETE CASCADE,
  -- The painted registration number identifying the physical vehicle. NULL when
  -- it wasn't legible (or for legacy rows caught before serials were tracked).
  fleet_number    TEXT,
  found_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- The player's own photo of the catch (served from /uploads). NULL if none.
  image_url       TEXT
);
-- Backfill the column on databases created before photos existed.
ALTER TABLE user_vehicles ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE user_vehicles ADD COLUMN IF NOT EXISTS fleet_number TEXT;

-- Upgrade pre-instance databases: the table used to be keyed by
-- (user_id, vehicle_type_id) with no surrogate id. Add `id` as a fresh identity
-- PK and drop the old composite PK. Guarded so it only runs once and only on the
-- legacy shape (CREATE TABLE above already produces the new shape on fresh DBs).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'user_vehicles' AND column_name = 'id'
  ) THEN
    ALTER TABLE user_vehicles DROP CONSTRAINT IF EXISTS user_vehicles_pkey;
    ALTER TABLE user_vehicles ADD COLUMN id BIGINT GENERATED ALWAYS AS IDENTITY;
    ALTER TABLE user_vehicles ADD PRIMARY KEY (id);
  END IF;
END $$;

-- One row per (player, model, serial): catching the SAME serial again is a
-- re-roll choice, not a second row. NULL serials are exempt (each unreadable
-- catch is its own instance), which a partial unique index allows.
CREATE UNIQUE INDEX IF NOT EXISTS user_vehicles_serial_uq
  ON user_vehicles (user_id, vehicle_type_id, fleet_number)
  WHERE fleet_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS user_vehicles_user_idx ON user_vehicles (user_id);

-- Combat stats for gym battles: rolled ONCE on first catch from the model's
-- rarity (see src/lib/combat.ts). `hp` is current HP (heals to `max_hp` when the
-- vehicle isn't defending); `deployed_stop_id` locks a vehicle to a gym it's
-- defending (NULL = idle, free to deploy/delete).
ALTER TABLE user_vehicles ADD COLUMN IF NOT EXISTS max_hp INT;
ALTER TABLE user_vehicles ADD COLUMN IF NOT EXISTS hp     INT;
ALTER TABLE user_vehicles ADD COLUMN IF NOT EXISTS attack INT;
ALTER TABLE user_vehicles ADD COLUMN IF NOT EXISTS deployed_stop_id BIGINT REFERENCES stops(id) ON DELETE SET NULL;
-- Regen clock for IDLE vehicles: a vehicle drained to 0 HP by losing a gym
-- battle heals back over time from this timestamp (see regenHp in lib/combat.ts).
-- A vehicle must be at full HP before it can deploy or attack again.
ALTER TABLE user_vehicles ADD COLUMN IF NOT EXISTS hp_updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
-- The catch's ROLLED rarity (per instance), biased by the model's base rarity at
-- catch time (see rollRarity in src/lib/combat.ts). vehicle_types.rarity remains
-- the model's base tier / roll bias.
ALTER TABLE user_vehicles ADD COLUMN IF NOT EXISTS rarity TEXT;

-- Backfill the rolled rarity for catches made before it existed: use the model's
-- base rarity (matches how their HP/Attack were rolled below). Only fills NULLs.
UPDATE user_vehicles uv
SET rarity = vt.rarity
FROM vehicle_types vt
WHERE vt.id = uv.vehicle_type_id AND uv.rarity IS NULL;

-- Backfill combat stats for catches made before gyms existed: roll once per row
-- within the rarity's band (keep in sync with RARITY_BANDS in src/lib/combat.ts).
-- Only touches rows missing stats, so it's safe to re-run.
UPDATE user_vehicles uv
SET max_hp = roll.max_hp,
    hp     = roll.max_hp,
    attack = roll.attack
FROM (
  SELECT uv2.user_id, uv2.vehicle_type_id,
         lo_hp + floor(random() * (hi_hp - lo_hp + 1))::int  AS max_hp,
         lo_at + floor(random() * (hi_at - lo_at + 1))::int  AS attack
  FROM user_vehicles uv2
  JOIN vehicle_types vt ON vt.id = uv2.vehicle_type_id
  -- Keep these in sync with RARITY_BANDS in src/lib/combat.ts (tankier defenders,
  -- softer attack — gym battles should take several rounds, not one).
  CROSS JOIN LATERAL (
    SELECT CASE vt.rarity
             WHEN 'legendary' THEN 320 WHEN 'epic' THEN 240 WHEN 'rare' THEN 180 ELSE 120 END AS lo_hp,
           CASE vt.rarity
             WHEN 'legendary' THEN 440 WHEN 'epic' THEN 340 WHEN 'rare' THEN 260 ELSE 180 END AS hi_hp,
           CASE vt.rarity
             WHEN 'legendary' THEN 24 WHEN 'epic' THEN 18 WHEN 'rare' THEN 13 ELSE 9 END AS lo_at,
           CASE vt.rarity
             WHEN 'legendary' THEN 34 WHEN 'epic' THEN 26 WHEN 'rare' THEN 19 ELSE 13 END AS hi_at
  ) bands
  WHERE uv2.max_hp IS NULL
) roll
WHERE uv.user_id = roll.user_id AND uv.vehicle_type_id = roll.vehicle_type_id;

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

-- Latched quest completions: once a quest reaches its target within a period we
-- record it here, so the "done" state can't regress if the player later removes
-- a vehicle (which decrements the live count). Recorded the first time progress
-- is observed at/above target; claims still gate the actual XP payout.
CREATE TABLE IF NOT EXISTS user_quest_completions (
  user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period       BIGINT NOT NULL,
  quest_id     TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, period, quest_id)
);

-- ── Gyms ─────────────────────────────────────────────────────────────────────
-- King-of-the-hill battles at stops flagged `is_gym`. A row here means the gym is
-- HELD: one defending vehicle (a snapshot of the deploying player's vehicle stats)
-- guards it until recalled or defeated. No row ⇒ the gym is open. `defender_hp`
-- depletes when attacked and regenerates over time (see src/lib/combat.ts).
CREATE TABLE IF NOT EXISTS gym_state (
  stop_id         BIGINT PRIMARY KEY REFERENCES stops(id) ON DELETE CASCADE,
  holder_user_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type_id BIGINT NOT NULL REFERENCES vehicle_types(id),
  defender_hp     INT NOT NULL,
  defender_max_hp INT NOT NULL,
  defender_attack INT NOT NULL,
  held_since      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_regen_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gym_state_holder_idx ON gym_state (holder_user_id);
-- The exact caught instance defending here — used to read its rolled rarity +
-- catch photo (multiple instances of a model would be ambiguous via type alone).
-- NULL only for legacy rows deployed before instances existed.
ALTER TABLE gym_state ADD COLUMN IF NOT EXISTS vehicle_id BIGINT REFERENCES user_vehicles(id) ON DELETE SET NULL;

-- A battle session. The server stamps `started_at` so elapsed time (and thus the
-- max number of taps an attacker could land) is derived authoritatively, not
-- trusted from the client. `resolved_at` makes resolution single-shot.
CREATE TABLE IF NOT EXISTS gym_battles (
  id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stop_id              BIGINT NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
  attacker_user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type_id      BIGINT NOT NULL REFERENCES vehicle_types(id),
  attacker_attack      INT NOT NULL,
  defender_hp_at_start INT NOT NULL,
  started_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at          TIMESTAMPTZ,
  won                  BOOLEAN
);
CREATE INDEX IF NOT EXISTS gym_battles_attacker_idx ON gym_battles (attacker_user_id);
-- The attacking instance — so a loss can drain that exact vehicle to 0 HP.
ALTER TABLE gym_battles ADD COLUMN IF NOT EXISTS vehicle_id BIGINT REFERENCES user_vehicles(id) ON DELETE SET NULL;

-- ── Pending duplicate-serial catches ─────────────────────────────────────────
-- When a player catches a serial they already own, we roll a NEW candidate but
-- don't overwrite the existing instance until they choose which to keep. The
-- candidate (and its photo) is parked here, keyed by (player, model, serial), so
-- the choice stays server-authoritative. Resolved via POST /me/vehicles/keep.
CREATE TABLE IF NOT EXISTS pending_catches (
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type_id BIGINT NOT NULL REFERENCES vehicle_types(id) ON DELETE CASCADE,
  fleet_number    TEXT NOT NULL,
  rarity          TEXT NOT NULL,
  max_hp          INT NOT NULL,
  attack          INT NOT NULL,
  image_url       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, vehicle_type_id, fleet_number)
);
