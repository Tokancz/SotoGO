# ŠotoGO — Developer Handoff

**ŠotoGO** is a gamified "collect Czech public transit" mobile app — a Pokémon-GO-style game where players photograph real trams, buses, metros, and trains to "catch" them, earn XP, level up, complete daily challenges, and fill out a collection ("vozový park"). This package is the **complete design reference**: a runnable hi-fi prototype of every screen, plus the full design system (tokens + components) it's built on.

> Language: the UI is in **Czech**. Keep the Czech copy as-is unless localizing.

---

## ⚠️ Read first — what this is and how to use it

The files here are a **design reference built in HTML + React (via in-browser Babel)**. They are **not production code to ship verbatim.** Your job is to **recreate this app in the target codebase's real environment** (React Native, Swift/SwiftUI, Kotlin/Compose, Flutter, or a production React web app) using that platform's navigation, components, and state management. If no codebase exists yet, choose the right stack and build it there.

Use this package as the source of truth for **layout, visual design, tokens, component behavior, and interaction details**. The included compiled bundle (`design-system/_ds_bundle.js`) is only what makes the HTML prototype run in a browser — don't ship it.

**Fidelity: high.** Colors, type, spacing, radii, shadows, motion, and interactions are all final and specified below.

---

## How to run the prototype
Open **`app/index.html`** in a browser (it loads React, Babel, Leaflet, and Lucide from CDNs, so it needs an internet connection). It renders inside a 390×844 phone frame.
- **`app/index.html`** — the main app: Map, Park, Camera capture, Challenges, Profile, with working bottom-nav navigation.
- **`app/Login.html`** — the login / registration screen (open separately).

The phone bezel/notch in the prototype is **presentation only** — don't rebuild it; use the device's real safe areas.

---

## Information architecture

Bottom navigation, 5 destinations (the center **Kamera** is a raised FAB that opens a modal, not a tab):

| Tab | Czech label | Screen | Purpose |
|---|---|---|---|
| Map | **Mapa** | `MapScreen` | Live map with nearby stops to visit + XP HUD |
| Park | **Park** | `ParkScreen` | The player's vehicle collection ("vozový park") |
| Camera | **Kamera** | `CaptureSheet` (modal) | Photograph a vehicle → scan → reward |
| Challenges | **Výzvy** | `VyzvyScreen` | Daily challenges + achievements |
| Profile | **Profil** | `ProfilScreen` | Player stats, level, streak |
| — | — | `Login.html` | Auth (login/register), entry point |

---

## Screens

### Login / Registrace (`app/Login.html`)
Brand-green hero (app mark + "ŠotoGO" wordmark + tagline) over a light form sheet. **Login ⇄ Registrace** segmented toggle; email + password (with show/hide eye), nickname field in register mode, "Zůstat přihlášen" switch, primary CTA, Apple/Google social buttons, and a footer link that flips modes.
- **Key interaction — collapsing hero on scroll:** hero and form share ONE native scroll container. Scrolling the form slides the logo up off-screen and the form fills the screen; scrolling back brings it back. Implement with a native collapsing-header scroll (iOS large-title collapse, Android CollapsingToolbar, or a scroll view with the hero as the first item). **Do not** JS-animate a sheet's height/top on scroll — that bounces.
- A sticky green wash keeps the status bar legible once the form scrolls up.
- Switching mode smoothly scrolls back to the top.
- In the prototype every CTA navigates to `index.html`; wire to real auth and route to Map on success.

