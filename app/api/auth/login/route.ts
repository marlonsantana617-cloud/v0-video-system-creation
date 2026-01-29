import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y password requeridos' }, { status: 400 })
    }

    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    return NextResponse.json({ 
      user: { 
        id: data.user.id, 
        email: data.user.email,
        role: profile?.role || 'user'
      } 
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
