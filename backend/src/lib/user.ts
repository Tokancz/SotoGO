// Shared user row shape + the client-safe projection (never leaks the hash).
export interface UserRow {
  id: string
  username: string
  email: string
  password_hash: string | null
  google_id: string | null
  avatar_url: string | null
  level: number
  xp: number
  created_at: string
}

export function publicUser(u: UserRow) {
  return {
    id: String(u.id),
    username: u.username,
    email: u.email,
    avatarUrl: u.avatar_url,
    level: u.level,
    xp: u.xp,
  }
}
