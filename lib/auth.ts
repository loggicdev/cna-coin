import { mockAlunos, mockAdmins } from "./mock-data"

export type UserType = "aluno" | "admin"

export interface AuthUser {
  id: string
  nome: string
  email?: string
  username?: string
  empresa_id: string
  turma_id?: string | null
  saldo_moedas?: number
  type: UserType
}

export async function loginUser(username: string, senha: string): Promise<AuthUser | null> {
  try {
    // Simular delay de rede
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Primeiro tenta encontrar como aluno
    const aluno = mockAlunos.find((a) => a.username === username)
    if (aluno && aluno.senha === senha) {
      return {
        id: aluno.id,
        nome: aluno.nome,
        username: aluno.username,
        empresa_id: aluno.empresa_id,
        turma_id: aluno.turma_id,
        saldo_moedas: aluno.saldo_moedas,
        type: "aluno",
      }
    }

    // Se não encontrou como aluno, tenta como admin
    const admin = mockAdmins.find((a) => a.email === username)
    if (admin && admin.senha === senha) {
      return {
        id: admin.id,
        nome: admin.nome,
        email: admin.email,
        empresa_id: admin.empresa_id,
        type: "admin",
      }
    }

    return null
  } catch (error) {
    console.error("Erro no login:", error)
    return null
  }
}

// Manter funções antigas para compatibilidade
export const loginAluno = loginUser
export const loginAdmin = loginUser
