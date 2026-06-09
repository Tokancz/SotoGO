// ŠotoGO — Auth store. Owns the session token + current user, and persists the
// token to localStorage ("stay signed in") or sessionStorage (this tab only).
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi } from '@/services/auth'
import { mediaUrl, TOKEN_KEY } from '@/services/api'
import type { User } from '@/types/auth'

function readToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
}

// Resolve the avatar to an absolute URL (uploaded ones come back as "/uploads/…";
// Google/S3 URLs are already absolute and pass through unchanged).
function normalizeUser(u: User): User {
  return { ...u, avatarUrl: mediaUrl(u.avatarUrl) ?? null }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(readToken())
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => Boolean(token.value))

  function persist(newToken: string, remember: boolean) {
    // Only one storage holds the token at a time.
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    ;(remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, newToken)
    token.value = newToken
  }

  async function login(email: string, password: string, remember = true) {
    const res = await authApi.login({ email, password })
    persist(res.token, remember)
    user.value = normalizeUser(res.user)
  }

  async function register(username: string, email: string, password: string, remember = true) {
    const res = await authApi.register({ username, email, password })
    persist(res.token, remember)
    user.value = normalizeUser(res.user)
  }

  async function loginWithGoogle(credential: string, remember = true) {
    const res = await authApi.google(credential)
    persist(res.token, remember)
    user.value = normalizeUser(res.user)
  }

  /** Replace the current user (e.g. after the server awards XP or a new avatar). */
  function setUser(u: User) {
    user.value = normalizeUser(u)
  }

  /** Upload a new profile picture and update the current user. */
  async function updateAvatar(photo: Blob) {
    setUser(await authApi.uploadAvatar(photo))
  }

  /** Re-hydrate the user from a persisted token (called by the router guard). */
  async function fetchMe() {
    if (!token.value) return
    try {
      user.value = normalizeUser(await authApi.me())
    } catch {
      logout()
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
  }

  return { token, user, isAuthenticated, login, register, loginWithGoogle, setUser, updateAvatar, fetchMe, logout }
})
