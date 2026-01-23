import { Suspense } from "react"
import { Metadata } from "next"
import { createClient } from "@supabase/supabase-js"
import { VideoPage } from "@/components/video/video-page"

// Create a Supabase client for server-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Props = {
  searchParams: Promise<{ p?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams
  const postId = params.p

  if (!postId) {
    return {
      title: "Video Player",
      description: "Watch videos online",
    }
  }

  // Fetch post data
  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("id", parseInt(postId))
    .single()

  if (!post) {
    return {
      title: "Video no encontrado",
      description: "El video solicitado no existe",
    }
  }

  const title = post.title || "Video"
  const videoUrl = post.video_url
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://v0-video-system-creation.vercel.app"
  const pageUrl = `${siteUrl}/?p=${postId}`
  
  // Use custom thumbnail or auto-generated thumbnail API
  const thumbnailUrl = post.thumbnail_url || `${siteUrl}/api/thumbnail?p=${postId}`

  return {
    title,
    description: `Mira el video: ${title}`,
    openGraph: {
      title,
      description: `Mira el video: ${title}`,
      url: pageUrl,
      siteName: "Video Player",
      type: "video.other",
      images: [
        {
          url: thumbnailUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      videos: [
        {
          url: videoUrl,
          secureUrl: videoUrl,
          type: "video/mp4",
          width: 1280,
          height: 720,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: `Mira el video: ${title}`,
      images: [thumbnailUrl],
    },
  }
}

function Loading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<Loading />}>
      <VideoPage />
    </Suspense>
  )
}
