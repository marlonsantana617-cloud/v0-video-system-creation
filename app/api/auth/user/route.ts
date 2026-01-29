import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({ 
      user: { 
        id: user.id, 
        email: user.email,
        role: user.role || 'user'
      } 
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ user: null })
  }
}
