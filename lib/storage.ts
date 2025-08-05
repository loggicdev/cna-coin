import { mockAlunos, mockTurmas, mockTransacoes, type Aluno, type Turma, type TransacaoMoeda } from "./mock-data"

// Simular operações de banco de dados usando localStorage
const STORAGE_KEYS = {
  ALUNOS: "cna-coin-alunos",
  TURMAS: "cna-coin-turmas",
  TRANSACOES: "cna-coin-transacoes",
}

// Inicializar dados no localStorage se não existirem
function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.ALUNOS)) {
    localStorage.setItem(STORAGE_KEYS.ALUNOS, JSON.stringify(mockAlunos))
  }
  if (!localStorage.getItem(STORAGE_KEYS.TURMAS)) {
    localStorage.setItem(STORAGE_KEYS.TURMAS, JSON.stringify(mockTurmas))
  }
  if (!localStorage.getItem(STORAGE_KEYS.TRANSACOES)) {
    localStorage.setItem(STORAGE_KEYS.TRANSACOES, JSON.stringify(mockTransacoes))
  }
}

// Funções para gerenciar alunos
export function getAlunos(): Aluno[] {
  initializeStorage()
  const data = localStorage.getItem(STORAGE_KEYS.ALUNOS)
  return data ? JSON.parse(data) : []
}

export function saveAlunos(alunos: Aluno[]) {
  localStorage.setItem(STORAGE_KEYS.ALUNOS, JSON.stringify(alunos))
}

export function addAluno(aluno: Omit<Aluno, "id" | "created_at">) {
  const alunos = getAlunos()
  const newAluno: Aluno = {
    ...aluno,
    id: `aluno-${Date.now()}`,
    created_at: new Date().toISOString(),
  }
  alunos.push(newAluno)
  saveAlunos(alunos)
  return newAluno
}

export function updateAluno(id: string, updates: Partial<Aluno>) {
  const alunos = getAlunos()
  const index = alunos.findIndex((a) => a.id === id)
  if (index !== -1) {
    alunos[index] = { ...alunos[index], ...updates }
    saveAlunos(alunos)
    return alunos[index]
  }
  return null
}

// Funções para gerenciar turmas
export function getTurmas(): Turma[] {
  initializeStorage()
  const data = localStorage.getItem(STORAGE_KEYS.TURMAS)
  return data ? JSON.parse(data) : []
}

export function saveTurmas(turmas: Turma[]) {
  localStorage.setItem(STORAGE_KEYS.TURMAS, JSON.stringify(turmas))
}

export function addTurma(turma: Omit<Turma, "id" | "created_at">) {
  const turmas = getTurmas()
  const newTurma: Turma = {
    ...turma,
    id: `turma-${Date.now()}`,
    created_at: new Date().toISOString(),
  }
  turmas.push(newTurma)
  saveTurmas(turmas)
  return newTurma
}

// Funções para gerenciar transações
export function getTransacoes(): TransacaoMoeda[] {
  initializeStorage()
  const data = localStorage.getItem(STORAGE_KEYS.TRANSACOES)
  return data ? JSON.parse(data) : []
}

export function saveTransacoes(transacoes: TransacaoMoeda[]) {
  localStorage.setItem(STORAGE_KEYS.TRANSACOES, JSON.stringify(transacoes))
}

export function addTransacao(transacao: Omit<TransacaoMoeda, "id" | "data_criacao">) {
  const transacoes = getTransacoes()
  const newTransacao: TransacaoMoeda = {
    ...transacao,
    id: `trans-${Date.now()}`,
    data_criacao: new Date().toISOString(),
  }
  transacoes.push(newTransacao)
  saveTransacoes(transacoes)
  return newTransacao
}
