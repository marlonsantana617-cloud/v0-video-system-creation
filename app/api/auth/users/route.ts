import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query } from '@/lib/db'

interface User {
  id: string
  email: string
  created_at: string
}

// Get all users (for admin panel)
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const users = await query<User>(
      'SELECT id, email, created_at FROM users ORDER BY created_at DESC'
    )

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// Delete a user
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    // Prevent deleting yourself
    if (userId === user.id) {
      return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 })
    }

    // Delete user sessions first
    await query('DELETE FROM sessions WHERE user_id = ?', [userId])
    
    // Delete user settings
    await query('DELETE FROM user_settings WHERE id = ?', [userId])
    
    // Delete user posts
    await query('DELETE FROM posts WHERE user_id = ?', [userId])
    
    // Delete user
    await query('DELETE FROM users WHERE id = ?', [userId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
