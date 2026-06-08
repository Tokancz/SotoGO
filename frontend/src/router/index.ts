// ŠotoGO — Router
// /login is a standalone public screen. Everything else lives under AppLayout
// (bottom nav + screens) and requires a session. The center "Kamera" action is
// NOT a route — it opens the capture modal (handled in AppLayout).

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/layout/AppLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true, title: 'Přihlášení' },
    },
    {
      path: '/',
      component: AppLayout,
      children: [
        { path: '', redirect: '/mapa' },
        {
          path: 'mapa',
          name: 'mapa',
          component: () => import('@/views/MapView.vue'),
          meta: { title: 'Mapa' },
        },
        {
          path: 'park',
          name: 'park',
          component: () => import('@/views/ParkView.vue'),
          meta: { title: 'Vozový park' },
        },
        {
          path: 'vyzvy',
          name: 'vyzvy',
          component: () => import('@/views/VyzvyView.vue'),
          meta: { title: 'Výzvy' },
        },
        {
          path: 'profil',
          name: 'profil',
          component: () => import('@/views/ProfilView.vue'),
          meta: { title: 'Profil' },
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/mapa' },
  ],
})

// Auth guard: bounce unauthenticated users to /login, and authenticated users
// away from /login. Hydrate the user once if we have a token but no profile yet.
router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (auth.isAuthenticated && !auth.user) {
    await auth.fetchMe()
  }

  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'login', query: to.fullPath === '/' ? {} : { redirect: to.fullPath } }
  }

  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'mapa' }
  }
})

export default router
