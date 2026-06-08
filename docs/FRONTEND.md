# Frontend

Mobile-first Vue 3 single-page aplikace. Současný kód v [`frontend/`](../frontend/) je stále výchozí šablona Vite — tento dokument popisuje **cílovou** podobu a navigaci/obrazovky k vytvoření, vycházející z designové reference.

## Stack

| Oblast | Volba |
|---|---|
| Framework | Vue 3 (`<script setup>` SFC) |
| Build | Vite + TypeScript |
| Routování | Vue Router |
| Stav | Pinia |
| Stylování | SCSS (namapuj design tokeny na SCSS/CSS proměnné) |
| HTTP | Axios |
| Mapa | Leaflet |
| OCR (varianta na klientovi) | Tesseract.js |

> Router, Pinia, SCSS, Axios, Leaflet **zatím nejsou nainstalované** — v `package.json` je pouze `vue`.

## Design systém

Závazná vizuální specifikace je v [`design/`](../design/): design tokeny (`design-system/tokens/*.css`), 16 komponent (`core/`, `forms/`, `game/`), specifikace animací a spustitelný prototyp každé obrazovky. **Implementuj je znovu jako Vue komponenty** — nenasazuj React/HTML prototyp. U každé komponenty si přečti `.prompt.md` pro zamýšlené chování a varianty.

Hlavní barva značky: **ŠotoGO Green `#43B02A`**. Fonty: Fredoka (display), DM Sans (UI), JetBrains Mono (kódy/statistiky).

## Navigace

Spodní navigace ve stylu Pokémon GO — 5 cílů s vyvýšeným centrálním tlačítkem **Kamera** (FAB), které otevírá modal (není to záložka):

```
┌─────────────────────┐
│                     │
│        MAPA         │
│                     │
├─────────────────────┤
│  🗺️  📷  🚋  🎯  👤  │
└─────────────────────┘
  Mapa Kam. Park Výzvy Profil
```

| Záložka | Obrazovka | Účel |
|---|---|---|
| **Mapa** | MapScreen | Živá mapa: poloha hráče, okolní zastávky, XP HUD |
| **Kamera** | CaptureSheet (modal) | Vyfotit vozidlo → sken → odměna |
| **Park** | ParkScreen | Mřížka sbírky vozového parku |
| **Výzvy** | VyzvyScreen | Denní výzvy + achievementy |
| **Profil** | ProfilScreen | Level, XP, statistiky, nastavení |
| — | Login | Autentizace (přihlášení/registrace), vstupní bod |

## Obrazovky (přehled)

- **Mapa** — celoplošná mapa; plovoucí skleněný HUD s kartou level/XP, vyhledávacím polem, pulzující tečkou hráče, piny zastávek obarvenými podle linky, FAB pro lokaci a spodní listou zastávky (odznak navštíveno nebo +XP).
- **Kamera** — celoobrazovkový tmavý modal: Zaměření → Skenování („Čtu evidenční číslo…") → Odměna („Nový objev!", +100 XP, „Přidat do parku").
- **Park** — lišta dokončení, filtrovací chipy kategorií (s počty), přepínač mřížka/seznam, karty vozidel (typ/číslo/dopravce, odznak kategorie, hvězdičky vzácnosti, datum nalezení, příznak „nové"), zamčené siluetové sloty a spodní lista s detailem vozidla.
- **Výzvy** — denní banner s odpočtem do obnovení + celkové XP, karty výzev (progress + odměna + splněno) a mřížka achievementů 3 vedle sebe (bronz/stříbro/zlato, zamčeno/odemčeno, progress).
- **Profil** — avatar, kruh levelu, série (streak), dlaždice statistik.
- **Login / Registrace** — zelený hero + formulářová lišta, segmentový přepínač Login⇄Registrace, e-mail/heslo, přezdívka (registrace), „Zůstat přihlášen", primární CTA, tlačítka Apple/Google. Pozor na interakci sbalujícího se hero při scrollu (jeden nativní scroll kontejner).

Kompletní detail každé obrazovky, tokeny a animace viz [`design/README.md`](../design/README.md).

## Navržené uspořádání `src/`

```
frontend/src/
├─ main.ts
├─ App.vue
├─ router/                # Vue Router: routy + navigační guardy (auth)
├─ stores/                # Pinia: auth, park (sbírka), výzvy, achievementy, mapa
├─ services/              # Axios klient + API moduly (auth, vehicles, stops, ocr)
├─ views/                 # Obrazovky na úrovni rout: MapView, ParkView, VyzvyView, ProfilView, LoginView
├─ components/
│  ├─ core/               # Button, Card, Badge, Avatar, ProgressBar, StatTile, Tag, IconButton
│  ├─ forms/              # Input, SegmentedControl, Switch
│  └─ game/               # BottomNav, VehicleCard, ChallengeCard, AchievementBadge, LevelRing, CaptureSheet
├─ composables/           # useGeolocation, useCamera, useOcr, …
├─ types/                 # sdílené TS typy herního modelu
├─ styles/                # SCSS: tokeny (z design systému), base, utility
└─ assets/
```

Kde frontend sídlí v rámci celého repozitáře, viz [FOLDER-STRUCTURE.md](FOLDER-STRUCTURE.md).
