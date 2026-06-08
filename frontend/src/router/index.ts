// ŠotoGO — Router
// The four bottom-nav destinations. The center "Kamera" action is NOT a route —
// it opens the capture modal (handled in AppLayout). Login/auth routing will be
// added with the backend (see docs/BACKEND.md).

import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/mapa' },
    {
      path: '/mapa',
      name: 'mapa',
      component: () => import('@/views/MapView.vue'),
      meta: { title: 'Mapa' },
    },
    {
      path: '/park',
      name: 'park',
      component: () => import('@/views/ParkView.vue'),
      meta: { title: 'Vozový park' },
    },
    {
      path: '/vyzvy',
      name: 'vyzvy',
      component: () => import('@/views/VyzvyView.vue'),
      meta: { title: 'Výzvy' },
    },
    {
      path: '/profil',
      name: 'profil',
      component: () => import('@/views/ProfilView.vue'),
      meta: { title: 'Profil' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/mapa' },
  ],
})

export default router