### Mapa (`MapScreen`)
Full-bleed map (Leaflet + Carto Voyager tiles in the proto; use the platform's native map SDK in production). Floating glass HUD on top:
- **XP/level card** (dark glass): level chip, "LEVEL 12 / 2480 / 3000 XP", progress bar.
- **Search bar** (dark glass): "Hledat zastávku nebo linku…".
- **Player location**: pulsing green dot.
- **Stop pins**: teardrop pins colored by transit line (A green, B amber, C red).
- **Locate FAB** (bottom-right).
- **Stop sheet** (bottom): selected stop's lines, name, distance, and either a "Navštíveno" (visited) badge or a "+XP" reward chip.
- **HUD z-order note:** the map must establish its own stacking context (`isolation: isolate`) so map tiles/markers never paint over the HUD; HUD layers sit above it. (This was a real bug — keep it in mind on any platform that layers a native map under overlays.)

### Kamera capture (`CaptureSheet`, modal)
Full-screen dark modal, 3 phases:
1. **Aim** — camera viewfinder with a reticle (4 brand-green corner brackets) and a "Vyfotit" button.
2. **Scan** — animated scan line sweeps the reticle, "Čtu evidenční číslo…" (reading the vehicle's registration number).
3. **Reward** — "Nový objev!" celebration: category icon pops in, vehicle type/number (e.g. "15T #9325"), operator, a big "+100 XP" pill, and a "Přidat do parku" button that adds it to the collection and navigates to Park.

### Park (`ParkScreen`)
The collection grid.
- **Completion bar**: progress toward all vehicles ("Dokončení sbírky", X %).
- **Category filter chips** (horizontal scroll): Vše + each category with a count.
- **Grid/list toggle** (segmented control).
- **VehicleCard** grid: caught vehicles show type/number/operator, a category badge, rarity stars, found date, and a "new" flag; uncaught slots render as **locked** cards (silhouette).
- **Vehicle detail** (bottom sheet on tap): big preview, type/number, category badge, and stat tiles for Vzácnost (rarity) + Nalezeno (found date).

### Výzvy (`VyzvyScreen`)
- **Daily banner** (dark): "Denní výzvy", countdown to refresh, total XP available.
- **ChallengeCard list**: each task has an icon, title, progress (value/max), reward XP, and done state.
- **Achievements grid** (3-up): `AchievementBadge`s with tier (bronze/silver/gold), locked/unlocked, and progress.

### Profil (`ProfilScreen`)
Player identity + stats: avatar, level ring, streak, and stat tiles. (Note: stat tile values are kept single-line and the tile vertically centers its content so a row of tiles stays balanced — see `StatTile`.)

---

## Game model / data
All prototype data lives in `app/_source/data.js.txt` (exposed as `window.SG_DATA`). Shapes to model in your backend:
- **PLAYER**: `name`, `level`, `xpTotal`, `streak`.
- **CATS** (categories): `tram`, `bus`, `metro`, `train`, … each with `label`, `plural`, `color`, `icon`.
- **STOPS**: `name`, `lat`, `lng`, `lines[]`, `dist`, `xp`, `visited`.
- **VEHICLES** (caught): `type`, `number`, `operator`, `cat`, `rarity` (`common`/`rare`/`epic`/`legendary`), `found`, `isNew`. Plus `LOCKED_COUNT` per category for uncaught slots.
- **CHALLENGES**: `title`, `icon`, `cat?`, `value`, `max`, `reward`, `done`.
- **ACHIEVEMENTS**: `title`, `desc`, `icon`, `tier`, `unlocked`, `value`, `max`.
- **XP/leveling**: catching a vehicle grants XP (+100 in the proto); stops grant XP on first visit; daily challenges and achievements grant XP. Level is derived from cumulative XP.

---

## Design tokens
Full source in `design-system/styles.css` → `design-system/tokens/*.css`. Map these onto your platform theme.

### Color (anchor: **ŠotoGO Green #43B02A**, PID/transit heritage)
| Token | Value | Use |
|---|---|---|
| brand / green-500 | `#43B02A` | primary, hero, links, active states |
| green-600 | `#379021` | primary hover |
| green-700 | `#2C731B` | link text, 3D button shadow base |
| green-200 | `#B6E2A4` | "GO" in wordmark on green |
| gold / XP | `#F5A300` | XP, rewards, streak (`gold-300` light, `gold-700` text) |
| surface-night | dark navy | dark HUD/banners/capture bg |
| bg-app | `#F1F5F0` | app canvas |
| surface-card | `#FFFFFF` | cards, inputs |
| surface-sunken | `#F6F8FA` | segmented tracks, page behind frame |
| text-primary / secondary / muted | `#141A21` / `#4D5762` / `#98A3AF` | text hierarchy |
| border subtle / default / strong | `#EDF1F4` / `#DEE4EA` / `#C6CFD8` | hairlines → handles |
| danger | `#E2231A` | errors |
| **Line colors** | A `#00A562` · B `#F7A600` · C `#D9282F` | transit-line identity |
| **Category colors** | per `CATS` (tram/bus/metro/train) | vehicle categories |
| **Rarity colors** | `--rarity-common/rare/epic/legendary` | collection rarity |

### Type
- **Display / headings / wordmark**: **Fredoka** (400–700). *Substitution stand-in — ŠotoGO has no licensed brand face yet.*
- **Body / UI**: **DM Sans** (400–700), full Czech diacritics.
- **Mono / codes / stats / eyebrows**: **JetBrains Mono** (400/500/700) — used for evidenční čísla (vehicle reg numbers), XP counts, labels.
- `.eyebrow` utility = small uppercase mono label.

### Spacing — 4px grid: `4 8 12 16 20 24 32 40 48 64`. Min tap target 44px.
### Radius — `xs 6 · sm 10 · md 14 · lg 20 · xl 28 · 2xl 36 · pill 999`. Sheets use 30px tops.
### Elevation — soft optimistic shadows `sm/md/lg/xl`; **primary buttons use a SOLID (no-blur) 4px offset "3D" base** in their shadow color that collapses on press. Focus ring = `0 0 0 3px` brand @ 45%.

---

## Component library
Source under `design-system/components/` (saved as `.jsx.txt` / `.d.ts.txt` reference + a `.prompt.md` design-rationale doc per component — drop the `.txt` suffix to use them as real `.jsx`/`.d.ts`). 16 components in 3 groups:

**core/** — `Avatar` (with level), `Badge` (tones/variants, mono option), `Button` (variants `primary`/`secondary`/`reward`/`danger`/`ghost`, sizes sm/md/lg, 3D press), `Card`, `IconButton`, `ProgressBar` (value/max, label, valueText), `StatTile` (big tabular number + label + tinted icon; centers content), `Tag` (filter chip: selectable, color, icon, count).

**forms/** — `Input` (label, leading/trailing icon, error/hint, focus ring), `SegmentedControl` (pill track, options with label/icon, fullWidth), `Switch` (pill track, springy thumb, brand-green on).

**game/** — `BottomNav` (5 items, center FAB, badges), `VehicleCard` (collection card: type/number/operator, category badge, rarity, found date, isNew, locked state), `ChallengeCard` (task with progress + reward + done), `AchievementBadge` (tiered medal, locked/unlocked, progress, sizable), `LevelRing` (circular level/XP progress).

Icons throughout are **Lucide**. Apple/Google sign-in glyphs are inline SVG in `Login.html`; use each platform's standard sign-in button styling in production (Apple HIG requires the official button).

---

## Motion
- Buttons (3D): press translates down by the 4px depth + shadow collapses (`transform .12s`).
- Switch thumb: `transform .18s cubic-bezier(.3,1.3,.6,1)`.
- Segmented active pill: ~.15s ease.
- Map player dot: 2s infinite pulse. Capture scan line: 1.5s sweep. Reward: pop-in (`scale .4→1`, .5s).
- All decorative animation is gated behind `prefers-reduced-motion`.

---

## Package contents
```
sotogo_handoff/
├─ README.md                         ← this file
├─ app/                              ← runnable hi-fi prototype
│  ├─ index.html                     ← main app, self-contained (open this)
│  ├─ Login.html                     ← auth screen, self-contained (open separately)
│  └─ _source/                       ← the same screen code, extracted as readable reference
│     ├─ app.js.txt                  ← shell: status bar, nav, screen switch
│     ├─ TopBar.js.txt               ← shared screen header
│     ├─ MapScreen.js.txt / ParkScreen.js.txt / VyzvyScreen.js.txt / ProfilScreen.js.txt
│     ├─ CaptureSheet.js.txt         ← camera capture modal
│     └─ data.js.txt                 ← fake game data (window.SG_DATA)
└─ design-system/
   ├─ styles.css                     ← entry; @imports all tokens
   ├─ tokens/                        ← colors, typography, spacing, radius, shadows, fonts, base
   ├─ assets/app-icon.svg            ← the ŠotoGO app mark
   ├─ _ds_bundle.js                  ← compiled components (runs the prototype only)
   └─ components/{core,forms,game}/  ← per component: *.jsx.txt + *.d.ts.txt + *.prompt.md
```

> **`.txt` suffix convention:** all reference source — the component `.jsx`/`.d.ts` under `design-system/components/` and the screen code under `app/_source/` — is saved with a trailing `.txt` so it reads as reference without being executed or colliding with anything. Drop the `.txt` to use a file as real code. The two HTML files (`app/index.html`, `app/Login.html`) are **self-contained** — they inline the screen code and only load the compiled `_ds_bundle.js` plus CDN libraries, so they run as-is; `app/_source/` is provided purely so you can read each screen in isolation. The per-component `.prompt.md` files capture each component's intended behavior and variants — read them when reimplementing.
