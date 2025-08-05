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
import { getAlunos, getTurmas, getTransacoes, addAluno, addTurma, addTransacao, updateAluno } from "@/lib/storage"
import { getTurmaNome } from "@/lib/mock-data"
import { Coins, Users, GraduationCap, Plus, LogOut, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"

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
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  // Estados para modais
  const [showAlunoModal, setShowAlunoModal] = useState(false)
  const [showTurmaModal, setShowTurmaModal] = useState(false)
  const [showMoedasModal, setShowMoedasModal] = useState(false)
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null)

  useEffect(() => {
    if (user?.type === "admin") {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      // Simular delay de carregamento
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Carregar alunos da empresa
      const todosAlunos = getAlunos()
      const alunosEmpresa = todosAlunos.filter((a) => a.empresa_id === user!.empresa_id)
      const alunosFormatted = alunosEmpresa.map((aluno) => ({
        ...aluno,
        turma_nome: getTurmaNome(aluno.turma_id),
      }))
      setAlunos(alunosFormatted)

      // Carregar turmas da empresa
      const todasTurmas = getTurmas()
      const turmasEmpresa = todasTurmas.filter((t) => t.empresa_id === user!.empresa_id)
      setTurmas(turmasEmpresa)

      // Carregar transações da empresa
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
        .slice(0, 20)

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

  const handleAddMoedas = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    if (!selectedAluno) return

    try {
      const quantidade = Number.parseInt(formData.get("quantidade") as string)
      const motivo = formData.get("motivo") as string
      const tipo = formData.get("tipo") as "entrada" | "saida"

      // Inserir transação
      addTransacao({
        aluno_id: selectedAluno.id,
        quantidade,
        motivo,
        tipo,
      })

      // Atualizar saldo do aluno
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
          <Coins className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
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
              <Coins className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">CNA Coin - Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Olá, {user?.nome}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
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
              <Users className="h-4 w-4 text-blue-600" />
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
            >
              Visão Geral
            </Button>
            <Button
              variant={activeTab === "alunos" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("alunos")}
            >
              Alunos
            </Button>
            <Button
              variant={activeTab === "turmas" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("turmas")}
            >
              Turmas
            </Button>
            <Button
              variant={activeTab === "transacoes" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("transacoes")}
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
                          <p className="font-bold text-blue-600">{aluno.saldo_moedas}</p>
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
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Gerenciar Alunos</CardTitle>
                  <CardDescription>Lista de todos os alunos da sua rede</CardDescription>
                </div>
                <Dialog open={showAlunoModal} onOpenChange={setShowAlunoModal}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Aluno
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Novo Aluno</DialogTitle>
                      <DialogDescription>Adicione um novo aluno à sua rede</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateAluno} className="space-y-4">
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" name="username" placeholder="@username" required />
                      </div>
                      <div>
                        <Label htmlFor="nome">Nome</Label>
                        <Input id="nome" name="nome" placeholder="Nome completo" required />
                      </div>
                      <div>
                        <Label htmlFor="senha">Senha</Label>
                        <Input id="senha" name="senha" type="password" required />
                      </div>
                      <div>
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
                      <Button type="submit" className="w-full">
                        Criar Aluno
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alunos.map((aluno) => (
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
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-bold text-blue-600">{aluno.saldo_moedas}</p>
                        <p className="text-xs text-gray-500">coins</p>
                      </div>
                      <Button
                        size="sm"
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
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Turma
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Nova Turma</DialogTitle>
                      <DialogDescription>Adicione uma nova turma à sua rede</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateTurma} className="space-y-4">
                      <div>
                        <Label htmlFor="nome">Nome da Turma</Label>
                        <Input id="nome" name="nome" placeholder="Ex: Básico 1" required />
                      </div>
                      <Button type="submit" className="w-full">
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
                        <CardTitle className="text-lg">{turma.nome}</CardTitle>
                        <CardDescription>
                          {alunosDaTurma.length} aluno{alunosDaTurma.length !== 1 ? "s" : ""}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {alunosDaTurma.slice(0, 3).map((aluno) => (
                            <div key={aluno.id} className="flex justify-between items-center text-sm">
                              <span>{aluno.nome}</span>
                              <span className="font-medium text-blue-600">{aluno.saldo_moedas}</span>
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
              <CardTitle>Histórico de Transações</CardTitle>
              <CardDescription>Todas as movimentações de moedas da sua rede</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transacoes.map((transacao) => (
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
          <form onSubmit={handleAddMoedas} className="space-y-4">
            <div>
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
            <div>
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input id="quantidade" name="quantidade" type="number" min="1" required />
            </div>
            <div>
              <Label htmlFor="motivo">Motivo</Label>
              <Textarea id="motivo" name="motivo" placeholder="Descreva o motivo da operação" required />
            </div>
            <Button type="submit" className="w-full">
              Confirmar Operação
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
