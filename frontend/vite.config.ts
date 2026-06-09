import { execSync } from 'node:child_process'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Build stamp shown on the profile, so it's obvious which build is live (i.e.
// whether a given feature is already deployed). The commit short-SHA is the
// useful part; falls back to "dev" outside a git checkout.
const commit = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'dev'
  }
})()
const buildDate = new Date().toISOString().slice(0, 10)

// https://vite.dev/config/
export default defineConfig({
  // On GitHub Pages the app is served from /<repo>/, so the CI build sets
  // VITE_BASE=/SotoGO/. Local dev/build default to root.
  base: process.env.VITE_BASE ?? '/',
  define: {
    __APP_COMMIT__: JSON.stringify(commit),
    __BUILD_DATE__: JSON.stringify(buildDate),
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})

// NOTE on SCSS: mixins/functions live in src/styles/_abstracts.scss and are
// pulled in explicitly where needed via `@use '@/styles/abstracts' as *;`.
// We deliberately do NOT inject them through css.preprocessorOptions
// additionalData — that would re-import the abstracts barrel into the abstracts
// partials themselves (circular) and into every token file.
