import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react';
import { supabase } from '../../../lib/api/supabase';
import { flushOperationalTelemetry } from '../../../lib/telemetry/operationalTelemetryTransport';

interface TelemetryRow {
  day: string;
  event_name: string;
  route_group: string;
  build: string;
  event_count: number;
  last_seen_at: string;
}

const EVENT_LABELS: Record<string, string> = {
  app_runtime_error: 'Erro de renderização',
  app_recovery_retry: 'Tentativa de recuperação',
  app_recovery_reload: 'Recarga após incidente',
  connectivity_online: 'Conexão restaurada',
  connectivity_offline: 'Perda de conexão',
  sync_storage_unavailable: 'Armazenamento indisponível',
  sync_storage_restored: 'Armazenamento restaurado',
  sync_queue_added: 'Operação adicionada à fila',
  sync_dead_lettered: 'Operação enviada para revisão',
  sync_dead_letter_restored: 'Operação recuperada',
  sync_cycle_started: 'Ciclo de sincronização iniciado',
  sync_cycle_succeeded: 'Ciclo de sincronização concluído',
  sync_cycle_failed: 'Ciclo de sincronização falhou',
  sync_manual_started: 'Sincronização manual iniciada',
  sync_manual_succeeded: 'Sincronização manual concluída',
  sync_manual_failed: 'Sincronização manual falhou',
  sync_retry_one_started: 'Reprocessamento individual iniciado',
  sync_retry_one_succeeded: 'Reprocessamento individual concluído',
  sync_retry_one_failed: 'Reprocessamento individual falhou',
  sync_retry_all_started: 'Reprocessamento em lote iniciado',
  sync_retry_all_succeeded: 'Reprocessamento em lote concluído',
  sync_retry_all_failed: 'Reprocessamento em lote falhou',
  diagnostic_copied: 'Diagnóstico seguro copiado',
};

const CRITICAL_EVENTS = new Set([
  'app_runtime_error',
  'sync_storage_unavailable',
  'sync_dead_lettered',
  'sync_cycle_failed',
  'sync_manual_failed',
  'sync_retry_one_failed',
  'sync_retry_all_failed',
]);

const formatEventLabel = (eventName: string) => EVENT_LABELS[eventName] || eventName;

const OperationalTelemetryDashboard: React.FC = () => {
  const [rows, setRows] = useState<TelemetryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [migrationPending, setMigrationPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (manual = false) => {
    manual ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      await flushOperationalTelemetry();
      const start = new Date();
      start.setUTCDate(start.getUTCDate() - 6);
      const { data, error: queryError } = await supabase
        .from('operational_telemetry_summary')
        .select('day,event_name,route_group,build,event_count,last_seen_at')
        .gte('day', start.toISOString().slice(0, 10))
        .order('day', { ascending: false })
        .order('event_count', { ascending: false })
        .limit(500);

      if (queryError) {
        const missing = queryError.code === '42P01'
          || queryError.code === 'PGRST205'
          || queryError.message?.includes('operational_telemetry_summary');
        if (missing) {
          setMigrationPending(true);
          setRows([]);
          return;
        }
        throw queryError;
      }

      setMigrationPending(false);
      setRows((data || []) as TelemetryRow[]);
    } catch {
      setError('Não foi possível carregar a saúde operacional agora.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const total = rows.reduce((sum, row) => sum + Number(row.event_count || 0), 0);
    const critical = rows
      .filter(row => CRITICAL_EVENTS.has(row.event_name))
      .reduce((sum, row) => sum + Number(row.event_count || 0), 0);
    const recovered = rows
      .filter(row => row.event_name.includes('succeeded') || row.event_name === 'sync_dead_letter_restored')
      .reduce((sum, row) => sum + Number(row.event_count || 0), 0);
    return { total, critical, recovered, builds: new Set(rows.map(row => row.build)).size };
  }, [rows]);

  const topEvents = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const row of rows) {
      grouped.set(row.event_name, (grouped.get(row.event_name) || 0) + Number(row.event_count || 0));
    }
    return Array.from(grouped.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [rows]);

  return (
    <section className="mt-8 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <Activity size={14} /> P1.3 · últimos 7 dias
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Saúde operacional agregada</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Contagens técnicas por evento, rota e build. Sem IDs de usuário, mensagens de erro ou conteúdo de treino.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load(true)}
          disabled={refreshing}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> Atualizar
        </button>
      </div>

      {migrationPending ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <div className="flex items-center gap-2 font-black"><AlertTriangle size={18} /> Coleta persistente aguardando ativação</div>
          <p className="mt-2 text-sm leading-6">
            A interface e a outbox local já estão prontas. A migration P1.3 ainda não foi aplicada ao Supabase.
          </p>
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-800">{error}</div>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Eventos agregados', totals.total, Activity],
              ['Exigem atenção', totals.critical, AlertTriangle],
              ['Recuperações', totals.recovered, ShieldCheck],
              ['Builds observados', totals.builds, RefreshCw],
            ].map(([label, value, Icon]) => (
              <div key={String(label)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between text-slate-400">
                  <p className="text-[10px] font-black uppercase tracking-wider">{String(label)}</p>
                  <Icon size={16} />
                </div>
                <p className="mt-3 text-3xl font-black text-slate-950">{loading ? '—' : Number(value)}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
            <div className="rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Eventos mais frequentes</h3>
              <div className="mt-4 space-y-3">
                {topEvents.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum evento persistido no período.</p>
                ) : topEvents.map(([eventName, count]) => (
                  <div key={eventName} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                    <span className="text-sm font-semibold text-slate-700">{formatEventLabel(eventName)}</span>
                    <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-black text-white">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Privacidade por projeto</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                {[
                  'Sem identificador de usuário',
                  'Sem e-mail, token ou credencial',
                  'Sem mensagem ou stack trace no banco',
                  'Sem conteúdo de treino ou payload offline',
                ].map(item => (
                  <div key={item} className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-800">
                    <ShieldCheck size={17} className="shrink-0" /> <span className="font-semibold">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default OperationalTelemetryDashboard;
