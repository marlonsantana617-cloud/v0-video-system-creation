import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ user: null })
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    return NextResponse.json({ 
      user: { 
        id: user.id, 
        email: user.email,
        role: profile?.role || 'user'
      } 
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ user: null })
  }
}
