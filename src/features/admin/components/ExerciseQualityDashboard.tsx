import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Loader2,
  RefreshCw,
  Replace,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import {
  exerciseQualityAdminApi,
  ExerciseQualityAssessment,
  ExerciseQualityDashboardResponse,
  ExerciseQualityProposal,
  ExerciseSubstitute,
} from '../../../lib/api/exerciseQualityAdminApi';

const statusLabels: Record<string, string> = {
  approved: 'Aprovado',
  approved_with_media_pending: 'Aprovado · mídia pendente',
  good: 'Bom',
  review: 'Revisão necessária',
  incomplete: 'Incompleto',
};

const severityClasses: Record<string, string> = {
  high: 'border-rose-200 bg-rose-50 text-rose-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  low: 'border-blue-100 bg-blue-50 text-blue-700',
};

const dimensionConfig = [
  ['Anatomia', 'anatomy_average', 25],
  ['Técnica', 'technique_average', 20],
  ['Segurança', 'safety_average', 15],
  ['Equipamento', 'equipment_average', 10],
  ['Taxonomia', 'taxonomy_average', 10],
  ['Busca', 'search_average', 10],
  ['Mídia', 'media_average', 10],
] as const;

const ExerciseQualityDashboard: React.FC = () => {
  const [data, setData] = useState<ExerciseQualityDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showAllIssues, setShowAllIssues] = useState(false);
  const [substituteSource, setSubstituteSource] = useState<ExerciseQualityAssessment | null>(null);
  const [substitutes, setSubstitutes] = useState<ExerciseSubstitute[]>([]);
  const [loadingSubstitutes, setLoadingSubstitutes] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await exerciseQualityAdminApi.getDashboard();
      setData(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const execute = async (key: string, task: () => Promise<unknown>, success: string) => {
    setRunning(key);
    setError(null);
    setMessage(null);
    try {
      await task();
      setMessage(success);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(null);
    }
  };

  const runAudit = () => {
    const confirmed = window.confirm(
      'Executar novamente a auditoria técnica dos 148 exercícios? A análise não altera os exercícios; apenas atualiza notas, problemas e propostas.',
    );
    if (!confirmed) return;
    void execute('audit', () => exerciseQualityAdminApi.runAudit(), 'Auditoria técnica concluída.');
  };

  const applySafe = () => {
    const safeCount = data?.proposals.filter((proposal) => proposal.risk_level === 'safe').length || 0;
    if (safeCount === 0) return;
    const confirmed = window.confirm(
      `Aplicar ${safeCount} correções classificadas como seguras? Cada alteração será registrada com snapshot e poderá ser rastreada.`,
    );
    if (!confirmed) return;
    void execute(
      'safe',
      () => exerciseQualityAdminApi.applySafeProposals(),
      `${safeCount} correções seguras processadas.`,
    );
  };

  const reviewProposal = (proposal: ExerciseQualityProposal, decision: 'approve' | 'reject') => {
    const action = decision === 'approve' ? 'aprovar e aplicar' : 'rejeitar';
    const confirmed = window.confirm(`${action[0].toUpperCase()}${action.slice(1)} a proposta para “${proposal.exerciseName}”?`);
    if (!confirmed) return;
    const notes = window.prompt('Observação opcional para o histórico:', '') ?? undefined;
    void execute(
      `${decision}-${proposal.id}`,
      () => exerciseQualityAdminApi.reviewProposal(proposal.id, decision, notes),
      decision === 'approve' ? 'Correção aplicada e auditoria recalculada.' : 'Proposta rejeitada sem alterar o exercício.',
    );
  };

  const openSubstitutes = async (assessment: ExerciseQualityAssessment) => {
    setSubstituteSource(assessment);
    setSubstitutes([]);
    setLoadingSubstitutes(true);
    try {
      const alternatives = await exerciseQualityAdminApi.getSubstitutes(assessment.exercise_id, undefined, 8);
      setSubstitutes(alternatives);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingSubstitutes(false);
    }
  };

  const dashboard = data?.dashboard;
  const proposals = data?.proposals || [];
  const safeProposals = proposals.filter((proposal) => proposal.risk_level === 'safe');
  const reviewAssessments = useMemo(
    () => (data?.assessments || []).filter((assessment) => assessment.issues.length > 0),
    [data?.assessments],
  );
  const visibleAssessments = showAllIssues ? reviewAssessments : reviewAssessments.slice(0, 12);

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-7">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-violet-600">
            <FlaskConical size={14} />
            Motor de qualidade técnica · P3
          </div>
          <h3 className="text-2xl font-black tracking-tight text-slate-950">Qualidade real da biblioteca</h3>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
            Avalia anatomia, técnica, segurança, equipamento, taxonomia, busca e mídia. A imagem representa apenas 10% da nota.
          </p>
          <p className="mt-3 text-xs font-semibold text-slate-400">
            A auditoria é determinística e não altera conteúdo automaticamente. Somente propostas seguras aprovadas são aplicadas com histórico.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading || Boolean(running)}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 disabled:opacity-40"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
          <button
            type="button"
            onClick={runAudit}
            disabled={loading || Boolean(running)}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-slate-950/20 disabled:opacity-40"
          >
            {running === 'audit' ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
            Executar auditoria
          </button>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ['Nota média', dashboard?.average_score ?? '—'],
          ['Aprovados', (dashboard?.approved || 0) + (dashboard?.media_pending || 0)],
          ['Bons', dashboard?.good ?? '—'],
          ['Em revisão', dashboard?.review ?? '—'],
          ['Alta prioridade', dashboard?.high_priority ?? '—'],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="mt-3 text-3xl font-black tracking-tighter text-slate-950">{loading ? '—' : value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50/60 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h4 className="font-black text-slate-950">Pontuação por dimensão</h4>
            <p className="mt-1 text-xs font-semibold text-slate-500">A barra compara a média atual com o peso máximo da dimensão.</p>
          </div>
          <span className="rounded-full bg-violet-100 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-violet-700">
            {dashboard?.total_exercises || 0} exercícios
          </span>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dimensionConfig.map(([label, field, max]) => {
            const value = Number(dashboard?.[field] || 0);
            const percent = Math.min(100, Math.round((value / max) * 100));
            return (
              <div key={field} className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex items-center justify-between text-xs font-black text-slate-700">
                  <span>{label}</span>
                  <span>{value.toFixed(1)}/{max}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-emerald-600" />
            <div>
              <h4 className="font-black text-emerald-950">Correções automáticas seguras</h4>
              <p className="mt-1 text-xs font-semibold leading-5 text-emerald-700">
                Apenas mudanças explícitas e reversíveis entram neste lote. Casos moderados ficam para decisão individual.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={applySafe}
            disabled={safeProposals.length === 0 || Boolean(running)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-[10px] font-black uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {running === 'safe' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Aplicar seguras ({safeProposals.length})
          </button>
        </div>
      </div>

      {proposals.length > 0 && (
        <div className="mt-7">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-lg font-black text-slate-950">Propostas pendentes</h4>
              <p className="mt-1 text-xs font-semibold text-slate-500">Compare o valor atual com a correção proposta antes de aplicar.</p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-amber-700">{proposals.length}</span>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {proposals.map((proposal) => {
              const busy = Boolean(running?.endsWith(proposal.id));
              return (
                <article key={proposal.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h5 className="font-black text-slate-950">{proposal.exerciseName}</h5>
                      <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-400">Campo: {proposal.field_name}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1.5 text-[8px] font-black uppercase tracking-widest ${proposal.risk_level === 'safe' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {proposal.risk_level === 'safe' ? 'Segura' : 'Revisar'} · {Math.round(proposal.confidence * 100)}%
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Atual</p>
                      <p className="mt-2 text-sm font-bold text-slate-700">{exerciseQualityAdminApi.asDisplayValue(proposal.current_value)}</p>
                    </div>
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                      <p className="text-[8px] font-black uppercase tracking-widest text-blue-500">Proposto</p>
                      <p className="mt-2 text-sm font-bold text-blue-900">{exerciseQualityAdminApi.asDisplayValue(proposal.proposed_value)}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{proposal.reason}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => reviewProposal(proposal, 'approve')}
                      disabled={busy}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-[9px] font-black uppercase tracking-widest text-white disabled:opacity-40"
                    >
                      {running === `approve-${proposal.id}` ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />} Aprovar
                    </button>
                    <button
                      type="button"
                      onClick={() => reviewProposal(proposal, 'reject')}
                      disabled={busy}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 text-[9px] font-black uppercase tracking-widest text-rose-700 disabled:opacity-40"
                    >
                      {running === `reject-${proposal.id}` ? <Loader2 size={13} className="animate-spin" /> : <X size={14} />} Rejeitar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-lg font-black text-slate-950">Diagnóstico por exercício</h4>
            <p className="mt-1 text-xs font-semibold text-slate-500">Prioriza problemas técnicos e separa a pendência de mídia.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-600">{reviewAssessments.length} com apontamentos</span>
        </div>
        <div className="space-y-3">
          {visibleAssessments.map((assessment) => (
            <article key={assessment.exercise_id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h5 className="font-black text-slate-950">{assessment.exerciseName}</h5>
                    <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-white">{assessment.total_score}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-slate-600">{statusLabels[assessment.status] || assessment.status}</span>
                  </div>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{assessment.muscleGroup} · {assessment.subgroup} · {assessment.equipment}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {assessment.issues.map((issue, index) => (
                      <span key={`${issue.code}-${index}`} className={`rounded-full border px-3 py-1.5 text-[8px] font-black uppercase tracking-wide ${severityClasses[issue.severity] || severityClasses.low}`} title={issue.message}>
                        {issue.message}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void openSubstitutes(assessment)}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 text-[9px] font-black uppercase tracking-widest text-violet-700"
                >
                  <Replace size={14} /> Ver substitutos
                </button>
              </div>
            </article>
          ))}
        </div>
        {reviewAssessments.length > 12 && (
          <button
            type="button"
            onClick={() => setShowAllIssues((current) => !current)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-600"
          >
            {showAllIssues ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showAllIssues ? 'Mostrar menos' : `Mostrar todos (${reviewAssessments.length})`}
          </button>
        )}
      </div>

      {substituteSource && (
        <div className="mt-7 rounded-3xl border border-violet-200 bg-violet-50/50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-violet-700"><Target size={17} /><h4 className="font-black">Substitutos para {substituteSource.exerciseName}</h4></div>
              <p className="mt-1 text-xs font-semibold text-violet-700/70">Mesmo grupo muscular, padrão de movimento e melhor qualidade técnica disponível.</p>
            </div>
            <button type="button" onClick={() => setSubstituteSource(null)} className="rounded-xl border border-violet-200 bg-white p-2 text-violet-700"><X size={15} /></button>
          </div>
          {loadingSubstitutes ? (
            <div className="flex items-center gap-2 py-8 text-sm font-bold text-violet-700"><Loader2 size={16} className="animate-spin" /> Calculando alternativas...</div>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {substitutes.map((item) => (
                <div key={item.exercise_id} className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2"><h5 className="text-sm font-black text-slate-950">{item.name}</h5><span className="rounded-full bg-violet-100 px-2 py-1 text-[8px] font-black text-violet-700">{item.match_score}</span></div>
                  <p className="mt-2 text-[9px] font-bold uppercase tracking-widest text-slate-400">{item.subgroup} · {item.equipment}</p>
                  <p className="mt-3 text-xs font-bold text-slate-600">Qualidade: {item.quality_score}</p>
                  <ul className="mt-2 space-y-1 text-[10px] font-semibold text-slate-500">{item.reasons.map((reason) => <li key={reason}>• {reason}</li>)}</ul>
                </div>
              ))}
              {substitutes.length === 0 && <p className="text-sm font-bold text-violet-700">Nenhum substituto compatível encontrado.</p>}
            </div>
          )}
        </div>
      )}

      {message && <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700"><CheckCircle2 size={16} />{message}</div>}
      {error && <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700"><AlertTriangle size={16} className="mt-0.5 shrink-0" />{error}</div>}
    </section>
  );
};

export default ExerciseQualityDashboard;
