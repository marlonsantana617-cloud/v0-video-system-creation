import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-red-400">Error de Autenticacion</CardTitle>
          <CardDescription className="text-zinc-400">
            Hubo un problema al iniciar sesion
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/auth/login">Volver al Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
