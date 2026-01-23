"use client"

import { useRouter } from "next/navigation"

import { useEffect, useState, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Post, GlobalSettings } from "@/lib/types"
import { defaultSystemConfig, defaultFloatingButtons, defaultRedirect, defaultCounter } from "@/lib/types"

export function VideoPage() {
  const searchParams = useSearchParams()
  const postId = searchParams.get("p")
  
  const [post, setPost] = useState<Post | null>(null)
  const [otherPosts, setOtherPosts] = useState<number[]>([])
  const [settings, setSettings] = useState<GlobalSettings>(defaultSystemConfig.settings)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const supabase = createClient()

  // Load post and settings from Supabase
  useEffect(() => {
    const loadData = async () => {
      if (!postId) {
        setIsLoading(false)
        return
      }

      // Load post from database
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', parseInt(postId))
        .single()

      if (postError || !postData) {
        setNotFound(true)
        setIsLoading(false)
        return
      }

      // Set post data
      setPost({
        id: postData.id,
        title: postData.title,
        videoUrl: postData.video_url,
        isHLS: postData.is_hls,
        createdAt: postData.created_at,
        updatedAt: postData.updated_at,
      })

      // Load user settings for this post's owner
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', postData.user_id)
        .single()

      if (settingsData) {
        setSettings({
          siteTitle: 'Video Player',
          siteDescription: 'Watch videos online',
          floatingButtons: settingsData.floating_buttons || defaultFloatingButtons,
          redirect: { ...defaultRedirect, ...(settingsData.redirect || {}) },
          counter: { ...defaultCounter, ...(settingsData.counter || {}) },
          scripts: settingsData.scripts || [],
        })
      }

      // Load other posts from same user for redirect on video end
      const { data: otherPostsData } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', postData.user_id)
        .neq('id', postData.id)
        .order('id', { ascending: false })

      if (otherPostsData && otherPostsData.length > 0) {
        setOtherPosts(otherPostsData.map(p => p.id))
      }

      setIsLoading(false)
    }

    loadData()
  }, [postId])

  // Apply protections
  useEffect(() => {
    if (!post) return

    // Disable right click
    const handleContextMenu = (e: Event) => {
      e.preventDefault()
      return false
    }

    // Disable text selection
    const handleSelectStart = (e: Event) => {
      e.preventDefault()
      return false
    }

    // Disable drag
    const handleDragStart = (e: Event) => {
      e.preventDefault()
      return false
    }

    // Block keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+U (view source)
      if (e.ctrlKey && (e.keyCode === 85 || e.key === 'u' || e.key === 'U')) {
        e.preventDefault()
        return false
      }
      // Block Ctrl+S (save page)
      if (e.ctrlKey && (e.keyCode === 83 || e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        return false
      }
      // Block F12
      if (e.keyCode === 123 || e.key === 'F12') {
        e.preventDefault()
        return false
      }
      // Block Ctrl+Shift+I
      if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.key === 'I' || e.key === 'i')) {
        e.preventDefault()
        return false
      }
      // Block Ctrl+Shift+J
      if (e.ctrlKey && e.shiftKey && (e.keyCode === 74 || e.key === 'J' || e.key === 'j')) {
        e.preventDefault()
        return false
      }
      // Block Ctrl+Shift+C
      if (e.ctrlKey && e.shiftKey && (e.keyCode === 67 || e.key === 'C' || e.key === 'c')) {
        e.preventDefault()
        return false
      }
    }

    document.addEventListener('contextmenu', handleContextMenu, true)
    document.addEventListener('selectstart', handleSelectStart, true)
    document.addEventListener('dragstart', handleDragStart, true)
    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true)
      document.removeEventListener('selectstart', handleSelectStart, true)
      document.removeEventListener('dragstart', handleDragStart, true)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [post])

  // Counter script - whos.amung.us (uses global settings)
  useEffect(() => {
    if (!post || !settings.counter.enabled || !settings.counter.counterKey) return

    const registerCounter = () => {
      const formattedTitle = (post.title || 'Video').replace(/ /g, '+')
      const urlWithoutParams = typeof window !== 'undefined' ? window.location.href.split('?')[0] : ''
      
      const img = document.createElement('img')
      const url = `//whos.amung.us/pingjs/?k=${settings.counter.counterKey};&t=${formattedTitle}&u=${encodeURIComponent(urlWithoutParams)}`
      img.src = url
      img.style.display = 'none'
      img.referrerPolicy = 'unsafe-url'
      document.body.appendChild(img)
    }

    registerCounter()
  }, [post, settings])

  // Inject custom scripts dynamically
  useEffect(() => {
    if (!settings.scripts || settings.scripts.length === 0) return

    const injectedElements: HTMLElement[] = []

    settings.scripts
      .filter((s) => s.enabled && s.content)
      .forEach((script) => {
        const content = script.content.trim()
        const targetElement = script.position === 'head' ? document.head : document.body
        
        // Check if content contains <script> tags
        if (content.includes('<script')) {
          // Parse the HTML content using DOMParser
          const parser = new DOMParser()
          const doc = parser.parseFromString(`<div>${content}</div>`, 'text/html')
          const scriptTags = doc.querySelectorAll('script')
          
          scriptTags.forEach((oldScript, index) => {
            const newScript = document.createElement('script')
            
            // Copy all attributes (src, async, defer, data-*, etc.)
            Array.from(oldScript.attributes).forEach((attr) => {
              newScript.setAttribute(attr.name, attr.value)
            })
            
            // Copy inline content if any
            if (oldScript.textContent) {
              newScript.textContent = oldScript.textContent
            }
            
            newScript.id = `custom-script-${script.id}-${index}`
            targetElement.appendChild(newScript)
            injectedElements.push(newScript)
          })
        } else {
          // Plain JavaScript code without <script> tags
          const scriptEl = document.createElement('script')
          scriptEl.id = `custom-script-${script.id}`
          scriptEl.textContent = content
          targetElement.appendChild(scriptEl)
          injectedElements.push(scriptEl)
        }
      })

    return () => {
      // Cleanup scripts on unmount
      injectedElements.forEach((el) => el.remove())
    }
  }, [settings.scripts])

  // Load HLS for streaming videos
  useEffect(() => {
    if (!post?.isHLS || !videoRef.current || !isPlaying) return

    const loadHLS = async () => {
      const Hls = (await import("hls.js")).default
      if (Hls.isSupported() && videoRef.current) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          startLevel: -1
        })
        hls.loadSource(post.videoUrl)
        hls.attachMedia(videoRef.current)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current?.play()
        })
      } else if (videoRef.current?.canPlayType("application/vnd.apple.mpegurl")) {
        videoRef.current.src = post.videoUrl
        videoRef.current.play()
      }
    }

    loadHLS()
  }, [post, isPlaying])

  // Cookie functions (use global settings)
  const isCookieExpired = () => {
    const cookieTimestamp = localStorage.getItem('directLinkOpenedTimestamp')
    if (cookieTimestamp) {
      const timestamp = parseInt(cookieTimestamp)
      const now = Date.now()
      const elapsed = Math.round((now - timestamp) / 1000)
      
      if (elapsed >= settings.redirect.cookieDuration) {
        localStorage.removeItem('directLinkOpenedTimestamp')
        document.cookie = "directLinkOpened=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
        return true
      }
      return false
    }
    
    const cookieValue = document.cookie.replace(/(?:(?:^|.*;\s*)directLinkOpened\s*=\s*([^;]*).*$)|^.*$/, "$1")
    return cookieValue !== "true"
  }

  const markDirectLinkOpened = () => {
    const expireDate = new Date()
    expireDate.setTime(expireDate.getTime() + settings.redirect.cookieDuration * 1000)
    document.cookie = `directLinkOpened=true; expires=${expireDate.toUTCString()}; path=/`
    localStorage.setItem('directLinkOpenedTimestamp', Date.now().toString())
  }

  // Redirect functions (use global settings)
  const openDirectLinkBehind = () => {
    if (!settings.redirect.url) return
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                     || (window.innerWidth <= 768 && 'ontouchstart' in window)
    
    if (isMobile) {
      // Mobile: open content in new tab, redirect current to ad
      const contentWindow = window.open(window.location.href, '_blank')
      if (contentWindow) {
        setTimeout(() => {
          window.location.href = settings.redirect.url
        }, 300)
      } else {
        setTimeout(() => {
          window.location.href = settings.redirect.url
        }, 300)
      }
    } else {
      // Desktop: open ad in background
      const newWin = window.open(settings.redirect.url, '_blank')
      if (newWin) {
        newWin.blur()
        window.focus()
      }
    }
  }

  const handlePlayClick = () => {
    if (!post) return

    const behavior = settings.redirect.behavior
    const directLinkOpened = !isCookieExpired()

    // Handle redirect_first mode
    if (behavior === 'redirect_first') {
      if (!directLinkOpened && settings.redirect.enabled && settings.redirect.url) {
        markDirectLinkOpened()
        window.location.href = settings.redirect.url
        return
      }
      // Second visit or no redirect URL: play video
      showVideo()
      return
    }

    // Handle behind mode
    if (behavior === 'behind') {
      if (!directLinkOpened && settings.redirect.enabled && settings.redirect.url) {
        markDirectLinkOpened()
        openDirectLinkBehind()
      }
      showVideo()
      return
    }

    // Handle front mode
    if (behavior === 'front') {
      if (!directLinkOpened && settings.redirect.enabled && settings.redirect.url) {
        markDirectLinkOpened()
        sessionStorage.setItem('vt_return_play', '1')
        window.location.href = settings.redirect.url
        return
      }
      showVideo()
      return
    }

    // Default: just play
    showVideo()
  }

