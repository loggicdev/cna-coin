-- Dados de exemplo para o sistema CNA Coin

-- Inserir empresas de exemplo
INSERT INTO empresas (id, nome) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'CNA São Paulo'),
    ('550e8400-e29b-41d4-a716-446655440002', 'CNA Rio de Janeiro');

-- Inserir administradores
INSERT INTO admins (nome, email, senha, empresa_id) VALUES 
    ('Admin SP', 'admin@cnasp.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '550e8400-e29b-41d4-a716-446655440001'),
    ('Admin RJ', 'admin@cnarj.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '550e8400-e29b-41d4-a716-446655440002');

-- Inserir turmas
INSERT INTO turmas (nome, empresa_id) VALUES 
    ('Básico 1', '550e8400-e29b-41d4-a716-446655440001'),
    ('Básico 2', '550e8400-e29b-41d4-a716-446655440001'),
    ('Intermediário 1', '550e8400-e29b-41d4-a716-446655440001'),
    ('Básico 1', '550e8400-e29b-41d4-a716-446655440002'),
    ('Avançado 1', '550e8400-e29b-41d4-a716-446655440002');

-- Inserir alunos de exemplo
INSERT INTO alunos (username, nome, senha, empresa_id, turma_id, saldo_moedas) VALUES 
    ('@joao123', 'João Silva', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM turmas WHERE nome = 'Básico 1' AND empresa_id = '550e8400-e29b-41d4-a716-446655440001' LIMIT 1), 150),
    ('@maria456', 'Maria Santos', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM turmas WHERE nome = 'Básico 2' AND empresa_id = '550e8400-e29b-41d4-a716-446655440001' LIMIT 1), 200),
    ('@pedro789', 'Pedro Costa', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM turmas WHERE nome = 'Intermediário 1' AND empresa_id = '550e8400-e29b-41d4-a716-446655440001' LIMIT 1), 300),
    ('@ana321', 'Ana Oliveira', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM turmas WHERE nome = 'Básico 1' AND empresa_id = '550e8400-e29b-41d4-a716-446655440002' LIMIT 1), 180);

-- Inserir transações de exemplo
INSERT INTO transacoes_moedas (aluno_id, quantidade, motivo, tipo) VALUES 
    ((SELECT id FROM alunos WHERE username = '@joao123'), 50, 'Participação em aula', 'entrada'),
    ((SELECT id FROM alunos WHERE username = '@joao123'), 100, 'Exercício completo', 'entrada'),
    ((SELECT id FROM alunos WHERE username = '@maria456'), 150, 'Prova excelente', 'entrada'),
    ((SELECT id FROM alunos WHERE username = '@maria456'), 50, 'Participação ativa', 'entrada'),
    ((SELECT id FROM alunos WHERE username = '@pedro789'), 200, 'Projeto final', 'entrada'),
    ((SELECT id FROM alunos WHERE username = '@pedro789'), 100, 'Ajuda aos colegas', 'entrada'),
    ((SELECT id FROM alunos WHERE username = '@ana321'), 180, 'Desempenho excepcional', 'entrada');
