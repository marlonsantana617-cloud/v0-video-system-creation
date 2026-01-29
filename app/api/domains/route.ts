import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - List user domains
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: domains, error } = await supabase
      .from('user_domains')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ domains })
  } catch (error) {
    console.error('Get domains error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST - Add new domain
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { domain } = await request.json()

    if (!domain) {
      return NextResponse.json({ error: 'Dominio requerido' }, { status: 400 })
    }

    // Validate domain format
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
    const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '')
    
    if (!domainRegex.test(cleanDomain)) {
      return NextResponse.json({ error: 'Formato de dominio invalido' }, { status: 400 })
    }

    // Check if domain already exists
    const { data: existing } = await supabase
      .from('user_domains')
      .select('id')
      .eq('domain', cleanDomain)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Este dominio ya esta registrado' }, { status: 400 })
    }

    // Insert domain
    const { data: newDomain, error } = await supabase
      .from('user_domains')
      .insert({
        user_id: user.id,
        domain: cleanDomain,
        status: 'active'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, domain: newDomain })
  } catch (error) {
    console.error('Add domain error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// DELETE - Remove domain
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const domainId = searchParams.get('id')

    if (!domainId) {
      return NextResponse.json({ error: 'ID de dominio requerido' }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_domains')
      .delete()
      .eq('id', domainId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete domain error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
