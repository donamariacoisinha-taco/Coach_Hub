import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  CircleOff,
  Image as ImageIcon,
  Loader2,
  LockKeyhole,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  X,
} from 'lucide-react';
import {
  exerciseMediaAdminApi,
  ExerciseMediaCandidate,
  ExerciseMediaDashboardResponse,
  ExerciseMediaQueueSummaryRow,
} from '../../../lib/api/exerciseMediaAdminApi';

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

const criteriaLabels: Record<string, string> = {
  visual_style: 'Estilo visual',
  human_model: 'Modelo humano',
  movement: 'Movimento',
  load: 'Carga e equipamento',
  composition: 'Composição',
  primary_muscles: 'Músculos principais',
  secondary_muscles: 'Músculos secundários',
  background: 'Fundo',
  camera: 'Câmera',
  lighting: 'Iluminação',
  reference_dimensions: 'Referência de proporção',
  reference_source: 'Referências',
};

const ExerciseMediaAutomation: React.FC = () => {
  const [dashboard, setDashboard] = useState<ExerciseMediaDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await exerciseMediaAdminApi.getDashboard();
      setDashboard(response);
      setError(null);
      return response;
    } catch (err) {
      const text = err instanceof Error ? err.message : String(err);
      setError(text);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const summary = dashboard?.summary || [];
  const policy = dashboard?.policy || null;
  const candidates = dashboard?.candidates || [];
  const pendingCandidates = candidates.filter((candidate) => candidate.status === 'pending');
  const recentReviewed = candidates
    .filter((candidate) => candidate.status === 'approved' || candidate.status === 'rejected')
    .slice(0, 6);

  const metrics = useMemo(() => ({
    pendingValidation: countJobs(summary, 'pending', 'main', ['validate']),
    pendingGeneration: countJobs(summary, 'pending', 'main', ['generate', 'replace']),
    awaitingApproval: countJobs(summary, 'awaiting_approval', 'main'),
    completedMain: countJobs(summary, 'completed', 'main'),
    failedMain: countJobs(summary, 'failed', 'main') + countJobs(summary, 'review', 'main'),
    deferredVariants: countJobs(summary, 'deferred', 'variant'),
  }), [summary]);

  const execute = async (key: string, task: () => Promise<unknown>, success: string) => {
    setRunningAction(key);
    setError(null);
    setMessage(null);
    try {
      await task();
      setMessage(success);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunningAction(null);
    }
  };

  const validateUrls = () => execute(
    'validate',
    () => exerciseMediaAdminApi.validateUrls(5),
    'Lote de URLs analisado. Nenhuma imagem oficial foi alterada.',
  );

  const generatePilot = () => {
    const confirmed = window.confirm(
      'Gerar até seis imagens piloto? Elas serão salvas apenas como candidatas e não substituirão nenhuma imagem sem sua aprovação.',
    );
    if (!confirmed) return;
    void execute(
      'pilot',
      () => exerciseMediaAdminApi.generatePilot(),
      'Lote piloto gerado. Revise cada candidata antes de aprovar.',
    );
  };

  const generateBatch = () => {
    const confirmed = window.confirm(
      'Gerar cinco novas candidatas usando o padrão aprovado? Nenhuma será aplicada automaticamente.',
    );
    if (!confirmed) return;
    void execute(
      'batch',
      () => exerciseMediaAdminApi.generateBatch(5),
      'Cinco candidatas foram processadas para revisão.',
    );
  };

  const approve = (candidate: ExerciseMediaCandidate) => {
    const confirmed = window.confirm(
      `Aprovar a imagem de “${candidate.exerciseName}” e torná-la a imagem oficial do exercício?`,
    );
    if (!confirmed) return;
    void execute(
      `approve-${candidate.id}`,
      () => exerciseMediaAdminApi.reviewCandidate(candidate.id, 'approve'),
      `Imagem de “${candidate.exerciseName}” aprovada e aplicada.`,
    );
  };

  const reject = (candidate: ExerciseMediaCandidate) => {
    const notes = window.prompt(
      `Motivo da reprovação de “${candidate.exerciseName}”. Exemplo: músculo destacado errado, equipamento incorreto ou postura inadequada.`,
      '',
    );
    if (notes === null) return;
    void execute(
      `reject-${candidate.id}`,
      () => exerciseMediaAdminApi.reviewCandidate(candidate.id, 'reject', notes),
      `Candidata de “${candidate.exerciseName}” reprovada. A imagem oficial foi preservada.`,
    );
  };

  const regenerate = (candidate: ExerciseMediaCandidate) => {
    const notes = window.prompt(
      `Informe o que deve ser corrigido na nova geração de “${candidate.exerciseName}”.`,
      candidate.reviewNotes || '',
    );
    if (notes === null) return;
    void execute(
      `regenerate-${candidate.id}`,
      () => exerciseMediaAdminApi.regenerateCandidate(candidate.id, notes),
      `“${candidate.exerciseName}” foi recolocado na fila de geração.`,
    );
  };

  const retryFailed = () => execute(
    'retry',
    () => exerciseMediaAdminApi.retryFailed(),
    'Falhas elegíveis foram recolocadas na fila.',
  );

  const policyCriteria = policy
    ? Object.entries(policy.criteria || {}).filter(([key]) => key !== 'forbidden')
    : [];
  const forbidden = policy && Array.isArray(policy.criteria?.forbidden)
    ? policy.criteria.forbidden as string[]
    : [];

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-7">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
            <ImageIcon size={14} />
            Auditoria e aprovação de mídia
          </div>
          <h3 className="text-2xl font-black tracking-tight text-slate-950">
            Imagens da biblioteca de exercícios
          </h3>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
            O sistema valida arquivos atuais, cria imagens candidatas e exige aprovação administrativa antes de qualquer substituição.
          </p>
          <p className="mt-3 text-xs font-semibold text-slate-400">
            As {metrics.deferredVariants} variantes por sexo e nível continuam adiadas. O fluxo atual trabalha somente com a imagem principal de cada exercício.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading || Boolean(runningAction)}
          className="inline-flex h-11 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 transition hover:border-slate-300 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      <div className="mt-7 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-600" />
              <h4 className="font-black text-slate-950">Política visual oficial</h4>
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {policy ? `${policy.name} · versão ${policy.version}` : 'Nenhuma política aprovada'}
            </p>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[9px] font-black uppercase tracking-widest ${policy?.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {policy?.status === 'approved' ? <CheckCircle2 size={13} /> : <LockKeyhole size={13} />}
            {policy?.status === 'approved' ? 'Critérios aprovados' : 'Geração bloqueada'}
          </div>
        </div>

        {policy && (
          <>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {policyCriteria.map(([key, value]) => (
                <div key={key} className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    {criteriaLabels[key] || key}
                  </p>
                  <p className="mt-2 text-xs font-bold leading-relaxed text-slate-700">
                    {String(value)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Saída técnica</p>
              <p className="mt-2 text-xs font-bold text-slate-700">
                Proporção {policy.aspect_ratio}, geração {policy.image_size}, referência editorial {policy.target_width} × {policy.target_height}.
              </p>
              <p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">
                A imagem gerada mantém a proporção 3:2 em resolução superior e é exibida no padrão visual definido para o aplicativo.
              </p>
            </div>

            {forbidden.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {forbidden.map((item) => (
                  <span key={item} className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-wide text-rose-600">
                    Proibido: {item}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-5">
        {[
          ['URLs para validar', metrics.pendingValidation],
          ['Para gerar', metrics.pendingGeneration],
          ['Aguardando aprovação', metrics.awaitingApproval],
          ['Concluídas', metrics.completedMain],
          ['Falhas/revisão', metrics.failedMain],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="mt-3 text-3xl font-black tracking-tighter text-slate-950">{loading ? '—' : value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50/60 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              {dashboard?.pilot.unlocked ? (
                <CheckCircle2 size={18} className="text-emerald-600" />
              ) : (
                <LockKeyhole size={18} className="text-amber-600" />
              )}
              <h4 className="font-black text-slate-950">Lote piloto</h4>
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {dashboard?.pilot.approved || 0} de {dashboard?.pilot.required || 6} aprovadas. O lote completo permanece {dashboard?.pilot.unlocked ? 'liberado' : 'bloqueado'}.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={validateUrls}
              disabled={Boolean(runningAction) || metrics.pendingValidation === 0}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {runningAction === 'validate' ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              Validar 5 URLs
            </button>

            <button
              type="button"
              onClick={generatePilot}
              disabled={Boolean(runningAction) || !policy || dashboard?.pilot.unlocked || dashboard?.pilot.awaitingApproval > 0}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {runningAction === 'pilot' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Gerar pilotos
            </button>

            <button
              type="button"
              onClick={generateBatch}
              disabled={Boolean(runningAction) || !dashboard?.pilot.unlocked || pendingCandidates.length > 0 || metrics.pendingGeneration === 0}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-slate-950/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {runningAction === 'batch' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Gerar próximas 5
            </button>
          </div>
        </div>
      </div>

      {pendingCandidates.length > 0 && (
        <div className="mt-7">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-lg font-black text-slate-950">Candidatas aguardando decisão</h4>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Compare a imagem atual com a proposta. Aprovar altera o exercício; rejeitar preserva a imagem atual.
              </p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-amber-700">
              {pendingCandidates.length} pendentes
            </span>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            {pendingCandidates.map((candidate) => {
              const busy = Boolean(runningAction?.endsWith(candidate.id));
              return (
                <article key={candidate.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-black text-slate-950">{candidate.exerciseName}</h5>
                        {candidate.isPilot && (
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-blue-700">Piloto</span>
                        )}
                      </div>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{candidate.muscleGroup}</p>
                    </div>
                  </div>

                  <div className="grid gap-px bg-slate-200 md:grid-cols-2">
                    <div className="bg-white p-3">
                      <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Imagem atual</p>
                      <div className="aspect-[3/2] overflow-hidden rounded-2xl bg-slate-100">
                        {candidate.currentUrl ? (
                          <img src={candidate.currentUrl} alt={`Imagem atual de ${candidate.exerciseName}`} className="h-full w-full object-contain" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-300">
                            <CircleOff size={30} />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-white p-3">
                      <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-blue-600">Imagem candidata</p>
                      <div className="aspect-[3/2] overflow-hidden rounded-2xl bg-slate-100">
                        <img src={candidate.candidateUrl} alt={`Candidata de ${candidate.exerciseName}`} className="h-full w-full object-contain" />
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <details className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <summary className="cursor-pointer text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Ver prompt e critérios aplicados
                      </summary>
                      <p className="mt-3 max-h-40 overflow-y-auto text-xs font-medium leading-relaxed text-slate-600">
                        {candidate.prompt}
                      </p>
                    </details>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => approve(candidate)}
                        disabled={busy}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-[9px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                      >
                        {runningAction === `approve-${candidate.id}` ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
                        Aprovar
                      </button>
                      <button
                        type="button"
                        onClick={() => reject(candidate)}
                        disabled={busy}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-3 text-[9px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                      >
                        {runningAction === `reject-${candidate.id}` ? <Loader2 size={13} className="animate-spin" /> : <X size={14} />}
                        Rejeitar
                      </button>
                      <button
                        type="button"
                        onClick={() => regenerate(candidate)}
                        disabled={busy}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[9px] font-black uppercase tracking-widest text-slate-700 disabled:opacity-50"
                      >
                        {runningAction === `regenerate-${candidate.id}` ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={14} />}
                        Refazer
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {recentReviewed.length > 0 && (
        <div className="mt-7 rounded-3xl border border-slate-200 bg-slate-50/50 p-5">
          <h4 className="font-black text-slate-950">Revisões recentes</h4>
          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {recentReviewed.map((candidate) => (
              <div key={candidate.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3">
                {candidate.status === 'approved' ? (
                  <CheckCircle2 size={17} className="shrink-0 text-emerald-600" />
                ) : (
                  <TriangleAlert size={17} className="shrink-0 text-rose-600" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-slate-800">{candidate.exerciseName}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    {candidate.status === 'approved' ? 'Aprovada' : 'Rejeitada'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {metrics.failedMain > 0 && !runningAction && (
        <button
          type="button"
          onClick={() => void retryFailed()}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-amber-700"
        >
          <RefreshCw size={13} />
          Recolocar falhas na fila
        </button>
      )}

      {message && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
          <CheckCircle2 size={16} />
          {message}
        </div>
      )}

      {error && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}
    </section>
  );
};

export default ExerciseMediaAutomation;
