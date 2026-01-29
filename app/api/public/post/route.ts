import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('id')
    
    // Obtener el dominio desde el header Host
    const host = request.headers.get('host') || ''
    const domain = host.replace(/^www\./, '').split(':')[0]

    if (!postId) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const supabase = await createClient()

    // Buscar el dominio en la base de datos
    const { data: userDomain } = await supabase
      .from('user_domains')
      .select('*')
      .eq('domain', domain)
      .eq('status', 'active')
      .single()

    let userId: string | null = userDomain?.user_id || null

    // Get post
    let post = null

    if (userId) {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .eq('user_id', userId)
        .single()
      post = data
    } else {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single()
      post = data
    }

    if (!post) {
      return NextResponse.json({ error: 'Post no encontrado' }, { status: 404 })
    }

    // Get user settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('id', post.user_id)
      .single()

    // Get other posts from same user
    const { data: otherPosts } = await supabase
      .from('posts')
      .select('id')
      .eq('user_id', post.user_id)
      .neq('id', postId)

    return NextResponse.json({
      post: {
        id: post.id,
        title: post.title,
        videoUrl: post.video_url,
        thumbnailUrl: post.thumbnail_url,
        isHLS: post.is_hls,
        userId: post.user_id
      },
      settings: settings ? {
        floatingButtons: settings.floating_buttons || [],
        redirect: settings.redirect || {},
        counter: settings.counter || {},
        scripts: settings.scripts || []
      } : {
        floatingButtons: [],
        redirect: {},
        counter: {},
        scripts: []
      },
      otherPosts: otherPosts?.map(p => p.id) || [],
      domain: userDomain?.domain || null
    })
  } catch (error) {
    console.error('Get public post error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
