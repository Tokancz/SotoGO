import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@/styles/main.scss'
import App from './App.vue'
import router from '@/router'

createApp(App).use(createPinia()).use(router).mount('#app')

// Fade out the inline boot splash (index.html) once the first route has resolved
// — keeps the branded screen up through the initial async-component load instead
// of flashing an empty page, then crossfades into the app.
function dismissBootSplash() {
  const splash = document.getElementById('boot-splash')
  if (!splash) return
  // Two frames so the app's first paint lands behind the splash before it fades.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      splash.classList.add('is-hidden')
      const remove = () => splash.remove()
      splash.addEventListener('transitionend', remove, { once: true })
      setTimeout(remove, 700) // fallback if transitionend never fires
    }),
  )
}

// Whichever comes first: the router being ready, or a safety timeout (so a slow
// chunk or guard can never strand the user on the splash).
router.isReady().then(dismissBootSplash)
setTimeout(dismissBootSplash, 4000)
