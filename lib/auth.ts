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

export async function loginAluno(username: string, senha: string): Promise<AuthUser | null> {
  try {
    // Simular delay de rede
    await new Promise((resolve) => setTimeout(resolve, 500))

    const aluno = mockAlunos.find((a) => a.username === username)

    if (!aluno || aluno.senha !== senha) {
      return null
    }

    return {
      id: aluno.id,
      nome: aluno.nome,
      username: aluno.username,
      empresa_id: aluno.empresa_id,
      turma_id: aluno.turma_id,
      saldo_moedas: aluno.saldo_moedas,
      type: "aluno",
    }
  } catch (error) {
    console.error("Erro no login do aluno:", error)
    return null
  }
}

export async function loginAdmin(email: string, senha: string): Promise<AuthUser | null> {
  try {
    // Simular delay de rede
    await new Promise((resolve) => setTimeout(resolve, 500))

    const admin = mockAdmins.find((a) => a.email === email)

    if (!admin || admin.senha !== senha) {
      return null
    }

    return {
      id: admin.id,
      nome: admin.nome,
      email: admin.email,
      empresa_id: admin.empresa_id,
      type: "admin",
    }
  } catch (error) {
    console.error("Erro no login do admin:", error)
    return null
  }
}
