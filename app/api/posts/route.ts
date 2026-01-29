import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Get all posts for current user
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('id', { ascending: false })

    if (error) throw error

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Get posts error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// Create new post
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { title, videoUrl, thumbnailUrl, isHLS } = await request.json()

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        title: title || '',
        video_url: videoUrl || '',
        thumbnail_url: thumbnailUrl || '',
        is_hls: isHLS || false
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Create post error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// Update posts
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { posts } = await request.json()

    for (const post of posts) {
      const { error } = await supabase
        .from('posts')
        .update({
          title: post.title,
          video_url: post.videoUrl,
          thumbnail_url: post.thumbnailUrl || '',
          is_hls: post.isHLS || false,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id)
        .eq('user_id', user.id)

      if (error) throw error
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('id')

    if (!postId) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete post error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
