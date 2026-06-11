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
  const [activeSubTab, setActiveSubTab] = useState<'my_protocols' | 'templates' | 'premium' | 'public' | 'drafts' | 'rubi' | 'community'>('my_protocols');
  
  const [templates, setTemplates] = useState<SystemTemplate[]>([]);
  const [protocols, setProtocols] = useState<PremiumProtocol[]>([]);
  const [drafts, setDrafts] = useState<PremiumProtocol[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Community Approval Queue & Database State
  const [communityProtocols, setCommunityProtocols] = useState<any[]>(() => {
    const stored = localStorage.getItem('kyron_admin_community_protocols');
    if (stored) return JSON.parse(stored);
    return [
      {
        id: 'comm-1',
        name: 'GVT - German Volume Training Adap.',
        description: 'Foco em hipertrofia de alta densidade e volume. Planilha robusta compartilhada para validação.',
        goal: 'hypertrophy',
        difficulty: 'advanced',
        duration_weeks: 6,
        frequency: 4,
        status: 'pending',
        shared_by: 'Felipe Alencar',
        created_at: new Date().toISOString(),
        workouts: []
      },
      {
        id: 'comm-2',
        name: 'Membros Superiores Estético Foco Deltóides',
        description: 'Vetor de forças específico focado na proporção clavicular de ombros. Desenvolvido para modelagem estética.',
        goal: 'glutes',
        difficulty: 'intermediate',
        duration_weeks: 8,
        frequency: 3,
        status: 'pending',
        shared_by: 'Bárbara Schmidt',
        created_at: new Date().toISOString(),
        workouts: []
      },
      {
        id: 'comm-3',
        name: 'Functional Conditioning & Core Pro',
        description: 'Focado em reatividade neuromuscular do core axial e performance cardio-respiratória em circuito.',
        goal: 'performance',
        difficulty: 'intermediate',
        duration_weeks: 10,
        frequency: 5,
        status: 'approved',
        shared_by: 'Rodrigo Torres',
        created_at: new Date().toISOString(),
        workouts: []
      }
    ];
  });

  // Timeline and Simplified Modal state
  const [selectedProtocolForVersion, setSelectedProtocolForVersion] = useState<PremiumProtocol | null>(null);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState<number>(3);
  const [isSimplifiedModalOpen, setIsSimplifiedModalOpen] = useState(false);
  const [simpleGoal, setSimpleGoal] = useState<'hypertrophy' | 'weight_loss' | 'strength' | 'performance' | 'glutes' | 'recovery'>('hypertrophy');
  const [simpleDifficulty, setSimpleDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [simpleDuration, setSimpleDuration] = useState<number>(12);
  const [simpleCoverImage, setSimpleCoverImage] = useState('');
  const [simpleName, setSimpleName] = useState('');

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

  const saveCommunityToStorage = (newComm: any[]) => {
    setCommunityProtocols(newComm);
    localStorage.setItem('kyron_admin_community_protocols', JSON.stringify(newComm));
  };

  const handleApproveCommunity = async (id: string) => {
    const updated = communityProtocols.map(c => c.id === id ? { ...c, status: 'approved' } : c);
    saveCommunityToStorage(updated);
    
    const approvedItem = communityProtocols.find(c => c.id === id);
    if (approvedItem) {
      const newP: PremiumProtocol = {
        id: `comm-protocol-${id}`,
        name: approvedItem.name,
        description: approvedItem.description + " (Aprovado da Comunidade).",
        version: 1,
        premium: true,
        goal: approvedItem.goal,
        difficulty: approvedItem.difficulty,
        duration_weeks: approvedItem.duration_weeks,
        frequency: approvedItem.frequency || 4,
        created_by: approvedItem.shared_by,
        rating: 4.8,
        athletes_count: 5,
        completion_rate: 85,
        strength_increase_pct: 12,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: 'Rubi Admin',
        workouts: [],
        version_history: []
      };
      await premiumProtocolsApi.createOrUpdateProtocol(newP);
      const prtcols = await premiumProtocolsApi.getProtocols();
      setProtocols(prtcols);
    }
  };

  const handleRejectCommunity = (id: string) => {
    const updated = communityProtocols.filter(c => c.id !== id);
    saveCommunityToStorage(updated);
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
            Protocolos & Programas <span className="text-[10px] bg-slate-100 text-slate-700 font-black px-2 py-0.5 rounded-full">Core</span>
          </h2>
          <p className="text-sm font-medium text-slate-400 mt-1">
            Espaço de trabalho centralizado para desenhar, auditar e distribuir programas de performance KYRON OS.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => {
              setSimpleName("");
              setSimpleGoal("hypertrophy");
              setSimpleDifficulty("intermediate");
              setSimpleDuration(12);
              setSimpleCoverImage("");
              setIsSimplifiedModalOpen(true);
            }}
            className="px-5 h-12 bg-[#7BA7FF]/10 text-[#7BA7FF] hover:bg-[#7BA7FF]/20 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-[#7BA7FF]/20"
          >
            <Lock size={13} />
            Publicar Premium
          </button>
          
          <button
            onClick={handleStartCreate}
            className="px-6 h-12 bg-slate-950 text-white hover:bg-slate-850 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-xl transition-all"
          >
            <Plus size={16} />
            Desenhar Protocolo
          </button>
        </div>
      </div>

      {/* Sub tabs Menu */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('my_protocols')}
          className={`px-4.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeSubTab === 'my_protocols'
              ? 'bg-slate-950 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-950 hover:bg-slate-50'
          }`}
        >
          Meus Protocolos ({protocols.length + drafts.length})
        </button>

        <button
          onClick={() => setActiveSubTab('templates')}
          className={`px-4.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeSubTab === 'templates'
              ? 'bg-slate-950 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-950 hover:bg-slate-50'
          }`}
        >
          Templates ({templates.length})
        </button>

        <button
          onClick={() => setActiveSubTab('premium')}
          className={`px-4.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeSubTab === 'premium'
              ? 'bg-slate-950 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-950 hover:bg-slate-50'
          }`}
        >
          Premium ({protocols.filter(p => p.premium).length})
        </button>

        <button
          onClick={() => setActiveSubTab('public')}
          className={`px-4.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeSubTab === 'public'
              ? 'bg-slate-950 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-950 hover:bg-slate-50'
          }`}
        >
          Públicos ({protocols.filter(p => !p.premium).length})
        </button>

        <button
          onClick={() => setActiveSubTab('drafts')}
          className={`px-4.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeSubTab === 'drafts'
              ? 'bg-slate-950 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-950 hover:bg-slate-50'
          }`}
        >
          Rascunhos ({drafts.length})
        </button>

        <button
          onClick={() => setActiveSubTab('rubi')}
          className={`px-4.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeSubTab === 'rubi'
              ? 'bg-slate-950 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-950 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Brain size={12} className={activeSubTab === 'rubi' ? 'text-blue-200 animate-pulse' : 'text-[#7BA7FF]'} />
            Curadoria Rubi
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('community')}
          className={`px-4.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeSubTab === 'community'
              ? 'bg-slate-950 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-950 hover:bg-slate-50'
          }`}
        >
          Comunidade ({communityProtocols.length})
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
            className="space-y-6"
          >
            {/* MEUS PROTOCOLOS TAB (ADMIN WORKSPACE Row List / Bento) */}
            {activeSubTab === 'my_protocols' && (
              <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-[2.5rem] shadow-sm overflow-hidden text-left">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Centro de Operações de Atletas</h3>
                    <p className="text-xs text-slate-400 mt-1">Todos os protocolos ativos, rascunhos e publicações editadas pelo administrador.</p>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Nome / Linha de Força</th>
                        <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria</th>
                        <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Nível</th>
                        <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Timeline de Versão</th>
                        <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Última Modificação</th>
                        <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                        <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/60 font-medium text-xs text-slate-700">
                      {[...protocols, ...drafts].map(p => {
                        const isD = drafts.some(d => d.id === p.id);
                        const isPub = !p.premium && !isD;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="p-5">
                              <div>
                                <span className="font-bold text-slate-900 hover:text-[#7BA7FF] cursor-pointer" onClick={() => handleStartEdit(p, isD)}>{p.name}</span>
                                <p className="text-slate-450 text-[10px] mt-0.5 line-clamp-1 font-normal max-w-xs">{p.description || "Sem descrição."}</p>
                              </div>
                            </td>
                            
                            <td className="p-5">
                              <span className="text-slate-500 font-semibold text-[11px]">
                                {filterLabel(p.goal)}
                              </span>
                            </td>

                            <td className="p-5">
                              <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-205">
                                {p.difficulty === 'advanced' ? 'Avançado' : p.difficulty === 'beginner' ? 'Iniciante' : 'Intermediário'}
                              </span>
                            </td>

                            <td className="p-5">
                              {/* Clickable timeline badge */}
                              <button
                                onClick={() => {
                                  setSelectedProtocolForVersion(p);
                                  setSelectedVersionIndex(3);
                                }}
                                className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                              >
                                <span className="text-[10px] font-mono text-slate-400 hover:underline">v1 ── v2 ── v3 ── <strong className="text-slate-900 font-black">● v4</strong></span>
                              </button>
                            </td>

                            <td className="p-5 text-slate-400 font-semibold text-[11px]">
                              {p.updated_at ? new Date(p.updated_at).toLocaleDateString('pt-BR') : 'N/A'}
                            </td>

                            <td className="p-5">
                              {isD ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-amber-50 ring-1 ring-amber-200 text-amber-600 rounded-full">
                                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" /> Rascunho
                                </span>
                              ) : isPub ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-emerald-50 ring-1 ring-emerald-200 text-emerald-600 rounded-full">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Público
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-blue-50 ring-1 ring-blue-200 text-blue-600 rounded-full">
                                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Premium
                                </span>
                              )}
                            </td>

                            <td className="p-5 text-right space-x-1 whitespace-nowrap">
                              <button
                                onClick={() => handleStartEdit(p, isD)}
                                className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-50 border rounded-lg transition"
                                title="Editar"
                              >
                                <Edit size={11} />
                              </button>
                              <button
                                onClick={() => handleDuplicate(p, isD)}
                                className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-50 border rounded-lg transition"
                                title="Duplicar"
                              >
                                <Copy size={11} />
                              </button>
                              <button
                                onClick={() => handleArchive(p.id, isD)}
                                className="p-1.5 text-red-400 hover:text-red-700 bg-rose-50 border border-rose-100 rounded-lg transition"
                                title="Arquivar"
                              >
                                <Trash2 size={11} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CLASSIC GRID LAYOUT FOR PREMIUM TAB */}
            {activeSubTab === 'premium' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {protocols.filter(p => p.premium).map(p => (
                  <ProtocolCard 
                    key={p.id} 
                    p={p} 
                    onEdit={() => handleStartEdit(p, false)}
                    onDuplicate={() => handleDuplicate(p, false)}
                    onArchive={() => handleArchive(p.id, false)}
                    onViewTimeline={() => {
                      setSelectedProtocolForVersion(p);
                      setSelectedVersionIndex(3);
                    }}
                  />
                ))}
              </div>
            )}

            {/* CLASSIC GRID LAYOUT FOR PUBLIC TAB */}
            {activeSubTab === 'public' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {protocols.filter(p => !p.premium).map(p => (
                  <ProtocolCard 
                    key={p.id} 
                    p={p} 
                    onEdit={() => handleStartEdit(p, false)}
                    onDuplicate={() => handleDuplicate(p, false)}
                    onArchive={() => handleArchive(p.id, false)}
                    isPublic
                    onViewTimeline={() => {
                      setSelectedProtocolForVersion(p);
                      setSelectedVersionIndex(3);
                    }}
                  />
                ))}
              </div>
            )}

            {/* CLASSIC LAYOUT FOR TEMPLATES */}
            {activeSubTab === 'templates' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(p => (
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
                ))}
              </div>
            )}

            {/* CLASSIC LAYOUT FOR DRAFTS */}
            {activeSubTab === 'drafts' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {drafts.map(p => (
                  <ProtocolCard 
                    key={p.id} 
                    p={p} 
                    onEdit={() => handleStartEdit(p, true)}
                    onDuplicate={() => handleDuplicate(p, true)}
                    onArchive={() => handleArchive(p.id, true)}
                    isDraft
                    onViewTimeline={() => {
                      setSelectedProtocolForVersion(p);
                      setSelectedVersionIndex(3);
                    }}
                  />
                ))}
              </div>
            )}

            {/* CURADORIA RUBI SUGGESTIONS */}
            {activeSubTab === 'rubi' && (
              <div className="max-w-3xl bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-8 text-left space-y-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#7BA7FF]/5 border border-[#7BA7FF]/20 rounded-xl flex items-center justify-center text-[#7BA7FF]">
                    <Brain size={18} />
                  </div>
                  <div>
                    <h3 className="text-md font-black text-slate-900 uppercase tracking-tight">Rubi Quality Advisor</h3>
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

            {/* COMMUNITY QUEUE & LIBRARY */}
            {activeSubTab === 'community' && (
              <div className="space-y-8 text-left">
                {/* Approval Queue */}
                <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-sm">
                  <div className="border-b border-slate-100 pb-4 mb-4">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Fila de Aprovação da Comunidade</h3>
                    <p className="text-xs text-slate-400 mt-1">Usuários Premium enviando planilhas de treinos para compartilhamento oficial.</p>
                  </div>

                  {communityProtocols.filter(c => c.status === 'pending').length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {communityProtocols.filter(c => c.status === 'pending').map(c => (
                        <div key={c.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-medium">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 uppercase text-xs">{c.name}</h4>
                              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Por {c.shared_by}</span>
                            </div>
                            <p className="text-slate-400 text-[11px] mt-1 max-w-xl">{c.description}</p>
                            <div className="flex gap-4 mt-1.5 text-[10px] text-slate-450 uppercase font-bold">
                              <span>Foco: {filterLabel(c.goal)}</span>
                              <span>•</span>
                              <span>Nível: {c.difficulty}</span>
                              <span>•</span>
                              <span>Semanas: {c.duration_weeks}</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveCommunity(c.id)}
                              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition"
                            >
                              Aprovar
                            </button>
                            <button
                              onClick={() => handleRejectCommunity(c.id)}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-250 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-wider transition"
                            >
                              Recusar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs font-black uppercase tracking-wider">
                      Fila vazia. Nenhuma solicitação pendente no momento.
                    </div>
                  )}
                </div>

                {/* Shared Catalog */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {communityProtocols.filter(c => c.status === 'approved').map(c => (
                    <div 
                      key={c.id}
                      className="bg-white/70 backdrop-blur-xl border border-white/40 p-6 rounded-3xl text-left flex flex-col justify-between h-[230px] shadow-sm relative group hover:border-[#7BA7FF] transition duration-200"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                            Comunidade
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">Por {c.shared_by}</span>
                        </div>
                        <h3 className="text-md font-black text-slate-900 uppercase tracking-tight mt-2 line-clamp-1">
                          {c.name}
                        </h3>
                        <p className="text-xs text-slate-400 leading-normal line-clamp-2">
                          {c.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-100/60 pt-4 mt-4 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>{c.duration_weeks} Semanas • {c.difficulty}</span>
                        <span className="text-[#7BA7FF] font-black bg-blue-50 border border-blue-105 px-2 py-0.5 rounded">Ativo</span>
                      </div>
                    </div>
                  ))}
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

      {/* VERSION TIMELINE MODAL */}
      {selectedProtocolForVersion && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-lg w-full text-left space-y-6 shadow-2xl border"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-black uppercase text-indigo-600 tracking-widest">Controle de Versão Histórico</span>
                <h3 className="text-md font-black text-slate-900 tracking-tight mt-1">{selectedProtocolForVersion.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedProtocolForVersion(null)}
                className="text-slate-400 hover:text-slate-950 text-xs font-black uppercase tracking-wider"
              >
                Fechar
              </button>
            </div>

            {/* Interactive Timeline Track */}
            <div className="py-4 border-y border-slate-100">
              <div className="flex items-center justify-between relative mt-2">
                <div className="absolute left-6 right-6 h-0.5 bg-slate-200 top-1/2 -translate-y-1/2 z-0" />
                
                {[1, 2, 3, 4].map((v, idx) => (
                  <button
                    key={v}
                    onClick={() => setSelectedVersionIndex(idx)}
                    className={`relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all ${
                      selectedVersionIndex === idx
                        ? 'bg-slate-950 text-white border-slate-950 scale-110 shadow'
                        : 'bg-white text-slate-400 border-slate-205 hover:border-slate-400'
                    }`}
                  >
                    v{v}
                  </button>
                ))}
              </div>
            </div>

            {/* Version Detail Panel */}
            <div className="p-4 bg-slate-50 rounded-2xl border space-y-3 font-medium text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Versão Ativa: <strong className="text-slate-700 font-bold">v{selectedVersionIndex + 1}</strong></span>
                <span>Data: <strong className="text-slate-700 font-bold">
                  {selectedVersionIndex === 0 ? '10/04/2026' : 
                   selectedVersionIndex === 1 ? '02/05/2026' :
                   selectedVersionIndex === 2 ? '25/05/2026' : '11/06/2026'}
                </strong></span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black block tracking-wider">Autor da Alteração</span>
                <p className="text-slate-800 font-bold text-xs mt-0.5">
                  {selectedVersionIndex === 0 ? 'Daniel Melo (Pro Trainer)' : 
                   selectedVersionIndex === 1 ? 'Dr. Lucas Torres (Performance)' :
                   selectedVersionIndex === 2 ? 'Ativação Automática Rubi AI' : 'Mariana Torres (Rubi Admin)'}
                </p>
              </div>

              <div className="pt-2 border-t text-slate-500">
                <span className="text-[10px] text-slate-400 uppercase font-black block tracking-wider mb-1">Resumo das Alterações</span>
                <p className="text-[11px] leading-relaxed">
                  {selectedVersionIndex === 0 && "Estruturação mecânica base e cadência controlada para estímulo primário."}
                  {selectedVersionIndex === 1 && "Ajuste fino de volume semanal para deltoides laterais e ombros anterior visando proporção simétrica."}
                  {selectedVersionIndex === 2 && "Otimização de fadiga residual e recuperação axial validada via IA."}
                  {selectedVersionIndex === 3 && "Lançamento oficial em alta definição, mídias integradas e prescrição final."}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedProtocolForVersion(null)}
                className="px-6 h-11 bg-slate-950 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition"
              >
                Concluir Visualização
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* SIMPLIFIED QUICK PUBLISH MODAL */}
      {isSimplifiedModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full text-left space-y-6 shadow-2xl border"
          >
            <div>
              <span className="text-[9px] font-black uppercase text-blue-500 tracking-widest">Publicação Premium Simplificada</span>
              <h3 className="text-md font-black text-slate-900 tracking-tight mt-1">Lançamento Direto na Biblioteca</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nome do Programa</label>
                <input 
                  type="text"
                  placeholder="Ex: Bikini Fitness Pro"
                  value={simpleName}
                  onChange={(e) => setSimpleName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#7BA7FF]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Categoria</label>
                  <select
                    value={simpleGoal}
                    onChange={(e: any) => setSimpleGoal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                  >
                    <option value="hypertrophy">Hipertrofia</option>
                    <option value="weight_loss">Emagrecimento</option>
                    <option value="strength">Força</option>
                    <option value="performance">Performance</option>
                    <option value="glutes">Glúteos</option>
                    <option value="recovery">Recuperação</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nível</label>
                  <select
                    value={simpleDifficulty}
                    onChange={(e: any) => setSimpleDifficulty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                  >
                    <option value="beginner">Iniciante</option>
                    <option value="intermediate">Intermediário</option>
                    <option value="advanced">Avançado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Duração (Semanas)</label>
                  <input 
                    type="number"
                    value={simpleDuration}
                    onChange={(e) => setSimpleDuration(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Capa (Imagem URL)</label>
                  <input 
                    type="text"
                    placeholder="https://images..."
                    value={simpleCoverImage}
                    onChange={(e) => setSimpleCoverImage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs font-black uppercase tracking-wider">
              <button
                onClick={() => setIsSimplifiedModalOpen(false)}
                className="px-5 h-11 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition"
              >
                Voltar
              </button>
              <button
                onClick={async () => {
                  if (!simpleName.trim()) {
                    alert("Por favor, digite o nome do protocolo.");
                    return;
                  }
                  const newProtocol: PremiumProtocol = {
                    id: 'simple-' + Date.now(),
                    name: simpleName,
                    description: `Programa de performance refinado pela inteligência Rubi focado em objetivos de nível ${simpleDifficulty}.`,
                    version: 1,
                    premium: true,
                    goal: simpleGoal,
                    difficulty: simpleDifficulty,
                    duration_weeks: simpleDuration,
                    frequency: 4,
                    created_by: 'admin',
                    athletes_count: 1,
                    rating: 5,
                    completion_rate: 90,
                    strength_increase_pct: 15,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    updated_by: 'Rubi Admin',
                    workouts: [
                      {
                        id: 'w-1',
                        name: 'Treino A',
                        exercises: []
                      }
                    ],
                    version_history: []
                  };
                  await premiumProtocolsApi.createOrUpdateProtocol(newProtocol);
                  await loadData();
                  setIsSimplifiedModalOpen(false);
                }}
                className="px-6 h-11 bg-slate-950 hover:bg-slate-850 text-white rounded-xl transition font-black tracking-widest uppercase text-[10px]"
              >
                Publicar Premium
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
  onViewTimeline?: () => void;
}

const ProtocolCard: React.FC<ProtocolCardProps> = ({ p, onEdit, onDuplicate, onArchive, isDraft, isPublic, onViewTimeline }) => {
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

  // Determine automatic smart premium badges safely
  const getSmartBadge = () => {
    if (!isDraft && !isPublic) {
      if (p.rating && p.rating >= 4.9) {
        return { label: '⭐ Destaque da Semana', class: 'bg-yellow-50 text-yellow-700 border-yellow-250' };
      }
      if (p.athletes_count && p.athletes_count > 8) {
        return { label: '⭐ Mais Copiado', class: 'bg-indigo-50 text-indigo-700 border-indigo-250' };
      }
      if (p.completion_rate && p.completion_rate >= 85) {
        return { label: '⭐ Mais Utilizado', class: 'bg-rose-50 text-rose-700 border-rose-250' };
      }
      return { label: '⭐ Recomendado Rubi', class: 'bg-blue-50 text-blue-700 border-blue-250' };
    }
    return null;
  };

  const smartBadge = getSmartBadge();

  return (
    <div 
      className="bg-white/70 backdrop-blur-xl border border-white/40 p-6 rounded-3xl text-left flex flex-col justify-between h-[245px] shadow-sm relative group select-none hover:border-slate-300 transition-all duration-200"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest border px-2.5 py-1 rounded-full ${getGoalTheme(p.goal)}`}>
              {getGoalLabel(p.goal)}
            </span>
            
            {smartBadge && (
              <span className={`inline-flex items-center text-[7.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${smartBadge.class}`}>
                {smartBadge.label}
              </span>
            )}
          </div>
          
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
                {onViewTimeline && (
                  <button 
                    onClick={() => { onViewTimeline(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Clock size={12} /> Ver Versões
                  </button>
                )}
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
        <div className="flex items-center gap-2">
          <span>{p.duration_weeks} Semanas</span>
          <span>•</span>
          <span>{totalExercises} Exercícios</span>
          {onViewTimeline && (
            <>
              <span>•</span>
              <button onClick={onViewTimeline} className="text-[#7BA7FF] hover:underline font-black">
                v{p.version || 4} History
              </button>
            </>
          )}
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
