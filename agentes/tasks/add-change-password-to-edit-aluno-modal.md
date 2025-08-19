Olá — eu sou o GitHub Copilot, atuando como Product Owner (PO) para esta tarefa.

Resumo rápido e plano
--------------------

Vou criar uma tarefa técnica e executável para o time de desenvolvimento alterar o modal "Editar Aluno": adicionar a seção de alteração de senha abaixo do campo `Turma`, validar localmente, chamar o endpoint MCP para atualizar a senha quando necessário e exibir toasts apropriados. Entregarei critérios de aceite claros e passos técnicos.

Checklist de requisitos (o que precisa ser entregue)
- O modal de editar aluno deve exibir, logo abaixo de `Turma`:
  1) uma linha divisória fina (hr);
  2) um label `Senha`;
  3) um input do tipo password;
  4) um texto explicativo em itálico entre asteriscos: *Ao deixar este campo vazio a senha permanecerá a mesma.*
- O botão "Salvar Alterações" do modal deve suportar estado de loading e ficar desabilitado enquanto a requisição estiver em andamento.
- Se o campo de senha ficar vazio: não chamar o MCP e manter a senha atual.
- Se o campo estiver preenchido: validar localmente (mín. 6 caracteres). Se inválido → não fechar modal e exibir toast de erro.
- Se válido: chamar o endpoint MCP `POST /api/admin-update-aluno-senha` com payload { alunoId, novaSenha } e tratar resposta.
- Exibir toast de sucesso/erro conforme resultado da operação (edição dos dados do aluno e alteração de senha via MCP).

Contexto técnico / referências
- Arquivo do endpoint MCP já existente: `pages/api/admin-update-aluno-senha.ts` (usa `supabaseMCP.auth.admin.updateUserById`).
- O fluxo de edição do aluno já existe em `components/admin-dashboard.tsx` (função `handleEditAluno`). Use esse fluxo e acrescente a chamada ao MCP quando necessário.

Implementação sugerida (passo a passo para o dev)
1) UI
	- No modal de editar aluno (`components/admin-dashboard.tsx`), logo abaixo do campo `Turma`, inserir:
	- Garantir que o botão de salvar use `disabled={isSaving}` e mostre `Criando...`/`Salvando...` quando `isSaving === true`.

2) Estado e validação
	- Adicionar estados locais: `const [novaSenha, setNovaSenha] = useState('')` e `const [isSaving, setIsSaving] = useState(false)` (ou reusar estados existentes do modal).

3) Chamada ao MCP (quando novaSenha está preenchida e válida)
	- Fazer `fetch('/api/admin-update-aluno-senha', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ alunoId: selectedAluno.id, novaSenha }) })`
	- Se a resposta for status >= 400, ler corpo `json()` e exibir `toast.error('Erro ao alterar senha: ' + (json.error || json.message || 'erro desconhecido'))` e interromper fechamento do modal.

4) Fluxo de sucesso
	- Se a alteração dos dados do aluno e (quando aplicável) a alteração da senha via MCP retornarem sucesso:

5) Fluxo de erro
	- Em qualquer erro (edição de dados ou MCP): manter modal aberto, setar `isSaving=false`, exibir `toast.error` com mensagem amigável e logar o erro no console para debugging.

Mensagens/Toasts recomendadas
- Erro local (senha curta): `A senha deve ter pelo menos 6 caracteres`.
- Erro MCP: `Erro ao alterar senha: <mensagem_do_servidor>`.
- Erro geral ao salvar: `Erro ao salvar alterações do aluno: <mensagem>`.
- Sucesso: `Dados do aluno atualizados com sucesso.` ou `Dados do aluno atualizados com sucesso e senha atualizada.`

Critérios de aceite
- O modal exibe a nova seção de senha conforme o layout.
- Com senha vazia: apenas os dados do aluno são atualizados; senha permanece inalterada.
- Com senha inválida (<6): modal NÃO fecha; aparece toast de erro.
- Com senha válida: MCP é chamado; em sucesso, modal fecha e aparece toast de sucesso; em erro, modal NÃO fecha e aparece toast de erro.
- Botão salvar fica desabilitado e mostra loading durante qualquer requisição.

Testes manuais sugeridos
- Salvar alteração com campo senha vazio (esperado: atualiza só dados, sucesso).
- Salvar com senha de 4 caracteres (esperado: toast de erro, modal aberto).
- Salvar com senha de 8 caracteres: forçar erro no endpoint MCP (ex.: desligar o serviço) e verificar toast de erro e modal aberto.
- Salvar com senha válida e MCP disponível: verificar toast de sucesso e fechamento do modal.

Notas técnicas / cuidados
- Certificar que `selectedAluno.id` corresponde ao id do usuário do Supabase usado pelo MCP.
- Evitar múltiplos envios: usar `isSaving` para bloquear cliques repetidos.
- O endpoint `pages/api/admin-update-aluno-senha.ts` já valida `novaSenha.length >= 6`, mas a validação local melhora a UX.
- Logue erros no console para facilitar o debugging do dev.

Tempo estimado
- UI + validação + toasts: 45-60 minutos
- Integração MCP + tratamento de erro: 30-45 minutos
- Testes: 15-30 minutos

Se quiser, eu posso abrir um branch e implementar essa mudança agora. Caso prefira só entregar a tarefa ao dev, o arquivo já está pronto para ser usado no backlog.
