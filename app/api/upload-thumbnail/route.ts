import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { imageData, postId } = await request.json()

    if (!imageData || !postId) {
      return NextResponse.json({ error: 'Missing imageData or postId' }, { status: 400 })
    }

    // Convert base64 to buffer
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Upload to Vercel Blob
    const blob = await put(`thumbnails/post-${postId}-${Date.now()}.jpg`, buffer, {
      access: 'public',
      contentType: 'image/jpeg',
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error('Upload thumbnail error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
