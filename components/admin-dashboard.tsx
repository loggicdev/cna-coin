"use client"

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
import { Coins, Users, GraduationCap, Plus, LogOut, TrendingUp, Search, Edit, Menu } from "lucide-react"
import { useRouter } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Aluno {
  id: string
  username: string
  nome: string
  saldo_moedas: number
  turma_id: string | null
  turma_nome?: string
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
  const { user, logout } = useAuth()
  const router = useRouter()
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [filteredAlunos, setFilteredAlunos] = useState<Aluno[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [filteredTransacoes, setFilteredTransacoes] = useState<Transacao[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [turmaFilter, setTurmaFilter] = useState("todas")
  const [transacaoTurmaFilter, setTransacaoTurmaFilter] = useState("todas")

  // Estados para modais
  const [showAlunoModal, setShowAlunoModal] = useState(false)
  const [showTurmaModal, setShowTurmaModal] = useState(false)
  const [showMoedasModal, setShowMoedasModal] = useState(false)
  const [showEditAlunoModal, setShowEditAlunoModal] = useState(false)
  const [showEditTurmaModal, setShowEditTurmaModal] = useState(false)
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null)
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null)

  useEffect(() => {
    if (user?.type === "admin") {
      loadData()
    }
  }, [user])

  useEffect(() => {
    filterAlunos()
  }, [alunos, searchTerm, turmaFilter])

  useEffect(() => {
    filterTransacoes()
  }, [transacoes, transacaoTurmaFilter])

  const filterAlunos = () => {
    let filtered = alunos

    if (searchTerm) {
      filtered = filtered.filter(
        (aluno) =>
          aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          aluno.username.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (turmaFilter !== "todas") {
      filtered = filtered.filter((aluno) => aluno.turma_id === turmaFilter)
    }

    setFilteredAlunos(filtered)
  }

  const filterTransacoes = () => {
    let filtered = transacoes

    if (transacaoTurmaFilter !== "todas") {
      const alunosDaTurma = alunos.filter((aluno) => aluno.turma_id === transacaoTurmaFilter)
      const alunoIds = alunosDaTurma.map((aluno) => aluno.id)
      filtered = filtered.filter((transacao) => alunoIds.includes(transacao.aluno_id))
    }

    setFilteredTransacoes(filtered)
  }

  const loadData = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      const todosAlunos = getAlunos()
      const alunosEmpresa = todosAlunos.filter((a) => a.empresa_id === user!.empresa_id)
      const alunosFormatted = alunosEmpresa.map((aluno) => ({
        ...aluno,
        turma_nome: getTurmaNome(aluno.turma_id),
      }))
      setAlunos(alunosFormatted)

      const todasTurmas = getTurmas()
      const turmasEmpresa = todasTurmas.filter((t) => t.empresa_id === user!.empresa_id)
      setTurmas(turmasEmpresa)

      const todasTransacoes = getTransacoes()
      const alunoIds = alunosEmpresa.map((a) => a.id)
      const transacoesEmpresa = todasTransacoes
        .filter((t) => alunoIds.includes(t.aluno_id))
        .map((transacao) => {
          const aluno = alunosEmpresa.find((a) => a.id === transacao.aluno_id)
          return {
            ...transacao,
            aluno_nome: aluno?.nome || "Aluno não encontrado",
          }
        })
        .sort((a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime())

      setTransacoes(transacoesEmpresa)
      setIsLoading(false)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      setIsLoading(false)
    }
  }

  const handleCreateAluno = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      const turmaId = formData.get("turma_id") as string
      addAluno({
        username: formData.get("username") as string,
        nome: formData.get("nome") as string,
        senha: formData.get("senha") as string,
        empresa_id: user!.empresa_id,
        turma_id: turmaId === "none" ? null : turmaId,
        saldo_moedas: 0,
      })

      setShowAlunoModal(false)
      loadData()
    } catch (error) {
      console.error("Erro ao criar aluno:", error)
    }
  }

  const handleEditAluno = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    if (!selectedAluno) return

    try {
      const turmaId = formData.get("turma_id") as string
      const senha = formData.get("senha") as string

      const updates: any = {
        nome: formData.get("nome") as string,
        turma_id: turmaId === "none" ? null : turmaId,
      }

      if (senha) {
        updates.senha = senha
      }

      updateAluno(selectedAluno.id, updates)
      setShowEditAlunoModal(false)
      setSelectedAluno(null)
      loadData()
    } catch (error) {
      console.error("Erro ao editar aluno:", error)
    }
  }

  const handleCreateTurma = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      addTurma({
        nome: formData.get("nome") as string,
        empresa_id: user!.empresa_id,
      })

      setShowTurmaModal(false)
      loadData()
    } catch (error) {
      console.error("Erro ao criar turma:", error)
    }
  }

  const handleEditTurma = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    if (!selectedTurma) return

    try {
      const todasTurmas = getTurmas()
      const turmaIndex = todasTurmas.findIndex((t) => t.id === selectedTurma.id)
      if (turmaIndex !== -1) {
        todasTurmas[turmaIndex].nome = formData.get("nome") as string
        saveTurmas(todasTurmas)
      }

      setShowEditTurmaModal(false)
      setSelectedTurma(null)
      loadData()
    } catch (error) {
      console.error("Erro ao editar turma:", error)
    }
  }

  const handleAddMoedas = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    if (!selectedAluno) return

    try {
      const quantidade = Number.parseInt(formData.get("quantidade") as string)
      const motivo = formData.get("motivo") as string
      const tipo = formData.get("tipo") as "entrada" | "saida"

      addTransacao({
        aluno_id: selectedAluno.id,
        quantidade,
        motivo,
        tipo,
      })

      const novoSaldo =
        tipo === "entrada"
          ? selectedAluno.saldo_moedas + quantidade
          : Math.max(0, selectedAluno.saldo_moedas - quantidade)

      updateAluno(selectedAluno.id, { saldo_moedas: novoSaldo })

      setShowMoedasModal(false)
      setSelectedAluno(null)
      loadData()
    } catch (error) {
      console.error("Erro ao adicionar moedas:", error)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
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

  const totalMoedas = alunos.reduce((sum, aluno) => sum + aluno.saldo_moedas, 0)

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
              <Users className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alunos.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Turmas</CardTitle>
              <GraduationCap className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{turmas.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Moedas em Circulação</CardTitle>
              <Coins className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMoedas}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transações</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transacoes.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Navegação por abas */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("overview")}
              className={activeTab === "overview" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              Visão Geral
            </Button>
            <Button
              variant={activeTab === "alunos" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("alunos")}
              className={activeTab === "alunos" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              Alunos
            </Button>
            <Button
              variant={activeTab === "turmas" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("turmas")}
              className={activeTab === "turmas" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              Turmas
            </Button>
            <Button
              variant={activeTab === "transacoes" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("transacoes")}
              className={activeTab === "transacoes" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              Transações
            </Button>
          </div>
        </div>

        {/* Conteúdo das abas */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Alunos</CardTitle>
                <CardDescription>Alunos com mais CNA Coins</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alunos
                    .sort((a, b) => b.saldo_moedas - a.saldo_moedas)
                    .slice(0, 10)
                    .map((aluno, index) => (
                      <div key={aluno.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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

            <Card>
              <CardHeader>
                <CardTitle>Transações Recentes</CardTitle>
                <CardDescription>Últimas movimentações de moedas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {transacoes.slice(0, 10).map((transacao) => (
                    <div key={transacao.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{transacao.aluno_nome}</p>
                        <p className="text-sm text-gray-600">{transacao.motivo}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(transacao.data_criacao).toLocaleDateString("pt-BR")}
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
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "alunos" && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Gerenciar Alunos</CardTitle>
                  <CardDescription>Lista de todos os alunos da sua rede</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar por nome ou @"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  <Select value={turmaFilter} onValueChange={setTurmaFilter}>
                    <SelectTrigger className="w-full sm:w-48">
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
                  <Dialog open={showAlunoModal} onOpenChange={setShowAlunoModal}>
                    <DialogTrigger asChild>
                      <Button className="bg-red-600 hover:bg-red-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Aluno
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Criar Novo Aluno</DialogTitle>
                        <DialogDescription>Adicione um novo aluno à sua rede</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateAluno} className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input id="username" name="username" placeholder="@username" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nome">Nome</Label>
                          <Input id="nome" name="nome" placeholder="Nome completo" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="senha">Senha</Label>
                          <Input id="senha" name="senha" type="password" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="turma_id">Turma</Label>
                          <Select name="turma_id">
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma turma" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sem turma</SelectItem>
                              {turmas.map((turma) => (
                                <SelectItem key={turma.id} value={turma.id}>
                                  {turma.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                          Criar Aluno
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredAlunos.map((aluno) => (
                  <div key={aluno.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium">{aluno.nome}</p>
                          <p className="text-sm text-gray-500">{aluno.username}</p>
                          {aluno.turma_nome && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {aluno.turma_nome}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="font-bold text-red-600">{aluno.saldo_moedas}</p>
                        <p className="text-xs text-gray-500">coins</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAluno(aluno)
                          setShowEditAlunoModal(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => {
                          setSelectedAluno(aluno)
                          setShowMoedasModal(true)
                        }}
                      >
                        <Coins className="h-4 w-4 mr-1" />
                        Moedas
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "turmas" && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Gerenciar Turmas</CardTitle>
                  <CardDescription>Lista de todas as turmas da sua rede</CardDescription>
                </div>
                <Dialog open={showTurmaModal} onOpenChange={setShowTurmaModal}>
                  <DialogTrigger asChild>
                    <Button className="bg-red-600 hover:bg-red-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Turma
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Nova Turma</DialogTitle>
                      <DialogDescription>Adicione uma nova turma à sua rede</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateTurma} className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome da Turma</Label>
                        <Input id="nome" name="nome" placeholder="Ex: Básico 1" required />
                      </div>
                      <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                        Criar Turma
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {turmas.map((turma) => {
                  const alunosDaTurma = alunos.filter((aluno) => aluno.turma_id === turma.id)
                  return (
                    <Card key={turma.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{turma.nome}</CardTitle>
                            <CardDescription>
                              {alunosDaTurma.length} aluno{alunosDaTurma.length !== 1 ? "s" : ""}
                            </CardDescription>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTurma(turma)
                              setShowEditTurmaModal(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {alunosDaTurma.slice(0, 3).map((aluno) => (
                            <div key={aluno.id} className="flex justify-between items-center text-sm">
                              <span>{aluno.nome}</span>
                              <span className="font-medium text-red-600">{aluno.saldo_moedas}</span>
                            </div>
                          ))}
                          {alunosDaTurma.length > 3 && (
                            <p className="text-xs text-gray-500">
                              +{alunosDaTurma.length - 3} mais aluno{alunosDaTurma.length - 3 !== 1 ? "s" : ""}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "transacoes" && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Histórico de Transações</CardTitle>
                  <CardDescription>Todas as movimentações de moedas da sua rede</CardDescription>
                </div>
                <Select value={transacaoTurmaFilter} onValueChange={setTransacaoTurmaFilter}>
                  <SelectTrigger className="w-full sm:w-48">
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
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredTransacoes.map((transacao) => (
                  <div key={transacao.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{transacao.aluno_nome}</p>
                      <p className="text-sm text-gray-600">{transacao.motivo}</p>
                      <p className="text-xs text-gray-500">
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
                      <Badge variant={transacao.tipo === "entrada" ? "default" : "destructive"}>{transacao.tipo}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal para adicionar/remover moedas */}
      <Dialog open={showMoedasModal} onOpenChange={setShowMoedasModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Moedas</DialogTitle>
            <DialogDescription>Adicionar ou remover moedas de {selectedAluno?.nome}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddMoedas} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Operação</Label>
              <Select name="tipo" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Adicionar Moedas</SelectItem>
                  <SelectItem value="saida">Remover Moedas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input id="quantidade" name="quantidade" type="number" min="1" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo</Label>
              <Textarea id="motivo" name="motivo" placeholder="Descreva o motivo da operação" required />
            </div>
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
              Confirmar Operação
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para editar aluno */}
      <Dialog open={showEditAlunoModal} onOpenChange={setShowEditAlunoModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Aluno</DialogTitle>
            <DialogDescription>Edite as informações do aluno {selectedAluno?.nome}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditAluno} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" defaultValue={selectedAluno?.nome} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="turma_id">Turma</Label>
              <Select name="turma_id" defaultValue={selectedAluno?.turma_id || "none"}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma turma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem turma</SelectItem>
                  {turmas.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>
                      {turma.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

      {/* Modal para editar turma */}
      <Dialog open={showEditTurmaModal} onOpenChange={setShowEditTurmaModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Turma</DialogTitle>
            <DialogDescription>Edite o nome da turma {selectedTurma?.nome}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditTurma} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Turma</Label>
              <Input id="nome" name="nome" defaultValue={selectedTurma?.nome} required />
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
