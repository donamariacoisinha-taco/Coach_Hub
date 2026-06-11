import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Copy, 
  Check, 
  Star, 
  Award, 
  FileText, 
  ChevronRight, 
  Search, 
  Sparkles, 
  Brain, 
  ArrowUp, 
  ArrowDown, 
  Clock, 
  Dumbbell, 
  Layers, 
  Grid, 
  ChevronLeft, 
  Eye, 
  ShieldCheck, 
  Lock, 
  Globe 
} from 'lucide-react';
import { systemTemplatesApi, SystemTemplate } from '../../../lib/api/systemTemplatesApi';
import { premiumProtocolsApi, PremiumProtocol, PremiumTemplateWorkout, PremiumTemplateExercise } from '../../../lib/api/premiumProtocolsApi';
import { useAdminStore } from '../../../store/adminStore';

export const ProtocolManagement: React.FC = () => {
  const { exercises } = useAdminStore();
  const [activeSubTab, setActiveSubTab] = useState<'templates' | 'premium' | 'public' | 'drafts' | 'rubi'>('premium');
  
  const [templates, setTemplates] = useState<SystemTemplate[]>([]);
  const [protocols, setProtocols] = useState<PremiumProtocol[]>([]);
  const [drafts, setDrafts] = useState<PremiumProtocol[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Creation Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [editingProtocolId, setEditingProtocolId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState<'hypertrophy' | 'weight_loss' | 'strength' | 'performance' | 'glutes' | 'recovery'>('hypertrophy');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [durationWeeks, setDurationWeeks] = useState<number>(12);
  const [frequency, setFrequency] = useState<number>(5);
  const [imageUrl, setImageUrl] = useState('');
  
  const [workouts, setWorkouts] = useState<PremiumTemplateWorkout[]>([
    {
      id: 'w-1',
      name: 'Treino A',
      description: 'Foco em força progressiva',
      exercises: []
    }
  ]);
  
  const [isPremium, setIsPremium] = useState<boolean>(true);
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [isRecommended, setIsRecommended] = useState<boolean>(false);
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [isNew, setIsNew] = useState<boolean>(true);

  // Exercise Search state for wizard
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const tmps = await systemTemplatesApi.getTemplates();
      setTemplates(tmps);
      const prtcols = await premiumProtocolsApi.getProtocols();
      setProtocols(prtcols);
      
      const storedDrafts = localStorage.getItem('kyron_admin_draft_protocols');
      if (storedDrafts) {
        setDrafts(JSON.parse(storedDrafts));
      } else {
        const initialDrafts: PremiumProtocol[] = [
          {
            id: 'draft-1',
            name: 'Projeto Reconstrução Muscular',
            description: 'Rascunho de transição metabólica de altas cargas direcionado para atletas intermediários.',
            version: 1,
            premium: true,
            goal: 'hypertrophy',
            difficulty: 'intermediate',
            duration_weeks: 8,
            frequency: 4,
            created_by: 'admin',
            rating: 5,
            athletes_count: 0,
            completion_rate: 0,
            strength_increase_pct: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            updated_by: 'Admin',
            workouts: [],
            version_history: []
          }
        ];
        setDrafts(initialDrafts);
        localStorage.setItem('kyron_admin_draft_protocols', JSON.stringify(initialDrafts));
      }
    } catch (e) {
      console.error('Error loading protocol data:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveDraftsToStorage = (newDrafts: PremiumProtocol[]) => {
    setDrafts(newDrafts);
    localStorage.setItem('kyron_admin_draft_protocols', JSON.stringify(newDrafts));
  };

  const handleStartCreate = () => {
    setEditingProtocolId(null);
    setName('');
    setDescription('');
    setGoal('hypertrophy');
    setDifficulty('intermediate');
    setDurationWeeks(12);
    setFrequency(5);
    setImageUrl('');
    setWorkouts([
      {
        id: 'w-' + Date.now(),
        name: 'Treino A',
        description: 'Membros Superiores Foco Costas',
        exercises: []
      }
    ]);
    setIsPremium(true);
    setIsPublic(false);
    setIsRecommended(false);
    setIsFeatured(false);
    setIsNew(true);
    setWizardStep(1);
    setIsWizardOpen(true);
  };

  const handleStartEdit = (p: PremiumProtocol, isFromDrafts = false) => {
    setEditingProtocolId(p.id);
    setName(p.name);
    setDescription(p.description);
    setGoal(p.goal as any);
    setDifficulty(p.difficulty);
    setDurationWeeks(p.duration_weeks);
    setFrequency(p.frequency);
    setImageUrl('');
    setWorkouts(p.workouts || []);
    setIsPremium(p.premium);
    setIsPublic(!p.premium);
    setIsRecommended(p.featured || false);
    setIsFeatured(p.featured || false);
    setIsNew(true);
    setWizardStep(1);
    setIsWizardOpen(true);
  };

  const handleDuplicate = async (p: PremiumProtocol, isFromDrafts = false) => {
    const duplicated: PremiumProtocol = {
      ...p,
      id: `protocol-${Date.now()}`,
      name: `${p.name} (Cópia)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    if (isFromDrafts) {
      const newDrafts = [...drafts, duplicated];
      saveDraftsToStorage(newDrafts);
    } else {
      await premiumProtocolsApi.createOrUpdateProtocol(duplicated);
      const updated = await premiumProtocolsApi.getProtocols();
      setProtocols(updated);
    }
  };

  const handleArchive = async (id: string, isFromDrafts = false) => {
    if (confirm('Deseja realmente arquivar este protocolo?')) {
      if (isFromDrafts) {
        const newDrafts = drafts.filter(d => d.id !== id);
        saveDraftsToStorage(newDrafts);
      } else {
        await premiumProtocolsApi.archiveProtocol(id);
        const updated = await premiumProtocolsApi.getProtocols();
        setProtocols(updated);
      }
    }
  };

  // Workout add / remove
  const addWorkoutSegment = () => {
    const label = String.fromCharCode(65 + workouts.length);
    const newW: PremiumTemplateWorkout = {
      id: 'w-' + Date.now(),
      name: `Treino ${label}`,
      description: 'Progressão mecânica ideal',
      exercises: []
    };
    setWorkouts([...workouts, newW]);
  };

  const removeWorkoutSegment = (id: string) => {
    setWorkouts(workouts.filter(w => w.id !== id));
  };

  const updateWorkoutName = (id: string, newName: string) => {
    setWorkouts(workouts.map(w => w.id === id ? { ...w, name: newName } : w));
  };

  const updateWorkoutDesc = (id: string, newDesc: string) => {
    setWorkouts(workouts.map(w => w.id === id ? { ...w, description: newDesc } : w));
  };

  // Exercise Management in Workout Segment
  const addExerciseToWorkout = (workoutId: string, ex: any) => {
    setWorkouts(workouts.map(w => {
      if (w.id === workoutId) {
        const order = w.exercises.length + 1;
        const newEx: PremiumTemplateExercise = {
          exercise_id: ex.id,
          exercise_name: ex.name,
          sets: 4,
          reps: '10',
          weight: 10,
          rest_time: 60,
          sort_order: order,
          sets_json: [
            { reps: '10', weight: 10, rest_time: 60 },
            { reps: '10', weight: 10, rest_time: 60 },
            { reps: '10', weight: 10, rest_time: 60 },
            { reps: '10', weight: 10, rest_time: 60 }
          ]
        };
        return {
          ...w,
          exercises: [...w.exercises, newEx]
        };
      }
      return w;
    }));
  };

  const removeExerciseFromWorkout = (workoutId: string, idx: number) => {
    setWorkouts(workouts.map(w => {
      if (w.id === workoutId) {
        return {
          ...w,
          exercises: w.exercises.filter((_, i) => i !== idx)
        };
      }
      return w;
    }));
  };

  const moveExInWorkout = (workoutId: string, idx: number, direction: 'up' | 'down') => {
    setWorkouts(workouts.map(w => {
      if (w.id === workoutId) {
        const list = [...w.exercises];
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx >= 0 && swapIdx < list.length) {
          const tmp = list[idx];
          list[idx] = list[swapIdx];
          list[swapIdx] = tmp;
        }
        return { ...w, exercises: list };
      }
      return w;
    }));
  };

  const updateExerciseFields = (workoutId: string, exIdx: number, fields: Partial<PremiumTemplateExercise>) => {
    setWorkouts(workouts.map(w => {
      if (w.id === workoutId) {
        const updatedExs = w.exercises.map((ex, i) => {
          if (i === exIdx) {
            return { ...ex, ...fields };
          }
          return ex;
        });
        return { ...w, exercises: updatedExs };
      }
      return w;
    }));
  };

  // Publish / Save Wizard Flow
  const handleCompleteWizard = async (publishStatus: 'draft' | 'public' | 'premium') => {
    const finalProtocol: PremiumProtocol = {
      id: editingProtocolId || `protocol-${Date.now()}`,
      name: name || 'Protocolo Sem Nome',
      description: description || 'Sem descrição cadastrada.',
      version: 1,
      premium: publishStatus === 'premium',
      goal,
      difficulty,
      duration_weeks: durationWeeks,
      frequency,
      created_by: 'admin',
      rating: 4.9,
      athletes_count: publishStatus !== 'draft' ? 12 : 0,
      completion_rate: 90,
      strength_increase_pct: 15,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: 'Rubi Admin',
      workouts,
      version_history: []
    };

    if (publishStatus === 'draft') {
      // Remove from published if editing published
      if (editingProtocolId && !drafts.some(d => d.id === editingProtocolId)) {
        await premiumProtocolsApi.archiveProtocol(editingProtocolId);
      }
      const otherDrafts = drafts.filter(d => d.id !== finalProtocol.id);
      saveDraftsToStorage([...otherDrafts, finalProtocol]);
    } else {
      // Remove from drafts if publishing draft
      if (editingProtocolId && drafts.some(d => d.id === editingProtocolId)) {
        const updatedDrafts = drafts.filter(d => d.id !== editingProtocolId);
        saveDraftsToStorage(updatedDrafts);
      }
      await premiumProtocolsApi.createOrUpdateProtocol(finalProtocol);
    }

    await loadData();
    setIsWizardOpen(false);
  };

  const activeExercises = exercises.filter(ex => ex.is_active);
  const searchedExercises = exerciseSearchQuery.trim() === '' 
    ? activeExercises.slice(0, 5)
    : activeExercises.filter(ex => ex.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase())).slice(0, 10);

  const filterLabel = (g: string) => {
    const goals: Record<string, string> = {
      hypertrophy: 'Hipertrofia',
      weight_loss: 'Emagrecimento',
      strength: 'Força Máxima',
      performance: 'Performance',
      glutes: 'Glúteos & Linhas',
      recovery: 'Recuperação'
    };
    return goals[g] || g;
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Upper Navigation & Stat Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Protocolos & Programas
          </h2>
          <p className="text-sm font-medium text-slate-400 mt-1">
            Gerencie rascunhos, templates globais e canais de distribuição premium do KYRON OS.
          </p>
        </div>
        
        <button
          onClick={handleStartCreate}
          className="px-6 h-12 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-xl hover:scale-101 active:scale-98 transition-all"
        >
          <Plus size={16} />
          Desenhar Protocolo
        </button>
      </div>

      {/* Sub tabs Menu */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('premium')}
          className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
            activeSubTab === 'premium'
              ? 'bg-slate-950 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-950'
          }`}
        >
          <div className="flex items-center gap-2">
            <Lock size={13} className={activeSubTab === 'premium' ? 'text-blue-400' : ''} />
            Premium ({protocols.filter(p => p.premium).length})
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('public')}
          className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
            activeSubTab === 'public'
              ? 'bg-slate-950 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-950'
          }`}
        >
          <div className="flex items-center gap-2">
            <Globe size={13} />
            Públicos ({protocols.filter(p => !p.premium).length})
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('templates')}
          className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
            activeSubTab === 'templates'
              ? 'bg-slate-950 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-950'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers size={13} />
            Templates ({templates.length})
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('drafts')}
          className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
            activeSubTab === 'drafts'
              ? 'bg-slate-950 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-950'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText size={13} />
            Rascunhos ({drafts.length})
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('rubi')}
          className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
            activeSubTab === 'rubi'
              ? 'bg-slate-950 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-950'
          }`}
        >
          <div className="flex items-center gap-2">
            <Brain size={13} className="text-blue-500 animate-pulse" />
            Curadoria Rubi
          </div>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-24 text-slate-400">
          Carregando protocolos premium...
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {activeSubTab === 'premium' && (
              protocols.filter(p => p.premium).map(p => (
                <ProtocolCard 
                  key={p.id} 
                  p={p} 
                  onEdit={() => handleStartEdit(p, false)}
                  onDuplicate={() => handleDuplicate(p, false)}
                  onArchive={() => handleArchive(p.id, false)}
                />
              ))
            )}

            {activeSubTab === 'public' && (
              protocols.filter(p => !p.premium).map(p => (
                <ProtocolCard 
                  key={p.id} 
                  p={p} 
                  onEdit={() => handleStartEdit(p, false)}
                  onDuplicate={() => handleDuplicate(p, false)}
                  onArchive={() => handleArchive(p.id, false)}
                  isPublic
                />
              ))
            )}

            {activeSubTab === 'templates' && (
              templates.map(p => (
                <div 
                  key={p.id}
                  className="bg-white/70 backdrop-blur-xl border border-white/40 p-6 rounded-3xl text-left flex flex-col justify-between h-[210px] shadow-sm relative group"
                >
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-[#7BA7FF] bg-blue-50 border border-blue-105 px-2.5 py-1 rounded-full">
                      Global Template
                    </span>
                    <h3 className="text-md font-black text-slate-900 uppercase tracking-tight mt-2 line-clamp-1">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-400 leading-normal line-clamp-2">
                      {p.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100/60 pt-4 mt-4 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>{p.workouts?.length || 0} Treinos</span>
                    <span className="text-slate-300">v{p.version}</span>
                  </div>
                </div>
              ))
            )}

            {activeSubTab === 'drafts' && (
              drafts.map(p => (
                <ProtocolCard 
                  key={p.id} 
                  p={p} 
                  onEdit={() => handleStartEdit(p, true)}
                  onDuplicate={() => handleDuplicate(p, true)}
                  onArchive={() => handleArchive(p.id, true)}
                  isDraft
                />
              ))
            )}

            {activeSubTab === 'rubi' && (
              <div className="col-span-full bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-8 max-w-3xl text-left space-y-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#7BA7FF]/5 border border-[#7BA7FF]/20 rounded-xl flex items-center justify-center text-[#7BA7FF]">
                    <Brain size={18} />
                  </div>
                  <div>
                    <h3 className="text-md font-black text-slate-900 uppercase tracking-tight">Rubi Intelligence — Quality Control</h3>
                    <p className="text-xs text-slate-400 mt-1">Análise inteligente da harmonia estrutural das planilhas ativas.</p>
                  </div>
                </div>

                <div className="space-y-4 border-t border-slate-100/80 pt-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sugestões de Ajuste Rubi</h4>
                  <ul className="space-y-3.5">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0 animate-pulse" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Baixa frequência de posterior</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">O estímulo mecânico do posterior está desregulado em relação aos quadríceps.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Volume reduzido para peitoral</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Atletas de nível avançado podem estagnar com apenas 12 séries semanais no rascunho de Transição Metabólica.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Recuperação insuficiente</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">O programa Hipertrofia Estratégica atinge sobreposição muscular de deltoide lateral consecutiva.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Estrutura desequilibrada (Eixo Axial)</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Exercícios de empuxo vertical superam os de rotação interna de deltoide.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Exercícios redundantes encontrados</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Tríceps Corda e Tríceps Pulley operam o mesmo vetor em rotação neutra.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Creation Wizard Dialog Popup */}
      {isWizardOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col text-left"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[9px] font-black text-[#7BA7FF] uppercase tracking-widest">
                  Criador de Protocolos KYRON (Passo {wizardStep} de 4)
                </span>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mt-1">
                  {editingProtocolId ? 'Editar Protocolo' : 'Novo Protocolo de Performance'}
                </h3>
              </div>
              <button 
                onClick={() => setIsWizardOpen(false)}
                className="text-slate-400 hover:text-slate-900 text-xs font-bold"
              >
                Voltar
              </button>
            </div>

            {/* Stepper Bar */}
            <div className="flex border-b border-slate-100 bg-white">
              <button 
                onClick={() => wizardStep > 1 && setWizardStep(1)}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 text-center transition-all ${
                  wizardStep === 1 ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400'
                }`}
              >
                1. Informações Básicas
              </button>
              <button 
                onClick={() => wizardStep > 1 && setWizardStep(2)}
                disabled={wizardStep < 2}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 text-center transition-all ${
                  wizardStep === 2 ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400'
                }`}
              >
                2. Montagem dos Treinos
              </button>
              <button 
                onClick={() => wizardStep > 2 && setWizardStep(3)}
                disabled={wizardStep < 3}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 text-center transition-all ${
                  wizardStep === 3 ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400'
                }`}
              >
                3. Configurações & Visibilidade
              </button>
              <button 
                onClick={() => wizardStep > 3 && setWizardStep(4)}
                disabled={wizardStep < 4}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 text-center transition-all ${
                  wizardStep === 4 ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400'
                }`}
              >
                4. Publicação Direta
              </button>
            </div>

            {/* Step Body Content */}
            <div className="p-8 flex-1 overflow-y-auto space-y-6 max-h-[60vh]">
              {wizardStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nome do Protocolo</label>
                      <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Hipertrofia Miofibrilar Avançada" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Objetivo</label>
                      <select 
                        value={goal} 
                        onChange={(e: any) => setGoal(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="hypertrophy">Hipertrofia Miofibrilar</option>
                        <option value="weight_loss">Recomposição / Perda Calórica</option>
                        <option value="strength">Força Progressiva</option>
                        <option value="performance">Acondicionamento Atlético</option>
                        <option value="glutes">Glúteos & Linhas Estéticas</option>
                        <option value="recovery">Recuperação Funcional</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Descrição Detalhada</label>
                    <textarea 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descreva a metodologia mecânica integrada, tempos de descanso sugeridos..."
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nível de Dificuldade</label>
                      <select 
                        value={difficulty} 
                        onChange={(e: any) => setDifficulty(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                      >
                        <option value="beginner">Iniciante</option>
                        <option value="intermediate">Intermediário</option>
                        <option value="advanced">Avançado</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Duração (Semanas)</label>
                      <input 
                        type="number" 
                        value={durationWeeks} 
                        onChange={(e) => setDurationWeeks(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Frequência Semanal (Treinos/Semana)</label>
                      <input 
                        type="number" 
                        value={frequency} 
                        onChange={(e) => setFrequency(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-8">
                  {/* List of workout segments */}
                  {workouts.map((ws, wIdx) => (
                    <div key={ws.id} className="border border-slate-200 rounded-2xl p-6 relative bg-slate-50 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 w-2/3">
                          <input 
                            type="text" 
                            value={ws.name} 
                            onChange={(e) => updateWorkoutName(ws.id, e.target.value)}
                            placeholder="Ex: Treino A - Costas" 
                            className="bg-transparent font-black text-slate-900 border-none outline-none focus:ring-0 uppercase text-sm w-full"
                          />
                        </div>
                        
                        <button
                          onClick={() => removeWorkoutSegment(ws.id)}
                          className="text-red-500 hover:text-red-700 text-[10px] font-black uppercase tracking-wider"
                        >
                          Excluir Ficha
                        </button>
                      </div>

                      <input 
                        type="text" 
                        value={ws.description || ''} 
                        onChange={(e) => updateWorkoutDesc(ws.id, e.target.value)}
                        placeholder="Método de saturação miofibrilar..." 
                        className="bg-transparent text-xs text-slate-400 border-none outline-none w-full"
                      />

                      {/* Display added exercises */}
                      <div className="space-y-2.5 pt-2">
                        {ws.exercises && ws.exercises.length > 0 ? (
                          ws.exercises.map((te, exIdx) => (
                            <div key={exIdx} className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-1 shrink-0">
                                  <button onClick={() => moveExInWorkout(ws.id, exIdx, 'up')} className="text-slate-400 hover:text-slate-950">
                                    <ArrowUp size={12} />
                                  </button>
                                  <button onClick={() => moveExInWorkout(ws.id, exIdx, 'down')} className="text-slate-400 hover:text-slate-950">
                                    <ArrowDown size={12} />
                                  </button>
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800">{te.exercise_name}</p>
                                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Ordem: {exIdx + 1}</p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Séries</span>
                                  <input 
                                    type="number" 
                                    value={te.sets} 
                                    onChange={(e) => updateExerciseFields(ws.id, exIdx, { sets: Number(e.target.value) })}
                                    className="w-10 bg-slate-50 border rounded p-1 text-center font-bold"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reps</span>
                                  <input 
                                    type="text" 
                                    value={te.reps} 
                                    onChange={(e) => updateExerciseFields(ws.id, exIdx, { reps: e.target.value })}
                                    className="w-14 bg-slate-50 border rounded p-1 text-center"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">KG</span>
                                  <input 
                                    type="number" 
                                    value={te.weight} 
                                    onChange={(e) => updateExerciseFields(ws.id, exIdx, { weight: Number(e.target.value) })}
                                    className="w-12 bg-slate-50 border rounded p-1 text-center"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Descanso</span>
                                  <input 
                                    type="number" 
                                    value={te.rest_time} 
                                    onChange={(e) => updateExerciseFields(ws.id, exIdx, { rest_time: Number(e.target.value) })}
                                    className="w-12 bg-slate-50 border rounded p-1 text-center"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeExerciseFromWorkout(ws.id, exIdx)}
                                  className="text-red-400 hover:text-red-600 ml-2"
                                >
                                  Remover
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center p-6 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs uppercase tracking-widest">
                            Nenhum exercício integrado. Pesquise e adicione abaixo.
                          </div>
                        )}
                      </div>

                      {/* Add Exercises Box */}
                      <div className="pt-4 border-t border-slate-200">
                        {activeWorkoutId === ws.id ? (
                          <div className="bg-white border rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selecionar Exercício Ativo</span>
                              <button onClick={() => setActiveWorkoutId(null)} className="text-slate-400 hover:text-slate-900 text-[10px] font-extrabold uppercase">Fechar</button>
                            </div>
                            <input 
                              type="text" 
                              placeholder="Pesquisar exercício..."
                              value={exerciseSearchQuery}
                              onChange={(e) => setExerciseSearchQuery(e.target.value)}
                              className="w-full border p-2 text-xs rounded-lg"
                            />
                            <div className="divide-y max-h-36 overflow-y-auto">
                              {searchedExercises.map(ex => (
                                <button
                                  key={ex.id}
                                  onClick={() => addExerciseToWorkout(ws.id, ex)}
                                  className="w-full text-left p-2.5 hover:bg-slate-50 text-xs font-semibold flex items-center justify-between"
                                >
                                  <span>{ex.name}</span>
                                  <span className="text-[9px] font-black text-blue-500 uppercase">Adicionar +</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveWorkoutId(ws.id);
                              setExerciseSearchQuery('');
                            }}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold tracking-tight rounded-xl text-[10px] uppercase flex items-center gap-1.5"
                          >
                            + Acoplar Exercício Ativo
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addWorkoutSegment}
                    className="w-full py-5 border border-dashed border-slate-300 hover:bg-slate-50 flex items-center justify-center gap-2 rounded-2xl text-[11px] font-black uppercase tracking-widest text-[#7BA7FF]"
                  >
                    + Criar Novo Segmento de Treino
                  </button>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-6">
                  <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Visibilidade Principal</h4>
                    
                    <div className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Protocolo Premium</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Exclusivo para assinantes do plano Kyron Premium.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isPremium} 
                        onChange={(e) => {
                          setIsPremium(e.target.checked);
                          if (e.target.checked) setIsPublic(false);
                        }}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                    </div>

                    <div className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Protocolo Público (Gratuito)</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Disponível em vitrine livre para converter novos prospectos.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isPublic} 
                        onChange={(e) => {
                          setIsPublic(e.target.checked);
                          if (e.target.checked) setIsPremium(false);
                        }}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Recomendação & Flags de Destaque</h4>
                    
                    <div className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Recomendado por Rubi Intelligence</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Exibido na área sugerida na Biblioteca de Clientes.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isRecommended} 
                        onChange={(e) => setIsRecommended(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                    </div>

                    <div className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Protocolo de Destaque (Featured)</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Hero banner principal da página dos atletas.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isFeatured} 
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                    </div>

                    <div className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Novo Protocolo (Etiqueta NEW)</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Indicador azul de adição recente.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isNew} 
                        onChange={(e) => setIsNew(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 4 && (
                <div className="space-y-6">
                  <div className="border border-slate-200 rounded-3xl p-8 bg-slate-50 text-center space-y-4 max-w-xl mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 mx-auto">
                      <Check size={24} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black uppercase tracking-tight text-slate-900">Configuração Concluída</h4>
                      <p className="text-xs text-slate-400">O protocolo "{name || 'Sem Nome'}" foi compilado e está pronto para o ecossistema.</p>
                    </div>

                    <div className="pt-4 grid grid-cols-1 gap-3">
                      <button
                        onClick={() => handleCompleteWizard('premium')}
                        className="px-6 py-4 bg-slate-950 hover:bg-slate-850 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition duration-250 w-full"
                      >
                        Publicar na Biblioteca Premium
                      </button>
                      <button
                        onClick={() => handleCompleteWizard('public')}
                        className="px-6 py-4 bg-white border hover:bg-slate-50 text-slate-800 font-black text-[10px] uppercase tracking-widest rounded-xl transition duration-250 w-full"
                      >
                        Publicar como Protocolo Público
                      </button>
                      <button
                        onClick={() => handleCompleteWizard('draft')}
                        className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-xl transition duration-250 w-full"
                      >
                        Arquivar como Rascunho Interno
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <button
                onClick={() => wizardStep > 1 && setWizardStep((wizardStep - 1) as any)}
                disabled={wizardStep === 1}
                className="px-5 py-3 border rounded-xl font-bold text-xs text-slate-500 disabled:opacity-40"
              >
                Voltar
              </button>

              <button
                onClick={() => {
                  if (wizardStep < 4) {
                    setWizardStep((wizardStep + 1) as any);
                  }
                }}
                className={`px-5 py-3 bg-slate-950 text-white rounded-xl font-bold text-xs ${
                  wizardStep === 4 ? 'hidden' : 'block'
                }`}
              >
                Avançar Passo
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

interface ProtocolCardProps {
  p: PremiumProtocol;
  onEdit: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  isDraft?: boolean;
  isPublic?: boolean;
}

const ProtocolCard: React.FC<ProtocolCardProps> = ({ p, onEdit, onDuplicate, onArchive, isDraft, isPublic }) => {
  const [showMenu, setShowMenu] = useState(false);
  
  const totalExercises = p.workouts?.reduce((acc, w) => acc + (w.exercises?.length || 0), 0) || 0;

  const getGoalTheme = (g: string) => {
    const goals: Record<string, string> = {
      hypertrophy: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      weight_loss: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      strength: 'text-rose-600 bg-rose-50 border-rose-100',
      performance: 'text-amber-600 bg-amber-50 border-amber-100',
      glutes: 'text-pink-600 bg-pink-50 border-pink-100',
      recovery: 'text-sky-600 bg-sky-50 border-sky-100'
    };
    return goals[g] || 'text-slate-600 bg-slate-50 border-slate-100';
  };

  const getGoalLabel = (g: string) => {
    const goals: Record<string, string> = {
      hypertrophy: 'Hipertrofia Miofibrilar',
      weight_loss: 'Emagrecimento / Perda',
      strength: 'Força Máxima',
      performance: 'Performance',
      glutes: 'Glúteos & Linhas',
      recovery: 'Recuperação'
    };
    return goals[g] || g;
  };

  return (
    <div 
      className="bg-white/70 backdrop-blur-xl border border-white/40 p-6 rounded-3xl text-left flex flex-col justify-between h-[230px] shadow-sm relative group select-none hover:border-slate-300 transition-all duration-200"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest border px-2.5 py-1 rounded-full ${getGoalTheme(p.goal)}`}>
            {getGoalLabel(p.goal)}
          </span>
          
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="text-slate-400 hover:text-slate-900 text-sm font-black tracking-widest px-1"
            >
              •••
            </button>
            {showMenu && (
              <div className="absolute right-0 top-6 w-36 bg-white border border-slate-205 rounded-xl shadow-lg z-10 py-1.5 text-xs text-slate-700">
                <button 
                  onClick={() => { onEdit(); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Edit size={12} /> Editar
                </button>
                <button 
                  onClick={() => { onDuplicate(); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Copy size={12} /> Duplicar
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button 
                  onClick={() => { onArchive(); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-red-500 flex items-center gap-2"
                >
                  <Trash2 size={12} /> Arquivar
                </button>
              </div>
            )}
          </div>
        </div>

        <h3 className="text-md font-black text-slate-900 uppercase tracking-tight mt-2 line-clamp-1">
          {p.name}
        </h3>
        
        <p className="text-xs text-slate-400 leading-normal line-clamp-2">
          {p.description}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100/60 pt-4 mt-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
        <div className="flex gap-3">
          <span>{p.duration_weeks} Semanas</span>
          <span>•</span>
          <span>{totalExercises} Exercícios</span>
        </div>
        <span className="text-[8px] font-black tracking-widest uppercase">
          {isDraft ? (
            <span className="text-amber-500 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Draft</span>
          ) : isPublic ? (
            <span className="text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Livre</span>
          ) : (
            <span className="text-blue-500 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">Premium</span>
          )}
        </span>
      </div>
    </div>
  );
};
