import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DeadLetterItem,
  OfflineQueueSnapshot,
  QueueItem,
  offlineQueue,
} from '../lib/offline/offlineQueue';
import {
  deriveOfflineSyncHealth,
  formatOfflineOperationType,
  formatRelativeTimestamp,
} from '../lib/offline/offlineSyncHealth';
import { syncEngine } from '../lib/sync/syncEngine';

const EMPTY_SNAPSHOT: OfflineQueueSnapshot = {
  queue: [],
  deadLetters: [],
};

const healthStyles = {
  healthy: {
    dot: 'bg-emerald-500',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    panel: 'bg-emerald-50 text-emerald-800',
  },
  pending: {
    dot: 'bg-blue-500',
    badge: 'border-blue-200 bg-blue-50 text-blue-800',
    panel: 'bg-blue-50 text-blue-800',
  },
  attention: {
    dot: 'bg-amber-500',
    badge: 'border-amber-200 bg-amber-50 text-amber-900',
    panel: 'bg-amber-50 text-amber-900',
  },
  offline: {
    dot: 'bg-gray-500',
    badge: 'border-gray-300 bg-white text-gray-800',
    panel: 'bg-gray-100 text-gray-800',
  },
  unavailable: {
    dot: 'bg-red-500',
    badge: 'border-red-200 bg-red-50 text-red-800',
    panel: 'bg-red-50 text-red-800',
  },
} as const;

const sortNewestFirst = <T extends QueueItem>(items: T[]): T[] => (
  [...items].sort((a, b) => {
    const aTimestamp = 'failedAt' in a ? Number(a.failedAt) : a.timestamp;
    const bTimestamp = 'failedAt' in b ? Number(b.failedAt) : b.timestamp;
    return bTimestamp - aTimestamp;
  })
);

const OperationRow: React.FC<{
  item: QueueItem | DeadLetterItem;
  failed?: boolean;
  busy?: boolean;
  onRetry?: () => void;
}> = ({ item, failed = false, busy = false, onRetry }) => {
  const timestamp = failed && 'failedAt' in item ? item.failedAt : item.timestamp;

  return (
    <article className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-gray-900">
            {formatOfflineOperationType(item.type)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {formatRelativeTimestamp(timestamp)}
            {!failed && item.retryCount > 0 ? ` · tentativa ${item.retryCount}/3` : ''}
          </p>
          {failed && (
            <p className="mt-2 text-xs leading-5 text-amber-800">
              O envio não foi concluído. O registro continua preservado neste aparelho.
            </p>
          )}
        </div>

        {failed && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={busy}
            className="shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Tentar novamente
          </button>
        )}
      </div>
    </article>
  );
};

const OfflineSyncHealthPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<OfflineQueueSnapshot>(EMPTY_SNAPSHOT);
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [action, setAction] = useState<'sync' | 'retry-all' | string | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const nextSnapshot = await offlineQueue.getSnapshot();
      setSnapshot(nextSnapshot);
      setStorageAvailable(true);
      setLastCheckedAt(Date.now());
    } catch (error) {
      console.error('[OfflineSyncHealth] Unable to read local queue:', error);
      setStorageAvailable(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const unsubscribe = offlineQueue.subscribe(() => void refresh());
    const interval = window.setInterval(() => void refresh(), 10_000);

    const handleOnline = () => {
      setOnline(true);
      setFeedback('Conexão restaurada. Você já pode sincronizar.');
      void refresh();
    };
    const handleOffline = () => {
      setOnline(false);
      setFeedback('Sem conexão. Os dados continuam preservados neste aparelho.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refresh]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const health = useMemo(() => deriveOfflineSyncHealth({
    online,
    pendingCount: snapshot.queue.length,
    deadLetterCount: snapshot.deadLetters.length,
    storageAvailable,
  }), [online, snapshot, storageAvailable]);

  const styles = healthStyles[health.level];
  const totalIssues = snapshot.queue.length + snapshot.deadLetters.length;
  const pendingItems = useMemo(() => sortNewestFirst(snapshot.queue).slice(0, 10), [snapshot.queue]);
  const deadLetterItems = useMemo(() => sortNewestFirst(snapshot.deadLetters).slice(0, 10), [snapshot.deadLetters]);

  const synchronizeNow = useCallback(async () => {
    if (!online || action) return;
    setAction('sync');
    setFeedback(null);
    try {
      await syncEngine.processQueue({ force: true });
      await refresh();
      setFeedback('Sincronização concluída.');
    } catch (error) {
      console.error('[OfflineSyncHealth] Manual sync failed:', error);
      setFeedback('Não foi possível concluir a sincronização agora. Os dados continuam preservados.');
    } finally {
      setAction(null);
    }
  }, [action, online, refresh]);

  const retryAll = useCallback(async () => {
    if (!online || action) return;
    setAction('retry-all');
    setFeedback(null);
    try {
      const restored = await offlineQueue.retryAllDeadLetters();
      if (restored > 0) {
        await syncEngine.processQueue({ force: true });
      }
      await refresh();
      setFeedback(restored > 0
        ? `${restored} ${restored === 1 ? 'operação foi reprocessada' : 'operações foram reprocessadas'}.`
        : 'Não havia falhas para reprocessar.');
    } catch (error) {
      console.error('[OfflineSyncHealth] Bulk retry failed:', error);
      setFeedback('Não foi possível reprocessar as falhas agora. Nenhum registro foi descartado.');
    } finally {
      setAction(null);
    }
  }, [action, online, refresh]);

  const retryOne = useCallback(async (id: string) => {
    if (!online || action) return;
    setAction(id);
    setFeedback(null);
    try {
      const restored = await offlineQueue.retryDeadLetter(id);
      if (restored) {
        await syncEngine.processQueue({ force: true });
      }
      await refresh();
      setFeedback(restored ? 'Operação reprocessada.' : 'A operação não estava mais na fila de falhas.');
    } catch (error) {
      console.error('[OfflineSyncHealth] Item retry failed:', error);
      setFeedback('Não foi possível reprocessar esta operação. Ela continua preservada.');
    } finally {
      setAction(null);
    }
  }, [action, online, refresh]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`Abrir saúde da sincronização: ${health.label}`}
        className={`fixed bottom-24 right-4 z-[65] flex min-h-11 items-center gap-2 rounded-full border px-3.5 py-2.5 text-xs font-bold shadow-lg shadow-gray-900/10 backdrop-blur transition hover:-translate-y-0.5 md:bottom-6 ${styles.badge}`}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${styles.dot} ${action ? 'animate-pulse' : ''}`} aria-hidden="true" />
        <span className="max-w-32 truncate">{isLoading ? 'Verificando sync' : health.label}</span>
        {totalIssues > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-900 px-1.5 text-[10px] text-white">
            {totalIssues > 99 ? '99+' : totalIssues}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-gray-950/40 p-0 backdrop-blur-sm md:items-center md:p-6" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="offline-sync-title"
            className="max-h-[88vh] w-full overflow-hidden rounded-t-[28px] border border-gray-200 bg-[#F7F8FA] shadow-2xl md:max-w-xl md:rounded-[28px]"
          >
            <header className="border-b border-gray-200 bg-white px-5 pb-4 pt-5 md:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">Saúde operacional</p>
                  <h2 id="offline-sync-title" className="mt-1 text-xl font-black tracking-tight text-gray-950">
                    Sincronização offline
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Fechar painel"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-xl text-gray-600 transition hover:bg-gray-50"
                >
                  ×
                </button>
              </div>

              <div className={`mt-4 rounded-2xl px-4 py-3 ${styles.panel}`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} aria-hidden="true" />
                  <p className="text-sm font-black">{health.label}</p>
                </div>
                <p className="mt-1 text-xs leading-5 opacity-80">{health.summary}</p>
              </div>
            </header>

            <div className="max-h-[calc(88vh-190px)] overflow-y-auto px-5 py-5 md:px-6">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Pendentes</p>
                  <p className="mt-1 text-2xl font-black text-gray-950">{snapshot.queue.length}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Falhas</p>
                  <p className="mt-1 text-2xl font-black text-gray-950">{snapshot.deadLetters.length}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Conexão</p>
                  <p className="mt-2 text-sm font-black text-gray-950">{online ? 'Online' : 'Offline'}</p>
                </div>
              </div>

              {feedback && (
                <div className="mt-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm leading-5 text-gray-700">
                  {feedback}
                </div>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void synchronizeNow()}
                  disabled={!online || snapshot.queue.length === 0 || Boolean(action)}
                  className="min-h-12 rounded-2xl bg-gray-950 px-4 py-3 text-sm font-black text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {action === 'sync' ? 'Sincronizando…' : 'Sincronizar agora'}
                </button>
                <button
                  type="button"
                  onClick={() => void retryAll()}
                  disabled={!online || snapshot.deadLetters.length === 0 || Boolean(action)}
                  className="min-h-12 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-black text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
                >
                  {action === 'retry-all' ? 'Reprocessando…' : 'Reprocessar falhas'}
                </button>
              </div>

              {deadLetterItems.length > 0 && (
                <section className="mt-6">
                  <div className="mb-3 flex items-end justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black text-gray-950">Precisam de atenção</h3>
                      <p className="mt-1 text-xs text-gray-500">Nenhum item é apagado automaticamente.</p>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    {deadLetterItems.map(item => (
                      <OperationRow
                        key={item.id}
                        item={item}
                        failed
                        busy={Boolean(action)}
                        onRetry={() => void retryOne(item.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {pendingItems.length > 0 && (
                <section className="mt-6">
                  <h3 className="mb-3 text-sm font-black text-gray-950">Aguardando envio</h3>
                  <div className="grid gap-2">
                    {pendingItems.map(item => (
                      <OperationRow key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              )}

              {totalIssues === 0 && storageAvailable && (
                <div className="mt-6 rounded-3xl border border-dashed border-gray-300 bg-white px-5 py-8 text-center">
                  <p className="text-base font-black text-gray-900">Tudo sincronizado</p>
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Não há séries ou operações locais aguardando envio.
                  </p>
                </div>
              )}

              <p className="mt-5 text-center text-[11px] text-gray-400">
                {lastCheckedAt ? `Verificado ${formatRelativeTimestamp(lastCheckedAt)}` : 'Verificação ainda não concluída'}
              </p>
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export default OfflineSyncHealthPanel;
