import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Get settings for current user
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    if (!settings) {
      // Create default settings
      const { data: newSettings, error: insertError } = await supabase
        .from('user_settings')
        .insert({
          id: user.id,
          floating_buttons: [],
          redirect: {},
          counter: {},
          scripts: []
        })
        .select()
        .single()

      if (insertError) throw insertError

      return NextResponse.json({ 
        settings: {
          floatingButtons: [],
          redirect: {},
          counter: {},
          scripts: []
        }
      })
    }

    return NextResponse.json({ 
      settings: {
        floatingButtons: settings.floating_buttons || [],
        redirect: settings.redirect || {},
        counter: settings.counter || {},
        scripts: settings.scripts || []
      }
    })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// Update settings
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { floatingButtons, redirect, counter, scripts } = await request.json()

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        id: user.id,
        floating_buttons: floatingButtons || [],
        redirect: redirect || {},
        counter: counter || {},
        scripts: scripts || [],
        updated_at: new Date().toISOString()
      })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
