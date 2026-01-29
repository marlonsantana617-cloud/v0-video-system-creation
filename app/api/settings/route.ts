import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

interface UserSettings {
  id: string
  floating_buttons: string
  redirect: string
  counter: string
  scripts: string
}

// Get settings for current user
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const settings = await queryOne<UserSettings>(
      'SELECT * FROM user_settings WHERE id = ?',
      [user.id]
    )

    if (!settings) {
      // Create default settings
      await query(
        `INSERT INTO user_settings (id, floating_buttons, redirect, counter, scripts) 
         VALUES (?, '[]', '{}', '{}', '[]')`,
        [user.id]
      )
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
        floatingButtons: JSON.parse(settings.floating_buttons || '[]'),
        redirect: JSON.parse(settings.redirect || '{}'),
        counter: JSON.parse(settings.counter || '{}'),
        scripts: JSON.parse(settings.scripts || '[]')
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
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { floatingButtons, redirect, counter, scripts } = await request.json()

    await query(
      `UPDATE user_settings 
       SET floating_buttons = ?, redirect = ?, counter = ?, scripts = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        JSON.stringify(floatingButtons || []),
        JSON.stringify(redirect || {}),
        JSON.stringify(counter || {}),
        JSON.stringify(scripts || []),
        user.id
      ]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
