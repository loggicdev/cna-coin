import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { getAlunos, getTurmas, getTransacoes, saveAlunos } from "@/lib/storage"
import { getTurmaNome } from "@/lib/mock-data"
import { Coins, Trophy, Users, History, LogOut, Menu, User, TrendingUp, TrendingDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import toast, { Toaster } from 'react-hot-toast'

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

interface TransacaoStats {
  total: number
  totalEntradas: number
  totalSaidas: number
  somaEntradas: number
  somaSaidas: number
  saldoMovimentado: number
}

export function AlunoDashboard() {
  const { user, logout, login, updateUser } = useAuth()
  const router = useRouter()
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [ranking, setRanking] = useState<AlunoRanking[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [turmaFiltro, setTurmaFiltro] = useState<string>("todas")
  const [turmaNome, setTurmaNome] = useState<string>("")
  const [transacaoStats, setTransacaoStats] = useState<TransacaoStats>({
    total: 0,
    totalEntradas: 0,
    totalSaidas: 0,
    somaEntradas: 0,
    somaSaidas: 0,
    saldoMovimentado: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  // Adicionar estado para nome da empresa
  const [empresaNome, setEmpresaNome] = useState<string>("")

  useEffect(() => {
    async function fetchEmpresaNome() {
      if (user?.empresa_id) {
        const { data, error } = await supabase
          .from('empresa')
          .select('nome')
          .eq('id', user.empresa_id)
          .single()
        if (!error && data) {
          setEmpresaNome(data.nome)
        }
      }
    }
    fetchEmpresaNome()
  }, [user])

  // Validação: só permite acesso se estiver logado e for student
  if (typeof window !== "undefined" && (!user || user.role !== "student")) {
    router.push("/")
    return null
  }

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadRanking()
    }
  }, [turmaFiltro, user])

  const loadData = async () => {
    try {
      // Buscar transações do aluno via Supabase com paginação (últimas 20)
      const { data: transacoesData, error: transacoesError } = await supabase
        .from('transacao')
        .select('id, quantidade, motivo, tipo, created_at, user_id')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20) // Limitar a 20 transações mais recentes
      if (transacoesError) {
        console.error('Erro ao buscar transações:', transacoesError)
        setTransacoes([])
      } else {
        // Mapear para o formato esperado pelo componente e calcular estatísticas
        const transacoesFormatadas = (transacoesData || []).map((t: any) => ({
          id: t.id,
          quantidade: t.quantidade,
          motivo: t.motivo,
          tipo: t.tipo,
          data_criacao: t.created_at,
        }))
        
        // Calcular estatísticas das transações
        const stats = transacoesFormatadas.reduce((acc, t) => {
          acc.total += 1
          if (t.tipo === 'entrada') {
            acc.totalEntradas += 1
            acc.somaEntradas += t.quantidade
            acc.saldoMovimentado += t.quantidade
          } else {
            acc.totalSaidas += 1
            acc.somaSaidas += t.quantidade
            acc.saldoMovimentado -= t.quantidade
          }
          return acc
        }, { total: 0, totalEntradas: 0, totalSaidas: 0, somaEntradas: 0, somaSaidas: 0, saldoMovimentado: 0 })
        
        setTransacoes(transacoesFormatadas)
        setTransacaoStats(stats)
      }

      // Buscar nome da turma do aluno via Supabase com JOIN
      if (user!.turma_id) {
        const { data: userData, error: userError } = await supabase
          .from('user')
          .select(`
            turma:turma_id (
              nome
            )
          `)
          .eq('id', user!.id)
          .single()
        
        if (userError) {
          console.error('Erro ao buscar turma do usuário:', userError)
          setTurmaNome("")
        } else {
          // userData.turma é um array, pegamos o primeiro elemento
          const turmaData = userData?.turma as any
          setTurmaNome(turmaData?.nome || "")
        }
      }

      // Buscar turmas da empresa via Supabase
      const { data: turmasData, error: turmasError } = await supabase
        .from('turma')
        .select('id, nome, empresa_id')
        .eq('empresa_id', user!.empresa_id)
      if (turmasError) {
        console.error('Erro ao buscar turmas:', turmasError)
        setTurmas([])
      } else {
        setTurmas(turmasData || [])
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      setIsLoading(false)
    }
  }

  const loadRanking = async () => {
    try {
      // Buscar top 10 alunos da empresa do tipo student via Supabase com JOIN para evitar N+1 queries
      let query = supabase
        .from('user')
        .select(`
          id, 
          nome, 
          email, 
          saldo_moedas, 
          turma_id,
          role,
          turma:turma_id (
            nome
          )
        `)
        .eq('empresa_id', user!.empresa_id)
        .eq('role', 'student')
        .order('saldo_moedas', { ascending: false })
        .limit(10)

      if (turmaFiltro !== 'todas') {
        query = query.eq('turma_id', turmaFiltro)
      }

      const { data: alunosEmpresa, error: alunosError } = await query
      if (alunosError) throw alunosError

      // Mapear dados já com nome da turma incluído via JOIN
      const rankingFormatted: AlunoRanking[] = (alunosEmpresa || []).map((aluno: any) => ({
        id: aluno.id,
        nome: aluno.nome,
        username: aluno.email, // Exibe email abaixo do nome
        saldo_moedas: aluno.saldo_moedas,
        turma_nome: aluno.turma?.nome || null,
      }))
      
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
      const senhaAtual = formData.get("senhaAtual") as string
      const novaSenha = formData.get("novaSenha") as string

      // Validar senha atual se uma nova senha foi fornecida
      if (novaSenha && !senhaAtual) {
        toast.error("Para alterar a senha, você deve informar a senha atual.")
        return
      }

      // Se uma nova senha foi fornecida, validar a senha atual
      if (novaSenha && senhaAtual) {
        if (!user?.email) {
          toast.error("Erro: email do usuário não encontrado.")
          return
        }
        
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: senhaAtual
        })
        
        if (authError) {
          toast.error("Senha atual incorreta.")
          return
        }
      }

      // Mostrar loading
      const loadingToast = toast.loading('Atualizando perfil...')

      // Atualizar nome no Supabase
      const { error: updateError } = await supabase
        .from('user')
        .update({ nome: nome })
        .eq('id', user!.id)

      if (updateError) {
        console.error('Erro ao atualizar nome:', updateError)
        toast.dismiss(loadingToast)
        toast.error("Erro ao atualizar o nome. Tente novamente.")
        return
      }

      // Atualizar senha se fornecida
      if (novaSenha) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: novaSenha
        })
        
        if (passwordError) {
          console.error('Erro ao atualizar senha:', passwordError)
          toast.dismiss(loadingToast)
          toast.error("Erro ao atualizar a senha. Tente novamente.")
          return
        }
      }

      // Atualizar contexto local
      const updatedUser = { ...user!, nome: nome }
      updateUser(updatedUser)
      
      toast.dismiss(loadingToast)
      toast.success(novaSenha ? "Perfil e senha atualizados com sucesso!" : "Perfil atualizado com sucesso!")
      setShowEditModal(false)
      
      // Recarregar dados para refletir mudanças
      loadData()
    } catch (error) {
      console.error("Erro ao editar perfil:", error)
      toast.error("Erro inesperado. Tente novamente.")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center flex flex-col items-center justify-center">
          <img src="/cna-logo.png" alt="Logo Empresa" className="w-24 h-24 animate-spin mb-4" />
          <p className="text-lg text-red-700 font-bold">Carregando...</p>
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
            <div className="flex items-center cursor-pointer" onClick={handleLogout} title="Sair">
              <img src="/cna-logo.png" alt="Logo Empresa" className="h-8 w-8 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">{empresaNome || "Empresa"}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-sm text-gray-600">Olá, {user?.nome}</div>
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="relative hover:bg-gray-100"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
                
                {showMenu && (
                  <>
                    {/* Overlay para fechar o menu */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowMenu(false)}
                    />
                    {/* Menu dropdown */}
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user?.nome}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowEditModal(true)
                            setShowMenu(false)
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Editar Conta
                        </button>
                        <button
                          onClick={() => {
                            handleLogout()
                            setShowMenu(false)
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sair
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meus {empresaNome || "Empresa"} Coins</CardTitle>
              <Coins className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{user?.saldo_moedas ?? 0}</div>
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
              <div className="p-1 bg-purple-100 rounded-full">
                <History className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-green-50 rounded-lg p-2 border border-green-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-medium text-green-700">Entradas</span>
                      </div>
                      <span className="text-sm font-bold text-green-600">{transacaoStats.totalEntradas}</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">+{transacaoStats.somaEntradas} coins</p>
                  </div>
                  
                  <div className="bg-red-50 rounded-lg p-2 border border-red-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <TrendingDown className="h-3 w-3 text-red-600" />
                        <span className="text-xs font-medium text-red-700">Saídas</span>
                      </div>
                      <span className="text-sm font-bold text-red-600">{transacaoStats.totalSaidas}</span>
                    </div>
                    <p className="text-xs text-red-600 mt-1">-{transacaoStats.somaSaidas} coins</p>
                  </div>
                </div>
              </div>
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
                  <CardDescription>Alunos com mais {empresaNome || "Empresa"} Coins</CardDescription>
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
                {ranking.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    {turmaFiltro === 'todas' ? 'Nenhum aluno encontrado' : 'Nenhum aluno encontrado nesta turma'}
                  </p>
                ) : (
                  ranking.map((aluno, index) => (
                    <div
                      key={aluno.id}
                      className={`flex items-center justify-between p-3 rounded-lg transition-all hover:shadow-md ${
                        aluno.id === user?.id ? "bg-red-50 border border-red-200 shadow-sm" : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                            index === 0
                              ? "bg-yellow-500 text-white shadow-lg"
                              : index === 1
                                ? "bg-gray-400 text-white shadow-md"
                                : index === 2
                                  ? "bg-amber-600 text-white shadow-md"
                                  : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className={`font-medium ${aluno.id === user?.id ? 'text-red-700' : ''}`}>
                            {aluno.nome}
                            {aluno.id === user?.id && <span className="text-red-500 ml-1">(Você)</span>}
                          </p>
                          <p className="text-sm text-gray-500">{aluno.username}</p>
                          {aluno.turma_nome && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {aluno.turma_nome}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600 text-lg">{aluno.saldo_moedas}</p>
                        <p className="text-xs text-gray-500">coins</p>
                      </div>
                    </div>
                  ))
                )}
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
              <CardDescription>Suas últimas 20 movimentações de moedas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transacoes.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Nenhuma transação encontrada</p>
                ) : (
                  transacoes.map((transacao, index) => (
                    <div key={transacao.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{transacao.motivo}</p>
                          <Badge 
                            variant={transacao.tipo === "entrada" ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {transacao.tipo}
                          </Badge>
                        </div>
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
                        <p className={`font-bold text-lg ${transacao.tipo === "entrada" ? "text-green-600" : "text-red-600"}`}>
                          {transacao.tipo === "entrada" ? "+" : "-"}
                          {transacao.quantidade}
                        </p>
                        <p className="text-xs text-gray-500">coins</p>
                      </div>
                    </div>
                  ))
                )}
                {transacoes.length >= 20 && (
                  <div className="text-center pt-4">
                    <p className="text-sm text-gray-500">Mostrando últimas 20 transações</p>
                  </div>
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
          <form onSubmit={handleEditProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" defaultValue={user?.nome} required />
            </div>
            
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Alterar Senha</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="senhaAtual">Senha Atual</Label>
                  <Input 
                    id="senhaAtual" 
                    name="senhaAtual" 
                    type="password" 
                    placeholder="Digite sua senha atual"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="novaSenha">Nova Senha</Label>
                  <Input 
                    id="novaSenha" 
                    name="novaSenha" 
                    type="password" 
                    placeholder="Digite a nova senha"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Deixe em branco se não quiser alterar a senha
                </p>
              </div>
            </div>
            
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
              Salvar Alterações
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Toast Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
          loading: {
            iconTheme: {
              primary: '#6366f1',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  )
}
