# Architektura

ŠotoGO je klasická třívrstvá webová aplikace: **Vue single-page aplikace** (instalovatelná PWA) komunikující s **REST API** (Express) nad **PostgreSQL**. Frontend běží na GitHub Pages, backend na Fly.io.

```
┌─────────────────────────┐
│      Vue Frontend        │   Vue 3 + Router + Pinia + Leaflet, PWA
│  (SPA, mobile-first)     │   Kamera, mapa, sbírka, gymy, žebříček
│   GitHub Pages           │
└───────────┬─────────────┘
            │  HTTPS / JSON (Axios, JWT bearer)
            ▼
┌─────────────────────────┐
│   REST API (Express)     │   JWT auth + Google sign-in, herní logika,
│   Fly.io (sotogo-api)    │   rozpoznávání fotek, gym battles
└─────┬───────────────┬───┘
      │  SQL          │  fotky
      ▼               ▼
┌──────────────┐  ┌──────────────────────┐
│  PostgreSQL  │  │  S3 (Fly Tigris)      │
└──────────────┘  │  fallback: lokální disk│
                  └──────────────────────┘
        ▲
        │  Claude vision (rozpoznání vozidla)
        ▼
┌──────────────────────────┐
│  Anthropic API           │
└──────────────────────────┘
```

---

## Frontend (klient)

Mobile-first SPA, instalovatelná jako PWA (manifest, ikony, herní zvuky/haptika/hudba). Zodpovědnosti:

- **Geolokace a mapa** — poloha hráče, okolní zastávky, gymy, trasy linek (Leaflet; dlaždice Carto Voyager).
- **Zachycení kamerou** — vyfotit, nahrát na `/api/recognize`, zobrazit kandidáty a animaci odměny.
- **Stav** — Pinia stores (`auth`, `game`, `settings`, `toast`).
- **Routování** — Vue Router; 6 obrazovek (Mapa / Park / Výzvy / Profil / Žebříček + Login), centrální **Kamera** je modal, ne route.
- **Přístup k API** — Axios klient s JWT bearer tokenem.

Viz [FRONTEND.md](FRONTEND.md).

## Backend (API)

Express REST API, **autoritativní pro veškerou herní logiku**. Zodpovědnosti:

- **Autentizace** — registrace/přihlášení (bcrypt), Google sign-in, vydávání/ověřování JWT.
- **Herní logika** — rozpoznání vozidla, evidence objevů per fyzický kus, losování vzácnosti a bojových statistik, XP a výpočet levelu, deterministické denní výzvy, gym battles, denní série, žebříček.
- **Perzistence** — PostgreSQL (viz [DATA-MODEL.md](DATA-MODEL.md)).
- **Rozpoznávání** — `/api/recognize` přijme fotku a vrátí evidenční číslo + kandidátní modely (viz níže).

Viz [BACKEND.md](BACKEND.md).

## Databáze

PostgreSQL. Kompletní schéma v [DATA-MODEL.md](DATA-MODEL.md) a [`backend/src/db/schema.sql`](../backend/src/db/schema.sql).

---

## Rozpoznávací pipeline (recognize)

Čtení **evidenčního čísla** a rozpoznání modelu z fotky je definující vlastnost aplikace.

```
fotka  →  POST /api/recognize  →  Claude vision (forced tool call)
                                       │
              vrátí: je to MHD vozidlo? + evid. číslo + kandidátní modely
                                       │
              schéma nástroje má `shortName` jako ENUM živého katalogu
                       → model nemůže vrátit vozidlo, které hra nezná
                                       │
              hráč potvrdí → POST /api/me/vehicles → evidence + XP
```

- **Implementace:** Claude vision přes `@anthropic-ai/sdk` (model `claude-haiku-4-5`, konfigurovatelné přes `RECOGNIZE_MODEL`). Viz [`backend/src/lib/recognize.ts`](../backend/src/lib/recognize.ts).
- **Degradace:** když `ANTHROPIC_API_KEY` chybí, endpoint hlásí „nenastaveno" a klient spadne na **ruční výběr modelu**.
- **Autoritativnost:** porovnání s katalogem, losování a udělení XP běží na serveru — klient výsledky jen zobrazuje.

> **Poznámka k z-order:** mapa musí mít vlastní stacking context (`isolation: isolate`), aby dlaždice/markery nikdy nepřekreslily plovoucí HUD ani spodní listy. V prototypu to byl reálný bug.

---

## Průřezová témata

- **Autentizace:** JWT bearer token vydaný při přihlášení, přidávaný Axios klientem, ověřovaný na chráněných routách. Google sign-in přes `google-auth-library`.
- **Ukládání fotek:** fotky hráče (`user_vehicles.image_url`) jdou do **S3 (Fly Tigris)** v produkci (durable napříč redeployi), do lokálního disku (`/uploads`) ve vývoji. Viz [`backend/src/lib/uploads.ts`](../backend/src/lib/uploads.ts).
- **Autoritativní skórování:** udělování XP, výpočet levelu, losování a gym battles se dějí **na serveru**; čas v battlech je odvozen ze serverového `started_at`, ne z klienta.
