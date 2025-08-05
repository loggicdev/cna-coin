"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { loginAluno, loginAdmin } from "@/lib/auth"
import { Coins, GraduationCap, Shield } from "lucide-react"

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { login } = useAuth()
  const router = useRouter()

  const handleAlunoLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const username = formData.get("username") as string
    const senha = formData.get("senha") as string

    try {
      const user = await loginAluno(username, senha)
      if (user) {
        login(user)
        router.push("/aluno/dashboard")
      } else {
        setError("Username ou senha inválidos")
      }
    } catch (error) {
      setError("Erro ao fazer login. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const senha = formData.get("senha") as string

    try {
      const user = await loginAdmin(email, senha)
      if (user) {
        login(user)
        router.push("/admin/dashboard")
      } else {
        setError("Email ou senha inválidos")
      }
    } catch (error) {
      setError("Erro ao fazer login. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Coins className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-blue-900">CNA Coin</CardTitle>
          <CardDescription>Sistema de Moedas de Incentivo</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="aluno" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="aluno" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Aluno
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin
              </TabsTrigger>
            </TabsList>

            <TabsContent value="aluno">
              <form onSubmit={handleAlunoLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" name="username" type="text" placeholder="@seuusername" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <Input id="senha" name="senha" type="password" required />
                </div>
                {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Entrando..." : "Entrar como Aluno"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="admin">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="admin@cna.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha-admin">Senha</Label>
                  <Input id="senha-admin" name="senha" type="password" required />
                </div>
                {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Entrando..." : "Entrar como Admin"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Dados de teste:</p>
            <p>
              <strong>Aluno:</strong> @joao123 / password
            </p>
            <p>
              <strong>Admin:</strong> admin@cnasp.com / password
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
