"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Globe, Plus, Trash2, CheckCircle2, XCircle, Clock, 
  RefreshCw, AlertCircle
} from "lucide-react"
import type { UserDomain } from "@/lib/types"

export function DomainManagement() {
  const [domains, setDomains] = useState<UserDomain[]>([])
  const [newDomain, setNewDomain] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState("")

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

    setIsAdding(true)
    setError("")

    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Error al agregar dominio")
        return
      }

      setDomains([data.domain, ...domains])
      setNewDomain("")
    } catch (err) {
      setError("Error de conexion")
    } finally {
      setIsAdding(false)
    }
  }

  const deleteDomain = async (id: number) => {
    if (!confirm("Estas seguro de eliminar este dominio?")) return

    try {
      const res = await fetch(`/api/domains?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setDomains(domains.filter(d => d.id !== id))
      }
    } catch (err) {
      console.error("Error deleting domain:", err)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "suspended":
        return <AlertCircle className="w-5 h-5 text-orange-500" />
      default:
        return <Clock className="w-5 h-5 text-zinc-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente de aprobacion"
      case "active":
        return "Activo"
      case "failed":
        return "Rechazado"
      case "suspended":
        return "Suspendido"
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "suspended":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      default:
        return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
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
          Agrega dominios para acceder a tus posts desde diferentes URLs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new domain */}
        <div className="space-y-3 p-4 bg-zinc-800/50 rounded-lg">
          <Label className="text-zinc-300">Agregar nuevo dominio</Label>
          <div className="flex gap-2">
            <Input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="ejemplo.com"
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
            <p className="text-sm text-red-400 flex items-center gap-1">
              <XCircle className="w-4 h-4" />
              {error}
            </p>
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
                  {getStatusIcon(domain.status)}
                  <div>
                    <h3 className="font-medium text-zinc-100">{domain.domain}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(domain.status)}`}>
                        {getStatusText(domain.status)}
                      </span>
                      {domain.status === "active" && (
                        <span className="text-xs text-zinc-500">
                          Usa: {domain.domain}/?p=ID
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteDomain(domain.id)}
                  className="border-red-600 bg-transparent hover:bg-red-600/20 text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Info section */}
        <div className="p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-400 mb-2">Como funciona</h4>
          <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
            <li>Agrega el dominio que deseas usar</li>
            <li>El administrador aprobara tu dominio manualmente</li>
            <li>Una vez activo, podras acceder a tus posts desde ese dominio</li>
            <li>Ejemplo: <code className="bg-zinc-800 px-1 rounded">tudominio.com/?p=123</code></li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
