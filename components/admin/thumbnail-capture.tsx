"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Camera, Loader2, CheckCircle, Upload, Link, X } from "lucide-react"

interface ThumbnailCaptureProps {
  videoUrl: string
  postId: number
  currentThumbnail: string
  onThumbnailCaptured: (url: string) => void
}

export function ThumbnailCapture({ 
  videoUrl, 
  postId, 
  currentThumbnail,
  onThumbnailCaptured 
}: ThumbnailCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentThumbnail || null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPreviewUrl(currentThumbnail || null)
  }, [currentThumbnail])

  const drawPlayButton = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
    const buttonRadius = 50

    // Semi-transparent circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, buttonRadius, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.fill()

    // Play triangle
    ctx.beginPath()
    ctx.moveTo(centerX - 15, centerY - 25)
    ctx.lineTo(centerX - 15, centerY + 25)
    ctx.lineTo(centerX + 25, centerY)
    ctx.closePath()
    ctx.fillStyle = '#000'
    ctx.fill()
  }

  const captureFrame = async () => {
    if (!videoUrl) {
      setError("No hay URL de video")
      return
    }

    setIsCapturing(true)
    setError(null)

    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas) return

    // Use server proxy to bypass CORS restrictions
    const proxyUrl = `/api/video-proxy?url=${encodeURIComponent(videoUrl)}`
    video.crossOrigin = "anonymous"
    video.src = proxyUrl
    video.muted = true

    try {
      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => reject(new Error("Timeout - video muy grande o lento")), 30000)
        
        video.onloadeddata = () => {
          const seekTime = Math.min(1, video.duration * 0.1)
          video.currentTime = seekTime
        }
        
        video.onseeked = () => {
          clearTimeout(timeoutId)
          resolve()
        }
        
        video.onerror = () => {
          clearTimeout(timeoutId)
          reject(new Error("Error cargando video"))
        }
      })

      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error("No canvas context")

      canvas.width = 1200
      canvas.height = 630

      const videoAspect = video.videoWidth / video.videoHeight
      const canvasAspect = canvas.width / canvas.height

      let drawWidth, drawHeight, offsetX, offsetY

      if (videoAspect > canvasAspect) {
        drawHeight = canvas.height
        drawWidth = drawHeight * videoAspect
        offsetX = (canvas.width - drawWidth) / 2
        offsetY = 0
      } else {
        drawWidth = canvas.width
        drawHeight = drawWidth / videoAspect
        offsetX = 0
        offsetY = (canvas.height - drawHeight) / 2
      }

      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight)
      drawPlayButton(ctx, canvas.width / 2, canvas.height / 2)

      const imageData = canvas.toDataURL('image/jpeg', 0.85)
      await uploadImage(imageData)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error capturando miniatura")
      setIsCapturing(false)
    }
  }

  const uploadImage = async (imageData: string) => {
    setIsCapturing(false)
    setIsUploading(true)
    setError(null)

    try {
      const response = await fetch('/api/upload-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData, postId }),
      })

      if (!response.ok) throw new Error("Error subiendo imagen")

      const { url } = await response.json()
      setPreviewUrl(url)
      onThumbnailCaptured(url)
    } catch {
      setError("Error subiendo imagen")
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const imageData = reader.result as string
        
        // Process image to add play button
        const img = new Image()
        img.onload = async () => {
          const canvas = canvasRef.current
          if (!canvas) return
          
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          canvas.width = 1200
          canvas.height = 630

          const imgAspect = img.width / img.height
          const canvasAspect = canvas.width / canvas.height

          let drawWidth, drawHeight, offsetX, offsetY

          if (imgAspect > canvasAspect) {
            drawHeight = canvas.height
            drawWidth = drawHeight * imgAspect
            offsetX = (canvas.width - drawWidth) / 2
            offsetY = 0
          } else {
            drawWidth = canvas.width
            drawHeight = drawWidth / imgAspect
            offsetX = 0
            offsetY = (canvas.height - drawHeight) / 2
          }

          ctx.fillStyle = '#000'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)
          drawPlayButton(ctx, canvas.width / 2, canvas.height / 2)

          const processedImage = canvas.toDataURL('image/jpeg', 0.85)
          await uploadImage(processedImage)
        }
        img.src = imageData
      }
      reader.readAsDataURL(file)
    } catch {
      setError("Error procesando imagen")
      setIsUploading(false)
    }
  }

  const handleUrlSubmit = async () => {
    if (!urlInput) return

    setIsUploading(true)
    setError(null)

    try {
      const img = new Image()
      img.crossOrigin = "anonymous"
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("Error cargando imagen"))
        img.src = urlInput
      })

      const canvas = canvasRef.current
      if (!canvas) throw new Error("No canvas")
      
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error("No context")

      canvas.width = 1200
      canvas.height = 630

      const imgAspect = img.width / img.height
      const canvasAspect = canvas.width / canvas.height

      let drawWidth, drawHeight, offsetX, offsetY

      if (imgAspect > canvasAspect) {
        drawHeight = canvas.height
        drawWidth = drawHeight * imgAspect
        offsetX = (canvas.width - drawWidth) / 2
        offsetY = 0
      } else {
        drawWidth = canvas.width
        drawHeight = drawWidth / imgAspect
        offsetX = 0
        offsetY = (canvas.height - drawHeight) / 2
      }

      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)
      drawPlayButton(ctx, canvas.width / 2, canvas.height / 2)

      const processedImage = canvas.toDataURL('image/jpeg', 0.85)
      await uploadImage(processedImage)
      setShowUrlInput(false)
      setUrlInput("")
    } catch {
      // If CORS fails, use URL directly
      setPreviewUrl(urlInput)
      onThumbnailCaptured(urlInput)
      setShowUrlInput(false)
      setUrlInput("")
      setIsUploading(false)
    }
  }

  const removeThumbnail = () => {
    setPreviewUrl(null)
    onThumbnailCaptured("")
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={captureFrame}
          disabled={!videoUrl || isCapturing || isUploading}
          variant="outline"
          size="sm"
          className="border-zinc-600 bg-transparent hover:bg-zinc-700 text-zinc-300"
        >
          {isCapturing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Capturando...
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 mr-2" />
              Auto capturar
            </>
          )}
        </Button>

        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          variant="outline"
          size="sm"
          className="border-zinc-600 bg-transparent hover:bg-zinc-700 text-zinc-300"
        >
          <Upload className="w-4 h-4 mr-2" />
          Subir imagen
        </Button>

        <Button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          disabled={isUploading}
          variant="outline"
          size="sm"
          className="border-zinc-600 bg-transparent hover:bg-zinc-700 text-zinc-300"
        >
          <Link className="w-4 h-4 mr-2" />
          URL imagen
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {showUrlInput && (
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
            className="bg-zinc-700 border-zinc-600 text-zinc-100 flex-1"
          />
          <Button
            type="button"
            onClick={handleUrlSubmit}
            disabled={!urlInput || isUploading}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Usar"}
          </Button>
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {isUploading && (
        <div className="flex items-center gap-2 text-zinc-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Subiendo miniatura...
        </div>
      )}

      {previewUrl && (
        <div className="relative inline-block">
          <div className="w-48 h-auto rounded overflow-hidden border border-zinc-600">
            <img 
              src={previewUrl || "/placeholder.svg"} 
              alt="Miniatura" 
              className="w-full h-auto"
            />
          </div>
          <button
            type="button"
            onClick={removeThumbnail}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1"
          >
            <X className="w-3 h-3 text-white" />
          </button>
          <div className="flex items-center gap-1 mt-1 text-green-500 text-xs">
            <CheckCircle className="w-3 h-3" />
            Miniatura lista
          </div>
        </div>
      )}

      {/* Hidden elements for processing */}
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
