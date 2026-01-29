"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { type SystemConfig, type Post, type GlobalSettings, defaultSystemConfig, defaultFloatingButtons, defaultRedirect, defaultCounter } from '@/lib/types'

interface User {
  id: string
  email: string
}

interface ConfigContextType {
  config: SystemConfig
  updateSettings: (settings: Partial<GlobalSettings>) => void
  createPost: () => Promise<Post | null>
  updatePost: (postId: number, updates: Partial<Post>) => void
  deletePost: (postId: number) => void
  getPost: (postId: number) => Post | undefined
  saveConfig: () => Promise<void>
  isLoading: boolean
  userId: string | null
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SystemConfig>(defaultSystemConfig)
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  // Check auth status and load data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Check if user is logged in
        const userRes = await fetch('/api/auth/user')
        const userData = await userRes.json()
        
        if (!userData.user) {
          setIsLoading(false)
          return
        }
        
        setUser(userData.user)
        setUserId(userData.user.id)

        // Load user settings
        const settingsRes = await fetch('/api/settings')
        const settingsData = await settingsRes.json()

        // Load user posts
        const postsRes = await fetch('/api/posts')
        const postsData = await postsRes.json()

        // Build config from database
        const settings: GlobalSettings = settingsData.settings ? {
          siteTitle: 'Video Player',
          siteDescription: 'Watch videos online',
          floatingButtons: settingsData.settings.floatingButtons || defaultFloatingButtons,
          redirect: { ...defaultRedirect, ...(settingsData.settings.redirect || {}) },
          counter: { ...defaultCounter, ...(settingsData.settings.counter || {}) },
          scripts: settingsData.settings.scripts || [],
        } : defaultSystemConfig.settings

        const posts: Post[] = (postsData.posts || []).map((p: { id: number; title: string; video_url: string; thumbnail_url: string; is_hls: boolean; created_at: string; updated_at: string; videoUrl?: string; thumbnailUrl?: string; isHLS?: boolean; createdAt?: string; updatedAt?: string }) => ({
          id: p.id,
          title: p.title,
          videoUrl: p.video_url || p.videoUrl,
          thumbnailUrl: p.thumbnail_url || p.thumbnailUrl || '',
          isHLS: p.is_hls ?? p.isHLS,
          createdAt: p.created_at || p.createdAt,
          updatedAt: p.updated_at || p.updatedAt,
        }))

        setConfig({
          settings,
          posts,
          nextPostId: posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 1,
        })
      } catch (error) {
        console.error('Error loading data:', error)
      }
      
      setIsLoading(false)
    }

    loadData()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      
      if (!res.ok) return false
      
      const data = await res.json()
      setUser(data.user)
      setUserId(data.user.id)
      
      // Reload page to load user data
      window.location.reload()
      return true
    } catch {
      return false
    }
  }

  const register = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      
      if (!res.ok) return false
      
      const data = await res.json()
      setUser(data.user)
      setUserId(data.user.id)
      
      // Reload page to load user data
      window.location.reload()
      return true
    } catch {
      return false
    }
  }

  const logout = async (): Promise<void> => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setUserId(null)
    setConfig(defaultSystemConfig)
    window.location.href = '/auth/login'
  }

  const updateSettings = (settings: Partial<GlobalSettings>) => {
    setConfig(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings }
    }))
  }

  const createPost = async (): Promise<Post | null> => {
    if (!userId) return null

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '',
          videoUrl: '',
          isHLS: false,
        }),
      })

      if (!res.ok) return null

      const { post: data } = await res.json()

      const newPost: Post = {
        id: data.id,
        title: data.title,
        videoUrl: data.video_url || data.videoUrl || '',
        thumbnailUrl: data.thumbnail_url || data.thumbnailUrl || '',
        isHLS: data.is_hls ?? data.isHLS ?? false,
        createdAt: data.created_at || data.createdAt,
        updatedAt: data.updated_at || data.updatedAt,
      }

      // Add new post at the beginning (newest first)
      setConfig(prev => ({
        ...prev,
        posts: [newPost, ...prev.posts],
      }))

      return newPost
    } catch (error) {
      console.error('Error creating post:', error)
      return null
    }
  }

  const updatePost = (postId: number, updates: Partial<Post>) => {
    setConfig(prev => ({
      ...prev,
      posts: prev.posts.map(post => 
        post.id === postId 
          ? { ...post, ...updates, updatedAt: new Date().toISOString() }
          : post
      ),
    }))
  }

  const deletePost = async (postId: number) => {
    await fetch(`/api/posts?id=${postId}`, { method: 'DELETE' })
    
    setConfig(prev => ({
      ...prev,
      posts: prev.posts.filter(post => post.id !== postId),
    }))
  }

  const getPost = (postId: number): Post | undefined => {
    return config.posts.find(post => post.id === postId)
  }

  const saveConfig = async () => {
    if (!userId) return

    try {
      // Save settings
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          floatingButtons: config.settings.floatingButtons,
          redirect: config.settings.redirect,
          counter: config.settings.counter,
          scripts: config.settings.scripts,
        }),
      })

      // Save all posts
      await fetch('/api/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts: config.posts }),
      })
    } catch (error) {
      console.error('Error saving config:', error)
    }
  }

  return (
    <ConfigContext.Provider value={{ 
      config, 
      updateSettings,
      createPost,
      updatePost, 
      deletePost,
      getPost,
      saveConfig, 
      isLoading,
      userId,
      user,
      login,
      register,
      logout,
    }}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  const context = useContext(ConfigContext)
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider')
  }
  return context
}
