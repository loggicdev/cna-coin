-- Criar tabelas do sistema CNA Coin

-- Tabela de empresas/redes CNA
CREATE TABLE IF NOT EXISTS empresas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de administradores
CREATE TABLE IF NOT EXISTS admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de turmas
CREATE TABLE IF NOT EXISTS turmas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de alunos
CREATE TABLE IF NOT EXISTS alunos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    turma_id UUID REFERENCES turmas(id) ON DELETE SET NULL,
    saldo_moedas INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de transações de moedas
CREATE TABLE IF NOT EXISTS transacoes_moedas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    aluno_id UUID REFERENCES alunos(id) ON DELETE CASCADE,
    quantidade INTEGER NOT NULL,
    motivo TEXT NOT NULL,
    tipo VARCHAR(10) CHECK (tipo IN ('entrada', 'saida')) NOT NULL,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_alunos_empresa ON alunos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_alunos_turma ON alunos(turma_id);
CREATE INDEX IF NOT EXISTS idx_turmas_empresa ON turmas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_aluno ON transacoes_moedas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_admins_empresa ON admins(empresa_id);
