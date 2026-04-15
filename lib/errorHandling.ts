
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
  const message = typeof error === 'string' ? error : error?.message || '';
  const code = error?.code || '';

  // NETWORK ERRORS
  if (message.includes('Failed to fetch') || message.includes('network') || code === 'PGRST301') {
    return {
      type: 'network',
      title: 'Sem conexão no momento',
      message: 'Vamos salvar seu progresso e tentar novamente automaticamente.',
      retryable: true,
      originalError: error
    };
  }

  // AUTH ERRORS
  if (message.includes('Invalid login credentials') || message.includes('Email not confirmed') || message.includes('JWT expired')) {
    return {
      type: 'auth',
      title: 'Não foi possível entrar',
      message: 'Verifique seu e-mail e senha ou confirme seu cadastro.',
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
  if (code.startsWith('5') || message.includes('server error') || message.includes('database error')) {
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
    message: 'Ocorreu um erro inesperado. Tente novamente.',
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
