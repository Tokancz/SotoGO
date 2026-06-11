# Frontend

Mobile-first Vue 3 single-page aplikace, postavená z designové reference a nasazená jako instalovatelná **PWA** na GitHub Pages. Kód je v [`frontend/`](../frontend/).

## Stack

| Oblast | Volba |
|---|---|
| Framework | Vue 3 (`<script setup>` SFC, TypeScript) |
| Build | Vite + `vue-tsc` |
| Routování | Vue Router (auth guard) |
| Stav | Pinia (`auth`, `game`, `settings`, `toast`) |
| Stylování | SCSS — design tokeny jako CSS custom properties |
| HTTP | Axios (JWT bearer) |
| Mapa | Leaflet |
| Ikony | `lucide-vue-next` (přes `SgIcon.vue`) |
| PWA | `site.webmanifest` + ikony; herní zvuky (SFX), haptika, ambientní hudba |

## Design systém

Závazná vizuální specifikace je v [`design/`](../design/): design tokeny, 16 komponent (`core/`, `forms/`, `game/`), specifikace animací a spustitelný prototyp každé obrazovky. Komponenty jsou reimplementované jako Vue (prefix `Sg*`) — React/HTML prototyp se **nenasazuje**.

Hlavní barva značky: **ŠotoGO Green `#43B02A`**. Fonty: Fredoka (display), DM Sans (UI), JetBrains Mono (kódy/statistiky).

> Detaily stylovací architektury (tokeny jako CSS proměnné, abstracts mixiny, globální `_map.scss`) drží projektová paměť a SCSS soubory v `src/styles/`.

## Navigace

Spodní navigace ve stylu Pokémon GO — vyvýšené centrální tlačítko **Kamera** (FAB) otevírá modal (není to záložka). Routy jsou pod `AppLayout`; `/login` je samostatná veřejná obrazovka.

| Záložka | View | Účel |
|---|---|---|
| **Mapa** | `MapView` | Živá mapa: poloha hráče, okolní zastávky, gymy, trasy linek, XP HUD |
| **Kamera** | `CaptureSheet` (modal) | Vyfotit vozidlo → rozpoznání → odměna |
| **Park** | `ParkView` | Mřížka sbírky vozového parku |
| **Výzvy** | `VyzvyView` | Denní výzvy + achievementy |
| **Žebříček** | `ZebricekView` | Pořadí hráčů (XP, gymy) |
| **Profil** | `ProfilView` | Level, XP, série, statistiky, nastavení |
| — | `LoginView` | Autentizace (e-mail/heslo + Google), vstupní bod |

## Obrazovky (přehled)

- **Mapa** — celoplošná Leaflet mapa; plovoucí skleněný HUD s level/XP, vyhledávání, pulzující tečka hráče, piny zastávek obarvené dle linky, gym markery, vykreslení tras po kliknutí, FAB pro lokaci, spodní lista zastávky (návštěva / gym battle).
- **Kamera** — celoobrazovkový tmavý modal: Zaměření → Skenování („Čtu evidenční číslo…") → Odměna („Nový objev!", typ/číslo, +XP, „Přidat do parku"). Při nedostupném rozpoznávání ruční výběr modelu.
- **Park** — lišta dokončení, filtrovací chipy kategorií, karty kusů (typ/číslo/dopravce, vzácnost, datum, bojové statistiky), zamčené siluetové sloty, detail kusu (deploy na gym, smazat).
- **Výzvy** — denní banner s odpočtem + celkové XP, karty výzev (progress + odměna + nárokování), mřížka achievementů (bronz/stříbro/zlato).
- **Žebříček** — pořadí hráčů podle XP a gym metrik.
- **Profil** — avatar, kruh levelu, denní série, dlaždice statistik, nastavení (zvuky atd.).
- **Login / Registrace** — segmentový přepínač Login⇄Registrace, e-mail/heslo, přezdívka, „Zůstat přihlášen", Google sign-in.

> **Achievementy** chodí z API (`GET /me/achievements`) — odemčení i XP jsou server-autoritativní. Klient drží jejich progress ve store (`loadAchievements`) a odemčení oznamuje toastem (baseline se nasadí po načtení, aby existující odemčení nehlásila znovu). Viz [BACKEND.md](BACKEND.md).

## Uspořádání `src/`

```
frontend/src/
├─ main.ts · App.vue
├─ router/                # Vue Router: routy + auth guard
├─ stores/                # Pinia: auth, game, settings, toast
├─ services/              # Axios klient + API moduly (auth, catalog, gyms, leaderboard,
│                         #   progress, recognize, report)
├─ views/                 # LoginView, MapView, ParkView, VyzvyView, ProfilView, ZebricekView
├─ components/
│  ├─ ui/                 # Sg* core + forms (Button, Card, Badge, Input, Switch, …)
│  ├─ game/               # BottomNav, VehicleCard, ChallengeCard, AchievementBadge,
│  │                      #   LevelRing, BattleOverlay, LevelUpOverlay
│  ├─ layout/             # AppLayout, TopBar, CaptureSheet, ReportBugSheet
│  └─ SgIcon.vue          # Lucide registry (kebab → PascalCase)
├─ composables/           # useGeolocation, useCamera, useGoogleSignIn, useCountUp, useDialog
├─ lib/                   # audioContext, music, feedback (haptika), image, leveling
├─ data/                  # seed.ts (achievement definice), fleet.ts
├─ types/ · styles/ · assets/
└─ public/                # site.webmanifest, ikony, og-image, robots/sitemap
```

Kompletní detail obrazovek, tokeny a animace viz [`design/README.md`](../design/README.md). Kde frontend sídlí v repu, viz [FOLDER-STRUCTURE.md](FOLDER-STRUCTURE.md).
