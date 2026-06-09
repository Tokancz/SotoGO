// Live device location via the browser Geolocation API. watchPosition keeps the
// player dot following the user; callers read `coords` reactively. Geolocation
// needs a secure context — works on https and on http://localhost (dev).
import { onUnmounted, ref } from 'vue'

export interface GeoCoords {
  lat: number
  lng: number
  /** Accuracy radius in meters. */
  accuracy: number
}

export function useGeolocation() {
  const coords = ref<GeoCoords | null>(null)
  const error = ref<string | null>(null)
  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator
  // When a mock location is active (admin dev tool), the real GPS watch is paused
  // and `coords` is driven manually so the player can be teleported on the map.
  const mocked = ref(false)
  let watchId: number | null = null

  function start() {
    if (!supported) {
      error.value = 'Geolokace není v tomto prohlížeči podporována.'
      return
    }
    if (watchId != null) return // already watching — don't stack watchers
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (mocked.value) return // ignore real GPS while teleported
        coords.value = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }
        error.value = null
      },
      (err) => {
        error.value =
          err.code === err.PERMISSION_DENIED
            ? 'Přístup k poloze byl zamítnut.'
            : 'Polohu se nepodařilo zjistit.'
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    )
  }

  function stop() {
    if (watchId != null) {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
    }
  }

  /** Teleport the player to a fixed point (admin dev tool). Pauses real GPS. */
  function setMock(loc: { lat: number; lng: number }) {
    mocked.value = true
    error.value = null
    coords.value = { lat: loc.lat, lng: loc.lng, accuracy: 5 }
  }

  /** Drop the mock and resume real GPS. */
  function clearMock() {
    if (!mocked.value) return
    mocked.value = false
    if (watchId == null) start()
  }

  onUnmounted(stop)

  return { coords, error, supported, mocked, start, stop, setMock, clearMock }
}
