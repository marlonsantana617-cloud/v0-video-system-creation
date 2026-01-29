"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Globe, Plus, Trash2, CheckCircle2, RefreshCw, ExternalLink } from "lucide-react"

interface UserDomain {
  id: number
  domain: string
  status: string
  created_at: string
}

export function DomainManagement() {
  const [domains, setDomains] = useState<UserDomain[]>([])
  const [newDomain, setNewDomain] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchDomains()
  }, [])

  const fetchDomains = async () => {
    try {
      const res = await fetch("/api/domains")
      const data = await res.json()
      if (data.domains) {
        setDomains(data.domains)
      }
    } catch (err) {
      console.error("Error fetching domains:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const addDomain = async () => {
    if (!newDomain.trim()) return

    // Limpiar dominio (quitar http://, https://, www., trailing slashes)
    let cleanDomain = newDomain.trim().toLowerCase()
    cleanDomain = cleanDomain.replace(/^https?:\/\//, '')
    cleanDomain = cleanDomain.replace(/^www\./, '')
    cleanDomain = cleanDomain.replace(/\/+$/, '')

    // Validar formato
    const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/
    if (!domainRegex.test(cleanDomain)) {
      setError("Formato de dominio invalido. Ejemplo: midominio.com")
      return
    }

    setIsAdding(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: cleanDomain })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Error al agregar dominio")
        return
      }

      setSuccess("Dominio agregado correctamente")
      setDomains([data.domain, ...domains])
      setNewDomain("")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError("Error de conexion")
    } finally {
      setIsAdding(false)
    }
  }

  const deleteDomain = async (id: number) => {
    if (!confirm("¿Estas seguro de eliminar este dominio?")) return

    try {
      const res = await fetch(`/api/domains?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setDomains(domains.filter(d => d.id !== id))
        setSuccess("Dominio eliminado")
        setTimeout(() => setSuccess(""), 3000)
      }
    } catch (err) {
      console.error("Error deleting domain:", err)
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="py-12 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-zinc-500" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-100 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Mis Dominios
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Agrega tus dominios para acceder a tus posts desde diferentes URLs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new domain */}
        <div className="space-y-3 p-4 bg-zinc-800/50 rounded-lg">
          <Label className="text-zinc-300">Agregar nuevo dominio</Label>
          <div className="flex gap-2">
            <Input
              value={newDomain}
              onChange={(e) => {
                setNewDomain(e.target.value)
                setError("")
              }}
              placeholder="midominio.com"
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
              onKeyDown={(e) => e.key === "Enter" && addDomain()}
            />
            <Button 
              onClick={addDomain} 
              disabled={isAdding || !newDomain.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isAdding ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </div>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-400">{success}</p>
          )}
        </div>

        {/* Domains list */}
        {domains.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
              <Globe className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-zinc-500">No tienes dominios configurados</p>
            <p className="text-sm text-zinc-600 mt-1">Agrega tu primer dominio para comenzar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {domains.map((domain) => (
              <div 
                key={domain.id} 
                className="p-4 bg-zinc-800 rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div>
                    <h3 className="font-medium text-zinc-100">{domain.domain}</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Ejemplo: {domain.domain}/?p=123
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://${domain.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-zinc-400 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteDomain(domain.id)}
                    className="border-red-600 bg-transparent hover:bg-red-600/20 text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info section */}
        <div className="p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-400 mb-2">Como usar tus dominios</h4>
          <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
            <li>Asegurate de que el dominio apunte a la IP del servidor</li>
            <li>Configura el DNS tipo A apuntando a la IP del servidor</li>
            <li>Una vez configurado, accede a tus posts: <code className="bg-zinc-800 px-1 rounded">tudominio.com/?p=ID</code></li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
