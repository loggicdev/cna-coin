"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { Coins } from "lucide-react"

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { login } = useAuth()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("senha") as string

    try {
      await login(email, password)
      // Redireciona conforme role
      const userRole = localStorage.getItem("cna-coin-user") ? JSON.parse(localStorage.getItem("cna-coin-user")!).role : null
      if (userRole === "student") {
        router.push("/aluno/dashboard")
      } else if (userRole === "admin") {
        router.push("/admin/dashboard")
      } else {
        setError("") // Não exibe erro de role
      }
    } catch (err) {
      setError("E-mail ou senha inválidos")
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <img src="/cna-logo.png" alt="Logo CNA" className="w-24 h-24 animate-spin mb-4" />
          <span className="text-lg text-red-700 font-bold">Carregando...</span>
        </div>
      ) : (
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src="/cna-logo.png" alt="Logo CNA" className="w-16 h-16 mx-auto" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-900">CNA COIN</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="focus:border-red-500 focus:ring-red-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  name="senha"
                  type="password"
                  className="focus:border-red-500 focus:ring-red-500"
                  required
                />
              </div>
              {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
