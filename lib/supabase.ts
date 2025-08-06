import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string
          nome: string
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          created_at?: string
        }
      }
      admins: {
        Row: {
          id: string
          nome: string
          email: string
          senha: string
          empresa_id: string
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          email: string
          senha: string
          empresa_id: string
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          senha?: string
          empresa_id?: string
          created_at?: string
        }
      }
      turmas: {
        Row: {
          id: string
          nome: string
          empresa_id: string
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          empresa_id: string
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          empresa_id?: string
          created_at?: string
        }
      }
      alunos: {
        Row: {
          id: string
          username: string
          nome: string
          senha: string
          empresa_id: string
          turma_id: string | null
          saldo_moedas: number
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          nome: string
          senha: string
          empresa_id: string
          turma_id?: string | null
          saldo_moedas?: number
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          nome?: string
          senha?: string
          empresa_id?: string
          turma_id?: string | null
          saldo_moedas?: number
          created_at?: string
        }
      }
      transacoes_moedas: {
        Row: {
          id: string
          aluno_id: string
          quantidade: number
          motivo: string
          tipo: "entrada" | "saida"
          data_criacao: string
        }
        Insert: {
          id?: string
          aluno_id: string
          quantidade: number
          motivo: string
          tipo: "entrada" | "saida"
          data_criacao?: string
        }
        Update: {
          id?: string
          aluno_id?: string
          quantidade?: number
          motivo?: string
          tipo?: "entrada" | "saida"
          data_criacao?: string
        }
      }
    }
  }
}
