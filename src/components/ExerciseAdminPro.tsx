
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { 
  ArrowLeft, Save, Trash, Copy, Image as ImageIcon, Camera, Loader2, 
  Wand2, CheckCircle2, AlertCircle, Sparkles, RefreshCcw, Zap, 
  ChevronRight, MoreVertical, FileText, CheckCircle, X, Plus,
  ShieldCheck, Layers3, Dumbbell, PlayCircle, ChevronUp, ChevronDown
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
  const [reviewing, setReviewing] = useState(false);
  const [reviewData, setReviewData] = useState<{ score: number, status: string, notes: string[], biomechanic_check: boolean } | null>(null);
  const [similarityChecking, setSimilarityChecking] = useState(false);
  const [sections, setSections] = useState({
    basic: true,
    biomech: false,
    ai: false,
    history: false
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quality Score Classification
  const quality = useMemo(() => {
    let score = 0;
    if (exercise.name.length > 3) score += 20;
    if (exercise.muscle_group) score += 15;
    if (exercise.movement_pattern) score += 10;
    if (exercise.plane) score += 5;
    if (exercise.image_url) score += 15;
    if (exercise.video_url) score += 10;
    if (exercise.description && exercise.description.length > 10) score += 10;
    if (exercise.instructions && exercise.instructions.length > 30) score += 15;
    
    let status: 'premium' | 'good' | 'improvable' = 'improvable';
    if (score >= 85) status = 'premium';
    else if (score >= 70) status = 'good';
    
    return { score, status };
  }, [exercise]);

  // Handle Debounced Auto-Save
  const debouncedSave = useCallback(
    debounce(async (ex: Exercise) => {
      if (!ex.id || ex.id.startsWith('temp-') || ex.name.length < 3) return;
      setAutoSaving(true);
      try {
        const payload = { ...ex, quality_score: quality.score, quality_status: quality.status };
        await adminApi.updateExercise(ex.id, payload);
      } catch (err) {
        console.error("Auto-save failed", err);
      } finally {
        setAutoSaving(false);
      }
    }, 3000),
    [quality.score, quality.status]
  );

  useEffect(() => {
    debouncedSave(exercise);
  }, [exercise, debouncedSave]);

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
      showSuccess('Cérebro Rubi ativado', 'Dados estruturais gerados com sucesso.');
    } catch (err: any) {
      showError(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleAIReview = async () => {
    setReviewing(true);
    try {
      const review = await geminiService.reviewExercise(exercise);
      setReviewData(review);
      setExercise(prev => ({ 
        ...prev, 
        quality_score: review.score, 
        quality_status: review.status,
        ai_review_notes: review.notes,
        last_review_at: new Date().toISOString()
      }));
      showSuccess('Auditoria Rubi Concluída', `Score final: ${review.score}%`);
    } catch (err: any) {
      showError(err);
    } finally {
      setReviewing(false);
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
        ...exercise,
        quality_score: quality.score,
        quality_status: quality.status,
        version_history: [
            ...(exercise.version_history || []),
            { date: new Date().toISOString(), author: 'Admin Rubi', changes: 'Atualização técnica via Admin Pro' }
        ].slice(-5)
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
      
      showSuccess('Exercício salvo', 'As alterações foram sincronizadas e versionadas.');
      onSave(exercise);
    } catch (err: any) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (name: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="fixed inset-0 z-[1300] bg-[#F7F8FA] text-slate-900 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-500">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <div className="mx-auto max-w-md">
          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-[#F7F8FA]/90 backdrop-blur px-5 pt-4 pb-4">
            <div className="flex items-center justify-between">
              <button onClick={onBack} className="rounded-full p-2 active:scale-95 transition hover:bg-slate-100">
                <ArrowLeft className="h-5 w-5 text-slate-700" />
              </button>

              <div className="flex-1 px-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Intelligence Hub
                </p>
                <h1 className="truncate text-xl font-black tracking-tight">
                  {exercise.name || "Novo Exercício"}
                </h1>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex h-11 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-bold text-white shadow-sm active:scale-95 transition disabled:opacity-50"
              >
                {saving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{saving ? 'Sincronizando' : 'Sincronizar'}</span>
              </button>
            </div>
          </header>

          {/* Body */}
          <main className="px-5 pt-5 space-y-5">
            {/* Score */}
            <section className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                    Quality Score
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xl font-black uppercase tracking-tighter">
                        {quality.status === 'premium' ? 'Premium' : quality.status === 'good' ? 'Bom' : 'Melhorável'}
                    </span>
                    <ShieldCheck className="h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-lg font-black">
                  {quality.score}%
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    quality.status === 'premium' ? 'bg-emerald-500' : quality.status === 'good' ? 'bg-blue-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${quality.score}%` }}
                />
              </div>
            </section>

            {/* Cover */}
            <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="relative overflow-hidden rounded-2xl bg-slate-100 h-48 group">
                <img
                  src={exercise.image_url || "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80"}
                  alt={exercise.name}
                  className="h-full w-full object-cover"
                />

                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow active:scale-95 transition-all hover:scale-110"
                >
                  {uploadingImage ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
              </div>
            </section>

            {/* Basic Info */}
            <Accordion
              title="Básico"
              icon={<Layers3 className="h-4 w-4" />}
              open={sections.basic}
              onClick={() => toggleSection("basic")}
            >
              <Field
                label="Nome do exercício"
                value={exercise.name}
                onChange={(v) => handleChange("name", v)}
              />

              <div className="space-y-2">
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Grupo muscular
                </label>
                <select
                  value={exercise.muscle_group}
                  onChange={(e) => handleChange("muscle_group", e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none appearance-none"
                >
                  {muscleGroups.map(mg => (
                    <option key={mg.id} value={mg.name}>{mg.name}</option>
                  ))}
                </select>
              </div>

              <Field
                label="ID Técnico (Alt Name)"
                value={exercise.alt_name || ''}
                onChange={(v) => handleChange("alt_name", v)}
              />

              <Field
                label="URL do Vídeo"
                value={exercise.video_url || ''}
                onChange={(v) => handleChange("video_url", v)}
                placeholder="https://..."
              />
            </Accordion>

            {/* Biomechanics */}
            <Accordion
              title="Estrutura Biomecânica"
              icon={<Dumbbell className="h-4 w-4" />}
              open={sections.biomech}
              onClick={() => toggleSection("biomech")}
            >
              <div className="space-y-2">
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Padrão de movimento
                </label>
                <select
                  value={exercise.movement_pattern || ''}
                  onChange={(e) => handleChange("movement_pattern", e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none appearance-none"
                >
                  <option value="">Selecione</option>
                  <option value="push">Push (Empurrar)</option>
                  <option value="pull">Pull (Puxar)</option>
                  <option value="hinge">Hinge (Dobradiça)</option>
                  <option value="squat">Squat (Agachamento)</option>
                  <option value="lunge">Lunge (Afundo)</option>
                  <option value="carry">Carry (Carregar)</option>
                  <option value="isolation">Isolado</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Plano Anatômico
                </label>
                <select
                  value={exercise.plane || ''}
                  onChange={(e) => handleChange("plane", e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none appearance-none"
                >
                  <option value="">Selecione</option>
                  <option value="horizontal">Horizontal</option>
                  <option value="vertical">Vertical</option>
                  <option value="sagittal">Sagital</option>
                  <option value="frontal">Frontal</option>
                  <option value="transverse">Transverso</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Dificuldade
                </label>
                <select
                  value={exercise.difficulty_level}
                  onChange={(e) => handleChange("difficulty_level", e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none appearance-none"
                >
                  <option value="beginner">Iniciante</option>
                  <option value="intermediate">Intermediário</option>
                  <option value="advanced">Avançado</option>
                </select>
              </div>
            </Accordion>

            {/* AI Content */}
            <Accordion
              title="Cérebro Rubi (IA)"
              icon={<Sparkles className="h-4 w-4" />}
              open={sections.ai}
              onClick={() => toggleSection("ai")}
            >
              <div className="space-y-2">
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Descrição Conceitual
                </label>
                <textarea
                  value={exercise.description || ''}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Descrição profissional..."
                  className="min-h-[100px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900"
                />
              </div>

              <div className="space-y-2">
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Instruções de Execução
                </label>
                <textarea
                  value={exercise.instructions || ''}
                  onChange={(e) => handleChange("instructions", e.target.value)}
                  placeholder="Passo a passo técnico..."
                  className="min-h-[150px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={handleAIContent}
                  disabled={generating}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-600 active:scale-[0.98] transition disabled:opacity-50"
                >
                  {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Gerar Estrutura
                </button>
                <button
                  onClick={handleAIReview}
                  disabled={reviewing}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600 active:scale-[0.98] transition disabled:opacity-50"
                >
                  {reviewing ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
                  Auditar Quality
                </button>
              </div>

              {reviewData?.notes && (
                <div className="mt-4 p-4 rounded-2xl bg-orange-50 border border-orange-100">
                    <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <AlertCircle size={10} /> Sugestões AI
                    </p>
                    <ul className="space-y-1">
                        {reviewData.notes.map((note, i) => (
                            <li key={i} className="text-[10px] font-medium text-orange-800 leading-tight">• {note}</li>
                        ))}
                    </ul>
                </div>
              )}
            </Accordion>

            {/* History */}
            <Accordion
              title="Versionamento"
              icon={<FileText className="h-4 w-4" />}
              open={sections.history}
              onClick={() => toggleSection("history")}
            >
                <div className="space-y-3">
                    {exercise.version_history && exercise.version_history.length > 0 ? (
                        exercise.version_history.map((v, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                <div>
                                    <p className="text-[10px] font-black text-slate-900 leading-none mb-1">{v.changes}</p>
                                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{new Date(v.date).toLocaleDateString()} • {v.author}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-[10px] text-center text-slate-400 py-4">Nenhum log disponível.</p>
                    )}
                </div>
            </Accordion>

            {/* Preview */}
            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm mb-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                Preview Biblioteca
              </p>

              <div className="mt-3 flex items-center gap-3">
                <img
                  src={exercise.image_url || "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=112&q=80"}
                  alt=""
                  className="h-14 w-14 rounded-2xl object-cover bg-slate-100"
                />

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-black uppercase tracking-tight">{exercise.name}</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 leading-none mt-1">
                    {exercise.muscle_group}
                  </p>
                </div>

                <PlayCircle className="h-7 w-7 text-slate-200" />
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 backdrop-blur z-50">
        <div className="mx-auto max-w-md px-5 py-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-slate-950 text-xs font-black tracking-[0.22em] text-white uppercase shadow-xl active:scale-[0.98] transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Sincronizando
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Sincronizar Protocolo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Sub-Components ------------------------------- */

function Accordion({
  title,
  icon,
  open,
  onClick,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  open: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between px-4 py-4 active:bg-slate-50 transition"
      >
        <div className="flex items-center gap-3">
          <div className="text-slate-400">{icon}</div>
          <span className="text-[11px] font-black uppercase tracking-widest">{title}</span>
        </div>

        {open ? (
          <ChevronUp className="h-4 w-4 text-slate-300" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-300" />
        )}
      </button>

      {open && <div className="space-y-4 px-4 pb-5 animate-in fade-in slide-in-from-top-2 duration-300">{children}</div>}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
        {label}
      </label>

      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none placeholder:text-slate-400 focus:border-slate-900 transition-all shadow-sm"
      />
    </div>
  );
}


