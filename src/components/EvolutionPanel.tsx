import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { WorkoutHistory } from '../types';
import { workoutApi } from '../lib/api/workoutApi';
import { buildEvolution, evolutionChange, evolutionRecord, inEvolutionPeriod, periodPoints, type EvolutionLog, type EvolutionPeriod, type EvolutionMetric } from '../domain/progression/evolutionMetrics';

const number = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const date = (value: string) => new Date(value).toLocaleDateString('pt-BR');
const labels: Record<EvolutionMetric, string> = { load: 'Carga máxima', reps: 'Repetições por série', estimatedMax: '1RM estimado', volume: 'Volume por sessão' };
const units: Record<EvolutionMetric, string> = { load: 'kg', reps: 'reps', estimatedMax: 'kg', volume: 'kg·reps' };
const card = 'rounded-2xl bg-white border border-slate-200 p-5';
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function EvolutionPanel({ history, revision, mode, onExercise, onSession }: {
  history: WorkoutHistory[]; revision: number; mode: 'summary' | 'exercises'; onExercise: () => void; onSession?: (id: string) => void;
}) {
  const [logs, setLogs] = useState<EvolutionLog[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [retry, setRetry] = useState(0);
  const [period, setPeriod] = useState<EvolutionPeriod>(30);
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');
  const [metric, setMetric] = useState<EvolutionMetric>('load');
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    workoutApi.getEvolutionLogs(history).then(rows => { if (!cancelled) { setLogs(rows); setStatus('ready'); } })
      .catch(() => { if (!cancelled) { setLogs([]); setStatus('error'); } });
    return () => { cancelled = true; };
  }, [history, revision, retry]);
  const exercises = useMemo(() => buildEvolution(history, logs), [history, logs]);
  const visible = exercises.filter(e => normalize(e.name).includes(normalize(search)));
  const chosen = visible.find(e => e.id === selected) || visible[0];
  const now = Date.now();
  const current = chosen ? periodPoints(chosen, period, now) : [];
  const hasLoad = chosen?.points.some(p => p.load !== null);
  const activeMetric = !hasLoad && (metric === 'load' || metric === 'estimatedMax' || metric === 'volume') ? 'reps' : metric;
  const record = evolutionRecord(current, activeMetric);
  const change = evolutionChange(current, activeMetric);
  const sessions = history.filter(h => h.completed_at && inEvolutionPeriod(h.completed_at, period, now));
  const active = exercises.filter(e => periodPoints(e, period, now).length > 0);
  const periodLabel = period === 'all' ? 'Todo o histórico' : `Últimos ${period} dias`;
  const highlights = active.map(e => { const points = periodPoints(e, period, now); const metric: EvolutionMetric = points.some(p => p.load !== null) ? 'load' : 'reps'; return { exercise: e, points, metric, change: evolutionChange(points, metric) }; });
  if (status === 'loading') return <div role="status" className={`${card} text-slate-500`}>Carregando seus resultados…</div>;
  if (status === 'error') return <div role="alert" className={card}><p>Não foi possível carregar sua evolução. Seus registros continuam preservados.</p><button onClick={() => setRetry(n => n + 1)} className="mt-4 text-blue-600 font-semibold">Tentar novamente</button></div>;
  return <div className="space-y-5 pb-8">
    <div className="flex flex-wrap gap-2" aria-label="Período de evolução">
      {([30, 90, 'all'] as const).map(value => <button key={value} aria-pressed={period === value} onClick={() => setPeriod(value)} className={`px-4 py-2 rounded-xl text-sm font-semibold ${period === value ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{value === 'all' ? 'Tudo' : `${value} dias`}</button>)}
    </div>
    {mode === 'summary' ? <>
      <div className="grid grid-cols-3 gap-2">
        {[['Sessões', sessions.length], ['Exercícios', active.length], ['Séries registradas', active.reduce((sum, e) => sum + periodPoints(e, period, now).reduce((n, p) => n + p.sets, 0), 0)]].map(([label, value]) => <div key={label} className="rounded-2xl bg-white border border-slate-200 p-3"><p className="text-xs text-slate-500">{label}</p><p className="text-2xl font-bold mt-2">{value}</p></div>)}
      </div>
      <section className={card}><h3 className="font-semibold text-lg">O que mudou no período</h3><p className="text-sm text-slate-500 mt-1">{periodLabel}. Primeiro e último resultado registrado, sem comparar exercícios diferentes.</p>
        {highlights.length === 0 ? <p className="py-6 text-slate-500">Nenhum exercício registrado neste período. Escolha um período maior para consultar seu histórico.</p> : <div className="divide-y divide-slate-100 mt-3">{highlights.slice(0, 5).map(item => <button key={item.exercise.id} onClick={() => { setSelected(item.exercise.id); setMetric(item.metric); onExercise(); }} className="w-full text-left py-4 flex justify-between gap-4 items-center"><div className="min-w-0"><p className="font-semibold text-slate-900">{item.exercise.name}</p><p className="text-xs text-slate-500 mt-1">{item.points.length} sessão(ões) · {date(item.points[0].date)} a {date(item.points.at(-1)!.date)}</p></div><span className={`text-sm font-semibold shrink-0 ${item.change !== null && item.change > 0 ? 'text-emerald-700' : 'text-slate-600'}`}>{item.change === null ? 'Sem comparação' : `${item.change > 0 ? '+' : ''}${number(item.change)} ${units[item.metric]}`} →</span></button>)}</div>}
        <button onClick={onExercise} className="text-blue-600 font-semibold text-sm mt-3">Ver todos os exercícios</button>
      </section>
      <p className="text-xs text-slate-500">Inclui sessões concluídas e parciais; apenas séries com repetições válidas entram nos cálculos. Volume é carga × repetições e não mede força por si só.</p>
    </> : <>
      <label className="block text-sm font-semibold text-slate-700">Buscar exercício<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nome do exercício" className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal" /></label>
      <label className="block text-sm font-semibold text-slate-700">Exercício<select value={visible.some(e => e.id === chosen?.id) ? chosen?.id : ''} onChange={e => setSelected(e.target.value)} className="block mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal"><option value="" disabled>{visible.length ? 'Selecione um exercício' : 'Nenhum exercício encontrado'}</option>{visible.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
      {chosen ? <section className={card}><h3 className="font-semibold text-lg">{chosen.name}</h3><p className="text-sm text-slate-500 mt-1">{periodLabel} · {current.length} sessão(ões)</p>
        <div className="flex flex-wrap gap-2 mt-4">{(hasLoad ? ['load', 'reps', 'estimatedMax', 'volume'] : ['reps']).map((value: EvolutionMetric) => <button key={value} aria-pressed={activeMetric === value} onClick={() => setMetric(value)} className={`px-3 py-2 text-xs rounded-lg ${activeMetric === value ? 'bg-blue-50 text-blue-700 font-semibold' : 'bg-slate-50 text-slate-600'}`}>{labels[value]}</button>)}</div>
        {record ? <><div className="flex flex-wrap justify-between gap-4 mt-5"><div><p className="text-xs text-slate-500">Melhor resultado no período</p><p className="text-2xl font-bold">{number(Number(record[activeMetric]))} <span className="text-sm font-normal">{units[activeMetric]}</span></p><p className="text-xs text-slate-500">{date(record.date)}{activeMetric === 'load' ? ` · ${record.bestRepsAtLoad} reps` : ''}</p></div><div><p className="text-xs text-slate-500">Primeiro → último registro</p><p className="font-semibold mt-1">{change === null ? 'Sem comparação suficiente' : `${change > 0 ? '+' : ''}${number(change)} ${units[activeMetric]}`}</p></div></div>
          <div className="h-56 mt-5" role="img" aria-label={`Gráfico de ${labels[activeMetric]} de ${chosen.name}, ${periodLabel}`}><ResponsiveContainer width="100%" height="100%"><LineChart data={current.filter(p => p[activeMetric] !== null && (activeMetric !== 'volume' || p.load !== null))} margin={{ top: 12, left: 0, right: 12, bottom: 10 }}><XAxis dataKey="date" tickFormatter={date} minTickGap={35} tick={{ fontSize: 11 }} /><YAxis width={48} tick={{ fontSize: 11 }} domain={[0, 'auto']} /><Tooltip labelFormatter={value => date(String(value))} formatter={value => [`${number(Number(value))} ${units[activeMetric]}`, labels[activeMetric]]} /><Line type="linear" dataKey={activeMetric} stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} /></LineChart></ResponsiveContainer></div>
        </> : <p className="py-8 text-sm text-slate-500">Não há registros suficientes para esta métrica no período.</p>}
        {activeMetric === 'estimatedMax' ? <p className="text-xs text-slate-500">Estimativa pela fórmula de Epley, apenas para séries de 1 a 12 repetições. Não representa uma carga máxima testada.</p> : null}
        {!hasLoad ? <p className="text-xs text-slate-500">Sem carga válida registrada. Exibimos repetições, sem atribuir quilogramas ou inferir tempo e distância.</p> : null}
        <div className="grid grid-cols-2 gap-3 mt-5"><div><p className="text-xs text-slate-500">Volume no período</p><p className="font-semibold">{current.some(p => p.load !== null) ? `${number(current.reduce((sum, p) => sum + p.volume, 0))} kg·reps` : 'Não disponível'}</p></div><div><p className="text-xs text-slate-500">Último resultado de carga</p><p className="font-semibold">{current.at(-1)?.load != null ? `${number(current.at(-1)!.load!)} kg · ${date(current.at(-1)!.date)}` : 'Não disponível'}</p></div></div>
        <h4 className="font-semibold mt-6 mb-3">Registros que compõem o gráfico</h4><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="text-xs text-slate-500"><tr><th className="py-2">Data</th><th>Carga × reps</th><th>Reps máx.</th><th>Sessão</th></tr></thead><tbody>{[...current].reverse().map(p => <tr key={p.historyId} className="border-t border-slate-100"><td className="py-3">{onSession ? <button className="text-blue-600" onClick={() => onSession(p.historyId)}>{date(p.date)}</button> : date(p.date)}</td><td>{p.load !== null ? `${number(p.load)} kg × ${p.bestRepsAtLoad}` : '—'}</td><td>{p.reps ?? '—'}</td><td>{p.partial ? 'Parcial' : 'Concluída'}</td></tr>)}</tbody></table></div>
      </section> : <p className={card}>{search ? 'Nenhum exercício encontrado para esta busca.' : 'Seus treinos existem, mas não há séries disponíveis para comparar exercícios.'}</p>}
    </>}
  </div>;
}
