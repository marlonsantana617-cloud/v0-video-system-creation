"use client"

import { SelectItem } from "@/components/ui/select"
import { SelectContent } from "@/components/ui/select"
import { SelectValue } from "@/components/ui/select"
import { SelectTrigger } from "@/components/ui/select"
import { Select } from "@/components/ui/select"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useConfig } from "@/lib/config-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ThumbnailCapture } from "./thumbnail-capture"
import { 
  Settings, Video, Share2, Link2, BarChart3, Code, Save, 
  Plus, Trash2, Copy, ExternalLink, Edit2, Play, LogOut
} from "lucide-react"
import { ChangePassword } from "./change-password"
import { Users } from "lucide-react"
import { UserManagement } from "./user-management"

export function AdminPanel() {
  const configContext = useConfig()
  const { config, updateSettings, createPost, updatePost, deletePost, saveConfig, isLoading, user, logout } = configContext
  const [saved, setSaved] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<number | null>(null)
  const [editingPost, setEditingPost] = useState<number | null>(null)
  const router = useRouter()
  const userEmail = user?.email || ""
  const isAdmin = user?.role === "admin"

  const handleLogout = async () => {
    await logout()
    router.push("/auth/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!config || !config.settings) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <p>Error: Configuracion no disponible</p>
      </div>
    )
  }

  const handleSave = async () => {
    await saveConfig()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleCreatePost = async () => {
    const post = await createPost()
    if (post) {
      setEditingPost(post.id)
    }
  }

  const getPostUrl = (postId: number) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/?p=${postId}`
    }
    return `/?p=${postId}`
  }

  const copyUrl = (postId: number) => {
    navigator.clipboard.writeText(getPostUrl(postId))
    setCopiedUrl(postId)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const updateButton = (buttonId: string, updates: Partial<typeof config.settings.floatingButtons[0]>) => {
    const newButtons = config.settings.floatingButtons.map(btn =>
      btn.id === buttonId ? { ...btn, ...updates } : btn
    )
    updateSettings({ floatingButtons: newButtons })
  }

  const addScript = () => {
    const newScript = {
      id: Date.now().toString(),
      name: `Script ${config.settings.scripts.length + 1}`,
      content: "",
      position: "body_end" as const,
      enabled: true,
    }
    updateSettings({ scripts: [...config.settings.scripts, newScript] })
  }

  const updateScript = (scriptId: string, updates: Partial<typeof config.settings.scripts[0]>) => {
    const newScripts = config.settings.scripts.map(s =>
      s.id === scriptId ? { ...s, ...updates } : s
    )
    updateSettings({ scripts: newScripts })
  }

  const deleteScript = (scriptId: string) => {
    updateSettings({ scripts: config.settings.scripts.filter(s => s.id !== scriptId) })
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Panel de Administracion</h1>
              <p className="text-sm text-zinc-400">
                {userEmail && <span className="text-zinc-500">{userEmail}</span>}
                {isAdmin && <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Admin</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">{saved ? "Guardado!" : "Guardar"}</span>
            </Button>
            <ChangePassword />
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-300"
            >
              <LogOut className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="posts" className="space-y-6">
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1 h-auto flex-wrap">
            <TabsTrigger value="posts" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-zinc-400 px-4 py-2">
              <Video className="w-4 h-4 mr-2" />
              Publicaciones
            </TabsTrigger>
            <TabsTrigger value="buttons" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-zinc-400 px-4 py-2">
              <Share2 className="w-4 h-4 mr-2" />
              Botones Flotantes
            </TabsTrigger>
            <TabsTrigger value="redirect" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-zinc-400 px-4 py-2">
              <Link2 className="w-4 h-4 mr-2" />
              Redirecciones
            </TabsTrigger>
            <TabsTrigger value="counter" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-zinc-400 px-4 py-2">
              <BarChart3 className="w-4 h-4 mr-2" />
              Contador
            </TabsTrigger>
            <TabsTrigger value="scripts" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-zinc-400 px-4 py-2">
              <Code className="w-4 h-4 mr-2" />
              Scripts
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-zinc-400 px-4 py-2">
                <Users className="w-4 h-4 mr-2" />
                Usuarios
              </TabsTrigger>
            )}
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-zinc-100">Publicaciones</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Gestiona tus videos. Cada publicacion obtiene una URL unica.
                  </CardDescription>
                </div>
                <Button onClick={handleCreatePost} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Publicacion
                </Button>
              </CardHeader>
              <CardContent>
                {config.posts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
                      <Video className="w-8 h-8 text-zinc-600" />
                    </div>
                    <p className="text-zinc-500">No hay publicaciones todavia</p>
                    <p className="text-sm text-zinc-600 mt-1">Crea tu primera publicacion para comenzar</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {config.posts.map((post) => (
                      <div 
                        key={post.id} 
                        className="flex items-center gap-4 p-4 bg-zinc-800 rounded-lg"
                      >
                        {/* Thumbnail */}
                        <div className="w-24 h-16 md:w-32 md:h-20 bg-zinc-700 rounded-lg overflow-hidden flex-shrink-0">
                          {post.videoUrl ? (
                            <video
                              src={post.videoUrl}
                              className="w-full h-full object-cover"
                              muted
                              preload="metadata"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-6 h-6 text-zinc-600" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          {editingPost === post.id ? (
                            <div className="space-y-3">
                              <Input
                                value={post.title}
                                onChange={(e) => updatePost(post.id, { title: e.target.value })}
                                placeholder="Titulo del video"
                                className="bg-zinc-700 border-zinc-600 text-zinc-100"
                              />
                              <Input
                                value={post.videoUrl}
                                onChange={(e) => updatePost(post.id, { videoUrl: e.target.value })}
                                placeholder="URL del video (mp4, m3u8)"
                                className="bg-zinc-700 border-zinc-600 text-zinc-100"
                              />
                              <div className="space-y-2">
                                <Label className="text-sm text-zinc-400">Miniatura para Facebook/Discord</Label>
                                <ThumbnailCapture
                                  videoUrl={post.videoUrl}
                                  postId={post.id}
                                  currentThumbnail={post.thumbnailUrl || ''}
                                  onThumbnailCaptured={(url) => updatePost(post.id, { thumbnailUrl: url })}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={post.isHLS}
                                  onCheckedChange={(checked) => updatePost(post.id, { isHLS: checked })}
                                />
                                <Label className="text-sm text-zinc-400">Video HLS (m3u8)</Label>
                              </div>
                              <Button 
                                onClick={async () => {
                                  await saveConfig()
                                  setEditingPost(null)
                                  setSaved(true)
                                  setTimeout(() => setSaved(false), 2000)
                                }} 
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Listo
                              </Button>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-medium text-zinc-100 truncate">
                                {post.title || `Publicacion #${post.id}`}
                              </h3>
                              <code className="text-xs text-zinc-500 bg-zinc-700 px-2 py-0.5 rounded">
                                /?p={post.id}
                              </code>
                            </>
                          )}
                        </div>

                        {/* Actions */}
                        {editingPost !== post.id && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingPost(post.id)}
                              className="border-zinc-600 bg-transparent hover:bg-zinc-700 text-zinc-300"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyUrl(post.id)}
                              className="border-zinc-600 bg-transparent hover:bg-zinc-700 text-zinc-300"
                            >
                              {copiedUrl === post.id ? "Copiado!" : <Copy className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="border-zinc-600 bg-transparent hover:bg-zinc-700 text-zinc-300"
                            >
                              <a href={getPostUrl(post.id)} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deletePost(post.id)}
                              className="border-red-600 bg-transparent hover:bg-red-600/20 text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Floating Buttons Tab - GLOBAL */}
          <TabsContent value="buttons" className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100">Botones Flotantes (Global)</CardTitle>
                <CardDescription className="text-zinc-400">
                  Estos botones se muestran en TODAS las publicaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {config.settings.floatingButtons.map((button) => (
                  <div key={button.id} className="flex items-center gap-4 p-4 bg-zinc-800 rounded-lg">
                    <Switch
                      checked={button.enabled}
                      onCheckedChange={(checked) => updateButton(button.id, { enabled: checked })}
                    />
                    <div className="flex-1">
                      <Label className="text-zinc-300 capitalize font-medium">{button.type}</Label>
                      {button.type !== "share" && (
                        <Input
                          value={button.url}
                          onChange={(e) => updateButton(button.id, { url: e.target.value })}
                          placeholder={`URL de ${button.type}`}
                          className="mt-2 bg-zinc-700 border-zinc-600 text-zinc-100"
                        />
                      )}
                      {button.type === "share" && (
                        <p className="text-xs text-zinc-500 mt-1">Usa el API nativo de compartir o copia el enlace</p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Redirect Tab - GLOBAL */}
          <TabsContent value="redirect" className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100">Redireccion (Global)</CardTitle>
                <CardDescription className="text-zinc-400">
                  Esta configuracion se aplica a TODAS las publicaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Redirect on Time */}
                <div className="space-y-4 p-4 bg-zinc-800/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={config.settings.redirect.onTimeEnabled}
                      onCheckedChange={(checked) => updateSettings({ 
                        redirect: { ...config.settings.redirect, onTimeEnabled: checked } 
                      })}
                    />
                    <Label className="text-zinc-300">Redirigir despues de X segundos</Label>
                  </div>

                  {config.settings.redirect.onTimeEnabled && (
                    <div className="space-y-4 ml-4">
                      <div className="space-y-2">
                        <Label className="text-zinc-400">Segundos antes de redirigir</Label>
                        <Input
                          type="number"
                          value={config.settings.redirect.onTimeSeconds}
                          onChange={(e) => updateSettings({ 
                            redirect: { ...config.settings.redirect, onTimeSeconds: parseInt(e.target.value) || 5 } 
                          })}
                          placeholder="5"
                          className="bg-zinc-800 border-zinc-700 text-zinc-100 w-32"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-zinc-400">URL de redireccion</Label>
                        <Input
                          value={config.settings.redirect.onTimeUrl}
                          onChange={(e) => updateSettings({ 
                            redirect: { ...config.settings.redirect, onTimeUrl: e.target.value } 
                          })}
                          placeholder="https://ejemplo.com"
                          className="bg-zinc-800 border-zinc-700 text-zinc-100"
                        />
                      </div>
                      <p className="text-xs text-zinc-500">El usuario sera redirigido despues de {config.settings.redirect.onTimeSeconds || 5} segundos. Si vuelve atras, puede continuar viendo el video.</p>
                    </div>
                  )}
                </div>

                {/* Redirect on Video End */}
                <div className="space-y-4 p-4 bg-zinc-800/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={config.settings.redirect.onEndEnabled}
                      onCheckedChange={(checked) => updateSettings({ 
                        redirect: { ...config.settings.redirect, onEndEnabled: checked } 
                      })}
                    />
                    <Label className="text-zinc-300">Redirigir cuando el video termina</Label>
                  </div>

                  {config.settings.redirect.onEndEnabled && (
                    <div className="space-y-4 ml-4">
                      <div className="space-y-2">
                        <Label className="text-zinc-400">URL de redireccion al finalizar</Label>
                        <Input
                          value={config.settings.redirect.onEndUrl}
                          onChange={(e) => updateSettings({ 
                            redirect: { ...config.settings.redirect, onEndUrl: e.target.value } 
                          })}
                          placeholder="https://ejemplo.com"
                          className="bg-zinc-800 border-zinc-700 text-zinc-100"
                        />
                      </div>
                      <p className="text-xs text-zinc-500">El usuario sera redirigido cuando el video termine de reproducirse.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Counter Tab - GLOBAL */}
          <TabsContent value="counter" className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100">Contador de Vistas (Global)</CardTitle>
                <CardDescription className="text-zinc-400">
                  Configura el contador usando whos.amung.us - se aplica a TODAS las publicaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Switch
                    checked={config.settings.counter.enabled}
                    onCheckedChange={(checked) => updateSettings({ 
                      counter: { ...config.settings.counter, enabled: checked } 
                    })}
                  />
                  <Label className="text-zinc-300">Habilitar contador</Label>
                </div>

                {config.settings.counter.enabled && (
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Counter Key (whos.amung.us)</Label>
                    <Input
                      value={config.settings.counter.counterKey}
                      onChange={(e) => updateSettings({ 
                        counter: { ...config.settings.counter, counterKey: e.target.value } 
                      })}
                      placeholder="ej: xreels"
                      className="bg-zinc-800 border-zinc-700 text-zinc-100"
                    />
                    <p className="text-xs text-zinc-500">
                      Este es el identificador de tu contador en whos.amung.us (ej: xreels, ay36adfjrf)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scripts Tab - GLOBAL */}
          <TabsContent value="scripts" className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-zinc-100">Scripts Personalizados (Global)</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Estos scripts se inyectan en TODAS las publicaciones
                  </CardDescription>
                </div>
                <Button onClick={addScript} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Script
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {config.settings.scripts.length === 0 ? (
                  <p className="text-center text-zinc-500 py-8">No hay scripts configurados</p>
                ) : (
                  config.settings.scripts.map((script) => (
                    <div key={script.id} className="p-4 bg-zinc-800 rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Switch
                            checked={script.enabled}
                            onCheckedChange={(checked) => updateScript(script.id, { enabled: checked })}
                          />
                          <Input
                            value={script.name}
                            onChange={(e) => updateScript(script.id, { name: e.target.value })}
                            className="w-48 bg-zinc-700 border-zinc-600 text-zinc-100"
                            placeholder="Nombre del script"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={script.position}
                            onValueChange={(value: "head" | "body_start" | "body_end") =>
                              updateScript(script.id, { position: value })
                            }
                          >
                            <SelectTrigger className="w-32 bg-zinc-700 border-zinc-600 text-zinc-100">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700">
                              <SelectItem value="head" className="text-zinc-100">Head</SelectItem>
                              <SelectItem value="body_start" className="text-zinc-100">Body (inicio)</SelectItem>
                              <SelectItem value="body_end" className="text-zinc-100">Body (final)</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteScript(script.id)}
                            className="border-red-600 bg-transparent hover:bg-red-600/20 text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        value={script.content}
                        onChange={(e) => updateScript(script.id, { content: e.target.value })}
                        placeholder="<script>...</script>"
                        className="font-mono text-sm bg-zinc-900 border-zinc-700 text-zinc-100 min-h-24"
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab - ADMIN ONLY */}
          {isAdmin && (
            <TabsContent value="users" className="space-y-6">
              <UserManagement />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  )
}
