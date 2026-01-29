import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { newPassword } = await request.json()

    if (!newPassword) {
      return NextResponse.json({ error: 'Nueva contrasena requerida' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'La nueva contrasena debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
