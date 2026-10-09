import React, { useEffect, useRef, useState } from 'react';
import { X, Save } from 'lucide-react';
import { Exercise } from '../../../types';
import { useAdminStore } from '../../../store/adminStore';
import { getMuscleGroupClusters, getMuscleGroupSelectionUpdate } from '../utils/exerciseMuscleGroups';
import { cloudinaryService } from '../../../services/cloudinaryService';

const control = 'w-full min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:outline-blue-600';
const equipmentNames: Record<string,string> = { free_weight: 'Peso livre', machine: 'Máquina', bodyweight: 'Peso corporal', cable: 'Cabo / polia', band: 'Elástico', other: 'Outro' };
const editableFields = ['name','commercial_alias','muscle_group','muscle_group_id','type','equipment','difficulty_level','secondary_muscles','description','instructions','technical_tips','movement_pattern','is_active','image_url','static_frame_url','video_url','thumbnail_url'] as const;
function initialForm(ex: Exercise | null): Partial<Exercise> {
  if (!ex) return { name: '', commercial_alias: '', muscle_group: '', type: 'free_weight', difficulty_level: 'beginner', is_active: false };
  return Object.fromEntries(editableFields.map(key => [key,ex[key]])) as Partial<Exercise>;
}
export default function ExerciseEditorV2() {
  const { isEditorOpen, selectedExercise, closeEditor, muscleGroups, updateExercise, createExercise } = useAdminStore();
  const [form,setForm] = useState<Partial<Exercise>>({});
  const [baseline,setBaseline] = useState('');
  const [tab,setTab] = useState('basic');
  const [saving,setSaving] = useState(false);
  const [uploading,setUploading] = useState(false);
  const [progress,setProgress] = useState(0);
  const [error,setError] = useState('');
  const [discard,setDiscard] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const dirty = JSON.stringify(form) !== baseline;
  useEffect(() => {
    if (!isEditorOpen) return;
    const draft = initialForm(selectedExercise);
    setForm(draft); setBaseline(JSON.stringify(draft)); setTab('basic'); setError(''); setDiscard(false);
  },[isEditorOpen,selectedExercise]);
  useEffect(() => {
    if (!isEditorOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector<HTMLElement>('button')?.focus();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  },[isEditorOpen]);
  useEffect(() => {
    if (!isEditorOpen || !dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload',warn);
    return () => window.removeEventListener('beforeunload',warn);
  },[isEditorOpen,dirty]);
  if (!isEditorOpen) return null;
  const busy = saving || uploading;
  const requestClose = () => { if (busy) return; if (dirty) setDiscard(true); else closeEditor(); };
  const change = (key: keyof Exercise,value: unknown) => setForm(previous => ({...previous,[key]:value}));
  const save = async () => {
    setError('');
    if (!form.name?.trim()) { setError('Informe o nome do exercício.'); setTab('basic'); return; }
    if (form.is_active && (!form.muscle_group?.trim() || !form.instructions?.trim())) { setError('Para publicar, informe o grupo muscular e as instruções de execução.'); return; }
    for (const field of ['image_url','video_url','thumbnail_url'] as const) {
      if (form[field]) { try { const url = new URL(form[field]!); if (!['https:','http:'].includes(url.protocol)) throw new Error(); } catch { setError('Use um endereço válido de imagem ou vídeo (https://…).'); setTab('media'); return; } }
    }
    setSaving(true);
    try {
      const payload = {...form,name:form.name.trim()};
      if (selectedExercise) await updateExercise(selectedExercise.id,payload); else await createExercise(payload);
      closeEditor();
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Não foi possível salvar. Suas alterações continuam neste formulário.'); }
    finally { setSaving(false); }
  };
  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5*1024*1024) { setError('Use imagem JPG, PNG ou WEBP de até 5 MB.'); return; }
    setUploading(true); setProgress(0); setError('');
    try { const url = await cloudinaryService.uploadStaticFrame(file,setProgress); setForm(previous => ({...previous,image_url:url,static_frame_url:url})); }
    catch { setError('Não foi possível enviar a imagem. Tente novamente ou informe o endereço da imagem.'); }
    finally { setUploading(false); }
  };
  const trap = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') { event.stopPropagation(); requestClose(); }
    if (event.key !== 'Tab') return;
    const elements = panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]');
    if (!elements?.length) return;
    const first = elements[0], last = elements[elements.length-1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/40 p-2 sm:p-6" onClick={requestClose}>
    <div ref={panel} role="dialog" aria-modal="true" aria-labelledby="exercise-editor-title" onClick={event => event.stopPropagation()} onKeyDown={trap} className="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 p-5"><div><h2 id="exercise-editor-title" className="text-xl font-semibold">{selectedExercise ? 'Editar exercício' : 'Novo exercício'}</h2><p className="mt-1 text-sm text-slate-600">{dirty ? 'Alterações ainda não salvas' : 'As alterações são gravadas ao salvar.'}</p></div><button aria-label="Fechar editor" disabled={busy} className="min-h-11 min-w-11 rounded-xl border border-slate-200" onClick={requestClose}><X className="mx-auto" size={20}/></button></header>
      <nav aria-label="Seções do cadastro" className="flex gap-2 overflow-x-auto border-b p-3">{[['basic','Informações'],['technique','Como executar'],['media','Imagem e vídeo']].map(([key,label]) => <button key={key} onClick={() => setTab(key)} aria-current={tab === key ? 'page' : undefined} className={`min-h-11 shrink-0 rounded-xl px-4 text-sm font-medium ${tab === key ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}>{label}</button>)}</nav>
      <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">{error}</p>}
        {discard && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4"><p>Descartar as alterações não salvas?</p><div className="mt-3 flex gap-3"><button className="min-h-11 rounded-xl border bg-white px-3" onClick={() => setDiscard(false)}>Continuar editando</button><button className="min-h-11 rounded-xl bg-red-600 px-3 text-white" onClick={closeEditor}>Descartar e sair</button></div></div>}
        <fieldset disabled={busy} className="space-y-5 disabled:opacity-60">
        {tab === 'basic' && <>
          <Field label="Nome do exercício *" value={form.name} onChange={value => change('name',value)}/>
          <Field label="Outro nome / sinônimo" value={form.commercial_alias} onChange={value => change('commercial_alias',value)}/>
          <label className="block space-y-2"><span className="text-sm font-medium">Grupo muscular</span><select className={control} value={form.muscle_group_id || ''} onChange={event => setForm(previous => ({...previous,...getMuscleGroupSelectionUpdate(event.target.value,muscleGroups)}))}><option value="">{form.muscle_group || 'Selecione o grupo muscular'}</option>{getMuscleGroupClusters(muscleGroups).map(({parent,clusters}) => <optgroup key={parent.id} label={parent.name}><option value={parent.id}>{parent.name}</option>{clusters.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</optgroup>)}</select></label>
          <div className="grid gap-5 sm:grid-cols-2"><label className="block space-y-2"><span className="text-sm font-medium">Tipo de equipamento</span><select className={control} value={form.type || 'other'} onChange={event => change('type',event.target.value)}>{Object.entries(equipmentNames).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label><Field label="Equipamento específico" value={form.equipment} onChange={value => change('equipment',value)}/></div>
          <label className="block space-y-2"><span className="text-sm font-medium">Nível</span><select className={control} value={form.difficulty_level || 'beginner'} onChange={event => change('difficulty_level',event.target.value)}><option value="beginner">Iniciante</option><option value="intermediate">Intermediário</option><option value="advanced">Avançado</option></select></label>
          <Field label="Descrição" multiline value={form.description} onChange={value => change('description',value)}/>
          <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-4"><input className="mt-1 h-5 w-5" type="checkbox" checked={!!form.is_active} onChange={event => change('is_active',event.target.checked)}/><span><span className="block font-medium">Publicado no catálogo</span><span className="text-sm text-slate-600">Desmarcado: fica oculto para os alunos, como rascunho. Treinos e históricos existentes são preservados.</span></span></label>
        </>}
        {tab === 'technique' && <><Field label="Como executar, passo a passo" multiline value={form.instructions} onChange={value => change('instructions',value)}/><details className="rounded-xl border p-4"><summary className="cursor-pointer font-medium">Informações técnicas opcionais</summary><div className="mt-4 space-y-4"><Field label="Dicas técnicas" multiline value={form.technical_tips} onChange={value => change('technical_tips',value)}/><Field label="Padrão de movimento" value={form.movement_pattern} onChange={value => change('movement_pattern',value)}/><Field label="Músculos secundários (separados por vírgula)" value={(form.secondary_muscles || []).join(', ')} onChange={value => change('secondary_muscles',value.split(',').map(item => item.trim()))}/></div></details></>}
        {tab === 'media' && <><p className="text-slate-600">Adicione a imagem e o vídeo aqui. Os vínculos com o exercício serão gravados ao salvar.</p><label className="block space-y-2"><span className="text-sm font-medium">Enviar imagem (até 5 MB)</span><input type="file" accept="image/jpeg,image/png,image/webp" className={control} onChange={event => void upload(event)}/></label><Field label="Endereço da imagem" value={form.image_url || form.static_frame_url} onChange={value => setForm(previous => ({...previous,image_url:value,static_frame_url:value}))}/>{(form.image_url || form.static_frame_url) && <img src={form.image_url || form.static_frame_url} alt="Prévia do exercício" className="max-h-64 rounded-xl object-contain"/>}<Field label="Endereço do vídeo" value={form.video_url} onChange={value => change('video_url',value)}/><Field label="Endereço da miniatura" value={form.thumbnail_url} onChange={value => change('thumbnail_url',value)}/></>}
        </fieldset>
        {uploading && <p role="status">Enviando imagem… {progress}%</p>}
      </div>
      <footer className="flex justify-end gap-3 border-t bg-slate-50 p-4"><button disabled={busy} onClick={requestClose} className="min-h-11 rounded-xl border border-slate-300 px-4">Cancelar</button><button disabled={busy} onClick={() => void save()} className="flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 font-medium text-white disabled:opacity-50"><Save size={18}/>{saving ? 'Salvando…' : form.is_active ? 'Salvar e publicar' : 'Salvar rascunho'}</button></footer>
    </div>
  </div>;
}
function Field({label,value,onChange,multiline=false}: {label:string;value?:string;onChange:(value:string)=>void;multiline?:boolean}) {
  return <label className="block space-y-2"><span className="text-sm font-medium">{label}</span>{multiline ? <textarea className={`${control} min-h-32`} value={value || ''} onChange={event => onChange(event.target.value)}/> : <input className={control} value={value || ''} onChange={event => onChange(event.target.value)}/>}</label>;
}
