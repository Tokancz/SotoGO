# Backend

Express REST API nad PostgreSQL. Implementovaný a nasazený na Fly.io (`sotogo-api`, region `fra`). Kód je v [`backend/`](../backend/), provozní README v [`backend/README.md`](../backend/README.md).

## Stack

| Oblast | Volba |
|---|---|
| Runtime | Node.js 18+ (TypeScript, ESM, spouštěno přes `tsx` ve vývoji) |
| Framework | Express.js |
| Databáze | PostgreSQL (`pg`), volitelně izolováno do schématu přes `DB_SCHEMA` |
| Autentizace | JWT (bearer tokeny), hesla hashovaná `bcryptjs`, Google sign-in (`google-auth-library`) |
| Rozpoznávání vozidel | Claude vision přes `@anthropic-ai/sdk` (model `claude-haiku-4-5`, konfigurovatelné) |
| Úložiště fotek | S3-kompatibilní (`@aws-sdk/client-s3`, Fly Tigris) v produkci; lokální disk ve vývoji |
| Hlášení chyb | GitHub Issues API (in-app „Nahlásit chybu") |

## Zodpovědnosti

- **Autentizace** — registrace/přihlášení e-mailem+heslem, Google sign-in, vydávání a ověřování JWT.
- **Herní logika (autoritativně na serveru)** — rozpoznání vozidla z fotky, evidence objevů per fyzický kus (evidenční číslo), losování vzácnosti a bojových statistik, udělování XP a výpočet levelu ([`src/lib/leveling.ts`](../backend/src/lib/leveling.ts)), deterministické denní výzvy ([`src/lib/quests.ts`](../backend/src/lib/quests.ts)), achievementy ([`src/lib/achievements.ts`](../backend/src/lib/achievements.ts)), gym battles + decay obránců ([`src/lib/combat.ts`](../backend/src/lib/combat.ts)), denní check-in a série, žebříček.
- **Perzistence** — všechny entity v PostgreSQL (viz [DATA-MODEL.md](DATA-MODEL.md)).
- **Ukládání fotek** — fotky hráče do S3 (durable) nebo lokálního disku (`/uploads`, ephemerální) — viz [`src/lib/uploads.ts`](../backend/src/lib/uploads.ts).
- **Web Push** — odesílání notifikací přes VAPID ([`src/lib/push.ts`](../backend/src/lib/push.ts)); zatím event-driven trigger „gym obsazen".

## REST API (skutečný stav)

Vše kromě `/api/health`, `/api/auth/*`, `/api/recognize`, `/api/report` a katalogu (`/api/vehicles`, `/api/stops`) vyžaduje JWT. Mounty viz [`src/index.ts`](../backend/src/index.ts).

### Autentizace — `/api/auth`
| Metoda | Cesta | Účel |
|---|---|---|
| POST | `/api/auth/register` | Vytvoření účtu → `{ token, user }` |
| POST | `/api/auth/login` | Přihlášení e-mailem+heslem → `{ token, user }` |
| POST | `/api/auth/google` | Ověření Google ID tokenu → najde/založí účet → `{ token, user }` |
| GET | `/api/auth/me` | Aktuální hráč (JWT) |

### Katalog — `/api`
| Metoda | Cesta | Účel |
|---|---|---|
| GET | `/api/vehicles` | Katalog modelů vozidel (filtr dle kategorie) |
| GET | `/api/stops` | Zastávky pro mapu (bounding box / okolí) |
| GET | `/api/stops/:id/routes` | Geometrie linek obsluhujících zastávku (pro vykreslení tras) |

### Rozpoznávání a hlášení
| Metoda | Cesta | Účel |
|---|---|---|
| POST | `/api/recognize` | Upload fotky → Claude vision vrátí evidenční číslo + kandidátní modely z katalogu (per-user rate limit, `RECOGNIZE_RATE_PER_MIN`) |
| POST | `/api/report` | In-app hlášení chyby → založí GitHub Issue |
| GET | `/api/push/key` | VAPID veřejný klíč (nebo `null`, když push není nastavený) |
| POST | `/api/push/subscribe` | Registrace Web Push odběru pro hráče (JWT) |
| POST | `/api/push/unsubscribe` | Zrušení odběru dle endpointu (JWT) |

### Hráč — `/api/me` (vše JWT)
| Metoda | Cesta | Účel |
|---|---|---|
| GET | `/api/me/progress` | Kompletní herní stav hráče (park, návštěvy, statistiky) |
| DELETE | `/api/me/progress` | Reset progressu hráče |
| POST | `/api/me/vehicles` | Evidence objevu (vehicle_type, evid. číslo, fotka) → uděluje XP |
| POST | `/api/me/vehicles/keep` | Rozhodnutí u duplicitního evid. čísla (ponechat starý / nový kus) |
| DELETE | `/api/me/vehicles/:id` | Odstranění kusu ze sbírky |
| GET | `/api/me/leaderboard` | Žebříček hráčů |
| GET | `/api/me/gyms/:stopId` | Stav gymu (kdo drží, obránce, HP) |
| POST | `/api/me/gyms/:stopId/deploy` | Nasazení vlastního vozidla na obranu gymu |
| POST | `/api/me/gyms/:stopId/recall` | Stažení vlastního obránce |
| POST | `/api/me/gyms/:stopId/battle/start` | Zahájení útoku na gym (server stampuje start) |
| POST | `/api/me/gyms/battle/:battleId/resolve` | Vyhodnocení útoku (jednorázové) |
| POST | `/api/me/avatar` | Nastavení avataru |
| POST | `/api/me/stops/:id/visit` | Evidence návštěvy zastávky → uděluje XP |
| GET | `/api/me/quests` | Dnešní denní výzvy + progress + stav nárokování |
| POST | `/api/me/quests/:id/claim` | Vyzvednutí odměny za splněnou výzvu |
| GET | `/api/me/achievements` | Achievementy + live progress; latchuje nové odemčení a uděluje jednorázovou XP |
| POST | `/api/me/checkin` | Denní check-in → aktualizuje sérii |

## Uspořádání `backend/src/`

```
backend/src/
├─ index.ts            # bootstrap Express, mounty rout, error handler
├─ config.ts           # načtení + validace env proměnných
├─ routes/             # auth, catalog, recognize, report, me
├─ services/           # jwt, google (ověření ID tokenu)
├─ lib/                # herní logika: combat, leveling, quests, recognize, uploads, user
├─ middleware/         # auth (JWT guard)
├─ db/                 # pool, schema.sql, migrate, seed:vehicles, import:stops/routes, recompute:gyms
├─ data/              # vehicleTypes.ts (seed katalogu)
└─ util/               # asyncHandler
```

## DB skripty (npm)

| Skript | Účel |
|---|---|
| `npm run migrate` | Aplikuje `src/db/schema.sql` (idempotentní, včetně backfill migrací) |
| `npm run seed:vehicles` | Naseeduje katalog modelů z `src/data/vehicleTypes.ts` |
| `npm run import:stops` | Naimportuje zastávky z PID GTFS (viz pozn. níže) |
| `npm run import:routes` | Naimportuje geometrie linek z PID GTFS shapes |
| `npm run recompute:gyms` | Přepočítá příznak `is_gym` na zastávkách |

> ⚠️ `import:stops` neumí běžet znovu na již naplněné DB — pokud potřebuješ přepočítat gymy, použij `recompute:gyms`. DB je sdílená playtestovací.

## Proměnné prostředí

Povinné: `DATABASE_URL`, `JWT_SECRET`. Ostatní jsou volitelné (funkce se elegantně degradují, když chybí). Kompletní seznam viz [`src/config.ts`](../backend/src/config.ts):

| Proměnná | Účel |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL (**povinné**) |
| `JWT_SECRET` | Tajný klíč pro podpis JWT (**povinné**) |
| `DB_SCHEMA` | Schéma DB (default `public`) |
| `PORT` | Port serveru (default 3000) |
| `CLIENT_ORIGIN` | Povolené CORS originy (čárkou oddělené) |
| `GOOGLE_CLIENT_ID` | Client id pro Google sign-in (prázdné → route hlásí „nenastaveno") |
| `ANTHROPIC_API_KEY` | Klíč pro rozpoznávání fotek (prázdné → klient spadne na ruční výběr modelu) |
| `RECOGNIZE_MODEL` | Model pro rozpoznávání (default `claude-haiku-4-5`) |
| `RECOGNIZE_RATE_PER_MIN` | Per-user limit volání `/api/recognize` za minutu (default 20) |
| `GITHUB_TOKEN`, `GITHUB_REPO` | Token + repo (`owner/name`) pro in-app hlášení chyb |
| `BUCKET_NAME`, `AWS_ENDPOINT_URL_S3`, `AWS_REGION`, `S3_PUBLIC_URL` | S3 úložiště fotek (Fly Tigris); bez nich fallback na lokální disk |
| `UPLOAD_DIR`, `MAX_UPLOAD_BYTES` | Lokální adresář a limit velikosti uploadu |
| `QUEST_PERIOD_HOURS` | Perioda obnovy denních výzev (default 24 h, zarovnáno na UTC) |
| `ADMIN_EMAILS` | Čárkou oddělené e-maily s admin právy (dev nástroje, např. teleport na mapě) |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web Push (VAPID). Prázdné → push vypnutý a klient skryje toggle. Pár vygeneruj přes `npx web-push generate-vapid-keys`; privátní klíč drž v tajnosti |

Nasazení viz [DEPLOY.md](DEPLOY.md).
