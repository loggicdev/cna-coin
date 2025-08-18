import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseMCP } from '@/lib/supabase-mcp';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { alunoId, novaSenha } = req.body;
  if (!alunoId || !novaSenha || novaSenha.length < 6) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }

  // MCP: admin update password
  const { error } = await supabaseMCP.auth.admin.updateUserById(alunoId, {
    password: novaSenha,
  });

  if (error) {
    return res.status(500).json({ error: error.message || 'Erro ao atualizar senha' });
  }

  return res.status(200).json({ success: true });
}