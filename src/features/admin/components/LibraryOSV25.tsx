import React, { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { buildExerciseSearchText, normalizeExerciseFilterText, exerciseMatchesMuscleFilter, buildExerciseFilterGroups } from '../../../lib/exercises/exerciseFilters';

import { getLibraryReviewIssues, archiveLibrarySelection } from '../utils/libraryQuality';

const control = 'min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-800';
const equipmentNames: Record<string, string> = { free_weight: 'Peso livre', machine: 'Máquina', bodyweight: 'Peso corporal', cable: 'Cabo / polia', band: 'Elástico', other: 'Outro' };
export default function LibraryOSV25() {
  const { exercises, loading, error, fetchData, openEditor, updateExerciseStatus } = useAdminStore();
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState('');
  const [equipment, setEquipment] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [reviewing, setReviewing] = useState(false);
  const issues = useMemo(() => getLibraryReviewIssues(exercises), [exercises]);
  const selectedExercises = exercises.filter(ex => selected.includes(ex.id));
  const publishedSelection = selectedExercises.filter(ex => ex.is_active);
  const needsReview = exercises.filter(ex => (issues.get(ex.id)?.length || 0) > 0).length;
  const batchBusy = busy === 'batch';
  const groups = useMemo(() => buildExerciseFilterGroups(exercises, { includeInactive: true }), [exercises]);
  const results = useMemo(() => exercises.filter(ex =>
    buildExerciseSearchText(ex).includes(normalizeExerciseFilterText(query)) &&
    (!muscle || exerciseMatchesMuscleFilter(ex, muscle)) &&
    (!equipment || ex.type === equipment) &&
    (!status || (status === 'published' ? !!ex.is_active : status === 'hidden' ? !ex.is_active : status === 'review' ? !!issues.get(ex.id)?.length : status === 'instructions' ? !ex.instructions?.trim() : status === 'duplicates' ? issues.get(ex.id)?.includes('Nome repetido — conferir') : !ex.image_url?.trim() && !ex.static_frame_url?.trim()))
  ).sort((a,b) => a.name.localeCompare(b.name, 'pt-BR')), [exercises, query, muscle, equipment, status, issues]);
  const pages = Math.max(1, Math.ceil(results.length / 25));
  const currentPage = Math.min(page, pages);
  const change = (setter: (value: string) => void, value: string) => { setter(value); setPage(1); setSelected([]); setReviewing(false); };
  const clear = () => { setQuery(''); setMuscle(''); setEquipment(''); setStatus(''); setPage(1); setSelected([]); setReviewing(false); };
  const archive = async (id: string, name: string) => {
    if (!window.confirm(`Arquivar “${name}”? O exercício ficará oculto no catálogo, preservando fichas e históricos.`)) return;
    setBusy(id); setFeedback('');
    try { await updateExerciseStatus(id, false); setFeedback('Exercício arquivado.'); }
    catch { setFeedback('Não foi possível arquivar. Tente novamente.'); }
    finally { setBusy(null); }
  };
  const visibleExercises = results.slice((currentPage-1)*25,currentPage*25);
  const allVisibleSelected = visibleExercises.length > 0 && visibleExercises.every(ex => selected.includes(ex.id));
  const togglePage = () => setSelected(previous => allVisibleSelected
    ? previous.filter(id => !visibleExercises.some(ex => ex.id === id))
    : [...new Set([...previous,...visibleExercises.map(ex => ex.id)])]);
  const archiveBatch = async () => {
    if (batchBusy || !publishedSelection.length) return;
    setBusy('batch'); setFeedback('');
    const outcome = await archiveLibrarySelection(publishedSelection.map(ex => ex.id), id => updateExerciseStatus(id,false));
    setFeedback(`${outcome.completed.length} exercícios arquivados.${outcome.failed.length ? ` Não foi possível arquivar: ${selectedExercises.filter(ex => outcome.failed.includes(ex.id)).map(ex => ex.name).join(', ')}. Você pode tentar novamente.` : ''}`);
    setSelected(outcome.failed); setReviewing(false); setBusy(null);
  };
  return <section className="space-y-5 pb-24 text-slate-900" aria-label="Gerenciar biblioteca">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><h2 className="text-2xl font-semibold">Biblioteca de exercícios</h2><p className="mt-1 text-base text-slate-600">Encontre, revise e organize os exercícios do Kyron.</p></div>
      <button disabled={!!busy} onClick={() => openEditor()} className="flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 font-medium text-white"><Plus size={18}/>Novo exercício</button>
    </header>
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
      <label className="flex items-center gap-3"><Search size={20} aria-hidden="true"/><span className="sr-only">Buscar exercícios</span><input className={`${control} w-full`} disabled={!!busy} value={query} onChange={e => change(setQuery,e.target.value)} placeholder="Buscar nome, músculo ou equipamento"/></label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1"><span className="block text-sm font-medium">Grupo muscular</span><select className={`${control} w-full`} disabled={!!busy} value={muscle} onChange={e => change(setMuscle,e.target.value)}><option value="">Todos os músculos</option>{groups.map(g => <optgroup key={g.name} label={g.name}><option value={g.name}>{g.name}</option>{g.subgroups.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}</optgroup>)}</select></label>
        <label className="space-y-1"><span className="block text-sm font-medium">Equipamento</span><select className={`${control} w-full`} disabled={!!busy} value={equipment} onChange={e => change(setEquipment,e.target.value)}><option value="">Todos os equipamentos</option>{Object.entries(equipmentNames).map(([key,name]) => <option key={key} value={key}>{name}</option>)}</select></label>
        <label className="space-y-1"><span className="block text-sm font-medium">Situação</span><select className={`${control} w-full`} disabled={!!busy} value={status} onChange={e => change(setStatus,e.target.value)}><option value="">Todos os exercícios</option><option value="published">Publicados</option><option value="hidden">Ocultos / rascunhos</option><option value="missing">Sem imagem</option><option value="instructions">Sem instruções</option><option value="duplicates">Nomes repetidos</option><option value="review">Precisa de revisão</option></select></label>
      </div>
      <div className="flex justify-between items-center gap-3"><p aria-live="polite" className="text-sm text-slate-600">{results.length} exercícios encontrados</p><button className={`${control} text-sm`} disabled={!!busy} onClick={clear}>Limpar filtros</button></div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"><p>{needsReview} exercícios com pendências de cadastro</p><button disabled={batchBusy} className={control} onClick={() => change(setStatus,'review')}>Revisar pendências</button></div>
    {selectedExercises.length > 0 && <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4" aria-label="Ações dos exercícios selecionados"><p className="font-medium">{selectedExercises.length} exercícios selecionados · {publishedSelection.length} publicados</p><div className="flex flex-wrap gap-3"><button disabled={!!busy || !publishedSelection.length} className={control} onClick={() => setReviewing(true)}>Revisar arquivamento</button><button disabled={!!busy} className={control} onClick={() => {setSelected([]);setReviewing(false);}}>Limpar seleção</button></div>
      {reviewing && <div className="space-y-3"><p>Estes exercícios ficarão ocultos no catálogo. Fichas e históricos serão preservados.</p><ul className="max-h-48 overflow-y-auto list-disc pl-5">{publishedSelection.map(ex => <li key={ex.id}>{ex.name}</li>)}</ul><div className="flex gap-3"><button disabled={!!busy} className={control} onClick={() => setReviewing(false)}>Cancelar arquivamento</button><button disabled={!!busy} className="min-h-11 rounded-xl bg-blue-600 px-4 text-white disabled:opacity-50" onClick={() => void archiveBatch()}>{batchBusy ? 'Arquivando…' : `Confirmar arquivamento de ${publishedSelection.length}`}</button></div></div>}
    </div>}
    {!!results.length && !loading && <label className="flex items-center gap-3"><input disabled={!!busy} type="checkbox" className="h-5 w-5" checked={allVisibleSelected} onChange={togglePage}/>Selecionar os {visibleExercises.length} exercícios desta página</label>}
    {feedback && <p role="status" className="rounded-xl bg-blue-50 p-3">{feedback}</p>}
    {error && <div role="alert" className="rounded-xl bg-red-50 p-4">Não foi possível carregar a biblioteca. <button className="underline" onClick={() => void fetchData()}>Tentar novamente</button></div>}
    {loading ? <p role="status">Carregando exercícios…</p> : !results.length ? <div className="rounded-2xl border bg-white p-8 text-center"><h3 className="font-semibold">Nenhum exercício encontrado</h3><p className="mt-2 text-slate-600">Ajuste os filtros ou cadastre um novo exercício.</p></div> : <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white overflow-hidden">{visibleExercises.map(ex => <li key={ex.id} className="flex flex-wrap items-center gap-4 p-4">
      <input type="checkbox" aria-label={`Selecionar ${ex.name}`} disabled={!!busy} className="h-5 w-5" checked={selected.includes(ex.id)} onChange={() => {setReviewing(false);setSelected(previous => previous.includes(ex.id) ? previous.filter(id => id !== ex.id) : [...previous,ex.id]);}}/>
      <button disabled={!!busy} onClick={() => openEditor(ex)} className="flex min-w-0 flex-1 items-center gap-4 text-left rounded-lg focus-visible:outline-blue-600">
        {ex.image_url || ex.static_frame_url ? <img src={ex.image_url || ex.static_frame_url} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-xl object-cover"/> : <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-500">Sem imagem</span>}
        <span><span className="block text-base font-semibold">{ex.name}</span><span className="block text-sm text-slate-600">{ex.muscle_group || 'Músculo não informado'} · {ex.equipment || equipmentNames[ex.type || ''] || 'Equipamento não informado'}</span><span className={`mt-1 inline-block text-sm ${ex.is_active ? 'text-emerald-700' : 'text-slate-600'}`}>{ex.is_active ? 'Publicado' : 'Oculto / rascunho'}</span><span className="mt-1 block text-sm text-amber-800">{issues.get(ex.id)?.join(' · ')}</span></span>
      </button>
      <div className="flex items-center gap-2"><button className={control} disabled={!!busy} onClick={() => openEditor(ex)}>Editar</button>{ex.is_active && <button disabled={!!busy} className={`${control} disabled:opacity-50`} onClick={() => void archive(ex.id,ex.name)}>{busy === ex.id ? 'Arquivando…' : 'Arquivar'}</button>}</div>
      <details className="w-full rounded-xl border border-slate-200 p-3"><summary className="cursor-pointer text-sm font-medium">Ver instruções</summary><div className="mt-3 space-y-2"><p className="whitespace-pre-line text-slate-700">{ex.instructions?.trim() || 'Este exercício ainda não possui instruções de execução.'}</p>{ex.description && <p className="whitespace-pre-line text-sm text-slate-600">{ex.description}</p>}</div></details>
    </li>)}</ul>}
    {results.length > 25 && <nav aria-label="Páginas da biblioteca" className="flex flex-wrap items-center justify-center gap-4"><button className={control} disabled={!!busy || currentPage === 1} onClick={() => setPage(currentPage-1)}>Anterior</button><span>Página {currentPage} de {pages}</span><button className={control} disabled={!!busy || currentPage === pages} onClick={() => setPage(currentPage+1)}>Próxima</button></nav>}
  </section>;
}
