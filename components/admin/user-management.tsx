"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Loader2, UserPlus, Users } from "lucide-react"

interface User {
  id: string
  email: string
  created_at: string
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (err) {
      console.error("Error fetching users:", err)
    }
    setLoading(false)
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, password: newPassword })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al crear usuario')
        setCreating(false)
        return
      }

      setSuccess(`Usuario ${newEmail} creado exitosamente`)
      setNewEmail("")
      setNewPassword("")
      setShowForm(false)
      
      setTimeout(() => {
        fetchUsers()
        setSuccess(null)
      }, 2000)
    } catch {
      setError('Error al crear usuario')
    }

    setCreating(false)
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`¿Estas seguro de eliminar al usuario ${userEmail}?`)) return

    try {
      const res = await fetch(`/api/auth/users?id=${userId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        setError("Error al eliminar usuario: " + data.error)
      } else {
        setSuccess(`Usuario ${userEmail} eliminado`)
        fetchUsers()
        setTimeout(() => setSuccess(null), 2000)
      }
    } catch {
      setError("Error al eliminar usuario")
    }
  }

  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Gestion de Usuarios
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Crea usuarios que podran acceder al panel con sus propias configuraciones
          </CardDescription>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)} 
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm">
            {success}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleCreateUser} className="p-4 bg-zinc-800 rounded-lg space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Correo electronico</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
                className="bg-zinc-700 border-zinc-600 text-zinc-100"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Contrasena</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimo 6 caracteres"
                className="bg-zinc-700 border-zinc-600 text-zinc-100"
                minLength={6}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={creating}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Usuario
                  </>
                )}
              </Button>
              <Button 
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="border-zinc-600 bg-transparent hover:bg-zinc-700 text-zinc-300"
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {users.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
            <p className="text-zinc-500">No hay usuarios adicionales</p>
            <p className="text-sm text-zinc-600">Crea usuarios para que puedan gestionar sus propios videos</p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <div 
                key={user.id}
                className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg"
              >
                <div>
                  <p className="text-zinc-100 font-medium">{user.email}</p>
                  <span className="text-xs text-zinc-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteUser(user.id, user.email)}
                  className="border-red-600 bg-transparent hover:bg-red-600/20 text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
