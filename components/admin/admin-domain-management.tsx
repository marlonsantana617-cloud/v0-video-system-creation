"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Globe, Trash2, CheckCircle2, XCircle, Clock, 
  RefreshCw, AlertCircle, Check, X, Ban
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AdminDomain {
  id: number
  userId: string
  userEmail: string
  domain: string
  isVerified: boolean
  sslEnabled: boolean
  status: string
  createdAt: string
  updatedAt: string
}

export function AdminDomainManagement() {
  const [domains, setDomains] = useState<AdminDomain[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    fetchDomains()
  }, [])

  const fetchDomains = async () => {
    try {
      const res = await fetch("/api/admin/domains")
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

  const updateDomainStatus = async (domainId: number, newStatus: string) => {
    setUpdatingId(domainId)
    try {
      const res = await fetch("/api/admin/domains", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId, status: newStatus })
      })

      if (res.ok) {
        setDomains(domains.map(d => 
          d.id === domainId 
            ? { ...d, status: newStatus, isVerified: newStatus === "active" }
            : d
        ))
      }
    } catch (err) {
      console.error("Error updating domain:", err)
    } finally {
      setUpdatingId(null)
    }
  }

  const deleteDomain = async (id: number) => {
    if (!confirm("Estas seguro de eliminar este dominio?")) return

    try {
      const res = await fetch(`/api/admin/domains?id=${id}`, { method: "DELETE" })
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
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "suspended":
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      default:
        return <Clock className="w-4 h-4 text-zinc-500" />
    }
  }

  const filteredDomains = filter === "all" 
    ? domains 
    : domains.filter(d => d.status === filter)

  const statusCounts = {
    all: domains.length,
    pending: domains.filter(d => d.status === "pending").length,
    active: domains.filter(d => d.status === "active").length,
    suspended: domains.filter(d => d.status === "suspended").length,
    failed: domains.filter(d => d.status === "failed").length,
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
          Gestion de Dominios
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Aprueba o rechaza los dominios de los usuarios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className={filter === "all" ? "bg-blue-600" : "bg-transparent border-zinc-700"}
          >
            Todos ({statusCounts.all})
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("pending")}
            className={filter === "pending" ? "bg-yellow-600" : "bg-transparent border-zinc-700"}
          >
            <Clock className="w-3 h-3 mr-1" />
            Pendientes ({statusCounts.pending})
          </Button>
          <Button
            variant={filter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("active")}
            className={filter === "active" ? "bg-green-600" : "bg-transparent border-zinc-700"}
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Activos ({statusCounts.active})
          </Button>
          <Button
            variant={filter === "suspended" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("suspended")}
            className={filter === "suspended" ? "bg-orange-600" : "bg-transparent border-zinc-700"}
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            Suspendidos ({statusCounts.suspended})
          </Button>
        </div>

        {/* Domains list */}
        {filteredDomains.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
              <Globe className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-zinc-500">No hay dominios {filter !== "all" ? `con estado "${filter}"` : ""}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDomains.map((domain) => (
              <div 
                key={domain.id} 
                className="p-4 bg-zinc-800 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(domain.status)}
                    <div>
                      <h3 className="font-medium text-zinc-100">{domain.domain}</h3>
                      <p className="text-xs text-zinc-500">
                        Usuario: {domain.userEmail}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Quick actions for pending */}
                    {domain.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateDomainStatus(domain.id, "active")}
                          disabled={updatingId === domain.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateDomainStatus(domain.id, "failed")}
                          disabled={updatingId === domain.id}
                          className="border-red-600 bg-transparent hover:bg-red-600/20 text-red-400"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Rechazar
                        </Button>
                      </>
                    )}

                    {/* Status dropdown for other states */}
                    {domain.status !== "pending" && (
                      <Select
                        value={domain.status}
                        onValueChange={(value) => updateDomainStatus(domain.id, value)}
                        disabled={updatingId === domain.id}
                      >
                        <SelectTrigger className="w-[140px] bg-zinc-700 border-zinc-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          <SelectItem value="active" className="text-green-400">
                            <span className="flex items-center gap-2">
                              <CheckCircle2 className="w-3 h-3" /> Activo
                            </span>
                          </SelectItem>
                          <SelectItem value="pending" className="text-yellow-400">
                            <span className="flex items-center gap-2">
                              <Clock className="w-3 h-3" /> Pendiente
                            </span>
                          </SelectItem>
                          <SelectItem value="suspended" className="text-orange-400">
                            <span className="flex items-center gap-2">
                              <Ban className="w-3 h-3" /> Suspendido
                            </span>
                          </SelectItem>
                          <SelectItem value="failed" className="text-red-400">
                            <span className="flex items-center gap-2">
                              <XCircle className="w-3 h-3" /> Rechazado
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}

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

                <div className="text-xs text-zinc-500">
                  Agregado: {new Date(domain.createdAt).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
