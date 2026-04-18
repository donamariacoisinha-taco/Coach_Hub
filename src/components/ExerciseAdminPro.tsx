
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { 
  ArrowLeft, Save, Trash, Copy, Image as ImageIcon, Camera, Loader2, 
  Wand2, CheckCircle2, AlertCircle, Sparkles, RefreshCcw, Zap, 
  ChevronRight, MoreVertical, FileText, CheckCircle, X, Plus
} from "lucide-react";
import { Exercise, MuscleGroup } from "../types";
import { adminApi } from "../lib/api/adminApi";
import { useErrorHandler } from "../hooks/useErrorHandler";
import { geminiService } from "../services/geminiService";
import { debounce } from "lodash";

interface ExerciseAdminProProps {
  exercise: Exercise;
  muscleGroups: MuscleGroup[];
  onBack: () => void;
  onSave: (updated: Exercise) => void;
  onDelete: (exercise: Exercise) => void;
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
  const [autoSaving, setAutoSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [standardizing, setStandardizing] = useState(false);
  const [duplicate, setDuplicate] = useState<{id: string, name: string} | null>(null);
  const [variations, setVariations] = useState<string[]>([]);
  const [showVariations, setShowVariations] = useState(false);
  const [suggestedMissing, setSuggestedMissing] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quality Score Calculation
  const qualityScore = useMemo(() => {
    let score = 0;
    if (exercise.name.length > 3) score += 20;
    if (exercise.muscle_group) score += 20;
    if (exercise.image_url) score += 15;
    if (exercise.video_url) score += 10;
    if (exercise.description && exercise.description.length > 10) score += 10;
    if (exercise.instructions && exercise.instructions.length > 30) score += 15;
    if (exercise.secondary_muscles && exercise.secondary_muscles.length > 0) score += 10;
    return score;
  }, [exercise]);

  // Handle Debounced Auto-Save
  const debouncedSave = useCallback(
    debounce(async (ex: Exercise) => {
      if (ex.id.startsWith('temp-') || ex.name.length < 3) return;
      setAutoSaving(true);
      try {
        await adminApi.updateExercise(ex.id, ex);
      } catch (err) {
        console.error("Auto-save failed", err);
      } finally {
        setAutoSaving(false);
      }
    }, 2000),
    []
  );

  useEffect(() => {
    debouncedSave(exercise);
  }, [exercise, debouncedSave]);

  // Duplicate detection
  useEffect(() => {
    const checkDup = async () => {
      if (exercise.name.length < 4) {
        setDuplicate(null);
        return;
      }
      const existing = await adminApi.checkExistingExercise(exercise.name);
      if (existing && existing.id !== exercise.id) {
        setDuplicate(existing);
      } else {
        setDuplicate(null);
      }
    };
    checkDup();
  }, [exercise.name, exercise.id]);

  // Suggestions for missing exercises
  useEffect(() => {
    if (exercise.muscle_group && exercise.id.startsWith('temp-')) {
      const fetchSuggestions = async () => {
        try {
          // In a real app we'd pass existing exercise names for this muscle group
          const missing = await geminiService.suggestMissingExercises(exercise.muscle_group, [exercise.name]);
          setSuggestedMissing(missing);
        } catch (e) {}
      };
      fetchSuggestions();
    }
  }, [exercise.muscle_group, exercise.id]);

  const handleChange = (key: keyof Exercise, value: any) => {
    setExercise((prev) => ({ ...prev, [key]: value }));
  };

  const handleAIContent = async () => {
    if (!exercise.name || !exercise.muscle_group) {
        showError("Defina o nome e grupo muscular para gerar dados.");
        return;
    }
    setGenerating(true);
    try {
      const generated = await geminiService.generateExerciseData(exercise.name, exercise.muscle_group);
      setExercise(prev => ({ ...prev, ...generated }));
      showSuccess('Cérebro Rubi ativado', 'Dados gerados e padronizados com sucesso.');
    } catch (err: any) {
      showError(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleStandardize = async () => {
    if (!exercise.instructions) return;
    setStandardizing(true);
    try {
      const text = await geminiService.standardizeText(exercise.instructions);
      handleChange("instructions", text);
      showSuccess('Padronização concluída', 'O protocolo foi reescrito seguindo o padrão Rubi.');
    } catch (err: any) {
      showError(err);
    } finally {
      setStandardizing(false);
    }
  };

  const handleSmartDuplicate = async () => {
    setGenerating(true);
    try {
      const vars = await geminiService.suggestVariations(exercise.name);
      setVariations(vars);
      setShowVariations(true);
    } catch (err: any) {
      showError(err);
    } finally {
      setGenerating(false);
    }
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
        image_url: exercise.image_url,
        secondary_muscles: exercise.secondary_muscles,
        technical_tips: exercise.technical_tips
      };

      if (exercise.id.startsWith('temp-')) {
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

  return (
    <div className="fixed inset-0 z-[1300] bg-[#F7F8FA] flex flex-col animate-in slide-in-from-bottom duration-500">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="font-black text-xl uppercase tracking-tighter text-slate-900 leading-none">Admin <span className="text-blue-600">Pro</span></h1>
            {autoSaving && <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest animate-pulse">Sincronizando...</span>}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
            {/* AI Generator Button */}
            <button 
                onClick={handleAIContent}
                disabled={generating}
                className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20 active:scale-90 transition-all disabled:opacity-50 group hover:rotate-12"
                title="Gerar via IA"
            >
                {generating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
            </button>
            
            <button 
              onClick={handleSave}
              disabled={saving}
              className="bg-slate-900 text-white px-8 py-3 rounded-2xl flex items-center gap-3 active:scale-95 transition-all text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-50 shadow-2xl shadow-slate-900/10"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} 
              Salvar
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <div className="max-w-xl mx-auto px-6 py-10 space-y-12">
          
          {/* Quality Indicator */}
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 space-y-4">
             <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Score de Completude</span>
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${qualityScore === 100 ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                    {qualityScore}%
                </span>
             </div>
             <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-blue-600 transition-all duration-1000" 
                    style={{ width: `${qualityScore}%` }} 
                />
             </div>
             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center">
                {qualityScore < 50 ? '⚠️ Adicione descrição e instruções' : qualityScore < 100 ? '🚀 Quase completo!' : '🏆 Exercício padrão ouro!'}
             </p>
          </div>

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
          </div>

          {/* Main Info */}
          <div className="space-y-8">
            <div className="space-y-2 relative">
                <Input label="NOME DO EXERCÍCIO" value={exercise.name} onChange={(v) => handleChange("name", v)} />
                {duplicate && (
                    <div className="absolute -bottom-6 left-1 flex items-center gap-2 text-[9px] font-black text-red-500 uppercase tracking-widest animate-bounce">
                        <AlertCircle size={12} /> Já existe: {duplicate.name}
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-2 gap-6">
                <Input label="NOME INTERNO" value={exercise.alt_name || ''} onChange={(v) => handleChange("alt_name", v)} />
                <Input label="LINK VÍDEO" value={exercise.video_url || ''} onChange={(v) => handleChange("video_url", v)} />
            </div>
          </div>

          {/* Muscle Group */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Grupo Muscular</p>
                {exercise.id.startsWith('temp-') && suggestedMissing.length > 0 && (
                    <span className="text-[8px] font-black text-blue-600 uppercase">🧠 Sugeridos Faltantes</span>
                )}
            </div>
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
            
            {exercise.id.startsWith('temp-') && suggestedMissing.length > 0 && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    {suggestedMissing.map(s => (
                        <button key={s} onClick={() => handleChange("name", s)} className="px-5 py-2.5 bg-blue-50 border border-blue-100 rounded-full text-[8px] font-black text-blue-600 uppercase tracking-widest shrink-0 active:scale-95 transition-all">
                            {s}
                        </button>
                    ))}
                </div>
            )}
          </div>

          {/* Secondary Muscles */}
          <div className="space-y-4">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Músculos Auxiliares</label>
             <div className="flex flex-wrap gap-2">
                {exercise.secondary_muscles?.map(m => (
                    <div key={m} className="px-4 py-2 bg-slate-100 rounded-full text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                        {m}
                        <button onClick={() => handleChange('secondary_muscles', exercise.secondary_muscles?.filter(sm => sm !== m))} className="hover:text-red-500"><X size={10} /></button>
                    </div>
                ))}
                <button 
                    onClick={() => {
                        const m = prompt('Músculo auxiliar?');
                        if (m) handleChange('secondary_muscles', [...(exercise.secondary_muscles || []), m]);
                    }}
                    className="w-8 h-8 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-blue-600 hover:text-blue-600"
                >
                    <Plus size={14} />
                </button>
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

          {/* Description / Instructions */}
          <div className="space-y-8">
            <div className="space-y-2 relative">
                <Textarea
                  label="DESCRIÇÃO COMERCIAL"
                  value={exercise.description || ''}
                  onChange={(v) => handleChange("description", v)}
                  placeholder="Ex: O Rei dos exercícios para peitoral..."
                  minHeight="100px"
                />
            </div>
            
            <div className="space-y-2 relative">
                <div className="flex justify-between items-center px-1 mb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Protocolo Técnico (Markdown)</p>
                    <button 
                        onClick={handleStandardize} 
                        disabled={standardizing || !exercise.instructions}
                        className="flex items-center gap-2 text-[8px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 px-3 py-1.5 rounded-full transition-all disabled:opacity-30"
                    >
                        {standardizing ? <Loader2 size={10} className="animate-spin" /> : <RefreshCcw size={10} />}
                        Padronizar Linguagem
                    </button>
                </div>
                <Textarea
                  label="PROTOLO TÉCNICO"
                  value={exercise.instructions || ''}
                  onChange={(v) => handleChange("instructions", v)}
                  placeholder="Descreva a biomecânica..."
                  minHeight="250px"
                />
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4 pt-10">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.4em] shadow-2xl shadow-blue-600/30 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {exercise.id.startsWith('temp-') ? 'Criar Exercício' : 'Sincronizar com Banco'}
            </button>

            <div className="flex gap-4">
              <button 
                onClick={handleSmartDuplicate}
                disabled={generating}
                className="flex-1 bg-white border border-slate-100 py-4 rounded-3xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 active:bg-slate-50 transition-all"
              >
                {generating ? <Loader2 size={16} className="animate-spin" /> : <Copy size={16} />} 
                Variações
              </button>
              <button 
                onClick={() => onDelete(exercise)}
                className="flex-1 bg-white border border-red-50 text-red-500 py-4 rounded-3xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest active:bg-red-50 transition-all font-bold"
              >
                <Trash size={16} /> Excluir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Variations Modal */}
      {showVariations && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-md flex items-end justify-center animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-white rounded-t-[4rem] p-10 space-y-8 shadow-2xl animate-in slide-in-from-bottom duration-500">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Sugestões de Variação</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase mt-1">Baseado em {exercise.name}</p>
                    </div>
                    <button onClick={() => setShowVariations(false)} className="w-12 h-12 flex items-center justify-center text-slate-200 hover:text-slate-900"><X size={24} /></button>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                    {variations.map(v => (
                        <button 
                            key={v}
                            onClick={() => {
                                const newId = `temp-${Date.now()}`;
                                const newEx = { 
                                    ...exercise, 
                                    id: newId, 
                                    name: v, 
                                    image_url: '', // Clear image for variation
                                    instructions: '', // Clear instructions to regenerate later
                                    description: ''
                                };
                                setExercise(newEx);
                                setShowVariations(false);
                                showSuccess('Variação criada', `Pronto para configurar: ${v}`);
                            }}
                            className="p-6 bg-[#F7F8FA] hover:bg-white border border-transparent hover:border-blue-600 rounded-[2rem] flex items-center justify-between group transition-all"
                        >
                            <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{v}</span>
                            <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-blue-600 transition-colors" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}
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
      {label && <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{label}</p>}
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

