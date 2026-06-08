// Shapes returned by the auth API (see backend/src/routes/auth.ts).
export interface User {
  id: string
  username: string
  email: string
  avatarUrl: string | null
  level: number
  xp: number
}

export interface AuthResponse {
  token: string
  user: User
}
