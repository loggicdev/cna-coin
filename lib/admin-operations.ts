// Operações administrativas usando MCP do Supabase
// Este arquivo contém funções que requerem privilégios administrativos

/**
 * Deleta um usuário completamente do sistema
 * Remove tanto da tabela user quanto do auth
 */
export async function deleteUserCompletely(userId: string): Promise<{success: boolean, error?: string}> {
  try {
    // Primeiro, tentar deletar da tabela user
    const response = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao deletar usuário');
    }

    return { success: true };
  } catch (error) {
    console.error('Erro em deleteUserCompletely:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Cria um usuário usando privilégios administrativos
 */
export async function createUserAsAdmin(userData: {
  email: string;
  password: string;
  nome: string;
  turmaId?: string;
  empresaId: string;
}): Promise<{success: boolean, userId?: string, error?: string}> {
  try {
    const response = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao criar usuário');
    }

    const result = await response.json();
    return { success: true, userId: result.userId };
  } catch (error) {
    console.error('Erro em createUserAsAdmin:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}
