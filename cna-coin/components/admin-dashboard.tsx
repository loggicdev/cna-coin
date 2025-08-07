// ...existing code...
import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"
import {
  getAlunos,
  getTurmas,
  getTransacoes,
  addAluno,
  addTurma,
  addTransacao,
  updateAluno,
  saveTurmas,
} from "@/lib/storage"
import { getTurmaNome } from "@/lib/mock-data"
import { supabase } from "@/lib/supabase"
import { Coins, Users, GraduationCap, Plus, LogOut, TrendingUp, Search, Edit, Menu, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Aluno {
  id: string
  username: string
  nome: string
  saldo_moedas: number
  turma_id: string | null
  turma_nome?: string | null
}

interface Turma {
  id: string
  nome: string
}

interface Transacao {
  id: string
  aluno_id: string
  aluno_nome: string
  quantidade: number
  motivo: string
  tipo: "entrada" | "saida"
  data_criacao: string
}

export function AdminDashboard() {
  // ...existing code...
}
