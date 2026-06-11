# ŠotoGO — Frontend

Mobile-first **Vue 3 + TypeScript + Vite** SPA, instalovatelná jako PWA. Hlavní herní klient pro ŠotoGO (mapa, kamera/rozpoznávání, vozový park, výzvy, gymy, žebříček, profil).

## Vývoj

```bash
npm install
npm run dev      # vývojový server Vite (http://localhost:5173)
npm run build    # vue-tsc -b && vite build (typová kontrola + produkční build)
npm run preview  # náhled produkčního buildu
```

## Konfigurace

Vytvoř `.env.local` (viz `.env.example`):

- `VITE_API_URL` — base URL backendu + `/api` (např. `http://localhost:3000/api`)
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth client id (pro „Přihlásit přes Google")

## Dokumentace

- Stack, navigace, obrazovky a uspořádání `src/` → [../docs/FRONTEND.md](../docs/FRONTEND.md)
- Design systém (tokeny, komponenty, animace) → [../design/README.md](../design/README.md)
- Nasazení (GitHub Pages) → [../docs/DEPLOY.md](../docs/DEPLOY.md)
