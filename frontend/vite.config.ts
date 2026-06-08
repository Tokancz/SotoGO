import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  // On GitHub Pages the app is served from /<repo>/, so the CI build sets
  // VITE_BASE=/SotoGO/. Local dev/build default to root.
  base: process.env.VITE_BASE ?? '/',
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
