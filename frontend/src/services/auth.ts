// Auth API calls. Thin wrappers that unwrap the response data.
import api from './api'
import type { AuthResponse, User } from '@/types/auth'

export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  google: (credential: string) =>
    api.post<AuthResponse>('/auth/google', { credential }).then((r) => r.data),

  me: () => api.get<{ user: User }>('/auth/me').then((r) => r.data.user),
}
