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
  let watchId: number | null = null

  function start() {
    if (!supported) {
      error.value = 'Geolokace není v tomto prohlížeči podporována.'
      return
    }
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
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

  onUnmounted(stop)

  return { coords, error, supported, start, stop }
}
