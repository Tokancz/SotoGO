# Datový model

Níže uvedené databázové schéma zrcadlí herní model. Datové typy jsou orientační; upřesni je při tvorbě migrací.

## Přehled entit

```
users ──< user_vehicles >── vehicles
  │
  └──< user_stops >── stops

daily_challenges   (generované každý den)
```

Hráč (`users`) objevuje vozidla (`vehicles`, evidováno v join tabulce `user_vehicles`), navštěvuje zastávky (`stops`, evidováno v `user_stops`) a plní denní výzvy (`daily_challenges`).

---

## Tabulky

### `users`

| Sloupec | Typ | Poznámka |
|---|---|---|
| `id` | PK | |
| `username` | text | zobrazovaná přezdívka |
| `email` | text, unique | |
| `password_hash` | text | nikdy neukládat heslo v plaintextu |
| `created_at` | timestamp | |
| `level` | int | odvozeno z `xp` |
| `xp` | int | kumulativní XP |

### `vehicles`

**Katalog** všech reálných vozidel, která lze sebrat (referenční data).

| Sloupec | Typ | Poznámka |
|---|---|---|
| `id` | PK | |
| `vehicle_type` | text | např. `15T` |
| `vehicle_number` | text | evidenční číslo, např. `9325` |
| `operator` | text | dopravce |
| `manufacturer` | text | výrobce |

> Design dále počítá s **kategorií** (tramvaj/autobus/metro/trolejbus/vlak) a **vzácností** (common/rare/epic/legendary). Při implementaci přidej sloupce `category` a `rarity` (nebo lookup tabulku `categories`).

### `user_vehicles`

Vozidla sebraná hráčem (join `users` × `vehicles`).

| Sloupec | Typ | Poznámka |
|---|---|---|
| `id` | PK | |
| `user_id` | FK → users | |
| `vehicle_id` | FK → vehicles | |
| `found_at` | timestamp | datum nalezení |
| `image_url` | text | hráčova fotka |

### `stops`

Zastávky PID — každá je herní bod.

| Sloupec | Typ | Poznámka |
|---|---|---|
| `id` | PK | |
| `name` | text | např. `Florenc` |
| `latitude` | float | |
| `longitude` | float | |

> Design počítá s **linkami** (`lines[]`) obsluhujícími zastávku a s XP udělovaným při návštěvě — namodeluj je (např. tabulka `stop_lines` a sloupec `reward_xp`) při implementaci.

### `user_stops`

Zastávky navštívené hráčem (join `users` × `stops`).

| Sloupec | Typ | Poznámka |
|---|---|---|
| `id` | PK | |
| `user_id` | FK → users | |
| `stop_id` | FK → stops | |
| `visited_at` | timestamp | |

### `daily_challenges`

Úkoly generované každý den.

| Sloupec | Typ | Poznámka |
|---|---|---|
| `id` | PK | |
| `title` | text | např. „Navštiv zastávku Florenc" |
| `description` | text | |
| `reward_xp` | int | |

> Progress hráče na výzvě (hodnota/max, splněno) potřebuje vlastní join tabulku, např. `user_challenges (user_id, challenge_id, progress, completed_at)`. **Achievementy** v původním schématu chybí — přidej `achievements` + `user_achievements` (tier, progress, unlocked), aby fungovala mřížka achievementů na obrazovce Výzvy.

---

## Co doplnit před implementací

Původní náčrt výše vynechává několik věcí, se kterými design (`design/`) už počítá:

- `vehicles.category` a `vehicles.rarity`
- linky zastávky a **reward_xp** za zastávku
- **progress výzev pro jednotlivé hráče** (`user_challenges`)
- tabulky **achievementů** (`achievements`, `user_achievements`)

Kompletní sadu tvarů, které UI očekává (`PLAYER`, `CATS`, `STOPS`, `VEHICLES`, `CHALLENGES`, `ACHIEVEMENTS`), najdeš v sekci „Game model / data" v designové referenci.
