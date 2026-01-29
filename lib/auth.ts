import bcrypt from 'bcryptjs'
import { query, queryOne } from './db'
import { cookies } from 'next/headers'
import type { ResultSetHeader } from 'mysql2'

interface User {
  id: string
  email: string
  password_hash: string
  created_at: string
  updated_at: string
}

interface Session {
  id: string
  user_id: string
  token: string
  expires_at: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(): string {
  return crypto.randomUUID() + '-' + crypto.randomUUID()
}

export async function createUser(email: string, password: string): Promise<User | null> {
  const passwordHash = await hashPassword(password)
  const userId = crypto.randomUUID()
  
  try {
    await query(
      `INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)`,
      [userId, email.toLowerCase(), passwordHash]
    )
    
    const user = await queryOne<User>(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    )
    
    if (user) {
      // Create default settings for the user
      await query(
        `INSERT INTO user_settings (id, floating_buttons, redirect, counter, scripts) 
         VALUES (?, '[]', '{}', '{}', '[]')`,
        [user.id]
      )
    }
    
    return user
  } catch {
    return null
  }
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return queryOne<User>(
    'SELECT * FROM users WHERE email = ?',
    [email.toLowerCase()]
  )
}

export async function findUserById(id: string): Promise<User | null> {
  return queryOne<User>(
    'SELECT * FROM users WHERE id = ?',
    [id]
  )
}

export async function createSession(userId: string): Promise<string> {
  const token = generateToken()
  const sessionId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  
  await query(
    `INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)`,
    [sessionId, userId, token, expiresAt.toISOString().slice(0, 19).replace('T', ' ')]
  )
  
  return token
}

export async function getSessionByToken(token: string): Promise<Session | null> {
  const session = await queryOne<Session>(
    'SELECT * FROM sessions WHERE token = ? AND expires_at > NOW()',
    [token]
  )
  return session
}

export async function deleteSession(token: string): Promise<void> {
  await query('DELETE FROM sessions WHERE token = ?', [token])
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  
  if (!token) return null
  
  const session = await getSessionByToken(token)
  if (!session) return null
  
  return findUserById(session.user_id)
}

export async function login(email: string, password: string): Promise<{ user: User; token: string } | null> {
  const user = await findUserByEmail(email)
  if (!user) return null
  
  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) return null
  
  const token = await createSession(user.id)
  return { user, token }
}

export async function logout(token: string): Promise<void> {
  await deleteSession(token)
}
