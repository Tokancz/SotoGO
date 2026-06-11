# Datový model

Schéma odpovídá [`backend/src/db/schema.sql`](../backend/src/db/schema.sql) (zdroj pravdy — obsahuje i idempotentní backfill migrace pro starší DB). Níže je přehled; přesné typy a komentáře viz soubor.

## Přehled entit

```
users ──< user_vehicles >── vehicle_types      (katalog modelů = „Pokédex")
  │            │
  │            └── deployed_stop_id ─▶ stops    (vozidlo brání gym)
  │
  ├──< user_stops >── stops                     (navštívené zastávky)
  ├──< user_quest_claims / user_quest_completions >   (denní výzvy)
  └──< gym_state / gym_battles >── stops         (gym battles)

stops ──< route_geometries                      (geometrie linek pro mapu)
pending_catches                                  (nerozhodnuté duplicitní chyty)
```

Klíčové rozdíly oproti původnímu náčrtu:

- Katalog je **`vehicle_types`** — jeden řádek na **model** (typ), ne na fyzický kus.
- **`user_vehicles`** eviduje **fyzické kusy** — jeden řádek na chycený evidenční číslo, takže hráč může vlastnit víc kusů stejného modelu. Surrogate `id` je handle pro deploy/delete/battle.
- Denní **výzvy se neukládají** — odvozují se deterministicky z `(user_id, period)`; persistují se jen claims/completions.
- **Gymy** jsou king-of-the-hill nad zastávkami s `is_gym = true`.

---

## Tabulky

### `users`
Hráči. `password_hash` je `NULL` u Google-only účtů; `google_id` linkuje Google účet; `avatar_url` drží Google obrázek. `level`/`xp` jsou autoritativní (počítané serverem). `streak_count` + `last_active_date` drží denní sérii. `battles_won` + `gym_seconds` jsou gym counters pro žebříček.

### `vehicle_types`
Katalog sbíratelných **modelů** („Pokédex"). Seedováno z `src/data/vehicleTypes.ts`. Sloupce: `category` (tram/bus/metro/trolley/train), `model`, `short_name` (např. `15T`), `manufacturer`, `operator` (DPP/Metro Praha/ČD/PID), `rarity` (common/rare/epic/legendary — bázová úroveň + bias losování). Unikátní `(category, short_name)`.

### `stops`
Stanice (sloučené nástupiště), importované z PID GTFS. Sloupce: `gtfs_node_id`, `name`, `latitude`/`longitude`, `lines[]` (krátké názvy linek), `categories[]`, `route_ids[]` (pro kreslení tras), `is_gym` (metro + významné přestupy). Indexy na lat/lng, gym a `lower(name)`.

### `route_geometries`
Reprezentativní polyline na route (`route_id` PK, `line`, `category`, `points` JSONB = pole `[lat, lng]`) — pro vykreslení barevných tras po kliknutí na zastávku.

### `user_vehicles`
Fyzické kusy ve sbírce hráče. `id` (PK), `user_id`, `vehicle_type_id`, `fleet_number` (evidenční číslo; `NULL` když nečitelné), `found_at`, `image_url` (hráčova fotka). **Bojové statistiky** (losované jednou při chycení dle vzácnosti): `max_hp`, `hp` (aktuální, regeneruje když kus nebrání gym), `attack`, `hp_updated_at` (regen hodiny), `deployed_stop_id` (gym, který brání; `NULL` = volný), `rarity` (vylosovaná úroveň kusu). Partial unique index na `(user_id, vehicle_type_id, fleet_number)` pro nenulové evid. číslo.

### `user_stops`
Navštívené zastávky — PK `(user_id, stop_id)`, `visited_at`.

### `user_quest_claims` / `user_quest_completions`
Denní výzvy se neukládají (derivované z `(user_id, period)`). `user_quest_completions` latchuje, že výzva v daném období dosáhla cíle (aby „splněno" neregresovalo). `user_quest_claims` eviduje, že odměna už byla vyzvednuta (aby nešla vybrat dvakrát). Obě PK `(user_id, period, quest_id)`; `period` = `floor(epoch_ms / period_ms)`.

### `gym_state`
Drží-li někdo gym: jeden řádek = obsazeno. `stop_id` (PK), `holder_user_id`, `vehicle_type_id` + `vehicle_id` (konkrétní bránící kus), `defender_hp`/`defender_max_hp`/`defender_attack`, `held_since`, `last_regen_at`. Žádný řádek ⇒ gym je otevřený.

### `gym_battles`
Session útoku. Server stampuje `started_at`, takže počet zásahů útočníka je odvozen autoritativně, ne věřen klientovi. `resolved_at` dělá vyhodnocení jednorázové; `won` drží výsledek. `vehicle_id` = útočící kus (prohra ho vyčerpá na 0 HP).

### `pending_catches`
Když hráč chytí evidenční číslo, které už vlastní, vylosuje se nový kandidát a zaparkuje sem (per `(user_id, vehicle_type_id, fleet_number)`), dokud hráč nerozhodne, který kus si nechá. Server-autoritativní; řeší `POST /api/me/vehicles/keep`.

### `user_achievements`
Odemčené achievementy. Stejně jako u výzev žijí **definice v kódu** (`src/lib/achievements.ts`), ne v tabulce — persistuje se jen fakt, že hráč achievement **odemkl**. Řádek `(user_id, achievement_id)` latchuje odemčení natrvalo (neregresuje, když progress později klesne) a jeho vložení (idempotentní přes `ON CONFLICT`) hlídá jednorázovou XP odměnu. Progress se počítá živě ze serverových dat (chycené kusy, navštívené zastávky, série, velikost katalogu).

### `push_subscriptions`
Web Push odběry — jeden řádek na zařízení/prohlížeč (`endpoint` unikátní, `p256dh` + `auth` jsou šifrovací klíče z `PushSubscription`). Hráč jich může mít víc. Mrtvé endpointy (404/410 při odeslání) se prořezávají v `src/lib/push.ts`. Bez nakonfigurovaného VAPID je celá vrstva no-op.

> **Gym výdrž (decay):** gymy nemají vlastní tabulku navíc — obránce v `gym_state` slábne v čase. `defender_hp` klesá z `defender_max_hp` k 0 za `GYM_DECAY_DAYS` (4) měřeno od `last_regen_at` (sloupec teď slouží jako kotva decaye); při 0 je gym automaticky uvolněn. Viz `src/lib/combat.ts`.
