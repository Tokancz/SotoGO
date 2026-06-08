# ŠotoGO

> Geolokační webová hra pro fanoušky veřejné dopravy („šotouše") — představ si **Pokémon GO, ale pro tramvaje, autobusy, metro, trolejbusy a vlaky.**

Hráči cestují po městě, **fotí reálná vozidla veřejné dopravy** a aplikace z fotky přečte **evidenční číslo** vozidla pomocí OCR, ověří ho proti databázi a přidá vozidlo do hráčovy osobní sbírky („**vozový park**"). Cestou hráči navštěvují zastávky, plní denní výzvy, získávají XP, zvyšují level a odemykají achievementy.

> **Jazyk:** uživatelské rozhraní je v **češtině**. Vývojářská dokumentace je rovněž v češtině.

---

## Příklad

Vyfotíš tramvaj → OCR přečte `15T #9325` → pokud ji ještě nemáš ve sbírce:

```
Nový objev!  (+100 XP)
```

---

## Co je v repozitáři

| Cesta | Co to je | Stav |
|---|---|---|
| [`frontend/`](frontend/) | Webový frontend — **Vue 3 + TypeScript + Vite** | Zatím jen scaffold (výchozí šablona) |
| [`design/`](design/) | **Designová reference** — spustitelný hi-fi prototyp + kompletní design systém (tokeny + 16 komponent) | Hotovo, závazné |
| [`docs/`](docs/) | Dokumentace projektu (tato sada) | — |

> ⚠️ **Backend zatím neexistuje.** Zamýšlený stack (Node/Express/PostgreSQL/JWT/OCR) je popsaný v [docs/BACKEND.md](docs/BACKEND.md) a [docs/FOLDER-STRUCTURE.md](docs/FOLDER-STRUCTURE.md), ale žádný kód k němu zatím nevznikl.

> ⚠️ `design/` je **designový zdroj pravdy, ne kód k nasazení.** Jde o prototyp v HTML+React (přes Babel v prohlížeči). Obrazovky znovu postav v reálné Vue aplikaci — prototyp nenasazuj. Viz [`design/README.md`](design/README.md).

---

## Dokumentace

| Dokument | Obsah |
|---|---|
| [docs/GAME-DESIGN.md](docs/GAME-DESIGN.md) | Herní mechanika: sbírání vozidel, vozový park, zastávky, denní výzvy, achievementy, XP/levely |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architektura systému a tok požadavků (frontend → REST API → PostgreSQL), OCR pipeline |
| [docs/DATA-MODEL.md](docs/DATA-MODEL.md) | Databázové schéma a herní datový model |
| [docs/FRONTEND.md](docs/FRONTEND.md) | Frontend stack, navigace (spodní lišta), obrazovky, odkaz na design systém |
| [docs/BACKEND.md](docs/BACKEND.md) | Zamýšlený backend stack, REST API, autentizace, OCR služba |
| [docs/FOLDER-STRUCTURE.md](docs/FOLDER-STRUCTURE.md) | **Struktura složek** repozitáře (frontend + backend) |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Rozsah MVP (v1.0) a budoucí verze |

---

## Technologický stack (zamýšlený)

**Frontend:** Vue 3 · Vue Router · Pinia · SCSS · Axios · Leaflet
**Backend:** Node.js · Express.js · PostgreSQL · JWT autentizace
**OCR:** Tesseract.js (v1) → vlastní ML model (budoucí verze)

---

## Rychlý start (frontend)

```bash
cd frontend
npm install
npm run dev      # vývojový server Vite
npm run build    # typová kontrola + produkční build
npm run preview  # náhled produkčního buildu
```

Frontend je momentálně výchozí šablona Vue + Vite. Cílovou strukturu k dopracování najdeš v [docs/FRONTEND.md](docs/FRONTEND.md) a umístění backendu v [docs/FOLDER-STRUCTURE.md](docs/FOLDER-STRUCTURE.md).

---

## Designová reference

Otevři [`design/app/index.html`](design/app/index.html) v prohlížeči (vyžaduje internet — načítá React/Babel/Leaflet/Lucide z CDN) a uvidíš každou obrazovku spuštěnou v rámu telefonu 390×844. Hlavní barva značky je **ŠotoGO Green `#43B02A`**. Kompletní tokeny, specifikace animací a dokumentace komponent jsou v [`design/README.md`](design/README.md).
