# Backend

> **Stav: zatím neimplementováno.** Tento dokument popisuje zamýšlený backend, aby šel postavit konzistentně. Složka `backend/` zatím neexistuje — kde má sídlit, viz [FOLDER-STRUCTURE.md](FOLDER-STRUCTURE.md).

## Stack

| Oblast | Volba |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Databáze | PostgreSQL |
| Autentizace | JWT (bearer tokeny) |
| OCR | Tesseract.js (v1) → vlastní ML model (budoucí) |

## Zodpovědnosti

- **Autentizace** — registrace/přihlášení, hashování hesel (např. bcrypt/argon2), vydávání a ověřování JWT.
- **Herní logika** — validace naskenovaných vozidel proti katalogu, evidence objevů, **udělování XP a výpočet levelu na serveru**, generování denních výzev, vyhodnocování progressu achievementů.
- **OCR** — přijetí nahrané fotky a vrácení rozpoznaného evidenčního čísla (+ porovnání s katalogem).
- **Perzistence** — všechny entity v PostgreSQL (viz [DATA-MODEL.md](DATA-MODEL.md)).
- **Ukládání obrázků** — uložení fotek hráče a expozice `image_url` (lokální disk ve vývoji; objektové úložiště v produkci — k rozhodnutí).

## Navržená plocha REST API

> Orientační, ne finální. Seskupené podle zdroje; vše kromě autentizace chraň JWT guardem.

### Autentizace
| Metoda | Cesta | Účel |
|---|---|---|
| POST | `/api/auth/register` | Vytvoření účtu → vrátí JWT |
| POST | `/api/auth/login` | Přihlášení → vrátí JWT |
| GET | `/api/auth/me` | Profil aktuálního hráče |

### Vozidla a sbírka
| Metoda | Cesta | Účel |
|---|---|---|
| GET | `/api/vehicles` | Katalog vozidel (filtr dle kategorie) |
| GET | `/api/me/vehicles` | Vozový park hráče |
| POST | `/api/ocr/scan` | Upload fotky → rozpoznané evid. číslo + porovnání s katalogem |
| POST | `/api/me/vehicles` | Evidence objevu (vehicle_id, obrázek) → uděluje XP |

### Zastávky
| Metoda | Cesta | Účel |
|---|---|---|
| GET | `/api/stops?near=lat,lng` | Okolní zastávky pro mapu |
| POST | `/api/me/stops/:id/visit` | Evidence návštěvy → uděluje XP/bonus |

### Výzvy a achievementy
| Metoda | Cesta | Účel |
|---|---|---|
| GET | `/api/challenges/daily` | Dnešní výzvy + progress hráče |
| GET | `/api/me/achievements` | Achievementy s progressem/stavem odemčení |

## Navržené uspořádání

```
backend/
├─ src/
│  ├─ index.ts            # bootstrap Express aplikace
│  ├─ routes/             # auth, vehicles, stops, challenges, ocr
│  ├─ controllers/        # obsluha požadavků
│  ├─ services/           # herní logika (xp, levely, generování výzev, achievementy)
│  ├─ middleware/         # auth (JWT), obsluha chyb, upload
│  ├─ db/                 # pool/klient, migrace, seed (katalog vozidel a zastávek)
│  ├─ ocr/                # wrapper nad Tesseract (vyměnitelný za ML později)
│  └─ types/              # sdílené s frontendem, kde to jde
├─ package.json
└─ .env.example           # DB_URL, JWT_SECRET, …
```

Schéma viz [DATA-MODEL.md](DATA-MODEL.md) (a co doplnit: kategorie/vzácnost, linky zastávek, progress výzev pro hráče, tabulky achievementů).
