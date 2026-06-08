# Struktura složek

Repozitář používá oddělené složky `frontend/` a `backend/` jako sourozence, plus designovou referenci jasně označenou jako nešiplný materiál.

## Aktuální stav

```
SotoGO/                        ← kořen repozitáře
├─ README.md
├─ docs/                       ← tato dokumentace
├─ frontend/                   ← Vue 3 aplikace (zatím výchozí Vite scaffold)
└─ design/                     ← designová reference (prototyp + design systém)
```

> ✅ Přejmenování `SotoGO/` → `frontend/` a `sotogo_handoff/` → `design/` už proběhlo.
> ⏳ Složka `backend/` zatím **neexistuje** — vznikne při zahájení API.

---

## Cílové uspořádání

```
SotoGO/                        ← kořen repozitáře
├─ README.md
├─ docs/                       ← tato dokumentace
│  ├─ ARCHITECTURE.md
│  ├─ GAME-DESIGN.md
│  ├─ DATA-MODEL.md
│  ├─ FRONTEND.md
│  ├─ BACKEND.md
│  ├─ FOLDER-STRUCTURE.md
│  └─ ROADMAP.md
│
├─ frontend/                   ← Vue 3 aplikace
│  ├─ index.html
│  ├─ package.json
│  ├─ vite.config.ts
│  ├─ public/
│  └─ src/                     ← uspořádání detailně v docs/FRONTEND.md
│     ├─ router/  stores/  services/  views/
│     ├─ components/{core,forms,game}/
│     ├─ composables/  types/  styles/  assets/
│     ├─ App.vue
│     └─ main.ts
│
├─ backend/                    ← nové — Node/Express API (viz docs/BACKEND.md)
│  ├─ package.json
│  ├─ .env.example
│  └─ src/
│     ├─ routes/  controllers/  services/  middleware/
│     ├─ db/  ocr/  types/
│     └─ index.ts
│
└─ design/                     ← designový zdroj pravdy, NENASAZUJE se
   ├─ README.md
   ├─ app/                     (prototyp)
   └─ design-system/           (tokeny + komponenty)
```

**Proč tato podoba**

- `frontend/` + `backend/` jako sourozenci jsou nejsrozumitelnější uspořádání — bez monorepo nástrojů.
- `design/` zachovává referenci, ale její název + README dávají najevo, že se nenasazuje.
- `docs/` drží sdílenou dokumentaci nezávislou na stacku.

---

## Alternativa: monorepo s workspaces

Vyplatí se jen tehdy, když budeš chtít **sdílet TypeScript typy mezi frontendem a backendem** (herní model je přirozený kandidát) přes sdílený balíček a npm/pnpm workspaces:

```
SotoGO/
├─ package.json                # workspaces: ["apps/*", "packages/*"]
├─ docs/
├─ apps/
│  ├─ web/                     # Vue frontend
│  └─ api/                     # Express backend
├─ packages/
│  └─ shared/                  # sdílené TS typy (PLAYER, VEHICLE, STOP, …)
└─ design/                     # designová reference
```

Kompromis: čistší sdílení typů a jedna instalace, za cenu nastavení workspaces. Pro sólo/raný projekt je jednoduché uspořádání `frontend/` + `backend/` lepší výchozí volba; na workspaces přejdi později, pokud začne vadit duplikace typů.

---

## Zbývající úklid

1. Vytvořit `backend/` při zahájení API.
2. Přidat kořenový `.gitignore` (node_modules, dist, .env, .DS_Store — **`.DS_Store` je momentálně commitovaný**).
3. Nahradit ve frontendu `README.md` z výchozí šablony app-specifickým, nebo ho smazat (kořenový README + docs projekt pokrývají).
4. Sjednotit casing názvu repozitáře (`sotogo` vs `SotoGO`).
