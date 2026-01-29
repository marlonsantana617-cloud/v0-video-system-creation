import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifySession } from "@/lib/auth"

interface DomainRow {
  id: number
  user_id: string
  domain: string
  is_verified: number
  ssl_enabled: number
  status: string
  created_at: string
  updated_at: string
  user_email?: string
}

// GET - List all domains (admin only)
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await verifySession(sessionToken)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const domains = await query<DomainRow>(
      `SELECT d.*, u.email as user_email 
       FROM user_domains d 
       JOIN users u ON d.user_id = u.id 
       ORDER BY d.created_at DESC`
    )

    const formattedDomains = domains.map(d => ({
      id: d.id,
      userId: d.user_id,
      userEmail: d.user_email,
      domain: d.domain,
      isVerified: Boolean(d.is_verified),
      sslEnabled: Boolean(d.ssl_enabled),
      status: d.status,
      createdAt: d.created_at,
      updatedAt: d.updated_at
    }))

    return NextResponse.json({ domains: formattedDomains })
  } catch (error) {
    console.error("Error fetching domains:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// PATCH - Update domain status (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await verifySession(sessionToken)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const { domainId, status } = await request.json()

    if (!domainId || !status) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    const validStatuses = ["pending", "active", "failed", "suspended"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Estado invalido" }, { status: 400 })
    }

    // Update domain status
    await query(
      "UPDATE user_domains SET status = ?, is_verified = ? WHERE id = ?",
      [status, status === "active" ? 1 : 0, domainId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating domain:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// DELETE - Delete any domain (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await verifySession(sessionToken)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const domainId = searchParams.get("id")

    if (!domainId) {
      return NextResponse.json({ error: "ID de dominio requerido" }, { status: 400 })
    }

    await query("DELETE FROM user_domains WHERE id = ?", [domainId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting domain:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
