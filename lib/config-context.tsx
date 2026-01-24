"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type SystemConfig, type Post, type GlobalSettings, defaultSystemConfig, defaultFloatingButtons, defaultRedirect, defaultCounter } from '@/lib/types'

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
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SystemConfig>(defaultSystemConfig)
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setIsLoading(false)
        return
      }
      
      setUserId(user.id)

      // Load user settings
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', user.id)
        .single()

      // Load user posts (newest first)
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('id', { ascending: false })

      // Build config from database
      const settings: GlobalSettings = settingsData ? {
        siteTitle: 'Video Player',
        siteDescription: 'Watch videos online',
        floatingButtons: settingsData.floating_buttons || defaultFloatingButtons,
        redirect: { ...defaultRedirect, ...(settingsData.redirect || {}) },
        counter: { ...defaultCounter, ...(settingsData.counter || {}) },
        scripts: settingsData.scripts || [],
      } : defaultSystemConfig.settings

      const posts: Post[] = (postsData || []).map(p => ({
        id: p.id,
        title: p.title,
        videoUrl: p.video_url,
        thumbnailUrl: p.thumbnail_url || '',
        isHLS: p.is_hls,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }))

      setConfig({
        settings,
        posts,
        nextPostId: posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 1,
      })
      
      setIsLoading(false)
    }

    loadData()
  }, [])

  const updateSettings = (settings: Partial<GlobalSettings>) => {
    setConfig(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings }
    }))
  }

  const createPost = async (): Promise<Post | null> => {
    if (!userId) return null

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        title: '',
        video_url: '',
        is_hls: false,
      })
      .select()
      .single()

    if (error || !data) {
      console.error('Error creating post:', error)
      return null
    }

    const newPost: Post = {
      id: data.id,
      title: data.title,
      videoUrl: data.video_url,
      isHLS: data.is_hls,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    setConfig(prev => ({
      ...prev,
      posts: [...prev.posts, newPost],
    }))

    return newPost
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
    await supabase.from('posts').delete().eq('id', postId)
    
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

    // Save settings
    const { error: settingsError } = await supabase
      .from('user_settings')
      .upsert({
        id: userId,
        floating_buttons: config.settings.floatingButtons,
        redirect: config.settings.redirect,
        counter: config.settings.counter,
        scripts: config.settings.scripts,
        updated_at: new Date().toISOString(),
      })

    if (settingsError) {
      console.error('Error saving settings:', settingsError)
    }

    // Save all posts
    for (const post of config.posts) {
      await supabase
        .from('posts')
        .update({
          title: post.title,
          video_url: post.videoUrl,
          thumbnail_url: post.thumbnailUrl || '',
          is_hls: post.isHLS,
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id)
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