const showVideo = () => {
    setShowPreview(false)
    setIsPlaying(true)

    if (videoRef.current && post) {
      videoRef.current.play().catch(() => {})
    }
  }

  // Redirect to another post when video ends
  const onVideoEnded = useCallback(() => {
    if (otherPosts.length > 0) {
      // Pick a random post from available posts
      const randomIndex = Math.floor(Math.random() * otherPosts.length)
      const nextPostId = otherPosts[randomIndex]
      // Use window.location for full page reload
      window.location.href = `/?p=${nextPostId}`
    }
  }, [otherPosts])

  // Auto-play on return from redirect (uses global settings)
  useEffect(() => {
    if (!post) return
    
    const returnPlay = sessionStorage.getItem('vt_return_play')
    if (returnPlay === '1') {
      sessionStorage.removeItem('vt_return_play')
      setTimeout(() => showVideo(), 500)
    }

    // redirect_first: auto redirect or auto play
    if (settings.redirect.behavior === 'redirect_first' && settings.redirect.enabled && settings.redirect.url) {
      const directLinkOpened = !isCookieExpired()
      if (!directLinkOpened) {
        markDirectLinkOpened()
        window.location.href = settings.redirect.url
      } else {
        setTimeout(() => showVideo(), 500)
      }
    }
  }, [post, settings])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!postId || notFound) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-zinc-500">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <p className="text-lg">{notFound ? "Contenido no disponible" : "Pagina no encontrada"}</p>
        </div>
      </div>
    )
  }

  if (!post) return null

  // Use global floating buttons settings
  const enabledButtons = settings.floatingButtons.filter(b => b.enabled)

  // Reorder buttons: telegram, whatsapp, facebook, share
  const orderedTypes = ["telegram", "whatsapp", "facebook", "share"] as const
  const sortedButtons = [...enabledButtons].sort((a, b) => {
    return orderedTypes.indexOf(a.type) - orderedTypes.indexOf(b.type)
  })

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const title = post.title || 'Video'
    
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch {
        // Fallback to Facebook share
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url)
        alert('Enlace copiado!')
      } catch {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
      }
    }
  }

  const getButtonUrl = (button: typeof enabledButtons[0]) => {
    if (button.type === 'share') return '#'
    return button.url || '#'
  }

  const getButtonIcon = (type: string) => {
    switch (type) {
      case 'telegram':
        return (
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
        )
      case 'whatsapp':
        return (
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        )
      case 'facebook':
        return (
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        )
      case 'share':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
          </svg>
        )
    }
  }

  const getButtonColor = (type: string) => {
    switch (type) {
      case 'telegram': return 'bg-[#0088cc]'
      case 'whatsapp': return 'bg-[#25D366]'
      case 'facebook': return 'bg-[#1877F2]'
      case 'share': return 'bg-[#0088cc]'
      default: return 'bg-zinc-600'
    }
  }

  return (
    <>
      {/* Global Styles */}
      <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          background: #000;
        }
        
        * {
          -webkit-touch-callout: none !important;
          -webkit-user-select: none !important;
          -khtml-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
        }
        
        img {
          -webkit-user-drag: none !important;
          -khtml-user-drag: none !important;
          -moz-user-drag: none !important;
          -o-user-drag: none !important;
          user-drag: none !important;
          pointer-events: auto !important;
        }
        
        input, textarea {
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
          user-select: text !important;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .floating-btn {
          animation: float 3s ease-in-out infinite;
        }
        
        .floating-btn:nth-child(2) {
          animation-delay: 0.5s;
        }
        
        .floating-btn:nth-child(3) {
          animation-delay: 1s;
        }
        
        .floating-btn:nth-child(4) {
          animation-delay: 1.5s;
        }
      `}</style>

      <div className="min-h-screen min-h-dvh bg-black flex flex-col">
        {/* Video Preview/Player */}
        {showPreview ? (
          <div className="flex-1 flex items-center justify-center relative bg-black">
            <div className="w-full h-full flex items-center justify-center">
              {post.videoUrl && (
                <video
                  ref={previewVideoRef}
                  src={post.videoUrl}
                  className="max-w-full max-h-full w-auto h-auto object-contain"
                  muted
                  playsInline
                  preload="metadata"
                />
              )}
            </div>
            
            {/* Play Button */}
            <button
              onClick={handlePlayClick}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70px] h-[70px] md:w-20 md:h-20 bg-white/90 rounded-full flex items-center justify-center cursor-pointer z-10 transition-all duration-300 hover:bg-white hover:scale-110 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
              style={{ position: 'fixed' }}
              aria-label="Reproducir video"
            >
              <svg className="w-7 h-7 md:w-8 md:h-8 ml-1 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center relative bg-black">
            <video
              ref={videoRef}
              src={post.videoUrl}
              className="max-w-full max-h-full w-auto h-auto object-contain bg-black"
              controls
              playsInline
              autoPlay
              onEnded={onVideoEnded}
            />
          </div>
        )}

        {/* Floating Buttons */}
        <div className="fixed right-[15px] md:right-5 top-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-[15px]">
          {sortedButtons.map((button) => (
            button.type === 'share' ? (
              <button
                key={button.id}
                onClick={handleShare}
                className={`floating-btn w-[56px] h-[56px] md:w-[60px] md:h-[60px] rounded-full flex items-center justify-center text-white shadow-[0_4px_15px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-110 hover:shadow-[0_6px_20px_rgba(0,0,0,0.4)] ${getButtonColor(button.type)}`}
                title="Compartir"
              >
                {getButtonIcon(button.type)}
              </button>
            ) : (
              <a
                key={button.id}
                href={getButtonUrl(button)}
                target="_blank"
                rel="noopener noreferrer"
                className={`floating-btn w-[56px] h-[56px] md:w-[60px] md:h-[60px] rounded-full flex items-center justify-center text-white shadow-[0_4px_15px_rgba(0,0,0,0.4)] ${getButtonColor(button.type)}`}
                title={button.type.charAt(0).toUpperCase() + button.type.slice(1)}
              >
                {getButtonIcon(button.type)}
              </a>
            )
          ))}
        </div>
      </div>
    </>
  )
}
