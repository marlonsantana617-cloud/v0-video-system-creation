import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

interface Post {
  id: number
  user_id: string
  title: string
  video_url: string
  thumbnail_url: string
  is_hls: boolean
}

interface UserSettings {
  floating_buttons: string
  redirect: string
  counter: string
  scripts: string
}

interface UserDomain {
  id: number
  user_id: string
  domain: string
  status: string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('id')
    
    // Obtener el dominio desde el header Host
    const host = request.headers.get('host') || ''
    const domain = host.replace(/^www\./, '').split(':')[0] // Quitar www. y puerto

    if (!postId) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    // Buscar el dominio en la base de datos para obtener el user_id
    const userDomain = await queryOne<UserDomain>(
      'SELECT * FROM user_domains WHERE domain = ? AND status = ?',
      [domain, 'active']
    )

    let userId: string | null = null

    if (userDomain) {
      // Si encontramos el dominio, usamos el user_id del dominio
      userId = userDomain.user_id
    }

    // Get post
    let post: Post | null = null

    if (userId) {
      // Buscar el post que pertenece al usuario del dominio
      post = await queryOne<Post>(
        'SELECT * FROM posts WHERE id = ? AND user_id = ?',
        [postId, userId]
      )
    } else {
      // Si no hay dominio registrado, buscar el post sin filtrar por usuario
      // (para desarrollo local o dominio principal)
      post = await queryOne<Post>(
        'SELECT * FROM posts WHERE id = ?',
        [postId]
      )
    }

    if (!post) {
      return NextResponse.json({ error: 'Post no encontrado' }, { status: 404 })
    }

    // Get user settings
    const settings = await queryOne<UserSettings>(
      'SELECT * FROM user_settings WHERE id = ?',
      [post.user_id]
    )

    // Get other posts from same user (for random redirect at end)
    const otherPosts = await query<{ id: number }>(
      'SELECT id FROM posts WHERE user_id = ? AND id != ?',
      [post.user_id, postId]
    )

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
        floatingButtons: JSON.parse(settings.floating_buttons || '[]'),
        redirect: JSON.parse(settings.redirect || '{}'),
        counter: JSON.parse(settings.counter || '{}'),
        scripts: JSON.parse(settings.scripts || '[]')
      } : {
        floatingButtons: [],
        redirect: {},
        counter: {},
        scripts: []
      },
      otherPosts: otherPosts.map(p => p.id),
      domain: userDomain ? userDomain.domain : null
    })
  } catch (error) {
    console.error('Get public post error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
