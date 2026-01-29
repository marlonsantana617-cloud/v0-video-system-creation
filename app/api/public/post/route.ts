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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('id')

    if (!postId) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    // Get post
    const post = await queryOne<Post>(
      'SELECT * FROM posts WHERE id = $1',
      [postId]
    )

    if (!post) {
      return NextResponse.json({ error: 'Post no encontrado' }, { status: 404 })
    }

    // Get user settings
    const settings = await queryOne<UserSettings>(
      'SELECT * FROM user_settings WHERE id = $1',
      [post.user_id]
    )

    // Get other posts from same user (for random redirect at end)
    const otherPosts = await query<{ id: number }>(
      'SELECT id FROM posts WHERE user_id = $1 AND id != $2',
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
      otherPosts: otherPosts.map(p => p.id)
    })
  } catch (error) {
    console.error('Get public post error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
