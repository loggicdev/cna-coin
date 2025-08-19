import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId é obrigatório' });
  }

  try {
    // Usar fetch para chamar o MCP do Supabase diretamente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceRoleKey) {
      // Se não temos service role key, apenas deletar da tabela user
      // e confiar que o banco de dados tem foreign key constraints configuradas
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      
      const { error } = await supabase
        .from('user')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      
      return res.status(200).json({ success: true });
    }

    // Se temos service role key, usar para deletar do auth também
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });

    // 1. Deletar do auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      console.warn('Erro ao deletar do auth (continuando):', authError);
    }

    // 2. Deletar da tabela user
    const { error: dbError } = await supabaseAdmin
      .from('user')
      .delete()
      .eq('id', userId);
    
    if (dbError) throw dbError;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
}
