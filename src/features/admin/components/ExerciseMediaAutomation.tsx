import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Square,
  TriangleAlert,
} from 'lucide-react';
import {
  exerciseMediaAdminApi,
  ExerciseMediaBatchResponse,
  ExerciseMediaProcessMode,
  ExerciseMediaQueueSummaryRow,
} from '../../../lib/api/exerciseMediaAdminApi';

const MAX_AUTOMATION_BATCHES = 80;

function countJobs(
  summary: ExerciseMediaQueueSummaryRow[],
  status: string,
  mediaType?: string,
  actions?: string[],
): number {
  return summary
    .filter((row) => row.status === status)
    .filter((row) => !mediaType || row.media_type === mediaType)
    .filter((row) => !actions || actions.includes(row.action))
    .reduce((total, row) => total + Number(row.jobs || 0), 0);
}

const ExerciseMediaAutomation: React.FC = () => {
  const [summary, setSummary] = useState<ExerciseMediaQueueSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastBatch, setLastBatch] = useState<ExerciseMediaBatchResponse | null>(null);
  const [processedThisRun, setProcessedThisRun] = useState(0);
  const stopRequested = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const response = await exerciseMediaAdminApi.getStatus();
      setSummary(response.summary || []);
      setError(null);
      return response.summary || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const metrics = useMemo(() => ({
    pendingValidation: countJobs(summary, 'pending', 'main', ['validate']),
    pendingGeneration: countJobs(summary, 'pending', 'main', ['generate', 'replace']),
    completedMain: countJobs(summary, 'completed', 'main'),
    failedMain: countJobs(summary, 'failed', 'main') + countJobs(summary, 'review', 'main'),
    deferredVariants: countJobs(summary, 'deferred', 'variant'),
  }), [summary]);

  const pendingMain = metrics.pendingValidation + metrics.pendingGeneration;
  const totalMain = pendingMain + metrics.completedMain + metrics.failedMain;
  const completionRate = totalMain > 0
    ? Math.round((metrics.completedMain / totalMain) * 100)
    : 100;

  const processOneBatch = useCallback(async (
    mode: ExerciseMediaProcessMode,
    limit = 5,
  ) => {
    const result = await exerciseMediaAdminApi.processBatch(mode, limit);
    setLastBatch(result);
    setProcessedThisRun((current) => current + result.processed);
    await refresh();
    return result;
  }, [refresh]);

  const runAll = useCallback(async () => {
    stopRequested.current = false;
    setRunning(true);
    setError(null);
    setProcessedThisRun(0);

    try {
      for (let batch = 0; batch < MAX_AUTOMATION_BATCHES; batch += 1) {
        if (stopRequested.current) break;

        const current = await refresh();
        const validations = countJobs(current, 'pending', 'main', ['validate']);
        const generations = countJobs(current, 'pending', 'main', ['generate', 'replace']);

        if (validations <= 0 && generations <= 0) break;
        const mode: ExerciseMediaProcessMode = validations > 0 ? 'validate' : 'generate';
        const result = await processOneBatch(mode, 5);

        if (result.processed === 0) break;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
      await refresh().catch(() => undefined);
    }
  }, [processOneBatch, refresh]);

  const stop = () => {
    stopRequested.current = true;
  };

  const retryFailed = async () => {
    setRunning(true);
    setError(null);
    try {
      await exerciseMediaAdminApi.retryFailed();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  };

  const cards = [
    {
      label: 'Para validar',
      value: metrics.pendingValidation,
      detail: 'imagens atuais',
      icon: ShieldCheck,
    },
    {
      label: 'Para gerar',
      value: metrics.pendingGeneration,
      detail: 'ausentes ou inválidas',
      icon: Sparkles,
    },
    {
      label: 'Concluídas',
      value: metrics.completedMain,
      detail: `${completionRate}% da biblioteca`,
      icon: CheckCircle2,
    },
    {
      label: 'Com falha',
      value: metrics.failedMain,
      detail: 'retentativa disponível',
      icon: TriangleAlert,
    },
  ];

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-7 shadow-[0_12px_40px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
            <ImageIcon size={14} />
            Auditoria automática de mídia
          </div>
          <h3 className="text-2xl font-black tracking-tight text-slate-950">
            Imagens da biblioteca de exercícios
          </h3>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
            Valida URLs existentes, substitui arquivos quebrados, gera as imagens ausentes e envia tudo para o Supabase Storage.
          </p>
          <p className="mt-3 text-xs font-semibold text-slate-400">
            As {metrics.deferredVariants} variantes por sexo e nível permanecem adiadas para evitar geração sem uso funcional confirmado.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading || running}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 transition hover:border-slate-300 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>

          {running ? (
            <button
              type="button"
              onClick={stop}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-rose-600 px-5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-rose-500/20"
            >
              <Square size={13} fill="currentColor" />
              Parar após o lote
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void runAll()}
              disabled={pendingMain === 0}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-slate-950/20 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Play size={14} fill="currentColor" />
              Executar tudo
            </button>
          )}
        </div>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map(({ label, value, detail, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
              <Icon size={15} className="text-slate-400" />
            </div>
            <p className="mt-3 text-3xl font-black tracking-tighter text-slate-950">{loading ? '—' : value}</p>
            <p className="mt-1 text-[10px] font-bold text-slate-400">{detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
          style={{ width: `${completionRate}%` }}
        />
      </div>

      {(running || processedThisRun > 0) && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs font-bold text-blue-700">
          {running && <Loader2 size={16} className="animate-spin" />}
          <span>
            {running ? 'Automação em execução.' : 'Execução encerrada.'} Processados nesta rodada: {processedThisRun}.
          </span>
        </div>
      )}

      {lastBatch && (
        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
          Último lote: {lastBatch.validated} validadas, {lastBatch.generated} geradas, {lastBatch.replaced} substituídas e {lastBatch.failed} falhas.
        </div>
      )}

      {metrics.failedMain > 0 && !running && (
        <button
          type="button"
          onClick={() => void retryFailed()}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-amber-700"
        >
          <RefreshCw size={13} />
          Recolocar falhas na fila
        </button>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          {error}
        </div>
      )}
    </section>
  );
};

export default ExerciseMediaAutomation;
