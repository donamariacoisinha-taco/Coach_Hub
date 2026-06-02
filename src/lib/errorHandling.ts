
export type AppErrorType =
  | 'network'
  | 'auth'
  | 'validation'
  | 'server'
  | 'unknown'
  | 'success';

export interface AppError {
  type: AppErrorType;
  title: string;
  message: string;
  action?: string;
  retryable?: boolean;
  originalError?: any;
}

/**
 * Mapeia erros técnicos para o formato AppError humanizado.
 */
export function mapError(error: any): AppError {
  const message = typeof error === 'string' ? error : error?.message || 'Erro desconhecido';
  const code = error?.code?.toString() || '';
  const lowercaseMessage = message.toLowerCase();

  // DETECTION OF REFRESH TOKEN FAILURE
  const isRefreshTokenError = 
    lowercaseMessage.includes('refresh token') || 
    lowercaseMessage.includes('refresh_token') || 
    (lowercaseMessage.includes('not found') && lowercaseMessage.includes('token')) ||
    error?.status === 400 && lowercaseMessage.includes('grant_type') ||
    error?.status === 401 && lowercaseMessage.includes('token');

  if (isRefreshTokenError) {
    try {
      // Limpa chaves do Supabase no LocalStorage para quebrar o loop de refresh infinito
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase.auth.token'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => {
        localStorage.removeItem(k);
        console.warn(`[Error Handling] Limpando chave de auth corrompida: ${k}`);
      });
      // Sair silenciosamente do supabase para normalizar o estado local/global
      import('./api/supabase').then(({ supabase }) => {
        supabase.auth.signOut().catch(() => {});
      }).catch(() => {});
    } catch (err) {
      console.error("[Error Handling] Erro ao limpar armazenamento de sessão:", err);
    }

    return {
      type: 'auth',
      title: 'Sessão expirada',
      message: 'Sua sessão expirou por questões de segurança. Por favor, conecte-se novamente.',
      originalError: error
    };
  }

  // CONNECTION / OFFLINE / FETCH NETWORK ERRORS
  if (
    message.includes('Failed to fetch') || 
    message.includes('network') || 
    code === 'PGRST301' || 
    lowercaseMessage.includes('failed to fetch')
  ) {
    return {
      type: 'network',
      title: 'Sem conexão no momento',
      message: 'Parece que você está offline ou com sinal instável. Vamos tentar nos reconectar automaticamente.',
      retryable: true,
      originalError: error
    };
  }

  // AUTH ERRORS
  if (
    message.includes('Invalid login credentials') || 
    message.includes('Email not confirmed') || 
    message.includes('JWT expired') ||
    lowercaseMessage.includes('jwt expired')
  ) {
    return {
      type: 'auth',
      title: 'Não foi possível entrar',
      message: lowercaseMessage.includes('jwt expired')
        ? 'Sua sessão expirou. Conecte-se novamente.'
        : 'Verifique seu e-mail e senha ou confirme seu cadastro.',
      originalError: error
    };
  }

  // VALIDATION ERRORS
  if (message.includes('validation') || message.includes('required') || message.includes('invalid input')) {
    return {
      type: 'validation',
      title: 'Dados incompletos',
      message: 'Preencha os campos corretamente para continuar.',
      originalError: error
    };
  }

  // SERVER ERRORS
  if (code && typeof code === 'string' && code.startsWith('5') || message.includes('server error') || message.includes('database error')) {
    return {
      type: 'server',
      title: 'Instabilidade temporária',
      message: 'Tente novamente em alguns instantes.',
      retryable: true,
      originalError: error
    };
  }

  // DEFAULT
  return {
    type: 'unknown',
    title: 'Algo deu errado',
    message: error?.message || error?.details || 'Ocorreu um erro inesperado. Tente novamente.',
    retryable: true,
    originalError: error
  };
}

/**
 * Log de erro inteligente baseado no ambiente.
 */
export function logError(appError: AppError) {
  if (process.env.NODE_ENV === 'development') {
    console.group(`[APP ERROR] ${appError.type.toUpperCase()}: ${appError.title}`);
    console.error('Message:', appError.message);
    console.error('Original Error:', appError.originalError);
    console.groupEnd();
  } else {
    // Log leve em produção
    console.error(`[Error] ${appError.type}: ${appError.title}`);
  }
}

// Mantendo compatibilidade temporária se necessário, mas redirecionando para o novo sistema
export function translateErrorMessage(error: any): string {
  return mapError(error).message;
}

export function notifyError(error: any, prefix: string = '') {
  const appError = mapError(error);
  logError(appError);
  // No futuro, isso será substituído pelo Toast via hook
  alert(`${prefix ? prefix + ': ' : ''}${appError.title}\n${appError.message}`);
}
