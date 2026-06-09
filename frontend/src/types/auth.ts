// Shapes returned by the auth API (see backend/src/routes/auth.ts).
export interface User {
  id: string
  username: string
  email: string
  avatarUrl: string | null
  level: number
  xp: number
  /** Daily login streak (consecutive days checked in). */
  streak: number
  /** Whether this account has admin/dev tools (e.g. the map teleport). */
  isAdmin?: boolean
}

export interface AuthResponse {
  token: string
  user: User
}
