# ŠotoGO

> Geolokační webová hra pro fanoušky veřejné dopravy („šotouše") — představ si **Pokémon GO, ale pro tramvaje, autobusy, metro, trolejbusy a vlaky.**

Hráči cestují po městě, **fotí reálná vozidla veřejné dopravy** a aplikace z fotky přečte **evidenční číslo** vozidla a rozpozná model, ověří ho proti databázi a přidá vozidlo do hráčovy osobní sbírky („**vozový park**"). Cestou hráči navštěvují zastávky, plní denní výzvy, bojují o **gymy** na významných stanicích, soupeří v žebříčku, získávají XP, zvyšují level a udržují denní sérii.

> **Jazyk:** uživatelské rozhraní je v **češtině**. Vývojářská dokumentace je rovněž v češtině (kromě [docs/DEPLOY.md](docs/DEPLOY.md)).

---

## Příklad

Vyfotíš tramvaj → aplikace přečte `15T #9325` a rozpozná model → pokud daný kus ještě nemáš ve sbírce:

```
Nový objev!  (+100 XP)
```

---

## Co je v repozitáři

| Cesta | Co to je | Stav |
|---|---|---|
| [`frontend/`](frontend/) | Webový frontend — **Vue 3 + TypeScript + Vite**, instalovatelná PWA | Hotovo, v provozu |
| [`backend/`](backend/) | REST API — **Node.js + Express + PostgreSQL + JWT** | Hotovo, nasazené na Fly.io |
| [`design/`](design/) | **Designová reference** — spustitelný hi-fi prototyp + kompletní design systém (tokeny + 16 komponent) | Hotovo, závazné |
| [`docs/`](docs/) | Dokumentace projektu (tato sada) | — |

> ⚠️ `design/` je **designový zdroj pravdy, ne kód k nasazení.** Jde o prototyp v HTML+React (přes Babel v prohlížeči). Obrazovky jsou znovu postaveny v reálné Vue aplikaci ve [`frontend/`](frontend/) — prototyp se nenasazuje. Viz [`design/README.md`](design/README.md).

---

## Dokumentace

| Dokument | Obsah |
|---|---|
| [docs/GAME-DESIGN.md](docs/GAME-DESIGN.md) | Herní mechanika: sbírání vozidel, vozový park, zastávky, denní výzvy, gymy, žebříček, série, XP/levely |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architektura systému a tok požadavků (frontend → REST API → PostgreSQL), rozpoznávací pipeline, ukládání fotek |
| [docs/DATA-MODEL.md](docs/DATA-MODEL.md) | Databázové schéma a herní datový model |
| [docs/FRONTEND.md](docs/FRONTEND.md) | Frontend stack, navigace (spodní lišta), obrazovky, PWA, odkaz na design systém |
| [docs/BACKEND.md](docs/BACKEND.md) | Backend stack, REST API, autentizace, rozpoznávání, gymy |
| [docs/FOLDER-STRUCTURE.md](docs/FOLDER-STRUCTURE.md) | **Struktura složek** repozitáře (frontend + backend) |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Nasazení (frontend → GitHub Pages, backend → Fly.io) |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Stav implementace a budoucí verze |

---

## Technologický stack

**Frontend:** Vue 3 · Vue Router · Pinia · SCSS · Axios · Leaflet · PWA (manifest + ikony, herní zvuky/haptika)
**Backend:** Node.js · Express.js · PostgreSQL · JWT autentizace · Google sign-in
**Rozpoznávání vozidel:** Claude vision (`@anthropic-ai/sdk`) — čte evidenční číslo a vybírá model z katalogu
**Úložiště fotek:** S3-kompatibilní (Fly Tigris) v produkci, lokální disk ve vývoji
**Data:** zastávky a linky z PID GTFS, katalog vozidel ze seedu

---

## Rychlý start

### Frontend

```bash
cd frontend
npm install
npm run dev      # vývojový server Vite
npm run build    # typová kontrola (vue-tsc) + produkční build
npm run preview  # náhled produkčního buildu
```

### Backend

```bash
cd backend
cp .env.example .env   # vyplň DATABASE_URL, JWT_SECRET, …
npm install
npm run migrate        # vytvoří schéma
npm run seed:vehicles  # naseeduje katalog vozidel
npm run import:stops   # naimportuje zastávky z PID GTFS
npm run dev            # tsx watch
```

Detaily a všechny proměnné prostředí viz [docs/BACKEND.md](docs/BACKEND.md) a [backend/README.md](backend/README.md).

---

## Designová reference

Otevři [`design/app/index.html`](design/app/index.html) v prohlížeči (vyžaduje internet — načítá React/Babel/Leaflet/Lucide z CDN) a uvidíš každou obrazovku spuštěnou v rámu telefonu 390×844. Hlavní barva značky je **ŠotoGO Green `#43B02A`**. Kompletní tokeny, specifikace animací a dokumentace komponent jsou v [`design/README.md`](design/README.md).
