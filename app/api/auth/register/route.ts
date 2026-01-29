import { NextResponse } from 'next/server'
import { createUser, createSession } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y password requeridos' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const user = await createUser(email, password)
    
    if (!user) {
      return NextResponse.json({ error: 'El email ya esta registrado' }, { status: 400 })
    }

    const token = await createSession(user.id)

    const cookieStore = await cookies()
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    })

    return NextResponse.json({ 
      user: { 
        id: user.id, 
        email: user.email 
      } 
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
