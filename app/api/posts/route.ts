import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

interface Post {
  id: number
  user_id: string
  title: string
  video_url: string
  thumbnail_url: string
  is_hls: boolean
  created_at: string
  updated_at: string
}

// Get all posts for current user
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const posts = await query<Post>(
      'SELECT * FROM posts WHERE user_id = $1 ORDER BY id DESC',
      [user.id]
    )

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Get posts error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// Create new post
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { title, videoUrl, thumbnailUrl, isHLS } = await request.json()

    const post = await queryOne<Post>(
      `INSERT INTO posts (user_id, title, video_url, thumbnail_url, is_hls) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user.id, title || '', videoUrl || '', thumbnailUrl || '', isHLS || false]
    )

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Create post error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// Update posts
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { posts } = await request.json()

    for (const post of posts) {
      await query(
        `UPDATE posts SET title = $1, video_url = $2, thumbnail_url = $3, is_hls = $4, updated_at = NOW()
         WHERE id = $5 AND user_id = $6`,
        [post.title, post.videoUrl, post.thumbnailUrl || '', post.isHLS, post.id, user.id]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update posts error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// Delete post
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('id')

    if (!postId) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    await query(
      'DELETE FROM posts WHERE id = $1 AND user_id = $2',
      [postId, user.id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete post error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
