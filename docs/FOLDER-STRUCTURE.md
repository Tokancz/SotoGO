# Struktura složek

Repozitář používá oddělené složky `frontend/` a `backend/` jako sourozence, plus designovou referenci jasně označenou jako materiál, který se nenasazuje.

```
SotoGO/                        ← kořen repozitáře
├─ README.md
├─ .github/workflows/          ← deploy-frontend.yml (Pages), deploy-backend.yml (Fly.io)
├─ docs/                       ← tato dokumentace
│  ├─ ARCHITECTURE.md
│  ├─ GAME-DESIGN.md
│  ├─ DATA-MODEL.md
│  ├─ FRONTEND.md
│  ├─ BACKEND.md
│  ├─ FOLDER-STRUCTURE.md
│  ├─ DEPLOY.md
│  └─ ROADMAP.md
│
├─ frontend/                   ← Vue 3 aplikace (PWA)
│  ├─ index.html · package.json · vite.config.ts
│  ├─ public/                  ← site.webmanifest, ikony, og-image
│  └─ src/                     ← uspořádání detailně v docs/FRONTEND.md
│     ├─ router/  stores/  services/  views/
│     ├─ components/{ui,game,layout}/  + SgIcon.vue
│     ├─ composables/  lib/  data/  types/  styles/  assets/
│     ├─ App.vue
│     └─ main.ts
│
├─ backend/                    ← Node/Express API (viz docs/BACKEND.md)
│  ├─ package.json · tsconfig.json
│  ├─ Dockerfile · fly.toml    ← nasazení na Fly.io (sotogo-api)
│  ├─ uploads/                 ← lokální fallback úložiště fotek (dev)
│  └─ src/
│     ├─ index.ts · config.ts
│     ├─ routes/  services/  lib/  middleware/
│     ├─ db/  data/  util/
│
└─ design/                     ← designový zdroj pravdy, NENASAZUJE se
   ├─ README.md
   ├─ app/                     (prototyp)
   └─ design-system/           (tokeny + komponenty)
```

**Proč tato podoba**

- `frontend/` + `backend/` jako sourozenci jsou nejsrozumitelnější uspořádání bez monorepo nástrojů.
- `design/` zachovává referenci, ale její název + README dávají najevo, že se nenasazuje.
- `docs/` drží sdílenou dokumentaci nezávislou na stacku.

---

## Alternativa: monorepo s workspaces

Vyplatí se, až bude chtít **sdílet TypeScript typy mezi frontendem a backendem** (herní model je přirozený kandidát) přes sdílený balíček a npm/pnpm workspaces. Dnes jsou typy v každé části zvlášť; na workspaces se přejde, pokud začne vadit duplikace.

```
SotoGO/
├─ package.json                # workspaces: ["apps/*", "packages/*"]
├─ apps/{web,api}/
├─ packages/shared/            # sdílené TS typy
└─ design/
```

---

## Drobnosti

- Kořenový `.gitignore` (node_modules, dist, .env, .DS_Store) — držet aktuální.
- Frontend `package.json` skripty: `dev` / `build` (`vue-tsc -b && vite build`) / `preview`.
