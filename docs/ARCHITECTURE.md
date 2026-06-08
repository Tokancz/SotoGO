# Architektura

ŠotoGO je klasická třívrstvá webová aplikace: **Vue single-page aplikace** komunikující s **REST API** nad **PostgreSQL**.

```
┌─────────────────────────┐
│      Vue Frontend        │   Vue 3 + Router + Pinia + Leaflet
│  (SPA, mobile-first)     │   Zachycení kamerou, mapa, UI sbírky
└───────────┬─────────────┘
            │  HTTPS / JSON (Axios)
            ▼
┌─────────────────────────┐
│   REST API (Express)     │   Autentizace (JWT), herní logika, OCR endpoint
└───────────┬─────────────┘
            │  SQL
            ▼
┌─────────────────────────┐
│       PostgreSQL         │   users, vehicles, stops, progress
└─────────────────────────┘
```

---

## Frontend (klient)

Mobile-first SPA. Zodpovědnosti:

- **Geolokace a mapa** — zobrazení polohy hráče a okolních zastávek (Leaflet; v prototypu dlaždice Carto Voyager).
- **Zachycení kamerou** — vyfotit, nahrát na OCR, zobrazit animaci odměny.
- **Stav** — Pinia stores pro přihlášeného uživatele, sbírku (vozový park), výzvy a achievementy.
- **Routování** — Vue Router řídící obrazovky spodní navigace (Mapa / Park / Kamera / Výzvy / Profil).
- **Přístup k API** — Axios klient s JWT připojeným k požadavkům.

Viz [FRONTEND.md](FRONTEND.md).

## Backend (API)

Bezstavové Express REST API. Zodpovědnosti:

- **Autentizace** — registrace/přihlášení, hashování hesel, vydávání a ověřování JWT.
- **Herní logika** — ověřování naskenovaných vozidel proti katalogu, evidence objevů, udělování XP, výpočet levelu, generování denních výzev, vyhodnocování achievementů.
- **Perzistence** — přístup k PostgreSQL pro všechny entity.
- **OCR** — endpoint, který přijme fotku a vrátí rozpoznané evidenční číslo (viz níže).

Viz [BACKEND.md](BACKEND.md).

## Databáze

PostgreSQL. Kompletní schéma v [DATA-MODEL.md](DATA-MODEL.md).

---

## OCR pipeline

Čtení **evidenčního čísla** z fotky je definující vlastnost aplikace.

```
fotka  →  upload na API  →  OCR engine  →  kandidátní evid. číslo
                                              │
                              porovnání s katalogem vozidel
                                              │
                          nalezeno?  →  evidence objevu + udělení XP
                       nenalezeno?  →  výzva hráči k opakování / opravě
```

- **v1:** [Tesseract.js](https://github.com/naptha/tesseract.js) — běží v JS, bez náročné infrastruktury. Může běžet na klientovi i na serveru; běh na serveru udrží porovnání s katalogem a udělení XP autoritativní a zabrání manipulaci z klienta.
- **Budoucí verze:** **vlastní ML model** trénovaný na reálných evidenčních číslech vozidel pro vyšší přesnost.

> **Poznámka k z-order:** mapa musí mít vlastní stacking context (`isolation: isolate`), aby dlaždice/markery nikdy nepřekreslily plovoucí HUD. V prototypu to byl reálný bug — pamatuj na to u jakékoli nativní/překryvné mapy.

---

## Průřezová témata

- **Autentizace:** JWT bearer token, vydaný při přihlášení, přidávaný Axios klientem, ověřovaný na chráněných routách.
- **Ukládání obrázků:** fotky hráče (`image_url` v `user_vehicles`) potřebují úložiště — lokální disk pro vývoj, objektové úložiště (S3-kompatibilní) pro produkci. K rozhodnutí.
- **Autoritativní skórování:** udělování XP, výpočet levelu a validace objevů by se měly dít **na serveru**; klient pouze zobrazuje výsledky.
