// ...existing code...
import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
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
import { Coins, Users, GraduationCap, Plus, LogOut, TrendingUp, Search, Edit, Menu, Trash2, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast, Toaster } from "@/components/ui/hot-toast"

interface Aluno {
  id: string
  username?: string
  email: string
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
  user_id: string
  quantidade: number
  motivo: string
  tipo: "entrada" | "saida"
  created_at: string
  user?: {
    nome: string
  }
}

export function AdminDashboard() {
  const [totalTurmasSupabase, setTotalTurmasSupabase] = useState<number>(0)
  const [empresaNome, setEmpresaNome] = useState<string>("")

  const fetchTotalTurmasSupabase = async () => {
    if (!user?.empresa_id) return
    const { count, error } = await supabase
      .from('turma')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', user.empresa_id)
    if (!error && typeof count === 'number') {
      setTotalTurmasSupabase(count)
    }
  }

  const fetchEmpresaNome = async () => {
    if (!user?.empresa_id) return
    const { data, error } = await supabase
      .from('empresas')
      .select('nome')
      .eq('id', user.empresa_id)
      .single()
    if (!error && data?.nome) {
      setEmpresaNome(data.nome)
    } else {
      setEmpresaNome("CNA COIN")
    }
  }
  const { user, logout } = useAuth()
  const router = useRouter()
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [alunosSupabase, setAlunosSupabase] = useState<any[]>([])
  const [totalAlunos, setTotalAlunos] = useState<number>(0)
  const [filteredAlunos, setFilteredAlunos] = useState<Aluno[]>([])
  const [filteredTurmas, setFilteredTurmas] = useState<Turma[]>([])
  const [transacoesSupabase, setTransacoesSupabase] = useState<any[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  
  // Busca turmas do Supabase MCP
  const fetchTurmasSupabase = async () => {
    if (!user?.empresa_id) return
    const { data, error } = await supabase
      .from('turma')
      .select('id, nome, empresa_id')
      .eq('empresa_id', user.empresa_id)
      .order('nome')
    if (!error && Array.isArray(data)) {
      setTurmas(data)
    }
  }

  // Busca turmas com contagem de alunos do Supabase MCP
  const fetchTurmasComAlunos = async () => {
    if (!user?.empresa_id) return
    try {
      // Primeiro buscar turmas
      const { data: turmasData, error: turmasError } = await supabase
        .from('turma')
        .select('id, nome, empresa_id')
        .eq('empresa_id', user.empresa_id)
        .order('nome')
      
      if (turmasError) throw turmasError
      
      // Depois buscar alunos com turma_id (apenas com autenticação válida)
      const { data: alunosData, error: alunosError } = await supabase
        .from('user')
        .select('id, nome, email, saldo_moedas, turma_id, empresa_id')
        .eq('role', 'student')
        .eq('empresa_id', user.empresa_id)
      
      if (alunosError) throw alunosError
      
      if (turmasData) setTurmas(turmasData)
      if (alunosData) setAlunosSupabase(alunosData)
    } catch (error) {
      console.error('Erro ao buscar turmas com alunos:', error)
    }
  }

  const fetchTransacoesSupabase = async () => {
    if (!user?.empresa_id) return
    const { data, error } = await supabase
      .from('transacao')
      .select('id, user_id, quantidade, motivo, tipo, created_at, user: user_id (nome)')
      .eq('empresa_id', user.empresa_id)
      .order('created_at', { ascending: false })
    if (!error && Array.isArray(data)) {
      setTransacoesSupabase(data)
    }
  }
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [filteredTransacoes, setFilteredTransacoes] = useState<Transacao[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [showMenu, setShowMenu] = useState(false)

  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [turmaSearchTerm, setTurmaSearchTerm] = useState("")
  const [turmaFilter, setTurmaFilter] = useState("todas")
  const [transacaoTurmaFilter, setTransacaoTurmaFilter] = useState("todas")
  const [transacaoAlunoFilter, setTransacaoAlunoFilter] = useState("todos")
  const [transacaoTipoFilter, setTransacaoTipoFilter] = useState("todos")
  const [sortOrder, setSortOrder] = useState("alfabetica")

  // Estados para modais
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null)
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null)

  const fetchAlunosSupabase = async () => {
    // Busca todos os alunos (role = 'student') na tabela user do Supabase com turma
    // Apenas usuários que têm autenticação correspondente
    const { data, error } = await supabase
      .from('user')
      .select('id, nome, email, saldo_moedas, turma_id, empresa_id')
      .eq('role', 'student')
      .eq('empresa_id', user!.empresa_id)
    if (!error && Array.isArray(data)) {
      setAlunosSupabase(data)
    }
  }
  const [showAlunoModal, setShowAlunoModal] = useState(false)
  const [showTurmaModal, setShowTurmaModal] = useState(false)
  const [showMoedasModal, setShowMoedasModal] = useState(false)
  const [showEditAlunoModal, setShowEditAlunoModal] = useState(false)
  const [showEditTurmaModal, setShowEditTurmaModal] = useState(false)
  const [showDeleteTurmaModal, setShowDeleteTurmaModal] = useState(false)
  const [showDeleteAlunoModal, setShowDeleteAlunoModal] = useState(false)
  const [isCreatingAluno, setIsCreatingAluno] = useState(false)
  
  // Estados para controlar os selects dos modais
  const [createAlunoTurmaId, setCreateAlunoTurmaId] = useState("none")
  const [editAlunoTurmaId, setEditAlunoTurmaId] = useState("none")

  useEffect(() => {
    if (user?.role === "admin") {
      loadData()
      fetchTotalAlunos()
      fetchTotalTransacoesSupabase()
      fetchTransacoesSupabase()
      fetchTotalTurmasSupabase()
      fetchTurmasComAlunos()
      fetchEmpresaNome()
    }
  }, [user])

  // Aplicar filtros sempre que os dados do Supabase mudarem
  useEffect(() => {
    filterAlunos()
  }, [alunosSupabase])

  const [totalTransacoesSupabase, setTotalTransacoesSupabase] = useState<number>(0)

  const fetchTotalTransacoesSupabase = async () => {
    if (!user?.empresa_id) return
    const { count, error } = await supabase
      .from('transacao')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', user.empresa_id)
    if (!error && typeof count === 'number') {
      setTotalTransacoesSupabase(count)
    }
  }
  const fetchTotalAlunos = async () => {
    // Busca o total de alunos (role = 'student') na tabela user do Supabase
    // Apenas usuários válidos com autenticação
    if (!user?.empresa_id) return
    const { count, error } = await supabase
      .from('user')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student')
      .eq('empresa_id', user.empresa_id)
    if (!error && typeof count === 'number') {
      setTotalAlunos(count)
    }
  }

  useEffect(() => {
    filterAlunos()
  }, [alunosSupabase, searchTerm, turmaFilter, sortOrder])

  useEffect(() => {
    filterTurmas()
  }, [turmas, turmaSearchTerm])

  useEffect(() => {
    filterTransacoes()
  }, [transacoesSupabase, transacaoTurmaFilter, transacaoAlunoFilter, transacaoTipoFilter])

  // Resetar filtro de aluno quando mudar turma
  useEffect(() => {
    setTransacaoAlunoFilter("todos")
  }, [transacaoTurmaFilter])

  const filterAlunos = () => {
    // Começar com uma cópia dos dados originais para não mutar o array original
    let filtered = [...alunosSupabase]

    // Aplicar filtro de busca por texto
    if (searchTerm) {
      filtered = filtered.filter(
        (aluno) =>
          aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          aluno.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Aplicar filtro por turma
    if (turmaFilter !== "todas") {
      if (turmaFilter === "none") {
        filtered = filtered.filter((aluno) => !aluno.turma_id)
      } else {
        filtered = filtered.filter((aluno) => aluno.turma_id === turmaFilter)
      }
    }

    // Aplicar ordenação sempre (independente dos filtros)
    switch (sortOrder) {
      case "alfabetica":
        filtered = filtered.sort((a, b) => a.nome.localeCompare(b.nome))
        break
      case "alfabetica-inversa":
        filtered = filtered.sort((a, b) => b.nome.localeCompare(a.nome))
        break
      case "maior-moeda":
        filtered = filtered.sort((a, b) => (b.saldo_moedas || 0) - (a.saldo_moedas || 0))
        break
      case "menor-moeda":
        filtered = filtered.sort((a, b) => (a.saldo_moedas || 0) - (b.saldo_moedas || 0))
        break
      default:
        filtered = filtered.sort((a, b) => a.nome.localeCompare(b.nome))
    }

    setFilteredAlunos(filtered)
  }

  const filterTurmas = () => {
    let filtered = [...turmas]

    // Aplicar filtro de busca por nome
    if (turmaSearchTerm) {
      filtered = filtered.filter((turma) =>
        turma.nome.toLowerCase().includes(turmaSearchTerm.toLowerCase())
      )
    }

    setFilteredTurmas(filtered)
  }

  const filterTransacoes = () => {
    let filtered = [...transacoesSupabase]

    // Filtro por tipo de transação
    if (transacaoTipoFilter !== "todos") {
      filtered = filtered.filter((transacao) => transacao.tipo === transacaoTipoFilter)
    }

    // Filtro por turma
    if (transacaoTurmaFilter !== "todas") {
      const alunosDaTurma = alunosSupabase.filter((aluno) => aluno.turma_id === transacaoTurmaFilter)
      const alunoIds = alunosDaTurma.map((aluno) => aluno.id)
      filtered = filtered.filter((transacao) => alunoIds.includes(transacao.user_id))
    }

    // Filtro por aluno específico (apenas se uma turma estiver selecionada)
    if (transacaoTurmaFilter !== "todas" && transacaoAlunoFilter !== "todos") {
      filtered = filtered.filter((transacao) => transacao.user_id === transacaoAlunoFilter)
    }

    setFilteredTransacoes(filtered)
  }

  const loadData = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      // Dados agora vêm do Supabase via fetchTurmasComAlunos
      setIsLoading(false)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      setIsLoading(false)
    }
  }

  const handleCreateAluno = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Prevenir múltiplos cliques
    if (isCreatingAluno) return;
    setIsCreatingAluno(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const nome = formData.get("nome") as string;
    const senha = formData.get("senha") as string;
    const turmaId = formData.get("turma_id") as string;
    
    if (senha.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres (limite do Supabase Auth)");
      setIsCreatingAluno(false);
      return;
    }
    
    try {
      // 1. Verificar se o email já existe na tabela user
      const { data: existingUser, error: checkError } = await supabase
        .from('user')
        .select('email')
        .eq('email', email)
        .single()
      
      if (existingUser) {
        throw new Error('Email já está em uso por outro usuário')
      }

      // 2. Criar usuário no Supabase Auth via MCP
      const { data: userCreated, error: authError } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          emailRedirectTo: undefined // Evitar redirecionamento automático
        }
      });
      
      if (authError) throw authError;
      const userId = userCreated.user?.id;
      if (!userId) throw new Error("Falha ao criar usuário no Auth");

      // 3. Inserir registro do aluno na tabela 'user' com saldo inicial 0
      const { error: dbError } = await supabase.from("user").insert({
        id: userId,
        email,
        nome,
        turma_id: turmaId === "none" ? null : turmaId,
        saldo_moedas: 0,
        empresa_id: user!.empresa_id,
        role: 'student',
      });
      
      if (dbError) {
        // Se falhar ao inserir na tabela user, tentar limpar o usuário do Auth
        console.error('Erro ao inserir na tabela user:', dbError)
        throw new Error('Erro ao criar perfil do usuário')
      }

      // 4. Confirmar email automaticamente para permitir login
      try {
        const { error: confirmError } = await supabase.rpc('auto_confirm_user_email', {
          user_id: userId
        });
        if (confirmError) {
          console.log('Aviso: Email não confirmado automaticamente:', confirmError);
        }
      } catch (confirmError) {
        // Não é crítico se falhar, mas logar para debugging
        console.log('Aviso: Email não confirmado automaticamente');
      }

      // 5. Fechar modal e recarregar dados
      setShowAlunoModal(false);
      await fetchTurmasComAlunos();
      await fetchTotalAlunos();
      
      toast.success(`Aluno ${nome} criado com sucesso! Email: ${email} - Login disponível imediatamente`, {
        duration: 5000,
      });
    } catch (error: any) {
      console.error("Erro ao criar aluno:", error);
      const errorMessage = error.message || error.error_description || "Erro desconhecido";
      
      if (errorMessage.includes('User already registered')) {
        toast.error("Email já possui conta. Este email já possui uma conta. Escolha outro email.", {
          duration: 4000,
        });
      } else if (errorMessage.includes('Email já está em uso')) {
        toast.error("Email em uso. Este email já está em uso por outro usuário.", {
          duration: 4000,
        });
      } else {
        toast.error(`Erro ao criar aluno. ${errorMessage.length > 100 ? "Erro interno do sistema. Tente novamente." : errorMessage}`, {
          duration: 4000,
        });
      }
    } finally {
      setIsCreatingAluno(false);
    }
  }

  const handleEditAluno = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    if (!selectedAluno) return

    try {
      const turmaId = formData.get("turma_id") as string
      const nome = formData.get("nome") as string

      const updates: any = {
        nome: nome,
        turma_id: turmaId === "none" ? null : turmaId,
      }

      // Edição via Supabase MCP
      const { error } = await supabase
        .from('user')
        .update(updates)
        .eq('id', selectedAluno.id)
      
      if (error) throw error

      setShowEditAlunoModal(false)
      setSelectedAluno(null)
      await fetchTurmasComAlunos()
      
      toast.success(`Aluno editado com sucesso! As informações de ${nome} foram atualizadas.`, {
        duration: 3000,
      });
    } catch (error) {
      console.error("Erro ao editar aluno:", error)
      toast.error("Erro ao editar aluno", {
        duration: 4000,
      });
    }
  }

  const handleCreateTurma = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      const nome = formData.get("nome") as string
      const empresa_id = user!.empresa_id
      
      // Criação via Supabase MCP
      const { error } = await supabase
        .from('turma')
        .insert([{ nome, empresa_id }])
      
      if (error) throw error
      
      setShowTurmaModal(false)
      await fetchTurmasComAlunos()
      await fetchTotalTurmasSupabase()
      
      toast.success(`Turma criada com sucesso! A turma "${nome}" foi adicionada à sua rede.`, {
        duration: 3000,
      });
    } catch (error) {
      console.error("Erro ao criar turma:", error)
      toast.error("Erro ao criar turma. Não foi possível criar a turma. Tente novamente.", {
        duration: 4000,
      });
    }
  }

  const handleEditTurma = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    if (!selectedTurma) return

    try {
      const nome = formData.get("nome") as string
      
      // Edição via Supabase MCP
      const { error } = await supabase
        .from('turma')
        .update({ nome })
        .eq('id', selectedTurma.id)
      
      if (error) throw error
      
      setShowEditTurmaModal(false)
      setSelectedTurma(null)
      await fetchTurmasComAlunos()
    } catch (error) {
      console.error("Erro ao editar turma:", error)
    }
  }

  const handleDeleteTurma = async () => {
    if (!selectedTurma) return

    try {
      // Primeiro, remover a turma_id dos alunos (deixá-los sem turma)
      const { error: updateError } = await supabase
        .from('user')
        .update({ turma_id: null })
        .eq('turma_id', selectedTurma.id)
      
      if (updateError) throw updateError
      
      // Depois, excluir a turma
      const { error: deleteError } = await supabase
        .from('turma')
        .delete()
        .eq('id', selectedTurma.id)
      
      if (deleteError) throw deleteError
      
      setShowDeleteTurmaModal(false)
      setSelectedTurma(null)
      await fetchTurmasComAlunos()
      await fetchTotalTurmasSupabase()
    } catch (error) {
      console.error("Erro ao excluir turma:", error)
    }
  }

  const handleDeleteAluno = async () => {
    if (!selectedAluno) return

    try {
      // Excluir o aluno do Supabase
      const { error: deleteError } = await supabase
        .from('user')
        .delete()
        .eq('id', selectedAluno.id)
      
      if (deleteError) throw deleteError
      
      setShowDeleteAlunoModal(false)
      setSelectedAluno(null)
      await fetchTurmasComAlunos()
      await fetchTotalAlunos()
      
      toast.success("Aluno excluído com sucesso!", {
        duration: 3000,
      });
    } catch (error) {
      console.error("Erro ao excluir aluno:", error)
      toast.error("Erro ao excluir aluno. Não foi possível excluir o aluno. Tente novamente.", {
        duration: 4000,
      });
    }
  }

  const handleAddMoedas = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    if (!selectedAluno || !user?.empresa_id) return

    try {
      const quantidade = Number.parseInt(formData.get("quantidade") as string)
      const motivo = formData.get("motivo") as string
      const tipo = formData.get("tipo") as "entrada" | "saida"

      // Calcular novo saldo
      const novoSaldo =
        tipo === "entrada"
          ? selectedAluno.saldo_moedas + quantidade
          : Math.max(0, selectedAluno.saldo_moedas - quantidade)

      // 1. Criar transação no Supabase
      const { error: transacaoError } = await supabase
        .from('transacao')
        .insert([{
          user_id: selectedAluno.id,
          quantidade,
          motivo,
          tipo,
          empresa_id: user.empresa_id
        }])

      if (transacaoError) throw transacaoError

      // 2. Atualizar saldo do usuário no Supabase
      const { error: updateError } = await supabase
        .from('user')
        .update({ saldo_moedas: novoSaldo })
        .eq('id', selectedAluno.id)

      if (updateError) throw updateError

      setShowMoedasModal(false)
      setSelectedAluno(null)
      
      // Recarregar dados
      await fetchTurmasComAlunos()
      await fetchTransacoesSupabase()
      await fetchTotalTransacoesSupabase()
      
      const operacao = tipo === "entrada" ? "adicionadas" : "removidas";
      toast.success(`Moedas ${operacao} com sucesso! ${quantidade} moedas ${operacao} para ${selectedAluno.nome}`, {
        duration: 3000,
      });
    } catch (error) {
      console.error("Erro ao adicionar moedas:", error)
      toast.error("Erro na operação. Não foi possível realizar a operação com moedas. Tente novamente.", {
        duration: 4000,
      });
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

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

  const totalMoedas = alunosSupabase.reduce((sum, aluno) => sum + (aluno.saldo_moedas || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" reverseOrder={false} />
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image 
                src="/cna-logo.png" 
                alt="Logo Empresa" 
                width={32} 
                height={32} 
                className="mr-3" 
              />
              <h1 className="text-xl font-semibold text-gray-900">{empresaNome || "CNA COIN"}</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 mb-0">
              <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
              <Users className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent className="pt-0 -mt-2">
              <div className="text-2xl font-bold">{totalAlunos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 mb-0">
              <CardTitle className="text-sm font-medium">Total de Turmas</CardTitle>
              <GraduationCap className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="pt-0 -mt-2">
              <div className="text-2xl font-bold">{totalTurmasSupabase}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 mb-0">
              <CardTitle className="text-sm font-medium">Moedas em Circulação</CardTitle>
              <Coins className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent className="pt-0 -mt-2">
              <div className="text-2xl font-bold">{totalMoedas}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 mb-0">
              <CardTitle className="text-sm font-medium">Transações</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent className="pt-0 -mt-2">
              <div className="text-2xl font-bold">{totalTransacoesSupabase}</div>
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
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>Top 10 Alunos</CardTitle>
                <CardDescription>Alunos com mais {empresaNome} Coins</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alunosSupabase
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
                            <p className="text-sm text-gray-500">{aluno.email}</p>
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

            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>Transações Recentes</CardTitle>
                <CardDescription>Últimas movimentações de moedas</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto min-h-[320px] max-h-[480px]">
                <div className="space-y-3">
                  {transacoesSupabase.map((transacao) => (
                    <div key={transacao.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{transacao.user?.nome || "Aluno"}</p>
                        <p className="text-sm text-gray-600">{transacao.motivo}</p>
                        <p className="text-xs text-gray-500">
                          {transacao.created_at ? new Date(transacao.created_at).toLocaleDateString("pt-BR") : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${transacao.tipo === "entrada" ? "text-green-600" : "text-red-600"}`}>
                          {transacao.tipo === "entrada" ? `+${transacao.quantidade}` : `-${transacao.quantidade}`}
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
                      placeholder="Buscar por nome ou email"
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
                      <SelectItem value="todas">Todas as turmas ({alunosSupabase.length})</SelectItem>
                      {turmas.map((turma) => {
                        const alunosDaTurma = alunosSupabase.filter(aluno => aluno.turma_id === turma.id).length
                        return (
                          <SelectItem key={turma.id} value={turma.id}>
                            {turma.nome} ({alunosDaTurma})
                          </SelectItem>
                        )
                      })}
                      <SelectItem value="none">
                        Sem turma ({alunosSupabase.filter(aluno => !aluno.turma_id).length})
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alfabetica">Alfabética (A-Z)</SelectItem>
                      <SelectItem value="alfabetica-inversa">Alfabética (Z-A)</SelectItem>
                      <SelectItem value="maior-moeda">Mais moedas</SelectItem>
                      <SelectItem value="menor-moeda">Menos moedas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Dialog open={showAlunoModal} onOpenChange={(open: boolean) => {
                    setShowAlunoModal(open)
                    if (!open) {
                      setIsCreatingAluno(false)
                      setCreateAlunoTurmaId("none")
                    }
                  }}>
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
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" name="email" type="email" placeholder="email@exemplo.com" required />
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
                          <Select value={createAlunoTurmaId} onValueChange={setCreateAlunoTurmaId}>
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
                          <input type="hidden" name="turma_id" value={createAlunoTurmaId} />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full bg-red-600 hover:bg-red-700"
                          disabled={isCreatingAluno}
                        >
                          {isCreatingAluno ? "Criando..." : "Criar Aluno"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredAlunos.map((aluno) => {
                  const turmaNome = turmas.find(t => t.id === aluno.turma_id)?.nome
                  return (
                    <div key={aluno.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-medium">{aluno.nome}</p>
                            <p className="text-sm text-gray-500">{aluno.email}</p>
                            {turmaNome && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {turmaNome}
                              </Badge>
                            )}
                            {!aluno.turma_id && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                Sem turma
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
                            setEditAlunoTurmaId(aluno.turma_id || "none")
                            setShowEditAlunoModal(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAluno(aluno)
                            setShowDeleteAlunoModal(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
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
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "turmas" && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Gerenciar Turmas</CardTitle>
                  <CardDescription>Lista de todas as turmas da sua rede</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar turma por nome"
                      value={turmaSearchTerm}
                      onChange={(e) => setTurmaSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
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
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTurmas.map((turma) => {
                  const alunosDaTurma = alunosSupabase
                    .filter((aluno) => aluno.turma_id === turma.id)
                    .sort((a, b) => a.nome.localeCompare(b.nome)) // Ordenação alfabética
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
                          <div className="flex gap-1">
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
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTurma(turma)
                                setShowDeleteTurmaModal(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
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
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Select value={transacaoTipoFilter} onValueChange={setTransacaoTipoFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os tipos</SelectItem>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
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
                  {transacaoTurmaFilter !== "todas" && (
                    <Select value={transacaoAlunoFilter} onValueChange={setTransacaoAlunoFilter}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filtrar por aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os alunos</SelectItem>
                        {alunosSupabase
                          .filter((aluno) => aluno.turma_id === transacaoTurmaFilter)
                          .sort((a, b) => a.nome.localeCompare(b.nome))
                          .map((aluno) => (
                            <SelectItem key={aluno.id} value={aluno.id}>
                              {aluno.nome}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredTransacoes.map((transacao) => (
                  <div key={transacao.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{transacao.user?.nome || "Aluno"}</p>
                      <p className="text-sm text-gray-600">{transacao.motivo}</p>
                      <p className="text-xs text-gray-500">
                        {transacao.created_at ? new Date(transacao.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }) : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${transacao.tipo === "entrada" ? "text-green-600" : "text-red-600"}`}>
                        {transacao.tipo === "entrada" ? `+${transacao.quantidade}` : `-${transacao.quantidade}`}
                      </p>
                      <Badge variant={transacao.tipo === "entrada" ? "default" : "destructive"}>
                        {transacao.tipo}
                      </Badge>
                    </div>
                  </div>
                ))}
                {filteredTransacoes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhuma transação encontrada</p>
                  </div>
                )}
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
      <Dialog open={showEditAlunoModal} onOpenChange={(open: boolean) => {
        setShowEditAlunoModal(open)
        if (!open) {
          setSelectedAluno(null)
          setEditAlunoTurmaId("none")
        }
      }}>
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
              {/* Corrigido: Select controlado + input hidden para envio no form */}
              <Select value={editAlunoTurmaId} onValueChange={setEditAlunoTurmaId}>
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
              <input type="hidden" name="turma_id" value={editAlunoTurmaId} />
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

      {/* Modal para excluir turma */}
      <Dialog open={showDeleteTurmaModal} onOpenChange={setShowDeleteTurmaModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Turma</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a turma "{selectedTurma?.nome}"?
              <br />
              <span className="text-red-600 font-medium">
                Todos os alunos desta turma ficarão sem turma.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteTurmaModal(false)
                setSelectedTurma(null)
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteTurma}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para excluir aluno */}
      <Dialog open={showDeleteAlunoModal} onOpenChange={setShowDeleteAlunoModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Aluno</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o aluno "{selectedAluno?.nome}"?
              <br />
              <span className="text-red-600 font-medium">
                Esta ação não pode ser desfeita. O aluno e todas as suas transações serão mantidas no histórico.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteAlunoModal(false)
                setSelectedAluno(null)
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteAluno}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
