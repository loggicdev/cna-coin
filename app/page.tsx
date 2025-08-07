"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { LoginForm } from "@/components/login-form"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "student") {
        router.push("/aluno/dashboard")
      } else if (user.role === "admin") {
        router.push("/admin/dashboard")
      }
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center flex flex-col items-center justify-center">
          <img src="/cna-logo.png" alt="Logo CNA" className="w-24 h-24 animate-spin mb-4" />
          <p className="text-lg text-red-700 font-bold">Carregando...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null // Redirecionamento em andamento
  }

  return <LoginForm />
}
