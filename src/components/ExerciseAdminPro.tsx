
import React, { useState, useRef } from "react";
import { ArrowLeft, Save, Trash, Copy, Image as ImageIcon, Camera, Loader2 } from "lucide-react";
import { Exercise, MuscleGroup } from "../types";
import { adminApi } from "../lib/api/adminApi";
import { useErrorHandler } from "../hooks/useErrorHandler";

interface ExerciseAdminProProps {
  exercise: Exercise;
  muscleGroups: MuscleGroup[];
  onBack: () => void;
  onSave: (updated: Exercise) => void;
  onDelete: (id: string) => void;
}

export default function ExerciseAdminPro({ 
  exercise: initialExercise, 
  muscleGroups, 
  onBack, 
  onSave, 
  onDelete 
}: ExerciseAdminProProps) {
  const { showError, showSuccess } = useErrorHandler();
  const [exercise, setExercise] = useState<Exercise>(initialExercise);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (key: keyof Exercise, value: any) => {
    setExercise((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const publicUrl = await adminApi.uploadExerciseImage(file, exercise.id);
      handleChange("image_url", publicUrl);
      showSuccess('Imagem enviada', 'A imagem do exercício foi enviada para o servidor.');
    } catch (err: any) {
      showError(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Partial<Exercise> = {
        name: exercise.name,
        alt_name: exercise.alt_name,
        description: exercise.description,
        video_url: exercise.video_url,
        muscle_group: exercise.muscle_group,
        muscle_group_id: muscleGroups.find(m => m.name === exercise.muscle_group)?.id || exercise.muscle_group_id,
        instructions: exercise.instructions,
        is_active: exercise.is_active,
        type: exercise.type,
        difficulty_level: exercise.difficulty_level,
        image_url: exercise.image_url
      };

      if (exercise.id.startsWith('temp-')) {
        // New exercise - let Supabase generate an ID or remove the temp one if we want a real UUID
        const { id, ...createPayload } = exercise;
        await adminApi.createExercise({
          ...createPayload,
          ...payload
        });
      } else {
        await adminApi.updateExercise(exercise.id, payload);
      }
      
      showSuccess('Exercício salvo', 'As alterações foram sincronizadas com o banco de dados.');
      onSave(exercise);
    } catch (err: any) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    // Implementação de duplicação simples: volta com um novo exercício baseado neste
    // No contexto real, isso criaria um novo registro no banco.
    showSuccess('Funcionalidade em desenvolvimento', 'A duplicação de exercícios requer criação de novo ID no banco.');
  };

  return (
    <div className="fixed inset-0 z-[1300] bg-[#F7F8FA] flex flex-col animate-in slide-in-from-bottom duration-500">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <h1 className="font-black text-xl uppercase tracking-tighter text-slate-900">Editar Exercício</h1>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-full flex items-center gap-2 active:scale-95 transition-all text-xs font-black uppercase tracking-widest disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
          Salvar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <div className="max-w-xl mx-auto px-6 py-10 space-y-10">
          
          {/* Status Badge */}
          <div className="flex items-center justify-between p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${exercise.is_active ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
              <div>
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Estado do Movimento</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                  {exercise.is_active ? 'Ativo e Visível no Acervo' : 'Oculto na Biblioteca'}
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => handleChange('is_active', !exercise.is_active)}
              className={`w-14 h-8 rounded-full p-1 transition-all ${exercise.is_active ? 'bg-green-500' : 'bg-slate-200'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${exercise.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Image Management */}
          <div className="space-y-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-video bg-white rounded-[2.5rem] flex items-center justify-center overflow-hidden border border-slate-100 shadow-2xl shadow-slate-200/50 cursor-pointer group relative"
            >
              {exercise.image_url ? (
                <img src={exercise.image_url} className="w-full h-full object-contain p-4" referrerPolicy="no-referrer" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon size={40} className="text-slate-200" />
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sem Imagem</span>
                </div>
              )}
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                <Camera className="w-8 h-8 mb-2" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Alterar Foto</span>
              </div>
              {uploadingImage && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">URL da Imagem</label>
              <input
                type="text"
                placeholder="https://exemplo.com/foto.jpg"
                value={exercise.image_url || ''}
                onChange={(e) => handleChange("image_url", e.target.value)}
                className="w-full h-14 px-6 rounded-2xl bg-white border border-slate-100 shadow-sm focus:border-blue-600 outline-none transition-all text-[11px] font-bold text-slate-600"
              />
            </div>
          </div>

          {/* Main Info */}
          <div className="space-y-8">
            <Input label="NOME DO EXERCÍCIO" value={exercise.name} onChange={(v) => handleChange("name", v)} />
            <Input label="NOME ALTERNATIVO / INTERNO" value={exercise.alt_name || ''} onChange={(v) => handleChange("alt_name", v)} />
            <Input label="URL DO VÍDEO (YOUTUBE/VIMEO)" value={exercise.video_url || ''} onChange={(v) => handleChange("video_url", v)} />
          </div>

          {/* Muscle Group */}
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Grupo Muscular Principal</p>
            <div className="flex flex-wrap gap-2">
              {muscleGroups.filter(m => !m.parent_id).map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleChange("muscle_group", m.name)}
                  className={`px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                    exercise.muscle_group === m.name
                      ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20"
                      : "bg-white border border-slate-100 text-slate-400 hover:border-slate-300"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Type and Difficulty */}
          <div className="grid grid-cols-2 gap-6">
            <Select
              label="EQUIPAMENTO"
              value={exercise.type}
              onChange={(v) => handleChange("type", v)}
              options={[
                { label: "MÁQUINA", value: "machine" },
                { label: "PESO LIVRE", value: "free_weight" },
                { label: "PESO CORPORAL", value: "bodyweight" },
                { label: "CABO / POLIA", value: "cable" }
              ]}
            />
            <Select
              label="DIFICULDADE"
              value={exercise.difficulty_level}
              onChange={(v) => handleChange("difficulty_level", v)}
              options={[
                { label: "INICIANTE", value: "beginner" },
                { label: "INTERMEDIÁRIO", value: "intermediate" },
                { label: "AVANÇADO", value: "advanced" }
              ]}
            />
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div>
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Status do Exercício</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                {exercise.is_active ? 'Disponível na Biblioteca' : 'Oculto para usuários'}
              </p>
            </div>
            <button 
              type="button"
              onClick={() => handleChange('is_active', !exercise.is_active)}
              className={`w-14 h-8 rounded-full p-1 transition-all ${exercise.is_active ? 'bg-green-500' : 'bg-slate-200'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${exercise.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Description / Instructions */}
          <div className="space-y-8">
            <Textarea
              label="DESCRIÇÃO CURTA (MARKETING)"
              value={exercise.description || ''}
              onChange={(v) => handleChange("description", v)}
              placeholder="Uma frase impactante sobre o exercício..."
              minHeight="100px"
            />
            <Textarea
              label="PROTOCOLO E INSTRUÇÕES TÉCNICAS (MARKDOWN)"
              value={exercise.instructions || ''}
              onChange={(v) => handleChange("instructions", v)}
              placeholder="Descreva a biomecânica, posicionamento e dicas de execução..."
              minHeight="250px"
            />
          </div>

          {/* Actions */}
          <div className="space-y-4 pt-10">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-blue-600 text-white py-6 rounded-full font-black uppercase text-xs tracking-[0.4em] shadow-2xl shadow-blue-600/30 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              Salvar Alterações
            </button>

            <div className="flex gap-4">
              <button 
                onClick={handleDuplicate}
                className="flex-1 bg-white border border-slate-100 py-4 rounded-3xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 active:bg-slate-50 transition-all"
              >
                <Copy size={16} /> Duplicar
              </button>
              <button 
                onClick={() => onDelete(exercise.id)}
                className="flex-1 bg-white border border-red-50 text-red-500 py-4 rounded-3xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest active:bg-red-50 transition-all"
              >
                <Trash size={16} /> Excluir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-14 px-6 rounded-2xl bg-white border border-slate-100 shadow-sm focus:border-blue-600 outline-none transition-all font-black uppercase text-sm tracking-tight"
      />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, minHeight = "200px" }: { label: string; value: string; onChange: (v: string) => void, placeholder?: string, minHeight?: string }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{label}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ minHeight }}
        className="w-full px-6 py-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm focus:border-blue-600 outline-none transition-all text-sm font-medium leading-relaxed"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{label}</p>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-14 px-6 rounded-2xl bg-white border border-slate-100 shadow-sm focus:border-blue-600 outline-none transition-all appearance-none text-[10px] font-black uppercase tracking-widest"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
