import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y password requeridos' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin`,
        data: {
          role: 'user'
        }
      }
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      user: { 
        id: data.user?.id, 
        email: data.user?.email,
        role: 'user'
      },
      message: 'Registro exitoso. Revisa tu email para confirmar tu cuenta.'
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
