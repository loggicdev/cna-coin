
export interface AuthUser {
  id: string
  nome: string
  email?: string
  username?: string
  empresa_id: string
  turma_id?: string | null
  saldo_moedas?: number
  role: string
}
