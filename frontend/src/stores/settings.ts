import { defineStore } from 'pinia'

// Local-only preferences (sound / haptics). Persisted to localStorage so they
// survive reloads without needing a backend round-trip.
const KEY = 'sotogo:settings'

interface Persisted {
  sound?: boolean
  haptics?: boolean
  music?: boolean
}

function load(): Persisted {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Persisted
  } catch {
    return {}
  }
}

export const useSettingsStore = defineStore('settings', {
  state: () => {
    const saved = load()
    return {
      // SFX + haptics default on (the game feel relies on them). Background music
      // defaults OFF — looping audio is more intrusive, so it's opt-in.
      sound: saved.sound ?? true,
      haptics: saved.haptics ?? true,
      music: saved.music ?? false,
    }
  },
  actions: {
    persist() {
      try {
        localStorage.setItem(
          KEY,
          JSON.stringify({ sound: this.sound, haptics: this.haptics, music: this.music }),
        )
      } catch {
        /* private mode / quota — preferences just won't persist */
      }
    },
    setSound(v: boolean) {
      this.sound = v
      this.persist()
    },
    setHaptics(v: boolean) {
      this.haptics = v
      this.persist()
    },
    setMusic(v: boolean) {
      this.music = v
      this.persist()
    },
  },
})
