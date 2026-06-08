// Axios instance shared by all API modules. Attaches the JWT (from whichever
// storage the user's "stay signed in" choice landed it in) to every request.
import axios from 'axios'

export const TOKEN_KEY = 'sotogo_token'

// `||` (not `??`) so an empty string from an unset CI variable also falls back,
// instead of becoming a relative URL against the page origin.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_URL,
})

// Origin the backend serves uploaded media from (API base minus the /api path).
const apiOrigin = API_URL.replace(/\/api\/?$/, '')

/** Resolve a server media path (e.g. "/uploads/x.jpg") to an absolute URL. */
export function mediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  return /^https?:\/\//.test(path) ? path : `${apiOrigin}${path}`
}

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`
  }
  return cfg
})

export default api
