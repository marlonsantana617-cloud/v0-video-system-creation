"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Globe, Plus, Trash2, CheckCircle2, XCircle, Clock, 
  Copy, RefreshCw, AlertCircle, Shield
} from "lucide-react"
import type { UserDomain } from "@/lib/types"

export function DomainManagement() {
  const [domains, setDomains] = useState<UserDomain[]>([])
  const [newDomain, setNewDomain] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [verifyingId, setVerifyingId] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [copiedToken, setCopiedToken] = useState<number | null>(null)

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

  const verifyDomain = async (domainId: number) => {
    setVerifyingId(domainId)

    try {
      const res = await fetch("/api/domains/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId })
      })

      const data = await res.json()

      if (data.verified) {
        // Refresh domains list
        fetchDomains()
      } else {
        alert(data.message || "Verificacion fallida")
      }
    } catch (err) {
      console.error("Error verifying domain:", err)
    } finally {
      setVerifyingId(null)
    }
  }

  const copyVerificationToken = (domain: UserDomain) => {
    const token = `videosystem-verify=${domain.verificationToken}`
    navigator.clipboard.writeText(token)
    setCopiedToken(domain.id)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const getStatusIcon = (status: string, isVerified: boolean) => {
    if (isVerified) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />
    }
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

  const getStatusText = (status: string, isVerified: boolean) => {
    if (isVerified && status === "active") return "Activo"
    if (isVerified) return "Verificado"
    switch (status) {
      case "pending":
        return "Pendiente de verificacion"
      case "active":
        return "Activo"
      case "failed":
        return "Verificacion fallida"
      case "suspended":
        return "Suspendido"
      default:
        return status
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
          Agrega y gestiona los dominios donde se mostrara tu contenido
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
          <div className="space-y-4">
            {domains.map((domain) => (
              <div 
                key={domain.id} 
                className="p-4 bg-zinc-800 rounded-lg space-y-3"
              >
                {/* Domain header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(domain.status, domain.isVerified)}
                    <div>
                      <h3 className="font-medium text-zinc-100">{domain.domain}</h3>
                      <p className="text-sm text-zinc-500">
                        {getStatusText(domain.status, domain.isVerified)}
                        {domain.sslEnabled && (
                          <span className="ml-2 inline-flex items-center gap-1 text-green-500">
                            <Shield className="w-3 h-3" /> SSL
                          </span>
                        )}
                      </p>
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

                {/* Verification instructions for pending domains */}
                {!domain.isVerified && domain.status === "pending" && (
                  <div className="p-3 bg-zinc-900 rounded-lg space-y-3">
                    <p className="text-sm text-zinc-400">
                      Para verificar este dominio, agrega el siguiente registro TXT en tu DNS:
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">Nombre/Host:</span>
                        <code className="text-xs bg-zinc-700 px-2 py-1 rounded text-blue-400">
                          _videosystem
                        </code>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">Tipo:</span>
                        <code className="text-xs bg-zinc-700 px-2 py-1 rounded text-blue-400">
                          TXT
                        </code>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-xs text-zinc-500">Valor:</span>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-zinc-700 px-2 py-1 rounded text-green-400 break-all flex-1">
                            videosystem-verify={domain.verificationToken}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyVerificationToken(domain)}
                            className="border-zinc-600 bg-transparent hover:bg-zinc-700 text-zinc-300 flex-shrink-0"
                          >
                            {copiedToken === domain.id ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => verifyDomain(domain.id)}
                      disabled={verifyingId === domain.id}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      {verifyingId === domain.id ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Verificando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Verificar Dominio
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-zinc-500">
                      Los cambios de DNS pueden tardar hasta 48 horas en propagarse
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Help section */}
        <div className="p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-400 mb-2">Como funciona</h4>
          <ol className="text-xs text-zinc-400 space-y-1 list-decimal list-inside">
            <li>Agrega tu dominio (ej: mivideo.com)</li>
            <li>Copia el registro TXT y agregalo en tu proveedor de DNS</li>
            <li>Espera la propagacion del DNS (puede tardar hasta 48 horas)</li>
            <li>Haz clic en "Verificar Dominio" para confirmar</li>
            <li>Una vez verificado, configura un CNAME apuntando a tu servidor</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
