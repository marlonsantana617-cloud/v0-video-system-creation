import { NextRequest, NextResponse } from "next/server"
import { queryOne } from "@/lib/db"

interface Post {
  title: string
  video_url: string
  thumbnail_url: string
}

// Generate a thumbnail placeholder image with video title
// This creates an Open Graph compatible image
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const postId = searchParams.get("p")

  if (!postId) {
    return new NextResponse("Missing post ID", { status: 400 })
  }

  const post = await queryOne<Post>(
    "SELECT title, video_url, thumbnail_url FROM posts WHERE id = ?",
    [parseInt(postId)]
  )

  if (!post) {
    return new NextResponse("Post not found", { status: 404 })
  }

  // If there's a custom thumbnail, redirect to it
  if (post.thumbnail_url) {
    return NextResponse.redirect(post.thumbnail_url)
  }

  // Generate SVG thumbnail with title
  const title = post.title || "Video"
  const truncatedTitle = title.length > 50 ? title.substring(0, 47) + "..." : title

  const svg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)"/>
      
      <!-- Play button circle -->
      <circle cx="600" cy="280" r="80" fill="rgba(255,255,255,0.95)" />
      <polygon points="580,240 580,320 640,280" fill="#1a1a2e" />
      
      <!-- Title -->
      <text x="600" y="450" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">
        ${escapeXml(truncatedTitle)}
      </text>
      
      <!-- Subtitle -->
      <text x="600" y="510" font-family="Arial, sans-serif" font-size="28" fill="rgba(255,255,255,0.7)" text-anchor="middle">
        Haz clic para reproducir
      </text>
    </svg>
  `

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}
