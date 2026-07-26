export type OfflineSyncHealthLevel = 'healthy' | 'pending' | 'attention' | 'offline' | 'unavailable';

export type OfflineSyncHealthInput = {
  online: boolean;
  pendingCount: number;
  deadLetterCount: number;
  storageAvailable: boolean;
};

export type OfflineSyncHealth = {
  level: OfflineSyncHealthLevel;
  label: string;
  summary: string;
};

export const deriveOfflineSyncHealth = ({
  online,
  pendingCount,
  deadLetterCount,
  storageAvailable,
}: OfflineSyncHealthInput): OfflineSyncHealth => {
  if (!storageAvailable) {
    return {
      level: 'unavailable',
      label: 'Sync indisponível',
      summary: 'O armazenamento local não pôde ser acessado neste dispositivo.',
    };
  }

  if (!online) {
    return {
      level: 'offline',
      label: 'Sem conexão',
      summary: pendingCount + deadLetterCount > 0
        ? 'Os dados estão preservados neste aparelho e serão enviados quando a conexão voltar.'
        : 'O aplicativo está offline. Novos registros serão preservados neste aparelho.',
    };
  }

  if (deadLetterCount > 0) {
    return {
      level: 'attention',
      label: 'Revisão necessária',
      summary: `${deadLetterCount} ${deadLetterCount === 1 ? 'operação precisa' : 'operações precisam'} de nova tentativa.`,
    };
  }

  if (pendingCount > 0) {
    return {
      level: 'pending',
      label: 'Sincronização pendente',
      summary: `${pendingCount} ${pendingCount === 1 ? 'operação aguarda' : 'operações aguardam'} envio.`,
    };
  }

  return {
    level: 'healthy',
    label: 'Sincronização em dia',
    summary: 'Não há operações locais aguardando envio.',
  };
};

export const formatOfflineOperationType = (type: string): string => {
  const labels: Record<string, string> = {
    SAVE_SET: 'Série de treino',
  };
  return labels[type] || type.replaceAll('_', ' ').toLowerCase();
};

export const formatRelativeTimestamp = (timestamp: number, now = Date.now()): string => {
  const elapsed = Math.max(0, now - timestamp);
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
};
