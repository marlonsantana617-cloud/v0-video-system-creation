import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 })
  }

  try {
    // Fetch video with range request for just the first part
    const response = await fetch(url, {
      headers: {
        Range: "bytes=0-5000000", // First ~5MB for thumbnail capture
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch video" }, { status: 500 })
    }

    const contentType = response.headers.get("content-type") || "video/mp4"
    const buffer = await response.arrayBuffer()

    // Return video with CORS headers
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error) {
    console.error("Video proxy error:", error)
    return NextResponse.json({ error: "Proxy failed" }, { status: 500 })
  }
}
