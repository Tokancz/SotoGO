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

  /** Upload/replace the profile picture; returns the updated user. */
  uploadAvatar: (photo: Blob) => {
    const form = new FormData()
    form.append('photo', photo, 'avatar.jpg')
    return api.post<{ user: User }>('/me/avatar', form).then((r) => r.data.user)
  },
}
