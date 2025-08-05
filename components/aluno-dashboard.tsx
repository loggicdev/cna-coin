"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { getAlunos, getTurmas, getTransacoes, saveAlunos } from "@/lib/storage"
import { getTurmaNome } from "@/lib/mock-data"
import { Coins, Trophy, Users, History, LogOut, Menu, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface Transacao {
  id: string
  quantidade: number
  motivo: string
  tipo: "entrada" | "saida"
  data_criacao: string
}

interface AlunoRanking {
  id: string
  nome: string
  username: string
  saldo_moedas: number
  turma_nome: string | null
}

interface Turma {
  id: string
  nome: string
}

export function AlunoDashboard() {
  const { user, logout, login } = useAuth()
  const router = useRouter()
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [ranking, setRanking] = useState<AlunoRanking[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [turmaFiltro, setTurmaFiltro] = useState<string>("todas")
  const [turmaNome, setTurmaNome] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    if (user?.type === "aluno") {
      loadData()
    }
  }, [user])

  useEffect(() => {
    loadRanking()
  }, [turmaFiltro, user])

  const loadData = async () => {
    try {
      // Simular delay de carregamento
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Carregar transações do aluno
      const todasTransacoes = getTransacoes()
      const transacoesAluno = todasTransacoes.filter((t) => t.aluno_id === user!.id)
      setTransacoes(transacoesAluno)

      // Carregar nome da turma do aluno
      if (user!.turma_id) {
        const nome = getTurmaNome(user!.turma_id)
        setTurmaNome(nome || "")
      }

      // Carregar turmas da empresa
      const todasTurmas = getTurmas()
      const turmasEmpresa = todasTurmas.filter((t) => t.empresa_id === user!.empresa_id)
      setTurmas(turmasEmpresa)

      setIsLoading(false)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      setIsLoading(false)
    }
  }

  const loadRanking = async () => {
    try {
      const todosAlunos = getAlunos()
      let alunosEmpresa = todosAlunos.filter((a) => a.empresa_id === user!.empresa_id)

      if (turmaFiltro !== "todas") {
        alunosEmpresa = alunosEmpresa.filter((a) => a.turma_id === turmaFiltro)
      }

      const rankingFormatted: AlunoRanking[] = alunosEmpresa
        .map((aluno) => ({
          id: aluno.id,
          nome: aluno.nome,
          username: aluno.username,
          saldo_moedas: aluno.saldo_moedas,
          turma_nome: getTurmaNome(aluno.turma_id),
        }))
        .sort((a, b) => b.saldo_moedas - a.saldo_moedas)
        .slice(0, 10)

      setRanking(rankingFormatted)
    } catch (error) {
      console.error("Erro ao carregar ranking:", error)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleEditProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      const nome = formData.get("nome") as string
      const senha = formData.get("senha") as string

      // Update user data in storage
      const alunos = getAlunos()
      const alunoIndex = alunos.findIndex((a) => a.id === user!.id)
      if (alunoIndex !== -1) {
        alunos[alunoIndex].nome = nome
        if (senha) {
          alunos[alunoIndex].senha = senha
        }
        saveAlunos(alunos)

        // Update auth context
        login({ ...user!, nome })
      }

      setShowEditModal(false)
      loadData() // Reload data to reflect changes
    } catch (error) {
      console.error("Erro ao editar perfil:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Coins className="h-12 w-12 animate-spin mx-auto mb-4 text-red-600" />
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Coins className="h-8 w-8 text-red-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">CNA COIN</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-sm text-gray-600">Olá, {user?.nome}</div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                    <User className="h-4 w-4 mr-2" />
                    Editar Conta
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meus CNA Coins</CardTitle>
              <Coins className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{user?.saldo_moedas || 0}</div>
              <p className="text-xs text-muted-foreground">Total de moedas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Minha Turma</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{turmaNome || "Não definida"}</div>
              <p className="text-xs text-muted-foreground">Turma atual</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transações</CardTitle>
              <History className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transacoes.length}</div>
              <p className="text-xs text-muted-foreground">Total de movimentações</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ranking */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Ranking Top 10
                  </CardTitle>
                  <CardDescription>Alunos com mais CNA Coins</CardDescription>
                </div>
                <Select value={turmaFiltro} onValueChange={setTurmaFiltro}>
                  <SelectTrigger className="w-48 border-red-200 focus:border-red-500 focus:ring-red-500">
                    <SelectValue placeholder="Filtrar por turma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as turmas</SelectItem>
                    {turmas.map((turma) => (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ranking.map((aluno, index) => (
                  <div
                    key={aluno.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      aluno.id === user?.id ? "bg-red-50 border border-red-200" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0
                            ? "bg-yellow-500 text-white"
                            : index === 1
                              ? "bg-gray-400 text-white"
                              : index === 2
                                ? "bg-amber-600 text-white"
                                : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{aluno.nome}</p>
                        <p className="text-sm text-gray-500">{aluno.username}</p>
                        {aluno.turma_nome && (
                          <Badge variant="outline" className="text-xs">
                            {aluno.turma_nome}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{aluno.saldo_moedas}</p>
                      <p className="text-xs text-gray-500">coins</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Transações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-purple-600" />
                Meu Histórico
              </CardTitle>
              <CardDescription>Suas últimas movimentações de moedas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transacoes.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Nenhuma transação encontrada</p>
                ) : (
                  transacoes.map((transacao) => (
                    <div key={transacao.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{transacao.motivo}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(transacao.data_criacao).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${transacao.tipo === "entrada" ? "text-green-600" : "text-red-600"}`}>
                          {transacao.tipo === "entrada" ? "+" : "-"}
                          {transacao.quantidade}
                        </p>
                        <Badge variant={transacao.tipo === "entrada" ? "default" : "destructive"}>
                          {transacao.tipo}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Modal para editar perfil */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>Atualize suas informações pessoais</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditProfile} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" defaultValue={user?.nome} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Nova Senha (opcional)</Label>
              <Input id="senha" name="senha" type="password" />
            </div>
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
              Salvar Alterações
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
