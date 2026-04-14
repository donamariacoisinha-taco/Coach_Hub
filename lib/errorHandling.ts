
/**
 * Traduz mensagens de erro técnicas para algo amigável ao usuário.
 * Especialmente útil para o erro "Failed to fetch" do Supabase.
 */
export function translateErrorMessage(error: any): string {
  const message = typeof error === 'string' ? error : error?.message || 'Erro desconhecido';
  
  if (message.includes('Failed to fetch')) {
    return '⚠️ Erro de Conexão: Não foi possível alcançar o servidor. Verifique sua internet ou tente novamente em instantes.';
  }
  
  if (message.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  
  if (message.includes('Email not confirmed')) {
    return 'Por favor, confirme seu e-mail antes de entrar.';
  }
  
  if (message.includes('JWT expired')) {
    return 'Sua sessão expirou. Por favor, faça login novamente.';
  }

  if (message.includes('PGRST301')) {
    return 'Erro de autenticação. Tente sair e entrar novamente.';
  }

  return message;
}

/**
 * Exibe um alerta amigável ao usuário.
 */
export function notifyError(error: any, prefix: string = '') {
  const translated = translateErrorMessage(error);
  const fullMessage = prefix ? `${prefix}: ${translated}` : translated;
  console.error(`[ERROR] ${fullMessage}`, error);
  alert(fullMessage);
}
