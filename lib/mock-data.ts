export interface Empresa {
  id: string
  nome: string
  created_at: string
}

export interface Admin {
  id: string
  nome: string
  email: string
  senha: string
  empresa_id: string
  created_at: string
}

export interface Turma {
  id: string
  nome: string
  empresa_id: string
  created_at: string
}

export interface Aluno {
  id: string
  username: string
  nome: string
  senha: string
  empresa_id: string
  turma_id: string | null
  saldo_moedas: number
  created_at: string
}

export interface TransacaoMoeda {
  id: string
  aluno_id: string
  quantidade: number
  motivo: string
  tipo: "entrada" | "saida"
  data_criacao: string
}

// Dados mockados
export const mockEmpresas: Empresa[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    nome: "CNA São Paulo",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    nome: "CNA Rio de Janeiro",
    created_at: "2024-01-01T00:00:00Z",
  },
]

export const mockAdmins: Admin[] = [
  {
    id: "admin-1",
    nome: "Admin SP",
    email: "admin@cnasp.com",
    senha: "password", // Em produção seria hash
    empresa_id: "550e8400-e29b-41d4-a716-446655440001",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "admin-2",
    nome: "Admin RJ",
    email: "admin@cnarj.com",
    senha: "password",
    empresa_id: "550e8400-e29b-41d4-a716-446655440002",
    created_at: "2024-01-01T00:00:00Z",
  },
]

export const mockTurmas: Turma[] = [
  {
    id: "turma-1",
    nome: "Básico 1",
    empresa_id: "550e8400-e29b-41d4-a716-446655440001",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "turma-2",
    nome: "Básico 2",
    empresa_id: "550e8400-e29b-41d4-a716-446655440001",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "turma-3",
    nome: "Intermediário 1",
    empresa_id: "550e8400-e29b-41d4-a716-446655440001",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "turma-4",
    nome: "Básico 1",
    empresa_id: "550e8400-e29b-41d4-a716-446655440002",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "turma-5",
    nome: "Avançado 1",
    empresa_id: "550e8400-e29b-41d4-a716-446655440002",
    created_at: "2024-01-01T00:00:00Z",
  },
]

export const mockAlunos: Aluno[] = [
  {
    id: "aluno-1",
    username: "@joao123",
    nome: "João Silva",
    senha: "password",
    empresa_id: "550e8400-e29b-41d4-a716-446655440001",
    turma_id: "turma-1",
    saldo_moedas: 150,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "aluno-2",
    username: "@maria456",
    nome: "Maria Santos",
    senha: "password",
    empresa_id: "550e8400-e29b-41d4-a716-446655440001",
    turma_id: "turma-2",
    saldo_moedas: 200,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "aluno-3",
    username: "@pedro789",
    nome: "Pedro Costa",
    senha: "password",
    empresa_id: "550e8400-e29b-41d4-a716-446655440001",
    turma_id: "turma-3",
    saldo_moedas: 300,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "aluno-4",
    username: "@ana321",
    nome: "Ana Oliveira",
    senha: "password",
    empresa_id: "550e8400-e29b-41d4-a716-446655440001",
    turma_id: "turma-1",
    saldo_moedas: 180,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "aluno-5",
    username: "@carlos654",
    nome: "Carlos Ferreira",
    senha: "password",
    empresa_id: "550e8400-e29b-41d4-a716-446655440001",
    turma_id: "turma-2",
    saldo_moedas: 120,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "aluno-6",
    username: "@lucia987",
    nome: "Lúcia Mendes",
    senha: "password",
    empresa_id: "550e8400-e29b-41d4-a716-446655440002",
    turma_id: "turma-4",
    saldo_moedas: 250,
    created_at: "2024-01-01T00:00:00Z",
  },
]

export const mockTransacoes: TransacaoMoeda[] = [
  {
    id: "trans-1",
    aluno_id: "aluno-1",
    quantidade: 50,
    motivo: "Participação em aula",
    tipo: "entrada",
    data_criacao: "2024-01-15T10:00:00Z",
  },
  {
    id: "trans-2",
    aluno_id: "aluno-1",
    quantidade: 100,
    motivo: "Exercício completo",
    tipo: "entrada",
    data_criacao: "2024-01-16T14:30:00Z",
  },
  {
    id: "trans-3",
    aluno_id: "aluno-2",
    quantidade: 150,
    motivo: "Prova excelente",
    tipo: "entrada",
    data_criacao: "2024-01-17T09:15:00Z",
  },
  {
    id: "trans-4",
    aluno_id: "aluno-2",
    quantidade: 50,
    motivo: "Participação ativa",
    tipo: "entrada",
    data_criacao: "2024-01-18T11:45:00Z",
  },
  {
    id: "trans-5",
    aluno_id: "aluno-3",
    quantidade: 200,
    motivo: "Projeto final",
    tipo: "entrada",
    data_criacao: "2024-01-19T16:20:00Z",
  },
  {
    id: "trans-6",
    aluno_id: "aluno-3",
    quantidade: 100,
    motivo: "Ajuda aos colegas",
    tipo: "entrada",
    data_criacao: "2024-01-20T13:10:00Z",
  },
  {
    id: "trans-7",
    aluno_id: "aluno-4",
    quantidade: 180,
    motivo: "Desempenho excepcional",
    tipo: "entrada",
    data_criacao: "2024-01-21T15:30:00Z",
  },
  {
    id: "trans-8",
    aluno_id: "aluno-5",
    quantidade: 120,
    motivo: "Apresentação criativa",
    tipo: "entrada",
    data_criacao: "2024-01-22T10:45:00Z",
  },
]

// Funções para simular operações de banco de dados
export function getAlunosByEmpresa(empresaId: string): Aluno[] {
  return mockAlunos.filter((aluno) => aluno.empresa_id === empresaId)
}

export function getTurmasByEmpresa(empresaId: string): Turma[] {
  return mockTurmas.filter((turma) => turma.empresa_id === empresaId)
}

export function getTransacoesByAluno(alunoId: string): TransacaoMoeda[] {
  return mockTransacoes.filter((transacao) => transacao.aluno_id === alunoId)
}

export function getTransacoesByEmpresa(empresaId: string): TransacaoMoeda[] {
  const alunosEmpresa = getAlunosByEmpresa(empresaId)
  const alunoIds = alunosEmpresa.map((aluno) => aluno.id)
  return mockTransacoes.filter((transacao) => alunoIds.includes(transacao.aluno_id))
}

export function getTurmaNome(turmaId: string | null): string | null {
  if (!turmaId) return null
  const turma = mockTurmas.find((t) => t.id === turmaId)
  return turma?.nome || null
}

export function getEmpresaNome(empresaId: string): string {
  const empresa = mockEmpresas.find((e) => e.id === empresaId)
  return empresa?.nome || "Empresa não encontrada"
}
