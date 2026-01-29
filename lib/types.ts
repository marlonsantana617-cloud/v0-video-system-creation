export interface UserDomain {
  id: number
  userId: string
  domain: string
  status: 'active' | 'suspended'
  createdAt: string
  updatedAt: string
}

export interface VideoConfig {
  id: string
  title: string
  videoUrl: string
  thumbnailUrl: string
  isHLS: boolean
}

export interface FloatingButton {
  id: string
  type: 'whatsapp' | 'telegram' | 'facebook' | 'share'
  url: string
  enabled: boolean
}

export interface RedirectConfig {
  // Redirect after X seconds of video playing
  onTimeEnabled: boolean
  onTimeSeconds: number
  onTimeUrl: string
  // Redirect when video ends
  onEndEnabled: boolean
  onEndUrl: string
}

export interface CounterConfig {
  enabled: boolean
  counterKey: string // whos.amung.us key
}

export interface ScriptConfig {
  id: string
  name: string
  content: string
  position: 'head' | 'body_start' | 'body_end'
  enabled: boolean
}

// Post/Publication type - each video is a post with unique ID
// Only contains video-specific data, global settings are applied from GlobalSettings
export interface Post {
  id: number
  title: string
  videoUrl: string
  thumbnailUrl: string
  isHLS: boolean
  createdAt: string
  updatedAt: string
}

// Global site settings - applied to ALL posts
export interface GlobalSettings {
  siteTitle: string
  siteDescription: string
  floatingButtons: FloatingButton[]
  redirect: RedirectConfig
  counter: CounterConfig
  scripts: ScriptConfig[]
}

// Full system config
export interface SystemConfig {
  settings: GlobalSettings
  posts: Post[]
  nextPostId: number
}

export const defaultFloatingButtons: FloatingButton[] = [
  { id: '1', type: 'telegram', url: '', enabled: true },
  { id: '2', type: 'whatsapp', url: '', enabled: true },
  { id: '3', type: 'facebook', url: '', enabled: true },
  { id: '4', type: 'share', url: '', enabled: true },
]

export const defaultRedirect: RedirectConfig = {
  onTimeEnabled: false,
  onTimeSeconds: 5,
  onTimeUrl: '',
  onEndEnabled: false,
  onEndUrl: '',
}

export const defaultCounter: CounterConfig = {
  enabled: true,
  counterKey: '',
}

export const defaultSystemConfig: SystemConfig = {
  settings: {
    siteTitle: 'Video Player',
    siteDescription: 'Watch videos online',
    floatingButtons: defaultFloatingButtons,
    redirect: defaultRedirect,
    counter: defaultCounter,
    scripts: [],
  },
  posts: [],
  nextPostId: 1,
}

export function createNewPost(id: number): Post {
  return {
    id,
    title: '',
    videoUrl: '',
    thumbnailUrl: '',
    isHLS: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
