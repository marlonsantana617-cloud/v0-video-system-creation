import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifySession } from "@/lib/auth"
import { randomBytes } from "crypto"

interface DomainRow {
  id: number
  user_id: string
  domain: string
  is_verified: number
  verification_token: string | null
  ssl_enabled: number
  status: string
  created_at: string
  updated_at: string
}

// GET - List user domains
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await verifySession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: "Sesion invalida" }, { status: 401 })
    }

    const domains = await query<DomainRow>(
      "SELECT * FROM user_domains WHERE user_id = ? ORDER BY created_at DESC",
      [user.id]
    )

    const formattedDomains = domains.map(d => ({
      id: d.id,
      userId: d.user_id,
      domain: d.domain,
      isVerified: Boolean(d.is_verified),
      verificationToken: d.verification_token,
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

// POST - Add new domain
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await verifySession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: "Sesion invalida" }, { status: 401 })
    }

    const { domain } = await request.json()

    if (!domain) {
      return NextResponse.json({ error: "Dominio requerido" }, { status: 400 })
    }

    // Validate domain format
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
    const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/.*$/, "")
    
    if (!domainRegex.test(cleanDomain)) {
      return NextResponse.json({ error: "Formato de dominio invalido" }, { status: 400 })
    }

    // Check if domain already exists
    const existing = await query<DomainRow>(
      "SELECT id FROM user_domains WHERE domain = ?",
      [cleanDomain]
    )

    if (existing.length > 0) {
      return NextResponse.json({ error: "Este dominio ya esta registrado" }, { status: 400 })
    }

    // Generate verification token
    const verificationToken = randomBytes(32).toString("hex")

    // Insert domain
    await query(
      `INSERT INTO user_domains (user_id, domain, verification_token, status) 
       VALUES (?, ?, ?, 'pending')`,
      [user.id, cleanDomain, verificationToken]
    )

    // Get the inserted domain
    const [newDomain] = await query<DomainRow>(
      "SELECT * FROM user_domains WHERE domain = ?",
      [cleanDomain]
    )

    return NextResponse.json({
      success: true,
      domain: {
        id: newDomain.id,
        userId: newDomain.user_id,
        domain: newDomain.domain,
        isVerified: Boolean(newDomain.is_verified),
        verificationToken: newDomain.verification_token,
        sslEnabled: Boolean(newDomain.ssl_enabled),
        status: newDomain.status,
        createdAt: newDomain.created_at,
        updatedAt: newDomain.updated_at
      }
    })
  } catch (error) {
    console.error("Error adding domain:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// DELETE - Remove domain
export async function DELETE(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await verifySession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: "Sesion invalida" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const domainId = searchParams.get("id")

    if (!domainId) {
      return NextResponse.json({ error: "ID de dominio requerido" }, { status: 400 })
    }

    // Verify domain belongs to user
    const [domain] = await query<DomainRow>(
      "SELECT * FROM user_domains WHERE id = ? AND user_id = ?",
      [domainId, user.id]
    )

    if (!domain) {
      return NextResponse.json({ error: "Dominio no encontrado" }, { status: 404 })
    }

    // Delete domain
    await query("DELETE FROM user_domains WHERE id = ?", [domainId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting domain:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
