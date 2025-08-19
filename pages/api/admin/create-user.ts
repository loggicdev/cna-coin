import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { email, password, nome, turmaId, empresaId } = req.body;

  if (!email || !password || !nome || !empresaId) {
    return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const { createClient } = await import('@supabase/supabase-js');
    
    if (!serviceRoleKey) {
      // Fallback para criar usando anon key (método normal de signup)
      const supabase = createClient(supabaseUrl!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      
      const { data: userCreated, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined
        }
      });
      
      if (authError) throw authError;
      
      const userId = userCreated.user?.id;
      if (!userId) {
        throw new Error('Erro ao criar usuário no Auth');
      }

      // Inserir na tabela user
      const { error: dbError } = await supabase.from("user").insert({
        id: userId,
        email,
        nome,
        turma_id: turmaId === "none" ? null : turmaId,
        saldo_moedas: 0,
        empresa_id: empresaId,
        role: 'student',
      });
      
      if (dbError) throw dbError;
      
      return res.status(200).json({ success: true, userId });
    }

    // Se temos service role key, usar para criar com privilégios admin
    const supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });

    // 1. Verificar se email já existe
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('user')
      .select('email')
      .eq('email', email)
      .maybeSingle();
    
    if (checkError) throw checkError;
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email já está em uso' });
    }

    // 2. Criar usuário no auth usando admin
    const { data: userCreated, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome }
    });
    
    if (authError) throw authError;
    
    const userId = userCreated.user?.id;
    if (!userId) {
      throw new Error('Erro ao criar usuário no Auth');
    }

    // 3. Inserir na tabela user
    const { error: dbError } = await supabaseAdmin.from("user").insert({
      id: userId,
      email,
      nome,
      turma_id: turmaId === "none" ? null : turmaId,
      saldo_moedas: 0,
      empresa_id: empresaId,
      role: 'student',
    });
    
    if (dbError) throw dbError;

    return res.status(200).json({ success: true, userId });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
}
