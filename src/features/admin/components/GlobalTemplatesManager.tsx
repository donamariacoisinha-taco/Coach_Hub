import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Sparkles, 
  Shield, 
  ChevronRight, 
  Folder, 
  Clock, 
  Dumbbell, 
  Play, 
  Save, 
  RotateCcw, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ListOrdered,
  FileText,
  Badge,
  CheckCircle,
  Calendar,
  AlertTriangle,
  User,
  Activity,
  History
} from 'lucide-react';
import { systemTemplatesApi, SystemTemplate, SystemTemplateWorkout, SystemTemplateExercise } from '../../../lib/api/systemTemplatesApi';
import { exerciseApi } from '../../../lib/api/exerciseApi';
import { Exercise } from '../../../types';

export const GlobalTemplatesManager: React.FC = () => {
  const [templates, setTemplates] = useState<SystemTemplate[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingTemplate, setEditingTemplate] = useState<SystemTemplate | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  
  // Save confirmation trigger modal
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState<boolean>(false);
  const [changelogInput, setChangelogInput] = useState<string>('');
  
  // Exercise Search state for adding to a workout in editor
  const [addingToWorkoutId, setAddingToWorkoutId] = useState<string | null>(null);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState<string>('');
  const [searchFocused, setSearchFocused] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const systemTemplates = await systemTemplatesApi.getTemplates();
      setTemplates(systemTemplates);
      const exerciseList = await exerciseApi.getExercises();
      setExercises(exerciseList);
    } catch (e) {
      console.error('Error loading admin templates:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCreate = () => {
    const newTemplate: SystemTemplate = {
      id: `template_${Date.now()}`,
      name: '',
      description: '',
      version: 1,
      is_default: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: 'Rubi Admin',
      created_by: 'admin',
      folders: [],
      workouts: [],
      version_history: [
        {
          version: 1,
          updated_at: new Date().toISOString(),
          updated_by: 'Rubi Admin',
          changes: ['Criação inicial do modelo global.']
        }
      ]
    };
    setEditingTemplate(newTemplate);
    setIsCreatingNew(true);
    setChangelogInput('Criação inicial do modelo global.');
  };

  const handleStartEdit = (template: SystemTemplate) => {
    // Clone template deeply to avoid mutating external state
    setEditingTemplate(JSON.parse(JSON.stringify(template)));
    setIsCreatingNew(false);
    setChangelogInput('');
  };

  const handleArchive = async (id: string) => {
    if (confirm('Tem certeza de que deseja arquivar este modelo global? Novos atletas não poderão acessá-lo.')) {
      await systemTemplatesApi.archiveTemplate(id);
      loadData();
    }
  };

  // Workout manipulations inside active edited template
  const handleAddWorkout = () => {
    if (!editingTemplate) return;
    const newWorkout: SystemTemplateWorkout = {
      id: `workout_${Date.now()}`,
      name: `Treino ${String.fromCharCode(65 + editingTemplate.workouts.length)}`,
      description: 'Descrição do treino...',
      exercises: []
    };
    setEditingTemplate({
      ...editingTemplate,
      workouts: [...editingTemplate.workouts, newWorkout]
    });
  };

  const handleRemoveWorkout = (workoutId: string) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      workouts: editingTemplate.workouts.filter(w => w.id !== workoutId)
    });
  };

  const handleUpdateWorkoutName = (workoutId: string, value: string) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      workouts: editingTemplate.workouts.map(w => 
        w.id === workoutId ? { ...w, name: value } : w
      )
    });
  };

  const handleUpdateWorkoutDesc = (workoutId: string, value: string) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      workouts: editingTemplate.workouts.map(w => 
        w.id === workoutId ? { ...w, description: value } : w
      )
    });
  };

  // Exercise manipulations inside workout context
  const handleAddExerciseToWorkout = (workoutId: string, exercise: Exercise) => {
    if (!editingTemplate) return;
    
    // Create new template exercise item
    const newEx: SystemTemplateExercise = {
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      sets: 3,
      reps: '10',
      weight: 10,
      rest_time: 60,
      sort_order: 1, // Will be computed
      sets_json: [
        { reps: '10', weight: 10, rest_time: 60 },
        { reps: '10', weight: 10, rest_time: 60 },
        { reps: '10', weight: 10, rest_time: 60 }
      ]
    };

    setEditingTemplate({
      ...editingTemplate,
      workouts: editingTemplate.workouts.map(w => {
        if (w.id === workoutId) {
          const updatedExs = [...w.exercises, { ...newEx, sort_order: w.exercises.length + 1 }];
          return { ...w, exercises: updatedExs };
        }
        return w;
      })
    });

    setAddingToWorkoutId(null);
    setExerciseSearchQuery('');
  };

  const handleRemoveExercise = (workoutId: string, exerciseId: string) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      workouts: editingTemplate.workouts.map(w => {
        if (w.id === workoutId) {
          const updatedExs = w.exercises
            .filter(ex => ex.exercise_id !== exerciseId)
            .map((ex, i) => ({ ...ex, sort_order: i + 1 }));
          return { ...w, exercises: updatedExs };
        }
        return w;
      })
    });
  };

  const handleUpdateExerciseValue = (
    workoutId: string, 
    exerciseId: string, 
    key: keyof SystemTemplateExercise, 
    value: any
  ) => {
    if (!editingTemplate) return;
    
    setEditingTemplate({
      ...editingTemplate,
      workouts: editingTemplate.workouts.map(w => {
        if (w.id === workoutId) {
          const updatedExs = w.exercises.map(ex => {
            if (ex.exercise_id === exerciseId) {
              const updated = { ...ex, [key]: value };
              // Synchronize sets_json automatically if sets count changes
              if (key === 'sets' && typeof value === 'number') {
                const currentWeight = ex.weight;
                const currentReps = ex.reps;
                const currentRest = ex.rest_time;
                updated.sets_json = Array.from({ length: value }, () => ({
                  reps: currentReps,
                  weight: currentWeight,
                  rest_time: currentRest
                }));
              }
              // Synchronize sets_json parameters if weight, reps or rest_time changes
              if (key === 'weight' || key === 'reps' || key === 'rest_time') {
                updated.sets_json = ex.sets_json.map(sj => ({
                  ...sj,
                  [key === 'rest_time' ? 'rest_time' : key]: value
                }));
              }
              return updated;
            }
            return ex;
          });
          return { ...w, exercises: updatedExs };
        }
        return w;
      })
    });
  };

  const handleMoveExercise = (workoutId: string, index: number, direction: 'up' | 'down') => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      workouts: editingTemplate.workouts.map(w => {
        if (w.id === workoutId) {
          const exs = [...w.exercises];
          if (direction === 'up' && index > 0) {
            const temp = exs[index];
            exs[index] = exs[index - 1];
            exs[index - 1] = temp;
          } else if (direction === 'down' && index < exs.length - 1) {
            const temp = exs[index];
            exs[index] = exs[index + 1];
            exs[index + 1] = temp;
          }
          const reordered = exs.map((ex, i) => ({ ...ex, sort_order: i + 1 }));
          return { ...w, exercises: reordered };
        }
        return w;
      })
    });
  };

  // Save workflow triggering confirmation dialog
  const triggerSaveConfirm = () => {
    if (!editingTemplate) return;
    if (!editingTemplate.name.trim()) {
      alert('Por favor, informe o nome do modelo.');
      return;
    }
    setShowSaveConfirmModal(true);
  };

  const handleFinalSave = async () => {
    if (!editingTemplate) return;
    setLoading(true);
    try {
      const finalVersion = isCreatingNew ? 1 : editingTemplate.version + 1;
      const historyEntry = {
        version: finalVersion,
        updated_at: new Date().toISOString(),
        updated_by: 'Rubi Admin',
        changes: changelogInput.trim() ? [changelogInput.trim()] : ['Modelo atualizado pela equipe médica do Kyron.']
      };

      const updatedTemplate: SystemTemplate = {
        ...editingTemplate,
        id: isCreatingNew ? editingTemplate.name.toLowerCase().trim().replace(/\s+/g, '_') : editingTemplate.id,
        version: finalVersion,
        updated_at: new Date().toISOString(),
        folders: [{ id: `f_${editingTemplate.name.toLowerCase().replace(/\s+/g, '_')}`, name: editingTemplate.name }],
        version_history: [...(editingTemplate.version_history || []), historyEntry]
      };

      await systemTemplatesApi.createOrUpdateTemplate(updatedTemplate);
      setEditingTemplate(null);
      setShowSaveConfirmModal(false);
      setIsCreatingNew(false);
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Filter exercises array for adding to workout dialog
  const filteredSearchExercises = exercises.filter(ex => 
    ex.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase()) ||
    ex.muscle_group.toLowerCase().includes(exerciseSearchQuery.toLowerCase())
  );

  return (
    <div className="font-sans text-slate-800 space-y-8 max-w-5xl mx-auto pb-24">
      
      {/* Visual Identity Title */}
      <div className="bg-white/80 border border-slate-100/50 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-[10px] uppercase font-black tracking-[0.25em] text-[#7BA7FF] block mb-1">
            Rubi Architect
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            Modelos de Protocolos Globais
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Crie, sincronize e gerencie os blueprints e diretórios de exercícios que servirão de onboarding e progressão científica aos atletas.
          </p>
        </div>
        {!editingTemplate && (
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartCreate}
            className="px-6 py-4 bg-slate-950 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center gap-2.5 shadow-xl shadow-slate-950/15"
          >
            <Plus size={16} className="text-[#7BA7FF]" /> Novo Modelo
          </motion.button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* VIEW 1: GRID & BENTO CATALOG (Standard Library View) */}
        {!editingTemplate ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {templates.map(t => {
              const isDefaultOnboarding = t.is_default || t.id === 'iniciante';
              return (
                <div 
                  key={t.id}
                  className="bg-white border border-slate-100 rounded-[2.2rem] p-7 flex flex-col justify-between hover:shadow-xl hover:shadow-slate-100/50 transition-all group relative overflow-hidden"
                >
                  {/* Subtle Gradient Glow Based on created_by */}
                  {t.created_by === 'rubi_ai' && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/[0.04] rounded-full blur-xl pointer-events-none" />
                  )}

                  <div>
                    {/* Header line with Version, Onboarding logic and Creators badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider leading-none">
                          v{t.version}
                        </span>
                        {isDefaultOnboarding && (
                          <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full uppercase tracking-wider leading-none flex items-center gap-1 shrink-0">
                            ★ Principal Onboarding
                          </span>
                        )}
                      </div>
                      
                      {/* Creator badge */}
                      {t.created_by === 'rubi_ai' ? (
                        <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50/70 border border-indigo-100/40 px-2 py-1 rounded-md flex items-center gap-1">
                          <Sparkles size={8} /> Rubi AI Target
                        </span>
                      ) : t.created_by === 'admin' ? (
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 border border-slate-205/50 px-2 py-1 rounded-md flex items-center gap-1">
                          <Shield size={8} /> Equipe Médica
                        </span>
                      ) : (
                        <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100/40 px-2 py-1 rounded-md">
                          System Template
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none group-hover:text-blue-600 transition-colors">
                      {t.name}
                    </h3>
                    <p className="text-slate-450 text-xs font-semibold mt-2.5 leading-relaxed">
                      {t.description}
                    </p>

                    {/* Meta stats */}
                    <div className="flex gap-4 mt-6 text-[10px] font-black text-slate-450 uppercase tracking-widest">
                      <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all">
                        <Folder size={12} className="text-blue-500" />
                        <span>{t.workouts?.length || 0} Treinos</span>
                      </div>
                      <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all">
                        <Dumbbell size={12} className="text-[#7BA7FF]" />
                        <span>{t.workouts?.reduce((acc, curr) => acc + curr.exercises.length, 0) || 0} Exercícios</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-50/80 pt-6 mt-8 flex justify-between items-center">
                    <span className="text-[8px] font-bold text-slate-350 flex items-center gap-1 uppercase">
                      <Clock size={10} /> Att {new Date(t.updated_at).toLocaleDateString()} por {t.updated_by}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStartEdit(t)}
                        className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:text-slate-900 rounded-xl transition text-slate-500 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider"
                      >
                        <Edit size={12} /> Editar
                      </button>
                      {!isDefaultOnboarding && (
                        <button
                          onClick={() => handleArchive(t.id)}
                          className="p-3 bg-white hover:bg-red-50 hover:text-red-600 border border-slate-100 hover:border-red-100 rounded-xl transition text-slate-400"
                          title="Arquivar modelo"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          /* VIEW 2: COMPREHENSIVE PROTOCOLS DESIGN EDITOR */
          <motion.div
            key="editor"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Editor Action Header */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex items-center justify-between">
              <button
                onClick={() => setEditingTemplate(null)}
                className="px-4 py-2 border border-slate-150 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#7BA7FF] hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-2"
              >
                Voltar ao Catálogo
              </button>
              <div className="text-center hidden sm:block">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Editor Inteligente</span>
                <p className="text-sm font-black text-slate-800 tracking-tight leading-none uppercase mt-1">
                  {isCreatingNew ? 'Criando Modelo' : `Editando ${editingTemplate.name}`} (v{editingTemplate.version})
                </p>
              </div>
              <button
                onClick={triggerSaveConfirm}
                className="px-6 py-4 bg-slate-950 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl flex items-center gap-2 shadow-lg hover:shadow-slate-950/10 active:scale-95 transition"
              >
                <Save size={14} className="text-[#7BA7FF]" /> Salvar Modelo
              </button>
            </div>

            {/* Template Core Metadata Sheet */}
            <div className="bg-white border border-slate-100 rounded-[2.2rem] p-8 space-y-6 shadow-inner">
              <h3 className="text-sm font-[1000] text-slate-800 uppercase tracking-[0.15em] border-b border-slate-50 pb-3">
                Informações Base do Modelo
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Protocolo</label>
                  <input
                    type="text"
                    value={editingTemplate.name}
                    onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    placeholder="Ex: Emagrecimento Feminino, Academia Lotada..."
                    className="w-full p-4 rounded-xl bg-slate-50 text-slate-800 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-sm font-semibold"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Criador / Origem</label>
                  <select
                    value={editingTemplate.created_by}
                    onChange={e => setEditingTemplate({ ...editingTemplate, created_by: e.target.value as any })}
                    className="w-full p-4 rounded-xl bg-slate-50 text-slate-800 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-sm font-semibold"
                  >
                    <option value="system">Modelos de Sistema (System)</option>
                    <option value="admin">Equipe Médica / Admin (Admin)</option>
                    <option value="rubi_ai">Rubi Intelligent Generator (Rubi AI)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição Comercial & Científica</label>
                <textarea
                  value={editingTemplate.description}
                  onChange={e => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  placeholder="Explique o foco terapêutico do protocolo..."
                  rows={3}
                  className="w-full p-4 rounded-xl bg-slate-50 text-slate-800 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-sm font-semibold leading-relaxed"
                />
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editingTemplate.is_default}
                    onChange={e => setEditingTemplate({ ...editingTemplate, is_default: e.target.checked })}
                    className="w-5 h-5 rounded text-[#7BA7FF] bg-slate-50 border-slate-200 focus:ring-blue-500/10"
                  />
                  <div>
                    <span className="text-xs font-black text-slate-700 uppercase tracking-tight block">Definir como Padrão de Onboarding</span>
                    <span className="text-[9px] text-[#7BA7FF] font-medium leading-none block">Novos atletas receberão este modelo imediatamente ao concluir o cadastro.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* WORKOUTS NESTED SHEETS EDITOR */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-[1000] text-slate-800 uppercase tracking-[0.15em] flex items-center gap-2">
                  <Dumbbell size={16} className="text-[#7BA7FF]" /> Fichas de Treino ({editingTemplate.workouts.length})
                </h3>
                <button
                  type="button"
                  onClick={handleAddWorkout}
                  className="px-4 py-2 bg-slate-900 border border-slate-200 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-950 transition flex items-center gap-2 shrink-0 active:scale-95"
                >
                  <Plus size={12} className="text-[#7BA7FF]" /> Adicionar Ficha
                </button>
              </div>

              {editingTemplate.workouts.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dotted border-slate-200 rounded-[2rem] p-12 text-center space-y-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm mx-auto">
                    <ListOrdered size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-500 uppercase">Sem treinos criados</p>
                    <p className="text-[10px] font-medium text-slate-400 mt-1">Clique em "Adicionar Ficha" para criar fichas como Treino A, Treino B, etc.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {editingTemplate.workouts.map((workout, wIdx) => (
                    <div 
                      key={workout.id}
                      className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm space-y-6 hover:shadow-md transition duration-300"
                    >
                      {/* Workout header editing area */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-50 pb-4">
                        <div className="flex-1 w-full space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-lg bg-slate-950 text-white flex items-center justify-center text-xs font-black">
                              {wIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={workout.name}
                              onChange={e => handleUpdateWorkoutName(workout.id, e.target.value)}
                              placeholder="Nome do Treino (Ex: Treino A - Empurrar)"
                              className="text-base font-black text-slate-800 uppercase bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-100 p-1.5 focus:outline-none focus:ring-2 focus:ring-[#7BA7FF]/20 rounded-xl flex-1 focus:border-[#7BA7FF]/50"
                            />
                          </div>
                          <input
                            type="text"
                            value={workout.description || ''}
                            onChange={e => handleUpdateWorkoutDesc(workout.id, e.target.value)}
                            placeholder="Foco ou descrição da ficha..."
                            className="text-xs text-slate-400 font-medium bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-100 p-1 rounded-lg w-full focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveWorkout(workout.id)}
                          className="text-xs font-black uppercase text-red-500 bg-red-50 active:bg-red-100 border border-red-100 py-2.5 px-4 rounded-xl hover:text-red-600 transition flex items-center gap-1.5 shrink-0"
                        >
                          <Trash2 size={12} /> Remover Ficha
                        </button>
                      </div>

                      {/* Workout exercises catalog */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Exercícios Prescritos ({workout.exercises.length})
                          </span>
                        </div>

                        {workout.exercises.length === 0 ? (
                          <div className="bg-slate-50/50 border border-dashed border-slate-200/60 rounded-2xl p-6 text-center text-xs text-slate-400 font-medium">
                            Nenhum exercício incluído nesta ficha de treino.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {workout.exercises.map((ex, exIdx) => (
                              <div 
                                key={ex.exercise_id}
                                className="bg-[#F8FAFC]/50 border border-slate-100 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition duration-200 group/item"
                              >
                                {/* Left Section: Index, Name, Order buttons */}
                                <div className="flex items-center gap-3 min-w-[200px]">
                                  {/* Reordering Controls */}
                                  <div className="flex flex-col text-slate-300">
                                    <button 
                                      onClick={() => handleMoveExercise(workout.id, exIdx, 'up')}
                                      className="hover:text-blue-500 disabled:opacity-30 p-0.5" 
                                      disabled={exIdx === 0}
                                    >
                                      <ChevronUp size={14} />
                                    </button>
                                    <button 
                                      onClick={() => handleMoveExercise(workout.id, exIdx, 'down')}
                                      className="hover:text-blue-500 disabled:opacity-30 p-0.5" 
                                      disabled={exIdx === workout.exercises.length - 1}
                                    >
                                      <ChevronDown size={14} />
                                    </button>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-black text-slate-800 uppercase leading-tight">
                                      {ex.exercise_name}
                                    </h4>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                                      Ordem / Sequência: #{ex.sort_order}
                                    </span>
                                  </div>
                                </div>

                                {/* Intermediate Parameters inputs */}
                                <div className="grid grid-cols-4 gap-3 flex-1 w-full max-w-lg">
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Séries</label>
                                    <input 
                                      type="number" 
                                      value={ex.sets}
                                      onChange={e => handleUpdateExerciseValue(workout.id, ex.exercise_id, 'sets', parseInt(e.target.value) || 3)}
                                      className="w-full text-center text-xs font-black bg-white rounded-lg p-2 border border-slate-150 focus:outline-[#7BA7FF]/50"
                                      min={1}
                                      max={10}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Reps</label>
                                    <input 
                                      type="text" 
                                      value={ex.reps}
                                      onChange={e => handleUpdateExerciseValue(workout.id, ex.exercise_id, 'reps', e.target.value)}
                                      className="w-full text-center text-xs font-black bg-white rounded-lg p-2 border border-slate-150 focus:outline-[#7BA7FF]/50"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Carga Base</label>
                                    <div className="relative">
                                      <input 
                                        type="number" 
                                        value={ex.weight}
                                        onChange={e => handleUpdateExerciseValue(workout.id, ex.exercise_id, 'weight', parseFloat(e.target.value) || 0)}
                                        className="w-full text-center pr-5 text-xs font-black bg-white rounded-lg p-2 border border-slate-150 focus:outline-[#7BA7FF]/50"
                                        min={0}
                                      />
                                      <span className="absolute right-1.5 top-2.5 text-[8px] text-slate-350 font-black uppercase">KG</span>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Descanso</label>
                                    <div className="relative">
                                      <input 
                                        type="number" 
                                        value={ex.rest_time}
                                        onChange={e => handleUpdateExerciseValue(workout.id, ex.exercise_id, 'rest_time', parseInt(e.target.value) || 60)}
                                        className="w-full text-center pr-4 text-xs font-black bg-white rounded-lg p-2 border border-slate-150 focus:outline-[#7BA7FF]/50"
                                        min={15}
                                        step={15}
                                      />
                                      <span className="absolute right-1 top-2.5 text-[7px] text-slate-350 font-black uppercase">Segs</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex md:self-center">
                                  <button
                                    onClick={() => handleRemoveExercise(workout.id, ex.exercise_id)}
                                    className="p-2 bg-white text-slate-400 hover:text-red-500 rounded-xl border border-slate-100 hover:border-red-100 transition duration-150 active:scale-95 flex-shrink-0"
                                    title="Remover exercício"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Search overlay triggering search container inline */}
                        {addingToWorkoutId === workout.id ? (
                          <div className="bg-slate-50 rounded-2xl border border-slate-150/70 p-5 space-y-4">
                            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-150">
                              <Search size={16} className="text-slate-400" />
                              <input
                                type="text"
                                placeholder="Busque por mola, nome ou grupo muscular (ex: Agachamento, Tríceps...)"
                                value={exerciseSearchQuery}
                                onChange={e => setExerciseSearchQuery(e.target.value)}
                                className="bg-transparent border-none text-xs focus:outline-none w-full font-semibold"
                                autoFocus
                              />
                              <button
                                onClick={() => { setAddingToWorkoutId(null); setExerciseSearchQuery(''); }}
                                className="text-[8.5px] font-black uppercase tracking-widest text-[#7BA7FF] hover:text-slate-900 border border-slate-150 p-1 px-2 rounded-lg"
                              >
                                Cancelar
                              </button>
                            </div>

                            {/* Search catalog results view */}
                            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white rounded-xl border border-slate-150">
                              {filteredSearchExercises.length === 0 ? (
                                <p className="p-4 text-center text-[10px] uppercase font-black text-slate-400">Nenhum resultado encontrado</p>
                              ) : (
                                filteredSearchExercises.slice(0, 8).map(ex => (
                                  <div 
                                    key={ex.id}
                                    onClick={() => handleAddExerciseToWorkout(workout.id, ex)}
                                    className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition group"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-[#7BA7FF]/5 border border-[#7BA7FF]/10 flex items-center justify-center text-[#7BA7FF] text-xs font-black">
                                        <Dumbbell size={14} />
                                      </div>
                                      <div>
                                        <p className="text-xs font-black text-slate-800 uppercase leading-none">{ex.name}</p>
                                        <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest mt-1">{ex.muscle_group}</p>
                                      </div>
                                    </div>
                                    <button className="text-[9px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1.5 rounded-lg active:scale-95 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition uppercase tracking-wider">
                                      Incluir
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAddingToWorkoutId(workout.id)}
                            className="w-full py-4 border border-dashed border-[#7BA7FF]/40 rounded-2xl text-[9px] font-black uppercase tracking-widest text-[#7BA7FF] hover:bg-[#7BA7FF]/5 hover:border-[#7BA7FF]/60 active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2"
                          >
                            <Plus size={12} /> Adicionar Exercício à Ficha
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SAVE CONFIRMATION DIALOG MODAL (As requested by blueprint) */}
      <AnimatePresence>
        {showSaveConfirmModal && (
          <div className="fixed inset-0 z-[1600] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowSaveConfirmModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            
            <motion.div 
              initial={{ scale: 0.9, y: 15 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 15 }} 
              className="w-full max-w-md bg-white rounded-3xl p-8 space-y-6 shadow-2xl relative z-10 border border-slate-100 text-left"
            >
              <div className="flex gap-4 items-start border-b border-slate-50 pb-4">
                <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Salvar alterações no modelo global?</h3>
                  <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1.5">Módulo de Sincronização Inteligente</p>
                </div>
              </div>

              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                As alterações realizadas serão utilizadas por novos atletas que entrarem no KYRON OS. Atletas já cadastrados não serão afetados automaticamente.
              </p>

              {/* Changelog/Changes text input */}
              <div className="space-y-2">
                <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas da Versão / Changelog</label>
                <input
                  type="text"
                  value={changelogInput}
                  onChange={e => setChangelogInput(e.target.value)}
                  placeholder="Ex: Adicionado Remada Máquina, atualizado descanso Supino..."
                  className="w-full p-3 text-xs font-semibold bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleFinalSave}
                  className="w-full py-4 bg-slate-950 text-white font-black text-xs uppercase tracking-[0.25em] rounded-2xl shadow-xl shadow-slate-950/15 text-center active:scale-95 transition-all"
                >
                  Atualizar modelo global
                </button>
                <button
                  type="button"
                  onClick={() => setShowSaveConfirmModal(false)}
                  className="w-full py-2 text-slate-400 hover:text-slate-800 font-black text-[10px] uppercase tracking-widest text-center"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
