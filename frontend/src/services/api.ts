// Axios instance shared by all API modules. Attaches the JWT (from whichever
// storage the user's "stay signed in" choice landed it in) to every request.
import axios from 'axios'

export const TOKEN_KEY = 'sotogo_token'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
})

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`
  }
  return cfg
})

export default api
