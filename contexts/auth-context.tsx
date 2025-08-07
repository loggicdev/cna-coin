"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { AuthUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

interface AuthContextType {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (updatedUser: AuthUser) => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem("cna-coin-user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])


  const login = async (email: string, password: string) => {
    setIsLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      setIsLoading(false)
      throw error || new Error("Usuário não encontrado")
    }
    // Buscar dados do usuário na tabela user
    const { data: userData, error: userError } = await supabase
      .from('user')
      .select('*')
      .eq('id', data.user.id)
      .single()
    if (userError || !userData) {
      setIsLoading(false)
      throw userError || new Error("Dados do usuário não encontrados")
    }
    setUser(userData)
    localStorage.setItem("cna-coin-user", JSON.stringify(userData))
    setIsLoading(false)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("cna-coin-user")
  }

  const updateUser = (updatedUser: AuthUser) => {
    setUser(updatedUser)
    localStorage.setItem("cna-coin-user", JSON.stringify(updatedUser))
  }

  return <AuthContext.Provider value={{ user, login, logout, updateUser, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
