import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifySession } from "@/lib/auth"

interface DomainRow {
  id: number
  user_id: string
  domain: string
  is_verified: number
  verification_token: string | null
  ssl_enabled: number
  status: string
}

// POST - Verify domain ownership via DNS TXT record
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

    const { domainId } = await request.json()

    if (!domainId) {
      return NextResponse.json({ error: "ID de dominio requerido" }, { status: 400 })
    }

    // Get domain
    const [domain] = await query<DomainRow>(
      "SELECT * FROM user_domains WHERE id = ? AND user_id = ?",
      [domainId, user.id]
    )

    if (!domain) {
      return NextResponse.json({ error: "Dominio no encontrado" }, { status: 404 })
    }

    // Try to verify DNS TXT record
    try {
      const { Resolver } = await import("dns").then(m => m.promises)
      const resolver = new Resolver()
      resolver.setServers(["8.8.8.8", "1.1.1.1"])

      const txtRecords = await resolver.resolveTxt(`_videosystem.${domain.domain}`)
      const flatRecords = txtRecords.map(r => r.join(""))
      
      const expectedToken = `videosystem-verify=${domain.verification_token}`
      const isVerified = flatRecords.some(record => record === expectedToken)

      if (isVerified) {
        // Update domain as verified
        await query(
          "UPDATE user_domains SET is_verified = TRUE, status = 'active' WHERE id = ?",
          [domainId]
        )

        return NextResponse.json({
          success: true,
          verified: true,
          message: "Dominio verificado exitosamente"
        })
      } else {
        return NextResponse.json({
          success: true,
          verified: false,
          message: "Registro TXT no encontrado. Asegurate de haber agregado el registro DNS correctamente.",
          expected: expectedToken,
          found: flatRecords
        })
      }
    } catch (dnsError) {
      console.error("DNS lookup error:", dnsError)
      return NextResponse.json({
        success: true,
        verified: false,
        message: "No se pudo verificar el DNS. El registro TXT puede tardar hasta 48 horas en propagarse."
      })
    }
  } catch (error) {
    console.error("Error verifying domain:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
